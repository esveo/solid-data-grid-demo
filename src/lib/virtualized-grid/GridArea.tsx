import { Component, createEffect, For } from "solid-js";
import { defineScope } from "../scoped-classes/scoped";
import { VirtualizedAreaData } from "./calculateVirtualzedAreas";
import { virtualizedGridCssScope } from "./cssScope";
import { ElementDimensionRange } from "./ElementDimensionRange";
import { VirtualizedGridCellProps } from "./VirtualizedGrid";

export function GridArea<TRow, TColumn>(props: {
  horizontal: VirtualizedAreaData<TColumn>;
  vertical: VirtualizedAreaData<TRow>;
  columnDimensions: ElementDimensionRange[];
  rowDimensions: ElementDimensionRange[];
  cell: Component<VirtualizedGridCellProps<TRow, TColumn>>;
}) {
  let scrollContainer: HTMLDivElement;

  createEffect(() => {
    (scrollContainer.scrollTop =
      props.vertical.scrollPosition()),
      (scrollContainer.scrollLeft =
        props.horizontal.scrollPosition());
  });

  return (
    <div
      ref={scrollContainer!}
      class={css("__grid-area")}
      style={{
        width: props.horizontal.areaSize() + "px",
        height: props.vertical.areaSize() + "px",
      }}
    >
      <For each={props.vertical.visibleIndexedItems()}>
        {(indexedRow) => (
          <For
            each={props.horizontal.visibleIndexedItems()}
          >
            {(indexedColumn) => {
              const columnDimension = () =>
                props.columnDimensions[
                  indexedColumn.index()
                ];
              const rowDimension = () =>
                props.rowDimensions[indexedRow.index()];

              return props.cell({
                columnIndex: indexedColumn.index,
                rowIndex: indexedRow.index,
                column: indexedColumn.item,
                row: indexedRow.item,
                style: () => ({
                  position: "absolute",
                  left:
                    columnDimension().start -
                    props.horizontal.positionOffset() +
                    "px",
                  top:
                    rowDimension().start -
                    props.vertical.positionOffset() +
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
          width: props.horizontal.totalItemSize + "px",
          height: props.vertical.totalItemSize + "px",
        }}
      />
    </div>
  );
}

const css = defineScope(virtualizedGridCssScope);
