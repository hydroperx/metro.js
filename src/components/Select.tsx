import React, { useContext, useRef, useState, useEffect } from "react";
import { css, SerializedStyles } from "@emotion/react";
import Color from "color";
import { Input } from "@hydroper/inputaction";
import $ from "jquery";
import assert from "assert";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { UpArrowIcon, DownArrowIcon } from "./Icons";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { fontSize } from "../utils/commonValues";
import { pointsToRem } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";
import { RemObserver } from "../utils/RemObserver";

// Item visible transition
const visibleTransition = "opacity 0.2s ease, top 0.2s ease, left 0.2s ease, height 0.2s ease";

// Invoked by the global Input action listener.
let currentInputPressedListener: Function | null = null;

// Globalized input action listener
Input.input.addEventListener("inputPressed", function(): void
{
    currentInputPressedListener?.();
});

// Global function for changing the selected value of an open context menu.
let currentSelectChange: Function | null = null;

// Global function for closing the currently open select.
let currentSelectClose: Function | null = null;

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
    const [transition, setTransition] = useState<string>("");
    const [value, setValue] = useState<string>(options.default ?? "");
    const [valueHyperText, setValueHyperText] = useState<string>("");
    let [rem, setRem] = useState<number>(0);

    // Refs
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const divRef = useRef<HTMLDivElement | null>(null);

    // Transition timeout
    let transitionTimeout = -1;

    // Button CSS
    const hoverBackground = Color(theme.colors.inputBackground).darken(0.4).toString();
    let buttonSerializedStyles: SerializedStyles = css `
        background: ${theme.colors.inputBackground};
        border: 0.15rem solid  ${theme.colors.inputBorder};
        display: flex;
        flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
        gap: 0.9rem;
        padding: ${(pointsToRem(2) + 0.5)}rem 0.7rem";
        min-width: 15rem;
        outline: none;

        &:hover, &:focus {
            background: ${hoverBackground};
        }

        &:active, &[data-selected="true"] {
            background: ${theme.colors.foreground};
            color: ${theme.colors.background};
        }

        &:disabled {
            opacity: 0.5;
        }
    `;

    // Open the list
    function open(): void
    {
        if (visible)
        {
            return;
        }

        // List div
        const itemListDiv = getItemListDiv();
        const children = Array.from(itemListDiv.children) as HTMLButtonElement[];

        // Find the selected entry
        let selectedOption: HTMLButtonElement | null = children
            .find(e => e.getAttribute("data-value") == value) ?? null;

        if (selectedOption)
        {
            // Set the item[data-selected] attribute.
            for (const option of children)
            {
                option.removeAttribute("data-selected");
            }
            selectedOption.setAttribute("data-selected", "true");
        }

        // Base option
        let baseOption: HTMLButtonElement | null = selectedOption;
        if (!baseOption && itemListDiv.firstElementChild)
        {
            assert(itemListDiv.firstElementChild instanceof HTMLButtonElement, "Malformed Select item.");
            baseOption = itemListDiv.firstElementChild as HTMLButtonElement;
        }

        // A base option is needed to open the select list
        if (!baseOption)
        {
            return;
        }

        // Viewport event listeners
        currentMouseDownListener = viewport_onMouseDown;

        // Input listeners
        currentInputPressedListener = input_onInputPressed;

        // Change function
        currentSelectChange = triggerChange;

        // Turn visible
        setVisible(true);

        // Open transition
        openTransition(baseOption);
    }

    // Perform a open-up transition centering the base option
    // to the button.
    function openTransition(baseOption: HTMLButtonElement): void
    {
        // Button
        const button = buttonRef.current!;
        const buttonRect = button.getBoundingClientRect();
        const button_w = buttonRect.width / rem;

        // Div
        const div = getDiv();

        // List div
        const itemListDiv = getItemListDiv();
        const children = Array.from(itemListDiv.children) as HTMLButtonElement[];

        // Adjust initial styles
        for (const option of children)
        {
            option.style.width = button_w + "rem";
            option.style.position = "fixed";
            option.style.transition = "";
        }
        div.style.width = button_w + "rem";
        div.style.transition = "";

        // Base values
        const base_x = buttonRect.x;
        const base_y = buttonRect.y;
        const base_i = children.indexOf(baseOption);

        const list_w = button_w;

        fixme();
    }

    // Trigger value change
    function triggerChange(value: string): void
    {
        if (!visible)
        {
            return;
        }

        // Item list div
        const itemListDiv = getItemListDiv();
        const children = Array.from(itemListDiv.children) as HTMLButtonElement[];

        // Set the item[data-selected] attribute
        for (const option of children)
        {
            option.removeAttribute("data-selected");
        }
        let selectedOption: HTMLButtonElement | null = children
            .find(e => e.getAttribute("data-value") == value) ?? null;
        if (selectedOption)
        {
            selectedOption.setAttribute("data-selected", "true");
        }

        // Dispatch event
        options.change?.(value);
    }

    // Close the list
    function close(): void
    {
        if (!visible)
        {
            return;
        }

        // Cancel last transition
        if (transitionTimeout != -1)
        {
            window.clearTimeout(transitionTimeout);
            transitionTimeout = -1;
        }

        // Viewport event listeners
        currentMouseDownListener = null;

        // Input listeners
        currentInputPressedListener = null;

        // Change function
        currentSelectChange = null;

        fixme();
    }

    function getDiv(): HTMLDivElement {
        return divRef.current! as HTMLDivElement;
    }

    function getUpArrowDiv(): HTMLDivElement {
        return divRef.current![0] as HTMLDivElement;
    }

    function getDownArrowDiv(): HTMLDivElement {
        return divRef.current![2] as HTMLDivElement;
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

            // Change function
            currentSelectChange = triggerChange;
        }
    }, [visible]);

    // Initial change event
    useEffect(() => {
        triggerChange(value);
    }, [value]);

    // Observe rem size
    useEffect(() => {
        const remObserver = new RemObserver(value => {
            setRem(value);
        });
        return () => {
            remObserver.cleanup();
        };
    });

    return (
        <>
            <button
                ref={buttonRef}
                css={buttonSerializedStyles}
                style={options.style}
                className={options.className}
                disabled={!!options.disabled}
                dangerouslySetInnerHTML={{ __html: valueHyperText }}>
            </button>
            <div ref={divRef} style={{
                display: "inline-flex",
                visibility: visible ? "visible" : "hidden",
                flexDirection: "column",
                position: "fixed",
                background: theme.colors.inputBackground,
                borderTop: "0.15rem solid " + theme.colors.inputBorder,
                borderBottom: "0.15rem solid " + theme.colors.inputBorder,
                padding: pointsToRem(2) + " 0",
                left: x + "px",
                top: y + "px",
                transition,
            }}>
                <div className="up-arrow" style={{textAlign: "center"}}>
                    <UpArrowIcon size={2.7}/>
                </div>
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
                <div className="down-arrow" style={{textAlign: "center"}}>
                    <DownArrowIcon size={2.7}/>
                </div>
            </div>
        </>
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
     * Whether input is disabled.
     */
    disabled?: boolean,

    /**
     * Event triggered on value change.
     */
    change?: (value: string) => void,
};

export function SelectItem(options: SelectItemOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Use the theme context
    const theme = useContext(ThemeContext);

    // Button ref
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // Build the style class
    const hoverBackground = Color(theme.colors.inputBackground).darken(0.4).toString();
    const serializedStyles = css `
        display: inline-flex;
        flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
        gap: 0.9rem;
        padding: 0.5rem 0.7rem;
        background: none;
        border: none;
        outline: none;
        color: ${theme.colors.foreground};
        font-size: ${fontSize};

        &:hover, &:focus {
            background: ${hoverBackground};
        }

        &:active, &[data-selected="true"] {
            background: ${theme.colors.foreground};
            color: ${theme.colors.background};
        }

        &:disabled {
            opacity: 0.5;
        }
    `;

    function button_onClick(): void
    {
        currentSelectClose?.();
        currentSelectChange?.(options.value);
    }

    return (
        <button css={serializedStyles} className={options.className} onClick={button_onClick} ref={buttonRef} data-value={options.value}>
            {options.children}
        </button>
    );
}

export type SelectItemOptions = {
    children?: React.ReactNode,
    style?: React.CSSProperties,
    className?: string,

    /**
     * Value.
     */
    value: string,
};