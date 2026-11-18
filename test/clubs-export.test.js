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

test("une valeur de Nom, Adresse ou Ville qui commence par = + - @ reçoit une apostrophe devant", () => {
  for (const debut of ["=", "+", "-", "@"]) {
    for (const entete of ["Nom", "Adresse", "Ville"]) {
      assert.equal(w.celluleCsv(`${debut}SOMME(A1)`, entete), `"'${debut}SOMME(A1)"`, `${entete} commençant par ${debut}`);
    }
  }
});

test("une valeur qui commence par une tabulation ou un retour chariot reçoit une apostrophe devant", () => {
  assert.equal(w.celluleCsv("\tabc", "Nom"), `"'\tabc"`);
  assert.equal(w.celluleCsv("\rabc", "Adresse"), `"'\rabc"`);
});

test("l'anti-formule s'applique aussi à travers le fichier clubs complet", () => {
  const club = clubFictif({nom: "=1+1", adresse: "+33 rue", ville: "@Ville"});
  const lignes = lireCsv(w.fichierExportClubs([club], new Date(2026, 10, 18)).contenu);
  assert.deepEqual(lignes[1].slice(1, 3), ["'=1+1", "'+33 rue"]);
  assert.equal(lignes[1][4], "'@Ville");
});

test("une valeur qui contient = + - @ ailleurs qu'au début n'est pas modifiée", () => {
  assert.equal(w.celluleCsv("Club a=b", "Nom"), '"Club a=b"');
  assert.equal(w.celluleCsv("Aix-en-Provence", "Ville"), '"Aix-en-Provence"');
  assert.equal(w.celluleCsv("contact@exemple.fr", "Nom"), '"contact@exemple.fr"');
});

// ---------------------------------------------------------------------------
// 5. Colonnes de chiffres : formule texte
// ---------------------------------------------------------------------------

test("les colonnes à chiffres sont SIRET, Code postal et Téléphone", () => {
  assert.deepEqual(plain(w.CSV_COLONNES_CHIFFRES), ["SIRET", "Code postal", "Téléphone"]);
});

test("une valeur faite uniquement de chiffres, dans SIRET, Code postal ou Téléphone, devient une formule texte", () => {
  assert.equal(w.celluleCsv("0102030405", "Téléphone"), '"=""0102030405"""');
  assert.equal(w.celluleCsv("01000", "Code postal"), '"=""01000"""');
  assert.equal(w.celluleCsv("12345678901234", "SIRET"), '"=""12345678901234"""');
});

test("un code postal 01000 garde son zéro dans le fichier", () => {
  const fichier = w.fichierExportClubs([clubFictif({codePostal: "01000"})], new Date(2026, 10, 18));
  assert.ok(fichier.contenu.includes('"=""01000"""'));
  assert.equal(lireCsv(fichier.contenu)[1][3], '="01000"');
});

test("un SIRET de 14 chiffres est conservé en entier dans le fichier", () => {
  const fichier = w.fichierExportClubs([clubFictif({siret: "00012345600017"})], new Date(2026, 10, 18));
  assert.equal(lireCsv(fichier.contenu)[1][0], '="00012345600017"');
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

test("un code postal reçu comme nombre 1000 ne plante pas et est écrit en formule texte (le zéro perdu n'est pas rendu)", () => {
  let cellule;
  assert.doesNotThrow(() => { cellule = w.celluleCsv(1000, "Code postal"); });
  assert.equal(cellule, '"=""1000"""');
});

test("un SIRET reçu comme nombre ne plante pas et est écrit en formule texte", () => {
  assert.equal(w.celluleCsv(12345678901234, "SIRET"), '"=""12345678901234"""');
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
  assert.equal(lignes[1][0], '="12345678901234"');
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
