#!/usr/bin/env node
"use strict";

// Assemble chaque widget source (src/<widget>/index.html + style.css + script.js)
// en un unique fichier HTML a la racine du depot, seul format que Grist et
// GitHub Pages savent charger pour un widget personnalise.

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");
const STYLE_TAG = /<link rel="stylesheet" href="style\.css">/;
const SCRIPT_TAG = /<script src="script\.js"><\/script>/;

function buildWidget(widgetDir) {
  const dir = path.join(SRC_DIR, widgetDir);
  const template = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(dir, "style.css"), "utf8").trimEnd();
  const js = fs.readFileSync(path.join(dir, "script.js"), "utf8").trimEnd();

  if (!STYLE_TAG.test(template)) {
    throw new Error(`${widgetDir}/index.html : balise <link rel="stylesheet" href="style.css"> introuvable.`);
  }
  if (!SCRIPT_TAG.test(template)) {
    throw new Error(`${widgetDir}/index.html : balise <script src="script.js"></script> introuvable.`);
  }

  const output = template
    .replace(STYLE_TAG, `<style>\n${css}\n</style>`)
    .replace(SCRIPT_TAG, `<script>\n${js}\n</script>`);

  const outPath = path.join(__dirname, `${widgetDir}.html`);
  fs.writeFileSync(outPath, output);
  console.log(`build: ${path.relative(__dirname, outPath)}`);
}

for (const widgetDir of fs.readdirSync(SRC_DIR)) {
  if (fs.statSync(path.join(SRC_DIR, widgetDir)).isDirectory()) {
    buildWidget(widgetDir);
  }
}
