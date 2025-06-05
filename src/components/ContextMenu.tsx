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
import {
  RTLType,
  RTLContext,
} from "../layout/RTL";
import { fitViewportPosition, Side } from "../utils/placement";
import { Theme, ThemeContext } from "../theme";
import {
  BUTTON_NAVIGABLE,
  fontFamily,
  fontSize,
  maximumZIndex,
} from "../utils/common";
import { pointsToRem } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focus";
import { randomHexLarge } from "../utils/random";

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
  const localeDir = useContext(RTLContext);
  const localeDirRef = useRef<{ value?: RTLType }>({}).current;
  localeDirRef.value = localeDir;

  // State
  const [visible, setVisible] = useState<boolean>(false);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0);
  const [transition, setTransition] = useState<string>("");
  const [arrowsVisible, setArrowsVisible] = useState<boolean>(false);

  // References
  const divRef = useRef<HTMLDivElement | null>(null);

  // Transition timeout
  let transitionTimeout = -1;

  function getItemListDiv(): HTMLDivElement {
    return divRef.current!.children[1] as HTMLDivElement;
  }

  // Handle "show" signal
  async function eventDispatcher_onShow(e: CustomEvent<ContextMenuEvent>) {
    // Identifier must match
    if (e.detail.id !== options.id) {
      return;
    }

    // Turn context menu visible
    setVisible(true);

    // Obtain div element
    const div = divRef.current!;

    // Disable transition
    setTransition("");

    // Turn arrows visible or hidden
    const listItemDiv = getItemListDiv();
    const k_scroll = listItemDiv.scrollTop;
    listItemDiv.scrollTop = 10;
    setArrowsVisible(listItemDiv.scrollTop != 0);
    listItemDiv.scrollTop = k_scroll;

    // Viewport event listeners
    currentMouseDownListener = viewport_onMouseDown;

    // Input listeners
    currentInputPressedListener = input_onInputPressed;

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

      [x, y] = fitViewportPosition(div, [x1, y1]);
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

    // Hide submenus by querying their classes
    for (const div of Array.from(
      itemListDiv.querySelectorAll("." + submenuClassName),
    ) as HTMLDivElement[]) {
      div.style.visibility = "hidden";
      submenuInputPressedListeners.delete(div);
    }
  }

  // Detect mouse down event out of the context menu,
  // closing all connected menus.
  function viewport_onMouseDown(): void {
    if (!visible) {
      return;
    }

    // Obtain div element
    const div = divRef.current!;

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
  function input_onInputPressed(e: Event): void {
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
            localeDirRef.value == "ltr" ? "navigateRight" : "navigateLeft",
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
      currentMouseDownListener = viewport_onMouseDown;

      // Input listeners
      currentInputPressedListener = input_onInputPressed;
    }
  }, [visible]);

  useEffect(() => {
    eventDispatcher.addEventListener("show", eventDispatcher_onShow);
    eventDispatcher.addEventListener("hideAll", hideAll);

    // Cleanup
    return () => {
      // Event dispatcher listeners
      eventDispatcher.removeEventListener("show", eventDispatcher_onShow);
      eventDispatcher.removeEventListener("hideAll", hideAll);
    };
  });

  return (
    <MainDiv
      ref={divRef}
      $visible={visible}
      $theme={theme}
      $opacity={opacity}
      $transition={transition}
      $arrowsVisible={arrowsVisible}
      $x={x}
      $y={y}
    >
      <div className="ContextMenu-up-arrow">
        <UpArrowIcon size={2.5} />
      </div>
      <div className="ContextMenu-list">{options.children}</div>
      <div className="ContextMenu-down-arrow">
        <DownArrowIcon size={2.5} />
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
  padding: ${pointsToRem(2)} 0;
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
    height: ${pointsToRem(2.5)};
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
  const localeDir = useContext(RTLContext);

  // Use the theme context
  const theme = useContext(ThemeContext);

  // Button ref
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Build the style class
  const hoverBackground = Color(theme.colors.inputBackground)
    .darken(0.4)
    .toString();

  function hideAllFromParent(element: HTMLElement): void {
    const parent = element.parentElement!;
    for (const divElement of Array.from(
      parent.querySelectorAll("." + submenuClassName),
    )) {
      (divElement as HTMLElement).style.visibility = "hidden";
    }
  }

  function button_onMouseX(_e: MouseEvent): void {
    const button = buttonRef.current!;
    button.focus();
    hideAllFromParent(button);
  }

  useEffect(() => {
    const button = buttonRef.current!;

    button.addEventListener("mouseover", button_onMouseX);
  });

  function button_onClick(): void {
    hideAllContextMenu();
    options.click?.();
  }

  return (
    <ItemButton
      className={
        BUTTON_NAVIGABLE + (options.className ? " " + options.className : "")
      }
      disabled={options.disabled}
      onClick={button_onClick}
      ref={buttonRef}
      $localeDir={localeDir}
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
  $localeDir: "ltr" | "rtl";
  $theme: Theme;
  $hoverBackground: string;
}>`
  display: inline-flex;
  flex-direction: ${($) => ($.$localeDir == "ltr" ? "row" : "row-reverse")};
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
export function ContextMenuCheck(options: ContextMenuCheckOptions) {
  // Size
  const size = pointsToRem(3);

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

export type ContextMenuCheckOptions = {
  state?: ContextMenuCheckState;
};

export type ContextMenuCheckState = "none" | "checked" | "option";

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
  const size = pointsToRem(3);

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
  const localeDir = useContext(RTLContext);

  return <LabelSpan $localeDir={localeDir}>{options.children}</LabelSpan>;
}

export type ContextMenuLabelOptions = {
  children?: React.ReactNode;
};

// CSS
const LabelSpan = styled.span<{
  $localeDir: "ltr" | "rtl";
}>`
  ${($) => ($.$localeDir == "ltr" ? "" : "text-align: right;")}
`;

/**
 * A column in a context menu item for reserving space
 * for a shortcut label or a right icon.
 */
export function ContextMenuRight(options: ContextMenuRightOptions) {
  // Locale direction
  const localeDir = useContext(RTLContext);

  // Minimum size for an icon
  const size = pointsToRem(3);

  return (
    <RightSpan $size={size} $localeDir={localeDir}>
      {options.children}
    </RightSpan>
  );
}

export type ContextMenuRightOptions = {
  children?: React.ReactNode;
};

const RightSpan = styled.span<{
  $localeDir: "ltr" | "rtl";
  $size: string;
}>`
  flex-grow: 4;
  ${($) => ($.$localeDir == "ltr" ? "margin-left: 2rem;" : "")}
  ${($) => ($.$localeDir == "rtl" ? "margin-right: 2rem;" : "")}
    text-align: ${($) => ($.$localeDir == "ltr" ? "right" : "left")};
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
  const localeDir = useContext(RTLContext);
  const localeDirRef = useRef<{ value?: RTLType }>({}).current;
  localeDirRef.value = localeDir;

  // Use the theme context
  const theme = useContext(ThemeContext);

  // Button reference
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Build the style class
  const hoverBackground = Color(theme.colors.inputBackground)
    .darken(0.4)
    .toString();

  // Transition timeout
  let transitionTimeout = -1;

  function getDiv(): HTMLDivElement {
    const button = buttonRef.current!;
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
    const button = buttonRef.current!;

    // Input listeners
    submenuInputPressedListeners.set(div, input_onInputPressed);

    // Position context menu after butotn.
    let prev_display = div.style.display;
    if (prev_display === "none") div.style.display = "inline-block";
    const r = await computePosition(button, div, {
      placement: localeDirRef.value == "ltr" ? "right" : "left",
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
      submenuInputPressedListeners.delete(div);
    }
  }

  function button_onClick(_e: MouseEvent): void {
    show(getDiv());
  }

  let hoverTimeout: number = -1;

  function button_onMouseOver(e: MouseEvent): void {
    buttonRef.current!.focus();
    hoverTimeout = window.setTimeout(() => {
      show(getDiv());
    }, 500);
  }

  function button_onMouseOut(e: MouseEvent): void {
    if (hoverTimeout !== -1) {
      window.clearTimeout(hoverTimeout);
      hoverTimeout = -1;
    }
  }

  // Handle arrows and escape
  function input_onInputPressed(e: Event): void {
    // Obtain button element
    const button = buttonRef.current!;

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
            localeDirRef.value == "ltr" ? "navigateRight" : "navigateLeft",
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
            localeDirRef.value == "ltr" ? "navigateLeft" : "navigateRight",
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
          localeDirRef.value == "ltr" ? "navigateLeft" : "navigateRight",
        )
      ) {
        hideAllFromParent(div);

        // focus back the submenu representing item.
        button.focus();
      }
    }
  }

  useEffect(() => {
    const button = buttonRef.current!;

    button.addEventListener("mouseover", button_onMouseOver);
    button.addEventListener("mouseout", button_onMouseOut);
    button.addEventListener("click", button_onClick);

    // Submenu div
    const div = getDiv();

    // Track input pressed listener
    if (div) {
      submenuInputPressedListeners.set(div, input_onInputPressed);
    }

    return () => {
      // Input listeners
      submenuInputPressedListeners.delete(div);
    };
  });

  return (
    <SubmenuButton
      className={submenuItemClassName + " " + BUTTON_NAVIGABLE}
      ref={buttonRef}
      $localeDir={localeDir}
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
  $localeDir: "ltr" | "rtl";
  $theme: Theme;
  $hoverBackground: string;
}>`
  display: inline-flex;
  flex-direction: ${($) => ($.$localeDir == "ltr" ? "row" : "row-reverse")};
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
  const divRef = useRef<HTMLDivElement | null>(null);

  return (
    <SubmenuMainDiv ref={divRef} className={submenuClassName} $theme={theme}>
      <div className="ContextMenu-up-arrow">
        <UpArrowIcon size={2.5} />
      </div>
      <div className="ContextMenu-list">{options.children}</div>
      <div className="ContextMenu-down-arrow">
        <DownArrowIcon size={2.5} />
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
  padding: ${pointsToRem(2)} 0;
  min-width: 12rem;
  max-height: 30rem;
  opacity: 0;
  z-index: ${maximumZIndex};

  & > .ContextMenu-up-arrow,
  & > .ContextMenu-down-arrow {
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: ${pointsToRem(2.5)};
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
  const localeDir = useContext(RTLContext);

  return (
    <ArrowIcon
      direction={localeDir == "ltr" ? "right" : "left"}
      size={options.size ?? 3}
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
