import { Alignment } from "../layout/Alignment";
import { pointsToRem } from "../utils/points";
import assert from "assert";
import extend from "extend";

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

    contextMenu?: React.MouseEventHandler<HTMLDivElement>,
    click?: React.MouseEventHandler<HTMLDivElement>,
    mouseOver?: React.MouseEventHandler<HTMLDivElement>,
    mouseOut?: React.MouseEventHandler<HTMLDivElement>,
    mouseUp?: React.MouseEventHandler<HTMLDivElement>,
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

export function HGroup(options: HGroupOptions)
{
    const newStyle: React.CSSProperties = {};

    newStyle.display = (options.visible ?? true) ? (options.inline ? "inline-flex" : "flex") : "none";
    newStyle.flexDirection = "row";

    if (options.padding !== undefined)
    {
        newStyle.padding = pointsToRem(options.padding);
    }
    if (options.paddingLeft !== undefined)
    {
        newStyle.paddingLeft = pointsToRem(options.paddingLeft);
    }
    if (options.paddingRight !== undefined)
    {
        newStyle.paddingRight = pointsToRem(options.paddingRight);
    }
    if (options.paddingTop !== undefined)
    {
        newStyle.paddingTop = pointsToRem(options.paddingTop);
    }
    if (options.paddingBottom !== undefined)
    {
        newStyle.paddingBottom = pointsToRem(options.paddingBottom);
    }
    if (options.gap !== undefined)
    {
        newStyle.gap = pointsToRem(options.gap);
    }
    if (options.minWidth !== undefined)
    {
        newStyle.minWidth = pointsToRem(options.minWidth);
    }
    if (options.maxWidth !== undefined)
    {
        newStyle.maxWidth = pointsToRem(options.maxWidth);
    }
    if (options.minHeight !== undefined)
    {
        newStyle.minHeight = pointsToRem(options.minHeight);
    }
    if (options.maxHeight !== undefined)
    {
        newStyle.maxHeight = pointsToRem(options.maxHeight);
    }

    if (options.clip)
    {
        newStyle.overflow = "hidden";
    }
    if (options.clipHorizontal)
    {
        newStyle.overflowX = "hidden";
    }
    if (options.clipVertical)
    {
        newStyle.overflowY = "hidden";
    }
    if (options.horizontalAlign)
    {
        const m = horizontalAlignMaps[options.horizontalAlign];
        assert(!!m, `Unsupported horizontal alignment: ${options.horizontalAlign}`);
        newStyle.justifyContent = m;
    }
    if (options.verticalAlign)
    {
        const m = verticalAlignMaps[options.verticalAlign];
        assert(!!m, `Unsupported vertical alignment: ${options.verticalAlign}`);
        newStyle.alignItems = m;
    }

    if (options.style)
    {
        extend(newStyle, options.style);
    }

    return <div
        className={options.className ?? ""}
        style={newStyle}
        onClick={options.click}
        onMouseOver={options.mouseOver}
        onMouseOut={options.mouseOut}
        onMouseUp={options.mouseUp}
        onContextMenu={options.contextMenu}>
            
        {options.children}
    </div>;
}