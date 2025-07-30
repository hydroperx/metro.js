// third-party
import React, {
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import { input } from "@hydroperx/inputaction";
import $ from "jquery";
import assert from "assert";

// local
import { RTLContext } from "../layout/RTL";
import { UpArrowIcon, DownArrowIcon } from "./Icon";
import { Theme, ThemeContext } from "../theme";
import * as ColorUtils from "../utils/ColorUtils";
import { MAXIMUM_Z_INDEX  } from "../utils/Constants";
import * as EMConvert from "../utils/EMConvert";
import { focusPrevSibling, focusNextSibling } from "../utils/FocusUtils";
import { EMObserver } from "../utils/EMObserver";
import * as StringUtils from "../utils/StringUtils";
import { ComboBoxStatic } from "./ComboBox/ComboBoxStatic";
import * as ComboBoxPlacement from "./ComboBox/ComboBoxPlacement";
import { ComboBoxEffect } from "./ComboBox/ComboBoxEffect";

// Invoked by the global Input action listener.
let currentInputPressedListener: Function | null = null;

// Globalized input action listener
input.on("inputPressed", function (e: Event): void {
  currentInputPressedListener?.(e);
});

// Invoked by the global pointer down event listeners
let currentPointerDownListener: Function | null = null;

// Globalized pointer down event listener
if (typeof window == "object") {
  window.addEventListener("pointerdown", function (e: PointerEvent): void {
    currentPointerDownListener?.(e);
  });
}

// Dropdown CSS
const DropdownDiv = styled.div<{
  $theme: Theme;
  $rtl: boolean;
  $big: boolean;
  $medium: boolean;
  $bigOrMedium: boolean;
  $optionHoverBackground: string;
  $optionActiveBackground: string;
  $arrows_visible: boolean;
}>`
  && {
    display: inline-flex;
    visibility: hidden;
    flex-direction: column;
    position: fixed;
    z-index: ${MAXIMUM_Z_INDEX};
  }

  &&:not(.running-effect) {
    background: ${($) => $.$theme.colors.inputBackground};
    border: ${$ => ($.$big || $.$medium ? "0.3em" : "0.15em") + " solid " + $.$theme.colors.inputBorder};
  }

  && .combobox-list {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    scrollbar-width: none;
    flex-grow: 3;
  }

  && .combobox-up-arrow,
  && .combobox-down-arrow {
    color: ${($) => $.$theme.colors.foreground};
    display: ${($) => ($.$arrows_visible ? "flex" : "none")};
    flex-direction: row;
    justify-content: center;
    height: ${EMConvert.points.emUnit(7.5)};
  }

  /* Option */

  && .combobox-list > .option {
    display: inline-flex;
    flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
    flex-wrap: wrap;
    gap: 0.9em;
    padding: ${EMConvert.points.em(6) + 0.15}em 0.7em;
    background: ${($) => $.$theme.colors.inputBackground};
    border: none;
    outline: none;
    color: ${($) => $.$theme.colors.foreground};
    font-size: ${($) => ($.$bigOrMedium ? "1.5em" : "inherit")};
    ${($) => ($.$bigOrMedium ? "font-weight: lighter;" : "")}
  }

  &&.running-effect .combobox-list > .option {
    border-left: ${$ => ($.$big || $.$medium ? "0.3em" : "0.15em") + " solid " + $.$theme.colors.inputBorder};
    border-right: ${$ => ($.$big || $.$medium ? "0.3em" : "0.15em") + " solid " + $.$theme.colors.inputBorder};
  }

  && .combobox-list > .option:focus {
    background: ${($) => $.$optionHoverBackground};
  }

  && .combobox-list > .option:active,
  && .combobox-list > .option[data-selected="true"] {
    background: ${($) => $.$optionActiveBackground};
    color: ${($) =>
      ColorUtils.enhance({ background: $.$optionActiveBackground, color: $.$theme.colors.primary })
    };
  }

  && .combobox-list > .option:disabled {
    opacity: 0.5;
  }
`;

// Big or medium styles
const BigOrMediumButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    border: none;
    color: ${($) => $.$theme.colors.foreground};
    font-size: ${($) => ($.$big ? 1.8 : 1.5)}em;
    font-weight: lighter;
    outline: none;
    display: flex;
    gap: 1em;
    flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
    align-items: center;
    padding: ${EMConvert.points.em(6)}em 0.7em;
    min-width: 10em;
    opacity: 0.7;
  }

  &&:hover:not(:disabled),
  &&:focus:not(:disabled),
  &&:active:not(:disabled) {
    opacity: 1;
  }

  &&:disabled {
    opacity: 0.4;
  }

  ${($) => $.$button_inner_css}
  ${($) => $.$button_arrow_css}
`;

// Small styles
const SmallButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    border: none;
    color: ${($) => $.$small_normal_color!.toString()};
    font-size: 0.75em;
    display: flex;
    gap: 0.2em;
    flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
    align-items: center;
    padding: ${EMConvert.points.em(3)}em 0.7em;
    outline: none;
  }

  &&:hover:not(:disabled),
  &&:focus:not(:disabled) {
    color: ${($) => $.$small_normal_color!.alpha(0.8).toString()};
  }

  &&:active:not(:disabled) {
    color: ${($) => $.$small_normal_color!.alpha(1).toString()};
  }

  &&:disabled {
    opacity: 0.4;
  }

  ${($) => $.$button_inner_css}
  ${($) => $.$button_arrow_css}
`;

// Normal styles
const NormalButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.inputBackground};
    border: 0.15em solid ${($) => $.$theme.colors.inputBorder};
    color: ${($) => $.$theme.colors.foreground};
    display: flex;
    flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
    align-items: center;
    padding: ${EMConvert.points.em(6) + 0.15}em 0.7em;
    min-width: 15em;
    outline: none;
  }

  &&:hover:not(:disabled),
  &&:focus:not(:disabled) {
    background: ${($) => $.$hover_background};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &&:disabled {
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
  $hover_background: string;
};

/**
 * Represents a list of selectable options.
 */
export function ComboBox(params: ComboBoxParams) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // ?RTL
  const rtl = useContext(RTLContext);
  const rtl_ref = useRef<boolean>(rtl);

  // State
  const [visible, set_visible] = useState<boolean>(false);
  const [arrows_visible, set_arrows_visible] = useState<boolean>(false);
  const [value, set_value] = useState<string>(params.default ?? "");
  const [changed, set_changed] = useState<boolean>(false);
  const [value_html, set_value_html] = useState<string>("");
  const [em, set_em] = useState<number>(0); // root font size

  // References
  const value_ref = useRef<string>(value);
  const initial_change = useRef<boolean>(true);
  const visible_reference = useRef<boolean>(visible);
  const disabled_reference = useRef<boolean>(params.disabled);
  const button_reference = useRef<HTMLButtonElement | null>(null);
  const div_reference = useRef<HTMLDivElement | null>(null);
  const effect_aborter = useRef<AbortController | null>(null); 
  const keydown_reference = useRef<Function | null>(null);
  const key_sequence_reference = useRef<string>("");
  const key_sequence_last_timestamp = useRef<number>(0);
  const change_handler_ref = useRef<null | ((value: string) => void)>(params.change);

  // Button CSS
  const hover_background = Color(theme.colors.inputBackground)
    .darken(0.4)
    .toString();
  const Button =
    params.big || params.medium ? BigOrMediumButton :
    params.small ? SmallButton : NormalButton;

  // Button inner CSS
  const button_inner_css = `
    && .combobox-button-inner {
      display: inline-flex;
      flex-direction: ${!rtl ? "row" : "row-reverse"};
      gap: 0.9em;
    }
  `;

  // Button arrow CSS
  const button_arrow_css = `
    && .combobox-button-arrow {
      display: inline-flex;
      flex-grow: 2;
      flex-direction: ${!rtl ? "row-reverse" : "row"};
      opacity: 0.7;
    }
  `;
  
  // Option specific colors.
  const optionHoverBackground = ColorUtils.contrast(theme.colors.inputBackground, 0.1);
  const optionActiveBackground = ColorUtils.contrast(theme.colors.inputBackground, 0.15);

  // Color for small/normal
  let small_normal_color: Color | undefined = params.small
    ? params.primary
      ? Color(
          ColorUtils.enhance({ background: theme.colors.background, color: theme.colors.primary }),
        ).alpha(0.67)
      : Color(theme.colors.foreground).alpha(0.67)
    : undefined;

  // Open the list
  function open() {
    if (visible_reference.current || disabled_reference.current) {
      return;
    }
    
    // For now, don't allow aborting active effect.
    if (effect_aborter.current) {
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

    // Update cooldown
    ComboBoxStatic.cooldown = Date.now();

    // Viewport event listeners
    currentPointerDownListener = viewport_onPointerDown;

    // Input listeners
    currentInputPressedListener = input_onInputPressed;

    // Change function
    ComboBoxStatic.change = triggerChange;

    // Close function
    ComboBoxStatic.close = close;

    // Turn visible
    set_visible(true);
    getDiv().style.visibility = "visible";

    // Key down handler
    if (keydown_reference.current) {
      window.removeEventListener("keydown", keydown_reference.current! as any);
    }
    // Make it so typing the initials of an option will auto focus
    // it.
    keydown_reference.current = (e: KeyboardEvent) => {
      if (e.key == " ") {
        e.preventDefault();
      }
      if (String.fromCodePoint(e.key.toLowerCase().codePointAt(0) ?? 0) != e.key.toLowerCase()) {
        key_sequence_last_timestamp.current = 0;
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
      const rtl = rtl_ref.current;
      if (rtl) {
        key_seq = StringUtils.reverse(key_seq);
      }
      for (const option of Array.from(getItemListDiv().children) as HTMLElement[]) {
        const option_text = option!.innerText.trim().toLowerCase();
        if (rtl ? option_text.endsWith(key_seq) : option_text.startsWith(key_seq)) {
          option.focus();
          break;
        }
      }
      key_sequence_last_timestamp.current = Date.now();
    };
    window.addEventListener("keydown", keydown_reference.current! as any);

    // Div
    const div = getDiv();

    // temporary display change
    let prev_display = div.style.display;
    if (prev_display === "none") div.style.display = "inline-block";

    // Set up dropdown width
    getDiv().style.width = button_reference.current!.getBoundingClientRect().width + "px";

    // Place dropdown (1)
    ComboBoxPlacement.position(button_reference.current!, div);

    // Turn arrows visible or hidden
    set_arrows_visible(itemListDiv.scrollHeight > itemListDiv.clientHeight);

    // Place dropdown (2) (after setting up arrows)
    ComboBoxPlacement.position(button_reference.current!, div);

    // restore display
    div.style.display = prev_display;

    // Scroll
    ComboBoxPlacement.scrollDropdownAlignSelected(button_reference.current!, getItemListDiv());

    // Run effect
    effect_aborter.current = new ComboBoxEffect(button_reference.current!, getItemListDiv())
      .open(() => {
        effect_aborter.current = null;

        if (selectedOption) {
          selectedOption.focus();
        }
      });
  }

  // Trigger value change
  function triggerChange(value: string): void {
    // Set value
    set_value(value);
    set_changed(true);

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
      set_value_html(selectedOption.innerHTML);
    } else {
      set_value_html("");
    }

    // Dispatch event
    change_handler_ref.current?.(value);

    // Focus button
    if (!initial_change.current) {
      button_reference.current!.focus();
    }
    initial_change.current = false;
  }

  // Close the list
  function close(): void {
    if (!visible_reference.current || disabled_reference.current) {
      return;
    }

    // For now, don't allow aborting active effect.
    if (effect_aborter.current) {
      return;
    }

    // Viewport event listeners
    currentPointerDownListener = null;

    // Input listeners
    currentInputPressedListener = null;

    // Change function
    ComboBoxStatic.change = null;

    // Close function
    ComboBoxStatic.close = null;

    // Detach key down handler
    if (keydown_reference.current) {
      window.removeEventListener("keydown", keydown_reference.current! as any);
      keydown_reference.current = null;
    }

    // Run effect
    effect_aborter.current = new ComboBoxEffect(button_reference.current!, getItemListDiv())
      .close(() => {
        // Turn invisible
        set_visible(false);

        effect_aborter.current = null;
      });
  }

  function getDiv(): HTMLDivElement {
    return div_reference.current! as HTMLDivElement;
  }

  function getItemListDiv(): HTMLDivElement {
    return div_reference.current!.children[1] as HTMLDivElement;
  }

  // Detect pointer down event out of the list, closing itself.
  function viewport_onPointerDown(e: PointerEvent): void {
    if (!visible_reference.current) {
      return;
    }

    const rect = getDiv().getBoundingClientRect();
    if (e.clientX >= rect.x && e.clientY >= rect.y && e.clientX < rect.x + rect.width && e.clientY < rect.y + rect.height) {
      return;
    }

    close();
  }

  // Handle arrows and escape
  function input_onInputPressed(e: Event): void {
    if (!visible_reference.current) {
      return;
    }

    // Obtain list div
    const listDiv = getItemListDiv();

    // Escape
    if (input.justPressed("escape")) {
      close();
      button_reference.current!.focus();
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

  // Reflect ?RTL
  useEffect(() => {
    rtl_ref.current = rtl;
  }, [rtl]);

  // Reflect change handler
  useEffect(() => {
    change_handler_ref.current = params.change ?? null;
  }, [params.change]);

  useEffect(() => {
    if (visible) {
      // Viewport event listeners
      currentPointerDownListener = viewport_onPointerDown;

      // Input listeners
      currentInputPressedListener = input_onInputPressed;

      // Change function
      ComboBoxStatic.change = triggerChange;

      // Close function
      ComboBoxStatic.close = close;
    }
  }, [visible]);

  // Initial change event
  useEffect(() => {
    value_ref.current = value;
    triggerChange(value);
  }, [value]);

  // Observe CSS rem unit
  useEffect(() => {
    const em_observer = new EMObserver(button_reference.current!, (value) => {
      set_em(value);
    });
    return () => {
      em_observer.cleanup();
    };
  }, []);

  // Update default option
  useEffect(() => {
    if (changed) {
      set_value(params.default ?? "");
    }
  }, [params.default]);

  // Reflect visible state
  useEffect(() => {
    visible_reference.current = visible;
  }, [visible]);

  // Reflect disabled state
  useEffect(() => {
    disabled_reference.current = params.disabled;
  }, [params.disabled]);

  // Reflect HTML and selected option based
  // on Option component updates.
  useEffect(() => {
    const button = button_reference.current!;
    button.addEventListener("comboboxreflect", reflect);
    let timeout = -1;

    function reflect() {
      if (timeout != -1) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        timeout = -1;

        // Item list div
        const itemListDiv = getItemListDiv();
        const children = Array.from(itemListDiv.children) as HTMLButtonElement[];

        // Set the item[data-selected] attribute
        for (const option of children) {
          option.removeAttribute("data-selected");
        }
        let selectedOption: HTMLButtonElement | null =
          children.find((e) => e.getAttribute("data-value") == value_ref.current) ?? null;
        if (selectedOption) {
          selectedOption.setAttribute("data-selected", "true");
          set_value_html(selectedOption.innerHTML);
        } else {
          set_value_html("");
        }
      }, 0);
    }

    // Cleanup
    return () => {
      button.removeEventListener("comboboxreflect", reflect);
    };
  }, []);

  return (
    <>
      <Button
        id={params.id}
        ref={val => {
          button_reference.current = val;
          if (typeof params.ref == "function") {
            params.ref(val);
          } else if (params.ref) {
            params.ref.current = val;
          }
        }}
        style={params.style}
        className={
          [
            "combobox",
            ...(params.className ? [params.className] : [])
          ].join(" ")
        }
        disabled={!!params.disabled}
        onClick={open}
        $theme={theme}
        $big={!!params.big}
        $medium={!!params.medium}
        $rtl={rtl}
        $button_inner_css={button_inner_css}
        $button_arrow_css={button_arrow_css}
        $small_normal_color={small_normal_color}
        $hover_background={hover_background}
      >
        <div
          className="combobox-button-inner"
          dangerouslySetInnerHTML={{ __html: value_html }}
        ></div>

        <div className="combobox-button-arrow">
          <DownArrowIcon size={params.big ? 18 : params.small ? 7 : 10.5} />
        </div>
      </Button>
      <DropdownDiv
        ref={div_reference}
        $theme={theme}
        $rtl={rtl}
        $big={!!params.big}
        $medium={!!params.medium}
        $bigOrMedium={!!params.big || !!params.medium}
        $arrows_visible={arrows_visible}
        $optionHoverBackground={optionHoverBackground}
        $optionActiveBackground={optionActiveBackground}
      >
        <div className="combobox-up-arrow">
          <UpArrowIcon size={7.5} />
        </div>
        <div className="combobox-list">{params.children}</div>
        <div className="combobox-down-arrow">
          <DownArrowIcon size={7.5} />
        </div>
      </DropdownDiv>
    </>
  );
}

/**
 * `ComboBox` parameters.
 */
export type ComboBoxParams = {
  id?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  ref?: React.Ref<null | HTMLButtonElement>,

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
   * Whether the input button is light big or not.
   */
  big?: boolean;

  /**
   * Whether the input button is light medium or not.
   */
  medium?: boolean;

  /**
   * Whether the input button is small or not.
   */
  small?: boolean;

  /**
   * Event triggered on value change.
   */
  change?: (value: string) => void;
};