"use strict";

// Bouton « Télécharger la convention » de l'état « Générée » (Évolution 3 : docs/ux/convention.md, §15.4,
// qui fait foi). Il REMPLACE « Voir la convention » (retiré, E3-3 : un navigateur n'affiche pas un .docx)
// et le « Télécharger » de l'évolution 2 pour le document généré : un seul bouton, même identifiant
// (conventionTelecharger), aucune pop-up, aucun aperçu.
// Ce que vérifient ces tests :
//  - le bouton (libellé, texte caché « (fichier Word) » ou « (fichier PDF) » selon le format réel,
//    aucun aria-haspopup, aucun lien) ;
//  - rien dans la page ni sur le réseau avant le clic, jeton d'ÉCRITURE demandé au clic seulement ;
//  - l'extension déduite du NOM du fichier déjà présent dans la pièce jointe (E3-9) : .docx pour une
//    génération faite depuis l'E3, .pdf pour une ancienne ; autre extension = échec (Q-E3-7) ;
//  - le type du Blob fixé par le widget d'après l'extension, jamais repris de la réponse de Grist ;
//  - le nom enregistré : Convention-[dispositif]-[club]-[année].[extension], année lue dans
//    Actions.Campagne au moment du clic (E3-17) ;
//  - « Téléchargement en cours… », clics ignorés, lien <a download> temporaire retiré puis adresse
//    libérée, aucune alerte en cas de réussite ;
//  - les échecs : message exact, rien de technique (jeton, adresse, identifiant de pièce jointe) ;
//  - après un clic, le bloc rafraîchi connaît le format (ligne « Format : … », phrase d'aide).
// Les textes de référence sont recopiés en dur : si le code change un mot, le test doit échouer.
// Le navigateur et Grist sont des doublures (lien <a>, adresses blob:, minuterie, fetch, getAccessToken ;
// voir test/helpers/convention-popup.js). Aucun vrai jeton, aucune vraie adresse : valeurs fictives.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");
const {installerPopup, decoder} = require("./helpers/convention-popup");
const {fixerFormat} = require("./helpers/docx");

const TEXTE_TELECHARGER = "Télécharger la convention";
const CACHE_WORD = " (fichier Word)";
const CACHE_PDF = " (fichier PDF)";
const TEXTE_ATTENTE = "Téléchargement en cours…";
const MESSAGE_ECHEC = "Le fichier n'a pas pu être téléchargé. Réessayez ou contactez l'équipe du tableau de bord.";
const TYPE_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TYPE_PDF = "application/pdf";

// Le jeton fictif contient des caractères que l'adresse doit encoder (+, /, =).
const JETON = "jeton-fictif+abc/123=";
const JETON_ENCODE = encodeURIComponent(JETON);
const BASE_URL = "https://exemple.test/api/docs/doc-fictif";
const PIECE_GENEREE = 41;
const REPONSE_SECRETE = "Cannot access attachment (texte de réponse fictif)";
const ADRESSE_BLOB = "blob:https://exemple.test/00000000-fictif";

const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;
const attendre = () => new Promise((resolve) => setImmediate(resolve));

function enAttente() {
  let resoudre;
  let rejeter;
  const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
  return {promesse, resoudre, rejeter};
}

const reponseMeta = (nom) => ({ok: true, status: 200, json: () => Promise.resolve({fileName: nom}), text: () => Promise.resolve(REPONSE_SECRETE)});
const reponseFichier = (octets = 8, typeAnnonce = "text/html") => ({
  ok: true, status: 200,
  headers: {get: () => typeAnnonce},
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(octets)),
  text: () => Promise.resolve(REPONSE_SECRETE),
});
const reponseRefusee = (status) => ({
  ok: false, status,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  json: () => Promise.resolve({error: REPONSE_SECRETE}),
  text: () => Promise.resolve(REPONSE_SECRETE),
});

// Le libellé d'un bouton (.btn-content) : on garde la dernière écriture, par textContent (texte brut)
// ou par innerHTML (texte, puis texte caché).
function suivreLibelle(bouton, repos) {
  const element = bouton.querySelector(".btn-content");
  let ecrit = {mode: "html", valeur: repos};
  Object.defineProperty(element, "textContent", {get: () => (ecrit.mode === "texte" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "texte", valeur: String(v)}; }, configurable: true});
  Object.defineProperty(element, "innerHTML", {get: () => (ecrit.mode === "html" ? ecrit.valeur : ""), set: (v) => { ecrit = {mode: "html", valeur: String(v)}; }, configurable: true});
  return {ecrit: () => ecrit, libelle: () => ({mode: ecrit.mode, valeur: decoder(ecrit.valeur)})};
}

// ---------------------------------------------------------------------------
// Faux navigateur et fausse API Grist
// ---------------------------------------------------------------------------
// preparer() charge le widget, pose une action à l'état « Générée » (PDF_genere = pièce jointe 41), branche
// les boutons comme renderEdit le fait (bindConvention) et note tout ce qui sort : trace, jetons, fetchs,
// blobs, adresses, liberees, minuteries (rien ne part tout seul : le test déclenche celle qu'il veut),
// journal (console), focus, popup (liens créés, onglets ouverts).
// Réglages (options) :
//   nomPieceJointe : le nom du fichier que Grist donne à la pièce jointe 41 (par défaut « convention.docx ») ;
//   meta, fichier  : fonctions qui répondent à la requête du nom et à celle du fichier ;
//   jeton          : fonction qui répond à getAccessToken ;
//   formatConnu    : « docx » ou « pdf » : le format que le bloc connaît déjà (après une génération) ;
//   campagne       : texte de Campagnes.Campagne (par défaut « 2026 ») ; null = action sans campagne ;
//   annee          : valeur de Conventions.Annee (jamais lue pour le nom, E3-17).

async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  const campagne = "campagne" in options ? options.campagne : "2026";
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, Campagne: campagne === null ? 0 : 4}],
    Campagnes: campagne === null ? [] : [{id: 4, Campagne: campagne}],
    Structures: [{id: 7, Nom: "Club Exemple"}],
    Dispositifs: [{id: 3, Dispositif: "Dispositif Exemple"}],
    Agences: [{id: 5, Libelle_agence: "Agence Exemple"}],
    Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple"}],
    Contacts: [],
    Conventions: [{id: 20, Action: 1, ...("annee" in options ? {Annee: options.annee} : {}), PDF_genere: ["L", PIECE_GENEREE], Date_generation: secondes(2026, 3, 14)}],
  };
  w.state.tablesRefusees = [];
  if (options.formatConnu) fixerFormat(w, 20, options.formatConnu);
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

  w.grist.docApi.getAccessToken = (opts) => {
    trace.push("jeton");
    jetons.push(opts);
    return options.jeton ? options.jeton() : Promise.resolve({token: JETON, baseUrl: BASE_URL});
  };
  global.fetch = (url, opts) => {
    trace.push("fetch");
    fetchs.push({url, options: opts});
    if (/\/attachments\/\d+\/download\?/.test(String(url))) return options.fichier ? options.fichier() : Promise.resolve(reponseFichier());
    return options.meta ? options.meta() : Promise.resolve(reponseMeta("nomPieceJointe" in options ? options.nomPieceJointe : "convention.docx"));
  };

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

  const telecharger = doc.getElementById("conventionTelecharger");
  const ecouteurs = {};
  telecharger.addEventListener = (type, fonction) => { ecouteurs[type] = fonction; };
  const blocAuRepos = decoder(w.conventionBlocContenuHtml(1, w.state));
  const repos = /<button\b[^>]*\sid="conventionTelecharger"[^>]*><span class="btn-content">([\s\S]*?)<\/span><\/button>/.exec(blocAuRepos)[1];
  const libelle = suivreLibelle(telecharger, repos);
  const zoneAlerte = doc.getElementById("conventionAlerte");

  w.bindConvention(1);

  return {
    w, trace, jetons, fetchs, blobs, adresses, liberees, minuteries, focus, journal, popup, telecharger, zoneAlerte, repos,
    libelle: libelle.libelle,
    cliquer() {
      telecharger.focus();
      focus.appels.length = 0;
      return ecouteurs.click({});
    },
    // Le bloc tel qu'il serait refait maintenant (HTML décodé).
    blocRefait: () => decoder(w.conventionBlocContenuHtml(1, w.state)),
    visible: () => JSON.stringify([libelle.ecrit(), zoneAlerte.innerHTML, journal, telecharger.attributes]),
  };
}

const texteDuBouton = (bloc, id) => {
  const m = new RegExp(`<button\\b[^>]*\\sid="${id}"[^>]*><span class="btn-content">([\\s\\S]*?)</span></button>`).exec(bloc);
  return m ? m[1] : null;
};

// ---------------------------------------------------------------------------
// 1. Le bouton
// ---------------------------------------------------------------------------

// Échoue si le bouton « Télécharger la convention » change de balise, d'identifiant, de type ou de classes,
// perd son libellé, porte aria-haspopup (aucune fenêtre ne s'ouvre, E3-3), un lien, href, download, target,
// aria-disabled ou disabled avant le clic, s'il y a encore un « Voir la convention » ou un « Télécharger »
// court dans le bloc de l'état Générée, ou si « (s'ouvre dans une fenêtre) » reste dans le bloc.
test("le bouton « Télécharger la convention » : un vrai bouton secondaire, sans aria-haspopup, sans lien, seul bouton d'accès au document", async () => {
  const m = await preparer();
  const bloc = m.blocRefait();
  assert.equal(bloc.split('id="conventionTelecharger"').length - 1, 1, "un seul bouton « Télécharger la convention »");
  const balise = /<button\b[^>]*\sid="conventionTelecharger"[^>]*>/.exec(bloc)[0];
  assert.equal(balise, '<button class="btn btn-secondary" type="button" id="conventionTelecharger">', "bouton secondaire, type button, rien d'autre");
  assert.ok(!/\s(aria-haspopup|aria-disabled|aria-label|aria-describedby|disabled|role|href|target|download)\b/.test(balise), "ni aria-haspopup, ni aria-disabled, ni lien avant le clic");
  assert.ok(!bloc.includes("conventionVoir\""), "plus de bouton « Voir la convention » pour le document généré");
  assert.ok(!bloc.includes("Voir la convention"), "plus de libellé « Voir la convention »");
  assert.ok(!bloc.includes("s'ouvre dans une fenêtre"), "plus de texte caché « (s'ouvre dans une fenêtre) »");
  assert.ok(!bloc.includes("conventionPdfTelecharger") && !bloc.includes("le fichier PDF de la convention générée"), "plus de second bouton « Télécharger » du document généré");
  assert.ok(!/<a\b/.test(bloc) && !/\s(href|download)\b/.test(bloc), "ni lien, ni href, ni download dans le bloc");
  assert.ok(texteDuBouton(bloc, "conventionTelecharger").startsWith(TEXTE_TELECHARGER), "le libellé visible commence le nom accessible");
});

// Échoue si le texte caché ne suit pas le format réel du fichier (« (fichier Word) » pour un .docx,
// « (fichier PDF) » pour un ancien PDF), s'il n'est pas dans un sr-only placé APRÈS le texte visible, ou si
// un texte caché est inventé quand le format n'est pas encore connu (E3-20 C : on ne devine rien).
test("texte caché du bouton : « (fichier Word) », « (fichier PDF) », ou rien tant que le format est inconnu", async () => {
  const cas = [
    ["docx", `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_WORD}</span>`],
    ["pdf", `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_PDF}</span>`],
    [undefined, TEXTE_TELECHARGER],
  ];
  for (const [format, attendu] of cas) {
    const m = await preparer({formatConnu: format});
    assert.equal(texteDuBouton(m.blocRefait(), "conventionTelecharger"), attendu, `format ${format}`);
  }
});

// ---------------------------------------------------------------------------
// 2. Rien avant le clic, jeton d'écriture au clic
// ---------------------------------------------------------------------------

// Échoue si le bloc contient un jeton, une adresse de téléchargement (?auth=, /attachments/), une adresse
// blob: ou l'identifiant de la pièce jointe avant le clic, ou si le widget demande un jeton, télécharge,
// crée un lien ou ouvre une pop-up avant le clic.
test("aucun jeton, aucune adresse ni identifiant de pièce jointe dans la page avant le clic, et rien n'est demandé avant le clic", async () => {
  const m = await preparer({formatConnu: "docx"});
  for (const page of [m.w.conventionBlocContenuHtml(1, m.w.state), m.w.conventionBlocHtml(1, m.w.state)]) {
    for (const interdit of [JETON, JETON_ENCODE, "jeton", "token", "auth=", "/attachments/", "blob:", "href", "http"]) {
      assert.ok(!page.includes(interdit), `« ${interdit} » ne doit pas être dans la page avant le clic`);
    }
    assert.ok(!/\b41\b/.test(page), "l'identifiant de la pièce jointe n'est pas dans la page");
  }
  assert.deepEqual(m.jetons, [], "aucun jeton demandé");
  assert.deepEqual(m.fetchs, [], "aucune requête");
  assert.deepEqual([m.popup.ouvertures, m.popup.liens, m.adresses, m.popup.ouverte()], [[], [], [], false], "ni onglet, ni lien, ni adresse blob:, ni pop-up");
  assert.ok(!JSON.stringify(m.telecharger.attributes).includes(JETON), "aucun jeton dans les attributs du bouton");
});

// Échoue si le jeton est demandé en lecture seule (readOnly: true ou absent) : un non-propriétaire passe au
// niveau lecteur et les règles par défaut refusent le téléchargement (403, CLAUDE.md) ; ou s'il est demandé
// plus d'une fois par clic.
test("le clic demande UN seul jeton, d'écriture : getAccessToken({readOnly: false})", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.equal(m.jetons.length, 1, "un seul jeton");
  assert.equal(m.jetons[0].readOnly, false, "readOnly: false");
});

// Échoue si les deux requêtes ne sont pas : (1) le nom de la pièce jointe, (2) son contenu, toutes deux avec
// le jeton encodé dans l'adresse, credentials 'omit' et l'en-tête X-Requested-With (sans lui, Grist répond
// 401), sur la pièce jointe de PDF_genere et aucune autre.
test("requêtes : le nom puis le contenu de la pièce jointe de PDF_genere, jeton encodé, credentials 'omit', X-Requested-With", async () => {
  const m = await preparer();
  await m.cliquer();
  assert.deepEqual(m.fetchs.map((f) => f.url), [
    `${BASE_URL}/attachments/${PIECE_GENEREE}?auth=${JETON_ENCODE}`,
    `${BASE_URL}/attachments/${PIECE_GENEREE}/download?auth=${JETON_ENCODE}`,
  ]);
  for (const f of m.fetchs) {
    assert.equal(f.options.credentials, "omit");
    assert.deepEqual(JSON.parse(JSON.stringify(f.options.headers)), {"X-Requested-With": "XMLHttpRequest"});
  }
});

// ---------------------------------------------------------------------------
// 3. Word ou ancien PDF : extension, type du Blob, nom
// ---------------------------------------------------------------------------

// Échoue si, pour un document Word, le lien temporaire n'a pas le nom Convention-…-2026.docx (extension
// déduite du nom réel du fichier, année de la campagne), si le Blob n'a pas le type Word, si une pop-up ou un
// onglet s'ouvre, si le lien n'est pas dans la page au clic puis retiré, ou si une alerte s'affiche.
test("document Word : lien <a download> temporaire en .docx, Blob de type Word, aucune pop-up ni aperçu, aucune alerte", async () => {
  const m = await preparer({nomPieceJointe: "Convention-Dispositif-Exemple-Club-Exemple-2026.docx"});
  await m.cliquer();

  assert.equal(m.blobs.length, 1, "un seul Blob");
  assert.equal(m.blobs[0].type, TYPE_DOCX, "type Word");
  assert.equal(m.popup.liens.length, 1, "un seul lien temporaire");
  assert.deepEqual(m.popup.liens[0].instantane, {href: ADRESSE_BLOB, download: "Convention-Dispositif-Exemple-Club-Exemple-2026.docx", dansLaPage: true, retire: false}, "au clic : adresse du blob, nom en .docx, dans la page");
  assert.deepEqual(m.popup.clics, [m.popup.liens[0]], "le lien est déclenché une fois");
  assert.equal(m.popup.ouverte(), false, "aucune pop-up (E3-3)");
  assert.equal(m.popup.ouvertures.length, 0, "aucun onglet");
  assert.equal(m.zoneAlerte.innerHTML, "", "aucun message du widget en cas de réussite");
  assert.deepEqual(m.focus.appels.filter((id) => id !== "conventionTelecharger"), [], "le focus ne bouge pas");
  assert.ok(!m.visible().includes("blob:") || !m.zoneAlerte.innerHTML.includes("blob:"), "aucune adresse blob: affichée");
});

// Échoue si un ancien document PDF (généré avant l'E3) n'est plus téléchargeable (E3-9) : nom en .pdf, Blob de
// type application/pdf, même mécanique, et si la phrase d'aide, la ligne « Format » et le texte caché du bloc
// rafraîchi ne passent pas à la variante PDF (E3-8, E3-20 C : le format est connu après le clic).
test("ancien document PDF : téléchargé en .pdf (Blob application/pdf), et le bloc rafraîchi passe à « Format : document PDF (.pdf). »", async () => {
  const m = await preparer({nomPieceJointe: "Convention-Dispositif-Exemple-Club-Exemple-2025.pdf"});
  assert.ok(!m.blocRefait().includes("Format :"), "(contrôle) avant le clic, le format n'est pas connu : pas de ligne « Format »");

  await m.cliquer();

  assert.equal(m.blobs[0].type, TYPE_PDF, "type PDF");
  assert.equal(m.popup.liens[0].instantane.download, "Convention-Dispositif-Exemple-Club-Exemple-2026.pdf", "nom en .pdf");
  assert.equal(m.popup.ouverte(), false, "aucune pop-up non plus pour un PDF généré");
  assert.deepEqual(m.libelle(), {mode: "html", valeur: `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_PDF}</span>`}, "le libellé revient avec « (fichier PDF) »");
  const bloc = m.blocRefait();
  assert.ok(bloc.includes('<p class="help-block">Format : document PDF (.pdf).</p>'), "ligne « Format » du PDF");
  assert.ok(bloc.includes("Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé."), "phrase d'aide de l'ancien PDF");
  assert.ok(!bloc.includes("Format : document Word"), "pas la ligne du Word");
  assert.equal(texteDuBouton(bloc, "conventionTelecharger"), `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_PDF}</span>`);
});

// Échoue si, après le téléchargement d'un Word, le bloc rafraîchi n'affiche pas « Format : document Word
// (.docx). » juste sous la phrase d'état, avec la phrase d'aide du Word, et le texte caché « (fichier Word) ».
test("document Word : le bloc rafraîchi après le clic affiche « Format : document Word (.docx). » sous la phrase d'état", async () => {
  const m = await preparer();
  await m.cliquer();
  const bloc = m.blocRefait();
  const etat = bloc.indexOf("Convention générée le 14/03/2026.");
  const format = bloc.indexOf('<p class="help-block">Format : document Word (.docx).</p>');
  const aide = bloc.indexOf('<p class="convention-aide">Téléchargez la convention');
  assert.ok(etat !== -1 && etat < format && format < aide, "ordre : phrase d'état, ligne « Format », phrase d'aide");
  assert.equal(texteDuBouton(bloc, "conventionTelecharger"), `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_WORD}</span>`);
});

// Échoue si le type du Blob est repris de la réponse de Grist (ici « text/html ») au lieu d'être fixé par le
// widget d'après l'extension : un fichier pourrait alors être interprété comme une page web.
test("le type du Blob est fixé par le widget d'après l'extension, jamais repris de la réponse de Grist", async () => {
  const docx = await preparer({fichier: () => Promise.resolve(reponseFichier(8, "text/html"))});
  await docx.cliquer();
  assert.equal(docx.blobs[0].type, TYPE_DOCX, "Word malgré text/html");
  const pdf = await preparer({nomPieceJointe: "ancienne.pdf", fichier: () => Promise.resolve(reponseFichier(8, "text/html"))});
  await pdf.cliquer();
  assert.equal(pdf.blobs[0].type, TYPE_PDF, "PDF malgré text/html");
});

// ---------------------------------------------------------------------------
// 4. Nom du fichier : année lue dans Actions.Campagne au moment du clic (E3-17)
// ---------------------------------------------------------------------------

// Échoue si l'année du nom vient de Conventions.Annee (ici 1999) au lieu d'Actions.Campagne (2026).
test("E3-17 : l'année du nom vient d'Actions.Campagne, jamais de Conventions.Annee", async () => {
  const m = await preparer({annee: 1999});
  await m.cliquer();
  assert.equal(m.popup.liens[0].instantane.download, "Convention-Dispositif-Exemple-Club-Exemple-2026.docx");
});

// Échoue si l'année est lue une fois pour toutes (au chargement) au lieu du moment du clic : la campagne de
// l'action change avant le clic.
test("E3-17 : l'année est lue au moment du clic (la campagne change entre le chargement et le clic)", async () => {
  const m = await preparer();
  m.w.state.raw.Campagnes[0].Campagne = "2031";
  await m.cliquer();
  assert.equal(m.popup.liens[0].instantane.download, "Convention-Dispositif-Exemple-Club-Exemple-2031.docx");
});

// Échoue si une campagne vide (ou une année invalide) laisse un tiret en trop, « undefined » ou une année
// inventée dans le nom (D-E1-8).
test("campagne vide ou invalide : l'année et son tiret sont omis du nom, sans plantage", async () => {
  for (const campagne of [null, "", "abc", "20311"]) {
    const m = await preparer({campagne});
    await m.cliquer();
    assert.equal(m.popup.liens[0].instantane.download, "Convention-Dispositif-Exemple-Club-Exemple.docx", `campagne ${JSON.stringify(campagne)}`);
  }
});

// Échoue si le nom enregistré contient un nom de personne ou un caractère hors lettres, chiffres, tirets et point.
test("le nom enregistré ne contient que lettres, chiffres, tirets et l'extension, jamais de nom de personne", async () => {
  const m = await preparer();
  m.w.state.raw.Structures[0].Nom = "Club d'Été & Fils / Nord";
  await m.cliquer();
  const nom = m.popup.liens[0].instantane.download;
  assert.match(nom, /^[A-Za-z0-9-]+\.docx$/, nom);
});

// ---------------------------------------------------------------------------
// 5. « Téléchargement en cours… », clics ignorés, rétablissement
// ---------------------------------------------------------------------------

// Échoue si le texte ne devient pas « Téléchargement en cours… » (sans texte caché) avec aria-disabled="true"
// (jamais disabled, pour garder le focus), si un deuxième clic relance un jeton ou un téléchargement, si le
// focus bouge, ou si texte, état, lien et adresse ne sont pas rétablis (lien retiré, adresse libérée après la
// minuterie de quelques secondes).
test("« Téléchargement en cours… » : bouton grisé (aria-disabled), clics ignorés, tout est rétabli à la fin", async () => {
  const attente = enAttente();
  const m = await preparer({fichier: () => attente.promesse});
  const fin = m.cliquer();
  await attendre();

  assert.deepEqual(m.libelle(), {mode: "texte", valeur: TEXTE_ATTENTE}, "texte d'attente, sans texte caché");
  assert.equal(m.telecharger.getAttribute("aria-disabled"), "true", "grisé par aria-disabled");
  assert.equal(m.telecharger.getAttribute("disabled"), null, "jamais l'attribut disabled");
  assert.equal(m.focus.actif, "conventionTelecharger", "le focus reste sur le bouton");

  await m.cliquer();
  await m.cliquer();
  assert.equal(m.jetons.length, 1, "les clics suivants ne redemandent pas de jeton");
  assert.equal(m.fetchs.length, 2, "ni un autre téléchargement (nom puis contenu, une seule fois)");

  attente.resoudre(reponseFichier());
  await fin;
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, "dégrisé à la fin");
  assert.equal(m.libelle().valeur, `${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_WORD}</span>`, "texte d'origine revenu, avec le texte caché du format");
  assert.equal(m.popup.liens.length, 1, "un seul lien temporaire");
  assert.deepEqual(m.liberees, [], "(contrôle) l'adresse n'est pas encore libérée");

  const liberation = m.minuteries[m.minuteries.length - 1];
  assert.ok(liberation.delai > 0 && liberation.delai < 60000, "libération au bout de quelques secondes");
  liberation.fonction();
  assert.equal(m.popup.liens[0].retire, true, "le lien est retiré de la page");
  assert.deepEqual(m.liberees, [ADRESSE_BLOB], "l'adresse blob: est libérée");
});

// ---------------------------------------------------------------------------
// 6. Échecs : message exact, rien de technique, bouton rétabli
// ---------------------------------------------------------------------------

// Ce que doit montrer l'écran après un échec : alerte d'erreur au message exact (role="alert"), aucun lien,
// aucune pop-up, bouton dégrisé avec son texte d'origine, ni jeton, ni adresse, ni identifiant de pièce jointe,
// ni texte technique dans la page ou la console. `liberation` : vrai quand une adresse blob: avait été créée.
function verifierEchec(m, nom) {
  const html = m.zoneAlerte.innerHTML;
  assert.match(html, /<div class="alert alert-error" role="alert">/, `${nom} : alerte d'erreur avec role="alert"`);
  assert.equal(decoder(html.replace(/<[^>]+>/g, "")), MESSAGE_ECHEC, `${nom} : message exact`);
  assert.deepEqual(m.popup.clics, [], `${nom} : aucun lien déclenché`);
  assert.equal(m.popup.ouverte(), false, `${nom} : aucune pop-up`);
  assert.equal(m.telecharger.getAttribute("aria-disabled"), null, `${nom} : le bouton n'est plus grisé`);
  assert.equal(m.libelle().mode, "html", `${nom} : le libellé est revenu`);
  assert.equal(m.libelle().valeur.startsWith(TEXTE_TELECHARGER), true, `${nom} : texte d'origine`);
  assert.equal(m.focus.actif, "conventionTelecharger", `${nom} : le focus est resté sur le bouton`);
  const vu = m.visible();
  for (const interdit of [JETON, JETON_ENCODE, "auth=", "blob:", REPONSE_SECRETE, "Cannot access", "403", "Failed to fetch", "metadonnees", "extension inconnue", "fichier vide", "/attachments/"]) {
    assert.ok(!vu.includes(interdit), `${nom} : ni jeton ni texte technique (« ${interdit} » trouvé dans la page ou la console)`);
  }
  assert.ok(!/\b41\b/.test(vu), `${nom} : l'identifiant de la pièce jointe n'est montré nulle part`);
}

const ECHECS = [
  ["Grist refuse le nom de la pièce jointe (403)", {meta: () => Promise.resolve(reponseRefusee(403))}],
  ["Grist refuse le contenu (403)", {fichier: () => Promise.resolve(reponseRefusee(403))}],
  ["le réseau coupe (l'erreur recopie l'adresse avec le jeton)", {fichier: () => Promise.reject(new Error(`Failed to fetch ${BASE_URL}/attachments/${PIECE_GENEREE}/download?auth=${JETON_ENCODE}`))}],
  ["le fichier est vide", {fichier: () => Promise.resolve(reponseFichier(0))}],
  ["Grist refuse de donner un jeton", {jeton: () => Promise.reject(new Error(`Refusé pour ${JETON}`))}],
  ["la réponse de Grist n'est pas lisible", {meta: () => Promise.resolve({ok: true, status: 200, json: () => Promise.reject(new Error(REPONSE_SECRETE))})}],
];
for (const [nom, options] of ECHECS) {
  // Échoue si cet échec ne donne pas le message exact, laisse une trace technique dans la page ou la console,
  // crée un lien ou un Blob inutile, ou laisse le bouton grisé.
  test(`échec : ${nom} → message exact, aucun lien, bouton rétabli, rien de technique`, async () => {
    const m = await preparer(options);
    await m.cliquer();
    verifierEchec(m, nom);
    assert.deepEqual(m.adresses, [], "aucune adresse blob: créée");
  });
}

// Échoue si un nom de fichier sans extension .docx ni .pdf est deviné (Q-E3-7 : « ne rien deviner ») : l'alerte
// d'échec doit s'afficher, le contenu ne doit même pas être téléchargé, et aucun lien ne doit être créé.
test("extension inconnue (.odt, sans extension, nom vide, .docx.exe) : échec, le contenu n'est pas téléchargé (Q-E3-7)", async () => {
  for (const nom of ["convention.odt", "convention", "", "convention.docx.exe", "convention.pdf.txt"]) {
    const m = await preparer({nomPieceJointe: nom});
    await m.cliquer();
    verifierEchec(m, `nom « ${nom} »`);
    assert.equal(m.fetchs.length, 1, `nom « ${nom} » : seul le nom a été demandé, jamais le contenu`);
    assert.deepEqual(m.blobs, [], `nom « ${nom} » : aucun Blob`);
  }
});

// Échoue si une réponse qui ne vient jamais (reseau coupé) laisse le bouton sur « Téléchargement en cours… »
// pour toujours : au bout de 20 secondes, l'alerte d'échec s'affiche et un nouveau clic est pris en compte.
test("délai de 20 secondes : sans réponse, échec avec le message exact, bouton rétabli, nouveau clic possible", async () => {
  let essai = 0;
  const m = await preparer({meta: () => (++essai === 1 ? new Promise(() => {}) : Promise.resolve(reponseMeta("convention.docx")))});
  const fin = m.cliquer();
  await attendre();
  assert.equal(m.libelle().valeur, TEXTE_ATTENTE, "en attente");
  const delai = m.minuteries.find((t) => t.delai === 20000);
  assert.ok(delai, "une minuterie de 20 secondes");
  delai.fonction();
  await fin;
  verifierEchec(m, "délai");

  await m.cliquer(); // le verrou est levé : le clic relance un jeton
  assert.equal(m.jetons.length, 2, "un nouveau clic est pris en compte");
});

// Échoue si le verrou reste posé après un échec (le deuxième clic serait ignoré), si l'alerte d'échec reste
// affichée quand le nouvel essai réussit, ou si le nouvel essai ne crée pas le lien.
test("après un échec, un nouveau clic est pris en compte : l'alerte est effacée et le fichier est téléchargé", async () => {
  let essai = 0;
  const m = await preparer({fichier: () => Promise.resolve(++essai === 1 ? reponseRefusee(403) : reponseFichier())});
  await m.cliquer();
  assert.notEqual(m.zoneAlerte.innerHTML, "", "l'alerte d'échec est affichée");
  await m.cliquer();
  assert.equal(m.zoneAlerte.innerHTML, "", "l'alerte est effacée");
  assert.equal(m.popup.liens.length, 1, "le fichier est téléchargé au second essai");
});
