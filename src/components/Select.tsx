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
import { pointsToRem, pointsToRemValue } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";
import { RemObserver } from "../utils/RemObserver";

// Item visible transition
const visibleTransition = "opacity 0.2s ease, top 0.2s ease, bottom 0.2s ease";

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
        color: ${theme.colors.foreground};
        display: flex;
        flex-direction: ${localeDir == "ltr" ? "row" : "row-reverse"};
        gap: 0.9rem;
        padding: ${pointsToRemValue(2) + 0.5}rem 0.7rem;
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

        // Update cooldown
        cooldown = Date.now();

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

        // Base values
        const base_x = buttonRect.x;

        // Adjust initial styles
        for (const option of children)
        {
            option.style.width = button_w + "rem";
            option.style.position = "fixed";
            option.style.left = base_x + "px";
            option.style.transition = "";
            option.style.opacity = "0";
        }
        div.style.width = button_w + "rem";
        div.style.left = base_x + "px";
        div.style.transition = "";

        // Base values
        const base_top = buttonRect.top;
        const base_i = children.indexOf(baseOption);
        baseOption.style.top = `${base_top}px`;
        const baseRect = baseOption.getBoundingClientRect();
        const base_bottom = baseRect.bottom;
        const base_h = baseRect.height;

        // Calculate maximum list top
        const max_list_top = children.slice(0, base_i).reduce((k, e) => k - e.getBoundingClientRect().height, base_top);
        
        // Viewport deviation
        const viewportDeviation = 9 * rem;

        // list top
        let list_top = base_top;
        for (const option of children.slice(0, base_i))
        {
            const h = option.getBoundingClientRect().height;
            if (list_top - h < viewportDeviation) break;
            list_top -= h;
        }

        // find list bottom and set initial top position for option items
        let list_bottom = base_bottom;
        for (const option of children.slice(base_i + 1))
        {
            const h = option.getBoundingClientRect().height;
            option.style.top = (base_top + h / 2) + "px";

            if (list_bottom - h < viewportDeviation) break;
            list_bottom -= h;
        }

        // start list top & bottom
        div.style.top = (base_top + base_h / 2) + "px";
        div.style.bottom = (base_bottom + base_h / 2) + "px";

        // start transition
        transitionTimeout = setTimeout(() => {
            div.style.transition = visibleTransition;
            div.style.top = (list_top / rem) + "rem";
            div.style.bottom = (list_bottom / rem) + "rem";

            // set opacity and top position for options
            let acc = base_top;
            baseOption.style.opacity = "1";
            for (const option of children.slice(0, base_i).reverse())
            {
                const h = option.getBoundingClientRect().height;
                if (acc - h < viewportDeviation) break;
                acc -= h;
                option.style.top = acc + "px";
                option.style.opacity = "1";
            }
            acc = base_top + base_h;
            for (const option of children.slice(base_i + 1))
            {
                const h = option.getBoundingClientRect().height;
                if (acc - h >= window.innerHeight - viewportDeviation) break;
                option.style.top = acc + "px";
                acc += h;
                option.style.opacity = "1";
            }

            // now, revert the "fixed" position of the options
            transitionTimeout = setTimeout(() => {
                for (const option of children)
                {
                    option.style.position = "static";
                    option.style.top = "";
                }
                itemListDiv.scrollTop = base_top - max_list_top;
            }, 200);
        }, 35);
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

        throw new Error("unimplemented")
    }

    function getDiv(): HTMLDivElement {
        return divRef.current! as HTMLDivElement;
    }

    function getUpArrowDiv(): HTMLDivElement {
        return divRef.current!.children[0] as HTMLDivElement;
    }

    function getDownArrowDiv(): HTMLDivElement {
        return divRef.current!.children[2] as HTMLDivElement;
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
                dangerouslySetInnerHTML={{ __html: valueHyperText }}
                onClick={open}>
            </button>
            <div ref={divRef} style={{
                display: "inline-flex",
                visibility: visible ? "visible" : "hidden",
                flexDirection: "column",
                position: "fixed",
                background: theme.colors.inputBackground,
                borderTop: "0.15rem solid " + theme.colors.inputBorder,
                borderBottom: "0.15rem solid " + theme.colors.inputBorder,
                left: x + "px",
                top: y + "px",
                transition,
            }}>
                <div className="up-arrow" style={{display: "flex", flexDirection: "row", justifyContent: "center", height: pointsToRem(2.5)}}>
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
                <div className="down-arrow" style={{display: "flex", flexDirection: "row", justifyContent: "center", height: pointsToRem(2.5)}}>
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
        currentSelectClose?.();
        currentSelectChange?.(options.value);
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