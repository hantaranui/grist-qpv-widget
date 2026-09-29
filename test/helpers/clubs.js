"use strict";

// Meme principe que widget.js et fiche-club.js : on evalue le script dans un
// bac a sable muni de doublures, puis on recupere ses fonctions et son etat.

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {makeElement} = require("./widget");

const SCRIPT = path.join(__dirname, "..", "..", "src", "clubs", "script.js");
const EXPORTED = ["state", "TABLES", "FILTERS", "SEARCHABLE_FILTERS"];

// Doublure minimale de window.localStorage : une Map suffit, mais les cles et
// valeurs y transitent en chaines, comme le vrai stockage du navigateur.
function makeLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => [...store.keys()][index] ?? null,
  };
}

function loadClubs(overrides = {}) {
  const code = fs.readFileSync(SCRIPT, "utf8")
    + `\n;globalThis.__widget = {${EXPORTED.join(", ")}};\n`;

  const elements = new Map();
  const calls = {accessTokens: [], userActions: [], fetches: [], setOptions: []};
  const options = new Map(Object.entries(overrides.options || {}));

  const grist = {
    ready() {},
    setHeight() {},
    // Reglage propre a cette pose du widget (pas au document) : l'adresse de
    // la page Dashboard, saisie une fois par qui installe le widget.
    getOption: (key) => Promise.resolve(options.has(key) ? options.get(key) : null),
    setOption(key, value) {
      options.set(key, value);
      calls.setOptions.push({key, value});
      return Promise.resolve();
    },
    docApi: {
      fetchTable: () => Promise.resolve({id: []}),
      getAccessToken(options) {
        calls.accessTokens.push(options);
        return Promise.resolve({token: "jeton", baseUrl: "https://grist.example/api/docs/DOC"});
      },
      applyUserActions(actions) {
        calls.userActions.push(actions);
        return Promise.resolve({});
      },
      ...(overrides.grist && overrides.grist.docApi),
    },
    ...overrides.grist,
  };

  const sandbox = {
    console: {log() {}, warn() {}, error() {}, info() {}},
    setTimeout,
    requestAnimationFrame: () => {},
    URL,
    localStorage: overrides.localStorage || makeLocalStorage(),
    fetch(url, options) {
      calls.fetches.push({url: String(url), options});
      return overrides.fetch ? overrides.fetch(String(url), options) : Promise.reject(new Error("réseau indisponible en test"));
    },
    document: {
      getElementById: (id) => elements.get(id) || elements.set(id, makeElement()).get(id),
      querySelector: () => makeElement(),
      querySelectorAll: () => [],
      createElement: () => makeElement(),
      addEventListener() {},
    },
    grist,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename: "script.js"});
  return Object.assign(Object.create(null), sandbox, sandbox.__widget, {elements, calls});
}

module.exports = {loadClubs, makeLocalStorage};
