import { Color } from "@hydroperx/color";

/**
 * Returns a value between 0 and 100 inclusive that determines
 * the difference between the two given colors.
 */
export function colorDelta(a: any, b: any): number {
  return Color(a).delta(Color(b));
}

export function colorsAreSimiliar(a: any, b: any): boolean {
  return colorDelta(a, b) <= 20;
}

export function enhanceBrightness(background: any, color: any): string {
  const a = Color(background);
  const b = Color(color);
  if (colorsAreSimiliar(a, b)) {
    let r = a.isDark() ? lighten(b, 0.6) : darken(b, 0.6);
    r = a.isDark()
      ? Color(r).isDark()
        ? lighten(r, 0.4)
        : r
      : Color(r).isLight()
        ? darken(r, 0.4)
        : r;
    return r;
  }
  let r = (
    a.isDark()
      ? b.isDark()
        ? lighten(b, 0.6)
        : b
      : b.isLight()
        ? darken(b, 0.6)
        : b
  ).toString();
  r = (
    a.isDark()
      ? Color(r).isDark()
        ? lighten(r, 0.4)
        : r
      : Color(r).isLight()
        ? darken(r, 0.4)
        : r
  ).toString();
  return r;
}

export function darken(a: any, ratio: number): string {
  a = Color(a);
  let r = a.darken(ratio);
  if (colorDelta(a, r) < 10) {
    r = r.darken(ratio);
  }
  return r.toString();
}

export function lighten(a: any, ratio: number): string {
  a = Color(a);
  let r = a.lighten(ratio);
  if (colorDelta(a, r) < 10) {
    r = r.lighten(ratio);
  }
  return r.toString();
}

/**
 * Lightens a color if dark; darkens a color if light.
 */
export function contrast(a: any, ratio: number): string {
  a = Color(a);
  return a.isLight() ? darken(a, ratio) : lighten(a, ratio);
}
