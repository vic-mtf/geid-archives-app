/**
 * useHighlightElement — Flash visuel + scroll vers un élément après navigation.
 *
 * Quand un `targetId` est défini :
 * 1. Attend que l'élément soit rendu dans le DOM (polling avec MutationObserver)
 * 2. Scroll vers l'élément (smooth)
 * 3. Applique un flash jaune qui s'estompe (animation CSS)
 *
 * Fonctionne avec :
 * - Les lignes du DataGrid (data-id="xxx")
 * - Les items de liste (data-highlight-id="xxx")
 * - N'importe quel élément avec l'attribut data-highlight-id
 */

import { useEffect, useRef } from "react";

/** Durée du flash en ms */
const FLASH_DURATION = 2000;

/** Classe CSS du flash — injectée une fois dans le head */
const FLASH_CLASS = "geid-highlight-flash";

// Injecter le keyframe CSS une seule fois
if (typeof document !== "undefined" && !document.getElementById("geid-highlight-style")) {
  const style = document.createElement("style");
  style.id = "geid-highlight-style";
  style.textContent = `
    @keyframes geidFlash {
      0%   { background-color: rgba(255, 193, 7, 0.5); }
      50%  { background-color: rgba(255, 193, 7, 0.25); }
      100% { background-color: transparent; }
    }
    .${FLASH_CLASS} {
      animation: geidFlash ${FLASH_DURATION}ms ease-out forwards;
    }
  `;
  document.head.appendChild(style);
}

/**
 * @param targetId - L'ID de l'élément à flasher et scroller vers.
 *                   null = rien à faire.
 * @param containerRef - Ref du conteneur scrollable (optionnel, défaut = document)
 */
export default function useHighlightElement(
  targetId: string | null | undefined,
  containerRef?: React.RefObject<HTMLElement>,
) {
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId || targetId === processedRef.current) return;

    // Chercher l'élément dans le DOM — il peut ne pas être rendu encore
    const findAndHighlight = () => {
      // Chercher par data-highlight-id ou data-id (DataGrid)
      const el =
        document.querySelector(`[data-highlight-id="${targetId}"]`) ??
        document.querySelector(`[data-id="${targetId}"]`);

      if (!el) return false;

      // Scroll vers l'élément
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // Flash
      el.classList.remove(FLASH_CLASS);
      // Force reflow pour redémarrer l'animation
      void (el as HTMLElement).offsetWidth;
      el.classList.add(FLASH_CLASS);

      // Nettoyer après l'animation
      setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_DURATION + 100);

      processedRef.current = targetId;
      return true;
    };

    // Essayer immédiatement
    if (findAndHighlight()) return;

    // Si pas trouvé, observer les mutations du DOM (l'élément n'est pas encore rendu)
    const container = containerRef?.current ?? document.body;
    const observer = new MutationObserver(() => {
      if (findAndHighlight()) {
        observer.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    // Timeout de sécurité (5 secondes max)
    const timeout = setTimeout(() => {
      observer.disconnect();
    }, 5000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [targetId, containerRef]);

  // Reset quand targetId change à null
  useEffect(() => {
    if (!targetId) processedRef.current = null;
  }, [targetId]);
}
