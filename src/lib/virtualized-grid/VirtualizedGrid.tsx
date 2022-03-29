import {
  Accessor,
  batch,
  Component,
  createMemo,
  createSignal,
  For,
  JSX,
  mapArray,
} from "solid-js";
import { last } from "../array-helpers/arrayHelpers";
import { defineScope } from "../scoped-classes/scoped";
import "./VirtualizedGrid.scss";

export type VirtualizedGridCellProps<TRow, TColumn> = {
  row: TRow;
  column: TColumn;
  rowIndex: Accessor<number>;
  columnIndex: Accessor<number>;
  style: Accessor<JSX.CSSProperties>;
};

export type VirtualizedGridProps<TRow, TColumn> = {
  width: number;
  height: number;
  rows: TRow[];
  columns: TColumn[];
  cell: Component<VirtualizedGridCellProps<TRow, TColumn>>;
  getColumnWidth: (column: TColumn) => number;
  getRowHeight: (row: TRow) => number;
};

export function VirtualizedGrid<TRow, TColumn>(
  props: VirtualizedGridProps<TRow, TColumn>
) {
  const [scrollLeft, setScrollLeft] = createSignal(0);
  const [scrollTop, setScrollTop] = createSignal(0);

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

  const columnDescriptors = createMemo(() =>
    mapArray(
      () => props.columns,
      (column, index) => ({
        column,
        index,
      })
    )()
  );

  const rowDescriptors = createMemo(() =>
    mapArray(
      () => props.rows,
      (row, index) => ({
        row,
        index,
      })
    )()
  );

  const columnDimensions = createMemo(() =>
    props.columns
      .map((c) => ({
        size: props.getColumnWidth(c),
        start: 0,
        end: 0,
      }))
      .map(cumulateSizes)
  );

  const lastColumnDimension = () =>
    last(columnDimensions()) ?? {
      end: 0,
      size: 0,
      start: 0,
    };

  const rowDimensions = createMemo(() =>
    props.rows
      .map((r) => ({
        size: props.getRowHeight(r),
        start: 0,
        end: 0,
      }))
      .map(cumulateSizes)
  );
  const lastRowDimension = () =>
    last(rowDimensions()) ?? {
      end: 0,
      size: 0,
      start: 0,
    };

  const visibleRowDescriptors = createMemo(() => {
    const rowRanges = rowDimensions();
    return calculateVisibleItems({
      getItemDimensionRange: (row) =>
        rowRanges[row.index()],
      items: rowDescriptors(),
      sizeOfVisibleArea: props.height,
      startOfVisibleArea: scrollTop(),
    });
  });

  const visibleColumnDescriptors = createMemo(() => {
    const columnRanges = columnDimensions();
    return calculateVisibleItems({
      items: columnDescriptors(),
      getItemDimensionRange: (column) =>
        columnRanges[column.index()],
      sizeOfVisibleArea: props.width,
      startOfVisibleArea: scrollLeft(),
    });
  });

  return (
    <div
      class={css("__grid-container")}
      style={{
        width: props.width + "px",
        height: props.height + "px",
      }}
      onScroll={(e) => {
        const top = e.target.scrollTop;
        const left = e.target.scrollLeft;
        batch(() => {
          setScrollLeft(left);
          setScrollTop(top);
        });
      }}
    >
      <For each={visibleRowDescriptors()}>
        {(rowDescriptor) => (
          <For each={visibleColumnDescriptors()}>
            {(columnDescriptor) => {
              const columnDimension = () =>
                columnDimensions()[
                  columnDescriptor.index()
                ];
              const rowDimension = () =>
                rowDimensions()[rowDescriptor.index()];

              return props.cell({
                columnIndex: columnDescriptor.index,
                rowIndex: rowDescriptor.index,
                column: columnDescriptor.column,
                row: rowDescriptor.row,
                style: () => ({
                  position: "absolute",
                  left: columnDimension().start + "px",
                  width: columnDimension().size + "px",
                  top: rowDimension().start + "px",
                  height: rowDimension().size + "px",
                }),
              });
            }}
          </For>
        )}
      </For>
      <div
        style={{
          width: lastColumnDimension().end + "px",
          height: lastRowDimension().end + "px",
        }}
      />
    </div>
  );
}

const css = defineScope("solid-virtualized-grid");

type ElementDimensionRange = {
  start: number;
  size: number;
  end: number;
};

function calculateVisibleItems<TItem>(config: {
  items: TItem[];
  startOfVisibleArea: number;
  sizeOfVisibleArea: number;
  getItemDimensionRange: (
    item: TItem
  ) => ElementDimensionRange;
}) {
  if (config.items.length === 0) return [];

  const endOfVisibleArea =
    config.startOfVisibleArea + config.sizeOfVisibleArea;

  let firstVisibleIndex = 0;
  let i = 0;

  for (; i < config.items.length; i++) {
    const item = config.items[i];
    const range = config.getItemDimensionRange(item);
    const end = range.start + range.size;
    if (end > config.startOfVisibleArea) {
      firstVisibleIndex = i;
      break;
    }
  }

  let lastVisibleIndex = config.items.length - 1;

  for (; i < config.items.length; i++) {
    const item = config.items[i];
    const range = config.getItemDimensionRange(item);
    if (range.start > endOfVisibleArea) {
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
