/**
 * DetailPanel — Panneau de détail d'un élément physique sélectionné.
 *
 * Affiche les informations spécifiques selon le niveau :
 * Conteneur, Étagère, Niveau, Classeur, Dossier ou Document.
 * Inclut les archives numériques liées pour les dossiers et documents.
 */

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon    from "@mui/icons-material/DeleteOutlineRounded";
import WarehouseOutlinedIcon       from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon             from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon      from "@mui/icons-material/ViewStreamOutlined";
import FolderOutlinedIcon          from "@mui/icons-material/FolderOutlined";
import ArticleOutlinedIcon         from "@mui/icons-material/ArticleOutlined";
import DescriptionOutlinedIcon     from "@mui/icons-material/DescriptionOutlined";
import QrCode2RoundedIcon          from "@mui/icons-material/QrCode2Rounded";
import CalendarTodayOutlinedIcon   from "@mui/icons-material/CalendarTodayOutlined";
import CategoryOutlinedIcon        from "@mui/icons-material/CategoryOutlined";
import InfoOutlinedIcon            from "@mui/icons-material/InfoOutlined";
import LocationOnOutlinedIcon      from "@mui/icons-material/LocationOnOutlined";

import useAxios from "@/hooks/useAxios";
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus } from "@/constants/lifecycle";
import type { Container, Shelf, Floor, Binder, PhysicalRecord, PhysicalDocument } from "@/types";
import type { PhysicalLevel } from "@/constants/physical";
import { LEVEL_LABELS } from "@/constants/physical";

// ── Types ────────────────────────────────────────────────────

export interface DetailPanelProps {
  /** Niveau de la hiérarchie physique */
  level: PhysicalLevel;
  /** L'élément sélectionné */
  item: Container | Shelf | Floor | Binder | PhysicalRecord | PhysicalDocument;
  /** Callback de suppression */
  onDelete: (id: string, label: string) => void;
  /** Headers HTTP (Authorization) */
  headers: Record<string, string>;
}

// ── Sous-composant : ligne de détail ─────────────────────────

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <List disablePadding dense>
      <ListItem disablePadding>
        <ListItemIcon sx={{ minWidth: 28, color: "text.secondary" }}>{icon}</ListItemIcon>
        <ListItemText
          primary={value ?? "—"}
          secondary={label}
          primaryTypographyProps={{ variant: "body2" }}
          secondaryTypographyProps={{ variant: "caption" }}
        />
      </ListItem>
    </List>
  );
}

// ── Détail par niveau ────────────────────────────────────────

/** Formate une date ISO en date locale française */
function fmtDate(d?: string) {
  return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : null;
}

function ContainerDetail({ item }: { item: Container }) {
  return (
    <Stack spacing={1}>
      <DetailRow icon={<WarehouseOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      {item.location && <DetailRow icon={<LocationOnOutlinedIcon fontSize="small" />} label="Localisation" value={item.location} />}
      {item.description && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Créé le" value={fmtDate(item.createdAt)} />}
      {item.updatedAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Modifié le" value={fmtDate(item.updatedAt)} />}
    </Stack>
  );
}

function ShelfDetail({ item }: { item: Shelf }) {
  const containerName = typeof item.container === "object" && item.container ? (item.container as { name?: string }).name : null;
  return (
    <Stack spacing={1}>
      <DetailRow icon={<DnsOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      {containerName && <DetailRow icon={<WarehouseOutlinedIcon fontSize="small" />} label="Conteneur" value={containerName} />}
      {item.description && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Créé le" value={fmtDate(item.createdAt)} />}
    </Stack>
  );
}

function FloorDetail({ item }: { item: Floor }) {
  const shelfName = typeof item.shelf === "object" && item.shelf ? (item.shelf as { name?: string }).name : null;
  const unitName = typeof item.administrativeUnit === "object" && item.administrativeUnit ? (item.administrativeUnit as { name: string }).name : null;
  return (
    <Stack spacing={1}>
      <DetailRow icon={<ViewStreamOutlinedIcon fontSize="small" />} label="Numéro" value={`${item.number}`} />
      {item.label && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Libellé" value={item.label} />}
      {shelfName && <DetailRow icon={<DnsOutlinedIcon fontSize="small" />} label="Étagère" value={shelfName} />}
      {unitName && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Unité administrative" value={unitName} />}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Créé le" value={fmtDate(item.createdAt)} />}
    </Stack>
  );
}

function BinderDetail({ item }: { item: Binder }) {
  const pct = item.currentCount != null ? Math.min(100, (item.currentCount / item.maxCapacity) * 100) : 0;
  return (
    <Stack spacing={1.5}>
      <DetailRow icon={<FolderOutlinedIcon fontSize="small" />} label="Nom" value={item.name} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Nature" value={item.nature} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          Occupation : {item.currentCount ?? 0} / {item.maxCapacity}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "primary"}
          sx={{ height: 6, borderRadius: 2 }}
        />
      </Box>
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Créé le" value={fmtDate(item.createdAt)} />}
    </Stack>
  );
}

function RecordDetail({ item, headers }: { item: PhysicalRecord; headers: Record<string, string> }) {
  const [{ data: archivesData, loading: archLoading }] = useAxios<{
    record: string; count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean }>;
  }>({ url: `/api/stuff/archives/physical/records/${item._id}/archives`, headers });

  const linkedArchives = archivesData?.archives ?? [];

  return (
    <Stack spacing={1}>
      <DetailRow icon={<ArticleOutlinedIcon fontSize="small" />} label="N° interne" value={item.internalNumber} />
      <DetailRow icon={<ArticleOutlinedIcon fontSize="small" />} label="N° référence" value={item.refNumber} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Objet" value={item.subject} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Catégorie" value={item.category} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Nature" value={item.nature} />
      {item.editionDate && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Date d'édition" value={fmtDate(item.editionDate)} />}
      {item.archivingDate && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Date d'archivage" value={fmtDate(item.archivingDate)} />}
      {item.qrCode && <DetailRow icon={<QrCode2RoundedIcon fontSize="small" />} label="Code QR" value={item.qrCode} />}
      {item.agent && typeof item.agent === "object" && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Agent" value={`${(item.agent as { firstName?: string }).firstName ?? ""} ${(item.agent as { lastName?: string }).lastName ?? ""}`.trim()} />
      )}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Créé le" value={fmtDate(item.createdAt)} />}

      {/* Archives numériques liées */}
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle2" fontWeight="bold">Archives numériques liées</Typography>
        {archivesData && <Chip label={archivesData.count} size="small" color="default" />}
      </Stack>
      {archLoading ? (
        <CircularProgress size={20} />
      ) : linkedArchives.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 0.5 }}>
          Aucune archive numérique n&apos;est rattachée à ce dossier physique.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {linkedArchives.map((arc) => {
            const norm = normalizeStatus(arc.status, arc.validated);
            return (
              <Box key={arc._id} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 0.75, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.25, flexShrink: 0 }} />
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" noWrap fontWeight={500}>{arc.designation ?? arc.folder ?? arc._id}</Typography>
                  {arc.classNumber && <Typography variant="caption" color="text.secondary" noWrap>N° {arc.classNumber}</Typography>}
                </Box>
                <Chip label={STATUS_LABEL[norm] ?? norm} color={STATUS_COLOR[norm] ?? "default"} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

function DocumentDetail({ item, headers }: { item: PhysicalDocument; headers: Record<string, string> }) {
  const [{ data: archivesData, loading: archLoading }] = useAxios<{
    document: string; count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean }>;
  }>({ url: `/api/stuff/archives/physical/documents/${item._id}/archives`, headers });

  const linkedArchives = archivesData?.archives ?? [];

  return (
    <Stack spacing={1}>
      <DetailRow icon={<DescriptionOutlinedIcon fontSize="small" />} label="Titre" value={item.title} />
      {item.description && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label="Description" value={item.description} />}
      {item.nature && <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Nature" value={item.nature} />}
      {item.documentDate && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label="Date du document" value={new Date(item.documentDate).toLocaleDateString("fr-FR")} />}

      <Divider sx={{ my: 1 }} />
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle2" fontWeight="bold">Archives numériques liées</Typography>
        {archivesData && <Chip label={archivesData.count} size="small" color="default" />}
      </Stack>
      {archLoading ? (
        <CircularProgress size={20} />
      ) : linkedArchives.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 0.5 }}>
          Aucune archive numérique rattachée à ce document.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {linkedArchives.map((arc) => {
            const norm = normalizeStatus(arc.status, arc.validated);
            return (
              <Box key={arc._id} sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 0.75, borderRadius: 1, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.25, flexShrink: 0 }} />
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" noWrap fontWeight={500}>{arc.designation ?? arc.folder ?? arc._id}</Typography>
                  {arc.classNumber && <Typography variant="caption" color="text.secondary" noWrap>N° {arc.classNumber}</Typography>}
                </Box>
                <Chip label={STATUS_LABEL[norm] ?? norm} color={STATUS_COLOR[norm] ?? "default"} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

// ── Composant principal ──────────────────────────────────────

export default function DetailPanel({ level, item, onDelete, headers }: DetailPanelProps) {
  const itemLabel = useMemo(() => {
    const it = item as unknown as Record<string, unknown>;
    return (it.name ?? it.title ?? it.internalNumber ?? it.subject ?? (it.number !== undefined ? `Étage ${it.number}` : null) ?? it._id) as string;
  }, [item]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
            {LEVEL_LABELS[level]}
          </Typography>
          <Chip label={LEVEL_LABELS[level]} size="small" variant="outlined" />
          <Tooltip title="Supprimer cet élément" placement="top">
            <IconButton size="small" color="error" onClick={() => onDelete(item._id, itemLabel)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {level === "container" && <ContainerDetail item={item as Container} />}
        {level === "shelf" && <ShelfDetail item={item as Shelf} />}
        {level === "floor" && <FloorDetail item={item as Floor} />}
        {level === "binder" && <BinderDetail item={item as Binder} />}
        {level === "record" && <RecordDetail item={item as PhysicalRecord} headers={headers} />}
        {level === "document" && <DocumentDetail item={item as PhysicalDocument} headers={headers} />}
      </CardContent>
    </Card>
  );
}
