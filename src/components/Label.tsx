import assert from "assert";
import extend from "extend";
import { css } from "@emotion/css";

export type LabelVariant = 
    "normal" |
    "heading1" |
    "heading2" |
    "heading3" |
    "heading4" |
    "legend";

export type LabelOptions = {
    variant?: LabelVariant,

    visible?: boolean,

    style?: React.CSSProperties,
    children?: React.ReactNode,
};

export function Label(options: LabelOptions)
{
    const variant = options.variant ?? "normal";

    const newStyle: React.CSSProperties = {};
    newStyle.fontFamily = "'Open Sans', sans";
    if (!(options.visible ?? true))
    {
        newStyle.display = "none";
    }
    if (options.style)
    {
        extend(newStyle, options.style);
    }

    switch (variant)
    {
        case "normal":
        {
            const className = css `
                font-family: "Open Sans", sans;
                font-size: 0.9rem;
            `;
            return <span className={className} style={newStyle}>{options.children}</span>;
        }
        case "heading1":
        {
            const className = css `
                font-family: "Open Sans", sans;
                font-weight: lighter;
                font-size: 2.1rem;
            `;
            return <h1 className={className} style={newStyle}>{options.children}</h1>;
        }
        case "heading2":
        {
            const className = css `
                font-family: "Open Sans", sans;
                font-weight: lighter;
                font-size: 1.7rem;
            `;
            return <h2 className={className} style={newStyle}>{options.children}</h2>;
        }
        case "heading3":
        {
            const className = css `
                font-family: "Open Sans", sans;
                font-size: 1.3rem;
                font-weight: bold;
            `;
            return <h3 className={className} style={newStyle}>{options.children}</h3>;
        }
        case "heading4":
        {
            const className = css `
                font-family: "Open Sans", sans;
                font-size: 1.1rem;
                font-weight: bold;
            `;
            return <h4 className={className} style={newStyle}>{options.children}</h4>;
        }
        case "legend":
        {
            const className = css `
                font-family: "Open Sans", sans;
                font-size: 0.77rem;
            `;
            return <span className={className} style={newStyle}>{options.children}</span>;
        }
    }
}