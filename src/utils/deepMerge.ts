import { isPlainObject } from "lodash";

type DeepMergeValue = Record<string, unknown> | unknown;

export default function deepMerge<T extends Record<string, unknown>>(
  oldObject: T,
  newObject: Partial<T>
): T {
  const result: Record<string, unknown> = { ...oldObject };
  (Object.keys(newObject) as (keyof T)[]).forEach((key) => {
    const newVal = newObject[key] as DeepMergeValue;
    const oldVal = oldObject[key] as DeepMergeValue;
    if (isPlainObject(newVal) && isPlainObject(oldVal)) {
      result[key as string] = deepMerge(
        oldVal as Record<string, unknown>,
        newVal as Record<string, unknown>
      );
    } else {
      result[key as string] =
        typeof newVal === "function"
          ? (newVal as (prev: unknown) => unknown)(result[key as string])
          : newVal;
    }
  });
  return result as T;
}
