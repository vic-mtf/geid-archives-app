/**
 * physical.ts — Constantes de la hiérarchie d'archivage physique.
 *
 * Définit les labels français, les couleurs et les endpoints API
 * pour chaque niveau de la hiérarchie physique (6 niveaux) :
 *
 *   Conteneur → Étagère → Niveau → Classeur → Dossier → Document
 */

// ── Type du niveau ───────────────────────────────────────────

/** Les 6 niveaux de la hiérarchie physique */
export type PhysicalLevel =
  | "container"
  | "shelf"
  | "floor"
  | "binder"
  | "record"
  | "document";

// ── Labels français ──────────────────────────────────────────

/** Correspondance code technique → libellé français */
export const LEVEL_LABELS: Record<PhysicalLevel, string> = {
  container: "Conteneur",
  shelf:     "Étagère",
  floor:     "Niveau",
  binder:    "Classeur",
  record:    "Dossier",
  document:  "Document",
};

// ── Couleurs par niveau ──────────────────────────────────────

/** Couleurs distinctes pour chaque niveau (utilisées dans les icônes et titres) */
export const LEVEL_COLORS: Record<PhysicalLevel, string> = {
  container: "#5C6BC0",
  shelf:     "#26A69A",
  floor:     "#42A5F5",
  binder:    "#FFA726",
  record:    "#AB47BC",
  document:  "#78909C",
};

// ── Endpoints API ────────────────────────────────────────────

/** Base URL de l'API d'archivage physique */
export const PHYSICAL_API_BASE = "/api/stuff/archives/physical";

/** Endpoints de suppression par niveau */
export const DELETE_ENDPOINTS: Record<PhysicalLevel, string> = {
  container: `${PHYSICAL_API_BASE}/containers`,
  shelf:     `${PHYSICAL_API_BASE}/shelves`,
  floor:     `${PHYSICAL_API_BASE}/floors`,
  binder:    `${PHYSICAL_API_BASE}/binders`,
  record:    `${PHYSICAL_API_BASE}/records`,
  document:  `${PHYSICAL_API_BASE}/documents`,
};

/** Endpoints de mise à jour par niveau */
export const UPDATE_ENDPOINTS: Record<PhysicalLevel, string> = {
  container: `${PHYSICAL_API_BASE}/containers`,
  shelf:     `${PHYSICAL_API_BASE}/shelves`,
  floor:     `${PHYSICAL_API_BASE}/floors`,
  binder:    `${PHYSICAL_API_BASE}/binders`,
  record:    `${PHYSICAL_API_BASE}/records`,
  document:  `${PHYSICAL_API_BASE}/documents`,
};

/** Champ principal à modifier lors d'un renommage inline */
export const RENAME_FIELD: Record<PhysicalLevel, string> = {
  container: "name",
  shelf:     "name",
  floor:     "label",
  binder:    "name",
  record:    "internalNumber",
  document:  "title",
};

// ── Navigation — niveau suivant ──────────────────────────────

/** Quand on clique sur un élément de ce niveau, on descend au niveau suivant */
export const NEXT_LEVEL: Record<PhysicalLevel, PhysicalLevel> = {
  container: "shelf",
  shelf:     "floor",
  floor:     "binder",
  binder:    "record",
  record:    "document",
  document:  "document", // récursif — un document peut contenir des sous-documents
};
