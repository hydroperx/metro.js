import { ColorObserver } from "@hydroper/colorobserver";
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
    });

    // Adjust size
    useEffect(() => {
        const remObserver = new RemObserver(rem => {
            setRem(rem);
        });
        return () => {
            remObserver.cleanup();
        };
    });

    // Animation time in milliseconds
    let time = 4000;

    // Other animation parameters
    let r = -14; // degrees
    let m = 30; // milliseconds

    // Animation
    const orbit = keyframes `
        0% {
            transform: rotate(225deg);
            opacity: 1;
            animation-timing-function: ease-out;
        } 

        7% {
            transform: rotate(345deg);
            animation-timing-function: linear;
        }

        35% {
            transform: rotate(495deg);
            animation-timing-function: ease-in-out;
        }

        42% {
            transform: rotate(690deg);
            animation-timing-function: linear;
        }

        70% {
            transform: rotate(835deg); opacity: 1; 
            animation-timing-function: linear;
        }

        76% {
            opacity: 1;
        }

        77% {
            transform: rotate(955deg);
            animation-timing-function: ease-in;
        }

        78% { transform: rotate(955deg); opacity: 0; }
        100% { transform: rotate(955deg); opacity: 0; } 
    `;

    // Size
    const size = options.size ?? 9;

    // Build class name
    useEffect(() => {
        setSerializedStyles(css `
            position: relative;
            padding-top: ${(size * 0.25 * rem) /5}px;
            width: ${size * 0.25 * rem}px;
            height: ${size * 0.25 * rem}px;

            & .progress-ellipsis__wrap {
                position: absolute;
                width: ${(size * 0.25 * rem )}px;
                height: ${(size * 0.25 * rem )}px;
            }

            & .progress-ellipsis__circle {
                transform: rotate(225deg);
                animation-iteration-count: infinite;
                animation-name: ${orbit};
                animation-duration: ${time}ms;
                width: ${(size * 0.25 * rem)}px;
                height: ${(size * 0.25 * rem)}px;

                opacity: 0;
            }

            & .progress-ellipsis__circle:after {
                content: '';
                position: absolute;
                width: ${(size * 0.25 * rem) / 8}px;
                height: ${(size * 0.25 * rem) / 8}px;
                border-radius: ${(size * 0.25 * rem) / 8}px;
                box-shadow: 0px 0px 5% ${color};
                background: ${color};
            }

            & .progress-ellipsis__wrap:nth-of-type(2) {
                transform: rotate(${r}deg);
            }
            & .progress-ellipsis__wrap:nth-of-type(2) .progress-ellipsis__circle { animation-delay: ${time / m}ms; }
            & .progress-ellipsis__wrap:nth-of-type(3) {
                transform: rotate(${r * 2}deg);
            }
            & .progress-ellipsis__wrap:nth-of-type(3) .progress-ellipsis__circle { animation-delay: ${time / m*2}ms; }
            & .progress-ellipsis__wrap:nth-of-type(4) {
                transform: rotate(${r * 3}deg);
            }
            & .progress-ellipsis__wrap:nth-of-type(4) .progress-ellipsis__circle {    animation-delay: ${time / m*3}ms; }
            & .progress-ellipsis__wrap:nth-of-type(5) {
                transform: rotate(${r * 4}deg);
            }
            & .progress-ellipsis__wrap:nth-of-type(5) .progress-ellipsis__circle {    animation-delay: ${time / m*4}ms; }
        `);
    }, [color, rem]);

    return (
        <div className={options.className} style={options.style}>
            <div className='progress-ellipsis__wrap'>
                <div className='progress-ellipsis__circle'></div>
            </div>
            <div className='progress-ellipsis__wrap'>
                <div className='progress-ellipsis__circle'></div>
            </div>
            <div className='progress-ellipsis__wrap'>
                <div className='progress-ellipsis__circle'></div>
            </div>
            <div className='progress-ellipsis__wrap'>
                <div className='progress-ellipsis__circle'></div>
            </div>
            <div className='progress-ellipsis__wrap'>
                <div className='progress-ellipsis__circle'></div>
            </div>
        </div>
    );
}

export type ProgressEllipsisOptions = {
    size?: number,

    style?: React.CSSProperties,
    className?: string,
};