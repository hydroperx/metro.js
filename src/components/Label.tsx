import extend from "extend";
import { styled } from "styled-components";
import { useEffect } from "react";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import { useContext, useState, useRef, Ref } from "react";
import { ThemeContext, PreferPrimaryContext, Theme } from "../theme/Theme";
import { fontFamily, maximumZIndex } from "../utils/CommonVariables";
import { enhanceBrightness } from "../utils/ColorUtils";
import * as RFConvert from "../utils/RFConvert";
import { Side } from "../utils/PlacementUtils";

export type LabelVariant =
  | "normal"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "legend";

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

// normal

const NormalLabel = styled.label<LabelCSSProps>`
  font-family: ${fontFamily};
  font-size: 0.9rem;
  ${($) => $.$sizing}
`;

const NormalSpan = styled.span<LabelCSSProps>`
  font-family: ${fontFamily};
  font-size: 0.9rem;
  ${($) => $.$sizing}
`;

// heading 1

const H1Label = styled.label<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-weight: lighter;
  font-size: 2rem;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

const H1 = styled.h1<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-weight: lighter;
  font-size: 2rem;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

// heading 2

const H2Label = styled.label<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-weight: lighter;
  font-size: 1.7rem;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

const H2 = styled.h2<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-weight: lighter;
  font-size: 1.7rem;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

// heading 3

const H3Label = styled.label<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

const H3 = styled.h3<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

// heading 4

const H4Label = styled.label<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

const H4 = styled.h4<LabelCSSProps>`
  ${($) =>
    $.$preferPrimaryColors
      ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};`
      : ""}
  font-family: ${fontFamily};
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0.67em 0;
  ${($) => $.$sizing}
`;

// legend

const LegendLabel = styled.label<LabelCSSProps>`
  font-family: ${fontFamily};
  font-size: 0.77rem;
  ${($) => $.$sizing}
`;

const LegendSpan = styled.span<LabelCSSProps>`
  font-family: ${fontFamily};
  font-size: 0.77rem;
  ${($) => $.$sizing}
`;

type LabelCSSProps = {
  $preferPrimaryColors: boolean;
  $sizing: string;
  $theme: Theme;
};

export function Label(options: LabelOptions) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // Determine which coloring is preferred
  const preferPrimaryColors = useContext(PreferPrimaryContext);

  // Variant
  const variant = options.variant ?? "normal";

  const newStyle: React.CSSProperties = {};
  if (!(options.visible ?? true)) newStyle.display = "none";
  if (options.style) {
    extend(newStyle, options.style);
  }

  const sizing = `
        ${options.minWidth === undefined ? "" : "min-width: " + RFConvert.points.cascadingRF(options.minWidth) + ";"}
        ${options.minHeight === undefined ? "" : "min-height: " + RFConvert.points.cascadingRF(options.minHeight) + ";"}
        ${options.maxWidth === undefined ? "" : "max-width: " + RFConvert.points.cascadingRF(options.maxWidth) + ";"}
        ${options.maxHeight === undefined ? "" : "max-height: " + RFConvert.points.cascadingRF(options.maxHeight) + ";"}
    `;

  const tooltip = options.tooltip;
  const tooltip_side_ref = useRef<Side>("bottom");
  const [tooltip_visible, set_tooltip_visible] = useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = useState<number>(0);
  const [tooltip_y, set_tooltip_y] = useState<number>(0);
  const tooltip_el: Ref<HTMLDivElement> = useRef(null);
  let tooltip_timeout = -1;

  // Display tooltip
  const mouseOver = async (e: MouseEvent) => {
    if (tooltip_el.current) {
      const element = e.target as HTMLElement;
      tooltip_timeout = window.setTimeout(() => {
        if (element.matches(":hover")) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      let prev_display = tooltip_el.current.style.display;
      if (prev_display === "none") tooltip_el.current.style.display = "inline-block";
      const r = await computePosition(e.target as HTMLElement, tooltip_el.current, {
        placement: (tooltip_side_ref.current + "-start") as any,
        middleware: [ offset(7), flip(), shift() ],
      });
      tooltip_el.current.style.display = prev_display;
      set_tooltip_x(r.x);
      set_tooltip_y(r.y);
    }
  };

  // Hide tooltip
  const mouseOut = (e: MouseEvent): any => {
    if (tooltip_timeout !== -1) {
      window.clearTimeout(tooltip_timeout);
      tooltip_timeout = -1;
    }
    set_tooltip_visible(false);
  };

  const tooltip_rendered =
    tooltip === undefined ? undefined : (
      <TooltipDiv
        ref={tooltip_el}
        $theme={theme}
        $tooltip_visible={tooltip_visible}
        $tooltip_x={tooltip_x}
        $tooltip_y={tooltip_y}
      >
        {tooltip.text}
      </TooltipDiv>
    );

  // sync tooltip side
  useEffect(() => {
    tooltip_side_ref.current = options.tooltip?.side ?? "bottom";
  }, [options.tooltip?.side ?? "bottom"]);

  switch (variant) {
    case "normal": {
      if (options.for) {
        return (
          <>
            <NormalLabel
              id={options.id}
              onMouseOver={mouseOver as any}
              onMouseOut={mouseOut as any}
              className={options.className}
              style={newStyle}
              htmlFor={options.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
            >
              {options.children}
            </NormalLabel>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <NormalSpan
            id={options.id}
            onMouseOver={mouseOver as any}
            onMouseOut={mouseOut as any}
            className={options.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
          >
            {options.children}
          </NormalSpan>
          {tooltip_rendered}
        </>
      );
    }
    case "heading1": {
      if (options.for) {
        return (
          <>
            <H1Label
              id={options.id}
              onMouseOver={mouseOver as any}
              onMouseOut={mouseOut as any}
              className={options.className}
              style={newStyle}
              htmlFor={options.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
            >
              {options.children}
            </H1Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H1
            id={options.id}
            onMouseOver={mouseOver as any}
            onMouseOut={mouseOut as any}
            className={options.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
          >
            {options.children}
          </H1>
          {tooltip_rendered}
        </>
      );
    }
    case "heading2": {
      if (options.for) {
        return (
          <>
            <H2Label
              id={options.id}
              onMouseOver={mouseOver as any}
              onMouseOut={mouseOut as any}
              className={options.className}
              style={newStyle}
              htmlFor={options.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
            >
              {options.children}
            </H2Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H2
            id={options.id}
            onMouseOver={mouseOver as any}
            onMouseOut={mouseOut as any}
            className={options.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
          >
            {options.children}
          </H2>
          {tooltip_rendered}
        </>
      );
    }
    case "heading3": {
      if (options.for) {
        return (
          <>
            <H3Label
              id={options.id}
              onMouseOver={mouseOver as any}
              onMouseOut={mouseOut as any}
              className={options.className}
              style={newStyle}
              htmlFor={options.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
            >
              {options.children}
            </H3Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H3
            id={options.id}
            onMouseOver={mouseOver as any}
            onMouseOut={mouseOut as any}
            className={options.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
          >
            {options.children}
          </H3>
          {tooltip_rendered}
        </>
      );
    }
    case "heading4": {
      if (options.for) {
        return (
          <>
            <H4Label
              id={options.id}
              onMouseOver={mouseOver as any}
              onMouseOut={mouseOut as any}
              className={options.className}
              style={newStyle}
              htmlFor={options.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
            >
              {options.children}
            </H4Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H4
            id={options.id}
            onMouseOver={mouseOver as any}
            onMouseOut={mouseOut as any}
            className={options.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
          >
            {options.children}
          </H4>
          {tooltip_rendered}
        </>
      );
    }
    case "legend": {
      if (options.for) {
        return (
          <>
            <LegendLabel
              id={options.id}
              onMouseOver={mouseOver as any}
              onMouseOut={mouseOut as any}
              className={options.className}
              style={newStyle}
              htmlFor={options.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
            >
              {options.children}
            </LegendLabel>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <LegendSpan
            id={options.id}
            onMouseOver={mouseOver as any}
            onMouseOut={mouseOut as any}
            className={options.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
          >
            {options.children}
          </LegendSpan>
          {tooltip_rendered}
        </>
      );
    }
  }
}

export type LabelOptions = {
  variant?: LabelVariant;

  tooltip?: { text: string, side?: Side };

  id?: string;

  /**
   * Indicates the form component this label connects to by its ID.
   */
  for?: string;

  visible?: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};
