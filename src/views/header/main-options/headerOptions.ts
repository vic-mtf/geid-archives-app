import AppsMenuButton from "./AppsMenuButton";
import ProfileMenuButton from "./ProfileMenuButton";
// import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
// import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
// import ContactSupportOutlinedIcon from '@mui/icons-material/ContactSupportOutlined';
import { ComponentType } from "react";
import { SvgIconProps } from "@mui/material";

interface HeaderOption {
  label: string;
  pin: boolean;
  icon: ComponentType<SvgIconProps>;
  element: ComponentType | null;
  key: string;
  disabled?: boolean;
  action?: () => void;
}

const options: HeaderOption[] = [
  // {
  //     label: 'Aide',
  //     pin: true,
  //     icon: ContactSupportOutlinedIcon ,
  //     element: null,
  //     disabled: true,
  //     key: '_help',
  // },
  {
    label: "Applications",
    pin: true,
    icon: AppsRoundedIcon,
    element: AppsMenuButton,
    key: "_apps",
  },
  {
    label: "Profil",
    pin: true,
    icon: AccountCircleOutlinedIcon,
    element: ProfileMenuButton,
    key: "_profile",
  },
  // {
  //     label: 'Téléchargements',
  //     pin: false,
  //     icon: FileDownloadOutlinedIcon ,
  //     element: null,
  //     key: '_download_file',
  //     action () {
  //         const name = '_open_download_drawer';
  //         const customEvent = new CustomEvent(name, {detail: {name}});
  //         document.getElementById('root')
  //         .dispatchEvent(customEvent);
  //     }
  // },
  // {
  //     label: 'Quitter l\'espace personnel',
  //     pin: false,
  //     icon: ExitToAppRoundedIcon ,
  //     element: null,
  //     key: '_exit_app',
  //     action () {
  //        window.location = '/';
  //     }
  // }
];

export default options;
