import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { Button, Container, Label, HGroup, ArrowButton, ContextMenuSubIcon, ThemeContext, darkTheme} from "@hydroper/metrocomponents";
import {
    useContextMenu, ContextMenu,
    ContextMenuItem, ContextMenuCheck, ContextMenuIcon, ContextMenuLabel, ContextMenuRight,
    ContextMenuSeparator, ContextMenuSubmenu, ContextMenuSubmenuList
} from "@hydroper/metrocomponents";
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";

function App()
{
    const { id: contextMenuId, show: showContextMenu } = useContextMenu();

    // Show context menu
    function Container_onContextMenu(e: MouseEvent): void
    {
        showContextMenu({
            event: e,
        });
    }

    return <ThemeContext.Provider value={darkTheme}>
        <Container full solid selection={false} contextMenu={Container_onContextMenu as any}>
            <Container padding={5}>
                <Label variant="heading1">Hi there</Label>
                <div style={{margin: "12rem"}}></div>
                <HGroup inline gap={2} style={{float: "right", marginRight: "3rem"}}>
                    <Button variant="outline-primary" tooltip="An useful description.">X</Button>
                    <Button variant="outline">Y</Button>
                    <ArrowButton direction="right" size={9}></ArrowButton>
                </HGroup>
                <ContextMenu id={contextMenuId}>
                    <ContextMenuItem className="foo" click={() => {alert("clicked item 1")}}>
                        <ContextMenuCheck state="none"/>
                        <ContextMenuIcon></ContextMenuIcon>
                        <ContextMenuLabel>Item 1</ContextMenuLabel>
                        <ContextMenuRight>Ctrl+Z</ContextMenuRight>
                    </ContextMenuItem>
                    <ContextMenuItem className="bar">
                        <ContextMenuCheck state="checked"/>
                        <ContextMenuIcon></ContextMenuIcon>
                        <ContextMenuLabel>Item 2</ContextMenuLabel>
                        <ContextMenuRight></ContextMenuRight>
                    </ContextMenuItem>
                    <ContextMenuSeparator/>
                    <ContextMenuItem className="qux">
                        <ContextMenuCheck state="option"/>
                        <ContextMenuIcon></ContextMenuIcon>
                        <ContextMenuLabel>Item 3</ContextMenuLabel>
                        <ContextMenuRight></ContextMenuRight>
                    </ContextMenuItem>
                    <ContextMenuSubmenu>
                        <ContextMenuCheck state="none"/>
                        <ContextMenuIcon></ContextMenuIcon>
                        <ContextMenuLabel>Submenu 1</ContextMenuLabel>
                        <ContextMenuRight><ContextMenuSubIcon/></ContextMenuRight>
                    </ContextMenuSubmenu>
                    <ContextMenuSubmenuList>
                        <ContextMenuItem click={() => alert("clicked item a")}>
                            <ContextMenuIcon></ContextMenuIcon>
                            <ContextMenuLabel>Item A</ContextMenuLabel>
                            <ContextMenuRight></ContextMenuRight>
                        </ContextMenuItem>
                        <ContextMenuItem disabled={true}>
                            <ContextMenuIcon></ContextMenuIcon>
                            <ContextMenuLabel>Item A</ContextMenuLabel>
                            <ContextMenuRight></ContextMenuRight>
                        </ContextMenuItem>
                        <ContextMenuSubmenu>
                            <ContextMenuCheck state="none"/>
                            <ContextMenuIcon></ContextMenuIcon>
                            <ContextMenuLabel>Submenu A</ContextMenuLabel>
                            <ContextMenuRight><ContextMenuSubIcon/></ContextMenuRight>
                        </ContextMenuSubmenu>
                        <ContextMenuSubmenuList>
                            <ContextMenuItem click={() => alert("clicked item a1")}>
                                <ContextMenuIcon></ContextMenuIcon>
                                <ContextMenuLabel>Item A1</ContextMenuLabel>
                                <ContextMenuRight></ContextMenuRight>
                            </ContextMenuItem>
                            <ContextMenuItem disabled={true}>
                                <ContextMenuIcon></ContextMenuIcon>
                                <ContextMenuLabel>Item A1</ContextMenuLabel>
                                <ContextMenuRight></ContextMenuRight>
                            </ContextMenuItem>
                        </ContextMenuSubmenuList>
                    </ContextMenuSubmenuList>
                </ContextMenu>
            </Container>
        </Container>
    </ThemeContext.Provider>;
}

// Disable default context menu
document.addEventListener("contextmenu", event => event.preventDefault());

const root = createRoot(document.getElementById("root")!);
root.render(<App />);