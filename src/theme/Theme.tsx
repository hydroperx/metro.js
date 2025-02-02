import { createContext } from "react";

export type Theme =
{
    colors:
    {
        background: string,
        foreground: string,

        darkMenuBackground: string,

        primaryBackground: string,
        hoveredPrimaryBackground: string,
        pressedPrimaryBackground: string,

        secondaryBackground: string,
        hoveredSecondaryBackground: string,
        pressedSecondaryBackground: string,

        dangerBackground: string,
        hoveredDangerBackground: string,
        pressedDangerBackground: string,

        focusDashes: string,
    },
};

export const lightTheme: Theme =
{
    colors:
    {
        background: "#fff",
        foreground: "#000",
    },
};

export const ThemeContext: React.Context<Theme> = createContext(lightTheme);

export const ThemeProvider = ThemeContext.Provider;