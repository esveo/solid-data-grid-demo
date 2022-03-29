import { seed } from "@ngneat/falso";
import { createEffect } from "solid-js";
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
      columnWidth: 80,
    },
    {
      render: (person: Person) => person.name,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.favoriteTeam,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.country,
      columnWidth: 250,
    },
    {
      render: (person: Person) =>
        person.dateOfBirth.toLocaleDateString(),
      columnWidth: 200,
    },
    {
      render: (person: Person) => <button>✏️</button>,
      columnWidth: 50,
    },
    {
      render: (person: Person) => person.id + "",
      columnWidth: 80,
    },
    {
      render: (person: Person) => person.name,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.favoriteTeam,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.country,
      columnWidth: 250,
    },
    {
      render: (person: Person) =>
        person.dateOfBirth.toLocaleDateString(),
      columnWidth: 200,
    },
    {
      render: (person: Person) => <button>✏️</button>,
      columnWidth: 50,
    },
    {
      render: (person: Person) => person.id + "",
      columnWidth: 80,
    },
    {
      render: (person: Person) => person.name,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.favoriteTeam,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.country,
      columnWidth: 250,
    },
    {
      render: (person: Person) =>
        person.dateOfBirth.toLocaleDateString(),
      columnWidth: 200,
    },
    {
      render: (person: Person) => <button>✏️</button>,
      columnWidth: 50,
    },
    {
      render: (person: Person) => person.id + "",
      columnWidth: 80,
    },
    {
      render: (person: Person) => person.name,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.favoriteTeam,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.country,
      columnWidth: 250,
    },
    {
      render: (person: Person) =>
        person.dateOfBirth.toLocaleDateString(),
      columnWidth: 200,
    },
    {
      render: (person: Person) => <button>✏️</button>,
      columnWidth: 50,
    },
    {
      render: (person: Person) => person.id + "",
      columnWidth: 80,
    },
    {
      render: (person: Person) => person.name,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.favoriteTeam,
      columnWidth: 250,
    },
    {
      render: (person: Person) => person.country,
      columnWidth: 250,
    },
    {
      render: (person: Person) =>
        person.dateOfBirth.toLocaleDateString(),
      columnWidth: 200,
    },
    {
      render: (person: Person) => <button>✏️</button>,
      columnWidth: 50,
    },
  ];
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
              frozenAreas={{
                top: 5,
                left: 2,
                bottom: 5,
                right: 2,
              }}
              rows={store.persons ?? []}
              columns={columns}
              getColumnWidth={(column) =>
                column.columnWidth
              }
              getRowHeight={(p) => 30}
              cell={(props) => {
                console.log("Rebuild cell!");
                return (
                  <div style={props.style()}>
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
