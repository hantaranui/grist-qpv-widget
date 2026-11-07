"use strict";

// Doublures de la bibliotheque « docx » (Evolution 3), partagees par les tests de la generation
// Word : test/convention-generation.test.js, convention-logos.test.js, convention-delais.test.js,
// convention-generer-ecran.test.js et convention-docx.test.js.
// La vraie bibliotheque (docx 9.15.2, chargee depuis jsDelivr au clic) n'est jamais chargee en test :
// le depot n'a aucune dependance. La doublure ci-dessous garde, pour chaque objet fabrique par le
// widget (Document, Paragraph, TextRun, Table...), son nom et les options recues. Les tests lisent
// ensuite ce que le widget a DEMANDE a la bibliotheque (texte, surlignage, soulignement, police,
// metadonnees...). Ce que Word affichera pour de vrai ne se teste pas ici : c'est la recette de
// Hanta (ouvrir le fichier dans Word).
// test/helpers/widget.js n'est pas modifie : tout se pose sur w.window, le vrai global du bac a sable.

const vm = require("node:vm");

const CLASSES = ["Document", "Paragraph", "TextRun", "FootnoteReferenceRun", "Table", "TableRow", "TableCell", "ImageRun", "Header", "Footer"];
const ENUMS = ["AlignmentType", "BorderStyle", "WidthType", "TableLayoutType", "LevelFormat", "PageNumber"];

// Fausse bibliotheque. `documents` : chaque Document donne a Packer.toBlob.
function creerFauxDocx() {
  const lib = {documents: []};
  for (const nom of CLASSES) {
    lib[nom] = class {
      constructor(options) {
        this.__classe = nom;
        this.options = options;
      }
    };
  }
  // Les valeurs des enumerations (AlignmentType.LEFT...) deviennent des textes lisibles : « AlignmentType.LEFT ».
  for (const nom of ENUMS) lib[nom] = new Proxy({}, {get: (_, cle) => `${nom}.${String(cle)}`});
  lib.Packer = {toBlob(document) { lib.documents.push(document); return Promise.resolve({size: 4321}); }};
  return lib;
}

// Pose les doublures sur le global du bac a sable :
//  - window.docx : la fausse bibliotheque ;
//  - chargerDocx : remplace le chargement reseau (compte les appels ; options.chargement() peut le faire echouer) ;
//  - Blob : garde son type et sa taille (un fichier vide ou absent a une taille nulle) ;
//  - FormData : garde les parties envoyees (nom du champ, fichier, nom du fichier).
// options.trace(etape) : note « docx » au chargement et « document » a la fabrication.
// Renvoie { lib, compteurs: {chargements, fabrications}, documents, blobs, formulaires }.
function installerDocx(g, options = {}) {
  const lib = creerFauxDocx();
  const compteurs = {chargements: 0, fabrications: 0};
  const blobs = [];
  const formulaires = [];
  const noter = (etape) => { if (options.trace) options.trace(etape); };

  g.docx = lib;
  g.chargerDocx = () => {
    compteurs.chargements += 1;
    noter("docx");
    return options.chargement ? options.chargement() : Promise.resolve();
  };
  lib.Packer.toBlob = (document) => {
    compteurs.fabrications += 1;
    lib.documents.push(document);
    noter("document");
    return options.fabriquer ? options.fabriquer(document) : Promise.resolve({size: 4321});
  };
  g.Blob = class {
    constructor(parties, opts) {
      this.parties = parties;
      this.type = opts && opts.type;
      this.size = (parties || []).reduce((total, partie) => total + (partie && typeof partie.size === "number" ? partie.size : (partie && partie.length) || 0), 0);
      blobs.push(this);
    }
  };
  g.FormData = class {
    constructor() { this.parties = []; formulaires.push(this); }
    append(nom, valeur, fichier) { this.parties.push([nom, valeur, fichier]); }
  };
  return {lib, compteurs, documents: lib.documents, blobs, formulaires};
}

// ---------------------------------------------------------------------------
// Lecture d'un Document fabrique par le widget
// ---------------------------------------------------------------------------

function parcourir(noeud, visiteur, vus = new Set()) {
  if (!noeud || typeof noeud !== "object" || vus.has(noeud) || ArrayBuffer.isView(noeud)) return;
  vus.add(noeud);
  visiteur(noeud);
  for (const valeur of Object.values(noeud)) parcourir(valeur, visiteur, vus);
}

// Tous les objets d'une classe (« TextRun », « Paragraph »...) trouves dans le document, dans l'ordre de lecture.
function instances(document, classe) {
  const trouvees = [];
  parcourir(document, (noeud) => { if (noeud.__classe === classe) trouvees.push(noeud); });
  return trouvees;
}

// Les options de chaque TextRun du document (texte, surlignage, soulignement, gras...).
function runs(document) {
  return instances(document, "TextRun").map((run) => run.options);
}

// Le texte de chaque paragraphe, sans la mise en forme. Pour un Document entier, seul le CORPS compte (pas l'en-tete
// des logos, le pied avec le numero de page ni les notes de bas de page) ; pour tout autre objet (une cellule, un
// en-tete, une note), ses paragraphes.
function paragraphes(noeud) {
  const lu = noeud && noeud.options && noeud.options.sections ? noeud.options.sections[0].children : noeud;
  return instances(lu, "Paragraph").map((paragraphe) =>
    (paragraphe.options.children || []).filter((enfant) => enfant.__classe === "TextRun").map((run) => run.options.text || "").join(""));
}

// Tout le texte du document, d'un seul tenant (pour chercher une phrase).
function texte(document) {
  return paragraphes(document).join("\n");
}

// La premiere section (le widget n'en fabrique qu'une) et ses options.
function section(document) {
  return document.options.sections[0];
}

// L'en-tete de la premiere page (les logos), ou null s'il n'y en a pas.
function enteteDeLaPremierePage(document) {
  return (section(document).headers && section(document).headers.first) || null;
}

// Les images (logos) du document : { type, data, transformation, altText }.
function images(document) {
  return instances(document, "ImageRun").map((image) => image.options);
}

// Fixe, dans le bac a sable, le format du document genere connu pour une ligne Conventions : c'est ce que
// fait le widget apres une generation ou un « Telecharger la convention » (la Map conventionFormats est
// locale au script). Sert aux tests du bloc, qui veulent l'ecran « apres » sans rejouer la generation.
function fixerFormat(w, idConvention, format) {
  vm.runInContext(`conventionFormats.set(${Number(idConvention)}, ${JSON.stringify(format)})`, w.window);
}

module.exports = {creerFauxDocx, installerDocx, instances, runs, paragraphes, texte, section, enteteDeLaPremierePage, images, fixerFormat};
