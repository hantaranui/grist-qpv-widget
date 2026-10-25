"use strict";

// Tache 7.3, fin : chargement de pdfmake, nom du fichier PDF et controle de « Generer ».
//  - chargerPdfmake et conventionChargerPdfmake (delai de 20 secondes) ;
//  - conventionNomNettoye et conventionNomFichier (decision D-S7-3) ;
//  - conventionProblemesGenerer (six messages valides, decision D-3).
// Les codes d'erreur de conventionGenerer sont dans convention-generation.test.js (ils
// reutilisent son jeu d'essai). Ce fichier est separe : le chargement a besoin d'un faux
// <head> et de fausses minuteries, que le jeu d'essai de la generation n'a pas.
// Aucun script n'est charge pour de vrai : document est remplace (apres le chargement du
// widget) par une doublure qui note les scripts ajoutes, et les tests declenchent eux-memes
// onload / onerror. Les minuteries sont simulees : on ne patiente jamais 20 secondes.
// Les doublures sont posees sur w.window (le vrai global du bac a sable ; w n'en est qu'une copie).
// Les adresses et empreintes sont recopiees en dur : si le code les change, le test doit echouer.
// Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const {loadWidget} = require("./helpers/widget");

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Les objets crees dans le bac a sable viennent d'un autre contexte d'execution :
// deepStrictEqual les juge differents des notres. On les recopie avant de comparer.
const ordinaire = (valeur) => JSON.parse(JSON.stringify(valeur));

async function attraper(promesse) {
  try { await promesse; } catch (erreur) { return erreur; }
  return undefined;
}

// ---------------------------------------------------------------------------
// Chargement de pdfmake
// ---------------------------------------------------------------------------

const PDFMAKE = {
  url: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/pdfmake.min.js",
  integrity: "sha384-HsYB9F88cbFl+w8Pu5vyAezlEQxqQkPPj78NDtuRRjgl0t4YAfWS0Fy5pvJF80yI",
};
const ROBOTO = {
  url: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.3.3/fonts/Roboto.min.js",
  integrity: "sha384-too3ol4VkM7cR44bgMJ3OfF8xS62cnE/YLdKop6uRj4q4rCMdS4SOmmrASLaCN2O",
};
const CODE_PDFMAKE = "pdfmake-non-charge";

// Charge le widget, puis remplace document (le <head> note les scripts ajoutes) et les
// minuteries. scripts : tous les scripts ajoutes, dans l'ordre ; dansLaPage : ceux qui
// sont encore dans la page ; minuteries : chaque setTimeout demande.
async function preparerChargement() {
  const w = loadWidget();
  await attendre();
  await attendre();
  const g = w.window;
  const scripts = [];
  const dansLaPage = [];
  const minuteries = [];
  g.document = Object.assign(Object.create(g.document), {
    createElement(balise) {
      const script = {balise, retire: false};
      script.remove = () => {
        script.retire = true;
        const i = dansLaPage.indexOf(script);
        if (i >= 0) dansLaPage.splice(i, 1);
      };
      return script;
    },
    head: {appendChild(script) { scripts.push(script); dansLaPage.push(script); return script; }},
  });
  g.setTimeout = (fonction, delai) => {
    const minuterie = {fonction, delai, annulee: false};
    minuteries.push(minuterie);
    return minuterie;
  };
  g.clearTimeout = (minuterie) => { if (minuterie) minuterie.annulee = true; };
  return {w, g, scripts, dansLaPage, minuteries};
}

const fauxPdfMake = () => ({createPdf() {}});

function verifierScript(script, attendu) {
  assert.equal(script.src, attendu.url);
  assert.equal(script.integrity, attendu.integrity);
  assert.equal(script.crossOrigin, "anonymous");
  assert.equal(script.referrerPolicy, "no-referrer");
}

// Echoue si le chargement ne se fait pas dans l'ordre pdfmake puis Roboto, si Roboto est
// ajoute avant que pdfmake soit charge, si l'un des deux scripts perd son adresse (version
// 0.3.3), son empreinte integrity, crossorigin="anonymous" ou referrerpolicy="no-referrer",
// ou si rien n'est ajoute a la page avant l'appel.
test("chargerPdfmake : pdfmake puis Roboto, adresse figée, integrity, crossorigin et referrerpolicy sur chacun", async () => {
  const {w, g, scripts} = await preparerChargement();
  assert.equal(scripts.length, 0, "rien n'est ajouté avant l'appel");

  const promesse = w.chargerPdfmake();
  await attendre();
  assert.equal(scripts.length, 1, "d'abord pdfmake seul");
  verifierScript(scripts[0], PDFMAKE);
  assert.ok(scripts[0].src.includes("/pdfmake/0.3.3/"), "version 0.3.3");

  g.pdfMake = fauxPdfMake();
  scripts[0].onload();
  await attendre();
  assert.equal(scripts.length, 2, "Roboto seulement une fois pdfmake chargé");
  verifierScript(scripts[1], ROBOTO);
  assert.ok(scripts[1].src.includes("/pdfmake/0.3.3/"), "version 0.3.3");

  scripts[1].onload();
  await promesse;
});

// Echoue si un deuxieme appel (en cours de chargement, ou apres la reussite) ajoute d'autres
// scripts ou ne rend pas la meme promesse : un seul chargement par page.
test("chargerPdfmake : un seul chargement par page, le deuxième appel rend la même promesse", async () => {
  const {w, g, scripts} = await preparerChargement();

  const premiere = w.chargerPdfmake();
  const deuxieme = w.chargerPdfmake();
  assert.equal(deuxieme, premiere, "même promesse pendant le chargement");
  await attendre();
  g.pdfMake = fauxPdfMake();
  scripts[0].onload();
  await attendre();
  scripts[1].onload();
  await premiere;

  const troisieme = w.chargerPdfmake();
  assert.equal(troisieme, premiere, "même promesse après la réussite");
  await troisieme;
  assert.equal(scripts.length, 2, "aucun script de plus");
});

// Echoue si l'echec de pdfmake (reseau, empreinte refusee) ne rejette pas avec le code
// 'pdfmake-non-charge', si le script rate reste dans la page, ou si Roboto est quand meme ajoute.
test("chargerPdfmake : pdfmake refusé → rejet pdfmake-non-charge, script retiré, Roboto jamais ajouté", async () => {
  const {w, scripts, dansLaPage} = await preparerChargement();

  const promesse = w.chargerPdfmake();
  await attendre();
  scripts[0].onerror();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "le chargement est rejeté");
  assert.equal(erreur.code, CODE_PDFMAKE);
  assert.equal(scripts[0].retire, true, "le script raté est retiré");
  assert.equal(dansLaPage.length, 0, "plus aucun script dans la page");
  assert.equal(scripts.length, 1, "Roboto n'a pas été ajouté");
});

// Echoue si, apres un echec, un nouvel appel rend encore l'ancien rejet au lieu de
// recommencer, ou s'il ne rajoute pas un nouveau script pdfmake.
test("chargerPdfmake : après un échec, un nouvel appel recommence et peut réussir", async () => {
  const {w, g, scripts, dansLaPage} = await preparerChargement();

  const echec = w.chargerPdfmake();
  await attendre();
  scripts[0].onerror();
  await attraper(echec);

  const nouvelle = w.chargerPdfmake();
  assert.notEqual(nouvelle, echec, "une nouvelle promesse");
  await attendre();
  assert.equal(scripts.length, 2, "un nouveau script pdfmake");
  verifierScript(scripts[1], PDFMAKE);
  g.pdfMake = fauxPdfMake();
  scripts[1].onload();
  await attendre();
  assert.equal(scripts.length, 3);
  verifierScript(scripts[2], ROBOTO);
  scripts[2].onload();
  await nouvelle;
  assert.deepEqual(dansLaPage, [scripts[1], scripts[2]], "seuls les deux scripts réussis restent");
});

// Echoue si, quand seul Roboto a echoue, le nouvel appel recharge pdfmake (script deja
// charge avec succes), s'il n'ajoute pas Roboto de nouveau, ou si le Roboto rate reste dans la page.
test("chargerPdfmake : si seul Roboto a échoué, le nouvel appel ne recharge que Roboto", async () => {
  const {w, g, scripts, dansLaPage} = await preparerChargement();

  const echec = w.chargerPdfmake();
  await attendre();
  g.pdfMake = fauxPdfMake();
  scripts[0].onload();
  await attendre();
  scripts[1].onerror();
  const erreur = await attraper(echec);
  assert.equal(erreur.code, CODE_PDFMAKE);
  assert.equal(scripts[1].retire, true, "le Roboto raté est retiré");
  assert.deepEqual(dansLaPage, [scripts[0]], "pdfmake reste dans la page");

  const nouvelle = w.chargerPdfmake();
  await attendre();
  assert.equal(scripts.length, 3, "un seul script de plus");
  verifierScript(scripts[2], ROBOTO);
  assert.equal(scripts.filter((s) => s.src === PDFMAKE.url).length, 1, "pdfmake n'est pas rechargé");
  scripts[2].onload();
  await nouvelle;
});

// Echoue si un script pdfmake charge mais qui ne fournit pas pdfMake.createPdf est pris pour
// un succes (la generation echouerait plus tard), ou s'il reste dans la page.
test("chargerPdfmake : pdfmake chargé mais sans pdfMake.createPdf → rejet pdfmake-non-charge, script retiré", async () => {
  const {w, scripts, dansLaPage} = await preparerChargement();

  const promesse = w.chargerPdfmake();
  await attendre();
  scripts[0].onload();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "le chargement est rejeté");
  assert.equal(erreur.code, CODE_PDFMAKE);
  assert.equal(scripts[0].retire, true);
  assert.equal(dansLaPage.length, 0);
  assert.equal(scripts.length, 1, "Roboto n'a pas été ajouté");
});

// Echoue si la page (index.html) contient une balise pdfmake, si chargerPdfmake est appelee
// ailleurs que dans conventionChargerPdfmake, ou si conventionChargerPdfmake est appelee
// ailleurs que dans conventionGenerer (donc au clic sur « Generer », jamais a l'ouverture).
test("chargerPdfmake : rien n'est chargé à l'ouverture de la page ni de la fenêtre, seulement dans conventionGenerer", () => {
  const dossier = path.join(__dirname, "..", "src", "actions-dashboard");
  const page = fs.readFileSync(path.join(dossier, "index.html"), "utf8");
  assert.ok(!/pdfmake/i.test(page), "aucune balise pdfmake dans la page");

  const source = fs.readFileSync(path.join(dossier, "script.js"), "utf8")
    .split("\n").filter((ligne) => !ligne.trim().startsWith("//")).join("\n");
  const corps = (debut) => {
    const i = source.indexOf(debut);
    assert.ok(i >= 0, `${debut} existe`);
    return source.slice(i, source.indexOf("\n}\n", i));
  };

  const appelsBruts = [...source.matchAll(/(?<!function )\bchargerPdfmake\(/g)];
  assert.equal(appelsBruts.length, 1, "chargerPdfmake n'est appelée qu'à un endroit");
  assert.ok(/\bchargerPdfmake\(/.test(corps("function conventionChargerPdfmake(")), "dans conventionChargerPdfmake");

  const appelsConvention = [...source.matchAll(/(?<!function )\bconventionChargerPdfmake\(/g)];
  assert.equal(appelsConvention.length, 1, "conventionChargerPdfmake n'est appelée qu'à un endroit");
  assert.ok(/\bconventionChargerPdfmake\(/.test(corps("async function conventionGenerer(")), "dans conventionGenerer");
});

// ---------------------------------------------------------------------------
// conventionChargerPdfmake : delai maximum de 20 secondes (minuterie simulee)
// ---------------------------------------------------------------------------

// Echoue si le delai n'est pas de 20000 ms, ou si la minuterie reste armee apres la reussite
// (elle rejetterait la promesse 20 secondes plus tard).
test("conventionChargerPdfmake : minuterie de 20 secondes, annulée quand le chargement réussit", async () => {
  const {w, g, scripts, minuteries} = await preparerChargement();

  const promesse = w.conventionChargerPdfmake();
  assert.equal(minuteries.length, 1, "une seule minuterie");
  assert.equal(minuteries[0].delai, 20000);
  assert.equal(minuteries[0].annulee, false, "armée pendant le chargement");

  await attendre();
  g.pdfMake = fauxPdfMake();
  scripts[0].onload();
  await attendre();
  scripts[1].onload();
  await promesse;
  assert.equal(minuteries[0].annulee, true, "annulée après la réussite");
});

// Echoue si, au bout des 20 secondes (minuterie declenchee a la main), la promesse n'est pas
// rejetee avec le code 'pdfmake-non-charge' alors que les scripts n'ont rien repondu.
test("conventionChargerPdfmake : délai dépassé → rejet pdfmake-non-charge", async () => {
  const {w, minuteries} = await preparerChargement();

  const promesse = w.conventionChargerPdfmake();
  await attendre();
  minuteries[0].fonction();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "la promesse est rejetée");
  assert.equal(erreur.code, CODE_PDFMAKE);
});

// Echoue si un echec de chargement avant le delai ne rejette pas avec le code
// 'pdfmake-non-charge', ou laisse la minuterie armee.
test("conventionChargerPdfmake : échec avant le délai → rejet pdfmake-non-charge, minuterie annulée", async () => {
  const {w, scripts, minuteries} = await preparerChargement();

  const promesse = w.conventionChargerPdfmake();
  await attendre();
  scripts[0].onerror();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "la promesse est rejetée");
  assert.equal(erreur.code, CODE_PDFMAKE);
  assert.equal(minuteries[0].annulee, true, "minuterie annulée");
});

// ---------------------------------------------------------------------------
// Nom du fichier (decision D-S7-3)
// ---------------------------------------------------------------------------

let widgetPur;
// Les fonctions de nom sont pures : un seul widget charge suffit.
async function widgetDeNoms() {
  if (!widgetPur) {
    widgetPur = loadWidget();
    await attendre();
  }
  return widgetPur;
}

// Echoue si un accent n'est pas retire (é, è, à, ç, î...).
test("conventionNomNettoye : les accents sont retirés", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomNettoye("Évry à l'Été"), "Evry-a-l-Ete");
  assert.equal(w.conventionNomNettoye("Français ôté çà"), "Francais-ote-ca");
});

// Echoue si œ n'est pas remplace par oe (Œ par Oe), æ par ae (Æ par Ae), ou si ces lettres
// sont simplement supprimees ou coupees en deux mots.
test("conventionNomNettoye : œ devient oe et æ devient ae", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomNettoye("Cœur"), "Coeur");
  assert.equal(w.conventionNomNettoye("Œuvre"), "Oeuvre");
  assert.equal(w.conventionNomNettoye("Nævus"), "Naevus");
  assert.equal(w.conventionNomNettoye("Æsir"), "Aesir");
});

// Echoue si une suite de caracteres speciaux ou d'espaces donne plusieurs tirets, si un tiret
// reste au debut ou a la fin, ou si un caractere special reste dans le nom.
test("conventionNomNettoye : une suite de caractères spéciaux devient un seul tiret, sans tiret au bord", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomNettoye("A &&  // B"), "A-B");
  assert.equal(w.conventionNomNettoye("--A--"), "A");
  assert.equal(w.conventionNomNettoye("(Club) [Nord]"), "Club-Nord");
  assert.equal(w.conventionNomNettoye("a/b\\c:d*e?f"), "a-b-c-d-e-f");
});

// Echoue si la casse change (majuscules passees en minuscules) ou si les chiffres disparaissent.
test("conventionNomNettoye : la casse et les chiffres sont gardés", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomNettoye("ASM Section 2"), "ASM-Section-2");
});

// Echoue si la longueur maximale n'est pas respectee, si le texte coupe finit par un tiret,
// ou si le texte est coupe alors qu'aucune longueur maximale n'est donnee.
test("conventionNomNettoye : longueur maximale coupée sans tiret final, aucune coupe sans maximum", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomNettoye("a".repeat(50), 40), "a".repeat(40));
  assert.equal(w.conventionNomNettoye(`${"a".repeat(39)} bbbb`, 40), "a".repeat(39), "le tiret laissé par la coupe est retiré");
  assert.equal(w.conventionNomNettoye("a".repeat(50)).length, 50, "pas de coupe sans maximum");
  assert.equal(w.conventionNomNettoye("court", 40), "court");
});

// Echoue si un texte vide, absent, fait seulement de caracteres speciaux ou sans lettre latine
// donne autre chose que la chaine vide (l'appelant la remplace alors par « club »).
test("conventionNomNettoye : texte vide, absent ou sans lettre latine → chaîne vide", async () => {
  const w = await widgetDeNoms();
  for (const valeur of ["", "   ", null, undefined, "---", "???", "日本"]) {
    assert.equal(w.conventionNomNettoye(valeur), "", `« ${valeur} »`);
  }
});

// Donnees d'essai du nom : une action (club 7, dispositif 3) et son modele actif.
function donneesNom({dispositif = "Match des métiers", club = "Club Exemple", avecAnnee = true, clubDeLAction = 7} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Club: clubDeLAction, Dispositif: 3}],
      Dispositifs: [{id: 3, Dispositif: dispositif}],
      Structures: [{id: 7, Nom: club}],
      Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Avec_annee: avecAnnee}],
    },
    tablesRefusees: [],
  };
}

const VALEURS_NOM = {annee: "2031", signataire: 31, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};

// Echoue si le nom n'a pas la forme Convention-[dispositif]-[club]-[annee].pdf, ou si les
// espaces autour de l'annee saisie se retrouvent dans le nom.
test("conventionNomFichier : forme Convention-[dispositif]-[club]-[année].pdf", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomFichier(1, VALEURS_NOM, donneesNom()), "Convention-Match-metiers-Club-Exemple-2031.pdf");
  assert.equal(w.conventionNomFichier(1, {...VALEURS_NOM, annee: " 2031 "}, donneesNom()), "Convention-Match-metiers-Club-Exemple-2031.pdf");
});

// Echoue si l'un des trois dispositifs n'a pas sa forme courte (Stade-emploi, Match-metiers,
// Remobilisation), ou si la forme courte depend de la casse, des accents ou du type d'apostrophe.
test("conventionNomFichier : noms courts Stade-emploi, Match-metiers et Remobilisation, quelle que soit l'écriture", async () => {
  const w = await widgetDeNoms();
  const cas = [
    ["Du stade vers l'emploi", "Stade-emploi"],
    ["Du stade vers l’emploi", "Stade-emploi"],
    ["DU STADE VERS L'EMPLOI", "Stade-emploi"],
    ["Match des métiers", "Match-metiers"],
    ["MATCH DES MÉTIERS", "Match-metiers"],
    ["Parcours de remobilisation vers l'emploi", "Remobilisation"],
    ["Parcours de remobilisation vers l’emploi", "Remobilisation"],
  ];
  for (const [dispositif, court] of cas) {
    assert.equal(w.conventionNomFichier(1, VALEURS_NOM, donneesNom({dispositif})), `Convention-${court}-Club-Exemple-2031.pdf`, dispositif);
  }
});

// Echoue si un dispositif inconnu est raccourci, perd son nom, ou garde accents et
// caracteres speciaux dans le nom du fichier.
test("conventionNomFichier : un dispositif inconnu garde son nom complet nettoyé", async () => {
  const w = await widgetDeNoms();
  assert.equal(
    w.conventionNomFichier(1, VALEURS_NOM, donneesNom({dispositif: "Dispositif d'Été n°2"})),
    "Convention-Dispositif-d-Ete-n-2-Club-Exemple-2031.pdf"
  );
});

// Echoue si un modele sans annee (Avec_annee faux) garde l'annee saisie dans le nom, ou
// laisse un tiret final (Convention-...-club-.pdf).
test("conventionNomFichier : un modèle sans année donne Convention-[dispositif]-[club].pdf, sans tiret en trop", async () => {
  const w = await widgetDeNoms();
  const donnees = donneesNom({dispositif: "Parcours de remobilisation vers l'emploi", avecAnnee: false});
  assert.equal(w.conventionNomFichier(1, VALEURS_NOM, donnees), "Convention-Remobilisation-Club-Exemple.pdf");
  assert.equal(w.conventionNomFichier(1, {...VALEURS_NOM, annee: null}, donnees), "Convention-Remobilisation-Club-Exemple.pdf");
});

// Echoue si le nom du club depasse 40 caracteres, ou si la coupe laisse un tiret a la fin.
test("conventionNomFichier : le nom du club est limité à 40 caractères, sans tiret final", async () => {
  const w = await widgetDeNoms();
  const long = w.conventionNomFichier(1, VALEURS_NOM, donneesNom({club: "Association Sportive Omnisports de la Ville de Exemple-sur-Mer Nord"}));
  assert.equal(long, "Convention-Match-metiers-Association-Sportive-Omnisports-de-la-Vi-2031.pdf");

  const coupeSurUnTiret = w.conventionNomFichier(1, VALEURS_NOM, donneesNom({club: `A${"a".repeat(38)} Bbb`}));
  assert.equal(coupeSurUnTiret, `Convention-Match-metiers-A${"a".repeat(38)}-2031.pdf`, "39 caractères, le tiret de la coupe est retiré");
});

// Echoue si un club sans nom (vide, fait de caracteres speciaux, ou action sans club) ne
// donne pas « club » dans le nom du fichier.
test("conventionNomFichier : un nom de club vide donne « club »", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomFichier(1, VALEURS_NOM, donneesNom({club: ""})), "Convention-Match-metiers-club-2031.pdf");
  assert.equal(w.conventionNomFichier(1, VALEURS_NOM, donneesNom({club: "???"})), "Convention-Match-metiers-club-2031.pdf");
  assert.equal(w.conventionNomFichier(1, VALEURS_NOM, donneesNom({clubDeLAction: 0})), "Convention-Match-metiers-club-2031.pdf");
});

// Echoue si un nom de personne saisi dans la fenetre (representant, fonction) entre dans
// le nom du fichier.
test("conventionNomFichier : jamais de nom de personne", async () => {
  const w = await widgetDeNoms();
  const nom = w.conventionNomFichier(1, VALEURS_NOM, donneesNom());
  assert.ok(!nom.includes("Dana"), "pas le représentant");
  assert.ok(!nom.includes("Directrice"), "pas sa fonction");
  assert.ok(/^[A-Za-z0-9-]+\.pdf$/.test(nom), "seulement lettres, chiffres, tirets et .pdf");
});

// ---------------------------------------------------------------------------
// conventionProblemesGenerer : tous les problemes a la fois, six messages valides (D-3)
// ---------------------------------------------------------------------------

const MESSAGES = {
  anneeAbsente: "Saisissez l'année de la convention.",
  anneeInvalide: "Saisissez une année à quatre chiffres.",
  signataire: "Choisissez le signataire du club.",
  sansFonction: "Le signataire choisi n'a pas de fonction. Renseignez-la dans la fiche du club, puis revenez générer la convention.",
  representant: "Saisissez le nom du représentant.",
  fonctionRepresentant: "Saisissez la fonction du représentant.",
};

// Contacts du club 7 : 31 avec fonction, 32 sans fonction ; 33 appartient a un autre club.
function donneesProblemes({avecAnnee = true} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Club: 7, Dispositif: 3}],
      Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Avec_annee: avecAnnee}],
      Contacts: [
        {id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"},
        {id: 32, Club: 7, Prenom: "Alex", Nom: "Modèle", Fonction: ""},
        {id: 33, Club: 99, Prenom: "Robin", Nom: "Voisin", Fonction: "Trésorier"},
      ],
    },
    tablesRefusees: [],
  };
}

const COMPLET = {annee: "2031", anneeIllisible: false, signataire: 31, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};

// Echoue si le controle s'arrete au premier probleme au lieu de les rendre tous, si l'ordre
// n'est pas celui de la fenetre, ou si l'un des quatre messages (annee absente, signataire,
// representant, fonction du representant) change d'un mot.
test("conventionProblemesGenerer : tout est vide → les quatre problèmes à la fois, dans l'ordre de la fenêtre", async () => {
  const w = await widgetDeNoms();
  const problemes = w.conventionProblemesGenerer(1, {annee: "", anneeIllisible: false, signataire: 0, representant: "", fonctionRepresentant: ""}, donneesProblemes());
  assert.deepEqual(ordinaire(problemes), [
    {id: "conventionAnnee", message: MESSAGES.anneeAbsente},
    {id: "clubSignataire", message: MESSAGES.signataire},
    {id: "agenceRepresentant", message: MESSAGES.representant},
    {id: "agenceFonction", message: MESSAGES.fonctionRepresentant},
  ]);
});

// Echoue si une annee qui n'a pas quatre chiffres, ou un signataire sans fonction, ne
// donne pas son message exact, ou si ces deux problemes n'arrivent pas avec les autres.
test("conventionProblemesGenerer : année à deux chiffres et signataire sans fonction → leurs messages, avec les autres", async () => {
  const w = await widgetDeNoms();
  const problemes = w.conventionProblemesGenerer(1, {annee: "20", anneeIllisible: false, signataire: 32, representant: "", fonctionRepresentant: ""}, donneesProblemes());
  assert.deepEqual(ordinaire(problemes), [
    {id: "conventionAnnee", message: MESSAGES.anneeInvalide},
    {id: "clubFonction", message: MESSAGES.sansFonction},
    {id: "agenceRepresentant", message: MESSAGES.representant},
    {id: "agenceFonction", message: MESSAGES.fonctionRepresentant},
  ]);
});

// Echoue si une annee illisible (champ numerique dont le texte n'est pas un nombre, champ
// rendu vide) est prise pour une annee absente au lieu d'afficher « quatre chiffres ».
test("conventionProblemesGenerer : année illisible → « Saisissez une année à quatre chiffres. »", async () => {
  const w = await widgetDeNoms();
  const problemes = w.conventionProblemesGenerer(1, {...COMPLET, annee: "", anneeIllisible: true}, donneesProblemes());
  assert.deepEqual(ordinaire(problemes), [{id: "conventionAnnee", message: MESSAGES.anneeInvalide}]);
});

// Echoue si le controle de l'annee reste actif pour un modele sans annee (annee vide ou
// n'importe quel texte), ou si les autres problemes disparaissent avec elle.
test("conventionProblemesGenerer : modèle sans année → aucun problème d'année, les trois autres restent", async () => {
  const w = await widgetDeNoms();
  const donnees = donneesProblemes({avecAnnee: false});
  const vide = {annee: "", anneeIllisible: false, signataire: 0, representant: "", fonctionRepresentant: ""};
  const attendu = [
    {id: "clubSignataire", message: MESSAGES.signataire},
    {id: "agenceRepresentant", message: MESSAGES.representant},
    {id: "agenceFonction", message: MESSAGES.fonctionRepresentant},
  ];
  assert.deepEqual(ordinaire(w.conventionProblemesGenerer(1, vide, donnees)), attendu);
  assert.deepEqual(ordinaire(w.conventionProblemesGenerer(1, {...vide, annee: "abc", anneeIllisible: true}, donnees)), attendu);
  assert.deepEqual(ordinaire(w.conventionProblemesGenerer(1, {...COMPLET, annee: ""}, donnees)), [], "complet sans année : aucun problème");
});

// Echoue si une saisie correcte est refusee, avec ou sans annee.
test("conventionProblemesGenerer : saisie complète → liste vide, avec et sans année", async () => {
  const w = await widgetDeNoms();
  assert.deepEqual(ordinaire(w.conventionProblemesGenerer(1, COMPLET, donneesProblemes())), []);
  assert.deepEqual(ordinaire(w.conventionProblemesGenerer(1, COMPLET, donneesProblemes({avecAnnee: false}))), []);
});

// Echoue si un contact d'un autre club (33), ou un identifiant qui n'existe pas, est accepte
// comme signataire.
test("conventionProblemesGenerer : un signataire qui n'est pas un contact du club → « Choisissez le signataire du club. »", async () => {
  const w = await widgetDeNoms();
  for (const signataire of [33, 999]) {
    const problemes = w.conventionProblemesGenerer(1, {...COMPLET, signataire}, donneesProblemes());
    assert.deepEqual(ordinaire(problemes), [{id: "clubSignataire", message: MESSAGES.signataire}], `signataire ${signataire}`);
  }
});

// Echoue si un representant ou une fonction faits seulement d'espaces (ou absents) sont acceptes.
test("conventionProblemesGenerer : représentant et fonction faits d'espaces ou absents → refusés", async () => {
  const w = await widgetDeNoms();
  for (const vide of ["   ", undefined, null]) {
    const problemes = w.conventionProblemesGenerer(1, {...COMPLET, representant: vide, fonctionRepresentant: vide}, donneesProblemes());
    assert.deepEqual(ordinaire(problemes), [
      {id: "agenceRepresentant", message: MESSAGES.representant},
      {id: "agenceFonction", message: MESSAGES.fonctionRepresentant},
    ], `valeur ${vide === undefined ? "undefined" : JSON.stringify(vide)}`);
  }
});
