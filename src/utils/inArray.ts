export default function inArray<T>(array_1: T[] = [], array_2: T[] = []): boolean {
  let find = false;
  array_2.forEach((item) => {
    if (~array_1.indexOf(item)) find = true;
  });
  return find || array_1.length === 0;
}
