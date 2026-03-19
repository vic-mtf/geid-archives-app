import { Toolbar, Box as MuiBox, Divider, Typography } from "@mui/material";
import TreeArchiveManagementView from "./tree-data-view/TreeArchiveManagementView";
import SearchInput from "../../components/SearchInput";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../redux/store";
import TabsOption from "./tabs-option/TabsOption";
import NavigationMenuButton from "./NavigationMenuButton";
import CustomDrawer from "./CustomDrawer";
import { useCallback } from "react";
import { updateData } from "../../redux/data";

export default function RightNavigation() {
  const open = useSelector((store: RootState) => store.data.navigation.openRight);
  const dispatch = useDispatch<AppDispatch>();
  const handleClose = useCallback(() => {
    dispatch(updateData({ data: { navigation: { openRight: false } } }));
  }, [dispatch]);

  return (
    <CustomDrawer open={open} direction='right' onClose={handleClose}>
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
