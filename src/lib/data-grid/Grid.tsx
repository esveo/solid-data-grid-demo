import {
  createMemo,
  createSignal,
  mapArray,
} from "solid-js";
import { assertNever } from "../helpers/tsUtils";
import { VirtualizedGrid } from "../virtualized-grid/VirtualizedGrid";
import { DataGridCell } from "./Cell";
import { useDataGridContext } from "./GridContext";
import { DataRow, HeaderRow } from "./Row";

export type DataGridProps = {
  width: number;
  height: number;
};

export const [dataGridColumnWidth, setDataGridColumnWidth] =
  createSignal(200);

export function DataGrid(props: DataGridProps) {
  const context = useDataGridContext<unknown>();
  const headerRow: HeaderRow<unknown> = {
    type: "HEADER_ROW",
  };

  const dataRows = createMemo(
    mapArray(
      context.derivations.flatTree,
      (node): DataRow<unknown> => {
        switch (node.type) {
          case "GROUP_NODE":
            return {
              type: "GROUP_ROW",
              items: node.items,
              path: node.path,
            };
          case "ITEM_NODE":
            return {
              type: "ITEM_ROW",
              item: node.item,
              path: node.path,
            };
          default:
            assertNever(node);
        }
      }
    )
  );

  const rows = createMemo(() => {
    const rows = [headerRow, ...dataRows()];

    return rows;
  });

  const columnsByArea = context.derivations.columnsByArea;

  return (
    <VirtualizedGrid
      rows={rows()}
      columns={[
        ...context.derivations.columnsByArea().LEFT,
        ...context.derivations.columnsByArea().UNFROZEN,
        ...context.derivations.columnsByArea().RIGHT,
      ].filter(Boolean)}
      getColumnWidth={(c) =>
        context.derivations.getColumnWidth(c.key)
      }
      getRowHeight={(row) => {
        switch (row.type) {
          case "HEADER_ROW":
            return context.input.headerHeight ?? 50;
          case "ITEM_ROW":
            return context.input.itemRowHeight ?? 30;
          case "GROUP_ROW":
            return context.input.groupRowHeight ?? 30;
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
