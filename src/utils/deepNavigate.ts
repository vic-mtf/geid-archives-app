/**
 * deepNavigate.ts — Navigation profonde vers n'importe quel point de l'application.
 *
 * Permet de naviguer vers un onglet + ouvrir un élément spécifique,
 * même s'il est dans un sous-niveau profond.
 *
 * Le système utilise location.state pour transmettre la cible.
 * Chaque vue (Dashboard, Archives, Physique, etc.) écoute le state
 * et réagit pour ouvrir/sélectionner l'élément ciblé.
 *
 * Usage :
 *   deepNavigate(navigateTo, { tab: "archiveManager", archiveId: "64a..." });
 *   deepNavigate(navigateTo, { tab: "physicalArchive", physicalPath: [...] });
 *   deepNavigate(navigateTo, { tab: "help", helpSection: "archivage-physique" });
 */

type NavigateFn = (options: { state: Record<string, unknown> }) => void;

export interface DeepTarget {
  /** Onglet de destination */
  tab: string;
  /** ID d'une archive à ouvrir dans le détail */
  archiveId?: string;
  /** Chemin physique complet (breadcrumb) pour naviguer dans l'archivage physique */
  physicalPath?: Array<{ id: string; label: string; level: string }>;
  /** Section de l'aide à scroller vers */
  helpSection?: string;
  /** ID d'un utilisateur à ouvrir */
  userId?: string;
  /** Filtre de statut à appliquer (PENDING, ACTIVE, etc.) */
  statusFilter?: string;
  /** Filtre rapide à appliquer (dua_expired, this_month) */
  quickFilter?: string;
  /** ID d'un PV d'élimination à ouvrir */
  eliminationPvId?: string;
}

/**
 * Navigue vers un point précis de l'application.
 * La vue de destination lira `location.state.deepTarget` pour
 * ouvrir/sélectionner l'élément ciblé.
 */
export default function deepNavigate(navigateTo: NavigateFn, target: DeepTarget) {
  navigateTo({
    state: {
      navigation: { tabs: { option: target.tab } },
      // _ts unique garantit que useEffect se redéclenche même si le même filtre est cliqué deux fois
      deepTarget: { ...target, _ts: Date.now() },
    },
  });
}
