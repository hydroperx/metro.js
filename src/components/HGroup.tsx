import { Alignment } from "../layout/Alignment";

export type HGroupOptions = {
    gap?: number,
    /**
     * Horizontal alignment.
     */
    horizontalAlign?: Alignment,
    /**
     * Vertical alignment.
     */
    verticalAlign?: Alignment,
    /**
     * Grow factor of the component relative to
     * its container. This indicates how much space
     * the component takes out of a number of items.
     */
    grow?: number,
};

export function HGroup(options: HGroupOptions)
{
}