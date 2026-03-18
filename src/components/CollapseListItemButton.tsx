import * as React from "react";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";

interface CollapseListItemButtonProps {
  startOpenIcon?: React.ReactElement;
  startCloseIcon?: React.ReactElement;
  endOpenIcon?: React.ReactElement;
  endCloseIcon?: React.ReactElement;
  getPrimaryText?: ((open: boolean) => React.ReactNode) | null;
  getButtonChildren?: ((open: boolean) => React.ReactNode) | null;
  children?: React.ReactNode;
}

export default function CollapseListItemButton({
  startOpenIcon = React.createElement(RemoveOutlinedIcon),
  startCloseIcon = React.createElement(AddCircleOutlineOutlinedIcon),
  endOpenIcon = React.createElement(ExpandLess),
  endCloseIcon = React.createElement(ExpandMore),
  getPrimaryText = null,
  getButtonChildren = null,
  children,
}: CollapseListItemButtonProps) {
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItemButton onClick={handleClick}>
        {typeof getButtonChildren === "function" ? (
          getButtonChildren(open)
        ) : (
          <>
            <ListItemIcon>{open ? startOpenIcon : startCloseIcon}</ListItemIcon>
            <ListItemText
              primary={
                typeof getPrimaryText === "function"
                  ? getPrimaryText(open)
                  : null
              }
            />
            {open ? endOpenIcon : endCloseIcon}
          </>
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
    </>
  );
}
