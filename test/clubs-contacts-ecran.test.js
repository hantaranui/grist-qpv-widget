"use strict";

// Tests des ecrans de gestion des contacts du widget clubs : carte Contacts,
// fenetre d'ajout et de modification, fenetre de confirmation de suppression,
// messages, zone d'annonce #contactStatus, clavier. Regles :
// docs/ux/contacts-fiche-club.md (§3, §6.2, §8). Les fonctions de donnees ont
// leurs tests dans test/clubs-contacts.test.js. Valeurs fictives uniquement.
//
// Le bac a sable de test/helpers/clubs.js n'a pas de vrai DOM : le HTML ecrit
// dans un element se relit en texte, mais rien n'est analyse. On pose donc ici,
// sur w.document (le helper ne change pas), un DOM minimal :
//  - chaque element retient ses ecouteurs et recoit le focus ;
//  - un id qui n'est pas dans le HTML affiche (fenetre ouverte, fiche) renvoie
//    null, comme getElementById dans un vrai navigateur ;
//  - les boutons Modifier / Supprimer de la fiche se retrouvent par
//    querySelectorAll, et un champ se remplit en ecrivant sa propriete value.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadClubs} = require("./helpers/clubs");
const {makeElement} = require("./helpers/widget");

// Les objets crees dans le bac a sable ont leurs propres prototypes : on les
// ramene a des valeurs simples avant de les comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

const CLUB = {id: 7, Nom: "Club fictif de Beauvais", SIRET: "", Adresse: "", Code_postal: "", Code_Insee: "", Logo: null};
const ZOE = {id: 1, Club: 7, Nom: "Martin", Prenom: "Zoe", Email: "zoe.martin@exemple.fr", Telephone: "01 02 03 04 05", Fonction: "Entraineuse"};
const ALEX = {id: 2, Club: 7, Nom: "Bernard", Prenom: "Alex", Email: "alex.bernard@exemple.fr", Telephone: "", Fonction: ""};

const SAISIE_VALIDE = {
  Nom: "Dupontel", Prenom: "Lucie", Email: "lucie.dupontel@exemple.fr", Telephone: "01 06 07 08 09", Fonction: "Presidente",
};

// Un morceau reconnaissable dans le texte brut d'une erreur : il ne doit jamais
// apparaitre a l'ecran (une erreur Grist peut reprendre des valeurs saisies).
const BRUT = "SENTINELLE-erreur-brute Nom=Dupontel Email=lucie.dupontel@exemple.fr";

// Ids qui n'existent que tant que la fenetre est ouverte, et ceux de la fiche.
const IDS_FENETRE = [
  "contactDialog", "contactForm", "contactMessage", "contactFields", "cancelContact", "submitContact",
  "contactNom", "contactPrenom", "contactEmail", "contactTelephone", "contactFonction",
  "deleteContactDialog", "deleteContactMessage", "cancelDeleteContact", "confirmDeleteContact",
];
const IDS_FICHE = ["addContact", "backToList"];

// Format colonnes, celui que renvoie grist.docApi.fetchTable.
function colonnes(lignes) {
  const table = {id: lignes.map((ligne) => ligne.id)};
  const cles = new Set(lignes.flatMap((ligne) => Object.keys(ligne)));
  cles.delete("id");
  for (const cle of cles) table[cle] = lignes.map((ligne) => (cle in ligne ? ligne[cle] : null));
  return table;
}

// Ce que ferait Grist d'une ecriture reussie : la table Contacts suit, pour que
// la relecture qui suit une reussite montre l'etat reel.
function appliquer(actions, donnees) {
  for (const [type, , id, valeurs] of actions) {
    if (type === "AddRecord") donnees.contacts.push({id: 100 + donnees.contacts.length, ...valeurs});
    if (type === "UpdateRecord") Object.assign(donnees.contacts.find((contact) => contact.id === id), valeurs);
    if (type === "RemoveRecord") donnees.contacts = donnees.contacts.filter((contact) => contact.id !== id);
  }
}

// Une ecriture qui reste en attente jusqu'a terminer() : pour tester ce qui se
// passe pendant l'envoi.
function attente() {
  let terminer;
  const promesse = new Promise((resolve) => { terminer = resolve; });
  return {promesse, terminer};
}

// DOM minimal pose sur le document du bac a sable (voir l'en-tete du fichier).
function installerDom(w) {
  const doc = w.document;
  const elements = w.elements;
  elements.clear();
  const clavier = {};
  const boutons = new Map();

  // Un element qui garde le HTML ecrit et efface, a chaque ecriture, les elements
  // de la fenetre ou de la fiche : au prochain getElementById ils sont neufs, sans
  // les ecouteurs de l'affichage precedent.
  function surveiller(element, aEffacer) {
    let html = "";
    Object.defineProperty(element, "innerHTML", {
      get: () => html,
      set(valeur) { html = String(valeur); aEffacer.forEach((id) => elements.delete(id)); },
      configurable: true,
    });
  }

  function equiper(id, element) {
    element.ecouteurs = {};
    element.addEventListener = (type, fonction) => { (element.ecouteurs[type] ||= []).push(fonction); };
    element.focus = () => { doc.activeElement = element; };
    if (id === "contactMessage" || id === "deleteContactMessage") element.classList.add("is-hidden");
    if (id === "contactModal") surveiller(element, IDS_FENETRE);
    if (id === "ficheView") surveiller(element, IDS_FICHE);
    return element;
  }

  function obtenir(id) {
    if (!elements.has(id)) elements.set(id, equiper(id, makeElement()));
    return elements.get(id);
  }

  doc.getElementById = (id) => {
    if (IDS_FENETRE.includes(id) && !obtenir("contactModal").innerHTML.includes(`id="${id}"`)) return null;
    if (IDS_FICHE.includes(id) && !obtenir("ficheView").innerHTML.includes(`id="${id}"`)) return null;
    return obtenir(id);
  };

  // Les boutons Modifier / Supprimer de la fiche : un element par bouton present
  // dans le HTML de la fiche, retrouvable ensuite dans `boutons`.
  doc.querySelectorAll = (selecteur) => {
    const trouve = /^\[data-(edit|delete)-contact\]$/.exec(selecteur);
    if (!trouve) return [];
    const nature = trouve[1];
    const motif = new RegExp(`data-${nature}-contact="(\\d+)"`, "g");
    return [...obtenir("ficheView").innerHTML.matchAll(motif)].map((ligne) => {
      const bouton = equiper(null, makeElement());
      bouton.dataset = {[`${nature}Contact`]: ligne[1]};
      boutons.set(`${nature}:${Number(ligne[1])}`, bouton);
      return bouton;
    });
  };
  doc.querySelector = (selecteur) => {
    const trouve = /^\[data-(edit|delete)-contact="(\d+)"\]$/.exec(selecteur);
    if (trouve) return boutons.get(`${trouve[1]}:${Number(trouve[2])}`) || null;
    return makeElement();
  };

  doc.body = makeElement();
  doc.body.contains = () => true;
  doc.activeElement = null;
  doc.addEventListener = (type, fonction) => { (clavier[type] ||= new Set()).add(fonction); };
  doc.removeEventListener = (type, fonction) => { if (clavier[type]) clavier[type].delete(fonction); };

  return {clavier, boutons};
}

// Ouvre la fiche du club 7 avec les contacts donnes. `ecriture` decide de ce que
// devient une ecriture : par defaut elle reussit ; elle peut rejeter (echec) ou
// rester en attente.
async function ouvrirFiche({contacts = [ZOE, ALEX], illisible = false, ecriture} = {}) {
  const donnees = {contacts: contacts.map((contact) => ({...contact}))};
  const ecritures = [];
  const docApi = {
    fetchTable: (table) => {
      if (table === "Structures") return Promise.resolve(colonnes([CLUB]));
      if (table === "Contacts") {
        return illisible ? Promise.reject(new Error("refus")) : Promise.resolve(colonnes(donnees.contacts));
      }
      return Promise.resolve({id: []});
    },
    getAccessToken: () => Promise.resolve({token: "jeton", baseUrl: "https://grist.example/api/docs/DOC"}),
    applyUserActions: (actions) => {
      ecritures.push(plain(actions));
      return Promise.resolve(ecriture ? ecriture(actions) : undefined).then(() => {
        appliquer(actions, donnees);
        return {};
      });
    },
  };
  const w = loadClubs({grist: {docApi}});
  // Le chargement de depart du widget : on le laisse finir avant de preparer le
  // reste (voir test/clubs-contacts.test.js).
  await new Promise((resolve) => setImmediate(resolve));
  const {clavier, boutons} = installerDom(w);
  await w.load();
  w.state.view = "fiche";
  w.state.currentId = 7;
  w.render();
  return {w, ecritures, donnees, clavier, boutons};
}

// --- Gestes de l'utilisateur ----------------------------------------------------

// Appelle les ecouteurs d'un element ; les ecouteurs partent tous tout de suite,
// la promesse rendue se termine quand les asynchrones ont fini.
function lancer(element, type, evenement = {}) {
  const ecouteurs = element.ecouteurs[type] || [];
  return Promise.all(ecouteurs.map((fonction) => fonction({preventDefault() {}, ...evenement})));
}

const par = (ecran, id) => ecran.w.document.getElementById(id);
const cliquer = (ecran, id) => lancer(par(ecran, id), "click");
const cliquerBouton = (ecran, nature, id) => lancer(ecran.boutons.get(`${nature}:${id}`), "click");
const valider = (ecran) => lancer(par(ecran, "contactForm"), "submit");
const touche = (ecran, key) => Promise.all([...(ecran.clavier.keydown || [])].map((fonction) => fonction({key, shiftKey: false, preventDefault() {}})));

function remplir(ecran, valeurs) {
  for (const [cle, valeur] of Object.entries(valeurs)) par(ecran, `contact${cle}`).value = valeur;
}

// --- Ce qu'on lit a l'ecran -----------------------------------------------------

const fiche = (ecran) => par(ecran, "ficheView").innerHTML;
const fenetre = (ecran) => par(ecran, "contactModal").innerHTML;
const annonce = (ecran) => par(ecran, "contactStatus").textContent;
const champs = (ecran) => par(ecran, "contactFields").innerHTML;
const messageDe = (ecran, id) => par(ecran, id).querySelector(".alert-content").textContent;
const messageVisible = (ecran, id) => !par(ecran, id).classList.contains("is-hidden");
const actif = (ecran) => ecran.w.document.activeElement;
const lignesDe = (html) => html.split('<li class="contact-item">').slice(1);
const occurrences = (texte, motif) => texte.split(motif).length - 1;

// =============================================================================
// Carte Contacts
// =============================================================================

test("carte : la fonction s'affiche sous le nom seulement si elle est renseignee", async () => {
  const ecran = await ouvrirFiche();
  // Classes par nom : Bernard (Alex, sans fonction) puis Martin (Zoe).
  const [alex, zoe] = lignesDe(fiche(ecran));

  assert.match(zoe, /<span class="contact-name">Zoe Martin<\/span>\s*<div class="contact-fonction muted-text">Entraineuse<\/div>\s*<a class="contact-mail"/,
    "la fonction est juste sous le nom, avant l'e-mail");
  assert.ok(!alex.includes("contact-fonction"), "sans fonction : aucune ligne, pas de tiret");
  assert.equal(occurrences(fiche(ecran), "contact-fonction"), 1);
});

test("carte : une fonction faite d'espaces ne laisse pas de ligne vide", async () => {
  const ecran = await ouvrirFiche({contacts: [{...ALEX, Fonction: "   "}]});
  assert.ok(!fiche(ecran).includes("contact-fonction"));
});

test("carte : « + Ajouter un contact » est present, avec des contacts comme sans contact", async () => {
  const avec = await ouvrirFiche();
  assert.match(fiche(avec), /<button class="btn btn-secondary btn-sm contact-add" type="button" id="addContact"><span class="btn-content">\+ Ajouter un contact<\/span><\/button>/);

  const sans = await ouvrirFiche({contacts: []});
  assert.match(fiche(sans), /id="addContact"/);
  assert.match(fiche(sans), /Aucun contact enregistré pour ce club\./);
});

test("carte : table Contacts illisible, pas de bouton Ajouter, et le message de droits", async () => {
  const ecran = await ouvrirFiche({illisible: true});
  assert.ok(ecran.w.state.unreadable.includes("Contacts"), "la table est bien vue comme illisible");
  assert.match(fiche(ecran), /Vos droits ne permettent pas de lire les contacts\./);
  assert.ok(!fiche(ecran).includes("addContact"));
  assert.ok(!fiche(ecran).includes("+ Ajouter un contact"));
  assert.ok(!fiche(ecran).includes("data-edit-contact"));
  assert.equal(par(ecran, "addContact"), null);
});

test("carte : deux boutons icone par ligne, chacun avec un aria-label qui nomme le contact", async () => {
  const ecran = await ouvrirFiche();
  const lignes = lignesDe(fiche(ecran));
  assert.equal(lignes.length, 2);

  for (const [ligne, nom] of [[lignes[0], "Alex Bernard"], [lignes[1], "Zoe Martin"]]) {
    assert.equal(occurrences(ligne, "<button"), 2, `deux boutons pour ${nom}`);
    assert.equal(occurrences(ligne, "btn-ratio-square"), 2);
    assert.ok(ligne.includes(`aria-label="Modifier le contact ${nom}"`));
    assert.ok(ligne.includes(`aria-label="Supprimer le contact ${nom}"`));
    // Icone seule : l'icone est cachee aux lecteurs d'ecran, aucun texte visible.
    const contenus = [...ligne.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((trouve) => trouve[1]);
    assert.deepEqual(contenus, [
      '<span aria-hidden="true" class="icon icon-edit"></span>',
      '<span aria-hidden="true" class="icon icon-trash"></span>',
    ]);
  }
  assert.ok(!/<span class="btn-content">(Modifier|Supprimer)<\/span>/.test(fiche(ecran)), "pas de bouton texte Modifier / Supprimer");
});

test("carte : le nom du contact passe par l'echappement dans l'aria-label", async () => {
  const hostile = {...ZOE, Prenom: '"><img src=x onerror=alert(1)>'};
  const ecran = await ouvrirFiche({contacts: [hostile]});
  assert.ok(!fiche(ecran).includes("<img src=x"));
  assert.match(fiche(ecran), /aria-label="Modifier le contact &quot;&gt;&lt;img src=x onerror=alert\(1\)&gt; Martin"/);
});

// =============================================================================
// Fenetre d'ajout
// =============================================================================

test("ajout : « Ajouter un contact » ouvre la fenetre, avec la mention « * champ obligatoire » et le focus dans Nom", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  const html = fenetre(ecran);

  assert.match(html, /<h2 class="modal-title" id="contactDialogTitle">Ajout d'un contact<\/h2>/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /<p class="contact-required-note">\* champ obligatoire<\/p>/);
  assert.match(html, /Club : Club fictif de Beauvais \(non modifiable\)/);
  assert.match(html, /Saisissez des coordonnées professionnelles/);
  assert.ok(ecran.w.document.body.classList.contains("modal-open"));
  assert.equal(actif(ecran), par(ecran, "contactNom"), "le focus entre dans le champ Nom");

  // Cinq champs, dans l'ordre de la note ; seuls Nom et E-mail sont obligatoires.
  const ordre = ["contactNom", "contactPrenom", "contactEmail", "contactTelephone", "contactFonction"].map((id) => html.indexOf(`id="${id}"`));
  assert.ok(ordre.every((position, i) => position > -1 && (i === 0 || position > ordre[i - 1])), "Nom, Prénom, E-mail, Téléphone, Fonction");
  assert.equal(occurrences(html, 'class="required"'), 2);
  assert.match(html, /E-mail<span class="required">&nbsp;\*<\/span>/);
  assert.match(html, /id="contactEmail"[^>]*type="email"/);
  assert.match(html, /id="contactTelephone"[^>]*type="tel"/);
  assert.equal(occurrences(html, 'autocomplete="off"'), 5);
});

test("ajout : Valider avec Nom et E-mail vides montre les deux erreurs et n'envoie rien", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  await valider(ecran);

  const html = champs(ecran);
  assert.ok(html.includes("Saisissez le nom du contact."));
  // Le message passe par l'echappement HTML : l'apostrophe y devient &#39;.
  assert.ok(html.includes("Saisissez l&#39;adresse e-mail du contact."));
  assert.equal(occurrences(html, '<span class="sr-only">Erreur :&nbsp;</span>'), 2, "« Erreur : » pour les lecteurs d'ecran, deux fois");
  assert.equal(occurrences(html, 'aria-invalid="true"'), 2);
  assert.equal(occurrences(html, "form-control is-invalid"), 2);
  assert.match(html, /id="contactNom"[^>]*aria-describedby="contactNomError"|aria-describedby="contactNomError"[^>]*id="contactNom"/);

  assert.equal(ecran.ecritures.length, 0, "rien n'est envoye a Grist");
  assert.ok(fenetre(ecran).includes('id="contactDialog"'), "la fenetre reste ouverte");
  assert.equal(actif(ecran), par(ecran, "contactNom"), "le focus va sur le premier champ en erreur");
  assert.equal(annonce(ecran), "");
});

test("ajout : des espaces seuls comptent comme vides", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  remplir(ecran, {Nom: "    ", Email: "   "});
  await valider(ecran);
  assert.ok(champs(ecran).includes("Saisissez le nom du contact."));
  assert.ok(champs(ecran).includes("Saisissez l&#39;adresse e-mail du contact."));
  assert.equal(ecran.ecritures.length, 0);
});

test("ajout : un e-mail mal forme affiche son erreur, garde la saisie et n'envoie rien", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  remplir(ecran, {Nom: "Dupontel", Prenom: "Lucie", Email: "pas-un-email"});
  await valider(ecran);

  const html = champs(ecran);
  assert.ok(html.includes("Saisissez une adresse e-mail valide, par exemple nom@exemple.fr."));
  assert.ok(!html.includes("Saisissez le nom du contact."), "le Nom, lui, est correct");
  assert.equal(occurrences(html, '<span class="sr-only">Erreur :&nbsp;</span>'), 1);
  assert.equal(occurrences(html, 'aria-invalid="true"'), 1);
  assert.ok(html.includes('value="pas-un-email"') && html.includes('value="Dupontel"') && html.includes('value="Lucie"'),
    "les valeurs saisies sont remises dans les champs");
  assert.equal(ecran.ecritures.length, 0);
  assert.equal(actif(ecran), par(ecran, "contactEmail"), "le focus va sur l'e-mail");
});

test("ajout : une saisie correcte ferme la fenetre, annonce la reussite et montre le contact", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  remplir(ecran, SAISIE_VALIDE);
  await valider(ecran);

  assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie");
  assert.deepEqual(ecran.ecritures[0], [["AddRecord", "Contacts", null, {Club: 7, ...SAISIE_VALIDE}]]);
  assert.equal(fenetre(ecran), "", "la fenetre est fermee");
  assert.ok(!ecran.w.document.body.classList.contains("modal-open"));
  assert.equal(annonce(ecran), "Le contact a bien été ajouté.");
  assert.ok(fiche(ecran).includes("Lucie Dupontel"), "la liste est relue : le nouveau contact y est");
  assert.equal(actif(ecran), par(ecran, "addContact"), "le focus va sur « Ajouter un contact »");
});

// =============================================================================
// Fenetre de modification
// =============================================================================

test("modification : les champs sont pre-remplis avec le contact choisi", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "edit", 1);
  const html = fenetre(ecran);

  assert.match(html, /<h2 class="modal-title" id="contactDialogTitle">Modification d'un contact<\/h2>/);
  for (const valeur of ["Martin", "Zoe", "zoe.martin@exemple.fr", "01 02 03 04 05", "Entraineuse"]) {
    assert.ok(html.includes(`value="${valeur}"`), `valeur « ${valeur} » pre-remplie`);
  }
  assert.match(html, /Club : Club fictif de Beauvais \(non modifiable\)/);
  assert.equal(actif(ecran), par(ecran, "contactNom"));
});

test("modification : les valeurs pre-remplies passent par l'echappement HTML", async () => {
  const hostile = {
    id: 5, Club: 7, Nom: '<b>"Dupont"</b>', Prenom: "L'ami", Email: "a@exemple.fr", Telephone: "<i>", Fonction: '" autofocus onfocus="x',
  };
  const ecran = await ouvrirFiche({contacts: [hostile]});
  await cliquerBouton(ecran, "edit", 5);
  const html = fenetre(ecran);

  assert.ok(html.includes('value="&lt;b&gt;&quot;Dupont&quot;&lt;/b&gt;"'));
  assert.ok(html.includes('value="L&#39;ami"'));
  assert.ok(html.includes('value="&lt;i&gt;"'));
  assert.ok(html.includes('value="&quot; autofocus onfocus=&quot;x"'));
  assert.ok(!html.includes('<b>"Dupont"'), "aucun HTML brut venu de la saisie");
  assert.ok(!html.includes('onfocus="x'), "l'attribut ne peut pas etre referme par la valeur");
});

test("modification : une saisie correcte envoie la mise a jour, ferme la fenetre et annonce la reussite", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "edit", 1);
  remplir(ecran, SAISIE_VALIDE);
  await valider(ecran);

  assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie");
  assert.deepEqual(ecran.ecritures[0], [["UpdateRecord", "Contacts", 1, SAISIE_VALIDE]]);
  assert.equal(fenetre(ecran), "");
  assert.equal(annonce(ecran), "Le contact a bien été modifié.");
  assert.equal(actif(ecran), ecran.boutons.get("edit:1"), "le focus revient sur le bouton Modifier du meme contact");
});

// =============================================================================
// Messages d'echec : un texte fixe par type, jamais le texte brut de l'erreur
// =============================================================================

const ECHECS_ENREGISTREMENT = [
  {
    type: "droits", erreur: `Blocked by table update access rules ${BRUT}`,
    texte: "Vous n'avez pas les droits pour ajouter ou modifier des contacts de ce club. Vos données n'ont pas été enregistrées. Rapprochez-vous de l'équipe qui gère le document.",
  },
  {
    type: "reseau", erreur: `Failed to fetch ${BRUT}`,
    texte: "L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez.",
  },
  {
    type: "autre", erreur: `quelque chose d'inattendu ${BRUT}`,
    texte: "L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez. Si le problème continue, vos droits ne permettent peut-être pas de modifier les contacts de ce club.",
  },
];

for (const cas of ECHECS_ENREGISTREMENT) {
  test(`message d'ajout, type '${cas.type}' : le bon texte, la fenetre reste ouverte, jamais le texte brut`, async () => {
    const ecran = await ouvrirFiche({ecriture: () => Promise.reject(new Error(cas.erreur))});
    await cliquer(ecran, "addContact");
    remplir(ecran, SAISIE_VALIDE);
    await valider(ecran);

    assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie avant d'echouer");
    assert.ok(messageVisible(ecran, "contactMessage"), "l'alerte est affichee");
    assert.equal(messageDe(ecran, "contactMessage"), cas.texte);
    assert.match(fenetre(ecran), /id="contactMessage" role="alert"/);
    assert.ok(fenetre(ecran).includes('id="contactDialog"'), "la fenetre reste ouverte");
    assert.ok(!fenetre(ecran).includes("SENTINELLE") && !messageDe(ecran, "contactMessage").includes("SENTINELLE"));
    assert.ok(!messageDe(ecran, "contactMessage").includes("exemple.fr"), "aucune valeur saisie dans le message");
    assert.equal(par(ecran, "submitContact").disabled, false, "Valider est de nouveau disponible");
    assert.equal(par(ecran, "submitContact").querySelector(".btn-content").textContent, "Valider");
    assert.equal(annonce(ecran), "", "pas d'annonce de reussite");
  });
}

test("message d'ajout / modification, type 'introuvable' : contact supprime entre-temps, rien n'est envoye", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "edit", 1);
  remplir(ecran, SAISIE_VALIDE);
  // Quelqu'un d'autre a supprime ce contact depuis l'ouverture de la fenetre.
  ecran.w.state.raw.Contacts = ecran.w.state.raw.Contacts.filter((contact) => contact.id !== 1);
  await valider(ecran);

  assert.equal(ecran.ecritures.length, 0, "aucune ecriture pour un contact introuvable");
  assert.ok(messageVisible(ecran, "contactMessage"));
  assert.equal(messageDe(ecran, "contactMessage"), "Ce contact n'existe plus. La liste va être actualisée.");
  assert.ok(fenetre(ecran).includes('id="contactDialog"'));
  assert.equal(par(ecran, "submitContact").disabled, false);
});

const ECHECS_SUPPRESSION = [
  {
    type: "droits", erreur: `Blocked by table update access rules ${BRUT}`,
    texte: "Vous n'avez pas les droits pour supprimer ce contact. Il n'a pas été supprimé.",
  },
  {
    type: "reseau", erreur: `Failed to fetch ${BRUT}`,
    texte: "La suppression n'a pas abouti. Vérifiez votre connexion puis réessayez.",
  },
  {
    type: "autre", erreur: `quelque chose d'inattendu ${BRUT}`,
    texte: "La suppression n'a pas abouti. Vérifiez votre connexion puis réessayez. Si le problème continue, vos droits ne permettent peut-être pas de supprimer les contacts de ce club.",
  },
];

for (const cas of ECHECS_SUPPRESSION) {
  test(`message de suppression, type '${cas.type}' : le bon texte dans la fenetre, jamais le texte brut`, async () => {
    const ecran = await ouvrirFiche({ecriture: () => Promise.reject(new Error(cas.erreur))});
    await cliquerBouton(ecran, "delete", 1);
    await cliquer(ecran, "confirmDeleteContact");

    assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie avant d'echouer");
    assert.deepEqual(ecran.ecritures[0], [["RemoveRecord", "Contacts", 1]]);
    assert.ok(messageVisible(ecran, "deleteContactMessage"));
    assert.equal(messageDe(ecran, "deleteContactMessage"), cas.texte);
    assert.match(fenetre(ecran), /id="deleteContactMessage" role="alert"/);
    assert.ok(fenetre(ecran).includes('id="deleteContactDialog"'), "la fenetre reste ouverte");
    assert.ok(!fenetre(ecran).includes("SENTINELLE") && !messageDe(ecran, "deleteContactMessage").includes("SENTINELLE"));
    assert.equal(par(ecran, "confirmDeleteContact").disabled, false);
    assert.equal(par(ecran, "confirmDeleteContact").querySelector(".btn-content").textContent, "Supprimer");
    assert.equal(actif(ecran), par(ecran, "cancelDeleteContact"), "apres un echec, le focus revient sur Annuler");
    assert.equal(annonce(ecran), "");
  });
}

test("message de suppression, type 'introuvable' : contact deja supprime, rien n'est envoye", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "delete", 1);
  ecran.w.state.raw.Contacts = ecran.w.state.raw.Contacts.filter((contact) => contact.id !== 1);
  await cliquer(ecran, "confirmDeleteContact");

  assert.equal(ecran.ecritures.length, 0);
  assert.ok(messageVisible(ecran, "deleteContactMessage"));
  assert.equal(messageDe(ecran, "deleteContactMessage"), "Ce contact n'existe plus. La liste va être actualisée.");
  assert.ok(fenetre(ecran).includes('id="deleteContactDialog"'));
});

// =============================================================================
// Suppression
// =============================================================================

test("suppression : la fenetre nomme le contact, dit que c'est definitif et met le focus sur Annuler", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "delete", 1);
  const html = fenetre(ecran);

  assert.match(html, /role="alertdialog" aria-modal="true"/);
  assert.match(html, /<h2 class="modal-title" id="deleteContactTitle">Suppression d'un contact<\/h2>/);
  assert.match(html, /Êtes-vous sûr de vouloir supprimer le contact <strong>Zoe Martin<\/strong> \? Cette suppression est définitive : le contact ne pourra pas être récupéré\./);
  assert.match(html, /id="cancelDeleteContact"><span class="btn-content">Annuler<\/span>/);
  assert.match(html, /btn-supprimer" id="confirmDeleteContact"><span class="btn-content">Supprimer<\/span>/);
  assert.equal(actif(ecran), par(ecran, "cancelDeleteContact"));
  assert.ok(ecran.w.document.body.classList.contains("modal-open"));
  assert.equal(ecran.ecritures.length, 0, "ouvrir la fenetre n'envoie rien");
});

test("suppression : le nom du contact est echappe, et un contact sans nom devient « Contact sans nom »", async () => {
  const hostile = {...ZOE, Prenom: "", Nom: '<img src=x onerror="alert(1)">'};
  const sansNom = {...ALEX, Prenom: "", Nom: ""};
  const ecran = await ouvrirFiche({contacts: [hostile, sansNom]});

  await cliquerBouton(ecran, "delete", 1);
  assert.ok(!fenetre(ecran).includes("<img src=x"));
  assert.ok(fenetre(ecran).includes("<strong>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</strong>"));
  await touche(ecran, "Escape");

  await cliquerBouton(ecran, "delete", 2);
  assert.ok(fenetre(ecran).includes("<strong>Contact sans nom</strong>"));
});

test("suppression : Annuler ferme la fenetre sans rien supprimer", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "delete", 1);
  await cliquer(ecran, "cancelDeleteContact");

  assert.equal(ecran.ecritures.length, 0, "aucune suppression envoyee");
  assert.equal(fenetre(ecran), "");
  assert.ok(!ecran.w.document.body.classList.contains("modal-open"));
  assert.equal(annonce(ecran), "");
  assert.ok(ecran.w.state.raw.Contacts.some((contact) => contact.id === 1), "le contact est toujours la");
  assert.equal(actif(ecran), ecran.boutons.get("delete:1"), "le focus revient sur le bouton qui avait ouvert la fenetre");
});

test("suppression : Supprimer envoie la suppression, annonce la reussite et retire le contact de la liste", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "delete", 1);
  await cliquer(ecran, "confirmDeleteContact");

  assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie");
  assert.deepEqual(ecran.ecritures[0], [["RemoveRecord", "Contacts", 1]]);
  assert.equal(fenetre(ecran), "");
  assert.equal(annonce(ecran), "Le contact a bien été supprimé.");
  assert.ok(!fiche(ecran).includes("Zoe Martin"), "la liste est relue : le contact a disparu");
  assert.ok(fiche(ecran).includes("Alex Bernard"), "les autres contacts restent");
  assert.equal(actif(ecran), par(ecran, "addContact"), "le focus va sur « Ajouter un contact »");
});

// =============================================================================
// Clavier
// =============================================================================

test("clavier : Echap ferme la fenetre d'ajout sans rien enregistrer", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  remplir(ecran, SAISIE_VALIDE);
  await touche(ecran, "Escape");

  assert.equal(ecran.ecritures.length, 0);
  assert.equal(fenetre(ecran), "");
  assert.ok(!ecran.w.document.body.classList.contains("modal-open"));
  assert.equal(annonce(ecran), "");
  assert.equal(actif(ecran), par(ecran, "addContact"), "le focus revient sur le bouton d'ouverture");
  assert.equal(ecran.clavier.keydown.size, 0, "le clavier n'est plus ecoute une fois la fenetre fermee");
});

test("clavier : Echap ferme la fenetre de modification sans rien enregistrer", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "edit", 1);
  remplir(ecran, SAISIE_VALIDE);
  await touche(ecran, "Escape");

  assert.equal(ecran.ecritures.length, 0);
  assert.equal(fenetre(ecran), "");
  assert.equal(actif(ecran), ecran.boutons.get("edit:1"));
});

test("clavier : Echap annule la fenetre de suppression sans rien supprimer", async () => {
  const ecran = await ouvrirFiche();
  await cliquerBouton(ecran, "delete", 1);
  await touche(ecran, "Escape");

  assert.equal(ecran.ecritures.length, 0);
  assert.equal(fenetre(ecran), "");
  assert.ok(ecran.w.state.raw.Contacts.some((contact) => contact.id === 1));
});

test("clavier : une autre touche ne ferme pas la fenetre", async () => {
  const ecran = await ouvrirFiche();
  await cliquer(ecran, "addContact");
  await touche(ecran, "a");
  assert.ok(fenetre(ecran).includes('id="contactDialog"'));
});

test("pendant l'envoi d'un ajout, Echap et Annuler sont ignores", async () => {
  const envoi = attente();
  const ecran = await ouvrirFiche({ecriture: () => envoi.promesse});
  await cliquer(ecran, "addContact");
  remplir(ecran, SAISIE_VALIDE);
  const soumission = valider(ecran);

  assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie");
  assert.equal(par(ecran, "submitContact").disabled, true, "Valider est desactive pendant l'envoi");
  assert.equal(par(ecran, "submitContact").querySelector(".btn-content").textContent, "Enregistrement en cours…");

  await touche(ecran, "Escape");
  await cliquer(ecran, "cancelContact");
  assert.ok(fenetre(ecran).includes('id="contactDialog"'), "la fenetre est toujours ouverte");

  // Un second envoi pendant l'attente n'envoie rien de plus.
  await valider(ecran);
  assert.equal(ecran.ecritures.length, 1);

  envoi.terminer();
  await soumission;
  assert.equal(fenetre(ecran), "", "une fois l'envoi fini, la fenetre se ferme");
  assert.equal(annonce(ecran), "Le contact a bien été ajouté.");
  assert.equal(ecran.ecritures.length, 1);
});

test("pendant l'envoi d'une suppression, Echap et Annuler sont ignores", async () => {
  const envoi = attente();
  const ecran = await ouvrirFiche({ecriture: () => envoi.promesse});
  await cliquerBouton(ecran, "delete", 1);
  const confirmation = cliquer(ecran, "confirmDeleteContact");

  assert.equal(ecran.ecritures.length, 1, "l'ecriture est bien partie");
  assert.equal(par(ecran, "confirmDeleteContact").disabled, true);
  assert.equal(par(ecran, "confirmDeleteContact").querySelector(".btn-content").textContent, "Suppression en cours…");

  await touche(ecran, "Escape");
  await cliquer(ecran, "cancelDeleteContact");
  assert.ok(fenetre(ecran).includes('id="deleteContactDialog"'), "la fenetre est toujours ouverte");

  await cliquer(ecran, "confirmDeleteContact");
  assert.equal(ecran.ecritures.length, 1, "pas de seconde suppression");

  envoi.terminer();
  await confirmation;
  assert.equal(fenetre(ecran), "");
  assert.equal(annonce(ecran), "Le contact a bien été supprimé.");
  assert.equal(ecran.ecritures.length, 1);
});
