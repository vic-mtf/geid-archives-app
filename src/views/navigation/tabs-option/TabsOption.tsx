import React, { useMemo } from "react";
import { List, ListItemButton, ListItemIcon, ListItemText, alpha, useTheme } from "@mui/material";
import { useLocation } from "react-router-dom";
import allTabs from "./tabs";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import useArchivePermissions from "@/hooks/useArchivePermissions";

export default function TabsOption() {
  const location = useLocation();
  const navigateTo = useNavigateSetState();
  const theme = useTheme();
  const { canWrite } = useArchivePermissions();

  const value = useMemo(
    () => location.state?.navigation?.tabs?.option,
    [location.state?.navigation?.tabs?.option]
  );

  // Filtrer les tabs selon les permissions
  const tabs = useMemo(
    () => allTabs.filter((tab) => !tab.requiresWrite || canWrite),
    [canWrite]
  );

  const handleChange = (option: string) => {
    navigateTo({ state: { navigation: { tabs: { option } } } });
  };

  return (
    <List sx={{ px: 1, py: 0.5 }}>
      {tabs.map(({ icon, label, id }) => {
        const isActive = value === id;
        return (
          <ListItemButton
            key={id}
            selected={isActive}
            onClick={() => handleChange(id)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 1,
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                },
              },
            }}>
            <ListItemIcon
              sx={{
                minWidth: 36,
                color: isActive ? "primary.main" : "text.secondary",
              }}>
              {React.createElement(icon, { fontSize: "small" })}
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "primary.main" : "text.primary",
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}
