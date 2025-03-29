import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import {
    Button, Container, Label, HGroup, VGroup, ArrowButton,
    ProgressRing, ProgressEllipsis,
    Select, SelectOption, TextInput, FormGroup,
    CheckBox,
    Tiles, TilesController, TilesState,

    getIcon,

    ThemePresets,
    ThemeContext,
    LocaleDirectionContext,
} from "com.hydroper.metrocomponents";
import type { Theme, LocaleDirection } from "com.hydroper.metrocomponents";
import {
    useContextMenu, ContextMenu,
    ContextMenuItem, ContextMenuCheck, ContextMenuIcon, ContextMenuLabel, ContextMenuRight,
    ContextMenuSeparator, ContextMenuSubmenu, ContextMenuSubIcon, ContextMenuSubmenuList
} from "com.hydroper.metrocomponents";
import "@fontsource/open-sans/300.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/courier-prime";
import clone from "clone";

import xboxWallpaper from "./livetiles/content/xbox.png";

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
    const [theme, setTheme] = useState<Theme>(ThemePresets.dark);
    const [localeDirection, setLocaleDirection] = useState<LocaleDirection>("ltr");
    const [checkbox_value, set_checkbox_value] = useState<boolean>(false);

    // Tiles
    const tiles_controller = new TilesController();

    // Change theme
    function changeTheme(value: string): void
    {
        setTheme((ThemePresets as any)[value]);
    }

    // Change locale direction
    function changeLocaleDir(value: string): void
    {
        setLocaleDirection(value == "ltr" ? "ltr" : "rtl");
    }

    useEffect(() => {
        // Add tiles and their groups
        tiles_controller.addGroup({
            id: "group1",
            label: "Group 1",
        });
        
        tiles_controller.addTile({
            id: "tile1",
            group: "group1",
            x: 0,
            y: 0,
            size: "large",
            color: "#A8143A",
            icon: getIcon("video", "white"),
            label: "Video",
        });

        tiles_controller.addTile({
            id: "tile2",
            group: "group1",
            x: 0,
            y: 4,
            size: "wide",
            color: "#008000",
            icon: getIcon("games", "white"),
            label: "Games",
            livePages: [
                {
                    html: `<div style='width:100%;height:100%;background: url("${xboxWallpaper}") no-repeat center 25%;background-size:cover'></div>`,
                },
            ],
        });

        tiles_controller.addGroup({
            id: "group2",
            label: "Group 2",
        });
        
        tiles_controller.addTile({
            id: "tile3",
            group: "group2",
            x: 0,
            y: 0,
            size: "small",
            color: "#2572E1",
            icon: getIcon("ie", "white"),
            label: "Internet Explorer",
        });
    }, []);

    return (
        <LocaleDirectionContext.Provider value={localeDirection}>
            <ThemeContext.Provider value={theme}>
                <Container full solid selection={false} contextMenu={Container_onContextMenu as any}>
                    <Container padding={5}>
                        <Label variant="heading1" tooltip="This demonstrates a Metro components library.">Metro demo</Label>
                        <div>
                            <HGroup gap={5}>
                                <Select default="foo" small primary>
                                    <SelectOption value="foo">Foo</SelectOption>
                                    <SelectOption value="bar">Bar</SelectOption>
                                    <SelectOption value="qux">Qux</SelectOption>
                                </Select>
                                <Select default="foo" small>
                                    <SelectOption value="foo">Foo</SelectOption>
                                    <SelectOption value="bar">Bar</SelectOption>
                                    <SelectOption value="qux">Qux</SelectOption>
                                </Select>
                                <Button variant="small-dropdown-primary">
                                    Click me
                                </Button>
                                <Button variant="small-dropdown">
                                    Click me
                                </Button>
                            </HGroup>
                        </div>
                        <div style={{margin: "7rem"}}></div>
                        <VGroup gap={7} maxWidth={100}>
                            <Select default="dark" big change={changeTheme}>
                                <SelectOption value="dark">Dark</SelectOption>
                                <SelectOption value="light">Light</SelectOption>
                                <SelectOption value="purple">Purple</SelectOption>
                                <SelectOption value="green">Green</SelectOption>
                            </Select>
                            <Select default="ltr" big change={changeLocaleDir}>
                                <SelectOption value="ltr">Left-to-right</SelectOption>
                                <SelectOption value="rtl">Right-to-left</SelectOption>
                            </Select>
                            <TextInput search placeholder="Type something"/>
                            <TextInput multiline/>
                            <FormGroup>
                                <Label for="checkbox"><b>{checkbox_value ? "On" : "Off"}</b></Label>
                                <CheckBox id="checkbox" change={value => { set_checkbox_value(value) }}/>
                            </FormGroup>
                        </VGroup>
                        <HGroup gap={2} style={{ margin: "1rem 0" }}>
                            <Button variant="none">None button</Button>
                            <Button variant="anchor">Anchor button</Button>
                        </HGroup>
                        <HGroup gap={2} style={{float: "right", marginRight: "3rem"}}>
                            <Button variant="outline-primary" tooltip="An useful description.">Outline primary</Button>
                            <Button variant="outline">Outline</Button>
                            <ArrowButton direction="right" size={9}></ArrowButton>
                        </HGroup>
                        <VGroup horizontalAlign="center">
                            <ProgressRing size={9}/>
                            <ProgressEllipsis/>
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
                        <div style={{margin: "5rem 0", width: "100%", height: "37rem", overflowY: "auto", padding: "0.5rem"}}>
                            <Tiles
                                controller={tiles_controller}
                                direction="horizontal"/>
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
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AK2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AL2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AM2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AN2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AO2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AP2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AQ2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AR2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AS2</ContextMenuLabel>
                                        <ContextMenuRight></ContextMenuRight>
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <ContextMenuIcon></ContextMenuIcon>
                                        <ContextMenuLabel>Item AT2</ContextMenuLabel>
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