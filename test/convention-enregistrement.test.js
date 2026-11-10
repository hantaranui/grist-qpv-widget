"use strict";

// Enregistrement des informations de la fenetre « Convention » (tache 5.2, mis a jour pour
// l'Evolution 1 : docs/ux/convention.md, §3 « Fermer la fenetre », D-E1-5, D-E1-17) :
// une seule operation applyUserActions (AddRecord ou UpdateRecord sur Conventions), les colonnes
// ecrites et jamais les autres, valeurs vides, deux enregistrements de suite, annee tiree de la
// campagne de l'action, fermeture qui enregistre en silence (echec : la fenetre reste ouverte), et
// prerempli a la reouverture.
// Evolution 1 : plus de bouton « Enregistrer les informations », plus de champ « Annee », plus de
// controle de champ. « Fermer » (et Echap) appelle fermerConvention, qui enregistre sans message
// de reussite puis ferme. La creation d'un contact (bouton « Ajouter un contact ») est testee dans
// convention-contact.test.js.
// Les textes de reference sont ceux de docs/ux/convention.md. Ils sont recopies ici
// en dur : si le code change un mot, le test doit echouer.
// Ce fichier est separe de convention-fenetre.test.js : celui-ci est deja long et son
// faux navigateur (monter) n'est pas partage. Ici les doublures de test/helpers/widget.js
// suffisent (avec window.addEventListener, ajoute ci-dessous) : un meme identifiant renvoie
// toujours le meme element, et on appelle openConvention, fermerConvention et
// conventionEnregistrer directement.
// Donnees fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const MESSAGE_ECHEC = "Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord.";

const SIX_COLONNES = ["Action", "Modele", "Annee", "Signataire_club", "Representant_agence", "Fonction_representant"].sort();
const CINQ_COLONNES = SIX_COLONNES.filter((colonne) => colonne !== "Annee");
const INTERDITES = ["PDF_genere", "Date_generation", "PDF_signe", "Date_depot", "DR", "DD"];

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true};
const CONTACTS = [
  {id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"},
  {id: 32, Club: 7, Prenom: "Alex", Nom: "Modèle", Fonction: ""},
  {id: 33, Club: 99, Prenom: "Robin", Nom: "Voisin", Fonction: "Trésorier"},
];
const ID_CAMPAGNE = 4;

// `campagne` : valeur de Actions.Campagne (une reference vers Campagnes). 0 = reference vide.
function tables({conventions = [], modele = {}, contacts = CONTACTS, campagne = ID_CAMPAGNE} = {}) {
  return {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, Campagne: campagne}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [{...MODELE, ...modele}],
    Contacts: contacts.map((c) => ({...c})),
    Conventions: conventions,
  };
}

// Ce que lireConventionForm donne : plus d'annee (elle vient de la campagne), pas de nouveau contact.
const VALEURS = {signataire: 31, nouveauContact: null, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};
const CHAMPS_VALEURS = {
  Action: 1, Modele: 10, Annee: 2031, Signataire_club: 31,
  Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe",
};

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Les objets et tableaux crees dans le bac a sable de test/helpers/widget.js viennent d'un
// autre contexte d'execution : deepStrictEqual compare aussi leur prototype et les juge
// differents des nôtres, meme identiques au caractere pres. On les recopie donc en objets
// ordinaires de ce fichier avant de comparer. Attention : JSON fait disparaitre une
// propriete undefined et change un undefined de tableau en null. Les tests qui comparent
// une valeur attendue null verifient donc aussi la valeur d'origine avec strictEqual.
const ordinaire = (valeur) => JSON.parse(JSON.stringify(valeur));

// Charge le widget, attend la fin de son chargement asynchrone (sinon il remplacerait
// state.raw en plein test), puis pose le jeu d'essai et un faux applyUserActions qui note
// chaque appel. `retour(actions, numero)` fixe la reponse ; `refus` fait echouer l'ecriture.
// `journal` recueille tout ce que le widget ecrit dans la console APRES la preparation.
// La campagne 4 vaut « 2031 » (objet `campagnes`, modifiable par un test) ; `campagnes.illisible`
// fait echouer la lecture de la table Campagnes (reseau coupe).
async function preparer(raw, options = {}) {
  const {retour} = options;
  const refuse = "refus" in options; // « refus: undefined » est un vrai refus (erreur sans valeur)
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  w.state.raw = raw;
  w.state.tablesRefusees = [];
  journal.length = 0;
  // openConvention branche un ecouteur de redimensionnement sur window : la doublure de base n'en a pas.
  w.window.addEventListener = () => {};
  w.window.removeEventListener = () => {};

  const appels = [];
  w.grist.docApi.applyUserActions = (actions) => {
    appels.push(actions);
    if (refuse) return Promise.reject(options.refus);
    if (retour) return Promise.resolve(retour(actions, appels.length));
    const [type, , id] = actions[0];
    return Promise.resolve({retValues: [type === "AddRecord" ? 55 : (id ?? null)]});
  };
  const campagnes = {valeur: "2031", illisible: false};
  w.grist.docApi.fetchTable = (nom) => {
    if (nom === "Campagnes") {
      if (campagnes.illisible) return Promise.reject(new Error("réseau coupé"));
      return Promise.resolve({id: [ID_CAMPAGNE], Campagne: [campagnes.valeur]});
    }
    return Promise.resolve({id: []});
  };
  const element = (id) => w.document.getElementById(id);
  return {w, journal, appels, element, campagnes};
}

// Enregistrement tel que la fermeture et la generation le font : en silence.
const enregistrer = (w, valeurs) => w.conventionEnregistrer(1, valeurs, {silencieux: true});

// Prepare l'alerte comme le HTML de la fenetre l'ecrit : cachee, de type erreur.
function alerteDeDepart(element) {
  const alerte = element("conventionMessage");
  alerte.classList.add("alert", "alert-error", "is-hidden");
  alerte.setAttribute("role", "alert");
  alerte.setAttribute("aria-live", "assertive");
  return alerte;
}

const texteAlerte = (alerte) => alerte.querySelector(".alert-content").textContent;

// Valeur d'un champ <input> dans le HTML de la fenetre (attribut value).
function valeurHtml(html, id) {
  const m = new RegExp(`<input\\b[^>]*\\sid="${id}"[^>]*\\svalue="([^"]*)"`).exec(html);
  return m ? m[1].replace(/&#39;/g, "'").replace(/&amp;/g, "&") : null;
}

// ---------------------------------------------------------------------------
// 1 a 4 : ce qui est ecrit
// ---------------------------------------------------------------------------

// Echoue si l'enregistrement fait plusieurs appels ou plusieurs operations, s'il ne
// cree pas la ligne (AddRecord sur Conventions, sans identifiant) quand l'action n'en
// a pas, ou si les six colonnes (et seulement elles) n'ont pas les bonnes valeurs.
test("création : action sans ligne, une seule opération AddRecord avec exactement les six colonnes", async () => {
  const {w, appels} = await preparer(tables());
  await enregistrer(w, VALEURS);
  assert.equal(appels.length, 1, "un seul appel à applyUserActions");
  assert.equal(appels[0].length, 1, "une seule opération dans cet appel");
  const [type, table, id, champs] = appels[0][0];
  assert.equal(type, "AddRecord");
  assert.equal(table, "Conventions");
  assert.equal(id, null);
  assert.deepEqual(Object.keys(champs).sort(), SIX_COLONNES);
  assert.deepEqual(ordinaire(champs), CHAMPS_VALEURS);
});

// Echoue si, quand une ligne existe, le widget en cree une autre (AddRecord), s'il met
// a jour une autre ligne que celle de l'action, ou s'il ne l'ecrit pas en une operation.
test("mise à jour : une ligne existe, UpdateRecord sur son identifiant et aucune création", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2020, Signataire_club: 32, Representant_agence: "Ancien", Fonction_representant: "Ancienne fonction"};
  const autreAction = {id: 21, Action: 2, Modele: 10, Annee: 2020};
  const {w, appels} = await preparer(tables({conventions: [autreAction, ligne]}));
  await enregistrer(w, VALEURS);
  assert.equal(appels.length, 1, "un seul appel");
  assert.equal(appels[0].length, 1, "une seule opération");
  assert.deepEqual(ordinaire(appels[0][0]), ["UpdateRecord", "Conventions", 20, CHAMPS_VALEURS]);
  assert.equal(appels[0].some(([type]) => type === "AddRecord"), false, "aucune création");
});

// Echoue si, avec deux lignes pour la meme action, le widget met a jour la plus
// recente, les deux, ou en cree une troisieme (la table n'est pas ordonnee par id ici).
test("doublon : deux lignes pour l'action, seule la plus ancienne est mise à jour", async () => {
  const recente = {id: 25, Action: 1, Modele: 10, Annee: 2024};
  const ancienne = {id: 20, Action: 1, Modele: 10, Annee: 2020};
  const {w, appels} = await preparer(tables({conventions: [recente, ancienne]}));
  await enregistrer(w, VALEURS);
  assert.equal(appels.length, 1);
  assert.equal(appels[0].length, 1, "une seule opération");
  assert.deepEqual(ordinaire(appels[0][0]), ["UpdateRecord", "Conventions", 20, CHAMPS_VALEURS]);
  assert.equal(w.state.raw.Conventions.find((l) => l.id === 25).Annee, 2024, "la ligne la plus récente n'est pas touchée");
  assert.equal(w.state.raw.Conventions.find((l) => l.id === 20).Annee, 2031, "la ligne la plus ancienne est à jour");
});

// Echoue si une valeur vide n'est pas ecrite sous la forme attendue par Grist :
// signataire absent = 0 (pas null ni ""), annee vide (campagne vide) = null (pas 0 ni ""
// ni NaN), textes vides = "" (pas null ni undefined). Couvre une campagne absente (reference
// vide) et une campagne dont le texte est vide ou fait d'espaces.
test("valeurs vides : Signataire_club 0, Annee null (campagne vide), textes vides", async () => {
  for (const [nom, campagne, texte] of [["campagne absente", 0, "2031"], ["campagne vide", ID_CAMPAGNE, ""], ["campagne faite d'espaces", ID_CAMPAGNE, "   "]]) {
    const {w, appels, campagnes} = await preparer(tables({campagne}));
    campagnes.valeur = texte;
    await enregistrer(w, {signataire: 0, nouveauContact: null, representant: "", fonctionRepresentant: ""});
    const champs = appels[0][0][3];
    assert.equal(champs.Signataire_club, 0, `${nom} : Signataire_club`);
    assert.strictEqual(champs.Annee, null, `${nom} : Annee`);
    assert.strictEqual(champs.Representant_agence, "", `${nom} : Representant_agence`);
    assert.strictEqual(champs.Fonction_representant, "", `${nom} : Fonction_representant`);
    assert.equal(champs.Action, 1, `${nom} : Action`);
    assert.equal(champs.Modele, 10, `${nom} : Modele`);
  }
});

// Echoue si le modele d'une action sans modele actif n'est plus ecrit 0 (reference
// vide) : l'ecriture ne doit pas inventer d'identifiant.
test("sans modèle actif pour le dispositif : Modele vaut 0, jamais un identifiant inventé", async () => {
  const {w, appels} = await preparer(tables({modele: {Actif: false}}));
  await enregistrer(w, VALEURS);
  assert.equal(appels[0][0][3].Modele, 0);
});

// ---------------------------------------------------------------------------
// 5 : colonnes interdites
// ---------------------------------------------------------------------------

// Echoue si l'une des six colonnes interdites (PDF_genere, Date_generation, PDF_signe,
// Date_depot, DR, DD) apparait dans l'operation, a la creation comme a la mise a jour,
// ou si la mise a jour efface ces colonnes dans les donnees en memoire.
test("colonnes interdites : PDF_genere, Date_generation, PDF_signe, Date_depot, DR et DD ne sont jamais écrites", async () => {
  const ligne = {
    id: 20, Action: 1, Modele: 10, Annee: 2020, Signataire_club: 0, Representant_agence: "", Fonction_representant: "",
    PDF_genere: ["L", 41], Date_generation: 1700000000, PDF_signe: ["L"], Date_depot: null, DR: 3, DD: 4,
  };
  for (const [nom, conventions] of [["création", []], ["mise à jour", [ligne]]]) {
    const {w, appels} = await preparer(tables({conventions}));
    await enregistrer(w, VALEURS);
    const champs = appels[0][0][3];
    for (const colonne of INTERDITES) {
      assert.equal(Object.prototype.hasOwnProperty.call(champs, colonne), false, `${nom} : ${colonne} absente`);
      assert.equal(JSON.stringify(appels).includes(`"${colonne}"`), false, `${nom} : ${colonne} nulle part dans l'opération`);
    }
    assert.deepEqual(Object.keys(champs).sort(), SIX_COLONNES, `${nom} : six colonnes exactement`);
  }
  // La ligne en memoire garde ses colonnes de PDF, de dates et de formules.
  const {w} = await preparer(tables({conventions: [ligne]}));
  await enregistrer(w, VALEURS);
  const memoire = w.state.raw.Conventions[0];
  assert.deepEqual(memoire.PDF_genere, ["L", 41]);
  assert.equal(memoire.Date_generation, 1700000000);
  assert.equal(memoire.DR, 3);
  assert.equal(memoire.DD, 4);
});

// ---------------------------------------------------------------------------
// 6 : l'annee vient de la campagne de l'action (E1, jamais d'un champ de la fenetre)
// ---------------------------------------------------------------------------

// Echoue si l'annee ecrite n'est plus celle de Actions.Campagne -> Campagnes.Campagne, ou si une
// valeur d'annee glissee dans `valeurs` l'emporte sur la campagne lue.
test("année : la campagne de l'action (Campagnes.Campagne) donne Annee, même si `valeurs` en porte une autre", async () => {
  const {w, appels, campagnes} = await preparer(tables());
  campagnes.valeur = "2027";
  await enregistrer(w, {...VALEURS, annee: "1999"});
  assert.strictEqual(appels[0][0][3].Annee, 2027);
});

// Echoue si une campagne qui n'est pas une annee a quatre chiffres (« Hiver ») est ecrite
// dans Annee, ou si elle efface l'annee deja enregistree : Annee n'est alors pas ecrite du tout.
test("année : une campagne qui n'est pas une année à quatre chiffres n'écrit pas Annee et garde l'ancienne", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2020, Signataire_club: 0, Representant_agence: "", Fonction_representant: ""};
  for (const texte of ["Hiver", "26", "20266", "2026-2027"]) {
    const {w, appels, campagnes} = await preparer(tables({conventions: [{...ligne}]}));
    campagnes.valeur = texte;
    await enregistrer(w, VALEURS);
    assert.deepEqual(Object.keys(appels[0][0][3]).sort(), CINQ_COLONNES, `« ${texte} » : Annee n'est pas écrite`);
    assert.equal(w.state.raw.Conventions[0].Annee, 2020, `« ${texte} » : l'année enregistrée est gardée`);
  }
});

// Echoue si une erreur de lecture de la table Campagnes (reseau coupe) ecrase l'annee deja
// enregistree par une valeur vide, ou fait echouer l'enregistrement. C'est le point exige par
// Hanta : « jamais ecrasee par une valeur vide en cas d'erreur reseau ».
test("année : lecture de la campagne impossible (réseau) → Annee n'est pas écrite, l'ancienne reste, l'enregistrement réussit", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2020, Signataire_club: 0, Representant_agence: "", Fonction_representant: ""};
  const {w, appels, campagnes, journal} = await preparer(tables({conventions: [ligne]}));
  campagnes.illisible = true;
  const ok = await enregistrer(w, VALEURS);
  assert.equal(ok, true, "l'enregistrement réussit");
  assert.deepEqual(Object.keys(appels[0][0][3]).sort(), CINQ_COLONNES, "Annee absente de l'opération");
  assert.equal(JSON.stringify(appels).includes('"Annee"'), false, "Annee nulle part dans l'opération");
  assert.equal(w.state.raw.Conventions[0].Annee, 2020, "l'année enregistrée est gardée");
  assert.equal(journal.length, 0, "rien dans la console");
});

// Echoue si une campagne reellement vide (la reference pointe vers une ligne de Campagnes sans
// texte) n'efface plus Annee : la note dit « campagne vide : pointilles dans le PDF ».
test("année : campagne réellement vide → Annee devient vide (null) sur une ligne qui avait une année", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2020, Signataire_club: 0, Representant_agence: "", Fonction_representant: ""};
  const {w, appels, campagnes} = await preparer(tables({conventions: [ligne]}));
  campagnes.valeur = "";
  await enregistrer(w, VALEURS);
  assert.strictEqual(appels[0][0][3].Annee, null);
  assert.strictEqual(w.state.raw.Conventions[0].Annee, null);
});

// ---------------------------------------------------------------------------
// 7 : deux enregistrements de suite
// ---------------------------------------------------------------------------

// Echoue si le deuxieme enregistrement, sans rechargement, cree une deuxieme ligne
// au lieu de mettre a jour la premiere, ou si state.raw.Conventions n'est pas tenu a jour.
test("deux enregistrements de suite sur une action sans ligne : une création, puis une mise à jour de la même ligne", async () => {
  const {w, appels, campagnes} = await preparer(tables());
  await enregistrer(w, VALEURS);
  assert.deepEqual(ordinaire(w.state.raw.Conventions.map((l) => l.id)), [55], "la ligne créée est gardée en mémoire");
  assert.equal(w.state.raw.Conventions[0].Representant_agence, "Dana Exemple");

  campagnes.valeur = "2032";
  await enregistrer(w, {...VALEURS, representant: "Sam Exemple"});
  assert.equal(appels.length, 2, "deux appels");
  assert.equal(appels[0][0][0], "AddRecord");
  assert.deepEqual(ordinaire(appels[1][0].slice(0, 3)), ["UpdateRecord", "Conventions", 55]);
  assert.equal(appels.flat().filter(([type]) => type === "AddRecord").length, 1, "une seule création");
  assert.equal(w.state.raw.Conventions.length, 1, "toujours une seule ligne en mémoire");
  assert.equal(w.state.raw.Conventions[0].Annee, 2032);
  assert.equal(w.state.raw.Conventions[0].Representant_agence, "Sam Exemple");
});

// Echoue si, quand Grist ne renvoie pas l'identifiant de la ligne creee, le widget ne
// relit pas la table Conventions : le deuxieme enregistrement creerait un doublon.
test("création sans identifiant renvoyé par Grist : la table est relue, le deuxième enregistrement met à jour", async () => {
  const {w, appels} = await preparer(tables(), {retour: () => ({})});
  w.grist.docApi.fetchTable = (nom) => {
    if (nom === "Campagnes") return Promise.resolve({id: [ID_CAMPAGNE], Campagne: ["2031"]});
    assert.equal(nom, "Conventions");
    return Promise.resolve({id: [60], Action: [1], Annee: [2031], Signataire_club: [31]});
  };
  await enregistrer(w, VALEURS);
  assert.deepEqual(ordinaire(w.state.raw.Conventions.map((l) => l.id)), [60]);
  await enregistrer(w, VALEURS);
  assert.deepEqual(ordinaire(appels[1][0].slice(0, 3)), ["UpdateRecord", "Conventions", 60]);
});

// Echoue si une relecture de la table qui echoue apres une ecriture reussie est
// presentee comme un echec de l'enregistrement (l'ecriture, elle, a bien eu lieu).
test("création réussie mais relecture impossible : l'enregistrement reste une réussite", async () => {
  const {w, journal} = await preparer(tables(), {retour: () => ({})});
  w.grist.docApi.fetchTable = (nom) => (nom === "Campagnes"
    ? Promise.resolve({id: [ID_CAMPAGNE], Campagne: ["2031"]})
    : Promise.reject(new Error("Accès refusé à Conventions")));
  const ok = await enregistrer(w, VALEURS);
  assert.equal(ok, true);
  assert.deepEqual(w.state.raw.Conventions, [], "les données en mémoire restent celles d'avant");
  assert.equal(journal.length, 0, "rien dans la console");
});

// ---------------------------------------------------------------------------
// 8 : « Fermer » enregistre en silence puis ferme (D-E1-5)
// ---------------------------------------------------------------------------

// Echoue si « Fermer » n'ecrit plus dans Grist, s'il affiche un message de reussite
// (« Informations enregistrees. » n'existe plus a la fermeture), s'il laisse la fenetre ouverte,
// ou s'il n'ecrit pas ce qui est saisi (signataire, representant, fonction, annee de la campagne).
test("« Fermer » enregistre en silence ce qui est saisi, puis ferme la fenêtre (aucun message de réussite)", async () => {
  const {w, appels, element} = await preparer(tables());
  w.openConvention(1);
  const alerte = alerteDeDepart(element);
  element("clubSignataire").value = "31";
  element("agenceRepresentant").value = "  Dana Exemple ";
  element("agenceFonction").value = " Directrice adjointe  ";
  await w.fermerConvention();
  assert.equal(appels.length, 1, "un seul enregistrement");
  assert.strictEqual(appels[0][0][2], null, "création : identifiant null (pas undefined)");
  assert.deepEqual(ordinaire(appels[0][0]), ["AddRecord", "Conventions", null, CHAMPS_VALEURS]);
  assert.equal(w.state.conventionOpen, false, "la fenêtre est fermée");
  assert.equal(element("conventionModal").innerHTML, "", "la fenêtre n'est plus dans la page");
  assert.equal(alerte.classList.contains("is-hidden"), true, "aucune alerte affichée");
  assert.ok(!alerte.classList.contains("alert-success"), "pas d'alerte de succès");
});

// Echoue si « Fermer » enregistre quand rien ne le demande, ou si deux « Fermer » de suite
// (double clic) ecrivent deux fois : la fermeture en cours est protegee.
test("« Fermer » appelé deux fois de suite pendant l'enregistrement n'écrit qu'une fois", async () => {
  const {w, appels} = await preparer(tables());
  w.openConvention(1);
  await Promise.all([w.fermerConvention(), w.fermerConvention()]);
  assert.equal(appels.length, 1);
});

// Echoue si Echap n'a plus le meme effet que « Fermer » (enregistrer en silence, puis fermer).
test("Échap a le même effet que « Fermer » : enregistre en silence puis ferme", async () => {
  const {w, appels} = await preparer(tables());
  w.openConvention(1);
  let empeche = false;
  w.keepFocusInConvention({key: "Escape", preventDefault() { empeche = true; }});
  await attendre(); await attendre(); await attendre();
  assert.equal(empeche, true);
  assert.equal(appels.length, 1);
  assert.equal(w.state.conventionOpen, false);
});

// ---------------------------------------------------------------------------
// 9 : refus
// ---------------------------------------------------------------------------

// Pour une erreur Grist avec texte, une erreur sans texte, un texte seul et undefined.
// Echoue si le message d'echec change d'un mot, s'il reprend un mot de l'erreur de Grist
// (noms de personnes, droits), si l'alerte n'est pas une erreur (role alert), si quelque
// chose part dans la console, si state.raw.Conventions change, ou si la fenetre se ferme
// (la saisie serait perdue sans le dire).
test("refus ou erreur à la fermeture : message exact, aucun texte de l'erreur de Grist, fenêtre ouverte, rien dans la console", async () => {
  const erreurs = [
    new Error("[Sandbox] Access denied: Camille Exemple, camille@exemple.fr"),
    new Error(""),
    "Accès refusé à Conventions pour Camille Exemple",
    undefined,
  ];
  for (const refus of erreurs) {
    const existante = {id: 20, Action: 1, Modele: 10, Annee: 2020, Signataire_club: 32, Representant_agence: "Ancien", Fonction_representant: "Ancienne fonction"};
    const {w, element, journal} = await preparer(tables({conventions: [existante]}), {refus});
    w.openConvention(1);
    const alerte = alerteDeDepart(element);
    const avant = JSON.parse(JSON.stringify(w.state.raw.Conventions));
    const tableau = w.state.raw.Conventions;
    journal.length = 0;

    await w.fermerConvention();

    const nom = String(refus);
    assert.equal(texteAlerte(alerte), MESSAGE_ECHEC, `${nom} : message`);
    for (const secret of ["Camille", "exemple.fr", "Access denied", "Sandbox", "Accès refusé"]) {
      assert.equal(texteAlerte(alerte).includes(secret), false, `${nom} : « ${secret} » n'est pas affiché`);
    }
    assert.equal(alerte.classList.contains("alert-error"), true, `${nom} : alert-error`);
    assert.equal(alerte.classList.contains("is-hidden"), false, `${nom} : alerte visible`);
    assert.equal(alerte.getAttribute("role"), "alert", `${nom} : role`);
    assert.deepEqual(journal, [], `${nom} : rien dans la console`);
    assert.strictEqual(w.state.raw.Conventions, tableau, `${nom} : même tableau`);
    assert.deepEqual(w.state.raw.Conventions, avant, `${nom} : Conventions inchangé`);
    assert.equal(w.state.conventionOpen, true, `${nom} : la fenêtre reste ouverte`);
  }
});

// Echoue si, apres un echec d'enregistrement, un second « Fermer » ne ferme pas la fenetre sans
// ecrire (D-E1-5) : l'agent serait enferme dans la fenetre, ou une deuxieme ecriture serait tentee.
test("après un échec d'enregistrement, un second « Fermer » ferme sans enregistrer (D-E1-5)", async () => {
  const {w, appels} = await preparer(tables(), {refus: new Error("refusé")});
  w.openConvention(1);
  await w.fermerConvention();
  assert.equal(w.state.conventionOpen, true, "première tentative : la fenêtre reste ouverte");
  assert.equal(appels.length, 1);
  await w.fermerConvention();
  assert.equal(w.state.conventionOpen, false, "second Fermer : la fenêtre se ferme");
  assert.equal(appels.length, 1, "aucune seconde écriture");
});

// Echoue si, apres un refus sur une action sans ligne, le widget garde en memoire une
// ligne qui n'existe pas (le deuxieme essai ferait alors une mise a jour dans le vide).
test("refus sur une action sans ligne : rien n'est gardé en mémoire, le nouvel essai crée la ligne", async () => {
  const {w, appels} = await preparer(tables(), {refus: new Error("refusé")});
  assert.equal(await enregistrer(w, VALEURS), false);
  assert.deepEqual(w.state.raw.Conventions, []);
  await enregistrer(w, VALEURS);
  assert.equal(appels.length, 2);
  assert.equal(appels[1][0][0], "AddRecord", "le nouvel essai crée encore la ligne");
});

// ---------------------------------------------------------------------------
// 10 : reouverture
// ---------------------------------------------------------------------------

// Echoue si, a l'ouverture, signataire (et sa fonction), representant ou fonction du
// representant ne sont pas repris de la ligne existante. Le champ « Annee » n'existe plus.
test("réouverture : les champs sont préremplis depuis la ligne existante (sans champ Année)", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2029, Signataire_club: 31, Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe"};
  const {w, element} = await preparer(tables({conventions: [ligne]}));
  w.openConvention(1);
  assert.equal(element("clubSignataire").value, "31");
  assert.equal(element("clubFonction").value, "Présidente", "la fonction du signataire suit le choix");
  assert.equal(element("agenceRepresentant").value, "Dana Exemple");
  assert.equal(element("agenceFonction").value, "Directrice adjointe");
  assert.equal(element("conventionModal").innerHTML.includes('id="conventionAnnee"'), false, "pas de champ Année");
});

// Echoue si une ligne aux valeurs vides (signataire 0) prerempli un signataire, ou efface la
// fonction du representant en « undefined ».
test("réouverture avec une ligne aux valeurs vides : signataire à l'invite, textes vides", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: null, Signataire_club: 0, Representant_agence: "", Fonction_representant: ""};
  const {w, element} = await preparer(tables({conventions: [ligne]}));
  w.openConvention(1);
  assert.strictEqual(element("clubSignataire").value, "", "la liste reste à « Veuillez sélectionner »");
  assert.strictEqual(element("clubFonction").value, "");
  assert.strictEqual(element("agenceRepresentant").value, "");
  assert.strictEqual(element("agenceFonction").value, "");
});

// Echoue si, sans ligne pour l'action, la fenetre ne propose plus les valeurs par
// defaut (representant vide, fonction « Directeur d'agence », liste a l'invite non
// desactivee) ou si le prerempli ecrase les champs avec des valeurs vides.
test("réouverture sans ligne : valeurs par défaut (« Directeur d'agence », signataire à l'invite)", async () => {
  const {w, element} = await preparer(tables());
  assert.equal(w.conventionValeursEnregistrees(1, w.state), null, "aucune valeur enregistrée");
  // Valeurs de depart de la page, que le prerempli ne doit pas toucher.
  w.openConvention(1);
  const html = element("conventionModal").innerHTML;
  assert.equal(valeurHtml(html, "agenceFonction"), "Directeur d'agence");
  assert.equal(valeurHtml(html, "agenceRepresentant"), null, "représentant vide au départ");
  assert.match(html, /<option selected value="">Veuillez sélectionner<\/option>/, "l'invite n'est plus désactivée : on peut y revenir");
  assert.strictEqual(element("clubSignataire").value, "");
  assert.strictEqual(element("agenceRepresentant").value, "");
  assert.strictEqual(element("agenceFonction").value, "");
});

// Pour un contact supprime depuis (identifiant 34, absent de Contacts) et pour un
// contact d'un autre club (33). Echoue si la liste choisit ce signataire, si elle affiche
// la fonction d'un contact qui n'est pas du club, ou si le reste n'est plus prerempli.
test("réouverture avec un signataire introuvable (supprimé ou d'un autre club) : « Veuillez sélectionner », le reste est prérempli", async () => {
  for (const [nom, idContact] of [["contact supprimé", 34], ["contact d'un autre club", 33]]) {
    const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2029, Signataire_club: idContact, Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe"};
    const {w, element} = await preparer(tables({conventions: [ligne]}));
    w.openConvention(1);
    assert.strictEqual(element("clubSignataire").value, "", `${nom} : la liste reste à l'invite`);
    assert.strictEqual(element("clubFonction").value, "", `${nom} : aucune fonction affichée`);
    assert.equal(element("agenceRepresentant").value, "Dana Exemple", `${nom} : représentant`);
    assert.equal(element("agenceFonction").value, "Directrice adjointe", `${nom} : fonction du représentant`);
  }
});

// Echoue si, apres un enregistrement et sans rechargement de la fiche, la reouverture
// de la fenetre ne reprend pas ce qui vient d'etre enregistre.
test("après un enregistrement, la réouverture de la fenêtre reprend les valeurs enregistrées sans recharger", async () => {
  const {w, element} = await preparer(tables());
  w.openConvention(1);
  await enregistrer(w, VALEURS);
  w.closeConvention();
  assert.equal(w.state.conventionOpen, false);

  w.openConvention(1);
  assert.equal(element("clubSignataire").value, "31");
  assert.equal(element("clubFonction").value, "Présidente");
  assert.equal(element("agenceRepresentant").value, "Dana Exemple");
  assert.equal(element("agenceFonction").value, "Directrice adjointe");
});
