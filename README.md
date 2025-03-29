# Metro components

Set of React components using the Metro design.

## Getting started

### Installing required packages

Installation:

```sh
npx jsr add com.hydroper.metrocomponents
```

### Installing the required fonts

Installation:

```sh
npm i @fontsource/open-sans @fontsource/courier-prime
```

Import it into your entry point TypeScript as follows:

```ts
// Open Sans
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";

// Courier Prime
import "@fontsource/courier-prime";
```

## Documentation

### Theming

By default, the `light` theme preset is used. Theme presets can be referenced in `ThemePresets`. You can provide a specific theme for a React section using:

```tsx
import { ThemeContext, ThemePresets } from "com.hydroper.metrocomponents";

// somewhere in React content
<ThemeContext.Provider value={ThemePresets.green}>
</ThemeContext.Provider>
```

You can nest it as well.

### Locale direction

Indicate whether a LTR layout or RTL layout is preferred through `LocaleDirectionContext`:

```tsx
import { LocaleDirectionContext, LocaleDirection } from "com.hydroper.metrocomponents";

const direction: LocaleDirection = "ltr";

// somewhere in React content
<LocaleDirectionContext.Provider value={direction}>
</LocaleDirectionContext.Provider>
```

### Primary colors

To opt in to using primary colors in certain components such as heading titles and checkboxes, use the `PreferPrimaryContext` context:

```tsx
import { PreferPrimaryContext } from "com.hydroper.metrocomponents";

// somewhere in React content
<PreferPrimaryContext.Provider value={true}>
</PreferPrimaryContext.Provider>
```

### Icons

The `Icon` component is colored automatically at every state (hover, pressed) according to the computed cascading `color` property.

The `CircleIconButton` component represents a circle button consisting of an icon. For example, `ArrowButton` is an alias to `<CircleIconButton icon="arrowButton" {...rest}/>`, where the `arrowButton` icon fits into a square circle.

### Built-in icons

Here is a list of built-in icons:

| Type | Description |
| ---- | ----------- |
| `bullet` | Correponds to the bullet character. |
| `checked` | Something is done or checked. |
| `arrow` | A simple left arrow. |
| `arrowButton` | A left arrow. |
| `search` | Search or zoom. |
| `clear` | Clear. |
| `games` | Game controller. |
| `ie` | Internet Explorer |
| `video` | Video. |
| `store` | Generic store or marketplace icon. |
| `settings` | Settings. |
| `mail` | (e-)mail. |
| `user` | Generic user avatar. |
| `security` | Security or safety. |
| `calc` | Calculator. |
| `camera` | Camera. |
| `bluetooth` | Bluetooth. |
| `news` | News. |

### Registering icons

Register custom icons with:

```tsx
import { registerIcon } from "com.hydroper.metrocomponents";

registerIcon("iconX", { black: source, white: source });
```

These icons can then be used in for example `Icon` and `CircleIconButton` components.

To unregister a previously registered icon, use `unregisterIcon()`.

### Measuring points

The cascading `font-size` property in the `<html>` tag is used for determining the unit in points in the library. 1 point equals `0.25rem`, where `rem` is the `font-size` pixels of the `<html>` tag.

If it is desired to grow or reduce all the user interface together, you may adjust the `font-size` of the `<html>` tag.

### Input navigation

This library uses [`com.hydroper.inputaction`](https://jsr.io/com.hydroper.inputaction) for detecting pressed input such as keyboard arrows. You may customize the global `Input.input` input actions for supporting buttons other than arrow keys.

**Important**

Elements that may be navigated with arrow input contain the cascading class name specified by the `ReservedClasses.BUTTON_NAVIGABLE` constant. This is useful for applications like games for avoid duplicating focus handling by detecting that class name.

### Context menu

```tsx
import {
    useContextMenu, ContextMenu,
    ContextMenuItem, ContextMenuIcon, ContextMenuLabel, ContextMenuRight,
    ContextMenuSeparator, ContextMenuSubmenu, ContextMenuSubmenuList,
    ContextMenuSubIcon,
} from "com.hydroper.metrocomponents";

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

## License

Apache 2.0