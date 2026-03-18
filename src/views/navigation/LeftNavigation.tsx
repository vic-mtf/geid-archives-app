import { useEffect, useMemo } from "react";
import { Toolbar, Box as MuiBox } from "@mui/material";
import TreeArchiveManagementView from "./tree-data-view/TreeArchiveManagementView";
import SearchInput from "../../components/SearchInput";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import TabsOption from "./tabs-option/TabsOption";
import NavigationMenuButton from "./NavigationMenuButton";
import useNavigateSetState from "../../hooks/useNavigateSetState";
import { useLocation } from "react-router-dom";
import CustomDrawer from "./CustomDrawer";
import { Typography } from "@mui/material";

export default function LeftNavigation() {
  const open = useSelector((store: RootState) => store.data.navigation.openLeft);
  const auth = useSelector((store: RootState) => (store.user as Record<string, unknown>).auth as Record<string, unknown>);
  const location = useLocation();
  const navigateTo = useNavigateSetState();
  const optionIsNull = useMemo(
    () => [null, undefined].includes(location.state?.navigation?.tabs?.option),
    [location.state?.navigation?.tabs?.option]
  );

  useEffect(() => {
    if (optionIsNull) {
      const archiveApp = (auth as { privileges?: Array<{ app: string; permissions: Array<{ access: string }> }> })?.privileges?.find(({ app }) => app === "archives");
      const isWritten = archiveApp?.permissions.find(
        ({ access }) => access === "write"
      );
      if (isWritten)
        navigateTo({
          state: { navigation: { tabs: { option: "archiveManager" } } },
        });
    }
  }, [auth, navigateTo, optionIsNull]);

  return (
    <CustomDrawer open={open}>
      <Toolbar variant='dense' />
      <Toolbar>
        <NavigationMenuButton />
        <Typography fontWeight='bold'>Fichiers</Typography>
      </Toolbar>
      <MuiBox>
        <TabsOption />
        <Toolbar>
          <SearchInput />
        </Toolbar>
      </MuiBox>

      <MuiBox
        overflow='hidden'
        display='flex'
        flexGrow={1}
        flexDirection='column'>
        <TreeArchiveManagementView />
      </MuiBox>
    </CustomDrawer>
  );
}
