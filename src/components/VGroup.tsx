import { Alignment } from "../layout/Alignment";
import { pointsToRem } from "../utils/points";
import assert from "assert";
import extend from "extend";

export type VGroupOptions = {
    padding?: number,
    paddingLeft?: number,
    paddingRight?: number,
    paddingTop?: number,
    paddingBottom?: number,

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
     * Grow factor of the component relative to
     * its container. This indicates how much space
     * the component takes out of a number of items.
     */
    grow?: number,

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
    children?: React.ReactNode,
};

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

export function VGroup(options: VGroupOptions)
{
    const newStyle: React.CSSProperties = {};

    newStyle.display = (options.visible ?? true) ? "flex" : "none";
    newStyle.flexDirection = "column";

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
    if (options.grow !== undefined)
    {
        newStyle.flexGrow = String(options.grow);
    }

    newStyle.overflow = "auto";

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
    if (options.verticalAlign)
    {
        const m = verticalAlignMaps[options.verticalAlign];
        assert(!!m, `Unsupported vertical alignment: ${options.verticalAlign}`);
        newStyle.justifyContent = m;
    }
    if (options.horizontalAlign)
    {
        const m = horizontalAlignMaps[options.horizontalAlign];
        assert(!!m, `Unsupported horizontal alignment: ${options.horizontalAlign}`);
        newStyle.alignItems = m;
    }

    if (options.style)
    {
        extend(newStyle, options.style);
    }

    return <div style={newStyle}>{options.children}</div>;
}