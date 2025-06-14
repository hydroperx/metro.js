import extend from "extend";
import { styled } from "styled-components";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import React, { Ref, useContext, useRef, useState, useEffect } from "react";
import { Color } from "@hydroperx/color";
import * as RFConvert from "../utils/RFConvert";
import { fontFamily, fontSize, maximumZIndex } from "../utils/vars";
import { lighten, darken, enhanceBrightness } from "../utils/ColorUtils";
import { DownArrowIcon, Icon } from "./Icons";
import { Theme, ThemeContext } from "../theme";
import { RTLContext } from "../layout";
import { Side } from "../utils/PlacementUtils";

const TooltipDiv = styled.div<{
  $theme: Theme;
  $tooltip_visible: boolean;
  $tooltip_x: number;
  $tooltip_y: number;
}>`
  background: ${($) => $.$theme.colors.inputBackground};
  border: 0.15rem solid ${($) => $.$theme.colors.inputBorder};
  display: inline-block;
  visibility: ${($) => ($.$tooltip_visible ? "visible" : "hidden")};
  position: fixed;
  left: ${($) => $.$tooltip_x}px;
  top: ${($) => $.$tooltip_y}px;
  padding: 0.4rem;
  font-size: 0.77rem;
  z-index: ${maximumZIndex};
`;

export function Button(options: ButtonOptions) {
  // Take the theme context
  const theme = useContext(ThemeContext);

  // Locale direction
  const localeDir = useContext(RTLContext);

  const newStyle: React.CSSProperties = {};

  if (options.minWidth !== undefined)
    newStyle.minWidth = RFConvert.points.cascadingRF(options.minWidth);
  if (options.maxWidth !== undefined)
    newStyle.maxWidth = RFConvert.points.cascadingRF(options.maxWidth);
  if (options.minHeight !== undefined)
    newStyle.minHeight = RFConvert.points.cascadingRF(options.minHeight);
  if (options.maxHeight !== undefined)
    newStyle.maxHeight = RFConvert.points.cascadingRF(options.maxHeight);
  if (options.disabled) {
    newStyle.opacity = "0.67";
  }

  if (options.style) {
    extend(newStyle, options.style);
  }

  // Emotion CSS
  let Button_comp = null;

  const padding = "0.6rem 1rem";
  let color: Color | string = "",
    bg = "",
    hover_bg = "",
    hover_color = "",
    pressed_color = "";

  switch (options.variant ?? "secondary") {
    case "none": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

      Button_comp = NoneButton;
      break;
    }
    case "small-dropdown":
    case "small-dropdown-primary": {
      color =
        options.variant == "small-dropdown-primary"
          ? Color(
              enhanceBrightness(theme.colors.background, theme.colors.primary),
            ).alpha(0.67)
          : Color(theme.colors.foreground).alpha(0.67);

      Button_comp = SmallDropdownButton;
      break;
    }
    case "anchor": {
      color = theme.colors.anchor ?? "#000";
      hover_color = lighten(color, 0.3).toString();

      Button_comp = AnchorButton;
      break;
    }
    case "secondary": {
      hover_bg = lighten(theme.colors.secondary, 0.5);
      Button_comp = SecondaryButton;
      break;
    }
    case "primary": {
      hover_bg = lighten(theme.colors.primary, 0.5);
      Button_comp = PrimaryButton;
      break;
    }
    case "danger": {
      hover_bg = lighten(theme.colors.danger, 0.5);
      Button_comp = DangerButton;
      break;
    }
    case "outline": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark
        ? lighten(theme.colors.background, 0.4).toString()
        : darken(theme.colors.background, 0.3).toString();
      pressed_color = dark ? "#000" : "#fff";

      Button_comp = OutlineButton;
      break;
    }
    case "outline-primary": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      bg = dark
        ? lighten(theme.colors.background, 0.5).toString()
        : darken(theme.colors.background, 0.3).toString();
      hover_bg = dark
        ? lighten(theme.colors.background, 0.7).toString()
        : darken(theme.colors.background, 0.5).toString();
      pressed_color = dark ? "#000" : "#fff";

      Button_comp = OutlinePrimaryButton;
      break;
    }
  }

  const tooltip = options.tooltip;
  const tooltip_side_ref = useRef<Side>("bottom");
  const [tooltip_visible, set_tooltip_visible] = useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = useState<number>(0);
  const [tooltip_y, set_tooltip_y] = useState<number>(0);
  const tooltip_el: Ref<HTMLDivElement | null> = useRef(null);
  let tooltip_timeout = -1;

  // Display tooltip
  const userMouseOver = options.mouseOver;
  const mouseOver = async (e: MouseEvent) => {
    if (tooltip_el.current) {
      const button = e.currentTarget as HTMLButtonElement;
      tooltip_timeout = window.setTimeout(() => {
        if (button.matches(":hover")) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      let prev_display = tooltip_el.current.style.display;
      if (prev_display === "none") tooltip_el.current.style.display = "inline-block";
      const r = await computePosition(button, tooltip_el.current, {
        placement: (tooltip_side_ref.current + "-start") as any,
        middleware: [ offset(7), flip(), shift() ],
      });
      tooltip_el.current.style.display = prev_display;
      set_tooltip_x(r.x);
      set_tooltip_y(r.y);
    }

    return userMouseOver?.(e as any);
  };

  // Hide tooltip
  const userMouseOut = options.mouseOut;
  const mouseOut = (e: MouseEvent): any => {
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
    return userMouseOut?.(e as any);
  };

  // sync tooltip side
  useEffect(() => {
    tooltip_side_ref.current = options.tooltip?.side ?? "bottom";
  }, [options.tooltip?.side ?? "bottom"]);

  const Button = Button_comp!;

  return (
    <>
      <Button
        ref={options.ref}
        className={options.className}
        style={newStyle}
        type={options.type ?? "button"}
        disabled={options.disabled ?? false}
        autoFocus={options.autoFocus ?? false}
        data-chosen={!!options.chosen}
        $color={color}
        $padding={padding}
        $bg={bg}
        $hover_bg={hover_bg}
        $hover_color={hover_color}
        $pressed_color={pressed_color}
        $theme={theme}
        $localeDir={localeDir}
        onFocus={options.focus}
        onClick={options.click}
        onMouseOver={mouseOver as any}
        onMouseOut={mouseOut as any}
        onMouseUp={options.mouseUp}
        onContextMenu={options.contextMenu}
        onGotPointerCapture={options.gotPointerCapture}
        onLostPointerCapture={options.lostPointerCapture}
        onPointerCancel={options.pointerCancel}
        onPointerDown={options.pointerDown}
        onPointerEnter={options.pointerEnter}
        onPointerLeave={options.pointerLeave}
        onPointerMove={options.pointerMove}
        onPointerOut={options.pointerOut}
        onPointerOver={options.pointerOver}
        onPointerUp={options.pointerUp}
        onTouchStart={options.touchStart}
        onTouchEnd={options.touchEnd}
        onTouchMove={options.touchMove}
        onTouchCancel={options.touchCancel}
      >
        {options.variant == "small-dropdown" ||
        options.variant == "small-dropdown-primary" ? (
          <>
            <div className="Button-small-inner">{options.children}</div>
            <div className="Button-small-arrow">
              <DownArrowIcon size={2.4} />
            </div>
          </>
        ) : (
          options.children
        )}
      </Button>
      {tooltip === undefined ? undefined : (
        <TooltipDiv
          ref={tooltip_el}
          $theme={theme}
          $tooltip_visible={tooltip_visible}
          $tooltip_x={tooltip_x}
          $tooltip_y={tooltip_y}
        >
          {tooltip.text}
        </TooltipDiv>
      )}
    </>
  );
}

export type ButtonVariant =
  | "none"
  | "small-dropdown"
  | "small-dropdown-primary"
  | "anchor"
  | "primary"
  | "secondary"
  | "danger"
  | "outline"
  | "outline-primary";

export type ButtonType = "button" | "reset" | "submit";

export type ButtonOptions = {
  variant?: ButtonVariant;

  chosen?: boolean;

  type?: ButtonType;

  disabled?: boolean;

  autoFocus?: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  tooltip?: { text: string, side?: Side };

  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement | null>;

  focus?: React.FocusEventHandler<HTMLButtonElement>;
  click?: React.MouseEventHandler<HTMLButtonElement>;
  contextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOver?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOut?: React.MouseEventHandler<HTMLButtonElement>;
  mouseUp?: React.MouseEventHandler<HTMLButtonElement>;

  gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  pointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  pointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  pointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  pointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  pointerMove?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOut?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOver?: React.PointerEventHandler<HTMLButtonElement>;
  pointerUp?: React.PointerEventHandler<HTMLButtonElement>;

  touchStart?: React.TouchEventHandler<HTMLButtonElement>;
  touchEnd?: React.TouchEventHandler<HTMLButtonElement>;
  touchMove?: React.TouchEventHandler<HTMLButtonElement>;
  touchCancel?: React.TouchEventHandler<HTMLButtonElement>;
};

type ButtonCSSProps = {
  $color: Color | string;
  $padding: string;
  $bg: string;
  $hover_bg: string;
  $hover_color: string;
  $pressed_color: string;
  $theme: Theme;
  $localeDir: "ltr" | "rtl";
};

// none

const NoneButton = styled.button<ButtonCSSProps>`
  background: none;
  color: ${($) => $.$color as string};
  padding: ${($) => $.$padding};
  border: none;
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &[data-chosen="true"]:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

// small dropdown

const SmallDropdownButton = styled.button<ButtonCSSProps>`
  background: none;
  border: none;
  color: ${($) => $.$color.toString()};
  font-family: ${fontFamily};
  font-size: 0.75rem;
  display: flex;
  gap: 0.2rem;
  flex-direction: ${($) => ($.$localeDir == "ltr" ? "row" : "row-reverse")};
  align-items: center;
  padding: ${RFConvert.points.rf(1)}rem 0.7rem;
  outline: none;

  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    color: ${($) => ($.$color as Color).alpha(0.8).toString()};
  }

  &:active:not(:disabled) {
    color: ${($) => ($.$color as Color).alpha(1).toString()};
  }

  &:disabled {
    opacity: 0.4;
  }

  & .Button-small-inner {
    display: inline-flex;
    flex-direction: ${($) => ($.$localeDir == "ltr" ? "row" : "row-reverse")};
    gap: 0.9rem;
  }

  & .Button-small-arrow {
    display: inline-flex;
    flex-grow: 2;
    flex-direction: ${($) => ($.$localeDir == "ltr" ? "row-reverse" : "row")};
    opacity: 0.7;
  }
`;

// anchor

const AnchorButton = styled.button<ButtonCSSProps>`
  background: none;
  color: ${($) => $.$color as string};
  padding: ${($) => $.$padding};
  border: none;
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    color: ${($) => $.$hover_color};
  }

  &:active:not(:disabled) {
    color: ${($) => $.$hover_color};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

// secondary

const SecondaryButton = styled.button<ButtonCSSProps>`
  background: ${($) => $.$theme.colors.secondary};
  color: ${($) => $.$theme.colors.foreground};
  padding: ${($) => $.$padding};
  border: none;
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

// primary

const PrimaryButton = styled.button<ButtonCSSProps>`
  background: ${($) => $.$theme.colors.primary};
  color: ${($) => $.$theme.colors.primaryForeground};
  padding: ${($) => $.$padding};
  border: none;
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

// danger

const DangerButton = styled.button<ButtonCSSProps>`
  background: ${($) => $.$theme.colors.danger};
  color: ${($) => $.$theme.colors.dangerForeground};
  padding: ${($) => $.$padding};
  border: none;
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

// outline

const OutlineButton = styled.button<ButtonCSSProps>`
  background: none;
  color: ${($) => $.$color as string};
  padding: ${($) => $.$padding};
  border: 0.15rem solid ${($) => $.$color as string};
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &:active:not(:disabled) {
    background: ${($) => $.$color as string};
    color: ${($) => $.$pressed_color};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

// outline primary

const OutlinePrimaryButton = styled.button<ButtonCSSProps>`
  background: ${($) => $.$bg};
  color: ${($) => $.$color as string};
  padding: ${($) => $.$padding};
  border: 0.15rem solid ${($) => $.$color as string};
  border-radius: 0;
  font-size: ${fontSize};
  font-family: ${fontFamily};

  &:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &:active:not(:disabled) {
    background: ${($) => $.$color as string};
    color: ${($) => $.$pressed_color};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$color as string};
    outline-offset: -0.4rem;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

/**
 * Represents a circle bordered icon button.
 */
export function CircleIconButton(options: CircleIconButtonOptions) {
  // Take the theme context
  const theme = useContext(ThemeContext);

  // Stylize
  const iconStyle: React.CSSProperties = {};
  if (options.rotation !== undefined) {
    iconStyle.transform = `rotate(${options.rotation}deg)`;
  }

  // Misc
  const fg = Color(theme.colors.foreground).isDark() ? "#000" : "#fff";
  const normal_color = options.filled
    ? Color(fg).isDark()
      ? "#fff"
      : "#000"
    : fg;
  const hover_color = fg;
  const active_color = options.filled
    ? fg
    : Color(fg).isDark()
      ? "#fff"
      : "#000";
  const size = options.size ?? 9;
  const size_rf = RFConvert.points.cascadingRF(size);

  const tooltip = options.tooltip;
  const tooltip_side_ref = useRef<Side>("bottom");
  const [tooltip_visible, set_tooltip_visible] = useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = useState<number>(0);
  const [tooltip_y, set_tooltip_y] = useState<number>(0);
  const tooltip_el: Ref<HTMLDivElement | null> = useRef(null);
  let tooltip_timeout = -1;

  // Display tooltip
  const userMouseOver = options.mouseOver;
  const mouseOver = async (e: MouseEvent) => {
    if (tooltip_el.current) {
      const button = e.currentTarget as HTMLButtonElement;
      tooltip_timeout = window.setTimeout(() => {
        if (button.matches(":hover")) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      let prev_display = tooltip_el.current.style.display;
      if (prev_display === "none") tooltip_el.current.style.display = "inline-block";
      const r = await computePosition(button, tooltip_el.current, {
        placement: (tooltip_side_ref.current + "-start") as any,
        middleware: [ offset(7), flip(), shift() ],
      });
      tooltip_el.current.style.display = prev_display;
      set_tooltip_x(r.x);
      set_tooltip_y(r.y);
    }

    return userMouseOver?.(e as any);
  };

  // Hide tooltip
  const userMouseOut = options.mouseOut;
  const mouseOut = (e: MouseEvent): any => {
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
    return userMouseOut?.(e as any);
  };

  // sync tooltip side
  useEffect(() => {
    tooltip_side_ref.current = options.tooltip?.side ?? "bottom";
  }, [options.tooltip?.side ?? "bottom"]);

  return (
    <>
      <CircleIconButtonButton
        ref={options.ref}
        className={options.className}
        disabled={options.disabled}
        autoFocus={options.autoFocus}
        style={options.style}
        $normal_color={normal_color}
        $hover_color={hover_color}
        $active_color={active_color}
        $fg={fg}
        $theme={theme}
        $filled={!!options.filled}
        $size_rf={size_rf}
        onFocus={options.focus}
        onClick={options.click}
        onMouseOver={mouseOver as any}
        onMouseOut={mouseOut as any}
        onMouseUp={options.mouseUp}
        onContextMenu={options.contextMenu}
        onGotPointerCapture={options.gotPointerCapture}
        onLostPointerCapture={options.lostPointerCapture}
        onPointerCancel={options.pointerCancel}
        onPointerDown={options.pointerDown}
        onPointerEnter={options.pointerEnter}
        onPointerLeave={options.pointerLeave}
        onPointerMove={options.pointerMove}
        onPointerOut={options.pointerOut}
        onPointerOver={options.pointerOver}
        onPointerUp={options.pointerUp}
        onTouchStart={options.touchStart}
        onTouchEnd={options.touchEnd}
        onTouchMove={options.touchMove}
        onTouchCancel={options.touchCancel}
      >
        <Icon
          type={options.icon}
          size={size - (size <= 3.5 ? 0 : 3.5)}
          style={iconStyle}
        />
      </CircleIconButtonButton>

      {tooltip === undefined ? undefined : (
        <TooltipDiv
          ref={tooltip_el}
          $theme={theme}
          $tooltip_visible={tooltip_visible}
          $tooltip_x={tooltip_x}
          $tooltip_y={tooltip_y}
        >
          {tooltip.text}
        </TooltipDiv>
      )}
    </>
  );
}

export type CircleIconButtonOptions = {
  icon: string;

  /**
   * Whether the icon is initially filled or not.
   */
  filled?: boolean;

  tooltip?: { text: string, side?: Side };

  /**
   * Rotation degrees.
   */
  rotation?: number;
  size?: number;
  disabled?: boolean;
  autoFocus?: boolean;

  style?: React.CSSProperties;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  contextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  focus?: React.FocusEventHandler<HTMLButtonElement>;
  click?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOver?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOut?: React.MouseEventHandler<HTMLButtonElement>;
  mouseUp?: React.MouseEventHandler<HTMLButtonElement>;

  gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  pointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  pointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  pointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  pointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  pointerMove?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOut?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOver?: React.PointerEventHandler<HTMLButtonElement>;
  pointerUp?: React.PointerEventHandler<HTMLButtonElement>;

  touchStart?: React.TouchEventHandler<HTMLButtonElement>;
  touchEnd?: React.TouchEventHandler<HTMLButtonElement>;
  touchMove?: React.TouchEventHandler<HTMLButtonElement>;
  touchCancel?: React.TouchEventHandler<HTMLButtonElement>;
};

const CircleIconButtonButton = styled.button<{
  $normal_color: string;
  $hover_color: string;
  $active_color: string;
  $fg: string;
  $theme: Theme;
  $filled: boolean;
  $size_rf: string;
}>`
  border: 0.17rem solid ${($) => $.$fg};
  border-radius: 100%;
  outline: none;
  color: ${($) => $.$normal_color};
  ${($) => ($.$filled ? `background: ${$.$fg};` : "background: none;")}
  width: ${($) => $.$size_rf};
  height: ${($) => $.$size_rf};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  &:hover:not(:disabled) {
    color: ${($) => $.$hover_color};
    background: ${($) => Color($.$fg).alpha(0.3).toString()};
  }

  &:focus:not(:disabled) {
    outline: 0.05rem dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4rem;
  }

  &:active:not(:disabled) {
    outline: none;
    color: ${($) => $.$active_color};
    ${($) =>
      $.$filled
        ? `background: ${Color($.$fg).alpha(0.5).toString()};`
        : `background: ${$.$fg};`}
  }

  &:disabled {
    opacity: 0.6;
  }
`;

/**
 * Represents an arrow button.
 */
export function ArrowButton(options: ArrowButtonOptions) {
  // Direction
  const d = options.direction;

  return (
    <CircleIconButton
      icon="fullarrow"
      rotation={d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}
      ref={options.ref}
      className={options.className}
      disabled={options.disabled ?? false}
      autoFocus={options.autoFocus ?? false}
      style={options.style}
      size={options.size}
      tooltip={options.tooltip}
      focus={options.focus}
      click={options.click}
      mouseOver={options.mouseOver}
      mouseOut={options.mouseOut}
      mouseUp={options.mouseUp}
      contextMenu={options.contextMenu}
      gotPointerCapture={options.gotPointerCapture}
      lostPointerCapture={options.lostPointerCapture}
      pointerCancel={options.pointerCancel}
      pointerDown={options.pointerDown}
      pointerEnter={options.pointerEnter}
      pointerLeave={options.pointerLeave}
      pointerMove={options.pointerMove}
      pointerOut={options.pointerOut}
      pointerOver={options.pointerOver}
      pointerUp={options.pointerUp}
      touchStart={options.touchStart}
      touchEnd={options.touchEnd}
      touchMove={options.touchMove}
      touchCancel={options.touchCancel}
    />
  );
}

export type ArrowButtonOptions = {
  direction: ArrowButtonDirection;
  size?: number;
  tooltip?: { text: string, side?: Side };
  disabled?: boolean;
  autoFocus?: boolean;

  style?: React.CSSProperties;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  contextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  focus?: React.FocusEventHandler<HTMLButtonElement>;
  click?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOver?: React.MouseEventHandler<HTMLButtonElement>;
  mouseOut?: React.MouseEventHandler<HTMLButtonElement>;
  mouseUp?: React.MouseEventHandler<HTMLButtonElement>;

  gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>;
  pointerCancel?: React.PointerEventHandler<HTMLButtonElement>;
  pointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  pointerEnter?: React.PointerEventHandler<HTMLButtonElement>;
  pointerLeave?: React.PointerEventHandler<HTMLButtonElement>;
  pointerMove?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOut?: React.PointerEventHandler<HTMLButtonElement>;
  pointerOver?: React.PointerEventHandler<HTMLButtonElement>;
  pointerUp?: React.PointerEventHandler<HTMLButtonElement>;

  touchStart?: React.TouchEventHandler<HTMLButtonElement>;
  touchEnd?: React.TouchEventHandler<HTMLButtonElement>;
  touchMove?: React.TouchEventHandler<HTMLButtonElement>;
  touchCancel?: React.TouchEventHandler<HTMLButtonElement>;
};

export type ArrowButtonDirection = "left" | "right" | "up" | "down";
