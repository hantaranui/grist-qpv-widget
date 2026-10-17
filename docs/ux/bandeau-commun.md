# Bandeau commun : ajout au tableau de bord

Public : dev-interface. Changement minimal. Aucun composant du design system n'est ajouté : pas de lien ni de structure HTML à recopier.

Sources : CLAUDE.md, `src/actions-dashboard/index.html`, `src/actions-dashboard/style.css`, `build.js`, description du bandeau fournie par Hanta.

## 1. Emplacement et ligne à ajouter

Fichier : `src/actions-dashboard/index.html`, dans le `<head>`, **juste après** le script de l'API Grist (ligne 7) et **avant** la feuille du design system (ligne 8).

Avant :

```html
    <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
    <link href="https://cdn.francetravail.fr/studio/design-system/css/styles.css" rel="stylesheet">
```

Après (la ligne ajoutée est la seconde) :

```html
    <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
    <script src="https://hantaranui.github.io/Bandeau_France-Travail/bandeau.js" data-titre="Liste des actions"></script>
    <link href="https://cdn.francetravail.fr/studio/design-system/css/styles.css" rel="stylesheet">
```

Rien d'autre à changer dans les sources. `build.js` ne remplace que `<script src="script.js">` : la ligne passe donc telle quelle dans `actions-dashboard.html` après `npm run build`.
`grist.ready({requiredAccess: 'full'})` existe déjà : ne pas y toucher.

## 2. Titre actuel (h1 dans .topbar)

**Recommandation : le garder, sans aucun changement.**

Raisons :
- Le bandeau ne contient pas de h1. Si on retire celui du tableau de bord, la page n'a plus de titre de niveau 1 : c'est une régression d'accessibilité (les lecteurs d'écran s'appuient sur le h1 pour nommer la page).
- Pas de vrai doublon : le bandeau affiche « [titre du menu] - Liste des actions » (c'est un libellé de navigation, pas un titre de section), le h1 dit ce que contient la page : « Actions d'insertion par le sport ». Les deux ont des rôles différents.
- Retirer ou modifier le h1 touche aussi la mise en page de `.topbar` (les boutons « Exporter (CSV) » et « Ajouter une action » y sont alignés avec lui) : risque inutile pour un changement qui ne porte que sur l'ajout du bandeau.

À signaler à Hanta, sans le corriger : visuellement, la page affichera deux titres l'un sous l'autre. C'est acceptable en l'état. Si le collègue ajoute un jour un h1 dans le bandeau, il faudra revoir ce point.

## 3. Valeur de data-titre

**Garder « Liste des actions »**, telle que donnée par le configurateur.

Raisons :
- C'est la valeur générée par l'outil du collègue : la changer à la main éloigne le widget de ce que le configurateur produit.
- Elle est courte, donc elle ne fait pas passer le titre du bandeau sur deux lignes.
- Elle ne répète pas le h1 (« Actions d'insertion par le sport »), ce qui limite l'effet de doublon vu au point 2.

## 4. Vérifications visuelles dans le document Grist DEV

À faire après `npm run build`, avec l'URL du widget servie par `npm run dev`, ou après publication selon la procédure habituelle.

Bandeau
1. Le bandeau apparaît tout en haut de la page, au-dessus de la zone « Actions d'insertion par le sport ».
2. Son titre se lit « [titre du menu] - Liste des actions ».
3. Les logos s'affichent, la personne connectée est la bonne, le menu de liens est présent et ses liens fonctionnent.
4. Le bandeau ne casse pas : pas de texte coupé, pas de barre de défilement horizontale sur la page.

Tableau de bord (rien ne doit avoir changé)
5. Le h1 « Actions d'insertion par le sport » est visible, avec ses boutons « Exporter (CSV) » et « Ajouter une action » alignés à droite, aux mêmes couleurs qu'avant.
6. Les styles du tableau de bord sont intacts (polices, couleurs, boutons) : le bandeau ne doit pas les modifier, et inversement.
7. Les filtres, la synthèse repliable et le tableau s'affichent comme avant.
8. En-tête du tableau collant : défiler dans le tableau, l'en-tête reste visible et le menu de tri s'ouvre au premier plan.
9. Hauteur : le bandeau fait environ 100 px de plus en haut. Vérifier que le tableau reste utilisable (barre de défilement du tableau atteignable sans dérouler toute la page ; voir `.table-panel` dans `style.css`, qui plafonne à `100vh`). Tester dans un widget de hauteur normale et dans un widget plus petit.
10. « Ajouter une action » ouvre bien la saisie ; « Exporter (CSV) » télécharge bien le fichier ; ouvrir la fiche d'une action puis revenir : le bandeau reste en haut dans les deux cas.

Accès et profils
11. Ouvrir le widget avec un profil limité (par exemple FT Régional) : le tableau de bord affiche toujours uniquement les lignes autorisées. Noter si le bandeau affiche quelque chose de différent selon le profil, sans le corriger.
12. Si le bandeau ne s'affiche pas : vérifier que le widget a bien l'accès « complet » dans Grist, puis ouvrir la console du navigateur et noter le message d'erreur.

Clavier et lecteur d'écran
13. Touche Tab depuis le haut de la page : on passe par les liens du bandeau, puis par les boutons du tableau de bord, dans un ordre logique, avec un focus visible.

## Questions ouvertes

- Le bandeau lit des tables du document (Bandeau_config, Bandeau_liens, table des personnes). Hanta doit confirmer que les profils FT National, Régional, Départemental et ANS y ont bien accès en lecture, sinon le bandeau peut s'afficher vide pour eux.
- Le bandeau est hébergé sur un autre site (GitHub Pages du collègue) et chargé sans version figée : une modification de sa part change le tableau de bord en ligne sans passer par ce dépôt.
