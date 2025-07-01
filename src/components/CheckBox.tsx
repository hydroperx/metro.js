import React, { useContext, useRef, useState, useEffect } from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import Draggable from "react-draggable";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, PreferPrimaryContext, Theme } from "../theme";
import { RFObserver } from "../utils/RFObserver";
import * as RFConvert from "../utils/RFConvert";
import { lighten, darken, enhanceBrightness, contrast } from "../utils/ColorUtils";

export function CheckBox(options: CheckBoxOptions) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // Determine which coloring is preferred
  const preferPrimaryColors = useContext(PreferPrimaryContext);

  // Locale direction
  const rtl = useContext(RTLContext);

  // Refs
  const button_ref = useRef<HTMLButtonElement | null>(null);
  const unchecked_div_ref = useRef<HTMLDivElement | null>(null);
  const checked_div_ref = useRef<HTMLDivElement | null>(null);
  const carret_ref = useRef<HTMLDivElement | null>(null);

  // States
  let [value, setValue] = useState<boolean>(!!options.default);
  let [checked_horizontal_pos, set_checked_horizontal_pos] = useState<number>(
    value ? 0 : 100,
  ); // percent
  let [carret_left, set_carret_left] = useState<number>(
    !rtl ? (value ? 100 : 0) : value ? 0 : 100,
  ); // percent
  const [rf, set_rf] = useState<number>(0);

  // Misc.
  const border_width = 0.15;
  const padding = 0.15;
  const side_length = border_width + padding;
  const w = RFConvert.points.rf(42);
  const h = RFConvert.points.rf(18.3);
  const carret_w = RFConvert.points.rf(12);
  let checked_color = enhanceBrightness(
    theme.colors.background,
    theme.colors.primary,
  );
  const checked_hover_color = lighten(checked_color, 0.3);
  const border_color = preferPrimaryColors
    ? checked_color
    : contrast(theme.colors.background, 0.4);
  let unchecked_color = preferPrimaryColors ? checked_color : border_color;
  const unchecked_hover_color = lighten(unchecked_color, 0.3);
  if (preferPrimaryColors || Color(theme.colors.background).isDark()) {
    checked_color = lighten(checked_color, 0.3);
    unchecked_color = darken(unchecked_color, 0.1);
  }

  // Carret misc.
  const carret_left_px = (carret_left / 100) * (w * rf);
  const leftmost_carret_pos = -(side_length / 2) * rf;
  const rightmost_carret_pos = w * rf - side_length * rf - carret_w * rf;

  // Handle click
  function button_onClick() {
    // Set new value
    value = !value;
    setValue(value);

    // Position carret
    set_carret_left(!rtl ? (value ? 100 : 0) : value ? 0 : 100);

    // Position checked rectangle
    set_checked_horizontal_pos(value ? 0 : 100);

    // Trigger event
    options.change?.(value);
  }

  useEffect(() => {
    // Update carret
    set_carret_left(!rtl ? (value ? 100 : 0) : value ? 0 : 100);

    // Position checked rectangle
    set_checked_horizontal_pos(value ? 0 : 100);
  }, [rtl]);

  useEffect(() => {
    const rf_observer = new RFObserver((value) => {
      set_rf(value);
    });
    return () => {
      rf_observer.cleanup();
    };
  }),
    [];

  return (
    <Button
      ref={button_ref}
      id={options.id}
      data-value={value.toString()}
      disabled={options.disabled}
      style={options.style}
      className={options.className}
      onClick={(_) => {
        button_onClick();
      }}
      $border_width={border_width}
      $border_color={border_color}
      $padding={padding}
      $w={w}
      $h={h}
      $theme={theme}
      $unchecked_color={unchecked_color}
      $unchecked_hover_color={unchecked_hover_color}
      $checked_color={checked_color}
      $checked_hover_color={checked_hover_color}
      $rtl={rtl}
      $carret_w={carret_w}
      $side_length={side_length}
      $checked_horizontal_pos={checked_horizontal_pos}
    >
      <div ref={unchecked_div_ref} className="CheckBox-unchecked-rect"></div>
      <div ref={checked_div_ref} className="CheckBox-checked-rect"></div>
      <Draggable
        nodeRef={carret_ref as React.RefObject<HTMLDivElement>}
        axis="x"
        bounds="parent"
        disabled
        offsetParent={button_ref.current!}
        defaultPosition={{ x: carret_left == 0 ? 0 : w * rf, y: 0 }}
        position={{
          x:
            carret_left_px <= side_length * rf
              ? leftmost_carret_pos
              : rightmost_carret_pos,
          y: 0,
        }}
      >
        <div ref={carret_ref} className="CheckBox-carret"></div>
      </Draggable>
    </Button>
  );
}

export type CheckBoxOptions = {
  id?: string;

  style?: React.CSSProperties;
  className?: string;

  /**
   * Default value.
   */
  default?: boolean;

  /**
   * Whether input is disabled.
   */
  disabled?: boolean;

  /**
   * Event triggered on value change.
   */
  change?: (value: boolean) => void;
};

// CSS
const Button = styled.button<{
  $border_width: number;
  $border_color: string;
  $padding: number;
  $w: number;
  $h: number;
  $theme: Theme;
  $unchecked_color: string;
  $unchecked_hover_color: string;
  $checked_color: string;
  $checked_hover_color: string;
  $rtl: boolean;
  $carret_w: number;
  $side_length: number;
  $checked_horizontal_pos: number;
}>`
  background: none;
  border: ${($) => $.$border_width}rem solid ${($) => $.$border_color};
  display: flex;
  flex-direction: row;
  padding: ${($) => $.$padding}rem;
  width: ${($) => $.$w}rem;
  height: ${($) => $.$h}rem;
  outline: none;
  position: relative;

  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: 0.3rem;
  }

  &:disabled {
    opacity: 0.5;
  }

  & .CheckBox-unchecked-rect {
    background: ${($) => $.$unchecked_color};
    width: 100%;
    height: 100%;
  }

  &:hover .CheckBox-unchecked-rect {
    background: ${($) => $.$unchecked_hover_color};
  }

  & .CheckBox-checked-rect {
    position: absolute;
    ${($) => (!$.$rtl ? "left" : "right")}: ${($) =>
      $.$padding}rem;
    ${($) => (!$.$rtl ? "right" : "left")}: calc(${($) =>
      $.$checked_horizontal_pos}% + ${($) => $.$padding}rem);
    top: ${($) => $.$padding}rem;
    bottom: ${($) => $.$padding}rem;
    transition:
      left 200ms ease-out,
      right 200ms ease-out;
    background: ${($) => $.$checked_color};
  }

  &:hover .CheckBox-checked-rect {
    background: ${($) => $.$checked_hover_color};
  }

  & .CheckBox-carret {
    position: absolute;
    transition: transform 200ms ease-out;
    width: ${($) => $.$carret_w}rem;
    height: ${($) => $.$h}rem;
    top: -${($) => $.$side_length / 2}rem;
    background: ${($) => $.$theme.colors.foreground};
  }
`;
