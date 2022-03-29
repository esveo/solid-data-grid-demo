export function defineScope(classScope: string) {
  return function scoped(
    ...classes: (string | null | undefined | false)[]
  ) {
    return classes
      .filter((className) => typeof className === "string")
      .map((className) => `${classScope}${className}`)
      .join(" ");
  };
}
