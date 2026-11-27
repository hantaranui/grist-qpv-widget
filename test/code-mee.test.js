"use strict";

// Sprint E10, tâche 7 : tests de la partie DONNÉES du filtre et de la colonne Code MEE
// (tableau de bord). Les écrans (champ, case, colonne dans la liste) sont testés plus tard.
//
// Fonctions couvertes : codeMeeVide, filteredActions (clés 'mee' et 'meeVide'),
// restaurerFiltres, effacerFiltresGardes (bouton Réinitialiser), comparerActionsParCodeMee
// (via le tri), restaurerTri et exportCsv.
//
// Le script lance load() tout seul au chargement : chaque test appelle demarrer(), qui
// fabrique le widget avec un faux sessionStorage et des données fictives, puis ATTEND le
// premier affichage des filtres (fin du chargement de départ) avant de vérifier.
// Tout est fictif : aucun vrai nom, aucun vrai code.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget, makeElement} = require("./helpers/widget.js");

const DOC = "Document fictif MEE";
const CLE_FILTRES = "dashboard-filtres-v1:" + DOC;
const CLE_TRI = "dashboard-tri-v1:" + DOC;

// Les objets fabriques dans le bac a sable n'ont pas le prototype de l'hote :
// on les ramene a des valeurs simples avant de comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

// Tables fictives autour des actions. Avec sansColonne: true, la colonne Code_MEE
// n'existe pas (document sans cette colonne).
function tables(actions, {sansColonne = false} = {}) {
  const colonnes = {
    id: actions.map((a) => a.id),
    Intitule: actions.map((a) => `Action ${a.id}`),
    DR: actions.map((a) => a.dr || 1),
    DD: actions.map((a) => a.dd || 1),
    Agence: actions.map((a) => a.agence || 1),
    Club: actions.map((a) => a.club || 1),
    Federation: actions.map(() => 1),
    Dispositif: actions.map(() => 1),
    Statut: actions.map((a) => a.statut || "Planifiée"),
  };
  if (!sansColonne) colonnes.Code_MEE = actions.map((a) => a.code);
  return {
    Actions: colonnes,
    DR: {id: [1, 2], Nom: ["Region Nord", "Region Sud"]},
    DD: {id: [1, 2], Nom: ["DD Alpha", "DD Beta"]},
    Agences: {id: [1, 2], Libelle_agence: ["AGENCE A1", "AGENCE B1"]},
    Federations: {id: [1], Nom: ["Fed Un"]},
    Structures: {id: [1, 2], Nom: ["Club Un", "Club Deux"]},
    Dispositifs: {id: [1], Dispositif: ["Dispositif Un"]},
  };
}

// Faux sessionStorage : garde ce qui est RÉELLEMENT écrit (texte brut), pour verifier le
// stockage et pas seulement l'etat en memoire.
function creerStockage(initial = {}) {
  const valeurs = new Map(Object.entries(initial).map(([cle, v]) => [cle, typeof v === "string" ? v : JSON.stringify(v)]));
  return {
    getItem: (cle) => (valeurs.has(cle) ? valeurs.get(cle) : null),
    setItem: (cle, valeur) => { valeurs.set(cle, String(valeur)); },
    removeItem: (cle) => { valeurs.delete(cle); },
    cles: () => [...valeurs.keys()],
    lire: (cle) => (valeurs.has(cle) ? JSON.parse(valeurs.get(cle)) : undefined),
  };
}

// Construit le widget et attend son premier affichage des filtres (fin du chargement).
async function demarrer(donnees, {stockage = creerStockage()} = {}) {
  const elements = new Map();

  const resetBtn = makeElement();
  let clicReset = null;
  resetBtn.addEventListener = (type, fonction) => { if (type === "click") clicReset = fonction; };
  elements.set("resetBtn", resetBtn);

  const conteneur = makeElement();
  let premierAffichage;
  const attente = new Promise((resolve) => { premierAffichage = resolve; });
  Object.defineProperty(conteneur, "innerHTML", {
    get: () => "",
    set: () => { premierAffichage(); },
  });
  elements.set("filters", conteneur);

  const w = loadWidget({
    elements,
    sessionStorage: stockage,
    getDocName: () => Promise.resolve(DOC),
    fetchTable: (nom) => Promise.resolve(donnees[nom] || {id: []}),
  });

  // Garde-fou : le test echoue proprement si le widget n'affiche jamais ses filtres.
  let minuteur;
  const delai = new Promise((_, rejeter) => { minuteur = setTimeout(() => rejeter(new Error("le widget n'a jamais affiché ses filtres")), 3000); });
  try { await Promise.race([attente, delai]); } finally { clearTimeout(minuteur); }

  return {
    w, stockage,
    filtres: () => plain(w.state.filters),
    tri: () => plain(w.state.sort),
    reinitialiser: () => clicReset(),
    // Numeros des actions gardees par les filtres, dans l'ordre du tri courant.
    ids: () => plain(w.filteredActions().map((action) => action.id)),
    filtrer: (filtres) => { w.state.filters = filtres; },
    trier: (direction) => { w.state.sort = {key: "codeMee", direction}; },
  };
}

// ---------------------------------------------------------------------------
// 1. codeMeeVide
// ---------------------------------------------------------------------------

test("codeMeeVide : absent, null, texte vide et espaces seuls sont vides", async () => {
  // Échoue si l'un de ces cas est pris pour un code (ou si la fonction ne coupe pas les espaces).
  const {w} = await demarrer(tables([{id: 1, code: "123456"}]));
  assert.equal(w.codeMeeVide(undefined), true, "absent");
  assert.equal(w.codeMeeVide(null), true, "null");
  assert.equal(w.codeMeeVide(""), true, "texte vide");
  assert.equal(w.codeMeeVide("   "), true, "espaces seuls");
  assert.equal(w.codeMeeVide(" \t "), true, "espaces et tabulation seuls");
});

test("codeMeeVide : « 123456 », « 012345 » et le nombre 0 ne sont pas vides", async () => {
  // Échoue si un code réel est pris pour vide (zéro de tête perdu, 0 pris pour « faux »).
  const {w} = await demarrer(tables([{id: 1, code: "123456"}]));
  assert.equal(w.codeMeeVide("123456"), false);
  assert.equal(w.codeMeeVide("012345"), false, "le zéro de tête compte");
  assert.equal(w.codeMeeVide(0), false, "le nombre 0 n'est pas vide");
  assert.equal(w.codeMeeVide(" 123456 "), false, "des espaces autour d'un code ne le rendent pas vide");
});

// ---------------------------------------------------------------------------
// 2 et 3. Filtre « code » et case « Sans code MEE »
// ---------------------------------------------------------------------------

const ACTIONS_FILTRE = [
  {id: 1, code: "123456", statut: "Planifiée"},
  {id: 2, code: "012345", statut: "Réalisée"},
  {id: 3, code: "", statut: "Planifiée"},
  {id: 4, code: "   ", statut: "Réalisée"},
  {id: 5, code: "ab12", statut: "Planifiée"},
  {id: 6, code: "AB12", statut: "Planifiée"},
  {id: 7, code: "  123456  ", statut: "Planifiée"},
];

test("filtre code : le code exact ne garde que l'action qui le porte", async () => {
  // Échoue si le filtre « contient » au lieu de « égal », ou ne filtre pas du tout.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({mee: "012345"});
  assert.deepEqual(t.ids(), [2]);
});

test("filtre code : les majuscules et minuscules sont ignorées des deux côtés", async () => {
  // Échoue si la comparaison tient compte de la casse (tapé ou enregistré).
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({mee: "AB12"});
  assert.deepEqual(t.ids(), [5, 6], "tapé en majuscules, trouve minuscules et majuscules");
  t.filtrer({mee: "ab12"});
  assert.deepEqual(t.ids(), [5, 6], "tapé en minuscules, trouve minuscules et majuscules");
});

test("filtre code : les espaces autour sont ignorés, côté tapé et côté enregistré", async () => {
  // Échoue si le code tapé ou le code enregistré n'est pas nettoyé de ses espaces.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({mee: "123456"});
  assert.deepEqual(t.ids(), [1, 7], "le code enregistré « 123456 » avec espaces est trouvé");
  t.filtrer({mee: "   123456   "});
  assert.deepEqual(t.ids(), [1, 7], "le code tapé avec espaces est trouvé");
});

test("filtre code : « 12345 » ne trouve ni « 123456 » ni « 012345 »", async () => {
  // Échoue si le filtre devient « contient » ou « commence par » : la recherche doit être exacte.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({mee: "12345"});
  assert.deepEqual(t.ids(), []);
});

test("filtre code : un code tapé fait d'espaces seuls ne filtre rien", async () => {
  // Échoue si les espaces seuls gardent seulement les actions sans code (ou aucune action).
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({mee: "     "});
  assert.deepEqual(t.ids(), [1, 2, 3, 4, 5, 6, 7]);
});

test("case « Sans code MEE » : ne garde que les actions sans code, espaces seuls compris", async () => {
  // Échoue si la case ne filtre pas, ou oublie les codes faits d'espaces seuls.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({meeVide: "oui"});
  assert.deepEqual(t.ids(), [3, 4]);
});

test("case « Sans code MEE » cochée avec un code tapé : la case l'emporte", async () => {
  // Échoue si le code tapé s'applique quand même (résultat vide ou action avec code).
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({meeVide: "oui", mee: "123456"});
  assert.deepEqual(t.ids(), [3, 4]);
});

test("case « Sans code MEE » combinée en « et » avec le filtre Statut", async () => {
  // Échoue si la case annule les autres filtres, ou si les autres filtres annulent la case.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({meeVide: "oui", statut: "Planifiée"});
  assert.deepEqual(t.ids(), [3], "sans code ET Planifiée : seule l'action 3 (la 4 est Réalisée)");
});

test("filtre code combiné en « et » avec le filtre Statut", async () => {
  // Échoue si le code exact ignore les autres filtres.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.filtrer({mee: "012345", statut: "Planifiée"});
  assert.deepEqual(t.ids(), [], "012345 est Réalisée : rien ne correspond aux deux filtres");
  t.filtrer({mee: "012345", statut: "Réalisée"});
  assert.deepEqual(t.ids(), [2]);
});

// ---------------------------------------------------------------------------
// 4. Conservation pendant la session et Réinitialiser
// ---------------------------------------------------------------------------

const DONNEES_SESSION = tables([{id: 1, code: "123456"}, {id: 2, code: ""}]);

test("conservation : « mee » est restauré nettoyé de ses espaces, en mémoire ET dans le stockage", async () => {
  // Échoue si le code est restauré avec ses espaces ou n'est pas réécrit nettoyé dans sessionStorage.
  const stockage = creerStockage({[CLE_FILTRES]: {mee: "  123456  "}});
  const t = await demarrer(DONNEES_SESSION, {stockage});
  assert.deepEqual(t.filtres(), {mee: "123456"});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {mee: "123456"});
});

test("conservation : un « mee » fait d'espaces seuls est ignoré", async () => {
  // Échoue si des espaces seuls sont restaurés comme un vrai code.
  const stockage = creerStockage({[CLE_FILTRES]: {mee: "     "}});
  const t = await demarrer(DONNEES_SESSION, {stockage});
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {});
});

test("conservation : « meeVide » est accepté seulement s'il vaut « oui »", async () => {
  // Échoue si une autre valeur (true, « non », 1, texte vide) rallume la case.
  const refuses = [true, "non", "true", 1, "", "OUI", null];
  for (const valeur of refuses) {
    const stockage = creerStockage({[CLE_FILTRES]: {meeVide: valeur}});
    const t = await demarrer(DONNEES_SESSION, {stockage});
    assert.deepEqual(t.filtres(), {}, `valeur refusée : ${JSON.stringify(valeur)}`);
    assert.deepEqual(stockage.lire(CLE_FILTRES), {}, `stockage nettoyé : ${JSON.stringify(valeur)}`);
  }
  const stockage = creerStockage({[CLE_FILTRES]: {meeVide: "oui"}});
  const t = await demarrer(DONNEES_SESSION, {stockage});
  assert.deepEqual(t.filtres(), {meeVide: "oui"});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {meeVide: "oui"});
});

test("conservation : « meeVide » et « mee » présents ensemble, seul « meeVide » est restauré", async () => {
  // Échoue si le code survit à côté de la case (les deux ne doivent jamais être gardés ensemble).
  const stockage = creerStockage({[CLE_FILTRES]: {meeVide: "oui", mee: "123456"}});
  const t = await demarrer(DONNEES_SESSION, {stockage});
  assert.deepEqual(t.filtres(), {meeVide: "oui"});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {meeVide: "oui"});
});

test("conservation : sans colonne Code_MEE, rien n'est restauré ni gardé dans le stockage", async () => {
  // Échoue si un filtre MEE gardé s'applique alors que la colonne n'existe pas.
  const stockage = creerStockage({[CLE_FILTRES]: {mee: "123456"}});
  const t1 = await demarrer(tables([{id: 1}, {id: 2}], {sansColonne: true}), {stockage});
  assert.deepEqual(t1.filtres(), {});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {}, "le code n'est plus dans le stockage");

  const stockage2 = creerStockage({[CLE_FILTRES]: {meeVide: "oui"}});
  const t2 = await demarrer(tables([{id: 1}, {id: 2}], {sansColonne: true}), {stockage: stockage2});
  assert.deepEqual(t2.filtres(), {});
  assert.deepEqual(stockage2.lire(CLE_FILTRES), {}, "la case n'est plus dans le stockage");
});

test("Réinitialiser efface « mee » en mémoire ET dans le stockage", async () => {
  // Échoue si le code survit au bouton, en mémoire ou dans sessionStorage.
  const stockage = creerStockage({[CLE_FILTRES]: {mee: "123456"}});
  const t = await demarrer(DONNEES_SESSION, {stockage});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {mee: "123456"}, "avant : bien écrit dans le stockage");
  t.reinitialiser();
  assert.deepEqual(t.filtres(), {});
  assert.equal(stockage.getItem(CLE_FILTRES), null, "après : plus rien dans le stockage");
  assert.deepEqual(t.ids(), [1, 2], "toutes les actions reviennent");
});

test("Réinitialiser efface « meeVide » en mémoire ET dans le stockage", async () => {
  // Échoue si la case reste cochée après le bouton, en mémoire ou dans sessionStorage.
  const stockage = creerStockage({[CLE_FILTRES]: {meeVide: "oui"}});
  const t = await demarrer(DONNEES_SESSION, {stockage});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {meeVide: "oui"}, "avant : bien écrit dans le stockage");
  assert.deepEqual(t.ids(), [2], "avant : seule l'action sans code");
  t.reinitialiser();
  assert.deepEqual(t.filtres(), {});
  assert.equal(stockage.getItem(CLE_FILTRES), null, "après : plus rien dans le stockage");
  assert.deepEqual(t.ids(), [1, 2], "toutes les actions reviennent");
});

// ---------------------------------------------------------------------------
// 5. Tri de la colonne MEE
// ---------------------------------------------------------------------------

// 2 et 5 portent le même code (« 9 ») : l'ordre d'origine doit être gardé entre elles.
const ACTIONS_TRI = [
  {id: 1, code: "10"},
  {id: 2, code: "9"},
  {id: 3, code: ""},
  {id: 4, code: "100"},
  {id: 5, code: "9"},
  {id: 6, code: "   "},
];

test("tri croissant : « 9 » avant « 10 » avant « 100 » (ordre numérique, pas alphabétique)", async () => {
  // Échoue si le tri est alphabétique (« 10 », « 100 », « 9 »).
  const t = await demarrer(tables(ACTIONS_TRI));
  t.trier("asc");
  assert.deepEqual(t.ids().slice(0, 4), [2, 5, 1, 4]);
});

test("tri décroissant : « 100 » avant « 10 » avant « 9 »", async () => {
  // Échoue si le sens décroissant n'inverse pas les codes.
  const t = await demarrer(tables(ACTIONS_TRI));
  t.trier("desc");
  assert.deepEqual(t.ids().slice(0, 4), [4, 1, 2, 5]);
});

test("tri : les actions sans code (vides et espaces seuls) restent en fin dans les deux sens", async () => {
  // Échoue si le sens décroissant remonte les actions sans code en tête.
  const t = await demarrer(tables(ACTIONS_TRI));
  t.trier("asc");
  assert.deepEqual(t.ids().slice(4), [3, 6], "croissant");
  t.trier("desc");
  assert.deepEqual(t.ids().slice(4), [3, 6], "décroissant");
});

test("tri : à code égal, l'ordre d'origine est gardé dans les deux sens", async () => {
  // Échoue si deux codes égaux sont permutés (tri instable ou départage arbitraire).
  const t = await demarrer(tables(ACTIONS_TRI));
  t.trier("asc");
  let ids = t.ids();
  assert.ok(ids.indexOf(2) < ids.indexOf(5), "croissant : 2 avant 5");
  t.trier("desc");
  ids = t.ids();
  assert.ok(ids.indexOf(2) < ids.indexOf(5), "décroissant : 2 avant 5");
});

test("tri : un code avec des lettres ne fait pas planter et toutes les actions restent présentes", async () => {
  // Échoue si le tri lève une erreur ou perd des actions face à un code comme « A12 ».
  const actions = [
    {id: 1, code: "10"}, {id: 2, code: "A12"}, {id: 3, code: ""}, {id: 4, code: "9"}, {id: 5, code: "B7"}, {id: 6, code: "12ab"},
  ];
  const t = await demarrer(tables(actions));
  for (const sens of ["asc", "desc"]) {
    t.trier(sens);
    const ids = t.ids();
    assert.deepEqual([...ids].sort(), [1, 2, 3, 4, 5, 6], `aucune action perdue (${sens})`);
    assert.equal(ids[ids.length - 1], 3, `l'action sans code reste en fin (${sens})`);
  }
});

test("tri MEE gardé : restauré quand la colonne Code_MEE existe", async () => {
  // Échoue si un tri MEE gardé est perdu au rechargement alors que la colonne existe.
  const stockage = creerStockage({[CLE_TRI]: {key: "codeMee", direction: "desc"}});
  const t = await demarrer(tables(ACTIONS_TRI), {stockage});
  assert.deepEqual(t.tri(), {key: "codeMee", direction: "desc"});
  assert.deepEqual(t.ids().slice(0, 4), [4, 1, 2, 5], "le tri restauré s'applique à la liste");
});

test("tri MEE gardé : ignoré et retiré du stockage quand la colonne Code_MEE est absente", async () => {
  // Échoue si le tri reste actif (ou dans le stockage) sans colonne Code_MEE.
  const stockage = creerStockage({[CLE_TRI]: {key: "codeMee", direction: "asc"}});
  const t = await demarrer(tables([{id: 1}, {id: 2}], {sansColonne: true}), {stockage});
  assert.deepEqual(t.tri(), {});
  assert.equal(stockage.getItem(CLE_TRI), null, "retiré du stockage");
});

// ---------------------------------------------------------------------------
// 6. Export CSV
// ---------------------------------------------------------------------------

// Lance l'export et renvoie le fichier lu : lignes de cellules (separateur « ; », cellules entre guillemets).
async function exporter(donnees, filtres = {}) {
  const t = await demarrer(donnees);
  let contenu = null;
  const global = t.w.globalThis;
  global.Blob = class { constructor(parties) { contenu = parties.join(""); } };
  global.URL = {createObjectURL: () => "blob:fictif", revokeObjectURL() {}};
  t.filtrer(filtres);
  t.w.exportCsv(t.w.filteredActions());
  assert.notEqual(contenu, null, "un fichier doit avoir été fabriqué");
  const sansBom = contenu.replace(/^﻿/, "");
  return sansBom.split("\n").map((ligne) => [...ligne.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replaceAll('""', '"')));
}

const ACTIONS_CSV = [
  {id: 1, code: "012345", agence: 1, dd: 1, dr: 1, club: 1},
  {id: 2, code: "", agence: 2, dd: 2, dr: 2, club: 2},
  {id: 3, code: "987654", agence: 2, dd: 2, dr: 2, club: 1},
];

test("export CSV : l'en-tête est Agence, DD, DR, MEE, Club quand la colonne existe", async () => {
  // Échoue si la colonne MEE manque, est mal placée ou mal nommée.
  const [entete] = await exporter(tables(ACTIONS_CSV));
  assert.deepEqual(entete.slice(0, 5), ["Agence", "DD", "DR", "MEE", "Club"]);
  assert.equal(entete.length, 17, "une colonne de plus qu'avant (16 + MEE)");
});

test("export CSV : sans colonne Code_MEE, pas de colonne MEE et l'en-tête est celui d'avant", async () => {
  // Échoue si MEE apparaît alors que la colonne n'existe pas, ou si une autre colonne a changé.
  const lignes = await exporter(tables(ACTIONS_CSV.map(({id}) => ({id})), {sansColonne: true}));
  assert.deepEqual(lignes[0], [
    "Agence", "DD", "DR", "Club", "Fédération", "Action", "Dispositif", "Participants", "Public",
    "Ville", "Statut", "Date", "Budget", "Montant cofinancé", "Financeurs", "Raison du refus",
  ]);
  lignes.forEach((ligne, i) => assert.equal(ligne.length, 16, `ligne ${i} : 16 cellules`));
});

test("export CSV : dans chaque ligne, le code MEE est sous l'en-tête MEE, sans décalage", async () => {
  // Échoue si la valeur MEE est décalée d'une colonne (sous DR ou sous Club).
  const [entete, ...lignes] = await exporter(tables(ACTIONS_CSV));
  const colonne = (nom) => entete.indexOf(nom);
  assert.equal(colonne("MEE"), 3);
  assert.equal(lignes.length, 3);
  const parAction = Object.fromEntries(lignes.map((ligne) => [ligne[colonne("Action")], ligne]));
  assert.equal(parAction["Action 1"][colonne("MEE")], "012345");
  assert.equal(parAction["Action 1"][colonne("Agence")], "AGENCE A1");
  assert.equal(parAction["Action 1"][colonne("DD")], "DD Alpha");
  assert.equal(parAction["Action 1"][colonne("DR")], "Region Nord");
  assert.equal(parAction["Action 1"][colonne("Club")], "Club Un", "le club suit le code");
  assert.equal(parAction["Action 3"][colonne("MEE")], "987654");
  assert.equal(parAction["Action 3"][colonne("Club")], "Club Un");
  assert.equal(parAction["Action 3"][colonne("DR")], "Region Sud");
  lignes.forEach((ligne) => assert.equal(ligne.length, entete.length, "autant de cellules que d'en-têtes"));
});

test("export CSV : « 012345 » est exporté tel quel, zéro compris, sans formule ni apostrophe", async () => {
  // Échoue si le zéro de tête est perdu, ou si le code est transformé (apostrophe, ="…").
  const [entete, ...lignes] = await exporter(tables(ACTIONS_CSV), {});
  const ligne = lignes.find((l) => l[entete.indexOf("Action")] === "Action 1");
  assert.equal(ligne[entete.indexOf("MEE")], "012345");
});

test("export CSV : un code vide donne une case vide, jamais un tiret", async () => {
  // Échoue si l'export écrit « — », « - » ou « non renseigné » pour une action sans code.
  const [entete, ...lignes] = await exporter(tables(ACTIONS_CSV));
  const ligne = lignes.find((l) => l[entete.indexOf("Action")] === "Action 2");
  assert.equal(ligne[entete.indexOf("MEE")], "");
  lignes.forEach((l) => assert.ok(!["—", "-", "–"].includes(l[entete.indexOf("MEE")]), "aucun tiret dans la colonne MEE"));
});

test("export CSV : le fichier suit le filtre « Sans code MEE » (seule l'action sans code est exportée)", async () => {
  // Échoue si l'export ignore le filtre MEE ou si la colonne MEE se décale avec une liste filtrée.
  const [entete, ...lignes] = await exporter(tables(ACTIONS_CSV), {meeVide: "oui"});
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0][entete.indexOf("Action")], "Action 2");
  assert.equal(lignes[0][entete.indexOf("MEE")], "");
});
