import { createContext } from "react";
import Color from "color";

export type Theme =
{
    colors:
    {
        background: string,
        foreground: string,

        /**
         * Used in components such as text inputs, tooltips and context menu.
         */
        inputBackground: string,

        /**
         * Used in components such as text inputs, tooltips and context menu.
         */
        inputBorder: string,

        anchor: string,

        scrollBarTrack: string,
        scrollBarThumb: string,

        /**
         * Used in buttons for instance.
         */
        primary: string,
        /**
         * Used in buttons for instance.
         */
        primaryForeground: string,

        /**
         * Background used in pressed buttons for instance.
         */
        pressed: string,
        /**
         * Used in pressed buttons for instance.
         */
        pressedForeground: string,

        /**
         * Used in buttons for instance.
         */
        secondary: string,

        /**
         * Used in buttons for instance.
         */
        danger: string,
        /**
         * Used in buttons for instance.
         */
        dangerForeground: string,

        /**
         * Used in certain focusable components such as buttons.
         */
        focusDashes: string,
    },
};

const light: Theme =
{
    colors:
    {
        background: "#fff",
        foreground: "#000",

        inputBorder: "#b5b5b5",
        inputBackground: "#fff",

        anchor: "#b700f3",

        scrollBarTrack: "#E9E9E9",
        scrollBarThumb: "#CDCDCD",

        primary: "#3a00c8",
        primaryForeground: "#fff",

        pressed: "#000",
        pressedForeground: "#fff",

        secondary: "#b5b5b5",

        danger: "#e50000",
        dangerForeground: "#fff",

        focusDashes: "#000",
    },
};

const dark: Theme =
{
    colors:
    {
        background: "#1d1d1d",
        foreground: "#fff",

        inputBorder: "#555",
        inputBackground: "#232323",

        anchor: "#695C97",

        scrollBarTrack: "rgba(0,0,0,0)",
        scrollBarThumb: "#333",

        primary: "#3a00c8",
        primaryForeground: "#fff",

        pressed: "#fff",
        pressedForeground: "#000",

        secondary: "#777",

        danger: "#e50000",
        dangerForeground: "#fff",

        focusDashes: "#fff",
    },
};

const purple: Theme = structuredClone(dark);
purple.colors.background =
purple.colors.primary = "#180053";

const green = structuredClone(dark);
green.colors.background = "#3F8700";
green.colors.primary = "#4F970E";
green.colors.anchor = "#ef7127";

export const ThemePresets = {
    light,
    dark,
    purple,
    green,
};

export const ThemeContext = typeof window !== "undefined" ? createContext<Theme>(light) : null;

export function ThemeProvider({
    theme,
    children,
} : {
    theme: Theme,
    children?: React.ReactNode,
}) {
    if (!ThemeContext)
    {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
}

export const PreferPrimaryContext = typeof window !== "undefined" ? createContext<boolean>(false) : null;

export function PreferPrimary({
    prefer,
    children,
} : {
    prefer: boolean,
    children?: React.ReactNode,
}) {
    if (!PreferPrimaryContext)
    {
        return <>{children}</>;
    }

    return (
        <PreferPrimaryContext.Provider value={prefer}>
            {children}
        </PreferPrimaryContext.Provider>
    );
}