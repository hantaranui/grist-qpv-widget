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

test("deux paragraphes séparés par une ligne vide ; un retour à la ligne simple reste dans le paragraphe", () => {
  assert.deepStrictEqual(convertir("Première ligne\nSuite du même paragraphe\n\nSecond paragraphe"), [
    {text: ["Première ligne", "\n", "Suite du même paragraphe"], style: "paragraphe"},
    {text: "Second paragraphe", style: "paragraphe"},
  ]);
});

test("titres #, ## et ### avec le style titre1, titre2 et titre3", () => {
  assert.deepStrictEqual(convertir("# Un\n## Deux\n### Trois"), [
    {text: "Un", style: "titre1"},
    {text: "Deux", style: "titre2"},
    {text: "Trois", style: "titre3"},
  ]);
});

test("titre ## avec du gras dedans : le gras est retiré car le style le porte déjà", () => {
  assert.deepStrictEqual(convertir("## **Article 3 : Rôle des parties prenantes**"), [
    {text: "Article 3 : Rôle des parties prenantes", style: "titre2"},
  ]);
});

test("titre ## avec un mot en gras au milieu : le texte reste découpé, sans l'attribut gras", () => {
  assert.deepStrictEqual(convertir("## Article **3** fin"), [
    {text: ["Article ", "3", " fin"], style: "titre2"},
  ]);
});

test("ligne entièrement en gras : elle prend le style titre", () => {
  assert.deepStrictEqual(convertir("**Article 1 : Objet de la convention**"), [
    {text: "Article 1 : Objet de la convention", style: "titre"},
  ]);
});

test("retrait d'une seule ligne : > **4.1 Rôle de France Travail**", () => {
  assert.deepStrictEqual(convertir("> **4.1 Rôle de France Travail**"), [
    {stack: [{text: "4.1 Rôle de France Travail", style: "titre"}], style: "retrait"},
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
    {ul: [{text: "a"}, {text: "b"}], style: "liste"},
  ]);
  assert.deepStrictEqual(convertir("- a\n- b\n\n- c"), [
    {ul: [{text: "a"}, {text: "b"}], style: "liste"},
    {ul: [{text: "c"}], style: "liste"},
  ]);
});

test("liste numérotée 1. 2. 3. sans start", () => {
  assert.deepStrictEqual(convertir("1. un\n2. deux\n3. trois"), [
    {ol: [{text: "un"}, {text: "deux"}, {text: "trois"}], style: "liste"},
  ]);
});

test("liste numérotée qui ne commence pas à 1 : start reprend le premier numéro", () => {
  assert.deepStrictEqual(convertir("3. trois\n4. quatre"), [
    {ol: [{text: "trois"}, {text: "quatre"}], style: "liste", start: 3},
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
    {text: [{text: "3.1 - Rôle l'organisation sportive", decoration: "underline"}], style: "titre"},
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
    {ul: [{text: "a"}, {text: "b"}], style: "liste"},
    {ul: [{text: "c"}, {text: "d"}], style: "liste"},
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
    {text: [{text: "1", sup: true}, " ", "France Travail, dans son rôle d'accueil…"], style: "note"},
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
    {text: "Convention avec Club Alpha", style: "titre2"},
  ]);
});

test("case dans un élément de liste : la valeur est dans l'élément", () => {
  assert.deepStrictEqual(remplir("- Siège : [Siège du club]\n- Autre", {"Siège du club": "1 rue des Sports"}), [
    {ul: [{text: "Siège : 1 rue des Sports"}, {text: "Autre"}], style: "liste"},
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
    {text: [{text: "1", sup: true}, " ", "Défini par Club Alpha"], style: "note"},
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

test("apostrophe typographique : une clé écrite avec l'apostrophe droite ' ne remplit pas la case", () => {
  assert.deepStrictEqual(remplir("Adresse : [Adresse de l’agence]", {"Adresse de l'agence": "3 rue B"}), [
    {text: "Adresse : [Adresse de l’agence]", style: "paragraphe"},
  ]);
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
    {text: [{text: "1", sup: true}, " ", "Texte de la note"], style: "note"},
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
// tests suivent les réglages sans les recopier.
const MISE_EN_PAGE = (() => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "actions-dashboard", "script.js"), "utf8");
  const m = /const CONVENTION_MISE_EN_PAGE = (\{[\s\S]*?\n\});/.exec(source);
  assert.ok(m, "la déclaration de CONVENTION_MISE_EN_PAGE est introuvable dans script.js");
  return plain(vm.runInNewContext(`(${m[1]})`));
})();

const problemesNotes = (texte) => plain(w.conventionProblemesNotes(texte));
const documentPdf = (texte, valeurs, options) => w.conventionDocumentPdf(texte, valeurs, options);

const SIGNATURES_VALEURS = {
  "Signataire du club": "Camille Martin",
  "Fonction du signataire": "Présidente",
  "Représentant de l’agence": "Alex Durand",
  "Fonction du représentant": "Directeur d’agence",
};
const LIEU_DATE = {text: "À ............................, le ............................", style: "paragraphe"};
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
    {text: [{text: "1", sup: true}, " ", "Texte de la note a"], style: "note"},
    {text: [{text: "2", sup: true}, " ", "Texte de la note deux"], style: "note"},
  ]);
});

test("note définie deux fois avec la même étiquette : seule la première définition est gardée", () => {
  assert.deepStrictEqual(convertir("Appel[^1]\n\n[^1]: Première définition\n[^1]: Seconde définition"), [
    {text: ["Appel", {text: "1", sup: true}], style: "paragraphe"},
    {text: [{text: "1", sup: true}, " ", "Première définition"], style: "note"},
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
  assert.deepStrictEqual(Object.keys(doc.styles).sort(), ["liste", "note", "paragraphe", "retrait", "titre", "titre1", "titre2", "titre3"]);
  Object.keys(doc.styles).forEach(nom => {
    assert.equal(typeof doc.styles[nom], "object", `le style ${nom} doit être un objet`);
  });
});

test("pied de page : footer(1, 3) donne « Page 1 sur 3 », centré", () => {
  const {footer} = documentPdf("Texte", {});
  assert.equal(typeof footer, "function");
  assert.deepStrictEqual(plain(footer(1, 3)), {text: "Page 1 sur 3", alignment: "center", fontSize: MISE_EN_PAGE.pied.fontSize});
  assert.deepStrictEqual(plain(footer(2, 10)), {text: "Page 2 sur 10", alignment: "center", fontSize: MISE_EN_PAGE.pied.fontSize});
});

test("logo commençant par data:image/ : l'en-tête est créé avec l'image, la largeur et la marge de la mise en page", () => {
  const logo = "data:image/png;base64,AAAA";
  const doc = plain(documentPdf("Texte", {}, {logo}));
  assert.deepStrictEqual(doc.header, {image: logo, width: MISE_EN_PAGE.logo.width, alignment: "left", margin: MISE_EN_PAGE.logo.margin});
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

test("les valeurs de mise en page viennent de CONVENTION_MISE_EN_PAGE : marges, police, styles, logo, espace entre les colonnes de signature", () => {
  const doc = plain(documentPdf("{signatures}", SIGNATURES_VALEURS, {logo: "data:image/png;base64,AAAA"}));
  assert.deepStrictEqual(doc.pageMargins, MISE_EN_PAGE.pageMargins);
  assert.deepStrictEqual(doc.defaultStyle, MISE_EN_PAGE.defaultStyle);
  assert.deepStrictEqual(doc.styles, MISE_EN_PAGE.styles);
  assert.equal(doc.header.width, MISE_EN_PAGE.logo.width);
  assert.deepStrictEqual(doc.header.margin, MISE_EN_PAGE.logo.margin);
  assert.equal(doc.content[0].columnGap, MISE_EN_PAGE.signatures.espaceEntreColonnes);
  assert.equal(doc.content[0].columns[0].stack.at(-1).text, LIGNES_VIDES);
});

test("conventionDocumentPdf renvoie une copie des réglages : modifier le document ne change pas le suivant", () => {
  const premier = documentPdf("Texte", {});
  premier.styles.titre1.fontSize = 999;
  premier.pageMargins[0] = 999;
  const second = plain(documentPdf("Texte", {}));
  assert.deepStrictEqual(second.styles, MISE_EN_PAGE.styles);
  assert.deepStrictEqual(second.pageMargins, MISE_EN_PAGE.pageMargins);
});
