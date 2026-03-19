import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import store from "../../../../redux/store";
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

export interface ManagementOption {
  label: string;
  id: string;
  type: "button" | string;
  /** Clés de activeState qui doivent être vraies pour activer le bouton */
  activeKeys: string[];
  /** Si true, visible uniquement pour un utilisateur avec accès écriture */
  requiresWrite?: boolean;
  /** Si true, visible uniquement pour un administrateur (struct=all) */
  requiresAdmin?: boolean;
  icon: ComponentType<SvgIconProps>;
  action: () => void;
}

const managementOptions: ManagementOption[] = [
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
  {
    label: "Archiver",
    id: "archive",
    type: "button",
    icon: ArchiveOutlinedIcon,
    activeKeys: ["isOnly", "isValidated"],
    requiresWrite: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "archived" } })
        );
      }
    },
  },
  {
    label: "Rouvrir",
    id: "reopen",
    type: "button",
    icon: UnarchiveOutlinedIcon,
    activeKeys: ["isOnly", "isValidated"],
    requiresWrite: true,
    action() {
      const [id] = store.getState().data.navigation.archiveManagement.selectedElements;
      if (id) {
        document.getElementById("root")?.dispatchEvent(
          new CustomEvent("__lifecycle_archive", { detail: { id, targetStatus: "pending" } })
        );
      }
    },
  },
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
