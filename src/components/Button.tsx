import { pointsToRem } from "../utils/points";
import extend from "extend";
import { css, SerializedStyles } from "@emotion/react";
import React, { Ref, useContext, useRef, useState, useEffect } from "react";
import Color from "color";
import { fontFamily, fontSize } from "../utils/common";
import { computePosition } from "../utils/placement";
import { Icon } from "./Icons";
import { ThemeContext } from "../theme";

export function Button(options: ButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext);

    const buttonRef: Ref<HTMLButtonElement> = useRef(null);

    const newStyle: React.CSSProperties = {};

    if (options.minWidth !== undefined) newStyle.minWidth = pointsToRem(options.minWidth);
    if (options.maxWidth !== undefined) newStyle.maxWidth = pointsToRem(options.maxWidth);
    if (options.minHeight !== undefined) newStyle.minHeight = pointsToRem(options.minHeight);
    if (options.maxHeight !== undefined) newStyle.maxHeight = pointsToRem(options.maxHeight);
    if (options.disabled)
    {
        newStyle.opacity = "0.67";
    }

    if (options.style)
    {
        extend(newStyle, options.style);
    }

    // Emotion CSS
    let serializedStyles: SerializedStyles = null;
    
    const padding = "0.6rem 1rem";

    switch (options.variant ?? "secondary")
    {
        case "none":
        {
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const hoverBg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

            serializedStyles = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${hoverBg};
                }

                &:active:not(:disabled) {
                    transform: scale(0.97);
                }

                &[data-chosen="true"]:not(:disabled) {
                    background: ${theme.colors.primaryBackground};
                    color: ${theme.colors.primaryForeground};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${color};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
        case "anchor":
        {
            const color = theme.colors.anchor ?? "#000";
            const hoverColor = Color(color).lighten(0.3).toString();

            serializedStyles = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    color: ${hoverColor};
                }

                &:active:not(:disabled) {
                    color: ${hoverColor};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${theme.colors.focusDashes};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
        case "secondary":
        {
            // uses providedTheme.colors.foreground as character color
            serializedStyles = css `
                background: ${theme.colors.secondaryBackground};
                color: ${theme.colors.foreground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${theme.colors.hoveredSecondaryBackground};
                }

                &:active:not(:disabled) {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${theme.colors.focusDashes};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
        case "primary":
        {
            serializedStyles = css `
                background: ${theme.colors.primaryBackground};
                color: ${theme.colors.primaryForeground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${theme.colors.hoveredPrimaryBackground};
                }

                &:active:not(:disabled) {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${theme.colors.focusDashes};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
        case "danger":
        {
            serializedStyles = css `
                background: ${theme.colors.dangerBackground};
                color: ${theme.colors.dangerForeground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${theme.colors.hoveredDangerBackground};
                }

                &:active:not(:disabled) {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${theme.colors.focusDashes};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
        case "outline":
        {
            const c = Color(theme.colors.background);
            const dark = c.isDark();
            const color = dark ? "#fff" : "#000";
            const hoverBg = dark ? c.lighten(0.4).toString() : c.darken(0.3).toString();
            const pressedCharColor = dark ? "#000" : "#fff";

            serializedStyles = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: 0.15rem solid ${color};
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${hoverBg};
                }

                &:active:not(:disabled) {
                    background: ${color};
                    color: ${pressedCharColor};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${color};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
        case "outline-primary":
        {
            const c = Color(theme.colors.background);
            const dark = c.isDark();
            const color = dark ? "#fff" : "#000";
            const bg = dark ? c.lighten(0.5).toString() : c.darken(0.3).toString();
            const hoverBg = dark ? c.lighten(0.7).toString() : c.darken(0.5).toString();
            const pressedCharColor = dark ? "#000" : "#fff";

            serializedStyles = css `
                background: ${bg};
                color: ${color};
                padding: ${padding};
                border: 0.15rem solid ${color};
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${hoverBg};
                }

                &:active:not(:disabled) {
                    background: ${color};
                    color: ${pressedCharColor};
                }

                &:focus:not(:disabled) {
                    outline: 0.05rem dotted ${color};
                    outline-offset: -0.4rem;
                }

                &:disabled {
                    opacity: 0.6;
                }
            `;
            break;
        }
    }

    const tooltip = options.tooltip;
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const tooltipElement: Ref<HTMLDivElement> = useRef(null);
    let tooltipTimeout = -1;

    // Display tooltip
    const userMouseOver = options.mouseOver;
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            tooltipTimeout = window.setTimeout(() => {
                const button = buttonRef.current;
                if (button.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(buttonRef.current, tooltipElement.current, {
                prefer: "bottom",
                margin: 7,
            });
            setTooltipX(x);
            setTooltipY(y);
        }

        return userMouseOver?.(e as any);
    };

    // Hide tooltip
    const userMouseOut = options.mouseOut;
    const mouseOut = (e: MouseEvent): any => {
        if (tooltipTimeout !== -1) {
            window.clearTimeout(tooltipTimeout);
            tooltipTimeout = -1;
        }
        setTooltipVisible(false);
        return userMouseOut?.(e as any);
    };

    useEffect(() => {
        const button = buttonRef.current!;

        // Pass element
        options.element?.(button);
    });

    return <>
            <button
                ref={buttonRef}
                css={serializedStyles}
                className={options.className}
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={mouseOver as any}
                onMouseOut={mouseOut as any}
                onMouseUp={options.mouseUp}
                onContextMenu={options.contextMenu}
                style={newStyle}
                type={options.type ?? "button"}
                disabled={options.disabled ?? false}
                autoFocus={options.autoFocus ?? false}
                data-chosen={!!options.chosen}>

                {options.children}
            </button>
            {tooltip === undefined ?
                undefined :
                <div ref={tooltipElement} style={{
                    background: theme.colors.inputBackground,
                    border: "0.15rem solid " + theme.colors.inputBorder,
                    display: "inline-block",
                    visibility: tooltipVisible ? "visible" : "hidden",
                    position: "fixed",
                    left: tooltipX + "px",
                    top: tooltipY + "px",
                    padding: "0.4rem",
                    fontSize: "0.77rem",
                }}>{tooltip}</div>
            }
    </>;
}

export type ButtonVariant =
    "none" |
    "anchor" |
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

    chosen?: boolean,

    type?: ButtonType,

    disabled?: boolean,

    autoFocus?: boolean,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    visible?: boolean,

    tooltip?: string,

    style?: React.CSSProperties,
    className?: string,
    children?: React.ReactNode,

    element?: (element: HTMLButtonElement) => void,

    focus?: React.FocusEventHandler<HTMLButtonElement>,
    click?: React.MouseEventHandler<HTMLButtonElement>,
    contextMenu?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOver?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOut?: React.MouseEventHandler<HTMLButtonElement>,
    mouseUp?: React.MouseEventHandler<HTMLButtonElement>,
};

/**
 * Represents an arrow button.
 */
export function IconButton(options: IconButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext);

    // Button ref
    const ref = useRef<HTMLButtonElement | null>(null);

    // Icon type
    const [type, setType] = useState<string>(options.normalIcon);

    // Stylize
    const iconStyle: React.CSSProperties = {};
    if (options.rotation !== undefined)
    {
        iconStyle.transform = `rotate(${options.rotation}deg)`;
    }

    // Build style class
    const serializedStyles = css `
        background: none;
        border: none;
        border-radius: 0;
        outline: none;
        color: ${theme.colors.foreground};

        &:focus {
            outline: 0.05rem dotted ${theme.colors.focusDashes};
        }

        &:active {
            outline: none;
        }

        &:disabled {
            opacity: 0.6;
        }
    `;

    const mouseDownListener = () => { setType(options.pressedIcon); };
    const mouseUpListener = () => { setType(options.hoverIcon); };
    const mouseOverListener = () => { setType(options.hoverIcon); };
    const mouseOutListener = () => { setType(options.normalIcon); };

    useEffect(() => {
        // Obtain button
        const button = ref.current!;

        // Pass element
        options.element?.(button);

        button.addEventListener("mousedown", mouseDownListener);
        button.addEventListener("mouseup", mouseUpListener);
        button.addEventListener("mouseover", mouseOverListener);
        button.addEventListener("mouseout", mouseOutListener);

        return () => {
            button.removeEventListener("mousedown", mouseDownListener);
            button.removeEventListener("mouseup", mouseUpListener);
            button.removeEventListener("mouseover", mouseOverListener);
            button.removeEventListener("mouseout", mouseOutListener);
        };
    });

    return (
        <button
            ref={ref}
            css={serializedStyles}
            className={options.className}
            onFocus={options.focus}
            onClick={options.click}
            onMouseOver={options.mouseOver}
            onMouseOut={options.mouseOut}
            onMouseUp={options.mouseUp}
            onContextMenu={options.contextMenu}
            disabled={options.disabled}
            autoFocus={options.autoFocus}
            style={options.style}>

            <Icon type={type} size={options.size} style={iconStyle}/>
        </button>
    );
}

export type IconButtonOptions = {
    normalIcon: string,
    hoverIcon: string,
    pressedIcon: string,

    /**
     * Rotation degrees.
     */
    rotation?: number,
    size?: number,
    disabled?: boolean,
    autoFocus?: boolean,

    style?: React.CSSProperties,
    className?: string,

    element?: (element: HTMLButtonElement) => void,

    contextMenu?: React.MouseEventHandler<HTMLButtonElement>,
    focus?: React.FocusEventHandler<HTMLButtonElement>,
    click?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOver?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOut?: React.MouseEventHandler<HTMLButtonElement>,
    mouseUp?: React.MouseEventHandler<HTMLButtonElement>,
};

/**
 * Represents an arrow button.
 */
export function ArrowButton(options: ArrowButtonOptions)
{
    // Direction
    const d = options.direction;

    return (
        <IconButton
            normalIcon="arrowButton"
            hoverIcon="arrowButtonHover"
            pressedIcon="arrowButtonPressed"
            rotation={d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}
            className={options.className}
            element={options.element}
            focus={options.focus}
            click={options.click}
            mouseOver={options.mouseOver}
            mouseOut={options.mouseOut}
            mouseUp={options.mouseUp}
            contextMenu={options.contextMenu}
            disabled={options.disabled ?? false}
            autoFocus={options.autoFocus ?? false}
            style={options.style}
            size={options.size}/>
    );
}

export type ArrowButtonOptions = {
    direction: ArrowButtonDirection,
    size?: number,
    disabled?: boolean,
    autoFocus?: boolean,

    style?: React.CSSProperties,
    className?: string,

    element?: (element: HTMLButtonElement) => void,

    contextMenu?: React.MouseEventHandler<HTMLButtonElement>,
    focus?: React.FocusEventHandler<HTMLButtonElement>,
    click?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOver?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOut?: React.MouseEventHandler<HTMLButtonElement>,
    mouseUp?: React.MouseEventHandler<HTMLButtonElement>,
};

export type ArrowButtonDirection = "left" | "right" | "up" | "down";