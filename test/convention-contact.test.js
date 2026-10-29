"use strict";

// Evolution 1 : creation d'un contact depuis la fenetre « Convention » (bouton « Ajouter un
// contact », docs/ux/convention.md, §3 « Ce qui est ecrit a la fermeture et a la generation »,
// « Ordre technique pour dev-backend », « Cas d'echec : Nom rempli, E-mail vide », D-E1-3,
// D-E1-7, D-E1-13, D-E1-14, D-E1-17).
//  - conventionProblemeNouveauContact : le seul controle de champ qui reste (fonction pure) ;
//  - conventionEnregistrer avec un nouveau contact : creation dans Contacts en UNE operation avec
//    toutes les valeurs (club compris), attendue AVANT l'ecriture dans Conventions, identifiant
//    recu, contact garde en memoire ; Nom vide : rien n'est cree ; echec : rien d'autre n'est ecrit ;
//    un contact n'est cree qu'une seule fois pour une meme saisie.
// L'ecran (bouton, formulaire, message sous E-mail) est dans convention-fenetre.test.js et
// convention-generer-ecran.test.js ; le delai de 20 s est dans convention-delais.test.js.
// Les textes de reference sont ceux de la note, recopies en dur. Donnees fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const EMAIL_VIDE = "Saisissez l'e-mail du nouveau signataire.";
const EMAIL_MAL_FORME = "Saisissez une adresse e-mail valide, par exemple nom@exemple.fr.";
const MESSAGE_ECHEC = "Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord.";

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true};
const CONTACTS = [{id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente", Email: "camille@exemple.fr"}];
const ID_CONTACT_CREE = 77;
const ID_CONVENTION = 9;

const NOUVEAU = {nom: "Martin", prenom: "Jo", email: "jo.martin@exemple.fr", fonction: "Trésorier"};
const valeurs = (reste = {}) => ({signataire: 0, nouveauContact: {...NOUVEAU}, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe", ...reste});

const attendre = () => new Promise((resolve) => setImmediate(resolve));
const ordinaire = (valeur) => JSON.parse(JSON.stringify(valeur));

// Charge le widget et pose le jeu d'essai. L'action n'a pas de campagne : aucune lecture de la table
// Campagnes (ce n'est pas l'objet de ce fichier).
// `reponse(table, type)` fixe ce que Grist repond ; par defaut un AddRecord de Contacts rend 77 et
// celui de Conventions rend 9. `journal` : tout ce que le widget ecrit dans la console.
// `ecritures` : [{table, type, champs, ordre}], dans l'ordre ; `enCours` : ce qui a commence et pas fini.
async function preparer({reponse, conventions = []} = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [{...MODELE}],
    Contacts: CONTACTS.map((c) => ({...c})),
    Conventions: conventions,
  };
  w.state.tablesRefusees = [];
  journal.length = 0;

  const ecritures = [];
  const termines = [];
  w.grist.docApi.applyUserActions = (actions) => {
    const [type, table, id, champs] = actions[0];
    const ecriture = {table, type, id, champs: ordinaire(champs), operations: actions.length, ordre: ecritures.length, termine: false};
    ecritures.push(ecriture);
    const retour = reponse ? reponse(table, type, ecriture) : undefined;
    const suite = retour !== undefined ? retour : Promise.resolve({retValues: [type === "AddRecord" ? (table === "Contacts" ? ID_CONTACT_CREE : ID_CONVENTION) : (id ?? null)]});
    return suite.then((valeur) => { ecriture.termine = true; termines.push(table); return valeur; }, (erreur) => { ecriture.termine = true; throw erreur; });
  };
  return {w, journal, ecritures, termines};
}

const enregistrer = (w, v) => w.conventionEnregistrer(1, v, {silencieux: true});
const dans = (ecritures, table) => ecritures.filter((e) => e.table === table);

// ---------------------------------------------------------------------------
// 1. Le seul controle de champ qui reste : Nom rempli => e-mail valide
// ---------------------------------------------------------------------------

// Echoue si le message d'e-mail vide ou mal forme change d'un mot, si le controle s'applique sans
// Nom (Prenom, E-mail ou Fonction seuls ne creent rien et n'affichent rien), si un Nom fait
// d'espaces compte comme rempli, si une adresse bien formee est refusee, ou si une adresse sans
// arobase / avec espace / sans partie locale ou sans domaine est acceptee (meme regle que le
// widget clubs : /^[^\s@]+@[^\s@]+$/).
test("conventionProblemeNouveauContact : Nom rempli → e-mail vide ou mal formé refusé avec le message exact ; sans Nom, jamais d'erreur", async () => {
  const {w} = await preparer();
  const probleme = (contact) => w.conventionProblemeNouveauContact({nouveauContact: contact});
  assert.equal(probleme(null), "", "pas de saisie libre");
  assert.equal(probleme({nom: "", prenom: "Jo", email: "pas-un-email", fonction: "x"}), "", "sans Nom : aucune erreur, même avec un e-mail mal formé");
  assert.equal(probleme({nom: "   ", prenom: "", email: "", fonction: ""}), "", "un Nom fait d'espaces est vide");
  assert.equal(probleme({nom: "Martin", prenom: "", email: "", fonction: ""}), EMAIL_VIDE, "e-mail vide");
  assert.equal(probleme({nom: "Martin", prenom: "", email: "   ", fonction: ""}), EMAIL_VIDE, "e-mail fait d'espaces");
  assert.equal(probleme({nom: "Martin", prenom: "", email: undefined, fonction: ""}), EMAIL_VIDE, "e-mail absent");
  for (const mauvais of ["sans-arobase", "a b@exemple.fr", "@exemple.fr", "jo@", "jo@@exemple.fr"]) {
    assert.equal(probleme({nom: "Martin", prenom: "", email: mauvais, fonction: ""}), EMAIL_MAL_FORME, `« ${mauvais} » est refusé`);
  }
  for (const bon of ["jo.martin@exemple.fr", " jo@exemple.fr ", "j+tag@sous.domaine.exemple.fr"]) {
    assert.equal(probleme({nom: "Martin", prenom: "", email: bon, fonction: ""}), "", `« ${bon} » est accepté`);
  }
  assert.equal(w.conventionProblemeNouveauContact({}), "", "valeurs sans nouveauContact");
});

// ---------------------------------------------------------------------------
// 2. Creation du contact : une operation, toutes les valeurs, avant Conventions
// ---------------------------------------------------------------------------

// Echoue si la creation fait plus d'une operation ou d'un appel, n'est pas un AddRecord sur Contacts
// sans identifiant, si les colonnes ne sont pas exactement Club, Nom, Prenom, Email, Fonction
// (la regle d'acces refuse une ligne sans club ; DR et DD sont des formules, Telephone n'est pas
// demande), si les textes gardent des espaces autour, ou si le club n'est pas celui de l'action.
test("création du contact : un seul AddRecord sur Contacts avec Club, Nom, Prenom, Email, Fonction — rien d'autre", async () => {
  const {w, ecritures} = await preparer();
  const ok = await enregistrer(w, valeurs({nouveauContact: {nom: " Martin ", prenom: " Jo ", email: " jo.martin@exemple.fr ", fonction: " Trésorier "}}));
  assert.equal(ok, true);
  const contacts = dans(ecritures, "Contacts");
  assert.equal(contacts.length, 1, "un seul appel pour le contact");
  assert.equal(contacts[0].operations, 1, "une seule opération dans cet appel");
  assert.equal(contacts[0].type, "AddRecord");
  assert.strictEqual(contacts[0].id, null, "création : identifiant null");
  assert.deepEqual(Object.keys(contacts[0].champs).sort(), ["Club", "Email", "Fonction", "Nom", "Prenom"]);
  assert.deepEqual(contacts[0].champs, {Club: 7, Nom: "Martin", Prenom: "Jo", Email: "jo.martin@exemple.fr", Fonction: "Trésorier"});
  assert.ok(!JSON.stringify(ecritures).includes("Telephone"), "pas de Téléphone");
  assert.equal(JSON.stringify(contacts).includes('"DR"') || JSON.stringify(contacts).includes('"DD"'), false, "DR et DD ne sont jamais écrits");
});

// Echoue si l'ecriture dans Conventions part avant que la creation du contact soit terminee et que
// son identifiant soit recu (« Aucune ecriture ne doit referencer un contact qui n'existe pas
// encore »), ou si Signataire_club ne pointe pas vers l'identifiant recu (77, pas 0 ni l'ancien choix).
test("ordre : le contact est créé et son identifiant reçu AVANT l'écriture dans Conventions, qui le référence", async () => {
  let liberer;
  const {w, ecritures} = await preparer({
    reponse: (table) => (table === "Contacts" ? new Promise((resolve) => { liberer = () => resolve({retValues: [ID_CONTACT_CREE]}); }) : undefined),
  });
  const enCours = enregistrer(w, valeurs());
  await attendre(); await attendre(); await attendre();
  assert.equal(ecritures.length, 1, "seule la création du contact est partie");
  assert.equal(ecritures[0].table, "Contacts");
  assert.equal(dans(ecritures, "Conventions").length, 0, "Conventions attend la réponse de Contacts");
  liberer();
  assert.equal(await enCours, true);
  assert.deepEqual(ecritures.map((e) => e.table), ["Contacts", "Conventions"], "Contacts d'abord, Conventions ensuite");
  assert.equal(ecritures[1].champs.Signataire_club, ID_CONTACT_CREE, "Conventions référence le contact créé");
  assert.equal(ecritures[1].champs.Representant_agence, "Dana Exemple");
  assert.equal(ecritures[1].champs.Fonction_representant, "Directrice adjointe");
});

// Echoue si le contact cree ne rejoint pas la liste des contacts du club (state.raw.Contacts, d'ou
// conventionContacts le lit pour la liste et pour le PDF), si les valeurs de l'appelant ne sont pas
// mises a jour (signataire = contact cree, nouveauContact = null : la generation voit le meme
// signataire), ou si le signataire choisi avant dans la liste n'est pas remplace par le contact cree.
test("après la création : le contact est dans la liste du club et les valeurs pointent vers lui", async () => {
  const {w} = await preparer();
  const v = valeurs({signataire: 31});
  await enregistrer(w, v);
  assert.equal(v.signataire, ID_CONTACT_CREE, "signataire = identifiant du contact créé (le choix 31 est remplacé)");
  assert.equal(v.nouveauContact, null, "plus de saisie libre en attente");
  const contacts = w.conventionContacts(1, w.state);
  const cree = contacts.find((c) => c.id === ID_CONTACT_CREE);
  assert.ok(cree, "le contact apparaît parmi les contacts du club");
  assert.equal(cree.libelle, "Jo Martin");
  assert.equal(cree.fonction, "Trésorier");
  assert.equal(w.state.raw.Contacts.find((c) => c.id === ID_CONTACT_CREE).Club, 7, "rattaché au club de l'action");
});

// ---------------------------------------------------------------------------
// 3. Nom vide : rien n'est cree
// ---------------------------------------------------------------------------

// Echoue si une ecriture dans Contacts part alors que le Nom est vide (Prenom, E-mail, Fonction
// remplis ou non), ou si Signataire_club ne garde pas le contact choisi dans la liste.
test("Nom vide : aucun contact créé, Signataire_club garde le contact de la liste", async () => {
  const {w, ecritures} = await preparer();
  // Dans lireConventionForm, nouveauContact vaut null tant que le Nom est vide.
  await enregistrer(w, valeurs({signataire: 31, nouveauContact: null}));
  assert.equal(dans(ecritures, "Contacts").length, 0, "aucun contact créé");
  assert.equal(dans(ecritures, "Conventions").length, 1);
  assert.equal(ecritures[0].champs.Signataire_club, 31);

  // Meme avec un nouveauContact dont le Nom est fait d'espaces : rien n'est cree.
  const autre = await preparer();
  await enregistrer(autre.w, valeurs({signataire: 31, nouveauContact: {nom: "  ", prenom: "Jo", email: "jo@exemple.fr", fonction: "x"}}));
  assert.equal(dans(autre.ecritures, "Contacts").length, 0, "Nom fait d'espaces : rien créé");
});

// Echoue si un signataire vide (rien choisi, rien saisi) n'est pas ecrit 0 : le PDF aura des pointilles.
test("ni liste ni saisie : aucun contact créé et Signataire_club vaut 0", async () => {
  const {w, ecritures} = await preparer();
  await enregistrer(w, valeurs({signataire: 0, nouveauContact: null}));
  assert.equal(dans(ecritures, "Contacts").length, 0);
  assert.equal(ecritures[0].champs.Signataire_club, 0);
});

// ---------------------------------------------------------------------------
// 4. Echecs : rien d'autre n'est enregistre
// ---------------------------------------------------------------------------

// Echoue si, quand Grist refuse la creation du contact, une ecriture dans Conventions part quand meme,
// si l'enregistrement est tenu pour reussi, si un contact fantome reste en memoire, ou si le nom ou
// l'e-mail de la personne ou le texte de l'erreur de Grist part dans la console.
test("création refusée : rien n'est écrit dans Conventions, rien en mémoire, rien dans la console", async () => {
  const {w, ecritures, journal} = await preparer({reponse: (table) => (table === "Contacts" ? Promise.reject(new Error("[Sandbox] Access denied: Jo Martin jo.martin@exemple.fr")) : undefined)});
  const avant = ordinaire(w.state.raw.Contacts);
  const ok = await enregistrer(w, valeurs());
  assert.equal(ok, false, "l'enregistrement échoue");
  assert.deepEqual(ecritures.map((e) => e.table), ["Contacts"], "aucune écriture dans Conventions");
  assert.deepEqual(ordinaire(w.state.raw.Contacts), avant, "aucun contact gardé en mémoire");
  assert.deepEqual(journal, [], "rien dans la console");
});

// Echoue si une reponse de Grist sans identifiant exploitable (absent, 0, negatif, texte) est
// acceptee : Conventions referencerait un contact qu'on ne connait pas.
test("création sans identifiant exploitable dans la réponse : échec, rien n'est écrit dans Conventions", async () => {
  for (const [nom, retour] of [["sans retValues", {}], ["retValues vide", {retValues: []}], ["identifiant 0", {retValues: [0]}], ["identifiant négatif", {retValues: [-3]}], ["identifiant texte", {retValues: ["abc"]}], ["null", {retValues: [null]}]]) {
    const {w, ecritures} = await preparer({reponse: (table) => (table === "Contacts" ? Promise.resolve(retour) : undefined)});
    const ok = await enregistrer(w, valeurs());
    assert.equal(ok, false, `${nom} : échec`);
    assert.deepEqual(ecritures.map((e) => e.table), ["Contacts"], `${nom} : Conventions n'est pas écrite`);
    assert.equal(w.state.raw.Contacts.length, CONTACTS.length, `${nom} : aucun contact gardé`);
  }
});

// Echoue si une action sans club permet de creer un contact (la regle d'acces refuse une ligne sans
// club : le widget ne doit meme pas essayer) ou si le contact est cree sans Club.
test("action sans club : le contact n'est pas créé (jamais une ligne sans club)", async () => {
  const {w, ecritures} = await preparer();
  w.state.raw.Actions[0].Club = 0;
  const ok = await enregistrer(w, valeurs());
  assert.equal(ok, false);
  assert.equal(ecritures.length, 0, "aucune écriture");
});

// Echoue si un Nom rempli avec un e-mail vide ou mal forme est ecrit (securite : l'ecran a deja affiche
// le message, mais l'enregistrement ne doit jamais creer un contact que Grist refuserait).
test("sécurité : Nom rempli avec un e-mail vide ou mal formé → rien n'est écrit, l'enregistrement renvoie faux", async () => {
  for (const email of ["", "pas-un-email"]) {
    const {w, ecritures} = await preparer();
    const ok = await enregistrer(w, valeurs({nouveauContact: {...NOUVEAU, email}}));
    assert.equal(ok, false, `« ${email} »`);
    assert.equal(ecritures.length, 0, `« ${email} » : ni Contacts ni Conventions`);
  }
});

// ---------------------------------------------------------------------------
// 5. Un contact n'est cree qu'une seule fois pour une meme saisie
// ---------------------------------------------------------------------------

// Echoue si, apres une creation reussie suivie d'un echec dans Conventions, un nouvel essai avec la
// meme saisie cree un SECOND contact (doublon) au lieu de reutiliser le premier.
test("étape Conventions en échec après la création : l'essai suivant avec la même saisie ne recrée pas le contact", async () => {
  let refuser = true;
  const {w, ecritures} = await preparer({reponse: (table) => (table === "Conventions" && refuser ? Promise.reject(new Error("refusé")) : undefined)});
  assert.equal(await enregistrer(w, valeurs()), false, "premier essai : Conventions refusée");
  assert.equal(dans(ecritures, "Contacts").length, 1, "le contact a été créé une fois");
  assert.ok(w.state.raw.Contacts.some((c) => c.id === ID_CONTACT_CREE), "il existe en mémoire");

  refuser = false;
  assert.equal(await enregistrer(w, valeurs()), true, "second essai, même saisie : réussi");
  assert.equal(dans(ecritures, "Contacts").length, 1, "toujours un seul contact créé");
  const derniere = dans(ecritures, "Conventions").pop();
  assert.equal(derniere.champs.Signataire_club, ID_CONTACT_CREE, "Conventions référence le contact déjà créé");
});

// Echoue si une saisie DIFFERENTE (un autre Nom) reutilise le contact precedent au lieu d'en creer un.
test("une saisie différente crée un autre contact", async () => {
  const {w, ecritures} = await preparer({reponse: (table, type, e) => (table === "Contacts" ? Promise.resolve({retValues: [100 + e.ordre]}) : undefined)});
  await enregistrer(w, valeurs());
  await enregistrer(w, valeurs({nouveauContact: {...NOUVEAU, nom: "Dupont"}}));
  assert.equal(dans(ecritures, "Contacts").length, 2, "deux contacts créés");
});

// Echoue si l'ouverture de la fenetre n'oublie pas le dernier contact cree : un contact cree dans
// une ouverture precedente serait reutilise pour une saisie identique dans une nouvelle ouverture.
test("rouvrir la fenêtre oublie le dernier contact créé (une saisie identique en crée un nouveau)", async () => {
  const {w, ecritures} = await preparer({reponse: (table, type, e) => (table === "Contacts" ? Promise.resolve({retValues: [100 + e.ordre]}) : undefined)});
  w.window.addEventListener = () => {};
  w.window.removeEventListener = () => {};
  await enregistrer(w, valeurs());
  w.openConvention(1);
  await enregistrer(w, valeurs());
  assert.equal(dans(ecritures, "Contacts").length, 2, "la mémoire du dernier contact est remise à zéro à l'ouverture");
});

// ---------------------------------------------------------------------------
// 6. Fermeture : message et fenetre selon le resultat
// ---------------------------------------------------------------------------

// Pour « Fermer » avec un nouveau contact. Echoue si la fenetre ne se ferme pas apres une creation
// reussie, si elle se ferme malgre un refus de Grist, si le message d'echec n'est pas le message
// habituel (« Les informations n'ont pas pu être enregistrées… », sans message propre au contact et
// sans nom de personne), ou si elle contient le nom ou l'e-mail saisis.
test("« Fermer » avec un nouveau contact : réussite → fenêtre fermée et contact créé ; refus → fenêtre ouverte et message habituel", async () => {
  const reussite = await preparer();
  reussite.w.window.addEventListener = () => {};
  reussite.w.window.removeEventListener = () => {};
  reussite.w.openConvention(1);
  reussite.w.document.getElementById("signataireNom").value = "Martin";
  reussite.w.document.getElementById("signataireEmail").value = "jo.martin@exemple.fr";
  await reussite.w.fermerConvention();
  assert.equal(reussite.w.state.conventionOpen, false, "fenêtre fermée");
  assert.equal(dans(reussite.ecritures, "Contacts").length, 1, "contact créé");

  const refus = await preparer({reponse: (table) => (table === "Contacts" ? Promise.reject(new Error("Jo Martin refusé")) : undefined)});
  refus.w.window.addEventListener = () => {};
  refus.w.window.removeEventListener = () => {};
  refus.w.openConvention(1);
  refus.w.document.getElementById("signataireNom").value = "Martin";
  refus.w.document.getElementById("signataireEmail").value = "jo.martin@exemple.fr";
  await refus.w.fermerConvention();
  assert.equal(refus.w.state.conventionOpen, true, "fenêtre toujours ouverte");
  const alerte = refus.w.document.getElementById("conventionMessage");
  assert.equal(alerte.querySelector(".alert-content").textContent, MESSAGE_ECHEC);
  assert.deepEqual(refus.ecritures.map((e) => e.table), ["Contacts"], "rien d'autre n'est écrit");
  assert.deepEqual(refus.journal, [], "rien dans la console");
});
