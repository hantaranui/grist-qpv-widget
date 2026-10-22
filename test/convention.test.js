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
