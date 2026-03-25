import React from "react";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import type { PhysicalLevel } from "@/constants/physical";
import { UPDATE_ENDPOINTS, RENAME_FIELD } from "@/constants/physical";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { incrementVersion, invalidateCache as invalidateCacheAction } from "@/redux/data";
import { levelConfig } from "./levelConfig";
import PhysicalTreeView from "./PhysicalTreeView";
import type { BreadcrumbItem } from "./BreadcrumbBar";
import type { ContextMenuState } from "./PhysicalContextMenu";
import useAxios from "@/hooks/useAxios";

interface SidebarTreeProps {
  headers: Record<string, string>;
  parentId: string | undefined;
  breadcrumb: BreadcrumbItem[];
  dataVersion: number;
  canWrite: boolean;
  renamingId: string | null;
  width?: number;
  onSetFormOpen: (level: PhysicalLevel, parentId?: string, parentLevel?: PhysicalLevel) => void;
  onNavigateFromTree: (path: Array<{ id: string; label: string; level: PhysicalLevel }>) => void;
  onContextMenu: (state: ContextMenuState) => void;
  onArchiveContextMenu: (e: React.MouseEvent, archiveId: string, label: string) => void;
  onRenamingEnd: () => void;
  setBreadcrumb: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>;
  executeFetch: (config: { url: string; method?: string; data?: Record<string, unknown> }) => Promise<{ data: unknown }>;
}

const SidebarTree = React.memo(function SidebarTree({
  headers,
  parentId,
  breadcrumb,
  dataVersion,
  canWrite,
  renamingId,
  onSetFormOpen,
  onNavigateFromTree,
  onContextMenu,
  onArchiveContextMenu,
  onRenamingEnd,
  setBreadcrumb,
  executeFetch,
}: SidebarTreeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();

  // Charger la liste des conteneurs pour le sélecteur
  const apiCache = useSelector((store: RootState) => (store.data as unknown as Record<string, unknown>).apiCache as Record<string, { data: unknown }> | undefined);
  const containersUrl = "/api/stuff/archives/physical/containers";
  const cachedContainers = apiCache?.[containersUrl]?.data as Array<{ _id: string; name: string }> | undefined;

  const [{ data: fetchedContainers }] = useAxios<Array<{ _id: string; name: string }>>(
    { url: containersUrl, headers },
    { manual: !!cachedContainers }
  );
  const containers = cachedContainers ?? fetchedContainers ?? [];

  // Conteneur actif = premier élément du breadcrumb
  const activeContainerId = breadcrumb.length > 0 ? breadcrumb[0].id : "";

  const handleContainerChange = (containerId: string) => {
    const container = containers.find((c) => c._id === containerId);
    if (container) {
      onNavigateFromTree([{ id: container._id, label: container.name, level: "container" }]);
    }
  };

  return (
    <Box sx={{
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      overflow: "hidden",
      minWidth: 0,
    }}>
      {/* Header style GitHub — sélecteur de conteneur + bouton créer */}
      <Box px={1} borderBottom={1} borderColor="divider" bgcolor="action.hover" display="flex" alignItems="center" gap={0.5} minHeight={42}>
        <WarehouseOutlinedIcon sx={{ fontSize: 16, color: levelConfig.container.color, flexShrink: 0 }} />
        <Select
          value={activeContainerId}
          onChange={(e) => handleContainerChange(e.target.value)}
          size="small"
          variant="outlined"
          displayEmpty
          renderValue={(val) => {
            if (!val) return <Typography variant="caption" color="text.secondary">{t("physical.containerPlaceholder")}</Typography>;
            const c = containers.find((c) => c._id === val);
            return <Typography variant="caption" fontWeight={600} noWrap>{c?.name ?? val}</Typography>;
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            "& .MuiSelect-select": { py: 0.5, px: 1, fontSize: "0.8rem" },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
          }}
        >
          {containers.map((c) => (
            <MenuItem key={c._id} value={c._id} sx={{ fontSize: "0.8rem" }}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
        {canWrite && (
          <Tooltip title={t("physical.newContainer")}>
            <IconButton size="small" onClick={() => onSetFormOpen("container")}>
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Tree — affiche uniquement le conteneur actif */}
      <PhysicalTreeView
        headers={headers}
        selectedId={parentId ?? null}
        expandedIds={breadcrumb.map((b) => b.id)}
        activeContainerId={activeContainerId || undefined}
        onSelect={onNavigateFromTree}
        dataVersion={dataVersion}
        canWrite={canWrite}
        onContextMenu={(e, id, label, level) => {
          e.preventDefault();
          onContextMenu({ mouseX: e.clientX, mouseY: e.clientY, itemId: id, itemLabel: label, level });
        }}
        onRename={async (id, level, newValue) => {
          const field = RENAME_FIELD[level];
          await executeFetch({ url: `${UPDATE_ENDPOINTS[level]}/${id}`, method: "PUT", data: { [field]: newValue } });
          setBreadcrumb((prev) => prev.map((b) => b.id === id ? { ...b, label: newValue } : b));
          dispatch(invalidateCacheAction("/api/stuff/archives/physical"));
          dispatch(incrementVersion());
        }}
        renamingId={renamingId}
        onRenamingEnd={onRenamingEnd}
        onArchiveContextMenu={onArchiveContextMenu}
      />
    </Box>
  );
});

export default SidebarTree;
