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

export type ObjectOf<TValue> = Record<string, TValue>;

export type SingleOrArray<T> = T | ReadonlyArray<T>;

export function isTruthy<T>(
  input: T
): input is Exclude<T, false | undefined | null | 0 | ""> {
  return !!input;
}
