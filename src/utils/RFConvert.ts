export const points = {
  cascadingRF(points: number): string {
    return points * 0.25 + "rem";
  },

  rf(points: number): number {
    return points * 0.25;
  }
};