import extend from "extend";
import { css, SerializedStyles } from "@emotion/react";
import { useContext, useState, useRef, Ref } from "react";
import { ThemeContext, PreferPrimaryContext } from "../theme/Theme";
import { fontFamily  } from "../utils/common";
import { enhanceBrightness } from "../utils/color";
import { pointsToRem } from "../utils/points";
import { computePosition } from "../utils/placement";

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
    const preferPrimaryColors = useContext(PreferPrimaryContext);

    // Variant
    const variant = options.variant ?? "normal";

    const newStyle: React.CSSProperties = {};
    if (!(options.visible ?? true)) newStyle.display = "none";
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    const sizing = `
        ${options.minWidth === undefined ? "" : "min-width: " + pointsToRem(options.minWidth) + ";"}
        ${options.minHeight === undefined ? "" : "min-height: " + pointsToRem(options.minHeight) + ";"}
        ${options.maxWidth === undefined ? "" : "max-width: " + pointsToRem(options.maxWidth) + ";"}
        ${options.maxHeight === undefined ? "" : "max-height: " + pointsToRem(options.maxHeight) + ";"}
    `;

    const tooltip = options.tooltip;
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const tooltipElement: Ref<HTMLDivElement> = useRef(null);
    let tooltipTimeout = -1;
    let tooltipSerializedStyles: SerializedStyles | null = options.tooltip === undefined ? null : css `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid ${theme.colors.inputBorder};
        display: inline-block;
        visibility: ${tooltipVisible ? "visible" : "hidden"};
        position: fixed;
        left: ${tooltipX}px;
        top: ${tooltipY}px;
        padding: 0.4rem;
        font-size: 0.77rem;
    `;

    // Display tooltip
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            const element = e.target as HTMLElement;
            tooltipTimeout = window.setTimeout(() => {
                const button = element;
                if (button.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(e.target as HTMLElement, tooltipElement.current, {
                prefer: "bottom",
                margin: 7,
            });
            setTooltipX(x);
            setTooltipY(y);
        }
    };

    // Hide tooltip
    const mouseOut = (e: MouseEvent): any => {
        if (tooltipTimeout !== -1) {
            window.clearTimeout(tooltipTimeout);
            tooltipTimeout = -1;
        }
        setTooltipVisible(false);
    };

    const tooltipRendered = tooltip === undefined ?
        undefined :
        <div ref={tooltipElement} css={tooltipSerializedStyles}>{tooltip}</div>;

    switch (variant)
    {
        case "normal":
        {
            const serializedStyles = css `
                font-family: ${fontFamily};
                font-size: 0.9rem;
                ${sizing}
            `;
            if (options.for)
            {
                return <>
                    <label id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <span id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}>{options.children}</span>
                {tooltipRendered}
            </>;
        }
        case "heading1":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-weight: lighter;
                font-size: 2.1rem;
                margin: 0.67em 0;
                ${sizing}
            `;
            if (options.for)
            {
                return <>
                    <label id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <h1 id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}>{options.children}</h1>
                {tooltipRendered}
            </>;
        }
        case "heading2":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-weight: lighter;
                font-size: 1.7rem;
                margin: 0.67em 0;
                ${sizing}
            `;
            if (options.for)
            {
                return <>
                    <label id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <h2 id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}>{options.children}</h2>
                {tooltipRendered}
            </>;
        }
        case "heading3":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-size: 1.3rem;
                font-weight: bold;
                margin: 0.67em 0;
                ${sizing}
            `;
            if (options.for)
            {
                return <>
                    <label id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <h3 id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}>{options.children}</h3>
                {tooltipRendered}
            </>;
        }
        case "heading4":
        {
            const serializedStyles = css `
                ${preferPrimaryColors ? `color: ${enhanceBrightness(theme.colors.background, theme.colors.primaryBackground)};` : ""}
                font-family: ${fontFamily};
                font-size: 1.1rem;
                font-weight: bold;
                margin: 0.67em 0;
                ${sizing}
            `;
            if (options.for)
            {
                return <>
                    <label id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <h4 id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}>{options.children}</h4>
                {tooltipRendered}
            </>;
        }
        case "legend":
        {
            const serializedStyles = css `
                font-family: ${fontFamily};
                font-size: 0.77rem;
                ${sizing}
            `;
            if (options.for)
            {
                return <>
                    <label id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}>{options.children}</label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <span id={options.id} css={serializedStyles} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}>{options.children}</span>
                {tooltipRendered}
            </>;
        }
    }
}

export type LabelOptions = {
    variant?: LabelVariant,

    tooltip?: string,

    id?: string,

    /**
     * Indicates the form component this label connects to by its ID.
     */
    for?: string,

    visible?: boolean,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    style?: React.CSSProperties,
    className?: string,
    children?: React.ReactNode,
};