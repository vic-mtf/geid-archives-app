export const sortFuncString = (a: string, b: string): number =>
  a > b ? 1 : a < b ? -1 : 0;

export const sortFuncDate = (a: Date | null | undefined, b: Date | null | undefined): number =>
  (a?.getTime() ?? 0) - (b?.getTime() ?? 0);

export const sortNumber = (a: number, b: number): number => a - b;
