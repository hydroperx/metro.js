/**
 * Simple placement type.
 */
export type SimplePlacementType = "top" | "bottom" | "left" | "right";

/**
 * Ensures an element at the given position fits into the viewport,
 * returning a new position.
 */
export function fitViewport(
  element: HTMLElement,
  [x, y]: [number, number],
): [number, number] {
  const positioningRect = element.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  x = x + positioningRect.width < viewportWidth ? x : x - positioningRect.width;
  x = x < 0 ? 0 : x;

  y =
    y + positioningRect.height < viewportHeight
      ? y
      : y - positioningRect.height;
  y = y < 0 ? 0 : y;

  return [x, y];
}