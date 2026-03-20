/**
 * ManualPDF — Document PDF A4 complet de GEID Archives.
 * Rendu par @react-pdf/renderer (100 % côté client, aucun screenshot).
 *
 * Design : page de garde pleine couleur, en-tête/pied de page sur chaque feuille,
 * typographie professionnelle, boîtes d'information colorées, tableaux, listes numérotées.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
} from "@react-pdf/renderer";
import logoWhite from "../../../assets/geid_logo_white.png";

// ── Palette ─────────────────────────────────────────────────

const P   = "#1565C0"; // primary
const PD  = "#0D47A1"; // primary dark
const PL  = "#E8F0FE"; // primary light
const TXT = "#1A1A2E"; // text
const TSC = "#546E7A"; // text secondary
const BRD = "#CFD8DC"; // border / divider
const WBG = "#FFF8E1"; // warning bg
const WBR = "#F59E0B"; // warning border
const IBG = "#E8F0FE"; // info bg
const IBR = "#1565C0"; // info border
const SBG = "#E8F5E9"; // success bg
const SBR = "#2E7D32"; // success border
const EBG = "#FFEBEE"; // error bg
const EBR = "#C62828"; // error border

// ── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  // Pages
  page:        { paddingTop: 48, paddingBottom: 52, paddingHorizontal: 52, fontFamily: "Helvetica", backgroundColor: "#FAFAFA" },
  coverPage:   { fontFamily: "Helvetica", backgroundColor: P },

  // Header / Footer
  pageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: P },
  pageFooter:  { position: "absolute", bottom: 22, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: BRD, paddingTop: 5 },
  headerApp:   { fontSize: 8, color: P, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  headerSec:   { fontSize: 8, color: TSC },
  footerTxt:   { fontSize: 7.5, color: TSC },
  pageNum:     { fontSize: 7.5, color: P, fontFamily: "Helvetica-Bold" },

  // Cover
  coverWrap:      { flex: 1, flexDirection: "column", justifyContent: "space-between" },
  coverTop:       { backgroundColor: PD, paddingHorizontal: 52, paddingTop: 60, paddingBottom: 40 },
  coverBadge:     { fontSize: 9, color: "#90CAF9", letterSpacing: 2, marginBottom: 18, fontFamily: "Helvetica-Bold" },
  coverTitle:     { fontSize: 36, color: "#FFFFFF", fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 10 },
  coverSubtitle:  { fontSize: 16, color: "#BBDEFB", marginBottom: 6 },
  coverDesc:      { fontSize: 11, color: "#90CAF9", lineHeight: 1.6 },
  coverMid:       { backgroundColor: P, paddingHorizontal: 52, paddingVertical: 28 },
  coverAudience:  { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  coverTag:       { backgroundColor: "#1976D2", borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8 },
  coverTagTxt:    { fontSize: 9, color: "#E3F2FD", fontFamily: "Helvetica-Bold" },
  coverBot:       { backgroundColor: "#0A2472", paddingHorizontal: 52, paddingVertical: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  coverMeta:      { fontSize: 9, color: "#90CAF9" },
  coverVersion:   { fontSize: 22, color: "#E3F2FD", fontFamily: "Helvetica-Bold" },

  // TOC
  tocEntry:       { flexDirection: "row", alignItems: "baseline", marginBottom: 5 },
  tocNum:         { fontSize: 10, color: P, fontFamily: "Helvetica-Bold", width: 36 },
  tocTitle:       { fontSize: 10, color: TXT, flex: 1 },
  tocDots:        { flex: 1, borderBottomWidth: 0.5, borderBottomStyle: "dotted", borderBottomColor: BRD, marginHorizontal: 4, height: 1, alignSelf: "flex-end", marginBottom: 3 },
  tocSub:         { flexDirection: "row", alignItems: "baseline", marginBottom: 3, paddingLeft: 16 },
  tocSubNum:      { fontSize: 9, color: TSC, width: 28 },
  tocSubTitle:    { fontSize: 9, color: TSC, flex: 1 },

  // Chapter header
  chapterTag:     { backgroundColor: P, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 8, alignSelf: "flex-start", marginBottom: 6 },
  chapterTagTxt:  { fontSize: 8.5, color: "#FFFFFF", fontFamily: "Helvetica-Bold", letterSpacing: 0.8 },
  chapterTitle:   { fontSize: 22, color: PD, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  chapterUnder:   { width: 60, height: 3, backgroundColor: P, borderRadius: 2, marginBottom: 14 },
  chapterIntro:   { fontSize: 10.5, color: TSC, lineHeight: 1.75, marginBottom: 14 },

  // Section titles
  h2:             { fontSize: 14, color: PD, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 6, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: P },
  h3:             { fontSize: 11.5, color: TXT, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
  h4:             { fontSize: 10.5, color: P, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 3 },

  // Body
  p:              { fontSize: 10, color: TXT, lineHeight: 1.8, marginBottom: 8 },
  small:          { fontSize: 8.5, color: TSC, lineHeight: 1.6, marginBottom: 6 },
  mono:           { fontFamily: "Courier", fontSize: 9, color: PD },

  // Bullets & Steps
  bullet:         { flexDirection: "row", marginBottom: 4, paddingLeft: 4 },
  bulletDot:      { width: 14, fontSize: 10, color: P, marginTop: 0.5 },
  bulletTxt:      { flex: 1, fontSize: 10, color: TXT, lineHeight: 1.7 },
  step:           { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" },
  stepNum:        { width: 20, height: 20, borderRadius: 10, backgroundColor: P, alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 1 },
  stepNumTxt:     { fontSize: 8.5, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
  stepTxt:        { flex: 1, fontSize: 10, color: TXT, lineHeight: 1.7 },

  // Info boxes
  infoBox:        { flexDirection: "row", backgroundColor: IBG, borderLeftWidth: 3, borderLeftColor: IBR, borderRadius: 3, padding: 10, marginBottom: 10 },
  warnBox:        { flexDirection: "row", backgroundColor: WBG, borderLeftWidth: 3, borderLeftColor: WBR, borderRadius: 3, padding: 10, marginBottom: 10 },
  successBox:     { flexDirection: "row", backgroundColor: SBG, borderLeftWidth: 3, borderLeftColor: SBR, borderRadius: 3, padding: 10, marginBottom: 10 },
  errorBox:       { flexDirection: "row", backgroundColor: EBG, borderLeftWidth: 3, borderLeftColor: EBR, borderRadius: 3, padding: 10, marginBottom: 10 },
  boxLabel:       { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, marginBottom: 3 },
  boxTxt:         { fontSize: 9.5, color: TXT, lineHeight: 1.7 },

  // Field doc
  fieldBox:       { borderWidth: 0.5, borderColor: BRD, borderRadius: 3, padding: 10, marginBottom: 8, backgroundColor: "#FFFFFF" },
  fieldLabel:     { fontSize: 10, fontFamily: "Helvetica-Bold", color: TXT, marginBottom: 2 },
  fieldRequired:  { backgroundColor: EBR, borderRadius: 2, paddingVertical: 1, paddingHorizontal: 4, marginLeft: 6 },
  fieldReqTxt:    { fontSize: 7, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
  fieldDesc:      { fontSize: 9.5, color: TSC, lineHeight: 1.65 },
  fieldEx:        { fontSize: 8.5, color: P, fontFamily: "Helvetica-Oblique", marginTop: 3 },

  // Status chips
  chip:           { borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6, marginRight: 4 },
  chipPending:    { backgroundColor: WBG },
  chipActive:     { backgroundColor: SBG },
  chipSemiActive: { backgroundColor: IBG },
  chipPermanent:  { backgroundColor: "#F3E5F5" },
  chipDestroyed:  { backgroundColor: EBG },
  chipTxt:        { fontSize: 8, fontFamily: "Helvetica-Bold" },

  // Status flow row
  statusRow:      { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: PL, borderRadius: 4, padding: 10, marginBottom: 12 },
  arrow:          { fontSize: 14, color: TSC, marginHorizontal: 4 },

  // Table
  table:          { marginBottom: 12, borderWidth: 0.5, borderColor: BRD },
  tableHead:      { flexDirection: "row", backgroundColor: P },
  tableHeadCell:  { flex: 1, padding: 6 },
  tableHeadTxt:   { fontSize: 9, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
  tableRow:       { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: BRD },
  tableRowAlt:    { backgroundColor: "#F8FAFC" },
  tableCell:      { flex: 1, padding: 6 },
  tableCellTxt:   { fontSize: 9, color: TXT, lineHeight: 1.5 },
  tableCheck:     { fontSize: 9, color: SBR, fontFamily: "Helvetica-Bold" },
  tableCross:     { fontSize: 9, color: TSC },

  // Hierarchy
  hierLevel:      { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, paddingLeft: 4 },
  hierBullet:     { width: 8, height: 8, borderRadius: 4, marginRight: 10, marginTop: 3, flexShrink: 0 },
  hierContent:    { flex: 1 },
  hierName:       { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: TXT },
  hierDesc:       { fontSize: 9.5, color: TSC, lineHeight: 1.65 },

  // Glossary
  glossItem:      { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: P },
  glossTerm:      { fontSize: 10, fontFamily: "Helvetica-Bold", color: TXT },
  glossDef:       { fontSize: 9.5, color: TSC, lineHeight: 1.65 },

  // Divider
  divider:        { borderBottomWidth: 0.5, borderBottomColor: BRD, marginVertical: 12 },

  // Flex helpers
  row:            { flexDirection: "row" },
  spacer:         { flex: 1 },
  mb4:            { marginBottom: 4 },
  mb8:            { marginBottom: 8 },
  mb16:           { marginBottom: 16 },
  mt16:           { marginTop: 16 },
});

// ── Composants utilitaires ────────────────────────────────────

const Hdr = ({ section }: { section: string }) => (
  <View style={s.pageHeader} fixed>
    <Text style={s.headerApp}>GEID ARCHIVES</Text>
    <Text style={s.headerSec}>{section}</Text>
  </View>
);

const Ftr = () => (
  <View style={s.pageFooter} fixed>
    <Text style={s.footerTxt}>Manuel utilisateur — Usage interne — {new Date().getFullYear()}</Text>
    <Text style={s.pageNum} render={({ pageNumber }: { pageNumber: number }) => `Page ${pageNumber}`} />
  </View>
);

const P2 = ({ children }: { children: React.ReactNode }) => <Text style={s.p}>{children}</Text>;
const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2}>{children}</Text>;
const H3 = ({ children }: { children: React.ReactNode }) => <Text style={s.h3}>{children}</Text>;
const H4 = ({ children }: { children: React.ReactNode }) => <Text style={s.h4}>{children}</Text>;
const Div = () => <View style={s.divider} />;

const Bullet = ({ children }: { children: string }) => (
  <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletTxt}>{children}</Text></View>
);
const NumBullet = ({ n, children }: { n: number; children: string }) => (
  <View style={s.step}>
    <View style={s.stepNum}><Text style={s.stepNumTxt}>{n}</Text></View>
    <Text style={s.stepTxt}>{children}</Text>
  </View>
);

const Info  = ({ label, children }: { label?: string; children: string }) => (
  <View style={s.infoBox}><View><Text style={[s.boxLabel, { color: IBR }]}>{label ?? "À NOTER"}</Text><Text style={s.boxTxt}>{children}</Text></View></View>
);
const Warn  = ({ children }: { children: string }) => (
  <View style={s.warnBox}><View><Text style={[s.boxLabel, { color: WBR }]}>ATTENTION</Text><Text style={s.boxTxt}>{children}</Text></View></View>
);
const Succ  = ({ children }: { children: string }) => (
  <View style={s.successBox}><View><Text style={[s.boxLabel, { color: SBR }]}>CONSEIL</Text><Text style={s.boxTxt}>{children}</Text></View></View>
);

const Field = ({ label, required, example, children }: { label: string; required?: boolean; example?: string; children: string }) => (
  <View style={s.fieldBox}>
    <View style={s.row}>
      <Text style={s.fieldLabel}>{label}</Text>
      {required && <View style={s.fieldRequired}><Text style={s.fieldReqTxt}>OBLIGATOIRE</Text></View>}
    </View>
    <Text style={s.fieldDesc}>{children}</Text>
    {example && <Text style={s.fieldEx}>Exemple : {example}</Text>}
  </View>
);

// ── PAGE DE GARDE ─────────────────────────────────────────────

function CoverPage() {
  return (
    <Page size="A4" style={s.coverPage}>
      <View style={s.coverWrap}>
        {/* Haut — titre */}
        <View style={s.coverTop}>
          <Image src={logoWhite} style={{ width: 160, marginBottom: 24 }} />
          <Text style={s.coverBadge}>GESTION ELECTRONIQUE DE L'INFORMATION ET DES DOCUMENTS</Text>
          <Text style={s.coverTitle}>Manuel{"\n"}Utilisateur</Text>
          <Text style={s.coverSubtitle}>GEID | Archives</Text>
          <Text style={s.coverDesc}>
            Guide complet de la gestion des archives numériques et physiques.{"\n"}
            De la soumission d'un document jusqu'à sa conservation définitive ou sa destruction.
          </Text>
        </View>

        {/* Milieu — audience */}
        <View style={s.coverMid}>
          <Text style={[s.coverMeta, { marginBottom: 10 }]}>Ce manuel est destiné à :</Text>
          <View style={s.coverAudience}>
            {["Agents soumetteurs", "Archivistes", "Administrateurs"].map(t => (
              <View key={t} style={s.coverTag}><Text style={s.coverTagTxt}>{t}</Text></View>
            ))}
          </View>

          <View style={[s.divider, { borderBottomColor: "#1976D2", marginVertical: 20 }]} />

          <Text style={[s.coverMeta, { marginBottom: 6, fontSize: 10, color: "#BBDEFB" }]}>
            Ce document couvre l'intégralité des fonctionnalités de l'application GEID Archives :
            la gestion du cycle de vie documentaire, la Durée d'Utilité Administrative, l'archivage
            physique multi-niveaux, la recherche globale indexée, les rôles et permissions, ainsi que
            les procédures d'administration du système.
          </Text>
        </View>

        {/* Bas — version / date / liens */}
        <View style={s.coverBot}>
          <View>
            <Text style={s.coverMeta}>Date de révision</Text>
            <Text style={[s.coverMeta, { color: "#E3F2FD", fontSize: 12, fontFamily: "Helvetica-Bold" }]}>
              {new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
            <Text style={[s.coverMeta, { marginTop: 10 }]}>Application</Text>
            <Link src="https://geidbudget.com/apps/archives" style={{ fontSize: 10, color: "#64B5F6", textDecoration: "underline" }}>
              geidbudget.com/apps/archives
            </Link>
            <Link src="https://geidbudget.com" style={{ fontSize: 9, color: "#90CAF9", marginTop: 3 }}>
              geidbudget.com
            </Link>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.coverMeta}>Version</Text>
            <Text style={s.coverVersion}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

// ── AVANT-PROPOS ─────────────────────────────────────────────

function AvantProposPage() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Avant-propos" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>AVANT-PROPOS</Text></View>
      <Text style={s.chapterTitle}>Mot d'introduction</Text>
      <View style={s.chapterUnder} />

      <P2>
        Ce manuel a été rédigé pour accompagner tous les utilisateurs de l'application GEID Archives,
        quel que soit leur niveau de maîtrise des outils informatiques ou leur rôle au sein de
        l'organisation. Notre objectif est de vous fournir une référence complète, claire et pratique
        qui vous permette d'exploiter pleinement toutes les fonctionnalités du système.
      </P2>
      <P2>
        La gestion des archives est une responsabilité fondamentale pour toute organisation. Elle garantit
        la traçabilité des décisions, la conformité aux obligations légales et la préservation de la
        mémoire institutionnelle. GEID Archives a été conçu pour rendre cette tâche aussi simple et
        efficace que possible, sans jamais sacrifier la rigueur nécessaire à une bonne pratique
        archivistique.
      </P2>

      <H2>Comment utiliser ce manuel</H2>
      <P2>
        Ce document est organisé en chapitres thématiques. Chaque chapitre traite d'un aspect précis de
        l'application. Vous pouvez le lire de manière linéaire pour une prise en main complète, ou
        consulter directement le chapitre qui correspond à votre besoin immédiat.
      </P2>
      <Bullet>Les agents soumetteurs commenceront par les chapitres 2, 4 et 10.</Bullet>
      <Bullet>Les archivistes liront en priorité les chapitres 5, 6 et 7.</Bullet>
      <Bullet>Les administrateurs consulteront l'ensemble du document avec une attention particulière aux chapitres 11 et 12.</Bullet>

      <H2>Conventions typographiques</H2>
      <P2>
        Tout au long de ce manuel, nous utilisons certaines conventions pour faciliter la lecture. Les
        noms de boutons, d'onglets ou d'éléments d'interface sont écrits en gras. Les exemples de
        valeurs à saisir sont présentés en italique. Les informations importantes sont encadrées dans
        des boîtes colorées.
      </P2>
      <Info label="À NOTER">Les boîtes bleues signalent des informations importantes à retenir pour utiliser l'application correctement.</Info>
      <Warn>Les boîtes jaunes signalent des situations qui nécessitent une attention particulière et peuvent avoir des conséquences irréversibles.</Warn>
      <Succ>Les boîtes vertes contiennent des conseils et bonnes pratiques pour tirer le meilleur parti de l'application.</Succ>

      <H2>Support et assistance</H2>
      <P2>
        Si vous ne trouvez pas la réponse à votre question dans ce manuel ou si vous rencontrez une
        difficulté technique, adressez-vous à votre responsable de service ou à l'équipe d'administration
        système. L'aide contextuelle est également accessible à tout moment depuis l'onglet Aide dans
        l'application.
      </P2>

      <Ftr />
    </Page>
  );
}

// ── SOMMAIRE ──────────────────────────────────────────────────

function TocPage() {
  const chapters = [
    { num: "1",   title: "Présentation générale de GEID Archives" },
    { num: "2",   title: "Premiers pas — connexion et interface" },
    { num: "3",   title: "Le tableau de bord" },
    { num: "4",   title: "Les archives numériques" },
    { num: "4.1", title: "Soumettre une nouvelle archive", sub: true },
    { num: "4.2", title: "La liste des archives et les filtres", sub: true },
    { num: "4.3", title: "Le panneau de détail", sub: true },
    { num: "5",   title: "Le cycle de vie documentaire" },
    { num: "5.1", title: "En attente de validation", sub: true },
    { num: "5.2", title: "Archive active", sub: true },
    { num: "5.3", title: "Archive intermédiaire", sub: true },
    { num: "5.4", title: "Archive historique", sub: true },
    { num: "5.5", title: "Archive détruite", sub: true },
    { num: "5.6", title: "L'historique des transitions", sub: true },
    { num: "6",   title: "La Durée d'Utilité Administrative (DUA)" },
    { num: "6.1", title: "Cadre réglementaire", sub: true },
    { num: "6.2", title: "Configurer une DUA", sub: true },
    { num: "6.3", title: "Tableau des DUA par type de document", sub: true },
    { num: "7",   title: "Validation et contrôle qualité" },
    { num: "8",   title: "Gestion et opérations sur les archives" },
    { num: "9",   title: "L'archivage physique" },
    { num: "9.1", title: "La hiérarchie des espaces", sub: true },
    { num: "9.2", title: "Créer et gérer chaque niveau", sub: true },
    { num: "9.3", title: "Rattachement numérique / physique", sub: true },
    { num: "9.4", title: "Le code QR et son utilisation", sub: true },
    { num: "10",  title: "Recherche et indexation" },
    { num: "11",  title: "Rôles, permissions et sécurité" },
    { num: "12",  title: "Administration du système" },
    { num: "A",   title: "Annexe A — Glossaire complet" },
    { num: "B",   title: "Annexe B — Questions fréquentes (FAQ)" },
    { num: "C",   title: "Annexe C — Bonnes pratiques archivistiques" },
  ];

  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Sommaire" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>SOMMAIRE</Text></View>
      <Text style={s.chapterTitle}>Table des matières</Text>
      <View style={s.chapterUnder} />

      {chapters.map(c =>
        c.sub ? (
          <View key={c.num} style={s.tocSub}>
            <Text style={s.tocSubNum}>{c.num}</Text>
            <Text style={s.tocSubTitle}>{c.title}</Text>
          </View>
        ) : (
          <View key={c.num} style={s.tocEntry}>
            <Text style={s.tocNum}>{c.num}</Text>
            <Text style={s.tocTitle}>{c.title}</Text>
          </View>
        )
      )}
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 1 ────────────────────────────────────────────────

function Chapter1() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 1 — Présentation générale" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 1</Text></View>
      <Text style={s.chapterTitle}>Présentation générale{"\n"}de GEID Archives</Text>
      <View style={s.chapterUnder} />
      <Text style={s.chapterIntro}>
        GEID Archives est un système de gestion documentaire développé pour centraliser, organiser et
        protéger l'ensemble des archives d'une organisation. Ce chapitre présente ses fondements, ses
        objectifs et le cadre réglementaire dans lequel il s'inscrit.
      </Text>

      <H2>1.1 — Qu'est-ce que GEID Archives ?</H2>
      <P2>
        GEID Archives est une application web de gestion électronique des documents d'archives (GEDA).
        Elle a été conçue pour répondre aux besoins spécifiques des organisations qui doivent gérer
        un volume important de documents tout en respectant des contraintes légales et réglementaires
        strictes en matière de conservation.
      </P2>
      <P2>
        L'application traite simultanément deux dimensions complémentaires et indissociables de la
        gestion documentaire. La première est la dimension numérique : elle permet de gérer les
        fichiers électroniques, leurs métadonnées descriptives et leur cycle de vie complet depuis
        la soumission jusqu'à la conservation définitive ou la destruction. La seconde est la
        dimension physique : elle modélise les espaces de stockage réels (locaux, étagères, classeurs)
        et assure le lien entre chaque document physique et ses équivalents numériques.
      </P2>

      <H2>1.2 — Objectifs et bénéfices</H2>
      <H3>Centralisation de l'information</H3>
      <P2>
        Sans système d'archivage centralisé, les documents d'une organisation sont dispersés entre
        les postes de travail individuels, les serveurs de fichiers partagés, les messageries
        électroniques et les classeurs physiques. Cette dispersion rend difficile la recherche d'un
        document précis, multiplie les risques de perte et génère des doublons coûteux.
        GEID Archives résout ce problème en constituant un référentiel unique et structuré.
      </P2>
      <H3>Traçabilité et conformité</H3>
      <P2>
        GEID Archives enregistre l'intégralité des actions effectuées sur chaque document : création,
        validation, modification, transitions de statut. Cet audit trail permanent garantit une
        traçabilité complète et constitue une preuve opposable en cas de litige ou de contrôle
        réglementaire. La gestion intégrée de la DUA assure le respect automatique des durées de
        conservation obligatoires.
      </P2>
      <H3>Gain de temps et productivité</H3>
      <P2>
        La recherche globale indexée permet de retrouver n'importe quel document en quelques secondes,
        même parmi des milliers d'archives. Les filtres avancés, les raccourcis clavier et les
        tableaux de bord synthétiques réduisent considérablement le temps consacré aux tâches
        administratives liées à la gestion documentaire.
      </P2>

      <H2>1.3 — Architecture du système</H2>
      <P2>
        GEID Archives repose sur une architecture client-serveur moderne. L'interface utilisateur
        est une application web réactive accessible depuis tout navigateur récent, sans installation
        requise. Les données sont stockées dans une base de données sécurisée côté serveur. Les
        fichiers joints sont conservés dans un espace de stockage dédié.
      </P2>
      <Info label="SÉCURITÉ">
        Toutes les communications entre votre navigateur et le serveur sont chiffrées. L'authentification
        repose sur un jeton sécurisé (JWT) à durée de vie limitée. Aucune donnée sensible n'est
        stockée dans votre navigateur au-delà de la durée de la session.
      </Info>

      <H2>1.4 — Conformité réglementaire</H2>
      <P2>
        La gestion des archives est encadrée par des obligations légales et réglementaires précises.
        La notion de Durée d'Utilité Administrative (DUA) est au cœur du droit de l'archivage : elle
        définit, pour chaque type de document, la durée minimale de conservation obligatoire avant
        que le responsable puisse prendre une décision de sort final. GEID Archives intègre
        nativement ce concept et vous alerte automatiquement quand une échéance approche.
      </P2>
      <P2>
        Le système respecte également les principes fondamentaux de l'archivage : unicité de la
        désignation, intégrité des documents versés, traçabilité des modifications et des suppressions,
        et cloisonnement des accès selon les rôles.
      </P2>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 2 ────────────────────────────────────────────────

function Chapter2() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 2 — Premiers pas" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 2</Text></View>
      <Text style={s.chapterTitle}>Premiers pas —{"\n"}Connexion et interface</Text>
      <View style={s.chapterUnder} />
      <Text style={s.chapterIntro}>
        Ce chapitre vous guide pas à pas depuis votre première connexion jusqu'à la maîtrise de
        l'interface principale. Prenez le temps de bien comprendre chaque zone de l'écran avant
        d'utiliser les fonctionnalités avancées.
      </Text>

      <H2>2.1 — Configuration requise</H2>
      <P2>
        GEID Archives est une application web qui ne nécessite aucune installation sur votre poste
        de travail. Pour l'utiliser dans les meilleures conditions, votre environnement doit
        répondre aux exigences suivantes.
      </P2>
      <Bullet>Navigateur web récent : Google Chrome 90+, Mozilla Firefox 88+, Microsoft Edge 90+ ou Safari 14+</Bullet>
      <Bullet>Connexion internet ou intranet stable</Bullet>
      <Bullet>Résolution d'écran recommandée : 1280 × 800 pixels minimum</Bullet>
      <Bullet>JavaScript activé dans le navigateur (activé par défaut)</Bullet>
      <Warn>L'utilisation d'Internet Explorer n'est pas prise en charge. Si votre organisation utilise encore ce navigateur, contactez votre service informatique pour migrer vers un navigateur moderne.</Warn>

      <H2>2.2 — Obtenir ses identifiants de connexion</H2>
      <P2>
        Les comptes utilisateurs sont créés exclusivement par les administrateurs du système. Si vous
        n'avez pas encore reçu vos identifiants, adressez une demande à votre responsable de service
        ou à l'équipe informatique en précisant votre nom, prénom, adresse e-mail professionnelle
        et le rôle souhaité.
      </P2>
      <Info label="PREMIER ACCÈS">
        Lors de votre première connexion, nous vous recommandons de noter votre adresse e-mail et
        votre mot de passe dans un endroit sécurisé. Ne communiquez jamais vos identifiants à une
        tierce personne, même un collègue.
      </Info>

      <H2>2.3 — La page de connexion</H2>
      <P2>
        La page de connexion est la première page affichée quand vous accédez à l'URL de
        l'application. Elle présente deux champs à remplir.
      </P2>
      <Field label="Adresse e-mail" required example="jean.dupont@organisation.fr">
        Saisissez l'adresse e-mail professionnelle associée à votre compte GEID Archives. Vérifiez
        l'absence de fautes de frappe ou d'espaces accidentels avant de valider.
      </Field>
      <Field label="Mot de passe" required>
        Le mot de passe est sensible à la casse : une lettre majuscule ou minuscule erronée provoquera
        un échec de connexion. En cas d'oubli, contactez votre administrateur pour une réinitialisation.
      </Field>

      <H2>2.4 — Description de l'interface principale</H2>
      <P2>
        Après connexion, vous arrivez sur l'interface principale de GEID Archives. Elle est divisée
        en quatre zones distinctes qui restent permanentes quelle que soit la section consultée.
      </P2>
      <H4>La barre d'en-tête</H4>
      <P2>
        Positionnée en haut de l'écran, la barre d'en-tête affiche le nom de l'application et les
        options de gestion du profil utilisateur. Elle est toujours visible, même lorsque vous faites
        défiler le contenu de la page vers le bas.
      </P2>
      <H4>Le menu de navigation gauche</H4>
      <P2>
        Sur les écrans de taille moyenne et grande, un menu de navigation vertical s'affiche sur la
        gauche de l'écran. Il donne accès aux quatre sections principales de l'application : Tableau
        de bord, Archives, Archivage physique et Aide. La section active est mise en évidence
        visuellement. Sur mobile, ce menu est remplacé par une barre de navigation horizontale en
        bas de l'écran.
      </P2>
      <H4>La zone de contenu centrale</H4>
      <P2>
        Elle occupe la majeure partie de l'écran et affiche le contenu de la section sélectionnée.
        Son organisation varie selon la section : liste et panneau de détail pour les archives,
        arborescence pour l'archivage physique, tableau de bord pour la vue synthétique.
      </P2>
      <H4>Les notifications</H4>
      <P2>
        Des messages de confirmation ou d'erreur apparaissent temporairement en haut ou en bas
        de l'écran après chaque action. Ces notifications sont colorées selon leur nature : verte
        pour une réussite, orange pour un avertissement, rouge pour une erreur. Elles disparaissent
        automatiquement après quelques secondes.
      </P2>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 3 ────────────────────────────────────────────────

function Chapter3() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 3 — Le tableau de bord" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 3</Text></View>
      <Text style={s.chapterTitle}>Le tableau de bord</Text>
      <View style={s.chapterUnder} />
      <Text style={s.chapterIntro}>
        Le tableau de bord est votre point d'entrée quotidien dans GEID Archives. Il vous offre
        une vue synthétique et immédiatement actionnable de l'état de votre fonds documentaire.
      </Text>

      <H2>3.1 — Vue d'ensemble</H2>
      <P2>
        Le tableau de bord se compose de plusieurs blocs d'information organisés de manière
        responsive. Sur un grand écran, les blocs sont disposés côte à côte pour maximiser
        l'information visible. Sur mobile, ils s'empilent verticalement pour rester lisibles.
        Toutes les données affichées sont recalculées en temps réel à chaque modification du système.
      </P2>

      <H2>3.2 — Les cartes statistiques</H2>
      <P2>
        En haut du tableau de bord, six cartes présentent les compteurs clés du système. Chaque
        carte est cliquable et vous redirige vers la section correspondante.
      </P2>
      <Bullet>Total archives : nombre total de documents enregistrés dans le système, tous statuts confondus.</Bullet>
      <Bullet>En attente : nombre d'archives soumises mais non encore validées par un archiviste. Cette carte est mise en évidence si ce nombre est supérieur à zéro.</Bullet>
      <Bullet>Actives : archives validées en cours d'utilisation opérationnelle courante.</Bullet>
      <Bullet>Intermédiaires : archives en phase de conservation réglementaire, dont la DUA est en cours.</Bullet>
      <Bullet>Locaux physiques : nombre d'espaces de conservation physiques enregistrés dans le système.</Bullet>
      <Bullet>Documents physiques : nombre de fiches physiques représentant des dossiers réels.</Bullet>

      <H2>3.3 — Les alertes prioritaires</H2>
      <P2>
        Lorsque le système détecte des situations nécessitant une action, des bandeaux d'alerte
        colorés apparaissent en haut du tableau de bord, avant les cartes statistiques.
      </P2>
      <Bullet>Alerte orange — Archives en attente : indique le nombre d'archives non validées. Un bouton Consulter permet d'accéder directement à la liste filtrée.</Bullet>
      <Bullet>Alerte rouge — DUA expirées : signale que des archives intermédiaires ont dépassé leur durée de conservation réglementaire. Une action est requise.</Bullet>
      <Bullet>Alerte orange — Classeurs saturés : indique que des classeurs physiques sont remplis à plus de 90 % de leur capacité maximale.</Bullet>
      <Info label="BONNE PRATIQUE">Vérifiez les alertes du tableau de bord en début de journée. Elles vous permettent de traiter les situations urgentes avant qu'elles ne deviennent problématiques.</Info>

      <H2>3.4 — La liste d'activité récente</H2>
      <P2>
        La section Activité récente affiche les huit derniers documents ajoutés ou modifiés dans
        le système, triés du plus récent au plus ancien. Pour chaque document, vous voyez la
        désignation, la date d'ajout et le statut actuel. Les éléments de cette liste sont
        cliquables pour accéder directement à la gestion des archives.
      </P2>

      <H2>3.5 — La répartition par statut</H2>
      <P2>
        Un graphique à barres horizontales montre la proportion de chaque statut par rapport au
        total des archives. Les valeurs absolues et les pourcentages sont affichés pour chaque
        barre. Ce bloc vous aide à évaluer en un coup d'œil l'avancement du traitement de votre
        fonds documentaire. Cliquer sur ce bloc navigue vers la section Archives.
      </P2>

      <H2>3.6 — Les alertes DUA</H2>
      <P2>
        Ce bloc n'apparaît que s'il existe des DUA expirées ou sur le point d'expirer dans les
        trente jours à venir. Il liste les documents concernés et indique pour chacun si la DUA
        est déjà dépassée ou si elle va l'être prochainement. Ces informations vous permettent
        d'anticiper les décisions de sort final à prendre.
      </P2>

      <H2>3.7 — L'inventaire physique résumé</H2>
      <P2>
        Une carte de synthèse présente les compteurs de l'inventaire physique : nombre de locaux,
        de classeurs, de documents physiques et d'archives numériques rattachées à des supports
        physiques. Cliquer sur cette carte ouvre directement la section Archivage physique.
      </P2>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 4 ────────────────────────────────────────────────

function Chapter4() {
  return (
    <>
      <Page size="A4" style={s.page}>
        <Hdr section="Chapitre 4 — Les archives numériques" />
        <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 4</Text></View>
        <Text style={s.chapterTitle}>Les archives numériques</Text>
        <View style={s.chapterUnder} />
        <Text style={s.chapterIntro}>
          Ce chapitre décrit en détail la gestion des archives numériques : la liste principale,
          les filtres, le formulaire de soumission et toutes les actions disponibles.
        </Text>

        <H2>4.1 — Définition et types de documents</H2>
        <P2>
          Une archive numérique est tout document électronique qui a valeur probatoire ou qui doit
          être conservé pour des raisons légales, réglementaires ou opérationnelles. Dans GEID
          Archives, les types de documents acceptés incluent notamment les contrats et conventions,
          les décisions et actes administratifs, les rapports d'activité et comptes rendus, les
          procès-verbaux de réunion, les correspondances officielles, les études et notes de
          synthèse, les documents comptables et financiers, et tout autre document officiel de
          l'organisation.
        </P2>
        <Info label="FORMAT DES FICHIERS">
          GEID Archives accepte principalement les fichiers PDF, DOC/DOCX, XLS/XLSX et les
          formats images courants (JPG, PNG). Privilégiez le format PDF pour les documents
          finaux car il garantit la préservation de la mise en page d'origine.
        </Info>

        <H2>4.2 — La liste principale des archives</H2>
        <P2>
          Depuis la section Archives, le centre de l'écran affiche un tableau listant toutes les
          archives auxquelles vous avez accès. Chaque ligne correspond à une archive et présente
          ses informations essentielles : désignation, numéro de classe, statut, date de création
          et, si applicable, les informations de DUA.
        </P2>
        <H4>Les colonnes du tableau</H4>
        <Bullet>Désignation : le nom principal du document tel qu'il a été saisi lors de la création.</Bullet>
        <Bullet>N° de classe : le code de classement interne selon le plan documentaire de l'organisation.</Bullet>
        <Bullet>Statut : l'état actuel dans le cycle de vie, représenté par une pastille colorée.</Bullet>
        <Bullet>Date de création : la date à laquelle l'archive a été soumise dans le système.</Bullet>
        <Bullet>DUA : si une DUA a été configurée, une indication visuelle signale si elle est en cours ou expirée.</Bullet>

        <H4>Tri et navigation</H4>
        <P2>
          Vous pouvez trier les archives en cliquant sur l'en-tête de n'importe quelle colonne.
          Un premier clic trie par ordre croissant, un second clic trie par ordre décroissant.
          Le tableau supporte la pagination automatique et le défilement fluide. Une barre de
          progression en haut du tableau indique le chargement des données.
        </P2>

        <H2>4.3 — La barre de navigation gauche (filtres)</H2>
        <P2>
          Sur la gauche du tableau, une barre de navigation propre à la section Archives permet
          de filtrer rapidement les archives affichées selon plusieurs critères.
        </P2>
        <H4>Filtres par statut</H4>
        <Bullet>Toutes : affiche l'ensemble des archives sans filtre de statut.</Bullet>
        <Bullet>En attente : uniquement les archives non encore validées.</Bullet>
        <Bullet>Actives : uniquement les archives validées en cours d'utilisation.</Bullet>
        <Bullet>Intermédiaires : uniquement les archives en phase de conservation réglementaire.</Bullet>
        <Bullet>Historiques : uniquement les archives versées en conservation définitive.</Bullet>
        <Bullet>Détruites : uniquement les archives dont la destruction a été enregistrée.</Bullet>

        <H4>Filtres rapides</H4>
        <Bullet>DUA expirées : affiche toutes les archives intermédiaires dont la DUA a dépassé son terme.</Bullet>
        <Bullet>Ce mois : affiche uniquement les archives créées dans le mois civil en cours.</Bullet>

        <H4>Fonctionnalités supplémentaires de la barre</H4>
        <Bullet>Bouton Ajouter : ouvre le formulaire de soumission d'une nouvelle archive (réservé aux utilisateurs autorisés).</Bullet>
        <Bullet>Bouton loupe : ouvre la fenêtre de recherche globale (raccourci : Ctrl+K).</Bullet>
        <Bullet>Bouton export : télécharge la liste filtrée courante au format CSV.</Bullet>
        <Bullet>Section Récents : affiche les cinq dernières archives créées, cliquables pour accès rapide.</Bullet>
        <Bullet>Pied de la barre : statistiques de la sélection courante (nombre d'archives, alertes DUA).</Bullet>
        <Ftr />
      </Page>

      <Page size="A4" style={s.page}>
        <Hdr section="Chapitre 4 — Les archives numériques (suite)" />

        <H2>4.4 — Soumettre une nouvelle archive</H2>
        <P2>
          Pour soumettre une archive, cliquez sur le bouton Ajouter dans la barre de navigation
          gauche. Si ce bouton n'est pas visible, votre rôle ne vous autorise pas à créer des archives.
          Un formulaire s'ouvre en fenêtre modale. Remplissez soigneusement chaque champ car la
          qualité des métadonnées détermine la facilité avec laquelle le document pourra être
          retrouvé ultérieurement.
        </P2>

        <Field label="Désignation" required example="Rapport d'activité annuel 2024 — Direction générale">
          C'est le nom principal et officiel du document. Il doit être suffisamment précis pour
          permettre à n'importe quel utilisateur de comprendre de quoi il s'agit sans avoir à
          ouvrir le fichier. Évitez les abréviations qui ne seraient pas comprises en dehors de
          votre service. La désignation est le premier critère utilisé par le moteur de recherche.
        </Field>

        <Field label="Type documentaire" required example="Rapport — Administratif">
          Sélectionnez dans la liste déroulante le type et le sous-type qui caractérisent au
          mieux la nature du document. Cette classification est utilisée pour les statistiques
          d'archivage et peut conditionner les règles automatiques de gestion documentaire
          appliquées par le système.
        </Field>

        <Field label="Numéro de classe" example="ADM-2024-001">
          Le numéro de classement attribué au document dans le plan de classement de votre
          organisation. Ce numéro sert à regrouper les documents par famille documentaire et
          facilite le classement physique. S'il n'existe pas de plan de classement formalisé
          dans votre organisation, vous pouvez laisser ce champ vide.
        </Field>

        <Field label="Numéro de référence" example="REF-DG-042/2024">
          La référence unique attribuée au document lors de sa création ou de sa réception dans
          votre organisation. Si votre service utilise un système de numérotation interne,
          reportez-le ici pour assurer la continuité entre vos outils existants et GEID Archives.
        </Field>

        <Field label="Dossier" required example="Ressources humaines / Gestion des carrières">
          Le dossier thématique ou fonctionnel auquel appartient le document. Ce champ structure
          la hiérarchie documentaire et permet de regrouper les archives par domaine d'activité.
          Utilisez une notation cohérente à l'échelle de votre service (par exemple :
          "Domaine / Sous-domaine").
        </Field>

        <Field label="Description">
          Un résumé en quelques phrases du contenu et de l'objet du document. Une description
          bien rédigée améliore significativement la pertinence des résultats de recherche.
          Indiquez le contexte, les dates clés mentionnées, les parties concernées et les
          décisions ou conclusions importantes contenues dans le document.
        </Field>

        <Field label="Langue">
          La langue principale dans laquelle est rédigé le document. Ce champ est utile dans
          les organisations multilingues pour filtrer les archives par langue.
        </Field>

        <Field label="Pièce jointe" example="rapport_annuel_2024.pdf">
          Le fichier numérique correspondant à l'archive. Cliquez sur Parcourir pour sélectionner
          le fichier depuis votre poste. Les formats recommandés sont PDF pour les documents texte,
          PNG ou JPG pour les images, XLS/XLSX pour les tableaux. La taille maximale acceptée
          dépend de la configuration de votre serveur.
        </Field>

        <Succ>Avant de cliquer sur Soumettre, relisez une dernière fois la désignation et le dossier. Ce sont les deux champs les plus consultés par les archivistes et les plus utilisés dans les recherches.</Succ>

        <H2>4.5 — Le panneau de détail</H2>
        <P2>
          Cliquer sur n'importe quelle ligne du tableau ouvre un panneau de détail sur la droite de
          l'écran (ou un tiroir en bas sur mobile). Ce panneau affiche l'ensemble des métadonnées
          de l'archive sélectionnée ainsi que toutes les actions disponibles pour cette archive.
        </P2>
        <H4>La barre d'actions rapides</H4>
        <P2>
          En haut du panneau, une rangée d'icônes permet d'accéder rapidement aux actions
          disponibles selon votre rôle et le statut actuel de l'archive.
        </P2>
        <Bullet>Valider : passe l'archive de En attente à Active (archivistes uniquement).</Bullet>
        <Bullet>Modifier : ouvre le formulaire de modification des métadonnées.</Bullet>
        <Bullet>Dossier physique : ouvre la fenêtre de rattachement à un document physique.</Bullet>
        <Bullet>DUA : ouvre la fenêtre de configuration de la Durée d'Utilité Administrative.</Bullet>
        <Bullet>Supprimer : ouvre la fenêtre de confirmation de suppression (administrateurs uniquement).</Bullet>
        <Ftr />
      </Page>
    </>
  );
}

// ── CHAPITRE 5 ────────────────────────────────────────────────

function Chapter5() {
  return (
    <>
      <Page size="A4" style={s.page}>
        <Hdr section="Chapitre 5 — Le cycle de vie documentaire" />
        <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 5</Text></View>
        <Text style={s.chapterTitle}>Le cycle de vie documentaire</Text>
        <View style={s.chapterUnder} />
        <Text style={s.chapterIntro}>
          Le cycle de vie est la colonne vertébrale de GEID Archives. Comprendre les cinq états
          et les règles de transition est indispensable pour utiliser le système correctement.
        </Text>

        <H2>5.1 — Concept et importance</H2>
        <P2>
          En archivistique, le cycle de vie documentaire décrit le parcours complet d'un document
          depuis sa création jusqu'à sa destination finale. Ce concept, parfois appelé "les trois
          âges des archives", distingue trois grandes phases : la vie active du document (archives
          courantes), sa phase de conservation obligatoire mais peu consultée (archives
          intermédiaires), et sa destination finale (archives définitives ou élimination).
        </P2>
        <P2>
          GEID Archives formalise ce parcours en cinq états distincts, clairement identifiés par
          des couleurs dans l'interface. Cette structuration garantit qu'aucun document ne peut
          être détruit prématurément et que chaque transition est documentée et traçable.
        </P2>

        <View style={s.statusRow}>
          {[
            { label: "En attente", color: WBG, textColor: "#92400E" },
            { label: "Active",     color: SBG, textColor: "#065F46" },
            { label: "Interméd.", color: IBG, textColor: "#1E3A8A" },
            { label: "Historique", color: "#F3E5F5", textColor: "#6B21A8" },
            { label: "Détruite",  color: EBG, textColor: "#991B1B" },
          ].map((st, i, arr) => (
            <View key={st.label} style={s.row}>
              <View style={[s.chip, { backgroundColor: st.color }]}>
                <Text style={[s.chipTxt, { color: st.textColor }]}>{st.label}</Text>
              </View>
              {i < arr.length - 1 && <Text style={s.arrow}>→</Text>}
            </View>
          ))}
        </View>

        <H2>5.2 — En attente de validation</H2>
        <P2>
          C'est l'état initial et automatique de toute archive nouvellement soumise dans le
          système. L'archive est enregistrée et visible dans la liste, mais elle n'a pas encore
          été examinée par un archiviste habilité. Durant cette phase, le document ne peut pas
          être modifié par son déposant.
        </P2>
        <P2>
          L'archiviste responsable doit examiner le document soumis : vérifier la complétude des
          métadonnées, la cohérence de la désignation avec le contenu du fichier, la pertinence
          du dossier de classement et la qualité du fichier joint. S'il est satisfait, il valide
          l'archive. Dans le cas contraire, il contacte le déposant pour correction.
        </P2>
        <Info label="DÉLAI DE TRAITEMENT">
          Définissez en interne un délai maximal de traitement des archives en attente. Un délai
          de cinq jours ouvrables est souvent utilisé dans les organisations ayant adopté ce type
          de système. Un tableau de bord affichant les archives les plus anciennes en attente
          aide les archivistes à prioriser leur travail.
        </Info>

        <H2>5.3 — Archive active</H2>
        <P2>
          Une archive active est un document validé qui fait partie du fonds documentaire courant.
          Elle est pleinement accessible à tous les utilisateurs autorisés. Elle peut être consultée,
          modifiée (métadonnées uniquement), rattachée à un support physique ou faire l'objet d'une
          transition vers un état ultérieur du cycle de vie.
        </P2>
        <P2>
          C'est l'état standard des documents dont l'utilisation opérationnelle est toujours en
          cours. Un contrat en cours d'exécution, un rapport d'activité de l'année en cours ou
          une décision administrative récente sont des exemples typiques d'archives actives.
        </P2>

        <H2>5.4 — Archive intermédiaire</H2>
        <P2>
          Lorsqu'un document n'est plus utilisé dans les opérations courantes mais que sa
          conservation reste obligatoire pendant une durée réglementaire déterminée, il passe
          en état intermédiaire. Cette phase correspond à ce que les archivistes appellent
          parfois les "archives secondaires" ou "semi-actives".
        </P2>
        <P2>
          C'est à ce stade que la Durée d'Utilité Administrative (DUA) entre en jeu. L'archiviste
          doit configurer la DUA de l'archive (voir Chapitre 6) pour que le système puisse
          surveiller l'échéance et alerter quand elle approche. Les archives intermédiaires
          peuvent nécessiter un accès occasionnel, notamment en cas de contentieux ou de contrôle.
        </P2>
        <Ftr />
      </Page>

      <Page size="A4" style={s.page}>
        <Hdr section="Chapitre 5 — Le cycle de vie (suite)" />

        <H2>5.5 — Archive historique</H2>
        <P2>
          L'état historique est attribué aux archives qui présentent une valeur patrimoniale,
          historique ou juridique suffisante pour justifier leur conservation sans limite de durée.
          Ces documents constituent le fonds historique de l'organisation. Ils ne peuvent plus
          être détruits une fois qu'ils ont atteint cet état.
        </P2>
        <P2>
          La décision de verser une archive en état historique est prise par un archiviste ou un
          administrateur, soit à l'issue de la DUA (si le sort final est "conservation définitive"),
          soit de manière anticipée si la valeur historique du document est reconnue avant
          l'expiration de la DUA.
        </P2>

        <H2>5.6 — Archive détruite</H2>
        <P2>
          L'état détruit indique que l'archive a été éliminée conformément aux règles de gestion
          documentaire. Cette action est irréversible. Elle marque la fin du cycle de vie du
          document. L'enregistrement de la destruction dans GEID Archives constitue une preuve
          de la conformité de l'élimination.
        </P2>
        <Warn>La destruction est une action définitive. Avant de l'effectuer, vérifiez que la DUA est bien expirée, que le sort final décidé est l'élimination, et que le document ne fait pas l'objet d'un contentieux en cours ou d'une demande de communication.</Warn>

        <H2>5.7 — Les transitions autorisées</H2>
        <P2>
          Toutes les transitions entre états ne sont pas possibles. Le tableau ci-dessous résume
          les parcours autorisés.
        </P2>
        <View style={s.table}>
          <View style={s.tableHead}>
            <View style={[s.tableHeadCell, { flex: 1.2 }]}><Text style={s.tableHeadTxt}>État de départ</Text></View>
            <View style={[s.tableHeadCell, { flex: 2 }]}><Text style={s.tableHeadTxt}>Transitions possibles</Text></View>
            <View style={[s.tableHeadCell, { flex: 1 }]}><Text style={s.tableHeadTxt}>Rôle requis</Text></View>
          </View>
          {[
            ["En attente",    "→ Active (validation) / Annuler", "Archiviste"],
            ["Active",        "→ Intermédiaire / → Historique",  "Archiviste"],
            ["Intermédiaire", "→ Historique / → Détruite",       "Archiviste"],
            ["Historique",    "Aucune (état terminal)",          "—"],
            ["Détruite",      "Aucune (état terminal)",          "—"],
          ].map(([dep, trans, role], i) => (
            <View key={dep} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <View style={[s.tableCell, { flex: 1.2 }]}><Text style={s.tableCellTxt}>{dep}</Text></View>
              <View style={[s.tableCell, { flex: 2 }]}><Text style={s.tableCellTxt}>{trans}</Text></View>
              <View style={[s.tableCell, { flex: 1 }]}><Text style={s.tableCellTxt}>{role}</Text></View>
            </View>
          ))}
        </View>

        <H2>5.8 — L'historique des transitions</H2>
        <P2>
          Chaque transition de statut est enregistrée dans l'historique de l'archive avec la date
          et l'heure exactes de l'opération, l'identité de l'utilisateur qui l'a effectuée, l'état
          de départ et l'état d'arrivée. Cet historique est visible dans le panneau de détail de
          chaque archive et constitue un audit trail complet pour toute vérification ultérieure.
        </P2>

        <H2>5.9 — Bonnes pratiques relatives au cycle de vie</H2>
        <Bullet>Ne pas laisser des archives en état En attente trop longtemps. Un délai de traitement supérieur à une semaine signale un dysfonctionnement dans le processus de validation.</Bullet>
        <Bullet>Configurer systématiquement la DUA dès qu'une archive passe en état Intermédiaire, pour activer les alertes automatiques.</Bullet>
        <Bullet>Ne jamais passer directement un document de En attente à Détruit. Respecter l'ordre logique des états.</Bullet>
        <Bullet>Utiliser l'état Historique pour préserver les documents à valeur patrimoniale identifiée dès que possible, sans attendre l'expiration de la DUA.</Bullet>
        <Ftr />
      </Page>
    </>
  );
}

// ── CHAPITRE 6 ────────────────────────────────────────────────

function Chapter6() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 6 — La Durée d'Utilité Administrative" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 6</Text></View>
      <Text style={s.chapterTitle}>La Durée d'Utilité{"\n"}Administrative (DUA)</Text>
      <View style={s.chapterUnder} />

      <H2>6.1 — Définition et cadre réglementaire</H2>
      <P2>
        La Durée d'Utilité Administrative (DUA) est la période légale ou réglementaire pendant
        laquelle une organisation est tenue de conserver un document avant de pouvoir décider de
        son sort final. Elle est fixée soit par des textes de loi, soit par des circulaires
        ministérielles, soit par la politique interne de l'organisation.
      </P2>
      <P2>
        La DUA commence généralement à courir à partir d'une date significative pour le document :
        la date de signature, la date de clôture d'un dossier, la date de fin d'un contrat ou la
        date de l'acte administratif. Dans GEID Archives, cette date de départ est configurable
        librement par l'archiviste.
      </P2>
      <Info label="CADRE JURIDIQUE">
        En l'absence d'une règle spécifique applicable à un type de document, il est conseillé
        d'appliquer une durée minimale de conservation de cinq ans à titre conservatoire. Certains
        documents comme les actes juridiques, les contrats importants ou les documents comptables
        ont des DUA spécifiques pouvant aller jusqu'à trente ans ou plus.
      </Info>

      <H2>6.2 — Configurer une DUA dans GEID Archives</H2>
      <P2>
        Pour configurer la DUA d'une archive, l'archive doit se trouver en état Intermédiaire.
        Ouvrez son panneau de détail et cliquez sur le bouton DUA dans la barre d'actions rapides.
      </P2>
      <NumBullet n={1}>Saisissez la valeur numérique dans le champ prévu. Exemple : saisissez 5 pour une DUA de cinq unités.</NumBullet>
      <NumBullet n={2}>Choisissez l'unité de temps : jours, mois ou années. Pour une DUA de cinq ans, choisissez "années".</NumBullet>
      <NumBullet n={3}>Indiquez la date de départ. Il s'agit souvent de la date de clôture du dossier ou de fin du contrat, pas nécessairement la date d'archivage.</NumBullet>
      <NumBullet n={4}>Choisissez le sort final : "Conservation définitive" si le document doit être versé aux archives historiques à l'échéance, ou "Élimination" si le document doit être détruit.</NumBullet>
      <NumBullet n={5}>Confirmez en cliquant sur Enregistrer. La date d'expiration calculée s'affiche immédiatement sous la DUA configurée.</NumBullet>

      <H2>6.3 — Tableau des DUA courantes par type de document</H2>
      <View style={s.table}>
        <View style={s.tableHead}>
          <View style={[s.tableHeadCell, { flex: 2 }]}><Text style={s.tableHeadTxt}>Type de document</Text></View>
          <View style={[s.tableHeadCell, { flex: 1 }]}><Text style={s.tableHeadTxt}>DUA indicative</Text></View>
          <View style={[s.tableHeadCell, { flex: 1.5 }]}><Text style={s.tableHeadTxt}>Sort final courant</Text></View>
        </View>
        {[
          ["Contrats et conventions", "10 ans", "Conservation"],
          ["Décisions administratives", "10 ans", "Conservation"],
          ["Rapports d'activité annuels", "10 ans", "Conservation"],
          ["Correspondances officielles", "5 ans", "Élimination"],
          ["Documents comptables", "10 ans", "Élimination"],
          ["Procès-verbaux de réunion", "5 ans", "Conservation"],
          ["Dossiers du personnel", "50 ans", "Conservation"],
          ["Marchés publics", "10 ans", "Conservation"],
          ["Notes internes", "3 ans", "Élimination"],
          ["Demandes de congés", "2 ans", "Élimination"],
        ].map(([type, dua, sort], i) => (
          <View key={type} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <View style={[s.tableCell, { flex: 2 }]}><Text style={s.tableCellTxt}>{type}</Text></View>
            <View style={[s.tableCell, { flex: 1 }]}><Text style={s.tableCellTxt}>{dua}</Text></View>
            <View style={[s.tableCell, { flex: 1.5 }]}><Text style={s.tableCellTxt}>{sort}</Text></View>
          </View>
        ))}
      </View>
      <Text style={s.small}>
        Note : Ce tableau est donné à titre indicatif. Les DUA applicables dans votre organisation
        peuvent différer selon votre secteur d'activité et la réglementation en vigueur. Consultez
        votre archiviste référent ou le tableau de gestion documentaire officiel de votre organisation.
      </Text>

      <H2>6.4 — Les alertes DUA</H2>
      <P2>
        GEID Archives surveille en permanence les DUA configurées et génère des alertes à deux
        niveaux. La première alerte apparaît trente jours avant l'expiration de la DUA, sous forme
        d'un avertissement orange dans le tableau de bord. La seconde alerte, de couleur rouge, est
        déclenchée le jour même de l'expiration et persiste jusqu'à ce qu'une action de sort final
        soit enregistrée pour l'archive concernée.
      </P2>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 7 ────────────────────────────────────────────────

function Chapter7() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 7 — Validation et contrôle qualité" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 7</Text></View>
      <Text style={s.chapterTitle}>Validation et contrôle qualité</Text>
      <View style={s.chapterUnder} />

      <H2>7.1 — Rôle et responsabilité de l'archiviste</H2>
      <P2>
        La validation est une opération de contrôle qualité réalisée par un archiviste habilité.
        Elle certifie que l'archive soumise est complète, correctement décrite et conforme aux
        exigences documentaires de l'organisation. En validant une archive, l'archiviste engage
        sa responsabilité professionnelle quant à la qualité de l'enregistrement.
      </P2>

      <H2>7.2 — Procédure de validation</H2>
      <NumBullet n={1}>Accédez à la section Archives et filtrez par statut "En attente" pour voir uniquement les archives à traiter.</NumBullet>
      <NumBullet n={2}>Cliquez sur la première archive à examiner pour ouvrir son panneau de détail.</NumBullet>
      <NumBullet n={3}>Lisez attentivement la désignation et la description. Vérifiez qu'elles correspondent à la nature réelle du document.</NumBullet>
      <NumBullet n={4}>Consultez le fichier joint en cliquant sur son lien pour vous assurer que le contenu correspond à la désignation.</NumBullet>
      <NumBullet n={5}>Vérifiez que le dossier de classement est cohérent avec le plan documentaire de l'organisation.</NumBullet>
      <NumBullet n={6}>Si tout est correct, cliquez sur le bouton Valider. Une fenêtre de confirmation s'affiche. Confirmez la validation.</NumBullet>
      <NumBullet n={7}>L'archive passe immédiatement en état Actif et disparaît du filtre "En attente".</NumBullet>

      <H2>7.3 — Critères d'évaluation lors de la validation</H2>
      <H4>Complétude des métadonnées</H4>
      <Bullet>La désignation est-elle suffisamment précise pour identifier le document sans l'ouvrir ?</Bullet>
      <Bullet>Le dossier de classement est-il correctement choisi selon le plan documentaire ?</Bullet>
      <Bullet>Si applicable, le numéro de classe et le numéro de référence sont-ils renseignés ?</Bullet>

      <H4>Qualité du fichier</H4>
      <Bullet>Le fichier est-il lisible et complet (pas de pages manquantes, pas de corruption) ?</Bullet>
      <Bullet>Le fichier est-il dans un format pérenne (idéalement PDF/A pour les documents textuels) ?</Bullet>
      <Bullet>La résolution est-elle suffisante pour une lecture confortable (pour les documents scannés) ?</Bullet>

      <H4>Cohérence globale</H4>
      <Bullet>Le contenu du fichier correspond-il à la désignation indiquée ?</Bullet>
      <Bullet>La date de création est-elle vraisemblable par rapport au contenu ?</Bullet>

      <H2>7.4 — Annulation d'une soumission</H2>
      <P2>
        Si un agent soumet une archive par erreur (mauvais fichier, erreur de désignation, doublon),
        il peut demander l'annulation avant validation. L'archiviste peut alors supprimer l'archive
        en attente après avoir contacté le déposant. Il est recommandé de ne pas supprimer une archive
        sans avoir préalablement informé son déposant des raisons de l'annulation.
      </P2>
      <Succ>Établissez en interne une procédure claire pour les rejets de soumission : comment informer le déposant, quelles corrections demander et dans quel délai soumettre à nouveau.</Succ>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 8 ────────────────────────────────────────────────

function Chapter8() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 8 — Gestion et opérations" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 8</Text></View>
      <Text style={s.chapterTitle}>Gestion et opérations{"\n"}sur les archives</Text>
      <View style={s.chapterUnder} />

      <H2>8.1 — Modifier les métadonnées</H2>
      <P2>
        Il est possible de corriger ou compléter les métadonnées d'une archive à n'importe quel
        stade de son cycle de vie. Pour modifier une archive, ouvrez son panneau de détail et
        cliquez sur le bouton Modifier (icône crayon). Un formulaire prérempli avec les données
        actuelles s'ouvre.
      </P2>
      <Info label="INTÉGRITÉ">
        La modification ne porte que sur les métadonnées (désignation, dossier, description, etc.).
        Le fichier attaché à l'archive ne peut pas être remplacé après validation, afin de
        préserver l'intégrité du document archivé. Si le fichier est incorrect, il faut créer
        une nouvelle soumission et supprimer l'ancienne.
      </Info>

      <H2>8.2 — Supprimer une archive</H2>
      <P2>
        La suppression est une opération réservée aux administrateurs du système. Elle efface
        définitivement l'archive, y compris son fichier attaché et toutes ses métadonnées.
        Cette action est irréversible.
      </P2>
      <H4>Supprimer une archive individuelle</H4>
      <NumBullet n={1}>Ouvrez le panneau de détail de l'archive à supprimer.</NumBullet>
      <NumBullet n={2}>Cliquez sur l'icône corbeille dans la barre d'actions rapides.</NumBullet>
      <NumBullet n={3}>Lisez attentivement le message de confirmation qui s'affiche.</NumBullet>
      <NumBullet n={4}>Cliquez sur Supprimer définitivement pour confirmer.</NumBullet>

      <H4>Suppression en masse</H4>
      <NumBullet n={1}>Cochez les cases à gauche de chaque archive à supprimer dans le tableau.</NumBullet>
      <NumBullet n={2}>Ouvrez le menu Actions en haut à droite du tableau.</NumBullet>
      <NumBullet n={3}>Choisissez Supprimer la sélection.</NumBullet>
      <NumBullet n={4}>Confirmez la suppression dans la fenêtre de confirmation qui précise le nombre d'archives concernées.</NumBullet>
      <Warn>La suppression en masse est particulièrement risquée. Vérifiez scrupuleusement la sélection avant de confirmer. Assurez-vous qu'aucune archive sélectionnée ne doit être conservée.</Warn>

      <H2>8.3 — Exporter la liste des archives</H2>
      <P2>
        L'export CSV permet d'extraire la liste des archives visibles dans le tableau vers un
        fichier compatible Excel. Cliquez sur l'icône de téléchargement dans la barre de
        navigation gauche. Le fichier est généré immédiatement et téléchargé dans votre dossier
        de téléchargements habituel. Il contient les colonnes : Désignation, Numéro de classe,
        Numéro de référence, Dossier, Statut, Date de création.
      </P2>
      <P2>
        L'export tient compte des filtres actifs : si vous avez filtré par statut Actif, seules
        les archives actives seront incluses dans le fichier. Pour exporter l'ensemble des archives,
        assurez-vous de sélectionner le filtre Toutes avant d'exporter.
      </P2>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 9 ────────────────────────────────────────────────

function Chapter9() {
  return (
    <>
      <Page size="A4" style={s.page}>
        <Hdr section="Chapitre 9 — L'archivage physique" />
        <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 9</Text></View>
        <Text style={s.chapterTitle}>L'archivage physique</Text>
        <View style={s.chapterUnder} />
        <Text style={s.chapterIntro}>
          L'archivage physique permet de modéliser et de gérer l'inventaire des espaces et supports
          de conservation réels. Il crée le pont entre le monde numérique et le monde matériel.
        </Text>

        <H2>9.1 — Concept et finalité</H2>
        <P2>
          Malgré la numérisation croissante des organisations, les archives physiques (documents
          papier, plans, maquettes, objets) continuent d'exister et doivent être gérées avec autant
          de rigueur que les archives numériques. GEID Archives permet de recenser et de localiser
          précisément chaque document physique dans les espaces de conservation, et d'établir le
          lien avec les équivalents numériques existants.
        </P2>

        <H2>9.2 — La hiérarchie des espaces physiques</H2>
        <P2>
          L'organisation physique est représentée sous la forme d'une arborescence à cinq niveaux
          imbriqués. Chaque niveau représente un type d'espace ou de contenant différent.
        </P2>

        {[
          { name: "Local / Emplacement", color: P, desc: "Le niveau racine de la hiérarchie physique. Représente le bâtiment, la salle, le couloir ou tout espace de conservation délimité. Un local peut être une salle forte, une armoire ignifuge, un entrepôt d'archives ou un espace de bureau dédié à la conservation. Chaque local est identifié par un nom unique dans le système." },
          { name: "Étagère", color: "#0277BD", desc: "Un meuble de rangement ou un rayonnage situé à l'intérieur d'un local. L'étagère peut représenter une armoire à tiroirs, un rayonnage ouvert ou une bibliothèque. Elle constitue la première subdivision géographique à l'intérieur d'un local." },
          { name: "Section", color: "#0288D1", desc: "Un niveau, un plateau, un tiroir ou un compartiment à l'intérieur d'une étagère. La section permet d'affiner la localisation physique au sein d'un meuble de rangement. Vous pouvez par exemple nommer les sections par numéro (Section 1, Section 2) ou par couleur si vos meubles sont ainsi organisés." },
          { name: "Classeur", color: "#039BE5", desc: "Une unité de rangement individuelle : boîte d'archives, chemise cartonnée, portefeuille ou classeur à anneaux. Le classeur peut avoir une capacité maximale définie (nombre de documents qu'il peut contenir). Le système surveille le taux de remplissage de chaque classeur et vous alerte quand il approche de sa limite." },
          { name: "Document physique", color: "#03A9F4", desc: "La fiche représentant un dossier physique réel : une chemise, un dossier suspendu, un registre ou tout autre unité documentaire physique. C'est le niveau le plus fin de la hiérarchie. Chaque document physique reçoit automatiquement un numéro interne unique et un code QR. Il peut être associé à une ou plusieurs archives numériques." },
        ].map(h => (
          <View key={h.name} style={[s.hierLevel]}>
            <View style={[s.hierBullet, { backgroundColor: h.color }]} />
            <View style={s.hierContent}>
              <Text style={s.hierName}>{h.name}</Text>
              <Text style={s.hierDesc}>{h.desc}</Text>
            </View>
          </View>
        ))}
        <Ftr />
      </Page>

      <Page size="A4" style={s.page}>
        <Hdr section="Chapitre 9 — L'archivage physique (suite)" />

        <H2>9.3 — Créer et gérer les éléments physiques</H2>
        <P2>
          La navigation dans l'arborescence physique s'effectue de manière progressive depuis le
          niveau Local. Cliquez sur un local pour voir ses étagères, cliquez sur une étagère pour
          voir ses sections, et ainsi de suite jusqu'aux documents physiques. Le fil de navigation
          en haut de la section vous indique toujours votre position dans la hiérarchie.
        </P2>
        <H4>Créer un nouvel élément</H4>
        <NumBullet n={1}>Naviguez jusqu'au niveau parent dans lequel vous souhaitez ajouter l'élément.</NumBullet>
        <NumBullet n={2}>Cliquez sur le bouton Ajouter en haut à droite de la liste.</NumBullet>
        <NumBullet n={3}>Remplissez le formulaire avec le nom de l'élément et les informations requises.</NumBullet>
        <NumBullet n={4}>Validez. L'élément apparaît immédiatement dans la liste.</NumBullet>

        <H4>Gérer la capacité des classeurs</H4>
        <P2>
          Lors de la création d'un classeur, vous pouvez indiquer sa capacité maximale en nombre
          de documents. Le système calcule automatiquement le taux de remplissage et l'affiche
          sous forme d'une barre de progression colorée dans le tableau de bord physique.
          Un classeur à plus de 90 % de capacité génère une alerte dans le tableau de bord principal.
        </P2>

        <H2>9.4 — Le rattachement archive numérique / document physique</H2>
        <P2>
          Le rattachement est l'opération qui crée le lien entre un document physique et une ou
          plusieurs archives numériques. Ce lien est bidirectionnel : depuis l'archive numérique,
          vous pouvez consulter la localisation physique du document, et depuis la fiche physique,
          vous pouvez lister toutes les archives numériques rattachées.
        </P2>
        <H4>Rattacher une archive numérique à un document physique</H4>
        <NumBullet n={1}>Ouvrez le panneau de détail de l'archive numérique à rattacher.</NumBullet>
        <NumBullet n={2}>Cliquez sur le bouton Dossier physique dans la barre d'actions rapides.</NumBullet>
        <NumBullet n={3}>Une fenêtre s'ouvre avec la liste des documents physiques. Utilisez la barre de recherche pour trouver rapidement le bon document.</NumBullet>
        <NumBullet n={4}>Sélectionnez le document physique correspondant.</NumBullet>
        <NumBullet n={5}>Confirmez. Le panneau de détail de l'archive affiche maintenant la localisation physique complète (Local - Étagère - Section - Classeur - Document).</NumBullet>

        <H4>Détacher une archive</H4>
        <P2>
          Pour défaire un rattachement, ouvrez le panneau de détail de l'archive, cliquez sur
          Dossier physique et choisissez Détacher. L'opération est immédiate. Vous pourrez ensuite
          effectuer un nouveau rattachement si nécessaire.
        </P2>

        <H2>9.5 — Le code QR et son utilisation pratique</H2>
        <P2>
          Chaque document physique reçoit automatiquement un code QR unique généré à sa création.
          Ce code contient le numéro interne du document et permet une identification instantanée
          lors de la manipulation physique des archives.
        </P2>
        <P2>
          Pour tirer parti de cette fonctionnalité, imprimez le code QR affiché dans la fiche du
          document et collez-le sur la chemise ou la boîte correspondante. Lors d'une consultation
          des archives physiques, il suffit de scanner ce code avec n'importe quel smartphone pour
          retrouver instantanément la fiche du document dans GEID Archives et accéder à toutes les
          archives numériques rattachées.
        </P2>
        <Succ>L'utilisation systématique des codes QR réduit considérablement le risque d'erreur lors des opérations de classement et de recherche physique. Elle est particulièrement recommandée dans les dépôts contenant un grand nombre de documents.</Succ>
        <Ftr />
      </Page>
    </>
  );
}

// ── CHAPITRE 10 ───────────────────────────────────────────────

function Chapter10() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 10 — Recherche et indexation" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 10</Text></View>
      <Text style={s.chapterTitle}>Recherche et indexation</Text>
      <View style={s.chapterUnder} />

      <H2>10.1 — Le moteur de recherche unifié</H2>
      <P2>
        GEID Archives dispose d'un moteur de recherche qui explore simultanément l'ensemble des
        archives numériques et des documents physiques du système. Cette recherche unifiée évite
        d'avoir à parcourir manuellement deux sections séparées quand on cherche un document
        dont on ne sait pas s'il est archivé numériquement, physiquement, ou les deux.
      </P2>
      <P2>
        La recherche est indexée côté serveur, ce qui garantit des résultats rapides même sur
        un fonds documentaire de plusieurs milliers d'archives. Les résultats sont affichés en
        deux groupes distincts : Archives numériques et Documents physiques.
      </P2>

      <H2>10.2 — Accéder à la recherche</H2>
      <Bullet>Raccourci clavier Ctrl+K (Windows / Linux) ou Commande+K (Mac) depuis n'importe quelle section de l'application.</Bullet>
      <Bullet>Clic sur l'icône loupe dans la barre de navigation gauche de la section Archives.</Bullet>

      <H2>10.3 — Champs indexés</H2>
      <H4>Pour les archives numériques</H4>
      <Bullet>Désignation : premier critère, le plus important.</Bullet>
      <Bullet>Description : le résumé libre du contenu.</Bullet>
      <Bullet>Numéro de classe et numéro de référence.</Bullet>
      <Bullet>Dossier de classement.</Bullet>
      <Bullet>Étiquettes (tags) si configurées.</Bullet>

      <H4>Pour les documents physiques</H4>
      <Bullet>Numéro interne unique du document.</Bullet>
      <Bullet>Numéro de référence externe.</Bullet>
      <Bullet>Sujet du document.</Bullet>
      <Bullet>Catégorie et nature du document.</Bullet>

      <H2>10.4 — Conseils pour une recherche efficace</H2>
      <Bullet>Saisissez au moins deux caractères pour lancer la recherche. En dessous de deux caractères, aucun résultat n'est affiché.</Bullet>
      <Bullet>Utilisez des mots clés significatifs du contenu ou de la désignation : un nom propre, une année, un numéro de référence partiel.</Bullet>
      <Bullet>Si vous ne trouvez pas le document avec un terme, essayez un synonyme ou un extrait du numéro de référence.</Bullet>
      <Bullet>La recherche est insensible aux majuscules et minuscules : "rapport" et "Rapport" donnent les mêmes résultats.</Bullet>
      <Bullet>Évitez les termes trop génériques comme "document" ou "note" qui généreront trop de résultats sans intérêt.</Bullet>
      <Info label="RECHERCHE APPROCHÉE">
        Le moteur de recherche utilise un algorithme de correspondance approchée (fuzzy matching)
        qui trouve des résultats même si votre saisie comporte de légères fautes de frappe ou
        d'orthographe. Ainsi, saisir "rappotr" trouvera aussi les documents contenant "rapport".
      </Info>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 11 ───────────────────────────────────────────────

function Chapter11() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 11 — Rôles et permissions" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 11</Text></View>
      <Text style={s.chapterTitle}>Rôles, permissions{"\n"}et sécurité</Text>
      <View style={s.chapterUnder} />

      <H2>11.1 — Le modèle de contrôle d'accès</H2>
      <P2>
        GEID Archives repose sur un modèle de contrôle d'accès basé sur les rôles (RBAC : Role-Based
        Access Control). Chaque utilisateur se voit attribuer un rôle unique qui détermine l'ensemble
        des actions qu'il est autorisé à effectuer. Ce modèle garantit que les opérations sensibles
        ne peuvent être réalisées que par des personnes expressément habilitées.
      </P2>

      <H2>11.2 — Les trois rôles</H2>
      <H3>Agent soumetteur</H3>
      <P2>
        L'agent est l'utilisateur de base du système. Il représente typiquement un collaborateur
        d'un service qui produit ou reçoit des documents devant être archivés. Ses permissions
        sont limitées à la soumission de nouvelles archives et à la consultation du fonds documentaire
        auquel il a accès. Il ne peut ni valider, ni modifier des archives existantes après soumission.
      </P2>
      <H3>Archiviste</H3>
      <P2>
        L'archiviste est le professionnel responsable du traitement et de la gestion du fonds
        documentaire. Il dispose de droits d'écriture complets sur les archives : validation des
        soumissions, modification des métadonnées, configuration des DUA, gestion des transitions
        du cycle de vie et rattachement aux supports physiques. L'archiviste n'a pas le droit de
        supprimer des archives.
      </P2>
      <H3>Administrateur</H3>
      <P2>
        L'administrateur dispose de la plénitude des droits sur le système. Il peut effectuer toutes
        les actions des archivistes, plus la suppression d'archives, la gestion de la structure
        physique (création et modification des locaux, étagères, etc.) et la gestion des comptes
        utilisateurs.
      </P2>

      <H2>11.3 — Tableau complet des permissions</H2>
      <View style={s.table}>
        <View style={s.tableHead}>
          <View style={[s.tableHeadCell, { flex: 2.5 }]}><Text style={s.tableHeadTxt}>Action</Text></View>
          <View style={[s.tableHeadCell, { flex: 0.7 }]}><Text style={s.tableHeadTxt}>Agent</Text></View>
          <View style={[s.tableHeadCell, { flex: 0.9 }]}><Text style={s.tableHeadTxt}>Archiviste</Text></View>
          <View style={[s.tableHeadCell, { flex: 1 }]}><Text style={s.tableHeadTxt}>Admin</Text></View>
        </View>
        {[
          ["Soumettre une archive",                 "✓", "✓", "✓"],
          ["Consulter la liste des archives",        "✓", "✓", "✓"],
          ["Consulter le tableau de bord",           "✓", "✓", "✓"],
          ["Valider une archive",                    "—", "✓", "✓"],
          ["Modifier les métadonnées",               "—", "✓", "✓"],
          ["Configurer la DUA",                      "—", "✓", "✓"],
          ["Gérer les transitions de cycle de vie",  "—", "✓", "✓"],
          ["Rattacher archives numériques/physiques","—", "✓", "✓"],
          ["Consulter l'archivage physique",         "✓", "✓", "✓"],
          ["Créer/modifier structure physique",      "—", "—", "✓"],
          ["Supprimer des archives",                 "—", "—", "✓"],
          ["Gérer les utilisateurs",                 "—", "—", "✓"],
          ["Exporter la liste CSV",                  "✓", "✓", "✓"],
          ["Utiliser la recherche globale",          "✓", "✓", "✓"],
        ].map(([action, ...cols], i) => (
          <View key={action} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <View style={[s.tableCell, { flex: 2.5 }]}><Text style={s.tableCellTxt}>{action}</Text></View>
            {cols.map((v, j) => (
              <View key={j} style={[s.tableCell, { flex: j === 0 ? 0.7 : j === 1 ? 0.9 : 1 }]}>
                <Text style={v === "✓" ? s.tableCheck : s.tableCross}>{v}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
      <Ftr />
    </Page>
  );
}

// ── CHAPITRE 12 ───────────────────────────────────────────────

function Chapter12() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Chapitre 12 — Administration" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>CHAPITRE 12</Text></View>
      <Text style={s.chapterTitle}>Administration du système</Text>
      <View style={s.chapterUnder} />

      <H2>12.1 — Gestion des utilisateurs</H2>
      <P2>
        La gestion des comptes utilisateurs est une prérogative exclusive des administrateurs.
        Pour créer un nouveau compte, l'administrateur saisit l'adresse e-mail professionnelle
        de la personne, son nom et prénom, et lui attribue un rôle. Un mot de passe provisoire
        est généré et communiqué à l'utilisateur par e-mail ou par tout autre canal sécurisé.
      </P2>
      <P2>
        La modification du rôle d'un utilisateur existant est possible à tout moment. Un
        changement de rôle prend effet immédiatement dès la prochaine connexion de l'utilisateur.
        Si un utilisateur quitte l'organisation ou change de fonction, son compte doit être
        désactivé sans délai par l'administrateur pour maintenir la sécurité du système.
      </P2>
      <Info label="BONNE PRATIQUE SÉCURITÉ">Auditez régulièrement la liste des utilisateurs actifs. Désactivez les comptes des personnes qui ne font plus partie de l'organisation. Ne partagez jamais les identifiants entre plusieurs personnes.</Info>

      <H2>12.2 — Supervision et surveillance</H2>
      <P2>
        L'administrateur dispose du tableau de bord principal qui lui donne une vision en temps réel
        de l'état du système. Il peut également consulter l'historique des transitions de chaque
        archive pour vérifier la conformité des opérations effectuées. Toute action sensible
        (validation, suppression, modification de structure physique) est enregistrée avec la
        date, l'heure et l'identité de l'auteur.
      </P2>

      <H2>12.3 — Maintenance et performances</H2>
      <P2>
        L'application utilise un index de recherche full-text maintenu automatiquement par le
        serveur. Si les performances de recherche se dégradent avec le temps (ce qui peut arriver
        sur des fonds très importants), l'administrateur système peut demander une réindexation
        complète auprès de l'équipe de maintenance.
      </P2>
      <Warn>N'effectuez jamais d'opérations directes sur la base de données sans l'accord de l'équipe technique. Les modifications manuelles peuvent corrompre les index et rendre des données inaccessibles.</Warn>
      <Ftr />
    </Page>
  );
}

// ── ANNEXES ───────────────────────────────────────────────────

function AnnexeA() {
  const terms = [
    { t: "Archive courante", d: "Document utilisé régulièrement pour les besoins de l'activité quotidienne d'un service. Elle est conservée à proximité immédiate des utilisateurs." },
    { t: "Archive définitive", d: "Document conservé de manière permanente pour sa valeur historique, patrimoniale ou juridique. Elle est versée dans un service d'archives permanent." },
    { t: "Archive intermédiaire", d: "Document dont l'utilisation courante est terminée mais dont la conservation reste obligatoire pendant la durée fixée par la DUA." },
    { t: "Archive numérique", d: "Document électronique enregistré dans GEID Archives avec ses métadonnées et son fichier attaché." },
    { t: "Archive physique", d: "Document papier ou objet matériel conservé dans un espace physique, représenté dans le système par une fiche physique." },
    { t: "Audit trail", d: "Enregistrement chronologique et infalsifiable de toutes les actions effectuées sur un document, permettant de reconstituer son historique complet." },
    { t: "Code QR", d: "Code à barres bidimensionnel (Quick Response) apposé sur les documents physiques pour permettre leur identification rapide par scan." },
    { t: "Cycle de vie", d: "Ensemble des états successifs traversés par un document depuis sa création jusqu'à sa destination finale." },
    { t: "DUA", d: "Durée d'Utilité Administrative. Période légale ou réglementaire de conservation obligatoire d'un document avant la décision de sort final." },
    { t: "Métadonnée", d: "Information descriptive associée à un document : désignation, auteur, date, type, référence. Les métadonnées permettent de rechercher et d'identifier les documents." },
    { t: "Plan de classement", d: "Système hiérarchique organisant les documents d'une organisation par domaines d'activité ou thèmes. Il définit les codes de classe et la structure des dossiers." },
    { t: "RBAC", d: "Role-Based Access Control. Modèle de sécurité qui attribue des permissions aux utilisateurs via des rôles prédéfinis plutôt qu'individuellement." },
    { t: "Rattachement", d: "Lien créé dans GEID Archives entre une archive numérique et son document physique correspondant." },
    { t: "Sort final", d: "Décision prise à l'expiration de la DUA : conservation définitive dans les archives historiques ou élimination (destruction contrôlée)." },
    { t: "Versement", d: "Opération par laquelle des archives intermédiaires sont transférées vers un service d'archives définitives pour conservation permanente." },
    { t: "Validation", d: "Acte par lequel un archiviste certifie qu'une archive soumise est conforme aux exigences documentaires et l'intègre au fonds actif." },
    { t: "JWT", d: "JSON Web Token. Standard de sécurité utilisé pour l'authentification dans GEID Archives. Le jeton est émis à la connexion et valide pendant la durée de la session." },
  ];
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Annexe A — Glossaire" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>ANNEXE A</Text></View>
      <Text style={s.chapterTitle}>Glossaire complet</Text>
      <View style={s.chapterUnder} />
      {terms.map(({ t, d }) => (
        <View key={t} style={s.glossItem}>
          <Text style={s.glossTerm}>{t}</Text>
          <Text style={s.glossDef}>{d}</Text>
        </View>
      ))}
      <Ftr />
    </Page>
  );
}

function AnnexeB() {
  const faq = [
    { q: "Mon archive reste en attente depuis plusieurs jours. Que faire ?", a: "Contactez votre archiviste référent ou votre responsable de service en leur indiquant la désignation et la date de soumission de l'archive. Ils pourront traiter votre demande en priorité." },
    { q: "Je ne vois pas le bouton Supprimer dans le panneau de détail.", a: "La suppression est réservée aux administrateurs. Si vous pensez qu'une archive doit être supprimée, signalez-le à votre administrateur avec les raisons de la suppression." },
    { q: "Comment retrouver un document dont je ne connais que le sujet approximatif ?", a: "Utilisez la recherche globale (Ctrl+K) et saisissez les mots qui vous semblent caractériser le document. Le moteur de recherche approchée trouvera des résultats même avec une saisie imprécise." },
    { q: "Peut-on modifier le fichier d'une archive après validation ?", a: "Non. Le fichier attaché ne peut pas être remplacé après validation pour garantir l'intégrité du document archivé. Si le fichier est incorrect, créez une nouvelle soumission et supprimez l'ancienne." },
    { q: "Comment récupérer un mot de passe oublié ?", a: "Contactez votre administrateur système pour une réinitialisation de mot de passe. Il n'existe pas de procédure de réinitialisation en libre-service pour des raisons de sécurité." },
    { q: "L'application est lente. Que faire ?", a: "Vérifiez votre connexion internet. Si le problème persiste, fermez les onglets de navigation non utilisés et rechargez la page. Si les performances restent mauvaises, contactez l'équipe technique." },
    { q: "Peut-on annuler une validation effectuée par erreur ?", a: "Techniquement, une archive validée peut être renvoyée en arrière via les transitions du cycle de vie. Cependant, cette opération doit être évitée car elle rompt la traçabilité. Consultez votre responsable avant d'effectuer une rétrogradation de statut." },
    { q: "Que signifie 'sort final' dans la configuration de la DUA ?", a: "Le sort final est la décision prise à l'expiration de la DUA : soit le document est versé aux archives définitives (conservation permanente), soit il est éliminé (détruit selon les procédures en vigueur)." },
    { q: "Comment imprimer et utiliser un code QR ?", a: "Ouvrez la fiche du document physique dans la section Archivage physique. Le code QR est affiché dans le panneau de détail. Vous pouvez l'imprimer directement depuis votre navigateur ou le télécharger. Collez l'étiquette imprimée sur la chemise ou la boîte physique correspondante." },
    { q: "Qui est responsable de la gestion des DUA ?", a: "La configuration et le suivi des DUA sont de la responsabilité des archivistes. L'administrateur peut également intervenir. Les agents soumetteurs n'ont pas accès à cette fonctionnalité." },
  ];
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Annexe B — Questions fréquentes" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>ANNEXE B</Text></View>
      <Text style={s.chapterTitle}>Questions fréquentes (FAQ)</Text>
      <View style={s.chapterUnder} />
      {faq.map(({ q, a }, i) => (
        <View key={i} style={[s.fieldBox, { marginBottom: 10 }]}>
          <Text style={[s.fieldLabel, { color: P, marginBottom: 3 }]}>Q. {q}</Text>
          <Text style={s.fieldDesc}>{a}</Text>
        </View>
      ))}
      <Ftr />
    </Page>
  );
}

function AnnexeC() {
  return (
    <Page size="A4" style={s.page}>
      <Hdr section="Annexe C — Bonnes pratiques" />
      <View style={s.chapterTag}><Text style={s.chapterTagTxt}>ANNEXE C</Text></View>
      <Text style={s.chapterTitle}>Bonnes pratiques archivistiques</Text>
      <View style={s.chapterUnder} />

      <H2>Nommer correctement les archives</H2>
      <P2>La désignation est la carte d'identité du document. Une désignation de qualité doit être unique, précise et compréhensible par toute personne, même extérieure à votre service.</P2>
      <Bullet>Inclure toujours l'année dans la désignation des documents annuels ou périodiques.</Bullet>
      <Bullet>Éviter les abréviations non explicitées (PV, CR, NI…) sauf si elles sont universellement comprises dans votre organisation.</Bullet>
      <Bullet>Préciser le service ou la direction émettrice si le document concerne plusieurs entités.</Bullet>
      <Bullet>Distinguer les documents définitifs des versions de travail (ne pas archiver les brouillons).</Bullet>

      <H2>Organiser le plan de classement</H2>
      <P2>Un bon plan de classement facilite la recherche et garantit que les documents similaires sont regroupés ensemble.</P2>
      <Bullet>Adopter une nomenclature cohérente et documentée à l'échelle de l'organisation.</Bullet>
      <Bullet>Ne pas créer trop de niveaux de dossiers (trois niveaux maximum est souvent suffisant).</Bullet>
      <Bullet>Réviser le plan de classement annuellement pour l'adapter aux évolutions de l'organisation.</Bullet>

      <H2>Gérer les versions et les doublons</H2>
      <P2>Les systèmes d'archivage accumulent facilement des documents redondants si on n'y prête pas attention.</P2>
      <Bullet>N'archiver que les versions définitives et signées des documents. Les versions préliminaires et les projets de travail n'ont généralement pas vocation à être archivés.</Bullet>
      <Bullet>Avant de soumettre un document, vérifier dans le système qu'il n'existe pas déjà (utilisez la recherche globale).</Bullet>
      <Bullet>Si un document doit remplacer une version antérieure, créer la nouvelle version ET marquer l'ancienne comme obsolète (en la faisant passer en état intermédiaire puis détruit selon les règles internes).</Bullet>

      <H2>Prendre soin de la qualité des fichiers</H2>
      <Bullet>Privilégier le format PDF pour les documents textuels finaux. Le format PDF/A garantit une conservation à long terme.</Bullet>
      <Bullet>Pour les documents scannés, utiliser une résolution d'au moins 300 dpi pour garantir la lisibilité.</Bullet>
      <Bullet>Vérifier que le fichier joint n'est pas protégé par un mot de passe qui empêcherait sa consultation par d'autres utilisateurs.</Bullet>

      <H2>Maintenir l'inventaire physique à jour</H2>
      <Bullet>Enregistrer chaque nouveau document physique dans GEID Archives au moment de son rangement, pas après.</Bullet>
      <Bullet>Effectuer un audit annuel de l'inventaire physique pour détecter les écarts entre le système et la réalité du dépôt.</Bullet>
      <Bullet>Apposer systématiquement les codes QR sur les documents physiques dès leur création dans le système.</Bullet>

      <Div />
      <View style={[s.infoBox, { marginTop: 12 }]}>
        <View>
          <Text style={[s.boxLabel, { color: IBR }]}>DOCUMENT DE RÉFÉRENCE</Text>
          <Text style={s.boxTxt}>
            Ce manuel est le document de référence officiel de l'application GEID Archives.
            Il est mis à jour à chaque évolution majeure du système. Consultez régulièrement
            la section Aide de l'application pour vous assurer que vous disposez de la
            version la plus récente. Version courante : 2.0 — {new Date().getFullYear()}.
          </Text>
        </View>
      </View>
      <Ftr />
    </Page>
  );
}

// ── DOCUMENT PRINCIPAL ────────────────────────────────────────

export default function ManualDocument() {
  return (
    <Document
      title="GEID Archives — Manuel Utilisateur v1.0.0"
      author="GEID Archives"
      subject="Guide complet de gestion des archives numériques et physiques"
      creator="GEID Archives App"
      keywords="archives, gestion documentaire, DUA, cycle de vie, archivage physique">
      <CoverPage />
      <AvantProposPage />
      <TocPage />
      <Chapter1 />
      <Chapter2 />
      <Chapter3 />
      <Chapter4 />
      <Chapter5 />
      <Chapter6 />
      <Chapter7 />
      <Chapter8 />
      <Chapter9 />
      <Chapter10 />
      <Chapter11 />
      <Chapter12 />
      <AnnexeA />
      <AnnexeB />
      <AnnexeC />
    </Document>
  );
}
