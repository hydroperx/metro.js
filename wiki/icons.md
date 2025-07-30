# Icons

The `Icon` component is colored automatically at every state (hover, pressed) according to the computed cascading `color` property.

The `CircleIconButton` component represents a circle button consisting of an icon. For example, `ArrowButton` is an alias to `<CircleIconButton icon="fullarrow" {...rest}/>`, where the `fullarrow` icon fits into a square circle.

## Built-in icons

Here is a list of built-in icons:

| Type | Description |
| ---- | ----------- |
| `bullet` | Correponds to the bullet character. |
| `checked` | Something is done or checked. |
| `arrow` | A simple left arrow. |
| `fullarrow` | A full left arrow, used mainly as a `CircleIconButton` (`ArrowButton`). |
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
| `bing` | Bing search engine. |
| `opera` | Opera browser. |
| `chrome` | Google Chrome browser. |
| `firefox` | Firefox browser. |
| `msedge` | Microsoft Edge browser. |
| `lapis` | Southwest-pointing lapis. Also used as an "edit" icon. |
| `idea` | An upstanding lamp. |
| `help` | Question mark. |
| `helpcircle` | Question mark inside a circle outline. |
| `new` | A rectangle containing a plus sign. |

## Icon registry

Register custom icons with:

```tsx
import { IconRegistry } from "@hydroperx/metrodragon";

IconRegistry.register("iconX", { black: source, white: source });
```

These icons can then be used in for example the `Icon` and `CircleIconButton` components.

- To unregister a previously registered icon, use `IconRegistry.unregister()`.
- Retrieve a registered icon's source URI using `IconRegistry.get()`.