/**
 * Reverses a string by grapheme clusters.
 */
export function reverse(str: string): string {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const graphemes = Array.from(segmenter.segment(str), segment => segment.segment);
  return graphemes.reverse().join("");
}