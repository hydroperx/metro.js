import { css } from "@emotion/react";
import { useEffect, useRef } from "react";
import assert from "assert";
import { Alignment } from "../layout/Alignment";
import { pointsToRem } from "../utils/points";

export function HGroup(options: HGroupOptions)
{
    let div_ref = useRef<HTMLDivElement | null>(null);

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

    // CSS
    const serializedStyles = css `
        display: ${(options.visible ?? true) ? (options.inline ? "inline-flex" : "flex") : "none"};
        flex-direction: row;
        ${ options.gap !== undefined ? "gap: " + pointsToRem(options.gap) + ";" : "" }
        ${ options.padding !== undefined ? "padding: " + pointsToRem(options.padding) + ";" : "" }
        ${ options.paddingLeft !== undefined ? "padding-left: " + pointsToRem(options.paddingLeft) + ";" : "" }
        ${ options.paddingRight !== undefined ? "padding-right: " + pointsToRem(options.paddingRight) + ";" : "" }
        ${ options.paddingTop !== undefined ? "padding-top: " + pointsToRem(options.paddingTop) + ";" : "" }
        ${ options.paddingBottom !== undefined ? "padding-bottom: " + pointsToRem(options.paddingBottom) + ";" : "" }
        ${ options.minWidth !== undefined ? "min-width: " + pointsToRem(options.minWidth) + ";" : "" }
        ${ options.minHeight !== undefined ? "min-height: " + pointsToRem(options.minHeight) + ";" : "" }
        ${ options.maxWidth !== undefined ? "max-width: " + pointsToRem(options.maxWidth) + ";" : "" }
        ${ options.maxHeight !== undefined ? "max-height: " + pointsToRem(options.maxHeight) + ";" : "" }
        ${ justifyContent ? "justify-content: " + justifyContent + ";" : "" }
        ${ alignItems ? "align-items: " + alignItems + ";" : "" }
        ${ overflow ? "overflow: " + overflow + ";" : "" }
        ${ overflowX ? "overflow-x: " + overflowX + ";" : "" }
        ${ overflowY ? "overflow-y: " + overflowY + ";" : "" }
    `;

    useEffect(() => {
        options.element?.(div_ref.current!);
    }, []);

    return <div
        ref={div_ref}
        css={serializedStyles}
        className={options.className}
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