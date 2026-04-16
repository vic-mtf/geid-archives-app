/**
 * DetailPanel — Panneau de détail d'un élément physique sélectionné.
 *
 * Affiche les informations spécifiques selon le niveau :
 * Conteneur, Étagère, Niveau, Classeur, Dossier ou Document.
 * Inclut les archives numériques liées pour les dossiers et documents.
 */

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
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
import DeleteOutlineOutlinedIcon    from "@mui/icons-material/DeleteOutlineOutlined";
import WarehouseOutlinedIcon       from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon             from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon      from "@mui/icons-material/ViewStreamOutlined";
import FolderRoundedIcon          from "@mui/icons-material/FolderOutlined";
import ArticleOutlinedIcon         from "@mui/icons-material/ArticleOutlined";
import DescriptionOutlinedIcon     from "@mui/icons-material/DescriptionOutlined";
import QrCode2OutlinedIcon          from "@mui/icons-material/QrCode2Outlined";
import CalendarTodayOutlinedIcon   from "@mui/icons-material/CalendarTodayOutlined";
import CategoryOutlinedIcon        from "@mui/icons-material/CategoryOutlined";
import InfoOutlinedIcon            from "@mui/icons-material/InfoOutlined";
import LocationOnOutlinedIcon      from "@mui/icons-material/LocationOnOutlined";

import useAxios from "@/hooks/useAxios";
import getFileIcon from "@/utils/getFileIcon";
import { STATUS_LABEL, STATUS_COLOR, normalizeStatus } from "@/constants/lifecycle";
import type { Container, Shelf, Floor, Binder, PhysicalRecord, PhysicalDocument } from "@/types";
import type { PhysicalLevel } from "@/constants/physical";
import { LEVEL_LABELS } from "@/constants/physical";
import useNavigateSetState from "@/hooks/useNavigateSetState";
import deepNavigate from "@/utils/deepNavigate";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

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
  const { t } = useTranslation();
  return (
    <Stack spacing={1}>
      <DetailRow icon={<WarehouseOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.name")} value={item.name} />
      {item.location && <DetailRow icon={<LocationOnOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.location")} value={item.location} />}
      {item.description && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.description")} value={item.description} />}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.createdAt")} value={fmtDate(item.createdAt)} />}
      {item.updatedAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.updatedAt")} value={fmtDate(item.updatedAt)} />}
    </Stack>
  );
}

function ShelfDetail({ item }: { item: Shelf }) {
  const { t } = useTranslation();
  const containerName = typeof item.container === "object" && item.container ? (item.container as { name?: string }).name : null;
  return (
    <Stack spacing={1}>
      <DetailRow icon={<DnsOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.name")} value={item.name} />
      {containerName && <DetailRow icon={<WarehouseOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.container")} value={containerName} />}
      {item.description && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.description")} value={item.description} />}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.createdAt")} value={fmtDate(item.createdAt)} />}
    </Stack>
  );
}

function FloorDetail({ item }: { item: Floor }) {
  const { t } = useTranslation();
  const shelfName = typeof item.shelf === "object" && item.shelf ? (item.shelf as { name?: string }).name : null;
  const unitName = typeof item.administrativeUnit === "object" && item.administrativeUnit ? (item.administrativeUnit as { name: string }).name : null;
  return (
    <Stack spacing={1}>
      <DetailRow icon={<ViewStreamOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.number")} value={`${item.number}`} />
      {item.label && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.label")} value={item.label} />}
      {shelfName && <DetailRow icon={<DnsOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.shelf")} value={shelfName} />}
      {unitName && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.administrativeUnit")} value={unitName} />}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.createdAt")} value={fmtDate(item.createdAt)} />}
    </Stack>
  );
}

function BinderDetail({ item }: { item: Binder }) {
  const { t } = useTranslation();
  const pct = item.currentCount != null ? Math.min(100, (item.currentCount / item.maxCapacity) * 100) : 0;
  return (
    <Stack spacing={1.5}>
      <DetailRow icon={<FolderRoundedIcon fontSize="small" />} label={t("physical.detailLabels.name")} value={item.name} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.nature")} value={item.nature} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          {t("physical.detailLabels.occupation", { current: item.currentCount ?? 0, max: item.maxCapacity })}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={pct >= 90 ? "error" : pct >= 70 ? "warning" : "primary"}
          sx={{ height: 6, borderRadius: 2 }}
        />
      </Box>
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.createdAt")} value={fmtDate(item.createdAt)} />}
    </Stack>
  );
}

interface LinkedArchive {
  _id: string;
  designation?: string;
  folder?: string;
  classNumber?: string;
  status?: string;
  validated?: boolean;
  fileUrl?: string;
}

function LinkedArchiveCard({ arc }: { arc: LinkedArchive }) {
  const navigateTo = useNavigateSetState();
  const { t } = useTranslation();
  const norm = normalizeStatus(arc.status, arc.validated);
  const fi = getFileIcon(arc.fileUrl ?? arc.designation);

  const handleOpen = () => {
    deepNavigate(navigateTo, { tab: "archiveManager", archiveId: arc._id });
  };

  return (
    <Tooltip title={t("physical.openInDigitalArchives") || "Ouvrir dans les archives numériques"} placement="left">
      <Box
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpen(); }}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          p: 0.75,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          cursor: "pointer",
          transition: "background-color 120ms, border-color 120ms",
          "&:hover": { bgcolor: "action.hover", borderColor: "primary.main" },
          "&:focus-visible": { outline: 2, outlineColor: "primary.main", outlineOffset: 1 },
        }}
      >
        {React.cloneElement(fi.icon, { fontSize: "small", sx: { color: fi.color, mt: 0.25, flexShrink: 0 } })}
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" noWrap fontWeight={500}>{arc.designation ?? arc.folder ?? arc._id}</Typography>
          {arc.classNumber && <Typography variant="caption" color="text.secondary" noWrap>N° {arc.classNumber}</Typography>}
        </Box>
        <Chip label={STATUS_LABEL[norm] ?? norm} color={STATUS_COLOR[norm] ?? "default"} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
        <OpenInNewOutlinedIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.5, flexShrink: 0 }} />
      </Box>
    </Tooltip>
  );
}

function RecordDetail({ item, headers }: { item: PhysicalRecord; headers: Record<string, string> }) {
  const { t } = useTranslation();
  const [{ data: archivesData, loading: archLoading }] = useAxios<{
    record: string; count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean; fileUrl?: string }>;
  }>({ url: `/api/stuff/archives/physical/records/${item._id}/archives`, headers });

  const linkedArchives = archivesData?.archives ?? [];

  return (
    <Stack spacing={1}>
      <DetailRow icon={<ArticleOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.internalNumber")} value={item.internalNumber} />
      <DetailRow icon={<ArticleOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.refNumber")} value={item.refNumber} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.subject")} value={item.subject} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.category")} value={item.category} />
      <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.nature")} value={item.nature} />
      {item.editionDate && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.editionDate")} value={fmtDate(item.editionDate)} />}
      {item.archivingDate && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.archivingDate")} value={fmtDate(item.archivingDate)} />}
      {item.qrCode && <DetailRow icon={<QrCode2OutlinedIcon fontSize="small" />} label={t("physical.detailLabels.qrCode")} value={item.qrCode} />}
      {item.agent && typeof item.agent === "object" && (
        <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.agent")} value={`${(item.agent as { firstName?: string }).firstName ?? ""} ${(item.agent as { lastName?: string }).lastName ?? ""}`.trim()} />
      )}
      {item.createdAt && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.createdAt")} value={fmtDate(item.createdAt)} />}

      {/* Archives numériques liées */}
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle2" fontWeight="bold">{t("physical.linkedDigitalArchives")}</Typography>
        {archivesData && <Chip label={archivesData.count} size="small" color="default" />}
      </Stack>
      {archLoading ? (
        <CircularProgress size={20} />
      ) : linkedArchives.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 0.5 }}>
          {t("physical.noLinkedArchiveRecord")}
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {linkedArchives.map((arc) => (
            <LinkedArchiveCard key={arc._id} arc={arc} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function DocumentDetail({ item, headers }: { item: PhysicalDocument; headers: Record<string, string> }) {
  const { t } = useTranslation();
  const [{ data: archivesData, loading: archLoading }] = useAxios<{
    document: string; count: number;
    archives: Array<{ _id: string; designation?: string; folder?: string; classNumber?: string; status?: string; validated?: boolean; fileUrl?: string }>;
  }>({ url: `/api/stuff/archives/physical/documents/${item._id}/archives`, headers });

  const linkedArchives = archivesData?.archives ?? [];

  return (
    <Stack spacing={1}>
      <DetailRow icon={<DescriptionOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.title")} value={item.title} />
      {item.description && <DetailRow icon={<InfoOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.description")} value={item.description} />}
      {item.nature && <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.nature")} value={item.nature} />}
      {item.documentDate && <DetailRow icon={<CalendarTodayOutlinedIcon fontSize="small" />} label={t("physical.detailLabels.documentDate")} value={new Date(item.documentDate).toLocaleDateString("fr-FR")} />}

      <Divider sx={{ my: 1 }} />
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <ArticleOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle2" fontWeight="bold">{t("physical.linkedDigitalArchives")}</Typography>
        {archivesData && <Chip label={archivesData.count} size="small" color="default" />}
      </Stack>
      {archLoading ? (
        <CircularProgress size={20} />
      ) : linkedArchives.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", pl: 0.5 }}>
          {t("physical.noLinkedArchiveDocument")}
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {linkedArchives.map((arc) => (
            <LinkedArchiveCard key={arc._id} arc={arc} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

// ── Composant principal ──────────────────────────────────────

export default function DetailPanel({ level, item, onDelete, headers }: DetailPanelProps) {
  const { t } = useTranslation();
  const itemLabel = useMemo(() => {
    const it = item as unknown as Record<string, unknown>;
    return (it.name ?? it.title ?? it.internalNumber ?? it.subject ?? (it.number !== undefined ? `Étage ${it.number}` : null) ?? it._id) as string;
  }, [item]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
        <Typography variant="body1" fontWeight="bold" sx={{ flex: 1 }}>
          {LEVEL_LABELS[level]}
        </Typography>
        <Chip label={LEVEL_LABELS[level]} size="small" variant="outlined" />
        <Tooltip title={t("physical.deleteTooltip")} placement="top">
          <IconButton size="small" color="error" onClick={() => onDelete(item._id, itemLabel)}>
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Divider sx={{ mb: 1.5 }} />

      {level === "container" && <ContainerDetail item={item as Container} />}
      {level === "shelf" && <ShelfDetail item={item as Shelf} />}
      {level === "floor" && <FloorDetail item={item as Floor} />}
      {level === "binder" && <BinderDetail item={item as Binder} />}
      {level === "record" && <RecordDetail item={item as PhysicalRecord} headers={headers} />}
      {level === "document" && <DocumentDetail item={item as PhysicalDocument} headers={headers} />}
    </Box>
  );
}
