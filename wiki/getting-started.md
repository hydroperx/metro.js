# Getting started

## Installation

- [Refer to Installation](./installation.md)

## Basic application

First make sure you are familiar with the [React.js](https://react.dev) framework. Use `BaselineContainer` for integrating basic styling.

```ts
import { BaselineContainer, Label } from "@hydroperx/metro";

function App() {
    return (
        <BaselineContainer>
            <Label variant="heading">Hello, world!</Label>
        </BaselineContainer>
    );
)
```

## Applying a theme

By default, the `light` theme preset is used. Theme presets can be referenced in `ThemePresets`. You can provide a specific theme for a React section using:

```tsx
import { ThemeProvider, ThemePresets } from "@hydroperx/metro";

// somewhere in React content
<ThemeProvider theme={ThemePresets.green}>
</ThemeProvider>
```

You can nest it as well.

## Primary colors

To opt in to using primary colors in certain components such as heading titles and checkboxes, use the `Primary` context provider:

```tsx
import { Primary } from "@hydroperx/metro";

// somewhere in React content
<Primary prefer>
</Primary>
```

## Right-to-left

Indicate whether a LTR layout or RTL layout is preferred through `RTLProvider`:

```tsx
import { RTLProvider } from "@hydroperx/metro";

// somewhere in React content
<RTLProvider rtl={false}>
</RTLProvider>
```