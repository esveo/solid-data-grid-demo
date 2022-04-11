import {
  Accessor,
  batch,
  createEffect,
  createMemo,
  For,
  untrack,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { SortDirection } from "./lib/data-grid/baseTypes";
import { DataGridContext } from "./lib/data-grid/GridContext";
import {
  loadMockPersons,
  Person,
} from "./lib/mock-data/MockPersons";

export function useGridControlState(
  context: Accessor<DataGridContext<any>>
) {
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
    dataOption: { ...dataOptions[0]! },
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
        context().moveColumn(
          "Dummy column " + i,
          "UNFROZEN"
        );
      }
    });
  });

  createEffect(() => {
    const newPin = store.pinnedColumns;
    batch(() => {
      const pinLeft = context()
        .derivations.columns()
        .slice(0, newPin);
      const middle = context()
        .derivations.columns()
        .slice(newPin, -newPin);
      const pinRight = context()
        .derivations.columns()
        .slice(-newPin);
      for (const c of pinLeft)
        context().moveColumn(c.key, "LEFT");
      for (const c of middle)
        context().moveColumn(c.key, "UNFROZEN");
      for (const c of pinRight)
        context().moveColumn(c.key, "RIGHT");
    });
  });

  createEffect(() => {
    const newGroups = store.groupBy;
    const oldGroups = untrack(
      context().derivations.groupByColumns
    );
    batch(() => {
      for (const c of oldGroups) {
        context().removeFromGroups(c.key);
      }
      for (const c of newGroups) context().groupBy(c);
    });
  });

  createEffect(() => {
    context().sortByColumn(
      store.sortBy.key,
      store.sortBy.direction
    );
  });

  createEffect(() => {
    context().setFilter(
      "Country",
      store.countryFilter ? [store.countryFilter] : null
    );
  });

  return {
    store,
    updateStore,
    dataOptions,
    countries,
    pinningOptions,
    groupingOptions,
    sortBy,
  };
}

export function GridControls(props: {
  controls: ReturnType<typeof useGridControlState>;
}) {
  return (
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
          onChange={(e) => {
            const newValue =
              props.controls.dataOptions.find(
                (o) =>
                  [o.rows, o.columns].join("_") ===
                  e.currentTarget.value
              )!;
            props.controls.updateStore("dataOption", {
              ...newValue,
            });
          }}
        >
          <For each={props.controls.dataOptions}>
            {(data) => (
              <option
                value={[data.rows, data.columns].join("_")}
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
          value={props.controls.store.pinnedColumns}
          onChange={(e) =>
            props.controls.updateStore(
              "pinnedColumns",
              Number(e.currentTarget.value)
            )
          }
        >
          <For each={props.controls.pinningOptions}>
            {(data) => <option value={data}>{data}</option>}
          </For>
        </select>
      </label>{" "}
      <label>
        Groups:{" "}
        <select
          value={props.controls.store.groupBy.join("-")}
          onChange={(e) =>
            props.controls.updateStore(
              "groupBy",
              e.currentTarget.value.split("-")
            )
          }
        >
          <For each={props.controls.groupingOptions}>
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
          value={JSON.stringify(
            props.controls.store.sortBy
          )}
          onChange={(e) =>
            props.controls.updateStore(
              "sortBy",
              JSON.parse(e.currentTarget.value)
            )
          }
        >
          <For each={props.controls.sortBy}>
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
          value={props.controls.store.countryFilter ?? ""}
          onChange={(e) =>
            props.controls.updateStore(
              "countryFilter",
              e.currentTarget.value || null
            )
          }
        >
          <optgroup>
            <option>All Countries</option>
          </optgroup>
          <optgroup>
            <For each={props.controls.countries()}>
              {(data) => (
                <option value={data}>{data}</option>
              )}
            </For>
          </optgroup>
        </select>
      </label>
    </div>
  );
}
