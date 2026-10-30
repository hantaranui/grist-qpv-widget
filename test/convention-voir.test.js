"use strict";

// Bouton « Voir la convention » de l'état « Générée » et pop-up plein écran qu'il ouvre
// (tâche 7.4, tests de la 7.5 ; évolution 2 : note UX docs/ux/convention.md, §14, qui fait foi).
// Le bouton et son texte caché, aucun jeton dans la page avant le clic, adresse de téléchargement et
// options, pop-up ouverte seulement quand le PDF est récupéré (plus de nouvel onglet, plus de
// window.open, plus de délai de 60 secondes), « Ouverture en cours… » et clics ignorés, échecs (message
// exact, rien ne s'ouvre, focus sur le bouton, ni jeton ni texte technique dans la page ou la console),
// nouvel essai, jeton demandé en ÉCRITURE. Puis la pop-up : plein écran, nom du fichier comme seul
// titre, « Télécharger » (un bouton, lien temporaire), croix « Fermer », Échap, texte de repli sans
// lien, libération du blob et vidage du src à la fermeture, et la coexistence des deux boutons
// « Télécharger » (celui du bloc et celui de la pop-up).
// Les textes de référence sont ceux de la note UX. Ils sont recopiés ici en dur : si le code change
// un mot, le test doit échouer. Le navigateur et Grist sont des doublures : lien <a>, adresses blob:,
// minuterie, fetch et getAccessToken (voir test/helpers/convention-popup.js). Aucun vrai jeton, aucune
// vraie adresse : valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");
const {installerPopup, decoder} = require("./helpers/convention-popup");

const TEXTE_VOIR = "Voir la convention";
const TEXTE_CACHE = " (s'ouvre dans une fenêtre)";
const TEXTE_ATTENTE = "Ouverture en cours…";
const MESSAGE_ECHEC = "Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord.";
const LIBELLE_REPOS = `${TEXTE_VOIR}<span class="sr-only">${TEXTE_CACHE}</span>`;

const TEXTE_TELECHARGER = "Télécharger";
const CACHE_TELECHARGER = " le fichier PDF de la convention générée";
const TEXTE_TELECHARGEMENT = "Téléchargement en cours…";
const MESSAGE_ECHEC_TELECHARGER = "Le fichier n'a pas pu être téléchargé. Réessayez ou contactez l'équipe du tableau de bord.";
const TEXTE_REPLI = "Le PDF ne s'affiche pas ? Utilisez « Télécharger ».";
// Nom exact du fichier : Convention-[dispositif]-[club]-[année].pdf (note UX §14.4).
const NOM_FICHIER = "Convention-Dispositif-Exemple-Club-Exemple-2026.pdf";

// Le jeton fictif contient des caractères que l'adresse doit encoder (+, /, =).
const JETON = "jeton-fictif+abc/123=";
const JETON_ENCODE = encodeURIComponent(JETON);
const BASE_URL = "https://exemple.test/api/docs/doc-fictif";
const PIECE_JOINTE = 41;
const ADRESSE_BLOB = "blob:https://exemple.test/00000000-fictif";
const REPONSE_SECRETE = "Cannot access attachment (texte de réponse fictif)";

const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// ---------------------------------------------------------------------------
// Faux navigateur et fausse API Grist
// ---------------------------------------------------------------------------
// preparer() charge le widget, pose une action à l'état « Générée » (PDF_genere = pièce jointe
// 41), branche les boutons comme renderEdit le fait (bindConvention) et note tout ce qui sort :
//   trace      : l'ordre des appels sensibles ("jeton", "fetch") ;
//   jetons     : les options de chaque appel de getAccessToken ;
//   fetchs     : chaque requête {url, options} ;
//   blobs      : chaque Blob fabriqué ; adresses : chaque adresse blob: donnée (la première est
//                ADRESSE_BLOB, les suivantes ADRESSE_BLOB-2, -3…) ; liberees : chaque adresse libérée ;
//   minuteries : chaque setTimeout demandé (rien ne part tout seul : le test le déclenche) ;
//   journal    : tout ce que le widget écrit dans la console APRÈS la préparation ;
//   focus      : l'élément qui a le focus ; `appels` liste les focus() demandés par le script ;
//   popup      : la pop-up (voir test/helpers/convention-popup.js).
// Réglages (options) :
//   fetch      : fonction qui répond à fetch (par défaut : 200 avec un petit PDF) ;
//   jeton      : fonction qui répond à getAccessToken.

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

// Le libellé d'un bouton (.btn-content) : on garde la dernière écriture, par textContent (texte
// brut) ou par innerHTML (texte, puis texte caché).
function suivreLibelle(bouton, repos) {
  const element = bouton.querySelector(".btn-content");
  let ecrit = {mode: "html", valeur: repos};
  Object.defineProperty(element, "textContent", {get: () => (ecrit.mode === "texte" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "texte", valeur: String(v)}; }, configurable: true});
  Object.defineProperty(element, "innerHTML", {get: () => (ecrit.mode === "html" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "html", valeur: String(v)}; }, configurable: true});
  return {ecrit: () => ecrit, libelle: () => ({mode: ecrit.mode, valeur: decoder(ecrit.valeur)})};
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
    Dispositifs: [{id: 3, Dispositif: "Dispositif Exemple"}],
    Agences: [{id: 5, Libelle_agence: "Agence Exemple"}],
    Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple"}],
    Contacts: [],
    Conventions: [{id: 20, Action: 1, Annee: 2026, PDF_genere: ["L", PIECE_JOINTE], Date_generation: secondes(2026, 3, 14)}],
  };
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
  // Aucune minuterie ne part toute seule : le test déclenche celle qu'il veut.
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
  // le suivi du focus et la capture des gestionnaires de clic des boutons du bloc.
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

  const bouton = doc.getElementById("conventionVoir");
  const telecharger = doc.getElementById("conventionTelecharger");
  const ecouteurs = {};
  const ecouteursTelecharger = {};
  bouton.addEventListener = (type, fonction) => { ecouteurs[type] = fonction; };
  telecharger.addEventListener = (type, fonction) => { ecouteursTelecharger[type] = fonction; };

  const voir = suivreLibelle(bouton, LIBELLE_REPOS);
  const repos = `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span>`;
  const tel = suivreLibelle(telecharger, repos);

  const zoneAlerte = doc.getElementById("conventionAlerte");

  w.bindConvention(1);

  return {
    w, trace, jetons, fetchs, blobs, adresses, liberees, minuteries, focus, journal, popup, bouton, telecharger, zoneAlerte,
    // Texte du bouton (entités décodées) : « texte brut » pendant l'attente, HTML (texte + texte caché) sinon.
    libelle: voir.libelle,
    libelleTelecharger: tel.libelle,
    // Ce que la personne fait : le bouton a le focus, puis elle clique. Rend la promesse du
    // gestionnaire (le clic réel l'ignore) pour pouvoir attendre la fin dans un test.
    cliquer() {
      bouton.focus();
      focus.appels.length = 0;
      return ecouteurs.click({});
    },
    // Même chose pour le bouton « Télécharger » du BLOC (pas celui de la pop-up).
    cliquerTelechargerBloc() {
      telecharger.focus();
      focus.appels.length = 0;
      return ecouteursTelecharger.click({});
    },
    // Le bloc tel qu'il serait refait maintenant (HTML décodé).
    blocRefait: () => decoder(w.conventionBlocContenuHtml(1, w.state)),
    // Tout ce que la page et la console montrent : bouton, alerte et journal.
    visible: () => JSON.stringify([voir.ecrit(), zoneAlerte.innerHTML, journal, bouton.attributes, popup.hote.innerHTML]),
  };
}

// Ce que doit montrer l'écran après un échec : alerte d'erreur au message exact, aucune pop-up
// (jamais d'aperçu à moitié ouvert), focus resté sur le bouton, bouton dégrisé avec son texte d'origine,
// ni jeton ni texte technique dans la page ou la console. `liberation` : vrai quand une adresse blob:
// avait été créée avant l'échec (elle doit alors être libérée) ; sinon aucune adresse ne doit exister.
function verifierEchec(m, nom, liberation = false) {
  const html = m.zoneAlerte.innerHTML;
  assert.match(html, /<div class="alert alert-error" role="alert">/, `${nom} : alerte d'erreur avec role="alert"`);
  assert.equal(decoder(html.replace(/<[^>]+>/g, "")), MESSAGE_ECHEC, `${nom} : message exact`);
  assert.equal(m.popup.ouverte(), false, `${nom} : aucune pop-up ouverte`);
  assert.equal(m.popup.etat(), false, `${nom} : state.conventionPdfOpen est faux`);
  assert.equal(m.popup.ouvertures.length, 0, `${nom} : aucun onglet ouvert`);
  assert.equal(m.focus.actif, "conventionVoir", `${nom} : le focus est resté sur le bouton`);
  assert.deepEqual(m.focus.appels.filter((id) => id !== "conventionVoir"), [], `${nom} : le focus n'est allé nulle part ailleurs (jamais sur l'alerte)`);
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, `${nom} : le bouton n'est plus grisé`);
  assert.equal(m.libelle().mode, "html", `${nom} : le libellé est revenu`);
  assert.equal(m.libelle().valeur, LIBELLE_REPOS, `${nom} : texte d'origine, avec son texte caché`);
  if (liberation) {
    assert.ok(m.adresses.length > 0 && m.liberees.length > 0 && m.liberees.every((a) => m.adresses.includes(a)), `${nom} : l'adresse blob: créée est libérée`);
  } else {
    assert.deepEqual(m.adresses, [], `${nom} : aucune adresse blob: créée`);
    assert.deepEqual(m.liberees, [], `${nom} : aucune adresse blob: à libérer`);
  }

  const vu = m.visible();
  for (const interdit of [JETON, JETON_ENCODE, "auth=", "blob:", REPONSE_SECRETE, "Cannot access", "403", "Failed to fetch", "fichier vide", "telechargement", "onglet bloque", "Error"]) {
    assert.ok(!vu.includes(interdit), `${nom} : ni jeton ni texte technique (« ${interdit} » trouvé dans la page ou la console)`);
  }
}

// ---------------------------------------------------------------------------
// 1. Le bouton
// ---------------------------------------------------------------------------

// Echoue si le bouton « Voir la convention » de l'etat Generee change de balise, d'id, de type
// ou de classes, perd son texte « Voir la convention » ou son texte cache « (s'ouvre dans une
// fenetre) » (dans un sr-only, a l'interieur de btn-content), perd aria-haspopup="dialog" (une
// fenetre s'ouvre, plus un onglet), ou porte aria-disabled, disabled, role, href ou target avant le
// clic (ce serait un lien, pas un bouton), ou si le texte « nouvel onglet » reste dans le bloc.
test("le bouton « Voir la convention » : un vrai bouton, son texte, son texte caché « (s'ouvre dans une fenêtre) » et aria-haspopup=\"dialog\"", async () => {
  const m = await preparer();
  const bloc = m.blocRefait();
  const balise = /<button\b[^>]*\sid="conventionVoir"[^>]*>/.exec(bloc);
  assert.ok(balise, "le bouton est dans le bloc à l'état Générée");
  assert.equal(balise[0], '<button class="btn btn-secondary" type="button" id="conventionVoir" aria-haspopup="dialog">', "bouton secondaire, type button, annonce une fenêtre, rien d'autre");
  assert.ok(!/\s(aria-disabled|aria-label|aria-describedby|disabled|role|href|target)\b/.test(balise[0]), "ni aria-disabled, ni disabled, ni role, ni href, ni target avant le clic");
  assert.ok(bloc.includes(`<span class="btn-content">${LIBELLE_REPOS}</span></button>`), "texte, puis texte caché dans un sr-only");
  assert.ok(!bloc.includes("nouvel onglet"), "plus aucun texte « nouvel onglet » dans le bloc");
  assert.ok(!/<a\b/.test(bloc), "aucun lien dans le bloc");
});

// ---------------------------------------------------------------------------
// 2. Aucun jeton avant le clic
// ---------------------------------------------------------------------------

// Echoue si le bloc de l'etat Generee ou le bouton contient un jeton, une adresse de
// telechargement (?auth=, /attachments/) ou une adresse blob: avant le clic, ou si le widget
// demande un jeton, telecharge, ouvre la pop-up ou cree un lien avant le clic (au chargement, a la
// construction du bloc ou au branchement des boutons).
test("aucun jeton dans la page avant le clic, et rien n'est demandé, téléchargé ni ouvert avant le clic", async () => {
  const m = await preparer();
  const pages = [m.w.conventionBlocContenuHtml(1, m.w.state), m.w.conventionBlocHtml(1, m.w.state), m.w.conventionVoirHtml()];
  for (const page of pages) {
    for (const interdit of [JETON, JETON_ENCODE, "jeton", "token", "auth=", "/attachments/", "blob:", "href", "http"]) {
      assert.ok(!page.includes(interdit), `« ${interdit} » ne doit pas être dans la page avant le clic`);
    }
  }
  assert.deepEqual(m.jetons, [], "aucun jeton demandé");
  assert.deepEqual(m.fetchs, [], "aucun téléchargement");
  assert.equal(m.popup.ouverte(), false, "aucune pop-up ouverte");
  assert.deepEqual([m.popup.ouvertures, m.popup.liens, m.adresses], [[], [], []], "ni onglet, ni lien, ni adresse blob:");
  assert.ok(!JSON.stringify(m.bouton.attributes).includes(JETON), "aucun jeton dans les attributs du bouton");
});

// ---------------------------------------------------------------------------
// 3. La pop-up s'ouvre seulement quand le PDF est récupéré, jamais dans un onglet
// ---------------------------------------------------------------------------

// Echoue si le clic ouvre un onglet (window.open appele, meme vide), si la pop-up s'ouvre AVANT que le
// PDF soit recupere (une fenetre vide qui attend), si elle ne s'ouvre pas une fois le PDF recupere, ou
// si elle s'ouvre plus d'une fois.
test("le clic n'ouvre aucun onglet : la pop-up s'ouvre seulement quand le PDF est récupéré, une seule fois", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const fin = m.cliquer();
  await attendre();
  assert.equal(m.popup.ouvertures.length, 0, "aucun window.open pendant l'attente");
  assert.equal(m.popup.ouverte(), false, "pas de fenêtre vide qui attend : la pop-up n'est pas encore ouverte");
  assert.equal(m.popup.etat(), false, "state.conventionPdfOpen est faux pendant l'attente");
  assert.equal(m.fetchs.length, 1, "le PDF est en cours de téléchargement");
  attente.resoudre(reponsePdf());
  await fin;
  assert.equal(m.popup.ouvertures.length, 0, "toujours aucun window.open après l'ouverture");
  assert.equal(m.popup.ouverte(), true, "la pop-up est ouverte quand le PDF est récupéré");
  assert.equal(m.popup.etat(), true, "state.conventionPdfOpen est vrai");
  assert.equal(m.popup.html().split('id="conventionPdfDialog"').length - 1, 1, "une seule pop-up");
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
// 5. Ouverture de la pop-up depuis une adresse blob:
// ---------------------------------------------------------------------------

// Echoue si le PDF n'est pas mis dans un Blob de type application/pdf, si le cadre de la pop-up n'est
// pas envoye vers l'adresse blob: (et seulement elle : jamais l'adresse ?auth=), si l'adresse est ecrite
// dans le texte de la pop-up au lieu de cadre.src, si le focus ne va pas sur la fenetre de la pop-up,
// si body.modal-open manque, si une alerte s'affiche, ou si le bouton ne retrouve pas son texte.
test("ouverture : le PDF est mis dans un Blob 'application/pdf', le cadre est envoyé vers l'adresse blob: par src, le focus va sur la fenêtre", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.blobs.length, 1, "un Blob");
  assert.equal(m.blobs[0].type, "application/pdf", "type application/pdf (le cadre affiche le PDF au lieu de le télécharger)");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le cadre est envoyé vers l'adresse blob:");
  assert.ok(!m.popup.cadre.src.includes("auth="), "aucun jeton dans l'adresse du cadre");
  assert.ok(!m.popup.html().includes("blob:") && !m.popup.html().includes(" src="), "l'adresse n'est jamais écrite dans le texte de la pop-up (posée par cadre.src)");
  assert.equal(m.popup.corpsAClasse("modal-open"), true, "body.modal-open : la page derrière ne défile plus");
  assert.equal(m.focus.actif, "conventionPdfDialog", "le focus va sur la fenêtre elle-même (ni « Télécharger », ni le cadre)");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
  assert.equal(m.libelle().valeur, LIBELLE_REPOS, "le bouton « Voir » a retrouvé son texte d'origine");
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "le bouton « Voir » est dégrisé");
  assert.ok(!m.visible().includes(JETON) && !m.visible().includes("auth="), "ni jeton ni ?auth= dans la page ou la console");
});

// Echoue si l'adresse blob: est liberee a l'ouverture ou apres un delai (l'ancienne liberation au bout
// de 60 secondes), c'est-a-dire si le cadre perd son PDF alors que la pop-up est encore ouverte, ou si
// une minuterie de 60 secondes existe encore.
test("plus de délai de 60 secondes : l'adresse blob: n'est pas libérée tant que la pop-up est ouverte", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.deepEqual(m.minuteries.filter((t) => t.delai === 60000), [], "aucune minuterie de 60 secondes");
  assert.deepEqual(m.liberees, [], "l'adresse n'est pas libérée à l'ouverture");
  for (const minuterie of m.minuteries) minuterie.fonction();
  assert.deepEqual(m.liberees, [], "même si toutes les minuteries partaient, rien n'est libéré : la pop-up est toujours ouverte");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le cadre montre toujours le PDF");
});

// ---------------------------------------------------------------------------
// 6. « Ouverture en cours… » et clics ignorés
// ---------------------------------------------------------------------------

// Echoue si le bouton ne passe pas a « Ouverture en cours… » (sans le texte cache) pendant le
// telechargement, s'il n'est pas grise par aria-disabled="true" (jamais l'attribut disabled,
// pour garder le focus), si un deuxieme clic ouvre une deuxieme pop-up, redemande un jeton ou
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
  assert.equal(m.jetons.length, 1, "les clics suivants ne redemandent pas de jeton");
  assert.equal(m.fetchs.length, 1, "ni un autre téléchargement");
  assert.equal(m.libelle().valeur, TEXTE_ATTENTE, "le texte d'attente n'a pas bougé");

  attente.resoudre(reponsePdf());
  await premier;
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "le bouton est dégrisé à la fin");
  assert.equal(m.libelle().valeur, LIBELLE_REPOS, "texte d'origine revenu");
  assert.equal(m.adresses.length, 1, "le PDF s'est ouvert une seule fois : une seule adresse blob:");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "la pop-up affiche ce PDF");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
});

// ---------------------------------------------------------------------------
// 7. Échecs : message exact, rien ne s'ouvre, focus sur le bouton, rien de technique
// ---------------------------------------------------------------------------

// Echoue si, quand Grist refuse le fichier (403), le message n'est pas exactement celui de la
// note UX dans une alerte d'erreur, si une pop-up s'ouvre quand meme, si le focus quitte le
// bouton, ou si la page ou la console montre le jeton, le texte de la reponse ou le code 403.
test("échec : Grist refuse le fichier (403) → message exact, aucune pop-up, focus sur le bouton", async () => {
  const m = await preparer({fetch: () => Promise.resolve(reponseRefusee(403))});
  await m.cliquer();
  assert.equal(m.fetchs.length, 1, "le téléchargement a bien été tenté");
  verifierEchec(m, "403");
});

// Echoue si une coupure de reseau (fetch rejete, avec un message qui recopie l'adresse et son
// jeton) n'est pas traitee comme les autres echecs, ou si ce message technique, l'adresse ou le
// jeton se retrouvent dans la page ou la console.
test("échec : le réseau coupe → message exact, aucune pop-up, focus sur le bouton, l'adresse de l'erreur n'est montrée nulle part", async () => {
  const m = await preparer({fetch: () => Promise.reject(new Error(`Failed to fetch ${BASE_URL}/attachments/${PIECE_JOINTE}/download?auth=${JETON_ENCODE}`))});
  await m.cliquer();
  verifierEchec(m, "réseau");
});

// Echoue si un fichier vide (0 octet) ouvre une pop-up blanche au lieu de l'echec : le message
// exact doit s'afficher, rien ne doit s'ouvrir et aucune adresse blob: ne doit exister.
test("échec : le fichier est vide → message exact, aucune pop-up, focus sur le bouton", async () => {
  const m = await preparer({fetch: () => Promise.resolve({ok: true, status: 200, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), text: () => Promise.resolve("")})});
  await m.cliquer();
  assert.deepEqual(m.blobs, [], "aucun Blob fabriqué pour un fichier vide");
  verifierEchec(m, "fichier vide");
});

// Echoue si un jeton refuse par Grist (getAccessToken rejete, avec un message qui recopie le
// jeton) ne donne pas le meme echec : message exact, aucune pop-up, rien de technique.
test("échec : Grist refuse de donner un jeton → message exact, aucune pop-up, focus sur le bouton", async () => {
  const m = await preparer({jeton: () => Promise.reject(new Error(`Refusé pour ${JETON}`))});
  await m.cliquer();
  assert.deepEqual(m.fetchs, [], "aucun téléchargement sans jeton");
  verifierEchec(m, "jeton refusé");
});

// Echoue si, quand la pose du PDF dans le cadre echoue apres la creation de l'adresse blob:, l'adresse
// n'est pas liberee, si la pop-up reste a moitie ouverte (HTML pose, state vrai, body.modal-open), si le
// message exact n'est pas affiche, ou si le bouton reste grise ou perd le focus. (Remplace l'ancien test
// « le navigateur bloque l'onglet » : il n'y a plus d'onglet.)
test("échec : la pose du PDF dans le cadre échoue → adresse libérée, pop-up refermée, message exact, focus sur le bouton", async () => {
  const m = await preparer();
  Object.defineProperty(m.popup.cadre, "src", {
    get: () => undefined,
    set: (valeur) => { if (valeur !== "") throw new Error(`Refusé pour ${JETON}`); },
    configurable: true,
  });
  await m.cliquer();
  assert.equal(m.fetchs.length, 1, "le PDF avait bien été récupéré");
  assert.equal(m.popup.corpsAClasse("modal-open"), false, "body.modal-open retiré : la pop-up n'est pas restée à moitié ouverte");
  verifierEchec(m, "pose du PDF", true);
});

// ---------------------------------------------------------------------------
// 8. Nouvel essai après un échec
// ---------------------------------------------------------------------------

// Echoue si le verrou reste pose apres un echec (le deuxieme clic serait ignore), si l'alerte
// d'echec reste affichee quand un nouvel essai commence ou reussit (elle doit etre effacee au
// clic suivant), ou si le nouvel essai n'ouvre pas la pop-up.
test("après un échec, un nouveau clic est pris en compte : l'alerte est effacée et la pop-up s'ouvre", async () => {
  let essai = 0;
  const m = await preparer({fetch: () => Promise.resolve(++essai === 1 ? reponseRefusee(403) : reponsePdf())});
  await m.cliquer();
  assert.notEqual(m.zoneAlerte.innerHTML, "", "l'alerte d'échec est affichée");
  assert.equal(m.popup.ouverte(), false, "rien ne s'est ouvert");
  await m.cliquer();
  assert.equal(m.fetchs.length, 2, "le deuxième clic relance un téléchargement");
  assert.equal(m.zoneAlerte.innerHTML, "", "l'alerte d'échec est effacée");
  assert.equal(m.popup.ouverte(), true, "la pop-up s'ouvre");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le PDF s'affiche");
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

// ===========================================================================
// LA POP-UP (évolution 2, note UX §14.3 et §14.6)
// ===========================================================================

// ---------------------------------------------------------------------------
// 10. Plein écran, structure, accessibilité
// ---------------------------------------------------------------------------

// Echoue si la pop-up n'est plus en plein ecran (classe convention-pdf-plein-ecran absente de
// modal-dialog), si modal-xl reste, si un fond assombri (modal-backdrop) ou un pied de page
// (modal-footer) est insere, si modal-dialog-scrollable (filet garde par la note) disparait, ou si
// role="dialog", aria-modal="true", aria-labelledby="conventionPdfTitle" et tabindex="-1" manquent ou si
// aria-describedby revient (il pointait vers le nom du fichier, devenu le titre).
test("pop-up plein écran : classe convention-pdf-plein-ecran, ni modal-xl, ni fond assombri, ni pied de page ; dialogue accessible", async () => {
  const m = await preparer();
  await m.cliquer();
  const html = m.popup.html();
  assert.match(html, /<div class="modal fade show" id="conventionPdfDialog" role="dialog" aria-modal="true" aria-labelledby="conventionPdfTitle" tabindex="-1">/, "fenêtre : role, aria-modal, aria-labelledby (le titre) et tabindex -1");
  assert.match(html, /<div class="modal-dialog [^"]*\bconvention-pdf-plein-ecran\b[^"]*">/, "modal-dialog porte la classe du plein écran");
  assert.ok(/\bmodal-dialog-scrollable\b/.test(html), "modal-dialog-scrollable est conservé (filet si le cadre est bas)");
  assert.ok(!html.includes("modal-xl"), "plus de modal-xl");
  assert.ok(!html.includes("modal-backdrop"), "plus de fond assombri pour cette pop-up");
  assert.ok(!html.includes("modal-footer"), "plus de pied de page");
  assert.ok(!html.includes("aria-describedby"), "plus d'aria-describedby");
  assert.equal(html.split('id="conventionPdfModal"').length - 1, 0, "le conteneur n'est pas répété dans la pop-up");
  assert.equal(m.popup.corpsAClasse("modal-open"), true, "body.modal-open");
});

// ---------------------------------------------------------------------------
// 11. Le titre est le nom exact du fichier
// ---------------------------------------------------------------------------

// Echoue si le titre (h2.modal-title#conventionPdfTitle) n'est pas exactement le nom du fichier, si un
// titre generique (« Convention générée », « Convention signée ») ou un sous-titre (convention-soustitre,
// conventionPdfNom) reste dans la pop-up, ou s'il y a plusieurs titres.
test("le nom exact du fichier est le seul titre : plus de « Convention générée », plus de sous-titre", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.popup.titre(), NOM_FICHIER, "le titre est exactement le nom du fichier");
  const html = m.popup.html();
  assert.equal(html.split("<h2").length - 1, 1, "un seul titre");
  assert.ok(!/<h[1-6]\b[^>]*>\s*Convention (générée|signée)\s*</.test(html), "plus de titre générique");
  assert.ok(!html.includes("convention-soustitre") && !html.includes("conventionPdfNom"), "plus de sous-titre");
});

// ---------------------------------------------------------------------------
// 12. L'en-tête : titre à gauche, « Télécharger » puis la croix à droite
// ---------------------------------------------------------------------------

// Echoue si l'en-tete n'a pas, dans cet ordre, le titre, « Télécharger » (un <button type="button">,
// jamais un <a>, sans href ni download dans la page) puis la croix (un <button>, icone icon-close cachee
// aux lecteurs d'ecran, aria-label="Fermer"), si le texte cache de « Télécharger » n'est pas « le
// fichier PDF de la convention générée », ou s'il reste un lien dans la pop-up.
test("en-tête : le titre, puis « Télécharger » (un bouton sans href ni download) et la croix « Fermer » (icon-close, aria-label)", async () => {
  const m = await preparer();
  await m.cliquer();
  const html = m.popup.html();
  const entete = /<div class="modal-header">([\s\S]*?)<\/div>\s*<\/div>\s*<div class="modal-body">/.exec(html);
  assert.ok(entete, "l'en-tête existe, avant le corps");
  const dedans = entete[1];
  const positions = [dedans.indexOf('id="conventionPdfTitle"'), dedans.indexOf('id="conventionPdfTelecharger"'), dedans.indexOf('id="conventionPdfFermer"')];
  assert.ok(positions.every((p) => p !== -1) && positions[0] < positions[1] && positions[1] < positions[2], "dans l'ordre : titre, Télécharger, croix");

  const telecharger = /<button\b[^>]*\sid="conventionPdfTelecharger"[^>]*>[\s\S]*?<\/button>/.exec(html)[0];
  assert.match(telecharger, /^<button type="button" class="btn btn-primary" id="conventionPdfTelecharger">/, "un vrai bouton, type button, principal");
  assert.ok(!/\s(href|download)\b/.test(telecharger), "ni href ni download : aucune adresse ne s'affiche au survol");
  assert.ok(telecharger.includes(`<span class="btn-content">${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span></span>`), "le mot visible, puis le texte caché");

  const croix = /<button\b[^>]*\sid="conventionPdfFermer"[^>]*>[\s\S]*?<\/button>/.exec(html)[0];
  assert.match(croix, /^<button type="button"/, "la croix est un vrai bouton");
  assert.match(croix, /\saria-label="Fermer"/, "nom accessible « Fermer »");
  assert.match(croix, /<span aria-hidden="true" class="icon icon-close"><\/span>/, "icône icon-close cachée aux lecteurs d'écran");
  assert.ok(!croix.includes("✕") && !/>\s*Fermer\s*</.test(croix), "pas de caractère ni de texte visible en plus de l'icône");

  assert.ok(!/<a\b/.test(html), "aucun lien <a> dans la pop-up");
});

// ---------------------------------------------------------------------------
// 13. Le cadre du PDF
// ---------------------------------------------------------------------------

// Echoue si le PDF n'est pas dans une <iframe> (id conventionPdfCadre, classe convention-pdf-cadre) au
// title « Aperçu de la convention générée », avec referrerpolicy="no-referrer", ou si elle porte un
// attribut sandbox (la visionneuse PDF de Chrome refuse un cadre en bac a sable), allow, ou src dans le
// texte de la page (le src est pose par JavaScript, garde-fous de l'audit de securite du 30/10).
test("le PDF est dans une iframe avec title et referrerpolicy=\"no-referrer\", sans sandbox, sans allow, sans src dans le texte", async () => {
  const m = await preparer();
  await m.cliquer();
  const balise = /<iframe\b[^>]*>/.exec(m.popup.html());
  assert.ok(balise, "une iframe");
  assert.match(balise[0], /\sid="conventionPdfCadre"/, "id conventionPdfCadre");
  assert.match(balise[0], /\sclass="convention-pdf-cadre"/, "classe convention-pdf-cadre");
  assert.match(balise[0], /\stitle="Aperçu de la convention générée"/, "title lu par les lecteurs d'écran");
  assert.match(balise[0], /\sreferrerpolicy="no-referrer"/, "referrerpolicy=\"no-referrer\"");
  assert.ok(!/\s(sandbox|allow|src|srcdoc)\b/.test(balise[0]), "ni sandbox, ni allow, ni src, ni srcdoc dans le texte");
  assert.equal(m.popup.html().split("<iframe").length - 1, 1, "une seule iframe");
});

// ---------------------------------------------------------------------------
// 14. Le texte de repli, sans lien
// ---------------------------------------------------------------------------

// Echoue si le texte de repli n'est pas exactement « Le PDF ne s'affiche pas ? Utilisez « Télécharger ». »
// dans <p class="help-block" id="conventionPdfRepli">, dans le corps, JUSTE APRES l'iframe, s'il contient un
// lien (<a>) ou parle encore d'ouvrir un nouvel onglet, ou si le corps contient autre chose que le cadre
// et ce texte.
test("texte de repli toujours visible sous le cadre : « Le PDF ne s'affiche pas ? Utilisez « Télécharger ». », sans lien", async () => {
  const m = await preparer();
  await m.cliquer();
  const html = m.popup.html();
  const corps = /<div class="modal-body">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/.exec(html);
  assert.ok(corps, "le corps de la pop-up existe");
  assert.match(corps[1], /^\s*<iframe\b[^>]*><\/iframe>\s*<p class="help-block" id="conventionPdfRepli">[^<]*<\/p>\s*$/, "le corps contient seulement le cadre, puis le texte de repli juste dessous");
  const repli = /<p class="help-block" id="conventionPdfRepli">([^<]*)<\/p>/.exec(html);
  assert.equal(repli[1], TEXTE_REPLI, "texte exact");
  assert.ok(!/hidden|display:\s*none/.test(repli[0]), "toujours affiché (jamais caché)");
  assert.ok(!/nouvel onglet/i.test(html), "plus de « nouvel onglet »");
  assert.ok(!/<a\b/.test(html), "le texte de repli n'a pas de lien");
});

// ---------------------------------------------------------------------------
// 15. « Télécharger » de la pop-up : un lien temporaire, sans verrou ni alerte
// ---------------------------------------------------------------------------

// Echoue si le clic ne cree pas UN lien <a> temporaire dont le nom (download) est le nom exact du fichier
// et l'adresse (href) celle du blob deja en memoire, si ce lien n'est pas dans la page au moment du clic
// ou n'est pas retire ensuite, si le clic recupere de nouveau le PDF (jeton, fetch), change le texte du
// bouton, le grise (aria-disabled), pose une alerte, libere l'adresse (elle sert encore a l'apercu) ou vide
// le cadre, ou si la pop-up se ferme.
test("« Télécharger » de la pop-up : lien <a download> temporaire au bon nom, retiré aussitôt ; ni attente, ni verrou, ni alerte ; blob gardé", async () => {
  const m = await preparer();
  await m.cliquer();
  const jetonsAvant = m.jetons.length;
  const fetchsAvant = m.fetchs.length;
  const liensAvant = m.popup.liens.length;
  const minuteriesAvant = m.minuteries.length;

  await m.popup.cliquerTelecharger();

  assert.equal(m.popup.liens.length, liensAvant + 1, "un seul lien créé");
  const lien = m.popup.liens[liensAvant];
  assert.equal(lien.balise, "a", "un lien <a>");
  assert.deepEqual(m.popup.clics, [lien], "le lien est déclenché une fois par programme");
  assert.deepEqual(lien.instantane, {href: ADRESSE_BLOB, download: NOM_FICHIER, dansLaPage: true, retire: false}, "au clic : adresse du blob, nom exact du fichier, lien dans la page");
  assert.equal(lien.retire, true, "le lien est retiré de la page aussitôt");
  assert.equal(m.minuteries.length, minuteriesAvant, "pas de minuterie : le retrait est immédiat");

  assert.equal(m.jetons.length, jetonsAvant, "pas de nouveau jeton");
  assert.equal(m.fetchs.length, fetchsAvant, "pas de nouvelle récupération du PDF");
  assert.deepEqual(m.liberees, [], "l'adresse blob: n'est PAS libérée (elle sert encore à l'aperçu)");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "le cadre montre toujours le PDF");
  assert.equal(m.popup.ouverte(), true, "la pop-up reste ouverte");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte");
  const html = m.popup.html();
  assert.ok(html.includes(`<span class="btn-content">${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span></span>`), "le bouton garde son texte (pas de texte d'attente)");
  assert.ok(!html.includes("Téléchargement en cours") && !html.includes("aria-disabled"), "ni texte d'attente ni aria-disabled");
  assert.ok(!html.includes("alert"), "aucune alerte dans la pop-up");
});

// Echoue si le bouton de la pop-up a un verrou (le deuxieme clic serait ignore), ou si le deuxieme lien
// n'a pas la meme adresse et le meme nom.
test("« Télécharger » de la pop-up n'a pas de verrou : plusieurs clics, plusieurs liens temporaires identiques", async () => {
  const m = await preparer();
  await m.cliquer();
  await m.popup.cliquerTelecharger();
  await m.popup.cliquerTelecharger();
  await m.popup.cliquerTelecharger();
  assert.equal(m.popup.clics.length, 3, "trois clics, trois liens déclenchés");
  for (const lien of m.popup.clics) {
    assert.deepEqual([lien.instantane.href, lien.instantane.download, lien.retire], [ADRESSE_BLOB, NOM_FICHIER, true], "même adresse, même nom, retiré");
  }
  assert.deepEqual(m.liberees, [], "l'adresse n'est libérée à aucun moment");
});

// ---------------------------------------------------------------------------
// 16. Fermeture : croix, Échap — blob libéré, src vidé, focus rendu
// ---------------------------------------------------------------------------

// Echoue si la croix ne referme pas la pop-up (HTML vide, state faux), ne libere pas l'adresse blob: (une
// seule fois, la bonne), ne vide pas le src du cadre a ce moment-la (et pas avant), laisse body.modal-open,
// ou ne rend pas le focus au bouton « Voir la convention ».
test("la croix ferme la pop-up : blob libéré, src du cadre vidé, focus rendu à « Voir la convention »", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "(contrôle) avant la fermeture, le cadre montre le PDF");
  assert.deepEqual(m.liberees, [], "(contrôle) rien n'est libéré avant la fermeture");

  m.popup.cliquerFermer();

  assert.equal(m.popup.ouverte(), false, "la pop-up a disparu de la page");
  assert.equal(m.popup.etat(), false, "state.conventionPdfOpen est faux");
  assert.equal(m.popup.cadre.src, "", "le src du cadre est vidé");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "l'adresse blob: est libérée, une seule fois");
  assert.equal(m.popup.corpsAClasse("modal-open"), false, "body.modal-open retiré");
  assert.equal(m.focus.actif, "conventionVoir", "le focus revient sur le bouton « Voir la convention »");
  assert.equal(m.popup.aEcouteur("conventionPdfModal:keydown"), false, "l'écoute de Échap est retirée");
});

// Echoue si Échap ne ferme pas la pop-up avec les memes effets que la croix (blob libere, src vide, focus
// rendu), si l'evenement n'est pas arrete (preventDefault), ou si une autre touche la ferme.
test("Échap ferme la pop-up comme la croix ; une autre touche ne la ferme pas", async () => {
  const m = await preparer();
  await m.cliquer();

  m.popup.touche("a");
  m.popup.touche("Enter");
  assert.equal(m.popup.ouverte(), true, "une autre touche ne ferme pas la pop-up");
  assert.deepEqual(m.liberees, [], "rien n'est libéré");

  const empeche = m.popup.touche("Escape");
  assert.equal(empeche, 1, "Échap est arrêté (preventDefault)");
  assert.equal(m.popup.ouverte(), false, "la pop-up est fermée");
  assert.equal(m.popup.cadre.src, "", "src vidé");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "adresse libérée");
  assert.equal(m.focus.actif, "conventionVoir", "focus rendu à « Voir la convention »");
  assert.equal(m.popup.corpsAClasse("modal-open"), false, "body.modal-open retiré");
});

// Echoue si la fermeture laisse le bouton « Voir » grise ou avec un autre texte, ou si on ne peut pas rouvrir
// l'aperçu ensuite (nouvelle adresse, nouveau cadre), ou si l'ancienne adresse est de nouveau utilisee.
test("après la fermeture, « Voir la convention » rouvre l'aperçu avec une nouvelle adresse blob:", async () => {
  const m = await preparer();
  await m.cliquer();
  m.popup.cliquerFermer();
  assert.equal(m.bouton.getAttribute("aria-disabled"), null, "« Voir » n'est pas grisé");
  assert.equal(m.libelle().valeur, LIBELLE_REPOS, "« Voir » a son texte d'origine");

  await m.cliquer();
  assert.equal(m.popup.ouverte(), true, "la pop-up se rouvre");
  assert.equal(m.popup.cadre.src, `${ADRESSE_BLOB}-2`, "avec une nouvelle adresse");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "seule l'ancienne adresse a été libérée");
});

// Echoue si, ouvrir une deuxieme pop-up alors qu'une est ouverte, laisse deux adresses en memoire (la
// premiere doit etre liberee) ou deux pop-up dans la page.
test("une seule adresse en mémoire à la fois : rouvrir sans fermer libère la première adresse", async () => {
  const m = await preparer();
  await m.cliquer();
  await m.cliquer();
  assert.equal(m.popup.html().split('id="conventionPdfDialog"').length - 1, 1, "une seule pop-up dans la page");
  assert.equal(m.popup.cadre.src, `${ADRESSE_BLOB}-2`, "le cadre montre le second PDF");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "la première adresse est libérée");
  m.popup.cliquerFermer();
  assert.deepEqual(m.liberees, [ADRESSE_BLOB, `${ADRESSE_BLOB}-2`], "à la fermeture, la seconde l'est aussi");
});

// ===========================================================================
// « TÉLÉCHARGER » DU BLOC (note UX §14.2) ET COEXISTENCE AVEC CELUI DE LA POP-UP
// ===========================================================================
// Aucun test de ce bouton n'existait avant cette mise à jour (voir le rapport) : les deux tests suivants
// couvrent ce que dit la note (attente, verrou, lien temporaire, alerte d'échec), parce que les tests de
// coexistence en dépendent.

// Echoue si le bouton « Télécharger » du bloc n'est pas, a l'etat Generee, un <button> secondaire juste apres
// « Voir la convention », sans href ni download, avec son texte cache ; s'il apparait en double ; ou si le
// bloc n'a plus aucun lien <a>.
test("bloc : « Télécharger » est un bouton secondaire juste après « Voir la convention », sans href ni download", async () => {
  const m = await preparer();
  const bloc = m.blocRefait();
  assert.equal(bloc.split('id="conventionTelecharger"').length - 1, 1, "un seul « Télécharger » dans le bloc");
  assert.ok(bloc.includes(`</button><button class="btn btn-secondary" type="button" id="conventionTelecharger"><span class="btn-content">${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span></span></button>`), "bouton secondaire, juste après « Voir », avec son texte caché");
  assert.ok(bloc.indexOf('id="conventionVoir"') < bloc.indexOf('id="conventionTelecharger"') && bloc.indexOf('id="conventionTelecharger"') < bloc.indexOf('id="conventionRegenerer"'), "ordre : Voir, Télécharger, Re-générer");
  assert.ok(!/<a\b/.test(bloc) && !/\s(href|download)\b/.test(bloc), "ni lien, ni href, ni download dans le bloc");
});

// Echoue si, au clic sur « Télécharger » du bloc, le texte ne devient pas « Téléchargement en cours… » (sans
// texte cache) avec aria-disabled="true" (jamais disabled), si un second clic relance un telechargement, si
// le lien temporaire n'a pas le nom exact et l'adresse du blob, si la pop-up s'ouvre, si le focus bouge, ou si
// le texte, l'etat, le lien et l'adresse ne sont pas retablis (lien retire, adresse liberee apres la minuterie).
test("bloc : « Télécharger » → « Téléchargement en cours… » grisé, lien temporaire au bon nom, sans ouvrir la pop-up ; tout est rétabli", async () => {
  const attente = enAttente();
  const m = await preparer({fetch: () => attente.promesse});
  const fin = m.cliquerTelechargerBloc();
  await attendre();

  assert.deepEqual(m.libelleTelecharger(), {mode: "texte", valeur: TEXTE_TELECHARGEMENT}, "texte d'attente, sans texte caché");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), "true", "grisé par aria-disabled");
  assert.equal(m.telecharger.getAttribute("disabled"), null, "jamais l'attribut disabled");
  await m.cliquerTelechargerBloc();
  assert.equal(m.fetchs.length, 1, "le second clic est ignoré");
  assert.equal(m.libelle().valeur, LIBELLE_REPOS, "« Voir » n'est pas touché (verrou propre à « Télécharger »)");

  attente.resoudre(reponsePdf());
  await fin;
  assert.equal(m.popup.liens.length, 1, "un lien temporaire");
  const lien = m.popup.liens[0];
  assert.deepEqual(lien.instantane, {href: ADRESSE_BLOB, download: NOM_FICHIER, dansLaPage: true, retire: false}, "au clic : adresse du blob, nom exact, dans la page");
  assert.equal(m.popup.ouverte(), false, "« Télécharger » du bloc n'ouvre pas la pop-up");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "dégrisé à la fin");
  assert.equal(m.libelleTelecharger().valeur, `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span>`, "texte et texte caché revenus");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte en cas de réussite");
  assert.deepEqual(m.focus.appels.filter((id) => id !== "conventionTelecharger"), [], "le focus ne bouge pas");

  assert.deepEqual(m.liberees, [], "(contrôle) adresse pas encore libérée");
  const liberation = m.minuteries[m.minuteries.length - 1];
  assert.ok(liberation.delai > 0 && liberation.delai < 60000, "libération au bout de quelques secondes");
  liberation.fonction();
  assert.equal(lien.retire, true, "le lien est retiré de la page");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "l'adresse est libérée");
});

// Echoue si l'echec du telechargement du bloc n'affiche pas le message exact du telechargement (et non celui de
// « Voir ») dans une alerte role="alert", cree un lien, ouvre la pop-up, laisse le bouton grise, ou montre le
// jeton ou un texte technique.
test("bloc : échec de « Télécharger » → message exact du téléchargement, ni lien ni pop-up, bouton rétabli, rien de technique", async () => {
  const m = await preparer({fetch: () => Promise.resolve(reponseRefusee(403))});
  await m.cliquerTelechargerBloc();
  const html = m.zoneAlerte.innerHTML;
  assert.match(html, /<div class="alert alert-error" role="alert">/, "alerte d'erreur avec role=\"alert\"");
  assert.equal(decoder(html.replace(/<[^>]+>/g, "")), MESSAGE_ECHEC_TELECHARGER, "message exact de « Télécharger »");
  assert.deepEqual(m.popup.clics, [], "aucun lien déclenché");
  assert.equal(m.popup.ouverte(), false, "aucune pop-up");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "bouton dégrisé");
  assert.equal(m.libelleTelecharger().valeur, `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span>`, "texte d'origine");
  const vu = JSON.stringify([html, m.journal]);
  for (const interdit of [JETON, JETON_ENCODE, "auth=", "blob:", REPONSE_SECRETE, "403"]) assert.ok(!vu.includes(interdit), `ni jeton ni texte technique (« ${interdit} »)`);
});

// Echoue si les deux boutons « Télécharger » ne coexistent pas : meme id, un seul des deux present, meme style
// (le bloc est secondaire, celui de la pop-up principal), texte caché different de celui de la note, ou si
// l'un des deux disparait quand l'autre est la.
test("coexistence : « Télécharger » du bloc et « Télécharger » de la pop-up existent ensemble, avec des identifiants distincts", async () => {
  const m = await preparer();
  await m.cliquer();
  const bloc = m.blocRefait();
  const popup = m.popup.html();
  assert.equal(bloc.split('id="conventionTelecharger"').length - 1, 1, "le bloc garde son « Télécharger »");
  assert.equal(popup.split('id="conventionPdfTelecharger"').length - 1, 1, "la pop-up a le sien");
  assert.ok(!popup.includes('id="conventionTelecharger"') && !bloc.includes('id="conventionPdfTelecharger"'), "chacun a son identifiant, pas de doublon d'id");
  assert.match(bloc, /id="conventionTelecharger"[^>]*><span class="btn-content">Télécharger</, "le mot visible du bloc est « Télécharger »");
  assert.match(popup, /id="conventionPdfTelecharger"[^>]*><span class="btn-content">Télécharger</, "le mot visible de la pop-up est « Télécharger »");
  assert.match(bloc, /class="btn btn-secondary" type="button" id="conventionTelecharger"/, "le bouton du bloc est secondaire");
  assert.match(popup, /class="btn btn-primary" id="conventionPdfTelecharger"/, "le bouton de la pop-up est principal");
  assert.ok(bloc.includes(CACHE_TELECHARGER) && popup.includes(CACHE_TELECHARGER), "même texte caché des deux côtés");
  assert.equal(m.popup.aEcouteur("conventionPdfTelecharger:click"), true, "le bouton de la pop-up est branché");
});

// Echoue si l'un des deux boutons « Télécharger » en verrouille, grise, change le texte ou alerte l'autre, si le
// clic du bloc ferme la pop-up ou libere son blob, ou si le clic de la pop-up relance une recuperation.
test("coexistence : pendant que le bloc télécharge, le bouton de la pop-up reste libre ; et inversement", async () => {
  const reglages = {};
  const m = await preparer(reglages);
  await m.cliquer();                       // pop-up ouverte, fetch n° 1
  const attente = enAttente();
  reglages.fetch = () => attente.promesse;  // le prochain téléchargement (celui du bloc) attend
  const liensAvant = m.popup.liens.length;
  const fetchsAvant = m.fetchs.length;

  const blocEnCours = m.cliquerTelechargerBloc();
  await attendre();
  assert.equal(m.libelleTelecharger().valeur, TEXTE_TELECHARGEMENT, "le bloc est en attente");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), "true", "le bloc est grisé");

  await m.popup.cliquerTelecharger();
  assert.equal(m.popup.liens.length, liensAvant + 1, "la pop-up crée son lien tout de suite, sans attendre le bloc");
  const lienPopup = m.popup.liens[liensAvant];
  assert.deepEqual([lienPopup.instantane.href, lienPopup.instantane.download], [ADRESSE_BLOB, NOM_FICHIER], "avec l'adresse et le nom de la pop-up");
  assert.ok(!m.popup.html().includes("aria-disabled") && !m.popup.html().includes("Téléchargement en cours"), "le bouton de la pop-up n'est pas verrouillé par le bloc");
  assert.equal(m.libelleTelecharger().valeur, TEXTE_TELECHARGEMENT, "le bloc est toujours en attente (le clic de la pop-up ne l'a pas libéré)");
  assert.equal(m.fetchs.length, fetchsAvant + 1, "seul le bloc a récupéré le PDF");

  attente.resoudre(reponsePdf());
  await blocEnCours;
  assert.equal(m.popup.liens.length, liensAvant + 2, "le bloc a créé son propre lien");
  const lienBloc = m.popup.liens[liensAvant + 1];
  assert.deepEqual([lienBloc.instantane.href, lienBloc.instantane.download], [`${ADRESSE_BLOB}-2`, NOM_FICHIER], "avec sa propre adresse, le même nom");
  assert.equal(m.popup.ouverte(), true, "la pop-up est toujours ouverte");
  assert.equal(m.popup.cadre.src, ADRESSE_BLOB, "son cadre montre toujours son PDF");
  assert.deepEqual(m.liberees, [], "aucune adresse libérée : ni celle de la pop-up, ni celle du bloc (avant sa minuterie)");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "le bloc est dégrisé");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucune alerte nulle part");

  // Et inversement : la pop-up reste utilisable après le bloc, sans rien changer au bloc.
  await m.popup.cliquerTelecharger();
  assert.equal(m.popup.liens.length, liensAvant + 3, "la pop-up peut encore télécharger");
  assert.equal(m.libelleTelecharger().valeur, `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span>`, "le bloc garde son texte d'origine");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "le bloc reste dégrisé");
});

// Echoue si fermer la pop-up libere l'adresse du bloc ou touche a son bouton, ou si le bloc est encore verrouille.
test("coexistence : fermer la pop-up ne touche pas au bouton « Télécharger » du bloc", async () => {
  const m = await preparer();
  await m.cliquerTelechargerBloc();                 // lien du bloc : adresse n° 1, libération par minuterie
  await m.cliquer();                                // pop-up : adresse n° 2
  assert.equal(m.popup.cadre.src, `${ADRESSE_BLOB}-2`, "la pop-up a sa propre adresse");
  m.popup.cliquerFermer();
  assert.deepEqual(m.liberees, [`${ADRESSE_BLOB}-2`], "seule l'adresse de la pop-up est libérée à la fermeture");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "le bouton du bloc n'est pas touché");
  assert.equal(m.libelleTelecharger().valeur, `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER}</span>`, "son texte non plus");
});
