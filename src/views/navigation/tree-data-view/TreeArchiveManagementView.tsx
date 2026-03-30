/**
 * TreeArchiveManagementView — Arbre des archives dans la sidebar navigation.
 *
 * Affiche toutes les archives sous forme de liste arborescente.
 * - Clic simple → sélectionne l'archive + ouvre le DetailPanel
 * - Clic droit → menu contextuel avec actions rapides
 * - Ctrl+clic → sélection multiple
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import { TreeView } from "@mui/x-tree-view/TreeView";
import StyledTreeItem from "@/components/StyledTreeItem";
import {
  Box as MuiBox,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FolderOpenOutlinedIcon      from "@mui/icons-material/FolderOpenOutlined";
import VisibilityOutlinedIcon      from "@mui/icons-material/VisibilityOutlined";
import VerifiedOutlinedIcon        from "@mui/icons-material/VerifiedOutlined";
import EditNoteOutlinedIcon        from "@mui/icons-material/EditNoteOutlined";
import LinkOutlinedIcon             from "@mui/icons-material/LinkOutlined";
import AccessTimeOutlinedIcon      from "@mui/icons-material/AccessTimeOutlined";
import DeleteOutlineOutlinedIcon    from "@mui/icons-material/DeleteOutlineOutlined";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { updateData } from "@/redux/data";
import { STATUS_COLOR, normalizeStatus } from "@/constants/lifecycle";
import useArchivePermissions from "@/hooks/useArchivePermissions";

// ── Types ────────────────────────────────────────────────────

interface TreeArchiveManagementViewProps {
  filter?: string;
}

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  docId: string;
  doc: Record<string, unknown>;
}

// ── Composant ────────────────────────────────────────────────

export default function TreeArchiveManagementView({ filter = "" }: TreeArchiveManagementViewProps) {
  const docs = useSelector((store: RootState) => store.data.docs);
  const selected = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements
  );
  const dispatch = useDispatch<AppDispatch>();
  const rootTreeViewRef = useRef<HTMLUListElement>(null);
  const { canWrite, isAdmin } = useArchivePermissions();

  // Menu contextuel
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Filtrage
  const filteredData = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return docs
      .map((doc) => ({ ...doc }))
      .filter(({ designation }) =>
        !term || (designation as string)?.toLowerCase().includes(term)
      );
  }, [docs, filter]);

  // Sélection (clic simple ou Ctrl+clic)
  const onNodeSelect = useCallback(
    (event: React.SyntheticEvent, nodeId: string) => {
      event?.preventDefault();
      let selectedElements: (string | number)[];
      if ((event as React.MouseEvent).ctrlKey || (event as React.MouseEvent).altKey)
        selectedElements = selected.includes(nodeId)
          ? selected.filter((id) => id !== nodeId)
          : [...selected, nodeId];
      else selectedElements = [nodeId];

      dispatch(
        updateData({
          data: {
            navigation: {
              archiveManagement: { selectedElements },
            } as unknown as import("@/types").NavigationState,
          },
        })
      );

      // Ouvrir le détail de l'archive dans le DataGrid (même effet que clic dans le tableau)
      const doc = docs.find((d) => d._id === nodeId || d.id === nodeId);
      if (doc) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__tree_archive_select", { detail: { id: nodeId, doc } })
        );
      }
    },
    [dispatch, selected, docs]
  );

  // Clic droit → menu contextuel
  const handleContextMenu = useCallback((e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const doc = docs.find((d) => (d._id as string) === docId || (d.id as string) === docId);
    if (doc) {
      setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, docId, doc: doc as unknown as Record<string, unknown> });
    }
  }, [docs]);

  // Dispatch une action sur l'archive
  const dispatchAction = useCallback((eventName: string, detail: unknown) => {
    document.getElementById("root")?.dispatchEvent(new CustomEvent(eventName, { detail }));
    setContextMenu(null);
  }, []);

  if (filteredData.length === 0) {
    return (
      <MuiBox display="flex" justifyContent="center" alignItems="center" p={3}>
        <Typography variant="caption" color="text.disabled" textAlign="center">
          {filter ? `Aucun résultat pour "${filter}"` : "Aucun document disponible"}
        </Typography>
      </MuiBox>
    );
  }

  return (
    <MuiBox height="100%" overflow="hidden" display="flex" flexDirection="column">
      <TreeView
        aria-label="tree-archive-management-view"
        ref={rootTreeViewRef}
        onFocus={(event) => event.stopPropagation()}
        selected={selected as unknown as string}
        defaultEndIcon={<div style={{ width: 24 }} />}
        defaultCollapseIcon={<FolderOpenOutlinedIcon fontSize="small" />}
        defaultExpandIcon={<FolderOpenOutlinedIcon fontSize="small" />}
        onNodeSelect={onNodeSelect}
        onNodeFocus={(event) => event.preventDefault()}
        sx={{ flexGrow: 1, overflowY: "auto", px: 1, pb: 2 }}>
        {filteredData.map((doc) => {
          const id = (doc._id ?? doc.id) as string;
          const norm = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);
          return (
            <StyledTreeItem
              key={id}
              nodeId={id}
              labelText={doc.designation as string}
              labelIcon={(props) => (
                <InsertDriveFileOutlinedIcon
                  fontSize="small"
                  {...props}
                  sx={{ color: `${STATUS_COLOR[norm]}.main` }}
                />
              )}
              onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, id)}
            />
          );
        })}
      </TreeView>

      {/* Menu contextuel — options selon le statut réel de l'archive */}
      <ArchiveContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        canWrite={canWrite}
        isAdmin={isAdmin}
        dispatchAction={dispatchAction}
      />
    </MuiBox>
  );
}

// ── Menu contextuel — options dynamiques selon le statut ──────

function ArchiveContextMenu({ contextMenu, onClose, canWrite, isAdmin, dispatchAction }: {
  contextMenu: ContextMenuState | null;
  onClose: () => void;
  canWrite: boolean;
  isAdmin: boolean;
  dispatchAction: (event: string, detail: unknown) => void;
}) {
  if (!contextMenu) return null;

  const doc = contextMenu.doc;
  const norm = normalizeStatus(doc.status as string | undefined, doc.validated as boolean | undefined);

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
      slotProps={{ paper: { sx: { minWidth: 200, borderRadius: 1.5 } } }}>

      {/* Toujours visible */}
      <MenuItem onClick={() => { dispatchAction("__tree_archive_select", { id: contextMenu.docId, doc }); onClose(); }}>
        <ListItemIcon><VisibilityOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Voir le détail</ListItemText>
      </MenuItem>

      {/* Valider — uniquement si PENDING et canWrite */}
      {canWrite && norm === "PENDING" && (
        <MenuItem onClick={() => { dispatchAction("__validate_archive_doc", { doc: contextMenu.docId, name: "__validate_archive_doc" }); onClose(); }}>
          <ListItemIcon><VerifiedOutlinedIcon fontSize="small" color="success" /></ListItemIcon>
          <ListItemText>Valider</ListItemText>
        </MenuItem>
      )}

      {/* Modifier — si canWrite et pas DESTROYED */}
      {canWrite && norm !== "DESTROYED" && (
        <MenuItem onClick={() => { dispatchAction("__edit_archive_doc", { doc }); onClose(); }}>
          <ListItemIcon><EditNoteOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>
      )}

      {/* Dossier physique — si canWrite et ACTIVE ou SEMI_ACTIVE */}
      {canWrite && (norm === "ACTIVE" || norm === "SEMI_ACTIVE") && (
        <MenuItem onClick={() => { dispatchAction("__link_physical_record", { doc }); onClose(); }}>
          <ListItemIcon><LinkOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Dossier physique</ListItemText>
        </MenuItem>
      )}

      {/* DUA — uniquement si SEMI_ACTIVE et canWrite */}
      {canWrite && norm === "SEMI_ACTIVE" && (
        <MenuItem onClick={() => { dispatchAction("__configure_dua", { doc }); onClose(); }}>
          <ListItemIcon><AccessTimeOutlinedIcon fontSize="small" color="info" /></ListItemIcon>
          <ListItemText>Définir la durée de conservation</ListItemText>
        </MenuItem>
      )}

      {/* Supprimer — admin uniquement, pas si déjà DESTROYED */}
      {isAdmin && norm !== "DESTROYED" && <Divider />}
      {isAdmin && norm !== "DESTROYED" && (
        <MenuItem onClick={() => { dispatchAction("__delete_archive_docs", { ids: [contextMenu.docId] }); onClose(); }}
          sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteOutlineOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Supprimer définitivement</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
