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

// Le libelle d'un bouton du design system vit dans son span .btn-content.
const label = (id) => w.document.getElementById(id).querySelector(".btn-content").textContent;

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
  assert.equal(label("toggleFilters"), "Déplier");

  filtersHtml({open: true});
  assert.ok(!w.document.getElementById("filtersSection").classList.contains("is-collapsed"));
  assert.ok(!w.document.getElementById("layout").classList.contains("filters-collapsed"));
  assert.equal(label("toggleFilters"), "Replier");
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
  assert.match(html, /<option value="" selected disabled>Choisir une agence<\/option>/);
  assert.ok(!/<option value="1" selected>AUCH<\/option>/.test(html), "aucune agence n'est preselectionnee");
});

test("une action rattachee a une agence n'affiche pas l'invite", () => {
  const html = editHtml({agence: 1});
  assert.ok(!html.includes("Choisir une agence"), "l'invite disparait des qu'une agence est connue");
  assert.match(html, /<option value="1" selected>AUCH<\/option>/);
});

test("le dispositif suit la meme regle que l'agence", () => {
  assert.match(editHtml({dispositif: 0}), /<option value="" selected disabled>Choisir un dispositif<\/option>/);
});

test("les boutons portent les classes du design system", () => {
  const html = editHtml();
  assert.match(html, /class="btn btn-secondary" id="cancelEdit"><span class="btn-content">Annuler</);
  assert.match(html, /class="btn btn-primary"[^>]*id="saveEdit"><span class="btn-content">Enregistrer</);
  assert.match(html, /class="btn btn-secondary finance-add"/, "ajouter un financeur");
  assert.match(w.financeRow({statutVersement: "", montant: 10}),
    /class="btn btn-secondary btn-sm finance-remove"/, "retirer un financeur");

  seed();
  w.renderRows(w.state.actions);
  assert.match(w.document.getElementById("rows").innerHTML,
    /class="btn btn-secondary btn-sm"[^>]*data-edit-action/, "modifier une action");

  assert.match(filtersHtml({open: true}), /class="btn btn-primary filter-text-submit"/, "loupe de recherche");
});

test("plus aucune classe de bouton maison dans le rendu", () => {
  const rendus = [editHtml(), filtersHtml({open: true})].join(" ");
  for (const ancienne of ["edit-button", "save-button", "cancel-button", "link-button",
                          "add-finance-button", "remove-finance-button"]) {
    assert.ok(!rendus.includes(ancienne), `${ancienne} a bien disparu`);
  }
});

test("la fiche de detail se declare comme boite de dialogue", () => {
  editHtml();
  const vue = w.document.getElementById("editView");
  assert.equal(vue.attributes.role, "dialog");
  assert.equal(vue.attributes["aria-modal"], "true");
  assert.equal(vue.attributes["aria-labelledby"], "editHeading");
  assert.match(vue.innerHTML, /<h1 id="editHeading">/, "le titre nomme la boite de dialogue");
});

test("l'echec d'un enregistrement est annonce aux lecteurs d'ecran", () => {
  assert.match(editHtml(), /id="editMessage" role="alert" aria-live="assertive"/);
});

test("le champ obligatoire porte le marqueur du design system", () => {
  assert.match(editHtml(),
    /<label class="form-label" for="editTitle">Intitulé de l'action<span class="required">&nbsp;\*<\/span><\/label>/);
});

test("chaque controle de la fiche porte un name", () => {
  const html = editHtml();
  for (const champ of ["editTitle", "editDispositif", "editFormat", "editParticipants",
                       "editVille", "editLieu", "editCommentaire", "editAgency",
                       "editBudget", "editOpenToFunding"]) {
    assert.ok(html.includes(`name="${champ}"`), `${champ} porte un name`);
  }
});

test("les libelles de champ portent form-label", () => {
  const html = editHtml();
  for (const champ of ["editTitle", "editDispositif", "editFormat", "editParticipants",
                       "editVille", "editLieu", "editCommentaire", "editAgency", "editBudget"]) {
    assert.ok(html.includes(`<label class="form-label" for="${champ}">`), `${champ}`);
  }
  assert.match(html, /<span class="form-label" id="publicLabel">Public<\/span>/,
    "le sélecteur de public n'est pas étiquetable : son libellé le nomme par aria-labelledby");
  assert.match(html, /aria-labelledby="publicLabel publicToggleValue"/);
});

test("les filtres relient leur libelle a leur controle", () => {
  const html = filtersHtml({open: true});
  assert.match(html, /<label class="form-label" for="filter-osiris">Numéro Osiris<\/label>/);
  assert.match(html, /<input class="form-control filter-text-input" type="search" id="filter-osiris"/);
  assert.match(html, /<label class="form-label" for="filter-statut">Statut<\/label>/);
  assert.match(html, /<select class="form-control" id="filter-statut"/);
  // Un <details> ne s'etiquette pas : le libelle le nomme a distance.
  assert.match(html, /<span class="form-label" id="filter-club-label">Club<\/span>/);
  assert.match(html, /<summary class="form-control" aria-labelledby="filter-club-label">/);
});

test("chaque champ porte form-control", () => {
  const html = editHtml();
  for (const champ of ["editTitle", "editParticipants", "editVille", "editLieu", "editBudget"]) {
    assert.ok(html.includes(`<input class="form-control" id="${champ}"`), `${champ}`);
  }
  for (const champ of ["editDispositif", "editFormat", "editAgency"]) {
    assert.ok(html.includes(`<select class="form-control" id="${champ}"`), `${champ}`);
  }
  assert.match(html, /<textarea class="form-control" id="editCommentaire"/);
  assert.match(html, /<button class="form-control public-toggle"/,
    "le sélecteur de public reprend l'habillage de champ plutôt que de le copier");
  assert.match(w.financeRow({statutVersement: "", montant: 10}),
    /<select class="form-control finance-select">/);
});

test("le chevron des listes deroulantes n'est plus dessine deux fois", () => {
  const html = filtersHtml({open: true});
  assert.ok(!html.includes("select-control"),
    "select.form-control fournit son propre chevron : notre habillage a disparu");
});

test("cases et boutons radio suivent la structure form-check", () => {
  const html = editHtml();
  assert.match(html,
    /<div class="form-check with-checked-bg finance-open-option"><input class="form-check-input" type="checkbox" id="editOpenToFunding"/);
  assert.match(html,
    /<label class="form-check-label" for="editOpenToFunding">Ouvert au financement<\/label>/);
  assert.match(html,
    /<div class="form-check with-checked-bg public-option"><input class="form-check-input public-choice" type="checkbox" id="public-0"/);
  assert.match(html,
    /<div class="form-check with-checked-bg status-option [a-z-]+"><input class="form-check-input" type="radio" id="status-0" name="editStatus"/);
});

test("le groupe de statuts porte sa legende", () => {
  const html = editHtml();
  assert.match(html, /<p class="form-legend" id="statusLegend">Statut de l'action<\/p>/);
  assert.match(html, /<div class="status-options" role="group" aria-labelledby="statusLegend">/);
});

test("plus aucun champ ne dessine son propre habillage", () => {
  const css = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "actions-dashboard", "style.css"), "utf8");
  // Le soulignement epais etait notre facon de dessiner un champ avant form-control.
  assert.ok(!css.includes("border-bottom: 2px solid"),
    "un champ habille a la main a survecu : le design system s'en charge");
});

test("les jauges de financement utilisent la barre du design system", () => {
  seed();
  w.renderRows(w.state.actions);
  const ligne = w.document.getElementById("rows").innerHTML;
  assert.match(ligne, /<div class="progress bar" role="progressbar"/);
  assert.match(ligne, /<span class="progress-bar" style="width:\d+%">/);
  // La couverture n'etait qu'une largeur : sans ces attributs, rien n'etait lisible
  // autrement qu'a l'oeil.
  assert.match(ligne, /aria-valuenow="\d+"[^>]*aria-label="Part du budget couverte"/);

  assert.match(editHtml(), /<span class="progress finance-progress" role="progressbar"/);
});

test("le tableau suit la structure du design system", () => {
  seed();
  w.renderRows(w.state.actions);
  const ligne = w.document.getElementById("rows").innerHTML;
  // La cellule qui nomme l'action identifie la ligne : plusieurs lignes partagent
  // une agence, et cette cellule-la est meme vide quand elle se repete.
  assert.match(ligne, /<th scope="row"><div class="strong">ANS-26-0055-3 Créneaux<\/div>/);
  assert.match(ligne, /Ville : Auch<\/div><\/th>/);
});
