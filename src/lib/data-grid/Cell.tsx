import { createSignal, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { assertNever } from "../helpers/tsUtils";
import { defineScope } from "../scoped-classes/scoped";
import { VirtualizedGridCellProps } from "../virtualized-grid/VirtualizedGrid";
import "./Cell.scss";
import { ColumnTemplate } from "./ColumnTemplate";
import { dataGridCssScope } from "./cssScope";
import { useDataGridContext } from "./GridContext";
import { GroupRow, HeaderRow, ItemRow, Row } from "./Row";

export function DataGridCell<TItem>(
  props: VirtualizedGridCellProps<
    Row<TItem>,
    ColumnTemplate<TItem>
  >
) {
  console.log("cell rebuilt");
  switch (props.row.type) {
    case "HEADER_ROW":
      return <HeaderCell {...(props as any)} />;
    case "ITEM_ROW":
      return <ItemCell {...(props as any)} />;
    case "GROUP_ROW":
      return <GroupCell {...(props as any)} />;
    default:
      assertNever(props.row);
  }
}

function HeaderCell<TItem>(
  props: VirtualizedGridCellProps<
    HeaderRow<TItem>,
    ColumnTemplate<TItem>
  >
) {
  const gridContext = useDataGridContext<TItem>();
  const columnWidth = () =>
    gridContext.derivations.getColumnWidth(
      props.column.key
    );

  const [dragStart, setDragStart] = createSignal<{
    x: number;
    initialColumnWidth: number;
  }>();
  const [dragPosition, setDragPosition] = createSignal<{
    x: number;
  }>();

  const diff = () => {
    const start = dragStart();
    const current = dragPosition();
    if (!start || !current) return 0;

    return current.x - start.x;
  };

  function handleDragStart(
    e: PointerEvent & {
      currentTarget: HTMLDivElement;
      target: Element;
    }
  ) {
    e.preventDefault();
    setDragStart({
      x: e.clientX,
      initialColumnWidth: columnWidth(),
    });
    document.addEventListener("pointermove", handleDrag);
    document.addEventListener("pointerup", handleDragEnd);
  }

  function handleDrag(e: PointerEvent) {
    setDragPosition({ x: e.clientX });
    const newWidth =
      (dragStart()?.initialColumnWidth ?? 0) + diff();
    gridContext.resizeColumn(props.column, newWidth);
  }

  function handleDragEnd(e: PointerEvent) {
    setDragStart(undefined);
    setDragPosition(undefined);

    document.removeEventListener("pointermove", handleDrag);
    document.removeEventListener(
      "pointerup",
      handleDragEnd
    );
  }

  return (
    <div
      class={css("__cell", "__header-cell")}
      style={props.style()}
    >
      <Show when={props.column.resizable}>
        <div
          onPointerDown={handleDragStart}
          class={css("__header-cell-resize-handle")}
        ></div>
      </Show>
      <span class={css("__header-cell--title")}>
        {props.column.title}
      </span>
    </div>
  );
}

function ItemCell<TItem>(
  props: VirtualizedGridCellProps<
    ItemRow<TItem>,
    ColumnTemplate<TItem>
  >
) {
  const context = useDataGridContext<TItem>();
  return (
    <div
      style={props.style()}
      class={css("__cell", "__body-cell", "__item-cell")}
    >
      <Dynamic
        component={props.column.Item}
        item={props.row.item}
        template={props.column}
        context={() => context}
      />
    </div>
  );
}

function GroupCell<TItem>(
  props: VirtualizedGridCellProps<
    GroupRow<TItem>,
    ColumnTemplate<TItem>
  >
) {
  const context = useDataGridContext<TItem>();
  return (
    <div
      style={props.style()}
      class={css("__cell", "__body-cell", "__group-cell")}
    >
      <Dynamic
        component={props.column.GroupRow}
        row={props.row}
        template={props.column}
        context={() => context}
      />
    </div>
  );
}

const css = defineScope(dataGridCssScope);
