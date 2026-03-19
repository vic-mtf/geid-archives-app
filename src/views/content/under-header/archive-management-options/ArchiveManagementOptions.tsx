import React, { useMemo } from "react";
import { Button } from "@mui/material";
import managementOptions from "./managementOptions";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../redux/store";
import useArchivePermissions from "../../../../hooks/useArchivePermissions";

export default function ArchiveManagementOptions() {
  const { canWrite, isAdmin } = useArchivePermissions();

  const selectedElements = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );

  // Récupère le statut du document sélectionné pour activer/désactiver les boutons lifecycle
  const selectedDoc = useSelector((store: RootState) => {
    const id = store.data.navigation.archiveManagement.selectedElements[0];
    return id ? store.data.docs.find((d) => d._id === id || d.id === id) : undefined;
  });

  const selectedStatus = (selectedDoc as Record<string, unknown> | undefined)?.status as string | undefined;

  const activeState = useMemo(
    () => ({
      isOnly:     selectedElements?.length === 1,
      isMultiple: selectedElements?.length > 1,
      // Actif selon le statut du document sélectionné
      isPending:   selectedStatus === "pending" || (!selectedStatus && selectedDoc && !(selectedDoc as Record<string, unknown>).validated),
      isValidated: selectedStatus === "validated" || (!selectedStatus && !!(selectedDoc as Record<string, unknown> | undefined)?.validated),
      isArchived:  selectedStatus === "archived",
    }),
    [selectedElements, selectedStatus, selectedDoc]
  );

  const isDisabled = (option: typeof managementOptions[0]) => {
    // Bouton désactivé si aucune clé active n'est vraie
    if (!option.activeKeys.some((key) => activeState[key as keyof typeof activeState])) return true;

    // Désactiver Archiver si le doc est déjà archivé
    if (option.id === "archive" && activeState.isArchived) return true;

    // Désactiver Rouvrir si le doc est déjà pending
    if (option.id === "reopen" && activeState.isPending) return true;

    return false;
  };

  const isVisible = (option: typeof managementOptions[0]) => {
    if (option.requiresAdmin && !isAdmin) return false;
    if (option.requiresWrite && !canWrite) return false;
    return true;
  };

  const visibleOptions = managementOptions.filter(isVisible);

  return (
    <>
      {visibleOptions.map((option) => (
        <React.Fragment key={option.id}>
          {option.type === "button" && (
            <Button
              startIcon={React.createElement(option.icon)}
              onClick={option.action}
              color="inherit"
              sx={{ mr: 1 }}
              variant="outlined"
              size="small"
              disabled={isDisabled(option)}>
              {option.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
