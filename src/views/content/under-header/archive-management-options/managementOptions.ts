import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
//import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import store from "../../../../redux/store";
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

interface ManagementOption {
  label: string;
  id: string;
  type: "button" | string;
  activeKeys: string[];
  icon: ComponentType<SvgIconProps>;
  action: () => void;
}

const managementOptions: ManagementOption[] = [
  {
    label: "Valider",
    id: "verify",
    type: "button",
    activeKeys: ["isOnly"],
    icon: VerifiedOutlinedIcon,
    action() {
      const [doc] =
        store.getState().data.navigation.archiveManagement.selectedElements;

      if (doc) {
        const event = "__validate_archive_doc";
        const root = document.getElementById("root");
        const customEvent = new CustomEvent(event, {
          detail: { doc, name: event },
        });
        root?.dispatchEvent(customEvent);
      }
    },
  },
  {
    label: "Modifier",
    id: "edit",
    type: "button",
    icon: EditNoteOutlinedIcon,
    activeKeys: ["isOnly"],
    action() {},
  },
  // {
  //   label: "Télécharger",
  //   id: "download",
  //   type: "button",
  //   icon: CloudUploadOutlinedIcon,
  //   activeKeys: ["isOnly"],
  //   action() {},
  // },
  {
    label: "Supprimer",
    id: "remove",
    type: "button",
    icon: DeleteOutlineOutlinedIcon,
    activeKeys: ["isOnly", "isMultiple"],
    action() {},
  },
];

export default managementOptions;
