import { seed } from "@ngneat/falso";
import { createEffect, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { dynamicColumns } from "./lib/data-grid/ColumnTemplate";
import { DataGrid } from "./lib/data-grid/Grid";
import { createGridBuilder } from "./lib/data-grid/gridBuilder";
import { DataGridContextProvider } from "./lib/data-grid/GridContext";
import { range } from "./lib/helpers/arrayHelpers";
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
      updateStore(reconcile({ ...store, persons }));
    });
  });

  const personGrid = createGridBuilder<Person>();

  const columns = personGrid.buildColumns([
    {
      key: "Id",
      getValueFromItem: (props) => props.item.id,
      columnWidth: createSignal(200),
    },
    {
      key: "Name",
      getValueFromItem: (props) => props.item.name,
      columnWidth: createSignal(200),
    },
    {
      key: "Country",
      getValueFromItem: (props) => props.item.country,
      columnWidth: createSignal(200),
    },
    dynamicColumns(
      () => range(0, store.dummyColumnCount),
      (i) => ({
        key: "Dummy column " + i,
        getValueFromItem: (props) => props.template.key,
        columnWidth: createSignal(200),
      })
    ),
    {
      key: "Date of Birth",
      getValueFromItem: (props) =>
        props.item.dateOfBirth.toLocaleDateString("de"),
      columnWidth: createSignal(200),
    },
    {
      key: "actions",
      title: "",
      getValueFromItem: () => null,
      Item: (props) => <button>💾</button>,
      columnWidth: 60,
    },
  ]);

  const context = personGrid.buildContext({
    columns: columns,
    gridKey: "person-grid",
    items: () => store.persons ?? [],
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
            onClick={() =>
              updateStore(
                "dummyColumnCount",
                store.dummyColumnCount + 1
              )
            }
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
                context={context}
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
