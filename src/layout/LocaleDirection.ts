import { createContext } from "react";

export type LocaleDirection = "ltr" | "rtl";

export const LocaleDirectionContext: React.Context<LocaleDirection> = createContext("ltr");