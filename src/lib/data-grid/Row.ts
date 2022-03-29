export type Row<TItem> =
  | {
      type: "HEADER_ROW";
    }
  | {
      type: "ITEM_ROW";
      item: TItem;
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
