/**
 * HelpTip — icône (?) avec tooltip bref + lien vers le guide utilisateur.
 *
 * Usage :
 *   <HelpTip
 *     tip="Le numéro attribué par le service d'archives."
 *     section="classement"   // ancre dans HelpContent (#classement)
 *   />
 */

import { useState } from "react";
import {
  IconButton,
  Tooltip,
  Popover,
  Typography,
  Box,
  Button,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useNavigate, useLocation } from "react-router-dom";

interface HelpTipProps {
  /** Texte bref affiché dans le popover */
  tip: string;
  /** Ancre dans la page Guide utilisateur (ex : "classement") */
  section?: string;
}

export default function HelpTip({ tip, section }: HelpTipProps) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
  };
  const handleClose = () => setAnchor(null);

  const goToGuide = () => {
    handleClose();
    // Navigue vers l'onglet "help" via le state de navigation
    const state = {
      ...(location.state ?? {}),
      navigation: {
        ...((location.state as Record<string, unknown>)?.navigation ?? {}),
        tabs: { option: "help" },
        helpAnchor: section ?? null,
      },
    };
    navigate(location.pathname, { state });
  };

  return (
    <>
      <Tooltip title="Afficher l'aide pour ce champ" placement="top" arrow>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ ml: 0.5, p: 0.25, color: "text.disabled", "&:hover": { color: "primary.main" } }}
          tabIndex={-1}
          aria-label="aide pour ce champ">
          <HelpOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { maxWidth: 280, borderRadius: 2, p: 1.5 } } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: section ? 1 : 0 }}>
          {tip}
        </Typography>
        {section && (
          <Box display="flex" justifyContent="flex-end">
            <Button size="small" onClick={goToGuide} sx={{ fontSize: "0.75rem" }}>
              Voir le guide →
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
