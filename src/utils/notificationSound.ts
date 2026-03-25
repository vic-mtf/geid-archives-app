/**
 * notificationSound — Système de notification sonore optimisé.
 *
 * - Chargement lazy : le son n'est chargé qu'au premier appel
 * - Cache : chaque son n'est chargé qu'une seule fois
 * - Pas de new Audio() au démarrage — 0 consommation mémoire initiale
 * - Volume configurable
 *
 * Sons disponibles :
 *   notification — nouveau PV, nouvelle archive, événement neutre
 *   success      — approbation, sauvegarde, action réussie
 *   alert        — rejet, urgence, action critique
 */

const BASE = import.meta.env.BASE_URL ?? "/";
const SOUNDS = {
  notification: `${BASE}sounds/notification.mp3`,
  success:      `${BASE}sounds/success.mp3`,
  alert:        `${BASE}sounds/alert.mp3`,
} as const;

export type SoundType = keyof typeof SOUNDS;

const cache = new Map<SoundType, HTMLAudioElement>();

function getAudio(type: SoundType): HTMLAudioElement {
  let audio = cache.get(type);
  if (!audio) {
    audio = new Audio(SOUNDS[type]);
    audio.preload = "auto";
    cache.set(type, audio);
  }
  return audio;
}

/**
 * Joue un son de notification.
 * @param type — notification | success | alert
 * @param volume — 0 à 1 (défaut: 0.3)
 */
export default function playSound(type: SoundType = "notification", volume = 0.3): void {
  try {
    const audio = getAudio(type);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Navigateur bloque l'autoplay — pas grave, on ignore silencieusement
    });
  } catch {
    // Pas de son disponible — silencieux
  }
}
