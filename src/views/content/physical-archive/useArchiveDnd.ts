/**
 * useArchiveDnd — Hook pour le drag & drop d'archives entre documents.
 *
 * Au drop, affiche une confirmation avant de déplacer.
 * Le drag n'est actif que si l'utilisateur a les droits d'écriture.
 */

import { useCallback, useState } from "react";
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

/** État de la confirmation de déplacement */
export interface MoveConfirmState {
  archiveId: string;
  archiveLabel: string;
  documentId: string;
  documentLabel: string;
  recordId?: string;
}

export default function useArchiveDnd({ canWrite, executeFetch }: UseArchiveDndOptions) {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch<AppDispatch>();
  const [moveConfirm, setMoveConfirm] = useState<MoveConfirmState | null>(null);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (!canWrite) return;

    const { active, over } = event;
    if (!over) return;

    const dragData = active.data.current as ArchiveDragData | undefined;
    const dropData = over.data.current as DocumentDropData | undefined;

    if (!dragData || dragData.type !== "archive") return;
    if (!dropData || dropData.type !== "document") return;

    // Ouvrir la confirmation
    setMoveConfirm({
      archiveId: dragData.archiveId,
      archiveLabel: dragData.archiveLabel,
      documentId: dropData.documentId,
      documentLabel: dropData.documentLabel,
      recordId: dropData.recordId,
    });
  }, [canWrite]);

  const confirmMove = useCallback(async () => {
    if (!moveConfirm) return;
    try {
      await executeFetch({
        url: `/api/stuff/archives/${moveConfirm.archiveId}`,
        method: "PUT",
        data: {
          document: moveConfirm.documentId,
          record: moveConfirm.recordId ?? null,
        },
      });
      dispatch(incrementVersion());
      enqueueSnackbar(
        `L'archive « ${moveConfirm.archiveLabel} » a été déplacée vers le document « ${moveConfirm.documentLabel} ».`,
        { variant: "success" }
      );
    } catch {
      enqueueSnackbar(
        "Le déplacement a échoué. Vérifiez vos droits et réessayez.",
        { variant: "error" }
      );
    } finally {
      setMoveConfirm(null);
    }
  }, [moveConfirm, executeFetch, dispatch, enqueueSnackbar]);

  const cancelMove = useCallback(() => setMoveConfirm(null), []);

  return { handleDragEnd, moveConfirm, confirmMove, cancelMove };
}
