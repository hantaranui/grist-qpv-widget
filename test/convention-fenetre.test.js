"use strict";

// Bouton « Générer la convention » et fenetre « Convention » (taches 5.1a et 5.1b) :
// bouton present seulement a l'etat A generer, message de blocage, ouverture et
// fermeture de la fenetre, informations du club et de l'agence en lecture seule,
// echappement des valeurs venant de Grist, focus (Echap, Tab, Maj+Tab) ; puis, pour
// la 5.1b, les trois blocs, l'annee, la liste des signataires, la fonction du
// signataire, le representant, le pied, et le controle de l'annee a « Enregistrer
// les informations » (section 9).
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
function donnees({action = {}, club = {}, agence = {}, conventions = [], modeles, contacts = [], refusees = []} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, ...action}],
      Structures: [{...CLUB, ...club}],
      Agences: [{...AGENCE, ...agence}],
      Modeles_convention: modeles || [{id: 10, Dispositif: 3, Actif: true}],
      Contacts: contacts,
      Conventions: conventions,
    },
    tablesRefusees: refusees,
  };
}

// Jeu d'essai de la 5.1b : un modele avec titre et annee, et des contacts. Deux
// contacts sont ceux du club de l'action (7), le troisieme est celui d'un autre club.
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true};
const CONTACTS = [
  {id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"},
  {id: 32, Club: 7, Prenom: "Alex", Nom: "Modèle", Fonction: ""},
  {id: 33, Club: 99, Prenom: "Robin", Nom: "Voisin", Fonction: "Trésorier"},
];

// `modele` complete (ou remplace, champ par champ) MODELE : { Avec_annee: false } donne un modele sans annee.
function donneesFenetre({modele = {}, contacts = CONTACTS, ...reste} = {}) {
  return donnees({modeles: [{...MODELE, ...modele}], contacts, ...reste});
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

// Libelle d'un champ tel qu'on le lit : balises retirees, espace insecable devenu espace (« Année * »).
function libelleNu(html, id) {
  return (libelleDe(html, id) || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
}

// Choix d'une liste : [{value, texte, invite}], ou null si la liste n'existe pas.
// invite = l'option « Veuillez sélectionner » (selectionnee et desactivee).
function options(html, id) {
  const m = new RegExp(`<select\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</select>`).exec(html);
  if (!m) return null;
  return [...m[1].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map((o) => ({
    value: attribut(`<option${o[1]}>`, "value"),
    texte: decoder(o[2]),
    invite: /\sselected\b/.test(o[1]) && /\sdisabled\b/.test(o[1]),
  }));
}

// Identifiants des champs (input, textarea, select) d'un morceau de HTML, dans l'ordre.
const idsDesChamps = (html) => [...html.matchAll(/<(?:input|textarea|select)\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);

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

  // Un element de la fenetre reprend sa balise (attributs, classes) et sa valeur de
  // depart dans le HTML ecrit, puis garde ce que le script y change. `validity.badInput`
  // imite un champ numerique dont le texte n'est pas un nombre (sa valeur est alors vide).
  function fabriquer(id, balisePosee = "") {
    const attributs = {};
    for (const m of balisePosee.matchAll(/\s([a-z-]+)="([^"]*)"/g)) attributs[m[1]] = decoder(m[2]);
    const classes = new Set((attributs.class || "").split(/\s+/).filter(Boolean));
    const ecouteurs = {};
    const enfants = new Map();
    const element = {
      id, attributs, ecouteurs,
      value: champ(contenu, id) ?? "",
      validity: {badInput: false},
      classList: {
        add: (...noms) => noms.forEach((nom) => classes.add(nom)),
        remove: (...noms) => noms.forEach((nom) => classes.delete(nom)),
        contains: (nom) => classes.has(nom),
        toggle(nom, force) {
          const present = force === undefined ? !classes.has(nom) : Boolean(force);
          if (present) classes.add(nom); else classes.delete(nom);
          return present;
        },
      },
      querySelector: (selecteur) => enfants.get(selecteur) || enfants.set(selecteur, {textContent: ""}).get(selecteur),
      getAttribute: (nom) => (nom in attributs ? attributs[nom] : null),
      setAttribute: (nom, valeur) => { attributs[nom] = String(valeur); },
      removeAttribute: (nom) => { delete attributs[nom]; },
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
    if (!existe(id)) {
      // Fenetre ouverte et identifiant de la fenetre absent de la page (ex. « Année »
      // pour un modele sans annee) : null, comme dans un vrai document.
      return contenu !== "" && /^(convention|club|agence)[A-Z]/.test(id) ? null : origine.getElementById(id);
    }
    if (!registre.has(id)) registre.set(id, fabriquer(id, balise(contenu, id) || ""));
    return registre.get(id);
  };
  // Les controles de la fenetre, dans l'ordre du document (comme le selecteur du script).
  doc.querySelectorAll = (selecteur) => {
    if (!String(selecteur).startsWith("#conventionDialog")) return origine.querySelectorAll(selecteur);
    return [...contenu.matchAll(/<(?:input|textarea|select|button)\b([^>]*)>/g)]
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

  // conventionEnregistrer ne fait rien pour l'instant (la tache 5.2 la remplira) : on la
  // remplace dans le widget par un espion qui note ses appels. `w.window` est le global
  // du bac a sable : y poser une fonction remplace celle que submitConvention appelle.
  const enregistrements = [];
  w.window.conventionEnregistrer = (actionId, valeurs) => { enregistrements.push({actionId, valeurs}); };

  // « Enregistrer les informations » est un bouton d'envoi : le navigateur declenche
  // alors l'evenement submit du formulaire. Renvoie vrai si le script a appele preventDefault.
  function soumettre() {
    let empeche = false;
    const evenement = {preventDefault() { empeche = true; }};
    (doc.getElementById("conventionForm").ecouteurs.submit || []).slice().forEach((f) => f(evenement));
    return empeche;
  }

  // L'annee saisie. `illisible` imite un texte qui n'est pas un nombre (« abc ») : le
  // navigateur rend alors une valeur vide, avec validity.badInput.
  function saisirAnnee(valeur, illisible = false) {
    const annee = doc.getElementById("conventionAnnee");
    annee.value = valeur;
    annee.validity = {badInput: illisible};
  }

  // Choix d'un contact dans la liste « Signataire » : la valeur change, puis l'evenement change part.
  function choisir(idContact) {
    const liste = doc.getElementById("clubSignataire");
    liste.value = String(idContact);
    (liste.ecouteurs.change || []).slice().forEach((f) => f({}));
  }

  return {
    w, hote, bouton, touche, soumettre, saisirAnnee, choisir, enregistrements,
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
// role de dialogue (role, aria-modal, titre relie) ou si le focus d'ouverture n'est
// pas sur le champ « Année » (le premier champ modifiable, depuis la 5.1b).
test("clic sur le bouton actif : la fenêtre s'ouvre, annoncée comme un dialogue, et le focus va sur « Année »", () => {
  const {w, hote, actif, corpsAClasse} = ouvrirFenetre(donnees());
  const fenetre = balise(hote.innerHTML, "conventionDialog");
  assert.notEqual(fenetre, null, "la fenêtre est dans la page");
  assert.equal(attribut(fenetre, "role"), "dialog");
  assert.equal(attribut(fenetre, "aria-modal"), "true");
  assert.equal(attribut(fenetre, "aria-labelledby"), "conventionTitle");
  assert.equal(w.state.conventionOpen, true);
  assert.equal(corpsAClasse("modal-open"), true);
  assert.equal(actif().id, "conventionAnnee", "le focus est sur le champ Année");
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

// Echoue si un des sept champs prevus en lecture seule (modele, nom du club, SIRET,
// siege, fonction du signataire, agence, adresse) devient modifiable, si un des
// quatre champs a remplir (annee, signataire, representant, fonction du
// representant) devient en lecture seule, ou si les onze champs ne sont plus la.
test("seuls les champs prévus sont en lecture seule ; année, signataire, représentant et fonction du représentant se remplissent", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const champs = [...html.matchAll(/<(?:input|textarea|select)\b([^>]*)>/g)]
    .map((m) => ({id: /\sid="([^"]+)"/.exec(m[1])[1], lecture: /\sreadonly\b/.test(m[1])}));
  assert.equal(champs.length, 11, "deux champs, puis cinq, puis quatre");
  assert.deepEqual(champs.filter((c) => c.lecture).map((c) => c.id),
    ["conventionModele", "clubNom", "clubSiret", "clubSiege", "clubFonction", "agenceNom", "agenceAdresse"]);
  assert.deepEqual(champs.filter((c) => !c.lecture).map((c) => c.id),
    ["conventionAnnee", "clubSignataire", "agenceRepresentant", "agenceFonction"]);
  assert.equal(compte(html, /<select\b/g), 1, "une seule liste de choix : le signataire");
});

// Echoue si le titre, l'un des deux intitules de bloc, la phrase d'aide du bloc club
// (a sa place, entre les deux blocs) ou le libelle « Fermer » change.
test("la fenêtre porte son titre, ses trois blocs, la phrase « Pour corriger ces informations… » et le bouton Fermer", () => {
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
// Depuis la 5.1b, les controles de la fenetre sont, dans l'ordre : Modele utilise,
// Annee, Nom du club, SIRET, Siege, Signataire, Fonction du signataire, Agence,
// Adresse, Representant, Fonction du representant, puis les boutons Fermer et
// Enregistrer les informations. Le premier est donc « Modèle utilisé » (en lecture
// seule, mais atteignable au clavier) et le dernier « Enregistrer les informations ».
// Si une tache ajoute un champ ou un bouton aux extremites, ces tests seront a adapter.

// Echoue si Tab sur le dernier controle (Enregistrer les informations) ne revient
// plus au premier (Modele utilise), ou si la touche n'est plus retenue (preventDefault).
test("Tab sur le dernier élément de la fenêtre (Enregistrer les informations) revient au premier (Modèle utilisé)", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("conventionEnregistrer").focus();
  assert.equal(touche("Tab"), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionModele"));
});

// Echoue si Maj+Tab sur le premier controle (Modele utilise) ne va plus au dernier
// (Enregistrer les informations), ou si la touche n'est plus retenue (preventDefault).
test("Maj+Tab sur le premier élément de la fenêtre (Modèle utilisé) va au dernier (Enregistrer les informations)", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("conventionModele").focus();
  assert.equal(touche("Tab", {shift: true}), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionEnregistrer"));
});

// Echoue si Maj+Tab depuis la fenetre elle-meme (le focus peut y revenir, par exemple
// apres un clic dans la fenetre) ne va plus au dernier controle : le focus sortirait
// de la fenetre. A l'ouverture, le focus n'y est plus (il est sur « Année ») : on l'y met.
test("Maj+Tab, quand le focus est sur la fenêtre elle-même, va au dernier élément", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("conventionDialog").focus();
  assert.equal(touche("Tab", {shift: true}), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionEnregistrer"));
});

// Echoue si le message d'erreur de l'annee, a l'ouverture de la fenetre, n'a pas la
// meme forme que ceux de la fenetre « Ajout d'une action » : classe invalid-feedback
// presente, classe help-block absente. Avec help-block, la feuille du design system
// force l'affichage du message des l'ouverture (bug de la tache 5.1b).
test("le message d'erreur de l'année a la forme de la fenêtre d'ajout : invalid-feedback, sans help-block", () => {
  const {hote} = ouvrirFenetre(donnees());
  const tag = balise(hote.innerHTML, "conventionAnneeErreur");
  assert.ok(tag, "le message d'erreur de l'année existe");
  const classes = (attribut(tag, "class") || "").split(/\s+/);
  assert.ok(classes.includes("invalid-feedback"), "la classe invalid-feedback est présente");
  assert.equal(classes.includes("help-block"), false, "la classe help-block est absente");
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

// ---------------------------------------------------------------------------
// 9. Tache 5.1b : les trois blocs, l'annee, les signataires, le pied, le controle
// ---------------------------------------------------------------------------
// ---- 9.0 Note d'introduction ----

// Echoue si la note sous le titre n'est pas exactement
// « Les champs marqués d'un * sont obligatoires pour générer la convention. »
// (texte fixé par la note UX du 2026-10-23). Echoue tant que le code ecrit
// encore « …sont obligatoires. » (src/actions-dashboard/script.js).
test("la note d'introduction de la fenêtre dit que les champs * sont obligatoires pour générer la convention", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  assert.ok(html.includes("<p>Les champs marqués d'un * sont obligatoires pour générer la convention.</p>"),
    "la note d'introduction doit reprendre le texte exact de la note UX");
});

// ---- 9.1 Structure : blocs, champs, libelles ----

// Echoue si la fenetre n'a plus exactement trois blocs (fieldset), dans cet ordre, avec
// leur titre (legend) et leurs champs : informations (modele, annee), signataire club
// (club, SIRET, siege, signataire, fonction), signataire agence (agence, adresse,
// representant, fonction du representant).
test("la fenêtre a trois blocs, dans l'ordre : informations, signataire club, signataire agence, chacun avec ses champs", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const blocs = html.split("<fieldset").slice(1);
  assert.equal(blocs.length, 3, "trois blocs");
  assert.deepEqual(blocs.map((b) => decoder(/<legend class="form-legend">([^<]*)<\/legend>/.exec(b)[1])),
    ["Informations relatives à la convention", "Signataire club", "Signataire agence"]);
  assert.deepEqual(idsDesChamps(blocs[0]), ["conventionModele", "conventionAnnee"]);
  assert.deepEqual(idsDesChamps(blocs[1]), ["clubNom", "clubSiret", "clubSiege", "clubSignataire", "clubFonction"]);
  assert.deepEqual(idsDesChamps(blocs[2]), ["agenceNom", "agenceAdresse", "agenceRepresentant", "agenceFonction"]);
});

// Echoue si un libelle change d'un mot, si un champ a remplir perd son « * » ou son
// attribut required, si un champ en lecture seule recoit un « * », ou si le formulaire
// perd novalidate (le navigateur bloquerait alors « Enregistrer » sur un champ vide,
// alors que le brouillon doit passer).
test("les champs obligatoires pour générer portent « * » et required ; le formulaire est en novalidate", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const attendus = {
    conventionModele: "Modèle utilisé",
    conventionAnnee: "Année *",
    clubSignataire: "Signataire *",
    clubFonction: "Fonction du signataire",
    agenceRepresentant: "Représentant *",
    agenceFonction: "Fonction du représentant *",
  };
  for (const [id, libelle] of Object.entries(attendus)) {
    assert.equal(libelleNu(html, id), libelle, `${id} : libellé`);
    assert.equal(/\srequired\b/.test(balise(html, id)), libelle.endsWith("*"), `${id} : required`);
  }
  assert.match(html, /<form\b[^>]*\snovalidate\b/);
});

// ---- 9.2 Modele utilise et annee ----

// Echoue si « Modèle utilisé » n'affiche plus le titre du modele (Modeles_convention.Titre),
// si l'annee n'est plus un champ numerique prerempli avec l'annee en cours, ou si
// l'annee disparait alors que Avec_annee est vrai ou que la colonne n'existe pas
// (seul Avec_annee a faux retire l'annee).
test("« Modèle utilisé » affiche le titre ; « Année » est un champ numérique prérempli avec l'année en cours (Avec_annee vrai ou absent)", () => {
  const anneeEnCours = String(new Date().getFullYear());
  for (const [nom, modele] of [["Avec_annee vrai", {Avec_annee: true}], ["colonne Avec_annee absente", {Avec_annee: undefined}]]) {
    const {html} = ouvrirFenetre(donneesFenetre({modele}));
    assert.equal(champ(html, "conventionModele"), "Modèle Exemple", `${nom} : titre du modèle`);
    const annee = balise(html, "conventionAnnee");
    assert.ok(annee, `${nom} : le champ Année existe`);
    assert.equal(attribut(annee, "type"), "number", `${nom} : champ numérique`);
    assert.equal(attribut(annee, "value"), anneeEnCours, `${nom} : année en cours`);
  }
});

// Echoue si l'annee reste affichee quand Avec_annee est faux (Parcours de
// remobilisation), si son message d'erreur reste dans la page, ou si le bloc
// « Informations » contient autre chose que le modele.
test("Avec_annee faux : pas de champ Année ni de message d'erreur d'année ; le bloc ne garde que le modèle", () => {
  const {html} = ouvrirFenetre(donneesFenetre({modele: {Avec_annee: false}}));
  assert.equal(compte(html, /conventionAnnee/g), 0, "rien de l'année dans la page");
  assert.deepEqual(idsDesChamps(html.split("<fieldset")[1]), ["conventionModele"]);
  assert.equal(champ(html, "conventionModele"), "Modèle Exemple");
});

// Echoue si le focus d'ouverture ne va pas sur « Signataire » quand il n'y a pas
// d'annee (si l'annee est absente, le script ne doit pas chercher a la focaliser).
test("Avec_annee faux : le focus d'ouverture va sur « Signataire »", () => {
  const {actif} = ouvrirFenetre(donneesFenetre({modele: {Avec_annee: false}}));
  assert.equal(actif().id, "clubSignataire");
});

// Echoue si le piege a focus intercepte Tab ou Maj+Tab sur un controle du milieu
// (« Année », le focus d'ouverture) : seuls le premier et le dernier controle bouclent.
test("Tab et Maj+Tab depuis « Année » (focus d'ouverture) ne sont pas interceptés", () => {
  const {touche, actif} = ouvrirFenetre(donneesFenetre());
  assert.equal(actif().id, "conventionAnnee");
  assert.equal(touche("Tab"), false, "Tab n'est pas retenue");
  assert.equal(touche("Tab", {shift: true}), false, "Maj+Tab n'est pas retenue");
  assert.equal(actif().id, "conventionAnnee", "le script ne déplace pas le focus");
});

// ---- 9.3 Signataire du club ----

// Echoue si la liste propose un contact d'un autre club, si un libelle n'est plus
// « Prénom Nom », si l'invite « Veuillez sélectionner » n'est plus la premiere option
// (selectionnee et desactivee), si l'ordre n'est plus alphabetique, si la fonction
// d'un contact est ecrite dans la page avant le choix, ou si le message « aucun
// contact » apparait alors que le club a des contacts.
test("la liste « Signataire » : l'invite, puis seulement les contacts du club en « Prénom Nom », sans leur fonction", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  assert.deepEqual(options(html, "clubSignataire"), [
    {value: "", texte: "Veuillez sélectionner", invite: true},
    {value: "32", texte: "Alex Modèle", invite: false},
    {value: "31", texte: "Camille Exemple", invite: false},
  ]);
  assert.ok(!html.includes("Robin") && !html.includes("Voisin"), "le contact d'un autre club n'apparaît pas");
  assert.ok(!html.includes("Présidente") && !html.includes("Trésorier"), "aucune fonction dans la page avant le choix");
  assert.equal(compte(html, /clubSignataireAide/g), 0, "pas de message « aucun contact »");
  assert.equal(attribut(balise(html, "clubSignataire"), "aria-describedby"), null);
});

// Echoue si un contact sans prenom (ou sans nom) n'est plus affiche avec ce qu'il a,
// si un contact sans prenom ni nom est propose, ou si les espaces autour ne sont plus retires.
test("liste « Signataire » : un contact avec un seul nom s'affiche tel quel, un contact sans prénom ni nom est ignoré", () => {
  const contacts = [
    {id: 51, Club: 7, Prenom: "", Nom: "Seul", Fonction: ""},
    {id: 52, Club: 7, Prenom: "Prénom", Nom: "", Fonction: ""},
    {id: 53, Club: 7, Prenom: "", Nom: "", Fonction: "Président"},
    {id: 54, Club: 7, Prenom: " Jo ", Nom: " Dupont ", Fonction: ""},
  ];
  const {html} = ouvrirFenetre(donneesFenetre({contacts}));
  assert.deepEqual(options(html, "clubSignataire").map((o) => [o.value, o.texte]),
    [["", "Veuillez sélectionner"], ["54", "Jo Dupont"], ["52", "Prénom"], ["51", "Seul"]]);
});

// Echoue si, pour un club sans contact, le message n'est plus exactement celui de la
// note, s'il n'est plus sous la liste et relie a elle par aria-describedby, si la liste
// propose autre chose que l'invite, si la fonction n'est plus vide, ou si
// « Enregistrer les informations » est grise (il doit rester actif).
test("club sans contact : message relié à la liste par aria-describedby, liste réduite à l'invite, « Enregistrer » reste actif", () => {
  const variantes = {
    "seulement le contact d'un autre club": [CONTACTS[2]],
    "table Contacts vide": [],
    "seulement un contact sans prénom ni nom": [{id: 53, Club: 7, Prenom: "", Nom: "", Fonction: "Président"}],
  };
  for (const [nom, contacts] of Object.entries(variantes)) {
    const m = ouvrirFenetre(donneesFenetre({contacts}));
    const {html} = m;
    assert.equal(compte(html, /id="clubSignataireAide"/g), 1, `${nom} : un seul message`);
    assert.equal(attribut(balise(html, "clubSignataireAide"), "class"), "help-block", `${nom} : classe help-block`);
    assert.equal(texteDe(html, "p", "clubSignataireAide"),
      "Ce club n'a aucun contact. Ajoutez-en un dans la fiche du club, puis revenez générer la convention.", nom);
    assert.equal(attribut(balise(html, "clubSignataire"), "aria-describedby"), "clubSignataireAide", `${nom} : liste reliée au message`);
    assert.ok(html.indexOf('id="clubSignataireAide"') > html.indexOf('id="clubSignataire"'), `${nom} : message sous la liste`);
    assert.deepEqual(options(html, "clubSignataire"), [{value: "", texte: "Veuillez sélectionner", invite: true}], nom);
    assert.equal(m.element("clubFonction").value, "", `${nom} : fonction vide`);
    const enregistrer = balise(html, "conventionEnregistrer");
    assert.ok(!/\sdisabled\b/.test(enregistrer) && attribut(enregistrer, "aria-disabled") === null, `${nom} : « Enregistrer » actif`);
  }
});

// Echoue si choisir un signataire n'affiche plus sa fonction (lecture seule), si un
// contact sans fonction (vide ou faite d'espaces) n'affiche plus « Fonction non
// renseignée », ou si la zone ne suit pas le dernier choix.
test("choisir un signataire affiche sa fonction ; sans fonction : « Fonction non renseignée »", () => {
  const contacts = [...CONTACTS, {id: 34, Club: 7, Prenom: "Dominique", Nom: "Vide", Fonction: "   "}];
  const m = ouvrirFenetre(donneesFenetre({contacts}));
  const fonction = () => m.element("clubFonction").value;
  assert.equal(fonction(), "", "vide avant le choix");
  m.choisir(31);
  assert.equal(fonction(), "Présidente");
  m.choisir(32);
  assert.equal(fonction(), "Fonction non renseignée", "fonction vide");
  m.choisir(34);
  assert.equal(fonction(), "Fonction non renseignée", "fonction faite d'espaces");
  m.choisir(31);
  assert.equal(fonction(), "Présidente", "la zone suit le dernier choix");
});

// ---- 9.4 Signataire de l'agence ----

// Echoue si le representant n'est plus vide a l'ouverture, si la fonction du
// representant n'est plus prerempli avec « Directeur d'agence », ou si l'un de ces
// deux champs devient en lecture seule (le representant se saisit, la fonction se modifie).
test("« Représentant » vide, « Fonction du représentant » préremplie avec « Directeur d'agence », tous deux modifiables", () => {
  const {html, element} = ouvrirFenetre(donneesFenetre());
  const valeur = attribut(balise(html, "agenceRepresentant"), "value");
  assert.ok(valeur === null || valeur === "", "représentant vide");
  assert.equal(element("agenceRepresentant").value, "");
  assert.equal(champ(html, "agenceFonction"), "Directeur d'agence");
  assert.equal(element("agenceFonction").value, "Directeur d'agence");
  for (const id of ["agenceRepresentant", "agenceFonction"]) {
    assert.ok(!/\sreadonly\b/.test(balise(html, id)), `${id} est modifiable`);
  }
});

// ---- 9.5 Pied de la fenetre ----

// Echoue si le pied n'a plus que deux boutons, « Fermer » (type button) puis
// « Enregistrer les informations » (type submit), dans cet ordre ; ou si un bouton
// « Générer la convention » (ou un second #conventionGenerer, deja pris par le bloc de
// la fiche) apparait dans la fenetre avant la tache 7.
test("le pied de la fenêtre contient « Fermer » puis « Enregistrer les informations », et pas de « Générer »", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const pied = /<div class="modal-footer">([\s\S]*?)<\/div>/.exec(html);
  assert.ok(pied, "le pied existe");
  const boutons = [...pied[1].matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => ({
    id: attribut(`<button${m[1]}>`, "id"),
    type: attribut(`<button${m[1]}>`, "type"),
    texte: decoder(m[2].replace(/<[^>]+>/g, "")),
  }));
  assert.deepEqual(boutons, [
    {id: "conventionFermer", type: "button", texte: "Fermer"},
    {id: "conventionEnregistrer", type: "submit", texte: "Enregistrer les informations"},
  ]);
  assert.equal(compte(html, /id="conventionGenerer"/g), 0, "pas de second bouton Générer");
  assert.ok(!html.includes("Générer"), "aucun libellé « Générer » dans la fenêtre");
});

// ---- 9.6 Controle de l'annee a « Enregistrer les informations » ----

// Pour 26, 999 et 10000 (pas quatre chiffres) et « abc » (le navigateur rend une
// valeur vide avec badInput). Echoue si l'une de ces annees est acceptee, si le champ
// perd is-invalid, aria-invalid ou aria-describedby, si le message sous le champ change
// (avec « Erreur : » cache), si l'alerte du haut reste cachee ou change de texte,
// si le focus ne va pas sur « Année », ou si conventionEnregistrer est appelee.
test("une année qui n'a pas quatre chiffres (26, 999, 10000, « abc ») est refusée : champ en erreur, message, alerte, focus sur l'année", () => {
  const cas = [["26", false, "26"], ["999", false, "999"], ["10000", false, "10000"], ["", true, "abc"]];
  for (const [valeur, illisible, nom] of cas) {
    const m = ouvrirFenetre(donneesFenetre());
    m.element("agenceRepresentant").focus();
    m.saisirAnnee(valeur, illisible);
    assert.equal(m.soumettre(), true, `${nom} : preventDefault est appelé`);

    const annee = m.element("conventionAnnee");
    assert.equal(annee.classList.contains("is-invalid"), true, `${nom} : is-invalid`);
    assert.equal(annee.getAttribute("aria-invalid"), "true", `${nom} : aria-invalid`);
    assert.equal(annee.getAttribute("aria-describedby"), "conventionAnneeErreur", `${nom} : aria-describedby`);
    assert.equal(texteDe(m.hote.innerHTML, "div", "conventionAnneeErreur"), "Erreur : Saisissez une année à quatre chiffres.", `${nom} : message`);
    const alerte = m.element("conventionMessage");
    assert.equal(alerte.classList.contains("is-hidden"), false, `${nom} : alerte visible`);
    assert.equal(alerte.querySelector(".alert-content").textContent, "Certains champs sont à corriger.", `${nom} : texte de l'alerte`);
    assert.equal(m.actif().id, "conventionAnnee", `${nom} : focus sur l'année`);
    assert.equal(m.enregistrements.length, 0, `${nom} : rien n'est enregistré`);
  }
});

// Echoue si une annee de quatre chiffres commençant par 1 a 9 (1000, 9999) ou l'annee
// prerempli et non touchee est refusee, si une erreur s'affiche, ou si
// conventionEnregistrer n'est pas appelee exactement une fois.
test("une année de quatre chiffres (1000, 9999, ou l'année préremplie) est acceptée : pas d'erreur, un seul enregistrement", () => {
  for (const [nom, saisie] of [["1000", "1000"], ["9999", "9999"], ["année préremplie", null]]) {
    const m = ouvrirFenetre(donneesFenetre());
    if (saisie !== null) m.saisirAnnee(saisie);
    m.soumettre();
    assert.equal(m.enregistrements.length, 1, `${nom} : un enregistrement`);
    assert.equal(m.enregistrements[0].valeurs.annee, saisie === null ? String(new Date().getFullYear()) : saisie, nom);
    assert.equal(m.element("conventionAnnee").classList.contains("is-invalid"), false, `${nom} : pas d'erreur`);
    assert.equal(m.element("conventionMessage").classList.contains("is-hidden"), true, `${nom} : alerte cachée`);
  }
});

// Echoue si « Enregistrer » exige un champ : année vide, aucun signataire, représentant
// et fonction du représentant vides doivent passer (c'est un brouillon, la note
// ne controle les champs obligatoires qu'a « Générer »).
test("« Enregistrer » accepte un brouillon : année vide, aucun signataire, représentant et fonction vides", () => {
  const m = ouvrirFenetre(donneesFenetre());
  m.saisirAnnee("");
  m.element("agenceRepresentant").value = "";
  m.element("agenceFonction").value = "";
  m.soumettre();
  assert.equal(m.enregistrements.length, 1, "un enregistrement");
  const {valeurs} = m.enregistrements[0];
  assert.equal(valeurs.annee, "");
  assert.equal(valeurs.signataire, 0);
  assert.equal(valeurs.representant, "");
  assert.equal(valeurs.fonctionRepresentant, "");
  assert.equal(m.element("conventionAnnee").classList.contains("is-invalid"), false);
  assert.equal(m.element("conventionMessage").classList.contains("is-hidden"), true);
});

// Echoue si le message d'erreur et l'alerte disparaissent des la saisie (la note les
// retire au clic suivant sur « Enregistrer », pas pendant la saisie), s'ils restent
// apres le clic suivant une fois l'annee corrigee, si les trois attributs du champ
// ne sont pas retires, ou si l'enregistrement n'a pas lieu au clic suivant.
test("l'erreur de l'année et l'alerte restent pendant la saisie, et disparaissent au clic suivant une fois l'année corrigée", () => {
  const m = ouvrirFenetre(donneesFenetre());
  const annee = m.element("conventionAnnee");
  const alerte = m.element("conventionMessage");
  assert.equal(alerte.classList.contains("is-hidden"), true, "alerte cachée à l'ouverture");
  assert.equal(annee.classList.contains("is-invalid"), false, "pas d'erreur à l'ouverture");

  m.saisirAnnee("26");
  m.soumettre();
  assert.equal(annee.classList.contains("is-invalid"), true, "erreur après le premier clic");
  assert.equal(alerte.classList.contains("is-hidden"), false, "alerte après le premier clic");

  m.saisirAnnee("2026");
  assert.equal(annee.classList.contains("is-invalid"), true, "l'erreur reste pendant la saisie");
  assert.equal(alerte.classList.contains("is-hidden"), false, "l'alerte reste pendant la saisie");
  assert.equal(m.enregistrements.length, 0, "rien n'est enregistré avant le clic suivant");

  m.soumettre();
  assert.equal(annee.classList.contains("is-invalid"), false, "is-invalid retiré");
  assert.equal(annee.getAttribute("aria-invalid"), null, "aria-invalid retiré");
  assert.equal(annee.getAttribute("aria-describedby"), null, "aria-describedby retiré");
  assert.equal(alerte.classList.contains("is-hidden"), true, "alerte cachée");
  assert.equal(m.enregistrements.length, 1, "enregistré au clic suivant");
});

// ---- 9.7 Ce que recoit conventionEnregistrer (point d'appel de la tache 5.2) ----

// Echoue si conventionEnregistrer ne recoit plus l'identifiant de l'action, l'annee
// (texte), l'identifiant du contact choisi, le representant et la fonction du representant
// sans espaces autour, ou si preventDefault n'est pas appele (la page serait rechargee).
test("conventionEnregistrer reçoit l'action et les valeurs saisies (textes sans espaces autour, identifiant du signataire)", () => {
  const m = ouvrirFenetre(donneesFenetre());
  m.saisirAnnee("2031");
  m.choisir(31);
  m.element("agenceRepresentant").value = "  Dana Exemple  ";
  m.element("agenceFonction").value = " Directrice adjointe ";
  assert.equal(m.soumettre(), true, "preventDefault est appelé");
  assert.equal(m.enregistrements.length, 1);
  const {actionId, valeurs} = m.enregistrements[0];
  assert.equal(actionId, 1);
  assert.equal(valeurs.annee, "2031");
  assert.equal(valeurs.anneeIllisible, false);
  assert.equal(valeurs.signataire, 31);
  assert.equal(valeurs.representant, "Dana Exemple");
  assert.equal(valeurs.fonctionRepresentant, "Directrice adjointe");
});

// Echoue si, sans annee (Avec_annee faux), « Enregistrer » controle ou cherche encore
// l'annee (erreur, plantage), ou si annee n'est plus null dans les valeurs transmises.
test("Avec_annee faux : « Enregistrer » ne contrôle pas d'année et transmet annee = null", () => {
  const m = ouvrirFenetre(donneesFenetre({modele: {Avec_annee: false}}));
  m.choisir(31);
  m.soumettre();
  assert.equal(m.enregistrements.length, 1, "un enregistrement");
  const {valeurs} = m.enregistrements[0];
  assert.equal(valeurs.annee, null);
  assert.equal(valeurs.anneeIllisible, false);
  assert.equal(valeurs.signataire, 31);
  assert.equal(m.element("conventionMessage").classList.contains("is-hidden"), true, "pas d'alerte");
});

// ---- 9.8 Valeurs venant de Grist ----

// Echoue si le titre du modele ou le nom d'un contact n'echappe plus <, >, & ou les
// guillemets (le HTML s'executerait ou casserait l'attribut), si la valeur de l'option
// n'est plus l'identifiant du contact, ou si la fonction du signataire, mise dans
// la zone apres le choix, est alteree ou ecrite dans la page comme du HTML.
test("des caractères spéciaux dans le titre du modèle ou le nom d'un contact s'affichent comme du texte", () => {
  const titre = 'Modèle <u>Exemple</u> & "Cie"';
  const contacts = [{id: 41, Club: 7, Prenom: "<b>Camille</b>", Nom: 'Exemple & "Fils"', Fonction: "<i>Présidente</i> & Cie"}];
  const m = ouvrirFenetre(donneesFenetre({modele: {Titre: titre}, contacts}));
  const {html} = m;
  for (const balisage of ["<b>", "</b>", "<u>", "</u>", "<i>"]) assert.ok(!html.includes(balisage), `${balisage} ne doit pas passer tel quel`);
  assert.ok(html.includes("&lt;b&gt;Camille&lt;/b&gt; Exemple &amp; &quot;Fils&quot;"), "le libellé du contact est échappé");
  assert.deepEqual(options(html, "clubSignataire")[1], {value: "41", texte: '<b>Camille</b> Exemple & "Fils"', invite: false});
  assert.equal(champ(html, "conventionModele"), titre);
  m.choisir(41);
  assert.equal(m.element("clubFonction").value, "<i>Présidente</i> & Cie", "la fonction s'affiche telle quelle, comme du texte");
  assert.ok(!m.hote.innerHTML.includes("<i>"), "la fonction n'est pas écrite dans la page comme du HTML");
});
