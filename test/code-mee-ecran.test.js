"use strict";

// Sprint E10, tâche 10 : tests des ÉCRANS du filtre et de la colonne « Code MEE »
// (tableau de bord). Les tests de la partie données sont dans test/code-mee.test.js.
// Note UX de référence : docs/ux/filtre-code-mee.md.
//
// Ce que le fichier vérifie :
//   - la colonne MEE dans la liste (en-tête, balise col, cellules, tiret, échappement) ;
//   - le document SANS colonne Code_MEE (rien n'est affiché) ;
//   - le menu de tri MEE (vrai clic sur les boutons de index.html) ;
//   - le bloc du filtre (place, étiquettes, loupe, case) ;
//   - le champ, la case, la restauration au démarrage, Réinitialiser ;
//   - la non-régression du filtre Numéro Osiris.
//
// Méthode : le script du tableau de bord se lance tout seul au chargement (load()).
// Chaque test appelle demarrer(), qui fabrique le widget avec un faux sessionStorage,
// un faux getDocName et des données fictives, puis ATTEND le premier affichage des
// filtres (fin du chargement de départ) avant de vérifier.
//
// Pourquoi un chargeur local plutôt que test/helpers/widget.js : le script branche les
// boutons de tri et lit les colonnes MEE au chargement, avec document.querySelectorAll.
// Dans le helper, cette fonction renvoie toujours une liste vide : on ne pourrait ni
// cliquer sur un bouton de tri ni vérifier que les en-têtes sont montrés ou cachés.
// Ici, ces éléments sont fabriqués à partir du VRAI fichier src/actions-dashboard/index.html,
// et les contrôles du filtre à partir du VRAI HTML écrit par le script (rien n'est
// recopié à la main). Le helper n'est pas modifié ; on lui emprunte makeElement.
//
// Tout est fictif : aucun vrai nom, aucun vrai code, aucun jeton.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const {makeElement} = require("./helpers/widget.js");

const RACINE = path.join(__dirname, "..", "src", "actions-dashboard");
const SCRIPT = path.join(RACINE, "script.js");
const INDEX_HTML = fs.readFileSync(path.join(RACINE, "index.html"), "utf8");

const DOC = "Document fictif MEE écran";
const CLE_FILTRES = "dashboard-filtres-v1:" + DOC;

// Les objets fabriques dans le bac a sable n'ont pas le prototype de l'hote :
// on les ramene a des valeurs simples avant de comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

// ---------------------------------------------------------------------------
// Petits outils de lecture du HTML (le script écrit du HTML en texte).
// ---------------------------------------------------------------------------

function decoder(valeur) {
  return String(valeur)
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#96;/g, "`")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Attributs d'une balise ouvrante : {class: "...", id: "...", disabled: ""}.
function attributs(balise) {
  const resultat = {};
  const corps = balise.replace(/^<\s*[a-zA-Z0-9]+/, "");
  for (const m of corps.matchAll(/([a-zA-Z][\w:-]*)(?:="([^"]*)")?/g)) {
    resultat[m[1]] = m[2] === undefined ? "" : decoder(m[2]);
  }
  return resultat;
}

// Texte visible d'un morceau de HTML (balises retirées).
const enTexte = (html) => decoder(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();

// Un contrôle de formulaire fabriqué à partir de sa balise : l'état de départ (valeur,
// désactivé, coché) vient de ce que le script a RÉELLEMENT écrit dans le HTML.
function controle(balise) {
  const attrs = attributs(balise);
  const ecouteurs = {};
  return {
    attrs, ecouteurs,
    id: attrs.id,
    type: attrs.type,
    value: attrs.value === undefined ? "" : attrs.value,
    disabled: "disabled" in attrs,
    checked: "checked" in attrs,
    dataset: {filterText: attrs["data-filter-text"], filterSubmit: attrs["data-filter-submit"]},
    addEventListener: (type, fonction) => { ecouteurs[type] = fonction; },
  };
}

function declencher(element, type, evenement = {}) {
  assert.equal(typeof element.ecouteurs[type], "function", `aucun écouteur « ${type} » branché sur cet élément`);
  return element.ecouteurs[type](evenement);
}

// ---------------------------------------------------------------------------
// Éléments tirés de index.html (en-têtes, balises col, boutons de tri).
// ---------------------------------------------------------------------------

function elementDepuis(balise) {
  const attrs = attributs(balise);
  const element = makeElement();
  (attrs.class || "").split(/\s+/).filter(Boolean).forEach((nom) => element.classList.add(nom));
  const ecouteurs = {};
  element.reglages = attrs;
  element.ecouteurs = ecouteurs;
  element.addEventListener = (type, fonction) => { ecouteurs[type] = fonction; };
  element.dataset = {sortOption: attrs["data-sort-option"], sortDirection: attrs["data-sort-direction"]};
  return element;
}

function fabriquerIndex() {
  const colgroup = /<colgroup>([\s\S]*?)<\/colgroup>/.exec(INDEX_HTML)[1];
  const thead = /<thead>([\s\S]*?)<\/thead>/.exec(INDEX_HTML)[1];
  const cols = [...colgroup.matchAll(/<col\b[^>]*>/g)].map((m) => elementDepuis(m[0]));
  const ths = [...thead.matchAll(/<th\b[^>]*>[\s\S]*?<\/th>/g)].map((m) => {
    const element = elementDepuis(/<th\b[^>]*>/.exec(m[0])[0]);
    element.html = m[0];
    // Nom de la colonne : premier texte du résumé (en-tête avec tri) ou aria-label (colonne Modifier).
    const span = /<span>([^<]*)<\/span>/.exec(m[0]);
    element.nom = span ? decoder(span[1]) : element.reglages["aria-label"];
    return element;
  });
  const boutonsTri = [...INDEX_HTML.matchAll(/<button\b[^>]*data-sort-option[^>]*>([\s\S]*?)<\/button>/g)].map((m) => {
    const bouton = elementDepuis(/<button\b[^>]*>/.exec(m[0])[0]);
    bouton.libelle = enTexte(m[1]);
    return bouton;
  });
  return {cols, ths, boutonsTri};
}

const estVisible = (element) => !element.classList.contains("is-hidden");

// ---------------------------------------------------------------------------
// Données fictives.
// ---------------------------------------------------------------------------

// Tables fictives (format colonnes de Grist). Avec sansColonne: true, la colonne
// Code_MEE n'existe pas dans le document. Chaque action peut porter une réponse à
// l'appel à projets (reponse : 10 ou 11) pour tester le numéro Osiris.
function tables(actions, {sansColonne = false} = {}) {
  const colonnes = {
    id: actions.map((a) => a.id),
    Intitule: actions.map((a) => `Action ${a.id}`),
    DR: actions.map(() => 1),
    DD: actions.map(() => 1),
    Agence: actions.map((a) => a.agence || 1),
    Club: actions.map((a) => a.club || 1),
    Federation: actions.map(() => 1),
    Dispositif: actions.map(() => 1),
    Statut: actions.map(() => "Planifiée"),
    Reponse_AAP: actions.map((a) => a.reponse || 0),
  };
  if (!sansColonne) colonnes.Code_MEE = actions.map((a) => a.code);
  return {
    Actions: colonnes,
    Reponses_AAP: {id: [10, 11], Numero_Action_Osiris: ["ANS-26-0055-3", "ANS-26-0099-1"]},
    DR: {id: [1], Nom: ["Region Nord"]},
    DD: {id: [1], Nom: ["DD Alpha"]},
    Agences: {id: [1, 2], Libelle_agence: ["AGENCE A1", "AGENCE B1"]},
    Federations: {id: [1], Nom: ["Fed Un"]},
    Structures: {id: [1, 2], Nom: ["Club Un", "Club Deux"]},
    Dispositifs: {id: [1], Dispositif: ["Dispositif Un"]},
  };
}

// Jeu pour les filtres : deux codes réels, trois actions sans code (vide, espaces, null).
const ACTIONS_FILTRE = [
  {id: 1, code: "123456", reponse: 10},
  {id: 2, code: "012345", reponse: 11},
  {id: 3, code: ""},
  {id: 4, code: "   "},
  {id: 5, code: "ab12", reponse: 10},
  {id: 6, code: null},
];
const TOUS = [1, 2, 3, 4, 5, 6];

// Faux sessionStorage : garde le texte RÉELLEMENT écrit, pour vérifier le stockage et
// pas seulement l'état en mémoire.
function creerStockage(initial = {}) {
  const valeurs = new Map(Object.entries(initial).map(([cle, v]) => [cle, typeof v === "string" ? v : JSON.stringify(v)]));
  return {
    getItem: (cle) => (valeurs.has(cle) ? valeurs.get(cle) : null),
    setItem: (cle, valeur) => { valeurs.set(cle, String(valeur)); },
    removeItem: (cle) => { valeurs.delete(cle); },
    cles: () => [...valeurs.keys()],
    lire: (cle) => (valeurs.has(cle) ? JSON.parse(valeurs.get(cle)) : undefined),
  };
}

// ---------------------------------------------------------------------------
// Démarrage du widget.
// ---------------------------------------------------------------------------

async function demarrer(donnees, {gardes, stockage} = {}) {
  const stock = stockage || creerStockage(gardes ? {[CLE_FILTRES]: gardes} : {});
  const index = fabriquerIndex();
  const elements = new Map();

  // Bouton Réinitialiser : on garde l'écouteur que le script y branche.
  const resetBtn = makeElement();
  let clicReset = null;
  resetBtn.addEventListener = (type, fonction) => { if (type === "click") clicReset = fonction; };
  elements.set("resetBtn", resetBtn);

  // Conteneur des filtres : à chaque HTML écrit, on fabrique les contrôles que le script
  // va chercher (champs, boutons, étiquettes), avec leur état de départ lu dans ce HTML.
  const conteneur = makeElement();
  let html = "";
  let champs = [];
  let boutons = [];
  let etiquettes = [];
  let premierAffichage;
  const attente = new Promise((resolve) => { premierAffichage = resolve; });
  Object.defineProperty(conteneur, "innerHTML", {
    get: () => html,
    set: (valeur) => {
      html = String(valeur);
      champs = [...html.matchAll(/<input\b[^>]*>/g)].map((m) => controle(m[0]));
      boutons = [...html.matchAll(/<button\b[^>]*>/g)].map((m) => controle(m[0]));
      etiquettes = [...html.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)].map((m) => ({
        pour: attributs("<label" + m[1] + ">")["for"], texte: enTexte(m[2]),
      }));
      premierAffichage();
    },
  });
  conteneur.querySelectorAll = (selecteur) => {
    if (selecteur === "[data-filter-text]") return champs.filter((c) => c.attrs["data-filter-text"] !== undefined);
    if (selecteur === "[data-filter-submit]") return boutons.filter((b) => b.attrs["data-filter-submit"] !== undefined);
    return [];
  };
  conteneur.querySelector = (selecteur) => {
    const texte = /^\[data-filter-text="([a-z]+)"\]$/.exec(selecteur);
    if (texte) return champs.find((c) => c.attrs["data-filter-text"] === texte[1]) || null;
    if (selecteur.startsWith("#")) return champs.find((c) => c.id === selecteur.slice(1)) || null;
    return null;
  };
  elements.set("filters", conteneur);

  const rows = makeElement();
  elements.set("rows", rows);

  // Le document du bac à sable : seules les recherches par sélecteur utilisées au
  // chargement sont fournies, à partir de index.html.
  const document = {
    getElementById: (id) => elements.get(id) || elements.set(id, makeElement()).get(id),
    querySelector: () => makeElement(),
    querySelectorAll: (selecteur) => {
      if (selecteur === "[data-sort-option]") return index.boutonsTri;
      if (selecteur === "[data-col-mee]") {
        return [...index.ths, ...index.cols].filter((element) => element.reglages["data-col-mee"] !== undefined);
      }
      return [];
    },
    createElement: () => makeElement(),
    addEventListener() {},
    documentElement: {scrollHeight: 0},
    body: makeElement(),
  };

  const localStorage = {getItem: () => null, setItem() {}, removeItem() {}, clear() {}};
  const sandbox = {
    console: {log() {}, warn() {}, error() {}, info() {}},
    localStorage,
    sessionStorage: stock,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: () => {},
    fetch: () => Promise.reject(new Error("réseau indisponible en test")),
    document,
    grist: {
      ready() {},
      setHeight() {},
      docApi: {
        getDocName: () => Promise.resolve(DOC),
        fetchTable: (nom) => Promise.resolve(donnees[nom] || {id: []}),
        getAccessToken: () => Promise.reject(new Error("pas de jeton en test")),
        applyUserActions: () => Promise.resolve({}),
      },
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(SCRIPT, "utf8") + "\n;globalThis.__etat = {state};\n", sandbox, {filename: "script.js"});

  // Garde-fou : le test échoue proprement si le widget n'affiche jamais ses filtres.
  let minuteur;
  const delai = new Promise((_, rejeter) => { minuteur = setTimeout(() => rejeter(new Error("le widget n'a jamais affiché ses filtres")), 3000); });
  try { await Promise.race([attente, delai]); } finally { clearTimeout(minuteur); }

  const champ = (cle) => champs.find((c) => c.attrs["data-filter-text"] === cle);
  const parId = (id) => champs.find((c) => c.id === id);
  return {
    sandbox, index, elements, stockage: stock, state: sandbox.__etat.state,
    html: () => html,
    champs: () => champs,
    boutons: () => boutons,
    etiquettes: () => etiquettes,
    filtres: () => plain(sandbox.__etat.state.filters),
    // Ce qui est affiché dans le tableau.
    htmlLignes: () => rows.innerHTML,
    ids: () => [...rows.innerHTML.matchAll(/data-edit-action="(\d+)"/g)].map((m) => Number(m[1])),
    lignes: () => [...rows.innerHTML.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => ({
      id: Number((/data-edit-action="(\d+)"/.exec(m[1]) || [])[1]),
      cellules: [...m[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1]),
    })),
    // Contrôles du filtre.
    champMee: () => parId("filter-mee"),
    caseMee: () => parId("filter-mee-vide"),
    champOsiris: () => champ("osiris"),
    loupe: (cle) => boutons.find((b) => b.attrs["data-filter-submit"] === cle),
    // Gestes de l'utilisateur.
    entree: (cle) => declencher(champ(cle), "keydown", {key: "Enter", preventDefault() {}}),
    evenementSearch: (cle) => declencher(champ(cle), "search"),
    cliquerLoupe: (cle) => declencher(boutons.find((b) => b.attrs["data-filter-submit"] === cle), "click"),
    cocher: (etat) => {
      const caseACocher = parId("filter-mee-vide");
      caseACocher.checked = etat;
      declencher(caseACocher, "change");
    },
    reinitialiser: () => clicReset(),
    cliquerTri: (option, direction) => {
      const bouton = index.boutonsTri.find((b) => b.dataset.sortOption === option && b.dataset.sortDirection === direction);
      assert.ok(bouton, `bouton de tri introuvable : ${option} ${direction}`);
      declencher(bouton, "click", {currentTarget: bouton});
    },
    // Dessine de nouveau la liste (après avoir changé l'état d'un en-tête).
    redessinerLignes: () => sandbox.renderRows(sandbox.filteredActions()),
  };
}

// Tape un texte dans le champ SANS valider : on déclenche tous les écouteurs branchés
// sur le champ, sauf « search » (Entrée / croix d'effacement), avec une touche ordinaire.
function taper(champ, texte) {
  champ.value = texte;
  for (const [type, ecouteur] of Object.entries(champ.ecouteurs)) {
    if (type === "search") continue;
    ecouteur({key: "1", target: champ, preventDefault() {}});
  }
}

// Texte d'une cellule sans le tiret caché ni le texte pour lecteur d'écran.
const CELLULE_NON_RENSEIGNEE = /^<span aria-hidden="true">—<\/span>\s*<span class="sr-only">Code MEE non renseigné<\/span>$/;

const NOMS_AVEC_MEE = ["Agence", "MEE", "Club", "Action", "Statut", "Financement", "Modifier"];
const NOMS_SANS_MEE = ["Agence", "Club", "Action", "Statut", "Financement", "Modifier"];

// ---------------------------------------------------------------------------
// 1. Colonne MEE dans la liste
// ---------------------------------------------------------------------------

test("colonne : l'en-tête « MEE » est entre Agence et Club, avec son menu de tri", async () => {
  // Échoue si l'en-tête MEE est absent, caché malgré la colonne Code_MEE, déplacé, ou si le bouton de tri n'a pas son nom accessible.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const visibles = t.index.ths.filter(estVisible);
  assert.deepEqual(visibles.map((th) => th.nom), NOMS_AVEC_MEE);
  const entete = visibles[1];
  assert.match(entete.html, /<summary aria-label="Trier la colonne MEE">/);
  assert.match(entete.html, /icon-chevron-up-down/);
});

test("colonne : la balise col-mee est entre col-agency et col-club et elle est visible", async () => {
  // Échoue si la balise col manque ou n'est pas à la bonne place (les largeurs se décaleraient d'une colonne), ou si elle reste cachée.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const classes = t.index.cols.filter(estVisible).map((col) => col.reglages.class.split(/\s+/)[0]);
  assert.deepEqual(classes, ["col-agency", "col-mee", "col-club", "col-action", "col-status", "col-finance", "col-edit"]);
});

test("colonne : dans chaque ligne, la cellule MEE est sous l'en-tête MEE, sans décalage", async () => {
  // Échoue si la cellule MEE est insérée à une autre place que l'en-tête (code sous Club, Agence ou Action), ou si une ligne a plus ou moins de cellules que d'en-têtes.
  const actions = [
    {id: 1, code: "QZ-4471", agence: 1, club: 1},
    {id: 2, code: "", agence: 2, club: 2},
  ];
  const t = await demarrer(tables(actions));
  const visibles = t.index.ths.filter(estVisible);
  const rang = visibles.findIndex((th) => th.nom === "MEE");
  assert.equal(rang, 1, "l'en-tête MEE est la 2e colonne");
  const lignes = t.lignes();
  assert.equal(lignes.length, 2);
  for (const ligne of lignes) {
    assert.equal(ligne.cellules.length, visibles.length, `ligne ${ligne.id} : autant de cellules que d'en-têtes`);
  }
  const ligne1 = lignes.find((l) => l.id === 1).cellules;
  assert.equal(ligne1[rang], "QZ-4471", "le code est sous l'en-tête MEE");
  ligne1.forEach((cellule, i) => {
    if (i !== rang) assert.ok(!cellule.includes("QZ-4471"), `le code ne doit pas être dans la colonne ${visibles[i].nom}`);
  });
  assert.ok(ligne1[0].includes("AGENCE A1"), "la colonne Agence reste la première");
  assert.ok(ligne1[2].includes("Club Un"), "la colonne Club suit directement la colonne MEE");
  const ligne2 = lignes.find((l) => l.id === 2).cellules;
  assert.match(ligne2[rang], CELLULE_NON_RENSEIGNEE, "l'absence de code est dite sous l'en-tête MEE");
});

test("colonne : un code présent est affiché tel quel, et échappé (esperluette, crochets)", async () => {
  // Échoue si le code est écrit sans échappement (l'esperluette resterait brute), retouché (zéro de tête perdu) ou omis.
  const actions = [
    {id: 1, code: "A&B-[7]"},
    {id: 2, code: "012345"},
  ];
  const t = await demarrer(tables(actions));
  const lignes = t.lignes();
  assert.equal(lignes.find((l) => l.id === 1).cellules[1], "A&amp;B-[7]");
  assert.equal(lignes.find((l) => l.id === 2).cellules[1], "012345");
  assert.ok(!t.htmlLignes().includes("A&B-[7]"), "aucune esperluette brute dans le HTML écrit");
});

test("colonne : code vide, absent ou fait d'espaces = tiret caché au lecteur d'écran + texte « Code MEE non renseigné »", async () => {
  // Échoue si le tiret n'est pas en aria-hidden="true", si le texte sr-only manque ou change, si un tiret visible reste hors du span caché, ou si des espaces seuls sont pris pour un code.
  const actions = [
    {id: 1, code: ""},
    {id: 2, code: "   "},
    {id: 3, code: null},
    {id: 4, code: " \t "},
    {id: 5, code: "123456"},
  ];
  const t = await demarrer(tables(actions));
  const lignes = t.lignes();
  for (const id of [1, 2, 3, 4]) {
    const cellule = lignes.find((l) => l.id === id).cellules[1];
    assert.match(cellule, CELLULE_NON_RENSEIGNEE, `action ${id}`);
    const resteVisible = cellule
      .replace(/<span aria-hidden="true">[^<]*<\/span>/, "")
      .replace(/<span class="sr-only">[^<]*<\/span>/, "")
      .trim();
    assert.equal(resteVisible, "", `action ${id} : rien d'autre que le tiret caché et le texte sr-only`);
  }
  const avecCode = lignes.find((l) => l.id === 5).cellules[1];
  assert.equal(avecCode, "123456");
  assert.ok(!avecCode.includes("sr-only"), "un code présent n'a ni tiret ni texte sr-only");
});

// ---------------------------------------------------------------------------
// 2. Colonne Code_MEE absente du document
// ---------------------------------------------------------------------------

test("sans colonne Code_MEE : l'en-tête et la balise col MEE sont cachés (même s'ils ne l'étaient plus)", async () => {
  // Échoue si renderRows() ne recache pas l'en-tête et la col MEE quand la colonne n'existe pas.
  const t = await demarrer(tables(ACTIONS_FILTRE, {sansColonne: true}));
  // On retire d'abord la classe cachée, comme après un affichage avec la colonne : le rendu doit la remettre.
  [...t.index.ths, ...t.index.cols]
    .filter((element) => element.reglages["data-col-mee"] !== undefined)
    .forEach((element) => element.classList.remove("is-hidden"));
  t.redessinerLignes();
  assert.deepEqual(t.index.ths.filter(estVisible).map((th) => th.nom), NOMS_SANS_MEE);
  assert.deepEqual(
    t.index.cols.filter(estVisible).map((col) => col.reglages.class.split(/\s+/)[0]),
    ["col-agency", "col-club", "col-action", "col-status", "col-finance", "col-edit"]
  );
});

test("sans colonne Code_MEE : aucune cellule MEE, autant de cellules par ligne que d'en-têtes visibles", async () => {
  // Échoue si une cellule MEE (ou un tiret) est écrite sans la colonne, ce qui décalerait toutes les cellules sous le mauvais en-tête.
  const t = await demarrer(tables(ACTIONS_FILTRE, {sansColonne: true}));
  const visibles = t.index.ths.filter(estVisible);
  assert.equal(visibles.length, 6);
  const lignes = t.lignes();
  assert.equal(lignes.length, ACTIONS_FILTRE.length);
  for (const ligne of lignes) {
    assert.equal(ligne.cellules.length, visibles.length, `ligne ${ligne.id}`);
  }
  assert.ok(!t.htmlLignes().includes("cell-mee"), "aucune cellule de classe cell-mee");
  assert.ok(!t.htmlLignes().includes("Code MEE non renseigné"), "aucun texte « non renseigné »");
  assert.ok(lignes[0].cellules[1].includes("Club Un"), "la 2e cellule est celle du club, directement après l'agence");
});

// ---------------------------------------------------------------------------
// 3. Menu de tri MEE
// ---------------------------------------------------------------------------

test("tri : le menu de la colonne MEE propose Croissant et Décroissant avec data-sort-option=\"codeMee\"", async () => {
  // Échoue si un bouton manque, si l'option n'est pas codeMee, ou si les libellés sont ceux du texte (A-Z / Z-A) au lieu de ceux des nombres.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const mee = t.index.boutonsTri.filter((b) => b.dataset.sortOption === "codeMee");
  assert.deepEqual(
    mee.map((b) => [b.dataset.sortDirection, b.libelle]),
    [["asc", "Croissant"], ["desc", "Décroissant"]]
  );
  // Les deux boutons sont bien dans l'en-tête MEE (et pas dans un autre).
  const enteteMee = t.index.ths.find((th) => th.nom === "MEE");
  assert.equal([...enteteMee.html.matchAll(/data-sort-option="codeMee"/g)].length, 2);
});

const ACTIONS_TRI = [
  {id: 1, code: "10"},
  {id: 2, code: "9"},
  {id: 3, code: ""},
  {id: 4, code: "100"},
  {id: 5, code: "   "},
  {id: 6, code: "2"},
];

test("tri : un clic sur Croissant range 2, 9, 10, 100 (9 avant 10) et laisse les actions sans code en fin", async () => {
  // Échoue si le tri est alphabétique (10 avant 9), si le bouton n'est pas branché, ou si les actions sans code passent devant.
  const t = await demarrer(tables(ACTIONS_TRI));
  t.cliquerTri("codeMee", "asc");
  const ids = t.ids();
  assert.deepEqual(ids.slice(0, 4), [6, 2, 1, 4]);
  assert.deepEqual(ids.slice(4).sort(), [3, 5], "les deux actions sans code sont en fin");
  assert.deepEqual(plain(t.state.sort), {key: "codeMee", direction: "asc"});
});

test("tri : un clic sur Décroissant range 100, 10, 9, 2 et laisse AUSSI les actions sans code en fin", async () => {
  // Échoue si les actions sans code remontent en tête en décroissant (sens inversé en bloc), ou si 9 passe avant 10.
  const t = await demarrer(tables(ACTIONS_TRI));
  t.cliquerTri("codeMee", "desc");
  const ids = t.ids();
  assert.deepEqual(ids.slice(0, 4), [4, 1, 2, 6]);
  assert.deepEqual(ids.slice(4).sort(), [3, 5], "les deux actions sans code sont en fin");
});

// ---------------------------------------------------------------------------
// 4. Bloc du filtre
// ---------------------------------------------------------------------------

test("filtre : le bloc « Code MEE » est placé après Numéro Osiris et avant Direction régionale (DR)", async () => {
  // Échoue si le bloc est ailleurs (après la DR, tout en bas, tout en haut).
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const html = t.html();
  const osiris = html.indexOf('for="filter-osiris"');
  const mee = html.indexOf('for="filter-mee"');
  const caseMee = html.indexOf('for="filter-mee-vide"');
  const dr = html.indexOf('for="filter-dr"');
  assert.ok(osiris >= 0 && mee >= 0 && caseMee >= 0 && dr >= 0, "les quatre étiquettes existent");
  assert.ok(osiris < mee, "Code MEE après Numéro Osiris");
  assert.ok(mee < caseMee, "la case suit le champ dans le même bloc");
  assert.ok(caseMee < dr, "la case est avant Direction régionale (DR)");
  // Dans l'ordre du clavier : champ Osiris, sa loupe, champ MEE, sa loupe, case, puis la DR.
  assert.deepEqual(
    t.etiquettes().map((e) => e.pour).slice(0, 4),
    ["filter-osiris", "filter-mee", "filter-mee-vide", "filter-dr"]
  );
});

test("filtre : l'étiquette « Code MEE » est reliée au champ (for/id), de type search, avec l'aide « Rechercher »", async () => {
  // Échoue si for et id ne correspondent plus, si le type n'est plus search, si l'aide change, ou si l'id n'est pas unique.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const etiquette = t.etiquettes().find((e) => e.texte === "Code MEE");
  assert.ok(etiquette, "étiquette « Code MEE »");
  assert.equal(etiquette.pour, "filter-mee");
  const champ = t.champMee();
  assert.ok(champ, "champ d'id filter-mee");
  assert.equal(champ.type, "search");
  assert.equal(champ.attrs.placeholder, "Rechercher");
  assert.equal(champ.attrs.name, "filter-mee");
  assert.equal(champ.attrs["data-filter-text"], "mee");
  assert.equal(t.champs().filter((c) => c.id === "filter-mee").length, 1, "id unique");
});

test("filtre : la loupe porte l'aria-label « Lancer la recherche par Code MEE » et son image est cachée au lecteur d'écran", async () => {
  // Échoue si la loupe n'a pas de nom accessible, si elle n'est pas rattachée à mee, ou si le dessin n'est pas en aria-hidden.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const loupe = t.loupe("mee");
  assert.ok(loupe, "bouton data-filter-submit=\"mee\"");
  assert.equal(loupe.attrs["aria-label"], "Lancer la recherche par Code MEE");
  assert.equal(loupe.attrs.title, "Chercher");
  assert.equal(loupe.attrs.type, "button");
  const bouton = /<button\b[^>]*data-filter-submit="mee"[^>]*>([\s\S]*?)<\/button>/.exec(t.html());
  assert.match(bouton[1], /<svg\b[^>]*aria-hidden="true"[^>]*focusable="false"/);
});

test("filtre : la case « Sans code MEE » est reliée à sa propre étiquette, et décochée au départ", async () => {
  // Échoue si la case reprend l'étiquette du champ, si for/id sont décalés, si le type n'est plus checkbox ou si elle part cochée.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  const caseMee = t.caseMee();
  assert.ok(caseMee, "case d'id filter-mee-vide");
  assert.equal(caseMee.type, "checkbox");
  assert.equal(caseMee.checked, false);
  const etiquette = t.etiquettes().find((e) => e.pour === "filter-mee-vide");
  assert.ok(etiquette, "une étiquette est reliée à la case");
  assert.equal(etiquette.texte, "Sans code MEE");
  assert.equal(t.champMee().disabled, false, "le champ est actif au départ");
});

test("sans colonne Code_MEE : ni champ, ni loupe, ni case, ni étiquette « Code MEE » (le filtre Osiris reste là)", async () => {
  // Échoue si un élément du bloc est écrit quand la colonne n'existe pas. La présence d'Osiris et de la DR prouve que les filtres sont bien dessinés.
  const t = await demarrer(tables(ACTIONS_FILTRE, {sansColonne: true}));
  const html = t.html();
  assert.ok(html.includes('id="filter-osiris"'), "le filtre Numéro Osiris est dessiné");
  assert.ok(html.includes('for="filter-dr"'), "le filtre DR est dessiné");
  assert.ok(!html.includes("filter-mee"), "aucun id filter-mee ni filter-mee-vide");
  assert.ok(!html.includes('data-filter-text="mee"'));
  assert.ok(!html.includes('data-filter-submit="mee"'));
  assert.ok(!html.includes("Code MEE"));
  assert.ok(!html.includes("Sans code MEE"));
  assert.equal(t.champMee(), undefined);
  assert.equal(t.caseMee(), undefined);
});

// ---------------------------------------------------------------------------
// 5. Champ du code
// ---------------------------------------------------------------------------

test("champ : appliqué sur Entrée, et écrit dans sessionStorage", async () => {
  // Échoue si Entrée n'est pas branchée, si la liste n'est pas réduite au code exact, ou si la valeur n'arrive pas dans le stockage.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  assert.deepEqual(t.ids(), TOUS, "au départ, toutes les actions");
  t.champMee().value = "123456";
  t.entree("mee");
  assert.deepEqual(t.ids(), [1]);
  assert.deepEqual(t.filtres(), {mee: "123456"});
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"mee":"123456"}');
});

test("champ : appliqué sur l'événement « search » (croix d'effacement ou Entrée du navigateur)", async () => {
  // Échoue si l'écouteur « search » n'est pas branché sur le champ MEE.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.champMee().value = "012345";
  t.evenementSearch("mee");
  assert.deepEqual(t.ids(), [2], "le zéro de tête compte : 012345 n'est pas 12345");
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"mee":"012345"}');
});

test("champ : appliqué sur un clic de la loupe", async () => {
  // Échoue si la loupe MEE n'est pas branchée sur le filtre (clic sans effet).
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.champMee().value = "ab12";
  t.cliquerLoupe("mee");
  assert.deepEqual(t.ids(), [5]);
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"mee":"ab12"}');
});

test("champ : taper sans valider n'applique PAS le filtre (ni liste, ni état, ni stockage)", async () => {
  // Échoue si le filtre s'applique à la frappe (écouteur input, keydown ou keyup) : la liste serait recalculée à chaque touche.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  // Le stockage est relu AVANT la frappe (il peut valoir null ou « {} » selon le démarrage) :
  // la frappe seule ne doit rien y changer, quelle que soit cette valeur de départ.
  const avant = t.stockage.getItem(CLE_FILTRES);
  taper(t.champMee(), "123456");
  assert.equal(t.champMee().value, "123456", "le texte tapé reste dans le champ");
  assert.deepEqual(t.ids(), TOUS, "la liste n'a pas changé");
  assert.deepEqual(t.filtres(), {});
  assert.strictEqual(t.stockage.getItem(CLE_FILTRES), avant, "rien n'est écrit dans le stockage pendant la frappe");
});

test("champ : les espaces autour du code sont retirés (état et stockage)", async () => {
  // Échoue si le code est gardé avec ses espaces : le stockage contiendrait « 123456 » entouré d'espaces et la restauration ne retrouverait pas le même texte.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.champMee().value = "   123456  ";
  t.entree("mee");
  assert.deepEqual(t.ids(), [1]);
  assert.deepEqual(t.filtres(), {mee: "123456"});
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"mee":"123456"}');
});

test("champ : vidé (ou rempli d'espaces seuls) puis validé, le filtre est retiré partout", async () => {
  // Échoue si un champ vidé laisse l'ancien code dans state.filters ou dans le stockage, ou si des espaces seuls filtrent les actions sans code.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.champMee().value = "123456";
  t.entree("mee");
  assert.deepEqual(t.ids(), [1]);

  t.champMee().value = "";
  t.entree("mee");
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(t.ids(), TOUS);
  assert.equal(t.stockage.getItem(CLE_FILTRES), "{}");

  t.champMee().value = "123456";
  t.cliquerLoupe("mee");
  assert.deepEqual(t.ids(), [1]);
  t.champMee().value = "    ";
  t.cliquerLoupe("mee");
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(t.ids(), TOUS);
  assert.equal(t.stockage.getItem(CLE_FILTRES), "{}");
});

// ---------------------------------------------------------------------------
// 6. Case « Sans code MEE »
// ---------------------------------------------------------------------------

test("case : cochée, la liste ne garde que les actions sans code, le champ est vidé et désactivé, la clé « mee » est retirée", async () => {
  // Échoue si la case n'est pas appliquée dès le clic, si le champ garde son texte ou reste actif, si l'ancien code reste dans le stockage, ou si meeVide n'est pas écrit.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.champMee().value = "123456";
  t.entree("mee");
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"mee":"123456"}', "départ : un code est gardé");

  t.cocher(true);
  assert.deepEqual(t.ids().sort(), [3, 4, 6], "seulement les actions sans code (vide, espaces, null)");
  assert.equal(t.champMee().value, "", "champ vidé");
  assert.equal(t.champMee().disabled, true, "champ désactivé");
  assert.deepEqual(t.filtres(), {meeVide: "oui"}, "la clé mee est retirée de l'état");
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"meeVide":"oui"}', "texte réellement écrit dans sessionStorage");
});

test("case : décochée, le champ est réactivé et vide, la clé « meeVide » est retirée, toute la liste revient", async () => {
  // Échoue si le champ reste désactivé ou garde un texte, si meeVide reste dans le stockage (la case réapparaîtrait cochée), ou si la liste reste réduite.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.cocher(true);
  assert.equal(t.champMee().disabled, true);

  t.cocher(false);
  assert.equal(t.champMee().disabled, false, "champ réactivé");
  assert.equal(t.champMee().value, "", "champ vide");
  assert.deepEqual(t.filtres(), {});
  assert.deepEqual(t.ids(), TOUS);
  assert.equal(t.stockage.getItem(CLE_FILTRES), "{}");
});

// ---------------------------------------------------------------------------
// 7. Restauration au démarrage
// ---------------------------------------------------------------------------

test("restauration : « meeVide » gardé = case cochée, champ désactivé et vide dès le premier affichage, liste réduite", async () => {
  // Échoue si la restauration oublie de cocher la case ou de désactiver le champ dans le HTML, ou si la liste n'est pas réduite.
  const t = await demarrer(tables(ACTIONS_FILTRE), {gardes: {meeVide: "oui"}});
  assert.equal(t.caseMee().checked, true, "case cochée");
  assert.equal(t.champMee().disabled, true, "champ désactivé");
  assert.equal(t.champMee().value, "", "champ vide");
  assert.deepEqual(t.ids().sort(), [3, 4, 6]);
  assert.deepEqual(t.filtres(), {meeVide: "oui"});
});

test("restauration : « mee » gardé = champ rempli avec cette valeur, actif, case décochée, liste réduite", async () => {
  // Échoue si la valeur gardée n'est pas remise dans le champ, si le champ est désactivé ou la case cochée à tort.
  const t = await demarrer(tables(ACTIONS_FILTRE), {gardes: {mee: "123456"}});
  assert.equal(t.champMee().value, "123456");
  assert.equal(t.champMee().disabled, false);
  assert.equal(t.caseMee().checked, false);
  assert.deepEqual(t.ids(), [1]);
  assert.deepEqual(t.filtres(), {mee: "123456"});
});

test("restauration : si le code ET la case sont gardés ensemble, la case l'emporte (champ vide et désactivé)", async () => {
  // Échoue si les deux sont restaurés (résultat toujours vide) ou si le champ garde le code (règle du point 4 de la note UX).
  const t = await demarrer(tables(ACTIONS_FILTRE), {gardes: {mee: "123456", meeVide: "oui"}});
  assert.equal(t.caseMee().checked, true);
  assert.equal(t.champMee().disabled, true);
  assert.equal(t.champMee().value, "");
  assert.deepEqual(t.filtres(), {meeVide: "oui"});
  assert.deepEqual(t.ids().sort(), [3, 4, 6]);
});

// ---------------------------------------------------------------------------
// 8. Réinitialiser
// ---------------------------------------------------------------------------

test("Réinitialiser après un code : champ vide et actif, case décochée, plus aucune clé dans sessionStorage", async () => {
  // Échoue si le champ garde son texte, si le stockage garde « mee », ou si la liste reste réduite.
  const t = await demarrer(tables(ACTIONS_FILTRE), {gardes: {mee: "123456"}});
  assert.equal(t.champMee().value, "123456", "départ : le code est affiché");
  t.reinitialiser();
  assert.equal(t.champMee().value, "", "champ vide");
  assert.equal(t.champMee().disabled, false, "champ actif");
  assert.equal(t.caseMee().checked, false, "case décochée");
  assert.deepEqual(t.ids(), TOUS);
  assert.equal(t.stockage.getItem(CLE_FILTRES), null);
  assert.deepEqual(t.stockage.cles(), [], "aucune clé, donc aucune clé MEE");
});

test("Réinitialiser après la case : champ réactivé et vide, case décochée, plus aucune clé dans sessionStorage", async () => {
  // Échoue si le champ reste désactivé, si la case reste cochée, ou si « meeVide » reste dans le stockage (la case reviendrait cochée au prochain chargement).
  const t = await demarrer(tables(ACTIONS_FILTRE), {gardes: {meeVide: "oui"}});
  assert.equal(t.caseMee().checked, true, "départ : case cochée");
  assert.equal(t.champMee().disabled, true, "départ : champ désactivé");
  t.reinitialiser();
  assert.equal(t.champMee().disabled, false, "champ réactivé");
  assert.equal(t.champMee().value, "", "champ vide");
  assert.equal(t.caseMee().checked, false, "case décochée");
  assert.deepEqual(t.ids(), TOUS);
  assert.equal(t.stockage.getItem(CLE_FILTRES), null);
  assert.deepEqual(t.stockage.cles(), []);
});

// ---------------------------------------------------------------------------
// 9. Non-régression : filtre Numéro Osiris
// ---------------------------------------------------------------------------

test("Osiris (non-régression) : la recherche est toujours « contient », sans majuscules, écrite sous la clé « osiris »", async () => {
  // Échoue si l'ajout du filtre MEE a cassé Osiris : recherche devenue exacte, casse prise en compte, clé changée, ou écouteur perdu.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  assert.ok(t.champOsiris(), "le champ Osiris existe toujours");

  t.champOsiris().value = "0055";
  t.cliquerLoupe("osiris");
  assert.deepEqual(t.ids(), [1, 5], "« 0055 » est contenu dans ANS-26-0055-3 (actions 1 et 5)");
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"osiris":"0055"}');

  t.champOsiris().value = "ans-26-0099";
  t.entree("osiris");
  assert.deepEqual(t.ids(), [2], "sans tenir compte des majuscules");
  assert.equal(t.stockage.getItem(CLE_FILTRES), '{"osiris":"ans-26-0099"}');

  t.champOsiris().value = "";
  t.cliquerLoupe("osiris");
  assert.deepEqual(t.ids(), TOUS);
  assert.equal(t.stockage.getItem(CLE_FILTRES), "{}");
});

test("Osiris et MEE se combinent : chaque filtre garde sa propre clé et réduit la liste de l'autre", async () => {
  // Échoue si un filtre efface l'autre (même clé, même champ) ou si les deux ne s'appliquent pas ensemble.
  const t = await demarrer(tables(ACTIONS_FILTRE));
  t.champOsiris().value = "0055";
  t.cliquerLoupe("osiris");
  t.champMee().value = "ab12";
  t.cliquerLoupe("mee");
  assert.deepEqual(t.ids(), [5], "Osiris 0055 (actions 1 et 5) ET code ab12 (action 5)");
  assert.deepEqual(t.filtres(), {osiris: "0055", mee: "ab12"});
  assert.deepEqual(t.stockage.lire(CLE_FILTRES), {osiris: "0055", mee: "ab12"});
});
