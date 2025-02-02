# Metro components

<p align="center">
  <a href="https://jsr.io/@hydroper/metrocomponents"><img src="https://img.shields.io/jsr/v/@hydroper/metrocomponents"></a>
  <a href="https://jsr.io/@hydroper/metrocomponents/doc"><img src="https://img.shields.io/badge/API%20Documentation-gray"></a>
</p>

Set of React components using the Metro design.

## Getting started

### Installing required packages

Install it using [Bun](https://bun.sh):

```sh
bunx jsr add @hydroper/metrocomponents
bun i @emotion/css @emotion/react
```

> Note that this package uses the [Emotion](https://emotion.sh) library for skinning UI components.

### Installing the required Open Sans font

Install it using Bun:

```sh
bun i @fontsource/open-sans
```

Import it into your entry point TypeScript as follows:

```ts
import "@fontsource/open-sans/100.css";
import "@fontsource/open-sans/200.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";
```

## Documentation

### Theming

By default, the `lightTheme` is used. The built-in themes are `lightTheme`, `darkTheme` and `purpleTheme`. You can provide a specific theme for a React section using:

```tsx
import { ThemeProvider } from "@hydroper/metrocomponents";

// somewhere in React content
<ThemeProvider value={theme}>
</ThemeProvider>
```

You can nest it as well.