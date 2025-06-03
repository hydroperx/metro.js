export type Side = "top" | "bottom" | "left" | "right";

export function fitViewportPosition(
  positioningElement: HTMLElement,
  [x, y]: [number, number],
): [number, number] {
  const positioningRect = positioningElement.getBoundingClientRect();

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
