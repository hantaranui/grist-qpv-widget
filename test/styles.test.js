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

test("le statut se distingue par son fond, jamais par la couleur du texte", () => {
  // La regle .tag du design system fixe l'encre par defaut et ses variantes ne
  // declarent qu'un fond ; seuls les fonds sombres passent au texte blanc. Une
  // encre coloree sur le fond clair de la meme famille tombait sous 4,5:1.
  assert.ok(!/--statut-encre/.test(CSS), "plus d'encre coloree pour un statut");
  assert.ok(!/\.status-tag\.[\w-]+[^}]*\bcolor:/.test(CSS),
    "les variantes de pastille ne declarent pas de couleur de texte");

  for (const [statut, jeton] of [["planifiee", "warning"], ["realisee", "success"],
                                 ["annulee", "error"], ["projet", "info"]]) {
    assert.match(CSS,
      new RegExp(`\\.status-tag\\.${statut}[^}]*background: var\\(--ft-color-background-${jeton}-weakest\\)`),
      `la pastille ${statut} prend le fond ${jeton}`);
    assert.match(CSS,
      new RegExp(`\\.status-option\\.${statut}[^}]*--statut-fond: var\\(--ft-color-background-${jeton}-weakest\\)`),
      `le statut ${statut} du formulaire prend le meme fond`);
  }

  // Aucune couleur ecrite en dur : tout passe par la palette du design system.
  const bloc = CSS.slice(CSS.indexOf(".status-tag.projet"), CSS.indexOf(".status-head-row"));
  assert.ok(!/#[0-9a-fA-F]{3,6}/.test(bloc), "pas de couleur hors palette");
});

test("le tableau de bord se masque vraiment quand la fiche s'ouvre", () => {
  // .is-hidden est une classe ; #dashboardView un identifiant, plus fort. Sans
  // regle dediee, le display:none ne s'applique pas et la fiche s'ajoute sous le
  // tableau au lieu de le remplacer.
  assert.match(CSS, /#dashboardView\.is-hidden \{ display: none; \}/);
});

test("le fond du statut choisi reprend la geometrie du calque du design system", () => {
  // Le design system dessine l'option choisie sur le ::before du libelle, cale sur
  // le bloc avec ces decalages. Un fond pose sur le bloc lui-meme couvrait une
  // autre surface et depassait en bas.
  const calque = CSS.slice(
    CSS.indexOf(".status-options .form-check:has(.form-check-input:checked)::before"));
  const bloc = calque.slice(0, calque.indexOf("}") + 1);
  for (const decalage of ["top: -.75rem", "right: -.75rem", "bottom: -.75rem", "left: -1.75rem"]) {
    assert.ok(bloc.includes(decalage), `le calque garde ${decalage}`);
  }
  assert.ok(bloc.includes("background: var(--statut-fond)"));
  assert.ok(!/\.status-options \.form-check:has\([^)]*\) \{ background/.test(CSS),
    "plus de fond pose sur le bloc lui-meme");
});
