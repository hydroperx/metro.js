import { styled } from "styled-components";
import { useContext } from "react";

import { RTLContext } from "../layout";

// CSS
const Div = styled.div<{
  $vertical: boolean;
  $rtl: boolean;
}>`
  display: flex;
  flex-direction: ${($) =>
    $.$vertical ? "column" : !$.$rtl ? "row" : "row-reverse"};
  align-items: center;
  gap: 1rem;

  ${($) =>
    $.$vertical
      ? ""
      : `
    & > label, & > span, & > h1, & > h2, & > h3, & > h4, & > h5 {
        min-width: 12rem;
        ${$.$rtl ? "text-align: right;" : ""}
    }
    `}
`;

/**
 * A form group more commonly contains a label
 * followed by a form control.
 */
export function FormGroup(options: FormGroupOptions) {
  // Locale direction
  const rtl = useContext(RTLContext);

  return (
    <Div
      $vertical={!!options.vertical}
      $rtl={rtl}
      style={options.style}
      className={options.className}
    >
      {options.children}
    </Div>
  );
}

export type FormGroupOptions = {
  vertical?: boolean;

  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};
