import { useContext, useRef, useState, useEffect, Ref } from "react";
import { styled } from "styled-components";
import Color from "color";
import extend from "extend";
import { getIcon } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext } from "../theme";
import { fontFamily, fontSize } from "../utils/common";
import { pointsToRem } from "../utils/points";

const TextArea = styled.textarea<{
    $css: string,
}> `${$ => $.$css}`;

const Input = styled.input<{
    $css: string,
}> `${$ => $.$css}`;

export function TextInput(options: TextInputOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Icon
    const icon: string | null = options.icon ?? (options.search ? "search" : null);
    const iconSize = 5;

    // Colors
    const dark = Color(theme.colors.inputBackground).isDark();

    // CSS
    const css = `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid  ${theme.colors.inputBorder};
        color: ${theme.colors.foreground};
        font-family: ${fontFamily};
        font-size: ${fontSize};
        padding: ${pointsToRem(2.15)} 0.7rem;
        ${icon === null || options.multiline ? "" : `${localeDir == "ltr" ? "padding-right" : "padding-left"}: ${pointsToRem(iconSize + 3)};`}
        ${icon === null || options.multiline ? "" : `background-image: url("${getIcon(icon, dark ? "white" : "black")}");`}
        background-position: center ${ localeDir == "ltr" ? "right" : "left" } 0.5rem;
        background-size: ${pointsToRem(iconSize)};
        background-repeat: no-repeat;
        text-align: ${localeDir == "ltr" ? "left" : "right"};
        ${ options.minWidth !== undefined ? "min-width: " + pointsToRem(options.minWidth) + ";" : "min-width: 5rem;" }
        ${ options.minHeight !== undefined ? "min-height: " + pointsToRem(options.minHeight) + ";" : "" }
        ${ options.maxWidth !== undefined ? "max-width: " + pointsToRem(options.maxWidth) + ";" : "" }
        ${ options.maxHeight !== undefined ? "max-height: " + pointsToRem(options.maxHeight) + ";" : "" }
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

    return (
        options.multiline ?
            <TextArea
                id={options.id}
                className={options.className}
                $css={css}
                style={options.style}
                ref={options.ref as Ref<HTMLTextAreaElement>}
                placeholder={options.placeholder}
                onChange={event => { options.change?.((event.target as HTMLTextAreaElement).value, event) }}
                onScroll={options.scroll}
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={options.mouseOver}
                onMouseOut={options.mouseOut}
                onMouseUp={options.mouseUp}
                onContextMenu={options.contextMenu}
                onWheel={options.wheel}
                autoFocus={options.autoFocus}
                disabled={options.disabled}
                autoComplete={options.autoComplete}
                rows={options.rows}
                cols={options.columns}
                dir={localeDir == "ltr" ? "ltr" : "rtl"}>

                {options.default}
            </TextArea> :
            <Input
                id={options.id}
                className={options.className}
                $css={css}
                style={options.style}
                ref={options.ref as Ref<HTMLInputElement>}
                type={
                    options.email ? "email" :
                    options.password ? "password" :
                    options.number ? "number" :
                    options.search ? "search" :
                    options.telephone ? "telephone" : "text"}
                placeholder={options.placeholder}
                value={options.default}
                onChange={event => { options.change?.((event.target as HTMLInputElement).value, event) }}
                onScroll={options.scroll}
                onFocus={options.focus}
                onClick={options.click}
                onMouseOver={options.mouseOver}
                onMouseOut={options.mouseOut}
                onMouseUp={options.mouseUp}
                onContextMenu={options.contextMenu}
                onWheel={options.wheel}
                autoFocus={options.autoFocus}
                disabled={options.disabled}
                autoComplete={options.autoComplete}
                dir={localeDir == "ltr" ? "ltr" : "rtl"}/>
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
    ref?: Ref<HTMLTextAreaElement | HTMLInputElement | null>,

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
    wheel?: React.WheelEventHandler<HTMLElement>,
};