
# Design system France Travail — fiche pour le tableau de bord

Site : https://designsystem.francetravail.io/ (version lue sur le site : 1.16.0, page du 01/10/2026)
Feuille chargée par le widget : https://cdn.francetravail.fr/studio/design-system/css/styles.css
Autoloader : https://cdn.francetravail.fr/webco/v1/ft-autoloader.js
Le lien de la feuille ne porte pas de numéro de version. La liste des noms réservés de test/styles.test.js a été relevée sur la version 1.15.0.

## Ordre des sources

1. Pour un nom de classe ou une valeur : la feuille du CDN fait foi.
2. Pour comprendre un composant (rôle, variantes, accessibilité) : le site.
3. Les pages de composants peuvent porter d'autres noms que la feuille (button--small → btn-sm, ft-progressbar → .progress).

## Liens utiles

- Couleurs : https://designsystem.francetravail.io/docs/fondamentaux/couleurs.html
- Typographie : https://designsystem.francetravail.io/docs/fondamentaux/typographie.html
- Espacements et points de rupture : https://designsystem.francetravail.io/docs/fondamentaux/espacements.html
- Variables CSS : https://designsystem.francetravail.io/docs/fondamentaux/variables-css.html
- Icônes : https://designsystem.francetravail.io/docs/bibliotheque/icones.html
- Accessibilité : https://designsystem.francetravail.io/docs/bonnes-pratiques/accessibilite.html
- Composants : https://designsystem.francetravail.io/components/detail/[nom]--[variante].html (exemple : button--primary.html)

## Règles

- Univers « Outils agent » : classe outil-agent sur body.
- Uniquement ses composants et ses variables CSS : ni couleur, ni police, ni espacement, ni composant inventés.
- Un composant manquant : le signaler et proposer le plus proche, sans le fabriquer sans validation.
- Nos classes ne reprennent jamais un nom du design system (test/styles.test.js).
- Écart validé : le tableau n'utilise pas .table (en-tête collant).
