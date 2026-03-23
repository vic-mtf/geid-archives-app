/**
 * navigateTo.ts — Helpers de navigation entre sections de l'application.
 *
 * Permet de naviguer directement vers un onglet spécifique et optionnellement
 * vers une section précise (ancre dans l'aide, filtre dans les archives, etc.).
 *
 * Utilisation :
 *   import { goToTab, goToHelp, goToArchives } from "@/utils/navigateTo";
 *   const navigateTo = useNavigateSetState();
 *   goToTab(navigateTo, "dashboard");
 *   goToHelp(navigateTo, "archivage-physique");
 *   goToArchives(navigateTo, "PENDING");
 */

type NavigateFn = (options: { state: Record<string, unknown> }) => void;

/**
 * Navigue vers un onglet de l'application.
 * @param navigateTo - La fonction de navigation (de useNavigateSetState)
 * @param tab - L'identifiant de l'onglet (dashboard, archiveManager, physicalArchive, help)
 */
export function goToTab(navigateTo: NavigateFn, tab: string) {
  navigateTo({ state: { navigation: { tabs: { option: tab } } } });
}

/**
 * Navigue vers une section spécifique de l'aide.
 * @param navigateTo - La fonction de navigation
 * @param sectionId - L'identifiant de la section (ex: "archivage-physique", "recherche")
 */
export function goToHelp(navigateTo: NavigateFn, sectionId?: string) {
  navigateTo({
    state: {
      navigation: { tabs: { option: "help" } },
      helpAnchor: sectionId ?? null,
    },
  });
}

/**
 * Navigue vers la gestion des archives avec un filtre optionnel.
 * @param navigateTo - La fonction de navigation
 * @param statusFilter - Le filtre de statut à appliquer (PENDING, ACTIVE, etc.)
 */
export function goToArchives(navigateTo: NavigateFn, statusFilter?: string) {
  navigateTo({
    state: {
      navigation: { tabs: { option: "archiveManager" } },
      archiveFilter: statusFilter ?? null,
    },
  });
}

/**
 * Navigue vers l'archivage physique.
 * @param navigateTo - La fonction de navigation
 */
export function goToPhysical(navigateTo: NavigateFn) {
  navigateTo({
    state: { navigation: { tabs: { option: "physicalArchive" } } },
  });
}
