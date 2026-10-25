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

// Le bouton de l'etat Generee (tache 7.4) : « Voir la convention », puis son texte cache pour
// les lecteurs d'ecran, dans un <span class="sr-only">. Le HTML est lu sans les entites
// (l'apostrophe est ecrite &#39; dans la page).
const TEXTE_VOIR = "Voir la convention";
const TEXTE_VOIR_CACHE = " (s'ouvre dans un nouvel onglet)";
const BOUTON_VOIR = /<button\b[^>]*\sid="conventionVoir"[^>]*>\s*<span class="btn-content">([\s\S]*?)<\/span>\s*<\/button>/;

// Le bouton « Re-générer » de l'etat Generee (tache 8.1), place juste apres « Voir la convention ».
// Sans texte cache : il ouvre une fenetre, ce que dit aria-haspopup (note UX, §12.2).
const TEXTE_REGENERER = "Re-générer";
const BOUTON_REGENERER = /<button\b[^>]*\sid="conventionRegenerer"[^>]*>\s*<span class="btn-content">([\s\S]*?)<\/span>\s*<\/button>/;
// Zone de blocage (role="status"), presente aux etats A generer et Generee ; vide quand rien ne manque.
const ZONE_BLOCAGE_VIDE = '<div id="conventionBlocage" role="status"></div>';
// Zone d'attente du depot du fichier signe (tache 9.1a) : dans les cinq etats, vide au repos.
const ZONE_ATTENTE_VIDE = '<div class="convention-depot-attente" id="conventionDepotAttente" role="status"></div>';
// Les commandes du depot (tache 9.1a) : « Déposer » (etat Generee, dernier de la rangee) et
// « Remplacer » (etat Signee, seul dans son propre <div>, hors de la rangee).
const TEXTE_DEPOSER = "Déposer la convention signée";
const TEXTE_REMPLACER = "Remplacer le fichier signé";
const BOUTON_DEPOSER = '<button class="btn btn-secondary" type="button" id="conventionDeposer"><span class="btn-content">Déposer la convention signée</span></button>';
const BOUTON_REMPLACER = '<div><button class="btn btn-link" type="button" id="conventionRemplacer"><span class="btn-content">Remplacer le fichier signé</span></button></div>';

// Echoue si le bloc contient un lien, un champ, un menu ou un gestionnaire en
// ligne dans l'un des cinq etats, un bouton ailleurs qu'a l'etat A generer (« Générer la
// convention »), a l'etat Generee (« Voir la convention », « Re-générer », puis, depuis la 9.1a,
// « Déposer la convention signée », dans cet ordre) et a l'etat Signee (« Remplacer le fichier
// signé », seul, depuis la 9.1a), un deuxieme bouton a l'etat A generer, ou autre chose que ces
// boutons. La zone de message (#conventionAlerte) et la zone d'attente du depot
// (#conventionDepotAttente), role="status" et vides, sont dans les cinq etats ; la zone de
// blocage (#conventionBlocage, vide quand rien ne manque) est aux etats A generer et Generee.
// Hors de ces zones et du bouton « Re-générer » (le seul a porter aria-haspopup), le bloc n'a ni
// role ni aria-*, boutons compris (« Voir », « Déposer » et « Remplacer » n'ont ni aria-haspopup,
// ni aria-disabled avant le clic).
test("le bloc n'a de bouton qu'aux états À générer (« Générer »), Générée (« Voir », « Re-générer », « Déposer ») et Signée (« Remplacer »), et aucun autre élément interactif, dans les cinq états", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const bloc = blocPour(w, fabrique());
    assert.equal(bloc.split(ZONE_MESSAGE_VIDE).length - 1, 1, `${nom} : une seule zone de message vide (role="status")`);
    assert.equal(bloc.split(ZONE_ATTENTE_VIDE).length - 1, 1, `${nom} : une seule zone d'attente du dépôt, vide (role="status")`);
    assert.ok(!/<(a|input|select|textarea|details|summary|label|form|dialog)\b/i.test(bloc), `${nom} : élément interactif autre qu'un bouton`);
    assert.ok(!/\son[a-z]+\s*=/i.test(bloc), `${nom} : gestionnaire d'événement en ligne`);
    assert.ok(!/\s(href|tabindex|data-[\w-]+)\s*=/i.test(bloc), `${nom} : attribut de clic ou de navigation`);
    const boutons = bloc.match(/<button\b[^>]*>/gi) || [];
    if (nom === "À générer") {
      assert.equal(boutons.length, 1, `${nom} : un seul bouton`);
      assert.match(boutons[0], /\sid="conventionGenerer"/, `${nom} : le bouton est « Générer la convention »`);
    } else if (nom === "Générée") {
      assert.equal(boutons.length, 3, `${nom} : trois boutons`);
      assert.match(boutons[0], /\sid="conventionVoir"/, `${nom} : le premier bouton est « Voir la convention »`);
      assert.match(boutons[1], /\sid="conventionRegenerer"/, `${nom} : le deuxième bouton est « Re-générer »`);
      assert.match(boutons[2], /\sid="conventionDeposer"/, `${nom} : le troisième bouton est « Déposer la convention signée »`);
      for (const bouton of boutons) assert.match(bouton, /\stype="button"/, `${nom} : un bouton qui n'envoie rien`);
      assert.ok(!/\s(role|aria-[\w-]+|disabled)\b/i.test(boutons[0]), `${nom} : « Voir » n'a ni role, ni aria-*, ni disabled avant le clic`);
      assert.ok(!/\s(role|aria-[\w-]+|disabled)\b/i.test(boutons[2]), `${nom} : « Déposer » n'a ni role, ni aria-*, ni disabled avant le clic`);
      assert.ok(!/\sdisabled\b/i.test(boutons[1]), `${nom} : « Re-générer » n'a jamais l'attribut disabled`);
      const libelle = BOUTON_VOIR.exec(bloc);
      assert.ok(libelle, `${nom} : le libellé est dans <span class="btn-content">`);
      assert.equal(decoder(libelle[1]), `${TEXTE_VOIR}<span class="sr-only">${TEXTE_VOIR_CACHE}</span>`, `${nom} : texte, puis texte caché pour les lecteurs d'écran`);
      const sansRegenerer = bloc.replace(ZONE_MESSAGE_VIDE, "").replace(ZONE_ATTENTE_VIDE, "").replace(ZONE_BLOCAGE_VIDE, "").replace(boutons[1], "");
      assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(sansRegenerer), `${nom} : attribut d'accessibilité interactive hors de « Re-générer » et des zones de message`);
    } else if (nom === "Signée") {
      assert.equal(boutons.length, 1, `${nom} : un seul bouton`);
      assert.match(boutons[0], /\sid="conventionRemplacer"/, `${nom} : le bouton est « Remplacer le fichier signé »`);
      assert.match(boutons[0], /\stype="button"/, `${nom} : un bouton qui n'envoie rien`);
      assert.ok(!/\sdisabled\b/i.test(boutons[0]), `${nom} : « Remplacer » n'a jamais l'attribut disabled`);
      assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(bloc.replace(ZONE_MESSAGE_VIDE, "").replace(ZONE_ATTENTE_VIDE, "")), `${nom} : attribut d'accessibilité interactive hors des zones de message`);
    } else {
      assert.equal(boutons.length, 0, `${nom} : aucun bouton`);
      assert.ok(!/\s(role|aria-[\w-]+)\s*=/i.test(bloc.replace(ZONE_MESSAGE_VIDE, "").replace(ZONE_ATTENTE_VIDE, "")), `${nom} : attribut d'accessibilité interactive`);
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

// Echoue si un libelle de bouton de la note UX (enregistrer, « Envoi en cours… ») apparait
// n'importe ou dans le bloc au repos (texte d'un bouton, texte cache, attribut aria-label ou
// title) ; si « Générer la convention » apparait ailleurs qu'a l'etat A generer (grise ou non)
// ou n'y est pas une seule fois, dans son bouton ; si « Voir la convention », « Re-générer » ou
// « Déposer la convention signée » apparait ailleurs qu'a l'etat Generee (grise ou non) ou n'y
// est pas une seule fois, dans son bouton ; si « Remplacer le fichier signé » apparait ailleurs
// qu'a l'etat Signee ou n'y est pas une seule fois, dans son bouton, seul dans son <div> ; ou si
// « Voir » perd son texte cache ou si « Re-générer », « Déposer » ou « Remplacer » en prend un.
test("le bloc ne contient aucun libellé de bouton de la note UX, sauf « Générer la convention » (À générer), « Voir la convention », « Re-générer » et « Déposer la convention signée » (Générée) et « Remplacer le fichier signé » (Signée), chacun dans son bouton", () => {
  const w = loadWidget();
  const libelles = ["Générer la convention", "Re-générer", "Voir la convention", TEXTE_DEPOSER, TEXTE_REMPLACER, "Envoi en cours", "Enregistrer"];
  const etats = {
    ...ETATS_A_TESTER,
    "À générer, agence manquante": () => donnees({action: {Agence: 0}}),
    "Générée, agence manquante": () => donnees({action: {Agence: 0}, conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}),
  };
  for (const [nom, fabrique] of Object.entries(etats)) {
    const lu = contenuLisible(blocPour(w, fabrique()));
    for (const libelle of libelles) {
      const attendu = (nom.startsWith("À générer") && libelle === "Générer la convention")
        || (nom.startsWith("Générée") && (libelle === "Voir la convention" || libelle === "Re-générer" || libelle === TEXTE_DEPOSER))
        || (nom === "Signée" && libelle === TEXTE_REMPLACER) ? 1 : 0;
      assert.equal(lu.split(libelle).length - 1, attendu, `${nom} : « ${libelle} » (${attendu} attendu)`);
    }
    assert.equal(lu.split("s'ouvre dans un nouvel onglet").length - 1, nom.startsWith("Générée") ? 1 : 0, `${nom} : texte caché du bouton « Voir » (et d'aucun autre)`);
  }
  assert.match(blocPour(w, donnees()),
    /<button\b[^>]*\sid="conventionGenerer"[^>]*>\s*<span class="btn-content">Générer la convention<\/span>\s*<\/button>/,
    "à l'état À générer, le libellé est dans le bouton");
  const generee = decoder(blocPour(w, ETATS_A_TESTER["Générée"]()));
  assert.match(generee,
    /<button\b[^>]*\sid="conventionVoir"[^>]*>\s*<span class="btn-content">Voir la convention<span class="sr-only"> \(s'ouvre dans un nouvel onglet\)<\/span><\/span>\s*<\/button>/,
    "à l'état Générée, le libellé de « Voir » et son texte caché sont dans le bouton");
  assert.match(generee,
    /<button\b[^>]*\sid="conventionRegenerer"[^>]*>\s*<span class="btn-content">Re-générer<\/span>\s*<\/button>/,
    "à l'état Générée, « Re-générer » est dans son bouton, sans texte caché");
  assert.ok(generee.includes(BOUTON_DEPOSER), "à l'état Générée, « Déposer la convention signée » est dans son bouton, sans texte caché");
  assert.ok(decoder(blocPour(w, ETATS_A_TESTER["Signée"]())).includes(BOUTON_REMPLACER), "à l'état Signée, « Remplacer le fichier signé » est dans son bouton, seul dans son <div>, sans texte caché");
});

// Echoue si le bloc contient autre chose que des phrases (<p>) et, aux etats A generer,
// Generee et Signee (depuis la 9.1a) seulement, des boutons (avec, a l'etat Generee, le texte
// cache de « Voir » dans un <span>) : le retrait des phrases ne laisse que des conteneurs.
test("le bloc ne contient que des phrases (et, aux états À générer, Générée et Signée, des boutons) : en retirant les <p>, il ne reste aucune autre balise de contenu", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const sansPhrases = blocPour(w, fabrique()).replace(/<p\b[^>]*>[\s\S]*?<\/p>/g, "");
    const balises = [...sansPhrases.matchAll(/<([a-z0-9]+)/gi)].map((m) => m[1].toLowerCase());
    const permises = nom === "À générer" || nom === "Générée" || nom === "Signée" ? ["section", "div", "span", "button"] : ["section", "div", "span"];
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

// Echoue si, aux etats A generer et Generee (depuis la 8.1, pour « Re-générer »), le message de
// blocage (« Renseignez… », texte cache, region #conventionBlocage) manque quand l'adresse du
// club, l'agence ou le club manque ; ou si l'un des trois autres etats (Signee, Sans modele,
// Droits insuffisants) l'affiche malgre un element manquant (ici l'agence). La phrase d'etat ne
// change pas : le message n'est pas une des phrases (<p> sans id) du bloc.
// Le test verifie d'abord que conventionBlocage voit bien le manque, sinon il ne prouverait rien.
test("le message de blocage n'apparaît qu'aux états À générer et Générée, quand il manque l'adresse du club, l'agence ou le club", () => {
  const w = loadWidget();
  const ETATS_AVEC_BOUTON = {
    "À générer": {variante: {}, phrases: [TEXTES.aGenerer]},
    "Générée": {variante: {conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}, phrases: ["Convention générée le 14/03/2026.", TEXTES.aide]},
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

// Echoue si, a l'etat Generee, le message de blocage de « Re-générer » (adresse du club
// manquante) n'est pas affiche, ou s'il l'est alors que rien ne manque ; ou si le dispositif
// manquant (etat Sans modele) en fait apparaitre un.
test("à l'état Générée le message de blocage n'apparaît que si un élément manque ; aucun sans dispositif (état Sans modèle)", () => {
  const w = loadWidget();
  const generee = donnees({
    structure: {Adresse: "", Code_postal: "", Ville: ""},
    conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})],
  });
  assert.notEqual(w.conventionBlocage(1, generee), null);
  assert.deepEqual(textes(blocPour(w, generee)), ["Convention générée le 14/03/2026.", TEXTES.aide]);
  assert.ok(decoder(blocPour(w, generee)).includes("Renseignez l'adresse du club dans sa fiche."), "message de l'adresse du club");
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
const CLASSES_AUTORISEES = new Set(["edit-card", "section-head", "edit-fields", "convention-fields", "convention-aide", "convention-alerte", "convention-contenu", "convention-depot-attente"]);

// Classes de plus, permises seulement a l'etat A generer (bouton, rangee du bouton,
// message de blocage et son texte cache) : classes du design system ou du widget.
const CLASSES_A_GENERER = ["convention-actions", "btn", "btn-secondary", "btn-content", "help-block", "sr-only"];

// Classes de plus, permises seulement a l'etat Generee (boutons « Voir la convention » et
// « Re-générer », leur rangee, le texte cache de « Voir » et, depuis la 8.1, le message de
// blocage de « Re-générer » : help-block).
const CLASSES_GENEREE = ["convention-actions", "btn", "btn-secondary", "btn-content", "sr-only", "help-block"];

// Classes de plus, permises seulement a l'etat Signee (9.1a) : le lien « Remplacer » (btn-link).
// Pas de convention-actions : le lien est seul sur sa ligne, hors de la rangee des boutons.
const CLASSES_SIGNEE = ["btn", "btn-link", "btn-content"];

// Echoue si le bloc utilise une classe hors liste : classe inventee, classe de couleur,
// classe du bouton / du message de blocage dans un etat autre que A generer et Generee, classe
// des boutons « Voir », « Re-générer » et « Déposer » dans un etat autre que Generee, classe du
// lien « Remplacer » (btn-link) dans un etat autre que Signee, ou convention-actions a l'etat
// Signee (le lien n'est pas dans la rangee des boutons).
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

// Echoue si convention-alerte ou convention-contenu (7.2b) n'est plus declaree dans
// style.css : la zone de message prendrait de la place quand elle est vide, ou la partie
// refaite du bloc casserait la mise en page de la carte.
test("style.css déclare convention-alerte et convention-contenu", () => {
  for (const nom of ["convention-alerte", "convention-contenu"]) {
    assert.match(CSS, new RegExp(`\\.${nom}(?![\\w-])`), `.${nom} doit exister dans la feuille`);
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
// ne donne pas les phrases de l'etat et les boutons de l'etat : « Générer la convention » et sa
// zone de blocage a l'etat A generer ; « Voir la convention », « Re-générer », puis (depuis la
// 9.1a) « Déposer la convention signée », et la zone de blocage (vide) a l'etat Generee (sans
// « Générer la convention »). Apres une generation reussie, le bouton « Générer » disparait et
// « Voir », « Re-générer » et « Déposer » le remplacent.
test("conventionBlocContenuHtml : les phrases de l'état, le bouton « Générer » à l'état À générer et les boutons « Voir », « Re-générer » puis « Déposer » à l'état Générée", () => {
  const w = loadWidget();
  const aGenerer = w.conventionBlocContenuHtml(1, donnees());
  assert.deepEqual(textes(aGenerer), [TEXTES.aGenerer]);
  assert.match(aGenerer, /id="conventionGenerer"/);
  assert.match(aGenerer, /id="conventionBlocage"/);
  assert.ok(!aGenerer.includes("conventionVoir"), "pas de bouton « Voir » à l'état À générer");
  assert.ok(!aGenerer.includes("conventionRegenerer"), "pas de bouton « Re-générer » à l'état À générer");
  assert.ok(!aGenerer.includes("conventionDeposer"), "pas de bouton « Déposer » à l'état À générer");
  const generee = w.conventionBlocContenuHtml(1, donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]}));
  assert.deepEqual(textes(generee), ["Convention générée le 14/03/2026.", TEXTES.aide]);
  const boutons = generee.match(/<button\b[^>]*>/g) || [];
  assert.equal(boutons.length, 3, "trois boutons à l'état Générée");
  assert.match(boutons[0], /\sid="conventionVoir"/, "le premier bouton est « Voir la convention »");
  assert.match(boutons[1], /\sid="conventionRegenerer"/, "le deuxième bouton est « Re-générer »");
  assert.match(boutons[2], /\sid="conventionDeposer"/, "le troisième bouton est « Déposer la convention signée »");
  assert.ok(!generee.includes("conventionGenerer"), "pas de bouton « Générer la convention »");
  assert.ok(!generee.includes("conventionRemplacer"), "pas de lien « Remplacer » à l'état Générée");
  assert.ok(generee.includes(ZONE_BLOCAGE_VIDE), "la zone de blocage est là, vide, quand rien ne manque");
  assert.ok(!/<section\b/.test(generee) && !generee.includes("edit-card"), "ni la carte ni son titre : seulement le contenu");
});

// ---------------------------------------------------------------------------
// 9. Bouton « Re-générer » (tache 8.1) : etat Generee seulement, apres « Voir la convention »
// ---------------------------------------------------------------------------

const GENEREE = () => donnees({conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});
const GENEREE_SANS = (variante) => donnees({...variante, conventions: [convention({PDF_genere: PDF, Date_generation: GENEREE_LE})]});

// Messages de blocage de la note UX (§2), recopies en dur.
const BLOCAGES = {
  agence: "Renseignez l'agence de l'action dans sa fiche.",
  club: "Renseignez le club de l'action.",
  dispositif: "Renseignez le dispositif de l'action dans sa fiche.",
  adresse: "Renseignez l'adresse du club dans sa fiche.",
};
const MANQUES_PAR_ELEMENT = {
  agence: {action: {Agence: 0}},
  club: {action: {Club: 0}},
  dispositif: {action: {Dispositif: 0}},
  adresse: {structure: {Adresse: "", Code_postal: "", Ville: ""}},
};

// Echoue si « Re-générer » apparait dans un autre etat que Generee (A generer, Signee, Sans
// modele, Droits insuffisants), manque a l'etat Generee, est avant « Voir la convention » ou sur
// une autre rangee, change de libelle, de type, de classes (btn btn-secondary, sans btn-sm) ou
// d'identifiant, prend un texte cache, ou ne porte pas aria-haspopup="dialog" quand rien ne manque.
test("« Re-générer » n'existe qu'à l'état Générée, juste après « Voir la convention », sur la même rangée, avec son libellé exact", () => {
  const w = loadWidget();
  for (const [nom, fabrique] of Object.entries(ETATS_A_TESTER)) {
    const bloc = blocPour(w, fabrique());
    assert.equal(bloc.split('id="conventionRegenerer"').length - 1, nom === "Générée" ? 1 : 0, `${nom} : « Re-générer » (${nom === "Générée" ? "1" : "0"} attendu)`);
  }
  assert.ok(!blocPour(w, donnees({action: {Agence: 0}})).includes("conventionRegenerer"), "À générer, agence manquante : pas de « Re-générer »");

  const bloc = decoder(blocPour(w, GENEREE()));
  const voir = bloc.indexOf('id="conventionVoir"');
  const regenerer = bloc.indexOf('id="conventionRegenerer"');
  assert.ok(voir !== -1 && regenerer > voir, "« Re-générer » est après « Voir la convention »");
  assert.ok(bloc.includes('</span></button><button class="btn btn-secondary" type="button" id="conventionRegenerer"'), "juste après « Voir », sans rien entre les deux boutons");
  const rangee = /<div class="convention-actions">([\s\S]*?)<\/div>/.exec(bloc);
  assert.ok(rangee && rangee[1].includes('id="conventionVoir"') && rangee[1].includes('id="conventionRegenerer"'), "les deux boutons sont dans la même rangée");
  const libelle = BOUTON_REGENERER.exec(bloc);
  assert.ok(libelle, "le libellé est dans <span class=\"btn-content\">");
  assert.equal(libelle[1], TEXTE_REGENERER, "libellé exact, sans texte caché");
  assert.ok(bloc.includes('<button class="btn btn-secondary" type="button" id="conventionRegenerer" aria-haspopup="dialog">'), "bouton secondaire, type button, annonce une fenêtre");
  assert.ok(!bloc.includes("btn-sm") && !bloc.includes("btn-primary"), "ni btn-sm ni bouton principal");
});

// Un element manquant a la fois (agence, club, dispositif, adresse du club). Echoue si « Re-générer »
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
    assert.ok(bloc.indexOf(TEXTES.aide) < message && message < bloc.indexOf('id="conventionVoir"'), `${element} : le message est sous les phrases et au-dessus des boutons`);
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
  assert.deepEqual(textes(extraireBloc(html)), ["Convention générée le 14/03/2026.", TEXTES.aide]);
});
