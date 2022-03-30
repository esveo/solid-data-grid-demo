import {
  Accessor,
  createEffect,
  createSignal,
  onCleanup,
} from "solid-js";

export function useElementDimensions(
  element: Accessor<HTMLElement | undefined | null>
) {
  const [dimensions, setDimensions] = createSignal({
    width: 0,
    height: 0,
  });

  createEffect(() => {
    const _el = element();

    if (!_el) return;

    const observer = new ResizeObserver((entries) => {
      const [first] = entries;
      const { width, height } = first!.contentRect;
      setDimensions({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    });

    observer.observe(_el);

    onCleanup(() => {
      observer.unobserve(_el);
      observer.disconnect();
    });
  });

  return dimensions;
}
