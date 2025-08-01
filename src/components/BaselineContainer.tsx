// CSS
import "./BaselineContainer/BaselineContainer.css";

// third-party
import * as React from "react";
import { styled } from "styled-components";

// local
import { Theme, ThemeContext } from "../theme/Theme";
import { AnchorSkin } from "../skins/AnchorSkin";
import { ScrollbarSkin } from "../skins/ScrollbarSkin";
import { SelectionSkin } from "../skins/SelectionSkin";
import { TableSkin } from "../skins/TableSkin";
import * as EMConvert from "../utils/EMConvert";

/**
 * Fundamental container used for integrating baseline styles
 * within children.
 */
export function BaselineContainer(params: {
  full?: boolean,
  /**
   * Indicates whether the container should display a solid background
   * according to the provided theme. Defaults to `false`.
   */
  solid?: boolean,
  id?: string,
  className?: string,
  style?: React.CSSProperties,
  children?: React.ReactNode,
  ref?: React.Ref<null | HTMLDivElement>,

  /**
   * Indicates whether or not character selection is enabled for this container.
   */
  selection?: boolean,

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
  const userSelect = typeof params.selection == "undefined" ? "inherit" : params.selection ? "auto" : "none";

  // Layout
  return (
    <_Div
      id={params.id}
      className={
        [
          "metro-baseline-container",
          ...[params.full ? ["full"] : []],
          ...[params.solid ? ["solid"] : []],
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
  $theme: Theme,
  $userSelect: string,
}> `
  && {
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
  }

  &&.full {
    width: 100%;
    height: 100%;
  }

  &&.solid {
    background: ${$ => $.$theme.colors.background};
  }

  ${$ => AnchorSkin($.$theme)}
  
  ${$ => ScrollbarSkin($.$theme)}

  ${$ => SelectionSkin($.$theme)}

  ${$ => TableSkin($.$theme)}
`;