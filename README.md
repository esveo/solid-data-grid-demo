# Solid Data Grid

This repo contains the source code for the demo of a data grid component. It can be divided into 3 main modules:

1. Virtualized Grid: Low level library to render data to a 2d grid with virtualized rows and columns and pinned rows and columns.
2. DataGrid: The library that handles all logic regarding sorting, filters, groups etc. Uses the virtualized grid internally for rendering.
3. The App: This is the entry point and serves as a demonstration for the different features of the grid.

## What is currently missing from this?

1. Proper UIs for changing the grid state. Think of an editor to reorder the columns or to drag and drop columns to build the grouping levels. The logic is all done within the gridContext, but the UIs are not there yet.
2. Scrolling on touch devices.

## Data Grid

Fully typesafe api to build feature rich data grids.

Setup in four steps:

**1. Define the grid builder while passing in the generic for the item type that will be displayed in the grid:**

```tsx
const personGrid = createGridBuilder<Person>();
```

**2. Define columns**

```tsx
const columns = personGrid.buildColumns([
  {
    // Use the buildTitleDefaults function
    // to get the base layout for a title column
    // that will render the expansion buttons
    // and the indentation for groups.
    ...buildTitleDefaults((item) => item.name),
    key: "Title",
  },
  {
    key: "Country",
    // Specify how the value will be retrieved from an item
    valueFromItem: (props) => props.item.country,
    filter: multiSelectFilter(),
    groupable: true,
  },
  {
    key: "Income",
    valueFromItem: (props) => props.item.income,
    // Overwrite default renderers for items and group
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
    // Aggregation function used to aggregate items within each group.
    aggregateItems: (items) =>
      meanBy(items, (i) => i.income),
    columnWidth: 200,
  },
  dynamicColumns(
    // Use dynamicColumns helper to build columns
    // that depend on some external state.
    () => visibleYears(),
    (year) => {
      return {
        key: "Dummy column " + year,
        valueFromItem: (props) => props.template.key,
      };
    }
  ),
]);
```

**3. Build the grid context**

The context contains all logic of the grid. You can call functions like
`moveColumn` or `groupBy` on this context to change the internal state of the grid

```tsx
const context = personGrid.buildContext({
  columnDefinitions: columns,
  gridKey: "person-grid",
  items: () => controls.store.persons ?? [],
  initialState: {
    groupByColumnKeys: ["Country", "Age group"],
  },
  showAllRow: () => false,
});
```

**4. Render the grid**

```tsx
return (
  <DataGridContextProvider value={context}>
    <DataGrid
      width={dimensions().width}
      height={dimensions().height}
    />
  </DataGridContextProvider>
);
```

Check out `./src/App.tsx` for a more complete example.

## Virtualized Grid

Located at `src/lib/virtualized-grid`: A low level component that can be used to render lots of data in a 2d grid. It handles column & row virtualization as well as pinned rows (top and bottom) and columns (left and right).

Currently, the main missing piece is scrolling on touch inputs. This does not work at the moment.

**Example**

```tsx
const rows = [1, 2, 3, 4, 5, 6];
const columns = ["a", "b", "c", "d", "e", "f"];

<VirtualizedGrid
  // Rows and columns can be any arbitrary type
  // you could use objects the describe the columns
  // and items fetched from a server as the rows.
  rows={rows}
  columns={columns}
  getColumnWidth={(column) => 100}
  getRowHeight={(row) => 50}
  frozenAreas={{
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
  }}
  height={400}
  width={400}
  cell={(props) => (
    <div style={style}>
      {props.rowIndex} / {props.columnIndex}
      <br />
      {props.row} / {props.column}
    </div>
  )}
/>;
```
