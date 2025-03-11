import { css } from "@emotion/react";
import { useContext } from "react";
import { pointsToRem } from "../utils/points";
import { LocaleDirectionContext } from "../layout";

/**
 * A form group more commonly contains a label
 * followed by a form control.
 */
export function FormGroup(options: FormGroupOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    // CSS
    const serializedStyles = css `
        display: flex;
        flex-direction: ${options.vertical ? "column" : localeDir == "ltr" ? "row" : "row-reverse"};
        gap: 1rem;

        ${
            options.vertical ? "" :
            `
            & > label, & > span, & > h1, & > h2, & > h3, & > h4, & > h5 {
                min-width: 12rem;
                ${localeDir == "rtl" ? "text-align: right;" : ""}
            }
            `
        }
    `;
    return (
        <div css={serializedStyles} style={options.style} className={options.className}>
            {options.children}
        </div>
    );
}

export type FormGroupOptions = {
    vertical?: boolean,

    className?: string,
    style?: React.CSSProperties,
    children?: React.ReactNode,
};