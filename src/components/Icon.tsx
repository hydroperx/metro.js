// Icon resources
import bullet_black from "../icons/bullet-black.svg";
import bullet_white from "../icons/bullet-white.svg";
import checked_black from "../icons/checked-black.svg";
import checked_white from "../icons/checked-white.svg";
import arrow_white from "../icons/arrow-white.svg";
import arrow_black from "../icons/arrow-black.svg";
import fullarrow_black from "../icons/fullarrow-black.svg";
import fullarrow_white from "../icons/fullarrow-white.svg";
import search_black from "../icons/search-black.svg";
import search_white from "../icons/search-white.svg";
import clear_black from "../icons/clear-black.svg";
import clear_white from "../icons/clear-white.svg";
import games_black from "../icons/games-black.svg";
import games_white from "../icons/games-white.svg";
import ie_black from "../icons/ie-black.svg";
import ie_white from "../icons/ie-white.svg";
import video_black from "../icons/video-black.svg";
import video_white from "../icons/video-white.svg";
import store_black from "../icons/store-black.svg";
import store_white from "../icons/store-white.svg";
import settings_black from "../icons/settings-black.svg";
import settings_white from "../icons/settings-white.svg";
import mail_black from "../icons/mail-black.svg";
import mail_white from "../icons/mail-white.svg";
import user_black from "../icons/user-black.svg";
import user_white from "../icons/user-white.svg";
import security_black from "../icons/security-black.svg";
import security_white from "../icons/security-white.svg";
import calc_black from "../icons/calc-black.svg";
import calc_white from "../icons/calc-white.svg";
import camera_black from "../icons/camera-black.svg";
import camera_white from "../icons/camera-white.svg";
import bluetooth_black from "../icons/bluetooth-black.svg";
import bluetooth_white from "../icons/bluetooth-white.svg";
import news_black from "../icons/news-black.svg";
import news_white from "../icons/news-white.svg";
import bing_black from "../icons/bing-black.svg";
import bing_white from "../icons/bing-white.svg";
import opera_black from "../icons/opera-black.svg";
import opera_white from "../icons/opera-white.svg";
import chrome_black from "../icons/chrome-black.svg";
import chrome_white from "../icons/chrome-white.svg";
import firefox_black from "../icons/firefox-black.svg";
import firefox_white from "../icons/firefox-white.svg";
import msedge_black from "../icons/msedge-black.svg";
import msedge_white from "../icons/msedge-white.svg";
import lapis_black from "../icons/lapis-black.svg";
import lapis_white from "../icons/lapis-white.svg";
import idea_black from "../icons/idea-black.svg";
import idea_white from "../icons/idea-white.svg";
import help_black from "../icons/help-black.svg";
import help_white from "../icons/help-white.svg";
import help_circle_black from "../icons/help-circle-black.svg";
import help_circle_white from "../icons/help-circle-white.svg";
import new_black from "../icons/new-black.svg";
import new_white from "../icons/new-white.svg";

// Third-party
import { Color, ColorObserver } from "@hydroperx/color";
import React, { useEffect, useRef, useState, useContext } from "react";
import { styled, keyframes } from "styled-components";
import extend from "extend";
import assert from "assert";

// Local imports
import * as EMConvert from "../utils/EMConvert";
import { EMObserver } from "../utils/EMObserver";

/**
 * Icon parameters.
 */
export type IconParams = {
  type?: string;
  size?: number;
  style?: React.CSSProperties;
  id?: string,
  className?: string;
};

/**
 * Icon registry.
 */
export const IconRegistry = {
  register(type: string, sources: { black: any; white: any }): void {
    iconMap.set(type, {
      black: typeof sources.black == "string" ? sources.black : sources.black.src,
      white: typeof sources.white == "string" ? sources.white : sources.white.src,
    });
  },
  registerMap(map: Map<string, { black: any; white: any }>): void {
    for (const [type, sources] of map) {
      IconRegistry.register(type, sources);
    }
  },
  unregister(type: string): void {
    iconMap.delete(type);
  },
  get(type: string, color: "white" | "black") {
    const m = iconMap.get(type);
    assert(m !== undefined, "Icon is not defined: " + type);
    return m[color];
  },
};

// Initial icon map
const iconMap = new Map<string, { black: any; white: any }>();

// Initial registers
IconRegistry.registerMap(new Map([
  ["bullet", { black: bullet_black, white: bullet_white }],
  ["checked", { black: checked_black, white: checked_white }],
  ["arrow", { black: arrow_black, white: arrow_white }],
  ["fullarrow", { black: fullarrow_black, white: fullarrow_white }],
  ["search", { black: search_black, white: search_white }],
  ["clear", { black: clear_black, white: clear_white }],
  ["games", { black: games_black, white: games_white }],
  ["ie", { black: ie_black, white: ie_white }],
  ["video", { black: video_black, white: video_white }],
  ["store", { black: store_black, white: store_white }],
  ["settings", { black: settings_black, white: settings_white }],
  ["mail", { black: mail_black, white: mail_white }],
  ["user", { black: user_black, white: user_white }],
  ["security", { black: security_black, white: security_white }],
  ["calc", { black: calc_black, white: calc_white }],
  ["camera", { black: camera_black, white: camera_white }],
  ["bluetooth", { black: bluetooth_black, white: bluetooth_white }],
  ["news", { black: news_black, white: news_white }],
  ["bing", { black: bing_black, white: bing_white }],
  ["opera", { black: opera_black, white: opera_white }],
  ["chrome", { black: chrome_black, white: chrome_white }],
  ["firefox", { black: firefox_black, white: firefox_white }],
  ["msedge", { black: msedge_black, white: msedge_white }],
  ["lapis", { black: lapis_black, white: lapis_white }],
  ["idea", { black: idea_black, white: idea_white }],
  ["help", { black: help_black, white: help_white }],
  ["helpcircle", { black: help_circle_black, white: help_circle_white }],
  ["new", { black: new_black, white: new_white }],
]));

const Img = styled.img<{
  $computed_size: string;
}>`
  && {
    width: ${($) => $.$computed_size};
    height: ${($) => $.$computed_size};
    vertical-align: middle;
  }
`;

/**
 * Icon component.
 */
export function Icon(params: IconParams) {
  // IMG ref
  const ref = useRef(null);

  // Icon color
  const [color, set_color] = useState<string>("white");
  const color_ref = useRef<string>("white");

  // Icon type
  assert(params.type, "Icon type must be specified.");
  const type = params.type;

  // Compute size
  const computed_size =
    params.size !== undefined ? EMConvert.points.emUnit(params.size) : "100%";

  // Adjust color
  useEffect(() => {
    const colorObserver = new ColorObserver(ref.current, (color: Color) => {
      const new_color = color.isLight() ? "white" : "black";
      if (new_color !== color_ref.current) {
        set_color(new_color);
      }
    });

    return () => {
      colorObserver.cleanup();
    };
  }, []);

  // Reflect color
  useEffect(() => {
    color_ref.current = color;
  }, [color]);

  const m = iconMap.get(type);
  assert(m !== undefined, "Icon is not defined: " + type);
  return (
    <Img
      ref={ref}
      src={(m as any)[color]}
      draggable={false}
      alt={type}
      style={params.style}
      className={params.className}
      id={params.id}
      $computed_size={computed_size}
    ></Img>
  );
}

export function CheckedIcon(params: IconParams) {
  return (
    <Icon
      type="checked"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function BulletIcon(params: IconParams) {
  return (
    <Icon
      type="bullet"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function ClearIcon(params: IconParams) {
  return (
    <Icon
      type="clear"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function SearchIcon(params: IconParams) {
  return (
    <Icon
      type="search"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export type ArrowIconParams = {
  direction?: ArrowIconDirection;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
};

export type ArrowIconDirection = "left" | "right" | "up" | "down";

export function ArrowIcon(params: ArrowIconParams) {
  // Direction
  const d = params.direction;

  // Stylize
  const newStyle: React.CSSProperties = {};
  newStyle.transform = `rotate(${d == "left" ? 0 : d == "right" ? 180 : d == "up" ? 90 : -90}deg)`;
  if (params.style) {
    extend(newStyle, params.style);
  }

  return (
    <Icon
      type="arrow"
      size={params.size}
      style={newStyle}
      className={params.className}
      id={params.id}
    />
  );
}

export function UpArrowIcon(params: IconParams) {
  return (
    <ArrowIcon
      direction="up"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function DownArrowIcon(params: IconParams) {
  return (
    <ArrowIcon
      direction="down"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function LeftArrowIcon(params: IconParams) {
  return (
    <ArrowIcon
      direction="left"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function RightArrowIcon(params: IconParams) {
  return (
    <ArrowIcon
      direction="right"
      size={params.size}
      style={params.style}
      className={params.className}
      id={params.id}
    />
  );
}

export function ProgressRing(params: {
  /**
   * Size; note that the definition of "size" is
   * unstable in the `ProgressRing` component for now.
   * The given normal is `size={9}`.
   */
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
}) {
  // Some of the implementation uses code from
  // https://stackoverflow.com/a/20371835/26380963

  // Div ref
  const ref = useRef<null | HTMLDivElement>(null);

  // States
  const [color, set_color] = useState<string>("#fff");
  const [em, set_em] = useState<number>(0);

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
  });

  // Adjust size
  useEffect(() => {
    const em_observer = new EMObserver(ref.current!, em => {
      set_em(em);
    });
    return () => {
      em_observer.cleanup();
    };
  }, []);

  // Animation time in milliseconds
  let time = 4000;

  // Other animation parameters
  let r = -14; // degrees
  let m = 30; // milliseconds

  // Size
  const size = params.size ?? 9;

  return (
    <Div
      ref={ref}
      style={newStyle}
      className={params.className}
      id={params.id}
      $size={size}
      $time={time}
      $color={color}
      $r={r}
      $m={m}
      $em={em}
    >
      <div className="progress-ring__wrap">
        <div className="progress-ring__circle"></div>
      </div>
      <div className="progress-ring__wrap">
        <div className="progress-ring__circle"></div>
      </div>
      <div className="progress-ring__wrap">
        <div className="progress-ring__circle"></div>
      </div>
      <div className="progress-ring__wrap">
        <div className="progress-ring__circle"></div>
      </div>
      <div className="progress-ring__wrap">
        <div className="progress-ring__circle"></div>
      </div>
    </Div>
  );
}

// ProgressRing animation
const orbit = keyframes`
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

const Div = styled.div<{
  $size: number;
  $time: number;
  $color: string;
  $r: number;
  $m: number;
  $em: number;
}>`
  && {
    position: relative;
    padding-top: ${($) => ($.$size * 0.25 * $.$em) / 5}px;
    width: ${($) => $.$size * 0.25 * $.$em}px;
    height: ${($) => $.$size * 0.25 * $.$em}px;
  }

  && .progress-ring__wrap {
    position: absolute;
    width: ${($) => $.$size * 0.25 * $.$em - 2}px;
    height: ${($) => $.$size * 0.25 * $.$em - 2}px;
  }

  && .progress-ring__circle {
    transform: rotate(225deg);
    animation-iteration-count: infinite;
    animation-name: ${orbit};
    animation-duration: ${($) => $.$time}ms;
    width: ${($) => $.$size * 0.25 * $.$em - 2}px;
    height: ${($) => $.$size * 0.25 * $.$em - 2}px;

    opacity: 0;
  }

  && .progress-ring__circle:after {
    content: "";
    position: absolute;
    width: ${($) => ($.$size * 0.25 * $.$em) / 8}px;
    height: ${($) => ($.$size * 0.25 * $.$em) / 8}px;
    border-radius: ${($) => ($.$size * 0.25 * $.$em) / 8}px;
    box-shadow: 0px 0px 5% ${($) => $.$color};
    background: ${($) => $.$color};
  }

  && .progress-ring__wrap:nth-of-type(2) {
    transform: rotate(${($) => $.$r}deg);
  }
  && .progress-ring__wrap:nth-of-type(2) .progress-ring__circle {
    animation-delay: ${($) => $.$time / $.$m}ms;
  }
  && .progress-ring__wrap:nth-of-type(3) {
    transform: rotate(${($) => $.$r * 2}deg);
  }
  && .progress-ring__wrap:nth-of-type(3) .progress-ring__circle {
    animation-delay: ${($) => ($.$time / $.$m) * 2}ms;
  }
  && .progress-ring__wrap:nth-of-type(4) {
    transform: rotate(${($) => $.$r * 3}deg);
  }
  && .progress-ring__wrap:nth-of-type(4) .progress-ring__circle {
    animation-delay: ${($) => ($.$time / $.$m) * 3}ms;
  }
  && .progress-ring__wrap:nth-of-type(5) {
    transform: rotate(${($) => $.$r * 4}deg);
  }
  && .progress-ring__wrap:nth-of-type(5) .progress-ring__circle {
    animation-delay: ${($) => ($.$time / $.$m) * 4}ms;
  }
`;
