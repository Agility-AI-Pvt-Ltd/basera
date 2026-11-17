/** Height of tab bar content (icons + labels) above safe area. */
export const TAB_BAR_HEIGHT = 76;

export function scrollPaddingBelowTabBar(safeAreaBottom: number): number {
  return TAB_BAR_HEIGHT + Math.max(safeAreaBottom, 8) + 12;
}