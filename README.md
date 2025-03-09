# Metro components

<p align="center">
  <a href="https://jsr.io/@hydroper/metrocomponents"><img src="https://img.shields.io/jsr/v/@hydroper/metrocomponents"></a>
  <a href="https://jsr.io/@hydroper/metrocomponents/doc"><img src="https://img.shields.io/badge/API%20Documentation-gray"></a>
</p>

Set of React components using the Metro design.

## Getting started

### Installing required packages

Installation:

```sh
npx jsr add @hydroper/metrocomponents
npm i @emotion/css @emotion/react
```

> Note that this package uses the [Emotion](https://emotion.sh) library for skinning UI components.

### Installing the required Open Sans font

Installation:

```sh
npm i @fontsource/open-sans
```

Import it into your entry point TypeScript as follows:

```ts
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";
```

## Documentation

### Theming

By default, the `lightTheme` is used. The built-in themes are `lightTheme`, `darkTheme` and `purpleTheme`. You can provide a specific theme for a React section using:

```tsx
import { ThemeContext } from "@hydroper/metrocomponents";

// somewhere in React content
<ThemeContext.Provider value={theme}>
</ThemeContext.Provider>
```

You can nest it as well.

### Locale direction

Indicate whether a LTR layout or RTL layout is preferred through `LocaleDirectionContext`:

```tsx
import { LocaleDirectionContext, LocaleDirection } from "@hydroper/metrocomponents";

const direction: LocaleDirection = "ltr";

// somewhere in React content
<LocaleDirectionContext.Provider value={direction}>
</LocaleDirectionContext.Provider>
```

### Registering icons

Register custom icons with:

```tsx
import { registerIcon } from "@hydroper/metrocomponents";

registerIcon("iconX", { black: source, white: source });
```

These icons can then be used in for example `Icon` and `IconButton` components.

### Icons

The built-in icons may serve as base for designing newer icons. Here are links to existing useful icons:

- Round arc icons
  - [Arrow button icon](src/components/icons/arrow-button-white.svg)
  - [Arrow button "hover" icon](src/components/icons/arrow-button-hover-white.svg)
  - [Arrow button "pressed" icon](src/components/icons/arrow-button-pressed-white.svg)

### Context menu

```tsx
import {
    useContextMenu, ContextMenu,
    ContextMenuItem, ContextMenuIcon, ContextMenuLabel, ContextMenuRight,
    ContextMenuSeparator, ContextMenuSubmenu, ContextMenuSubmenuList,
    ContextMenuSubIcon,
} from "@hydroper/metrocomponents";

function MyComp()
{
    const { id: contextMenuId, show: showContextMenu } = useContextMenu();

    function item1_onClick()
    {
        console.log("clicked item 1");
    }

    showContextMenu();

    return (
        <>
            <ContextMenu id={contextMenuId}>
                <ContextMenuItem click={item1_onClick}>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item 1</ContextMenuLabel>
                    <ContextMenuRight></ContextMenuRight>
                </ContextMenuItem>
                <ContextMenuSeparator/>
                <ContextMenuSubmenu>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Submenu 1</ContextMenuLabel>
                    <ContextMenuRight><ContextMenuSubIcon/></ContextMenuRight>
                </ContextMenuSubmenu>
                <ContextMenuSubmenuList>
                    <ContextMenuItem disabled={true}>
                        <ContextMenuIcon></ContextMenuIcon>
                        <ContextMenuLabel>Item A</ContextMenuLabel>
                        <ContextMenuRight></ContextMenuRight>
                    </ContextMenuItem>
                </ContextMenuSubmenuList>
            </ContextMenu>
        </>
    );
}
```

If a context menu contains "checked" or "option" items, prepend a `<ContextMenuCheck/>` column to every item with the attribute `state` set to either `none`, `checked` or `option`.

```tsx
(
    <ContextMenuItem>
        <ContextMenuCheck state="none"/>
        <ContextMenuIcon></ContextMenuIcon>
        <ContextMenuLabel>Item 1</ContextMenuLabel>
        <ContextMenuRight></ContextMenuRight>
    </ContextMenuItem>
    <ContextMenuItem>
        <ContextMenuCheck state="checked"/>
        <ContextMenuIcon></ContextMenuIcon>
        <ContextMenuLabel>Item 2</ContextMenuLabel>
        <ContextMenuRight></ContextMenuRight>
    </ContextMenuItem>
);
```