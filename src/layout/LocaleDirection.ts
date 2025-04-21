import { createContext } from "react";

export type LocaleDirection = "ltr" | "rtl";

export const LocaleDirectionContext = createContext<LocaleDirection>("ltr");