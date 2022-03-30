import {
  Accessor,
  createMemo,
  JSX,
  mapArray,
  Signal,
} from "solid-js";
import { lazy } from "../helpers/lazy";
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
  columnWidth: () => number | Signal<number>;
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

  /**
   * Defines the width of a column
   *   Provide a number or a function returning a number for
   *   columns with a fixed width
   *
   *   Provide a signal or a function returning a signal for
   *   resizable columns
   */
  columnWidth?:
    | number
    | Signal<number>
    | ((
        config: ColumnFunctionArgs<TItem>
      ) => number | Signal<number>);
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

    columnWidth: lazy(() => {
      if (definition.columnWidth === undefined) return 200;
      if (typeof definition.columnWidth === "number")
        return definition.columnWidth;

      if (Array.isArray(definition.columnWidth))
        return definition.columnWidth;

      return definition.columnWidth({
        context,
        template,
      });
    }),

    Item:
      definition.Item ??
      ((props) => <>{template.getValueFromItem(props)}</>),
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
