import { Accessor, createMemo } from "solid-js";
import { calculateVisibleItems } from "./calculateVisibleItems";
import { ElementDimensionRange } from "./ElementDimensionRange";
import { IndexedItem } from "./indexItems";

export function calculateVirtualizedAreas<TItem>(config: {
  frozenCountAtStart: Accessor<number | undefined>;
  frozenCountAtEnd: Accessor<number | undefined>;
  itemDimensions: Accessor<ElementDimensionRange[]>;
  availableSize: Accessor<number>;
  indexedItems: Accessor<IndexedItem<TItem>[]>;
  scrollPosition: Accessor<number>;
}): {
  firstFrozen: VirtualizedAreaData<TItem>;
  unfrozen: VirtualizedAreaData<TItem>;
  secondFrozen: VirtualizedAreaData<TItem>;
} {
  const firstUnfrozenIndex = () =>
    config.frozenCountAtStart() ?? 0;

  const lastUnfrozenIndex = () =>
    config.indexedItems().length -
    (config.frozenCountAtEnd() ?? 0) -
    1;

  const sizeOfFirstFrozenArea = createMemo(() => {
    if (!config.frozenCountAtStart()) return 0;
    if (!config.indexedItems().length) return 0;

    const from = config.itemDimensions()[0].start;
    const to =
      config.itemDimensions()[
        config.frozenCountAtStart()! - 1
      ].end;
    return to - from;
  });

  const sizeOfSecondFrozenArea = createMemo(() => {
    if (!config.frozenCountAtEnd()) return 0;
    if (!config.indexedItems().length) return 0;

    const from =
      config.itemDimensions()[lastUnfrozenIndex() + 1]
        ?.start ?? 0;
    const to =
      config.itemDimensions()[
        config.indexedItems().length - 1
      ]?.end ?? 0;
    return to - from;
  });
  const sizeOfUnfrozenArea = () =>
    config.availableSize() -
    sizeOfFirstFrozenArea() -
    sizeOfSecondFrozenArea();

  const sizeOfUnfrozenItems = createMemo(() => {
    if (!config.indexedItems().length) return 0;

    const from =
      config.itemDimensions()[firstUnfrozenIndex()]
        ?.start ?? 0;
    const to =
      config.itemDimensions()[lastUnfrozenIndex()]?.end ??
      0;
    return to - from;
  });

  const firstFrozenItems = createMemo(() =>
    config.indexedItems().slice(0, firstUnfrozenIndex())
  );
  const unfrozenIndexedItems = createMemo(() =>
    config
      .indexedItems()
      .slice(firstUnfrozenIndex(), lastUnfrozenIndex() + 1)
  );
  const secondFrozenIndexedItems = createMemo(() =>
    config.indexedItems().slice(lastUnfrozenIndex() + 1)
  );

  const visibleIndexedItems = createMemo(() =>
    calculateVisibleItems({
      getItemDimensionRange: (row) =>
        config.itemDimensions()[row.index()],
      items: unfrozenIndexedItems(),
      sizeOfVisibleArea: sizeOfUnfrozenArea(),
      startOfVisibleArea:
        config.scrollPosition() + sizeOfFirstFrozenArea(),
    })
  );

  return {
    firstFrozen: {
      indexedItems: firstFrozenItems,
      visibleIndexedItems: firstFrozenItems,
      areaSize: sizeOfFirstFrozenArea,
      totalItemSize: sizeOfFirstFrozenArea,
      positionOffset: () => 0,
      scrollPosition: () => 0,
    },
    unfrozen: {
      areaSize: sizeOfUnfrozenArea,
      totalItemSize: sizeOfUnfrozenItems,
      indexedItems: unfrozenIndexedItems,
      visibleIndexedItems: visibleIndexedItems,
      positionOffset: sizeOfFirstFrozenArea,
      scrollPosition: config.scrollPosition,
    },
    secondFrozen: {
      indexedItems: secondFrozenIndexedItems,
      visibleIndexedItems: secondFrozenIndexedItems,
      areaSize: sizeOfSecondFrozenArea,
      totalItemSize: sizeOfSecondFrozenArea,
      positionOffset: () =>
        sizeOfFirstFrozenArea() + sizeOfUnfrozenItems(),
      scrollPosition: () => 0,
    },
  };
}

export type VirtualizedAreaData<TItem> = {
  indexedItems: Accessor<IndexedItem<TItem>[]>;
  visibleIndexedItems: Accessor<IndexedItem<TItem>[]>;
  areaSize: Accessor<number>;
  totalItemSize: Accessor<number>;
  positionOffset: Accessor<number>;
  scrollPosition: Accessor<number>;
};
