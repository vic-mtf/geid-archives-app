/**
 * HelpContent — Guide utilisateur complet de l'application GEID Archives.
 * Chaque section porte un id HTML pour être ciblée par les liens internes (HelpTip).
 */

import { useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Divider,
  Chip,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from "@mui/material";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import { useLocation } from "react-router-dom";

// ── Composants internes ──────────────────────────────────────

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Typography
      id={id}
      variant="h6"
      fontWeight={700}
      gutterBottom
      sx={{ scrollMarginTop: 80, mt: 3 }}>
      {children}
    </Typography>
  );
}

function SubTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <Typography id={id} variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 0.5, scrollMarginTop: 80 }}>
      {children}
    </Typography>
  );
}

function Desc({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary" paragraph>
      {children}
    </Typography>
  );
}

function FieldDoc({
  label,
  required,
  example,
  children,
}: {
  label: string;
  required?: boolean;
  example?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Typography variant="body2" fontWeight={700}>
          {label}
        </Typography>
        {required && <Chip label="Requis" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {children}
      </Typography>
      {example && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
          Exemple : <em>{example}</em>
        </Typography>
      )}
    </Paper>
  );
}

// ── Composant principal ──────────────────────────────────────

export default function HelpContent() {
  const location = useLocation();
  const anchor = (location.state as Record<string, unknown> | null)?.helpAnchor as string | undefined;
  const scrolledRef = useRef(false);

  // Scroll vers l'ancre transmise depuis HelpTip
  useEffect(() => {
    if (anchor && !scrolledRef.current) {
      scrolledRef.current = true;
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [anchor]);

  return (
    <Box sx={{ maxWidth: 780, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>

      {/* ── En-tête ── */}
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Guide utilisateur — GEID Archives
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Ce guide décrit l'ensemble des fonctionnalités de l'application de gestion des archives GEID.
        Il couvre la soumission des documents, la validation, l'archivage physique et la gestion des
        archives validées.
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5 }}>
        Utilisez le menu latéral gauche pour naviguer entre les différentes sections de l'application.
        Ce guide est accessible à tout moment depuis l'onglet <strong>Aide</strong>.
      </Alert>

      <Divider sx={{ mb: 2 }} />

      {/* ══════════════════════════════════════════════════
          1. VUE D'ENSEMBLE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="vue-ensemble">1. Vue d'ensemble</SectionTitle>
      <Desc>
        GEID Archives est une plateforme centralisée de gestion documentaire. Elle permet de soumettre
        des documents numériques au service d'archivage, de les valider avec les métadonnées
        réglementaires, de les retrouver et de gérer leur rangement physique dans les locaux.
      </Desc>

      <SubTitle>Cycle de vie d'un document</SubTitle>
      <List dense>
        {[
          { step: "1", text: "Un agent soumet un document numérique (PDF, image…) via le formulaire «\u00a0À valider\u00a0»." },
          { step: "2", text: "L'archiviste examine le document et le valide avec un numéro de classification et de référence." },
          { step: "3", text: "Le document validé apparaît dans «\u00a0Archives validées\u00a0» et peut être modifié ou supprimé si nécessaire." },
          { step: "4", text: "Optionnellement, un dossier physique (classeur) est créé dans l'espace d'archivage physique." },
        ].map(({ step, text }) => (
          <ListItem key={step} disableGutters>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Chip label={step} size="small" color="primary" sx={{ width: 24, height: 24, fontSize: "0.7rem" }} />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          2. TABLEAU DE BORD
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="tableau-de-bord">2. Tableau de bord</SectionTitle>
      <Desc>
        Le tableau de bord offre une vue synthétique de l'état du service d'archivage : nombre de
        documents en attente de validation, dernières archives ajoutées et indicateurs d'activité.
        C'est le point d'entrée par défaut de l'application.
      </Desc>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          3. À VALIDER
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="a-valider">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <InventoryOutlinedIcon fontSize="small" />
          <span>3. À valider — documents en attente</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Cette section liste tous les documents numériques soumis au service d'archivage mais qui
        n'ont pas encore été validés. Chaque ligne représente un document en attente de traitement.
      </Desc>

      <SubTitle>Colonnes du tableau</SubTitle>
      <FieldDoc label="Désignation" required>
        Titre court et descriptif du document, tel qu'il a été saisi lors de la soumission.
      </FieldDoc>
      <FieldDoc label="Type / Sous-type">
        Catégorie documentaire (ex : Rapport, Contrat, Correspondance) et sa sous-catégorie.
        Utilisés pour le classement thématique.
      </FieldDoc>
      <FieldDoc label="N° de classe">
        Numéro de classification définitif attribué lors de la validation.
        Vide si le document n'est pas encore validé.
      </FieldDoc>
      <FieldDoc label="N° de référence">
        Référence interne du document dans le système de l'organisation.
      </FieldDoc>
      <FieldDoc label="Description">
        Résumé du contenu du document pour faciliter la recherche et l'identification.
      </FieldDoc>
      <FieldDoc label="Statut">
        Indique si le document est <strong>Validé</strong> (puce verte) ou en attente (puce grise).
        Cliquer sur une ligne validée ouvre le fichier associé.
      </FieldDoc>

      <SubTitle id="formulaire-soumission">Soumettre un document</SubTitle>
      <Desc>
        Le bouton «\u00a0Soumettre\u00a0» (ou l'action correspondante) ouvre le formulaire d'envoi. Remplissez
        chaque champ avec soin — ces informations servent de base au travail de l'archiviste.
      </Desc>

      <FieldDoc label="Désignation" required example="Rapport annuel RH 2024">
        Intitulé principal du document. Doit être suffisamment précis pour identifier le document
        sans avoir besoin de l'ouvrir. Évitez les abréviations.
      </FieldDoc>
      <FieldDoc label="Type documentaire" required example="Rapport / Rapport annuel">
        Sélectionnez d'abord le type principal (famille de documents), puis la sous-catégorie
        (typologie). Ces valeurs sont prédéfinies par le service d'archives.
      </FieldDoc>
      <FieldDoc label="Activité / Mission / Dossier" required example="Gestion des ressources humaines">
        Nom du projet, de la mission ou du service émetteur du document. Permet de regrouper les
        archives par activité métier.
      </FieldDoc>
      <FieldDoc label="Description" required example="Synthèse des effectifs, bilans de formation et indicateurs RH pour l'année 2024.">
        Résumé libre du contenu du document. Soyez précis : cette description est la principale
        source d'information pour retrouver le document ultérieurement.
      </FieldDoc>

      <SubTitle id="validation">Valider un document</SubTitle>
      <Desc>
        Sélectionnez un seul document dans la liste, puis cliquez sur «\u00a0Valider\u00a0». Le formulaire de
        validation s'ouvre et demande les informations suivantes :
      </Desc>

      <FieldDoc label="Numéro de classification" required example="2024-ADM-001">
        Code alphanumérique structuré attribué par le service d'archives selon le plan de classement
        officiel. Minimum 5 caractères. Ce numéro est unique et permet de localiser le document dans
        les répertoires physiques et numériques.
      </FieldDoc>
      <FieldDoc label="Numéro de référence" required example="REF-DRH-2024-042">
        Identifiant interne utilisé dans les systèmes de gestion de l'organisation (GED, ERP…).
        Sert de pont entre GEID Archives et les autres systèmes métier.
      </FieldDoc>
      <FieldDoc label="Profil d'accès" example="Ressources humaines, Direction">
        Indique qui est autorisé à consulter ce document (service, rôle ou niveau de confidentialité).
        Laisser vide si aucune restriction particulière.
      </FieldDoc>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          4. ARCHIVES VALIDÉES
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="archives-validees">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <ManageHistoryIcon fontSize="small" />
          <span>4. Archives validées</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Cette section regroupe l'ensemble des documents qui ont été validés par le service d'archives.
        Ils sont classés, référencés et consultables. Depuis ce panneau, vous pouvez modifier les
        métadonnées d'un document ou le supprimer définitivement.
      </Desc>

      <SubTitle>Sélectionner des éléments</SubTitle>
      <Desc>
        Cochez les cases à gauche du tableau pour sélectionner un ou plusieurs documents.
        La sélection active les boutons d'action dans la barre d'outils :
      </Desc>
      <List dense>
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutlineIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary={<Typography variant="body2"><strong>Valider</strong> — disponible pour 1 seul document sélectionné. Ouvre le formulaire de validation.</Typography>} />
        </ListItem>
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutlineIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary={<Typography variant="body2"><strong>Modifier</strong> — disponible pour 1 seul document. Permet de mettre à jour la désignation, la description et les mots-clés.</Typography>} />
        </ListItem>
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleOutlineIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary={<Typography variant="body2"><strong>Supprimer</strong> — disponible pour 1 ou plusieurs documents. Affiche une confirmation avant suppression définitive.</Typography>} />
        </ListItem>
      </List>

      <SubTitle id="modifier-archive">Modifier une archive</SubTitle>
      <FieldDoc label="Désignation" required example="Rapport annuel RH 2024 (mis à jour)">
        Titre du document. Modifiez-le pour corriger une faute ou préciser l'intitulé.
      </FieldDoc>
      <FieldDoc label="Description" required>
        Résumé du contenu. Peut être enrichi après relecture du document.
      </FieldDoc>
      <FieldDoc label="Mots-clés" example="rapport, RH, 2024, effectifs">
        Liste de termes séparés par des virgules facilitant la recherche plein texte.
        Entrez autant de mots-clés pertinents que nécessaire.
      </FieldDoc>

      <Alert severity="warning" sx={{ mt: 1, mb: 2, borderRadius: 1.5 }}>
        La suppression d'une archive est <strong>irréversible</strong>. Le fichier associé est
        également supprimé du serveur. Procédez avec précaution.
      </Alert>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          5. ARCHIVAGE PHYSIQUE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="archivage-physique">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <AccountBalanceOutlinedIcon fontSize="small" />
          <span>5. Archivage physique</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Cette section gère l'espace de stockage physique des archives sur papier. Elle est organisée
        selon une hiérarchie en 5 niveaux, du plus grand au plus petit :
      </Desc>

      <Stack spacing={1} mb={2}>
        {[
          { icon: <WarehouseOutlinedIcon />,         label: "Conteneur",  desc: "Grande unité de stockage physique (armoire, local, salle). Niveau racine de la hiérarchie." },
          { icon: <LayersOutlinedIcon />,             label: "Étagère",    desc: "Rangée à l'intérieur d'un conteneur. Un conteneur peut contenir plusieurs étagères." },
          { icon: <FolderOutlinedIcon />,             label: "Étage",      desc: "Compartiment numéroté d'une étagère, associé à une unité administrative responsable." },
          { icon: <BookmarkBorderOutlinedIcon />,     label: "Classeur",   desc: "Reliure physique contenant des dossiers papier. Chaque classeur a une nature (ex : RH, FINANCE) et une capacité maximale." },
          { icon: <ArticleOutlinedIcon />,            label: "Dossier",    desc: "Document ou ensemble de pièces physiques rangé dans un classeur. Niveau le plus fin." },
        ].map(({ icon, label, desc }) => (
          <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
              <Box>
                <Typography variant="body2" fontWeight={700}>{label}</Typography>
                <Typography variant="body2" color="text.secondary">{desc}</Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <SubTitle id="conteneur">Créer un conteneur</SubTitle>
      <FieldDoc label="Nom" required example="Armoire A — Bâtiment Principal">
        Identifiant lisible du conteneur. Choisissez un nom qui permet de le localiser physiquement
        sans ambiguïté.
      </FieldDoc>
      <FieldDoc label="Localisation" example="Salle des archives, Niveau 0, Couloir B">
        Adresse précise dans les locaux. Facilite la recherche lors des consultations physiques.
      </FieldDoc>
      <FieldDoc label="Description" example="Armoire métallique verrouillée réservée aux dossiers RH antérieurs à 2020.">
        Informations complémentaires sur le contenu, les restrictions d'accès ou les conditions
        de conservation.
      </FieldDoc>

      <SubTitle id="etagere">Créer une étagère</SubTitle>
      <FieldDoc label="Nom" required example="Étagère 1 — Haut">
        Désignation de la rangée. Indiquez sa position (haut, milieu, bas) pour faciliter
        la localisation physique.
      </FieldDoc>
      <FieldDoc label="Description" example="Réservée aux classeurs antérieurs à 2018.">
        Description optionnelle du contenu prévu ou effectif de cette rangée.
      </FieldDoc>

      <SubTitle id="etage">Créer un étage</SubTitle>
      <FieldDoc label="Numéro" required example="1, 2, 3…">
        Numéro entier identifiant la position de l'étage sur l'étagère. Commence généralement à 1.
      </FieldDoc>
      <FieldDoc label="Libellé" example="Dossiers actifs 2023-2024">
        Description libre de ce niveau, utilisée dans les rapports d'inventaire.
      </FieldDoc>
      <FieldDoc label="Unité administrative" required example="ID du service RH dans le système">
        Identifiant (_id) du service ou de l'unité organisationnelle responsable des documents
        stockés à cet étage. Consultez l'administrateur du système pour obtenir cet identifiant.
      </FieldDoc>

      <SubTitle id="classeur">Créer un classeur</SubTitle>
      <FieldDoc label="Nom" required example="Classeur Contrats 2024-01">
        Titre du classeur. Doit permettre d'identifier rapidement son contenu.
      </FieldDoc>
      <FieldDoc label="Nature" required example="RH, FINANCE, JURIDIQUE">
        Catégorie thématique du classeur en MAJUSCULES. La nature du classeur détermine
        quels types de dossiers peuvent y être rangés — un dossier doit avoir la même nature
        que son classeur parent.
      </FieldDoc>
      <FieldDoc label="Capacité maximale" required example="50">
        Nombre maximum de dossiers physiques pouvant être rangés dans ce classeur.
        Empêche le suremplissage et facilite la gestion de l'inventaire.
      </FieldDoc>

      <SubTitle id="dossier-physique">Créer un dossier physique</SubTitle>
      <FieldDoc label="N° interne" required example="DOS-2024-0042">
        Code unique attribué à ce dossier par le service d'archives. Suit généralement
        un format standardisé : TYPE-ANNÉE-NUMÉRO.
      </FieldDoc>
      <FieldDoc label="N° de référence" required example="REF-DRH-042">
        Référence croisée avec le système d'information de l'organisation (GED, ERP, etc.).
      </FieldDoc>
      <FieldDoc label="Objet" required example="Contrat de travail — M. Dupont">
        Intitulé précis du dossier décrivant son contenu principal.
      </FieldDoc>
      <FieldDoc label="Catégorie" required example="Contrats, Correspondances, Marchés">
        Famille documentaire à laquelle appartient ce dossier. Utilisée pour le filtrage
        et les statistiques d'archivage.
      </FieldDoc>
      <FieldDoc label="Nature" required example="RH">
        Doit correspondre exactement à la nature du classeur parent. En MAJUSCULES.
        Cette cohérence est vérifiée par le système lors de l'enregistrement.
      </FieldDoc>
      <FieldDoc label="Date d'édition" required>
        Date à laquelle le document original a été produit ou signé. Format : JJ/MM/AAAA.
      </FieldDoc>
      <FieldDoc label="Date d'archivage" required>
        Date à laquelle le dossier a été physiquement intégré aux archives. Généralement
        la date du jour de création de la fiche.
      </FieldDoc>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          6. GLOSSAIRE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="glossaire">6. Glossaire</SectionTitle>
      <Stack spacing={1}>
        {[
          { term: "Archive",           def: "Document numérique soumis au service d'archivage, avec ou sans validation." },
          { term: "Validation",        def: "Processus par lequel un archiviste attribue un numéro de classification et de référence à un document, le rendant officiel." },
          { term: "Numéro de classification", def: "Code structuré (ex : 2024-ADM-001) issu du plan de classement officiel de l'organisation." },
          { term: "Numéro de référence", def: "Identifiant interne du document dans les autres systèmes de l'organisation (GED, ERP…)." },
          { term: "Nature",            def: "Catégorie thématique d'un classeur ou d'un dossier physique (ex : RH, FINANCE). Doit être en MAJUSCULES." },
          { term: "Conteneur",         def: "Unité physique de stockage de niveau supérieur (armoire, local)." },
          { term: "Étagère",           def: "Rangée à l'intérieur d'un conteneur." },
          { term: "Étage",             def: "Compartiment numéroté d'une étagère, rattaché à une unité administrative." },
          { term: "Classeur",          def: "Reliure physique avec une nature et une capacité maximale de dossiers." },
          { term: "Dossier physique",  def: "Unité documentaire physique rangée dans un classeur." },
          { term: "Mots-clés (tags)",  def: "Termes libres séparés par des virgules, facilitant la recherche plein texte dans les archives." },
          { term: "Profil d'accès",    def: "Rôle ou service autorisé à consulter un document archivé." },
        ].map(({ term, def }) => (
          <Paper key={term} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>{term}</Typography>
            <Typography variant="body2" color="text.secondary">{def}</Typography>
          </Paper>
        ))}
      </Stack>

      <Box height={40} />
    </Box>
  );
}
