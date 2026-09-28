#!/usr/bin/env node
"use strict";

// Sert les widgets assembles a la racine, sans cache.
//
// Un serveur statique ordinaire n'envoie aucun en-tete Cache-Control : le
// navigateur garde alors sa copie, et il faut suffixer l'URL (?v=2, ?v=3...) a
// chaque changement pour voir l'effet d'un build. Ce serveur l'interdit, si bien
// qu'un simple rechargement suffit.
//
//   npm run dev            sert ce dossier sur le port 8000
//   npm run dev -- 8001    sur un autre port, pour un second arbre de travail
//
// L'URL a coller dans la configuration d'un widget Grist est
// http://localhost:<port>/<widget>.html — Chrome considere localhost comme une
// origine sure, donc l'iframe n'est pas bloquee malgre le HTTPS de Grist.

const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.argv[2] || process.env.PORT || 8000);
const RACINE = __dirname;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  // Le chemin demande ne doit jamais sortir de la racine servie.
  const demande = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const cible = path.join(RACINE, demande === "/" ? "index.html" : demande);
  if (!cible.startsWith(RACINE)) {
    res.writeHead(403).end("Chemin hors du dossier servi");
    return;
  }

  fs.readFile(cible, (erreur, contenu) => {
    if (erreur) {
      res.writeHead(erreur.code === "ENOENT" ? 404 : 500, {"Content-Type": "text/plain; charset=utf-8"});
      res.end(erreur.code === "ENOENT" ? "Fichier introuvable" : "Erreur de lecture");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(cible).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.end(contenu);
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`Serveur de dev sans cache : http://localhost:${PORT}/`);
  for (const fichier of fs.readdirSync(RACINE).filter(nom => nom.endsWith(".html"))) {
    console.log(`  http://localhost:${PORT}/${fichier}`);
  }
});
