"use strict";

// Meme principe que widget.js et fiche-club.js : on evalue le script dans un
// bac a sable muni de doublures, puis on recupere ses fonctions et son etat.

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {makeElement} = require("./widget");

const SCRIPT = path.join(__dirname, "..", "..", "src", "clubs", "script.js");
const EXPORTED = ["state", "TABLES", "FILTERS", "SEARCHABLE_FILTERS"];

function loadClubs(overrides = {}) {
  const code = fs.readFileSync(SCRIPT, "utf8")
    + `\n;globalThis.__widget = {${EXPORTED.join(", ")}};\n`;

  const elements = new Map();
  const calls = {accessTokens: [], userActions: [], fetches: []};

  const grist = {
    ready() {},
    setHeight() {},
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

module.exports = {loadClubs};
