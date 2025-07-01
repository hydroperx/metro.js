/**
 * Printer's point based conversion.
 */
export const points = {
  cascadingRF(points: number): string {
    return points * 0.08333333333333333 + "rem";
  },

  rf(points: number): number {
    return points * 0.08333333333333333;
  }
};