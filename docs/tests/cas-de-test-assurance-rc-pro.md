# Recette de l'assurance RC Pro des clubs : parcours à jouer

Document de recette de la nouvelle fonction **« Assurance RC Pro »** : dépôt, remplacement et consultation de l'attestation d'assurance d'un club, depuis la fiche du club (widget Clubs) et depuis la fiche d'une action (tableau de bord).

- **Environnement** : TEST.
- **Profil** : FT National.
- **Données** : uniquement des données fictives, déjà présentes dans TEST. Aucun club n'est à créer.
- **Fichier de suivi** : `cas-de-test-assurance-rc-pro.tsv` (même contenu, à ouvrir dans un tableur).

Avant de commencer, noter : version testée, nom du testeur, date.

## Ce qu'il faut savoir en une minute

Les lignes sont rangées en deux catégories :

1. **Déjà vérifié** par Hanta à l'écran : ne pas rejouer.
2. **À jouer par le testeur** : 8 parcours courts (P-01 à P-08). Chacun raconte une situation réelle d'agent de terrain.

**Ce que fait la fonction**

- Chaque club a **un seul document** d'assurance, jamais un par action. Un club qui a plusieurs actions montre le même document partout.
- Sur la **fiche du club**, une carte « Assurance RC Pro » se trouve à droite du bloc « Club ». Elle a trois états : **aucune attestation**, **valide jusqu'au…**, **expirée le…** (texte rouge, en gras).
- Sur la **fiche d'une action**, la carte « Club » contient une phrase d'état et le bouton **« Gérer l'assurance »**, toujours présent.
- Le **dépôt** demande deux choses, toutes deux obligatoires : le **fichier PDF** (10 Mo au maximum) et la **date d'expiration** (écrite à la main, lue sur l'attestation).
- Le **remplacement** est toujours proposé, même si l'attestation est encore valide. Le nouveau fichier **écrase** l'ancien : il n'y a pas d'historique, et on ne peut pas supprimer.
- Une attestation est **valide jusqu'au jour d'expiration inclus**, d'après la date du jour (heure de Paris).

Pour chaque parcours : suivre les étapes, comparer avec le résultat attendu, puis noter **OK**, **KO**, **Bloqué** ou **Non testé**. En cas de KO : décrire ce qui s'est passé et joindre une capture d'écran.

## À préparer avant de jouer (à confirmer par Hanta)

Les clubs ci-dessous ne sont pas nommés : aucun n'a été identifié avec certitude dans TEST. Hanta les choisit et complète ce tableau avant de transmettre le document.

| Nom utilisé ci-dessous | Ce qu'il faut | Nom du club dans TEST |
| --- | --- | --- |
| Club A | Un club **sans** attestation, avec **au moins 2 actions** | [À vérifier par Hanta] |
| Club B | Un club avec une attestation **valide** | [À vérifier par Hanta] |
| Club C | Un club avec une attestation **expirée** | [À vérifier par Hanta] |

Si aucun club C n'existe, il se prépare en déposant d'abord une attestation avec une date passée (voir P-05).

Fichiers à avoir sous la main (fictifs, sans donnée de personne) :

- **un PDF léger** (quelques Ko), à nommer par exemple « attestation-test.pdf » ;
- **un fichier qui n'est pas un PDF** (une image ou un tableur) ;
- **un PDF de plus de 10 Mo**.

## 1. Les 8 parcours à jouer

Jouer dans l'ordre. P-01, P-02 et P-03 s'enchaînent sur le club A. P-04 utilise le club B, P-05 le club C. P-06, P-07 et P-08 peuvent se jouer sur n'importe quel club, avec précaution (voir « À savoir »).

### P-01 : Déposer une attestation depuis la fiche du club (bloquant)

**Avant de commencer** : Widget Clubs. Club A (sans attestation).

**Étapes**

1. Ouvrir la fiche du club A (bouton « Voir »).
1. Regarder la carte « Assurance RC Pro », à droite du bloc « Club ».
1. Cliquer sur « Déposer l'attestation ».
1. Choisir le PDF léger.
1. Saisir une date d'expiration dans le futur (par exemple dans 6 mois), au format jj/mm/aaaa.
1. Cliquer sur « Déposer ».

**Données** : club A, PDF léger, date d'expiration dans 6 mois.

**Résultat attendu** : À l'étape 2, la carte dit « Aucune attestation d'assurance RC Pro déposée », avec un bouton « Déposer l'attestation ». À l'étape 3, la fenêtre « Dépôt de l'assurance RC Pro » s'ouvre, avec le nom du club, deux champs marqués d'une étoile et le texte « PDF uniquement, 10 Mo au maximum ». À l'étape 6, la fenêtre se ferme sans erreur. La carte affiche « Attestation valide jusqu'au… » avec la bonne date, la date de dépôt du jour, et deux boutons : « Voir l'attestation » et « Remplacer l'attestation ».

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-02 : Déposer depuis la fiche d'une action (bloquant)

**Avant de commencer** : Tableau de bord. Club A, qui a au moins 2 actions. Si P-01 est déjà joué, utiliser à la place un autre club sans attestation (le jouer alors sur ce club, et le noter dans la remarque).

**Étapes**

1. Dans le tableau, repérer deux actions du club A (action 1 et action 2).
1. Ouvrir la fiche de l'action 1 (bouton « Modifier »).
1. Dans la carte « Club », lire la phrase sous « Assurance RC Pro ».
1. Cliquer sur « Gérer l'assurance ».
1. Choisir le PDF léger, saisir une date d'expiration dans le futur, puis cliquer sur « Déposer ».
1. Regarder la phrase dans la carte « Club ».

**Données** : club A sans attestation, PDF léger, date d'expiration dans le futur.

**Résultat attendu** : À l'étape 3, la phrase indique qu'aucune attestation n'est déposée. À l'étape 4, la même fenêtre que dans la fiche du club s'ouvre (« Dépôt de l'assurance RC Pro »). À l'étape 5, elle se ferme sans erreur et le reste de la fiche de l'action (champs en cours de saisie) n'a pas bougé. À l'étape 6, la phrase indique « valide jusqu'au… » avec la bonne date. Le bouton « Gérer l'assurance » est toujours là.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-03 : Un club, un seul document pour toutes ses actions (majeur)

**Avant de commencer** : Club A avec une attestation déposée (suite de P-01 ou P-02) et au moins 2 actions.

**Étapes**

1. Ouvrir la fiche de l'action 2 du club A (une autre action que celle de P-02).
1. Lire la phrase d'état dans la carte « Club ».
1. Fermer la fiche, puis aller dans le widget Clubs et ouvrir la fiche du club A.
1. Lire la carte « Assurance RC Pro ».
1. Cliquer sur « Voir l'attestation ».

**Données** : club A, avec ses 2 actions.

**Résultat attendu** : Les étapes 2 et 4 donnent le même état et la même date d'expiration, sans qu'on ait rien déposé pour l'action 2. À l'étape 5, une fenêtre plein écran s'ouvre et montre le PDF déposé, avec un bouton « Télécharger ».

**À savoir** : on ne vérifie pas ici le contenu du PDF, seulement qu'un PDF s'affiche.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-04 : Remplacer une attestation encore valide (majeur)

**Avant de commencer** : Widget Clubs. Club B (attestation valide). Noter sa date d'expiration actuelle.

**Étapes**

1. Ouvrir la fiche du club B et lire la carte « Assurance RC Pro ».
1. Cliquer sur « Remplacer l'attestation ».
1. Lire la fenêtre qui s'ouvre, notamment le champ de date.
1. Choisir le PDF léger et saisir une nouvelle date d'expiration, plus lointaine que l'ancienne.
1. Cliquer sur « Remplacer ».
1. Regarder la carte.

**Données** : club B, PDF léger, une date d'expiration plus lointaine que l'ancienne.

**Résultat attendu** : À l'étape 2, le bouton « Remplacer l'attestation » est bien proposé alors que l'attestation est valide. À l'étape 3, la fenêtre « Remplacement de l'assurance RC Pro » prévient : « Le document actuel sera remplacé par le nouveau et ne pourra pas être récupéré ». Le champ de date est **vide** (il ne reprend pas l'ancienne date). À l'étape 6, la carte affiche la nouvelle date d'expiration et la date de dépôt du jour. Il n'y a toujours qu'un seul document.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-05 : Remplacer une attestation expirée (majeur)

**Avant de commencer** : Club C (attestation expirée). S'il n'existe pas : déposer d'abord une attestation sur un club sans attestation, avec une date d'expiration **passée** (par exemple il y a un mois) ; l'attestation est alors acceptée et s'affiche directement comme expirée.

**Étapes**

1. Ouvrir la fiche du club C et lire la carte « Assurance RC Pro ».
1. Cliquer sur « Voir l'attestation », regarder, puis fermer la fenêtre.
1. Cliquer sur « Remplacer l'attestation ».
1. Choisir le PDF léger, saisir une date d'expiration dans le futur, puis cliquer sur « Remplacer ».
1. Ouvrir ensuite la fiche d'une action de ce club (tableau de bord) et lire la phrase d'état.

**Données** : club C, PDF léger, date d'expiration dans le futur.

**Résultat attendu** : À l'étape 1, la carte dit « Attestation expirée le… » en rouge et en gras, avec la date. À l'étape 2, l'attestation expirée reste consultable. À l'étape 4, le remplacement réussit et la carte passe à « Attestation valide jusqu'au… ». À l'étape 5, la fiche de l'action affiche le même état « valide ».

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-06 : Impossible de déposer sans date d'expiration (majeur)

**Avant de commencer** : Un club quelconque, depuis le widget Clubs. De préférence un club sans attestation, pour ne rien écraser.

**Étapes**

1. Ouvrir la fenêtre de dépôt (ou de remplacement) du club.
1. Choisir le PDF léger, mais laisser le champ de date **vide**.
1. Cliquer sur « Déposer » (ou « Remplacer »).
1. Lire les messages, puis saisir une date n'ayant pas de sens, par exemple « 45/13/2027 », et cliquer de nouveau.
1. Saisir une vraie date et valider (ou fermer la fenêtre sans valider si le club ne doit pas changer).

**Données** : PDF léger ; date vide, puis « 45/13/2027 ».

**Résultat attendu** : À l'étape 3, rien n'est enregistré. Un message d'erreur s'affiche sous le champ : « Saisissez la date d'expiration de l'attestation. », et le curseur s'y place. À l'étape 4, le message devient : « Saisissez une date valide, au format jj/mm/aaaa. ». La fenêtre reste ouverte, le fichier choisi n'est pas perdu.

**À savoir** : à l'étape 5, une seule règle à retenir : ne pas écraser l'attestation d'un club utile aux autres parcours. Fermer la fenêtre si besoin.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-07 : Impossible de déposer un fichier qui n'est pas un PDF, ou trop lourd (majeur)

**Avant de commencer** : Un club quelconque, depuis le widget Clubs. Les trois fichiers préparés (voir plus haut).

**Étapes**

1. Ouvrir la fenêtre de dépôt (ou de remplacement) du club.
1. Ne choisir **aucun fichier**, saisir une date future, puis cliquer sur « Déposer ».
1. Choisir le fichier qui n'est pas un PDF, puis cliquer sur « Déposer ».
1. Choisir le PDF de plus de 10 Mo, puis cliquer sur « Déposer ».
1. Choisir le PDF léger et valider si le club peut changer, sinon fermer la fenêtre.

**Données** : aucun fichier ; une image ou un tableur ; un PDF de plus de 10 Mo ; PDF léger.

**Résultat attendu** : Rien n'est enregistré aux étapes 2, 3 et 4. Les messages sous le champ du fichier sont, dans l'ordre : « Choisissez le fichier PDF de l'attestation. », « Ce fichier n'est pas un PDF. Choisissez un fichier au format PDF. », « Ce fichier dépasse 10 Mo. Choisissez un fichier plus léger. ». Le message disparaît quand on choisit un fichier valide.

**À savoir** : si le navigateur ne laisse pas choisir autre chose qu'un PDF à l'étape 3, noter « OK » avec la remarque « choix limité aux PDF par le navigateur ».

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-08 : Le jour d'expiration compte encore comme valide (mineur)

**Avant de commencer** : Un club quelconque, utilisable sans gêne : de préférence le club C une fois P-05 joué, ou un club sans attestation.

**Étapes**

1. Déposer (ou remplacer) une attestation avec le PDF léger et une date d'expiration égale à **la date d'aujourd'hui**.
1. Lire la carte « Assurance RC Pro ».
1. Redéposer ensuite avec la date d'**hier**, puis relire la carte.

**Données** : PDF léger ; date d'aujourd'hui, puis date d'hier.

**Résultat attendu** : À l'étape 2, la carte dit « Attestation valide jusqu'au… » avec la date d'aujourd'hui. À l'étape 3, la carte dit « Attestation expirée le… » avec la date d'hier, en rouge et en gras.

**À savoir** : ce parcours modifie l'attestation du club. Remettre une attestation avec une date lointaine à la fin.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

## 2. Déjà vérifié par Hanta (ne pas rejouer)

| ID | Ce qui a été vérifié | Résultat constaté |
| --- | --- | --- |
| V-01 | Droits des quatre profils (ANS, National, Régional, Départemental), avec « Voir en tant que » | L'attestation se comporte exactement comme le logo du club pour chaque profil : chacun voit et modifie seulement les clubs de son périmètre. |
| V-02 | Couleur du texte « expirée » | Le texte d'état « expirée » est rouge, en gras, lisible. |
| V-03 | Cohérence visuelle des cartes | La carte « Assurance RC Pro » est alignée avec le bloc « Club » et cohérente avec les autres cartes. |
| V-04 | Fenêtre de dépôt allégée | La fenêtre ne contient plus la mention « non modifiable » ni la légende : seulement le nécessaire. |
| V-05 | « Voir l'attestation » en plein écran | Le PDF s'ouvre dans une fenêtre plein écran, sans adresse technique visible dans un nouvel onglet. |

[Les dates de vérification sont à compléter par Hanta.]

## Points restant à confirmer par Hanta avant transmission

1. Les noms des trois clubs de test (club A avec au moins 2 actions et sans attestation, club B valide, club C expiré).
1. La date de chaque vérification de la liste « Déjà vérifié ».
