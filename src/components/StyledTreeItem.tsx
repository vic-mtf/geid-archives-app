import React from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import StyledTreeItemRoot from "./StyledTreeItemRoot";
import { TreeItemProps } from "@mui/x-tree-view/TreeItem";

interface StyledTreeItemProps extends Omit<TreeItemProps, "label"> {
  bgColor?: string;
  color?: string;
  labelIcon?: React.ElementType;
  labelInfo?: string;
  labelText?: string;
  colorForDarkMode?: string;
  bgColorForDarkMode?: string;
}

const StyledTree = (
  {
    bgColor,
    color,
    labelIcon: LabelIcon,
    labelInfo,
    labelText,
    colorForDarkMode,
    bgColorForDarkMode,
    ...other
  }: StyledTreeItemProps,
  ref: React.Ref<HTMLLIElement>
) => {
  const theme = useTheme();

  return (
    <StyledTreeItemRoot
      style={
        {
          "--tree-view-color":
            theme.palette.mode !== "dark" ? color : colorForDarkMode,
          "--tree-view-bg-color":
            theme.palette.mode !== "dark" ? bgColor : bgColorForDarkMode,
        } as React.CSSProperties
      }
      label={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 0.5,
            pr: 0,
          }}>
          {LabelIcon && <Box component={LabelIcon} color="inherit" sx={{ mr: 1 }} />}
          <Typography sx={{ fontWeight: "inherit", flexGrow: 1 }}>
            {labelText}
          </Typography>
          <Typography variant="caption" color="inherit">
            {labelInfo}
          </Typography>
        </Box>
      }
      {...other}
      ref={ref}
    />
  );
};

const StyledTreeItem = React.forwardRef(StyledTree);
export default StyledTreeItem;
