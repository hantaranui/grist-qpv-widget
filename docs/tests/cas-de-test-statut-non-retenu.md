# Recette du statut « Non retenu » : parcours à jouer

Document de recette du nouveau statut **« Non retenu »** des actions du tableau de bord : choix du statut, raison du refus obligatoire, affichage dans le tableau, export CSV.

- **Environnement** : TEST.
- **Profil** : FT National.
- **Données** : uniquement des données fictives, déjà présentes dans TEST. Aucune action n'est à créer, sauf si une consigne le dit.
- **Fichier de suivi** : `cas-de-test-statut-non-retenu.tsv` (même contenu, à ouvrir dans un tableur).

Avant de commencer, noter : version testée, nom du testeur, date.

## Ce qu'il faut savoir en une minute

Les lignes sont rangées en deux catégories :

1. **Déjà vérifié** par Hanta à l'écran, pendant la mise au point : ne pas rejouer.
2. **À jouer par le testeur** : 7 parcours courts (P-01 à P-07), ceux qui comptent. Chacun raconte une situation réelle d'agent de terrain.

Il n'y a pas de section « déjà joué » : c'est une fonction neuve.

**Ce que fait le nouveau statut** : quand on choisit « Non retenu » dans la fiche d'une action, un champ **« Raison du refus »** (liste déroulante) remplace le champ de date ou de période. La raison est obligatoire pour enregistrer. Les quatre raisons proposées sont :

- Non pertinent pour les besoins du territoire
- Pas de contact avec la structure
- Dossier ne correspondant pas au cahier des charges
- Opération déjà programmée avec une autre structure

Pour chaque parcours : suivre les étapes, comparer avec le résultat attendu, puis noter **OK**, **KO**, **Bloqué** ou **Non testé**. En cas de KO : décrire ce qui s'est passé et joindre une capture d'écran.

## 1. Les 7 parcours à jouer

Jouer dans l'ordre : P-01, P-02, P-03 et P-04 s'enchaînent sur la même action (« Action A »). P-05 se joue après P-01. P-06 utilise une autre action (« Action B »). P-07 ne modifie rien.

### P-01 : Refuser une action avec une raison (bloquant)

**Avant de commencer** : Profil FT National. Action A : n'importe quelle action à l'état « À confirmer » dans TEST, choisie librement par le testeur. Noter son identifiant et son statut de départ (« À confirmer »).

**Étapes**

1. Ouvrir le tableau de bord et choisir une action quelconque à l'état « À confirmer » (c'est l'action A pour tous les parcours P-01 à P-05).
1. Cliquer sur « Modifier » pour ouvrir sa fiche.
1. Dans la carte « Statut », choisir « Non retenu ».
1. Regarder ce qui apparaît sous les cases de statut.
1. Dans « Raison du refus », choisir « Pas de contact avec la structure ».
1. Cliquer sur « Enregistrer ».

**Données** : Action A, raison « Pas de contact avec la structure ».

**Résultat attendu** : À l'étape 4, le champ « Raison du refus * » apparaît, vide (« Choisir une raison »), à la place du champ de date ou de période. À l'étape 6, la fiche s'enregistre sans message d'erreur.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-02 : Refuser une action sans choisir de raison (bloquant)

**Avant de commencer** : Profil FT National. Action A (suite de P-01). Remettre d'abord son statut de départ si besoin, puis enregistrer.

**Étapes**

1. Ouvrir la fiche de l'action A (bouton « Modifier »).
1. Choisir le statut « Non retenu ». Ne PAS choisir de raison.
1. Cliquer sur « Enregistrer ».
1. Lire les messages.
1. Choisir maintenant une raison, puis cliquer sur « Enregistrer ».

**Données** : Action A.

**Résultat attendu** : À l'étape 3, l'enregistrement n'a pas lieu. Un message rouge en haut de la fiche indique que la raison du refus est obligatoire pour le statut « Non retenu ». Le champ « Raison du refus » est marqué en erreur avec le message « Choisissez une raison du refus pour enregistrer le statut « Non retenu ». » et le curseur s'y place. À l'étape 5, l'enregistrement réussit.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-03 : Retrouver la raison dans le tableau (majeur)

**Avant de commencer** : Profil FT National. Action A enregistrée « Non retenu » avec une raison (P-01 ou P-02).

**Étapes**

1. Fermer la fiche et revenir au tableau.
1. Trouver la ligne de l'action A.
1. Regarder la colonne « Statut ».
1. Rouvrir la fiche de l'action A et regarder la raison affichée.

**Données** : Action A, raison choisie à l'étape précédente.

**Résultat attendu** : Dans la colonne Statut, la pastille « Non retenu » est suivie d'une ligne grise « Raison : » avec la raison complète, sans coupure. Dans la fiche, la bonne raison est déjà sélectionnée.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-04 : Reprendre une action refusée (majeur)

**Avant de commencer** : Profil FT National. Action A en « Non retenu » avec une raison (suite de P-03).

**Étapes**

1. Ouvrir la fiche de l'action A.
1. Choisir le statut « Planifiée ».
1. Regarder le champ qui apparaît sous les cases.
1. Saisir une date de planification fictive, puis cliquer sur « Enregistrer ».
1. Dans le tableau, regarder la colonne Statut de l'action A.

**Données** : Action A ; date de planification : une date fictive proche.

**Résultat attendu** : À l'étape 3, le champ « Raison du refus » disparaît et le champ « Date de planification » apparaît. À l'étape 4, l'enregistrement réussit. À l'étape 5, la pastille « Planifiée » s'affiche avec la date, sans ligne « Raison : ». La raison est effacée (elle ne revient pas si on rouvre la fiche puis qu'on re-choisit « Non retenu »).

**À savoir** : à la fin, remettre l'action A dans son statut de départ.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-05 : Exporter les actions en CSV (majeur)

**Avant de commencer** : Profil FT National. Au moins une action « Non retenu » avec une raison, par exemple l'action A après P-01 (si P-04 est déjà joué, refaire P-01 avant). Un tableur pour ouvrir le fichier.

**Étapes**

1. Sur le tableau de bord, cliquer sur le bouton d'export CSV.
1. Ouvrir le fichier dans un tableur.
1. Regarder la dernière colonne.
1. Chercher la ligne de l'action A, puis une ligne d'une action avec un autre statut.

**Données** : Action A « Non retenu » avec la raison « Pas de contact avec la structure ».

**Résultat attendu** : Le fichier a une nouvelle colonne **« Raison du refus »**, tout à droite, après « Financeurs ». Les colonnes existantes n'ont pas bougé. La ligne de l'action A contient la raison complète. Les lignes des autres statuts ont cette colonne vide. Les accents s'affichent correctement.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-06 : Action déjà « Non retenu » sans raison (majeur)

**Avant de commencer** : Profil FT National. Action B : ANS-26-0055-3, club RUGBY CLUB AUCH, « CRÉNEAUX SPORTIFS D'ALLER-VERS ». Elle est déjà au statut « Non retenu », sans raison du refus.

**Étapes**

1. Dans le tableau, chercher l'action ANS-26-0055-3 (action B) et regarder la colonne Statut.
1. Ouvrir la fiche de l'action B.
1. Regarder le champ « Raison du refus ».
1. Sans rien choisir, changer par exemple la ville de l'action, puis cliquer sur « Enregistrer ».
1. Choisir une raison, puis cliquer sur « Enregistrer ».

**Données** : Action B (ANS-26-0055-3).

**Résultat attendu** : À l'étape 1, la pastille « Non retenu » est suivie de « Raison : non renseignée ». À l'étape 3, le champ est vide (« Choisir une raison ») et aucune erreur ne s'affiche avant l'enregistrement. À l'étape 4, l'enregistrement est refusé avec le message d'erreur sur la raison, même si l'agent modifie autre chose. À l'étape 5, l'enregistrement réussit et le tableau affiche la raison.

**À savoir** : ne pas changer la ville de façon durable : utiliser une valeur d'essai.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-07 : Filtrer et compter les actions « Non retenu » (mineur)

**Avant de commencer** : Profil FT National. Au moins une action « Non retenu » dans TEST. Ce parcours ne modifie rien.

**Étapes**

1. Sur le tableau de bord, ouvrir le filtre « Statut ».
1. Choisir « Non retenu ».
1. Regarder le tableau.
1. Ouvrir la synthèse et regarder « Répartition par statut ».

**Données** : actions « Non retenu » présentes dans TEST.

**Résultat attendu** : « Non retenu » figure dans la liste des statuts du filtre. Le tableau n'affiche plus que les actions « Non retenu ». Dans la synthèse, « Non retenu » est une part de plus de la répartition, avec son nombre et son pourcentage dans la légende.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

## 2. Déjà vérifié par Hanta, 10/11/2026 (ne pas rejouer)

| ID | Ce qui a été vérifié | Résultat constaté |
| --- | --- | --- |
| V-01 | Les 5 statuts sur écran large | Les 5 cases s'affichent dans la fiche, groupées à gauche, avec un petit espace fixe entre elles. |
| V-02 | Les 5 statuts quand la fenêtre se réduit | Les cases passent à la ligne toutes seules selon la largeur, sans se chevaucher ni déborder. |
| V-03 | Contour gris | Les 5 cases ont un contour gris en permanence, y compris « Non retenu ». |
| V-04 | Contour bleu | La case choisie a un contour bleu plus marqué que les autres. |
| V-05 | Hauteur des cases | Les 5 cases ont la même hauteur. |
| V-06 | Apparition du champ « Raison du refus » | Le champ apparaît en choisissant « Non retenu » et disparaît en choisissant un autre statut. |
| V-07 | Raison obligatoire | Sans raison choisie, l'enregistrement d'une action « Non retenu » est bloqué. |
| V-08 | Effacement de la raison | En quittant « Non retenu » pour un autre statut, la raison est effacée. |
| V-09 | Bloc Financement | Le bloc reste lisible avec plusieurs financeurs. |
| V-10 | Info-bulle sur « Raison du refus » | L'info-bulle montre la raison choisie en entier. |
| V-11 | Info-bulle sur « Financeur » | L'info-bulle montre le nom complet du financeur quand il est coupé. |

Remarque : V-06, V-07 et V-08 sont aussi touchés par les parcours P-01, P-02 et P-04. Ces parcours vérifient le trajet complet jusqu'au tableau ; les points de V-06 à V-08 n'ont pas à être refaits séparément.
