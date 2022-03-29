export function createItemRanges<TItem>(
  items: ReadonlyArray<TItem>,
  getSize: (item: TItem) => number
) {
  return items
    .map((item) => ({
      size: getSize(item),
      start: 0,
      end: 0,
    }))
    .map(cumulateSizes);
}

function cumulateSizes(
  range: ElementDimensionRange,
  index: number,
  ranges: ElementDimensionRange[]
) {
  const prev = ranges[index - 1] ?? {
    size: 0,
    start: 0,
  };
  range.start = prev.start + prev.size;
  range.end = range.start + range.size;
  return range;
}

export type ElementDimensionRange = {
  start: number;
  size: number;
  end: number;
};
