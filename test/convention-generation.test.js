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

// Ce que lireConventionForm donne au clic sur « Generer la convention » (E1 : plus d'annee, elle
// vient de la campagne de l'action ; nouveauContact vaut null tant que le Nom du formulaire
// « Ajouter un contact » est vide).
const VALEURS = {signataire: 31, nouveauContact: null, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};
const ID_CAMPAGNE = 4;

// La ligne existe deja avec exactement les valeurs de VALEURS : l'enregistrement qui
// precede la generation ne la change pas, donc tout changement vu ensuite vient du rattachement.
const LIGNE_CONVENTION = {
  id: ID_CONVENTION, Action: 1, Modele: 10, Annee: 2031, Signataire_club: 31,
  Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe",
};

function tables() {
  return {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, Campagne: ID_CAMPAGNE}],
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
  // compteurs : combien de fois pdfmake est charge et combien de PDF sont fabriques (les
  // tests des codes d'erreur verifient que les etapes suivantes n'ont pas eu lieu).
  const compteurs = {pdfmake: 0, pdf: 0};
  const docs = [];
  global.chargerPdfmake = () => { compteurs.pdfmake += 1; return Promise.resolve(); };
  global.pdfMake = {createPdf: (document) => { compteurs.pdf += 1; docs.push(document); return {getBlob: () => Promise.resolve({size: 1234})}; }};
  // La campagne de l'action (reference vers Campagnes) donne l'annee : « 2031 », modifiable par un test.
  // `illisible` imite un reseau coupe pendant la lecture de la table Campagnes.
  const campagnes = {valeur: "2031", illisible: false};
  w.grist.docApi.fetchTable = (nom) => {
    if (nom !== "Campagnes") return Promise.resolve({id: []});
    return campagnes.illisible ? Promise.reject(new Error("réseau coupé")) : Promise.resolve({id: [ID_CAMPAGNE], Campagne: [campagnes.valeur]});
  };

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
  return {w, fetchs, appels, jetons, journal, compteurs, docs, campagnes};
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

// ---------------------------------------------------------------------------
// Les neuf codes d'erreur de conventionGenerer (fin de la tache 7.3)
// ---------------------------------------------------------------------------
// Pour chaque code : rien n'est ecrit dans PDF_genere ni Date_generation (ni par PATCH, ni par
// applyUserActions), state.raw.Conventions garde l'etat « A generer » (« Sans modele » quand le
// code vient justement de l'absence de modele), le jeton n'apparait ni dans l'erreur, ni dans
// le message affiche, ni dans la console, et rien n'est ecrit dans la console. Les etapes
// suivant l'echec n'ont pas eu lieu (decision D-S7-4 : controle, enregistrement, modele et
// cases, pdfmake et PDF, envoi, rattachement). Le rattachement (rattachement-echoue) est
// teste plus haut. Les textes d'erreur des doublures contiennent le jeton, un nom de
// personne et un texte de reponse : aucun ne doit ressortir.

const NOM_DE_PERSONNE = "Camille Exemple";

// Remplace fetch en gardant la trace de chaque requete.
function remplacerFetch(ctx, comportement) {
  ctx.w.window.fetch = (url, options) => {
    ctx.fetchs.push({url, options});
    return comportement(url, options);
  };
}

// Verifications communes a tous les echecs. `avant` : state.raw.Conventions avant la generation.
function verifierEchec(ctx, erreur, code, avant, {etat = "À générer", conventionsInchangees = true} = {}) {
  const {w, fetchs, appels, journal} = ctx;
  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, code);

  assert.equal(fetchs.filter(estPatch).length, 0, "aucun PATCH");
  const ecrit = JSON.stringify(appels);
  assert.ok(!ecrit.includes("PDF_genere"), "pas de PDF_genere dans applyUserActions");
  assert.ok(!ecrit.includes("Date_generation"), "pas de Date_generation dans applyUserActions");
  const ligne = w.state.raw.Conventions.find((l) => l.id === ID_CONVENTION);
  assert.equal(ligne.PDF_genere, undefined, "PDF_genere non écrit");
  assert.equal(ligne.Date_generation, undefined, "Date_generation non écrite");
  if (conventionsInchangees) assert.deepEqual(ordinaire(w.state.raw.Conventions), avant, "state.raw.Conventions inchangé");
  assert.equal(w.conventionEtat(1, w.state).etat, etat, "état du bloc");

  const montre = visible(erreur);
  const message = w.conventionMessageEchec(erreur);
  for (const secret of [JETON, "auth=", NOM_DE_PERSONNE, REPONSE_SECRETE]) {
    assert.ok(!montre.includes(secret), `« ${secret} » absent de l'erreur`);
    assert.ok(!message.includes(secret), `« ${secret} » absent du message affiché`);
  }
  assert.equal(journal.length, 0, "rien dans la console");
}

// Echoue si l'ordre des etapes change (decision D-S7-4, mise a jour par la tache 7.7b) :
// enregistrement, puis le jeton (demande AVANT pdfmake, car il sert aux logos), puis pdfmake,
// fabrication du PDF, envoi, rattachement. Le modele d'essai n'a pas de logo : aucun telechargement.
test("génération : ordre des étapes en réussite (enregistrement, jeton, pdfmake, PDF, envoi, rattachement)", async () => {
  const ctx = await preparer();
  const {w} = ctx;
  const g = w.window;
  const trace = [];
  const enregistrer = w.grist.docApi.applyUserActions;
  w.grist.docApi.applyUserActions = (actions) => { trace.push("enregistrement"); return enregistrer(actions); };
  g.chargerPdfmake = () => { trace.push("pdfmake"); return Promise.resolve(); };
  const creer = g.pdfMake.createPdf;
  g.pdfMake.createPdf = (document) => { trace.push("pdf"); return creer(document); };
  const jeton = w.grist.docApi.getAccessToken;
  w.grist.docApi.getAccessToken = (options) => { trace.push("jeton"); return jeton(options); };
  const requete = g.fetch;
  g.fetch = (url, options) => { trace.push(options.method === "PATCH" ? "rattachement" : "envoi"); return requete(url, options); };

  await w.conventionGenerer(1, VALEURS);

  assert.deepEqual(trace, ["enregistrement", "jeton", "pdfmake", "pdf", "envoi", "rattachement"]);
});

// Echoue si un champ vide bloque encore la generation (E1, D-E1-17 : plus aucun champ obligatoire,
// plus de code champs-a-corriger) : aucun signataire, representant et fonction vides doivent
// passer, et les cases correspondantes du modele deviennent 56 points (a completer a la main).
test("E1 : champs vides (aucun signataire, représentant et fonction vides) → la génération réussit, les cases deviennent 56 points", async () => {
  const ctx = await preparer();
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Signé par [Signataire du club], [Représentant de l’agence], [Fonction du représentant] fin.";

  const resultat = await ctx.w.conventionGenerer(1, {signataire: 0, nouveauContact: null, representant: "", fonctionRepresentant: ""});

  assert.ok(resultat.nomFichier.endsWith(".pdf"), "la génération réussit");
  assert.equal(ctx.compteurs.pdf, 1, "un PDF est fabriqué");
  assert.ok(JSON.stringify(ctx.docs[0]).includes(".".repeat(56)), "des pointillés dans le PDF");
  assert.ok(!JSON.stringify(ctx.docs[0]).includes(".".repeat(57)), "exactement 56 points");
  assert.equal(ctx.appels.length, 1, "les informations vides sont enregistrées telles quelles");
  assert.equal(ctx.appels[0][0][3].Signataire_club, 0);
});

// Echoue si l'annee du PDF et du nom de fichier ne vient plus de la campagne de l'action
// (Actions.Campagne -> Campagnes.Campagne), ou si une annee glissee dans `valeurs` l'emporte.
test("année : le nom du fichier et la case [Année] viennent de la campagne de l'action", async () => {
  const ctx = await preparer();
  ctx.campagnes.valeur = "2027";
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Année [Année].";

  const resultat = await ctx.w.conventionGenerer(1, {...VALEURS, annee: "1999"});

  assert.ok(resultat.nomFichier.endsWith("-2027.pdf"), `nom du fichier avec 2027 : ${resultat.nomFichier}`);
  assert.ok(JSON.stringify(ctx.docs[0]).includes("Année 2027."), "la case [Année] vaut 2027");
  assert.equal(ctx.w.state.raw.Conventions[0].Annee, 2027, "Annee enregistrée");
});

// Echoue si une campagne vide laisse une annee inventee dans le nom du fichier, ou ne donne pas
// des pointillés pour la case [Année] (D-E1-8 : l'annee est omise du nom de fichier).
test("année : campagne vide → pas d'année dans le nom du fichier, case [Année] en pointillés", async () => {
  const ctx = await preparer();
  ctx.campagnes.valeur = "";
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Année [Année].";

  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.ok(!/-\d{4}\.pdf$/.test(resultat.nomFichier), `aucune année dans ${resultat.nomFichier}`);
  assert.ok(JSON.stringify(ctx.docs[0]).includes(`Année ${".".repeat(56)}.`), "pointillés à la place de l’année");
});

// Echoue si une lecture impossible de la campagne (reseau coupe) fait perdre l'annee deja
// enregistree : le PDF et le nom du fichier doivent garder Annee de la ligne (2031), pas des pointillés.
test("année : lecture de la campagne impossible → l'année déjà enregistrée sert au PDF et au nom du fichier", async () => {
  const ctx = await preparer();
  ctx.campagnes.illisible = true;
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Année [Année].";

  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.ok(resultat.nomFichier.endsWith("-2031.pdf"), resultat.nomFichier);
  assert.ok(JSON.stringify(ctx.docs[0]).includes("Année 2031."));
  assert.equal(ctx.w.state.raw.Conventions[0].Annee, 2031, "Annee non écrasée");
});

// Echoue si un nouveau contact saisi dans la fenetre n'est pas cree AVANT la fabrication du PDF, ou si
// le PDF ne porte pas son nom et sa fonction ([Signataire du club], [Fonction du signataire]) : le
// signataire d'une saisie libre doit etre traite comme un contact de la liste (note UX §3).
test("nouveau contact : créé avant le PDF, qui porte son nom et sa fonction ; Conventions le référence", async () => {
  const ctx = await preparer();
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Signé par [Signataire du club], [Fonction du signataire] fin.";
  const valeurs = {signataire: 0, nouveauContact: {nom: "Martin", prenom: "Jo", email: "jo.martin@exemple.fr", fonction: "Trésorier"}, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};

  const resultat = await ctx.w.conventionGenerer(1, valeurs);

  assert.ok(resultat.nomFichier.endsWith(".pdf"), "la génération réussit");
  assert.equal(ctx.appels[0][0][1], "Contacts", "le contact est créé en premier");
  assert.equal(ctx.appels[0][0][0], "AddRecord");
  assert.equal(ctx.appels[1][0][1], "Conventions", "puis Conventions");
  assert.equal(ctx.appels[1][0][3].Signataire_club, 55, "Conventions référence le contact créé (identifiant rendu par Grist)");
  assert.ok(JSON.stringify(ctx.docs[0]).includes("Signé par Jo Martin, Trésorier fin."), "le PDF porte le nom et la fonction du nouveau contact");
  assert.equal(valeurs.nouveauContact, null, "la saisie libre est consommée : pas de second contact");
});

// Echoue si la creation du contact echoue et que la generation continue : elle doit s'arreter avec
// enregistrement-echoue, sans ecrire Conventions, sans charger pdfmake ni demander de jeton.
test("nouveau contact refusé par Grist : enregistrement-echoue, rien d'autre n'est écrit ni fabriqué", async () => {
  const ctx = await preparer();
  ctx.w.grist.docApi.applyUserActions = (actions) => { ctx.appels.push(actions); return Promise.reject(new Error(`refus ${NOM_DE_PERSONNE}`)); };
  const avant = ordinaire(ctx.w.state.raw.Conventions);

  const erreur = await attraper(ctx.w.conventionGenerer(1, {signataire: 0, nouveauContact: {nom: "Martin", prenom: "", email: "jo.martin@exemple.fr", fonction: ""}, representant: "", fonctionRepresentant: ""}));

  verifierEchec(ctx, erreur, "enregistrement-echoue", avant);
  assert.equal(ctx.appels.length, 1, "une seule tentative : la création du contact");
  assert.equal(ctx.compteurs.pdfmake, 0, "pdfmake non chargé");
  assert.equal(ctx.jetons.length, 0, "aucun jeton demandé");
});

// Echoue si une adresse de club absente bloque la generation elle-meme (le blocage est a l'ouverture
// de la fenetre, jamais dans conventionGenerer) ou ne donne pas 56 points pour [Siège du club].
test("adresse du club absente : la génération réussit et [Siège du club] devient 56 points", async () => {
  const ctx = await preparer();
  Object.assign(ctx.w.state.raw.Structures[0], {Adresse: "", Code_postal: "", Ville: ""});
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Siège : [Siège du club] fin.";

  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.ok(resultat.nomFichier.endsWith(".pdf"));
  assert.ok(JSON.stringify(ctx.docs[0]).includes(`Siège : ${".".repeat(56)} fin.`), "56 points à la place de l'adresse");
});

// Echoue si un refus de Grist a l'enregistrement ne rend pas enregistrement-echoue, si
// l'erreur de Grist (jeton, nom de personne) est reprise, ou si la generation continue.
test("échec enregistrement-echoue : Grist refuse l'enregistrement, la suite n'a pas lieu", async () => {
  const ctx = await preparer();
  ctx.w.grist.docApi.applyUserActions = (actions) => {
    ctx.appels.push(actions);
    return Promise.reject(new Error(`refus pour ${NOM_DE_PERSONNE} ${JETON} ${REPONSE_SECRETE}`));
  };
  const avant = ordinaire(ctx.w.state.raw.Conventions);

  const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

  verifierEchec(ctx, erreur, "enregistrement-echoue", avant);
  assert.equal(ctx.appels.length, 1, "une seule tentative d'enregistrement");
  assert.equal(ctx.compteurs.pdfmake, 0, "pdfmake non chargé");
  assert.equal(ctx.jetons.length, 0, "aucun jeton demandé");
  assert.equal(ctx.fetchs.length, 0, "aucune requête");
});

// Echoue si un modele actif dont le texte est vide (ou fait d'espaces) ne rend pas
// modele-indisponible, ou si pdfmake est charge quand meme. Le modele est examine APRES
// l'enregistrement (D-S7-4) : un appel applyUserActions a eu lieu.
test("échec modele-indisponible : modèle actif au texte vide", async () => {
  const ctx = await preparer();
  ctx.w.state.raw.Modeles_convention[0].Contenu = "   ";
  const avant = ordinaire(ctx.w.state.raw.Conventions);

  const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

  verifierEchec(ctx, erreur, "modele-indisponible", avant);
  assert.equal(ctx.appels.length, 1, "les informations ont été enregistrées avant");
  assert.equal(ctx.compteurs.pdfmake, 0, "pdfmake non chargé");
  assert.equal(ctx.jetons.length, 0, "aucun jeton demandé");
  assert.equal(ctx.fetchs.length, 0, "aucune requête");
});

// Echoue si un modele inactif ou absent ne rend pas modele-indisponible, ou si pdfmake est
// charge quand meme. L'etat reste « Sans modele » (jamais « Generee »). state.raw.Conventions
// change ici : l'enregistrement qui precede ecrit Modele = 0, comme le prevoit D-S7-4.
for (const [nom, preparerModele] of [
  ["modèle inactif", (raw) => { raw.Modeles_convention[0].Actif = false; }],
  ["aucun modèle pour le dispositif", (raw) => { raw.Modeles_convention = []; }],
]) {
  test(`échec modele-indisponible : ${nom}`, async () => {
    const ctx = await preparer();
    preparerModele(ctx.w.state.raw);

    const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

    verifierEchec(ctx, erreur, "modele-indisponible", null, {etat: "Sans modèle", conventionsInchangees: false});
    assert.equal(ctx.compteurs.pdfmake, 0, "pdfmake non chargé");
    assert.equal(ctx.jetons.length, 0, "aucun jeton demandé");
    assert.equal(ctx.fetchs.length, 0, "aucune requête");
  });
}

// Echoue si des cases inconnues ne rendent pas cases-inconnues avec leurs noms dans .cases
// (sans doublon, dans l'ordre du texte), si une case connue est signalee, ou si pdfmake est
// charge malgre le blocage.
test("échec cases-inconnues : .cases donne les noms inconnus, sans doublon", async () => {
  const ctx = await preparer();
  ctx.w.state.raw.Modeles_convention[0].Contenu = "Entre [Nom du club] et [Case inconnue], voir [Autre case] puis [Case inconnue]. Année : [Année].";
  const avant = ordinaire(ctx.w.state.raw.Conventions);

  const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

  verifierEchec(ctx, erreur, "cases-inconnues", avant);
  assert.deepEqual(ordinaire(erreur.cases), ["Case inconnue", "Autre case"]);
  assert.equal(ctx.appels.length, 1, "les informations ont été enregistrées avant");
  assert.equal(ctx.compteurs.pdfmake, 0, "pdfmake non chargé");
  assert.equal(ctx.fetchs.length, 0, "aucune requête");
});

// Echoue si un chargement de pdfmake qui echoue ne rend pas pdfmake-non-charge, si un PDF est
// fabrique, si le jeton (demande avant pdfmake depuis la 7.7b) n'a pas ete demande exactement une
// fois en ecriture, ou si une requete est envoyee apres l'echec.
test("échec pdfmake-non-charge : le chargement est refusé", async () => {
  const ctx = await preparer();
  ctx.w.window.chargerPdfmake = () => Promise.reject(Object.assign(new Error("pdfmake non chargé (doublure)"), {code: "pdfmake-non-charge"}));
  const avant = ordinaire(ctx.w.state.raw.Conventions);

  const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

  verifierEchec(ctx, erreur, "pdfmake-non-charge", avant);
  assert.equal(ctx.appels.length, 1, "les informations ont été enregistrées avant");
  assert.equal(ctx.compteurs.pdf, 0, "aucun PDF fabriqué");
  assert.equal(ctx.jetons.length, 1, "le jeton a été demandé une fois, avant pdfmake");
  assert.deepEqual(ordinaire(ctx.jetons[0]), {readOnly: false});
  assert.equal(ctx.fetchs.length, 0, "aucune requête");
});

// Echoue si un chargement qui ne repond pas ne donne pas pdfmake-non-charge au bout de
// 20 secondes (minuterie simulee : le test n'attend pas), si la minuterie de pdfmake n'a pas ce
// delai, si elle n'est pas la seule encore active, ou si celles de l'enregistrement (20 s, posee
// en premier) et du jeton (15 s, posee ensuite) n'ont pas ete arretees quand leur reponse est
// arrivee. Le jeton est deja demande (une fois, en ecriture)
// quand pdfmake est attendu.
test("échec pdfmake-non-charge : pas de réponse au bout de 20 secondes (minuterie simulée)", async () => {
  const ctx = await preparer();
  const g = ctx.w.window;
  const minuteries = [];
  const arretees = new Set();
  g.setTimeout = (fonction, delai) => { minuteries.push({fonction, delai}); return minuteries.length; };
  g.clearTimeout = (id) => { arretees.add(id); };
  g.chargerPdfmake = () => new Promise(() => {});
  const avant = ordinaire(ctx.w.state.raw.Conventions);

  const promesse = ctx.w.conventionGenerer(1, VALEURS);
  await attendre();
  assert.equal(minuteries.length, 4, "quatre minuteries posées : la lecture de la campagne (15 s), l'enregistrement (20 s), le jeton (15 s), puis pdfmake (20 s)");
  assert.equal(minuteries[0].delai, 15000, "la première est celle de la campagne (l'année)");
  assert.ok(arretees.has(1), "la minuterie de la campagne est arrêtée : elle a répondu");
  assert.equal(minuteries[1].delai, 20000, "la deuxième est celle de l'enregistrement");
  assert.ok(arretees.has(2), "la minuterie de l'enregistrement est arrêtée : il a répondu");
  assert.equal(minuteries[2].delai, 15000, "la troisième est celle du jeton");
  assert.ok(arretees.has(3), "la minuterie du jeton est arrêtée : le jeton est arrivé");
  assert.equal(minuteries[3].delai, 20000, "la quatrième est celle de pdfmake");
  assert.ok(!arretees.has(4), "la minuterie de pdfmake est la seule encore active");
  minuteries[3].fonction();
  const erreur = await attraper(promesse);

  verifierEchec(ctx, erreur, "pdfmake-non-charge", avant);
  assert.equal(ctx.compteurs.pdf, 0, "aucun PDF fabriqué");
  assert.equal(ctx.jetons.length, 1, "le jeton a été demandé une fois, avant pdfmake");
  assert.deepEqual(ordinaire(ctx.jetons[0]), {readOnly: false});
  assert.equal(ctx.fetchs.length, 0, "aucune requête");
});

// Echoue si une reponse 401 ou 403 a l'envoi du fichier ne rend pas envoi-refuse, si le texte
// de la reponse est repris, ou si un rattachement est tente.
for (const statut of [401, 403]) {
  test(`échec envoi-refuse : l'envoi du fichier est refusé (${statut}), pas de rattachement`, async () => {
    const ctx = await preparer();
    remplacerFetch(ctx, () => Promise.resolve(reponse(false, statut, {error: REPONSE_SECRETE})));
    const avant = ordinaire(ctx.w.state.raw.Conventions);

    const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

    verifierEchec(ctx, erreur, "envoi-refuse", avant);
    assert.equal(ctx.fetchs.length, 1, "seul l'envoi a été tenté");
  });
}

// Echoue si l'un de ces echecs d'envoi (reponse du serveur autre que 401/403, reseau coupe,
// jeton impossible a obtenir ou vide, reponse illisible, identifiant de piece jointe absent ou
// invalide) ne rend pas envoi-impossible, si le texte de l'erreur de fetch (qui peut recopier
// l'adresse, donc le jeton) ou de la reponse est repris, ou si un rattachement est tente.
const ENVOIS_IMPOSSIBLES = [
  ["le serveur répond 500", (ctx) => remplacerFetch(ctx, () => Promise.resolve(reponse(false, 500, {error: REPONSE_SECRETE})))],
  ["réseau coupé (l'erreur recopie l'adresse avec le jeton)", (ctx) => remplacerFetch(ctx, (url) => Promise.reject(new Error(`Failed to fetch ${url} ${NOM_DE_PERSONNE} ${REPONSE_SECRETE}`)))],
  ["jeton impossible à obtenir", (ctx) => { ctx.w.grist.docApi.getAccessToken = () => Promise.reject(new Error(`refus ${JETON} ${NOM_DE_PERSONNE}`)); }],
  ["jeton vide", (ctx) => { ctx.w.grist.docApi.getAccessToken = () => Promise.resolve({token: "", baseUrl: BASE_URL}); }],
  ["adresse du document absente", (ctx) => { ctx.w.grist.docApi.getAccessToken = () => Promise.resolve({token: JETON, baseUrl: ""}); }],
  ["réponse illisible", (ctx) => remplacerFetch(ctx, () => Promise.resolve({ok: true, status: 200, json: () => Promise.reject(new Error(REPONSE_SECRETE)), text: () => Promise.resolve(REPONSE_SECRETE)}))],
  ["aucun identifiant de pièce jointe", (ctx) => remplacerFetch(ctx, () => Promise.resolve(reponse(true, 200, [])))],
  ["identifiant de pièce jointe invalide", (ctx) => remplacerFetch(ctx, () => Promise.resolve(reponse(true, 200, [0])))],
];
for (const [nom, preparerEnvoi] of ENVOIS_IMPOSSIBLES) {
  test(`échec envoi-impossible : ${nom}`, async () => {
    const ctx = await preparer();
    preparerEnvoi(ctx);
    const avant = ordinaire(ctx.w.state.raw.Conventions);

    const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

    verifierEchec(ctx, erreur, "envoi-impossible", avant);
    assert.ok(ctx.fetchs.length <= 1, "au plus l'envoi, jamais le rattachement");
  });
}

// Echoue si un echec pendant la fabrication du PDF (getBlob rejette, fichier vide ou absent,
// createPdf qui plante) ne rend pas echec-inattendu, si le texte de l'erreur (nom de personne,
// jeton) est repris, si le jeton n'a pas ete demande exactement une fois (avant pdfmake, depuis
// la 7.7b), ou si un fichier est envoye apres l'echec. Sans logo, createPdf n'est essaye qu'une fois.
const FABRICATIONS_RATEES = [
  ["getBlob rejette", (g) => { g.pdfMake.createPdf = () => ({getBlob: () => Promise.reject(new Error(`échec pour ${NOM_DE_PERSONNE} ${JETON}`))}); }],
  ["fichier vide", (g) => { g.pdfMake.createPdf = () => ({getBlob: () => Promise.resolve({size: 0})}); }],
  ["aucun fichier", (g) => { g.pdfMake.createPdf = () => ({getBlob: () => Promise.resolve(null)}); }],
  ["createPdf plante", (g) => { g.pdfMake.createPdf = () => { throw new Error(`plantage pour ${NOM_DE_PERSONNE} ${JETON}`); }; }],
];
for (const [nom, preparerPdf] of FABRICATIONS_RATEES) {
  test(`échec echec-inattendu : fabrication du PDF (${nom})`, async () => {
    const ctx = await preparer();
    preparerPdf(ctx.w.window);
    const avant = ordinaire(ctx.w.state.raw.Conventions);

    const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

    verifierEchec(ctx, erreur, "echec-inattendu", avant);
    assert.equal(ctx.compteurs.pdfmake, 1, "pdfmake chargé avant");
    assert.equal(ctx.jetons.length, 1, "le jeton a été demandé une fois, avant pdfmake");
    assert.equal(ctx.fetchs.length, 0, "aucun fichier envoyé");
  });
}

// ---------------------------------------------------------------------------
// Re-generation (tache 8.2) : decisions D-S8-4 a D-S8-7, note UX docs/ux/convention.md §12
// ---------------------------------------------------------------------------
// La convention existe deja et porte un PDF (piece jointe 41, date ancienne). Le modele
// d'origine (id 11) n'est plus actif : le modele actif du dispositif est le 10.

const ANCIEN_PDF = 41;
const ANCIENNE_DATE = 1700000000;
const MODELE_INACTIF = {id: 11, Dispositif: 3, Actif: false, Titre: "Ancien modèle", Avec_annee: true, Contenu: "Ancien texte fictif."};
const NOUVELLES_VALEURS = {...VALEURS, representant: "Sam Exemple"};

// Charge le widget avec une convention deja generee avec l'ancien modele (11).
async function preparerRegeneration(options = {}, ligneEnPlus = {}) {
  const ctx = await preparer(options);
  const raw = ctx.w.state.raw;
  raw.Modeles_convention = [{...MODELE}, {...MODELE_INACTIF}];
  raw.Conventions = [{...LIGNE_CONVENTION, Modele: 11, PDF_genere: ["L", ANCIEN_PDF], Date_generation: ANCIENNE_DATE, ...ligneEnPlus}];
  // La campagne de l'action a change depuis la premiere generation : 2032.
  ctx.campagnes.valeur = "2032";
  return ctx;
}

const ligneConvention = (w) => w.state.raw.Conventions.find((l) => l.id === ID_CONVENTION);

// L'ancien PDF est toujours en place : dans state.raw.Conventions, et pour le bloc
// (« Voir la convention » lit conventionEtat(...).convention.PDF_genere).
function verifierAncienPdfIntact(ctx) {
  const {w, fetchs, appels} = ctx;
  const ligne = ligneConvention(w);
  assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ANCIEN_PDF], "PDF_genere inchangé");
  assert.equal(ligne.Date_generation, ANCIENNE_DATE, "Date_generation inchangée");
  const etat = w.conventionEtat(1, w.state);
  assert.equal(etat.etat, "Générée", "le bloc reste à l'état Générée");
  assert.deepEqual(ordinaire(etat.convention.PDF_genere), ["L", ANCIEN_PDF], "« Voir la convention » pointe vers l'ancien fichier");
  assert.equal(fetchs.filter(estPatch).length, 0, "aucun PATCH");
  assert.ok(!JSON.stringify(appels).includes("PDF_genere"), "pas de PDF_genere dans applyUserActions");
  assert.ok(!JSON.stringify(appels).includes("Date_generation"), "pas de Date_generation dans applyUserActions");
}

// --- 1. Modele actif ---

// Echoue si une re-generation ecrit l'ancien modele (11) au lieu du modele actif (10), dans
// l'operation applyUserActions comme dans state.raw.Conventions.
test("re-génération : Modele reçoit le modèle ACTIF, pas le modèle d'origine", async () => {
  const ctx = await preparerRegeneration();
  await ctx.w.conventionGenerer(1, NOUVELLES_VALEURS);

  assert.equal(ctx.appels.length, 1, "une seule opération d'enregistrement");
  assert.deepEqual(ordinaire(ctx.appels[0][0].slice(0, 3)), ["UpdateRecord", "Conventions", ID_CONVENTION]);
  assert.equal(ctx.appels[0][0][3].Modele, 10, "modèle actif dans l'opération");
  assert.equal(ligneConvention(ctx.w).Modele, 10, "modèle actif en mémoire");
});

// Echoue si une premiere generation (aucune ligne Conventions) n'ecrit pas le modele actif
// dans la ligne creee. Aucun test existant de ce fichier ne verifie Modele a la generation.
test("première génération : la ligne créée reçoit le modèle actif", async () => {
  const ctx = await preparer();
  ctx.w.state.raw.Conventions = [];
  await ctx.w.conventionGenerer(1, VALEURS);

  assert.equal(ctx.appels[0][0][0], "AddRecord");
  assert.equal(ctx.appels[0][0][3].Modele, 10);
});

// Echoue si l'enregistrement de la fermeture (conventionEnregistrer sans modeleActif, comme
// « Fermer » et Echap) change Modele : une convention deja faite garde son modele d'origine (11),
// meme s'il n'est plus actif.
test("« Fermer » (enregistrement seul) ne change pas Modele (reste le modèle d'origine)", async () => {
  const ctx = await preparerRegeneration();
  await ctx.w.conventionEnregistrer(1, NOUVELLES_VALEURS, {silencieux: true});

  assert.equal(ctx.appels[0][0][3].Modele, 11, "modèle d'origine dans l'opération");
  assert.equal(ligneConvention(ctx.w).Modele, 11, "modèle d'origine en mémoire");
  assert.equal(ligneConvention(ctx.w).Representant_agence, "Sam Exemple", "les informations, elles, sont bien enregistrées");
});

// --- 2. Une seule ecriture, aucune suppression ---

// Echoue si la re-generation ecrit PDF_genere/Date_generation en plus d'une requete, si la
// cellule est complétée (['L', 41, 42]) au lieu d'être remplacée (['L', 42]), si la mémoire
// garde l'ancien fichier ou l'ancienne date.
test("re-génération : une seule écriture de PDF_genere et Date_generation, qui remplace l'ancien fichier", async () => {
  const ctx = await preparerRegeneration();
  await ctx.w.conventionGenerer(1, NOUVELLES_VALEURS);

  const patchs = ctx.fetchs.filter(estPatch);
  assert.equal(patchs.length, 1, "un seul PATCH");
  const {fields} = JSON.parse(patchs[0].options.body).records[0];
  assert.deepEqual(Object.keys(fields).sort(), ["Date_generation", "PDF_genere"]);
  assert.deepEqual(fields.PDF_genere, ["L", ID_PIECE_JOINTE], "remplacement, pas ajout à l'ancien");
  assert.ok(fields.Date_generation > ANCIENNE_DATE, "nouvelle date");
  const ligne = ligneConvention(ctx.w);
  assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ID_PIECE_JOINTE]);
  assert.equal(ligne.Date_generation, fields.Date_generation);
  assert.equal(ctx.fetchs.length, 2, "envoi du fichier + un PATCH, rien d'autre");
});

// Echoue si une requete DELETE part, si une requete vise l'ancien fichier (41), si une
// operation applyUserActions autre qu'AddRecord/UpdateRecord ou touchant aux pieces jointes
// (RemoveRecord, BulkRemoveRecord, _grist_Attachments...). Couvre la reussite et deux echecs
// (envoi refuse, PATCH refuse).
const SCENARIOS_SANS_SUPPRESSION = [
  ["réussite", {}, (ctx) => ctx.w.conventionGenerer(1, NOUVELLES_VALEURS)],
  ["envoi refusé", {}, (ctx) => { remplacerFetch(ctx, () => Promise.resolve(reponse(false, 403, {}))); return ctx.w.conventionGenerer(1, NOUVELLES_VALEURS); }],
  ["PATCH refusé", {patch: () => Promise.resolve(reponse(false, 403, {}))}, (ctx) => ctx.w.conventionGenerer(1, NOUVELLES_VALEURS)],
];
for (const [nom, options, lancer] of SCENARIOS_SANS_SUPPRESSION) {
  test(`re-génération (${nom}) : aucune suppression de pièce jointe, nulle part`, async () => {
    const ctx = await preparerRegeneration(options);
    await attraper(lancer(ctx));

    for (const requete of ctx.fetchs) {
      assert.ok(["POST", "PATCH"].includes(requete.options.method), `méthode ${requete.options.method} interdite`);
      assert.ok(!requete.url.includes(`/attachments/${ANCIEN_PDF}`), "aucune requête sur l'ancien fichier");
    }
    for (const operation of ctx.appels.flat()) {
      assert.ok(["AddRecord", "UpdateRecord"].includes(operation[0]), `opération ${operation[0]} interdite`);
      assert.ok(!/attachment/i.test(JSON.stringify(operation)), "aucune opération sur les pièces jointes");
    }
  });
}

// --- 3. PDF_signe et Date_depot ---

// Echoue si la re-generation ecrit PDF_signe ou Date_depot (applyUserActions ou PATCH) ou
// les modifie en memoire.
test("re-génération : PDF_signe et Date_depot ne sont ni écrits ni modifiés", async () => {
  const ctx = await preparerRegeneration({}, {PDF_signe: ["L"], Date_depot: null});
  await ctx.w.conventionGenerer(1, NOUVELLES_VALEURS);

  const requetes = JSON.stringify([ctx.appels, ctx.fetchs.filter(estPatch).map((r) => r.options.body)]);
  assert.ok(!requetes.includes("PDF_signe"), "PDF_signe absent des écritures");
  assert.ok(!requetes.includes("Date_depot"), "Date_depot absent des écritures");
  const ligne = ligneConvention(ctx.w);
  assert.deepEqual(ordinaire(ligne.PDF_signe), ["L"], "PDF_signe inchangé en mémoire");
  assert.strictEqual(ligne.Date_depot, null, "Date_depot inchangé en mémoire");
});

// --- 4. Echec a chaque etape ---

// Echoue si, a l'une de ces etapes, l'ancien PDF_genere ou l'ancienne Date_generation change
// (memoire ou ecriture), si le bloc ne pointe plus vers l'ancien fichier, ou si les informations
// de l'etape 2 (annee de la campagne, representant) ne restent pas enregistrees.
const ECHECS_REGENERATION = [
  ["modèle inactif", "modele-indisponible", (ctx) => { ctx.w.state.raw.Modeles_convention.find((m) => m.id === 10).Actif = false; }],
  ["cases inconnues", "cases-inconnues", (ctx) => { ctx.w.state.raw.Modeles_convention.find((m) => m.id === 10).Contenu = "Texte avec [Case inconnue]."; }],
  ["pdfmake non chargé", "pdfmake-non-charge", (ctx) => { ctx.w.window.chargerPdfmake = () => Promise.reject(Object.assign(new Error("doublure"), {code: "pdfmake-non-charge"})); }],
  ["envoi refusé", "envoi-refuse", (ctx) => remplacerFetch(ctx, () => Promise.resolve(reponse(false, 403, {})))],
];
for (const [nom, code, preparerEchec] of ECHECS_REGENERATION) {
  test(`re-génération, échec (${nom}) : l'ancien PDF et l'ancienne date restent, les informations sont enregistrées`, async () => {
    const ctx = await preparerRegeneration();
    preparerEchec(ctx);

    const erreur = await attraper(ctx.w.conventionGenerer(1, NOUVELLES_VALEURS));

    assert.ok(erreur, "la re-génération est rejetée");
    assert.equal(erreur.code, code);
    verifierAncienPdfIntact(ctx);
    const ligne = ligneConvention(ctx.w);
    assert.equal(ligne.Annee, 2032, "année enregistrée à l'étape 2");
    assert.equal(ligne.Representant_agence, "Sam Exemple", "représentant enregistré à l'étape 2");
  });
}

// --- 5. Relecture de secours ---

// Remplace fetchTable pour la relecture et compte ses appels sur la table Conventions.
function poserRelecture(ctx, comportement) {
  const lectures = [];
  // La lecture de la campagne (annee) n'est pas la relecture de secours : on ne la compte pas.
  ctx.w.grist.docApi.fetchTable = (nom) => {
    if (nom === "Campagnes") return Promise.resolve({id: [ID_CAMPAGNE], Campagne: [ctx.campagnes.valeur]});
    lectures.push(nom);
    return comportement();
  };
  return lectures;
}
const tableAvec = (pdf) => () => Promise.resolve({id: [ID_CONVENTION], PDF_genere: [pdf]});
const RESEAU_COUPE = () => Promise.reject(new Error(`Failed to fetch ${BASE_URL}?auth=${JETON}`));

// Echoue si, apres un reseau coupe ou une reponse 408/5xx au PATCH, la relecture qui trouve le
// NOUVEAU fichier dans PDF_genere n'est pas traitee comme une reussite : pas d'erreur, memoire
// a jour (nouveau fichier, nouvelle date), resultat avec le nom du fichier, une seule relecture,
// de la table Conventions, et un seul PATCH (pas de nouvel essai).
const PATCH_INCERTAINS = [
  ["réseau coupé", RESEAU_COUPE],
  ["réponse 408", () => Promise.resolve(reponse(false, 408, {}))],
  ["réponse 500", () => Promise.resolve(reponse(false, 500, {}))],
  ["réponse 503", () => Promise.resolve(reponse(false, 503, {}))],
];
for (const [nom, patch] of PATCH_INCERTAINS) {
  test(`relecture de secours : ${nom} puis fichier retrouvé → réussite`, async () => {
    const ctx = await preparerRegeneration({patch});
    const lectures = poserRelecture(ctx, tableAvec(["L", ID_PIECE_JOINTE]));

    const resultat = await ctx.w.conventionGenerer(1, NOUVELLES_VALEURS);

    assert.ok(resultat.nomFichier.endsWith(".pdf"), "pas d'erreur : la génération réussit");
    assert.deepEqual(lectures, ["Conventions"], "une seule relecture, de la table Conventions");
    assert.equal(ctx.fetchs.filter(estPatch).length, 1, "un seul PATCH");
    const ligne = ligneConvention(ctx.w);
    assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ID_PIECE_JOINTE], "mémoire : nouveau fichier");
    assert.ok(ligne.Date_generation > ANCIENNE_DATE, "mémoire : nouvelle date");
    assert.ok(!JSON.stringify(ctx.journal).includes(JETON), "pas de jeton dans la console");
  });
}

// Echoue si, quand la relecture ne retrouve PAS le nouveau fichier (ancien fichier encore la,
// ligne absente, colonne vide, ou relecture qui echoue aussi), l'echec habituel
// rattachement-echoue n'est pas rendu, ou si l'ancien PDF / l'ancienne date changent.
const RELECTURES_SANS_CONFIRMATION = [
  ["l'ancien fichier est encore là", tableAvec(["L", ANCIEN_PDF])],
  ["la colonne est vide", tableAvec(null)],
  ["la ligne est absente", () => Promise.resolve({id: [], PDF_genere: []})],
  ["la relecture échoue aussi", () => Promise.reject(new Error(`refus ${JETON}`))],
];
for (const [nom, relecture] of RELECTURES_SANS_CONFIRMATION) {
  test(`relecture de secours : réseau coupé puis ${nom} → échec habituel, ancien PDF intact`, async () => {
    const ctx = await preparerRegeneration({patch: RESEAU_COUPE});
    const lectures = poserRelecture(ctx, relecture);

    const erreur = await attraper(ctx.w.conventionGenerer(1, NOUVELLES_VALEURS));

    assert.ok(erreur, "l'échec reste affiché");
    assert.equal(erreur.code, "rattachement-echoue");
    assert.deepEqual(lectures, ["Conventions"], "une seule relecture");
    const ligne = ligneConvention(ctx.w);
    assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ANCIEN_PDF], "PDF_genere inchangé");
    assert.equal(ligne.Date_generation, ANCIENNE_DATE, "Date_generation inchangée");
    assert.ok(!visible(erreur).includes(JETON), "pas de jeton dans l'erreur");
    assert.ok(!JSON.stringify(ctx.journal).includes(JETON), "pas de jeton dans la console");
  });
}

// Echoue si un refus 4xx (droits, regle d'acces) declenche la relecture, meme si la table
// contiendrait le nouveau fichier : le refus doit rester un echec direct, ancien PDF intact.
for (const statut of [400, 401, 403, 404]) {
  test(`relecture de secours : refus ${statut} → échec direct, aucune relecture`, async () => {
    const ctx = await preparerRegeneration({patch: () => Promise.resolve(reponse(false, statut, {}))});
    const lectures = poserRelecture(ctx, tableAvec(["L", ID_PIECE_JOINTE]));

    const erreur = await attraper(ctx.w.conventionGenerer(1, NOUVELLES_VALEURS));

    assert.ok(erreur, "la génération est rejetée");
    assert.equal(erreur.code, "rattachement-echoue");
    assert.deepEqual(lectures, [], "fetchTable n'est pas appelé");
    const ligne = ligneConvention(ctx.w);
    assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ANCIEN_PDF]);
    assert.equal(ligne.Date_generation, ANCIENNE_DATE);
  });
}
