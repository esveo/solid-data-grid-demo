export function typesafeKeys<T>(t: T) {
  return Object.keys(t) as (keyof T)[];
}

export function assertNever(x: never): never {
  console.error(
    "Should never be called, but was called with:",
    x
  );
  throw new Error("Should never be called");
}
