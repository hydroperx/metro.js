import React, { useContext, useRef, useState, useEffect, createContext } from "react";
import { css, SerializedStyles } from "@emotion/react";
import Color from "color";
import { Input } from "com.hydroper.inputaction";
import $ from "jquery";
import assert from "assert";
import { LocaleDirectionContext } from "../layout/LocaleDirection";
import { UpArrowIcon, DownArrowIcon } from "./Icons";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { enhanceBrightness, contrast } from "../utils/color";
import { fontFamily, fontSize, maximumZIndex } from "../utils/common";
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focus";
import { RemObserver } from "../utils/RemObserver";

// Item visible transition
const visibleTransition = "opacity 300ms ease-out, top 300ms ease-out";

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

    // Button inner CSS
    const button_inner_css = `
        & .Select-button-inner {
            display: inline-flex;
            flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
            gap: 0.9rem;
        }
    `;

    // Button arrow CSS
    const button_arrow_css = `
        & .Select-button-arrow {
            display: inline-flex;
            flex-grow: 2;
            flex-direction: ${localeDir == "ltr" ? "row-reverse" : "row"};
            opacity: 0.7;
        }
    `;

    // Dropdown CSS
    const dropdown_serialized_styles = css `
        display: inline-flex;
        visibility: ${visible ? "visible" : "hidden"};
        flex-direction: column;
        position: fixed;
        min-width: 15rem;
        max-height: 25rem;
        background: ${theme.colors.inputBackground};
        border: ${(options.big || options.medium ? "0.3rem" : "0.15rem") + " solid " + theme.colors.inputBorder};
        left: ${x}px;
        top: ${y}px;
        opacity: ${opacity};
        ${transition ? `transition: ${transition};` : ""}
        z-index: ${maximumZIndex};

        & .Select-list {
            display: flex;
            flex-direction: column;
            overflow-y: scroll;
            scrollbar-width: none;
            flex-grow: 3;
        }

        & .Select-up-arrow, & .Select-down-arrow {
            display: ${arrowsVisible ? "flex" : "none"};
            flex-direction: row;
            justify-content: center;
            height: ${pointsToRem(2.5)};
        }
    `;

    if (options.big || options.medium)
    {
        buttonSerializedStyles = css `
            background: none;
            border: none;
            color: ${theme.colors.foreground};
            font-size: ${options.big ? 2 : 1.6}rem;
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

            ${button_inner_css}
            ${button_arrow_css}
        `;
    }
    else if (options.borderless)
    {
        const normal_color = options.primary ? Color(enhanceBrightness(theme.colors.background, theme.colors.primary)).alpha(0.67) : Color(theme.colors.foreground).alpha(0.67);

        buttonSerializedStyles = css `
            background: none;
            border: none;
            color: ${normal_color.toString()};
            font-family: ${fontFamily};
            font-weight: lighter;
            font-size: 0.87rem;
            display: flex;
            flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
            align-items: center;
            padding: ${pointsToRemValue(1)}rem 0.7rem;
            min-width: 5rem;
            outline: none;

            &:hover:not(:disabled), &:focus:not(:disabled) {
                color: ${normal_color.alpha(0.8).toString()};
            }

            &:active:not(:disabled) {
                color: ${normal_color.alpha(1).toString()};
            }

            &:disabled {
                opacity: 0.4;
            }

            ${button_inner_css}
            ${button_arrow_css}
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
                background: ${theme.colors.primary};
                color: ${theme.colors.primaryForeground};
            }

            &:disabled {
                opacity: 0.5;
            }

            ${button_inner_css}
            ${button_arrow_css}
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
            buttonRef.current!.focus();
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
    }, []);

    useEffect(() => {
        const button = buttonRef.current!;

        // Pass element
        options.element?.(button);
    });

    return (
        <>
            <button
                id={options.id}
                ref={buttonRef}
                css={buttonSerializedStyles}
                style={options.style}
                className={options.className}
                disabled={!!options.disabled}
                onClick={open}>
                
                <div className="Select-button-inner" dangerouslySetInnerHTML={{ __html: valueHyperText }}>
                </div>

                <div className="Select-button-arrow">
                    <DownArrowIcon size={options.big ? 6 : options.borderless ? 3.1 : 3.5}/>
                </div>
            </button>
            <SelectOptionBigContext.Provider value={!!options.big || !!options.medium}>
                <div ref={divRef} css={dropdown_serialized_styles}>
                    <div className="Select-up-arrow">
                        <UpArrowIcon size={2.5}/>
                    </div>
                    <div className="Select-list">
                        {options.children}
                    </div>
                    <div className="Select-down-arrow">
                        <DownArrowIcon size={2.5}/>
                    </div>
                </div>
            </SelectOptionBigContext.Provider>
        </>
    );
}

export type SelectOptions = {
    id?: string,

    children?: React.ReactNode,
    style?: React.CSSProperties,
    className?: string,

    borderless?: boolean,

    /**
     * Effective for bordeless non-big selects.
     * When `true` the button color will be the primary one.
     */
    primary?: boolean,

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
     * Whether the input button is a light medium or not.
     */
    medium?: boolean,

    /**
     * Event triggered on value change.
     */
    change?: (value: string) => void,

    element?: (element: HTMLButtonElement) => void,
};

export function SelectOption(options: SelectOptionOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Use the theme context
    const theme = useContext(ThemeContext);

    // Big
    const big = useContext(SelectOptionBigContext);

    // Button ref
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // Build the style class
    const hoverBackground = contrast(theme.colors.inputBackground, 0.1);
    const activeBackground = contrast(theme.colors.inputBackground, 0.15);
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
        font-family: ${fontFamily};
        font-size: ${big ? "1.1rem" : fontSize};
        ${big ? "font-weight: lighter;" : ""}

        &:hover, &:focus {
            background: ${hoverBackground};
        }

        &:active, &[data-selected="true"] {
            background: ${activeBackground};
            color: ${enhanceBrightness(activeBackground, theme.colors.primary)};
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
        <button css={serializedStyles} className={"buttonNavigable" + (options.className ? " " + options.className : "")} onClick={button_onClick} ref={buttonRef} data-value={options.value}>
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

const SelectOptionBigContext = createContext<boolean>(false);