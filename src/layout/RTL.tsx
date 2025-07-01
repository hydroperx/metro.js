import { createContext } from "react";

export const RTLContext = createContext<boolean>(false);

export function RTLProvider({
  rtl,
  children,
}: {
  rtl: boolean;
  children?: React.ReactNode;
}) {
  return (
    <RTLContext.Provider value={rtl}>
      {children}
    </RTLContext.Provider>
  );
}
