import { Accessor, createMemo, mapArray } from "solid-js";
import { groupByMultiple } from "../helpers/arrayHelpers";
import { ObjectOf } from "../helpers/tsUtils";
import { ColumnTemplate } from "./ColumnTemplate";
import { DataGridContext } from "./GridContext";

export type GroupNode<TItem> = {
  path: string[];
  pathKey: string;
  items: Accessor<TItem[]>;
  childNodes: Accessor<Node<TItem>[]>;
  type: "GROUP_NODE";
};
export type ItemNode<TItem> = {
  path: string[];
  pathKey: string;
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
        pathKey: pathKeyFromPath(path),
        items,
        childNodes: createMemo(() => {
          const hasNext = hasNextGroupBy();
          if (!hasNext)
            return mapArray(
              items,
              (item): Node<TItem> => ({
                type: "ITEM_NODE",
                item,
                path,
                pathKey: pathKeyFromPath(path),
              })
            )();
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
  node: Accessor<GroupNode<TItem>>,
  expandedPaths: Accessor<ObjectOf<true>>,
  includeRoot?: Accessor<boolean>
): Accessor<Node<TItem>[]> {
  const result = createMemo(() =>
    flattenTreeRecursively(
      node(),
      [],
      expandedPaths(),
      includeRoot?.()
    )
  );
  return result;

  function flattenTreeRecursively(
    node: Node<TItem>,
    list: Node<TItem>[],
    expandedPaths: ObjectOf<true>,
    includeRoot?: boolean
  ): Node<TItem>[] {
    if (includeRoot) list.push(node);
    const isExpanded =
      !includeRoot || node.pathKey in expandedPaths;
    if (!isExpanded) return list;
    if (node.type === "GROUP_NODE") {
      for (const child of node.childNodes()) {
        flattenTreeRecursively(
          child,
          list,
          expandedPaths,
          true
        );
      }
    }
    return list;
  }
}

export function pathKeyFromPath(path: string[]) {
  return path.join("//");
}

export function defaultGroupBy<TItem>(
  ...args: Parameters<
    NonNullable<ColumnTemplate<TItem>["groupBy"]>
  >
) {
  return args[0].template.valueFromItem(...args);
}
