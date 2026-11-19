# Recette de l'export CSV des clubs et des contacts : parcours à jouer

Brouillon rédigé par le recetteur (Claude), à relire et valider par Hanta. Ce sont des tests proposés, pas des tests passés : seul un humain décide du résultat (OK, KO, Bloqué, Non testé, Non applicable).

Document de recette du bouton **« Exporter (CSV) »** de la page « Liste des clubs sportifs » (widget clubs) : menu « Liste des clubs » / « Contacts », fichiers téléchargés, droits par profil. Campagne C12.

- **Environnement** : TEST (document de test).
- **Profils** : FT National, FT Régional, FT Départemental (précisé dans chaque parcours).
- **Compte du testeur** : le collègue joue les parcours avec son propre compte. C'est Hanta qui change le profil de ce compte (FT National, FT Régional, FT Départemental) avant chaque parcours concerné.
- **Données** : uniquement des données fictives, déjà présentes dans TEST. Aucune donnée n'est à créer, modifier ou supprimer : cette fonction ne fait que lire.
- **Matériel** : Excel (ou un tableur) pour ouvrir les fichiers.
- **Modèle suivi** : `cas-de-test-statut-non-retenu.md` et `.tsv` (11 colonnes, séries V et P).
- **Fichier de suivi** : `cas-de-test-export-csv-clubs.tsv` (même contenu, à ouvrir dans un tableur). Si les deux diffèrent, le fichier .tsv fait foi.
- **Sources** : `docs/ux/export-csv-clubs.md` et les décisions E8-3 du Sprint E8 (`docs/backlog.md`).

Avant de commencer, noter : version testée (À remplir après la publication sur TEST), nom du testeur, date.

## Ce qu'il faut savoir en une minute

Les lignes sont rangées en deux catégories :

1. **Déjà vérifié** par Hanta à l'écran dans Grist DEV le 19/11/2026 : EXP-V-01 à EXP-V-10, tous OK. Ne pas rejouer.
2. **À jouer par le testeur** dans le document TEST : 7 parcours (EXP-P-01 à EXP-P-07). EXP-P-08 est déjà marqué Non applicable (voir ce parcours).

**Ce que fait la fonction** : en haut à droite de la page, le bouton « Exporter (CSV) » ouvre un menu à deux choix.

- « Liste des clubs » télécharge les clubs **affichés dans le tableau** (après les filtres Région, Département, Fédération, Club) : fichier `clubs-insertion-sport-AAAA-MM-JJ.csv`, colonnes SIRET, Nom, Adresse, Code postal, Ville.
- « Contacts » télécharge les contacts de ces mêmes clubs, **une ligne par contact** : fichier `contacts-clubs-insertion-sport-AAAA-MM-JJ.csv`, colonnes SIRET, Nom du club, Nom, Prénom, Fonction, E-mail, Téléphone. Un club sans contact a **une ligne** avec son SIRET et son nom, les cinq champs du contact étant vides.
- AAAA-MM-JJ est la date du jour de l'ordinateur.
- Chaque profil ne voit que son périmètre : c'est Grist qui décide, pas le widget.
- Si le navigateur a déjà un fichier du même nom, il ajoute un numéro, par exemple « (1) » : c'est normal.

Pour chaque parcours : suivre les étapes, comparer avec le résultat attendu, puis noter **OK**, **KO**, **Bloqué**, **Non testé** ou **Non applicable**. En cas de KO : décrire ce qui s'est passé et joindre une capture d'écran.

La colonne « Validé par » reste vide au premier passage. Elle sert seulement à noter qui confirme ou corrige un résultat après coup (par exemple quand Hanta revient sur un cas marqué « À revoir »).

## 1. Les 8 parcours (7 à jouer, 1 Non applicable)

Les parcours sont indépendants, sauf EXP-P-08, qui reprend le fichier produit en EXP-P-02. Aucun ne modifie des données. Avant chaque parcours qui dépend d'un profil, Hanta règle le profil du compte du collègue.

### EXP-P-01 : Exporter les clubs avec plusieurs filtres combinés (bloquant)

**Avant de commencer** : Profil FT National (Hanta change le profil du compte du collègue avant ce parcours). Excel ou un tableur.

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs ».
1. Dans les filtres, choisir une Région, puis un Département de cette région, puis une Fédération qui a des clubs dans ce département. Si le tableau est vide, élargir un filtre.
1. Compter les clubs du tableau, et noter le nom du premier et du dernier.
1. Cliquer sur « Exporter (CSV) », puis sur « Liste des clubs ».
1. Ouvrir le fichier téléchargé dans Excel (double-clic).
1. Comparer le fichier avec le tableau.

**Données** : filtres choisis librement par le testeur parmi les valeurs proposées.

**Résultat attendu** : Le fichier s'appelle `clubs-insertion-sport-AAAA-MM-JJ.csv`, avec la date du jour. Le menu s'est fermé après le choix. Dans Excel, les colonnes sont séparées et dans cet ordre : SIRET, Nom, Adresse, Code postal, Ville. Les accents s'affichent correctement. Il y a autant de lignes de clubs que de clubs dans le tableau, les mêmes, dans le même ordre (le premier et le dernier notés à l'étape 3 sont aux mêmes places). Aucun club hors des filtres n'apparaît. Les SIRET s'affichent avec leurs 14 chiffres (pas de notation scientifique du type 1,23E+13). Un code postal qui commence par 0 garde son 0.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-02 : Exporter les contacts, une ligne par contact (bloquant)

**Avant de commencer** : Profil FT National (Hanta change le profil du compte du collègue avant ce parcours). Excel ou un tableur. Repérer, parmi les clubs affichés, un club qui a au moins deux contacts et un club sans contact (la fiche du club, bouton « Voir », montre « Aucun contact enregistré pour ce club. »).

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs » et régler un filtre (par exemple une Région) qui laisse affichés ces deux clubs.
1. Ouvrir la fiche du club qui a plusieurs contacts (bouton « Voir »). Noter le nombre de contacts et leur ordre. Revenir à la liste, puis vérifier que le filtre est toujours réglé (sinon le refaire).
1. Cliquer sur « Exporter (CSV) », puis sur « Contacts ».
1. Ouvrir le fichier téléchargé dans Excel.
1. Chercher le club à plusieurs contacts, puis le club sans contact.

**Données** : un club à plusieurs contacts et un club sans contact, choisis par le testeur dans TEST.

**Résultat attendu** : Le fichier s'appelle `contacts-clubs-insertion-sport-AAAA-MM-JJ.csv`, avec la date du jour. Les colonnes sont, dans l'ordre : SIRET, Nom du club, Nom, Prénom, Fonction, E-mail, Téléphone. Le club à plusieurs contacts a autant de lignes que de contacts, dans l'ordre de la fiche (nom, puis prénom). Le club sans contact a **une seule ligne** : SIRET et nom du club remplis, Nom, Prénom, Fonction, E-mail et Téléphone vides. Les téléphones gardent leur 0 de tête. Aucun club hors filtre n'apparaît.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-03 : Profil FT Régional : seulement sa région (bloquant)

**Avant de commencer** : Profil FT Régional : le testeur joue avec son propre compte, et Hanta change le profil de ce compte en FT Régional avant ce parcours. Excel ou un tableur.

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs » avec ce profil, sans aucun filtre.
1. Ouvrir le filtre « Région » et regarder les régions proposées. Regarder les clubs du tableau.
1. Cliquer sur « Exporter (CSV) », puis sur « Liste des clubs ». Ouvrir le fichier.
1. Cliquer sur « Exporter (CSV) », puis sur « Contacts ». Ouvrir le fichier.

**Données** : aucune.

**Résultat attendu** : Le tableau et le filtre « Région » ne montrent que la région de ce profil. Le fichier « Liste des clubs » contient autant de lignes que de clubs du tableau, aucun club d'une autre région. Le fichier « Contacts » ne contient que les contacts de ces clubs. La ligne « Contacts » du menu est active (pas grisée) et aucun message de droits n'apparaît.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-04 : Profil FT Départemental : seulement son département (bloquant)

**Avant de commencer** : Profil FT Départemental : le testeur joue avec son propre compte, et Hanta change le profil de ce compte en FT Départemental avant ce parcours. Excel ou un tableur.

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs » avec ce profil, sans aucun filtre.
1. Ouvrir le filtre « Département » et regarder les départements proposés. Regarder les clubs du tableau.
1. Cliquer sur « Exporter (CSV) », puis sur « Liste des clubs ». Ouvrir le fichier.
1. Cliquer sur « Exporter (CSV) », puis sur « Contacts ». Ouvrir le fichier.

**Données** : aucune.

**Résultat attendu** : Le tableau et le filtre « Département » ne montrent que le périmètre de ce profil. Le fichier « Liste des clubs » contient autant de lignes que de clubs du tableau, aucun club d'un autre département. Le fichier « Contacts » ne contient que les contacts de ces clubs. La ligne « Contacts » est active et aucun message de droits n'apparaît.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-05 : Aucun club affiché (majeur)

**Avant de commencer** : Profil FT National (Hanta change le profil du compte du collègue avant ce parcours).

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs ».
1. Combiner des filtres jusqu'à ce que le texte « Aucun club ne correspond aux filtres. » s'affiche sous le tableau. Si aucune combinaison ne donne un tableau vide avec les listes proposées, noter « Bloqué » et expliquer.
1. Cliquer sur « Exporter (CSV) ».
1. Avec le clavier, mettre le focus sur le bouton « Exporter (CSV) » (touche Tab) et appuyer sur Entrée.
1. Cliquer sur « Réinitialiser les filtres ».
1. Cliquer sur « Exporter (CSV) ».

**Données** : une combinaison de filtres sans résultat, choisie par le testeur.

**Résultat attendu** : Aux étapes 3 et 4, le bouton est grisé, le menu ne s'ouvre pas et aucun fichier n'est téléchargé. À l'étape 5, les clubs réapparaissent. À l'étape 6, le bouton est de nouveau actif et le menu s'ouvre avec « Liste des clubs » et « Contacts ».

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-06 : Utiliser l'export au clavier seul (majeur)

**Avant de commencer** : Profil FT National (Hanta change le profil du compte du collègue avant ce parcours). Ne pas utiliser la souris pendant le parcours.

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs ». Appuyer sur Tab jusqu'à ce que le bouton « Exporter (CSV) » soit entouré par le focus.
1. Appuyer sur Entrée.
1. Appuyer sur Tab : noter la ligne qui reçoit le focus, puis appuyer encore sur Tab.
1. Appuyer sur Échap.
1. Appuyer sur Entrée pour rouvrir le menu, Tab jusqu'à « Liste des clubs », puis Entrée.

**Données** : aucune.

**Résultat attendu** : À l'étape 1, le bouton a un focus bien visible et il est atteint avant les filtres. À l'étape 2, le menu s'ouvre. À l'étape 3, le focus passe sur « Liste des clubs », puis sur « Contacts ». À l'étape 4, le menu se ferme et le focus revient sur le bouton. À l'étape 5, le fichier `clubs-insertion-sport-AAAA-MM-JJ.csv` est téléchargé, le menu se ferme et le focus revient sur le bouton « Exporter (CSV) ».

**À savoir** : si Échap ne ferme pas le menu, c'est peut-être un défaut du composant du design system, pas du widget : noter KO et le signaler à Hanta.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-07 : Changer les filtres puis exporter de nouveau (majeur)

**Avant de commencer** : Profil FT National (Hanta change le profil du compte du collègue avant ce parcours). Excel ou un tableur.

**Étapes**

1. Ouvrir la page « Liste des clubs sportifs ». Choisir une Région.
1. Noter le nombre de clubs du tableau. Exporter « Liste des clubs » (fichier 1).
1. Ajouter un Département de cette région. Noter le nombre de clubs du tableau. Exporter « Liste des clubs » (fichier 2).
1. Cliquer sur « Réinitialiser les filtres ». Noter le nombre de clubs du tableau. Exporter « Liste des clubs » (fichier 3).
1. Ouvrir les trois fichiers et compter leurs lignes de clubs.

**Données** : filtres choisis librement par le testeur.

**Résultat attendu** : Chaque fichier correspond aux filtres réglés au moment du clic : même nombre de clubs que le tableau aux étapes 2, 3 et 4. Le fichier 2 ne contient que des clubs du fichier 1. Le fichier 3 contient tous les clubs affichés sans filtre. Le navigateur peut ajouter un numéro au nom des fichiers suivants : c'est normal.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### EXP-P-08 : Information : apostrophe devant un téléphone qui commence par « + » (mineur)

**Avant de commencer** : Profil FT National. Le fichier « Contacts » ouvert dans Excel (celui d'EXP-P-02). Ce parcours **ne doit pas** conduire à modifier une donnée de TEST.

**Étapes**

1. Dans le fichier « Contacts », regarder la colonne Téléphone.
1. Chercher un téléphone qui commence par « + » (par exemple un numéro international). Chercher aussi, dans toutes les colonnes, une valeur qui commence par « = », « - » ou « @ ».
1. Si l'on en trouve une, regarder comment Excel l'affiche.
1. Si aucune valeur de TEST ne commence par l'un de ces signes, noter « Non applicable » : ne rien créer ni modifier dans TEST pour provoquer le cas.

**Données** : valeurs déjà présentes dans TEST, s'il y en a.

**Résultat attendu** : Information, pas une anomalie. Une valeur qui commence par = + - @ s'affiche avec une apostrophe visible devant (par exemple '+33…). C'est une protection voulue : elle empêche Excel de lire la valeur comme une formule. Aucune cellule n'affiche d'erreur de formule. Les téléphones faits uniquement de chiffres n'ont pas d'apostrophe et gardent leur 0.

**Décision de Hanta** : Non applicable. Le document TEST ne contient aucune valeur commençant par = + - @, et on ne modifie pas ses données pour la recette. Le cas est gardé, couvert par les tests automatiques.

| Résultat (OK / KO / Bloqué / Non testé / Non applicable) | Testeur | Date | Validé par | Remarque |
| --- | --- | --- | --- | --- |
| Non applicable |  |  |  | Aucune valeur commençant par = + - @ dans TEST ; données non modifiées pour la recette (décision de Hanta). |

## 2. Déjà vérifié par Hanta, 19/11/2026 (ne pas rejouer)

Vérifié à l'écran dans Grist DEV. Profil de EXP-V-01 à EXP-V-08 : FT National. Résultat de chaque point : OK. Testeur : Hanta. « Validé par » est vide : aucun point n'a été revu après le premier passage.

| ID | Ce qui a été vérifié | Résultat constaté | Testeur | Validé par |
| --- | --- | --- | --- | --- |
| EXP-V-01 | Place et apparence du bouton | Le bouton « Exporter (CSV) » est à droite du titre, avec la même apparence qu'au tableau de bord. OK | Hanta |  |
| EXP-V-02 | Ouverture du menu | Le menu s'ouvre avec « Liste des clubs » et « Contacts », sans dépasser du widget. OK | Hanta |  |
| EXP-V-03 | Clavier | Tab atteint le bouton, Entrée ouvre le menu, Échap le ferme. OK | Hanta |  |
| EXP-V-04 | Export de la liste avec un filtre | Avec un filtre réglé, « Liste des clubs » télécharge le fichier daté et le menu se ferme. OK | Hanta |  |
| EXP-V-05 | Export des contacts | « Contacts » télécharge le fichier daté. OK | Hanta |  |
| EXP-V-06 | Ouverture dans Excel | Colonnes séparées, accents corrects, SIRET à 14 chiffres, téléphones et codes postaux avec leur 0, seuls les clubs filtrés ; un club sans contact = une ligne aux champs vides. OK | Hanta |  |
| EXP-V-07 | Export sans filtre | Tous les clubs sont exportés en un temps raisonnable. OK | Hanta |  |
| EXP-V-08 | Aucun club affiché | Le bouton est grisé et le menu ne s'ouvre pas ; il redevient actif quand on retire un filtre. OK | Hanta |  |
| EXP-V-09 | Profil FT Régional (compte de test éditeur) | Seuls les clubs et les contacts de sa région sont exportés. OK | Hanta |  |
| EXP-V-10 | Profil ANS (même compte) | « Contacts » est grisé avec « Vos droits ne permettent pas de lire les contacts. », aucun fichier n'est produit ; « Liste des clubs » fonctionne. OK | Hanta |  |

Remarque : EXP-V-09 et EXP-V-10 ont été joués dans DEV avec un compte de test éditeur. EXP-P-03 et EXP-P-04 les refont dans TEST, avec un autre testeur et les profils régional et départemental.

## À CONFIRMER

1. **Version testée** : À remplir après la publication sur TEST.
2. **Périmètre du profil FT Départemental dans TEST** : le périmètre attendu (« seulement son département ») est celui de la décision E8-3 ; à confirmer par le parcours EXP-P-04 lui-même, en notant ce qui s'affiche.
