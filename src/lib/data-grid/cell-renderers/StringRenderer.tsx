import { JSX } from "solid-js";
import { defineScope } from "../../scoped-classes/scoped";
import { dataGridCssScope } from "../cssScope";

export function StringRenderer(props: {
  content: JSX.Element;
}) {
  return (
    <div class={css("__string-renderer")}>
      <span class={css("__string-renderer--content")}>
        {props.content}
      </span>
    </div>
  );
}

const css = defineScope(dataGridCssScope);
