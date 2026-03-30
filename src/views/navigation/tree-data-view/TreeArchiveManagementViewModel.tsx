import { useMemo, useRef } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { TreeView } from "@mui/x-tree-view/TreeView";
import StyledTreeItem from "@/components/StyledTreeItem";
// import useDate from '../../../data/useData';
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import scrollBarSx from "@/utils/scrollBarSx";
import { SvgIconProps } from "@mui/material";

interface TreeFolderDataItem {
  folder?: boolean;
  _id?: string;
  designation?: string;
  [key: string]: unknown;
}

interface TreeFolderDataProps {
  nodeId?: string;
  labelText?: string;
  data?: TreeFolderDataItem[];
}

export default function TreeArchiveManagementViewModel() {
  const docs = useSelector((store: RootState) => store.data.docs);
  const apiRef = useRef<unknown>(null);
  const data = useMemo(
    () =>
      docs.map((doc) => {
        // const folder =  data.older;
        return {
          ...doc,
        };
      }),
    [docs]
  );

  return (
    <TreeView
      aria-label='data'
      defaultExpanded={[]}
      defaultCollapseIcon={<ArrowDropDownIcon />}
      defaultExpandIcon={<ArrowRightIcon />}
      defaultEndIcon={<div style={{ width: 24 }} />}
      {...({ apiRef } as unknown as object)}
      multiSelect
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        ...scrollBarSx,
      }}>
      {data.map((data) =>
        !data.folder ? (
          <TreeFolderData
            nodeId={data?._id as string}
            labelText={data.designation as string}
            key={data?._id as string}
          />
        ) : (
          <StyledTreeItem
            nodeId={data?._id as string}
            labelText={data.designation as string}
            labelIcon={(props: SvgIconProps) => (
              <InsertDriveFileOutlinedIcon fontSize='small' {...props} />
            )}
            key={data?._id as string}
          />
        )
      )}
    </TreeView>
  );
}

const TreeFolderData = ({ nodeId = "0", labelText, data = [] }: TreeFolderDataProps) => {
  return (
    <StyledTreeItem
      labelText={labelText}
      labelIcon={(props: SvgIconProps) => <FolderRoundedIcon fontSize='small' {...props} />}
      nodeId={nodeId}>
      {data.map((data, index) =>
        data.folder ? (
          <TreeFolderData
            nodeId={`${nodeId}${index}`}
            labelText={data.designation}
            key={index}
          />
        ) : (
          <StyledTreeItem
            nodeId={`${nodeId}${index}`}
            labelText={data.designation as string}
            labelIcon={(props: SvgIconProps) => (
              <InsertDriveFileOutlinedIcon fontSize='small' {...props} />
            )}
            key={index}
          />
        )
      )}
    </StyledTreeItem>
  );
};
