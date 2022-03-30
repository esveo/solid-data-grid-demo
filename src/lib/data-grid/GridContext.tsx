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
  createStore,
  DeepMutable,
  produce,
} from "solid-js/store";
import { keyBy } from "../helpers/arrayHelpers";
import { ObjectOf } from "../helpers/tsUtils";
import {
  FrozenColumnArea,
  SortDirection,
} from "./baseTypes";
import {
  addDefaultsToColumnTemplateDefinition,
  ColumnTemplate,
  ColumnTemplateDefinition,
} from "./ColumnTemplate";

export type DataGridContextInput<TItem> = {
  gridKey: string;
  columnDefinitions: Accessor<
    ColumnTemplateDefinition<TItem>[]
  >;
  items: Accessor<TItem[]>;
};

export class DataGridContext<TItem> {
  private updateStore: (
    updater: (
      state: DeepMutable<DataGridContext<TItem>["state"]>
    ) => void
  ) => void;

  input: DataGridContextInput<TItem>;
  state: ReturnType<
    DataGridContext<TItem>["buildStore"]
  >[0];
  derivations: ReturnType<
    DataGridContext<TItem>["deriveData"]
  >;

  constructor(input: DataGridContextInput<TItem>) {
    this.input = input;
    const [state, updateStore] = this.buildStore();

    this.state = state;
    this.updateStore = (updater) =>
      updateStore(produce(updater));

    this.derivations = this.deriveData();
  }

  private buildStore() {
    return createStore({
      areaByColumnKey: {} as ObjectOf<FrozenColumnArea>,
      columnWidthByColumnKey: {} as ObjectOf<number>,
      sortBy: null as null | {
        columnKey: string;
        direction: SortDirection;
      },
    });
  }

  private deriveData() {
    /**
     * Define a function that works as an object
     * that can be extended after the definition
     *
     * This way we can simply return $ at the end of this function
     * while still having complete type information
     * about all fields that are added in here.
     */
    function $() {}

    $.columns = createMemo(
      mapArray(this.input.columnDefinitions, (d) =>
        addDefaultsToColumnTemplateDefinition(d, () => this)
      )
    );

    $.columnsByKey = createMemo(() =>
      keyBy($.columns(), (c) => c.key)
    );

    $.columnsByArea = createMemo(() => {
      const columnsByArea: Record<
        FrozenColumnArea,
        ColumnTemplate<TItem>[]
      > = {
        LEFT: [],
        RIGHT: [],
        UNFROZEN: [],
      };
      for (const column of $.columns()) {
        const area =
          this.state.areaByColumnKey[column.key] ??
          column.frozen;
        columnsByArea[area].push(column);
      }
      return columnsByArea;
    });

    $.getColumnWidth = (columnKey: string) =>
      this.state.columnWidthByColumnKey[columnKey] ??
      this.derivations.columnsByKey()[columnKey]
        ?.columnWidth ??
      200;

    $.sortedItems = createMemo(() => {
      const sortBy = this.state.sortBy;
      if (!sortBy) return this.input.items();

      const column = $.columnsByKey()[sortBy.columnKey];
      if (!column) return this.input.items();

      const getSortCriteria = column.sortBy;

      const directionSign =
        sortBy.direction === "ASC" ? -1 : 1;

      const sortCriteria = this.input
        .items()
        .map((item) => ({
          sortCriteria: getSortCriteria({
            item,
            context: () => this,
            template: column,
          }),
          item,
        }));

      return sortCriteria
        .sort((a, b) => {
          if (a.sortCriteria < b.sortCriteria)
            return directionSign;
          if (a.sortCriteria > b.sortCriteria)
            return directionSign * -1;
          return 0;
        })
        .map((n) => n.item);
    });

    return $ as Omit<typeof $, keyof Function>;
  }

  resizeColumn(
    column: ColumnTemplate<TItem>,
    newWidth: number
  ) {
    const clampedNewWidth = Math.max(newWidth, 60);
    this.updateStore((draft) => {
      draft.columnWidthByColumnKey[column.key] =
        clampedNewWidth;
    });
  }

  sortByColumn(
    column: ColumnTemplate<TItem>,
    direction: SortDirection
  ) {
    this.updateStore(
      (draft) =>
        (draft.sortBy = {
          columnKey: column.key,
          direction,
        })
    );
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
