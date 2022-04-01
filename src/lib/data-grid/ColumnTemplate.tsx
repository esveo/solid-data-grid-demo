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
import { GroupRow, ItemRow } from "./Row";

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
      row: ItemRow<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;
  valueFromGroupRow?: (
    props: {
      row: GroupRow<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;

  /**
   * The component that will be rendered for each group cell
   * of that column.
   *
   * Defaults to `valueFromGroupRow`
   */
  Group: (
    props: {
      row: GroupRow<TItem>;
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
      row: GroupRow<TItem>;
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
      row: ItemRow<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;

  /**
   * Return a displayable primitive value from the group row
   */
  valueFromGroupRow?: (
    props: {
      row: GroupRow<TItem>;
    } & ColumnFunctionArgs<TItem>
  ) => SingleOrArray<
    number | string | boolean | null | undefined
  >;

  /**
   * The component that will be rendered for each group cell
   * of that column.
   *
   * Defaults to `valueFromGroupRow`
   */
  Group?: (
    props: {
      row: GroupRow<TItem>;
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
   * Defaults to `valueFromGroupRow`
   */
  sortGroupBy?: (
    props: {
      row: GroupRow<TItem>;
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
      definition.sortGroupBy ??
      definition.valueFromGroupRow,
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
    row: ItemRow<TItem>;
  } & ColumnFunctionArgs<TItem>
) {
  return (
    <DefaultRenderer
      content={joinIfArray(
        props.template.valueFromItem({
          ...props,
          item: props.row.item,
        })
      )}
    ></DefaultRenderer>
  );
}

function DefaultGroup<TItem>(
  props: {
    row: GroupRow<TItem>;
  } & ColumnFunctionArgs<TItem>
) {
  return (
    <DefaultRenderer
      content={joinIfArray(
        props.template.valueFromGroupRow?.(props)
      )}
    ></DefaultRenderer>
  );
}
