"use strict";

// Bloc « Convention » de la fiche d'action (taches 4.2 et 5.1a) : textes des cinq
// etats, date en francais, boutons et message de blocage (seulement a l'etat
// A generer), noms de classes. Le detail du bouton, du message et de la fenetre
// est dans test/convention-fenetre.test.js.
// Les textes de reference sont ceux de docs/ux/convention.md. Ils sont recopies
// ici en dur : si le code change un mot, le test doit echouer.
// Donnees fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadWidget} = require("./helpers/widget");

const CSS = fs.readFileSync(
  path.join(__dirname, "..", "src", "actions-dashboard", "style.css"), "utf8");

// Midi UTC : la date affichee reste la meme dans tous les fuseaux horaires.
const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;
const GENEREE_LE = secondes(2026, 3, 14);
const DEPOSEE_LE = secondes(2026, 11, 27);

const TEXTES = {
  aGenerer: "Aucune convention générée.",
  sansModele: "Pas encore de modèle de convention pour ce dispositif.",
  droits: "Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord.",
  aide: "Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé.",
};

const PDF = ["L", 41];

// Jeu d'essai : une action complete (agence, club, dispositif, adresse du club)
// et un modele actif pour son dispositif. Chaque test ne change que ce qui l'interesse.
function donnees({action = {}, structure = {}, conventions = [], modeles, refusees = []} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3, ...action}],
      Structures: [{
        id: 7, Nom: "Club Exemple", Adresse: "1 rue Exemple",
        Code_postal: "75001", Ville: "Exemple-sur-Mer", ...structure,
      }],
      Modeles_convention: modeles || [{id: 10, Dispositif: 3, Actif: true}],
      Conventions: conventions,
    },
    tablesRefusees: refusees,
  };
}

const convention = (champs) => ({id: 20, Action: 1, ...champs});

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Le bloc seul, de sa balise ouvrante a la fin de sa section.
function extraireBloc(html) {
  const debut = html.indexOf('<section class="edit-card" id="conventionBloc">');
  assert.notEqual(debut, -1, "le bloc Convention est present");
  return html.slice(debut, html.indexOf("</section>", debut) + "</section>".length);
}

// Les phrases du bloc, dans l'ordre, avec leur classe : [{texte, classe}].
function phrases(bloc) {
  return [...bloc.matchAll(/<p(?: class="([^"]*)")?>([\s\S]*?)<\/p>/g)]
    .map((m) => ({texte: decoder(m[2]), classe: m[1] || ""}));
}

function textes(bloc) {
  return phrases(bloc).map((p) => p.texte);
}

function classesDe(bloc) {
  const trouvees = new Set();
  for (const m of bloc.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((c) => trouvees.add(c));
  return trouvees;
}

const blocPour = (w, jeu) => w.conventionBlocHtml(1, jeu);

// ---------------------------------------------------------------------------
// 1. Le texte exact de chacun des cinq etats
// ---------------------------------------------------------------------------

// Echoue si le texte « Aucune convention générée. » change d'un mot ou si l'etat
// A generer affiche une autre phrase (ou une phrase de plus).
test("état À générer : « Aucune convention générée. », seule", () => {
  const w = loadWidget();
  assert.deepEqual(textes(blocPour(w, donnees())), [TEXTES.aGenerer]);
});

// Echoue si la phrase de l'etat Generee change, si la date est mal placee ou si
// la phrase d'aide disparait ou passe avant la date.
test("état Générée : la phrase avec la date, puis la phrase d'aide, dans cet ordre", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});
  assert.deepEqual(textes(blocPour(w, jeu)), [
    "Convention générée le 14/03/2026.",
    TEXTES.aide,
  ]);
});

// Echoue si la phrase d'aide perd sa classe convention-aide (elle ne se distinguerait
// plus de la phrase d'etat) ou si la phrase d'etat la prend.
test("état Générée : seule la phrase d'aide porte la classe convention-aide", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});
  const [etat, aide] = phrases(blocPour(w, jeu));
  assert.equal(etat.classe, "");
  assert.equal(aide.classe, "convention-aide");
});

// Echoue si l'etat Signee affiche une phrase d'aide, une autre formule, ou la date
// de generation au lieu de la date de depot.
test("état Signée : « Convention signée, déposée le … », sans phrase d'aide", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({
    PDF_genere: PDF, PDF_signe: PDF, Date_generation: GENEREE_LE, Date_depot: DEPOSEE_LE,
  })]});
  assert.deepEqual(textes(blocPour(w, jeu)), ["Convention signée, déposée le 27/11/2026."]);
});

// Echoue si l'etat Sans modele change de texte ou affiche autre chose en plus.
test("état Sans modèle : « Pas encore de modèle de convention pour ce dispositif. »", () => {
  const w = loadWidget();
  const jeu = donnees({modeles: []});
  assert.deepEqual(textes(blocPour(w, jeu)), [TEXTES.sansModele]);
});

// Echoue si le texte de l'etat Droits insuffisants change (il doit rester mot pour
// mot celui de la note UX, apostrophes comprises).
test("état Droits insuffisants : la phrase de la note UX, quand Conventions est refusée", () => {
  const w = loadWidget();
  assert.deepEqual(textes(blocPour(w, donnees({refusees: ["Conventions"]}))), [TEXTES.droits]);
});

// Echoue si le refus de Modeles_convention n'est plus pris en compte : l'etat Droits
// insuffisants vaut pour l'une ou l'autre des deux tables.
test("état Droits insuffisants aussi quand Modeles_convention est refusée", () => {
  const w = loadWidget();
  assert.deepEqual(textes(blocPour(w, donnees({refusees: ["Modeles_convention"]}))), [TEXTES.droits]);
});

// Echoue si « Droits insuffisants » cesse de l'emporter : une convention signee,
// lue avant le refus, ne doit ni afficher sa date ni son etat.
test("Droits insuffisants l'emporte sur une convention signée présente dans les données", () => {
  const w = loadWidget();
  const jeu = donnees({
    refusees: ["Conventions"],
    conventions: [convention({PDF_signe: PDF, Date_depot: DEPOSEE_LE})],
  });
  const html = blocPour(w, jeu);
  assert.deepEqual(textes(html), [TEXTES.droits]);
  assert.ok(!html.includes("27/11/2026"), "aucune date n'est montree");
});

// Echoue si une table refusee SANS rapport avec la convention (ex. DR) declenche
// l'etat Droits insuffisants.
test("le refus d'une autre table ne donne pas l'état Droits insuffisants", () => {
  const w = loadWidget();
  assert.deepEqual(textes(blocPour(w, donnees({refusees: ["DR"]}))), [TEXTES.aGenerer]);
});

// ---------------------------------------------------------------------------
// 2. La date en francais, a partir d'une valeur au format de Grist
// ---------------------------------------------------------------------------

// Echoue si la date passe au format anglais (03/14/2026, impossible ici), ISO
// (2026-03-14), ou perd ses zeros (jour 05 / mois 03).
test("la date s'affiche en jour/mois/année avec les zéros, à partir de secondes Grist", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({PDF_genere: PDF, Date_generation: secondes(2026, 3, 5)})]});
  assert.equal(textes(blocPour(w, jeu))[0], "Convention générée le 05/03/2026.");
});

// Echoue si l'etat Generee lit la colonne Date_depot au lieu de Date_generation.
test("état Générée : la date vient de Date_generation, pas de Date_depot", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({
    PDF_genere: PDF, Date_generation: GENEREE_LE, Date_depot: DEPOSEE_LE,
  })]});
  const [etat] = textes(blocPour(w, jeu));
  assert.ok(etat.includes("14/03/2026") && !etat.includes("27/11/2026"), etat);
});

// Echoue si l'etat Signee lit la colonne Date_generation au lieu de Date_depot.
test("état Signée : la date vient de Date_depot, pas de Date_generation", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({
    PDF_genere: PDF, PDF_signe: PDF, Date_generation: GENEREE_LE, Date_depot: DEPOSEE_LE,
  })]});
  const [etat] = textes(blocPour(w, jeu));
  assert.ok(etat.includes("27/11/2026") && !etat.includes("14/03/2026"), etat);
});

// ---------------------------------------------------------------------------
// 3. Date vide
// ---------------------------------------------------------------------------

// Echoue si la date vide (null, 0, texte vide ou absente) laisse « le . » ou
// « le undefined » / « le 01/01/1970 » dans la phrase.
test("état Générée sans date : « Convention générée. » puis la phrase d'aide", () => {
  const w = loadWidget();
  for (const vide of [null, 0, "", undefined]) {
    const champs = {PDF_genere: PDF};
    if (vide !== undefined) champs.Date_generation = vide;
    const jeu = donnees({conventions: [convention(champs)]});
    assert.deepEqual(textes(blocPour(w, jeu)), ["Convention générée.", TEXTES.aide], `date vide : ${String(vide)}`);
  }
});

// Echoue si l'etat Signee sans date affiche autre chose que « Convention signée. ».
test("état Signée sans date : « Convention signée. »", () => {
  const w = loadWidget();
  for (const vide of [null, 0, "", undefined]) {
    const champs = {PDF_genere: PDF, PDF_signe: PDF, Date_generation: GENEREE_LE};
    if (vide !== undefined) champs.Date_depot = vide;
    const jeu = donnees({conventions: [convention(champs)]});
    assert.deepEqual(textes(blocPour(w, jeu)), ["Convention signée."], `date vide : ${String(vide)}`);
  }
});

// ---------------------------------------------------------------------------
// 4. PDF genere ET PDF signe : l'etat Signee l'emporte
// ---------------------------------------------------------------------------

// Echoue si l'ordre des etats s'inverse (Generee testee avant Signee) : on
// verrait alors « Convention générée le … » et la phrase d'aide.
test("une action avec un PDF généré et un PDF signé est à l'état Signée", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({
    PDF_genere: PDF, PDF_signe: PDF, Date_generation: GENEREE_LE, Date_depot: DEPOSEE_LE,
  })]});
  const bloc = blocPour(w, jeu);
  assert.deepEqual(textes(bloc), ["Convention signée, déposée le 27/11/2026."]);
  assert.ok(!bloc.includes(TEXTES.aide) && !bloc.includes("générée le"), "rien de l'état Générée");
});

// ---------------------------------------------------------------------------
// 5. Boutons et elements cliquables : un seul bouton, a l'etat A generer
// ---------------------------------------------------------------------------

const ETATS_A_TESTER = {
  "À générer": () => donnees(),
  "Générée": () => donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}),
  "Signée": () => donnees({conventions: [convention({PDF_genere: PDF, PDF_signe: PDF, Date_depot: DEPOSEE_LE})]}),
  "Sans modèle": () => donnees({modeles: []}),
  "Droits insuffisants": () => donnees({refusees: ["Conventions"]}),
};

// Echoue si le bloc contient un lien, un champ, un menu ou un gestionnaire en
// ligne dans l'un des cinq etats, un bouton ailleurs qu'a l'etat A generer, ou
// un deuxieme bouton a cet etat (sa tache n'en prevoit qu'un).
test("le bloc n'a de bouton qu'à l'état À générer (un seul) et aucun autre élément interactif, dans les cinq états", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const bloc = blocPour(w, fabrique());
    assert.ok(!/<(a|input|select|textarea|details|summary|label|form|dialog)\b/i.test(bloc), `${nom} : élément interactif autre qu'un bouton`);
    assert.ok(!/\son[a-z]+\s*=/i.test(bloc), `${nom} : gestionnaire d'événement en ligne`);
    assert.ok(!/\s(href|tabindex|data-[\w-]+)\s*=/i.test(bloc), `${nom} : attribut de clic ou de navigation`);
    const boutons = bloc.match(/<button\b[^>]*>/gi) || [];
    if (nom === "À générer") {
      assert.equal(boutons.length, 1, `${nom} : un seul bouton`);
      assert.match(boutons[0], /\sid="conventionGenerer"/, `${nom} : le bouton est « Générer la convention »`);
    } else {
      assert.equal(boutons.length, 0, `${nom} : aucun bouton`);
      assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(bloc), `${nom} : attribut d'accessibilité interactive`);
    }
  }
});

// Tout ce qu'on peut lire dans le bloc : le texte de toutes les balises (boutons et
// texte cache compris) et les attributs qui portent un libelle. Contrairement a
// textes(), qui ne lit que les <p>, aucun bouton ni attribut n'y echappe.
function contenuLisible(bloc) {
  const attributs = [...bloc.matchAll(/\s(?:aria-label|title|alt|value)="([^"]*)"/g)].map((m) => m[1]);
  return decoder([bloc.replace(/<[^>]*>/g, " "), ...attributs].join(" ")).replace(/\s+/g, " ");
}

// Echoue si un libelle de bouton de la note UX (re-generer, voir, deposer, remplacer,
// enregistrer) apparait n'importe ou dans le bloc (texte d'un bouton, texte cache,
// attribut aria-label ou title), si « Générer la convention » apparait ailleurs qu'a
// l'etat A generer (grise ou non), ou s'il n'y est pas une seule fois, dans son bouton.
test("le bloc ne contient aucun libellé de bouton de la note UX, sauf « Générer la convention » dans son bouton à l'état À générer", () => {
  const w = loadWidget();
  const libelles = ["Générer la convention", "Re-générer", "Voir la convention", "Déposer", "Remplacer le fichier", "Enregistrer"];
  const etats = {...ETATS_A_TESTER, "À générer, agence manquante": () => donnees({action: {Agence: 0}})};
  for (const [nom, fabrique] of Object.entries(etats)) {
    const lu = contenuLisible(blocPour(w, fabrique()));
    for (const libelle of libelles) {
      const attendu = nom.startsWith("À générer") && libelle === "Générer la convention" ? 1 : 0;
      assert.equal(lu.split(libelle).length - 1, attendu, `${nom} : « ${libelle} » (${attendu} attendu)`);
    }
  }
  assert.match(blocPour(w, donnees()),
    /<button\b[^>]*\sid="conventionGenerer"[^>]*>\s*<span class="btn-content">Générer la convention<\/span>\s*<\/button>/,
    "à l'état À générer, le libellé est dans le bouton");
});

// Echoue si le bloc contient autre chose que des phrases (<p>) et, a l'etat A generer
// seulement, un bouton : le retrait des phrases ne laisse que des conteneurs.
test("le bloc ne contient que des phrases (et, à l'état À générer, un bouton) : en retirant les <p>, il ne reste aucune autre balise de contenu", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const sansPhrases = blocPour(w, fabrique()).replace(/<p\b[^>]*>[\s\S]*?<\/p>/g, "");
    const balises = [...sansPhrases.matchAll(/<([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase());
    const permises = nom === "À générer" ? ["section", "div", "span", "button"] : ["section", "div", "span"];
    assert.deepEqual(balises.filter((b) => !permises.includes(b)), [], nom);
  }
});

// ---------------------------------------------------------------------------
// 6. Message de blocage : seulement a l'etat A generer, quand un element manque
// ---------------------------------------------------------------------------

const MANQUES = {
  "adresse du club": {structure: {Adresse: "", Code_postal: "", Ville: ""}},
  "agence": {action: {Agence: 0}},
  "club": {action: {Club: 0}},
};

// Echoue si, a l'etat A generer, le message de blocage (« Renseignez… », texte cache,
// region #conventionBlocage) manque quand l'adresse du club, l'agence ou le club manque ;
// ou si l'un des quatre autres etats l'affiche malgre un element manquant (ici l'agence).
// Le test verifie d'abord que conventionBlocage voit bien le manque, sinon il ne prouverait rien.
test("le message de blocage n'apparaît qu'à l'état À générer, quand il manque l'adresse du club, l'agence ou le club", () => {
  const w = loadWidget();
  for (const [manque, variante] of Object.entries(MANQUES)) {
    const jeu = donnees(variante);
    assert.notEqual(w.conventionBlocage(1, jeu), null, `${manque} : le jeu d'essai doit bloquer la génération`);
    const html = blocPour(w, jeu);
    assert.ok(/Renseignez/.test(html), `${manque} : message « Renseignez… » attendu`);
    assert.ok(/impossible à générer/.test(html), `${manque} : texte caché de blocage attendu`);
    assert.ok(/id="conventionBlocage"/.test(html), `${manque} : région de blocage attendue`);
    assert.deepEqual(textes(html), [TEXTES.aGenerer], `${manque} : l'état reste « À générer »`);
  }

  const AUTRES_ETATS = {
    "Générée": {conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]},
    "Signée": {conventions: [convention({PDF_genere: PDF, PDF_signe: PDF, Date_depot: DEPOSEE_LE})]},
    "Sans modèle": {modeles: []},
    "Droits insuffisants": {refusees: ["Conventions"]},
  };
  for (const [nom, variante] of Object.entries(AUTRES_ETATS)) {
    const jeu = donnees({...variante, action: {Agence: 0}});
    assert.notEqual(w.conventionBlocage(1, jeu), null, `${nom} : le jeu d'essai doit bloquer la génération`);
    const html = blocPour(w, jeu);
    assert.ok(!/Renseignez/.test(html), `${nom} : message « Renseignez… »`);
    assert.ok(!/impossible à générer/.test(html), `${nom} : texte caché de blocage`);
    assert.ok(!/conventionBlocage/.test(html), `${nom} : région de blocage`);
  }
});

// Echoue si le message de blocage s'affiche aussi a l'etat Generee (la note le
// prevoit pour « Re-générer ») ou si le dispositif manquant en fait apparaitre un.
test("aucun message de blocage à l'état Générée ni sans dispositif", () => {
  const w = loadWidget();
  const generee = donnees({
    structure: {Adresse: "", Code_postal: "", Ville: ""},
    conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})],
  });
  assert.notEqual(w.conventionBlocage(1, generee), null);
  assert.deepEqual(textes(blocPour(w, generee)), ["Convention générée le 14/03/2026.", TEXTES.aide]);

  const sansDispositif = donnees({action: {Dispositif: 0}});
  assert.notEqual(w.conventionBlocage(1, sansDispositif), null);
  const html = blocPour(w, sansDispositif);
  assert.ok(!/Renseignez/.test(html));
  assert.deepEqual(textes(html), [TEXTES.sansModele]);
});

// ---------------------------------------------------------------------------
// 7. Noms de classes
// ---------------------------------------------------------------------------

const CLASSES_AUTORISEES = new Set(["edit-card", "section-head", "edit-fields", "convention-fields", "convention-aide"]);

// Classes de plus, permises seulement a l'etat A generer (bouton, rangee du bouton,
// message de blocage et son texte cache) : classes du design system ou du widget.
const CLASSES_A_GENERER = ["convention-actions", "btn", "btn-secondary", "btn-content", "help-block", "sr-only"];

// Echoue si le bloc utilise une classe hors liste : classe inventee, classe de couleur,
// ou classe du bouton / du message de blocage dans un etat autre que A generer.
test("le bloc n'utilise que les classes autorisées, dans les cinq états (et avec un message de blocage)", () => {
  const w = loadWidget();
  const jeux = [
    ...Object.entries(ETATS_A_TESTER).map(([nom, fabrique]) => [nom, fabrique()]),
    ["À générer, agence manquante", donnees({action: {Agence: 0}})],
  ];
  for (const [nom, jeu] of jeux) {
    const permises = nom.startsWith("À générer")
      ? new Set([...CLASSES_AUTORISEES, ...CLASSES_A_GENERER])
      : CLASSES_AUTORISEES;
    const inconnues = [...classesDe(blocPour(w, jeu))].filter((c) => !permises.has(c));
    assert.deepEqual(inconnues, [], `${nom} : classes non prévues`);
  }
});

// Echoue si le bloc perd sa structure commune aux autres blocs de la fiche
// (edit-card, section-head, edit-fields) ou la classe convention-fields.
test("le bloc reprend la structure des autres blocs de la fiche", () => {
  const w = loadWidget();
  const classes = classesDe(blocPour(w, donnees()));
  for (const nom of ["edit-card", "section-head", "edit-fields", "convention-fields"]) {
    assert.ok(classes.has(nom), `classe ${nom} attendue`);
  }
});

// Echoue si convention-aide est posee hors de la phrase d'aide : seul l'etat
// Generee a une phrase d'aide.
test("convention-aide n'apparaît qu'à l'état Générée", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const present = classesDe(blocPour(w, fabrique())).has("convention-aide");
    assert.equal(present, nom === "Générée", nom);
  }
});

// Echoue si convention-fields ou convention-aide n'est plus declaree dans
// style.css (le bloc s'afficherait sans mise en forme).
test("style.css déclare convention-fields et convention-aide", () => {
  for (const nom of ["convention-fields", "convention-aide"]) {
    assert.match(CSS, new RegExp(`\\.${nom}(?![\\w-])`), `.${nom} doit exister dans la feuille`);
  }
});

// ---------------------------------------------------------------------------
// Dans la fiche : renderEdit place bien le bloc
// ---------------------------------------------------------------------------

function fiche(jeu) {
  const w = loadWidget();
  const raw = {
    Cofinancements: [], Agences: [{id: 5, Libelle_agence: "Agence Exemple"}], DD: [], DR: [],
    Dispositifs: [{id: 3, Dispositif: "Dispositif Exemple"}], Federations: [], Financements: [],
    Financeurs: [], Reponses_AAP: [], Contacts: [],
    ...jeu.raw,
  };
  w.state.raw = raw;
  w.state.tablesRefusees = jeu.tablesRefusees;
  w.state.actions = w.buildActions(raw);
  w.state.editingId = 1;
  w.state.view = "edit";
  w.renderEdit();
  return w.elements.get("editView").innerHTML;
}

// Echoue si renderEdit n'appelle plus conventionBlocHtml, ou l'appelle sans
// state (l'etat « Droits insuffisants » ne s'afficherait jamais dans la fiche).
test("la fiche contient le bloc Convention, une seule fois, avec l'état issu de state.tablesRefusees", () => {
  const html = fiche(donnees({refusees: ["Conventions"]}));
  assert.equal(html.split('id="conventionBloc"').length - 1, 1);
  assert.deepEqual(textes(extraireBloc(html)), [TEXTES.droits]);
});

// Echoue si le bloc sort du formulaire ou passe avant Statut et Financement :
// la note UX le place en bas de la fiche, apres ces deux blocs.
test("le bloc est en bas de la fiche, après Statut et Financement, dans le formulaire", () => {
  const html = fiche(donnees());
  const bloc = html.indexOf('id="conventionBloc"');
  assert.ok(bloc > html.indexOf("<span>Statut</span>"), "après Statut");
  assert.ok(bloc > html.indexOf("<span>Financement</span>"), "après Financement");
  assert.ok(bloc < html.indexOf("</form>"), "dans le formulaire");
});

// Echoue si le bloc de la fiche affiche un autre texte que celui calcule pour
// l'action ouverte (ex. mauvais identifiant d'action transmis).
test("la fiche affiche l'état de l'action ouverte", () => {
  const html = fiche(donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}));
  assert.deepEqual(textes(extraireBloc(html)), ["Convention générée le 14/03/2026.", TEXTES.aide]);
});
