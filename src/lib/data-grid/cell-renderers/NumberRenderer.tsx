import { JSXElement } from "solid-js";
import { defineScope } from "../../scoped-classes/scoped";
import { dataGridCssScope } from "../cssScope";

export function NumberRenderer(props: {
  content: number | null | undefined;
  decimals?: number;
  suffix?: JSXElement;
}) {
  return (
    <div class={css("__number-renderer")}>
      <span class={css("__number-renderer--content")}>
        {props.content?.toLocaleString(undefined, {
          minimumFractionDigits: props.decimals,
          maximumFractionDigits: props.decimals,
        })}{" "}
        {props.suffix}
      </span>
    </div>
  );
}

const css = defineScope(dataGridCssScope);
