/**
 * PhysicalLinkSection — Rattachement physique d'une archive numerique.
 *
 * Non rattache : zone pointillee invitant au rattachement.
 * Rattache : chemin hierarchique discret au-dessus, cible mise en avant
 *            (icone + nom + sous-titre), actions groupees en bas.
 */

import { useEffect, useState } from "react";
import { Box, Button, Chip, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import FolderOpenOutlinedIcon     from "@mui/icons-material/FolderOpenOutlined";
import FolderOffOutlinedIcon      from "@mui/icons-material/FolderOffOutlined";
import AddLinkRoundedIcon         from "@mui/icons-material/AddLinkRounded";
import EditOutlinedIcon           from "@mui/icons-material/EditOutlined";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import WarehouseOutlinedIcon      from "@mui/icons-material/WarehouseOutlined";
import ViewModuleOutlinedIcon     from "@mui/icons-material/ViewModuleOutlined";
import LayersOutlinedIcon         from "@mui/icons-material/LayersOutlined";
import InventoryOutlinedIcon      from "@mui/icons-material/InventoryOutlined";
import DescriptionOutlinedIcon    from "@mui/icons-material/DescriptionOutlined";
import OpenInNewOutlinedIcon      from "@mui/icons-material/OpenInNewOutlined";
import AccountTreeOutlinedIcon    from "@mui/icons-material/AccountTreeOutlined";
import useAxios from "@/hooks/useAxios";
import useToken from "@/hooks/useToken";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import deepNavigate from "@/utils/deepNavigate";

type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";
interface PathNode { id: string; label: string; level: Level }

const LEVEL_ICON: Record<Level, React.ReactNode> = {
  container: <WarehouseOutlinedIcon sx={{ fontSize: 13 }} />,
  shelf:     <ViewModuleOutlinedIcon sx={{ fontSize: 13 }} />,
  floor:     <LayersOutlinedIcon sx={{ fontSize: 13 }} />,
  binder:    <InventoryOutlinedIcon sx={{ fontSize: 13 }} />,
  record:    <FolderOpenOutlinedIcon sx={{ fontSize: 18 }} />,
  document:  <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />,
};

const LEVEL_LABEL: Record<Level, string> = {
  container: "Conteneur",
  shelf:     "Étagère",
  floor:     "Niveau",
  binder:    "Classeur",
  record:    "Dossier",
  document:  "Document",
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

  // Titre de section avec icone
  const sectionHeader = (
    <Stack direction="row" alignItems="center" spacing={0.75} mb={1}>
      <AccountTreeOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}
      >
        Dossier physique
      </Typography>
    </Stack>
  );

  // Non rattache : zone pointillee avec CTA
  if (!link) {
    return (
      <Box px={2} py={1.5}>
        {sectionHeader}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            border: "1px dashed",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            bgcolor: "action.hover",
          }}
        >
          <FolderOffOutlinedIcon sx={{ color: "text.disabled", fontSize: 22 }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" color="text.primary" lineHeight={1.2}>
              Non rattachée
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Aucun dossier ou document physique associé.
            </Typography>
          </Box>
          {canWrite && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddLinkRoundedIcon fontSize="small" />}
              onClick={() => onAction("link-physical")}
              sx={{ flexShrink: 0 }}
            >
              Rattacher
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // Rattache mais en chargement
  if (loading) {
    return (
      <Box px={2} py={1.5}>
        {sectionHeader}
        <Skeleton variant="rounded" height={72} />
      </Box>
    );
  }

  // Rattache mais chemin introuvable (lien rompu)
  if (!path || path.length === 0) {
    return (
      <Box px={2} py={1.5}>
        {sectionHeader}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label="Lien rompu"
          />
          {canWrite && (
            <Button
              size="small"
              variant="text"
              startIcon={<EditOutlinedIcon fontSize="small" />}
              onClick={() => onAction("link-physical")}
            >
              Corriger
            </Button>
          )}
        </Stack>
      </Box>
    );
  }

  // Rattache : chemin discret au-dessus + cible mise en avant
  const target = path[path.length - 1];
  const parents = path.slice(0, -1);

  // Contexte (sujet/titre) pour afficher sous le nom principal
  const rawTarget = (link.level === "document" ? doc.document : doc.record) as Record<string, unknown> | undefined;
  const subtitle = rawTarget && typeof rawTarget === "object"
    ? ((rawTarget.subject as string) || (rawTarget.title as string) || (rawTarget.description as string) || null)
    : null;

  return (
    <Box px={2} py={1.5}>
      {/* En-tete : titre + bouton Modifier */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        {sectionHeader}
        {canWrite && (
          <Tooltip title="Modifier ou detacher">
            <Button
              size="small"
              variant="text"
              onClick={() => onAction("link-physical")}
              sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: 11, color: "text.secondary" }}
              startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
            >
              Modifier
            </Button>
          </Tooltip>
        )}
      </Stack>

      {/* Conteneur principal */}
      <Box
        sx={{
          borderRadius: 1.5,
          border: 1,
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Chemin parent — discret */}
        {parents.length > 0 && (
          <Box
            sx={{
              px: 1.25,
              py: 0.75,
              bgcolor: "action.hover",
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              rowGap: 0.25,
            }}
          >
            {parents.map((node, idx) => (
              <Box key={node.id} display="flex" alignItems="center" minWidth={0}>
                {idx > 0 && (
                  <ArrowForwardIosRoundedIcon
                    sx={{ fontSize: 8, color: "text.disabled", mx: 0.5 }}
                  />
                )}
                <Box sx={{ color: "text.disabled", mr: 0.3, display: "flex" }}>
                  {LEVEL_ICON[node.level]}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                  }}
                  title={`${LEVEL_LABEL[node.level]} — ${node.label}`}
                >
                  {node.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Cible — mise en avant */}
        <Box
          onClick={handleNavigate}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleNavigate(); }}
          sx={{
            px: 1.25,
            py: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            transition: "background-color 120ms",
            "&:hover": { bgcolor: "action.hover" },
            "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
          }}
        >
          <Box
            sx={{
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: 1,
              bgcolor: "action.selected",
            }}
          >
            {LEVEL_ICON[target.level]}
          </Box>
          <Box flex={1} minWidth={0}>
            <Box display="flex" alignItems="center" gap={0.5} minWidth={0}>
              <Chip
                label={LEVEL_LABEL[target.level]}
                size="small"
                sx={{ height: 16, fontSize: 10, "& .MuiChip-label": { px: 0.75 } }}
                color="primary"
                variant="outlined"
              />
            </Box>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              title={target.label}
              sx={{ mt: 0.25 }}
            >
              {target.label}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap title={subtitle}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Tooltip title="Ouvrir dans les archives physiques">
            <OpenInNewOutlinedIcon
              fontSize="small"
              sx={{ color: "text.secondary", flexShrink: 0 }}
            />
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
