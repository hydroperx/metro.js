// third-party
import * as React from "react";

// local
import { BUTTON_NAVIGABLE } from "../utils/Constants";
import { ComboBoxStatic } from "./ComboBox/ComboBoxStatic";

/**
 * Represents an option, typically at a `ComboBox`.
 */
export function Option(params: {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;

  /**
   * Value.
   */
  value: string;
}) {
  // References
  const button_reference = React.useRef<HTMLButtonElement | null>(null);
  const value_reference = React.useRef<string>(params.value);

  function button_click(): void {
    const parent = button_reference.current!.parentElement!;

    // ComboBox specific behavior
    if (parent.classList.contains("combobox-list")) {
      if (Date.now() - ComboBoxStatic.cooldown < 50) {
        return;
      }
      ComboBoxStatic.change?.(value_reference.current);
      ComboBoxStatic.close?.();
    }
  }

  // Reflect value parameter
  React.useEffect(() => {
    value_reference.current = params.value;
  }, [params.value]);

  // Update parent
  React.useEffect(() => {
    const p = button_reference.current!.parentElement?.parentElement?.previousElementSibling;
    if (p?.classList.contains("combobox")) {
      p.dispatchEvent(new Event("comboboxreflect"));
    }
  });

  // Layout
  return (
    <button
      className={
        BUTTON_NAVIGABLE + " option" + (params.className ? " " + params.className : "")
      }
      onClick={button_click}
      ref={button_reference}
      onPointerOver={() => {
        button_reference.current!.focus();
      }}
      data-value={params.value}>
      {params.children}
    </button>
  );
}