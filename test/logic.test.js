"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const w = loadWidget();
const [FULLY, PARTLY, NONE] = w.FINANCEMENT_STATES;

// Les tableaux fabriques dans le bac a sable n'ont pas le prototype Array de
// l'hote : deepStrictEqual les refuserait. On les ramene a des valeurs simples.
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (actions) => plain(actions).map((action) => action.id);

function columnTable(rows) {
  const keys = [...new Set(rows.flatMap(Object.keys))].filter((key) => key !== "id");
  const table = {id: rows.map((row) => row.id)};
  keys.forEach((key) => { table[key] = rows.map((row) => row[key] ?? null); });
  return table;
}

function fixture() {
  return {
    Actions: [
      {id: 1, Intitule: "Créneaux d'aller-vers", Nom_complet: "ANS-26-0055-3 Créneaux d'aller-vers",
       Reponse_AAP: 10, Club: 1, Agence: 1, Budget: 2000, Jauge: 20, Ville: "Auch",
       Statut: "A confirmer", Public: ["L", "QPV", "Jeunes"]},
      {id: 2, Intitule: "Ensemble vers l'emploi", Nom_complet: "ANS-26-0409-1 Ensemble vers l'emploi",
       Reponse_AAP: 11, Club: 1, Agence: 1, Budget: 2500, Jauge: 15, Ville: "Évreux",
       Statut: "Réalisée", Public: ["L", "BRSA"]},
      // Sans reponse AAP ni nom complet : le widget doit retomber sur l'intitule.
      {id: 3, Intitule: "Action orpheline", Reponse_AAP: 0, Club: 1, Agence: 1,
       Budget: 1000, Jauge: 5, Ville: "", Statut: "Planifiée", Public: null},
    ],
    Reponses_AAP: [
      {id: 10, Numero_Action_Osiris: "ANS-26-0055-3"},
      {id: 11, Numero_Action_Osiris: "ANS-26-0409-1"},
    ],
    Cofinancements: [
      {id: 100, Action: 2, Financement: 1, Montant: 2500, Statut_Versement: "En cours"},
      {id: 101, Action: 3, Financement: 1, Montant: 400, Statut_Versement: ""},
    ],
    Financements: [{id: 1, Financeur: 1, Enveloppe: "Appel à projet 2026"}],
    Financeurs: [{id: 1, Nom: "France Travail"}],
    Structures: [{id: 1, Nom: "Rugby Club Auch"}],
    Agences: [{id: 1, Libelle_agence: "AUCH", DD: 0}],
    DD: [], DR: [], Dispositifs: [], Federations: [],
  };
}

function buildState() {
  const raw = fixture();
  w.state.raw = raw;
  w.state.actions = w.buildActions(raw);
  w.state.filters = {};
  w.state.sort = {};
  return plain(w.state.actions);
}

test("rows() convertit une table colonnes Grist en objets", () => {
  const table = columnTable([{id: 7, Nom: "a"}, {id: 8, Nom: "b"}]);
  assert.deepEqual(plain(w.rows(table)), [{id: 7, Nom: "a"}, {id: 8, Nom: "b"}]);
  assert.deepEqual(plain(w.rows({id: []})), []);
});

test("financementState applique la regle metier sur la jauge", () => {
  assert.equal(w.financementState(1000, 1000), FULLY, "jauge a 100%");
  assert.equal(w.financementState(1200, 1000), FULLY, "jauge au-dela de 100%");
  assert.equal(w.financementState(400, 1000), PARTLY, "jauge entre 0 et 100%");
  assert.equal(w.financementState(0, 1000), NONE, "jauge a 0%");
  assert.equal(w.financementState(0, 0), NONE, "ni budget ni financement");
  assert.equal(w.financementState(500, 0), FULLY, "finance sans budget : rien a lever");
});

test("normalizeText ignore casse et accents", () => {
  assert.equal(w.normalizeText("Évry-Courcouronnes"), "evry-courcouronnes");
  assert.equal(w.normalizeText(null), "");
});

test("withExistingValues ajoute les valeurs absentes de la configuration", () => {
  const merged = w.withExistingValues(["Planifiée"], ["Réalisée", "Planifiée", "", null]);
  assert.deepEqual(plain(merged), ["Planifiée", "Réalisée"]);
  assert.deepEqual(plain(w.withExistingValues(["a", "b"], [])), ["a", "b"]);
});

test("parseWidgetOptions tolere le vide et le JSON casse", () => {
  assert.deepEqual(plain(w.parseWidgetOptions('{"choices":["x"]}')), {choices: ["x"]});
  assert.deepEqual(plain(w.parseWidgetOptions("")), {});
  assert.deepEqual(plain(w.parseWidgetOptions("{pas du json")), {});
  assert.deepEqual(plain(w.parseWidgetOptions({choices: ["y"]})), {choices: ["y"]});
});

test("choiceValues retire le marqueur de liste de Grist", () => {
  assert.deepEqual(plain(w.choiceValues(["L", "QPV", "Jeunes"])), ["QPV", "Jeunes"]);
  assert.deepEqual(plain(w.choiceValues(null)), []);
  assert.equal(w.formatChoiceList(["L", "QPV", "Jeunes"]), "QPV, Jeunes");
});

test("buildActions expose le numero Osiris et le nom complet", () => {
  const [a1, , a3] = buildState();
  assert.equal(a1.osiris, "ANS-26-0055-3");
  assert.equal(a1.nomComplet, "ANS-26-0055-3 Créneaux d'aller-vers");
  assert.equal(a1.intitule, "Créneaux d'aller-vers", "l'intitule reste disponible tel quel");
  assert.equal(a3.osiris, "", "sans reponse AAP, pas de numero");
  assert.equal(a3.nomComplet, "Action orpheline", "sans nom complet, on retombe sur l'intitule");
});

test("buildActions lit la ville sur l'action, plus sur le club", () => {
  const [a1, a2, a3] = buildState();
  assert.equal(a1.ville, "Auch");
  assert.equal(a2.ville, "Évreux");
  assert.equal(a3.ville, "");
});

test("buildActions classe chaque action selon son financement", () => {
  const [a1, a2, a3] = buildState();
  assert.equal(a1.financement, NONE, "2000 € de budget, aucun cofinancement");
  assert.equal(a2.financement, FULLY, "2500 € couverts sur 2500 €");
  assert.equal(a3.financement, PARTLY, "400 € sur 1000 €");
});

test("optionsFor propose toujours les trois etats de financement, dans l'ordre", () => {
  buildState();
  assert.deepEqual(plain(w.optionsFor("financement")), [FULLY, PARTLY, NONE]);
});

test("optionsFor liste les valeurs presentes pour les autres filtres", () => {
  buildState();
  assert.deepEqual(plain(w.optionsFor("statut")), ["A confirmer", "Planifiée", "Réalisée"]);
  assert.deepEqual(plain(w.optionsFor("financeur")), ["Appel à projet 2026"]);
});

test("le filtre Numero Osiris accepte une partie du numero", () => {
  buildState();
  w.state.filters = {osiris: "0055"};
  assert.deepEqual(ids(w.filteredActions()), [1]);

  w.state.filters = {osiris: "ans-26"};
  assert.deepEqual(ids(w.filteredActions()), [1, 2], "insensible a la casse");

  w.state.filters = {osiris: "inconnu"};
  assert.deepEqual(ids(w.filteredActions()), []);
});

test("le filtre Financement selectionne les actions du bon etat", () => {
  buildState();
  w.state.filters = {financement: FULLY};
  assert.deepEqual(ids(w.filteredActions()), [2]);

  w.state.filters = {financement: PARTLY};
  assert.deepEqual(ids(w.filteredActions()), [3]);

  w.state.filters = {financement: NONE};
  assert.deepEqual(ids(w.filteredActions()), [1]);
});

test("le filtre Financeur porte sur les lignes de cofinancement", () => {
  buildState();
  w.state.filters = {financeur: "Appel à projet 2026"};
  assert.deepEqual(ids(w.filteredActions()), [2, 3]);
});

test("les filtres se cumulent", () => {
  buildState();
  w.state.filters = {financeur: "Appel à projet 2026", financement: PARTLY};
  assert.deepEqual(ids(w.filteredActions()), [3]);

  w.state.filters = {osiris: "ANS-26", financement: NONE};
  assert.deepEqual(ids(w.filteredActions()), [1]);
});

test("le tri de la colonne Action porte sur l'intitule, pas sur le nom complet", () => {
  buildState();
  w.state.sort = {key: "intitule", direction: "asc"};
  assert.deepEqual(plain(w.filteredActions()).map((a) => a.intitule),
    ["Action orpheline", "Créneaux d'aller-vers", "Ensemble vers l'emploi"]);

  w.state.sort = {key: "intitule", direction: "desc"};
  assert.deepEqual(ids(w.filteredActions()), [2, 1, 3]);
  w.state.sort = {};
});

test("les listes de secours couvrent les colonnes a choix du formulaire", () => {
  assert.deepEqual(plain(w.FALLBACK_CHOICES["Actions.Statut"]),
    ["A confirmer", "Planifiée", "Réalisée", "Annulée"]);
  assert.deepEqual(plain(w.FALLBACK_CHOICES["Actions.Format"]), ["Demi-journée", "Journée"]);
  assert.ok(w.FALLBACK_CHOICES["Actions.Public"].includes("QPV"));
});

test("le widget declare les tables dont il a besoin", () => {
  assert.ok(w.TABLES.includes("Reponses_AAP"), "necessaire au numero Osiris");
  assert.ok(!w.TABLES.includes("Communes"), "la commune du club ne sert plus");
});
