import { Accessor, createMemo } from "solid-js";
import {
  groupByMultiple,
  last,
} from "../helpers/arrayHelpers";
import { ObjectOf } from "../helpers/tsUtils";
import { SortDirection } from "./baseTypes";
import { ColumnTemplate } from "./ColumnTemplate";
import { DataGridContext } from "./GridContext";
import { GroupRow } from "./Row";

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
  sortBy: Accessor<
    | {
        column: ColumnTemplate<TItem>;
        direction: SortDirection;
      }
    | undefined
  >;
}): Accessor<GroupNode<TItem>> {
  return buildTreeRecursively(
    config.items,
    config.context,
    config.groupByColumns,
    config.sortBy,
    []
  );

  function buildTreeRecursively(
    items: Accessor<TItem[]>,
    context: Accessor<DataGridContext<TItem>>,
    groupByColumns: Accessor<ColumnTemplate<TItem>[]>,
    sortBy: Accessor<
      | {
          column: ColumnTemplate<TItem>;
          direction: SortDirection;
        }
      | undefined
    >,
    path: string[]
  ): Accessor<GroupNode<TItem>> {
    const nextGroupBy = createMemo(
      () => groupByColumns()[0]
    );

    const sortByConfig = createMemo(() =>
      determineSortBy({
        sortByState: sortBy(),
        columnToGroupNodesBy: nextGroupBy()!,
      })
    );

    const nextGroupByFunction = createMemo(
      () => nextGroupBy()?.valueFromItem
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
            return items().map(
              (item): Node<TItem> => ({
                type: "ITEM_NODE",
                item,
                path,
                pathKey: pathKeyFromPath(path),
              })
            );
          const childNodes = groupKeys()!.map((key) => {
            const items = createMemo(() => groups()![key]!);
            const node = buildTreeRecursively(
              items,
              context,
              remainingGroupBys,
              sortBy,
              [...path, key]
            )();

            return node;
          });

          const { sortDirectionFactor, sortingFunction } =
            sortByConfig();

          const sortedChildNodes = childNodes
            .map((node) => ({
              node,
              sortingCriteria: sortingFunction?.({
                context,
                template: nextGroupBy()!,
                row: {
                  ...node,
                  type: "GROUP_ROW",
                },
              }),
            }))
            .sort((a, b) => {
              if (a.sortingCriteria < b.sortingCriteria)
                return -1 * sortDirectionFactor;
              if (b.sortingCriteria < a.sortingCriteria)
                return 1 * sortDirectionFactor;
              return 0;
            })
            .map((x) => x.node);

          return sortedChildNodes;
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

function determineSortBy<TItem>(config: {
  sortByState:
    | {
        column: ColumnTemplate<TItem>;
        direction: SortDirection;
      }
    | undefined;
  columnToGroupNodesBy: ColumnTemplate<TItem>;
}) {
  const valueFromGroupRowFromCurrentSort =
    config.sortByState?.column.valueFromGroupRow;

  const sortGroupByOfCurrentSort =
    config.columnToGroupNodesBy ===
      config.sortByState?.column ||
    valueFromGroupRowFromCurrentSort
      ? config.sortByState?.column.sortGroupBy
      : undefined;

  const sortGroupByOfCurrentGroup =
    config.columnToGroupNodesBy?.sortGroupBy;

  const sortingFunction =
    sortGroupByOfCurrentSort ??
    sortGroupByOfCurrentGroup ??
    defaultSortGroupBy;

  const sortDirectionFactor = !sortGroupByOfCurrentSort
    ? 1
    : config.sortByState?.direction === "DESC"
    ? -1
    : 1;

  return {
    sortingFunction,
    sortDirectionFactor,
  };
}

function defaultSortGroupBy(props: {
  row: GroupRow<unknown>;
}) {
  return last(props.row.path) ?? "";
}
