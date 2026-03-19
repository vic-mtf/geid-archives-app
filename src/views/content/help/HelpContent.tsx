/**
 * HelpContent — Manuel utilisateur complet de l'application GEID Archives.
 * Chaque section porte un id HTML pour être ciblée depuis les bulles d'aide (HelpTip).
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
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
    <Typography
      id={id}
      variant="subtitle1"
      fontWeight={600}
      sx={{ mt: 2.5, mb: 0.5, scrollMarginTop: 80 }}>
      {children}
    </Typography>
  );
}

function Desc({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
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
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.2, borderRadius: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Typography variant="body2" fontWeight={700}>
          {label}
        </Typography>
        {required && (
          <Chip
            label="Obligatoire"
            size="small"
            color="error"
            variant="outlined"
            sx={{ height: 18, fontSize: "0.65rem" }}
          />
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {children}
      </Typography>
      {example && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 0.5, display: "block" }}>
          Exemple : <em>{example}</em>
        </Typography>
      )}
    </Paper>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        bgcolor: "action.hover",
        borderRadius: 1.5,
        p: 1.5,
        mb: 2,
      }}>
      <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0, mt: 0.1 }} />
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Box>
  );
}

// ── Composant principal ──────────────────────────────────────

export default function HelpContent() {
  const location = useLocation();
  const anchor = (location.state as Record<string, unknown> | null)?.helpAnchor as
    | string
    | undefined;
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (anchor && !scrolledRef.current) {
      scrolledRef.current = true;
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [anchor]);

  return (
    <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>

      {/* ── En-tête ── */}
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Manuel utilisateur — GEID Archives
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Ce manuel décrit en détail le fonctionnement de l'application de gestion documentaire GEID
        Archives. Il est destiné à tous les utilisateurs : agents soumetteurs, archivistes et
        administrateurs. Lisez chaque section correspondant à votre rôle pour maîtriser
        l'application rapidement.
      </Typography>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5 }}>
        Ce guide est accessible à tout moment depuis l'onglet <strong>Aide</strong> dans le menu de
        navigation à gauche. Utilisez les sections ci-dessous pour naviguer.
      </Alert>

      <Divider sx={{ mb: 2 }} />

      {/* ══════════════════════════════════════════════════
          TABLE DES MATIÈRES
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="sommaire">Sommaire</SectionTitle>
      <List dense sx={{ mb: 1 }}>
        {[
          { id: "vue-ensemble", label: "1. Vue d'ensemble de l'application" },
          { id: "navigation", label: "2. Navigation et interface" },
          { id: "tableau-de-bord", label: "3. Tableau de bord" },
          { id: "a-valider", label: "4. À valider — soumettre et valider des documents" },
          { id: "archives-validees", label: "5. Archives validées — gérer les archives officielles" },
          { id: "cycle-de-vie", label: "6. Cycle de vie des documents — transitions et historique" },
          { id: "archivage-physique", label: "7. Archivage physique — gestion des espaces de stockage" },
          { id: "roles-permissions", label: "8. Rôles, permissions et visibilité" },
          { id: "glossaire", label: "9. Glossaire complet" },
        ].map(({ id, label }) => (
          <ListItem key={id} disableGutters sx={{ py: 0.3 }}>
            <ListItemIcon sx={{ minWidth: 20 }}>
              <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "primary.main" }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  component="a"
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  sx={{ color: "primary.main", cursor: "pointer", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  {label}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          1. VUE D'ENSEMBLE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="vue-ensemble">1. Vue d'ensemble de l'application</SectionTitle>
      <Desc>
        GEID Archives est une plateforme numérique centralisée de gestion documentaire. Elle permet
        à une organisation de soumettre, valider, retrouver et archiver ses documents officiels, en
        maintenant un registre structuré et traçable de toutes les pièces administratives. Elle gère
        également le rangement physique des documents papier dans des locaux d'archivage.
      </Desc>

      <SubTitle>À quoi sert cette application ?</SubTitle>
      <List dense>
        {[
          "Centraliser tous les documents officiels de l'organisation dans un seul espace numérique sécurisé.",
          "Soumettre facilement un document numérique (PDF, image, etc.) pour qu'il soit examiné et validé par le service des archives.",
          "Valider un document en lui attribuant un numéro de classification officiel et un numéro de référence, le rendant consultable et traçable.",
          "Gérer les archives validées : modifier les métadonnées, supprimer un document obsolète, retrouver rapidement un fichier.",
          "Organiser et inventorier les archives physiques (documents papier) rangés dans les locaux, avec une hiérarchie à 5 niveaux.",
        ].map((text, i) => (
          <ListItem key={i} disableGutters>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Chip label={i + 1} size="small" color="primary" sx={{ width: 24, height: 24, fontSize: "0.7rem" }} />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
          </ListItem>
        ))}
      </List>

      <SubTitle>Cycle de vie complet d'un document</SubTitle>
      <Desc>
        Chaque document passe par un cycle de vie rigoureux dans GEID Archives. Comprendre ce cycle
        est essentiel pour utiliser l'application correctement :
      </Desc>
      <Stack spacing={1} mb={2}>
        {[
          { step: "Soumission (En attente)", desc: "Un agent remplit le formulaire d'envoi et joint le fichier numérique. Le document est enregistré avec le statut « En attente » (puce orange)." },
          { step: "Examen", desc: "L'archiviste consulte la liste « À valider » et examine chaque document en attente. Il vérifie la désignation, le type documentaire, la description et le fichier joint." },
          { step: "Validation (Validé)", desc: "L'archiviste attribue un numéro de classification officiel et un numéro de référence. Le statut passe à « Validé » (puce verte). Le document est désormais dans les Archives validées." },
          { step: "Archivage (Archivé)", desc: "Un archiviste peut clôturer le document en le faisant passer au statut « Archivé » (puce bleue). Il est conservé mais ne peut plus être traité comme un document actif." },
          { step: "Élimination (Éliminé)", desc: "Réservé aux administrateurs. Marque définitivement un document comme éliminé (puce rouge) à l'issue de sa durée d'utilité administrative." },
          { step: "Archivage physique (optionnel)", desc: "Si le document a une version papier, il peut être rattaché à un dossier physique dans un classeur, lui-même rangé dans un étage, une étagère et un conteneur." },
        ].map(({ step, desc }, i) => (
          <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Chip label={i + 1} size="small" color="primary" sx={{ width: 24, height: 24, fontSize: "0.7rem", flexShrink: 0, mt: 0.2 }} />
              <Box>
                <Typography variant="body2" fontWeight={700}>{step}</Typography>
                <Typography variant="body2" color="text.secondary">{desc}</Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          2. NAVIGATION ET INTERFACE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="navigation">2. Navigation et interface</SectionTitle>
      <Desc>
        L'interface de GEID Archives est divisée en zones distinctes que vous utiliserez
        quotidiennement. Comprendre la disposition de ces zones vous permettra de travailler
        efficacement.
      </Desc>

      <SubTitle>Zones de l'interface</SubTitle>
      <Stack spacing={1.2} mb={2}>
        {[
          {
            zone: "En-tête (Header)",
            desc: "Barre supérieure fixe affichant le nom de l'application, les informations de l'utilisateur connecté et les options de déconnexion. Toujours visible.",
          },
          {
            zone: "Panneau de navigation (gauche)",
            desc: "Panneau vertical contenant les onglets de navigation (Tableau de bord, Archivage physique, Archives validées, À valider, Aide). Sur mobile, ce panneau se rétracte en tiroir accessible via le bouton menu ☰.",
          },
          {
            zone: "Zone de contenu principal",
            desc: "Zone centrale qui affiche le contenu de l'onglet actif : tableau de données, formulaire, graphiques, etc. C'est ici que vous effectuez la majorité des opérations.",
          },
          {
            zone: "Barre d'actions (sous l'en-tête)",
            desc: "Barre contextuelle qui apparaît sur certains onglets (ex : Archives validées). Elle affiche des boutons d'action selon les éléments sélectionnés : Valider, Modifier, Supprimer.",
          },
        ].map(({ zone, desc }) => (
          <Paper key={zone} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>{zone}</Typography>
            <Typography variant="body2" color="text.secondary">{desc}</Typography>
          </Paper>
        ))}
      </Stack>

      <SubTitle>Onglets de navigation</SubTitle>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Onglet</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Accès</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Description courte</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { tab: "Tableau de bord", access: "Tous", desc: "Vue synthétique : statistiques, indicateurs et résumé de l'activité." },
            { tab: "À valider", access: "Archivistes / Agents", desc: "Liste des documents en attente de validation. Permet de soumettre et de valider." },
            { tab: "Archives validées", access: "Tous", desc: "Liste de tous les documents officiellement archivés. Actions : modifier, supprimer, valider." },
            { tab: "Archivage physique", access: "Archivistes", desc: "Gestion de la hiérarchie de stockage physique (conteneur → dossier)." },
            { tab: "Aide", access: "Tous", desc: "Ce manuel utilisateur. Toujours accessible." },
          ].map(({ tab, access, desc }) => (
            <TableRow key={tab}>
              <TableCell><Typography variant="body2" fontWeight={600}>{tab}</Typography></TableCell>
              <TableCell><Chip label={access} size="small" variant="outlined" /></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{desc}</Typography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SubTitle>Notifications</SubTitle>
      <Desc>
        L'application affiche des notifications dans le coin inférieur droit de l'écran pour vous
        informer du résultat de vos actions (succès, erreur, information, avertissement). Chaque
        notification disparaît automatiquement après quelques secondes. Certaines notifications
        disposent d'un bouton « Annuler » qui vous permet de revenir en arrière dans les premières
        secondes.
      </Desc>
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" gap={1}>
        {[
          { label: "Succès", color: "success" as const, desc: "Opération réussie (vert)" },
          { label: "Erreur", color: "error" as const, desc: "Opération échouée (rouge)" },
          { label: "Avertissement", color: "warning" as const, desc: "Attention requise (orange)" },
          { label: "Information", color: "info" as const, desc: "Message neutre (bleu)" },
        ].map(({ label, color, desc }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip label={label} size="small" color={color} variant="outlined" />
            <Typography variant="caption" color="text.secondary">{desc}</Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          3. TABLEAU DE BORD
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="tableau-de-bord">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <DashboardOutlinedIcon fontSize="small" />
          <span>3. Tableau de bord</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Le tableau de bord est le point d'entrée par défaut de l'application. Il offre une vue
        synthétique et instantanée de l'état du service d'archivage. Vous n'avez aucune action à
        effectuer ici — c'est une page de lecture seule dédiée à la surveillance et au suivi.
      </Desc>
      <Desc>
        À partir du tableau de bord, vous pouvez rapidement évaluer :
      </Desc>
      <List dense>
        {[
          "Le nombre de documents en attente de validation, vous alertant sur la charge de travail à traiter.",
          "Le nombre total d'archives validées dans le système.",
          "Les statistiques de l'archivage physique : taux d'occupation des classeurs, nombre de dossiers par étage.",
          "Les indicateurs de capacité des classeurs (nombre de dossiers actuels vs capacité maximale).",
        ].map((text, i) => (
          <ListItem key={i} disableGutters>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CheckCircleOutlineIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
          </ListItem>
        ))}
      </List>
      <InfoBox>
        Le tableau de bord se rafraîchit automatiquement dès qu'une opération est effectuée (ajout,
        validation, suppression). Vous n'avez pas besoin de recharger la page.
      </InfoBox>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          4. À VALIDER
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="a-valider">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <InventoryOutlinedIcon fontSize="small" />
          <span>4. À valider — documents en attente</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Cette section est le cœur du processus documentaire. Elle liste tous les documents
        numériques soumis au service d'archivage et qui n'ont pas encore été officiellement validés.
        Chaque ligne du tableau représente un document en attente de traitement. L'archiviste
        examine ces documents un par un et leur attribue un identifiant officiel.
      </Desc>

      <SubTitle id="formulaire-soumission">4.1 Soumettre un nouveau document</SubTitle>
      <Desc>
        Pour ajouter un document à la file d'attente de validation, cliquez sur le bouton
        <strong> Ajouter</strong> dans la barre d'outils du tableau. Un formulaire s'ouvre et vous
        demande de renseigner les informations suivantes avec précision — ces données sont la base de
        travail de l'archiviste.
      </Desc>
      <FieldDoc label="Désignation" required example="Rapport annuel Ressources Humaines 2024">
        Intitulé principal et descriptif du document. C'est le titre qui sera affiché dans toutes
        les listes et recherches. Il doit être suffisamment précis pour identifier le document sans
        avoir besoin de l'ouvrir. Évitez les abréviations et les titres trop vagues comme « Rapport »
        ou « Document ». Préférez des intitulés complets incluant l'objet, le service émetteur et
        l'année si pertinent.
      </FieldDoc>
      <FieldDoc label="Type documentaire" required example="Rapport / Rapport annuel">
        Catégorie principale du document (famille documentaire), puis sa sous-catégorie (typologie).
        Ces valeurs sont prédéfinies par le service des archives selon la nomenclature officielle de
        l'organisation. Sélectionnez d'abord le type général (ex : Rapport), puis la spécialisation
        (ex : Rapport annuel). Ce classement thématique facilite les recherches ultérieures et les
        statistiques documentaires.
      </FieldDoc>
      <FieldDoc label="Activité / Mission / Dossier" required example="Gestion des ressources humaines — Bilan 2024">
        Nom du projet, de la mission, du dossier thématique ou du service émetteur du document.
        Ce champ permet de regrouper les archives par activité métier et de reconstituer le contexte
        de production du document. Utilisez le nom officiel de la mission ou du dossier tel qu'il
        figure dans vos référentiels internes.
      </FieldDoc>
      <FieldDoc label="Description" required example="Synthèse annuelle des effectifs, des bilans de formation, des indicateurs de performance RH et des perspectives pour l'année 2025.">
        Résumé libre et détaillé du contenu du document. C'est la principale source d'information
        pour retrouver un document lors d'une recherche ultérieure. Décrivez le sujet principal,
        les informations clés contenues dans le document et sa portée (période concernée, services
        impliqués, décisions ou données importantes). Plus cette description est précise, plus le
        document sera facilement retrouvable.
      </FieldDoc>
      <FieldDoc label="Fichier joint" required example="rapport_rh_2024.pdf">
        Fichier numérique correspondant au document (PDF, image JPG/PNG, etc.). C'est le document
        original qui sera archivé. Assurez-vous que le fichier est lisible, complet et ne dépasse
        pas la taille maximale autorisée par le système. Le nom du fichier n'a pas d'importance
        particulière mais il est conseillé d'utiliser un nom descriptif.
      </FieldDoc>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 1.5 }}>
        Une fois soumis, le document apparaît immédiatement dans la liste « À valider » avec le
        statut <strong>En attente</strong>. Il ne sera modifiable que par l'archiviste lors de la
        validation.
      </Alert>

      <SubTitle id="validation">4.2 Valider un document</SubTitle>
      <Desc>
        La validation est l'acte officiel par lequel l'archiviste certifie qu'un document est
        conforme et lui attribue ses identifiants définitifs dans le plan de classement. Pour
        valider un document, cliquez sur le bouton <strong>Valider</strong> sur la ligne
        correspondante dans le tableau. Un formulaire s'ouvre avec les champs suivants :
      </Desc>
      <FieldDoc label="Numéro de classification" required example="2024-ADM-001">
        Code alphanumérique structuré issu du plan de classement officiel de l'organisation.
        Ce numéro est attribué par l'archiviste selon les règles de codification internes. Il
        identifie de façon unique le document dans l'ensemble du système d'archives et permet de
        le localiser dans les répertoires physiques et numériques. Le format typique est :
        ANNÉE-DÉPARTEMENT-NUMÉRO-SÉQUENCE. Ce numéro doit comporter au minimum 5 caractères.
      </FieldDoc>
      <FieldDoc label="Numéro de référence" required example="REF-DRH-2024-042">
        Identifiant interne utilisé dans les autres systèmes d'information de l'organisation
        (système de gestion électronique de documents, ERP, logiciel métier, etc.). Ce numéro
        permet de faire le lien entre GEID Archives et les autres bases de données de
        l'organisation. Il suit généralement un format propre à chaque organisation : préfixe du
        service, année, numéro de séquence.
      </FieldDoc>
      <FieldDoc label="Profil d'accès" example="Ressources humaines, Direction générale">
        Indique quel service ou rôle est autorisé à consulter ce document archivé. Si le document
        est accessible à tous, laissez ce champ vide. Si l'accès doit être restreint à un service
        particulier (ex : Direction, RH), saisissez le nom du profil correspondant. Ce champ est
        utilisé pour filtrer les archives selon les droits des utilisateurs.
      </FieldDoc>

      <Desc>
        Après avoir rempli les champs, cliquez sur <strong>Valider</strong>. Une notification
        apparaît vous informant que la validation est en cours. Vous disposez de quelques secondes
        pour <strong>Annuler</strong> si vous avez commis une erreur. Une fois le délai écoulé, le
        document est définitivement validé, son statut passe à <strong>Validé</strong> (puce verte)
        et il migre vers la section « Archives validées ».
      </Desc>

      <SubTitle>4.3 Colonnes du tableau « À valider »</SubTitle>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Colonne</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { col: "Désignation", desc: "Titre du document tel que saisi lors de la soumission." },
            { col: "Type de document", desc: "Famille documentaire (type principal sélectionné à la soumission)." },
            { col: "N° classement", desc: "Numéro de classification attribué lors de la validation. Vide si non encore validé." },
            { col: "N° référence", desc: "Référence interne attribuée lors de la validation. Vide si non encore validé." },
            { col: "Description", desc: "Résumé du contenu saisi lors de la soumission." },
            { col: "Statut", desc: "Puce colorée : « Validé » (vert) ou « En attente » (orange)." },
            { col: "Date", desc: "Date et heure de soumission du document dans le système." },
            { col: "Valider", desc: "Bouton d'action permettant d'ouvrir le formulaire de validation pour ce document." },
          ].map(({ col, desc }) => (
            <TableRow key={col}>
              <TableCell><Typography variant="body2" fontWeight={600}>{col}</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{desc}</Typography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          5. ARCHIVES VALIDÉES
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="archives-validees">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <ManageHistoryIcon fontSize="small" />
          <span>5. Archives validées</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Cette section est le registre officiel de tous les documents qui ont été validés par le
        service des archives. Chaque document y est référencé, classé et consultable. C'est la
        section que vous utiliserez le plus souvent pour retrouver un document, vérifier ses
        métadonnées ou effectuer des corrections.
      </Desc>

      <SubTitle>5.1 Lire et filtrer les archives</SubTitle>
      <Desc>
        Le tableau affiche l'ensemble des archives validées auxquelles vous avez accès. Vous pouvez
        utiliser les outils de la barre d'outils pour personnaliser l'affichage :
      </Desc>
      <List dense>
        {[
          "Cliquez sur « Colonnes » pour afficher ou masquer des colonnes selon vos besoins.",
          "Cliquez sur « Filtres » pour appliquer des critères de recherche : filtrer par désignation, par type, par numéro de classement, etc.",
          "Cliquez sur l'en-tête d'une colonne pour trier le tableau par cette colonne (ordre croissant ou décroissant).",
          "Utilisez la pagination en bas de page pour naviguer entre les pages si le nombre d'archives est important.",
        ].map((text, i) => (
          <ListItem key={i} disableGutters>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CheckCircleOutlineIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
          </ListItem>
        ))}
      </List>

      <SubTitle>5.2 Sélectionner des archives pour une action</SubTitle>
      <Desc>
        Pour effectuer une action sur une ou plusieurs archives (modifier, supprimer, valider),
        vous devez d'abord les sélectionner en cochant les cases à gauche de chaque ligne. Une fois
        la sélection effectuée, les boutons d'action dans la barre au-dessus du tableau s'activent.
      </Desc>
      <Stack spacing={1} mb={2}>
        {[
          {
            action: "Valider",
            cond: "1 seul document · statut « En attente »",
            access: "Écriture",
            desc: "Ouvre le formulaire de validation permettant d'attribuer ou de modifier les numéros de classification et de référence. Le document passe au statut « Validé ».",
          },
          {
            action: "Modifier",
            cond: "1 seul document",
            access: "Écriture",
            desc: "Ouvre le formulaire de modification des métadonnées : désignation, description, mots-clés. Le fichier joint ne peut pas être remplacé.",
          },
          {
            action: "Archiver",
            cond: "1 seul document · statut « Validé »",
            access: "Écriture",
            desc: "Fait passer le document au statut « Archivé » (puce bleue). Le document est clôturé et ne peut plus être revalidé directement — il faut d'abord le rouvrir.",
          },
          {
            action: "Rouvrir",
            cond: "1 seul document · statut « Validé » ou « Archivé »",
            access: "Écriture",
            desc: "Ramène le document au statut « En attente » pour retraitement. Utile en cas d'erreur ou de modification nécessaire après validation.",
          },
          {
            action: "Supprimer",
            cond: "1 ou plusieurs documents",
            access: "Écriture",
            desc: "Supprime définitivement les archives sélectionnées. Le fichier associé sur le serveur est également supprimé. Action irréversible.",
          },
        ].map(({ action, cond, access, desc }) => (
          <Paper key={action} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap" gap={0.5}>
              <Typography variant="body2" fontWeight={700}>{action}</Typography>
              <Chip label={cond} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
              <Chip label={access} size="small" color="warning" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />
            </Stack>
            <Typography variant="body2" color="text.secondary">{desc}</Typography>
          </Paper>
        ))}
      </Stack>

      <SubTitle id="modifier-archive">5.3 Modifier une archive validée</SubTitle>
      <Desc>
        La modification permet de corriger ou d'enrichir les métadonnées d'un document après
        validation. Notez que le fichier joint lui-même ne peut pas être remplacé via cette
        interface — seules les informations descriptives sont modifiables.
      </Desc>
      <FieldDoc label="Désignation" required example="Rapport annuel RH 2024 — version corrigée">
        Titre du document. Modifiez-le pour corriger une faute de frappe, préciser l'intitulé ou
        ajouter une information manquante (ex : numéro de version, date de mise à jour).
      </FieldDoc>
      <FieldDoc label="Description" required>
        Résumé du contenu. Peut être enrichi après une relecture attentive du document ou suite à
        de nouvelles informations. Maintenez un niveau de détail suffisant pour faciliter les
        recherches futures.
      </FieldDoc>
      <FieldDoc label="Mots-clés" example="rapport annuel, RH, effectifs, formation, 2024">
        Liste de termes libres séparés par des virgules. Ces mots-clés enrichissent les capacités
        de recherche plein texte. Ajoutez des synonymes, des thèmes transversaux, des noms de
        projets ou des codes internes susceptibles d'être utilisés lors d'une recherche.
      </FieldDoc>

      <Alert severity="warning" sx={{ mt: 1, mb: 2, borderRadius: 1.5 }}>
        La suppression d'une archive est <strong>irréversible et permanente</strong>. Le fichier
        associé sur le serveur est également supprimé. Assurez-vous d'avoir une sauvegarde si
        nécessaire avant de procéder.
      </Alert>

      <SubTitle>5.4 Ouvrir un document</SubTitle>
      <Desc>
        Pour consulter le fichier original d'une archive validée, cliquez directement sur la ligne
        correspondante dans le tableau (sans cocher la case). Si le document est accessible, il
        s'ouvre dans un nouvel onglet de votre navigateur. Assurez-vous que les fenêtres
        contextuelles (pop-ups) ne sont pas bloquées par votre navigateur pour ce site.
      </Desc>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          6. CYCLE DE VIE DES DOCUMENTS
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="cycle-de-vie">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <HistoryOutlinedIcon fontSize="small" />
          <span>6. Cycle de vie des documents</span>
        </Stack>
      </SectionTitle>
      <Desc>
        GEID Archives gère le cycle de vie complet de chaque document selon les principes modernes
        de l'archivistique. Chaque document passe par des <strong>états successifs</strong> qui
        reflètent son stade de traitement et sa durée d'utilité administrative (DUA). Ces transitions
        sont tracées dans l'historique du document et sont irréversibles une fois validées (sauf
        retour en arrière explicite via « Rouvrir »).
      </Desc>

      <SubTitle>6.1 Les quatre statuts</SubTitle>
      <Stack spacing={1} mb={2}>
        {[
          {
            status: "En attente",
            color: "warning" as const,
            desc: "Statut initial d'un document soumis. L'archiviste n'a pas encore examiné ni validé ce document. Il est visible dans l'onglet « À valider ».",
            transitions: "→ Validé (après validation par un archiviste)",
          },
          {
            status: "Validé",
            color: "success" as const,
            desc: "Le document a été examiné et certifié conforme. Un numéro de classification et un numéro de référence lui ont été attribués. Il est actif et pleinement consultable.",
            transitions: "→ Archivé (clôture) · → En attente (réouverture en cas d'erreur)",
          },
          {
            status: "Archivé",
            color: "info" as const,
            desc: "Le document a atteint la fin de sa durée d'utilité courante. Il est conservé pour des raisons réglementaires ou historiques mais n'est plus un document de travail actif.",
            transitions: "→ Éliminé (administrateur uniquement)",
          },
          {
            status: "Éliminé",
            color: "error" as const,
            desc: "Le document a atteint la fin de sa durée d'utilité administrative. Il est marqué comme éliminé. Cette transition est définitive et réservée aux administrateurs.",
            transitions: "Aucune transition possible — état terminal",
          },
        ].map(({ status, color, desc, transitions }) => (
          <Paper key={status} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Chip label={status} size="small" color={color} variant="outlined" sx={{ mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{desc}</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                  Transitions : <em>{transitions}</em>
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <SubTitle>6.2 Tableau des transitions autorisées</SubTitle>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Depuis</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Vers</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Qui peut le faire</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { from: "En attente", to: "Validé",     action: "Valider",  who: "Archiviste (accès écriture)" },
            { from: "Validé",     to: "Archivé",    action: "Archiver", who: "Archiviste (accès écriture)" },
            { from: "Validé",     to: "En attente", action: "Rouvrir",  who: "Archiviste (accès écriture)" },
            { from: "Archivé",    to: "En attente", action: "Rouvrir",  who: "Archiviste (accès écriture)" },
            { from: "Archivé",    to: "Éliminé",    action: "Éliminer", who: "Administrateur uniquement" },
          ].map(({ from, to, action, who }, i) => (
            <TableRow key={i}>
              <TableCell><Typography variant="body2">{from}</Typography></TableCell>
              <TableCell><Typography variant="body2">{to}</Typography></TableCell>
              <TableCell><Typography variant="body2" fontWeight={600}>{action}</Typography></TableCell>
              <TableCell><Typography variant="body2" color="text.secondary">{who}</Typography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SubTitle>6.3 Historique du cycle de vie</SubTitle>
      <Desc>
        Chaque transition est enregistrée automatiquement dans l'historique du document avec :
        la date et l'heure exactes de la transition, l'utilisateur qui a effectué l'action, le
        statut de départ et le statut d'arrivée, et une note optionnelle justifiant la décision.
        Cet historique garantit la traçabilité complète des documents et permet de rendre compte
        des décisions prises sur chaque archive. Il n'est pas modifiable.
      </Desc>
      <InfoBox>
        La suppression physique d'un document (<strong>Supprimer</strong>) efface définitivement
        l'enregistrement et le fichier associé. Elle est distincte du statut « Éliminé » qui
        conserve la trace de l'existence du document à des fins d'audit. Préférez le statut
        « Éliminé » à la suppression pour les documents ayant une valeur probatoire ou historique.
      </InfoBox>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          7. ARCHIVAGE PHYSIQUE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="archivage-physique">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <AccountBalanceOutlinedIcon fontSize="small" />
          <span>7. Archivage physique</span>
        </Stack>
      </SectionTitle>
      <Desc>
        Cette section permet de gérer et d'inventorier l'espace de stockage physique des archives
        papier de l'organisation. Elle est organisée selon une hiérarchie stricte à 5 niveaux,
        du plus grand (le conteneur) au plus petit (le dossier physique). Chaque niveau doit être
        créé séquentiellement — vous ne pouvez pas créer une étagère sans avoir d'abord créé un
        conteneur.
      </Desc>

      <SubTitle>6.1 Hiérarchie des 5 niveaux</SubTitle>
      <Desc>
        Comprendre la hiérarchie est fondamental avant de commencer à utiliser cette section :
      </Desc>
      <Stack spacing={1} mb={2}>
        {[
          {
            icon: <WarehouseOutlinedIcon />,
            label: "Niveau 1 — Conteneur",
            desc: "La plus grande unité de stockage physique. Représente une armoire, un local dédié, une salle, une pièce ou tout espace physique fermé pouvant contenir des étagères. C'est le point de départ de toute la hiérarchie. Exemple : « Armoire A — Bâtiment principal ».",
          },
          {
            icon: <LayersOutlinedIcon />,
            label: "Niveau 2 — Étagère",
            desc: "Rangée physique à l'intérieur d'un conteneur. Un conteneur peut contenir plusieurs étagères. Exemple : « Étagère 1 — Rangée haute » dans l'Armoire A.",
          },
          {
            icon: <FolderOutlinedIcon />,
            label: "Niveau 3 — Étage",
            desc: "Compartiment numéroté d'une étagère. Chaque étage est associé à une unité administrative (service ou département) responsable des documents qui y sont rangés. Exemple : Étage 2 sur l'Étagère 1, rattaché au service des Ressources Humaines.",
          },
          {
            icon: <BookmarkBorderOutlinedIcon />,
            label: "Niveau 4 — Classeur",
            desc: "Reliure ou chemise physique contenant des dossiers papier. Chaque classeur a une nature thématique (ex : RH, FINANCE, JURIDIQUE en majuscules) et une capacité maximale de dossiers. Quand la capacité est atteinte, le système vous en avertit. Exemple : « Classeur Contrats 2024 » de nature RH, capacité 50.",
          },
          {
            icon: <ArticleOutlinedIcon />,
            label: "Niveau 5 — Dossier physique",
            desc: "Document ou ensemble de pièces physiques constituant un dossier rangé dans un classeur. C'est le niveau le plus fin de la hiérarchie. Chaque dossier doit avoir la même nature que son classeur parent (vérification effectuée automatiquement par le système). Exemple : Contrat de travail de M. Dupont dans le classeur RH.",
          },
        ].map(({ icon, label, desc }) => (
          <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ color: "primary.main", mt: 0.25, flexShrink: 0 }}>{icon}</Box>
              <Box>
                <Typography variant="body2" fontWeight={700}>{label}</Typography>
                <Typography variant="body2" color="text.secondary">{desc}</Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <InfoBox>
        La suppression d'un élément est possible uniquement s'il ne contient pas d'éléments
        enfants. Par exemple, vous ne pouvez pas supprimer un conteneur s'il contient des étagères.
        Supprimez d'abord tous les niveaux inférieurs (dossiers → classeurs → étages → étagères →
        conteneur).
      </InfoBox>

      <SubTitle id="conteneur">6.2 Créer un conteneur</SubTitle>
      <Desc>
        Le conteneur est le premier niveau à créer. Cliquez sur le bouton <strong>+ Ajouter</strong>
        dans l'onglet « Conteneur » de la section Archivage physique.
      </Desc>
      <FieldDoc label="Nom" required example="Armoire A — Bâtiment Principal, Rez-de-chaussée">
        Identifiant lisible du conteneur. Choisissez un nom qui reflète précisément l'emplacement
        physique et qui distingue ce conteneur de tous les autres de l'organisation. Incluez si
        possible le bâtiment, l'étage ou la salle. Ce nom sera utilisé dans les rapports et les
        listes de l'interface.
      </FieldDoc>
      <FieldDoc label="Localisation" example="Salle des archives, Niveau 0, Couloir B, Deuxième allée">
        Adresse précise du conteneur dans les locaux. Cette information est indispensable pour que
        quiconque puisse trouver physiquement le document sans connaissance préalable des locaux.
        Soyez aussi précis que possible : salle, couloir, allée, rangée.
      </FieldDoc>
      <FieldDoc label="Description" example="Armoire métallique à 4 portes verrouillée. Réservée exclusivement aux dossiers RH antérieurs à 2020. Clé disponible auprès du responsable archives.">
        Informations complémentaires utiles sur le conteneur : type de meuble, matériaux, conditions
        de conservation (température, hygrométrie), restrictions d'accès, contact pour obtenir
        l'accès, ou toute particularité importante à connaître.
      </FieldDoc>

      <SubTitle id="etagere">6.3 Créer une étagère</SubTitle>
      <Desc>
        Une étagère se crée à l'intérieur d'un conteneur existant. Sélectionnez le conteneur
        parent dans la vue arborescente, puis cliquez sur <strong>+ Ajouter une étagère</strong>.
      </Desc>
      <FieldDoc label="Nom" required example="Étagère 3 — Rangée basse">
        Désignation de la rangée physique. Indiquez sa position relative dans le conteneur (haute,
        milieu, basse) ou son numéro d'ordre pour faciliter la localisation physique lors d'une
        consultation.
      </FieldDoc>
      <FieldDoc label="Description" example="Réservée aux classeurs classés par ordre alphabétique. Contient principalement les dossiers antérieurs à 2018.">
        Description optionnelle du contenu prévu ou effectif de cette rangée. Utile pour guider
        les archivistes lors du classement de nouveaux dossiers.
      </FieldDoc>

      <SubTitle id="etage">6.4 Créer un étage</SubTitle>
      <Desc>
        Un étage se crée à l'intérieur d'une étagère. Il représente un compartiment numéroté
        rattaché à une unité administrative responsable.
      </Desc>
      <FieldDoc label="Numéro" required example="1 (premier compartiment), 2 (deuxième), 3…">
        Numéro entier identifiant la position de ce compartiment sur l'étagère. La numérotation
        commence généralement à 1 depuis le bas ou depuis la gauche selon les conventions de
        votre organisation.
      </FieldDoc>
      <FieldDoc label="Libellé" example="Dossiers actifs 2023-2024 — Direction">
        Description libre de ce niveau, utilisée dans les rapports d'inventaire et les listes.
        Indique généralement le contenu, la période couverte ou le service concerné.
      </FieldDoc>
      <FieldDoc label="Unité administrative" required example="ID MongoDB du service RH dans la base de données">
        Identifiant technique (_id) du service ou de l'unité organisationnelle responsable des
        documents stockés à cet étage. Cet identifiant est un code interne du système — consultez
        l'administrateur de GEID pour obtenir l'identifiant correspondant à votre service.
      </FieldDoc>

      <SubTitle id="classeur">6.5 Créer un classeur</SubTitle>
      <Desc>
        Un classeur se crée à l'intérieur d'un étage. Il représente la reliure physique qui va
        contenir les dossiers papier. La nature du classeur est déterminante car elle sera vérifiée
        lors de l'ajout de chaque dossier.
      </Desc>
      <FieldDoc label="Nom" required example="Classeur Contrats CDI — RH — 2024 (01)">
        Titre du classeur. Doit permettre d'identifier rapidement son contenu thématique et
        temporel sans avoir à l'ouvrir. Incluez la nature, le type de documents et la période
        si possible.
      </FieldDoc>
      <FieldDoc label="Nature" required example="RH, FINANCE, JURIDIQUE, MARCHÉS, TECHNIQUE">
        Catégorie thématique du classeur, obligatoirement en <strong>MAJUSCULES</strong>. La nature
        détermine quels types de dossiers peuvent être rangés dans ce classeur — le système vérifie
        automatiquement que tout dossier ajouté partage la même nature. Choisissez une nature
        cohérente avec le contenu prévu et les standards de nomenclature de votre organisation.
      </FieldDoc>
      <FieldDoc label="Capacité maximale" required example="50 dossiers">
        Nombre maximum de dossiers physiques pouvant être rangés dans ce classeur. Cette limite
        reflète la capacité physique réelle de la reliure. Quand le nombre de dossiers atteint ce
        seuil, le tableau de bord l'indique et vous invite à créer un nouveau classeur. Une
        capacité typique est entre 30 et 100 dossiers selon l'épaisseur des pièces.
      </FieldDoc>

      <SubTitle id="dossier-physique">6.6 Créer un dossier physique</SubTitle>
      <Desc>
        Le dossier physique est l'unité documentaire élémentaire de l'archivage physique. Il
        représente un document ou un ensemble de pièces papier physiquement rangé dans un classeur.
        Sa <strong>nature doit impérativement correspondre</strong> à celle du classeur parent,
        sous peine de rejet par le système.
      </Desc>
      <FieldDoc label="N° interne" required example="DOS-RH-2024-0042">
        Code unique attribué à ce dossier par le service des archives. Ce numéro suit généralement
        le format standardisé de votre organisation : NATURE-SERVICE-ANNÉE-SÉQUENCE. Il permet
        d'identifier et de retrouver le dossier physique en cas de perte ou de déplacement.
      </FieldDoc>
      <FieldDoc label="N° de référence" required example="REF-DRH-042">
        Référence croisée avec le système d'information de l'organisation (GED, ERP, logiciel RH,
        etc.). Ce numéro fait le lien entre le document physique et son équivalent numérique dans
        les autres systèmes. Utilisez le même format que dans vos autres outils pour faciliter
        les recoupements.
      </FieldDoc>
      <FieldDoc label="Objet" required example="Contrat de travail à durée indéterminée — M. Jean Dupont — Poste : Technicien">
        Intitulé précis du dossier décrivant son contenu principal. Soyez suffisamment descriptif
        pour identifier le dossier sans avoir à l'ouvrir : incluez le type d'acte, les parties
        concernées et la nature de la transaction ou du document.
      </FieldDoc>
      <FieldDoc label="Catégorie" required example="Contrats, Correspondances, Marchés publics, Rapports, Factures">
        Famille documentaire à laquelle appartient ce dossier. Utilisée pour le filtrage et les
        statistiques d'archivage. Choisissez la catégorie qui correspond le mieux à la nature
        juridique ou administrative du document.
      </FieldDoc>
      <FieldDoc label="Nature" required example="RH (doit correspondre à la nature du classeur parent)">
        Doit correspondre <strong>exactement</strong> à la nature du classeur dans lequel ce
        dossier est rangé, en <strong>MAJUSCULES</strong>. Le système effectue une vérification
        automatique lors de l'enregistrement et rejettera le dossier si les natures ne concordent
        pas. Cette contrainte garantit la cohérence thématique du classeur.
      </FieldDoc>
      <FieldDoc label="Date d'édition" required example="15/03/2024">
        Date à laquelle le document original a été produit, signé ou émis. Format : JJ/MM/AAAA.
        Cette date est distincte de la date d'archivage — elle correspond à la date figurant sur
        le document lui-même.
      </FieldDoc>
      <FieldDoc label="Date d'archivage" required example="20/03/2024 (date du jour de classement)">
        Date à laquelle ce dossier a été physiquement intégré dans les archives. Généralement
        la date du jour. Cette date permet de retracer chronologiquement l'activité d'archivage
        et de respecter les délais réglementaires de conservation.
      </FieldDoc>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          8. RÔLES ET PERMISSIONS
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="roles-permissions">
        <Stack direction="row" alignItems="center" spacing={1} component="span">
          <SecurityOutlinedIcon fontSize="small" />
          <span>8. Rôles, permissions et visibilité</span>
        </Stack>
      </SectionTitle>
      <Desc>
        GEID Archives utilise un système d'autorisations granulaires basé sur les
        <strong> unités administratives</strong> (services, départements) et les
        <strong> niveaux d'accès</strong> (lecture seule ou lecture/écriture). Ces permissions
        sont attribuées par l'administrateur du système pour chaque compte utilisateur. Elles
        déterminent ce que vous voyez dans l'interface et les actions que vous pouvez effectuer.
      </Desc>

      <SubTitle>8.1 Les deux niveaux d'accès</SubTitle>
      <Stack spacing={1} mb={2}>
        {[
          {
            level: "Lecture seule",
            color: "info" as const,
            desc: "Vous pouvez consulter les archives de votre unité administrative. Vous voyez les tableaux et les documents mais aucun bouton de modification n'est affiché. Le bouton « Valider » dans le tableau « À valider » n'est pas visible.",
          },
          {
            level: "Lecture / Écriture",
            color: "success" as const,
            desc: "Vous pouvez soumettre, valider, modifier, archiver et supprimer des documents dans les unités administratives pour lesquelles vous avez cet accès. Les boutons d'action sont visibles et actifs selon le statut du document sélectionné.",
          },
        ].map(({ level, color, desc }) => (
          <Paper key={level} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Chip label={level} size="small" color={color} variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{desc}</Typography>
          </Paper>
        ))}
      </Stack>

      <SubTitle>8.2 Visibilité selon les unités administratives</SubTitle>
      <Desc>
        Vos permissions sont liées à des <strong>unités administratives spécifiques</strong>.
        Le système filtre automatiquement l'affichage des archives en fonction de ces unités :
      </Desc>
      <List dense>
        {[
          "Vous ne voyez que les archives appartenant aux unités pour lesquelles vous avez au moins un accès (lecture ou écriture).",
          "Un document soumis sans unité administrative explicite peut être visible selon la configuration du système.",
          "Si vous avez des accès sur plusieurs unités, vous voyez les archives de toutes ces unités dans un seul tableau.",
          "Les actions disponibles (Valider, Modifier, Archiver, etc.) ne s'affichent que si vous avez un accès en écriture sur l'unité du document sélectionné.",
        ].map((text, i) => (
          <ListItem key={i} disableGutters>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CheckCircleOutlineIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
          </ListItem>
        ))}
      </List>

      <SubTitle>8.3 Profil Administrateur</SubTitle>
      <Desc>
        Le profil Administrateur est un niveau d'accès spécial qui dépasse les restrictions
        par unité administrative. Un administrateur possède les caractéristiques suivantes :
      </Desc>
      <List dense>
        {[
          "Voit toutes les archives du système, quelle que soit leur unité administrative, sans exception.",
          "Peut effectuer toutes les opérations (soumettre, valider, modifier, archiver, supprimer) sur n'importe quel document.",
          "Est le seul à pouvoir effectuer la transition vers le statut « Éliminé » — transition réservée aux administrateurs pour des raisons de conformité réglementaire.",
          "Voit les boutons d'action pour tous les documents, y compris ceux d'autres services.",
        ].map((text, i) => (
          <ListItem key={i} disableGutters>
            <ListItemIcon sx={{ minWidth: 28 }}>
              <CheckCircleOutlineIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
          </ListItem>
        ))}
      </List>

      <SubTitle>8.4 Tableau récapitulatif des permissions</SubTitle>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Lecture</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Écriture</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Admin</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { action: "Consulter les archives de son unité",   read: "✓", write: "✓", admin: "✓" },
            { action: "Consulter toutes les archives",          read: "–", write: "–", admin: "✓" },
            { action: "Soumettre un document",                  read: "–", write: "✓", admin: "✓" },
            { action: "Valider un document (En attente → Validé)", read: "–", write: "✓", admin: "✓" },
            { action: "Modifier les métadonnées",               read: "–", write: "✓", admin: "✓" },
            { action: "Archiver (Validé → Archivé)",            read: "–", write: "✓", admin: "✓" },
            { action: "Rouvrir (Validé/Archivé → En attente)", read: "–", write: "✓", admin: "✓" },
            { action: "Éliminer (Archivé → Éliminé)",           read: "–", write: "–", admin: "✓" },
            { action: "Supprimer définitivement",               read: "–", write: "✓", admin: "✓" },
            { action: "Gérer l'archivage physique",             read: "–", write: "✓", admin: "✓" },
          ].map(({ action, read, write, admin }) => (
            <TableRow key={action}>
              <TableCell><Typography variant="body2">{action}</Typography></TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <Typography variant="body2" color={read === "✓" ? "success.main" : "text.disabled"}>{read}</Typography>
              </TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <Typography variant="body2" color={write === "✓" ? "success.main" : "text.disabled"}>{write}</Typography>
              </TableCell>
              <TableCell sx={{ textAlign: "center" }}>
                <Typography variant="body2" color={admin === "✓" ? "success.main" : "text.disabled"}>{admin}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <InfoBox>
        Si vous ne voyez pas certaines archives ou fonctionnalités, contactez votre administrateur
        GEID pour vérifier les permissions associées à votre compte. L'accès aux archives est
        filtré selon les unités administratives auxquelles vous êtes rattaché. Les boutons d'action
        n'apparaissent dans l'interface que si vous avez les droits nécessaires — si un bouton est
        absent, c'est intentionnel et lié à vos permissions.
      </InfoBox>

      <Divider sx={{ my: 2 }} />

      {/* ══════════════════════════════════════════════════
          8. GLOSSAIRE
      ════════════════════════════════════════════════════ */}
      <SectionTitle id="glossaire">9. Glossaire complet</SectionTitle>
      <Desc>
        Définitions des termes techniques et métier utilisés dans GEID Archives :
      </Desc>
      <Stack spacing={1}>
        {[
          {
            term: "Archive",
            def: "Document numérique soumis au service d'archivage. Une archive passe par plusieurs statuts au cours de son cycle de vie : En attente, Validé, Archivé, ou Éliminé.",
          },
          {
            term: "Cycle de vie",
            def: "Ensemble des étapes successives qu'un document traverse dans le système : soumission (En attente) → validation (Validé) → clôture (Archivé) → élimination réglementaire (Éliminé). Chaque transition est tracée dans l'historique.",
          },
          {
            term: "DUA (Durée d'Utilité Administrative)",
            def: "Durée pendant laquelle un document doit être conservé à des fins administratives, légales ou réglementaires. À l'expiration de la DUA, le document peut être éliminé ou versé aux archives définitives.",
          },
          {
            term: "Transition de statut",
            def: "Changement d'un document d'un statut à un autre dans le cycle de vie. Chaque transition est validée selon des règles strictes et enregistrée dans l'historique avec la date, l'utilisateur et une note optionnelle.",
          },
          {
            term: "Historique du cycle de vie",
            def: "Journal horodaté de toutes les transitions de statut d'un document. Garantit la traçabilité complète : qui a fait quoi, quand, et pourquoi. Non modifiable.",
          },
          {
            term: "Validation",
            def: "Processus officiel par lequel un archiviste certifie la conformité d'un document et lui attribue ses identifiants définitifs (numéro de classification et numéro de référence), le rendant officiellement archivé.",
          },
          {
            term: "Numéro de classification",
            def: "Code structuré issu du plan de classement officiel de l'organisation (ex : 2024-ADM-001). Unique dans le système. Permet de localiser un document dans les répertoires physiques et numériques. Attribué uniquement par l'archiviste lors de la validation.",
          },
          {
            term: "Numéro de référence",
            def: "Identifiant interne du document dans les systèmes d'information de l'organisation (GED, ERP, logiciel métier). Permet de faire le lien entre GEID Archives et les autres bases de données.",
          },
          {
            term: "Plan de classement",
            def: "Référentiel documentaire officiel de l'organisation définissant la structure hiérarchique des codes de classification. C'est la nomenclature de référence utilisée par les archivistes pour attribuer les numéros de classification.",
          },
          {
            term: "Profil d'accès",
            def: "Rôle ou service autorisé à consulter un document archivé. Correspond aux entrées du référentiel des unités administratives de l'organisation. Si vide, le document est accessible à tous les utilisateurs ayant accès aux archives.",
          },
          {
            term: "Unité administrative",
            def: "Service, département ou entité organisationnelle de l'organisation (ex : Direction des Ressources Humaines, Service Financier). Utilisé pour filtrer les archives selon les périmètres de responsabilité de chaque utilisateur.",
          },
          {
            term: "Nature",
            def: "Catégorie thématique d'un classeur ou d'un dossier physique, toujours en MAJUSCULES (ex : RH, FINANCE, JURIDIQUE, MARCHÉS). La nature d'un dossier doit correspondre exactement à celle de son classeur parent.",
          },
          {
            term: "Conteneur",
            def: "Unité physique de stockage de niveau supérieur. Représente une armoire, un local ou tout espace physique fermé utilisé pour stocker des étagères d'archives.",
          },
          {
            term: "Étagère",
            def: "Rangée physique à l'intérieur d'un conteneur. Un conteneur peut contenir plusieurs étagères.",
          },
          {
            term: "Étage",
            def: "Compartiment numéroté d'une étagère, rattaché à une unité administrative responsable des documents qu'il contient.",
          },
          {
            term: "Classeur",
            def: "Reliure ou chemise physique contenant des dossiers papier. Chaque classeur a une nature thématique (en majuscules) et une capacité maximale de dossiers.",
          },
          {
            term: "Dossier physique",
            def: "Unité documentaire physique élémentaire rangée dans un classeur. Représente un document ou un ensemble de pièces papier. Sa nature doit correspondre à celle du classeur parent.",
          },
          {
            term: "Mots-clés (tags)",
            def: "Termes libres séparés par des virgules, associés à une archive validée pour enrichir les capacités de recherche plein texte. Exemples : nom de projet, acronyme, thème transversal.",
          },
          {
            term: "Type documentaire",
            def: "Famille documentaire à deux niveaux (type principal + sous-type) selon la nomenclature du service des archives. Exemples : Rapport / Rapport annuel, Contrat / Contrat de travail.",
          },
          {
            term: "Capacité maximale (classeur)",
            def: "Nombre maximum de dossiers physiques pouvant être rangés dans un classeur. Défini lors de la création du classeur selon sa capacité physique réelle.",
          },
          {
            term: "Version",
            def: "Numéro de version interne attribué automatiquement à chaque archive lors de sa modification. Permet de suivre l'historique des mises à jour.",
          },
        ].map(({ term, def }) => (
          <Paper key={term} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
            <Typography variant="body2" fontWeight={700} gutterBottom>
              {term}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {def}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Box height={60} />
    </Box>
  );
}
