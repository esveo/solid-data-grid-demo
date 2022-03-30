/* @refresh reload */
import {
  Accessor,
  createContext,
  createMemo,
  JSX,
  mapArray,
  useContext,
} from "solid-js";
import {
  addDefaultsToColumnTemplateDefinition,
  ColumnTemplate,
  ColumnTemplateDefinition,
} from "./ColumnTemplate";

export type DataGridContextInput<TItem> = {
  gridKey: string;
  columns: Accessor<ColumnTemplateDefinition<TItem>[]>;
  items: Accessor<TItem[]>;
};

export class DataGridContext<TItem> {
  gridKey: string;
  columns: Accessor<ColumnTemplate<TItem>[]>;
  items: Accessor<TItem[]>;

  constructor(input: DataGridContextInput<TItem>) {
    this.gridKey = input.gridKey;
    this.columns = createMemo(
      mapArray(input.columns, (d) =>
        addDefaultsToColumnTemplateDefinition(d, () => this)
      )
    );

    this.items = input.items;
  }

  resizeColumn(
    column: ColumnTemplate<TItem>,
    newWidth: number
  ) {
    const width = column.columnWidth();
    if (typeof width === "number") return;
    width[1](Math.max(newWidth, 60));
  }
}

export const DataGridContextToken =
  createContext<DataGridContext<any>>();

export function DataGridContextProvider<TItem>(props: {
  value: DataGridContext<TItem>;
  children: JSX.Element;
}) {
  return (
    <DataGridContextToken.Provider value={props.value}>
      {props.children}
    </DataGridContextToken.Provider>
  );
}

export function useDataGridContext<TItem>() {
  const contextValue = useContext(DataGridContextToken);

  if (!contextValue)
    throw new Error("No datagrid provider found");

  return contextValue as DataGridContext<TItem>;
}
