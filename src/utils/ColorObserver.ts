import Color from "color";
import { useEffect } from "react";

const heardEvents = ["focusin", "focusout", "mousedown", "click", "mouseover", "mouseup", "mouseout"];

/**
 * Detects character color used in an element.
 * 
 * Make sure to use this class under an `useEffect` hook
 * and on cleanup, invoke `ColorObserver#cleanup()`.
 */
export class ColorObserver
{
    private _parents: HTMLElement[];
    private _triggerCallback: Function;

    constructor(element: HTMLElement | null, callback: (color: Color) => void)
    {
        const browser = typeof window == "object";

        this._triggerCallback = () => {
            if (!element || !browser)
            {
                return;
            }

            const color = window.getComputedStyle(element).getPropertyValue("color");
            callback(Color(color));
        }

        this._parents = [];

        if (browser)
        {
            let p = element;
            while (p !== null)
            {
                if (p === document.body)
                {
                    break;
                }
                for (let eventType of heardEvents)
                {
                    p.addEventListener(eventType, this._triggerCallback as any);
                }
                this._parents.push(p);
                p = p.parentElement;
            }
        }

        this._triggerCallback();
    }

    cleanup()
    {
        for (let p of this._parents)
        {
            for (let eventType of heardEvents)
            {
                p.removeEventListener(eventType, this._triggerCallback as any);
            }
        }
    }
}