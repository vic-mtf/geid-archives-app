import React, { useCallback, useMemo, useRef } from "react";
import { TreeView } from "@mui/x-tree-view/TreeView";
import StyledTreeItem from "../../../components/StyledTreeItem";
import { Box as MuiBox, Typography } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { updateData } from "../../../redux/data";

interface TreeArchiveManagementViewProps {
  filter?: string;
}

export default function TreeArchiveManagementView({ filter = "" }: TreeArchiveManagementViewProps) {
  const docs = useSelector((store: RootState) => store.data.docs);
  const selected = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );
  const dispatch = useDispatch<AppDispatch>();
  const rootTreeViewRef = useRef<HTMLUListElement>(null);

  const filteredData = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return docs
      .map((doc) => ({ ...doc }))
      .filter(({ designation }) =>
        !term || (designation as string)?.toLowerCase().includes(term)
      );
  }, [docs, filter]);

  const onNodeSelect = useCallback(
    (event: React.SyntheticEvent, nodeId: string) => {
      event?.preventDefault();
      let selectedElements: (string | number)[];
      if ((event as React.MouseEvent).ctrlKey || (event as React.MouseEvent).altKey)
        selectedElements = selected.includes(nodeId)
          ? selected.filter((id) => id !== nodeId)
          : [...selected, nodeId];
      else selectedElements = [nodeId];
      dispatch(
        updateData({
          data: {
            navigation: {
              archiveManagement: { selectedElements },
            } as unknown as import("../../../types").NavigationState,
          },
        })
      );
    },
    [dispatch, selected]
  );

  if (filteredData.length === 0) {
    return (
      <MuiBox display="flex" justifyContent="center" alignItems="center" p={3}>
        <Typography variant="caption" color="text.disabled" textAlign="center">
          {filter ? `Aucun résultat pour "${filter}"` : "Aucun document disponible"}
        </Typography>
      </MuiBox>
    );
  }

  return (
    <MuiBox height="100%" overflow="hidden" display="flex" flexDirection="column">
      <TreeView
        aria-label="tree-archive-management-view"
        ref={rootTreeViewRef}
        onFocus={(event) => event.stopPropagation()}
        selected={selected as unknown as string}
        defaultEndIcon={<div style={{ width: 24 }} />}
        defaultCollapseIcon={<FolderOpenOutlinedIcon fontSize="small" />}
        defaultExpandIcon={<FolderOpenOutlinedIcon fontSize="small" />}
        onNodeSelect={onNodeSelect}
        onNodeFocus={(event) => event.preventDefault()}
        sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 2 }}>
        {filteredData.map(({ _id, designation }) => (
          <StyledTreeItem
            key={_id as string}
            nodeId={_id as string}
            labelText={designation as string}
            labelIcon={(props) => (
              <InsertDriveFileOutlinedIcon fontSize="small" {...props} />
            )}
          />
        ))}
      </TreeView>
    </MuiBox>
  );
}
