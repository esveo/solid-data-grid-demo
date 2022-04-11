import { seed } from "@ngneat/falso";
import {
  batch,
  createEffect,
  createMemo,
  For,
  untrack,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { SortDirection } from "./lib/data-grid/baseTypes";
import { NumberRenderer } from "./lib/data-grid/cell-renderers/NumberRenderer";
import { buildTitleDefaults } from "./lib/data-grid/cell-renderers/TitleRenderer";
import { dynamicColumns } from "./lib/data-grid/ColumnTemplate";
import { multiSelectFilter } from "./lib/data-grid/filters";
import { DataGrid } from "./lib/data-grid/Grid";
import { createGridBuilder } from "./lib/data-grid/gridBuilder";
import { DataGridContextProvider } from "./lib/data-grid/GridContext";
import { meanBy, range } from "./lib/helpers/arrayHelpers";
import { AutoSizer } from "./lib/measure-dom/AutoSizer";
import {
  loadMockPersons,
  Person,
} from "./lib/mock-data/MockPersons";

seed("THIS IS MY SEED!");

function App() {
  const dataOptions = [
    {
      rows: 100,
      columns: 10,
    },
    {
      rows: 1000,
      columns: 100,
    },
    {
      rows: 10000,
      columns: 100,
    },
    {
      rows: 100_000,
      columns: 100,
    },
  ];

  const pinningOptions = [1, 2, 3];
  const groupingOptions = [
    [],
    ["Country"],
    ["Country", "Age group"],
  ];
  const sortBy = [
    { key: "Title", direction: "ASC" as SortDirection },
    { key: "Title", direction: "DESC" as SortDirection },
    { key: "Income", direction: "ASC" as SortDirection },
    { key: "Income", direction: "DESC" as SortDirection },
  ];

  const [store, updateStore] = createStore({
    persons: null as Person[] | null,
    dataOption: dataOptions[0]!,
    pinnedColumns: 1,
    countryFilter: null as string | null,
    groupBy: groupingOptions[0]!,
    sortBy: sortBy[0]!,
  });

  const countries = createMemo(() =>
    [
      ...new Set(store.persons?.map((p) => p.country)),
    ].sort()
  );

  createEffect(() => {
    loadMockPersons(store.dataOption.rows).then(
      (persons) => {
        updateStore(reconcile({ ...store, persons }));
      }
    );
  });

  createEffect(() => {
    const newColumnCount = store.dataOption.columns;

    batch(() => {
      for (let i = 0; i < newColumnCount; i++) {
        context.moveColumn("Dummy column " + i, "UNFROZEN");
      }
    });
  });

  createEffect(() => {
    const newPin = store.pinnedColumns;
    batch(() => {
      const pinLeft = context.derivations
        .columns()
        .slice(0, newPin);
      const middle = context.derivations
        .columns()
        .slice(newPin, -newPin);
      const pinRight = context.derivations
        .columns()
        .slice(-newPin);
      for (const c of pinLeft)
        context.moveColumn(c.key, "LEFT");
      for (const c of middle)
        context.moveColumn(c.key, "UNFROZEN");
      for (const c of pinRight)
        context.moveColumn(c.key, "RIGHT");
    });
  });

  createEffect(() => {
    const newGroups = store.groupBy;
    const oldGroups = untrack(
      context.derivations.groupByColumns
    );
    batch(() => {
      for (const c of oldGroups) {
        context.removeFromGroups(c.key);
      }
      for (const c of newGroups) context.groupBy(c);
    });
  });

  createEffect(() => {
    context.sortByColumn(
      store.sortBy.key,
      store.sortBy.direction
    );
  });

  createEffect(() => {
    context.setFilter(
      "Country",
      store.countryFilter ? [store.countryFilter] : null
    );
  });

  const personGrid = createGridBuilder<Person>();
  const columns = personGrid.buildColumns([
    {
      ...buildTitleDefaults((item) => item.name),
      key: "Title",
    },
    {
      key: "Income",
      valueFromItem: (props) => props.item.income,
      Item: (props) => (
        <NumberRenderer
          content={props.node.item.income}
          decimals={0}
        />
      ),
      Group: (props) => (
        <NumberRenderer
          content={
            props.node.aggregationsByColumnKey()
              .Income!() as any as number
          }
          decimals={0}
          suffix={"$"}
        />
      ),
      aggregateItems: (items) =>
        meanBy(items, (i) => i.income),
      columnWidth: 200,
    },
    {
      key: "Country",
      valueFromItem: (props) => props.item.country,
      filter: multiSelectFilter(),
      groupable: true,
    },
    dynamicColumns(
      () => range(0, store.dataOption.columns),
      (i) => {
        return {
          key: "Dummy column " + i,
          valueFromItem: (props) => props.template.key,
        };
      }
    ),
    {
      key: "Date of Birth",
      valueFromItem: (props) =>
        props.item.dateOfBirth.toLocaleDateString(),
      sortBy: (props) => props.item.dateOfBirth,
    },
    {
      key: "Age group",
      valueFromItem: (props) =>
        props.item.dateOfBirth.getFullYear() > 1992
          ? "Preeetty old"
          : "Quite young",
      groupable: true,
    },
    {
      key: "actions",
      title: "",
      valueFromItem: () => null,
      Item: (props) => <button>💾</button>,
      columnWidth: 60,
      resizable: false,
      frozen: "RIGHT",
    },
  ]);

  const context = personGrid.buildContext({
    columnDefinitions: columns,
    gridKey: "person-grid",
    items: () => store.persons ?? [],
    initialState: {
      groupByColumnKeys: ["Country", "Age group"],
    },
    showAllRow: () => false,
  });

  return (
    <DataGridContextProvider value={context}>
      <div
        style={{
          height: "100%",
          display: "flex",
          "flex-direction": "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            "margin-bottom": "1rem",
          }}
        >
          <h1>
            Solid data grid{" "}
            <small>(no touch support for now)</small>
          </h1>
          <label>
            Select data:{" "}
            <select
              value="100_10"
              onChange={(e) =>
                updateStore(
                  "dataOption",
                  dataOptions.find(
                    (o) =>
                      [o.rows, o.columns].join("_") ===
                      e.currentTarget.value
                  )!
                )
              }
            >
              <For each={dataOptions}>
                {(data) => (
                  <option
                    value={[data.rows, data.columns].join(
                      "_"
                    )}
                  >
                    {Intl.NumberFormat(undefined, {
                      useGrouping: true,
                    }).format(data.rows)}{" "}
                    rows - {data.columns} columns
                  </option>
                )}
              </For>
            </select>
          </label>{" "}
          <label>
            Pinned cols:{" "}
            <select
              value={store.pinnedColumns}
              onChange={(e) =>
                updateStore(
                  "pinnedColumns",
                  Number(e.currentTarget.value)
                )
              }
            >
              <For each={pinningOptions}>
                {(data) => (
                  <option value={data}>{data}</option>
                )}
              </For>
            </select>
          </label>{" "}
          <label>
            Groups:{" "}
            <select
              value={store.groupBy.join("-")}
              onChange={(e) =>
                updateStore(
                  "groupBy",
                  e.currentTarget.value.split("-")
                )
              }
            >
              <For each={groupingOptions}>
                {(data) => (
                  <option value={data.join("-")}>
                    {data.join(" > ") || "No groups"}
                  </option>
                )}
              </For>
            </select>
          </label>{" "}
          <label>
            Sorting:{" "}
            <select
              value={JSON.stringify(store.sortBy)}
              onChange={(e) =>
                updateStore(
                  "sortBy",
                  JSON.parse(e.currentTarget.value)
                )
              }
            >
              <For each={sortBy}>
                {(data) => (
                  <option value={JSON.stringify(data)}>
                    {data.key} {data.direction}
                  </option>
                )}
              </For>
            </select>
          </label>{" "}
          <label>
            Country filter:{" "}
            <select
              value={store.countryFilter ?? ""}
              onChange={(e) =>
                updateStore(
                  "countryFilter",
                  e.currentTarget.value || null
                )
              }
            >
              <optgroup>
                <option>All Countries</option>
              </optgroup>
              <optgroup>
                <For each={countries()}>
                  {(data) => (
                    <option value={data}>{data}</option>
                  )}
                </For>
              </optgroup>
            </select>
          </label>
        </div>
        <div
          style={{ flex: "1 1 auto", overflow: "hidden" }}
        >
          <AutoSizer>
            {(dimensions) => (
              <DataGrid
                width={dimensions().width}
                height={dimensions().height}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    </DataGridContextProvider>
  );
}

export default App;
