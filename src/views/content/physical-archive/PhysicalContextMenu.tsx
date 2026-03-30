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

import { useTranslation } from "react-i18next";
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import AddOutlinedIcon             from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon   from "@mui/icons-material/DeleteOutlineOutlined";
import OpenInNewOutlinedIcon       from "@mui/icons-material/OpenInNewOutlined";
import EditOutlinedIcon           from "@mui/icons-material/EditOutlined";
import type { PhysicalLevel } from "@/constants/physical";

// ── Types ────────────────────────────────────────────────────

/** Niveaux qui ont un enfant (pour le menu "Ajouter ...") */
const HAS_CHILD: Record<PhysicalLevel, boolean> = {
  container: true,
  shelf:     true,
  floor:     true,
  binder:    true,
  record:    true,
  document:  true,
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
  const { t } = useTranslation();
  if (!state) return null;

  const hasChild = HAS_CHILD[state.level];

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: state.mouseY, left: state.mouseX }}
      slotProps={{
        paper: { sx: { minWidth: 200, borderRadius: 1.5, bgcolor: (theme: any) => theme.palette.background.paper + theme.customOptions.opacity, backdropFilter: (theme: any) => `blur(${theme.customOptions.blur})`, border: 1, borderColor: "divider" } },
      }}
    >
      {/* Voir le détail */}
      <MenuItem onClick={() => { onViewDetail(state.itemId, state.level); onClose(); }}>
        <ListItemIcon><OpenInNewOutlinedIcon fontSize="small" /></ListItemIcon>
        <ListItemText>{t("physical.contextMenu.viewDetail")}</ListItemText>
      </MenuItem>

      {/* Actions d'écriture — masquées si pas de droits */}
      {canWrite && <Divider />}

      {canWrite && (
        <MenuItem onClick={() => { onRename(state.itemId, state.level, state.itemLabel); onClose(); }}>
          <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t("physical.contextMenu.rename")}</ListItemText>
        </MenuItem>
      )}

      {canWrite && hasChild && (
        <MenuItem onClick={() => { onAdd(state.level, state.itemId); onClose(); }}>
          <ListItemIcon><AddOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t("physical.contextMenu.addChild", { child: t(`physical.addChild.${state.level}`) })}</ListItemText>
        </MenuItem>
      )}

      {canWrite && (
        <MenuItem onClick={() => { onDelete(state.itemId, state.itemLabel, state.level); onClose(); }}
          sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteOutlineOutlinedIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t("physical.contextMenu.deleteItem", { label: state.itemLabel })}</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
