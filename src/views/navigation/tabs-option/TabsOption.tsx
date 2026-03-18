import React, { useMemo } from "react";
import { BottomNavigationAction, BottomNavigation } from "@mui/material";
import { useLocation } from "react-router-dom";
import tabs from "./tabs";
import useNavigateSetState from "../../../hooks/useNavigateSetState";

export default function TabsOption() {
  const location = useLocation();
  const navigateTo = useNavigateSetState();

  const value = useMemo(
    () => location.state?.navigation?.tabs?.option,
    [location.state?.navigation?.tabs?.option]
  );

  const handleChange = (_event: React.SyntheticEvent, option: string) => {
    _event?.preventDefault();
    navigateTo({
      state: { navigation: { tabs: { option } } },
    });
  };

  return (
    <BottomNavigation
      sx={{ width: "100%", bgcolor: "background.default" }}
      value={value}
      onChange={handleChange}>
      {tabs.map(({ icon, label, id }) => (
        <BottomNavigationAction
          icon={React.createElement(icon)}
          value={id}
          key={id}
          label={label}
          showLabel
          sx={{
            textTransform: "none",
            "& span": {
              fontSize: "10.5px!important",
            },
          }}
        />
      ))}
    </BottomNavigation>
  );
}
