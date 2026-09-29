"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const {loadFiche, reponse} = require("./helpers/fiche-club");
const {lireEntreeZip, lireFeuilleFrr, millesime} = require("../scripts/maj-frr");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src", "fiche-club");

// Les objets crees dans le bac a sable ont leurs propres prototypes : on les
// ramene a des valeurs simples avant de les comparer.
const plain = (value) => JSON.parse(JSON.stringify(value));

// Tables au format colonnes, celui que renvoie grist.docApi.fetchTable.
function columns(records) {
  const table = {id: records.map((record) => record.id)};
  const keys = new Set(records.flatMap((record) => Object.keys(record)));
  keys.delete("id");
  for (const key of keys) table[key] = records.map((record) => (key in record ? record[key] : null));
  return table;
}

// 1er mars 2026, 15 janvier 2026 et 2 juin 2025 a minuit UTC, comme Grist range
// une colonne Date.
const MARS_2026 = Date.UTC(2026, 2, 1) / 1000;
const JANVIER_2026 = Date.UTC(2026, 0, 15) / 1000;
const JUIN_2025 = Date.UTC(2025, 5, 2) / 1000;

function tables(w) {
  const raw = {
    Structures: [
      {id: 7, Nom: "Club fictif de Beauvais", SIRET: "12345678900012", Adresse: "1 rue des Fleurs", Code_postal: "60000", Code_Insee: "60057", Logo: null},
      {id: 8, Nom: "Club sans rien", SIRET: "", Adresse: "", Code_postal: "15000", Code_Insee: "15014", Logo: ["L", 42]},
    ],
    Contacts: [
      {id: 1, Prenom: "Zoé", Nom: "Martin", Email: "zoe.martin@example.org", Telephone: "06 12 34 56 78", Club: 7},
      {id: 2, Prenom: "Alex", Nom: "Bernard", Email: "", Telephone: "", Club: 7},
      {id: 3, Prenom: "Camille", Nom: "Autre", Email: "camille@example.org", Telephone: "", Club: 99},
    ],
    Dispositifs: [{id: 1, Dispositif: "Du stade vers l'emploi", Code: "DSVE"}, {id: 2, Dispositif: "", Code: "ESS"}],
    Actions: [
      {id: 10, Club: 7, Date: JUIN_2025, Statut: "Réalisée", Dispositif: 1, Budget: 3000, Periode_approx: ""},
      {id: 11, Club: 7, Date: MARS_2026, Statut: "Planifiée", Dispositif: 2, Budget: 2000, Periode_approx: ""},
      {id: 12, Club: 7, Date: null, Statut: "A confirmer", Dispositif: 1, Budget: 0, Periode_approx: "Automne 2026"},
      {id: 13, Club: 7, Date: JANVIER_2026, Statut: "Planifiée", Dispositif: 1, Budget: 1000, Periode_approx: ""},
      {id: 14, Club: 7, Date: null, Statut: "A confirmer", Dispositif: 1, Budget: 500, Periode_approx: ""},
      {id: 20, Club: 8, Date: MARS_2026, Statut: "Planifiée", Dispositif: 1, Budget: 1000, Periode_approx: ""},
    ],
    Cofinancements: [
      {id: 1, Action: 10, Montant: 1000},
      {id: 2, Action: 10, Montant: 500},
      {id: 3, Action: 11, Montant: 2400},
      {id: 4, Action: 99, Montant: 800},
    ],
  };
  // Passage par le format colonnes, puis retour en lignes par la fonction du
  // widget : c'est le chemin reel des donnees.
  return Object.fromEntries(Object.entries(raw).map(([name, records]) => [name, w.rows(columns(records))]));
}

// --- Construction de la fiche -------------------------------------------------

test("la fiche reunit le club, ses contacts et ses actions", () => {
  const w = loadFiche();
  const fiche = plain(w.buildFiche(tables(w), 7));

  assert.deepEqual(fiche.club, {
    id: 7, nom: "Club fictif de Beauvais", siret: "12345678900012", adresse: "1 rue des Fleurs",
    codePostal: "60000", codeInsee: "60057", logoIds: [],
  });
  assert.deepEqual(fiche.contacts.map((contact) => contact.prenom), ["Alex", "Zoé"],
    "les contacts du seul club 7, classés par nom");
  assert.equal(fiche.actions.length, 5, "les actions des autres clubs sont écartées");

  const realisee = fiche.actions.find((action) => action.id === 10);
  assert.equal(realisee.dispositif, "Du stade vers l'emploi");
  assert.equal(realisee.financed, 1500, "somme des cofinancements de l'action");
  assert.equal(fiche.actions.find((action) => action.id === 11).dispositif, "ESS",
    "à défaut de libellé, le code du dispositif");
});

test("un club absent de Structures ne donne pas de fiche", () => {
  const w = loadFiche();
  assert.equal(w.buildFiche(tables(w), 404), null);
});

test("les actions sont classees par date decroissante, les non datees a la fin", () => {
  const w = loadFiche();
  const ids = w.buildFiche(tables(w), 7).actions.map((action) => action.id);
  assert.deepEqual(plain(ids), [11, 13, 10, 14, 12],
    "mars 2026, janvier 2026, juin 2025, puis les actions sans date, dernière saisie en tête");
});

test("le pourcentage de financement rapporte les cofinancements au budget", () => {
  const w = loadFiche();
  const byId = new Map(w.buildFiche(tables(w), 7).actions.map((action) => [action.id, action]));

  assert.equal(w.percent(byId.get(10).rate), 50, "1 500 € sur 3 000 €");
  assert.equal(w.percent(byId.get(11).rate), 120, "un dépassement reste visible");
  assert.equal(w.percent(byId.get(13).rate), 0, "budget sans cofinancement");
  assert.equal(byId.get(12).rate, null, "sans budget, pas de taux plutôt qu'un faux 0 %");
  assert.equal(w.percent(w.coverage(1, 3)), 33, "arrondi à l'entier");
});

test("chaque action tient en quatre colonnes : date, statut, dispositif, financement", () => {
  const w = loadFiche();
  const html = w.renderActions(w.buildFiche(tables(w), 7).actions);
  const premiere = html.slice(html.indexOf('<li class="action-item">'), html.indexOf("</li>"));
  const colonnes = [...premiere.matchAll(/^      <span class="(action-[\w-]+)">/gm)].map((m) => m[1]);
  assert.deepEqual(colonnes, ["action-date", "action-status", "action-dispositif", "action-funding"]);
  assert.match(premiere, /<span class="action-date">01\/03\/2026<\/span>/, "le statut n'est plus dans la date");
  assert.match(premiere, /<span class="action-status"><span class="status-tag planifiee">Planifiée<\/span><\/span>/);
  assert.match(html, /<span class="action-date">Automne 2026<\/span>/, "sans date, la période approximative");
  assert.match(html, /<span class="action-date"><span class="muted-text">Date à définir<\/span><\/span>/,
    "ni date ni période");
});

test("la barre plafonne a 100 % mais le texte dit le depassement", () => {
  const w = loadFiche();
  const html = w.renderFunding({rate: 1.2});
  assert.match(html, /aria-valuenow="100"/);
  assert.match(html, /aria-valuetext="120 % du budget financé"/);
  assert.match(html, /width:100%/);
  assert.match(html, /120 % financé/);
  assert.ok(html.indexOf("funding-rate") < html.indexOf("funding-bar"),
    "le pourcentage precede la barre, pour s'afficher au-dessus d'elle");
  assert.match(w.renderFunding({rate: null}), /Budget non renseigné/);
});

test("les valeurs de Grist sont lues sous toutes leurs formes", () => {
  const w = loadFiche();
  assert.deepEqual(plain(w.attachmentIds(["L", 42, 43])), [42, 43]);
  assert.deepEqual(plain(w.attachmentIds([42])), [42]);
  assert.deepEqual(plain(w.attachmentIds(null)), []);
  assert.deepEqual(plain(w.attachmentIds("")), []);
  assert.equal(w.dateSeconds(MARS_2026), MARS_2026);
  assert.equal(w.dateSeconds(new Date(MARS_2026 * 1000)), MARS_2026);
  assert.equal(w.dateSeconds(null), null);
  assert.equal(w.formatDate(MARS_2026), "01/03/2026", "pas de recul d'un jour selon le fuseau");
  assert.equal(w.formatSiret("12345678900012"), "123 456 789 00012");
  assert.equal(w.telHref("06 12 34 56 78"), "tel:+33612345678");
  assert.equal(w.mailHref("pas une adresse"), null);
});

// --- Rendu ---------------------------------------------------------------------

test("sans contact ni action, la fiche le dit au lieu d'afficher une liste vide", () => {
  const w = loadFiche();
  const html = w.renderFiche(w.buildFiche(tables(w), 8), {});
  assert.match(html, /Aucun contact enregistré pour ce club\./);
  assert.ok(!html.includes('class="contact-list"'));
  assert.match(html, /Adresse non renseignée/);
  assert.match(html, /SIRET : <span class="muted-text">non renseigné<\/span>/);

  const sansAction = w.renderFiche({...w.buildFiche(tables(w), 8), actions: []}, {});
  assert.match(sansAction, /Aucune action portée par ce club\./);
});

test("les contacts sont des liens reels, sans entete de tableau", () => {
  const w = loadFiche();
  const html = w.renderFiche(w.buildFiche(tables(w), 7), {});
  assert.ok(!/<table|<th/.test(html), "une liste, pas un tableau");
  assert.match(html, /<a class="contact-mail" href="mailto:zoe\.martin@example\.org">/);
  assert.match(html, /<a class="contact-tel" href="tel:\+33612345678">06 12 34 56 78<\/a>/);
  assert.match(html, /<span class="sr-only">E-mail non renseigné<\/span>/,
    "une valeur absente est annoncée aux lecteurs d'écran");
});

test("sans logo, la fiche propose un vrai bouton pour en ajouter un", () => {
  const w = loadFiche();
  const html = w.renderFiche(w.buildFiche(tables(w), 7), {logoUrl: null});
  assert.match(html, /<button class="btn btn-secondary btn-sm" type="button" id="addLogo">/);
  assert.match(html, /<input class="logo-input" type="file" id="logoInput" accept="image\/png,/);
  assert.ok(!html.includes("<img"));
});

test("un logo existant s'affiche par une URL signee, sans bouton d'ajout", () => {
  const w = loadFiche();
  const club = w.buildFiche(tables(w), 8).club;
  const url = w.logoUrl(club.logoIds, {token: "a b", baseUrl: "https://grist.example/api/docs/DOC"});
  assert.equal(url, "https://grist.example/api/docs/DOC/attachments/42/download?auth=a%20b");

  const html = w.renderLogo(club, url, {});
  assert.match(html, /<img src="https:\/\/grist\.example\/api\/docs\/DOC\/attachments\/42\/download\?auth=a%20b" alt="Logo de Club sans rien">/);
  assert.ok(!html.includes("addLogo"));

  // Logo present mais jeton indisponible : surtout ne pas proposer d'en ajouter.
  const sansJeton = w.renderLogo(club, w.logoUrl(club.logoIds, null), {});
  assert.match(sansJeton, /Logo non affichable/);
  assert.ok(!sansJeton.includes("addLogo"));
});

test("le texte saisi est echappe", () => {
  const w = loadFiche();
  const fiche = w.buildFiche(tables(w), 7);
  fiche.club.nom = '<img src=x onerror="alert(1)">';
  const html = w.renderFiche(fiche, {});
  assert.ok(!html.includes("<img src=x"));
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("le FRR est explique comme successeur des ZRR", () => {
  const w = loadFiche();
  const html = w.renderFiche(w.buildFiche(tables(w), 7), {});
  assert.match(html, /remplace les zones de revitalisation rurale \(ZRR\) depuis le 1<sup>er<\/sup> juillet 2024/);
});

// --- FRR -----------------------------------------------------------------------

const FRR = JSON.parse(fs.readFileSync(path.join(ROOT, "donnees", "frr-communes.json"), "utf8"));

test("la liste FRR versionnee couvre toutes les communes et se lit par code", () => {
  const w = loadFiche();
  const frr = w.indexFrr(FRR);
  assert.ok(frr.index.size > 34000, "toutes les communes, classées ou non");
  assert.equal(frr.geographie, "Commune (2025)");
  assert.match(FRR.extraitLe, /^\d{4}-\d{2}-\d{2}$/);

  assert.equal(frr.index.get("15014"), "4", "Aurillac est classée FRR");
  assert.equal(frr.index.get("60057"), "0", "Beauvais ne l'est pas");
});

test("le classement FRR se lit sur la commune, arrondissements compris", () => {
  const w = loadFiche();
  const frr = w.indexFrr({geographie: "Commune (2025)", communes: {"0": "75056 60057", "4": "15014", "5": "23001", "1": "01001", "2": "01187"}});

  assert.deepEqual(plain(w.frrStatus(frr, "75118")), {etat: "classement", classement: "0", code: "75056"},
    "Paris 18e se lit sur Paris");
  assert.match(w.renderFrr(w.frrStatus(frr, "15014")), /<strong>FRR<\/strong>/);
  assert.match(w.renderFrr(w.frrStatus(frr, "23001")), /<strong>FRR\+<\/strong>/);
  assert.match(w.renderFrr(w.frrStatus(frr, "01001")), /ancienne commune ZRR, sous mesure transitoire/);
  assert.match(w.renderFrr(w.frrStatus(frr, "60057")), /<strong>Hors FRR<\/strong>/);
  assert.match(w.renderFrr(w.frrStatus(frr, "01187")), /Situation particulière.*Observatoire des territoires/,
    "code sans libellé établi : renvoi vers la source plutôt qu'une supposition");
  assert.match(w.renderFrr(w.frrStatus(frr, "99999")), /commune 99999 absente de la liste FRR Commune \(2025\)/);
});

test("le script de mise a jour lit l'archive xlsx de l'Observatoire", () => {
  const feuille = `<?xml version="1.0"?><worksheet><sheetData>
    <row r="2"><c r="A2" t="inlineStr"><is><t>France ruralités revitalisation (Commune (2025))</t></is></c></row>
    <row r="5"><c r="A5" t="inlineStr"><is><t>codgeo</t></is></c><c r="B5" t="inlineStr"><is><t>libgeo</t></is></c><c r="C5" t="inlineStr"><is><t>codefrr</t></is></c></row>
    <row r="6"><c r="A6" t="inlineStr"><is><t>01001</t></is></c><c r="B6" t="inlineStr"><is><t>L&apos;Abergement</t></is></c><c r="C6" s="1"/></row>
    <row r="7"><c r="A7" t="inlineStr"><is><t>15014</t></is></c><c r="B7" t="inlineStr"><is><t>Aurillac</t></is></c><c r="C7"><v>4</v></c></row>
    <row r="8"><c r="A8" t="inlineStr"><is><t>2A004</t></is></c><c r="B8" t="inlineStr"><is><t>Ajaccio</t></is></c><c r="C8" t="inlineStr"><is><t>5</t></is></c></row>
  </sheetData></worksheet>`;

  // Archive zip minimale, compressee comme le serait un vrai .xlsx.
  const nom = Buffer.from("xl/worksheets/sheet1.xml");
  const donnees = zlib.deflateRawSync(Buffer.from(feuille));
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(donnees.length, 18); local.writeUInt16LE(nom.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(8, 10);
  central.writeUInt32LE(donnees.length, 20); central.writeUInt16LE(nom.length, 28);
  central.writeUInt32LE(0, 42);
  const debutCentral = local.length + nom.length + donnees.length;
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(1, 10);
  fin.writeUInt32LE(central.length + nom.length, 12); fin.writeUInt32LE(debutCentral, 16);
  const archive = Buffer.concat([local, nom, donnees, central, nom, fin]);

  const xml = lireEntreeZip(archive, "xl/worksheets/sheet1.xml");
  assert.deepEqual(lireFeuilleFrr(xml), {"0": ["01001"], "4": ["15014"], "5": ["2A004"]});
  assert.equal(millesime(xml), "Commune (2025)");
  assert.throws(() => lireFeuilleFrr("<row><c r=\"A1\"><v>autre</v></c></row>"), /format du fichier a change/);
});

// --- QPV -----------------------------------------------------------------------

const LISTE_QPV = [
  "﻿code_qp;lib_qp;insee_reg;lib_reg;insee_dep;lib_dep;insee_com;lib_com;siren_epci;lib_epci",
  'QN06099M;Quartier fictif;32;Hauts-de-France;60;Oise;"=""60057""";Beauvais;200067999;CA',
  'QN01341I;Les Escourtines;93;PACA;13;Bouches-du-Rhône;"=""13055;13070""";"Marseille; La Penne";200054807;Métropole',
].join("\r\n");

// Un carre autour de la rue fictive, en longitude / latitude.
const CONTOURS = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {code_qp: "QN06099M", lib_qp: "Quartier fictif", insee_com: "60057"},
    geometry: {type: "Polygon", coordinates: [[[2.0, 49.4], [2.2, 49.4], [2.2, 49.5], [2.0, 49.5], [2.0, 49.4]]]},
  }],
};

test("la liste des QPV rattache chaque quartier a toutes ses communes", () => {
  const w = loadFiche();
  const liste = w.parseQpvList(LISTE_QPV);
  assert.deepEqual(plain(liste.get("60057")), [{code: "QN06099M", nom: "Quartier fictif"}]);
  assert.equal(liste.get("13055")[0].code, "QN01341I", "quartier à cheval sur deux communes");
  assert.equal(liste.get("13070")[0].code, "QN01341I");
  assert.deepEqual(plain(w.communeCodes("02571, 02691")), ["02571", "02691"], "séparateur des contours");
});

function reseauQpv({ban}) {
  return (url) => {
    if (url.startsWith("https://www.data.gouv.fr/api/1/datasets/")) {
      return reponse({resources: [
        {format: "csv", title: "Liste des quartiers prioritaires de la politique de la ville 2024 (format CSV)", url: "https://static.example/liste.csv"},
        {format: "zip", title: "Perimètre des quartiers prioritaires de la politique de la ville 2024 (format geojson)", url: "https://static.example/qpv.zip"},
      ]});
    }
    if (url === "https://static.example/liste.csv") return reponse(LISTE_QPV);
    if (url === "https://static.example/qpv.zip") return Promise.resolve({ok: true, status: 200, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))});
    if (url.startsWith("https://api-adresse.data.gouv.fr/")) return reponse(ban);
    return Promise.reject(new Error(`inattendu : ${url}`));
  };
}

// JSZip n'est pas charge en test : l'archive sert directement le GeoJSON.
const JSZIP = {loadAsync: () => Promise.resolve({files: {a: {
  dir: false,
  name: "GEOJSON/QP2024_France_Hexagonale_Outre_Mer_WGS84.geojson",
  async: () => Promise.resolve(JSON.stringify(CONTOURS)),
}}})};

const club = (champs) => ({id: 7, adresse: "1 rue des Fleurs", codePostal: "60000", codeInsee: "60057", ...champs});

test("une commune sans quartier prioritaire suffit a conclure, sans geocodage", async () => {
  const w = loadFiche({fetch: reseauQpv({ban: {}})});
  const result = await w.qpvFor(club({codeInsee: "15014", adresse: ""}));
  assert.deepEqual(plain(result), {etat: "commune-sans-qpv"});
  assert.ok(!w.calls.fetches.some((call) => call.url.includes("api-adresse")), "aucun appel à la BAN");
});

test("sans adresse, le QPV reste a determiner dans une commune qui en compte", async () => {
  const w = loadFiche({fetch: reseauQpv({ban: {}})});
  const result = await w.qpvFor(club({adresse: ""}));
  assert.deepEqual(plain(result), {etat: "sans-adresse", nombre: 1});
  assert.match(w.renderQpv(result), /À déterminer.*1 quartier prioritaire ; l'adresse du club est nécessaire/);
  assert.ok(!w.calls.fetches.some((call) => call.url.includes("api-adresse")),
    "pas de géocodage au centre de la commune");
});

test("une adresse geocodee dans un contour donne le quartier", async () => {
  const ban = {features: [{geometry: {coordinates: [2.1, 49.45]}, properties: {type: "housenumber", label: "1 Rue des Fleurs 60000 Beauvais"}}]};
  const w = loadFiche({fetch: reseauQpv({ban}), globals: {JSZip: JSZIP}});
  const result = await w.qpvFor(club({}));
  assert.deepEqual(plain(result), {etat: "dans", precision: "numero", quartier: {code: "QN06099M", nom: "Quartier fictif"}});

  const appel = new URL(w.calls.fetches.find((call) => call.url.includes("api-adresse")).url);
  assert.equal(appel.searchParams.get("citycode"), "60057", "géocodage restreint à la commune du club");
});

test("une adresse hors contour, ou localisee a la seule commune, ne conclut pas a tort", async () => {
  const dehors = {features: [{geometry: {coordinates: [2.5, 49.45]}, properties: {type: "street"}}]};
  const w = loadFiche({fetch: reseauQpv({ban: dehors}), globals: {JSZip: JSZIP}});
  assert.deepEqual(plain(await w.qpvFor(club({}))), {etat: "hors", precision: "rue"});

  const commune = {features: [{geometry: {coordinates: [2.1, 49.45]}, properties: {type: "municipality"}}]};
  const w2 = loadFiche({fetch: reseauQpv({ban: commune}), globals: {JSZip: JSZIP}});
  assert.deepEqual(plain(await w2.qpvFor(club({}))), {etat: "imprecise"});
});

test("la logique geometrique est celle de qpv-widget, sans divergence", () => {
  // Reprise a l'identique faute de pouvoir la partager (qpv-widget l'enferme
  // dans une IIFE) : ce test empeche les deux copies de diverger en silence.
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
  const qpv = path.join(ROOT, "src", "qpv-widget", "script.js");
  for (const nom of ["selectGeojsonResource", "chooseGeojsonFile", "geometryContainsPoint", "polygonContainsPoint", "ringContainsPoint"]) {
    assert.equal(source(path.join(SRC, "script.js"), nom), source(qpv, nom), `${nom} a divergé de qpv-widget`);
  }
});

// --- Televersement du logo -----------------------------------------------------

function fichier(type = "image/png", size = 1000) {
  return new File([Buffer.alloc(size)], "logo.png", {type});
}

test("le logo est televerse avec un jeton d'ecriture puis ecrit dans Structures.Logo", async () => {
  const w = loadFiche({fetch: (url) => (url.includes("/attachments?") ? reponse([42]) : Promise.reject(new Error(url)))});
  const ids = await w.uploadLogo(7, fichier());

  assert.deepEqual(plain(ids), [42]);
  assert.deepEqual(plain(w.calls.accessTokens), [{readOnly: false}], "jeton demandé sans lecture seule");
  const envoi = w.calls.fetches[0];
  assert.equal(envoi.url, "https://grist.example/api/docs/DOC/attachments?auth=jeton");
  assert.equal(envoi.options.method, "POST");
  assert.equal(envoi.options.credentials, "omit", "sans cookie, sans quoi Grist refuse l'origine étrangère");
  assert.equal(envoi.options.headers["X-Requested-With"], "XMLHttpRequest",
    "sans cet en-tête, Grist rejette l'envoi avant même de répondre avec ses en-têtes CORS");
  assert.ok(envoi.options.body.get("upload"), "fichier dans le champ attendu par Grist");
  assert.deepEqual(plain(w.calls.userActions), [[["UpdateRecord", "Structures", 7, {Logo: ["L", 42]}]]]);
});

test("un refus de Grist est explique a l'utilisateur", async () => {
  const w = loadFiche({fetch: () => reponse({error: "No write access"}, {status: 403})});
  await assert.rejects(w.uploadLogo(7, fichier()), (error) => {
    assert.match(w.uploadErrorMessage(error), /votre compte n'a pas le droit de modifier ce document/);
    return true;
  });
  assert.equal(w.calls.userActions.length, 0, "rien n'est écrit si le téléversement échoue");

  const acl = new Error("Blocked by table update access rules");
  assert.match(w.uploadErrorMessage(acl), /règles d'accès du document ne vous permettent pas/);
});

test("sans acces complet accorde au widget, le message dit ou l'activer", async () => {
  // « Acces complet » est un reglage du panneau de configuration du widget,
  // distinct de requiredAccess declare au chargement : getAccessToken le refuse
  // avant tout envoi, sans passer par le reseau.
  const w = loadFiche({grist: {docApi: {getAccessToken: () => Promise.reject(new Error("Access not granted. Current access level none"))}}});
  await assert.rejects(w.uploadLogo(7, fichier()), (error) => {
    assert.equal(error.step, "access");
    assert.match(w.uploadErrorMessage(error), /n'a pas l'accès complet au document/);
    return true;
  });
  assert.equal(w.calls.fetches.length, 0, "aucun envoi tente sans jeton");
});

test("un refus qui perd son message en traversant le widget reste explique", () => {
  // Error.message n'est pas enumerable : une passerelle qui serialise l'erreur
  // en JSON pour la faire traverser la frontiere widget/Grist peut la perdre.
  // Le message reste actionnable meme quand aucun texte n'a survecu.
  const w = loadFiche({grist: {docApi: {getAccessToken: () => Promise.reject({})}}});
  return assert.rejects(w.uploadLogo(7, fichier()), (error) => {
    assert.equal(error.step, "access");
    assert.match(w.uploadErrorMessage(error), /accès complet/);
    return true;
  });
});

test("un echec reseau general (meme la lecture) se distingue d'un echec propre a l'envoi", async () => {
  // Le POST et la sonde GET echouent toutes les deux : rien ne dit que c'est
  // l'envoi en particulier qui pose probleme.
  const w = loadFiche({fetch: () => Promise.reject(new TypeError("Failed to fetch"))});
  await assert.rejects(w.uploadLogo(7, fichier()), (error) => {
    assert.equal(error.step, "network");
    assert.match(w.uploadErrorMessage(error), /y compris pour une simple lecture/);
    assert.match(w.uploadErrorMessage(error), /console du navigateur/);
    return true;
  });
});

test("un echec reseau propre a l'envoi se distingue d'un echec general", async () => {
  // La sonde (GET, sans methode ni corps inhabituels) reussit ; seul le POST
  // multipart echoue — le message doit dire que ce n'est pas Grist en general.
  const w = loadFiche({fetch: (url, options) => (options && options.method === "POST" ? Promise.reject(new TypeError("Failed to fetch")) : reponse({}))});
  await assert.rejects(w.uploadLogo(7, fichier()), (error) => {
    assert.equal(error.step, "network");
    assert.match(w.uploadErrorMessage(error), /une simple lecture, elle, fonctionne/);
    return true;
  });
});

test("un fichier envoye mais non rattache le dit, sans faire perdre le televersement", async () => {
  const w = loadFiche({
    fetch: (url) => (url.includes("/attachments?") ? reponse([42]) : Promise.reject(new Error(url))),
    grist: {docApi: {applyUserActions: () => Promise.reject(new Error("boom"))}},
  });
  await assert.rejects(w.uploadLogo(7, fichier()), (error) => {
    assert.equal(error.step, "update");
    assert.deepEqual(plain(error.uploadedIds), [42], "l'identifiant déjà envoyé n'est pas perdu");
    assert.match(w.uploadErrorMessage(error), /envoyé mais n'a pas pu être rattaché/);
    return true;
  });
});

test("seules les images raisonnables sont acceptees", () => {
  const w = loadFiche();
  assert.equal(w.logoFileProblem(fichier("image/png")), "");
  assert.match(w.logoFileProblem(fichier("application/pdf")), /Format non pris en charge/);
  assert.match(w.logoFileProblem(fichier("image/png", 6 * 1024 * 1024)), /5 Mo au maximum/);
});

// --- Feuille de style ----------------------------------------------------------

const CSS = fs.readFileSync(path.join(SRC, "style.css"), "utf8");

test("le pourcentage de financement se cale a droite, au-dessus de la barre", () => {
  assert.match(CSS, /\.funding-rate \{ align-self: flex-end; \}/);
});

test("la feuille ne reprend aucun nom de classe du design system", () => {
  // Meme liste que test/styles.test.js : une classe redefinie sous un nom du
  // design system heriterait de ses regles en silence.
  const reserves = ["table", "layout", "tag", "section", "btn", "badge", "card", "alert", "modal",
    "dropdown", "form-control", "form-label", "form-check", "container", "row", "col",
    "sr-only", "icon", "header", "footer", "tooltip", "pagination", "breadcrumb", "progress", "progress-bar"];
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
  assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(CSS), "couleur hors palette du design system");
});

test("aucun champ de contact ou d'action ne s'etire pour combler l'espace", () => {
  // Une colonne en fr (grid) ou flex-grow s'etire meme si son contenu est court,
  // laissant un vide avant le champ suivant sur une fiche large. Chaque champ
  // doit rester a la largeur de son contenu.
  assert.match(CSS, /\.contact-item,\n\.action-item \{\n  display: flex;/);
  assert.ok(!/\.contact-item[\s\S]{0,400}flex-grow|flex:\s*1[^;]*;\s*\}[\s\S]{0,0}\.contact-/.test(CSS));
  for (const regle of [/\.contact-name \{ flex: 0 [01] auto;/, /\.action-date \{ flex: 0 [01] auto; \}/, /\.action-status \{ flex: 0 0 auto; \}/]) {
    assert.match(CSS, regle);
  }
});

test("un trait separe les deux listes, vertical cote a cote puis horizontal empilees", () => {
  assert.match(CSS, /\.club-lists \.club-section \+ \.club-section \{\n  padding-left: 32px;\n  border-left: 1px solid var\(--line\);/);
  assert.match(CSS, /@media \(max-width: 900px\)[\s\S]*?border-top: 1px solid var\(--line\);/);
});

test("la fiche reste lisible jusqu'a 400 px", () => {
  assert.match(CSS, /@media \(max-width: 560px\) \{[^@]*\.club-header \{ grid-template-columns: minmax\(0, 1fr\);/,
    "le logo passe au-dessus du nom");
  assert.match(CSS, /@media \(max-width: 560px\) \{[^@]*\.contact-item,\n  \.action-item \{ flex-direction: column;/,
    "chaque champ prend sa propre ligne");
  assert.ok((CSS.match(/overflow-wrap: anywhere/g) || []).length >= 3,
    "une adresse e-mail ou un nom long ne fait pas déborder la page");
});
