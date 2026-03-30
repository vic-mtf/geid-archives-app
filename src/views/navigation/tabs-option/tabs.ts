import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
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
    label: "Élimination",
    icon: GavelOutlinedIcon,
    id: "elimination",
    requiresWrite: true,
  },
  {
    label: "Archivage physique",
    icon: InventoryOutlinedIcon,
    id: "physicalArchive",
  },
  {
    label: "Utilisateurs",
    icon: PeopleOutlineOutlinedIcon,
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
