import Color from "color";
import DeltaE from "delta-e";
import convert from "color-convert";

/**
 * Returns a value between 0 and 100 inclusive that determines
 * the difference between the two given colors.
 */
export function colorDelta(a: Color, b: Color): number
{
    const aRGB = a.rgb().array() as [number, number, number]
        , bRGB = b.rgb().array() as [number, number, number];
    const aLAB = convert.rgb.lab(aRGB)
        , bLAB = convert.rgb.lab(bRGB);
    return DeltaE.getDeltaE00(
        { L: aLAB[0], A: aLAB[1], B: aLAB[2] },
        { L: bLAB[0], A: bLAB[1], B: bLAB[2] }
    );
}