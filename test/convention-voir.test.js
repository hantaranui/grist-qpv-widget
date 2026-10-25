"use strict";

// Bouton « Voir la convention » de l'état « Générée » (tâche 7.4 ; tests de la tâche 7.5) :
// le bouton et son texte caché, aucun jeton dans la page avant le clic, onglet ouvert pendant le
// clic (avant toute attente), adresse de téléchargement et options, ouverture depuis une adresse
// blob: (libérée au bout de 60 secondes), « Ouverture en cours… » et clics ignorés pendant le
// téléchargement, échecs (message exact, onglet refermé, focus sur le bouton, ni jeton ni
// texte technique dans la page ou la console), nouvel essai, et le jeton demandé en ÉCRITURE.
// Les textes de référence sont ceux de docs/ux/convention.md (« Voir un PDF »). Ils sont
// recopiés ici en dur : si le code change un mot, le test doit échouer.
// Le navigateur et Grist sont des doublures : onglet, adresses blob:, minuterie, fetch et
// getAccessToken. Aucun vrai jeton, aucune vraie adresse : valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const TEXTE_VOIR = "Voir la convention";
const TEXTE_CACHE = " (s'ouvre dans un nouvel onglet)";
const TEXTE_ATTENTE = "Ouverture en cours…";
const MESSAGE_ECHEC = "Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord.";

// Le jeton fictif contient des caractères que l'adresse doit encoder (+, /, =).
const JETON = "jeton-fictif+abc/123=";
const JETON_ENCODE = encodeURIComponent(JETON);
const BASE_URL = "https://exemple.test/api/docs/doc-fictif";
const PIECE_JOINTE = 41;
const ADRESSE_BLOB = "blob:https://exemple.test/00000000-fictif";
const REPONSE_SECRETE = "Cannot access attachment (texte de réponse fictif)";

const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;

const attendre = () => new Promise((resolve) => setImmediate(resolve));

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// ---------------------------------------------------------------------------
// Faux navigateur et fausse API Grist
// ---------------------------------------------------------------------------
// preparer() charge le widget, pose une action à l'état « Générée » (PDF_genere = pièce jointe
// 41), branche le bouton comme renderEdit le fait (bindConvention) et note tout ce qui sort :
//   trace      : l'ordre des appels sensibles ("ouverture", "jeton", "fetch") ;
//   ouvertures : chaque appel de window.open ;
//   jetons     : les options de chaque appel de getAccessToken ;
//   fetchs     : chaque requête {url, options} ;
//   journal    : tout ce que le widget écrit dans la console APRÈS la préparation ;
//   focus      : l'élément qui a le focus ; `appels` liste les focus() demandés par le script.
// Réglages (options) :
//   fetch      : fonction qui répond à fetch (par défaut : 200 avec un petit PDF) ;
//   jeton      : fonction qui répond à getAccessToken ;
//   onglet     : null pour simuler un onglet bloqué par le navigateur.

function reponsePdf() {
  return {
    ok: true, status: 200,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    text: () => Promise.resolve(REPONSE_SECRETE),
  };
}

function reponseRefusee(status) {
  return {
    ok: false, status,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(REPONSE_SECRETE),
    json: () => Promise.resolve({error: REPONSE_SECRETE}),
  };
}

// Une réponse qu'on libère à la main : on peut regarder l'écran « pendant le téléchargement ».
function enAttente() {
  let resoudre;
  let rejeter;
  const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
  return {promesse, resoudre, rejeter};
}

async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{id: 7, Nom: "Club Exemple"}],
    Agences: [{id: 5, Libelle_agence: "Agence Exemple"}],
    Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple"}],
    Contacts: [],
    Conventions: [{id: 20, Action: 1, PDF_genere: ["L", PIECE_JOINTE], Date_generation: secondes(2026, 3, 14)}],
  };
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

  // L'onglet ouvert par window.open : on voit s'il est refermé et vers où il est envoyé.
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
  // La libération au bout de 60 s ne part pas toute seule : le test la déclenche.
  global.setTimeout = (fonction, delai) => { minuteries.push({fonction, delai}); return minuteries.length; };

  w.grist.docApi.getAccessToken = (opts) => {
    trace.push("jeton");
    jetons.push(opts);
    return options.jeton ? options.jeton() : Promise.resolve({token: JETON, baseUrl: BASE_URL});
  };
  global.fetch = (url, opts) => {
    trace.push("fetch");
    fetchs.push({url, options: opts});
    return options.fetch ? options.fetch() : Promise.resolve(reponsePdf());
  };

  // Les éléments de la page sont ceux du bac à sable (un identifiant, un élément). On y ajoute
  // le suivi du focus et la capture du gestionnaire de clic du bouton.
  const origine = doc.getElementById;
  doc.getElementById = (id) => {
    const element = origine(id);
    if (!element.suivi) {
      element.suivi = true;
      element.focus = () => { focus.actif = id; focus.appels.push(id); };
    }
    return element;
  };
  const bouton = doc.getElementById("conventionVoir");
  const ecouteurs = {};
  bouton.addEventListener = (type, fonction) => { ecouteurs[type] = fonction; };

  // Le libellé du bouton (.btn-content) : on garde la dernière écriture, par textContent
  // (texte brut) ou par innerHTML (texte, puis texte caché).
  const libelleElement = bouton.querySelector(".btn-content");
  let ecrit = {mode: "html", valeur: `${TEXTE_VOIR}<span class="sr-only">${TEXTE_CACHE}</span>`};
  Object.defineProperty(libelleElement, "textContent", {get: () => (ecrit.mode === "texte" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "texte", valeur: String(v)}; }, configurable: true});
  Object.defineProperty(libelleElement, "innerHTML", {get: () => (ecrit.mode === "html" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "html", valeur: String(v)}; }, configurable: true});

  const zoneAlerte = doc.getElementById("conventionAlerte");

  w.bindConvention(1);

  return {
    w, trace, ouvertures, jetons, fetchs, blobs, liberees, minuteries, focus, journal, onglet, bouton, zoneAlerte,
    // Texte du bouton (entités décodées) : « texte brut » pendant l'attente, HTML (texte + texte caché) sinon.
    libelle: () => ({mode: ecrit.mode, valeur: decoder(ecrit.valeur)}),
    // Ce que la personne fait : le bouton a le focus, puis elle clique. Rend la promesse du
    // gestionnaire (le clic réel l'ignore) pour pouvoir attendre la fin dans un test.
    cliquer() {
      bouton.focus();
      focus.appels.length = 0;
      return ecouteurs.click({});
    },
    // Tout ce que la page et la console montrent : bouton, alerte et journal.
    visible: () => JSON.stringify([ecrit, zoneAlerte.innerHTML, journal, bouton.attributes]),
  };
}

// Ce que doit montrer l'écran après un échec : alerte d'erreur au message exact, onglet vide
// refermé (et jamais envoyé quelque part), focus resté sur le bouton, bouton dégrisé avec son
// texte d'origine, ni jeton ni texte technique dans la page ou la console.
function verifierEchec(m, nom) {
  const html = m.zoneAlerte.innerHTML;
  assert.match(html, /<div class="alert alert-error" role="alert">/, `${nom} : alerte d'erreur avec role="alert"`);
  assert.equal(decoder(html.replace(/<[^>]+>/g, "")), MESSAGE_ECHEC, `${nom} : message exact`);
  if (m.onglet) {
    assert.equal(m.onglet.closed, true, `${nom} : l'onglet vide est refermé`);
    assert.equal(m.onglet.location.href, "", `${nom} : l'onglet n'a été envoyé nulle part`);
  }
  assert.equal(m.focus.actif, "conventionVoir", `${nom} : le focus est resté sur le bouton`);
  assert.deepEqual(m.focus.appels.filter((id) => id !== "conventionVoir"), [], `${nom} : le focus n'est allé nulle part ailleurs (jamais sur l'alerte)`);
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, `${nom} : le bouton n'est plus grisé`);
  assert.equal(m.libelle().mode, "html", `${nom} : le libellé est revenu`);
  assert.equal(m.libelle().valeur, `${TEXTE_VOIR}<span class="sr-only">${TEXTE_CACHE}</span>`, `${nom} : texte d'origine, avec son texte caché`);
  assert.deepEqual(m.liberees, [], `${nom} : aucune adresse blob: à libérer`);

  const vu = m.visible();
  for (const interdit of [JETON, JETON_ENCODE, "auth=", "blob:", REPONSE_SECRETE, "Cannot access", "403", "Failed to fetch", "fichier vide", "telechargement", "onglet bloque", "Error"]) {
    assert.ok(!vu.includes(interdit), `${nom} : ni jeton ni texte technique (« ${interdit} » trouvé dans la page ou la console)`);
  }
}

// ---------------------------------------------------------------------------
// 1. Le bouton
// ---------------------------------------------------------------------------

// Echoue si le bouton « Voir la convention » de l'etat Generee change de balise, d'id, de type
// ou de classes, perd son texte « Voir la convention » ou son texte cache « (s'ouvre dans un
// nouvel onglet) » (dans un sr-only, a l'interieur de btn-content), ou porte aria-disabled,
// disabled, role, href ou target avant le clic (ce serait un lien, pas un bouton).
test("le bouton « Voir la convention » : un vrai bouton, son texte et son texte caché pour les lecteurs d'écran", async () => {
  const m = await preparer();
  const bloc = decoder(m.w.conventionBlocContenuHtml(1, m.w.state));
  const balise = /<button\b[^>]*\sid="conventionVoir"[^>]*>/.exec(bloc);
  assert.ok(balise, "le bouton est dans le bloc à l'état Générée");
  assert.match(balise[0], /^<button class="btn btn-secondary" type="button" id="conventionVoir">$/, "bouton secondaire, type button, rien d'autre");
  assert.ok(!/\s(aria-[\w-]+|disabled|role|href|target)\b/.test(balise[0]), "ni aria-*, ni disabled, ni role, ni href, ni target avant le clic");
  assert.ok(bloc.includes(`<span class="btn-content">${TEXTE_VOIR}<span class="sr-only">${TEXTE_CACHE}</span></span></button>`), "texte, puis texte caché dans un sr-only");
  assert.ok(!/<a\b/.test(bloc), "aucun lien dans le bloc");
});

// ---------------------------------------------------------------------------
// 2. Aucun jeton avant le clic
// ---------------------------------------------------------------------------

// Echoue si le bloc de l'etat Generee ou le bouton contient un jeton, une adresse de
// telechargement (?auth=, /attachments/) ou une adresse blob: avant le clic, ou si le widget
// demande un jeton, telecharge ou ouvre un onglet avant le clic (au chargement, a la
// construction du bloc ou au branchement du bouton).
test("aucun jeton dans la page avant le clic, et rien n'est demandé ni téléchargé avant le clic", async () => {
  const m = await preparer();
  const pages = [m.w.conventionBlocContenuHtml(1, m.w.state), m.w.conventionBlocHtml(1, m.w.state), m.w.conventionVoirHtml()];
  for (const page of pages) {
    for (const interdit of [JETON, JETON_ENCODE, "jeton", "token", "auth=", "/attachments/", "blob:", "href", "http"]) {
      assert.ok(!page.includes(interdit), `« ${interdit} » ne doit pas être dans la page avant le clic`);
    }
  }
  assert.deepEqual(m.jetons, [], "aucun jeton demandé");
  assert.deepEqual(m.fetchs, [], "aucun téléchargement");
  assert.deepEqual(m.ouvertures, [], "aucun onglet ouvert");
  assert.ok(!JSON.stringify(m.bouton.attributes).includes(JETON), "aucun jeton dans les attributs du bouton");
});

// ---------------------------------------------------------------------------
// 3. L'onglet est ouvert pendant le clic, avant toute attente
// ---------------------------------------------------------------------------

// Echoue si window.open n'est pas appele de facon synchrone dans le clic (avant la demande du
// jeton et avant le telechargement), si l'onglet n'est pas ouvert vide en « _blank », ou s'il
// est ouvert plus d'une fois : le navigateur bloquerait un onglet ouvert apres une attente.
test("l'onglet est ouvert pendant le clic, avant toute attente (avant le jeton et le téléchargement)", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const fin = m.cliquer();
  // Aucune attente (await) depuis le clic : tout ce qui est noté ici s'est passé dans le clic.
  assert.equal(m.ouvertures.length, 1, "un onglet ouvert dès le clic");
  assert.deepEqual({adresse: m.ouvertures[0].adresse, cible: m.ouvertures[0].cible}, {adresse: "", cible: "_blank"}, "onglet vide, en _blank");
  assert.equal(m.trace[0], "ouverture", "l'onglet est ouvert avant toute autre opération");
  assert.equal(m.fetchs.length, 0, "rien n'est encore téléchargé");
  attente.resoudre(reponsePdf());
  await fin;
  assert.equal(m.ouvertures.length, 1, "toujours un seul onglet à la fin");
});

// ---------------------------------------------------------------------------
// 4. L'adresse de téléchargement et les options
// ---------------------------------------------------------------------------

// Echoue si le telechargement n'est pas exactement UNE requete vers
// <baseUrl>/attachments/<id de PDF_genere>/download?auth=<jeton encode>, ou si credentials n'est
// pas 'omit', ou si l'en-tete X-Requested-With: XMLHttpRequest manque (sans lui, Grist
// repond 401), ou si le jeton n'est pas encode dans l'adresse.
test("téléchargement : une requête vers /attachments/<id>/download?auth=…, credentials 'omit' et X-Requested-With", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.fetchs.length, 1, "une seule requête");
  assert.equal(m.fetchs[0].url, `${BASE_URL}/attachments/${PIECE_JOINTE}/download?auth=${JETON_ENCODE}`, "adresse de téléchargement, jeton encodé");
  assert.equal(m.fetchs[0].options.credentials, "omit", "credentials 'omit'");
  assert.deepEqual(JSON.parse(JSON.stringify(m.fetchs[0].options.headers)), {"X-Requested-With": "XMLHttpRequest"}, "en-tête X-Requested-With");
});

// ---------------------------------------------------------------------------
// 5. Ouverture depuis une adresse blob:
// ---------------------------------------------------------------------------

// Echoue si le PDF n'est pas mis dans un Blob de type application/pdf, si l'onglet n'est pas
// envoye vers l'adresse blob: (et seulement elle : jamais l'adresse ?auth=), si l'onglet est
// referme, si le lien avec la page (opener) n'est pas coupe, si une alerte s'affiche ou si le
// bouton ne retrouve pas son texte et son focus a la fin.
test("ouverture : le PDF est mis dans un Blob 'application/pdf' et l'onglet est envoyé vers l'adresse blob:", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.blobs.length, 1, "un Blob");
  assert.equal(m.blobs[0].type, "application/pdf", "type application/pdf (l'onglet affiche le PDF au lieu de le télécharger)");
  assert.equal(m.onglet.location.href, ADRESSE_BLOB, "l'onglet est envoyé vers l'adresse blob:");
  assert.ok(m.onglet.location.href.startsWith("blob:"));
  assert.ok(!m.onglet.location.href.includes("auth="), "aucun jeton dans l'adresse de l'onglet");
  assert.equal(m.onglet.closed, false, "l'onglet n'est pas refermé");
  assert.equal(m.onglet.opener, null, "l'onglet ne peut pas agir sur la page du widget");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
  assert.equal(m.libelle().valeur, `${TEXTE_VOIR}<span class="sr-only">${TEXTE_CACHE}</span>`, "texte d'origine revenu");
  assert.equal(m.focus.actif, "conventionVoir", "le focus reste sur le bouton");
  assert.ok(!m.visible().includes(JETON) && !m.visible().includes("auth="), "ni jeton ni ?auth= dans la page ou la console");
});

// Echoue si l'adresse blob: n'est pas liberee (URL.revokeObjectURL) au bout de 60 secondes, si
// elle est liberee avant (l'onglet n'aurait pas fini de lire le PDF), ou si une autre adresse est liberee.
test("l'adresse blob: est libérée au bout de 60 secondes, pas avant", async () => {
  const m = await preparer();
  await m.cliquer();
  const liberations = m.minuteries.filter((t) => t.delai === 60000);
  assert.equal(liberations.length, 1, "une minuterie de 60 secondes");
  assert.deepEqual(m.liberees, [], "pas encore libérée");
  liberations[0].fonction();
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "libérée à la fin du délai, et seulement cette adresse");
});

// ---------------------------------------------------------------------------
// 6. « Ouverture en cours… » et clics ignorés
// ---------------------------------------------------------------------------

// Echoue si le bouton ne passe pas a « Ouverture en cours… » (sans le texte cache) pendant le
// telechargement, s'il n'est pas grise par aria-disabled="true" (jamais l'attribut disabled,
// pour garder le focus), si un deuxieme clic ouvre un deuxieme onglet, redemande un jeton ou
// relance un telechargement, ou si le bouton ne retrouve pas son texte et son etat a la fin.
test("« Ouverture en cours… » pendant le téléchargement : bouton grisé (aria-disabled), deuxième clic ignoré", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const premier = m.cliquer();
  await attendre();

  assert.deepEqual(m.libelle(), {mode: "texte", valeur: TEXTE_ATTENTE}, "texte « Ouverture en cours… », sans texte caché");
  assert.equal(m.bouton.getAttribute("aria-disabled"), "true", "bouton grisé par aria-disabled");
  assert.equal(m.bouton.getAttribute("disabled"), null, "jamais l'attribut disabled");
  assert.equal(m.focus.actif, "conventionVoir", "le focus reste sur le bouton");

  await m.cliquer();
  await m.cliquer();
  assert.equal(m.ouvertures.length, 1, "les clics suivants n'ouvrent pas d'autre onglet");
  assert.equal(m.jetons.length, 1, "ni un autre jeton");
  assert.equal(m.fetchs.length, 1, "ni un autre téléchargement");
  assert.equal(m.libelle().valeur, TEXTE_ATTENTE, "le texte d'attente n'a pas bougé");

  attente.resoudre(reponsePdf());
  await premier;
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "le bouton est dégrisé à la fin");
  assert.equal(m.libelle().valeur, `${TEXTE_VOIR}<span class="sr-only">${TEXTE_CACHE}</span>`, "texte d'origine revenu");
  assert.equal(m.onglet.location.href, ADRESSE_BLOB, "le PDF s'est ouvert une seule fois");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
});

// ---------------------------------------------------------------------------
// 7. Échecs : message exact, onglet refermé, focus sur le bouton, rien de technique
// ---------------------------------------------------------------------------

// Echoue si, quand Grist refuse le fichier (403), le message n'est pas exactement celui de la
// note UX dans une alerte d'erreur, si l'onglet vide n'est pas referme, si le focus quitte le
// bouton, ou si la page ou la console montre le jeton, le texte de la reponse ou le code 403.
test("échec : Grist refuse le fichier (403) → message exact, onglet refermé, focus sur le bouton", async () => {
  const m = await preparer({fetch: () => Promise.resolve(reponseRefusee(403))});
  await m.cliquer();
  assert.equal(m.fetchs.length, 1, "le téléchargement a bien été tenté");
  verifierEchec(m, "403");
});

// Echoue si une coupure de reseau (fetch rejete, avec un message qui recopie l'adresse et son
// jeton) n'est pas traitee comme les autres echecs, ou si ce message technique, l'adresse ou le
// jeton se retrouvent dans la page ou la console.
test("échec : le réseau coupe → message exact, onglet refermé, focus sur le bouton, l'adresse de l'erreur n'est montrée nulle part", async () => {
  const m = await preparer({fetch: () => Promise.reject(new Error(`Failed to fetch ${BASE_URL}/attachments/${PIECE_JOINTE}/download?auth=${JETON_ENCODE}`))});
  await m.cliquer();
  verifierEchec(m, "réseau");
});

// Echoue si un fichier vide (0 octet) ouvre un onglet blanc au lieu de l'echec : le message
// exact doit s'afficher, l'onglet vide doit etre referme et aucune adresse blob: ne doit exister.
test("échec : le fichier est vide → message exact, onglet refermé, focus sur le bouton", async () => {
  const m = await preparer({fetch: () => Promise.resolve({ok: true, status: 200, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), text: () => Promise.resolve("")})});
  await m.cliquer();
  assert.deepEqual(m.blobs, [], "aucun Blob fabriqué pour un fichier vide");
  verifierEchec(m, "fichier vide");
});

// Echoue si, quand le navigateur bloque l'ouverture de l'onglet (window.open rend null), le
// message exact ne s'affiche pas, si la page du widget est remplacee, ou si le bouton reste
// grise ou perd le focus. (Il n'y a alors aucun onglet a refermer.)
test("échec : le navigateur bloque l'onglet → message exact, page du widget intacte, focus sur le bouton", async () => {
  const m = await preparer({onglet: null});
  await m.cliquer();
  assert.equal(m.ouvertures.length, 1, "l'ouverture a été tentée dans le clic");
  assert.deepEqual(m.blobs, [], "aucun PDF ouvert");
  verifierEchec(m, "onglet bloqué");
});

// Echoue si un jeton refuse par Grist (getAccessToken rejete, avec un message qui recopie le
// jeton) ne donne pas le meme echec : message exact, onglet vide referme, rien de technique.
test("échec : Grist refuse de donner un jeton → message exact, onglet refermé, focus sur le bouton", async () => {
  const m = await preparer({jeton: () => Promise.reject(new Error(`Refusé pour ${JETON}`))});
  await m.cliquer();
  assert.deepEqual(m.fetchs, [], "aucun téléchargement sans jeton");
  verifierEchec(m, "jeton refusé");
});

// ---------------------------------------------------------------------------
// 8. Nouvel essai après un échec
// ---------------------------------------------------------------------------

// Echoue si le verrou reste pose apres un echec (le deuxieme clic serait ignore), si l'alerte
// d'echec reste affichee quand un nouvel essai commence ou reussit (elle doit etre effacee au
// clic suivant), ou si le nouvel essai n'ouvre pas son propre onglet.
test("après un échec, un nouveau clic est pris en compte : l'alerte est effacée et le PDF s'ouvre", async () => {
  let essai = 0;
  const m = await preparer({fetch: () => Promise.resolve(++essai === 1 ? reponseRefusee(403) : reponsePdf())});
  await m.cliquer();
  assert.notEqual(m.zoneAlerte.innerHTML, "", "l'alerte d'échec est affichée");
  await m.cliquer();
  assert.equal(m.fetchs.length, 2, "le deuxième clic relance un téléchargement");
  assert.equal(m.ouvertures.length, 2, "il ouvre son propre onglet");
  assert.equal(m.zoneAlerte.innerHTML, "", "l'alerte d'échec est effacée");
  assert.equal(m.onglet.location.href, ADRESSE_BLOB, "le PDF s'ouvre");
});

// ---------------------------------------------------------------------------
// 9. BUG ÉTABLI DANS DEV7 : le jeton doit être un jeton d'ÉCRITURE
// ---------------------------------------------------------------------------

// DOIT ECHOUER AVANT LA CORRECTION. Echoue si le telechargement demande le jeton avec
// readOnly: true (ou sans l'option readOnly: false). Un jeton en lecture seule fait passer le
// PROPRIETAIRE au niveau « lecteur » ; les regles par defaut refusent alors tout aux lecteurs et
// Grist repond 403 « Cannot access attachment ». La generation demande deja readOnly: false.
test("le téléchargement demande le jeton d'écriture : getAccessToken({readOnly: false}) (bug 403 du propriétaire, DEV7)", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.jetons.length, 1, "un seul jeton demandé");
  assert.equal(m.jetons[0].readOnly, false, "le jeton demandé n'est pas en lecture seule (readOnly: false)");
});
