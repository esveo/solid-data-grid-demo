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
  const headerRow: HeaderRow<TItem> = {
    type: "HEADER_ROW",
  };

  const itemRows = createMemo(
    mapArray(
      props.context.input.items,
      (item): ItemRow<TItem> => ({ item, type: "ITEM_ROW" })
    )
  );

  const rows = createMemo(() => {
    const rows: Row<TItem>[] = itemRows();

    rows.unshift(headerRow);

    return rows;
  });

  const columnsByArea =
    props.context.derivations.columnsByArea;

  return (
    <VirtualizedGrid
      rows={rows()}
      columns={props.context.derivations.columns()}
      getColumnWidth={(c) =>
        props.context.derivations.getColumnWidth(c.key)
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
      frozenAreas={{
        top: 1,
        left: columnsByArea().LEFT.length,
        right: columnsByArea().RIGHT.length,
      }}
      height={props.height}
      width={props.width}
      cell={(props) => <DataGridCell {...props} />}
    />
  );
}
