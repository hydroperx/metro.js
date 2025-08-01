// third-party
import React, { useEffect, useRef, useState, useContext } from "react";
import { Color, ColorObserver } from "@hydroperx/color";
import { styled, keyframes } from "styled-components";
import extend from "extend";
import assert from "assert";

// local
import * as EMConvert from "../utils/EMConvert";
import { EMObserver } from "../utils/EMObserver";

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
  $em: number;
}>`
  position: relative;
  width: 100%;
  height: ${($) => $.$size * $.$em}px;
  overflow: hidden;

  & .progress-ellipsis__circle {
    position: absolute;
    left: 62.5%;
    animation: ${move} ${($) => $.$time}ms infinite;
    width: ${($) => $.$size * $.$em}px;
    height: ${($) => $.$size * $.$em}px;
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

/**
 * Progress bar.
 * 
 * Displays an infinitely-looping ellipsis bar by default.
 */
export function ProgressBar(params: {
  /**
   * For an ellipsis, indicates the size of each dot.
   * @default 4.5
   */
  size?: number;

  style?: React.CSSProperties;
  className?: string;
}) {
  // Div ref
  const ref = useRef(null);

  // States
  const [color, set_color] = useState<string>("#fff");
  const [em, set_em] = useState<number>(0); // root font size

  // Set style
  const newStyle: React.CSSProperties = {};
  newStyle.verticalAlign = "middle";
  if (params.style) {
    extend(newStyle, params.style);
  }

  // Adjust color
  useEffect(() => {
    const color_observer = new ColorObserver(ref.current, (color: Color) => {
      set_color(color.isLight() ? "#fff" : "#000");
    });

    return () => {
      color_observer.cleanup();
    };
  }, []);

  // Adjust size
  useEffect(() => {
    const em_observer = new EMObserver(ref.current!, val => {
      set_em(val);
    });
    return () => {
      em_observer.cleanup();
    };
  }, []);

  // Animation time in milliseconds
  let time = 4000;

  // Other animation parameters
  let r = -14; // left in percentage
  let m = 30; // milliseconds

  // Size
  const size = EMConvert.points.em(params.size ?? 4.5);

  return (
    <Div
      ref={ref}
      className={params.className}
      style={params.style}
      $size={size}
      $time={time}
      $color={color}
      $r={r}
      $m={m}
      $em={em}
    >
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
      <div className="progress-ellipsis__circle"></div>
    </Div>
  );
}