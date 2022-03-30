import { defineScope } from "../../scoped-classes/scoped";
import { dataGridCssScope } from "../cssScope";

export function NumberRenderer(props: {
  content: number | null | undefined;
  decimals?: number;
}) {
  return (
    <div class={css("__number-renderer")}>
      <span class={css("__number-renderer--content")}>
        {props.content?.toLocaleString(undefined, {
          minimumFractionDigits: props.decimals,
          maximumFractionDigits: props.decimals,
        })}
      </span>
    </div>
  );
}

const css = defineScope(dataGridCssScope);
