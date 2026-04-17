/**
 * Defauts DUA cote client — doivent rester synchronises avec le backend
 * (controllers/archives/validate.js + lifecycle.js).
 *
 * Des qu'une archive est ACTIVE, une DUA par defaut de 10 ans en
 * conservation est consideree, meme si le document en DB ne contient
 * pas encore les champs (cas legacy). Le compte a rebours (startDate)
 * ne demarre qu'au passage SEMI_ACTIVE.
 */

export const DEFAULT_DUA = {
  value: 10,
  unit: "years" as const,
  sortFinal: "conservation" as const,
};

export type DuaUnit = "years" | "months";
export type DuaSortFinal = "conservation" | "elimination";

export interface DuaRaw {
  value?: number;
  unit?: string;
  sortFinal?: string;
  startDate?: string;
}

export interface DuaResolved {
  value: number;
  unit: DuaUnit;
  sortFinal: DuaSortFinal;
  startDate?: string;
  /** true si au moins un champ est absent en DB et qu'on retombe sur le defaut */
  isDefault: boolean;
}

/** Retourne la DUA effective, avec fallback aux defauts. */
export function resolveDua(raw: unknown): DuaResolved {
  const dua = (raw ?? {}) as DuaRaw;
  const isDefault = dua.value == null || !dua.unit || !dua.sortFinal;
  return {
    value: dua.value ?? DEFAULT_DUA.value,
    unit: (dua.unit as DuaUnit) ?? DEFAULT_DUA.unit,
    sortFinal: (dua.sortFinal as DuaSortFinal) ?? DEFAULT_DUA.sortFinal,
    startDate: dua.startDate,
    isDefault,
  };
}
