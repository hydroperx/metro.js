import React, { useContext, useRef, useState, useEffect } from "react";
import { css, SerializedStyles } from "@emotion/react";
import Color from "color";
import $ from "jquery";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { UpArrowIcon, DownArrowIcon } from "./Icons";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { fontFamily, fontSize, maximumZIndex } from "../utils/common";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";
import { RemObserver } from "../utils/RemObserver";

export function CheckBox(options: CheckBoxOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

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

    // CSS
    const serializedStyles = css `
        background: none;
        border: ${border_width}rem solid  ${theme.colors.inputBorder};
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

            <div
                ref={unchecked_div_ref}
                style={{
                    background: "",
                    width: "100%",
                    height: "100%",
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