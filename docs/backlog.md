# Backlog — Widgets Grist — Partenariat simplifié

| Priorité | Tâche | Agent | Statut |
| --- | --- | --- | --- |
| Haute | clubs : gérer les contacts dans la fiche du club (ajouter, modifier, supprimer avec confirmation), chacun sur son périmètre ; règle d'accès à créer sur Contacts | auditeur-securite, designer-ux, dev-backend, dev-interface, testeur | Fait (en production le 2026-10-23) |
| Haute | Convention de partenariat : voir le plan ci-dessous | voir le plan | En cours (S7) |
| Moyenne | clubs : filtres Région → Département dépendants, sur le modèle des filtres DR → DD → agence du tableau de bord (remarqué le 21/10/2026) | relecteur, testeur, dev-interface | À faire |
| Moyenne | tableau de bord : requestTableColumns (choix de Statut, Public, Format) demande un jeton en lecture seule ; pour un propriétaire, Grist refuse probablement et le widget se rabat sur la liste de secours (constat du 2026-10-24, fiche C41) | relecteur, puis dev-backend, testeur | À faire |
| Moyenne | tableau de bord : mode sombre ; le tableau de bord est en color-scheme: light, alors que tout widget doit fonctionner en mode sombre (règle de Hanta, à écrire dans CLAUDE.md et dans la squad de base) | designer-ux, dev-interface, testeur | À faire |
| Basse | tableau de bord : espacement du bloc Convention (-16px écrit en dur, espace en trop au-dessus du texte, zone de message vide toujours présente) | dev-interface | À faire |
| Basse | clubs : corriger les commentaires de src/clubs/ qui parlent encore de fiche-club | dev-interface | À faire |
| Basse | squad : les agents lancent des commandes de lecture (grep, ls, git status) malgré la consigne ; décider de les autoriser explicitement ou de les interdire dans leurs fichiers | Hanta | À décider |

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

**Décisions du 2026-10-23 et du 2026-10-24 :**

- Tâche 4.2 : bloc sans aucun bouton ni message de blocage. Boutons et message de blocage arrivent en 5.1a.
- Date vide : « Convention générée. » et « Convention signée. », sans date (textes ajoutés, à reporter dans la note UX en 10.2).
- Q-H : Échap et « Fermer » ferment directement la fenêtre, sans confirmation (option A).
- « Enregistrer les informations » est un brouillon : il garde ce qui est saisi, même incomplet ; seule l'année est contrôlée (« Saisissez une année à quatre chiffres. »). Les champs obligatoires sont contrôlés par « Générer ».
- D-3 : les six messages de blocage de « Générer » sont validés et s'affichent tous à la fois. Ne jamais associer help-block et invalid-feedback (bug C30).
- D-4 : l'année est préremplie avec l'année en cours. D-5 : le message « Renseignez le dispositif… » reste dans le code, mais ne s'affiche jamais en pratique. D-6 : le message d'erreur de l'année disparaît au clic suivant sur « Enregistrer ».
- D-S7-1 : PDF_genere et Date_generation écrits en une seule requête (PATCH REST, comme le logo de clubs ; applyUserActions est refusé à un non-propriétaire pour une pièce jointe neuve, fiche C39).
- D-S7-2 : Échap et « Fermer » ignorés pendant la génération. D-S7-4 : informations enregistrées avant la fabrication du PDF. D-S7-5 : attente en texte seulement. D-S7-6 : focus sur « Voir la convention » après une réussite. D-S7-7 : champs non modifiables pendant la génération.
- D-S7-3 (Q-E) : nom du fichier « Convention-[dispositif]-[club]-[année].pdf », sans année pour Remobilisation ; noms courts Stade-emploi, Match-metiers, Remobilisation.
- Cases du modèle : liste officielle de 10 cases dans la note UX (section « Cases du modèle ») ; les deux apostrophes (' et ’) sont acceptées ; une case connue mais vide devient des pointillés (28 points) ; une case inconnue bloque, avec son nom.
- pdfmake 0.3.3 depuis cdnjs, empreintes SRI vérifiées le 2026-10-23, chargé au clic, délai de 20 secondes.
- « Voir la convention » utilise le jeton d'écriture : un jeton en lecture seule fait passer le propriétaire au niveau lecteur, refusé par les règles par défaut (fiche C41).
- Recette : « Voir en tant que » ne simule pas l'utilisateur pour les jetons du widget (génération, « Voir », dépôt). Ces cas se jouent avec un vrai compte non propriétaire (éditeur, profil complet dans Utilisateurs : Profil, DR ou DT).

**Vrais textes des modèles :**

- Logo en en-tête (République française et France Travail).
- Numéros de page.
- Bloc de signature à deux colonnes.
- Une note de bas de page (Du stade vers l'emploi et Match des Métiers).
- Un saut de page (Parcours de remobilisation).
- Aucun tableau.

**Widget fiche-club retiré :** partout où le plan cite `src/fiche-club/`, lire `src/clubs/`. Le `console.info` du jeton est supprimé de clubs dans main (fusion #5). Main a été ramené dans la branche `feature/convention` (tâche 0.4, faite) : `src/fiche-club/` est retiré et `src/clubs/script.js` ne contient plus ce `console.info`.

## Structure Grist (créée dans DEV7 et dans TEST, à créer dans PROD)

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
| 1.1 | **Fait (DEV7, puis TEST par le script).** Vérifier que `Contacts.Fonction` est remplie pour 2 contacts d'essai.                                            | Hanta             | Aucun                | Colonne visible et remplie.                                                                  |
| 1.2 | **Fait (DEV7, puis TEST par le script).** Créer `Modeles_convention` avec 3 lignes factices (texte d'essai court, jamais le vrai).                         | Hanta             | Aucun                | Table visible, `Dispositif` bien relié.                                                   |
| 1.3 | **Fait (DEV7, puis TEST par le script).** Créer `Conventions` avec `DR` et `DD`.                                                                       | Hanta             | Aucun                | Table vide, `DR` et `DD` calculées sur une ligne d'essai.                               |
| 1.4 | **Fait (DEV7, puis TEST par le script).** Poser les règles d'accès du tableau ci-dessus (National, Régional, Départemental ; ANS et anonyme sans accès). | Hanta             | Aucun                | « Voir en tant que » pour chaque profil, y compris ANS = rien. Notes sans nom de document. |
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

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 4.1 | **Fait (commit e47240b). Note validée le 2026-10-22.** | designer-ux | `docs/ux/convention.md` | Note à jour. |
| 4.2 | **Fait (fiche C24).** Bloc en bas de la fiche, 5 états, textes de la note, sans bouton. | dev-interface | `src/actions-dashboard/script.js`, `style.css` | Tests de 4.3. |
| 4.3 | **Fait (fiche C25).** 27 tests. | testeur | `test/convention-bloc.test.js` | Textes des 5 états, dates, classes, place du bloc. |
| R1 | **Jouée en local (campagne C01, DEV7, version 7e951b4, fiche C26) : 15 cas OK.** À rejouer sur TEST par un autre développeur (campagne C03). | recetteur, puis Hanta | `docs/tests/cas-de-test-convention.*`, carnet | Droits insuffisants : non jouable à l'écran, couvert par les tests de 4.3. |

### S5. Fonction B : fenêtre « Convention » et informations enregistrées

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 5.1a | **Fait (fiche C27).** Bouton du bloc, grisé avec son message de blocage ; fenêtre en lecture seule ; fermeture par Fermer et Échap. | dev-interface | `src/actions-dashboard/` | Tests de 5.3a. |
| 5.3a | **Fait (fiche C28).** 26 tests, 4 mis à jour. | testeur | `test/convention-fenetre.test.js` | Bouton, blocage, fenêtre, focus. |
| 5.1b | **Fait (fiches C29 à C32).** Trois blocs, signataires, représentant, fonction préremplie, contrôle de l'année ; bug du message d'erreur toujours visible corrigé (C30). | dev-interface | `src/actions-dashboard/` | Tests de 5.3b. |
| 5.2 | **Fait (fiche C33).** Enregistrement dans Conventions (une opération, mise à jour ou création), préremplissage à la réouverture. | dev-backend | `src/actions-dashboard/script.js` | Tests de 5.3b. |
| 5.3b | **Fait (fiches C31, C34).** Tests de 5.1b et 5.2. | testeur | `test/convention-fenetre.test.js`, `test/convention-enregistrement.test.js` | Champs, année, brouillon, création, mise à jour, doublon, refus, réouverture. |
| R2 | **Cas écrits (28 cas, CONV-16 à 43). Campagne C02 en local : 13 cas vérifiés pendant les contrôles à l'écran, les autres à jouer.** À rejouer sur TEST par un autre développeur (C03). | recetteur, puis Hanta | `docs/tests/cas-de-test-convention.*`, carnet | Refus d'écriture : non jouable à l'écran, couvert par les tests de C34. |

S6 supprimée le 2026-10-22 : pas d'ajout de contact dans la convention. La numérotation S7 à S10 est gardée.

### S7. Fonction D : générer le PDF et le voir

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 7.0 | **Fait.** Note UX complétée pour la génération ; décisions D-3 et D-S7-1 à D-S7-7 ; liste officielle des cases. | designer-ux, Hanta | `docs/ux/convention.md` | Note à jour. |
| 7.1 | **Fait (fiche C35).** Chargement de pdfmake 0.3.3 au clic, empreintes SRI. | dev-backend | `src/actions-dashboard/script.js` | Tests de 7.3. |
| 7.2 | **Fait (fiches C36, C37).** conventionGenerer : contrôle, enregistrement, modèle, cases, pdfmake (20 s), PDF, envoi, rattachement, neuf codes d'erreur ; cases officielles. | dev-backend | `src/actions-dashboard/script.js` | Tests de 7.3. |
| 7.2b | **Fait (fiches C38 à C40).** Bouton « Générer la convention » dans la fenêtre, attente, messages, focus ; rattachement par PATCH REST (C39). | dev-interface, dev-backend | `src/actions-dashboard/` | Tests de 7.3. |
| 7.3 | **En partie.** Fait : rattachement (11 tests, C39), écran du bouton (26 tests, C40), cases (C37). Reste : chargement de pdfmake (ordre, empreintes, un seul chargement, nouvel essai, délai de 20 s), nom du fichier, contrôle des champs, codes d'erreur de conventionGenerer. | testeur | `test/convention-generation.test.js` | Jeton jamais dans la console, échec à chaque étape, « À générer » conservé. |
| 7.4 | **Fait (fiche C41).** « Voir la convention » : onglet au clic, adresse blob:, jeton d'écriture (bug du propriétaire corrigé). | dev-interface | `src/actions-dashboard/script.js` | Tests de 7.5. |
| 7.5 | **Fait (fiche C42).** 14 tests, 6 mis à jour. | testeur | `test/convention-voir.test.js` | Texte caché, aucun jeton avant le clic, échecs. |
| 7.6 | Réglage sur un PDF imprimé (faux texte) : pointillés (28 points), mise en page, saut de page, signatures, place des notes (Q-A). Logo : attend Q-C. | Hanta | Aucun | Elle écrit à la main dans chaque zone sans être gênée. |
| R4 | Recette de la fonction D, avec un vrai compte non propriétaire (jamais seulement « Voir en tant que »). | recetteur | `docs/tests/` | PDF généré et ouvert pour chaque modèle ; cases correctes ; chaque message de blocage ; propriétaire et FT Régional. Le texte réel n'est pas recopié dans le compte rendu. |

Vérifié dans DEV7 le 2026-10-24 : génération et « Voir » en propriétaire et avec un vrai compte FT Régional (non propriétaire).

### S8. Fonction E : re-générer

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 8.0 | Note UX de la re-génération, et deux décisions : le modèle enregistré (celui de la génération ou le modèle actif) ; l'ancien PDF (Grist supprime-t-il un fichier qu'aucune cellule n'utilise ?). | designer-ux, Hanta | `docs/ux/convention.md` | Note à jour. |
| 8.1 | « Re-générer » : fenêtre préremplie, nouveau PDF qui remplace l'ancien, date mise à jour. | dev-interface, dev-backend | `src/actions-dashboard/` | Tests de 8.2. |
| 8.2 | Tests de 8.1. | testeur | `test/convention-generation.test.js` | Un seul fichier après re-génération, informations préremplies, échec = l'ancien PDF reste. |
| R5 | Recette de la fonction E, avec un vrai compte non propriétaire. | recetteur | `docs/tests/` | La liste des pièces jointes ne contient qu'un fichier. |

### S9. Fonction F : déposer et remplacer le fichier signé

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 9.0 | Note UX du dépôt (designer-ux avant dev-interface). | designer-ux | `docs/ux/convention.md` | Note à jour. |
| 9.1 | Dépôt : choix du fichier, contrôle dans l'ordre vide → taille (10 Mo) → extension .pdf → type application/pdf → début %PDF-, envoi, rattachement par PATCH REST (comme C39), date, confirmation. | dev-backend, dev-interface | `src/actions-dashboard/` | Tests de 9.2. |
| 9.2 | Tests de 9.1. | testeur | `test/convention-depot.test.js` (nouveau) | Fichier non PDF refusé sans rien écrire, remplacement du signé, état « Signée » après dépôt, échec d'envoi. |
| R6 | Recette de la fonction F, avec un vrai compte non propriétaire. | recetteur | `docs/tests/` | Essai avec un vrai PDF, un fichier non PDF, un profil sans droit d'écriture. |

### S10. Clôture

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 10.1 | Examen de sécurité final : jeton (écriture pour « Voir » et le rattachement), pdfmake et empreintes, règles d'accès (ANS sans accès), contenu de `actions-dashboard.html` (aucun texte de modèle, aucun secret). | auditeur-securite | Aucun | Rapport sans point bloquant. |
| 10.2 | Documentation : README (section Convention, tables lues et écrites, données personnelles), carnet de tests, note UX alignée sur le code (textes « date vide », message de l'alerte d'année), CLAUDE.md (règle du mode sombre, recette avec un vrai compte non propriétaire). | documentaliste | `README.md`, `docs/tests/`, `docs/ux/convention.md`, `CLAUDE.md` | Relecture par Hanta : aucun nom de document Grist, aucune adresse réelle. |
| R7 | Recette complète sur TEST : générer, voir, re-générer, déposer, remplacer, pour chaque profil et chaque modèle, avec de vrais comptes. | recetteur | `docs/tests/` | Compte rendu final. |
| 10.3 | Structure dans PROD (dont `Structures.Ville`, `Conventions`, `Modeles_convention`, règles d'accès) avant la fusion. Journal des évolutions dans DEV2 ; fusion dans main seulement sur accord de Hanta. | Hanta | Aucun | Page publiée vérifiée après fusion. |

## Questions encore ouvertes

- **Q-A** : notes de bas de page. Aujourd'hui, elles sont regroupées à la fin du document (pdfmake ne gère pas les vraies notes de bas de page). À faire valider par le client : fin de l'article ou fin du document.
- **Q-B** : une action en corbeille ou annulée garde-t-elle sa convention ? La génération est-elle interdite pour ces statuts ?
- **Q-C** : d'où viennent les fichiers du logo (République française, France Travail) et comment les embarquer sans alourdir le dépôt public ? Le PDF sort sans logo en attendant.
- **Q-F** : garder `Modele_version` ? Une branche par tâche ou par fonction ?
- **Q-G** : qui corrige l'adresse d'une agence dans Agences ?
- **Q-I** (S8) : quel modèle enregistrer lors d'une re-génération : celui de la génération ou le modèle actif ?
- **Q-J** (S8) : que devient l'ancien PDF, et un fichier envoyé mais non rattaché (échec du PATCH) ? Grist supprime-t-il les fichiers qu'aucune cellule n'utilise ?

Questions réglées : Q-D (10 Mo, tâche 0.3), Q-E (D-S7-3), Q-H (option A).

## Risques

- Fuite entre régions ou pour l'ANS si une règle est mal posée : tâches 1.4 et 1.5.
- Recette faussée par « Voir en tant que » pour tout ce qui passe par un jeton : toujours un vrai compte non propriétaire.
- Structure ou modèles absents de TEST ou de PROD : un modèle avec une case hors de la liste officielle bloque la génération.
- Script externe pdfmake : version figée et empreintes SRI ; une mise à jour demande de recalculer les empreintes.
- Doublons de `Conventions.Action` : Grist n'impose pas l'unicité, le widget garde la plus ancienne ligne.
- `script.js` dépasse 3000 lignes : les tests existants doivent rester verts à chaque tâche.
- Pointillés et mise en page : réglage seulement sur papier (7.6).
- Dépôt public : aucun texte de modèle, aucun secret, aucune donnée réelle.
- Données personnelles : nom, prénom, fonction du signataire, signatures sur le PDF signé. Durée de conservation à traiter dans la démarche RGPD globale.
