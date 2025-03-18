import { styled } from "styled-components";
import { useContext } from "react";
import { pointsToRem } from "../utils/points";
import { LocaleDirectionContext } from "../layout";

// CSS
const Div = styled.div<{
    $vertical: boolean,
    $localeDir: "ltr" | "rtl",
}> `
display: flex;
flex-direction: ${$ => $.$vertical ? "column" : $.$localeDir == "ltr" ? "row" : "row-reverse"};
gap: 1rem;

${
    $ => $.$vertical ? "" :
    `
    & > label, & > span, & > h1, & > h2, & > h3, & > h4, & > h5 {
        min-width: 12rem;
        ${$.$localeDir == "rtl" ? "text-align: right;" : ""}
    }
    `
}
`;

/**
 * A form group more commonly contains a label
 * followed by a form control.
 */
export function FormGroup(options: FormGroupOptions)
{
    // Locale direction
    const localeDir = useContext(LocaleDirectionContext);

    return (
        <Div
            $vertical={!!options.vertical}
            $localeDir={localeDir}
            style={options.style}
            className={options.className}>

            {options.children}
        </Div>
    );
}

export type FormGroupOptions = {
    vertical?: boolean,

    className?: string,
    style?: React.CSSProperties,
    children?: React.ReactNode,
};