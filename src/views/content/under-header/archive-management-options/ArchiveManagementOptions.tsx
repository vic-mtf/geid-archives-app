import React, { useMemo } from "react";
import { Button } from "@mui/material";
import managementOptions from "./managementOptions";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../redux/store";

export default function ArchiveManagementOptions() {
  const selectedElements = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );

  const activeState = useMemo(
    () => ({
      isOnly: selectedElements?.length === 1,
      isMultiple: selectedElements?.length > 1,
    }),
    [selectedElements]
  );

  const disabledElements = (keys: string[]) => !keys?.some((key) => activeState[key as keyof typeof activeState]);

  return (
    <>
      {managementOptions.map((option) => (
        <React.Fragment key={option.id}>
          {option.type === "button" && (
            <Button
              startIcon={React.createElement(option.icon)}
              onClick={option.action}
              color='inherit'
              sx={{ mr: 2 }}
              variant='outlined'
              disabled={disabledElements(option.activeKeys)}>
              {option.label}
            </Button>
          )}
        </React.Fragment>
      ))}
    </>
  );
}
