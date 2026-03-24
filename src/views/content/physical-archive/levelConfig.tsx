import React from "react";
import WarehouseOutlinedIcon  from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon        from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon      from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon     from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon      from "@mui/icons-material/TopicOutlined";
import type { PhysicalLevel } from "@/constants/physical";

export const levelConfig: Record<PhysicalLevel, { icon: React.ReactNode; label: string; color: string }> = {
  container: { icon: <WarehouseOutlinedIcon />,    label: "Conteneur", color: "#5C6BC0" },
  shelf:     { icon: <DnsOutlinedIcon />,          label: "Étagère",   color: "#26A69A" },
  floor:     { icon: <ViewStreamOutlinedIcon />,   label: "Niveau",    color: "#42A5F5" },
  binder:    { icon: <StyleOutlinedIcon />,        label: "Classeur",  color: "#FFA726" },
  record:    { icon: <FolderOutlinedIcon />,       label: "Dossier",   color: "#AB47BC" },
  document:  { icon: <TopicOutlinedIcon />,        label: "Document",  color: "#78909C" },
};
