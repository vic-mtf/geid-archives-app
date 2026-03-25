/**
 * PhysicalTreeView — Arborescence complète de l'archivage physique.
 *
 * Utilise MUI X TreeView pour afficher la hiérarchie entière
 * avec chargement lazy (les enfants sont chargés au clic).
 * Chaque niveau a son icône et sa couleur distincte.
 *
 * Hiérarchie : Conteneur → Étagère → Niveau → Classeur → Dossier → Document
 */

import React, { useCallback, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import WarehouseOutlinedIcon      from "@mui/icons-material/WarehouseOutlined";
import DnsOutlinedIcon            from "@mui/icons-material/DnsOutlined";
import ViewStreamOutlinedIcon     from "@mui/icons-material/ViewStreamOutlined";
import StyleOutlinedIcon          from "@mui/icons-material/StyleOutlined";
import FolderOutlinedIcon         from "@mui/icons-material/FolderOutlined";
import TopicOutlinedIcon          from "@mui/icons-material/TopicOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded";
import useAxios from "@/hooks/useAxios";
import scrollBarSx from "@/utils/scrollBarSx";
import InlineEditableLabel from "./InlineEditableLabel";
import getFileIcon from "@/utils/getFileIcon";
import openArchiveFile from "@/utils/openArchiveFile";
import { DraggableArchive } from "./DndWrappers";
import { useDroppable } from "@dnd-kit/core";
import type { DocumentDropData } from "./useArchiveDnd";

/** Label droppable pour les documents dans le tree */
function DroppableDocLabel({ documentId, documentLabel, children }: {
  documentId: string;
  documentLabel: string;
  children: React.ReactNode;
}) {
  const data: DocumentDropData = { type: "document", documentId, documentLabel };
  const { setNodeRef, isOver } = useDroppable({ id: `tree-doc-${documentId}`, data });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex",
        alignItems: "center",
        flex: 1,
        borderRadius: 0.5,
        bgcolor: isOver ? "primary.50" : "transparent",
        outline: isOver ? "2px dashed" : "none",
        outlineColor: "primary.main",
        transition: "background-color 0.1s",
      }}
    >
      {children}
    </Box>
  );
}

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
  /** Pour les archives numériques affichées comme feuilles */
  isArchive?: boolean;
  fileUrl?: string;
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

/** Élément du chemin de navigation */
export interface PathItem {
  id: string;
  label: string;
  level: Level;
}

export interface PhysicalTreeViewProps {
  headers: Record<string, string>;
  onSelect?: (path: PathItem[]) => void;
  selectedId?: string | null;
  expandedIds?: string[];
  /** Compteur de version — quand il change, l'arbre recharge ses racines */
  dataVersion?: number;
  /** Menu contextuel (clic droit) sur un noeud physique */
  onContextMenu?: (e: React.MouseEvent, id: string, label: string, level: Level) => void;
  /** Menu contextuel (clic droit) sur une archive numérique dans le tree */
  onArchiveContextMenu?: (e: React.MouseEvent, archiveId: string, label: string) => void;
  /** L'utilisateur peut modifier (renommer, etc.) */
  canWrite?: boolean;
  /** Afficher uniquement ce conteneur (si défini) */
  activeContainerId?: string;
  /** Renommer un noeud — appelé avec (id, level, newValue) */
  onRename?: (id: string, level: Level, newValue: string) => Promise<void>;
  /** ID du noeud à forcer en mode édition (depuis le menu contextuel) */
  renamingId?: string | null;
  /** Appelé quand le mode édition se termine */
  onRenamingEnd?: () => void;
}

// ── Composant ────────────────────────────────────────────────

export default function PhysicalTreeView({ headers, onSelect, selectedId, expandedIds: externalExpanded, dataVersion, onContextMenu, onArchiveContextMenu, canWrite, onRename, renamingId, onRenamingEnd, activeContainerId }: PhysicalTreeViewProps) {
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // État d'expansion unique — géré directement par onNodeToggle
  const [expanded, setExpanded] = useState<string[]>([]);

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

  // Charger les enfants d'un noeud (+ archives liées pour les documents)
  const loadChildren = useCallback(async (node: TreeNode) => {
    if (node.loaded || node.isArchive) return;
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

      // Charger les archives liées pour les documents
      if (node.level === "document") {
        try {
          const archRes = await fetchData({ url: `${BASE}/documents/${node.id}/archives` });
          const archData = archRes.data as { archives?: Array<Record<string, unknown>> };
          const archives = archData?.archives ?? [];
          for (const arc of archives) {
            children.push({
              id: arc._id as string,
              label: (arc.designation as string) ?? "Archive",
              level: "document",
              isArchive: true,
              fileUrl: arc.fileUrl as string | undefined,
              loaded: true,
            });
          }
        } catch { /* pas d'archives liées */ }
      }

      setNodes((prev) => updateNode(prev, node.id, { children, loaded: true }));
      setExpanded((prev) => prev.includes(node.id) ? prev : [...prev, node.id]);
    } catch {
      setNodes((prev) => updateNode(prev, node.id, { children: [], loaded: true }));
    } finally {
      setLoadingId(null);
    }
  }, [fetchData]);

  // Map id→node pour accès rapide dans onNodeToggle
  const nodeMapRef = React.useRef<Map<string, TreeNode>>(new Map());
  React.useEffect(() => {
    const map = new Map<string, TreeNode>();
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        map.set(n.id, n);
        if (n.children) walk(n.children);
      }
    };
    walk(nodes);
    nodeMapRef.current = map;
  }, [nodes]);

  // Rendu récursif — chaque noeud connaît son chemin complet depuis la racine
  const renderTree = (nodeList: TreeNode[], parentPath: PathItem[] = []): React.ReactNode =>
    nodeList.map((node) => {
      const nodePath: PathItem[] = [...parentPath, { id: node.id, label: node.label, level: node.level }];

      // Archive numérique = feuille draggable, clic = ouvrir le fichier
      if (node.isArchive) {
        const fi = getFileIcon(node.fileUrl ?? node.label);
        return (
          <DraggableArchive key={node.id} archiveId={node.id} archiveLabel={node.label} sourceDocumentId={[...parentPath].reverse().find((p) => p.level === "document")?.id} disabled={!canWrite}>
          <TreeItem
            nodeId={node.id}
            icon={React.cloneElement(fi.icon, { sx: { fontSize: 16, color: fi.color } })}
            label={
              <Box
                display="flex"
                alignItems="center"
                gap={0.5}
                py={0.25}
                onClick={(e) => { e.stopPropagation(); openArchiveFile(node.id, node.label); }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onArchiveContextMenu?.(e, node.id, node.label);
                }}
                sx={{ cursor: canWrite ? "grab" : "pointer" }}
              >
                <Typography variant="body2" noWrap sx={{ fontSize: "0.8rem", opacity: 0.85 }}>
                  {node.label}
                </Typography>
              </Box>
            }
            sx={{
              "& > .MuiTreeItem-content .MuiTreeItem-iconContainer": { width: 20 },
            }}
          />
          </DraggableArchive>
        );
      }

      const isDocNode = node.level === "document";
      const labelContent = (
        <Box
          display="flex"
          alignItems="center"
          gap={0.75}
          py={0.25}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(nodePath);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu?.(e, node.id, node.label, node.level);
          }}
        >
          {LEVEL_ICON[node.level]}
          <InlineEditableLabel
            value={node.label}
            editable={canWrite ?? false}
            forceEdit={renamingId === node.id}
            onEditEnd={onRenamingEnd}
            onSave={async (newValue) => {
              await onRename?.(node.id, node.level, newValue);
              setNodes((prev) => updateNode(prev, node.id, { label: newValue }));
            }}
            variant="body2"
            noWrap
            sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" } }}
          />
          {loadingId === node.id && <CircularProgress size={12} sx={{ ml: 0.5 }} />}
        </Box>
      );

      const treeItemEl = (
        <TreeItem
          key={node.id}
          nodeId={node.id}
          label={isDocNode && canWrite
            ? <DroppableDocLabel documentId={node.id} documentLabel={node.label}>{labelContent}</DroppableDocLabel>
            : labelContent
          }
          sx={{
            "& > .MuiTreeItem-content": selectedId === node.id
              ? { bgcolor: "action.selected", fontWeight: 500 }
              : {},
          }}
        >
          {!node.loaded ? <TreeItem nodeId={`${node.id}-placeholder`} label="" /> : null}
          {node.children && renderTree(node.children, nodePath)}
        </TreeItem>
      );

      return treeItemEl;
    });

  // Charger les racines au montage
  React.useEffect(() => { loadRoots(); }, [loadRoots]);

  // Auto-charger les enfants du conteneur actif quand il change
  React.useEffect(() => {
    if (!activeContainerId) return;
    const container = nodes.find((n) => n.id === activeContainerId);
    if (container && !container.loaded) {
      loadChildren(container);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContainerId, nodes.length]);

  // Recharger l'arbre quand les données changent (suppression, création, etc.)
  React.useEffect(() => {
    if (!dataVersion || dataVersion <= 0) return;

    const reloadTree = async () => {
      try {
        const res = await fetchData({ url: `${BASE}/containers` });
        const items = (res.data as Record<string, unknown>[]) ?? [];
        let tree: TreeNode[] = items.map((item) => ({
          id: item._id as string,
          label: getLabel(item, "container"),
          level: "container" as Level,
          loaded: false,
        }));

        // Ré-ouvrir le chemin le long du breadcrumb externe
        const newExpanded: string[] = [];
        if (externalExpanded?.length) {
          for (const expandedId of externalExpanded) {
            const node = findInTree(tree, expandedId);
            if (node && !node.loaded) {
              const nextLevel = CHILD_LEVEL[node.level];
              if (nextLevel) {
                try {
                  const url = childUrl(nextLevel, node.id, node.level);
                  const childRes = await fetchData({ url });
                  const childItems = (childRes.data as Record<string, unknown>[]) ?? [];
                  const children: TreeNode[] = childItems.map((item) => ({
                    id: item._id as string,
                    label: getLabel(item, nextLevel),
                    level: nextLevel,
                    loaded: false,
                  }));
                  tree = updateNode(tree, node.id, { children, loaded: true });
                  newExpanded.push(node.id);
                } catch { /* ignore */ }
              }
            }
          }
        }

        setNodes(tree);
        setExpanded(newExpanded);
        setInitialized(true);
      } catch {
        setNodes([]);
        setInitialized(true);
      }
    };

    reloadTree();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  // Quand le breadcrumb change depuis l'explorateur, ouvrir les noeuds du chemin
  // et charger les enfants non chargés
  React.useEffect(() => {
    if (!externalExpanded?.length) return;

    // Ajouter les IDs du chemin à expanded
    setExpanded((prev) => {
      const set = new Set(prev);
      externalExpanded.forEach((id) => set.add(id));
      return [...set];
    });

    // Charger les enfants non chargés
    for (const id of externalExpanded) {
      const node = findInTree(nodes, id);
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
        px: 0.75,
      }}>
      {(() => {
        if (nodes.length === 0 && initialized) return true;
        if (activeContainerId) {
          const c = nodes.find((n) => n.id === activeContainerId);
          if (c?.loaded && (!c.children || c.children.length === 0)) return true;
        }
        return false;
      })() ? (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" py={4} flex={1} gap={1}>
          <Box sx={{ fontSize: 36, color: "text.disabled", display: "flex" }}>
            <WarehouseOutlinedIcon fontSize="inherit" />
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center" px={2}>
            {nodes.length === 0 ? "Aucun conteneur" : "Ce conteneur est vide"}
          </Typography>
          <Typography variant="caption" color="text.disabled" textAlign="center" px={2}>
            {nodes.length === 0 ? "Créez votre premier conteneur pour commencer" : "Commencez par ajouter une étagère"}
          </Typography>
        </Box>
      ) : (
        <TreeView
          defaultCollapseIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 20, color: "text.primary" }} />}
          defaultExpandIcon={<KeyboardArrowRightRoundedIcon sx={{ fontSize: 20, color: "text.disabled" }} />}
          expanded={expanded}
          onNodeToggle={(_e: React.SyntheticEvent, nodeIds: string[]) => {
            // Chevron cliqué → toggle direct
            setExpanded(nodeIds);
            // Charger les enfants des noeuds nouvellement ouverts
            const prev = new Set(expanded);
            for (const id of nodeIds) {
              if (!prev.has(id)) {
                const node = nodeMapRef.current.get(id);
                if (node && !node.loaded) loadChildren(node);
              }
            }
          }}
          sx={{
            "& .MuiTreeItem-content": { borderRadius: 1, py: 0.25, cursor: "pointer" },
            "& .MuiTreeItem-content:hover": { bgcolor: "action.hover" },
            "& .MuiTreeItem-iconContainer": { color: "text.secondary" },
            // Lignes de connexion verticales et horizontales entre les niveaux
            "& .MuiTreeItem-group": {
              ml: 2,
              pl: 1.5,
              borderLeft: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          {(() => {
            if (!activeContainerId) return renderTree(nodes);
            const container = nodes.find((n) => n.id === activeContainerId);
            if (!container) return renderTree(nodes);
            // Chargé mais vide → message
            if (container.loaded && (!container.children || container.children.length === 0)) {
              return null; // Le message vide est affiché en dehors du TreeView
            }
            // Pas encore chargé → placeholder pour le load
            if (!container.loaded) return renderTree([container]);
            return renderTree(container.children ?? [], [{ id: container.id, label: container.label, level: container.level }]);
          })()}
        </TreeView>
      )}
    </Box>
  );
}

// ── Utilitaires ───────────────────────────────────────────────

/** Recherche récursive d'un noeud par ID */
function findInTree(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

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
