/**
 * Printer's point conversion to cascading `em`.
 */
export const points = {
  /**
   * Returns a cascading `em` unit.
   */
  emUnit(value: number): string {
    return points.em(value) + "em";
  },

  /**
   * Returns a cascading `em` unit's value.
   */
  em(value: number): number {
    return value * 0.08333333333333333;
  }
};