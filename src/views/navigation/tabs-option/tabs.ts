import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

export interface Tab {
  label: string;
  icon: ComponentType<SvgIconProps>;
  id: string;
  /** Si true, le tab ne s'affiche que si l'utilisateur a les droits */
  requiresWrite?: boolean;
}

const tabs: Tab[] = [
  {
    label: "Tableau de bord",
    icon: DashboardOutlinedIcon,
    id: "dashboard",
  },
  {
    label: "Archives",
    icon: ManageHistoryIcon,
    id: "archiveManager",
  },
  {
    label: "Archivage physique",
    icon: InventoryRoundedIcon,
    id: "physicalArchive",
  },
  {
    label: "Utilisateurs",
    icon: PeopleOutlineRoundedIcon,
    id: "userManagement",
    requiresWrite: true,
  },
  {
    label: "Paramètres",
    icon: SettingsOutlinedIcon,
    id: "settings",
  },
  {
    label: "Aide",
    icon: HelpOutlineOutlinedIcon,
    id: "help",
  },
];

export default tabs;
