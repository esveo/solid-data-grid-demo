import {
  Accessor,
  batch,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  mapArray,
} from "solid-js";
import { last } from "../array-helpers/arrayHelpers";
import { useElementDimensions } from "../measure-dom/useElementDimensions";
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
  frozenAreas?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
};

export function VirtualizedGrid<TRow, TColumn>(
  props: VirtualizedGridProps<TRow, TColumn>
) {
  const [scrollLeft, setScrollLeft] = createSignal(0);
  const [scrollTop, setScrollTop] = createSignal(0);

  let scrollBarDummy: HTMLDivElement;
  const gridDimensions = useElementDimensions(
    () => scrollBarDummy
  );

  const areaRefs: {
    [Key in HorizontalKey]: {
      [Key in VerticalKey]?: HTMLDivElement;
    };
  } = {
    left: {},
    mid: {},
    right: {},
  };

  createEffect(() => {
    const left = scrollLeft();
    const top = scrollTop();

    areaRefs.left.mid!.scrollTop = top;

    areaRefs.mid.top!.scrollLeft = left;

    areaRefs.mid.mid!.scrollTop = top;
    areaRefs.mid.mid!.scrollLeft = left;

    areaRefs.mid.bottom!.scrollLeft = left;

    areaRefs.right.mid!.scrollTop = top;
  });

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

  /**
   * Frozen columns stuff
   */
  const firstUnfrozenColumnIndex = () =>
    props.frozenAreas?.left ?? 0;
  const lastUnfrozenColumnIndex = () =>
    props.columns.length -
    (props.frozenAreas?.left ?? 0) -
    (props.frozenAreas?.right ?? 0);

  const widthOfLeftFrozenColumns = createMemo(() => {
    if (!props.frozenAreas?.left) return 0;
    if (!props.columns.length) return 0;

    const from = columnDimensions()[0].start;
    const to =
      columnDimensions()[props.frozenAreas.left - 1].end;
    return to - from;
  });
  const widthOfRightFrozenColumns = createMemo(() => {
    if (!props.frozenAreas?.right) return 0;
    if (!props.columns.length) return 0;

    const from =
      columnDimensions()[lastUnfrozenColumnIndex() + 1]
        .start;
    const to =
      columnDimensions()[props.columns.length - 1].end;
    return to - from;
  });
  const widthOfUnfrozenColumnContainer = () =>
    gridDimensions().width -
    widthOfLeftFrozenColumns() -
    widthOfRightFrozenColumns();

  const widthOfUnfrozenColumns = createMemo(() => {
    if (!props.columns.length) return 0;

    const from =
      columnDimensions()[firstUnfrozenColumnIndex()].start;
    const to =
      columnDimensions()[lastUnfrozenColumnIndex()].end;
    return to - from;
  });

  const leftFrozenColumnDescriptors = () =>
    columnDescriptors().slice(
      0,
      firstUnfrozenColumnIndex()
    );
  const unfrozenColumnDescriptors = () =>
    columnDescriptors().slice(
      firstUnfrozenColumnIndex(),
      lastUnfrozenColumnIndex() + 1
    );
  const rightFrozenColumnDescriptors = () =>
    columnDescriptors().slice(
      lastUnfrozenColumnIndex() + 1
    );

  /**
   * Frozen rows stuff
   */
  const firstUnfrozenRowIndex = () =>
    props.frozenAreas?.top ?? 0;
  const lastUnfrozenRowIndex = () =>
    props.rows.length -
    (props.frozenAreas?.top ?? 0) -
    (props.frozenAreas?.bottom ?? 0);

  const heightOfTopFrozenRows = createMemo(() => {
    if (!props.rows.length) return 0;
    if (!props.frozenAreas?.top) return 0;

    const from = rowDimensions()[0].start;
    const to =
      rowDimensions()[props.frozenAreas.top - 1].end;
    return to - from;
  });
  const heightOfBottomFrozenRows = createMemo(() => {
    if (!props.rows.length) return 0;
    if (!props.frozenAreas?.bottom) return 0;

    const from =
      rowDimensions()[lastUnfrozenRowIndex() + 1].start;
    const to = rowDimensions()[props.rows.length - 1].end;
    return to - from;
  });
  const heightOfUnfrozenRowContainer = () =>
    gridDimensions().height -
    heightOfTopFrozenRows() -
    heightOfBottomFrozenRows();

  const heightOfUnfrozenRows = createMemo(() => {
    if (!props.rows.length) return 0;

    const from =
      rowDimensions()[firstUnfrozenRowIndex()].start;
    const to = rowDimensions()[lastUnfrozenRowIndex()].end;
    return to - from;
  });

  const topFrozenRowDescriptors = () =>
    rowDescriptors().slice(0, firstUnfrozenRowIndex());
  const unfrozenRowDescriptors = () =>
    rowDescriptors().slice(
      firstUnfrozenRowIndex(),
      lastUnfrozenRowIndex() + 1
    );

  const bottomFrozenRowDescriptors = () =>
    rowDescriptors().slice(lastUnfrozenRowIndex() + 1);

  /**
   * Visible rows and columns
   */
  const visibleUnfrozenRowDescriptors = createMemo(() => {
    const rowRanges = rowDimensions();
    return calculateVisibleItems({
      getItemDimensionRange: (row) =>
        rowRanges[row.index()],
      items: unfrozenRowDescriptors(),
      sizeOfVisibleArea: heightOfUnfrozenRowContainer(),
      startOfVisibleArea:
        scrollTop() + heightOfTopFrozenRows(),
    });
  });

  const visibleUnfrozenColumnDescriptors = createMemo(
    () => {
      const columnRanges = columnDimensions();
      return calculateVisibleItems({
        items: unfrozenColumnDescriptors(),
        getItemDimensionRange: (column) =>
          columnRanges[column.index()],
        sizeOfVisibleArea: widthOfUnfrozenColumnContainer(),
        startOfVisibleArea:
          scrollLeft() + widthOfLeftFrozenColumns(),
      });
    }
  );

  const verticalConfig: {
    [Key in VerticalKey]: {
      visibleRowDescriptors: Accessor<
        RowDescriptor<TRow>[]
      >;
      height: Accessor<number>;
      contentHeight: Accessor<number>;
      offsetTop: Accessor<number>;
    };
  } = {
    top: {
      visibleRowDescriptors: topFrozenRowDescriptors,
      height: heightOfTopFrozenRows,
      contentHeight: heightOfTopFrozenRows,
      offsetTop: () => 0,
    },
    mid: {
      visibleRowDescriptors: visibleUnfrozenRowDescriptors,
      height: heightOfUnfrozenRowContainer,
      contentHeight: heightOfUnfrozenRows,
      offsetTop: heightOfTopFrozenRows,
    },
    bottom: {
      visibleRowDescriptors: bottomFrozenRowDescriptors,
      height: heightOfBottomFrozenRows,
      contentHeight: heightOfBottomFrozenRows,
      offsetTop: () =>
        heightOfTopFrozenRows() + heightOfUnfrozenRows(),
    },
  };
  const horizontalConfig: {
    [Key in HorizontalKey]: {
      visibleColumnDescriptors: Accessor<
        ColumnDescriptor<TColumn>[]
      >;
      width: Accessor<number>;
      contentWidth: Accessor<number>;
      offsetLeft: Accessor<number>;
    };
  } = {
    left: {
      visibleColumnDescriptors: leftFrozenColumnDescriptors,
      width: widthOfLeftFrozenColumns,
      contentWidth: widthOfLeftFrozenColumns,
      offsetLeft: () => 0,
    },
    mid: {
      visibleColumnDescriptors:
        visibleUnfrozenColumnDescriptors,
      width: widthOfUnfrozenColumnContainer,
      contentWidth: widthOfUnfrozenColumns,
      offsetLeft: widthOfLeftFrozenColumns,
    },
    right: {
      visibleColumnDescriptors:
        rightFrozenColumnDescriptors,
      width: widthOfRightFrozenColumns,
      contentWidth: widthOfRightFrozenColumns,
      offsetLeft: () =>
        widthOfLeftFrozenColumns() +
        widthOfUnfrozenColumns(),
    },
  };

  const areas = verticalKeys.flatMap((yKey) =>
    horizontalKeys.map((xKey) => (
      <GridArea
        label={`__${xKey}-${yKey}-area`}
        ref={areaRefs[xKey][yKey]}
        cell={props.cell}
        columnDimensions={columnDimensions()}
        rowDimensions={rowDimensions()}
        visibleColumnDescriptors={horizontalConfig[
          xKey
        ].visibleColumnDescriptors()}
        contentWidth={horizontalConfig[xKey].contentWidth()}
        offsetLeft={horizontalConfig[xKey].offsetLeft()}
        width={horizontalConfig[xKey].width()}
        visibleRowDescriptors={verticalConfig[
          yKey
        ].visibleRowDescriptors()}
        contentHeight={verticalConfig[yKey].contentHeight()}
        height={verticalConfig[yKey].height()}
        offsetTop={verticalConfig[yKey].offsetTop()}
      />
    ))
  );

  return (
    <div
      class={css("__grid-container")}
      style={{
        width: props.width + "px",
        height: props.height + "px",
      }}
    >
      <div
        class={css("__cell-area-container")}
        style={{
          width: gridDimensions().width + "px",
          height: gridDimensions().height + "px",
          position: "absolute",
        }}
        onWheel={(e) => {
          e.preventDefault();
          scrollBarDummy.scrollTop += e.deltaY;
          scrollBarDummy.scrollLeft += e.deltaX;
        }}
      >
        {areas}
      </div>
      <div
        ref={scrollBarDummy!}
        onScroll={(e) => {
          batch(() => {
            setScrollTop(e.target.scrollTop);
            setScrollLeft(e.target.scrollLeft);
          });
        }}
        class={css("__scroll-bar-dummy")}
      >
        <div
          style={{
            width: lastColumnDimension().end + "px",
            height: lastRowDimension().end + "px",
          }}
        />
      </div>
    </div>
  );
}

function GridArea<TRow, TColumn>(props: {
  label: string;
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
  contentWidth?: number;
  contentHeight?: number;
  visibleRowDescriptors: RowDescriptor<TRow>[];
  visibleColumnDescriptors: ColumnDescriptor<TColumn>[];
  columnDimensions: ElementDimensionRange[];
  rowDimensions: ElementDimensionRange[];
  cell: Component<VirtualizedGridCellProps<TRow, TColumn>>;
  ref?: HTMLDivElement;
}) {
  return (
    <div
      ref={props.ref}
      class={css(props.label, "__grid-area")}
      style={{
        width: props.width + "px",
        height: props.height + "px",
      }}
    >
      <For each={props.visibleRowDescriptors}>
        {(rowDescriptor) => (
          <For each={props.visibleColumnDescriptors}>
            {(columnDescriptor) => {
              const columnDimension = () =>
                props.columnDimensions[
                  columnDescriptor.index()
                ];
              const rowDimension = () =>
                props.rowDimensions[rowDescriptor.index()];

              return props.cell({
                columnIndex: columnDescriptor.index,
                rowIndex: rowDescriptor.index,
                column: columnDescriptor.column,
                row: rowDescriptor.row,
                style: () => ({
                  position: "absolute",
                  left:
                    columnDimension().start -
                    props.offsetLeft +
                    "px",
                  top:
                    rowDimension().start -
                    props.offsetTop +
                    "px",
                  width: columnDimension().size + "px",
                  height: rowDimension().size + "px",
                }),
              });
            }}
          </For>
        )}
      </For>
      <div
        style={{
          width: props.contentWidth + "px",
          height: props.contentHeight + "px",
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

const horizontalKeys = ["left", "mid", "right"] as const;
type HorizontalKey = typeof horizontalKeys[number];

const verticalKeys = ["top", "mid", "bottom"] as const;
type VerticalKey = typeof verticalKeys[number];

type RowDescriptor<TRow> = {
  row: TRow;
  index: Accessor<number>;
};

type ColumnDescriptor<TColumn> = {
  column: TColumn;
  index: Accessor<number>;
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
