import { JSX, Show } from "solid-js";
import { NumberRenderer } from "./NumberRenderer";
import { StringRenderer } from "./StringRenderer";

export function DefaultRenderer(props: {
  content: JSX.Element;
}) {
  return (
    <Show
      when={typeof props.content === "number"}
      fallback={<StringRenderer content={props.content} />}
    >
      <NumberRenderer content={props.content as number} />
    </Show>
  );
}
