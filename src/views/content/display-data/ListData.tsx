import {
  ListSubheader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import WorkHistoryOutlinedIcon from "@mui/icons-material/WorkHistoryOutlined";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import CollapseListItemButton from "../../../components/CollapseListItemButton";
import formatDate from "../../../utils/formatTime";
import timeElapsed from "../../../utils/timeElapsed";
import capStr from "../../../utils/capStr";

interface Doc {
  designation?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  folder?: { name: string };
  type?: { type: string };
  description?: string;
  [key: string]: unknown;
}

interface ListDataProps {
  doc: Doc;
}

export default function ListData({ doc }: ListDataProps) {
  return (
    <List
      sx={{ width: "100%" }}
      disablePadding
      component='nav'
      aria-labelledby='doc-list-information'
      subheader={
        <ListSubheader
          component='div'
          id='doc-list-information'
          sx={{ py: 0.5, display: "flex", bgcolor: "background.default" }}>
          <Box flexGrow={1}>{doc?.designation}</Box>
          <Box>{capStr(timeElapsed(doc?.createdAt as string))}</Box>
        </ListSubheader>
      }>
      <ListItem title='Dossier'>
        <ListItemIcon>
          <FolderZipOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary={doc.folder?.name} />
      </ListItem>
      <ListItem title='Date de la création'>
        <ListItemIcon>
          <EditCalendarOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary={formatDate(doc?.createdAt as string)} />
      </ListItem>
      <ListItem title='Dernière date de modification'>
        <ListItemIcon>
          <WorkHistoryOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary={formatDate(doc?.updatedAt as string)} />
      </ListItem>
      <CollapseListItemButton
        getPrimaryText={(open: boolean) => `${open ? "Moins" : "Plus"} d'infomation`}>
        <List>
          <ListItem>
            <ListItemText primary='Type:' />
            <Typography>{doc.type?.type}</Typography>
          </ListItem>
          <ListItem>
            <ListItemText primary='Profil:' />
            <Typography>____</Typography>
          </ListItem>
          <ListItem>
            <ListItemText primary='Mots clés:' />
            <Typography>____</Typography>
          </ListItem>
          <ListItem>
            <ListItemText primary='Référence:' />
            <Typography>____</Typography>
          </ListItem>
          <ListItem>
            <ListItemText primary='Déscription:' secondary={doc.description} />
          </ListItem>
        </List>
      </CollapseListItemButton>
    </List>
  );
}
