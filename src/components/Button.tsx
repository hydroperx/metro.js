import extend from "extend";
import { styled } from "styled-components";
import React, { Ref, useContext, useRef, useState, useEffect } from "react";
import Color from "color";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { fontFamily, fontSize, maximumZIndex } from "../utils/common";
import { lighten, darken, enhanceBrightness } from "../utils/color";
import { computePosition } from "../utils/placement";
import { DownArrowIcon, Icon } from "./Icons";
import { Theme, ThemeContext } from "../theme";
import { LocaleDirectionContext } from "../layout";

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

export function Button(options: ButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext!);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext!);

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
    let Button_comp = null;
    
    const padding = "0.6rem 1rem";
    let color: Color | string = "",
        bg = "",
        hover_bg = "",
        hover_color = "",
        pressed_color = "";

    switch (options.variant ?? "secondary")
    {
        case "none":
        {
            const dark = Color(theme.colors.background).isDark();
            color = dark ? "#fff" : "#000";
            hover_bg = dark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)";

            Button_comp = NoneButton;
            break;
        }
        case "small-dropdown":
        case "small-dropdown-primary":
        {
            color = options.variant == "small-dropdown-primary" ? Color(enhanceBrightness(theme.colors.background, theme.colors.primary)).alpha(0.67) : Color(theme.colors.foreground).alpha(0.67);

            Button_comp = SmallDropdownButton;
            break;
        }
        case "anchor":
        {
            color = theme.colors.anchor ?? "#000";
            hover_color = lighten(color, 0.3).toString();

            Button_comp = AnchorButton;
            break;
        }
        case "secondary":
        {
            hover_bg = lighten(theme.colors.secondary, 0.5);
            Button_comp = SecondaryButton;
            break;
        }
        case "primary":
        {
            hover_bg = lighten(theme.colors.primary, 0.5);
            Button_comp = PrimaryButton;
            break;
        }
        case "danger":
        {
            hover_bg = lighten(theme.colors.danger, 0.5);
            Button_comp = DangerButton;
            break;
        }
        case "outline":
        {
            const dark = Color(theme.colors.background).isDark();
            color = dark ? "#fff" : "#000";
            hover_bg = dark ? lighten(theme.colors.background, 0.4).toString() : darken(theme.colors.background, 0.3).toString();
            pressed_color = dark ? "#000" : "#fff";

            Button_comp = OutlineButton;
            break;
        }
        case "outline-primary":
        {
            const dark = Color(theme.colors.background).isDark();
            color = dark ? "#fff" : "#000";
            bg = dark ? lighten(theme.colors.background, 0.5).toString() : darken(theme.colors.background, 0.3).toString();
            hover_bg = dark ? lighten(theme.colors.background, 0.7).toString() : darken(theme.colors.background, 0.5).toString();
            pressed_color = dark ? "#000" : "#fff";

            Button_comp = OutlinePrimaryButton;
            break;
        }
    }

    const tooltip = options.tooltip;
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const tooltipElement: Ref<HTMLDivElement | null> = useRef(null);
    let tooltipTimeout = -1;

    // Display tooltip
    const userMouseOver = options.mouseOver;
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            const button = e.currentTarget as HTMLButtonElement;
            tooltipTimeout = window.setTimeout(() => {
                if (button.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(button, tooltipElement.current, {
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

    const Button = Button_comp!;

    return (
        <>
            <Button
                ref={options.ref}
                className={options.className}
                style={newStyle}
                type={options.type ?? "button"}
                disabled={options.disabled ?? false}
                autoFocus={options.autoFocus ?? false}
                data-chosen={!!options.chosen}

                $color={color}
                $padding={padding}
                $bg={bg}
                $hover_bg={hover_bg}
                $hover_color={hover_color}
                $pressed_color={pressed_color}
                $theme={theme}
                $localeDir={localeDir}

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
                                <DownArrowIcon size={2.4}/>
                            </div>
                        </>:
                        options.children
                }
            </Button>
            {tooltip === undefined ?
                undefined :
                <TooltipDiv
                    ref={tooltipElement}
                    $theme={theme}
                    $tooltipVisible={tooltipVisible}
                    $tooltipX={tooltipX}
                    $tooltipY={tooltipY}>
            
                    {tooltip}
                </TooltipDiv>
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
    ref?: React.Ref<HTMLButtonElement | null>,

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

type ButtonCSSProps = {
    $color: Color | string,
    $padding: string,
    $bg: string,
    $hover_bg: string,
    $hover_color: string,
    $pressed_color: string,
    $theme: Theme,
    $localeDir: "ltr" | "rtl",
};

// none

const NoneButton = styled.button<ButtonCSSProps> `
    background: none;
    color: ${$ => $.$color as string};
    padding: ${$ => $.$padding};
    border: none;
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        background: ${$ => $.$hover_bg};
    }

    &:active:not(:disabled) {
        transform: scale(0.97);
    }

    &[data-chosen="true"]:not(:disabled) {
        background: ${$ => $.$theme.colors.primary};
        color: ${$ => $.$theme.colors.primaryForeground};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$color as string};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

// small dropdown

const SmallDropdownButton = styled.button<ButtonCSSProps> `
    background: none;
    border: none;
    color: ${$ => $.$color.toString()};
    font-family: ${fontFamily};
    font-size: 0.75rem;
    display: flex;
    gap: 0.2rem;
    flex-direction: ${$ => $.$localeDir == "ltr" ? "row" : "row-reverse"};
    align-items: center;
    padding: ${pointsToRemValue(1)}rem 0.7rem;
    outline: none;

    &:hover:not(:disabled), &:focus:not(:disabled) {
        color: ${$ => ($.$color as Color).alpha(0.8).toString()};
    }

    &:active:not(:disabled) {
        color: ${$ => ($.$color as Color).alpha(1).toString()};
    }

    &:disabled {
        opacity: 0.4;
    }

    & .Button-small-inner {
        display: inline-flex;
        flex-direction: ${$ => $.$localeDir == "ltr" ? "row" : "row-reverse"};
        gap: 0.9rem;
    }

    & .Button-small-arrow {
        display: inline-flex;
        flex-grow: 2;
        flex-direction: ${$ => $.$localeDir == "ltr" ? "row-reverse" : "row"};
        opacity: 0.7;
    }
`;

// anchor

const AnchorButton = styled.button<ButtonCSSProps> `
    background: none;
    color: ${$ => ($.$color as string)};
    padding: ${$ => $.$padding};
    border: none;
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        color: ${$ => $.$hover_color};
    }

    &:active:not(:disabled) {
        color: ${$ => $.$hover_color};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$theme.colors.focusDashes};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

// secondary

const SecondaryButton = styled.button<ButtonCSSProps> `
    background: ${$ => $.$theme.colors.secondary};
    color: ${$ => $.$theme.colors.foreground};
    padding: ${$ => $.$padding};
    border: none;
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        background: ${$ => $.$hover_bg};
    }

    &:active:not(:disabled) {
        background: ${$ => $.$theme.colors.pressed};
        color: ${$ => $.$theme.colors.pressedForeground};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$theme.colors.focusDashes};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

// primary

const PrimaryButton = styled.button<ButtonCSSProps> `
    background: ${$ => $.$theme.colors.primary};
    color: ${$ => $.$theme.colors.primaryForeground};
    padding: ${$ => $.$padding};
    border: none;
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        background: ${$ => $.$hover_bg};
    }

    &:active:not(:disabled) {
        background: ${$ => $.$theme.colors.pressed};
        color: ${$ => $.$theme.colors.pressedForeground};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$theme.colors.focusDashes};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

// danger

const DangerButton = styled.button<ButtonCSSProps> `
    background: ${$ => $.$theme.colors.danger};
    color: ${$ => $.$theme.colors.dangerForeground};
    padding: ${$ => $.$padding};
    border: none;
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        background: ${$ => $.$hover_bg};
    }

    &:active:not(:disabled) {
        background: ${$ => $.$theme.colors.pressed};
        color: ${$ => $.$theme.colors.pressedForeground};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$theme.colors.focusDashes};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

// outline

const OutlineButton = styled.button<ButtonCSSProps> `
    background: none;
    color: ${$ => ($.$color as string)};
    padding: ${$ => $.$padding};
    border: 0.15rem solid ${$ => ($.$color as string)};
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        background: ${$ => $.$hover_bg};
    }

    &:active:not(:disabled) {
        background: ${$ => $.$color as string};
        color: ${$ => $.$pressed_color};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$color as string};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

// outline primary

const OutlinePrimaryButton = styled.button<ButtonCSSProps> `
    background: ${$ => $.$bg};
    color: ${$ => $.$color as string};
    padding: ${$ => $.$padding};
    border: 0.15rem solid ${$ => $.$color as string};
    border-radius: 0;
    font-size: ${fontSize};
    font-family: ${fontFamily};

    &:hover:not(:disabled) {
        background: ${$ => $.$hover_bg};
    }

    &:active:not(:disabled) {
        background: ${$ => $.$color as string};
        color: ${$ => $.$pressed_color};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$color as string};
        outline-offset: -0.4rem;
    }

    &:disabled {
        opacity: 0.6;
    }
`;

/**
 * Represents a circle bordered icon button.
 */
export function CircleIconButton(options: CircleIconButtonOptions)
{
    // Take the theme context
    const theme = useContext(ThemeContext!);

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

    const tooltip = options.tooltip;
    const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [tooltipY, setTooltipY] = useState<number>(0);
    const tooltipElement: Ref<HTMLDivElement | null> = useRef(null);
    let tooltipTimeout = -1;

    // Display tooltip
    const userMouseOver = options.mouseOver;
    const mouseOver = (e: MouseEvent): any => {
        if (tooltipElement.current)
        {
            const button = e.currentTarget as HTMLButtonElement;
            tooltipTimeout = window.setTimeout(() => {
                if (button.matches(":hover"))
                {
                    setTooltipVisible(true);
                }
            }, 700);

            // Adjust tooltip position
            const [x, y] = computePosition(button, tooltipElement.current, {
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
            <CircleIconButtonButton
                ref={options.ref}
                className={options.className}
                disabled={options.disabled}
                autoFocus={options.autoFocus}
                style={options.style}

                $normal_color={normal_color}
                $hover_color={hover_color}
                $active_color={active_color}
                $fg={fg}
                $theme={theme}
                $filled={!!options.filled}
                $size_rem={size_rem}
                
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

                <Icon type={options.icon} size={size - (size <= 3.5 ? 0 : 3.5)} style={iconStyle}/>
            </CircleIconButtonButton>

            {tooltip === undefined ?
                undefined :
                <TooltipDiv
                    ref={tooltipElement}
                    $theme={theme}
                    $tooltipVisible={tooltipVisible}
                    $tooltipX={tooltipX}
                    $tooltipY={tooltipY}>
            
                    {tooltip}
                </TooltipDiv>
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
    ref?: React.Ref<HTMLButtonElement | null>,

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

const CircleIconButtonButton = styled.button<{
    $normal_color: string,
    $hover_color: string,
    $active_color: string,
    $fg: string,
    $theme: Theme,
    $filled: boolean,
    $size_rem: string,
}> `
    border: 0.17rem solid ${$ => $.$fg};
    border-radius: 100%;
    outline: none;
    color: ${$ => $.$normal_color};
    ${$ => $.$filled ? `background: ${$.$fg};` : "background: none;"}
    width: ${$ => $.$size_rem};
    height: ${$ => $.$size_rem};
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    &:hover:not(:disabled) {
        color: ${$ => $.$hover_color};
        background: ${$ => Color($.$fg).alpha(0.3).toString()};
    }

    &:focus:not(:disabled) {
        outline: 0.05rem dotted ${$ => $.$theme.colors.focusDashes};
        outline-offset: -0.4rem;
    }

    &:active:not(:disabled) {
        outline: none;
        color: ${$ => $.$active_color};
        ${$ => $.$filled ?
            `background: ${Color($.$fg).alpha(0.5).toString()};` : `background: ${$.$fg};`}
    }

    &:disabled {
        opacity: 0.6;
    }
    `;

/**
 * Represents an arrow button.
 */
export function ArrowButton(options: ArrowButtonOptions)
{
    // Direction
    const d = options.direction;

    return (
        <CircleIconButton
            icon="fullarrow"
            rotation={d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}
            ref={options.ref}
            className={options.className}
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
    ref?: React.Ref<HTMLButtonElement | null>,

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