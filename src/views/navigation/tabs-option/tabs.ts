import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

interface Tab {
  label: string;
  icon: ComponentType<SvgIconProps>;
  id: string;
}

const tabs: Tab[] = [
  {
    label: "Gestion d'archivages",
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
