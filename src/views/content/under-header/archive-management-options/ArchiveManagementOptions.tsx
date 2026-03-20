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

  const selectedDoc = useSelector((store: RootState) => {
    const id = store.data.navigation.archiveManagement.selectedElements[0];
    return id ? store.data.docs.find((d) => d._id === id || d.id === id) : undefined;
  });

  const selectedStatus = (selectedDoc as Record<string, unknown> | undefined)?.status as string | undefined;

  const activeState = useMemo(
    () => ({
      isOnly:          selectedElements?.length === 1,
      isMultiple:      selectedElements?.length > 1,
      // Statuts courants (nouveau cycle de vie)
      isPending:       selectedStatus === "pending" || (!selectedStatus && selectedDoc && !(selectedDoc as Record<string, unknown>).validated),
      isActif:         selectedStatus === "actif"         || selectedStatus === "validated",
      isIntermédiaire: selectedStatus === "intermédiaire" || selectedStatus === "archived",
      isHistorique:    selectedStatus === "historique",
      isDétruit:       selectedStatus === "détruit"       || selectedStatus === "disposed",
      // isEliminable : peut être éliminé (intermédiaire ou historique)
      isEliminable:
        selectedStatus === "intermédiaire" ||
        selectedStatus === "historique"    ||
        selectedStatus === "archived",
    }),
    [selectedElements, selectedStatus, selectedDoc]
  );

  const isDisabled = (option: typeof managementOptions[0]) => {
    return !option.activeKeys.some((key) => activeState[key as keyof typeof activeState]);
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
              color={option.id === "to-detruit" ? "error" : "inherit"}
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
