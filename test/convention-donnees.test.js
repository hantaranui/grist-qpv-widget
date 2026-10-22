"use strict";

// La convention de partenariat lit trois tables en plus des autres : Contacts,
// Conventions et Modeles_convention. Ces tests fixent ce que load() en fait :
// leurs lignes arrivent dans state.raw, et une table refusee par les regles
// d'acces (profil ANS par exemple) devient une liste vide sans bloquer le reste,
// et sans que la console ne laisse fuiter une valeur de ligne.
// Donnees fictives uniquement (domaine exemple.fr).

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const TABLES_CONVENTION = ["Contacts", "Conventions", "Modeles_convention"];

// Format colonnes de Grist : {id: [...], Colonne: [...]}.
const DONNEES = {
  Actions: {id: [1], Intitule: ["Tournoi exemple"]},
  Contacts: {id: [1, 2], Email: ["alice.contact@exemple.fr", "bruno.contact@exemple.fr"]},
  Conventions: {id: [7], Annee: [2026], Representant_agence: ["Representant Fictif Exemple"]},
  Modeles_convention: {id: [3], Code: ["MOD-EXEMPLE-3"], Titre: ["Titre Fictif De Modele"]},
};

// Les objets crees dans le bac a sable n'ont pas le prototype de ceux du test :
// on compare leur contenu, pas leur identite.
const contenu = (valeur) => JSON.parse(JSON.stringify(valeur));

// Charge le widget avec ces tables, en refusant celles de `refusees`, et attend
// la fin du chargement de depart avant de rendre la main.
async function charger(refusees = []) {
  const journal = {log: [], warn: [], error: [], info: []};
  const ecrire = (niveau) => (...args) => journal[niveau].push(args.map(texte).join(" "));
  const console = {log: ecrire("log"), warn: ecrire("warn"), error: ecrire("error"), info: ecrire("info")};

  // L'erreur de refus ne cite volontairement ni table ni valeur : le nom de la
  // table dans la console ne peut donc venir que du widget.
  const fetchTable = (nom) => (refusees.includes(nom)
    ? Promise.reject(new Error("403 Forbidden"))
    : Promise.resolve(DONNEES[nom] || {id: []}));

  const w = loadWidget({fetchTable, console});
  // Avant le premier await de load(), state.actions est encore la liste de depart.
  const depart = w.state.actions;
  await attendre(() => w.state.actions !== depart || journal.error.length > 0);
  return {w, journal};
}

function texte(valeur) {
  if (valeur instanceof Error) return `${valeur.name}: ${valeur.message}\n${valeur.stack || ""}`;
  if (typeof valeur === "string") return valeur;
  try { return JSON.stringify(valeur); } catch (erreur) { return String(valeur); }
}

async function attendre(condition) {
  for (let i = 0; i < 500; i++) {
    if (condition()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error("le chargement de depart ne s'est pas termine");
}

for (const table of TABLES_CONVENTION) {
  test(`${table} : les lignes lues se retrouvent dans state.raw`, async () => {
    const {w, journal} = await charger();

    assert.equal(journal.error.length, 0, "aucune erreur de chargement");
    assert.equal(w.state.raw[table].length, DONNEES[table].id.length);
    assert.deepEqual(contenu(w.state.raw[table][0]), {
      id: DONNEES[table].id[0],
      ...Object.fromEntries(Object.keys(DONNEES[table]).filter((c) => c !== "id").map((c) => [c, DONNEES[table][c][0]])),
    });
  });
}

for (const table of TABLES_CONVENTION) {
  test(`${table} refusee : liste vide, et les autres tables (dont Actions) sont quand meme lues`, async () => {
    const {w, journal} = await charger([table]);

    assert.equal(journal.error.length, 0, "le refus d'une table ne fait pas echouer le chargement");
    assert.deepEqual(contenu(w.state.raw[table]), []);
    for (const autre of TABLES_CONVENTION.filter((t) => t !== table)) {
      assert.equal(w.state.raw[autre].length, DONNEES[autre].id.length, `${autre} est lue`);
    }
    assert.equal(w.state.raw.Actions.length, 1, "Actions est lue");
    assert.equal(w.state.actions.length, 1, "les actions sont construites");
  });
}

test("les 3 tables refusees ensemble (profil ANS) : le chargement se termine sans erreur", async () => {
  const {w, journal} = await charger(TABLES_CONVENTION);

  assert.equal(journal.error.length, 0, "aucune erreur de chargement");
  for (const table of TABLES_CONVENTION) {
    assert.deepEqual(contenu(w.state.raw[table]), [], `${table} est vide`);
  }
  assert.equal(w.state.raw.Actions.length, 1, "Actions est lue");
  assert.equal(w.state.actions.length, 1, "le tableau de bord se construit");
  assert.equal(Object.keys(w.state.raw).length, w.TABLES.length, "toutes les tables ont une entree");
});

for (const table of TABLES_CONVENTION) {
  test(`${table} refusee : la console cite le nom de la table et aucune valeur de ligne`, async () => {
    const {journal} = await charger([table]);

    const messages = journal.warn.filter((message) => message.includes(table));
    assert.equal(messages.length, 1, "un message d'avertissement cite la table refusee");
    for (const autre of TABLES_CONVENTION.filter((t) => t !== table)) {
      assert.ok(!messages[0].includes(autre), `le message ne cite pas ${autre}`);
    }

    const tout = Object.values(journal).flat().join("\n");
    assert.ok(!tout.includes("exemple.fr"), "aucun e-mail fictif dans la console");
    assert.ok(!tout.includes("Representant Fictif Exemple"), "aucun representant d'agence fictif dans la console");
    assert.ok(!tout.includes("Titre Fictif De Modele"), "aucun titre de modele fictif dans la console");
  });
}

test("les 3 tables refusees : la console ne contient aucune valeur de ligne", async () => {
  const {journal} = await charger(TABLES_CONVENTION);

  const tout = Object.values(journal).flat().join("\n");
  for (const table of TABLES_CONVENTION) {
    assert.ok(tout.includes(table), `${table} est citee`);
  }
  assert.ok(!tout.includes("exemple.fr"), "aucun e-mail fictif dans la console");
});
