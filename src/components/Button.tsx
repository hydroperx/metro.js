import { pointsToRem } from "../utils/points";
import extend from "extend";
import { css } from "@emotion/css";
import React, { Ref, useContext, useRef, useState, useEffect } from "react";
import Color from "color";
import { fontSize } from "../utils/commonValues";
import { computePosition } from "../utils/placement";
import { Icon } from "./Icons";
import { ThemeContext } from "../theme";

export function Button(options: ButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext);

    const buttonRef: Ref<HTMLButtonElement> = useRef(null);

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
    
    const padding = "0.6rem 1rem";

    switch (options.variant ?? "secondary")
    {
        case "none":
        {
            const dark = Color(theme.colors.background).isDark();
            const color = dark ? "#fff" : "#000";
            const hoverBg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
            const pressedBg = dark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)";

            className = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    background: ${hoverBg};
                }

                &:active {
                    background: ${pressedBg};
                }

                &:focus {
                    outline: 1px dotted ${color};
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

            className = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    color: ${hoverColor};
                }

                &:active {
                    color: ${hoverColor};
                }

                &:focus {
                    outline: 1px dotted ${theme.colors.focusDashes};
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
            className = css `
                background: ${theme.colors.secondaryBackground};
                color: ${theme.colors.foreground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    background: ${theme.colors.hoveredSecondaryBackground};
                }

                &:active {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus {
                    outline: 1px dotted ${theme.colors.focusDashes};
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
            className = css `
                background: ${theme.colors.primaryBackground};
                color: ${theme.colors.primaryForeground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    background: ${theme.colors.hoveredPrimaryBackground};
                }

                &:active {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus {
                    outline: 1px dotted ${theme.colors.focusDashes};
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
            className = css `
                background: ${theme.colors.dangerBackground};
                color: ${theme.colors.dangerForeground};
                padding: ${padding};
                border: none;
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    background: ${theme.colors.hoveredDangerBackground};
                }

                &:active {
                    background: ${theme.colors.pressedBackground};
                    color: ${theme.colors.pressedForeground};
                }

                &:focus {
                    outline: 1px dotted ${theme.colors.focusDashes};
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
            const hoverBg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";
            const pressedCharColor = dark ? "#000" : "#fff";

            className = css `
                background: none;
                color: ${color};
                padding: ${padding};
                border: 0.15rem solid ${color};
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    background: ${hoverBg};
                }

                &:active {
                    background: ${color};
                    color: ${pressedCharColor};
                }

                &:focus {
                    outline: 1px dotted ${color};
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
            const bg = dark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
            const hoverBg = dark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";
            const pressedCharColor = dark ? "#000" : "#fff";

            className = css `
                background: ${bg};
                color: ${color};
                padding: ${padding};
                border: 0.15rem solid ${color};
                border-radius: 0;
                font-size: ${fontSize};

                &:hover {
                    background: ${hoverBg};
                }

                &:active {
                    background: ${color};
                    color: ${pressedCharColor};
                }

                &:focus {
                    outline: 1px dotted ${color};
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

    return <>
            <button
                ref={buttonRef}
                className={className + (options.className ? " " + options.className : "")}
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={mouseOver as any}
                onMouseOut={mouseOut as any}
                onMouseUp={options.mouseUp}
                onContextMenu={options.contextMenu}
                style={newStyle}
                type={options.type ?? "button"}
                disabled={options.disabled ?? false}
                autoFocus={options.autoFocus ?? false}>

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

    type?: ButtonType,

    disabled?: boolean,

    autoFocus?: boolean,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    visible?: boolean,

    style?: React.CSSProperties,
    className?: string,
    children?: React.ReactNode,

    focus?: React.FocusEventHandler<HTMLButtonElement>,
    click?: React.MouseEventHandler<HTMLButtonElement>,
    contextMenu?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOver?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOut?: React.MouseEventHandler<HTMLButtonElement>,
    mouseUp?: React.MouseEventHandler<HTMLButtonElement>,

    tooltip?: string,
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
    const className = css `
        background: none;
        border: none;
        border-radius: 0;
        outline: none;
        color: ${theme.colors.foreground};

        &:focus {
            outline: 1px dotted ${theme.colors.focusDashes};
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
    }, [type]);

    return (
        <button
            ref={ref}
            className={className + (options.className ? " " + options.className : "")}
            onFocus={options.focus}
            onClick={options.click}
            onMouseOver={options.mouseOver}
            onMouseOut={options.mouseOut}
            onMouseUp={options.mouseUp}
            onContextMenu={options.contextMenu}
            disabled={options.disabled ?? false}
            autoFocus={options.autoFocus ?? false}
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

    contextMenu?: React.MouseEventHandler<HTMLButtonElement>,
    focus?: React.FocusEventHandler<HTMLButtonElement>,
    click?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOver?: React.MouseEventHandler<HTMLButtonElement>,
    mouseOut?: React.MouseEventHandler<HTMLButtonElement>,
    mouseUp?: React.MouseEventHandler<HTMLButtonElement>,
};

export type ArrowButtonDirection = "left" | "right" | "up" | "down";