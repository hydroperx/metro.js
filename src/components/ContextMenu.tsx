import { TypedEventTarget } from "@hydroper/typedeventtarget";
import { useContext, useRef, useState, useEffect } from "react";
import { css } from "@emotion/css";
import Color from "color";
import { computePosition, fitViewportPosition, Side } from "../utils/placement";
import { ThemeContext } from "../theme";
import { fontSize } from "../utils/commonValues";
import { pointsToRem } from "../utils/points";
import { focusPrevSibling, focusNextSibling } from "../utils/focusability";
import assert from "assert";
import { Input } from "@hydroper/inputaction";
import { ArrowIcon, BulletIcon, CheckedIcon, IconOptions } from "./Icons";
import { LocaleDirectionContext } from "../layout/LocaleDirection";

class ContextMenuEventDispatcher extends (EventTarget as TypedEventTarget<{
    show: CustomEvent<ContextMenuEvent>;
    hideAll: CustomEvent<ContextMenuEvent>;
}>) {}

interface ContextMenuEvent {
    readonly id: string;
    readonly event: MouseEvent | undefined;
    readonly position: [number, number] | undefined;
    readonly reference: HTMLElement | undefined;
    readonly prefer: Side | undefined;
}

// Transition used in context menus.
const visibleTransition = "opacity 0.3s ease, top 0.3s ease, left 0.3s ease";

// Event dispatcher used for sending signals to
// context menus, such as requests to show them and to hide them.
const eventDispatcher = new ContextMenuEventDispatcher();

// Items representing submenus are identified by this class name.
const submenuItemClassName = "ContextMenuSubmenu-item";

// Submenus are identified by this class name.
const submenuClassName = "ContextMenuSubmenuList-submenu";

// Weak map allowing to remove Input listeners of submenus reliably.
// The keys are the submenu lists themselves, not the submenu representing items.
const submenuInputPressedListeners = new WeakMap<HTMLDivElement, Function>();

/**
 * Hook for using a context menu.
 */
export function useContextMenu(): UseContextMenuHook
{
    const id = "cxm$" + [0,0,0,0,0,0,0].map(_ => randomHex()).join("");

    return {
        id,

        show: function(options: ContextMenuShowOptions) {
            // Hide other context menu first
            hideAllContextMenu();

            // Dispatch a show event
            setTimeout(() => {
                eventDispatcher.dispatchEvent(new CustomEvent("show", {
                    detail: {
                        id,
                        event: options.event,
                        position: options.position,
                        reference: options.reference,
                        prefer: options.prefer,
                    }
                }));
            }, 300);
        },
    };
}

export type UseContextMenuHook = {
    id: string,
    show: (options: ContextMenuShowOptions) => void,
};

/**
 * Context menu show options.
 */
export type ContextMenuShowOptions = {
    /**
     * Preferred placement side.
     */
    prefer?: Side,
    /**
     * Original cause mouse event, if any.
     */
    event?: MouseEvent,
    /**
     * Position (x, y), if any.
     */
    position?: [number, number],
    /**
     * Reference element to where placement of the context menu occurs.
     */
    reference?: HTMLElement,
};

/**
 * Hides all open context menu.
 */
export function hideAllContextMenu(): void
{
    eventDispatcher.dispatchEvent(new CustomEvent("hideAll", {
        detail: { id: "" }
    }));
}

/**
 * Generates a random 1-5 digits hexadecimal string.
 */
function randomHex()
{
    return Math.floor(Math.random() * 0xF_FF_FF).toString(16);
}

/**
 * Represents a context menu.
 */
export function ContextMenu(options: ContextMenuOptions)
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

    // Handle "show" signal
    function eventDispatcher_onShow(e: CustomEvent<ContextMenuEvent>): void
    {
        // Identifier must match
        if (e.detail.id !== options.id)
        {
            return;
        }

        // Turn context menu visible
        setVisible(true);

        // Obtain div element
        const div = divRef.current!;

        // Disable transition
        setTransition("");

        // Viewport event listeners
        window.removeEventListener("mousedown", viewport_onMouseDown);
        window.addEventListener("mousedown", viewport_onMouseDown);

        // Input listeners
        Input.input.removeEventListener("inputPressed", input_onInputPressed);
        Input.input.addEventListener("inputPressed", input_onInputPressed);

        // Side resolution
        let sideResolution: Side = "bottom";

        // Resulting positions
        let x = 0, y = 0;

        if (e.detail.reference)
        {
            // Position context menu after a reference element.
            [x, y, sideResolution] = computePosition(e.detail.reference, div, {
                prefer: e.detail.prefer,
            });
        }
        else
        {
            // Position context menu at a given point.
            assert(e.detail.event !== undefined || e.detail.position !== undefined, "At least a position must be specified when showing a context menu.");
            let x1 = 0, y1 = 0;
            if (e.detail.event)
            {
                x1 = e.detail.event.clientX;
                y1 = e.detail.event.clientY;
            }
            else
            {
                [x1, y1] = e.detail.position;
            }

            [x, y] = fitViewportPosition(div, [x1, y1]);
        }

        // (x, y) transition
        const timeoutDelay = 35;
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
                }, timeoutDelay);
                break;
            }
            case "left":
            {
                setY(y);
                setX(x + 15);
                setOpacity(0);
                transitionTimeout = window.setTimeout(() => {
                    setTransition(visibleTransition);
                    setOpacity(1);
                    setX(x);
                }, timeoutDelay);
                break;
            }
            case "right":
            {
                setY(y);
                setX(x - 15);
                setOpacity(0);
                transitionTimeout = window.setTimeout(() => {
                    setTransition(visibleTransition);
                    setOpacity(1);
                    setX(x);
                }, timeoutDelay);
                break;
            }
        }
    }

    // Handle "hideAll" signal
    function hideAll(): void
    {
        // Obtain div element
        const divElement = divRef.current!;

        // Hide base context menu
        setVisible(false);

        if (transitionTimeout !== -1)
        {
            clearTimeout(transitionTimeout);
            transitionTimeout = -1;
        }

        // Viewport event listeners
        window.removeEventListener("mousedown", viewport_onMouseDown);

        // Input listeners
        Input.input.removeEventListener("inputPressed", input_onInputPressed);

        // Hide submenus by querying their classes
        for (const div of Array.from(divElement.querySelectorAll("." + submenuClassName)) as HTMLDivElement[])
        {
            div.style.visibility = "hidden";
            const listener = submenuInputPressedListeners.get(div);
            if (listener)
            {
                Input.input.removeEventListener("inputPressed", listener as any);
            }
        }
    }

    // Detect mouse down event out of the context menu,
    // closing all connected menus.
    function viewport_onMouseDown(): void
    {
        // Obtain div element
        const div = divRef.current!;

        // Test hover
        let out = true;
        if (div.style.visibility === "visible")
        {
            if (div.matches(":hover"))
            {
                out = false;
            }

            if (out)
            {
                for (const div1 of Array.from(div.querySelectorAll("." + submenuClassName)) as HTMLDivElement[])
                {
                    if (div1.style.visibility === "hidden")
                    {
                        continue;
                    }
                    // Test hover
                    if (div1.matches(":hover"))
                    {
                        out = false;
                        break;
                    }
                }
            }
        }

        if (out)
        {
            hideAll();
        }
    }

    // Handle arrows and escape
    function input_onInputPressed(): void
    {
        // Obtain div element
        const div = divRef.current!;

        if (Input.input.justPressed("escape"))
        {
            // If this is the innermost context menu open, close it.
            const innermost = !Array.from(div.querySelectorAll("." + submenuClassName))
                .some(div => (div as HTMLElement).style.visibility == "visible");
            if (innermost)
            {
                // since this is the only context menu open, just close "all".
                hideAllContextMenu();
            }

            return;
        }

        for (let i = 0; i < div.children.length; i++)
        {
            // Child (item or submenu)
            const child = div.children[i] as HTMLElement;

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
                // open submenu
                else if (Input.input.justPressed(localeDir == "ltr" ? "navigateRight" : "navigateLeft") && child.classList.contains(submenuItemClassName))
                {
                    (child as HTMLButtonElement).click();
                }
                
                return;
            }
        }

        // If this is the innermost context menu open
        const innermost = !Array.from(div.querySelectorAll("." + submenuClassName))
                .some(div => (div as HTMLElement).style.visibility == "visible");
        if (innermost)
        {
            // focus last
            if (Input.input.justPressed("navigateUp"))
            {
                let first = div.children.length == 0 ? null : div.children[0];
                if (first)
                {
                    focusPrevSibling(first as HTMLElement);
                }
            }
            // focus first
            else if (Input.input.justPressed("navigateDown"))
            {
                let last = div.children.length == 0 ? null : div.children[div.children.length - 1];
                if (last)
                {
                    focusNextSibling(last as HTMLElement);
                }
            }
        }
    }

    eventDispatcher.addEventListener("show", eventDispatcher_onShow);
    eventDispatcher.addEventListener("hideAll", hideAll);

    useEffect(() => {
        if (visible)
        {
            // Viewport event listeners
            window.removeEventListener("mousedown", viewport_onMouseDown);
            window.addEventListener("mousedown", viewport_onMouseDown);

            // Input listeners
            Input.input.removeEventListener("inputPressed", input_onInputPressed);
            Input.input.addEventListener("inputPressed", input_onInputPressed);
        }

        // Cleanup
        return () => {
            // Viewport event listeners
            window.removeEventListener("mousedown", viewport_onMouseDown);

            // Input listeners
            Input.input.removeEventListener("inputPressed", input_onInputPressed);

            // Event dispatcher listeners
            eventDispatcher.removeEventListener("show", eventDispatcher_onShow);
            eventDispatcher.removeEventListener("hideAll", hideAll);
        };
    });

    return (
        <div ref={divRef} id={options.id} style={{
            display: "inline-flex",
            visibility: visible ? "visible" : "hidden",
            flexDirection: "column",
            position: "fixed",
            background: theme.colors.inputBackground,
            border: "0.15rem solid " + theme.colors.inputBorder,
            padding: pointsToRem(2) + " 0",
            minWidth: "12rem",
            left: x + "px",
            top: y + "px",
            opacity: opacity.toString(),
            transition,
        }}>
            {options.children}
        </div>
    );
}

export type ContextMenuOptions = {
    /**
     * The context menu identifier must be the same
     * as the one returned from its respective `useContextMenu()` hook.
     */
    id: string,

    children?: React.ReactNode,
};

/**
 * A context menu item.
 */
export function ContextMenuItem(options: ContextMenuItemOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Use the theme context
    const theme = useContext(ThemeContext);

    // Button ref
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // Build the style class
    const hoverBackground = Color(theme.colors.inputBackground).darken(0.4).toString();
    const className = css `
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

        &:active {
            background: ${theme.colors.foreground};
            color: ${theme.colors.background};
        }

        &:disabled {
            opacity: 0.5;
        }
    `;

    function hideAllFromParent(element: HTMLElement): void
    {
        const parent = element.parentElement;
        for (const divElement of Array.from(parent.querySelectorAll("." + submenuClassName)))
        {
            (divElement as HTMLElement).style.visibility = "hidden";
        }
    }

    function button_onMouseX(_e: MouseEvent): void
    {
        const button = buttonRef.current!;
        hideAllFromParent(button);
    }

    useEffect(() => {
        const buttonElement = buttonRef.current!;

        buttonElement.addEventListener("mouseover", button_onMouseX);
    });
    
    function button_onClick(): void
    {
        hideAllContextMenu();
        options.click?.();
    }

    return (
        <button className={className + " " + options.className} disabled={options.disabled} onClick={button_onClick} ref={buttonRef}>
            {options.children}
        </button>
    );
}

export type ContextMenuItemOptions = {
    className?: string,

    disabled?: boolean,
    children?: React.ReactNode,
    click?: () => void,
};

/**
 * A column in a context menu item for reserving space
 * for "checked" and "selected option" signs.
 */
export function ContextMenuCheck(options: ContextMenuCheckOptions)
{
    // Size
    const size = pointsToRem(3);

    return (
        <span style={{ width: size, height: size }}>
            {
                options.state == "none" ? undefined :
                options.state == "checked" ? <CheckedIcon/> : <BulletIcon/>}
        </span>
    );
}

export type ContextMenuCheckOptions = {
    state?: ContextMenuCheckState,
};

export type ContextMenuCheckState = "none" | "checked" | "option";

/**
 * A column in a context menu item for reserving space
 * for an icon.
 */
export function ContextMenuIcon(options: ContextMenuIconOptions)
{
    // Size
    const size = pointsToRem(3);

    return (
        <span style={{ width: size, height: size }}>
            {options.children}
        </span>
    );
}

export type ContextMenuIconOptions = {
    children?: React.ReactNode,
};

/**
 * A column in a context menu item for reserving space
 * for a label.
 */
export function ContextMenuLabel(options: ContextMenuLabelOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    return (
        <span style={{...(localeDir == "ltr" ? {} : { textAlign: "right" })}}>
            {options.children}
        </span>
    );
}

export type ContextMenuLabelOptions = {
    children?: React.ReactNode,
};

/**
 * A column in a context menu item for reserving space
 * for a shortcut label or a right icon.
 */
export function ContextMenuRight(options: ContextMenuRightOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Minimum size for an icon
    const size = pointsToRem(3);

    return (
        <span style={{flexGrow: 4, marginLeft: localeDir == "ltr" ? "2rem" : "", marginRight: localeDir == "rtl" ? "2rem" : "", textAlign: localeDir == "ltr" ? "right" : "left", fontSize: "0.8rem", opacity: "0.6", minWidth: size, minHeight: size}}>
            {options.children}
        </span>
    );
}

export type ContextMenuRightOptions = {
    children?: React.ReactNode,
};

/**
 * A submenu of a context menu.
 */
export function ContextMenuSubmenu(options: ContextMenuSubmenuOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // Use the theme context
    const theme = useContext(ThemeContext);

    // Button reference
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // Build the style class
    const hoverBackground = Color(theme.colors.inputBackground).darken(0.4).toString();
    const className = css `
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

        &:active {
            background: ${theme.colors.foreground};
            color: ${theme.colors.background};
        }
    `;

    // Transition timeout
    let transitionTimeout = -1;

    function show(div: HTMLDivElement): void
    {
        // Hide all context menu's submenus from the parent
        hideAllFromParent(div, true);

        // Do not re-open the submenu.
        if (div.style.visibility == "visible")
        {
            return;
        }

        // Turn visible
        div.style.visibility = "visible";

        // Disable transition
        div.style.transition = "";

        // Button
        const buttonElement = buttonRef.current!;

        // Input listeners
        Input.input.removeEventListener("inputPressed", input_onInputPressed);
        Input.input.addEventListener("inputPressed", input_onInputPressed);

        // Position context menu after butotn.
        const [x, y, sideResolution] = computePosition(buttonElement, div, {
            prefer: localeDir == "ltr" ? "right" : "left",
        });
        div.style.left = x + "px";
        div.style.top = y + "px";

        // (x, y) transition
        const timeoutDelay = 25;
        switch (sideResolution)
        {
            case "top":
            {
                div.style.left = x + "px";
                div.style.top = (y + 15) + "px";
                div.style.opacity = "0";
                transitionTimeout = window.setTimeout(() => {
                    div.style.transition = visibleTransition;
                    div.style.opacity = "1";
                    div.style.top = y + "px";
                }, timeoutDelay);
                break;
            }
            case "bottom":
            {
                div.style.left = x + "px";
                div.style.top = (y - 15) + "px";
                div.style.opacity = "0";
                transitionTimeout = window.setTimeout(() => {
                    div.style.transition = visibleTransition;
                    div.style.opacity = "1";
                    div.style.top = y + "px";
                }, timeoutDelay);
                break;
            }
            case "left":
            {
                div.style.top = y + "px";
                div.style.left = (x + 15) + "px";
                div.style.opacity = "0";
                transitionTimeout = window.setTimeout(() => {
                    div.style.transition = visibleTransition;
                    div.style.opacity = "1";
                    div.style.left = x + "px";
                }, timeoutDelay);
                break;
            }
            case "right":
            {
                div.style.top = y + "px";
                div.style.left = (x - 15) + "px";
                div.style.opacity = "0";
                transitionTimeout = window.setTimeout(() => {
                    div.style.transition = visibleTransition;
                    div.style.opacity = "1";
                    div.style.left = x + "px";
                }, timeoutDelay);
                break;
            }
        }
    }

    function hideAllFromParent(element: HTMLElement, excludeSelf: boolean = false): void
    {
        if (transitionTimeout !== -1)
        {
            clearTimeout(transitionTimeout);
            transitionTimeout = -1;
        }

        const parent = element.parentElement;
        const divs = Array.from(parent.querySelectorAll("." + submenuClassName)) as HTMLDivElement[];

        // Exclude self submenu
        if (excludeSelf)
        {
            if (element instanceof HTMLButtonElement)
            {
                element = element.nextElementSibling as HTMLElement;
            }
            const i = divs.indexOf(element as HTMLDivElement);
            if (i !== -1)
            {
                divs.splice(i, 1);
            }
        }

        for (const div of divs)
        {
            div.style.visibility = "hidden";
            const listener = submenuInputPressedListeners.get(div);
            if (listener)
            {
                Input.input.removeEventListener("inputPressed", listener as any);
            }
        }
    }

    function button_onClick(_e: MouseEvent): void
    {
        const buttonElement = buttonRef.current!;

        assert(buttonElement.nextElementSibling.classList.contains(submenuClassName));
        show(buttonElement.nextElementSibling as HTMLDivElement);
    }

    let hoverTimeout: number = -1;

    function button_onMouseOver(e: MouseEvent): void
    {
        hoverTimeout = window.setTimeout(() => {
            const buttonElement = buttonRef.current!;

            assert(buttonElement.nextElementSibling.classList.contains(submenuClassName));
            show(buttonElement.nextElementSibling as HTMLDivElement);
        }, 500);
    }

    function button_onMouseOut(e: MouseEvent): void
    {
        if (hoverTimeout !== -1)
        {
            clearTimeout(hoverTimeout);
            hoverTimeout = -1;
        }
    }

    // Handle arrows and escape
    function input_onInputPressed(): void
    {
        // Obtain button element
        const button = buttonRef.current!;

        // Obtain div element
        const div = button.nextElementSibling as HTMLDivElement;

        if (Input.input.justPressed("escape"))
        {
            // If this is the innermost context menu open, close it.
            const innermost = !Array.from(div.querySelectorAll("." + submenuClassName))
                .some(div => (div as HTMLElement).style.visibility == "visible");
            if (innermost)
            {
                hideAllFromParent(div);

                // focus back the submenu representing item.
                button.focus();
            }

            return;
        }

        for (let i = 0; i < div.children.length; i++)
        {
            // Child (item or submenu)
            const child = div.children[i] as HTMLElement;

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
                // open submenu
                else if (Input.input.justPressed(localeDir == "ltr" ? "navigateRight" : "navigateLeft") && child.classList.contains(submenuItemClassName))
                {
                    (child as HTMLButtonElement).click();
                }
                // close current submenu
                else if (Input.input.justPressed(localeDir == "ltr" ? "navigateLeft" : "navigateRight"))
                {
                    hideAllFromParent(div);

                    // focus back the submenu representing item.
                    button.focus();
                }

                return;
            }
        }

        // If this is the innermost context menu open
        const innermost = !Array.from(div.querySelectorAll("." + submenuClassName))
                .some(div => (div as HTMLElement).style.visibility == "visible");
        if (innermost)
        {
            // focus last
            if (Input.input.justPressed("navigateUp"))
            {
                let first = div.children.length == 0 ? null : div.children[0];
                if (first)
                {
                    focusPrevSibling(first as HTMLElement);
                }
            }
            // focus first
            else if (Input.input.justPressed("navigateDown"))
            {
                let last = div.children.length == 0 ? null : div.children[div.children.length - 1];
                if (last)
                {
                    focusNextSibling(last as HTMLElement);
                }
            }
            // close current submenu
            else if (Input.input.justPressed(localeDir == "ltr" ? "navigateLeft" : "navigateRight"))
            {
                hideAllFromParent(div);

                // focus back the submenu representing item.
                button.focus();
            }
        }
    }

    useEffect(() => {
        const buttonElement = buttonRef.current!;

        buttonElement.addEventListener("mouseover", button_onMouseOver);
        buttonElement.addEventListener("mouseout", button_onMouseOut);
        buttonElement.addEventListener("click", button_onClick);

        // Obtain submenu list div
        const div = buttonElement.nextElementSibling as HTMLDivElement;

        // Track input pressed listener
        if (div)
        {
            submenuInputPressedListeners.set(div, input_onInputPressed);
            Input.input.removeEventListener("inputPressed", input_onInputPressed);
            Input.input.addEventListener("inputPressed", input_onInputPressed);
        }

        return () => {
            // Input listeners
            Input.input.removeEventListener("inputPressed", input_onInputPressed);
            submenuInputPressedListeners.delete(div);
        };
    });

    return (
        <button className={className + " " + submenuItemClassName} ref={buttonRef}>
            {options.children}
        </button>
    );
}

export type ContextMenuSubmenuOptions = {
    children?: React.ReactNode,
};

/**
 * List of menu items under a submenu of a context menu.
 */
export function ContextMenuSubmenuList(options: ContextMenuSubmenuListOptions)
{
    // Use the theme context
    const theme = useContext(ThemeContext);

    // References
    const divRef = useRef<HTMLDivElement | null>(null);

    return (
        <div
            ref={divRef}
            className={submenuClassName}
            style={{
                display: "inline-flex",
                visibility: "hidden",
                flexDirection: "column",
                position: "fixed",
                background: theme.colors.inputBackground,
                border: "0.15rem solid " + theme.colors.inputBorder,
                padding: pointsToRem(2) + " 0",
                minWidth: "12rem",
                opacity: "0",
            }}>
            {options.children}
        </div>
    );
}

export type ContextMenuSubmenuListOptions = {
    children?: React.ReactNode,
};

/**
 * Context menu submenu arrow icon (left or right depending on locale).
 */
export function ContextMenuSubIcon(options: IconOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    return <ArrowIcon direction={localeDir == "ltr" ? "right" : "left"} size={options.size ?? 3} style={options.style}/>;
}

/**
 * A context menu horizontal separator.
 */
export function ContextMenuSeparator()
{
    return (
        <div style={{padding: "0.45rem"}}></div>
    );
}