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

const margin = 0.5; // Margin between tiles
const group_margin = 3.5; // Margin between groups
const small_size = { width: 58, height: 58 };
const medium_size = { width: small_size.width*2 + margin, height: small_size.height*2 + margin };
const wide_size = { width: medium_size.width*2 + margin, height: medium_size.height };
const large_size = { width: wide_size.width, height: wide_size.height };

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
    const {controller: tilesController, state: tilesState } = options;

    // Refs
    const div_ref = useRef<HTMLDivElement | null>(null);

    // Open/close
    const open = options.open ?? true;
    const [forced_invisible, set_forced_invisible] = useState<boolean>(true);
    const [scale, set_scale] = useState<number>(open ? 0 : 1);

    // Modes
    let selection_mode = false;
    let drag_n_drop_mode = false;

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

    // Direction
    if (options.direction == "horizontal")
        assert(options.height !== undefined, "Tiles.height must be specified.");
    else assert(options.width !== undefined, "Tiles.width must be specified.");

    // CSS
    const serializedStyles = css `
        ${options.direction == "horizontal" ? `height: ${pointsToRem(options.height)};` : ""};
        ${options.direction == "vertical" ? `width: ${pointsToRem(options.width)};` : ""};
        position: relative;
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

        // Organize groups
        const groups: HTMLButtonElement[] = Array.from(div_ref.current!.querySelectorAll(".TileGroup")) as HTMLButtonElement[];

        fixme();
    }

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
        return () => {
            tilesController.removeEventListener("getChecked", tilesController_onGetChecked);
        };
    });

    // Handle request to get checked tiles
    function tilesController_onGetChecked(e: CustomEvent<{ requestId: string }>)
    {
        const div = div_ref.current;
        let tiles: string[] = [];
        if (div)
        {
            tiles = Array.from(div.querySelectorAll(".Tile"))
                .filter(div => div.getAttribute("data-checked") == "true")
                .map(div => div.getAttribute("data-id"));
        }
        tilesController.dispatchEvent(new CustomEvent("getCheckedResult", {
            detail: {
                requestId: e.detail.requestId,
                tiles,
            },
        }));
    }
    tilesController.addEventListener("getChecked", tilesController_onGetChecked);

    return (
        <div className="Tiles" css={serializedStyles} ref={div_ref}>
            <TilesControllerContext.Provider value={options.controller}>
                <ModeSignalContext.Provider value={mode_signal}>
                    <RearrangeContext.Provider value={rearrange_delayed}>
                        {options.children}
                    </RearrangeContext.Provider>
                </ModeSignalContext.Provider>
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
     * The tile controller allows controlling which tiles are checked (selected).
     */
    controller: TilesController,
 
    /**
     * If `horizontal`, `height` must be specified;
     * otherwise, `width` must be specified.
     */
    direction: "horizontal" | "vertical",

    /**
     * Width of the container; used if container is vertical.
     */
    width?: number,

    /**
     * Height of the container; used if container is horizontal.
     */
    height?: number,

    /**
     * Whether to display open or close transition.
     * Displays a scale/opacity transition when visibility changes.
     *
     * @default true
     */
    open?: boolean,

    children?: React.ReactNode,
};

/**
 * The state of a `Tiles` component, containing positions and labels.
 */
export class TilesState
{
    groups: Map<string, { label: string, horizontal: number, vertical: number }> = new Map();
    tiles: Map<string, { group: string, horizontal: number, vertical: number }> = new Map();

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
                horizontal: Number(o1.horizontal),
                vertical: Number(o1.vertical),
            });
        }
        for (const id in object.tiles)
        {
            const o1 = object.tiles[id];
            r.tiles.set(id, {
                group: String(o1.group),
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
                horizontal: g.horizontal,
                vertical: g.vertical,
            };
        }
        const tiles: any = {};
        for (const [id, t] of this.tiles)
        {
            tiles[id] = {
                group: t.group,
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
        font-size: 1.4rem;
        opacity: 0.6;
        border: none;
        outline: none;
        background: none;

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
            rearrange();
        };
    });

    return (
        <>
            <button
                className="TileGroup"
                css={serializedStyles}
                data-id={options.id}
                data-label={options.label ?? ""}
                data-horizontal={options.horizontal}
                data-vertical={options.vertical}>
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
     * Default horizontal position in group units.
     */
    horizontal: number,

    /**
     * Default vertical position in group units.
     */
    vertical: number,

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
    const tilesController = useContext(TilesControllerContext);
    const modeSignal = useContext(ModeSignalContext);

    // Re-arrange function
    const rearrange = useContext(RearrangeContext);

    // Elements
    const button_ref = useRef<HTMLButtonElement | null>(null);
    const [tiles_div, set_tiles_div] = useState<HTMLDivElement | null>(null);

    // Drag vars
    const [dragging, set_dragging] = useState<boolean>(false);

    // Checked
    const [checked, set_checked] = useState<boolean>(false);

    // CSS
    const [rotate_3d, set_rotate_3d] = useState<string>("rotate3d(0)");
    const tile_color = options.color ?? theme.colors.primary;
    const tile_color_b1 = Color(tile_color).lighten(0.1).toString();
    const tile_color_b2 = Color(tile_color).lighten(0.2).toString();
    const serializedStyles = css `
        position: absolute;
        overflow: hidden;
        width: ${get_tile_width(options.size)}rem;
        height: ${get_tile_height(options.size)}rem;
        outline: 0.11rem solid ${Color(theme.colors.primary).alpha(0.6).alpha(0.3).toString()};
        background: linear-gradient(90deg, ${tile_color} 0%, ${tile_color_b1} %100);
        border: none;
        font-family: ${fontFamily};
        font-size: ${fontSize};
        color: ${theme.colors.foreground};
        transition: opacity 0.2s ${dragging ? "" : ", transform 0.2s ease-out"};

        &[data-selection-mode="true"] {
            opacity: 0.7;
        }

        &[data-drag-n-drop-mode="true"] {
            transform: scale(0.7);
        }

        &:not([data-dragging="true"]) {
            transform: ${rotate_3d};
        }

        &[data-drag-n-drop-mode="true"]:not([data-dragging="true"]) {
            transform: scale(0.7), ${rotate_3d};
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
            right: -1rem;
            top: -1rem;
            padding: 0.5rem;
            width: 2rem;
            height: 2rem;
            background: ${theme.colors.primary};
            color: ${theme.colors.primaryForeground};
            transform: rotate(45deg);
            visibility: hidden;
        }

        &[data-checked="true"] .Tile-checked-tri {
            visibility: visible;
        }

        & .Tile-checked-icon {
            transform: rotate(-45deg);
        }
    `;

    // Handle pointer down
    function button_onPointerDown(e: PointerEvent): void
    {
        viewport_pointerUp = local_viewport_pointerUp;

        // Slightly rotate tile depending on where the click occurred.
        const deg = 20;
        const rect = button_ref.current!.getBoundingClientRect();
        const x = e.clientX, y = e.clientY;
        if (x < rect.left + rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            set_rotate_3d(`rotate3d(rotate3d(0, -1, 0, ${deg}deg))`);
        else if (x > rect.right - rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            set_rotate_3d(`rotate3d(rotate3d(0, 1, 0, ${deg}deg))`);
        else if (y < rect.top + rect.height / 2)
            set_rotate_3d(`rotate3d(rotate3d(1, 0, 0, ${deg}deg))`);
        else
            set_rotate_3d(`rotate3d(rotate3d(-1, 0, 0, ${deg}deg))`);
    }

    // Handle pointer up
    function local_viewport_pointerUp(): void
    {
        viewport_pointerUp = null;
        set_rotate_3d("rotate3d(0)");
    }

    useEffect(() =>
    {
        rearrange();
        return () => {
            rearrange();
            tilesController.removeEventListener("setChecked", tilesController_onSetChecked);
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
            return;
        }
        set_dragging(true);
        modeSignal({ dragNDrop: true });

        // Shift tiles as needed.
        fixme();
    }

    // Drag stop
    function on_drag_stop(_: any, data: DraggableData): void
    {
        set_dragging(false);
        modeSignal({ dragNDrop: false });

        // Move tile properly
        fixme();
    }

    // Handle context menu
    function on_context_menu(): void
    {
        tilesController.checked().then(list => {
            const checked = !list.includes(options.id);
            set_checked(checked);
            if (checked || list.length > 1)
                modeSignal({ selection: true });
            else if (!checked && list.length == 1)
                modeSignal({ selection: false });
            options.contextMenu?.(options.id);
        });
    }

    // Handle checking tiles through TilesController
    function tilesController_onSetChecked(e: CustomEvent<{ id: string, value: boolean }>)
    {
        if (e.detail.id !== options.id) return;
        tilesController.checked().then(list => {
            const checked = e.detail.value;
            set_checked(checked);
            if (checked || list.length > 0)
                modeSignal({ selection: true });
            else if (!checked && (list.length == 0 || (list.length == 1 && list.includes(options.id))))
                modeSignal({ selection: false });
        });
    }
    tilesController.addEventListener("setChecked", tilesController_onSetChecked);

    return (
        <Draggable nodeRef={button_ref} onStart={on_drag_start} onDrag={on_drag} onStop={on_drag_stop} offsetParent={tiles_div}>
            <button
                ref={button_ref}
                className="Tile"
                css={serializedStyles}
                data-id={options.id}
                data-group={options.group ?? ""}
                data-horizontal={options.horizontal}
                data-vertical={options.vertical}
                data-dragging={dragging}
                data-checked={checked}
                onPointerDown={ options.disabled ? undefined : button_onPointerDown as any }
                onClick={ options.disabled ? undefined : e => { options.click?.(options.id) } }
                onContextMenu={ options.disabled ? undefined : e => { options.contextMenu?.(options.id) }}
                disabled={options.disabled}>

                {options.children}

                <div className="Tile-checked-tri">
                    <CheckedIcon className="Tile-checked-icon"/>
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
    group?: string,

    /**
     * Default horizontal position in small tile units.
     */
    horizontal: number,

    /**
     * Default vertical position in small tile units.
     */
    vertical: number,

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
 * Allows to retrieve the list of checked tiles and
 * setting whether a tile is checked or not.
 */
export class TilesController extends (EventTarget as TypedEventTarget<{
    getChecked: CustomEvent<{ requestId: string }>;
    getCheckedResult: CustomEvent<{ requestId: string, tiles: string[] }>;
    setChecked: CustomEvent<{ id: string, value: boolean }>;
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
}