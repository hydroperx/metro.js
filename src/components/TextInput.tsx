import { TypedEventTarget } from "@hydroper/typedeventtarget";
import { useContext, useRef, useState, useEffect } from "react";
import { css, SerializedStyles } from "@emotion/react";
import Color from "color";
import { Input } from "@hydroper/inputaction";
import extend from "extend";
import { ArrowIcon, BulletIcon, CheckedIcon, getIcon, Icon, IconOptions } from "./Icons";
import { LocaleDirection, LocaleDirectionContext } from "../layout/LocaleDirection";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { fontFamily, fontSize } from "../utils/common";
import { pointsToRem } from "../utils/points";
import { colorDelta } from "../utils/color";

export function TextInput(options: TextInputOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Icon
    const icon: string | null = options.icon ?? (options.search ? "search" : null);
    const iconSize = 5;

    // Refs
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Colors
    const dark = Color(theme.colors.inputBackground).isDark();

    // CSS
    const serializedStyles = css `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid  ${theme.colors.inputBorder};
        color: ${theme.colors.foreground};
        font-family: ${fontFamily};
        font-size: ${fontSize};
        padding: ${pointsToRem(2.15)} 0.7rem;
        ${icon === null || options.multiline ? "" : `padding-right: ${pointsToRem(iconSize + 3)};`}
        ${icon === null || options.multiline ? "" : `background-image: url("${getIcon(icon, dark ? "white" : "black")}");`}
        background-position: center right 0.5rem;
        background-size: ${pointsToRem(iconSize)};
        background-repeat: no-repeat;
        text-align: ${localeDir == "ltr" ? "left" : "right"};
        min-width: 5rem;
        outline: none;
        vertical-align: middle;

        &::placeholder {
            color: ${dark ? Color(theme.colors.foreground).darken(0.4).toString() : Color(theme.colors.foreground).lighten(0.4).toString()};
        }

        &::selection {
            background: ${theme.colors.foreground};
            color: ${theme.colors.inputBackground};
        }

        &:disabled {
            background: ${dark ? Color(theme.colors.inputBackground).lighten(0.7).toString() : Color(theme.colors.inputBackground).darken(0.7).toString()};
            border: 0.15rem solid  ${dark ? Color(theme.colors.inputBorder).lighten(0.7).toString() : Color(theme.colors.inputBorder).darken(0.7).toString()};
        }
    
        &::-webkit-search-cancel-button {
            -webkit-appearance: none;
            width: ${pointsToRem(5)};
            height: ${pointsToRem(5)};
            background: url("${getIcon("clear", dark ? "white" : "black")}");
            background-size: ${pointsToRem(5)};
            background-repeat: no-repeat;
        }
    `;

    // Build style
    const newStyle: React.CSSProperties = {};
    if (options.minWidth !== undefined) newStyle.minWidth = pointsToRem(options.minWidth);
    if (options.maxWidth !== undefined) newStyle.maxWidth = pointsToRem(options.maxWidth);
    if (options.minHeight !== undefined) newStyle.minHeight = pointsToRem(options.minHeight);
    if (options.maxHeight !== undefined) newStyle.maxHeight = pointsToRem(options.maxHeight);
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    return (
        options.multiline ?
            <textarea
                id={options.id}
                css={serializedStyles}
                className={options.className}
                style={newStyle}
                ref={textAreaRef}
                placeholder={options.placeholder}
                onChange={event => { options.change?.(textAreaRef.current.value, event) }}
                onScroll={options.scroll}
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={options.mouseOver}
                onMouseOut={options.mouseOut}
                onMouseUp={options.mouseUp}
                onContextMenu={options.contextMenu}
                autoFocus={options.autoFocus}
                disabled={options.disabled}
                autoComplete={options.autoComplete}
                rows={options.rows}
                cols={options.columns}>

                {options.default}
            </textarea> :
            <input
                id={options.id}
                css={serializedStyles}
                className={options.className}
                style={newStyle}
                ref={inputRef}
                type={
                    options.email ? "email" :
                    options.password ? "password" :
                    options.number ? "number" :
                    options.search ? "search" :
                    options.telephone ? "telephone" : "text"}
                placeholder={options.placeholder}
                value={options.default}
                onChange={event => { options.change?.(inputRef.current.value, event) }}
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
    );
}

export type TextInputOptions = {
    id?: string,

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

    /**
     * For multiline inputs, indicates the number of rows.
     */
    rows?: number,

    /**
     * For multiline inputs, indicates the number of columns.
     */
    columns?: number,

    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number,

    style?: React.CSSProperties,
    className?: string,

    /**
     * Change event.
     */
    change?: (value: string, event: React.ChangeEvent<HTMLElement>) => void,

    scroll?: React.UIEventHandler<HTMLElement>,
    focus?: React.FocusEventHandler<HTMLElement>,
    click?: React.MouseEventHandler<HTMLElement>,
    contextMenu?: React.MouseEventHandler<HTMLElement>,
    mouseOver?: React.MouseEventHandler<HTMLElement>,
    mouseOut?: React.MouseEventHandler<HTMLElement>,
    mouseUp?: React.MouseEventHandler<HTMLElement>,
};