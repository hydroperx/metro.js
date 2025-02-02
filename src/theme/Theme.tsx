import { createContext } from "react";

export type Theme =
{
    colors:
    {
        background: string,
        foreground: string,

        buttonBackground: string,
        hoveredButtonBackground: string,
        pressedButtonBackground: string,

        primaryButtonBackground: string,
        hoveredPrimaryButtonBackground: string,
        pressedPrimaryButtonBackground: string,

        dangerButtonBackground: string,
        hoveredDangerButtonBackground: string,
        pressedDangerButtonBackground: string,

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