export function consumeSync<TResult>(
  generator: Generator<unknown, TResult, unknown>
) {
  let next = generator.next();
  while (!next.done) next = generator.next();
  return next.value;
}

export async function consumeAsync<TResult>(
  generator: Generator<unknown, TResult, unknown>
): Promise<TResult> {
  let start = performance.now();
  while (true) {
    const next = generator.next();
    if (next.done) return next.value;
    let end = performance.now();

    if (end - start > 10) {
      await browserIdle();
      start = performance.now();
    }
  }
}

const callack =
  window.requestIdleCallback ?? requestAnimationFrame;

function browserIdle(): Promise<void> {
  return new Promise<void>((r) => {
    callack(() => {
      r();
    });
  });
}
