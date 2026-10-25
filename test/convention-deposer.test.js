"use strict";

// Dépôt du fichier signé, tâche 9.1a (commandes et sélecteur de fichier seulement ; le contrôle
// du fichier, l'envoi et l'écriture dans Grist sont la tâche 9.1b) :
//   - le HTML : « Déposer la convention signée » seulement à l'état Générée, dernier de la
//     rangée ; « Remplacer le fichier signé » seulement à l'état Signée, seul sur sa ligne ;
//   - le champ fichier caché de index.html (accept, hors du bloc, masqué par la feuille) ;
//   - le comportement : le clic ouvre le sélecteur sans rien faire d'autre ; l'annulation du
//     sélecteur est sans effet ; au choix d'un fichier, verrou de la commande utilisée et de
//     « Re-générer » (jamais de « Voir »), texte « Envoi en cours… », région d'attente annoncée,
//     alertes précédentes effacées ; le verrou est levé à la fin.
// Les textes de référence sont ceux de docs/ux/convention.md (§4 et §4.1). Ils sont recopiés
// ici en dur : si le code change un mot, le test doit échouer.
// Le navigateur et Grist sont des doublures de test/helpers/widget.js. Les éléments de la page
// sont ceux du bac à sable (un identifiant, un élément) : on y capte les gestionnaires de clic.
// Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadWidget} = require("./helpers/widget");

const SRC = path.join(__dirname, "..", "src", "actions-dashboard");
const INDEX = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
const CSS = fs.readFileSync(path.join(SRC, "style.css"), "utf8");

const TEXTE_DEPOSER = "Déposer la convention signée";
const TEXTE_REMPLACER = "Remplacer le fichier signé";
const TEXTE_ENVOI = "Envoi en cours…";
const TEXTE_ATTENTE = "Envoi de la convention signée en cours. Cela peut prendre quelques secondes.";
const ALERTE_PRECEDENTE = '<div class="alert alert-error" role="alert"><p class="alert-content">Ancien message fictif.</p></div>';

const PDF = ["L", 41];
const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Une action complète (agence, club, dispositif, adresse) : « Re-générer » n'est pas bloqué.
function donnees(conventions) {
  return {
    raw: {
      Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
      Structures: [{id: 7, Nom: "Club Exemple", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"}],
      Modeles_convention: [{id: 10, Dispositif: 3, Actif: true}],
      Conventions: conventions,
    },
    tablesRefusees: [],
  };
}
const GENEREE = () => donnees([{id: 20, Action: 1, PDF_genere: PDF, Date_generation: secondes(2026, 3, 14)}]);
// Aucune donnée réelle ne produit encore l'état Signée à l'écran : on le fabrique ici, comme
// les tests du bloc (PDF_signe rempli).
const SIGNEE = () => donnees([{id: 20, Action: 1, PDF_genere: PDF, PDF_signe: PDF, Date_generation: secondes(2026, 3, 14), Date_depot: secondes(2026, 11, 27)}]);

function bloc(w, jeu) {
  return decoder(w.conventionBlocContenuHtml(1, jeu));
}

// La rangée des boutons : le contenu de <div class="convention-actions">, ou null.
function rangee(html) {
  const m = /<div class="convention-actions">([\s\S]*?)<\/div>/.exec(html);
  return m ? m[1] : null;
}

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Une opération qu'on libère à la main : on regarde l'écran « pendant l'envoi ».
function enAttente() {
  let resoudre;
  let rejeter;
  const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
  return {promesse, resoudre, rejeter};
}

// ---------------------------------------------------------------------------
// Faux écran
// ---------------------------------------------------------------------------
// preparer(jeu) charge le widget, pose les données, puis branche les commandes comme renderEdit
// le fait (bindConventionDepot) en captant leurs gestionnaires de clic. Il note :
//   depots   : chaque appel de conventionDeposerFichier ({actionId, fichier, ...}) ; la
//              doublure ne rend la main que quand le test libère `envoi` ;
//   clics    : le nombre de champ.click() (ouvertures du sélecteur) ;
//   focus    : les focus() demandés par le script.
// Aucune écriture dans Grist : applyUserActions et fetch ne sont pas appelés (le test le vérifie).

async function preparer(jeu) {
  const w = loadWidget();
  await attendre();
  await attendre();
  w.state.raw = jeu.raw;
  w.state.tablesRefusees = jeu.tablesRefusees;

  const doc = w.document;
  const focus = [];
  const origine = doc.getElementById;
  doc.getElementById = (id) => {
    const element = origine(id);
    if (!element.suivi) {
      element.suivi = true;
      element.focus = () => { focus.push(id); };
    }
    return element;
  };

  const ecritures = [];
  w.grist.docApi.applyUserActions = (...args) => { ecritures.push(args); return Promise.resolve({}); };
  w.window.fetch = (...args) => { ecritures.push(args); return Promise.reject(new Error("pas de réseau en test")); };

  // Le sélecteur de fichier : champ.click() est compté ; le test « choisit » ensuite un fichier.
  const champ = doc.getElementById("conventionFichier");
  let clics = 0;
  champ.click = () => { clics += 1; };

  // Les commandes : on capte leur gestionnaire de clic, puis on branche comme la fiche le fait.
  const ecouteurs = {};
  for (const id of ["conventionDeposer", "conventionRemplacer"]) {
    doc.getElementById(id).addEventListener = (type, fonction) => { if (type === "click") ecouteurs[id] = fonction; };
  }

  // Les textes des commandes (<span class="btn-content">), écrits comme le fait la page au repos.
  const textes = {
    conventionDeposer: TEXTE_DEPOSER,
    conventionRemplacer: TEXTE_REMPLACER,
    conventionRegenerer: "Re-générer",
    conventionVoir: "Voir la convention",
  };
  for (const [id, texte] of Object.entries(textes)) doc.getElementById(id).querySelector(".btn-content").textContent = texte;
  // « Re-générer » au repos : actif, il annonce une fenêtre.
  doc.getElementById("conventionRegenerer").setAttribute("aria-haspopup", "dialog");

  // Doublure du point d'appel de la 9.1b : elle note l'appel et l'état de l'écran à cet instant.
  const depots = [];
  const envoi = enAttente();
  w.window.conventionDeposerFichier = (actionId, fichier) => {
    depots.push({actionId, fichier, ecran: instantane()});
    return envoi.promesse;
  };

  const element = (id) => doc.getElementById(id);
  const libelle = (id) => element(id).querySelector(".btn-content").textContent;
  const grise = (id) => element(id).getAttribute("aria-disabled") === "true";
  // Ce que la personne voit des commandes et de la zone d'attente, à un instant donné.
  function instantane() {
    return {
      deposerGrise: grise("conventionDeposer"), deposerTexte: libelle("conventionDeposer"),
      remplacerGrise: grise("conventionRemplacer"), remplacerTexte: libelle("conventionRemplacer"),
      regenererGrise: grise("conventionRegenerer"), voirGrise: grise("conventionVoir"),
      attente: element("conventionDepotAttente").innerHTML,
      alerte: element("conventionAlerte").innerHTML,
    };
  }

  w.bindConventionDepot(1);

  return {
    w, champ, element, libelle, grise, instantane, depots, envoi, focus, ecritures, ecouteurs,
    clics: () => clics,
    // Clic sur une commande : ouvre le sélecteur (ou rien si elle est grisée).
    cliquer: (id) => ecouteurs[id]({}),
    // Choix d'un fichier dans le sélecteur : le champ reçoit le fichier, puis l'événement change.
    // Rend la promesse du gestionnaire (le navigateur l'ignore) pour attendre la fin si on veut.
    choisir: (fichier) => {
      champ.files = fichier ? [fichier] : [];
      champ.value = fichier ? "C:\\fakepath\\convention.pdf" : "";
      return champ.onchange();
    },
  };
}

const FICHIER = {name: "convention-signee-fictive.pdf", size: 1234, type: "application/pdf"};

// ---------------------------------------------------------------------------
// 1. Le HTML du bloc : « Déposer » (Générée) et « Remplacer » (Signée)
// ---------------------------------------------------------------------------

// Echoue si « Déposer la convention signée » apparait ailleurs qu'a l'etat Generee (A generer,
// Signee, Sans modele, Droits insuffisants), manque a l'etat Generee, y est en double, ou change
// de libelle, de type, de classes (btn btn-secondary, sans btn-sm ni btn-primary) ou
// d'identifiant ; s'il prend aria-haspopup (il n'ouvre aucune fenetre : il ouvre le selecteur du
// navigateur), aria-disabled ou disabled avant le clic ; ou s'il prend un texte cache.
test("« Déposer la convention signée » n'existe qu'à l'état Générée, avec son libellé exact et sans attribut d'accessibilité au repos", () => {
  const w = loadWidget();
  const autres = {
    "À générer": donnees([]),
    "Signée": SIGNEE(),
    "Sans modèle": {...donnees([]), raw: {...donnees([]).raw, Modeles_convention: []}},
    "Droits insuffisants": {...donnees([]), tablesRefusees: ["Conventions"]},
  };
  for (const [nom, jeu] of Object.entries(autres)) {
    assert.ok(!bloc(w, jeu).includes("conventionDeposer"), `${nom} : pas de « Déposer »`);
    assert.ok(!bloc(w, jeu).includes(TEXTE_DEPOSER), `${nom} : pas du libellé « Déposer »`);
  }
  const html = bloc(w, GENEREE());
  assert.equal(html.split('id="conventionDeposer"').length - 1, 1, "un seul « Déposer » à l'état Générée");
  assert.ok(html.includes('<button class="btn btn-secondary" type="button" id="conventionDeposer"><span class="btn-content">Déposer la convention signée</span></button>'),
    "bouton secondaire, type button, libellé exact dans btn-content, sans texte caché ni attribut d'accessibilité");
  assert.ok(!html.includes("btn-sm") && !html.includes("btn-primary"), "ni btn-sm ni bouton principal");
});

// Echoue si « Déposer » n'est pas le troisieme et dernier element de la rangee, juste apres
// « Re-générer » (sans rien entre les deux), ou s'il sort de la rangee convention-actions.
test("« Déposer la convention signée » est le dernier bouton de la rangée, juste après « Re-générer »", () => {
  const w = loadWidget();
  const html = bloc(w, GENEREE());
  const ligne = rangee(html);
  assert.ok(ligne, "la rangée convention-actions existe");
  const ids = [...ligne.matchAll(/<button\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["conventionVoir", "conventionRegenerer", "conventionDeposer"], "ordre : Voir, Re-générer, Déposer");
  assert.ok(ligne.endsWith('id="conventionDeposer"><span class="btn-content">Déposer la convention signée</span></button>'), "« Déposer » termine la rangée, rien après lui");
  assert.match(ligne, /<\/button><button class="btn btn-secondary" type="button" id="conventionDeposer"/, "juste après « Re-générer », sans rien entre les deux boutons");
});

// Echoue si le lien « Remplacer le fichier signé » apparait ailleurs qu'a l'etat Signee, manque
// a l'etat Signee ou y est en double ; s'il perd btn btn-link (il devient un bouton plein), prend
// btn-secondary, btn-sm ou une icone ; s'il est dans la rangee convention-actions ou partage son
// <div> avec autre chose ; s'il porte aria-haspopup, aria-disabled ou disabled au repos ; ou si
// l'etat Signee affiche aussi « Déposer ».
test("« Remplacer le fichier signé » n'existe qu'à l'état Signée, en lien (btn-link), seul sur sa ligne dans son propre <div>", () => {
  const w = loadWidget();
  const autres = {
    "À générer": donnees([]),
    "Générée": GENEREE(),
    "Sans modèle": {...donnees([]), raw: {...donnees([]).raw, Modeles_convention: []}},
    "Droits insuffisants": {...donnees([]), tablesRefusees: ["Conventions"]},
  };
  for (const [nom, jeu] of Object.entries(autres)) {
    assert.ok(!bloc(w, jeu).includes("conventionRemplacer"), `${nom} : pas de « Remplacer »`);
    assert.ok(!bloc(w, jeu).includes(TEXTE_REMPLACER), `${nom} : pas du libellé « Remplacer »`);
  }
  const html = bloc(w, SIGNEE());
  assert.equal(html.split('id="conventionRemplacer"').length - 1, 1, "un seul « Remplacer » à l'état Signée");
  assert.ok(html.includes('<div><button class="btn btn-link" type="button" id="conventionRemplacer"><span class="btn-content">Remplacer le fichier signé</span></button></div>'),
    "lien btn-link, type button, seul dans son <div>, libellé exact dans btn-content, sans attribut d'accessibilité");
  assert.ok(!html.includes("convention-actions"), "pas de rangée de boutons : le lien est seul sur sa ligne");
  assert.ok(!html.includes("conventionDeposer"), "pas de « Déposer » à l'état Signée");
  assert.deepEqual(html.match(/<button\b/g), ["<button"], "un seul bouton à l'état Signée");
  assert.ok(!/btn-secondary|btn-sm|btn-primary|icon-/.test(html), "ni bouton secondaire ou principal, ni petite taille, ni icône");
});

// Echoue si la zone d'attente (#conventionDepotAttente, role="status") manque dans l'un des
// cinq etats, est dans la partie refaite du bloc (un rafraichissement la viderait pendant l'envoi
// et l'annonce serait perdue), ou est placee apres le contenu ; ou si elle n'est pas vide au repos.
test("la zone d'attente du dépôt (role=\"status\") est dans le bloc, vide, avant le contenu refait, dans les cinq états", () => {
  const w = loadWidget();
  const jeux = {
    "À générer": donnees([]), "Générée": GENEREE(), "Signée": SIGNEE(),
    "Sans modèle": {...donnees([]), raw: {...donnees([]).raw, Modeles_convention: []}},
    "Droits insuffisants": {...donnees([]), tablesRefusees: ["Conventions"]},
  };
  for (const [nom, jeu] of Object.entries(jeux)) {
    const html = w.conventionBlocHtml(1, jeu);
    assert.equal(html.split('<div class="convention-depot-attente" id="conventionDepotAttente" role="status"></div>').length - 1, 1, `${nom} : une zone d'attente vide`);
    assert.ok(html.indexOf('id="conventionDepotAttente"') < html.indexOf('id="conventionBlocContenu"'), `${nom} : avant le contenu refait`);
    assert.ok(!w.conventionBlocContenuHtml(1, jeu).includes("conventionDepotAttente"), `${nom} : pas dans la partie refaite`);
  }
});

// ---------------------------------------------------------------------------
// 2. Le champ fichier caché (index.html) et la feuille de style
// ---------------------------------------------------------------------------

// Echoue si le champ #conventionFichier disparait de index.html, n'est plus un champ de type
// file, change d'accept (« application/pdf,.pdf » : le selecteur ne propose que des PDF), reste
// atteignable (tabindex="-1" et aria-hidden="true" attendus : les commandes sont les seuls
// points d'entree), perd sa classe convention-file, ou est place dans le bloc de la fiche (le
// bloc est refait apres chaque action : le champ et son gestionnaire seraient perdus).
test("le champ fichier caché #conventionFichier est dans index.html : type file, accept PDF, hors de l'ordre de tabulation, hors du bloc", () => {
  const champs = INDEX.match(/<input\b[^>]*\sid="conventionFichier"[^>]*>/g) || [];
  assert.equal(champs.length, 1, "un seul champ #conventionFichier");
  const champ = champs[0];
  assert.match(champ, /\stype="file"/, "champ de type file");
  assert.match(champ, /\saccept="application\/pdf,\.pdf"/, "accept exact");
  assert.match(champ, /\sclass="convention-file"|\sclass="[^"]*\bconvention-file\b[^"]*"/, "classe convention-file");
  assert.match(champ, /\stabindex="-1"/, "hors de l'ordre de tabulation");
  assert.match(champ, /\saria-hidden="true"/, "caché des lecteurs d'écran");
  assert.ok(!/\smultiple\b/.test(champ), "un seul fichier à la fois");
  assert.ok(!/\sid="conventionBloc"/.test(INDEX) && !INDEX.includes("conventionBloc"), "index.html ne contient pas le bloc de la fiche");
  const w = loadWidget();
  for (const jeu of [GENEREE(), SIGNEE()]) {
    assert.ok(!w.conventionBlocHtml(1, jeu).includes("conventionFichier"), "le champ n'est pas dans le bloc refait");
  }
});

// Echoue si style.css ne cache plus le champ (le selecteur natif « Choisir un fichier » apparaitrait
// dans la page) ou ne declare plus la zone d'attente vide sans place (elle ajouterait un vide dans
// la carte).
test("style.css cache le champ fichier (display: none) et déclare la zone d'attente vide sans place", () => {
  assert.match(CSS, /\.convention-file\s*\{\s*display:\s*none;?\s*\}/, ".convention-file { display: none }");
  assert.match(CSS, /\.convention-depot-attente:empty\s*\{[^}]*margin-bottom:\s*-16px/, ".convention-depot-attente:empty ne prend pas de place");
});

// ---------------------------------------------------------------------------
// 3. Le clic ouvre le sélecteur, sans rien faire d'autre
// ---------------------------------------------------------------------------

// Echoue si le clic sur « Déposer » n'ouvre pas le selecteur (champ.click()) exactement une fois,
// ou s'il fait autre chose : verrou (aria-disabled), « Envoi en cours… », message d'attente,
// alerte effacee, appel de conventionDeposerFichier, ecriture dans Grist, requete reseau, deplacement du focus.
test("clic sur « Déposer » : le sélecteur s'ouvre, rien d'autre ne change (ni verrou, ni texte, ni message, ni envoi)", async () => {
  const m = await preparer(GENEREE());
  m.element("conventionAlerte").innerHTML = ALERTE_PRECEDENTE;
  const avant = m.instantane();
  m.cliquer("conventionDeposer");
  assert.equal(m.clics(), 1, "le sélecteur est ouvert une fois");
  assert.deepEqual(m.instantane(), avant, "aucun changement à l'écran (alerte précédente conservée)");
  assert.equal(m.libelle("conventionDeposer"), TEXTE_DEPOSER, "texte inchangé");
  assert.equal(m.element("conventionDepotAttente").innerHTML, "", "pas de message d'attente");
  assert.equal(m.depots.length, 0, "conventionDeposerFichier n'est pas appelée");
  assert.deepEqual(m.ecritures, [], "aucune écriture dans Grist, aucune requête réseau");
  assert.deepEqual(m.focus, [], "le focus ne bouge pas");
});

// Echoue si le lien « Remplacer » n'ouvre pas le selecteur, ou fait autre chose que l'ouvrir
// (memes controles que pour « Déposer »).
test("clic sur « Remplacer le fichier signé » : le sélecteur s'ouvre, rien d'autre ne change", async () => {
  const m = await preparer(SIGNEE());
  m.element("conventionAlerte").innerHTML = ALERTE_PRECEDENTE;
  const avant = m.instantane();
  m.cliquer("conventionRemplacer");
  assert.equal(m.clics(), 1, "le sélecteur est ouvert une fois");
  assert.deepEqual(m.instantane(), avant, "aucun changement à l'écran");
  assert.equal(m.depots.length, 0, "conventionDeposerFichier n'est pas appelée");
  assert.deepEqual(m.ecritures, [], "aucune écriture dans Grist, aucune requête réseau");
  assert.deepEqual(m.focus, [], "le focus ne bouge pas");
});

// Echoue si le clic declenche le depot au lieu du seul evenement change (l'envoi doit partir du
// choix d'un fichier, jamais du clic), ou si une commande grisee (aria-disabled) ouvre encore
// le selecteur.
test("une commande grisée (aria-disabled) n'ouvre pas le sélecteur", async () => {
  const m = await preparer(GENEREE());
  m.element("conventionDeposer").setAttribute("aria-disabled", "true");
  m.cliquer("conventionDeposer");
  assert.equal(m.clics(), 0, "le sélecteur reste fermé");
  assert.equal(m.depots.length, 0, "aucun envoi");
});

// ---------------------------------------------------------------------------
// 4. Annulation du sélecteur : aucun fichier choisi, rien ne se passe
// ---------------------------------------------------------------------------

// Echoue si l'annulation du selecteur (change sans fichier : liste vide ou absente) pose un
// verrou, ecrit un texte ou un message d'attente, efface l'alerte deja affichee, appelle
// conventionDeposerFichier, ecrit dans Grist ou deplace le focus.
test("annulation du sélecteur (aucun fichier) : rien ne se passe, l'alerte affichée est conservée", async () => {
  for (const files of [[], undefined, null]) {
    const m = await preparer(GENEREE());
    m.element("conventionAlerte").innerHTML = ALERTE_PRECEDENTE;
    const avant = m.instantane();
    m.champ.files = files;
    await m.champ.onchange();
    assert.deepEqual(m.instantane(), avant, `aucun changement à l'écran (files = ${JSON.stringify(files)})`);
    assert.equal(m.depots.length, 0, "conventionDeposerFichier n'est pas appelée");
    assert.deepEqual(m.ecritures, [], "aucune écriture, aucune requête");
    assert.deepEqual(m.focus, [], "le focus ne bouge pas");
  }
});

// Echoue si, apres une annulation, les commandes restent verrouillees : un nouveau clic ne
// rouvrirait plus le selecteur et un fichier choisi ensuite ne partirait pas.
test("après une annulation, on peut rouvrir le sélecteur puis choisir un fichier", async () => {
  const m = await preparer(GENEREE());
  m.cliquer("conventionDeposer");
  await m.choisir(null);
  m.cliquer("conventionDeposer");
  assert.equal(m.clics(), 2, "le sélecteur s'ouvre une seconde fois");
  m.choisir(FICHIER);
  assert.equal(m.depots.length, 1, "le fichier choisi ensuite part bien");
  m.envoi.resoudre();
  await attendre();
});

// ---------------------------------------------------------------------------
// 5. Au choix d'un fichier : verrou, texte, attente annoncée, alertes effacées
// ---------------------------------------------------------------------------

// Echoue si, des le choix d'un fichier par « Déposer » : conventionDeposerFichier n'est pas
// appelee exactement une fois avec (actionId, fichier choisi) ; « Déposer » n'est pas grise par
// aria-disabled="true" (ou prend disabled, ce qui lui ferait perdre le focus) ; son texte n'est
// pas « Envoi en cours… » ; « Re-générer » n'est pas grise (aria-disabled, sans disabled, et
// sans aria-haspopup) ; « Voir la convention » est grise ou change de texte ; le verrou n'est pas
// deja pose au moment de l'appel (avant toute operation asynchrone) ; le focus bouge.
test("choix d'un fichier après « Déposer » : « Déposer » et « Re-générer » sont verrouillés, « Déposer » affiche « Envoi en cours… », « Voir » reste utilisable", async () => {
  const m = await preparer(GENEREE());
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);

  assert.equal(m.depots.length, 1, "conventionDeposerFichier est appelée une fois");
  assert.equal(m.depots[0].actionId, 1, "avec l'action ouverte");
  assert.equal(m.depots[0].fichier, FICHIER, "avec le fichier choisi");
  assert.equal(m.depots[0].ecran.deposerGrise, true, "le verrou est posé avant l'appel (avant toute opération asynchrone)");
  assert.equal(m.depots[0].ecran.deposerTexte, TEXTE_ENVOI, "le texte est déjà « Envoi en cours… » à l'appel");

  assert.equal(m.element("conventionDeposer").getAttribute("aria-disabled"), "true", "« Déposer » : aria-disabled=\"true\"");
  assert.equal(m.element("conventionDeposer").disabled, false, "« Déposer » : jamais disabled (le focus reste en place)");
  assert.equal(m.libelle("conventionDeposer"), TEXTE_ENVOI, "« Déposer » : texte « Envoi en cours… »");
  assert.equal(m.element("conventionRegenerer").getAttribute("aria-disabled"), "true", "« Re-générer » : aria-disabled=\"true\"");
  assert.equal(m.element("conventionRegenerer").disabled, false, "« Re-générer » : jamais disabled");
  assert.equal(m.element("conventionRegenerer").getAttribute("aria-haspopup"), null, "« Re-générer » grisé n'annonce plus de fenêtre");
  assert.equal(m.libelle("conventionRegenerer"), "Re-générer", "« Re-générer » garde son texte");
  assert.equal(m.element("conventionVoir").getAttribute("aria-disabled"), null, "« Voir la convention » reste utilisable");
  assert.equal(m.libelle("conventionVoir"), "Voir la convention", "« Voir la convention » garde son texte");
  assert.deepEqual(m.focus, [], "le focus ne bouge pas");

  m.envoi.resoudre();
  await termine;
});

// Echoue si, au choix d'un fichier par « Remplacer », c'est « Déposer » qui est verrouille a la
// place (c'est la commande utilisee qui prend le verrou et le texte), si « Remplacer » n'est pas
// grise avec « Envoi en cours… », ou si « Voir » est touche.
test("choix d'un fichier après « Remplacer le fichier signé » : « Remplacer » est verrouillé et affiche « Envoi en cours… », pas « Déposer »", async () => {
  const m = await preparer(SIGNEE());
  m.cliquer("conventionRemplacer");
  const termine = m.choisir(FICHIER);

  assert.equal(m.depots.length, 1, "conventionDeposerFichier est appelée une fois");
  assert.equal(m.depots[0].fichier, FICHIER, "avec le fichier choisi");
  assert.equal(m.depots[0].ecran.remplacerGrise, true, "le verrou est posé avant l'appel");
  assert.equal(m.element("conventionRemplacer").getAttribute("aria-disabled"), "true", "« Remplacer » : aria-disabled=\"true\"");
  assert.equal(m.element("conventionRemplacer").disabled, false, "« Remplacer » : jamais disabled");
  assert.equal(m.libelle("conventionRemplacer"), TEXTE_ENVOI, "« Remplacer » : texte « Envoi en cours… »");
  assert.equal(m.element("conventionDeposer").getAttribute("aria-disabled"), null, "« Déposer » n'est pas la commande utilisée : pas verrouillé");
  assert.equal(m.libelle("conventionDeposer"), TEXTE_DEPOSER, "« Déposer » garde son texte");
  assert.equal(m.element("conventionVoir").getAttribute("aria-disabled"), null, "« Voir la convention » reste utilisable");

  m.envoi.resoudre();
  await termine;
});

// Echoue si la region role="status" #conventionDepotAttente ne recoit pas la phrase exacte
// « Envoi de la convention signée en cours. Cela peut prendre quelques secondes. » des le choix
// du fichier (elle serait annoncee trop tard ou pas du tout), si la phrase est ailleurs que dans
// cette region, ou si la region perd son role.
test("choix d'un fichier : la région d'attente (role=\"status\") annonce « Envoi de la convention signée en cours. Cela peut prendre quelques secondes. »", async () => {
  const m = await preparer(GENEREE());
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);

  const html = m.element("conventionDepotAttente").innerHTML;
  assert.equal(decoder(html.replace(/<[^>]+>/g, "")), TEXTE_ATTENTE, "phrase exacte");
  assert.equal(m.depots[0].ecran.attente, html, "la phrase est déjà là quand l'envoi commence");
  assert.ok(!m.element("conventionAlerte").innerHTML.includes("Envoi"), "la phrase n'est pas dans la zone des alertes");

  m.envoi.resoudre();
  await termine;
});

// Echoue si une alerte precedente du bloc (erreur ou reussite de « Voir », d'un depot ou d'une
// generation) reste affichee apres le choix d'un fichier : elle serait lue avec l'envoi en cours.
test("choix d'un fichier : l'alerte précédente du bloc est effacée", async () => {
  const m = await preparer(GENEREE());
  m.element("conventionAlerte").innerHTML = ALERTE_PRECEDENTE;
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);

  assert.equal(m.element("conventionAlerte").innerHTML, "", "la zone des alertes est vide");
  assert.equal(m.depots[0].ecran.alerte, "", "déjà vide quand l'envoi commence");

  m.envoi.resoudre();
  await termine;
});

// Echoue si le champ n'est pas vide apres le choix (value = ""), ce qui empecherait de choisir
// deux fois le meme fichier : le navigateur n'enverrait plus change.
test("choix d'un fichier : le champ est vidé tout de suite, pour pouvoir choisir deux fois le même fichier", async () => {
  const m = await preparer(GENEREE());
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);
  assert.equal(m.champ.value, "", "champ.value vidé");
  m.envoi.resoudre();
  await termine;
});

// Echoue si, pendant l'envoi, un deuxieme choix de fichier part aussi (deux envois en meme
// temps), ou si un clic sur la commande utilisee rouvre le selecteur.
test("pendant l'envoi : un second choix de fichier est ignoré et la commande utilisée n'ouvre plus le sélecteur", async () => {
  const m = await preparer(GENEREE());
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);
  assert.equal(m.clics(), 1);

  m.cliquer("conventionDeposer");
  assert.equal(m.clics(), 1, "« Déposer » verrouillé : le sélecteur ne se rouvre pas");
  await m.choisir({name: "autre-fictif.pdf", size: 10, type: "application/pdf"});
  assert.equal(m.depots.length, 1, "un seul envoi");

  m.envoi.resoudre();
  await termine;
});

// Echoue si le verrou n'est pas leve a la fin de l'envoi, qu'il reussisse ou qu'il echoue :
// « Déposer » et « Re-générer » resteraient gries, « Envoi en cours… » resterait affiche, la
// region d'attente resterait pleine, ou « Re-générer » ne retrouverait pas aria-haspopup. Un
// echec (promesse rejetee) ne doit pas laisser l'ecran bloque.
test("à la fin de l'envoi (réussi ou en échec) : commandes dégrisées, textes d'origine, région d'attente vidée", async () => {
  for (const issue of ["réussite", "échec"]) {
    const m = await preparer(GENEREE());
    m.cliquer("conventionDeposer");
    const termine = m.choisir(FICHIER);
    assert.equal(m.grise("conventionDeposer"), true, `${issue} : verrouillé pendant l'envoi`);

    if (issue === "réussite") m.envoi.resoudre(); else m.envoi.rejeter(new Error("échec fictif"));
    await termine.catch(() => {});

    assert.equal(m.grise("conventionDeposer"), false, `${issue} : « Déposer » dégrisé`);
    assert.equal(m.libelle("conventionDeposer"), TEXTE_DEPOSER, `${issue} : texte d'origine`);
    assert.equal(m.grise("conventionRegenerer"), false, `${issue} : « Re-générer » dégrisé`);
    assert.equal(m.element("conventionRegenerer").getAttribute("aria-haspopup"), "dialog", `${issue} : « Re-générer » annonce de nouveau sa fenêtre`);
    assert.equal(m.element("conventionDepotAttente").innerHTML, "", `${issue} : région d'attente vidée`);
    m.cliquer("conventionDeposer");
    assert.equal(m.clics(), 2, `${issue} : le sélecteur peut se rouvrir`);
  }
});

// Echoue si « Re-générer », grise parce qu'un element manque (agence, club, dispositif, adresse),
// est degrise a la fin de l'envoi : il ne doit retrouver son etat actif que sans blocage.
test("à la fin de l'envoi, « Re-générer » reste grisé si la génération est bloquée (un élément manque)", async () => {
  const jeu = GENEREE();
  jeu.raw.Actions[0].Agence = 0;
  const m = await preparer(jeu);
  m.element("conventionRegenerer").setAttribute("aria-disabled", "true");
  m.element("conventionRegenerer").removeAttribute("aria-haspopup");
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);
  m.envoi.resoudre();
  await termine;
  assert.equal(m.grise("conventionRegenerer"), true, "« Re-générer » reste grisé");
  assert.equal(m.element("conventionRegenerer").getAttribute("aria-haspopup"), null, "sans aria-haspopup");
  assert.equal(m.grise("conventionDeposer"), false, "« Déposer » est dégrisé");
});

// Echoue si le bloc refait pendant l'envoi (HTML reconstruit) perd le verrou : « Déposer » doit
// alors etre ecrit grise, avec « Envoi en cours… », et « Re-générer » grise sans aria-haspopup.
test("bloc refait pendant l'envoi : « Déposer » et « Re-générer » sont écrits verrouillés, « Voir » reste actif", async () => {
  const m = await preparer(GENEREE());
  m.cliquer("conventionDeposer");
  const termine = m.choisir(FICHIER);

  const html = bloc(m.w, GENEREE());
  assert.match(html, /<button class="btn btn-secondary" type="button" id="conventionDeposer" aria-disabled="true"><span class="btn-content">Envoi en cours…<\/span><\/button>/, "« Déposer » reconstruit : grisé, « Envoi en cours… »");
  const regenerer = /<button\b[^>]*\sid="conventionRegenerer"[^>]*>/.exec(html)[0];
  assert.ok(regenerer.includes('aria-disabled="true"') && !regenerer.includes("aria-haspopup") && !/\sdisabled\b/.test(regenerer), "« Re-générer » reconstruit : aria-disabled, sans aria-haspopup, sans disabled");
  const voir = /<button\b[^>]*\sid="conventionVoir"[^>]*>/.exec(html)[0];
  assert.ok(!/aria-disabled|\sdisabled\b/.test(voir), "« Voir » reconstruit : actif");

  m.envoi.resoudre();
  await termine;
  assert.ok(!bloc(m.w, GENEREE()).includes("aria-disabled"), "après l'envoi, le bloc refait n'a plus de verrou");
});
