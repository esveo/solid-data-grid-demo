import { Accessor, mapArray } from "solid-js";

export function indexItems<TItem>(
  items: ReadonlyArray<TItem>
): Array<IndexedItem<TItem>> {
  return mapArray(
    () => items,
    (item, index) => ({ item, index })
  )();
}

export type IndexedItem<TItem> = {
  item: TItem;
  index: Accessor<number>;
};
