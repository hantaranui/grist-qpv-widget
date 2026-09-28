"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {loadClubs} = require("./helpers/clubs");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src", "clubs");
const plain = (value) => JSON.parse(JSON.stringify(value));

function columns(records) {
  const table = {id: records.map((record) => record.id)};
  const keys = new Set(records.flatMap((record) => Object.keys(record)));
  keys.delete("id");
  for (const key of keys) table[key] = records.map((record) => (key in record ? record[key] : null));
  return table;
}

// Deux DD dans deux DR differents, trois clubs : un rattache a chaque DD, et un
// troisieme (Multi) qui porte des actions de deux federations differentes — le
// cas des 10 clubs multi-federations constate le 28/09/2026.
function tables(w) {
  const raw = {
    Structures: [
      {id: 1, Nom: "Club Alpha", SIRET: "", Adresse: "", Code_postal: "60000", Code_Insee: "60057", DD: 10, Logo: null},
      {id: 2, Nom: "Club Beta", SIRET: "", Adresse: "", Code_postal: "75018", Code_Insee: "75118", DD: 20, Logo: null},
      {id: 3, Nom: "Club Multi", SIRET: "", Adresse: "", Code_postal: "", Code_Insee: "", DD: 10, Logo: ["L", 9]},
    ],
    DD: [{id: 10, Nom: "DD Oise", DR: 100}, {id: 20, Nom: "DD Paris", DR: 200}],
    DR: [{id: 100, Nom: "Hauts-de-France"}, {id: 200, Nom: "Île-de-France"}],
    Communes: [{id: 1, Code_Insee: "60057", Libelle_Commune: "Beauvais"}],
    Federations: [{id: 1, Nom: "Fédération Foot"}, {id: 2, Nom: "Fédération Rugby"}],
    Contacts: [],
    Actions: [
      {id: 1, Club: 1, Federation: 1},
      {id: 2, Club: 3, Federation: 1},
      {id: 3, Club: 3, Federation: 2},
      {id: 4, Club: 2, Federation: null},
    ],
    Cofinancements: [],
  };
  return Object.fromEntries(Object.entries(raw).map(([name, records]) => [name, w.rows(columns(records))]));
}

// --- Construction de la liste ------------------------------------------------

test("chaque club porte sa DD, sa DR, sa ville et ses federations", () => {
  const w = loadClubs();
  const clubs = plain(w.buildClubs(tables(w)));
  const byNom = Object.fromEntries(clubs.map((club) => [club.nom, club]));

  assert.deepEqual(byNom["Club Alpha"].dd, "DD Oise");
  assert.deepEqual(byNom["Club Alpha"].dr, "Hauts-de-France");
  assert.deepEqual(byNom["Club Alpha"].ville, "Beauvais", "ville lue via Code_Insee sur Communes");
  assert.deepEqual(byNom["Club Alpha"].federations, ["Fédération Foot"]);

  assert.deepEqual(byNom["Club Beta"].ville, "", "aucune commune ne correspond à un code INSEE vide");
  assert.deepEqual(byNom["Club Beta"].federations, [], "aucune action n'a de fédération pour ce club");

  assert.deepEqual(byNom["Club Multi"].federations, ["Fédération Foot", "Fédération Rugby"],
    "les deux fédérations sont affichées, triées, aucune n'est choisie à la place du métier");
  assert.deepEqual(byNom["Club Multi"].logoIds, [9]);
});

test("la liste est triee par nom de club", () => {
  const w = loadClubs();
  const noms = w.buildClubs(tables(w)).map((club) => club.nom);
  assert.deepEqual(plain(noms), ["Club Alpha", "Club Beta", "Club Multi"]);
});

test("un club sans structure connue ne fait pas planter la construction", () => {
  const w = loadClubs();
  const raw = tables(w);
  raw.Structures.push({id: 4, Nom: "Club orphelin", DD: 999, Code_Insee: "00000"});
  const club = w.buildClubs(raw).find((item) => item.nom === "Club orphelin");
  assert.deepEqual(club.dd, "");
  assert.deepEqual(club.ville, "");
});

// --- Filtres ------------------------------------------------------------------

test("le filtre Fédération retient un club des qu'une de ses fédérations correspond", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));

  w.state.filters = {federation: "Fédération Rugby"};
  assert.deepEqual(plain(w.filteredClubs().map((club) => club.nom)), ["Club Multi"]);

  w.state.filters = {federation: "Fédération Foot"};
  assert.deepEqual(plain(w.filteredClubs().map((club) => club.nom)), ["Club Alpha", "Club Multi"]);
});

test("les filtres Région, Département et Club se cumulent", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));

  w.state.filters = {dr: "Île-de-France"};
  assert.deepEqual(plain(w.filteredClubs().map((club) => club.nom)), ["Club Beta"]);

  w.state.filters = {dr: "Hauts-de-France", dd: "DD Oise", nom: "Club Multi"};
  assert.deepEqual(plain(w.filteredClubs().map((club) => club.nom)), ["Club Multi"]);

  w.state.filters = {dr: "Hauts-de-France", nom: "Club Beta"};
  assert.deepEqual(plain(w.filteredClubs()), [], "Club Beta n'est pas dans cette région : aucun résultat");
});

test("les options de chaque filtre sont les valeurs presentes, triees, sans doublon", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  assert.deepEqual(plain(w.optionsFor("federation")), ["Fédération Foot", "Fédération Rugby"]);
  assert.deepEqual(plain(w.optionsFor("dr")), ["Hauts-de-France", "Île-de-France"]);
  assert.deepEqual(plain(w.optionsFor("nom")), ["Club Alpha", "Club Beta", "Club Multi"]);
});

// --- Rendu de la liste ----------------------------------------------------------

test("chaque ligne porte un bouton Voir reel, pas de cellule vide invisible", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.renderRows(w.filteredClubs());

  const html = w.elements.get("rows").innerHTML;
  assert.match(html, /<button class="btn btn-secondary btn-sm" type="button" data-open-club="1">/);
  assert.match(html, /<span class="sr-only">Non renseigné<\/span>/, "une ville ou une fédération absente le dit aux lecteurs d'écran");
  assert.ok(!/<a\b/.test(html), "aucun lien, juste des boutons");
});

test("sans club correspondant, la liste le dit au lieu d'un tableau vide", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.renderRows([]);
  assert.equal(w.elements.get("empty").classList.contains("is-hidden"), false);
});

// --- Bascule liste / fiche -------------------------------------------------------

test("render() affiche la fiche et masque la liste une fois une ligne ouverte", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.state.view = "fiche";
  w.state.currentId = 1;
  w.render();

  assert.equal(w.elements.get("ficheView").classList.contains("is-hidden"), false);
  assert.equal(w.elements.get("listView").classList.contains("is-hidden"), true);
  assert.match(w.elements.get("ficheView").innerHTML, /Club Alpha/);
});

test("un identifiant de club introuvable revient a la liste plutot que d'afficher une fiche vide", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.state.view = "fiche";
  w.state.currentId = 404;
  w.render();

  assert.equal(w.state.view, "list");
  assert.equal(w.elements.get("listView").classList.contains("is-hidden"), false);
});

// --- Fiche : identite, zonages, logo ---------------------------------------------

test("la fiche est une carte « Club », comme le motif du tableau de bord", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.state.view = "fiche";
  w.state.currentId = 1;
  w.render();

  const html = w.elements.get("ficheView").innerHTML;
  assert.match(html, /<div class="edit-panel">/);
  assert.match(html, /<header class="edit-header">/);
  assert.match(html, /<button class="btn btn-secondary" type="button" id="backToList">/);
  assert.match(html, /<section class="edit-card">\s*<div class="section-head"><span>Club<\/span><\/div>/);
});

test("SIRET non renseigne et ville deja connue s'affichent sans attendre le reseau", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.state.view = "fiche";
  w.state.currentId = 1; // Club Alpha : SIRET vide, ville "Beauvais" déjà résolue via Communes.
  w.render();

  const html = w.elements.get("ficheView").innerHTML;
  assert.match(html, /SIRET : <span class="muted-text">non renseigné<\/span>/);
  assert.match(html, /id="clubAddress">.*Beauvais/);
  assert.match(html, /id="qpvResult">Vérification en cours…/, "code INSEE connu : la vérification QPV est lancée");
  assert.match(html, /id="frrResult">Vérification en cours…/);
});

test("sans code INSEE, les zonages sont tranches immediatement, pas de verification en cours", () => {
  const w = loadClubs();
  w.state.clubs = w.buildClubs(tables(w));
  w.state.view = "fiche";
  w.state.currentId = 3; // Club Multi : pas de code INSEE, mais un logo.
  w.render();

  const html = w.elements.get("ficheView").innerHTML;
  assert.match(html, /id="qpvResult">.*code INSEE du club non renseigné/s);
  assert.match(html, /id="frrResult">.*code INSEE du club non renseigné/s);
});

test("fillCommune n'interroge le reseau que si la ville n'est pas deja connue", async () => {
  const w = loadClubs();
  const clubs = w.buildClubs(tables(w));
  const clubAlpha = clubs.find((club) => club.nom === "Club Alpha"); // ville déjà "Beauvais"
  w.state.currentId = clubAlpha.id;
  await w.fillCommune(clubAlpha);
  assert.equal(w.calls.fetches.length, 0, "la ville vient déjà de la table Communes, inutile de la redemander");

  const clubMulti = clubs.find((club) => club.nom === "Club Multi");
  clubMulti.codeInsee = "99999"; // code présent mais absent de Communes, comme un cas réel non couvert
  w.state.currentId = clubMulti.id;
  await w.fillCommune(clubMulti);
  assert.equal(w.calls.fetches.length, 1, "sans ville connue, le nom de commune est demandé à geo.api.gouv.fr");
});

test("le logo se comporte comme dans fiche-club : affiche, ou bouton d'ajout", () => {
  const w = loadClubs();
  const sansLogo = {id: 1, nom: "Club Alpha", logoIds: []};
  const avecLogo = {id: 3, nom: "Club Multi", logoIds: [9]};

  assert.match(w.renderLogo(sansLogo, null, {}), /<button class="btn btn-secondary btn-sm" type="button" id="addLogo">/);
  const url = w.logoUrl(avecLogo.logoIds, {token: "jeton", baseUrl: "https://grist.example/api/docs/DOC"});
  assert.match(w.renderLogo(avecLogo, url, {}), /<img src="https:\/\/grist\.example\/api\/docs\/DOC\/attachments\/9\/download\?auth=jeton" alt="Logo de Club Multi">/);
  assert.ok(!w.renderLogo(avecLogo, url, {}).includes("addLogo"), "un logo existant ne propose pas d'en ajouter un autre");
});

test("isCurrent suit state.currentId, pas state.clubId (fiche-club utilise l'autre nom)", () => {
  const w = loadClubs();
  w.state.currentId = 5;
  assert.equal(w.isCurrent({id: 5}), true);
  assert.equal(w.isCurrent({id: 6}), false);
});

test("les fonctions de zonages et de logo n'ont pas diverge de fiche-club", () => {
  // Dupliquees faute de module partage entre widgets (voir la note en tete de
  // src/clubs/script.js) : ce test echoue si l'une des deux copies est modifiee
  // sans repercuter le changement sur l'autre. Trois fonctions sont exclues
  // volontairement : isCurrent (nom de propriété d'état différent), fillCommune
  // (ici, la ville est déjà connue via la table Communes, inutile dans
  // fiche-club) et addLogo (recharge la fiche différemment selon le widget).
  const source = (fichier, nom) => {
    const code = fs.readFileSync(fichier, "utf8");
    const debut = code.indexOf(`function ${nom}(`);
    assert.ok(debut >= 0, `${nom} introuvable dans ${path.relative(ROOT, fichier)}`);
    let profondeur = 0;
    for (let i = code.indexOf("{", debut); i < code.length; i += 1) {
      if (code[i] === "{") profondeur += 1;
      if (code[i] === "}" && --profondeur === 0) return code.slice(debut, i + 1).replace(/\s+/g, " ");
    }
    throw new Error(`fin de ${nom} introuvable`);
  };
  const ficheClub = path.join(ROOT, "src", "fiche-club", "script.js");
  const noms = [
    "once", "formatSiret", "logoUrl", "addressLine", "parentCommune", "communeCodes",
    "renderAddress", "renderLogo", "renderQpv", "renderFrr", "writeInto", "communeName",
    "fillZonages", "frrFor", "loadFrr", "indexFrr", "frrStatus", "qpvFor",
    "hasUsableStreetAddress", "geocode", "banResult", "loadQpvList", "selectQpvListResource",
    "parseQpvList", "parseCsvLine", "loadQpvContours", "fetchJson", "readCache", "writeCache",
    "selectGeojsonResource", "chooseGeojsonFile", "geometryContainsPoint", "polygonContainsPoint",
    "ringContainsPoint", "bindLogo", "logoFileProblem", "uploadLogo", "errorDetail", "uploadErrorMessage",
  ];
  for (const nom of noms) {
    assert.equal(source(path.join(SRC, "script.js"), nom), source(ficheClub, nom), `${nom} a divergé de fiche-club`);
  }
});

// --- Feuille de style -------------------------------------------------------------

const CSS = fs.readFileSync(path.join(SRC, "style.css"), "utf8");

test("la feuille ne reprend aucun nom de classe du design system", () => {
  const reserves = ["table", "layout", "tag", "section", "btn", "badge", "card", "alert", "modal",
    "dropdown", "form-control", "form-label", "form-check", "container", "row", "col",
    "sr-only", "icon", "header", "footer", "tooltip", "pagination", "breadcrumb"];
  const enTete = new Set();
  for (const bloc of CSS.split("}")) {
    const selecteurs = bloc.split("{")[0];
    if (!selecteurs || selecteurs.includes("@")) continue;
    for (const selecteur of selecteurs.split(",")) {
      const premier = selecteur.trim().match(/^\.([\w-]+)/);
      if (premier) enTete.add(premier[1]);
    }
  }
  assert.deepEqual(reserves.filter((nom) => enTete.has(nom)), []);
});

test("aucune couleur n'est ecrite en dur : tout vient de la palette", () => {
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(CSS.replace(/background-image: url\("data:image\/svg\+xml[^"]*"\)/g, "")),
    "couleur hors palette du design system (l'indicateur de liste déroulante, en data-URI, est exclu : c'est une image, pas une couleur)");
});

test("le tableau defile plutot que de perdre ses colonnes sous 400 px", () => {
  assert.match(CSS, /\.table-panel \{[^}]*overflow-x: auto;/);
  assert.match(CSS, /@media \(max-width: 560px\)/);
});

test("l'en-tete de la fiche s'empile sous 400 px plutot que d'ecraser le bouton retour", () => {
  assert.match(CSS, /@media \(max-width: 560px\) \{[^@]*\.edit-header \{ flex-direction: column;/,
    "un titre de club sur deux lignes ne laisse presque plus de place au bouton, cote a cote");
});

test("Ville, DD et DR ont plus de place que Club, qui prenait tout le vide", () => {
  const largeur = (classe) => Number((CSS.match(new RegExp(`\\.${classe} \\{ width: (\\d+)%; \\}`)) || [])[1]);
  const [club, ville, dd, dr] = ["col-club", "col-ville", "col-dd", "col-dr"].map(largeur);
  assert.ok(club && ville && dd && dr, "chaque colonne a une largeur déclarée");
  assert.ok(ville > club / 2 && dd > club / 2 && dr > club / 2,
    "Ville, DD et DR ne sont plus écrasées face à Club");
});
