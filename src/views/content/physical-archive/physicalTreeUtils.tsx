/**
 * physicalTreeUtils — Types, config et utilitaires pour PhysicalTreeView.
 */

import React from "react";
import WarehouseOutlinedIcon      from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon            from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon     from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon          from "@mui/icons-material/StyleOutlined";
import FolderRoundedIcon         from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon          from "@mui/icons-material/TopicOutlined";

// ── Types ────────────────────────────────────────────────────

export type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";

export interface TreeNode {
  id: string;
  label: string;
  level: Level;
  children?: TreeNode[];
  loaded?: boolean;
  isArchive?: boolean;
  fileUrl?: string;
}

export interface PathItem {
  id: string;
  label: string;
  level: Level;
}

// ── Config icônes par niveau ─────────────────────────────────

export const LEVEL_ICON: Record<Level, React.ReactNode> = {
  container: <WarehouseOutlinedIcon sx={{ fontSize: 18, color: "#5C6BC0" }} />,
  shelf:     <DnsOutlinedIcon sx={{ fontSize: 18, color: "#26A69A" }} />,
  floor:     <ViewStreamOutlinedIcon sx={{ fontSize: 18, color: "#42A5F5" }} />,
  binder:    <StyleOutlinedIcon sx={{ fontSize: 18, color: "#FFA726" }} />,
  record:    <FolderRoundedIcon sx={{ fontSize: 18, color: "#AB47BC" }} />,
  document:  <TopicOutlinedIcon sx={{ fontSize: 18, color: "#78909C" }} />,
};

export const CHILD_LEVEL: Record<Level, Level | null> = {
  container: "shelf",
  shelf:     "floor",
  floor:     "binder",
  binder:    "record",
  record:    "document",
  document:  "document",
};

// ── URLs API ─────────────────────────────────────────────────

export const BASE = "/api/stuff/archives/physical";

export function childUrl(level: Level, parentId: string, parentLevel?: Level): string {
  switch (level) {
    case "shelf":    return `${BASE}/shelves/container/${parentId}`;
    case "floor":    return `${BASE}/floors/shelf/${parentId}`;
    case "binder":   return `${BASE}/binders/floor/${parentId}`;
    case "record":   return `${BASE}/records/binder/${parentId}`;
    case "document": return parentLevel === "document"
      ? `${BASE}/documents/parent/${parentId}`
      : `${BASE}/documents/record/${parentId}`;
    default:         return `${BASE}/containers`;
  }
}

export function getLabel(item: Record<string, unknown>, level: Level): string {
  if (level === "floor") return item.label ? `${item.label}` : `Niveau ${item.number}`;
  if (level === "record") return (item.internalNumber as string) ?? (item.subject as string) ?? String(item._id);
  if (level === "document") return (item.title as string) ?? String(item._id);
  return (item.name as string) ?? String(item._id);
}

// ── Utilitaires d'arbre ──────────────────────────────────────

export function findInTree(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateNode(
  nodes: TreeNode[],
  targetId: string,
  update: Partial<TreeNode>,
): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === targetId) return { ...n, ...update };
    if (n.children) return { ...n, children: updateNode(n.children, targetId, update) };
    return n;
  });
}
