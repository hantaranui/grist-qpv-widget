"use strict";

// Doublures de la pop-up d'aperçu du PDF (« Voir la convention », « Voir la convention signée »),
// partagées par test/convention-voir.test.js et test/convention-voir-signee.test.js.
// test/helpers/widget.js n'est pas modifié : les éléments de la page y sont de simples objets,
// que ce fichier complète (écouteurs captés, lien <a> factice, window.open surveillé).
// À appeler APRÈS avoir remplacé document.getElementById par la version qui suit le focus, et AVANT
// le premier clic : les éléments de la pop-up sont créés ici pour qu'on capte leurs écouteurs.

const IDS_POPUP = ["conventionPdfModal", "conventionPdfDialog", "conventionPdfCadre", "conventionPdfTelecharger", "conventionPdfFermer"];

function decoder(texte) {
  return texte.replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function installerPopup(w) {
  const doc = w.document;
  const popup = {
    ouvertures: [],   // chaque appel de window.open (il ne doit plus y en avoir)
    liens: [],        // chaque lien <a> créé par le script
    ajouts: [],       // ce que le script a ajouté à document.body
    clics: [],        // chaque lien <a> déclenché par .click()
    ecouteurs: {},    // « id:type » → fonction
    retraits: [],     // « id:type » retirés par removeEventListener
  };

  w.window.open = (...args) => { popup.ouvertures.push(args); return null; };

  // Un lien <a> factice : il garde ce qu'il valait AU MOMENT du clic (adresse, nom, dans la page ou non).
  const creerElement = doc.createElement;
  doc.createElement = (balise) => {
    if (balise !== "a") return creerElement(balise);
    const lien = {
      balise, href: "", download: "", rel: "", hidden: false, retire: false, instantane: null,
      click() { this.instantane = {href: this.href, download: this.download, dansLaPage: popup.ajouts.includes(this), retire: this.retire}; popup.clics.push(this); },
      remove() { this.retire = true; },
    };
    popup.liens.push(lien);
    return lien;
  };
  doc.body.appendChild = (element) => { popup.ajouts.push(element); return element; };

  // Les éléments de la pop-up : leurs écouteurs sont captés (le script les pose à l'ouverture).
  for (const id of IDS_POPUP) {
    const element = doc.getElementById(id);
    element.addEventListener = (type, fonction) => { popup.ecouteurs[`${id}:${type}`] = fonction; };
    element.removeEventListener = (type, fonction) => {
      if (popup.ecouteurs[`${id}:${type}`] === fonction) { delete popup.ecouteurs[`${id}:${type}`]; popup.retraits.push(`${id}:${type}`); }
    };
  }
  const hote = doc.getElementById("conventionPdfModal");
  const cadre = doc.getElementById("conventionPdfCadre");

  Object.assign(popup, {
    hote, cadre,
    // Le HTML de la pop-up (entités décodées), '' si elle est fermée.
    html: () => decoder(hote.innerHTML),
    ouverte: () => hote.innerHTML !== "",
    // La pop-up est-elle ouverte aux yeux du script ?
    etat: () => w.state.conventionPdfOpen,
    corpsAClasse: (nom) => doc.body.classList.contains(nom),
    // Le titre (le nom du fichier) lu dans le HTML.
    titre: () => {
      const m = /<h2 class="modal-title" id="conventionPdfTitle">([\s\S]*?)<\/h2>/.exec(decoder(hote.innerHTML));
      return m ? m[1] : null;
    },
    // Ce que la personne fait dans la pop-up.
    cliquerTelecharger: () => popup.ecouteurs["conventionPdfTelecharger:click"]({}),
    cliquerFermer: () => popup.ecouteurs["conventionPdfFermer:click"]({}),
    touche(key) {
      let empeche = 0;
      popup.ecouteurs["conventionPdfModal:keydown"]({key, shiftKey: false, preventDefault() { empeche += 1; }});
      return empeche;
    },
    aEcouteur: (cle) => typeof popup.ecouteurs[cle] === "function",
  });
  return popup;
}

module.exports = {installerPopup, decoder, IDS_POPUP};
