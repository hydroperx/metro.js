import React, { useContext, useRef, useState, useEffect } from "react";
import { css, SerializedStyles } from "@emotion/react";
import Color from "color";
import $ from "jquery";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryColorsContext } from "../theme";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, enhanceBrightness, contrast } from "../utils/color";

export function CheckBox(options: CheckBoxOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Determine which coloring is preferred
    const preferPrimaryColors = useContext(PreferPrimaryColorsContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Refs
    const button_ref = useRef<HTMLButtonElement | null>(null);
    const unchecked_div_ref = useRef<HTMLDivElement | null>(null);
    const checked_div_ref = useRef<HTMLDivElement | null>(null);
    const carret_ref = useRef<HTMLDivElement | null>();

    // States
    const [value, setValue] = useState<boolean>(!!options.default);
    const [checked_horizontal_pos, set_checked_horizontal_pos] = useState<number>(0); // percent
    const [carret_left, set_carret_left] = useState<number>(0); // percent

    // Misc.
    const border_width = 0.15;
    const padding = 0.15;
    const side_length = border_width + padding;
    const w = pointsToRemValue(12);
    const h = pointsToRemValue(4);
    const carret_w = pointsToRemValue(2);
    const checked_color = enhanceBrightness(theme.colors.background, theme.colors.primaryBackground);
    const checked_hover_color = lighten(checked_color, 0.3);
    const border_color = preferPrimaryColors ? checked_color : contrast(theme.colors.background, 0.4);
    const unchecked_color = preferPrimaryColors ? lighten(checked_color, 0.3) : border_color;
    const unchecked_hover_color = lighten(unchecked_color, 0.3);

    // CSS
    const serializedStyles = css `
        background: none;
        border: ${border_width}rem solid  ${border_color};
        display: flex;
        flex-direction: row;
        padding: ${padding}rem;
        width: ${w}rem;
        height: ${h}rem;
        outline: none;
        position: absolute;

        &:hover:not(:disabled), &:focus:not(:disabled) {
            outline: 0.05rem dotted ${theme.colors.focusDashes};
            outline-offset: 0.3rem;
        }

        &:disabled {
            opacity: 0.5;
        }

        & .CheckBox-unchecked-rect {
            background: ${unchecked_color};
            width: 100%;
            height: 100%;
        }

        &:hover .CheckBox-unchecked-rect {
            background: ${unchecked_hover_color};
        }

        & .CheckBox-checked-rect {
            position: relative;
            background: ${checked_color};
            height: 100%;
        }

        &:hover .CheckBox-checked-rect {
            background: ${checked_hover_color};
        }
        
        &: .CheckBox-carret {
            position: relative;
            width: ${carret_w}rem;
            height: ${h + side_length * 2}rem;
            background: ${theme.colors.foreground};
        }
    `;

    useEffect(() => {
        const button = button_ref.current!;

        // pass element
        options.element?.(button);
    });

    // Handle click
    function button_onClick()
    {
        // Set new value
        setValue(!value);
    }

    return (
        <button
            ref={button_ref}
            id={options.id}
            css={serializedStyles}
            data-value={value.toString()}
            disabled={options.disabled}
            style={options.style}
            className={options.className}
            onClick={button_onClick}>

            <div ref={unchecked_div_ref} className="CheckBox-unchecked-rect">
            </div>
            <div
                ref={checked_div_ref}
                className="CheckBox-checked-rect"
                style={{
                    [localeDir == "ltr" ? "right" : "left"]: checked_horizontal_pos + "%",
                }}>
            </div>
            <div
                ref={carret_ref}
                className="CheckBox-carret"
                style={{
                    left: carret_left + "%",
                }}>
            </div>
        </button>
    );
}

export type CheckBoxOptions = {
    id?: string,

    style?: React.CSSProperties,
    className?: string,

    /**
     * Default value.
     */
    default?: boolean,

    /**
     * Whether input is disabled.
     */
    disabled?: boolean,

    /**
     * Event triggered on value change.
     */
    change?: (value: boolean) => void,

    element?: (element: HTMLButtonElement) => void,
};