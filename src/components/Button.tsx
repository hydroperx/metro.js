import extend from "extend";
import { styled } from "styled-components";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import React, { Ref, useContext, useRef, useState, useEffect } from "react";
import { Color } from "@hydroperx/color";
import * as EMConvert from "../utils/EMConvert";
import { MAXIMUM_Z_INDEX } from "../utils/Constants";
import * as ColorUtils from "../utils/ColorUtils";
import { DownArrowIcon, Icon } from "./Icon";
import { RTLContext } from "../layout/RTL";
import { PrimaryContext, Theme, ThemeContext } from "../theme/Theme";
import { SimplePlacementType } from "../utils/PlacementUtils";

const TooltipDiv = styled.div<{
  $theme: Theme;
  $tooltip_visible: boolean;
  $tooltip_x: number;
  $tooltip_y: number;
  $rtl: boolean;
}>`
  && {
    background: ${($) => $.$theme.colors.inputBackground};
    border: 0.15em solid ${($) => $.$theme.colors.inputBorder};
    color: ${$ => $.$theme.colors.foreground};
    display: inline-block;
    visibility: ${($) => ($.$tooltip_visible ? "visible" : "hidden")};
    overflow-wrap: anywhere;
    position: fixed;
    left: ${($) => $.$tooltip_x}px;
    top: ${($) => $.$tooltip_y}px;
    padding: 0.4em;
    font-size: 0.77em;
    z-index: ${MAXIMUM_Z_INDEX};
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

/**
 * Button component.
 */
export function Button(params: ButtonParams) {
  // Take the theme context
  const theme = useContext(ThemeContext);

  // Whether to prefer primary
  const prefer_primary = useContext(PrimaryContext);

  // Locale direction
  const rtl = useContext(RTLContext);

  const newStyle: React.CSSProperties = {};

  if (params.minWidth !== undefined)
    newStyle.minWidth = EMConvert.points.emUnit(params.minWidth);
  if (params.maxWidth !== undefined)
    newStyle.maxWidth = EMConvert.points.emUnit(params.maxWidth);
  if (params.minHeight !== undefined)
    newStyle.minHeight = EMConvert.points.emUnit(params.minHeight);
  if (params.maxHeight !== undefined)
    newStyle.maxHeight = EMConvert.points.emUnit(params.maxHeight);
  if (params.disabled) {
    newStyle.opacity = "0.67";
  }

  if (params.style) {
    extend(newStyle, params.style);
  }

  // Emotion CSS
  let Button_comp = null;

  let color: Color | string = "",
    bg = "",
    hover_bg = "",
    hover_color = "",
    pressed_color = "";

  switch (params.variant ?? "secondary") {
    case "none": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

      Button_comp = NoneButton;
      break;
    }
    case "big": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

      Button_comp = BigButton;
      break;
    }
    case "dropdown-small": {
      color =
        prefer_primary
          ? Color(
              ColorUtils.enhance({ background: theme.colors.background, color: theme.colors.primary }),
            ).alpha(0.67)
          : Color(theme.colors.foreground).alpha(0.67);

      Button_comp = SmallDropdownButton;
      break;
    }
    case "anchor": {
      color = theme.colors.anchor ?? "#000";
      hover_color = ColorUtils.lighten(color, 0.3).toString();

      Button_comp = AnchorButton;
      break;
    }
    case "secondary": {
      hover_bg = ColorUtils.lighten(theme.colors.secondary, 0.5);
      Button_comp = SecondaryButton;
      break;
    }
    case "primary": {
      hover_bg = ColorUtils.lighten(theme.colors.primary, 0.5);
      Button_comp = PrimaryButton;
      break;
    }
    case "danger": {
      hover_bg = ColorUtils.lighten(theme.colors.danger, 0.5);
      Button_comp = DangerButton;
      break;
    }
    case "outline": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      hover_bg = dark
        ? ColorUtils.lighten(theme.colors.background, 0.4).toString()
        : ColorUtils.darken(theme.colors.background, 0.3).toString();
      pressed_color = dark ? "#000" : "#fff";

      Button_comp = OutlineButton;
      break;
    }
    case "outline-primary": {
      const dark = Color(theme.colors.background).isDark();
      color = dark ? "#fff" : "#000";
      bg = dark
        ? ColorUtils.lighten(theme.colors.background, 0.5).toString()
        : ColorUtils.darken(theme.colors.background, 0.3).toString();
      hover_bg = dark
        ? ColorUtils.lighten(theme.colors.background, 0.7).toString()
        : ColorUtils.darken(theme.colors.background, 0.5).toString();
      pressed_color = dark ? "#000" : "#fff";

      Button_comp = OutlinePrimaryButton;
      break;
    }
  }

  const tooltip = params.tooltip;
  const tooltip_place_ref = useRef<SimplePlacementType>("bottom");
  const [tooltip_visible, set_tooltip_visible] = useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = useState<number>(0);
  const [tooltip_y, set_tooltip_y] = useState<number>(0);
  const tooltip_el: Ref<HTMLDivElement | null> = useRef(null);
  let tooltip_timeout = -1;
  const hovering = useRef<boolean>(false);

  // Display tooltip
  const userPointerEnter = useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerEnter = async (e: PointerEvent) => {
    hovering.current = true;
    if (tooltip_el.current) {
      const button = e.currentTarget as HTMLButtonElement;
      tooltip_timeout = window.setTimeout(() => {
        if (hovering.current) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      let prev_display = tooltip_el.current.style.display;
      if (prev_display === "none") tooltip_el.current.style.display = "inline-block";
      const r = await computePosition(button, tooltip_el.current, {
        placement: (tooltip_place_ref.current + "-start") as any,
        middleware: [ offset(7), flip(), shift() ],
      });
      tooltip_el.current.style.display = prev_display;
      set_tooltip_x(r.x);
      set_tooltip_y(r.y);
    }

    return userPointerEnter.current?.(e as any);
  };

  // Hide tooltip
  const userPointerLeave = useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerLeave = (e: PointerEvent): any => {
    hovering.current = false;
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
    return userPointerLeave.current?.(e as any);
  };

  // sync tooltip side
  useEffect(() => {
    tooltip_place_ref.current = params.tooltipPlacement ?? "bottom";
  }, [params.tooltipPlacement ?? "bottom"]);

  // Reflect pointer over handler
  useEffect(() => {
    userPointerEnter.current = params.pointerEnter;
  }, []);

  // Reflect pointer out handler
  useEffect(() => {
    userPointerLeave.current = params.pointerLeave;
  }, []);

  const Button = Button_comp!;

  return (
    <>
      <Button
        ref={params.ref}
        className={params.className}
        style={newStyle}
        type={params.type ?? "button"}
        disabled={params.disabled ?? false}
        autoFocus={params.autoFocus ?? false}
        data-chosen={!!params.chosen}
        $color={color}
        $bg={bg}
        $hover_bg={hover_bg}
        $hover_color={hover_color}
        $pressed_color={pressed_color}
        $theme={theme}
        $rtl={rtl}
        onFocus={params.focus}
        onClick={params.click}
        onMouseOver={params.mouseOver}
        onMouseOut={params.mouseOut}
        onMouseUp={params.mouseUp}
        onContextMenu={params.contextMenu}
        onGotPointerCapture={params.gotPointerCapture}
        onLostPointerCapture={params.lostPointerCapture}
        onPointerCancel={params.pointerCancel}
        onPointerDown={params.pointerDown}
        onPointerEnter={pointerEnter as any}
        onPointerLeave={pointerLeave as any}
        onPointerMove={params.pointerMove}
        onPointerOut={params.pointerOut}
        onPointerOver={params.pointerOver}
        onPointerUp={params.pointerUp}
        onTouchStart={params.touchStart}
        onTouchEnd={params.touchEnd}
        onTouchMove={params.touchMove}
        onTouchCancel={params.touchCancel}
      >
        {params.variant == "dropdown-small" ? (
          <>
            <div className="button-small-inner">{params.children}</div>
            <div className="button-small-arrow">
              <DownArrowIcon size={8} />
            </div>
          </>
        ) : (
          params.children
        )}
      </Button>
      {tooltip === undefined ? undefined : (
        <TooltipDiv
          ref={tooltip_el}
          $theme={theme}
          $tooltip_visible={tooltip_visible}
          $tooltip_x={tooltip_x}
          $tooltip_y={tooltip_y}
          $rtl={rtl}>
          {tooltip}
        </TooltipDiv>
      )}
    </>
  );
}

export type ButtonVariant =
  | "none"
  | "big"
  | "dropdown-small"
  | "anchor"
  | "primary"
  | "secondary"
  | "danger"
  | "outline"
  | "outline-primary";

export type ButtonType = "button" | "reset" | "submit";

export type ButtonParams = {
  variant?: ButtonVariant;

  chosen?: boolean;

  type?: ButtonType;

  disabled?: boolean;

  autoFocus?: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  tooltip?: string;
  tooltipPlacement?: SimplePlacementType,

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
  $bg: string;
  $hover_bg: string;
  $hover_color: string;
  $pressed_color: string;
  $theme: Theme;
  $rtl: boolean;
};

// none

const NoneButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.6em 1em;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    transform: scale(0.97);
  }

  &&[data-chosen="true"]:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$color as string};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// big

const BigButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.3em 0.6em;
    border: none;
    border-radius: 0;
    font-size: 1.8em;
    font-weight: lighter;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    transform: scale(0.97);
  }

  &&[data-chosen="true"]:not(:disabled) {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$color as string};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// small dropdown

const SmallDropdownButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    border: none;
    color: ${($) => $.$color.toString()};
    font-size: 0.79em;
    display: flex;
    gap: 0.2em;
    flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
    align-items: center;
    padding: ${EMConvert.points.em(3)}em 0.7em;
    outline: none;
  }

  &&:hover:not(:disabled),
  &&:focus:not(:disabled) {
    color: ${($) => ($.$color as Color).alpha(0.8).toString()};
  }

  &&:active:not(:disabled) {
    color: ${($) => ($.$color as Color).alpha(1).toString()};
  }

  &&:disabled {
    opacity: 0.4;
  }

  && .button-small-inner {
    display: inline-flex;
    flex-direction: ${($) => (!$.$rtl ? "row" : "row-reverse")};
    gap: 0.9em;
  }

  && .button-small-arrow {
    display: inline-flex;
    color: ${$ => $.$theme.colors.foreground};
    flex-grow: 2;
    flex-direction: ${($) => (!$.$rtl ? "row-reverse" : "row")};
    opacity: 0.7;
  }
`;

// anchor

const AnchorButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.6em 1em;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    color: ${($) => $.$hover_color};
  }

  &&:active:not(:disabled) {
    color: ${($) => $.$hover_color};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// secondary

const SecondaryButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.secondary};
    color: ${($) => $.$theme.colors.foreground};
    padding: 0.6em 1em;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// primary

const PrimaryButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.primary};
    color: ${($) => $.$theme.colors.primaryForeground};
    padding: 0.6em 1em;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// danger

const DangerButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$theme.colors.danger};
    color: ${($) => $.$theme.colors.dangerForeground};
    padding: 0.6em 1em;
    border: none;
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$theme.colors.pressed};
    color: ${($) => $.$theme.colors.pressedForeground};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// outline

const OutlineButton = styled.button<ButtonCSSProps>`
  && {
    background: none;
    color: ${($) => $.$color as string};
    padding: 0.6em 1em;
    border: 0.15em solid ${($) => $.$color as string};
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$color as string};
    color: ${($) => $.$pressed_color};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$color as string};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

// outline primary

const OutlinePrimaryButton = styled.button<ButtonCSSProps>`
  && {
    background: ${($) => $.$bg};
    color: ${($) => $.$color as string};
    padding: 0.6em 1em;
    border: 0.15em solid ${($) => $.$color as string};
    border-radius: 0;
  }

  &&:hover:not(:disabled) {
    background: ${($) => $.$hover_bg};
  }

  &&:active:not(:disabled) {
    background: ${($) => $.$color as string};
    color: ${($) => $.$pressed_color};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$color as string};
    outline-offset: -0.4em;
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

/**
 * Represents a circle bordered icon button.
 */
export function CircleIconButton(params: CircleIconButtonParams) {
  // Take the theme context
  const theme = useContext(ThemeContext);

  // ?RTL
  const rtl = useContext(RTLContext);

  // Stylize
  const iconStyle: React.CSSProperties = {};
  if (params.rotation !== undefined) {
    iconStyle.transform = `rotate(${params.rotation}deg)`;
  }

  // Misc
  const fg = Color(theme.colors.foreground).isDark() ? "#000" : "#fff";
  const normal_color = params.filled
    ? Color(fg).isDark()
      ? "#fff"
      : "#000"
    : fg;
  const hover_color = fg;
  const active_color = params.filled
    ? fg
    : Color(fg).isDark()
      ? "#fff"
      : "#000";
  const size = params.size ?? 27;
  const size_rf = EMConvert.points.emUnit(size);

  const tooltip = params.tooltip;
  const tooltip_place_ref = useRef<SimplePlacementType>("bottom");
  const [tooltip_visible, set_tooltip_visible] = useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = useState<number>(0);
  const [tooltip_y, set_tooltip_y] = useState<number>(0);
  const tooltip_el: Ref<HTMLDivElement | null> = useRef(null);
  let tooltip_timeout = -1;
  const hovering = useRef<boolean>(false);

  // Display tooltip
  const userPointerEnter = useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerEnter = async (e: PointerEvent) => {
    hovering.current = true;
    if (tooltip_el.current) {
      const button = e.currentTarget as HTMLButtonElement;
      tooltip_timeout = window.setTimeout(() => {
        if (hovering.current) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      let prev_display = tooltip_el.current.style.display;
      if (prev_display === "none") tooltip_el.current.style.display = "inline-block";
      const r = await computePosition(button, tooltip_el.current, {
        placement: (tooltip_place_ref.current + "-start") as any,
        middleware: [ offset(7), flip(), shift() ],
      });
      tooltip_el.current.style.display = prev_display;
      set_tooltip_x(r.x);
      set_tooltip_y(r.y);
    }

    return userPointerEnter.current?.(e as any);
  };

  // Hide tooltip
  const userPointerLeave = useRef<undefined | React.PointerEventHandler<HTMLButtonElement>>(undefined);
  const pointerLeave = (e: PointerEvent): any => {
    hovering.current = false;
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
    return userPointerLeave.current?.(e as any);
  };

  // sync tooltip side
  useEffect(() => {
    tooltip_place_ref.current = params.tooltipPlacement ?? "bottom";
  }, [params.tooltipPlacement ?? "bottom"]);

  // Reflect pointer over handler
  useEffect(() => {
    userPointerEnter.current = params.pointerEnter;
  }, []);

  // Reflect pointer out handler
  useEffect(() => {
    userPointerLeave.current = params.pointerLeave;
  }, []);

  return (
    <>
      <CircleIconButtonButton
        ref={params.ref}
        className={params.className}
        disabled={params.disabled}
        autoFocus={params.autoFocus}
        style={params.style}
        $normal_color={normal_color}
        $hover_color={hover_color}
        $active_color={active_color}
        $fg={fg}
        $theme={theme}
        $filled={!!params.filled}
        $size_rf={size_rf}
        onFocus={params.focus}
        onClick={params.click}
        onMouseOver={params.mouseOver}
        onMouseOut={params.mouseOut}
        onMouseUp={params.mouseUp}
        onContextMenu={params.contextMenu}
        onGotPointerCapture={params.gotPointerCapture}
        onLostPointerCapture={params.lostPointerCapture}
        onPointerCancel={params.pointerCancel}
        onPointerDown={params.pointerDown}
        onPointerEnter={pointerEnter as any}
        onPointerLeave={pointerLeave as any}
        onPointerMove={params.pointerMove}
        onPointerOut={params.pointerOut}
        onPointerOver={params.pointerOver}
        onPointerUp={params.pointerUp}
        onTouchStart={params.touchStart}
        onTouchEnd={params.touchEnd}
        onTouchMove={params.touchMove}
        onTouchCancel={params.touchCancel}
      >
        <Icon
          type={params.icon}
          size={size - (size <= 10.5 ? 0 : 10.5)}
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
          $rtl={rtl}>
          {tooltip}
        </TooltipDiv>
      )}
    </>
  );
}

export type CircleIconButtonParams = {
  icon: string;

  /**
   * Whether the icon is initially filled or not.
   */
  filled?: boolean;

  tooltip?: string;
  tooltipPlacement?: SimplePlacementType;

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
  && {
    border: 0.17em solid ${($) => $.$fg};
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
  }

  &&:hover:not(:disabled) {
    color: ${($) => $.$hover_color};
    background: ${($) => Color($.$fg).alpha(0.3).toString()};
  }

  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${($) => $.$theme.colors.focusDashes};
    outline-offset: -0.4em;
  }

  &&:active:not(:disabled) {
    outline: none;
    color: ${($) => $.$active_color};
    ${($) =>
      $.$filled
        ? `background: ${Color($.$fg).alpha(0.5).toString()};`
        : `background: ${$.$fg};`}
  }

  &&:disabled {
    opacity: 0.6;
  }
`;

/**
 * Represents an arrow button.
 */
export function ArrowButton(params: ArrowButtonParams) {
  // Direction
  const d = params.direction;

  return (
    <CircleIconButton
      icon="fullarrow"
      rotation={d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}
      ref={params.ref}
      className={params.className}
      disabled={params.disabled ?? false}
      autoFocus={params.autoFocus ?? false}
      style={params.style}
      size={params.size}
      tooltip={params.tooltip}
      focus={params.focus}
      click={params.click}
      mouseOver={params.mouseOver}
      mouseOut={params.mouseOut}
      mouseUp={params.mouseUp}
      contextMenu={params.contextMenu}
      gotPointerCapture={params.gotPointerCapture}
      lostPointerCapture={params.lostPointerCapture}
      pointerCancel={params.pointerCancel}
      pointerDown={params.pointerDown}
      pointerEnter={params.pointerEnter}
      pointerLeave={params.pointerLeave}
      pointerMove={params.pointerMove}
      pointerOut={params.pointerOut}
      pointerOver={params.pointerOver}
      pointerUp={params.pointerUp}
      touchStart={params.touchStart}
      touchEnd={params.touchEnd}
      touchMove={params.touchMove}
      touchCancel={params.touchCancel}
    />
  );
}

export type ArrowButtonParams = {
  direction: ArrowButtonDirection;
  size?: number;
  tooltip?: string;
  tooltipPlacement?: SimplePlacementType;
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