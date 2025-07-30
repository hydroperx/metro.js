import assert from "assert";
import * as React from "react";
import { styled } from "styled-components";

import { Theme, ThemeContext } from "../theme/Theme";
import { AnchorSkin } from "../skins/AnchorSkin";
import { ScrollbarSkin } from "../skins/ScrollbarSkin";
import { SelectionSkin } from "../skins/SelectionSkin";
import { TableSkin } from "../skins/TableSkin";
import * as EMConvert from "../utils/EMConvert";
import { InOutVariant, Alignment } from "../enum";
import { COMMON_DELAY } from "../utils/Constants";

/**
 * Vertical group.
 */
export function VGroup(params: {
  full?: boolean,
  /**
   * Indicates whether the container should display a solid background
   * according to the provided theme. Defaults to `false`.
   */
  solid?: boolean,
  /**
   * Indicates whether the container should display an input border
   * and input background (similiar to text inputs, tooltips and context menus).
   */
  input?: boolean,
  /**
   * If `false`, excludes the container from the layout, making it
   * hidden.
   */
  visible?: boolean,
  className?: string,
  id?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * Indicates whether or not character selection is enabled for this container.
   */
  selection?: boolean,

  /**
   * Whether the group displays inline with other elements.
   */
  inline?: boolean,

  gap?: number,
  /**
   * Horizontal alignment.
   */
  horizontalAlign?: Alignment,
  /**
   * Vertical alignment.
   */
  verticalAlign?: Alignment,

  /**
   * Indicates whether the group wraps into multiple lines on possible overflow.
   * If `"wrap-reverse"`, then lines are stacked in reverse order.
   */
  wrap?: "wrap" | "wrap-reverse",

  /**
   * Whether to clip in case content overflows.
   */
  clip?: boolean,

  /**
   * Whether to clip horizontally in case content overflows.
   */
  clipHorizontal?: boolean,

  /**
   * Whether to clip vertically in case content overflows.
   */
  clipVertical?: boolean,

  margin?: number,
  marginLeft?: number,
  marginRight?: number,
  marginTop?: number,
  marginBottom?: number,

  padding?: number,
  paddingLeft?: number,
  paddingRight?: number,
  paddingTop?: number,
  paddingBottom?: number,

  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number,

  /**
   * Ease cascading position properties with a `COMMON_DELAY` duration.
   */
  easePosition?: InOutVariant,
  /**
   * Ease cascading transform with a `COMMON_DELAY` duration.
   */
  easeTransform?: InOutVariant,
  /**
   * Ease opacity with a `COMMON_DELAY` duration.
   */
  easeOpacity?: InOutVariant,

  contextMenu?: React.MouseEventHandler<HTMLDivElement>,
  click?: React.MouseEventHandler<HTMLDivElement>,
  mouseOver?: React.MouseEventHandler<HTMLDivElement>,
  mouseOut?: React.MouseEventHandler<HTMLDivElement>,
  mouseUp?: React.MouseEventHandler<HTMLDivElement>,

  gotPointerCapture?: React.PointerEventHandler<HTMLDivElement>,
  lostPointerCapture?: React.PointerEventHandler<HTMLDivElement>,
  pointerCancel?: React.PointerEventHandler<HTMLDivElement>,
  pointerDown?: React.PointerEventHandler<HTMLDivElement>,
  pointerEnter?: React.PointerEventHandler<HTMLDivElement>,
  pointerLeave?: React.PointerEventHandler<HTMLDivElement>,
  pointerMove?: React.PointerEventHandler<HTMLDivElement>,
  pointerOut?: React.PointerEventHandler<HTMLDivElement>,
  pointerOver?: React.PointerEventHandler<HTMLDivElement>,
  pointerUp?: React.PointerEventHandler<HTMLDivElement>,

  touchStart?: React.TouchEventHandler<HTMLDivElement>,
  touchEnd?: React.TouchEventHandler<HTMLDivElement>,
  touchMove?: React.TouchEventHandler<HTMLDivElement>,
  touchCancel?: React.TouchEventHandler<HTMLDivElement>,

  wheel?: React.WheelEventHandler<HTMLDivElement>,
}) {
  // Contexts
  const theme = React.useContext(ThemeContext);

  // Enable or disable selection
  const userSelect = (params.selection ?? true) ? "auto" : "none";

  // Overflow
  let overflow = "";
  if (params.clip) {
    overflow = "hidden";
  }
  let overflowX = "";
  if (params.clipHorizontal) {
    overflowX = "hidden";
  }
  let overflowY = "";
  if (params.clipVertical) {
    overflowY = "hidden";
  }
  let justifyContent = "";
  if (params.verticalAlign) {
    const m = verticalAlignMaps[params.verticalAlign];
    assert(!!m, `Unsupported vertical alignment: ${params.verticalAlign}`);
    justifyContent = m;
  }
  let alignItems = "";
  if (params.horizontalAlign) {
    const m = horizontalAlignMaps[params.horizontalAlign];
    assert(!!m, `Unsupported horizontal alignment: ${params.horizontalAlign}`);
    alignItems = m;
  }

  // Transition
  let transition = "";
  if (params.easePosition) {
    transition =
      "left " + COMMON_DELAY + "ms ease-" + params.easePosition + ", " +
      "top " + COMMON_DELAY + "ms ease-" + params.easePosition + ", " +
      "right " + COMMON_DELAY + "ms ease-" + params.easePosition + ", " +
      "bottom " + COMMON_DELAY + "ms ease-" + params.easePosition;
  }
  if (params.easeTransform) {
    transition =
      (transition ? transition + ", " : "") +
      "transform " + COMMON_DELAY + "ms ease-" + params.easePosition
  }
  if (params.easeOpacity) {
    transition =
      (transition ? transition + ", " : "") +
      "opacity " + COMMON_DELAY + "ms ease-" + params.easePosition
  }

  // Layout
  return (
    <_Div
      id={params.id}
      className={
        [
          ...[params.full ? ["full"] : []],
          ...[params.solid ? ["solid"] : []],
          ...[params.input ? ["input"] : []],
          ...[params.visible === false ? ["invisible"] : []],
          ...[params.className ? [params.className] : []]
        ].join(" ")
      }
      ref={params.ref}
      style={params.style}
      $theme={theme}
      $margin={params.margin}
      $marginLeft={params.marginLeft}
      $marginRight={params.marginRight}
      $marginTop={params.marginTop}
      $marginBottom={params.marginBottom}
      $padding={params.padding}
      $paddingLeft={params.paddingLeft}
      $paddingRight={params.paddingRight}
      $paddingTop={params.paddingTop}
      $paddingBottom={params.paddingBottom}
      $minWidth={params.minWidth}
      $minHeight={params.minHeight}
      $maxWidth={params.maxWidth}
      $maxHeight={params.maxHeight}
      $userSelect={userSelect}
      $transition={transition}
      $gap={params.gap}
      $inline={params.inline}
      $overflow={overflow}
      $overflowX={overflowX}
      $overflowY={overflowY}
      $justifyContent={justifyContent}
      $alignItems={alignItems}
      $wrap={params.wrap}

      onClick={params.click}
      onMouseOver={params.mouseOver}
      onMouseOut={params.mouseOut}
      onMouseUp={params.mouseUp}
      onContextMenu={params.contextMenu}
      onGotPointerCapture={params.gotPointerCapture}
      onLostPointerCapture={params.lostPointerCapture}
      onPointerCancel={params.pointerCancel}
      onPointerDown={params.pointerDown}
      onPointerEnter={params.pointerEnter}
      onPointerLeave={params.pointerLeave}
      onPointerMove={params.pointerMove}
      onPointerOut={params.pointerOut}
      onPointerOver={params.pointerOver}
      onPointerUp={params.pointerUp}
      onTouchStart={params.touchStart}
      onTouchEnd={params.touchEnd}
      onTouchMove={params.touchMove}
      onTouchCancel={params.touchCancel}
      onWheel={params.wheel}>
      {params.children}
    </_Div>
  );
}

// Style sheet.
const _Div = styled.div<{
  $margin?: number,
  $marginLeft?: number,
  $marginRight?: number,
  $marginTop?: number,
  $marginBottom?: number,
  $padding?: number,
  $paddingLeft?: number,
  $paddingRight?: number,
  $paddingTop?: number,
  $paddingBottom?: number,
  $minWidth?: number,
  $minHeight?: number,
  $maxWidth?: number,
  $maxHeight?: number,
  $gap?: number,
  $justifyContent?: string,
  $alignItems?: string,
  $wrap?: string,
  $inline?: boolean,
  $overflow?: string,
  $overflowX?: string,
  $overflowY?: string,
  $theme: Theme,
  $userSelect: string,
  $transition: string,
}> `
  && {
    display: ${$ => $.$inline ? "inline-flex" : "flex"};
    flex-direction: column;
    color: ${$ => $.$theme.colors.foreground};
    ${($) => $.$transition ? "transition: " + $.$transition + ";" : ""}
    ${($) => ($.$gap !== undefined ? "gap: " + EMConvert.points.emUnit($.$gap) + ";" : "")}

    ${($) => $.$margin !== undefined ? "margin: " + EMConvert.points.emUnit($.$margin) + ";" : ""}
    ${($) => $.$marginLeft !== undefined ? "margin-left: " + EMConvert.points.emUnit($.$marginLeft) + ";" : ""}
    ${($) => $.$marginRight !== undefined ? "margin-right: " + EMConvert.points.emUnit($.$marginRight) + ";" : ""}
    ${($) => $.$marginTop !== undefined ? "margin-top: " + EMConvert.points.emUnit($.$marginTop) + ";" : ""}
    ${($) => $.$marginBottom !== undefined ? "margin-bottom: " + EMConvert.points.emUnit($.$marginBottom) + ";" : ""}

    ${($) => $.$padding !== undefined ? "padding: " + EMConvert.points.emUnit($.$padding) + ";" : ""}
    ${($) => $.$paddingLeft !== undefined ? "padding-left: " + EMConvert.points.emUnit($.$paddingLeft) + ";" : ""}
    ${($) => $.$paddingRight !== undefined ? "padding-right: " + EMConvert.points.emUnit($.$paddingRight) + ";" : ""}
    ${($) => $.$paddingTop !== undefined ? "padding-top: " + EMConvert.points.emUnit($.$paddingTop) + ";" : ""}
    ${($) => $.$paddingBottom !== undefined ? "padding-bottom: " + EMConvert.points.emUnit($.$paddingBottom) + ";" : ""}

    ${($) => $.$minWidth !== undefined ? "min-width: " + EMConvert.points.emUnit($.$minWidth) + ";" : ""}
    ${($) => $.$minHeight !== undefined ? "min-height: " + EMConvert.points.emUnit($.$minHeight) + ";" : ""}
    ${($) => $.$maxWidth !== undefined ? "max-width: " + EMConvert.points.emUnit($.$maxWidth) + ";" : ""}
    ${($) => $.$maxHeight !== undefined ? "max-height: " + EMConvert.points.emUnit($.$maxHeight) + ";" : ""}

    user-select: ${($) => $.$userSelect};
    -moz-user-select: ${($) => $.$userSelect};
    -webkit-user-select: ${($) => $.$userSelect};

    ${($) => $.$justifyContent ? "justify-content: " + $.$justifyContent + ";" : ""}
    ${($) => ($.$alignItems ? "align-items: " + $.$alignItems + ";" : "")}
    ${($) => ($.$overflow ? "overflow: " + $.$overflow + ";" : "")}
    ${($) => ($.$overflowX ? "overflow-x: " + $.$overflowX + ";" : "")}
    ${($) => ($.$overflowY ? "overflow-y: " + $.$overflowY + ";" : "")}
    ${($) => ($.$wrap !== undefined ? "flex-wrap: " + $.$wrap + ";" : "")}
  }

  &&.full {
    width: 100%;
    height: 100%;
  }

  &&.invisible {
    display: none;
  }

  &&.solid {
    background: ${$ => $.$theme.colors.background};
  }

  &&.input {
    background: ${$ => $.$theme.colors.inputBackground};
    border: 0.15em solid  ${$ => $.$theme.colors.inputBorder};
  }

  ${$ => AnchorSkin($.$theme)}

  ${$ => ScrollbarSkin($.$theme)}
  
  ${$ => SelectionSkin($.$theme)}

  ${$ => TableSkin($.$theme)}
`;

const verticalAlignMaps: any = {
  start: "start",
  top: "start",
  center: "center",
  end: "end",
  bottom: "end",
  spaceBetween: "space-between",
};

const horizontalAlignMaps: any = {
  start: "start",
  left: "start",
  center: "center",
  end: "end",
  right: "end",
  stretch: "stretch",
};