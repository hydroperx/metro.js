/**
 * Observes the pixels measure of the cascading `em` unit.
 */
export class EMObserver {
  /**
   * Cascading style class.
   */
  public static CLASS: string = "EMObserver-element";

  private element: HTMLDivElement | null = null;
  private resize_observer: ResizeObserver | null = null;

  /**
   * Constructor.
   */
  constructor(container: HTMLElement, updateFn: (value: number) => void) {
    if (typeof window !== "object") {
      return;
    }

    this.element = document.createElement("div");
    this.element.classList.add(EMObserver.CLASS);
    this.element.style.position = "absolute";
    this.element.style.left = "0";
    this.element.style.top = "0";
    this.element.style.pointerEvents = "none";
    this.element.style.width = "1em";
    container.append(this.element);

    updateFn(this.read());

    this.resize_observer = new ResizeObserver(() => {
      updateFn(this.read());
    });
    this.resize_observer.observe(this.element);
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.resize_observer?.disconnect();
    this.element?.remove();
  }

  // Read font-size
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
