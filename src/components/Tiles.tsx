import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import assert from "assert";
import Color from "color";
import { TypedEventTarget } from "com.hydroper.typedeventtarget";
import { GridStack, GridStackWidget } from "gridstack";
import { CheckedIcon } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize } from "../utils/common";
import { randomHexLarge } from "../utils/random";
import { getRectHitSide } from "../utils/rect";

// We use Gridstack.js for implementing tile grids.

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
 * Represents a container of Metro tiles.
 */
export function Tiles(options: TilesOptions)
{
    // Use theme
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);
    
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
    
    // GridStack instance
    const gridstack: GridStack | null = null;

    // Tiles
    const tiles: Tile[] = [];

    // Modes
    let selection_mode = false;
    let drag_n_drop_mode = false;

    // Measurements
    let orthogonal_side_length = 0;

    // Initialize gridstack
    function init_gridstack(): void
    {
        set_forced_invisible(false);

        fixme();
    }

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

        & .Tile {
            position: absolute;
            overflow: hidden;
            outline: 0.11rem solid ${Color(theme.colors.primary).alpha(0.6).alpha(0.3).toString()};
            background: linear-gradient(90deg, ${tile_color} 0%, ${tile_color_b1} 100%);
            border: none;
            font-family: ${fontFamily};
            font-size: ${fontSize};
            color: ${theme.colors.foreground};
            transition: opacity 0.2s;
            transform-style: preserve-3d;
        }

        & .Tile[data-selection-mode="true"] {
            opacity: 0.7;
        }

        & .Tile:not([data-dragging="true"]) {
            transition: opacity 0.2s, transform 0.2s ease-out, scale 0.2s ease-out, translate 0.2s ease-out;
        }

        & .Tile[data-drag-n-drop-mode="true"] {
            scale: 0.9;
        }

        & .Tile:not([data-dragging="true"]),
        & .Tile[data-drag-n-drop-mode="true"]:not([data-dragging="true"]) {
            transform: ${rotate_3d} !important;
        }

        & .Tile[data-dragging="true"] {
            opacity: 0.6;
        }

        & .Tile:hover:not(:disabled),
        & .Tile:focus:not(:disabled) {
            outline: 0.17rem solid ${Color(theme.colors.primary).alpha(0.6).toString()};
            background: linear-gradient(90deg, ${tile_color_b1} 0%, ${tile_color_b2} %100);
        }

        & .Tile:disabled {
            opacity: 0.5;
        }

        & .Tile .Tile-checked-tri {
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

        & .Tile[data-checked="true"] .Tile-checked-tri {
            visibility: visible;
        }

        & .Tile .Tile-checked-icon {
            transform: rotate(-45deg) translate(-5.4rem, 5.4rem);
        }
    `;

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

        // Initialize gridstack
        init_gridstack();

        const resizeObserver = new ResizeObserver(() => {
            // Update orthogonal side length
            const r = div.getBoundingClientRect();
            orthogonal_side_length = options.direction == "horizontal" ? r.height : r.width;
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
        <div className="Tiles" css={serialized_styles} style={options.style}>
            <div className="TileGridStack grid-stack" ref={div_ref}></div>
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

    style?: React.CSSProperties,
};

export type Tile = {
    /**
     * Unique tile ID.
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
     * Default horizontal position in small tile units.
     */
    x: number,

    /**
     * Default vertical position in small tile units.
     */
    y: number,

    /**
     * Label.
     */
    label?: string,

    /**
     * Icon source.
     */
    icon?: string,

    /**
     * List of HTML content for live tiles
     * with rolling animation.
     */
    liveHypertext?: string[],
};

/**
 * The state of a `Tiles` component, containing positions and labels.
 */
export class TilesState
{
    tiles: Map<string, { size: TileSize, x: number, y: number }> = new Map();

    /**
     * Constructs `TilesState` from JSON. The `object` argument
     * may be a JSON serialized string or a plain object.
     */
    static fromJSON(object: any): TilesState
    {
        object = typeof object === "string" ? JSON.parse(object) : object;
        const r = new TilesState();
        for (const id in object.tiles)
        {
            const o1 = object.tiles[id];
            r.tiles.set(id, {
                size: String(o1.size) as TileSize,
                x: Number(o1.x),
                y: Number(o1.y),
            });
        }
        return r;
    }

    /**
     * Returns a plain object (**not** a string).
     */
    toJSON(): any
    {
        const tiles: any = {};
        for (const [id, t] of this.tiles)
        {
            tiles[id] = {
                size: t.size,
                x: t.x,
                y: t.y,
            };
        }
        return {
            tiles,
        };
    }
    
    clear(): void
    {
        this.tiles.clear();
    }

    set(state: TilesState): void
    {
        for (const [id, tile] of state.tiles)
        {
            this.tiles.set(id, {
                size: tile.size,
                x: tile.x,
                y: tile.y,
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