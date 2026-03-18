import { Toolbar, Box as MuiBox, Divider, Typography } from "@mui/material";
import TreeArchiveManagementView from "./tree-data-view/TreeArchiveManagementView";
import SearchInput from "../../components/SearchInput";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import TabsOption from "./tabs-option/TabsOption";
import NavigationMenuButton from "./NavigationMenuButton";
import CustomDrawer from "./CustomDrawer";

export default function RightNavigation() {
  const open = useSelector((store: RootState) => store.data.navigation.openRight);

  return (
    <CustomDrawer open={open} direction='right'>
      <Toolbar variant='dense' />
      <Toolbar variant='dense'>
        <NavigationMenuButton direction='right' />
        <Typography fontWeight='bold'>Téléchargement</Typography>
      </Toolbar>
      <Divider />
      <MuiBox>
        <TabsOption />
        <Toolbar variant='dense'>
          <SearchInput />
        </Toolbar>
      </MuiBox>
      <Divider />
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
