// Cascading animations
import "./Tiles/Tiles.css";

// third-party
import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { styled } from "styled-components";
import assert from "assert";
import { Color } from "@hydroperx/color";
import { TypedEventTarget } from "@hydroperx/event";
import { Tiles as BaseTiles, TileSize, State as BaseState } from "@hydroperx/tiles";

// local
import { IconRegistry } from "./Icon";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, Theme } from "../theme";
import { EMObserver } from "../utils/EMObserver";
import * as EMConvert from "../utils/EMConvert";
import { lighten, darken, enhance, contrast } from "../utils/ColorUtils";
import { randomHexLarge } from "../utils/RandomUtils";
import { escapeHTML } from "../utils/EscapeUtils";
import { TILES_OPEN_DELAY } from "../utils/Constants";

// TileSize
export type { TileSize } from "@hydroperx/tiles";

// Viewport mouse up handler
let viewport_pointerUp: Function | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("pointerup", (e) => {
    viewport_pointerUp?.(e);
  });
}

// CSS
const Div = styled.div<{
  $forced_invisible: boolean;
  $scale: number;
  $theme: Theme;
  $direction: "horizontal" | "vertical";
  $rtl: boolean;
  $open: boolean;
}>`
  && {
    ${$ => $.$direction == "vertical" ? `
      display: flex;
      flex-direction: column;
      align-items: center;
    ` : ""}
    opacity: ${($) => ($.$forced_invisible ? 0 : $.$scale)};
    transform: scale(${($) => $.$scale});
    transition:
      opacity 0.3s ${($) => ($.$open ? "ease-out" : "ease-in")},
      transform 0.3s ${($) => ($.$open ? "ease-out" : "ease-in")};
    color: ${($) => $.$theme.colors.foreground};
    padding: 0.5em 1.5em;
    width: 100%;
    height: 100%;
  }

  &&::-webkit-scrollbar {
    width: 12px;
    height: 12px;
    background: ${($) => $.$theme.colors.scrollBarTrack};
  }

  &&::-webkit-scrollbar-thumb {
    background: ${($) => $.$theme.colors.scrollBarThumb};
    border-radius: 0;
  }

  && .group-label {
    overflow: hidden;
    font-size: 1.2em;
    font-weight: lighter;
  }

  && .group-label:hover {
    background: ${($) =>
      Color($.$theme.colors.foreground).alpha(0.1).toString()};
  }

  && .group-label-input {
    background: none;
    padding: 0;
    margin: 0;
    outline: none;
    border: none;
    width: 100%;
    height: 100%;
    word-break: none;
    color: ${($) => $.$theme.colors.foreground};
    font-size: 1em;
    font-weight: lighter;
  }

  && .tile {
    border: none;
    background: none;
    outline: none;
    padding: 0;
    margin: 0;
    font-size: inherit;
  }

  && .tile-content {
    border: none;
    color: ${$ => $.$theme.colors.foreground};
    transform-style: preserve-3d;
    border: 0.13em solid ${$ => Color($.$theme.colors.foreground).alpha(0.2).toString()};
  }

  && .tile.transparent > .tile-content {
    border: 0.2em solid ${($) => Color($.$theme.colors.foreground).alpha(0.2).toString()};
  }

  && .tile-content {
    transition: opacity 0.2s, transform 0.2s ease-out, scale 0.2s ease-out;
  }

  && .tile[data-selection-mode="true"] >.tile-content {
    opacity: 0.7;
  }

  && .tile[data-drag-n-drop-mode="true"] > .tile-content {
    scale: 0.92;
  }

  && .tile[data-dragging="true"] > .tile-content {
    opacity: 0.6;
  }

  && .tile:hover:not(:disabled) > .tile-content,
  && .tile:focus:not(:disabled) > .tile-content {
    border: 0.13em solid ${($) => Color($.$theme.colors.foreground).alpha(0.3).toString()};
  }

  && .tile.transparent:hover:not(:disabled) > .tile-content {
    background: ${($) => Color($.$theme.colors.foreground).alpha(0.2).toString()};
  }

  && .tile.transparent:hover:not(:disabled) > .tile-content,
  && .tile.transparent:focus:not(:disabled) > .tile-content {
    border: 0.2em solid ${$ => Color($.$theme.colors.foreground).alpha(0.4).toString()};
  }

  && .tile:disabled {
    opacity: 0.5;
  }

  && .tile-page {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
  }

  && .tile-icon-wrap {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 2;
  }

  && .tile-icon {
    width: 4.4em;
    height: 4.4em;
  }

  && .tile-icon.high {
    width: 6.4em;
    height: 6.4em;
  }

  && .tile-icon.extra-high {
    width: 8.4em;
    height: 8.4em;
  }

  && .tile-label {
    font-size: 0.75em;
    padding: 0.2em 1em;
    text-align: left;
    z-index: 30;
  }

  && .tile .tile-heading-label {
    font-size: 1.2em;
    left: 0.2em;
    right: 0.2em;
    top: 0.7em;
  }

  ${$ => $.$direction == "horizontal" ? "" :
  `&& .tile[data-size="medium"] .tile-heading-label {
    font-size: 0.9em;
    left: 0.1em;
    right: 0.1em;
    top: 0.2em;
  }`}

  ${$ => $.$direction == "horizontal" ? "" :
  `&& .tile[data-size="wide"] .tile-heading-label {
    font-size: 1.1em;
    left: 0.1em;
    right: 0.1em;
    top: 0.3em;
  }`}

  && .tile[data-size="small"] .tile-icon {
    width: 2.5em;
    height: 2.5em;
  }

  && .tile[data-size="small"] .tile-icon.high {
    width: 3em;
    height: 3em;
  }

  && .tile[data-size="small"] .tile-icon.extra-high {
    width: 3.5em;
    height: 3.5em;
  }

  && .tile .tile-heading-content .tile-icon {
    object-fit: contain;
    width: 3em;
    height: auto;
  }

  && .tile[data-size="medium"] .tile-heading-content .tile-icon {
    width: 2.5em;
    height: auto;
  }

  && .tile[data-size="wide"] .tile-heading-content .tile-icon {
    width: 2.7em;
    height: auto;
  }

  && .tile[data-size="small"] .tile-label {
    display: none;
  }

  && .tile[data-size="small"] .tile-heading-label {
    display: none;
  }

  && .tile-heading-content {
    width: 100%;
    height: 100%;
    position: relative;
  }

  && .tile[data-size="small"] .tile-heading-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: static;
  }

  && .tile .tile-heading-content > .tile-icon {
    position: absolute;
    left: 0.2em;
    bottom: 0.7em;
  }

  && .tile[data-size="small"] .tile-heading-content > .tile-icon {
    position: static;
    left: 0;
    bottom: 0;
  }

  && .tile .tile-heading-content > .tile-icon {
    left: 0.1em;
    bottom: 0.2em;
  }

  && .tile .tile-checked-rect {
    position: absolute;
    right: -7em;
    top: -6em;
    padding: 0.5em;
    width: 9em;
    height: 9em;
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
    transform: rotate(45deg);
    visibility: hidden;
  }

  && .tile[data-checked="true"] .tile-checked-rect {
    visibility: visible;
  }

  && .tile .tile-checked-icon {
    background: url("${($) =>
        IconRegistry.get(
          "checked",
          Color($.$theme.colors.primaryForeground).isDark() ? "black" : "white",
        )}")
      no-repeat;
    background-position: center;
    background-size: contain;
    width: ${EMConvert.points.emUnit(15)};
    height: ${EMConvert.points.emUnit(15)};
    vertical-align: middle;
    transform: rotate(-45deg) translate(-3.2em, 6.9em);
  }
`;

// Slide-Y animation
const slide_y_page_duration = 5; // secs

/**
 * Represents a container of Metro tiles.
 */
export function Tiles(params: TilesParams) {
  // Use theme
  const theme = useContext(ThemeContext);

  // Locale direction
  const rtl = useContext(RTLContext);

  // Misc vars
  const { controller: tiles_controller } = params;
  const tiles_controller_reference = useRef<TilesController>(tiles_controller);
  const tiles_state = useRef<TilesState>(new TilesState());
  const tiles_pages = useRef(new Map<
    string,
    {
      icon: string | undefined;
      label: string | undefined;
      livePages: LiveTilePage[] | undefined;
      style: TileStyle | undefined;
      iconSize: TileIconSize | undefined;
    }
  >());

  // Refs
  const div_ref = useRef<HTMLDivElement | null>(null);
  const state_updated_handler_ref = useRef<undefined | ((state: TilesState) => void)>(undefined);
  const selection_change_handler_ref = useRef<undefined | ((tiles: string[]) => void)>(undefined);
  const click_handler_ref = useRef<undefined | ((id: string) => void)>(undefined);
  const drag_start_handler_ref = useRef<undefined | ((event: { id: string, button: HTMLButtonElement }) => void)>(undefined);
  const drag_handler_ref = useRef<undefined | ((event: { id: string, button: HTMLButtonElement }) => void)>(undefined);
  const drag_end_handler_ref = useRef<undefined | ((event: { id: string, button: HTMLButtonElement }) => void)>(undefined);

  // Open/close
  const open = params.open ?? true;
  const [forced_invisible, set_forced_invisible] = useState<boolean>(true);
  const [scale, set_scale] = useState<number>(0);

  // Label events
  let label_click_out_handler: any = null;

  // Root font size
  const em = useRef<number>(16);

  // BaseTiles
  const base_tiles = useRef<BaseTiles | null>(null);

  // Initial color cache for just added tiles.
  const initial_colors = useRef<Map<string, { color?: string, labelColor?: string }>>(new Map());

  // Modes
  const selection_mode = useRef<boolean>(false);
  const drag_n_drop_mode = useRef<boolean>(false);

  // Initialize BaseTiles instance
  function init_base_tiles(): void {
    base_tiles.current = new BaseTiles({
      element: div_ref.current!,
      direction: params.direction,
      dragEnabled: params.dragEnabled,
      selectionEnabled: params.selectionEnabled,
      classNames: {
        group: "group",
        groupLabel: "group-label",
        groupLabelText: "group-label-text",
        groupTiles: "group-tiles",
        tile: "tile",
        tileContent: "tile-content",
      },
      smallSize: params.direction == "horizontal" ? 3.625 : 2.5,
      tileGap: params.direction == "horizontal" ? 0.6 : 0.5,
      groupGap: params.direction == "horizontal" ? 9 : 2,
      labelHeight: params.direction == "horizontal" ? 3 : 2,
      // For horizontal containers
      height: 6,
      // For vertical containers
      groupWidth: params.groupWidth,
      // For vertical containers
      inlineGroups: params.inlineGroups,
    });

    // On state update
    base_tiles.current!.on("stateupdate", ({ detail: state }) => {
      tiles_state.current._clearAndSetBase(state);
      state_updated_handler_ref.current?.(tiles_state.current);
    });
    
    // On tile click
    base_tiles.current!.on("click", ({ detail: { tile } }) => {
      click_handler_ref.current?.(tile);
    });

    // On drag start
    base_tiles.current!.on("dragstart", ({ detail: { tile: el } }) => {
      // Enter drag-n-drop mode
      if (el.getAttribute("data-drag-n-drop-mode") != "true") {
        mode_signal({ dragNDrop: true });
      }
      // Trigger dragStart
      drag_start_handler_ref.current?.({ id: el.getAttribute("data-id")!, button: el });
    });

    // On drag move
    base_tiles.current!.on("drag", ({ detail: { tile: el } }) => {
      const content = el.getElementsByClassName("tile-content")[0] as HTMLElement;
      content.style.transform = "";

      // Trigger drag
      drag_handler_ref.current?.({ id: el.getAttribute("data-id")!, button: el });
    });

    // On drag end
    base_tiles.current!.on("dragend", ({ detail: { tile: el } }) => {
      // Exit drag-n-drop mode
      mode_signal({ dragNDrop: false });

      // Trigger dragEnd
      drag_end_handler_ref.current?.({ id: el.getAttribute("data-id")!, button: el });
    });

    // On selection change
    base_tiles.current!.on("selectionchange", ({ detail: { tiles } }) => {
      mode_signal({ selection: tiles.length != 0 });
      selection_change_handler_ref.current?.(tiles);
    });

    // On group added
    base_tiles.current!.on("addedgroup", ({ detail: { group, labelDiv } }) => {
      // Label text
      const labelTextDiv = labelDiv.getElementsByClassName("group-label-text")[0] as HTMLElement;

      // Drag cache
      let justDragged = false;

      // On pointer down
      labelDiv.addEventListener("pointerdown", e => {
        justDragged = false;
      });

      // On pointer move
      labelDiv.addEventListener("pointermove", e => {
        justDragged = group.div!.getAttribute("data-dragging") == "true";
      });

      // On label click, make it editable
      labelDiv.addEventListener("click", e => {
        // If just dragged, do nothing.
        if (justDragged) return;

        // If already editing, do nothing.
        if (labelTextDiv.querySelector("input")) return;

        const initial_text = labelTextDiv.innerText;
        labelTextDiv.innerHTML = `<input type="text" class="group-label-input">`;

        const input = labelTextDiv.querySelector("input") as HTMLInputElement;
        input.value = initial_text;
        input.focus();
        input.selectionStart = input.value.length;

        // Handle input key presses (escape and enter)
        input.addEventListener("keydown", (e) => {
          switch (e.key.toLowerCase()) {
            case "enter": {
              save_label();
              break;
            }
            case "escape": {
              cancel_label();
              break;
            }
          }
        });

        const save_label = () => {
          // turn label ineditable and save new value
          const label_val = input.value;
          labelTextDiv.innerHTML = "";
          base_tiles.current!.renameGroup(group.id, label_val);

          clear_handler();
        };

        const cancel_label = () => {
          // turn label ineditable and discard last typed value
          labelTextDiv.innerHTML = "";
          const group_state = base_tiles.current!.state.groups.get(group.id);
          if (group_state) labelTextDiv.innerText = group_state.label;

          clear_handler();
        };

        const clear_handler = () => {
          // remove click out handler
          if (label_click_out_handler === new_label_click_out_handler) {
            window.removeEventListener("click", label_click_out_handler);
            label_click_out_handler = null;
          }
        };

        // Handle click out
        if (label_click_out_handler) {
          label_click_out_handler();
          window.removeEventListener("click", label_click_out_handler);
        }
        const new_label_click_out_handler = (e: MouseEvent) => {
          const rect = labelDiv.getBoundingClientRect();
          if (e.clientX >= rect.x && e.clientY >= rect.y && e.clientX < rect.x + rect.width && e.clientY < rect.y + rect.height) {
            return;
          }
          save_label();
        };
        label_click_out_handler = new_label_click_out_handler;
        window.addEventListener("click", label_click_out_handler);
      });
    });

    // On tile added
    base_tiles.current!.on("addedtile", ({ detail: { tile, button, contentDiv } }) => {
      // Initial colors
      const { color, labelColor } = initial_colors.current.get(tile.id)!;
      initial_colors.current.delete(tile.id);

      tile.button!.addEventListener("pointerdown", tile_onPointerDown);
      tile.button!.addEventListener("pointerover", tile_onPointerOver);
      tile.button!.addEventListener("pointerout", tile_onPointerOut);

      contentDiv.innerHTML = `
        <div class="tile-checked-rect">
            <div class="tile-checked-icon"></div>
        </div>
      `;

      // Color
      if (color) {
        const tile_color_b1 = Color(color).lighten(0.15).hex().toString();
        tile.button!.setAttribute("data-color", color);
        contentDiv.style.background = `linear-gradient(90deg, ${color} 0%, ${tile_color_b1} 100%)`;
      } else {
        tile.button!.classList.add("transparent");
      }

      // Label color
      if (labelColor) {
        contentDiv.style.color = labelColor;
      }
    });
  }

  // Detect a mode change
  function mode_signal(params: {
    dragNDrop?: boolean;
    selection?: boolean;
  }): void {
    if (params.dragNDrop) {
      drag_n_drop_mode.current = true;

      // Set data-drag-n-drop-mode="true" attribute to tiles
      for (const tile_btn of div_ref.current!.getElementsByClassName("tile"))
        tile_btn.setAttribute("data-drag-n-drop-mode", "true");
    } else if (params.dragNDrop !== undefined) {
      drag_n_drop_mode.current = false;

      // Remove data-drag-n-drop-mode attribute from tiles
      for (const tile_btn of div_ref.current!.getElementsByClassName("tile"))
        tile_btn.removeAttribute("data-drag-n-drop-mode");
    }

    if (params.selection) {
      selection_mode.current = true;

      // Set data-selection-mode="true" attribute to tiles
      for (const tile_btn of div_ref.current!.getElementsByClassName("tile"))
        tile_btn.setAttribute("data-selection-mode", "true");
    } else if (params.selection !== undefined) {
      selection_mode.current = false;

      // Remove data-selection-mode attribute from tiles
      for (const tile_btn of div_ref.current!.getElementsByClassName("tile"))
        tile_btn.removeAttribute("data-selection-mode");
    }
  }

  function assert_base_tiles_initialized(): void {
    assert(
      !!base_tiles.current,
      "Tiles not initialized yet. Make sure to run initialization code within the TilesController#initialized() event.",
    );
  }

  // Tilting
  let tilting_button: HTMLButtonElement | null = null,
    tilting_pointer_id: number;
  function tile_onPointerDown(e: PointerEvent): void {
    if (tilting_button) return;
    tilting_pointer_id = e.pointerId;
    tilting_button = e.currentTarget as HTMLButtonElement;
    viewport_pointerUp = local_viewport_pointerUp;

    // Slightly rotate tile depending on where the click occurred.
    const deg = 5;
    const rect = tilting_button.getBoundingClientRect();
    const x = e.clientX,
      y = e.clientY;
    let rotate_3d = "";
    if (
      x < rect.left + rect.width / 2 &&
      y > rect.top + rect.height / 3 &&
      y < rect.bottom - rect.height / 3
    )
      rotate_3d = `perspective(${rect.width / em.current!}em) rotate3d(0, -1, 0, ${deg}deg)`;
    else if (
      x > rect.right - rect.width / 2 &&
      y > rect.top + rect.height / 3 &&
      y < rect.bottom - rect.height / 3
    )
      rotate_3d = `perspective(${rect.width / em.current!}em) rotate3d(0, 1, 0, ${deg}deg)`;
    else if (y < rect.top + rect.height / 2)
      rotate_3d = `perspective(${rect.width / em.current!}em) rotate3d(1, 0, 0, ${deg}deg)`;
    else
      rotate_3d = `perspective(${rect.width / em.current!}em) rotate3d(-1, 0, 0, ${deg}deg)`;

    // Content div
    const content = tilting_button.getElementsByClassName("tile-content")[0] as HTMLElement;

    content.style.transform = rotate_3d;
    tilting_button.setAttribute("data-transform-3d", rotate_3d);
  }

  // Handle pointer over tile
  function tile_onPointerOver(e: PointerEvent): void {
    const tile_button = e.currentTarget as HTMLButtonElement;
    const rect = tile_button.getBoundingClientRect();
    if (!(e.clientX >= rect.x && e.clientY >= rect.y && e.clientX < rect.x + rect.width && e.clientY < rect.y + rect.height)) {
      return;
    }
    if (tile_button.classList.contains("transparent")) {
      return;
    }
    const content = tile_button.getElementsByClassName("tile-content")[0] as HTMLElement;
    const tile_color = tile_button.getAttribute("data-color")!;
    const tile_color_b1 = Color(tile_color).lighten(0.15).hex().toString();
    const tile_color_b2 = Color(tile_color).lighten(0.23).hex().toString();
    content.style.background = `linear-gradient(90deg, ${tile_color_b1} 0%, ${tile_color_b2} 100%)`;
  }

  // Handle pointer out tile
  function tile_onPointerOut(e: PointerEvent): void {
    const tile_button = e.currentTarget as HTMLButtonElement;
    if (tile_button.classList.contains("transparent")) {
      return;
    }
    const content = tile_button.getElementsByClassName("tile-content")[0] as HTMLElement;
    const tile_color = tile_button.getAttribute("data-color")!;
    const tile_color_b1 = Color(tile_color).lighten(0.15).hex().toString();
    content.style.background = `linear-gradient(90deg, ${tile_color} 0%, ${tile_color_b1} 100%)`;
  }

  // Handle pointer up
  function local_viewport_pointerUp(e: PointerEvent): void {
    if (!tilting_button || tilting_pointer_id != e.pointerId) return;
    viewport_pointerUp = null;
    const content = tilting_button.getElementsByClassName("tile-content")[0] as HTMLElement;
    content.style.transform = "";
    tilting_button.removeAttribute("data-transform-3d");
    tilting_button = null;
  }

  // Handle clicks on container
  function on_click(e: MouseEvent): void {
    const buttons = Array.from(
      div_ref.current!.getElementsByClassName("tile"),
    ) as HTMLButtonElement[];
    const hovering_a_button = buttons.some((btn) => btn.matches(":hover"));
    if (!hovering_a_button) {
      // Deselect tiles
      for (const button of buttons) {
        button.removeAttribute("data-checked");
      }
      mode_signal({ selection: false });
      selection_change_handler_ref.current?.([]);
    }
  }

  // Handle the request to add a tile
  function add_tile(tile: Tile): void {
    // Basic assertions
    assert_base_tiles_initialized();
    assert(!tiles_state.current.tileExists(tile.id), "Duplicate tile: " + tile.id);

    // Map color and labelColor for initial use by the addedtile
    // handler.
    const { color } = tile;
    initial_colors.current.set(tile.id, { color, labelColor: tile.labelColor });

    // Add tile
    base_tiles.current!.addTile({
      id: tile.id,
      group: tile.group,
      x: tile.x,
      y: tile.y,
      size: tile.size,
    });

    // Initialize state
    const state1 = base_tiles.current!.state.tiles.get(tile.id)!;
    tiles_state.current.tiles.set(tile.id, {
      x: state1.x,
      y: state1.y,
      size: state1.size,
      group: state1.group,
      color,
      style: tile.style,
      iconSize: tile.iconSize,
      labelColor: tile.labelColor,
    });

    // Initialize pages
    set_tile_pages(tile.id, tile.icon, tile.label, tile.livePages, tile.iconSize, tile.style);

    // Trigger state update
    state_updated_handler_ref.current?.(tiles_state.current);
  }

  // Remove tile
  function remove_tile(tile_id: string): void {
    assert_base_tiles_initialized();
    base_tiles.current!.removeTile(tile_id);
    tiles_pages.current.delete(tile_id);
    initial_colors.current.delete(tile_id);

    const button = Array.from(
      div_ref.current!.getElementsByClassName("tile"),
    ).find((btn) => btn.getAttribute("data-id") === tile_id) as
      | HTMLButtonElement
      | undefined;
    if (button && button.getAttribute("data-dragging") === "true")
      mode_signal({ dragNDrop: false });
  }

  // Resize tile
  function resize_tile(tile_id: string, size: TileSize): void {
    assert_base_tiles_initialized();
    base_tiles.current!.resizeTile(tile_id, size);
    const pages = tiles_pages.current.get(tile_id);
    if (pages)
      set_tile_pages(tile_id, pages.icon, pages.label, pages.livePages, pages.iconSize, pages.style);
  }

  // Clear
  function clear(): void {
    assert_base_tiles_initialized();
    base_tiles.current!.clear();
    tiles_state.current.clear();
    tiles_pages.current.clear();
    initial_colors.current.clear();
    mode_signal({ dragNDrop: false, selection: false });
  }

  // Set whether tile is checked or not
  function set_checked(tile_id: string, value: boolean): void {
    const buttons = Array.from(
      div_ref.current!.getElementsByClassName("tile")
    ) as HTMLButtonElement[];
    const this_button = buttons.find(
      (btn) => btn.getAttribute("data-id") === tile_id,
    );
    if (this_button) {
      if (value) this_button.setAttribute("data-checked", "true");
      else this_button.removeAttribute("data-checked");

      // Mode change
      const checked_tiles = buttons
        .filter((btn) => btn.getAttribute("data-checked") === "true")
        .map((btn) => btn.getAttribute("data-id")!);
      mode_signal({ selection: checked_tiles.length != 0 });

      // Trigger selectionChange event
      selection_change_handler_ref.current?.(checked_tiles);
    }
  }

  // Recolor tile
  function set_tile_color(tile_id: string, color: undefined | string): void {
    assert_base_tiles_initialized();

    const state = tiles_state.current.tiles.get(tile_id);
    if (!state) return;

    const element = Array.from(
      div_ref.current!.getElementsByClassName("tile"),
    ).find((btn) => btn.getAttribute("data-id") == tile_id) as
      | HTMLButtonElement
      | undefined;
    if (!element) return;

    // Content div
    const content = element.getElementsByClassName("tile-content")[0] as HTMLElement;

    if (color) {
      const tile_color_b1 = Color(color).lighten(0.15).hex().toString();
      element.setAttribute("data-color", color);
      content.style.background = `linear-gradient(90deg, ${color} 0%, ${tile_color_b1} 100%)`;
      if (element.classList.contains("transparent")) {
        element.classList.remove("transparent");
      }
    } else if (!element.classList.contains("transparent")) {
      element.classList.add("transparent");
    }
    state.color = color;

    // Trigger update
    state_updated_handler_ref.current?.(tiles_state.current);
  }

  // Set tile pages
  function set_tile_pages(
    tile: string,
    icon: string | undefined,
    label: string | undefined,
    livePages: LiveTilePage[] | undefined,
    iconSize: TileIconSize | undefined,
    style: TileStyle | undefined,
  ): void {
    // Limit number of live pages for now.
    assert(
      livePages ? livePages!.length <= 2 : true,
      "livePages.length must be <= 2.",
    );

    // Tile button
    const button = Array.from(
      div_ref.current!.getElementsByClassName("tile"),
    ).find((btn) => btn.getAttribute("data-id") == tile);
    if (!button) return;

    // Tile content
    const tile_content = button!.getElementsByClassName("tile-content")[0] as HTMLElement;

    // Remove previous pages
    for (const page of Array.from(tile_content.querySelectorAll(".tile-page")))
      page.remove();

    // Track pages
    tiles_pages.current.set(tile, { icon, label, livePages, iconSize, style });

    // Retrieve state
    const state = tiles_state.current.tiles.get(tile);

    if (state) {
      state!.iconSize = iconSize;
      state!.style = style;

      // Trigger state update
      state_updated_handler_ref.current?.(tiles_state.current);
    }

    // Use the checked rect as a reference to before where page divs are added.
    const checked_rect = button.querySelector(
      ".tile-checked-rect"
    )! as HTMLDivElement;

    // Collect page elements to setup their animation later.
    const page_elements: HTMLDivElement[] = [];

    if (icon || label) {
      const page_el = document.createElement("div");
      page_el.classList.add("tile-page");
      page_elements.push(page_el);
      tile_content.insertBefore(page_el, checked_rect);

      if (style == "heading") {
        label ??= "";
        label = label.length >= 40 ? label.slice(0, 40) + "..." : label;
        const img = icon ? "<img class='tile-icon' draggable='false' src=\"" + icon + "\" alt='new'>" : "";
        page_el.innerHTML = "<div class='tile-heading-content' style='width:100%;height:100%;padding:0.7em;position:relative'><h2 class='tile-heading-label' style='padding:0;margin:0;text-align:left;overflow-wrap:anywhere;position:absolute;'>" + escapeHTML(label) + "</h2>" + img + "</div>";
      } else {
        const icon_wrap_el = document.createElement("div");
        icon_wrap_el.classList.add("tile-icon-wrap");
        page_el.appendChild(icon_wrap_el);

        if (icon) {
          const icon_el = document.createElement("div");
          icon_el.classList.add("tile-icon");
          if (iconSize !== undefined) {
            switch (iconSize) {
              case "high": {
                icon_el.classList.add("high");
                break;
              }
              case "extraHigh": {
                icon_el.classList.add("extra-high");
                break;
              }
            }
          }
          icon_el.style.background = `url("${icon}") center no-repeat`;
          icon_el.style.backgroundSize = "contain";
          icon_wrap_el.appendChild(icon_el);
        }

        label ??= "";
        label = label.length >= 40 ? label.slice(0, 40) + "..." : label;

        const label_el = document.createElement("div");
        label_el.classList.add("tile-label");
        label_el.innerText = label;
        page_el.appendChild(label_el);
      }
    }

    if (state?.size !== "small") {
      if (livePages) {
        for (const page of livePages) {
          const page_el = document.createElement("div");
          page_el.classList.add("tile-page");
          if (page.id) page_el.id = page.id;
          page_el.innerHTML = page.html;
          page_elements.push(page_el);
          tile_content.insertBefore(page_el, checked_rect);
        }
      }
    }

    // Setup animation
    let anim_prefix_1 =
      page_elements.length <= 1 ? "" : "com_hydroper_livetiles-slide-y" + page_elements.length;
    for (let page_i = 0; page_i < page_elements.length; page_i++) {
      const page_el = page_elements[page_i];
      page_el.style.top = page_i == 0 ? "0%" : "100%";
      if (anim_prefix_1) {
        page_el.style.animationName = anim_prefix_1 + "-" + (page_i + 1);
        page_el.style.animationDuration =
          page_elements.length * slide_y_page_duration + "s";
        page_el.style.animationIterationCount = "infinite";
      }
    }
  }

  // Add group
  function add_group(group: TileGroup): void {
    assert_base_tiles_initialized();
    assert(
      !tiles_state.current.groupExists(group.id),
      "Duplicate group ID: " + group.id,
    );

    const group_button = base_tiles.current!.addGroup({
      id: group.id,
      label: group.label,
    });
  }

  //Remove group
  function remove_group(group_id: string): void {
    assert_base_tiles_initialized();
    base_tiles.current!.removeGroup(group_id);
  }

  // Rename group
  function rename_group(group_id: string, label: string): void {
    assert_base_tiles_initialized();
    base_tiles.current!.renameGroup(group_id, label);
  }

  // Observe root font size
  useEffect(() => {
    const em_observer = new EMObserver(div_ref.current!, (value) => {
      em.current = value;
    });
    return () => {
      em_observer.cleanup();
    };
  }, []);

  // Forced invisibility toggle
  useEffect(() => {
    window.setTimeout(() => {
      set_forced_invisible(open ? false : true);
    }, TILES_OPEN_DELAY / 2);
  }, [open]);

  // React to changes to certain parameters like direction and dragEnabled,
  // triggering a reset.
  useEffect(() => {
    if (base_tiles.current) {
      base_tiles.current!.destroy(false);
      base_tiles.current = null;
      div_ref.current!.innerHTML = "";
      tiles_state.current.clear();
      tiles_pages.current.clear();
      init_base_tiles();

      // Open/close transition
      openOrClose();
    }
  }, [params.direction, params.dragEnabled, params.selectionEnabled, params.inlineGroups, params.groupWidth]);

  // Initialization
  useEffect(() => {
    // Initialize BaseTiles instance
    init_base_tiles();

    // Cleanup
    return () => {
      // Destroy BaseTiles instance
      base_tiles.current?.destroy();

      // Dispose of label handlers
      if (label_click_out_handler)
        window.removeEventListener("click", label_click_out_handler);
    };
  }, []);

  // Open/close transition
  const transition_timeout = useRef(-1);
  const min_scale_aborter = useRef<null | AbortController>(null);
  useEffect(() => {
    openOrClose();
  }, [open]);
  function openOrClose() {
    if (transition_timeout.current !== -1) {
      window.clearTimeout(transition_timeout.current);
    }
    if (min_scale_aborter.current) {
      min_scale_aborter.current!.abort();
      min_scale_aborter.current = null;
    }
    if (open) {
      setTimeout(() => {
        set_scale(1);
      }, 0);
      min_scale_aborter.current = base_tiles.current!.rearrangeOverMinimumScale();
    } else {
      set_scale(0);
    }
  }

  useEffect(() => {
    // Reflect controller
    tiles_controller_reference.current = tiles_controller;

    // Handle the request to add a tile
    function tiles_controller_addTile(e: CustomEvent<Tile>) {
      add_tile(e.detail);
    }
    tiles_controller.addEventListener("addTile", tiles_controller_addTile);

    // Remove tile
    function tiles_controller_removeTile(e: CustomEvent<string>): void {
      remove_tile(e.detail);
    }
    tiles_controller.addEventListener("removeTile", tiles_controller_removeTile);

    // Resize tile
    function tiles_controller_resizeTile(
      e: CustomEvent<{ id: string; value: TileSize }>,
    ): void {
      resize_tile(e.detail.id, e.detail.value);
    }
    tiles_controller.addEventListener("resizeTile", tiles_controller_resizeTile);

    // Clear
    function tiles_controller_clear(e: Event): void {
      clear();
    }
    tiles_controller.addEventListener("clear", tiles_controller_clear);

    // Set whether tile is checked or not
    function tiles_controller_setChecked(
      e: CustomEvent<{ id: string; value: boolean }>,
    ): void {
      set_checked(e.detail.id, e.detail.value);
    }
    tiles_controller.addEventListener("setChecked", tiles_controller_setChecked);

    // Checks all tiles.
    function tiles_controller_checkAll(e: Event): void {
      const buttons = [...div_ref.current!.getElementsByClassName("tile")] as HTMLButtonElement[];
      for (const button of buttons) {
        button.setAttribute("data-checked", "true");
      }

      // Mode change
      mode_signal({ selection: buttons.length != 0 });

      // Trigger selectionChange event
      selection_change_handler_ref.current?.(buttons.map(button => button.getAttribute("data-id")!));
    }
    tiles_controller.addEventListener("checkAll", tiles_controller_checkAll);

    // Unchecks all tiles.
    function tiles_controller_uncheckAll(e: Event): void {
      const buttons = [...div_ref.current!.getElementsByClassName("tile"),] as HTMLButtonElement[];
      for (const button of buttons) {
        button.removeAttribute("data-checked");
      }

      // Mode change
      mode_signal({ selection: false });

      // Trigger selectionChange event
      selection_change_handler_ref.current?.([]);
    }
    tiles_controller.addEventListener("uncheckAll", tiles_controller_uncheckAll);

    // Recolor tile
    function tiles_controller_setTileColor(
      e: CustomEvent<{ id: string; value: undefined | string }>,
    ): void {
      set_tile_color(e.detail.id, e.detail.value);
    }
    tiles_controller.addEventListener(
      "setTileColor",
      tiles_controller_setTileColor,
    );

    // Recolor tile label
    function tiles_controller_setTileLabelColor(
      e: CustomEvent<{ id: string; value?: string }>,
    ): void {
      assert_base_tiles_initialized();

      const tile_id = e.detail.id;
      const color = e.detail.value;

      const state = tiles_state.current.tiles.get(tile_id);
      if (!state) return;

      const element = Array.from(
        div_ref.current!.getElementsByClassName("tile")
      ).find((btn) => btn.getAttribute("data-id") == tile_id) as
        | HTMLButtonElement
        | undefined;
      if (!element) return;

      element.style.color = color ?? "";
      state.labelColor = color;

      state_updated_handler_ref.current?.(tiles_state.current);
    }
    tiles_controller.addEventListener(
      "setTileLabelColor",
      tiles_controller_setTileLabelColor,
    );

    // Set tile pages
    function tiles_controller_setTilePages(
      e: CustomEvent<{
        id: string;
        icon?: string;
        label?: string;
        livePages?: LiveTilePage[];
        iconSize?: TileIconSize;
        style?: TileStyle;
      }>,
    ): void {
      assert_base_tiles_initialized();
      set_tile_pages(
        e.detail.id,
        e.detail.icon,
        e.detail.label,
        e.detail.livePages,
        e.detail.iconSize,
        e.detail.style,
      );
    }

    tiles_controller.addEventListener(
      "setTilePages",
      tiles_controller_setTilePages,
    );

    // Handle request to get checked tiles
    function tiles_controller_onGetChecked(
      e: CustomEvent<{ requestId: string }>,
    ) {
      const div = div_ref.current;
      let tiles: string[] = [];
      if (div) {
        tiles = Array.from(div.getElementsByClassName("tile"))
          .filter((div) => div.getAttribute("data-checked") == "true")
          .map((div) => div.getAttribute("data-id")!);
      }
      tiles_controller.dispatchEvent(
        new CustomEvent("getCheckedResult", {
          detail: {
            requestId: e.detail.requestId,
            tiles,
          },
        }),
      );
    }
    tiles_controller.addEventListener(
      "getChecked",
      tiles_controller_onGetChecked,
    );

    // Handle request to determine whether a tile exists or not.
    function tiles_controller_onTileExists(
      e: CustomEvent<{ requestId: string; tile: string }>,
    ) {
      tiles_controller.dispatchEvent(
        new CustomEvent("tileExistsResult", {
          detail: {
            requestId: e.detail.requestId,
            value: base_tiles.current!.state.tileExists(e.detail.tile),
          },
        }),
      );
    }
    tiles_controller.addEventListener(
      "tileExists",
      tiles_controller_onTileExists,
    );

    // Handle request to determine whether a group exists or not.
    function tiles_controller_onGroupExists(
      e: CustomEvent<{ requestId: string; group: string }>,
    ) {
      tiles_controller.dispatchEvent(
        new CustomEvent("groupExistsResult", {
          detail: {
            requestId: e.detail.requestId,
            value: base_tiles.current!.state.groupExists(e.detail.group),
          },
        }),
      );
    }
    tiles_controller.addEventListener(
      "groupExists",
      tiles_controller_onGroupExists,
    );

    // Handle request to determine number of available inline groups.
    function tiles_controller_onGetInlineGroupsAvailable(
      e: CustomEvent<{ requestId: string; width: string }>,
    ) {
      tiles_controller.dispatchEvent(
        new CustomEvent("getInlineGroupsAvailableResult", {
          detail: {
            requestId: e.detail.requestId,
            value: base_tiles.current!.inlineGroupsAvailable(e.detail.width),
          },
        }),
      );
    }
    tiles_controller.addEventListener(
      "getInlineGroupsAvailable",
      tiles_controller_onGetInlineGroupsAvailable,
    );

    // Handle request to get a tile's button
    function tiles_controller_onGetTileButton(
      e: CustomEvent<{ requestId: string; tile: string }>,
    ) {
      const div = div_ref.current;
      let button: HTMLButtonElement | null = null;
      if (div) {
        button = (Array.from(div.getElementsByClassName("tile")).find(
          (btn) => btn.getAttribute("data-id") == e.detail.tile,
        ) ?? null) as HTMLButtonElement | null;
      }
      tiles_controller.dispatchEvent(
        new CustomEvent("getTileButtonResult", {
          detail: {
            requestId: e.detail.requestId,
            button,
          },
        }),
      );
    }
    tiles_controller.addEventListener("getTileButton", tiles_controller_onGetTileButton);

    // Handle adding groups
    function tiles_controller_addGroup(e: CustomEvent<TileGroup>): void {
      add_group(e.detail);
    }
    tiles_controller.addEventListener("addGroup", tiles_controller_addGroup);

    // Remove group
    function tiles_controller_removeGroup(e: CustomEvent<string>): void {
      remove_group(e.detail);
    }
    tiles_controller.addEventListener("removeGroup", tiles_controller_removeGroup);

    // Rename group
    function tiles_controller_renameGroup(
      e: CustomEvent<{ id: string; value: string }>,
    ): void {
      rename_group(e.detail.id, e.detail.value);
    }
    tiles_controller.addEventListener("renameGroup", tiles_controller_renameGroup);

    return () => {
      // Dispose listeners on TilesController
      tiles_controller.removeEventListener("getTileButton", tiles_controller_onGetTileButton);
      tiles_controller.removeEventListener("getChecked", tiles_controller_onGetChecked);
      tiles_controller.removeEventListener("addTile", tiles_controller_addTile);
      tiles_controller.removeEventListener("resizeTile", tiles_controller_resizeTile);
      tiles_controller.removeEventListener("setTileColor", tiles_controller_setTileColor);
      tiles_controller.removeEventListener("setTileLabelColor", tiles_controller_setTileLabelColor);
      tiles_controller.removeEventListener("setTilePages", tiles_controller_setTilePages);
      tiles_controller.removeEventListener("removeTile", tiles_controller_removeTile);
      tiles_controller.removeEventListener("tileExists", tiles_controller_onTileExists);
      tiles_controller.removeEventListener("addGroup", tiles_controller_addGroup);
      tiles_controller.removeEventListener("removeGroup", tiles_controller_removeGroup);
      tiles_controller.removeEventListener("groupExists", tiles_controller_onGroupExists);
      tiles_controller.removeEventListener("renameGroup", tiles_controller_renameGroup);
      tiles_controller.removeEventListener("setChecked", tiles_controller_setChecked);
      tiles_controller.removeEventListener("checkAll", tiles_controller_checkAll);
      tiles_controller.removeEventListener("uncheckAll", tiles_controller_uncheckAll);
      tiles_controller.removeEventListener("clear", tiles_controller_clear);
      tiles_controller.removeEventListener("getInlineGroupsAvailable", tiles_controller_onGetInlineGroupsAvailable);
    };
  }, [tiles_controller]);

  // Reflect the stateUpdated handler
  useEffect(() => {
    state_updated_handler_ref.current = params.stateUpdated;
  }, [params.stateUpdated]);

  // Reflect the stateUpdated handler
  useEffect(() => {
    selection_change_handler_ref.current = params.selectionChange;
  }, [params.selectionChange]);

  // Reflect the click handler
  useEffect(() => {
    click_handler_ref.current = params.click;
  }, [params.click]);

  // Reflect the dragStart handler
  useEffect(() => {
    drag_start_handler_ref.current = params.dragStart;
  }, [params.dragStart]);

  // Reflect the drag handler
  useEffect(() => {
    drag_handler_ref.current = params.drag;
  }, [params.drag]);

  // Reflect the dragEnd handler
  useEffect(() => {
    drag_end_handler_ref.current = params.dragEnd;
  }, [params.dragEnd]);

  return (
    <Div
      className="Tiles"
      style={params.style}
      $forced_invisible={forced_invisible}
      $scale={scale}
      $theme={theme}
      $direction={params.direction}
      $rtl={rtl}
      $open={open}
      onClick={on_click as any}
    >
      <div ref={div_ref}></div>
    </Div>
  );
}

export type TilesParams = {
  /**
   * The tile controller allows operations such as
   * controlling which tiles are checked (selected) and their sizes.
   */
  controller: TilesController;

  /**
   * Whether the live tiles layout is horizontal or vertical.
   */
  direction: "horizontal" | "vertical";

  /**
   * Whether drag-n-drop is enabled.
   * @default true
   */
  dragEnabled?: boolean;

  /**
   * Whether tile selection/checking is enabled.
   * @default true
   */
  selectionEnabled?: boolean;

  /**
   * Number of inline groups in case the container is vertical.
   */
  inlineGroups?: number,

  /**
   * Group width in small tiles unit (1x1), in case the container is vertical.
   */
  groupWidth?: number,

  /**
   * Whether to display open or close transition.
   *
   * A `Tiles` component displays a `TILES_OPEN_DELAY` milliseconds
   * scale/opacity transition when visibility changes;
   * this property indicats whether the container is open or closed.
   *
   * @default true
   */
  open?: boolean;

  style?: React.CSSProperties;

  /**
   * Event that triggers when the state is updated.
   */
  stateUpdated?: (state: TilesState) => void;

  /**
   * Event that triggers when any tiles are checked or unchecked.
   * The given `tiles` parameter contains the tiles that are
   * currently checked.
   */
  selectionChange?: (tiles: string[]) => void;

  /**
   * Event that triggers when a tile is clicked.
   */
  click?: (id: string) => void;

  /**
   * Event that triggers when a tile starts dragging.
   */
  dragStart?: (event: { id: string, button: HTMLButtonElement }) => void,

  /**
   * Event that triggers while a tile is dragging.
   */
  drag?: (event: { id: string, button: HTMLButtonElement }) => void,

  /**
   * Event that triggers when a tile finishes dragging (drop).
   */
  dragEnd?: (event: { id: string, button: HTMLButtonElement }) => void,
};

export type Tile = {
  /**
   * Unique tile ID.
   */
  id: string;

  /**
   * Tile color. If `undefined`, displays a transparent tile.
   * 
   * @default undefined
   */
  color?: string;

  /**
   * Tile size.
   */
  size: TileSize;

  /**
   * Horizontal position in small tile units. -1 (default)
   * indicates last position.
   *
   * @default -1
   */
  x?: number;

  /**
   * Vertical position in small tile units. -1 (default)
   * indicates last position.
   *
   * @default -1
   */
  y?: number;

  /**
   * Group to attach to.
   */
  group?: string;

  /**
   * Label.
   */
  label?: string;

  /**
   * Label color.
   */
  labelColor?: string,

  /**
   * Icon source.
   */
  icon?: string;

  /**
   * Tile's icon size.
   */
  iconSize?: TileIconSize;

  /**
   * Tile style.
   * 
   * @default "normal"
   */
  style?: TileStyle;

  /**
   * List of HTML content for live tiles
   * with rolling animation, each element of
   * this array being a page of the tile.
   *
   * **Note:** this property may contain at most 2 elements.
   */
  livePages?: LiveTilePage[];
};

/**
 * Tile style.
 * 
 * - If normal, then the icon is displayed at the center, and
 *   the label is displayed at the bottom as normal characters.
 * - If heading, then the label is displayed at the top-left as heading characters,
 *   and the icon is displayed at the bottom-left.
 */
export type TileStyle = "normal" | "heading";

/**
 * Tile icon size variant.
 */
export type TileIconSize = "normal" | "high" | "extraHigh";

export type LiveTilePage = {
  /**
   * Contributes an `id` attribute to the page element that contains
   * the `html` content, which may be queried through `querySelector()`
   * in the tile's button element.
   */
  id?: string;
  html: string;
};

export type TileGroup = {
  id: string;
  label?: string;
};

/**
 * The state of a `Tiles` component, containing positions and labels.
 */
export class TilesState {
  groups: Map<string, { index: number; label: string }> = new Map();
  tiles: Map<
    string,
    {
      size: TileSize;
      x: number;
      y: number;
      group: string;
      color?: string;
      style?: TileStyle;
      iconSize?: TileIconSize;
      labelColor?: string;
    }
  > = new Map();

  /**
   * Constructs `State` from JSON. The `object` argument
   * may be a JSON serialized string or a plain object.
   */
  static fromJSON(object: any): TilesState {
    object = typeof object === "string" ? JSON.parse(object) : object;
    const r = new TilesState();
    for (const id in object.groups) {
      const o1 = object.groups[id];
      r.groups.set(id, {
        index: Number(o1.index),
        label: String(o1.label),
      });
    }
    for (const id in object.tiles) {
      const o1 = object.tiles[id];
      r.tiles.set(id, {
        size: String(o1.size) as TileSize,
        x: Number(o1.x),
        y: Number(o1.y),
        group: String(o1.group),
        color: o1.color ? String(o1.color) : undefined,
        iconSize: o1.iconSize ? (o1.iconSize as TileIconSize) : undefined,
        style: o1.style ? (o1.style as TileStyle) : undefined,
        labelColor: o1.labelColor ? String(o1.labelColor) : undefined,
      });
    }
    return r;
  }

  /**
   * Returns a plain object (**not** a string).
   */
  toJSON(): any {
    const groups: any = {};
    for (const [id, g] of this.groups) {
      groups[id] = {
        index: g.index,
        label: g.label,
      };
    }
    const tiles: any = {};
    for (const [id, t] of this.tiles) {
      tiles[id] = {
        size: t.size,
        x: t.x,
        y: t.y,
        group: t.group,
        color: t.color ?? null,
        style: t.style ?? null,
        iconSize: t.iconSize ?? null,
        labelColor: t.labelColor ?? null,
      };
    }
    return {
      groups,
      tiles,
    };
  }

  clear(): void {
    this.groups.clear();
    this.tiles.clear();
  }

  set(state: TilesState): void {
    for (const [id, group] of state.groups) {
      this.groups.set(id, {
        index: group.index,
        label: group.label,
      });
    }
    for (const [id, tile] of state.tiles) {
      this.tiles.set(id, {
        size: tile.size,
        x: tile.x,
        y: tile.y,
        group: tile.group,
        color: tile.color,
        style: tile.style,
        iconSize: tile.iconSize,
        labelColor: tile.labelColor,
      });
    }
  }

  /** @hidden */
  _clearAndSetBase(state: BaseState): void {
    type Stuff = {
      color?: string,
      style?: TileStyle,
      iconSize?: TileIconSize,
      labelColor?: string,
    };
    const k_stuffs: [string, Stuff][] = Array.from(this.tiles.entries()).map(([id, tile]) => [
      id,
      {
        color: tile.color,
        style: tile.style,
        iconSize: tile.iconSize,
        labelColor: tile.labelColor,
      },
    ]);
    this.clear();
    for (const [id, group] of state.groups) {
      this.groups.set(id, {
        index: group.index,
        label: group.label,
      });
    }
    for (const [id, tile] of state.tiles) {
      const k_stuff = k_stuffs.find(([id1,]) => id == id1) as [string, Stuff];
      this.tiles.set(id, {
        size: tile.size,
        x: tile.x,
        y: tile.y,
        group: tile.group,
        color: k_stuff?.[1]?.color ?? undefined,
        style: k_stuff?.[1]?.style ?? undefined,
        iconSize: k_stuff?.[1]?.iconSize ?? undefined,
        labelColor: k_stuff?.[1]?.labelColor ?? undefined,
      });
    }
  }

  clone(): TilesState {
    const r = new TilesState();
    r.set(this);
    return r;
  }

  groupExists(id: string): boolean {
    return this.groups.has(id);
  }

  tileExists(id: string): boolean {
    return this.tiles.has(id);
  }
}

/**
 * Provides control over tiles in a `Tiles` container.
 */
export class TilesController extends (EventTarget as TypedEventTarget<TilesEventMap>) {
  /**
   * Gets the list of checked tiles.
   */
  checked(): Promise<string[]> {
    return new Promise((resolve, _) => {
      const requestId = randomHexLarge();
      const listener = (
        e: CustomEvent<{ requestId: string; tiles: string[] }>,
      ) => {
        if (e.detail.requestId !== requestId) return;
        this.removeEventListener("getCheckedResult", listener);
        resolve(e.detail.tiles);
      };
      this.addEventListener("getCheckedResult", listener);
      this.dispatchEvent(
        new CustomEvent("getChecked", {
          detail: {
            requestId,
          },
        }),
      );
    });
  }

  /**
   * Gets the button element corresponding to a tile.
   */
  tileButton(tile: string): Promise<HTMLButtonElement | null> {
    return new Promise((resolve, _) => {
      const requestId = randomHexLarge();
      const listener = (
        e: CustomEvent<{ requestId: string; button: HTMLButtonElement | null }>,
      ) => {
        if (e.detail.requestId !== requestId) return;
        this.removeEventListener("getTileButtonResult", listener);
        resolve(e.detail.button);
      };
      this.addEventListener("getTileButtonResult", listener);
      this.dispatchEvent(
        new CustomEvent("getTileButton", {
          detail: {
            requestId,
            tile,
          },
        }),
      );
    });
  }

  addTile(params: Tile): void {
    this.dispatchEvent(
      new CustomEvent("addTile", {
        detail: params,
      }),
    );
  }

  tileExists(tile_id: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      const requestId = randomHexLarge();
      const listener = (
        e: CustomEvent<{ requestId: string; value: boolean }>,
      ) => {
        if (e.detail.requestId !== requestId) return;
        this.removeEventListener("tileExistsResult", listener);
        resolve(e.detail.value);
      };
      this.addEventListener("tileExistsResult", listener);
      this.dispatchEvent(
        new CustomEvent("tileExists", {
          detail: {
            requestId,
            tile: tile_id,
          },
        }),
      );
    });
  }

  removeTile(id: string): void {
    this.dispatchEvent(
      new CustomEvent("removeTile", {
        detail: id,
      }),
    );
  }

  clear(): void {
    this.dispatchEvent(
      new Event("clear"),
    );
  }

  addGroup(params: TileGroup): void {
    this.dispatchEvent(
      new CustomEvent("addGroup", {
        detail: params,
      }),
    );
  }

  groupExists(group_id: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      const requestId = randomHexLarge();
      const listener = (
        e: CustomEvent<{ requestId: string; value: boolean }>,
      ) => {
        if (e.detail.requestId !== requestId) return;
        this.removeEventListener("groupExistsResult", listener);
        resolve(e.detail.value);
      };
      this.addEventListener("groupExistsResult", listener);
      this.dispatchEvent(
        new CustomEvent("groupExists", {
          detail: {
            requestId,
            group: group_id,
          },
        }),
      );
    });
  }

  removeGroup(id: string): void {
    this.dispatchEvent(
      new CustomEvent("removeGroup", {
        detail: id,
      }),
    );
  }

  /**
   * Sets whether a tile is checked or not.
   */
  setChecked(id: string, value: boolean): void {
    this.dispatchEvent(
      new CustomEvent("setChecked", {
        detail: { id, value },
      }),
    );
  }

  /**
   * Checks all tiles.
   */
  checkAll(): void {
    this.dispatchEvent(new Event("checkAll"));
  }

  /**
   * Unchecks all tiles.
   */
  uncheckAll(): void {
    this.dispatchEvent(new Event("uncheckAll"));
  }

  /**
   * Sets the size of a tile.
   */
  resizeTile(id: string, value: TileSize): void {
    this.dispatchEvent(
      new CustomEvent("resizeTile", {
        detail: { id, value },
      }),
    );
  }

  /**
   * Sets the color of a tile.
   */
  setTileColor(id: string, value: undefined | string): void {
    this.dispatchEvent(
      new CustomEvent("setTileColor", {
        detail: { id, value },
      }),
    );
  }

  /**
   * Sets the label color of a tile.
   */
  setTileLabelColor(id: string, value: undefined | string): void {
    this.dispatchEvent(
      new CustomEvent("setTileLabelColor", {
        detail: { id, value },
      }),
    );
  }

  /**
   * Sets the pages of a tile (icon, label and live tile pages).
   */
  setTilePages(
    id: string,
    {
      icon,
      iconSize,
      label,
      livePages,
      style,
    }: { icon?: string; label?: string; livePages?: LiveTilePage[], style?: TileStyle, iconSize?: TileIconSize },
  ): void {
    this.dispatchEvent(
      new CustomEvent("setTilePages", {
        detail: { id, icon, iconSize, label, livePages, style },
      }),
    );
  }

  /**
   * Sets the label text of a group.
   */
  renameGroup(id: string, value: string): void {
    this.dispatchEvent(
      new CustomEvent("renameGroup", {
        detail: { id, value },
      }),
    );
  }

  /**
   * Returns the number of inline groups available for
   * the given width (either in `px` or `em`).
   * *Applies to vertical layouts only.*
   */
  inlineGroupsAvailable(width: string): Promise<number> {
    return new Promise((resolve, _) => {
      const requestId = randomHexLarge();
      const listener = (
        e: CustomEvent<{ requestId: string; value: number }>,
      ) => {
        if (e.detail.requestId !== requestId) return;
        this.removeEventListener("getInlineGroupsAvailableResult", listener);
        resolve(e.detail.value);
      };
      this.addEventListener("getInlineGroupsAvailableResult", listener);
      this.dispatchEvent(
        new CustomEvent("getInlineGroupsAvailable", {
          detail: {
            requestId,
            width,
          },
        }),
      );
    });
  }

  /**
   * Shorthand to `addEventListener()`.
   */
  on<K extends keyof TilesEventMap>(type: K, listenerFn: (event: TilesEventMap[K]) => void, options?: AddEventListenerOptions): void;
  on(type: string, listenerFn: (event: Event) => void, options?: AddEventListenerOptions): void;
  on(type: any, listenerFn: any, options?: AddEventListenerOptions): void {
    this.addEventListener(type, listenerFn, options);
  }

  /**
   * Shorthand to `removeEventListener()`.
   */
  off<K extends keyof TilesEventMap>(type: K, listenerFn: (event: TilesEventMap[K]) => void, options?: EventListenerOptions): void;
  off(type: string, listenerFn: (event: Event) => void, options?: EventListenerOptions): void;
  off(type: any, listenerFn: any, options?: EventListenerOptions): void {
    this.removeEventListener(type, listenerFn, options);
  }
}

/**
 * `TilesController` event map.
 */
export type TilesEventMap = {
  /** @hidden */
  clear: Event;
  /** @hidden */
  addTile: CustomEvent<Tile>;
  /** @hidden */
  tileExists: CustomEvent<{ requestId: string; tile: string }>;
  /** @hidden */
  tileExistsResult: CustomEvent<{ requestId: string; value: boolean }>;
  /** @hidden */
  removeTile: CustomEvent<string>;
  /** @hidden */
  addGroup: CustomEvent<TileGroup>;
  /** @hidden */
  groupExists: CustomEvent<{ requestId: string; group: string }>;
  /** @hidden */
  groupExistsResult: CustomEvent<{ requestId: string; value: boolean }>;
  /** @hidden */
  removeGroup: CustomEvent<string>;
  /** @hidden */
  getChecked: CustomEvent<{ requestId: string }>;
  /** @hidden */
  getCheckedResult: CustomEvent<{ requestId: string; tiles: string[] }>;
  /** @hidden */
  getTileButton: CustomEvent<{ requestId: string; tile: string }>;
  /** @hidden */
  getTileButtonResult: CustomEvent<{
    requestId: string;
    button: HTMLButtonElement | null;
  }>;
  /** @hidden */
  setChecked: CustomEvent<{ id: string; value: boolean }>;
  /** @hidden */
  checkAll: Event;
  /** @hidden */
  uncheckAll: Event;
  /** @hidden */
  resizeTile: CustomEvent<{ id: string; value: TileSize }>;
  /** @hidden */
  setTileColor: CustomEvent<{ id: string; value: undefined | string }>;
  /** @hidden */
  setTileLabelColor: CustomEvent<{ id: string; value?: string }>;
  /** @hidden */
  setTilePages: CustomEvent<{
    id: string;
    icon?: string;
    label?: string;
    livePages?: LiveTilePage[];
    style?: TileStyle;
    iconSize?: TileIconSize;
  }>;
  /** @hidden */
  renameGroup: CustomEvent<{ id: string; value: string }>;

  /** @hidden */
  getInlineGroupsAvailable: CustomEvent<{ requestId: string, width: string }>;
  /** @hidden */
  getInlineGroupsAvailableResult: CustomEvent<{ requestId: string, value: number }>;
};