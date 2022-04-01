import { JSX } from "solid-js";
import { castArray } from "../helpers/arrayHelpers";
import {
  ColumnFunctionArgs,
  ColumnTemplate,
} from "./ColumnTemplate";

export type ColumnFilterDefinition<
  TItem,
  TFilterState,
  TParsedFilter = TFilterState
> = {
  renderFilter: (
    props: ColumnFunctionArgs<TItem>
  ) => JSX.Element;
  parseFilterState?: (state: TFilterState) => TParsedFilter;
  doesItemMatchFilter(
    args: {
      item: TItem;
      state: TParsedFilter;
    } & ColumnFunctionArgs<TItem>
  ): boolean;
};

export function numberRangeFilter<TItem>(
  numberFromItem: (item: TItem) => number | null | undefined
): ColumnFilterDefinition<
  TItem,
  { min?: number; max?: number }
> {
  return {
    renderFilter: () => null,
    parseFilterState: (x) => x,
    doesItemMatchFilter: (args) => {
      const number = numberFromItem(args.item);
      const min = args.state.min ?? -Infinity;
      const max = args.state.max ?? Infinity;
      if (number == null) return false;
      return number >= min && number <= max;
    },
  };
}

export function multiSelectFilter<TItem>(
  selectableValueOrValuesFromItem?: ColumnTemplate<TItem>["valueFromItem"]
): ColumnFilterDefinition<
  TItem,
  (number | string | boolean | null | undefined)[],
  Set<number | string | boolean | null | undefined>
> {
  return {
    renderFilter: () => null,
    parseFilterState: (state) => new Set(state),
    doesItemMatchFilter: (args) => {
      const retrieveInput =
        selectableValueOrValuesFromItem ??
        args.template.valueFromItem;
      const input = castArray(retrieveInput(args));
      return input.some((i) => args.state.has(i));
    },
  };
}
