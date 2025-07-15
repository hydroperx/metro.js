import React, { useRef } from "react";

import { BUTTON_NAVIGABLE } from "../utils/vars";
import { ComboBoxStatic } from "./ComboBoxStatic";

export function Option(options: OptionOptions) {
  // Button ref
  const button_reference = useRef<HTMLButtonElement | null>(null);

  function button_onClick(): void {
    const parent = button_reference.current!.parentElement!;
    
    // ComboBox specific behavior
    if (parent.classList.contains("ComboBox-list")) {
      if (ComboBoxStatic.cooldown > Date.now() - 50) {
        return;
      }
      ComboBoxStatic.change?.(options.value);
      ComboBoxStatic.close?.();
    }
  }

  return (
    <button
      className={
        BUTTON_NAVIGABLE + " Option" + (options.className ? " " + options.className : "")
      }
      onClick={button_onClick}
      ref={button_reference}
      data-value={options.value}>
      {options.children}
    </button>
  );
}

export type OptionOptions = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;

  /**
   * Value.
   */
  value: string;
};