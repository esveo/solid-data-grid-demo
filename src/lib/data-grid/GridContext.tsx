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
import { keyBy, mapValues } from "../helpers/arrayHelpers";
import {
  isTruthy,
  ObjectOf,
  typesafeKeys,
} from "../helpers/tsUtils";
import {
  FrozenColumnArea,
  SortDirection,
} from "./baseTypes";
import {
  addDefaultsToColumnTemplateDefinition,
  ColumnTemplate,
  ColumnTemplateDefinition,
} from "./ColumnTemplate";
import {
  buildTree,
  flattenTree,
  GroupNode,
  pathKeyFromPath,
} from "./groups";

export type DataGridContextInput<TItem> = {
  gridKey: string;
  columnDefinitions: Accessor<
    ColumnTemplateDefinition<TItem>[]
  >;
  items: Accessor<TItem[]>;
  showAllRow?: Accessor<boolean>;

  headerHeight?: number;
  groupRowHeight?: number;
  itemRowHeight?: number;
  initialState?: Partial<
    ReturnType<DataGridContext<TItem>["buildStore"]>[0]
  >;
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

    this.initState();
  }

  private initState() {
    const columns = this.derivations.columns();
    this.updateStore((draft) => {
      for (const c of columns) {
        draft.columnKeysByArea[c.frozen].push(c.key);
      }
    });
  }

  private buildStore() {
    const init = this.input.initialState as any;
    const state = {
      columnKeysByArea: {
        LEFT: [],
        RIGHT: [],
        UNFROZEN: [],
      } as Record<FrozenColumnArea, string[]>,
      columnWidthByColumnKey: {} as ObjectOf<number>,
      filterStateByColumnKey: {} as ObjectOf<unknown>,
      sortBy: null as null | {
        columnKey: string;
        direction: SortDirection;
      },
      groupByColumnKeys: [] as string[],
      expandedPaths: {} as ObjectOf<true>,
    };

    Object.assign(state, init);
    return createStore(state);
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

    $.columnByKey = createMemo(() =>
      keyBy($.columns(), (c) => c.key)
    );

    $.columnsByArea = createMemo(() => {
      const byKey = $.columnByKey();
      return mapValues(
        this.state.columnKeysByArea,
        (keys) => keys.map((key) => byKey[key]!)
      );
    });

    $.columnsWidthAggregations = createMemo(() =>
      $.columns().filter((c) => c.aggregateItems)
    );

    $.getColumnWidth = (columnKey: string) =>
      this.state.columnWidthByColumnKey[columnKey] ??
      this.derivations.columnByKey()[columnKey]
        ?.columnWidth ??
      200;

    $.sortBy = createMemo(() => {
      const sortByState = this.state.sortBy;

      if (!sortByState) return undefined;
      const column = $.columnByKey()[sortByState.columnKey];
      if (!column) return undefined;

      return {
        column,
        direction: sortByState.direction,
      };
    });

    $.activeFilters = createMemo(() => {
      const filterByKey = this.state.filterStateByColumnKey;
      const columnByKey = $.columnByKey();

      const activeFilters = Object.keys(filterByKey)
        .map((key) => {
          const column = columnByKey[key];
          if (!column || !column.filter) return null;
          const filterState = filterByKey[key];

          const parseFilterState =
            column.filter.parseFilterState ?? ((x) => x);
          return {
            template: column,
            filterState,
            parsedFilterState:
              parseFilterState(filterState),
          };
        })
        .filter(isTruthy)
        .filter((f) => !!f.template);

      return activeFilters;
    });

    $.filteredItems = createMemo(() => {
      const activeFilters = $.activeFilters();
      if (activeFilters.length === 0)
        return this.input.items();

      return this.input.items().filter((item) =>
        activeFilters.every((filter) =>
          filter.template.filter?.doesItemMatchFilter({
            item,
            state: filter.parsedFilterState,
            context: () => this,
            template: filter.template,
          })
        )
      );
    });

    $.sortedItems = createMemo(() => {
      const sortBy = $.sortBy();
      if (!sortBy) return $.filteredItems();

      const getSortCriteria = sortBy.column.sortBy;

      const directionSign =
        sortBy.direction === "ASC" ? -1 : 1;

      const sortCriteria = $.filteredItems().map(
        (item) => ({
          sortCriteria: getSortCriteria({
            item,
            context: () => this,
            template: sortBy.column,
          }),
          item,
        })
      );

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

    $.groupByColumns = createMemo(() => {
      const columnsByKey = $.columnByKey();
      return this.state.groupByColumnKeys
        .map((key) => columnsByKey[key]!)
        .filter((c) => !!c?.groupable);
    });

    $.itemTree = buildTree({
      context: () => this,
      groupByColumns: $.groupByColumns,
      sortBy: $.sortBy,
      items: $.sortedItems,
      columnsWithAggregations: $.columnsWidthAggregations,
    });

    $.flatTree = flattenTree(
      $.itemTree,
      () => this.state.expandedPaths,
      this.input.showAllRow
    );

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
    columnKey: string,
    direction: SortDirection = "ASC"
  ) {
    const column =
      this.derivations.columnByKey()[columnKey];

    this.updateStore((draft) => {
      if (!column) {
        draft.sortBy = null;
        return;
      }

      if (!draft.sortBy) {
        draft.sortBy = { columnKey, direction };
      }
      draft.sortBy.columnKey = columnKey;
      draft.sortBy.direction = direction;
    });
  }

  moveColumn(
    columnKey: string,
    placeIn: FrozenColumnArea,
    placeBefore?: string
  ) {
    this.updateStore((draft) => {
      for (const areaKey of typesafeKeys(
        draft.columnKeysByArea
      )) {
        draft.columnKeysByArea[areaKey] =
          draft.columnKeysByArea[areaKey].filter(
            (key) => key !== columnKey
          );
      }
      const targetArea = draft.columnKeysByArea[placeIn];
      let newIndex = placeBefore
        ? targetArea.indexOf(placeBefore)
        : -1;
      if (newIndex === -1) newIndex = targetArea.length;

      targetArea.splice(newIndex, 0, columnKey);
    });
  }

  groupBy(columnKey: string, placeBefore?: string) {
    this.updateStore((draft) => {
      draft.groupByColumnKeys =
        draft.groupByColumnKeys.filter(
          (key) => key !== columnKey
        );
      let newIndex = placeBefore
        ? draft.groupByColumnKeys.indexOf(placeBefore)
        : -1;
      if (newIndex === -1)
        newIndex = draft.groupByColumnKeys.length;
      draft.groupByColumnKeys.splice(
        newIndex,
        0,
        columnKey
      );
    });
  }

  setFilter(columnKey: string, newFilterState: unknown) {
    this.updateStore((draft) => {
      if (newFilterState === null) {
        delete draft.filterStateByColumnKey[columnKey];
      } else {
        draft.filterStateByColumnKey[columnKey] =
          newFilterState;
      }
    });
  }

  removeFromGroups(columnKey: string) {
    this.updateStore((draft) => {
      draft.groupByColumnKeys =
        draft.groupByColumnKeys.filter(
          (key) => key !== columnKey
        );
    });
  }

  toggleGroupExpansion(node: GroupNode<TItem>) {
    const pathKey = pathKeyFromPath(node.path);
    this.updateStore((draft) => {
      if (pathKey in draft.expandedPaths)
        delete draft.expandedPaths[pathKey];
      else draft.expandedPaths[pathKey] = true;
    });
  }

  isGroupExpanded(node: GroupNode<TItem>) {
    const pathKey = pathKeyFromPath(node.path);
    return pathKey in this.state.expandedPaths;
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
