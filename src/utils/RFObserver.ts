/**
 * Observes the pixels measure of the cascading `rem` unit.
 */
export class RFObserver {
  private element: HTMLDivElement | null = null;
  private resize_observer: ResizeObserver | null = null;

  constructor(updateFn: (value: number) => void) {
    if (typeof window !== "object") {
      return;
    }

    this.element = document.createElement("div");
    this.element.classList.add("RFObserver-element");
    this.element.style.pointerEvents = "none";
    this.element.style.width = "1rem";
    document.body.append(this.element);

    updateFn(this.read());

    this.resize_observer = new ResizeObserver(() => {
      updateFn(this.read());
    });
    this.resize_observer.observe(this.element);
  }

  cleanup() {
    this.resize_observer?.disconnect();
    this.element?.remove();
  }

  private read(): number {
    const widthMatch = window
      .getComputedStyle(this.element!)
      .getPropertyValue("width")
      .match(/^(\d*\.?\d*)px$/);

    if (!widthMatch || widthMatch.length < 1) {
      return 0;
    }

    const result = Number(widthMatch[1]);
    return !isNaN(result) ? result : 0;
  }
}
