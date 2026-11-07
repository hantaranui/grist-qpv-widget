"use strict";

// Tache 7.3, fin : chargement de pdfmake et nom du fichier. MIS A JOUR POUR L'EVOLUTION 3 :
//  - chargerPdfmake et conventionChargerPdfmake (delai de 20 secondes) : CODE MORT. La generation ne fabrique
//    plus de PDF (elle fabrique un Word, voir convention-docx-chargement.test.js) ; script.js garde
//    pdfmake « jusqu'a une etape suivante » (commentaire du developpeur). Ces tests ne servent qu'a garder ce
//    code coherent tant qu'il existe, et un test verifie que la generation ne l'appelle plus. Quand le code
//    pdfmake sera retire de script.js, retirer aussi les tests « chargerPdfmake » et « conventionChargerPdfmake » ;
//  - conventionNomNettoye et conventionNomFichier (decision D-S7-3) : le nom prend maintenant une EXTENSION
//    en parametre (« docx » ou « pdf », deduite du nom reel du fichier, E3-9) et lit l'annee dans
//    Actions.Campagne, jamais dans Conventions.Annee (E3-17) ; conventionNomFichierSigne (toujours .pdf) aussi ;
//  - E1 : le controle de champs « conventionProblemesGenerer » a disparu (plus aucun champ obligatoire).
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

// Echoue si la page (index.html) contient une balise pdfmake, si chargerPdfmake est appelee ailleurs que dans
// conventionChargerPdfmake, ou si conventionChargerPdfmake est appelee quelque part : depuis l'Evolution 3, la
// generation ne charge plus pdfmake (elle charge docx, au clic seulement) ; ni l'ouverture de la page ni de la
// fenetre ne doivent le charger non plus.
test("chargerPdfmake : rien n'est chargé à l'ouverture de la page ni de la fenêtre, et plus aucun appel depuis conventionGenerer (E3)", () => {
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
  assert.equal(appelsConvention.length, 0, "conventionChargerPdfmake n'est plus appelée nulle part (la génération passe par docx)");
  assert.ok(!/pdfmake|pdfMake/i.test(corps("async function conventionGenerer(")), "conventionGenerer ne parle plus de pdfmake");
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

// Donnees d'essai du nom : une action (club 7, dispositif 3, campagne 4) et son modele actif. Depuis l'E3-17, l'annee
// vient de Actions.Campagne -> Campagnes.Campagne (campagne : le texte de l'annee ; null = action sans campagne).
function donneesNom({dispositif = "Match des métiers", club = "Club Exemple", avecAnnee = true, clubDeLAction = 7, campagne = "2031"} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Club: clubDeLAction, Dispositif: 3, Campagne: campagne === null ? 0 : 4}],
      Campagnes: campagne === null ? [] : [{id: 4, Campagne: campagne}],
      Dispositifs: [{id: 3, Dispositif: dispositif}],
      Structures: [{id: 7, Nom: club}],
      Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Avec_annee: avecAnnee}],
    },
    tablesRefusees: [],
  };
}

// Echoue si le nom n'a pas la forme Convention-[dispositif]-[club]-[annee].[extension] avec l'extension donnee,
// si l'extension est devinee quand elle manque ou est inconnue (jamais de « .pdf » ou « .docx » par defaut : le
// bouton de telechargement traite ce cas comme un echec, Q-E3-7), ou si une annee de campagne entouree d'espaces
// laisse ces espaces dans le nom.
test("conventionNomFichier : forme Convention-[dispositif]-[club]-[année].[extension], extension jamais devinée", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomFichier(1, donneesNom(), "docx"), "Convention-Match-metiers-Club-Exemple-2031.docx");
  assert.equal(w.conventionNomFichier(1, donneesNom(), "pdf"), "Convention-Match-metiers-Club-Exemple-2031.pdf");
  assert.equal(w.conventionNomFichier(1, donneesNom({campagne: " 2031 "}), "docx"), "Convention-Match-metiers-Club-Exemple-2031.docx");
  for (const extension of [undefined, "", "odt", "exe", ".docx"]) {
    assert.equal(w.conventionNomFichier(1, donneesNom(), extension), "Convention-Match-metiers-Club-Exemple-2031", `extension ${JSON.stringify(extension)} : aucune extension inventée`);
  }
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
    assert.equal(w.conventionNomFichier(1, donneesNom({dispositif}), "docx"), `Convention-${court}-Club-Exemple-2031.docx`, dispositif);
  }
});

// Echoue si un dispositif sans nom court est raccourci, perd son nom, ou garde accents et caracteres speciaux dans
// le nom du fichier. Q-E3-5 a (E3) : « Aller vers » et « Parcours complet d'insertion par le sport », qui n'ont pas
// de modele, gardent leur nom COMPLET, jamais une forme abregee, pour le Word comme pour le PDF signe.
test("conventionNomFichier : un dispositif sans nom court garde son nom complet nettoyé (Aller vers, Parcours complet…)", async () => {
  const w = await widgetDeNoms();
  assert.equal(
    w.conventionNomFichier(1, donneesNom({dispositif: "Dispositif d'Été n°2"}), "docx"),
    "Convention-Dispositif-d-Ete-n-2-Club-Exemple-2031.docx"
  );
  assert.equal(w.conventionNomFichier(1, donneesNom({dispositif: "Aller vers"}), "docx"), "Convention-Aller-vers-Club-Exemple-2031.docx");
  assert.equal(
    w.conventionNomFichier(1, donneesNom({dispositif: "Parcours complet d'insertion par le sport"}), "docx"),
    "Convention-Parcours-complet-d-insertion-par-le-sport-Club-Exemple-2031.docx"
  );
  assert.equal(w.conventionNomFichierSigne(1, donneesNom({dispositif: "Aller vers"})), "Convention-signee-Aller-vers-Club-Exemple-2031.pdf");
});

// Echoue si un modele sans annee (Avec_annee faux) garde l'annee de la campagne dans le nom, ou
// laisse un tiret final (Convention-...-club-.docx).
test("conventionNomFichier : un modèle sans année donne Convention-[dispositif]-[club].docx, sans tiret en trop", async () => {
  const w = await widgetDeNoms();
  const donnees = donneesNom({dispositif: "Parcours de remobilisation vers l'emploi", avecAnnee: false});
  assert.equal(w.conventionNomFichier(1, donnees, "docx"), "Convention-Remobilisation-Club-Exemple.docx");
  assert.equal(w.conventionNomFichierSigne(1, donnees), "Convention-signee-Remobilisation-Club-Exemple.pdf");
});

// Echoue si une campagne qui n'a pas exactement quatre chiffres (« abc », « 12 », « 20.5 », « 20311 »), ou
// vide, ou absente, est recopiee dans le nom au lieu d'etre omise comme pour un modele sans annee.
test("conventionNomFichier : une campagne invalide, vide ou absente est omise du nom, jamais recopiée", async () => {
  const w = await widgetDeNoms();
  const sansAnnee = w.conventionNomFichier(1, donneesNom({avecAnnee: false}), "docx");
  assert.equal(sansAnnee, "Convention-Match-metiers-Club-Exemple.docx");
  for (const campagne of ["abc", "12", "20.5", "20311", "20 31", "", "   ", null]) {
    assert.equal(w.conventionNomFichier(1, donneesNom({campagne}), "docx"), sansAnnee, `campagne ${JSON.stringify(campagne)}`);
  }
});

// E3-17. Echoue si l'annee vient encore de Conventions.Annee (colonne vide apres un depot libre, ou differente de
// la campagne) au lieu d'Actions.Campagne, pour le nom du Word comme pour celui du PDF signe.
test("E3-17 : l'année du nom vient d'Actions.Campagne, jamais de Conventions.Annee (Word et PDF signé)", async () => {
  const w = await widgetDeNoms();
  for (const annee of [undefined, null, 0, 1999, "abc"]) {
    const donnees = donneesNom({campagne: "2031"});
    donnees.raw.Conventions = [{id: 20, Action: 1, Modele: 10, PDF_genere: ["L", 1], PDF_signe: ["L", 2], ...(annee === undefined ? {} : {Annee: annee})}];
    assert.equal(w.conventionNomFichier(1, donnees, "docx"), "Convention-Match-metiers-Club-Exemple-2031.docx", `Annee = ${JSON.stringify(annee)}`);
    assert.equal(w.conventionNomFichierSigne(1, donnees), "Convention-signee-Match-metiers-Club-Exemple-2031.pdf", `Annee = ${JSON.stringify(annee)}`);
  }
});

// Echoue si l'ancien format d'Actions.Campagne (du texte directement, dans un ancien document) n'est plus lu, ou
// si la reference vers une ligne de Campagnes qui n'existe pas plante au lieu d'omettre l'annee.
test("Actions.Campagne : texte direct (ancien document) lu tel quel, référence introuvable → année omise", async () => {
  const w = await widgetDeNoms();
  const texteDirect = donneesNom();
  texteDirect.raw.Actions[0].Campagne = "2029";
  assert.equal(w.conventionNomFichier(1, texteDirect, "docx"), "Convention-Match-metiers-Club-Exemple-2029.docx");
  const introuvable = donneesNom();
  introuvable.raw.Actions[0].Campagne = 99;
  assert.equal(w.conventionNomFichier(1, introuvable, "docx"), "Convention-Match-metiers-Club-Exemple.docx");
});

// Echoue si le nom du fichier signe n'est pas toujours un .pdf avec la forme Convention-signee-…, ou s'il recopie
// une valeur invalide de la campagne (« abc », « 12 », « 20.5 »), ou perd une annee valide a quatre chiffres.
test("conventionNomFichierSigne : toujours .pdf, une campagne invalide est omise, une valide est gardée", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomFichierSigne(1, donneesNom()), "Convention-signee-Match-metiers-Club-Exemple-2031.pdf");
  for (const campagne of ["abc", "12", "20.5"]) {
    assert.equal(w.conventionNomFichierSigne(1, donneesNom({campagne})), "Convention-signee-Match-metiers-Club-Exemple.pdf", `campagne « ${campagne} »`);
  }
});

// Echoue si le nom du club depasse 40 caracteres, ou si la coupe laisse un tiret a la fin.
test("conventionNomFichier : le nom du club est limité à 40 caractères, sans tiret final", async () => {
  const w = await widgetDeNoms();
  const long = w.conventionNomFichier(1, donneesNom({club: "Association Sportive Omnisports de la Ville de Exemple-sur-Mer Nord"}), "docx");
  assert.equal(long, "Convention-Match-metiers-Association-Sportive-Omnisports-de-la-Vi-2031.docx");

  const coupeSurUnTiret = w.conventionNomFichier(1, donneesNom({club: `A${"a".repeat(38)} Bbb`}), "docx");
  assert.equal(coupeSurUnTiret, `Convention-Match-metiers-A${"a".repeat(38)}-2031.docx`, "39 caractères, le tiret de la coupe est retiré");
});

// Echoue si un club sans nom (vide, fait de caracteres speciaux, ou action sans club) ne
// donne pas « club » dans le nom du fichier.
test("conventionNomFichier : un nom de club vide donne « club »", async () => {
  const w = await widgetDeNoms();
  assert.equal(w.conventionNomFichier(1, donneesNom({club: ""}), "docx"), "Convention-Match-metiers-club-2031.docx");
  assert.equal(w.conventionNomFichier(1, donneesNom({club: "???"}), "docx"), "Convention-Match-metiers-club-2031.docx");
  assert.equal(w.conventionNomFichier(1, donneesNom({clubDeLAction: 0}), "docx"), "Convention-Match-metiers-club-2031.docx");
});

// Echoue si un nom de personne (signataire, representant, leur fonction) entre dans le nom du fichier, ou si un
// caractere hors lettres, chiffres, tirets et extension y passe.
test("conventionNomFichier : jamais de nom de personne, seulement lettres, chiffres, tirets et l'extension", async () => {
  const w = await widgetDeNoms();
  const donnees = donneesNom();
  donnees.raw.Contacts = [{id: 31, Club: 7, Prenom: "Dana", Nom: "Exemple", Fonction: "Directrice adjointe"}];
  donnees.raw.Conventions = [{id: 20, Action: 1, Signataire_club: 31, Representant_agence: "Dana Exemple", Fonction_representant: "Directrice"}];
  const nom = w.conventionNomFichier(1, donnees, "docx");
  assert.ok(!nom.includes("Dana") && !nom.includes("Directrice"), "ni le représentant ni sa fonction");
  assert.ok(/^[A-Za-z0-9-]+\.docx$/.test(nom), "seulement lettres, chiffres, tirets et .docx");
});

// ---------------------------------------------------------------------------
// E1 : plus aucun controle de champ avant « Generer » (docs/ux/convention.md, §3 « Enregistrer
// et Generer », D-E1-17). Les six messages de blocage de l'ancienne version sont supprimes.
// ---------------------------------------------------------------------------

// Echoue si le controle des champs (conventionProblemesGenerer, six messages de blocage de
// l'ancienne version) revient dans le script : un champ vide doit donner des pointillés, pas un blocage.
test("E1 : le controle de champs « conventionProblemesGenerer » n'existe plus (un champ vide ne bloque plus)", async () => {
  const w = await widgetDeNoms();
  assert.equal(typeof w.conventionProblemesGenerer, "undefined");
});
