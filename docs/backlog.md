
# Backlog — Widgets Grist — Partenariat simplifié

| Priorité | Tâche                                                                                                                                                                  | Agent                                                               | Statut   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| Haute     | clubs : gérer les contacts dans la fiche du club (ajouter, modifier, supprimer avec confirmation), chacun sur son périmètre ; règle d'accès à créer sur Contacts | auditeur-securite, designer-ux, dev-backend, dev-interface, testeur | Fait (en production le 2026-10-23) |
| Moyenne   | clubs : filtres Région → Département dépendants, sur le modèle des filtres DR → DD → agence du tableau de bord (remarqué le 21/10/2026)                         | relecteur, testeur, dev-interface                                   | À faire |
| Basse     | clubs : corriger les commentaires de src/clubs/ qui parlent encore de fiche-club (à faire pendant la gestion des contacts)                                             | dev-interface                                                       | À faire |

---

# Convention de partenariat (PDF + dépôt du fichier signé) — plan du chef-de-projet

Branche de travail actuelle : `feature/convention`. Note de référence : `docs/ux/convention.md` (validée le 2026-10-22). Elle l'emporte sur `docs/ux/maquette-convention.html`, qui n'est plus à jour.

Règles du plan :

- Une tâche = un agent = un objectif, vérifiable en moins de 15 minutes.
- Le recetteur passe à la fin de chaque fonction terminée (lignes R1, R2, R4, R5, R6, R7), pas seulement à la fin.
- `npm run build`, `npm test` et `git status` sont lancés par Hanta. Un test est « passé » seulement quand Hanta donne le résultat affiché.
- Après chaque build, `git status` ne doit montrer que `actions-dashboard.html` (en plus des fichiers source modifiés par la tâche).
- Tout le code de la convention va dans `src/actions-dashboard/script.js`, `index.html` et `style.css` (build.js n'assemble qu'un script et une feuille par widget).
- Les noms de tables et de colonnes marqués « proposé » sont à créer ; les autres existent (voir « Réponses intégrées »).

## Réponses intégrées (décisions de Hanta)

**Colonnes existantes dans Grist DEV :**

- `Contacts.Fonction`.
- `Agences.Adresse`, `Complement_adresse`, `Code_postal`, `Ville`.
- `Structures.Siege` contient Oui ou Non (ce n'est pas une adresse). L'adresse du club vient de `Structures.Adresse` (Text), `Structures.Code_postal` et `Structures.Ville`.
- `Structures.Ville` : colonne formule créée dans DEV7 le 2026-10-22. À créer dans TEST, puis dans PROD avant la fusion.
- `Actions.DR` et `Actions.DD`, en colonnes formule.
- `Conventions.Date_generation` et `Conventions.Date_depot` : vérifiées dans DEV7 le 2026-10-23.

**Règles d'accès actuelles d'Actions :**

- FT Régional : `rec.DR == user.Utilisateur.DR`.
- FT Départemental : `rec.DD == user.Utilisateur.DT`.

**Qui fait quoi :**

- FT National, FT Régional et FT Départemental génèrent, re-génèrent et déposent les conventions, chacun dans son périmètre.
- ANS : aucun accès aux conventions ni aux modèles. L'ANS ne voit pas le tableau de bord.
- Le widget ne lit pas le profil de l'utilisateur : tout utilisateur qui voit le tableau de bord mais à qui Grist refuse les tables de convention voit l'état « Droits insuffisants ».

**Génération bloquée** avec un message qui dit quoi remplir, s'il manque l'agence, le club, le dispositif ou l'adresse du club. Message pour l'adresse : « Renseignez l'adresse du club dans sa fiche. » Le blocage porte sur les données enregistrées. Textes exacts : `docs/ux/convention.md`.

**Décisions du 2026-10-22 :**

- Pointillés : de vrais points tapés dans le texte du modèle.
- Pas d'ajout de contact dans la convention (S6 supprimée). Si le club n'a aucun contact, un message le dit (texte dans la note UX).
- Tout profil refusé par Grist voit « Droits insuffisants » (le widget ne lit pas le profil).
- La note `docs/ux/convention.md` l'emporte sur la maquette HTML.

**Décisions du 2026-10-23 :**

- Tâche 4.2 : bloc sans aucun bouton ni message de blocage. Boutons et message de blocage arrivent en 5.1.
- Date vide : « Convention générée. » et « Convention signée. », sans date (textes ajoutés, à reporter dans la note UX en 10.2).

**Vrais textes des modèles :**

- Logo en en-tête (République française et France Travail).
- Numéros de page.
- Bloc de signature à deux colonnes.
- Une note de bas de page (Du stade vers l'emploi et Match des Métiers).
- Un saut de page (Parcours de remobilisation).
- Aucun tableau.

**Widget fiche-club retiré :** partout où le plan cite `src/fiche-club/`, lire `src/clubs/`. Le `console.info` du jeton est supprimé de clubs dans main (fusion #5). Main a été ramené dans la branche `feature/convention` (tâche 0.4, faite) : `src/fiche-club/` est retiré et `src/clubs/script.js` ne contient plus ce `console.info`.

## Structure Grist proposée (à créer)

**Table `Modeles_convention`** (proposé, 3 lignes) :

- `Code`, texte : `STADE_EMPLOI`, `MATCH_METIERS` ou `REMOBILISATION`.
- `Titre`, texte.
- `Dispositif`, lien vers Dispositifs.
- `Avec_annee`, oui/non.
- `Contenu`, texte long.
- `Version`, texte.
- `Actif`, oui/non.

**Table `Conventions`** (proposé, une ligne par action) :

- `Action`, lien vers Actions.
- `Modele`, lien vers `Modeles_convention`.
- `Annee`, entier (vide pour Remobilisation).
- `Signataire_club`, lien vers Contacts.
- `Representant_agence`, texte.
- `Fonction_representant`, texte (préremplie « Directeur d'agence »).
- `PDF_genere`, pièces jointes.
- `Date_generation`, date et heure.
- `PDF_signe`, pièces jointes.
- `Date_depot`, date et heure.
- `DR` et `DD`, colonnes formule (`$Action.DR`, `$Action.DD`) pour les règles d'accès.
- `Modele_version`, texte : non demandé, à ajouter seulement si Hanta le veut.

**État du bloc, déduit des données :**

- `PDF_signe` rempli : Signée.
- Sinon `PDF_genere` rempli : Générée.
- Sinon, si le dispositif a un modèle : À générer.
- Sinon : Dispositif sans modèle.
- Tables de convention refusées par Grist : Droits insuffisants, avec un message dédié.

**Règles d'accès proposées :**

| Table                  | Propriétaires | FT National            | FT Régional                                               | FT Départemental                                          | ANS   | Anonyme |
| ---------------------- | -------------- | ---------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- | ----- | ------- |
| `Conventions`        | tout           | lire, créer, modifier | `rec.DR == user.Utilisateur.DR` : lire, créer, modifier | `rec.DD == user.Utilisateur.DT` : lire, créer, modifier | aucun | aucun   |
| `Modeles_convention` | tout           | lire                   | lire                                                       | lire                                                       | aucun | aucun   |

- Personne ne supprime, sauf les propriétaires à la main.
- Terminer par « tous les autres : aucun accès ».
- Contacts : la convention lit seulement la table (choix du signataire), elle n'y écrit pas. Les droits de création restent ceux décidés pour le widget clubs.
- À tester avec « Voir en tant que » : un Régional ne télécharge pas le PDF d'une autre région.

## Format du texte des modèles (colonne `Contenu`)

Le texte se lit ligne par ligne.

| Élément                          | Écriture                                                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre du document                  | `# …`                                                                                                                                                            |
| Titre d'article                    | `## …`                                                                                                                                                           |
| Sous-titre                         | `### …`                                                                                                                                                          |
| Paragraphe                         | une ligne vide sépare deux paragraphes                                                                                                                             |
| Gras                               | `**texte**`                                                                                                                                                       |
| Liste à puces                     | `- …`                                                                                                                                                            |
| Liste numérotée                  | `1. …`                                                                                                                                                           |
| Note de bas de page                | `[^1]` dans le texte, `[^1]: texte` sur une ligne à part                                                                                                       |
| Case remplie par le widget         | `[Nom de la case]`                                                                                                                                                |
| Pointillés                        | de vrais points tapés dans le texte (.......), imprimés tels quels ; pas de repère {...} (décision du 2026-10-22)                                               |
| Crochet littéral                  | `\[`                                                                                                                                                              |
| Saut de page                       | une ligne `{saut-de-page}`                                                                                                                                        |
| Bloc de signature à deux colonnes | une ligne {signatures}, ou {signatures:lieu-date} avec « À ……, le …… » en tête de chaque colonne ; club à gauche, agence à droite, remplis par les cases. |

- Case inconnue : la génération est bloquée, la case fautive est nommée.
- Le logo en en-tête et les numéros de page ne sont pas dans le texte : ils sont ajoutés par le widget.
- Il n'y a pas de tableau.
- Les notes de bas de page : voir la question ouverte Q-A.

## Tâches

### S0. Décisions et vérifications

| N° | Tâche                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Agent                             | Fichiers                            | Ce qui est testé / vérifié                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| 0.1 | Réponses de Hanta intégrées dans ce plan. Rester à trancher : Q-A, Q-B (voir ci-dessous).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Hanta                             | `docs/backlog.md`                 | Les réponses sont écrites ici.                                                      |
| 0.2 | **Fait.** Vérifier dans le code du tableau de bord : lit-il `Structures.Siege` ou `Adresse` ? Quelles colonnes d'Agences sont lues ? Lister les écarts avec Grist DEV. Note : la table Structures n'a pas d'adresse dans `Siege` (`Siege` contient Oui ou Non). Une colonne `Adresse` (Text) existe en PROD et a été recréée à l'identique dans DEV7 ; le widget clubs la lit déjà (`structure.Adresse`). Mise à jour du 2026-10-22 : la ville vient de la colonne formule `Structures.Ville`.                                                                                                                                                                                                                               | auditeur-securite (lecture seule) | `src/actions-dashboard/script.js` | Liste « lu aujourd'hui / à ajouter » pour Structures, Agences, Contacts.           |
| 0.3 | **Fait.** Examen de sécurité de pdfmake : version à figer, cdnjs, empreinte SRI, chargement au clic, polices, poids. Examen de l'envoi : jeton jamais en console, jeton lu au clic pour « Voir ». Décisions : PDF signé de 10 Mo au maximum ; « Voir » ouvre le PDF depuis la mémoire du navigateur (adresse `blob:`), sans jeton dans une adresse visible ; contrôle du fichier signé dans l'ordre vide → taille → extension `.pdf` → type `application/pdf` → début `%PDF-` ; pdfmake chargé au clic, version figée et empreinte SRI (version actuelle sur cdnjs : 0.3.3, fichiers `pdfmake.min.js` et `fonts/Roboto.min.js`, à vérifier en S7). `DT` est bien le nom de la colonne de la DD dans Utilisateurs. | auditeur-securite                 | Aucun fichier modifié              | Rapport avec une décision par point. La version proposée est citée avec sa source. |
| 0.4 | **Fait.** Mettre la branche `feature/convention` à jour avec main (retrait de fiche-club, `console.info` du jeton supprimé de clubs). Main ramené dans la branche (fusion faite) ; fiche-club retiré et `console.info` du jeton supprimé de clubs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Hanta                             | Aucun fichier de widget             | `git status` propre ; le jeton n'apparaît plus dans `src/clubs/script.js`.       |

### S1. Grist (Hanta, dans Grist DEV)

| N° | Tâche                                                                                                              | Agent             | Fichiers             | Ce qui est vérifié                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| 1.1 | Vérifier que `Contacts.Fonction` est remplie pour 2 contacts d'essai.                                            | Hanta             | Aucun                | Colonne visible et remplie.                                                                  |
| 1.2 | Créer `Modeles_convention` avec 3 lignes factices (texte d'essai court, jamais le vrai).                         | Hanta             | Aucun                | Table visible, `Dispositif` bien relié.                                                   |
| 1.3 | Créer `Conventions` avec `DR` et `DD`.                                                                       | Hanta             | Aucun                | Table vide, `DR` et `DD` calculées sur une ligne d'essai.                               |
| 1.4 | Poser les règles d'accès du tableau ci-dessus (National, Régional, Départemental ; ANS et anonyme sans accès). | Hanta             | Aucun                | « Voir en tant que » pour chaque profil, y compris ANS = rien. Notes sans nom de document. |
| 1.5 | Relecture des règles posées : pas de fuite entre régions ni pour l'ANS, pièces jointes, table Contacts.         | auditeur-securite | Aucun                | Rapport sans fuite.                                                                          |
| 1.6 | Remplir plus tard les vrais textes des modèles.                                                                    | Hanta             | Aucun (hors dépôt) | Les 3 modèles réels sont dans Grist, rien dans le dépôt.                                 |

### S2. Du texte du modèle au PDF (sans écran)

| N° | Tâche                                                                                                                                                                                                                                                                                                                 | Agent       | Fichiers                                     | Ce qui est testé                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Analyse du texte en blocs : titres (#, ##, ### ou ligne en gras), paragraphes, retrait (>), listes à puces et numérotées, gras, italique, souligné, exposant, liens (texte puis adresse), appels et textes de note (rangés à la fin, provisoire). Fonction pure conventionVersContenuPdf. Fait (commit ccc3dcd). | dev-backend | `src/actions-dashboard/script.js`          | Tests de 2.2.                                                                                                                                         |
| 2.2 | Tests de 2.1. Fait (commits af85b34 et 2198a5b).                                                                                                                                                                                                                                                                       | testeur     | `test/convention-modele.test.js` (nouveau) | 22 tests : titres, retrait, listes, gras, italique, souligné, exposant, commentaire vide, lien, cases, pointillés, note, texte vide.                |
| 2.3 | Cases et pointillés : remplacement, refus d'une case inconnue (nommée), longueur des pointillés. Fait.                                                                                                                                                                                                              | dev-backend | `src/actions-dashboard/script.js`          | Tests de 2.4.                                                                                                                                         |
| 2.4 | Tests de 2.3. Fait.                                                                                                                                                                                                                                                                                                    | testeur     | `test/convention-modele.test.js`           | Case inconnue, `\[`, nom de club avec caractères spéciaux.                                                                                        |
| 2.5 | Description du PDF pour pdfmake : logo en en-tête, numéros de page, placement des notes, saut de page ({saut-de-page}) et bloc de signature à deux colonnes ({signatures}), marqueurs proposés dans « Format du texte des modèles ». Fonction pure, sans appel à pdfmake. Fait.                                | dev-backend | `src/actions-dashboard/script.js`          | Tests de 2.6.                                                                                                                                         |
| 2.6 | Tests de 2.5. Fait.                                                                                                                                                                                                                                                                                                    | testeur     | `test/convention-modele.test.js`           | Note citée mais non définie, définie mais non citée, numérotation, en-tête et pied de page présents, saut de page, deux colonnes de signature. |

### S3. Lire les données (sans écran visible)

| N° | Tâche                                                                                                                                                                                           | Agent       | Fichiers                                                                  | Ce qui est testé                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | **Fait.** Lire `Contacts`, `Conventions`, `Modeles_convention` (ajout à `TABLES`). Une table refusée = liste vide (`state.tablesRefusees`).                                    | dev-backend | `src/actions-dashboard/script.js`                                       | Tests de 3.2.                                                                                                                                       |
| 3.2 | **Fait.** Tests de 3.1.                                                                                                                                                                    | testeur     | `test/convention-donnees.test.js` (nouveau), `test/helpers/widget.js` | Chaque table lue, chaque table refusée sans planter.                                                                                               |
| 3.3 | **Fait.** État du bloc : À générer, Générée, Signée, Sans modèle, Droits insuffisants. Blocage s'il manque agence, club, dispositif ou adresse du club, avec le champ à remplir. | dev-backend | `src/actions-dashboard/script.js`                                       | Tests de 3.4.                                                                                                                                       |
| 3.4 | **Fait.** Tests de 3.3.                                                                                                                                                                    | testeur     | `test/convention-donnees.test.js`                                       | Les 5 états, Signée l'emporte sur Générée, deux lignes pour la même action (on garde la plus ancienne), message nommant l'élément manquant. |

### S4. Fonction A : afficher le bloc « Convention »

| N° | Tâche                                                                                                                                                                                                | Agent         | Fichiers                                           | Ce qui est testé                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | **Fait (commit e47240b). Note validée le 2026-10-22.** Relire la note UX et la corriger selon les réponses (National, ANS, blocage). La note passe avant le HTML.                             | designer-ux   | `docs/ux/convention.md`                          | Note à jour.                                                                                                                                                                                                                                                                                     |
| 4.2 | **Fait (fiche C24).** Bloc en bas de la fiche, 5 états, textes de la note. Aucun bouton ni message de blocage (décision du 2026-10-23). Classes `convention-fields` et `convention-aide`. | dev-interface | `src/actions-dashboard/script.js`, `style.css` | Tests de 4.3. Vu à l'écran dans DEV7 : À générer et Sans modèle.                                                                                                                                                                                                                            |
| 4.3 | **Fait (fiche C25).** Tests de 4.2 : 27 tests.                                                                                                                                                  | testeur       | `test/convention-bloc.test.js` (nouveau)         | Texte des 5 états, date en jour/mois/année, date vide, Signée l'emporte, aucun élément cliquable, aucun message de blocage, classes, place du bloc dans la fiche.                                                                                                                            |
| R1  | Recette de la fonction A. Prérequis : structure dans TEST (`Conventions`, `Modeles_convention`, `Structures.Ville`, règles d'accès) et lignes d'essai fictives dans `Conventions`.         | recetteur     | `docs/tests/` (carnet)                           | Pour National, Régional, Départemental, dans leur périmètre : À générer, Générée (date en français), Signée, Sans modèle. Droits insuffisants : non jouable à l'écran (l'ANS ne voit pas le tableau de bord), couvert par les tests de 4.3. Clavier, lecteur d'écran, zoom 200 %. |

### S5. Fonction B : fenêtre « Convention » et informations enregistrées

| N° | Tâche                                                                                                                                                                                                                                                                                  | Agent         | Fichiers                                                           | Ce qui est testé                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Boutons du bloc et message de blocage (reportés de 4.2, voir la note UX). Fenêtre : 3 blocs, informations club et agence en lecture seule, liste des signataires (message si le club n'a aucun contact), représentant, fonction préremplie, validation. Pas encore de génération. | dev-interface | `src/actions-dashboard/index.html`, `script.js`, `style.css` | Tests de 5.3.                                                                                                                                                                                              |
| 5.2 | Enregistrer les informations dans `Conventions` (création ou mise à jour de la ligne de l'action).                                                                                                                                                                                  | dev-backend   | `src/actions-dashboard/script.js`                                | Tests de 5.3.                                                                                                                                                                                              |
| 5.3 | Tests de 5.1 et 5.2.                                                                                                                                                                                                                                                                    | testeur       | `test/convention-fenetre.test.js` (nouveau)                      | Boutons selon l'état, message de blocage relié au bouton, champs obligatoires, Année absente pour Remobilisation, club sans contact, écriture refusée = message d'erreur, une seule ligne par action. |
| R2  | Recette de la fonction B.                                                                                                                                                                                                                                                               | recetteur     | `docs/tests/`                                                    | Informations enregistrées et relues à la réouverture ; message de blocage pour chaque élément manquant ; un profil sans droit d'écriture voit l'erreur prévue.                                      |

S6 supprimée le 2026-10-22 : pas d'ajout de contact dans la convention. Message si le club n'a aucun contact (voir docs/ux/convention.md). La numérotation S7 à S10 est gardée.

### S7. Fonction D : générer le PDF et le voir

| N° | Tâche                                                                                                                                                                                                                                                        | Agent         | Fichiers                                                                     | Ce qui est testé                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Charger pdfmake au clic sur « Générer » (version figée, SRI si 0.3 l'accepte), erreur claire si le chargement échoue.                                                                                                                                   | dev-backend   | `src/actions-dashboard/script.js`                                          | Tests de 7.3, avec doublure de pdfmake.                                                                                                                                                                                     |
| 7.2 | Génération : lire le modèle, remplir, fabriquer le PDF, l'envoyer (méthode de `src/clubs/` : jeton dans l'adresse, `credentials 'omit'`, en-tête `X-Requested-With`, sans trace du jeton), l'attacher par l'API REST, écrire `Date_generation`. | dev-backend   | `src/actions-dashboard/script.js`                                          | Tests de 7.3.                                                                                                                                                                                                               |
| 7.3 | Tests de 7.1 et 7.2.                                                                                                                                                                                                                                          | testeur       | `test/convention-generation.test.js` (nouveau), `test/helpers/widget.js` | Jeton jamais dans la console (test explicite), échec à chaque étape, état « À générer » conservé en cas d'échec.                                                                                                 |
| 7.4 | « Voir la convention » : ouverture dans un nouvel onglet, jeton lu au clic.                                                                                                                                                                                 | dev-interface | `src/actions-dashboard/index.html`, `script.js`                          | Tests de 7.5.                                                                                                                                                                                                               |
| 7.5 | Tests de 7.4.                                                                                                                                                                                                                                                 | testeur       | `test/convention-generation.test.js`                                       | Texte caché « nouvel onglet », aucun jeton dans la page avant le clic.                                                                                                                                                   |
| 7.6 | Réglage des pointillés, du logo et de la mise en page sur un PDF imprimé (faux texte).                                                                                                                                                                     | Hanta         | Aucun                                                                        | Elle écrit à la main dans chaque zone sans être gênée ; logo, numéros de page et saut de page corrects.                                                                                                               |
| R4  | Recette de la fonction D.                                                                                                                                                                                                                                     | recetteur     | `docs/tests/`                                                              | Un PDF est généré et s'ouvre pour chaque modèle ; cases correctes ; génération bloquée avec message s'il manque agence, club, dispositif ou adresse du club. Le texte réel n'est pas recopié dans le compte rendu. |

### S8. Fonction E : re-générer

| N° | Tâche                                                                                           | Agent                      | Fichiers                                            | Ce qui est testé                                                                               |
| --- | ------------------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 8.1 | « Re-générer » : fenêtre préremplie, nouveau PDF qui remplace l'ancien, date mise à jour. | dev-interface, dev-backend | `src/actions-dashboard/index.html`, `script.js` | Tests de 8.2.                                                                                   |
| 8.2 | Tests de 8.1.                                                                                    | testeur                    | `test/convention-generation.test.js`              | Un seul fichier après re-génération, informations préremplies, échec = l'ancien PDF reste. |
| R5  | Recette de la fonction E.                                                                        | recetteur                  | `docs/tests/`                                     | La liste des pièces jointes ne contient qu'un fichier.                                         |

### S9. Fonction F : déposer et remplacer le fichier signé

| N° | Tâche                                                                                                  | Agent                      | Fichiers                                            | Ce qui est testé                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 9.1 | Dépôt : choix du fichier, contrôle PDF (type et extension), envoi, rattachement, date, confirmation. | dev-backend, dev-interface | `src/actions-dashboard/index.html`, `script.js` | Tests de 9.2.                                                                                                          |
| 9.2 | Tests de 9.1.                                                                                           | testeur                    | `test/convention-depot.test.js` (nouveau)         | Fichier non PDF refusé sans rien écrire, remplacement du signé, état « Signée » après dépôt, échec d'envoi. |
| R6  | Recette de la fonction F.                                                                               | recetteur                  | `docs/tests/`                                     | Essai avec un vrai PDF, un fichier non PDF, un profil sans droit d'écriture.                                          |

### S10. Clôture

| N°  | Tâche                                                                                                                                                                                                                                           | Agent             | Fichiers                                                                                 | Ce qui est testé                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 10.1 | Examen de sécurité final : jeton, pdfmake, règles d'accès (ANS sans accès), contenu de `actions-dashboard.html` (aucun texte de modèle, aucun secret).                                                                                   | auditeur-securite | Aucun                                                                                    | Rapport sans point bloquant.                                               |
| 10.2 | Documentation : README (section Convention, tables lues et écrites, données personnelles nom, prénom, fonction), carnet de tests, note UX alignée sur le code (dont les textes « date vide »), mention dans CLAUDE.md si Hanta le décide. | documentaliste    | `README.md`, `docs/tests/`, `docs/ux/convention.md`, éventuellement `CLAUDE.md` | Relecture par Hanta : aucun nom de document Grist, aucune adresse réelle. |
| R7   | Recette complète : générer, voir, re-générer, déposer, remplacer, pour chaque profil et chaque modèle.                                                                                                                                    | recetteur         | `docs/tests/`                                                                          | Compte rendu final.                                                        |
| 10.3 | Structure dans PROD (dont `Structures.Ville`, `Conventions`, `Modeles_convention`, règles d'accès) avant la fusion. Journal des évolutions dans DEV2 ; fusion dans main seulement sur accord de Hanta.                                  | Hanta             | Aucun                                                                                    | Page publiée vérifiée après fusion.                                    |

## Questions encore ouvertes

- **Q-A** : note de bas de page regroupée à la fin de l'article, au lieu du bas de page (pdfmake ne gère pas les vraies notes de bas de page). À faire valider par le client.
- **Q-B** : une action en corbeille ou annulée garde-t-elle sa convention ? La génération est-elle interdite pour ces statuts ?
- **Q-C** : d'où viennent les fichiers du logo (République française, France Travail) et comment les embarquer sans alourdir le dépôt public ?
- **Q-D** : taille maximale du PDF signé.
- **Q-E** : nom du fichier téléchargé (proposé : nom du club et année, jamais un nom de personne).
- **Q-F** : garder `Modele_version` ? Une branche par tâche ou par fonction ?
- **Q-G** : qui corrige l'adresse d'une agence dans Agences ?
- **Q-H** (pour le chef) : demander une confirmation avant de fermer la fenêtre « Convention » avec Échap si des champs ont été remplis (note UX, §7) ?

## Risques

- Colonnes supposées dans le code (`Siege` ou `Adresse`) : tâche 0.2.
- Structure absente de TEST au moment de la recette, ou de PROD au moment de la fusion : prérequis de R1, tâche 10.3.
- Fuite entre régions ou pour l'ANS si une règle est mal posée : tâches 1.4 et 1.5.
- Droits d'écriture de Régional et Départemental sur `Conventions` : testés en R2.
- Script externe pdfmake (même risque que le bandeau) : tâche 0.3.
- Jeton dans l'adresse du lien « Voir » : tâche 0.3.
- Doublons de `Conventions.Action` : Grist n'impose pas l'unicité, le widget garde la plus ancienne ligne.
- `script.js` dépasse 1300 lignes : les tests existants doivent rester verts à chaque tâche.
- Pointillés, logo et saut de page : réglage seulement sur papier (7.6).
- Dépôt public : aucun texte de modèle, aucun secret, aucune donnée réelle.
- Données personnelles : nom, prénom, fonction du signataire, signatures sur le PDF signé. Durée de conservation à traiter dans la démarche RGPD globale.
