import { createContext } from "react";

export type LocaleDirection = "ltr" | "rtl";

export const LocaleDirectionContext = createContext<LocaleDirection>("ltr");

export function LocaleDirectionProvider({
    direction,
    children,
} : {
    direction: LocaleDirection,
    children?: React.ReactNode,
}) {
    return (
        <LocaleDirectionContext.Provider value={direction}>
            {children}
        </LocaleDirectionContext.Provider>
    );
}