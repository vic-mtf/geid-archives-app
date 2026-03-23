import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { ReactNode } from "react";

export const drawerWidth = 280;

interface CustomDrawerProps {
  direction?: "left" | "right";
  open?: boolean;
  children?: ReactNode;
  onClose?: () => void;
  /** Sur desktop, force l'ouverture permanente (sidebar principale uniquement) */
  alwaysOpenOnDesktop?: boolean;
}

export default function CustomDrawer({
  direction = "left",
  open = false,
  children = null,
  onClose,
  alwaysOpenOnDesktop = false,
}: CustomDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const actualOpen = !isMobile && alwaysOpenOnDesktop ? true : open;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={actualOpen}
      anchor={direction}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        // Réserve l'espace via CSS media query pour éviter le décalage au premier rendu
        width: alwaysOpenOnDesktop ? { xs: 0, md: drawerWidth } : 0,
        flexShrink: 0,
        transition: "none",
        "& .MuiDrawer-paper": {
          width: isMobile ? "100vw" : drawerWidth,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}>
      {children}
    </Drawer>
  );
}
