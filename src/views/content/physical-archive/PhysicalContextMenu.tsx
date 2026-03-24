/**
 * PhysicalContextMenu — Menu contextuel (clic droit) pour les éléments physiques.
 *
 * Affiche les actions disponibles selon le niveau et les permissions de l'utilisateur :
 * - Ajouter un sous-élément
 * - Modifier l'élément
 * - Supprimer l'élément
 *
 * Les actions d'écriture sont masquées si l'utilisateur n'a pas les droits.
 */

import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import AddRoundedIcon             from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon   from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon       from "@mui/icons-material/OpenInNewRounded";
import EditOutlinedIcon           from "@mui/icons-material/EditOutlined";
import type { PhysicalLevel } from "@/constants/physical";

// ── Types ────────────────────────────────────────────────────

/** Label complet avec article pour le menu "Ajouter ..." */
const CHILD_LABELS: Record<PhysicalLevel, string | null> = {
  container: "une étagère",
  shelf:     "un niveau",
  floor:     "un classeur",
  binder:    "un dossier",
  record:    "un document",
  document:  "un document",
};

export interface ContextMenuState {
  /** Position x du menu */
  mouseX: number;
  /** Position y du menu */
  mouseY: number;
  /** ID de l'élément ciblé */
  itemId: string;
  /** Label de l'élément ciblé */
  itemLabel: string;
  /** Niveau de l'élément */
  level: PhysicalLevel;
}

export interface PhysicalContextMenuProps {
  /** État du menu (null = fermé) */
  state: ContextMenuState | null;
  /** Ferme le menu */
  onClose: () => void;
  /** L'utilisateur peut écrire (créer/modifier/supprimer) */
  canWrite: boolean;
  /** Callbacks d'actions */
  onAdd: (level: PhysicalLevel, parentId: string) => void;
  onDelete: (id: string, label: string, level: PhysicalLevel) => void;
  onViewDetail: (id: string, level: PhysicalLevel) => void;
  onRename: (id: string, level: PhysicalLevel, currentLabel: string) => void;
}

// ── Composant ────────────────────────────────────────────────

export default function PhysicalContextMenu({
  state,
  onClose,
  canWrite,
  onAdd,
  onDelete,
  onViewDetail,
  onRename,
}: PhysicalContextMenuProps) {
  if (!state) return null;

  const childLabel = CHILD_LABELS[state.level];

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: state.mouseY, left: state.mouseX }}
      slotProps={{
        paper: { sx: { minWidth: 200, borderRadius: 1.5 } },
      }}
    >
      {/* Voir le détail */}
      <MenuItem onClick={() => { onViewDetail(state.itemId, state.level); onClose(); }}>
        <ListItemIcon><OpenInNewRoundedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>Voir le détail</ListItemText>
      </MenuItem>

      {/* Actions d'écriture — masquées si pas de droits */}
      {canWrite && <Divider />}

      {canWrite && (
        <MenuItem onClick={() => { onRename(state.itemId, state.level, state.itemLabel); onClose(); }}>
          <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Renommer</ListItemText>
        </MenuItem>
      )}

      {canWrite && childLabel && (
        <MenuItem onClick={() => { onAdd(state.level, state.itemId); onClose(); }}>
          <ListItemIcon><AddRoundedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Ajouter {childLabel}</ListItemText>
        </MenuItem>
      )}

      {canWrite && (
        <MenuItem onClick={() => { onDelete(state.itemId, state.itemLabel, state.level); onClose(); }}
          sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteOutlineRoundedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Supprimer « {state.itemLabel} »</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
