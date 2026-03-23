import { Toolbar } from "@mui/material";
import headers from "./headers";
import NavigationMenuButton from "@/views/navigation/NavigationMenuButton";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export default function UnderHeader() {
  const location = useLocation();
  const option = useMemo(
    () => location.state?.navigation?.tabs?.option,
    [location.state?.navigation?.tabs?.option]
  );
  const Options = useMemo(() => headers[option], [option]);

  return (
    <>
      {Options && (
        <Toolbar>
          <NavigationMenuButton
            hide
            IconProps={{ sx: { transform: "rotate(-180deg)" } }}
          />
          <Options />
        </Toolbar>
      )}
    </>
  );
}
