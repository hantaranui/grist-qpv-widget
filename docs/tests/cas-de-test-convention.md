# Cas de test : Convention, afficher le bloc Convention (R1)

**Brouillon écrit par le recetteur, corrigé après relecture de Hanta. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » tout en bas.
- Branche : `feature/convention`. Tâches 4.2 et 4.3 (fiches C24 et C25 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md` (elle fait foi). Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient les mêmes 15 cas, pour l'outil de suivi (18 colonnes).

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
