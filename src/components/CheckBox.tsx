import * as React from "react";
import { styled } from "styled-components";
import { Color } from "@hydroperx/color";
import Draggable from "@hydroperx/draggable";
import { RTLContext } from "../layout/RTL";
import { ThemeContext, PrimaryContext, Theme } from "../theme/Theme";
import { EMObserver } from "../utils/EMObserver";
import * as EMConvert from "../utils/EMConvert";
import * as ColorUtils from "../utils/ColorUtils";

/**
 * Checkbox component.
 */
export function CheckBox(params: CheckBoxParams) {
  // Use the theme context
  const theme = React.useContext(ThemeContext);

  // Determine which coloring is preferred
  const preferPrimaryColors = React.useContext(PrimaryContext);

  // ?RTL
  const rtl = React.useContext(RTLContext);
  const rtl_ref = React.useRef<boolean>(rtl);

  // Misc. references
  const button_ref = React.useRef<HTMLButtonElement | null>(null);
  const unchecked_div_ref = React.useRef<HTMLDivElement | null>(null);
  const checked_div_ref = React.useRef<HTMLDivElement | null>(null);
  const carret_ref = React.useRef<HTMLDivElement | null>(null);
  const carret_touched = React.useRef<boolean>(false);

  // States
  const [value, set_value] = React.useState<boolean>(!!params.default);
  const value_ref = React.useRef<boolean>(value);
  let [checked_horizontal_pos, set_checked_horizontal_pos] = React.useState<number>(
    value ? 0 : 100,
  ); // percent
  const [em, set_em] = React.useState<number>(16);
  const em_ref = React.useRef<number>(em);

  // Misc.
  const border_width = 0.15;
  const padding = 0.15;
  const w = EMConvert.points.em(42);
  const h = EMConvert.points.em(18.3);
  const carret_w = EMConvert.points.em(12);
  let checked_color = ColorUtils.enhance({
    background: theme.colors.background,
    color: theme.colors.primary,
  });
  const checked_hover_color = ColorUtils.lighten(checked_color, 0.3);
  const border_color = preferPrimaryColors
    ? checked_color
    : ColorUtils.contrast(theme.colors.background, 0.4);
  let unchecked_color = preferPrimaryColors ? checked_color : border_color;
  const unchecked_hover_color = ColorUtils.lighten(unchecked_color, 0.3);
  if (preferPrimaryColors || Color(theme.colors.background).isDark()) {
    checked_color = ColorUtils.lighten(checked_color, 0.3);
    unchecked_color = ColorUtils.darken(unchecked_color, 0.1);
  }

  // Carret misc.
  const leftmost_carret_pos = -border_width;
  const rightmost_carret_pos = w + border_width - carret_w;
  const center_carret_pos = w/2 - carret_w/2 - border_width;

  // Handle click
  function button_click() {
    window.setTimeout(() => {
      // Do not duplicate carret handler
      if (carret_touched.current) {
        return;
      }

      // Do nothing if dragging
      if (dragging.current) {
        dragging.current = false;
        return;
      }

      // Set new value
      value_ref.current = !value_ref.current;
      set_value(value_ref.current);

      // Trigger event
      params.change?.(value_ref.current);
    }, 7);
  }

  // Handle touch end
  function button_touchEnd() {
    carret_touched.current = true;

    // Do nothing if dragging
    if (dragging.current) {
      dragging.current = false;
      return;
    }

    // Set new value
    value_ref.current = !value_ref.current;
    set_value(value_ref.current);

    // Trigger event
    params.change?.(value_ref.current);

    // Clear flag
    window.setTimeout(() => {
      carret_touched.current = false;
    }, 17);
  }

  // Observe the "em" size
  React.useEffect(() => {
    const em_observer = new EMObserver(button_ref.current!, value => {
      set_em(value);
    });
    return () => {
      em_observer.cleanup();
    };
  }, []);

  // Reflect the "em" size
  React.useEffect(() => {
    em_ref.current = em;
  }, [em]);

  // Observe value
  React.useEffect(() => {
    value_ref.current = value;
    update_positions();
  }, [value]);

  function update_positions() {
    const value = value_ref.current;
    const carret_left = !rtl_ref.current ? (value ? 100 : 0) : value ? 0 : 100;
    carret_ref.current!.style.left = (carret_left/100 * (rightmost_carret_pos - leftmost_carret_pos)) + "em";
    // Position checked rectangle
    set_checked_horizontal_pos(value ? 0 : 100);
  }

  // Reflect/observe ?RTL
  React.useEffect(() => {
    rtl_ref.current = rtl;
    update_positions();
  }, [rtl]);

  // Carret drag-n-drop
  const draggable = React.useRef<Draggable | null>(null);
  const dragging = React.useRef<boolean>(false);
  React.useEffect(() => {
    if (params.disabled) {
      return;
    }
    draggable.current = new Draggable(carret_ref.current!, {
      cascadingUnit: "em",
      threshold: "0.9em",
      setPosition: false,
      limit(x, y, x0, y0) {
        return {
          x: Math.min(Math.max(x, leftmost_carret_pos*em_ref.current), rightmost_carret_pos*em_ref.current),
          y: y0,
        };
      },
      onDragStart() {
        dragging.current = true;
      },
      onDrag(_, x) {
        x /= em_ref.current;

        // Position checked rectangle
        set_checked_horizontal_pos(100 - (x / (rightmost_carret_pos-leftmost_carret_pos))*100);

        // Reset top property set by Draggable
        carret_ref.current!.style.top = "";
      },
      onDragEnd(_, x) {
        x /= em_ref.current;

        // Set new value
        value_ref.current = x >= center_carret_pos;
        if (rtl_ref.current) {
          value_ref.current = !value_ref.current;
        }
        set_value(value_ref.current);
        update_positions();

        // Reset top property set by Draggable
        carret_ref.current!.style.top = "";

        // Trigger event
        params.change?.(value_ref.current);

        // Undo flags
        window.setTimeout(() => {
          dragging.current = false;
          carret_touched.current = false;
        }, 17);
      },
    });

    // Cleanup
    return () => {
      draggable.current?.destroy();
      draggable.current = null;
    };
  }, [params.disabled]);

  return (
    <Button
      ref={val => {
        button_ref.current = val;
        if (typeof params.ref == "function") {
          params.ref(val);
        } else if (params.ref) {
          params.ref.current = val;
        }
      }}
      id={params.id}
      data-value={value.toString()}
      disabled={params.disabled}
      style={params.style}
      className={params.className}
      onClick={e => {
        button_click();
      }}
      $border_width={border_width}
      $border_color={border_color}
      $padding={padding}
      $w={w}
      $h={h}
      $theme={theme}
      $unchecked_color={unchecked_color}
      $unchecked_hover_color={unchecked_hover_color}
      $checked_color={checked_color}
      $checked_hover_color={checked_hover_color}
      $rtl={rtl}
      $carret_w={carret_w}
      $checked_horizontal_pos={checked_horizontal_pos}
    >
      <div ref={unchecked_div_ref} className="checkbox-unchecked-rect"></div>
      <div ref={checked_div_ref} className="checkbox-checked-rect"></div>
      <div
        ref={carret_ref}
        className="checkbox-carret"
        onTouchStart={e => {
          dragging.current = false;
          carret_touched.current = false;
        }}
        onTouchEnd={button_touchEnd as any}>
      </div>
    </Button>
  );
}

export type CheckBoxParams = {
  id?: string;
  style?: React.CSSProperties;
  className?: string;
  ref?: React.Ref<HTMLButtonElement | null>;

  /**
   * Default value.
   */
  default?: boolean;

  /**
   * Whether input is disabled.
   */
  disabled?: boolean;

  /**
   * Event triggered on value change.
   */
  change?: (value: boolean) => void;
};

// CSS
const Button = styled.button<{
  $border_width: number;
  $border_color: string;
  $padding: number;
  $w: number;
  $h: number;
  $theme: Theme;
  $unchecked_color: string;
  $unchecked_hover_color: string;
  $checked_color: string;
  $checked_hover_color: string;
  $rtl: boolean;
  $carret_w: number;
  $checked_horizontal_pos: number;
}>`
  && {
    background: none;
    border: ${$ => $.$border_width}em solid ${$ => $.$border_color};
    display: flex;
    flex-direction: row;
    padding: ${$ => $.$padding}em;
    width: ${$ => $.$w}em;
    height: ${$ => $.$h}em;
    outline: none;
    position: relative;
  }

  &&:hover:not(:disabled),
  &&:focus:not(:disabled) {
    outline: 0.05em dotted ${$ => $.$theme.colors.focusDashes};
    outline-offset: 0.3em;
  }

  &&:disabled {
    opacity: 0.5;
  }

  && .checkbox-unchecked-rect {
    background: ${$ => $.$unchecked_color};
    width: 100%;
    height: 100%;
  }

  &&:hover:not(:disabled) .checkbox-unchecked-rect {
    background: ${$ => $.$unchecked_hover_color};
  }

  && .checkbox-checked-rect {
    position: absolute;
    ${$ => (!$.$rtl ? "left" : "right")}: 0;
    ${$ => (!$.$rtl ? "right" : "left")}: ${$ => $.$checked_horizontal_pos}%;
    top: 0;
    bottom: 0;
    transition: left 110ms ease-out, right 110ms ease-out;
    background: ${$ => $.$checked_color};
  }

  &&:hover:not(:disabled) .checkbox-checked-rect {
    background: ${$ => $.$checked_hover_color};
  }

  && .checkbox-carret {
    position: absolute;
    transition: left 110ms ease-out, top 110ms ease-out;
    width: ${$ => $.$carret_w}em;
    top: -0.4em;
    bottom: -0.4em;
    background: ${$ => $.$theme.colors.foreground};
  }
`;