"use strict";

// Delais maximum des appels reseau de la generation (conventionAvecDelai, script.js) : le jeton
// (15 s), chaque logo (15 s), l'envoi du PDF (20 s), le PATCH de rattachement (20 s) et la
// relecture de secours (15 s). Objectif : la fenetre ne reste jamais bloquee si le reseau coupe.
// Le delai de pdfmake (20 s) est teste dans convention-generation.test.js.
// Les minuteries sont simulees (setTimeout et clearTimeout posees sur w.window, le vrai global du
// bac a sable) : le test n'attend jamais 15 ou 20 secondes, il declenche la minuterie a la main.
// Une minuterie « active » n'est ni arretee (clearTimeout) ni declenchee.
// Le bac a sable de test/helpers/widget.js n'a ni FormData, ni Blob : les doublures sont posees ici.
// Les ecrans (verrou, message, focus) utilisent les doublures de DOM de ce bac a sable, qui rendent
// toujours le meme element pour un meme identifiant. Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const JETON = "jeton-fictif-0a1b2c3d";
const BASE_URL = "https://grist.exemple.test/api/docs/document-fictif";
const ID_PIECE_JOINTE = 42;
const ID_CONVENTION = 9;
const ID_LOGO = 101;
const ID_PARTENAIRE = 102;

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true, Contenu: "Texte de convention fictif."};
const CONTACTS = [{id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"}];
const VALEURS = {annee: "2031", anneeIllisible: false, signataire: 31, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};
const LIGNE_CONVENTION = {
  id: ID_CONVENTION, Action: 1, Modele: 10, Annee: 2031, Signataire_club: 31,
  Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe",
};

// Messages de la note UX (§3 « Échecs »), recopiés en dur : si le code change un mot, le test échoue.
const MESSAGE_ENVOI_IMPOSSIBLE = "La convention n'a pas pu être enregistrée : l'envoi du fichier a échoué. Vérifiez votre connexion, puis réessayez. Vos informations sont conservées.";
const MESSAGE_RATTACHEMENT = "La convention n'a pas pu être enregistrée : le fichier a été fabriqué mais n'a pas pu être rattaché à l'action. Réessayez ou contactez l'équipe du tableau de bord. Vos informations sont conservées.";
const LIBELLE = "Générer la convention";
const BOUTONS_DU_PIED = ["conventionFermer", "conventionEnregistrer", "conventionGenererFenetre"];

const attendre = () => new Promise((resolve) => setImmediate(resolve));
const jamais = () => new Promise(() => {});

// PNG minimal lisible (signature + en-tete IHDR : largeur et hauteur), comme convention-logos.test.js.
function png(largeur, hauteur) {
  const octets = new Uint8Array(33);
  octets.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 0);
  const vue = new DataView(octets.buffer);
  vue.setUint32(16, largeur);
  vue.setUint32(20, hauteur);
  return octets;
}

function reponse(ok, status, corps) {
  return {ok, status, json: () => Promise.resolve(corps), text: () => Promise.resolve("")};
}

const reponseLogo = () => Promise.resolve({ok: true, status: 200, arrayBuffer: () => Promise.resolve(png(1000, 500).buffer)});

// ---------------------------------------------------------------------------
// Mise en place
// ---------------------------------------------------------------------------
// options.logos : le modele a Logo et Logo_partenaire (sinon aucun logo, donc aucun telechargement).
// options.fetch(url, opts, ctx) : remplace la reponse de fetch pour tout ce qui n'est pas un
//   telechargement de logo ; renvoie undefined pour garder la reponse normale.
// options.jeton : remplace getAccessToken.
// Notes : minuteries (toutes celles posees par le widget), fetchs, jetons, compteurs (pdfmake, pdf),
// docs (documents donnes a createPdf), journal (console).
async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();

  const modele = {...MODELE};
  if (options.logos) { modele.Logo = ["L", ID_LOGO]; modele.Logo_partenaire = ["L", ID_PARTENAIRE]; }
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [modele],
    Contacts: CONTACTS.map((c) => ({...c})),
    Conventions: [{...LIGNE_CONVENTION}],
  };
  w.state.tablesRefusees = [];
  journal.length = 0;

  const global = w.window;
  const fetchs = [];
  const jetons = [];
  const docs = [];
  const compteurs = {pdfmake: 0, pdf: 0};

  // Minuteries simulees : chacune garde son delai, sa fonction, et si elle est arretee ou declenchee.
  const minuteries = [];
  global.setTimeout = (fonction, delai) => { minuteries.push({fonction, delai, arretee: false, declenchee: false}); return minuteries.length; };
  global.clearTimeout = (id) => { if (minuteries[id - 1]) minuteries[id - 1].arretee = true; };

  global.FormData = class { constructor() { this.parties = []; } append(nom, valeur, fichier) { this.parties.push([nom, valeur, fichier]); } };
  global.Blob = class { constructor(parties) { this.size = parties ? parties.length : 0; } };
  global.chargerPdfmake = () => { compteurs.pdfmake += 1; return Promise.resolve(); };
  global.pdfMake = {createPdf: (document) => { compteurs.pdf += 1; docs.push(document); return {getBlob: () => Promise.resolve({size: 1234})}; }};

  w.grist.docApi.getAccessToken = options.jeton || ((opts) => { jetons.push(opts); return Promise.resolve({token: JETON, baseUrl: BASE_URL}); });
  w.grist.docApi.applyUserActions = (actions) => {
    const [type, , id] = actions[0];
    return Promise.resolve({retValues: [type === "AddRecord" ? 55 : (id ?? null)]});
  };
  global.fetch = (url, opts) => {
    fetchs.push({url, options: opts});
    if (String(url).includes("/download?")) return options.logoReponse ? options.logoReponse(url) : reponseLogo();
    if (options.fetch) {
      const surcharge = options.fetch(url, opts);
      if (surcharge !== undefined) return surcharge;
    }
    if (String(url).includes("/attachments")) return Promise.resolve(reponse(true, 200, [ID_PIECE_JOINTE]));
    return Promise.resolve(reponse(true, 200, {}));
  };

  const ctx = {w, minuteries, fetchs, jetons, docs, compteurs, journal};
  ctx.actives = () => minuteries.filter((m) => !m.arretee && !m.declenchee);
  // Attend qu'une minuterie active de ce delai apparaisse, puis la declenche (le delai est ecoule).
  ctx.declencher = async (delai) => {
    for (let i = 0; i < 50 && !ctx.actives().some((m) => m.delai === delai); i++) await attendre();
    const minuterie = ctx.actives().find((m) => m.delai === delai);
    assert.ok(minuterie, `une minuterie de ${delai} ms est active`);
    minuterie.declenchee = true;
    minuterie.fonction();
    await attendre();
  };
  // L'enregistrement des informations est le tout premier appel de la generation : sa minuterie
  // (20 s, posee avant celle du jeton) doit etre la premiere, puis arretee quand il repond. On
  // attend cet arret avant de declencher une minuterie de 20 s des etapes suivantes, sans quoi on
  // declencherait celle de l'enregistrement.
  ctx.passerEnregistrement = async () => {
    for (let i = 0; i < 50 && !(minuteries[0] && minuteries[0].arretee); i++) await attendre();
    assert.ok(minuteries[0], "la minuterie de l'enregistrement est posée en premier");
    assert.equal(minuteries[0].delai, 20000, "la première minuterie est celle de l'enregistrement (20 s)");
    assert.equal(minuteries[0].arretee, true, "la minuterie de l'enregistrement est arrêtée : il a répondu");
  };
  return ctx;
}

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

const estPatch = (requete) => requete.options && requete.options.method === "PATCH";
const estEnvoi = (requete) => String(requete.url).includes("/attachments?");

// ---------------------------------------------------------------------------
// 1. conventionAvecDelai, directement
// ---------------------------------------------------------------------------

// Echoue si une promesse qui se termine avant le delai ne rend pas sa valeur, si la minuterie
// n'est pas posee avec le delai demande puis arretee, ou si creerErreur est appelee pour rien.
test("conventionAvecDelai : une réponse reçue à temps est rendue et la minuterie est arrêtée", async () => {
  const ctx = await preparer();
  let creations = 0;

  const valeur = await ctx.w.conventionAvecDelai(Promise.resolve("réponse fictive"), 15000, () => { creations += 1; return new Error("trop tard"); });

  assert.equal(valeur, "réponse fictive");
  assert.equal(ctx.minuteries.length, 1, "une minuterie");
  assert.equal(ctx.minuteries[0].delai, 15000, "le délai demandé");
  assert.equal(ctx.minuteries[0].arretee, true, "minuterie arrêtée");
  assert.equal(creations, 0, "l'erreur de délai n'est pas fabriquée");
});

// Echoue si l'erreur d'une promesse qui echoue avant le delai n'est pas transmise telle quelle
// (meme objet), ou si la minuterie reste active.
test("conventionAvecDelai : l'échec reçu à temps est transmis tel quel et la minuterie est arrêtée", async () => {
  const ctx = await preparer();
  const echec = new Error("refus fictif");

  const erreur = await attraper(ctx.w.conventionAvecDelai(Promise.reject(echec), 20000, () => new Error("trop tard")));

  assert.equal(erreur, echec, "la même erreur");
  assert.equal(ctx.minuteries[0].delai, 20000);
  assert.equal(ctx.minuteries[0].arretee, true, "minuterie arrêtée");
});

// Echoue si, le delai ecoule, la promesse n'est pas rejetee avec l'erreur de creerErreur (meme
// objet), ou si une reponse arrivee apres le delai change le resultat.
test("conventionAvecDelai : au bout du délai, rejet avec l'erreur prévue ; la réponse tardive est ignorée", async () => {
  const ctx = await preparer();
  const prevue = new Error("délai dépassé fictif");
  let tardive;
  const lente = new Promise((resolve) => { tardive = resolve; });
  const promesse = ctx.w.conventionAvecDelai(lente, 15000, () => prevue);
  const resultat = attraper(promesse);

  await attendre();
  assert.equal(ctx.actives().length, 1, "une minuterie active tant que rien n'arrive");
  ctx.minuteries[0].declenchee = true;
  ctx.minuteries[0].fonction();
  const erreur = await resultat;
  tardive("réponse trop tardive");
  await attendre();

  assert.equal(erreur, prevue, "l'erreur prévue pour ce cas");
});

// ---------------------------------------------------------------------------
// 2. Les appels de la generation
// ---------------------------------------------------------------------------

// Echoue si un jeton qui n'arrive pas ne donne pas envoi-impossible au bout de 15 s, si une
// requete part malgre tout (logos, envoi), ou si pdfmake est charge apres l'echec.
test("jeton : sans réponse au bout de 15 s → envoi-impossible, rien n'est envoyé", async () => {
  const ctx = await preparer({jeton: jamais});

  const promesse = ctx.w.conventionGenerer(1, VALEURS);
  const resultat = attraper(promesse);
  await ctx.declencher(15000);
  const erreur = await resultat;

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "envoi-impossible");
  assert.equal(ctx.fetchs.length, 0, "aucune requête");
  assert.equal(ctx.compteurs.pdfmake, 0, "pdfmake non chargé");
  assert.equal(ctx.compteurs.pdf, 0, "aucun PDF fabriqué");
  assert.equal(ctx.actives().length, 0, "plus aucune minuterie active");
});

// Echoue si un logo qui ne se telecharge pas arrete la generation, si les deux logos n'ont pas
// chacun leur minuterie de 15 s, si la generation ne continue pas sans logo (PDF sans en-tete,
// logosManquants = Logo et Logo_partenaire), ou si le reste de la generation est change.
test("logos : sans réponse au bout de 15 s → logos absents, la génération réussit sans eux", async () => {
  const ctx = await preparer({logos: true, logoReponse: jamais});

  const resultat = ctx.w.conventionGenerer(1, VALEURS);
  for (let i = 0; i < 50 && ctx.actives().filter((m) => m.delai === 15000).length < 2; i++) await attendre();
  assert.equal(ctx.actives().filter((m) => m.delai === 15000).length, 2, "une minuterie de 15 s par logo");
  await ctx.declencher(15000);
  await ctx.declencher(15000);
  const fin = await resultat;

  assert.deepEqual(Array.from(fin.logosManquants), ["Logo", "Logo_partenaire"]);
  assert.ok(fin.nomFichier.endsWith(".pdf"));
  assert.equal(ctx.compteurs.pdf, 1, "un seul PDF");
  assert.ok(!ctx.docs[0].header, "le PDF est fabriqué sans en-tête de logo");
  assert.equal(ctx.fetchs.filter(estEnvoi).length, 1, "le fichier est bien envoyé");
  assert.equal(ctx.fetchs.filter(estPatch).length, 1, "le rattachement est bien fait");
});

// Echoue si une requete d'envoi qui ne repond pas ne donne pas envoi-impossible au bout de 20 s,
// ou si un rattachement est tente apres l'echec.
test("envoi du PDF : sans réponse au bout de 20 s → envoi-impossible, pas de rattachement", async () => {
  const ctx = await preparer({fetch: (url) => (String(url).includes("/attachments?") ? jamais() : undefined)});

  const resultat = attraper(ctx.w.conventionGenerer(1, VALEURS));
  await ctx.passerEnregistrement();
  await ctx.declencher(20000);
  const erreur = await resultat;

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "envoi-impossible");
  assert.equal(ctx.fetchs.filter(estPatch).length, 0, "aucun rattachement");
  assert.ok(!visible(erreur).includes(JETON), "pas de jeton dans l'erreur");
});

// Echoue si le delai de l'envoi ne couvre que fetch : une reponse arrivee mais dont le corps ne
// se lit jamais doit aussi donner envoi-impossible au bout de 20 s.
test("envoi du PDF : réponse arrivée mais corps jamais lu → envoi-impossible au bout de 20 s", async () => {
  const ctx = await preparer({
    fetch: (url) => (String(url).includes("/attachments?") ? Promise.resolve({ok: true, status: 200, json: jamais}) : undefined),
  });

  const resultat = attraper(ctx.w.conventionGenerer(1, VALEURS));
  await ctx.passerEnregistrement();
  await ctx.declencher(20000);
  const erreur = await resultat;

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "envoi-impossible");
  assert.equal(ctx.fetchs.filter(estPatch).length, 0, "aucun rattachement");
});

// Echoue si un PATCH sans reponse n'est pas traite comme un echec incertain : il faut relire la
// table, et quand elle porte deja le nouveau fichier, la generation reussit (un seul PATCH).
test("rattachement : PATCH sans réponse au bout de 20 s, fichier retrouvé à la relecture → réussite", async () => {
  const ctx = await preparer({fetch: (url, opts) => (opts && opts.method === "PATCH" ? jamais() : undefined)});
  const lectures = [];
  ctx.w.grist.docApi.fetchTable = (nom) => { lectures.push(nom); return Promise.resolve({id: [ID_CONVENTION], PDF_genere: [["L", ID_PIECE_JOINTE]]}); };

  const resultat = ctx.w.conventionGenerer(1, VALEURS);
  await ctx.passerEnregistrement();
  await ctx.declencher(20000);
  const fin = await resultat;

  assert.ok(fin.nomFichier.endsWith(".pdf"), "la génération réussit");
  assert.deepEqual(lectures, ["Conventions"], "une seule relecture, de la table Conventions");
  assert.equal(ctx.fetchs.filter(estPatch).length, 1, "pas de nouvel essai");
});

// Echoue si un PATCH sans reponse, suivi d'une relecture qui ne retrouve pas le fichier, ne donne
// pas l'echec habituel rattachement-echoue, ou si la memoire de la convention est modifiee.
test("rattachement : PATCH sans réponse au bout de 20 s, fichier absent à la relecture → rattachement-echoue", async () => {
  const ctx = await preparer({fetch: (url, opts) => (opts && opts.method === "PATCH" ? jamais() : undefined)});
  ctx.w.grist.docApi.fetchTable = () => Promise.resolve({id: [ID_CONVENTION], PDF_genere: [null]});

  const resultat = attraper(ctx.w.conventionGenerer(1, VALEURS));
  await ctx.passerEnregistrement();
  await ctx.declencher(20000);
  const erreur = await resultat;

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "rattachement-echoue");
  assert.equal(ctx.w.state.raw.Conventions[0].PDF_genere, undefined, "PDF_genere non modifié en mémoire");
  assert.equal(ctx.w.state.raw.Conventions[0].Date_generation, undefined, "Date_generation non modifiée en mémoire");
});

// Echoue si une relecture de secours qui ne repond pas au bout de 15 s n'est pas comptee comme
// « fichier non retrouve » (rattachement-echoue), ou si la fenetre reste en attente.
test("relecture de secours : sans réponse au bout de 15 s → rattachement-echoue", async () => {
  const ctx = await preparer({fetch: (url, opts) => (opts && opts.method === "PATCH" ? jamais() : undefined)});
  const lectures = [];
  ctx.w.grist.docApi.fetchTable = (nom) => { lectures.push(nom); return jamais(); };

  const resultat = attraper(ctx.w.conventionGenerer(1, VALEURS));
  await ctx.passerEnregistrement();
  await ctx.declencher(20000);
  await ctx.declencher(15000);
  const erreur = await resultat;

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "rattachement-echoue");
  assert.deepEqual(lectures, ["Conventions"], "une seule relecture");
  assert.equal(ctx.actives().length, 0, "plus aucune minuterie active");
});

// Echoue si, pour une generation qui reussit sans lenteur, les minuteries ne sont pas posees dans
// l'ordre enregistrement (20 s), jeton (15 s), pdfmake (20 s), envoi (20 s), rattachement (20 s),
// ou si l'une reste active.
test("génération réussie : une minuterie par appel, dans l'ordre, toutes arrêtées à la fin", async () => {
  const ctx = await preparer();

  const fin = await ctx.w.conventionGenerer(1, VALEURS);

  assert.ok(fin.nomFichier.endsWith(".pdf"));
  assert.deepEqual(ctx.minuteries.map((m) => m.delai), [20000, 15000, 20000, 20000, 20000]);
  assert.equal(ctx.actives().length, 0, "aucune minuterie ne reste active");
  assert.equal(ctx.minuteries.filter((m) => m.declenchee).length, 0, "aucune n'a été déclenchée");
});

// ---------------------------------------------------------------------------
// 3. Le verrou de la fenetre est toujours leve
// ---------------------------------------------------------------------------
// On clique vraiment sur « Generer la convention » (lancerGenerationConvention) avec la vraie
// conventionGenerer. Seul lireConventionForm est remplacee (la saisie), pour ne pas monter la
// fenetre entiere. Vu de l'ecran : trois boutons sans aria-disabled, blocs modifiables, libelle
// d'origine, zone d'attente vide, message, focus. Un nouveau clic relance la generation : c'est
// la preuve que le verrou interne est leve.

async function preparerEcran(options) {
  const ctx = await preparer(options);
  const {w} = ctx;
  const doc = w.document;
  w.state.conventionOpen = true;
  w.window.lireConventionForm = () => ({...VALEURS});
  w.window.closeConvention = () => {};
  w.window.conventionRafraichirBloc = () => {};
  const fieldsets = [{disabled: false}, {disabled: false}, {disabled: false}];
  doc.querySelectorAll = (selecteur) => (String(selecteur) === "#conventionDialog fieldset" ? fieldsets : []);

  const focus = [];
  for (const id of [...BOUTONS_DU_PIED, "conventionVoir"]) doc.getElementById(id).focus = () => { focus.push(id); };

  ctx.fieldsets = fieldsets;
  ctx.focus = focus;
  ctx.element = (id) => doc.getElementById(id);
  ctx.cliquer = () => w.lancerGenerationConvention(1);
  // Nombre de jetons demandes, quel que soit le comportement de getAccessToken : un nouveau clic
  // qui relance la generation en demande un de plus.
  let demandes = 0;
  const jetonDuTest = w.grist.docApi.getAccessToken;
  w.grist.docApi.getAccessToken = (opts) => { demandes += 1; return jetonDuTest(opts); };
  ctx.demandes = () => demandes;
  return ctx;
}

function verifierVerrouLeve(ctx, nom) {
  for (const id of BOUTONS_DU_PIED) {
    assert.equal(ctx.element(id).getAttribute("aria-disabled"), null, `${nom} : ${id} n'est plus grisé`);
  }
  assert.deepEqual(ctx.fieldsets.map((f) => f.disabled), [false, false, false], `${nom} : les trois blocs sont modifiables`);
  assert.equal(ctx.element("conventionGenererFenetre").querySelector(".btn-content").textContent, LIBELLE, `${nom} : libellé d'origine`);
  assert.equal(ctx.element("conventionAttente").innerHTML, "", `${nom} : zone d'attente vidée`);
}

// Pendant l'attente, tout est verrouille : c'est le point de depart de ce que les tests suivants
// verifient comme leve. Echoue si le clic ne grise pas les boutons et ne bloque pas les blocs.
async function verifierVerrouPose(ctx, nom) {
  for (const id of BOUTONS_DU_PIED) {
    assert.equal(ctx.element(id).getAttribute("aria-disabled"), "true", `${nom} : ${id} grisé pendant l'attente`);
  }
  assert.deepEqual(ctx.fieldsets.map((f) => f.disabled), [true, true, true], `${nom} : blocs bloqués pendant l'attente`);
}

// Echoue si, apres un delai depasse, la fenetre reste verrouillee, si le message exact n'est pas
// affiche (alert-error), si le focus n'est pas sur le bouton, ou si un nouveau clic ne relance pas.
const ECRANS = [
  {
    nom: "jeton sans réponse",
    options: {jeton: jamais},
    delais: [15000],
    message: MESSAGE_ENVOI_IMPOSSIBLE,
  },
  {
    nom: "envoi du PDF sans réponse",
    options: {fetch: (url) => (String(url).includes("/attachments?") ? jamais() : undefined)},
    delais: [20000],
    message: MESSAGE_ENVOI_IMPOSSIBLE,
  },
  {
    nom: "PATCH et relecture sans réponse",
    options: {fetch: (url, opts) => (opts && opts.method === "PATCH" ? jamais() : undefined)},
    fetchTable: jamais,
    delais: [20000, 15000],
    message: MESSAGE_RATTACHEMENT,
  },
];
for (const cas of ECRANS) {
  test(`écran : ${cas.nom} → message d'échec, fenêtre déverrouillée, focus sur le bouton`, async () => {
    const ctx = await preparerEcran(cas.options);
    if (cas.fetchTable) ctx.w.grist.docApi.fetchTable = cas.fetchTable;

    const clic = ctx.cliquer();
    await attendre();
    await verifierVerrouPose(ctx, cas.nom);
    for (const delai of cas.delais) await ctx.declencher(delai);
    await clic;

    verifierVerrouLeve(ctx, cas.nom);
    const alerte = ctx.element("conventionMessage");
    assert.equal(alerte.classList.contains("is-hidden"), false, "l'alerte est visible");
    assert.equal(alerte.classList.contains("alert-error"), true, "alert-error");
    assert.equal(alerte.querySelector(".alert-content").textContent, cas.message, "message exact");
    assert.equal(ctx.focus[ctx.focus.length - 1], "conventionGenererFenetre", "le focus est sur « Générer la convention »");

    // Le verrou interne est bien leve : un nouveau clic relance la generation.
    const demandesAvant = ctx.demandes();
    const nouveau = ctx.cliquer();
    await attendre();
    assert.equal(ctx.demandes(), demandesAvant + 1, "un nouveau clic relance la génération");
    assert.equal(ctx.element("conventionGenererFenetre").getAttribute("aria-disabled"), "true", "elle est de nouveau verrouillée");
    for (const delai of cas.delais) await ctx.declencher(delai);
    await nouveau;
    verifierVerrouLeve(ctx, `${cas.nom} (2e essai)`);
  });
}

// Echoue si un logo qui n'arrive pas laisse la fenetre verrouillee apres la reussite, si le message
// « Convention generee. » avec la mention du logo absent n'est pas affiche, ou si le focus
// ne va pas sur « Voir la convention ».
test("écran : logos sans réponse → génération réussie sans logo, fenêtre déverrouillée, message et focus", async () => {
  const ctx = await preparerEcran({logos: true, logoReponse: jamais});

  const clic = ctx.cliquer();
  await attendre();
  await verifierVerrouPose(ctx, "logos");
  await ctx.declencher(15000);
  await ctx.declencher(15000);
  await clic;

  verifierVerrouLeve(ctx, "logos");
  const html = ctx.element("conventionAlerte").innerHTML;
  assert.ok(html.includes("alert-success"), "alerte de réussite");
  assert.ok(html.includes("Convention générée."), "« Convention générée. »");
  assert.ok(html.includes("sans le logo France Travail"), "le logo absent est signalé");
  assert.equal(ctx.focus[ctx.focus.length - 1], "conventionVoir", "le focus va sur « Voir la convention »");
  assert.equal(ctx.element("conventionMessage").classList.contains("alert-error"), false, "pas d'alerte d'erreur");
});
