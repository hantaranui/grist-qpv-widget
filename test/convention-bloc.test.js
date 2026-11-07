"use strict";

// Bloc « Convention » de la fiche d'action (taches 4.2 et 5.1a, mis a jour pour l'Evolution 3 :
// docs/ux/convention.md, §15.3 a §15.8) : textes des cinq etats, date en francais, boutons (dont
// « Telecharger la convention » a la place de « Voir la convention » et « Deposer la convention
// signee » visible en permanence sauf a l'etat Droits insuffisants), ligne « Format : … » (plus de phrase d'aide à l'état Générée, E3-26/E3-29)
// selon le format du document genere, message de blocage (aux etats A generer et Generee), noms de classes.
// Le detail du bouton, du message et de la fenetre est dans test/convention-fenetre.test.js ; le
// telechargement dans test/convention-telecharger.test.js ; le depot dans test/convention-deposer.test.js.
// Les textes de reference sont ceux de docs/ux/convention.md. Ils sont recopies
// ici en dur : si le code change un mot, le test doit echouer.
// Donnees fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadWidget} = require("./helpers/widget");
const {fixerFormat} = require("./helpers/docx");

const CSS = fs.readFileSync(
  path.join(__dirname, "..", "src", "actions-dashboard", "style.css"), "utf8");
const CSS_SANS_COMMENTAIRES = CSS.replace(/\/\*[\s\S]*?\*\//g, "");

// Midi UTC : la date affichee reste la meme dans tous les fuseaux horaires.
const secondes = (annee, mois, jour) => Date.UTC(annee, mois - 1, jour, 12, 0, 0) / 1000;
const GENEREE_LE = secondes(2026, 3, 14);
const DEPOSEE_LE = secondes(2026, 11, 27);

const TEXTES = {
  aGenerer: "Aucune convention générée.",
  sansModele: "Pas encore de modèle de convention pour ce dispositif.",
  droits: "Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord.",
  formatWord: "Format : document Word (.docx).",
  formatPdf: "Format : document PDF (.pdf).",
};

// E3-26 et E3-29 : plus aucune phrase d'aide a l'etat Generee (Word comme ancien PDF). Ces trois phrases, recopiees en dur,
// ne doivent plus apparaitre nulle part dans le bloc : si l'une revient, les tests ci-dessous echouent.
const PHRASES_AIDE_RETIREES = [
  "Téléchargez la convention, modifiez-la si besoin dans Word, imprimez-la, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé au format PDF.",
  "Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé.",
];
const sansPhraseAide = (html, contexte) => {
  const lu = decoder(html);
  for (const phrase of PHRASES_AIDE_RETIREES) assert.ok(!lu.includes(phrase), `${contexte} : la phrase d'aide « ${phrase.slice(0, 25)}… » est retirée`);
  assert.ok(!lu.includes("convention-aide"), `${contexte} : plus de classe convention-aide`);
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

// La zone de message du bloc (7.2b) : toujours presente, vide, jamais refaite apres une generation.
const ZONE_MESSAGE_VIDE = '<div class="convention-alerte" id="conventionAlerte" role="status"></div>';

// ---------------------------------------------------------------------------
// 1. Le texte exact de chacun des cinq etats
// ---------------------------------------------------------------------------

// Echoue si le texte « Aucune convention générée. » change d'un mot ou si l'etat
// A generer affiche une autre phrase (ou une phrase de plus).
test("état À générer : « Aucune convention générée. », seule", () => {
  const w = loadWidget();
  assert.deepEqual(textes(blocPour(w, donnees())), [TEXTES.aGenerer]);
});

// Echoue si la phrase de l'etat Generee change ou si la date est mal placee ; si une phrase d'aide revient apres elle
// (E3-26/E3-29 : plus d'aide a l'etat Generee) ; ou si la phrase d'etat prend une classe (convention-aide, help-block).
test("état Générée : la seule phrase est celle avec la date, sans phrase d'aide ni classe", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});
  const bloc = blocPour(w, jeu);
  assert.deepEqual(phrases(bloc), [{texte: "Convention générée le 14/03/2026.", classe: ""}]);
  sansPhraseAide(bloc, "format inconnu");
});

// Echoue si, une fois le format du document genere connu (apres une generation ou un « Telecharger la
// convention », E3-20 C), le bloc n'affiche pas exactement, dans cet ordre : la phrase d'etat (sans classe), puis la
// ligne « Format : document Word (.docx). » (ou « … PDF (.pdf). », classe help-block) ; ou si une phrase d'aide
// (Word ou ancien PDF) revient apres la ligne « Format » (E3-26/E3-29).
test("état Générée, format connu : phrase d'état puis ligne « Format : … », rien d'autre (Word ou ancien PDF)", () => {
  const cas = [
    ["docx", TEXTES.formatWord],
    ["pdf", TEXTES.formatPdf],
  ];
  for (const [format, ligneFormat] of cas) {
    const w = loadWidget();
    fixerFormat(w, 20, format);
    const jeu = donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});
    const bloc = blocPour(w, jeu);
    assert.deepEqual(phrases(bloc), [
      {texte: "Convention générée le 14/03/2026.", classe: ""},
      {texte: ligneFormat, classe: "help-block"},
    ], `format ${format}`);
    sansPhraseAide(bloc, `format ${format}`);
  }
});

// Echoue si un format inconnu fait afficher une ligne « Format : … » devinee (E3-20 C : la ligne n'apparait
// qu'apres un clic ou une generation dans la session), ou si la ligne « Format » apparait a un autre etat que
// Generee (le fichier signe est toujours un PDF, E3-8 : pas de ligne a l'etat Signee).
test("la ligne « Format : … » n'apparaît ni quand le format est inconnu, ni à un autre état que Générée", () => {
  const w = loadWidget();
  const inconnu = textes(blocPour(w, donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]})));
  assert.ok(!inconnu.some((t) => t.startsWith("Format :")), "format inconnu : pas de ligne « Format »");
  fixerFormat(w, 20, "docx");
  for (const [nom, jeu] of Object.entries({
    "Signée": donnees({conventions: [convention({PDF_genere: PDF, PDF_signe: PDF, Date_depot: DEPOSEE_LE})]}),
    "À générer": donnees(),
    "Sans modèle": donnees({modeles: []}),
  })) {
    assert.ok(!contenuLisible(blocPour(w, jeu)).includes("Format :"), `${nom} : pas de ligne « Format »`);
  }
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
// « le undefined » / « le 01/01/1970 » dans la phrase, ou si une phrase d'aide s'ajoute apres « Convention générée. ».
test("état Générée sans date : « Convention générée. », seule", () => {
  const w = loadWidget();
  for (const vide of [null, 0, "", undefined]) {
    const champs = {PDF_genere: PDF};
    if (vide !== undefined) champs.Date_generation = vide;
    const jeu = donnees({conventions: [convention(champs)]});
    assert.deepEqual(textes(blocPour(w, jeu)), ["Convention générée."], `date vide : ${String(vide)}`);
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
// verrait alors « Convention générée le … ».
test("une action avec un PDF généré et un PDF signé est à l'état Signée", () => {
  const w = loadWidget();
  const jeu = donnees({conventions: [convention({
    PDF_genere: PDF, PDF_signe: PDF, Date_generation: GENEREE_LE, Date_depot: DEPOSEE_LE,
  })]});
  const bloc = blocPour(w, jeu);
  assert.deepEqual(textes(bloc), ["Convention signée, déposée le 27/11/2026."]);
  sansPhraseAide(bloc, "Signée");
  assert.ok(!bloc.includes("générée le"), "rien de l'état Générée");
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

// Boutons du bloc (E3). Le HTML est lu sans les entites (l'apostrophe est ecrite &#39; dans la page).
// « Telecharger la convention » (E3-3, note UX §15.4) : remplace « Voir la convention » ET le « Telecharger » de
// l'evolution 2 pour le document genere. Le texte cache depend du format : « (fichier Word) », « (fichier PDF) »
// ou rien tant que le format est inconnu.
const TEXTE_TELECHARGER_CONVENTION = "Télécharger la convention";
const TEXTE_VOIR_CACHE = " (s'ouvre dans une fenêtre)";
// « Télécharger » du fichier SIGNE (evolution 2, inchange).
const TEXTE_TELECHARGER = "Télécharger";
const CACHE_TELECHARGER_SIGNEE = " le fichier PDF de la convention signée";
const BOUTON_TELECHARGER_CONVENTION = /<button\b[^>]*\sid="conventionTelecharger"[^>]*>\s*<span class="btn-content">([\s\S]*?)<\/span>\s*<\/button>/;

// Le bouton « Re-générer » de l'etat Generee (tache 8.1), place juste apres « Télécharger la convention ».
// Sans texte cache : il ouvre une fenetre, ce que dit aria-haspopup (note UX, §12.2).
const TEXTE_REGENERER = "Re-générer";
const BOUTON_REGENERER = /<button\b[^>]*\sid="conventionRegenerer"[^>]*>\s*<span class="btn-content">([\s\S]*?)<\/span>\s*<\/button>/;
// Zone de blocage (role="status"), presente aux etats A generer et Generee ; vide quand rien ne manque.
const ZONE_BLOCAGE_VIDE = '<div id="conventionBlocage" role="status"></div>';
// Zone d'attente du depot du fichier signe (tache 9.1a) : dans les cinq etats, vide au repos.
const ZONE_ATTENTE_VIDE = '<div class="convention-depot-attente" id="conventionDepotAttente" role="status"></div>';
// Les commandes du depot : « Déposer » (E3-6 : aux etats A generer, Generee et Sans modele, sans phrase d'aide
// ni aria-*, jamais relie au message de blocage) et « Remplacer » (etat Signee, seul dans son propre <div>).
const TEXTE_DEPOSER = "Déposer la convention signée";
const TEXTE_REMPLACER = "Remplacer le fichier signé";
const BOUTON_DEPOSER = '<button class="btn btn-secondary" type="button" id="conventionDeposer"><span class="btn-content">Déposer la convention signée</span></button>';
// Tache 9.1c : a l'etat Signee, « Voir la convention signée » (aria-haspopup="dialog" et texte cache « (s'ouvre
// dans une fenetre) ») dans la rangee convention-actions, suivi de « Télécharger » (evolution 2), puis en dessous
// « Remplacer » (dans son propre <div>). Aucun changement par l'E3 (E3-4).
const TEXTE_VOIR_SIGNEE = "Voir la convention signée";
const BOUTON_VOIR_SIGNEE = `<div class="convention-actions"><button class="btn btn-secondary" type="button" id="conventionVoirSignee" aria-haspopup="dialog"><span class="btn-content">${TEXTE_VOIR_SIGNEE}<span class="sr-only">${TEXTE_VOIR_CACHE}</span></span></button><button class="btn btn-secondary" type="button" id="conventionTelechargerSignee"><span class="btn-content">${TEXTE_TELECHARGER}<span class="sr-only">${CACHE_TELECHARGER_SIGNEE}</span></span></button></div>`;
const BOUTON_REMPLACER = '<div><button class="btn btn-link" type="button" id="conventionRemplacer"><span class="btn-content">Remplacer le fichier signé</span></button></div>';
const PHRASE_AIDE_DEPOT_RETIREE = "Vous pouvez déposer une convention déjà signée";

// Echoue si le bloc contient un lien, un champ, un menu ou un gestionnaire en ligne dans l'un des cinq etats, ou
// si les boutons ne sont pas, dans cet ordre, ceux de la note UX §15.3 :
//   À générer : « Générer la convention », « Déposer la convention signée » (E3-6) ;
//   Générée : « Télécharger la convention », « Re-générer », « Déposer la convention signée » ;
//   Signée : « Voir la convention signée », « Télécharger », puis « Remplacer le fichier signé » ;
//   Sans modèle : « Déposer la convention signée » seul ;
//   Droits insuffisants : aucun bouton, donc pas de bouton de dépôt (E3-6, Q-E3-2).
// La zone de message (#conventionAlerte) et la zone d'attente du depot (#conventionDepotAttente), role="status"
// et vides, sont dans les cinq etats ; la zone de blocage (#conventionBlocage, vide quand rien ne manque) est aux
// etats A generer et Generee. Hors de ces zones et des boutons qui ouvrent une fenetre (« Générer la convention »,
// « Re-générer », « Voir la convention signée »), le bloc n'a ni role ni aria-*, boutons compris : en particulier
// « Télécharger la convention » n'a plus aria-haspopup (aucune fenetre ne s'ouvre) et « Déposer » n'a ni
// aria-disabled, ni aria-describedby au repos.
test("le bloc n'a de bouton qu'aux états À générer (« Générer », « Déposer »), Générée (« Télécharger la convention », « Re-générer », « Déposer »), Signée (« Voir la convention signée », « Télécharger », « Remplacer ») et Sans modèle (« Déposer » seul), aucun à Droits insuffisants", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const bloc = blocPour(w, fabrique());
    assert.equal(bloc.split(ZONE_MESSAGE_VIDE).length - 1, 1, `${nom} : une seule zone de message vide (role="status")`);
    assert.equal(bloc.split(ZONE_ATTENTE_VIDE).length - 1, 1, `${nom} : une seule zone d'attente du dépôt, vide (role="status")`);
    assert.ok(!/<(a|input|select|textarea|details|summary|label|form|dialog)\b/i.test(bloc), `${nom} : élément interactif autre qu'un bouton`);
    assert.ok(!/\son[a-z]+\s*=/i.test(bloc), `${nom} : gestionnaire d'événement en ligne`);
    assert.ok(!/\s(href|tabindex|data-[\w-]+)\s*=/i.test(bloc), `${nom} : attribut de clic ou de navigation`);
    const boutons = bloc.match(/<button\b[^>]*>/gi) || [];
    const ids = boutons.map((b) => /\sid="([^"]+)"/.exec(b)[1]);
    const attendus = {
      "À générer": ["conventionGenerer", "conventionDeposer"],
      "Générée": ["conventionTelecharger", "conventionRegenerer", "conventionDeposer"],
      "Signée": ["conventionVoirSignee", "conventionTelechargerSignee", "conventionRemplacer"],
      "Sans modèle": ["conventionDeposer"],
      "Droits insuffisants": [],
    }[nom];
    assert.deepEqual(ids, attendus, `${nom} : boutons, dans l'ordre`);
    for (const bouton of boutons) {
      assert.match(bouton, /\stype="button"/, `${nom} : un bouton qui n'envoie rien`);
      assert.ok(!/\sdisabled\b/i.test(bouton), `${nom} : jamais l'attribut disabled`);
    }
    const zones = (html) => html.replace(ZONE_MESSAGE_VIDE, "").replace(ZONE_ATTENTE_VIDE, "").replace(ZONE_BLOCAGE_VIDE, "");
    if (nom === "À générer" || nom === "Générée") {
      const generation = boutons[nom === "À générer" ? 0 : 1];
      assert.ok(/\saria-haspopup="dialog"/.test(generation) && !/\s(role|aria-(?!haspopup="dialog")[\w-]+)\s*=/i.test(generation), `${nom} : le bouton de génération annonce une fenêtre et n'a rien d'autre`);
      assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(zones(bloc).replace(generation, "")), `${nom} : attribut d'accessibilité hors du bouton de génération et des zones de message`);
    } else if (nom === "Signée") {
      assert.ok(/\saria-haspopup="dialog"/.test(boutons[0]) && !/\s(role|aria-(?!haspopup="dialog")[\w-]+)\s*=/i.test(boutons[0]), `${nom} : « Voir la convention signée » annonce une fenêtre et n'a rien d'autre`);
      for (const bouton of boutons.slice(1)) assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(bouton), `${nom} : ni role ni aria-* avant le clic`);
    } else {
      assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(zones(bloc)), `${nom} : aucun attribut d'accessibilité hors des zones de message`);
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

// Echoue si un libelle de bouton de la note UX (enregistrer, « Envoi en cours… ») apparait n'importe ou dans le
// bloc au repos (texte d'un bouton, texte cache, attribut aria-label ou title) ; si un libelle apparait ailleurs
// que dans son etat (« Générer la convention » : À générer ; « Re-générer » et « Télécharger la convention » :
// Générée ; « Déposer la convention signée » : À générer, Générée et Sans modèle ; « Voir la convention signée »,
// « Télécharger » et « Remplacer le fichier signé » : Signée) ou n'y est pas une seule fois, dans son bouton ;
// si « Voir la convention » (sans « signée ») reste a l'etat Générée (E3-3) ; si la phrase d'aide du dépôt libre,
// retiree par l'E3-23, reste dans le bloc ; si le texte cache « (s'ouvre dans une fenetre) » n'est plus que
// celui de « Voir la convention signée » ; ou si « nouvel onglet » reste dans le bloc.
test("le bloc ne contient aucun libellé de bouton hors de son état : « Télécharger la convention » et « Re-générer » (Générée), « Déposer » (À générer, Générée, Sans modèle), « Voir la convention signée », « Télécharger » et « Remplacer » (Signée), plus aucun « Voir la convention » pour le document généré", () => {
  const w = loadWidget();
  const libelles = ["Générer la convention", "Re-générer", TEXTE_TELECHARGER_CONVENTION, "Voir la convention", TEXTE_VOIR_SIGNEE, TEXTE_DEPOSER, TEXTE_REMPLACER, TEXTE_TELECHARGER, "Envoi en cours", "Enregistrer"];
  const etats = {
    ...ETATS_A_TESTER,
    "À générer, agence manquante": () => donnees({action: {Agence: 0}}),
    "Générée, agence manquante": () => donnees({action: {Agence: 0}, conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}),
  };
  for (const [nom, fabrique] of Object.entries(etats)) {
    const lu = contenuLisible(blocPour(w, fabrique()));
    const attendu = (libelle) => {
      if (libelle === "Générer la convention") return nom.startsWith("À générer") ? 1 : 0;
      if (libelle === "Re-générer") return nom.startsWith("Générée") ? 1 : 0;
      if (libelle === TEXTE_TELECHARGER_CONVENTION) return nom.startsWith("Générée") ? 1 : 0;
      // « Voir la convention » : seulement le debut de « Voir la convention signée », a l'etat Signée.
      if (libelle === "Voir la convention" || libelle === TEXTE_VOIR_SIGNEE) return nom === "Signée" ? 1 : 0;
      if (libelle === TEXTE_DEPOSER) return nom.startsWith("À générer") || nom.startsWith("Générée") || nom === "Sans modèle" ? 1 : 0;
      if (libelle === TEXTE_REMPLACER) return nom === "Signée" ? 1 : 0;
      // « Télécharger » : celui de « Télécharger la convention » (Générée) ou du fichier signé (Signée), jamais les deux.
      if (libelle === TEXTE_TELECHARGER) return nom.startsWith("Générée") || nom === "Signée" ? 1 : 0;
      return 0;
    };
    for (const libelle of libelles) {
      assert.equal(lu.split(libelle).length - 1, attendu(libelle), `${nom} : « ${libelle} » (${attendu(libelle)} attendu)`);
    }
    assert.equal(lu.split("s'ouvre dans une fenêtre").length - 1, nom === "Signée" ? 1 : 0, `${nom} : texte caché « (s'ouvre dans une fenêtre) » du seul bouton « Voir la convention signée »`);
    assert.ok(!lu.includes("nouvel onglet"), `${nom} : plus de « nouvel onglet » dans le bloc`);
    assert.ok(!lu.includes(PHRASE_AIDE_DEPOT_RETIREE), `${nom} : la phrase d'aide du dépôt libre est retirée (E3-23)`);
  }
  assert.match(blocPour(w, donnees()),
    /<button\b[^>]*\sid="conventionGenerer"[^>]*>\s*<span class="btn-content">Générer la convention<\/span>\s*<\/button>/,
    "à l'état À générer, le libellé est dans le bouton");
  assert.ok(decoder(blocPour(w, donnees())).includes(BOUTON_DEPOSER), "à l'état À générer, « Déposer la convention signée » est dans son bouton, sans texte caché ni attribut");
  assert.ok(decoder(blocPour(w, donnees({modeles: []}))).includes(BOUTON_DEPOSER), "à l'état Sans modèle, « Déposer la convention signée » est dans son bouton, sans texte caché ni attribut");
  const generee = decoder(blocPour(w, ETATS_A_TESTER["Générée"]()));
  assert.equal(BOUTON_TELECHARGER_CONVENTION.exec(generee)[1], TEXTE_TELECHARGER_CONVENTION, "à l'état Générée (format inconnu), « Télécharger la convention » est dans son bouton, sans texte caché");
  assert.match(generee,
    /<button\b[^>]*\sid="conventionRegenerer"[^>]*>\s*<span class="btn-content">Re-générer<\/span>\s*<\/button>/,
    "à l'état Générée, « Re-générer » est dans son bouton, sans texte caché");
  assert.ok(generee.includes(BOUTON_DEPOSER), "à l'état Générée, « Déposer la convention signée » est dans son bouton, sans texte caché");
  const signee = decoder(blocPour(w, ETATS_A_TESTER["Signée"]()));
  assert.ok(signee.includes(BOUTON_VOIR_SIGNEE), "à l'état Signée, « Voir la convention signée » et son texte caché sont dans son bouton, seul sur sa rangée avec « Télécharger »");
  assert.ok(signee.includes(BOUTON_REMPLACER), "à l'état Signée, « Remplacer le fichier signé » est dans son bouton, seul dans son <div>, sans texte caché");
  assert.ok(signee.indexOf(BOUTON_VOIR_SIGNEE) < signee.indexOf(BOUTON_REMPLACER), "à l'état Signée, « Voir la convention signée » est AVANT « Remplacer »");
  assert.ok(!signee.includes("conventionDeposer"), "à l'état Signée, pas de « Déposer » (c'est « Remplacer »)");
});

// Echoue si « Déposer la convention signée » n'est pas visible en permanence (E3-6) : aux etats À générer, Générée et
// Sans modèle il doit y etre, UNE fois, avec le meme gabarit (btn btn-secondary, sans btn-sm ni btn-primary) ; a
// l'etat Droits insuffisants (le seul ou le widget sait que les droits manquent, Q-E3-2) il doit etre ABSENT ; a l'etat
// Signée c'est « Remplacer » qui est la.
test("« Déposer la convention signée » est visible en permanence (À générer, Générée, Sans modèle), absent à l'état Droits insuffisants et remplacé par « Remplacer » à l'état Signée", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const bloc = decoder(blocPour(w, fabrique()));
    const attendu = nom === "À générer" || nom === "Générée" || nom === "Sans modèle" ? 1 : 0;
    assert.equal(bloc.split('id="conventionDeposer"').length - 1, attendu, `${nom} : « Déposer » (${attendu} attendu)`);
    if (attendu) assert.ok(bloc.includes(BOUTON_DEPOSER), `${nom} : même gabarit partout`);
  }
  // Même avec une génération bloquée (agence ou club manquant) : le dépôt reste possible.
  for (const [manque, variante] of Object.entries(MANQUES)) {
    const bloque = decoder(blocPour(w, donnees(variante)));
    assert.ok(bloque.includes(BOUTON_DEPOSER), `À générer, ${manque} manquant : « Déposer » reste affiché et actif`);
  }
  // Droits insuffisants : ni bouton de dépôt, ni autre bouton, même si une convention signée est lue dans les données.
  const droits = blocPour(w, donnees({refusees: ["Conventions"], conventions: [convention({PDF_genere: PDF, PDF_signe: PDF, Date_depot: DEPOSEE_LE})]}));
  assert.ok(!droits.includes("<button") && !droits.includes("conventionDeposer"), "Droits insuffisants : aucun bouton");
});

// Echoue si « Déposer » est relié au message de blocage de la génération ou grisé par lui (§15.3 : « Il ne porte jamais
// aria-describedby ni aria-disabled à cause du blocage »), ou s'il n'est plus juste après « Générer la convention » /
// « Re-générer » dans la même rangée, ou seul de sa rangée à l'état Sans modèle.
test("« Déposer » : second bouton de la rangée (après « Générer » ou « Re-générer »), seul à l'état Sans modèle, jamais lié au message de blocage", () => {
  const w = loadWidget();
  const rangee = (html) => /<div class="convention-actions">([\s\S]*?)<\/div>/.exec(decoder(html))[1];
  const ids = (html) => [...rangee(html).matchAll(/<button\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids(blocPour(w, donnees())), ["conventionGenerer", "conventionDeposer"], "À générer : Générer puis Déposer");
  assert.deepEqual(ids(blocPour(w, GENEREE())), ["conventionTelecharger", "conventionRegenerer", "conventionDeposer"], "Générée : Déposer termine la rangée");
  assert.deepEqual(ids(blocPour(w, donnees({modeles: []}))), ["conventionDeposer"], "Sans modèle : Déposer seul");
  for (const [manque, variante] of Object.entries(MANQUES)) {
    for (const [nom, jeu] of [["À générer", donnees(variante)], ["Générée", GENEREE_SANS(variante)]]) {
      const html = decoder(blocPour(w, jeu));
      const deposer = /<button\b[^>]*\sid="conventionDeposer"[^>]*>/.exec(html)[0];
      assert.equal(deposer, '<button class="btn btn-secondary" type="button" id="conventionDeposer">', `${nom}, ${manque} manquant : « Déposer » n'a ni aria-disabled ni aria-describedby`);
      assert.ok(/aria-disabled="true"[^>]*aria-describedby="conventionBlocageTexte"/.test(html), `${nom}, ${manque} manquant : (contrôle) le bouton de génération, lui, est bien grisé et relié au message`);
    }
  }
});

// Echoue si la phrase d'aide « Vous pouvez déposer une convention déjà signée, préparée en dehors de l'outil. » (retirée par
// l'E3-23 sur décision de Hanta) revient aux états À générer ou Sans modèle, si ces états gagnent une phrase de plus que
// leur phrase d'état, ou si l'ancienne zone d'aide (conventionDeposerAide, help-block) revient.
test("E3-23 : aucune phrase d'aide près du bouton « Déposer » aux états À générer et Sans modèle", () => {
  const w = loadWidget();
  const aGenerer = blocPour(w, donnees());
  const sansModele = blocPour(w, donnees({modeles: []}));
  assert.deepEqual(textes(aGenerer), [TEXTES.aGenerer], "À générer : seulement la phrase d'état");
  assert.deepEqual(textes(sansModele), [TEXTES.sansModele], "Sans modèle : seulement la phrase d'état");
  for (const [nom, bloc] of [["À générer", aGenerer], ["Sans modèle", sansModele]]) {
    assert.ok(!decoder(bloc).includes(PHRASE_AIDE_DEPOT_RETIREE), `${nom} : pas de phrase d'aide du dépôt libre`);
    assert.ok(!bloc.includes("conventionDeposerAide") && !bloc.includes("aria-describedby"), `${nom} : ni zone d'aide ni aria-describedby sur « Déposer »`);
  }
  assert.ok(!aGenerer.includes("help-block"), "À générer sans blocage : aucun help-block");
});

// Echoue si le bloc contient autre chose que des phrases (<p>) et, aux etats A generer, Generee, Signee et (depuis
// l'E3-6) Sans modele seulement, des boutons (avec leur texte cache dans un <span>) : le retrait des phrases ne laisse que
// des conteneurs. A l'etat Droits insuffisants : aucun bouton.
test("le bloc ne contient que des phrases (et, sauf à l'état Droits insuffisants, des boutons) : en retirant les <p>, il ne reste aucune autre balise de contenu", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const sansPhrases = blocPour(w, fabrique()).replace(/<p\b[^>]*>[\s\S]*?<\/p>/g, "");
    const balises = [...sansPhrases.matchAll(/<([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase());
    const permises = nom === "Droits insuffisants" ? ["section", "div", "span"] : ["section", "div", "span", "button"];
    assert.deepEqual(balises.filter((b) => !permises.includes(b)), [], nom);
  }
});

// ---------------------------------------------------------------------------
// 6. Message de blocage : seulement a l'etat A generer, quand un element manque
// ---------------------------------------------------------------------------

const MANQUES = {
  "agence": {action: {Agence: 0}},
  "club": {action: {Club: 0}},
};

// Echoue si, aux etats A generer et Generee (depuis la 8.1, pour « Re-générer »), le message de
// blocage (« Renseignez… », texte cache, region #conventionBlocage) manque quand l'agence
// ou le club manque ; ou si l'un des trois autres etats (Signee, Sans modele,
// Droits insuffisants) l'affiche malgre un element manquant (ici l'agence). La phrase d'etat ne
// change pas : le message n'est pas une des phrases (<p> sans id) du bloc.
// Le test verifie d'abord que conventionBlocage voit bien le manque, sinon il ne prouverait rien.
test("le message de blocage n'apparaît qu'aux états À générer et Générée, quand il manque l'agence ou le club", () => {
  const w = loadWidget();
  const ETATS_AVEC_BOUTON = {
    "À générer": {variante: {}, phrases: [TEXTES.aGenerer]},
    "Générée": {variante: {conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}, phrases: ["Convention générée le 14/03/2026."]},
  };
  for (const [etat, {variante: etatVariante, phrases: attendues}] of Object.entries(ETATS_AVEC_BOUTON)) {
    for (const [manque, variante] of Object.entries(MANQUES)) {
      const jeu = donnees({...etatVariante, ...variante});
      assert.notEqual(w.conventionBlocage(1, jeu), null, `${etat}, ${manque} : le jeu d'essai doit bloquer la génération`);
      const html = blocPour(w, jeu);
      assert.ok(/Renseignez/.test(html), `${etat}, ${manque} : message « Renseignez… » attendu`);
      assert.ok(/impossible à générer/.test(html), `${etat}, ${manque} : texte caché de blocage attendu`);
      assert.ok(/id="conventionBlocage"/.test(html), `${etat}, ${manque} : région de blocage attendue`);
      assert.deepEqual(textes(html), attendues, `${etat}, ${manque} : l'état ne change pas`);
    }
  }

  const AUTRES_ETATS = {
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

// Echoue si, a l'etat Generee, le message de blocage de « Re-générer » (agence
// manquante) n'est pas affiche, ou s'il l'est alors que rien ne manque ; ou si le dispositif
// manquant (etat Sans modele) en fait apparaitre un.
test("à l'état Générée le message de blocage n'apparaît que si un élément manque ; aucun sans dispositif (état Sans modèle)", () => {
  const w = loadWidget();
  const generee = donnees({
    action: {Agence: 0},
    conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})],
  });
  assert.notEqual(w.conventionBlocage(1, generee), null);
  assert.deepEqual(textes(blocPour(w, generee)), ["Convention générée le 14/03/2026."]);
  assert.ok(decoder(blocPour(w, generee)).includes("Renseignez l'agence de l'action dans sa fiche."), "message de l'agence");
  const complete = blocPour(w, donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}));
  assert.ok(!/Renseignez|impossible à générer|conventionBlocageTexte/.test(complete), "rien ne manque : aucun message");

  const sansDispositif = donnees({action: {Dispositif: 0}});
  assert.notEqual(w.conventionBlocage(1, sansDispositif), null);
  const html = blocPour(w, sansDispositif);
  assert.ok(!/Renseignez/.test(html));
  assert.deepEqual(textes(html), [TEXTES.sansModele]);
});

// ---------------------------------------------------------------------------
// 7. Noms de classes
// ---------------------------------------------------------------------------

// convention-alerte (zone de message) et convention-contenu (partie refaite apres une
// generation) viennent de la 7.2b : elles sont dans tous les etats.
// convention-depot-attente (zone d'attente du depot, 9.1a) est elle aussi dans tous les etats.
const CLASSES_AUTORISEES = new Set(["edit-card", "section-head", "edit-fields", "convention-fields", "convention-alerte", "convention-contenu", "convention-depot-attente"]);

// Classes de plus, permises seulement a l'etat A generer (bouton, rangee du bouton,
// message de blocage et son texte cache) : classes du design system ou du widget.
const CLASSES_A_GENERER = ["convention-actions", "btn", "btn-secondary", "btn-content", "help-block", "sr-only"];

// Classes de plus, permises seulement a l'etat Generee (boutons « Télécharger la convention », « Re-générer » et
// « Déposer », leur rangee, le texte cache du format, la ligne « Format : … » (E3-8, help-block) et, depuis la
// 8.1, le message de blocage de « Re-générer » : help-block).
const CLASSES_GENEREE = ["convention-actions", "btn", "btn-secondary", "btn-content", "sr-only", "help-block"];

// Classes de plus, permises seulement a l'etat Sans modele (E3-6) : le seul bouton « Déposer » et sa rangee. Pas
// de help-block ni de sr-only : plus de phrase d'aide (E3-23).
const CLASSES_SANS_MODELE = ["convention-actions", "btn", "btn-secondary", "btn-content"];

// Classes de plus, permises seulement a l'etat Signee : le lien « Remplacer » (btn-link, 9.1a) et,
// depuis la 9.1c, « Voir la convention signée » (rangee convention-actions, btn-secondary, texte
// cache sr-only). Le lien « Remplacer » reste seul sur sa ligne, hors de la rangee.
const CLASSES_SIGNEE = ["convention-actions", "btn", "btn-secondary", "btn-link", "btn-content", "sr-only"];

// Echoue si le bloc utilise une classe hors liste : classe inventee, classe de couleur,
// classe du bouton / du message de blocage dans un etat autre que A generer et Generee, classe
// des boutons « Télécharger la convention » et « Re-générer » dans un etat autre que Generee, classe de « Déposer » hors
// des etats A generer, Generee et Sans modele (E3-6), classe de help-block a l'etat Sans modele (E3-23), classe du
// lien « Remplacer » (btn-link) dans un etat autre que Signee, ou classe d'un etat Signee hors de
// CLASSES_SIGNEE (help-block, btn-sm, btn-primary, icon-… : le message de blocage n'y est pas).
test("le bloc n'utilise que les classes autorisées, dans les cinq états (et avec un message de blocage, à l'état À générer comme à l'état Générée)", () => {
  const w = loadWidget();
  const jeux = [
    ...Object.entries(ETATS_A_TESTER).map(([nom, fabrique]) => [nom, fabrique()]),
    ["À générer, agence manquante", donnees({action: {Agence: 0}})],
    ["Générée, agence manquante", donnees({action: {Agence: 0}, conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]})],
  ];
  for (const [nom, jeu] of jeux) {
    const permises = nom.startsWith("À générer")
      ? new Set([...CLASSES_AUTORISEES, ...CLASSES_A_GENERER])
      : nom.startsWith("Générée")
        ? new Set([...CLASSES_AUTORISEES, ...CLASSES_GENEREE])
        : nom === "Signée"
          ? new Set([...CLASSES_AUTORISEES, ...CLASSES_SIGNEE])
          : nom === "Sans modèle"
            ? new Set([...CLASSES_AUTORISEES, ...CLASSES_SANS_MODELE])
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

// Echoue si la classe convention-aide ou une phrase d'aide reapparait dans l'un des etats (E3-26/E3-29 : l'etat Generee,
// le dernier a en avoir une, n'en a plus), format du document inconnu, Word ou ancien PDF.
test("convention-aide et les phrases d'aide n'apparaissent plus, dans aucun état", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    assert.ok(!classesDe(blocPour(w, fabrique())).has("convention-aide"), nom);
    sansPhraseAide(blocPour(w, fabrique()), nom);
  }
  for (const format of ["docx", "pdf"]) {
    fixerFormat(w, 20, format);
    sansPhraseAide(blocPour(w, ETATS_A_TESTER["Générée"]()), `Générée, format ${format}`);
  }
});

// Echoue si convention-fields n'est plus declaree dans style.css (le bloc s'afficherait sans mise en forme).
test("style.css déclare convention-fields", () => {
  assert.match(CSS, /\.convention-fields(?![\w-])/, ".convention-fields doit exister dans la feuille");
});

// Echoue si convention-alerte ou convention-contenu (7.2b) n'est plus declaree dans
// style.css : la zone de message prendrait de la place quand elle est vide, ou la partie
// refaite du bloc casserait la mise en page de la carte.
test("style.css déclare convention-alerte et convention-contenu", () => {
  for (const nom of ["convention-alerte", "convention-contenu"]) {
    assert.match(CSS, new RegExp(`\\.${nom}(?![\\w-])`), `.${nom} doit exister dans la feuille`);
  }
});

// Echoue si l'espace vide permanent en haut du bloc revient (E3-27) : les deux conteneurs vides (.convention-alerte et
// .convention-depot-attente) doivent passer en display: none via :empty (une marge negative ne reduit pas une ligne
// de grille), et aucune regle de ces deux conteneurs ne doit reprendre une marge negative.
test("E3-27 : les zones vides .convention-alerte et .convention-depot-attente sont masquées (display: none sur :empty), sans marge négative", () => {
  const regle = (selecteur) => {
    const trouvee = [...CSS_SANS_COMMENTAIRES.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].split(",").map((x) => x.trim()).includes(selecteur));
    assert.ok(trouvee, `une règle pour ${selecteur}`);
    return trouvee[2];
  };
  for (const selecteur of [".convention-alerte:empty", ".convention-depot-attente:empty"]) {
    assert.match(regle(selecteur), /(^|[;\s])display:\s*none\s*;?/, `${selecteur} { display: none }`);
  }
  for (const m of CSS_SANS_COMMENTAIRES.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (/\.convention-(alerte|depot-attente)\b/.test(m[1])) assert.ok(!/margin[^;]*-\d+px/.test(m[2]), `${m[1].trim()} : pas de marge négative`);
  }
});

// ---------------------------------------------------------------------------
// 8. Structure en deux parties (7.2b) : zone de message, puis contenu refaisable
// ---------------------------------------------------------------------------

// Echoue si, dans l'un des cinq etats, la zone de message (#conventionAlerte) est apres le
// contenu ou a l'interieur de #conventionBlocContenu (un rafraichissement la viderait et le
// message « Convention générée. » ne serait plus annonce), si #conventionBlocContenu n'est
// pas present une seule fois, ou si son contenu n'est pas exactement celui de conventionBlocContenuHtml.
test("le bloc a une zone de message vide, puis #conventionBlocContenu qui reprend exactement conventionBlocContenuHtml", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const jeu = fabrique();
    const bloc = blocPour(w, jeu);
    const zone = bloc.indexOf('id="conventionAlerte"');
    const contenu = bloc.indexOf('id="conventionBlocContenu"');
    assert.equal(bloc.split('id="conventionBlocContenu"').length - 1, 1, `${nom} : un seul contenu`);
    assert.ok(zone !== -1 && zone < contenu, `${nom} : la zone de message est avant le contenu`);
    assert.ok(bloc.includes(`<div class="convention-contenu" id="conventionBlocContenu">${w.conventionBlocContenuHtml(1, jeu)}</div>`),
      `${nom} : le contenu est celui de conventionBlocContenuHtml`);
    assert.ok(!w.conventionBlocContenuHtml(1, jeu).includes("conventionAlerte"), `${nom} : la zone de message n'est pas dans la partie refaite`);
  }
});

// Echoue si conventionBlocContenuHtml (la partie que conventionRafraichirBloc remet a jour)
// ne donne pas les phrases de l'etat et les boutons de l'etat : « Générer la convention », sa zone de blocage et
// « Déposer la convention signée » a l'etat A generer ; « Télécharger la convention », « Re-générer » puis « Déposer
// la convention signée », et la zone de blocage (vide) a l'etat Generee (sans « Générer la convention ») ; « Déposer »
// seul a l'etat Sans modele. Apres une generation reussie, le bouton « Générer » disparait et « Télécharger la
// convention », « Re-générer » et « Déposer » le remplacent.
test("conventionBlocContenuHtml : les phrases de l'état, « Générer » et « Déposer » à l'état À générer, « Télécharger la convention », « Re-générer » puis « Déposer » à l'état Générée", () => {
  const w = loadWidget();
  const aGenerer = w.conventionBlocContenuHtml(1, donnees());
  assert.deepEqual(textes(aGenerer), [TEXTES.aGenerer]);
  assert.match(aGenerer, /id="conventionGenerer"/);
  assert.match(aGenerer, /id="conventionBlocage"/);
  assert.match(aGenerer, /id="conventionDeposer"/, "« Déposer » est visible à l'état À générer (E3-6)");
  assert.ok(!aGenerer.includes("conventionVoir"), "pas de bouton « Voir » à l'état À générer");
  assert.ok(!aGenerer.includes("conventionTelecharger"), "pas de bouton « Télécharger la convention » à l'état À générer");
  assert.ok(!aGenerer.includes("conventionRegenerer"), "pas de bouton « Re-générer » à l'état À générer");
  const generee = w.conventionBlocContenuHtml(1, donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}));
  assert.deepEqual(textes(generee), ["Convention générée le 14/03/2026."]);
  const boutons = generee.match(/<button\b[^>]*>/g) || [];
  assert.equal(boutons.length, 3, "trois boutons à l'état Générée");
  assert.match(boutons[0], /\sid="conventionTelecharger"/, "le premier bouton est « Télécharger la convention »");
  assert.match(boutons[1], /\sid="conventionRegenerer"/, "le deuxième bouton est « Re-générer »");
  assert.match(boutons[2], /\sid="conventionDeposer"/, "le troisième bouton est « Déposer la convention signée »");
  assert.ok(!generee.includes("conventionVoir\""), "plus de bouton « Voir la convention » pour le document généré");
  assert.ok(!generee.includes("conventionGenerer"), "pas de bouton « Générer la convention »");
  assert.ok(!generee.includes("conventionRemplacer"), "pas de lien « Remplacer » à l'état Générée");
  assert.ok(generee.includes(ZONE_BLOCAGE_VIDE), "la zone de blocage est là, vide, quand rien ne manque");
  assert.ok(!/<section\b/.test(generee) && !generee.includes("edit-card"), "ni la carte ni son titre : seulement le contenu");
  const sansModele = w.conventionBlocContenuHtml(1, donnees({modeles: []}));
  assert.deepEqual((sansModele.match(/<button\b[^>]*>/g) || []).map((b) => /\sid="([^"]+)"/.exec(b)[1]), ["conventionDeposer"], "Sans modèle : « Déposer » seul");
});

// ---------------------------------------------------------------------------
// 9. Bouton « Re-générer » (tache 8.1) : etat Generee seulement, apres « Télécharger la convention »
// ---------------------------------------------------------------------------

const GENEREE = () => donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});
const GENEREE_SANS = (variante) => donnees({...variante, conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});

// Messages de blocage de la note UX (§2), recopies en dur.
const BLOCAGES = {
  agence: "Renseignez l'agence de l'action dans sa fiche.",
  club: "Renseignez le club de l'action.",
  dispositif: "Renseignez le dispositif de l'action dans sa fiche.",
};
const MANQUES_PAR_ELEMENT = {
  agence: {action: {Agence: 0}},
  club: {action: {Club: 0}},
  dispositif: {action: {Dispositif: 0}},
};

// Echoue si « Re-générer » apparait dans un autre etat que Generee (A generer, Signee, Sans
// modele, Droits insuffisants), manque a l'etat Generee, est avant « Télécharger la convention » (E3-3 : il vient juste
// apres lui, a la place de « Voir » et « Télécharger ») ou sur une autre rangee, change de libelle, de type, de classes
// (btn btn-secondary, sans btn-sm) ou d'identifiant, prend un texte cache, ou ne porte pas aria-haspopup="dialog"
// quand rien ne manque.
test("« Re-générer » n'existe qu'à l'état Générée, juste après « Télécharger la convention », sur la même rangée, avec son libellé exact", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const bloc = blocPour(w, fabrique());
    assert.equal(bloc.split('id="conventionRegenerer"').length - 1, nom === "Générée" ? 1 : 0, `${nom} : « Re-générer » (${nom === "Générée" ? "1" : "0"} attendu)`);
  }
  assert.ok(!blocPour(w, donnees({action: {Agence: 0}})).includes("conventionRegenerer"), "À générer, agence manquante : pas de « Re-générer »");

  const bloc = decoder(blocPour(w, GENEREE()));
  const telecharger = bloc.indexOf('id="conventionTelecharger"');
  const regenerer = bloc.indexOf('id="conventionRegenerer"');
  assert.ok(telecharger !== -1 && regenerer > telecharger, "« Re-générer » est après « Télécharger la convention »");
  assert.ok(!bloc.includes('id="conventionVoir"'), "il n'y a plus de « Voir la convention » avant lui");
  assert.ok(bloc.includes('</span></button><button class="btn btn-secondary" type="button" id="conventionRegenerer"'), "juste après « Télécharger la convention », sans rien entre les deux boutons");
  const rangee = /<div class="convention-actions">([\s\S]*?)<\/div>/.exec(bloc);
  assert.ok(rangee && rangee[1].includes('id="conventionTelecharger"') && rangee[1].includes('id="conventionRegenerer"') && rangee[1].includes('id="conventionDeposer"'), "les trois boutons sont dans la même rangée");
  const libelle = BOUTON_REGENERER.exec(bloc);
  assert.ok(libelle, "le libellé est dans <span class=\"btn-content\">");
  assert.equal(libelle[1], TEXTE_REGENERER, "libellé exact, sans texte caché");
  assert.ok(bloc.includes('<button class="btn btn-secondary" type="button" id="conventionRegenerer" aria-haspopup="dialog">'), "bouton secondaire, type button, annonce une fenêtre");
  assert.ok(!bloc.includes("btn-sm") && !bloc.includes("btn-primary"), "ni btn-sm ni bouton principal");
});

// Un element manquant a la fois (agence, club, dispositif). Echoue si « Re-générer »
// n'est plus grise par aria-disabled="true" (ou prend disabled ou garde aria-haspopup), si
// aria-describedby ne pointe plus vers le message, si le message n'est pas celui du premier
// element manquant (texte cache « Convention impossible à générer : » compris), s'il n'est pas
// dans la zone role="status", ou s'il n'est pas entre les phrases et les boutons.
test("génération bloquée à l'état Générée : « Re-générer » est grisé et relié au message exact de l'élément manquant", () => {
  const w = loadWidget();
  for (const [element, variante] of Object.entries(MANQUES_PAR_ELEMENT)) {
    const jeu = GENEREE_SANS(variante);
    assert.equal(w.conventionBlocage(1, jeu).element, element, `${element} : le jeu d'essai bloque sur cet élément`);
    const bloc = decoder(blocPour(w, jeu));
    const bouton = /<button\b[^>]*\sid="conventionRegenerer"[^>]*>/.exec(bloc)[0];
    assert.ok(bouton.includes(' aria-disabled="true"'), `${element} : aria-disabled="true"`);
    assert.ok(bouton.includes(' aria-describedby="conventionBlocageTexte"'), `${element} : relié au message`);
    assert.ok(!/\sdisabled\b/.test(bouton), `${element} : jamais l'attribut disabled`);
    assert.ok(!bouton.includes("aria-haspopup"), `${element} : grisé, il n'annonce plus de fenêtre`);
    assert.equal(BOUTON_REGENERER.exec(bloc)[1], TEXTE_REGENERER, `${element} : le bouton reste affiché avec son libellé`);
    assert.equal(bloc.split('id="conventionBlocageTexte"').length - 1, 1, `${element} : la cible de aria-describedby existe, une fois`);
    assert.ok(bloc.includes(`<div id="conventionBlocage" role="status"><p class="help-block" id="conventionBlocageTexte"><span class="sr-only">Convention impossible à générer : </span>${BLOCAGES[element]}</p></div>`),
      `${element} : message exact, avec son texte caché, dans la zone role="status"`);
    const message = bloc.indexOf('id="conventionBlocageTexte"');
    assert.ok(bloc.indexOf("Convention générée le 14/03/2026.") !== -1 && bloc.indexOf("Convention générée le 14/03/2026.") < message && message < bloc.indexOf('id="conventionTelecharger"'), `${element} : le message est sous les phrases et au-dessus des boutons`);
  }
});

// Echoue si « Re-générer » est grise ou relie un message alors que rien ne manque, s'il perd
// aria-haspopup="dialog", prend disabled, ou si un message de blocage reste affiche.
test("rien ne manque à l'état Générée : « Re-générer » est actif (aria-haspopup=\"dialog\"), sans message", () => {
  const w = loadWidget();
  const jeu = GENEREE();
  assert.equal(w.conventionBlocage(1, jeu), null, "le jeu d'essai ne bloque pas");
  const bloc = blocPour(w, jeu);
  const bouton = /<button\b[^>]*\sid="conventionRegenerer"[^>]*>/.exec(bloc)[0];
  assert.ok(bouton.includes(' aria-haspopup="dialog"'), "aria-haspopup=\"dialog\"");
  assert.ok(!/aria-disabled|aria-describedby|\sdisabled\b/.test(bouton), "ni aria-disabled, ni aria-describedby, ni disabled");
  assert.ok(bloc.includes(ZONE_BLOCAGE_VIDE), "la zone de blocage est vide");
  assert.ok(!bloc.includes("conventionBlocageTexte"), "aucun message de blocage");
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
  assert.deepEqual(textes(extraireBloc(html)), ["Convention générée le 14/03/2026."]);
});
