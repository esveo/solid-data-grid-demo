import {
  Accessor,
  createMemo,
  JSX,
  mapArray,
} from "solid-js";
import { DataGridContext } from "./GridContext";

export type ColumnFunctionArgs<TItem> = {
  template: ColumnTemplate<TItem>;
  context: Accessor<DataGridContext<TItem>>;
};

export type ColumnTemplate<TItem> = {
  key: string;
  title: string;
  getValueFromItem: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => number | string | boolean | null | undefined;
  Item: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;
  columnWidth: number;
  resizable: boolean;
  frozen: "LEFT" | "RIGHT" | "UNFROZEN";
};

export type ColumnTemplateDefinition<TItem> = {
  key: string;
  title?: string;

  /**
   * Return a displayable primitive value from the item.
   */
  getValueFromItem: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => number | string | boolean | null | undefined;

  /**
   * The component that will be rendered for each item row
   * of that column.
   *
   * Defaults to `getValueFromItem`
   */
  Item?: (
    props: {
      item: TItem;
    } & ColumnFunctionArgs<TItem>
  ) => JSX.Element;

  columnWidth?: number;

  resizable?: boolean;

  frozen?: "LEFT" | "RIGHT";
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

    Item:
      definition.Item ??
      ((props) => <>{template.getValueFromItem(props)}</>),

    frozen: definition.frozen ?? "UNFROZEN",
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
