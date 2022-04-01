import {
  Accessor,
  createMemo,
  JSX,
  mapArray,
} from "solid-js";
import { joinIfArray } from "../helpers/arrayHelpers";
import { SingleOrArray } from "../helpers/tsUtils";
import { DefaultRenderer } from "./cell-renderers/DefaultRenderer";
import { ColumnFilterDefinition } from "./filters";
import { DataGridContext } from "./GridContext";
import { GroupNode, ItemNode } from "./groups";

export type ColumnFunctionArgs<TItem> = {
  template: ColumnTemplate<TItem>;
  context: Accessor<DataGridContext<TItem>>;
};

export type ColumnTemplate<TItem> = {
  key: string;
  title: string;
  valueFromItem: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;
  Item: (
    props: {
      node: ItemNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;
  aggregateItems?: (
    items: TItem[]
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;
  valueFromGroup?: (
    props: {
      node: GroupNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;

  /**
   * The component that will be rendered for each group cell
   * of that column.
   *
   * Defaults to `valueFromGroup`
   */
  Group: (
    props: {
      node: GroupNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;
  columnWidth: number;
  resizable: boolean;
  frozen: "LEFT" | "RIGHT" | "UNFROZEN";
  filter?: ColumnFilterDefinition<TItem, unknown>;
  groupable: boolean;
  sortBy: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => any;
  sortGroupBy?: (
    props: {
      node: GroupNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => any;
  sortable: boolean;
};

export type ColumnTemplateDefinition<TItem> = {
  key: string;
  title?: string;

  /**
   * Return a displayable primitive value from the item.
   */
  valueFromItem: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;

  /**
   * The component that will be rendered for each item row
   * of that column.
   *
   * Defaults to `getValueFromItem`
   */
  Item?: (
    props: {
      node: ItemNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;

  /**
   * Calculate aggregations for all items of a group row for this column.
   *
   * Will only be called when building the tree of groups but will be called
   * for all groups, no matter if displayed or not.
   */
  aggregateItems?: (
    items: TItem[]
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;

  /**
   * Return a displayable primitive value from the group row
   * defaults to returning the aggregation value (if present)
   *
   * Will be called for sorting groups and for rendering group
   * cells.
   */
  valueFromGroup?: (
    props: {
      node: GroupNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;

  /**
   * The component that will be rendered for each group cell
   * of that column.
   *
   * Defaults to `valueFromGroup`
   */
  Group?: (
    props: {
      node: GroupNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;

  columnWidth?: number;

  resizable?: boolean;

  frozen?: "LEFT" | "RIGHT";

  filter?: ColumnFilterDefinition<TItem, any, any>;

  groupable?: boolean;

  /**
   * Retrieve the sorting criteria from an item
   * Defaults to `valueFromItem`
   */
  sortBy?: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => any;

  /**
   * Retrieve sorting criteria from group row
   * Defaults to `valueFromGroup`
   */
  sortGroupBy?: (
    props: {
      node: GroupNode<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => any;

  /**
   * Defaults to `true`
   */
  sortable?: boolean;
};

export function addDefaultsToColumnTemplateDefinition<
  TItem
>(
  definition: ColumnTemplateDefinition<TItem>,
  context: Accessor<DataGridContext<TItem>>
): ColumnTemplate<TItem> {
  const template: ColumnTemplate<TItem> = {
    ...definition,
    title: definition.title ?? definition.key,

    columnWidth: definition.columnWidth ?? 200,
    resizable: definition.resizable ?? true,

    Item: definition.Item ?? DefaultItem,

    Group: definition.Group ?? DefaultGroup,
    groupable: definition.groupable ?? false,

    frozen: definition.frozen ?? "UNFROZEN",

    sortBy: definition.sortBy ?? definition.valueFromItem,
    sortable: definition.sortable ?? true,
    sortGroupBy:
      definition.sortGroupBy ?? definition.valueFromGroup,
    valueFromGroup:
      definition.valueFromGroup ??
      (definition.aggregateItems
        ? (props) =>
            props.node.aggregationsByColumnKey()[
              definition.key
            ]!()
        : undefined),
  };
  return template;
}

export function dynamicColumns<TDynamicItem, TItem>(
  dynamicItems: Accessor<TDynamicItem[]>,
  generateColumn: (
    dynamicItem: TDynamicItem
  ) => ColumnTemplateDefinition<TItem>
) {
  return createMemo(mapArray(dynamicItems, generateColumn));
}

function DefaultItem<TItem>(
  props: {
    node: ItemNode<TItem>;
  } & ColumnFunctionArgs<TItem>
) {
  return (
    <DefaultRenderer
      content={joinIfArray(
        props.template.valueFromItem({
          ...props,
          item: props.node.item,
        })
      )}
    ></DefaultRenderer>
  );
}

function DefaultGroup<TItem>(
  props: {
    node: GroupNode<TItem>;
  } & ColumnFunctionArgs<TItem>
) {
  return (
    <DefaultRenderer
      content={joinIfArray(
        props.template.valueFromGroup?.(props)
      )}
    ></DefaultRenderer>
  );
}
