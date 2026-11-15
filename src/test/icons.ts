/** The pixel icons shown inside an element, as one string of icon names ("wipe x power down"). */
export const iconsOf = (el: Element | null | undefined): string =>
  [...(el?.querySelectorAll<HTMLElement>("[data-icon]") ?? [])].map((i) => i.dataset.icon).join(" ");

/** A domino as the kid sees it: its icons, then its sentence ("power down|Power is low today."). */
export const dominoView = (el: Element): string => `${iconsOf(el)}|${el.textContent}`;
