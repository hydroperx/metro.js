import { createRoot } from "react-dom/client";
import { Button, Label, VGroup, ThemeProvider, darkTheme } from "@hydroper/metrocomponents";
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";


function App()
{
    return <ThemeProvider value={darkTheme}>
        <VGroup gap={5}>
            <Label variant="heading1">Hi there</Label>
            <Button variant="outline-primary">Click me</Button>
        </VGroup>
    </ThemeProvider>;
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);