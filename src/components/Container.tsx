import { pointsToRem } from "../utils/points";
import extend from "extend";
import { useContext } from "react";
import { ThemeContext } from "../theme";

export type ContainerOptions =
{
    full?: boolean,

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
    children?: React.ReactNode,
};

/**
 * Represents a generic container that may have a solid background color and be full-sized.
 *
 * This component is used by convention as the topmost content in an application.
 */
export function Container(options: ContainerOptions)
{
    const theme = useContext(ThemeContext);

    const newStyle: React.CSSProperties = {};

    if (options.full)
    {
        newStyle.width = "100%";
        newStyle.height = "100%";
    }
    if (options.solid)
    {
        newStyle.background = theme.colors.background ?? "#fff";
    }

    newStyle.color = theme.colors.foreground ?? "#000";

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

    if (options.style)
    {
        extend(newStyle, options.style);
    }

    return <div style={newStyle}>{options.children}</div>;
}