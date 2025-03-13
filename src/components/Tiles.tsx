import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import assert from "assert";
import Color from "color";
import Draggable, { DraggableData } from "react-draggable";
import { TypedEventTarget } from "@hydroper/typedeventtarget";
import { CheckedIcon } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize } from "../utils/common";
import { randomHexLarge } from "../utils/random";

const margin = 0.6; // Margin between tiles
const group_margin = 1; // Margin between groups
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
            for (const tile_div of div_ref.current!.querySelectorAll(".Tile"))
                tile_div.setAttribute("data-drag-n-drop-mode", "true");
        }
        else if (params.dragNDrop !== undefined)
        {
            drag_n_drop_mode = false;

            // Remove data-drag-n-drop-mode attribute from tiles
            for (const tile_div of div_ref.current!.querySelectorAll(".Tile"))
                tile_div.removeAttribute("data-drag-n-drop-mode");
        }

        if (params.selection)
        {
            selection_mode = true;

            // Set data-selection-mode="true" attribute to tiles
            for (const tile_div of div_ref.current!.querySelectorAll(".Tile"))
                tile_div.setAttribute("data-selection-mode", "true");
        }
        else if (params.selection !== undefined)
        {
            selection_mode = false;

            // Remove data-selection-mode attribute from tiles
            for (const tile_div of div_ref.current!.querySelectorAll(".Tile"))
                tile_div.removeAttribute("data-selection-mode");
        }
    }

    // CSS
    const serializedStyles = css `
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        opacity: ${forced_invisible ? 0 : scale};
        transform: scale(${scale});
        transition: opacity 0.3s ${open ? "ease-out" : "ease-in"}, transform 0.3s ${open ? "ease-out" : "ease-in"};
    `;

    // Re-arrange groups and tiles
    let rearrangeTimeout = -1;
    function rearrange_delayed(): void
    {
        if (rearrangeTimeout !== -1)
        {
            window.clearTimeout(rearrangeTimeout);
        }
        rearrangeTimeout = window.setTimeout(rearrange, 10);
    }
    function rearrange(): void
    {
        rearrangeTimeout = -1;
        set_forced_invisible(false);

        // Organize groups (untracked groups without specified position will be the most last)
        const group_buttons: HTMLButtonElement[] = Array.from(div_ref.current!.querySelectorAll(".TileGroup")) as HTMLButtonElement[];
        group_buttons.sort((a, b) => {
            const a_id = a.getAttribute("data-id");
            const b_id = b.getAttribute("data-id");

            let a_pos = tiles_state.groups.get(a_id)?.position ?? a.getAttribute("data-position") ?? NaN;
            a_pos = typeof a_pos == "string" ? (a_pos == "" ? NaN : Number(a_pos) >>> 0) : a_pos;

            let b_pos = tiles_state.groups.get(b_id)?.position ?? b.getAttribute("data-position") ?? NaN;
            b_pos = typeof b_pos == "string" ? (b_pos == "" ? NaN : Number(b_pos) >>> 0) : b_pos;

            return isNaN(a_pos) ? (isNaN(b_pos) ? 0 : 1) : isNaN(b_pos) ? -1 : a_pos < b_pos ? -1 : a_pos > b_pos ? 1 : 0;
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
            new TilesHorizontalLayout(orthogonal_side_length, (options.innerMargin ?? 3) * rem, pixel_measures) :
            new TilesVerticalLayout(orthogonal_side_length, (options.innerMargin ?? 1) * rem, pixel_measures);

        // Retrieve tile buttons
        const tiles = Array.from(div_ref.current!.querySelectorAll(".Tile")) as HTMLButtonElement[];

        // Position labels and tiles
        for (const group_button of group_buttons)
        {
            const group_id = group_button.getAttribute("data-id");

            // Position and size tiles
            for (const tile of tiles)
            {
                const tile_id = tile.getAttribute("data-id");
                const tile_state = tiles_state.tiles.get(tile_id);
                const tile_group_id = tile_state?.group ?? tile.getAttribute("data-group");
                if (tile_group_id != group_id)
                {
                    continue;
                }

                // Update some attributes of the tile
                tile.setAttribute("data-group", tile_group_id);
                if (tile_state)
                    tile.setAttribute("data-horizontal", tile_state.horizontal.toString()),
                    tile.setAttribute("data-vertical", tile_state.vertical.toString());

                // Update size
                if (tile_state && tile.getAttribute("data-size") != tile_state.size)
                {
                    tiles_controller.setSize(tile_id, tile_state.size);
                }

                // Position tile
                const h = Number(tile.getAttribute("data-horizontal"))
                    , v = Number(tile.getAttribute("data-vertical"))
                    , size = tile.getAttribute("data-size") as TileSize;
                const { x, y, horizontalTiles, verticalTiles } = layout.putTile(size, h, v);
                tile.style.translate = `${x / rem}rem ${y / rem}rem`;
                tile.setAttribute("data-horizontal", horizontalTiles.toString());
                tile.setAttribute("data-vertical", verticalTiles.toString());
            }

            // Position and size group label
            const { x, y, width } = layout.putLabel();
            group_button.style.left = `${x / rem}rem`;
            group_button.style.top = `${y / rem}rem`;
            group_button.style.width = `${width / rem}rem`;
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
    });

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
    });

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
        <div className="Tiles" css={serializedStyles} ref={div_ref} style={options.style}>
            <TilesControllerContext.Provider value={tiles_controller}>
                <TilesStateContext.Provider value={tiles_state}>
                    <ModeSignalContext.Provider value={mode_signal}>
                        <RearrangeContext.Provider value={rearrange_delayed}>
                            {options.children}
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
     * Margin of the side orthogonal to the direction used
     * for the tiles (**not** the size of the container).
     */
    innerMargin?: number,

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
}

const TilesControllerContext = createContext<TilesController | null>(null);
const TilesStateContext = createContext<TilesState | null>(null);
const RearrangeContext = createContext<Function | null>(null);
const ModeSignalContext = createContext<((params: { dragNDrop?: boolean, selection?: boolean }) => void) | null>(null);

/**
 * A tile group consisting of a label.
 */
export function TileGroup(options: TileGroupOptions)
{
    // Theme
    const theme = useContext(ThemeContext);

    // Re-arrange function
    const rearrange = useContext(RearrangeContext);

    // Rename
    const rename = options.rename ?? true;

    // CSS
    const serializedStyles = css `
        position: absolute;
        font-weight: lighter;
        font-size: 1.2rem;
        opacity: 0.6;
        border: none;
        border-bottom: 0.25rem solid rgba(0,0,0,0);
        outline: none;
        background: none;
        overflow: hidden;
        min-height: 1.3rem;

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
                css={serializedStyles}
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

    // Elements
    const button_ref = useRef<HTMLButtonElement | null>(null);
    const [tiles_div, set_tiles_div] = useState<HTMLDivElement | null>(null);

    // Drag vars
    const [dragging, set_dragging] = useState<boolean>(false);

    // Checked
    const [checked, set_checked] = useState<boolean>(false);

    // Size
    const [size, set_size] = useState<TileSize>(options.size);

    // CSS
    const [rotate_3d, set_rotate_3d] = useState<string>("rotate3d(0)");
    const tile_color = options.color ?? theme.colors.primary;
    const tile_color_b1 = Color(tile_color).lighten(0.15).hex().toString();
    const tile_color_b2 = Color(tile_color).lighten(0.23).hex().toString();
    const serializedStyles = css `
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
        transition: opacity 0.2s ${dragging ? "" : ", transform 0.2s ease-out, scale 0.2s ease-out, translate 0.2s ease-out"};
        transform-style: preserve-3d;

        &[data-selection-mode="true"] {
            opacity: 0.7;
        }

        &[data-drag-n-drop-mode="true"] {
            scale: 0.9;
        }

        &:not([data-dragging="true"]) {
            transform: ${rotate_3d} !important;
        }

        &[data-drag-n-drop-mode="true"]:not([data-dragging="true"]) {
            scale: 0.9;
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

    useEffect(() =>
    {
        rearrange();
        return () => {
            rearrange();
            tiles_controller.removeEventListener("setSize", tiles_controller_onSetSize);
            tiles_controller.removeEventListener("setChecked", tiles_controller_onSetChecked);
        };
    });

    // Get Tiles div
    useEffect(() => {
        const tiles_div = button_ref.current!.parentElement;
        assert(!!tiles_div && tiles_div.classList.contains("Tiles"), "Tile's parent must be a Tiles.");
        set_tiles_div(tiles_div as HTMLDivElement);
    });

    // Drag vars
    let drag_start = [0, 0];

    // Drag start
    function on_drag_start(_: any, data: DraggableData)
    {
        drag_start = [data.x, data.y];
    }

    // Drag move
    function on_drag(_: any, data: DraggableData)
    {
        const diff_x = drag_start[0] - data.x
            , diff_y = drag_start[1] - data.y;
        if (diff_x > -5 && diff_x <= 5 && diff_y > -5 && diff_y <= 5)
        {
            button_ref.current.style.transform = rotate_3d;
            return;
        }
        set_dragging(true);
        button_ref.current!.style.translate = `${data.x}px ${data.y}px`;
        mode_signal({ dragNDrop: true });

        // Shift tiles as needed.
        let moved = false;
        fixme();

        if (moved)
        {
            // Update state
            update_state();
        }
    }

    // Drag stop
    function on_drag_stop(_: any, data: DraggableData): void
    {
        set_dragging(false);
        mode_signal({ dragNDrop: false });

        // Move tile properly
        fixme();

        // Update state
        update_state();
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
        <Draggable nodeRef={button_ref} onStart={on_drag_start} onDrag={on_drag} onStop={on_drag_stop} offsetParent={tiles_div}>
            <button
                ref={button_ref}
                className="Tile"
                css={serializedStyles}
                data-id={options.id}
                data-group={options.group}
                data-size={size}
                data-horizontal={options.horizontal ?? 0}
                data-vertical={options.vertical ?? 0}
                data-dragging={dragging}
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
    private tile_sizes: Map<TileSize, { width: number, height: number }>;

    constructor(protected pixel_measures: TilesLayoutPixelMeasures)
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

    abstract putTile(size: TileSize, horizontal: number, vertical: number): { x: number, y: number, horizontalTiles: number, verticalTiles: number };

    /**
     * Puts a label after all tiles of a group have been positioned,
     * moving to the next group.
     */
    abstract putLabel(): { x: number, y: number, width: number };
}

class TilesHorizontalLayout extends TilesLayout
{
    private rows: TilesLayoutTileRows;
    private group_x: number;

    constructor(private container_height: number, private inner_margin: number, pixel_measures: TilesLayoutPixelMeasures)
    {
        super(pixel_measures);

        this.rows = new TilesLayoutTileRows(Infinity, 6);
    }

    override putTile(size: TileSize, horizontal: number, vertical: number): { x: number, y: number, horizontalTiles: number, verticalTiles: number }
    {
        // Measurements
        const { margin, small_size } = this.pixel_measures;

        const { max_height } = this.rows;

        for (;;)
        {
            for (; vertical < max_height; vertical++)
            {
                if (this.rows.sizeFreeAt(horizontal, vertical, size))
                {
                    this.rows.fillSize(horizontal, vertical, size);
                    return {
                        x: (horizontal * small_size.width) + (horizontal * margin),
                        y: (vertical * small_size.height) + (vertical * margin),
                        horizontalTiles: horizontal, verticalTiles: vertical
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
        const this_group_y = this.inner_margin;
        const width = this.rows.width == 0 ? 0 : (this.rows.width * small_size.width) + ((this.rows.width - 1) * margin);

        // Move to the next group
        this.group_x = width + group_margin;
        this.rows = new TilesLayoutTileRows(Infinity, 6);

        // Result
        return { x: this_group_x, y: this_group_y, width };
    }
}

class TilesVerticalLayout extends TilesLayout
{
    private rows: TilesLayoutTileRows;

    constructor(private container_width: number, private inner_margin: number, pixel_measures: TilesLayoutPixelMeasures)
    {
        super(pixel_measures);

        // Measurements
        const { margin, small_size } = this.pixel_measures;

        // Max tile columns (this must be run again similarly after putLabel)
        let w = container_width - inner_margin*2;
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

    override putTile(size: TileSize, horizontal: number, vertical: number): { x: number, y: number, horizontalTiles: number, verticalTiles: number }
    {
        // Measurements
        const { margin, group_margin } = this.pixel_measures;
        const get_tile_width = this.get_tile_width.bind(this);
        const get_tile_height = this.get_tile_height.bind(this);

        fixme();
    }

    override putLabel(): { x: number, y: number, width: number }
    {
        // Measurements
        const { margin, group_margin, small_size } = this.pixel_measures;

        fixme();

        // Re-assign this.rows (take left width into account)
        fixme();
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
                this.m_width - columns.length > this.m_width ? columns.length : this.m_width;
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
}

type TilesLayoutPixelMeasures = {
    margin: number,
    group_margin: number,
    small_size: { width: number, height: number },
    medium_size: { width: number, height: number },
    wide_size: { width: number, height: number },
    large_size: { width: number, height: number },
};

function fixme(): never {
    throw new Error("fixme");
}