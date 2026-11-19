"use strict";

// Tests d'ecran et de non-regression de l'export CSV du widget clubs (sprint E8,
// tache E8-9) : bouton « Exporter (CSV) » et menu dans le bandeau, etat grise,
// telechargement, annonce, absence d'appel a Grist. Regles : docs/ux/export-csv-clubs.md.
// Les fichiers CSV eux-memes ont leurs tests dans test/clubs-export.test.js.
// Valeurs fictives uniquement (domaine exemple.fr).
//
// Limite assumee : le script du design system (ft-autoloader.js) n'est pas charge.
// Ce qu'il fait lui-meme (ouvrir et fermer le menu, clavier, Echap, aria-expanded)
// n'est PAS teste ici. La doublure de test/helpers/clubs-export-ecran.js se borne
// a marquer le menu « ouvert » au clic sur le bouton, pour voir si un clic arrive
// jusqu'a lui ; c'est tout.

const test = require("node:test");
const assert = require("node:assert/strict");
const {chargerEcranExport, attributsHtml, HTML_CLUBS} = require("./helpers/clubs-export-ecran");

const BOM = "﻿";
const TEXTE_DROITS = "Vos droits ne permettent pas de lire les contacts.";

// --- Donnees fictives --------------------------------------------------------
// Alpha (id 7) et Gamma (id 9) sont dans la region A ; Beta (id 8) dans la B.
// Alpha a 2 contacts, Beta 1, Gamma aucun.

const TABLES = {
  DR: [{id: 1, Nom: "Région Exemple A"}, {id: 2, Nom: "Région Exemple B"}],
  DD: [
    {id: 1, Nom: "Département Exemple A", DR: 1},
    {id: 2, Nom: "Département Exemple B", DR: 2},
  ],
  Communes: [{id: 1, Code_Insee: "00001", Libelle_Commune: "Villeexemple"}],
  Structures: [
    {id: 7, Nom: "Club Exemple Alpha", SIRET: "12345678901234", Adresse: "1 rue de l'Exemple", Code_postal: "01000", Code_Insee: "00001", DD: 1},
    {id: 8, Nom: "Club Exemple Beta", SIRET: "", Adresse: "", Code_postal: "", Code_Insee: "", DD: 2},
    {id: 9, Nom: "Club Exemple Gamma", SIRET: "", Adresse: "", Code_postal: "", Code_Insee: "", DD: 1},
  ],
  Contacts: [
    {id: 1, Club: 7, Nom: "Exemple-Un", Prenom: "Prenom-Un", Email: "un@exemple.fr", Telephone: "0100000001", Fonction: "Fonction-Un"},
    {id: 2, Club: 7, Nom: "Exemple-Deux", Prenom: "Prenom-Deux", Email: "deux@exemple.fr", Telephone: "0100000002", Fonction: ""},
    {id: 3, Club: 8, Nom: "Exemple-Trois", Prenom: "Prenom-Trois", Email: "trois@exemple.fr", Telephone: "", Fonction: ""},
  ],
};

const charger = (options = {}) => chargerEcranExport({tables: TABLES, ...options});

// Un filtre qui ne garde que la region A (clubs Alpha et Gamma).
const filtrerRegionA = (ecran) => ecran.changerFiltre("dr", "Région Exemple A");
// Deux filtres incompatibles : aucun club ne reste.
function viderLaListe(ecran) {
  ecran.changerFiltre("dr", "Région Exemple A");
  ecran.choisirOption("dd", "Département Exemple B");
}

const aujourdhui = () => {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};

// Les tableaux crees dans le bac a sable ont leurs propres prototypes : on les
// ramene a des valeurs simples avant de les comparer.
const plain = (valeur) => JSON.parse(JSON.stringify(valeur));
const nomsAffiches = (w) => plain(w.filteredClubs().map((club) => club.nom));

// ---------------------------------------------------------------------------
// 1. Le bouton et le menu dans le bandeau (lus dans le vrai src/clubs/index.html)
// ---------------------------------------------------------------------------

const bandeauHtml = HTML_CLUBS.slice(HTML_CLUBS.indexOf('<div class="topbar">'), HTML_CLUBS.indexOf('<section class="filters-bar">'));
const classesDe = (id) => (attributsHtml(id) || {class: ""}).class.split(/\s+/);

test("le bouton « Exporter (CSV) » est dans le bandeau, dans div.topbar-actions, après le titre", () => {
  assert.ok(bandeauHtml.length > 0, "div.topbar introuvable avant la barre de filtres");
  const titre = bandeauHtml.indexOf("<h1>");
  const actions = bandeauHtml.indexOf('<div class="topbar-actions">');
  const bouton = bandeauHtml.indexOf('id="exportMenuBtn"');
  assert.ok(titre >= 0 && actions > titre, "div.topbar-actions doit suivre le titre");
  assert.ok(bouton > actions, "le bouton doit être dans div.topbar-actions");
  assert.match(bandeauHtml, /<span class="btn-content">Exporter \(CSV\)<\/span>/);
});

test("le bouton et le menu portent les classes du design system (dropdown, btn btn-secondary dropdown-toggle, dropdown-menu, dropdown-list, dropdown-item)", () => {
  assert.ok(classesDe("exportDropdown").includes("dropdown"));
  for (const classe of ["btn", "btn-secondary", "dropdown-toggle"]) {
    assert.ok(classesDe("exportMenuBtn").includes(classe), `classe ${classe} absente du bouton`);
  }
  assert.ok(classesDe("exportMenu").includes("dropdown-menu"));
  assert.match(HTML_CLUBS, /<ul class="dropdown-list">/);
  for (const id of ["exportClubsItem", "exportContactsItem"]) {
    assert.ok(classesDe(id).includes("dropdown-item"), `classe dropdown-item absente de ${id}`);
  }
});

test("le bouton est relié à son menu par data-ft-dropdown et a type=\"button\"", () => {
  const bouton = attributsHtml("exportMenuBtn");
  assert.equal(bouton["data-ft-dropdown"], "exportMenu");
  assert.ok(attributsHtml("exportMenu"), "le menu désigné par data-ft-dropdown n'existe pas");
  assert.equal(bouton.type, "button");
});

test("le menu contient exactement « Liste des clubs » puis « Contacts », dans cet ordre", () => {
  const lignes = [...HTML_CLUBS.matchAll(/<a class="dropdown-item"[^>]*>([^<]*)<\/a>/g)].map((trouve) => trouve[1].trim());
  assert.deepEqual(lignes, ["Liste des clubs", "Contacts"]);
  assert.equal(attributsHtml("exportClubsItem")["data-export"], "clubs");
  assert.equal(attributsHtml("exportContactsItem")["data-export"], "contacts");
});

test("la phrase de droits est dans le menu, masquée au départ, avec le texte exact de la note UX", () => {
  assert.match(HTML_CLUBS, new RegExp(`<p class="dropdown-item-text is-hidden" id="exportContactsAide">${TEXTE_DROITS.replaceAll(".", "\\.")}</p>`));
});

test("la zone d'annonce #exportStatus existe dès le chargement : sr-only, role=\"status\", aria-live=\"polite\"", () => {
  const zone = attributsHtml("exportStatus");
  assert.ok(zone, "zone #exportStatus absente du HTML");
  assert.deepEqual(zone.class.split(/\s+/), ["sr-only"]);
  assert.equal(zone.role, "status");
  assert.equal(zone["aria-live"], "polite");
});

test("avant le chargement des données, le bouton est déjà grisé dans le HTML (aria-disabled=\"true\")", () => {
  assert.equal(attributsHtml("exportMenuBtn")["aria-disabled"], "true");
});

// ---------------------------------------------------------------------------
// 2. Aucun club affiché : bouton grisé, rien ne s'ouvre, rien ne se télécharge
// ---------------------------------------------------------------------------

test("aucun club : le bouton a aria-disabled=\"true\" et aria-describedby vers #empty", async () => {
  const {ecran} = await charger({tables: {...TABLES, Structures: []}});
  const bouton = ecran.el("exportMenuBtn");
  assert.equal(bouton.getAttribute("aria-disabled"), "true");
  assert.equal(bouton.getAttribute("aria-describedby"), "empty");
  assert.equal(attributsHtml("empty").class.includes("empty"), true, "la cible #empty doit exister dans le HTML");
  assert.match(HTML_CLUBS, /id="empty">Aucun club ne correspond aux filtres\.<\/div>/);
});

test("aucun club : un clic sur le bouton n'ouvre pas le menu (le clic est annulé avant d'arriver au bouton)", async () => {
  const {ecran} = await charger({tables: {...TABLES, Structures: []}});
  const bouton = ecran.el("exportMenuBtn");
  const evenement = ecran.cliquer("exportMenuBtn");
  assert.equal(bouton.ftDropdown.ouvert, false, "le menu s'est ouvert malgré le bouton grisé");
  assert.equal(evenement.defaultPrevented, true);
  assert.equal(evenement.propagationStopped, true);
});

test("aucun club : un clic sur le bouton ne télécharge rien", async () => {
  const {ecran} = await charger({tables: {...TABLES, Structures: []}});
  ecran.cliquer("exportMenuBtn");
  assert.equal(ecran.telechargements.length, 0);
  assert.deepEqual(ecran.ordre, []);
});

test("aucun club : même un clic forcé sur une ligne du menu ne télécharge rien et n'annonce rien", async () => {
  const {ecran} = await charger({tables: {...TABLES, Structures: []}});
  for (const id of ["exportClubsItem", "exportContactsItem"]) {
    const evenement = ecran.cliquer(id);
    assert.equal(evenement.defaultPrevented, true, `${id} : la navigation du lien doit être annulée`);
  }
  assert.equal(ecran.telechargements.length, 0);
  assert.equal(ecran.el("exportStatus").textContent, "");
});

// ---------------------------------------------------------------------------
// 3. Des clubs affichés : le bouton est actif
// ---------------------------------------------------------------------------

test("des clubs affichés : le bouton n'est pas grisé", async () => {
  const {ecran} = await charger();
  assert.notEqual(ecran.el("exportMenuBtn").getAttribute("aria-disabled"), "true");
});

test("des clubs affichés : le bouton n'a plus de lien vers #empty (pas de aria-describedby)", async () => {
  const {ecran} = await charger();
  assert.equal(ecran.el("exportMenuBtn").getAttribute("aria-describedby"), null);
});

test("des clubs affichés : un clic sur le bouton laisse passer l'ouverture du menu (le clic n'est pas annulé)", async () => {
  const {ecran} = await charger();
  const evenement = ecran.cliquer("exportMenuBtn");
  assert.equal(evenement.defaultPrevented, false);
  assert.equal(ecran.el("exportMenuBtn").ftDropdown.ouvert, true);
});

// ---------------------------------------------------------------------------
// 4. Le bouton suit les filtres
// ---------------------------------------------------------------------------

test("un filtre qui laisse des clubs garde le bouton actif", async () => {
  const {w, ecran} = await charger();
  filtrerRegionA(ecran);
  assert.deepEqual(nomsAffiches(w), ["Club Exemple Alpha", "Club Exemple Gamma"]);
  assert.notEqual(ecran.el("exportMenuBtn").getAttribute("aria-disabled"), "true");
});

test("un changement de filtre qui vide la liste grise le bouton et le relie à #empty", async () => {
  const {w, ecran} = await charger();
  viderLaListe(ecran);
  assert.equal(w.filteredClubs().length, 0);
  const bouton = ecran.el("exportMenuBtn");
  assert.equal(bouton.getAttribute("aria-disabled"), "true");
  assert.equal(bouton.getAttribute("aria-describedby"), "empty");
});

test("après « Réinitialiser les filtres », le bouton redevient actif et perd son lien vers #empty", async () => {
  const {w, ecran} = await charger();
  viderLaListe(ecran);
  ecran.reinitialiser();
  assert.equal(w.filteredClubs().length, 3);
  const bouton = ecran.el("exportMenuBtn");
  assert.notEqual(bouton.getAttribute("aria-disabled"), "true");
  assert.equal(bouton.getAttribute("aria-describedby"), null);
});

test("un menu resté ouvert se ferme quand un filtre vide la liste", async () => {
  const {ecran} = await charger();
  const bouton = ecran.el("exportMenuBtn");
  ecran.cliquer("exportMenuBtn");
  assert.equal(bouton.ftDropdown.ouvert, true);
  viderLaListe(ecran);
  assert.equal(bouton.ftDropdown.ouvert, false);
});

// ---------------------------------------------------------------------------
// 5. « Liste des clubs » : un fichier, les clubs affichés
// ---------------------------------------------------------------------------

test("clic sur « Liste des clubs » : un seul fichier est téléchargé", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.telechargements.length, 1);
});

test("« Liste des clubs » : le nom du fichier est clubs-insertion-sport, la date du jour, .csv", async () => {
  const {w, ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  const nom = ecran.telechargements[0].nom;
  assert.match(nom, /^clubs-insertion-sport-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(nom, `${w.EXPORT_CLUBS_PREFIXE_FICHIER}-${aujourdhui()}.csv`);
});

test("« Liste des clubs » : le contenu est celui de fichierExportClubs() pour les clubs affichés", async () => {
  const {w, ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  const fichier = ecran.telechargements[0];
  assert.equal(fichier.contenu, w.fichierExportClubs(w.filteredClubs()).contenu);
  assert.ok(fichier.contenu.startsWith(BOM));
  assert.equal(fichier.type, "text/csv;charset=utf-8");
});

test("« Liste des clubs » : avec un filtre, seuls les clubs affichés sont exportés", async () => {
  const {w, ecran} = await charger();
  filtrerRegionA(ecran);
  ecran.cliquer("exportClubsItem");
  const {contenu} = ecran.telechargements[0];
  assert.equal(contenu, w.fichierExportClubs(w.filteredClubs()).contenu);
  assert.ok(contenu.includes("Club Exemple Alpha"));
  assert.ok(contenu.includes("Club Exemple Gamma"));
  assert.ok(!contenu.includes("Club Exemple Beta"), "un club hors filtre figure dans le fichier");
  assert.equal(contenu.split("\r\n").length, 3, "attendu : en-têtes + 2 clubs");
});

test("« Liste des clubs » : le lien temporaire est cliqué avec l'adresse du fichier, puis l'adresse est libérée", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  const {href, nom} = ecran.telechargements[0];
  assert.match(href, /^blob:/);
  assert.match(nom, /\.csv$/);
  assert.deepEqual(ecran.ordre, [`creation:${href}`, "clic", `liberation:${href}`]);
});

test("« Liste des clubs » : le lien temporaire n'est pas laissé dans la page", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.corps.ajoutes.length, 0);
});

test("« Liste des clubs » : la navigation du lien du menu (href=\"#\") est annulée", async () => {
  const {ecran} = await charger();
  const evenement = ecran.cliquer("exportClubsItem");
  assert.equal(evenement.defaultPrevented, true);
});

// ---------------------------------------------------------------------------
// 6. « Contacts » : un fichier, les contacts des clubs affichés
// ---------------------------------------------------------------------------

test("clic sur « Contacts » : un seul fichier est téléchargé", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportContactsItem");
  assert.equal(ecran.telechargements.length, 1);
});

test("« Contacts » : le nom du fichier est contacts-clubs-insertion-sport, la date du jour, .csv", async () => {
  const {w, ecran} = await charger();
  ecran.cliquer("exportContactsItem");
  const nom = ecran.telechargements[0].nom;
  assert.match(nom, /^contacts-clubs-insertion-sport-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(nom, `${w.EXPORT_CONTACTS_PREFIXE_FICHIER}-${aujourdhui()}.csv`);
});

test("« Contacts » : le contenu est celui de fichierExportContacts() pour les clubs affichés", async () => {
  const {w, ecran} = await charger();
  ecran.cliquer("exportContactsItem");
  const fichier = ecran.telechargements[0];
  assert.equal(fichier.contenu, w.fichierExportContacts(w.filteredClubs()).contenu);
  assert.ok(fichier.contenu.startsWith(BOM));
  assert.equal(fichier.type, "text/csv;charset=utf-8");
});

test("« Contacts » : avec un filtre, seuls les contacts des clubs affichés sont exportés (un club sans contact garde une ligne)", async () => {
  const {w, ecran} = await charger();
  filtrerRegionA(ecran);
  ecran.cliquer("exportContactsItem");
  const {contenu} = ecran.telechargements[0];
  assert.equal(contenu, w.fichierExportContacts(w.filteredClubs()).contenu);
  assert.ok(contenu.includes("un@exemple.fr"));
  assert.ok(contenu.includes("deux@exemple.fr"));
  assert.ok(!contenu.includes("trois@exemple.fr"), "le contact d'un club hors filtre figure dans le fichier");
  assert.ok(contenu.includes("Club Exemple Gamma"), "le club sans contact doit garder sa ligne");
  assert.equal(contenu.split("\r\n").length, 4, "attendu : en-têtes + 2 contacts d'Alpha + 1 ligne pour Gamma");
});

test("« Contacts » : le lien temporaire est cliqué avec l'adresse du fichier, puis l'adresse est libérée", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportContactsItem");
  const {href} = ecran.telechargements[0];
  assert.match(href, /^blob:/);
  assert.deepEqual(ecran.ordre, [`creation:${href}`, "clic", `liberation:${href}`]);
  assert.equal(ecran.corps.ajoutes.length, 0);
});

test("« Contacts » : la navigation du lien du menu (href=\"#\") est annulée", async () => {
  const {ecran} = await charger();
  const evenement = ecran.cliquer("exportContactsItem");
  assert.equal(evenement.defaultPrevented, true);
});

// ---------------------------------------------------------------------------
// 7. Contacts illisibles
// ---------------------------------------------------------------------------

test("contacts illisibles : la ligne « Contacts » a aria-disabled=\"true\" et est reliée à la phrase de droits", async () => {
  const {ecran} = await charger({illisibles: ["Contacts"]});
  const ligne = ecran.el("exportContactsItem");
  assert.equal(ligne.getAttribute("aria-disabled"), "true");
  assert.equal(ligne.getAttribute("aria-describedby"), "exportContactsAide");
  assert.ok(attributsHtml("exportContactsAide"), "la phrase désignée par aria-describedby n'existe pas");
});

test("contacts illisibles : la phrase de droits est visible (plus de is-hidden)", async () => {
  const {ecran} = await charger({illisibles: ["Contacts"]});
  assert.equal(ecran.el("exportContactsAide").classList.contains("is-hidden"), false);
});

test("contacts illisibles : un clic sur « Contacts » ne télécharge rien, n'annonce rien et annule la navigation", async () => {
  const {ecran} = await charger({illisibles: ["Contacts"]});
  const evenement = ecran.cliquer("exportContactsItem");
  assert.equal(evenement.defaultPrevented, true);
  assert.equal(ecran.telechargements.length, 0);
  assert.deepEqual(ecran.ordre, []);
  assert.equal(ecran.el("exportStatus").textContent, "");
});

test("contacts illisibles : « Liste des clubs » fonctionne toujours et le bouton reste actif", async () => {
  const {w, ecran} = await charger({illisibles: ["Contacts"]});
  assert.notEqual(ecran.el("exportMenuBtn").getAttribute("aria-disabled"), "true");
  assert.equal(ecran.el("exportClubsItem").getAttribute("aria-disabled"), null);
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.telechargements.length, 1);
  assert.equal(ecran.telechargements[0].contenu, w.fichierExportClubs(w.filteredClubs()).contenu);
});

test("contacts lisibles : la ligne « Contacts » n'est pas grisée et la phrase de droits reste masquée", async () => {
  const {ecran} = await charger();
  assert.equal(ecran.el("exportContactsItem").getAttribute("aria-disabled"), "false");
  assert.equal(ecran.el("exportContactsAide").classList.contains("is-hidden"), true);
});

// ---------------------------------------------------------------------------
// 8. Annonce pour les lecteurs d'écran
// ---------------------------------------------------------------------------

test("annonce après « Liste des clubs » : « Fichier téléchargé : 3 clubs exportés. »", async () => {
  const {ecran} = await charger();
  assert.equal(ecran.el("exportStatus").textContent, "", "la zone doit être vide avant l'export");
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.el("exportStatus").textContent, "Fichier téléchargé : 3 clubs exportés.");
});

test("annonce après « Liste des clubs » avec un seul club : singulier (« 1 club exporté. »)", async () => {
  const {ecran} = await charger();
  ecran.changerFiltre("dr", "Région Exemple B");
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.el("exportStatus").textContent, "Fichier téléchargé : 1 club exporté.");
});

test("annonce après « Contacts » : « Fichier téléchargé : 4 lignes pour 3 clubs. »", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportContactsItem");
  assert.equal(ecran.el("exportStatus").textContent, "Fichier téléchargé : 4 lignes pour 3 clubs.");
});

test("annonce après « Contacts » avec un seul contact : singulier (« 1 ligne pour 1 club. »)", async () => {
  const {ecran} = await charger();
  ecran.changerFiltre("dr", "Région Exemple B");
  ecran.cliquer("exportContactsItem");
  assert.equal(ecran.el("exportStatus").textContent, "Fichier téléchargé : 1 ligne pour 1 club.");
});

test("la zone d'annonce est vidée avant d'écrire, pour que deux exports de suite soient annoncés", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  ecran.cliquer("exportClubsItem");
  assert.deepEqual(plain(ecran.ecrituresAnnonce), [
    "", "Fichier téléchargé : 3 clubs exportés.",
    "", "Fichier téléchargé : 3 clubs exportés.",
  ]);
});

// ---------------------------------------------------------------------------
// 9. Aucun appel à Grist, rien dans la console
// ---------------------------------------------------------------------------

test("exporter « Liste des clubs » n'appelle ni fetchTable, ni applyUserActions, ni getAccessToken, ni fetch, et n'écrit rien dans la console", async () => {
  const {ecran} = await charger();
  const avant = ecran.compteurs();
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.telechargements.length, 1);
  assert.deepEqual(ecran.compteurs(), avant);
});

test("exporter « Contacts » n'appelle ni fetchTable, ni applyUserActions, ni getAccessToken, ni fetch, et n'écrit rien dans la console", async () => {
  const {ecran} = await charger();
  const avant = ecran.compteurs();
  ecran.cliquer("exportContactsItem");
  assert.equal(ecran.telechargements.length, 1);
  assert.deepEqual(ecran.compteurs(), avant);
});

test("un export laisse intacts le stockage du navigateur et les réglages du widget (rien n'est mémorisé)", async () => {
  const {ecran} = await charger();
  const avant = ecran.compteurs();
  ecran.cliquer("exportClubsItem");
  ecran.cliquer("exportContactsItem");
  const apres = ecran.compteurs();
  assert.equal(apres.localStorage, avant.localStorage);
  assert.equal(apres.sessionStorage, avant.sessionStorage);
  assert.equal(apres.setOption, avant.setOption);
});

test("le jeton fictif de Grist n'apparaît ni dans les fichiers téléchargés ni dans l'annonce", async () => {
  const {ecran} = await charger();
  ecran.cliquer("exportClubsItem");
  ecran.cliquer("exportContactsItem");
  for (const fichier of ecran.telechargements) {
    assert.ok(!fichier.contenu.includes("jeton-fictif"));
    assert.ok(!fichier.href.includes("jeton-fictif"));
  }
  assert.ok(!ecran.el("exportStatus").textContent.includes("jeton-fictif"));
});

// ---------------------------------------------------------------------------
// 10. Fermeture du menu et retour du focus
// ---------------------------------------------------------------------------

test("après « Liste des clubs », le menu se ferme et le focus revient sur le bouton", async () => {
  const {ecran} = await charger();
  const bouton = ecran.el("exportMenuBtn");
  ecran.cliquer("exportMenuBtn");
  ecran.el("exportClubsItem").focus();
  assert.equal(bouton.ftDropdown.ouvert, true);
  assert.notEqual(ecran.document.activeElement, bouton);
  ecran.cliquer("exportClubsItem");
  assert.equal(bouton.ftDropdown.ouvert, false);
  assert.equal(ecran.document.activeElement, bouton);
});

test("après « Contacts », le menu se ferme et le focus revient sur le bouton", async () => {
  const {ecran} = await charger();
  const bouton = ecran.el("exportMenuBtn");
  ecran.cliquer("exportMenuBtn");
  ecran.el("exportContactsItem").focus();
  ecran.cliquer("exportContactsItem");
  assert.equal(bouton.ftDropdown.ouvert, false);
  assert.equal(ecran.document.activeElement, bouton);
});

test("si le script du design system n'a pas encore posé son instance sur le bouton, l'export marche quand même et le focus revient", async () => {
  const {ecran} = await charger();
  const bouton = ecran.el("exportMenuBtn");
  delete bouton.ftDropdown;
  ecran.el("exportClubsItem").focus();
  ecran.cliquer("exportClubsItem");
  assert.equal(ecran.telechargements.length, 1);
  assert.equal(ecran.document.activeElement, bouton);
});
