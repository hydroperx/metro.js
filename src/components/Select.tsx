import React, {
  useContext,
  useRef,
  useState,
  useEffect,
  createContext,
} from "react";
import { styled } from "styled-components";
import { computePosition, offset, flip, shift, size } from "@floating-ui/dom";
import { Color } from "@hydroperx/color";
import { input } from "@hydroperx/inputaction";
import $ from "jquery";
import assert from "assert";

import { RTLContext } from "../layout/RTL";
import { UpArrowIcon, DownArrowIcon } from "./Icons";
import { Side } from "../utils/PlacementUtils";
import { Theme, ThemeContext } from "../theme";
import { enhanceBrightness, contrast } from "../utils/ColorUtils";
import {
  BUTTON_NAVIGABLE,
  fontFamily,
  fontSize,
  maximumZIndex,
} from "../utils/vars";
import * as RFConvert from "../utils/RFConvert";
import { focusPrevSibling, focusNextSibling } from "../utils/FocusUtils";
import { RFObserver } from "../utils/RFObserver";

// Item visible transition
const visibleTransition = "opacity 300ms ease-out, top 300ms ease-out";

// Invoked by the global Input action listener.
let currentInputPressedListener: Function | null = null;

// Globalized input action listener
input.on("inputPressed", function (e: Event): void {
  currentInputPressedListener?.(e);
});

// Global function for changing the selected value of an open context menu.
let currentSelectChange: Function | null = null;

// Global function for closing the currently open select.
let currentSelectClose: Function | null = null;

// Invoked by the global mouse down event listener
let currentMouseDownListener: Function | null = null;

// Globalized mouse down event listener
if (typeof window !== "undefined") {
  window.addEventListener("mousedown", function (): void {
    currentMouseDownListener?.();
  });
}

// Cooldown when clicking options
let cooldown = 0;

// Dropdown CSS
const DropdownDiv = styled.div<{
  $visible: boolean;
  $theme: Theme;
  $big: boolean;
  $medium: boolean;
  $opacity: number;
  $transition: string;
  $arrowsVisible: boolean;
  $x: number;
  $y: number;
}>`
  display: inline-flex;
  visibility: ${($) => ($.$visible ? "visible" : "hidden")};
  flex-direction: column;
  position: fixed;
  min-width: 15rem;
  max-height: 25rem;
  background: ${($) => $.$theme.colors.inputBackground};
  border: ${($) =>
    ($.$big || $.$medium ? "0.3rem" : "0.15rem") +
    " solid " +
    $.$theme.colors.inputBorder};
  left: ${($) => $.$x}px;
  top: ${($) => $.$y}px;
  opacity: ${($) => $.$opacity};
  ${($) => ($.$transition ? `transition: ${$.$transition};` : "")}
  z-index: ${maximumZIndex};

  & .Select-list {
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    scrollbar-width: none;
    flex-grow: 3;
  }

  & .Select-up-arrow,
  & .Select-down-arrow {
    display: ${($) => ($.$arrowsVisible ? "flex" : "none")};
    flex-direction: row;
    justify-content: center;
    height: ${RFConvert.points.cascadingRF(7.5)};
  }
`;

const BigOrMediumButton = styled.button<ButtonCSSProps>`
  background: none;
  border: none;
  color: ${($) => $.$theme.colors.foreground};
  font-size: ${($) => ($.$big ? 2 : 1.6)}rem;
  font-family: ${fontFamily};
  font-weight: lighter;
  outline: none;
  display: flex;
  gap: 1rem;
  flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
  align-items: center;
  padding: ${RFConvert.points.rf(6)}rem 0.7rem;
  min-width: 10rem;
  opacity: 0.7;

  &:hover:not(:disabled),
  &:focus:not(:disabled),
  &:active:not(:disabled) {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.4;
  }

  ${($) => $.$button_inner_css}
  ${($) => $.$button_arrow_css}
`;

const SmallButton = styled.button<ButtonCSSProps>`
  background: none;
  border: none;
  color: ${($) => $.$small_normal_color!.toString()};
  font-family: ${fontFamily};
  font-size: 0.75rem;
  display: flex;
  gap: 0.2rem;
  flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
  align-items: center;
  padding: ${RFConvert.points.rf(3)}rem 0.7rem;
  outline: none;

  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    color: ${($) => $.$small_normal_color!.alpha(0.8).toString()};
  }

  &:active:not(:disabled) {
    color: ${($) => $.$small_normal_color!.alpha(1).toString()};
  }

  &:disabled {
    opacity: 0.4;
  }

  ${($) => $.$button_inner_css}
  ${($) => $.$button_arrow_css}
`;

const NormalButton = styled.button<ButtonCSSProps>`
  background: ${($) => $.$theme.colors.inputBackground};
  border: 0.15rem solid ${($) => $.$theme.colors.inputBorder};
  color: ${($) => $.$theme.colors.foreground};
  font-family: ${fontFamily};
  font-size: ${fontSize};
  display: flex;
  flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
  align-items: center;
  padding: ${RFConvert.points.rf(6) + 0.15}rem 0.7rem;
  min-width: 15rem;
  outline: none;

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

  ${($) => $.$button_inner_css}
  ${($) => $.$button_arrow_css}
`;

type ButtonCSSProps = {
  $theme: Theme;
  $big: boolean;
  $medium: boolean;
  $rtl: boolean;
  $button_inner_css: string;
  $button_arrow_css: string;
  $small_normal_color: Color | undefined;
  $hoverBackground: string;
};

/**
 * Represents a list of selectable values.
 */
export function Select(options: SelectOptions) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // Locale direction
  const rtl = useContext(RTLContext);

  // State
  const [visible, setVisible] = useState<boolean>(false);
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [opacity, setOpacity] = useState<number>(0);
  const [transition, setTransition] = useState<string>("");
  const [arrowsVisible, setArrowsVisible] = useState<boolean>(false);
  const [value, setValue] = useState<string>(options.default ?? "");
  const [valueHyperText, setValueHyperText] = useState<string>("");
  const [rf, set_rf] = useState<number>(0); // root font size

  // Refs
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  // Transition timeout
  let transitionTimeout = -1;

  // Button CSS
  const hoverBackground = Color(theme.colors.inputBackground)
    .darken(0.4)
    .toString();
  const Button =
    options.big || options.medium
      ? BigOrMediumButton
      : options.small
        ? SmallButton
        : NormalButton;

  // Button inner CSS
  const button_inner_css = `
        & .Select-button-inner {
            display: inline-flex;
            flex-direction: ${!rtl ? "row" : "row-reverse"};
            gap: 0.9rem;
        }
    `;

  // Button arrow CSS
  const button_arrow_css = `
        & .Select-button-arrow {
            display: inline-flex;
            flex-grow: 2;
            flex-direction: ${!rtl ? "row-reverse" : "row"};
            opacity: 0.7;
        }
    `;

  let small_normal_color: Color | undefined = options.small
    ? options.primary
      ? Color(
          enhanceBrightness(theme.colors.background, theme.colors.primary),
        ).alpha(0.67)
      : Color(theme.colors.foreground).alpha(0.67)
    : undefined;

  // Open the list
  async function open() {
    if (visible) {
      return;
    }

    // List div
    const itemListDiv = getItemListDiv();
    const children = Array.from(itemListDiv.children) as HTMLButtonElement[];

    // Find the selected entry
    let selectedOption: HTMLButtonElement | null =
      children.find((e) => e.getAttribute("data-value") == value) ?? null;

    if (selectedOption) {
      // Set the item[data-selected] attribute.
      for (const option of children) {
        option.removeAttribute("data-selected");
      }
      selectedOption.setAttribute("data-selected", "true");
    }

    // Base option
    let baseOption: HTMLButtonElement | null = selectedOption;
    if (!baseOption && itemListDiv.firstElementChild) {
      assert(
        itemListDiv.firstElementChild instanceof HTMLButtonElement,
        "Malformed Select item.",
      );
      baseOption = itemListDiv.firstElementChild as HTMLButtonElement;
    }

    // Update cooldown
    cooldown = Date.now();

    // Viewport event listeners
    currentMouseDownListener = viewport_onMouseDown;

    // Input listeners
    currentInputPressedListener = input_onInputPressed;

    // Change function
    currentSelectChange = triggerChange;

    // Close function
    currentSelectClose = close;

    // Turn visible
    setVisible(true);

    // Div
    const div = getDiv();

    // Turn arrows visible or hidden
    const k_scroll = itemListDiv.scrollTop;
    itemListDiv.scrollTop = 10;
    setArrowsVisible(itemListDiv.scrollTop != 0);
    itemListDiv.scrollTop = k_scroll;

    // Position after button.
    let prev_display = div.style.display;
    if (prev_display === "none") div.style.display = "inline-block";
    const r = await computePosition(buttonRef.current!, div, {
      placement: "bottom-start",
      middleware: [
        offset(3), flip(), shift(),
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

    // Stop transition
    setTransition("");

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

          // Focus base option
          baseOption?.focus();
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

          // Focus base option
          baseOption?.focus();
        }, timeoutDelay);
        break;
      }
    }
  }

  // Trigger value change
  function triggerChange(value: string): void {
    // Set value
    setValue(value);

    // Item list div
    const itemListDiv = getItemListDiv();
    const children = Array.from(itemListDiv.children) as HTMLButtonElement[];

    // Set the item[data-selected] attribute
    for (const option of children) {
      option.removeAttribute("data-selected");
    }
    let selectedOption: HTMLButtonElement | null =
      children.find((e) => e.getAttribute("data-value") == value) ?? null;
    if (selectedOption) {
      selectedOption.setAttribute("data-selected", "true");
      setValueHyperText(selectedOption.innerHTML);
    }

    // Dispatch event
    options.change?.(value);

    // Focus button
    buttonRef.current!.focus();
  }

  // Close the list
  function close(): void {
    if (!visible || options.disabled) {
      return;
    }

    // Cancel last transition
    if (transitionTimeout != -1) {
      window.clearTimeout(transitionTimeout);
      transitionTimeout = -1;
    }

    // Viewport event listeners
    currentMouseDownListener = null;

    // Input listeners
    currentInputPressedListener = null;

    // Change function
    currentSelectChange = null;

    // Close function
    currentSelectClose = null;

    // Turn invisible
    setVisible(false);
  }

  function getDiv(): HTMLDivElement {
    return divRef.current! as HTMLDivElement;
  }

  function getItemListDiv(): HTMLDivElement {
    return divRef.current!.children[1] as HTMLDivElement;
  }

  // Detect mouse down event out of the list, closing itself.
  function viewport_onMouseDown(): void {
    if (!visible) {
      return;
    }

    const div = getDiv();
    if (div.matches(":hover")) {
      return;
    }

    close();
  }

  // Handle arrows and escape
  function input_onInputPressed(e: Event): void {
    if (!visible) {
      return;
    }

    // Obtain list div
    const listDiv = getItemListDiv();

    // Escape
    if (input.justPressed("escape")) {
      close();
      buttonRef.current!.focus();
      return;
    }

    for (let i = 0; i < listDiv.children.length; i++) {
      // Child (item or submenu)
      const child = listDiv.children[i] as HTMLElement;

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

        return;
      }
    }

    // focus last
    if (input.justPressed("navigateUp")) {
      let first = listDiv.firstElementChild;
      if (first) {
        e.preventDefault();
        focusPrevSibling(first as HTMLElement);
      }
    }
    // focus first
    else if (input.justPressed("navigateDown")) {
      let last = listDiv.lastElementChild;
      if (last) {
        e.preventDefault();
        focusNextSibling(last as HTMLElement);
      }
    }
  }

  useEffect(() => {
    if (visible) {
      // Viewport event listeners
      currentMouseDownListener = viewport_onMouseDown;

      // Input listeners
      currentInputPressedListener = input_onInputPressed;

      // Change function
      currentSelectChange = triggerChange;

      // Close function
      currentSelectClose = close;
    }
  }, [visible]);

  // Initial change event
  useEffect(() => {
    triggerChange(value);
  }, [value]);

  // Observe CSS rem unit
  useEffect(() => {
    const rf_observer = new RFObserver((value) => {
      set_rf(value);
    });
    return () => {
      rf_observer.cleanup();
    };
  }, []);

  return (
    <>
      <Button
        id={options.id}
        ref={buttonRef}
        style={options.style}
        className={options.className}
        disabled={!!options.disabled}
        onClick={open}
        $theme={theme}
        $big={!!options.big}
        $medium={!!options.medium}
        $rtl={rtl}
        $button_inner_css={button_inner_css}
        $button_arrow_css={button_arrow_css}
        $small_normal_color={small_normal_color}
        $hoverBackground={hoverBackground}
      >
        <div
          className="Select-button-inner"
          dangerouslySetInnerHTML={{ __html: valueHyperText }}
        ></div>

        <div className="Select-button-arrow">
          <DownArrowIcon size={options.big ? 18 : options.small ? 7 : 10.5} />
        </div>
      </Button>
      <SelectOptionBigProvider big={!!options.big || !!options.medium}>
        <DropdownDiv
          ref={divRef}
          $visible={visible}
          $theme={theme}
          $big={!!options.big}
          $medium={!!options.medium}
          $opacity={opacity}
          $transition={transition}
          $arrowsVisible={arrowsVisible}
          $x={x}
          $y={y}
        >
          <div className="Select-up-arrow">
            <UpArrowIcon size={7.5} />
          </div>
          <div className="Select-list">{options.children}</div>
          <div className="Select-down-arrow">
            <DownArrowIcon size={7.5} />
          </div>
        </DropdownDiv>
      </SelectOptionBigProvider>
    </>
  );
}

export type SelectOptions = {
  id?: string;

  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;

  small?: boolean;

  /**
   * Effective for bordeless non-big selects.
   * When `true` the button color will be the primary one.
   */
  primary?: boolean;

  /**
   * Default value.
   */
  default?: string;

  /**
   * Whether input is disabled.
   */
  disabled?: boolean;

  /**
   * Whether the input button is a light big or not.
   */
  big?: boolean;

  /**
   * Whether the input button is a light medium or not.
   */
  medium?: boolean;

  /**
   * Event triggered on value change.
   */
  change?: (value: string) => void;
};

const SelectOptionButton = styled.button<{
  $rtl: boolean;
  $theme: Theme;
  $big: boolean;
  $hoverBackground: string;
  $activeBackground: string;
}>`
  display: inline-flex;
  flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
  flex-wrap: wrap;
  gap: 0.9rem;
  padding: 0.5rem 0.7rem;
  background: none;
  border: none;
  outline: none;
  color: ${($) => $.$theme.colors.foreground};
  font-family: ${fontFamily};
  font-size: ${($) => ($.$big ? "1.1rem" : fontSize)};
  ${($) => ($.$big ? "font-weight: lighter;" : "")}

  &:hover, &:focus {
    background: ${($) => $.$hoverBackground};
  }

  &:active,
  &[data-selected="true"] {
    background: ${($) => $.$activeBackground};
    color: ${($) =>
      enhanceBrightness($.$activeBackground, $.$theme.colors.primary)};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

export function SelectOption(options: SelectOptionOptions) {
  // Locale direction
  const rtl = useContext(RTLContext);

  // Use the theme context
  const theme = useContext(ThemeContext);

  // Big
  const big = useContext(SelectOptionBigContext);

  // Button ref
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Build the style class
  const hoverBackground = contrast(theme.colors.inputBackground, 0.1);
  const activeBackground = contrast(theme.colors.inputBackground, 0.15);

  function button_onClick(): void {
    if (cooldown > Date.now() - 50) {
      return;
    }
    currentSelectChange?.(options.value);
    currentSelectClose?.();
  }

  return (
    <SelectOptionButton
      className={
        BUTTON_NAVIGABLE + (options.className ? " " + options.className : "")
      }
      onClick={button_onClick}
      ref={buttonRef}
      data-value={options.value}
      $rtl={rtl}
      $theme={theme}
      $big={big}
      $hoverBackground={hoverBackground}
      $activeBackground={activeBackground}
    >
      {options.children}
    </SelectOptionButton>
  );
}

export type SelectOptionOptions = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;

  /**
   * Value.
   */
  value: string;
};

const SelectOptionBigContext = createContext<boolean>(false);

function SelectOptionBigProvider({
  big,
  children,
}: {
  big: boolean;
  children?: React.ReactNode;
}) {
  return (
    <SelectOptionBigContext.Provider value={big}>
      {children}
    </SelectOptionBigContext.Provider>
  );
}
