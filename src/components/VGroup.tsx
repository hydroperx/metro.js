import { styled } from "styled-components";
import { useEffect, useRef } from "react";
import { Alignment } from "../layout/Alignment";
import { pointsToRem } from "../utils/points";
import assert from "assert";

const verticalAlignMaps: any = {
    "start": "start",
    "top": "start",
    "center": "center",
    "end": "end",
    "bottom": "end",
    "spaceBetween": "space-between"
};

const horizontalAlignMaps: any = {
    "start": "start",
    "left": "start",
    "center": "center",
    "end": "end",
    "right": "end",
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
}> `
    display: ${$ => ($.$visible ?? true) ? ($.$inline ? "inline-flex" : "flex") : "none"};
    flex-direction: column;
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
    ${ $ => $.$justifyContent ? "justify-content: " + $.$justifyContent + ";" : "" }
    ${ $ => $.$alignItems ? "align-items: " + $.$alignItems + ";" : "" }
    ${ $ => $.$overflow ? "overflow: " + $.$overflow + ";" : "" }
    ${ $ => $.$overflowX ? "overflow-x: " + $.$overflowX + ";" : "" }
    ${ $ => $.$overflowY ? "overflow-y: " + $.$overflowY + ";" : "" }
`;

export function VGroup(options: VGroupOptions)
{
    let overflow = "";
    if (options.clip)
    {
        overflow = "hidden";
    }
    let overflowX = "";
    if (options.clipHorizontal)
    {
        overflowX = "hidden";
    }
    let overflowY = "";
    if (options.clipVertical)
    {
        overflowY = "hidden";
    }
    let justifyContent = "";
    if (options.verticalAlign)
    {
        const m = verticalAlignMaps[options.verticalAlign];
        assert(!!m, `Unsupported vertical alignment: ${options.verticalAlign}`);
        justifyContent = m;
    }
    let alignItems = "";
    if (options.horizontalAlign)
    {
        const m = horizontalAlignMaps[options.horizontalAlign];
        assert(!!m, `Unsupported horizontal alignment: ${options.horizontalAlign}`);
        alignItems = m;
    }

    return <Div
        ref={options.ref}
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
        onTouchCancel={options.touchCancel}
        
        onWheel={options.wheel}>
            
        {options.children}
    </Div>;
}

export type VGroupOptions = {
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