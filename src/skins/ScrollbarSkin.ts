import { Theme } from "../theme/Theme";

/**
 * Scrollbar styles.
 * @hidden
 */
export function ScrollbarSkin(theme: Theme): string {
  return `
    &&::-webkit-scrollbar {
      width: 12px;
      height: 12px;
      background: ${theme.colors.scrollBarTrack};
    }

    &&::-webkit-scrollbar-thumb {
      background: ${theme.colors.scrollBarThumb};
      border-radius: 0;
    }
  `;
}