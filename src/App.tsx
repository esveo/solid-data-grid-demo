import { seed } from "@ngneat/falso";
import {
  GridControls,
  useGridControlState,
} from "./GridControls";
import { NumberRenderer } from "./lib/data-grid/cell-renderers/NumberRenderer";
import { buildTitleDefaults } from "./lib/data-grid/cell-renderers/TitleRenderer";
import { dynamicColumns } from "./lib/data-grid/ColumnTemplate";
import { multiSelectFilter } from "./lib/data-grid/filters";
import { DataGrid } from "./lib/data-grid/Grid";
import { createGridBuilder } from "./lib/data-grid/gridBuilder";
import { DataGridContextProvider } from "./lib/data-grid/GridContext";
import { meanBy, range } from "./lib/helpers/arrayHelpers";
import { AutoSizer } from "./lib/measure-dom/AutoSizer";
import { Person } from "./lib/mock-data/MockPersons";

seed("THIS IS MY SEED!");

function App() {
  const controls = useGridControlState(() => context);

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
      () => range(0, controls.store.dataOption.columns),
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
    items: () => controls.store.persons ?? [],
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
        <GridControls controls={controls} />
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
