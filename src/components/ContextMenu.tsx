// third-party
import { TypedEventTarget } from "@hydroperx/event";
import { Color } from "@hydroperx/color";
import { input } from "@hydroperx/inputaction";
import { useContext, useRef, useState, useEffect } from "react";
import { styled } from "styled-components";
import { computePosition, flip, shift, size, offset } from "@floating-ui/dom";
import assert from "assert";
import $ from "jquery";

// local
import {
  ArrowIcon, BulletIcon, CheckedIcon,
  DownArrowIcon, IconParams, UpArrowIcon,
} from "./Icon";
import { RTLContext } from "../layout/RTL";
import { fitViewport, SimplePlacementType } from "../utils/PlacementUtils";
import * as StringUtils from "../utils/StringUtils";
import { Theme, ThemeContext } from "../theme";
import { BUTTON_NAVIGABLE, COMMON_DELAY, MAXIMUM_Z_INDEX } from "../utils/Constants";
import * as EMConvert from "../utils/EMConvert";
import { focusPrevSibling, focusNextSibling } from "../utils/FocusUtils";
import { randomHexLarge } from "../utils/RandomUtils";

class ContextMenuEventDispatcher extends (EventTarget as TypedEventTarget<{
  show: CustomEvent<ContextMenuEvent>;
  hideAll: CustomEvent<ContextMenuEvent>;
}>) {}

interface ContextMenuEvent {
  readonly id: string;
  readonly event: MouseEvent | undefined;
  readonly position: [number, number] | undefined;
  readonly reference: HTMLElement | undefined;
  readonly prefer: SimplePlacementType | undefined;
}

// Transition used in context menus.
const visibleTransition =
  "opacity 0.18s ease-out, top 0.19s ease-out, left 0.19s ease-out";

// Event dispatcher used for sending signals to
// context menus, such as requests to show them and to hide them.
const eventDispatcher = new ContextMenuEventDispatcher();

// Items representing submenus are identified by this class name.
const submenuItemClassName = "contextmenu-submenu-item";

// Submenus are identified by this class name.
const submenuClassName = "contextmenu-submenu-list-submenu";

// Weak map mapping to Input listeners of submenus reliably.
// The keys are the submenu lists themselves, not the submenu representing items.
const submenuInputPressedListeners = new WeakMap<HTMLDivElement, Function>();

// Weak map mapping to key down listeners of submenus.
const submenuKeyDownListeners = new WeakMap<HTMLDivElement, Function>();

// Invoked by the global Input action listener.
let currentInputPressedListener: Function | null = null;

// Globalized input action listener
input.on("inputPressed", function (e: Event): void {
  currentInputPressedListener?.(e);
});

// Invoked by the global pointer down event listener
let currentPointerDownListener: Function | null = null;

// Globalized pointer down event listener
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", function (): void {
    currentPointerDownListener?.();
  });
}

/**
 * Hook for using a context menu.
 */
export function useContextMenu(): ContextMenuHook {
  const id = useRef<string>("cxm$" + randomHexLarge());

  return {
    id: id.current,

    show: function (params: ContextMenuShowParams) {
      // Hide other context menu first
      hideAllContextMenu();

      // Dispatch a show event
      window.setTimeout(() => {
        eventDispatcher.dispatchEvent(
          new CustomEvent("show", {
            detail: {
              id: id.current,
              event: params.event,
              position: params.position,
              reference: params.reference,
              prefer: params.prefer,
            },
          }),
        );
      }, COMMON_DELAY / 3);
    },
  };
}

export type ContextMenuHook = {
  id: string;
  show: (params: ContextMenuShowParams) => void;
};

/**
 * Context menu show params.
 */
export type ContextMenuShowParams = {
  /**
   * Preferred placement type.
   */
  prefer?: SimplePlacementType;
  /**
   * Original cause mouse event, if any.
   */
  event?: MouseEvent;
  /**
   * Position (x, y), if any.
   */
  position?: [number, number];
  /**
   * Reference element to where placement of the context menu occurs.
   */
  reference?: HTMLElement;
};

/**
 * Hides all open context menu.
 */
export function hideAllContextMenu(): void {
  eventDispatcher.dispatchEvent(
    new CustomEvent("hideAll", {
      detail: { id: "" },
    }),
  );
}

/**
 * Represents a context menu.
 */
export function ContextMenu(params: ContextMenuParams) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // Locale direction
  const rtl = useContext(RTLContext);
  const rtl_reference = useRef<boolean>(rtl);

  // State
  const [visible, setVisible] = useState<boolean>(false);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0);
  const [transition, setTransition] = useState<string>("");
  const [arrowsVisible, setArrowsVisible] = useState<boolean>(false);

  // References
  const div_reference = useRef<HTMLDivElement | null>(null);
  const keydown_reference = useRef<Function | null>(null);
  const key_sequence_reference = useRef<string>("");
  const key_sequence_last_timestamp = useRef<number>(0);

  // Transition timeout
  let transitionTimeout = -1;

  function getItemListDiv(): HTMLDivElement {
    return div_reference.current!.children[1] as HTMLDivElement;
  }

  // Handle "show" signal
  async function eventDispatcher_show(e: CustomEvent<ContextMenuEvent>) {
    // Identifier must match
    if (e.detail.id !== params.id) {
      return;
    }

    // Turn context menu visible
    setVisible(true);

    // Obtain div element
    const div = div_reference.current!;

    // Disable transition
    setTransition("");

    // Turn arrows visible or hidden
    const listItemDiv = getItemListDiv();
    const k_scroll = listItemDiv.scrollTop;
    listItemDiv.scrollTop = 10;
    setArrowsVisible(listItemDiv.scrollTop != 0);
    listItemDiv.scrollTop = k_scroll;

    // Viewport event listeners
    currentPointerDownListener = viewport_mouseDown;

    // Input listeners
    currentInputPressedListener = input_inputPressed;

    // Key down handler
    if (keydown_reference.current) {
      window.removeEventListener("keydown", keydown_reference.current! as any);
    }
    keydown_reference.current = (e: KeyboardEvent) => {
      if (e.key == " ") {
        e.preventDefault();
      }
      if (String.fromCodePoint(e.key.toLowerCase().codePointAt(0) ?? 0) != e.key.toLowerCase()) {
        key_sequence_last_timestamp.current = 0;
        return;
      }

      // Proceed only if this is the innermost context menu open.
      const submenus = (
        Array.from(
          getItemListDiv().querySelectorAll("." + submenuClassName),
        ) as HTMLDivElement[]
      ).filter((div) => div.style.visibility == "visible");
      const innermost = submenus.length === 0;
      if (!innermost) {
        return;
      }

      if (Date.now() < key_sequence_last_timestamp.current + 700) {
        // continue key sequence
        key_sequence_reference.current += e.key.toLowerCase();
      } else {
        // start new key sequence
        key_sequence_reference.current = e.key.toLowerCase();
      }
      let key_seq = key_sequence_reference.current;
      const rtl = rtl_reference.current;
      if (rtl) {
        key_seq = StringUtils.reverse(key_seq);
      }
      for (const item of Array.from(getItemListDiv().children) as HTMLElement[]) {
        const label = item.querySelector(".contextmenu-label") as HTMLElement | null;
        if (!label) continue;
        const label_text = label!.innerText.trim().toLowerCase();
        if (rtl ? label_text.endsWith(key_seq) : label_text.startsWith(key_seq)) {
          item.focus();
          break;
        }
      }
      key_sequence_last_timestamp.current = Date.now();
    };
    window.addEventListener("keydown", keydown_reference.current! as any);

    // Placement resolution
    let placement: SimplePlacementType = "bottom";

    // Resulting positions
    let x = 0,
      y = 0;

    if (e.detail.reference) {
      // Position context menu after a reference element.
      let prev_display = div.style.display;
      if (prev_display === "none") div.style.display = "inline-block";
      const r = await computePosition(e.detail.reference, div, {
        placement: e.detail.prefer,
        middleware: [
          flip(), shift(), offset(10),
          size({
            apply({ availableWidth, availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxWidth: `${availableWidth}px`,
                maxHeight: `${availableHeight}px`,
              });
            },
          }),
        ],
      });
      div.style.display = prev_display;
      x = r.x;
      y = r.y;
      placement = r.placement.replace(/\-.*/, "") as SimplePlacementType;
    } else {
      // Position context menu at a given point.
      assert(
        e.detail.event !== undefined || e.detail.position !== undefined,
        "At least a position must be specified when showing a context menu.",
      );
      let x1 = 0,
        y1 = 0;
      if (e.detail.event) {
        x1 = e.detail.event.clientX;
        y1 = e.detail.event.clientY;
      } else {
        [x1, y1] = e.detail.position!;
      }

      [x, y] = fitViewport(div, [x1, y1]);
    }

    // (x, y) transition
    const timeoutDelay = 45;
    switch (placement) {
      case "top": {
        setX(x);
        setY(y + 15);
        setOpacity(0);
        transitionTimeout = window.setTimeout(() => {
          setTransition(visibleTransition);
          setOpacity(1);
          setY(y);
        }, timeoutDelay);
        break;
      }
      case "bottom": {
        setX(x);
        setY(y - 15);
        setOpacity(0);
        transitionTimeout = window.setTimeout(() => {
          setTransition(visibleTransition);
          setOpacity(1);
          setY(y);
        }, timeoutDelay);
        break;
      }
      case "left": {
        setY(y);
        setX(x + 15);
        setOpacity(0);
        transitionTimeout = window.setTimeout(() => {
          setTransition(visibleTransition);
          setOpacity(1);
          setX(x);
        }, timeoutDelay);
        break;
      }
      case "right": {
        setY(y);
        setX(x - 15);
        setOpacity(0);
        transitionTimeout = window.setTimeout(() => {
          setTransition(visibleTransition);
          setOpacity(1);
          setX(x);
        }, timeoutDelay);
        break;
      }
    }
  }

  // Handle "hideAll" signal
  function hideAll(): void {
    // Obtain item list div
    const itemListDiv = getItemListDiv();

    // Hide base context menu
    setVisible(false);

    if (transitionTimeout !== -1) {
      window.clearTimeout(transitionTimeout);
      transitionTimeout = -1;
    }

    // Viewport event listeners
    currentPointerDownListener = null;

    // Input listeners
    currentInputPressedListener = null;

    // Detach key down handler
    if (keydown_reference.current) {
      window.removeEventListener("keydown", keydown_reference.current! as any);
      keydown_reference.current = null;
    }

    // Hide submenus by querying their classes
    for (const div of Array.from(
      itemListDiv.querySelectorAll("." + submenuClassName),
    ) as HTMLDivElement[]) {
      div.style.visibility = "hidden";
      // Detach key down handler
      if (submenuKeyDownListeners.has(div)) {
        window.removeEventListener("keydown", submenuKeyDownListeners.get(div) as any);
        submenuKeyDownListeners.delete(div);
      }
      submenuInputPressedListeners.delete(div);
    }
  }

  // Detect mouse down event out of the context menu,
  // closing all connected menus.
  function viewport_mouseDown(): void {
    if (!visible) {
      return;
    }

    // Obtain div element
    const div = div_reference.current!;

    // Test hover
    let out = true;
    if ($(div).is(":visible")) {
      if (div.getAttribute("data-hover") == "true") {
        out = false;
      }

      if (out) {
        for (const div1 of Array.from(
          getItemListDiv().querySelectorAll("." + submenuClassName),
        ) as HTMLDivElement[]) {
          if ($(div1).is(":hidden")) {
            continue;
          }
          // Test hover
          if (div1.getAttribute("data-hover") == "true") {
            out = false;
            break;
          }
        }
      }
    }

    if (out) {
      hideAll();
    }
  }

  // Handle arrows and escape
  function input_inputPressed(e: Event): void {
    if (!visible) {
      return;
    }

    // Obtain item list div
    const itemListDiv = getItemListDiv();

    if (input.justPressed("escape")) {
      // If this is the innermost context menu open, close it.
      const submenus = (
        Array.from(
          itemListDiv.querySelectorAll("." + submenuClassName),
        ) as HTMLDivElement[]
      ).filter((div) => div.style.visibility == "visible");
      const innermost = submenus.length === 0;
      if (innermost) {
        // since this is the only context menu open, just close "all".
        hideAllContextMenu();
      } else {
        // Check input on submenu
        submenuInputPressedListeners.get(submenus[submenus.length - 1])!();
      }

      return;
    }

    for (let i = 0; i < itemListDiv.children.length; i++) {
      // Child (item or submenu)
      const child = itemListDiv.children[i] as HTMLElement;

      // If focused
      if (document.activeElement === child) {
        // navigate up
        if (input.justPressed("navigateUp")) {
          e.preventDefault();
          focusPrevSibling(child);
        }
        // navigate down
        else if (input.justPressed("navigateDown")) {
          e.preventDefault();
          focusNextSibling(child);
        }
        // open submenu
        else if (
          input.justPressed(
            !rtl_reference.current ? "navigateRight" : "navigateLeft",
          ) &&
          child.classList.contains(submenuItemClassName)
        ) {
          (child as HTMLButtonElement).click();
          const submenuList = child.nextElementSibling!;
          if (submenuList.classList.contains(submenuClassName)) {
            if (submenuList.children[1].lastElementChild) {
              e.preventDefault();
              focusNextSibling(
                submenuList.children[1].lastElementChild as HTMLElement,
              );
            }
          }
        }

        return;
      }
    }

    // If this is the innermost context menu open
    const submenus = (
      Array.from(
        itemListDiv.querySelectorAll("." + submenuClassName),
      ) as HTMLDivElement[]
    ).filter((div) => div.style.visibility == "visible");
    const innermost = submenus.length === 0;
    if (innermost) {
      // focus last
      if (input.justPressed("navigateUp")) {
        let first = itemListDiv.firstElementChild;
        if (first) {
          e.preventDefault();
          focusPrevSibling(first as HTMLElement);
        }
      }
      // focus first
      else if (input.justPressed("navigateDown")) {
        let last = itemListDiv.lastElementChild;
        if (last) {
          e.preventDefault();
          focusNextSibling(last as HTMLElement);
        }
      }
    } else {
      // Check input on submenu
      submenuInputPressedListeners.get(submenus[submenus.length - 1])!(e);
    }
  }

  useEffect(() => {
    if (visible) {
      // Viewport event listeners
      currentPointerDownListener = viewport_mouseDown;

      // Input listeners
      currentInputPressedListener = input_inputPressed;
    }
  }, [visible]);

  useEffect(() => {
    const div = div_reference.current!;

    function pointerEnter() {
      div.setAttribute("data-hover", "true");
    }
    function pointerLeave() {
      div.removeAttribute("data-hover");
    }
    div.addEventListener("pointerenter", pointerEnter);
    div.addEventListener("pointerleave", pointerLeave);

    eventDispatcher.addEventListener("show", eventDispatcher_show);
    eventDispatcher.addEventListener("hideAll", hideAll);

    // Cleanup
    return () => {
      // Pointer events
      div.removeEventListener("pointerenter", pointerEnter);
      div.removeEventListener("pointerleave", pointerLeave);

      // Event dispatcher listeners
      eventDispatcher.removeEventListener("show", eventDispatcher_show);
      eventDispatcher.removeEventListener("hideAll", hideAll);
    };
  }, []);

  // Reflect ?RTL
  useEffect(() => {
    rtl_reference.current = rtl;
  }, [rtl]);

  return (
    <MainDiv
      ref={div_reference}
      $visible={visible}
      $theme={theme}
      $opacity={opacity}
      $transition={transition}
      $arrowsVisible={arrowsVisible}
      $x={x}
      $y={y}
    >
      <div className="contextmenu-up-arrow">
        <UpArrowIcon size={7.5} />
      </div>
      <div className="contextmenu-list">{params.children}</div>
      <div className="contextmenu-down-arrow">
        <DownArrowIcon size={7.5} />
      </div>
    </MainDiv>
  );
}

export type ContextMenuParams = {
  /**
   * The context menu identifier must be the same
   * as the one returned from its respective `useContextMenu()` hook.
   */
  id: string;

  children?: React.ReactNode;
};

// Main div CSS
const MainDiv = styled.div<{
  $visible: boolean;
  $theme: Theme;
  $opacity: number;
  $transition: string | undefined;
  $arrowsVisible: boolean;
  $x: number;
  $y: number;
}>`
  && {
    display: inline-flex;
    visibility: ${$ => ($.$visible ? "visible" : "hidden")};
    flex-direction: column;
    position: fixed;
    background: ${$ => $.$theme.colors.inputBackground};
    border: 0.15em solid ${$ => $.$theme.colors.inputBorder};
    padding: ${EMConvert.points.emUnit(6)} 0;
    min-width: 12em;
    max-height: 30em;
    left: ${$ => $.$x}px;
    top: ${$ => $.$y}px;
    opacity: ${$ => $.$opacity.toString()};
    ${$ => ($.$transition ? `transition: ${$.$transition};` : "")}
    z-index: ${MAXIMUM_Z_INDEX};
  }

  && > .contextmenu-up-arrow,
  && > .contextmenu-down-arrow {
    display: ${$ => ($.$arrowsVisible ? "flex" : "none")};
    color: ${$ => $.$theme.colors.foreground};
    flex-direction: row;
    justify-content: center;
    height: ${EMConvert.points.emUnit(10)};
  }

  && > .contextmenu-list {
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scrollbar-width: none;
    flex-grow: 3;
  }
`;

/**
 * A context menu item.
 */
export function ContextMenuItem(params: ContextMenuItemParams) {
  // Locale direction
  const rtl = useContext(RTLContext);

  // Use the theme context
  const theme = useContext(ThemeContext);

  // Button ref
  const button_reference = useRef<HTMLButtonElement | null>(null);

  // Build the style class
  const hoverBackground = Color(theme.colors.inputBackground)
    .darken(0.4)
    .toString();

  function hideAllFromParent(element: HTMLElement): void {
    const parent = element.parentElement!;
    for (const div of Array.from(
      parent.querySelectorAll("." + submenuClassName),
    ) as HTMLDivElement[]) {
      div.style.visibility = "hidden";
      // Detach key down handler
      if (submenuKeyDownListeners.has(div)) {
        window.removeEventListener("keydown", submenuKeyDownListeners.get(div) as any);
        submenuKeyDownListeners.delete(div);
      }
      submenuInputPressedListeners.delete(div);
    }
  }

  function button_pointerX(_e: PointerEvent): void {
    const button = button_reference.current!;
    button.focus();
    hideAllFromParent(button);
  }

  useEffect(() => {
    const button = button_reference.current!;
    button.addEventListener("pointerover", button_pointerX);
    return () => {
      button.removeEventListener("pointerover", button_pointerX);
    };
  }, []);

  function button_click(): void {
    hideAllContextMenu();
    params.click?.();
  }

  return (
    <ItemButton
      className={
        BUTTON_NAVIGABLE + (params.className ? " " + params.className : "")
      }
      disabled={params.disabled}
      onClick={button_click}
      onPointerOver={() => {
        button_reference.current!.focus();
      }}
      ref={button_reference}
      $rtl={rtl}
      $theme={theme}
      $hoverBackground={hoverBackground}
    >
      {params.children}
    </ItemButton>
  );
}

export type ContextMenuItemParams = {
  className?: string;

  disabled?: boolean;
  children?: React.ReactNode;
  click?: () => void;
};

const ItemButton = styled.button<{
  $rtl: boolean;
  $theme: Theme;
  $hoverBackground: string;
}>`
  && {
    display: inline-flex;
    flex-direction: ${$ => (!$.$rtl ? "row" : "row-reverse")};
    gap: 0.9em;
    padding: 0.5em 0.7em;
    background: none;
    border: none;
    outline: none;
    color: ${$ => $.$theme.colors.foreground};
  }

  &&:focus:not(:disabled) {
    background: ${$ => $.$hoverBackground};
  }

  &&:active:not(:disabled) {
    background: ${$ => $.$theme.colors.primary};
    color: ${$ => $.$theme.colors.primaryForeground};
  }

  &&:disabled {
    opacity: 0.5;
  }
`;

/**
 * A column in a context menu item for reserving space
 * for "checked" and "selected option" signs.
 */
export function ContextMenuIndicator(params: ContextMenuIndicatorParams) {
  // Size
  const size = EMConvert.points.emUnit(9);

  return (
    <CheckSpan $size={size}>
      {params.state == "none" ? undefined : params.state == "checked" ? (
        <CheckedIcon />
      ) : (
        <BulletIcon />
      )}
    </CheckSpan>
  );
}

export type ContextMenuIndicatorParams = {
  state?: ContextMenuIndicatorState;
};

export type ContextMenuIndicatorState = "none" | "checked" | "option";

// CSS
const CheckSpan = styled.span<{
  $size: string;
}>`
  && {
    width: ${$ => $.$size};
    height: ${$ => $.$size};
  }
`;

/**
 * A column in a context menu item for reserving space
 * for an icon.
 */
export function ContextMenuIcon(params: ContextMenuIconParams) {
  // Size
  const size = EMConvert.points.emUnit(9);

  return <IconSpan $size={size}>{params.children}</IconSpan>;
}

export type ContextMenuIconParams = {
  children?: React.ReactNode;
};

// CSS
const IconSpan = styled.span<{
  $size: string;
}>`
  && {
    width: ${$ => $.$size};
    height: ${$ => $.$size};
  }
`;

/**
 * A column in a context menu item for reserving space
 * for a label.
 */
export function ContextMenuLabel(params: ContextMenuLabelParams) {
  // Locale direction
  const rtl = useContext(RTLContext);

  return <LabelSpan className="contextmenu-label" $rtl={rtl}>{params.children}</LabelSpan>;
}

export type ContextMenuLabelParams = {
  children?: React.ReactNode;
};

// CSS
const LabelSpan = styled.span<{
  $rtl: boolean;
}>`
  ${$ => (!$.$rtl ? "" : "text-align: right;")}
`;

/**
 * A column in a context menu item for reserving space
 * for a shortcut label or a right icon.
 */
export function ContextMenuLast(params: ContextMenuLastParams) {
  // Locale direction
  const rtl = useContext(RTLContext);

  // Minimum size for an icon
  const size = EMConvert.points.emUnit(9);

  return (
    <RightSpan $size={size} $rtl={rtl}>
      {params.children}
    </RightSpan>
  );
}

export type ContextMenuLastParams = {
  children?: React.ReactNode;
};

const RightSpan = styled.span<{
  $rtl: boolean;
  $size: string;
}>`
  && {
    flex-grow: 4;
    ${$ => (!$.$rtl ? "margin-left: 2em;" : "")}
    ${$ => ($.$rtl ? "margin-right: 2em;" : "")}
    text-align: ${$ => (!$.$rtl ? "right" : "left")};
    font-size: 0.8em;
    opacity: 0.6;
    min-width: ${$ => $.$size};
    min-height: ${$ => $.$size};
  }
`;

/**
 * A submenu of a context menu.
 */
export function ContextMenuSubmenu(params: ContextMenuSubmenuParams) {
  // Locale direction
  const rtl = useContext(RTLContext);
  const rtl_reference = useRef<boolean>(rtl);

  // Use the theme context
  const theme = useContext(ThemeContext);

  // Button reference
  const button_reference = useRef<HTMLButtonElement | null>(null);

  // Build the style class
  const hoverBackground = Color(theme.colors.inputBackground)
    .darken(0.4)
    .toString();

  // Transition timeout
  let transitionTimeout = -1;

  function getDiv(): HTMLDivElement {
    const button = button_reference.current!;
    const div = button.nextElementSibling;
    assert(
      div instanceof HTMLDivElement && div.classList.contains(submenuClassName),
      "Incorrectly built submenu.",
    );
    return div as HTMLDivElement;
  }

  function getItemListDiv(): HTMLDivElement {
    return getDiv().children[1] as HTMLDivElement;
  }

  function getUpArrow(): HTMLDivElement {
    return getDiv().children[0] as HTMLDivElement;
  }

  function getDownArrow(): HTMLDivElement {
    return getDiv().children[2] as HTMLDivElement;
  }

  async function show(div: HTMLDivElement) {
    // Hide all context menu's submenus from the parent
    hideAllFromParent(div, true);

    // Do not re-open the submenu.
    if (div.style.visibility == "visible") {
      return;
    }

    // Turn visible
    div.style.visibility = "visible";

    // Turn arrows visible or hidden
    const listItemDiv = getItemListDiv();
    const k_scroll = listItemDiv.scrollTop;
    listItemDiv.scrollTop = 10;
    const arrowsVisible = listItemDiv.scrollTop != 0;
    getUpArrow().style.display = getDownArrow().style.display = arrowsVisible
      ? "flex"
      : "none";
    listItemDiv.scrollTop = k_scroll;

    // Disable transition
    div.style.transition = "";

    // Button
    const button = button_reference.current!;

    // Input listeners
    submenuInputPressedListeners.set(div, input_inputPressed);

    // Key down handler
    if (submenuKeyDownListeners.has(div)) {
      window.removeEventListener("keydown", submenuKeyDownListeners.get(div) as any);
    }
    submenuKeyDownListeners.set(div, (e: KeyboardEvent) => {
      if (e.key == " ") {
        e.preventDefault();
      }
      if (String.fromCodePoint(e.key.toLowerCase().codePointAt(0) ?? 0) != e.key.toLowerCase()) {
        div.setAttribute("data-keySequenceLastTimestamp", "0");
        return;
      }

      // Proceed only if this is the innermost context menu open.
      const submenus = (
        Array.from(
          getItemListDiv().querySelectorAll("." + submenuClassName),
        ) as HTMLDivElement[]
      ).filter((div) => div.style.visibility == "visible");
      const innermost = submenus.length === 0;
      if (!innermost) {
        return;
      }

      let key_sequence_last_timestamp = parseInt(div.getAttribute("data-keySequenceLastTimestamp") ?? "0");
      let key_sequence = div.getAttribute("data-keySequence") ?? "";

      if (Date.now() < key_sequence_last_timestamp + 700) {
        // continue key sequence
        key_sequence += e.key.toLowerCase();
      } else {
        // start new key sequence
        key_sequence = e.key.toLowerCase();
      }
      let key_seq_rev = key_sequence;
      const rtl = rtl_reference.current;
      if (rtl) {
        key_seq_rev = StringUtils.reverse(key_seq_rev);
      }
      div.setAttribute("data-keySequence", key_sequence);
      for (const item of Array.from(getItemListDiv().children) as HTMLElement[]) {
        const label = item.querySelector(".contextmenu-label") as HTMLElement | null;
        if (!label) continue;
        const label_text = label!.innerText.trim().toLowerCase();
        if (rtl ? label_text.endsWith(key_seq_rev) : label_text.startsWith(key_seq_rev)) {
          item.focus();
          break;
        }
      }
      div.setAttribute("data-keySequenceLastTimestamp", Date.now().toString());
    });
    window.addEventListener("keydown", submenuKeyDownListeners.get(div) as any);

    // Position context menu after butotn.
    let prev_display = div.style.display;
    if (prev_display === "none") div.style.display = "inline-block";
    const r = await computePosition(button, div, {
      placement: !rtl_reference.current ? "right" : "left",
      middleware: [
        flip(), shift(),
        size({
          apply({ availableWidth, availableHeight, elements }) {
            Object.assign(elements.floating.style, {
              maxWidth: `${availableWidth}px`,
              maxHeight: `${availableHeight}px`,
            });
          },
        }),
      ],
    });
    div.style.display = prev_display;
    const x = r.x;
    const y = r.y;
    const placement = r.placement.replace(/\-.*/, "") as SimplePlacementType;
    div.style.left = x + "px";
    div.style.top = y + "px";

    // (x, y) transition
    const timeoutDelay = 25;
    switch (placement) {
      case "top": {
        div.style.left = x + "px";
        div.style.top = y + 15 + "px";
        div.style.opacity = "0";
        transitionTimeout = window.setTimeout(() => {
          div.style.transition = visibleTransition;
          div.style.opacity = "1";
          div.style.top = y + "px";
        }, timeoutDelay);
        break;
      }
      case "bottom": {
        div.style.left = x + "px";
        div.style.top = y - 15 + "px";
        div.style.opacity = "0";
        transitionTimeout = window.setTimeout(() => {
          div.style.transition = visibleTransition;
          div.style.opacity = "1";
          div.style.top = y + "px";
        }, timeoutDelay);
        break;
      }
      case "left": {
        div.style.top = y + "px";
        div.style.left = x + 15 + "px";
        div.style.opacity = "0";
        transitionTimeout = window.setTimeout(() => {
          div.style.transition = visibleTransition;
          div.style.opacity = "1";
          div.style.left = x + "px";
        }, timeoutDelay);
        break;
      }
      case "right": {
        div.style.top = y + "px";
        div.style.left = x - 15 + "px";
        div.style.opacity = "0";
        transitionTimeout = window.setTimeout(() => {
          div.style.transition = visibleTransition;
          div.style.opacity = "1";
          div.style.left = x + "px";
        }, timeoutDelay);
        break;
      }
    }
  }

  function hideAllFromParent(
    element: HTMLElement,
    excludeSelf: boolean = false,
  ): void {
    if (transitionTimeout !== -1) {
      window.clearTimeout(transitionTimeout);
      transitionTimeout = -1;
    }

    const parent = element.parentElement!;
    const divs = Array.from(
      parent.querySelectorAll("." + submenuClassName),
    ) as HTMLDivElement[];

    // Exclude self submenu
    if (excludeSelf) {
      if (element instanceof HTMLButtonElement) {
        assert(
          element.nextElementSibling instanceof HTMLElement,
          "Incorrectly built submenu.",
        );
        element = element.nextElementSibling as HTMLElement;
      }
      const i = divs.indexOf(element as HTMLDivElement);
      if (i !== -1) {
        divs.splice(i, 1);
      }
    }

    for (const div of divs) {
      div.style.visibility = "hidden";
      // Detach key down handler
      if (submenuKeyDownListeners.has(div)) {
        window.removeEventListener("keydown", submenuKeyDownListeners.get(div) as any);
        submenuKeyDownListeners.delete(div);
      }
      submenuInputPressedListeners.delete(div);
    }
  }

  function button_click(_e: MouseEvent): void {
    show(getDiv());
  }

  let hoverTimeout: number = -1;

  function button_ponterOver(e: PointerEvent): void {
    button_reference.current!.focus();
    hoverTimeout = window.setTimeout(() => {
      show(getDiv());
    }, 500);
  }

  function button_pointerOut(e: PointerEvent): void {
    if (hoverTimeout !== -1) {
      window.clearTimeout(hoverTimeout);
      hoverTimeout = -1;
    }
  }

  // Handle arrows and escape
  function input_inputPressed(e: Event): void {
    // Obtain button element
    const button = button_reference.current!;

    // Obtain div element
    const div = getDiv();

    if (input.justPressed("escape")) {
      // If this is the innermost context menu open, close it.
      const innermost = !Array.from(
        div.querySelectorAll("." + submenuClassName),
      ).some((div) => (div as HTMLElement).style.visibility == "visible");
      if (innermost) {
        hideAllFromParent(div);

        // focus back the submenu representing item.
        button.focus();
      }

      return;
    }

    // Item list div
    const itemListDiv = getItemListDiv();

    for (let i = 0; i < itemListDiv.children.length; i++) {
      // Child (item or submenu)
      const child = itemListDiv.children[i] as HTMLElement;

      // If focused
      if (document.activeElement === child) {
        // navigate up
        if (input.justPressed("navigateUp")) {
          e.preventDefault();
          focusPrevSibling(child);
        }
        // navigate down
        else if (input.justPressed("navigateDown")) {
          e.preventDefault();
          focusNextSibling(child);
        }
        // open submenu
        else if (
          input.justPressed(
            !rtl_reference.current ? "navigateRight" : "navigateLeft",
          ) &&
          child.classList.contains(submenuItemClassName)
        ) {
          (child as HTMLButtonElement).click();
          const submenuList = child.nextElementSibling!;
          if (submenuList.classList.contains(submenuClassName)) {
            if (submenuList.children[1].lastElementChild) {
              e.preventDefault();
              focusNextSibling(
                submenuList.children[1].lastElementChild as HTMLElement,
              );
            }
          }
        }
        // close current submenu
        else if (
          input.justPressed(
            !rtl_reference.current ? "navigateLeft" : "navigateRight",
          )
        ) {
          hideAllFromParent(div);

          // focus back the submenu representing item.
          button.focus();
        }

        return;
      }
    }

    // If this is the innermost context menu open
    const innermost = !Array.from(
      div.querySelectorAll("." + submenuClassName),
    ).some((div) => (div as HTMLElement).style.visibility == "visible");
    if (innermost) {
      // focus last
      if (input.justPressed("navigateUp")) {
        let first = itemListDiv.firstElementChild;
        if (first) {
          e.preventDefault();
          focusPrevSibling(first as HTMLElement);
        }
      }
      // focus first
      else if (input.justPressed("navigateDown")) {
        let last = itemListDiv.lastElementChild;
        if (last) {
          e.preventDefault();
          focusNextSibling(last as HTMLElement);
        }
      }
      // close current submenu
      else if (
        input.justPressed(
          !rtl_reference.current ? "navigateLeft" : "navigateRight",
        )
      ) {
        hideAllFromParent(div);

        // focus back the submenu representing item.
        button.focus();
      }
    }
  }

  useEffect(() => {
    const button = button_reference.current!;

    button.addEventListener("pointerover", button_ponterOver);
    button.addEventListener("pointerout", button_pointerOut);
    button.addEventListener("click", button_click);

    // Submenu div
    const div = getDiv();

    // Track input pressed listener
    if (div) {
      submenuInputPressedListeners.set(div, input_inputPressed);
    }

    return () => {
      button.removeEventListener("pointerover", button_ponterOver);
      button.removeEventListener("pointerout", button_pointerOut);
      button.removeEventListener("click", button_click);

      // Input listeners
      submenuInputPressedListeners.delete(div);
    };
  }, []);

  // Reflect ?RTL
  useEffect(() => {
    rtl_reference.current = rtl;
  }, [rtl]);

  return (
    <SubmenuButton
      className={submenuItemClassName + " " + BUTTON_NAVIGABLE}
      ref={button_reference}
      $rtl={rtl}
      $theme={theme}
      $hoverBackground={hoverBackground}
      onPointerOver={e => {
        button_reference.current!.focus();
      }}>
      {params.children}
    </SubmenuButton>
  );
}

export type ContextMenuSubmenuParams = {
  children?: React.ReactNode;
};

const SubmenuButton = styled.button<{
  $rtl: boolean;
  $theme: Theme;
  $hoverBackground: string;
}>`
  && {
    display: inline-flex;
    flex-direction: ${$ => (!$.$rtl ? "row" : "row-reverse")};
    gap: 0.9em;
    padding: 0.5em 0.7em;
    background: none;
    border: none;
    outline: none;
    color: ${$ => $.$theme.colors.foreground};
  }

  &&:focus {
    background: ${$ => $.$hoverBackground};
  }

  &&:active {
    background: ${$ => $.$theme.colors.primary};
    color: ${$ => $.$theme.colors.primaryForeground};
  }
`;

/**
 * List of menu items under a submenu of a context menu.
 */
export function ContextMenuSubmenuList(params: ContextMenuSubmenuListParams) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // References
  const div_reference = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const div = div_reference.current!;
    function pointerEnter() {
      div.setAttribute("data-hover", "true");
    }
    function pointerLeave() {
      div.removeAttribute("data-hover");
    }
    div.addEventListener("pointerenter", pointerEnter);
    div.addEventListener("pointerleave", pointerLeave);

    return () => {
      div.removeEventListener("pointerenter", pointerEnter);
      div.removeEventListener("pointerleave", pointerLeave);
    };
  }, []);

  return (
    <SubmenuMainDiv ref={div_reference} className={submenuClassName} $theme={theme}>
      <div className="contextmenu-up-arrow">
        <UpArrowIcon size={7.5} />
      </div>
      <div className="contextmenu-list">{params.children}</div>
      <div className="contextmenu-down-arrow">
        <DownArrowIcon size={7.5} />
      </div>
    </SubmenuMainDiv>
  );
}

export type ContextMenuSubmenuListParams = {
  children?: React.ReactNode;
};

// Main div CSS
const SubmenuMainDiv = styled.div<{
  $theme: Theme;
}>`
  && {
    display: inline-flex;
    visibility: "hidden";
    flex-direction: column;
    position: fixed;
    background: ${$ => $.$theme.colors.inputBackground};
    border: 0.15em solid ${$ => $.$theme.colors.inputBorder};
    padding: ${EMConvert.points.emUnit(6)} 0;
    min-width: 12em;
    max-height: 30em;
    opacity: 0;
    z-index: ${MAXIMUM_Z_INDEX};
  }

  && > .contextmenu-up-arrow,
  && > .contextmenu-down-arrow {
    display: flex;
    color: ${$ => $.$theme.colors.foreground};
    flex-direction: row;
    justify-content: center;
    height: ${EMConvert.points.emUnit(10)};
  }

  && > .contextmenu-list {
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scrollbar-width: none;
    flex-grow: 3;
  }
`;

/**
 * Context menu submenu arrow icon (left or right depending on locale).
 */
export function ContextMenuSubIcon(params: IconParams) {
  // Locale direction
  const rtl = useContext(RTLContext);

  return (
    <ArrowIcon
      direction={!rtl ? "right" : "left"}
      size={params.size ?? 9}
      style={params.style}
    />
  );
}

/**
 * A context menu horizontal separator.
 */
export function ContextMenuSeparator() {
  return <SeparatorDiv></SeparatorDiv>;
}

const SeparatorDiv = styled.div`
  && {
    padding: 0.45em;
  }
`;