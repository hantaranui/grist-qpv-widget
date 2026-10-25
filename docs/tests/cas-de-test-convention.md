# Cas de test : Convention, afficher le bloc Convention (R1)

**Brouillon écrit par le recetteur, corrigé après relecture de Hanta. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » tout en bas.
- Branche : `feature/convention`. Tâches 4.2 et 4.3 (fiches C24 et C25 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md` (elle fait foi). Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient ces 15 cas (CONV-01 à CONV-15), puis ceux de R2 (CONV-16 à CONV-43, plus bas), pour l'outil de suivi (18 colonnes).

## Ce que ce bloc fait et ne fait pas encore

- Il affiche **un état et un texte**. Il n'a **aucun bouton, aucun lien et aucun message de blocage** (décision du 2026-10-23).
- La note UX décrit des boutons (« Générer la convention », « Voir la convention »…) et un message de blocage (« Renseignez l'agence… »). Ils arrivent en tâche 5.1. **Ne pas noter KO l'absence de ces éléments.**
- Hors de cette recette : la fenêtre de génération, la génération du PDF, le dépôt du fichier signé (R2, R4, R5, R6).

## Cas volontairement non écrit : « Droits insuffisants »

L'état « Droits insuffisants » n'a pas de cas ici. Il apparaît quand Grist refuse la lecture de `Conventions` ou de `Modeles_convention`. Or le seul profil sans accès à ces tables est l'ANS, et **l'ANS ne voit pas le tableau de bord** : on ne peut pas le jouer à l'écran.

Il est couvert par les tests automatiques de la fiche C25, dans `test/convention-bloc.test.js` :
- « état Droits insuffisants : la phrase de la note UX, quand Conventions est refusée » ;
- « état Droits insuffisants aussi quand Modeles_convention est refusée » ;
- « Droits insuffisants l'emporte sur une convention signée présente dans les données » ;
- « le refus d'une autre table ne donne pas l'état Droits insuffisants » ;
- « la fiche contient le bloc Convention, une seule fois, avec l'état issu de state.tablesRefusees ».

Les cas CONV-08 à CONV-11 servent aussi de garde-fou : si un profil National, Régional ou Départemental voit ce message sur une action de son périmètre, c'est une anomalie des règles d'accès.

## Données d'essai à créer dans TEST avant de jouer

Données fictives uniquement. Aucun nom de document Grist, aucune adresse réelle.

### Structures (clubs)

| Club | Adresse | Code postal | Ville |
| --- | --- | --- | --- |
| Club Exemple | 1 rue Exemple | 75001 | Exemple-sur-Mer |
| Club Exemple Sans Adresse | (vide) | (vide) | (vide) |

`Structures.Ville` est une colonne formule : vérifier qu'elle est bien vide pour le second club.

### Agence d'essai, DR, DD

- On ne crée ni DR ni DD. L'agence d'essai est rattachée à une DR et à une DD qui existent déjà dans TEST : celles des profils Régional et Départemental utilisés avec « Voir en tant que ».
- Les 7 actions ci-dessous utilisent cette agence : elles sont donc dans le périmètre de ces deux profils.

### Modeles_convention (3 lignes factices, actives)

| Code | Dispositif | Actif |
| --- | --- | --- |
| STADE_EMPLOI | Du stade vers l'emploi | Oui |
| MATCH_METIERS | Match des métiers | Oui |
| REMOBILISATION | Parcours de remobilisation vers l'emploi | Oui |

Aucun modèle pour Aller vers ni pour Parcours complet d'insertion par le sport.

### Actions d'essai (Corbeille = non)

| Intitulé | Dispositif | Club | Agence | Sert aux cas |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-A1 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-01, 08, 11 |
| ESSAI-CONV-A2 | Match des métiers | Club Exemple | agence d'essai | CONV-02, 09, 12, 13, 14, 15 |
| ESSAI-CONV-A3 | Parcours de remobilisation vers l'emploi | Club Exemple | agence d'essai | CONV-03, 10, 13 |
| ESSAI-CONV-A4 | Aller vers | Club Exemple | agence d'essai | CONV-04 |
| ESSAI-CONV-A5 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-05 |
| ESSAI-CONV-A6 | Match des métiers | Club Exemple | agence d'essai | CONV-06 |
| ESSAI-CONV-A7 | Du stade vers l'emploi | Club Exemple Sans Adresse | agence d'essai | CONV-07 |

### Conventions (une seule ligne par action ; DR et DD se calculent seules)

Un « PDF fictif » est un petit PDF d'une page contenant seulement « Convention d'essai, données fictives ».

| Action | PDF_genere | PDF_signe | Date_generation | Date_depot |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-A2 | PDF fictif | (vide) | 05/03/2026 à 12:00 | (vide) |
| ESSAI-CONV-A3 | PDF fictif | PDF fictif | 14/03/2026 à 12:00 | 27/04/2026 à 12:00 |
| ESSAI-CONV-A5 | PDF fictif | (vide) | (vide) | (vide) |
| ESSAI-CONV-A6 | PDF fictif | PDF fictif | 14/03/2026 à 12:00 | (vide) |

Pas de ligne `Conventions` pour A1, A4 et A7. Saisir les dates à **12:00** : la date affichée reste alors la même quel que soit le fuseau horaire.

### Profils

Prérequis commun : le profil FT [National / Régional / Départemental] est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai. Les cas CONV-08 à CONV-11 se jouent avec « Voir en tant que » (le développeur du projet).

## Les 15 cas

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Aucun cas n'écrit dans Grist.

### États du bloc (profil FT National)

**CONV-01 : À générer** (Nominal, Bloquant, fumée)
- Étant donné : ESSAI-CONV-A1 ouverte.
- Quand : on descend en bas de la fiche.
- Alors : le bloc « Convention » est sous Statut et Financement, en pleine largeur, même style que les autres blocs. Une seule phrase : « Aucune convention générée. » Aucun bouton, aucun lien, aucun message « Renseignez… ».

**CONV-02 : Générée avec date** (Nominal, Bloquant)
- Étant donné : ESSAI-CONV-A2 ouverte.
- Alors : « Convention générée le 05/03/2026. » (jour/mois/année avec le zéro), puis en dessous : « Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé. » Aucun bouton.

**CONV-03 : Signée** (Nominal, Bloquant, fumée)
- Étant donné : ESSAI-CONV-A3 ouverte (PDF généré et PDF signé présents).
- Alors : une seule phrase : « Convention signée, déposée le 27/04/2026. » C'est la date de dépôt, pas 14/03/2026. Pas de phrase d'aide. L'état Signée l'emporte sur Générée.

**CONV-04 : Sans modèle** (Nominal, Majeur)
- Étant donné : ESSAI-CONV-A4 ouverte (dispositif Aller vers).
- Alors : une seule phrase : « Pas encore de modèle de convention pour ce dispositif. » Aucun bouton.

**CONV-05 : Générée, date vide** (Limite, Majeur)
- Étant donné : ESSAI-CONV-A5 ouverte.
- Alors : « Convention générée. » (ni « le », ni date, ni « undefined », ni 01/01/1970), puis la phrase d'aide.

**CONV-06 : Signée, date vide** (Limite, Majeur)
- Étant donné : ESSAI-CONV-A6 ouverte.
- Alors : « Convention signée. » seule (la date de génération 14/03/2026 n'est pas reprise). Pas de phrase d'aide.

**CONV-07 : élément manquant, pas de message de blocage** (Nominal, Majeur)
- Étant donné : ESSAI-CONV-A7 ouverte (club sans adresse).
- Alors : seulement « Aucune convention générée. » Aucun « Renseignez l'adresse du club dans sa fiche. », aucun « Convention impossible à générer : », aucun bouton grisé.

### Droits par profil (« Voir en tant que », par le développeur du projet)

**CONV-08 : FT Régional, À générer** (Droits, Bloquant, fumée)
- Étant donné : profil FT Régional.
- Quand : ouvre ESSAI-CONV-A1.
- Alors : « Aucune convention générée. », seule. Le message « Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord. » n'apparaît pas (sinon KO).

**CONV-09 : FT Régional, Générée** (Droits, Majeur)
- Quand : ouvre ESSAI-CONV-A2.
- Alors : « Convention générée le 05/03/2026. » puis la phrase d'aide. Pas de message « Vous n'avez pas accès… ».

**CONV-10 : FT Départemental, Signée** (Droits, Majeur)
- Étant donné : profil FT Départemental.
- Quand : ouvre ESSAI-CONV-A3.
- Alors : « Convention signée, déposée le 27/04/2026. » seule. Pas de message « Vous n'avez pas accès… ».

**CONV-11 : FT Départemental, À générer** (Droits, Majeur)
- Quand : ouvre ESSAI-CONV-A1.
- Alors : « Aucune convention générée. », seule. Cela prouve que ce profil lit aussi `Modeles_convention`.

### Mobile et accessibilité

**CONV-12 : clavier** (Mobile et accessibilité, Majeur, autre développeur)
- Quand : sur ESSAI-CONV-A2, on avance avec Tab depuis le dernier champ de Financement, puis on revient avec Maj+Tab.
- Alors : le focus passe aux boutons du bas de la fiche sans s'arrêter sur le bloc (rien à activer dedans) ; pas de piège au clavier.

**CONV-13 : lecteur d'écran VoiceOver (Mac)** (Mobile et accessibilité, Majeur, développeur du projet)
- Quand : lecture ligne par ligne de ESSAI-CONV-A2 puis A3.
- Alors : A2 : « Convention », « Convention générée le 05/03/2026. », puis la phrase d'aide, dans cet ordre. A3 : « Convention signée, déposée le 27/04/2026. » Ni « bouton » ni « lien », aucune annonce automatique, aucune information portée par la seule couleur.

**CONV-14 : zoom 200 %** (Mobile et accessibilité, Majeur, autre développeur)
- Quand : zoom navigateur à 200 % sur ESSAI-CONV-A2.
- Alors : phrases lisibles, à la ligne, sans texte coupé ni défilement horizontal propre au bloc. Remettre le zoom à 100 % ensuite.

**CONV-15 : mobile** (Mobile et accessibilité, Mineur, autre développeur)
- Quand : écran d'environ 375 px de large, sur ESSAI-CONV-A2.
- Alors : le bloc passe sous les autres blocs, en pleine largeur, textes à la ligne, rien de coupé. La note UX parle aussi de boutons qui passent à la ligne : pas jouable avant 5.1.

## Tests de fumée (3 sur 15)

- CONV-01 : état À générer.
- CONV-03 : état Signée.
- CONV-08 : un profil Régional voit le bloc, et non « Droits insuffisants ».

## Après une correction

Rejouer le cas concerné, puis ses voisins (mêmes états : CONV-01 à CONV-07 ; mêmes profils : CONV-08 à CONV-11), et rappeler à Hanta de relancer toute la suite automatique (npm test).

## Rejouer en PROD

En PROD, jouer ces cas sur de vraies actions dans l'état voulu, sans créer de données.

## [À CONFIRMER]

1. Le compte du testeur « National » pour CONV-01 à CONV-07 et CONV-12 à CONV-15 : un vrai profil FT National, ou un propriétaire du document ? (Un propriétaire voit tout : le cas serait moins représentatif.)
2. `Structures.Ville` (colonne formule) doit rester vide pour « Club Exemple Sans Adresse » : à vérifier pour CONV-07.

Mode sombre : à traiter à part pour tout le tableau de bord (hors R1).

---

# Cas de test : Convention, fenêtre et enregistrement (R2)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-15 (R1) ci-dessus n'ont pas été modifiés.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » puis fenêtre « Convention ».
- Branche : `feature/convention`. Tâches 5.1a, 5.1b et 5.2 (fiches C27 à C34 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md`, mise à jour le 2026-10-23 (elle fait foi). Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient les 28 cas de R2 (CONV-16 à CONV-43), à la suite des 15 de R1 : 43 lignes de cas, 18 colonnes.

## Ce que la fenêtre fait et ne fait pas encore

- Elle permet de **voir les informations, choisir le signataire du club, saisir le représentant de l'agence et enregistrer un brouillon** dans `Conventions`.
- Elle n'a **pas de bouton « Générer la convention »** dans son pied, et aucun PDF n'est produit. Ils arrivent avec la tâche S7. **Ne pas noter KO leur absence.**
- « Enregistrer les informations » ne contrôle **que l'année** (quatre chiffres). Un champ vide est accepté : c'est un brouillon.
- Hors de cette recette : génération du PDF, voir la convention, dépôt du fichier signé (R4, R5, R6).

## Cas volontairement non écrits

1. **Message « Renseignez le dispositif de l'action dans sa fiche. »** : il ne s'affiche jamais (décision D-5 du 2026-10-23). Sans dispositif, le bloc est à l'état « Sans modèle » (voir CONV-04), et le bouton n'existe pas. Pas de cas.
2. **Refus d'écriture sur `Conventions`** : on ne peut pas le jouer à l'écran. Aucun profil qui voit le tableau de bord (National, Régional, Départemental) n'est privé d'écriture sur `Conventions` ; l'ANS, lui, ne voit pas le tableau de bord. Le message d'échec « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » est couvert par les tests automatiques de la fiche C34, dans `test/convention-enregistrement.test.js` :
   - « refus ou erreur : message exact, aucun texte de l'erreur de Grist, rien dans la console, données inchangées » ;
   - « refus sur une action sans ligne : rien n'est gardé en mémoire, le nouvel essai crée la ligne » ;
   - « création sans identifiant renvoyé par Grist : la table est relue, le deuxième enregistrement met à jour » ;
   - « création réussie mais relecture impossible : le message reste celui de la réussite ».

   Les cas CONV-34 et CONV-35 servent de garde-fou : si le message d'échec apparaît pour un profil Régional ou Départemental dans son périmètre, c'est une anomalie des règles d'accès de `Conventions`.
3. **Plusieurs éléments manquants à la fois** : la note dit qu'un seul message s'affiche (le premier dans l'ordre agence, club, dispositif, adresse). Il est vérifié par le test « génération bloquée par plusieurs éléments : un seul message… » (fiche C28), pas par un cas à l'écran.

## Données d'essai de R2 à créer dans TEST avant de jouer

Données fictives uniquement (Club Exemple, exemple.fr). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1 restent en place** : les actions ESSAI-CONV-A1 à A7 ne sont pas touchées par R2.

### Structures (clubs)

| Club | Adresse | Code postal | Ville | SIRET | Contacts |
| --- | --- | --- | --- | --- | --- |
| Club Exemple (existe déjà, R1) | 1 rue Exemple | 75001 | Exemple-sur-Mer | 12345678900012 (fictif, à ajouter s'il est vide) | 2 contacts, voir plus bas |
| Club Exemple Sans Adresse (existe déjà, R1) | (vide) | (vide) | (vide) | (au choix, fictif) | 1 contact, voir plus bas |
| Club Exemple Sans Contact (nouveau) | 2 rue Exemple | 75002 | Exemple-sur-Mer | 12345678900020 (fictif) | AUCUN |

### Contacts (table Contacts, créés depuis la fiche du club)

| Prénom | Nom | Fonction | Email | Club |
| --- | --- | --- | --- | --- |
| Alex | Martin-Exemple | Président | alex.martin@exemple.fr | Club Exemple |
| Sam | Test-Exemple | (vide) | sam.test@exemple.fr | Club Exemple |
| Robin | Autre-Exemple | Trésorier | robin.autre@exemple.fr | Club Exemple Sans Adresse |

Robin sert à vérifier que la liste « Signataire » ne montre que les contacts du club de l'action (CONV-23). Dans la liste, le libellé est « Prénom Nom » : « Alex Martin-Exemple », « Sam Test-Exemple ».

### Agence d'essai, DR, DD

- On ne crée ni DR ni DD. **On reprend l'agence d'essai de R1**, déjà rattachée à la DR et à la DD existantes de TEST (celles des profils Régional et Départemental utilisés avec « Voir en tant que »). Si une autre agence d'essai est créée, elle doit être rattachée aux mêmes DR et DD : sinon la ligne `Conventions` ne se calcule pas dans le périmètre de ces profils et CONV-34 et CONV-35 sont Bloqués.
- L'agence d'essai doit avoir une adresse fictive complète (elle s'affiche dans la fenêtre, CONV-20).
- Sauf ESSAI-CONV-B1, toutes les actions de R2 utilisent cette agence.

### Modeles_convention

Ceux de R1 suffisent. À vérifier avant de jouer : la colonne `Titre` du modèle Du stade vers l'emploi vaut « Du stade vers l'emploi », celle de Match des métiers « Le Match des Métiers », celle de Parcours de remobilisation « Parcours de remobilisation » (correspondance de la note), et `Avec_annee` vaut Non pour Parcours de remobilisation seulement.

### Actions d'essai (Corbeille = non, aucune ligne dans Conventions au départ)

Les cas qui **écrivent** ont **leur propre action** : aucun cas ne dépend d'un autre.

| Intitulé | Dispositif | Club | Agence | Sert au cas |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-B1 | Du stade vers l'emploi | Club Exemple | AUCUNE | CONV-16 |
| ESSAI-CONV-B2 | Du stade vers l'emploi | AUCUN | agence d'essai | CONV-17 |
| ESSAI-CONV-B3 | Du stade vers l'emploi | Club Exemple Sans Adresse | agence d'essai | CONV-18 |
| ESSAI-CONV-B4 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-19, 20, 23, 24, 36, 37, 38, 39, 40, 42 (lecture seule : on n'enregistre jamais) |
| ESSAI-CONV-B5 | Match des métiers | Club Exemple | agence d'essai | CONV-21 |
| ESSAI-CONV-B6 | Parcours de remobilisation vers l'emploi | Club Exemple | agence d'essai | CONV-22 |
| ESSAI-CONV-B7 | Du stade vers l'emploi | Club Exemple Sans Contact | agence d'essai | CONV-25 (écrit) |
| ESSAI-CONV-B8 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-30 (écrit) |
| ESSAI-CONV-B9 | Match des métiers | Club Exemple | agence d'essai | CONV-31 (écrit) |
| ESSAI-CONV-B10 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-32 (écrit) |
| ESSAI-CONV-B11 | Parcours de remobilisation vers l'emploi | Club Exemple | agence d'essai | CONV-33 (écrit) |
| ESSAI-CONV-B12 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-26 (ne doit rien écrire) |
| ESSAI-CONV-B13 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-27 |
| ESSAI-CONV-B14 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-28 (écrit) |
| ESSAI-CONV-B15 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-29 (écrit) |
| ESSAI-CONV-B16 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-34 (écrit, FT Régional) |
| ESSAI-CONV-B17 | Match des métiers | Club Exemple | agence d'essai | CONV-35 (écrit, FT Départemental) |
| ESSAI-CONV-B18 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-41 (écrit) |
| ESSAI-CONV-B19 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-43 (écrit) |

B6 est l'action « À générer » de dispositif Parcours de remobilisation (lecture) ; B11 en est la version qui écrit. Le représentant saisi dans les cas est toujours fictif (« Dominique Exemple », « Camille Exemple »).

**Pour rejouer un cas qui écrit** : supprimer d'abord la ligne `Conventions` de son action (ou recréer l'action). Une ligne déjà là change le résultat (mise à jour au lieu de création).

### Profils

Prérequis commun : le profil FT [National / Régional / Départemental] est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai. CONV-34 et CONV-35 se jouent avec « Voir en tant que » (le développeur du projet). ESSAI-CONV-B1 n'a pas d'agence : seul le profil National la voit.

## Les 28 cas de R2

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. « Rejouable en PROD » = Oui seulement pour les cas qui ne font que regarder. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Bloc : bouton grisé et message (profil FT National)

- **CONV-16 : agence manquante** (Erreur, Majeur) : « Renseignez l'agence de l'action dans sa fiche. », bouton grisé, la fenêtre ne s'ouvre pas.
- **CONV-17 : club manquant** (Erreur, Majeur) : « Renseignez le club de l'action. »
- **CONV-18 : adresse du club manquante** (Erreur, Majeur) : « Renseignez l'adresse du club dans sa fiche. »

### Ouverture de la fenêtre

- **CONV-19 : trois blocs, introduction, pied** (Nominal, Bloquant, fumée).
- **CONV-20 : club et agence en lecture seule** (Nominal, Majeur).
- **CONV-21 : modèle Match des métiers, année préremplie** (Nominal, Majeur).
- **CONV-22 : Parcours de remobilisation, pas de champ Année** (Limite, Majeur).

### Signataires

- **CONV-23 : la liste ne montre que les contacts du club** (Nominal, Majeur).
- **CONV-24 : fonction affichée après le choix, ou « Fonction non renseignée »** (Nominal, Majeur).
- **CONV-25 : club sans contact, « Enregistrer » reste actif** (Limite, Majeur).

### Année

- **CONV-26 : 26 refusée** (Erreur, Majeur).
- **CONV-27 : année à cinq chiffres (10000) refusée** (Erreur, Mineur).
- **CONV-28 : année vide acceptée** (Limite, Majeur).
- **CONV-29 : le message disparaît au clic suivant, après correction** (Erreur, Majeur).

### Enregistrement et persistance

- **CONV-30 : première sauvegarde, ligne créée** (Nominal, Bloquant, fumée).
- **CONV-31 : réouverture préremplie, aussi après rechargement** (Persistance, Majeur).
- **CONV-32 : deuxième enregistrement, même ligne** (Persistance, Majeur).
- **CONV-33 : modèle sans année** (Limite, Majeur).

### Droits (« Voir en tant que », par le développeur du projet)

- **CONV-34 : FT Régional enregistre dans son périmètre** (Droits, Bloquant).
- **CONV-35 : FT Départemental enregistre dans son périmètre** (Droits, Bloquant).

### Fermeture

- **CONV-36 : « Fermer », focus rendu au bouton** (Nominal, Majeur).
- **CONV-37 : Échap, focus rendu au bouton** (Nominal, Majeur).
- **CONV-38 : saisie non enregistrée perdue à la réouverture, sans confirmation** (Persistance, Majeur).

### Mobile et accessibilité

- **CONV-39 : clavier, Tab reste dans la fenêtre** (Majeur).
- **CONV-40 : VoiceOver, titre et champs** (Majeur).
- **CONV-41 : VoiceOver, message d'erreur et message de succès annoncés** (Majeur).
- **CONV-42 : zoom 200 %** (Majeur).
- **CONV-43 : mobile, le message après « Enregistrer » est visible ou annoncé** (Majeur).

## Tests de fumée de R2 (2 sur 28)

- CONV-19 : la fenêtre s'ouvre avec ses trois blocs.
- CONV-30 : un enregistrement crée la ligne attendue dans `Conventions`.

Au total, avec R1 : 5 tests de fumée sur 43 cas (CONV-01, 03, 08, 19, 30).

## Cas déjà couverts par un test en code

`Automatisable = Oui` pour CONV-16 à CONV-33 et CONV-36 à CONV-39 (fiches C28, C31 et C34). Cela ne remplace pas l'essai à l'écran : le test en code prouve la logique, pas le rendu dans Grist ni les droits. Le nom du test est dans la colonne `Remarques`. Pas de test en code pour les droits (CONV-34, 35), VoiceOver (CONV-40, 41), le zoom (CONV-42) et le mobile (CONV-43).

## Après une correction

Rejouer le cas concerné, puis ses voisins (blocs : CONV-16 à CONV-18 ; ouverture : CONV-19 à CONV-25 ; année : CONV-26 à CONV-29 ; enregistrement : CONV-30 à CONV-35), et rappeler à Hanta de relancer toute la suite automatique (npm test).

## Rejouer en PROD

Seuls les cas qui ne font que regarder se rejouent sur de vraies actions (CONV-16 à CONV-24, 36 à 40 et 42). Les autres écrivent dans `Conventions` et ne se jouent que dans TEST.

## [À CONFIRMER] de R2

1. **CONV-27** (réglé à la relecture du 2026-10-23) : le champ numérique refuse les lettres à la frappe ; le cas utilise donc 10000 au lieu de « abc ». « abc » reste couvert par les tests en code (fiche C31).
2. **État du bloc après un enregistrement** (CONV-31) : j'ai écrit que le bloc reste à « Aucune convention générée. », parce que l'état suit les PDF et non la présence d'une ligne. Non vérifié dans le code : à confirmer en jouant le cas.
3. **Mode de création de ESSAI-CONV-B2 (sans club)** (CONV-17) : à confirmer que l'interface permet de vider le club, sinon créer l'action directement dans la table Actions.
4. Les colonnes `Titre` et `Avec_annee` de `Modeles_convention` ont les valeurs prévues dans TEST (voir plus haut) : à vérifier avant de jouer CONV-21 et CONV-22.
5. Le compte du testeur « National » : même question qu'en R1 (vrai profil FT National, ou propriétaire du document ?).

---

# Cas de test : Convention, générer le PDF et le voir (R4)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-43 (R1 et R2) ci-dessus n'ont pas été modifiés.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » et fenêtre « Convention ».
- Branche : `feature/convention`. Fonction D : génération du PDF, logos, mise en page, « Voir la convention » (fiches C35 à C49 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md` (elle fait foi) : §3 « Générer la convention : de l'ouverture au résultat », §3 « Cases du modèle », §11 « Mise en page du PDF », §11.2 pour les logos. Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient les 36 cas de R4 (CONV-44 à CONV-79), à la suite des 43 de R1 et R2 : 79 lignes de cas, 18 colonnes.
- Les actions de R4 s'appellent ESSAI-CONV-R1 à ESSAI-CONV-R35. **« R » veut dire « recette R4 »** : à ne pas confondre avec les actions A (R1), B (R2) et celles déjà utilisées à la main.

## Ce que cette recette couvre et ne couvre pas

- Elle couvre : cliquer sur « Générer la convention » dans la fenêtre, le résultat (PDF, nom du fichier, enregistrement du fichier et de la date), les logos, les messages de contrôle et d'échec, « Voir la convention », et les droits d'un vrai compte.
- Hors de cette recette : « Re-générer » (remplacement d'un PDF, tâche S8), le dépôt du fichier signé (R5 et R6). Le bouton « Re-générer » est visible dans l'état Générée : ne pas le noter KO, ne pas le jouer.

## Ces cas ne se jouent PAS avec « Voir en tant que »

**CONV-71 (FT Régional) et CONV-72 (FT Départemental) ne peuvent pas être joués avec « Voir en tant que ».** Ce mode ne simule pas l'utilisateur pour les jetons que le widget utilise pour envoyer et lire le fichier : un essai fait ainsi réussit à tort (fiche C41, bug du jeton du propriétaire).

Il faut **un vrai compte** pour chaque profil :
- invité dans le document comme **éditeur**, jamais comme propriétaire ;
- avec un **profil complet** dans la table Utilisateurs (la DR pour le Régional, la DD pour le Départemental, dans le périmètre de l'agence d'essai) ;
- connecté dans un navigateur à part (fenêtre privée par exemple).

Le recetteur n'invente aucun compte : lesquels utiliser est à décider par Hanta (voir [À CONFIRMER] 2).

## Cas volontairement non écrits (non jouables à l'écran)

Couverts par les tests en code (fiches C36, C40, C43, C46), dont les noms exacts n'ont pas été relus :
1. **Envoi refusé par Grist pour les droits** (« La convention n'a pas pu être enregistrée : vos droits ne le permettent pas pour cette action… ») : aucun profil du tableau de bord n'est privé d'écriture. CONV-71 et CONV-72 servent de garde-fou : si ce message apparaît, c'est une anomalie des règles d'accès.
2. **Fichier envoyé mais non rattaché** (« …n'a pas pu être rattaché à l'action… ») et **échec inattendu** (« La convention n'a pas pu être générée. Vos informations sont conservées. ») : impossibles à provoquer sans abîmer le code ou les données.
3. **Délai de 20 secondes dépassé** pour le chargement de pdfmake : long à jouer, et un défaut connu l'accompagne (fiche C43).
4. **Plus de cinq cases inconnues** (« et d'autres ») : seul le cas de deux cases est joué (CONV-64).
5. **Re-génération** (S8) : hors recette.

## Modèles officiels à vérifier avant d'écrire les données (non vérifié par le recetteur)

**Je n'ai pas accès à TEST : je n'ai pas pu vérifier que les trois modèles officiels y sont en place.** D'après REVIEW_LOG, les vrais PDF (fiches C38 à C49) ont été vus dans un document de développement, pas dans TEST. Les lignes de `Modeles_convention` de R1 sont des lignes « factices » (Code, Dispositif, Actif). À vérifier par le testeur, dans `Modeles_convention` de TEST, pour chacun des trois modèles :

| À vérifier | Du stade vers l'emploi | Match des métiers | Parcours de remobilisation |
| --- | --- | --- | --- |
| Ligne présente et `Actif` = Oui | oui | oui | oui |
| `Titre` | « Du stade vers l'emploi » | « Le Match des Métiers » | « Parcours de remobilisation » |
| `Avec_annee` | Oui | Oui | Non |
| Texte officiel complet (pas le texte factice de R1) | à vérifier | à vérifier | à vérifier |
| Case propre à ce modèle | [SIRET de l'agence] | [Adresse de l'agence] | [Adresse de l'agence] |
| Marqueur de signature | `{signatures:ft-gauche}` (une ligne « Fait à … » au-dessus, France Travail à gauche) | `{signatures:ft-gauche}` | `{signatures:lieu-date}` (club à gauche, « À …, le … » dans chaque colonne) |
| `Logo` (image fictive, PNG ou JPEG) | rempli | rempli | rempli |
| `Logo_partenaire` (image fictive) | vide | **rempli** | vide |

Si un modèle manque ou diffère : les cas qui s'y rapportent sont Bloqués, à noter avant de jouer. Le texte exact des modèles n'est pas dans le dépôt : les cases réellement présentes sont à relever par le testeur (voir [À CONFIRMER] 1).

## Données d'essai de R4 à créer dans TEST avant de jouer

Données fictives uniquement (exemple.fr, SIRET inventés). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1 et de R2 restent en place.**

### Structures (clubs)

| Club | Adresse | Code postal | Ville | SIRET | Contacts |
| --- | --- | --- | --- | --- | --- |
| Club Exemple (existe déjà) | 1 rue Exemple | 75001 | Exemple-sur-Mer | 12345678900012 | Alex Martin-Exemple (Président), Sam Test-Exemple (sans fonction), comme en R2 |
| Club Exemple Sans SIRET (nouveau) | 3 rue Exemple | 75003 | Exemple-sur-Mer | (vide) | Jo Sansiret-Exemple |
| Étoile & Cœur FC (nouveau, nom exact avec accents, « & » et « œ ») | 4 rue Exemple | 75004 | Exemple-sur-Mer | 12345678900038 | Charlie Etoile-Exemple |

### Contacts à créer (depuis la fiche du club)

| Prénom | Nom | Fonction | Email | Club |
| --- | --- | --- | --- | --- |
| Jo | Sansiret-Exemple | Président | jo.sansiret@exemple.fr | Club Exemple Sans SIRET |
| Charlie | Etoile-Exemple | Président | charlie.etoile@exemple.fr | Étoile & Cœur FC |

### Agence d'essai

- On reprend **l'agence d'essai de R1 et R2** (déjà rattachée à la DR et à la DD des profils Régional et Départemental). Pas de nouvelle DR ni de nouvelle DD.
- Elle doit avoir une adresse fictive complète **et un SIRET fictif** dans la colonne `Siret` de `Agences` (par exemple 98765432100019). Sans SIRET, CONV-44 ne vérifie pas la case propre au modèle Du stade vers l'emploi.

### Actions d'essai (Corbeille = non, aucune ligne dans Conventions au départ, sauf R25)

Chaque cas qui écrit a **son action** : aucun cas ne dépend d'un autre. Toutes utilisent l'agence d'essai. Abréviations : Stade = Du stade vers l'emploi ; Match = Match des métiers ; Remob. = Parcours de remobilisation vers l'emploi.

| Intitulé | Dispositif | Club | Sert au cas |
| --- | --- | --- | --- |
| ESSAI-CONV-R1 | Stade | Club Exemple | CONV-44 |
| ESSAI-CONV-R2 | Match | Club Exemple | CONV-45 |
| ESSAI-CONV-R3 | Remob. | Club Exemple | CONV-46 |
| ESSAI-CONV-R4 | Match | Étoile & Cœur FC | CONV-47 |
| ESSAI-CONV-R5 | Stade | Club Exemple Sans SIRET | CONV-48 |
| ESSAI-CONV-R6 | Match | Club Exemple | CONV-49 |
| ESSAI-CONV-R7 | Remob. | Club Exemple | CONV-50 (modification M1) |
| ESSAI-CONV-R8 | Match | Club Exemple | CONV-51 (modification M2) |
| ESSAI-CONV-R9 | Match | Club Exemple | CONV-52 (modification M3) |
| ESSAI-CONV-R10 à R17 | Stade | Club Exemple | CONV-53 à CONV-60, une action par cas (R10 pour CONV-53, R11 pour CONV-54, et ainsi de suite jusqu'à R17 pour CONV-60) |
| ESSAI-CONV-R18 | Stade | Club Exemple | CONV-61 (blocage de pdfmake) |
| ESSAI-CONV-R19 | Stade | Club Exemple | CONV-62 (blocage de l'envoi) |
| ESSAI-CONV-R20 | Remob. | Club Exemple | CONV-63 (modification M4) |
| ESSAI-CONV-R21 | Remob. | Club Exemple | CONV-64 (modification M5) |
| ESSAI-CONV-R22 | Remob. | Club Exemple | CONV-65 (modification M6) |
| ESSAI-CONV-R23 | Remob. | Club Exemple | CONV-66 (modification M7) |
| ESSAI-CONV-R24 | Stade | Club Exemple | CONV-67 |
| ESSAI-CONV-R25 | Match | Club Exemple | CONV-68 et CONV-69 (lecture seule, ligne Conventions préparée, voir plus bas) |
| ESSAI-CONV-R26 | Stade | Club Exemple | CONV-70 |
| ESSAI-CONV-R27 | Stade | Club Exemple | CONV-71 (FT Régional, vrai compte) |
| ESSAI-CONV-R28 | Match | Club Exemple | CONV-72 (FT Départemental, vrai compte) |
| ESSAI-CONV-R29 | Stade | Club Exemple | CONV-73 |
| ESSAI-CONV-R30 | Stade | Club Exemple | CONV-74 |
| ESSAI-CONV-R31 | Stade | Club Exemple | CONV-75 |
| ESSAI-CONV-R32 | Stade | Club Exemple | CONV-76 |
| ESSAI-CONV-R33 | Stade | Club Exemple | CONV-77 (blocage de pdfmake) |
| ESSAI-CONV-R34 | Stade | Club Exemple | CONV-78 |
| ESSAI-CONV-R35 | Stade | Club Exemple | CONV-79 |

### Ligne Conventions à préparer pour ESSAI-CONV-R25

Même principe que les actions A2 de R1 : un « PDF fictif » d'une page contenant seulement « Convention d'essai, données fictives ». `PDF_genere` = PDF fictif, `Date_generation` = 14/10/2026 à 12:00 (midi, pour que la date reste la même quel que soit le fuseau horaire), `PDF_signe` et `Date_depot` vides. C'est ce qui permet de jouer « Voir » sans régénérer.

### Rien n'écrit dans les colonnes réservées

Ne jamais renommer ni écrire à la main les colonnes `DR` et `DD` de `Conventions` : elles servent aux règles d'accès.

## Modifications temporaires des modèles (cas à risque) — joués dans DEV7, pas sur TEST (décision de Hanta du 2026-10-25)

La note UX parle d'un « modèle factice » pour les échecs. Comme il n'y a **qu'un modèle par dispositif** (voir [À CONFIRMER] 3), les cas ci-dessous modifieraient **temporairement le vrai modèle**. Pour ne prendre aucun risque sur le modèle que le collègue utilisera dans sa recette (campagne C03), ces 7 cas (CONV-50, 51, 52, 63, 64, 65, 66) se jouent dans **DEV7** (en local, où Hanta travaille déjà) et non dans TEST. Avant la première modification : garder une copie du texte et des fichiers d'origine (capture ou copie dans un document à part). **Après chaque modification, recharger la page du tableau de bord** (le widget lit probablement les modèles au chargement : [À CONFIRMER] 3).

| Repère | Cas | Modèle | Modification | À remettre en état ensuite |
| --- | --- | --- | --- | --- |
| M1 | CONV-50 | Parcours de remobilisation | vider `Logo` (`Logo_partenaire` est déjà vide) | remettre le fichier du logo |
| M2 | CONV-51 | Match des métiers | vider `Logo`, garder `Logo_partenaire` | remettre le fichier du logo |
| M3 | CONV-52 | Match des métiers | remplacer `Logo_partenaire` par un fichier texte fictif renommé logo-partenaire.png | remettre l'image du logo du partenaire |
| M4 | CONV-63 | Parcours de remobilisation | ajouter dans le texte la case [Case inexistante] | retirer la case |
| M5 | CONV-64 | Parcours de remobilisation | texte avec [Case inexistante], puis [Autre case inexistante], puis de nouveau [Case inexistante] | retirer les cases |
| M6 | CONV-65 | Parcours de remobilisation | ajouter la case [<b>Essai</b>] | retirer la case |
| M7 | CONV-66 | Parcours de remobilisation | `Actif` = Non, **pendant que la fenêtre est ouverte** (second onglet) | remettre `Actif` = Oui |

**Fin de séance (dans DEV7) : remettre les trois modèles dans l'état de départ, recharger la page, puis rejouer CONV-44, CONV-45 et CONV-46 pour prouver la remise en état.** Pour les cas M4 à M6, le nom de la colonne qui contient le texte du modèle n'est pas dans cette recette (voir [À CONFIRMER] 3).

## Provoquer une panne réseau (CONV-61, 62, 69, 77)

Dans le navigateur, outils pour développeurs (F12), onglet **Réseau** :
- **CONV-61 et CONV-77** (pdfmake non chargé) : cocher « Désactiver le cache », bloquer les requêtes dont l'adresse contient « pdfmake » (fonction « Blocage de requêtes »), puis **recharger la page** : la bibliothèque ne se charge qu'au clic sur « Générer ». Si la bibliothèque est déjà chargée dans la page, le blocage ne fait rien.
- **CONV-62** (envoi impossible) : bloquer les requêtes d'envoi de pièce jointe. Lire dans l'onglet Réseau l'adresse de l'envoi du fichier (finit par « attachments » suivi du jeton) et bloquer le début de l'adresse, **sans copier le jeton** nulle part. Ce blocage peut aussi empêcher la lecture des logos : le PDF se fabrique alors sans logo, mais seul le message d'échec d'envoi est attendu.
- **CONV-69** (« Voir » impossible) : bloquer les requêtes de téléchargement d'une pièce jointe (adresse qui contient « download »).
- **CONV-67 et CONV-74** : régler le débit sur « Slow 3G » pour rendre l'attente visible.
- **Dans tous les cas : retirer le blocage et remettre le débit normal à la fin.** Si rien n'est bloqué, l'adresse choisie est fausse : la relire sans copier le jeton.
- Un jeton Grist ne doit **jamais** figurer dans une fiche d'anomalie, une capture ou ce document.

## Les 36 cas de R4

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Génération par dispositif (profil FT National)

- **CONV-44 : Du stade vers l'emploi** (Nominal, Bloquant, fumée) : cases remplies dont le SIRET de l'agence, `{signatures:ft-gauche}`, nom de fichier `Convention-Stade-emploi-Club-Exemple-[année].pdf`, fichier et date enregistrés.
- **CONV-45 : Match des métiers** (Nominal, Bloquant) : adresse de l'agence, `{signatures:ft-gauche}`, `Convention-Match-metiers-Club-Exemple-[année].pdf`.
- **CONV-46 : Parcours de remobilisation** (Nominal, Bloquant) : pas d'année, adresse de l'agence, `{signatures:lieu-date}`, `Convention-Remobilisation-Club-Exemple.pdf`.
- **CONV-47 : nom du fichier avec accents, « & » et « œ »** (Limite, Majeur).
- **CONV-48 : club sans SIRET, pointillés et pas de blocage** (Limite, Majeur).

### Logos

- **CONV-49 : Logo et Logo_partenaire remplis, aucun message** (Nominal, Majeur).
- **CONV-50 : Logo vide, message « sans le logo France Travail », génération réussie** (Limite, Majeur).
- **CONV-51 : Logo vide et Logo_partenaire rempli** (Limite, Mineur).
- **CONV-52 : Logo_partenaire illisible, message « sans le logo du partenaire »** (Erreur, Mineur).

### Contrôle des champs obligatoires au clic sur « Générer »

- **CONV-53 : année absente** (Erreur, Majeur) : « Saisissez l'année de la convention. »
- **CONV-54 : année invalide (26)** (Erreur, Majeur) : « Saisissez une année à quatre chiffres. »
- **CONV-55 : aucun signataire** (Erreur, Majeur) : « Choisissez le signataire du club. »
- **CONV-56 : signataire sans fonction** (Erreur, Majeur) : « Le signataire choisi n'a pas de fonction. Renseignez-la dans la fiche du club, puis revenez générer la convention. »
- **CONV-57 : représentant vide** (Erreur, Majeur) : « Saisissez le nom du représentant. »
- **CONV-58 : fonction du représentant vide** (Erreur, Majeur) : « Saisissez la fonction du représentant. »
- **CONV-59 : quatre manques à la fois (sans signataire), tous affichés** (Erreur, Majeur).
- **CONV-60 : quatre manques à la fois (signataire sans fonction), puis correction** (Erreur, Majeur).

### Échecs de génération

- **CONV-61 : pdfmake non chargé (réseau)** (Erreur, Bloquant).
- **CONV-62 : envoi du fichier impossible (réseau)** (Erreur, Majeur).
- **CONV-63 : une case inconnue dans le modèle** (Erreur, Majeur).
- **CONV-64 : plusieurs cases inconnues** (Limite, Mineur).
- **CONV-65 : nom de case avec une balise HTML, affiché comme du texte** (Limite, Majeur).
- **CONV-66 : modèle inactif** (Erreur, Majeur).
- **CONV-67 : pendant la génération, boutons, Échap et champs verrouillés** (Limite, Majeur).

### Voir la convention

- **CONV-68 : ouverture réussie dans un nouvel onglet** (Nominal, Bloquant, fumée).
- **CONV-69 : échec (réseau coupé), alerte dans le bloc** (Erreur, Majeur).

### Persistance

- **CONV-70 : après rechargement, état Générée, « Voir » et fenêtre préremplie** (Persistance, Majeur).

### Droits (vrais comptes, pas « Voir en tant que »)

- **CONV-71 : FT Régional génère et ouvre le PDF** (Droits, Bloquant, fumée).
- **CONV-72 : FT Départemental génère et ouvre le PDF** (Droits, Bloquant).

### Mobile et accessibilité

- **CONV-73 : clavier, ordre des trois boutons du pied, Entrée** (Majeur).
- **CONV-74 : VoiceOver, annonce de l'attente** (Majeur).
- **CONV-75 : VoiceOver, annonce de la réussite** (Majeur).
- **CONV-76 : VoiceOver, messages d'erreur de champ** (Majeur).
- **CONV-77 : VoiceOver, annonce d'un échec de génération** (Majeur).
- **CONV-78 : zoom 200 %, rien de coupé dans la fenêtre** (Majeur).
- **CONV-79 : mobile (375 px), pied de la fenêtre et message de réussite** (Majeur).

## Tests de fumée de R4 (3 sur 36)

- CONV-44 : un PDF se génère et s'enregistre pour Du stade vers l'emploi.
- CONV-68 : « Voir la convention » ouvre le PDF.
- CONV-71 : un vrai compte FT Régional génère et ouvre le PDF.

Au total, avec R1 et R2 : 8 tests de fumée sur 79 cas (CONV-01, 03, 08, 19, 30, 44, 68, 71).

## Ordre conseillé pour jouer

1. D'abord les cas qui ne modifient rien : CONV-44 à CONV-49, 53 à 60, 67 à 70, 73 à 76, 78 et 79.
2. Ensuite les cas avec blocage réseau : CONV-61, 62, 77 (puis retirer le blocage).
3. Les vrais comptes : CONV-71 et CONV-72, à tout moment.
4. Dans DEV7 (pas sur TEST) : les cas qui modifient un modèle, CONV-50 à 52, puis 63 à 66.
5. Dans DEV7 : remettre les modèles en état, recharger, rejouer CONV-44, 45 et 46 pour prouver la remise en état.

## Cas déjà couverts par un test en code

`Automatisable = Oui` pour CONV-44 à CONV-69 (fiches C36, C37, C40, C42, C43, C46, C48, C49), `Non` pour CONV-70 à CONV-79 (rechargement, droits, lecteur d'écran, clavier, zoom, mobile). Cela ne remplace pas l'essai à l'écran : le test en code prouve la logique, pas le rendu du PDF dans le navigateur ni les droits dans Grist. Les fichiers de test sont cités dans la colonne `Remarques`, mais **les noms exacts des tests n'ont pas été relus** (contrairement à R2).

## Après une correction

Rejouer le cas concerné, puis ses voisins (génération par dispositif : CONV-44 à CONV-48 ; logos : CONV-49 à CONV-52 ; contrôle des champs : CONV-53 à CONV-60 ; échecs : CONV-61 à CONV-67 ; « Voir » : CONV-68 et CONV-69), et rappeler à Hanta de relancer toute la suite automatique (npm test).

## Rejouer en PROD

Seuls CONV-68 et CONV-69 se rejouent en PROD (sur une vraie convention déjà générée) : ils ne font que regarder. Tous les autres génèrent un fichier, écrivent dans `Conventions` ou modifient un modèle : TEST seulement.

## [À CONFIRMER] de R4

1. **Modèles officiels dans TEST** : non vérifié (le recetteur n'a pas accès à TEST). Les colonnes exactes de `Modeles_convention` (celle du texte, `Logo`, `Logo_partenaire`), les cases réellement présentes dans le texte de chaque modèle (le SIRET de l'agence pour Du stade vers l'emploi et l'adresse de l'agence pour les deux autres sont pris dans la demande, pas relus dans les modèles), les intitulés des colonnes de signature de Parcours de remobilisation (la note ne les donne pas) et le séparateur de l'adresse « sur une ligne » sont à relever par le testeur.
2. **Comptes réels** pour CONV-71 et CONV-72 : quel compte FT Régional et quel compte FT Départemental, tous deux éditeurs et non propriétaires, avec profil complet ? Aucun compte n'est inventé ici.
3. **Façon de provoquer les échecs de modèle** (CONV-63 à 66) : y a-t-il un seul modèle par dispositif (donc modification du vrai modèle) ? Le widget relit-il `Modeles_convention` au clic (nécessaire pour CONV-66) ou seulement au chargement de la page ? Si seulement au chargement, CONV-66 n'est pas jouable à l'écran (Non applicable). Quelle est la colonne du texte du modèle ?
4. **CONV-65** : le widget reconnaît-il une case dont le nom contient des chevrons ? Sinon, essayer un autre nom ou noter Non applicable.
5. **CONV-56** : la note dit que le focus va sur « le premier champ à corriger ». Quand le seul champ en erreur est « Fonction du signataire » (lecture seule), où va le focus ? Noter l'endroit constaté.
6. **Adresses à bloquer dans l'onglet Réseau** (CONV-61, 62, 69) : « pdfmake », début de l'adresse d'envoi, « download » sont des hypothèses à confirmer en regardant l'onglet Réseau (sans copier le jeton).
7. **Compte du testeur « National »** : même question qu'en R1 et R2 (vrai profil FT National, ou propriétaire du document ?).
8. **CONV-50** : l'alerte de succès (verte) pour un message qui demande de vérifier le modèle est un point ouvert de la fiche C48 (variante d'alerte d'information à confirmer dans le design system). Ne pas noter KO pour la couleur seule.
9. **Tests en code** : les noms exacts des tests, non relus, sont à ajouter dans la colonne `Remarques` si on veut la même précision qu'en R2.
