"use strict";

// Dépôt LIBRE du fichier signé (Évolution 3 : docs/ux/convention.md, §15.3, §15.6, §15.10 ; backlog E3-6, E3-7,
// E3-8, E3-17, E3-23) : « Déposer la convention signée » est visible aux états « À générer » et « Sans modèle »
// (pas seulement « Générée »). Un dépôt sans génération préalable :
//  - envoie le PDF, CRÉE la ligne Conventions de l'action si elle n'existe pas (Action seulement : jamais DR, DD,
//    Modele ni Annee), puis écrit PDF_signe + Date_depot en UN seul PATCH REST ;
//  - fait passer le bloc DIRECTEMENT à « Signée » (Modele et Annee restent vides), phrase « Convention signée,
//    déposée le [date]. » ;
//  - nomme le fichier Convention-signee-[dispositif]-[club]-[année].pdf, l'année étant lue dans Actions.Campagne
//    (E3-17), le dispositif gardant son nom complet quand il n'a pas de nom court (Q-E3-5 a) ;
//  - ne dépend pas du blocage de la génération (agence ou club manquant) ;
//  - garde un PDF seulement (E3-8) ;
//  - en cas de refus de Grist (règles d'accès sur la création de ligne), affiche le message de droits (S9-4) sans
//    jamais laisser le bloc dans un état faux, et réutilise la ligne vide laissée au nouvel essai.
// Contrairement à test/convention-deposer.test.js (qui remplace le réseau par des doublures), ces tests laissent
// tourner le VRAI code de conventionDeposerFichier : seuls le navigateur et Grist (fetch, getAccessToken,
// applyUserActions) sont des doublures. Valeurs fictives uniquement : le jeton et l'adresse n'existent pas.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");
const {decoder} = require("./helpers/convention-popup");

const JETON = "jeton-fictif-0a1b2c3d";
const BASE_URL = "https://grist.exemple.test/api/docs/document-fictif";
const REPONSE_SECRETE = "TEXTE-DE-REPONSE-A-NE-PAS-RECOPIER";
const ID_PIECE_JOINTE = 52;
const ID_LIGNE_CREEE = 55;

const MESSAGE_DROITS = "Le fichier n'a pas été enregistré : vos droits ne le permettent pas pour cette action. Contactez l'équipe du tableau de bord.";
const MESSAGE_ECHEC = "Le fichier n'a pas pu être enregistré. Réessayez ou contactez l'équipe du tableau de bord.";
const MESSAGE_PAS_PDF = "Le fichier n'a pas été enregistré : ce n'est pas un PDF.";
const MESSAGE_REUSSITE = "Convention signée enregistrée.";

const attendre = () => new Promise((resolve) => setImmediate(resolve));
const ordinaire = (valeur) => JSON.parse(JSON.stringify(valeur));
const jamais = () => new Promise(() => {});

function fichierFactice({name = "convention-signee-fictive.pdf", type = "application/pdf", size = 1234, debut = "%PDF-1.4"} = {}) {
  const octets = Uint8Array.from(Buffer.from(debut, "latin1"));
  return {name, type, size, slice: (de, a) => ({arrayBuffer: () => Promise.resolve(octets.slice(de, a).buffer)})};
}
const PDF_VALIDE = fichierFactice();

const reponse = (ok, status, corps) => ({ok, status, json: () => Promise.resolve(corps), text: () => Promise.resolve(REPONSE_SECRETE)});

// ---------------------------------------------------------------------------
// Faux écran et fausse API Grist
// ---------------------------------------------------------------------------
// preparer(options) charge le widget, pose l'action 1 (agence, club, dispositif, campagne 2026) et note tout :
//   fetchs : chaque requête {url, options} ; appels : chaque applyUserActions ; jetons : options de getAccessToken ;
//   journal : la console ; focus : les focus() demandés ; formulaires : les envois (FormData).
// Réglages : dispositif (nom), sansModele, campagne (texte, null = aucune), action (champs de l'action en plus),
// conventions (lignes de Conventions), tablesRefusees, envoi (réponse du POST), patch (réponse du PATCH),
// creation (réponse d'applyUserActions).

async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  const campagne = "campagne" in options ? options.campagne : "2026";
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, Campagne: campagne === null ? 0 : 4, ...(options.action || {})}],
    Campagnes: campagne === null ? [] : [{id: 4, Campagne: campagne}],
    Structures: [{id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"}],
    Dispositifs: [{id: 3, Dispositif: options.dispositif || "Match des métiers"}],
    Agences: [{id: 5, Libelle_agence: "Agence Exemple"}],
    Modeles_convention: options.sansModele ? [] : [{id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true, Contenu: "Texte fictif."}],
    Contacts: [],
    Conventions: (options.conventions || []).map((ligne) => ({...ligne})),
  };
  w.state.tablesRefusees = options.tablesRefusees || [];
  journal.length = 0;

  const fetchs = [];
  const appels = [];
  const jetons = [];
  const formulaires = [];
  const focus = [];
  const g = w.window;
  const doc = w.document;

  g.clearTimeout = clearTimeout;
  g.FormData = class { constructor() { this.parties = []; formulaires.push(this); } append(nom, valeur, fichier) { this.parties.push([nom, valeur, fichier]); } };
  w.grist.docApi.getAccessToken = (opts) => { jetons.push(opts); return Promise.resolve({token: JETON, baseUrl: BASE_URL}); };
  w.grist.docApi.applyUserActions = (actions) => {
    appels.push(actions);
    return options.creation ? options.creation() : Promise.resolve({retValues: [ID_LIGNE_CREEE]});
  };
  g.fetch = (url, opts) => {
    fetchs.push({url, options: opts});
    if (opts && opts.method === "PATCH") return options.patch ? options.patch() : Promise.resolve(reponse(true, 200, {}));
    return options.envoi ? options.envoi() : Promise.resolve(reponse(true, 200, [ID_PIECE_JOINTE]));
  };

  const origine = doc.getElementById;
  doc.getElementById = (id) => {
    const element = origine(id);
    if (!element.suivi) {
      element.suivi = true;
      element.focus = () => { focus.push(id); };
    }
    return element;
  };
  const champ = doc.getElementById("conventionFichier");
  champ.click = () => {};
  const ecouteurs = {};
  for (const id of ["conventionDeposer", "conventionRemplacer"]) {
    doc.getElementById(id).addEventListener = (type, fonction) => { if (type === "click") ecouteurs[id] = fonction; };
  }
  // Le bloc est écrit dans la page comme la fiche le fait au départ (état d'avant le dépôt).
  const contenu = doc.getElementById("conventionBlocContenu");
  contenu.innerHTML = w.conventionBlocContenuHtml(1, w.state);
  w.bindConventionDepot(1);

  return {
    w, fetchs, appels, jetons, journal, focus, formulaires, champ, contenu,
    alerte: () => doc.getElementById("conventionAlerte").innerHTML,
    etat: () => w.conventionEtat(1, w.state),
    bloc: () => decoder(contenu.innerHTML),
    // Clic sur la commande puis choix du fichier ; rend la promesse de la fin du dépôt.
    async deposer(fichier = PDF_VALIDE, commande = "conventionDeposer") {
      ecouteurs[commande]({});
      champ.files = [fichier];
      champ.value = "C:\\fakepath\\convention.pdf";
      await champ.onchange();
    },
  };
}

const estPatch = (requete) => requete.options && requete.options.method === "PATCH";
const estEnvoi = (requete) => requete.options && requete.options.method === "POST";
const textesDuBloc = (bloc) => [...bloc.matchAll(/<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
const idsDesBoutons = (bloc) => [...bloc.matchAll(/<button\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
const formatDate = (secondes) => new Date(secondes * 1000).toLocaleDateString("fr-FR", {day: "2-digit", month: "2-digit", year: "numeric"});

// ---------------------------------------------------------------------------
// 1. Dépôt depuis « À générer » : la ligne est créée, puis PDF_signe + Date_depot en un seul PATCH
// ---------------------------------------------------------------------------

// Échoue si l'ordre n'est pas : jeton d'écriture, envoi du fichier, création de la ligne, PATCH ; si la ligne n'est
// pas créée par UNE seule opération applyUserActions { Action } (E3-6 : jamais DR, DD, Modele ni Annee) ; si
// PDF_signe et Date_depot ne sont pas écrits ensemble dans un seul PATCH sur la ligne créée ; si l'ordre recommandé
// (§15.6 : contrôles, envoi, création, PATCH) change, ce qui laisserait une ligne vide inutile si l'envoi échoue.
test("dépôt à l'état À générer : jeton, envoi du PDF, création de la ligne Conventions (Action seulement), puis UN PATCH PDF_signe + Date_depot", async () => {
  const m = await preparer();
  const trace = [];
  const fetchAvant = m.w.window.fetch;
  m.w.window.fetch = (url, opts) => { trace.push(estPatch({options: opts}) ? "patch" : "envoi"); return fetchAvant(url, opts); };
  const jetonAvant = m.w.grist.docApi.getAccessToken;
  m.w.grist.docApi.getAccessToken = (opts) => { trace.push("jeton"); return jetonAvant(opts); };
  const creationAvant = m.w.grist.docApi.applyUserActions;
  m.w.grist.docApi.applyUserActions = (actions) => { trace.push("creation"); return creationAvant(actions); };
  const avant = Math.floor(Date.now() / 1000);

  await m.deposer();
  const apres = Math.floor(Date.now() / 1000);

  assert.deepEqual(trace, ["jeton", "envoi", "creation", "patch"], "contrôles, jeton, envoi, création de la ligne, PATCH");
  assert.deepEqual(ordinaire(m.jetons), [{readOnly: false}], "un seul jeton, d'écriture");
  assert.equal(m.appels.length, 1, "une seule opération applyUserActions");
  assert.deepEqual(ordinaire(m.appels[0]), [["AddRecord", "Conventions", null, {Action: 1}]], "la ligne est créée avec Action seulement");
  const ecrit = JSON.stringify(m.appels);
  for (const interdit of ["DR", "DD", "Modele", "Annee", "PDF_signe", "PDF_genere", "Date_depot"]) assert.ok(!ecrit.includes(`"${interdit}"`), `${interdit} n'est jamais écrit à la création`);

  const patchs = m.fetchs.filter(estPatch);
  assert.equal(patchs.length, 1, "un seul PATCH");
  assert.equal(patchs[0].url, `${BASE_URL}/tables/Conventions/records?auth=${encodeURIComponent(JETON)}`);
  const corps = JSON.parse(patchs[0].options.body);
  assert.equal(corps.records.length, 1);
  assert.equal(corps.records[0].id, ID_LIGNE_CREEE, "la ligne qui vient d'être créée");
  assert.deepEqual(Object.keys(corps.records[0].fields).sort(), ["Date_depot", "PDF_signe"], "ces deux colonnes ensemble, pas d'autre");
  assert.deepEqual(corps.records[0].fields.PDF_signe, ["L", ID_PIECE_JOINTE]);
  assert.ok(corps.records[0].fields.Date_depot >= avant && corps.records[0].fields.Date_depot <= apres, "la date du moment du dépôt");
});

// Échoue si, après un dépôt à l'état À générer, le bloc ne passe pas DIRECTEMENT à « Signée » (E3-7) : phrase exacte
// « Convention signée, déposée le [date]. », aucune mention du modèle, de l'année ni de « générée », boutons « Voir la
// convention signée », « Télécharger » puis « Remplacer » (plus de « Générer » ni de « Déposer »), alerte de succès
// « Convention signée enregistrée. », focus sur « Voir la convention signée » ; si Modele ou Annee sont écrits dans la
// ligne en mémoire.
test("après un dépôt à l'état À générer : état Signée, « Convention signée, déposée le [date]. », Modele et Annee vides, focus sur « Voir la convention signée »", async () => {
  const m = await preparer();
  assert.equal(m.etat().etat, "À générer", "(contrôle) point de départ");

  await m.deposer();

  assert.equal(m.etat().etat, "Signée");
  const ligne = m.w.state.raw.Conventions.find((l) => l.id === ID_LIGNE_CREEE);
  assert.deepEqual(ordinaire(ligne.PDF_signe), ["L", ID_PIECE_JOINTE]);
  assert.equal(ligne.Modele, undefined, "Modele reste vide");
  assert.equal(ligne.Annee, undefined, "Annee reste vide");
  assert.equal(ligne.PDF_genere, undefined, "aucune génération");
  const bloc = m.bloc();
  assert.deepEqual(textesDuBloc(bloc), [`Convention signée, déposée le ${formatDate(ligne.Date_depot)}.`]);
  assert.ok(!/générée|modèle|Modèle|année|Année/.test(bloc.replace(/<[^>]+>/g, " ")), "aucune mention du modèle, de l'année ni de « générée »");
  assert.deepEqual(idsDesBoutons(bloc), ["conventionVoirSignee", "conventionTelechargerSignee", "conventionRemplacer"]);
  assert.match(m.alerte(), /<div class="alert alert-success"><p class="alert-content">Convention signée enregistrée\.<\/p><\/div>/);
  assert.ok(m.alerte().includes(MESSAGE_REUSSITE));
  assert.equal(m.focus[m.focus.length - 1], "conventionVoirSignee", "le focus arrive sur « Voir la convention signée »");
  assert.deepEqual(m.journal, [], "rien dans la console");
});

// Échoue si le dépôt libre plante ou perd son état quand le dispositif n'a pas de modèle (E3-7, §15.10 : conventionEtat
// peut rendre un modèle nul) : le bloc doit passer à « Signée » sans erreur, le nom du fichier garde le nom COMPLET du
// dispositif (jamais de forme abrégée, Q-E3-5 a) et l'année de la campagne.
test("dépôt à l'état Sans modèle : état Signée sans erreur (modèle nul), nom complet du dispositif dans le nom du fichier", async () => {
  const cas = [
    ["Aller vers", "Convention-signee-Aller-vers-Club-Exemple-2026.pdf"],
    ["Parcours complet d'insertion par le sport", "Convention-signee-Parcours-complet-d-insertion-par-le-sport-Club-Exemple-2026.pdf"],
  ];
  for (const [dispositif, nomAttendu] of cas) {
    const m = await preparer({sansModele: true, dispositif});
    assert.equal(m.etat().etat, "Sans modèle", "(contrôle) point de départ");

    await m.deposer();

    assert.equal(m.etat().etat, "Signée", dispositif);
    assert.equal(m.etat().modele, null, "pas de modèle : aucun code ne doit en dépendre");
    assert.equal(m.formulaires[0].parties[0][2], nomAttendu, `nom du fichier pour « ${dispositif} »`);
    assert.deepEqual(idsDesBoutons(m.bloc()), ["conventionVoirSignee", "conventionTelechargerSignee", "conventionRemplacer"]);
    assert.deepEqual(m.appels.map((a) => a[0][1]), ["Conventions"], "la ligne est créée");
    assert.ok(m.fetchs.filter(estPatch).length === 1);
  }
});

// ---------------------------------------------------------------------------
// 2. Nom du fichier signé : l'année vient d'Actions.Campagne (E3-17)
// ---------------------------------------------------------------------------

// Échoue si l'année du nom du fichier signé vient de Conventions.Annee (ici 1999, ou absente après un dépôt libre) au
// lieu d'Actions.Campagne, si une campagne vide laisse un tiret ou une année inventée, ou si le nom d'origine du fichier
// choisi est repris.
test("E3-17 : nom du fichier signé = Convention-signee-[dispositif]-[club]-[année de la campagne].pdf, jamais Conventions.Annee ni le nom d'origine", async () => {
  const cas = [
    ["campagne 2026, aucune ligne Conventions", {}, "Convention-signee-Match-metiers-Club-Exemple-2026.pdf"],
    ["campagne 2026, Conventions.Annee = 1999", {conventions: [{id: 20, Action: 1, Annee: 1999}]}, "Convention-signee-Match-metiers-Club-Exemple-2026.pdf"],
    ["campagne vide : année et tiret omis", {campagne: ""}, "Convention-signee-Match-metiers-Club-Exemple.pdf"],
    ["action sans campagne : année et tiret omis", {campagne: null}, "Convention-signee-Match-metiers-Club-Exemple.pdf"],
    ["campagne invalide : année omise", {campagne: "20x6"}, "Convention-signee-Match-metiers-Club-Exemple.pdf"],
  ];
  for (const [nom, options, attendu] of cas) {
    const m = await preparer(options);
    await m.deposer(fichierFactice({name: "Scan-Dupont-Marie-signé.pdf"}));
    const [champ, fichier, envoye] = m.formulaires[0].parties[0];
    assert.equal(champ, "upload", nom);
    assert.equal(envoye, attendu, nom);
    assert.ok(!envoye.includes("Dupont"), `${nom} : le nom d'origine du fichier n'est jamais repris`);
  }
});

// ---------------------------------------------------------------------------
// 3. Le blocage de la génération n'empêche pas le dépôt
// ---------------------------------------------------------------------------

// Échoue si un club ou une agence manquant empêche le dépôt (§15.3 : le message de blocage parle de la génération seule),
// ou si le nom du fichier plante sans club (« club » à la place du nom, comme le code l'a toujours fait).
test("agence et club manquants : « Générer » est bloqué, mais le dépôt réussit (nom du fichier avec « club »)", async () => {
  const m = await preparer({action: {Agence: 0, Club: 0}});
  assert.notEqual(m.w.conventionBlocage(1, m.w.state), null, "(contrôle) la génération est bloquée");
  assert.ok(m.bloc().includes("conventionDeposer"), "(contrôle) « Déposer » est affiché");

  await m.deposer();

  assert.equal(m.etat().etat, "Signée");
  assert.equal(m.formulaires[0].parties[0][2], "Convention-signee-Match-metiers-club-2026.pdf");
});

// ---------------------------------------------------------------------------
// 4. Ligne déjà là : jamais de doublon
// ---------------------------------------------------------------------------

// Échoue si une ligne Conventions déjà présente (informations enregistrées, sans PDF) est doublée par un dépôt, ou si
// plusieurs lignes existent et que le PATCH ne vise pas la plus ancienne (règle existante de conventionEtat).
test("ligne Conventions déjà présente (informations seulement) : aucune création, le PATCH vise la plus ancienne", async () => {
  const m = await preparer({conventions: [{id: 30, Action: 1}, {id: 20, Action: 1, Representant_agence: "Dana Exemple"}]});

  await m.deposer();

  assert.deepEqual(m.appels, [], "aucune création de ligne");
  assert.equal(JSON.parse(m.fetchs.find(estPatch).options.body).records[0].id, 20, "la plus ancienne ligne");
  assert.equal(m.w.state.raw.Conventions.length, 2, "toujours deux lignes : pas de doublon");
  assert.equal(m.w.state.raw.Conventions.find((l) => l.id === 20).Representant_agence, "Dana Exemple", "les informations déjà enregistrées sont gardées");
  assert.equal(m.etat().etat, "Signée");
});

// Échoue si un dépôt à l'état Générée crée une ligne de plus, ou touche à PDF_genere, Date_generation, Modele ou Annee.
test("dépôt à l'état Générée : aucune création de ligne, PDF_genere, Modele et Annee ne changent", async () => {
  const m = await preparer({conventions: [{id: 20, Action: 1, Modele: 10, Annee: 2025, PDF_genere: ["L", 41], Date_generation: 1700000000}]});

  await m.deposer();

  assert.deepEqual(m.appels, [], "aucune création");
  const ligne = m.w.state.raw.Conventions[0];
  assert.deepEqual(ordinaire([ligne.Modele, ligne.Annee, ligne.PDF_genere, ligne.Date_generation]), [10, 2025, ["L", 41], 1700000000]);
  assert.deepEqual(ordinaire(ligne.PDF_signe), ["L", ID_PIECE_JOINTE]);
  assert.equal(m.etat().etat, "Signée");
});

// ---------------------------------------------------------------------------
// 5. Échecs : jamais d'état faux, message de droits (S9-4)
// ---------------------------------------------------------------------------

// Échoue si un refus des règles d'accès de Grist à la CRÉATION de la ligne (non-propriétaire, §15.14 risque 1) ne donne
// pas le message de droits S9-4 exact, si un PATCH part quand même, si le bloc quitte l'état « À générer » (ou « Sans
// modèle »), si le focus ne revient pas sur « Déposer », ou si le jeton ou le texte de l'erreur de Grist se retrouve dans
// l'alerte ou la console.
test("création de la ligne refusée par les règles d'accès : message de droits, aucun PATCH, le bloc reste à l'état d'origine", async () => {
  for (const sansModele of [false, true]) {
    const m = await preparer({sansModele, creation: () => Promise.reject(new Error(`[Sandbox] Blocked by table access rules ${JETON} ${REPONSE_SECRETE}`))});
    const avant = m.etat().etat;

    await m.deposer();

    assert.equal(decoder(m.alerte().replace(/<[^>]+>/g, "")), MESSAGE_DROITS);
    assert.match(m.alerte(), /<div class="alert alert-error" role="alert">/);
    assert.equal(m.fetchs.filter(estPatch).length, 0, "aucun PATCH");
    assert.equal(m.etat().etat, avant, "l'état n'a pas changé");
    assert.deepEqual(m.w.state.raw.Conventions, [], "aucune ligne en mémoire");
    assert.equal(m.focus[m.focus.length - 1], "conventionDeposer", "le focus revient sur la commande utilisée");
    const vu = JSON.stringify([m.alerte(), m.journal]);
    assert.ok(!vu.includes(JETON) && !vu.includes(REPONSE_SECRETE) && !vu.includes("Blocked"), "ni jeton ni texte de l'erreur de Grist");
  }
});

// Échoue si un échec de création qui n'est PAS un refus de droits (réseau coupé, réponse sans identifiant) affiche le
// message de droits au lieu du message général, ou laisse une ligne en mémoire.
test("création de la ligne en échec sans refus de droits (réseau, réponse sans identifiant) : message général, état inchangé", async () => {
  const cas = [
    ["réseau coupé", () => Promise.reject(new Error("Failed to fetch"))],
    ["réponse sans identifiant", () => Promise.resolve({retValues: [null]})],
    ["identifiant invalide", () => Promise.resolve({retValues: [0]})],
  ];
  for (const [nom, creation] of cas) {
    const m = await preparer({creation});
    await m.deposer();
    assert.equal(decoder(m.alerte().replace(/<[^>]+>/g, "")), MESSAGE_ECHEC, nom);
    assert.equal(m.fetchs.filter(estPatch).length, 0, `${nom} : aucun PATCH`);
    assert.equal(m.etat().etat, "À générer", `${nom} : état inchangé`);
    assert.deepEqual(m.w.state.raw.Conventions, [], `${nom} : aucune ligne en mémoire`);
  }
});

// Échoue si, quand la création réussit mais que le PATCH est refusé (403), (a) le message de droits S9-4 n'est pas
// affiché, (b) le bloc passe à « Signée » (rien de visible ne doit changer tant que le PATCH n'a pas réussi, §15.6),
// (c) la ligne vide laissée n'est pas gardée en mémoire sans PDF_signe, ou (d) le nouvel essai crée une SECONDE ligne
// au lieu de réutiliser celle-là (§15.14 risque 2).
test("création réussie puis PATCH refusé : message de droits, état inchangé, et le nouvel essai réutilise la ligne vide (pas de doublon)", async () => {
  let essai = 0;
  const m = await preparer({patch: () => Promise.resolve(++essai === 1 ? reponse(false, 403, {error: REPONSE_SECRETE}) : reponse(true, 200, {}))});

  await m.deposer();

  assert.equal(decoder(m.alerte().replace(/<[^>]+>/g, "")), MESSAGE_DROITS, "message de droits");
  assert.equal(m.etat().etat, "À générer", "le bloc n'est pas passé à « Signée »");
  assert.deepEqual(ordinaire(m.w.state.raw.Conventions), [{id: ID_LIGNE_CREEE, Action: 1}], "la ligne vide est gardée en mémoire, sans PDF_signe");
  assert.ok(m.bloc().includes("conventionDeposer"), "« Déposer » est toujours là");
  assert.equal(m.appels.length, 1, "(contrôle) une création au premier essai");

  await m.deposer();

  assert.equal(m.appels.length, 1, "le nouvel essai ne crée PAS de seconde ligne");
  assert.equal(m.w.state.raw.Conventions.length, 1, "toujours une seule ligne");
  const patchs = m.fetchs.filter(estPatch);
  assert.equal(patchs.length, 2);
  assert.equal(JSON.parse(patchs[1].options.body).records[0].id, ID_LIGNE_CREEE, "le second PATCH vise la ligne laissée vide");
  assert.equal(m.etat().etat, "Signée", "le second essai réussit");
});

// Échoue si le fichier est refusé à l'ENVOI (401 ou 403) et que la ligne est quand même créée : l'ordre recommandé (§15.6)
// envoie le fichier AVANT de créer la ligne, pour ne laisser aucune ligne vide inutile.
test("envoi du fichier refusé (403) : message de droits, AUCUNE ligne créée, état inchangé", async () => {
  const m = await preparer({envoi: () => Promise.resolve(reponse(false, 403, {error: REPONSE_SECRETE}))});

  await m.deposer();

  assert.equal(decoder(m.alerte().replace(/<[^>]+>/g, "")), MESSAGE_DROITS);
  assert.deepEqual(m.appels, [], "aucune création de ligne");
  assert.equal(m.fetchs.filter(estPatch).length, 0);
  assert.equal(m.etat().etat, "À générer");
  assert.ok(!JSON.stringify([m.alerte(), m.journal]).includes(JETON));
});

// ---------------------------------------------------------------------------
// 6. Le fichier signé reste un PDF (E3-8)
// ---------------------------------------------------------------------------

// Échoue si un fichier qui n'est pas un PDF (Word, mauvais type, mauvais contenu) est accepté à l'état À générer ou
// Sans modèle, si un jeton est demandé ou une requête part avant le contrôle, ou si le message change.
test("E3-8 : un fichier Word (ou tout autre fichier qui n'est pas un PDF) est refusé aux états À générer et Sans modèle, sans réseau ni jeton", async () => {
  const refuses = [
    ["Word", fichierFactice({name: "convention.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", debut: "PK\u0003\u0004"})],
    ["extension .docx sur un faux PDF", fichierFactice({name: "convention.docx"})],
    ["contenu qui n'est pas %PDF-", fichierFactice({debut: "PK\u0003\u0004zip"})],
  ];
  for (const sansModele of [false, true]) {
    for (const [nom, fichier] of refuses) {
      const m = await preparer({sansModele});
      await m.deposer(fichier);
      assert.equal(decoder(m.alerte().replace(/<[^>]+>/g, "")), MESSAGE_PAS_PDF, `${nom} (sans modèle : ${sansModele})`);
      assert.deepEqual([m.jetons, m.fetchs, m.appels], [[], [], []], `${nom} : aucun jeton, aucune requête, aucune création`);
    }
  }
});

// Échoue si les contrôles de taille et de contenu vide changent à l'état À générer (10 Mo exactement accepté, 10 Mo + 1
// refusé, fichier vide refusé) : le dépôt libre doit réutiliser les mêmes contrôles que le dépôt après génération.
test("mêmes contrôles qu'avant à l'état À générer : 10 Mo pile accepté, au-delà refusé, fichier vide refusé", async () => {
  const dix = 10 * 1024 * 1024;
  const pile = await preparer();
  await pile.deposer(fichierFactice({size: dix}));
  assert.equal(pile.etat().etat, "Signée", "10 Mo pile : accepté");

  const trop = await preparer();
  await trop.deposer(fichierFactice({size: dix + 1}));
  assert.equal(decoder(trop.alerte().replace(/<[^>]+>/g, "")), "Le fichier n'a pas été enregistré : 10 Mo au maximum.");
  const vide = await preparer();
  await vide.deposer(fichierFactice({size: 0}));
  assert.equal(decoder(vide.alerte().replace(/<[^>]+>/g, "")), "Le fichier n'a pas été enregistré : le fichier est vide.");
  assert.deepEqual([trop.fetchs, vide.fetchs, trop.appels, vide.appels], [[], [], [], []], "rien n'est envoyé ni créé");
});

// ---------------------------------------------------------------------------
// 7. État « Droits insuffisants » : rien n'est déposé même si on y arrive
// ---------------------------------------------------------------------------

// Échoue si, à l'état Droits insuffisants (Conventions ou Modeles_convention refusée en lecture), un dépôt appelé
// quand même écrit quelque chose : aucun jeton, aucune requête, aucune création, message de droits.
test("état Droits insuffisants : un dépôt forcé n'écrit rien (aucun jeton, aucune requête, aucune création) et affiche le message de droits", async () => {
  for (const refusee of ["Conventions", "Modeles_convention"]) {
    const m = await preparer({tablesRefusees: [refusee]});
    await m.deposer();
    assert.equal(decoder(m.alerte().replace(/<[^>]+>/g, "")), MESSAGE_DROITS, refusee);
    assert.deepEqual([m.jetons, m.fetchs, m.appels], [[], [], []], `${refusee} : rien n'est écrit`);
  }
});

// ---------------------------------------------------------------------------
// 8. Pendant l'envoi : « Générer la convention » grisé sans message (E3-6, §15.3)
// ---------------------------------------------------------------------------

// Échoue si, pendant l'envoi d'un fichier signé à l'état À générer, « Générer la convention » n'est pas grisé (le
// widget ne génère pas pendant qu'un fichier signé est en route), s'il reçoit le message de blocage ou un
// aria-haspopup, ou si « Déposer » n'affiche pas « Envoi en cours… » ; et si tout n'est pas rétabli à la fin du dépôt
// (le bloc final est celui de l'état Signée).
test("pendant l'envoi à l'état À générer : « Générer la convention » grisé (aria-disabled, sans message ni aria-haspopup), « Déposer » en « Envoi en cours… »", async () => {
  let libererEnvoi;
  const porte = new Promise((resolve) => { libererEnvoi = resolve; });
  const m = await preparer({envoi: () => porte.then(() => reponse(true, 200, [ID_PIECE_JOINTE]))});

  const fin = m.deposer();
  await attendre();
  await attendre();

  const pendant = decoder(m.w.conventionBlocContenuHtml(1, m.w.state));
  const generer = /<button\b[^>]*\sid="conventionGenerer"[^>]*>/.exec(pendant)[0];
  assert.ok(generer.includes('aria-disabled="true"'), "« Générer la convention » est grisé");
  assert.ok(!generer.includes("aria-haspopup") && !generer.includes("aria-describedby"), "sans aria-haspopup ni message de blocage");
  assert.ok(!pendant.includes("conventionBlocageTexte"), "aucun message de blocage : rien ne manque");
  assert.match(pendant, /id="conventionDeposer" aria-disabled="true"><span class="btn-content">Envoi en cours…<\/span>/, "« Déposer » est verrouillé et dit « Envoi en cours… »");

  libererEnvoi();
  await fin;
  assert.equal(m.etat().etat, "Signée");
  assert.ok(!m.bloc().includes("aria-disabled"), "plus aucun verrou dans le bloc final");
});
