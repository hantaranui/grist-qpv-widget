"use strict";

// Le bouton « Supprimer » de la fiche action ne retire jamais la ligne de Grist :
// il passe la colonne Corbeille a « Oui ». Ces tests fixent les deux fenetres
// (refus si financements, confirmation), l'ecriture envoyee, et le fait que les
// trois widgets ignorent ensuite les actions en corbeille.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");
const {loadFiche} = require("./helpers/fiche-club.js");
const {loadClubs} = require("./helpers/clubs.js");

const w = loadWidget();
const contenu = (valeur) => JSON.parse(JSON.stringify(valeur));

const financee = {id: 7, nomComplet: "Job dating", intitule: "Job dating", financeurs: [{id: 1, montant: 100}]};
const libre = {id: 8, nomComplet: "Coaching <b>", intitule: "Coaching", financeurs: []};

test("une action avec financements est refusee : message demande, bouton OK seul", () => {
  const html = w.deleteDialogHtml(financee);
  assert.ok(html.includes("Vous ne pouvez pas supprimer une action qui comporte des financements. Merci d'abord de supprimer les financements de cette action ?"));
  assert.match(html, /id="deleteOk"><span class="btn-content">OK<\/span>/);
  assert.ok(!html.includes("confirmDelete"));
});

test("sans financement, la confirmation nomme l'action en gras (echappee) avec Annuler et Valider", () => {
  const html = w.deleteDialogHtml(libre);
  assert.ok(html.includes("Êtes-vous sûr de vouloir supprimer l'action <strong>Coaching &lt;b&gt;</strong> ?"));
  assert.ok(html.indexOf('id="cancelDelete"') < html.indexOf('id="confirmDelete"'));
  assert.ok(!html.includes("deleteOk"));
});

test("Valider passe Corbeille a vrai sans supprimer la ligne, puis revient au tableau", async () => {
  w.state.view = "edit"; w.state.editingId = 8;
  w.openDeleteAction(libre);
  const appels = [];
  w.grist.docApi.applyUserActions = (actions) => { appels.push(actions); return Promise.resolve({}); };

  await w.confirmDeleteAction(libre);

  assert.deepEqual(contenu(appels), [[["UpdateRecord", "Actions", 8, {Corbeille: true}]]]);
  assert.equal(w.state.view, "dashboard");
  assert.equal(w.state.deleteOpen, false);
});

test("si l'ecriture echoue, la fenetre reste ouverte avec le message", async () => {
  w.state.view = "edit"; w.state.editingId = 8;
  w.openDeleteAction(libre);
  w.grist.docApi.applyUserActions = () => Promise.reject(new Error("Blocked"));

  await w.confirmDeleteAction(libre);

  assert.equal(w.document.getElementById("deleteActionMessage").querySelector(".alert-content").textContent, "La suppression n'a pas abouti : Blocked");
  assert.equal(w.state.deleteOpen, true);
  assert.equal(w.state.view, "edit");
  w.closeDeleteAction();
});

test("le tableau de bord ignore les actions en corbeille", () => {
  const actions = w.buildActions({
    Actions: [{id: 1, Intitule: "Visible"}, {id: 2, Intitule: "Supprimee", Corbeille: "Oui"}, {id: 3, Intitule: "Bool", Corbeille: true}, {id: 4, Intitule: "Non", Corbeille: "Non"}],
    Cofinancements: [{id: 1, Action: 2, Montant: 50}],
    Agences: [], DD: [], DR: [], Structures: [], Dispositifs: [], Federations: [], Reponses_AAP: [], Financements: [], Financeurs: [],
  });
  assert.deepEqual(contenu(actions.map((a) => a.id)), [1, 4]);
});

test("la fiche club et le widget clubs ignorent les actions en corbeille", () => {
  const raw = {
    Structures: [{id: 5, Nom: "Club"}],
    Actions: [{id: 1, Club: 5, Intitule: "Visible"}, {id: 2, Club: 5, Intitule: "Supprimee", Corbeille: "Oui"}],
    Cofinancements: [], Dispositifs: [], Contacts: [],
  };
  assert.deepEqual(contenu(loadFiche().buildFiche(raw, 5).actions.map((a) => a.id)), [1]);
  assert.deepEqual(contenu(loadClubs().buildFicheDetail(raw, 5).actions.map((a) => a.id)), [1]);
});
