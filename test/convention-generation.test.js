"use strict";

// Rattachement du PDF genere a la convention (tache 7.3) : apres l'envoi du fichier,
// PDF_genere et Date_generation s'ecrivent par l'API REST, en UNE requete PATCH, avec le
// meme jeton que l'envoi. grist.docApi.applyUserActions echoue pour un non-proprietaire
// (bug vu dans DEV7 avec « Voir en tant que » FT Regional) : il ne doit plus toucher a
// ces deux colonnes. Ces tests ECHOUENT tant que cette correction n'est pas faite.
// Le bac a sable de test/helpers/widget.js n'a ni FormData, ni Blob, ni clearTimeout, et
// son getAccessToken refuse : les doublures sont posees ici, sur w.window (le vrai global
// du bac a sable ; w n'en est qu'une copie). pdfmake n'est jamais charge pour de vrai.
// Valeurs fictives uniquement : le jeton et l'adresse ci-dessous n'existent pas.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const JETON = "jeton-fictif-0a1b2c3d";
const BASE_URL = "https://grist.exemple.test/api/docs/document-fictif";
const REPONSE_SECRETE = "TEXTE-DE-REPONSE-A-NE-PAS-RECOPIER";
const ID_PIECE_JOINTE = 42;
const ID_CONVENTION = 9;

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true, Contenu: "Texte de convention fictif."};
const CONTACTS = [{id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"}];

// Ce que lireConventionForm donne au clic sur « Generer la convention ».
const VALEURS = {annee: "2031", anneeIllisible: false, signataire: 31, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};

// La ligne existe deja avec exactement les valeurs de VALEURS : l'enregistrement qui
// precede la generation ne la change pas, donc tout changement vu ensuite vient du rattachement.
const LIGNE_CONVENTION = {
  id: ID_CONVENTION, Action: 1, Modele: 10, Annee: 2031, Signataire_club: 31,
  Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe",
};

function tables() {
  return {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [{...MODELE}],
    Contacts: CONTACTS.map((c) => ({...c})),
    Conventions: [{...LIGNE_CONVENTION}],
  };
}

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Les objets crees dans le bac a sable viennent d'un autre contexte d'execution :
// deepStrictEqual les juge differents des notres. On les recopie avant de comparer.
const ordinaire = (valeur) => JSON.parse(JSON.stringify(valeur));

// Reponse minimale de fetch.
function reponse(ok, status, corps) {
  return {
    ok, status,
    json: () => Promise.resolve(corps),
    text: () => Promise.resolve(REPONSE_SECRETE),
  };
}

// Charge le widget, pose le jeu d'essai et les doublures, et note tout ce qui sort :
//   fetchs   : chaque requete {url, options} ;
//   appels   : chaque appel de applyUserActions (liste d'operations) ;
//   jetons   : les options de chaque appel de getAccessToken ;
//   journal  : tout ce que le widget ecrit dans la console APRES la preparation.
// options.patch : reponse du PATCH (fonction qui renvoie une promesse) ; par defaut, 200.
async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  w.state.raw = tables();
  w.state.tablesRefusees = [];
  journal.length = 0;

  const fetchs = [];
  const appels = [];
  const jetons = [];
  const global = w.window;

  global.FormData = class { constructor() { this.parties = []; } append(nom, valeur, fichier) { this.parties.push([nom, valeur, fichier]); } };
  global.Blob = class { constructor(parties) { this.size = parties ? parties.length : 0; } };
  global.clearTimeout = clearTimeout;
  global.chargerPdfmake = () => Promise.resolve();
  global.pdfMake = {createPdf: () => ({getBlob: () => Promise.resolve({size: 1234})})};

  w.grist.docApi.getAccessToken = (opts) => { jetons.push(opts); return Promise.resolve({token: JETON, baseUrl: BASE_URL}); };
  w.grist.docApi.applyUserActions = (actions) => {
    appels.push(actions);
    const [type, , id] = actions[0];
    return Promise.resolve({retValues: [type === "AddRecord" ? 55 : (id ?? null)]});
  };
  global.fetch = (url, opts) => {
    fetchs.push({url, options: opts});
    if (String(url).includes("/attachments")) return Promise.resolve(reponse(true, 200, [ID_PIECE_JOINTE]));
    return options.patch ? options.patch() : Promise.resolve(reponse(true, 200, {}));
  };
  return {w, fetchs, appels, jetons, journal};
}

const estPatch = (requete) => requete.options && requete.options.method === "PATCH";

// Lance la generation et renvoie l'erreur rejetee (undefined si elle reussit).
async function attraper(promesse) {
  try { await promesse; } catch (erreur) { return erreur; }
  return undefined;
}

// Tout ce qu'une erreur peut montrer : message, pile et proprietes propres.
function visible(erreur) {
  const proprietes = {};
  for (const nom of Object.getOwnPropertyNames(erreur)) proprietes[nom] = erreur[nom];
  return `${erreur.message}\n${erreur.stack}\n${JSON.stringify(proprietes)}`;
}

// ---------------------------------------------------------------------------
// La requete PATCH
// ---------------------------------------------------------------------------

// Echoue si, apres l'envoi du fichier, le widget n'envoie pas exactement une requete PATCH
// vers /tables/Conventions/records, ou si son corps n'est pas {records:[{id, fields}]} avec
// PDF_genere (['L', piece jointe]) et Date_generation (secondes entieres) ensemble.
test("rattachement : une seule requête PATCH, avec les deux colonnes ensemble dans le corps", async () => {
  const {w, fetchs} = await preparer();
  const avant = Math.floor(Date.now() / 1000);
  const resultat = await w.conventionGenerer(1, VALEURS);
  const apres = Math.floor(Date.now() / 1000);

  assert.ok(resultat.nomFichier.endsWith(".pdf"), "la génération réussit");
  const patchs = fetchs.filter(estPatch);
  assert.equal(patchs.length, 1, "une seule requête PATCH");
  assert.ok(patchs[0].url.startsWith(`${BASE_URL}/tables/Conventions/records?`), "vers /tables/Conventions/records");
  assert.equal(typeof patchs[0].options.body, "string", "le corps est du JSON écrit en texte");
  const corps = JSON.parse(patchs[0].options.body);
  assert.deepEqual(Object.keys(corps), ["records"]);
  assert.equal(corps.records.length, 1, "une seule ligne");
  const [ligne] = corps.records;
  assert.deepEqual(Object.keys(ligne).sort(), ["fields", "id"]);
  assert.equal(ligne.id, ID_CONVENTION, "la ligne de la convention de l'action");
  assert.deepEqual(Object.keys(ligne.fields).sort(), ["Date_generation", "PDF_genere"], "ces deux colonnes, pas d'autre");
  assert.deepEqual(ligne.fields.PDF_genere, ["L", ID_PIECE_JOINTE]);
  assert.ok(Number.isInteger(ligne.fields.Date_generation), "Date_generation est un nombre entier de secondes");
  assert.ok(ligne.fields.Date_generation >= avant && ligne.fields.Date_generation <= apres, "la date du moment de la génération");
});

// Echoue si la requete n'est pas faite comme celle du logo de clubs : jeton dans l'adresse
// (?auth=), credentials 'omit', en-tetes Content-Type JSON et X-Requested-With (sans lui,
// Grist repond 401).
test("rattachement : jeton dans l'adresse, credentials omit, en-têtes Content-Type et X-Requested-With", async () => {
  const {w, fetchs} = await preparer();
  await w.conventionGenerer(1, VALEURS);

  const patch = fetchs.find(estPatch);
  assert.ok(patch, "une requête PATCH a été envoyée");
  assert.equal(patch.url, `${BASE_URL}/tables/Conventions/records?auth=${encodeURIComponent(JETON)}`);
  assert.equal(patch.options.credentials, "omit");
  assert.equal(patch.options.headers["Content-Type"], "application/json");
  assert.equal(patch.options.headers["X-Requested-With"], "XMLHttpRequest");
});

// Echoue si le PATCH n'est pas envoye APRES le fichier, ou si le widget fait d'autres
// requetes que l'envoi (POST /attachments) puis le rattachement (PATCH).
test("rattachement : deux requêtes seulement, l'envoi du fichier puis le PATCH", async () => {
  const {w, fetchs} = await preparer();
  await w.conventionGenerer(1, VALEURS);

  assert.equal(fetchs.length, 2, "deux requêtes");
  assert.equal(fetchs[0].options.method, "POST");
  assert.ok(fetchs[0].url.includes("/attachments?auth="), "d'abord l'envoi du fichier");
  assert.equal(fetchs[1].options.method, "PATCH", "ensuite le rattachement");
});

// Echoue si une operation applyUserActions contient PDF_genere ou Date_generation (c'est
// l'ecriture qui est refusee a un non-proprietaire). L'enregistrement des informations,
// lui, reste en applyUserActions : il ne doit donc pas etre confondu avec le rattachement.
test("rattachement : aucune opération applyUserActions ne contient PDF_genere ni Date_generation", async () => {
  const {w, appels} = await preparer();
  await w.conventionGenerer(1, VALEURS);

  assert.ok(appels.length >= 1, "l'enregistrement des informations passe toujours par applyUserActions");
  const ecrit = JSON.stringify(appels);
  assert.ok(!ecrit.includes("PDF_genere"), "pas de PDF_genere dans applyUserActions");
  assert.ok(!ecrit.includes("Date_generation"), "pas de Date_generation dans applyUserActions");
});

// ---------------------------------------------------------------------------
// Le jeton
// ---------------------------------------------------------------------------

// Echoue si le jeton est demande plus d'une fois, s'il est demandé en lecture seule, ou si
// le rattachement n'utilise pas le meme jeton que l'envoi du fichier.
test("jeton : demandé une seule fois (écriture), le même pour l'envoi et le rattachement", async () => {
  const {w, fetchs, jetons} = await preparer();
  await w.conventionGenerer(1, VALEURS);

  assert.equal(jetons.length, 1, "getAccessToken n'est appelé qu'une fois");
  assert.deepEqual(ordinaire(jetons[0]), {readOnly: false});
  const patch = fetchs.find(estPatch);
  assert.ok(patch, "une requête PATCH a été envoyée");
  const jetonDe = (requete) => new URL(requete.url).searchParams.get("auth");
  assert.equal(jetonDe(fetchs[0]), JETON);
  assert.equal(jetonDe(patch), JETON, "le PATCH porte le jeton de l'envoi");
});

// Echoue si le jeton (ou l'adresse qui le porte) apparait dans la console pendant une
// generation reussie. Garde-fou : il passe deja avant la correction et doit le rester.
test("jeton : jamais dans la console quand la génération réussit", async () => {
  const {w, journal} = await preparer();
  await w.conventionGenerer(1, VALEURS);

  const texte = JSON.stringify(journal);
  assert.ok(!texte.includes(JETON), "pas de jeton dans la console");
  assert.ok(!texte.includes("auth="), "pas d'adresse avec ?auth= dans la console");
});

// ---------------------------------------------------------------------------
// Les echecs du rattachement
// ---------------------------------------------------------------------------

// Echoue si un PATCH refuse (reponse non OK) ne donne pas l'erreur rattachement-echoue, si
// l'erreur recopie le texte de la reponse ou le jeton, si la console en parle, ou si
// state.raw.Conventions change.
for (const statut of [403, 500]) {
  test(`échec : PATCH refusé (${statut}) → rattachement-echoue, sans texte de réponse ni jeton, Conventions inchangé`, async () => {
    const {w, journal} = await preparer({patch: () => Promise.resolve(reponse(false, statut, {error: REPONSE_SECRETE}))});
    const avant = ordinaire(w.state.raw.Conventions);

    const erreur = await attraper(w.conventionGenerer(1, VALEURS));

    assert.ok(erreur, "la génération est rejetée");
    assert.equal(erreur.code, "rattachement-echoue");
    const montre = visible(erreur);
    assert.ok(!montre.includes(REPONSE_SECRETE), "pas de texte de réponse dans l'erreur");
    assert.ok(!montre.includes(JETON), "pas de jeton dans l'erreur");
    assert.ok(!JSON.stringify(journal).includes(JETON), "pas de jeton dans la console");
    assert.ok(!JSON.stringify(journal).includes(REPONSE_SECRETE), "pas de texte de réponse dans la console");
    assert.deepEqual(ordinaire(w.state.raw.Conventions), avant, "state.raw.Conventions inchangé");
  });
}

// Echoue si un echec reseau du PATCH ne donne pas rattachement-echoue, si l'erreur de
// fetch (qui peut recopier l'adresse, donc le jeton) est reprise dans l'erreur rejetee ou
// dans la console, ou si state.raw.Conventions change.
test("échec : réseau coupé pendant le PATCH → rattachement-echoue, sans jeton, Conventions inchangé", async () => {
  const {w, journal} = await preparer({
    patch: () => Promise.reject(new Error(`Failed to fetch ${BASE_URL}/tables/Conventions/records?auth=${JETON} ${REPONSE_SECRETE}`)),
  });
  const avant = ordinaire(w.state.raw.Conventions);

  const erreur = await attraper(w.conventionGenerer(1, VALEURS));

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "rattachement-echoue");
  const montre = visible(erreur);
  assert.ok(!montre.includes(JETON), "pas de jeton dans l'erreur");
  assert.ok(!montre.includes(REPONSE_SECRETE), "pas de texte d'erreur réseau dans l'erreur");
  assert.ok(!JSON.stringify(journal).includes(JETON), "pas de jeton dans la console");
  assert.deepEqual(ordinaire(w.state.raw.Conventions), avant, "state.raw.Conventions inchangé");
});

// Echoue si, apres un PATCH refuse, le widget retombe sur applyUserActions pour ecrire
// PDF_genere ou Date_generation (un repli cacherait l'echec et reviendrait au bug).
test("échec : PATCH refusé → pas de repli sur applyUserActions pour PDF_genere ni Date_generation", async () => {
  const {w, appels} = await preparer({patch: () => Promise.resolve(reponse(false, 403, {}))});

  const erreur = await attraper(w.conventionGenerer(1, VALEURS));

  assert.ok(erreur, "la génération est rejetée");
  const ecrit = JSON.stringify(appels);
  assert.ok(!ecrit.includes("PDF_genere"), "pas de PDF_genere dans applyUserActions");
  assert.ok(!ecrit.includes("Date_generation"), "pas de Date_generation dans applyUserActions");
});

// ---------------------------------------------------------------------------
// La reussite met l'etat en memoire a jour
// ---------------------------------------------------------------------------

// Echoue si, apres un PATCH reussi, la ligne de state.raw.Conventions ne recoit pas
// PDF_genere et Date_generation (le bloc ne passerait pas a « Generee »). Garde-fou : il
// passe deja avant la correction et doit le rester.
test("réussite : state.raw.Conventions reçoit PDF_genere et Date_generation après le PATCH", async () => {
  const {w, fetchs} = await preparer();
  await w.conventionGenerer(1, VALEURS);

  const patch = fetchs.find(estPatch);
  assert.ok(patch, "une requête PATCH a été envoyée");
  const {fields} = JSON.parse(patch.options.body).records[0];
  const ligne = w.state.raw.Conventions.find((l) => l.id === ID_CONVENTION);
  assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ID_PIECE_JOINTE]);
  assert.equal(ligne.Date_generation, fields.Date_generation, "la même date que celle envoyée");
});
