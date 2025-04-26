import { createContext } from "react";

export type LocaleDirection = "ltr" | "rtl";

export const LocaleDirectionContext = typeof window !== "undefined" ? createContext<LocaleDirection>("ltr") : null;

export function LocaleDirectionProvider({
    direction,
    children,
} : {
    direction: LocaleDirection,
    children?: React.ReactNode,
}) {
    if (!LocaleDirectionContext)
    {
        return <>{children}</>;
    }

    return (
        <LocaleDirectionContext.Provider value={direction}>
            {children}
        </LocaleDirectionContext.Provider>
    );
}