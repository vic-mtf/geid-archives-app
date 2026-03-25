import React from "react";
import WarehouseOutlinedIcon  from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon        from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon      from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon     from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon      from "@mui/icons-material/TopicOutlined";
import i18n from "@/i18n/i18n";
import type { PhysicalLevel } from "@/constants/physical";

const levelConfigBase: Record<PhysicalLevel, { icon: React.ReactNode; labelKey: string; color: string }> = {
  container: { icon: <WarehouseOutlinedIcon />,    labelKey: "physical.levels.container", color: "#5C6BC0" },
  shelf:     { icon: <DnsOutlinedIcon />,          labelKey: "physical.levels.shelf",     color: "#26A69A" },
  floor:     { icon: <ViewStreamOutlinedIcon />,   labelKey: "physical.levels.floor",     color: "#42A5F5" },
  binder:    { icon: <StyleOutlinedIcon />,        labelKey: "physical.levels.binder",    color: "#FFA726" },
  record:    { icon: <FolderOutlinedIcon />,       labelKey: "physical.levels.record",    color: "#AB47BC" },
  document:  { icon: <TopicOutlinedIcon />,        labelKey: "physical.levels.document",  color: "#78909C" },
};

/** Proxy qui traduit dynamiquement les labels à chaque accès */
export const levelConfig: Record<PhysicalLevel, { icon: React.ReactNode; label: string; color: string }> = new Proxy(
  levelConfigBase as any,
  {
    get(target, prop: string) {
      const entry = target[prop];
      if (entry && entry.labelKey) {
        return { icon: entry.icon, label: i18n.t(entry.labelKey), color: entry.color };
      }
      return entry;
    },
  },
);
