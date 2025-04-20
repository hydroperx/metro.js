import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { styled, keyframes } from "styled-components";
import Keyframes from "styled-components/dist/models/Keyframes";
import assert from "assert";
import Color from "color";
import { TypedEventTarget } from "@hydroper/typedeventtarget";
import { Tiles as Tiles1, TileSize, State as Tiles1State } from "@hydroper/tiles";
import { IconRegistry } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryContext, Theme } from "../theme";
import { RootFontObserver } from "../utils/RootFontObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize } from "../utils/common";
import { randomHexLarge } from "../utils/random";

// Cascading animations
import "./Tiles.css";

export type { TileSize } from "@hydroper/tiles";

const tileClass = "Tile";
const tileIconWrapClass = "Tile-icon-wrap";
const tileIconClass = "Tile-icon";
const tileLabelClass = "Tile-label";
// Tile pages are the different slide contents a tile
// may display one at a time.
const tilePageClass = "Tile-page";
const tileCheckedRectClass = "Tile-checked-rect";
const tileCheckedIconClass = "Tile-checked-icon";
const placeholderClass = "Tile-placeholder";
const labelClass = "Tile-group-label";
const labelInputClass = "Tile-group-label-input";

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
        font-family: ${fontFamily};
        font-size: 1.2rem;
        font-weight: lighter;
    }

    & .${labelClass}:hover {
        background: ${$ => Color($.$theme.colors.foreground).alpha(0.1).toString()};
    }
    
    & .${labelInputClass} {
        background: none;
        padding: 0;
        margin: 0;
        outline: none;
        border: none;
        width: 100%;
        height: 100%;
        word-break: none;
        color: ${$ => $.$theme.colors.foreground};
        font-family: ${fontFamily};
        font-size: 1.2rem;
        font-weight: lighter;
    }

    & .${placeholderClass} {
        outline: 0.15rem solid ${$ => Color($.$theme.colors.foreground).alpha(0.3).toString()};
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
        scale: 0.92;
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
        left: 0;
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
        font-size: 0.75rem;
        padding: 0.2rem 1rem;
        text-align: left;
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
        background: url("${$ => IconRegistry.get("checked", Color($.$theme.colors.primaryForeground).isDark() ? "black" : "white")}") no-repeat;
        background-position: center;
        background-size: contain;
        width: ${pointsToRem(5)};
        height: ${pointsToRem(5)};
        vertical-align: middle;
        transform: rotate(-45deg) translate(-2.9rem, 8.4rem);
    }
`;

// Slide-Y animation
const slide_y_page_duration = 5; // secs

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
    const tiles_pages = new Map<string, { icon: string | undefined, label: string | undefined, livePages: LiveTilePage[] | undefined }>();

    // Refs
    const div_ref = useRef<HTMLDivElement | null>(null);

    // Open/close
    const open = options.open ?? true;
    const [forced_invisible, set_forced_invisible] = useState<boolean>(true);
    const [scale, set_scale] = useState<number>(open ? 0 : 1);

    // Label events
    let label_click_out_handler: any = null;

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
            placeholderClassName: placeholderClass,
            smallSize: 3.625,
            tileGap: 0.6,
            groupGap: 9,
            labelHeight: 3,
            maxHeight: 6,
            tileTransition: "opacity 0.2s, transform 0.2s ease-out, scale 0.2s ease-out",
        });

        // On state update
        tiles1.addEventListener("stateUpdated", ({ detail: state }) => {
            tiles_state._clear_and_set1(state);
            options.stateUpdated?.(tiles_state);
        });

        // On drag start
        tiles1.addEventListener("dragStart", ({ detail: { tile: el } }) => {
            if (el.getAttribute("data-drag-n-drop-mode") == "true") return;
        });

        // On drag move
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

        // On drag end
        tiles1.addEventListener("dragEnd", ({ detail: { tile: el } }) => {
            mode_signal({ dragNDrop: false });
        });

        // On tile added
        tiles1.addEventListener("addedTile", ({ detail: { tile, button } }) => {
            let contextTimeout = -1,
                contextTimestamp = -1;

            button.addEventListener("touchstart", e => {
                contextTimeout = window.setTimeout(() => {
                    // do not simulate context menu if dragging tile
                    if (button.getAttribute("data-dragging") == "true")
                        return;

                    // holding long on a tile will check it
                    // (simulated context menu)
                    tile_simulated_context_menu(button);
                    contextTimestamp = Date.now();
                }, 600);
            });
            button.addEventListener("touchend", e => {
                if (contextTimeout !== -1)
                    window.clearTimeout(contextTimeout),
                    contextTimeout = -1;
            });
            button.addEventListener("touchcancel", e => {
                if (contextTimeout !== -1)
                    window.clearTimeout(contextTimeout),
                    contextTimeout = -1;
            });
            button.addEventListener("click", e => {
                if (contextTimeout !== -1)
                    window.clearTimeout(contextTimeout),
                    contextTimeout = -1;
                // a click in a tile
                if (contextTimestamp === -1 || contextTimestamp < Date.now() - 100)
                {
                    // during selection mode a click is a simulated context menu event
                    if (button.getAttribute("data-selection-mode") === "true")
                        tile_simulated_context_menu(button);
                    else options.tileClick?.((e.currentTarget as HTMLButtonElement).getAttribute("data-id"));

                    contextTimestamp = -1;
                }
            });
        });

        // On group added
        tiles1.addEventListener("addedGroup", ({ detail: { group, label } }) => {
            // On label click, make it editable
            label.addEventListener("click", e => {
                // If already editing, do nothing.
                if (label.querySelector("input")) return;

                const initial_text = label.innerText;
                label.innerHTML = `<input type="text" class="${labelInputClass}">`;

                const input = label.querySelector("input") as HTMLInputElement;
                input.value = initial_text;
                input.focus();
                input.selectionStart = input.value.length;

                // Handle input key presses (escape and enter)
                input.addEventListener("keydown", e => {
                    switch (e.key.toLowerCase())
                    {
                        case "enter":
                        {
                            save_label();
                            break;
                        }
                        case "escape":
                        {
                            cancel_label();
                            break;
                        }
                    }
                });
                
                const save_label = () => {
                    // turn label ineditable and save new value
                    const label_val = input.value;
                    label.innerHTML = "";
                    tiles1.renameGroup(group.id, label_val);

                    clear_handler();
                };
                
                const cancel_label = () => {
                    // turn label ineditable and discard last typed value
                    label.innerHTML = "";
                    const group_state = tiles1.state.groups.get(group.id);
                    if (group_state)
                        label.innerText = group_state.label;

                    clear_handler();
                };

                const clear_handler = () => {
                    // remove click out handler
                    if (label_click_out_handler === new_label_click_out_handler)
                    {
                        window.removeEventListener("click", label_click_out_handler);
                        label_click_out_handler = null;
                    }
                };

                // Handle click out
                if (label_click_out_handler)
                {
                    label_click_out_handler();
                    window.removeEventListener("click", label_click_out_handler);
                }
                const new_label_click_out_handler = (e: MouseEvent) => {
                    if (label.matches(":hover")) return;
                    save_label();
                };
                label_click_out_handler = new_label_click_out_handler;
                window.addEventListener("click", label_click_out_handler);
            });
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

    function assert_tiles1_initialized(): void
    {
        assert(!!tiles1, "Tiles not initialized yet. Make sure to run initialization code within useEffect of [] (empty) dependencies.");
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

    // Handle request to determine whether a tile exists or not.
    function tiles_controller_onTileExists(e: CustomEvent<{ requestId: string, tile: string }>)
    {
        tiles_controller.dispatchEvent(new CustomEvent("tileExistsResult", {
            detail: {
                requestId: e.detail.requestId,
                value: tiles1.state.tileExists(e.detail.tile),
            },
        }));
    }
    tiles_controller.addEventListener("tileExists", tiles_controller_onTileExists);

    // Handle request to determine whether a group exists or not.
    function tiles_controller_onGroupExists(e: CustomEvent<{ requestId: string, group: string }>)
    {
        tiles_controller.dispatchEvent(new CustomEvent("groupExistsResult", {
            detail: {
                requestId: e.detail.requestId,
                value: tiles1.state.groupExists(e.detail.group),
            },
        }));
    }
    tiles_controller.addEventListener("groupExists", tiles_controller_onGroupExists);

    // Handle request to get a tile's button
    function tiles_controller_onGetTileButton(e: CustomEvent<{ requestId: string, tile: string }>)
    {
        const div = div_ref.current;
        let button: HTMLButtonElement | null = null;
        if (div)
        {
            button = (Array.from(div.querySelectorAll("." + tileClass))
                .find(btn => btn.getAttribute("data-id") == e.detail.tile) ?? null) as HTMLButtonElement | null;
        }
        tiles_controller.dispatchEvent(new CustomEvent("getTileButtonResult", {
            detail: {
                requestId: e.detail.requestId,
                button,
            },
        }));
    }
    tiles_controller.addEventListener("getTileButton", tiles_controller_onGetTileButton);

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
        tile_simulated_context_menu(e.currentTarget as HTMLButtonElement);
    }
    function tile_simulated_context_menu(tile_button: HTMLButtonElement): void
    {
        if (tile_button.getAttribute("data-checked") == "true")
        {
            tile_button.setAttribute("data-checked", "false");
            const all_buttons = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
                .map(btn => [btn.getAttribute("data-id"), btn.getAttribute("data-checked") === "true"]);
            if (all_buttons.every(([, y]) => !y))
                mode_signal({ selection: false });
            options.checkedChange?.(all_buttons.filter(([, y]) => y).map(([id]) => id as string));
            return;
        }
        tile_button.setAttribute("data-checked", "true");
        mode_signal({ selection: true });
        const all_buttons = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
            .map(btn => [btn.getAttribute("data-id"), btn.getAttribute("data-checked") === "true"]);
        options.checkedChange?.(all_buttons.filter(([, y]) => y).map(([id]) => id as string));
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

    // Handle window key press
    function on_key_down(e: KeyboardEvent): void
    {
        // Ctrl+A
        if (e.key.toLowerCase() == "a" && e.ctrlKey && !e.shiftKey && !e.altKey)
        {
            const buttons = Array.from(div_ref.current!.querySelectorAll("." + tileClass)) as HTMLButtonElement[];
            for (const button of buttons)
            {
                button.setAttribute("data-checked", "true");
            }
            if (buttons.length != 0)
                mode_signal({ selection: true });
            options.checkedChange?.(buttons.map(btn => btn.getAttribute("data-id")));
        }
    }

    // Handle clicks on container
    function on_click(e: MouseEvent): void
    {
        const buttons = Array.from(div_ref.current!.querySelectorAll("." + tileClass)) as HTMLButtonElement[];
        const hovering_a_button = buttons.some(btn => btn.matches(":hover"));
        if (!hovering_a_button)
        {
            // Deselect tiles
            for (const button of buttons)
            {
                button.removeAttribute("data-checked");
            }
            mode_signal({ selection: false });
            options.checkedChange?.([]);
        }
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

        // Initialize state
        const state1 = tiles1.state.tiles.get(tile.id);
        tiles_state.tiles.set(tile.id, {
            x: state1.x,
            y: state1.y,
            size: state1.size,
            group: state1.group,
            color: tile.color,
        });

        // Initialize pages
        set_tile_pages(tile.id, tile.icon, tile.label, tile.livePages);
    }
    tiles_controller.addEventListener("addTile", tiles_controller_addTile);

    // Remove tile
    function tiles_controller_removeTile(e: CustomEvent<string>): void
    {
        remove_tile(e.detail);
    }
    function remove_tile(tile_id: string): void
    {
        assert_tiles1_initialized();
        tiles1.removeTile(tile_id);
        tiles_pages.delete(tile_id);

        const button = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
            .find(btn => btn.getAttribute("data-id") === tile_id) as HTMLButtonElement | undefined;
        if (button && button.getAttribute("data-dragging") === "true")
            mode_signal({ dragNDrop: false });
    }
    tiles_controller.addEventListener("removeTile", tiles_controller_removeTile);

    // Resize tile
    function tiles_controller_resizeTile(e: CustomEvent<{ id: string, value: TileSize }>): void
    {
        resize_tile(e.detail.id, e.detail.value);
    }
    function resize_tile(tile_id: string, size: TileSize): void
    {
        assert_tiles1_initialized();
        tiles1.resizeTile(tile_id, size);
        const pages = tiles_pages.get(tile_id);
        if (pages)
            set_tile_pages(tile_id, pages.icon, pages.label, pages.livePages);
    }
    tiles_controller.addEventListener("resizeTile", tiles_controller_resizeTile);

    // Set whether tile is checked or not
    function tiles_controller_setChecked(e: CustomEvent<{ id: string, value: boolean }>): void
    {
        set_checked(e.detail.id, e.detail.value);
    }
    function set_checked(tile_id: string, value: boolean): void
    {
        const buttons = Array.from(div_ref.current!.querySelectorAll("." + tileClass)) as HTMLButtonElement[];
        const this_button = buttons.find(btn => btn.getAttribute("data-id") === tile_id);
        if (this_button)
        {
            if (value)
                this_button.setAttribute("data-checked", "true");
            else this_button.removeAttribute("data-checked");

            // Mode change
            const checked_tiles = buttons
                .filter(btn => btn.getAttribute("data-checked") === "true")
                .map(btn => btn.getAttribute("data-id"));
            mode_signal({ selection: checked_tiles.length != 0 });

            // Trigger checkedChange event
            options.checkedChange?.(checked_tiles);
        }
    }
    tiles_controller.addEventListener("setChecked", tiles_controller_setChecked);

    // Unchecks all tiles.
    function tiles_controller_uncheckAll(e: Event): void
    {
        const buttons = Array.from(div_ref.current!.querySelectorAll("." + tileClass)) as HTMLButtonElement[];
        for (const button of buttons)
            button.removeAttribute("data-checked");

        // Mode change
        mode_signal({ selection: false });

        // Trigger checkedChange event
        options.checkedChange?.([]);
    }
    tiles_controller.addEventListener("uncheckAll", tiles_controller_uncheckAll);

    // Recolor tile
    function tiles_controller_setTileColor(e: CustomEvent<{ id: string, value: string }>): void
    {
        set_tile_color(e.detail.id, e.detail.value);
    }
    function set_tile_color(tile_id: string, color: string): void
    {
        assert_tiles1_initialized();

        const state = tiles_state.tiles.get(tile_id);
        if (!state) return;

        const element = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
            .find(btn => btn.getAttribute("data-id") == tile_id) as HTMLButtonElement | undefined;
        if (!element) return;

        const tile_color_b1 = Color(color).lighten(0.15).hex().toString();
        element.setAttribute("data-color", color);
        element.style.background = `linear-gradient(90deg, ${color} 0%, ${tile_color_b1} 100%)`;
        state.color = color;

        options.stateUpdated?.(tiles_state);
    }
    tiles_controller.addEventListener("setTileColor", tiles_controller_setTileColor);

    // Set tile pages
    function tiles_controller_setTilePages(e: CustomEvent<{ id: string, icon?: string, label?: string, livePages?: LiveTilePage[] }>): void
    {
        assert_tiles1_initialized();
        set_tile_pages(e.detail.id, e.detail.icon, e.detail.label, e.detail.livePages);
    }
    function set_tile_pages(tile: string, icon: string | undefined, label: string | undefined, livePages: LiveTilePage[] | undefined): void
    {
        assert(livePages ? livePages!.length <= 2 : true, "livePages.length must be <= 2.");

        const button = Array.from(div_ref.current!.querySelectorAll("." + tileClass))
            .find(btn => btn.getAttribute("data-id") == tile);
        if (!button) return;

        for (const page of Array.from(button.querySelectorAll("." + tilePageClass)))
            page.remove();

        tiles_pages.set(tile, { icon, label, livePages });

        // Retrieve state
        const state = tiles_state.tiles.get(tile);

        // Use the checked rect as a reference to before where page divs are added.
        const checked_rect = button.querySelector("." + tileCheckedRectClass)! as HTMLDivElement;

        // Collect page elements to setup their animation later.
        const page_elements: HTMLDivElement[] = [];

        if (icon || label)
        {
            const page_el = document.createElement("div");
            page_el.classList.add(tilePageClass);
            page_elements.push(page_el);
            button.insertBefore(page_el, checked_rect);

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

        if (state?.size !== "small")
        {
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
                    button.insertBefore(page_el, checked_rect);
                }
            }
        }

        // Setup animation
        let anim_prefix_1 = page_elements.length <= 1 ? "" : "Tiles_slide_y_" + page_elements.length;
        for (let page_i = 0; page_i < page_elements.length; page_i++)
        {
            const page_el = page_elements[page_i];
            page_el.style.top = page_i == 0 ? "0%" : "100%";
            if (anim_prefix_1)
            {
                page_el.style.animationName = anim_prefix_1 + "_" + (page_i + 1);
                page_el.style.animationDuration = (page_elements.length * slide_y_page_duration) + "s";
                page_el.style.animationIterationCount = "infinite";
            }
        }
    }
    tiles_controller.addEventListener("setTilePages", tiles_controller_setTilePages);

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

    // Rename group
    function tiles_controller_renameGroup(e: CustomEvent<{ id: string, value: string }>): void
    {
        rename_group(e.detail.id, e.detail.value);
    }
    function rename_group(group_id: string, label: string): void
    {
        assert_tiles1_initialized();
        tiles1.renameGroup(group_id, label);
    }
    tiles_controller.addEventListener("renameGroup", tiles_controller_renameGroup);

    // Observe rem
    useEffect(() => {
        const root_font_observer = new RootFontObserver(value => {
            rem.current = value;
        });
        return () => {
            root_font_observer.cleanup();
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
        setTimeout(() => {
            set_forced_invisible((options.open ?? true) ? false : true);
        }, 100);
    }, [options.open]);

    useEffect(() => {
        // Initialize Tiles1 instance
        init_tiles1();

        // Window events
        window.addEventListener("keydown", on_key_down);

        return () => {
            // Destroy Tiles1 instance
            tiles1?.destroy();

            // Dispose listeners on TilesController
            tiles_controller.removeEventListener("getTileButton", tiles_controller_onGetTileButton);
            tiles_controller.removeEventListener("getChecked", tiles_controller_onGetChecked);
            tiles_controller.removeEventListener("addTile", tiles_controller_addTile);
            tiles_controller.removeEventListener("resizeTile", tiles_controller_resizeTile);
            tiles_controller.removeEventListener("setTileColor", tiles_controller_setTileColor);
            tiles_controller.removeEventListener("setTilePages", tiles_controller_setTilePages);
            tiles_controller.removeEventListener("removeTile", tiles_controller_removeTile);
            tiles_controller.removeEventListener("tileExists", tiles_controller_onTileExists);
            tiles_controller.removeEventListener("addGroup", tiles_controller_addGroup);
            tiles_controller.removeEventListener("removeGroup", tiles_controller_removeGroup);
            tiles_controller.removeEventListener("groupExists", tiles_controller_onGroupExists);
            tiles_controller.removeEventListener("renameGroup", tiles_controller_renameGroup);
            tiles_controller.removeEventListener("setChecked", tiles_controller_setChecked);
            tiles_controller.removeEventListener("uncheckAll", tiles_controller_uncheckAll);

            // Disopse listeners on window
            window.removeEventListener("keydown", on_key_down);

            // Dispose of label handlers
            if (label_click_out_handler)
                window.removeEventListener("click", label_click_out_handler);
        };
    }, []);

    return (
        <Div
            className="Tiles"
            style={options.style}
            $forced_invisible={forced_invisible}
            $scale={scale}
            $theme={theme}
            $direction={options.direction}
            $localeDir={localeDir}
            onClick={on_click as any}>

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
     * Whether to display open or close transition.
     * Displays a 300ms scale/opacity transition when visibility changes.
     *
     * @default true
     */
    open?: boolean,

    style?: React.CSSProperties,

    /**
     * Event that triggers when the state is updated.
     */
    stateUpdated?: (state: TilesState) => void,

    /**
     * Event that triggers when any tiles are checked or unchecked.
     * The given `tiles` parameter contains the tiles that are
     * currently checked.
     */
    checkedChange?: (tiles: string[]) => void,

    /**
     * Event that triggers when a tile is clicked.
     */
    tileClick?: (tileId: string) => void,
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
     * **Note:** this property may contain at most 2 elements.
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
    tileExists: CustomEvent<{ requestId: string, tile: string }>;
    tileExistsResult: CustomEvent<{ requestId: string, value: boolean }>;
    removeTile: CustomEvent<string>;
    addGroup: CustomEvent<TileGroup>;
    groupExists: CustomEvent<{ requestId: string, group: string }>;
    groupExistsResult: CustomEvent<{ requestId: string, value: boolean }>;
    removeGroup: CustomEvent<string>;
    getChecked: CustomEvent<{ requestId: string }>;
    getCheckedResult: CustomEvent<{ requestId: string, tiles: string[] }>;
    getTileButton: CustomEvent<{ requestId: string, tile: string }>;
    getTileButtonResult: CustomEvent<{ requestId: string, button: HTMLButtonElement | null }>;
    setChecked: CustomEvent<{ id: string, value: boolean }>;
    uncheckAll: Event;
    resizeTile: CustomEvent<{ id: string, value: TileSize }>;
    setTileColor: CustomEvent<{ id: string, value: string }>;
    setTilePages: CustomEvent<{ id: string, icon?: string, label?: string, livePages?: LiveTilePage[] }>;
    renameGroup: CustomEvent<{ id: string, value: string }>;
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
     * Gets the button element corresponding to a tile.
     */
    tileButton(tile: string): Promise<HTMLButtonElement | null>
    {
        return new Promise((resolve, _) => {
            const requestId = randomHexLarge();
            const listener = (e: CustomEvent<{ requestId: string, button: HTMLButtonElement | null }>) => {
                if (e.detail.requestId !== requestId) return;
                this.removeEventListener("getTileButtonResult", listener)
                resolve(e.detail.button);
            };
            this.addEventListener("getTileButtonResult", listener);
            this.dispatchEvent(new CustomEvent("getTileButton", {
                detail: {
                    requestId,
                    tile,
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

    tileExists(tile_id: string): Promise<boolean>
    {
        return new Promise((resolve, _) => {
            const requestId = randomHexLarge();
            const listener = (e: CustomEvent<{ requestId: string, value: boolean }>) => {
                if (e.detail.requestId !== requestId) return;
                this.removeEventListener("tileExistsResult", listener)
                resolve(e.detail.value);
            };
            this.addEventListener("tileExistsResult", listener);
            this.dispatchEvent(new CustomEvent("tileExists", {
                detail: {
                    requestId,
                    tile: tile_id,
                },
            }));
        });
    }

    removeTile(id: string): void
    {
        this.dispatchEvent(new CustomEvent("removeTile", {
            detail: id,
        }));
    }

    addGroup(options: TileGroup): void
    {
        this.dispatchEvent(new CustomEvent("addGroup", {
            detail: options,
        }));
    }

    groupExists(group_id: string): Promise<boolean>
    {
        return new Promise((resolve, _) => {
            const requestId = randomHexLarge();
            const listener = (e: CustomEvent<{ requestId: string, value: boolean }>) => {
                if (e.detail.requestId !== requestId) return;
                this.removeEventListener("groupExistsResult", listener)
                resolve(e.detail.value);
            };
            this.addEventListener("groupExistsResult", listener);
            this.dispatchEvent(new CustomEvent("groupExists", {
                detail: {
                    requestId,
                    group: group_id,
                },
            }));
        });
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
     * Unchecks all tiles.
     */
    uncheckAll(): void
    {
        this.dispatchEvent(new Event("uncheckAll"));
    }

    /**
     * Sets the size of a tile.
     */
    resizeTile(id: string, value: TileSize): void
    {
        this.dispatchEvent(new CustomEvent("resizeTile", {
            detail: { id, value },
        }));
    }

    /**
     * Sets the color of a tile.
     */
    setTileColor(id: string, value: string): void
    {
        this.dispatchEvent(new CustomEvent("setTileColor", {
            detail: { id, value },
        }));
    }

    /**
     * Sets the pages of a tile (icon, label and live tile pages).
     */
    setTilePages(id: string, { icon, label, livePages }: { icon?: string, label?: string, livePages?: LiveTilePage[] }): void
    {
        this.dispatchEvent(new CustomEvent("setTilePages", {
            detail: { id, icon, label, livePages },
        }));
    }

    /**
     * Sets the label text of a group.
     */
    renameGroup(id: string, value: string): void
    {
        this.dispatchEvent(new CustomEvent("renameGroup", {
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