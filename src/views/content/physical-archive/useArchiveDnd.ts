/**
 * useArchiveDnd — Hook pour le drag & drop d'archives entre documents.
 *
 * Gère le déplacement d'une archive numérique d'un document vers un autre
 * via l'API PUT /api/stuff/archives/:id.
 * Le drag n'est actif que si l'utilisateur a les droits d'écriture.
 */

import { useCallback } from "react";
import { useSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion } from "@/redux/data";
import type { DragEndEvent } from "@dnd-kit/core";

interface UseArchiveDndOptions {
  headers: Record<string, string>;
  canWrite: boolean;
  executeFetch: (config: { url: string; method?: string; data?: Record<string, unknown> }) => Promise<{ data: unknown }>;
}

/** Type pour les données de drag */
export interface ArchiveDragData {
  type: "archive";
  archiveId: string;
  archiveLabel: string;
}

/** Type pour les données de drop (document cible) */
export interface DocumentDropData {
  type: "document";
  documentId: string;
  documentLabel: string;
  recordId?: string;
}

export default function useArchiveDnd({ canWrite, executeFetch }: UseArchiveDndOptions) {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch<AppDispatch>();

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!canWrite) return;

    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as ArchiveDragData | undefined;
    const dropData = over.data.current as DocumentDropData | undefined;

    if (!dragData || dragData.type !== "archive") return;
    if (!dropData || dropData.type !== "document") return;

    // Ne pas déplacer si on drop sur le même document parent
    // (géré côté UI — pas de drop zone sur le parent actuel)

    try {
      await executeFetch({
        url: `/api/stuff/archives/${dragData.archiveId}`,
        method: "PUT",
        data: {
          document: dropData.documentId,
          record: dropData.recordId ?? null,
        },
      });
      dispatch(incrementVersion());
      enqueueSnackbar(
        `L'archive « ${dragData.archiveLabel} » a été déplacée vers le document « ${dropData.documentLabel} ».`,
        { variant: "success" }
      );
    } catch {
      enqueueSnackbar(
        "Le déplacement a échoué. Vérifiez vos droits et réessayez.",
        { variant: "error" }
      );
    }
  }, [canWrite, executeFetch, dispatch, enqueueSnackbar]);

  return { handleDragEnd };
}
