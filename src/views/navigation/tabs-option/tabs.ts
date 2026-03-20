import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
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
    label: "Aide",
    icon: HelpOutlineOutlinedIcon,
    id: "help",
  },
];

export default tabs;
