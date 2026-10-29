"use strict";

// Tests de conventionVersContenuPdf : texte d'un modele de convention (Markdown
// simple) -> tableau de blocs pdfmake. Chaque test compare la structure complete.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget.js");

const w = loadWidget();

// Les tableaux fabriques dans le bac a sable n'ont pas le prototype Array de
// l'hote : on les ramene a des valeurs simples avant de comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));
const convertir = (texte) => plain(w.conventionVersContenuPdf(texte));
// Un élément de liste porte le style elementListe (les 6 pt d'espace après), voir §11.
const ITEM = (text) => ({text, style: "elementListe"});

test("deux paragraphes séparés par une ligne vide ; un retour à la ligne simple reste dans le paragraphe", () => {
  assert.deepStrictEqual(convertir("Première ligne\nSuite du même paragraphe\n\nSecond paragraphe"), [
    {text: ["Première ligne", "\n", "Suite du même paragraphe"], style: "paragraphe"},
    {text: "Second paragraphe", style: "paragraphe"},
  ]);
});

test("titres #, ## et ### avec le style titre1, titre2 et titre3", () => {
  assert.deepStrictEqual(convertir("# Un\n## Deux\n### Trois"), [
    {text: "Un", style: "titre1", headlineLevel: 1},
    {text: "Deux", style: "titre2", headlineLevel: 1},
    {text: "Trois", style: "titre3", headlineLevel: 1},
  ]);
});

test("titre ## avec du gras dedans : le gras est retiré car le style le porte déjà", () => {
  assert.deepStrictEqual(convertir("## **Article 3 : Rôle des parties prenantes**"), [
    {text: "Article 3 : Rôle des parties prenantes", style: "titre2", headlineLevel: 1},
  ]);
});

test("titre ## avec un mot en gras au milieu : le texte reste découpé, sans l'attribut gras", () => {
  assert.deepStrictEqual(convertir("## Article **3** fin"), [
    {text: ["Article ", "3", " fin"], style: "titre2", headlineLevel: 1},
  ]);
});

test("ligne entièrement en gras : elle prend le style titre", () => {
  assert.deepStrictEqual(convertir("**Article 1 : Objet de la convention**"), [
    {text: "Article 1 : Objet de la convention", style: "titre", headlineLevel: 1},
  ]);
});

test("retrait d'une seule ligne : > **4.1 Rôle de France Travail**", () => {
  assert.deepStrictEqual(convertir("> **4.1 Rôle de France Travail**"), [
    {stack: [{text: "4.1 Rôle de France Travail", style: "titre", headlineLevel: 1}], style: "retrait"},
  ]);
});

test("retrait de plusieurs lignes : une ligne contenant seulement > sépare deux paragraphes dans le retrait", () => {
  assert.deepStrictEqual(convertir("> Première\n>\n> Deuxième\n> suite"), [
    {
      stack: [
        {text: "Première", style: "paragraphe"},
        {text: ["Deuxième", "\n", "suite"], style: "paragraphe"},
      ],
      style: "retrait",
    },
  ]);
});

test("liste à puces, et deux listes séparées par une ligne vide", () => {
  assert.deepStrictEqual(convertir("- a\n- b"), [
    {ul: [ITEM("a"), ITEM("b")], style: "liste"},
  ]);
  assert.deepStrictEqual(convertir("- a\n- b\n\n- c"), [
    {ul: [ITEM("a"), ITEM("b")], style: "liste"},
    {ul: [ITEM("c")], style: "liste"},
  ]);
});

test("liste numérotée 1. 2. 3. sans start", () => {
  assert.deepStrictEqual(convertir("1. un\n2. deux\n3. trois"), [
    {ol: [ITEM("un"), ITEM("deux"), ITEM("trois")], style: "liste"},
  ]);
});

test("liste numérotée qui ne commence pas à 1 : start reprend le premier numéro", () => {
  assert.deepStrictEqual(convertir("3. trois\n4. quatre"), [
    {ol: [ITEM("trois"), ITEM("quatre")], style: "liste", start: 3},
  ]);
});

test("gras au milieu d'une phrase", () => {
  assert.deepStrictEqual(convertir("souffrent d'un **manque d'attractivité** pour des raisons"), [
    {text: ["souffrent d'un ", {text: "manque d'attractivité", bold: true}, " pour des raisons"], style: "paragraphe"},
  ]);
});

test("gras en début de paragraphe : ce n'est pas un titre", () => {
  assert.deepStrictEqual(convertir("**Préambule** Pour 2026, et devant"), [
    {text: [{text: "Préambule", bold: true}, " Pour 2026, et devant"], style: "paragraphe"},
  ]);
});

test("italique : *soft skills*", () => {
  assert.deepStrictEqual(convertir("les comportements et *soft skills* des demandeurs d'emploi"), [
    {text: ["les comportements et ", {text: "soft skills", italics: true}, " des demandeurs d'emploi"], style: "paragraphe"},
  ]);
});

test("souligné dans le gras : ligne en titre, le souligné est gardé", () => {
  assert.deepStrictEqual(convertir("**<u>3.1 - Rôle l'organisation sportive</u>**"), [
    {text: [{text: "3.1 - Rôle l'organisation sportive", decoration: "underline"}], style: "titre", headlineLevel: 1},
  ]);
});

test("exposant dans le gras : 1<sup>er</sup> reste en gras, er est en exposant", () => {
  assert.deepStrictEqual(convertir("**1<sup>er</sup> temps (1H15) :** Une activité sportive"), [
    {
      text: [
        {text: "1", bold: true},
        {text: "er", bold: true, sup: true},
        {text: " temps (1H15) :", bold: true},
        " Une activité sportive",
      ],
      style: "paragraphe",
    },
  ]);
});

test("commentaire HTML vide seul sur sa ligne : il disparaît et sépare deux listes", () => {
  assert.deepStrictEqual(convertir("- a\n- b\n<!-- -->\n- c\n- d"), [
    {ul: [ITEM("a"), ITEM("b")], style: "liste"},
    {ul: [ITEM("c"), ITEM("d")], style: "liste"},
  ]);
});

test("lien : le texte est suivi de l'adresse entre parenthèses", () => {
  assert.deepStrictEqual(
    convertir("Il est disponible sur le [site des clubs sportifs engagés](https://lesclubs-sportifs-engages.francetravail.fr/action/le-sport-pour-redonner-confiance)."),
    [{
      text: "Il est disponible sur le site des clubs sportifs engagés (https://lesclubs-sportifs-engages.francetravail.fr/action/le-sport-pour-redonner-confiance).",
      style: "paragraphe",
    }]
  );
});

test("cases entre crochets et pointillés gardés tels quels", () => {
  const texte = "[Nom du club] dont le siège est [Siège du club] ; s'appliquent jusqu'au .............................";
  assert.deepStrictEqual(convertir(texte), [{text: texte, style: "paragraphe"}]);
});

test("case suivie d'un espace puis d'une parenthèse : reste une case, pas un lien", () => {
  assert.deepStrictEqual(convertir("[Nom] (x)"), [{text: "[Nom] (x)", style: "paragraphe"}]);
});

test("note : l'appel devient un 1 en exposant, la définition quitte le corps et passe en dernier avec le style note", () => {
  const texte = "Le club fourni[^1] dans le texte.\n\n[^1]: France Travail, dans son rôle d'accueil…\n\nAutre paragraphe";
  assert.deepStrictEqual(convertir(texte), [
    {text: ["Le club fourni", {text: "1", sup: true}, " dans le texte."], style: "paragraphe"},
    {text: "Autre paragraphe", style: "paragraphe"},
    {text: [{text: "1", sup: true}, " ", "France Travail, dans son rôle d'accueil…"], style: "note", margin: [0, 12, 0, 0]},
  ]);
});

test("marqueur sans fermeture : a * b reste du texte", () => {
  assert.deepStrictEqual(convertir("a * b"), [{text: "a * b", style: "paragraphe"}]);
});

test("texte vide : résultat vide, sans erreur", () => {
  assert.deepStrictEqual(convertir(""), []);
  assert.deepStrictEqual(convertir(null), []);
  assert.deepStrictEqual(convertir(undefined), []);
});

// ---- Remplissage des cases [Nom] (tâche 2.4) ----

const remplir = (texte, valeurs) => plain(w.conventionVersContenuPdf(texte, valeurs));
const manquantes = (texte, valeurs) => plain(w.conventionCasesManquantes(texte, valeurs));

test("cases remplies dans un paragraphe : [Nom du club] et [Siège du club] prennent leur valeur", () => {
  assert.deepStrictEqual(
    remplir("Le club [Nom du club] dont le siège est [Siège du club].", {"Nom du club": "Club Alpha", "Siège du club": "1 rue des Sports, Lyon"}),
    [{text: "Le club Club Alpha dont le siège est 1 rue des Sports, Lyon.", style: "paragraphe"}]
  );
});

test("case dans du gras : la valeur remplace la case et reste en gras", () => {
  assert.deepStrictEqual(remplir("Le club **[Nom du club]** signe", {"Nom du club": "Club Alpha"}), [
    {text: ["Le club ", {text: "Club Alpha", bold: true}, " signe"], style: "paragraphe"},
  ]);
});

test("case dans un titre : la valeur est dans le texte du titre", () => {
  assert.deepStrictEqual(remplir("## Convention avec [Nom du club]", {"Nom du club": "Club Alpha"}), [
    {text: "Convention avec Club Alpha", style: "titre2", headlineLevel: 1},
  ]);
});

test("case dans un élément de liste : la valeur est dans l'élément", () => {
  assert.deepStrictEqual(remplir("- Siège : [Siège du club]\n- Autre", {"Siège du club": "1 rue des Sports"}), [
    {ul: [ITEM("Siège : 1 rue des Sports"), ITEM("Autre")], style: "liste"},
  ]);
});

test("case dans un retrait (>) : la valeur est dans le paragraphe du retrait", () => {
  assert.deepStrictEqual(remplir("> Le club [Nom du club] s'engage", {"Nom du club": "Club Alpha"}), [
    {stack: [{text: "Le club Club Alpha s'engage", style: "paragraphe"}], style: "retrait"},
  ]);
});

test("case dans le texte d'une note : la valeur est dans la note rangée en dernier", () => {
  assert.deepStrictEqual(remplir("Texte[^1]\n\n[^1]: Défini par [Nom du club]", {"Nom du club": "Club Alpha"}), [
    {text: ["Texte", {text: "1", sup: true}], style: "paragraphe"},
    {text: [{text: "1", sup: true}, " ", "Défini par Club Alpha"], style: "note", margin: [0, 12, 0, 0]},
  ]);
});

test("valeur avec caractères spéciaux (A**B [x] #1 > -) : posée comme texte, sans gras, sans case, sans titre ni retrait", () => {
  const valeur = "A**B [x] #1 > -";
  assert.deepStrictEqual(remplir("Le club [Nom du club] signe", {"Nom du club": valeur, x: "NON"}), [
    {text: "Le club A**B [x] #1 > - signe", style: "paragraphe"},
  ]);
  // Case seule sur sa ligne : la valeur ne devient ni titre, ni retrait, ni liste.
  assert.deepStrictEqual(remplir("[Nom du club]", {"Nom du club": valeur, x: "NON"}), [
    {text: valeur, style: "paragraphe"},
  ]);
});

test("apostrophe typographique : [Adresse de l’agence] est remplie avec la clé écrite avec ’", () => {
  assert.deepStrictEqual(remplir("Adresse : [Adresse de l’agence]", {"Adresse de l’agence": "3 rue B"}), [
    {text: "Adresse : 3 rue B", style: "paragraphe"},
  ]);
});

// Échoue si l'apostrophe droite ' et l'apostrophe courbe ’ ne sont plus la même lettre dans une clé.
test("apostrophe : une clé écrite avec l'apostrophe droite ' remplit la case écrite avec ’", () => {
  assert.deepStrictEqual(remplir("Adresse : [Adresse de l’agence]", {"Adresse de l'agence": "3 rue B"}), [
    {text: "Adresse : 3 rue B", style: "paragraphe"},
  ]);
  assert.deepStrictEqual(manquantes("Adresse : [Adresse de l’agence]", {"Adresse de l'agence": "3 rue B"}), []);
});

// Échoue si une case tapée avec l'apostrophe droite ne trouve plus la clé écrite avec ’.
test("apostrophe : une case écrite avec ' dans le modèle est remplie par la clé écrite avec ’", () => {
  assert.deepStrictEqual(remplir("Adresse : [Adresse de l'agence]", {"Adresse de l’agence": "3 rue B"}), [
    {text: "Adresse : 3 rue B", style: "paragraphe"},
  ]);
  assert.deepStrictEqual(manquantes("Adresse : [Adresse de l'agence]", {"Adresse de l’agence": "3 rue B"}), []);
});

// Échoue si un autre caractère que l'apostrophe (ici l'accent grave) est confondu avec elle.
test("apostrophe : une clé avec une autre ponctuation (accent grave) ne remplit pas la case", () => {
  assert.deepStrictEqual(manquantes("Adresse : [Adresse de l’agence]", {"Adresse de l`agence": "3 rue B"}), ["Adresse de l’agence"]);
});

// ---- Cases connues mais vides, cases inconnues (décision du 2026-10-23) ----

const POINTILLES = ".".repeat(56);
const CASES_CONNUES = [
  "Année", "Nom du club", "SIRET du club", "Siège du club", "Signataire du club", "Fonction du signataire",
  "Nom de l’agence", "Adresse de l’agence", "SIRET de l’agence", "Représentant de l’agence", "Fonction du représentant",
];

// Jeu d'essai fictif : une action, un club, une agence, un contact. `club`, `agence` et `modele` changent un détail.
function donneesCases({club = {}, agence = {}, modele = {}} = {}) {
  return {
    raw: {
      Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
      Structures: [{id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer", ...club}],
      Agences: [{id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Code_postal: "75002", Ville: "Exemple-Ville", Siret: "98765432109876", ...agence}],
      Modeles_convention: [{id: 10, Dispositif: 3, Actif: true, Avec_annee: true, ...modele}],
      Contacts: [{id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"}],
      Conventions: [],
    },
    tablesRefusees: [],
  };
}
const VALEURS_FORMULAIRE = {annee: "2026", signataire: 31, representant: "Alex Test", fonctionRepresentant: "Directeur"};
const valeursCases = (donnees, valeurs = VALEURS_FORMULAIRE) => plain(w.conventionValeursCases(1, valeurs, donnees));

// Échoue si une case connue remplie n'a plus sa valeur, ou si une case est laissée sans valeur.
test("cases connues toutes remplies : aucun pointillé, aucune case manquante", () => {
  const cases = valeursCases(donneesCases());
  assert.equal(cases["SIRET du club"], "12345678901234");
  assert.equal(cases["Signataire du club"], "Camille Exemple");
  assert.equal(cases["SIRET de l’agence"], "98765432109876");
  assert.equal(CASES_CONNUES.length, 11);
  assert.deepStrictEqual(Object.keys(cases).sort(), [...CASES_CONNUES].sort());
  assert.ok(Object.values(cases).every(valeur => valeur !== POINTILLES));
  assert.deepStrictEqual(manquantes(CASES_CONNUES.map(nom => `[${nom}]`).join(" "), cases), []);
});

// Échoue si une case connue mais vide (club sans SIRET) n'est plus remplacée par 56 points.
test("case connue mais vide (club sans SIRET) : valeur = 56 points, les autres cases gardent leur valeur", () => {
  const cases = valeursCases(donneesCases({club: {SIRET: ""}}));
  assert.equal(POINTILLES.length, 56);
  assert.equal(cases["SIRET du club"], POINTILLES);
  assert.equal(cases["Nom du club"], "Club Exemple");
});

// Échoue si une case connue mais vide bloque encore la génération (case listée comme manquante).
test("case connue mais vide : pas de blocage (aucune case manquante) et le PDF reçoit les points", () => {
  const cases = valeursCases(donneesCases({club: {SIRET: ""}}));
  assert.deepStrictEqual(manquantes("SIRET : [SIRET du club]", cases), []);
  assert.deepStrictEqual(remplir("SIRET : [SIRET du club]", cases), [{text: `SIRET : ${POINTILLES}`, style: "paragraphe"}]);
});

// Échoue si [SIRET de l’agence] n'est plus remplie par Agences.Siret (ou prend le SIRET du club).
test("[SIRET de l’agence] : remplie par le SIRET de l'agence, distinct de celui du club", () => {
  const cases = valeursCases(donneesCases());
  assert.equal(cases["SIRET de l’agence"], "98765432109876");
  assert.notEqual(cases["SIRET de l’agence"], cases["SIRET du club"]);
  assert.deepStrictEqual(remplir("SIRET : [SIRET de l’agence]", cases), [{text: "SIRET : 98765432109876", style: "paragraphe"}]);
});

// Échoue si un SIRET d'agence vide (ou fait d'espaces) ne devient plus 56 points, ou bloque la génération.
test("[SIRET de l’agence] vide ou faite d'espaces : 56 points, aucune case manquante, génération non bloquée", () => {
  ["", "   "].forEach(vide => {
    const cases = valeursCases(donneesCases({agence: {Siret: vide}}));
    assert.equal(cases["SIRET de l’agence"], POINTILLES);
    assert.deepStrictEqual(manquantes("SIRET : [SIRET de l’agence]", cases), []);
    assert.deepStrictEqual(remplir("SIRET : [SIRET de l’agence]", cases), [{text: `SIRET : ${POINTILLES}`, style: "paragraphe"}]);
    assert.equal(cases["Nom de l’agence"], "Agence Exemple");
  });
});

// Échoue si la case écrite avec l'apostrophe droite ' ou courbe ’ n'est plus reconnue et remplie.
test("[SIRET de l'agence] : apostrophe droite ou courbe dans le modèle, la case est remplie dans les deux cas", () => {
  const cases = valeursCases(donneesCases());
  ["SIRET de l'agence", "SIRET de l’agence"].forEach(nom => {
    assert.deepStrictEqual(manquantes(`SIRET : [${nom}]`, cases), []);
    assert.deepStrictEqual(remplir(`SIRET : [${nom}]`, cases), [{text: "SIRET : 98765432109876", style: "paragraphe"}]);
  });
});

// Échoue si un champ du formulaire laissé vide (ou espaces) ne devient plus des points.
test("cases du formulaire vides ou faites d'espaces (représentant, fonction) : 56 points", () => {
  const cases = valeursCases(donneesCases(), {...VALEURS_FORMULAIRE, representant: "   ", fonctionRepresentant: ""});
  assert.equal(cases["Représentant de l’agence"], POINTILLES);
  assert.equal(cases["Fonction du représentant"], POINTILLES);
});

// Échoue si une case inconnue ne bloque plus, ou si son nom change (l'apostrophe doit rester celle du modèle).
test("case inconnue : reste bloquante, avec son nom tel qu'écrit dans le modèle", () => {
  const cases = valeursCases(donneesCases());
  assert.deepStrictEqual(manquantes("Voir [Numéro de dossier] et [Code de l'agence]", cases), ["Numéro de dossier", "Code de l'agence"]);
  assert.deepStrictEqual(manquantes("Voir [Code de l’agence]", cases), ["Code de l’agence"]);
});

// Échoue si une case inconnue est remplacée par des points au lieu de rester écrite entre crochets.
test("case inconnue : reste écrite [Nom] dans le PDF, jamais remplacée par des points", () => {
  const cases = valeursCases(donneesCases());
  assert.deepStrictEqual(remplir("Dossier : [Numéro de dossier]", cases), [{text: "Dossier : [Numéro de dossier]", style: "paragraphe"}]);
});

// Échoue si [Année] est reconnue dans un modèle sans année (Avec_annee = faux).
test("[Année] dans un modèle sans année : case inconnue, donc bloquante", () => {
  const cases = valeursCases(donneesCases({modele: {Avec_annee: false}}));
  assert.ok(!("Année" in cases));
  assert.deepStrictEqual(manquantes("Année : [Année]", cases), ["Année"]);
});

// Échoue si [Année] cesse d'être une case connue dans un modèle qui demande une année.
test("[Année] dans un modèle avec année : case connue et remplie", () => {
  const cases = valeursCases(donneesCases());
  assert.deepStrictEqual(manquantes("Année : [Année]", cases), []);
  assert.deepStrictEqual(remplir("Année : [Année]", cases), [{text: "Année : 2026", style: "paragraphe"}]);
});

test("case sans valeur (clé absente) : reste écrite [Nom] dans le texte", () => {
  assert.deepStrictEqual(remplir("Bonjour [Nom]", {}), [{text: "Bonjour [Nom]", style: "paragraphe"}]);
  assert.deepStrictEqual(remplir("Bonjour [Nom]", {Autre: "x"}), [{text: "Bonjour [Nom]", style: "paragraphe"}]);
});

test("case sans valeur (valeur vide, null ou undefined) : reste écrite [Nom] dans le texte", () => {
  const attendu = [{text: "Bonjour [Nom]", style: "paragraphe"}];
  assert.deepStrictEqual(remplir("Bonjour [Nom]", {Nom: ""}), attendu);
  assert.deepStrictEqual(remplir("Bonjour [Nom]", {Nom: null}), attendu);
  assert.deepStrictEqual(remplir("Bonjour [Nom]", {Nom: undefined}), attendu);
});

test("\\[x] imprime [x] et n'est pas une case, même si la clé x a une valeur", () => {
  assert.deepStrictEqual(remplir("Voir \\[x] ici", {x: "NON"}), [{text: "Voir [x] ici", style: "paragraphe"}]);
  assert.deepStrictEqual(manquantes("Voir \\[x] ici", {}), []);
});

test("liens [texte](adresse) : jamais remplacés par une valeur, jamais listés comme cases", () => {
  const texte = "Voir [texte](https://exemple.fr) ici";
  assert.deepStrictEqual(remplir(texte, {texte: "NON"}), [
    {text: "Voir texte (https://exemple.fr) ici", style: "paragraphe"},
  ]);
  assert.deepStrictEqual(manquantes(texte, {}), []);
});

test("notes [^1] : jamais remplacées par une valeur, jamais listées comme cases", () => {
  const texte = "Voir[^1] ici\n\n[^1]: Texte de la note";
  assert.deepStrictEqual(remplir(texte, {"^1": "NON", "1": "NON"}), [
    {text: ["Voir", {text: "1", sup: true}, " ici"], style: "paragraphe"},
    {text: [{text: "1", sup: true}, " ", "Texte de la note"], style: "note", margin: [0, 12, 0, 0]},
  ]);
  assert.deepStrictEqual(manquantes(texte, {}), []);
});

test("conventionCasesManquantes : une clé absente est listée", () => {
  assert.deepStrictEqual(manquantes("[A] et [B]", {A: "1"}), ["B"]);
});

test("conventionCasesManquantes : une valeur vide ou null est listée", () => {
  assert.deepStrictEqual(manquantes("[A] [B] [C]", {A: "", B: null, C: "ok"}), ["A", "B"]);
});

test("conventionCasesManquantes : une case en double n'est listée qu'une seule fois", () => {
  assert.deepStrictEqual(manquantes("[A] puis [B] puis [A] puis [B] puis [A]", {}), ["A", "B"]);
});

test("conventionCasesManquantes : l'ordre est celui de la première apparition dans le texte", () => {
  assert.deepStrictEqual(manquantes("[Zèbre] [Alpha]\n\n[Milieu] [Zèbre]", {}), ["Zèbre", "Alpha", "Milieu"]);
});

test("conventionCasesManquantes : liste vide quand tout est rempli, ou quand le texte n'a pas de case ou est vide", () => {
  assert.deepStrictEqual(manquantes("[A] et [B]", {A: "1", B: "2"}), []);
  assert.deepStrictEqual(manquantes("Aucune case ici", {}), []);
  assert.deepStrictEqual(manquantes("", {}), []);
  assert.deepStrictEqual(manquantes(null, undefined), []);
});

test("une clé comme constructor, toString ou __proto__ n'est pas prise pour une valeur", () => {
  const texte = "[constructor] [toString] [__proto__] [hasOwnProperty]";
  assert.deepStrictEqual(remplir(texte, {}), [{text: texte, style: "paragraphe"}]);
  assert.deepStrictEqual(manquantes(texte, {}), ["constructor", "toString", "__proto__", "hasOwnProperty"]);
});

test("une clé constructor écrite dans l'objet est bien une valeur", () => {
  assert.deepStrictEqual(remplir("[constructor]", {constructor: "Maçonnerie"}), [{text: "Maçonnerie", style: "paragraphe"}]);
  assert.deepStrictEqual(manquantes("[constructor]", {constructor: "Maçonnerie"}), []);
});

test("tout texte entre crochets est une case (voulu) : [1] sans valeur est listé comme manquant", () => {
  assert.deepStrictEqual(manquantes("Article [1] du code", {}), ["1"]);
  assert.deepStrictEqual(remplir("Article [1] du code", {}), [{text: "Article [1] du code", style: "paragraphe"}]);
  assert.deepStrictEqual(remplir("Article [1] du code", {"1": "premier"}), [{text: "Article premier du code", style: "paragraphe"}]);
});

// ---- Repères, notes renumérotées et description du PDF (tâche 2.6) ----

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// CONVENTION_MISE_EN_PAGE est une `const` du script, que le bac à sable ne
// laisse pas voir : on relit sa déclaration dans les sources, pour que les
// tests suivent les réglages sans les recopier. Elle dépend de
// CONVENTION_POINTS_PAR_CM : on relit aussi cette constante, et on évalue les
// deux ensemble, donc l'ordre des déclarations dans script.js ne compte pas.
const SOURCE_SCRIPT = fs.readFileSync(path.join(__dirname, "..", "src", "actions-dashboard", "script.js"), "utf8");
const POINTS_PAR_CM = (() => {
  const m = /const CONVENTION_POINTS_PAR_CM = ([0-9.]+);/.exec(SOURCE_SCRIPT);
  assert.ok(m, "la déclaration de CONVENTION_POINTS_PAR_CM est introuvable dans script.js");
  return Number(m[1]);
})();
const MISE_EN_PAGE = (() => {
  const m = /const CONVENTION_MISE_EN_PAGE = (\{[\s\S]*?\n\});/.exec(SOURCE_SCRIPT);
  assert.ok(m, "la déclaration de CONVENTION_MISE_EN_PAGE est introuvable dans script.js");
  return plain(vm.runInNewContext(`const CONVENTION_POINTS_PAR_CM = ${POINTS_PAR_CM}; (${m[1]})`));
})();

const problemesNotes = (texte) => plain(w.conventionProblemesNotes(texte));
const documentPdf = (texte, valeurs, options) => w.conventionDocumentPdf(texte, valeurs, options);

const SIGNATURES_VALEURS = {
  "Signataire du club": "Camille Martin",
  "Fonction du signataire": "Présidente",
  "Représentant de l’agence": "Alex Durand",
  "Fonction du représentant": "Directeur d’agence",
};
const LIEU_DATE = {text: "À ........................................................, le ........................................................", style: "paragraphe"};
const LIGNES_VIDES = "\n".repeat(MISE_EN_PAGE.signatures.lignesVides);

test("{saut-de-page} seul sur sa ligne : saut de page à cet endroit, entre les deux paragraphes", () => {
  assert.deepStrictEqual(convertir("Avant\n\n{saut-de-page}\n\nAprès"), [
    {text: "Avant", style: "paragraphe"},
    {text: "", pageBreak: "after"},
    {text: "Après", style: "paragraphe"},
  ]);
  // Sans ligne vide autour : le repère ferme quand même le paragraphe en cours.
  assert.deepStrictEqual(convertir("Avant\n{saut-de-page}\nAprès"), [
    {text: "Avant", style: "paragraphe"},
    {text: "", pageBreak: "after"},
    {text: "Après", style: "paragraphe"},
  ]);
});

test("{saut-de-page} écrit au milieu d'une phrase : reste du texte, pas de saut de page", () => {
  assert.deepStrictEqual(convertir("Avant {saut-de-page} après"), [
    {text: "Avant {saut-de-page} après", style: "paragraphe"},
  ]);
});

test("{signatures} avec les 4 valeurs : deux colonnes (organisation sportive à gauche, France Travail à droite), noms en gras, d'un seul tenant", () => {
  assert.deepStrictEqual(remplir("{signatures}", SIGNATURES_VALEURS), [
    {
      columns: [
        {
          width: "*",
          stack: [
            {text: "Pour l'organisation sportive", style: "paragraphe"},
            {text: "Camille Martin", bold: true, style: "paragraphe"},
            {text: "Présidente", style: "paragraphe"},
            {text: LIGNES_VIDES, style: "paragraphe"},
          ],
        },
        {
          width: "*",
          stack: [
            {text: "Pour France Travail", style: "paragraphe"},
            {text: "Alex Durand", bold: true, style: "paragraphe"},
            {text: "Directeur d’agence", style: "paragraphe"},
            {text: LIGNES_VIDES, style: "paragraphe"},
          ],
        },
      ],
      columnGap: MISE_EN_PAGE.signatures.espaceEntreColonnes,
      unbreakable: true,
    },
  ]);
});

test("{signatures} sans valeurs : les quatre cases restent écrites [Nom]", () => {
  const attendu = [
    {
      columns: [
        {
          width: "*",
          stack: [
            {text: "Pour l'organisation sportive", style: "paragraphe"},
            {text: "[Signataire du club]", bold: true, style: "paragraphe"},
            {text: "[Fonction du signataire]", style: "paragraphe"},
            {text: LIGNES_VIDES, style: "paragraphe"},
          ],
        },
        {
          width: "*",
          stack: [
            {text: "Pour France Travail", style: "paragraphe"},
            {text: "[Représentant de l’agence]", bold: true, style: "paragraphe"},
            {text: "[Fonction du représentant]", style: "paragraphe"},
            {text: LIGNES_VIDES, style: "paragraphe"},
          ],
        },
      ],
      columnGap: MISE_EN_PAGE.signatures.espaceEntreColonnes,
      unbreakable: true,
    },
  ];
  assert.deepStrictEqual(convertir("{signatures}"), attendu);
  assert.deepStrictEqual(remplir("{signatures}", {}), attendu);
});

test("{signatures:lieu-date} : chaque colonne commence par la ligne « À ……, le …… »", () => {
  assert.deepStrictEqual(remplir("{signatures:lieu-date}", SIGNATURES_VALEURS), [
    {
      columns: [
        {
          width: "*",
          stack: [
            LIEU_DATE,
            {text: "Pour l'organisation sportive", style: "paragraphe"},
            {text: "Camille Martin", bold: true, style: "paragraphe"},
            {text: "Présidente", style: "paragraphe"},
            {text: LIGNES_VIDES, style: "paragraphe"},
          ],
        },
        {
          width: "*",
          stack: [
            LIEU_DATE,
            {text: "Pour France Travail", style: "paragraphe"},
            {text: "Alex Durand", bold: true, style: "paragraphe"},
            {text: "Directeur d’agence", style: "paragraphe"},
            {text: LIGNES_VIDES, style: "paragraphe"},
          ],
        },
      ],
      columnGap: MISE_EN_PAGE.signatures.espaceEntreColonnes,
      unbreakable: true,
    },
  ]);
});

test("{saut-de-page} dans un retrait (>) : reste du texte, les repères ne marchent qu'au premier niveau (comportement voulu)", () => {
  assert.deepStrictEqual(convertir("> {saut-de-page}"), [
    {stack: [{text: "{saut-de-page}", style: "paragraphe"}], style: "retrait"},
  ]);
});

test("{signatures} et {signatures:lieu-date} dans un retrait (>) : restent du texte (comportement voulu)", () => {
  assert.deepStrictEqual(convertir("> {signatures}\n>\n> {signatures:lieu-date}"), [
    {
      stack: [
        {text: "{signatures}", style: "paragraphe"},
        {text: "{signatures:lieu-date}", style: "paragraphe"},
      ],
      style: "retrait",
    },
  ]);
});

test("notes renumérotées : [^a] puis [^2] appelées dans cet ordre deviennent 1 et 2 ; un deuxième appel garde son numéro ; textes rangés par numéro à la fin", () => {
  const texte = "Un[^a] deux[^2] encore[^a]\n\n[^2]: Texte de la note deux\n[^a]: Texte de la note a";
  assert.deepStrictEqual(convertir(texte), [
    {text: ["Un", {text: "1", sup: true}, " deux", {text: "2", sup: true}, " encore", {text: "1", sup: true}], style: "paragraphe"},
    {text: [{text: "1", sup: true}, " ", "Texte de la note a"], style: "note", margin: [0, 12, 0, 0]},
    {text: [{text: "2", sup: true}, " ", "Texte de la note deux"], style: "note"},
  ]);
});

test("note définie deux fois avec la même étiquette : seule la première définition est gardée", () => {
  assert.deepStrictEqual(convertir("Appel[^1]\n\n[^1]: Première définition\n[^1]: Seconde définition"), [
    {text: ["Appel", {text: "1", sup: true}], style: "paragraphe"},
    {text: [{text: "1", sup: true}, " ", "Première définition"], style: "note", margin: [0, 12, 0, 0]},
  ]);
});

test("conventionProblemesNotes : un appel sans texte est signalé", () => {
  assert.deepStrictEqual(problemesNotes("Texte[^x]"), [{type: "appel sans texte", etiquette: "x"}]);
});

test("conventionProblemesNotes : un texte sans appel est signalé", () => {
  assert.deepStrictEqual(problemesNotes("Texte\n\n[^y]: Note jamais appelée"), [{type: "texte sans appel", etiquette: "y"}]);
});

test("conventionProblemesNotes : les deux à la fois, les appels sans texte d'abord (dans l'ordre des appels), puis les textes sans appel (dans l'ordre des définitions)", () => {
  assert.deepStrictEqual(problemesNotes("A[^b] B[^a]\n\n[^d]: D\n[^c]: C"), [
    {type: "appel sans texte", etiquette: "b"},
    {type: "appel sans texte", etiquette: "a"},
    {type: "texte sans appel", etiquette: "d"},
    {type: "texte sans appel", etiquette: "c"},
  ]);
});

test("conventionProblemesNotes : liste vide quand tout va bien, sans note ou sans texte", () => {
  assert.deepStrictEqual(problemesNotes("Texte[^1]\n\n[^1]: Note"), []);
  assert.deepStrictEqual(problemesNotes("Aucune note ici"), []);
  assert.deepStrictEqual(problemesNotes(""), []);
  assert.deepStrictEqual(problemesNotes(null), []);
});

test("conventionDocumentPdf sans logo : A4, contenu identique à conventionVersContenuPdf, pas d'en-tête, un style pour chaque nom", () => {
  const texte = "# Titre\n\nBonjour [Nom du club]\n\n{saut-de-page}\n\nSuite[^1]\n\n[^1]: Note";
  const valeurs = {"Nom du club": "Club Alpha"};
  const brut = documentPdf(texte, valeurs);
  const doc = plain(brut);
  assert.equal(doc.pageSize, "A4");
  assert.deepStrictEqual(doc.content, plain(w.conventionVersContenuPdf(texte, valeurs)));
  assert.equal(Object.hasOwn(brut, "header"), false);
  assert.equal(Object.hasOwn(doc, "header"), false);
  assert.deepStrictEqual(Object.keys(doc.styles).sort(), ["elementListe", "liste", "note", "paragraphe", "retrait", "titre", "titre1", "titre2", "titre3"]);
  Object.keys(doc.styles).forEach(nom => {
    assert.equal(typeof doc.styles[nom], "object", `le style ${nom} doit être un objet`);
  });
});

// Échoue si le numéro de page redevient « Page x sur y », centré, ou apparaît en page 1.
test("pied de page : numéro seul (sans « Page » ni « sur »), à droite, 9 pt, vide en page 1", () => {
  const {footer} = documentPdf("Texte", {});
  assert.equal(typeof footer, "function");
  assert.deepStrictEqual(plain(footer(1, 3)), {text: ""});
  [[2, 3], [3, 3], [10, 12]].forEach(([page, total]) => {
    const pied = plain(footer(page, total));
    assert.equal(pied.text, String(page));
    assert.equal(pied.alignment, "right");
    assert.equal(pied.fontSize, 9);
    assert.doesNotMatch(pied.text, /Page|sur/);
  });
});

// Échoue si le pied de page ne suit plus les marges gauche et droite (le numéro doit finir au bord droit du texte).
test("pied de page : marges gauche et droite de 2,5 cm, et espace avant qui place le bas du numéro à 1,25 cm du bas de la page", () => {
  const pied = plain(documentPdf("Texte", {}).footer(2, 3));
  const cm25 = 2.5 * POINTS_PAR_CM;
  const hauteurLigne = 9 * 1.17;
  assert.equal(pied.margin[0], cm25);
  assert.equal(pied.margin[2], cm25);
  assert.equal(pied.margin[3], 0);
  // Le pied commence au bord de la marge du bas (2,5 cm du bas) : on descend de 1,25 cm moins la hauteur de la ligne.
  assert.ok(Math.abs(pied.margin[1] - (cm25 - 1.25 * POINTS_PAR_CM - hauteurLigne)) < 1e-9);
  assert.ok(pied.margin[1] > 0, "l'espace avant doit rester positif");
});

// Depuis la 7.7b, les logos viennent de options.logos = {logo, partenaire} (images déjà prêtes pour pdfmake),
// et l'en-tête est une fonction de la page. Échoue si l'en-tête perd une image, sa taille, son côté
// ou la marge de 1,25 cm en haut, ou si l'ancienne option « logo » (une seule image) agit encore.
const LOGO_EXEMPLE = {image: "data:image/png;base64,AAAA", width: 100, height: 40};
const PARTENAIRE_EXEMPLE = {image: "data:image/jpeg;base64,BBBB", width: 120, height: 30};

test("logos {logo, partenaire} : l'en-tête de la page 1 contient les deux images, leurs tailles et la marge de la mise en page ; l'ancienne option logo est ignorée", () => {
  const brut = documentPdf("Texte", {}, {logos: {logo: LOGO_EXEMPLE, partenaire: PARTENAIRE_EXEMPLE}});
  assert.equal(typeof brut.header, "function");
  assert.deepStrictEqual(plain(brut.header(1)), {
    columns: [
      {image: LOGO_EXEMPLE.image, width: 100, height: 40, alignment: "left"},
      {width: "*", text: ""},
      {image: PARTENAIRE_EXEMPLE.image, width: 120, height: 30, alignment: "right"},
    ],
    margin: [2.5 * 28.35, 1.25 * 28.35, 2.5 * 28.35, 0],
  });
  const ancien = documentPdf("Texte", {}, {logo: "data:image/png;base64,AAAA"});
  assert.equal(Object.hasOwn(ancien, "header"), false, "l'ancienne option logo ne crée plus d'en-tête");
});

test("logo qui ne commence pas par data:image/ (adresse https, autre type, vide, pas du texte) : ignoré, sans en-tête", () => {
  [
    {logo: "https://exemple.fr/logo.png"},
    {logo: "data:text/html;base64,AAAA"},
    {logo: ""},
    {logo: 42},
    {},
    null,
    undefined,
  ].forEach(options => {
    const brut = documentPdf("Texte", {}, options);
    assert.equal(Object.hasOwn(brut, "header"), false, `pas d'en-tête attendu avec ${JSON.stringify(options)}`);
  });
});

test("les valeurs de mise en page viennent de CONVENTION_MISE_EN_PAGE : marges, police, styles, logos, espace entre les colonnes de signature", () => {
  const brut = documentPdf("{signatures}", SIGNATURES_VALEURS, {logos: {logo: LOGO_EXEMPLE}});
  const doc = plain(brut);
  const {logo, pageMargins} = MISE_EN_PAGE;
  assert.deepStrictEqual(doc.pageMargins, pageMargins);
  assert.deepStrictEqual(doc.defaultStyle, MISE_EN_PAGE.defaultStyle);
  assert.deepStrictEqual(doc.styles, MISE_EN_PAGE.styles);
  // En-tête : marge gauche et droite de la page, haut = logo.distanceHaut.
  assert.deepStrictEqual(plain(brut.header(1)).margin, [pageMargins[0], logo.distanceHaut, pageMargins[2], 0]);
  // Ligne d'espace en tête du contenu : le titre arrive logo.espaceSousLogos sous le bas du logo (ligne de 1 pt = 1,17 pt).
  assert.equal(doc.content[0].fontSize, 1);
  assert.ok(Math.abs(doc.content[0].margin[3] - (logo.distanceHaut + LOGO_EXEMPLE.height + logo.espaceSousLogos - pageMargins[1] - 1.17)) < 1e-9);
  // Le bloc de signatures vient juste après cette ligne d'espace.
  assert.equal(doc.content[1].columnGap, MISE_EN_PAGE.signatures.espaceEntreColonnes);
  assert.equal(doc.content[1].columns[0].stack.at(-1).text, LIGNES_VIDES);
});

test("conventionDocumentPdf renvoie une copie des réglages : modifier le document ne change pas le suivant", () => {
  const premier = documentPdf("Texte", {});
  premier.styles.titre1.fontSize = 999;
  premier.pageMargins[0] = 999;
  const second = plain(documentPdf("Texte", {}));
  assert.deepStrictEqual(second.styles, MISE_EN_PAGE.styles);
  assert.deepStrictEqual(second.pageMargins, MISE_EN_PAGE.pageMargins);
});

// ---- Tâche 7.7a : mise en page du PDF selon docs/ux/convention.md §11 ----
// Les valeurs attendues sont écrites ici en clair (en cm convertis avec 28,35 pt par cm),
// et non relues dans CONVENTION_MISE_EN_PAGE : un test qui relirait le réglage ne verrait pas
// une valeur qui s'écarte du §11.

const CM = (cm) => cm * 28.35;
const RETRAIT = CM(1.25);
const PDF_VIDE = () => plain(documentPdf("Texte", {}));

// Échoue si la constante de conversion s'écarte du 28,35 pt par cm du §11.
test("conversion : 1 cm = 28,35 pt", () => {
  assert.equal(POINTS_PAR_CM, 28.35);
});

// Échoue si une marge n'est plus de 2,5 cm (70,875 pt), ou si une des quatre diffère.
test("marges de la page : 2,5 cm partout (gauche, haut, droite, bas), page A4", () => {
  const doc = PDF_VIDE();
  assert.equal(doc.pageSize, "A4");
  assert.equal(doc.pageMargins.length, 4);
  doc.pageMargins.forEach(marge => assert.ok(Math.abs(marge - CM(2.5)) < 1e-9, `marge ${marge}`));
});

// Échoue si la police, la taille, la justification ou l'interligne de 1,2 (§11.1, mis à jour le 2026-10-25) changent.
test("texte courant : Roboto 11 pt, justifié, interligne 1,2", () => {
  assert.deepStrictEqual(PDF_VIDE().defaultStyle, {font: "Roboto", fontSize: 11, alignment: "justify", lineHeight: 1.2});
});

// Échoue si le numéro de page perd lineHeight: 1 : avec l'interligne 1,2 du texte, la place de sa
// ligne grandirait et il ne serait plus à 1,25 cm du bas de la page.
test("pied de page : le numéro garde l'interligne simple (lineHeight 1), malgré l'interligne 1,2 du texte", () => {
  const doc = documentPdf("Texte", {});
  assert.equal(plain(doc.defaultStyle).lineHeight, 1.2, "le texte courant est bien à 1,2");
  [2, 3, 10].forEach(page => {
    assert.equal(plain(doc.footer(page, 12)).lineHeight, 1, `numéro de la page ${page}`);
  });
});

// Échoue si la taille, le gras, l'alignement ou les espaces d'un style s'écartent du tableau du §11.1.
test("styles : tailles, gras, alignements, retraits et espaces avant/après des titres, paragraphe, citation, listes et notes", () => {
  const {styles} = PDF_VIDE();
  // Titre du document (7.7b) : retrait de 1 cm à gauche et à droite, 24 pt après.
  assert.deepStrictEqual(styles.titre1, {fontSize: 12, bold: true, alignment: "center", margin: [CM(1), 0, CM(1), 24]});
  assert.deepStrictEqual(styles.titre2, {fontSize: 11, bold: true, alignment: "left", margin: [0, 18, 0, 8]});
  assert.deepStrictEqual(styles.titre3, {fontSize: 11, bold: true, alignment: "left", margin: [RETRAIT, 12, 0, 8]});
  assert.deepStrictEqual(styles.titre, {fontSize: 11, bold: true, margin: [0, 0, 0, 8]});
  assert.deepStrictEqual(styles.paragraphe, {margin: [0, 6, 0, 10]});
  assert.deepStrictEqual(styles.retrait, {margin: [RETRAIT, 0, 0, 0]});
  assert.deepStrictEqual(styles.liste, {margin: [RETRAIT, 0, 0, 0]});
  assert.deepStrictEqual(styles.elementListe, {margin: [0, 0, 0, 6]});
  assert.deepStrictEqual(styles.note, {fontSize: 10, margin: [0, 0, 0, 0]});
});

// Échoue si la ligne en gras reçoit un alignement propre : elle doit rester justifiée comme le texte (héritage).
test("ligne entièrement en gras : pas d'alignement propre, donc justifiée comme le texte courant", () => {
  const {styles, defaultStyle} = PDF_VIDE();
  assert.equal(Object.hasOwn(styles.titre, "alignment"), false);
  assert.equal(defaultStyle.alignment, "justify");
});

// Échoue si le paragraphe ou la liste redéfinit l'alignement : ils doivent hériter du justifié.
test("paragraphe, liste, élément de liste et citation : pas d'alignement propre, donc justifiés", () => {
  const {styles} = PDF_VIDE();
  ["paragraphe", "liste", "elementListe", "retrait"].forEach(nom => {
    assert.equal(Object.hasOwn(styles[nom], "alignment"), false, `le style ${nom} ne doit pas fixer l'alignement`);
  });
});

// Échoue si un titre n'est plus repéré par headlineLevel (le saut de page conditionnel ne le verrait plus).
test("les trois titres et la ligne en gras portent headlineLevel 1 ; paragraphes, listes et notes n'en portent pas", () => {
  const blocs = convertir("# A\n\n## B\n\n### C\n\n**D**\n\nTexte\n\n- x\n\nNote[^1]\n\n[^1]: n");
  const titres = blocs.filter(b => ["titre1", "titre2", "titre3", "titre"].includes(b.style));
  assert.equal(titres.length, 4);
  titres.forEach(b => assert.equal(b.headlineLevel, 1, `titre ${b.style}`));
  blocs.filter(b => !titres.includes(b)).forEach(b => assert.equal(Object.hasOwn(b, "headlineLevel"), false));
});

// Échoue si un élément de liste perd son style elementListe (les 6 pt après chaque élément viennent de lui).
test("liste à puces et liste numérotée : chaque élément porte le style elementListe, la liste porte le style liste", () => {
  const [puces, numerotee] = convertir("- a\n- b\n\n1. un\n2. deux");
  assert.equal(puces.style, "liste");
  assert.equal(numerotee.style, "liste");
  [...puces.ul, ...numerotee.ol].forEach(item => assert.equal(item.style, "elementListe"));
});

// Échoue si le gras (ou un autre style) d'un élément de liste est perdu en ajoutant le style.
test("élément de liste avec du gras : le style elementListe est ajouté sans perdre le texte mis en forme", () => {
  assert.deepStrictEqual(convertir("- un **mot** gras"), [
    {ul: [{text: ["un ", {text: "mot", bold: true}, " gras"], style: "elementListe"}], style: "liste"},
  ]);
});

// Échoue si la citation perd son style retrait ou si son paragraphe perd les 6 pt d'espace avant.
test("citation (>) : bloc retrait qui contient un paragraphe ; les 6 pt d'espace avant viennent du paragraphe", () => {
  assert.deepStrictEqual(convertir("> Texte cité"), [
    {stack: [{text: "Texte cité", style: "paragraphe"}], style: "retrait"},
  ]);
  assert.equal(PDF_VIDE().styles.paragraphe.margin[1], 6);
  assert.equal(PDF_VIDE().styles.retrait.margin[1], 0);
});

// Échoue si l'espace avant le bloc des notes (12 pt) passe sur une autre note que la première, ou disparaît.
test("notes : seule la première porte l'espace avant de 12 pt, les suivantes n'ont pas de marge propre", () => {
  const blocs = convertir("A[^1] B[^2] C[^3]\n\n[^1]: Un\n[^2]: Deux\n[^3]: Trois");
  const notes = blocs.filter(b => b.style === "note");
  assert.equal(notes.length, 3);
  assert.deepStrictEqual(notes[0].margin, [0, 12, 0, 0]);
  assert.equal(Object.hasOwn(notes[1], "margin"), false);
  assert.equal(Object.hasOwn(notes[2], "margin"), false);
});

// Échoue si un texte sans note reçoit quand même un bloc de notes ou une marge de notes.
test("sans note : aucun bloc note, aucune marge de 12 pt", () => {
  const blocs = convertir("Texte simple\n\n- a");
  assert.equal(blocs.some(b => b.style === "note"), false);
  assert.equal(JSON.stringify(blocs).includes('"margin"'), false);
});

// Échoue si le numéro apparaît dans le contenu du document (il vient seulement du pied de page).
test("le contenu du document ne contient aucun numéro de page ni « Page »", () => {
  const doc = plain(documentPdf("# Titre\n\nTexte\n\n{signatures:ft-gauche}", SIGNATURES_VALEURS));
  assert.doesNotMatch(JSON.stringify(doc.content), /Page \d|sur \d/);
});

// ---- {signatures:ft-gauche} ----

const FT_GAUCHE = (valeurs = SIGNATURES_VALEURS) => remplir("{signatures:ft-gauche}", valeurs);
const FAIT_A = "Fait à ........................................................, le ........................................................";

// Échoue si la ligne « Fait à… », l'ordre des colonnes, les intitulés en gras ou l'espace de signature changent.
test("{signatures:ft-gauche} : ligne « Fait à… » (18 pt avant), puis France Travail à gauche et le club à droite, d'un seul tenant", () => {
  assert.deepStrictEqual(FT_GAUCHE(), [
    {
      stack: [
        {text: FAIT_A, margin: [0, 18, 0, 0]},
        {
          columns: [
            {
              width: "*",
              stack: [
                {text: "Pour France Travail", bold: true, style: "paragraphe"},
                {text: "Alex Durand", bold: true, style: "paragraphe"},
                {text: "Directeur d’agence", style: "paragraphe"},
                {text: " ", fontSize: 1, margin: [0, 0, 0, CM(3)]},
              ],
            },
            {
              width: "*",
              stack: [
                {text: "Pour l'organisation sportive", bold: true, style: "paragraphe"},
                {text: "Camille Martin", bold: true, style: "paragraphe"},
                {text: "Présidente", style: "paragraphe"},
                {text: " ", fontSize: 1, margin: [0, 0, 0, CM(3)]},
              ],
            },
          ],
          columnGap: 24,
          unbreakable: true,
        },
      ],
      unbreakable: true,
    },
  ]);
});

// Échoue si la ligne « Fait à… » et les colonnes ne sont plus dans le même bloc insécable (elle resterait seule en bas de page).
test("{signatures:ft-gauche} : le bloc entier et les colonnes sont insécables, la ligne « Fait à… » est dans le bloc", () => {
  const [bloc] = FT_GAUCHE();
  assert.equal(bloc.unbreakable, true);
  assert.equal(bloc.stack.length, 2);
  assert.equal(bloc.stack[0].text, FAIT_A);
  assert.equal(bloc.stack[1].unbreakable, true);
  assert.equal(FT_GAUCHE().length, 1, "un seul bloc dans le contenu");
});

// Échoue si l'ordre des colonnes est inversé par rapport à {signatures} (club à gauche).
test("{signatures:ft-gauche} : France Travail à gauche ; {signatures} : club à gauche (ordre inverse)", () => {
  const ftGauche = FT_GAUCHE()[0].stack[1].columns.map(c => c.stack[0].text);
  const classique = remplir("{signatures}", SIGNATURES_VALEURS)[0].columns.map(c => c.stack[0].text);
  assert.deepStrictEqual(ftGauche, ["Pour France Travail", "Pour l'organisation sportive"]);
  assert.deepStrictEqual(classique, ["Pour l'organisation sportive", "Pour France Travail"]);
});

// Échoue si la colonne n'a plus l'ordre intitulé, nom, fonction, puis l'espace pour signer (décision de Hanta).
test("{signatures:ft-gauche} : dans chaque colonne, l'ordre est intitulé, nom, fonction, puis l'espace de 3 cm pour signer", () => {
  FT_GAUCHE()[0].stack[1].columns.forEach(colonne => {
    const [intitule, nom, fonction, espace] = colonne.stack;
    assert.match(intitule.text, /^Pour /);
    assert.equal(intitule.bold, true);
    assert.equal(nom.bold, true);
    assert.equal(Object.hasOwn(fonction, "bold"), false);
    assert.equal(espace.text, " ");
    assert.equal(espace.fontSize, 1);
    assert.ok(Math.abs(espace.margin[3] - CM(3)) < 1e-9);
    assert.equal(colonne.stack.length, 4);
  });
});

// Échoue si le bloc contient « À … le … » par colonne, ou les lignes vides de {signatures}.
test("{signatures:ft-gauche} : pas de « À …, le … » dans les colonnes et pas de lignes vides (retours à la ligne)", () => {
  const texte = JSON.stringify(FT_GAUCHE());
  assert.equal(texte.includes("À ......"), false);
  assert.equal(texte.includes("\\n"), false);
});

// Échoue si une case sans valeur n'est plus écrite [Nom] dans le bloc ft-gauche.
test("{signatures:ft-gauche} sans valeurs : les quatre cases restent écrites [Nom]", () => {
  const [bloc] = FT_GAUCHE({});
  const [gauche, droite] = bloc.stack[1].columns;
  assert.equal(gauche.stack[1].text, "[Représentant de l’agence]");
  assert.equal(gauche.stack[2].text, "[Fonction du représentant]");
  assert.equal(droite.stack[1].text, "[Signataire du club]");
  assert.equal(droite.stack[2].text, "[Fonction du signataire]");
  assert.deepStrictEqual(convertir("{signatures:ft-gauche}"), plain(FT_GAUCHE({})));
});

// Échoue si le marqueur est reconnu dans un retrait, au milieu d'une phrase, ou s'il écrase le texte autour.
test("{signatures:ft-gauche} : seul sur sa ligne il est reconnu ; dans un retrait ou dans une phrase, il reste du texte ; le texte autour est gardé", () => {
  assert.deepStrictEqual(convertir("> {signatures:ft-gauche}"), [
    {stack: [{text: "{signatures:ft-gauche}", style: "paragraphe"}], style: "retrait"},
  ]);
  assert.deepStrictEqual(convertir("Voir {signatures:ft-gauche} ici"), [
    {text: "Voir {signatures:ft-gauche} ici", style: "paragraphe"},
  ]);
  const blocs = convertir("Avant\n\n{signatures:ft-gauche}\n\nAprès");
  assert.equal(blocs.length, 3);
  assert.equal(blocs[0].text, "Avant");
  assert.ok(blocs[1].stack);
  assert.equal(blocs[2].text, "Après");
});

// Échoue si une faute de frappe dans le marqueur est reconnue au lieu de rester du texte.
test("marqueur inconnu ({signatures:ft-droite}) : reste du texte ordinaire", () => {
  assert.deepStrictEqual(convertir("{signatures:ft-droite}"), [{text: "{signatures:ft-droite}", style: "paragraphe"}]);
});

// Échoue si {signatures} ou {signatures:lieu-date} reçoivent la ligne « Fait à… », le bloc extérieur ou l'espace de 3 cm.
test("{signatures} et {signatures:lieu-date} inchangés : colonnes directes, club à gauche, intitulés sans gras, 4 lignes vides, pas de « Fait à… »", () => {
  [["{signatures}", false], ["{signatures:lieu-date}", true]].forEach(([marqueur, avecLieuDate]) => {
    const [bloc] = remplir(marqueur, SIGNATURES_VALEURS);
    assert.equal(Object.hasOwn(bloc, "stack"), false, `${marqueur} : pas de bloc extérieur`);
    assert.equal(bloc.unbreakable, true);
    assert.equal(bloc.columnGap, 24);
    const [club, agence] = bloc.columns;
    const debut = avecLieuDate ? 1 : 0;
    assert.equal(club.stack[debut].text, "Pour l'organisation sportive");
    assert.equal(agence.stack[debut].text, "Pour France Travail");
    assert.equal(Object.hasOwn(club.stack[debut], "bold"), false, "intitulé sans gras");
    assert.equal(club.stack.at(-1).text, "\n\n\n\n");
    assert.equal(JSON.stringify(bloc).includes("Fait à"), false);
    assert.equal(JSON.stringify(bloc).includes('"fontSize":1'), false);
  });
});

// ---- pageBreakBefore (signature de pdfmake 0.3.3 : (noeud, aides), aides.getFollowingNodesOnPage() et aides.getPreviousNodesOnPage()) ----

const sautAvant = (noeud, aides) => documentPdf("Texte", {}).pageBreakBefore(noeud, aides);
// Les aides de pdfmake 0.3 : deux fonctions qui renvoient les listes de nœuds de la page.
const aidesPage = (precedents, suivants) => ({
  getPreviousNodesOnPage: () => precedents,
  getFollowingNodesOnPage: () => suivants,
});
const TITRE = {text: "Titre", style: "titre2", headlineLevel: 1};
const TEXTE = {text: "Texte"};

// Échoue si pageBreakBefore n'est plus une fonction du document.
test("pageBreakBefore : le document en fournit une", () => {
  assert.equal(typeof documentPdf("Texte", {}).pageBreakBefore, "function");
});

// Échoue si un titre suivi de texte sur sa page saute quand même la page.
test("pageBreakBefore : titre suivi d'au moins un bloc de texte sur sa page : pas de saut", () => {
  assert.equal(sautAvant(TITRE, aidesPage([TEXTE], [TEXTE])), false);
  assert.equal(sautAvant(TITRE, aidesPage([TEXTE], [{headlineLevel: 1}, TEXTE])), false);
});

// Échoue si un titre seul en bas de page (suivi de rien) ne passe pas à la page suivante.
test("pageBreakBefore : titre en bas de page, rien après lui sur la page : saut de page", () => {
  assert.equal(sautAvant(TITRE, aidesPage([TEXTE], [])), true);
});

// Échoue si un titre suivi seulement d'autres titres reste en bas de page.
test("pageBreakBefore : titre suivi seulement d'autres titres : saut de page", () => {
  assert.equal(sautAvant(TITRE, aidesPage([TEXTE], [{headlineLevel: 1}, {headlineLevel: 1}])), true);
});

// Échoue si un titre déjà tout en haut de la page (rien avant lui) saute sans fin.
test("pageBreakBefore : titre déjà en haut de page (rien avant lui) : pas de saut, même sans rien après", () => {
  assert.equal(sautAvant(TITRE, aidesPage([], [])), false);
  assert.equal(sautAvant(TITRE, aidesPage([], [{headlineLevel: 1}])), false);
});

// Échoue si un nœud sans headlineLevel (texte, liste, signature) peut provoquer un saut.
test("pageBreakBefore : nœud qui n'est pas un titre : jamais de saut", () => {
  assert.equal(sautAvant(TEXTE, aidesPage([TEXTE], [])), false);
  assert.equal(sautAvant({text: "x", headlineLevel: 0}, aidesPage([TEXTE], [])), false);
  assert.equal(sautAvant({stack: [], unbreakable: true}, aidesPage([TEXTE], [])), false);
});

// Échoue si la fonction lit les arguments de pdfmake 0.2 (listes passées directement) : c'était le bug « reading 'length' ».
test("pageBreakBefore : appelée à la façon de pdfmake 0.2 (listes en arguments, sans fonctions) : ne plante pas, renvoie false", () => {
  const f = documentPdf("Texte", {}).pageBreakBefore;
  assert.equal(f(TITRE, [TEXTE], [], [TEXTE]), false);
  assert.equal(f(TITRE, [], [], [TEXTE]), false);
});

// Échoue si un argument absent fait planter la fonction (génération bloquée) ou ne renvoie pas false.
test("pageBreakBefore : arguments absents (aucun, undefined, null) : ne plante pas et renvoie false", () => {
  const f = documentPdf("Texte", {}).pageBreakBefore;
  assert.equal(f(), false);
  assert.equal(f(undefined, undefined), false);
  assert.equal(f(null, null), false);
  assert.equal(f(TITRE), false);
  assert.equal(f(TITRE, undefined), false);
  assert.equal(f(TITRE, null), false);
  assert.equal(f(undefined, aidesPage([TEXTE], [])), false);
});

// Échoue si des aides incomplètes ou illisibles bloquent la génération au lieu de renvoyer false.
test("pageBreakBefore : aides incomplètes, listes illisibles ou fonction qui lève une erreur : renvoie false", () => {
  const f = documentPdf("Texte", {}).pageBreakBefore;
  assert.equal(f(TITRE, {}), false);
  assert.equal(f(TITRE, {getFollowingNodesOnPage: () => []}), false);
  assert.equal(f(TITRE, {getPreviousNodesOnPage: () => [TEXTE]}), false);
  assert.equal(f(TITRE, aidesPage(undefined, undefined)), false);
  assert.equal(f(TITRE, aidesPage([TEXTE], "pas une liste")), false);
  assert.equal(f(TITRE, aidesPage(null, [])), false);
  assert.equal(f(TITRE, {getPreviousNodesOnPage: () => { throw new Error("boum"); }, getFollowingNodesOnPage: () => []}), false);
  assert.equal(f(TITRE, {getPreviousNodesOnPage: "texte", getFollowingNodesOnPage: 42}), false);
});

// Échoue si la fonction appelle les aides plusieurs fois par titre de façon visible, ou en lit d'autres que les deux prévues.
test("pageBreakBefore : ne lit que getFollowingNodesOnPage et getPreviousNodesOnPage, et ne modifie pas les listes reçues", () => {
  const appels = [];
  const suivants = [{headlineLevel: 1}];
  const precedents = [TEXTE];
  const aides = {
    getFollowingNodesOnPage: () => { appels.push("suivants"); return suivants; },
    getPreviousNodesOnPage: () => { appels.push("precedents"); return precedents; },
  };
  assert.equal(documentPdf("Texte", {}).pageBreakBefore(TITRE, aides), true);
  assert.deepStrictEqual([...new Set(appels)].sort(), ["precedents", "suivants"]);
  assert.deepStrictEqual(suivants, [{headlineLevel: 1}]);
  assert.deepStrictEqual(precedents, [TEXTE]);
});

// Échoue si les titres produits par le convertisseur ne sont plus ceux que pageBreakBefore sait repérer.
test("pageBreakBefore + convertisseur : un titre produit par le modèle (##) est repéré, un paragraphe ne l'est pas", () => {
  const [titre, paragraphe] = convertir("## Article\n\nTexte");
  assert.equal(sautAvant(titre, aidesPage([TEXTE], [])), true);
  assert.equal(sautAvant(paragraphe, aidesPage([TEXTE], [])), false);
});
