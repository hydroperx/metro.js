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
         * Used in components such as text inputs, tooltips and context menu.
         */
        inputBackground?: string,

        /**
         * Used in components such as text inputs, tooltips and context menu.
         */
        inputBorder?: string,

        anchor?: string,

        scrollBarTrack?: string,
        scrollBarThumb?: string,

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

const light: Theme =
{
    colors:
    {
        background: "#fff",
        foreground: "#000",

        inputBorder: "#b5b5b5",
        inputBackground: "#fff",

        anchor: "#594C87",

        scrollBarTrack: "#E9E9E9",
        scrollBarThumb: "#CDCDCD",

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


const purple: Theme = clone(dark);
purple.colors.background =
purple.colors.primaryBackground = "#180053";

const green = clone(dark);
green.colors.background =
green.colors.primaryBackground = "#3F8700";
green.colors.anchor = "#ef7127";

export const ThemePresets = {
    light,
    dark,
    purple,
    green,
};

export const ThemeContext: React.Context<Theme> = createContext(light);