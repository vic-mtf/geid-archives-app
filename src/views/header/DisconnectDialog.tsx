import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { removeUser } from "@/redux/app";
import { removeData } from "@/redux/data";
import { disconnected } from "@/redux/user";

export default function DisconnectDialog() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [checked, setChecked] = useState(false);

  const handleDisconnect = () => {
    dispatch(disconnected());
    sessionStorage.clear();
    dispatch(removeData());
    if (checked) {
      localStorage.clear();
      dispatch(removeUser());
    }
    setOpen(false);
    window.location.href = "/";
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    document
      .getElementById("root")!
      .addEventListener("_disconnected", handleOpen);

    return () => {
      document
        .getElementById("root")!
        .removeEventListener("_disconnected", handleOpen);
    };
  }, []);

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle id='alert-dialog-deconnexion'>
        Souhaitez-vous déconnecter le compte ?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id='alert-dialog-description' component='div'>
          <Typography>
            {`Lorsque vous vous déconnectez, vos données seront conservées sur cet
            appareil afin qu'il se souvienne de vous lors de la prochaine
            tentative de connexion jusqu'à la fin de votre session. vous pouvez
            le supprimer en cochant la boîte avant de vous déconnecter.`}
          </Typography>
          <Box mt={1}>
            <FormControl sx={{ display: "inline-block" }}>
              <FormControlLabel
                value='left'
                control={
                  <Checkbox
                    onChange={(_event: React.ChangeEvent<HTMLInputElement>, value: boolean) => setChecked(value)}
                    size='small'
                  />
                }
                label={
                  <Typography
                    variant='body2'
                    component='div'
                    color='text.primary'>
                    Supprimer toutes vos données
                  </Typography>
                }
                labelPlacement='end'
              />
            </FormControl>
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Annuler</Button>
        <Button variant='outlined' onClick={handleDisconnect} autoFocus>
          Déconnexion
        </Button>
      </DialogActions>
    </Dialog>
  );
}
