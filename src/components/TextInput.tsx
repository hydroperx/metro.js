import { TypedEventTarget } from "@hydroper/typedeventtarget";
import { useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import Color from "color";
import assert from "assert";
import { Input } from "@hydroper/inputaction";
import $ from "jquery";
import { ArrowIcon, BulletIcon, CheckedIcon, IconOptions } from "./Icons";
import { LocaleDirection, LocaleDirectionContext } from "../layout/LocaleDirection";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { fontFamily, fontSize, maximumZIndex } from "../utils/common";
import { pointsToRem } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";

export function TextInput(options: TextInputOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    return (
        options.multiline ?
            <textarea
                placeholder={options.placeholder}
                onChange={options.change}
                onScroll={options.scroll}
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={options.mouseOver}
                onMouseOut={options.mouseOut}
                onMouseUp={options.mouseUp}
                onContextMenu={options.contextMenu}
                autoFocus={options.autoFocus}
                disabled={options.disabled}
                autoComplete={options.autoComplete}>

                {options.default}
            </textarea> :
            <>
                <input
                    type={
                        options.email ? "email" :
                        options.password ? "password" :
                        options.number ? "number" :
                        options.search ? "search" :
                        options.telephone ? "telephone" : "text"}
                    placeholder={options.placeholder}
                    value={options.default}
                    onChange={options.change}
                    onScroll={options.scroll}
                    onFocus={options.focus}
                    onClick={options.click}
                    onMouseOver={options.mouseOver}
                    onMouseOut={options.mouseOut}
                    onMouseUp={options.mouseUp}
                    onContextMenu={options.contextMenu}
                    autoFocus={options.autoFocus}
                    disabled={options.disabled}
                    autoComplete={options.autoComplete}/>
            </>
    );
}

export type TextInputOptions = {
    /**
     * Placeholder text.
     */
    placeholder?: string,

    /**
     * Default value.
     */
    default?: string,

    /**
     * Indicates whether the input is an e-mail field.
     */
    email?: boolean,

    /**
     * Indicates whether the input is a password field.
     */
    password?: boolean,

    /**
     * Indicates whether the input is a number field.
     */
    number?: boolean,

    /**
     * Indicates whether the input is a search field.
     */
    search?: boolean,

    /**
     * Indicates whether the input is a telephone field.
     */
    telephone?: boolean,

    /**
     * Icon (only effects if input is a single line).
     * If the `search` option is true, then the default icon
     * is the search icon.
     */
    icon?: string,

    /**
     * Whether disabled or not.
     */
    disabled?: boolean,

    /**
     * Whether the input is multiline or not.
     */
    multiline?: boolean,

    /**
     * Whether the input has automatic focus or not.
     */
    autoFocus?: boolean,

    /**
     * [See MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete).
     */
    autoComplete?: string,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    scrollTop?: number,
    scrollLeft?: number,

    style?: React.CSSProperties,
    className?: string,
    children?: React.ReactNode,

    /**
     * Value change event.
     */
    change: React.ChangeEventHandler<HTMLElement>,

    scroll: React.UIEventHandler<HTMLElement>,
    focus?: React.FocusEventHandler<HTMLElement>,
    click?: React.MouseEventHandler<HTMLElement>,
    contextMenu?: React.MouseEventHandler<HTMLElement>,
    mouseOver?: React.MouseEventHandler<HTMLElement>,
    mouseOut?: React.MouseEventHandler<HTMLElement>,
    mouseUp?: React.MouseEventHandler<HTMLElement>,
};