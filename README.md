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

Ensure to follow the [steps here](https://stackoverflow.com/a/77162508/26380963) for properly setting up the Emotion engine.

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

By default, the `light` theme preset is used. Theme presets can be referenced in `ThemePresets`. You can provide a specific theme for a React section using:

```tsx
import { ThemeContext, ThemePresets } from "@hydroper/metrocomponents";

// somewhere in React content
<ThemeContext.Provider value={ThemePresets.green}>
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

### Primary colors

To opt in to using primary colors in certain components such as heading titles, use the `PreferPrimaryColorsContext` context:

```tsx
import { PreferPrimaryColorsContext } from "@hydroper/metrocomponents";

// somewhere in React content
<PreferPrimaryColorsContext.Provider value={true}>
</PreferPrimaryColorsContext.Provider>
```

### Registering icons

Register custom icons with:

```tsx
import { registerIcon } from "@hydroper/metrocomponents";

registerIcon("iconX", { black: source, white: source });
```

### Built-in icons

The built-in icons may serve as base for designing newer icons. Here are links to existing useful icons:

- Round arc icons
  - [Arrow button icon](src/icons/arrow-button-white.svg)
  - [Arrow button "hover" icon](src/icons/arrow-button-hover-white.svg)
  - [Arrow button "pressed" icon](src/icons/arrow-button-pressed-white.svg)

These icons can then be used in for example `Icon` and `IconButton` components.

### Measuring points

The cascading `font-size` property in the `<html>` tag is used for determining the unit in points in the library. 1 point equals `0.25rem`, where `rem` is the `font-size` pixels of the `<html>` tag.

If it is desired to grow or reduce all the user interface together, you may adjust the `font-size` of the `<html>` tag.

### Input navigation

This library uses [`@hydroper/inputaction`](https://jsr.io/@hydroper/inputaction) for detecting pressed input such as keyboard arrows. You may customize the global `Input.input` input actions for supporting buttons other than arrow keys.

**Important**

- Elements that may be navigated with arrow buttons contain the cascading class name `.buttonNavigable`. This is useful for applications like games for avoid duplicating focus handling by detecting that class name.

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