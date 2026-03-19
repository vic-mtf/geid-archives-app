import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
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
    label: "Archivage",
    icon: AccountBalanceOutlinedIcon,
    id: "physicalArchive",
  },
  {
    label: "Gestion",
    icon: ManageHistoryIcon,
    id: "archiveManager",
  },
  {
    label: "Archives",
    icon: Inventory2OutlinedIcon,
    id: "archiveService",
  },
];

export default tabs;
