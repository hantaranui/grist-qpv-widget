"use strict";

// Aide des tests d'ecran de l'export CSV du widget clubs (test/clubs-export-ecran.test.js).
//
// Pourquoi une aide a part : le script de clubs branche ses ecouteurs des son
// chargement (bouton « Reinitialiser », lignes du menu d'export, conteneur du
// menu). Le bac a sable de test/helpers/clubs.js n'a pas de DOM a ce moment-la :
// un DOM pose apres coup arriverait trop tard. Cette aide evalue donc le MEME
// script (src/clubs/script.js, non modifie) dans un bac a sable dont le document
// est pret avant le chargement.
//
// Ce que le DOM de test fait (et rien de plus) :
//  - les elements prennent leurs classes, attributs et data-* dans le VRAI
//    src/clubs/index.html (donc un attribut change dans le HTML change le test) ;
//  - chaque element retient ses ecouteurs, et un clic parcourt la phase de
//    capture des ancetres puis l'element, avec preventDefault / stopPropagation ;
//  - le focus est suivi (document.activeElement) ;
//  - les filtres ecrits dans #filters (select, boutons d'option) redeviennent des
//    elements cliquables, relies aux vrais ecouteurs du script ;
//  - le telechargement (Blob, URL.createObjectURL, lien <a>) est enregistre.
//
// Ce que cette aide NE FAIT PAS : le script du design system (ft-autoloader.js)
// n'est pas charge. Une « doublure » minimale pose sur le bouton un ecouteur de
// clic qui marque le menu comme ouvert, et un objet ftDropdown avec close() ;
// elle sert seulement a voir si un clic arrive ou non jusqu'au bouton. Elle ne
// prouve rien sur le vrai composant (clavier, Echap, aria-expanded...).

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {makeElement} = require("./widget");
const {makeLocalStorage} = require("./clubs");

const RACINE = path.join(__dirname, "..", "..", "src", "clubs");
const SCRIPT = path.join(RACINE, "script.js");
const HTML_CLUBS = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");

const EXPORTED = ["state", "EXPORT_CLUBS_PREFIXE_FICHIER", "EXPORT_CONTACTS_PREFIXE_FICHIER", "EXPORT_TYPE_MIME"];

// Parent de chaque element du menu (le script s'en sert : closest, capture).
const PARENTS = {exportMenuBtn: "exportDropdown", exportClubsItem: "exportDropdown", exportContactsItem: "exportDropdown"};
const IDS_LIGNES_MENU = ["exportClubsItem", "exportContactsItem"];

// Les attributs de la balise portant cet id, lus dans le vrai index.html.
// Renvoie null si l'id n'existe pas dans le HTML.
function attributsHtml(id) {
  const trouve = new RegExp(`<(\\w+)([^>]*?\\sid="${id}"[^>]*)>`).exec(HTML_CLUBS);
  if (!trouve) return null;
  const attributs = {};
  for (const attribut of trouve[2].matchAll(/([\w-]+)="([^"]*)"/g)) attributs[attribut[1]] = attribut[2];
  return attributs;
}

// Format colonnes, celui que renvoie grist.docApi.fetchTable.
function colonnes(lignes) {
  const table = {id: lignes.map((ligne) => ligne.id)};
  const cles = new Set(lignes.flatMap((ligne) => Object.keys(ligne)));
  cles.delete("id");
  for (const cle of cles) table[cle] = lignes.map((ligne) => (cle in ligne ? ligne[cle] : null));
  return table;
}

// Options :
//  - tables : { NomDeTable: [lignes] } ; une table absente est vide ;
//  - illisibles : noms de tables dont la lecture est refusee (comme une regle d'acces).
async function chargerEcranExport({tables = {}, illisibles = []} = {}) {
  const code = fs.readFileSync(SCRIPT, "utf8")
    + `\n;globalThis.__widget = {${EXPORTED.join(", ")}};\n`;

  const elements = new Map();
  const registreFiltres = new Map();
  const journalConsole = [];
  const ecrituresAnnonce = [];
  const telechargements = [];
  const ordre = [];
  const blobs = new Map();
  const appels = {fetchTable: [], fetch: [], applyUserActions: [], getAccessToken: [], setOption: []};
  const localStorage = makeLocalStorage();
  const sessionStorage = makeLocalStorage();
  let compteurUrl = 0;

  // --- Elements -------------------------------------------------------------

  function equiper(element, id) {
    element.id = id;
    element.ecouteurs = {};
    element.addEventListener = (type, fonction, option) => {
      const capture = option === true || Boolean(option && option.capture);
      (element.ecouteurs[type] ||= []).push({fonction, capture});
    };
    Object.defineProperty(element, "parent", {get: () => (PARENTS[id] ? obtenir(PARENTS[id]) : null), configurable: true});
    // Seuls les selecteurs « #id » sont compris, ce qui suffit au script d'export.
    element.closest = (selecteur) => {
      for (let courant = element; courant; courant = courant.parent) {
        if (selecteur === `#${courant.id}`) return courant;
      }
      return null;
    };
    element.focus = () => { document.activeElement = element; };
    return element;
  }

  function creer(id) {
    const element = equiper(makeElement(), id);
    const attributs = attributsHtml(id) || {};
    for (const [nom, valeur] of Object.entries(attributs)) {
      if (nom === "id") continue;
      if (nom === "class") valeur.split(/\s+/).filter(Boolean).forEach((classe) => element.classList.add(classe));
      else if (nom.startsWith("data-")) element.dataset[nom.slice(5).replace(/-([a-z])/g, (_, lettre) => lettre.toUpperCase())] = valeur;
      else element.setAttribute(nom, valeur);
    }

    if (id === "exportMenuBtn") {
      // Doublure du script du design system (voir l'en-tete) : un clic ouvre le menu.
      element.ftDropdown = {
        ouvert: false,
        fermetures: 0,
        close() { this.ouvert = false; this.fermetures += 1; },
      };
      element.ecouteurs.click = [{fonction: () => { element.ftDropdown.ouvert = true; }, capture: false}];
    }

    if (id === "exportStatus") {
      let texte = "";
      Object.defineProperty(element, "textContent", {
        get: () => texte,
        set(valeur) { texte = String(valeur); ecrituresAnnonce.push(texte); },
        configurable: true,
      });
    }

    if (id === "filters") {
      // Les filtres ecrits en HTML redeviennent des elements, retrouvables ensuite.
      element.querySelectorAll = (selecteur) => {
        const html = element.innerHTML;
        if (selecteur === "select") {
          return [...html.matchAll(/<select\b[^>]*data-filter="([^"]+)"/g)].map(([, cle]) => {
            const select = equiper(makeElement(), null);
            select.dataset = {filter: cle};
            registreFiltres.set(`select:${cle}`, select);
            return select;
          });
        }
        if (selecteur === "[data-filter-key]") {
          return [...html.matchAll(/<button\b[^>]*data-filter-key="([^"]*)"[^>]*data-filter-value="([^"]*)"/g)].map(([, cle, valeur]) => {
            const option = equiper(makeElement(), null);
            option.dataset = {filterKey: cle, filterValue: valeur};
            registreFiltres.set(`option:${cle}:${valeur}`, option);
            return option;
          });
        }
        return [];
      };
    }
    return element;
  }

  function obtenir(id) {
    if (!elements.has(id)) elements.set(id, creer(id));
    return elements.get(id);
  }

  // Un clic (ou tout autre evenement) : capture sur les ancetres, puis l'element,
  // puis la remontee. stopPropagation arrete les phases suivantes.
  function envoyer(element, type, proprietes = {}) {
    const evenement = {
      type, target: element, currentTarget: element, defaultPrevented: false, propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
      ...proprietes,
    };
    const ancetres = [];
    for (let courant = element.parent; courant; courant = courant.parent) ancetres.push(courant);
    const jouer = (cible, capture) => {
      evenement.currentTarget = cible;
      for (const ecouteur of (cible.ecouteurs[type] || []).filter((item) => item.capture === capture)) ecouteur.fonction(evenement);
    };
    for (const ancetre of [...ancetres].reverse()) {
      jouer(ancetre, true);
      if (evenement.propagationStopped) return evenement;
    }
    jouer(element, true);
    jouer(element, false);
    for (const ancetre of ancetres) {
      if (evenement.propagationStopped) break;
      jouer(ancetre, false);
    }
    return evenement;
  }

  // --- Telechargement -------------------------------------------------------

  class BlobDouble {
    constructor(parties, options = {}) {
      this.contenu = parties.join("");
      this.type = options.type;
    }
  }

  class UrlDouble extends URL {
    static createObjectURL(blob) {
      compteurUrl += 1;
      const adresse = `blob:exemple.fr/${compteurUrl}`;
      blobs.set(adresse, blob);
      ordre.push(`creation:${adresse}`);
      return adresse;
    }
    static revokeObjectURL(adresse) { ordre.push(`liberation:${adresse}`); }
  }

  const corps = makeElement();
  corps.contains = () => true;
  corps.ajoutes = [];
  corps.appendChild = (enfant) => { corps.ajoutes.push(enfant); };

  const document = {
    referrer: "",
    activeElement: null,
    body: corps,
    documentElement: {scrollHeight: 0},
    getElementById: (id) => obtenir(id),
    querySelector: () => makeElement(),
    querySelectorAll: (selecteur) => (selecteur === "[data-export]" ? IDS_LIGNES_MENU.map(obtenir) : []),
    createElement(balise) {
      if (balise !== "a") return makeElement();
      const lien = {
        href: "", download: "",
        click() {
          ordre.push("clic");
          const blob = blobs.get(this.href);
          telechargements.push({nom: this.download, href: this.href, type: blob && blob.type, contenu: blob && blob.contenu});
        },
      };
      return lien;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  // --- Grist ----------------------------------------------------------------

  const grist = {
    ready() {},
    setHeight() {},
    getOption: () => Promise.resolve(null),
    setOption(cle, valeur) { appels.setOption.push({cle, valeur}); return Promise.resolve(); },
    docApi: {
      fetchTable(table) {
        appels.fetchTable.push(table);
        if (illisibles.includes(table)) return Promise.reject(new Error("refus"));
        return Promise.resolve(colonnes(tables[table] || []));
      },
      getAccessToken(options) {
        appels.getAccessToken.push(options);
        return Promise.resolve({token: "jeton-fictif", baseUrl: "https://grist.exemple.fr/api/docs/DOC"});
      },
      applyUserActions(actions) {
        appels.applyUserActions.push(actions);
        return Promise.resolve({});
      },
    },
  };

  const trace = (niveau) => (...args) => { journalConsole.push({niveau, args}); };
  const sandbox = {
    console: {log: trace("log"), warn: trace("warn"), error: trace("error"), info: trace("info")},
    setTimeout,
    requestAnimationFrame: () => {},
    URL: UrlDouble,
    Blob: BlobDouble,
    top: {location: {href: ""}},
    localStorage,
    sessionStorage,
    fetch(adresse, options) {
      appels.fetch.push({adresse: String(adresse), options});
      return Promise.reject(new Error("réseau indisponible en test"));
    },
    document,
    grist,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, {filename: "script.js"});
  // Le chargement de depart (lecture des tables, premier affichage) se termine seul.
  await new Promise((resolve) => setImmediate(resolve));

  const w = Object.assign(Object.create(null), sandbox, sandbox.__widget);

  const ecran = {
    document,
    el: obtenir,
    // Un clic sur l'element d'id donne ; renvoie l'evenement (defaultPrevented...).
    cliquer: (id) => envoyer(obtenir(id), "click"),
    changerFiltre(cle, valeur) {
      const select = registreFiltres.get(`select:${cle}`);
      if (!select) throw new Error(`Aucune liste « ${cle} » dans les filtres affichés`);
      return envoyer(select, "change", {target: {dataset: {filter: cle}, value: valeur}});
    },
    choisirOption(cle, valeur) {
      const option = registreFiltres.get(`option:${cle}:${valeur}`);
      if (!option) throw new Error(`Aucune option « ${valeur} » dans le filtre « ${cle} »`);
      return envoyer(option, "click");
    },
    reinitialiser: () => envoyer(obtenir("resetBtn"), "click"),
    telechargements,
    ordre,
    ecrituresAnnonce,
    journalConsole,
    corps,
    appels,
    // Tout ce qui sort du widget : un export ne doit rien y ajouter.
    compteurs: () => ({
      fetchTable: appels.fetchTable.length,
      fetch: appels.fetch.length,
      applyUserActions: appels.applyUserActions.length,
      getAccessToken: appels.getAccessToken.length,
      setOption: appels.setOption.length,
      console: journalConsole.length,
      localStorage: localStorage.length,
      sessionStorage: sessionStorage.length,
    }),
  };
  return {w, ecran};
}

module.exports = {chargerEcranExport, attributsHtml, HTML_CLUBS};
