/**
 * avatarColor — Couleur déterministe par ID utilisateur.
 *
 * Même algorithme que lisolona-budget (colorFromId).
 * Génère un hsl unique et stable basé sur les 6 derniers
 * caractères hex de l'ID MongoDB.
 */

export default function avatarColor(id: string | undefined): { bgcolor: string; color: string } {
  if (!id) return { bgcolor: "grey.400", color: 'common.white' };
  const num = parseInt(id.toString().slice(-6), 16);
  const hue = num % 360;
  return {
    bgcolor: `hsl(${hue}, 65%, 45%)`,
    color: `hsl(${hue}, 65%, 92%)`,
  };
}
