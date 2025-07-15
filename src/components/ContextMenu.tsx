import { TypedEventTarget } from "@hydroperx/event";
import { useContext, useRef, useState, useEffect } from "react";
import { styled } from "styled-components";
import { computePosition, flip, shift, size } from "@floating-ui/dom";
import { Color } from "@hydroperx/color";
import assert from "assert";
import { input } from "@hydroperx/inputaction";
import $ from "jquery";

import {
  ArrowIcon,
  BulletIcon,
  CheckedIcon,
  DownArrowIcon,
  IconOptions,
  UpArrowIcon,
} from "./Icons";
import { RTLContext } from "../layout/RTL";
import { fitViewport, Side } from "../utils/PlacementUtils";
import { Theme, ThemeContext } from "../theme";
import {
  BUTTON_NAVIGABLE,
  fontFamily,
  fontSize,
  maximumZIndex,
} from "../utils/vars";
import * as RFConvert from "../utils/RFConvert";
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
  readonly prefer: Side | undefined;
}

// Transition used in context menus.
const visibleTransition =
  "opacity 0.3s ease-out, top 0.3s ease-out, left 0.3s ease-out";

// Event dispatcher used for sending signals to
// context menus, such as requests to show them and to hide them.
const eventDispatcher = new ContextMenuEventDispatcher();

// Items representing submenus are identified by this class name.
const submenuItemClassName = "ContextMenuSubmenu-item";

// Submenus are identified by this class name.
const submenuClassName = "ContextMenuSubmenuList-submenu";

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

// Invoked by the global mouse down event listener
let currentMouseDownListener: Function | null = null;

// Globalized mouse down event listener
if (typeof window !== "undefined") {
  window.addEventListener("mousedown", function (): void {
    currentMouseDownListener?.();
  });
}

/**
 * Hook for using a context menu.
 */
export function useContextMenu(): UseContextMenuHook {
  const id = "cxm$" + randomHexLarge();

  return {
    id,

    show: function (options: ContextMenuShowOptions) {
      // Hide other context menu first
      hideAllContextMenu();

      // Dispatch a show event
      setTimeout(() => {
        eventDispatcher.dispatchEvent(
          new CustomEvent("show", {
            detail: {
              id,
              event: options.event,
              position: options.position,
              reference: options.reference,
              prefer: options.prefer,
            },
          }),
        );
      }, 300);
    },
  };
}

export type UseContextMenuHook = {
  id: string;
  show: (options: ContextMenuShowOptions) => void;
};

/**
 * Context menu show options.
 */
export type ContextMenuShowOptions = {
  /**
   * Preferred placement side.
   */
  prefer?: Side;
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
export function ContextMenu(options: ContextMenuOptions) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // Locale direction
  const rtl = useContext(RTLContext);
  const rtl_reference = useRef<{ value?: boolean }>({}).current;
  rtl_reference.value = rtl;

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
    if (e.detail.id !== options.id) {
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
    currentMouseDownListener = viewport_mouseDown;

    // Input listeners
    currentInputPressedListener = input_inputPressed;

    // Key down handler
    if (keydown_reference.current) {
      window.removeEventListener("keydown", keydown_reference.current! as any);
    }
    keydown_reference.current = (e: KeyboardEvent) => {
      if (e.key == " " || String.fromCodePoint(e.key.toLowerCase().codePointAt(0) ?? 0) != e.key.toLowerCase()) {
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
      for (const item of Array.from(getItemListDiv().children) as HTMLElement[]) {
        const label = item.querySelector(".ContextMenuLabel") as HTMLElement | null;
        if (!label) continue;
        const label_text = label!.innerText.trim().toLowerCase();
        if (label_text.startsWith(key_sequence_reference.current)) {
          item.focus();
          break;
        }
      }
      key_sequence_last_timestamp.current = Date.now();
    };
    window.addEventListener("keydown", keydown_reference.current! as any);

    // Side resolution
    let sideResolution: Side = "bottom";

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
      x = r.x;
      y = r.y;
      sideResolution = r.placement.replace(/\-.*/, "") as Side;
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
    switch (sideResolution) {
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
    currentMouseDownListener = null;

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
      if (div.matches(":hover")) {
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
          if (div1.matches(":hover")) {
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
            !rtl_reference.value ? "navigateRight" : "navigateLeft",
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
      currentMouseDownListener = viewport_mouseDown;

      // Input listeners
      currentInputPressedListener = input_inputPressed;
    }
  }, [visible]);

  useEffect(() => {
    eventDispatcher.addEventListener("show", eventDispatcher_show);
    eventDispatcher.addEventListener("hideAll", hideAll);

    // Cleanup
    return () => {
      // Event dispatcher listeners
      eventDispatcher.removeEventListener("show", eventDispatcher_show);
      eventDispatcher.removeEventListener("hideAll", hideAll);
    };
  });

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
      <div className="ContextMenu-up-arrow">
        <UpArrowIcon size={7.5} />
      </div>
      <div className="ContextMenu-list">{options.children}</div>
      <div className="ContextMenu-down-arrow">
        <DownArrowIcon size={7.5} />
      </div>
    </MainDiv>
  );
}

export type ContextMenuOptions = {
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
  display: inline-flex;
  visibility: ${($) => ($.$visible ? "visible" : "hidden")};
  flex-direction: column;
  position: fixed;
  background: ${($) => $.$theme.colors.inputBackground};
  border: 0.15rem solid ${($) => $.$theme.colors.inputBorder};
  padding: ${RFConvert.points.cascadingRF(6)} 0;
  min-width: 12rem;
  max-height: 30rem;
  left: ${($) => $.$x}px;
  top: ${($) => $.$y}px;
  opacity: ${($) => $.$opacity.toString()};
  ${($) => ($.$transition ? `transition: ${$.$transition};` : "")}
  z-index: ${maximumZIndex};

  & > .ContextMenu-up-arrow,
  & > .ContextMenu-down-arrow {
    display: ${($) => ($.$arrowsVisible ? "flex" : "none")};
    flex-direction: row;
    justify-content: center;
    height: ${RFConvert.points.cascadingRF(7.5)};
  }

  & > .ContextMenu-list {
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
export function ContextMenuItem(options: ContextMenuItemOptions) {
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

  function button_mouseX(_e: MouseEvent): void {
    const button = button_reference.current!;
    button.focus();
    hideAllFromParent(button);
  }

  useEffect(() => {
    const button = button_reference.current!;

    button.addEventListener("mouseover", button_mouseX);
  });

  function button_click(): void {
    hideAllContextMenu();
    options.click?.();
  }

  return (
    <ItemButton
      className={
        BUTTON_NAVIGABLE + (options.className ? " " + options.className : "")
      }
      disabled={options.disabled}
      onClick={button_click}
      ref={button_reference}
      $rtl={rtl}
      $theme={theme}
      $hoverBackground={hoverBackground}
    >
      {options.children}
    </ItemButton>
  );
}

export type ContextMenuItemOptions = {
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
  display: inline-flex;
  flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
  gap: 0.9rem;
  padding: 0.5rem 0.7rem;
  background: none;
  border: none;
  outline: none;
  color: ${($) => $.$theme.colors.foreground};
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    background: ${($) => $.$hoverBackground};
  }

  &:active:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

/**
 * A column in a context menu item for reserving space
 * for "checked" and "selected option" signs.
 */
export function ContextMenuIndicator(options: ContextMenuIndicatorOptions) {
  // Size
  const size = RFConvert.points.cascadingRF(9);

  return (
    <CheckSpan $size={size}>
      {options.state == "none" ? undefined : options.state == "checked" ? (
        <CheckedIcon />
      ) : (
        <BulletIcon />
      )}
    </CheckSpan>
  );
}

export type ContextMenuIndicatorOptions = {
  state?: ContextMenuIndicatorState;
};

export type ContextMenuIndicatorState = "none" | "checked" | "option";

// CSS
const CheckSpan = styled.span<{
  $size: string;
}>`
  width: ${($) => $.$size};
  height: ${($) => $.$size};
`;

/**
 * A column in a context menu item for reserving space
 * for an icon.
 */
export function ContextMenuIcon(options: ContextMenuIconOptions) {
  // Size
  const size = RFConvert.points.cascadingRF(9);

  return <IconSpan $size={size}>{options.children}</IconSpan>;
}

export type ContextMenuIconOptions = {
  children?: React.ReactNode;
};

// CSS
const IconSpan = styled.span<{
  $size: string;
}>`
  width: ${($) => $.$size};
  height: ${($) => $.$size};
`;

/**
 * A column in a context menu item for reserving space
 * for a label.
 */
export function ContextMenuLabel(options: ContextMenuLabelOptions) {
  // Locale direction
  const rtl = useContext(RTLContext);

  return <LabelSpan className="ContextMenuLabel" $rtl={rtl}>{options.children}</LabelSpan>;
}

export type ContextMenuLabelOptions = {
  children?: React.ReactNode;
};

// CSS
const LabelSpan = styled.span<{
  $rtl: boolean;
}>`
  ${($) => (!$.$rtl ? "" : "text-align: right;")}
`;

/**
 * A column in a context menu item for reserving space
 * for a shortcut label or a right icon.
 */
export function ContextMenuLast(options: ContextMenuLastOptions) {
  // Locale direction
  const rtl = useContext(RTLContext);

  // Minimum size for an icon
  const size = RFConvert.points.cascadingRF(9);

  return (
    <RightSpan $size={size} $rtl={rtl}>
      {options.children}
    </RightSpan>
  );
}

export type ContextMenuLastOptions = {
  children?: React.ReactNode;
};

const RightSpan = styled.span<{
  $rtl: boolean;
  $size: string;
}>`
  flex-grow: 4;
  ${($) => (!$.$rtl ? "margin-left: 2rem;" : "")}
  ${($) => ($.$rtl ? "margin-right: 2rem;" : "")}
    text-align: ${($) => (!$.$rtl ? "right" : "left")};
  font-size: 0.8rem;
  opacity: 0.6;
  min-width: ${($) => $.$size};
  min-height: ${($) => $.$size};
`;

/**
 * A submenu of a context menu.
 */
export function ContextMenuSubmenu(options: ContextMenuSubmenuOptions) {
  // Locale direction
  const rtl = useContext(RTLContext);
  const rtl_reference = useRef<{ value?: boolean }>({}).current;
  rtl_reference.value = rtl;

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
      if (e.key == " " || String.fromCodePoint(e.key.toLowerCase().codePointAt(0) ?? 0) != e.key.toLowerCase()) {
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
      div.setAttribute("data-keySequence", key_sequence);
      for (const item of Array.from(getItemListDiv().children) as HTMLElement[]) {
        const label = item.querySelector(".ContextMenuLabel") as HTMLElement | null;
        if (!label) continue;
        const label_text = label!.innerText.trim().toLowerCase();
        if (label_text.startsWith(key_sequence)) {
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
      placement: !rtl_reference.value ? "right" : "left",
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
    const sideResolution = r.placement.replace(/\-.*/, "") as Side;
    div.style.left = x + "px";
    div.style.top = y + "px";

    // (x, y) transition
    const timeoutDelay = 25;
    switch (sideResolution) {
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

  function button_mouseOver(e: MouseEvent): void {
    button_reference.current!.focus();
    hoverTimeout = window.setTimeout(() => {
      show(getDiv());
    }, 500);
  }

  function button_mouseOut(e: MouseEvent): void {
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
            !rtl_reference.value ? "navigateRight" : "navigateLeft",
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
            !rtl_reference.value ? "navigateLeft" : "navigateRight",
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
          !rtl_reference.value ? "navigateLeft" : "navigateRight",
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

    button.addEventListener("mouseover", button_mouseOver);
    button.addEventListener("mouseout", button_mouseOut);
    button.addEventListener("click", button_click);

    // Submenu div
    const div = getDiv();

    // Track input pressed listener
    if (div) {
      submenuInputPressedListeners.set(div, input_inputPressed);
    }

    return () => {
      // Input listeners
      submenuInputPressedListeners.delete(div);
    };
  });

  return (
    <SubmenuButton
      className={submenuItemClassName + " " + BUTTON_NAVIGABLE}
      ref={button_reference}
      $rtl={rtl}
      $theme={theme}
      $hoverBackground={hoverBackground}
    >
      {options.children}
    </SubmenuButton>
  );
}

export type ContextMenuSubmenuOptions = {
  children?: React.ReactNode;
};

const SubmenuButton = styled.button<{
  $rtl: boolean;
  $theme: Theme;
  $hoverBackground: string;
}>`
  display: inline-flex;
  flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
  gap: 0.9rem;
  padding: 0.5rem 0.7rem;
  background: none;
  border: none;
  outline: none;
  color: ${($) => $.$theme.colors.foreground};
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover,
  &:focus {
    background: ${($) => $.$hoverBackground};
  }

  &:active {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }
`;

/**
 * List of menu items under a submenu of a context menu.
 */
export function ContextMenuSubmenuList(options: ContextMenuSubmenuListOptions) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // References
  const div_reference = useRef<HTMLDivElement | null>(null);

  return (
    <SubmenuMainDiv ref={div_reference} className={submenuClassName} $theme={theme}>
      <div className="ContextMenu-up-arrow">
        <UpArrowIcon size={7.5} />
      </div>
      <div className="ContextMenu-list">{options.children}</div>
      <div className="ContextMenu-down-arrow">
        <DownArrowIcon size={7.5} />
      </div>
    </SubmenuMainDiv>
  );
}

export type ContextMenuSubmenuListOptions = {
  children?: React.ReactNode;
};

// Main div CSS
const SubmenuMainDiv = styled.div<{
  $theme: Theme;
}>`
  display: inline-flex;
  visibility: "hidden";
  flex-direction: column;
  position: fixed;
  background: ${($) => $.$theme.colors.inputBackground};
  border: 0.15rem solid ${($) => $.$theme.colors.inputBorder};
  padding: ${RFConvert.points.cascadingRF(6)} 0;
  min-width: 12rem;
  max-height: 30rem;
  opacity: 0;
  z-index: ${maximumZIndex};

  & > .ContextMenu-up-arrow,
  & > .ContextMenu-down-arrow {
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: ${RFConvert.points.cascadingRF(2.5)};
  }

  & > .ContextMenu-list {
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
export function ContextMenuSubIcon(options: IconOptions) {
  // Locale direction
  const rtl = useContext(RTLContext);

  return (
    <ArrowIcon
      direction={!rtl ? "right" : "left"}
      size={options.size ?? 9}
      style={options.style}
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
  padding: 0.45rem;
`;
