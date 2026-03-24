/**
 * helpers.ts — Fonctions utilitaires pour la gestion des archives.
 *
 * Contient les calculs de DUA et autres helpers utilisés
 * par ArchiveManagementContent et ses sous-composants.
 */

/**
 * Calcule la date d'expiration d'une DUA à partir de sa date de début,
 * sa valeur et son unité (years ou months).
 *
 * @param startDate - Date de début de la DUA
 * @param value     - Nombre d'unités (ex: 5)
 * @param unit      - Unité : "years" ou "months"
 * @returns La date d'expiration calculée
 */
export function computeExpiresAt(startDate: Date, value: number, unit: string): Date {
  const d = new Date(startDate);
  if (unit === "years")  d.setFullYear(d.getFullYear() + value);
  if (unit === "months") d.setMonth(d.getMonth() + value);
  return d;
}

/**
 * Dispatche une action archive via le bus d'événements DOM.
 *
 * Centralise le switch/case des actions du DetailPanel
 * (verify, edit, link-physical, configure-dua, lifecycle, delete).
 *
 * @returns `true` si l'action "delete" a été déclenchée (pour reset l'UI)
 */
export function dispatchArchiveAction(
  action: string,
  id: string | undefined,
  doc: Record<string, unknown> | undefined,
): boolean {
  const root = document.getElementById("root");
  if (!root || !id) return false;

  switch (action) {
    case "verify":
      root.dispatchEvent(new CustomEvent("__validate_archive_doc", { detail: { doc: id, name: "__validate_archive_doc" } }));
      break;
    case "edit":
      if (doc) root.dispatchEvent(new CustomEvent("__edit_archive_doc", { detail: { doc } }));
      break;
    case "link-physical":
      if (doc) root.dispatchEvent(new CustomEvent("__link_physical_record", { detail: { doc } }));
      break;
    case "configure-dua":
      if (doc) root.dispatchEvent(new CustomEvent("__configure_dua", { detail: { doc } }));
      break;
    case "to-semi-active":
      root.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "SEMI_ACTIVE" } }));
      break;
    case "reactivate":
      root.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "ACTIVE" } }));
      break;
    case "to-permanent":
      root.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } }));
      break;
    case "to-destroyed":
      root.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "DESTROYED" } }));
      break;
    case "restore":
      root.dispatchEvent(new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } }));
      break;
    case "delete":
      root.dispatchEvent(new CustomEvent("__delete_archive_docs", { detail: { ids: [id] } }));
      return true;
  }
  return false;
}
