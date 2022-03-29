import { JSX } from "solid-js";

export type ColumnTemplate<TItem> = {
  title: string;
  Item: (props: {
    item: TItem;
    template: ColumnTemplate<TItem>;
  }) => JSX.Element;
};
