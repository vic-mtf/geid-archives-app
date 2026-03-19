import { useEffect, useMemo, useCallback, useState } from "react";
import {
  Toolbar,
  Box as MuiBox,
  Divider,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import TreeArchiveManagementView from "./tree-data-view/TreeArchiveManagementView";
import SearchInput from "../../components/SearchInput";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../redux/store";
import TabsOption from "./tabs-option/TabsOption";
import useNavigateSetState from "../../hooks/useNavigateSetState";
import { useLocation } from "react-router-dom";
import CustomDrawer from "./CustomDrawer";
import { updateData } from "../../redux/data";

// Aucun onglet n'utilise plus l'arbre — archiveManager utilise désormais le DataGrid inline
const TREE_TABS = new Set<string>();

export default function LeftNavigation() {
  const open = useSelector((store: RootState) => store.data.navigation.openLeft);
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigateTo = useNavigateSetState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchTerm, setSearchTerm] = useState("");

  const handleClose = useCallback(() => {
    dispatch(updateData({ data: { navigation: { openLeft: false } } }));
  }, [dispatch]);

  const option = useMemo(
    () => location.state?.navigation?.tabs?.option as string | undefined,
    [location.state?.navigation?.tabs?.option]
  );
  const optionIsNull = useMemo(() => option == null, [option]);
  const showTree = useMemo(() => TREE_TABS.has(option ?? ""), [option]);

  // Onglet par défaut : tableau de bord
  useEffect(() => {
    if (optionIsNull) {
      navigateTo({ state: { navigation: { tabs: { option: "dashboard" } } } });
    }
  }, [optionIsNull, navigateTo]);

  // Réinitialiser la recherche au changement d'onglet
  useEffect(() => {
    setSearchTerm("");
  }, [option]);

  return (
    <CustomDrawer open={open} onClose={handleClose} alwaysOpenOnDesktop>
      {/* Espace sous le header fixe */}
      <Toolbar variant="dense" />

      {/* En-tête : titre + bouton fermeture (mobile uniquement) */}
      <MuiBox
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1.5}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          letterSpacing={1.2}
          textTransform="uppercase">
          Navigation
        </Typography>
        {isMobile && (
          <IconButton onClick={handleClose} size="small" edge="end">
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </MuiBox>

      {/* Items de navigation */}
      <TabsOption />
      <Divider sx={{ mx: 1, my: 0.5 }} />

      {/* Arbre de gestion + recherche (onglet archiveManager uniquement) */}
      {showTree && (
        <>
          <MuiBox px={1.5} pt={1} pb={1}>
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
            />
          </MuiBox>
          <MuiBox overflow="hidden" display="flex" flexGrow={1} flexDirection="column">
            <TreeArchiveManagementView filter={searchTerm} />
          </MuiBox>
        </>
      )}
    </CustomDrawer>
  );
}
