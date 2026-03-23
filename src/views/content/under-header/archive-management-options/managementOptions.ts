import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import store from "@/redux/store";
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

export interface ManagementOption {
  label: string;
  id: string;
  type: "button" | string;
  /** activeState keys that must be true to enable this button */
  activeKeys: string[];
  requiresWrite?: boolean;
  requiresAdmin?: boolean;
  icon: ComponentType<SvgIconProps>;
  action: () => void;
}

const managementOptions: ManagementOption[] = [
  // ── Validation ──────────────────────────────────────────────
  {
    label: "Valider",
    id: "verify",
    type: "button",
    activeKeys: ["isOnly", "isPending"],
    requiresWrite: true,
    icon: VerifiedOutlinedIcon,
    action() {
      const [doc] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (doc) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__validate_archive_doc", { detail: { doc, name: "__validate_archive_doc" } })
        );
      }
    },
  },

  // ── Edit ─────────────────────────────────────────────────────
  {
    label: "Modifier",
    id: "edit",
    type: "button",
    icon: EditNoteOutlinedIcon,
    activeKeys: ["isOnly"],
    requiresWrite: true,
    action() {
      const state = store.getState();
      const [id] = state.data.navigation.archiveManagement.selectedElements;
      const doc = state.data.docs.find((d) => d._id === id || d.id === id);
      if (doc) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__edit_archive_doc", { detail: { doc } })
        );
      }
    },
  },

  // ── Physical record ──────────────────────────────────────────
  {
    label: "Dossier physique",
    id: "link-physical",
    type: "button",
    icon: FolderOpenOutlinedIcon,
    activeKeys: ["isOnly"],
    requiresWrite: true,
    action() {
      const state = store.getState();
      const [id] = state.data.navigation.archiveManagement.selectedElements;
      const doc = state.data.docs.find((d) => d._id === id || d.id === id);
      if (doc) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__link_physical_record", { detail: { doc } })
        );
      }
    },
  },

  // ── DUA configuration ────────────────────────────────────────
  {
    label: "Configurer DUA",
    id: "configure-dua",
    type: "button",
    icon: AccessTimeOutlinedIcon,
    activeKeys: ["isOnly", "isSemiActive"],
    requiresWrite: true,
    action() {
      const state = store.getState();
      const [id] = state.data.navigation.archiveManagement.selectedElements;
      const doc = state.data.docs.find((d) => d._id === id || d.id === id);
      if (doc) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__configure_dua", { detail: { doc } })
        );
      }
    },
  },

  // ── Lifecycle transitions ────────────────────────────────────

  {
    label: "Intermédiaire",
    id: "to-semi-active",
    type: "button",
    icon: ArchiveOutlinedIcon,
    activeKeys: ["isOnly", "isActive"],
    requiresWrite: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "SEMI_ACTIVE" } })
        );
      }
    },
  },
  {
    label: "Réactiver",
    id: "reactivate",
    type: "button",
    icon: UnarchiveOutlinedIcon,
    activeKeys: ["isOnly", "isSemiActive"],
    requiresWrite: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "ACTIVE" } })
        );
      }
    },
  },
  {
    label: "Historique",
    id: "to-permanent",
    type: "button",
    icon: HistoryEduOutlinedIcon,
    activeKeys: ["isOnly", "isSemiActive"],
    requiresWrite: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } })
        );
      }
    },
  },
  {
    label: "Éliminer",
    id: "to-destroyed",
    type: "button",
    icon: DeleteForeverOutlinedIcon,
    activeKeys: ["isOnly", "isEliminable"],
    requiresWrite: true,
    requiresAdmin: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "DESTROYED" } })
        );
      }
    },
  },
  {
    label: "Restaurer",
    id: "restore",
    type: "button",
    icon: RestoreOutlinedIcon,
    activeKeys: ["isOnly", "isDestroyed"],
    requiresWrite: true,
    requiresAdmin: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "PERMANENT" } })
        );
      }
    },
  },

  // ── Physical delete ──────────────────────────────────────────
  {
    label: "Supprimer",
    id: "remove",
    type: "button",
    icon: DeleteOutlineOutlinedIcon,
    activeKeys: ["isOnly", "isMultiple"],
    requiresWrite: true,
    action() {
      const ids = store.getState().data.navigation.archiveManagement.selectedElements;
      if (ids.length > 0) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__delete_archive_docs", { detail: { ids } })
        );
      }
    },
  },
];

export default managementOptions;
