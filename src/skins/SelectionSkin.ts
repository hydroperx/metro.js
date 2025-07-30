import { Theme } from "../theme/Theme";

/**
 * Selection styles.
 * @hidden
 */
export function SelectionSkin(theme: Theme): string {
  return `
    &&::selection,
    &&::-moz-selection {
      background: ${theme.colors.foreground};
      color: ${theme.colors.background};
    }
  `;
}