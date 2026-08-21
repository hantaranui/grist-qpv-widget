# Widget Grist - Verification QPV

Ce widget Grist indique si une adresse se situe dans un Quartier prioritaire de la politique de la ville (QPV).

## Principe

1. Le widget geocode l'adresse avec la Base Adresse Nationale.
2. Il charge les contours QPV officiels publies par l'ANCT sur data.gouv.fr.
3. Il teste si le point BAN est dans un polygone QPV.
4. Il peut afficher le resultat pour la ligne selectionnee ou ecrire les resultats dans la table Grist.

Le service API SIGVILLE existe, mais son acces SI demande un compte ANCT et une autorisation. Cette version ne depend donc pas d'une cle API.

## Installation dans Grist

1. Heberger le dossier `qpv-grist-widget` sur une URL accessible par Grist, ou utiliser le mode widget personnalise si votre instance accepte les fichiers locaux.
2. Dans Grist, ajouter un widget personnalise.
3. Renseigner l'URL du fichier `index.html`.
4. Donner l'acces complet au widget si vous souhaitez qu'il ecrive les resultats dans la table.
5. Associer les colonnes dans la configuration du widget.

## Colonnes attendues

Obligatoire :

- `Adresse`

Optionnelles pour ameliorer le geocodage :

- `Code postal`
- `Commune`

Optionnelles pour l'ecriture des resultats :

- `Est en QPV`
- `Code QPV`
- `Nom QPV`
- `Adresse BAN retenue`
- `Score BAN`
- `Longitude`
- `Latitude`
- `Statut verification QPV`

## Sources

- Donnees QPV : https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/
- Geocodage : https://api-adresse.data.gouv.fr/
- Documentation SIGVILLE : https://sig.ville.gouv.fr/page/174

## Limites

Le resultat depend du point retourne par la BAN. Comme l'indique SIGVILLE, la localisation d'une adresse est indicative et ne vaut pas attestation reglementaire.
