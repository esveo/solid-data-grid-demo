import { Accessor } from "solid-js";
import { ColumnTemplateDefinition } from "./ColumnTemplate";
import {
  DataGridContext,
  DataGridContextInput,
  useDataGridContext,
} from "./GridContext";

export function createGridBuilder<TItem>() {
  return {
    buildColumns(
      definitions: (
        | ColumnTemplateDefinition<TItem>
        | Accessor<ColumnTemplateDefinition<TItem>[]>
      )[]
    ) {
      return () =>
        definitions.flatMap((d) => {
          if (typeof d === "function") return d();
          return d;
        });
    },
    buildContext(input: DataGridContextInput<TItem>) {
      return new DataGridContext(input);
    },
    useContext() {
      return useDataGridContext<TItem>();
    },
  };
}
