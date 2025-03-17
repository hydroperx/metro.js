import extend from "extend";
import { css, SerializedStyles } from "@emotion/react";
import React, { Ref, useContext, useRef, useState, useEffect } from "react";
import Color from "color";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { fontFamily, fontSize, maximumZIndex } from "../utils/common";
import { lighten, darken, enhanceBrightness } from "../utils/color";
import { computePosition } from "../utils/placement";
import { DownArrowIcon, Icon } from "./Icons";
import { ThemeContext } from "../theme";
import { LocaleDirectionContext } from "../layout";

export function Button(options: ButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

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
    let serialized_styles: SerializedStyles = null;
    
    const padding = "0.6rem 1rem";

    switch (options.variant ?? "secondary")
    {
        case "none":
        {
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const hoverBg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

            serialized_styles = css `
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
                    background: ${theme.colors.primary};
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
        case "small-dropdown":
        case "small-dropdown-primary":
        {
            const normal_color = options.variant == "small-dropdown-primary" ? Color(enhanceBrightness(theme.colors.background, theme.colors.primary)).alpha(0.67) : Color(theme.colors.foreground).alpha(0.67);

            serialized_styles = css `
                background: none;
                border: none;
                color: ${normal_color.toString()};
                font-family: ${fontFamily};
                font-weight: lighter;
                font-size: 0.79rem;
                display: flex;
                gap: 0.5rem;
                flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
                align-items: center;
                padding: ${pointsToRemValue(1)}rem 0.7rem;
                min-width: 5rem;
                outline: none;
    
                &:hover:not(:disabled), &:focus:not(:disabled) {
                    color: ${normal_color.alpha(0.8).toString()};
                }
    
                &:active:not(:disabled) {
                    color: ${normal_color.alpha(1).toString()};
                }
    
                &:disabled {
                    opacity: 0.4;
                }

                & .Button-small-inner {
                    display: inline-flex;
                    flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
                    gap: 0.9rem;
                }

                & .Button-small-arrow {
                    display: inline-flex;
                    flex-grow: 2;
                    flex-direction: ${localeDir == "ltr" ? "row-reverse" : "row"};
                    opacity: 0.7;
                }
            `;
            break;
        }
        case "anchor":
        {
            const color = theme.colors.anchor ?? "#000";
            const hoverColor = lighten(color, 0.3).toString();

            serialized_styles = css `
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
            const hoveredBackgrund = lighten(theme.colors.secondary, 0.5);
            serialized_styles = css `
                background: ${theme.colors.secondary};
                color: ${theme.colors.foreground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${hoveredBackgrund};
                }

                &:active:not(:disabled) {
                    background: ${theme.colors.pressed};
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
            const hoveredBackgrund = lighten(theme.colors.primary, 0.5);
            serialized_styles = css `
                background: ${theme.colors.primary};
                color: ${theme.colors.primaryForeground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${hoveredBackgrund};
                }

                &:active:not(:disabled) {
                    background: ${theme.colors.pressed};
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
            const hoveredBackgrund = lighten(theme.colors.danger, 0.5);
            serialized_styles = css `
                background: ${theme.colors.danger};
                color: ${theme.colors.dangerForeground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};
                font-family: ${fontFamily};

                &:hover:not(:disabled) {
                    background: ${hoveredBackgrund};
                }

                &:active:not(:disabled) {
                    background: ${theme.colors.pressed};
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
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const hoverBg = dark ? lighten(theme.colors.background, 0.4).toString() : darken(theme.colors.background, 0.3).toString();
            const pressedCharColor = dark ? "#000" : "#fff";

            serialized_styles = css `
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
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const bg = dark ? lighten(theme.colors.background, 0.5).toString() : darken(theme.colors.background, 0.3).toString();
            const hoverBg = dark ? lighten(theme.colors.background, 0.7).toString() : darken(theme.colors.background, 0.5).toString();
            const pressedCharColor = dark ? "#000" : "#fff";

            serialized_styles = css `
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
    const tooltipElement: Ref<HTMLDivElement | null> = useRef(null);
    let tooltipTimeout = -1;
    let tooltip_serialized_styles: SerializedStyles | null = options.tooltip === undefined ? null : css `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid ${theme.colors.inputBorder};
        display: inline-block;
        visibility: ${tooltipVisible ? "visible" : "hidden"};
        position: fixed;
        left: ${tooltipX}px;
        top: ${tooltipY}px;
        padding: 0.4rem;
        font-size: 0.77rem;
        z-index: ${maximumZIndex};
    `;

    // Display tooltip
    const userMouseOver = options.mouseOver;
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            tooltipTimeout = window.setTimeout(() => {
                const button = buttonRef.current;
                if (button?.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(buttonRef.current, tooltipElement.current, {
                prefer: "bottom",
                orthogonal: true,
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

    return (
        <>
            <button
                ref={buttonRef}
                css={serialized_styles}
                className={options.className}
                style={newStyle}
                type={options.type ?? "button"}
                disabled={options.disabled ?? false}
                autoFocus={options.autoFocus ?? false}
                data-chosen={!!options.chosen}

                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={mouseOver as any}
                onMouseOut={mouseOut as any}
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

                {
                    options.variant == "small-dropdown" || options.variant == "small-dropdown-primary" ?
                        <>
                            <div className="Button-small-inner">
                                {options.children}
                            </div>
                            <div className="Button-small-arrow">
                                <DownArrowIcon size={3.1}/>
                            </div>
                        </>:
                        options.children
                }
            </button>
            {tooltip === undefined ?
                undefined :
                <div ref={tooltipElement} css={tooltip_serialized_styles}>{tooltip}</div>
            }
        </>
    );
}

export type ButtonVariant =
    "none" |
    "small-dropdown" |
    "small-dropdown-primary" |
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

    gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>,
    lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>,
    pointerCancel?: React.PointerEventHandler<HTMLButtonElement>,
    pointerDown?: React.PointerEventHandler<HTMLButtonElement>,
    pointerEnter?: React.PointerEventHandler<HTMLButtonElement>,
    pointerLeave?: React.PointerEventHandler<HTMLButtonElement>,
    pointerMove?: React.PointerEventHandler<HTMLButtonElement>,
    pointerOut?: React.PointerEventHandler<HTMLButtonElement>,
    pointerOver?: React.PointerEventHandler<HTMLButtonElement>,
    pointerUp?: React.PointerEventHandler<HTMLButtonElement>,

    touchStart?: React.TouchEventHandler<HTMLButtonElement>,
    touchEnd?: React.TouchEventHandler<HTMLButtonElement>,
    touchMove?: React.TouchEventHandler<HTMLButtonElement>,
    touchCancel?: React.TouchEventHandler<HTMLButtonElement>,
};

/**
 * Represents a circle bordered icon button.
 */
export function CircleIconButton(options: CircleIconButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext);

    // Button ref
    const ref = useRef<HTMLButtonElement | null>(null);

    // Stylize
    const iconStyle: React.CSSProperties = {};
    if (options.rotation !== undefined)
    {
        iconStyle.transform = `rotate(${options.rotation}deg)`;
    }

    // Misc
    const fg = Color(theme.colors.foreground).isDark() ? "#000" : "#fff";
    const normal_color = options.filled ? (Color(fg).isDark() ? "#fff" : "#000") : fg;
    const hover_color = fg;
    const active_color = options.filled ? fg : (Color(fg).isDark() ? "#fff" : "#000");
    const size = options.size ?? 9;
    const size_rem = pointsToRem(size);

    // Build style class
    const serialized_styles = css `
        border: 0.17rem solid ${fg};
        border-radius: 100%;
        outline: none;
        color: ${normal_color};
        ${options.filled ? `background: ${fg};` : "background: none;"}
        width: ${size_rem};
        height: ${size_rem};
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;

        &:hover:not(:disabled) {
            color: ${hover_color};
            background: ${Color(fg).alpha(0.3).toString()};
        }

        &:focus:not(:disabled) {
            outline: 0.05rem dotted ${theme.colors.focusDashes};
            outline-offset: 0.3rem;
        }

        &:active:not(:disabled) {
            outline: none;
            color: ${active_color};
            ${options.filled ?
                `background: ${Color(fg).alpha(0.5).toString()};` : `background: ${fg};`}
        }

        &:disabled {
            opacity: 0.6;
        }
    `;

    useEffect(() => {
        // Obtain button
        const button = ref.current!;

        // Pass element
        options.element?.(button);
    },[]);

    const tooltip = options.tooltip;
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const tooltipElement: Ref<HTMLDivElement | null> = useRef(null);
    let tooltipTimeout = -1;
    let tooltip_serialized_styles: SerializedStyles | null = options.tooltip === undefined ? null : css `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid ${theme.colors.inputBorder};
        display: inline-block;
        visibility: ${tooltipVisible ? "visible" : "hidden"};
        position: fixed;
        left: ${tooltipX}px;
        top: ${tooltipY}px;
        padding: 0.4rem;
        font-size: 0.77rem;
        z-index: ${maximumZIndex};
    `;

    // Display tooltip
    const userMouseOver = options.mouseOver;
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            tooltipTimeout = window.setTimeout(() => {
                const button = ref.current;
                if (button?.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(ref.current, tooltipElement.current, {
                prefer: "bottom",
                orthogonal: true,
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

    return (
        <>
            <button
                ref={ref}
                css={serialized_styles}
                className={options.className}
                disabled={options.disabled}
                autoFocus={options.autoFocus}
                style={options.style}
                
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={mouseOver as any}
                onMouseOut={mouseOut as any}
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

                <Icon type={options.icon} size={size - (size <= 4.5 ? 0 : 4.5)} style={iconStyle}/>
            </button>

            {tooltip === undefined ?
                undefined :
                <div ref={tooltipElement} css={tooltip_serialized_styles}>{tooltip}</div>
            }
        </>
    );
}

export type CircleIconButtonOptions = {
    icon: string,

    /**
     * Whether the icon is initially filled or not.
     */
    filled?: boolean,

    tooltip?: string,

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

    gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>,
    lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>,
    pointerCancel?: React.PointerEventHandler<HTMLButtonElement>,
    pointerDown?: React.PointerEventHandler<HTMLButtonElement>,
    pointerEnter?: React.PointerEventHandler<HTMLButtonElement>,
    pointerLeave?: React.PointerEventHandler<HTMLButtonElement>,
    pointerMove?: React.PointerEventHandler<HTMLButtonElement>,
    pointerOut?: React.PointerEventHandler<HTMLButtonElement>,
    pointerOver?: React.PointerEventHandler<HTMLButtonElement>,
    pointerUp?: React.PointerEventHandler<HTMLButtonElement>,

    touchStart?: React.TouchEventHandler<HTMLButtonElement>,
    touchEnd?: React.TouchEventHandler<HTMLButtonElement>,
    touchMove?: React.TouchEventHandler<HTMLButtonElement>,
    touchCancel?: React.TouchEventHandler<HTMLButtonElement>,
};

/**
 * Represents an arrow button.
 */
export function ArrowButton(options: ArrowButtonOptions)
{
    // Direction
    const d = options.direction;

    return (
        <CircleIconButton
            icon="arrowButton"
            rotation={d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}
            className={options.className}
            element={options.element}
            disabled={options.disabled ?? false}
            autoFocus={options.autoFocus ?? false}
            style={options.style}
            size={options.size}
            tooltip={options.tooltip}

            focus={options.focus}
            click={options.click}
            mouseOver={options.mouseOver}
            mouseOut={options.mouseOut}
            mouseUp={options.mouseUp}
            contextMenu={options.contextMenu}
            
            gotPointerCapture={options.gotPointerCapture}
            lostPointerCapture={options.lostPointerCapture}
            pointerCancel={options.pointerCancel}
            pointerDown={options.pointerDown}
            pointerEnter={options.pointerEnter}
            pointerLeave={options.pointerLeave}
            pointerMove={options.pointerMove}
            pointerOut={options.pointerOut}
            pointerOver={options.pointerOver}
            pointerUp={options.pointerUp}

            touchStart={options.touchStart}
            touchEnd={options.touchEnd}
            touchMove={options.touchMove}
            touchCancel={options.touchCancel}/>
    );
}

export type ArrowButtonOptions = {
    direction: ArrowButtonDirection,
    size?: number,
    tooltip?: string,
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

    gotPointerCapture?: React.PointerEventHandler<HTMLButtonElement>,
    lostPointerCapture?: React.PointerEventHandler<HTMLButtonElement>,
    pointerCancel?: React.PointerEventHandler<HTMLButtonElement>,
    pointerDown?: React.PointerEventHandler<HTMLButtonElement>,
    pointerEnter?: React.PointerEventHandler<HTMLButtonElement>,
    pointerLeave?: React.PointerEventHandler<HTMLButtonElement>,
    pointerMove?: React.PointerEventHandler<HTMLButtonElement>,
    pointerOut?: React.PointerEventHandler<HTMLButtonElement>,
    pointerOver?: React.PointerEventHandler<HTMLButtonElement>,
    pointerUp?: React.PointerEventHandler<HTMLButtonElement>,

    touchStart?: React.TouchEventHandler<HTMLButtonElement>,
    touchEnd?: React.TouchEventHandler<HTMLButtonElement>,
    touchMove?: React.TouchEventHandler<HTMLButtonElement>,
    touchCancel?: React.TouchEventHandler<HTMLButtonElement>,
};

export type ArrowButtonDirection = "left" | "right" | "up" | "down";