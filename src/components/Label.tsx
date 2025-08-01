// third-party
import extend from "extend";
import { styled } from "styled-components";
import { useEffect } from "react";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import { useContext, useState, useRef, Ref } from "react";

// local
import { RTLContext } from "../layout/RTL";
import { ThemeContext, Theme, PrimaryContext } from "../theme/Theme";
import { MAXIMUM_Z_INDEX } from "../utils/Constants";
import * as ColorUtils from "../utils/ColorUtils";
import * as EMConvert from "../utils/EMConvert";
import { SimplePlacementType } from "../utils/PlacementUtils";

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
  $rtl: boolean;
}>`
  && {
    background: ${$ => $.$theme.colors.inputBackground};
    border: 0.15em solid ${$ => $.$theme.colors.inputBorder};
    color: ${$ => $.$theme.colors.foreground};
    display: inline-block;
    visibility: ${$ => ($.$tooltip_visible ? "visible" : "hidden")};
    position: fixed;
    left: ${$ => $.$tooltip_x}px;
    top: ${$ => $.$tooltip_y}px;
    padding: 0.4em;
    font-size: 0.77em;
    z-index: ${MAXIMUM_Z_INDEX};
    overflow-wrap: anywhere;
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

// normal

const NormalLabel = styled.label<LabelCSSProps>`
  && {
    font-size: 0.9em;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
    ${$ => $.$bold ? "font-weight: bold;" : ""}
  }
`;

const NormalSpan = styled.span<LabelCSSProps>`
  && {
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
    ${$ => $.$bold ? "font-weight: bold;" : ""}
  }
`;

// heading 1

const H1Label = styled.label<LabelCSSProps>`
  && {
    ${$ => $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-weight: ${$ => $.$bold ? "bold" : "lighter"};
    font-size: 2em;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

const H1 = styled.h1<LabelCSSProps>`
  && {
    ${$ => $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-weight: ${$ => $.$bold ? "bold" : "lighter"};
    font-size: 2em;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

// heading 2

const H2Label = styled.label<LabelCSSProps>`
  && {
    ${$ =>
      $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-weight: ${$ => $.$bold ? "bold" : "lighter"};
    font-size: 1.7em;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

const H2 = styled.h2<LabelCSSProps>`
  && {
    ${$ =>
      $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-weight: ${$ => $.$bold ? "bold" : "lighter"};
    font-size: 1.7em;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

// heading 3

const H3Label = styled.label<LabelCSSProps>`
  && {
    ${$ => $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-size: 1.3em;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

const H3 = styled.h3<LabelCSSProps>`
  && {
    ${$ =>
      $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-size: 1.3em;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

// heading 4

const H4Label = styled.label<LabelCSSProps>`
  && {
    ${$ =>
      $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-size: 1.1em;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

const H4 = styled.h4<LabelCSSProps>`
  && {
    ${$ =>
      $.$preferPrimaryColors
        ? `color: ${ColorUtils.enhance({ background: $.$theme.colors.background, color: $.$theme.colors.primary })};`
        : ""}
    font-size: 1.1em;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
  }
`;

// legend

const LegendLabel = styled.label<LabelCSSProps>`
  && {
    font-size: 0.77em;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
    ${$ => $.$bold ? "font-weight: bold;" : ""}
  }
`;

const LegendSpan = styled.span<LabelCSSProps>`
  && {
    font-size: 0.77em;
    ${$ => $.$sizing}
    ${$ => $.$wrap ? "overflow-wrap: anywhere;" : ""}
    ${$ => $.$rtl ? "text-align: right;" : ""}
    ${$ => $.$bold ? "font-weight: bold;" : ""}
  }
`;

type LabelCSSProps = {
  $preferPrimaryColors: boolean;
  $sizing: string;
  $theme: Theme;
  $wrap?: boolean;
  $rtl: boolean;
  $bold?: boolean;
};

/**
 * A label component consisting of text.
 */
export function Label(params: {
  variant?: LabelVariant;
  
  /**
   * Whether to use a bold font weight.
   */
  bold?: boolean;

  tooltip?: string;
  tooltipPlacement?: SimplePlacementType;

  /**
   * Indicates the form component this label connects to by its ID.
   */
  for?: string;

  /**
   * Whether to include word wrapping.
   */
  wrap?: boolean;

  /**
   * If `false`, excludes label from layout.
   */
  visible?: boolean;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  id?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  // Use the theme context
  const theme = useContext(ThemeContext);
  // ?RTL
  const rtl = useContext(RTLContext);
  // Determine which coloring is preferred
  const preferPrimaryColors = useContext(PrimaryContext);

  // Variant
  const variant = params.variant ?? "normal";

  const newStyle: React.CSSProperties = {};
  if (!(params.visible ?? true)) newStyle.display = "none";
  if (params.style) {
    extend(newStyle, params.style);
  }

  const sizing = `
    ${params.minWidth === undefined ? "" : "min-width: " + EMConvert.points.emUnit(params.minWidth) + ";"}
    ${params.minHeight === undefined ? "" : "min-height: " + EMConvert.points.emUnit(params.minHeight) + ";"}
    ${params.maxWidth === undefined ? "" : "max-width: " + EMConvert.points.emUnit(params.maxWidth) + ";"}
    ${params.maxHeight === undefined ? "" : "max-height: " + EMConvert.points.emUnit(params.maxHeight) + ";"}
  `;

  const tooltip = params.tooltip;
  const tooltip_place_ref = useRef<SimplePlacementType>("bottom");
  const [tooltip_visible, set_tooltip_visible] = useState<boolean>(false);
  const [tooltip_x, set_tooltip_x] = useState<number>(0);
  const [tooltip_y, set_tooltip_y] = useState<number>(0);
  const tooltip_el: Ref<HTMLDivElement> = useRef(null);
  let tooltip_timeout = -1;
  const hovering = useRef<boolean>(false);

  // Display tooltip
  const pointerEnter = async (e: PointerEvent) => {
    hovering.current = true;
    if (tooltip_el.current) {
      tooltip_timeout = window.setTimeout(() => {
        if (hovering.current) {
          set_tooltip_visible(true);
        }
      }, 700);

      // Adjust tooltip position
      let prev_display = tooltip_el.current.style.display;
      if (prev_display === "none") tooltip_el.current.style.display = "inline-block";
      const r = await computePosition(e.target as HTMLElement, tooltip_el.current, {
        placement: (tooltip_place_ref.current + "-start") as any,
        middleware: [ offset(7), flip(), shift() ],
      });
      tooltip_el.current.style.display = prev_display;
      set_tooltip_x(r.x);
      set_tooltip_y(r.y);
    }
  };

  // Hide tooltip
  const pointerLeave = (e: PointerEvent): any => {
    hovering.current = false;
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
        $rtl={rtl}
      >
        {tooltip}
      </TooltipDiv>
    );

  // sync tooltip side
  useEffect(() => {
    tooltip_place_ref.current = params.tooltipPlacement ?? "bottom";
  }, [params.tooltipPlacement ?? "bottom"]);

  switch (variant) {
    case "normal": {
      if (params.for) {
        return (
          <>
            <NormalLabel
              id={params.id}
              onPointerEnter={pointerEnter as any}
              onPointerLeave={pointerLeave as any}
              className={params.className}
              style={newStyle}
              htmlFor={params.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
              $wrap={params.wrap}
              $bold={params.bold}
              $rtl={rtl}>
              {params.children}
            </NormalLabel>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <NormalSpan
            id={params.id}
            onPointerEnter={pointerEnter as any}
            onPointerLeave={pointerLeave as any}
            className={params.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
            $wrap={params.wrap}
            $bold={params.bold}
            $rtl={rtl}>
            {params.children}
          </NormalSpan>
          {tooltip_rendered}
        </>
      );
    }
    case "heading1": {
      if (params.for) {
        return (
          <>
            <H1Label
              id={params.id}
              onPointerEnter={pointerEnter as any}
              onPointerLeave={pointerLeave as any}
              className={params.className}
              style={newStyle}
              htmlFor={params.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
              $wrap={params.wrap}
              $bold={params.bold}
              $rtl={rtl}>
              {params.children}
            </H1Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H1
            id={params.id}
            onPointerEnter={pointerEnter as any}
            onPointerLeave={pointerLeave as any}
            className={params.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
            $wrap={params.wrap}
            $bold={params.bold}
            $rtl={rtl}>
            {params.children}
          </H1>
          {tooltip_rendered}
        </>
      );
    }
    case "heading2": {
      if (params.for) {
        return (
          <>
            <H2Label
              id={params.id}
              onPointerEnter={pointerEnter as any}
              onPointerLeave={pointerLeave as any}
              className={params.className}
              style={newStyle}
              htmlFor={params.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
              $wrap={params.wrap}
              $bold={params.bold}
              $rtl={rtl}>
              {params.children}
            </H2Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H2
            id={params.id}
            onPointerEnter={pointerEnter as any}
            onPointerLeave={pointerLeave as any}
            className={params.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
            $wrap={params.wrap}
            $bold={params.bold}
            $rtl={rtl}>
            {params.children}
          </H2>
          {tooltip_rendered}
        </>
      );
    }
    case "heading3": {
      if (params.for) {
        return (
          <>
            <H3Label
              id={params.id}
              onPointerEnter={pointerEnter as any}
              onPointerLeave={pointerLeave as any}
              className={params.className}
              style={newStyle}
              htmlFor={params.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
              $wrap={params.wrap}
              $bold={params.bold}
              $rtl={rtl}>
              {params.children}
            </H3Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H3
            id={params.id}
            onPointerEnter={pointerEnter as any}
            onPointerLeave={pointerLeave as any}
            className={params.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
            $wrap={params.wrap}
            $bold={params.bold}
            $rtl={rtl}>
            {params.children}
          </H3>
          {tooltip_rendered}
        </>
      );
    }
    case "heading4": {
      if (params.for) {
        return (
          <>
            <H4Label
              id={params.id}
              onPointerEnter={pointerEnter as any}
              onPointerLeave={pointerLeave as any}
              className={params.className}
              style={newStyle}
              htmlFor={params.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
              $wrap={params.wrap}
              $bold={params.bold}
              $rtl={rtl}>
              {params.children}
            </H4Label>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <H4
            id={params.id}
            onPointerEnter={pointerEnter as any}
            onPointerLeave={pointerLeave as any}
            className={params.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
            $wrap={params.wrap}
            $bold={params.bold}
            $rtl={rtl}>
            {params.children}
          </H4>
          {tooltip_rendered}
        </>
      );
    }
    case "legend": {
      if (params.for) {
        return (
          <>
            <LegendLabel
              id={params.id}
              onPointerEnter={pointerEnter as any}
              onPointerLeave={pointerLeave as any}
              className={params.className}
              style={newStyle}
              htmlFor={params.for}
              $preferPrimaryColors={preferPrimaryColors}
              $sizing={sizing}
              $theme={theme}
              $wrap={params.wrap}
              $bold={params.bold}
              $rtl={rtl}>
              {params.children}
            </LegendLabel>
            {tooltip_rendered}
          </>
        );
      }
      return (
        <>
          <LegendSpan
            id={params.id}
            onPointerEnter={pointerEnter as any}
            onPointerLeave={pointerLeave as any}
            className={params.className}
            style={newStyle}
            $preferPrimaryColors={preferPrimaryColors}
            $sizing={sizing}
            $theme={theme}
            $wrap={params.wrap}
            $bold={params.bold}
            $rtl={rtl}>
            {params.children}
          </LegendSpan>
          {tooltip_rendered}
        </>
      );
    }
  }
}