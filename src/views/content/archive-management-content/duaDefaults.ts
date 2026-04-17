/**
 * Defauts et helpers DUA cote client — synchronises avec le backend
 * (controllers/archives/validate.js + lifecycle.js + duaScheduler.js).
 *
 * Modele par phase :
 *   - Phase active (startDate = validation)     : 10 ans / years
 *   - Phase intermediaire (startDate = passage) : 10 ans / years
 *   - sortFinal                                  : conservation
 *
 * Transitions automatiques quand chaque phase expire.
 */

export type DuaUnit = "years" | "months";
export type DuaSortFinal = "conservation" | "elimination";

export const DEFAULT_PHASE_YEARS = 10;

export interface DuaPhaseRaw {
  value?: number;
  unit?: string;
  startDate?: string;
}

export interface DuaRaw {
  active?: DuaPhaseRaw;
  semiActive?: DuaPhaseRaw;
  sortFinal?: string;
  // Ancien format (legacy) : stocke comme si c'etait la phase intermediaire
  value?: number;
  unit?: string;
  startDate?: string;
}

export interface DuaPhaseResolved {
  value: number;
  unit: DuaUnit;
  /** undefined tant que l'etape n'a pas ete atteinte */
  startDate?: string;
  /** true si on retombe sur les defauts (doc legacy sans champs) */
  isDefault: boolean;
}

export interface DuaResolved {
  active: DuaPhaseResolved;
  semiActive: DuaPhaseResolved;
  sortFinal: DuaSortFinal;
  sortFinalIsDefault: boolean;
}

/**
 * Normalise une DUA brute en structure par phase avec defauts.
 * Lit aussi l'ancien format single-DUA (value/unit/startDate top-level) et le
 * traite comme la phase intermediaire.
 */
export function resolveDua(raw: unknown): DuaResolved {
  const r = (raw ?? {}) as DuaRaw;

  // Phase active
  const activeVal = r.active?.value;
  const activeUnit = r.active?.unit;
  const activeStart = r.active?.startDate;
  const active: DuaPhaseResolved = {
    value: activeVal ?? DEFAULT_PHASE_YEARS,
    unit: (activeUnit as DuaUnit) ?? "years",
    startDate: activeStart,
    isDefault: activeVal == null || !activeUnit,
  };

  // Phase intermediaire : preferer dua.semiActive, fallback sur top-level
  const semiVal = r.semiActive?.value ?? r.value;
  const semiUnit = r.semiActive?.unit ?? r.unit;
  const semiStart = r.semiActive?.startDate ?? r.startDate;
  const semiActive: DuaPhaseResolved = {
    value: semiVal ?? DEFAULT_PHASE_YEARS,
    unit: (semiUnit as DuaUnit) ?? "years",
    startDate: semiStart,
    isDefault: semiVal == null || !semiUnit,
  };

  const sortFinal = (r.sortFinal as DuaSortFinal) ?? "conservation";

  return {
    active,
    semiActive,
    sortFinal,
    sortFinalIsDefault: !r.sortFinal,
  };
}

/** Calcule la date d'expiration d'une phase (ou null si pas demarree). */
export function phaseExpiresAt(phase: DuaPhaseResolved): Date | null {
  if (!phase.startDate) return null;
  const d = new Date(phase.startDate);
  if (phase.unit === "years") d.setFullYear(d.getFullYear() + phase.value);
  else d.setMonth(d.getMonth() + phase.value);
  return d;
}

/** Progression en % (0..100), 0 si pas demarree, 100 si expiree. */
export function phaseProgress(phase: DuaPhaseResolved): number {
  const end = phaseExpiresAt(phase);
  if (!end || !phase.startDate) return 0;
  const start = new Date(phase.startDate).getTime();
  const span = end.getTime() - start;
  if (span <= 0) return 100;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, (elapsed / span) * 100));
}

/** Retourne la phase courante d'une archive selon son statut. */
export function currentPhase(
  status: string | undefined,
  norm: string,
): "active" | "semiActive" | null {
  if (norm === "ACTIVE") return "active";
  if (norm === "SEMI_ACTIVE") return "semiActive";
  void status;
  return null;
}
