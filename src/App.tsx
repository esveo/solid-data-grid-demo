import { seed } from "@ngneat/falso";
import { createEffect, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { AutoSizer } from "./lib/measure-dom/AutoSizer";
import {
  loadMockPersons,
  Person,
} from "./lib/mock-data/MockPersons";
import { VirtualizedGrid } from "./lib/virtualized-grid/VirtualizedGrid";

seed("THIS IS MY SEED!");

function App() {
  const personCount = 10_000;

  const [store, updateStore] = createStore({
    persons: null as Person[] | null,
  });

  createEffect(() => {
    loadMockPersons(personCount).then((persons) => {
      updateStore(reconcile({ persons }));
    });
  });

  const columns = [
    {
      render: (person: Person) => person.id + "",
    },
    {
      render: (person: Person) => person.name,
    },
    {
      render: (person: Person) => person.favoriteTeam,
    },
    {
      render: (person: Person) => person.country,
    },
    {
      render: (person: Person) =>
        person.dateOfBirth.toLocaleDateString(),
    },
  ];

  const [columnWidth, setColumnWidth] = createSignal(150);

  function toggleColumnWidth() {
    setColumnWidth((c) => (c === 200 ? 300 : 200));
  }

  return (
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
            loadMockPersons(personCount).then((persons) => {
              updateStore(reconcile({ persons }));
            });
          }}
        >
          Refetch data
        </button>
      </div>
      <div style={{ flex: "1 1 auto", overflow: "hidden" }}>
        <AutoSizer>
          {(dimensions) => (
            <VirtualizedGrid
              width={dimensions().width}
              height={dimensions().height}
              rows={store.persons ?? []}
              columns={columns}
              getColumnWidth={() => columnWidth()}
              getRowHeight={(p) => 30}
              cell={(props) => {
                console.log("Rebuild cell!");
                return (
                  <div
                    style={props.style()}
                    onClick={toggleColumnWidth}
                  >
                    {props.column.render(props.row)}
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

export default App;
