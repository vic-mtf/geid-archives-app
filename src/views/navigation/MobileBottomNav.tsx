import React, { useMemo, useCallback } from "react";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import tabs from "./tabs-option/tabs";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { updateData } from "@/redux/data";

export default function MobileBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const navigateTo = useNavigateSetState();
  const dispatch = useDispatch<AppDispatch>();

  const value = useMemo(
    () => location.state?.navigation?.tabs?.option,
    [location.state?.navigation?.tabs?.option]
  );

  const handleChange = useCallback(
    (_: React.SyntheticEvent, option: string) => {
      navigateTo({ state: { navigation: { tabs: { option } } } });
      // archiveManager → ouvre le sidebar (arbre), autres onglets → ferme
      dispatch(
        updateData({
          data: { navigation: { openLeft: option === "archiveManager" } },
        })
      );
    },
    [navigateTo, dispatch]
  );

  if (!isMobile) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: 1,
        borderColor: "divider",
      }}>
      <BottomNavigation value={value} onChange={handleChange} showLabels>
        {tabs.map(({ icon, label, id }) => (
          <BottomNavigationAction
            key={id}
            label={label}
            value={id}
            icon={React.createElement(icon, { fontSize: "small" })}
            sx={{
              minWidth: 0,
              "& .MuiBottomNavigationAction-label": {
                fontSize: "10px !important",
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
