"use strict";

// Ces tests lisent le HTML que le widget ecrit dans ses elements, via les
// doublures du harnais. Ils couvrent ce qui se voit, la ou logic.test.js couvre
// ce qui se calcule.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const w = loadWidget();
const [FULLY, PARTLY, NONE] = w.FINANCEMENT_STATES;

function seed() {
  w.state.raw = {
    Actions: [{id: 1, Intitule: "Créneaux", Nom_complet: "ANS-26-0055-3 Créneaux", Reponse_AAP: 10,
               Club: 1, Agence: 1, Budget: 2000, Jauge: 20, Ville: "Auch", Statut: "A confirmer", Public: null}],
    Reponses_AAP: [{id: 10, Numero_Action_Osiris: "ANS-26-0055-3"}],
    Cofinancements: [], Financements: [], Financeurs: [], Structures: [{id: 1, Nom: "Club"}],
    Agences: [{id: 1, Libelle_agence: "AUCH", DD: 0}], DD: [], DR: [], Dispositifs: [], Federations: [],
  };
  w.state.actions = w.buildActions(w.state.raw);
  w.state.filters = {};
  w.state.sort = {};
}

function editHtml({agence = 1, dispositif = 0} = {}) {
  seed();
  w.state.raw.Actions[0].Agence = agence;
  w.state.raw.Actions[0].Dispositif = dispositif;
  w.state.actions = w.buildActions(w.state.raw);
  w.state.view = "edit";
  w.state.editingId = 1;
  w.renderEdit();
  const html = w.document.getElementById("editView").innerHTML;
  w.state.view = "dashboard";
  w.state.editingId = null;
  return html;
}

function filtersHtml({open}) {
  seed();
  w.state.filtersOpen = open;
  w.renderFilters();
  return w.document.getElementById("filters").innerHTML;
}

test("la recherche Osiris propose un bouton pour declencher le filtrage", () => {
  const html = filtersHtml({open: true});
  assert.match(html, /data-filter-text="osiris"/, "le champ de saisie est present");
  assert.match(html, /data-filter-submit="osiris"/, "le bouton de recherche est present");
  assert.match(html, /<svg[^>]*viewBox="0 0 16 16"/, "le bouton porte la loupe");
  assert.match(html, /aria-label="Lancer la recherche par Numéro Osiris"/);
});

test("le champ Osiris reaffiche la recherche en cours", () => {
  seed();
  w.state.filters = {osiris: "ANS-26"};
  w.state.filtersOpen = true;
  w.renderFilters();
  assert.match(w.document.getElementById("filters").innerHTML, /value="ANS-26"/);
});

test("le filtre Financement propose ses trois etats, le filtre Financeur est nomme ainsi", () => {
  const html = filtersHtml({open: true});
  assert.match(html, /data-filter="financement"/);
  [FULLY, PARTLY, NONE].forEach((etat) => assert.ok(html.includes(etat), `${etat} est propose`));
  assert.ok(html.includes("Financeur"), "l'ancien libelle Financement designe bien le financeur");
});

test("replier les filtres libere la largeur du tableau", () => {
  filtersHtml({open: false});
  assert.ok(w.document.getElementById("filtersSection").classList.contains("is-collapsed"));
  assert.ok(w.document.getElementById("layout").classList.contains("filters-collapsed"));
  assert.equal(w.document.getElementById("toggleFilters").textContent, "Déplier");

  filtersHtml({open: true});
  assert.ok(!w.document.getElementById("filtersSection").classList.contains("is-collapsed"));
  assert.ok(!w.document.getElementById("layout").classList.contains("filters-collapsed"));
  assert.equal(w.document.getElementById("toggleFilters").textContent, "Replier");
});

test("un statut de versement vide n'affiche rien", () => {
  const html = w.financeRow({statutVersement: "", montant: 2400});
  assert.ok(!html.includes("À définir"), "plus de valeur de remplacement");
  assert.match(html, /data-statut=""/, "la valeur vide reste transportee pour l'enregistrement");
});

test("un statut de versement renseigne s'affiche et reste enregistrable", () => {
  const html = w.financeRow({statutVersement: "En cours", montant: 2400});
  assert.match(html, /data-statut="En cours"/);
  assert.ok(html.includes("En cours"));
});

test("le statut de versement n'est plus modifiable", () => {
  const html = w.financeRow({statutVersement: "Versé", montant: 10});
  assert.ok(!/<select[^>]*finance-status/.test(html), "ce n'est plus une liste deroulante");
  assert.match(html, /<div class="finance-status"/);
});

test("la ligne du tableau affiche le nom complet et la ville de l'action", () => {
  seed();
  w.renderRows(w.state.actions);
  const html = w.document.getElementById("rows").innerHTML;
  assert.ok(html.includes("ANS-26-0055-3 Créneaux"), "nom complet en tete de cellule");
  assert.ok(html.includes("Ville : Auch"));
});

test("la fiche de detail n'a plus de lien de retour", () => {
  seed();
  w.state.view = "edit";
  w.state.editingId = 1;
  w.renderEdit();
  const html = w.document.getElementById("editView").innerHTML;
  assert.ok(!html.includes("backToDashboard"), "le lien de retour est retire");
  assert.ok(html.includes("cancelEdit"), "Annuler reste");
  assert.ok(html.includes("saveEdit"), "Enregistrer reste");
  assert.ok(html.includes("ANS-26-0055-3 Créneaux"), "le titre affiche le nom complet");
  assert.match(html, /id="editTitle"[^>]*value="Créneaux"/, "le champ modifiable garde l'intitule seul");
  w.state.view = "dashboard";
  w.state.editingId = null;
});

test("une action sans agence n'en affiche aucune plutot que la premiere de la liste", () => {
  const html = editHtml({agence: 0});
  assert.match(html, /<option value="" selected>Choisir une agence<\/option>/);
  assert.ok(!/<option value="1" selected>AUCH<\/option>/.test(html), "aucune agence n'est preselectionnee");
});

test("une action rattachee a une agence n'affiche pas l'invite", () => {
  const html = editHtml({agence: 1});
  assert.ok(!html.includes("Choisir une agence"), "l'invite disparait des qu'une agence est connue");
  assert.match(html, /<option value="1" selected>AUCH<\/option>/);
});

test("le dispositif suit la meme regle que l'agence", () => {
  assert.match(editHtml({dispositif: 0}), /<option value="" selected>Choisir un dispositif<\/option>/);
});
