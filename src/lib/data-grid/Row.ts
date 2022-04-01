import { GroupNode, ItemNode } from "./groups";

export type Row<TItem> =
  | HeaderRow<TItem>
  | GroupNode<TItem>
  | ItemNode<TItem>;

export type RowType = Row<any>["type"];
export type HeaderRow<TItem> = {
  type: "HEADER_ROW";
};
