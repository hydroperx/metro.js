import extend from "extend";
import { styled } from "styled-components";
import { useContext, useState, useRef, Ref } from "react";
import { ThemeContext, PreferPrimaryContext, Theme } from "../theme/Theme";
import { fontFamily, maximumZIndex  } from "../utils/common";
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

const TooltipDiv = styled.div<{
    $theme: Theme,
    $tooltipVisible: boolean,
    $tooltipX: number,
    $tooltipY: number,
}> `
    background: ${$ => $.$theme.colors.inputBackground};
    border: 0.15rem solid ${$ => $.$theme.colors.inputBorder};
    display: inline-block;
    visibility: ${$ => $.$tooltipVisible ? "visible" : "hidden"};
    position: fixed;
    left: ${$ => $.$tooltipX}px;
    top: ${$ => $.$tooltipY}px;
    padding: 0.4rem;
    font-size: 0.77rem;
    z-index: ${maximumZIndex};
`;

// normal

const NormalLabel = styled.label<LabelCSSProps> `
    font-family: ${fontFamily};
    font-size: 0.9rem;
    ${$ => $.$sizing}
`;

const NormalSpan = styled.span<LabelCSSProps> `
    font-family: ${fontFamily};
    font-size: 0.9rem;
    ${$ => $.$sizing}
`;

// heading 1

const H1Label = styled.label<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-weight: lighter;
    font-size: 2rem;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

const H1 = styled.h1<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-weight: lighter;
    font-size: 2rem;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

// heading 2

const H2Label = styled.label<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-weight: lighter;
    font-size: 1.7rem;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

const H2 = styled.h2<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-weight: lighter;
    font-size: 1.7rem;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

// heading 3

const H3Label = styled.label<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-size: 1.3rem;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

const H3 = styled.h3<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-size: 1.3rem;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

// heading 4

const H4Label = styled.label<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

const H4 = styled.h4<LabelCSSProps> `
    ${$ => $.$preferPrimaryColors ? `color: ${enhanceBrightness($.$theme.colors.background, $.$theme.colors.primary)};` : ""}
    font-family: ${fontFamily};
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0.67em 0;
    ${$ => $.$sizing}
`;

// legend

const LegendLabel = styled.label<LabelCSSProps> `
    font-family: ${fontFamily};
    font-size: 0.77rem;
    ${$ => $.$sizing}
`;

const LegendSpan = styled.span<LabelCSSProps> `
    font-family: ${fontFamily};
    font-size: 0.77rem;
    ${$ => $.$sizing}
`;

type LabelCSSProps = {
    $preferPrimaryColors: boolean,
    $sizing: string,
    $theme: Theme,
};

export function Label(options: LabelOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext!);

    // Determine which coloring is preferred
    const preferPrimaryColors = useContext(PreferPrimaryContext!);

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

    // Display tooltip
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            const element = e.target as HTMLElement;
            tooltipTimeout = window.setTimeout(() => {
                if (element.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(e.target as HTMLElement, tooltipElement.current, {
                prefer: "bottom",
                orthogonal: true,
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
        <TooltipDiv
            ref={tooltipElement}
            $theme={theme}
            $tooltipVisible={tooltipVisible}
            $tooltipX={tooltipX}
            $tooltipY={tooltipY}>
    
            {tooltip}
        </TooltipDiv>;

    switch (variant)
    {
        case "normal":
        {
            if (options.for)
            {
                return <>
                    <NormalLabel
                        id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}
                        $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                        {options.children}
                    </NormalLabel>
                    {tooltipRendered}
                </>;
            }
            return <>
                <NormalSpan
                    id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}
                    $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                    {options.children}
                </NormalSpan>
                {tooltipRendered}
            </>;
        }
        case "heading1":
        {
            if (options.for)
            {
                return <>
                    <H1Label
                        id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}
                        $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                        {options.children}
                    </H1Label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <H1
                    id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}
                    $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                    {options.children}
                </H1>
                {tooltipRendered}
            </>;
        }
        case "heading2":
        {
            if (options.for)
            {
                return <>
                    <H2Label
                        id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}
                        $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                        {options.children}
                    </H2Label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <H2
                    id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}
                    $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                    {options.children}
                </H2>
                {tooltipRendered}
            </>;
        }
        case "heading3":
        {
            if (options.for)
            {
                return <>
                    <H3Label
                        id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}
                        $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                        {options.children}
                    </H3Label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <H3
                    id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}
                    $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                    {options.children}
                </H3>
                {tooltipRendered}
            </>;
        }
        case "heading4":
        {
            if (options.for)
            {
                return <>
                    <H4Label
                        id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}
                        $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                        {options.children}
                    </H4Label>
                    {tooltipRendered}
                </>;
            }
            return <>
                <H4
                    id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}
                    $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                    {options.children}
                </H4>
                {tooltipRendered}
            </>;
        }
        case "legend":
        {
            if (options.for)
            {
                return <>
                    <LegendLabel
                        id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle} htmlFor={options.for}
                        $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                        {options.children}
                    </LegendLabel>
                    {tooltipRendered}
                </>;
            }
            return <>
                <LegendSpan
                    id={options.id} onMouseOver={mouseOver as any} onMouseOut={mouseOut as any} className={options.className} style={newStyle}
                    $preferPrimaryColors={preferPrimaryColors} $sizing={sizing} $theme={theme}>

                    {options.children}
                </LegendSpan>
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