import { useContext, useRef, useState, useEffect, Ref } from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import extend from "extend";
import { IconRegistry } from "./Icons";
import { RTLContext } from "../layout/RTL";
import { ThemeContext } from "../theme";
import { fontFamily, fontSize } from "../utils/vars";
import * as RFConvert from "../utils/RFConvert";

const TextArea = styled.textarea<{
  $css: string;
}>`
  ${($) => $.$css}
`;

const Input = styled.input<{
  $css: string;
}>`
  ${($) => $.$css}
`;

export function TextInput(options: TextInputOptions) {
  // Use the theme context
  const theme = useContext(ThemeContext);

  // Locale direction
  const localeDir = useContext(RTLContext);

  // Icon
  const icon: string | null =
    options.icon ?? (options.search ? "search" : null);
  const iconSize = 15;

  // Colors
  const dark = Color(theme.colors.inputBackground).isDark();

  // CSS
  const css = `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid  ${theme.colors.inputBorder};
        color: ${theme.colors.foreground};
        font-family: ${fontFamily};
        font-size: ${fontSize};
        padding: ${RFConvert.points.cascadingRF(6.45)} 0.7rem;
        ${icon === null || options.multiline ? "" : `${localeDir == "ltr" ? "padding-right" : "padding-left"}: ${RFConvert.points.cascadingRF(iconSize + 3)};`}
        ${icon === null || options.multiline ? "" : `background-image: url("${IconRegistry.get(icon, dark ? "white" : "black")}");`}
        background-position: center ${localeDir == "ltr" ? "right" : "left"} 0.5rem;
        background-size: ${RFConvert.points.cascadingRF(iconSize)};
        background-repeat: no-repeat;
        text-align: ${localeDir == "ltr" ? "left" : "right"};
        ${options.minWidth !== undefined ? "min-width: " + RFConvert.points.cascadingRF(options.minWidth) + ";" : "min-width: 5rem;"}
        ${options.minHeight !== undefined ? "min-height: " + RFConvert.points.cascadingRF(options.minHeight) + ";" : ""}
        ${options.maxWidth !== undefined ? "max-width: " + RFConvert.points.cascadingRF(options.maxWidth) + ";" : ""}
        ${options.maxHeight !== undefined ? "max-height: " + RFConvert.points.cascadingRF(options.maxHeight) + ";" : ""}
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
            width: ${RFConvert.points.cascadingRF(15)};
            height: ${RFConvert.points.cascadingRF(15)};
            background: url("${IconRegistry.get("clear", dark ? "white" : "black")}");
            background-size: ${RFConvert.points.cascadingRF(15)};
            background-repeat: no-repeat;
        }
    `;

  return options.multiline ? (
    <TextArea
      id={options.id}
      className={options.className}
      $css={css}
      style={options.style}
      ref={options.ref as Ref<HTMLTextAreaElement>}
      placeholder={options.placeholder}
      onChange={(event) => {
        options.change?.((event.target as HTMLTextAreaElement).value, event);
      }}
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
      dir={localeDir == "ltr" ? "ltr" : "rtl"}
    >
      {options.default}
    </TextArea>
  ) : (
    <Input
      id={options.id}
      className={options.className}
      $css={css}
      style={options.style}
      ref={options.ref as Ref<HTMLInputElement>}
      type={
        options.email
          ? "email"
          : options.password
            ? "password"
            : options.number
              ? "number"
              : options.search
                ? "search"
                : options.telephone
                  ? "telephone"
                  : "text"
      }
      placeholder={options.placeholder}
      value={options.default}
      onChange={(event) => {
        options.change?.((event.target as HTMLInputElement).value, event);
      }}
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
      dir={localeDir == "ltr" ? "ltr" : "rtl"}
    />
  );
}

export type TextInputOptions = {
  id?: string;

  /**
   * Placeholder text.
   */
  placeholder?: string;

  /**
   * Default value.
   */
  default?: string;

  /**
   * Indicates whether the input is an e-mail field.
   */
  email?: boolean;

  /**
   * Indicates whether the input is a password field.
   */
  password?: boolean;

  /**
   * Indicates whether the input is a number field.
   */
  number?: boolean;

  /**
   * Indicates whether the input is a search field.
   */
  search?: boolean;

  /**
   * Indicates whether the input is a telephone field.
   */
  telephone?: boolean;

  /**
   * Icon (only effects if input is a single line).
   * If the `search` option is true, then the default icon
   * is the search icon.
   */
  icon?: string;

  /**
   * Whether disabled or not.
   */
  disabled?: boolean;

  /**
   * Whether the input is multiline or not.
   */
  multiline?: boolean;

  /**
   * Whether the input has automatic focus or not.
   */
  autoFocus?: boolean;

  /**
   * [See MDN reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete).
   */
  autoComplete?: string;

  /**
   * For multiline inputs, indicates the number of rows.
   */
  rows?: number;

  /**
   * For multiline inputs, indicates the number of columns.
   */
  columns?: number;

  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  style?: React.CSSProperties;
  className?: string;
  ref?: Ref<HTMLTextAreaElement | HTMLInputElement | null>;

  /**
   * Change event.
   */
  change?: (value: string, event: React.ChangeEvent<HTMLElement>) => void;

  scroll?: React.UIEventHandler<HTMLElement>;
  focus?: React.FocusEventHandler<HTMLElement>;
  click?: React.MouseEventHandler<HTMLElement>;
  contextMenu?: React.MouseEventHandler<HTMLElement>;
  mouseOver?: React.MouseEventHandler<HTMLElement>;
  mouseOut?: React.MouseEventHandler<HTMLElement>;
  mouseUp?: React.MouseEventHandler<HTMLElement>;
  wheel?: React.WheelEventHandler<HTMLElement>;
};
