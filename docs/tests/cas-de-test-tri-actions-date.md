# Recette du tri des actions par statut puis par date : parcours à jouer

Document de recette du **tri de la colonne STATUT** dans le tableau de bord des actions : le tri range d'abord par statut, puis, à l'intérieur de chaque statut, par date ou par période.

- **Environnement** : TEST.
- **Profil** : celui du testeur. Un seul parcours suffit pour tous les profils.
- **Données** : uniquement des données fictives, déjà présentes dans TEST. Aucune action n'est à créer.
- **Fichier de suivi** : `cas-de-test-tri-actions-date.tsv` (même contenu, à ouvrir dans un tableur).

Avant de commencer, noter : version testée, nom du testeur, date.

## Ce qu'il faut savoir en une minute

Les 12 cas sont rangés en deux catégories qui ne se répètent pas :

1. **Déjà vérifié par Hanta, en DEV** (6 points, TRI-V-01 à TRI-V-06) : ne pas rejouer.
2. **À jouer par le collègue, en TEST** (6 parcours courts, TRI-P-01 à TRI-P-06).

**Ce que fait le tri** : le menu de la colonne STATUT propose A-Z et Z-A (libellé inchangé).

- **A-Z** : les statuts s'enchaînent dans l'ordre A confirmer, Annulée, Non retenue, Planifiée, Réalisée.
  - **A confirmer** : classées par période approximative.
  - **Planifiée** : la date la plus ancienne d'abord (une date déjà passée apparaît donc en premier).
  - **Réalisée** : la date la plus récente d'abord.
  - **Annulée** et **Non retenue** : pas de tri interne, l'ordre habituel est conservé.
- **Z-A** : tout s'inverse (ordre des statuts, sens des dates, périodes dans l'ordre inverse).
- Dans les deux sens, une action **sans date** (Planifiée, Réalisée) ou **sans période** (A confirmer) reste toujours à la fin de son groupe.
- Le tri choisi est gardé le temps de la session : retrouvé après un rechargement ou en revenant sur la page. Un nouvel onglet repart sans tri. Le bouton « Réinitialiser » vide les filtres mais ne change pas le tri.

**À propos de l'ordre des périodes de « A confirmer »** : les périodes qui commencent par un chiffre passent d'abord, classées par ce chiffre (par exemple « 9 au 13 novembre » avant « 28 janvier »), puis celles qui commencent par une lettre (« avril 2027 » avant « décembre 2026 »). Ce n'est pas l'ordre du calendrier : c'est un choix connu, validé par Pierre. Ce n'est donc pas un défaut.

Pour chaque parcours : suivre les étapes, comparer avec le résultat attendu, puis noter **OK**, **KO**, **Bloqué** ou **Non testé**. En cas de KO : décrire ce qui s'est passé et joindre une capture d'écran. La colonne « Validé par » reste vide tant que personne n'a revu le résultat après le premier passage.

## 1. Déjà vérifié par Hanta, en DEV, le 18/11/2026 (ne pas rejouer)

| ID | Ce qui a été vérifié | Résultat | Testeur | Date | Validé par |
| --- | --- | --- | --- | --- | --- |
| TRI-V-01 | Les trois profils (National, Régional, Départemental), via « Voir en tant que », utilisent le tri sur leur périmètre, avec les mêmes règles. Un seul compte de test, dont le profil est changé avant chaque essai. | Conforme. A-Z : A confirmer, Annulée, Non retenue, Planifiée, Réalisée ; Z-A : ordre inversé. Dans A confirmer, les périodes commençant par un chiffre sont classées par ce chiffre, puis celles qui commencent par une lettre ; les actions sans période sont à la fin. | Hanta | 18/11/2026 | |
| TRI-V-02 | Menu de tri : libellé A-Z / Z-A inchangé, utilisable au clavier comme avant ; les colonnes Agence, Club, Action et Financement se trient comme avant. | Conforme : libellés inchangés ; clavier identique entre STATUT et Club ; les quatre autres colonnes se trient correctement dans les deux sens. | Hanta | 18/11/2026 | |
| TRI-V-03 | Tri gardé : après un rechargement de la page le tri est retrouvé ; dans un nouvel onglet, il repart sans tri. | Conforme : tri Z-A retrouvé dès l'affichage après rechargement, ordre habituel dans le nouvel onglet, premier onglet toujours en Z-A. | Hanta | 18/11/2026 | |
| TRI-V-04 | « Réinitialiser » vide les filtres, le tri reste. | Conforme : filtres vidés, tableau toujours trié en A-Z ; après rechargement, aucun filtre et tri A-Z conservé. | Hanta | 18/11/2026 | |
| TRI-V-05 | L'export CSV suit le tri choisi ; sans tri choisi, il garde l'ordre habituel. | Conforme (premières lignes comparées). Sans tri : même ordre que l'écran. Avec Z-A : Réalisée en tête, même ordre dans le fichier. | Hanta | 18/11/2026 | |
| TRI-V-06 | Observations et données de test. | Observations confirmées : aucun repère de colonne triée, aucun bouton pour retirer le tri. Données nécessaires présentes dans TEST : pour A confirmer, Planifiée et Réalisée, au moins deux avec valeur et au moins une sans date ou sans période ; Annulée et Non retenue en nombre suffisant. | Hanta | 18/11/2026 | |

## 2. Les 6 parcours à jouer par le collègue, en TEST

Jouer dans l'ordre. TRI-P-01 à TRI-P-04 se jouent sur le même tableau. TRI-P-05 se joue avec un tri déjà choisi. TRI-P-06 est le dernier.

### TRI-P-01 : Trier A-Z : l'ordre des statuts et des périodes de « A confirmer » (majeur)

**Avant de commencer** : profil du testeur. Dans TEST, des actions « A confirmer » avec une période, au moins une sans période.

**Étapes**

1. Ouvrir le tableau de bord.
1. Ouvrir le menu de la colonne STATUT et choisir A-Z.
1. Regarder l'ordre des groupes de statuts.
1. Dans le groupe « A confirmer », lire les périodes de haut en bas.

**Données** : actions fictives déjà présentes dans TEST.

**Résultat attendu** : À l'étape 3, les statuts s'enchaînent : A confirmer, Annulée, Non retenue, Planifiée, Réalisée. À l'étape 4, les périodes qui commencent par un chiffre passent d'abord, classées par ce chiffre (par exemple « 9 au 13 novembre » avant « 28 janvier »), puis celles qui commencent par une lettre (par exemple « avril 2027 » avant « décembre 2026 »). Ce n'est pas l'ordre du calendrier : c'est voulu. Les actions sans période sont à la fin du groupe.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### TRI-P-02 : Trier A-Z : les dates de « Planifiée » et de « Réalisée » (majeur)

**Avant de commencer** : profil du testeur. Tri A-Z déjà choisi (TRI-P-01). Dans TEST, au moins deux actions « Planifiée » et deux « Réalisée » avec une date.

**Étapes**

1. Tri A-Z sur la colonne STATUT.
1. Dans le groupe « Planifiée », lire les dates de haut en bas.
1. Dans le groupe « Réalisée », lire les dates de haut en bas.

**Données** : actions fictives déjà présentes dans TEST.

**Résultat attendu** : Dans « Planifiée », la date la plus ancienne vient en premier (une date déjà passée apparaît donc en premier). Dans « Réalisée », la date la plus récente vient en premier. Dans « Annulée » et « Non retenue », l'ordre habituel est conservé.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### TRI-P-03 : Trier Z-A : tout s'inverse (majeur)

**Avant de commencer** : profil du testeur. Mêmes actions que TRI-P-01 et TRI-P-02.

**Étapes**

1. Ouvrir le menu de la colonne STATUT et choisir Z-A.
1. Regarder l'ordre des groupes de statuts.
1. Dans « A confirmer », lire les périodes.
1. Dans « Planifiée » puis « Réalisée », lire les dates.

**Données** : actions fictives déjà présentes dans TEST.

**Résultat attendu** : Les statuts s'enchaînent dans l'ordre inverse : Réalisée, Planifiée, Non retenue, Annulée, A confirmer. Les périodes de « A confirmer » sont dans l'ordre inverse de TRI-P-01. Dans « Planifiée », la date la plus récente d'abord ; dans « Réalisée », la plus ancienne d'abord.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### TRI-P-04 : Actions sans date ou sans période : toujours à la fin de leur groupe (majeur)

**Avant de commencer** : profil du testeur. Dans TEST, au moins une action « A confirmer » sans période, une « Planifiée » sans date et une « Réalisée » sans date.

**Étapes**

1. Choisir A-Z sur la colonne STATUT.
1. Repérer, dans « A confirmer », « Planifiée » et « Réalisée », les actions sans période ou sans date.
1. Choisir Z-A.
1. Les repérer à nouveau.

**Données** : actions fictives déjà présentes dans TEST.

**Résultat attendu** : Dans les trois groupes, et dans les deux sens (A-Z comme Z-A), les actions sans date ou sans période sont tout en bas de leur groupe, jamais en haut.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### TRI-P-05 : Le tri est gardé quand on change de page (mineur)

**Avant de commencer** : profil du testeur.

**Étapes**

1. Choisir A-Z ou Z-A sur la colonne STATUT.
1. Aller sur une autre page de l'application.
1. Revenir sur le tableau de bord.

**Données** : aucune.

**Résultat attendu** : Au retour, le tableau est toujours trié comme avant le départ, sans avoir à choisir à nouveau.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### TRI-P-06 : Filtrer sur « Planifiée », puis trier (mineur)

**Avant de commencer** : profil du testeur. Dans TEST, au moins deux actions « Planifiée » avec une date.

**Étapes**

1. Ouvrir le filtre « Statut » et choisir « Planifiée ».
1. Choisir A-Z sur la colonne STATUT.
1. Lire les dates de haut en bas.
1. Choisir Z-A et relire les dates.

**Données** : actions « Planifiée » fictives déjà présentes dans TEST.

**Résultat attendu** : Le tableau ne montre que les actions « Planifiée ». En A-Z, la date la plus ancienne d'abord ; en Z-A, la plus récente d'abord ; les actions sans date restent à la fin.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Observations pour Pierre

Ce ne sont pas des défauts : ce sont des limites connues, confirmées par Hanta en DEV.

1. Aucun repère n'indique quelle colonne est triée.
2. Il n'y a pas de bouton pour effacer le tri.
