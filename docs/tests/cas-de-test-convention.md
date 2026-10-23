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
