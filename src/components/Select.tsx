import React, { useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/react";
import Color from "color";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { fontSize } from "../utils/commonValues";
import { pointsToRem } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";
import { Input } from "@hydroper/inputaction";
import $ from "jquery";
import assert from "assert";
import { LocaleDirectionContext } from "../layout/LocaleDirection";

// Invoked by the global Input action listener.
let currentInputPressedListener: Function | null = null;

// Globalized input action listener
Input.input.addEventListener("inputPressed", function(): void
{
    currentInputPressedListener?.();
});

// Invoked by the global mouse down event listener
let currentMouseDownListener: Function | null = null;

// Globalized mouse down event listener
window.addEventListener("mousedown", function(): void
{
    currentMouseDownListener?.();
});

/**
 * Represents a list of selectable values.
 */
export function Select(options: SelectOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // State
    const [visible, setVisible] = useState<boolean>(false);
    const [x, setX] = useState<number>(0);
    const [y, setY] = useState<number>(0);
    const [opacity, setOpacity] = useState<number>(0);
    const [transition, setTransition] = useState<string>("");

    // References
    const divRef = useRef<HTMLDivElement | null>(null);

    // Transition timeout
    let transitionTimeout = -1;

    // Open the list
    function open(): void
    {
        fixme();
    }

    // Close the list
    function close(): void
    {
        fixme();
    }

    function getItemListDiv(): HTMLDivElement {
        return divRef.current![1] as HTMLDivElement;
    }

    // Detect mouse down event out of the list,
    // closing itself.
    function viewport_onMouseDown(): void
    {
        if (!visible)
        {
            return;
        }

        fixme();
    }

    // Handle arrows and escape
    function input_onInputPressed(): void
    {
        if (!visible)
        {
            return;
        }

        // Obtain list div
        const listDiv = getItemListDiv();

        // Escape
        if (Input.input.justPressed("escape"))
        {
            close();
            return;
        }

        for (let i = 0; i < listDiv.children.length; i++)
        {
            // Child (item or submenu)
            const child = listDiv.children[i] as HTMLElement;

            // If focused
            if (document.activeElement === child)
            {
                // navigate up
                if (Input.input.justPressed("navigateUp"))
                {
                    focusPrevSibling(child);
                }
                // navigate down
                else if (Input.input.justPressed("navigateDown"))
                {
                    focusNextSibling(child);
                }
                
                return;
            }
        }

        // focus last
        if (Input.input.justPressed("navigateUp"))
        {
            let first = listDiv.firstElementChild;
            if (first)
            {
                focusPrevSibling(first as HTMLElement);
            }
        }
        // focus first
        else if (Input.input.justPressed("navigateDown"))
        {
            let last = listDiv.lastElementChild;
            if (last)
            {
                focusNextSibling(last as HTMLElement);
            }
        }
    }

    useEffect(() => {
        if (visible)
        {
            // Viewport event listeners
            currentMouseDownListener = viewport_onMouseDown;

            // Input listeners
            currentInputPressedListener = input_onInputPressed;
        }
    }, [visible]);

    return (
        <div ref={divRef} id={options.id} style={{
            display: "inline-flex",
            visibility: visible ? "visible" : "hidden",
            flexDirection: "column",
            position: "fixed",
            background: theme.colors.inputBackground,
            borderTop: "0.15rem solid " + theme.colors.inputBorder,
            borderBottom: "0.15rem solid " + theme.colors.inputBorder,
            padding: pointsToRem(2) + " 0",
            minWidth: "12rem",
            left: x + "px",
            top: y + "px",
            opacity: opacity.toString(),
            transition,
        }}>
            <div className="up-arrow"></div>
            <div
                className="list"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "scroll",
                    scrollbarWidth: "none",
                }}>
                {options.children}
            </div>
            <div className="down-arrow"></div>
        </div>
    );
}

export type SelectOptions = {
    children?: React.ReactNode,
    style?: React.CSSProperties,
    className?: string,

    /**
     * Default value.
     */
    default?: string,

    /**
     * Event triggered on value change.
     */
    change?: (value: string) => void,
};