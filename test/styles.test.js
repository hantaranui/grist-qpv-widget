"use strict";

// Le design system France Travail est charge avant notre feuille : toute classe
// que nous redefinissons sous un de ses noms herite de ses regles en silence, et
// notre CSS ne l'emporte que sur les proprietes qu'il redeclare. Ce test garde la
// liste des noms a ne jamais reprendre.
//
// Pour reconstituer l'inventaire complet, extraire les classes de
// https://cdn.francetravail.fr/studio/design-system/css/styles.css et les croiser
// avec celles declarees ici.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CSS = fs.readFileSync(
  path.join(__dirname, "..", "src", "actions-dashboard", "style.css"), "utf8");

// Noms portes par le design system, releves dans sa feuille v1.15.0.
const RESERVES = [
  "table", "layout", "tag", "section", "btn", "badge", "card", "alert", "modal",
  "dropdown", "form-control", "form-label", "form-check", "container", "row", "col",
  "sr-only", "icon", "header", "footer", "tooltip", "pagination", "breadcrumb",
];

// Classe posee en tete de selecteur, donc redefinie pour tout le document.
// « .public-toggle .icon » ne compte pas : c'est notre contexte qui habille un
// composant du design system, ce qui est legitime.
function classesRedefinies(css) {
  const trouvees = new Set();
  for (const bloc of css.split("}")) {
    const selecteurs = bloc.split("{")[0];
    if (!selecteurs || selecteurs.includes("@")) continue;
    for (const selecteur of selecteurs.split(",")) {
      const premier = selecteur.trim().match(/^\.([\w-]+)/);
      if (premier) trouvees.add(premier[1]);
    }
  }
  return trouvees;
}

test("aucune classe du widget ne reprend un nom du design system", () => {
  const redefinies = classesRedefinies(CSS);
  const conflits = RESERVES.filter((nom) => redefinies.has(nom));
  assert.deepEqual(conflits, [],
    `à renommer : ${conflits.join(", ")} — le design system définit déjà ces classes`);
});

test("les classes renommees sont bien celles utilisees", () => {
  for (const nom of ["table-panel", "dashboard-layout", "status-tag", "board-section"]) {
    assert.ok(classesRedefinies(CSS).has(nom), `.${nom} doit exister dans la feuille`);
  }
});

test("la couleur du statut choisi vient des jetons semantiques du design system", () => {
  // On remplace la teinte que « with-checked-bg » applique, on ne superpose pas
  // un second fond : le selecteur doit donc viser le meme ::before que lui.
  // Le fond va sur le conteneur : le ::before du design system passe au-dessus du
  // texte, donc une couleur franche posee dessus masquerait le libelle.
  assert.match(CSS,
    /\.status-options \.form-check:has\(\.form-check-input:checked\) \{ background-color: var\(--statut-fond\)/);
  assert.ok(!/form-check-label::before \{ background-color/.test(CSS),
    "ne pas peindre le calque que le design system superpose au texte");

  for (const [statut, jeton] of [["planifiee", "warning"], ["realisee", "success"],
                                 ["annulee", "error"], ["a-confirmer", "warning"]]) {
    const regle = new RegExp(`\\.status-option\\.${statut}[^}]*--statut-fond: var\\(--ft--bg-${jeton}\\)`);
    assert.match(CSS, regle, `${statut} prend le jeton ${jeton}`);
  }

  // Aucune couleur ecrite en dur : tout passe par la palette du design system.
  const bloc = CSS.slice(CSS.indexOf(".status-option.projet"), CSS.indexOf(".status-head-row"));
  assert.ok(!/#[0-9a-fA-F]{3,6}/.test(bloc), "pas de couleur hors palette");
});

test("le conteneur de defilement reste le notre", () => {
  const html = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "actions-dashboard", "index.html"), "utf8");
  // « table-responsive » impose height:100% et fixe la premiere ligne a 140px par
  // cellule, ce qui ecraserait le colgroup sous table-layout:fixed et priverait
  // l'en-tete colle de son conteneur de defilement.
  assert.ok(!/class="[^"]*\btable-responsive\b/.test(html),
    "table-responsive vise une autre forme de tableau que la nôtre");
  assert.match(html, /<table class="table">/, "la table porte bien la classe du design system");
});

test("le tableau de bord se masque vraiment quand la fiche s'ouvre", () => {
  // .is-hidden est une classe ; #dashboardView un identifiant, plus fort. Sans
  // regle dediee, le display:none ne s'applique pas et la fiche s'ajoute sous le
  // tableau au lieu de le remplacer.
  assert.match(CSS, /#dashboardView\.is-hidden \{ display: none; \}/);
});
