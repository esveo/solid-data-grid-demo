import {
  Accessor,
  createEffect,
  createSignal,
  JSXElement,
  untrack,
} from "solid-js";
import { Dimensions } from "./Dimensions";
import { useElementDimensions } from "./useElementDimensions";

/**
 * TODO:
 *   Right now, our AutoSizer forces users to provide overflow: hidden
 *   to its parent element, because otherwise shrinking of the element
 *   will not work.
 *
 *   Check if React-Autosizer has this same flaw within a flexbox.
 *
 *
 */
export function AutoSizer(props: {
  children: (
    dimensions: Accessor<Dimensions>
  ) => JSXElement;
}) {
  const [div, setDiv] = createSignal<HTMLDivElement>();
  const [parent, setParent] = createSignal<HTMLElement>();

  const dimensions = useElementDimensions(parent);

  createEffect(() => {
    const element = div();
    setParent(element?.parentElement ?? undefined);
  });

  return (
    <>
      {untrack(() => props.children(dimensions))}
      <div ref={setDiv} />
    </>
  );
}
