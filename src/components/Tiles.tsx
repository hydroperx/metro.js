import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { styled, keyframes } from "styled-components";
import assert from "assert";
import Color from "color";
import { TypedEventTarget } from "com.hydroper.typedeventtarget";
import { Tiles as Tiles1, TileSize, State as Tiles1State } from "com.hydroper.tilelayout";
import { getIcon } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext, Theme } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize } from "../utils/common";
import { randomHexLarge } from "../utils/random";

export type { TileSize } from "com.hydroper.tilelayout";

const tileClass = "Tile";
const tileIconWrapClass = "Tile-icon-wrap";
const tileIconClass = "Tile-icon";
const tileLabelClass = "Tile-label";
// Tile pages are the different slide contents a tile
// may display one at a time.
const tilePageClass = "Tile-page";
const tileCheckedRectClass = "Tile-checked-rect";
const tileCheckedIconClass = "Tile-checked-icon";
const labelClass = "Tile-group-label";

// Viewport mouse up handler
let viewport_pointerUp: Function | null = null;
window.addEventListener("pointerup", (e) => {
    viewport_pointerUp?.(e);
});

// CSS
const Div = styled.div<{
    $forced_invisible: boolean,
    $scale: number,
    $theme: Theme,
    $direction: "horizontal" | "vertical",
    $localeDir: "ltr" | "rtl",
}> `
    width: 100%;
    height: 100%;
    opacity: ${$ => $.$forced_invisible ? 0 : $.$scale};
    transform: scale(${$ => $.$scale});
    transition: opacity 0.3s ${open ? "ease-out" : "ease-in"}, transform 0.3s ${open ? "ease-out" : "ease-in"};

    &::-webkit-scrollbar {
        width: 12px;
        height: 12px;
        background: ${$ => $.$theme.colors.scrollBarTrack};
    }

    &::-webkit-scrollbar-thumb {
        background: ${$ => $.$theme.colors.scrollBarThumb};
        border-radius: 0;
    }

    & .${labelClass} {
        overflow: hidden;
        word-break: none;
        color: ${$ => $.$theme.colors.foreground};
        font-size: 1.2rem;
        font-weight: lighter;
    }

    & .${labelClass}:hover {
        background: ${$ => Color($.$theme.colors.foreground).alpha(0.1).toString()};
    }

    & .${tileClass} {
        overflow: hidden;
        outline: 0.11rem solid ${$ => Color($.$theme.colors.foreground).alpha(0.2).toString()};
        border: none;
        font-family: ${fontFamily};
        font-size: ${fontSize};
        color: ${$ => $.$theme.colors.foreground};
        transform-style: preserve-3d;
        width: 100%;
        height: 100%;
    }

    & .${tileClass}[data-selection-mode="true"] {
        opacity: 0.7;
    }

    & .${tileClass}[data-drag-n-drop-mode="true"] {
        scale: 0.9;
    }

    & .${tileClass}[data-dragging="true"] {
        opacity: 0.6;
    }

    & .${tileClass}:hover:not(:disabled),
    & .${tileClass}:focus:not(:disabled) {
        outline: 0.17rem solid ${$ => Color($.$theme.colors.foreground).alpha(0.3).toString()};
    }

    & .${tileClass}:disabled {
        opacity: 0.5;
    }

    & .${tilePageClass} {
        display: flex;
        flex-direction: column;
        position: absolute;
        width: 100%;
        height: 100%;
    }

    & .${tileIconWrapClass} {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-grow: 2;
    }

    & .${tileIconClass} {
        width: 4.4rem;
        height: 4.4rem;
    }

    & .${tileLabelClass} {
        font-size: 0.8rem;
        padding: 0.2rem 0.3rem;
    }

    & .Tile[data-size="small"] .${tileIconClass} {
        width: 2.5rem;
        height: 2.5rem;
    }

    & .Tile[data-size="small"] .${tileLabelClass} {
        display: none;
    }

    & .${tileClass} .${tileCheckedRectClass} {
        position: absolute;
        right: -7rem;
        top: -7rem;
        padding: 0.5rem;
        width: 9rem;
        height: 9rem;
        background: ${$ => $.$theme.colors.primary};
        color: ${$ => $.$theme.colors.primaryForeground};
        transform: rotate(45deg);
        visibility: hidden;
    }

    & .${tileClass}[data-checked="true"] .${tileCheckedRectClass} {
        visibility: visible;
    }

    & .${tileClass} .${tileCheckedIconClass} {
        background: url("${getIcon("checked", "white")}") no-repeat;
        background-position: center;
        background-size: contain;
        width: ${pointsToRem(5)};
        height: ${pointsToRem(5)};
        vertical-align: middle;
        transform: rotate(-45deg) translate(-2.9rem, 8.4rem);
    }
`;

/**
 * Represents a container of Metro tiles.
 */
export function Tiles(options: TilesOptions)
{
    assert(options.direction == "horizontal", "Vertical tiles not supported currently.");

    // Use theme
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);
    
    // Misc vars
    const {controller: tiles_controller } = options;
    const tiles_state = new TilesState();

    // Refs
    const div_ref = useRef<HTMLDivElement | null>(null);

    // Open/close
    const open = options.open ?? true;
    const [forced_invisible, set_forced_invisible] = useState<boolean>(true);
    const [scale, set_scale] = useState<number>(open ? 0 : 1);

    // Rem
    const rem = useRef<number>(16);
    
    // Tiles1
    let tiles1: Tiles1 | null = null;

    // Modes
    let selection_mode = false;
    let drag_n_drop_mode = false;

    // Initialize Tiles1 instance
    function init_tiles1(): void
    {
        tiles1 = new Tiles1({
            element: div_ref.current!,
            direction: "horizontal",
            labelClassName: labelClass,
            tileClassName: tileClass,
            smallSize: 3.625,
            tileGap: 0.6,
            groupGap: 9,
            labelHeight: 3,
            maxHeight: 6,
            scrollNode: options.scrollNode.current!,
            tileTransition: "opacity 0.2s, transform 0.2s ease-out, scale 0.2s ease-out",
        });

        // On state update
        tiles1.addEventListener("stateUpdated", ({ detail: state }) => {
            tiles_state._clear_and_set1(state);
            options.stateUpdated?.(tiles_state);
        });

        tiles1.addEventListener("dragStart", ({ detail: { tile: el } }) => {
            if (el.getAttribute("data-drag-n-drop-mode") == "true") return;
        });

        tiles1.addEventListener("drag", ({ detail: { tile: el } }) => {
            if (el.getAttribute("data-dragging") != "true")
            {
                el.style.transform = el.getAttribute("data-transform-3d");
                return;
            }

            el.style.transform = "";
            if (!drag_n_drop_mode)
                mode_signal({ dragNDrop: true });
        });

        tiles1.addEventListener("dragEnd", ({ detail: { tile: el } }) => {
            mode_signal({ dragNDrop: false });
        });
    }

    // Detect a mode change
    function mode_signal(params: { dragNDrop?: boolean, selection?: boolean }):void
    {
        if (params.dragNDrop)
        {
            drag_n_drop_mode = true;

            // Set data-drag-n-drop-mode="true" attribute to tiles
            for (const tile_btn of div_ref.current!.querySelectorAll("." + tileClass))
                tile_btn.setAttribute("data-drag-n-drop-mode", "true");
        }
        else if (params.dragNDrop !== undefined)
        {
            drag_n_drop_mode = false;

            // Remove data-drag-n-drop-mode attribute from tiles
            for (const tile_btn of div_ref.current!.querySelectorAll("." + tileClass))
                tile_btn.removeAttribute("data-drag-n-drop-mode");
        }

        if (params.selection)
        {
            selection_mode = true;

            // Set data-selection-mode="true" attribute to tiles
            for (const tile_btn of div_ref.current!.querySelectorAll("." + tileClass))
                tile_btn.setAttribute("data-selection-mode", "true");
        }
        else if (params.selection !== undefined)
        {
            selection_mode = false;

            // Remove data-selection-mode attribute from tiles
            for (const tile_btn of div_ref.current!.querySelectorAll("." + tileClass))
                tile_btn.removeAttribute("data-selection-mode");
        }
    }

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
        // Initialize Tiles1 instance
        init_tiles1();

        return () => {
            // Destroy Tiles1 instance
            tiles1?.destroy();

            // Dipose listeners on TilesController
            tiles_controller.removeEventListener("getChecked", tiles_controller_onGetChecked);
            tiles_controller.removeEventListener("addTile", tiles_controller_addTile);
            tiles_controller.removeEventListener("addGroup", tiles_controller_addGroup);
            tiles_controller.removeEventListener("removeGroup", tiles_controller_removeGroup);
        };
    }, []);

    function assert_tiles1_initialized(): void
    {
        assert(!!tiles1, "Tiles not initialized yet. Make sure to run initialization code within useEffect.");
    }

    // Handle request to get checked tiles
    function tiles_controller_onGetChecked(e: CustomEvent<{ requestId: string }>)
    {
        const div = div_ref.current;
        let tiles: string[] = [];
        if (div)
        {
            tiles = Array.from(div.querySelectorAll("." + tileClass))
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
        viewport_pointerUp = local_viewport_pointerUp;

        // Slightly rotate tile depending on where the click occurred.
        const deg = 5;
        const rect = tilting_button.getBoundingClientRect();
        const x = e.clientX, y = e.clientY;
        let rotate_3d = "";
        if (x < rect.left + rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(0, -1, 0, ${deg}deg)`;
        else if (x > rect.right - rect.width / 2 && (y > rect.top + rect.height / 3 && y < rect.bottom - rect.height / 3))
            rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(0, 1, 0, ${deg}deg)`;
        else if (y < rect.top + rect.height / 2)
            rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(1, 0, 0, ${deg}deg)`;
        else
            rotate_3d = `perspective(${rect.width / rem.current!}rem) rotate3d(-1, 0, 0, ${deg}deg)`;

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

    // Handle context menu on tile
    function tile_onContextMenu(e: Event): void
    {
        const tile_button = e.currentTarget as HTMLButtonElement;
        if (tile_button.getAttribute("data-checked") == "true")
        {
            tile_button.setAttribute("data-checked", "false");
            const all_buttons_unchecked = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
                .every(btn => btn.getAttribute("data-checked") !== "true");
            if (all_buttons_unchecked)
                mode_signal({ selection: false });
            return;
        }
        tile_button.setAttribute("data-checked", "true");
        mode_signal({ selection: true });
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
        assert_tiles1_initialized();
        assert(!tiles_state.tileExists(tile.id), "Duplicate tile: " + tile.id);
        assert(tiles_state.groupExists(tile.group), "Group not found: " + tile.group);

        const element = tiles1.addTile({
            id: tile.id,
            group: tile.group,
            x: tile.x,
            y: tile.y,
            size: tile.size,
        });
        element.addEventListener("pointerdown", tile_onPointerDown);
        element.addEventListener("pointerover", tile_onPointerOver);
        element.addEventListener("pointerout", tile_onPointerOut);
        element.addEventListener("contextmenu", tile_onContextMenu);

        element.innerHTML = `
            <div class="${tileCheckedRectClass}">
                <div class="${tileCheckedIconClass}"></div>
            </div>
        `;

        // Color
        const tile_color_b1 = Color(tile.color).lighten(0.15).hex().toString();
        element.setAttribute("data-color", tile.color);
        element.style.background = `linear-gradient(90deg, ${tile.color} 0%, ${tile_color_b1} 100%)`;

        // Initialize pages
        set_tile_pages(tile.id, tile.icon, tile.label, tile.livePages);

        const state1 = tiles1.state.tiles.get(tile.id);
        tiles_state.tiles.set(tile.id, {
            x: state1.x,
            y: state1.y,
            size: state1.size,
            group: state1.group,
            color: tile.color,
        });
    }
    tiles_controller.addEventListener("addTile", tiles_controller_addTile);

    // Set tile pages
    function set_tile_pages(tile: string, icon: string | undefined, label: string | undefined, livePages: LiveTilePage[] | undefined): void
    {
        assert(livePages ? livePages!.length <= 3 : true, "livePages.length must be <= 3.");

        const button = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
            .find(btn => btn.getAttribute("data-id") == tile);
        if (!button) return;

        for (const page of Array.from(button.querySelectorAll("." + tilePageClass)))
            page.remove();

        // Use the checked rect as a reference to before where page divs are added.
        const checked_rect = button.querySelector("." + tileCheckedRectClass)! as HTMLDivElement;

        // Collect page elements to setup their animation later.
        const page_elements: HTMLDivElement[] = [];

        if (icon || label)
        {
            const page_el = document.createElement("div");
            page_el.classList.add(tilePageClass);
            page_elements.push(page_el);

            const icon_wrap_el = document.createElement("div");
            icon_wrap_el.classList.add(tileIconWrapClass);
            page_el.appendChild(icon_wrap_el);

            if (icon)
            {
                const icon_el = document.createElement("div");
                icon_el.classList.add(tileIconClass);
                icon_el.style.background = `url("${icon}") center no-repeat`;
                icon_el.style.backgroundSize = "contain";
                icon_wrap_el.appendChild(icon_el);
            }

            label ??= "";
            label = label.length >= 40 ? label.slice(0, 40) + "..." : label;

            const label_el = document.createElement("div");
            label_el.classList.add(tileLabelClass);
            label_el.innerText = label;
            page_el.appendChild(label_el);
        }

        if (livePages)
        {
            for (const page of livePages)
            {
                const page_el = document.createElement("div");
                page_el.classList.add(tilePageClass);
                if (page.id)
                    page_el.id = page.id;
                page_el.innerHTML = page.html;
                page_elements.push(page_el);
            }
        }

        // Setup animation
        fixme();
    }

    // Handle adding groups
    function tiles_controller_addGroup(e: CustomEvent<TileGroup>): void
    {
        add_group(e.detail);
    }
    function add_group(group: TileGroup): void
    {
        assert_tiles1_initialized();
        assert(!tiles_state.groupExists(group.id), "Duplicate group ID: " + group.id);;
        
        const group_button = tiles1!.addGroup({
            id: group.id,
            label: group.label,
        });
    }
    tiles_controller.addEventListener("addGroup", tiles_controller_addGroup);

    // Remove group
    function tiles_controller_removeGroup(e: CustomEvent<string>): void
    {
        remove_group(e.detail);
    }
    function remove_group(group_id: string): void
    {
        assert_tiles1_initialized();
        tiles1.removeGroup(group_id);
    }
    tiles_controller.addEventListener("removeGroup", tiles_controller_removeGroup);

    useEffect(() => {
        setTimeout(() => {
            set_forced_invisible((options.open ?? true) ? false : true);
        }, 100);
    }, [options.open]);

    return (
        <Div
            className="Tiles"
            style={options.style}
            $forced_invisible={forced_invisible}
            $scale={scale}
            $theme={theme}
            $direction={options.direction}
            $localeDir={localeDir}>

            <div ref={div_ref}></div>
        </Div>
    );
}

export type TilesOptions = {
    /**
     * The tile controller allows controlling which tiles are checked (selected)
     * and their sizes.
     */
    controller: TilesController,
 
    direction: "horizontal" | "vertical",

    /**
     * The scroll node relative to the container.
     */
    scrollNode: React.RefObject<HTMLElement | null>,

    /**
     * Whether to display open or close transition.
     * Displays a scale/opacity transition when visibility changes.
     *
     * @default true
     */
    open?: boolean,

    style?: React.CSSProperties,

    /**
     * Event that triggers when the state is updated.
     */
    stateUpdated?: (state: TilesState) => void,
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

    /**
     * Horizontal position in small tile units. -1 (default)
     * indicates last position.
     *
     * @default -1
     */
    x?: number,

    /**
     * Vertical position in small tile units. -1 (default)
     * indicates last position.
     *
     * @default -1
     */
    y?: number,

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
     * with rolling animation, each element of
     * this array being a page of the tile.
     *
     * **Note:** this property may contain at most 3 elements.
     */
    livePages?: LiveTilePage[],
};

export type LiveTilePage = {
    /**
     * Contributes an `id` attribute to the page element that contains
     * the `html` content, which may be queried through `querySelector()`
     * in the tile's button element.
     */
    id?: string,
    html: string,
};

export type TileGroup = {
    id: string,
    label?: string,
};

/**
 * The state of a `Tiles` component, containing positions and labels.
 */
export class TilesState
{
    groups: Map<string, { index: number, label: string }> = new Map();
    tiles: Map<string, { size: TileSize, x: number, y: number, group: string, color: string }> = new Map();

    /**
     * Constructs `State` from JSON. The `object` argument
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
                label: String(o1.label),
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
                color: String(o1.color),
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
                label: g.label,
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
                color: t.color,
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
                label: group.label,
            });
        }
        for (const [id, tile] of state.tiles)
        {
            this.tiles.set(id, {
                size: tile.size,
                x: tile.x,
                y: tile.y,
                group: tile.group,
                color: tile.color,
            });
        }
    }

    /** @private */
    _clear_and_set1(state: Tiles1State): void
    {
        const k_tile_colors = Array.from(this.tiles.entries())
            .map(([id, tile]) => [id, tile.color]);
        this.clear();
        for (const [id, group] of state.groups)
        {
            this.groups.set(id, {
                index: group.index,
                label: group.label,
            });
        }
        for (const [id, tile] of state.tiles)
        {
            const k_color = k_tile_colors.find(([id1, color]) => id == id1);
            this.tiles.set(id, {
                size: tile.size,
                x: tile.x,
                y: tile.y,
                group: tile.group,
                color: k_color?.[1] ?? "#724",
            });
        }
    }

    clone(): TilesState
    {
        const r = new TilesState();
        r.set(this);
        return r;
    }

    groupExists(id: string): boolean
    {
        return this.groups.has(id);
    }

    tileExists(id: string): boolean
    {
        return this.tiles.has(id);
    }
}

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