import { pointsToRem } from "../utils/points";
import extend from "extend";
import { css } from "@emotion/css";
import { useContext } from "react";
import { ThemeContext } from "../theme";
import Color from "color";

export type ButtonVariant =
    "primary" |
    "secondary" |
    "danger" |
    "outline" |
    "outline-primary";

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
    const theme = useContext(ThemeContext);

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
    
    const padding = "0.7rem 1rem";

    switch (options.variant ?? "secondary")
    {
        case "secondary":
        {
            // uses providedTheme.colors.foreground as character color
            className = css `
                background: ${theme.colors.secondaryBackground};
                color: ${theme.colors.foreground};
                padding: ${padding};
                border: none;
                border-radius: none;

                &:hover {
                    background: ${theme.colors.hoveredSecondaryBackground};
                }

                &:active {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus {
                    outline: 1px dashed ${theme.colors.focusDashes};
                    outline-offset: -0.7rem;
                }
            `;
            break;
        }
        case "primary":
        {
            className = css `
                background: ${theme.colors.primaryBackground};
                color: ${theme.colors.primaryForeground};
                padding: ${padding};
                border: none;
                border-radius: none;

                &:hover {
                    background: ${theme.colors.hoveredPrimaryBackground};
                }

                &:active {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus {
                    outline: 1px dashed ${theme.colors.focusDashes};
                    outline-offset: -0.7rem;
                }
            `;
            break;
        }
        case "danger":
        {
            className = css `
                background: ${theme.colors.dangerBackground};
                color: ${theme.colors.dangerForeground};
                padding: ${padding};
                border: none;
                border-radius: none;

                &:hover {
                    background: ${theme.colors.hoveredDangerBackground};
                }

                &:active {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus {
                    outline: 1px dashed ${theme.colors.focusDashes};
                    outline-offset: -0.7rem;
                }
            `;
            break;
        }
        case "outline":
        {
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const hoverBg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
            const pressedCharColor = dark ? "#000" : "#fff";

            className = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: 2px solid ${color};
                border-radius: none;

                &:hover {
                    background: ${hoverBg};
                }

                &:active {
                    background: ${color};
                    color: ${pressedCharColor};
                }

                &:focus {
                    outline: 1px dashed ${color};
                    outline-offset: -0.7rem;
                }
            `;
            break;
        }
        case "outline-primary":
        {
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
            const hoverBg = dark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)";
            const pressedCharColor = dark ? "#000" : "#fff";

            className = css `
                background: ${bg};
                color: ${color};
                padding: ${padding};
                border: 2px solid ${color};
                border-radius: none;

                &:hover {
                    background: ${hoverBg};
                }

                &:active {
                    background: ${color};
                    color: ${pressedCharColor};
                }

                &:focus {
                    outline: 1px dashed ${color};
                    outline-offset: -0.7rem;
                }
            `;
            break;
        }
    }

    return <button className={className} style={newStyle} type={options.type ?? "button"} disabled={options.disabled ?? false} autoFocus={options.autoFocus ?? false}>{options.children}</button>;
}