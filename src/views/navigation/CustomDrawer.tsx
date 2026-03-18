import { Drawer } from "@mui/material";
import { ReactNode } from "react";

export const drawerWidth = 350;

interface CustomDrawerProps {
  direction?: "left" | "right";
  open?: boolean;
  children?: ReactNode;
}

export default function CustomDrawer({
  direction = "left",
  open = false,
  children = null,
}: CustomDrawerProps) {
  return (
    <Drawer
      variant='persistent'
      open={open}
      anchor={direction}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "none",
          overflow: "hidden",
        },
      }}>
      {children}
    </Drawer>
  );
}
