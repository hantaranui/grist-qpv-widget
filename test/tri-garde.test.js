"use strict";

// Tri du tableau de bord gardé le temps de la session (sessionStorage) :
// sauverTri() et restaurerTri() (décision E7-7 du backlog).
//
// Même principe que test/filtres-gardes.test.js : demarrer() fabrique un widget
// avec un faux sessionStorage, un faux getDocName et des données fictives, puis
// attend le premier affichage. En plus, il capte :
//   - les boutons des menus de tri (data-sort-option) pour simuler un clic ;
//   - le bouton Réinitialiser ;
//   - tout ce qui est écrit dans le tableau des actions (#rows), pour vérifier
//     l'ordre affiché.
// Aucun mécanisme nouveau côté helpers : le seul ajout est le remplacement
// temporaire de vm.runInContext, le temps du chargement, pour que
// document.querySelectorAll('[data-sort-option]') renvoie nos boutons au moment
// où le script y branche ses écouteurs (le helper renvoie sinon une liste vide).

const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const {loadWidget, makeElement} = require("./helpers/widget.js");

const PREFIXE_TRI = "dashboard-tri-v1:";
const PREFIXE_FILTRES = "dashboard-filtres-v1:";
const DOC = "Document fictif A";
const CLE_TRI = PREFIXE_TRI + DOC;
const CLE_FILTRES = PREFIXE_FILTRES + DOC;

// Les colonnes de tri proposées par les menus (data-sort-option de index.html).
const CLES_TRI = ["agency", "club", "intitule", "statut", "budget"];

const plain = (value) => JSON.parse(JSON.stringify(value));

// Données fictives (format colonnes de Grist). Ordre d'origine : 1, 2, 3, 4.
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
    Budget: [300, 100, 200, 400],
  },
  DR: {id: [1, 2], Nom: ["Region Nord", "Region Sud"]},
  DD: {id: [1, 2, 3], Nom: ["DD Alpha", "DD Beta", "DD Gamma"]},
  Agences: {id: [1, 2, 3, 4], Libelle_agence: ["AGENCE A1", "AGENCE A2", "AGENCE B1", "AGENCE C1"]},
  Federations: {id: [1, 2], Nom: ["Fed Un", "Fed Deux"]},
  Structures: {id: [1, 2], Nom: ["Club Alpha", "Club Zeta"]},
  Dispositifs: {id: [1], Dispositif: ["Dispositif Un"]},
};

const ORDRE_ORIGINE = [1, 2, 3, 4];
// Ordres attendus, tri DESCENDANT, pour chaque colonne (les égalités gardent l'ordre d'origine).
const ORDRE_DESC = {
  agency: [4, 3, 2, 1],   // AGENCE C1, B1, A2, A1
  club: [3, 4, 1, 2],     // Club Zeta (3, 4) puis Club Alpha (1, 2)
  intitule: [4, 3, 2, 1],
  statut: [2, 1, 3, 4],   // Réalisée, Planifiée (1, 3), A confirmer
  budget: [4, 1, 3, 2],   // 400, 300, 200, 100
};

// Faux sessionStorage : garde les valeurs et compte lectures, écritures, suppressions.
function creerStockage(initial = {}) {
  const valeurs = new Map(Object.entries(initial));
  const stockage = {
    lectures: 0,
    ecritures: 0,
    suppressions: 0,
    getItem: (cle) => { stockage.lectures += 1; return valeurs.has(cle) ? valeurs.get(cle) : null; },
    setItem: (cle, valeur) => { stockage.ecritures += 1; valeurs.set(cle, String(valeur)); },
    removeItem: (cle) => { stockage.suppressions += 1; valeurs.delete(cle); },
    cles: () => [...valeurs.keys()],
    brut: (cle) => (valeurs.has(cle) ? valeurs.get(cle) : null),
    lire: (cle) => (valeurs.has(cle) ? JSON.parse(valeurs.get(cle)) : undefined),
  };
  return stockage;
}

// Un stockage dont chaque appel lève une erreur (navigation privée, quota).
function stockageCasse() {
  const casse = () => { throw new Error("stockage indisponible"); };
  return {getItem: casse, setItem: casse, removeItem: casse};
}

function creerConsole() {
  const appels = [];
  const note = (niveau) => (...args) => { appels.push([niveau, ...args.map(String)]); };
  return {appels, log: note("log"), warn: note("warn"), error: note("error"), info: note("info")};
}

const trier = (tri) => JSON.stringify(tri);

// Construit le widget et attend son premier affichage.
async function demarrer({stockage = creerStockage(), docName = DOC, getDocName, tables = TABLES_FICTIVES} = {}) {
  const elements = new Map();

  // Bouton Réinitialiser.
  const resetBtn = makeElement();
  let clicReset = null;
  resetBtn.addEventListener = (type, fonction) => { if (type === "click") clicReset = fonction; };
  elements.set("resetBtn", resetBtn);

  // Tableau des actions : on note chaque HTML écrit.
  const lignes = makeElement();
  const ecrituresLignes = [];
  let htmlLignes = "";
  Object.defineProperty(lignes, "innerHTML", {
    get: () => htmlLignes,
    set: (valeur) => { htmlLignes = valeur; ecrituresLignes.push(valeur); },
  });
  elements.set("rows", lignes);

  // Conteneur des filtres : premier affichage + listes déroulantes (select).
  const conteneur = makeElement();
  let htmlFiltres = "";
  let premierAffichage;
  const attente = new Promise((resolve) => { premierAffichage = resolve; });
  const ecouteursSelect = {};
  let triAuPremierAffichage;
  Object.defineProperty(conteneur, "innerHTML", {
    get: () => htmlFiltres,
    set: (valeur) => {
      htmlFiltres = valeur;
      Object.keys(ecouteursSelect).forEach((cle) => delete ecouteursSelect[cle]);
      // Le tri tel qu'il est au moment où les filtres s'affichent pour la première fois.
      if (triAuPremierAffichage === undefined && w) triAuPremierAffichage = plain(w.state.sort);
      premierAffichage();
    },
  });
  conteneur.querySelectorAll = (selecteur) => {
    if (selecteur !== "select") return [];
    return [...htmlFiltres.matchAll(/data-filter="([a-z]+)"/g)].map(([, cle]) => ({
      dataset: {filter: cle},
      addEventListener: (type, fonction) => { ecouteursSelect[cle] = fonction; },
    }));
  };
  conteneur.querySelector = () => null;
  elements.set("filters", conteneur);

  // Boutons des menus de tri : un par (colonne, sens), plus un « sans sens » par colonne
  // (le gestionnaire du script efface alors le tri ; index.html n'en propose pas aujourd'hui).
  const gestionnaires = {};
  const boutons = [];
  CLES_TRI.forEach((cle) => {
    ["asc", "desc", ""].forEach((sens) => {
      const dataset = {sortOption: cle};
      if (sens) dataset.sortDirection = sens;
      const bouton = {
        dataset,
        addEventListener: (type, fonction) => { if (type === "click") gestionnaires[`${cle}|${sens}`] = fonction; },
      };
      boutons.push(bouton);
    });
  });

  const journal = creerConsole();
  let w = null;
  const origine = vm.runInContext;
  vm.runInContext = (code, contexte, options) => {
    contexte.document.querySelectorAll = (selecteur) => (selecteur === "[data-sort-option]" ? boutons : []);
    return origine(code, contexte, options);
  };
  try {
    w = loadWidget({
      elements,
      sessionStorage: stockage,
      console: journal,
      getDocName: getDocName || (() => Promise.resolve(docName)),
      fetchTable: (nom) => Promise.resolve(tables[nom] || {id: []}),
    });
  } finally {
    vm.runInContext = origine;
  }

  // Garde-fou : le test échoue proprement si le widget n'affiche jamais ses filtres.
  let minuteur;
  const delai = new Promise((_, rejeter) => { minuteur = setTimeout(() => rejeter(new Error("le widget n'a jamais affiché ses filtres")), 3000); });
  try { await Promise.race([attente, delai]); } finally { clearTimeout(minuteur); }

  const ordreDe = (html) => [...html.matchAll(/<div class="strong">Action (\d)<\/div>/g)].map((m) => Number(m[1]));

  return {
    w, stockage, journal, elements,
    tri: () => plain(w.state.sort),
    filtres: () => plain(w.state.filters),
    triAuPremierAffichage: () => triAuPremierAffichage,
    // Ordre des actions actuellement affichées dans le tableau, et au tout premier affichage.
    ordreAffiche: () => ordreDe(htmlLignes),
    premierOrdreAffiche: () => ordreDe(ecrituresLignes[0] || ""),
    reinitialiser: () => clicReset(),
    // Clic sur un bouton d'un menu de tri. sens = "" simule l'effacement du tri.
    trierPar: (cle, sens) => {
      const bouton = boutons.find((b) => b.dataset.sortOption === cle && (b.dataset.sortDirection || "") === sens);
      gestionnaires[`${cle}|${sens}`]({currentTarget: bouton});
    },
    choisirSelect: (cle, valeur) => ecouteursSelect[cle]({target: {dataset: {filter: cle}, value: valeur}}),
  };
}

// ---------------------------------------------------------------------------
// 1. Choisir un tri l'écrit sous la bonne clé.
// ---------------------------------------------------------------------------

test("choisir A-Z puis Z-A écrit {key, direction} sous « dashboard-tri-v1: » + nom du document", async () => {
  // Échoue si la clé n'est pas le préfixe suivi du nom du document, ou si le format écrit n'est pas {key, direction}.
  const t = await demarrer();
  t.trierPar("statut", "asc");
  assert.deepEqual(t.stockage.cles(), [CLE_TRI]);
  assert.deepEqual(t.stockage.lire(CLE_TRI), {key: "statut", direction: "asc"});
  t.trierPar("statut", "desc");
  assert.deepEqual(t.stockage.cles(), [CLE_TRI]);
  assert.deepEqual(t.stockage.lire(CLE_TRI), {key: "statut", direction: "desc"});
  assert.deepEqual(t.tri(), {key: "statut", direction: "desc"});
});

test("changer de colonne remplace le tri gardé : un seul tri est gardé à la fois", async () => {
  // Échoue si l'ancien tri reste dans le stockage ou si deux entrées s'accumulent.
  const t = await demarrer();
  t.trierPar("statut", "asc");
  t.trierPar("budget", "desc");
  assert.deepEqual(t.stockage.cles(), [CLE_TRI]);
  assert.deepEqual(t.stockage.lire(CLE_TRI), {key: "budget", direction: "desc"});
});

// ---------------------------------------------------------------------------
// 2. Effacer le tri retire la clé.
// ---------------------------------------------------------------------------

test("effacer le tri retire la clé du stockage et remet l'ordre d'origine", async () => {
  // Échoue si un tri effacé reste gardé et revient au prochain chargement.
  const t = await demarrer();
  t.trierPar("statut", "asc");
  assert.deepEqual(t.ordreAffiche(), [4, 1, 3, 2]);
  t.trierPar("statut", "");
  assert.deepEqual(t.stockage.cles(), []);
  assert.equal(t.stockage.brut(CLE_TRI), null);
  assert.deepEqual(t.tri(), {});
  assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE);
});

// ---------------------------------------------------------------------------
// 3. Un tri gardé valide est appliqué avant le premier affichage.
// ---------------------------------------------------------------------------

test("au démarrage, un tri gardé valide est appliqué à state.sort avant le premier affichage", async () => {
  // Échoue si restaurerTri() est appelée après render() : le premier affichage serait non trié.
  const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key: "statut", direction: "asc"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.tri(), {key: "statut", direction: "asc"});
  assert.deepEqual(t.triAuPremierAffichage(), {key: "statut", direction: "asc"});
});

test("au démarrage, la liste affichée est déjà triée dès sa première écriture (statut A-Z)", async () => {
  // Échoue si le tableau est d'abord écrit dans l'ordre d'origine puis retrié : l'écran clignoterait.
  const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key: "statut", direction: "asc"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.premierOrdreAffiche(), [4, 1, 3, 2]);
  assert.deepEqual(t.ordreAffiche(), [4, 1, 3, 2]);
});

test("au démarrage, un tri gardé valide reste dans le stockage, inchangé", async () => {
  // Échoue si la restauration efface ou réécrit à tort un tri valide.
  const brut = JSON.stringify({key: "statut", direction: "desc"});
  const stockage = creerStockage({[CLE_TRI]: brut});
  await demarrer({stockage});
  assert.equal(stockage.brut(CLE_TRI), brut);
  assert.equal(stockage.ecritures, 0);
  assert.equal(stockage.suppressions, 0);
});

// ---------------------------------------------------------------------------
// 4. Sans tri gardé.
// ---------------------------------------------------------------------------

test("sans tri gardé, state.sort reste vide et la liste garde l'ordre d'origine", async () => {
  // Échoue si un démarrage à vide invente un tri (pas de tri automatique, règle E7-6) ou écrit dans le stockage.
  const t = await demarrer();
  assert.deepEqual(t.tri(), {});
  assert.deepEqual(t.premierOrdreAffiche(), ORDRE_ORIGINE);
  assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE);
  assert.equal(t.stockage.ecritures, 0);
  assert.deepEqual(t.stockage.cles(), []);
});

// ---------------------------------------------------------------------------
// 5. Contenu illisible. 6. Clé non acceptée. 7. Sens non accepté.
// ---------------------------------------------------------------------------

test("un contenu gardé illisible (JSON invalide, tableau, texte, nombre, null, objet vide) est ignoré et retiré", async () => {
  // Échoue si un stockage corrompu bloque le démarrage, injecte un tri ou reste dans le stockage.
  const contenus = ["pas du json{", "[\"statut\",\"asc\"]", "\"texte\"", "42", "null", "true", "{}", ""];
  for (const brut of contenus) {
    const stockage = creerStockage({[CLE_TRI]: brut});
    const t = await demarrer({stockage});
    assert.deepEqual(t.tri(), {}, `contenu : ${brut}`);
    assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE, `contenu : ${brut}`);
    assert.equal(stockage.brut(CLE_TRI), null, `contenu retiré : ${brut}`);
  }
});

test("une clé de tri absente de TRI_CLES_ACCEPTEES est ignorée et retirée", async () => {
  // Échoue si une colonne inconnue (ou non proposée par les menus) est appliquée : le tri comparerait des valeurs absentes.
  const cles = ["inconnue", "dd", "dr", "federation", "financeur", "osiris", "STATUT", "__proto__", "constructor", "", 3, null];
  for (const key of cles) {
    const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key, direction: "asc"})});
    const t = await demarrer({stockage});
    assert.deepEqual(t.tri(), {}, `clé : ${String(key)}`);
    assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE, `clé : ${String(key)}`);
    assert.equal(stockage.brut(CLE_TRI), null, `clé retirée : ${String(key)}`);
  }
});

test("une clé de tri absente du contenu gardé est ignorée et retirée", async () => {
  // Échoue si un objet sans « key » est pris pour un tri valide.
  const stockage = creerStockage({[CLE_TRI]: JSON.stringify({direction: "asc"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.tri(), {});
  assert.equal(stockage.brut(CLE_TRI), null);
});

test("un sens autre que asc ou desc est ignoré et retiré", async () => {
  // Échoue si un sens inconnu (majuscules, mot libre, nombre, vide, absent) est appliqué.
  const sens = ["ASC", "Desc", "up", "descendant", "", 1, true, null, ["asc"]];
  for (const direction of sens) {
    const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key: "statut", direction})});
    const t = await demarrer({stockage});
    assert.deepEqual(t.tri(), {}, `sens : ${JSON.stringify(direction)}`);
    assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE, `sens : ${JSON.stringify(direction)}`);
    assert.equal(stockage.brut(CLE_TRI), null, `sens retiré : ${JSON.stringify(direction)}`);
  }
  const sansSens = creerStockage({[CLE_TRI]: JSON.stringify({key: "statut"})});
  const t = await demarrer({stockage: sansSens});
  assert.deepEqual(t.tri(), {});
  assert.equal(sansSens.brut(CLE_TRI), null);
});

test("un tri gardé avec des champs en trop est restauré sans eux", async () => {
  // Échoue si un champ étranger du stockage entre dans state.sort.
  const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key: "budget", direction: "asc", autre: "x"})});
  const t = await demarrer({stockage});
  assert.deepEqual(t.tri(), {key: "budget", direction: "asc"});
});

// ---------------------------------------------------------------------------
// 8. Chaque clé acceptée est restaurée.
// ---------------------------------------------------------------------------

for (const cle of CLES_TRI) {
  test(`la clé de tri « ${cle} » est restaurée au démarrage, dans les deux sens`, async () => {
    // Échoue si une colonne proposée par les menus n'est pas acceptée par restaurerTri() ou si la liste n'est pas triée.
    for (const direction of ["asc", "desc"]) {
      const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key: cle, direction})});
      const t = await demarrer({stockage});
      assert.deepEqual(t.tri(), {key: cle, direction}, `${cle} ${direction}`);
      assert.equal(stockage.brut(CLE_TRI), JSON.stringify({key: cle, direction}), `${cle} ${direction} : conservé`);
    }
    const t = await demarrer({stockage: creerStockage({[CLE_TRI]: JSON.stringify({key: cle, direction: "desc"})})});
    assert.deepEqual(t.premierOrdreAffiche(), ORDRE_DESC[cle], `${cle} desc : ordre affiché`);
  });
}

test("un tri choisi puis le widget rechargé : le même tri revient (aller-retour complet)", async () => {
  // Échoue si ce que sauverTri() écrit n'est pas ce que restaurerTri() sait relire.
  const stockage = creerStockage();
  for (const cle of CLES_TRI) {
    const avant = await demarrer({stockage});
    avant.trierPar(cle, "desc");
    const apres = await demarrer({stockage});
    assert.deepEqual(apres.tri(), {key: cle, direction: "desc"}, cle);
    assert.deepEqual(apres.premierOrdreAffiche(), ORDRE_DESC[cle], cle);
  }
});

// ---------------------------------------------------------------------------
// 9. Réinitialiser ne touche pas au tri.
// ---------------------------------------------------------------------------

test("Réinitialiser vide les filtres mais ne touche ni à state.sort ni au tri gardé", async () => {
  // Échoue si Réinitialiser efface le tri (en mémoire ou dans le stockage) en même temps que les filtres.
  const stockage = creerStockage({
    [CLE_FILTRES]: JSON.stringify({statut: "Planifiée"}),
    [CLE_TRI]: JSON.stringify({key: "budget", direction: "desc"}),
  });
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Planifiée"});
  assert.deepEqual(t.tri(), {key: "budget", direction: "desc"});

  t.reinitialiser();
  assert.deepEqual(t.filtres(), {});
  assert.equal(stockage.brut(CLE_FILTRES), null);
  assert.deepEqual(t.tri(), {key: "budget", direction: "desc"});
  assert.deepEqual(stockage.lire(CLE_TRI), {key: "budget", direction: "desc"});
  assert.deepEqual(t.ordreAffiche(), ORDRE_DESC.budget, "la liste réaffichée reste triée");
});

test("après Réinitialiser puis un nouveau démarrage, le tri est toujours là et les filtres non", async () => {
  // Échoue si le tri est effacé ou réécrit à vide par Réinitialiser, ou si les filtres reviennent.
  const stockage = creerStockage({
    [CLE_FILTRES]: JSON.stringify({statut: "Planifiée"}),
    [CLE_TRI]: JSON.stringify({key: "statut", direction: "asc"}),
  });
  const premier = await demarrer({stockage});
  premier.reinitialiser();
  const second = await demarrer({stockage});
  assert.deepEqual(second.filtres(), {});
  assert.deepEqual(second.tri(), {key: "statut", direction: "asc"});
  assert.deepEqual(second.premierOrdreAffiche(), [4, 1, 3, 2]);
});

test("un tri choisi pendant la session survit à Réinitialiser", async () => {
  // Échoue si Réinitialiser appelle sauverTri() ou remet state.sort à vide après un tri choisi à la main.
  const t = await demarrer();
  t.choisirSelect("statut", "Planifiée");
  t.trierPar("intitule", "desc");
  t.reinitialiser();
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(t.tri(), {key: "intitule", direction: "desc"});
  assert.deepEqual(t.stockage.lire(CLE_TRI), {key: "intitule", direction: "desc"});
  assert.deepEqual(t.ordreAffiche(), ORDRE_DESC.intitule);
});

// ---------------------------------------------------------------------------
// 10. Plusieurs documents.
// ---------------------------------------------------------------------------

test("Réinitialiser n'efface pas le tri d'un autre document", async () => {
  // Échoue si Réinitialiser vide tout le sessionStorage au lieu de ne toucher qu'aux filtres du document.
  const autre = PREFIXE_TRI + "Document fictif B";
  const stockage = creerStockage({
    [CLE_FILTRES]: JSON.stringify({statut: "Planifiée"}),
    [CLE_TRI]: JSON.stringify({key: "statut", direction: "asc"}),
    [autre]: JSON.stringify({key: "club", direction: "desc"}),
  });
  const t = await demarrer({stockage});
  t.reinitialiser();
  assert.deepEqual(stockage.lire(autre), {key: "club", direction: "desc"});
  assert.deepEqual(stockage.lire(CLE_TRI), {key: "statut", direction: "asc"});
});

test("deux documents de noms différents gardent chacun leur tri, sans mélange", async () => {
  // Échoue si la clé ne contient pas le nom du document : DEV, TEST et PROD partageraient leur tri.
  const stockage = creerStockage();
  const a = await demarrer({stockage, docName: "Document fictif A"});
  a.trierPar("statut", "asc");

  const b = await demarrer({stockage, docName: "Document fictif B"});
  assert.deepEqual(b.tri(), {}, "le document B ne doit pas lire le tri du document A");
  b.trierPar("budget", "desc");

  assert.deepEqual(stockage.lire(PREFIXE_TRI + "Document fictif A"), {key: "statut", direction: "asc"});
  assert.deepEqual(stockage.lire(PREFIXE_TRI + "Document fictif B"), {key: "budget", direction: "desc"});

  const a2 = await demarrer({stockage, docName: "Document fictif A"});
  assert.deepEqual(a2.tri(), {key: "statut", direction: "asc"});
  const b2 = await demarrer({stockage, docName: "Document fictif B"});
  assert.deepEqual(b2.tri(), {key: "budget", direction: "desc"});
});

test("un nom de document qui en contient un autre ne lit pas son tri", async () => {
  // Échoue si la lecture compare par préfixe ou par « contient » au lieu de la clé exacte.
  const stockage = creerStockage({[PREFIXE_TRI + "Doc"]: JSON.stringify({key: "statut", direction: "asc"})});
  const t = await demarrer({stockage, docName: "Doc 2"});
  assert.deepEqual(t.tri(), {});
});

test("effacer le tri d'un document ne touche pas au tri d'un autre", async () => {
  // Échoue si l'effacement retire une clé qui n'est pas celle du document ouvert.
  const autre = PREFIXE_TRI + "Document fictif B";
  const stockage = creerStockage({[autre]: JSON.stringify({key: "club", direction: "asc"})});
  const t = await demarrer({stockage});
  t.trierPar("statut", "asc");
  t.trierPar("statut", "");
  assert.deepEqual(stockage.cles(), [autre]);
});

// ---------------------------------------------------------------------------
// 11. Tri et filtres ensemble.
// ---------------------------------------------------------------------------

test("tri et filtres gardés ensemble : les deux sont restaurés, chacun sous sa clé", async () => {
  // Échoue si l'un des deux écrase l'autre au démarrage ou si le tri passe dans le format des filtres.
  const stockage = creerStockage({
    [CLE_FILTRES]: JSON.stringify({statut: "Planifiée"}),
    [CLE_TRI]: JSON.stringify({key: "budget", direction: "desc"}),
  });
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Planifiée"});
  assert.deepEqual(t.tri(), {key: "budget", direction: "desc"});
  assert.deepEqual(stockage.lire(CLE_FILTRES), {statut: "Planifiée"});
  assert.deepEqual(stockage.lire(CLE_TRI), {key: "budget", direction: "desc"});
  // Planifiée = actions 1 (300) et 3 (200) ; budget décroissant : 1 puis 3.
  assert.deepEqual(t.premierOrdreAffiche(), [1, 3]);
});

test("la clé des filtres ne contient pas le tri, même après un tri et un filtre choisis à la main", async () => {
  // Échoue si sauverFiltres() écrit key/direction/sort, ou si un tri écrase la clé des filtres.
  const t = await demarrer();
  t.choisirSelect("statut", "Planifiée");
  t.trierPar("budget", "asc");
  t.choisirSelect("dr", "Region Nord");
  assert.deepEqual(t.stockage.lire(CLE_FILTRES), {statut: "Planifiée", dr: "Region Nord"});
  assert.deepEqual(t.stockage.lire(CLE_TRI), {key: "budget", direction: "asc"});
  assert.deepEqual(t.stockage.cles().sort(), [CLE_FILTRES, CLE_TRI].sort());
});

test("un filtre périmé retiré au démarrage ne touche pas au tri gardé", async () => {
  // Échoue si le nettoyage des filtres réécrit ou efface le tri.
  const stockage = creerStockage({
    [CLE_FILTRES]: JSON.stringify({club: "Club Disparu", statut: "Réalisée"}),
    [CLE_TRI]: JSON.stringify({key: "club", direction: "asc"}),
  });
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Réalisée"});
  assert.deepEqual(stockage.lire(CLE_TRI), {key: "club", direction: "asc"});
});

test("un tri invalide retiré au démarrage ne touche pas aux filtres gardés", async () => {
  // Échoue si le nettoyage du tri retire aussi la clé des filtres.
  const stockage = creerStockage({
    [CLE_FILTRES]: JSON.stringify({statut: "Planifiée"}),
    [CLE_TRI]: JSON.stringify({key: "inconnue", direction: "asc"}),
  });
  const t = await demarrer({stockage});
  assert.deepEqual(t.filtres(), {statut: "Planifiée"});
  assert.equal(stockage.brut(CLE_TRI), null);
  assert.deepEqual(stockage.lire(CLE_FILTRES), {statut: "Planifiée"});
});

// ---------------------------------------------------------------------------
// 12. sessionStorage cassé ou absent.
// ---------------------------------------------------------------------------

test("sessionStorage cassé au démarrage : le widget s'affiche, sans tri gardé, sans message ni bruit", async () => {
  // Échoue si l'erreur de lecture remonte jusqu'au catch de load() (message à l'écran) ou en console.
  const reference = await demarrer();
  const t = await demarrer({stockage: stockageCasse()});
  assert.deepEqual(t.tri(), {});
  assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE);
  assert.equal(t.elements.get("empty") ? t.elements.get("empty").textContent : "", "");
  assert.deepEqual(t.journal.appels, reference.journal.appels);
  assert.equal(t.journal.appels.filter(([niveau]) => niveau === "error").length, 0);
});

test("sessionStorage cassé à l'écriture : choisir un tri fonctionne quand même, sans bruit", async () => {
  // Échoue si l'exception de setItem/removeItem casse le clic (la liste ne serait pas retriée) ou s'affiche en console.
  const t = await demarrer({stockage: stockageCasse()});
  const avant = t.journal.appels.length;
  assert.doesNotThrow(() => t.trierPar("statut", "asc"));
  assert.deepEqual(t.tri(), {key: "statut", direction: "asc"});
  assert.deepEqual(t.ordreAffiche(), [4, 1, 3, 2]);
  assert.doesNotThrow(() => t.trierPar("statut", ""));
  assert.deepEqual(t.tri(), {});
  assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE);
  assert.equal(t.journal.appels.length, avant);
});

test("sessionStorage cassé : Réinitialiser fonctionne et le tri choisi reste appliqué", async () => {
  // Échoue si l'exception de stockage empêche Réinitialiser de vider les filtres ou fait perdre le tri en mémoire.
  const t = await demarrer({stockage: stockageCasse()});
  t.choisirSelect("statut", "Planifiée");
  t.trierPar("budget", "desc");
  assert.doesNotThrow(() => t.reinitialiser());
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(t.tri(), {key: "budget", direction: "desc"});
});

test("sessionStorage absent du navigateur : le widget fonctionne sans tri gardé", async () => {
  // Échoue si window.sessionStorage indéfini fait planter le démarrage ou un clic de tri.
  const t = await demarrer({stockage: null});
  assert.deepEqual(t.tri(), {});
  assert.deepEqual(t.ordreAffiche(), ORDRE_ORIGINE);
  assert.doesNotThrow(() => t.trierPar("budget", "desc"));
  assert.deepEqual(t.tri(), {key: "budget", direction: "desc"});
  assert.deepEqual(t.ordreAffiche(), ORDRE_DESC.budget);
  assert.equal(t.journal.appels.filter(([niveau]) => niveau === "error").length, 0);
});

// ---------------------------------------------------------------------------
// 13. getDocName() indisponible : aucun tri n'est lu ni écrit.
// ---------------------------------------------------------------------------

test("getDocName() qui échoue : le widget démarre, aucun tri n'est lu ni écrit, même après un clic de tri", async () => {
  // Échoue si, faute de nom, une clé bancale (« …:undefined ») est lue ou écrite et partagée entre documents.
  const stockage = creerStockage({[CLE_TRI]: JSON.stringify({key: "statut", direction: "asc"})});
  const reference = await demarrer();
  const t = await demarrer({stockage, getDocName: () => Promise.reject(new Error("nom indisponible"))});
  assert.deepEqual(t.tri(), {});
  assert.deepEqual(t.journal.appels, reference.journal.appels);
  t.trierPar("budget", "desc");
  t.trierPar("budget", "");
  assert.deepEqual(stockage.cles(), [CLE_TRI], "le tri d'un document n'est pas touché");
  assert.equal(stockage.lectures, 0);
  assert.equal(stockage.ecritures, 0);
  assert.equal(stockage.suppressions, 0);
});

test("getDocName() qui lève une erreur de façon synchrone : aucun tri n'est lu ni écrit", async () => {
  // Échoue si seule l'erreur asynchrone est prévue et qu'une exception directe casse le démarrage ou écrit une clé bancale.
  const t = await demarrer({getDocName: () => { throw new Error("pas d'API"); }});
  assert.deepEqual(t.tri(), {});
  t.trierPar("statut", "asc");
  assert.deepEqual(t.tri(), {key: "statut", direction: "asc"});
  assert.equal(t.stockage.lectures, 0);
  assert.equal(t.stockage.ecritures, 0);
  assert.equal(t.stockage.suppressions, 0);
});

test("getDocName() qui renvoie un nom vide : aucun tri n'est lu ni écrit", async () => {
  // Échoue si un nom vide produit la clé « dashboard-tri-v1: » commune à tous les documents sans nom.
  const stockage = creerStockage({[PREFIXE_TRI]: JSON.stringify({key: "statut", direction: "asc"})});
  const t = await demarrer({stockage, docName: ""});
  assert.deepEqual(t.tri(), {});
  t.trierPar("budget", "desc");
  t.trierPar("budget", "");
  assert.deepEqual(stockage.cles(), [PREFIXE_TRI]);
  assert.equal(stockage.lectures, 0);
  assert.equal(stockage.ecritures, 0);
  assert.equal(stockage.suppressions, 0);
});

test("getDocName() qui renvoie undefined ou null : aucun tri n'est lu ni écrit", async () => {
  // Échoue si « undefined » ou « null » devient un nom de document dans la clé.
  for (const nom of [undefined, null]) {
    const t = await demarrer({getDocName: () => Promise.resolve(nom)});
    assert.deepEqual(t.tri(), {});
    t.trierPar("statut", "asc");
    assert.equal(t.stockage.lectures, 0, String(nom));
    assert.equal(t.stockage.ecritures, 0, String(nom));
  }
});

// ---------------------------------------------------------------------------
// 14. Console.
// ---------------------------------------------------------------------------

test("la console n'affiche rien lié au tri gardé (ni la clé, ni la valeur), même avec des contenus invalides", async () => {
  // Échoue si un console.log/warn/error laisse échapper la clé de stockage ou le contenu du tri.
  const scenarios = [
    JSON.stringify({key: "statut", direction: "asc"}),   // valide
    "pas du json{",                                       // illisible
    JSON.stringify({key: "inconnue", direction: "asc"}), // clé refusée
    JSON.stringify({key: "statut", direction: "haut"}),  // sens refusé
  ];
  for (const brut of scenarios) {
    const t = await demarrer({stockage: creerStockage({[CLE_TRI]: brut})});
    t.trierPar("budget", "desc");
    t.trierPar("budget", "");
    const texte = t.journal.appels.map((appel) => appel.join(" ")).join("\n");
    assert.ok(!texte.includes("dashboard-tri"), `clé dans la console pour : ${brut}`);
    assert.ok(!texte.includes(DOC), `nom du document dans la console pour : ${brut}`);
    assert.ok(!texte.includes(brut), `contenu dans la console pour : ${brut}`);
    assert.ok(!texte.includes("direction"), `valeur dans la console pour : ${brut}`);
  }
});

test("la console reste identique avec et sans tri gardé", async () => {
  // Échoue si garder un tri ajoute un message (avertissement, erreur) que le widget n'écrit pas sans lui.
  const sans = await demarrer();
  const avec = await demarrer({stockage: creerStockage({[CLE_TRI]: JSON.stringify({key: "club", direction: "desc"})})});
  assert.deepEqual(avec.journal.appels, sans.journal.appels);
});

// ---------------------------------------------------------------------------
// 15. Les filtres gardés ne sont pas affectés : voir test/filtres-gardes.test.js,
//     lancé tel quel (ce fichier n'y touche pas). Ici, un garde-fou direct :
// ---------------------------------------------------------------------------

test("le format et la clé des filtres gardés sont inchangés par le tri gardé", async () => {
  // Échoue si l'ajout du tri a changé la clé (dashboard-filtres-v1:) ou le contenu écrit pour les filtres.
  const t = await demarrer();
  t.choisirSelect("statut", "Planifiée");
  assert.deepEqual(t.stockage.cles(), [CLE_FILTRES]);
  assert.deepEqual(t.stockage.lire(CLE_FILTRES), {statut: "Planifiée"});
  assert.equal(trier(t.tri()), "{}");
});
