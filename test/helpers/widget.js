"use strict";

// script.js est un script de page, pas un module : il s'execute au chargement et
// parle au DOM et a l'API Grist. Pour tester sa logique pure, on l'evalue dans un
// bac a sable muni de doublures minimales, puis on recupere ses fonctions.
//
// Les declarations `function` deviennent des proprietes du global du bac a sable,
// mais pas les `const` : on ajoute donc une ligne d'export a la fin du code pour
// exposer les constantes et l'etat dont les tests ont besoin.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SCRIPT = path.join(__dirname, "..", "..", "src", "actions-dashboard", "script.js");
const EXPORTED = ["state", "FILTERS", "FINANCEMENT_STATES", "SEARCHABLE_FILTERS", "TEXT_FILTERS", "FALLBACK_CHOICES", "TABLES"];

// Les doublures gardent ce qui se verifie depuis un test : le HTML ecrit dans
// l'element et les classes posees dessus. Le reste ne fait rien.
function makeElement() {
  const classes = new Set();
  return {
    innerHTML: "", textContent: "", value: "", checked: false, hidden: false, disabled: false,
    dataset: {}, style: {}, files: [],
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : Boolean(force);
        if (on) classes.add(name); else classes.delete(name);
        return on;
      },
    },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, removeAttribute() {},
    querySelector: () => makeElement(), querySelectorAll: () => [], closest: () => null,
    insertAdjacentHTML() {}, appendChild() {}, click() {}, focus() {},
  };
}

function loadWidget() {
  const code = fs.readFileSync(SCRIPT, "utf8")
    + `\n;globalThis.__widget = {${EXPORTED.join(", ")}};\n`;

  // Le chargement asynchrone du widget journalise ses replis : inutile de polluer
  // la sortie des tests avec.
  const quiet = {log() {}, warn() {}, error() {}, info() {}};

  const elements = new Map();

  const sandbox = {
    console: quiet,
    setTimeout,
    requestAnimationFrame: () => {},
    fetch: () => Promise.reject(new Error("réseau indisponible en test")),
    document: {
      // Un meme identifiant renvoie toujours le meme element, sans quoi un test
      // ne pourrait pas relire ce qu'un rendu vient d'ecrire.
      getElementById: (id) => elements.get(id) || elements.set(id, makeElement()).get(id),
      querySelector: () => makeElement(),
      querySelectorAll: () => [],
      createElement: () => makeElement(),
      addEventListener() {},
      documentElement: {scrollHeight: 0},
      body: makeElement(),
    },
    grist: {
      ready() {},
      setHeight() {},
      docApi: {
        // Une table vide au format colonnes de Grist : le widget demarre sans
        // donnee, les tests fournissent ensuite leurs propres jeux d'essai.
        fetchTable: () => Promise.resolve({id: []}),
        getAccessToken: () => Promise.reject(new Error("pas de jeton en test")),
        applyUserActions: () => Promise.resolve({}),
      },
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename: "script.js"});
  return Object.assign(Object.create(null), sandbox, sandbox.__widget, {elements});
}

module.exports = {loadWidget, makeElement};
