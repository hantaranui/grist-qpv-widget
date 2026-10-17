# Bandeau commun : ajout au widget clubs

Public : dev-interface. Changement minimal. Aucun composant du design system n'est ajouté : pas de lien ni de structure HTML à recopier.

Sources : CLAUDE.md, `src/clubs/index.html`, note UX équivalente écrite pour le tableau de bord (`docs/ux/` du tableau de bord, fournie comme référence), balise copiée du configurateur Grist pour la page des clubs.

## 1. Emplacement et ligne à ajouter

Fichier : `src/clubs/index.html`, dans le `<head>`.

État actuel du `<head>` (lignes 7 à 10) :

```html
    <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
    <link href="https://cdn.francetravail.fr/studio/design-system/css/styles.css" rel="stylesheet">
    <script src="https://cdn.francetravail.fr/webco/v1/ft-autoloader.js" fetchpriority="high"></script>
```

Contrairement au tableau de bord, le widget clubs charge un script supplémentaire (`jszip`) juste après l'API Grist, avant la feuille du design system. La règle à respecter reste la même que pour le tableau de bord : la balise du bandeau se place **juste après le chargement de l'API Grist, et avant la feuille du design system**. Pour ne pas s'intercaler entre l'API Grist et un script dont dev-interface ne doit pas changer l'ordre sans raison, placer la balise du bandeau **juste après le script `jszip`** (ligne 8), donc juste avant la feuille du design system :

Avant :

```html
    <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
    <link href="https://cdn.francetravail.fr/studio/design-system/css/styles.css" rel="stylesheet">
```

Après (la ligne ajoutée est la troisième) :

```html
    <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
    <script src="https://nicolasschena-aucarre.github.io/Bandeau_France-Travail/bandeau.js" data-titre="Liste des Clubs"></script>
    <link href="https://cdn.francetravail.fr/studio/design-system/css/styles.css" rel="stylesheet">
```

Rien d'autre à changer dans `src/clubs/index.html`. `build.js` ne remplace que la balise `<script src="script.js">` : la ligne ajoutée passe donc telle quelle dans `clubs.html` après `npm run build`.
`grist.ready({requiredAccess: 'full'})` existe déjà dans `script.js` : ne pas y toucher.

## 2. Valeur de data-titre

**`data-titre="Liste des Clubs"`**, reprise exactement de la balise fournie par le configurateur Grist pour la page des clubs. Ne pas la raccourcir ni la reformuler : c'est la valeur générée par l'outil du collègue.

## 3. Titre actuel (h1 « Clubs » dans .topbar)

**Recommandation : le garder, sans aucun changement.** Même choix que pour le tableau de bord, pour les mêmes raisons :

- Le bandeau ne contient pas de h1. Le retirer laisserait la page sans titre de niveau 1, une régression d'accessibilité (les lecteurs d'écran s'appuient sur le h1 pour nommer la page).
- Pas de vrai doublon : le bandeau affichera « [titre du menu] - Liste des Clubs » (un libellé de navigation), le h1 dit ce que contient la page : « Clubs ». Les deux ont des rôles différents. Le tableau liste déjà « Liste des clubs » comme légende `sr-only` de son tableau (ligne 26 de `index.html`), ce qui ne crée pas non plus de doublon visible : cette légende n'est pas affichée à l'écran.
- Retirer ou modifier le h1 touche la mise en page de `.topbar` : risque inutile pour un changement qui ne porte que sur l'ajout du bandeau.

Pas de raison propre à clubs de s'écarter de ce choix.

À signaler à Hanta, sans le corriger : visuellement, la page affichera deux titres l'un sous l'autre (celui du bandeau, puis le h1 « Clubs »).

## 4. Ce que dev-interface ne doit PAS toucher

- `src/clubs/script.js` et `src/clubs/style.css` : aucune modification, cette tâche ne porte que sur `src/clubs/index.html`.
- Le h1 « Clubs » et la structure de `.topbar`.
- L'ordre et le contenu des autres balises du `<head>` : script de l'API Grist, script `jszip`, feuille du design system, autoloader, feuille `style.css` propre au widget. Seule l'insertion de la balise du bandeau est autorisée.
- `grist.ready({requiredAccess: 'full'})` et tout autre appel à l'API Grist dans `script.js`.
- Les fichiers générés : ne jamais modifier `clubs.html` à la main, toujours passer par `npm run build`.
- `build.js` et le dossier `test/` : cette tâche ne les concerne pas.
- Les autres widgets (`actions-dashboard`, `qpv-widget`, `fiche-club`) et leurs fichiers générés.

## Vérifications visuelles dans le document Grist DEV

À faire après `npm run build`, avec l'URL du widget servie par `npm run dev`, ou après publication selon la procédure habituelle (ces commandes sont lancées par Hanta elle-même).

Bandeau
1. Le bandeau apparaît tout en haut de la page, au-dessus de la liste des clubs.
2. Son titre se lit « [titre du menu] - Liste des Clubs ».
3. Les logos s'affichent, la personne connectée est la bonne, le menu de liens est présent et ses liens fonctionnent.
4. Le bandeau ne casse pas : pas de texte coupé, pas de barre de défilement horizontale sur la page.

Widget clubs (rien ne doit avoir changé)
5. Le h1 « Clubs » est visible, avec la mise en page de `.topbar` inchangée.
6. Les styles du widget clubs sont intacts (polices, couleurs, boutons) : le bandeau ne doit pas les modifier, et inversement.
7. Les filtres et le tableau des clubs s'affichent comme avant.
8. La note `clubs-ouvrir-action-v1` continue de fonctionner : ouvrir une fiche d'action depuis clubs puis vérifier qu'elle s'ouvre bien dans le tableau de bord (si les deux widgets sont servis en même temps, voir CLAUDE.md).

Accès et profils
9. Ouvrir le widget avec un profil limité : la liste des clubs affiche toujours uniquement les lignes autorisées. Noter si le bandeau affiche quelque chose de différent selon le profil, sans le corriger.
10. Si le bandeau ne s'affiche pas : vérifier que le widget a bien l'accès « complet » dans Grist, puis ouvrir la console du navigateur et noter le message d'erreur.

Clavier et lecteur d'écran
11. Touche Tab depuis le haut de la page : on passe par les liens du bandeau, puis par les boutons et champs du widget clubs, dans un ordre logique, avec un focus visible.

## Questions ouvertes

- Le bandeau lit des tables du document (Bandeau_config, Bandeau_liens, table des personnes). Comme pour le tableau de bord, Hanta doit confirmer que les profils ayant accès à clubs y ont bien accès en lecture, sinon le bandeau peut s'afficher vide pour eux.
- Le bandeau est hébergé sur un autre site (GitHub Pages du collègue) et chargé sans version figée : une modification de sa part change le widget clubs en ligne sans passer par ce dépôt.
- Le script `jszip` chargé juste avant la balise du bandeau n'est pas documenté dans CLAUDE.md pour le widget clubs : si son rôle a une incidence sur l'ordre de chargement du `<head>`, le vérifier avec Hanta avant d'y toucher davantage.
