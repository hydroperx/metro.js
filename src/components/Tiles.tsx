import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import assert from "assert";
import Color from "color";
import Draggable from "react-draggable";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";

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

/**
 * Represents a container of Metro tiles which are positioned anywhere.
 * May contain `Tile` and `TileGroup` children.
 */
export function Tiles(options: TilesOptions)
{
    // Open/close
    const open = options.open ?? true;
    const [forced_invisible, set_forced_invisible] = useState<boolean>(true);
    const [scale, set_scale] = useState<number>(open ? 0 : 1);

    // Mode
    const [mode, setMode] = useState<TilesMode | null>(options.mode ?? null);

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
    function rearrangeDelayed(): void
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

    return (
        <div className="Tiles" css={serializedStyles}>
            <ModeContext.Provider value={mode}>
                <SetModeContext.Provider value={setMode}>
                    <RearrangeContext.Provider value={rearrangeDelayed}>
                        {options.children}
                    </RearrangeContext.Provider>
                </SetModeContext.Provider>
            </ModeContext.Provider>
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

    /**
     * If set to `selection`, tiles will be checkable.
     * If set to `drag-n-drop` tiles will be more opaque
     * and scaled down.
     */
    mode?: TilesMode,

    children?: React.ReactNode,
};

export type TilesMode = "selection" | "drag-n-drop";

/**
 * The state of a Tiles component, containing positions and labels.
 */
export class TilesState
{
    /** @private */
    m_groups: Map<string, { label: string, horizontal: number, vertical: number }> = new Map();
    /** @private */
    m_tiles: Map<string, { group: string, horizontal: number, vertical: number }> = new Map();

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
            r.m_groups.set(id, {
                label: String(o1.label),
                horizontal: Number(o1.horizontal),
                vertical: Number(o1.vertical),
            });
        }
        for (const id in object.tiles)
        {
            const o1 = object.tiles[id];
            r.m_tiles.set(id, {
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
        for (const [id, g] of this.m_groups)
        {
            groups[id] = {
                label: g.label,
                horizontal: g.horizontal,
                vertical: g.vertical,
            };
        }
        const tiles: any = {};
        for (const [id, t] of this.m_tiles)
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

const RearrangeContext = createContext<Function | null>(null);
const ModeContext = createContext<string | null>(null);
const SetModeContext = createContext<Function | null>(null);

/**
 * A tile group consisting of a label.
 */
export function TileGroup(options: TileGroupOptions)
{
    // Re-arrange function
    const rearrange = useContext(RearrangeContext);

    // Label
    const [label, setLabel] = useState<string>(options.label ?? "");

    // Rename
    const rename = options.rename ?? true;

    // CSS
    const serializedStyles = css `
        position: absolute;

        .TileLabel {
            position: absolute;
            font-weight: lighter;
            font-size: 1.6rem;
            opacity: 0.6;
        }
    `;

    // Re-arrange
    useEffect(() => { rearrange() });

    return (
        <>
            <div
                className="TileGroup"
                css={serializedStyles}
                data-id={options.id}
                data-label={label}
                data-horizontal={options.horizontal}
                data-vertical={options.vertical}>

                <div className="TileLabel">
                    {label}
                </div>
            </div>
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
    // Re-arrange function
    const rearrange = useContext(RearrangeContext);

    // Divs
    const div_ref = useRef<HTMLDivElement | null>(null);
    const [tiles_div, set_tiles_div] = useState<HTMLDivElement | null>(null);

    // CSS
    const serializedStyles = css `
        position: absolute;
        overflow: hidden;
        width: ${get_tile_width(options.size)}rem;
        height: ${get_tile_height(options.size)}rem;
    `;

    // Re-arrange
    useEffect(() => { rearrange() });

    useState(() => {
        const tiles_div = div_ref.current!.parentElement;
        assert(!!tiles_div && tiles_div.classList.contains("Tile"), "Tile's parent must be a Tiles.");
        set_tiles_div(tiles_div as HTMLDivElement);
    });

    return (
        <Draggable nodeRef={div_ref} bounds="parent" offsetParent={tiles_div}>
            <div
                ref={div_ref}
                className="Tile"
                css={serializedStyles}
                data-id={options.id}
                data-group={options.group ?? ""}
                data-horizontal={options.horizontal}
                data-vertical={options.vertical}
                data-checked={!!options.checked}
                onContextMenu={e => { options.contextMenu?.(options.id); }}>

                {options.children}
            </div>
        </Draggable>
    );
}

export type TileOptions = {
    /**
     * Tile ID, used for restoring position.
     */
    id: string,

    /**
     * Tile size.
     */
    size: TileSize,

    /**
     * Determines whether the tile is checked or not.
     */
    checked?: boolean,

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
     * Context menu event.
     */
    contextMenu?: TileContextMenuHandler,

    children?: React.ReactNode,
};

/**
 * Context menu handler for tiles.
 */
export type TileContextMenuHandler = (id: string) => void;

/**
 * Tile size.
 */
export type TileSize = "small" | "medium" | "wide" | "large";