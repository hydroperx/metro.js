import $ from "jquery";

/**
 * Determines whether a DOM element is focusable.
 */
export function canFocus(element: HTMLElement): boolean {
  // Implementation from https://stackoverflow.com/a/18261861/26380963
  const $el = $(element);
  if ($el.is(":hidden") || $el.is(":disabled")) {
    return false;
  }
  var tabIndex = +$el.attr("tabindex")!;
  tabIndex = isNaN(tabIndex) ? -1 : tabIndex;
  return $el.is(":input, a[href], area[href], iframe") || tabIndex > -1;
}

/**
 * Focus the previous focusable sibling of an element.
 */
export function focusPrevSibling(element: HTMLElement): void {
  const parent = element.parentElement;
  const children = Array.from(parent!.children) as HTMLElement[];
  const i = children.indexOf(element);
  const list = children
    .slice(0, i)
    .reverse()
    .concat(children.slice(i + 1).reverse());
  const firstFocusable = list.find((e) => canFocus(e));
  if (firstFocusable) {
    firstFocusable.focus();
    firstFocusable.scrollIntoView();
  }
}

/**
 * Focus the next focusable sibling of an element.
 */
export function focusNextSibling(element: HTMLElement): void {
  const parent = element.parentElement;
  const children = Array.from(parent!.children) as HTMLElement[];
  const i = children.indexOf(element);
  const list = children.slice(i + 1).concat(children.slice(0, i + 1));
  const firstFocusable = list.find((e) => canFocus(e));
  if (firstFocusable) {
    firstFocusable.focus();
    firstFocusable.scrollIntoView();
  }
}
