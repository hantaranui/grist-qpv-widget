"use strict";

// Meme principe que widget.js, pour le script de la fiche club : on l'evalue dans
// un bac a sable muni de doublures, puis on recupere ses fonctions. Chaque test
// peut remplacer fetch et l'API Grist pour observer ce que le widget demande.

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {makeElement} = require("./widget");

const SCRIPT = path.join(__dirname, "..", "..", "src", "fiche-club", "script.js");
const EXPORTED = ["state", "memo", "TABLES", "FRR_CLASSEMENTS", "LOGO_TYPES"];

function loadFiche(overrides = {}) {
  const code = fs.readFileSync(SCRIPT, "utf8")
    + `\n;globalThis.__widget = {${EXPORTED.join(", ")}};\n`;

  const elements = new Map();
  const calls = {accessTokens: [], userActions: [], fetches: []};

  const grist = {
    ready() {},
    onRecord() {},
    selectedTable: {getTableId: () => Promise.resolve("Structures")},
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
    },
    ...overrides.grist,
  };

  const sandbox = {
    console: {log() {}, warn() {}, error() {}, info() {}},
    setTimeout,
    URL,
    FormData,
    Blob,
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
    ...overrides.globals,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename: "script.js"});
  return Object.assign(Object.create(null), sandbox, sandbox.__widget, {elements, calls});
}

// Reponse HTTP minimale, suffisante pour ce que le widget en lit.
function reponse(corps, {status = 200} = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(typeof corps === "string" ? JSON.parse(corps) : corps),
    text: () => Promise.resolve(typeof corps === "string" ? corps : JSON.stringify(corps)),
  });
}

module.exports = {loadFiche, reponse};
