import { createContext } from "react";
import Color from "color";
import clone from "clone";

export type Theme =
{
    colors:
    {
        background?: string,
        foreground?: string,

        /**
         * Used in components that may be bordered such as text inputs.
         */
        border?: string,

        /**
         * Used in buttons for instance.
         */
        primaryBackground?: string,
        /**
         * Used in buttons for instance.
         */
        primaryForeground?: string,
        /**
         * Used in buttons for instance.
         */
        hoveredPrimaryBackground?: string,

        /**
         * Used in buttons for instance.
         */
        pressedBackground?: string,
        /**
         * Used in buttons for instance.
         */
        pressedForeground?: string,

        /**
         * Used in buttons for instance.
         */
        secondaryBackground?: string,
        /**
         * Used in buttons for instance.
         */
        hoveredSecondaryBackground?: string,

        /**
         * Used in buttons for instance.
         */
        dangerBackground?: string,
        /**
         * Used in buttons for instance.
         */
        dangerForeground?: string,
        /**
         * Used in buttons for instance.
         */
        hoveredDangerBackground?: string,

        /**
         * Used in certain focusable components such as buttons.
         */
        focusDashes?: string,
    },
};

/**
 * A light theme.
 */
export const lightTheme: Theme =
{
    colors:
    {
        background: "#fff",
        foreground: "#000",

        border: "#b5b5b5",

        primaryBackground: "#3a00c8",
        primaryForeground: "#fff",
        hoveredPrimaryBackground: Color("#3a00c8").lighten(0.5).toString(),

        pressedBackground: "#000",
        pressedForeground: "#fff",

        secondaryBackground: "#b5b5b5",
        hoveredSecondaryBackground: Color("#b5b5b5").lighten(0.5).toString(),

        dangerBackground: "#e50000",
        dangerForeground: "#fff",
        hoveredDangerBackground: Color("#e50000").lighten(0.5).toString(),

        focusDashes: "#000",
    },
};

/**
 * A dark gray theme.
 */
export const darkTheme: Theme =
{
    colors:
    {
        background: "#1d1d1d",
        foreground: "#fff",

        border: "#555",

        primaryBackground: "#3a00c8",
        primaryForeground: "#fff",
        hoveredPrimaryBackground: Color("#3a00c8").lighten(0.5).toString(),

        pressedBackground: "#fff",
        pressedForeground: "#000",

        secondaryBackground: "#777",
        hoveredSecondaryBackground: Color("#b5b5b5").lighten(0.5).toString(),

        dangerBackground: "#e50000",
        dangerForeground: "#fff",
        hoveredDangerBackground: Color("#e50000").lighten(0.5).toString(),

        focusDashes: "#fff",
    },
};

/**
 * A purple dark theme.
 */
export const purpleTheme: Theme = clone(darkTheme);
purpleTheme.colors.background = "#180053";

export const ThemeContext: React.Context<Theme> = createContext(lightTheme);