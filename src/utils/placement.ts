export function computePosition(
  referenceElement: HTMLElement,
  positioningElement: HTMLElement,
  options: ComputePositionOptions | null = null,
): [number, number, Side] {
  // Change the display so the positioning size is obtained
  let prevDisplay = positioningElement.style.display;
  if (prevDisplay === "none") {
    positioningElement.style.display = "inline-block";
  }

  const positioningRect = positioningElement.getBoundingClientRect();
  const referenceRect = referenceElement.getBoundingClientRect();

  const prefer = options?.prefer ?? "bottom";
  const margin = options?.margin ?? 0;
  let resolution: Side | null = null;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  switch (prefer) {
    case "bottom": {
      if (
        referenceRect.bottom + margin + positioningRect.height <
        viewportHeight
      ) {
        resolution = "bottom";
      } else if (referenceRect.top - margin - positioningRect.height >= 0) {
        resolution = "top";
      } else if (options?.orthogonal) {
        if (
          referenceRect.right + margin + positioningRect.width <
          viewportWidth
        ) {
          resolution = "right";
        } else if (referenceRect.left - margin - positioningRect.width >= 0) {
          resolution = "left";
        }
      }
      if (resolution === null) {
        resolution =
          referenceRect.bottom > referenceRect.top ? "top" : "bottom";
      }
      break;
    }
    case "top": {
      if (referenceRect.top - margin - positioningRect.height >= 0) {
        resolution = "top";
      } else if (
        referenceRect.bottom + margin + positioningRect.height <
        viewportHeight
      ) {
        resolution = "bottom";
      } else if (options?.orthogonal) {
        if (
          referenceRect.right + margin + positioningRect.width <
          viewportWidth
        ) {
          resolution = "right";
        } else if (referenceRect.left - margin - positioningRect.width >= 0) {
          resolution = "left";
        }
      }
      if (resolution === null) {
        resolution =
          referenceRect.bottom > referenceRect.top ? "top" : "bottom";
      }
      break;
    }
    case "left": {
      if (referenceRect.left - margin - positioningRect.width >= 0) {
        resolution = "left";
      } else if (
        referenceRect.right + margin + positioningRect.width <
        viewportWidth
      ) {
        resolution = "right";
      } else if (options?.orthogonal) {
        if (referenceRect.top - margin - positioningRect.height >= 0) {
          resolution = "top";
        } else if (
          referenceRect.bottom + margin + positioningRect.height <
          viewportHeight
        ) {
          resolution = "bottom";
        }
      }
      if (resolution === null) {
        resolution =
          referenceRect.right > referenceRect.left ? "left" : "right";
      }
      break;
    }
    // right
    default: {
      if (
        referenceRect.right + margin + positioningRect.width <
        viewportWidth
      ) {
        resolution = "right";
      } else if (referenceRect.left - margin - positioningRect.width >= 0) {
        resolution = "left";
      } else if (options?.orthogonal) {
        if (referenceRect.top - margin - positioningRect.height >= 0) {
          resolution = "top";
        } else if (
          referenceRect.bottom + margin + positioningRect.height <
          viewportHeight
        ) {
          resolution = "bottom";
        }
      }
      if (resolution === null) {
        resolution =
          referenceRect.right > referenceRect.left ? "left" : "right";
      }
    }
  }

  let x = 0,
    y = 0;

  switch (resolution) {
    case "top": {
      if (referenceRect.left + positioningRect.width >= viewportWidth) {
        x = viewportWidth - margin - positioningRect.width;
      } else if (referenceRect.left < 0) {
        x = margin;
      } else {
        x = referenceRect.left;
      }
      y = referenceRect.top - margin - positioningRect.height;
      break;
    }
    case "bottom": {
      if (referenceRect.left + positioningRect.width >= viewportWidth) {
        x = viewportWidth - margin - positioningRect.width;
      } else if (referenceRect.left < 0) {
        x = margin;
      } else {
        x = referenceRect.left;
      }
      y = referenceRect.bottom + margin;
      break;
    }
    case "left": {
      x = referenceRect.left - margin - positioningRect.width;
      if (referenceRect.top + positioningRect.height >= viewportHeight) {
        y = viewportHeight - margin - positioningRect.height;
      } else if (referenceRect.top < 0) {
        y = margin;
      } else {
        y = referenceRect.top;
      }
      break;
    }
    // right
    default: {
      x = referenceRect.right + margin;
      if (referenceRect.top + positioningRect.height >= viewportHeight) {
        y = viewportHeight - margin - positioningRect.height;
      } else if (referenceRect.top < 0) {
        y = margin;
      } else {
        y = referenceRect.top;
      }
      break;
    }
  }

  // Revert positioning display style
  positioningElement.style.display = prevDisplay;

  return [x, y, resolution];
}

export type ComputePositionOptions = {
  prefer?: Side;
  margin?: number;
  /**
   * If `prefer` is `left` or `right`, may result into `top` or `bottom`;
   * if `top` or `bottom`, may result into `left` or `right`.
   *
   * @default false
   */
  orthogonal?: boolean;
};

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
