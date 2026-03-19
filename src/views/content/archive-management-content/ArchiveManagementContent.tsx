import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../../redux/store";
import { updateData } from "../../../redux/data";
import ListData from "../display-data/ListData";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Box as MuiBox, CircularProgress, Typography } from "@mui/material";
import useAxios from "../../../hooks/useAxios";
import useToken from "../../../hooks/useToken";
import type { Archive } from "../../../types";
import type { ArchiveDocument } from "../../../types";

export default function ArchiveManagementContent() {
  const Authorization = useToken();
  const dispatch = useDispatch<AppDispatch>();
  const dataVersion = useSelector((store: RootState) => store.data.dataVersion);

  const [{ data, loading }, refetch] = useAxios<Archive[]>({
    url: "/api/stuff/archives/archived",
    headers: { Authorization },
  });

  // Populate docs in Redux for the tree view
  useEffect(() => {
    if (data) {
      dispatch(
        updateData({
          data: {
            docs: (data as Archive[]).map((doc) => ({
              ...doc,
              id: doc._id,
            })) as unknown as ArchiveDocument[],
          },
        })
      );
    }
  }, [data, dispatch]);

  // Refetch when a mutation occurs elsewhere
  useEffect(() => {
    if (dataVersion > 0) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  const id = useSelector(
    (store: RootState) => store.data.navigation.archiveManagement.selectedElements[0]
  );
  const doc = useSelector((store: RootState) =>
    store.data?.docs?.find((doc) => doc?._id === id || doc?.id === id)
  );

  if (loading && !data) {
    return (
      <MuiBox display="flex" flex={1} justifyContent="center" alignItems="center">
        <CircularProgress size={28} />
      </MuiBox>
    );
  }

  if (!doc) return <EmptyScreen />;

  return (
    <MuiBox sx={{ overflowY: "auto", height: "100%", width: "100%" }}>
      <ListData doc={doc as Parameters<typeof ListData>[0]["doc"]} />
    </MuiBox>
  );
}

const EmptyScreen = () => (
  <MuiBox
    display="flex"
    flex={1}
    justifyContent="center"
    alignItems="center"
    p={3}>
    <MuiBox
      display="flex"
      alignItems="flex-start"
      gap={1.5}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        maxWidth: 360,
        color: "text.secondary",
      }}>
      <InfoOutlinedIcon sx={{ flexShrink: 0, mt: 0.2 }} fontSize="small" />
      <Typography variant="body2" sx={{ lineHeight: 1.6, wordBreak: "break-word" }}>
        Sélectionnez un fichier dans la section de gauche pour afficher ses informations et contrôler ses paramètres.
      </Typography>
    </MuiBox>
  </MuiBox>
);
