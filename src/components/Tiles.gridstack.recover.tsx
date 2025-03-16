import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import assert from "assert";
import Color from "color";
import { TypedEventTarget } from "com.hydroper.typedeventtarget";
import { GridHTMLElement, GridItemHTMLElement, GridStack, GridStackWidget } from "gridstack";
import { CheckedIcon, getIcon } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize } from "../utils/common";
import { randomHexLarge } from "../utils/random";

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
window.addEventListener("pointerup", (e) => {
    viewport_pointerUp?.(e);
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
    const rem = useRef<number>(16);
    
    // GridStack instances
    const gridstacks: GridStack[] = [];

    // Tiles
    const tiles: Map<string, Tile> = new Map();

    // Groups
    const groups: TileGroup[] = [];

    // Modes
    let selection_mode = false;
    let drag_n_drop_mode = false;

    // Measurements
    let orthogonal_side_length = 0;

    // Render
    let renderTimeout = -1;
    function render(): void
    {
        if (renderTimeout !== -1) window.clearTimeout(renderTimeout);
        renderTimeout = window.setTimeout(render_immediate, 10);
    }
    function render_immediate(): void
    {
        renderTimeout = -1;
        set_forced_invisible(false);
        sort_groups();

        // Delete every existing render
        // for (const el of Array.from(div_ref.current!.querySelectorAll(".TileGroup")))
        //     el.remove();
        for (const gridstack of gridstacks)
            gridstack.destroy();
        gridstacks.length = 0;

        // Render groups
        for (const group of groups)
            create_group(group.id);

        // Insert tiles
        for (const [,tile] of tiles)
        {
            add_tile(tile);
        }

        // Render reserve group
        create_rest_group();
    }

    // Sort groups and keep their indices sequential.
    function sort_groups(): void
    {
        // Initialize group states
        for (const group of groups)
        {
            const { id } = group;
            let state = tiles_state.groups.get(id);
            if (!state)
            {
                state = {
                    index: groups.length,
                };
                tiles_state.groups.set(id, state);
            }
        }

        // Sort groups
        groups.sort((a, b) => {
            const a_pos = tiles_state.groups.get(a.id).index;
            const b_pos = tiles_state.groups.get(b.id).index;

            return a_pos < b_pos ? -1 : a_pos > b_pos ? 1 : 0;
        });

        // Keep group indices sequential
        for (let i = 0; i < groups.length; i++)
            tiles_state.groups.get(groups[i].id).index = i;
    }

    // There must always be a last empty group as a reserve
    function create_rest_group(): GridStack | null
    {
        const last_group = div_ref.current!.querySelector(".TileGroup:last-child");
        if (!last_group || !!last_group.querySelector(".Tile"))
        {
            return create_group(randomHexLarge());
        }
        return null;
    }

    // Create group gridstack and div
    function create_group(id: string): GridStack
    {
        const group_element = document.createElement("div");
        group_element.className = "TileGroup grid-stack";
        group_element.setAttribute("data-id", id);
        div_ref.current!.appendChild(group_element);

        let group = groups.find(g => g.id == id);
        if (!group)
            group = { id: id },
            groups.push(group),
            tiles_state.groups.set(id, { index: groups.length });

        const gridstack = GridStack.init({
            alwaysShowResizeHandle: false,
            disableResize: true,
            float: true,
            margin: `${margin}rem`,
            maxRow: options.direction == "horizontal" ? 6 : undefined,
            rtl: localeDir == "rtl",
            cellHeight: `${small_size.height}rem`,
            cellHeightUnit: "rem",
            acceptWidgets(el) {
                return div_ref.current!.contains(el);
            },
        }, group_element);

        // On tile add
        gridstack.on("added", (e, items) => {
            if (items.length == 0) return;

            // Create resting group if necessary
            create_rest_group();
        });

        // On tile removal
        gridstack.on("removed", (e, items) => {
            // remove group if empty and not last
            if (!gridstack.el.querySelector(".Tile") && !gridstack.el.matches(":last-child"))
            {
                remove_group(gridstack.el.getAttribute("data-id"));
            }
        });

        // On tile change
        gridstack.on("change", (e, items) => {
            for (const item of items)
            {
                if (!item.el.classList.contains("Tile")) continue;
                
                const tile = item.el.getAttribute("data-id");
                
                const tile_data = tiles.get(tile);
                tile_data.x = item.x;
                tile_data.y = item.y;
                
                const state = tiles_state.tiles.get(tile);
                state.x = item.x;
                state.y = item.y;
            }
        });

        // Drag vars
        const drag_start: WeakMap<GridItemHTMLElement, [number, number]> = new WeakMap();

        gridstack.on("dragstart", (event, el) => {
            if (el.getAttribute("data-drag-n-drop-mode") == "true") return;
            drag_start.set(el, [el.gridstackNode.x, el.gridstackNode.y]);
        });

        gridstack.on("drag", (event, el) => {
            const this_drag_start = drag_start.get(el);
            if (!this_drag_start) return;

            const diff_x = drag_start[0] - el.gridstackNode.x
                , diff_y = drag_start[1] - el.gridstackNode.y;
            if (diff_x > -1 && diff_x <= 1 && diff_y > -1 && diff_y <= 1)
            {
                el.style.transform = el.getAttribute("data-transform-3d");
                return;
            }

            el.style.transform = "";
            el.setAttribute("data-dragging", "true");
            if (!drag_n_drop_mode)
                mode_signal({ dragNDrop: true });
        });

        gridstack.on("dragstop", (event, el) => {
            const this_drag_start = drag_start.get(el);
            if (!this_drag_start) return;

            el.setAttribute("data-dragging", "false");
            drag_start.delete(el);
            mode_signal({ dragNDrop: false });
        });

        gridstacks.push(gridstack);
        return gridstack;
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

        & .TileGroupList {
            display: flex;
            flex-direction: ${options.direction == "horizontal" ? (localeDir == "ltr" ? "row" : "row-reverse") : "column"};
            gap: ${group_margin}rem;
            ${options.direction == "horizontal" ? `margin: ${options.orthogonalMargin ?? 3}rem 0;` : ""}
            ${options.direction == "vertical" ? `margin: 0 ${options.orthogonalMargin ?? 3}rem;` : ""}
        }

        & .TileGroupList > .TileGroup:last-child {
            flex-grow: 9999;
        }

        & .TileGroup {
            position: relative;
            ${options.direction == "horizontal" ? `min-width: ${wide_size.width}rem; height: 100%;` : ""}
            ${options.direction == "vertical" ? `width: 100%; min-height: ${medium_size.height}rem;` : ""}
        }

        & .Tile {
            position: absolute;
            overflow: hidden;
            outline: 0.11rem solid ${Color(theme.colors.primary).alpha(0.6).alpha(0.3).toString()};
            border: none;
            font-family: ${fontFamily};
            font-size: ${fontSize};
            color: ${theme.colors.foreground};
            transition: opacity 0.2s;
            transform-style: preserve-3d;
            width: 100%;
            height: 100%;
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

        & .Tile[data-dragging="true"] {
            opacity: 0.6;
        }

        & .Tile:hover:not(:disabled),
        & .Tile:focus:not(:disabled) {
            outline: 0.17rem solid ${Color(theme.colors.primary).alpha(0.6).toString()};
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
            background: url("${getIcon("checked", "white")}") no-repeat;
            background-position: center;
            width: ${pointsToRem(5)};
            height: ${pointsToRem(5)};
            vertical-align: middle;
            transform: rotate(-45deg) translate(-5.4rem, 5.4rem);
        }
    `;

    // Observe rem
    useEffect(() => {
        const rem_observer = new RemObserver(value => {
            rem.current = value;
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
            transition_timeout = window.setTimeout(() => {
                set_scale(1);
            }, 300);
        }
        else
        {
            transition_timeout = window.setTimeout(() => {
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
        });

        resizeObserver.observe(div);

        return () => {
            // Destroy GridStacks
            for (const gridstack of gridstacks)
                gridstack.destroy();

            // Dispose resize observer
            resizeObserver.disconnect();

            // Dipose listeners on TilesController
            tiles_controller.removeEventListener("getChecked", tiles_controller_onGetChecked);
            tiles_controller.removeEventListener("addTile", tiles_controller_addTile);
            tiles_controller.removeEventListener("addGroup", tiles_controller_addGroup);
            tiles_controller.removeEventListener("removeGroup", tiles_controller_removeGroup);
        };
    }, []);

    useEffect(() => {
        render_immediate();
    }, [localeDir, rem]);

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

    // Tilting
    let tilting_button: HTMLButtonElement | null = null,
        tilting_pointer_id: number;
    function tile_onPointerDown(e: PointerEvent): void
    {
        if (tilting_button) return;
        tilting_pointer_id = e.pointerId;
        tilting_button = e.currentTarget as HTMLButtonElement;
        const size = tilting_button.getAttribute("data-size");
        viewport_pointerUp = local_viewport_pointerUp;

        // Slightly rotate tile depending on where the click occurred.
        const deg = 5;
        const rect = tilting_button.getBoundingClientRect();
        const x = e.clientX, y = e.clientY;
        let rotate_3d = "";
        if (x < rect.left + rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            rotate_3d = `perspective(${get_tile_width(size as TileSize)}rem) rotate3d(0, -1, 0, ${deg}deg)`;
        else if (x > rect.right - rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            rotate_3d = `perspective(${get_tile_width(size as TileSize)}rem) rotate3d(0, 1, 0, ${deg}deg)`;
        else if (y < rect.top + rect.height / 2)
            rotate_3d = `perspective(${get_tile_width(size as TileSize)}rem) rotate3d(1, 0, 0, ${deg}deg)`;
        else
            rotate_3d = `perspective(${get_tile_width(size as TileSize)}rem) rotate3d(-1, 0, 0, ${deg}deg)`;

        tilting_button.style.transform = rotate_3d;
        tilting_button.setAttribute("data-transform-3d", rotate_3d);
    }

    // Handle pointer over tile
    function tile_onPointerOver(e: PointerEvent): void
    {
        const tile_button = e.currentTarget as HTMLButtonElement;
        if (!tile_button.matches(":hover")) return;
        const tile_color = tile_button.getAttribute("data-color");
        const tile_color_b1 = Color(tile_color).lighten(0.15).hex().toString();
        const tile_color_b2 = Color(tile_color).lighten(0.23).hex().toString();
        tile_button.style.background = `linear-gradient(90deg, ${tile_color_b1} 0%, ${tile_color_b2} 100%)`;
    }

    // Handle pointer out tile
    function tile_onPointerOut(e: PointerEvent): void
    {
        const tile_button = e.currentTarget as HTMLButtonElement;
        const tile_color = tile_button.getAttribute("data-color");
        const tile_color_b1 = Color(tile_color).lighten(0.15).hex().toString();
        tile_button.style.background = `linear-gradient(90deg, ${tile_color} 0%, ${tile_color_b1} 100%)`;
    }

    // Handle pointer up
    function local_viewport_pointerUp(e: PointerEvent): void
    {
        if (!tilting_button || tilting_pointer_id != e.pointerId) return;
        viewport_pointerUp = null;
        tilting_button.style.transform = "";
        tilting_button.removeAttribute("data-transform-3d");
        tilting_button = null;
    }

    // Handle the request to add a tile
    function tiles_controller_addTile(e: CustomEvent<Tile>)
    {
        add_tile(e.detail);
    }
    function add_tile(tile: Tile): void
    {
        assert(!tiles.has(tile.id), "Duplicate tile.");

        const element = document.createElement("button");
        element.className = "Tile";

        // Misc attributes
        element.setAttribute("data-id", tile.id);
        element.setAttribute("data-size", tile.size);
        element.setAttribute("data-group", tile.group);
        element.addEventListener("pointerdown", tile_onPointerDown);
        element.addEventListener("pointerover", tile_onPointerOver);
        element.addEventListener("pointerout", tile_onPointerOut);

        // Misc logic
        element.disabled = !!tile.disabled;

        element.innerHTML = `
            <div class="Tile-checked-tri">
                <div class="Tile-checked-icon"></div>
            </div>
        `;

        // Color
        const tile_color_b1 = Color(tile.color).lighten(0.15).hex().toString();
        element.setAttribute("data-color", tile.color);
        element.style.background = `linear-gradient(90deg, ${tile.color} 0%, ${tile_color_b1} 100%)`;

        // Group div (.grid-stack/.TileGroup)
        const group_div = Array.from(div_ref.current!.querySelectorAll(".TileGroup"))
            .find(g => g.getAttribute("data-id") == tile.group);
        assert(!!group_div, "Could not find tile's group.");

        // GridStack
        const gridstack = (group_div as GridHTMLElement).gridstack;

        // Add gridstack widget
        const widget_element = gridstack.addWidget({
            x: tile.x,
            y: tile.y,
            w: get_tile_columns(tile.size),
            h: get_tile_rows(tile.size),
        });
        const content_element = widget_element.querySelector(".grid-stack-item-content");
        content_element.appendChild(element);

        tiles.set(tile.id, tile);
        tiles_state.tiles.set(tile.id, {
            x: tile.x,
            y: tile.y,
            size: tile.size,
            group: tile.group,
        });

        // Render reserve group
        create_rest_group();
    }
    tiles_controller.addEventListener("addTile", tiles_controller_addTile);

    // Handle adding groups
    function tiles_controller_addGroup(e: CustomEvent<TileGroup>): void
    {
        add_group(e.detail);
    }
    function add_group(group: TileGroup): void
    {
        assert(!groups.find(g => g.id == group.id), "Duplicate group.");

        // Remove last group if empty
        const last_group = groups.length == 0 ? null : groups[groups.length - 1].id;
        if (last_group)
        {
            const last_gridstack = gridstacks.find(g => g.el.getAttribute("data-id") == last_group)
            if (!last_gridstack.el.querySelector(".Tile"))
                remove_group(last_group);
        }

        groups.push(group);
        tiles_state.groups.set(group.id, { index: groups.length });

        // Render this group
        create_group(group.id);

        // Render reserve group
        create_rest_group();
    }
    tiles_controller.addEventListener("addGroup", tiles_controller_addGroup);

    // Remove group
    function tiles_controller_removeGroup(e: CustomEvent<string>): void
    {
        remove_group(e.detail);
    }
    function remove_group(group_id: string): void
    {
        for (let i = 0; i < groups.length; i++)
        {
            if (groups[i].id == group_id)
            {
                groups.splice(i, 1);
                break;
            }
        }
        const gridstack = gridstacks.find(g => g.el.getAttribute("data-id") == group_id);
        if (gridstack)
        {
            gridstack.destroy();
            const i = gridstacks.indexOf(gridstack);
            gridstacks.splice(i, 1);
        }
        tiles_state.groups.delete(group_id);

        sort_groups();
    }
    tiles_controller.addEventListener("removeGroup", tiles_controller_removeGroup);

    return (
        <div className="Tiles" css={serialized_styles} style={options.style}>
            <div className="TileGroupList" ref={div_ref}></div>
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
 
    direction: "horizontal" | "vertical",

    /**
     * Margin of the sides orthogonal to the direction used
     * for the tiles (**not** the margin around the container).
     */
    orthogonalMargin?: number,

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

    group: string,

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

export type TileGroup = {
    id: string,
};

/**
 * The state of a `Tiles` component, containing positions and labels.
 */
export class TilesState
{
    groups: Map<string, { index: number }> = new Map();
    tiles: Map<string, { size: TileSize, x: number, y: number, group: string }> = new Map();

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
                index: Number(o1.index),
            });
        }
        for (const id in object.tiles)
        {
            const o1 = object.tiles[id];
            r.tiles.set(id, {
                size: String(o1.size) as TileSize,
                x: Number(o1.x),
                y: Number(o1.y),
                group: String(o1.group),
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
                index: g.index,
            };
        }
        const tiles: any = {};
        for (const [id, t] of this.tiles)
        {
            tiles[id] = {
                size: t.size,
                x: t.x,
                y: t.y,
                group: t.group,
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
                index: group.index,
            });
        }
        for (const [id, tile] of state.tiles)
        {
            this.tiles.set(id, {
                size: tile.size,
                x: tile.x,
                y: tile.y,
                group: tile.group,
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
    addTile: CustomEvent<Tile>;
    addGroup: CustomEvent<TileGroup>;
    removeGroup: CustomEvent<string>;
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

    addTile(options: Tile): void
    {
        this.dispatchEvent(new CustomEvent("addTile", {
            detail: options,
        }));
    }

    addGroup(options: TileGroup): void
    {
        this.dispatchEvent(new CustomEvent("addGroup", {
            detail: options,
        }));
    }

    removeGroup(id: string): void
    {
        this.dispatchEvent(new CustomEvent("removeGroup", {
            detail: id,
        }));
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

/**
 * Gets width of tile size in small tiles unit.
 */
function get_tile_columns(size: TileSize): number
{
    return size == "large" ? 4 : size == "wide" ? 4 : size == "medium" ? 2 : 1;
}

/**
 * Gets height of tile size in small tiles unit.
 */
function get_tile_rows(size: TileSize): number
{
    return size == "large" ? 4 : size == "wide" ? 2 : size == "medium" ? 2 : 1;
}