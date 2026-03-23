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

/** Les 5 statuts normalisés du cycle de vie */
export type NormalizedStatus =
  | "PENDING"
  | "ACTIVE"
  | "SEMI_ACTIVE"
  | "PERMANENT"
  | "DESTROYED";

// ── Labels français ──────────────────────────────────────────

/** Correspondance statut → libellé français pour l'affichage */
export const STATUS_LABEL: Record<string, string> = {
  // Statuts actuels (SCREAMING_SNAKE_CASE)
  PENDING:         "En attente",
  ACTIVE:          "Actif",
  SEMI_ACTIVE:     "Intermédiaire",
  PERMANENT:       "Historique",
  DESTROYED:       "Détruit",
  // Legacy (anciens noms encore en base de données)
  pending:         "En attente",
  validated:       "Actif",
  archived:        "Intermédiaire",
  disposed:        "Détruit",
  actif:           "Actif",
  "intermédiaire": "Intermédiaire",
  historique:      "Historique",
  détruit:         "Détruit",
};

// ── Couleurs MUI ─────────────────────────────────────────────

/** Correspondance statut → couleur MUI pour les Chip, Badge, etc. */
export const STATUS_COLOR: Record<
  string,
  "default" | "warning" | "success" | "info" | "secondary" | "error"
> = {
  PENDING:         "warning",
  ACTIVE:          "success",
  SEMI_ACTIVE:     "info",
  PERMANENT:       "secondary",
  DESTROYED:       "error",
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
    PERMANENT: "PERMANENT",
    historique: "PERMANENT",
    DESTROYED: "DESTROYED",
    disposed: "DESTROYED",
    détruit: "DESTROYED",
  };

  return map[status] ?? "PENDING";
}
