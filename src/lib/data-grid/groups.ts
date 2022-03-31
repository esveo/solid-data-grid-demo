import { Accessor, createMemo, mapArray } from "solid-js";
import { groupByMultiple } from "../helpers/arrayHelpers";
import { ColumnTemplate } from "./ColumnTemplate";
import { DataGridContext } from "./GridContext";

export type GroupNode<TItem> = {
  path: string[];
  items: Accessor<TItem[]>;
  childNodes: Accessor<GroupNode<TItem>[] | undefined>;
  type: "GROUP_NODE";
};
export type ItemNode<TItem> = {
  path: string[];
  item: TItem;
  type: "ITEM_NODE";
};
export type Node<TItem> =
  | GroupNode<TItem>
  | ItemNode<TItem>;

export function buildTree<TItem>(config: {
  items: Accessor<TItem[]>;
  groupByColumns: Accessor<ColumnTemplate<TItem>[]>;
  context: Accessor<DataGridContext<TItem>>;
}): Accessor<GroupNode<TItem>> {
  return buildTreeRecursively(
    config.items,
    config.context,
    config.groupByColumns,
    []
  );

  function buildTreeRecursively(
    items: Accessor<TItem[]>,
    context: Accessor<DataGridContext<TItem>>,
    groupByColumns: Accessor<ColumnTemplate<TItem>[]>,
    path: string[]
  ): Accessor<GroupNode<TItem>> {
    const nextGroupBy = createMemo(
      () => groupByColumns()[0]
    );
    const nextGroupByFunction = createMemo(
      () => nextGroupBy()?.groupBy
    );
    const remainingGroupBys = createMemo(() =>
      groupByColumns().slice(1)
    );

    const hasNextGroupBy = createMemo(
      () => !!nextGroupBy()
    );

    const result = createMemo((): GroupNode<TItem> => {
      const groups = createMemo(() => {
        if (!hasNextGroupBy()) return null;
        return groupByMultiple(items(), (item) =>
          nextGroupByFunction()!({
            context: config.context,
            item,
            template: nextGroupBy()!,
          })
        );
      });

      const groupKeys = createMemo(() => {
        const groupsOrNull = groups();
        if (!groupsOrNull) return null;
        return Object.keys(groupsOrNull);
      });

      return {
        type: "GROUP_NODE",
        path,
        items,
        childNodes: createMemo(() => {
          const hasNext = hasNextGroupBy();
          if (!hasNext) return undefined;
          return mapArray(groupKeys, (key) => {
            const items = createMemo(() => groups()![key]!);
            return buildTreeRecursively(
              items,
              context,
              remainingGroupBys,
              [...path, key]
            )();
          })();
        }),
      };
    });

    return result;
  }
}

export function flattenTree<TItem>(
  node: Accessor<GroupNode<TItem>>
): Accessor<Node<TItem>[]> {
  const result = createMemo(() =>
    flattenTreeRecursively(node(), [])
  );
  return result;

  function flattenTreeRecursively(
    node: GroupNode<TItem>,
    list: Node<TItem>[]
  ): Node<TItem>[] {
    list.push(node);
    const children = node.childNodes();
    if (children) {
      for (const child of children) {
        flattenTreeRecursively(child, list);
      }
    } else {
      const itemNodes: ItemNode<TItem>[] = node
        .items()
        .map((item) => ({
          type: "ITEM_NODE",
          path: node.path,
          item,
        }));
      for (const n of itemNodes) list.push(n);
    }
    return list;
  }
}

export function defaultGroupBy<TItem>(
  ...args: Parameters<
    NonNullable<ColumnTemplate<TItem>["groupBy"]>
  >
) {
  return args[0].template.valueFromItem(...args);
}
