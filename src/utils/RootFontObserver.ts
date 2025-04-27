/**
 * Observes the value of the CSS `rem` unit.
 */
export class RootFontObserver
{
    private element: HTMLDivElement | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor(updateCallback: (value: number) => void)
    {
        if (typeof window !== "object")
        {
            return;
        }

        this.element = document.createElement("div");
        this.element.classList.add("rem-unit");
        this.element.style.pointerEvents = "none";
        this.element.style.width = "1rem";
        document.body.append(this.element);

        updateCallback(this.read());

        this.resizeObserver = new ResizeObserver(() => {
            updateCallback(this.read());
        });
        this.resizeObserver.observe(this.element);
    }

    cleanup()
    {
        this.resizeObserver?.disconnect();
        this.element?.remove();
    }

    private read(): number
    {
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