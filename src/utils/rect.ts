/**
 * Determines the side a rectangle hits.
 *
 * @param a Rectangle to be hitted.
 * @param b Hitting rectangle.
 * @returns The side of `a` that `b` hits.
 */
export function getRectHitSide(
    a: { x: number, y: number, width: number, height: number },
    b: { x: number, y: number, width: number, height: number }
): "top" | "bottom" | "left" | "right" | null {
    // Based in https://stackoverflow.com/a/29861691
    const r1 = { x: a.x, y: a.y, w: a.width, h: a.height };
    const r2 = { x: b.x, y: b.y, w: b.width, h: b.height };
    const dx = (r1.x+r1.w/2)-(r2.x+r2.w/2);
    const dy = (r1.y+r1.h/2)-(r2.y+r2.h/2);
    const width = (r1.w+r2.w)/2;
    const height = (r1.h+r2.h)/2;
    const crossWidth = width*dy;
    const crossHeight = height*dx;
    let collision = null;

    if (Math.abs(dx) <= width && Math.abs(dy) <= height)
    {
        if (crossWidth > crossHeight)
            collision = (crossWidth > (-crossHeight)) ? "bottom" : "left";
        else collision = (crossWidth > -(crossHeight)) ? "right" : "top";
    }
    return collision;
}