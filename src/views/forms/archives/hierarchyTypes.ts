/**
 * Types et constantes partagés pour la navigation hiérarchique physique.
 *
 *   Conteneur → Étagère → Étage → Classeur → Dossier physique → Document
 */

import WarehouseOutlinedIcon      from "@mui/icons-material/WarehouseOutlined";
import LayersOutlinedIcon         from "@mui/icons-material/LayersOutlined";
import FolderOpenOutlinedIcon     from "@mui/icons-material/FolderOpenOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import ArticleOutlinedIcon        from "@mui/icons-material/ArticleOutlined";
import { createElement } from "react";

// ── Types ────────────────────────────────────────────────────

export type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";

export interface Item extends Record<string, unknown> {
  _id: string;
}

// ── Constantes ───────────────────────────────────────────────

export const LEVELS: Level[] = ["container", "shelf", "floor", "binder", "record", "document"];

export const LEVEL_LABELS: Record<Level, string> = {
  container : "Conteneur",
  shelf     : "Étagère",
  floor     : "Étage",
  binder    : "Classeur",
  record    : "Dossier physique",
  document  : "Document",
};

export const LEVEL_ICONS: Record<Level, React.ReactNode> = {
  container : createElement(WarehouseOutlinedIcon, { fontSize: "small" }),
  shelf     : createElement(LayersOutlinedIcon, { fontSize: "small" }),
  floor     : createElement(FolderOpenOutlinedIcon, { fontSize: "small" }),
  binder    : createElement(BookmarkBorderOutlinedIcon, { fontSize: "small" }),
  record    : createElement(ArticleOutlinedIcon, { fontSize: "small" }),
  document  : createElement(ArticleOutlinedIcon, { fontSize: "small" }),
};

// URL de l'API pour chaque niveau (parentId = _id du niveau supérieur)
export const levelUrl = (level: Level, parentId?: string, parentLevel?: Level) => {
  const base = "/api/stuff/archives/physical";
  switch (level) {
    case "container": return `${base}/containers`;
    case "shelf"    : return `${base}/shelves/container/${parentId}`;
    case "floor"    : return `${base}/floors/shelf/${parentId}`;
    case "binder"   : return `${base}/binders/floor/${parentId}`;
    case "record"   : return `${base}/records/binder/${parentId}`;
    case "document" : return parentLevel === "document"
      ? `${base}/documents/parent/${parentId}`
      : `${base}/documents/record/${parentId}`;
  }
};

export const EVENT_NAME = "__link_physical_record";
