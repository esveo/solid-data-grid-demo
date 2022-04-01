import { seed } from "@ngneat/falso";
import {
  Accessor,
  createEffect,
  createMemo,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { TitleRenderer } from "./lib/data-grid/cell-renderers/TitleRenderer";
import { dynamicColumns } from "./lib/data-grid/ColumnTemplate";
import {
  multiSelectFilter,
  numberRangeFilter,
} from "./lib/data-grid/filters";
import { DataGrid } from "./lib/data-grid/Grid";
import { createGridBuilder } from "./lib/data-grid/gridBuilder";
import { DataGridContextProvider } from "./lib/data-grid/GridContext";
import { last, range } from "./lib/helpers/arrayHelpers";
import { AutoSizer } from "./lib/measure-dom/AutoSizer";
import {
  loadMockPersons,
  Person,
} from "./lib/mock-data/MockPersons";

seed("THIS IS MY SEED!");

function App() {
  const personCount = 10_000;

  const [store, updateStore] = createStore({
    persons: null as Person[] | null,
    dummyColumnCount: 0,
  });

  createEffect(() => {
    loadMockPersons(personCount).then((persons) => {
      Object.assign(window, { persons });
      updateStore(reconcile({ ...store, persons }));
    });
  });

  const personGrid = createGridBuilder<Person>();

  const columns = personGrid.buildColumns([
    {
      key: "Title",
      valueFromItem: (props) => props.item.name,
      valueFromGroupRow: (props) =>
        last(props.row.path) ?? "All",
      Item: TitleRenderer,
      Group: TitleRenderer,
      frozen: "LEFT",
      columnWidth: 300,
    },
    {
      key: "Id",
      valueFromItem: (props) => props.item.id,
      valueFromGroupRow: (props) =>
        props.row.items().reduce((a, b) => a + b.id, 0),
      frozen: "LEFT",
      filter: numberRangeFilter((item) => item.id),
      columnWidth: 80,
    },
    {
      key: "Country",
      valueFromItem: (props) => props.item.country,
      filter: multiSelectFilter(),
      groupable: true,
    },
    dynamicColumns(
      () => range(0, store.dummyColumnCount),
      (i) => ({
        key: "Dummy column " + i,
        valueFromItem: (props) => props.template.key,
      })
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
  });

  function createLoggingMemo<T>(
    log: string,
    value: Accessor<T>
  ) {
    const memo = createMemo(value);
    createEffect(() => {
      const newValue = memo();
      console.log(log, newValue);
    });
    return memo;
  }

  Object.assign(window, { context });

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
        <div style={{ flex: "0 0 auto" }}>
          <h1>Solid data grid</h1>
          <button
            onClick={async () => {
              loadMockPersons(personCount).then(
                (persons) => {
                  updateStore(
                    reconcile({ ...store, persons })
                  );
                }
              );
            }}
          >
            Refetch data
          </button>
          <button
            onClick={() =>
              updateStore(
                "dummyColumnCount",
                store.dummyColumnCount - 1
              )
            }
          >
            Less dummy columns
          </button>
          <button
            onClick={() => {
              updateStore(
                "dummyColumnCount",
                store.dummyColumnCount + 1
              );
              context.moveColumn(
                "Dummy column " +
                  (store.dummyColumnCount - 1),
                "UNFROZEN"
              );
            }}
          >
            More dummy columns
          </button>
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
