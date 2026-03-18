import { useSelector } from "react-redux";
import type { RootState } from "../../../redux/store";
import ListData from "../display-data/ListData";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Chip, Box as MuiBox } from "@mui/material";

export default function ArchiveManagementContent() {
  const id = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements[0]
  );
  const doc = useSelector((store: RootState) =>
    store.data?.docs?.find((doc) => doc?._id === id)
  );

  return <>{doc ? <ListData doc={doc as Parameters<typeof ListData>[0]["doc"]} /> : <EmptyScreen />}</>;
}

const EmptyScreen = () => {
  return (
    <MuiBox
      display='flex'
      flex={1}
      justifyContent='center'
      alignItems='center'
      color='text.secondary'
      gap={1}
      p={5}>
      <Chip
        sx={{
          borderRadius: 1,
        }}
        variant='outlined'
        //deleteIcon={<InfoOutlinedIcon/>}
        icon={<InfoOutlinedIcon />}
        label='Sélectionnez un fichier dans la section de gauche pour afficher ses informations et contrôler ses paramètres.'
      />
    </MuiBox>
  );
};
