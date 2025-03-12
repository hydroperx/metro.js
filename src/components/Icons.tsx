// Icon resources
import bullet_black from "../icons/bullet-black.svg";
import bullet_white from "../icons/bullet-white.svg";
import checked_black from "../icons/checked-black.svg";
import checked_white from "../icons/checked-white.svg";
import arrow_white from "../icons/arrow-white.svg";
import arrow_black from "../icons/arrow-black.svg";
import arrow_button_black from "../icons/arrow-button-black.svg";
import arrow_button_hover_black from "../icons/arrow-button-hover-black.svg";
import arrow_button_pressed_black from "../icons/arrow-button-pressed-black.svg";
import arrow_button_white from "../icons/arrow-button-white.svg";
import arrow_button_hover_white from "../icons/arrow-button-hover-white.svg";
import arrow_button_pressed_white from "../icons/arrow-button-pressed-white.svg";
import search_black from "../icons/search-black.svg";
import search_white from "../icons/search-white.svg";
import clear_black from "../icons/clear-black.svg";
import clear_white from "../icons/clear-white.svg";

import { ColorObserver } from "@hydroper/colorobserver";
import React, { useEffect, useRef, useState, useContext } from "react";
import Color from "color";
import { css, SerializedStyles, keyframes } from "@emotion/react";
import extend from "extend";
import assert from "assert";
import { pointsToRem } from "../utils/points";
import { RemObserver } from "../utils/RemObserver";

export type IconOptions = {
    type?: string,
    size?: number,
    style?: React.CSSProperties,
    className?: string,
};

const iconMap = new Map<string, {black: any, white: any}>([
    ["bullet", { black: bullet_black, white: bullet_white }],
    ["checked", { black: checked_black, white: checked_white }],
    ["arrow", { black: arrow_black, white: arrow_white }],
    ["arrowButton", { black: arrow_button_black, white: arrow_button_white }],
    ["arrowButtonHover", { black: arrow_button_hover_black, white: arrow_button_hover_white }],
    ["arrowButtonPressed", { black: arrow_button_pressed_black, white: arrow_button_pressed_white }],
    ["search", { black: search_black, white: search_white }],
    ["clear", { black: clear_black, white: clear_white }],
]);

export function registerIcon(type: string, sources: { black: any, white: any }): void
{
    iconMap.set(type, sources);
}

export function Icon(options: IconOptions)
{
    // IMG ref
    const ref = useRef(null);

    // Icon color
    const [color, setColor] = useState<string>("white");

    // Icon type
    assert(options.type, "Icon type must be specified.");
    const type = options.type;

    // Compute size
    const computed_size = options.size !== undefined ? pointsToRem(options.size) : "100%";

    const serializedStyles = css `
        width: ${computed_size};
        height: ${computed_size};
        height: 100%;
        vertical-align: middle;
    `;

    // Adjust color
    useEffect(() => {
        const colorObserver = new ColorObserver(ref.current, (color: Color) => {
            setColor(color.isLight() ? "white" : "black");
        });

        return () => {
            colorObserver.cleanup();
        };
    });

    const m = iconMap.get(type);
    assert(m !== undefined, "Icon is not defined: " + type);
    return (
        <img css={serializedStyles} ref={ref} src={m[color]} draggable={false} alt={type} style={options.style} className={options.className}></img>
    );
}

/**
 * Gets the source of an icon.
 */
export function getIcon(type: string, color: "white" | "black")
{
    const m = iconMap.get(type);
    assert(m !== undefined, "Icon is not defined: " + type);
    return m[color];
}

export function CheckedIcon(options: IconOptions)
{
    return <Icon type="checked" size={options.size} style={options.style} className={options.className}/>;
}

export function BulletIcon(options: IconOptions)
{
    return <Icon type="bullet" size={options.size} style={options.style} className={options.className}/>;
}

export function ClearIcon(options: IconOptions)
{
    return <Icon type="clear" size={options.size} style={options.style} className={options.className}/>;
}

export function SearchIcon(options: IconOptions)
{
    return <Icon type="search" size={options.size} style={options.style} className={options.className}/>;
}

export type ArrowIconOptions = {
    direction?: ArrowIconDirection,
    size?: number,
    style?: React.CSSProperties,
    className?: string,
};

export type ArrowIconDirection = "left" | "right" | "up" | "down";

export function ArrowIcon(options: ArrowIconOptions)
{
    // Direction
    const d = options.direction;

    // Stylize
    const newStyle: React.CSSProperties = {};
    newStyle.transform = `rotate(${d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}deg)`;
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    return <Icon type="arrow" size={options.size} style={newStyle} className={options.className}/>;
}

export function UpArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="up" size={options.size} style={options.style} className={options.className}/>;
}

export function DownArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="down" size={options.size} style={options.style} className={options.className}/>;
}

export function LeftArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="left" size={options.size} style={options.style} className={options.className}/>;
}

export function RightArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="right" size={options.size} style={options.style} className={options.className}/>;
}

export function ProgressRing(options: ProgressRingOptions)
{
    // Some of the implementation uses code from
    // https://stackoverflow.com/a/20371835/26380963

    // Div ref
    const ref = useRef(null);

    // States
    const [color, setColor] = useState<string>("#fff");
    const [rem, setRem] = useState<number>(0);
    const [serializedStyles, setSerializedStyles] = useState<SerializedStyles>(null);

    // Set style
    const newStyle: React.CSSProperties = {};
    newStyle.verticalAlign = "middle";
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    // Adjust color
    useEffect(() => {
        const colorObserver = new ColorObserver(ref.current, (color: Color) => {
            setColor(color.isLight() ? "#fff" : "#000");
        });

        return () => {
            colorObserver.cleanup();
        };
    });

    // Adjust size
    useEffect(() => {
        const remObserver = new RemObserver(rem => {
            setRem(rem);
        });
        return () => {
            remObserver.cleanup();
        };
    });

    // Animation time in milliseconds
    let time = 4000;

    // Other animation parameters
    let r = -14; // degrees
    let m = 30; // milliseconds

    // Animation
    const orbit = keyframes `
        0% {
            transform: rotate(225deg);
            opacity: 1;
            animation-timing-function: ease-out;
        } 

        7% {
            transform: rotate(345deg);
            animation-timing-function: linear;
        }

        35% {
            transform: rotate(495deg);
            animation-timing-function: ease-in-out;
        }

        42% {
            transform: rotate(690deg);
            animation-timing-function: linear;
        }

        70% {
            transform: rotate(835deg); opacity: 1; 
            animation-timing-function: linear;
        }

        76% {
            opacity: 1;
        }

        77% {
            transform: rotate(955deg);
            animation-timing-function: ease-in;
        }

        78% { transform: rotate(955deg); opacity: 0; }
        100% { transform: rotate(955deg); opacity: 0; } 
    `;

    // Size
    const size = options.size ?? 9;

    // Build class name
    useEffect(() => {
        setSerializedStyles(css `
            position: relative;
            padding-top: ${(size * 0.25 * rem) /5}px;
            width: ${size * 0.25 * rem}px;
            height: ${size * 0.25 * rem}px;

            & .progress-ring__wrap {
                position: absolute;
                width: ${(size * 0.25 * rem ) - 2}px;
                height: ${(size * 0.25 * rem ) - 2}px;
            }

            & .progress-ring__circle {
                transform: rotate(225deg);
                animation-iteration-count: infinite;
                animation-name: ${orbit};
                animation-duration: ${time}ms;
                width: ${(size * 0.25 * rem) - 2}px;
                height: ${(size * 0.25 * rem) - 2}px;

                opacity: 0;
            }

            & .progress-ring__circle:after {
                content: '';
                position: absolute;
                width: ${(size * 0.25 * rem) / 8}px;
                height: ${(size * 0.25 * rem) / 8}px;
                border-radius: ${(size * 0.25 * rem) / 8}px;
                box-shadow: 0px 0px 5% ${color};
                background: ${color};
            }

            & .progress-ring__wrap:nth-of-type(2) {
                transform: rotate(${r}deg);
            }
            & .progress-ring__wrap:nth-of-type(2) .progress-ring__circle { animation-delay: ${time / m}ms; }
            & .progress-ring__wrap:nth-of-type(3) {
                transform: rotate(${r * 2}deg);
            }
            & .progress-ring__wrap:nth-of-type(3) .progress-ring__circle { animation-delay: ${time / m*2}ms; }
            & .progress-ring__wrap:nth-of-type(4) {
                transform: rotate(${r * 3}deg);
            }
            & .progress-ring__wrap:nth-of-type(4) .progress-ring__circle {    animation-delay: ${time / m*3}ms; }
            & .progress-ring__wrap:nth-of-type(5) {
                transform: rotate(${r * 4}deg);
            }
            & .progress-ring__wrap:nth-of-type(5) .progress-ring__circle {    animation-delay: ${time / m*4}ms; }
        `);
    }, [color, rem]);

    return (
        <div ref={ref} style={newStyle} css={serializedStyles} className={options.className}>
            <div className='progress-ring__wrap'>
                <div className='progress-ring__circle'></div>
            </div>
            <div className='progress-ring__wrap'>
                <div className='progress-ring__circle'></div>
            </div>
            <div className='progress-ring__wrap'>
                <div className='progress-ring__circle'></div>
            </div>
            <div className='progress-ring__wrap'>
                <div className='progress-ring__circle'></div>
            </div>
            <div className='progress-ring__wrap'>
                <div className='progress-ring__circle'></div>
            </div>
        </div>
    );
}

export type ProgressRingOptions = {
    size?: number,
    style?: React.CSSProperties,
    className?: string,
};