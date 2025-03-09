import { ColorObserver } from "@hydroper/colorobserver";
import React, { useEffect, useRef, useState, useContext } from "react";
import Color from "color";
import { css, SerializedStyles } from "@emotion/react";
import extend from "extend";
import { pointsToRem } from "../utils/points";
import { RemObserver } from "../utils/RemObserver";

// Icon resources
import bullet_black from "./icons/bullet-black.svg";
import bullet_white from "./icons/bullet-white.svg";
import checked_black from "./icons/checked-black.svg";
import checked_white from "./icons/checked-white.svg";
import arrow_white from "./icons/arrow-white.svg";
import arrow_black from "./icons/arrow-black.svg";
import arrow_button_black from "./icons/arrow-button-black.svg";
import arrow_button_hover_black from "./icons/arrow-button-hover-black.svg";
import arrow_button_pressed_black from "./icons/arrow-button-pressed-black.svg";
import arrow_button_white from "./icons/arrow-button-white.svg";
import arrow_button_hover_white from "./icons/arrow-button-hover-white.svg";
import arrow_button_pressed_white from "./icons/arrow-button-pressed-white.svg";
import { keyframes } from "@emotion/react";

export type IconOptions = {
    type?: string,
    size?: number,
    style?: React.CSSProperties,
};

const iconMap = new Map<string, {black: any, white: any}>([
    ["bullet", { black: bullet_black, white: bullet_white }],
    ["checked", { black: checked_black, white: checked_white }],
    ["arrow", { black: arrow_black, white: arrow_white }],
    ["arrowButton", { black: arrow_button_black, white: arrow_button_white }],
    ["arrowButtonHover", { black: arrow_button_hover_black, white: arrow_button_hover_white }],
    ["arrowButtonPressed", { black: arrow_button_pressed_black, white: arrow_button_pressed_white }],
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
    const type = options.type ?? "bullet";

    // Set style
    const newStyle: React.CSSProperties = {};
    newStyle.width = "100%";
    newStyle.height = "100%";
    newStyle.verticalAlign = "middle";
    if (options.size !== undefined)
    {
        newStyle.width = pointsToRem(options.size);
        newStyle.height = newStyle.width;
    }
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    // Adjust color
    useEffect(() => {
        const colorObserver = new ColorObserver(ref.current, (color: Color) => {
            setColor(color.isLight() ? "white" : "black");
        });

        return () => {
            colorObserver.cleanup();
        };
    });
    
    return (
        <img ref={ref} src={iconMap.get(type)[color]} draggable={false} alt={type} style={newStyle}></img>
    );
}

export function CheckedIcon(options: IconOptions)
{
    return <Icon type="checked" size={options.size} style={options.style}/>;
}

export function BulletIcon(options: IconOptions)
{
    return <Icon type="bullet" size={options.size} style={options.style}/>;
}

export type ArrowIconOptions = {
    direction?: ArrowIconDirection,
    size?: number,
    style?: React.CSSProperties,
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

    return <Icon type="arrow" size={options.size} style={newStyle}/>;
}

export function UpArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="up" size={options.size} style={options.style}/>;
}

export function DownArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="down" size={options.size} style={options.style}/>;
}

export function LeftArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="left" size={options.size} style={options.style}/>;
}

export function RightArrowIcon(options: IconOptions)
{
    return <ArrowIcon direction="right" size={options.size} style={options.style}/>;
}

export function LoadingIcon(options: LoadingIconOptions)
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
    newStyle.width = "100%";
    newStyle.height = "100%";
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

    // Build class name
    useEffect(() => {
        setSerializedStyles(css `
            .progress-ring {
                position: relative;
                padding-top: ${(options.size * 0.25 * rem) /5}px;
                width: ${options.size * 0.25 * rem}px;
                height: ${options.size * 0.25 * rem}px;
                margin: auto;
            }

            .progress-ring__wrap {
                position: absolute;
                width: ${(options.size * 0.25 * rem ) - 2}px;
                height: ${(options.size * 0.25 * rem ) - 2}px;
            }

            .progress-ring__circle {
                transform: rotate(225deg);
                animation-iteration-count: infinite;
                animation-name: ${orbit};
                animation-duration: ${time}ms;
                width: ${(options.size * 0.25 * rem) - 2}px;
                height: ${(options.size * 0.25 * rem) - 2}px;

                opacity: 0;
            }

            .progress-ring__circle:after {
                content: '';
                position: absolute;
                width: ${(options.size * 0.25 * rem) / 8}px;
                height: ${(options.size * 0.25 * rem) / 8}px;
                border-radius: ${(options.size * 0.25 * rem) / 8}px;
                box-shadow: 0px 0px 5% ${color};
                background: ${color};
            }

            .progress-ring__wrap:nth-child(2) {
                transform: rotate(${r}deg);
                .progress-ring__circle {    animation-delay: ${time / m}ms; }
            }
            .progress-ring__wrap:nth-child(3) {
                transform: rotate(${r * 2}deg);
                .progress-ring__circle {    animation-delay: ${time / m*2}ms; }
            }
            .progress-ring__wrap:nth-child(4) {
                transform: rotate(${r * 3}deg);
                .progress-ring__circle {    animation-delay: ${time / m*3}ms; }
            }
            .progress-ring__wrap:nth-child(5) {
                transform: rotate(${r * 4}deg);
                .progress-ring__circle {    animation-delay: ${time / m*4}ms; }
            }
        `);
    }, [color, rem]);

    return (
        <div ref={ref} style={newStyle} css={serializedStyles}>
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

export type LoadingIconOptions = {
    size?: number,
    style?: React.CSSProperties,
};