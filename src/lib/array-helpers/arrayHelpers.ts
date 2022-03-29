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
