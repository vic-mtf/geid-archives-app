import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import type { PhysicalLevel } from "@/constants/physical";
import { UPDATE_ENDPOINTS, RENAME_FIELD } from "@/constants/physical";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { incrementVersion, invalidateCache as invalidateCacheAction } from "@/redux/data";
import { levelConfig } from "./levelConfig";
import PhysicalTreeView from "./PhysicalTreeView";
import type { BreadcrumbItem } from "./BreadcrumbBar";
import type { ContextMenuState } from "./PhysicalContextMenu";

interface SidebarTreeProps {
  headers: Record<string, string>;
  parentId: string | undefined;
  breadcrumb: BreadcrumbItem[];
  dataVersion: number;
  canWrite: boolean;
  renamingId: string | null;
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

  return (
    <Box sx={{
      width: { lg: 300, xl: 340 },
      flexShrink: 0,
      display: { xs: "none", md: "flex" },
      flexDirection: "column",
      borderRight: "1px solid",
      borderColor: "divider",
      overflow: "hidden",
    }}>
      <Box px={1.5} borderBottom={1} borderColor="divider" bgcolor="action.hover" display="flex" alignItems="center" minHeight={42}>
        <Box display="flex" alignItems="center" gap={0.5} flex={1}>
          <WarehouseOutlinedIcon sx={{ fontSize: 16, color: levelConfig.container.color }} />
          <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Conteneurs
          </Typography>
        </Box>
        {canWrite && (
          <Tooltip title="Nouveau conteneur">
            <IconButton size="small" onClick={() => onSetFormOpen("container")}>
              <AddRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <PhysicalTreeView
        headers={headers}
        selectedId={parentId ?? null}
        expandedIds={breadcrumb.map((b) => b.id)}
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
