"use strict";

// Bouton « Générer la convention » du pied de la fenêtre (tâche 7.2b) : bouton grisé si le
// club n'a aucun contact, verrouillage immédiat au clic, « Fermer », Échap, « Enregistrer »
// et Entrée ignorés pendant l'attente, champs à corriger, un message exact par code
// d'échec (fenêtre ouverte, saisie gardée, tout déverrouillé, focus sur le bouton), noms de
// cases inconnues affichés comme du texte, et réussite (fenêtre fermée, bloc « Générée »,
// message, focus).
// La génération elle-même n'est PAS testée ici (voir convention-generation.test.js) :
// conventionGenerer est remplacée par une doublure qui réussit, échoue avec le code voulu,
// ou attend qu'on la libère. Les doublures sont posées sur w.window (le vrai global du bac
// à sable ; w n'en est qu'une copie), comme dans convention-fenetre.test.js.
// Ce fichier est séparé de convention-fenetre.test.js : celui-ci est déjà long, son faux
// navigateur (monter) est synchrone et n'est pas partagé. Celui d'ici est asynchrone
// (la génération l'est) et ajoute ce dont l'écran de la 7.2b a besoin : les trois zones
// de la fenêtre qui changent (attente, erreurs sous les champs), les fieldset, la zone de
// message et le contenu du bloc de la fiche.
// Les textes de référence sont ceux de docs/ux/convention.md. Ils sont recopiés ici en dur :
// si le code change un mot, le test doit échouer. Données fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

// Midi UTC : la date reste la même dans tous les fuseaux horaires.
const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;

const LIBELLE = "Générer la convention";
const LIBELLE_EN_COURS = "Génération en cours…";
const TEXTE_ATTENTE = "Génération de la convention en cours. Cela peut prendre quelques secondes.";
const MESSAGE_REUSSITE = "Convention générée.";
const ALERTE_CHAMPS = "Certains champs sont à corriger.";
const SANS_CONTACT = "Ce club n'a aucun contact. Ajoutez-en un dans la fiche du club, puis revenez générer la convention.";
const CHAMPS_CONTROLES = ["conventionAnnee", "clubSignataire", "clubFonction", "agenceRepresentant", "agenceFonction"];
const BOUTONS_DU_PIED = ["conventionFermer", "conventionEnregistrer", "conventionGenererFenetre"];

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true};
const CONTACTS = [
  {id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"},
  {id: 32, Club: 7, Prenom: "Alex", Nom: "Modèle", Fonction: ""},
  {id: 33, Club: 99, Prenom: "Robin", Nom: "Voisin", Fonction: "Trésorier"},
];

// Ce que la personne saisit dans la fenêtre avant de cliquer (textes, comme dans les champs).
const SAISIE = {annee: "2031", signataire: "31", representant: "Dana Exemple", fonction: "Directrice adjointe"};

// Messages d'échec de la note UX (§3 « Échecs »), un par code d'erreur de conventionGenerer.
const ECHECS = {
  "pdfmake-non-charge": "La convention n'a pas pu être générée : l'outil qui fabrique le PDF n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez. Si le problème continue, contactez l'équipe du tableau de bord. Vos informations sont conservées.",
  "modele-indisponible": "La convention n'a pas pu être générée : le modèle de convention n'est plus disponible pour ce dispositif. Contactez l'équipe du tableau de bord. Vos informations sont conservées.",
  "envoi-refuse": "La convention n'a pas pu être enregistrée : vos droits ne le permettent pas pour cette action. Contactez l'équipe du tableau de bord. Vos informations sont conservées.",
  "envoi-impossible": "La convention n'a pas pu être enregistrée : l'envoi du fichier a échoué. Vérifiez votre connexion, puis réessayez. Vos informations sont conservées.",
  "rattachement-echoue": "La convention n'a pas pu être enregistrée : le fichier a été fabriqué mais n'a pas pu être rattaché à l'action. Réessayez ou contactez l'équipe du tableau de bord. Vos informations sont conservées.",
  "echec-inattendu": "La convention n'a pas pu être générée. Vos informations sont conservées.",
};
// Le message d'enregistrement existe déjà (note UX §5) : il ne finit pas par « Vos informations sont conservées. ».
const MESSAGE_ENREGISTREMENT = "Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord.";
const FIN_CASES = "Contactez l'équipe du tableau de bord pour corriger le modèle. Vos informations sont conservées.";

// ---------------------------------------------------------------------------
// Lecture du HTML produit par le widget
// ---------------------------------------------------------------------------

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Balise ouvrante (de « < » à « > ») qui porte cet identifiant, ou null.
function balise(html, id) {
  const m = new RegExp(`<[a-z0-9]+\\b[^>]*\\sid="${id}"[^>]*>`).exec(html);
  return m ? m[0] : null;
}

function texteDe(html, nomBalise, id) {
  const m = new RegExp(`<${nomBalise}\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</${nomBalise}>`).exec(html);
  return m ? decoder(m[1].replace(/<[^>]+>/g, "")) : null;
}

function champ(html, id) {
  const input = new RegExp(`<input\\b[^>]*\\sid="${id}"[^>]*\\svalue="([^"]*)"`).exec(html);
  if (input) return decoder(input[1]);
  const zone = new RegExp(`<textarea\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</textarea>`).exec(html);
  return zone ? decoder(zone[1]) : null;
}

// Texte lisible d'un morceau de HTML : balises retirées (le texte caché « Erreur : » reste).
const lire = (html) => decoder(String(html).replace(/<[^>]+>/g, ""));

// Les phrases d'un morceau de HTML du bloc, dans l'ordre.
const phrases = (html) => [...html.matchAll(/<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g)].map((m) => decoder(m[1]));

const attendre = () => new Promise((resolve) => setImmediate(resolve));

// ---------------------------------------------------------------------------
// Doublures de conventionGenerer
// ---------------------------------------------------------------------------

const reussit = () => () => Promise.resolve({nomFichier: "Convention-fictive.pdf"});

// Un échec porte un `code` (et, selon le code, `problemes` ou `cases`), comme conventionErreur.
const echoue = (code, complements) => () => Promise.reject(Object.assign(new Error("échec fictif"), {code}, complements));

// La génération attend qu'on la libère : on peut regarder l'écran « pendant l'attente ».
function enAttente() {
  let resoudre;
  let rejeter;
  const promesse = new Promise((ok, ko) => { resoudre = ok; rejeter = ko; });
  return {comportement: () => promesse, resoudre, rejeter};
}

// ---------------------------------------------------------------------------
// Faux navigateur (asynchrone) pour la fenêtre et le bloc de la fiche
// ---------------------------------------------------------------------------
// Même principe que monter() de convention-fenetre.test.js : les éléments de la fenêtre
// sont recréés à chaque fois que le contenu de #conventionModal change, et gardent attributs,
// classes, valeur et focus. En plus : innerHTML des éléments, fieldset, scrollIntoView, et
// les deux zones du bloc de la fiche (#conventionAlerte et #conventionBlocContenu), qui
// restent dans la page quand la fenêtre se ferme.
// On attend la fin du chargement du widget AVANT de poser le jeu d'essai : sinon il
// remplacerait state.raw en plein test.
// Options : `conventions` (lignes de la table Conventions ; avec un PDF genere, le bloc est a
// l'etat « Générée » et la fenetre s'ouvre pour une RE-generation), `action` (champs de l'action,
// ex. {Agence: 0} pour bloquer la generation) et `ouverture` : "direct" (par defaut, la fenetre
// est ouverte par openConvention), "regenerer" (le bouton « Re-générer » du bloc a le focus et
// on clique dessus, comme la personne) ou "aucune" (la fenetre n'est pas ouverte).

async function preparer({contacts = CONTACTS, conventions = [], action = {}, ouverture = "direct"} = {}) {
  const w = loadWidget();
  await attendre();
  await attendre();
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, ...action}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [{...MODELE}],
    Contacts: contacts.map((contact) => ({...contact})),
    Conventions: conventions.map((ligne) => ({...ligne})),
  };
  w.state.tablesRefusees = [];

  const doc = w.document;
  const origine = {getElementById: doc.getElementById, querySelectorAll: doc.querySelectorAll};
  const registre = new Map();
  const defilements = [];
  const enregistrements = [];
  const rendus = {fiche: 0};
  const ecritures = {alerte: 0, contenu: 0};
  const PERMANENTS = ["conventionModal", "conventionAlerte", "conventionBlocContenu", "conventionReussite", "conventionVoir", "conventionRegenerer"];
  let actif = null;
  let contenu = "";
  let fieldsets = [];

  function fabriquer(id, balisePosee = "") {
    const attributs = {};
    for (const m of balisePosee.matchAll(/\s([a-z-]+)="([^"]*)"/g)) attributs[m[1]] = decoder(m[2]);
    const classes = new Set((attributs.class || "").split(/\s+/).filter(Boolean));
    const ecouteurs = {};
    const enfants = new Map();
    const element = {
      id, attributs, ecouteurs,
      value: champ(contenu, id) ?? "",
      innerHTML: "",
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
      // Un même sélecteur rend toujours le même enfant (comme test/helpers/widget.js). Celui du
      // libellé d'un bouton part de son texte réel ; il ne connaît que textContent, donc une
      // écriture par innerHTML y laisserait une trace (voir le test des noms de cases).
      querySelector(selecteur) {
        if (!enfants.has(selecteur)) enfants.set(selecteur, {textContent: selecteur === ".btn-content" ? (texteDe(contenu, "button", id) || "") : ""});
        return enfants.get(selecteur);
      },
      getAttribute: (nom) => (nom in attributs ? attributs[nom] : null),
      setAttribute: (nom, valeur) => { attributs[nom] = String(valeur); },
      removeAttribute: (nom) => { delete attributs[nom]; },
      addEventListener: (type, f) => { (ecouteurs[type] ||= []).push(f); },
      removeEventListener: (type, f) => { ecouteurs[type] = (ecouteurs[type] || []).filter((g) => g !== f); },
      focus: () => { actif = element; },
      click: () => { (ecouteurs.click || []).slice().forEach((f) => f({})); },
      scrollIntoView: (options) => { defilements.push({id, options}); },
    };
    return element;
  }

  const hote = fabriquer("conventionModal");
  Object.defineProperty(hote, "innerHTML", {
    get: () => contenu,
    set: (valeur) => {
      contenu = valeur;
      for (const id of [...registre.keys()]) if (!PERMANENTS.includes(id)) registre.delete(id);
      fieldsets = Array.from({length: (valeur.match(/<fieldset\b/g) || []).length}, () => ({disabled: false}));
    },
  });
  registre.set("conventionModal", hote);

  // Le bloc de la fiche : sa zone de message (jamais refaite) et son contenu (refait seul).
  const blocHtml = w.conventionBlocHtml(1, w.state);
  const zoneMessage = fabriquer("conventionAlerte", balise(blocHtml, "conventionAlerte"));
  let htmlZone = "";
  Object.defineProperty(zoneMessage, "innerHTML", {
    get: () => htmlZone,
    set: (valeur) => {
      htmlZone = valeur;
      ecritures.alerte += 1;
      // Le message posé dans la zone devient un élément de la page, que le script peut retrouver.
      if (valeur.includes('id="conventionReussite"')) registre.set("conventionReussite", fabriquer("conventionReussite", balise(valeur, "conventionReussite")));
      else registre.delete("conventionReussite");
    },
  });
  registre.set("conventionAlerte", zoneMessage);

  const zoneContenu = fabriquer("conventionBlocContenu", balise(blocHtml, "conventionBlocContenu"));
  let htmlContenu = w.conventionBlocContenuHtml(1, w.state);
  // Les boutons « Voir la convention » et « Re-générer » (etat « Générée ») deviennent des elements
  // de la page, qui peuvent recevoir le focus ; ils disparaissent quand le contenu n'en a plus.
  const enregistrerBoutonsDuBloc = (valeur) => {
    for (const id of ["conventionVoir", "conventionRegenerer"]) {
      if (valeur.includes(`id="${id}"`)) registre.set(id, fabriquer(id, balise(valeur, id)));
      else registre.delete(id);
    }
  };
  enregistrerBoutonsDuBloc(htmlContenu);
  Object.defineProperty(zoneContenu, "innerHTML", {
    get: () => htmlContenu,
    set: (valeur) => {
      htmlContenu = valeur;
      ecritures.contenu += 1;
      enregistrerBoutonsDuBloc(valeur);
    },
  });
  registre.set("conventionBlocContenu", zoneContenu);

  const existe = (id) => registre.has(id) || contenu.includes(`id="${id}"`);
  doc.getElementById = (id) => {
    if (!existe(id)) {
      // Fenêtre ouverte et identifiant de la fenêtre absent de la page : null, comme dans un vrai document.
      return contenu !== "" && /^(convention|club|agence)[A-Z]/.test(id) ? null : origine.getElementById(id);
    }
    if (!registre.has(id)) registre.set(id, fabriquer(id, balise(contenu, id) || ""));
    return registre.get(id);
  };
  doc.querySelectorAll = (selecteur) => {
    const s = String(selecteur);
    if (s === "#conventionDialog fieldset") return fieldsets;
    if (!s.startsWith("#conventionDialog")) return origine.querySelectorAll(selecteur);
    return [...contenu.matchAll(/<(?:input|textarea|select|button)\b([^>]*)>/g)]
      .filter((m) => !/\sdisabled\b/.test(m[1]))
      .map((m) => doc.getElementById(/\sid="([^"]+)"/.exec(m[1])[1]));
  };
  doc.body.contains = (element) => [...registre.values()].includes(element);
  Object.defineProperty(doc, "activeElement", {get: () => actif, configurable: true});

  // L'enregistrement des informations n'est pas l'objet de ces tests : un espion note ses appels.
  w.window.conventionEnregistrer = (actionId, valeurs) => { enregistrements.push({actionId, valeurs}); };
  // Un rechargement de la fiche effacerait ce qui est saisi et pas enregistré : un espion le compte.
  w.window.renderEdit = () => { rendus.fiche += 1; };

  const generation = {appels: [], comportement: reussit()};
  w.window.conventionGenerer = (actionId, valeurs) => {
    generation.appels.push({actionId, valeurs});
    return generation.comportement(actionId, valeurs);
  };

  // Une touche pressée dans la fenêtre ; renvoie vrai si le script a appelé preventDefault.
  function touche(key) {
    let empeche = false;
    const evenement = {key, shiftKey: false, preventDefault() { empeche = true; }};
    (hote.ecouteurs.keydown || []).slice().forEach((f) => f(evenement));
    return empeche;
  }

  // Entrée dans un champ, ou clic sur « Enregistrer les informations » (un bouton d'envoi) :
  // le navigateur déclenche l'événement submit du formulaire.
  function soumettre() {
    let empeche = false;
    const evenement = {preventDefault() { empeche = true; }};
    (doc.getElementById("conventionForm").ecouteurs.submit || []).slice().forEach((f) => f(evenement));
    return empeche;
  }

  const element = (id) => doc.getElementById(id);

  function remplir(saisie = SAISIE) {
    element("conventionAnnee").value = saisie.annee;
    element("clubSignataire").value = saisie.signataire;
    element("agenceRepresentant").value = saisie.representant;
    element("agenceFonction").value = saisie.fonction;
  }

  const saisie = () => ({
    annee: element("conventionAnnee").value,
    signataire: element("clubSignataire").value,
    representant: element("agenceRepresentant").value,
    fonction: element("agenceFonction").value,
  });

  if (ouverture === "direct") {
    w.openConvention(1);
  } else if (ouverture === "regenerer") {
    w.bindConvention(1);
    element("conventionRegenerer").focus();
    element("conventionRegenerer").click();
  } else {
    w.bindConvention(1);
  }

  return {
    w, hote, generation, enregistrements, ecritures, rendus, defilements, touche, soumettre, element, remplir, saisie,
    actif: () => actif,
    fieldsets: () => fieldsets,
    zoneMessage, htmlZone: () => htmlZone, htmlContenu: () => htmlContenu,
    corpsAClasse: (nom) => doc.body.classList.contains(nom),
    libelleGenerer: () => element("conventionGenererFenetre").querySelector(".btn-content").textContent,
    // Pose la saisie, met le focus sur « Générer la convention » comme le ferait la personne, puis clique.
    async cliquerGenerer() {
      element("conventionGenererFenetre").focus();
      element("conventionGenererFenetre").click();
      await attendre();
    },
    // Même chose sans attendre : pour regarder l'écran juste après le clic.
    cliquerSansAttendre() {
      element("conventionGenererFenetre").focus();
      element("conventionGenererFenetre").click();
    },
  };
}

// Tout est verrouillé : trois boutons aria-disabled (jamais disabled), trois fieldset disabled,
// libellé « Génération en cours… », phrase d'attente dans la zone role="status".
function verifierVerrouille(m, nom) {
  for (const id of BOUTONS_DU_PIED) {
    assert.equal(m.element(id).getAttribute("aria-disabled"), "true", `${nom} : ${id} grisé`);
    assert.equal(m.element(id).getAttribute("disabled"), null, `${nom} : ${id} sans l'attribut disabled`);
  }
  assert.deepEqual(m.fieldsets().map((f) => f.disabled), [true, true, true], `${nom} : les trois blocs ne sont plus modifiables`);
  assert.equal(m.libelleGenerer(), LIBELLE_EN_COURS, `${nom} : libellé du bouton`);
  assert.equal(m.element("conventionAttente").innerHTML, `<p>${TEXTE_ATTENTE}</p>`, `${nom} : phrase d'attente`);
}

// Tout est déverrouillé, comme avant le clic.
function verifierDeverrouille(m, nom) {
  for (const id of BOUTONS_DU_PIED) {
    assert.equal(m.element(id).getAttribute("aria-disabled"), null, `${nom} : ${id} n'est plus grisé`);
  }
  assert.deepEqual(m.fieldsets().map((f) => f.disabled), [false, false, false], `${nom} : les trois blocs sont modifiables`);
  assert.equal(m.libelleGenerer(), LIBELLE, `${nom} : le libellé d'origine est revenu`);
  assert.equal(m.element("conventionAttente").innerHTML, "", `${nom} : la zone d'attente est vidée`);
}

function alerte(m) {
  const zone = m.element("conventionMessage");
  return {
    zone,
    visible: !zone.classList.contains("is-hidden"),
    texte: zone.querySelector(".alert-content").textContent,
  };
}

// Aucun des cinq champs contrôlés n'est marqué en erreur.
function verifierAucunChampEnErreur(m, nom) {
  for (const id of CHAMPS_CONTROLES) {
    assert.equal(m.element(id).classList.contains("is-invalid"), false, `${nom} : ${id} sans is-invalid`);
    assert.equal(m.element(id).getAttribute("aria-invalid"), null, `${nom} : ${id} sans aria-invalid`);
  }
}

// Ce que doit montrer l'écran après un échec « de génération » (pas un champ à corriger) :
// message exact dans l'alerte d'erreur, fenêtre ouverte, saisie gardée, tout déverrouillé,
// focus sur le bouton, défilement vers l'alerte, puis un nouveau clic relance et « Fermer » ferme.
async function verifierEchec(m, messageAttendu, nom) {
  const a = alerte(m);
  assert.equal(a.visible, true, `${nom} : l'alerte est visible`);
  assert.equal(a.texte, messageAttendu, `${nom} : message exact`);
  assert.equal(a.zone.classList.contains("alert-error"), true, `${nom} : alert-error`);
  assert.equal(a.zone.classList.contains("alert-success"), false, `${nom} : pas alert-success`);
  assert.equal(a.zone.getAttribute("role"), "alert", `${nom} : role="alert"`);
  assert.equal(a.zone.getAttribute("aria-live"), "assertive", `${nom} : aria-live="assertive"`);
  assert.notEqual(a.texte, ALERTE_CHAMPS, `${nom} : jamais « Certains champs sont à corriger. » avec un échec de génération`);

  assert.notEqual(m.hote.innerHTML, "", `${nom} : la fenêtre reste ouverte`);
  assert.equal(m.w.state.conventionOpen, true, `${nom} : state.conventionOpen`);
  assert.equal(m.corpsAClasse("modal-open"), true, `${nom} : modal-open reste sur la page`);
  assert.deepEqual(m.saisie(), SAISIE, `${nom} : la saisie est gardée`);
  verifierAucunChampEnErreur(m, nom);
  verifierDeverrouille(m, nom);
  assert.equal(m.actif(), m.element("conventionGenererFenetre"), `${nom} : le focus est sur « Générer la convention »`);
  assert.deepEqual(m.defilements.map((d) => [d.id, d.options.block]), [["conventionMessage", "nearest"]], `${nom} : le corps défile jusqu'à l'alerte`);
  assert.equal(m.rendus.fiche, 0, `${nom} : la fiche n'est pas rechargée`);

  // Le verrou est bien levé : un clic de plus relance la génération, puis « Fermer » ferme.
  const avant = m.generation.appels.length;
  await m.cliquerGenerer();
  assert.equal(m.generation.appels.length, avant + 1, `${nom} : un nouveau clic relance la génération`);
  m.element("conventionFermer").click();
  assert.equal(m.hote.innerHTML, "", `${nom} : « Fermer » ferme la fenêtre`);
}

// ---------------------------------------------------------------------------
// 1. Le bouton : actif, ou grisé quand le club n'a aucun contact
// ---------------------------------------------------------------------------

// Echoue si, pour un club qui a des contacts, le bouton du pied porte aria-disabled,
// aria-describedby ou disabled, change de libellé, de type ou de classe (principal), ou si
// un clic ne lance pas exactement une generation avec l'action et les valeurs saisies.
test("club avec contacts : « Générer la convention » est actif et un clic lance la génération avec les valeurs saisies", async () => {
  const m = await preparer();
  const tag = balise(m.hote.innerHTML, "conventionGenererFenetre");
  assert.ok(!/\saria-disabled=/.test(tag), "pas d'aria-disabled");
  assert.ok(!/\saria-describedby=/.test(tag), "pas d'aria-describedby");
  assert.ok(!/\sdisabled\b/.test(tag), "pas d'attribut disabled");
  assert.match(tag, /\stype="button"/);
  assert.match(tag, /\sclass="btn btn-primary"/);
  assert.equal(texteDe(m.hote.innerHTML, "button", "conventionGenererFenetre"), LIBELLE);

  m.remplir();
  await m.cliquerGenerer();
  assert.equal(m.generation.appels.length, 1, "une génération");
  const {actionId, valeurs} = m.generation.appels[0];
  assert.equal(actionId, 1);
  assert.equal(valeurs.annee, "2031");
  assert.equal(valeurs.anneeIllisible, false);
  assert.equal(valeurs.signataire, 31);
  assert.equal(valeurs.representant, "Dana Exemple");
  assert.equal(valeurs.fonctionRepresentant, "Directrice adjointe");
});

// Pour un club sans contact (table vide, ou seulement le contact d'un autre club). Echoue si le
// bouton n'est plus grise par aria-disabled="true" (jamais disabled), s'il n'est plus relie par
// aria-describedby au message « Ce club n'a aucun contact… » (qui doit exister), ou si un
// clic lance la generation, verrouille la fenetre ou la ferme.
test("club sans contact : « Générer la convention » est grisé et relié au message, et un clic ne fait rien", async () => {
  const variantes = {"table Contacts vide": [], "seulement le contact d'un autre club": [CONTACTS[2]]};
  for (const [nom, contacts] of Object.entries(variantes)) {
    const m = await preparer({contacts});
    const tag = balise(m.hote.innerHTML, "conventionGenererFenetre");
    assert.equal(m.element("conventionGenererFenetre").getAttribute("aria-disabled"), "true", `${nom} : grisé`);
    assert.ok(!/\sdisabled\b/.test(tag), `${nom} : jamais l'attribut disabled`);
    assert.equal(m.element("conventionGenererFenetre").getAttribute("aria-describedby"), "clubSignataireAide", `${nom} : relié au message`);
    assert.equal(texteDe(m.hote.innerHTML, "p", "clubSignataireAide"), SANS_CONTACT, `${nom} : la cible existe, avec le message exact`);
    assert.equal(texteDe(m.hote.innerHTML, "button", "conventionGenererFenetre"), LIBELLE, `${nom} : le libellé reste affiché`);

    await m.cliquerGenerer();
    assert.equal(m.generation.appels.length, 0, `${nom} : aucune génération`);
    assert.notEqual(m.hote.innerHTML, "", `${nom} : la fenêtre reste ouverte`);
    assert.equal(m.element("conventionFermer").getAttribute("aria-disabled"), null, `${nom} : pas de verrouillage`);
    assert.equal(m.element("conventionEnregistrer").getAttribute("aria-disabled"), null, `${nom} : pas de verrouillage`);
    assert.deepEqual(m.fieldsets().map((f) => f.disabled), [false, false, false], `${nom} : champs modifiables`);
    assert.equal(m.element("conventionAttente").innerHTML, "", `${nom} : pas de phrase d'attente`);
    assert.equal(alerte(m).visible, false, `${nom} : pas d'alerte`);
  }
});

// ---------------------------------------------------------------------------
// 2. Au clic : verrouillage immediat, puis rien ne ferme ni n'enregistre
// ---------------------------------------------------------------------------

// Echoue si, juste apres le clic (la generation n'est pas finie), un des trois boutons du
// pied n'est pas en aria-disabled (ou prend disabled), si un des trois fieldset n'est pas
// disabled, si le bouton n'affiche pas « Génération en cours… », si la phrase d'attente
// n'est pas dans la zone #conventionAttente (role="status", presente des l'ouverture), si le
// focus quitte le bouton, ou si un deuxieme clic lance une deuxieme generation.
test("au clic, avant la fin de la génération : trois boutons grisés, blocs non modifiables, « Génération en cours… », phrase d'attente, focus gardé", async () => {
  const m = await preparer();
  const attente = enAttente();
  m.generation.comportement = attente.comportement;
  m.remplir();
  assert.equal(balise(m.hote.innerHTML, "conventionAttente").includes('role="status"'), true, "la zone d'attente (role=status) est là dès l'ouverture");
  assert.equal(m.element("conventionAttente").innerHTML, "", "…et vide");

  m.cliquerSansAttendre();
  // Aucune pause entre le clic et ces verifications : le verrou est pose avant la premiere operation asynchrone.
  assert.equal(m.generation.appels.length, 1, "la génération est lancée");
  verifierVerrouille(m, "juste après le clic");
  assert.equal(m.actif(), m.element("conventionGenererFenetre"), "le focus reste sur le bouton");

  m.element("conventionGenererFenetre").click();
  await attendre();
  assert.equal(m.generation.appels.length, 1, "un deuxième clic ne relance rien");
  verifierVerrouille(m, "après un deuxième clic");

  attente.resoudre({nomFichier: "Convention-fictive.pdf"});
  await attendre();
});

// Echoue si, pendant l'attente, « Fermer », Echap, « Enregistrer les informations » (clic
// de son bouton d'envoi, donc evenement submit) ou la touche Entree ferment la fenetre, la
// modifient, ou lancent un enregistrement ; ou si le verrou ne se leve pas apres l'echec.
test("pendant l'attente, « Fermer », Échap, « Enregistrer » et Entrée sont ignorés", async () => {
  const m = await preparer();
  const attente = enAttente();
  m.generation.comportement = attente.comportement;
  m.remplir();
  m.cliquerSansAttendre();
  const avant = m.hote.innerHTML;

  m.element("conventionFermer").click();
  assert.equal(m.hote.innerHTML, avant, "« Fermer » ne ferme pas");
  m.touche("Escape");
  assert.equal(m.hote.innerHTML, avant, "Échap ne ferme pas");
  assert.equal(m.soumettre(), true, "Entrée / « Enregistrer » : preventDefault est appelé (la page ne se recharge pas)");
  assert.equal(m.enregistrements.length, 0, "aucun enregistrement n'est lancé");
  assert.equal(m.w.state.conventionOpen, true);
  assert.equal(m.corpsAClasse("modal-open"), true);
  assert.equal(alerte(m).visible, false, "aucune alerte ne s'affiche");
  assert.equal(m.generation.appels.length, 1, "toujours une seule génération");
  verifierVerrouille(m, "après les tentatives");

  attente.rejeter(Object.assign(new Error("échec fictif"), {code: "echec-inattendu"}));
  await attendre();
  verifierDeverrouille(m, "après l'échec");
  m.touche("Escape");
  assert.equal(m.hote.innerHTML, "", "une fois l'attente finie, Échap ferme de nouveau");
});

// ---------------------------------------------------------------------------
// 3. Champs a corriger : tous les messages, l'alerte du haut, le focus
// ---------------------------------------------------------------------------

// Les problemes que renvoie la generation, dans l'ordre de la fenetre. Les deux cas couvrent
// ensemble les cinq champs controles et les cinq messages de la note (annee absente, annee pas a quatre chiffres,
// signataire absent, signataire sans fonction, representant, fonction du representant).
const CAS_CHAMPS = {
  "année absente, aucun signataire, représentant et fonction du représentant vides": [
    {id: "conventionAnnee", message: "Saisissez l'année de la convention."},
    {id: "clubSignataire", message: "Choisissez le signataire du club."},
    {id: "agenceRepresentant", message: "Saisissez le nom du représentant."},
    {id: "agenceFonction", message: "Saisissez la fonction du représentant."},
  ],
  "année pas à quatre chiffres, signataire sans fonction": [
    {id: "conventionAnnee", message: "Saisissez une année à quatre chiffres."},
    {id: "clubFonction", message: "Le signataire choisi n'a pas de fonction. Renseignez-la dans la fiche du club, puis revenez générer la convention."},
  ],
};

// Echoue si, pour un echec champs-a-corriger, un champ de la liste n'est pas en is-invalid
// avec aria-invalid et aria-describedby vers son message, si son message sous le champ n'est
// pas « Erreur : » + le texte exact, si un champ hors liste est marque, si l'alerte du haut n'est pas
// visible (alert-error, role alert) avec « Certains champs sont à corriger. », si le focus ne va
// pas sur le premier champ de la liste, si la fenetre ne reste pas ouverte avec la saisie
// gardee, ou si l'ecran reste verrouille.
for (const [nom, problemes] of Object.entries(CAS_CHAMPS)) {
  test(`champs à corriger (${nom}) : messages sous les champs, alerte en haut, focus sur le premier champ`, async () => {
    const m = await preparer();
    m.generation.comportement = echoue("champs-a-corriger", {problemes});
    m.remplir();
    await m.cliquerGenerer();

    for (const id of CHAMPS_CONTROLES) {
      const probleme = problemes.find((p) => p.id === id);
      const champEl = m.element(id);
      assert.equal(champEl.classList.contains("is-invalid"), Boolean(probleme), `${id} : is-invalid`);
      assert.equal(champEl.getAttribute("aria-invalid"), probleme ? "true" : null, `${id} : aria-invalid`);
      if (probleme) {
        assert.equal(champEl.getAttribute("aria-describedby"), `${id}Erreur`, `${id} : relié à son message`);
        assert.equal(lire(m.element(`${id}Erreur`).innerHTML), `Erreur : ${probleme.message}`, `${id} : message sous le champ`);
        assert.match(m.element(`${id}Erreur`).innerHTML, /<span class="sr-only">Erreur : <\/span>/, `${id} : « Erreur : » est un texte caché`);
      }
    }
    const a = alerte(m);
    assert.equal(a.visible, true, "alerte visible");
    assert.equal(a.texte, ALERTE_CHAMPS, "texte de l'alerte");
    assert.equal(a.zone.classList.contains("alert-error"), true, "alert-error");
    assert.equal(a.zone.getAttribute("role"), "alert", "role=alert");
    assert.equal(m.actif(), m.element(problemes[0].id), "focus sur le premier champ à corriger");
    assert.notEqual(m.hote.innerHTML, "", "la fenêtre reste ouverte");
    assert.deepEqual(m.saisie(), SAISIE, "la saisie est gardée");
    verifierDeverrouille(m, "après les champs à corriger");
    assert.equal(m.enregistrements.length, 0, "aucun enregistrement par ce chemin");
  });
}

// Echoue si une nouvelle tentative ne retire pas, des son debut, les erreurs de champ et
// l'alerte de la tentative precedente (la note : « les anciens messages d'erreur sont
// effaces au debut de chaque tentative »), ou si un echec de generation suivant laisse un
// champ marque ou remplace son message par « Certains champs sont à corriger. ».
test("une nouvelle tentative efface d'abord les erreurs de champ et l'alerte ; l'échec suivant n'affiche que son message", async () => {
  const m = await preparer();
  m.generation.comportement = echoue("champs-a-corriger", {problemes: CAS_CHAMPS["année absente, aucun signataire, représentant et fonction du représentant vides"]});
  m.remplir();
  await m.cliquerGenerer();
  assert.equal(m.element("conventionAnnee").classList.contains("is-invalid"), true, "préparation : une erreur est affichée");
  assert.equal(alerte(m).visible, true, "préparation : l'alerte est affichée");

  const attente = enAttente();
  m.generation.comportement = attente.comportement;
  m.cliquerSansAttendre();
  verifierAucunChampEnErreur(m, "au début de la 2e tentative");
  assert.equal(alerte(m).visible, false, "l'alerte est cachée au début de la 2e tentative");
  assert.equal(m.element("conventionAnnee").getAttribute("aria-describedby"), null, "le lien vers le message d'erreur est retiré");

  attente.rejeter(Object.assign(new Error("échec fictif"), {code: "echec-inattendu"}));
  await attendre();
  verifierAucunChampEnErreur(m, "après l'échec de la 2e tentative");
  assert.equal(alerte(m).texte, ECHECS["echec-inattendu"]);
});

// ---------------------------------------------------------------------------
// 4. Un message exact par code d'echec
// ---------------------------------------------------------------------------

// Un test par code. Echoue si le message de ce code change d'un mot, s'il n'est pas dans
// l'alerte d'erreur (alert-error, role alert), si la fenetre se ferme, si la saisie est
// perdue, si l'ecran reste verrouille, si le focus ne revient pas sur « Générer la convention »,
// si le corps ne defile pas jusqu'a l'alerte, si un nouveau clic ne relance pas, ou si « Fermer » ne ferme plus.
for (const [code, message] of Object.entries(ECHECS)) {
  test(`échec « ${code} » : message exact, fenêtre ouverte, saisie gardée, tout déverrouillé, focus sur le bouton`, async () => {
    const m = await preparer();
    m.generation.comportement = echoue(code);
    m.remplir();
    await m.cliquerGenerer();
    assert.ok(message.endsWith("Vos informations sont conservées."), "le message de la note se termine par « Vos informations sont conservées. »");
    await verifierEchec(m, message, code);
  });
}

// Echoue si l'echec d'enregistrement des informations (premiere etape de la generation) n'affiche
// pas le message d'enregistrement existant (note UX §5), ou ne se comporte pas comme les autres echecs.
test("échec « enregistrement-echoue » : le message d'enregistrement existant, fenêtre ouverte, saisie gardée, tout déverrouillé", async () => {
  const m = await preparer();
  m.generation.comportement = echoue("enregistrement-echoue");
  m.remplir();
  await m.cliquerGenerer();
  await verifierEchec(m, MESSAGE_ENREGISTREMENT, "enregistrement-echoue");
});

// Echoue si un code inconnu, une erreur sans code, ou une valeur qui n'est pas une erreur (rejet
// sans valeur) n'affiche pas le message « echec inattendu » (« La convention n'a pas pu être générée. Vos informations sont conservées. »).
test("un code inconnu, une erreur sans code ou un rejet sans valeur donnent le message de l'échec inattendu", async () => {
  const cas = {
    "code inconnu": () => Promise.reject(Object.assign(new Error("échec fictif"), {code: "code-que-personne-ne-connait"})),
    "erreur sans code": () => Promise.reject(new Error("échec fictif")),
    "rejet sans valeur": () => Promise.reject(undefined),
  };
  for (const [nom, comportement] of Object.entries(cas)) {
    const m = await preparer();
    m.generation.comportement = comportement;
    m.remplir();
    await m.cliquerGenerer();
    await verifierEchec(m, ECHECS["echec-inattendu"], nom);
  }
});

// ---------------------------------------------------------------------------
// 5. Cases inconnues : noms dans le message, affiches comme du texte
// ---------------------------------------------------------------------------

async function echecCases(cases) {
  const m = await preparer();
  m.generation.comportement = echoue("cases-inconnues", {cases});
  m.remplir();
  await m.cliquerGenerer();
  return m;
}

// Echoue si une seule case inconnue n'est pas annoncee au singulier (« une case inconnue, « X » »).
test("échec « cases-inconnues », une case : message au singulier avec son nom", async () => {
  const m = await echecCases(["Case Exemple"]);
  await verifierEchec(m, `La convention n'a pas pu être générée : le modèle contient une case inconnue, « Case Exemple ». ${FIN_CASES}`, "une case");
});

// Echoue si plusieurs cases ne sont pas annoncees au pluriel, toutes nommees, dans l'ordre recu.
test("échec « cases-inconnues », plusieurs cases : message au pluriel, toutes nommées dans l'ordre", async () => {
  const m = await echecCases(["Case B", "Case A", "Case C"]);
  await verifierEchec(m, `La convention n'a pas pu être générée : le modèle contient des cases inconnues, « Case B », « Case A », « Case C ». ${FIN_CASES}`, "trois cases");
});

// Echoue si, au-dela de cinq cases, le message nomme autre chose que les cinq premieres suivies de « et d'autres ».
test("échec « cases-inconnues », plus de cinq cases : les cinq premières, puis « et d'autres »", async () => {
  const m = await echecCases(["C1", "C2", "C3", "C4", "C5", "C6", "C7"]);
  await verifierEchec(m, `La convention n'a pas pu être générée : le modèle contient des cases inconnues, « C1 », « C2 », « C3 », « C4 », « C5 » et d'autres. ${FIN_CASES}`, "sept cases");
  const exactement = await echecCases(["C1", "C2", "C3", "C4", "C5"]);
  assert.equal(alerte(exactement).texte,
    `La convention n'a pas pu être générée : le modèle contient des cases inconnues, « C1 », « C2 », « C3 », « C4 », « C5 ». ${FIN_CASES}`,
    "cinq cases : pas de « et d'autres »");
});

// Echoue si un nom de case venant du modele (saisi dans Grist) est insere comme du HTML :
// il doit apparaitre tel quel, comme texte (textContent), sans rien ecrire dans la page ni
// dans l'enfant de l'alerte par innerHTML.
test("échec « cases-inconnues » : un nom de case avec du HTML s'affiche comme du texte, jamais inséré dans la page", async () => {
  const nom = '<b>Case</b> & "<script>alert(1)</script>"';
  const m = await echecCases([nom]);
  const contenuAlerte = m.element("conventionMessage").querySelector(".alert-content");
  assert.equal(contenuAlerte.textContent,
    `La convention n'a pas pu être générée : le modèle contient une case inconnue, « ${nom} ». ${FIN_CASES}`,
    "le nom est affiché tel quel, comme texte");
  assert.equal(contenuAlerte.innerHTML, undefined, "rien n'est écrit par innerHTML dans l'alerte");
  assert.ok(!/<script/i.test(m.hote.innerHTML) && !m.hote.innerHTML.includes("<b>Case"), "aucune balise issue du nom dans la page");
});

// Echoue si une liste de cases vide, absente ou faite de noms vides affiche un message de cases
// inconnues sans nom (« … une case inconnue, . ») au lieu du message de l'echec inattendu.
test("échec « cases-inconnues » sans nom lisible (liste vide, absente, noms vides) : message de l'échec inattendu", async () => {
  for (const [nom, cases] of [["liste vide", []], ["liste absente", undefined], ["noms vides", ["", "   "]]]) {
    const m = await echecCases(cases);
    await verifierEchec(m, ECHECS["echec-inattendu"], nom);
  }
});

// ---------------------------------------------------------------------------
// 6. Reussite : fenetre fermee, bloc « Generee », message, focus
// ---------------------------------------------------------------------------

// Comme la vraie generation, la doublure ajoute le PDF et la date a la convention en memoire :
// c'est ce que le bloc relit pour passer a l'etat « Générée ».
function reussiteAvecPdf(m) {
  return () => {
    m.w.state.raw.Conventions.push({id: 20, Action: 1, PDF_genere: ["L", 41], Date_generation: secondes(2026, 3, 14)});
    return Promise.resolve({nomFichier: "Convention-fictive.pdf"});
  };
}

// Echoue si, apres une reussite, la fenetre reste ouverte (state.conventionOpen, modal-open),
// si le bloc n'affiche pas l'etat « Générée » (phrase avec la date, puis phrase d'aide, puis les
// boutons « Voir la convention » (avec son texte cache), « Re-générer » et « Déposer la convention
// signée » (depuis la 9.1a), dans cet ordre, et plus le bouton « Générer la convention »), si le message « Convention générée. » n'est pas dans une
// alerte alert-success placee dans la zone role="status" du bloc, ou si le focus n'est pas sur
// « Voir la convention » (decision D-S7-6, et note UX §12.1 : « Re-générer » existe mais ne recoit
// pas le focus) : le message de reussite, lui, ne recoit plus le focus.
test("réussite : fenêtre fermée, bloc « Générée » avec « Voir la convention », « Re-générer » puis « Déposer la convention signée », message « Convention générée. », focus sur « Voir la convention »", async () => {
  const m = await preparer();
  m.generation.comportement = reussiteAvecPdf(m);
  m.remplir();
  await m.cliquerGenerer();

  assert.equal(m.hote.innerHTML, "", "la fenêtre est fermée");
  assert.equal(m.w.state.conventionOpen, false, "state.conventionOpen");
  assert.equal(m.corpsAClasse("modal-open"), false, "modal-open retiré");

  assert.deepEqual(phrases(m.htmlContenu()), [
    "Convention générée le 14/03/2026.",
    "Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé.",
  ]);
  const boutons = m.htmlContenu().match(/<button\b[^>]*>/g) || [];
  assert.equal(boutons.length, 3, "trois boutons dans le bloc");
  assert.match(boutons[0], /\sid="conventionVoir"/, "le premier est « Voir la convention »");
  assert.match(boutons[1], /\sid="conventionRegenerer"/, "le deuxième est « Re-générer »");
  assert.match(boutons[2], /\sid="conventionDeposer"/, "le troisième est « Déposer la convention signée »");
  assert.equal(texteDe(m.htmlContenu(), "button", "conventionDeposer"), "Déposer la convention signée", "libellé de « Déposer »");
  assert.equal(texteDe(m.htmlContenu(), "button", "conventionRegenerer"), "Re-générer", "libellé de « Re-générer »");
  assert.equal(texteDe(m.htmlContenu(), "button", "conventionVoir"), "Voir la convention (s'ouvre dans un nouvel onglet)", "texte, puis texte caché");
  assert.match(decoder(m.htmlContenu()), /<span class="btn-content">Voir la convention<span class="sr-only"> \(s'ouvre dans un nouvel onglet\)<\/span><\/span>/, "le texte caché est dans un sr-only");
  assert.ok(!m.htmlContenu().includes("conventionGenerer"), "le bouton « Générer la convention » du bloc a disparu");

  assert.equal(m.zoneMessage.getAttribute("role"), "status", "la zone de message est la région role=status du bloc");
  assert.match(m.htmlZone(), /<div class="alert alert-success"/, "alerte de succès");
  assert.equal(lire(m.htmlZone()), MESSAGE_REUSSITE);
  assert.equal(m.actif(), m.element("conventionVoir"), "le focus est sur « Voir la convention »");
  assert.notEqual(m.actif(), m.element("conventionRegenerer"), "le focus n'est pas sur « Re-générer »");
  assert.notEqual(m.actif(), m.element("conventionReussite"), "le focus n'est plus sur le message de réussite");
});

// Echoue si la reussite recharge la fiche (renderEdit : ce qui est saisi et pas enregistre
// dans la fiche serait efface), reecrit la zone de message plus d'une fois, ou ne reecrit
// pas le contenu du bloc exactement une fois ; ou si le verrou reste pose apres la reussite
// (Echap ne fermerait plus une fenetre rouverte).
test("réussite : seul le contenu du bloc est refait (la fiche n'est pas rechargée) et le verrou est levé", async () => {
  const m = await preparer();
  m.generation.comportement = reussiteAvecPdf(m);
  m.remplir();
  await m.cliquerGenerer();

  assert.equal(m.rendus.fiche, 0, "renderEdit n'est pas appelée");
  assert.equal(m.ecritures.contenu, 1, "le contenu du bloc est refait une fois");
  assert.equal(m.ecritures.alerte, 1, "la zone de message reçoit le message une fois, sans être refaite");

  m.w.openConvention(1);
  assert.notEqual(m.hote.innerHTML, "", "la fenêtre se rouvre");
  assert.equal(m.touche("Escape"), true);
  assert.equal(m.hote.innerHTML, "", "Échap ferme : le verrou de la génération est levé");
});

// ---------------------------------------------------------------------------
// 7. Tache 8.1 : « Re-générer » (fenetre ouverte depuis l'etat « Générée »)
// ---------------------------------------------------------------------------
// preparer({conventions: [CONVENTION_EXISTANTE], ouverture: "regenerer"}) : le bloc est a l'etat
// « Générée », la personne met le focus sur « Re-générer » et clique. Sans `conventions`, c'est la
// premiere generation. La generation elle-meme reste une doublure (comme plus haut).

const GENEREE_LE = secondes(2026, 3, 14);
const CONVENTION_EXISTANTE = {
  id: 20, Action: 1, PDF_genere: ["L", 41], Date_generation: GENEREE_LE,
  Annee: 2029, Signataire_club: 31, Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe",
};
const ANCIENNE_DISPONIBLE = "L'ancienne convention reste disponible.";
const regeneration = () => preparer({conventions: [CONVENTION_EXISTANTE], ouverture: "regenerer"});

// Echoue si le clic sur « Re-générer » n'ouvre pas la fenetre (state.conventionOpen, modal-open),
// si elle n'est pas prerempli avec l'annee ENREGISTREE (2029, pas l'annee en cours), le signataire
// (et sa fonction), le representant et sa fonction, si la phrase « Le nouveau PDF remplacera… »
// manque dans la fenetre ouverte, si le pied cesse de dire « Générer la convention » (D-S8-1), ou
// si le focus ne va pas sur le premier champ modifiable (« Année »).
test("« Re-générer » : un clic ouvre la fenêtre préremplie (année enregistrée, signataire, représentant), avec la phrase de remplacement", async () => {
  const m = await regeneration();
  assert.notEqual(m.hote.innerHTML, "", "la fenêtre est ouverte");
  assert.equal(m.w.state.conventionOpen, true, "state.conventionOpen");
  assert.equal(m.corpsAClasse("modal-open"), true, "modal-open posé");
  assert.ok(m.hote.innerHTML.includes("<p>Le nouveau PDF remplacera la convention générée le 14/03/2026.</p>"), "la phrase de remplacement est dans la fenêtre");
  assert.equal(m.element("conventionAnnee").value, "2029", "l'année enregistrée, pas l'année en cours");
  assert.equal(m.element("clubSignataire").value, "31", "le signataire enregistré");
  assert.equal(m.element("clubFonction").value, "Présidente", "la fonction du signataire s'affiche");
  assert.equal(m.element("agenceRepresentant").value, "Dana Exemple", "le représentant enregistré");
  assert.equal(m.element("agenceFonction").value, "Directrice adjointe", "la fonction du représentant enregistrée");
  assert.equal(texteDe(m.hote.innerHTML, "button", "conventionGenererFenetre"), LIBELLE, "le pied dit toujours « Générer la convention »");
  assert.equal(m.actif(), m.element("conventionAnnee"), "le focus est sur « Année »");
  assert.equal(m.generation.appels.length, 0, "ouvrir la fenêtre ne génère rien");
});

// Echoue si un clic sur « Re-générer » grise (agence manquante) ouvre quand meme la fenetre,
// ou si le bouton grise n'est pas aria-disabled="true".
test("« Re-générer » grisé (agence manquante) : un clic n'ouvre pas la fenêtre", async () => {
  const m = await preparer({conventions: [CONVENTION_EXISTANTE], action: {Agence: 0}, ouverture: "aucune"});
  assert.equal(m.element("conventionRegenerer").getAttribute("aria-disabled"), "true", "le bouton est grisé");
  m.element("conventionRegenerer").focus();
  m.element("conventionRegenerer").click();
  assert.equal(m.hote.innerHTML, "", "la fenêtre ne s'ouvre pas");
  assert.ok(!m.w.state.conventionOpen, "state.conventionOpen");
  assert.equal(m.corpsAClasse("modal-open"), false, "modal-open absent");
});

// Echoue si « Fermer » ou Echap (sans avoir lance de generation) ne ferme pas la fenetre, ne rend
// pas le focus a « Re-générer » (le bouton qui l'a ouverte), le rend a « Voir la convention », ou
// touche a la convention enregistree (l'ancien PDF reste, rien n'est genere).
test("« Re-générer » : « Fermer » ou Échap sans génération ferme la fenêtre et le focus revient sur « Re-générer »", async () => {
  const fermetures = {
    "« Fermer »": (m) => m.element("conventionFermer").click(),
    "Échap": (m) => m.touche("Escape"),
  };
  for (const [nom, fermer] of Object.entries(fermetures)) {
    const m = await regeneration();
    assert.notEqual(m.hote.innerHTML, "", `${nom} : la fenêtre est ouverte avant`);
    fermer(m);
    assert.equal(m.hote.innerHTML, "", `${nom} : la fenêtre est fermée`);
    assert.equal(m.w.state.conventionOpen, false, `${nom} : state.conventionOpen`);
    assert.equal(m.corpsAClasse("modal-open"), false, `${nom} : modal-open retiré`);
    assert.equal(m.actif(), m.element("conventionRegenerer"), `${nom} : le focus est revenu sur « Re-générer »`);
    assert.notEqual(m.actif(), m.element("conventionVoir"), `${nom} : pas sur « Voir la convention »`);
    assert.equal(m.generation.appels.length, 0, `${nom} : aucune génération`);
    assert.deepEqual(m.w.state.raw.Conventions[0].PDF_genere, ["L", 41], `${nom} : l'ancien PDF reste rattaché`);
    assert.equal(m.w.state.raw.Conventions[0].Date_generation, GENEREE_LE, `${nom} : l'ancienne date reste`);
  }
});

// Un test par code. Echoue si, a la re-generation, le message de ce code (celui de la premiere
// generation, mot pour mot) n'est pas suivi de « L'ancienne convention reste disponible. », ou si
// le reste du comportement de l'echec change (fenetre ouverte, saisie gardee, tout deverrouille,
// focus sur le bouton, defilement, nouveau clic possible, « Fermer » ferme).
for (const [code, message] of Object.entries(ECHECS)) {
  test(`re-génération, échec « ${code} » : le message habituel, puis « L'ancienne convention reste disponible. »`, async () => {
    const m = await regeneration();
    m.generation.comportement = echoue(code);
    m.remplir();
    await m.cliquerGenerer();
    await verifierEchec(m, `${message} ${ANCIENNE_DISPONIBLE}`, code);
  });
}

// Echoue si, a la re-generation, les messages de cases inconnues (une case, plusieurs, plus de
// cinq) ne finissent pas par la phrase, ou si elle est ajoutee a un autre endroit que la fin.
test("re-génération, échec « cases-inconnues » (une case, plusieurs, plus de cinq) : le message habituel, puis « L'ancienne convention reste disponible. »", async () => {
  const cas = [
    [["Case Exemple"], `La convention n'a pas pu être générée : le modèle contient une case inconnue, « Case Exemple ». ${FIN_CASES}`],
    [["Case B", "Case A"], `La convention n'a pas pu être générée : le modèle contient des cases inconnues, « Case B », « Case A ». ${FIN_CASES}`],
    [["C1", "C2", "C3", "C4", "C5", "C6", "C7"], `La convention n'a pas pu être générée : le modèle contient des cases inconnues, « C1 », « C2 », « C3 », « C4 », « C5 » et d'autres. ${FIN_CASES}`],
  ];
  for (const [cases, message] of cas) {
    const m = await regeneration();
    m.generation.comportement = echoue("cases-inconnues", {cases});
    m.remplir();
    await m.cliquerGenerer();
    await verifierEchec(m, `${message} ${ANCIENNE_DISPONIBLE}`, `${cases.length} case(s)`);
  }
});

// Echoue si, a la re-generation, un code inconnu, une erreur sans code, un rejet sans valeur ou
// une liste de cases vide n'affichent pas le message de l'echec inattendu suivi de la phrase.
test("re-génération : code inconnu, erreur sans code, rejet sans valeur ou cases sans nom lisible : message de l'échec inattendu, puis « L'ancienne convention reste disponible. »", async () => {
  const cas = {
    "code inconnu": () => Promise.reject(Object.assign(new Error("échec fictif"), {code: "code-que-personne-ne-connait"})),
    "erreur sans code": () => Promise.reject(new Error("échec fictif")),
    "rejet sans valeur": () => Promise.reject(undefined),
    "cases sans nom lisible": echoue("cases-inconnues", {cases: []}),
  };
  for (const [nom, comportement] of Object.entries(cas)) {
    const m = await regeneration();
    m.generation.comportement = comportement;
    m.remplir();
    await m.cliquerGenerer();
    await verifierEchec(m, `${ECHECS["echec-inattendu"]} ${ANCIENNE_DISPONIBLE}`, nom);
  }
});

// Echoue si la phrase « L'ancienne convention reste disponible. » apparait dans un echec de PREMIERE
// generation (il n'y a pas d'ancienne convention) : sans aucune ligne Conventions, ou avec une
// ligne dont seules les informations sont enregistrees (pas de PDF genere), pour tous les codes d'echec.
test("première génération : aucun message d'échec ne contient « L'ancienne convention reste disponible. »", async () => {
  const contextes = {
    "aucune ligne Conventions": [],
    "ligne avec les informations enregistrées, sans PDF": [{id: 20, Action: 1, Annee: 2029, Signataire_club: 31}],
  };
  const echecs = {
    ...Object.fromEntries(Object.keys(ECHECS).map((code) => [code, echoue(code)])),
    "cases-inconnues": echoue("cases-inconnues", {cases: ["Case Exemple"]}),
    "code inconnu": echoue("code-que-personne-ne-connait"),
    "rejet sans valeur": () => Promise.reject(undefined),
  };
  for (const [contexte, conventions] of Object.entries(contextes)) {
    for (const [code, comportement] of Object.entries(echecs)) {
      const m = await preparer({conventions});
      m.generation.comportement = comportement;
      m.remplir();
      await m.cliquerGenerer();
      const texte = alerte(m).texte;
      assert.ok(texte.length > 0, `${contexte}, ${code} : un message est affiché`);
      assert.ok(!texte.includes("ancienne convention"), `${contexte}, ${code} : pas de phrase sur l'ancienne convention (« ${texte} »)`);
    }
  }
});

// Echoue si, a la re-generation, les champs a corriger affichent la phrase (dans l'alerte du haut ou
// sous un champ), ou si l'alerte n'est plus « Certains champs sont à corriger. » mot pour mot.
test("re-génération, champs à corriger : ni l'alerte ni les messages sous les champs ne contiennent « L'ancienne convention reste disponible. »", async () => {
  for (const [nom, problemes] of Object.entries(CAS_CHAMPS)) {
    const m = await regeneration();
    m.generation.comportement = echoue("champs-a-corriger", {problemes});
    m.remplir();
    await m.cliquerGenerer();
    const a = alerte(m);
    assert.equal(a.visible, true, `${nom} : alerte visible`);
    assert.equal(a.texte, ALERTE_CHAMPS, `${nom} : texte de l'alerte, sans la phrase`);
    for (const {id, message} of problemes) {
      assert.equal(lire(m.element(`${id}Erreur`).innerHTML), `Erreur : ${message}`, `${nom} : message sous ${id}, sans la phrase`);
    }
    assert.ok(!m.hote.innerHTML.includes("ancienne convention"), `${nom} : rien dans la fenêtre`);
    assert.equal(m.element("conventionMessage").querySelector(".alert-content").textContent.includes("ancienne convention"), false, `${nom} : rien dans l'alerte`);
  }
});

// Echoue si, a la re-generation, l'echec d'enregistrement des informations (etape 2) n'affiche pas
// le message d'enregistrement existant tel quel (il ne parle pas de generation) : avec la phrase
// ajoutee, l'egalite exacte echouerait.
test("re-génération, échec d'enregistrement des informations (étape 2) : le message d'enregistrement tel quel, sans « L'ancienne convention reste disponible. »", async () => {
  const m = await regeneration();
  m.generation.comportement = echoue("enregistrement-echoue");
  m.remplir();
  await m.cliquerGenerer();
  assert.ok(!alerte(m).texte.includes("ancienne convention"), "pas de phrase sur l'ancienne convention");
  await verifierEchec(m, MESSAGE_ENREGISTREMENT, "enregistrement-echoue");
});
