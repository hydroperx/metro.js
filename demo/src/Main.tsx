import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import {
    Button, Container, Label, HGroup, VGroup, ArrowButton, ThemeContext,
    LoadingIcon, Select, SelectOption, TextInput,
    lightTheme, darkTheme,
    LocaleDirectionContext,
} from "@hydroper/metrocomponents";
import type { Theme, LocaleDirection } from "@hydroper/metrocomponents";
import {
    useContextMenu, ContextMenu,
    ContextMenuItem, ContextMenuCheck, ContextMenuIcon, ContextMenuLabel, ContextMenuRight,
    ContextMenuSeparator, ContextMenuSubmenu, ContextMenuSubIcon, ContextMenuSubmenuList
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

    // States
    const [theme, setTheme] = useState<Theme>(darkTheme);
    const [localeDirection, setLocaleDirection] = useState<LocaleDirection>("ltr");

    // Change theme
    function changeTheme(value: string): void
    {
        setTheme(value == "light" ? lightTheme : darkTheme);
    }

    // Change locale direction
    function changeLocaleDir(value: string): void
    {
        setLocaleDirection(value == "ltr" ? "ltr" : "rtl");
    }

    return (
        <LocaleDirectionContext.Provider value={localeDirection}>
            <ThemeContext.Provider value={theme}>
                <Container full solid selection={false} contextMenu={Container_onContextMenu as any}>
                    <Container padding={5}>
                        <Label variant="heading1">Metro demo</Label>
                        <div style={{margin: "7rem"}}></div>
                        <VGroup gap={7} maxWidth={100}>
                            <Select default="dark" big change={changeTheme}>
                                <SelectOption value="dark">Dark</SelectOption>
                                <SelectOption value="light">Light</SelectOption>
                            </Select>
                            <Select default="ltr" big change={changeLocaleDir}>
                                <SelectOption value="ltr">Left-to-right</SelectOption>
                                <SelectOption value="rtl">Right-to-left</SelectOption>
                            </Select>
                            <TextInput search placeholder="Type something"/>
                            <TextInput multiline/>
                        </VGroup>
                        <HGroup gap={2} style={{float: "right", marginRight: "3rem"}}>
                            <Button variant="outline-primary" tooltip="An useful description.">Outline primary</Button>
                            <Button variant="outline">Outline</Button>
                            <ArrowButton direction="right" size={9}></ArrowButton>
                        </HGroup>
                        <VGroup horizontalAlign="center">
                            <LoadingIcon size={9}/>
                        </VGroup>
                        <div>
                            <Select default="qux1">
                                <SelectOption value="foo">Foo</SelectOption>
                                <SelectOption value="bar">Bar</SelectOption>
                                <SelectOption value="qux">Qux</SelectOption>
                                <SelectOption value="foo9">Foo 9</SelectOption>
                                <SelectOption value="bar3">Bar 3</SelectOption>
                                <SelectOption value="qux2">Qux 2</SelectOption>
                                <SelectOption value="foo1">Foo 1</SelectOption>
                                <SelectOption value="bar0">Bar 0</SelectOption>
                                <SelectOption value="quxA">Qux A</SelectOption>
                                <SelectOption value="fooB">Foo B</SelectOption>
                                <SelectOption value="barC">Bar C</SelectOption>
                                <SelectOption value="quxD">Qux D</SelectOption>
                                <SelectOption value="fooE">Foo E</SelectOption>
                                <SelectOption value="barF">Bar F</SelectOption>
                                <SelectOption value="qux1">Qux 1</SelectOption>
                            </Select>
                        </div>
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
                                        <ContextMenuLabel>Item AA1</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item B2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item C2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item D2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item E2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item F2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item G2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item H2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item I2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item J2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item K2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item L2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item M2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item N2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                </ContextMenuSubmenuList>
                            </ContextMenuSubmenuList>
                        </ContextMenu>
                    </Container>
                </Container>
            </ThemeContext.Provider>
        </LocaleDirectionContext.Provider>
    );
}

// Disable default context menu
document.addEventListener("contextmenu", event => event.preventDefault());

const root = createRoot(document.getElementById("root")!);
root.render(<App />);