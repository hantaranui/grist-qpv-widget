"use strict";

// Tests de l'export CSV « Liste des clubs » du widget clubs (sprint E8, tache
// E8-5) : constructeur CSV commun, protection anti-formule, regle des zeros,
// lignes du fichier, nom du fichier. Aucune ecriture, aucun ecran.
// Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadClubs} = require("./helpers/clubs");

const w = loadClubs();

// Les tableaux crees dans le bac a sable ont leurs propres prototypes : on les
// ramene a des valeurs simples avant de les comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

const BOM = "﻿";

// Petit lecteur de CSV (point-virgule, guillemets doubles, \r\n) : sert a
// verifier qu'une valeur ne casse ni les colonnes ni les lignes.
function lireCsv(texte) {
  const sansBom = texte.startsWith(BOM) ? texte.slice(1) : texte;
  const lignes = [];
  let ligne = [];
  let cellule = "";
  let entreGuillemets = false;
  for (let i = 0; i < sansBom.length; i++) {
    const c = sansBom[i];
    if (entreGuillemets) {
      if (c === '"' && sansBom[i + 1] === '"') { cellule += '"'; i++; }
      else if (c === '"') { entreGuillemets = false; }
      else { cellule += c; }
    } else if (c === '"') { entreGuillemets = true; }
    else if (c === ";") { ligne.push(cellule); cellule = ""; }
    else if (c === "\r" && sansBom[i + 1] === "\n") { ligne.push(cellule); lignes.push(ligne); ligne = []; cellule = ""; i++; }
    else { cellule += c; }
  }
  ligne.push(cellule);
  lignes.push(ligne);
  return lignes;
}

const clubFictif = (surcharge = {}) => ({
  siret: "12345678901234",
  nom: "Club Exemple",
  adresse: "1 rue de l'Exemple",
  codePostal: "75001",
  ville: "Villeexemple",
  ...surcharge,
});

// ---------------------------------------------------------------------------
// 1 et 2. En-tetes, BOM, separateur, fins de ligne
// ---------------------------------------------------------------------------

test("les en-têtes du fichier clubs sont exactement SIRET, Nom, Adresse, Code postal, Ville, dans cet ordre", () => {
  assert.deepEqual(plain(w.EXPORT_CLUBS_ENTETES), ["SIRET", "Nom", "Adresse", "Code postal", "Ville"]);
  const fichier = w.fichierExportClubs([clubFictif()], new Date(2026, 10, 18));
  assert.deepEqual(lireCsv(fichier.contenu)[0], ["SIRET", "Nom", "Adresse", "Code postal", "Ville"]);
});

test("la ligne d'en-têtes est écrite entre guillemets, sans formule ni apostrophe", () => {
  const fichier = w.fichierExportClubs([], new Date(2026, 10, 18));
  assert.equal(fichier.contenu, `${BOM}"SIRET";"Nom";"Adresse";"Code postal";"Ville"`);
});

test("le fichier commence par le BOM UTF-8", () => {
  const contenu = w.construireCsv(["Nom"], [["Alpha"]]);
  assert.equal(contenu.charCodeAt(0), 0xFEFF);
  assert.ok(contenu.startsWith(BOM));
});

test("les colonnes sont séparées par un point-virgule", () => {
  assert.equal(w.CSV_SEPARATEUR, ";");
  const contenu = w.construireCsv(["A", "B", "C"], [["1", "2", "3"]]);
  assert.equal(contenu, `${BOM}"A";"B";"C"\r\n"1";"2";"3"`);
});

test("les lignes sont séparées par \\r\\n, sans fin de ligne après la dernière", () => {
  const contenu = w.construireCsv(["Nom"], [["Alpha"], ["Beta"]]);
  assert.equal(contenu, `${BOM}"Nom"\r\n"Alpha"\r\n"Beta"`);
  assert.ok(!contenu.endsWith("\r\n"));
  assert.ok(!contenu.replaceAll("\r\n", "").includes("\n"));
});

// ---------------------------------------------------------------------------
// 3. Guillemets, point-virgule, retour a la ligne dans une valeur
// ---------------------------------------------------------------------------

test("chaque cellule, texte ou vide, est entourée de guillemets", () => {
  assert.equal(w.celluleCsv("Alpha", "Nom"), '"Alpha"');
  assert.equal(w.celluleCsv("", "Nom"), '""');
});

test("un guillemet dans une valeur est doublé", () => {
  assert.equal(w.celluleCsv('Club "Les Aigles"', "Nom"), '"Club ""Les Aigles"""');
  const lignes = lireCsv(w.construireCsv(["Nom"], [['Club "Les Aigles"']]));
  assert.equal(lignes[1][0], 'Club "Les Aigles"');
});

test("un point-virgule dans une valeur ne crée pas de colonne en plus", () => {
  const contenu = w.fichierExportClubs([clubFictif({adresse: "3 rue A; bâtiment B"})], new Date(2026, 10, 18)).contenu;
  const lignes = lireCsv(contenu);
  assert.equal(lignes[1].length, 5);
  assert.equal(lignes[1][2], "3 rue A; bâtiment B");
});

test("un retour à la ligne dans une valeur ne crée pas de ligne en plus", () => {
  const contenu = w.fichierExportClubs([clubFictif({adresse: "3 rue A\nbâtiment B"}), clubFictif({nom: "Autre"})], new Date(2026, 10, 18)).contenu;
  const lignes = lireCsv(contenu);
  assert.equal(lignes.length, 3);
  assert.equal(lignes[1].length, 5);
  assert.equal(lignes[1][2], "3 rue A\nbâtiment B");
  assert.equal(lignes[2][1], "Autre");
});

test("un retour chariot suivi d'un retour à la ligne dans une valeur ne casse pas les lignes", () => {
  const contenu = w.construireCsv(["Nom", "Adresse"], [["Alpha", "ligne 1\r\nligne 2"], ["Beta", "x"]]);
  const lignes = lireCsv(contenu);
  assert.equal(lignes.length, 3);
  assert.equal(lignes[1][1], "ligne 1\r\nligne 2");
  assert.equal(lignes[2][0], "Beta");
});

// ---------------------------------------------------------------------------
// 4. Anti-formule
// ---------------------------------------------------------------------------

test("une valeur de Nom, Adresse, Ville, SIRET, Code postal ou Téléphone qui commence par = + - @ reçoit une apostrophe devant", () => {
  for (const debut of ["=", "+", "-", "@"]) {
    for (const entete of ["Nom", "Adresse", "Ville", "SIRET", "Code postal", "Téléphone"]) {
      assert.equal(w.celluleCsv(`${debut}SOMME(A1)`, entete), `"'${debut}SOMME(A1)"`, `${entete} commençant par ${debut}`);
    }
  }
});

test("une valeur qui commence par une tabulation ou un retour chariot reçoit une apostrophe devant", () => {
  assert.equal(w.celluleCsv("\tabc", "Nom"), `"'\tabc"`);
  assert.equal(w.celluleCsv("\rabc", "Adresse"), `"'\rabc"`);
  for (const entete of ["SIRET", "Code postal", "Téléphone"]) {
    assert.equal(w.celluleCsv("\t0102030405", entete), `"'\t0102030405"`, `${entete} commençant par une tabulation`);
    assert.equal(w.celluleCsv("\r0102030405", entete), `"'\r0102030405"`, `${entete} commençant par un retour chariot`);
  }
});

test("l'anti-formule s'applique aussi à travers le fichier clubs complet", () => {
  const club = clubFictif({nom: "=1+1", adresse: "+33 rue", ville: "@Ville"});
  const lignes = lireCsv(w.fichierExportClubs([club], new Date(2026, 10, 18)).contenu);
  assert.deepEqual(lignes[1].slice(1, 3), ["'=1+1", "'+33 rue"]);
  assert.equal(lignes[1][4], "'@Ville");
});

test("l'anti-formule s'applique aussi aux colonnes SIRET et Code postal du fichier clubs complet", () => {
  const club = clubFictif({siret: "=12345678901234", codePostal: "+75001"});
  const lignes = lireCsv(w.fichierExportClubs([club], new Date(2026, 10, 18)).contenu);
  assert.equal(lignes[1][0], "'=12345678901234");
  assert.equal(lignes[1][3], "'+75001");
});

test("une valeur qui contient = + - @ ailleurs qu'au début n'est pas modifiée", () => {
  assert.equal(w.celluleCsv("Club a=b", "Nom"), '"Club a=b"');
  assert.equal(w.celluleCsv("Aix-en-Provence", "Ville"), '"Aix-en-Provence"');
  assert.equal(w.celluleCsv("contact@exemple.fr", "Nom"), '"contact@exemple.fr"');
});

// ---------------------------------------------------------------------------
// 5. Colonnes de chiffres : valeur telle quelle, sans formule
// ---------------------------------------------------------------------------

test("aucune formule =\"...\" n'est écrite : SIRET, Code postal et Téléphone en chiffres restent tels quels, entre guillemets", () => {
  assert.equal(w.celluleCsv("0102030405", "Téléphone"), '"0102030405"');
  assert.equal(w.celluleCsv("01000", "Code postal"), '"01000"');
  assert.equal(w.celluleCsv("12345678901234", "SIRET"), '"12345678901234"');
});

test("aucune cellule du fichier clubs ni du fichier contacts ne contient la formule =\"...", () => {
  const clubs = [clubFictif({siret: "12345678900012", codePostal: "01000"}), clubFictif({siret: "00012345600017", codePostal: "75001"})];
  const fichierClubs = w.fichierExportClubs(clubs, new Date(2026, 10, 18));
  assert.ok(!fichierClubs.contenu.includes('="'), "fichier clubs");
  assert.ok(!fichierClubs.contenu.includes('""'), "fichier clubs : pas de guillemet doublé");
  const fichierContacts = w.fichierExportContacts(
    [{id: 1, siret: "12345678900012", nom: "Club 1"}], new Date(2026, 10, 18),
    {Contacts: [{id: 301, Club: 1, Nom: "Dupont", Prenom: "Alice", Fonction: "Présidente", Email: "alice@exemple.fr", Telephone: "0612345678"}]}, []);
  assert.ok(!fichierContacts.contenu.includes('="'), "fichier contacts");
  assert.ok(!fichierContacts.contenu.includes('""'), "fichier contacts : pas de guillemet doublé");
});

test("un code postal 01000 garde son zéro dans le fichier, tel quel", () => {
  const fichier = w.fichierExportClubs([clubFictif({codePostal: "01000"})], new Date(2026, 10, 18));
  assert.ok(fichier.contenu.includes(';"01000";'));
  assert.equal(lireCsv(fichier.contenu)[1][3], "01000");
});

test("un SIRET de 14 chiffres est conservé en entier dans le fichier, tel quel", () => {
  const fichier = w.fichierExportClubs([clubFictif({siret: "12345678900012"})], new Date(2026, 10, 18));
  assert.ok(fichier.contenu.includes('"12345678900012"'));
  assert.equal(lireCsv(fichier.contenu)[1][0], "12345678900012");
  const avecZeros = w.fichierExportClubs([clubFictif({siret: "00012345600017"})], new Date(2026, 10, 18));
  assert.equal(lireCsv(avecZeros.contenu)[1][0], "00012345600017");
});

test("une valeur faite de chiffres dans une colonne autre que SIRET, Code postal et Téléphone reste du texte simple", () => {
  assert.equal(w.celluleCsv("12345", "Nom"), '"12345"');
  assert.equal(w.celluleCsv("12", "Adresse"), '"12"');
  assert.equal(w.celluleCsv("2024", "Ville"), '"2024"');
});

// ---------------------------------------------------------------------------
// 6. Colonnes de chiffres : valeur qui n'est pas que des chiffres
// ---------------------------------------------------------------------------

test("un SIRET avec des espaces reste du texte normal, sans formule ni apostrophe", () => {
  assert.equal(w.celluleCsv("123 456 789 01234", "SIRET"), '"123 456 789 01234"');
});

test("un téléphone « +33 6 … » reçoit l'apostrophe anti-formule, sans formule texte", () => {
  assert.equal(w.celluleCsv("+33 6 12 34 56 78", "Téléphone"), `"'+33 6 12 34 56 78"`);
});

test("un code postal avec une lettre (2A000) reste du texte normal", () => {
  assert.equal(w.celluleCsv("2A000", "Code postal"), '"2A000"');
});

test("un téléphone avec des espaces mais sans « + » reste du texte normal", () => {
  assert.equal(w.celluleCsv("01 02 03 04 05", "Téléphone"), '"01 02 03 04 05"');
});

// ---------------------------------------------------------------------------
// 7. Valeurs numeriques (documente le comportement actuel, sans le corriger)
// ---------------------------------------------------------------------------

test("un code postal reçu comme nombre 1000 ne plante pas et est écrit tel quel (le zéro perdu n'est pas rendu)", () => {
  let cellule;
  assert.doesNotThrow(() => { cellule = w.celluleCsv(1000, "Code postal"); });
  assert.equal(cellule, '"1000"');
});

test("un SIRET reçu comme nombre ne plante pas et est écrit tel quel", () => {
  assert.equal(w.celluleCsv(12345678901234, "SIRET"), '"12345678901234"');
});

test("un nombre dans une colonne de texte ne plante pas et reste du texte simple", () => {
  assert.equal(w.celluleCsv(42, "Nom"), '"42"');
});

test("un nombre négatif dans une colonne de texte ne plante pas et reçoit l'apostrophe anti-formule", () => {
  assert.equal(w.celluleCsv(-5, "Nom"), `"'-5"`);
});

test("un club dont le code postal est un nombre passe dans le fichier sans erreur", () => {
  assert.doesNotThrow(() => w.fichierExportClubs([clubFictif({codePostal: 1000, siret: 12345678901234})], new Date(2026, 10, 18)));
});

// ---------------------------------------------------------------------------
// 8. Vide, null, undefined
// ---------------------------------------------------------------------------

test("une valeur vide, null ou undefined donne une cellule vide", () => {
  for (const entete of ["Nom", "SIRET", "Code postal", "Téléphone"]) {
    assert.equal(w.celluleCsv("", entete), '""');
    assert.equal(w.celluleCsv(null, entete), '""');
    assert.equal(w.celluleCsv(undefined, entete), '""');
  }
});

test("le mot « null » ou « undefined » n'apparaît jamais dans le fichier d'un club aux champs absents", () => {
  const fichier = w.fichierExportClubs([{nom: "Club vide", siret: null, adresse: undefined}], new Date(2026, 10, 18));
  assert.ok(!fichier.contenu.includes("null"));
  assert.ok(!fichier.contenu.includes("undefined"));
});

// ---------------------------------------------------------------------------
// 9. Accents
// ---------------------------------------------------------------------------

test("les accents et caractères spéciaux sont conservés tels quels", () => {
  const club = clubFictif({nom: "Association Sportive Épinal-Ève", adresse: "12 allée des Ébéniers, Œuvre", ville: "Saint-Étienne-du-Rouvray"});
  const lignes = lireCsv(w.fichierExportClubs([club], new Date(2026, 10, 18)).contenu);
  assert.equal(lignes[1][1], "Association Sportive Épinal-Ève");
  assert.equal(lignes[1][2], "12 allée des Ébéniers, Œuvre");
  assert.equal(lignes[1][4], "Saint-Étienne-du-Rouvray");
});

// ---------------------------------------------------------------------------
// 10. Club sans SIRET ou sans nom
// ---------------------------------------------------------------------------

test("un club sans SIRET est exporté avec la case SIRET vide", () => {
  const lignes = lireCsv(w.fichierExportClubs([clubFictif({siret: ""})], new Date(2026, 10, 18)).contenu);
  assert.equal(lignes.length, 2);
  assert.equal(lignes[1][0], "");
  assert.equal(lignes[1][1], "Club Exemple");
});

test("un club sans nom est exporté avec la case Nom vide", () => {
  const lignes = lireCsv(w.fichierExportClubs([clubFictif({nom: ""})], new Date(2026, 10, 18)).contenu);
  assert.equal(lignes.length, 2);
  assert.equal(lignes[1][1], "");
  assert.equal(lignes[1][0], "12345678901234");
});

test("un club sans SIRET et sans nom, ni aucune autre information, donne une ligne de cinq cases vides", () => {
  const fichier = w.fichierExportClubs([{}], new Date(2026, 10, 18));
  assert.equal(fichier.nombre, 1);
  assert.deepEqual(lireCsv(fichier.contenu)[1], ["", "", "", "", ""]);
});

// ---------------------------------------------------------------------------
// 11. lignesExportClubs
// ---------------------------------------------------------------------------

test("lignesExportClubs garde l'ordre des clubs reçus, sans les retrier", () => {
  const clubs = [clubFictif({nom: "Zèbre"}), clubFictif({nom: "Alpha"}), clubFictif({nom: "Milan"})];
  assert.deepEqual(plain(w.lignesExportClubs(clubs)).map(ligne => ligne[1]), ["Zèbre", "Alpha", "Milan"]);
});

test("lignesExportClubs range les valeurs dans l'ordre SIRET, Nom, Adresse, Code postal, Ville", () => {
  assert.deepEqual(plain(w.lignesExportClubs([clubFictif()])), [["12345678901234", "Club Exemple", "1 rue de l'Exemple", "75001", "Villeexemple"]]);
});

test("lignesExportClubs sur une liste vide donne une liste vide", () => {
  assert.deepEqual(plain(w.lignesExportClubs([])), []);
});

// ---------------------------------------------------------------------------
// 12. nomFichierExport
// ---------------------------------------------------------------------------

test("nomFichierExport donne clubs-insertion-sport-2026-11-18.csv pour le 18 novembre 2026", () => {
  assert.equal(w.nomFichierExport(w.EXPORT_CLUBS_PREFIXE_FICHIER, new Date(2026, 10, 18)), "clubs-insertion-sport-2026-11-18.csv");
});

test("nomFichierExport complète par un zéro le mois et le jour à un chiffre (2026-01-05)", () => {
  assert.equal(w.nomFichierExport(w.EXPORT_CLUBS_PREFIXE_FICHIER, new Date(2026, 0, 5)), "clubs-insertion-sport-2026-01-05.csv");
});

test("nomFichierExport utilise le préfixe reçu et l'extension .csv", () => {
  assert.equal(w.EXPORT_EXTENSION_FICHIER, ".csv");
  assert.equal(w.nomFichierExport("autre-prefixe", new Date(2026, 11, 31)), "autre-prefixe-2026-12-31.csv");
});

// ---------------------------------------------------------------------------
// 13. fichierExportClubs
// ---------------------------------------------------------------------------

test("fichierExportClubs donne un nom, un contenu et un nombre cohérents avec les clubs reçus", () => {
  const clubs = [clubFictif({nom: "Alpha", codePostal: "01000"}), clubFictif({nom: "Beta"}), clubFictif({nom: "Gamma"})];
  const fichier = w.fichierExportClubs(clubs, new Date(2026, 10, 18));
  assert.equal(fichier.nom, "clubs-insertion-sport-2026-11-18.csv");
  assert.equal(fichier.nombre, 3);
  const lignes = lireCsv(fichier.contenu);
  assert.equal(lignes.length, 1 + 3);
  assert.deepEqual(lignes.slice(1).map(ligne => ligne[1]), ["Alpha", "Beta", "Gamma"]);
  assert.ok(fichier.contenu.startsWith(BOM));
});

test("fichierExportClubs sans aucun club donne seulement la ligne d'en-têtes et un nombre de 0", () => {
  const fichier = w.fichierExportClubs([], new Date(2026, 10, 18));
  assert.equal(fichier.nombre, 0);
  assert.equal(lireCsv(fichier.contenu).length, 1);
});

test("fichierExportClubs sans argument exporte les clubs affichés après les filtres", () => {
  const w2 = loadClubs();
  const resultat = w2.fichierExportClubs();
  assert.equal(resultat.nombre, w2.filteredClubs().length);
  assert.match(resultat.nom, /^clubs-insertion-sport-\d{4}-\d{2}-\d{2}\.csv$/);
});

// ===========================================================================
// Sprint E8, tache E8-7 : fichier « Contacts »
// ===========================================================================

const ENTETES_CONTACTS = ["SIRET", "Nom du club", "Nom", "Prénom", "Fonction", "E-mail", "Téléphone"];
const DATE_FIXE = new Date(2026, 10, 18);

const clubContacts = (id, surcharge = {}) => ({id, siret: `1234567890123${id}`, nom: `Club ${id}`, ...surcharge});

const contactFictif = (club, surcharge = {}) => ({
  id: 1,
  Club: club,
  Nom: "Dupont",
  Prenom: "Alice",
  Fonction: "Présidente",
  Email: "alice@exemple.fr",
  Telephone: "01 02 03 04 05",
  ...surcharge,
});

// Un contact numerote automatiquement, pour ne pas repeter les identifiants.
let compteurContact = 100;
const contact = (club, surcharge = {}) => contactFictif(club, {id: ++compteurContact, ...surcharge});

// Lignes de donnees (sans l'en-tete) du fichier Contacts pour des donnees fictives.
function lignesFichierContacts(clubs, contacts) {
  const fichier = w.fichierExportContacts(clubs, DATE_FIXE, {Contacts: contacts}, []);
  return lireCsv(fichier.contenu).slice(1);
}

test("les en-têtes du fichier contacts sont exactement SIRET, Nom du club, Nom, Prénom, Fonction, E-mail, Téléphone, dans cet ordre", () => {
  assert.deepEqual(plain(w.EXPORT_CONTACTS_ENTETES), ENTETES_CONTACTS);
  const fichier = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: []}, []);
  assert.deepEqual(lireCsv(fichier.contenu)[0], ENTETES_CONTACTS);
});

test("un club avec 3 contacts donne 3 lignes, chacune avec le SIRET et le nom du club", () => {
  const club = clubContacts(1);
  const lignes = lignesFichierContacts([club], [
    contact(1, {Nom: "Alpha"}), contact(1, {Nom: "Beta"}), contact(1, {Nom: "Gamma"}),
  ]);
  assert.equal(lignes.length, 3);
  lignes.forEach(ligne => {
    assert.equal(ligne[0], club.siret); // SIRET en chiffres : valeur telle quelle
    assert.equal(ligne[1], "Club 1");
  });
});

test("un club sans contact donne exactement 1 ligne : SIRET et nom remplis, les 5 champs du contact vides", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], []);
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0].length, 7);
  assert.equal(lignes[0][0], "12345678901231");
  assert.equal(lignes[0][1], "Club 1");
  assert.deepEqual(lignes[0].slice(2), ["", "", "", "", ""]);
});

test("un contact d'un autre club (hors filtre) n'apparaît pas dans le fichier", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], [
    contact(1, {Nom: "Présent"}), contact(2, {Nom: "Absent"}),
  ]);
  assert.deepEqual(lignes.map(ligne => ligne[2]), ["Présent"]);
});

test("un contact dont le club n'existe pas n'apparaît pas dans le fichier", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], [
    contact(1, {Nom: "Présent"}), contact(999, {Nom: "Orphelin"}), contact(0, {Nom: "SansClub"}), contact(null, {Nom: "ClubVide"}),
  ]);
  assert.deepEqual(lignes.map(ligne => ligne[2]), ["Présent"]);
});

test("les clubs sont exportés dans l'ordre reçu, sans être retriés", () => {
  const lignes = lignesFichierContacts(
    [clubContacts(3, {nom: "Zèbre"}), clubContacts(1, {nom: "Alpha"}), clubContacts(2, {nom: "Milieu"})],
    [contact(1, {Nom: "A"}), contact(2, {Nom: "B"}), contact(3, {Nom: "C"})]
  );
  assert.deepEqual(lignes.map(ligne => ligne[1]), ["Zèbre", "Alpha", "Milieu"]);
});

test("les contacts d'un même club sont triés par nom, puis par prénom, comme dans la fiche", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], [
    contact(1, {Nom: "Martin", Prenom: "Zoé"}),
    contact(1, {Nom: "Durand", Prenom: "Paul"}),
    contact(1, {Nom: "Martin", Prenom: "Adam"}),
    contact(1, {Nom: "Bernard", Prenom: "Léa"}),
  ]);
  assert.deepEqual(lignes.map(ligne => `${ligne[2]} ${ligne[3]}`), ["Bernard Léa", "Durand Paul", "Martin Adam", "Martin Zoé"]);
});

test("quand la table Contacts est illisible, fichierExportContacts renvoie exactement {refus: 'droits'}", () => {
  const resultat = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: [contact(1)]}, ["Contacts"]);
  assert.deepEqual(plain(resultat), {refus: "droits"});
  assert.equal(w.EXPORT_REFUS_DROITS, "droits");
  assert.equal(w.EXPORT_TABLE_CONTACTS, "Contacts");
  assert.equal("nom" in resultat, false);
  assert.equal("contenu" in resultat, false);
});

test("quand Contacts est illisible, il n'y a aucune exception et rien n'est écrit dans la console", () => {
  const appels = [];
  const originaux = {};
  ["log", "warn", "error", "info"].forEach(nom => {
    originaux[nom] = w.console[nom];
    w.console[nom] = (...args) => appels.push([nom, ...args]);
  });
  try {
    assert.doesNotThrow(() => w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: [contact(1)]}, ["Contacts", "Actions"]));
  } finally {
    Object.assign(w.console, originaux);
  }
  assert.deepEqual(appels, []);
});

test("une autre table illisible que Contacts ne bloque pas l'export des contacts", () => {
  const resultat = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: [contact(1)]}, ["Actions"]);
  assert.equal(resultat.refus, undefined);
  assert.equal(resultat.nombre, 1);
});

test("téléphone en chiffres seuls : valeur telle quelle, qui garde le zéro initial", () => {
  const fichier = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: [contact(1, {Telephone: "0102030405"})]}, []);
  assert.ok(fichier.contenu.endsWith(`;"0102030405"`));
  assert.equal(lireCsv(fichier.contenu)[1][6], "0102030405");
});

test("téléphone commençant par + : apostrophe devant", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], [contact(1, {Telephone: "+33 1 02 03 04 05"})]);
  assert.equal(lignes[0][6], "'+33 1 02 03 04 05");
});

test("téléphone avec des espaces : texte normal, sans formule ni apostrophe", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], [contact(1, {Telephone: "01 02 03 04 05"})]);
  assert.equal(lignes[0][6], "01 02 03 04 05");
});

test("un SIRET ou un téléphone de contact commençant par = - @ reçoit une apostrophe", () => {
  ["=", "-", "@"].forEach(signe => {
    const lignes = lignesFichierContacts([clubContacts(1, {siret: `${signe}12345678901234`})], [contact(1, {Telephone: `${signe}0102030405`})]);
    assert.equal(lignes[0][0], `'${signe}12345678901234`);
    assert.equal(lignes[0][6], `'${signe}0102030405`);
  });
});

test("un nom, un prénom, une fonction ou un e-mail commençant par = + - @ reçoit une apostrophe", () => {
  ["=", "+", "-", "@"].forEach(signe => {
    const lignes = lignesFichierContacts([clubContacts(1)], [contact(1, {
      Nom: `${signe}Nom`, Prenom: `${signe}Prenom`, Fonction: `${signe}Fonction`, Email: `${signe}mail@exemple.fr`,
    })]);
    assert.deepEqual(lignes[0].slice(2, 6), [`'${signe}Nom`, `'${signe}Prenom`, `'${signe}Fonction`, `'${signe}mail@exemple.fr`]);
  });
});

test("les valeurs vides ou absentes d'un contact donnent des cellules vides, jamais « null » ni « undefined »", () => {
  const lignes = lignesFichierContacts([clubContacts(1)], [
    {id: 201, Club: 1, Nom: "Seul", Prenom: null, Fonction: undefined, Email: "", Telephone: null},
    {id: 202, Club: 1, Nom: "Zèbre"},
  ]);
  assert.equal(lignes.length, 2);
  assert.deepEqual(lignes[0].slice(2), ["Seul", "", "", "", ""]);
  assert.deepEqual(lignes[1].slice(2), ["Zèbre", "", "", "", ""]);
  const fichier = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: [{id: 201, Club: 1, Nom: "Seul"}]}, []);
  assert.doesNotMatch(fichier.contenu, /null|undefined/);
});

test("le nom du fichier contacts est contacts-clubs-insertion-sport-2026-11-18.csv pour le 18 novembre 2026", () => {
  assert.equal(w.EXPORT_CONTACTS_PREFIXE_FICHIER, "contacts-clubs-insertion-sport");
  const fichier = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: []}, []);
  assert.equal(fichier.nom, "contacts-clubs-insertion-sport-2026-11-18.csv");
});

test("2 clubs, dont un avec 3 contacts et un sans contact : nombre = 4 et nombreClubs = 2", () => {
  const fichier = w.fichierExportContacts([clubContacts(1), clubContacts(2)], DATE_FIXE, {
    Contacts: [contact(1), contact(1), contact(1)],
  }, []);
  assert.equal(fichier.nombre, 4);
  assert.equal(fichier.nombreClubs, 2);
  assert.equal(lireCsv(fichier.contenu).length, 1 + 4);
});

test("sans aucun club, le fichier contacts a seulement la ligne d'en-têtes, nombre = 0 et nombreClubs = 0", () => {
  const fichier = w.fichierExportContacts([], DATE_FIXE, {Contacts: [contact(1)]}, []);
  assert.equal(fichier.nombre, 0);
  assert.equal(fichier.nombreClubs, 0);
  assert.equal(fichier.contenu, `${BOM}${ENTETES_CONTACTS.map(e => `"${e}"`).join(";")}`);
});

test("le fichier contacts commence par le BOM, utilise le point-virgule et \\r\\n", () => {
  const fichier = w.fichierExportContacts([clubContacts(1)], DATE_FIXE, {Contacts: [contact(1), contact(1, {Nom: "Zed"})]}, []);
  assert.ok(fichier.contenu.startsWith(BOM));
  const sansBom = fichier.contenu.slice(1);
  const lignes = sansBom.split("\r\n");
  assert.equal(lignes.length, 3);
  lignes.forEach(ligne => assert.equal(ligne.split('";"').length, 7));
  assert.doesNotMatch(sansBom.replaceAll("\r\n", ""), /[\r\n]/);
  assert.ok(!sansBom.endsWith("\r\n"));
});

test("fichierExportContacts sans argument lit state.raw et state.unreadable", () => {
  const w2 = loadClubs();
  w2.state.raw = {Contacts: []};
  w2.state.unreadable = [];
  const resultat = w2.fichierExportContacts();
  assert.equal(resultat.nombre, w2.filteredClubs().length);
  assert.match(resultat.nom, /^contacts-clubs-insertion-sport-\d{4}-\d{2}-\d{2}\.csv$/);
  w2.state.unreadable = ["Contacts"];
  assert.deepEqual(plain(w2.fichierExportContacts()), {refus: "droits"});
});
