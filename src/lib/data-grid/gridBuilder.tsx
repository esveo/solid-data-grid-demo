import { ColumnTemplate } from "./ColumnTemplate";
import { DataGrid, DataGridProps } from "./Grid";

export function createGrid<TItem>() {
  return {
    buildColumns(definitions: ColumnTemplate<TItem>[]) {
      return definitions;
    },
    Grid(props: DataGridProps<TItem>) {
      return <DataGrid {...props} />;
    },
  };
}
