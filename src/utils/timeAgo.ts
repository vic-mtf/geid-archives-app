/**
 * timeAgo — Retourne un texte relatif humain en français.
 *
 * "il y a 2 secondes", "il y a 5 minutes", "il y a 3 jours"
 * Si l'écart dépasse 30 jours → date formatée (ex: 12/02/2026)
 */
export default function timeAgo(date: string | Date | undefined): string {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  if (isNaN(then)) return "";

  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) return "a l'instant";
  if (seconds < 60) return `il y a ${seconds} secondes`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "il y a 1 minute";
  if (minutes < 60) return `il y a ${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "il y a 1 heure";
  if (hours < 24) return `il y a ${hours} heures`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} jours`;

  // Au-delà de 30 jours → date formatée
  return new Date(date).toLocaleDateString("fr-FR");
}
