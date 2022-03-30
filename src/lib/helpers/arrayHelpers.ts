export function range(from: number, to: number) {
  const result: number[] = [];
  for (let i = from; i < to; i++) {
    result.push(i);
  }
  return result;
}

export function last<T>(
  items: ReadonlyArray<T>
): T | undefined {
  return items[items.length - 1];
}

export function sumBy<T>(
  items: ReadonlyArray<T>,
  by: (item: T) => number
): number {
  let result = 0;
  for (const item of items) {
    result += by(item);
  }

  return result;
}

export function keyBy<T, TKey extends string | number>(
  items: ReadonlyArray<T>,
  getKey: (
    item: T,
    index: number,
    array: ReadonlyArray<T>
  ) => string | number
): Record<TKey, T> {
  const result = {} as any;
  items.forEach((item, index, items) => {
    result[getKey(item, index, items)] = item;
  });
  return result;
}
