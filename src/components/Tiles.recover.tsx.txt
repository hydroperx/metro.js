import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import assert from "assert";
import Color from "color";
import Draggable, { DraggableData } from "com.hydroper.reactdraggable";
import { TypedEventTarget } from "com.hydroper.typedeventtarget";
import getOffset from "getoffset";
import getRectangleOverlap from "rectangle-overlap";
import { CheckedIcon } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize } from "../utils/common";
import { randomHexLarge } from "../utils/random";
import { getRectHitSide } from "../utils/rect";

const margin = 0.6; // Margin between tiles
const group_margin = 3; // Margin between groups
const small_size = { width: 3.625, height: 3.625 };
const medium_size = { width: small_size.width*2 + margin, height: small_size.height*2 + margin };
const wide_size = { width: medium_size.width*2 + margin, height: medium_size.height };
const large_size = { width: wide_size.width, height: wide_size.width };

const tile_sizes = new Map<TileSize, { width: number, height: number }>([
    ["small", small_size],
    ["medium", medium_size],
    ["wide", wide_size],
    ["large", large_size],
]);

function get_tile_size(size: TileSize): { width: number, height: number } { return tile_sizes.get(size); }
function get_tile_width(size: TileSize): number { return get_tile_size(size).width; }
function get_tile_height(size: TileSize): number { return get_tile_size(size).height; }

// Viewport mouse up handler
let viewport_pointerUp: Function | null = null;
window.addEventListener("pointerup", () => {
    viewport_pointerUp?.();
});

/**
 * Represents a container of Metro tiles which are positioned anywhere.
 * May contain `Tile` and `TileGroup` children.
 */
export function Tiles(options: TilesOptions)
{
    assert(options.direction == "horizontal", "Vertical tiles are not implemented yet.");

    // Use theme
    const theme = useContext(ThemeContext);

    // Misc vars
    const {controller: tiles_controller, state: tiles_state } = options;

    // Refs
    const div_ref = useRef<HTMLDivElement | null>(null);

    // Open/close
    const open = options.open ?? true;
    const [forced_invisible, set_forced_invisible] = useState<boolean>(true);
    const [scale, set_scale] = useState<number>(open ? 0 : 1);

    // Rem
    const [rem, set_rem] = useState<number>(16);

    // Modes
    let selection_mode = false;
    let drag_n_drop_mode = false;

    // Measurements
    let orthogonal_side_length = 0;

    // Detect a mode change
    function mode_signal(params: { dragNDrop?: boolean, selection?: boolean }):void
    {
        if (params.dragNDrop)
        {
            drag_n_drop_mode = true;

            // Set data-drag-n-drop-mode="true" attribute to tiles
            for (const tile_btn of div_ref.current!.querySelectorAll(".Tile"))
                tile_btn.setAttribute("data-drag-n-drop-mode", "true");
        }
        else if (params.dragNDrop !== undefined)
        {
            drag_n_drop_mode = false;

            // Remove data-drag-n-drop-mode attribute from tiles
            for (const tile_btn of div_ref.current!.querySelectorAll(".Tile"))
                tile_btn.removeAttribute("data-drag-n-drop-mode");
        }

        if (params.selection)
        {
            selection_mode = true;

            // Set data-selection-mode="true" attribute to tiles
            for (const tile_btn of div_ref.current!.querySelectorAll(".Tile"))
                tile_btn.setAttribute("data-selection-mode", "true");
        }
        else if (params.selection !== undefined)
        {
            selection_mode = false;

            // Remove data-selection-mode attribute from tiles
            for (const tile_btn of div_ref.current!.querySelectorAll(".Tile"))
                tile_btn.removeAttribute("data-selection-mode");
        }
    }

    // CSS
    const serialized_styles = css `
        width: 100%;
        height: 100%;
        position: relative;
        opacity: ${forced_invisible ? 0 : scale};
        transform: scale(${scale});
        transition: opacity 0.3s ${open ? "ease-out" : "ease-in"}, transform 0.3s ${open ? "ease-out" : "ease-in"};

        &::-webkit-scrollbar {
            width: 12px;
            height: 12px;
            background: ${theme.colors.scrollBarTrack};
        }

        &::-webkit-scrollbar-thumb {
            background: ${theme.colors.scrollBarThumb};
            border-radius: 0;
        }
    `;

    // Re-arrange groups and tiles
    let rearrange_timeout = -1;
    function rearrange_delayed(rearrange_options: RearrangeOptions | undefined = undefined): void
    {
        if (rearrange_timeout !== -1)
        {
            window.clearTimeout(rearrange_timeout);
        }
        rearrange_timeout = window.setTimeout(() => {
            rearrange(rearrange_options);
        }, 10);
    }
    function rearrange(rearrange_options: RearrangeOptions | undefined = undefined): void
    {
        rearrange_timeout = -1;
        set_forced_invisible(false);

        // Organize groups (untracked groups without specified position will be the most last)
        const group_buttons: HTMLButtonElement[] = Array.from(div_ref.current!.querySelectorAll(".TileGroup")) as HTMLButtonElement[];

        // Initialize group states
        for (const group_button of group_buttons)
        {
            const id = group_button.getAttribute("data-id");
            let state = tiles_state.groups.get(id);
            if (!state)
            {
                let pos_str = group_button.getAttribute("data-position");
                let pos = pos_str !== null ? (pos_str == "" ? NaN : Number(pos_str)) : NaN;
                state = {
                    position: isNaN(pos) ? tiles_state.groups.size == 0 ? 0 : Math.max.apply(null, Array.from(tiles_state.groups.values()).map(g => g.position)) + 1 : pos,
                    label: group_button.getAttribute("data-label"),
                };
                tiles_state.groups.set(id, state);
            }
        }

        // Sort groups
        group_buttons.sort((a, b) => {
            const a_pos = tiles_state.groups.get(a.getAttribute("data-id")).position;
            const b_pos = tiles_state.groups.get(b.getAttribute("data-id")).position;

            return a_pos < b_pos ? -1 : a_pos > b_pos ? 1 : 0;
        });

        // Measurement layout
        const pixel_measures: TilesLayoutPixelMeasures = {
            margin: margin * rem,
            group_margin: group_margin * rem,
            small_size: { width: small_size.width * rem, height: small_size.height * rem },
            medium_size: { width: medium_size.width * rem, height: medium_size.height * rem },
            wide_size: { width: wide_size.width * rem, height: wide_size.height * rem },
            large_size: { width: large_size.width * rem, height: large_size.height * rem },
        };
        const layout: TilesLayout = options.direction == "horizontal" ?
            new TilesHorizontalLayout(orthogonal_side_length, (options.startMargin ?? 3) * rem, pixel_measures, rem) :
            new TilesVerticalLayout(orthogonal_side_length, (options.startMargin ?? 1) * rem, pixel_measures, rem);

        // Retrieve tile buttons
        const tiles = Array.from(div_ref.current!.querySelectorAll(".Tile")) as HTMLButtonElement[];

        // Shifting parameters
        const shift_params = rearrange_options?.shift ?
            {
                to_shift: rearrange_options.to_shift,
                place_taker: rearrange_options.place_taker,
                place_side: rearrange_options.place_side,
            } : null;

        // Restore parameters
        const restore_params = rearrange_options?.restore ?
            {
                except: rearrange_options.restore_except,
            } : null;

        // Grid snap parameters
        const grid_snap_params = rearrange_options?.grid_snap ?
            {
                tile: rearrange_options.grid_snap_tile,
            } : null;
        let grid_snap_tile_button: HTMLButtonElement | null = null,
            grid_snap_offset: { x: number, y: number } = null;
        if (grid_snap_params)
        {
            grid_snap_tile_button = tiles.find(t => t.getAttribute("data-id") == grid_snap_params.tile);
            grid_snap_offset = getOffset(grid_snap_tile_button, div_ref.current!);
        }

        // Position labels and tiles
        for (const group_button of group_buttons)
        {
            const group_id = group_button.getAttribute("data-id");

            // Determine whether to shift tiles at this group
            let shifting = false;
            if (shift_params && tiles_state.tiles.has(shift_params.to_shift) &&
                tiles_state.tiles.get(shift_params.to_shift).group == group_id)
            {
                shifting = true;
            }

            const this_group_tiles: HTMLButtonElement[] = [];

            // Position and size tiles
            for (const tile of tiles)
            {
                const tile_id = tile.getAttribute("data-id");
                let tile_state = tiles_state.tiles.get(tile_id);
                const tile_group_id = tile_state?.group ?? tile.getAttribute("data-group");
                if (tile_group_id != group_id)
                {
                    continue;
                }

                this_group_tiles.push(tile);

                // Update some attributes of the tile
                if (tile_state)
                    tile.setAttribute("data-horizontal", tile_state.horizontal.toString()),
                    tile.setAttribute("data-vertical", tile_state.vertical.toString());

                // Update size
                if (tile_state && tile.getAttribute("data-size") != tile_state.size)
                {
                    tiles_controller.setSize(tile_id, tile_state.size);
                }

                // Position tile
                if (tile.getAttribute("data-dragging") != "true")
                {
                    const h    = tile_state?.horizontal ?? Number(tile.getAttribute("data-horizontal"))
                        , v    = tile_state?.vertical ?? Number(tile.getAttribute("data-vertical"))
                        , size = tile_state?.size ?? tile.getAttribute("data-size") as TileSize;
                    const { x, y, new_horizontal, new_vertical } = layout.putTile(size, h, v);
                    tile.style.translate = `${x / rem}rem ${y / rem}rem`;
                    tile.setAttribute("data-horizontal", new_horizontal.toString());
                    tile.setAttribute("data-vertical", new_vertical.toString());
                    tile.setAttribute("data-group", tile_group_id);

                    if (!tile_state)
                    {
                        tile_state = { group: "", size: "small", horizontal: 0, vertical: 0 };
                        tiles_state.tiles.set(tile_id, tile_state);
                    }
                    tile_state.group = tile_group_id;
                    tile_state.size = size;
                    tile_state.horizontal = new_horizontal;
                    tile_state.vertical = new_vertical;
                }
            }

            // Shift tiles
            if (shifting)
            {
                const place_taker_button = tiles.find(t => t.getAttribute("data-id") == shift_params.place_taker);
                layout.shift(
                    this_group_tiles,
                    tiles_state,
                    shift_params.to_shift,
                    shift_params.place_taker,
                    place_taker_button,
                    shift_params.place_side
                );
            }

            // Grid snapping
            if (grid_snap_offset)
            {
                const horizontal: number = layout.pageXToHorizontal(grid_snap_offset.x)
                    , vertical: number = layout.pageYToVertical(grid_snap_offset.y);
                if (horizontal !== -1 && vertical !== -1)
                {
                    const state = tiles_state.tiles.get(grid_snap_params.tile);
                    if (layout.rows.sizeFreeAt(horizontal, vertical, state.size))
                    {
                        const btn = grid_snap_tile_button;
                        const { x, y, new_horizontal, new_vertical } = layout.putTile(state.size, horizontal, vertical);
                        btn.style.translate = `${x / rem}rem ${y / rem}rem`;
                        btn.setAttribute("data-group", group_id);
                        btn.setAttribute("data-horizontal", new_horizontal.toString());
                        btn.setAttribute("data-vertical", new_vertical.toString());

                        state.group = group_id;
                        state.horizontal = new_horizontal;
                        state.vertical = new_vertical;
                    }
                    grid_snap_offset = null;
                }
            }

            // Position and size group label
            const { x, y, width } = layout.putLabel();
            group_button.style.left = `${x / rem}rem`;
            group_button.style.top = `${y / rem}rem`;
            group_button.style.width = `${width / rem}rem`;

            const group_state = tiles_state.groups.get(group_id);

            // Enter label text
            group_button.innerText = group_state.label;
        }
    }

    // Observe rem
    useEffect(() => {
        const rem_observer = new RemObserver(value => {
            set_rem(value);
        });
        return () => {
            rem_observer.cleanup();
        };
    }, []);

    // Open/close transition
    let transition_timeout = -1;
    useEffect(() => {
        if (transition_timeout !== -1)
        {
            window.clearTimeout(transition_timeout);
        }
        if (open)
        {
            transition_timeout = setTimeout(() => {
                set_scale(1);
            }, 300);
        }
        else
        {
            transition_timeout = setTimeout(() => {
                set_scale(0);
            }, 300);
        }
    }, [open]);

    useEffect(() => {
        const div = div_ref.current!;

        // Initial orthogonal side length
        const r = div.getBoundingClientRect();
        orthogonal_side_length = options.direction == "horizontal" ? r.height : r.width;

        const resizeObserver = new ResizeObserver(() => {
            // Update orthogonal side length
            const r = div.getBoundingClientRect();
            orthogonal_side_length = options.direction == "horizontal" ? r.height : r.width;

            // Rearrange
            rearrange_delayed();
        });

        resizeObserver.observe(div);

        return () => {
            // Dispose resize observer
            resizeObserver.disconnect();

            // Dipose listeners on TilesController
            tiles_controller.removeEventListener("getChecked", tiles_controller_onGetChecked);
        };
    }, []);

    // Handle request to get checked tiles
    function tiles_controller_onGetChecked(e: CustomEvent<{ requestId: string }>)
    {
        const div = div_ref.current;
        let tiles: string[] = [];
        if (div)
        {
            tiles = Array.from(div.querySelectorAll(".Tile"))
                .filter(div => div.getAttribute("data-checked") == "true")
                .map(div => div.getAttribute("data-id"));
        }
        tiles_controller.dispatchEvent(new CustomEvent("getCheckedResult", {
            detail: {
                requestId: e.detail.requestId,
                tiles,
            },
        }));
    }
    tiles_controller.addEventListener("getChecked", tiles_controller_onGetChecked);

    return (
        <div className="Tiles" css={serialized_styles} ref={div_ref} style={options.style}>
            <TilesControllerContext.Provider value={tiles_controller}>
                <TilesStateContext.Provider value={tiles_state}>
                    <ModeSignalContext.Provider value={mode_signal}>
                        <RearrangeContext.Provider value={rearrange_delayed}>
                            <RearrangeImmediateContext.Provider value={rearrange}>
                                {options.children}
                            </RearrangeImmediateContext.Provider>
                        </RearrangeContext.Provider>
                    </ModeSignalContext.Provider>
                </TilesStateContext.Provider>
            </TilesControllerContext.Provider>
        </div>
    );
}

export type TilesOptions = {
    /**
     * The state that this container will use for loading and saving
     * positions and labels.
     */
    state: TilesState,

    /**
     * The tile controller allows controlling which tiles are checked (selected)
     * and their sizes.
     */
    controller: TilesController,
 
    /**
     * If `horizontal`, `height` must be specified;
     * otherwise, `width` must be specified.
     */
    direction: "horizontal" | "vertical",

    /**
     * Starting margin of the side orthogonal to the direction used
     * for the tiles (**not** the margin around the container).
     */
    startMargin?: number,

    /**
     * Whether to display open or close transition.
     * Displays a scale/opacity transition when visibility changes.
     *
     * @default true
     */
    open?: boolean,

    children?: React.ReactNode,
    style?: React.CSSProperties,
};

/**
 * The state of a `Tiles` component, containing positions and labels.
 */
export class TilesState
{
    groups: Map<string, { label: string, position: number }> = new Map();
    tiles: Map<string, { group: string, size: TileSize, horizontal: number, vertical: number }> = new Map();

    /**
     * Constructs `TilesState` from JSON. The `object` argument
     * may be a JSON serialized string or a plain object.
     */
    static fromJSON(object: any): TilesState
    {
        object = typeof object === "string" ? JSON.parse(object) : object;
        const r = new TilesState();
        for (const id in object.groups)
        {
            const o1 = object.groups[id];
            r.groups.set(id, {
                label: String(o1.label),
                position: Number(o1.position),
            });
        }
        for (const id in object.tiles)
        {
            const o1 = object.tiles[id];
            r.tiles.set(id, {
                group: String(o1.group),
                size: String(o1.size) as TileSize,
                horizontal: Number(o1.horizontal),
                vertical: Number(o1.vertical),
            });
        }
        return r;
    }

    /**
     * Returns a plain object (**not** a string).
     */
    toJSON(): any
    {
        const groups: any = {};
        for (const [id, g] of this.groups)
        {
            groups[id] = {
                label: g.label,
                position: g.position,
            };
        }
        const tiles: any = {};
        for (const [id, t] of this.tiles)
        {
            tiles[id] = {
                group: t.group,
                size: t.size,
                horizontal: t.horizontal,
                vertical: t.vertical,
            };
        }
        return {
            groups,
            tiles,
        };
    }
    
    clear(): void
    {
        this.groups.clear();
        this.tiles.clear();
    }

    set(state: TilesState): void
    {
        for (const [id, group] of state.groups)
        {
            this.groups.set(id, {
                label: group.label,
                position: group.position,
            });
        }
        for (const [id, tile] of state.tiles)
        {
            this.tiles.set(id, {
                group: tile.group,
                size: tile.size,
                horizontal: tile.horizontal,
                vertical: tile.vertical,
            });
        }
    }

    clone(): TilesState
    {
        const r = new TilesState();
        r.set(this);
        return r;
    }
}

const TilesControllerContext = createContext<TilesController | null>(null);
const TilesStateContext = createContext<TilesState | null>(null);
const RearrangeContext = createContext<RearrangeFunction | null>(null);
const RearrangeImmediateContext = createContext<RearrangeFunction | null>(null);
const ModeSignalContext = createContext<((params: { dragNDrop?: boolean, selection?: boolean }) => void) | null>(null);

type RearrangeFunction = (options?: RearrangeOptions) => void;
type RearrangeOptions = {
    restore?: boolean,
    /** Tile ID. */
    restore_except?: string,

    shift?: boolean,
    /** Tile ID. */
    to_shift?: string,
    /** Tile ID. */
    place_taker?: string,
    place_side?: "left" | "right" | "top" | "bottom",

    grid_snap?: boolean,
    /** Tile ID. */
    grid_snap_tile?: string,
};

/**
 * A tile group consisting of a label.
 */
export function TileGroup(options: TileGroupOptions)
{
    // Theme
    const theme = useContext(ThemeContext);

    // Re-arrange function
    const rearrange = useContext(RearrangeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Rename
    const rename = options.rename ?? true;

    // CSS
    const serialized_styles = css `
        position: absolute;
        font-family: ${fontFamily};
        font-weight: lighter;
        font-size: 1.2rem;
        opacity: 0.6;
        border: none;
        border-bottom: 0.25rem solid rgba(0,0,0,0);
        color: ${theme.colors.foreground};
        outline: none;
        background: none;
        overflow: hidden;
        min-height: 1.3rem;
        text-align: ${localeDir == "ltr" ? "left" : "right"};

        &:hover:not(:disasbled) {
            border-bottom: 0.25rem solid ${Color(theme.colors.foreground).alpha(0.4).toString()};
        }

        &:focus:not(:disabled) {
            outline: 0.05rem dotted ${theme.colors.focusDashes};
        }
    `;

    // Re-arrange
    useEffect(() =>
    {
        rearrange();
        return () => {
        };
    });

    return (
        <>
            <button
                className="TileGroup"
                css={serialized_styles}
                data-id={options.id}
                data-label={options.label ?? ""}
                data-position={options.position}>
            </button>
        </>
    );
}

export type TileGroupOptions = {
    /**
     * Group ID, used for restoring positions.
     */
    id: string,

    /**
     * Default label of the `TileGroup`.
     */
    label?: string,

    /**
     * Default zero-based position in group units.
     */
    position: number,

    /**
     * Whether to allow renaming the group label or not.
     *
     * @default true
     */
    rename?: boolean,
};

/**
 * Represents a Metro tile. Must be directly nested inside a `TileGroup` container.
 * 
 * Note that positions are given in small tile units.
 */
export function Tile(options: TileOptions)
{
    // Theme
    const theme = useContext(ThemeContext);
    
    // Signals
    const tiles_controller = useContext(TilesControllerContext);
    const mode_signal = useContext(ModeSignalContext);

    // Super state
    const tiles_state = useContext(TilesStateContext);

    // Re-arrange function
    const rearrange = useContext(RearrangeContext);
    const rearrange_immediate = useContext(RearrangeImmediateContext);

    // Elements
    const button_ref = useRef<HTMLButtonElement | null>(null);
    const tiles_div_ref = useRef<HTMLDivElement | null>(null);

    // Checked
    const [checked, set_checked] = useState<boolean>(false);

    // Size
    const [size, set_size] = useState<TileSize>(options.size);

    // "rem" unit size
    const [rem, set_rem] = useState<number>();

    // CSS
    const [rotate_3d, set_rotate_3d] = useState<string>("rotate3d(0)");
    const tile_color = options.color ?? theme.colors.primary;
    const tile_color_b1 = Color(tile_color).lighten(0.15).hex().toString();
    const tile_color_b2 = Color(tile_color).lighten(0.23).hex().toString();
    const serialized_styles = css `
        position: absolute;
        overflow: hidden;
        width: ${get_tile_width(size)}rem;
        height: ${get_tile_height(size)}rem;
        outline: 0.11rem solid ${Color(theme.colors.primary).alpha(0.6).alpha(0.3).toString()};
        background: linear-gradient(90deg, ${tile_color} 0%, ${tile_color_b1} 100%);
        border: none;
        font-family: ${fontFamily};
        font-size: ${fontSize};
        color: ${theme.colors.foreground};
        transition: opacity 0.2s;
        transform-style: preserve-3d;

        &[data-selection-mode="true"] {
            opacity: 0.7;
        }

        &:not([data-dragging="true"]) {
            transition: opacity 0.2s, transform 0.2s ease-out, scale 0.2s ease-out, translate 0.2s ease-out;
        }

        &[data-drag-n-drop-mode="true"] {
            scale: 0.8;
        }

        &:not([data-dragging="true"]),
        &[data-drag-n-drop-mode="true"]:not([data-dragging="true"]) {
            transform: ${rotate_3d} !important;
        }

        &[data-dragging="true"] {
            opacity: 0.6;
        }

        &:hover:not(:disabled), &:focus:not(:disabled) {
            outline: 0.17rem solid ${Color(theme.colors.primary).alpha(0.6).toString()};
            background: linear-gradient(90deg, ${tile_color_b1} 0%, ${tile_color_b2} %100);
        }

        &:disabled {
            opacity: 0.5;
        }

        & .Tile-checked-tri {
            position: absolute;
            right: -7rem;
            top: -7rem;
            padding: 0.5rem;
            width: 9rem;
            height: 9rem;
            background: ${theme.colors.primary};
            color: ${theme.colors.primaryForeground};
            transform: rotate(45deg);
            visibility: hidden;
        }

        &[data-checked="true"] .Tile-checked-tri {
            visibility: visible;
        }

        & .Tile-checked-icon {
            transform: rotate(-45deg) translate(-5.4rem, 5.4rem);
        }
    `;

    // Handle pointer down
    function button_onPointerDown(e: PointerEvent): void
    {
        viewport_pointerUp = local_viewport_pointerUp;

        // Slightly rotate tile depending on where the click occurred.
        const deg = 5;
        const rect = button_ref.current!.getBoundingClientRect();
        const x = e.clientX, y = e.clientY;
        if (x < rect.left + rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            set_rotate_3d(`perspective(${get_tile_width(size)}rem) rotate3d(0, -1, 0, ${deg}deg)`);
        else if (x > rect.right - rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            set_rotate_3d(`perspective(${get_tile_width(size)}rem) rotate3d(0, 1, 0, ${deg}deg)`);
        else if (y < rect.top + rect.height / 2)
            set_rotate_3d(`perspective(${get_tile_width(size)}rem) rotate3d(1, 0, 0, ${deg}deg)`);
        else
            set_rotate_3d(`perspective(${get_tile_width(size)}rem) rotate3d(-1, 0, 0, ${deg}deg)`);

        button_ref.current.style.transform = rotate_3d;
    }

    // Handle pointer up
    function local_viewport_pointerUp(): void
    {
        viewport_pointerUp = null;
        set_rotate_3d("rotate3d(0)");
        button_ref.current.style.transform = rotate_3d;
    }

    useEffect(() => {
        const remObserver = new RemObserver(value => {
            set_rem(value);
        });
        return () => {
            remObserver.cleanup();

            tiles_controller.removeEventListener("setSize", tiles_controller_onSetSize);
            tiles_controller.removeEventListener("setChecked", tiles_controller_onSetChecked);
        };
    }, []);

    useEffect(() =>
    {
        rearrange();
        return () => {
            rearrange();
        };
    }, []);

    // Get Tiles div
    useEffect(() => {
        const tiles_div = button_ref.current!.parentElement;
        assert(!!tiles_div && tiles_div.classList.contains("Tiles"), "Tile's parent must be a Tiles.");
        tiles_div_ref.current = tiles_div as HTMLDivElement;
    });

    // Drag vars
    let drag_start: [number, number] | null = null;
    let previous_tiles_state: TilesState | null = null;
    let active_tiles_hit = false;

    // Drag start
    function on_drag_start(data: DraggableData)
    {
        if (button_ref.current!.getAttribute("data-drag-n-drop-mode") == "true")
        {
            return;
        }
        drag_start = [data.x, data.y];
        previous_tiles_state = tiles_state.clone();
        button_ref.current!.style.transform = "";
    }

    // Drag move
    function on_drag_move(data: DraggableData)
    {
        if (drag_start === null)
        {
            button_ref.current!.style.inset = "";
            return;
        }

        const diff_x = drag_start[0] - data.x
            , diff_y = drag_start[1] - data.y;
        if (diff_x > -5 && diff_x <= 5 && diff_y > -5 && diff_y <= 5)
        {
            button_ref.current.style.transform = rotate_3d;
            return;
        }
        set_dragging(true);
        mode_signal({ dragNDrop: true });

        // Shift tiles as needed.
        const hit = hits_another_tile();
        if (hit)
        {
            rearrange_immediate({ shift: true, to_shift: hit.tile, place_taker: options.id, place_side: hit.side});
            active_tiles_hit = true;
        }
        else
        {
            tiles_state.set(previous_tiles_state);
            rearrange_immediate({ restore: true, restore_except: options.id });
            active_tiles_hit = false;
        }
    }

    // Drag stop
    function on_drag_stop(data: DraggableData): void
    {
        if (drag_start === null)
        {
            button_ref.current!.style.inset = "";
            return;
        }

        drag_start = null;
        set_dragging(false);
        mode_signal({ dragNDrop: false });

        // Move tile properly
        if (active_tiles_hit)
        {
            button_ref.current!.style.inset = "";
            rearrange_immediate();
        }
        else
        {
            // Snap tile to free space.
            rearrange_immediate({ grid_snap: true, grid_snap_tile: options.id });

            button_ref.current!.style.inset = "";
        }

        // Update state
        update_state();
    }

    function set_dragging(value: boolean): void
    {
        button_ref.current!.setAttribute("data-dragging", value.toString());
    }

    function hits_another_tile(): { tile: string, side: "left" | "right" | "top" | "bottom" } | null
    {
        const tiles = Array.from(tiles_div_ref.current.querySelectorAll(".Tile")) as HTMLButtonElement[];
        const i = tiles.indexOf(button_ref.current!);
        if (i == -1) return null;
        tiles.splice(i, 1);
        const r = button_ref.current!.getBoundingClientRect();
        for (const tile of tiles)
        {
            const rect = tile.getBoundingClientRect();
            const place_side = getRectHitSide(rect, r);
            if (place_side === null)
            {
                continue;
            }

            // Only hits if a large enough area overlaps.
            const overlap = getRectangleOverlap(rect, r);
            if (overlap && overlap.area < ((small_size.width * rem) * 1.5))
            {
                continue;
            }

            if (overlap) return { tile: tile.getAttribute("data-id"), side: place_side };
        }
        return null;
    }

    // Handle context menu
    function on_context_menu(): void
    {
        tiles_controller.checked().then(list => {
            const checked = !list.includes(options.id);
            set_checked(checked);
            if (checked || list.length > 1)
                mode_signal({ selection: true });
            else if (!checked && list.length == 1)
                mode_signal({ selection: false });
            options.contextMenu?.(options.id);
        });
    }

    // Handle checking tiles through TilesController
    function tiles_controller_onSetChecked(e: CustomEvent<{ id: string, value: boolean }>)
    {
        if (e.detail.id !== options.id) return;
        tiles_controller.checked().then(list => {
            const checked = e.detail.value;
            set_checked(checked);
            if (checked || list.length > 0)
                mode_signal({ selection: true });
            else if (!checked && (list.length == 0 || (list.length == 1 && list.includes(options.id))))
                mode_signal({ selection: false });
        });
    }
    tiles_controller.addEventListener("setChecked", tiles_controller_onSetChecked);

    // Handle setting size of tiles through TilesController
    function tiles_controller_onSetSize(e: CustomEvent<{ id: string, value: TileSize }>)
    {
        if (e.detail.id !== options.id) return;
        set_size(e.detail.value);
        button_ref.current!.setAttribute("data-size", e.detail.value);
        update_state();
        rearrange();
    }
    tiles_controller.addEventListener("setSize", tiles_controller_onSetSize);

    // Keep state up-to-date
    function update_state(): void
    {
        const button = button_ref.current!;
        let t = tiles_state.tiles.get(options.id);
        if (!t)
        {
            t = {
                group: "",
                size: "wide",
                horizontal: 0,
                vertical: 0,
            };
            tiles_state.tiles.set(options.id, t);
        }
        t.group = button.getAttribute("data-group");
        t.size = button.getAttribute("data-size") as TileSize;
        t.horizontal = Number(button.getAttribute("data-horizontal"));
        t.vertical = Number(button.getAttribute("data-vertical"));
    }

    return (
        <Draggable
            element={button_ref}
            dragStart={on_drag_start}
            dragMove={on_drag_move}
            dragStop={on_drag_stop}
            rem={rem}>

            <button
                ref={button_ref}
                className="Tile"
                css={serialized_styles}
                data-id={options.id}
                data-group={options.group}
                data-size={size}
                data-horizontal={options.horizontal ?? 0}
                data-vertical={options.vertical ?? 0}
                data-dragging="false"
                data-checked={checked}
                onPointerDown={ options.disabled ? undefined : button_onPointerDown as any }
                onClick={ options.disabled ? undefined : e => { options.click?.(options.id) } }
                onContextMenu={ options.disabled ? undefined : e => { on_context_menu() }}
                disabled={options.disabled}>

                {options.children}

                <div className="Tile-checked-tri">
                    <CheckedIcon className="Tile-checked-icon" size={5}/>
                </div>
            </button>
        </Draggable>
    );
}

export type TileOptions = {
    /**
     * Tile ID, used for restoring position.
     */
    id: string,

    /**
     * Tile color.
     */
    color?: string,

    /**
     * Tile size.
     */
    size: TileSize,

    disabled?: boolean,

    /**
     * Default group by ID.
     */
    group: string,

    /**
     * Default horizontal position in small tile units.
     */
    horizontal?: number,

    /**
     * Default vertical position in small tile units.
     */
    vertical?: number,

    /**
     * Click event.
     */
    click?: (id: string) => void,

    /**
     * Context menu event.
     */
    contextMenu?: (id: string) => void,

    children?: React.ReactNode,
};

/**
 * Tile size.
 */
export type TileSize = "small" | "medium" | "wide" | "large";

/**
 * Provides control over tiles in a `Tiles` container.
 */
export class TilesController extends (EventTarget as TypedEventTarget<{
    getChecked: CustomEvent<{ requestId: string }>;
    getCheckedResult: CustomEvent<{ requestId: string, tiles: string[] }>;
    setChecked: CustomEvent<{ id: string, value: boolean }>;
    setSize: CustomEvent<{ id: string, value: TileSize }>;
}>) {
    /**
     * Gets the list of checked tiles.
     */
    checked(): Promise<string[]>
    {
        return new Promise((resolve, _) => {
            const requestId = randomHexLarge();
            const listener = (e: CustomEvent<{ requestId: string, tiles: string[] }>) => {
                if (e.detail.requestId !== requestId) return;
                this.removeEventListener("getCheckedResult", listener)
                resolve(e.detail.tiles);
            };
            this.addEventListener("getCheckedResult", listener);
            this.dispatchEvent(new CustomEvent("getChecked", {
                detail: {
                    requestId,
                },
            }));
        });
    }

    /**
     * Sets whether a tile is checked or not.
     */
    setChecked(id: string, value: boolean): void
    {
        this.dispatchEvent(new CustomEvent("setChecked", {
            detail: { id, value },
        }));
    }

    /**
     * Sets the size of a tile.
     */
    setSize(id: string, value: TileSize): void
    {
        this.dispatchEvent(new CustomEvent("setSize", {
            detail: { id, value },
        }));
    }
}

abstract class TilesLayout
{
    rows: TilesLayoutTileRows;
    private tile_sizes: Map<TileSize, { width: number, height: number }>;

    constructor(protected pixel_measures: TilesLayoutPixelMeasures, protected rem: number)
    {
        this.tile_sizes = new Map<TileSize, { width: number, height: number }>([
            ["small", small_size],
            ["medium", medium_size],
            ["wide", wide_size],
            ["large", large_size],
        ]);
    }

    protected get_tile_size(size: TileSize): { width: number, height: number } { return this.tile_sizes.get(size); }
    protected get_tile_width(size: TileSize): number { return this.get_tile_size(size).width; }
    protected get_tile_height(size: TileSize): number { return this.get_tile_size(size).height; }

    abstract putTile(size: TileSize, horizontal: number, vertical: number): { x: number, y: number, new_horizontal: number, new_vertical: number };

    /**
     * Puts a label after all tiles of a group have been positioned,
     * moving to the next group.
     */
    abstract putLabel(): { x: number, y: number, width: number };

    abstract shift(
        tiles: HTMLButtonElement[],
        tiles_state: TilesState,
        to_shift: string,
        place_taker: string,
        place_taker_button: HTMLButtonElement,
        place_side: "left" | "top" | "right" | "bottom"
    ): void;

    abstract pageXToHorizontal(x: number): number;
    abstract pageYToVertical(y: number): number;
}

class TilesHorizontalLayout extends TilesLayout
{
    private group_x: number = 0;

    constructor(private container_height: number, private start_margin: number, pixel_measures: TilesLayoutPixelMeasures, rem: number)
    {
        super(pixel_measures, rem);

        this.rows = new TilesLayoutTileRows(Infinity, 6);
    }

    override putTile(size: TileSize, horizontal: number, vertical: number): { x: number, y: number, new_horizontal: number, new_vertical: number }
    {
        // Measurements
        const { margin, small_size } = this.pixel_measures;
        const { start_margin } = this;

        const { max_height } = this.rows;

        for (;;)
        {
            for (; vertical < max_height; vertical++)
            {
                if (this.rows.sizeFreeAt(horizontal, vertical, size))
                {
                    this.rows.fillSize(horizontal, vertical, size);
                    return {
                        x: this.group_x + (horizontal * small_size.width) + (horizontal * margin),
                        y: (vertical * small_size.height) + (vertical * margin) + start_margin,
                        new_horizontal: horizontal, new_vertical: vertical
                    };
                }
            }
            vertical = 0;
            horizontal++;
            assert(horizontal <= 0x7FFFFF, "Horizontal tiles too large.");
        }
    }

    override putLabel(): { x: number, y: number, width: number }
    {
        // Measurements
        const { margin, group_margin, small_size } = this.pixel_measures;

        // Result vars
        const this_group_x = this.group_x;
        const this_group_y = this.start_margin / 3;
        const width = this.rows.width == 0 ? 0 : (this.rows.width * small_size.width) + ((this.rows.width - 1) * margin);

        // Move to the next group
        this.group_x += width + group_margin;
        this.rows = new TilesLayoutTileRows(Infinity, 6);

        // Result
        return { x: this_group_x, y: this_group_y, width };
    }

    override shift(
        tiles: HTMLButtonElement[],
        tiles_state: TilesState,
        to_shift: string,
        place_taker: string,
        place_taker_button: HTMLButtonElement,
        place_side: "left" | "top" | "right" | "bottom"
    ): void
    {
        const shifting_tile_button = tiles.find(t => t.getAttribute("data-id") == to_shift);
        if (!shifting_tile_button) return;

        // Variable used to facilitate manipulating tile positions.
        const full_pos = new FullTilesPositionMap(
            this.rows,
            tiles,
            tiles_state,
            this.rem,
            this.group_x,
            this.start_margin,
            "horizontal");
        full_pos.contributeTile(place_taker_button, tiles_state);

        // Make sure to insert place_taker into the group that
        // the tile to be shifted is part from.
        const place_taker_state = tiles_state.tiles.get(place_taker);
        place_taker_state.group = shifting_tile_button.getAttribute("data-group");
        place_taker_button.setAttribute("data-group", place_taker_state.group);

        // Misc vars
        const place_taker_w = get_size_width(place_taker_state.size);
        const place_taker_h = get_size_height(place_taker_state.size);
        const to_shift_state = tiles_state.tiles.get(to_shift);
        const { width: to_shift_w, height: to_shift_h } = full_pos.tiles.get(to_shift);

        switch (place_side)
        {
            case "left":
            case "right":
            {
                // Move tile to either left or right if there is
                // space available.
                let shift_to: "left" | "right" | null = null;
                let left_available = false, right_available = false;
                if (!(place_taker_w > to_shift_w || place_taker_h > to_shift_h))
                {
                    if (
                        this.rows.sizeFreeAt(to_shift_state.horizontal + place_taker_w, to_shift_state.vertical, to_shift_state.size) &&
                        to_shift_state.horizontal + place_taker_w + to_shift_w < this.rows.width
                    ) {
                        right_available = true;
                    }
                    if (this.rows.sizeFreeAt(to_shift_state.horizontal - to_shift_w, to_shift_state.vertical, to_shift_state.size))
                    {
                        left_available = true;
                    }
                }

                if (place_side == "left")
                    shift_to = right_available ? "right" : null;
                else shift_to = left_available ? "left" : null;

                if (shift_to == "left")
                {
                    // shift tile to left
                    const place_taker_new_horizontal = to_shift_state.horizontal;
                    this.rows.clearSize(to_shift_state.horizontal, to_shift_state.vertical, to_shift_state.size);
                    this.rows.fillSize(to_shift_state.horizontal - to_shift_w, to_shift_state.vertical, to_shift_state.size);
                    full_pos.setPosition(to_shift, to_shift_state.horizontal - to_shift_w, to_shift_state.vertical);
                    full_pos.setPosition(place_taker, place_taker_new_horizontal, to_shift_state.vertical);
                }
                else if (shift_to == "right")
                {
                    // shift tile to right
                    const place_taker_new_horizontal = to_shift_state.horizontal;
                    this.rows.clearSize(to_shift_state.horizontal, to_shift_state.vertical, to_shift_state.size);
                    this.rows.fillSize(to_shift_state.horizontal + place_taker_w, to_shift_state.vertical, to_shift_state.size);
                    full_pos.setPosition(to_shift, to_shift_state.horizontal + place_taker_w, to_shift_state.vertical);
                    full_pos.setPosition(place_taker, place_taker_new_horizontal, to_shift_state.vertical);
                }

                break;
            }
            case "top":
            {
                // shift tiles to bottom recursively.
                let x = to_shift_state.horizontal,
                    y = to_shift_state.vertical;
                if (y + place_taker_h >= this.rows.max_height)
                {
                    return;
                }
                full_pos.setPosition(place_taker, x, y);

                // Set previously taken size to that of place_taker
                const prev_taken_h = place_taker_h;

                this.shift_bottom(
                    to_shift,
                    tiles_state,
                    prev_taken_h,
                    full_pos,
                    [place_taker]
                );
                break;
            }
            case "bottom":
            {
                // Ignore bottom-to-top shift for now.
                //
                // in case it is implemented in the future:
                //
                // detection: here it may be impossible to shift to top
                // in circumstances where there is no free space
                // (consequently the take placer may also not take any space).
                break;
            }
        }
    }

    /**
     * @param t1 Tile to shift.
     * @param prev_taken_h Previously taken height
     */
    private shift_bottom(
        t1: string,
        tiles_state: TilesState,
        prev_taken_h: number,
        full_pos: FullTilesPositionMap,
        prev: string[]
    ): void {

        // vars
        const t1_s = tiles_state.tiles.get(t1);
        const { width: t1_w, height: t1_h } = full_pos.tiles.get(t1);

        // shift t1 (x, y)
        let t1_new_x = t1_s.horizontal,
            t1_new_y = t1_s.vertical + prev_taken_h;

        if (!this.rows.sizeFreeAt(t1_new_x, t1_new_y, t1_s.size))
        {
            if (t1_new_y + t1_h >= this.rows.max_height)
            {
                t1_new_x += t1_w;
                t1_new_y = 0;
            }
            if (!this.rows.sizeFreeAt(t1_new_x, t1_new_y, t1_s.size))
            {
                // find the next tile(s) to shift bottom.
                // here it may be like a group of small tiles
                // to shift together, or one large tile.
                // (do not look for tiles that are being actively dragged or
                // tiles that are being shifted already.)
                const next_tiles: string[] = [];
                for (const [tile, tile_p] of full_pos.tiles)
                {
                    const overlap = getRectangleOverlap(
                        { x: t1_new_x, y: t1_new_y, width: t1_w, height: t1_h },
                        { x: tile_p.horizontal, y: tile_p.vertical, width: tile_p.width, height: tile_p.height }
                    );
                    if (overlap && tile_p.button.getAttribute("data-dragging") != "true" && prev.indexOf(tile) == -1)
                    {
                        next_tiles.push(tile);
                    }
                }
                for (const t2 of next_tiles)
                {
                    const new_prev = prev.slice(0);
                    new_prev.push(t1);
                    this.shift_bottom(
                        t2, tiles_state,
                        t1_h, full_pos,
                        new_prev,
                    );
                }
            }
        }
        full_pos.setPosition(t1, t1_new_x, t1_new_y);
    }

    override pageXToHorizontal(x: number): number
    {
        // return -1 if not fitting
        const { group_x } = this;
        const { small_size , margin } = this.pixel_measures;
        const radius = this.pixel_measures.small_size.width;
        if (x < group_x - radius) return -1;
        const w = this.rows.width == 0 ? 0 : (this.rows.width * small_size.width) + ((this.rows.width - 1) * margin);
        if (x > group_x + w + radius) return -1;
        for (let gx = group_x, j = 0, lim = group_x + w; gx < lim; j++)
        {
            if (x < gx + small_size.width / 2) return j;
            if (j != 0) gx += margin;
            gx += small_size.width;
        }
        return this.rows.width;
    }

    override pageYToVertical(y: number): number
    {
        // return -1 if not fitting
        const { small_size , margin } = this.pixel_measures;
        const group_y = this.start_margin;
        if (y < group_y) return -1;
        const h = this.rows.max_height == 0 ? 0: (this.rows.max_height * small_size.height) * ((this.rows.max_height - 1) * margin);
        if (y > group_y + h) return -1;
        for (let gy = group_y, j = 0, lim = group_y + h; gy < lim; j++)
        {
            if (y < gy + small_size.height / 2) return j;
            if (j != 0) gy += margin;
            gy += small_size.height;
        }
        return this.rows.height;
    }
}

class TilesVerticalLayout extends TilesLayout
{
    constructor(private container_width: number, private start_margin: number, pixel_measures: TilesLayoutPixelMeasures, rem: number)
    {
        super(pixel_measures, rem);

        // Measurements
        const { margin, small_size } = this.pixel_measures;

        // Max tile columns (this must be run again similarly after putLabel)
        let w = container_width - start_margin*2;
        let max_width = 1;
        for (let i = 0; i < 256; i++)
        {
            if (max_width * small_size.width + ((max_width - 1) * margin) >= w)
            {
                break;
            }
            max_width++;
        }

        this.rows = new TilesLayoutTileRows(max_width, Infinity);
    }

    override putTile(size: TileSize, horizontal: number, vertical: number): { x: number, y: number, new_horizontal: number, new_vertical: number }
    {
        // Measurements
        const { margin, group_margin } = this.pixel_measures;
        const get_tile_width = this.get_tile_width.bind(this);
        const get_tile_height = this.get_tile_height.bind(this);

        throw new Error("unimplemented");
    }

    override putLabel(): { x: number, y: number, width: number }
    {
        // Measurements
        const { margin, group_margin, small_size } = this.pixel_measures;

        throw new Error("unimplemented");

        // Re-assign this.rows (take left width into account)
        throw new Error("unimplemented");
    }

    override shift(
        tiles: HTMLButtonElement[],
        tiles_state: TilesState,
        to_shift: string,
        place_taker: string,
        place_taker_button: HTMLButtonElement,
        place_side: "left" | "top" | "right" | "bottom"
    ): void
    {
        throw new Error("unimplemented");
    }

    override pageXToHorizontal(x: number): number
    {
        throw new Error("unimplemented");
    }

    override pageYToVertical(y: number): number
    {
        throw new Error("unimplemented");
    }
}

/**
 * Small tile rows of columns (occupied entries).
 */
class TilesLayoutTileRows {
    private m_rows: boolean[][] = [];
    private m_width: number = 0;
    private m_height: number = 0;

    /**
     * @param max_width Maximum number of horizontal tiles. May be `Infinity`.
     * @param max_height Maximum number of vertical tiles. May be `Infinity`.
     */
    constructor(public readonly max_width: number, public readonly max_height: number)
    {
    }

    /**
     * Number of horizontal small tiles.
     */
    get width(): number
    {
        return this.m_width;
    }

    /**
     * Number of vertical small tiles.
     */
    get height(): number
    {
        return this.m_height;
    }

    /**
     * Whether a small tile is occupied or not.
     */
    get(horizontal: number, vertical: number): boolean
    {
        if (vertical < 0 || vertical >= this.max_height || horizontal < 0 || horizontal >= this.max_width)
        {
            return true;
        }
        if (vertical < this.m_rows.length)
        {
            const columns = this.m_rows[vertical];
            if (horizontal < columns.length)
            {
                return columns[horizontal];
            }
        }
        return false;
    }

    sizeFreeAt(horizontal: number, vertical: number, size: TileSize): boolean
    {
        switch (size)
        {
            case "small":
                return !this.get(horizontal, vertical);
            case "medium":
                return !this.get(horizontal, vertical)
                    && !this.get(horizontal + 1, vertical)
                    && !this.get(horizontal, vertical + 1)
                    && !this.get(horizontal + 1, vertical + 1);
            case "wide":
                return this.sizeFreeAt(horizontal, vertical, "medium")
                    && this.sizeFreeAt(horizontal + 2, vertical, "medium");
            case "large":
                return this.sizeFreeAt(horizontal, vertical, "wide")
                    && this.sizeFreeAt(horizontal, vertical + 2, "wide");
        }
    }

    /**
     * Sets whether a small tile is available or not.
     */
    put(horizontal: number, vertical: number, value: boolean)
    {
        if (vertical < 0 || vertical >= this.max_height || horizontal < 0 || horizontal >= this.max_width)
        {
            return;
        }
        if (value)
        {
            while (vertical >= this.m_rows.length)
            {
                this.m_rows.push([]);
                this.m_height = this.m_rows.length;
            }
            const columns = this.m_rows[vertical];
            while (horizontal >= columns.length)
            {
                columns.push(false);
                this.m_width = columns.length > this.m_width ? columns.length : this.m_width;
            }
            columns[horizontal] = true;
        }
        else if (vertical < this.m_rows.length)
        {
            const columns = this.m_rows[vertical];
            if (horizontal < columns.length) {
                columns[horizontal] = false;
                // Re-adjust size
                this.m_width = 0;
                for (let i = 0, l = this.m_rows.length; i < l; i++)
                {
                    const columns = this.m_rows[i];
                    let j = columns.indexOf(true);
                    if (j++ !== -1)
                    {
                        this.m_width = j < this.m_width ? this.m_width : j;
                    }
                }
                this.m_height = 0;
                for (let i = this.m_rows.length; --i >= 0;)
                {
                    const columns = this.m_rows[i];
                    const j = columns.indexOf(true);
                    if (j !== -1)
                    {
                        this.m_height = i + 1;
                        break;
                    }
                }
            }
        }
    }

    fillSize(horizontal: number, vertical: number, size: TileSize): void
    {
        switch (size)
        {
            case "small":
                this.put(horizontal, vertical, true);
                break;
            case "medium":
                this.put(horizontal, vertical, true);
                this.put(horizontal + 1, vertical, true);
                this.put(horizontal, vertical + 1, true);
                this.put(horizontal + 1, vertical + 1, true);
                break;
            case "wide":
                this.fillSize(horizontal, vertical, "medium");
                this.fillSize(horizontal + 2, vertical, "medium");
                break;
            case "large":
                this.fillSize(horizontal, vertical, "wide");
                this.fillSize(horizontal, vertical + 2, "wide");
                break;
        }
    }

    clearSize(horizontal: number, vertical: number, size: TileSize): void
    {
        switch (size)
        {
            case "small":
                this.put(horizontal, vertical, false);
                break;
            case "medium":
                this.put(horizontal, vertical, false);
                this.put(horizontal + 1, vertical, false);
                this.put(horizontal, vertical + 1, false);
                this.put(horizontal + 1, vertical + 1, false);
                break;
            case "wide":
                this.clearSize(horizontal, vertical, "medium");
                this.clearSize(horizontal + 2, vertical, "medium");
                break;
            case "large":
                this.clearSize(horizontal, vertical, "wide");
                this.clearSize(horizontal, vertical + 2, "wide");
                break;
        }
    }
}

/**
 * Synchronization between full tile positions and
 * small tile rows-of-columns occupid entries.
 */
class FullTilesPositionMap
{
    // Tile element, size and position.
    // Width/height are in terms of small tiles (not pixels)
    tiles: Map<string, { button: HTMLButtonElement, size: TileSize, width: number, height: number, horizontal: number, vertical: number }> = new Map();

    constructor(
        private rows: TilesLayoutTileRows,
        tile_buttons: HTMLButtonElement[],
        private tiles_state: TilesState,
        private rem: number,
        private group_x: number,
        private start_margin: number,
        private direction: "horizontal" | "vertical"
    ) {
        for (const button of tile_buttons)
        {
            const id = button.getAttribute("data-id");
            const state = tiles_state.tiles.get(id);
            assert(state !== undefined, "Invalidated tile state.");
            const size = state.size;
            this.tiles.set(id, {
                button,
                size,
                width: get_size_width(size),
                height: get_size_height(size),
                horizontal: state.horizontal,
                vertical: state.vertical,
            });
        }
    }

    contributeTile(button: HTMLButtonElement, tiles_state: TilesState)
    {
        const id = button.getAttribute("data-id");
        const state = tiles_state.tiles.get(id);
        assert(state !== undefined, "Invalidated tile state.");
        const size = state.size;
        this.tiles.set(id, {
            button,
            size,
            width: get_size_width(size),
            height: get_size_height(size),
            horizontal: state.horizontal,
            vertical: state.vertical,
        });
    }

    setPosition(id: string, horizontal: number, vertical: number): void
    {
        const { rem } = this;
        const tile_state = this.tiles_state.tiles.get(id);

        tile_state.horizontal = horizontal;
        tile_state.vertical = vertical;

        const t = this.tiles.get(id);
        if (t)
        {
            t.horizontal = horizontal;
            t.vertical = vertical;
        }

        const button = this.tiles.get(id).button;
        if (button.getAttribute("data-dragging") != "true")
        {
            const x_start_margin = this.direction == "horizontal" ? 0 : (this.start_margin / rem);
            const y_start_margin = this.direction == "horizontal" ? (this.start_margin / rem) : 0;
            const x = (this.group_x / rem) + (horizontal * small_size.width) + (horizontal * margin) + x_start_margin;
            const y = (vertical * small_size.height) + (vertical * margin) + y_start_margin;
            button.style.translate = `${x}rem ${y}rem`;
        }
        button.setAttribute("data-horizontal", horizontal.toString());
        button.setAttribute("data-vertical", vertical.toString());
    }
}

type TilesLayoutPixelMeasures = {
    margin: number,
    group_margin: number,
    small_size: { width: number, height: number },
    medium_size: { width: number, height: number },
    wide_size: { width: number, height: number },
    large_size: { width: number, height: number },
};

/**
 * Gets width of tile size in small tiles unit.
 */
function get_size_width(size: TileSize): number
{
    return size == "large" ? 4 : size == "wide" ? 4 : size == "medium" ? 2 : 1;
}

/**
 * Gets height of tile size in small tiles unit.
 */
function get_size_height(size: TileSize): number
{
    return size == "large" ? 4 : size == "wide" ? 2 : size == "medium" ? 2 : 1;
}