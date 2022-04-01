import { Accessor, createMemo, mapArray } from "solid-js";
import {
  groupByMultiple,
  last,
} from "../helpers/arrayHelpers";
import {
  ObjectOf,
  SingleOrArray,
} from "../helpers/tsUtils";
import { SortDirection } from "./baseTypes";
import { ColumnTemplate } from "./ColumnTemplate";
import { DataGridContext } from "./GridContext";

export type GroupNode<TItem> = {
  path: string[];
  pathKey: string;
  items: Accessor<TItem[]>;
  childNodes: Accessor<Node<TItem>[]>;
  type: "GROUP_NODE";
  aggregationsByColumnKey: Accessor<
    ObjectOf<
      Accessor<
        SingleOrArray<
          string | number | boolean | null | undefined
        >
      >
    >
  >;
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
  columnsWithAggregations: Accessor<
    ColumnTemplate<TItem>[]
  >;
}): Accessor<GroupNode<TItem>> {
  return buildTreeRecursively(
    config.items,
    config.groupByColumns,
    []
  );

  function buildTreeRecursively(
    items: Accessor<TItem[]>,
    groupByColumns: Accessor<ColumnTemplate<TItem>[]>,
    path: string[]
  ): Accessor<GroupNode<TItem>> {
    const nextGroupBy = createMemo(
      () => groupByColumns()[0]
    );

    const sortByConfig = createMemo(() =>
      determineSortBy({
        sortByState: config.sortBy(),
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

    const childNodes = createMemo((): Node<TItem>[] => {
      const hasNext = hasNextGroupBy();
      if (!hasNext) {
        return items().map(
          (item): Node<TItem> => ({
            type: "ITEM_NODE",
            item,
            path,
            pathKey: pathKeyFromPath(path),
          })
        );
      }

      const groupChildNodes = groupKeys()!.map((key) => {
        const items = createMemo(() => groups()![key]!);
        const node = buildTreeRecursively(
          items,
          remainingGroupBys,
          [...path, key]
        )();

        return node;
      });

      const { sortDirectionFactor, sortingFunction } =
        sortByConfig();

      const sortedChildNodes = groupChildNodes
        .map((node) => ({
          node,
          sortingCriteria: sortingFunction?.({
            context: config.context,
            template: nextGroupBy()!,
            node,
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
    });

    const aggregationsWithColumns = mapArray(
      config.columnsWithAggregations,
      (column) => ({
        column,
        aggregation: createMemo(() =>
          column.aggregateItems!(items())
        ),
      })
    );

    const aggregationsByColumnKey = createMemo(() => {
      const result: ObjectOf<
        Accessor<
          SingleOrArray<
            string | number | boolean | null | undefined
          >
        >
      > = {};
      for (const x of aggregationsWithColumns()) {
        result[x.column.key] = x.aggregation;
      }
      return result;
    });

    return createMemo(
      (): GroupNode<TItem> => ({
        type: "GROUP_NODE",
        path,
        pathKey: pathKeyFromPath(path),
        items,
        childNodes: childNodes,
        aggregationsByColumnKey,
      })
    );
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
  const valueFromGroupFromCurrentSort =
    config.sortByState?.column.valueFromGroup;

  const sortGroupByOfCurrentSort =
    config.columnToGroupNodesBy ===
      config.sortByState?.column ||
    valueFromGroupFromCurrentSort
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
  node: GroupNode<unknown>;
}) {
  return last(props.node.path) ?? "";
}
