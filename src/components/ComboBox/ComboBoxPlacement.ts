/**
 * Position a ComboBox's dropdown at the center of its button,
 * but also based in the selected option.
 */
export function position(reference: HTMLElement, floating: HTMLElement) {
  const refRect = reference.getBoundingClientRect();
  const selected = floating.querySelector<HTMLElement>(".option[data-selected=\"true\"]");

  // Reset styles temporarily so we can measure properly
  floating.style.maxHeight = "";
  floating.style.top = "0px";
  floating.style.left = "0px";

  const floatRect = floating.getBoundingClientRect();

  let offsetY = 0;

  if (selected) {
    const selectedRect = selected.getBoundingClientRect();
    offsetY = selectedRect.top + selectedRect.height / 2 - floating.children[1].getBoundingClientRect().top;
  } else {
    offsetY = floatRect.height / 2;
  }

  // Calculate initial top (ideal center-aligned position)
  let top = refRect.top + refRect.height/2 - offsetY - reference.clientTop;

  // Clamp top to minimum 0
  top = Math.max(0, top);

  const left = refRect.left - reference.clientLeft/2;

  // Now calculate maxHeight based on clamped top
  const maxHeight = Math.min(
    floatRect.height,
    window.innerHeight - top
  );

  Object.assign(floating.style, {
    top: `${top}px`,
    left: `${left}px`,
    maxHeight: `${maxHeight}px`,
  });
}

/**
 * Scroll the dropdown so that the selected option aligns vertically
 * with the center of the external reference element.
 */
export function scrollDropdownAlignSelected(
  reference: HTMLElement,
  dropdownList: HTMLElement
) {
  const selected = dropdownList.querySelector<HTMLElement>('.option[data-selected="true"]');
  if (!selected) return;

  // Get bounding rectangles
  const refRect = reference.getBoundingClientRect();
  const listRect = dropdownList.getBoundingClientRect();
  const selectedRect = selected.getBoundingClientRect();

  // Compute the offset between the selected option's center and reference center
  const referenceCenterY = refRect.top + refRect.height / 2;
  const selectedCenterY = selectedRect.top + selectedRect.height / 2;

  // Calculate how much to scroll (positive = scroll down, negative = scroll up)
  const delta = selectedCenterY - referenceCenterY;

  // Adjust scrollTop accordingly
  dropdownList.scrollTop += delta;
}