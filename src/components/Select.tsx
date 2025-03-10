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
import { fontFamily, fontSize, maximumZIndex } from "../utils/common";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";
import { RemObserver } from "../utils/RemObserver";

// Item visible transition
const visibleTransition = "opacity 300ms ease, top 300ms ease";

// Invoked by the global Input action listener.
let currentInputPressedListener: Function | null = null;

// Globalized input action listener
Input.input.addEventListener("inputPressed", function(e: Event): void
{
    currentInputPressedListener?.(e);
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

// Cooldown when clicking options
let cooldown = 0;

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
    const [arrowsVisible, setArrowsVisible] = useState<boolean>(false);
    const [value, setValue] = useState<string>(options.default ?? "");
    const [valueHyperText, setValueHyperText] = useState<string>("");
    const [rem, setRem] = useState<number>(0);

    // Refs
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const divRef = useRef<HTMLDivElement | null>(null);

    // Transition timeout
    let transitionTimeout = -1;

    // Button CSS
    const hoverBackground = Color(theme.colors.inputBackground).darken(0.4).toString();
    let buttonSerializedStyles: SerializedStyles = null;
    
    if (options.big)
    {
        buttonSerializedStyles = css `
            background: none;
            border: none;
            color: ${theme.colors.foreground};
            font-size: 2rem;
            font-family: ${fontFamily};
            font-weight: lighter;
            outline: none;
            display: flex;
            gap: 1rem;
            flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
            align-items: center;
            padding: ${pointsToRemValue(2)}rem 0.7rem;
            min-width: 10rem;
            opacity: 0.7;

            &:hover:not(:disabled), &:focus:not(:disabled), &:active:not(:disabled) {
                opacity: 1;
            }

            &:disabled {
                opacity: 0.4;
            }
        `;
    }
    else
    {
        buttonSerializedStyles = css `
            background: ${theme.colors.inputBackground};
            border: 0.15rem solid  ${theme.colors.inputBorder};
            color: ${theme.colors.foreground};
            font-family: ${fontFamily};
            font-size: ${fontSize};
            display: flex;
            flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
            align-items: center;
            padding: ${pointsToRemValue(2) + 0.15}rem 0.7rem;
            min-width: 15rem;
            outline: none;

            &:hover:not(:disabled), &:focus:not(:disabled) {
                background: ${hoverBackground};
            }

            &:active:not(:disabled) {
                background: ${theme.colors.foreground};
                color: ${theme.colors.background};
            }

            &:disabled {
                opacity: 0.5;
            }
        `;
    }

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

        // Update cooldown
        cooldown = Date.now();

        // Viewport event listeners
        currentMouseDownListener = viewport_onMouseDown;

        // Input listeners
        currentInputPressedListener = input_onInputPressed;

        // Change function
        currentSelectChange = triggerChange;

        // Close function
        currentSelectClose = close;

        // Turn visible
        setVisible(true);

        // Div
        const div = getDiv();

        // Turn arrows visible or hidden
        const k_scroll = itemListDiv.scrollTop;
        itemListDiv.scrollTop = 10;
        setArrowsVisible(itemListDiv.scrollTop != 0);
        itemListDiv.scrollTop = k_scroll;

        // Position after button.
        const [x, y, sideResolution] = computePosition(buttonRef.current!, div, {
            prefer: "bottom",
            margin: 3,
        });

        // Stop transition
        setTransition("");

        div.style.height = "";
        if (y + div.getBoundingClientRect().height > window.innerHeight)
        {
            div.style.height = ((window.innerHeight - 10 - y) / rem) + "rem";
        }

        // (x, y) transition
        const timeoutDelay = 45;
        switch (sideResolution)
        {
            case "top":
            {
                setX(x);
                setY(y + 15);
                setOpacity(0);
                transitionTimeout = window.setTimeout(() => {
                    setTransition(visibleTransition);
                    setOpacity(1);
                    setY(y);

                    // Focus base option
                    baseOption?.focus();
                }, timeoutDelay);
                break;
            }
            case "bottom":
            {
                setX(x);
                setY(y - 15);
                setOpacity(0);
                transitionTimeout = window.setTimeout(() => {
                    setTransition(visibleTransition);
                    setOpacity(1);
                    setY(y);

                    // Focus base option
                    baseOption?.focus();
                }, timeoutDelay);
                break;
            }
        }
    }

    // Trigger value change
    function triggerChange(value: string): void
    {
        // Set value
        setValue(value);

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
            setValueHyperText(selectedOption.innerHTML);
        }

        // Dispatch event
        options.change?.(value);

        // Focus button
        buttonRef.current!.focus();
    }

    // Close the list
    function close(): void
    {
        if (!visible || options.disabled)
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

        // Close function
        currentSelectClose = null;

        // Turn invisible
        setVisible(false);
    }

    function getDiv(): HTMLDivElement {
        return divRef.current! as HTMLDivElement;
    }

    function getItemListDiv(): HTMLDivElement {
        return divRef.current!.children[1] as HTMLDivElement;
    }

    // Detect mouse down event out of the list, closing itself.
    function viewport_onMouseDown(): void
    {
        if (!visible)
        {
            return;
        }

        const div = getDiv();
        if (div.matches(":hover"))
        {
            return;
        }

        close();
    }

    // Handle arrows and escape
    function input_onInputPressed(e: Event): void
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
                    e.preventDefault();
                    focusPrevSibling(child);
                }
                // navigate down
                else if (Input.input.justPressed("navigateDown"))
                {
                    e.preventDefault();
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
                e.preventDefault();
                focusPrevSibling(first as HTMLElement);
            }
        }
        // focus first
        else if (Input.input.justPressed("navigateDown"))
        {
            let last = listDiv.lastElementChild;
            if (last)
            {
                e.preventDefault();
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

            // Close function
            currentSelectClose = close;
        }
    }, [visible]);

    // Initial change event
    useEffect(() => {
        triggerChange(value);
    }, [value]);

    // Observe CSS rem unit
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
                onClick={open}>
                
                <div style={{
                    display: "inline-flex",
                    flexDirection: localeDir == "ltr" ? "row" : "row-reverse",
                    gap: "0.9rem"
                }} dangerouslySetInnerHTML={{ __html: valueHyperText }}>
                </div>

                <div style={{
                    display: "inline-flex",
                    flexGrow: 2,
                    flexDirection: localeDir == "ltr" ? "row-reverse" : "row",
                    opacity: "0.7",
                }}>
                    <DownArrowIcon size={options.big ? 6 : 3.5}/>
                </div>
            </button>
            <div ref={divRef} style={{
                display: "inline-flex",
                visibility: visible ? "visible" : "hidden",
                flexDirection: "column",
                position: "fixed",
                minWidth: "15rem",
                maxHeight: "25rem",
                background: theme.colors.inputBackground,
                border: "0.15rem solid " + theme.colors.inputBorder,
                left: x + "px",
                top: y + "px",
                opacity: opacity.toString(),
                transition,
                zIndex: maximumZIndex,
            }}>
                <div className="up-arrow" style={{display: arrowsVisible ? "flex" : "none", flexDirection: "row", justifyContent: "center", height: pointsToRem(2.5)}}>
                    <UpArrowIcon size={2.5}/>
                </div>
                <div
                    className="list"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        overflowY: "scroll",
                        scrollbarWidth: "none",
                        flexGrow: "3",
                    }}>
                    {options.children}
                </div>
                <div className="down-arrow" style={{display: arrowsVisible ? "flex" : "none", flexDirection: "row", justifyContent: "center", height: pointsToRem(2.5)}}>
                    <DownArrowIcon size={2.5}/>
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
     * Whether the input button is a light big or not.
     */
    big?: boolean,

    /**
     * Event triggered on value change.
     */
    change?: (value: string) => void,
};

export function SelectOption(options: SelectOptionOptions)
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
        flex-wrap: wrap;
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
        if (cooldown > Date.now() - 50)
        {
            return;
        }
        currentSelectChange?.(options.value);
        currentSelectClose?.();
    }

    return (
        <button css={serializedStyles} className={options.className} onClick={button_onClick} ref={buttonRef} data-value={options.value}>
            {options.children}
        </button>
    );
}

export type SelectOptionOptions = {
    children?: React.ReactNode,
    style?: React.CSSProperties,
    className?: string,

    /**
     * Value.
     */
    value: string,
};