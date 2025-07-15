import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Container,
  Label,
  HGroup,
  VGroup,
  ArrowButton,
  ProgressRing,
  ProgressEllipsis,
  ComboBox,
  Option,
  TextInput,
  FormGroup,
  CheckBox,
  Tiles,
  TilesController,
  IconRegistry,
  ThemePresets,
  ThemeProvider,
  RTLProvider,
} from "@hydroperx/metro";
import type { Theme } from "@hydroperx/metro";
import {
  useContextMenu,
  ContextMenu,
  ContextMenuItem,
  ContextMenuIndicator,
  ContextMenuIcon,
  ContextMenuLabel,
  ContextMenuLast,
  ContextMenuSeparator,
  ContextMenuSubmenu,
  ContextMenuSubIcon,
  ContextMenuSubmenuList,
} from "@hydroperx/metro";
import "@fontsource/noto-sans/200.css";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/courier-prime";

import xboxWallpaper from "./livetiles/content/xbox.png";

function App() {
  const { id: contextMenuId, show: showContextMenu } = useContextMenu();

  // Show context menu
  function Container_onContextMenu(e: MouseEvent): void {
    let p = e.target as HTMLElement | null;
    while (p) {
      if (!p.matches(":hover")) break;
      if (
        p instanceof HTMLButtonElement ||
        (p instanceof HTMLInputElement && p.type == "button")
      )
        return;
      p = p.parentElement;
    }

    showContextMenu({
      event: e,
    });
  }

  // States
  const [theme, set_theme] = useState<Theme>(ThemePresets.dark);
  const [rtl, set_rtl] =
    useState<boolean>(false);
  const [checkbox_value, set_checkbox_value] = useState<boolean>(false);

  // Tiles
  const tiles_controller = new TilesController();

  // Change theme
  function change_theme(value: string): void {
    set_theme((ThemePresets as any)[value]);
  }

  tiles_controller.initialized(() => {
    // Add tiles and their groups
    tiles_controller.addGroup({
      id: "group1",
      label: "Group 1",
    });

    tiles_controller.addTile({
      id: "video",
      group: "group1",
      x: 0,
      y: 0,
      size: "large",
      color: "#A8143A",
      icon: IconRegistry.get("video", "white"),
      label: "Video",
    });

    tiles_controller.addTile({
      id: "games",
      group: "group1",
      x: 0,
      y: 4,
      size: "wide",
      color: "#008000",
      icon: IconRegistry.get("games", "white"),
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
      id: "bing",
      group: "group2",
      x: 0,
      y: 0,
      size: "medium",
      color: "#FFC024",
      icon: IconRegistry.get("bing", "white"),
      label: "Bing",
    });

    tiles_controller.addTile({
      id: "ie",
      group: "group2",
      x: 0,
      y: 2,
      size: "small",
      color: "#2572E1",
      icon: IconRegistry.get("ie", "white"),
      label: "Internet Explorer",
    });

    tiles_controller.addTile({
      id: "edge",
      group: "group2",
      x: 1,
      y: 2,
      size: "small",
      color: "#2572E1",
      icon: IconRegistry.get("msedge", "white"),
      label: "Edge",
    });

    tiles_controller.addTile({
      id: "opera",
      group: "group2",
      x: 0,
      y: 3,
      size: "small",
      color: "#C90000",
      icon: IconRegistry.get("opera", "white"),
      label: "Opera",
    });

    tiles_controller.addTile({
      id: "chrome",
      group: "group2",
      x: 1,
      y: 3,
      size: "small",
      color: "#C90000",
      icon: IconRegistry.get("chrome", "white"),
      label: "Google Chrome",
    });

    tiles_controller.addTile({
      id: "firefox",
      group: "group2",
      x: 0,
      y: 4,
      size: "small",
      color: "#E68100",
      icon: IconRegistry.get("firefox", "white"),
      label: "Firefox",
    });
  });

  return (
    <RTLProvider rtl={rtl}>
      <ThemeProvider theme={theme}>
        <Container
          full
          solid
          selection={false}
          contextMenu={Container_onContextMenu as any}
        >
          <Container padding={15}>
            <Label
              variant="heading1"
              tooltip={{text: "This demonstrates a Metro components library."}}
            >
              Metro demo
            </Label>
            <div>
              <HGroup gap={15}>
                <ComboBox default="foo" small primary>
                  <Option value="foo">Foo</Option>
                  <Option value="bar">Bar</Option>
                  <Option value="qux">Qux</Option>
                </ComboBox>
                <ComboBox default="foo" small>
                  <Option value="foo">Foo</Option>
                  <Option value="bar">Bar</Option>
                  <Option value="qux">Qux</Option>
                </ComboBox>
                <Button variant="small-dropdown-primary">Click me</Button>
                <Button variant="small-dropdown">Click me</Button>
              </HGroup>
            </div>
            <div style={{ margin: "7rem" }}></div>
            <VGroup gap={28} maxWidth={300}>
              <ComboBox default="dark" big change={change_theme}>
                <Option value="dark">Dark</Option>
                <Option value="light">Light</Option>
                <Option value="purple">Purple</Option>
                <Option value="green">Green</Option>
              </ComboBox>
              <ComboBox default="ltr" big change={(value: string) => { set_rtl(value == "rtl") }}>
                <Option value="ltr">Left-to-right</Option>
                <Option value="rtl">Right-to-left</Option>
              </ComboBox>
              <TextInput search placeholder="Type something" />
              <TextInput multiline />
              <FormGroup>
                <Label for="checkbox">
                  <b>{checkbox_value ? "On" : "Off"}</b>
                </Label>
                <CheckBox
                  id="checkbox"
                  change={(value) => {
                    set_checkbox_value(value);
                  }}
                />
              </FormGroup>
            </VGroup>
            <HGroup gap={18} style={{ margin: "1rem 0" }}>
              <Button variant="none">None button</Button>
              <Button variant="anchor">Anchor button</Button>
            </HGroup>
            <HGroup gap={18} style={{ float: "right", marginRight: "3rem" }}>
              <Button
                variant="outline-primary"
                tooltip={{text: "An useful description."}}
              >
                Outline primary
              </Button>
              <Button variant="outline">Outline</Button>
              <ArrowButton direction="right" size={27}></ArrowButton>
            </HGroup>
            <VGroup horizontalAlign="center">
              <ProgressRing size={9} />
              <ProgressEllipsis />
            </VGroup>
            <div>
              <ComboBox default="qux1">
                <Option value="foo">Foo</Option>
                <Option value="bar">Bar</Option>
                <Option value="qux">Qux</Option>
                <Option value="foo9">Foo 9</Option>
                <Option value="bar3">Bar 3</Option>
                <Option value="qux2">Qux 2</Option>
                <Option value="foo1">Foo 1</Option>
                <Option value="bar0">Bar 0</Option>
                <Option value="quxA">Qux A</Option>
                <Option value="fooB">Foo B</Option>
                <Option value="barC">Bar C</Option>
                <Option value="quxD">Qux D</Option>
                <Option value="fooE">Foo E</Option>
                <Option value="barF">Bar F</Option>
                <Option value="qux1">Qux 1</Option>
              </ComboBox>
            </div>
            <Container
              style={{
                margin: "5rem 0",
                width: "100%",
                height: "37rem",
                padding: "0.5rem",
              }}
              wheelHorizontal
            >
              <Tiles controller={tiles_controller} direction="horizontal" />
            </Container>
            <ContextMenu id={contextMenuId}>
              <ContextMenuItem
                className="foo"
                click={() => {
                  alert("clicked item 1");
                }}>
                <ContextMenuIndicator state="none" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Item 1</ContextMenuLabel>
                <ContextMenuLast>Ctrl+Z</ContextMenuLast>
              </ContextMenuItem>
              <ContextMenuItem className="bar">
                <ContextMenuIndicator state="checked" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Item 2</ContextMenuLabel>
                <ContextMenuLast></ContextMenuLast>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="qux">
                <ContextMenuIndicator state="option" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Item 3</ContextMenuLabel>
                <ContextMenuLast></ContextMenuLast>
              </ContextMenuItem>
              <ContextMenuSubmenu>
                <ContextMenuIndicator state="none" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Submenu 1</ContextMenuLabel>
                <ContextMenuLast>
                  <ContextMenuSubIcon />
                </ContextMenuLast>
              </ContextMenuSubmenu>
              <ContextMenuSubmenuList>
                <ContextMenuItem click={() => alert("clicked item a")}>
                  <ContextMenuIcon></ContextMenuIcon>
                  <ContextMenuLabel>Item A</ContextMenuLabel>
                  <ContextMenuLast></ContextMenuLast>
                </ContextMenuItem>
                <ContextMenuItem disabled={true}>
                  <ContextMenuIcon></ContextMenuIcon>
                  <ContextMenuLabel>Item A</ContextMenuLabel>
                  <ContextMenuLast></ContextMenuLast>
                </ContextMenuItem>
                <ContextMenuSubmenu>
                  <ContextMenuIcon></ContextMenuIcon>
                  <ContextMenuLabel>Submenu A</ContextMenuLabel>
                  <ContextMenuLast>
                    <ContextMenuSubIcon />
                  </ContextMenuLast>
                </ContextMenuSubmenu>
                <ContextMenuSubmenuList>
                  <ContextMenuItem click={() => alert("clicked item a1")}>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item A1</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem disabled={true}>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AA1</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item B2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item C2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item D2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item E2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item F2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item G2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item H2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item I2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item J2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item K2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item L2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item M2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item N2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AK2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AL2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AM2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AN2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AO2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AP2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AQ2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AR2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AS2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <ContextMenuIcon></ContextMenuIcon>
                    <ContextMenuLabel>Item AT2</ContextMenuLabel>
                    <ContextMenuLast></ContextMenuLast>
                  </ContextMenuItem>
                </ContextMenuSubmenuList>
              </ContextMenuSubmenuList>
            </ContextMenu>
          </Container>
        </Container>
      </ThemeProvider>
    </RTLProvider>
  );
}

// Disable default context menu
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Disable certain key behaviors
window.addEventListener("keydown", (e) => {
  // Ctrl+A
  if (e.key.toLowerCase() == "a" && e.ctrlKey && !e.shiftKey && !e.altKey) {
    if (
      !(
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      )
    )
      e.preventDefault();
  }
});

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
