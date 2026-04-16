import React, { useMemo } from "react";
import { Button } from "@mui/material";
import managementOptions from "./managementOptions";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import useArchivePermissions from "@/hooks/useArchivePermissions";

export default function ArchiveManagementOptions() {
  const { canWrite, isAdmin } = useArchivePermissions();

  const selectedElements = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );

  const selectedDoc = useSelector((store: RootState) => {
    const id = store.data.navigation.archiveManagement.selectedElements[0];
    return id ? store.data.docs.find((d) => d._id === id || d.id === id) : undefined;
  });

  const s = (selectedDoc as Record<string, unknown> | undefined)?.status as string | undefined;

  const activeState = useMemo(
    () => ({
      isOnly:     selectedElements?.length === 1,
      isMultiple: selectedElements?.length > 1,

      isPending:   s === "PENDING"   || s === "pending",
      isActive:    s === "ACTIVE"    || s === "validated" || s === "actif",
      isSemiActive:s === "SEMI_ACTIVE"|| s === "archived" || s === "intermédiaire",
      isActiveOrSemi: s === "ACTIVE" || s === "validated" || s === "actif"
        || s === "SEMI_ACTIVE" || s === "archived" || s === "intermédiaire",
      isPermanent: s === "PERMANENT" || s === "historique",
      isDestroyed: s === "DESTROYED" || s === "disposed"  || s === "détruit",

      // Can be eliminated: SEMI_ACTIVE or PERMANENT
      isEliminable:
        s === "SEMI_ACTIVE" || s === "PERMANENT" ||
        s === "archived"    || s === "historique" || s === "intermédiaire",

      // No status yet (legacy doc without status field)
      ...(s === undefined && selectedDoc
        ? {
            isPending: !(selectedDoc as Record<string, unknown>).validated,
            isActive:   !!(selectedDoc as Record<string, unknown>).validated,
          }
        : {}),
    }),
    [selectedElements, s, selectedDoc]
  );

  const isDisabled = (option: typeof managementOptions[0]) =>
    !option.activeKeys.some((key) => activeState[key as keyof typeof activeState]);

  const isVisible = (option: typeof managementOptions[0]) => {
    if (option.requiresAdmin && !isAdmin) return false;
    if (option.requiresWrite && !canWrite) return false;
    return true;
  };

  return (
    <>
      {managementOptions.filter(isVisible).map((option) => (
        <React.Fragment key={option.id}>
          {option.type === "button" && (
            <Button
              startIcon={React.createElement(option.icon)}
              onClick={option.action}
              color={option.id === "to-destroyed" ? "error" : "inherit"}
              sx={{ mr: 1 }}
              variant="outlined"
              size="small"
              disabled={isDisabled(option)}
            >
              {option.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
