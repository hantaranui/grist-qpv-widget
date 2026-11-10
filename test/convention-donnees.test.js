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

// ---- Tache 3.4 : etat du bloc Convention et blocage de la generation ----
// conventionEtat et conventionBlocage sont pures : on leur passe { raw, tablesRefusees }
// construit a la main, au meme format que state (lignes sous forme d'objets avec id).
// Donnees fictives, avec uniquement les vrais noms de colonnes.

const {conventionEtat, conventionBlocage} = loadWidget();

const ETATS = {
  aGenerer: "À générer",
  generee: "Générée",
  signee: "Signée",
  sansModele: "Sans modèle",
  droits: "Droits insuffisants",
};

const MESSAGES = {
  agence: "Renseignez l'agence de l'action dans sa fiche.",
  club: "Renseignez le club de l'action.",
  dispositif: "Renseignez le dispositif de l'action dans sa fiche.",
  adresse: "Renseignez l'adresse du club dans sa fiche.",
};

const PIECE = ["L", 41];

// Un jeu de donnees complet : action 1 (agence 2, club 3, dispositif 4), club avec
// adresse complete, un modele actif pour le dispositif 4, aucune convention.
// `modifs` remplace des tables entieres ; `action` et `club` modifient leur ligne.
function donnees({action = {}, club = {}, ...modifs} = {}, refusees = []) {
  return {
    raw: {
      Actions: [{id: 1, Agence: 2, Club: 3, Dispositif: 4, ...action}],
      Structures: [{id: 3, Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Ville-Exemple", ...club}],
      Conventions: [],
      Modeles_convention: [{id: 5, Dispositif: 4, Actif: true}],
      ...modifs,
    },
    tablesRefusees: refusees,
  };
}

// --- Les 5 etats ---

test("etat A generer : modele actif pour le dispositif et aucune convention", () => {
  const resultat = conventionEtat(1, donnees());

  assert.equal(resultat.etat, ETATS.aGenerer);
  assert.equal(resultat.convention, null);
  assert.equal(resultat.modele.id, 5);
});

test("etat Generee : PDF_genere rempli", () => {
  const d = donnees({Conventions: [{id: 7, Action: 1, Modele: 5, PDF_genere: PIECE, PDF_signe: null}]});
  const resultat = conventionEtat(1, d);

  assert.equal(resultat.etat, ETATS.generee);
  assert.equal(resultat.convention.id, 7);
  assert.equal(resultat.modele.id, 5);
});

test("etat Signee : PDF_signe rempli", () => {
  const d = donnees({Conventions: [{id: 7, Action: 1, Modele: 5, PDF_genere: null, PDF_signe: PIECE}]});
  const resultat = conventionEtat(1, d);

  assert.equal(resultat.etat, ETATS.signee);
  assert.equal(resultat.convention.id, 7);
});

test("etat Sans modele : aucun modele pour le dispositif", () => {
  const resultat = conventionEtat(1, donnees({Modeles_convention: []}));

  assert.equal(resultat.etat, ETATS.sansModele);
  assert.equal(resultat.modele, null);
});

test("etat Sans modele : un modele existe pour le dispositif mais Actif est faux", () => {
  const resultat = conventionEtat(1, donnees({Modeles_convention: [{id: 5, Dispositif: 4, Actif: false}]}));

  assert.equal(resultat.etat, ETATS.sansModele);
  assert.equal(resultat.modele, null);
});

test("etat Sans modele : le seul modele actif est celui d'un autre dispositif", () => {
  const resultat = conventionEtat(1, donnees({Modeles_convention: [{id: 5, Dispositif: 99, Actif: true}]}));

  assert.equal(resultat.etat, ETATS.sansModele);
});

test("etat Droits insuffisants : Conventions refusee", () => {
  const resultat = conventionEtat(1, donnees({}, ["Conventions"]));

  assert.deepEqual(contenu(resultat), {etat: ETATS.droits, convention: null, modele: null});
});

test("etat Droits insuffisants : Modeles_convention refusee", () => {
  const resultat = conventionEtat(1, donnees({}, ["Modeles_convention"]));

  assert.deepEqual(contenu(resultat), {etat: ETATS.droits, convention: null, modele: null});
});

test("etat Droits insuffisants : une autre table refusee ne le declenche pas", () => {
  const resultat = conventionEtat(1, donnees({}, ["Contacts"]));

  assert.equal(resultat.etat, ETATS.aGenerer);
});

// --- Pieces jointes ---

test("Signee l'emporte sur Generee quand les deux pieces jointes sont remplies", () => {
  const d = donnees({Conventions: [{id: 7, Action: 1, Modele: 5, PDF_genere: ["L", 41], PDF_signe: ["L", 42]}]});

  assert.equal(conventionEtat(1, d).etat, ETATS.signee);
});

test("piece jointe vide : null et ['L'] comptent comme vides pour PDF_genere", () => {
  for (const vide of [null, ["L"]]) {
    const d = donnees({Conventions: [{id: 7, Action: 1, Modele: 5, PDF_genere: vide, PDF_signe: null}]});
    const resultat = conventionEtat(1, d);

    assert.equal(resultat.etat, ETATS.aGenerer, `PDF_genere = ${JSON.stringify(vide)}`);
    assert.equal(resultat.convention.id, 7, "la convention (sans fichier) est quand meme renvoyee");
  }
});

test("piece jointe vide : null et ['L'] comptent comme vides pour PDF_signe", () => {
  for (const vide of [null, ["L"]]) {
    const d = donnees({Conventions: [{id: 7, Action: 1, Modele: 5, PDF_genere: PIECE, PDF_signe: vide}]});

    assert.equal(conventionEtat(1, d).etat, ETATS.generee, `PDF_signe = ${JSON.stringify(vide)}`);
  }
});

// --- Deux lignes Conventions pour la meme action ---

test("deux lignes Conventions pour la meme action (ids 9 et 7) : la ligne 7 est gardee", () => {
  const d = donnees({Conventions: [
    {id: 9, Action: 1, Modele: 5, PDF_genere: ["L", 90], PDF_signe: null},
    {id: 7, Action: 1, Modele: 5, PDF_genere: null, PDF_signe: ["L", 70]},
  ]});
  const resultat = conventionEtat(1, d);

  assert.equal(resultat.convention.id, 7);
  assert.equal(resultat.etat, ETATS.signee, "l'etat vient de la ligne 7, pas de la ligne 9");
});

test("une convention d'une autre action est ignoree", () => {
  const d = donnees({Conventions: [{id: 7, Action: 2, Modele: 5, PDF_genere: PIECE, PDF_signe: null}]});
  const resultat = conventionEtat(1, d);

  assert.equal(resultat.etat, ETATS.aGenerer);
  assert.equal(resultat.convention, null);
});

// --- Blocage : un test par element manquant ---

test("blocage agence : Agence vide", () => {
  const resultat = conventionBlocage(1, donnees({action: {Agence: 0}}));

  assert.deepEqual(contenu(resultat), {element: "agence", message: MESSAGES.agence});
});

test("blocage club : Club vide", () => {
  const resultat = conventionBlocage(1, donnees({action: {Club: 0}}));

  assert.deepEqual(contenu(resultat), {element: "club", message: MESSAGES.club});
});

test("blocage dispositif : Dispositif vide", () => {
  const resultat = conventionBlocage(1, donnees({action: {Dispositif: 0}}));

  assert.deepEqual(contenu(resultat), {element: "dispositif", message: MESSAGES.dispositif});
});

// --- Ordre des blocages et cas sans blocage ---

test("blocage dans l'ordre : action sans agence ni club, l'element renvoye est l'agence", () => {
  const resultat = conventionBlocage(1, donnees({action: {Agence: 0, Club: 0}}));

  assert.equal(resultat.element, "agence");
});

test("tout renseigne : aucun blocage (null)", () => {
  assert.equal(conventionBlocage(1, donnees()), null);
});

// --- state.tablesRefusees apres un chargement ---

test("state.tablesRefusees : apres un refus de Conventions, la liste contient Conventions et seulement ce nom", async () => {
  const {w} = await charger(["Conventions"]);

  assert.deepEqual(contenu(w.state.tablesRefusees), ["Conventions"]);
});

// ---- Evolution 1 : la table Campagnes (annee de la convention et sous-titre de la fenetre) ----

// Echoue si Campagnes sort de la liste TABLES (le sous-titre « Dispositif · Campagne 2026 » ne pourrait
// plus lire Actions.Campagne), si ses lignes n'arrivent plus dans state.raw, ou si son refus par les
// regles d'acces bloque le chargement, met le bloc Convention en « Droits insuffisants » (seules
// Conventions et Modeles_convention le font) ou laisse autre chose qu'une liste vide.
test("Campagnes : lue avec les autres tables ; refusée, elle devient une liste vide sans bloquer ni changer l'état du bloc", async () => {
  const lue = await charger();
  assert.ok(lue.w.TABLES.includes("Campagnes"), "Campagnes est dans TABLES");
  assert.equal(lue.journal.error.length, 0);

  const refusee = await charger(["Campagnes"]);
  assert.deepEqual(contenu(refusee.w.state.raw.Campagnes), [], "liste vide");
  assert.ok(refusee.w.state.tablesRefusees.includes("Campagnes"), "signalée comme refusée");
  assert.equal(refusee.w.state.raw.Actions.length, 1, "le reste est chargé");
  const etat = refusee.w.conventionEtat(1, {raw: {Actions: [{id: 1, Dispositif: 4}], Modeles_convention: [{id: 5, Dispositif: 4, Actif: true}], Conventions: []}, tablesRefusees: refusee.w.state.tablesRefusees});
  assert.equal(etat.etat, "À générer", "un refus de Campagnes ne donne pas « Droits insuffisants »");
});
