export function typesafeKeys<T>(t: T) {
  return Object.keys(t) as (keyof T)[];
}
