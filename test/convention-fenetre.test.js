"use strict";

// Bouton « Générer la convention » et fenetre « Convention » (tache 5.1a) : bouton
// present seulement a l'etat A generer, message de blocage, ouverture et fermeture
// de la fenetre, informations du club et de l'agence en lecture seule, echappement
// des valeurs venant de Grist, focus (Echap, Tab, Maj+Tab).
// Les textes de reference sont ceux de docs/ux/convention.md. Ils sont recopies
// ici en dur : si le code change un mot, le test doit echouer.
// Donnees fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadWidget} = require("./helpers/widget");

const SRC = path.join(__dirname, "..", "src", "actions-dashboard");
const CSS = fs.readFileSync(path.join(SRC, "style.css"), "utf8");
const INDEX = fs.readFileSync(path.join(SRC, "index.html"), "utf8");

// Midi UTC : la date reste la meme dans tous les fuseaux horaires.
const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;
const PDF = ["L", 41];

const LIBELLE = "Générer la convention";
const CACHE = "Convention impossible à générer : ";
const BLOCAGES = {
  agence: "Renseignez l'agence de l'action dans sa fiche.",
  club: "Renseignez le club de l'action.",
  dispositif: "Renseignez le dispositif de l'action dans sa fiche.",
  adresse: "Renseignez l'adresse du club dans sa fiche.",
};

const CLUB = {
  id: 7, Nom: "Club Exemple", SIRET: "12345678901234",
  Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer",
};
const AGENCE = {
  id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple",
  Complement_adresse: "Bâtiment A", Code_postal: "75002", Ville: "Exemple-Ville",
};

// Jeu d'essai : une action complete (agence, club, dispositif, adresse du club) avec
// un modele actif. Chaque test ne change que ce qui l'interesse.
function donnees({action = {}, club = {}, agence = {}, conventions = [], modeles, refusees = []} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, ...action}],
      Structures: [{...CLUB, ...club}],
      Agences: [{...AGENCE, ...agence}],
      Modeles_convention: modeles || [{id: 10, Dispositif: 3, Actif: true}],
      Conventions: conventions,
    },
    tablesRefusees: refusees,
  };
}

const convention = (champs) => ({id: 20, Action: 1, ...champs});

// Un element manquant a la fois (la cle est l'element, comme dans conventionBlocage).
const MANQUES = {
  agence: {action: {Agence: 0}},
  club: {action: {Club: 0}},
  dispositif: {action: {Dispositif: 0}},
  adresse: {club: {Adresse: "", Code_postal: "", Ville: ""}},
};

// ---------------------------------------------------------------------------
// Lecture du HTML produit par le widget
// ---------------------------------------------------------------------------

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Balise ouvrante (de « < » a « > ») qui porte cet identifiant, ou null.
function balise(html, id) {
  const m = new RegExp(`<[a-z0-9]+\\b[^>]*\\sid="${id}"[^>]*>`).exec(html);
  return m ? m[0] : null;
}

// Valeur d'un attribut dans une balise ouvrante, ou null s'il est absent.
function attribut(tag, nom) {
  const m = new RegExp(`\\s${nom}="([^"]*)"`).exec(tag);
  return m ? decoder(m[1]) : null;
}

// Texte visible d'un element (balises retirees), ou null si l'element n'existe pas.
function texteDe(html, nomBalise, id) {
  const m = new RegExp(`<${nomBalise}\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</${nomBalise}>`).exec(html);
  return m ? decoder(m[1].replace(/<[^>]+>/g, "")) : null;
}

// Contenu de la zone #conventionBlocage, ou null si elle n'existe pas.
function zoneBlocage(html) {
  const m = /<div id="conventionBlocage" role="status">([\s\S]*?)<\/div>/.exec(html);
  return m ? m[1] : null;
}

// Valeur d'un champ de la fenetre (input : attribut value ; textarea : son contenu).
function champ(html, id) {
  const input = new RegExp(`<input\\b[^>]*\\sid="${id}"[^>]*\\svalue="([^"]*)"`).exec(html);
  if (input) return decoder(input[1]);
  const zone = new RegExp(`<textarea\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</textarea>`).exec(html);
  return zone ? decoder(zone[1]) : null;
}

function libelleDe(html, id) {
  const m = new RegExp(`<label\\b[^>]*\\sfor="${id}"[^>]*>([\\s\\S]*?)</label>`).exec(html);
  return m ? decoder(m[1]) : null;
}

const compte = (html, motif) => (html.match(motif) || []).length;

// ---------------------------------------------------------------------------
// Faux navigateur pour les clics, le clavier et le focus
// ---------------------------------------------------------------------------
// Les doublures de test/helpers/widget.js ne gardent ni les ecouteurs ni le focus.
// On remplace ici, pour un seul widget, les quelques methodes de `document` dont la
// fenetre se sert. Les elements sont recrees a chaque fois que le contenu de
// #conventionModal change, comme le ferait un vrai navigateur. Tout ce qui n'est pas
// lie a la convention retombe sur les doublures d'origine.
// Les tests qui s'en servent sont synchrones : le chargement asynchrone du widget
// (load) n'a donc pas le temps de remplacer state.raw avant la fin du test.

function monter(jeu, options = {}) {
  const w = loadWidget();
  const doc = w.document;
  w.state.raw = jeu.raw;
  w.state.tablesRefusees = jeu.tablesRefusees;

  const origine = {getElementById: doc.getElementById, querySelectorAll: doc.querySelectorAll};
  const registre = new Map();
  let actif = null;
  let contenu = "";

  function fabriquer(id) {
    const attributs = {};
    const ecouteurs = {};
    const element = {
      id, attributs, ecouteurs,
      getAttribute: (nom) => (nom in attributs ? attributs[nom] : null),
      setAttribute: (nom, valeur) => { attributs[nom] = String(valeur); },
      addEventListener: (type, f) => { (ecouteurs[type] ||= []).push(f); },
      removeEventListener: (type, f) => { ecouteurs[type] = (ecouteurs[type] || []).filter((g) => g !== f); },
      focus: () => { actif = element; },
      click: () => { (ecouteurs.click || []).slice().forEach((f) => f({})); },
    };
    return element;
  }

  const hote = fabriquer("conventionModal");
  Object.defineProperty(hote, "innerHTML", {
    get: () => contenu,
    set: (valeur) => {
      contenu = valeur;
      for (const id of [...registre.keys()]) {
        if (id !== "conventionModal" && id !== "conventionGenerer") registre.delete(id);
      }
    },
  });

  // Le bouton est dessine par le widget, puis ses attributs sont recopies : ce que
  // le script lit est ce qu'il a ecrit. `options.attributs` force un attribut.
  const bouton = fabriquer("conventionGenerer");
  const tag = balise(w.conventionGenererHtml(1, jeu), "conventionGenerer");
  for (const m of tag.matchAll(/\s([a-z-]+)="([^"]*)"/g)) bouton.attributs[m[1]] = decoder(m[2]);
  Object.assign(bouton.attributs, options.attributs || {});

  registre.set("conventionModal", hote);
  registre.set("conventionGenerer", bouton);

  const existe = (id) => registre.has(id) || contenu.includes(`id="${id}"`);
  doc.getElementById = (id) => {
    if (!existe(id)) return origine.getElementById(id);
    if (!registre.has(id)) registre.set(id, fabriquer(id));
    return registre.get(id);
  };
  // Les controles de la fenetre, dans l'ordre du document (comme le selecteur du script).
  doc.querySelectorAll = (selecteur) => {
    if (!String(selecteur).startsWith("#conventionDialog")) return origine.querySelectorAll(selecteur);
    return [...contenu.matchAll(/<(?:input|textarea|button)\b([^>]*)>/g)]
      .filter((m) => !/\sdisabled\b/.test(m[1]))
      .map((m) => doc.getElementById(/\sid="([^"]+)"/.exec(m[1])[1]));
  };
  doc.body.contains = (element) => [...registre.values()].includes(element);
  Object.defineProperty(doc, "activeElement", {get: () => actif, configurable: true});

  // Une touche pressee dans la fenetre ; renvoie vrai si le script a appele preventDefault.
  function touche(key, {shift = false} = {}) {
    let empeche = false;
    const evenement = {key, shiftKey: shift, preventDefault() { empeche = true; }};
    (hote.ecouteurs.keydown || []).slice().forEach((f) => f(evenement));
    return empeche;
  }

  return {
    w, hote, bouton, touche,
    actif: () => actif,
    element: (id) => doc.getElementById(id),
    corpsAClasse: (nom) => doc.body.classList.contains(nom),
  };
}

// La fiche est branchee, le bouton a le focus, puis on clique dessus.
function ouvrirFenetre(jeu) {
  const m = monter(jeu);
  m.w.bindConvention(1);
  m.bouton.focus();
  m.bouton.click();
  return {...m, html: m.hote.innerHTML};
}

// ---------------------------------------------------------------------------
// 1. Le bouton : present seulement a l'etat A generer
// ---------------------------------------------------------------------------

const ETATS = {
  "À générer": {bouton: true, jeu: () => donnees()},
  "Générée": {bouton: false, jeu: () => donnees({conventions: [convention({PDF_genere: PDF, Date_generation: secondes(2026, 3, 14)})]})},
  "Signée": {bouton: false, jeu: () => donnees({conventions: [convention({PDF_genere: PDF, PDF_signe: PDF, Date_depot: secondes(2026, 11, 27)})]})},
  "Sans modèle": {bouton: false, jeu: () => donnees({modeles: []})},
  "Sans modèle (dispositif non renseigné)": {bouton: false, jeu: () => donnees(MANQUES.dispositif)},
  "Droits insuffisants": {bouton: false, jeu: () => donnees({refusees: ["Conventions"]})},
};

// Echoue si le bouton apparait dans un etat autre que A generer, disparait de cet
// etat, ou change de libelle ou de type (ce doit etre un bouton, pas un lien ni un envoi de formulaire).
test("le bouton « Générer la convention » n'existe qu'à l'état À générer, avec son libellé exact", () => {
  const w = loadWidget();
  for (const [nom, {bouton, jeu}] of Object.entries(ETATS)) {
    const html = w.conventionBlocHtml(1, jeu());
    assert.equal(compte(html, /id="conventionGenerer"/g), bouton ? 1 : 0, nom);
    if (bouton) {
      assert.equal(texteDe(html, "button", "conventionGenerer"), LIBELLE, `${nom} : libellé`);
      assert.equal(attribut(balise(html, "conventionGenerer"), "type"), "button", `${nom} : type`);
    }
  }
});

// Echoue si la zone #conventionBlocage (role="status") apparait hors de l'etat A generer,
// disparait de cet etat quand rien ne manque, ou n'est pas vide quand rien ne manque.
test("la zone #conventionBlocage (role=status) n'existe qu'à l'état À générer et reste vide quand rien ne manque", () => {
  const w = loadWidget();
  for (const [nom, {bouton, jeu}] of Object.entries(ETATS)) {
    const html = w.conventionBlocHtml(1, jeu());
    assert.equal(compte(html, /id="conventionBlocage"/g), bouton ? 1 : 0, nom);
    if (bouton) {
      assert.equal(attribut(balise(html, "conventionBlocage"), "role"), "status", `${nom} : role`);
      assert.equal(zoneBlocage(html), "", `${nom} : zone vide quand rien ne manque`);
    }
  }
});

// Echoue si le bouton actif perd aria-haspopup="dialog", garde aria-disabled ou
// aria-describedby, prend l'attribut disabled, ou si un message de blocage reste affiche alors que rien ne manque.
test("bouton actif (rien ne manque) : aria-haspopup=\"dialog\", ni aria-disabled ni message", () => {
  const w = loadWidget();
  const html = w.conventionBlocHtml(1, donnees());
  const bouton = balise(html, "conventionGenerer");
  assert.equal(attribut(bouton, "aria-haspopup"), "dialog");
  assert.equal(attribut(bouton, "aria-disabled"), null);
  assert.equal(attribut(bouton, "aria-describedby"), null);
  assert.ok(!/\sdisabled\b/.test(bouton), "pas d'attribut disabled");
  assert.ok(!html.includes("conventionBlocageTexte"), "aucun message de blocage");
});

// ---------------------------------------------------------------------------
// 2. Le bouton grise et son message de blocage
// ---------------------------------------------------------------------------

// Pour chacun des quatre elements. Echoue si le bouton n'est plus grise par
// aria-disabled="true" (ou prend disabled ou aria-haspopup), si aria-describedby ne pointe
// plus vers le message, si le texte du message change d'un mot, ou si le texte cache disparait.
for (const [element, variante] of Object.entries(MANQUES)) {
  test(`génération bloquée, ${element} manquant : bouton grisé relié au message exact, avec texte caché`, () => {
    const w = loadWidget();
    const jeu = donnees(variante);
    assert.equal(w.conventionBlocage(1, jeu).element, element, "le jeu d'essai bloque bien sur cet élément");
    const html = w.conventionGenererHtml(1, jeu);
    const bouton = balise(html, "conventionGenerer");

    assert.equal(attribut(bouton, "aria-disabled"), "true");
    assert.ok(!/\sdisabled\b/.test(bouton), "jamais l'attribut disabled");
    assert.equal(attribut(bouton, "aria-haspopup"), null);
    assert.equal(attribut(bouton, "aria-describedby"), "conventionBlocageTexte");
    assert.equal(texteDe(html, "button", "conventionGenerer"), LIBELLE, "le bouton reste affiché");

    assert.equal(compte(html, /id="conventionBlocageTexte"/g), 1, "la cible de aria-describedby existe, une fois");
    assert.equal(texteDe(html, "p", "conventionBlocageTexte"), CACHE + BLOCAGES[element]);
    assert.match(html, /<span class="sr-only">Convention impossible à générer : <\/span>/, "texte caché");
    assert.ok(zoneBlocage(html).includes('id="conventionBlocageTexte"'), "le message est dans la zone role=status");
  });
}

// Echoue si, quand plusieurs elements manquent, on affiche plus d'un message ou
// un autre que le premier de l'ordre agence, club, dispositif, adresse.
test("génération bloquée par plusieurs éléments : un seul message, celui du premier (agence, club, dispositif, adresse)", () => {
  const w = loadWidget();
  const SANS_ADRESSE = {Adresse: "", Code_postal: "", Ville: ""};
  const cas = [
    ["agence, club, dispositif et adresse", {action: {Agence: 0, Club: 0, Dispositif: 0}, club: SANS_ADRESSE}, "agence"],
    ["agence et adresse", {action: {Agence: 0}, club: SANS_ADRESSE}, "agence"],
    ["club, dispositif et adresse", {action: {Club: 0, Dispositif: 0}, club: SANS_ADRESSE}, "club"],
    ["dispositif et adresse", {action: {Dispositif: 0}, club: SANS_ADRESSE}, "dispositif"],
  ];
  for (const [nom, variante, premier] of cas) {
    const html = w.conventionGenererHtml(1, donnees(variante));
    assert.equal(compte(html, /id="conventionBlocageTexte"/g), 1, `${nom} : un seul message`);
    assert.equal(compte(html, /Renseignez/g), 1, `${nom} : une seule phrase « Renseignez… »`);
    assert.equal(compte(html, /class="sr-only"/g), 1, `${nom} : un seul texte caché`);
    assert.equal(texteDe(html, "p", "conventionBlocageTexte"), CACHE + BLOCAGES[premier], nom);
  }
});

// Echoue si, dans le bloc, le message passe avant la phrase d'etat ou apres le bouton :
// la note le place sous la phrase d'etat et juste au-dessus du bouton grise.
test("dans le bloc, le message de blocage est sous la phrase d'état et au-dessus du bouton", () => {
  const w = loadWidget();
  for (const element of ["agence", "club", "adresse"]) {
    const html = w.conventionBlocHtml(1, donnees(MANQUES[element]));
    const phrase = html.indexOf("Aucune convention générée.");
    const message = html.indexOf('id="conventionBlocageTexte"');
    const bouton = html.indexOf('id="conventionGenerer"');
    assert.ok(phrase !== -1 && phrase < message && message < bouton, element);
  }
});

// ---------------------------------------------------------------------------
// 3. Clic sur le bouton : grise = rien ; actif = la fenetre s'ouvre
// ---------------------------------------------------------------------------

// Echoue si un clic sur le bouton grise (agence manquante, comme dessine par le
// widget) ouvre quand meme la fenetre.
test("clic sur le bouton grisé : la fenêtre ne s'ouvre pas", () => {
  const {w, hote, bouton, corpsAClasse} = monter(donnees(MANQUES.agence));
  assert.equal(bouton.getAttribute("aria-disabled"), "true", "le bouton dessiné est bien grisé");
  w.bindConvention(1);
  bouton.click();
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
  assert.equal(corpsAClasse("modal-open"), false);
});

// Echoue si le clic ne regarde plus l'attribut aria-disabled du bouton : ici les
// donnees sont completes, seul le bouton est marque grise.
test("clic sur un bouton marqué aria-disabled alors que les données sont complètes : la fenêtre ne s'ouvre pas", () => {
  const {w, hote, bouton} = monter(donnees(), {attributs: {"aria-disabled": "true"}});
  w.bindConvention(1);
  bouton.click();
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
});

// Echoue si l'ouverture ne reverifie plus les donnees : le bouton a ete dessine actif,
// puis l'agence a disparu des donnees enregistrees avant le clic.
test("clic sur un bouton actif dont les données sont devenues incomplètes : la fenêtre ne s'ouvre pas", () => {
  const jeu = donnees();
  const {w, hote, bouton} = monter(jeu);
  assert.equal(bouton.getAttribute("aria-disabled"), null, "le bouton dessiné est actif");
  jeu.raw.Actions[0].Agence = 0;
  w.bindConvention(1);
  bouton.click();
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
});

// Echoue si le clic sur le bouton actif n'ouvre plus la fenetre, si elle perd son
// role de dialogue (role, aria-modal, titre relie) ou si elle ne prend pas le focus.
test("clic sur le bouton actif : la fenêtre s'ouvre, annoncée comme un dialogue, et prend le focus", () => {
  const {w, hote, actif, corpsAClasse} = ouvrirFenetre(donnees());
  const fenetre = balise(hote.innerHTML, "conventionDialog");
  assert.notEqual(fenetre, null, "la fenêtre est dans la page");
  assert.equal(attribut(fenetre, "role"), "dialog");
  assert.equal(attribut(fenetre, "aria-modal"), "true");
  assert.equal(attribut(fenetre, "aria-labelledby"), "conventionTitle");
  assert.equal(w.state.conventionOpen, true);
  assert.equal(corpsAClasse("modal-open"), true);
  assert.equal(actif().id, "conventionDialog", "le focus est dans la fenêtre");
});

// ---------------------------------------------------------------------------
// 4. Contenu de la fenetre : club et agence, en lecture seule
// ---------------------------------------------------------------------------

// Echoue si un champ affiche une autre valeur que celle des donnees enregistrees :
// nom, SIRET, siege (adresse puis code postal et ville) du club ; nom et adresse
// (adresse, complement, code postal et ville) de l'agence ; ou si un libelle change.
test("la fenêtre affiche le club (nom, SIRET, siège) et l'agence (nom, adresse) de l'action", () => {
  const {html} = ouvrirFenetre(donnees());
  assert.equal(champ(html, "clubNom"), "Club Exemple");
  assert.equal(champ(html, "clubSiret"), "12345678901234");
  assert.equal(champ(html, "clubSiege"), "1 rue Exemple\n75001 Exemple-sur-Mer");
  assert.equal(champ(html, "agenceNom"), "Agence Exemple");
  assert.equal(champ(html, "agenceAdresse"), "2 avenue Exemple\nBâtiment A\n75002 Exemple-Ville");
  assert.equal(libelleDe(html, "clubNom"), "Nom du club");
  assert.equal(libelleDe(html, "clubSiret"), "SIRET");
  assert.equal(libelleDe(html, "clubSiege"), "Siège");
  assert.equal(libelleDe(html, "agenceNom"), "Agence");
  assert.equal(libelleDe(html, "agenceAdresse"), "Adresse");
});

// Echoue si un champ de la fenetre devient modifiable (readonly retire), si une liste
// de choix apparait, ou si les cinq champs de la tache (3 pour le club, 2 pour l'agence) ne sont plus la.
test("tous les champs de la fenêtre sont en lecture seule", () => {
  const {html} = ouvrirFenetre(donnees());
  const champs = html.match(/<(?:input|textarea)\b[^>]*>/g) || [];
  assert.equal(champs.length, 5, "trois champs pour le club, deux pour l'agence");
  for (const tag of champs) assert.match(tag, /\sreadonly\b/, tag);
  assert.ok(!/<select\b/.test(html), "aucune liste de choix");
});

// Echoue si le titre, l'un des deux intitules de bloc, la phrase d'aide du bloc club
// (a sa place, entre les deux blocs) ou le libelle « Fermer » change.
test("la fenêtre porte son titre, ses deux blocs, la phrase « Pour corriger ces informations… » et le bouton Fermer", () => {
  const {html} = ouvrirFenetre(donnees());
  assert.equal(texteDe(html, "h2", "conventionTitle"), "Convention");
  const club = html.indexOf('<legend class="form-legend">Signataire club</legend>');
  const aide = html.indexOf('<p class="help-block">Pour corriger ces informations, modifiez la fiche du club.</p>');
  const agence = html.indexOf('<legend class="form-legend">Signataire agence</legend>');
  assert.ok(club !== -1 && aide !== -1 && agence !== -1, "titres et phrase présents");
  assert.ok(club < aide && aide < agence, "la phrase est dans le bloc club");
  assert.equal(texteDe(html, "button", "conventionFermer"), "Fermer");
});

// ---------------------------------------------------------------------------
// 5. Valeurs venant de Grist : du texte, jamais du HTML
// ---------------------------------------------------------------------------

// Echoue si un champ « une ligne » (nom du club, SIRET, nom de l'agence) n'echappe
// plus <, >, & ou les guillemets : le HTML s'executerait, ou casserait l'attribut value.
test("des caractères spéciaux dans le nom du club, le SIRET ou le nom de l'agence s'affichent comme du texte", () => {
  const nomClub = 'Club <b>Exemple</b> & "Fils"';
  const siret = "<i>123</i> & 4";
  const nomAgence = "Agence <u>Exemple</u> & Cie";
  const {html} = ouvrirFenetre(donnees({club: {Nom: nomClub, SIRET: siret}, agence: {Libelle_agence: nomAgence}}));
  for (const balisage of ["<b>", "</b>", "<i>", "<u>"]) assert.ok(!html.includes(balisage), `${balisage} ne doit pas passer tel quel`);
  assert.ok(html.includes("&lt;b&gt;Exemple&lt;/b&gt; &amp; &quot;Fils&quot;"), "le nom du club est échappé");
  assert.equal(champ(html, "clubNom"), nomClub);
  assert.equal(champ(html, "clubSiret"), siret);
  assert.equal(champ(html, "agenceNom"), nomAgence);
});

// Echoue si une zone de texte (siege du club, adresse de l'agence) n'echappe plus son
// contenu : une adresse qui ferme la zone puis ouvre un script s'executerait.
test("des caractères spéciaux dans les adresses (siège du club, adresse de l'agence) s'affichent comme du texte", () => {
  const adresseClub = "1 rue <i>Exemple</i> & Cie</textarea><script>alert(1)</script>";
  const adresseAgence = "2 avenue <b>Exemple</b> & Cie";
  const {html} = ouvrirFenetre(donnees({club: {Adresse: adresseClub}, agence: {Adresse: adresseAgence}}));
  assert.ok(!/<script/i.test(html), "aucune balise script");
  for (const balisage of ["<b>", "<i>"]) assert.ok(!html.includes(balisage), `${balisage} ne doit pas passer tel quel`);
  assert.equal(champ(html, "clubSiege"), `${adresseClub}\n75001 Exemple-sur-Mer`);
  assert.equal(champ(html, "agenceAdresse"), `${adresseAgence}\nBâtiment A\n75002 Exemple-Ville`);
});

// ---------------------------------------------------------------------------
// 6. Fermeture : « Fermer », Echap, retour du focus
// ---------------------------------------------------------------------------

// Echoue si « Fermer » ne ferme plus la fenetre, ne retire plus modal-open de la
// page, ne rend plus le focus au bouton « Générer la convention », ou laisse l'ecouteur du clavier en place.
test("« Fermer » ferme la fenêtre et le focus revient sur le bouton « Générer la convention »", () => {
  const {w, hote, bouton, actif, element, corpsAClasse} = ouvrirFenetre(donnees());
  assert.equal(w.state.conventionOpen, true);
  element("conventionFermer").click();
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
  assert.equal(corpsAClasse("modal-open"), false);
  assert.equal(actif(), bouton, "le focus est revenu sur le bouton");
  assert.equal((hote.ecouteurs.keydown || []).length, 0, "l'écouteur du clavier est retiré");
});

// Echoue si la touche Echap ne ferme plus la fenetre, n'appelle plus preventDefault,
// ou ne rend plus le focus au bouton « Générer la convention ».
test("Échap ferme la fenêtre et le focus revient sur le bouton « Générer la convention »", () => {
  const {w, hote, bouton, touche, actif, corpsAClasse} = ouvrirFenetre(donnees());
  assert.equal(touche("Escape"), true, "preventDefault est appelé");
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
  assert.equal(corpsAClasse("modal-open"), false);
  assert.equal(actif(), bouton, "le focus est revenu sur le bouton");
  assert.equal((hote.ecouteurs.keydown || []).length, 0, "l'écouteur du clavier est retiré");
});

// Echoue si une touche autre que Echap et Tab (ici « a ») ferme la fenetre ou est bloquee.
test("une autre touche ne ferme pas la fenêtre", () => {
  const {w, hote, touche} = ouvrirFenetre(donnees());
  assert.equal(touche("a"), false, "la touche n'est pas interceptée");
  assert.notEqual(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, true);
});

// ---------------------------------------------------------------------------
// 7. Focus garde dans la fenetre : Tab et Maj+Tab
// ---------------------------------------------------------------------------
// Dans cette tache, les controles de la fenetre sont, dans l'ordre : Nom du club,
// SIRET, Siege, Agence, Adresse, puis le bouton Fermer. Si une tache ajoute un champ
// ou un bouton, ces deux tests seront a adapter (le premier et le dernier changent).

// Echoue si Tab sur le dernier controle (Fermer) ne revient plus au premier (Nom du
// club), ou si la touche n'est plus retenue (preventDefault).
test("Tab sur le dernier élément de la fenêtre revient au premier", () => {
  const {touche, actif, element} = ouvrirFenetre(donnees());
  element("conventionFermer").focus();
  assert.equal(touche("Tab"), true, "preventDefault est appelé");
  assert.equal(actif(), element("clubNom"));
});

// Echoue si Maj+Tab sur le premier controle (Nom du club) ne va plus au dernier
// (Fermer), ou si la touche n'est plus retenue (preventDefault).
test("Maj+Tab sur le premier élément de la fenêtre va au dernier", () => {
  const {touche, actif, element} = ouvrirFenetre(donnees());
  element("clubNom").focus();
  assert.equal(touche("Tab", {shift: true}), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionFermer"));
});

// Echoue si Maj+Tab depuis la fenetre elle-meme (c'est la que le focus arrive a
// l'ouverture) ne va plus au dernier controle : le focus sortirait de la fenetre.
test("Maj+Tab à l'ouverture, quand le focus est sur la fenêtre elle-même, va au dernier élément", () => {
  const {touche, actif, element} = ouvrirFenetre(donnees());
  assert.equal(actif(), element("conventionDialog"), "le focus d'ouverture est sur la fenêtre");
  assert.equal(touche("Tab", {shift: true}), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionFermer"));
});

// ---------------------------------------------------------------------------
// 8. Le reste de la chaine : page et feuille de style
// ---------------------------------------------------------------------------

// Echoue si index.html perd le conteneur #conventionModal : openConvention ne trouverait
// plus ou ecrire la fenetre et le clic provoquerait une erreur.
test("index.html contient le conteneur #conventionModal de la fenêtre", () => {
  assert.equal(compte(INDEX, /<div id="conventionModal"><\/div>/g), 1);
});

// Echoue si style.css ne declare plus l'une des classes de la fenetre ou du bouton
// (convention-grid, convention-part, convention-champs, convention-actions) ou la
// regle qui affiche la fenetre (la feuille du design system la masque par defaut).
test("style.css déclare les classes de la fenêtre et du bouton, et affiche la fenêtre", () => {
  for (const nom of ["convention-grid", "convention-part", "convention-champs", "convention-actions"]) {
    assert.match(CSS, new RegExp(`\\.${nom}(?![\\w-])`), `.${nom} doit exister dans la feuille`);
  }
  assert.match(CSS, /#conventionModal\s+\.modal\s*\{[^}]*display:\s*block/, "la fenêtre doit être affichée");
});
