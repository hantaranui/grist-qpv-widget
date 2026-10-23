"use strict";

// Enregistrement des informations de la fenetre « Convention » (tache 5.2) :
// une seule operation applyUserActions (AddRecord ou UpdateRecord sur Conventions),
// les six colonnes ecrites et jamais les autres, valeurs vides, deux enregistrements
// de suite, message de reussite ou d'echec, et prerempli a la reouverture.
// Les textes de reference sont ceux de docs/ux/convention.md. Ils sont recopies ici
// en dur : si le code change un mot, le test doit echouer.
// Ce fichier est separe de convention-fenetre.test.js : celui-ci est deja long et son
// faux navigateur (monter) n'est pas partage. Ici les doublures de test/helpers/widget.js
// suffisent : un meme identifiant renvoie toujours le meme element, et on appelle
// openConvention, submitConvention et conventionEnregistrer directement.
// Donnees fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const MESSAGE_REUSSI = "Informations enregistrées.";
const MESSAGE_ECHEC = "Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord.";
const MESSAGE_ALERTE = "Certains champs sont à corriger.";

const SIX_COLONNES = ["Action", "Modele", "Annee", "Signataire_club", "Representant_agence", "Fonction_representant"].sort();
const INTERDITES = ["PDF_genere", "Date_generation", "PDF_signe", "Date_depot", "DR", "DD"];

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true};
const CONTACTS = [
  {id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"},
  {id: 32, Club: 7, Prenom: "Alex", Nom: "Modèle", Fonction: ""},
  {id: 33, Club: 99, Prenom: "Robin", Nom: "Voisin", Fonction: "Trésorier"},
];

function tables({conventions = [], modele = {}, contacts = CONTACTS} = {}) {
  return {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [{...MODELE, ...modele}],
    Contacts: contacts.map((c) => ({...c})),
    Conventions: conventions,
  };
}

// Ce que lireConventionForm donne au clic sur « Enregistrer les informations ».
const VALEURS = {annee: "2031", anneeIllisible: false, signataire: 31, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};
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

  const appels = [];
  w.grist.docApi.applyUserActions = (actions) => {
    appels.push(actions);
    if (refuse) return Promise.reject(options.refus);
    if (retour) return Promise.resolve(retour(actions, appels.length));
    const [type, , id] = actions[0];
    return Promise.resolve({retValues: [type === "AddRecord" ? 55 : (id ?? null)]});
  };
  const element = (id) => w.document.getElementById(id);
  return {w, journal, appels, element};
}

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
  await w.conventionEnregistrer(1, VALEURS);
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
  await w.conventionEnregistrer(1, VALEURS);
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
  const {w, appels, element} = await preparer(tables({conventions: [recente, ancienne]}));
  await w.conventionEnregistrer(1, VALEURS);
  assert.equal(appels.length, 1);
  assert.equal(appels[0].length, 1, "une seule opération");
  assert.deepEqual(ordinaire(appels[0][0]), ["UpdateRecord", "Conventions", 20, CHAMPS_VALEURS]);
  assert.equal(w.state.raw.Conventions.find((l) => l.id === 25).Annee, 2024, "la ligne la plus récente n'est pas touchée");
  assert.equal(w.state.raw.Conventions.find((l) => l.id === 20).Annee, 2031, "la ligne la plus ancienne est à jour");
  assert.ok(element, "doublure disponible");
});

// Echoue si une valeur vide n'est pas ecrite sous la forme attendue par Grist :
// signataire absent = 0 (pas null ni ""), annee vide ou absente = null (pas 0 ni ""
// ni NaN), textes vides = "" (pas null ni undefined). Couvre l'annee "" , "   " et null
// (modele sans annee).
test("valeurs vides : Signataire_club 0, Annee null, textes vides (année vide, faite d'espaces, ou modèle sans année)", async () => {
  for (const [nom, annee] of [["année vide", ""], ["année faite d'espaces", "   "], ["modèle sans année (null)", null]]) {
    const {w, appels} = await preparer(tables());
    await w.conventionEnregistrer(1, {annee, anneeIllisible: false, signataire: 0, representant: "", fonctionRepresentant: ""});
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
  await w.conventionEnregistrer(1, VALEURS);
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
    await w.conventionEnregistrer(1, VALEURS);
    const champs = appels[0][0][3];
    for (const colonne of INTERDITES) {
      assert.equal(Object.prototype.hasOwnProperty.call(champs, colonne), false, `${nom} : ${colonne} absente`);
      assert.equal(JSON.stringify(appels).includes(`"${colonne}"`), false, `${nom} : ${colonne} nulle part dans l'opération`);
    }
    assert.deepEqual(Object.keys(champs).sort(), SIX_COLONNES, `${nom} : six colonnes exactement`);
  }
  // La ligne en memoire garde ses colonnes de PDF, de dates et de formules.
  const {w} = await preparer(tables({conventions: [ligne]}));
  await w.conventionEnregistrer(1, VALEURS);
  const memoire = w.state.raw.Conventions[0];
  assert.deepEqual(memoire.PDF_genere, ["L", 41]);
  assert.equal(memoire.Date_generation, 1700000000);
  assert.equal(memoire.DR, 3);
  assert.equal(memoire.DD, 4);
});

// ---------------------------------------------------------------------------
// 6 : deux enregistrements de suite
// ---------------------------------------------------------------------------

// Echoue si le deuxieme enregistrement, sans rechargement, cree une deuxieme ligne
// au lieu de mettre a jour la premiere, ou si state.raw.Conventions n'est pas tenu a jour.
test("deux enregistrements de suite sur une action sans ligne : une création, puis une mise à jour de la même ligne", async () => {
  const {w, appels} = await preparer(tables());
  await w.conventionEnregistrer(1, VALEURS);
  assert.deepEqual(ordinaire(w.state.raw.Conventions.map((l) => l.id)), [55], "la ligne créée est gardée en mémoire");
  assert.equal(w.state.raw.Conventions[0].Representant_agence, "Dana Exemple");

  await w.conventionEnregistrer(1, {...VALEURS, annee: "2032", representant: "Sam Exemple"});
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
    assert.equal(nom, "Conventions");
    return Promise.resolve({id: [60], Action: [1], Annee: [2031], Signataire_club: [31]});
  };
  await w.conventionEnregistrer(1, VALEURS);
  assert.deepEqual(ordinaire(w.state.raw.Conventions.map((l) => l.id)), [60]);
  await w.conventionEnregistrer(1, VALEURS);
  assert.deepEqual(ordinaire(appels[1][0].slice(0, 3)), ["UpdateRecord", "Conventions", 60]);
});

// Echoue si une relecture de la table qui echoue apres une ecriture reussie est
// presentee comme un echec de l'enregistrement (l'ecriture, elle, a bien eu lieu).
test("création réussie mais relecture impossible : le message reste celui de la réussite", async () => {
  const {w, element, journal} = await preparer(tables(), {retour: () => ({})});
  w.grist.docApi.fetchTable = () => Promise.reject(new Error("Accès refusé à Conventions"));
  const alerte = alerteDeDepart(element);
  await w.conventionEnregistrer(1, VALEURS);
  assert.equal(texteAlerte(alerte), MESSAGE_REUSSI);
  assert.equal(alerte.classList.contains("alert-success"), true);
  assert.deepEqual(w.state.raw.Conventions, [], "les données en mémoire restent celles d'avant");
  assert.equal(journal.length, 0, "rien dans la console");
});

// ---------------------------------------------------------------------------
// 7 : reussite
// ---------------------------------------------------------------------------

// Echoue si le message de reussite change d'un mot, si l'alerte garde le style d'erreur
// (alert-error) ou son role "alert", reste cachee, si le bouton reste grise, ou si la
// fenetre se ferme apres l'enregistrement.
test("réussite : « Informations enregistrées. » dans une alerte de succès (role=status), la fenêtre reste ouverte", async () => {
  const {w, element} = await preparer(tables());
  w.openConvention(1);
  const alerte = alerteDeDepart(element);
  await w.conventionEnregistrer(1, VALEURS);

  assert.equal(texteAlerte(alerte), MESSAGE_REUSSI);
  assert.equal(alerte.classList.contains("alert-success"), true, "alert-success");
  assert.equal(alerte.classList.contains("alert-error"), false, "plus alert-error");
  assert.equal(alerte.classList.contains("is-hidden"), false, "alerte visible");
  assert.equal(alerte.getAttribute("role"), "status");
  assert.equal(alerte.getAttribute("aria-live"), "polite");
  assert.equal(w.state.conventionOpen, true, "la fenêtre est toujours ouverte");
  assert.ok(element("conventionModal").innerHTML.includes('id="conventionDialog"'), "la fenêtre est toujours dans la page");
  assert.equal(element("conventionEnregistrer").disabled, false, "le bouton est de nouveau utilisable");
});

// ---------------------------------------------------------------------------
// 8 : refus
// ---------------------------------------------------------------------------

// Pour une erreur Grist avec texte, une erreur sans texte, un texte seul et undefined.
// Echoue si le message d'echec change d'un mot, s'il reprend un mot de l'erreur de Grist
// (noms de personnes, droits), si l'alerte n'est pas une erreur (role alert), si quelque
// chose part dans la console, ou si state.raw.Conventions change.
test("refus ou erreur : message exact, aucun texte de l'erreur de Grist, rien dans la console, données inchangées", async () => {
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
    alerte.classList.remove("alert-error");
    alerte.classList.add("alert-success");
    alerte.setAttribute("role", "status");
    const avant = JSON.parse(JSON.stringify(w.state.raw.Conventions));
    const tableau = w.state.raw.Conventions;
    journal.length = 0;

    await w.conventionEnregistrer(1, VALEURS);

    const nom = String(refus);
    assert.equal(texteAlerte(alerte), MESSAGE_ECHEC, `${nom} : message`);
    for (const secret of ["Camille", "exemple.fr", "Access denied", "Sandbox", "Accès refusé"]) {
      assert.equal(texteAlerte(alerte).includes(secret), false, `${nom} : « ${secret} » n'est pas affiché`);
    }
    assert.equal(alerte.classList.contains("alert-error"), true, `${nom} : alert-error`);
    assert.equal(alerte.classList.contains("alert-success"), false, `${nom} : plus alert-success`);
    assert.equal(alerte.classList.contains("is-hidden"), false, `${nom} : alerte visible`);
    assert.equal(alerte.getAttribute("role"), "alert", `${nom} : role`);
    assert.deepEqual(journal, [], `${nom} : rien dans la console`);
    assert.strictEqual(w.state.raw.Conventions, tableau, `${nom} : même tableau`);
    assert.deepEqual(w.state.raw.Conventions, avant, `${nom} : Conventions inchangé`);
    assert.equal(w.state.conventionOpen, true, `${nom} : la fenêtre reste ouverte`);
    assert.equal(element("conventionEnregistrer").disabled, false, `${nom} : bouton de nouveau utilisable`);
  }
});

// Echoue si, apres un refus sur une action sans ligne, le widget garde en memoire une
// ligne qui n'existe pas (le deuxieme essai ferait alors une mise a jour dans le vide).
test("refus sur une action sans ligne : rien n'est gardé en mémoire, le nouvel essai crée la ligne", async () => {
  const {w, appels} = await preparer(tables(), {refus: new Error("refusé")});
  await w.conventionEnregistrer(1, VALEURS);
  assert.deepEqual(w.state.raw.Conventions, []);
  await w.conventionEnregistrer(1, VALEURS);
  assert.equal(appels.length, 2);
  assert.equal(appels[1][0][0], "AddRecord", "le nouvel essai crée encore la ligne");
});

// ---------------------------------------------------------------------------
// 9 : style de l'alerte apres une erreur d'annee, une reussite, puis une erreur
// ---------------------------------------------------------------------------

// Echoue si, apres une reussite (alerte de succes, role status), une annee redevenue
// invalide au clic suivant ne remet pas l'alerte en erreur : alert-error present,
// alert-success absent, role alert, aria-live assertive, texte « Certains champs… ».
test("après une erreur d'année puis une réussite, l'alerte retrouve son style d'erreur si l'année redevient invalide", async () => {
  const {w, appels, element} = await preparer(tables());
  w.openConvention(1);
  const alerte = alerteDeDepart(element);
  const annee = element("conventionAnnee");
  const clic = async (valeur) => {
    annee.value = valeur;
    w.submitConvention({preventDefault() {}}, 1);
    await attendre();
  };

  await clic("26");
  assert.equal(texteAlerte(alerte), MESSAGE_ALERTE, "1. texte de l'erreur");
  assert.equal(alerte.classList.contains("alert-error"), true, "1. alert-error");
  assert.equal(alerte.classList.contains("is-hidden"), false, "1. visible");
  assert.equal(annee.classList.contains("is-invalid"), true, "1. champ en erreur");
  assert.equal(appels.length, 0, "1. rien d'enregistré");

  await clic("2026");
  assert.equal(texteAlerte(alerte), MESSAGE_REUSSI, "2. texte de la réussite");
  assert.equal(alerte.classList.contains("alert-success"), true, "2. alert-success");
  assert.equal(alerte.getAttribute("role"), "status", "2. role status");
  assert.equal(annee.classList.contains("is-invalid"), false, "2. champ sans erreur");
  assert.equal(appels.length, 1, "2. un enregistrement");

  await clic("26");
  assert.equal(texteAlerte(alerte), MESSAGE_ALERTE, "3. texte de l'erreur");
  assert.equal(alerte.classList.contains("alert-error"), true, "3. alert-error revenu");
  assert.equal(alerte.classList.contains("alert-success"), false, "3. alert-success retiré");
  assert.equal(alerte.getAttribute("role"), "alert", "3. role alert");
  assert.equal(alerte.getAttribute("aria-live"), "assertive", "3. aria-live assertive");
  assert.equal(alerte.classList.contains("is-hidden"), false, "3. visible");
  assert.equal(annee.classList.contains("is-invalid"), true, "3. champ en erreur");
  assert.equal(appels.length, 1, "3. rien de plus d'enregistré");
});

// Echoue si le clic sur « Enregistrer » ne passe plus par le controle de l'annee puis
// par l'enregistrement (la fenetre doit ecrire dans Grist une fois l'annee valide).
test("le clic sur « Enregistrer » avec une année valide écrit dans Grist, avec les valeurs de la fenêtre", async () => {
  const {w, appels, element} = await preparer(tables());
  w.openConvention(1);
  element("conventionAnnee").value = "2031";
  element("clubSignataire").value = "31";
  element("agenceRepresentant").value = "  Dana Exemple ";
  element("agenceFonction").value = " Directrice adjointe  ";
  w.submitConvention({preventDefault() {}}, 1);
  await attendre();
  assert.equal(appels.length, 1);
  assert.strictEqual(appels[0][0][2], null, "création : identifiant null (pas undefined)");
  assert.deepEqual(ordinaire(appels[0][0]), ["AddRecord", "Conventions", null, CHAMPS_VALEURS]);
});

// ---------------------------------------------------------------------------
// 10 : reouverture
// ---------------------------------------------------------------------------

// Echoue si, a l'ouverture, annee, signataire (et sa fonction), representant ou fonction
// du representant ne sont pas repris de la ligne existante.
test("réouverture : les champs sont préremplis depuis la ligne existante", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: 2029, Signataire_club: 31, Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe"};
  const {w, element} = await preparer(tables({conventions: [ligne]}));
  w.openConvention(1);
  assert.equal(element("conventionAnnee").value, "2029");
  assert.equal(element("clubSignataire").value, "31");
  assert.equal(element("clubFonction").value, "Présidente", "la fonction du signataire suit le choix");
  assert.equal(element("agenceRepresentant").value, "Dana Exemple");
  assert.equal(element("agenceFonction").value, "Directrice adjointe");
});

// Echoue si une ligne aux valeurs vides (annee null, signataire 0) prerempli une annee
// "0" ou "null", choisit un signataire, ou efface la fonction du representant en "undefined".
test("réouverture avec une ligne aux valeurs vides : année vide, signataire à l'invite, textes vides", async () => {
  const ligne = {id: 20, Action: 1, Modele: 10, Annee: null, Signataire_club: 0, Representant_agence: "", Fonction_representant: ""};
  const {w, element} = await preparer(tables({conventions: [ligne]}));
  w.openConvention(1);
  assert.strictEqual(element("conventionAnnee").value, "");
  assert.strictEqual(element("clubSignataire").value, "", "la liste reste à « Veuillez sélectionner »");
  assert.strictEqual(element("clubFonction").value, "");
  assert.strictEqual(element("agenceRepresentant").value, "");
  assert.strictEqual(element("agenceFonction").value, "");
});

// Echoue si, sans ligne pour l'action, la fenetre ne propose plus les valeurs par
// defaut (annee en cours, representant vide, fonction « Directeur d'agence », liste a
// l'invite) ou si le prerempli ecrase les champs avec des valeurs vides.
test("réouverture sans ligne : valeurs par défaut (année en cours, « Directeur d'agence », signataire à l'invite)", async () => {
  const {w, element} = await preparer(tables());
  assert.equal(w.conventionValeursEnregistrees(1, w.state), null, "aucune valeur enregistrée");
  // Valeurs de depart de la page, que le prerempli ne doit pas toucher.
  w.openConvention(1);
  const html = element("conventionModal").innerHTML;
  assert.equal(valeurHtml(html, "conventionAnnee"), String(new Date().getFullYear()));
  assert.equal(valeurHtml(html, "agenceFonction"), "Directeur d'agence");
  assert.equal(valeurHtml(html, "agenceRepresentant"), null, "représentant vide au départ");
  assert.match(html, /<option selected disabled value="">Veuillez sélectionner<\/option>/);
  assert.strictEqual(element("conventionAnnee").value, "", "le prérempli n'a rien posé");
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
    assert.equal(element("conventionAnnee").value, "2029", `${nom} : année`);
    assert.equal(element("agenceRepresentant").value, "Dana Exemple", `${nom} : représentant`);
    assert.equal(element("agenceFonction").value, "Directrice adjointe", `${nom} : fonction du représentant`);
  }
});

// Echoue si, apres un enregistrement et sans rechargement de la fiche, la reouverture
// de la fenetre ne reprend pas ce qui vient d'etre enregistre.
test("après un enregistrement, la réouverture de la fenêtre reprend les valeurs enregistrées sans recharger", async () => {
  const {w, element} = await preparer(tables());
  w.openConvention(1);
  await w.conventionEnregistrer(1, VALEURS);
  w.closeConvention();
  assert.equal(w.state.conventionOpen, false);

  w.openConvention(1);
  assert.equal(element("conventionAnnee").value, "2031");
  assert.equal(element("clubSignataire").value, "31");
  assert.equal(element("clubFonction").value, "Présidente");
  assert.equal(element("agenceRepresentant").value, "Dana Exemple");
  assert.equal(element("agenceFonction").value, "Directrice adjointe");
});
