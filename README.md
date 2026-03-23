# GEID Archives

Application de gestion électronique des archives numériques et physiques.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 18 + TypeScript |
| Build | Vite + SWC |
| UI | Material UI v5 + MUI X DataGrid + DatePickers |
| State | Redux Toolkit + redux-persist |
| HTTP | axios-hooks |
| PDF | @react-pdf/renderer (client) + pdfkit (serveur) |
| Recherche | Fuse.js (documentation) |
| Formulaires | react-hook-form + yup |

## Structure du projet

```
src/
├── assets/          # Images, logos, fichiers statiques
├── components/      # Composants réutilisables (HelpTip, DocTypeFrame, etc.)
├── configs/         # Configuration de l'application (app-config.json)
├── constants/       # Constantes partagées
│   ├── lifecycle.ts # Statuts, labels, couleurs du cycle de vie
│   └── physical.ts  # Hiérarchie physique (niveaux, labels, endpoints)
├── hooks/           # Hooks custom (useAxios, useToken, useArchivePermissions, etc.)
├── redux/           # Store Redux (app, user, data slices)
├── router/          # Configuration du routeur React
├── services/        # Couche API (api.ts)
├── types/           # Types TypeScript (api.ts, index.ts)
├── utils/           # Utilitaires (formatDate, deepMerge, navigateTo, etc.)
└── views/
    ├── content/     # Vues principales
    │   ├── archive-management-content/  # Gestion des archives
    │   │   ├── ArchiveManagementContent.tsx  # Orchestrateur principal
    │   │   ├── DetailPanel.tsx               # Panneau de détail
    │   │   ├── StatusChip.tsx                # Chip coloré du statut
    │   │   ├── DuaCell.tsx                   # Cellule DUA dans le DataGrid
    │   │   ├── columns.tsx                   # Colonnes du DataGrid
    │   │   └── helpers.ts                    # Fonctions utilitaires
    │   ├── physical-archive/            # Archivage physique
    │   │   ├── PhysicalArchiveContent.tsx    # Explorateur de fichiers
    │   │   └── DetailPanel.tsx               # Détail par niveau
    │   ├── dashboard/                   # Tableau de bord
    │   └── help/                        # Documentation + ManualPDF
    ├── forms/       # Formulaires et dialogues
    │   ├── archives/    # CRUD archives, rattachement, DUA
    │   ├── physical/    # Création entités physiques
    │   ├── search/      # Recherche globale (Ctrl+K)
    │   └── validate-form/  # Validation d'archives
    ├── header/      # Barre supérieure
    ├── navigation/  # Sidebar, tabs, menu
    └── cover/       # Page de connexion
```

## Hiérarchie d'archivage physique

```
Conteneur  (armoire, salle)
  └── Étagère  (rayon, travée)
       └── Niveau  (étage + unité administrative)
            └── Classeur  (nature + capacité max)
                 └── Dossier  (QR code unique)
                      └── Document  (récursif : sous-documents + archives)
```

## Imports

Les imports utilisent l'alias `@/` au lieu des chemins relatifs :

```ts
import useToken from "@/hooks/useToken";
import { STATUS_LABEL } from "@/constants/lifecycle";
import type { Archive } from "@/types";
```

## Cycle de vie des archives

| Statut | Description |
|--------|-------------|
| PENDING | En attente de validation |
| ACTIVE | Validée, en usage courant |
| SEMI_ACTIVE | Intermédiaire, DUA en cours |
| PERMANENT | Conservation définitive |
| DESTROYED | Éliminée |

## Développement

```bash
npm install
npm run dev     # Serveur de dev sur http://localhost:3000
npm run build   # Build de production dans dist/
```

## Déploiement

```bash
# 1. Commit + push les sources
git add . && git commit -m "message" && git push origin master

# 2. Build
npm run build

# 3. Copier dans le repo backend
rsync -av --delete dist/ ../GEID_Git/public/geid-platform/archives/dist/

# 4. Commit + push le backend (inclut le frontend)
cd ../GEID_Git && git add . && git commit -m "build: frontend" && git push origin main

# 5. Déployer sur le serveur
ssh geid "source ~/.nvm/nvm.sh && cd /root/server/GEID_Git && git pull origin main && pm2 restart GEID"
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SERVER_BASE_URL` | URL de l'API serveur |
| `VITE_BASE_URL` | Basename du routeur |
| `VITE_DEBUG` | Active le logging des requêtes API |
