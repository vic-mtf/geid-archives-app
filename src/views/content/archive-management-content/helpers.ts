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
