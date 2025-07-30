import { createContext } from "react";

/**
 * Right-to-left indicator.
 */
export const RTLContext = createContext<boolean>(false);

/**
 * Right-to-left indicator.
 */
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
