/**
 * PhysicalLinkSection — Affiche le rattachement d'une archive numerique
 * a son dossier/document physique, avec fil d'Ariane complet.
 *
 * Si non rattache : invite discrete a rattacher.
 * Si rattache : Conteneur > Etagere > Niveau > Classeur > Dossier [> Document]
 *               + bouton pour sauter vers l'archive physique (onglet correspondant).
 */

import { useEffect, useState } from "react";
import { Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import FolderOpenOutlinedIcon     from "@mui/icons-material/FolderOpenOutlined";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import WarehouseOutlinedIcon      from "@mui/icons-material/WarehouseOutlined";
import ViewModuleOutlinedIcon     from "@mui/icons-material/ViewModuleOutlined";
import LayersOutlinedIcon         from "@mui/icons-material/LayersOutlined";
import InventoryOutlinedIcon      from "@mui/icons-material/InventoryOutlined";
import DescriptionOutlinedIcon    from "@mui/icons-material/DescriptionOutlined";
import LinkOffOutlinedIcon        from "@mui/icons-material/LinkOffOutlined";
import OpenInNewOutlinedIcon      from "@mui/icons-material/OpenInNewOutlined";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import deepNavigate from "@/utils/deepNavigate";

type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";
interface PathNode { id: string; label: string; level: Level }

const LEVEL_ICON: Record<Level, React.ReactNode> = {
  container: <WarehouseOutlinedIcon sx={{ fontSize: 14 }} />,
  shelf:     <ViewModuleOutlinedIcon sx={{ fontSize: 14 }} />,
  floor:     <LayersOutlinedIcon sx={{ fontSize: 14 }} />,
  binder:    <InventoryOutlinedIcon sx={{ fontSize: 14 }} />,
  record:    <FolderOpenOutlinedIcon sx={{ fontSize: 14 }} />,
  document:  <DescriptionOutlinedIcon sx={{ fontSize: 14 }} />,
};

interface Props {
  doc: Record<string, unknown>;
  canWrite: boolean;
  onAction: (action: string) => void;
}

function resolveLink(doc: Record<string, unknown>): { level: Level; id: string } | null {
  const asId = (v: unknown): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      const obj = v as Record<string, unknown>;
      return (obj._id as string) || (obj.id as string) || null;
    }
    return null;
  };
  const documentId = asId(doc.document);
  if (documentId) return { level: "document", id: documentId };
  const recordId = asId(doc.record);
  if (recordId) return { level: "record", id: recordId };
  return null;
}

export default function PhysicalLinkSection({ doc, canWrite, onAction }: Props) {
  const link = resolveLink(doc);
  const Authorization = useToken();
  const navigateTo = useNavigateSetState();
  const [, fetchPath] = useAxios({ headers: { Authorization } }, { manual: true });
  const [path, setPath] = useState<PathNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!link) { setPath(null); return; }
    let cancelled = false;
    setLoading(true);
    fetchPath({ url: `/api/stuff/archives/physical/path/${link.level}/${link.id}` })
      .then((res) => {
        if (cancelled) return;
        const raw = (res.data as { path?: PathNode[] }).path ?? [];
        setPath(raw);
      })
      .catch(() => { if (!cancelled) setPath([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [link?.level, link?.id, fetchPath]);

  const handleNavigate = () => {
    if (!link || !path || path.length === 0) return;
    deepNavigate(navigateTo, { tab: "physicalArchive", physicalPath: path });
  };

  return (
    <Box px={2} py={1.5}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="caption" color="text.secondary">
          Rattachement physique
        </Typography>
        {link && canWrite && (
          <Button
            size="small"
            variant="text"
            onClick={() => onAction("link-physical")}
            sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: 11 }}
          >
            Modifier
          </Button>
        )}
      </Box>

      {!link ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={<LinkOffOutlinedIcon />}
            label="Non rattaché à un dossier physique"
            size="small"
            variant="outlined"
            color="default"
          />
          {canWrite && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FolderOpenOutlinedIcon fontSize="small" />}
              onClick={() => onAction("link-physical")}
            >
              Rattacher
            </Button>
          )}
        </Stack>
      ) : loading ? (
        <Skeleton variant="rounded" height={28} />
      ) : path && path.length > 0 ? (
        <Box>
          {/* Fil d'Ariane physique */}
          <Box
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            rowGap={0.5}
            sx={{
              p: 1,
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            {path.map((node, idx) => (
              <Box key={node.id} display="flex" alignItems="center" minWidth={0}>
                {idx > 0 && (
                  <ArrowForwardIosRoundedIcon
                    sx={{ fontSize: 10, color: "text.disabled", mx: 0.5 }}
                  />
                )}
                <Box
                  sx={{
                    color: idx === path.length - 1 ? "primary.main" : "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    mr: 0.4,
                  }}
                >
                  {LEVEL_ICON[node.level]}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: idx === path.length - 1 ? 600 : 400,
                    color: idx === path.length - 1 ? "text.primary" : "text.secondary",
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={node.label}
                >
                  {node.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Bouton voir dans les archives physiques */}
          <Button
            size="small"
            variant="text"
            startIcon={<OpenInNewOutlinedIcon fontSize="small" />}
            onClick={handleNavigate}
            sx={{ mt: 0.75, pl: 0.5 }}
          >
            Voir dans les archives physiques
          </Button>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Impossible de retrouver la hiérarchie (lien rompu).
        </Typography>
      )}
    </Box>
  );
}
