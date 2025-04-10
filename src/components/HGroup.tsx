import { styled } from "styled-components";
import { useContext, useEffect, useRef } from "react";
import assert from "assert";

import { Alignment } from "../layout/Alignment";
import { pointsToRem } from "../utils/points";
import { Theme, ThemeContext } from "../theme/Theme";
import { fontFamily, fontSize } from "../utils/common";

const horizontalAlignMaps: any = {
    "start": "start",
    "left": "start",
    "center": "center",
    "end": "end",
    "right": "end",
    "spaceBetween": "space-between"
};

const verticalAlignMaps: any = {
    "start": "start",
    "top": "start",
    "center": "center",
    "end": "end",
    "bottom": "end",
    "stretch": "stretch"
};

// CSS
const Div = styled.div<{
    $visible?: boolean;
    $inline?: boolean;
    $gap?: number;
    $padding?: number;
    $paddingLeft?: number;
    $paddingRight?: number;
    $paddingTop?: number;
    $paddingBottom?: number;
    $minWidth?: number;
    $minHeight?: number;
    $maxWidth?: number;
    $maxHeight?: number;
    $justifyContent?: string;
    $alignItems?: string;
    $overflow?: string;
    $overflowX?: string;
    $overflowY?: string;
    $wrap?: "wrap" | "wrap-reverse";
    $user_select: string;
    $transition: string;
    $theme: Theme;
    $solid: boolean;
    $full: boolean;
}> `
    display: ${$ => ($.$visible ?? true) ? ($.$inline ? "inline-flex" : "flex") : "none"};
    flex-direction: row;
    ${ $ => $.$solid ? "background: " + $.$theme.colors.background + ";" : "" }
    color: ${$ => $.$theme.colors.foreground};
    font-family: ${fontFamily};
    font-size: ${fontSize};
    ${ $ => $.$gap !== undefined ? "gap: " + pointsToRem($.$gap) + ";" : "" }
    ${ $ => $.$padding !== undefined ? "padding: " + pointsToRem($.$padding) + ";" : "" }
    ${ $ => $.$paddingLeft !== undefined ? "padding-left: " + pointsToRem($.$paddingLeft) + ";" : "" }
    ${ $ => $.$paddingRight !== undefined ? "padding-right: " + pointsToRem($.$paddingRight) + ";" : "" }
    ${ $ => $.$paddingTop !== undefined ? "padding-top: " + pointsToRem($.$paddingTop) + ";" : "" }
    ${ $ => $.$paddingBottom !== undefined ? "padding-bottom: " + pointsToRem($.$paddingBottom) + ";" : "" }
    ${ $ => $.$minWidth !== undefined ? "min-width: " + pointsToRem($.$minWidth) + ";" : "" }
    ${ $ => $.$minHeight !== undefined ? "min-height: " + pointsToRem($.$minHeight) + ";" : "" }
    ${ $ => $.$maxWidth !== undefined ? "max-width: " + pointsToRem($.$maxWidth) + ";" : "" }
    ${ $ => $.$maxHeight !== undefined ? "max-height: " + pointsToRem($.$maxHeight) + ";" : "" }
    ${ $ => $.$full ? "width: 100%; height: 100%;" : ""}
    ${ $ => $.$justifyContent ? "justify-content: " + $.$justifyContent + ";" : "" }
    ${ $ => $.$alignItems ? "align-items: " + $.$alignItems + ";" : "" }
    ${ $ => $.$overflow ? "overflow: " + $.$overflow + ";" : "" }
    ${ $ => $.$overflowX ? "overflow-x: " + $.$overflowX + ";" : "" }
    ${ $ => $.$overflowY ? "overflow-y: " + $.$overflowY + ";" : "" }
    ${ $ => $.$wrap !== undefined ? "flex-wrap: " + $.$wrap + ";" : "" }
    transition: ${$ => $.$transition};
    user-select: ${$ => $.$user_select};
    -moz-user-select: ${$ => $.$user_select};
    -webkit-user-select: ${$ => $.$user_select};

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
`;

export function HGroup(options: HGroupOptions)
{
    // Use theme
    const theme = useContext(ThemeContext);

    // Refs
    const ref: React.Ref<HTMLDivElement | null> = useRef(null);

    let overflow = "";
    if (options.clip)
    {
        overflow = "hidden";
    }
    let overflowX = "";
    if (options.wheelHorizontal)
    {
        overflowX = "auto";
    }
    else if (options.clipHorizontal)
    {
        overflowX = "hidden";
    }
    let overflowY = "";
    if (options.clipVertical)
    {
        overflowY = "hidden";
    }
    let justifyContent = "";
    if (options.horizontalAlign)
    {
        const m = horizontalAlignMaps[options.horizontalAlign];
        assert(!!m, `Unsupported horizontal alignment: ${options.horizontalAlign}`);
        justifyContent = m;
    }
    let alignItems = "";
    if (options.verticalAlign)
    {
        const m = verticalAlignMaps[options.verticalAlign];
        assert(!!m, `Unsupported vertical alignment: ${options.verticalAlign}`);
        alignItems = m;
    }

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

    // Enable or disable selection
    const user_select = (options.selection ?? true) ? "auto" : "none";

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
        className={options.className}
        style={options.style}

        $visible={options.visible}
        $inline={options.inline}
        $gap={options.gap}
        $padding={options.padding}
        $paddingLeft={options.paddingLeft}
        $paddingRight={options.paddingRight}
        $paddingTop={options.paddingTop}
        $paddingBottom={options.paddingBottom}
        $minWidth={options.minWidth}
        $minHeight={options.minHeight}
        $maxWidth={options.maxWidth}
        $maxHeight={options.maxHeight}
        $justifyContent={justifyContent}
        $alignItems={alignItems}
        $overflow={overflow}
        $overflowX={overflowX}
        $overflowY={overflowY}
        $wrap={options.wrap}
        $transition={transition}
        $user_select={user_select}
        $theme={theme}
        $solid={!!options.solid}
        $full={!!options.full}

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

export type HGroupOptions = {
    padding?: number,
    paddingLeft?: number,
    paddingRight?: number,
    paddingTop?: number,
    paddingBottom?: number,

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

    /**
     * Enables horizontal scrolling with mouse wheel support.
     */
    wheelHorizontal?: boolean,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,
    
    easeOutPosition?: boolean,
    easeOutTransform?: boolean,
    easeOutOpacity?: boolean,
    easeInPosition?: boolean,
    easeInTransform?: boolean,
    easeInOpacity?: boolean,

    /**
     * Indicates whether the container should use a solid color
     * as background according to the provided theme.
     * Defaults to `false`.
     */
    solid?: boolean,

    full?: boolean,

    /**
     * Indicates whether or not character selection is enabled for this container.
     */
    selection?: boolean,

    wrap?: "wrap" | "wrap-reverse",

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