import { createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { assertNever } from "../helpers/tsUtils";
import { defineScope } from "../scoped-classes/scoped";
import { VirtualizedGridCellProps } from "../virtualized-grid/VirtualizedGrid";
import "./Cell.scss";
import { ColumnTemplate } from "./ColumnTemplate";
import { dataGridCssScope } from "./cssScope";
import {
  dataGridColumnWidth,
  setDataGridColumnWidth,
} from "./Grid";
import { HeaderRow, ItemRow, Row } from "./Row";

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
      initialColumnWidth: dataGridColumnWidth(),
    });
    document.addEventListener("pointermove", handleDrag);
    document.addEventListener("pointerup", handleDragEnd);
  }

  function handleDrag(e: PointerEvent) {
    setDragPosition({ x: e.clientX });
    const newWidth =
      (dragStart()?.initialColumnWidth ?? 0) + diff();
    setDataGridColumnWidth(newWidth);
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
      style={props.style()}
      onPointerDown={handleDragStart}
    >
      <div class={css("__header-cell-resize-handle")}></div>
      {props.column.title}
    </div>
  );
}

function ItemCell<TItem>(
  props: VirtualizedGridCellProps<
    ItemRow<TItem>,
    ColumnTemplate<TItem>
  >
) {
  return (
    <div style={props.style()}>
      <Dynamic
        component={props.column.Item}
        item={props.row.item}
        template={props.column}
      />
    </div>
  );
}

const css = defineScope(dataGridCssScope);
