import React, { useCallback, useMemo, useRef } from "react";
import { TreeView } from "@mui/x-tree-view/TreeView";
import StyledTreeItem from "../../../components/StyledTreeItem";
import { Box as MuiBox } from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { updateData } from "../../../redux/data";

export default function TreeArchiveManagementView() {
  const docs = useSelector((store: RootState) => store.data.docs);
  const data = useMemo(
    () =>
      docs.map((doc) => {
        return { ...doc };
      }),
    [docs]
  );
  const selected = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );
  const dispatch = useDispatch<AppDispatch>();
  const rootTreeViewRef = useRef<HTMLUListElement>(null);

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

  return (
    <MuiBox maxHeight='100%' overflow='hidden'>
      <TreeView
        aria-label='tree-archive-management-view'
        ref={rootTreeViewRef}
        onFocus={(event) => event.stopPropagation()}
        selected={selected as unknown as string}
        defaultEndIcon={<div style={{ width: 24 }} />}
        onNodeSelect={onNodeSelect}
        onNodeFocus={(event) => event.preventDefault()}
        sx={{ flexGrow: 1, overflowY: "auto" }}>
        {data.map(({ _id, designation }) => (
          <StyledTreeItem
            key={_id as string}
            nodeId={_id as string}
            labelText={designation as string}
            labelIcon={(props) => (
              <InsertDriveFileOutlinedIcon fontSize='small' {...props} />
            )}
          />
        ))}
      </TreeView>
    </MuiBox>
  );
}
