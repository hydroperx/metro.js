/**
 * Clamps a value in the given range (inclusive in both ends).
 */
export function clamp(value: number, from: number, to: number): number {
  return Math.min(Math.max(value, from), to);
}
