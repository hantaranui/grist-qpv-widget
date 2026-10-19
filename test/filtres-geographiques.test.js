"use strict";

// Filtres DR, DD et agence dependants : optionsFor(key) restreint les listes, et
// pruneGeoFilters() retire les choix qui ne sont plus proposes.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const w = loadWidget();

// Les tableaux fabriques dans le bac a sable n'ont pas le prototype Array de
// l'hote : deepStrictEqual les refuserait. On les ramene a des valeurs simples.
const plain = (value) => JSON.parse(JSON.stringify(value));

// Donnees fictives : deux DR, trois DD, quatre agences.
//   Region Nord : DD Alpha (agences AGENCE A1, AGENCE A2), DD Beta (AGENCE B1)
//   Region Sud  : DD Gamma (AGENCE C1)
function fictiveActions() {
  const base = {financeurs: []};
  return [
    {...base, id: 1, dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A1", federation: "Fed Un", statut: "Planifiée"},
    {...base, id: 2, dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A2", federation: "Fed Deux", statut: "Réalisée"},
    {...base, id: 3, dr: "Region Nord", dd: "DD Beta", agency: "AGENCE B1", federation: "Fed Un", statut: "Planifiée"},
    {...base, id: 4, dr: "Region Sud", dd: "DD Gamma", agency: "AGENCE C1", federation: "Fed Deux", statut: "A confirmer"},
  ];
}

function setup(filters = {}) {
  w.state.actions = fictiveActions();
  w.state.filters = {...filters};
}

const options = (key) => plain(w.optionsFor(key));

test("sans DR ni DD choisie, les listes DD et agence proposent toutes les valeurs", () => {
  setup();
  assert.deepEqual(options("dd"), ["DD Alpha", "DD Beta", "DD Gamma"]);
  assert.deepEqual(options("agency"), ["AGENCE A1", "AGENCE A2", "AGENCE B1", "AGENCE C1"]);
  assert.deepEqual(options("dr"), ["Region Nord", "Region Sud"]);
});

test("une DR choisie limite la liste des DD à celles de cette DR", () => {
  setup({dr: "Region Nord"});
  assert.deepEqual(options("dd"), ["DD Alpha", "DD Beta"]);
  setup({dr: "Region Sud"});
  assert.deepEqual(options("dd"), ["DD Gamma"]);
});

test("une DD choisie limite la liste des agences à celles de cette DD", () => {
  setup({dd: "DD Alpha"});
  assert.deepEqual(options("agency"), ["AGENCE A1", "AGENCE A2"]);
  setup({dd: "DD Beta"});
  assert.deepEqual(options("agency"), ["AGENCE B1"]);
});

test("une DR seule limite la liste des agences à celles de cette DR", () => {
  setup({dr: "Region Nord"});
  assert.deepEqual(options("agency"), ["AGENCE A1", "AGENCE A2", "AGENCE B1"]);
});

test("la liste des DR ne dépend ni de la DD ni de l'agence choisies", () => {
  setup({dd: "DD Alpha", agency: "AGENCE A1"});
  assert.deepEqual(options("dr"), ["Region Nord", "Region Sud"]);
});

test("un changement de DR retire la DD et l'agence qui n'en font plus partie", () => {
  setup({dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A1"});
  w.state.filters.dr = "Region Sud";
  w.pruneGeoFilters();
  assert.equal(w.state.filters.dd, undefined);
  assert.equal(w.state.filters.agency, undefined);
  assert.equal(w.state.filters.dr, "Region Sud");
});

test("un changement de DR garde la DD qui en fait toujours partie", () => {
  setup({dr: "Region Nord", dd: "DD Alpha"});
  w.state.filters.dr = "Region Nord";
  w.pruneGeoFilters();
  assert.equal(w.state.filters.dd, "DD Alpha");

  // Cas ou l'on passe de « aucune DR » a la DR de la DD déjà choisie.
  setup({dd: "DD Beta"});
  w.state.filters.dr = "Region Nord";
  w.pruneGeoFilters();
  assert.equal(w.state.filters.dd, "DD Beta");
});

test("une DD gardée conserve aussi son agence", () => {
  setup({dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A2"});
  w.pruneGeoFilters();
  assert.deepEqual(plain(w.state.filters), {dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A2"});
});

test("un changement de DD retire l'agence qui n'en fait plus partie", () => {
  setup({dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A1"});
  w.state.filters.dd = "DD Beta";
  w.pruneGeoFilters();
  assert.equal(w.state.filters.dd, "DD Beta");
  assert.equal(w.state.filters.agency, undefined);
});

test("un changement de DD garde l'agence qui en fait toujours partie", () => {
  setup({dd: "DD Alpha", agency: "AGENCE A1"});
  w.pruneGeoFilters();
  assert.equal(w.state.filters.agency, "AGENCE A1");
});

test("le nettoyage n'efface pas les autres filtres (fédération, statut)", () => {
  setup({dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A1", federation: "Fed Un", statut: "Planifiée"});
  w.state.filters.dr = "Region Sud";
  w.pruneGeoFilters();
  assert.deepEqual(plain(w.state.filters), {dr: "Region Sud", federation: "Fed Un", statut: "Planifiée"});
});

test("le nettoyage sans aucun filtre géographique ne change rien", () => {
  setup({federation: "Fed Deux"});
  w.pruneGeoFilters();
  assert.deepEqual(plain(w.state.filters), {federation: "Fed Deux"});
});
