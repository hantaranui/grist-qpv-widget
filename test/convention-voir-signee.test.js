"use strict";

// Bouton « Voir la convention signée » de l'état « Signée » (tâche 9.1c ; évolution 2 : pop-up plein
// écran, note UX docs/ux/convention.md §14) : sa présence (état Signée seulement, avant « Remplacer »,
// avec « Télécharger » entre les deux), son texte, son texte caché « (s'ouvre dans une fenêtre) » et
// aria-haspopup, l'ouverture du PDF SIGNÉ dans la pop-up (conventionVoirSignee ; plus de nouvel onglet),
// « Ouverture en cours… » et clics ignorés, focus gardé puis restauré, la disponibilité pendant un
// remplacement (jamais verrouillé, décision S9-5), l'alerte précédente effacée, le bloc refait pendant
// une ouverture, puis ce que la pop-up a de propre au fichier signé (nom du fichier signé comme titre,
// title du cadre, texte caché de « Télécharger », retour du focus) et « Télécharger » du bloc signé.
// Les tests communs de la pop-up (plein écran, croix, Échap, texte de repli, etc.) sont dans
// test/convention-voir.test.js ; ils ne sont pas répétés ici.
// Les textes de référence sont ceux de docs/ux/convention.md (qui fait foi). Ils sont recopiés ici
// en dur : si le code change un mot, le test doit échouer. Le navigateur et Grist sont des
// doublures (lien <a>, adresses blob:, minuterie, fetch, getAccessToken ; voir
// test/helpers/convention-popup.js). Aucun vrai jeton, aucune vraie adresse : valeurs fictives
// uniquement. Le test du focus après un premier dépôt est dans test/convention-deposer.test.js (il
// réutilise les doublures du dépôt).

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");
const {installerPopup} = require("./helpers/convention-popup");

const TEXTE_VOIR_SIGNEE = "Voir la convention signée";
const TEXTE_CACHE = " (s'ouvre dans une fenêtre)";
const TEXTE_ATTENTE = "Ouverture en cours…";
const TEXTE_REMPLACER = "Remplacer le fichier signé";
const MESSAGE_ECHEC = "Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord.";
const LIBELLE_REPOS = `${TEXTE_VOIR_SIGNEE}<span class="sr-only">${TEXTE_CACHE}</span>`;
const TEXTE_TELECHARGER = "Télécharger";
const CACHE_TELECHARGER_SIGNEE = " le fichier PDF de la convention signée";
const LIBELLE_TELECHARGER_REPOS = `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER_SIGNEE}</span>`;
const TEXTE_TELECHARGEMENT = "Téléchargement en cours…";
// Nom exact du fichier signé : Convention-signee-[dispositif]-[club]-[année].pdf (note UX §14.4).
const NOM_FICHIER_SIGNE = "Convention-signee-Dispositif-Exemple-Club-Exemple-2026.pdf";

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
  id: 20, Action: 1, Annee: 2026, PDF_genere: ["L", PIECE_GENEREE], PDF_signe: ["L", PIECE_SIGNEE],
  Date_generation: secondes(2026, 3, 14), Date_depot: secondes(2026, 11, 27),
});

function donnees(conventions) {
  return {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{id: 7, Nom: "Club Exemple"}],
    Dispositifs: [{id: 3, Dispositif: "Dispositif Exemple"}],
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
// note tout ce qui sort : trace, jetons, fetchs, blobs, adresses (la première est ADRESSE_BLOB, les
// suivantes ADRESSE_BLOB-2…), liberees, minuteries, appelsVoirSignee (chaque appel de
// conventionVoirSignee), journal (console), focus, popup (test/helpers/convention-popup.js).
// Réglages : fetch, conventions (remplace les lignes de Conventions).

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
  const jetons = [];
  const fetchs = [];
  const blobs = [];
  const adresses = [];
  const liberees = [];
  const minuteries = [];
  const focus = {actif: null, appels: []};

  global.Blob = class { constructor(parties, opts) { this.parties = parties; this.type = opts && opts.type; blobs.push(this); } };
  global.URL = {
    createObjectURL: (blob) => {
      assert.ok(blobs.includes(blob), "l'adresse vient d'un Blob créé par le widget");
      const adresse = adresses.length ? `${ADRESSE_BLOB}-${adresses.length + 1}` : ADRESSE_BLOB;
      adresses.push(adresse);
      return adresse;
    },
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

  const popup = installerPopup(w);

  const bouton = doc.getElementById("conventionVoirSignee");
  const ecouteurs = {};
  bouton.addEventListener = (type, fonction) => { ecouteurs[type] = fonction; };
  const telecharger = doc.getElementById("conventionTelechargerSignee");
  const ecouteursTelecharger = {};
  telecharger.addEventListener = (type, fonction) => { ecouteursTelecharger[type] = fonction; };

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

  // Le libellé de « Télécharger » du bloc, suivi de la même façon.
  const libelleTelechargerElement = telecharger.querySelector(".btn-content");
  let ecritTelecharger = {mode: "html", valeur: LIBELLE_TELECHARGER_REPOS};
  Object.defineProperty(libelleTelechargerElement, "textContent", {get: () => (ecritTelecharger.mode === "texte" ? ecritTelecharger.valeur : ""), set: (v) => { ecritTelecharger = {mode: "texte", valeur: String(v)}; }, configurable: true});
  Object.defineProperty(libelleTelechargerElement, "innerHTML", {get: () => (ecritTelecharger.mode === "html" ? ecritTelecharger.valeur : ""), set: (v) => { ecritTelecharger = {mode: "html", valeur: String(v)}; }, configurable: true});

  const zoneAlerte = doc.getElementById("conventionAlerte");

  w.bindConvention(1);

  return {
    w, trace, jetons, fetchs, blobs, adresses, liberees, minuteries, focus, journal, popup, bouton, telecharger, zoneAlerte,
    appelsVoirSignee, champ, remplacer, ecouteursRemplacer,
    libelle: () => ({mode: ecrit.mode, valeur: decoder(ecrit.valeur)}),
    libelleTelecharger: () => ({mode: ecritTelecharger.mode, valeur: decoder(ecritTelecharger.valeur)}),
    // Clic sur « Télécharger » du BLOC signé (pas celui de la pop-up).
    cliquerTelechargerBloc() {
      telecharger.focus();
      focus.appels.length = 0;
      return ecouteursTelecharger.click({});
    },
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
// lien « Remplacer le fichier signé » ; ou si « Voir la convention » (non signee) apparait a l'etat Signee ;
// ou si « Télécharger » (signee) n'est pas entre les deux, ou apparait ailleurs qu'a l'etat Signee.
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
  assert.deepEqual(ids, ["conventionVoirSignee", "conventionTelechargerSignee", "conventionRemplacer"], "dans l'ordre : Voir signée, Télécharger, puis Remplacer");
  assert.equal(html.split('id="conventionTelechargerSignee"').length - 1, 1, "un seul « Télécharger » à l'état Signée");
  assert.ok(!html.includes('id="conventionTelecharger"'), "pas du « Télécharger » de l'état Générée à l'état Signée");
  assert.ok(!blocPour(w, [{id: 20, Action: 1, PDF_genere: ["L", PIECE_GENEREE], Date_generation: secondes(2026, 3, 14)}]).includes("conventionTelechargerSignee"), "pas de « Télécharger » signé à l'état Générée");
  assert.ok(html.includes(`>${TEXTE_REMPLACER}<`), "le lien « Remplacer le fichier signé » est toujours là");
});

// ---------------------------------------------------------------------------
// 2. Texte, texte caché, aucun jeton avant le clic
// ---------------------------------------------------------------------------

// Echoue si le bouton change de balise, d'id, de type ou de classes (btn btn-secondary), perd son
// texte « Voir la convention signée » ou son texte cache « (s'ouvre dans une fenetre) » (dans un
// sr-only, a l'interieur de btn-content), perd aria-haspopup="dialog", porte aria-disabled, disabled,
// role, href ou target avant le clic, n'est pas sur la rangee convention-actions suivi de « Télécharger »
// (texte cache « le fichier PDF de la convention signée »), ou si la page contient un jeton, une
// adresse ou le texte « nouvel onglet » avant le clic (ou si quelque chose est demande avant le clic).
test("le bouton « Voir la convention signée » : un vrai bouton, texte, texte caché « (s'ouvre dans une fenêtre) » et aria-haspopup=\"dialog\" exacts, aucun jeton ni requête avant le clic", async () => {
  const m = await preparer();
  const html = m.blocRefait();
  const balise = baliseVoirSignee(html);
  assert.ok(balise, "le bouton est dans le bloc à l'état Signée");
  assert.equal(balise, '<button class="btn btn-secondary" type="button" id="conventionVoirSignee" aria-haspopup="dialog">', "bouton secondaire, type button, annonce une fenêtre, rien d'autre");
  assert.ok(!/\s(aria-disabled|aria-label|aria-describedby|disabled|role|href|target)\b/.test(balise), "ni aria-disabled, ni disabled, ni role, ni href, ni target avant le clic");
  assert.ok(html.includes(`<div class="convention-actions"><button class="btn btn-secondary" type="button" id="conventionVoirSignee" aria-haspopup="dialog"><span class="btn-content">${TEXTE_VOIR_SIGNEE}<span class="sr-only">${TEXTE_CACHE}</span></span></button><button class="btn btn-secondary" type="button" id="conventionTelechargerSignee"><span class="btn-content">${LIBELLE_TELECHARGER_REPOS}</span></button></div>`),
    "texte exact, puis texte caché dans un sr-only, dans btn-content, sur la rangée convention-actions, suivi de « Télécharger »");
  assert.ok(!html.includes("nouvel onglet"), "plus aucun texte « nouvel onglet »");
  assert.ok(!/<a\b/.test(html), "aucun lien <a> dans le bloc");
  for (const interdit of [JETON, "jeton", "token", "auth=", "/attachments/", "blob:", "href", "http"]) {
    assert.ok(!html.includes(interdit), `« ${interdit} » ne doit pas être dans la page avant le clic`);
  }
  assert.deepEqual([m.jetons, m.fetchs, m.popup.ouvertures, m.popup.liens, m.appelsVoirSignee], [[], [], [], [], []], "rien n'est demandé, téléchargé, ouvert ni créé avant le clic");
  assert.equal(m.popup.ouverte(), false, "aucune pop-up avant le clic");
});

// ---------------------------------------------------------------------------
// 3. Le clic ouvre le fichier SIGNÉ
// ---------------------------------------------------------------------------

// Echoue si le clic n'appelle pas conventionVoirSignee (une fois, avec l'id de l'action), s'il ouvre un
// onglet (window.open) ou une pop-up vide avant que le PDF soit recupere, si le telechargement n'est
// pas UNE requete vers <baseUrl>/attachments/<id de PDF_SIGNE>/download?auth=… (et non l'id de
// PDF_genere), si credentials n'est pas 'omit', si X-Requested-With manque, si le jeton demande n'est
// pas d'ecriture (readOnly: false), si le PDF n'est pas un Blob 'application/pdf' montre dans le cadre de
// la pop-up depuis l'adresse blob: (jamais l'adresse ?auth=), ou si une alerte s'affiche.
test("le clic appelle conventionVoirSignee, n'ouvre aucun onglet et affiche le PDF SIGNÉ (pas le PDF généré) dans la pop-up depuis une adresse blob:", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const fin = m.cliquer();
  assert.deepEqual(m.appelsVoirSignee, [1], "conventionVoirSignee est appelée une fois, avec l'id de l'action");
  assert.equal(m.popup.ouvertures.length, 0, "aucun window.open");
  await attendre();
  assert.equal(m.popup.ouverte(), false, "pas de pop-up vide pendant l'attente");
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
  assert.equal(m.popup.ouvertures.length, 0, "toujours aucun window.open");
  assert.equal(m.popup.ouverte(), true, "la pop-up est ouverte");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le cadre est envoyé vers l'adresse blob:");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
  const vu = JSON.stringify([m.journal, m.zoneAlerte.innerHTML, m.popup.hote.innerHTML]);
  assert.ok(!vu.includes(JETON) && !vu.includes("auth="), "ni jeton ni ?auth= dans la page ou la console");
});

// ---------------------------------------------------------------------------
// 4. « Ouverture en cours… », clics ignorés, focus
// ---------------------------------------------------------------------------

// Echoue si, pendant le telechargement, le bouton ne passe pas a « Ouverture en cours… » (sans le texte
// cache), n'est pas grise par aria-disabled="true" (jamais disabled), perd le focus, si un deuxieme
// clic ouvre une deuxieme pop-up / redemande un jeton / relance un telechargement, ou si, a la fin, le
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
  assert.equal(m.jetons.length, 1, "ni un autre jeton");
  assert.equal(m.fetchs.length, 1, "ni un autre téléchargement");
  assert.equal(m.libelle().valeur, TEXTE_ATTENTE, "le texte d'attente n'a pas bougé");
  assert.equal(m.focus.actif, "conventionVoirSignee", "le focus reste sur le bouton après les clics ignorés");
  assert.equal(m.popup.ouverte(), false, "la pop-up n'est pas ouverte avant la fin de la récupération");

  attente.resoudre(reponsePdf());
  await premier;
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "le bouton est dégrisé à la fin");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: LIBELLE_REPOS}, "texte d'origine et texte caché revenus");
  assert.equal(m.adresses.length, 1, "le PDF s'est ouvert une seule fois : une seule adresse blob:");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "la pop-up affiche ce PDF");
  assert.equal(m.focus.actif, "conventionPdfDialog", "à la fin, le focus est sur la fenêtre de la pop-up (ouverte)");
  assert.deepEqual(m.focus.appels.filter((id) => !["conventionVoirSignee", "conventionPdfDialog"].includes(id)), [], "le focus n'est allé nulle part ailleurs");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
});

// ---------------------------------------------------------------------------
// 5. Alerte précédente effacée à l'ouverture
// ---------------------------------------------------------------------------

// Echoue si l'alerte precedente (echec d'une ouverture, ou toute autre alerte du bloc) reste affichee
// quand une nouvelle ouverture commence (elle doit etre effacee des le clic, pas a la fin), si un echec
// n'affiche pas le message exact dans une alerte role="alert", si le bouton reste grise apres l'echec
// ou perd le focus, si une pop-up s'ouvre apres un echec, ou si le verrou reste pose (le clic suivant serait ignore).
test("l'alerte précédente est effacée dès le clic ; un échec affiche le message exact, dégrise le bouton et garde le focus", async () => {
  let essai = 0;
  const attente = enAttente();
  const m = await preparer({fetch: () => (++essai === 1 ? Promise.resolve(reponseRefusee(403)) : attente.promesse)});

  await m.cliquer();
  assert.match(m.zoneAlerte.innerHTML, /<div class="alert alert-error" role="alert">/, "alerte d'erreur avec role=\"alert\"");
  assert.equal(decoder(m.zoneAlerte.innerHTML.replace(/<[^>]+>/g, "")), MESSAGE_ECHEC, "message exact");
  assert.equal(m.popup.ouverte(), false, "aucune pop-up ouverte après l'échec");
  assert.deepEqual(m.adresses, [], "aucune adresse blob: créée");
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
  assert.equal(m.popup.ouverte(), true, "le nouvel essai ouvre la pop-up");
  assert.equal(m.popup.ouvertures.length, 0, "sans jamais ouvrir d'onglet");
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
  assert.equal(m.popup.ouverte(), true, "il ouvre la pop-up");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le PDF signé s'affiche dans le cadre");
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

// ===========================================================================
// LA POP-UP DU FICHIER SIGNÉ (évolution 2, note UX §14.3 : « Version signée »)
// ===========================================================================

// Echoue si la pop-up du fichier signe n'a pas pour seul titre le nom du fichier SIGNE
// (Convention-signee-…pdf, pas le nom du PDF genere), si le title du cadre n'est pas « Aperçu de la
// convention signée », si le texte cache de « Télécharger » n'est pas « le fichier PDF de la convention
// signée » (ce sont ces trois elements, plus le nom, qui distinguent les deux versions), si la pop-up n'est
// pas en plein ecran sans fond assombri ni pied de page, ou si le texte de repli a un lien.
test("pop-up du fichier signé : le nom du fichier signé est le titre, title « Aperçu de la convention signée », texte caché « signée », plein écran, repli sans lien", async () => {
  const m = await preparer();
  await m.cliquer();
  const html = m.popup.html();
  assert.equal(m.popup.titre(), NOM_FICHIER_SIGNE, "le titre est exactement le nom du fichier signé");
  assert.ok(!html.includes("Convention-Dispositif"), "pas le nom du PDF généré");
  assert.match(html, /<iframe\b[^>]*\stitle="Aperçu de la convention signée"/, "title du cadre : signée");
  assert.ok(!html.includes("Aperçu de la convention générée"), "pas le title de la version générée");
  assert.ok(html.includes(`<span class="btn-content">${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER_SIGNEE}</span></span>`), "texte caché de « Télécharger » : signée");
  assert.ok(!html.includes("le fichier PDF de la convention générée"), "pas le texte caché de la version générée");
  assert.match(html, /<div class="modal-dialog [^"]*\bconvention-pdf-plein-ecran\b[^"]*">/, "plein écran");
  assert.ok(!html.includes("modal-xl") && !html.includes("modal-backdrop") && !html.includes("modal-footer"), "ni modal-xl, ni fond assombri, ni pied de page");
  assert.ok(html.includes('<p class="help-block" id="conventionPdfRepli">Le PDF ne s\'affiche pas ? Utilisez « Télécharger ».</p>'), "texte de repli exact");
  assert.ok(!/<a\b/.test(html), "aucun lien dans la pop-up");
  assert.match(html, /<button type="button" class="btn btn-secondary[^"]*" id="conventionPdfFermer" aria-label="Fermer"/, "la croix « Fermer »");
});

// Echoue si « Télécharger » de la pop-up signee n'enregistre pas sous le nom du fichier SIGNE avec l'adresse
// du blob deja en memoire, relance une recuperation, se verrouille, change de texte, alerte, libere l'adresse ou
// laisse le lien dans la page.
test("« Télécharger » de la pop-up signée : lien temporaire au nom du fichier signé, sans récupération ni verrou ni alerte", async () => {
  const m = await preparer();
  await m.cliquer();
  const fetchsAvant = m.fetchs.length;
  const jetonsAvant = m.jetons.length;

  await m.popup.cliquerTelecharger();
  await m.popup.cliquerTelecharger();

  assert.equal(m.popup.clics.length, 2, "deux clics, deux liens temporaires (pas de verrou)");
  for (const lien of m.popup.clics) {
    assert.deepEqual(lien.instantane, {href: ADRESSE_BLOB, download: NOM_FICHIER_SIGNE, dansLaPage: true, retire: false}, "au clic : adresse du blob, nom du fichier signé, dans la page");
    assert.equal(lien.retire, true, "retiré aussitôt");
  }
  assert.equal(m.fetchs.length, fetchsAvant, "pas de nouvelle récupération");
  assert.equal(m.jetons.length, jetonsAvant, "pas de nouveau jeton");
  assert.deepEqual(m.liberees, [], "adresse non libérée : elle sert encore à l'aperçu");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le cadre montre toujours le PDF signé");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
  assert.ok(!m.popup.html().includes("aria-disabled") && !m.popup.html().includes("Téléchargement en cours"), "ni verrou ni texte d'attente");
});

// Echoue si la croix ou Échap ne libere pas l'adresse, ne vide pas le src, laisse body.modal-open, ou ne rend pas
// le focus a « Voir la convention signée » (et non a « Voir la convention », qui n'existe pas a cet etat).
test("fermeture de la pop-up signée (croix, puis Échap) : blob libéré, src vidé, focus rendu à « Voir la convention signée »", async () => {
  const m = await preparer();
  await m.cliquer();
  m.popup.cliquerFermer();
  assert.equal(m.popup.ouverte(), false, "fermée par la croix");
  assert.equal(m.popup.cadre.src, "", "src vidé");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "adresse libérée");
  assert.equal(m.focus.actif, "conventionVoirSignee", "focus rendu à « Voir la convention signée »");
  assert.equal(m.popup.corpsAClasse("modal-open"), false, "body.modal-open retiré");

  await m.cliquer();
  assert.equal(m.popup.cadre.src, `${ADRESSE_BLOB}-2`, "rouverte avec une nouvelle adresse");
  m.focus.actif = null;
  assert.equal(m.popup.touche("Escape"), 1, "Échap est arrêté");
  assert.equal(m.popup.ouverte(), false, "fermée par Échap");
  assert.equal(m.popup.cadre.src, "", "src vidé");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB, `${ADRESSE_BLOB}-2`], "seconde adresse libérée");
  assert.equal(m.focus.actif, "conventionVoirSignee", "focus rendu à « Voir la convention signée »");
});

// ---------------------------------------------------------------------------
// « Télécharger » du bloc signé, et coexistence avec celui de la pop-up
// ---------------------------------------------------------------------------

// Echoue si « Télécharger » du bloc signe ne recupere pas le fichier SIGNE (piece jointe 52, pas la 41), si le
// lien temporaire n'a pas le nom du fichier signe, si le texte d'attente et le verrou manquent, si la pop-up
// s'ouvre, ou si le bouton « Voir la convention signée » est touche.
test("bloc : « Télécharger » signé récupère le fichier signé, le nomme Convention-signee-…, sans ouvrir la pop-up", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const fin = m.cliquerTelechargerBloc();
  await attendre();
  assert.deepEqual(m.libelleTelecharger(), {mode: "texte", valeur: TEXTE_TELECHARGEMENT}, "texte d'attente, sans texte caché");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), "true", "grisé par aria-disabled");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: LIBELLE_REPOS}, "« Voir la convention signée » n'est pas touché");
  attente.resoudre(reponsePdf());
  await fin;

  assert.equal(m.fetchs.length, 1, "une seule requête");
  assert.ok(m.fetchs[0].url.includes(`/attachments/${PIECE_SIGNEE}/download?auth=`) && !m.fetchs[0].url.includes(`/attachments/${PIECE_GENEREE}/`), "le fichier SIGNÉ, jamais le PDF généré");
  assert.equal(m.popup.liens.length, 1, "un lien temporaire");
  assert.deepEqual(m.popup.liens[0].instantane, {href: ADRESSE_BLOB, download: NOM_FICHIER_SIGNE, dansLaPage: true, retire: false}, "nom du fichier signé, adresse du blob");
  assert.equal(m.popup.ouverte(), false, "la pop-up n'est pas ouverte");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "dégrisé à la fin");
  assert.deepEqual(m.libelleTelecharger(), {mode: "html", valeur: LIBELLE_TELECHARGER_REPOS}, "texte et texte caché « signée » revenus");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
});

// Echoue si les deux boutons « Télécharger » ne coexistent pas a l'etat Signee (bloc : conventionTelechargerSignee ;
// pop-up : conventionPdfTelecharger), s'ils partagent un identifiant, si le clic de l'un verrouille, grise ou alerte
// l'autre, ou si le clic du bloc ferme la pop-up ou libere son blob.
test("coexistence à l'état Signée : « Télécharger » du bloc et celui de la pop-up sont indépendants (ni verrou, ni alerte, ni blob partagé)", async () => {
  const reglages = {};
  const m = await preparer(reglages);
  await m.cliquer();
  assert.equal(m.blocRefait().split('id="conventionTelechargerSignee"').length - 1, 1, "le bloc a son « Télécharger »");
  assert.equal(m.popup.html().split('id="conventionPdfTelecharger"').length - 1, 1, "la pop-up a le sien");
  assert.ok(!m.popup.html().includes('id="conventionTelechargerSignee"'), "pas d'identifiant en double");

  const attente = enAttente();
  reglages.fetch = () => attente.promesse;
  const blocEnCours = m.cliquerTelechargerBloc();
  await attendre();
  assert.equal(m.libelleTelecharger().valeur, TEXTE_TELECHARGEMENT, "le bloc attend");
  await m.popup.cliquerTelecharger();
  const lienPopup = m.popup.clics[0];
  assert.deepEqual([lienPopup.instantane.href, lienPopup.instantane.download], [ADRESSE_BLOB, NOM_FICHIER_SIGNE], "la pop-up télécharge tout de suite, avec son blob");
  assert.ok(!m.popup.html().includes("aria-disabled"), "le bouton de la pop-up n'est pas verrouillé par le bloc");

  attente.resoudre(reponsePdf());
  await blocEnCours;
  assert.equal(m.popup.clics.length, 2, "le bloc a fait son propre lien");
  assert.deepEqual([m.popup.clics[1].instantane.href, m.popup.clics[1].instantane.download], [`${ADRESSE_BLOB}-2`, NOM_FICHIER_SIGNE], "avec sa propre adresse");
  assert.equal(m.popup.ouverte(), true, "la pop-up est toujours ouverte");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "son blob est intact");
  assert.deepEqual(m.liberees, [], "aucune adresse libérée");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
});
