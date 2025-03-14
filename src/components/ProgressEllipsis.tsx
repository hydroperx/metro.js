import { ColorObserver } from "com.hydroper.colorobserver";
import React, { useEffect, useRef, useState, useContext } from "react";
import Color from "color";
import { css, SerializedStyles, keyframes } from "@emotion/react";
import extend from "extend";
import assert from "assert";
import { pointsToRem } from "../utils/points";
import { RemObserver } from "../utils/RemObserver";

export function ProgressEllipsis(options: ProgressEllipsisOptions)
{
    // Div ref
    const ref = useRef(null);

    // States
    const [color, setColor] = useState<string>("#fff");
    const [rem, setRem] = useState<number>(0);
    const [serializedStyles, setSerializedStyles] = useState<SerializedStyles>(null);

    // Set style
    const newStyle: React.CSSProperties = {};
    newStyle.verticalAlign = "middle";
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    // Adjust color
    useEffect(() => {
        const colorObserver = new ColorObserver(ref.current, (color: Color) => {
            setColor(color.isLight() ? "#fff" : "#000");
        });

        return () => {
            colorObserver.cleanup();
        };
    }, []);

    // Adjust size
    useEffect(() => {
        const remObserver = new RemObserver(rem => {
            setRem(rem);
        });
        return () => {
            remObserver.cleanup();
        };
    }, []);

    // Animation time in milliseconds
    let time = 4000;

    // Other animation parameters
    let r = -14; // left in percentage
    let m = 30; // milliseconds

    // Animation
    const move = keyframes `
        0% {
            left: 10%;
            opacity: 1;
            animation-timing-function: ease-out;
        } 

        30% {
            left: 50%;
            animation-timing-function: linear;
        }

        50% {
            left: 65%;
            opacity: 1;
            animation-timing-function: linear;
        }

        60% {
            left: 100%;
            animation-timing-function: ease-in;
            opacity: 0;
        }

        85% {
            left: -50%;
            animation-timing-function: linear;
        }

        100% {
            left: -50%;
            animation-timing-function: linear;
        }
    `;

    // Size
    const size = options.size ?? 1.5;

    // Build class name
    useEffect(() => {
        setSerializedStyles(css `
            position: relative;
            width: 100%;
            height: ${size * 0.25 * rem}px;
            overflow: hidden;

            & .progress-ellipsis__circle {
                position: absolute;
                left: 62.5%;
                animation: ${move} ${time}ms infinite;
                width: ${size * 0.25 * rem}px;
                height: ${size * 0.25 * rem}px;
                background: ${color};
                border-radius: 100%;
                opacity: 0;
            }

            & div:nth-of-type(2) { left: ${r}% }
            & div:nth-of-type(3) { left: ${r * 2}% }
            & div:nth-of-type(4) { left: ${r * 3}% }
            & div:nth-of-type(5) { left: ${r * 4}% }
            & div:nth-of-type(2) { animation-delay: ${time / m}ms }
            & div:nth-of-type(3) { animation-delay: ${time / m*2}ms }
            & div:nth-of-type(4) { animation-delay: ${time / m*3}ms }
            & div:nth-of-type(5) { animation-delay: ${time / m*4}ms }
        `);
    }, [color, rem]);

    return (
        <div ref={ref} className={options.className} style={options.style} css={serializedStyles}>
            <div className='progress-ellipsis__circle'></div>
            <div className='progress-ellipsis__circle'></div>
            <div className='progress-ellipsis__circle'></div>
            <div className='progress-ellipsis__circle'></div>
            <div className='progress-ellipsis__circle'></div>
        </div>
    );
}

export type ProgressEllipsisOptions = {
    size?: number,

    style?: React.CSSProperties,
    className?: string,
};