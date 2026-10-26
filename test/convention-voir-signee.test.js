"use strict";

// Bouton « Voir la convention signée » de l'état « Signée » (tâche 9.1c) : sa présence (état
// Signée seulement, avant « Remplacer »), son texte et son texte caché, l'ouverture du PDF SIGNÉ
// (conventionVoirSignee), « Ouverture en cours… » et clics ignorés, focus gardé puis restauré, la
// disponibilité pendant un remplacement (jamais verrouillé, décision S9-5), l'alerte précédente
// effacée, et le bloc refait pendant une ouverture.
// Les textes de référence sont ceux de docs/ux/convention.md (qui fait foi). Ils sont recopiés ici
// en dur : si le code change un mot, le test doit échouer. Le navigateur et Grist sont des
// doublures (onglet, adresses blob:, minuterie, fetch, getAccessToken). Aucun vrai jeton, aucune
// vraie adresse : valeurs fictives uniquement. Le test du focus après un premier dépôt est dans
// test/convention-deposer.test.js (il réutilise les doublures du dépôt).

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const TEXTE_VOIR_SIGNEE = "Voir la convention signée";
const TEXTE_CACHE = " (s'ouvre dans un nouvel onglet)";
const TEXTE_ATTENTE = "Ouverture en cours…";
const TEXTE_REMPLACER = "Remplacer le fichier signé";
const MESSAGE_ECHEC = "Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord.";
const LIBELLE_REPOS = `${TEXTE_VOIR_SIGNEE}<span class="sr-only">${TEXTE_CACHE}</span>`;

const JETON = "jeton-fictif+abc/123=";
const BASE_URL = "https://exemple.test/api/docs/doc-fictif";
const PIECE_GENEREE = 41;
const PIECE_SIGNEE = 52;
const ADRESSE_BLOB = "blob:https://exemple.test/00000000-fictif";

const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;
const attendre = () => new Promise((resolve) => setImmediate(resolve));

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function reponsePdf() {
  return {
    ok: true, status: 200,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    text: () => Promise.resolve(""),
  };
}

function reponseRefusee(status) {
  return {
    ok: false, status,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(""),
  };
}

// Une opération qu'on libère à la main : on regarde l'écran « pendant » l'attente.
function enAttente() {
  let resoudre;
  let rejeter;
  const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
  return {promesse, resoudre, rejeter};
}

// Un petit fichier factice de la forme que lit le contrôle du dépôt (size, name, type, slice).
function fichierFactice() {
  const octets = Uint8Array.from(Buffer.from("%PDF-1.4", "latin1"));
  return {
    name: "convention-signee-fictive.pdf", type: "application/pdf", size: 1234,
    slice: (de, a) => ({arrayBuffer: () => Promise.resolve(octets.slice(de, a).buffer)}),
  };
}

const CONVENTION_SIGNEE = () => ({
  id: 20, Action: 1, PDF_genere: ["L", PIECE_GENEREE], PDF_signe: ["L", PIECE_SIGNEE],
  Date_generation: secondes(2026, 3, 14), Date_depot: secondes(2026, 11, 27),
});

function donnees(conventions) {
  return {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{id: 7, Nom: "Club Exemple"}],
    Agences: [{id: 5, Libelle_agence: "Agence Exemple"}],
    Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple"}],
    Contacts: [],
    Conventions: conventions,
  };
}

// ---------------------------------------------------------------------------
// Faux navigateur et fausse API Grist
// ---------------------------------------------------------------------------
// preparer() charge le widget, pose une action à l'état « Signée » (PDF_genere = pièce jointe 41,
// PDF_signe = pièce jointe 52), branche les boutons comme renderEdit le fait (bindConvention) et
// note tout ce qui sort : trace, ouvertures (window.open), jetons, fetchs, blobs, liberees,
// appelsVoirSignee (chaque appel de conventionVoirSignee), journal (console), focus. Réglages :
// fetch, onglet (null = bloqué), conventions (remplace les lignes de Conventions).

async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  w.state.raw = donnees(options.conventions || [CONVENTION_SIGNEE()]);
  w.state.tablesRefusees = [];
  journal.length = 0;

  const global = w.window;
  const doc = w.document;
  const trace = [];
  const ouvertures = [];
  const jetons = [];
  const fetchs = [];
  const blobs = [];
  const liberees = [];
  const minuteries = [];
  const focus = {actif: null, appels: []};

  const onglet = options.onglet === null ? null : {
    location: {href: ""},
    opener: {sentinelle: true},
    closed: false,
    close() { this.closed = true; },
  };
  global.open = (adresse, cible) => { trace.push("ouverture"); ouvertures.push({adresse, cible}); return onglet; };
  global.Blob = class { constructor(parties, opts) { this.parties = parties; this.type = opts && opts.type; blobs.push(this); } };
  global.URL = {
    createObjectURL: (blob) => { assert.ok(blobs.includes(blob), "l'adresse vient d'un Blob créé par le widget"); return ADRESSE_BLOB; },
    revokeObjectURL: (adresse) => { liberees.push(adresse); },
  };
  global.setTimeout = (fonction, delai) => { minuteries.push({fonction, delai}); return minuteries.length; };
  w.grist.docApi.getAccessToken = (opts) => { trace.push("jeton"); jetons.push(opts); return Promise.resolve({token: JETON, baseUrl: BASE_URL}); };
  global.fetch = (url, opts) => {
    trace.push("fetch");
    fetchs.push({url, options: opts});
    return options.fetch ? options.fetch() : Promise.resolve(reponsePdf());
  };

  // L'appel à conventionVoirSignee est noté (le script l'appelle par son nom global).
  const appelsVoirSignee = [];
  const reelle = global.conventionVoirSignee;
  global.conventionVoirSignee = (actionId) => { appelsVoirSignee.push(actionId); return reelle(actionId); };

  const origine = doc.getElementById;
  doc.getElementById = (id) => {
    const element = origine(id);
    if (!element.suivi) {
      element.suivi = true;
      element.focus = () => { focus.actif = id; focus.appels.push(id); };
    }
    return element;
  };

  const bouton = doc.getElementById("conventionVoirSignee");
  const ecouteurs = {};
  bouton.addEventListener = (type, fonction) => { ecouteurs[type] = fonction; };

  // « Remplacer » et le sélecteur de fichier : on capte le clic, le sélecteur ne fait rien.
  const remplacer = doc.getElementById("conventionRemplacer");
  const ecouteursRemplacer = {};
  remplacer.addEventListener = (type, fonction) => { ecouteursRemplacer[type] = fonction; };
  const champ = doc.getElementById("conventionFichier");
  champ.click = () => {};

  // Le libellé du bouton (.btn-content) : on garde la dernière écriture, par textContent (texte
  // brut) ou par innerHTML (texte, puis texte caché).
  const libelleElement = bouton.querySelector(".btn-content");
  let ecrit = {mode: "html", valeur: LIBELLE_REPOS};
  Object.defineProperty(libelleElement, "textContent", {get: () => (ecrit.mode === "texte" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "texte", valeur: String(v)}; }, configurable: true});
  Object.defineProperty(libelleElement, "innerHTML", {get: () => (ecrit.mode === "html" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "html", valeur: String(v)}; }, configurable: true});

  const zoneAlerte = doc.getElementById("conventionAlerte");

  w.bindConvention(1);

  return {
    w, trace, ouvertures, jetons, fetchs, blobs, liberees, minuteries, focus, journal, onglet, bouton, zoneAlerte,
    appelsVoirSignee, champ, remplacer, ecouteursRemplacer,
    libelle: () => ({mode: ecrit.mode, valeur: decoder(ecrit.valeur)}),
    // La personne a le focus sur le bouton, puis clique. Rend la promesse du gestionnaire.
    cliquer() {
      bouton.focus();
      focus.appels.length = 0;
      return ecouteurs.click({});
    },
    // Le bloc tel qu'il serait refait maintenant (HTML décodé).
    blocRefait: () => decoder(w.conventionBlocContenuHtml(1, w.state)),
    // Une personne choisit un fichier après « Remplacer » (doublures du réseau du dépôt).
    remplacerFichier(envoi) {
      w.window.conventionDemanderAcces = () => envoi.promesse.then(() => ({base: "https://exemple.invalid", jeton: "jeton-fictif"}));
      w.window.conventionEnvoyerPdf = () => Promise.resolve(99);
      w.window.conventionRattacherPdf = () => Promise.resolve({});
      ecouteursRemplacer.click({});
      champ.files = [fichierFactice()];
      champ.value = "C:\\fakepath\\convention.pdf";
      return champ.onchange();
    },
  };
}

// La balise <button> de « Voir la convention signée » dans un HTML, ou null.
function baliseVoirSignee(html) {
  const m = /<button\b[^>]*\sid="conventionVoirSignee"[^>]*>/.exec(html);
  return m ? m[0] : null;
}

function blocPour(w, conventions) {
  w.state.raw = donnees(conventions);
  w.state.tablesRefusees = [];
  return decoder(w.conventionBlocContenuHtml(1, w.state));
}

// ---------------------------------------------------------------------------
// 1. Présence et place du bouton
// ---------------------------------------------------------------------------

// Echoue si « Voir la convention signée » apparait ailleurs qu'a l'etat Signee (A generer, Generee,
// Sans modele, Droits insuffisants), manque a l'etat Signee, y est en double, ou n'est pas AVANT le
// lien « Remplacer le fichier signé » ; ou si « Voir la convention » (non signee) apparait a l'etat Signee.
test("« Voir la convention signée » n'existe qu'à l'état Signée, une seule fois, avant « Remplacer le fichier signé »", async () => {
  const m = await preparer();
  const w = m.w;
  const generee = {id: 20, Action: 1, PDF_genere: ["L", PIECE_GENEREE], Date_generation: secondes(2026, 3, 14)};
  const autres = {"À générer": [], "Générée": [generee]};
  for (const [nom, conventions] of Object.entries(autres)) {
    const html = blocPour(w, conventions);
    assert.ok(!html.includes("conventionVoirSignee"), `${nom} : pas de « Voir la convention signée »`);
    assert.ok(!html.includes(TEXTE_VOIR_SIGNEE), `${nom} : pas du libellé « Voir la convention signée »`);
  }
  w.state.raw = {...donnees([]), Modeles_convention: []};
  assert.ok(!decoder(w.conventionBlocContenuHtml(1, w.state)).includes("conventionVoirSignee"), "sans modèle : pas de « Voir la convention signée »");
  w.state.raw = donnees([CONVENTION_SIGNEE()]);
  w.state.tablesRefusees = ["Conventions"];
  assert.ok(!decoder(w.conventionBlocContenuHtml(1, w.state)).includes("conventionVoirSignee"), "droits insuffisants : pas de « Voir la convention signée »");
  w.state.tablesRefusees = [];

  const html = blocPour(w, [CONVENTION_SIGNEE()]);
  assert.equal(html.split('id="conventionVoirSignee"').length - 1, 1, "un seul « Voir la convention signée » à l'état Signée");
  assert.equal(html.split('id="conventionVoir"').length - 1, 0, "pas de « Voir la convention » (non signée) à l'état Signée");
  assert.ok(html.indexOf('id="conventionVoirSignee"') < html.indexOf('id="conventionRemplacer"'), "« Voir la convention signée » est AVANT « Remplacer »");
  const ids = [...html.matchAll(/<button\b[^>]*\sid="([^"]+)"/g)].map((x) => x[1]);
  assert.deepEqual(ids, ["conventionVoirSignee", "conventionRemplacer"], "dans l'ordre : Voir signée, puis Remplacer");
  assert.ok(html.includes(`>${TEXTE_REMPLACER}<`), "le lien « Remplacer le fichier signé » est toujours là");
});

// ---------------------------------------------------------------------------
// 2. Texte, texte caché, aucun jeton avant le clic
// ---------------------------------------------------------------------------

// Echoue si le bouton change de balise, d'id, de type ou de classes (btn btn-secondary), perd son
// texte « Voir la convention signée » ou son texte cache « (s'ouvre dans un nouvel onglet) » (dans un
// sr-only, a l'interieur de btn-content), porte aria-*, disabled, role, href ou target avant le clic,
// est dans autre chose que la rangee convention-actions, ou si la page contient un jeton ou une
// adresse avant le clic (ou si quelque chose est demande avant le clic).
test("le bouton « Voir la convention signée » : un vrai bouton, texte et texte caché exacts, aucun jeton ni requête avant le clic", async () => {
  const m = await preparer();
  const html = m.blocRefait();
  const balise = baliseVoirSignee(html);
  assert.ok(balise, "le bouton est dans le bloc à l'état Signée");
  assert.equal(balise, '<button class="btn btn-secondary" type="button" id="conventionVoirSignee">', "bouton secondaire, type button, rien d'autre");
  assert.ok(!/\s(aria-[\w-]+|disabled|role|href|target)\b/.test(balise), "ni aria-*, ni disabled, ni role, ni href, ni target avant le clic");
  assert.ok(html.includes(`<div class="convention-actions"><button class="btn btn-secondary" type="button" id="conventionVoirSignee"><span class="btn-content">${TEXTE_VOIR_SIGNEE}<span class="sr-only">${TEXTE_CACHE}</span></span></button></div>`),
    "texte exact, puis texte caché dans un sr-only, dans btn-content, sur la rangée convention-actions");
  assert.ok(!/<a\b/.test(html), "aucun lien <a> dans le bloc");
  for (const interdit of [JETON, "jeton", "token", "auth=", "/attachments/", "blob:", "href", "http"]) {
    assert.ok(!html.includes(interdit), `« ${interdit} » ne doit pas être dans la page avant le clic`);
  }
  assert.deepEqual([m.jetons, m.fetchs, m.ouvertures, m.appelsVoirSignee], [[], [], [], []], "rien n'est demandé, téléchargé ni ouvert avant le clic");
});

// ---------------------------------------------------------------------------
// 3. Le clic ouvre le fichier SIGNÉ
// ---------------------------------------------------------------------------

// Echoue si le clic n'appelle pas conventionVoirSignee (une fois, avec l'id de l'action), si l'onglet
// n'est pas ouvert vide en « _blank » pendant le clic (avant toute attente), si le telechargement n'est
// pas UNE requete vers <baseUrl>/attachments/<id de PDF_SIGNE>/download?auth=… (et non l'id de
// PDF_genere), si credentials n'est pas 'omit', si X-Requested-With manque, si le jeton demande n'est
// pas d'ecriture (readOnly: false), si le PDF n'est pas un Blob 'application/pdf' ouvert depuis l'adresse
// blob: (opener coupe, jamais l'adresse ?auth=), ou si une alerte s'affiche.
test("le clic appelle conventionVoirSignee, ouvre l'onglet tout de suite et affiche le PDF SIGNÉ (pas le PDF généré) depuis une adresse blob:", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const fin = m.cliquer();
  assert.deepEqual(m.appelsVoirSignee, [1], "conventionVoirSignee est appelée une fois, avec l'id de l'action");
  assert.equal(m.ouvertures.length, 1, "un onglet ouvert dès le clic, sans attente");
  assert.deepEqual({adresse: m.ouvertures[0].adresse, cible: m.ouvertures[0].cible}, {adresse: "", cible: "_blank"}, "onglet vide, en _blank");
  assert.equal(m.trace[0], "ouverture", "l'onglet est ouvert avant toute autre opération");
  attente.resoudre(reponsePdf());
  await fin;

  assert.equal(m.fetchs.length, 1, "une seule requête");
  assert.equal(m.fetchs[0].url, `${BASE_URL}/attachments/${PIECE_SIGNEE}/download?auth=${encodeURIComponent(JETON)}`, "adresse du fichier SIGNÉ, jeton encodé");
  assert.ok(!m.fetchs[0].url.includes(`/attachments/${PIECE_GENEREE}/`), "jamais l'adresse du PDF généré");
  assert.equal(m.fetchs[0].options.credentials, "omit", "credentials 'omit'");
  assert.deepEqual(JSON.parse(JSON.stringify(m.fetchs[0].options.headers)), {"X-Requested-With": "XMLHttpRequest"}, "en-tête X-Requested-With");
  assert.equal(m.jetons.length, 1, "un seul jeton demandé");
  assert.equal(m.jetons[0].readOnly, false, "jeton d'écriture (readOnly: false)");
  assert.equal(m.blobs.length, 1, "un Blob");
  assert.equal(m.blobs[0].type, "application/pdf", "type application/pdf");
  assert.equal(m.onglet.location.href, ADRESSE_BLOB, "l'onglet est envoyé vers l'adresse blob:");
  assert.equal(m.onglet.closed, false, "l'onglet n'est pas refermé");
  assert.equal(m.onglet.opener, null, "l'onglet ne peut pas agir sur la page du widget");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
  const vu = JSON.stringify([m.journal, m.zoneAlerte.innerHTML]);
  assert.ok(!vu.includes(JETON) && !vu.includes("auth="), "ni jeton ni ?auth= dans la page ou la console");
});

// ---------------------------------------------------------------------------
// 4. « Ouverture en cours… », clics ignorés, focus
// ---------------------------------------------------------------------------

// Echoue si, pendant le telechargement, le bouton ne passe pas a « Ouverture en cours… » (sans le texte
// cache), n'est pas grise par aria-disabled="true" (jamais disabled), perd le focus, si un deuxieme
// clic ouvre un deuxieme onglet / redemande un jeton / relance un telechargement, ou si, a la fin, le
// bouton ne retrouve pas son texte, son texte cache, son etat degrise et le focus.
test("« Ouverture en cours… » : bouton grisé (aria-disabled), clics ignorés, focus gardé, puis texte, état et focus restaurés", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const premier = m.cliquer();
  await attendre();

  assert.deepEqual(m.libelle(), {mode: "texte", valeur: TEXTE_ATTENTE}, "texte « Ouverture en cours… », sans texte caché");
  assert.equal(m.bouton.getAttribute("aria-disabled"), "true", "bouton grisé par aria-disabled");
  assert.equal(m.bouton.getAttribute("disabled"), null, "jamais l'attribut disabled");
  assert.equal(m.focus.actif, "conventionVoirSignee", "le focus reste sur le bouton pendant l'attente");

  await m.cliquer();
  await m.cliquer();
  assert.equal(m.appelsVoirSignee.length, 1, "les clics suivants n'appellent pas conventionVoirSignee");
  assert.equal(m.ouvertures.length, 1, "ni un autre onglet");
  assert.equal(m.jetons.length, 1, "ni un autre jeton");
  assert.equal(m.fetchs.length, 1, "ni un autre téléchargement");
  assert.equal(m.libelle().valeur, TEXTE_ATTENTE, "le texte d'attente n'a pas bougé");
  assert.equal(m.focus.actif, "conventionVoirSignee", "le focus reste sur le bouton après les clics ignorés");

  attente.resoudre(reponsePdf());
  await premier;
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "le bouton est dégrisé à la fin");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: LIBELLE_REPOS}, "texte d'origine et texte caché revenus");
  assert.equal(m.onglet.location.href, ADRESSE_BLOB, "le PDF s'est ouvert une seule fois");
  assert.equal(m.focus.actif, "conventionVoirSignee", "le focus est resté sur le bouton jusqu'à la fin");
  assert.deepEqual(m.focus.appels.filter((id) => id !== "conventionVoirSignee"), [], "le focus n'est allé nulle part ailleurs");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
});

// ---------------------------------------------------------------------------
// 5. Alerte précédente effacée à l'ouverture
// ---------------------------------------------------------------------------

// Echoue si l'alerte precedente (echec d'une ouverture, ou toute autre alerte du bloc) reste affichee
// quand une nouvelle ouverture commence (elle doit etre effacee des le clic, pas a la fin), si un echec
// n'affiche pas le message exact dans une alerte role="alert", si le bouton reste grise apres l'echec
// ou perd le focus, ou si le verrou reste pose (le clic suivant serait ignore).
test("l'alerte précédente est effacée dès le clic ; un échec affiche le message exact, dégrise le bouton et garde le focus", async () => {
  let essai = 0;
  const attente = enAttente();
  const m = await preparer({fetch: () => (++essai === 1 ? Promise.resolve(reponseRefusee(403)) : attente.promesse)});

  await m.cliquer();
  assert.match(m.zoneAlerte.innerHTML, /<div class="alert alert-error" role="alert">/, "alerte d'erreur avec role=\"alert\"");
  assert.equal(decoder(m.zoneAlerte.innerHTML.replace(/<[^>]+>/g, "")), MESSAGE_ECHEC, "message exact");
  assert.equal(m.onglet.closed, true, "l'onglet vide est refermé");
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "le bouton est dégrisé après l'échec");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: LIBELLE_REPOS}, "texte d'origine revenu après l'échec");
  assert.equal(m.focus.actif, "conventionVoirSignee", "le focus est resté sur le bouton");
  assert.deepEqual(m.focus.appels.filter((id) => id !== "conventionVoirSignee"), [], "jamais sur l'alerte");

  // Une autre alerte du bloc (par exemple celle d'un dépôt) est aussi effacée à l'ouverture.
  m.zoneAlerte.innerHTML = '<div class="alert alert-success"><p class="alert-content">Ancien message fictif.</p></div>';
  const suite = m.cliquer();
  await attendre();
  assert.equal(m.zoneAlerte.innerHTML, "", "l'alerte précédente est effacée dès le clic, avant la fin de l'ouverture");
  assert.equal(m.libelle().valeur, TEXTE_ATTENTE, "la nouvelle ouverture est en cours");
  attente.resoudre(reponsePdf());
  await suite;
  assert.equal(m.ouvertures.length, 2, "le nouvel essai ouvre son propre onglet");
  assert.equal(m.zoneAlerte.innerHTML, "", "toujours aucune alerte");
});

// ---------------------------------------------------------------------------
// 6. Jamais verrouillé pendant un remplacement (décision S9-5)
// ---------------------------------------------------------------------------

// Echoue si « Voir la convention signée » se grise ou change de texte quand un remplacement est en
// cours (verrou de « Remplacer » et de « Re-générer » seulement), si le bloc refait pendant le
// remplacement l'ecrit grise, si un clic dessus est ignore pendant le remplacement, ou s'il ne retrouve
// pas son etat normal apres le remplacement.
test("pendant un remplacement du fichier signé : « Voir la convention signée » n'est jamais verrouillé et s'ouvre normalement", async () => {
  const m = await preparer();
  const envoi = enAttente();
  const termine = m.remplacerFichier(envoi);
  await attendre();

  assert.equal(m.remplacer.getAttribute("aria-disabled"), "true", "(contrôle) « Remplacer » est verrouillé pendant l'envoi");
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "« Voir la convention signée » n'est pas grisé");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: LIBELLE_REPOS}, "son texte et son texte caché sont inchangés");
  const refait = baliseVoirSignee(m.blocRefait());
  assert.ok(refait && !/aria-disabled|\sdisabled\b/.test(refait), "bloc refait pendant le remplacement : « Voir la convention signée » est écrit actif");

  await m.cliquer();
  assert.deepEqual(m.appelsVoirSignee, [1], "le clic est pris en compte pendant le remplacement");
  assert.equal(m.ouvertures.length, 1, "il ouvre un onglet");
  assert.equal(m.onglet.location.href, ADRESSE_BLOB, "le PDF signé s'ouvre");
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "dégrisé après l'ouverture");

  envoi.resoudre();
  await termine;
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "toujours actif après le remplacement");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: LIBELLE_REPOS}, "texte d'origine après le remplacement");
});

// ---------------------------------------------------------------------------
// 7. Bloc refait pendant une ouverture
// ---------------------------------------------------------------------------

// Echoue si le bloc refait pendant une ouverture (HTML reconstruit) ne pose pas le verrou sur le
// nouveau bouton (aria-disabled="true", sans disabled) avec le texte « Ouverture en cours… » et sans le
// texte cache, si « Remplacer » est touche, ou si le bloc refait apres l'ouverture garde le verrou ou
// perd le texte cache.
test("bloc refait pendant une ouverture : « Voir la convention signée » est écrit verrouillé (texte et aria-disabled), puis normal à la fin", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const ouverture = m.cliquer();
  await attendre();

  const html = m.blocRefait();
  const balise = baliseVoirSignee(html);
  assert.ok(balise, "le bouton est dans le bloc refait");
  assert.ok(balise.includes('aria-disabled="true"') && !/\sdisabled\b/.test(balise), "écrit avec aria-disabled=\"true\", jamais disabled");
  assert.ok(html.includes(`<span class="btn-content">${TEXTE_ATTENTE}</span>`), "texte « Ouverture en cours… » écrit dans btn-content");
  const bouton = /<button\b[^>]*\sid="conventionVoirSignee"[\s\S]*?<\/button>/.exec(html)[0];
  assert.ok(!bouton.includes("sr-only") && !bouton.includes(TEXTE_VOIR_SIGNEE), "sans le texte caché ni le texte d'origine pendant l'attente");
  const remplacer = /<button\b[^>]*\sid="conventionRemplacer"[^>]*>/.exec(html)[0];
  assert.ok(!/aria-disabled|\sdisabled\b/.test(remplacer), "« Remplacer » n'est pas touché par l'ouverture");

  attente.resoudre(reponsePdf());
  await ouverture;
  const apres = m.blocRefait();
  assert.ok(!baliseVoirSignee(apres).includes("aria-disabled"), "après l'ouverture, le bloc refait n'a plus de verrou");
  assert.ok(apres.includes(`<span class="btn-content">${LIBELLE_REPOS}</span>`), "après l'ouverture, texte et texte caché d'origine");
});
