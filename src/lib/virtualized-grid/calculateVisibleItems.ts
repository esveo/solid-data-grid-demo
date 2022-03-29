import { ElementDimensionRange } from "./ElementDimensionRange";

export function calculateVisibleItems<TItem>(config: {
  items: TItem[];
  startOfVisibleArea: number;
  sizeOfVisibleArea: number;
  getItemDimensionRange: (
    item: TItem
  ) => ElementDimensionRange;
}) {
  if (config.items.length === 0) return [];

  const start = Math.floor(config.startOfVisibleArea);
  const size = Math.ceil(config.sizeOfVisibleArea);

  const end = start + size;

  let firstVisibleIndex = 0;
  let i = 0;

  for (; i < config.items.length; i++) {
    const item = config.items[i];
    const range = config.getItemDimensionRange(item);
    const end = range.start + range.size;
    if (end > start) {
      firstVisibleIndex = i;
      break;
    }
  }

  let lastVisibleIndex = config.items.length - 1;

  for (; i < config.items.length; i++) {
    const item = config.items[i];
    const range = config.getItemDimensionRange(item);
    if (range.start > end) {
      lastVisibleIndex = i - 1;
      break;
    }
  }

  const visibleItems: TItem[] = [];
  for (
    let i = firstVisibleIndex;
    i <= lastVisibleIndex;
    i++
  ) {
    visibleItems.push(config.items[i]);
  }

  return visibleItems;
}
