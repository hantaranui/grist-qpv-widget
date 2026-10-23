"use strict";

// Tests de la partie « donnees » de la gestion des contacts du widget clubs
// (sans ecran) : controle de la saisie, ecritures dans Contacts, classement des
// erreurs, discretion de la console. Regles : docs/ux/contacts-fiche-club.md (§8)
// et CLAUDE.md, section « Le widget clubs ». Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadClubs} = require("./helpers/clubs");

// Les objets crees dans le bac a sable ont leurs propres prototypes : on les
// ramene a des valeurs simples avant de les comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

const CINQ_CHAMPS = ["Email", "Fonction", "Nom", "Prenom", "Telephone"];

const SAISIE = {
  Nom: "Dupontel",
  Prenom: "Lucie",
  Email: "lucie.dupontel@exemple.fr",
  Telephone: "01 02 03 04 05",
  Fonction: "Presidente",
};

// Club 7 ouvert ; contact 1 est a lui, contact 2 est a un autre club (99).
// Le helper enregistre les actions envoyees dans w.calls.userActions ; une
// ecriture peut etre remplacee par un echec grace a `echec`.
//
// Le helper remplace tout docApi quand on lui donne overrides.grist.docApi : il
// faut donc y remettre fetchTable et getAccessToken, que le chargement de
// depart du widget appelle en arriere-plan (sinon il plante apres la fin du test).
async function charger({echec} = {}) {
  const overrides = {};
  // Ecritures tentees en echec : la doublure qui rejette ne les range pas dans
  // w.calls.userActions, on les compte ici pour prouver qu'elles sont parties.
  const tentatives = [];
  if (echec) {
    overrides.grist = {
      docApi: {
        fetchTable: () => Promise.resolve({id: []}),
        getAccessToken: () => Promise.resolve({token: "jeton", baseUrl: "https://grist.example/api/docs/DOC"}),
        applyUserActions: (actions) => { tentatives.push(actions); return Promise.reject(echec); },
      },
    };
  }
  const w = loadClubs(overrides);
  w.tentatives = tentatives;
  // Le chargement de depart du widget (load) relit les tables par fetchTable puis
  // remplace state.raw. On le laisse finir (il n'a que des promesses deja
  // resolues, un tour de boucle suffit) avant de poser l'etat du test : sinon il
  // l'ecraserait en cours de route, et un contact deviendrait « introuvable ».
  await new Promise((resolve) => setImmediate(resolve));
  w.state.currentId = 7;
  w.state.raw = {
    Contacts: [
      {id: 1, Club: 7, Nom: "Martin", Prenom: "Zoe", Email: "zoe.martin@exemple.fr", Telephone: "", Fonction: "Entraineuse"},
      {id: 2, Club: 99, Nom: "Autre", Prenom: "Camille", Email: "camille@exemple.fr", Telephone: "", Fonction: ""},
    ],
  };
  return w;
}

// Remplace les methodes de la console du bac a sable par un enregistreur.
// Le helper ne change pas : on modifie l'objet console qu'il a fourni.
function espionnerConsole(w) {
  const lignes = [];
  for (const niveau of ["log", "warn", "error", "info"]) {
    w.console[niveau] = (...args) => lignes.push(args.map(String).join(" "));
  }
  return lignes;
}

const actionsEnvoyees = (w) => plain(w.calls.userActions);

// --- controlerContact ---------------------------------------------------------

test("controlerContact retire les espaces de debut et de fin des cinq champs", async () => {
  const w = await charger();
  const {valeurs, problemes} = plain(w.controlerContact({
    Nom: "  Dupontel ", Prenom: " Lucie  ", Email: "  lucie@exemple.fr ", Telephone: " 0102030405 ", Fonction: "  Presidente  ",
  }));
  assert.deepEqual(valeurs, {
    Nom: "Dupontel", Prenom: "Lucie", Email: "lucie@exemple.fr", Telephone: "0102030405", Fonction: "Presidente",
  });
  assert.deepEqual(problemes, []);
});

test("controlerContact signale un Nom vide", async () => {
  const w = await charger();
  const {problemes} = plain(w.controlerContact({...SAISIE, Nom: ""}));
  assert.deepEqual(problemes, ["nom-vide"]);
});

test("controlerContact signale un Nom fait seulement d'espaces", async () => {
  const w = await charger();
  const {valeurs, problemes} = plain(w.controlerContact({...SAISIE, Nom: "     "}));
  assert.deepEqual(problemes, ["nom-vide"]);
  assert.equal(valeurs.Nom, "");
});

test("controlerContact signale un Email vide", async () => {
  const w = await charger();
  const {problemes} = plain(w.controlerContact({...SAISIE, Email: ""}));
  assert.deepEqual(problemes, ["email-vide"]);
});

test("controlerContact traite un Email fait d'espaces comme un Email vide", async () => {
  const w = await charger();
  const {problemes} = plain(w.controlerContact({...SAISIE, Email: "   "}));
  assert.deepEqual(problemes, ["email-vide"]);
});

test("controlerContact signale un Email mal forme (sans arobase, sans partie apres, espace au milieu, deux arobases)", async () => {
  const w = await charger();
  for (const email of ["lucie.exemple.fr", "lucie@", "@exemple.fr", "lucie dupontel@exemple.fr", "a@b@exemple.fr"]) {
    const {problemes} = plain(w.controlerContact({...SAISIE, Email: email}));
    assert.deepEqual(problemes, ["email-mal-forme"], `« ${email} » devrait etre refuse`);
  }
});

test("controlerContact cumule les problemes d'un Nom vide et d'un Email mal forme", async () => {
  const w = await charger();
  const {problemes} = plain(w.controlerContact({...SAISIE, Nom: "", Email: "pas-un-email"}));
  assert.deepEqual(problemes, ["nom-vide", "email-mal-forme"]);
});

test("controlerContact accepte une saisie correcte et laisse vides les champs facultatifs", async () => {
  const w = await charger();
  const complet = plain(w.controlerContact(SAISIE));
  assert.deepEqual(complet.problemes, []);
  assert.deepEqual(complet.valeurs, SAISIE);

  const minimal = plain(w.controlerContact({Nom: "Dupontel", Email: "lucie@exemple.fr"}));
  assert.deepEqual(minimal.problemes, []);
  assert.deepEqual(minimal.valeurs, {Nom: "Dupontel", Prenom: "", Email: "lucie@exemple.fr", Telephone: "", Fonction: ""});
});

test("controlerContact ne plante pas sans saisie", async () => {
  const w = await charger();
  assert.deepEqual(plain(w.controlerContact(undefined)).problemes, ["nom-vide", "email-vide"]);
});

// --- ajouterContact -----------------------------------------------------------

test("ajouterContact envoie une seule AddRecord sur Contacts, avec Club et les cinq champs", async () => {
  const w = await charger();
  const resultat = plain(await w.ajouterContact(7, SAISIE));

  assert.deepEqual(resultat, {ok: true});
  const envoyees = actionsEnvoyees(w);
  assert.equal(envoyees.length, 1, "un seul appel a applyUserActions");
  assert.equal(envoyees[0].length, 1, "une seule action dans cet appel");
  const [type, table, ligne, valeurs] = envoyees[0][0];
  assert.equal(type, "AddRecord");
  assert.equal(table, "Contacts");
  assert.equal(ligne, null);
  assert.deepEqual(Object.keys(valeurs).sort(), ["Club", ...CINQ_CHAMPS].sort());
  assert.deepEqual(valeurs, {Club: 7, ...SAISIE});
});

test("ajouterContact n'envoie ni DR ni DD (colonnes formules des regles d'acces)", async () => {
  const w = await charger();
  await w.ajouterContact(7, SAISIE);
  const valeurs = actionsEnvoyees(w)[0][0][3];
  assert.ok(!("DR" in valeurs) && !("DD" in valeurs));
});

test("ajouterContact envoie les valeurs nettoyees (espaces retires)", async () => {
  const w = await charger();
  await w.ajouterContact(7, {...SAISIE, Nom: "  Dupontel  ", Email: " lucie.dupontel@exemple.fr "});
  const valeurs = actionsEnvoyees(w)[0][0][3];
  assert.equal(valeurs.Nom, "Dupontel");
  assert.equal(valeurs.Email, "lucie.dupontel@exemple.fr");
});

test("ajouterContact n'envoie rien si la saisie est incorrecte et renvoie les problemes", async () => {
  const w = await charger();
  const resultat = plain(await w.ajouterContact(7, {...SAISIE, Nom: " ", Email: "mauvais"}));
  assert.deepEqual(resultat, {ok: false, type: "saisie", problemes: ["nom-vide", "email-mal-forme"]});
  assert.equal(w.calls.userActions.length, 0);
});

test("ajouterContact n'envoie rien si ce n'est pas le club ouvert", async () => {
  const w = await charger();
  assert.deepEqual(plain(await w.ajouterContact(99, SAISIE)), {ok: false, type: "club"});
  assert.deepEqual(plain(await w.ajouterContact(null, SAISIE)), {ok: false, type: "club"});
  assert.deepEqual(plain(await w.ajouterContact("7", SAISIE)), {ok: false, type: "club"});
  assert.equal(w.calls.userActions.length, 0);
});

test("ajouterContact n'envoie rien quand aucun club n'est ouvert", async () => {
  const w = await charger();
  w.state.currentId = null;
  assert.deepEqual(plain(await w.ajouterContact(7, SAISIE)), {ok: false, type: "club"});
  assert.equal(w.calls.userActions.length, 0);
});

test("ajouterContact renvoie le type 'droits' quand Grist refuse l'ecriture", async () => {
  const w = await charger({echec: new Error("Blocked by table update access rules")});
  assert.deepEqual(plain(await w.ajouterContact(7, SAISIE)), {ok: false, type: "droits"});
  assert.equal(w.tentatives.length, 1, "l'ecriture est bien partie");
  assert.equal(w.tentatives[0][0][0], "AddRecord");
});

// --- modifierContact ----------------------------------------------------------

test("modifierContact envoie une seule UpdateRecord avec les cinq champs, sans Club, DR ni DD", async () => {
  const w = await charger();
  const resultat = plain(await w.modifierContact(7, 1, SAISIE));

  assert.deepEqual(resultat, {ok: true});
  const envoyees = actionsEnvoyees(w);
  assert.equal(envoyees.length, 1);
  assert.equal(envoyees[0].length, 1);
  const [type, table, ligne, valeurs] = envoyees[0][0];
  assert.equal(type, "UpdateRecord");
  assert.equal(table, "Contacts");
  assert.equal(ligne, 1);
  assert.deepEqual(Object.keys(valeurs).sort(), CINQ_CHAMPS);
  assert.deepEqual(valeurs, SAISIE);
  for (const interdit of ["Club", "DR", "DD"]) assert.ok(!(interdit in valeurs), `${interdit} ne doit pas etre ecrit`);
});

test("modifierContact n'envoie rien si le contact appartient a un autre club", async () => {
  const w = await charger();
  assert.deepEqual(plain(await w.modifierContact(7, 2, SAISIE)), {ok: false, type: "introuvable"});
  assert.equal(w.calls.userActions.length, 0);
});

test("modifierContact n'envoie rien si le contact n'existe pas, si le club n'est pas ouvert ou si l'identifiant est faux", async () => {
  const w = await charger();
  assert.deepEqual(plain(await w.modifierContact(7, 404, SAISIE)), {ok: false, type: "introuvable"});
  assert.deepEqual(plain(await w.modifierContact(99, 1, SAISIE)), {ok: false, type: "introuvable"});
  assert.deepEqual(plain(await w.modifierContact(7, "1", SAISIE)), {ok: false, type: "introuvable"});
  assert.equal(w.calls.userActions.length, 0);
});

test("modifierContact n'envoie rien si la saisie est incorrecte", async () => {
  const w = await charger();
  const resultat = plain(await w.modifierContact(7, 1, {...SAISIE, Email: ""}));
  assert.deepEqual(resultat, {ok: false, type: "saisie", problemes: ["email-vide"]});
  assert.equal(w.calls.userActions.length, 0);
});

test("modifierContact renvoie le type 'reseau' quand la connexion echoue", async () => {
  const w = await charger({echec: new Error("Failed to fetch")});
  assert.deepEqual(plain(await w.modifierContact(7, 1, SAISIE)), {ok: false, type: "reseau"});
  assert.equal(w.tentatives.length, 1, "l'ecriture est bien partie");
  assert.equal(w.tentatives[0][0][0], "UpdateRecord");
});

// --- supprimerContact ---------------------------------------------------------

test("supprimerContact envoie une seule RemoveRecord sur Contacts", async () => {
  const w = await charger();
  const resultat = plain(await w.supprimerContact(7, 1));

  assert.deepEqual(resultat, {ok: true});
  assert.deepEqual(actionsEnvoyees(w), [[["RemoveRecord", "Contacts", 1]]]);
});

test("supprimerContact n'envoie rien si le contact appartient a un autre club", async () => {
  const w = await charger();
  assert.deepEqual(plain(await w.supprimerContact(7, 2)), {ok: false, type: "introuvable"});
  assert.equal(w.calls.userActions.length, 0);
});

test("supprimerContact n'envoie rien si le contact n'existe pas ou si ce n'est pas le club ouvert", async () => {
  const w = await charger();
  assert.deepEqual(plain(await w.supprimerContact(7, 404)), {ok: false, type: "introuvable"});
  assert.deepEqual(plain(await w.supprimerContact(99, 2)), {ok: false, type: "introuvable"});
  assert.equal(w.calls.userActions.length, 0);
});

test("supprimerContact renvoie le type 'autre' pour une erreur inattendue", async () => {
  const w = await charger({echec: new Error("quelque chose d'inattendu")});
  assert.deepEqual(plain(await w.supprimerContact(7, 1)), {ok: false, type: "autre"});
  assert.equal(w.tentatives.length, 1, "l'ecriture est bien partie");
  assert.equal(w.tentatives[0][0][0], "RemoveRecord");
});

// --- classerErreurEcriture ----------------------------------------------------

test("classerErreurEcriture reconnait un refus des regles d'acces", async () => {
  const w = await charger();
  assert.equal(w.classerErreurEcriture(new Error("Blocked by table update access rules")), "droits");
  assert.equal(w.classerErreurEcriture(new Error("Permission denied")), "droits");
  assert.equal(w.classerErreurEcriture("access denied"), "droits");
});

test("classerErreurEcriture reconnait un echec reseau", async () => {
  const w = await charger();
  assert.equal(w.classerErreurEcriture(new Error("Failed to fetch")), "reseau");
  assert.equal(w.classerErreurEcriture(new Error("Network request failed")), "reseau");
  assert.equal(w.classerErreurEcriture(new Error("Request timed out")), "reseau");
});

test("classerErreurEcriture range le reste dans 'autre', y compris une erreur vide", async () => {
  const w = await charger();
  assert.equal(w.classerErreurEcriture(new Error("Colonne introuvable")), "autre");
  assert.equal(w.classerErreurEcriture(undefined), "autre");
  assert.equal(w.classerErreurEcriture({code: 500}), "autre");
});

// --- Discretion de la console -------------------------------------------------

// Texte d'erreur « brut » de Grist, avec des valeurs qu'on ne doit jamais voir.
const ERREUR_BRUTE = "Blocked by access rules: Nom=Dupontel Email=lucie.dupontel@exemple.fr Telephone=01 02 03 04 05";

function verifierConsolePropre(lignes) {
  const tout = lignes.join("\n");
  for (const interdit of ["Dupontel", "Lucie", "lucie.dupontel", "exemple.fr", "01 02 03 04 05", "Blocked by access rules", "Presidente"]) {
    assert.ok(!tout.includes(interdit), `la console ne doit pas contenir « ${interdit} »`);
  }
}

test("la console ne montre aucune valeur saisie lors d'une ecriture reussie", async () => {
  const w = await charger();
  const lignes = espionnerConsole(w);
  assert.deepEqual(plain(await w.ajouterContact(7, SAISIE)), {ok: true});
  assert.deepEqual(plain(await w.modifierContact(7, 1, SAISIE)), {ok: true});
  assert.deepEqual(plain(await w.supprimerContact(7, 1)), {ok: true});
  assert.equal(w.calls.userActions.length, 3, "les trois ecritures sont bien parties");
  verifierConsolePropre(lignes);
});

test("la console ne montre ni valeur saisie ni texte brut d'erreur lors d'une ecriture en echec", async () => {
  const w = await charger({echec: new Error(ERREUR_BRUTE)});
  const lignes = espionnerConsole(w);
  assert.equal((await w.ajouterContact(7, SAISIE)).type, "droits");
  assert.equal((await w.modifierContact(7, 1, SAISIE)).type, "droits");
  assert.equal((await w.supprimerContact(7, 1)).type, "droits");
  assert.equal(w.tentatives.length, 3, "les trois ecritures sont bien parties avant d'echouer");
  assert.ok(lignes.length > 0, "l'echec est tout de meme signale dans la console, sans details");
  verifierConsolePropre(lignes);
});

test("la console ne montre rien de saisi quand la saisie est refusee avant l'envoi", async () => {
  const w = await charger();
  const lignes = espionnerConsole(w);
  await w.ajouterContact(7, {...SAISIE, Email: "lucie.dupontel-mal-forme"});
  await w.ajouterContact(99, SAISIE);
  await w.modifierContact(7, 2, SAISIE);
  verifierConsolePropre(lignes);
});

// --- buildFicheDetail ---------------------------------------------------------

test("buildFicheDetail renvoie la fonction de chaque contact du club", async () => {
  const w = await charger();
  const raw = {
    Contacts: [
      {id: 1, Club: 7, Nom: "Martin", Prenom: "Zoe", Email: "", Telephone: "", Fonction: "Entraineuse"},
      {id: 2, Club: 7, Nom: "Bernard", Prenom: "Alex", Email: "", Telephone: "", Fonction: null},
      {id: 3, Club: 99, Nom: "Autre", Prenom: "Camille", Email: "", Telephone: "", Fonction: "Tresoriere"},
    ],
  };
  const {contacts} = plain(w.buildFicheDetail(raw, 7));
  assert.deepEqual(contacts.map((contact) => [contact.id, contact.fonction]), [[2, ""], [1, "Entraineuse"]],
    "Fonction presente, ou chaine vide si absente ; le contact d'un autre club est exclu");
});
