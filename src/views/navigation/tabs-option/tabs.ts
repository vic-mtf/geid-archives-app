import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

interface Tab {
  label: string;
  icon: ComponentType<SvgIconProps>;
  id: string;
}

const tabs: Tab[] = [
  {
    label: "Tableau de bord",
    icon: DashboardOutlinedIcon,
    id: "dashboard",
  },
  {
    label: "Archivage physique",
    icon: AccountBalanceOutlinedIcon,
    id: "physicalArchive",
  },
  {
    label: "Archives validées",
    icon: ManageHistoryIcon,
    id: "archiveManager",
  },
  {
    label: "À valider",
    icon: Inventory2OutlinedIcon,
    id: "archiveService",
  },
  {
    label: "Aide",
    icon: HelpOutlineOutlinedIcon,
    id: "help",
  },
];

export default tabs;
