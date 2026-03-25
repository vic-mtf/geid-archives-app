/**
 * lifecycle.ts — Constantes et helpers du cycle de vie des archives.
 *
 * Centralise les labels, couleurs et la fonction de normalisation
 * des statuts d'archives. Utilisé par tous les composants qui
 * affichent ou manipulent le statut d'une archive.
 *
 * Statuts possibles (SCREAMING_SNAKE_CASE) :
 *   PENDING     → En attente de validation
 *   ACTIVE      → Validée, en usage courant
 *   SEMI_ACTIVE → Intermédiaire, DUA en cours
 *   PERMANENT   → Conservation définitive
 *   DESTROYED   → Éliminée
 */

// ── Types ────────────────────────────────────────────────────

/** Les 6 statuts normalisés du cycle de vie */
export type NormalizedStatus =
  | "PENDING"
  | "ACTIVE"
  | "SEMI_ACTIVE"
  | "PROPOSED_ELIMINATION"
  | "PERMANENT"
  | "DESTROYED";

// ── Labels i18n ──────────────────────────────────────────────

import i18n from "@/i18n/i18n";

/** Clés i18n pour chaque statut normalisé */
const STATUS_I18N_KEY: Record<string, string> = {
  PENDING:                "status.PENDING",
  ACTIVE:                 "status.ACTIVE",
  SEMI_ACTIVE:            "status.SEMI_ACTIVE",
  PROPOSED_ELIMINATION:   "status.PROPOSED_ELIMINATION",
  PERMANENT:              "status.PERMANENT",
  DESTROYED:              "status.DESTROYED",
  // Legacy (anciens noms encore en base de données)
  pending:         "status.PENDING",
  validated:       "status.ACTIVE",
  archived:        "status.SEMI_ACTIVE",
  disposed:        "status.DESTROYED",
  actif:           "status.ACTIVE",
  "intermédiaire": "status.SEMI_ACTIVE",
  historique:      "status.PERMANENT",
  détruit:         "status.DESTROYED",
};

/** Correspondance statut → libellé traduit pour l'affichage */
export const STATUS_LABEL: Record<string, string> = new Proxy({} as Record<string, string>, {
  get(_target, prop: string) {
    const key = STATUS_I18N_KEY[prop];
    return key ? i18n.t(key) : prop;
  },
});

// ── Couleurs MUI ─────────────────────────────────────────────

/** Correspondance statut → couleur MUI pour les Chip, Badge, etc. */
export const STATUS_COLOR: Record<
  string,
  "default" | "warning" | "success" | "info" | "secondary" | "error"
> = {
  PENDING:                "warning",
  ACTIVE:                 "success",
  SEMI_ACTIVE:            "info",
  PROPOSED_ELIMINATION:   "error",
  PERMANENT:              "secondary",
  DESTROYED:              "error",
  // Legacy
  pending:         "warning",
  validated:       "success",
  archived:        "info",
  disposed:        "error",
  actif:           "success",
  "intermédiaire": "info",
  historique:      "secondary",
  détruit:         "error",
};

// ── Normalisation ────────────────────────────────────────────

/**
 * Convertit un statut brut (provenant de l'API/base de données)
 * en statut normalisé SCREAMING_SNAKE_CASE.
 *
 * Gère les anciens noms (legacy) et le cas particulier
 * où `validated === true` sans statut explicite.
 *
 * @param status  - Le statut brut (peut être indéfini)
 * @param validated - Si l'archive est validée (fallback)
 * @returns Le statut normalisé
 */
export function normalizeStatus(
  status: string | undefined,
  validated?: boolean,
): NormalizedStatus {
  if (!status) return validated ? "ACTIVE" : "PENDING";

  const map: Record<string, NormalizedStatus> = {
    PENDING: "PENDING",
    pending: "PENDING",
    ACTIVE: "ACTIVE",
    validated: "ACTIVE",
    actif: "ACTIVE",
    SEMI_ACTIVE: "SEMI_ACTIVE",
    archived: "SEMI_ACTIVE",
    "intermédiaire": "SEMI_ACTIVE",
    PROPOSED_ELIMINATION: "PROPOSED_ELIMINATION",
    PERMANENT: "PERMANENT",
    historique: "PERMANENT",
    DESTROYED: "DESTROYED",
    disposed: "DESTROYED",
    détruit: "DESTROYED",
  };

  return map[status] ?? "PENDING";
}
