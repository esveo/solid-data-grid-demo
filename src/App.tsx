import { seed } from "@ngneat/falso";
import { createEffect } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { createGrid } from "./lib/data-grid/gridBuilder";
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
  });

  createEffect(() => {
    loadMockPersons(personCount).then((persons) => {
      updateStore(reconcile({ persons }));
    });
  });

  const personGrid = createGrid<Person>();

  const columns = personGrid.buildColumns([
    {
      title: "Id",
      Item: (props) => <>{props.item.id}</>,
    },
    {
      title: "Name",
      Item: (props) => <>{props.item.name}</>,
    },
    {
      title: "Country",
      Item: (props) => <>{props.item.country}</>,
    },
    {
      title: "Date of Birth",
      Item: (props) => (
        <>
          {props.item.dateOfBirth.toLocaleDateString("de")}
        </>
      ),
    },
    {
      title: "",
      Item: (props) => <button>💾</button>,
    },
  ]);

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
            <personGrid.Grid
              columns={columns}
              items={store.persons ?? []}
              width={dimensions().width}
              height={dimensions().height}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

export default App;
