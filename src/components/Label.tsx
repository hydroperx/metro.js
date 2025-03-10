import assert from "assert";
import extend from "extend";
import Color from "color";
import { css } from "@emotion/react";
import { useContext } from "react";
import { ThemeContext, PreferPrimaryColorsContext } from "../theme/Theme";
import { fontFamily  } from "../utils/common";
import { enhanceBrightness } from "../utils/color";

export type LabelVariant = 
    "normal" |
    "heading1" |
    "heading2" |
    "heading3" |
    "heading4" |
    "legend";

export function Label(options: LabelOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Determine which coloring is preferred
    const preferPrimaryColors = useContext(PreferPrimaryColorsContext);

    // Variant
    const variant = options.variant ?? "normal";

    const newStyle: React.CSSProperties = {};
    if (!(options.visible ?? true)) newStyle.display = "none";
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    switch (variant)
    {
        case "normal":
        {
            const serializedStyles = css `
                font-family: ${fontFamily};
                font-size: 0.9rem;
            `;
            if (options.for)
            {
                return <label id={options.id} css={serializedStyles} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>;
            }
            return <span id={options.id} css={serializedStyles} className={options.className} style={newStyle}>{options.children}</span>;
        }
        case "heading1":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-weight: lighter;
                font-size: 2.1rem;
                margin: 0.67em 0;
            `;
            if (options.for)
            {
                return <label id={options.id} css={serializedStyles} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>;
            }
            return <h1 id={options.id} css={serializedStyles} className={options.className} style={newStyle}>{options.children}</h1>;
        }
        case "heading2":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-weight: lighter;
                font-size: 1.7rem;
                margin: 0.67em 0;
            `;
            if (options.for)
            {
                return <label id={options.id} css={serializedStyles} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>;
            }
            return <h2 id={options.id} css={serializedStyles} className={options.className} style={newStyle}>{options.children}</h2>;
        }
        case "heading3":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-size: 1.3rem;
                font-weight: bold;
                margin: 0.67em 0;
            `;
            if (options.for)
            {
                return <label id={options.id} css={serializedStyles} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>;
            }
            return <h3 id={options.id} css={serializedStyles} className={options.className} style={newStyle}>{options.children}</h3>;
        }
        case "heading4":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-size: 1.1rem;
                font-weight: bold;
                margin: 0.67em 0;
            `;
            if (options.for)
            {
                return <label id={options.id} css={serializedStyles} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>;
            }
            return <h4 id={options.id} css={serializedStyles} className={options.className} style={newStyle}>{options.children}</h4>;
        }
        case "legend":
        {
            const serializedStyles = css `
                font-family: ${fontFamily};
                font-size: 0.77rem;
            `;
            if (options.for)
            {
                return <label id={options.id} css={serializedStyles} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>;
            }
            return <span id={options.id} css={serializedStyles} className={options.className} style={newStyle}>{options.children}</span>;
        }
    }
}

export type LabelOptions = {
    variant?: LabelVariant,

    id?: string,

    /**
     * Indicates the form component this label connects to by its ID.
     */
    for?: string,

    visible?: boolean,

    style?: React.CSSProperties,
    className?: string,
    children?: React.ReactNode,
};