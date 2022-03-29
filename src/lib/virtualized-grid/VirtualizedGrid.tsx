import {
  Accessor,
  batch,
  Component,
  createMemo,
  createSignal,
  JSX,
} from "solid-js";
import { last } from "../helpers/arrayHelpers";
import { useElementDimensions } from "../measure-dom/useElementDimensions";
import { defineScope } from "../scoped-classes/scoped";
import { calculateVirtualizedAreas } from "./calculateVirtualzedAreas";
import { virtualizedGridCssScope } from "./cssScope";
import { createItemRanges } from "./ElementDimensionRange";
import { GridArea } from "./GridArea";
import { indexItems } from "./indexItems";
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

  const indexedColumns = createMemo(() =>
    indexItems(props.columns)
  );

  const indexedRows = createMemo(() =>
    indexItems(props.rows)
  );

  const columnRanges = createMemo(() =>
    createItemRanges(props.columns, props.getColumnWidth)
  );

  const rowRanges = createMemo(() =>
    createItemRanges(props.rows, props.getRowHeight)
  );

  const horizontalAreas = calculateVirtualizedAreas({
    availableSize: () => gridDimensions().width,
    indexedItems: indexedColumns,
    itemDimensions: columnRanges,
    frozenCountAtStart: () => props.frozenAreas?.left,
    frozenCountAtEnd: () => props.frozenAreas?.right,
    scrollPosition: scrollLeft,
  });

  const verticalAreas = calculateVirtualizedAreas({
    availableSize: () => gridDimensions().height,
    indexedItems: indexedRows,
    itemDimensions: rowRanges,
    frozenCountAtStart: () => props.frozenAreas?.top,
    frozenCountAtEnd: () => props.frozenAreas?.bottom,
    scrollPosition: scrollTop,
  });

  const areas = Object.values(verticalAreas).flatMap(
    (vertical) =>
      Object.values(horizontalAreas).map((horizontal) => (
        <GridArea
          cell={props.cell}
          columnDimensions={columnRanges()}
          rowDimensions={rowRanges()}
          horizontal={horizontal}
          vertical={vertical}
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
            width: (last(columnRanges())?.end ?? 0) + "px",
            height: (last(rowRanges())?.end ?? 0) + "px",
          }}
        />
      </div>
    </div>
  );
}

const css = defineScope(virtualizedGridCssScope);
