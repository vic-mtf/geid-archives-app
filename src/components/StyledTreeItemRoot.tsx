import { styled, alpha } from "@mui/material";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    borderRadius: theme.spacing(0, 0.5, 0.5, 0),
    fontWeight: theme.typography.fontWeightMedium,
    "&.Mui-expanded": {
      fontWeight: theme.typography.fontWeightRegular,
    },
    "&.Mui-selected": {
      backgroundColor: `var(--tree-view-bg-color, ${alpha(
        theme.palette.primary.main,
        theme.palette.action.selectedOpacity
      )})`,
      color: "var(--tree-view-color)",
      borderLeft: `2px solid ${theme.palette.primary.main}`,
    },
    "&.Mui-selected.Mui-focused": {
      backgroundColor: `var(--tree-view-bg-color, ${alpha(
        theme.palette.primary.main,
        theme.palette.action.activatedOpacity
      )})`,
    },
    "&.Mui-focused": {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: "var(--tree-view-color)",
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: "inherit",
      color: "inherit",
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 15,
    borderLeft: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2),
    },
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    "& .close": {
      opacity: 0.3,
    },
  },
}));

export default StyledTreeItemRoot;
