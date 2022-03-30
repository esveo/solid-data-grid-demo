import {
  createMemo,
  createSignal,
  mapArray,
} from "solid-js";
import { assertNever } from "../helpers/tsUtils";
import { VirtualizedGrid } from "../virtualized-grid/VirtualizedGrid";
import { DataGridCell } from "./Cell";
import { DataGridContext } from "./GridContext";
import { HeaderRow, ItemRow, Row } from "./Row";

export type DataGridProps<TItem> = {
  width: number;
  height: number;
  context: DataGridContext<TItem>;
};

export const [dataGridColumnWidth, setDataGridColumnWidth] =
  createSignal(200);

export function DataGrid<TItem>(
  props: DataGridProps<TItem>
) {
  const [columnWidths, setColumnWidths] = createSignal();

  const headerRow: HeaderRow<TItem> = {
    type: "HEADER_ROW",
  };

  const itemRows = createMemo(
    mapArray(
      props.context.items,
      (item): ItemRow<TItem> => ({ item, type: "ITEM_ROW" })
    )
  );

  const rows = createMemo(() => {
    const rows: Row<TItem>[] = itemRows();

    rows.unshift(headerRow);

    return rows;
  });

  return (
    <VirtualizedGrid
      rows={rows()}
      columns={props.context.columns()}
      getColumnWidth={(c) => {
        const width = c.columnWidth();
        if (typeof width === "number") return width;
        return width[0]();
      }}
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
      frozenAreas={{ top: 1 }}
      height={props.height}
      width={props.width}
      cell={(props) => <DataGridCell {...props} />}
    />
  );
}
