/**
 * PhysicalTreeView — Arborescence complète de l'archivage physique.
 *
 * Utilise MUI X TreeView pour afficher la hiérarchie entière
 * avec chargement lazy (les enfants sont chargés au clic).
 * Chaque niveau a son icône et sa couleur distincte.
 *
 * Hiérarchie : Conteneur → Étagère → Niveau → Classeur → Dossier → Document
 */

import React, { useCallback, useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import WarehouseOutlinedIcon      from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon            from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon     from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon          from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon         from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon          from "@mui/icons-material/TopicOutlined";
import useAxios from "@/hooks/useAxios";
import scrollBarSx from "@/utils/scrollBarSx";

// ── Types ────────────────────────────────────────────────────

/** Niveau de la hiérarchie */
type Level = "container" | "shelf" | "floor" | "binder" | "record" | "document";

/** Noeud dans l'arbre */
interface TreeNode {
  id: string;
  label: string;
  level: Level;
  children?: TreeNode[];
  loaded?: boolean;
}

// ── Config icônes par niveau ─────────────────────────────────

const LEVEL_ICON: Record<Level, React.ReactNode> = {
  container: <WarehouseOutlinedIcon sx={{ fontSize: 18, color: "#5C6BC0" }} />,
  shelf:     <DnsOutlinedIcon sx={{ fontSize: 18, color: "#26A69A" }} />,
  floor:     <ViewStreamOutlinedIcon sx={{ fontSize: 18, color: "#42A5F5" }} />,
  binder:    <StyleOutlinedIcon sx={{ fontSize: 18, color: "#FFA726" }} />,
  record:    <FolderOutlinedIcon sx={{ fontSize: 18, color: "#AB47BC" }} />,
  document:  <TopicOutlinedIcon sx={{ fontSize: 18, color: "#78909C" }} />,
};

/** Niveau enfant de chaque niveau */
const CHILD_LEVEL: Record<Level, Level | null> = {
  container: "shelf",
  shelf:     "floor",
  floor:     "binder",
  binder:    "record",
  record:    "document",
  document:  "document",
};

// ── URLs API pour charger les enfants ────────────────────────

const BASE = "/api/stuff/archives/physical";

function childUrl(level: Level, parentId: string, parentLevel?: Level): string {
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

/** Extrait le label lisible d'un élément API */
function getLabel(item: Record<string, unknown>, level: Level): string {
  if (level === "floor") return item.label ? `${item.label}` : `Niveau ${item.number}`;
  if (level === "record") return (item.internalNumber as string) ?? (item.subject as string) ?? String(item._id);
  if (level === "document") return (item.title as string) ?? String(item._id);
  return (item.name as string) ?? String(item._id);
}

// ── Props ────────────────────────────────────────────────────

export interface PhysicalTreeViewProps {
  /** Headers HTTP (Authorization) */
  headers: Record<string, string>;
  /** Callback quand un noeud est sélectionné */
  onSelect?: (nodeId: string, level: Level, label: string) => void;
  /** ID du noeud actuellement sélectionné dans l'explorateur (surbrillance) */
  selectedId?: string | null;
  /** IDs des noeuds à développer (synchronisés avec le breadcrumb de l'explorateur) */
  expandedIds?: string[];
}

// ── Composant ────────────────────────────────────────────────

export default function PhysicalTreeView({ headers, onSelect, selectedId, expandedIds: externalExpanded }: PhysicalTreeViewProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  // IDs togglés manuellement par l'utilisateur (expand/collapse)
  const [userToggled, setUserToggled] = useState<Set<string>>(new Set());

  const [, fetchData] = useAxios({ headers }, { manual: true });

  // Charger les conteneurs au premier rendu
  const loadRoots = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);
    try {
      const res = await fetchData({ url: `${BASE}/containers` });
      const items = (res.data as Record<string, unknown>[]) ?? [];
      setNodes(items.map((item) => ({
        id: item._id as string,
        label: getLabel(item, "container"),
        level: "container" as Level,
        loaded: false,
      })));
    } catch {
      setNodes([]);
    }
  }, [initialized, fetchData]);

  // Charger les enfants d'un noeud au clic
  const loadChildren = useCallback(async (node: TreeNode) => {
    if (node.loaded) return;
    const nextLevel = CHILD_LEVEL[node.level];
    if (!nextLevel) return;

    setLoadingId(node.id);
    try {
      const url = childUrl(nextLevel, node.id, node.level);
      const res = await fetchData({ url });
      const items = (res.data as Record<string, unknown>[]) ?? [];
      const children: TreeNode[] = items.map((item) => ({
        id: item._id as string,
        label: getLabel(item, nextLevel),
        level: nextLevel,
        loaded: false,
      }));

      setNodes((prev) => updateNode(prev, node.id, { children, loaded: true }));
    } catch {
      setNodes((prev) => updateNode(prev, node.id, { children: [], loaded: true }));
    } finally {
      setLoadingId(null);
    }
  }, [fetchData]);

  // Fusionner : noeuds chargés + breadcrumb externe - noeuds fermés par l'utilisateur
  const mergedExpanded = useMemo(() => {
    const ids = new Set<string>();
    const collect = (list: TreeNode[]) => {
      list.forEach((n) => {
        if (n.children && n.children.length > 0) {
          ids.add(n.id);
          collect(n.children);
        }
      });
    };
    collect(nodes);
    (externalExpanded ?? []).forEach((id) => ids.add(id));
    // Retirer les noeuds fermés manuellement par l'utilisateur
    userToggled.forEach((id) => {
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
    });
    return [...ids];
  }, [nodes, externalExpanded, userToggled]);

  // Rendu récursif des noeuds
  const renderTree = (nodeList: TreeNode[]): React.ReactNode =>
    nodeList.map((node) => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={
          <Box display="flex" alignItems="center" gap={0.75} py={0.25}>
            {LEVEL_ICON[node.level]}
            <Typography variant="body2" noWrap sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" } }}>
              {node.label}
            </Typography>
            {loadingId === node.id && <CircularProgress size={12} sx={{ ml: 0.5 }} />}
          </Box>
        }
        onClick={() => {
          loadChildren(node);
          onSelect?.(node.id, node.level, node.label);
        }}
        sx={{
          "& > .MuiTreeItem-content": selectedId === node.id
            ? { bgcolor: "primary.main", color: "primary.contrastText", borderRadius: 1, "& *": { color: "inherit" } }
            : {},
        }}
      >
        {/* Placeholder pour que la flèche d'expansion s'affiche */}
        {!node.loaded ? <TreeItem nodeId={`${node.id}-placeholder`} label="" /> : null}
        {node.children && renderTree(node.children)}
      </TreeItem>
    ));

  // Charger les racines au montage
  React.useEffect(() => { loadRoots(); }, [loadRoots]);

  // Quand le breadcrumb externe change, réinitialiser les toggles manuels
  // et charger les enfants des noeuds non chargés
  React.useEffect(() => {
    // Réinitialiser les toggles pour suivre exactement le breadcrumb
    setUserToggled(new Set());
    if (!externalExpanded?.length) return;
    const findNode = (list: TreeNode[], id: string): TreeNode | null => {
      for (const n of list) {
        if (n.id === id) return n;
        if (n.children) {
          const found = findNode(n.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    for (const id of externalExpanded) {
      const node = findNode(nodes, id);
      if (node && !node.loaded) {
        loadChildren(node);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalExpanded]);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        ...scrollBarSx,
        py: 0.5,
      }}>
      {nodes.length === 0 && initialized ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <Typography variant="body2" color="text.secondary">Aucun conteneur</Typography>
        </Box>
      ) : (
        <TreeView
          expanded={mergedExpanded}
          onNodeToggle={(_e: React.SyntheticEvent, nodeIds: string[]) => {
            // Calculer la différence pour savoir quel noeud a été togglé
            const expanded = new Set(mergedExpanded);
            const newExpanded = new Set(nodeIds);
            setUserToggled((prev) => {
              const next = new Set(prev);
              // Noeuds qui ont été ouverts
              newExpanded.forEach((id) => {
                if (!expanded.has(id)) next.delete(id); // retirer du toggle = réouvrir
              });
              // Noeuds qui ont été fermés
              expanded.forEach((id) => {
                if (!newExpanded.has(id)) next.add(id); // ajouter au toggle = fermer
              });
              return next;
            });
          }}
          sx={{
            "& .MuiTreeItem-content": { borderRadius: 1, py: 0.25 },
            "& .MuiTreeItem-content:hover": { bgcolor: "action.hover" },
          }}
        >
          {renderTree(nodes)}
        </TreeView>
      )}
    </Box>
  );
}

// ── Utilitaire : mise à jour récursive d'un noeud ────────────

function updateNode(
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
