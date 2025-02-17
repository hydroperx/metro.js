import { createRoot } from "react-dom/client";
import { Button, Container, Label, HGroup, ThemeContext, darkTheme } from "@hydroper/metrocomponents";
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";

function App()
{
    return <ThemeContext.Provider value={darkTheme}>
        <Container full solid selection={false}>
            <Container padding={5}>
                <Label variant="heading1">Hi there</Label>
                <HGroup inline gap={2} style={{float: "right", marginRight: "3rem"}}>
                    <Button variant="outline-primary">Important</Button>
                    <Button variant="outline">Unimportant</Button>
                </HGroup>
            </Container>
        </Container>
    </ThemeContext.Provider>;
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);