"use strict";

// Le fichier Word généré (Évolution 3 : docs/ux/convention.md, §15.5, §15.9 ; backlog E3-5, E3-12, E3-13, E3-18 à
// E3-22) : conventionDocumentDocx décrit le document à la bibliothèque docx. Ces tests lisent ce que le widget
// DEMANDE à la bibliothèque (une fausse bibliothèque, test/helpers/docx.js, garde les objets reçus) : ils ne
// vérifient pas ce que Word affichera pour de vrai (couleur exacte, coupures de page, rendu des tableaux) : c'est
// la recette de Hanta, qui ouvre le fichier dans Word.
// Un seul traitement pour tous les champs vides (E3-25, §15.5) : 56 points ordinaires (comme le PDF), sans couleur,
// sans surlignage, sans soulignement, qu'il s'agisse d'une donnée Grist connue mais vide (siège, adresse de l'agence,
// SIRET, signataire...) ou d'une zone écrite à la main (« Fait à… », « À…, le… »). Les trois autres zones manuscrites
// (nombre d'opérations, date de fin, contact protection des données) vivent dans le TEXTE des modèles Grist, pas dans
// le code : le widget n'y touche pas (E3-20 B : pas d'heuristique sur les points tapés à la main).
// Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");
const {creerFauxDocx, instances, runs, paragraphes, texte, section, enteteDeLaPremierePage} = require("./helpers/docx");

const NBSP = " ";
const attendre = () => new Promise((resolve) => setImmediate(resolve));

let widgetPur;
async function widget() {
  if (!widgetPur) {
    widgetPur = loadWidget();
    await attendre();
  }
  return widgetPur;
}

// Toutes les cases du widget, remplies. Une valeur de `vides` (liste de noms) devient '' (connue mais vide).
const CASES = {
  "Année": "2031",
  "Nom du club": "Club Exemple",
  "SIRET du club": "12345678901234",
  "Siège du club": "1 rue Exemple, 75001 Exemple-sur-Mer",
  "Signataire du club": "Camille Exemple",
  "Fonction du signataire": "Présidente",
  "Nom de l’agence": "Agence Exemple",
  "Adresse de l’agence": "2 avenue Exemple, 75002 Exemple-Ville",
  "SIRET de l’agence": "98765432109876",
  "Représentant de l’agence": "Dana Exemple",
  "Fonction du représentant": "Directrice adjointe",
};
const cases = (vides = [], remplacements = {}) => {
  const valeurs = {...CASES, ...remplacements};
  for (const nom of vides) valeurs[nom] = "";
  return valeurs;
};

// Fabrique le Document de la fausse bibliothèque pour ce texte de modèle.
async function document(modele, valeurs = CASES, logos = {}) {
  const w = await widget();
  return w.conventionDocumentDocx(modele, valeurs, {lib: creerFauxDocx(), logos});
}

// Les morceaux de texte (TextRun) dont le texte est exactement celui-ci, ou qui le contiennent.
const runsContenant = (doc, fragment) => runs(doc).filter((run) => (run.text || "").includes(fragment));
const surlignes = (doc) => runs(doc).filter((run) => run.highlight);
const soulignes = (doc) => runs(doc).filter((run) => run.underline);
const POINTILLES = ".".repeat(56);
// Les morceaux de texte voisins qui ont la même mise en forme sont fusionnés par le widget : les points peuvent donc
// partager un morceau avec le texte d'à côté. On cherche les morceaux qui CONTIENNENT 56 points, et on compte les suites.
const pointilles = (doc) => runs(doc).filter((run) => (run.text || "").includes(POINTILLES));
const nbPointilles = (doc) => texte(doc).split(POINTILLES).length - 1;
// Un morceau de texte « sans aucune couleur » : ni surlignage, ni soulignement, ni couleur de texte, ni fond.
const sansCouleur = (run) => !run.highlight && !run.underline && !run.color && !run.shading;

// ---------------------------------------------------------------------------
// 1. Champs de données : pointillés, sans couleur (E3-25)
// ---------------------------------------------------------------------------

// Échoue si une case connue ET remplie est surlignée, soulignée ou changée (la valeur doit être posée telle quelle).
test("case remplie : la valeur est posée telle quelle, sans pointillés, sans surlignage ni soulignement", async () => {
  const doc = await document("Entre [Nom du club] (SIRET [SIRET du club]).");
  assert.equal(texte(doc), "Entre Club Exemple (SIRET 12345678901234).");
  assert.equal(nbPointilles(doc), 0, "aucun pointillé");
  assert.deepEqual(surlignes(doc), [], "aucun surlignage");
  assert.deepEqual(soulignes(doc), [], "aucun soulignement");
});

// FUSION (2 tests -> 1) : « case vide » et « largeur de la bande » ne font plus qu'un, puisqu'il n'y a plus de bande
// de 20 ou 40 caractères : toutes les cases, adresses comprises, donnent la même suite de 56 points.
// Échoue si une case connue mais vide (quelle qu'elle soit, adresse de l'agence avec apostrophe droite ou courbe
// comprise) ne devient pas exactement 56 points ordinaires, si un surlignage, un soulignement, une couleur ou des
// espaces insécables (l'ancienne bande) reviennent, ou si les crochets restent.
test("case connue mais vide : 56 points ordinaires, sans couleur ni soulignement, pour toutes les cases (adresses comprises)", async () => {
  assert.equal(POINTILLES.length, 56);
  for (const nom of Object.keys(CASES)) {
    const doc = await document(`A [${nom}] B`, cases([nom]));
    assert.equal(texte(doc), `A ${POINTILLES} B`, nom);
    assert.equal(nbPointilles(doc), 1, nom);
    assert.ok(pointilles(doc).every(sansCouleur), `${nom} : ni surlignage, ni soulignement, ni couleur`);
    assert.deepEqual(surlignes(doc), [], nom);
    assert.deepEqual(soulignes(doc), [], nom);
    assert.ok(!texte(doc).includes(NBSP) && !texte(doc).includes("["), `${nom} : ni bande d'espaces insécables, ni crochets`);
  }
  const droite = await document("[Adresse de l'agence]", cases(["Adresse de l’agence"]));
  assert.equal(texte(droite), POINTILLES, "apostrophe droite tapée au clavier");
});

// Échoue si une case vide dans un passage en gras ou en italique perd la mise en forme de son entourage (ce que
// l'agent écrit sur les points doit garder le gras du texte), ou si elle prend une couleur.
test("case vide dans un passage en gras ou en italique : les pointillés gardent le gras ou l'italique, sans couleur", async () => {
  const gras = await document("**[Nom du club]**", cases(["Nom du club"]));
  assert.equal(nbPointilles(gras), 1);
  assert.deepEqual(pointilles(gras).map((run) => [run.bold, run.italics, sansCouleur(run)]), [[true, undefined, true]]);
  const italique = await document("*[Nom du club]*", cases(["Nom du club"]));
  assert.deepEqual(pointilles(italique).map((run) => [run.bold, run.italics, sansCouleur(run)]), [[undefined, true, true]]);
});

// Échoue si une case inconnue (qui n'est pas dans la liste officielle) est surlignée, remplacée ou perd ses crochets :
// elle reste écrite [Nom], comme dans le reste du texte (la génération est bloquée en amont, cases-inconnues).
test("case inconnue : reste écrite [Nom], sans surlignage", async () => {
  const doc = await document("Voir [Case inconnue] ici.");
  assert.equal(texte(doc), "Voir [Case inconnue] ici.");
  assert.deepEqual(surlignes(doc), []);
});

// Échoue si un crochet échappé (\[) est traité comme une case, ou si un lien [texte](adresse) est traité comme une
// case ou perd son adresse (le Word montre « texte (adresse) » en texte simple).
test("crochet échappé et lien : \\[ reste un crochet, [texte](adresse) reste en texte simple", async () => {
  const doc = await document("Un \\[crochet] et [la page](https://exemple.test/page).");
  assert.equal(texte(doc), "Un [crochet] et la page (https://exemple.test/page).");
  assert.deepEqual(surlignes(doc), []);
});

// ---------------------------------------------------------------------------
// 2. Zones écrites à la main : les mêmes pointillés (E3-25), plus aucun traitement à part
// ---------------------------------------------------------------------------

// FUSION (3 tests -> 2) : « Fait à… », « À…, le… » et « bloc de signature vide » avaient chacun sa règle (soulignement
// ou surlignage) ; il n'y a plus qu'une règle, vérifiée ici sur les deux variantes du bloc de signature.
// Échoue si « Fait à…, le… » (France Travail à gauche) n'est pas écrit « Fait à <56 points>, le <56 points> » en
// texte ordinaire, ou si un soulignement, un surlignage ou une bande d'espaces insécables revient.
test("« Fait à …, le … » : deux fois 56 points ordinaires, ni soulignés ni surlignés", async () => {
  const doc = await document("{signatures:ft-gauche}");
  assert.ok(texte(doc).includes(`Fait à ${POINTILLES}, le ${POINTILLES}`), texte(doc));
  assert.equal(nbPointilles(doc), 2, "deux zones en pointillés");
  assert.ok(pointilles(doc).every(sansCouleur));
  assert.deepEqual(soulignes(doc), [], "aucun soulignement");
  assert.deepEqual(surlignes(doc), [], "aucun surlignage");
  assert.ok(!texte(doc).includes(NBSP), "plus d'espaces insécables");
});

// Échoue si, avec la variante « lieu-date », il n'y a pas une ligne « À <56 points>, le <56 points> » par colonne
// (deux lignes, soit quatre zones en pointillés), ou si un soulignement ou un surlignage revient.
test("« À …, le … » de chaque colonne de signature : quatre zones en pointillés, sans soulignement ni surlignage", async () => {
  const doc = await document("{signatures:lieu-date}");
  assert.equal(paragraphes(doc).filter((p) => p.startsWith(`À ${POINTILLES}, le ${POINTILLES}`)).length, 2, "une ligne « À …, le … » par colonne");
  assert.equal(nbPointilles(doc), 4);
  assert.deepEqual(soulignes(doc), []);
  assert.deepEqual(surlignes(doc), []);
});

// Échoue si un nom ou une fonction vide du bloc de signature (signataire, fonction, représentant, fonction du
// représentant) ne devient pas une suite de 56 points sans couleur, si un surlignage revient, ou si l'intitulé de
// chaque colonne disparaît.
test("bloc de signature : un nom ou une fonction vide donne 56 points sans couleur, les intitulés restent", async () => {
  const doc = await document("{signatures}", cases(["Signataire du club", "Fonction du signataire", "Représentant de l’agence", "Fonction du représentant"]));
  assert.equal(nbPointilles(doc), 4, "quatre champs vides, quatre suites de 56 points");
  assert.ok(pointilles(doc).every(sansCouleur));
  assert.deepEqual(surlignes(doc), []);
  assert.ok(texte(doc).includes("Pour l'organisation sportive") && texte(doc).includes("Pour France Travail"));
  const rempli = await document("{signatures}");
  assert.ok(texte(rempli).includes("Camille Exemple") && texte(rempli).includes("Dana Exemple"));
  assert.equal(nbPointilles(rempli), 0, "rien à compléter quand tout est rempli");
  assert.deepEqual(surlignes(rempli), []);
});

// Échoue si le bloc de signature perd ses deux colonnes de même largeur, sa ligne qui ne se coupe pas entre deux
// pages, ou l'ordre des colonnes (club à gauche par défaut, France Travail à gauche avec ft-gauche).
test("bloc de signature : tableau à deux colonnes égales, ligne insécable, club à gauche (ou France Travail avec ft-gauche)", async () => {
  for (const [repere, premier] of [["{signatures}", "Pour l'organisation sportive"], ["{signatures:ft-gauche}", "Pour France Travail"]]) {
    const doc = await document(repere);
    const tableau = instances(doc, "Table")[0];
    assert.equal(tableau.options.rows.length, 1, "une seule ligne");
    assert.equal(tableau.options.rows[0].options.cantSplit, true, "la ligne ne se coupe pas entre deux pages");
    const [gauche, droite] = tableau.options.rows[0].options.children;
    assert.equal(gauche.options.width.size, droite.options.width.size, "colonnes de même largeur");
    const textesGauche = paragraphes(gauche).join("|");
    assert.ok(textesGauche.includes(premier), `${repere} : ${premier} à gauche`);
  }
});

// Échoue si le widget transforme des points laissés dans le texte d'un modèle (E3-20 B : « pas d'heuristique
// automatique sur les points tapés à la main ») : ils doivent rester de simples points, ni soulignés ni surlignés.
test("E3-20 B : des points tapés dans le modèle restent de simples points (ni soulignés, ni surlignés)", async () => {
  const doc = await document("Nombre d'opérations : ............. Date de fin : ..............");
  assert.equal(texte(doc), "Nombre d'opérations : ............. Date de fin : ..............");
  assert.deepEqual(surlignes(doc), []);
  assert.deepEqual(soulignes(doc), []);
});

// ---------------------------------------------------------------------------
// 3. Propriétés du fichier : valeurs neutres (E3-12)
// ---------------------------------------------------------------------------

// Échoue si l'auteur, le dernier auteur, le titre ou la description ne sont pas les valeurs neutres fixes, ou si une
// donnée du document (club, agence, signataire, SIRET, adresse) apparaît dans l'une des propriétés du fichier.
test("E3-12 : auteur, dernier auteur, titre et description sont fixes et neutres, aucune donnée de personne", async () => {
  const doc = await document("{signatures}");
  const proprietes = {creator: doc.options.creator, lastModifiedBy: doc.options.lastModifiedBy, title: doc.options.title, description: doc.options.description};
  assert.deepEqual(proprietes, {
    creator: "Partenariat simplifié",
    lastModifiedBy: "Partenariat simplifié",
    title: "Convention",
    description: "Convention générée par le tableau de bord Partenariat simplifié",
  });
  const lu = JSON.stringify([proprietes, doc.options.subject, doc.options.keywords, doc.options.company]);
  for (const valeur of Object.values(CASES)) assert.ok(!lu.includes(valeur), `« ${valeur} » ne doit pas être dans les propriétés`);
  // Le même Document donné avec d'autres valeurs a exactement les mêmes propriétés : elles ne dépendent pas des données.
  const autre = await document("{signatures}", cases([], {"Nom du club": "Autre Club", "Signataire du club": "Alex Modèle"}));
  assert.deepEqual({creator: autre.options.creator, lastModifiedBy: autre.options.lastModifiedBy, title: autre.options.title, description: autre.options.description}, proprietes);
});

// ---------------------------------------------------------------------------
// 4. Caractères spéciaux : toute valeur est du texte simple (E3-13)
// ---------------------------------------------------------------------------

const SPECIAUX = "A&B <C> \"D\" 'E'";

// Échoue si l'une des 11 cases, remplie de & < > " ' , n'arrive pas EXACTEMENT telle quelle dans le texte d'un seul
// TextRun (la bibliothèque s'occupe de l'échappement XML ; le widget n'assemble jamais de XML à la main) ou si un
// texte déjà échappé (&amp; &lt; &gt; &quot; &#39;) est fabriqué par le widget.
test("E3-13 : & < > \" ' dans chacune des 11 cases arrivent tels quels dans un TextRun, jamais échappés par le widget", async () => {
  for (const nom of Object.keys(CASES)) {
    const doc = await document(`Début [${nom}] fin.`, cases([], {[nom]: SPECIAUX}));
    assert.equal(texte(doc), `Début ${SPECIAUX} fin.`, nom);
    assert.equal(runsContenant(doc, SPECIAUX).length, 1, `${nom} : la valeur est dans un seul TextRun`);
    assert.ok(!/&(amp|lt|gt|quot|#39|#x27);/.test(texte(doc)), `${nom} : rien n'est échappé par le widget`);
  }
});

// Échoue si les cases du bloc de signature (signataire, fonction, représentant, fonction du représentant) échappent ou
// altèrent les caractères spéciaux.
test("E3-13 : & < > \" ' dans le bloc de signature arrivent tels quels", async () => {
  const valeurs = cases([], {
    "Signataire du club": `Camille ${SPECIAUX}`, "Fonction du signataire": `Pdte ${SPECIAUX}`,
    "Représentant de l’agence": `Dana ${SPECIAUX}`, "Fonction du représentant": `Dir. ${SPECIAUX}`,
  });
  const doc = await document("{signatures:lieu-date}", valeurs);
  for (const attendu of [`Camille ${SPECIAUX}`, `Pdte ${SPECIAUX}`, `Dana ${SPECIAUX}`, `Dir. ${SPECIAUX}`]) {
    assert.ok(paragraphes(doc).includes(attendu), `« ${attendu} » est un paragraphe tel quel`);
  }
  assert.ok(!/&(amp|lt|gt|quot|#39);/.test(texte(doc)));
});

// Échoue si une valeur qui ressemble à du balisage (<w:t>, <script>, [Autre case], {signatures}, **gras**) est interprétée
// comme du XML, comme une autre case ou comme de la mise en forme : une valeur de Grist n'est jamais du modèle.
test("E3-13 : une valeur qui ressemble à du balisage reste du texte, jamais interprétée", async () => {
  const bizarre = "<w:t>x</w:t> [SIRET du club] {signatures} **gras** <u>a</u>";
  const doc = await document("[Nom du club]", cases([], {"Nom du club": bizarre}));
  assert.equal(texte(doc), bizarre);
  const duTexte = runs(doc).filter((run) => run.text);
  assert.equal(duTexte.length, 1, "un seul TextRun de texte, sans mise en forme");
  assert.deepEqual([duTexte[0].bold, duTexte[0].underline, duTexte[0].highlight], [undefined, undefined, undefined]);
});

// Échoue si un caractère de contrôle (impossible dans un fichier Word : il le rendrait illisible) est gardé, ou si la
// tabulation, le retour à la ligne, le texte accentué ou un emoji sont supprimés à tort.
test("conventionTexteSur : retire les caractères de contrôle interdits, garde tabulation, retour à la ligne, accents et emoji", async () => {
  const w = await widget();
  assert.equal(w.conventionTexteSur("a\u0000b\u0008c\u000Bd\u000Ce\u001Ff￾g￿h"), "abcdefgh");
  assert.equal(w.conventionTexteSur("a\tb\nc é😀"), "a\tb\nc é😀");
  assert.equal(w.conventionTexteSur(null), "");
  assert.equal(w.conventionTexteSur(undefined), "");
  const doc = await document("[Nom du club]", cases([], {"Nom du club": "Club\u0000 Exemple\u001F"}));
  assert.equal(texte(doc), "Club Exemple", "un caractère de contrôle dans une valeur n'arrive jamais dans le document");
});

// ---------------------------------------------------------------------------
// 5. Mise en page (§15.9 : celle du PDF, police Arial)
// ---------------------------------------------------------------------------

// Échoue si la page n'est plus A4 (11906 × 16838 twips), les marges ne sont plus de 2,5 cm (1417 twips), la distance de
// l'en-tête et du pied à 1,25 cm (709 twips), si la première page n'a plus un pied vide (pas de numéro sur la page 1), si
// le numéro de page n'est plus à droite en 9 pt, ou si la première page n'est plus distinguée des autres.
test("page : A4, marges de 2,5 cm, numéro de page seul en bas à droite sauf sur la page 1", async () => {
  const doc = await document("# Titre\n\nTexte.");
  const {properties, footers} = section(doc);
  assert.deepEqual(JSON.parse(JSON.stringify(properties.page.size)), {width: 11906, height: 16838});
  assert.deepEqual(JSON.parse(JSON.stringify(properties.page.margin)), {top: 1417, right: 1417, bottom: 1417, left: 1417, header: 709, footer: 709});
  assert.equal(properties.titlePage, true);
  const numero = instances(footers.default, "TextRun")[0].options;
  assert.deepEqual([numero.children[0], numero.size], ["PageNumber.CURRENT", 18], "numéro de page en 9 pt");
  assert.equal(instances(footers.default, "Paragraph")[0].options.alignment, "AlignmentType.RIGHT");
  assert.equal(instances(footers.first, "TextRun").length, 0, "rien sur la page 1");
});

// Échoue si la police n'est plus Arial (Word n'embarque pas Roboto, §15.9), la taille 11 pt (22 demi-points), le texte
// justifié, l'interligne 1,2 (288), ou si un titre # n'est plus centré, en gras, en 12 pt et gardé avec ce qui suit.
test("styles : Arial 11 pt, justifié, interligne 1,2 ; le titre # est centré, en gras, 12 pt, gardé avec le texte suivant", async () => {
  const doc = await document("# Titre de la convention\n\nUn paragraphe.");
  const defaut = doc.options.styles.default.document;
  assert.equal(defaut.run.font, "Arial");
  assert.equal(defaut.run.size, 22);
  assert.equal(defaut.paragraph.alignment, "AlignmentType.JUSTIFIED");
  assert.equal(defaut.paragraph.spacing.line, 288);
  const titre = instances(doc, "Paragraph").find((p) => (p.options.children || []).some((c) => c.options && c.options.text === "Titre de la convention"));
  assert.equal(titre.options.alignment, "AlignmentType.CENTER");
  assert.equal(titre.options.keepNext, true, "un titre n'est jamais seul en bas de page");
  const run = titre.options.children[0].options;
  assert.deepEqual([run.bold, run.size], [true, 24]);
});

// Échoue si la police Roboto (celle du PDF) réapparaît dans le document : Arial seule.
test("aucune police autre qu'Arial dans le document", async () => {
  const doc = await document("# Titre\n\n**Gras** et *italique*.\n\n{signatures}");
  assert.ok(!JSON.stringify(doc.options).includes("Roboto"));
  assert.deepEqual([...new Set(runs(doc).map((run) => run.font).filter(Boolean))], [], "aucun TextRun ne force une autre police");
});

// ---------------------------------------------------------------------------
// 6. Structure du texte : listes, retraits, sauts de page, notes
// ---------------------------------------------------------------------------

// Échoue si une liste à tirets n'utilise plus la numérotation « convention-puces », si une liste numérotée ne repart pas de
// son premier numéro avec sa propre numérotation, ou si un retrait (> ) ne décale plus de 1,25 cm (709 twips).
test("listes à tirets, listes numérotées (début respecté) et retraits", async () => {
  const doc = await document("- un\n- deux\n\n3. trois\n4. quatre\n\n> cité");
  const elements = instances(doc, "Paragraph").filter((p) => p.options.numbering);
  assert.deepEqual(elements.map((p) => p.options.numbering.reference), ["convention-puces", "convention-puces", "convention-liste-1", "convention-liste-1"]);
  const numerotation = doc.options.numbering.config.find((c) => c.reference === "convention-liste-1");
  assert.equal(numerotation.levels[0].start, 3, "la liste numérotée repart de 3");
  const citation = instances(doc, "Paragraph").find((p) => (p.options.children || []).some((c) => c.options && c.options.text === "cité"));
  assert.equal(citation.options.indent.left, 709, "retrait de 1,25 cm");
});

// Échoue si {saut-de-page} ne force pas une nouvelle page pour le paragraphe suivant (et seulement lui).
test("{saut-de-page} : seul le paragraphe suivant commence une nouvelle page", async () => {
  const doc = await document("Avant.\n\n{saut-de-page}\n\nAprès.\n\nEncore après.");
  const par = (fragment) => instances(doc, "Paragraph").find((p) => (p.options.children || []).some((c) => c.options && c.options.text === fragment));
  assert.equal(par("Avant.").options.pageBreakBefore, undefined);
  assert.equal(par("Après.").options.pageBreakBefore, true);
  assert.equal(par("Encore après.").options.pageBreakBefore, undefined);
});

// Échoue si un appel de note cité deux fois fabrique deux notes, si une note citée avec son texte n'est pas une vraie
// note de bas de page (FootnoteReferenceRun + texte dans footnotes), ou si un appel sans texte de note devient une
// note au lieu d'un simple exposant.
test("notes de bas de page : un appel avec texte = vraie note, un second appel ou un appel sans texte = exposant", async () => {
  const doc = await document("Un[^1] deux[^1] trois[^2].\n\n[^1]: Texte de la note.");
  assert.equal(instances(doc, "FootnoteReferenceRun").length, 1, "une seule vraie note");
  assert.deepEqual(Object.keys(doc.options.footnotes), ["1"]);
  const noteTexte = instances(doc.options.footnotes[1], "TextRun").map((run) => run.options.text).join("");
  assert.equal(noteTexte, " Texte de la note.");
  const exposants = runs(doc).filter((run) => run.superScript);
  assert.deepEqual(exposants.map((run) => run.text), ["1", "2"], "le second appel de la note 1 et l'appel sans texte (note 2) restent des exposants");
});

// Échoue si une définition de note jamais citée apparaît quand même dans les notes (elle n'a pas d'appel).
test("notes de bas de page : une note définie mais jamais citée n'est pas imprimée", async () => {
  const doc = await document("Texte seul.\n\n[^9]: Note orpheline.");
  assert.deepEqual(Object.keys(doc.options.footnotes), []);
  assert.ok(!texte(doc).includes("orpheline"));
});

// Échoue si un modèle sans aucune mise en forme n'est plus rendu en paragraphes, ou si **gras**, *italique* et <u>souligné</u>
// du MODÈLE (pas des valeurs) perdent leur mise en forme.
test("mise en forme du modèle : **gras**, *italique*, <u>souligné</u>, <sup>exposant</sup>", async () => {
  const doc = await document("Un **gras**, un *italique*, un <u>souligné</u> et un <sup>exposant</sup>.");
  const par = (fragment) => runsContenant(doc, fragment)[0];
  assert.equal(par("gras").bold, true);
  assert.equal(par("italique").italics, true);
  assert.deepEqual(JSON.parse(JSON.stringify(par("souligné").underline)), {type: "single"});
  assert.equal(par("exposant").superScript, true);
  assert.equal(texte(doc), "Un gras, un italique, un souligné et un exposant.");
});

// ---------------------------------------------------------------------------
// 7. Logos : en-tête de la page 1 seulement (détails dans test/convention-logos.test.js)
// ---------------------------------------------------------------------------

// Échoue si, sans logo donné, le document a un en-tête (aucune image n'est jamais inventée).
test("sans logo : aucun en-tête ni image dans le Word", async () => {
  const doc = await document("# Titre");
  assert.equal(enteteDeLaPremierePage(doc), null);
  assert.equal(instances(doc, "ImageRun").length, 0);
});
