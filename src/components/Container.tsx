import { pointsToRem } from "../utils/points";
import extend from "extend";
import React, { useContext, useEffect, useRef } from "react";
import { css } from "@emotion/react";
import { ThemeContext } from "../theme";
import { fontFamily, monoFontFamily, fontSize, monoFontSize } from "../utils/common";
import { lighten, contrast } from "../utils/color";

/**
 * Represents a generic container that may have a solid background color and be full-sized.
 *
 * This component is used by convention as the topmost content in an application.
 */
export function Container(options: ContainerOptions)
{
    // Use theme
    const theme = useContext(ThemeContext);

    // Ref
    const div_ref = useRef<HTMLDivElement | null>(null);

    // Enable or disable selection
    const user_select = (options.selection ?? true) ? "auto" : "none";

    // Build transition
    let transition = "";
    if (options.easeOutPosition)
    {
        transition = "left 200ms ease-out, top 200ms ease-out, right 200ms ease-out, bottom 200ms ease-out";
    }
    if (options.easeOutTransform)
    {
        transition = (transition ? transition : ", " + "") + "transform 200ms ease-out";
    }
    if (options.easeInPosition)
    {
        transition = (transition ? transition : ", " + "") + "left 200ms ease-in, top 200ms ease-in, right 200ms ease-in, bottom 200ms ease-in";
    }
    if (options.easeInTransform)
    {
        transition = (transition ? transition : ", " + "") + "transform 200ms ease-in";
    }
    if (options.easeOutOpacity)
    {
        transition = (transition ? transition : ", " + "") + "opacity 200ms ease-out";
    }
    if (options.easeInOpacity)
    {
        transition = (transition ? transition : ", " + "") + "opacity 200ms ease-in";
    }

    // CSS
    const serializedStyles = css `
        ${ options.solid ? "background: " + theme.colors.background + ";" : "" }
        ${ options.padding !== undefined ? "padding: " + pointsToRem(options.padding) + ";" : "" }
        ${ options.paddingLeft !== undefined ? "padding-left: " + pointsToRem(options.paddingLeft) + ";" : "" }
        ${ options.paddingRight !== undefined ? "padding-right: " + pointsToRem(options.paddingRight) + ";" : "" }
        ${ options.paddingTop !== undefined ? "padding-top: " + pointsToRem(options.paddingTop) + ";" : "" }
        ${ options.paddingBottom !== undefined ? "padding-bottom: " + pointsToRem(options.paddingBottom) + ";" : "" }
        ${ (options.visible ?? true) ? "" : "display: none;" }
        color: ${theme.colors.foreground};
        font-family: ${fontFamily};
        font-size: ${fontSize};
        overflow: auto;
        transition: ${transition};
        user-select: ${user_select};
        -moz-user-select: ${user_select};
        -webkit-user-select: ${user_select};
        ${ options.minWidth !== undefined ? "min-width: " + pointsToRem(options.minWidth) + ";" : "" }
        ${ options.minHeight !== undefined ? "min-height: " + pointsToRem(options.minHeight) + ";" : "" }
        ${ options.maxWidth !== undefined ? "max-width: " + pointsToRem(options.maxWidth) + ";" : "" }
        ${ options.maxHeight !== undefined ? "max-height: " + pointsToRem(options.maxHeight) + ";" : "" }
        ${ options.full ? "width: 100%; height: 100%;" : ""}

        &::-webkit-scrollbar {
            width: 12px;
            height: 12px;
            background: ${theme.colors.scrollBarTrack};
        }

        &::-webkit-scrollbar-thumb {
            background: ${theme.colors.scrollBarThumb};
            border-radius: 0;
        }

        &::selection, &::-moz-selection {
            background: ${theme.colors.foreground};
            color: ${theme.colors.background};
        }

        & a {
            color: ${theme.colors.anchor};
            text-decoration: none;
        }

        & a:hover {
            color: ${lighten(theme.colors.anchor, 0.3)};
        }

        & code, & pre {
            font-family: ${monoFontFamily};
            font-size: ${monoFontSize};
        }

        & table {
            margin: 0 auto;
            border-collapse: collapse;
        }
        & table td {
            padding: 3px 20px;
            border: 0.1rem ${contrast(theme.colors.foreground, 0.5)} solid;
        }
        & table thead {
            background: ${contrast(theme.colors.foreground, 0.8)};
        }
        & table thead td {
            font-weight: 700;
            border: none;
        }
        & table td, & table tr {
            font-size: ${fontSize};
        }
        & table thead th {
            padding: 3px 20px;
            border: 0.1rem ${contrast(theme.colors.foreground, 0.5)} solid;
        }
        & table tbody tr:nth-of-type(2n) {
            background: ${contrast(theme.colors.foreground, 0.8)};
        }
    `;

    useEffect(() => {
        options.element?.(div_ref.current!);
    }, []);

    return <div
        ref={div_ref}
        css={serializedStyles}
        className={options.className ? " " + options.className : ""}
        style={options.style}

        onClick={options.click}
        onMouseOver={options.mouseOver}
        onMouseOut={options.mouseOut}
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
        onTouchCancel={options.touchCancel}>

        {options.children}
    </div>;
}

export type ContainerOptions =
{
    full?: boolean,

    easeOutPosition?: boolean,
    easeOutTransform?: boolean,
    easeOutOpacity?: boolean,
    easeInPosition?: boolean,
    easeInTransform?: boolean,
    easeInOpacity?: boolean,

    padding?: number,
    paddingLeft?: number,
    paddingRight?: number,
    paddingTop?: number,
    paddingBottom?: number,

    /**
     * Indicates whether or not character selection is enabled for this container.
     */
    selection?: boolean,

    /**
     * Indicates whether the container should use a solid color
     * as background according to the provided theme.
     * Defaults to `false`.
     */
    solid?: boolean,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    visible?: boolean,

    style?: React.CSSProperties,
    className?: string,
    children?: React.ReactNode,

    element?: (element: HTMLDivElement) => void,

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
};