import { pointsToRem } from "../utils/points";
import extend from "extend";
import React, { useContext, useEffect, useRef } from "react";
import { styled } from "styled-components";
import { Theme, ThemeContext } from "../theme";
import { fontFamily, monoFontFamily, fontSize, monoFontSize } from "../utils/common";
import { lighten, contrast } from "../utils/color";

/**
 * Represents a generic container that may have a solid background color and be full-sized.
 *
 * This component is used by convention as the topmost content in an application,
 * although `HGroup` and `VGroup` may also be used instead.
 */
export function Container(options: ContainerOptions)
{
    // Use theme
    const theme = useContext(ThemeContext);

    // Refs
    const ref: React.Ref<HTMLDivElement | null> = useRef(null);

    // Enable or disable selection
    const user_select = (options.selection ?? true) ? "auto" : "none";

    // Overflow X
    let overflowX = options.wheelHorizontal ? "auto" : "";

    // Build transition
    let transition = "";
    if (options.easeOutPosition)
    {
        transition = "left 200ms ease-out, top 200ms ease-out, right 200ms ease-out, bottom 200ms ease-out";
    }
    if (options.easeOutTransform)
    {
        transition = (transition ? transition + ", " : "") + "transform 200ms ease-out";
    }
    if (options.easeInPosition)
    {
        transition = (transition ? transition + ", " : "") + "left 200ms ease-in, top 200ms ease-in, right 200ms ease-in, bottom 200ms ease-in";
    }
    if (options.easeInTransform)
    {
        transition = (transition ? transition + ", " : "") + "transform 200ms ease-in";
    }
    if (options.easeOutOpacity)
    {
        transition = (transition ? transition + ", " : "") + "opacity 200ms ease-out";
    }
    if (options.easeInOpacity)
    {
        transition = (transition ? transition + ", " : "") + "opacity 200ms ease-in";
    }

    // Wheel
    let last_wheel_timestamp = -1,
        last_fast_wheel_timestamp = -1;
    const handle_wheel = (e: WheelEvent): void => {
        // deltaMode == DOM_DELTA_PIXEL
        const div = e.currentTarget as HTMLDivElement;
        if (options.wheelHorizontal && e.deltaMode == 0)
        {
            e.preventDefault();
            let multiplier = 2;
            if (last_wheel_timestamp != -1 && ((last_wheel_timestamp > Date.now() - 600 && last_wheel_timestamp < Date.now() - 20) || (last_fast_wheel_timestamp !== -1 && last_fast_wheel_timestamp > Date.now() - 100)))
                multiplier *= 3,
                last_fast_wheel_timestamp = Date.now();
            else last_fast_wheel_timestamp = -1;
            const delta_y = e.deltaY * multiplier;
            let target_scroll = div.scrollLeft + delta_y;
            target_scroll = Math.min(target_scroll, div.scrollWidth);
            div.scrollTo({ left: target_scroll, behavior: "smooth" });
            last_wheel_timestamp = Date.now();
        }
        options.wheel?.(e as any);
    };

    useEffect(() => {
        let div: HTMLDivElement | null = ref.current;
        div.addEventListener("wheel", handle_wheel, { passive: false });
        return () => {
            div.removeEventListener("wheel", handle_wheel);
        };
    }, []);

    return <Div
        ref={node => {
            ref.current = node;
            if (typeof options.ref == "function")
                options.ref(node);
            else if (options.ref)
                options.ref.current = node;
        }}
        className={options.className ? " " + options.className : ""}
        style={options.style}

        $theme={theme}
        $visible={options.visible ?? true}
        $transition={transition}
        $padding={options.padding}
        $paddingLeft={options.paddingLeft}
        $paddingRight={options.paddingRight}
        $paddingTop={options.paddingTop}
        $paddingBottom={options.paddingBottom}
        $minWidth={options.minWidth}
        $minHeight={options.minHeight}
        $maxWidth={options.maxWidth}
        $maxHeight={options.maxHeight}
        $overflowX={overflowX}
        $full={!!options.full}
        $user_select={user_select}
        $solid={!!options.solid}

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
    </Div>;
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
     * Enables horizontal scrolling with mouse wheel support.
     */
    wheelHorizontal?: boolean,

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
    ref?: React.Ref<HTMLDivElement | null>,

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
};

const Div = styled.div<{
    $theme: Theme,
    $visible: boolean;
    $transition: string;
    $padding?: number;
    $paddingLeft?: number;
    $paddingRight?: number;
    $paddingTop?: number;
    $paddingBottom?: number;
    $minWidth?: number;
    $minHeight?: number;
    $maxWidth?: number;
    $maxHeight?: number;
    $overflowX?: string;
    $full: boolean,
    $user_select: string;
    $solid: boolean,
}> `
    ${ $ => $.$solid ? "background: " + $.$theme.colors.background + ";" : "" }
    ${ $ => $.$padding !== undefined ? "padding: " + pointsToRem($.$padding) + ";" : "" }
    ${ $ => $.$paddingLeft !== undefined ? "padding-left: " + pointsToRem($.$paddingLeft) + ";" : "" }
    ${ $ => $.$paddingRight !== undefined ? "padding-right: " + pointsToRem($.$paddingRight) + ";" : "" }
    ${ $ => $.$paddingTop !== undefined ? "padding-top: " + pointsToRem($.$paddingTop) + ";" : "" }
    ${ $ => $.$paddingBottom !== undefined ? "padding-bottom: " + pointsToRem($.$paddingBottom) + ";" : "" }
    ${ $ => ($.$visible ?? true) ? "" : "display: none;" }
    color: ${$ => $.$theme.colors.foreground};
    font-family: ${fontFamily};
    font-size: ${fontSize};
    overflow: auto;
    ${ $ => $.$overflowX ? "overflow-x: " + $.$overflowX + ";" : "" }
    transition: ${$ => $.$transition};
    user-select: ${$ => $.$user_select};
    -moz-user-select: ${$ => $.$user_select};
    -webkit-user-select: ${$ => $.$user_select};
    ${ $ => $.$minWidth !== undefined ? "min-width: " + pointsToRem($.$minWidth) + ";" : "" }
    ${ $ => $.$minHeight !== undefined ? "min-height: " + pointsToRem($.$minHeight) + ";" : "" }
    ${ $ => $.$maxWidth !== undefined ? "max-width: " + pointsToRem($.$maxWidth) + ";" : "" }
    ${ $ => $.$maxHeight !== undefined ? "max-height: " + pointsToRem($.$maxHeight) + ";" : "" }
    ${ $ => $.$full ? "width: 100%; height: 100%;" : ""}

    &::-webkit-scrollbar {
        width: 12px;
        height: 12px;
        background: ${$ => $.$theme.colors.scrollBarTrack};
    }

    &::-webkit-scrollbar-thumb {
        background: ${$ => $.$theme.colors.scrollBarThumb};
        border-radius: 0;
    }

    &::selection, &::-moz-selection {
        background: ${$ => $.$theme.colors.foreground};
        color: ${$ => $.$theme.colors.background};
    }

    & h1, & h2, & h3 {
        font-weight: lighter;
    }

    & a {
        color: ${$ => $.$theme.colors.anchor};
        text-decoration: none;
    }

    & a:hover {
        color: ${$ => lighten($.$theme.colors.anchor, 0.3)};
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
        border: 0.1rem ${$ => contrast($.$theme.colors.foreground, 0.5)} solid;
    }
    & table thead {
        background: ${$ => contrast($.$theme.colors.foreground, 0.8)};
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
        border: 0.1rem ${$ => contrast($.$theme.colors.foreground, 0.5)} solid;
    }
    & table tbody tr:nth-of-type(2n) {
        background: ${$ => contrast($.$theme.colors.foreground, 0.8)};
    }
`;