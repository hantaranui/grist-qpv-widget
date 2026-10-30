"use strict";

// Bouton « Générer la convention » et fenetre « Convention » (taches 5.1a et 5.1b, mis a jour
// pour l'Evolution 1 : docs/ux/convention.md, §3, D-E1-1 a D-E1-21) :
// bouton present seulement a l'etat A generer, message de blocage, ouverture et
// fermeture de la fenetre, echappement des valeurs venant de Grist, focus (Echap, Tab,
// Maj+Tab) ; puis les deux blocs Club et Agence (plus de bloc « Informations », plus de champ
// « Modele utilise » ni « Annee »), l'encart du club, le sous-titre, la liste des signataires, la
// fonction du signataire, le representant, le pied a deux boutons (« Fermer » enregistre en silence ;
// plus de « Enregistrer les informations ») et le seuil de deux colonnes a 1100 px.
// Plus aucun champ obligatoire : pas d'asterisque, pas de required, pas de controle d'annee.
// Le bouton « Ajouter un contact » et la creation du contact sont dans convention-contact.test.js.
// Depuis la 7.2b, le pied a le bouton « Générer la convention » : son comportement (verrou, echecs,
// reussite) est dans test/convention-generer-ecran.test.js.
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
      Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, Campagne: 4, ...action}],
      Dispositifs: [{id: 3, Dispositif: "Du stade vers l'emploi"}],
      Campagnes: [{id: 4, Campagne: "2026"}],
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
// invite = l'option « Veuillez sélectionner » (selectionnee, valeur vide ; depuis l'E1 elle n'est plus desactivee).
function options(html, id) {
  const m = new RegExp(`<select\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</select>`).exec(html);
  if (!m) return null;
  return [...m[1].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map((o) => ({
    value: attribut(`<option${o[1]}>`, "value"),
    texte: decoder(o[2]),
    invite: /\sselected\b/.test(o[1]) && !/\sdisabled\b/.test(o[1]) && attribut(`<option${o[1]}>`, "value") === "",
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
      hidden: /\shidden\b/.test(balisePosee),
      // Encart du club (conventionAjusterEncart) : hauteur de son contenu et des bordures.
      style: {}, scrollHeight: 54, offsetHeight: 56, clientHeight: 54,
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
    // Liste de choix : ses options sont lues dans le HTML, et on peut en ajouter (insertBefore) ou en
    // retirer (remove), comme le fait la saisie libre pour l'option « (nouveau contact) ».
    if (/^<select\b/.test(balisePosee)) {
      const corps = new RegExp(`<select\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</select>`).exec(contenu);
      element.options = [...(corps ? corps[1] : "").matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)]
        .map((o) => fabriquerOption(attribut(`<option${o[1]}>`, "value") ?? "", decoder(o[2]), element));
      element.insertBefore = (option, reference) => {
        const rang = reference ? element.options.indexOf(reference) : element.options.length;
        element.options.splice(rang < 0 ? element.options.length : rang, 0, option);
        option.liste = element;
        if (option.id) registre.set(option.id, option);
      };
    }
    return element;
  }

  // Une option de liste : valeur, texte et retrait.
  function fabriquerOption(valeur, texte, liste) {
    const option = {id: "", value: valeur, textContent: texte, liste};
    option.remove = () => {
      if (option.liste) option.liste.options = option.liste.options.filter((autre) => autre !== option);
      if (option.id) registre.delete(option.id);
    };
    return option;
  }
  doc.createElement = () => fabriquerOption("", "", null);

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
      return contenu !== "" && /^(convention|club|agence|signataire)[A-Z]/.test(id) ? null : origine.getElementById(id);
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

  // openConvention ecoute le redimensionnement de la fenetre (hauteur de l'encart) : la doublure
  // de base n'a pas addEventListener, on la pose ici et on garde les ecouteurs pour les tests.
  const ecouteursFenetre = {};
  w.window.addEventListener = (type, f) => { (ecouteursFenetre[type] ||= []).push(f); };
  w.window.removeEventListener = (type, f) => { ecouteursFenetre[type] = (ecouteursFenetre[type] || []).filter((g) => g !== f); };

  // On remplace conventionEnregistrer dans le widget par un espion qui note ses appels et dit
  // « enregistre » (vrai). `w.window` est le global du bac a sable : y poser une fonction remplace
  // celle que fermerConvention (« Fermer », Echap) et la generation appellent.
  const enregistrements = [];
  w.window.conventionEnregistrer = (actionId, valeurs, options) => { enregistrements.push({actionId, valeurs, options}); return true; };

  // Entree dans un champ : le formulaire n'a plus de bouton d'envoi, l'evenement submit ne doit
  // rien faire (E1) que preventDefault. Renvoie vrai si le script a appele preventDefault.
  function soumettre() {
    let empeche = false;
    const evenement = {preventDefault() { empeche = true; }};
    (doc.getElementById("conventionForm").ecouteurs.submit || []).slice().forEach((f) => f(evenement));
    return empeche;
  }

  // Choix d'un contact dans la liste « Signataire » : la valeur change, puis l'evenement change part.
  function choisir(idContact) {
    const liste = doc.getElementById("clubSignataire");
    liste.value = String(idContact);
    (liste.ecouteurs.change || []).slice().forEach((f) => f({}));
  }

  // Frappe dans un champ de texte : la valeur change, puis l'evenement input part.
  function ecrire(id, valeur) {
    const champ = doc.getElementById(id);
    champ.value = valeur;
    (champ.ecouteurs.input || []).slice().forEach((f) => f({}));
  }

  return {
    w, hote, bouton, touche, soumettre, choisir, enregistrements, ecouteursFenetre, ecrire,
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

// Echoue si la zone #conventionBlocage (role="status") apparait hors des etats A generer et
// Generee (depuis la 8.1, pour « Re-générer »), disparait de ces etats quand rien ne manque, ou
// n'est pas vide quand rien ne manque.
test("la zone #conventionBlocage (role=status) n'existe qu'aux états À générer et Générée et reste vide quand rien ne manque", () => {
  const w = loadWidget();
  for (const [nom, {jeu}] of Object.entries(ETATS)) {
    const bouton = nom === "À générer" || nom === "Générée";
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

// Pour chacun des trois elements. Echoue si le bouton n'est plus grise par
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
  for (const element of ["agence", "club"]) {
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
// role de dialogue (role, aria-modal, titre relie), si le sous-titre n'est plus relie par
// aria-describedby, ou si le focus d'ouverture n'est pas sur la liste « Signataire » (le premier
// champ modifiable, depuis l'E1 : le champ « Année » n'existe plus).
test("clic sur le bouton actif : la fenêtre s'ouvre, annoncée comme un dialogue, et le focus va sur « Signataire »", () => {
  const {w, hote, actif, corpsAClasse} = ouvrirFenetre(donnees());
  const fenetre = balise(hote.innerHTML, "conventionDialog");
  assert.notEqual(fenetre, null, "la fenêtre est dans la page");
  assert.equal(attribut(fenetre, "role"), "dialog");
  assert.equal(attribut(fenetre, "aria-modal"), "true");
  assert.equal(attribut(fenetre, "aria-labelledby"), "conventionTitle");
  assert.equal(attribut(fenetre, "aria-describedby"), "conventionSubtitle", "le sous-titre est lu après le titre");
  assert.equal(w.state.conventionOpen, true);
  assert.equal(corpsAClasse("modal-open"), true);
  assert.equal(actif().id, "clubSignataire", "le focus est sur la liste Signataire");
});

// ---------------------------------------------------------------------------
// 3 bis. E1 : sous-titre « [Dispositif] · Campagne [Campagne] » dans l'en-tete
// ---------------------------------------------------------------------------

// Echoue si le sous-titre n'est plus dans l'en-tete, sous le titre « Convention » (avant le corps et
// avant la phrase d'introduction), s'il n'est plus un simple paragraphe (<p>), si son texte n'est plus
// « [Dispositif] · Campagne [Campagne] » (point median), ou s'il est lie par un autre identifiant.
test("sous-titre : « Du stade vers l'emploi · Campagne 2026 », dans l'en-tête sous le titre, avant la phrase d'introduction", () => {
  const {html} = ouvrirFenetre(donnees());
  assert.equal(texteDe(html, "p", "conventionSubtitle"), "Du stade vers l'emploi · Campagne 2026");
  const entete = html.indexOf('<div class="modal-header">');
  const titre = html.indexOf('id="conventionTitle"');
  const sousTitre = html.indexOf('id="conventionSubtitle"');
  const corps = html.indexOf('<div class="modal-body">');
  const intro = html.indexOf('class="convention-intro"');
  assert.ok(entete !== -1 && entete < titre && titre < sousTitre && sousTitre < corps && corps < intro, "en-tête : titre puis sous-titre, puis le corps et la phrase d'introduction");
  assert.equal(compte(html, /id="conventionSubtitle"/g), 1, "un seul sous-titre");
});

// Echoue si une campagne vide, absente ou introuvable fait ecrire « · Campagne » sans valeur ou
// « undefined » (D-E1-8 : le dispositif seul), si une campagne texte (ancienne colonne) n'est plus
// lue, ou si le nom du dispositif ou la campagne ne sont plus echappes (HTML).
test("sous-titre : campagne vide, absente ou introuvable → le dispositif seul ; campagne ou dispositif avec du HTML → échappé", () => {
  const w = loadWidget();
  const seul = "Du stade vers l'emploi";
  assert.equal(w.conventionSousTitre(1, donnees()), `${seul} · Campagne 2026`);
  assert.equal(w.conventionSousTitre(1, donnees({action: {Campagne: 0}})), seul, "référence vide");
  assert.equal(w.conventionSousTitre(1, donnees({action: {Campagne: 99}})), seul, "ligne introuvable dans Campagnes");
  const sansTable = donnees();
  delete sansTable.raw.Campagnes;
  assert.equal(w.conventionSousTitre(1, sansTable), seul, "table Campagnes non chargée");
  const vide = donnees();
  vide.raw.Campagnes = [{id: 4, Campagne: "   "}];
  assert.equal(w.conventionSousTitre(1, vide), seul, "texte de campagne fait d'espaces");
  assert.equal(w.conventionSousTitre(1, donnees({action: {Campagne: "2027"}})), `${seul} · Campagne 2027`, "ancienne colonne texte");
  const jeu = donnees();
  jeu.raw.Dispositifs = [{id: 3, Dispositif: "Dispo <b>X</b>"}];
  jeu.raw.Campagnes = [{id: 4, Campagne: "<i>2026</i>"}];
  const html = w.conventionModalHtml(1, jeu);
  assert.ok(!html.includes("<b>") && !html.includes("<i>"), "le HTML des valeurs n'est pas inséré tel quel");
  assert.equal(texteDe(html, "p", "conventionSubtitle"), "Dispo <b>X</b> · Campagne <i>2026</i>", "affiché comme du texte");
});

// ---------------------------------------------------------------------------
// 4. Contenu de la fenetre : encart du club et nom de l'agence, en lecture seule
// ---------------------------------------------------------------------------

// Echoue si l'encart n'est plus un seul textarea en lecture seule, de libelle « Club », avec nom du
// club, SIRET et adresse dans cet ordre sur UNE ligne (aucun retour a la ligne dans le texte),
// si la fenetre affiche encore des champs separes (nom, SIRET, siege) ou l'adresse de l'agence.
// Les separateurs exacts ne sont pas figes : la note (3 lignes « SIRET : … ») et le code (une ligne)
// ne disent pas la meme chose, voir le rapport.
test("la fenêtre affiche le club dans un seul encart en lecture seule (nom, SIRET, adresse sur une ligne) et l'agence par son nom seul", () => {
  const {html} = ouvrirFenetre(donnees());
  const encart = champ(html, "clubEncart");
  assert.ok(!encart.includes("\n"), "une seule ligne : aucun retour à la ligne");
  const nom = encart.indexOf("Club Exemple");
  const siret = encart.indexOf("12345678901234");
  const adresse = encart.indexOf("1 rue Exemple 75001 Exemple-sur-Mer");
  assert.ok(nom !== -1 && nom < siret && siret < adresse, `ordre nom, SIRET, adresse dans « ${encart} »`);
  assert.match(balise(html, "clubEncart"), /\sreadonly\b/, "en lecture seule");
  assert.match(balise(html, "clubEncart"), /^<textarea\b/, "c'est un textarea");
  assert.equal(libelleNu(html, "clubEncart"), "Club");
  assert.match(html, /<label class="form-label sr-only" for="clubEncart">Club<\/label>/, "libellé gardé pour les lecteurs d'écran, non affiché");
  assert.equal(champ(html, "agenceNom"), "Agence Exemple");
  assert.equal(libelleNu(html, "agenceNom"), "Agence");
  for (const disparu of ["clubNom", "clubSiret", "clubSiege", "agenceAdresse", "conventionModele", "conventionAnnee"]) {
    assert.equal(compte(html, new RegExp(`id="${disparu}"`, "g")), 0, `${disparu} n'existe plus`);
  }
  assert.ok(!html.includes("2 avenue Exemple"), "l'adresse de l'agence n'est plus affichée");
  assert.ok(!html.includes("Bâtiment A"), "le complément d'adresse de l'agence non plus");
});

// Echoue si un SIRET ou une adresse absents du club laissent un vide dans l'encart : la note dit
// « SIRET : non renseigné » et « Adresse : non renseignée ». Fonction pure (conventionEncartClub) : une
// adresse absente bloque l'ouverture de la fenetre (conventionBlocage), donc elle ne se voit pas a l'ecran.
test("encart du club : SIRET ou adresse absents → « non renseigné(e) », jamais un vide ni « undefined »", () => {
  const w = loadWidget();
  const encart = w.conventionEncartClub(w.conventionInfos(1, donnees({club: {SIRET: "", Adresse: "", Code_postal: "", Ville: ""}})));
  assert.ok(encart.startsWith("Club Exemple"), "le nom reste en premier");
  assert.match(encart, /SIRET\s*:?\s*non renseigné/i);
  assert.match(encart, /adresse\s*:?\s*non renseignée/i);
  assert.ok(!/undefined|null/.test(encart));
  assert.ok(!encart.includes("\n"), "toujours une seule ligne");
});

// Echoue si l'encart garde sa poignee de redimensionnement (D-E1-19), un defilement interne, ou
// si la feuille ne declare plus la regle qui les retire (selecteur plus precis que
// « .edit-field textarea », qui autorise resize: vertical).
test("encart du club : plus de poignée de redimensionnement ni de défilement interne (D-E1-19)", () => {
  assert.match(CSS, /\.edit-field\s+textarea\.convention-encart\s*\{[^}]*resize:\s*none/);
  assert.match(CSS, /\.edit-field\s+textarea\.convention-encart\s*\{[^}]*overflow:\s*hidden/);
  const {html} = ouvrirFenetre(donnees());
  assert.match(balise(html, "clubEncart"), /\sclass="[^"]*\bconvention-encart\b/, "le champ porte la classe de la règle");
});

// Echoue si la hauteur de l'encart n'est plus reglee d'apres son contenu a l'ouverture (hauteur du
// contenu plus les bordures), ne suit plus un changement de largeur (evenement resize), ou si
// l'ecouteur reste en place apres la fermeture (fuite : il agirait sur un champ qui n'existe plus).
test("encart du club : hauteur réglée sur le contenu à l'ouverture et au redimensionnement, écouteur retiré à la fermeture", async () => {
  const {element, ecouteursFenetre} = ouvrirFenetre(donnees());
  const encart = element("clubEncart");
  assert.equal(encart.style.height, "56px", "scrollHeight 54 + bordures 2");
  assert.equal((ecouteursFenetre.resize || []).length, 1, "un écouteur de redimensionnement");
  encart.scrollHeight = 80;
  ecouteursFenetre.resize.slice().forEach((f) => f({}));
  assert.equal(encart.style.height, "82px", "la hauteur suit le contenu quand la largeur change");
  element("conventionFermer").click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal((ecouteursFenetre.resize || []).length, 0, "l'écouteur est retiré à la fermeture");
});

// Echoue si un des champs prevus en lecture seule (encart du club, fonction du signataire, nom de
// l'agence) devient modifiable, si un des six champs a remplir (signataire, nom, prenom et e-mail
// du nouveau contact, representant, fonction du representant) devient en lecture seule, ou si les neuf champs ne sont plus la.
test("seuls les champs prévus sont en lecture seule ; signataire, nouveau contact, représentant et fonction du représentant se remplissent", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const champs = [...html.matchAll(/<(?:input|textarea|select)\b([^>]*)>/g)]
    .map((m) => ({id: /\sid="([^"]+)"/.exec(m[1])[1], lecture: /\sreadonly\b/.test(m[1])}));
  assert.equal(champs.length, 9, "un encart, une liste, trois champs de nouveau contact, la fonction, puis trois champs de l'agence");
  assert.deepEqual(champs.filter((c) => c.lecture).map((c) => c.id), ["clubEncart", "clubFonction", "agenceNom"]);
  assert.deepEqual(champs.filter((c) => !c.lecture).map((c) => c.id),
    ["clubSignataire", "signataireNom", "signatairePrenom", "signataireEmail", "agenceRepresentant", "agenceFonction"]);
  assert.equal(compte(html, /<select\b/g), 1, "une seule liste de choix : le signataire");
});

// Echoue si le titre, l'un des deux intitules de bloc (« Club », « Agence »), la phrase d'aide du bloc
// club (a sa place, entre les deux blocs) ou le libelle « Fermer » change.
test("la fenêtre porte son titre, ses deux blocs Club et Agence, la phrase « Pour corriger ces informations… » et le bouton Fermer", () => {
  const {html} = ouvrirFenetre(donnees());
  assert.equal(texteDe(html, "h2", "conventionTitle"), "Convention");
  const club = html.indexOf('<legend class="form-legend">Club</legend>');
  const aide = html.indexOf('<p class="help-block">Pour corriger ces informations, modifiez la fiche du club.</p>');
  const agence = html.indexOf('<legend class="form-legend">Agence</legend>');
  assert.ok(club !== -1 && aide !== -1 && agence !== -1, "titres et phrase présents");
  assert.ok(club < aide && aide < agence, "la phrase est dans le bloc club");
  assert.equal(texteDe(html, "button", "conventionFermer"), "Fermer");
});

// ---------------------------------------------------------------------------
// 5. Valeurs venant de Grist : du texte, jamais du HTML
// ---------------------------------------------------------------------------

// Echoue si l'encart (nom du club, SIRET, adresse) ou le nom de l'agence n'echappe plus <, >, &
// ou les guillemets : le HTML s'executerait, ou casserait l'attribut value.
test("des caractères spéciaux dans le nom du club, le SIRET ou le nom de l'agence s'affichent comme du texte", () => {
  const nomClub = 'Club <b>Exemple</b> & "Fils"';
  const siret = "<i>123</i> & 4";
  const nomAgence = "Agence <u>Exemple</u> & Cie";
  const {html} = ouvrirFenetre(donnees({club: {Nom: nomClub, SIRET: siret}, agence: {Libelle_agence: nomAgence}}));
  for (const balisage of ["<b>", "</b>", "<i>", "<u>"]) assert.ok(!html.includes(balisage), `${balisage} ne doit pas passer tel quel`);
  assert.ok(html.includes("&lt;b&gt;Exemple&lt;/b&gt; &amp; &quot;Fils&quot;"), "le nom du club est échappé");
  const encart = champ(html, "clubEncart");
  assert.ok(encart.includes(nomClub) && encart.includes(siret), "l'encart montre les valeurs comme du texte");
  assert.equal(champ(html, "agenceNom"), nomAgence);
});

// Echoue si l'encart n'echappe plus l'adresse du club : une adresse qui ferme la zone puis ouvre
// un script s'executerait.
test("des caractères spéciaux dans l'adresse du club s'affichent comme du texte", () => {
  const adresseClub = "1 rue <i>Exemple</i> & Cie</textarea><script>alert(1)</script>";
  const {html} = ouvrirFenetre(donnees({club: {Adresse: adresseClub}}));
  assert.ok(!/<script/i.test(html), "aucune balise script");
  assert.ok(!html.includes("<i>"), "<i> ne doit pas passer tel quel");
  assert.ok(champ(html, "clubEncart").includes(`${adresseClub} 75001 Exemple-sur-Mer`), "l'adresse est affichée comme du texte");
});

// ---------------------------------------------------------------------------
// 6. Fermeture : « Fermer » et Echap enregistrent en silence puis ferment (D-E1-5)
// ---------------------------------------------------------------------------
// fermerConvention est asynchrone (elle attend l'enregistrement) : on laisse passer les
// promesses avant de lire la page. L'espion de monter() repond « enregistre ».

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// Echoue si « Fermer » ne ferme plus la fenetre, ne retire plus modal-open de la page, ne rend plus
// le focus au bouton « Générer la convention » du bloc, laisse l'ecouteur du clavier en place, ou
// n'enregistre pas ce qui est saisi (en silence : option silencieux).
test("« Fermer » enregistre en silence puis ferme la fenêtre ; le focus revient sur le bouton « Générer la convention »", async () => {
  const {w, hote, bouton, actif, element, corpsAClasse, enregistrements} = ouvrirFenetre(donnees());
  assert.equal(w.state.conventionOpen, true);
  element("conventionFermer").click();
  await attendre();
  assert.equal(enregistrements.length, 1, "un enregistrement");
  assert.equal(enregistrements[0].options.silencieux, true, "en silence");
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
  assert.equal(corpsAClasse("modal-open"), false);
  assert.equal(actif(), bouton, "le focus est revenu sur le bouton");
  assert.equal((hote.ecouteurs.keydown || []).length, 0, "l'écouteur du clavier est retiré");
});

// Echoue si la touche Echap n'appelle plus preventDefault ou n'a plus le meme effet que « Fermer »
// (enregistrer en silence, fermer, rendre le focus au bouton « Générer la convention »).
test("Échap a le même effet que « Fermer » : enregistre en silence, ferme, le focus revient sur « Générer la convention »", async () => {
  const {w, hote, bouton, touche, actif, corpsAClasse, enregistrements} = ouvrirFenetre(donnees());
  assert.equal(touche("Escape"), true, "preventDefault est appelé");
  await attendre();
  assert.equal(enregistrements.length, 1);
  assert.equal(hote.innerHTML, "");
  assert.equal(w.state.conventionOpen, false);
  assert.equal(corpsAClasse("modal-open"), false);
  assert.equal(actif(), bouton, "le focus est revenu sur le bouton");
  assert.equal((hote.ecouteurs.keydown || []).length, 0, "l'écouteur du clavier est retiré");
});

// Echoue si « Fermer » enregistre autre chose que ce qui est a l'ecran : signataire de la liste,
// representant et fonction sans espaces autour, pas de nouveau contact, et aucune cle `annee`
// (le champ n'existe plus : une cle `annee: null` effacerait l'annee deja enregistree).
test("« Fermer » enregistre les valeurs saisies : signataire de la liste, représentant et fonction nettoyés, pas de nouveau contact, pas d'année", async () => {
  const m = ouvrirFenetre(donneesFenetre());
  m.choisir(31);
  m.element("agenceRepresentant").value = "  Dana Exemple  ";
  m.element("agenceFonction").value = " Directrice adjointe ";
  m.element("conventionFermer").click();
  await attendre();
  assert.equal(m.enregistrements.length, 1);
  const {actionId, valeurs} = m.enregistrements[0];
  assert.equal(actionId, 1);
  assert.equal(valeurs.signataire, 31);
  assert.equal(valeurs.nouveauContact, null);
  assert.equal(valeurs.representant, "Dana Exemple");
  assert.equal(valeurs.fonctionRepresentant, "Directrice adjointe");
  assert.equal("annee" in valeurs, false, "aucune clé annee");
  assert.equal("anneeIllisible" in valeurs, false, "aucune clé anneeIllisible");
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
// Depuis l'E1, les controles de la fenetre sont, dans l'ordre : l'encart du club, Signataire, le bouton
// « Ajouter un contact », Nom, Prenom, E-mail, Fonction du signataire, Agence, Representant, Fonction du
// representant, puis les deux boutons du pied : Fermer et Generer la convention. Le premier est donc
// l'encart « Club » (en lecture seule, mais atteignable au clavier) et le dernier « Générer la
// convention » (aria-disabled ne le retire pas de la liste : seul l'attribut disabled le ferait).
// Si une tache ajoute un champ ou un bouton aux extremites, ces tests seront a adapter.

// Echoue si Tab sur le dernier controle (Generer la convention) ne revient plus au
// premier (l'encart du club), ou si la touche n'est plus retenue (preventDefault).
test("Tab sur le dernier élément de la fenêtre (Générer la convention) revient au premier (l'encart du club)", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("conventionGenererFenetre").focus();
  assert.equal(touche("Tab"), true, "preventDefault est appelé");
  assert.equal(actif(), element("clubEncart"));
});

// Echoue si Maj+Tab sur le premier controle (l'encart du club) ne va plus au dernier
// (Generer la convention), ou si la touche n'est plus retenue (preventDefault).
test("Maj+Tab sur le premier élément de la fenêtre (l'encart du club) va au dernier (Générer la convention)", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("clubEncart").focus();
  assert.equal(touche("Tab", {shift: true}), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionGenererFenetre"));
});

// Echoue si Maj+Tab depuis la fenetre elle-meme (le focus peut y revenir, par exemple
// apres un clic dans la fenetre) ne va plus au dernier controle : le focus sortirait
// de la fenetre. A l'ouverture, le focus n'y est plus (il est sur « Signataire ») : on l'y met.
test("Maj+Tab, quand le focus est sur la fenêtre elle-même, va au dernier élément (Générer la convention)", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("conventionDialog").focus();
  assert.equal(touche("Tab", {shift: true}), true, "preventDefault est appelé");
  assert.equal(actif(), element("conventionGenererFenetre"));
});

// Echoue si « Fermer » (devenu l'avant-dernier controle) est encore pris pour le dernier : Tab
// dessus ne doit rien intercepter. Echoue aussi si Maj+Tab sur « Générer la convention » (le
// dernier, mais pas le premier) est intercepte.
test("Tab sur « Fermer » et Maj+Tab sur « Générer la convention » ne sont pas interceptés", () => {
  const {touche, actif, element} = ouvrirFenetre(donneesFenetre());
  element("conventionFermer").focus();
  assert.equal(touche("Tab"), false, "Tab sur « Fermer » n'est pas retenue");
  assert.equal(actif(), element("conventionFermer"), "le script ne déplace pas le focus");
  element("conventionGenererFenetre").focus();
  assert.equal(touche("Tab", {shift: true}), false, "Maj+Tab sur « Générer » n'est pas retenue");
  assert.equal(actif(), element("conventionGenererFenetre"), "le script ne déplace pas le focus");
});

// Echoue si le piege a focus intercepte Tab ou Maj+Tab sur un controle du milieu
// (« Signataire », le focus d'ouverture) : seuls le premier et le dernier controle bouclent.
test("Tab et Maj+Tab depuis « Signataire » (focus d'ouverture) ne sont pas interceptés", () => {
  const {touche, actif} = ouvrirFenetre(donneesFenetre());
  assert.equal(actif().id, "clubSignataire");
  assert.equal(touche("Tab"), false, "Tab n'est pas retenue");
  assert.equal(touche("Tab", {shift: true}), false, "Maj+Tab n'est pas retenue");
  assert.equal(actif().id, "clubSignataire", "le script ne déplace pas le focus");
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
// (convention-grid, convention-part, convention-champs, convention-actions, convention-soustitre,
// convention-intro) ou la regle qui affiche la fenetre (la feuille du design system la masque par defaut),
// ou si la regle n'affiche plus aussi la pop-up du PDF (#conventionPdfModal), si la classe
// convention-pdf-plein-ecran n'a plus pleine largeur, pleine hauteur et aucune marge, ou si le cadre du PDF
// n'a plus toute la largeur.
test("style.css déclare les classes de la fenêtre et du bouton, et affiche la fenêtre ainsi que la pop-up plein écran du PDF", () => {
  for (const nom of ["convention-grid", "convention-part", "convention-champs", "convention-actions", "convention-soustitre", "convention-intro"]) {
    assert.match(CSS, new RegExp(`\\.${nom}(?![\\w-])`), `.${nom} doit exister dans la feuille`);
  }
  // Depuis l'evolution 2, la regle est partagee : « #conventionModal .modal, #conventionPdfModal .modal { display: block }».
  assert.match(CSS, /#conventionModal\s+\.modal\s*,\s*#conventionPdfModal\s+\.modal\s*\{[^}]*display:\s*block/, "la fenêtre et la pop-up du PDF doivent être affichées");
  assert.match(CSS, /#conventionPdfModal\s+\.convention-pdf-plein-ecran\s*\{[^}]*max-width:\s*none[^}]*width:\s*100%[^}]*height:\s*100%[^}]*margin:\s*0/, "la pop-up du PDF est en plein écran (pleine largeur, pleine hauteur, sans marge)");
  assert.match(CSS, /\.convention-pdf-cadre\s*\{[^}]*width:\s*100%/, "le cadre du PDF prend toute la largeur");
});

// Echoue si le seuil de bascule a deux colonnes n'est plus 1100 px (D-E1-20, il etait de 1200 px),
// si les deux colonnes ne sont plus posees dans cette regle, ou si l'ancien seuil de 1200 px reste
// dans la feuille pour la grille de la fenetre.
test("seuil de deux colonnes à 1100 px (D-E1-20) : la grille de la fenêtre passe à deux colonnes à partir de 1100 px, plus de 1200 px", () => {
  const regle = /@media\s*\(min-width:\s*(\d+)px\)\s*\{\s*(?:\/\*[\s\S]*?\*\/\s*)?\.convention-grid\s*\{([^}]*)\}/.exec(CSS);
  assert.ok(regle, "une règle @media contient .convention-grid");
  assert.equal(regle[1], "1100", "seuil de 1100 px");
  assert.match(regle[2], /grid-template-columns:\s*minmax\(0,\s*3fr\)\s*minmax\(0,\s*2fr\)/, "Club 3 parts, Agence 2 parts");
  assert.ok(!/min-width:\s*1200px[^{]*\{\s*(?:\/\*[\s\S]*?\*\/\s*)?\.convention-grid/.test(CSS), "plus de seuil à 1200 px pour la grille");
  assert.match(CSS, /\.convention-grid\s*\{\s*display:\s*grid;\s*gap:\s*24px;\s*\}/, "une seule colonne en dessous du seuil");
});

// ---------------------------------------------------------------------------
// 9. Evolution 1 : deux blocs, plus aucun champ obligatoire, pied a deux boutons
// ---------------------------------------------------------------------------
// ---- 9.0 Phrase d'introduction ----

// Echoue si la phrase n'est pas exactement celle de la note (mise a jour du 2026-10-29, « sans
// exception ni sauf »), si elle n'est plus un paragraphe ordinaire du corps, ou si l'ancienne
// phrase « Les champs marqués d'un * sont obligatoires… » revient.
test("la phrase d'introduction dit qu'un champ laissé vide sera complété à la main en pointillés (sans exception)", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  assert.ok(html.includes('<p class="convention-intro">Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature.</p>'),
    "la phrase doit reprendre le texte exact de la note UX");
  assert.equal(compte(html, /convention-intro/g), 1, "une seule phrase d'introduction");
  assert.ok(!html.includes("sont obligatoires"), "plus de phrase sur les champs obligatoires");
  assert.ok(!/sauf/i.test(html), "aucune exception dans la fenêtre");
});

// ---- 9.1 Structure : blocs, champs, libelles ----

// Echoue si la fenetre n'a plus exactement deux blocs (fieldset), dans cet ordre, avec leur titre
// (legend) et leurs champs : Club (encart, signataire, nouveau contact, fonction), Agence (nom,
// representant, fonction du representant) ; ou si le bouton « Ajouter un contact » sort du bloc Club.
test("la fenêtre a deux blocs, dans l'ordre : Club puis Agence, chacun avec ses champs", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const blocs = html.split("<fieldset").slice(1);
  assert.equal(blocs.length, 2, "deux blocs");
  assert.deepEqual(blocs.map((b) => decoder(/<legend class="form-legend">([^<]*)<\/legend>/.exec(b)[1])), ["Club", "Agence"]);
  assert.deepEqual(idsDesChamps(blocs[0]), ["clubEncart", "clubSignataire", "signataireNom", "signatairePrenom", "signataireEmail", "clubFonction"]);
  assert.deepEqual(idsDesChamps(blocs[1]), ["agenceNom", "agenceRepresentant", "agenceFonction"]);
  assert.ok(blocs[0].includes('id="signataireAjouter"'), "le bouton « Ajouter un contact » est dans le bloc Club");
  assert.ok(!blocs[1].includes("signataireAjouter"));
});

// Echoue si un libelle change d'un mot, si un champ garde (ou reprend) un « * », un attribut
// required ou aria-required (D-E1-17 : plus aucun champ obligatoire), ou si le formulaire perd
// novalidate (le navigateur bloquerait alors la fermeture sur un champ invalide).
test("plus aucun champ obligatoire : aucun « * », aucun required, formulaire en novalidate", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const attendus = {
    clubEncart: "Club",
    clubSignataire: "Signataire",
    signataireNom: "Nom",
    signatairePrenom: "Prénom",
    signataireEmail: "E-mail",
    clubFonction: "Fonction du signataire",
    agenceNom: "Agence",
    agenceRepresentant: "Représentant",
    agenceFonction: "Fonction du représentant",
  };
  for (const [id, libelle] of Object.entries(attendus)) {
    assert.equal(libelleNu(html, id), libelle, `${id} : libellé exact, sans astérisque`);
    assert.ok(!/\srequired\b/.test(balise(html, id)), `${id} : pas de required`);
    assert.ok(!/aria-required/.test(balise(html, id)), `${id} : pas d'aria-required`);
  }
  assert.equal(compte(html, /\*/g), 0, "aucun astérisque dans la fenêtre");
  assert.equal(compte(html, /\srequired\b/g), 0, "aucun required dans la fenêtre");
  assert.equal(compte(html, /span class="required"/g), 0, "aucun span.required");
  assert.match(html, /<form\b[^>]*\snovalidate\b/);
});

// ---- 9.2 Modele utilise et annee : disparus ----

// Echoue si « Modèle utilisé » ou « Année » reviennent dans la fenetre, quel que soit Avec_annee
// (vrai, faux ou colonne absente) : la fenetre est identique pour les trois modeles. Echoue aussi
// si le focus d'ouverture n'est plus sur « Signataire ».
test("plus de « Modèle utilisé » ni d'« Année » dans la fenêtre, avec ou sans Avec_annee ; le focus d'ouverture va sur « Signataire »", () => {
  for (const [nom, modele] of [["Avec_annee vrai", {Avec_annee: true}], ["Avec_annee faux", {Avec_annee: false}], ["colonne absente", {Avec_annee: undefined}]]) {
    const {html, actif} = ouvrirFenetre(donneesFenetre({modele}));
    for (const id of ["conventionModele", "conventionAnnee", "conventionAnneeErreur"]) assert.equal(compte(html, new RegExp(id, "g")), 0, `${nom} : ${id} n'existe plus`);
    assert.ok(!html.includes("Modèle utilisé"), `${nom} : plus de libellé « Modèle utilisé »`);
    assert.ok(!html.includes("Modèle Exemple"), `${nom} : le titre du modèle n'est plus affiché`);
    assert.ok(!/>Année\b/.test(html), `${nom} : plus de libellé « Année »`);
    assert.ok(!html.includes("Informations relatives à la convention"), `${nom} : plus de colonne d'informations`);
    assert.equal(actif().id, "clubSignataire", `${nom} : focus sur Signataire`);
  }
});

// ---- 9.3 Signataire du club ----

// Echoue si la liste propose un contact d'un autre club, si un libelle n'est plus
// « Prénom Nom », si l'invite « Veuillez sélectionner » n'est plus la premiere option (selectionnee
// mais NON desactivee : on peut y revenir pour ne choisir personne), si l'ordre n'est plus
// alphabetique, si la fonction d'un contact est ecrite dans la page avant le choix, ou si le
// message « aucun contact » apparait alors que le club a des contacts.
test("la liste « Signataire » : l'invite (non désactivée), puis seulement les contacts du club en « Prénom Nom », sans leur fonction", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  assert.deepEqual(options(html, "clubSignataire"), [
    {value: "", texte: "Veuillez sélectionner", invite: true},
    {value: "32", texte: "Alex Modèle", invite: false},
    {value: "31", texte: "Camille Exemple", invite: false},
  ]);
  assert.match(html, /<option selected value="">Veuillez sélectionner<\/option>/, "invite sélectionnée, non désactivée");
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

// Echoue si, pour un club sans contact, le message n'est plus exactement celui de la note
// (mise a jour E1), s'il n'est plus sous la liste et relie a elle par aria-describedby, si la liste
// propose autre chose que l'invite, si la fonction n'est plus vide, si « Générer la convention » est
// grise (un club sans contact ne bloque plus), ou si le bouton « Ajouter un contact » manque.
test("club sans contact : message relié à la liste, liste réduite à l'invite, « Générer la convention » actif, « Ajouter un contact » disponible", () => {
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
      "Ce club n'a aucun contact dans sa fiche. Saisissez le signataire ci-dessous, ou laissez vide pour le compléter à la main.", nom);
    assert.equal(attribut(balise(html, "clubSignataire"), "aria-describedby"), "clubSignataireAide", `${nom} : liste reliée au message`);
    assert.ok(html.indexOf('id="clubSignataireAide"') > html.indexOf('id="clubSignataire"'), `${nom} : message sous la liste`);
    assert.deepEqual(options(html, "clubSignataire"), [{value: "", texte: "Veuillez sélectionner", invite: true}], nom);
    assert.equal(m.element("clubFonction").value, "", `${nom} : fonction vide`);
    const generer = balise(html, "conventionGenererFenetre");
    assert.ok(!/\sdisabled\b/.test(generer) && attribut(generer, "aria-disabled") === null, `${nom} : « Générer la convention » actif`);
    assert.ok(balise(html, "signataireAjouter"), `${nom} : le bouton « Ajouter un contact » est là`);
    assert.ok(/\shidden\b/.test(balise(html, "signataireLibre")), `${nom} : le formulaire est fermé`);
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

// ---- 9.4 Agence ----

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

// Echoue si le pied n'a plus exactement deux boutons, « Fermer » (type button, secondaire) puis
// « Générer la convention » (type button, principal, en dernier), dans cet ordre ; si
// « Enregistrer les informations » revient (bouton ou texte) ; si un second bouton principal apparait ;
// si le bouton du pied reprend l'id du bouton du bloc de la fiche (#conventionGenerer) ; ou si le
// libelle « Générer la convention » apparait ailleurs que dans ce bouton.
test("le pied de la fenêtre contient « Fermer » puis « Générer la convention » (seul bouton principal, en dernier) ; plus d'« Enregistrer les informations »", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const pied = /<div class="modal-footer">([\s\S]*?)<\/div>/.exec(html);
  assert.ok(pied, "le pied existe");
  const boutons = [...pied[1].matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => ({
    id: attribut(`<button${m[1]}>`, "id"),
    type: attribut(`<button${m[1]}>`, "type"),
    classe: attribut(`<button${m[1]}>`, "class"),
    texte: decoder(m[2].replace(/<[^>]+>/g, "")),
  }));
  assert.deepEqual(boutons, [
    {id: "conventionFermer", type: "button", classe: "btn btn-secondary", texte: "Fermer"},
    {id: "conventionGenererFenetre", type: "button", classe: "btn btn-primary", texte: LIBELLE},
  ]);
  assert.equal(compte(html, /conventionEnregistrer\b/g), 0, "le bouton « Enregistrer les informations » n'existe plus");
  assert.ok(!html.includes("Enregistrer les informations"), "ni son texte");
  assert.equal(compte(html, /type="submit"/g), 0, "aucun bouton d'envoi dans la fenêtre");
  assert.equal(compte(html, /btn-primary/g), 1, "un seul bouton principal dans la fenêtre");
  assert.equal(compte(html, /id="conventionGenerer"/g), 0, "pas de second #conventionGenerer (celui du bloc)");
  assert.equal(compte(html, /Générer la convention/g), 1, "le libellé n'est que dans le bouton du pied");
  assert.equal(attribut(balise(html, "conventionGenererFenetre"), "aria-haspopup"), null, "le bouton n'ouvre rien : pas d'aria-haspopup");
});

// ---- 9.6 Plus de controle de champ ----

// Echoue si la touche Entree dans un champ (evenement submit du formulaire) enregistre, envoie le
// formulaire (preventDefault non appele : la page serait rechargee) ou affiche une erreur : le
// formulaire n'a plus de bouton d'envoi, Entree ne fait rien.
test("la touche Entrée dans un champ (submit du formulaire) ne fait rien : preventDefault, aucun enregistrement", () => {
  const m = ouvrirFenetre(donneesFenetre());
  assert.equal(m.soumettre(), true, "preventDefault est appelé");
  assert.equal(m.enregistrements.length, 0, "rien n'est enregistré");
  assert.equal(m.element("conventionMessage").classList.contains("is-hidden"), true, "aucune alerte");
});

// Echoue si « Fermer » exige un champ : tout vide (aucun signataire, representant et fonction du
// representant vides) doit etre enregistre tel quel, sans is-invalid, sans alerte « Certains champs
// sont a corriger. », sans message d'erreur de champ (D-E1-17 : plus aucun controle).
test("« Fermer » avec tous les champs vides : enregistré tel quel, aucune erreur de champ ni alerte", async () => {
  const m = ouvrirFenetre(donneesFenetre());
  m.element("agenceRepresentant").value = "";
  m.element("agenceFonction").value = "";
  m.element("conventionFermer").click();
  await attendre();
  assert.equal(m.enregistrements.length, 1, "un enregistrement");
  const {valeurs} = m.enregistrements[0];
  assert.equal(valeurs.signataire, 0);
  assert.equal(valeurs.representant, "");
  assert.equal(valeurs.fonctionRepresentant, "");
  assert.equal(m.w.state.conventionOpen, false, "la fenêtre est fermée");
  assert.equal(compte(m.hote.innerHTML, /is-invalid|aria-invalid|Certains champs/g), 0, "aucune trace d'erreur de champ");
});

// ---- 9.7 Valeurs venant de Grist ----

// Echoue si le nom d'un contact n'echappe plus <, >, & ou les guillemets (le HTML s'executerait
// ou casserait l'attribut), si la valeur de l'option n'est plus l'identifiant du contact, ou si la
// fonction du signataire, mise dans la zone apres le choix, est alteree ou ecrite dans la page comme du HTML.
test("des caractères spéciaux dans le nom d'un contact s'affichent comme du texte", () => {
  const contacts = [{id: 41, Club: 7, Prenom: "<b>Camille</b>", Nom: 'Exemple & "Fils"', Fonction: "<i>Présidente</i> & Cie"}];
  const m = ouvrirFenetre(donneesFenetre({contacts}));
  const {html} = m;
  for (const balisage of ["<b>", "</b>", "<i>"]) assert.ok(!html.includes(balisage), `${balisage} ne doit pas passer tel quel`);
  assert.ok(html.includes("&lt;b&gt;Camille&lt;/b&gt; Exemple &amp; &quot;Fils&quot;"), "le libellé du contact est échappé");
  assert.deepEqual(options(html, "clubSignataire")[1], {value: "41", texte: '<b>Camille</b> Exemple & "Fils"', invite: false});
  m.choisir(41);
  assert.equal(m.element("clubFonction").value, "<i>Présidente</i> & Cie", "la fonction s'affiche telle quelle, comme du texte");
  assert.ok(!m.hote.innerHTML.includes("<i>"), "la fonction n'est pas écrite dans la page comme du HTML");
});

// ---------------------------------------------------------------------------
// 9 bis. E1 : le bouton « Ajouter un contact » et la regle des deux sources
// ---------------------------------------------------------------------------

// Echoue si le bouton n'est plus un bouton secondaire « Ajouter un contact » (type button, sans
// aria-haspopup, avec aria-expanded="false" et aria-controls vers le formulaire), s'il n'est plus
// place sous la liste « Signataire » et avant la « Fonction du signataire », si l'ancienne ligne
// depliante (<details>, <summary>, « Le contact n'est pas dans la liste ») reste dans la fenetre, ou
// si le formulaire n'est pas ferme par defaut (attribut hidden).
test("« Ajouter un contact » : bouton secondaire sous la liste, formulaire fermé par défaut, plus de ligne dépliante", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const bouton = balise(html, "signataireAjouter");
  assert.ok(bouton, "le bouton existe");
  assert.equal(attribut(bouton, "type"), "button", "il n'envoie jamais le formulaire");
  assert.equal(attribut(bouton, "class"), "btn btn-secondary");
  assert.equal(attribut(bouton, "aria-expanded"), "false");
  assert.equal(attribut(bouton, "aria-controls"), "signataireLibre");
  assert.equal(attribut(bouton, "aria-haspopup"), null, "aucune fenêtre ne s'ouvre");
  assert.equal(texteDe(html, "button", "signataireAjouter"), "Ajouter un contact");
  assert.ok(/\shidden\b/.test(balise(html, "signataireLibre")), "formulaire fermé par défaut");
  assert.ok(html.indexOf('id="clubSignataire"') < html.indexOf('id="signataireAjouter"') && html.indexOf('id="signataireAjouter"') < html.indexOf('id="clubFonction"'), "après la liste, avant la fonction");
  for (const ancien of ["<details", "<summary", "n'est pas dans la liste"]) assert.ok(!html.includes(ancien), `plus de « ${ancien} »`);
});

// Echoue si le formulaire garde un texte d'aide (D-E1-16 : ni « * Nécessaires… », ni « coordonnées
// professionnelles »), un astérisque ou un required sur Nom / E-mail (D-E1-17), si ses champs ne
// sont pas Nom, Prénom, E-mail (de type email) dans cet ordre, ou si chacun n'a pas son propre
// conteneur (espacement entre les champs, D-E1-18 : la grille .convention-champs porte un ecart).
test("formulaire « Ajouter un contact » : Nom, Prénom, E-mail sans astérisque ni aide, chacun dans son conteneur", () => {
  const {html} = ouvrirFenetre(donneesFenetre());
  const formulaire = /<div id="signataireLibre"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/.exec(html)[1];
  assert.deepEqual(idsDesChamps(formulaire), ["signataireNom", "signatairePrenom", "signataireEmail"]);
  assert.equal(attribut(balise(html, "signataireEmail"), "type"), "email");
  for (const id of ["signataireNom", "signatairePrenom", "signataireEmail"]) {
    assert.ok(!/\srequired\b/.test(balise(html, id)), `${id} : pas de required`);
    assert.equal(compte(formulaire, new RegExp(`<div class="edit-field"><label class="form-label" for="${id}">`, "g")), 1, `${id} : libellé + champ dans leur propre conteneur`);
  }
  assert.equal(libelleNu(html, "signataireNom"), "Nom");
  assert.equal(libelleNu(html, "signatairePrenom"), "Prénom");
  assert.equal(libelleNu(html, "signataireEmail"), "E-mail");
  assert.ok(!formulaire.includes("help-block"), "aucun texte d'aide dans le formulaire");
  for (const aide of ["Nécessaires", "professionnelles", "personnelles"]) assert.ok(!html.includes(aide), `plus de « ${aide} »`);
  assert.match(CSS, /\.convention-champs\s*\{[^}]*gap:\s*\S+/, "un écart entre les champs");
});

// Echoue si un clic sur le bouton n'ouvre pas le formulaire (hidden retire, aria-expanded="true",
// focus sur Nom), si un second clic ne le referme pas (hidden, aria-expanded="false", focus sur le
// bouton), ou si fermer le formulaire perd ce qui est saisi.
test("« Ajouter un contact » : un clic ouvre (focus sur Nom), un second clic ferme (focus sur le bouton), la saisie est gardée", () => {
  const m = ouvrirFenetre(donneesFenetre());
  const bouton = m.element("signataireAjouter");
  const formulaire = m.element("signataireLibre");
  bouton.click();
  assert.equal(formulaire.hidden, false, "ouvert");
  assert.equal(bouton.getAttribute("aria-expanded"), "true");
  assert.equal(m.actif().id, "signataireNom", "focus sur Nom");
  m.ecrire("signataireNom", "Martin");
  bouton.click();
  assert.equal(formulaire.hidden, true, "refermé par un second clic");
  assert.equal(bouton.getAttribute("aria-expanded"), "false");
  assert.equal(m.actif(), bouton, "focus sur le bouton");
  assert.equal(m.element("signataireNom").value, "Martin", "la saisie n'est pas perdue");
  assert.equal(texteDe(m.hote.innerHTML, "button", "signataireAjouter"), "Ajouter un contact", "même libellé ouvert ou fermé");
});

// Echoue si la phrase « Ce contact sera ajouté à la fiche du club. » n'est plus placee APRES le champ
// « Fonction du signataire » (D-E1-12), si elle est visible alors que rien n'est saisi et que le
// formulaire est ferme, ou si elle ne devient pas visible des qu'un Nom est tape ou le formulaire ouvert.
test("phrase « Ce contact sera ajouté à la fiche du club. » : sous « Fonction du signataire », visible seulement si Nom est rempli ou le formulaire ouvert", () => {
  const m = ouvrirFenetre(donneesFenetre());
  const html = m.hote.innerHTML;
  assert.equal(texteDe(html, "p", "signataireLibreAide"), "Ce contact sera ajouté à la fiche du club.");
  assert.ok(html.indexOf('id="clubFonction"') < html.indexOf('id="signataireLibreAide"'), "sous « Fonction du signataire »");
  const aide = m.element("signataireLibreAide");
  assert.equal(aide.classList.contains("is-hidden"), true, "cachée : rien de saisi, formulaire fermé");
  m.element("signataireAjouter").click();
  assert.equal(aide.classList.contains("is-hidden"), false, "visible : formulaire ouvert");
  m.element("signataireAjouter").click();
  assert.equal(aide.classList.contains("is-hidden"), true, "cachée : formulaire refermé, Nom vide");
  m.ecrire("signataireNom", "Martin");
  assert.equal(aide.classList.contains("is-hidden"), false, "visible : un Nom est tapé, même formulaire fermé");
});

// Echoue si taper un Nom n'active pas la saisie libre : option « Prénom Nom (nouveau contact) »
// selectionnee en premier choix de la liste (meme formulaire ferme), « Fonction du signataire »
// modifiable et videe, ou si un Prénom / E-mail / Fonction seuls, sans Nom, l'activent (D-E1-3).
test("règle des deux sources : un Nom tapé ajoute « (nouveau contact) » et rend la fonction modifiable ; sans Nom, rien", () => {
  const m = ouvrirFenetre(donneesFenetre());
  const liste = m.element("clubSignataire");
  m.ecrire("signatairePrenom", "Jo");
  m.ecrire("signataireEmail", "jo@exemple.fr");
  assert.equal(liste.options.length, 3, "sans Nom : aucune option ajoutée");
  assert.equal(m.element("clubFonction").readOnly === true || m.element("clubFonction").readOnly === undefined, true, "fonction toujours en lecture seule");

  m.ecrire("signataireNom", "Martin");
  assert.equal(liste.options[1].textContent, "Jo Martin (nouveau contact)", "l'option du nouveau contact est la première après l'invite");
  assert.equal(liste.value, "nouveau", "elle est sélectionnée");
  assert.equal(m.element("clubFonction").readOnly, false, "la fonction devient modifiable");
  assert.equal(m.element("clubFonction").value, "", "…et part de vide");
  assert.equal(m.element("signataireLibre").hidden, true, "le formulaire peut rester fermé : l'agent voit quand même qui sera le signataire");
  m.ecrire("signatairePrenom", "");
  assert.equal(liste.options[1].textContent, "Martin (nouveau contact)", "le libellé suit le Prénom");
  assert.equal(liste.options.length, 4, "une seule option « nouveau contact », jamais deux");
});

// Echoue si vider le Nom ne ramene pas la liste au dernier choix, ne retire pas l'option « nouveau
// contact », ne remet pas la fonction en lecture seule (valeur du contact choisi) ou garde la fonction saisie.
test("règle des deux sources : vider le Nom abandonne la saisie libre, la liste revient au dernier choix et la fonction à celle du contact", () => {
  const m = ouvrirFenetre(donneesFenetre());
  const liste = m.element("clubSignataire");
  m.choisir(31);
  m.ecrire("signataireNom", "Martin");
  m.ecrire("clubFonction", "Trésorier");
  m.element("clubFonction").value = "Trésorier";
  m.ecrire("signataireNom", "");
  assert.equal(liste.options.some((o) => /nouveau contact/.test(o.textContent)), false, "l'option est retirée");
  assert.equal(liste.value, "31", "la liste revient au contact choisi avant");
  assert.equal(m.element("clubFonction").readOnly, true, "fonction de nouveau en lecture seule");
  assert.equal(m.element("clubFonction").value, "Présidente", "…avec celle du contact");
});

// Echoue si choisir un contact dans la liste ne vide pas Nom, Prénom et E-mail saisis, ne retire pas
// l'option « nouveau contact » et le message d'erreur sous E-mail, ou change l'etat ouvert/ferme du formulaire.
test("règle des deux sources : choisir un contact dans la liste vide la saisie libre sans fermer ni ouvrir le formulaire", () => {
  const m = ouvrirFenetre(donneesFenetre());
  const liste = m.element("clubSignataire");
  m.element("signataireAjouter").click();
  m.ecrire("signataireNom", "Martin");
  m.ecrire("signatairePrenom", "Jo");
  m.ecrire("signataireEmail", "jo@exemple.fr");
  m.choisir(32);
  for (const id of ["signataireNom", "signatairePrenom", "signataireEmail"]) assert.equal(m.element(id).value, "", `${id} vidé`);
  assert.equal(liste.options.some((o) => /nouveau contact/.test(o.textContent)), false, "option retirée");
  assert.equal(m.element("clubFonction").readOnly, true);
  assert.equal(m.element("clubFonction").value, "Fonction non renseignée");
  assert.equal(m.element("signataireLibre").hidden, false, "le formulaire reste ouvert");
});

// ---------------------------------------------------------------------------
// 10. Tache 8.1 : phrase « Le nouveau PDF remplacera… » a la re-generation
// ---------------------------------------------------------------------------
// La phrase se lit dans le HTML de la fenetre (conventionModalHtml) : fonction pure, sans
// faux navigateur. Elle est presente seulement quand la ligne Conventions porte deja un
// PDF genere (D-S8-2, note UX §12.3).

const REMPLACEMENT = /<p>(Le nouveau PDF remplacera[^<]*)<\/p>/;
const fenetreHtml = (conventions) => {
  const w = loadWidget();
  return w.conventionModalHtml(1, donneesFenetre({conventions}));
};

// Echoue si la phrase manque a la re-generation, n'est pas un <p> ordinaire (sans classe
// d'alerte ni role), est apres l'alerte d'erreur ou apres la phrase sur les champs obligatoires
// (elle doit etre tout en haut du corps), apparait plus d'une fois, ou n'a pas le texte exact.
test("re-génération : « Le nouveau PDF remplacera la convention générée le … » est un paragraphe ordinaire, tout en haut du corps de la fenêtre", () => {
  const html = fenetreHtml([convention({PDF_genere: PDF, Date_generation: secondes(2026, 3, 14)})]);
  const trouve = REMPLACEMENT.exec(html);
  assert.ok(trouve, "la phrase est présente");
  assert.equal(trouve[1], "Le nouveau PDF remplacera la convention générée le 14/03/2026.");
  assert.equal(compte(html, /Le nouveau PDF remplacera/g), 1, "une seule fois");
  const corps = html.indexOf('<div class="modal-body">');
  const phrase = html.indexOf("Le nouveau PDF remplacera");
  const alerte = html.indexOf('id="conventionMessage"');
  const intro = html.indexOf('class="convention-intro"');
  assert.ok(corps !== -1 && corps < phrase && phrase < alerte && phrase < intro, "tout en haut du corps, avant l'alerte et avant la phrase d'introduction");
  assert.match(html.slice(corps, phrase), /^<div class="modal-body">\s*<p>$/, "rien entre le début du corps et la phrase, et le <p> n'a ni classe ni role (ni alerte, ni région annoncée)");
});

// Echoue si la date n'est pas au format jour/mois/annee avec les zeros (05/03/2026, pas 3/5/2026
// ni 2026-03-05 ni 03/05/2026), ou si elle ne vient pas de Date_generation (la colonne Date_depot
// d'un PDF signe ne doit pas etre lue).
test("re-génération : la date de la phrase est au format jour/mois/année avec les zéros, et vient de Date_generation", () => {
  const cas = [[secondes(2026, 3, 5), "05/03/2026"], [secondes(2026, 11, 27), "27/11/2026"], [secondes(2027, 1, 31), "31/01/2027"]];
  for (const [valeur, attendu] of cas) {
    const trouve = REMPLACEMENT.exec(fenetreHtml([convention({PDF_genere: PDF, Date_generation: valeur, Date_depot: secondes(2030, 9, 9)})]));
    assert.equal(trouve[1], `Le nouveau PDF remplacera la convention générée le ${attendu}.`, attendu);
  }
});

// Echoue si une date vide (null, 0, texte vide ou absente) laisse « le . », « le undefined » ou
// « le 01/01/1970 » dans la phrase, ou fait disparaitre la phrase (le PDF existe quand meme).
test("re-génération sans date (Date_generation vide) : « Le nouveau PDF remplacera la convention générée. », sans date", () => {
  for (const vide of [null, 0, "", undefined]) {
    const champs = {PDF_genere: PDF};
    if (vide !== undefined) champs.Date_generation = vide;
    const trouve = REMPLACEMENT.exec(fenetreHtml([convention(champs)]));
    assert.ok(trouve, `date vide (${String(vide)}) : la phrase est présente`);
    assert.equal(trouve[1], "Le nouveau PDF remplacera la convention générée.", `date vide : ${String(vide)}`);
  }
});

// Echoue si la phrase apparait alors qu'il n'y a pas encore de PDF genere : aucune ligne
// Conventions, ligne sans PDF_genere (informations seulement enregistrees), PDF_genere vide
// (liste vide ou « ["L"] » seul), meme avec une Date_generation. conventionEstRegeneration doit
// dire faux dans ces cas, vrai quand un PDF est rattache.
test("première génération (aucun PDF généré) : pas de phrase « Le nouveau PDF remplacera… »", () => {
  const w = loadWidget();
  const cas = {
    "aucune ligne Conventions": [],
    "ligne sans PDF_genere": [convention({Annee: 2029})],
    "PDF_genere vide (liste vide)": [convention({PDF_genere: [], Date_generation: secondes(2026, 3, 14)})],
    "PDF_genere vide ([\"L\"] seul)": [convention({PDF_genere: ["L"], Date_generation: secondes(2026, 3, 14)})],
    "PDF_genere null": [convention({PDF_genere: null})],
  };
  for (const [nom, conventions] of Object.entries(cas)) {
    const jeu = donneesFenetre({conventions});
    assert.equal(w.conventionEstRegeneration(1, jeu), false, `${nom} : pas une re-génération`);
    assert.ok(!w.conventionModalHtml(1, jeu).includes("remplacera"), `${nom} : pas de phrase`);
  }
  assert.equal(w.conventionEstRegeneration(1, donneesFenetre({conventions: [convention({PDF_genere: PDF})]})), true, "avec un PDF généré : une re-génération");
});
