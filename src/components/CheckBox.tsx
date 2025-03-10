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

    // States
    const [value, setValue] = useState<boolean>(!!options.default);

    // Misc.
    const border_width = 0.15;
    const padding = 0.15;
    const s = border_width + padding;
    const w = 4;
    const checked_color = enhanceBrightness(theme.colors.background, theme.colors.primaryBackground);
    const border_color = preferPrimaryColors ? checked_color : contrast(theme.colors.background, 0.4);
    const unchecked_color = preferPrimaryColors ? lighten(checked_color, 0.3) : border_color;

    // CSS
    const serializedStyles = css `
        background: none;
        border: ${border_width}rem solid  ${border_color};
        display: flex;
        flex-direction: row;
        padding: ${padding}rem;
        width: ${w}rem;
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

        & .CheckBox-checked-rect {
            position: relative;
            background: ${checked_color};
            height: 100%;
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
            <div ref={checked_div_ref} className="CheckBox-checked-rect">
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