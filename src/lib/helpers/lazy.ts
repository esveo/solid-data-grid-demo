export function lazy<T>(factory: () => T): () => T {
  let cache: T | null = null;

  return function lazyFactory() {
    if (cache === null) cache = factory();
    return cache;
  };
}
