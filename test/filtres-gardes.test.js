"use strict";

// Filtres du tableau de bord gardés le temps de la session (sessionStorage) :
// sauverFiltres(), restaurerFiltres() et effacerFiltresGardes().
//
// Le script lance load() tout seul au chargement. Chaque test appelle donc
// demarrer(), qui fabrique un widget avec un faux sessionStorage, un faux
// getDocName et des données fictives, puis attend le premier affichage des
// filtres. Les ecouteurs (listes, recherche Osiris, bouton Réinitialiser) sont
// captes pour pouvoir simuler un clic sans navigateur.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget, makeElement} = require("./helpers/widget.js");

const PREFIXE = "dashboard-filtres-v1:";
const DOC = "Document fictif A";
const CLE = PREFIXE + DOC;

// Les objets fabriques dans le bac a sable n'ont pas le prototype de l'hote :
// on les ramene a des valeurs simples avant de comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

// Donnees fictives (format colonnes de Grist).
//   Region Nord : DD Alpha (AGENCE A1, AGENCE A2), DD Beta (AGENCE B1)
//   Region Sud  : DD Gamma (AGENCE C1)
const TABLES_FICTIVES = {
  Actions: {
    id: [1, 2, 3, 4],
    Intitule: ["Action 1", "Action 2", "Action 3", "Action 4"],
    DR: [1, 1, 1, 2],
    DD: [1, 1, 2, 3],
    Agence: [1, 2, 3, 4],
    Federation: [1, 2, 1, 2],
    Club: [1, 1, 2, 2],
    Dispositif: [1, 1, 1, 1],
    Statut: ["Planifiée", "Réalisée", "Planifiée", "A confirmer"],
  },
  DR: {id: [1, 2], Nom: ["Region Nord", "Region Sud"]},
  DD: {id: [1, 2, 3], Nom: ["DD Alpha", "DD Beta", "DD Gamma"]},
  Agences: {id: [1, 2, 3, 4], Libelle_agence: ["AGENCE A1", "AGENCE A2", "AGENCE B1", "AGENCE C1"]},
  Federations: {id: [1, 2], Nom: ["Fed Un", "Fed Deux"]},
  Structures: {id: [1, 2], Nom: ["Club Un", "Club Deux"]},
  Dispositifs: {id: [1], Dispositif: ["Dispositif Un"]},
};

// Faux sessionStorage : garde les valeurs et compte les ecritures.
function creerStockage(initial = {}) {
  const valeurs = new Map(Object.entries(initial));
  const stockage = {
    ecritures: 0,
    suppressions: 0,
    getItem: (cle) => (valeurs.has(cle) ? valeurs.get(cle) : null),
    setItem: (cle, valeur) => { stockage.ecritures += 1; valeurs.set(cle, String(valeur)); },
    removeItem: (cle) => { stockage.suppressions += 1; valeurs.delete(cle); },
    cles: () => [...valeurs.keys()],
    lire: (cle) => (valeurs.has(cle) ? JSON.parse(valeurs.get(cle)) : undefined),
  };
  return stockage;
}

// Un stockage dont chaque appel leve une erreur (navigation privee, quota).
function stockageCasse() {
  const casse = () => { throw new Error("stockage indisponible"); };
  return {getItem: casse, setItem: casse, removeItem: casse};
}

// Journal de console : on y verifie qu'aucun message n'est ecrit.
function creerConsole() {
  const appels = [];
  const note = (niveau) => (...args) => { appels.push([niveau, ...args.map(String)]); };
  return {appels, log: note("log"), warn: note("warn"), error: note("error"), info: note("info")};
}

// Construit le widget et attend son premier affichage des filtres.
async function demarrer({stockage = creerStockage(), docName = DOC, getDocName, tables = TABLES_FICTIVES} = {}) {
  const elements = new Map();

  // Bouton Réinitialiser : on garde l'ecouteur que le script y branche.
  const resetBtn = makeElement();
  let clicReset = null;
  resetBtn.addEventListener = (type, fonction) => { if (type === "click") clicReset = fonction; };
  elements.set("resetBtn", resetBtn);

  // Conteneur des filtres : on note chaque HTML ecrit et on fabrique, a partir
  // de lui, les controles que le script va brancher.
  const conteneur = makeElement();
  const ecritures = [];
  let html = "";
  let premierAffichage;
  const attente = new Promise((resolve) => { premierAffichage = resolve; });
  const ecouteurs = {select: {}, option: {}, envoi: {}};
  const champOsiris = {value: "", dataset: {filterText: "osiris"}, addEventListener() {}};
  Object.defineProperty(conteneur, "innerHTML", {
    get: () => html,
    set: (valeur) => {
      html = valeur;
      ecritures.push(valeur);
      ecouteurs.select = {}; ecouteurs.option = {}; ecouteurs.envoi = {};
      premierAffichage();
    },
  });
  const controles = (motif, fabriquer) => [...html.matchAll(motif)].map((m) => fabriquer(...m.slice(1)));
  conteneur.querySelectorAll = (selecteur) => {
    if (selecteur === "select") {
      return controles(/data-filter="([a-z]+)"/g, (cle) => ({
        dataset: {filter: cle},
        addEventListener: (type, fonction) => { ecouteurs.select[cle] = fonction; },
      }));
    }
    if (selecteur === "[data-filter-key]") {
      return controles(/data-filter-key="([a-z]+)" data-filter-value="([^"]*)"/g, (cle, valeur) => ({
        dataset: {filterKey: cle, filterValue: valeur},
        addEventListener: (type, fonction) => { ecouteurs.option[`${cle}|${valeur}`] = fonction; },
      }));
    }
    if (selecteur === "[data-filter-submit]") {
      return controles(/data-filter-submit="([a-z]+)"/g, (cle) => ({
        dataset: {filterSubmit: cle},
        addEventListener: (type, fonction) => { if (type === "click") ecouteurs.envoi[cle] = fonction; },
      }));
    }
    return [];
  };
  conteneur.querySelector = (selecteur) => (selecteur === '[data-filter-text="osiris"]' ? champOsiris : null);
  elements.set("filters", conteneur);

  const journal = creerConsole();
  const w = loadWidget({
    elements,
    sessionStorage: stockage,
    console: journal,
    getDocName: getDocName || (() => Promise.resolve(docName)),
    fetchTable: (nom) => Promise.resolve(tables[nom] || {id: []}),
  });

  // Garde-fou : si le widget n'affiche jamais ses filtres, le test echoue
  // proprement au lieu de rester suspendu.
  let minuteur;
  const delai = new Promise((_, rejeter) => { minuteur = setTimeout(() => rejeter(new Error("le widget n'a jamais affiche ses filtres")), 3000); });
  try { await Promise.race([attente, delai]); } finally { clearTimeout(minuteur); }

  return {
    w, stockage, journal, ecritures, elements,
    filtres: () => plain(w.state.filters),
    htmlFiltres: () => html,
    reinitialiser: () => clicReset(),
    // Choix dans une liste deroulante (dr, dispositif, statut, financeur, financement).
    choisirSelect: (cle, valeur) => ecouteurs.select[cle]({target: {dataset: {filter: cle}, value: valeur}}),
    // Choix dans une liste avec recherche (dd, agency, federation, club).
    choisirListe: (cle, valeur) => {
      const element = {dataset: {filterKey: cle, filterValue: valeur}};
      ecouteurs.option[`${cle}|${valeur}`]({currentTarget: element});
    },
    // Recherche par numero Osiris : saisie puis clic sur la loupe.
    chercherOsiris: (texte) => { champOsiris.value = texte; ecouteurs.envoi.osiris(); },
  };
}

// ---------------------------------------------------------------------------
// 1. Un changement de filtre ecrit dans sessionStorage, sous la bonne cle.
// ---------------------------------------------------------------------------

test("choisir un filtre dans une liste déroulante l'écrit sous la clé « préfixe + nom du document »", async () => {
  // Échoue si la clé n'est pas dashboard-filtres-v1: suivi du nom du document, ou si un select n'écrit rien.
  const t = await demarrer();
  t.choisirSelect("statut", "Planifiée");
  assert.deepEqual(t.stockage.cles(), [CLE]);
  assert.deepEqual(t.stockage.lire(CLE), {statut: "Planifiée"});
});

test("choisir un filtre dans une liste avec recherche l'écrit dans sessionStorage", async () => {
  // Échoue si les listes avec recherche (fédération, club, DD, agence) ne sauvegardent pas.
  const t = await demarrer();
  t.choisirListe("federation", "Fed Deux");
  assert.deepEqual(t.stockage.lire(CLE), {federation: "Fed Deux"});
});

test("la recherche par numéro Osiris est écrite telle quelle dans sessionStorage", async () => {
  // Échoue si le filtre texte Osiris n'est pas gardé, ou si le texte est modifié avant l'écriture.
  const t = await demarrer();
  t.chercherOsiris("  OS-2026-0042 ");
  assert.deepEqual(t.stockage.lire(CLE), {osiris: "OS-2026-0042"});
});

test("remettre un filtre sur « Tous » le retire de sessionStorage", async () => {
  // Échoue si un filtre vidé reste dans le stockage et revient au prochain chargement.
  const t = await demarrer();
  t.choisirSelect("statut", "Planifiée");
  t.choisirSelect("statut", "");
  assert.deepEqual(t.stockage.lire(CLE), {});
});

test("tous les filtres choisis sont gardés ensemble, sans le tri ni l'état replié", async () => {
  // Échoue si le stockage contient autre chose que les clés de state.filters (tri, synthèse repliée…).
  const t = await demarrer();
  t.choisirSelect("dr", "Region Nord");
  t.choisirListe("club", "Club Un");
  t.chercherOsiris("OS-1");
  t.w.state.sort = {key: "budget", dir: "desc"};
  t.w.state.summaryOpen = true;
  t.choisirSelect("statut", "Planifiée");
  assert.deepEqual(t.stockage.lire(CLE), {dr: "Region Nord", club: "Club Un", osiris: "OS-1", statut: "Planifiée"});
});

// ---------------------------------------------------------------------------
// 2. pruneGeoFilters() : c'est la version nettoyee qui est enregistree.
// ---------------------------------------------------------------------------

test("changer de DR enregistre les filtres déjà nettoyés (DD et agence incohérentes retirées)", async () => {
  // Échoue si sauverFiltres() est appelée avant pruneGeoFilters() : l'ancienne DD/agence resterait dans le stockage.
  const t = await demarrer();
  t.choisirSelect("dr", "Region Nord");
  t.choisirListe("dd", "DD Alpha");
  t.choisirListe("agency", "AGENCE A1");
  assert.deepEqual(t.stockage.lire(CLE), {dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A1"});

  t.choisirSelect("dr", "Region Sud");
  assert.deepEqual(t.stockage.lire(CLE), {dr: "Region Sud"});
  assert.deepEqual(t.filtres(), {dr: "Region Sud"});
});

test("changer de DD enregistre les filtres sans l'agence qui n'en fait plus partie", async () => {
  // Échoue si l'agence d'une autre DD reste enregistrée après un changement de DD.
  const t = await demarrer();
  t.choisirListe("dd", "DD Alpha");
  t.choisirListe("agency", "AGENCE A1");
  t.choisirListe("dd", "DD Beta");
  assert.deepEqual(t.stockage.lire(CLE), {dd: "DD Beta"});
});

// ---------------------------------------------------------------------------
// 3. Au demarrage, les filtres gardes sont relus et appliques avant l'affichage.
// ---------------------------------------------------------------------------

test("au démarrage, les filtres gardés sont appliqués dès le premier affichage", async () => {
  // Échoue si la restauration a lieu après render() : le premier affichage montrerait des filtres vides.
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: "Planifiée", federation: "Fed Un", osiris: "OS-9"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Planifiée", federation: "Fed Un", osiris: "OS-9"});
  // Le tout premier HTML des filtres porte déjà les valeurs restaurées.
  assert.match(t.ecritures[0], /<option value="Planifiée" selected>/);
  assert.match(t.ecritures[0], /value="OS-9"/);
  assert.match(t.ecritures[0], /Fed Un/);
});

test("au démarrage, les filtres gardés filtrent bien la liste des actions", async () => {
  // Échoue si les filtres restaurés sont lus mais pas pris en compte par filteredActions().
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: "Planifiée", dr: "Region Nord"})});
  const t = await demarrer({stockage});
  assert.deepEqual(plain(t.w.filteredActions()).map((action) => action.id).sort(), [1, 3]);
});

test("sans filtres gardés, le widget démarre avec des filtres vides", async () => {
  // Échoue si un démarrage à vide invente des filtres ou plante.
  const t = await demarrer();
  assert.deepEqual(t.filtres(), {});
});

test("un contenu gardé illisible (JSON invalide, tableau, texte) est ignoré", async () => {
  // Échoue si un stockage corrompu bloque le démarrage ou injecte des filtres.
  for (const brut of ["pas du json{", "[\"statut\",\"Planifiée\"]", "\"texte\"", "42", "null"]) {
    const t = await demarrer({stockage: creerStockage({[CLE]: brut})});
    assert.deepEqual(t.filtres(), {}, `contenu : ${brut}`);
  }
});

// ---------------------------------------------------------------------------
// 4. Cle inconnue. 5. Valeur qui n'existe plus.
// ---------------------------------------------------------------------------

test("une clé inconnue (absente de FILTERS) est ignorée au démarrage et n'est pas réécrite", async () => {
  // Échoue si une clé étrangère entre dans state.filters (elle ferait disparaître toutes les actions).
  const stockage = creerStockage({[CLE]: JSON.stringify({inconnu: "x", statut: "Planifiée"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Planifiée"});
  assert.deepEqual(t.stockage.lire(CLE), {statut: "Planifiée"});
});

test("une valeur absente de optionsFor(key) est ignorée au démarrage", async () => {
  // Échoue si un filtre dont la valeur n'existe plus (club supprimé…) est appliqué : la liste serait vide.
  const stockage = creerStockage({[CLE]: JSON.stringify({club: "Club Disparu", statut: "Réalisée", federation: "Fed Fantôme"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Réalisée"});
});

test("le filtre texte Osiris est accepté tel quel, même s'il ne correspond à aucune action", async () => {
  // Échoue si osiris est contrôlé contre optionsFor(key) : sa valeur n'y figure jamais.
  const stockage = creerStockage({[CLE]: JSON.stringify({osiris: "numéro-qui-n'existe-pas"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {osiris: "numéro-qui-n'existe-pas"});
});

test("les valeurs qui ne sont pas du texte ou qui sont vides sont ignorées", async () => {
  // Échoue si un nombre, un objet ou une chaîne vide gardés atterrissent dans state.filters.
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: 3, club: {a: 1}, federation: "", osiris: ["x"], dr: "Region Nord"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {dr: "Region Nord"});
});

test("le stockage est réécrit au démarrage sans les filtres ignorés", async () => {
  // Échoue si un filtre périmé reste dans sessionStorage et est reproposé à chaque rechargement.
  const stockage = creerStockage({[CLE]: JSON.stringify({club: "Club Disparu", statut: "Réalisée"})});
  await demarrer({stockage});
  assert.deepEqual(stockage.lire(CLE), {statut: "Réalisée"});
});

// ---------------------------------------------------------------------------
// 6. Filtres geographiques incoherents nettoyes au demarrage.
// ---------------------------------------------------------------------------

test("au démarrage, une agence qui n'appartient plus à la DD gardée est retirée", async () => {
  // Échoue si pruneGeoFilters() n'est appelée qu'au changement manuel et pas au démarrage.
  const stockage = creerStockage({[CLE]: JSON.stringify({dd: "DD Alpha", agency: "AGENCE B1"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {dd: "DD Alpha"});
  assert.deepEqual(stockage.lire(CLE), {dd: "DD Alpha"});
});

test("au démarrage, une DD qui n'appartient plus à la DR gardée est retirée avec son agence", async () => {
  // Échoue si la cascade DR → DD → agence n'est pas appliquée à la restauration.
  const stockage = creerStockage({[CLE]: JSON.stringify({dr: "Region Sud", dd: "DD Alpha", agency: "AGENCE A1"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {dr: "Region Sud"});
});

test("au démarrage, des filtres géographiques cohérents sont conservés", async () => {
  // Échoue si le nettoyage retire à tort une DR/DD/agence qui vont ensemble.
  const gardes = {dr: "Region Nord", dd: "DD Alpha", agency: "AGENCE A2"};
  const t = await demarrer({stockage: creerStockage({[CLE]: JSON.stringify(gardes)})});
  assert.deepEqual(t.filtres(), gardes);
});

// ---------------------------------------------------------------------------
// 7. Reinitialiser.
// ---------------------------------------------------------------------------

test("le bouton Réinitialiser vide state.filters ET l'entrée de sessionStorage", async () => {
  // Échoue si Réinitialiser ne fait que vider state.filters : les filtres reviendraient au prochain chargement.
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: "Planifiée", osiris: "OS-1"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Planifiée", osiris: "OS-1"});

  t.reinitialiser();
  assert.deepEqual(t.filtres(), {});
  assert.equal(stockage.getItem(CLE), null);
  assert.deepEqual(stockage.cles(), []);
});

test("après Réinitialiser, un nouveau démarrage ne retrouve aucun filtre", async () => {
  // Échoue si l'entrée effacée est réécrite juste après (par exemple par un sauverFiltres() tardif).
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: "Planifiée"})});
  const premier = await demarrer({stockage});
  premier.reinitialiser();
  const second = await demarrer({stockage});
  assert.deepEqual(second.filtres(), {});
});

test("Réinitialiser n'efface pas les filtres gardés d'un autre document", async () => {
  // Échoue si effacerFiltresGardes() vide tout le sessionStorage au lieu de la seule clé du document.
  const autre = PREFIXE + "Document fictif B";
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: "Planifiée"}), [autre]: JSON.stringify({statut: "Réalisée"})});
  const t = await demarrer({stockage});
  t.reinitialiser();
  assert.deepEqual(stockage.cles(), [autre]);
});

// ---------------------------------------------------------------------------
// 8. sessionStorage qui leve une erreur.
// ---------------------------------------------------------------------------

test("sessionStorage cassé au démarrage : le widget s'affiche normalement, sans filtres, sans bruit", async () => {
  // Échoue si l'erreur de lecture remonte jusqu'au catch de load() (message d'erreur à l'écran) ou dans la console.
  const reference = await demarrer();
  const t = await demarrer({stockage: stockageCasse()});
  assert.deepEqual(t.filtres(), {});
  assert.equal(t.elements.has("empty") ? t.elements.get("empty").textContent : "", "");
  assert.deepEqual(t.journal.appels, reference.journal.appels);
  assert.equal(t.journal.appels.filter(([niveau]) => niveau === "error").length, 0);
});

test("sessionStorage cassé à l'écriture : choisir un filtre fonctionne quand même", async () => {
  // Échoue si l'exception de setItem casse le clic (le filtre ne s'appliquerait pas) ou s'affiche en console.
  const t = await demarrer({stockage: stockageCasse()});
  const avant = t.journal.appels.length;
  t.choisirSelect("statut", "Planifiée");
  t.chercherOsiris("OS-1");
  t.choisirListe("federation", "Fed Un");
  assert.deepEqual(t.filtres(), {statut: "Planifiée", osiris: "OS-1", federation: "Fed Un"});
  assert.equal(t.journal.appels.length, avant);
  assert.equal(t.elements.get("empty") ? t.elements.get("empty").textContent : "", "");
});

test("sessionStorage cassé : Réinitialiser vide quand même les filtres affichés", async () => {
  // Échoue si l'exception de removeItem empêche state.filters d'être vidé ou le rendu d'avoir lieu.
  const t = await demarrer({stockage: stockageCasse()});
  t.choisirSelect("statut", "Planifiée");
  assert.doesNotThrow(() => t.reinitialiser());
  assert.deepEqual(t.filtres(), {});
});

test("sessionStorage absent du navigateur : le widget fonctionne sans filtres gardés", async () => {
  // Échoue si window.sessionStorage indéfini (accès refusé) fait planter le démarrage ou un clic.
  const t = await demarrer({stockage: null});
  assert.deepEqual(t.filtres(), {});
});

// ---------------------------------------------------------------------------
// 9. getDocName() qui echoue.
// ---------------------------------------------------------------------------

test("getDocName() qui échoue : le widget démarre normalement, sans filtres gardés, sans bruit", async () => {
  // Échoue si le rejet de getDocName() remonte jusqu'au catch de load() (message à l'écran) ou en console.
  const stockage = creerStockage({[CLE]: JSON.stringify({statut: "Planifiée"})});
  const reference = await demarrer();
  const t = await demarrer({stockage, getDocName: () => Promise.reject(new Error("nom indisponible"))});
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(t.journal.appels, reference.journal.appels);
  assert.equal(t.elements.has("empty") ? t.elements.get("empty").textContent : "", "");
});

test("getDocName() qui échoue : rien n'est écrit dans sessionStorage, même après un changement de filtre", async () => {
  // Échoue si, faute de nom, une clé bancale (« …:undefined ») est écrite et partagée entre documents.
  const stockage = creerStockage();
  const t = await demarrer({stockage, getDocName: () => Promise.reject(new Error("nom indisponible"))});
  t.choisirSelect("statut", "Planifiée");
  t.chercherOsiris("OS-1");
  assert.deepEqual(t.filtres(), {statut: "Planifiée", osiris: "OS-1"});
  assert.equal(stockage.ecritures, 0);
  assert.deepEqual(stockage.cles(), []);
});

test("getDocName() qui lève une erreur de façon synchrone est traité de la même façon", async () => {
  // Échoue si seule l'erreur asynchrone est prévue et qu'une exception directe casse le démarrage.
  const t = await demarrer({getDocName: () => { throw new Error("pas d'API"); }});
  assert.deepEqual(t.filtres(), {});
  assert.equal(t.stockage.ecritures, 0);
});

test("getDocName() qui renvoie un nom vide : aucun filtre n'est lu ni écrit", async () => {
  // Échoue si un nom vide produit la clé « dashboard-filtres-v1: » commune à tous les documents sans nom.
  const stockage = creerStockage({[PREFIXE]: JSON.stringify({statut: "Planifiée"})});
  const t = await demarrer({stockage, docName: ""});
  assert.deepEqual(t.filtres(), {});
  t.choisirSelect("statut", "Réalisée");
  assert.equal(stockage.ecritures, 0);
});

// ---------------------------------------------------------------------------
// 10. Deux documents ne se melangent pas.
// ---------------------------------------------------------------------------

test("deux documents de noms différents gardent chacun leurs filtres, sans mélange", async () => {
  // Échoue si la clé ne contient pas le nom du document : DEV, TEST et PROD partageraient leurs filtres.
  const stockage = creerStockage();
  const a = await demarrer({stockage, docName: "Document fictif A"});
  a.choisirSelect("statut", "Planifiée");

  const b = await demarrer({stockage, docName: "Document fictif B"});
  assert.deepEqual(b.filtres(), {}, "le document B ne doit pas lire les filtres du document A");
  b.choisirSelect("statut", "Réalisée");

  assert.deepEqual(stockage.lire(PREFIXE + "Document fictif A"), {statut: "Planifiée"});
  assert.deepEqual(stockage.lire(PREFIXE + "Document fictif B"), {statut: "Réalisée"});

  const a2 = await demarrer({stockage, docName: "Document fictif A"});
  assert.deepEqual(a2.filtres(), {statut: "Planifiée"});
});

test("un nom de document qui en contient un autre ne lit pas ses filtres", async () => {
  // Échoue si la lecture compare par préfixe ou par « contient » au lieu de la clé exacte.
  const stockage = creerStockage({[PREFIXE + "Doc"]: JSON.stringify({statut: "Planifiée"})});
  const t = await demarrer({stockage, docName: "Doc 2"});
  assert.deepEqual(t.filtres(), {});
});
