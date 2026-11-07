"use strict";

// Chargement de la bibliothèque « docx » (Évolution 3, backlog E3-1 et E3-2 ; remplace pdfmake pour le document
// généré). Même modèle de sécurité que celui de pdfmake, que ces tests reprennent un par un :
//  - chargerDocx et conventionChargerDocx (délai de 20 secondes) ;
//  - la bibliothèque n'est chargée qu'au clic sur « Générer » (jamais à l'ouverture de la page ni de la fenêtre) ;
//  - adresse figée (version exacte 9.15.2, fichier unique index.iife.js), empreinte SRI, crossorigin et
//    referrerpolicy ; un script en échec est retiré de la page ; une seule promesse par page.
// Aucun script n'est chargé pour de vrai : document est remplacé (après le chargement du widget) par une
// doublure qui note les scripts ajoutés, et les tests déclenchent eux-mêmes onload / onerror. Les minuteries sont
// simulées : on ne patiente jamais 20 secondes. Les doublures sont posées sur w.window (le vrai global du bac à
// sable ; w n'en est qu'une copie). L'adresse et l'empreinte sont recopiées en dur : si le code les change, le
// test doit échouer (changer de version demande de recalculer l'empreinte et de refaire la vérification).
// Ce que le navigateur ferait de l'empreinte (refuser un fichier modifié) n'est PAS testable ici : c'est le rôle
// du navigateur ; on vérifie seulement que l'attribut integrity est posé tel quel. Valeurs fictives uniquement.

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const {loadWidget} = require("./helpers/widget");
const {creerFauxDocx} = require("./helpers/docx");

const attendre = () => new Promise((resolve) => setImmediate(resolve));

async function attraper(promesse) {
  try { await promesse; } catch (erreur) { return erreur; }
  return undefined;
}

const DOCX = {
  url: "https://cdn.jsdelivr.net/npm/docx@9.15.2/dist/index.iife.js",
  integrity: "sha384-ud8085E8t6iW4uUom5nN5cpzTZ4OdsNKB/AKWfOsI62tzsoV2X7r7/o4KWESO8rq",
};
const CODE_DOCX = "docx-non-charge";

// Charge le widget, puis remplace document (le <head> note les scripts ajoutés) et les minuteries. scripts :
// tous les scripts ajoutés, dans l'ordre ; dansLaPage : ceux qui sont encore dans la page ; minuteries : chaque
// setTimeout demandé.
async function preparerChargement() {
  const w = loadWidget();
  await attendre();
  await attendre();
  const g = w.window;
  const scripts = [];
  const dansLaPage = [];
  const minuteries = [];
  g.document = Object.assign(Object.create(g.document), {
    createElement(balise) {
      const script = {balise, retire: false};
      script.remove = () => {
        script.retire = true;
        const i = dansLaPage.indexOf(script);
        if (i >= 0) dansLaPage.splice(i, 1);
      };
      return script;
    },
    head: {appendChild(script) { scripts.push(script); dansLaPage.push(script); return script; }},
  });
  g.setTimeout = (fonction, delai) => {
    const minuterie = {fonction, delai, annulee: false};
    minuteries.push(minuterie);
    return minuterie;
  };
  g.clearTimeout = (minuterie) => { if (minuterie) minuterie.annulee = true; };
  return {w, g, scripts, dansLaPage, minuteries};
}

// Ce que le script distant fournirait une fois chargé.
const fournirDocx = (g) => { g.docx = creerFauxDocx(); };

function verifierScript(script) {
  assert.equal(script.src, DOCX.url);
  assert.equal(script.integrity, DOCX.integrity);
  assert.equal(script.crossOrigin, "anonymous");
  assert.equal(script.referrerPolicy, "no-referrer");
}

// ---------------------------------------------------------------------------
// Chargement
// ---------------------------------------------------------------------------

// Échoue si le script n'a pas l'adresse figée (version exacte 9.15.2, fichier index.iife.js, jsDelivr, https), son
// empreinte integrity, crossorigin="anonymous" ou referrerpolicy="no-referrer", si autre chose que ce seul script est
// ajouté (pas de police, pas de second fichier), ou si quelque chose est ajouté à la page avant l'appel.
test("chargerDocx : un seul script, adresse figée (docx 9.15.2), integrity, crossorigin et referrerpolicy", async () => {
  const {w, g, scripts} = await preparerChargement();
  assert.equal(scripts.length, 0, "rien n'est ajouté avant l'appel");

  const promesse = w.chargerDocx();
  await attendre();
  assert.equal(scripts.length, 1, "un seul script");
  verifierScript(scripts[0]);
  assert.ok(scripts[0].src.startsWith("https://"), "https");
  assert.ok(scripts[0].src.includes("/docx@9.15.2/"), "version exacte figée, jamais « latest » ni une plage");
  assert.match(scripts[0].integrity, /^sha384-[A-Za-z0-9+/]{64}$/, "empreinte sha384 en base64");

  fournirDocx(g);
  scripts[0].onload();
  await promesse;
  assert.equal(scripts.length, 1, "aucun autre script après le chargement");
});

// Échoue si la bibliothèque est rechargée alors que window.docx est déjà là (un script de plus dans la page).
test("chargerDocx : si la bibliothèque est déjà présente, aucun script n'est ajouté", async () => {
  const {w, g, scripts} = await preparerChargement();
  fournirDocx(g);
  await w.chargerDocx();
  assert.equal(scripts.length, 0);
});

// Échoue si un deuxième appel (en cours de chargement, ou après la réussite) ajoute un autre script ou ne rend
// pas la même promesse : un seul chargement par page.
test("chargerDocx : un seul chargement par page, le deuxième appel rend la même promesse", async () => {
  const {w, g, scripts} = await preparerChargement();

  const premiere = w.chargerDocx();
  const deuxieme = w.chargerDocx();
  assert.equal(deuxieme, premiere, "même promesse pendant le chargement");
  await attendre();
  fournirDocx(g);
  scripts[0].onload();
  await premiere;

  const troisieme = w.chargerDocx();
  assert.equal(troisieme, premiere, "même promesse après la réussite");
  await troisieme;
  assert.equal(scripts.length, 1, "aucun script de plus");
});

// Échoue si l'échec du script (réseau, empreinte refusée par le navigateur) ne rejette pas avec le code
// 'docx-non-charge', si le script raté reste dans la page, ou si l'erreur ne garde pas la cause.
test("chargerDocx : script refusé → rejet docx-non-charge, script retiré de la page", async () => {
  const {w, scripts, dansLaPage} = await preparerChargement();

  const promesse = w.chargerDocx();
  await attendre();
  scripts[0].onerror();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "le chargement est rejeté");
  assert.equal(erreur.code, CODE_DOCX);
  assert.equal(scripts[0].retire, true, "le script raté est retiré");
  assert.equal(dansLaPage.length, 0, "plus aucun script dans la page");
});

// Échoue si, après un échec, un nouvel appel rend encore l'ancien rejet au lieu de recommencer, ou s'il ne
// rajoute pas un nouveau script avec les mêmes garde-fous.
test("chargerDocx : après un échec, un nouvel appel recommence et peut réussir", async () => {
  const {w, g, scripts, dansLaPage} = await preparerChargement();

  const echec = w.chargerDocx();
  await attendre();
  scripts[0].onerror();
  await attraper(echec);

  const nouvelle = w.chargerDocx();
  assert.notEqual(nouvelle, echec, "une nouvelle promesse");
  await attendre();
  assert.equal(scripts.length, 2, "un nouveau script");
  verifierScript(scripts[1]);
  fournirDocx(g);
  scripts[1].onload();
  await nouvelle;
  assert.deepEqual(dansLaPage, [scripts[1]], "seul le script réussi reste");
});

// Échoue si un script chargé mais qui ne fournit pas une bibliothèque utilisable (window.docx absent, ou sans
// Document, ou sans Packer.toBlob) est pris pour un succès (la génération échouerait plus tard) ou s'il reste dans la page.
test("chargerDocx : script chargé mais sans bibliothèque utilisable → rejet docx-non-charge, script retiré", async () => {
  const cas = {
    "window.docx absent": () => {},
    "sans Document": (g) => { g.docx = {Packer: {toBlob() {}}}; },
    "sans Packer.toBlob": (g) => { g.docx = {Document: class {}, Packer: {}}; },
  };
  for (const [nom, fournir] of Object.entries(cas)) {
    const {w, g, scripts, dansLaPage} = await preparerChargement();
    const promesse = w.chargerDocx();
    await attendre();
    fournir(g);
    scripts[0].onload();
    const erreur = await attraper(promesse);
    assert.ok(erreur, `${nom} : le chargement est rejeté`);
    assert.equal(erreur.code, CODE_DOCX, nom);
    assert.equal(scripts[0].retire, true, `${nom} : script retiré`);
    assert.equal(dansLaPage.length, 0, nom);
  }
});

// Échoue si la page (index.html) contient une balise docx ou jsDelivr (chargement dès l'ouverture), si chargerDocx
// est appelée ailleurs que dans conventionChargerDocx, ou si conventionChargerDocx est appelée ailleurs que dans
// conventionGenerer (donc au clic sur « Générer », jamais à l'ouverture), ou si pdfmake est encore appelé par la génération.
test("chargerDocx : rien n'est chargé à l'ouverture de la page ni de la fenêtre, seulement dans conventionGenerer", () => {
  const dossier = path.join(__dirname, "..", "src", "actions-dashboard");
  const page = fs.readFileSync(path.join(dossier, "index.html"), "utf8");
  assert.ok(!/docx|jsdelivr/i.test(page), "aucune balise docx ni jsDelivr dans la page");

  const source = fs.readFileSync(path.join(dossier, "script.js"), "utf8")
    .split("\n").filter((ligne) => !ligne.trim().startsWith("//")).join("\n");
  const corps = (debut) => {
    const i = source.indexOf(debut);
    assert.ok(i >= 0, `${debut} existe`);
    return source.slice(i, source.indexOf("\n}\n", i));
  };

  const appelsBruts = [...source.matchAll(/(?<!function )\bchargerDocx\(/g)];
  assert.equal(appelsBruts.length, 1, "chargerDocx n'est appelée qu'à un endroit");
  assert.ok(/\bchargerDocx\(/.test(corps("function conventionChargerDocx(")), "dans conventionChargerDocx");

  const appelsConvention = [...source.matchAll(/(?<!function )\bconventionChargerDocx\(/g)];
  assert.equal(appelsConvention.length, 1, "conventionChargerDocx n'est appelée qu'à un endroit");
  assert.ok(/\bconventionChargerDocx\(/.test(corps("async function conventionGenerer(")), "dans conventionGenerer");
});

// ---------------------------------------------------------------------------
// conventionChargerDocx : délai maximum de 20 secondes (minuterie simulée)
// ---------------------------------------------------------------------------

// Échoue si le délai n'est pas de 20000 ms, ou si la minuterie reste armée après la réussite (elle rejetterait la
// promesse 20 secondes plus tard).
test("conventionChargerDocx : minuterie de 20 secondes, annulée quand le chargement réussit", async () => {
  const {w, g, scripts, minuteries} = await preparerChargement();

  const promesse = w.conventionChargerDocx();
  assert.equal(minuteries.length, 1, "une seule minuterie");
  assert.equal(minuteries[0].delai, 20000);
  assert.equal(minuteries[0].annulee, false, "armée pendant le chargement");

  await attendre();
  fournirDocx(g);
  scripts[0].onload();
  await promesse;
  assert.equal(minuteries[0].annulee, true, "annulée après la réussite");
});

// Échoue si, au bout des 20 secondes (minuterie déclenchée à la main), la promesse n'est pas rejetée avec le code
// 'docx-non-charge' alors que le script n'a rien répondu.
test("conventionChargerDocx : délai dépassé → rejet docx-non-charge", async () => {
  const {w, minuteries} = await preparerChargement();

  const promesse = w.conventionChargerDocx();
  await attendre();
  minuteries[0].fonction();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "la promesse est rejetée");
  assert.equal(erreur.code, CODE_DOCX);
});

// Échoue si un échec de chargement avant le délai ne rejette pas avec le code 'docx-non-charge', ou laisse la minuterie armée.
test("conventionChargerDocx : échec avant le délai → rejet docx-non-charge, minuterie annulée", async () => {
  const {w, scripts, minuteries} = await preparerChargement();

  const promesse = w.conventionChargerDocx();
  await attendre();
  scripts[0].onerror();
  const erreur = await attraper(promesse);

  assert.ok(erreur, "la promesse est rejetée");
  assert.equal(erreur.code, CODE_DOCX);
  assert.equal(minuteries[0].annulee, true, "minuterie annulée");
});

// ---------------------------------------------------------------------------
// Message affiché quand la bibliothèque n'est pas chargée (note UX §15.7)
// ---------------------------------------------------------------------------

// Échoue si le message de l'échec « bibliothèque non chargée » parle encore de « PDF » (E3 : « PDF » devient
// « document », le reste de la phrase ne change pas), s'il perd « Vos informations sont conservées. », ou si la
// re-génération n'ajoute pas « L'ancienne convention reste disponible. ».
test("message docx-non-charge : « l'outil qui fabrique le document n'a pas pu être chargé », sans PDF, texte exact de la note", async () => {
  const w = loadWidget();
  await attendre();
  const attendu = "La convention n'a pas pu être générée : l'outil qui fabrique le document n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez. Si le problème continue, contactez l'équipe du tableau de bord. Vos informations sont conservées.";
  const erreur = Object.assign(new Error("doublure"), {code: CODE_DOCX});
  assert.equal(w.conventionMessageEchec(erreur, false), attendu);
  assert.equal(w.conventionMessageEchec(erreur, true), `${attendu} L'ancienne convention reste disponible.`);
  assert.ok(!/PDF/i.test(w.conventionMessageEchec(erreur, false)), "plus aucun « PDF »");
});
