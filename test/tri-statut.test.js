"use strict";

// Tri a deux niveaux de la colonne Statut (Sprint E7, regles E7-1 a E7-5).
// Toutes les donnees sont fictives. Les dates sont des nombres (secondes), comme
// celles que Grist renvoie pour la colonne Date.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const w = loadWidget();

const ids = (actions) => Array.from(actions, (action) => action.id);

function trier(actions, key, direction) {
  w.state.sort = key ? {key, direction} : {};
  try {
    return ids(w.sortActions(actions));
  } finally {
    w.state.sort = {};
  }
}

const JOUR = 86400;
const D1 = 1000 * JOUR;
const D2 = 2000 * JOUR;
const D3 = 3000 * JOUR;

// Jeu melange. Ordre des lignes = ordre du tableau (utile pour les egalites).
const JEU = [
  {id: 1, intitule: "Zumba", statut: "Réalisée", date: D1},
  {id: 2, intitule: "Basket", statut: "Planifiée", date: D3},
  {id: 3, intitule: "Yoga", statut: "A confirmer", periodeApprox: "Mars 2027"},
  {id: 4, intitule: "Judo", statut: "Annulée"},
  {id: 5, intitule: "Tennis", statut: "Planifiée", date: D1},
  {id: 6, intitule: "Foot", statut: "Non retenue"},
  {id: 7, intitule: "Rugby", statut: "Réalisée", date: D3},
  {id: 8, intitule: "Danse", statut: "A confirmer", periodeApprox: "Avril 2027"},
  {id: 9, intitule: "Golf", statut: "Annulée"},
  {id: 10, intitule: "Natation", statut: "Planifiée", date: D2},
  {id: 11, intitule: "Boxe", statut: "Réalisée", date: D2},
  {id: 12, intitule: "Escrime", statut: "Non retenue"},
  {id: 13, intitule: "Volley", statut: "A confirmer", periodeApprox: "Janvier 2027"},
];

const sous = (statut) => JEU.filter((action) => action.statut === statut);

test("A-Z : les statuts sont rangés A confirmer, Annulée, Non retenue, Planifiée, Réalisée", () => {
  const resultat = trier(JEU, "statut", "asc");
  const statuts = resultat.map((id) => JEU.find((action) => action.id === id).statut);
  const sansDoublons = statuts.filter((statut, i) => statut !== statuts[i - 1]);
  assert.deepEqual(sansDoublons, ["A confirmer", "Annulée", "Non retenue", "Planifiée", "Réalisée"]);
  assert.equal(resultat.length, JEU.length);
});

test("A-Z, A confirmer : par période approximative de A à Z", () => {
  // Avril < Janvier < Mars dans l'ordre alphabétique (E7-9 : pas le calendrier)
  assert.deepEqual(trier(sous("A confirmer"), "statut", "asc"), [8, 13, 3]);
});

test("A-Z, Planifiée : la date la plus ancienne d'abord", () => {
  assert.deepEqual(trier(sous("Planifiée"), "statut", "asc"), [5, 10, 2]);
});

test("A-Z, Réalisée : la date la plus récente d'abord", () => {
  assert.deepEqual(trier(sous("Réalisée"), "statut", "asc"), [7, 11, 1]);
});

test("A-Z, jeu complet : résultat exact attendu", () => {
  assert.deepEqual(trier(JEU, "statut", "asc"), [8, 13, 3, 4, 9, 6, 12, 5, 10, 2, 7, 11, 1]);
});

test("Z-A : l'ordre des statuts, le sens des dates et l'ordre des périodes s'inversent", () => {
  assert.deepEqual(trier(JEU, "statut", "desc"), [1, 11, 7, 2, 10, 5, 6, 12, 4, 9, 3, 13, 8]);
});

test("Z-A, par statut : périodes de Z à A, Planifiée la plus récente d'abord, Réalisée la plus ancienne d'abord", () => {
  assert.deepEqual(trier(sous("A confirmer"), "statut", "desc"), [3, 13, 8]);
  assert.deepEqual(trier(sous("Planifiée"), "statut", "desc"), [2, 10, 5]);
  assert.deepEqual(trier(sous("Réalisée"), "statut", "desc"), [1, 11, 7]);
});

for (const [libelle, vide] of [["null", null], ["chaîne vide", ""], ["espaces seuls", "   "]]) {
  test(`Valeur vide (${libelle}) : l'action sans date ou sans période reste à la fin de son groupe, dans les deux sens`, () => {
    const planifiees = [
      {id: 1, statut: "Planifiée", date: vide},
      {id: 2, statut: "Planifiée", date: D2},
      {id: 3, statut: "Planifiée", date: D1},
    ];
    assert.deepEqual(trier(planifiees, "statut", "asc"), [3, 2, 1]);
    assert.deepEqual(trier(planifiees, "statut", "desc"), [2, 3, 1]);

    const realisees = [
      {id: 1, statut: "Réalisée", date: vide},
      {id: 2, statut: "Réalisée", date: D1},
      {id: 3, statut: "Réalisée", date: D2},
    ];
    assert.deepEqual(trier(realisees, "statut", "asc"), [3, 2, 1]);
    assert.deepEqual(trier(realisees, "statut", "desc"), [2, 3, 1]);

    const aConfirmer = [
      {id: 1, statut: "A confirmer", periodeApprox: vide},
      {id: 2, statut: "A confirmer", periodeApprox: "Mars 2027"},
      {id: 3, statut: "A confirmer", periodeApprox: "Avril 2027"},
    ];
    assert.deepEqual(trier(aConfirmer, "statut", "asc"), [3, 2, 1]);
    assert.deepEqual(trier(aConfirmer, "statut", "desc"), [2, 3, 1]);
  });
}

test("Valeur vide : une date absente (propriété manquante) reste aussi à la fin", () => {
  const actions = [
    {id: 1, statut: "Planifiée"},
    {id: 2, statut: "Planifiée", date: D1},
  ];
  assert.deepEqual(trier(actions, "statut", "asc"), [2, 1]);
  assert.deepEqual(trier(actions, "statut", "desc"), [2, 1]);
});

test("Valeurs vides à la fin de leur groupe sans gêner les autres statuts (jeu complet)", () => {
  const actions = [
    {id: 1, statut: "Réalisée", date: null},
    {id: 2, statut: "Planifiée", date: D1},
    {id: 3, statut: "Planifiée", date: ""},
    {id: 4, statut: "Réalisée", date: D1},
  ];
  assert.deepEqual(trier(actions, "statut", "asc"), [2, 3, 4, 1]);
  assert.deepEqual(trier(actions, "statut", "desc"), [4, 1, 2, 3]);
});

test("Annulée et Non retenue : l'ordre actuel des lignes est gardé, dans les deux sens", () => {
  const actions = [
    {id: 1, statut: "Non retenue", date: D3},
    {id: 2, statut: "Annulée", date: D1},
    {id: 3, statut: "Non retenue", date: D1},
    {id: 4, statut: "Annulée", date: D3},
    {id: 5, statut: "Annulée", date: D2},
  ];
  assert.deepEqual(trier(actions, "statut", "asc"), [2, 4, 5, 1, 3]);
  assert.deepEqual(trier(actions, "statut", "desc"), [1, 3, 2, 4, 5]);
});

test("Deux actions de même statut et même date : l'ordre actuel des lignes est gardé, dans les deux sens", () => {
  const actions = [
    {id: 1, statut: "Planifiée", date: D1},
    {id: 2, statut: "Planifiée", date: D1},
    {id: 3, statut: "Réalisée", date: D2},
    {id: 4, statut: "Réalisée", date: D2},
    {id: 5, statut: "A confirmer", periodeApprox: "Mars 2027"},
    {id: 6, statut: "A confirmer", periodeApprox: "Mars 2027"},
  ];
  assert.deepEqual(trier(actions, "statut", "asc"), [5, 6, 1, 2, 3, 4]);
  assert.deepEqual(trier(actions, "statut", "desc"), [3, 4, 1, 2, 5, 6]);
});

test("Statut inconnu : à la fin, dans les deux sens", () => {
  const actions = [
    {id: 1, statut: "Mystère", date: D1},
    {id: 2, statut: "Réalisée", date: D1},
    {id: 3, statut: "A confirmer", periodeApprox: "Mars 2027"},
    {id: 4, statut: "", date: D1},
    {id: 5, statut: "Autre"},
  ];
  assert.deepEqual(trier(actions, "statut", "asc"), [3, 2, 1, 4, 5]);
  assert.deepEqual(trier(actions, "statut", "desc"), [2, 3, 1, 4, 5]);
});

test("Anciennes écritures (annule, planifie, realise) : rangées avec leur statut", () => {
  const actions = [
    {id: 1, statut: "realise", date: D1},
    {id: 2, statut: "planifie", date: D1},
    {id: 3, statut: "annule"},
    {id: 4, statut: "Réalisée", date: D2},
    {id: 5, statut: "Planifiée", date: D2},
    {id: 6, statut: "Annulée"},
  ];
  // Annulées (3, 6), puis planifiées par date croissante (2, 5), puis réalisées par date décroissante (4, 1)
  assert.deepEqual(trier(actions, "statut", "asc"), [3, 6, 2, 5, 4, 1]);
  assert.deepEqual(trier(actions, "statut", "desc"), [1, 4, 5, 2, 3, 6]);
});

test("Autre clé de tri (intitulé) : A-Z garde le comportement d'avant", () => {
  const attendu = [...JEU]
    .sort((a, b) => a.intitule.localeCompare(b.intitule, "fr", {numeric: true}))
    .map((action) => action.id);
  assert.deepEqual(trier(JEU, "intitule", "asc"), attendu);
});

test("Autre clé de tri (intitulé) : Z-A garde le comportement d'avant", () => {
  const attendu = [...JEU]
    .sort((a, b) => -a.intitule.localeCompare(b.intitule, "fr", {numeric: true}))
    .map((action) => action.id);
  assert.deepEqual(trier(JEU, "intitule", "desc"), attendu);
});

test("Autre clé de tri (intitulé) : ne tient pas compte du statut ni de la date", () => {
  const actions = [
    {id: 1, intitule: "B", statut: "Réalisée", date: D1},
    {id: 2, intitule: "A", statut: "Planifiée", date: D3},
  ];
  assert.deepEqual(trier(actions, "intitule", "asc"), [2, 1]);
});

test("Tri vide (state.sort = {}) : la liste reste dans l'ordre d'origine", () => {
  assert.deepEqual(trier(JEU, null), JEU.map((action) => action.id));
});

test("Tri sans sens : la liste reste dans l'ordre d'origine", () => {
  assert.deepEqual(trier(JEU, "statut", undefined), JEU.map((action) => action.id));
});

test("Le tri ne modifie pas la liste d'origine", () => {
  const copie = JEU.map((action) => action.id);
  trier(JEU, "statut", "asc");
  trier(JEU, "statut", "desc");
  assert.deepEqual(JEU.map((action) => action.id), copie);
});
