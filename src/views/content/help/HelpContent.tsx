/**
 * HelpContent — Manuel utilisateur complet GEID Archives.
 *
 * Fonctionnalités :
 *  - Recherche plein-texte avec Fuse.js (suggestions, navigation vers la section)
 *  - Téléchargement PDF avec html2canvas + jsPDF (rendu fidèle à l'écran)
 *  - Ancrage automatique depuis d'autres pages (location.state.helpAnchor)
 *  - Sommaire interactif avec navigation par défilement fluide
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchOutlinedIcon        from "@mui/icons-material/SearchOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import CloseOutlinedIcon         from "@mui/icons-material/CloseOutlined";
import ExpandMoreOutlinedIcon    from "@mui/icons-material/ExpandMoreOutlined";
import CheckCircleOutlineIcon   from "@mui/icons-material/CheckCircleOutline";
import ArrowRightOutlinedIcon    from "@mui/icons-material/ArrowRightOutlined";
import InfoOutlinedIcon         from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import { useLocation }          from "react-router-dom";
import Fuse                     from "fuse.js";
import useToken                 from "@/hooks/useToken";
import scrollBarSx              from "@/utils/scrollBarSx";

// ── Structure des sections du manuel ─────────────────────────

interface ManualSection {
  id:       string;
  number:   string;
  title:    string;
  keywords: string[];
  body:     string; // texte brut pour l'indexation Fuse
}

const SECTIONS: ManualSection[] = [
  {
    id: "presentation", number: "1", title: "Présentation de l'application",
    keywords: ["geid", "archives", "présentation", "introduction", "objectif", "utilité", "qu'est-ce"],
    body: "GEID Archives est un système de gestion documentaire développé pour centraliser, organiser et protéger l'ensemble des archives d'une organisation. L'application permet de gérer simultanément deux dimensions complémentaires : les archives numériques sous forme de fichiers électroniques, et les archives physiques conservées dans des espaces de stockage réels.",
  },
  {
    id: "connexion", number: "2", title: "Connexion et interface",
    keywords: ["connexion", "login", "interface", "navigation", "onglet", "menu", "session", "expiration", "déconnexion"],
    body: "Pour accéder à GEID Archives vous devez disposer d'un compte créé par votre administrateur. Saisissez votre identifiant et mot de passe sur la page d'accueil. L'interface principale est organisée autour d'un menu de navigation à gauche donnant accès aux quatre sections principales. La session expire automatiquement après une période d'inactivité. L'application détecte cette expiration et vous déconnecte proprement en vous informant de vous reconnecter.",
  },
  {
    id: "tableau-de-bord", number: "3", title: "Le tableau de bord",
    keywords: ["tableau de bord", "dashboard", "statistiques", "indicateurs", "alertes", "activité récente", "personnaliser", "configurer", "graphique", "donut", "camembert", "barres", "seuils", "glisser-déposer"],
    body: "Le tableau de bord est la première page qui s'affiche après connexion. Il présente une synthèse en temps réel de l'état du système. Vous y trouverez les compteurs d'archives par statut, les alertes prioritaires, l'activité récente et l'état de l'inventaire physique. Le tableau de bord est entièrement personnalisable : cartes de synthèse configurables, sections activables, type de graphique au choix et seuils d'alerte réglables.",
  },
  {
    id: "archives-numeriques", number: "4", title: "Les archives numériques",
    keywords: ["archive numérique", "document", "fichier", "dépôt", "soumettre", "créer", "ajouter", "protégé", "sécurisé", "authentification"],
    body: "Une archive numérique représente un document électronique conservé dans le système. Elle peut être un contrat, un rapport, une décision administrative, un procès-verbal ou tout autre document officiel. Chaque archive suit un cycle de vie structuré depuis sa soumission jusqu'à sa destruction ou conservation définitive. Les fichiers attachés aux archives sont protégés et ne sont pas accessibles publiquement. Le système vérifie votre identité et vos droits d'accès avant de vous autoriser à consulter un fichier.",
  },
  {
    id: "formulaire-creation", number: "4.1", title: "Soumettre une nouvelle archive",
    keywords: ["formulaire", "création", "désignation", "type", "description", "fichier", "référence", "appareil", "espace personnel", "workspace", "source"],
    body: "Pour soumettre une archive cliquez sur le bouton Ajouter dans la barre de navigation gauche. Un formulaire s'ouvre avec les champs suivants : désignation (nom du document, obligatoire), type documentaire (catégorie administrative), description et pièce jointe (PDF ou autre). Le dossier de classement est déterminé automatiquement à partir du type de document choisi. Pour joindre un fichier, vous avez le choix entre deux sources : Depuis mon appareil pour sélectionner un fichier enregistré sur votre poste, ou Depuis mon espace personnel pour choisir un fichier déjà présent dans votre espace de travail.",
  },
  {
    id: "cycle-de-vie", number: "5", title: "Le cycle de vie d'une archive",
    keywords: ["cycle de vie", "statut", "lifecycle", "transition", "état", "PENDING", "ACTIVE", "SEMI_ACTIVE", "PERMANENT", "DESTROYED"],
    body: "Chaque archive passe par des états successifs depuis sa création jusqu'à sa destination finale. Les cinq états sont en attente de validation, active, intermédiaire, historique et détruite. La progression est linéaire et chaque transition nécessite une action explicite d'un utilisateur habilité.",
  },
  {
    id: "etat-pending", number: "5.1", title: "En attente de validation",
    keywords: ["en attente", "pending", "validation", "soumission", "vérification"],
    body: "L'état en attente correspond aux archives fraîchement déposées par un agent et qui n'ont pas encore été examinées par un archiviste. Durant cette phase le document est visible dans la liste des archives mais ne peut pas être modifié. L'archiviste peut accepter ou refuser la validation.",
  },
  {
    id: "etat-active", number: "5.2", title: "Archive active",
    keywords: ["active", "validée", "en cours", "utilisation", "courante"],
    body: "Une archive active est un document validé qui fait partie du fonds documentaire courant de l'organisation. Elle est accessible à tous les utilisateurs autorisés et peut faire l'objet de consultations régulières. C'est l'état normal d'un document en cours d'utilisation.",
  },
  {
    id: "etat-intermediaire", number: "5.3", title: "Archive intermédiaire",
    keywords: ["intermédiaire", "semi-actif", "DUA", "durée administrative", "conservation"],
    body: "L'état intermédiaire correspond à des archives dont l'utilisation courante est terminée mais dont la conservation reste obligatoire pendant une durée déterminée appelée Durée d'Utilité Administrative. Ces archives sont moins consultées mais restent accessibles en cas de besoin légal ou réglementaire.",
  },
  {
    id: "etat-permanent", number: "5.4", title: "Archive historique",
    keywords: ["historique", "permanent", "patrimonial", "conservation définitive"],
    body: "L'état historique indique que l'archive est conservée définitivement dans le fonds patrimonial de l'organisation. Ces documents ont une valeur historique, juridique ou probatoire qui justifie leur conservation sans limite de durée. Ils ne peuvent pas être détruits.",
  },
  {
    id: "etat-detruit", number: "5.5", title: "Archive détruite",
    keywords: ["détruite", "destroyed", "suppression", "fin de vie", "élimination"],
    body: "L'état détruit signale qu'une archive a été éliminée conformément aux règles de gestion documentaire. Cette action est irréversible. Elle est réservée aux administrateurs et ne peut s'appliquer qu'après validation de la procédure d'élimination.",
  },
  {
    id: "elimination-proposee", number: "5.6", title: "Élimination proposée",
    keywords: ["élimination proposée", "PV", "procès-verbal", "destruction", "DUA expirée", "sort final", "réactiver", "conserver", "visa", "DANTIC", "brouillon", "approuvé", "exécuté"],
    body: "Lorsqu'une DUA expire et que le sort final est l'élimination, l'archive passe automatiquement en état Élimination proposée. Aucune destruction automatique n'a lieu. Un procès-verbal d'élimination doit être créé et approuvé selon un circuit de validation précis avant que les archives ne soient définitivement détruites. Il est également possible de réactiver ou conserver une archive en élimination proposée si la situation l'exige.",
  },
  {
    id: "dua", number: "6", title: "La Durée d'Utilité Administrative",
    keywords: ["DUA", "durée", "utilité administrative", "sort final", "délai", "conservation"],
    body: "La Durée d'Utilité Administrative est la période pendant laquelle une archive doit être conservée de manière obligatoire avant d'être éliminée ou versée aux archives définitives. Elle est exprimée en jours, mois ou années et prend effet à partir d'une date de départ configurable.",
  },
  {
    id: "dua-configuration", number: "6.1", title: "Configurer une DUA",
    keywords: ["configurer", "paramétrer", "DUA", "valeur", "unité", "date de départ", "sort final"],
    body: "Pour configurer la DUA d'une archive cliquez sur le bouton DUA dans le panneau de détail. Saisissez la valeur numérique, l'unité de temps jours mois ou années, la date de départ et le sort final conservation définitive ou élimination. Le système calculera automatiquement la date d'expiration et vous alertera quand elle approche.",
  },
  {
    id: "validation", number: "7", title: "Valider une archive",
    keywords: ["validation", "valider", "archiviste", "approuver", "accepter", "refuser"],
    body: "La validation est l'acte par lequel un archiviste certifie qu'une archive soumise est conforme aux exigences documentaires. Elle fait passer l'archive de l'état en attente à l'état active. Seuls les utilisateurs ayant le rôle archiviste ou administrateur peuvent effectuer cette action.",
  },
  {
    id: "modification", number: "8", title: "Modifier une archive",
    keywords: ["modifier", "éditer", "mettre à jour", "corriger", "changer"],
    body: "Pour modifier une archive cliquez sur la ligne correspondante dans la liste pour ouvrir le panneau de détail puis cliquez sur le bouton Modifier. Un formulaire prérempli s'ouvre vous permettant de corriger les informations. Seuls les champs modifiables sont accessibles selon votre rôle.",
  },
  {
    id: "suppression", number: "9", title: "Supprimer des archives",
    keywords: ["supprimer", "effacer", "éliminer", "delete", "suppression"],
    body: "La suppression est une action irréversible réservée aux administrateurs. Vous pouvez supprimer une seule archive via le panneau de détail ou plusieurs archives simultanément en cochant les cases à gauche puis en utilisant le menu Actions. Une confirmation explicite est toujours demandée avant l'exécution.",
  },
  {
    id: "archivage-physique", number: "10", title: "L'archivage physique",
    keywords: ["archivage physique", "inventaire", "conteneur", "étagère", "classeur", "dossier", "document", "hiérarchie", "explorateur", "renommer", "glisser", "déposer", "déplacer", "redimensionner", "sélecteur"],
    body: "L'archivage physique permet de gérer l'inventaire des supports de conservation réels. L'application modélise une hiérarchie à six niveaux correspondant à la réalité d'un centre d'archives physiques. L'interface adopte une disposition de type explorateur de fichiers avec un fil d'Ariane pour naviguer entre les niveaux, une ligne de retour (..) et un panneau de détail latéral. Les utilisateurs ayant les droits d'écriture peuvent renommer un élément en double-cliquant sur son nom ou via le menu contextuel accessible par un clic droit.",
  },
  {
    id: "hierarchie-physique", number: "10.1", title: "La hiérarchie des espaces physiques",
    keywords: ["conteneur", "armoire", "étagère", "niveau", "compartiment", "classeur", "chemise", "boîte", "reliure", "dossier", "affaire", "document", "pièce", "hiérarchie", "arborescence", "sous-document"],
    body: "La hiérarchie physique est organisée en six niveaux. Le Conteneur représente l'armoire, l'étagère métallique ou le local de stockage. L'Étagère est une rangée à l'intérieur du conteneur. Le Niveau est un compartiment sur l'étagère. Le Classeur est la chemise, la boîte ou la reliure qui regroupe les dossiers. Le Dossier est un ensemble de pièces relatives à une même affaire. Le Document est une pièce individuelle à l'intérieur d'un dossier, qui peut contenir des archives numériques.",
  },
  {
    id: "rattachement", number: "10.2", title: "Rattacher une archive numérique à un document",
    keywords: ["rattacher", "lier", "associer", "archive numérique", "document", "support", "détacher"],
    body: "Le rattachement permet d'associer une archive numérique à un document précis dans la hiérarchie physique. Les archives se rattachent uniquement aux documents, car c'est le document qui représente la pièce individuelle à laquelle correspond le fichier numérique. Un dossier regroupe les documents, mais on ne rattache pas directement une archive à un dossier. Depuis le panneau de détail de l'archive, cliquez sur le bouton Dossier physique pour ouvrir la navigation en cascade. Parcourez la hiérarchie jusqu'au document souhaité. Confirmez avec le bouton Rattacher. Le détachement est aussi possible depuis le même dialogue.",
  },
  {
    id: "glisser-deposer", number: "10.3", title: "Glisser-déposer une archive entre documents",
    keywords: ["glisser", "déposer", "drag", "drop", "déplacer", "archive", "document", "clic droit", "confirmation"],
    body: "Vous pouvez déplacer une archive numérique d'un document vers un autre par glisser-déposer. Maintenez le clic sur l'archive, glissez-la vers un autre document, un cadre bleu confirme que le document accepte le fichier. Une fenêtre de confirmation apparaît avant le déplacement. Vous pouvez aussi utiliser le menu clic droit puis Déplacer vers un autre document.",
  },
  {
    id: "naviguer-conteneurs", number: "10.4", title: "Naviguer entre les conteneurs",
    keywords: ["conteneur", "sélecteur", "choisir", "créer", "navigation", "liste déroulante"],
    body: "En haut de l'arborescence, un sélecteur permet de choisir le conteneur actif. Le contenu de l'arborescence change automatiquement quand vous sélectionnez un autre conteneur. Le bouton + à côté du sélecteur permet de créer un nouveau conteneur.",
  },
  {
    id: "ajuster-affichage", number: "10.5", title: "Ajuster l'affichage",
    keywords: ["redimensionner", "largeur", "bordure", "séparation", "affichage", "arborescence", "glisser"],
    body: "La bordure entre l'arborescence et la liste centrale peut être déplacée pour ajuster la largeur de chaque zone. Maintenez le clic sur la ligne de séparation et glissez vers la gauche ou la droite pour obtenir la disposition qui vous convient.",
  },
  {
    id: "documents-physiques", number: "10.6", title: "Les documents et sous-documents",
    keywords: ["document", "sous-document", "créer document", "contenu", "imbriqué"],
    body: "Un dossier peut contenir un ou plusieurs documents. Chaque document peut lui-même contenir d'autres sous-documents et des archives numériques. Cette structure permet de modéliser des dossiers avec plusieurs niveaux de classement internes. Pour créer un document, naviguez dans un dossier puis cliquez sur le bouton d'ajout. Le formulaire propose un titre, une description, une nature et une date. Les sous-documents se créent de la même manière en naviguant dans un document parent.",
  },
  {
    id: "qrcode", number: "10.7", title: "Le code QR d'un dossier",
    keywords: ["QR code", "code QR", "étiquette", "identification", "scan"],
    body: "Chaque dossier se voit attribuer automatiquement un code QR unique lors de sa création. Ce code peut être imprimé et collé sur la chemise physique pour permettre une identification rapide par scan. La recherche par code QR retrouve instantanément la fiche numérique complète du dossier avec toute sa localisation dans la hiérarchie.",
  },
  {
    id: "datepicker", number: "10.8", title: "Saisie des dates avec le calendrier",
    keywords: ["date", "calendrier", "saisie", "format"],
    body: "Tous les champs de date dans les formulaires de l'archivage physique utilisent un sélecteur de date avec calendrier interactif. Le format d'affichage est JJ/MM/AAAA. Vous pouvez cliquer sur l'icône calendrier pour ouvrir le sélecteur, naviguer entre les mois et les années, ou saisir directement la date au clavier.",
  },
  {
    id: "arborescence", number: "10.9", title: "L'arborescence interactive",
    keywords: ["arborescence", "arbre", "hiérarchie", "navigation", "panneau latéral"],
    body: "Sur les grands écrans, un panneau latéral gauche affiche l'arborescence complète de l'archivage physique sous forme d'arbre interactif. Chaque niveau est identifié par son icône distinctive : entrepôt pour les conteneurs, serveur pour les étagères, couches pour les niveaux, onglets pour les classeurs, dossier pour les dossiers et document pour les documents. Cliquez sur un élément pour charger son contenu et le sélectionner dans l'explorateur principal. L'arbre se charge progressivement pour rester fluide même avec un grand volume de données.",
  },
  {
    id: "ouvrir-fichier", number: "10.10", title: "Ouvrir un fichier",
    keywords: ["ouvrir", "fichier", "chargement", "progression", "annuler", "hors ligne", "icône", "PDF", "Word", "Excel", "image", "vidéo"],
    body: "Quand vous ouvrez un fichier, une barre de progression apparaît en bas de l'écran. Vous pouvez annuler le chargement avec le bouton Annuler. Un fichier déjà consulté s'ouvre instantanément la prochaine fois. Si vous n'êtes pas connecté à internet, un message vous en informe. Chaque fichier est représenté par une icône qui indique son type : les PDF apparaissent en rouge, les documents Word en bleu, les tableurs Excel en vert, les images en violet et les vidéos en rouge foncé.",
  },
  {
    id: "recherche", number: "11", title: "Rechercher dans le système",
    keywords: ["recherche", "rechercher", "trouver", "Ctrl+K", "indexation", "plein texte", "accent", "approximatif", "tolérant", "loupe", "résultats"],
    body: "GEID Archives dispose d'un moteur de recherche unifié accessible via le raccourci clavier Ctrl+K ou en cliquant sur la loupe dans la barre de navigation. La recherche s'effectue simultanément sur les archives numériques et les documents de l'archivage physique. Elle est indexée sur la désignation, la description, le numéro de classe, la référence, le dossier, les étiquettes et pour les documents le sujet, la catégorie et la nature. La recherche est tolérante aux accents et aux mots partiels. Les termes correspondants sont mis en gras dans les résultats.",
  },
  {
    id: "export", number: "12", title: "Exporter la liste des archives",
    keywords: ["exporter", "export", "CSV", "Excel", "liste", "télécharger"],
    body: "Vous pouvez exporter la liste courante des archives dans un fichier CSV compatible Excel en cliquant sur l'icône de téléchargement dans la barre de navigation gauche. L'export prend en compte les filtres actifs : si vous avez filtré par statut ou par filtre rapide seules les archives correspondantes sont exportées.",
  },
  {
    id: "roles-permissions", number: "13", title: "Rôles et permissions",
    keywords: ["rôle", "permission", "administrateur", "archiviste", "agent", "droits", "accès"],
    body: "L'application distingue trois niveaux d'accès. L'agent peut soumettre des archives et les consulter. L'archiviste peut valider les archives, configurer les DUA et gérer les transitions du cycle de vie. L'administrateur dispose de tous les droits y compris la suppression, la gestion des utilisateurs et la modification de la structure physique.",
  },
  {
    id: "gestion-utilisateurs", number: "13.1", title: "Gestion des utilisateurs",
    keywords: ["utilisateur", "user", "gestion", "permission", "activer", "désactiver", "rôle", "unité"],
    body: "La section Utilisateurs (accessible aux utilisateurs ayant les droits d'écriture) permet de gérer les comptes et permissions du module archives. La liste affiche les utilisateurs filtrés selon votre cadre organique : un administrateur voit tous les utilisateurs, un responsable voit son unité et les unités subordonnées. Pour chaque utilisateur vous pouvez voir ses statistiques (archives soumises, dossiers créés), son journal d'activité récente, activer ou désactiver son compte, changer son unité administrative et modifier ses permissions archives (lecture ou écriture par unité).",
  },
  {
    id: "navigation-profonde", number: "13.2", title: "Navigation directe",
    keywords: ["navigation", "recherche", "redirection", "flash", "scroll", "deep link"],
    body: "En cliquant sur un résultat de recherche globale ou sur une information du tableau de bord vous êtes redirigé directement vers l'élément concerné. Le système change automatiquement d'onglet, charge les données nécessaires, scrolle jusqu'à la ligne exacte et la met en surbrillance jaune pendant deux secondes. Cela fonctionne pour les archives numériques (scroll dans le tableau avec changement de page automatique) et les archives physiques (navigation dans l'arborescence avec chemin complet).",
  },
  {
    id: "glossaire", number: "14", title: "Glossaire",
    keywords: ["glossaire", "définition", "terme", "vocabulaire", "DUA", "lifecycle", "cycle de vie"],
    body: "Archive numérique : fichier électronique conservé dans le système avec ses métadonnées. Archive physique : document papier ou objet conservé dans un espace de stockage réel. DUA : Durée d'Utilité Administrative, délai légal ou réglementaire de conservation. Cycle de vie : ensemble des états successifs traversés par une archive depuis sa création jusqu'à sa destination finale. Sort final : décision prise à l'expiration de la DUA entre conservation définitive et élimination. Rattachement : lien créé entre une archive numérique et son support physique.",
  },
  {
    id: "faq", number: "15", title: "Questions fréquentes",
    keywords: ["FAQ", "questions", "problème", "fréquent", "aide", "erreur", "impossible"],
    body: "Pourquoi mon archive reste-t-elle en attente ? Une archive reste en attente jusqu'à ce qu'un archiviste la valide. Si elle reste bloquée trop longtemps contactez votre responsable. Pourquoi ne puis-je pas supprimer une archive ? La suppression est réservée aux administrateurs. Si vous n'avez pas ce rôle vous ne verrez pas le bouton. Comment retrouver un document ? Utilisez la recherche globale Ctrl+K et saisissez le numéro interne ou le sujet du document. Comment configurer une DUA ? Ouvrez le panneau de détail de l'archive et cliquez sur le bouton DUA.",
  },
];

// ── Fuse.js index ─────────────────────────────────────────────

const fuse = new Fuse(SECTIONS, {
  keys: [
    { name: "title",    weight: 0.5 },
    { name: "keywords", weight: 0.3 },
    { name: "body",     weight: 0.2 },
  ],
  threshold:      0.4,
  includeScore:   true,
  minMatchCharLength: 2,
});

// ── Composants internes ───────────────────────────────────────

function SectionTitle({ id, number, children }: { id: string; number: string; children: React.ReactNode }) {
  return (
    <Typography
      id={id}
      variant="h6"
      fontWeight={700}
      gutterBottom
      sx={{ scrollMarginTop: 80, mt: 4, display: "flex", alignItems: "baseline", gap: 1 }}>
      <Box component="span" sx={{ color: "primary.main", fontVariantNumeric: "tabular-nums", minWidth: 32 }}>
        {number}.
      </Box>
      {children}
    </Typography>
  );
}

function SubTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <Typography id={id} variant="subtitle1" fontWeight={600} sx={{ mt: 2.5, mb: 0.75, scrollMarginTop: 80 }}>
      {children}
    </Typography>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.85 }}>
      {children}
    </Typography>
  );
}

function InfoBox({ children, severity = "info" }: { children: React.ReactNode; severity?: "info" | "warning" | "success" }) {
  const Icon = severity === "warning" ? WarningAmberOutlinedIcon : severity === "success" ? CheckCircleOutlineIcon : InfoOutlinedIcon;
  const color = severity === "warning" ? "warning.main" : severity === "success" ? "success.main" : "info.main";
  return (
    <Box sx={{ display: "flex", gap: 1.5, bgcolor: "action.hover", borderRadius: 1.5, p: 1.75, mb: 2, borderLeft: 3, borderColor: color }}>
      <Icon fontSize="small" sx={{ color, flexShrink: 0, mt: 0.15 }} />
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
        {children}
      </Typography>
    </Box>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.25 }}>
      <Box sx={{
        minWidth: 24, height: 24, borderRadius: "50%",
        bgcolor: "primary.main", color: "primary.contrastText",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, mt: 0.15,
      }}>
        {number}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{children}</Typography>
    </Stack>
  );
}

function FieldDoc({ label, required, example, children }: {
  label: string; required?: boolean; example?: string; children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.2, borderRadius: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Typography variant="body2" fontWeight={700}>{label}</Typography>
        {required && (
          <Chip label="Obligatoire" size="small" color="error" variant="outlined"
            sx={{ height: 18, fontSize: "0.65rem" }} />
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{children}</Typography>
      {example && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
          Exemple : <em>{example}</em>
        </Typography>
      )}
    </Paper>
  );
}

function StatusBadge({ label, color }: { label: string; color: "warning" | "success" | "info" | "secondary" | "error" }) {
  return <Chip label={label} size="small" color={color} sx={{ mr: 0.5 }} />;
}

// ── Composant principal ───────────────────────────────────────

export default function HelpContent() {
  const location = useLocation();
  const token = useToken();
  const anchor   = (location.state as Record<string, unknown> | null)?.helpAnchor as string | undefined;
  const scrolled = useRef(false);
  const docRef   = useRef<HTMLDivElement>(null);

  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState<ManualSection[]>([]);
  const [pdfLoading,  setPdfLoading]  = useState(false);

  // Reset du flag quand l'ancre change (permet la re-navigation)
  const prevAnchor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (anchor !== prevAnchor.current) {
      scrolled.current = false;
      prevAnchor.current = anchor;
    }
  }, [anchor]);

  // Scroll automatique depuis ancre externe (location.state.helpAnchor)
  useEffect(() => {
    if (anchor && !scrolled.current) {
      scrolled.current = true;
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [anchor]);

  // Écoute de l'événement __navigate_help (fallback pour les composants
  // qui ne peuvent pas utiliser react-router directement)
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    const handler = (e: Event) => {
      const section = (e as CustomEvent<{ section?: string }>).detail?.section;
      if (section) {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    root.addEventListener("__navigate_help", handler);
    return () => root.removeEventListener("__navigate_help", handler);
  }, []);

  // Recherche Fuse
  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const results = fuse.search(query.trim()).slice(0, 6).map(r => r.item);
    setSuggestions(results);
  }, [query]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setQuery("");
    setSuggestions([]);
  }, []);

  // Export PDF — tentative navigateur (@react-pdf/renderer), fallback serveur
  const handlePdfDownload = useCallback(async () => {
    setPdfLoading(true);
    try {
      // Chargement dynamique pour ne pas alourdir le bundle initial
      const [{ pdf }, { default: ManualDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ManualPDF"),
      ]);
      const blob = await pdf(ManualDocument()).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GEID_Archives_Manuel_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback : téléchargement via l'API serveur
      try {
        const res = await fetch("/api/stuff/archives/manual/pdf", {
          headers: { Authorization: token ?? "" },
        });
        if (!res.ok) throw new Error("server pdf failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GEID_Archives_Manuel_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        console.error("[HelpContent] PDF generation failed");
      }
    } finally {
      setPdfLoading(false);
    }
  }, [token]);

  const toc = useMemo(() => SECTIONS.filter(s => !s.number.includes(".")), []);

  return (
    <Box sx={{ maxWidth: 860, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>

      {/* ── En-tête ──────────────────────────────────────── */}
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "flex-start" }}
        justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 800 }} gutterBottom>
            Manuel utilisateur — GEID Archives
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Guide complet à destination des agents, archivistes et administrateurs.
          </Typography>
        </Box>
        <Tooltip title={pdfLoading ? "Génération en cours…" : "Télécharger ce manuel en PDF"}>
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={pdfLoading ? <CircularProgress size={14} /> : <PictureAsPdfOutlinedIcon />}
              onClick={handlePdfDownload}
              disabled={pdfLoading}
              sx={{ whiteSpace: "nowrap" }}>
              {pdfLoading ? "Génération…" : "Télécharger PDF"}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* ── Recherche ────────────────────────────────────── */}
      <Box position="relative" mb={3}>
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher dans le manuel… (ex. : DUA, validation, rattachement…)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" color="action" /></InputAdornment>,
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setQuery(""); setSuggestions([]); }}>
                  <CloseOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Collapse in={suggestions.length > 0}>
          <Paper variant="outlined" sx={{ position: "absolute", zIndex: 10, left: 0, right: 0, mt: 0.5 }}>
            {suggestions.map(s => (
              <Stack
                key={s.id}
                direction="row"
                alignItems="center"
                spacing={1}
                px={1.5}
                py={1}
                sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                onClick={() => scrollTo(s.id)}>
                <BookmarkBorderOutlinedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={600}>{s.number}. {s.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {s.body.slice(0, 80)}…
                  </Typography>
                </Box>
                <ArrowRightOutlinedIcon fontSize="small" sx={{ color: "text.disabled" }} />
              </Stack>
            ))}
          </Paper>
        </Collapse>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Zone imprimée / capturable en PDF */}
      <Box ref={docRef}>

        {/* ── Sommaire ──────────────────────────────────── */}
        <SectionTitle id="sommaire" number="0">Sommaire</SectionTitle>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <List dense disablePadding>
            {toc.map(s => (
              <ListItem key={s.id} disablePadding>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  width="100%"
                  sx={{
                    cursor: "pointer", py: 0.5, px: 1, borderRadius: 1,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                  onClick={() => scrollTo(s.id)}>
                  <Typography color="primary.main" variant="body2" fontWeight={700} minWidth={28}>
                    {s.number}
                  </Typography>
                  <Typography variant="body2">{s.title}</Typography>
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Divider sx={{ mb: 3 }} />

        {/* ══════════════════════════════════════════════════
            1. PRÉSENTATION DE L'APPLICATION
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="presentation" number="1">Présentation de l'application</SectionTitle>

        <Paragraph>
          GEID Archives est un système de gestion documentaire développé pour centraliser, organiser
          et protéger l'ensemble des archives d'une organisation. L'application permet de gérer
          simultanément deux dimensions complémentaires : les archives numériques sous forme de
          fichiers électroniques, et les archives physiques conservées dans des espaces de stockage
          réels.
        </Paragraph>
        <Paragraph>
          L'objectif principal de GEID Archives est de garantir la traçabilité complète du cycle
          de vie de chaque document, depuis sa création jusqu'à sa conservation définitive ou sa
          destruction réglementaire. Le système assure également la conformité aux obligations
          légales en matière d'archivage en s'appuyant sur le concept de Durée d'Utilité
          Administrative (DUA), qui définit la durée minimale de conservation obligatoire pour
          chaque type de document.
        </Paragraph>

        <SubTitle>À qui s'adresse ce manuel ?</SubTitle>
        <Paragraph>
          Ce manuel est destiné à trois catégories d'utilisateurs. Les agents soumetteurs, qui
          sont les personnes chargées de déposer les documents dans le système. Les archivistes,
          qui valident les dépôts, configurent les paramètres de conservation et gèrent les
          transitions du cycle de vie. Enfin les administrateurs, qui disposent de la plénitude
          des droits sur le système et sont responsables de la configuration de la structure
          physique et de la gestion des utilisateurs.
        </Paragraph>

        <InfoBox>
          Si vous venez de recevoir vos identifiants et que vous vous connectez pour la première
          fois, nous vous recommandons de commencer par la section 2 (Connexion et interface)
          puis de lire la section correspondant à votre rôle.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            2. CONNEXION ET INTERFACE
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="connexion" number="2">Connexion et interface</SectionTitle>

        <SubTitle>Accéder à l'application</SubTitle>
        <Paragraph>
          Pour accéder à GEID Archives, vous devez disposer d'un compte créé par votre
          administrateur système. Ouvrez l'URL de l'application dans votre navigateur, puis
          saisissez votre adresse de messagerie et votre mot de passe dans les champs prévus à
          cet effet.
        </Paragraph>
        <Step number={1}>Saisissez votre adresse e-mail dans le champ identifiant.</Step>
        <Step number={2}>Entrez votre mot de passe. Le mot de passe est sensible à la casse.</Step>
        <Step number={3}>Cliquez sur le bouton de connexion. Vous serez redirigé vers le tableau de bord.</Step>

        <SubTitle>Structure de l'interface</SubTitle>
        <Paragraph>
          L'interface principale de GEID Archives est organisée en quatre grandes zones. En haut
          de l'écran se trouve la barre d'en-tête qui affiche le nom de l'application et les
          options de profil. Sur la gauche se trouve le menu de navigation vertical donnant accès
          aux quatre sections principales de l'application. La zone centrale occupe l'essentiel
          de l'écran et affiche le contenu de la section sélectionnée. Sur mobile, le menu de
          navigation se transforme en barre de navigation horizontale en bas de l'écran.
        </Paragraph>

        <Box sx={{ overflowX: "auto", mb: 2, ...scrollBarSx }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Section</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Accès requis</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              ["Tableau de bord", "Vue synthétique de l'état du système, alertes et statistiques", "Tous"],
              ["Archives", "Gestion complète des archives numériques", "Tous (lecture) / Archiviste (écriture)"],
              ["Archivage physique", "Inventaire des espaces et supports physiques", "Tous (lecture) / Administrateur (écriture)"],
              ["Aide", "Manuel utilisateur et glossaire", "Tous"],
            ].map(([s, d, a]) => (
              <TableRow key={s}>
                <TableCell>{s}</TableCell>
                <TableCell>{d}</TableCell>
                <TableCell>{a}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>

        <SubTitle>Expiration de la session</SubTitle>
        <Paragraph>
          Votre session expire automatiquement après une période d'inactivité prolongée. Lorsque
          cela se produit, l'application détecte l'expiration et vous déconnecte proprement. Un
          message vous informe de la situation et vous invite à vous reconnecter pour reprendre
          votre travail. Les données non enregistrées avant l'expiration ne sont pas récupérables,
          pensez donc à sauvegarder régulièrement votre travail en cours.
        </Paragraph>
        <InfoBox>
          Si vous êtes déconnecté de manière inattendue, cela signifie probablement que votre
          session a expiré. Reconnectez-vous simplement avec vos identifiants habituels pour
          reprendre votre activité.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            3. TABLEAU DE BORD
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="tableau-de-bord" number="3">Le tableau de bord</SectionTitle>

        <Paragraph>
          Le tableau de bord est la première page qui s'affiche après connexion. Il présente une
          synthèse en temps réel de l'état du système. Toutes les informations affichées sont
          rafraîchies automatiquement à chaque modification effectuée dans l'application.
        </Paragraph>

        <SubTitle>Les cartes statistiques</SubTitle>
        <Paragraph>
          En haut du tableau de bord, une rangée de six cartes présente les compteurs clés du
          système. Chaque carte est cliquable et vous conduit directement vers la section
          correspondante. Le premier compteur indique le nombre total d'archives enregistrées
          dans le système. Le second affiche le nombre d'archives en attente de validation, une
          information particulièrement utile pour les archivistes. Les troisième et quatrième
          compteurs présentent respectivement les archives actives et les archives intermédiaires.
          Les deux derniers compteurs concernent l'inventaire physique avec le nombre de conteneurs
          et le nombre de documents.
        </Paragraph>

        <SubTitle>Les alertes prioritaires</SubTitle>
        <Paragraph>
          Lorsque le système détecte des situations nécessitant une attention particulière, des
          alertes colorées apparaissent en haut du tableau de bord. Une alerte orange vous
          signale le nombre d'archives en attente de validation. Une alerte rouge vous avertit
          que des DUA ont expiré. Une alerte orange vous indique que des classeurs physiques
          approchent de leur capacité maximale. Chaque alerte comporte un bouton pour accéder
          directement à la section concernée.
        </Paragraph>

        <SubTitle>L'activité récente</SubTitle>
        <Paragraph>
          La liste d'activité récente affiche les huit dernières archives ajoutées ou modifiées
          dans le système, triées par date décroissante. Chaque ligne indique la désignation du
          document, la date d'ajout et le statut actuel sous forme de pastille colorée. Cliquez
          sur une ligne pour accéder directement à la gestion des archives.
        </Paragraph>

        <SubTitle>Personnaliser le tableau de bord</SubTitle>
        <Paragraph>
          Le tableau de bord est entièrement personnalisable pour s'adapter à vos besoins
          quotidiens. Vous pouvez configurer les éléments suivants depuis les paramètres du
          tableau de bord.
        </Paragraph>
        <Step number={1}>
          Cartes de synthèse : choisissez jusqu'à six compteurs parmi les douze disponibles
          (archives par statut, inventaire physique, utilisateurs, etc.) et réorganisez-les par
          glisser-déposer selon vos priorités.
        </Step>
        <Step number={2}>
          Sections du tableau de bord : activez ou désactivez individuellement chaque bloc
          d'information — alertes, activité récente, répartition par statut, conservation,
          classeurs, inventaire, utilisateurs et raccourcis.
        </Step>
        <Step number={3}>
          Type de graphique : choisissez le mode de visualisation qui vous convient le mieux
          parmi donut, camembert, barres horizontales ou liste détaillée.
        </Step>
        <Step number={4}>
          Seuils d'alerte : définissez à partir de combien de jours avant l'expiration d'une
          DUA le système doit vous alerter, ainsi que le pourcentage de remplissage des classeurs
          déclenchant une alerte de capacité.
        </Step>
        <Step number={5}>
          Profondeur de l'historique : réglez le nombre d'archives récentes affichées dans la
          liste d'activité, de trois à vingt éléments selon vos préférences.
        </Step>
        <InfoBox severity="success">
          Le tableau de bord se met à jour en temps réel. Chaque modification effectuée dans
          l'application est immédiatement reflétée dans les compteurs et les graphiques, sans
          avoir besoin de rafraîchir la page.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            4. LES ARCHIVES NUMÉRIQUES
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="archives-numeriques" number="4">Les archives numériques</SectionTitle>

        <Paragraph>
          Une archive numérique représente un document électronique conservé dans le système. Elle
          peut être un contrat, un rapport, une décision administrative, un procès-verbal, une
          correspondance officielle ou tout autre document officiel. Chaque archive est décrite
          par un ensemble de métadonnées qui permettent de l'identifier, de la classer et de la
          retrouver facilement.
        </Paragraph>
        <Paragraph>
          Les archives numériques sont gérées depuis la section Archives du menu de navigation.
          L'interface présente un tableau listant toutes les archives auxquelles vous avez accès,
          avec la possibilité de filtrer par statut, par date ou par recherche globale. Sur la
          gauche du tableau, une barre de navigation permet de naviguer rapidement entre les
          différents états du cycle de vie.
        </Paragraph>

        <SubTitle>Protection des fichiers</SubTitle>
        <Paragraph>
          Les fichiers attachés aux archives ne sont pas accessibles publiquement. Contrairement
          à un simple lien de téléchargement, le système vérifie votre identité et vos droits
          d'accès à chaque consultation de fichier. Lorsque vous cliquez sur un fichier pour
          l'ouvrir, l'application transmet automatiquement vos informations de session au serveur,
          qui contrôle que vous êtes bien connecté et autorisé à consulter cette archive avant
          de vous afficher le document.
        </Paragraph>
        <InfoBox>
          Si votre session a expiré au moment où vous tentez d'ouvrir un fichier, vous serez
          invité à vous reconnecter. Ce mécanisme protège la confidentialité des documents
          archivés.
        </InfoBox>

        <SectionTitle id="formulaire-creation" number="4.1">Soumettre une nouvelle archive</SectionTitle>
        <Paragraph>
          Pour soumettre une archive, cliquez sur le bouton Ajouter en haut de la barre de
          navigation gauche. Si ce bouton n'est pas visible, c'est que votre rôle ne vous permet
          pas de créer des archives. Un formulaire s'ouvre dans une fenêtre de dialogue.
        </Paragraph>

        <FieldDoc label="Désignation" required example="Rapport d'activité annuel 2024 — Direction générale">
          Le nom principal du document. Soyez le plus précis possible car c'est la première
          information visible dans la liste des archives et dans les résultats de recherche.
          Évitez les abréviations qui ne seraient pas comprises par tous les utilisateurs.
        </FieldDoc>

        <FieldDoc label="Type documentaire" required example="Rapport — Administratif">
          Sélectionnez le type et le sous-type qui correspondent le mieux à la nature du document.
          Cette classification est utilisée pour les statistiques et peut conditionner certaines
          règles de gestion documentaire dans votre organisation.
        </FieldDoc>

        <FieldDoc label="Numéro de classe" example="ADM-2024-001">
          Le numéro de classement interne selon le plan de classement de votre organisation. Ce
          champ est utilisé par le moteur de recherche et permet de regrouper les documents par
          famille documentaire.
        </FieldDoc>

        <FieldDoc label="Numéro de référence" example="REF-2024-042">
          La référence unique attribuée au document lors de sa création dans votre organisation.
          Si votre organisation utilise un système de numérotation, reportez-le ici.
        </FieldDoc>

        <FieldDoc label="Dossier" example="(automatique)">
          Le dossier de classement est déterminé automatiquement par le serveur à partir du type
          de document choisi. Vous n'avez pas besoin de le renseigner manuellement.
        </FieldDoc>

        <FieldDoc label="Description">
          Un résumé du contenu du document en quelques phrases. Une bonne description améliore
          significativement la pertinence des résultats de recherche.
        </FieldDoc>

        <FieldDoc label="Pièce jointe">
          Le fichier numérique correspondant à l'archive. Les formats acceptés sont généralement
          PDF, Word, Excel et les formats images courants. La taille maximale dépend de la
          configuration de votre serveur.
        </FieldDoc>

        <SubTitle>Choisir la source du fichier</SubTitle>
        <Paragraph>
          Lors de l'ajout d'une pièce jointe, le formulaire vous propose deux options pour
          sélectionner votre fichier.
        </Paragraph>
        <Step number={1}>
          Depuis mon appareil — Sélectionnez un fichier enregistré sur votre ordinateur, tablette
          ou téléphone. Cette option ouvre le sélecteur de fichiers classique de votre système.
        </Step>
        <Step number={2}>
          Depuis mon espace personnel — Choisissez un fichier que vous avez déjà déposé dans votre
          espace de travail personnel. Cette option est pratique si vous avez préparé le document
          en amont dans votre espace avant de l'archiver.
        </Step>

        <InfoBox>
          Après soumission, votre archive est immédiatement visible dans la liste mais son statut
          est en attente de validation. Elle ne sera considérée comme active qu'après validation
          par un archiviste habilité.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            5. CYCLE DE VIE
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="cycle-de-vie" number="5">Le cycle de vie d'une archive</SectionTitle>

        <Paragraph>
          L'un des concepts fondamentaux de GEID Archives est le cycle de vie documentaire. Chaque
          archive passe par des états successifs depuis sa création jusqu'à sa destination finale.
          Ces états ne sont pas arbitraires : ils correspondent à une réalité administrative et
          juridique précise qui encadre la conservation des documents dans les organisations
          publiques et privées.
        </Paragraph>

        <Box my={2} p={2} bgcolor="action.hover" borderRadius={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center" justifyContent="center" flexWrap="wrap">
            {[
              { label: "En attente",    color: "warning" as const },
              { label: "Active",        color: "success" as const },
              { label: "Intermédiaire", color: "info"    as const },
              { label: "Historique",    color: "secondary" as const },
              { label: "Détruite",      color: "error"  as const },
            ].map((s, i, arr) => (
              <Stack key={s.label} direction="row" alignItems="center" spacing={0.5}>
                <StatusBadge label={s.label} color={s.color} />
                {i < arr.length - 1 && (
                  <ArrowRightOutlinedIcon sx={{ color: "text.disabled", display: { xs: "none", sm: "block" } }} />
                )}
              </Stack>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
            Progression typique du cycle de vie d'une archive
          </Typography>
        </Box>

        <SectionTitle id="etat-pending" number="5.1">En attente de validation</SectionTitle>
        <Paragraph>
          C'est l'état initial de toute archive nouvellement déposée. L'archive est enregistrée
          dans le système mais n'a pas encore été examinée par un archiviste. Durant cette phase,
          le déposant peut encore annuler sa soumission s'il constate une erreur. L'archiviste,
          de son côté, reçoit une notification et doit examiner le document pour décider de le
          valider ou non. Les archives en attente sont signalées par un compteur orange sur le
          tableau de bord et dans la barre de navigation gauche.
        </Paragraph>

        <SectionTitle id="etat-active" number="5.2">Archive active</SectionTitle>
        <Paragraph>
          Une archive active est un document validé qui fait partie du fonds documentaire courant
          de l'organisation. Elle est accessible à tous les utilisateurs autorisés et peut faire
          l'objet de consultations régulières. C'est l'état normal d'un document dont l'utilisation
          opérationnelle est encore fréquente. La transition vers cet état est déclenchée par
          l'action de validation d'un archiviste.
        </Paragraph>

        <SectionTitle id="etat-intermediaire" number="5.3">Archive intermédiaire</SectionTitle>
        <Paragraph>
          Lorsqu'un document n'est plus utilisé de manière courante mais doit encore être conservé
          pour des raisons légales, réglementaires ou probatoires, il passe en état intermédiaire.
          Cette phase correspond typiquement à la conservation dans un local d'archives secondaires.
          C'est à ce stade que la Durée d'Utilité Administrative entre en jeu : le système calculera
          automatiquement la date à laquelle l'archive devra être traitée.
        </Paragraph>

        <SectionTitle id="etat-permanent" number="5.4">Archive historique</SectionTitle>
        <Paragraph>
          L'état historique est attribué aux archives qui présentent une valeur patrimoniale,
          historique ou juridique suffisante pour justifier une conservation définitive. Ces
          documents sont versés aux archives définitives et ne peuvent plus être détruits. Ils
          constitueront le fonds historique de l'organisation pour les générations futures.
        </Paragraph>

        <SectionTitle id="etat-detruit" number="5.5">Archive détruite</SectionTitle>
        <Paragraph>
          La destruction d'une archive est l'acte terminal du cycle de vie documentaire. Elle
          intervient lorsque la DUA a expiré et que le sort final décidé est l'élimination. C'est
          une action irréversible qui doit être effectuée avec la plus grande prudence. GEID
          Archives enregistre systématiquement l'historique de toutes les transitions, de sorte
          qu'il est toujours possible de retracer le parcours d'un document même après sa
          destruction.
        </Paragraph>

        <InfoBox severity="warning">
          La destruction d'une archive est définitive et irréversible. Assurez-vous d'avoir vérifié
          que la DUA est bien expirée et que le sort final retenu est bien l'élimination avant de
          procéder. En cas de doute, consultez votre responsable de service.
        </InfoBox>

        <SectionTitle id="elimination-proposee" number="5.6">Élimination proposée</SectionTitle>
        <Paragraph>
          Lorsque la Durée d'Utilité Administrative (DUA) d'une archive arrive à échéance et que
          le sort final configuré est « élimination », l'archive ne passe pas directement en état
          détruit. Elle transite d'abord vers un état intermédiaire appelé « Élimination proposée ».
          Ce mécanisme de sécurité garantit qu'aucune archive n'est détruite automatiquement sans
          intervention humaine.
        </Paragraph>

        <SubTitle>Le procès-verbal d'élimination</SubTitle>
        <Paragraph>
          Pour détruire définitivement les archives en élimination proposée, un procès-verbal
          d'élimination (PV) doit être rédigé et approuvé. Ce PV suit un circuit de validation
          rigoureux en cinq étapes.
        </Paragraph>
        <Step number={1}>
          Brouillon — Le PV est créé par un archiviste. Il liste les archives concernées et
          justifie leur élimination.
        </Step>
        <Step number={2}>
          Visa du producteur — Le service qui a produit les documents examine le PV et confirme
          que les archives peuvent être éliminées.
        </Step>
        <Step number={3}>
          Visa de la DANTIC — L'autorité compétente en matière de gestion documentaire examine
          et valide la conformité du PV.
        </Step>
        <Step number={4}>
          Approuvé — Le PV a reçu tous les visas nécessaires et est prêt à être exécuté.
        </Step>
        <Step number={5}>
          Exécuté — La destruction effective des archives est réalisée. Cette action est
          irréversible et les archives sont définitivement supprimées du système.
        </Step>

        <InfoBox>
          Seule l'exécution du PV d'élimination entraîne la destruction définitive des archives.
          Tant que le PV n'est pas exécuté, les archives restent consultables et intactes.
        </InfoBox>

        <SubTitle>Réactiver ou conserver une archive en élimination proposée</SubTitle>
        <Paragraph>
          Si après examen une archive en élimination proposée s'avère encore nécessaire ou
          présente un intérêt historique non identifié auparavant, il est possible de la
          réactiver vers un état antérieur ou de la basculer en conservation définitive. Cette
          décision doit être prise avant l'exécution du PV d'élimination.
        </Paragraph>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            6. DUA
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="dua" number="6">La Durée d'Utilité Administrative</SectionTitle>

        <Paragraph>
          La Durée d'Utilité Administrative, couramment abrégée DUA, est un concept fondamental
          de la gestion des archives. Elle désigne la période pendant laquelle une organisation
          est tenue de conserver un document avant de pouvoir l'éliminer ou le verser aux archives
          définitives. Cette durée est généralement fixée par des textes réglementaires ou par la
          politique interne de l'organisation.
        </Paragraph>
        <Paragraph>
          Dans GEID Archives, la DUA est associée à chaque archive de type intermédiaire. Le
          système calcule automatiquement la date d'expiration et vous alerte par des indicateurs
          visuels dans le tableau de bord et dans la liste des archives dès que l'échéance approche.
        </Paragraph>

        <SectionTitle id="dua-configuration" number="6.1">Configurer une DUA</SectionTitle>
        <Paragraph>
          Pour configurer la DUA d'une archive, ouvrez son panneau de détail en cliquant sur sa
          ligne dans la liste, puis cliquez sur le bouton DUA dans la barre d'actions rapides
          en haut du panneau.
        </Paragraph>
        <Step number={1}>Saisissez la valeur numérique dans le champ prévu. Par exemple, saisissez 5 pour cinq années.</Step>
        <Step number={2}>Choisissez l'unité de temps dans la liste : jours, mois ou années.</Step>
        <Step number={3}>Indiquez la date de départ de la DUA. Il s'agit souvent de la date de clôture du dossier ou de la date de la dernière action administrative.</Step>
        <Step number={4}>Choisissez le sort final : conservation définitive pour verser l'archive aux archives historiques, ou élimination pour la détruire à l'expiration.</Step>
        <Step number={5}>Confirmez en cliquant sur Enregistrer. La date d'expiration calculée s'affiche immédiatement.</Step>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            7. VALIDATION
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="validation" number="7">Valider une archive</SectionTitle>

        <Paragraph>
          La validation est l'acte par lequel un archiviste certifie qu'une archive soumise est
          complète, correctement renseignée et conforme aux exigences documentaires de
          l'organisation. C'est une étape de contrôle qualité essentielle qui garantit l'intégrité
          du fonds d'archives.
        </Paragraph>

        <SubTitle>Procédure de validation</SubTitle>
        <Step number={1}>Accédez à la section Archives depuis le menu de navigation.</Step>
        <Step number={2}>Cliquez sur la ligne de l'archive en attente pour ouvrir son panneau de détail.</Step>
        <Step number={3}>Examinez les informations saisies par le déposant : désignation, type, description et fichier joint. Le dossier de classement est attribué automatiquement.</Step>
        <Step number={4}>Si tout est conforme, cliquez sur le bouton Valider dans la barre d'actions rapides. Un message de confirmation s'affiche.</Step>
        <Step number={5}>Si le document comporte des erreurs, contactez le déposant pour qu'il corrige sa soumission.</Step>

        <InfoBox severity="success">
          Après validation, l'archive passe immédiatement en état actif. Le déposant est informé
          par une notification si les notifications sont activées dans votre configuration.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            8. MODIFICATION
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="modification" number="8">Modifier une archive</SectionTitle>

        <Paragraph>
          Il est possible de modifier les métadonnées d'une archive après sa création et même
          après sa validation. Cette fonctionnalité est utile pour corriger des erreurs de saisie,
          compléter des informations manquantes ou mettre à jour des références.
        </Paragraph>
        <Step number={1}>Cliquez sur la ligne de l'archive dans la liste pour ouvrir le panneau de détail.</Step>
        <Step number={2}>Cliquez sur le bouton Modifier (icône crayon) dans la barre d'actions rapides.</Step>
        <Step number={3}>Le formulaire s'ouvre prérempli avec les données actuelles de l'archive.</Step>
        <Step number={4}>Apportez vos modifications puis cliquez sur Enregistrer.</Step>

        <InfoBox>
          La modification d'une archive ne modifie pas son statut dans le cycle de vie. Elle
          enregistre uniquement les métadonnées descriptives du document. L'historique des
          transitions de cycle de vie reste inchangé.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            9. SUPPRESSION
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="suppression" number="9">Supprimer des archives</SectionTitle>

        <Paragraph>
          La suppression est une action irréversible réservée aux utilisateurs disposant du rôle
          administrateur. Elle efface définitivement l'archive du système, y compris son fichier
          joint et toutes ses métadonnées.
        </Paragraph>

        <SubTitle>Supprimer une seule archive</SubTitle>
        <Step number={1}>Ouvrez le panneau de détail de l'archive à supprimer.</Step>
        <Step number={2}>Cliquez sur le bouton Supprimer (icône corbeille) en haut du panneau.</Step>
        <Step number={3}>Une fenêtre de confirmation s'affiche avec le nom de l'archive. Lisez attentivement ce message.</Step>
        <Step number={4}>Confirmez en cliquant sur Supprimer définitivement.</Step>

        <SubTitle>Supprimer plusieurs archives en même temps</SubTitle>
        <Step number={1}>Cochez les cases à gauche de chaque archive à supprimer dans la liste.</Step>
        <Step number={2}>Ouvrez le menu Actions en haut à droite du tableau.</Step>
        <Step number={3}>Choisissez Supprimer la sélection.</Step>
        <Step number={4}>Confirmez la suppression dans la fenêtre qui s'ouvre.</Step>

        <InfoBox severity="warning">
          Une archive supprimée ne peut pas être récupérée. Avant de procéder, assurez-vous que
          le document n'est plus nécessaire et que toutes les personnes concernées en ont été
          informées. La suppression doit toujours être la décision de dernier recours.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            10. ARCHIVAGE PHYSIQUE
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="archivage-physique" number="10">L'archivage physique</SectionTitle>

        <Paragraph>
          L'archivage physique est le module de GEID Archives qui permet de gérer l'inventaire
          des espaces et supports de conservation réels. Il modélise fidèlement la réalité d'un
          centre d'archives physiques, depuis la salle de conservation jusqu'à la fiche de document
          individuelle.
        </Paragraph>

        <SectionTitle id="hierarchie-physique" number="10.1">La hiérarchie des espaces physiques</SectionTitle>
        <Paragraph>
          L'organisation physique est représentée sous forme d'une arborescence à six niveaux
          imbriqués. Chaque niveau dépend du niveau supérieur et peut contenir un nombre illimité
          d'éléments du niveau inférieur. Imaginez une bibliothèque : vous entrez d'abord dans la
          salle, vous vous dirigez vers un rayonnage, vous choisissez un compartiment, vous prenez
          une boîte, vous ouvrez un dossier, et vous trouvez la pièce recherchée.
        </Paragraph>

        {[
          { level: "Conteneur", desc: "C'est le point d'entrée de la hiérarchie, comme une armoire, une étagère métallique ou un local de stockage. Imaginez la grande armoire dans laquelle tout est rangé." },
          { level: "Étagère", desc: "Une rangée à l'intérieur du conteneur, comme un rayon dans une armoire. Chaque étagère regroupe plusieurs compartiments superposés." },
          { level: "Niveau", desc: "Un compartiment sur l'étagère, comme une tablette ou un étage précis dans le rayonnage. Le niveau permet de localiser exactement où se trouve un classeur." },
          { level: "Classeur", desc: "La chemise, la boîte ou la reliure qui regroupe les dossiers. C'est l'unité de rangement concrète que vous prenez en main. Le classeur peut avoir une capacité maximale définie, ce qui permet au système de surveiller son taux de remplissage." },
          { level: "Dossier", desc: "Un ensemble de pièces relatives à une même affaire. Par exemple, le dossier « Marché public 2024-003 » regroupe tous les documents liés à ce marché. Chaque dossier reçoit un code QR unique pour faciliter son identification." },
          { level: "Document", desc: "La pièce individuelle à l'intérieur d'un dossier. C'est le niveau le plus fin de la hiérarchie. Un document peut contenir des archives numériques et peut lui-même contenir des sous-documents pour modéliser des classements internes." },
        ].map(({ level, desc }) => (
          <Box key={level} mb={1.5} pl={1} borderLeft={2} borderColor="primary.main">
            <Typography variant="body2" fontWeight={700}>{level}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{desc}</Typography>
          </Box>
        ))}

        <SectionTitle id="rattachement" number="10.2">Rattacher une archive numérique à un document</SectionTitle>
        <Paragraph>
          Le rattachement est l'opération qui crée le lien entre le monde numérique et le monde
          physique. Les archives numériques se rattachent uniquement aux documents, car c'est le
          document qui représente la pièce individuelle à laquelle correspond le fichier numérique.
          Un dossier sert à regrouper les documents, mais on ne rattache pas directement une archive
          à un dossier : on la rattache à un document précis à l'intérieur de ce dossier.
        </Paragraph>
        <Paragraph>
          Ce lien est bidirectionnel : depuis la fiche numérique vous pouvez voir la
          localisation physique, et depuis le document vous pouvez lister toutes les
          archives numériques rattachées.
        </Paragraph>
        <Step number={1}>Ouvrez le panneau de détail de l'archive numérique à rattacher.</Step>
        <Step number={2}>Cliquez sur le bouton Dossier physique dans la barre d'actions rapides.</Step>
        <Step number={3}>Une fenêtre s'ouvre avec la hiérarchie physique. Parcourez les niveaux jusqu'au document souhaité.</Step>
        <Step number={4}>Sélectionnez le document et confirmez avec le bouton Rattacher.</Step>
        <Step number={5}>L'archive affiche maintenant la référence physique dans son panneau de détail.</Step>

        <InfoBox>
          Pour détacher une archive d'un document, ouvrez le même dialogue et choisissez Détacher.
          L'opération est instantanée et vous pourrez ensuite effectuer un nouveau rattachement si nécessaire.
        </InfoBox>

        {/* ── 10.3 Glisser-déposer ── */}
        <SectionTitle id="glisser-deposer" number="10.3">Glisser-déposer une archive entre documents</SectionTitle>
        <Paragraph>
          Vous pouvez déplacer une archive numérique d'un document vers un autre sans passer
          par le dialogue de rattachement, en utilisant le glisser-déposer.
        </Paragraph>
        <Step number={1}>Maintenez le clic sur une archive numérique dans la liste.</Step>
        <Step number={2}>Glissez-la vers un autre document dans l'arborescence ou dans la liste.</Step>
        <Step number={3}>Un cadre bleu apparaît autour du document cible pour indiquer qu'il accepte le fichier.</Step>
        <Step number={4}>Relâchez le clic. Une fenêtre de confirmation apparaît avant le déplacement.</Step>
        <Step number={5}>Confirmez pour valider le déplacement, ou annulez pour revenir en arrière.</Step>

        <InfoBox>
          Vous pouvez aussi effectuer cette opération avec le menu clic droit sur l'archive,
          puis choisir « Déplacer vers un autre document ».
        </InfoBox>

        {/* ── 10.4 Naviguer entre les conteneurs ── */}
        <SectionTitle id="naviguer-conteneurs" number="10.4">Naviguer entre les conteneurs</SectionTitle>
        <Paragraph>
          En haut de l'arborescence, un sélecteur sous forme de liste déroulante permet de
          choisir le conteneur actif. Quand vous sélectionnez un autre conteneur, le contenu
          de l'arborescence change automatiquement pour afficher la hiérarchie de ce conteneur.
        </Paragraph>
        <Step number={1}>Cliquez sur le sélecteur en haut de l'arborescence pour voir la liste des conteneurs disponibles.</Step>
        <Step number={2}>Choisissez le conteneur que vous souhaitez consulter.</Step>
        <Step number={3}>L'arborescence et l'explorateur se mettent à jour instantanément.</Step>
        <Paragraph>
          Le bouton + situé à côté du sélecteur permet de créer un nouveau conteneur si vous
          disposez des droits d'écriture.
        </Paragraph>

        {/* ── 10.5 Ajuster l'affichage ── */}
        <SectionTitle id="ajuster-affichage" number="10.5">Ajuster l'affichage</SectionTitle>
        <Paragraph>
          La bordure entre l'arborescence (panneau gauche) et la liste centrale peut être
          déplacée pour ajuster la largeur de chaque zone selon vos préférences.
        </Paragraph>
        <Step number={1}>Positionnez votre curseur sur la ligne de séparation entre les deux zones. Le curseur change de forme.</Step>
        <Step number={2}>Maintenez le clic et glissez vers la gauche ou la droite pour élargir ou réduire l'arborescence.</Step>
        <Step number={3}>Relâchez le clic quand la disposition vous convient.</Step>

        {/* ── 10.6 Documents et sous-documents ── */}
        <SectionTitle id="documents-physiques" number="10.6">Les documents et sous-documents</SectionTitle>
        <Paragraph>
          Un dossier peut contenir un ou plusieurs documents. Chaque document peut lui-même
          contenir d'autres sous-documents et des archives numériques. Cette structure permet
          de modéliser des dossiers avec plusieurs niveaux de classement internes.
        </Paragraph>
        <Step number={1}>Naviguez dans un dossier pour voir ses documents.</Step>
        <Step number={2}>Cliquez sur le bouton d'ajout pour créer un nouveau document.</Step>
        <Step number={3}>Remplissez le formulaire : titre, description, nature et date.</Step>
        <Step number={4}>Les sous-documents se créent de la même manière en naviguant dans un document parent.</Step>

        <SectionTitle id="qrcode" number="10.7">Le code QR d'un dossier</SectionTitle>
        <Paragraph>
          Chaque dossier se voit attribuer automatiquement un code QR unique lors de
          sa création dans le système. Ce code identifiant est unique et peut être imprimé sur une
          étiquette adhésive et collé sur la chemise correspondante.
        </Paragraph>
        <Paragraph>
          Lors d'une consultation physique des archives, il suffit de scanner ce code avec un
          appareil photo ou un lecteur de code QR pour retrouver instantanément la fiche du
          dossier dans le système et accéder à tous les documents et archives numériques rattachées.
        </Paragraph>

        <SectionTitle id="datepicker" number="10.8">Saisie des dates avec le calendrier</SectionTitle>
        <Paragraph>
          Tous les champs de date dans les formulaires de l'archivage physique utilisent un
          sélecteur de date avec calendrier interactif. Le format d'affichage est JJ/MM/AAAA.
          Vous pouvez cliquer sur l'icône calendrier pour ouvrir le sélecteur, naviguer entre
          les mois et les années, ou saisir directement la date au clavier.
        </Paragraph>

        <SectionTitle id="arborescence" number="10.9">L'arborescence interactive</SectionTitle>
        <Paragraph>
          Sur les grands écrans, un panneau latéral gauche affiche l'arborescence complète de
          l'archivage physique sous forme d'arbre interactif. Chaque niveau est identifié par
          son icône distinctive : entrepôt pour les conteneurs, serveur pour les étagères,
          couches pour les niveaux, onglets pour les classeurs, dossier pour les dossiers et
          document pour les documents. Cliquez sur un élément pour charger son contenu et le
          sélectionner dans l'explorateur principal. L'arbre se charge progressivement pour
          rester fluide même avec un grand volume de données.
        </Paragraph>

        <SectionTitle id="ouvrir-fichier" number="10.10">Ouvrir un fichier</SectionTitle>
        <Paragraph>
          Quand vous cliquez sur un fichier pour l'ouvrir, une barre de progression apparaît
          en bas de l'écran pour vous indiquer l'avancement du chargement. Si le fichier est
          volumineux, vous pouvez annuler le chargement à tout moment en cliquant sur le bouton
          Annuler qui accompagne la barre de progression.
        </Paragraph>
        <Paragraph>
          Un fichier que vous avez déjà consulté s'ouvre instantanément la prochaine fois,
          sans attente. Si vous n'êtes pas connecté à internet au moment de l'ouverture, un
          message vous en informe clairement.
        </Paragraph>

        <SubTitle>Les icônes des fichiers</SubTitle>
        <Paragraph>
          Chaque fichier est représenté par une icône colorée qui indique son type, ce qui vous
          permet de repérer rapidement la nature du document sans l'ouvrir. Les documents PDF
          apparaissent en rouge, les documents Word en bleu, les tableurs Excel en vert, les
          images en violet et les vidéos en rouge foncé.
        </Paragraph>

        <SubTitle>Renommer un élément physique</SubTitle>
        <Paragraph>
          Les utilisateurs disposant des droits d'écriture peuvent renommer n'importe quel
          élément de la hiérarchie physique (conteneur, étagère, niveau, classeur, dossier ou
          document). Deux méthodes sont disponibles pour effectuer cette opération.
        </Paragraph>
        <Step number={1}>
          Double-cliquez directement sur le nom de l'élément dans la liste. Le texte devient
          modifiable. Saisissez le nouveau nom puis appuyez sur Entrée pour valider ou sur
          Échap pour annuler.
        </Step>
        <Step number={2}>
          Faites un clic droit sur l'élément pour ouvrir le menu contextuel, puis choisissez
          Renommer. Le nom de l'élément devient modifiable de la même manière.
        </Step>

        <InfoBox>
          La fonction de renommage n'est accessible qu'aux utilisateurs ayant les droits
          d'écriture sur l'archivage physique. Si vous ne voyez pas l'option Renommer dans le
          menu contextuel ou si le double-clic ne produit aucun effet, c'est que votre rôle ne
          vous y autorise pas.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            11. RECHERCHE
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="recherche" number="11">Rechercher dans le système</SectionTitle>

        <Paragraph>
          GEID Archives dispose d'un moteur de recherche unifié qui explore simultanément toutes
          les archives numériques et tous les documents de l'archivage physique enregistrés dans le système.
          Cette recherche globale est accessible à tout moment depuis n'importe quelle section
          de l'application.
        </Paragraph>

        <SubTitle>Accéder à la recherche</SubTitle>
        <Paragraph>
          Deux méthodes permettent d'ouvrir la fenêtre de recherche. Vous pouvez utiliser le
          raccourci clavier Ctrl+K sur Windows et Linux ou la touche Commande+K sur Mac.
          Vous pouvez également cliquer sur l'icône loupe dans la barre de navigation gauche
          de la section Archives.
        </Paragraph>

        <SubTitle>Critères de recherche</SubTitle>
        <Paragraph>
          La recherche s'effectue sur l'ensemble des champs descriptifs des documents. Pour les
          archives numériques, elle explore la désignation, la description, le numéro de classe,
          le numéro de référence, le dossier et les étiquettes. Pour les documents de l'archivage physique,
          elle explore le numéro interne, le numéro de référence, le sujet, la catégorie et la
          nature du document.
        </Paragraph>
        <Paragraph>
          Saisissez au moins deux caractères pour déclencher la recherche. Les résultats
          s'affichent immédiatement, groupés en deux sections distinctes : Archives numériques
          et Documents physiques. Le nombre total de résultats est indiqué en bas de la fenêtre.
        </Paragraph>

        <SubTitle>Recherche tolérante et mise en évidence</SubTitle>
        <Paragraph>
          Le moteur de recherche est tolérant aux imprécisions de saisie. Il gère
          automatiquement les accents et les mots partiels : par exemple, saisir « decret » ou
          « décret » donnera les mêmes résultats, et saisir « rapp » trouvera les documents
          contenant « rapport ». Les parties du texte qui correspondent à votre recherche sont
          mises en gras dans les résultats, ce qui vous permet d'identifier rapidement pourquoi
          un document est apparu dans la liste.
        </Paragraph>
        <InfoBox severity="success">
          Si vous ne trouvez pas un document avec un terme précis, essayez une variante sans
          accent ou avec seulement le début du mot. La recherche tolérante augmente vos chances
          de trouver le bon résultat même avec une saisie approximative.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            12. EXPORT
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="export" number="12">Exporter la liste des archives</SectionTitle>

        <Paragraph>
          GEID Archives permet d'exporter la liste des archives dans un fichier tabulaire
          compatible avec Microsoft Excel, LibreOffice Calc et la plupart des outils de traitement
          de données. Cette fonctionnalité est utile pour produire des rapports périodiques,
          partager l'état du fonds avec des partenaires ou effectuer des analyses statistiques
          complémentaires.
        </Paragraph>
        <Step number={1}>Appliquez les filtres souhaités dans la section Archives (par statut, par filtre rapide ou via la recherche).</Step>
        <Step number={2}>Cliquez sur l'icône de téléchargement (flèche vers le bas) dans la barre de navigation gauche.</Step>
        <Step number={3}>Le fichier CSV est téléchargé automatiquement avec un nom incluant la date du jour.</Step>

        <InfoBox>
          L'export prend en compte exactement les données visibles dans le tableau au moment du
          clic. Si vous souhaitez exporter l'ensemble des archives sans filtre, assurez-vous
          d'abord que le filtre Toutes est sélectionné dans la barre de navigation.
        </InfoBox>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            13. RÔLES ET PERMISSIONS
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="roles-permissions" number="13">Rôles et permissions</SectionTitle>

        <Paragraph>
          GEID Archives repose sur un système de contrôle d'accès basé sur des rôles. Chaque
          utilisateur se voit attribuer un rôle qui détermine les actions qu'il est autorisé à
          effectuer. Ce système garantit que les opérations sensibles comme la validation ou
          la suppression ne peuvent être réalisées que par des personnes habilitées.
        </Paragraph>

        <Box sx={{ overflowX: "auto", mb: 2, ...scrollBarSx }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Action</strong></TableCell>
              <TableCell align="center"><strong>Agent</strong></TableCell>
              <TableCell align="center"><strong>Archiviste</strong></TableCell>
              <TableCell align="center"><strong>Administrateur</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              ["Soumettre une archive",                  "✓", "✓", "✓"],
              ["Consulter les archives",                  "✓", "✓", "✓"],
              ["Valider une archive",                     "—", "✓", "✓"],
              ["Modifier une archive",                    "—", "✓", "✓"],
              ["Configurer la DUA",                       "—", "✓", "✓"],
              ["Gérer les transitions du cycle de vie",   "—", "✓", "✓"],
              ["Supprimer des archives",                  "—", "—", "✓"],
              ["Gérer la structure physique",             "—", "—", "✓"],
              ["Rattacher archives numériques/physiques", "—", "✓", "✓"],
              ["Gérer les utilisateurs",                  "—", "—", "✓"],
            ].map(([action, ...cols]) => (
              <TableRow key={action}>
                <TableCell>{action}</TableCell>
                {cols.map((v, i) => (
                  <TableCell key={i} align="center" sx={{ color: v === "✓" ? "success.main" : "text.disabled", fontWeight: v === "✓" ? 700 : 400 }}>
                    {v}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            14. GLOSSAIRE
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="glossaire" number="14">Glossaire</SectionTitle>

        <Paragraph>
          Cette section réunit les définitions des termes techniques et administratifs utilisés
          dans GEID Archives et dans ce manuel.
        </Paragraph>

        {[
          { term: "Archive numérique",    def: "Document électronique enregistré dans GEID Archives avec l'ensemble de ses métadonnées descriptives et son fichier attaché." },
          { term: "Archive physique",     def: "Document papier ou objet matériel conservé dans un espace de stockage réel, représenté dans le système par une fiche physique." },
          { term: "Cycle de vie",         def: "Ensemble des états successifs traversés par une archive depuis sa création jusqu'à sa destination finale : conservation définitive ou élimination." },
          { term: "DUA",                  def: "Durée d'Utilité Administrative. Période pendant laquelle un document doit être conservé de manière obligatoire avant d'être traité selon son sort final." },
          { term: "Métadonnée",           def: "Information descriptive attachée à un document : désignation, type, référence, date, auteur, etc. Les métadonnées permettent d'identifier, de classer et de retrouver les archives." },
          { term: "Rattachement",         def: "Lien créé entre une archive numérique et un document dans la hiérarchie physique. Ce lien permet de retrouver la localisation physique d'un fichier numérique." },
          { term: "Sort final",           def: "Décision prise à l'expiration de la DUA : soit conservation définitive (versement aux archives historiques), soit élimination (destruction contrôlée)." },
          { term: "Transition",           def: "Passage d'un état à un autre dans le cycle de vie d'une archive. Chaque transition est enregistrée dans l'historique du document avec la date et l'auteur." },
          { term: "Validation",           def: "Acte par lequel un archiviste certifie qu'une archive soumise est conforme aux exigences documentaires et l'admet dans le fonds actif." },
          { term: "Versement",            def: "Transfert d'archives d'un service producteur vers un service d'archives pour conservation définitive." },
        ].map(({ term, def }) => (
          <Box key={term} mb={1.25} pl={1.5} borderLeft={2} borderColor="divider">
            <Typography variant="body2" fontWeight={700} color="text.primary">{term}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{def}</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        {/* ══════════════════════════════════════════════════
            15. FAQ
        ════════════════════════════════════════════════════ */}
        <SectionTitle id="faq" number="15">Questions fréquentes</SectionTitle>

        {[
          {
            q: "Pourquoi mon archive reste-t-elle en attente depuis plusieurs jours ?",
            a: "Une archive reste dans l'état en attente jusqu'à ce qu'un archiviste ou un administrateur l'examine et la valide. Si vous soumettez une archive et qu'elle reste en attente plus longtemps que prévu, contactez votre responsable de service ou votre archiviste référent pour les alerter.",
          },
          {
            q: "Pourquoi le bouton Supprimer n'est-il pas visible pour moi ?",
            a: "La suppression est une action réservée aux administrateurs. Si votre rôle est agent ou archiviste, ce bouton ne s'affichera pas. Si vous pensez avoir besoin de supprimer un document, adressez une demande à votre administrateur en lui indiquant l'identifiant de l'archive concernée.",
          },
          {
            q: "Comment retrouver rapidement un document dont je ne connais que le sujet aproximatif ?",
            a: "Utilisez la recherche globale en appuyant sur Ctrl+K. Saisissez les mots clés qui vous semblent caractériser le document : un mot de la désignation, un numéro partiel, un terme du dossier. Le moteur de recherche effectue une recherche approximative qui trouvera des résultats même si votre saisie n'est pas exacte.",
          },
          {
            q: "Est-il possible de modifier une archive après validation ?",
            a: "Oui, les archivistes et les administrateurs peuvent modifier les métadonnées d'une archive à tout stade de son cycle de vie. En revanche, le fichier attaché ne peut pas être remplacé après validation pour préserver l'intégrité du document archivé.",
          },
          {
            q: "Comment configurer une DUA si je ne connais pas la durée réglementaire applicable ?",
            a: "La durée de conservation réglementaire dépend du type de document et du secteur d'activité de votre organisation. Référez-vous au tableau de gestion documentaire de votre organisation ou consultez votre archiviste référent. En l'absence de règle spécifique, une durée minimale de cinq à dix ans est souvent appliquée à titre conservatoire.",
          },
          {
            q: "Que se passe-t-il si je rattache une archive numérique au mauvais document ?",
            a: "Vous pouvez à tout moment défaire un rattachement et en créer un nouveau. Ouvrez le panneau de détail de l'archive numérique, cliquez sur le bouton Dossier physique, puis choisissez Détacher. L'opération est instantanée et vous pourrez ensuite effectuer le bon rattachement.",
          },
        ].map(({ q, a }, i) => (
          <FaqItem key={i} question={q} answer={a} />
        ))}

        <Box mt={4} pt={2} borderTop={1} borderColor="divider">
          <Typography variant="caption" color="text.disabled">
            GEID Archives — Manuel utilisateur · Version {new Date().getFullYear()} · Document généré le {new Date().toLocaleDateString("fr-FR")}
          </Typography>
        </Box>

      </Box>
    </Box>
  );
}

// ── FAQ accordéon ────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Box mb={1}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{ cursor: "pointer", p: 1.25, borderRadius: 1.5, bgcolor: open ? "action.selected" : "action.hover", "&:hover": { bgcolor: "action.selected" } }}
        onClick={() => setOpen(o => !o)}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Typography color="primary.main" variant="body2" fontWeight={700} sx={{ mt: 0.1, flexShrink: 0 }}>Q.</Typography>
          <Typography variant="body2" fontWeight={600}>{question}</Typography>
        </Stack>
        <ExpandMoreOutlinedIcon
          fontSize="small"
          sx={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", color: "text.secondary" }}
        />
      </Stack>
      <Collapse in={open}>
        <Box px={2} pt={1} pb={1.5}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.85 }}>{answer}</Typography>
        </Box>
      </Collapse>
    </Box>
  );
}
