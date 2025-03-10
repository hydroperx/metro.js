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
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // States
    const [value, setValue] = useState<boolean>(!!options.default);

    const serializedStyles = css `
        background: none;
        border: 0.15rem solid  ${theme.colors.inputBorder};
        display: flex;
        flex-direction: row;
        padding: 0.3rem;
        width: 5rem;
        outline: none;

        &:hover:not(:disabled), &:focus:not(:disabled) {
            outline: 1px dotted ${theme.colors.focusDashes};
            outline-offset: 0.3rem;
        }

        &:disabled {
            opacity: 0.5;
        }
    `;
}

export type CheckBoxOptions = {
    id?: string,

    children?: React.ReactNode,
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