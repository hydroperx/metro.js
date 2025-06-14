import React, { useEffect, useRef, useState, useContext } from "react";
import { Color, ColorObserver } from "@hydroperx/color";
import { styled, keyframes } from "styled-components";
import extend from "extend";
import assert from "assert";

import * as RFConvert from "../utils/RFConvert";
import { RFObserver } from "../utils/RFObserver";

// Animation
const move = keyframes`
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

const Div = styled.div<{
  $size: number;
  $time: number;
  $color: string;
  $r: number;
  $m: number;
  $rem: number;
}>`
  position: relative;
  width: 100%;
  height: ${($) => $.$size * 0.25 * $.$rem}px;
  overflow: hidden;

  & .progress-ellipsis__circle {
    position: absolute;
    left: 62.5%;
    animation: ${move} ${($) => $.$time}ms infinite;
    width: ${($) => $.$size * 0.25 * $.$rem}px;
    height: ${($) => $.$size * 0.25 * $.$rem}px;
    background: ${($) => $.$color};
    border-radius: 100%;
    opacity: 0;
  }

  & div:nth-of-type(2) {
    left: ${($) => $.$r}%;
  }
  & div:nth-of-type(3) {
    left: ${($) => $.$r * 2}%;
  }
  & div:nth-of-type(4) {
    left: ${($) => $.$r * 3}%;
  }
  & div:nth-of-type(5) {
    left: ${($) => $.$r * 4}%;
  }
  & div:nth-of-type(2) {
    animation-delay: ${($) => $.$time / $.$m}ms;
  }
  & div:nth-of-type(3) {
    animation-delay: ${($) => ($.$time / $.$m) * 2}ms;
  }
  & div:nth-of-type(4) {
    animation-delay: ${($) => ($.$time / $.$m) * 3}ms;
  }
  & div:nth-of-type(5) {
    animation-delay: ${($) => ($.$time / $.$m) * 4}ms;
  }
`;

export function ProgressEllipsis(options: ProgressEllipsisOptions) {
  // Div ref
  const ref = useRef(null);

  // States
  const [color, set_color] = useState<string>("#fff");
  const [rf, set_rf] = useState<number>(0); // root font size

  // Set style
  const newStyle: React.CSSProperties = {};
  newStyle.verticalAlign = "middle";
  if (options.style) {
    extend(newStyle, options.style);
  }

  // Adjust color
  useEffect(() => {
    const colorObserver = new ColorObserver(ref.current, (color: Color) => {
      set_color(color.isLight() ? "#fff" : "#000");
    });

    return () => {
      colorObserver.cleanup();
    };
  }, []);

  // Adjust size
  useEffect(() => {
    const rf_observer = new RFObserver((rem) => {
      set_rf(rem);
    });
    return () => {
      rf_observer.cleanup();
    };
  }, []);

  // Animation time in milliseconds
  let time = 4000;

  // Other animation parameters
  let r = -14; // left in percentage
  let m = 30; // milliseconds

  // Size
  const size = options.size ?? 1.5;

  return (
    <Div
      ref={ref}
      className={options.className}
      style={options.style}
      $size={size}
      $time={time}
      $color={color}
      $r={r}
      $m={m}
      $rem={rf}
    >
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
    </Div>
  );
}

export type ProgressEllipsisOptions = {
  size?: number;

  style?: React.CSSProperties;
  className?: string;
};
