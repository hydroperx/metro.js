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
  ComboBoxOption,
  TextInput,
  FormGroup,
  CheckBox,
  Tiles,
  TilesController,
  TilesState,
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
  ContextMenuCheck,
  ContextMenuIcon,
  ContextMenuLabel,
  ContextMenuRight,
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
                  <ComboBoxOption value="foo">Foo</ComboBoxOption>
                  <ComboBoxOption value="bar">Bar</ComboBoxOption>
                  <ComboBoxOption value="qux">Qux</ComboBoxOption>
                </ComboBox>
                <ComboBox default="foo" small>
                  <ComboBoxOption value="foo">Foo</ComboBoxOption>
                  <ComboBoxOption value="bar">Bar</ComboBoxOption>
                  <ComboBoxOption value="qux">Qux</ComboBoxOption>
                </ComboBox>
                <Button variant="small-dropdown-primary">Click me</Button>
                <Button variant="small-dropdown">Click me</Button>
              </HGroup>
            </div>
            <div style={{ margin: "7rem" }}></div>
            <VGroup gap={28} maxWidth={300}>
              <ComboBox default="dark" big change={change_theme}>
                <ComboBoxOption value="dark">Dark</ComboBoxOption>
                <ComboBoxOption value="light">Light</ComboBoxOption>
                <ComboBoxOption value="purple">Purple</ComboBoxOption>
                <ComboBoxOption value="green">Green</ComboBoxOption>
              </ComboBox>
              <ComboBox default="ltr" big change={(value: string) => { set_rtl(value == "rtl") }}>
                <ComboBoxOption value="ltr">Left-to-right</ComboBoxOption>
                <ComboBoxOption value="rtl">Right-to-left</ComboBoxOption>
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
                <ComboBoxOption value="foo">Foo</ComboBoxOption>
                <ComboBoxOption value="bar">Bar</ComboBoxOption>
                <ComboBoxOption value="qux">Qux</ComboBoxOption>
                <ComboBoxOption value="foo9">Foo 9</ComboBoxOption>
                <ComboBoxOption value="bar3">Bar 3</ComboBoxOption>
                <ComboBoxOption value="qux2">Qux 2</ComboBoxOption>
                <ComboBoxOption value="foo1">Foo 1</ComboBoxOption>
                <ComboBoxOption value="bar0">Bar 0</ComboBoxOption>
                <ComboBoxOption value="quxA">Qux A</ComboBoxOption>
                <ComboBoxOption value="fooB">Foo B</ComboBoxOption>
                <ComboBoxOption value="barC">Bar C</ComboBoxOption>
                <ComboBoxOption value="quxD">Qux D</ComboBoxOption>
                <ComboBoxOption value="fooE">Foo E</ComboBoxOption>
                <ComboBoxOption value="barF">Bar F</ComboBoxOption>
                <ComboBoxOption value="qux1">Qux 1</ComboBoxOption>
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
                }}
              >
                <ContextMenuCheck state="none" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Item 1</ContextMenuLabel>
                <ContextMenuRight>Ctrl+Z</ContextMenuRight>
              </ContextMenuItem>
              <ContextMenuItem className="bar">
                <ContextMenuCheck state="checked" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Item 2</ContextMenuLabel>
                <ContextMenuRight></ContextMenuRight>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="qux">
                <ContextMenuCheck state="option" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Item 3</ContextMenuLabel>
                <ContextMenuRight></ContextMenuRight>
              </ContextMenuItem>
              <ContextMenuSubmenu>
                <ContextMenuCheck state="none" />
                <ContextMenuIcon></ContextMenuIcon>
                <ContextMenuLabel>Submenu 1</ContextMenuLabel>
                <ContextMenuRight>
                  <ContextMenuSubIcon />
                </ContextMenuRight>
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
                  <ContextMenuRight>
                    <ContextMenuSubIcon />
                  </ContextMenuRight>
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
