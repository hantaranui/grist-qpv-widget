#!/usr/bin/env node
"use strict";

// Regenere donnees/frr-communes.json, la liste des communes classees France
// Ruralites Revitalisation lue par le widget fiche-club.
//
//   npm run maj-frr
//
// Pourquoi une copie dans le depot plutot qu'une lecture directe par le widget :
// la liste nationale n'est pas publiee sur data.gouv.fr (seules une dizaine de
// DDT y deposent leur departement), et l'Observatoire des territoires, qui la
// diffuse, ne renvoie aucun en-tete CORS sur son telechargement. Un navigateur
// refuse donc de la lire depuis l'iframe du widget. Le classement ne bouge qu'au
// gre des arretes (juin 2024, avril et juillet 2025) : relancer ce script apres
// chaque nouvel arrete suffit.
//
// Aucune dependance : un .xlsx est une archive zip de fichiers XML, et le fichier
// de l'Observatoire ecrit ses cellules en clair (inlineStr), sans table de
// chaines partagees.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SOURCE_PAGE = "https://www.observatoire-des-territoires.gouv.fr/frr-france-ruralites-revitalisation";
const SOURCE_XLSX = "https://www.observatoire-des-territoires.gouv.fr/outils/cartographie-interactive/api/v1/functions/GC_API_download.php?type=stat&nivgeo=com2025&dataset=frr&indic=codefrr";
const SORTIE = path.join(__dirname, "..", "donnees", "frr-communes.json");

// Lit une entree d'une archive zip a partir de son repertoire central : les
// tailles des en-tetes locaux peuvent etre a zero quand l'archive est ecrite en
// flux, seul le repertoire central fait foi.
function lireEntreeZip(archive, nom) {
  const FIN_REPERTOIRE = 0x06054b50;
  let fin = archive.length - 22;
  while (fin >= 0 && archive.readUInt32LE(fin) !== FIN_REPERTOIRE) fin -= 1;
  if (fin < 0) throw new Error("Archive zip illisible : repertoire central introuvable.");

  const nombre = archive.readUInt16LE(fin + 10);
  let position = archive.readUInt32LE(fin + 16);
  for (let i = 0; i < nombre; i += 1) {
    const methode = archive.readUInt16LE(position + 10);
    const tailleCompressee = archive.readUInt32LE(position + 20);
    const longueurNom = archive.readUInt16LE(position + 28);
    const longueurExtra = archive.readUInt16LE(position + 30);
    const longueurCommentaire = archive.readUInt16LE(position + 32);
    const enTeteLocal = archive.readUInt32LE(position + 42);
    const nomEntree = archive.toString("utf8", position + 46, position + 46 + longueurNom);

    if (nomEntree === nom) {
      const debut = enTeteLocal + 30 + archive.readUInt16LE(enTeteLocal + 26) + archive.readUInt16LE(enTeteLocal + 28);
      const donnees = archive.subarray(debut, debut + tailleCompressee);
      if (methode === 0) return donnees.toString("utf8");
      if (methode === 8) return zlib.inflateRawSync(donnees).toString("utf8");
      throw new Error(`Compression zip non geree (${methode}) pour ${nom}.`);
    }
    position += 46 + longueurNom + longueurExtra + longueurCommentaire;
  }
  throw new Error(`Entree ${nom} absente de l'archive.`);
}

function decoderXml(texte) {
  return texte
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

// Transforme la feuille en { code classement : [codes INSEE] }. Une cellule de
// classement vide signifie « commune non classee », rangee sous "0".
function lireFeuilleFrr(xml) {
  const classements = {};
  let enTeteVu = false;
  for (const [, contenu] of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cellules = {};
    for (const cellule of contenu.matchAll(/<c r="([A-Z]+)\d+"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const valeur = (cellule[2] || "").match(/<(?:v|t)>([\s\S]*?)<\/(?:v|t)>/);
      cellules[cellule[1]] = valeur ? decoderXml(valeur[1]).trim() : "";
    }
    if (!enTeteVu) {
      enTeteVu = cellules.A === "codgeo" && cellules.C === "codefrr";
      continue;
    }
    if (!/^[0-9AB]{5}$/.test(cellules.A || "")) continue;
    const classement = cellules.C || "0";
    (classements[classement] ||= []).push(cellules.A);
  }
  if (!enTeteVu) throw new Error("Colonnes codgeo / codefrr introuvables : le format du fichier a change.");
  return classements;
}

function millesime(xml) {
  const titre = xml.match(/France ruralités revitalisation \(([^)]*\))\)/);
  return titre ? titre[1] : "";
}

async function main() {
  const reponse = await fetch(SOURCE_XLSX);
  if (!reponse.ok) throw new Error(`Telechargement impossible (${reponse.status}).`);
  const archive = Buffer.from(await reponse.arrayBuffer());
  const feuille = lireEntreeZip(archive, "xl/worksheets/sheet1.xml");
  const classements = lireFeuilleFrr(feuille);

  // Codes separes par des espaces plutot qu'un objet par commune : 35 000
  // communes tiennent ainsi en moins de 250 ko, que le widget charge a chaque
  // ouverture.
  const communes = Object.fromEntries(Object.keys(classements).sort()
    .map((code) => [code, classements[code].sort().join(" ")]));

  const sortie = {
    source: "Observatoire des territoires (ANCT), d'après la DGCL",
    page: SOURCE_PAGE,
    telechargement: SOURCE_XLSX,
    geographie: millesime(feuille),
    extraitLe: new Date().toISOString().slice(0, 10),
    communes,
  };
  fs.mkdirSync(path.dirname(SORTIE), {recursive: true});
  fs.writeFileSync(SORTIE, JSON.stringify(sortie, null, 1) + "\n");

  const total = Object.values(classements).reduce((somme, liste) => somme + liste.length, 0);
  const detail = Object.entries(classements).map(([code, liste]) => `${code}: ${liste.length}`).join(", ");
  console.log(`maj-frr: ${path.relative(process.cwd(), SORTIE)} — ${total} communes (${detail})`);
}

if (require.main === module) {
  main().catch((erreur) => {
    console.error(`maj-frr: ${erreur.message}`);
    process.exit(1);
  });
}

module.exports = {lireEntreeZip, lireFeuilleFrr, millesime};
