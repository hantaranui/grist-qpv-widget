"use strict";

// Le contrat de navigation entrante vers le tableau de bord : voir la note en
// tete de src/clubs/script.js (DASHBOARD_URL_STOCKAGE, OUVRIR_ACTION_CLE). Ce
// fichier ne couvre que ce contrat ; la construction de la fiche elle-meme est
// testee dans clubs.test.js.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadClubs, makeLocalStorage} = require("./helpers/clubs");

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

test("sans adresse renseignee, Voir ouvre le reglage plutot qu'un lien mort", () => {
  const w = loadClubs();
  w.state.raw = tables(w);
  w.state.clubs = w.buildClubs(w.state.raw);
  w.state.view = "fiche";
  w.state.currentId = 1;
  w.render();

  const liste = w.elements.get("ficheView").innerHTML;
  assert.match(liste, /<button class="btn btn-secondary btn-sm action-open" type="button" data-configure-action="42">/);
  assert.ok(!liste.includes("data-action-id"), "pas de lien tant que l'adresse manque");

  ouvrirFicheEtAction(w, 42);
  const html = w.elements.get("ficheView").innerHTML;
  assert.match(html, /<input class="form-control" type="text" id="dashboardUrlInput"/);
  assert.match(html, /<button class="btn btn-primary btn-sm" type="button" id="saveDashboardUrl">/);
});

test("l'adresse enregistree, Voir est un vrai lien target=\"_top\", sans detour", () => {
  const w = loadClubs({localStorage: makeLocalStorage({"clubs-dashboard-url-v1": "https://grist.example/o/asso/docs/DOC/p/7"})});
  return w.load().then(() => {
    w.state.raw = tables(w);
    w.state.clubs = w.buildClubs(w.state.raw);
    w.state.view = "fiche";
    w.state.currentId = 1;
    w.render();
    const html = w.elements.get("ficheView").innerHTML;
    assert.match(html, /<a class="btn btn-secondary btn-sm action-open" href="https:\/\/grist\.example\/o\/asso\/docs\/DOC\/p\/7" target="_top" data-action-id="42">/);
  });
});

test("enregistrerAdresseDashboard la conserve dans le navigateur, pas dans une option du widget", () => {
  // grist.setOption existe et semble fait pour cela, mais son implementation
  // cote Grist ne fait que modifier une valeur en memoire, jamais sauvegardee
  // dans le document (constate le 2026-09-29 : perdue au moindre rechargement
  // complet — exactement ce qu'un lien target="_top" declenche). D'ou le
  // stockage du navigateur a la place, qui persiste reellement.
  const w = loadClubs({referrer: ""});
  ouvrirFicheEtAction(w, 42); // affiche le champ de saisie

  w.document.getElementById("dashboardUrlInput").value = "  https://grist.example/p/7  ";
  w.enregistrerAdresseDashboard(42);

  assert.equal(w.localStorage.getItem("clubs-dashboard-url-v1"), "https://grist.example/p/7");
  assert.equal(w.state.dashboardUrl, "https://grist.example/p/7", "repris immediatement, sans attendre un rechargement");
});

test("une adresse complete enregistree enchaine directement vers l'action visee", () => {
  const w = loadClubs({referrer: ""});
  ouvrirFicheEtAction(w, 42);

  w.document.getElementById("dashboardUrlInput").value = "https://grist.example/p/7";
  w.enregistrerAdresseDashboard(42);

  assert.equal(w.top.location.href, "https://grist.example/p/7", "navigue directement, sans repasser par l'ecran de reglage");
  const note = JSON.parse(w.localStorage.getItem("clubs-ouvrir-action-v1"));
  assert.equal(note.actionId, 42, "le tableau de bord sait quelle action ouvrir a son chargement");
});

test("une valeur vide n'ecrase pas une adresse deja enregistree", () => {
  const w = loadClubs({localStorage: makeLocalStorage({"clubs-dashboard-url-v1": "https://grist.example/p/7"})});
  w.state.dashboardUrl = "https://grist.example/p/7";
  w.document.getElementById("dashboardUrlInput").value = "   ";
  w.enregistrerAdresseDashboard(42);

  assert.equal(w.localStorage.getItem("clubs-dashboard-url-v1"), "https://grist.example/p/7");
  assert.equal(w.state.dashboardUrl, "https://grist.example/p/7");
  assert.equal(w.top.location.href, "", "une valeur vide ne declenche aucune navigation");
});

// --- Domaine de Grist deduit du referent, chemin enregistre a part --------------

test("origineGrist ne garde que l'origine du referent, jamais le chemin", () => {
  const w = loadClubs({referrer: "https://grist.example.org/o/asso/docId/NomDuDoc/p/5?x=1"});
  assert.equal(w.origineGrist(), "https://grist.example.org");
});

test("sans referent exploitable, origineGrist ne casse rien", () => {
  assert.equal(loadClubs({referrer: ""}).origineGrist(), "");
  assert.equal(loadClubs({referrer: "pas une url"}).origineGrist(), "");
});

test("un chemin enregistre se complete avec l'origine du referent", () => {
  const w = loadClubs({referrer: "https://grist.example.org/o/asso/docId/NomDuDoc/p/5"});
  w.state.dashboardUrl = "/o/asso/docId/NomDuDoc/p/7";
  assert.equal(w.adresseDashboardComplete(), "https://grist.example.org/o/asso/docId/NomDuDoc/p/7");
});

test("une adresse deja complete est gardee telle quelle, meme sans referent", () => {
  const w = loadClubs({referrer: ""});
  w.state.dashboardUrl = "https://grist.example.org/o/asso/docId/NomDuDoc/p/7";
  assert.equal(w.adresseDashboardComplete(), "https://grist.example.org/o/asso/docId/NomDuDoc/p/7");
});

test("un chemin enregistre sans referent exploitable reste incomplet", () => {
  const w = loadClubs({referrer: ""});
  w.state.dashboardUrl = "/o/asso/docId/NomDuDoc/p/7";
  assert.equal(w.adresseDashboardComplete(), "");
});

test("enregistrerAdresseDashboard ajoute le / manquant d'un chemin colle sans lui", () => {
  const w = loadClubs({referrer: ""}); // sans referent, le chemin seul reste incomplet : pas de navigation a verifier ici
  ouvrirFicheEtAction(w, 42);
  w.document.getElementById("dashboardUrlInput").value = "o/asso/docId/NomDuDoc/p/7";
  w.enregistrerAdresseDashboard(42);
  assert.equal(w.state.dashboardUrl, "/o/asso/docId/NomDuDoc/p/7");
});

test("un chemin enregistre mais incomplet (sans referent) invite a coller l'adresse complete", () => {
  const w = loadClubs({referrer: "", localStorage: makeLocalStorage({"clubs-dashboard-url-v1": "/o/asso/docId/NomDuDoc/p/7"})});
  return w.load().then(() => {
    ouvrirFicheEtAction(w, 42);
    const html = w.elements.get("ficheView").innerHTML;
    assert.ok(!html.includes('data-action-id'), "pas de lien avec une adresse incomplete");
    assert.match(html, /Adresse incomplète/);
  });
});

// --- Chargement de l'adresse au demarrage ----------------------------------------

test("load() reprend l'adresse deja enregistree sur ce navigateur", async () => {
  const w = loadClubs({localStorage: makeLocalStorage({"clubs-dashboard-url-v1": "https://grist.example/p/9"})});
  await w.load();
  assert.equal(w.state.dashboardUrl, "https://grist.example/p/9");
});

test("sans adresse enregistree, elle reste vide plutot qu'indefinie", async () => {
  const w = loadClubs();
  await w.load();
  assert.equal(w.state.dashboardUrl, "");
});

test("un stockage indisponible a la lecture laisse quand meme le reste du chargement aboutir", async () => {
  const w = loadClubs({localStorage: {getItem() { throw new Error("navigation privée"); }, setItem() {}}});
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
