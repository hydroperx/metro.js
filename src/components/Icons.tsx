import { ColorObserver } from "@hydroper/colorobserver";
import React, { useEffect, useRef, useState, useContext } from "react";
import Color from "color";
import { css } from "@emotion/css";
import extend from "extend";
import { pointsToRem } from "../utils/points";
import { ThemeContext } from "../theme";

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

export type IconOptions = {
    type?: IconType,
    size?: number,
    style?: React.CSSProperties,
};

export type IconType =
    | "bullet" | "checked"
    | "arrow" | "arrowButton" | "arrowButtonHover" | "arrowButtonPressed";

const iconMap = new Map<IconType, {black: any, white: any}>([
    ["bullet", { black: bullet_black, white: bullet_white }],
    ["checked", { black: checked_black, white: checked_white }],
    ["arrow", { black: arrow_black, white: arrow_white }],
    ["arrowButton", { black: arrow_button_black, white: arrow_button_white }],
    ["arrowButtonHover", { black: arrow_button_hover_black, white: arrow_button_hover_white }],
    ["arrowButtonPressed", { black: arrow_button_pressed_black, white: arrow_button_pressed_white }],
]);

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
    }, [color]);
    
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