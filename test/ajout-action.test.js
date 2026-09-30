"use strict";

// Le bouton « Ajouter une action » ouvre une fenetre a trois champs obligatoires
// (nom, dispositif, club). Ces tests fixent ce que la fenetre affiche, ce qu'elle
// refuse, ce qu'elle envoie a Grist, et ce qui se passe apres : la fiche de la
// nouvelle action s'ouvre, ou la fenetre reste ouverte avec l'erreur.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadWidget} = require("./helpers/widget.js");

const SRC = path.join(__dirname, "..", "src", "actions-dashboard");
const HTML = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
const w = loadWidget();

function preparer() {
  w.state.raw = {
    Dispositifs: [{id: 3, Dispositif: "Job Dating"}, {id: 5, Dispositif: "Coaching"}],
    Structures: [{id: 11, Nom: "US Laval Basket"}, {id: 12, Nom: "AS Montreuil"}],
  };
  w.state.view = "dashboard";
  w.state.editingId = null;
  w.state.addActionOpen = false;
  w.state.actions = [];
}

function saisir({nom = "", dispositif = "", club = ""}) {
  w.document.getElementById("addActionName").value = nom;
  w.document.getElementById("addActionDispositif").value = String(dispositif);
  w.document.getElementById("addActionClub").value = String(club);
}

const evenement = {preventDefault() {}};

// Les objets crees dans le bac a sable n'ont pas le prototype de ceux du test :
// on compare leur contenu, pas leur identite.
const contenu = (valeur) => JSON.parse(JSON.stringify(valeur));

test("le bouton est en haut a droite de la page, primaire, avec le libelle demande", () => {
  const barre = HTML.slice(HTML.indexOf('class="topbar"'), HTML.indexOf('class="dashboard-layout"'));
  assert.match(barre, /class="btn btn-primary"[^>]*id="addActionBtn"[^>]*><span class="btn-content">Ajouter une action<\/span>/);
  assert.ok(barre.indexOf('id="exportBtn"') < barre.indexOf('id="addActionBtn"'),
    "l'action principale est la derniere, donc la plus a droite");
});

test("la fenetre est celle du design system, titree « Ajout d'une action »", () => {
  preparer();
  const html = w.addActionModalHtml();

  assert.match(html, /<h2 class="modal-title" id="addActionTitle">Ajout d'une action<\/h2>/);
  for (const classe of ["modal-backdrop", "modal ", "modal-dialog", "modal-content", "modal-header", "modal-body", "modal-footer"]) {
    assert.ok(html.includes(`class="${classe}`) || html.includes(` ${classe}`), `la classe ${classe.trim()} du design system est posee`);
  }
  assert.match(html, /role="dialog" aria-modal="true" aria-labelledby="addActionTitle"/);
});

test("nom, dispositif et club sont obligatoires, dans les controles du design system", () => {
  preparer();
  const html = w.addActionModalHtml();

  assert.match(html, /<input class="form-control" id="addActionName"[^>]*required/);
  assert.match(html, /<select class="form-control" id="addActionDispositif"[^>]*required/);
  assert.match(html, /<select class="form-control" id="addActionClub"[^>]*required/);
  assert.equal((html.match(/<span class="required">&nbsp;\*<\/span>/g) || []).length, 3, "trois asterisques d'obligation");
  assert.equal((html.match(/class="invalid-feedback"/g) || []).length, 3, "un message d'erreur par champ");
});

test("les listes proposent les dispositifs et les clubs, sans en preselectionner un", () => {
  preparer();
  const html = w.addActionModalHtml();

  assert.match(html, /<option value="" selected disabled>Choisir un dispositif<\/option>/);
  assert.match(html, /<option value="" selected disabled>Choisir un club<\/option>/);
  assert.match(html, /<option value="5">Coaching<\/option>/);
  assert.match(html, /<option value="12">AS Montreuil<\/option>/);
});

test("les boutons sont Annuler (secondaire) puis Valider (primaire)", () => {
  preparer();
  const html = w.addActionModalHtml();

  const annuler = html.indexOf('id="cancelAddAction"');
  const valider = html.indexOf('id="submitAddAction"');
  assert.ok(annuler > 0 && valider > annuler);
  assert.match(html, /class="btn btn-secondary" id="cancelAddAction"><span class="btn-content">Annuler<\/span>/);
  assert.match(html, /type="submit" class="btn btn-primary" id="submitAddAction"><span class="btn-content">Valider<\/span>/);
});

test("un champ vide ou un nom d'espaces est refuse, dans l'ordre de la fenetre", () => {
  const ids = (valeurs) => contenu(w.addActionProblems(valeurs).map((champ) => champ.key));

  assert.deepEqual(ids({nom: "", dispositif: "", club: ""}), ["nom", "dispositif", "club"]);
  assert.deepEqual(ids({nom: "   ", dispositif: "3", club: "11"}), ["nom"]);
  assert.deepEqual(ids({nom: "Job dating", dispositif: "", club: "11"}), ["dispositif"]);
  assert.deepEqual(ids({nom: "Job dating", dispositif: "3", club: ""}), ["club"]);
  assert.deepEqual(ids({nom: "Job dating", dispositif: "3", club: "11"}), []);
});

test("l'enregistrement ne porte que les trois champs saisis, nettoyes", () => {
  assert.deepEqual(contenu(w.newActionFields({nom: "  Job dating  ", dispositif: "3", club: "11"})),
    {Intitule: "Job dating", Dispositif: 3, Club: 11});
});

test("valider avec un champ manquant n'envoie rien et signale le champ", async () => {
  preparer();
  w.openAddAction();
  let envoyees = 0;
  w.grist.docApi.applyUserActions = () => { envoyees += 1; return Promise.resolve({}); };
  saisir({nom: "Job dating", dispositif: 3, club: ""});

  await w.submitAddAction(evenement);

  assert.equal(envoyees, 0);
  assert.ok(w.document.getElementById("addActionClub").classList.contains("is-invalid"));
  assert.ok(!w.document.getElementById("addActionName").classList.contains("is-invalid"));
  assert.equal(w.state.addActionOpen, true, "la fenetre reste ouverte");
});

test("valider cree l'action, ferme la fenetre et ouvre la fiche de la nouvelle action", async () => {
  preparer();
  w.openAddAction();
  const appels = [];
  w.grist.docApi.applyUserActions = (actions) => {
    appels.push(actions);
    return Promise.resolve({retValues: [42]});
  };
  // Apres la creation, le tableau est relu : la nouvelle action y figure.
  w.grist.docApi.fetchTable = (table) => Promise.resolve(
    table === "Actions" ? {id: [42], Intitule: ["Job dating"], Club: [11], Dispositif: [3]} : {id: []});
  saisir({nom: "Job dating", dispositif: 3, club: 11});

  await w.submitAddAction(evenement);

  assert.deepEqual(contenu(appels), [[["AddRecord", "Actions", null, {Intitule: "Job dating", Dispositif: 3, Club: 11}]]]);
  assert.equal(w.state.addActionOpen, false, "la fenetre est fermee");
  assert.equal(w.document.getElementById("addActionModal").innerHTML, "");
  assert.equal(w.state.view, "edit");
  assert.equal(w.state.editingId, 42, "la fiche de la nouvelle action est ouverte");
});

test("si l'ajout echoue, la fenetre reste ouverte avec le message et le bouton se rearme", async () => {
  preparer();
  w.openAddAction();
  w.grist.docApi.applyUserActions = () => Promise.reject(new Error("Blocked by table access rules"));
  saisir({nom: "Job dating", dispositif: 3, club: 11});

  await w.submitAddAction(evenement);

  const message = w.document.getElementById("addActionMessage");
  assert.equal(message.querySelector(".alert-content").textContent, "L'ajout n'a pas abouti : Blocked by table access rules");
  assert.ok(!message.classList.contains("is-hidden"));
  assert.equal(w.document.getElementById("submitAddAction").disabled, false);
  assert.equal(w.state.addActionOpen, true);
  assert.equal(w.state.view, "dashboard");
});

test("Annuler ferme la fenetre sans rien envoyer", () => {
  preparer();
  let envoyees = 0;
  w.grist.docApi.applyUserActions = () => { envoyees += 1; return Promise.resolve({}); };
  w.openAddAction();
  assert.equal(w.state.addActionOpen, true);
  assert.notEqual(w.document.getElementById("addActionModal").innerHTML, "");

  w.closeAddAction();

  assert.equal(w.state.addActionOpen, false);
  assert.equal(w.document.getElementById("addActionModal").innerHTML, "");
  assert.equal(envoyees, 0);
});

test("le style de la fenetre ne redefinit aucune classe du design system", () => {
  const css = fs.readFileSync(path.join(SRC, "style.css"), "utf8");
  // La fenetre n'a que des classes locales (add-action-*) et un selecteur
  // d'identifiant pour l'afficher : .modal et ses parts restent au design system.
  assert.ok(!/^\.modal/m.test(css), "aucune regle locale ne commence par .modal");
  assert.match(css, /#addActionModal \.modal, #deleteActionModal \.modal \{ display: block; overflow-y: auto; \}/);
});
