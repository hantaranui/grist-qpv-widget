"use strict";

// Tâche 7.7b : les logos de la convention (docs/ux/convention.md, §11.1 et §11.2).
// Logo (à gauche) et Logo_partenaire (à droite) sont des colonnes de pièces jointes du modèle,
// lues au moment de la génération. Un logo vide, absent, en échec ou illisible ne bloque jamais.
// Le bac à sable de test/helpers/widget.js n'a ni FormData, ni Blob, ni btoa, ni clearTimeout, et
// son getAccessToken refuse : les doublures sont posées ici, sur w.window. pdfmake n'est jamais
// chargé pour de vrai. Valeurs fictives uniquement : le jeton et l'adresse n'existent pas.
// Les valeurs attendues (cm → pt, 28,35 pt par cm) sont écrites en clair, comme dans le §11.

const test = require("node:test");
const assert = require("node:assert/strict");
const {loadWidget} = require("./helpers/widget");

const JETON = "jeton-fictif-0a1b2c3d";
const BASE_URL = "https://grist.exemple.test/api/docs/document-fictif";
const ID_PIECE_JOINTE = 42;
const ID_CONVENTION = 9;
const ID_LOGO = 101;
const ID_PARTENAIRE = 102;

const CM = (cm) => cm * 28.35;
const BOITE_LARGEUR = CM(6);
const BOITE_HAUTEUR = CM(2);
const DISTANCE_HAUT = CM(1.25);
const MARGE = CM(2.5);
const HAUTEUR_LIGNE_1PT = 1.17;
const CINQ_MO = 5 * 1024 * 1024;

const CLUB = {id: 7, Nom: "Club Exemple", SIRET: "12345678901234", Adresse: "1 rue Exemple", Code_postal: "75001", Ville: "Exemple-sur-Mer"};
const AGENCE = {id: 5, Libelle_agence: "Agence Exemple", Adresse: "2 avenue Exemple", Complement_adresse: "", Code_postal: "75002", Ville: "Exemple-Ville"};
const MODELE = {id: 10, Dispositif: 3, Actif: true, Titre: "Modèle Exemple", Avec_annee: true, Contenu: "# Convention\n\nTexte de convention fictif."};
const CONTACTS = [{id: 31, Club: 7, Prenom: "Camille", Nom: "Exemple", Fonction: "Présidente"}];
const VALEURS = {annee: "2031", anneeIllisible: false, signataire: 31, representant: "Dana Exemple", fonctionRepresentant: "Directrice adjointe"};
const LIGNE_CONVENTION = {
  id: ID_CONVENTION, Action: 1, Modele: 10, Annee: 2031, Signataire_club: 31,
  Representant_agence: "Dana Exemple", Fonction_representant: "Directrice adjointe",
};

const attendre = () => new Promise((resolve) => setImmediate(resolve));
const ordinaire = (valeur) => JSON.parse(JSON.stringify(valeur));
const proche = (a, b) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------------------
// Faux fichiers : on fabrique juste les premiers octets, ceux que le widget lit.
// ---------------------------------------------------------------------------

function png(largeur, hauteur) {
  const octets = new Uint8Array(33);
  octets.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52], 0);
  const vue = new DataView(octets.buffer);
  vue.setUint32(16, largeur);
  vue.setUint32(20, hauteur);
  return octets;
}

// JPEG : SOI, un segment JFIF de 16 octets, puis le cadre SOF0 qui porte la taille.
function jpeg(largeur, hauteur) {
  const octets = new Uint8Array(40);
  octets.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00], 0);
  octets.set([0xff, 0xc0, 0x00, 0x11, 0x08, hauteur >> 8, hauteur & 255, largeur >> 8, largeur & 255, 0x03], 20);
  return octets;
}

const octetsDe = (texte) => Uint8Array.from(Buffer.from(texte, "latin1"));
const GIF = Uint8Array.from([...octetsDe("GIF89a"), ...new Array(30).fill(0)]);
const PDF = octetsDe("%PDF-1.4\n" + "x".repeat(40));
const WEBP = octetsDe("RIFF\0\0\0\0WEBPVP8 " + "x".repeat(20));
const TEXTE = octetsDe("Ceci n'est pas une image du tout, juste du texte.");

// ---------------------------------------------------------------------------
// Mise en place
// ---------------------------------------------------------------------------

// Reponse d'un telechargement : des octets, un statut d'echec (nombre), une erreur (rejet) ou
// {illisible: true} (reponse OK dont le contenu ne se lit pas jusqu'au bout).
function reponseFichier(contenu) {
  if (contenu instanceof Error) return Promise.reject(contenu);
  if (contenu && contenu.illisible) return Promise.resolve({ok: true, status: 200, arrayBuffer: () => Promise.reject(new Error("lecture interrompue"))});
  if (typeof contenu === "number") return Promise.resolve({ok: false, status: contenu, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))});
  return Promise.resolve({ok: true, status: 200, arrayBuffer: () => Promise.resolve(new Uint8Array(contenu).buffer)});
}

// options.logo / options.partenaire : valeur de la colonne dans le modele (par defaut ['L', id]).
// options.fichiers : { [idPieceJointe]: octets | statut | Error | {illisible: true} }, par defaut un PNG lisible.
// options.pdfRefuseLesImages : createPdf echoue des que le document a un en-tete (logos).
// Notes : fetchs (chaque requete), docs (chaque document donne a createPdf), journal (console),
// jetons (options de chaque getAccessToken), trace (ordre des etapes).
async function preparer(options = {}) {
  const journal = [];
  const console = {};
  for (const nom of ["log", "warn", "error", "info"]) console[nom] = (...args) => { journal.push([nom, ...args]); };
  const w = loadWidget({console});
  await attendre();
  await attendre();

  const modele = {...MODELE};
  modele.Logo = "logo" in options ? options.logo : ["L", ID_LOGO];
  modele.Logo_partenaire = "partenaire" in options ? options.partenaire : ["L", ID_PARTENAIRE];
  w.state.raw = {
    Actions: [{id: 1, Agence: 5, Club: 7, Dispositif: 3}],
    Structures: [{...CLUB}],
    Agences: [{...AGENCE}],
    Modeles_convention: [modele],
    Contacts: CONTACTS.map((c) => ({...c})),
    Conventions: [{...LIGNE_CONVENTION}],
  };
  w.state.tablesRefusees = [];
  journal.length = 0;

  const fichiers = {[ID_LOGO]: png(1000, 500), [ID_PARTENAIRE]: png(400, 300), ...(options.fichiers || {})};
  const fetchs = [];
  const jetons = [];
  const docs = [];
  const trace = [];
  const global = w.window;

  global.FormData = class { constructor() { this.parties = []; } append(nom, valeur, fichier) { this.parties.push([nom, valeur, fichier]); } };
  global.Blob = class { constructor(parties) { this.size = parties ? parties.length : 0; } };
  global.clearTimeout = clearTimeout;
  global.btoa = btoa;
  global.chargerPdfmake = () => { trace.push("pdfmake"); return Promise.resolve(); };
  global.pdfMake = {
    createPdf: (document) => {
      docs.push(document);
      trace.push("pdf");
      return {
        getBlob: () => (options.pdfRefuseLesImages && document.header
          ? Promise.reject(new Error("image refusée par pdfmake (doublure)"))
          : Promise.resolve({size: 1234})),
      };
    },
  };
  w.grist.docApi.applyUserActions = (actions) => {
    trace.push("enregistrement");
    const [type, , id] = actions[0];
    return Promise.resolve({retValues: [type === "AddRecord" ? 55 : (id ?? null)]});
  };
  w.grist.docApi.getAccessToken = (opts) => {
    trace.push("jeton");
    jetons.push(opts);
    return options.jetonRefuse ? Promise.reject(new Error(`refus ${JETON}`)) : Promise.resolve({token: JETON, baseUrl: BASE_URL});
  };
  global.fetch = (url, opts) => {
    fetchs.push({url, options: opts});
    const telechargement = /\/attachments\/(\d+)\/download/.exec(String(url));
    if (telechargement) {
      trace.push("logo");
      return reponseFichier(fichiers[telechargement[1]]);
    }
    if (String(url).includes("/attachments")) {
      trace.push("envoi");
      return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve([ID_PIECE_JOINTE]), text: () => Promise.resolve("")});
    }
    trace.push("rattachement");
    return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve({}), text: () => Promise.resolve("")});
  };
  return {w, fetchs, jetons, docs, trace, journal};
}

const estTelechargement = (requete) => /\/attachments\/\d+\/download/.test(requete.url);
const estPatch = (requete) => requete.options && requete.options.method === "PATCH";
const estEnvoi = (requete) => requete.options && requete.options.method === "POST";
const jetonDe = (requete) => new URL(requete.url).searchParams.get("auth");

async function attraper(promesse) {
  try { await promesse; } catch (erreur) { return erreur; }
  return undefined;
}

function visible(erreur) {
  const proprietes = {};
  for (const nom of Object.getOwnPropertyNames(erreur)) proprietes[nom] = erreur[nom];
  return `${erreur.message}\n${erreur.stack}\n${JSON.stringify(proprietes)}`;
}

// Un logo tout prêt pour pdfmake, pour tester la mise en page sans passer par une génération.
const logoPret = (largeur, hauteur, image = "data:image/png;base64,AAAA") => ({image, width: largeur, height: hauteur});

// Un widget léger, pour les tests de fonctions pures.
function widgetPur() {
  const w = loadWidget();
  w.window.btoa = btoa;
  return w;
}
const image = (w, octets) => {
  const resultat = w.conventionImageLogo(octets);
  return resultat === null ? null : ordinaire(resultat);
};

// ---------------------------------------------------------------------------
// 1. Format reconnu d'après les octets (PNG, JPEG), pas d'après le nom
// ---------------------------------------------------------------------------

// Échoue si un PNG n'est plus accepté, si l'image n'est plus une data URL PNG, si son contenu
// n'est plus exactement le fichier (base64), ou si l'image est déformée sous la boîte de 6 × 2 cm.
test("format : un PNG est accepté (data URL image/png, contenu identique au fichier)", () => {
  const w = widgetPur();
  const fichier = png(100, 40);
  const resultat = image(w, fichier);
  assert.ok(resultat, "le PNG est accepté");
  assert.ok(resultat.image.startsWith("data:image/png;base64,"), resultat.image.slice(0, 30));
  assert.deepStrictEqual(Buffer.from(resultat.image.split(",")[1], "base64"), Buffer.from(fichier));
  assert.deepEqual([resultat.width, resultat.height], [100, 40]);
});

// Échoue si un JPEG n'est plus accepté, ou si sa taille n'est plus lue dans le cadre SOF.
// Le JPEG d'essai (100 × 50) est plus petit que la boîte de 6 × 2 cm (170,1 × 56,7 pt) : la taille
// lue est gardée telle quelle. La réduction d'une image trop grande est testée plus bas (« taille »).
test("format : un JPEG est accepté (data URL image/jpeg, taille lue dans le fichier)", () => {
  const w = widgetPur();
  const fichier = jpeg(100, 50);
  const resultat = image(w, fichier);
  assert.ok(resultat, "le JPEG est accepté");
  assert.ok(resultat.image.startsWith("data:image/jpeg;base64,"), resultat.image.slice(0, 30));
  assert.deepStrictEqual(Buffer.from(resultat.image.split(",")[1], "base64"), Buffer.from(fichier));
  assert.deepEqual([resultat.width, resultat.height], [100, 50]);
});

// Échoue si un autre format (GIF, PDF, WebP, texte), un fichier vide ou un fichier abîmé
// (PNG coupé, PNG de largeur 0, JPEG sans taille) est accepté au lieu d'être refusé.
const REFUSES = [
  ["GIF", () => GIF],
  ["PDF", () => PDF],
  ["WebP", () => WEBP],
  ["texte", () => TEXTE],
  ["fichier vide", () => new Uint8Array(0)],
  ["PNG coupé (moins de 24 octets)", () => png(100, 40).slice(0, 20)],
  ["PNG de largeur 0", () => png(0, 40)],
  ["JPEG sans cadre de taille", () => jpeg(100, 40).slice(0, 20)],
];
for (const [nom, fabriquer] of REFUSES) {
  test(`format : ${nom} refusé d'après les octets`, () => {
    assert.equal(image(widgetPur(), fabriquer()), null);
  });
}

// Échoue si le widget se fie au type annoncé par le serveur ou au nom du fichier : ici le
// serveur dit « image/gif » et le nom finit par .gif, mais les octets sont ceux d'un PNG.
test("format : un PNG est accepté même si le nom et le type annoncés disent GIF (seuls les octets comptent)", async () => {
  const ctx = await preparer({partenaire: null});
  ctx.w.window.fetch = (url, opts) => {
    ctx.fetchs.push({url, options: opts});
    if (estTelechargement({url})) {
      return Promise.resolve({ok: true, status: 200, headers: {get: () => "image/gif"}, url: `${url}&nom=logo.gif`, arrayBuffer: () => Promise.resolve(png(300, 100).buffer)});
    }
    return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve([ID_PIECE_JOINTE]), text: () => Promise.resolve("")});
  };

  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.deepEqual(ordinaire(resultat.logosManquants), [], "le logo est pris");
  assert.ok(ctx.docs[0].header, "le document a une ligne de logos");
});

// Échoue si un GIF est accepté parce que le serveur l'annonce « image/png » et que le nom finit par .png.
test("format : un GIF est refusé même si le nom et le type annoncés disent PNG", async () => {
  const ctx = await preparer({partenaire: null});
  ctx.w.window.fetch = (url, opts) => {
    ctx.fetchs.push({url, options: opts});
    if (estTelechargement({url})) {
      return Promise.resolve({ok: true, status: 200, headers: {get: () => "image/png"}, url: `${url}&nom=logo.png`, arrayBuffer: () => Promise.resolve(GIF.buffer)});
    }
    return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve([ID_PIECE_JOINTE]), text: () => Promise.resolve("")});
  };

  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.deepEqual(ordinaire(resultat.logosManquants), ["Logo"]);
  assert.equal(Object.hasOwn(ctx.docs[0], "header"), false, "aucun logo dans le document");
});

// ---------------------------------------------------------------------------
// 2. Poids maximal : plus de 5 Mo = illisible
// ---------------------------------------------------------------------------

function pngDePoids(octetsTotal) {
  const octets = new Uint8Array(octetsTotal);
  octets.set(png(100, 40), 0);
  return octets;
}

// Échoue si un fichier de plus de 5 Mo (5 242 880 octets) est accepté, même s'il est un PNG valide.
test("poids : un PNG valide de plus de 5 Mo est refusé", () => {
  assert.equal(image(widgetPur(), pngDePoids(CINQ_MO + 1)), null);
});

// Échoue si la limite est appliquée trop tôt : un fichier de 5 Mo pile doit encore passer.
test("poids : un PNG valide de 5 Mo pile est accepté", () => {
  const resultat = image(widgetPur(), pngDePoids(CINQ_MO));
  assert.ok(resultat, "5 Mo pile est accepté");
  assert.ok(resultat.image.startsWith("data:image/png;base64,"));
});

// ---------------------------------------------------------------------------
// 2 bis. Dimensions maximales (4000 px) et en-tête PNG (IHDR)
// ---------------------------------------------------------------------------

// Échoue si un PNG (en-tête correct) de plus de 4000 px de large ou de haut est accepté, ou si la
// génération est bloquée au lieu de continuer sans ce logo (comme un logo absent ou illisible).
for (const [nom, fichier] of [
  ["largeur 4001 px", png(4001, 500)],
  ["hauteur 4001 px", png(500, 4001)],
]) {
  test(`dimensions : PNG de ${nom} → logo refusé, génération sans lui`, async () => {
    assert.equal(image(widgetPur(), fichier), null, "refusé par conventionImageLogo");

    const ctx = await preparer({partenaire: null, fichiers: {[ID_LOGO]: fichier}});
    const resultat = await ctx.w.conventionGenerer(1, VALEURS);

    assert.deepEqual(ordinaire(resultat.logosManquants), ["Logo"]);
    assert.ok(resultat.nomFichier.endsWith(".pdf"), "la génération réussit");
    assert.equal(Object.hasOwn(ctx.docs[0], "header"), false, "aucun logo dans le document");
  });
}

// Échoue si un PNG dont les octets 12 à 15 ne valent pas "IHDR" est lu quand même, ou si la
// génération est bloquée au lieu de continuer sans ce logo.
test("dimensions : PNG dont les octets 12 à 15 ne sont pas IHDR → illisible, génération sans logo", async () => {
  const fichier = png(100, 40);
  fichier.set([0x49, 0x44, 0x41, 0x54], 12); // "IDAT" à la place de "IHDR"
  assert.equal(image(widgetPur(), fichier), null, "refusé par conventionImageLogo");

  const ctx = await preparer({partenaire: null, fichiers: {[ID_LOGO]: fichier}});
  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.deepEqual(ordinaire(resultat.logosManquants), ["Logo"]);
  assert.equal(Object.hasOwn(ctx.docs[0], "header"), false, "aucun logo dans le document");
});

// Échoue si la limite est appliquée trop tôt : un PNG de 4000 × 4000 px pile doit encore passer.
test("dimensions : un PNG de 4000 × 4000 px pile est accepté", () => {
  const resultat = image(widgetPur(), png(4000, 4000));
  assert.ok(resultat, "4000 px pile est accepté");
  assert.ok(resultat.image.startsWith("data:image/png;base64,"));
});

// ---------------------------------------------------------------------------
// 3. Taille maximale et proportions, jamais agrandi
// ---------------------------------------------------------------------------

// Échoue si un logo dépasse la boîte de 6 cm sur 2 cm, s'il est déformé (proportions changées)
// ou s'il est agrandi au-delà de sa taille d'origine.
const TAILLES = [
  ["PNG plus large que la boîte (1000 × 500) : la hauteur limite", png(1000, 500), 113.4, 56.7],
  ["PNG très large (2000 × 100) : la largeur limite", png(2000, 100), 170.1, 8.505],
  ["PNG très haut (100 × 1000) : la hauteur limite", png(100, 1000), 5.67, 56.7],
  ["PNG plus petit que la boîte (50 × 20) : jamais agrandi", png(50, 20), 50, 20],
  ["JPEG (3000 × 1000) : les deux limites en même temps", jpeg(3000, 1000), 170.1, 56.7],
];
for (const [nom, fichier, largeurAttendue, hauteurAttendue] of TAILLES) {
  test(`taille : ${nom}`, () => {
    const resultat = image(widgetPur(), fichier);
    assert.ok(resultat, "le logo est accepté");
    assert.ok(resultat.width <= BOITE_LARGEUR + 1e-9, `largeur ${resultat.width}`);
    assert.ok(resultat.height <= BOITE_HAUTEUR + 1e-9, `hauteur ${resultat.height}`);
    assert.ok(Math.abs(resultat.width - largeurAttendue) < 1e-6, `largeur ${resultat.width}, attendue ${largeurAttendue}`);
    assert.ok(Math.abs(resultat.height - hauteurAttendue) < 1e-6, `hauteur ${resultat.height}, attendue ${hauteurAttendue}`);
  });
}

// ---------------------------------------------------------------------------
// 4. Lecture des deux colonnes
// ---------------------------------------------------------------------------

// Échoue si le widget ne lit pas Logo ET Logo_partenaire, s'il ne les télécharge pas par
// /attachments/<id>/download avec le jeton dans l'adresse, credentials 'omit' et l'en-tête
// X-Requested-With (sans lui, Grist répond 401).
test("lecture : Logo et Logo_partenaire sont téléchargés par /attachments/<id>/download, comme le PDF", async () => {
  const ctx = await preparer();
  await ctx.w.conventionGenerer(1, VALEURS);

  const telechargements = ctx.fetchs.filter(estTelechargement);
  assert.equal(telechargements.length, 2, "un téléchargement par colonne remplie");
  assert.deepEqual(telechargements.map((t) => t.url).sort(), [
    `${BASE_URL}/attachments/${ID_LOGO}/download?auth=${encodeURIComponent(JETON)}`,
    `${BASE_URL}/attachments/${ID_PARTENAIRE}/download?auth=${encodeURIComponent(JETON)}`,
  ].sort());
  telechargements.forEach((t) => {
    assert.equal(t.options.credentials, "omit");
    assert.equal(t.options.headers["X-Requested-With"], "XMLHttpRequest");
  });
});

// Échoue si, dans une colonne qui contient plusieurs fichiers, le widget télécharge autre chose
// que le premier.
test("lecture : seul le premier fichier de chaque colonne est téléchargé", async () => {
  const ctx = await preparer({logo: ["L", ID_LOGO, 201, 202], partenaire: ["L", ID_PARTENAIRE, 203]});
  await ctx.w.conventionGenerer(1, VALEURS);

  const ids = ctx.fetchs.filter(estTelechargement).map((t) => /attachments\/(\d+)\//.exec(t.url)[1]).sort();
  assert.deepEqual(ids, [String(ID_LOGO), String(ID_PARTENAIRE)]);
});

// Échoue si les images lues ne sont pas celles du document donné à pdfmake (Logo à gauche,
// Logo_partenaire à droite, en data URL PNG, dans la boîte de 6 × 2 cm).
test("lecture : les deux logos lus arrivent dans l'en-tête du document donné à pdfmake", async () => {
  const ctx = await preparer({fichiers: {[ID_LOGO]: png(1000, 500), [ID_PARTENAIRE]: jpeg(400, 300)}});
  await ctx.w.conventionGenerer(1, VALEURS);

  assert.equal(ctx.docs.length, 1, "un seul PDF fabriqué");
  const ligne = ordinaire(ctx.docs[0].header(1));
  const images = ligne.columns.filter((colonne) => colonne.image);
  assert.equal(images.length, 2);
  assert.ok(images[0].image.startsWith("data:image/png;base64,"));
  assert.equal(images[0].alignment, "left");
  assert.ok(images[1].image.startsWith("data:image/jpeg;base64,"));
  assert.equal(images[1].alignment, "right");
  images.forEach((i) => {
    assert.ok(i.width <= BOITE_LARGEUR + 1e-9 && i.height <= BOITE_HAUTEUR + 1e-9, "dans la boîte de 6 × 2 cm");
  });
});

// ---------------------------------------------------------------------------
// 5. Disposition (conventionDocumentPdf, fonction pure)
// ---------------------------------------------------------------------------

const documentPdf = (w, texte, options) => w.conventionDocumentPdf(texte, {}, options);

// Échoue si Logo n'est plus à gauche, Logo_partenaire à droite, ou s'ils ne sont plus sur la
// même ligne (une seule ligne de colonnes, avec un espace extensible entre les deux).
test("disposition : Logo à gauche, Logo_partenaire à droite, sur la même ligne", () => {
  const w = widgetPur();
  const doc = documentPdf(w, "Texte", {logos: {logo: logoPret(100, 40, "data:image/png;base64,GGGG"), partenaire: logoPret(120, 30, "data:image/png;base64,DDDD")}});
  const ligne = ordinaire(doc.header(1));
  assert.equal(ligne.columns.length, 3, "gauche, espace, droite : une seule ligne");
  assert.equal(ligne.columns[0].image, "data:image/png;base64,GGGG");
  assert.equal(ligne.columns[0].alignment, "left");
  assert.equal(ligne.columns[1].width, "*", "l'espace extensible pousse le partenaire contre la marge droite");
  assert.equal(ligne.columns[2].image, "data:image/png;base64,DDDD");
  assert.equal(ligne.columns[2].alignment, "right");
});

// Échoue si Logo seul n'est plus à gauche, s'il est centré ou mis à droite, ou si une image
// fantôme apparaît à droite.
test("disposition : Logo seul reste à gauche, rien à droite", () => {
  const w = widgetPur();
  const ligne = ordinaire(documentPdf(w, "Texte", {logos: {logo: logoPret(100, 40), partenaire: null}}).header(1));
  const images = ligne.columns.filter((c) => c.image);
  assert.equal(images.length, 1);
  assert.equal(ligne.columns[0].image, images[0].image, "l'image est la première colonne");
  assert.equal(images[0].alignment, "left");
  assert.equal(ligne.columns.at(-1).image, undefined, "rien à droite");
});

// Échoue si Logo_partenaire seul glisse à gauche : il doit garder son côté droit, avec un
// espace extensible avant lui.
test("disposition : Logo_partenaire seul reste à droite, rien à gauche", () => {
  const w = widgetPur();
  const ligne = ordinaire(documentPdf(w, "Texte", {logos: {logo: null, partenaire: logoPret(120, 30)}}).header(1));
  const images = ligne.columns.filter((c) => c.image);
  assert.equal(images.length, 1);
  assert.equal(images[0].alignment, "right");
  assert.equal(ligne.columns.at(-1).image, images[0].image, "l'image est la dernière colonne");
  assert.equal(ligne.columns[0].image, undefined, "rien à gauche");
  assert.equal(ligne.columns[0].width, "*", "un espace extensible pousse l'image à droite");
});

// Échoue si, sans aucun logo, le document garde un en-tête, une ligne de logos ou la ligne
// d'espace : le contenu doit être exactement celui du texte, le titre en haut de la zone de texte.
test("disposition : aucun logo = aucun en-tête, aucune ligne d'espace, contenu identique au texte", () => {
  const w = widgetPur();
  const texte = "# Titre\n\nUn paragraphe.";
  [undefined, {}, {logos: {}}, {logos: {logo: null, partenaire: null}}].forEach((options) => {
    const brut = documentPdf(w, texte, options);
    assert.equal(Object.hasOwn(brut, "header"), false, `pas d'en-tête avec ${JSON.stringify(options)}`);
    assert.deepStrictEqual(ordinaire(brut.content), ordinaire(w.conventionVersContenuPdf(texte, {})));
    assert.equal(brut.content[0].style, "titre1", "le titre est le premier bloc");
  });
});

// Échoue si les logos apparaissent sur une autre page que la première.
test("disposition : les logos sont sur la première page seulement", () => {
  const w = widgetPur();
  const doc = documentPdf(w, "Texte", {logos: {logo: logoPret(100, 40), partenaire: logoPret(120, 30)}});
  assert.ok(ordinaire(doc.header(1)).columns, "page 1 : la ligne de logos");
  [2, 3, 10].forEach((page) => {
    assert.deepStrictEqual(ordinaire(doc.header(page)), {text: ""}, `page ${page} : en-tête vide`);
  });
});

// Échoue si le haut des logos n'est plus à 1,25 cm (35,4375 pt) du haut de la page, ou si les
// logos ne s'alignent plus sur les marges gauche et droite (2,5 cm).
test("disposition : le haut des logos est à 1,25 cm du haut de la page, entre les marges gauche et droite", () => {
  const w = widgetPur();
  const doc = documentPdf(w, "Texte", {logos: {logo: logoPret(100, 40), partenaire: logoPret(120, 30)}});
  const {margin} = ordinaire(doc.header(1));
  assert.ok(proche(margin[0], MARGE), `marge gauche ${margin[0]}`);
  assert.ok(proche(margin[1], DISTANCE_HAUT), `haut des logos ${margin[1]}`);
  assert.ok(proche(margin[2], MARGE), `marge droite ${margin[2]}`);
  assert.equal(margin[3], 0);
});

// Position du titre : marge haute + ligne d'espace (1 pt de police = 1,17 pt) + son espace après.
const positionDuTitre = (doc) => ordinaire(doc.pageMargins)[1] + HAUTEUR_LIGNE_1PT + doc.content[0].margin[3];

// Échoue si le titre # ne commence pas 24 pt sous le bas des logos, avec des logos de 2 cm de
// haut (le bas dépasse alors la marge haute : la position se calcule depuis le bas des logos).
test("disposition : le titre commence 24 pt sous le bas des logos (logos de 2 cm de haut)", () => {
  const w = widgetPur();
  const doc = documentPdf(w, "# Titre", {logos: {logo: logoPret(170, BOITE_HAUTEUR), partenaire: null}});
  assert.equal(doc.content[0].text, " ", "une ligne d'espace en tête du contenu");
  assert.equal(doc.content[0].fontSize, 1);
  assert.equal(doc.content[1].style, "titre1", "puis le titre");
  assert.ok(proche(positionDuTitre(doc), DISTANCE_HAUT + BOITE_HAUTEUR + 24), `titre à ${positionDuTitre(doc)} pt du haut`);
});

// Échoue si l'espace se calcule sur le logo de gauche au lieu du plus haut des deux.
test("disposition : le titre se place sous le plus haut des deux logos", () => {
  const w = widgetPur();
  [[30, 50], [50, 30]].forEach(([gauche, droite]) => {
    const doc = documentPdf(w, "# Titre", {logos: {logo: logoPret(100, gauche), partenaire: logoPret(100, droite)}});
    assert.ok(proche(positionDuTitre(doc), DISTANCE_HAUT + 50 + 24), `hauteurs ${gauche}/${droite} : titre à ${positionDuTitre(doc)}`);
  });
});

// Échoue si de très petits logos reçoivent un espace négatif ou inutile : le titre reste alors à
// la marge haute (2,5 cm), déjà plus de 24 pt sous le bas des logos.
test("disposition : de petits logos n'ajoutent aucun espace, le titre reste à la marge haute et à 24 pt au moins sous les logos", () => {
  const w = widgetPur();
  const doc = documentPdf(w, "# Titre", {logos: {logo: logoPret(30, 5), partenaire: null}});
  assert.equal(doc.content[0].style, "titre1", "pas de ligne d'espace");
  assert.ok(MARGE >= DISTANCE_HAUT + 5 + 24, "le titre est bien à 24 pt au moins sous le bas du logo");
});

// Échoue si le titre # n'a plus un retrait de 1 cm à gauche et à droite, ou plus 24 pt après,
// ou si les autres titres reçoivent ce retrait.
test("titre # : retrait de 1 cm à gauche et à droite, 24 pt après", () => {
  const w = widgetPur();
  const doc = ordinaire(documentPdf(w, "# Titre\n\n## Article", {}));
  assert.deepStrictEqual(doc.content.map((b) => b.style), ["titre1", "titre2"]);
  assert.deepStrictEqual(doc.styles.titre1.margin, [CM(1), 0, CM(1), 24]);
  assert.equal(doc.styles.titre1.alignment, "center");
  assert.equal(doc.styles.titre1.fontSize, 12);
  assert.equal(doc.styles.titre1.bold, true);
  assert.deepStrictEqual(doc.styles.titre2.margin, [0, 18, 0, 8], "les articles n'ont pas le retrait du titre");
});

// ---------------------------------------------------------------------------
// 6. logosManquants et logo en échec : la génération n'est jamais bloquée
// ---------------------------------------------------------------------------

// Échoue si, selon le cas, logosManquants n'est pas exactement la liste du §11.2 : 'Logo' dès
// qu'il manque (vide, illisible ou téléchargement en échec), 'Logo_partenaire' seulement s'il
// était rempli. Échoue aussi si la génération est bloquée : le PDF doit être envoyé et rattaché,
// la convention mise à jour en mémoire, et le document ne contient que les logos lisibles.
const CAS_MANQUANTS = [
  ["les deux logos lisibles", {}, [], ["Logo", "Logo_partenaire"]],
  ["Logo vide (cellule vide), partenaire lisible", {logo: null}, ["Logo"], ["Logo_partenaire"]],
  ["Logo vide (liste sans fichier), partenaire lisible", {logo: ["L"]}, ["Logo"], ["Logo_partenaire"]],
  ["partenaire vide, Logo lisible : aucun message pour le partenaire", {partenaire: null}, [], ["Logo"]],
  ["les deux vides", {logo: null, partenaire: null}, ["Logo"], []],
  ["Logo illisible (GIF), partenaire vide", {partenaire: null, fichiers: {[ID_LOGO]: GIF}}, ["Logo"], []],
  ["partenaire rempli mais illisible (texte), Logo lisible", {fichiers: {[ID_PARTENAIRE]: TEXTE}}, ["Logo_partenaire"], ["Logo"]],
  ["les deux illisibles", {fichiers: {[ID_LOGO]: PDF, [ID_PARTENAIRE]: WEBP}}, ["Logo", "Logo_partenaire"], []],
  ["Logo : le serveur répond 404", {fichiers: {[ID_LOGO]: 404}}, ["Logo"], ["Logo_partenaire"]],
  ["partenaire : réseau coupé", {fichiers: {[ID_PARTENAIRE]: new Error("Failed to fetch")}}, ["Logo_partenaire"], ["Logo"]],
  ["Logo : le fichier ne se lit pas jusqu'au bout", {fichiers: {[ID_LOGO]: {illisible: true}}}, ["Logo"], ["Logo_partenaire"]],
];
for (const [nom, options, manquants, presents] of CAS_MANQUANTS) {
  test(`logosManquants : ${nom} → ${JSON.stringify(manquants)}, génération réussie`, async () => {
    const ctx = await preparer(options);

    const resultat = await ctx.w.conventionGenerer(1, VALEURS);

    assert.deepEqual(ordinaire(resultat.logosManquants), manquants);
    assert.ok(resultat.nomFichier.endsWith(".pdf"), "la génération réussit");
    assert.equal(ctx.fetchs.filter(estEnvoi).length, 1, "le PDF est envoyé");
    assert.equal(ctx.fetchs.filter(estPatch).length, 1, "le PDF est rattaché");
    const ligne = ctx.w.state.raw.Conventions.find((l) => l.id === ID_CONVENTION);
    assert.deepEqual(ordinaire(ligne.PDF_genere), ["L", ID_PIECE_JOINTE], "la convention est mise à jour en mémoire");

    assert.equal(ctx.docs.length, 1, "un seul PDF fabriqué");
    const colonnes = ctx.docs[0].header ? ordinaire(ctx.docs[0].header(1)).columns : [];
    const images = colonnes.filter((c) => c.image).map((c) => (c.alignment === "left" ? "Logo" : "Logo_partenaire"));
    assert.deepEqual(images, presents, "le document ne contient que les logos lisibles");
    assert.equal(ctx.journal.length, 0, "rien dans la console");
  });
}

// Échoue si un refus de pdfmake pour une image bloque la génération au lieu de refaire le PDF
// sans logo, ou si logosManquants ne nomme pas les logos retirés.
const REFUS_PDFMAKE = [
  ["Logo seul", {partenaire: null}, ["Logo"]],
  ["Logo et partenaire", {}, ["Logo", "Logo_partenaire"]],
  ["partenaire seul (Logo vide)", {logo: null}, ["Logo", "Logo_partenaire"]],
];
for (const [nom, options, manquants] of REFUS_PDFMAKE) {
  test(`logosManquants : pdfmake refuse l'image (${nom}) → PDF refait sans logo, ${JSON.stringify(manquants)}`, async () => {
    const ctx = await preparer({...options, pdfRefuseLesImages: true});

    const resultat = await ctx.w.conventionGenerer(1, VALEURS);

    assert.deepEqual(ordinaire(resultat.logosManquants), manquants);
    assert.equal(ctx.docs.length, 2, "le PDF est fabriqué deux fois");
    assert.ok(ctx.docs[0].header, "d'abord avec les logos");
    assert.equal(Object.hasOwn(ctx.docs[1], "header"), false, "puis sans logo");
    assert.equal(ctx.fetchs.filter(estEnvoi).length, 1, "le PDF sans logo est envoyé");
    assert.equal(ctx.fetchs.filter(estPatch).length, 1, "et rattaché");
    assert.equal(ctx.journal.length, 0, "rien dans la console");
  });
}

// ---------------------------------------------------------------------------
// 7. Un seul jeton par génération, en écriture, jamais montré
// ---------------------------------------------------------------------------

// Échoue si le jeton est demandé plus d'une fois, en lecture seule, après les logos ou après
// pdfmake, ou si les logos, l'envoi et le rattachement n'utilisent pas le même jeton.
test("jeton : un seul, en écriture, demandé avant les logos et avant pdfmake, le même partout", async () => {
  const ctx = await preparer();
  await ctx.w.conventionGenerer(1, VALEURS);

  assert.equal(ctx.jetons.length, 1, "getAccessToken n'est appelé qu'une fois");
  assert.deepEqual(ordinaire(ctx.jetons[0]), {readOnly: false});
  assert.deepEqual(ctx.trace, ["enregistrement", "jeton", "logo", "logo", "pdfmake", "pdf", "envoi", "rattachement"]);
  assert.equal(ctx.fetchs.length, 4, "deux logos, l'envoi, le rattachement");
  ctx.fetchs.forEach((requete) => assert.equal(jetonDe(requete), JETON, "même jeton dans chaque requête"));
});

// Échoue si, sans aucun logo, le widget demande plus (ou moins) d'un jeton, ou télécharge quelque chose.
test("jeton : sans aucun logo, un seul jeton quand même (pour l'envoi) et aucun téléchargement", async () => {
  const ctx = await preparer({logo: null, partenaire: null});
  await ctx.w.conventionGenerer(1, VALEURS);

  assert.equal(ctx.jetons.length, 1);
  assert.equal(ctx.fetchs.filter(estTelechargement).length, 0);
});

// Échoue si, quand le jeton est refusé, un logo est tout de même téléchargé, pdfmake chargé, ou
// si l'erreur ou la console montre le jeton.
test("jeton : refusé → envoi-impossible, aucun logo téléchargé, pdfmake non chargé, rien de secret montré", async () => {
  const ctx = await preparer({jetonRefuse: true});

  const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "envoi-impossible");
  assert.equal(ctx.fetchs.length, 0, "aucune requête, donc aucun logo");
  assert.ok(!ctx.trace.includes("pdfmake"), "pdfmake non chargé");
  assert.ok(!visible(erreur).includes(JETON), "pas de jeton dans l'erreur");
  assert.ok(!JSON.stringify(ctx.journal).includes(JETON), "pas de jeton dans la console");
});

// Échoue si l'erreur d'un téléchargement de logo (qui peut recopier l'adresse, donc le jeton)
// est reprise dans la console, dans le résultat de la génération ou dans la liste des logos manquants.
test("jeton : l'erreur réseau d'un logo, qui cite l'adresse avec le jeton, ne ressort ni dans la console ni dans le résultat", async () => {
  const adresseSecrete = new Error(`Failed to fetch ${BASE_URL}/attachments/${ID_LOGO}/download?auth=${JETON}`);
  const ctx = await preparer({fichiers: {[ID_LOGO]: adresseSecrete}});

  const resultat = await ctx.w.conventionGenerer(1, VALEURS);

  assert.deepEqual(ordinaire(resultat.logosManquants), ["Logo"]);
  assert.ok(!JSON.stringify(ctx.journal).includes(JETON), "pas de jeton dans la console");
  assert.ok(!JSON.stringify(ctx.journal).includes("auth="), "pas d'adresse avec ?auth= dans la console");
  assert.ok(!JSON.stringify(ordinaire(resultat)).includes(JETON), "pas de jeton dans le résultat");
  assert.equal(ctx.journal.length, 0, "rien dans la console");
});

// Échoue si un échec de l'envoi, après le téléchargement des logos, montre le jeton dans
// l'erreur ou la console, ou si la liste des logos fuit dans l'erreur.
test("jeton : l'envoi du PDF échoue après les logos → erreur sans jeton, ni dans l'erreur ni dans la console", async () => {
  const ctx = await preparer();
  const fetchInitial = ctx.w.window.fetch;
  ctx.w.window.fetch = (url, opts) => (estEnvoi({options: opts})
    ? Promise.reject(new Error(`Failed to fetch ${url}`))
    : fetchInitial(url, opts));

  const erreur = await attraper(ctx.w.conventionGenerer(1, VALEURS));

  assert.ok(erreur, "la génération est rejetée");
  assert.equal(erreur.code, "envoi-impossible");
  assert.ok(!visible(erreur).includes(JETON), "pas de jeton dans l'erreur");
  assert.ok(!JSON.stringify(ctx.journal).includes(JETON), "pas de jeton dans la console");
  assert.equal(ctx.journal.length, 0, "rien dans la console");
  assert.equal(ctx.fetchs.filter(estPatch).length, 0, "pas de rattachement");
});
