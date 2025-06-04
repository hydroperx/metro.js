import { createContext } from "react";

export type RTLType = "ltr" | "rtl";

export const RTLContext = createContext<RTLType>("ltr");

export function RTLProvider({
  direction,
  children,
}: {
  direction: RTLType;
  children?: React.ReactNode;
}) {
  return (
    <RTLContext.Provider value={direction}>
      {children}
    </RTLContext.Provider>
  );
}
