"use strict";

// Le widget « fiche club » ouvre une action en deposant une note dans le
// localStorage — partage, les deux widgets ayant la meme origine — puis en
// faisant naviguer la page vers le tableau de bord. Ces tests fixent le contrat
// de lecture : la cle, la duree de validite, et le fait que la note ne survive
// jamais a sa lecture.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const w = loadWidget();
const CLE = "clubs-ouvrir-action-v1";

function deposerNote(valeur) {
  w.localStorage.setItem(CLE, typeof valeur === "string" ? valeur : JSON.stringify(valeur));
}

function etatInitial() {
  w.localStorage.clear();
  w.state.actions = [{id: 7}, {id: 12}];
  w.state.view = "dashboard";
  w.state.editingId = null;
}

test("une note fraiche ouvre la fiche de l'action demandee", () => {
  etatInitial();
  deposerNote({actionId: 12, ts: Date.now()});

  w.ouvrirActionDemandee();

  assert.equal(w.state.view, "edit");
  assert.equal(w.state.editingId, 12);
  assert.equal(w.localStorage.getItem(CLE), null, "la note est consommee");
});

test("sans note, le tableau de bord s'affiche normalement", () => {
  etatInitial();

  w.ouvrirActionDemandee();

  assert.equal(w.state.view, "dashboard");
  assert.equal(w.state.editingId, null);
});

test("une note de plus de vingt secondes est ignoree", () => {
  etatInitial();
  // Le cas typique : l'utilisateur revient sur le tableau de bord bien plus tard,
  // par un signet ou l'historique. Rien ne doit se rouvrir.
  deposerNote({actionId: 12, ts: Date.now() - 21000});

  w.ouvrirActionDemandee();

  assert.equal(w.state.view, "dashboard");
  assert.equal(w.state.editingId, null);
  assert.equal(w.localStorage.getItem(CLE), null, "la note perimee est effacee malgre tout");
});

test("un identifiant inconnu ne fait rien et ne casse rien", () => {
  etatInitial();
  // Les regles d'acces peuvent masquer ici une action que le widget club montrait.
  deposerNote({actionId: 999, ts: Date.now()});

  assert.doesNotThrow(() => w.ouvrirActionDemandee());

  assert.equal(w.state.view, "dashboard");
  assert.equal(w.state.editingId, null);
  assert.equal(w.localStorage.getItem(CLE), null);
});

test("une note illisible est jetee sans interrompre le chargement", () => {
  etatInitial();
  deposerNote("{ceci n'est pas du JSON");

  assert.doesNotThrow(() => w.ouvrirActionDemandee());

  assert.equal(w.state.view, "dashboard");
  assert.equal(w.localStorage.getItem(CLE), null, "sinon elle resterait coincee dans le stockage");
});

test("une note sans identifiant utilisable est ignoree", () => {
  etatInitial();
  deposerNote({actionId: "douze", ts: Date.now()});

  w.ouvrirActionDemandee();

  assert.equal(w.state.view, "dashboard");
  assert.equal(w.state.editingId, null);
});
