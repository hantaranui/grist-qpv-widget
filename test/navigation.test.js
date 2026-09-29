"use strict";

// Le contrat de navigation entrante vers le tableau de bord : voir la note en
// tete de src/clubs/script.js (DASHBOARD_URL_OPTION, OUVRIR_ACTION_CLE). Ce
// fichier ne couvre que ce contrat ; la construction de la fiche elle-meme est
// testee dans clubs.test.js.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadClubs} = require("./helpers/clubs");

// Un objet construit dans le bac a sable n'est pas, aux yeux de assert, de la
// meme "classe" qu'un litteral ecrit ici : le passage par JSON les ramene tous
// deux a des valeurs ordinaires avant comparaison.
const plain = (value) => JSON.parse(JSON.stringify(value));

function columns(records) {
  const table = {id: records.map((record) => record.id)};
  const keys = new Set(records.flatMap((record) => Object.keys(record)));
  keys.delete("id");
  for (const key of keys) table[key] = records.map((record) => (key in record ? record[key] : null));
  return table;
}

// Un seul club, une seule action : suffisant pour ce contrat, la construction
// complete de la fiche a deja son propre jeu de donnees dans clubs.test.js.
function tables(w) {
  const raw = {
    Structures: [{id: 1, Nom: "Club Alpha", SIRET: "", Adresse: "", Code_postal: "", Code_Insee: "", DD: null, Logo: null}],
    DD: [], DR: [], Communes: [], Federations: [], Dispositifs: [],
    Contacts: [],
    Actions: [{id: 42, Club: 1, Intitule: "Tournoi"}],
    Cofinancements: [],
  };
  return Object.fromEntries(Object.entries(raw).map(([name, records]) => [name, w.rows(columns(records))]));
}

function ouvrirFicheEtAction(w, actionId) {
  w.state.raw = tables(w);
  w.state.clubs = w.buildClubs(w.state.raw);
  w.state.view = "fiche";
  w.state.currentId = 1;
  w.state.actionId = actionId;
  w.render();
}

// --- Ecriture de la note --------------------------------------------------------

test("noterOuvertureAction ecrit la cle et la forme exactes du contrat", () => {
  const w = loadClubs();
  const avant = Date.now();
  w.noterOuvertureAction(42);
  const apres = Date.now();

  const brut = w.localStorage.getItem("clubs-ouvrir-action-v1");
  assert.ok(brut, "la cle exacte attendue par le tableau de bord");
  const note = JSON.parse(brut);
  assert.equal(note.actionId, 42);
  assert.ok(note.ts >= avant && note.ts <= apres, "horodatage au moment de l'ecriture");
});

test("un stockage indisponible n'empeche pas la fonction de rendre la main", () => {
  const w = loadClubs({
    localStorage: {
      setItem() { throw new Error("stockage plein ou navigation privée"); },
      getItem: () => null,
    },
  });
  assert.doesNotThrow(() => w.noterOuvertureAction(42));
});

// --- Lien vers le tableau de bord, ou reglage a defaut --------------------------

test("sans adresse renseignee, la fiche propose de la saisir plutot qu'un lien mort", () => {
  const w = loadClubs();
  ouvrirFicheEtAction(w, 42);

  const html = w.elements.get("ficheView").innerHTML;
  assert.ok(!html.includes("id=\"openInDashboard\""), "pas de lien tant que l'adresse manque");
  assert.match(html, /<input class="form-control" type="url" id="dashboardUrlInput"/);
  assert.match(html, /<button class="btn btn-primary btn-sm" type="button" id="saveDashboardUrl">/);
});

test("l'adresse enregistree, la fiche montre un vrai lien target=\"_top\"", () => {
  const w = loadClubs({options: {dashboardPageUrl: "https://grist.example/o/asso/docs/DOC/p/7"}});
  return w.load().then(() => {
    ouvrirFicheEtAction(w, 42);
    const html = w.elements.get("ficheView").innerHTML;
    assert.match(html, /<a class="btn btn-secondary btn-sm" id="openInDashboard" href="https:\/\/grist\.example\/o\/asso\/docs\/DOC\/p\/7" target="_top" data-action-id="42">/);
  });
});

test("enregistrerAdresseDashboard sauvegarde le reglage du widget, pas une donnee du document", async () => {
  const w = loadClubs();
  ouvrirFicheEtAction(w, 42); // affiche le champ de saisie

  w.document.getElementById("dashboardUrlInput").value = "  https://grist.example/p/7  ";
  await w.enregistrerAdresseDashboard();

  assert.deepEqual(w.calls.setOptions, [{key: "dashboardPageUrl", value: "https://grist.example/p/7"}]);
  assert.equal(w.state.dashboardUrl, "https://grist.example/p/7", "repris immediatement, sans attendre un rechargement");
});

test("une valeur vide n'ecrase pas un reglage deja enregistre", async () => {
  const w = loadClubs();
  w.state.dashboardUrl = "https://grist.example/p/7";
  w.document.getElementById("dashboardUrlInput").value = "   ";
  await w.enregistrerAdresseDashboard();

  assert.deepEqual(w.calls.setOptions, []);
  assert.equal(w.state.dashboardUrl, "https://grist.example/p/7");
});

// --- Chargement du reglage au demarrage ------------------------------------------

test("load() reprend l'adresse deja enregistree pour ce widget", async () => {
  const w = loadClubs({options: {dashboardPageUrl: "https://grist.example/p/9"}});
  await w.load();
  assert.equal(w.state.dashboardUrl, "https://grist.example/p/9");
});

test("sans reglage enregistre, l'adresse reste vide plutot qu'indefinie", async () => {
  const w = loadClubs();
  await w.load();
  assert.equal(w.state.dashboardUrl, "");
});

test("un widget qui refuse getOption laisse quand meme le reste du chargement aboutir", async () => {
  const w = loadClubs({grist: {getOption: () => Promise.reject(new Error("option indisponible"))}});
  await w.load();
  assert.equal(w.state.dashboardUrl, "");
  assert.deepEqual(plain(w.state.unreadable), [], "le chargement des tables a bien abouti");
  assert.ok(w.state.readAccess, "le jeton de lecture aussi");
});

// --- Feuille de style ------------------------------------------------------------

test("le bouton Enregistrer ne retrecit pas au point de couper son propre texte", () => {
  const css = require("node:fs").readFileSync(
    require("node:path").join(__dirname, "..", "src", "clubs", "style.css"), "utf8");
  // Constate une fois : sans cette regle, le champ (flex: 1 1 auto) grignotait
  // aussi la largeur du bouton voisin, jusqu'a rogner « Enregistrer ».
  assert.match(css, /\.dashboard-setting-row \.btn \{\s*flex: 0 0 auto;/);
});
