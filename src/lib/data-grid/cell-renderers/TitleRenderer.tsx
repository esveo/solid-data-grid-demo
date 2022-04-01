import { createMemo, JSXElement, Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import {
  joinIfArray,
  last,
} from "../../helpers/arrayHelpers";
import { SingleOrArray } from "../../helpers/tsUtils";
import { defineScope } from "../../scoped-classes/scoped";
import {
  ColumnFunctionArgs,
  ColumnTemplateDefinition,
} from "../ColumnTemplate";
import { dataGridCssScope } from "../cssScope";
import { GroupNode, ItemNode } from "../groups";
import { DefaultRenderer } from "./DefaultRenderer";

export function GroupTitleRenderer<TItem>(
  props: {
    node: GroupNode<TItem>;
  } & ColumnFunctionArgs<TItem>
) {
  const showRootIndentationOffset = () =>
    props.context().input.showAllRow?.() ? 0 : -1;

  const level = createMemo(() => {
    const pathLength = props.node.path.length;
    return pathLength;
  });

  const matchingGroupingColumnKey = () =>
    props.context().state.groupByColumnKeys[level() - 1];

  const matchingGroupingColumn = () =>
    props.context().derivations.columnByKey()[
      matchingGroupingColumnKey() ?? ""
    ];

  const isExpanded = () =>
    props.context().isGroupExpanded(props.node);

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
          props.context().toggleGroupExpansion(props.node)
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
          node={{
            item: props.node.items()[0]!,
            path: [],
            pathKey: "",
            type: "ITEM_NODE",
          }}
          template={matchingGroupingColumn()!}
        />
      </Show>
      <span> ({props.node.items().length})</span>
    </div>
  );
}

export function ItemTitleRenderer<TItem>(
  props: {
    node: ItemNode<TItem>;
    content?: JSXElement;
  } & ColumnFunctionArgs<TItem>
) {
  const showRootIndentationOffset = () =>
    props.context().input.showAllRow?.() ? 0 : -1;

  const level = createMemo(() => {
    const pathLength = props.node.path.length;
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
        content={
          props.content ??
          joinIfArray(
            props.template.valueFromItem({
              ...props,
              item: props.node.item,
            })
          )
        }
      />
    </div>
  );
}

const css = defineScope(dataGridCssScope);

export function buildTitleDefaults<TItem>(
  titleFromItem: (
    item: TItem
  ) => SingleOrArray<
    string | number | boolean | null | undefined
  >
): ColumnTemplateDefinition<TItem> {
  return {
    key: "Title",
    valueFromItem: (props) => titleFromItem(props.item),
    valueFromGroup: (props) =>
      last(props.node.path) ?? "All",
    Item: ItemTitleRenderer,
    Group: GroupTitleRenderer,
    frozen: "LEFT",
    columnWidth: 300,
  };
}
