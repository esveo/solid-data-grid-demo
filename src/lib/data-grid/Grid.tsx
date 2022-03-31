import {
  createMemo,
  createSignal,
  mapArray,
} from "solid-js";
import { assertNever } from "../helpers/tsUtils";
import { VirtualizedGrid } from "../virtualized-grid/VirtualizedGrid";
import { DataGridCell } from "./Cell";
import { DataGridContext } from "./GridContext";
import { DataRow, HeaderRow } from "./Row";

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

  const dataRows = createMemo(
    mapArray(
      props.context.derivations.flatTree,
      (node): DataRow<TItem> => {
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

  const columnsByArea =
    props.context.derivations.columnsByArea;

  return (
    <VirtualizedGrid
      rows={rows()}
      columns={[
        ...props.context.derivations.columnsByArea().LEFT,
        ...props.context.derivations.columnsByArea()
          .UNFROZEN,
        ...props.context.derivations.columnsByArea().RIGHT,
      ].filter(Boolean)}
      getColumnWidth={(c) =>
        props.context.derivations.getColumnWidth(c.key)
      }
      getRowHeight={(row) => {
        switch (row.type) {
          case "HEADER_ROW":
            return 40;
          case "ITEM_ROW":
            return 30;
          case "GROUP_ROW":
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
