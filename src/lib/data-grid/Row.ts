import { Accessor } from "solid-js";

export type Row<TItem> =
  | {
      type: "HEADER_ROW";
    }
  | {
      path: string[];
      type: "ITEM_ROW";
      item: TItem;
    }
  | {
      type: "GROUP_ROW";
      items: Accessor<TItem[]>;
      path: string[];
    };

export type RowType = Row<any>["type"];
export type HeaderRow<TItem> = Extract<
  Row<TItem>,
  { type: "HEADER_ROW" }
>;
export type ItemRow<TItem> = Extract<
  Row<TItem>,
  { type: "ITEM_ROW" }
>;
export type GroupRow<TItem> = Extract<
  Row<TItem>,
  { type: "GROUP_ROW" }
>;
export type DataRow<TItem> =
  | GroupRow<TItem>
  | ItemRow<TItem>;
