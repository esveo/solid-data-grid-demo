import {
  createEffect,
  createMemo,
  createSignal,
  mapArray,
} from "solid-js";
import { assertNever } from "../helpers/tsUtils";
import { VirtualizedGrid } from "../virtualized-grid/VirtualizedGrid";
import { DataGridCell } from "./Cell";
import { ColumnTemplate } from "./ColumnTemplate";
import { HeaderRow, ItemRow, Row } from "./Row";

export type DataGridProps<TItem> = {
  width: number;
  height: number;
  items: TItem[];
  columns: ColumnTemplate<TItem>[];
};

export const [dataGridColumnWidth, setDataGridColumnWidth] =
  createSignal(200);

export function DataGrid<TItem>(
  props: DataGridProps<TItem>
) {
  const headerRow: HeaderRow<TItem> = {
    type: "HEADER_ROW",
  };
  const rows = createMemo(() => {
    const itemRows: Row<TItem>[] = mapArray(
      () => props.items,
      (item): ItemRow<TItem> => ({ item, type: "ITEM_ROW" })
    )();

    itemRows.unshift(headerRow);

    return itemRows;
  });

  createEffect(() => {
    dataGridColumnWidth();
  });

  return (
    <VirtualizedGrid
      rows={rows()}
      columns={props.columns}
      getColumnWidth={(c) =>
        c.title === "Country" ? dataGridColumnWidth() : 500
      }
      getRowHeight={(row) => {
        switch (row.type) {
          case "HEADER_ROW":
            return 40;
          case "ITEM_ROW":
            return 30;
          default:
            assertNever(row);
        }
      }}
      frozenAreas={{ top: 1, left: 3, bottom: 5 }}
      height={props.height}
      width={props.width}
      cell={DataGridCell}
    />
  );
}
