import { createMemo, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import { defineScope } from "../../scoped-classes/scoped";
import { ColumnFunctionArgs } from "../ColumnTemplate";
import { dataGridCssScope } from "../cssScope";
import { DataRow, GroupRow, ItemRow } from "../Row";
import { DefaultRenderer } from "./DefaultRenderer";

export function TitleRenderer<TItem>(
  props: { row: DataRow<TItem> } & ColumnFunctionArgs<TItem>
) {
  return (
    <Show
      when={props.row.type === "GROUP_ROW"}
      fallback={<ItemTitleRenderer {...(props as any)} />}
    >
      <GroupTitleRenderer {...(props as any)} />
    </Show>
  );
}

function GroupTitleRenderer<TItem>(
  props: {
    row: GroupRow<TItem>;
  } & ColumnFunctionArgs<TItem>
) {
  const showRootIndentationOffset = () =>
    props.context().input.showAllRow ? 0 : -1;

  const level = createMemo(() => {
    const pathLength = props.row.path.length;
    return pathLength;
  });

  const matchingGroupingColumnKey = () =>
    props.context().state.groupByColumnKeys[level() - 1];

  const matchingGroupingColumn = () =>
    props.context().derivations.columnsByKey()[
      matchingGroupingColumnKey() ?? ""
    ];

  const isExpanded = () =>
    props.context().isRowExpanded(props.row);

  return (
    <div
      class={css("__title-renderer")}
      style={{
        "--level": level() + showRootIndentationOffset(),
      }}
    >
      <button
        class={css("__title-renderer-expansion-toggle")}
        onClick={() =>
          props.context().toggleRowExpansion(props.row)
        }
      >
        {isExpanded() ? "V" : ">"}
      </button>
      <Show
        when={matchingGroupingColumn()}
        fallback={<DefaultRenderer content="All" />}
      >
        <Dynamic
          component={matchingGroupingColumn()!.Item}
          context={props.context}
          row={{
            item: props.row.items()[0]!,
            path: [],
            type: "ITEM_ROW",
          }}
          template={matchingGroupingColumn()!}
        />
      </Show>
    </div>
  );
}

function ItemTitleRenderer<TItem>(
  props: { row: ItemRow<TItem> } & ColumnFunctionArgs<TItem>
) {
  const showRootIndentationOffset = () =>
    props.context().input.showAllRow ? 0 : -1;

  const level = createMemo(() => {
    const pathLength = props.row.path.length;
    return pathLength + 1 + (pathLength > 0 ? 2 : 0);
  });

  return (
    <div
      class={css("__title-renderer")}
      style={{
        "--level": level() + showRootIndentationOffset(),
      }}
    >
      <DefaultRenderer
        content={props.template.valueFromItem({
          ...props,
          item: props.row.item,
        })}
      />
    </div>
  );
}

const css = defineScope(dataGridCssScope);
