import React, { useContext, useRef, useState, useEffect } from "react";
import { css, SerializedStyles } from "@emotion/react";
import Color from "color";
import Draggable, { DraggableData } from "react-draggable";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { ThemeContext, PreferPrimaryColorsContext } from "../theme";
import { RemObserver } from "../utils/RemObserver";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { lighten, enhanceBrightness, contrast } from "../utils/color";
import { clamp } from "../utils/math";

export function CheckBox(options: CheckBoxOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Determine which coloring is preferred
    const preferPrimaryColors = useContext(PreferPrimaryColorsContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Refs
    const button_ref = useRef<HTMLButtonElement | null>(null);
    const unchecked_div_ref = useRef<HTMLDivElement | null>(null);
    const checked_div_ref = useRef<HTMLDivElement | null>(null);
    const carret_ref = useRef<HTMLDivElement | null>();

    // States
    let [value, setValue] = useState<boolean>(!!options.default);
    let [checked_horizontal_pos, set_checked_horizontal_pos] = useState<number>(value ? 0 : 100); // percent
    let [carret_left, set_carret_left] = useState<number>(localeDir == "ltr" ? (value ? 100 : 0) : value ? 0 : 100); // percent
    const [rem, set_rem] = useState<number>(0);

    // Misc.
    const border_width = 0.15;
    const padding = 0.15;
    const side_length = border_width + padding;
    const w = pointsToRemValue(14);
    const h = pointsToRemValue(6.1);
    const carret_w = pointsToRemValue(4);
    const checked_color = enhanceBrightness(theme.colors.background, theme.colors.primaryBackground);
    const checked_hover_color = lighten(checked_color, 0.3);
    const border_color = preferPrimaryColors ? checked_color : contrast(theme.colors.background, 0.4);
    const unchecked_color = preferPrimaryColors ? lighten(checked_color, 0.3) : border_color;
    const unchecked_hover_color = lighten(unchecked_color, 0.3);

    // CSS
    const serializedStyles = css `
        background: none;
        border: ${border_width}rem solid  ${border_color};
        display: flex;
        flex-direction: row;
        padding: ${padding}rem;
        width: ${w}rem;
        height: ${h}rem;
        outline: none;
        position: relative;

        &:hover:not(:disabled), &:focus:not(:disabled) {
            outline: 0.05rem dotted ${theme.colors.focusDashes};
            outline-offset: 0.3rem;
        }

        &:disabled {
            opacity: 0.5;
        }

        & .CheckBox-unchecked-rect {
            background: ${unchecked_color};
            width: 100%;
            height: 100%;
        }

        &:hover .CheckBox-unchecked-rect {
            background: ${unchecked_hover_color};
        }

        & .CheckBox-checked-rect {
            position: absolute;
            ${localeDir == "ltr" ? "left" : "right"}: ${padding}rem;
            top: ${padding}rem;
            bottom: ${padding}rem;
            transition: left 200ms ease-out, right 200ms ease-out;
            background: ${checked_color};
        }

        &:hover .CheckBox-checked-rect {
            background: ${checked_hover_color};
        }
        
        & .CheckBox-carret {
            position: absolute;
            transition: right 200ms ease-out;
            width: ${carret_w}rem;
            height: ${h}rem;
            top: -${side_length / 2}rem;
            background: ${theme.colors.foreground};
        }
    `;

    useEffect(() => {
        const button = button_ref.current!;

        // pass element
        options.element?.(button);
    });

    // Handle click
    function button_onClick()
    {
        if (dragEffective)
        {
            return;
        }

        // Set new value
        value = !value;
        setValue(value);

        // Position carret
        set_carret_left(localeDir == "ltr" ? (value ? 100 : 0) : value ? 0 : 100);

        // Position checked rectangle
        set_checked_horizontal_pos(value ? 0 : 100);

        // Trigger event
        options.change?.(value);
    }

    // Drag state
    const [dragging, set_dragging] = useState<boolean>(false);
    let dragEffective = false;
    let drag_start_x = 0;

    // Carret misc.
    const carret_left_px = ((carret_left / 100) * (w * rem));
    const leftmost_carret_pos = -(side_length / 2) * rem;
    const rightmost_carret_pos = (w * rem) - (side_length * rem) - (carret_w * rem);

    // Handle drag start
    function onDragStart(e: any, data: DraggableData)
    {
        set_dragging(true);
        dragEffective = false;
        drag_start_x = data.x;
    }

    // Handle drag move
    function onDrag(e: any, data: DraggableData)
    {
        carret_left = data.x / (rightmost_carret_pos - leftmost_carret_pos - (side_length / 2) * rem);
        carret_left = clamp(carret_left, 0, 1) * 100;
        carret_left = localeDir == "ltr" ? carret_left : (100 - carret_left);
        set_carret_left(carret_left);
        set_checked_horizontal_pos(100 - carret_left);
    }

    // Handle drag stop
    function onDragStop(e: any, data: DraggableData)
    {
        set_dragging(false);

        dragEffective = drag_start_x != data.x;
        if (!dragEffective)
        {
            button_onClick();
            return;
        }

        // Adjust carret left
        if (localeDir == "ltr")
        {
            if (carret_left < 50)
            {
                value = false;
                set_carret_left(0);
            }
            else
            {
                value = true;
                set_carret_left(100);
            }
        }
        else
        {
            if (carret_left < 50)
            {
                value = false;
                set_carret_left(100);
            }
            else
            {
                value = true;
                set_carret_left(0);
            }
        }

        // Update value
        setValue(value);

        // Position checked rectangle
        set_checked_horizontal_pos(value ? 0 : 100);

        // Trigger event
        options.change?.(value);
    }

    useEffect(() => {
        // Update carret
        set_carret_left(localeDir == "ltr" ? (value ? 100 : 0) : value ? 0 : 100);

        // Position checked rectangle
        set_checked_horizontal_pos(value ? 0 : 100);
    }, [localeDir]);

    useEffect(() => {
        const remObserver = new RemObserver(value => {
            set_rem(value);
        });
        return () => {
            remObserver.cleanup();
        };
    });

    return (
        <button
            ref={button_ref}
            id={options.id}
            css={serializedStyles}
            data-value={value.toString()}
            disabled={options.disabled}
            style={options.style}
            className={options.className}
            onClick={_ => { dragEffective = false; button_onClick() }}>

            <div ref={unchecked_div_ref} className="CheckBox-unchecked-rect">
            </div>
            <div
                ref={checked_div_ref}
                className="CheckBox-checked-rect"
                style={{
                    [localeDir == "ltr" ? "right" : "left"]: "calc(" + (checked_horizontal_pos) + `% + ${padding}rem)`,
                }}>
            </div>
            <Draggable
                axis="x"
                onStart={onDragStart}
                onDrag={onDrag}
                onStop={onDragStop}
                bounds="parent"
                offsetParent={button_ref.current!}
                defaultPosition={{x: carret_left == 0 ? 0 : w * rem, y: 0}}
                position={dragging ? undefined :
                    {
                        x: carret_left_px <= side_length * rem ? leftmost_carret_pos : rightmost_carret_pos,
                        y: 0
                    }}
                >

                <div ref={carret_ref} className="CheckBox-carret"></div>
            </Draggable>
        </button>
    );
}

export type CheckBoxOptions = {
    id?: string,

    style?: React.CSSProperties,
    className?: string,

    /**
     * Default value.
     */
    default?: boolean,

    /**
     * Whether input is disabled.
     */
    disabled?: boolean,

    /**
     * Event triggered on value change.
     */
    change?: (value: boolean) => void,

    element?: (element: HTMLButtonElement) => void,
};