# Recette de la convention : parcours à jouer

Document de recette de la fonction **Convention** du tableau de bord (génération d'une convention en document Word, dépôt de la convention signée, téléchargement).

- **Environnement** : TEST.
- **Profil** : FT National.
- **Données** : uniquement des données fictives, déjà présentes dans TEST. Aucune donnée n'est à créer.
- **Fichier à joindre** : « convention-signee-fictive-test.pdf » (fictif, sans donnée personnelle). Il sert aux parcours P-04 et P-05 et doit être joint à ce document quand il est transmis au testeur.
- **Fichier de suivi** : `cas-de-test-convention.tsv` (même contenu, à ouvrir dans un tableur).

Avant de commencer, noter : version testée, nom du testeur, date.

## Ce qu'il faut savoir en une minute

Les lignes sont rangées en trois catégories :

1. **Déjà joué** par Jean-Louis, résultat « Bon » : ne pas rejouer.
2. **Déjà vérifié** par Hanta le 07/11/2026 : ne pas rejouer.
3. **À jouer par le testeur** : 7 parcours courts (P-01 à P-07), ceux qui comptent. Chacun raconte une situation réelle d'agent de terrain.

Pour chaque parcours : suivre les étapes, comparer avec le résultat attendu, puis noter **OK**, **KO**, **Bloqué** ou **Non testé**. En cas de KO : décrire ce qui s'est passé et joindre une capture d'écran.

## 1. Les 7 parcours à jouer

Jouer dans l'ordre : P-01, P-02 et P-03 s'enchaînent sur la même action ; P-04 et P-06 s'enchaînent aussi sur une même action (P-06 se joue immédiatement après P-04). P-05 est indépendant : il se joue sur une autre action.

### P-01 : Générer une convention en Word (majeur)

**Avant de commencer** : Profil FT National. Action ESSAI-CONV-B4 (à l'état « À générer »).

**Étapes**

1. Ouvrir le tableau de bord et chercher l'action ESSAI-CONV-B4.
1. Ouvrir sa fiche et descendre au bloc Convention.
1. Cliquer sur « Générer la convention ».
1. Dans « Signataire », choisir « Alex Martin-Exemple ».
1. Dans « Représentant », saisir « Dominique Exemple ».
1. Cliquer sur « Générer la convention » en bas de la fenêtre.

**Données** : ESSAI-CONV-B4 : action à l'état « À générer », bouton « Générer la convention » actif. Le testeur génère lui-même la toute première convention Word de cette action.

**Résultat attendu** : La fenêtre se ferme. Le bloc affiche « Convention générée le [date du jour]. » puis « Format : document Word (.docx). », sans autre phrase d'aide. Trois boutons : « Télécharger la convention », « Re-générer » et « Déposer la convention signée ». Il n'y a pas de bouton « Voir la convention ».

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-02 : Télécharger la convention et l'ouvrir dans Word (bloquant)

**Avant de commencer** : Suite de P-01 (même action).

**Étapes**

1. Cliquer sur « Télécharger la convention ».
1. Ouvrir le fichier téléchargé dans Word.
1. Lire le document en entier.

**Données** : Document de ESSAI-CONV-B4.

**Résultat attendu** : Le fichier se télécharge avec une extension .docx et un nom qui contient le type de convention, le club et l'année. Il s'ouvre dans Word. On y lit : Club Exemple, son SIRET et son adresse, Alex Martin-Exemple, Dominique Exemple, l'agence et l'année. Aucune partie entre crochets ne reste dans le texte.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-03 : Compléter à la main les zones vides (majeur)

**Avant de commencer** : Suite de P-02 (document ouvert dans Word).

**Étapes**

1. Repérer les zones à compléter : « Fait à… », les dates de signature et les autres espaces à remplir.
1. Taper un texte dans l'une de ces zones.
1. Regarder la couleur de ces zones.

**Données** : Document de ESSAI-CONV-B4.

**Résultat attendu** : Toutes les zones vides sont de simples pointillés, sans surlignage ni couleur de fond. On peut écrire dessus directement dans Word, ou les laisser en pointillés pour les remplir au stylo après impression.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-04 : Déposer une convention signée sur une action jamais générée (bloquant)

**Avant de commencer** : Profil FT National. Action ESSAI-CONV-R1 (à l'état « À générer »). Le fichier « convention-signee-fictive-test.pdf », joint à ce document.

**Étapes**

1. Ouvrir la fiche de ESSAI-CONV-R1, bloc Convention.
1. Repérer le bouton « Déposer la convention signée ».
1. Cliquer dessus et choisir le fichier « convention-signee-fictive-test.pdf ».
1. Lire le bloc.

**Données** : ESSAI-CONV-R1 : aucune convention générée.

**Résultat attendu** : Le bouton « Déposer la convention signée » est visible avant toute génération, sans phrase d'aide. Après le choix du fichier, le message « Convention signée enregistrée. » apparaît et le bloc affiche « Convention signée, déposée le [date du jour]. ». L'action est maintenant à l'état « Signée ».

**À savoir** : P-06 se joue juste après ce parcours, sur la même action.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-06 : Consulter la convention signée qui vient d'être déposée (bloquant)

**Attention : P-06 dépend de P-04.** Il se joue immédiatement après P-04, dans le même ordre, sur la même action. Ne pas le jouer seul.

**Avant de commencer** : Profil FT National. P-04 joué juste avant, sur la même action ESSAI-CONV-R1, maintenant à l'état « Signée ».

**Étapes**

1. Rester sur la fiche de ESSAI-CONV-R1, bloc Convention.
1. Cliquer sur « Voir la convention signée ».
1. Regarder la pop-up.
1. Cliquer sur « Télécharger » dans la pop-up.
1. Fermer la pop-up.

**Données** : ESSAI-CONV-R1 : fichier « convention-signee-fictive-test.pdf » déposé à l'étape précédente (P-04).

**Résultat attendu** : Le fichier signé s'affiche dans une pop-up en plein écran. « Télécharger » enregistre le fichier signé. La pop-up se ferme et on revient à la fiche.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-05 : Déposer une convention signée sur une action sans modèle (majeur)

**Avant de commencer** : Profil FT National. Action ESSAI-CONV-A4 (dispositif « Aller vers », sans modèle de convention). Le fichier « convention-signee-fictive-test.pdf », joint à ce document.

**Étapes**

1. Ouvrir la fiche de ESSAI-CONV-A4, bloc Convention.
1. Repérer le bouton « Déposer la convention signée ».
1. Cliquer dessus et choisir le fichier « convention-signee-fictive-test.pdf ».
1. Lire le bloc.

**Données** : ESSAI-CONV-A4 : dispositif « Aller vers », aucun modèle de convention, aucune convention générée.

**Résultat attendu** : Le bouton « Déposer la convention signée » est visible malgré l'absence de modèle. Après le choix du fichier, le dépôt réussit : le message « Convention signée enregistrée. » apparaît et le bloc affiche « Convention signée, déposée le [date du jour]. ». L'action est maintenant à l'état « Signée ».

**À savoir** : ce parcours est indépendant des autres. Après ce test, l'action reste à l'état « Signée ».

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

### P-07 : Télécharger une ancienne convention au format PDF (bloquant)

**Avant de commencer** : Profil FT National. Action ESSAI-CONV-A5 (convention générée avec un ancien PDF).

**Étapes**

1. Ouvrir la fiche de ESSAI-CONV-A5, bloc Convention.
1. Lire la phrase d'état.
1. Cliquer sur « Télécharger la convention ».
1. Relire le bloc : la ligne de format est apparue.
1. Ouvrir le fichier téléchargé.

**Données** : ESSAI-CONV-A5 : convention déjà générée, avec un ancien PDF.

**Résultat attendu** : Le bloc affiche « Convention générée le [date]. ». Après le clic, la ligne « Format : document PDF (.pdf). » apparaît. Le fichier se télécharge avec l'extension .pdf et s'ouvre normalement. Le téléchargement fonctionne donc aussi bien pour une ancienne convention PDF que pour une nouvelle convention Word.

| Résultat (OK / KO / Bloqué / Non testé) | Testeur | Date | Remarque |
| --- | --- | --- | --- |
|  |  |  |  |

## 2. Déjà vérifié par Hanta, 07/11/2026 (ne pas rejouer)

| ID | Ce qui a été vérifié | Résultat constaté |
| --- | --- | --- |
| V-01 | Pop-up « Voir la convention signée » | La convention signée s'ouvre en pop-up plein écran, sans bande visible autour. |
| V-02 | Nom du fichier téléchargé | Le fichier téléchargé porte le bon nom (type de convention, club, année). |
| V-03 | Bouton « Ajouter un contact » dans la fenêtre de génération | Le bouton fonctionne. |
| V-04 | Fenêtre de génération sur écran étroit | La fenêtre passe sur une seule colonne en dessous de 1100 px de large. |
| V-05 | Document Word généré, ouvert dans Word | Titre, logos, police Arial, marges et bloc de signatures corrects. |
| V-06 | Haut du bloc Convention | Plus d'espace vide en haut du bloc. |
| V-07 | Phrase d'état à « Générée » | Phrase courte : « Convention générée le [date]. » |
| V-08 | Ligne de format | La ligne « Format : document Word (.docx). » est présente. |

## 3. Déjà joué par Jean-Louis, résultat « Bon » (ne pas rejouer)

Ces cas ont été joués avant les dernières évolutions de l'écran (génération en Word, nouvelle fenêtre, nouveau texte du bloc). Le résultat reste acquis. Pour CONV-01, 02, 05, 21, 33, 41, 44 et 45, l'écran testé n'existe plus : seul le résultat est gardé, et les points qui ont changé sont repris dans les parcours de la section 1. Pour les autres, le détail (étapes, données, résultat attendu) est dans le fichier `cas-de-test-convention.tsv`.

| ID | Sujet | Criticité | Joué par | Résultat |
| --- | --- | --- | --- | --- |
| CONV-01 | Bloc Convention : aucune convention générée (FT National) | Bloquant | Jean-Louis le 02/11/2026 | Bon |
| CONV-02 | Bloc Convention : convention générée avec date (FT National) | Bloquant | Jean-Louis le 02/11/2026 | Bon |
| CONV-03 | Afficher le bloc Convention (FT National) | Bloquant | Jean-Louis le 02/11/2026 | Bon |
| CONV-04 | Afficher le bloc Convention (FT National) | Majeur | Jean-Louis le 02/11/2026 | Bon |
| CONV-05 | Bloc Convention : convention générée sans date (FT National) | Majeur | Jean-Louis le 02/11/2026 | Bon |
| CONV-06 | Afficher le bloc Convention (FT National) | Majeur | Jean-Louis le 02/11/2026 | Bon |
| CONV-12 | Afficher le bloc Convention (FT National) | Majeur | Jean-Louis le 02/11/2026 | Bon |
| CONV-14 | Afficher le bloc Convention (FT National) | Majeur | Jean-Louis le 02/11/2026 | Bon |
| CONV-15 | Afficher le bloc Convention (FT National) | Mineur | Jean-Louis le 02/11/2026 | Bon |
| CONV-20 | Fenêtre et enregistrement de la convention (FT National) | Majeur | Jean-Louis | Bon |
| CONV-21 | Fenêtre de génération : modèle utilisé (FT National) | Majeur | Jean-Louis | Bon |
| CONV-33 | Enregistrement des informations du signataire (FT National) | Majeur | Jean-Louis | Bon |
| CONV-34 | Fenêtre et enregistrement de la convention (FT Régional) | Bloquant | Jean-Louis | Bon |
| CONV-41 | Fenêtre de génération avec lecteur d'écran (FT National) | Majeur | Jean-Louis | Bon |
| CONV-42 | Fenêtre et enregistrement de la convention (FT National) | Majeur | Jean-Louis | Bon |
| CONV-43 | Fenêtre et enregistrement de la convention (FT National) | Majeur | Jean-Louis | Bon |
| CONV-44 | Génération complète d'une convention (Du stade vers l'emploi) (FT National) | Bloquant | Jean-Louis | Bon |
| CONV-45 | Génération complète d'une convention (Match des métiers) (FT National) | Bloquant | Jean-Louis | Bon |
