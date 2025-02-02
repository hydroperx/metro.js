import { pointsToRem } from "../utils/points";
import extend from "extend";
import { css } from "@emotion/css";

export type ButtonVariant =
    "primary" |
    "secondary" |
    "danger" |
    "white-outline" |
    "white-outline-primary";

export type ButtonType =
    "button" | "reset" | "submit";

export type ButtonOptions =
{
    variant?: ButtonVariant,

    type?: ButtonType,

    disabled?: boolean,

    autoFocus?: boolean,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    visible?: boolean,

    style?: React.CSSProperties,
    children?: React.ReactNode,
};

export function Button(options: ButtonOptions)
{
    const newStyle: React.CSSProperties = {};

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

    if (options.disabled)
    {
        newStyle.opacity = "0.67";
    }

    if (options.style)
    {
        extend(newStyle, options.style);
    }

    let className: string = "";

    switch (options.variant ?? "secondary")
    {
        case "secondary":
        {
            // uses providedTheme.colors.foreground as character color
            className = css `
            `;
            break;
        }
        case "primary":
        {
            className = css `
            `;
            break;
        }
        case "danger":
        {
            className = css `
            `;
            break;
        }
        case "white-outline":
        {
            className = css `
            `;
            break;
        }
        case "white-outline-primary":
        {
            className = css `
            `;
            break;
        }
    }

    return <button className={className} style={newStyle} type={options.type ?? "button"} disabled={options.disabled ?? false} autoFocus={options.autoFocus ?? false}>{options.children}</button>;
}