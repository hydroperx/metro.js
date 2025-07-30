import { Theme } from "../theme/Theme";
import * as ColorUtils from "../utils/ColorUtils";

/**
 * Anchor styles.
 * @hidden
 */
export function AnchorSkin(theme: Theme): string {
  return `
    && a {
      color: ${theme.colors.anchor};
      text-decoration: none;
    }

    && a:hover {
      color: ${ColorUtils.lighten(theme.colors.anchor, 0.3)};
    }
  `;
}