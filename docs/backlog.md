# Backlog — Widgets Grist — Partenariat simplifié

| Priorité | Tâche | Agent | Statut |
|---|---|---|---|
| Haute | | | À faire |

---

# Convention de partenariat (PDF + dépôt du fichier signé) — plan du chef-de-projet

Branche de travail actuelle : `feature/convention`. Notes de référence : `docs/ux/convention.md` et `docs/ux/maquette-convention.html`.

Règles du plan :
- Une tâche = un agent = un objectif, vérifiable en moins de 15 minutes.
- Le recetteur passe à la fin de chaque fonction terminée (lignes R1 à R7), pas seulement à la fin.
- `npm run build`, `npm test` et `git status` sont lancés par Hanta. Un test est « passé » seulement quand Hanta donne le résultat affiché.
- Après chaque build, `git status` ne doit montrer que `actions-dashboard.html`.
- Tout le code de la convention va dans `src/actions-dashboard/script.js`, `index.html` et `style.css` (build.js n'assemble qu'un script et une feuille par widget).
- Les noms de tables et de colonnes marqués « proposé » sont à créer ; les autres existent (voir « Réponses intégrées »).

## Réponses intégrées (décisions de Hanta)

**Colonnes existantes dans Grist DEV :**
- `Contacts.Fonction`.
- `Agences.Adresse`, `Complement_adresse`, `Code_postal`, `Ville`.
- `Structures.Siege` et `Code_postal`. À vérifier dans le code en S0 : le tableau de bord lit peut-être `Adresse` au lieu de `Siege`.
- `Actions.DR` et `Actions.DD`, en colonnes formule.

**Règles d'accès actuelles d'Actions :**
- FT Régional : `rec.DR == user.Utilisateur.DR`.
- FT Départemental : `rec.DD == user.Utilisateur.DT`.

**Qui fait quoi :**
- FT National, FT Régional et FT Départemental génèrent, re-génèrent et déposent les conventions, chacun dans son périmètre.
- ANS : aucun accès aux conventions ni aux modèles.

**Génération bloquée** avec un message qui dit quoi remplir, s'il manque l'agence, le club ou le dispositif.

**Vrais textes des modèles :**
- Logo en en-tête (République française et France Travail).
- Numéros de page.
- Bloc de signature à deux colonnes.
- Une note de bas de page (Du stade vers l'emploi et Match des Métiers).
- Un saut de page (Parcours de remobilisation).
- Aucun tableau.

**Widget fiche-club retiré :** partout où le plan cite `src/fiche-club/`, lire `src/clubs/`. Le `console.info` du jeton est déjà supprimé de clubs dans main (fusion #5). Sur la branche `feature/convention`, `src/clubs/script.js` contient encore ce `console.info` (vers la ligne 1313) et `src/fiche-club/` existe encore. Il faut donc ramener main dans la branche avant de s'inspirer de ce code (tâche 0.4).

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
- Cas à part : modèles illisibles faute de droits, avec un message dédié.

**Règles d'accès proposées :**

| Table | Propriétaires | FT National | FT Régional | FT Départemental | ANS | Anonyme |
|---|---|---|---|---|---|---|
| `Conventions` | tout | lire, créer, modifier | `rec.DR == user.Utilisateur.DR` : lire, créer, modifier | `rec.DD == user.Utilisateur.DT` : lire, créer, modifier | aucun | aucun |
| `Modeles_convention` | tout | lire | lire | lire | aucun | aucun |

- Personne ne supprime, sauf les propriétaires à la main.
- Terminer par « tous les autres : aucun accès ».
- Contacts : Régional, Départemental et National doivent pouvoir créer un contact, et `Fonction` suit les règles de la table.
- À tester avec « Voir en tant que » : un Régional ne télécharge pas le PDF d'une autre région.

## Format du texte des modèles (colonne `Contenu`)

Le texte se lit ligne par ligne.

| Élément | Écriture |
|---|---|
| Titre du document | `# …` |
| Titre d'article | `## …` |
| Sous-titre | `### …` |
| Paragraphe | une ligne vide sépare deux paragraphes |
| Gras | `**texte**` |
| Liste à puces | `- …` |
| Liste numérotée | `1. …` |
| Note de bas de page | `[^1]` dans le texte, `[^1]: texte` sur une ligne à part |
| Case remplie par le widget | `[Nom de la case]` |
| Pointillés | `{...}`, `{...:40}` ou `{...:ligne}` |
| Crochet littéral | `\[` |
| Saut de page (proposé) | une ligne `{saut-de-page}` |
| Bloc de signature à deux colonnes (proposé) | une ligne `{signatures}` ; le contenu des deux colonnes vient des cases (club à gauche, agence à droite) |

- Case inconnue : la génération est bloquée, la case fautive est nommée.
- Le logo en en-tête et les numéros de page ne sont pas dans le texte : ils sont ajoutés par le widget.
- Il n'y a pas de tableau.
- Les notes de bas de page : voir la question ouverte Q-A.

## Tâches

### S0. Décisions et vérifications

| N° | Tâche | Agent | Fichiers | Ce qui est testé / vérifié |
|---|---|---|---|---|
| 0.1 | Réponses de Hanta intégrées dans ce plan. Rester à trancher : Q-A, Q-B (voir ci-dessous). | Hanta | `docs/backlog.md` | Les réponses sont écrites ici. |
| 0.2 | Vérifier dans le code du tableau de bord : lit-il `Structures.Siege` ou `Adresse` ? Quelles colonnes d'Agences sont lues ? Lister les écarts avec Grist DEV. | auditeur-securite (lecture seule) | `src/actions-dashboard/script.js` | Liste « lu aujourd'hui / à ajouter » pour Structures, Agences, Contacts. |
| 0.3 | Examen de sécurité de pdfmake : version à figer, cdnjs, empreinte SRI, chargement au clic, polices, poids. Examen de l'envoi : jeton jamais en console, jeton lu au clic pour « Voir ». | auditeur-securite | Aucun fichier modifié | Rapport avec une décision par point. La version proposée est citée avec sa source. |
| 0.4 | Mettre la branche `feature/convention` à jour avec main (retrait de fiche-club, `console.info` du jeton supprimé de clubs). | Hanta | Aucun fichier de widget | `git status` propre ; le jeton n'apparaît plus dans `src/clubs/script.js`. |

### S1. Grist (Hanta, dans Grist DEV)

| N° | Tâche | Agent | Fichiers | Ce qui est vérifié |
|---|---|---|---|---|
| 1.1 | Vérifier que `Contacts.Fonction` est remplie pour 2 contacts d'essai. | Hanta | Aucun | Colonne visible et remplie. |
| 1.2 | Créer `Modeles_convention` avec 3 lignes factices (texte d'essai court, jamais le vrai). | Hanta | Aucun | Table visible, `Dispositif` bien relié. |
| 1.3 | Créer `Conventions` avec `DR` et `DD`. | Hanta | Aucun | Table vide, `DR` et `DD` calculées sur une ligne d'essai. |
| 1.4 | Poser les règles d'accès du tableau ci-dessus (National, Régional, Départemental ; ANS et anonyme sans accès). | Hanta | Aucun | « Voir en tant que » pour chaque profil, y compris ANS = rien. Notes sans nom de document. |
| 1.5 | Relecture des règles posées : pas de fuite entre régions ni pour l'ANS, pièces jointes, table Contacts. | auditeur-securite | Aucun | Rapport sans fuite. |
| 1.6 | Remplir plus tard les vrais textes des modèles. | Hanta | Aucun (hors dépôt) | Les 3 modèles réels sont dans Grist, rien dans le dépôt. |

### S2. Du texte du modèle au PDF (sans écran)

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 2.1 | Analyse du texte en blocs (titres, paragraphes, listes, gras, saut de page, bloc de signatures). Fonction pure. | dev-backend | `src/actions-dashboard/script.js` | Tests de 2.2. |
| 2.2 | Tests de 2.1. | testeur | `test/convention-modele.test.js` (nouveau) | Titres, gras, listes, ligne vide, accents, saut de page, signatures. |
| 2.3 | Cases et pointillés : remplacement, refus d'une case inconnue (nommée), longueur des pointillés. | dev-backend | `src/actions-dashboard/script.js` | Tests de 2.4. |
| 2.4 | Tests de 2.3. | testeur | `test/convention-modele.test.js` | Case inconnue, `\[`, nom de club avec caractères spéciaux. |
| 2.5 | Note de bas de page et description du PDF pour pdfmake : logo en en-tête, numéros de page, bloc de signature à deux colonnes. Fonction pure, sans appel à pdfmake. | dev-backend | `src/actions-dashboard/script.js` | Tests de 2.6. |
| 2.6 | Tests de 2.5. | testeur | `test/convention-modele.test.js` | Note citée mais non définie, définie mais non citée, numérotation, en-tête et pied de page présents, deux colonnes de signature. |

### S3. Lire les données (sans écran visible)

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 3.1 | Lire `Contacts`, `Conventions`, `Modeles_convention` (ajout à `TABLES`). Une table refusée = liste vide. | dev-backend | `src/actions-dashboard/script.js` | Tests de 3.2. |
| 3.2 | Tests de 3.1. | testeur | `test/convention-donnees.test.js` (nouveau), `test/helpers/widget.js` | Chaque table lue, chaque table refusée sans planter. |
| 3.3 | État du bloc : À générer, Générée, Signée, Sans modèle, Droits insuffisants. Blocage s'il manque agence, club ou dispositif, avec le champ à remplir. | dev-backend | `src/actions-dashboard/script.js` | Tests de 3.4. |
| 3.4 | Tests de 3.3. | testeur | `test/convention-donnees.test.js` | Les 5 états, Signée l'emporte sur Générée, deux lignes pour la même action (on garde la plus ancienne), message nommant l'élément manquant. |

### S4. Fonction A : afficher le bloc « Convention »

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 4.1 | Relire la note UX et la corriger selon les réponses (National, ANS, blocage). La note passe avant le HTML. | designer-ux si disponible, sinon Hanta | `docs/ux/convention.md` | Note à jour. |
| 4.2 | Bloc dans la fiche (états 1 à 4, texte, sans bouton actif). Classes `convention-…`, jamais un nom du design system. | dev-interface | `src/actions-dashboard/index.html`, `script.js`, `style.css` | Tests de 4.3. |
| 4.3 | Tests de 4.2. | testeur | `test/render.test.js` ou nouveau test, `test/styles.test.js` | Texte de chaque état, aucun bouton si dispositif sans modèle, noms de classes. Après build, `git status` : seul `actions-dashboard.html` change. |
| R1 | Recette de la fonction A. | recetteur | `docs/tests/` (carnet) | Chaque état s'affiche, pour National, Régional, Départemental (ANS : pas de convention visible). Clavier, lecteur d'écran, zoom 200 %. |

### S5. Fonction B : fenêtre « Convention » et informations enregistrées

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 5.1 | Fenêtre : 3 blocs, informations club et agence en lecture seule, liste des signataires, représentant, fonction préremplie, validation. Pas encore de génération. | dev-interface | `src/actions-dashboard/index.html`, `script.js`, `style.css` | Tests de 5.3. |
| 5.2 | Enregistrer les informations dans `Conventions` (création ou mise à jour de la ligne de l'action). | dev-backend | `src/actions-dashboard/script.js` | Tests de 5.3. |
| 5.3 | Tests de 5.1 et 5.2. | testeur | `test/convention-fenetre.test.js` (nouveau) | Champs obligatoires, Année absente pour Remobilisation, écriture refusée = message d'erreur, une seule ligne par action. |
| R2 | Recette de la fonction B. | recetteur | `docs/tests/` | Informations enregistrées et relues à la réouverture ; un profil sans droit d'écriture voit l'erreur prévue. |

### S6. Fonction C : ajouter un contact

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 6.1 | Formulaire dans le bloc (nom, prénom, fonction), écriture dans `Contacts`, sélection du nouveau contact. Pas de formulaire imbriqué. | dev-interface, avec dev-backend pour l'écriture | `src/actions-dashboard/index.html`, `script.js`, `style.css` | Tests de 6.2. |
| 6.2 | Tests de 6.1. | testeur | `test/convention-fenetre.test.js` | Entrée valide le contact sans lancer la génération, annulation, erreur d'écriture. |
| R3 | Recette de la fonction C. | recetteur | `docs/tests/` | Le contact apparaît aussi dans le widget clubs, sans l'avoir modifié. |

### S7. Fonction D : générer le PDF et le voir

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 7.1 | Charger pdfmake au clic sur « Générer » (version figée, SRI si 0.3 l'accepte), erreur claire si le chargement échoue. | dev-backend | `src/actions-dashboard/script.js` | Tests de 7.3, avec doublure de pdfmake. |
| 7.2 | Génération : lire le modèle, remplir, fabriquer le PDF, l'envoyer (méthode de `src/clubs/` : jeton dans l'adresse, `credentials 'omit'`, en-tête `X-Requested-With`, sans trace du jeton), l'attacher par l'API REST, écrire `Date_generation`. | dev-backend | `src/actions-dashboard/script.js` | Tests de 7.3. |
| 7.3 | Tests de 7.1 et 7.2. | testeur | `test/convention-generation.test.js` (nouveau), `test/helpers/widget.js` | Jeton jamais dans la console (test explicite), échec à chaque étape, état « À générer » conservé en cas d'échec. |
| 7.4 | « Voir la convention » : ouverture dans un nouvel onglet, jeton lu au clic. | dev-interface | `src/actions-dashboard/index.html`, `script.js` | Tests de 7.5. |
| 7.5 | Tests de 7.4. | testeur | `test/convention-generation.test.js` | Texte caché « nouvel onglet », aucun jeton dans la page avant le clic. |
| 7.6 | Réglage des pointillés, du logo et de la mise en page sur un PDF imprimé (faux texte). | Hanta | Aucun | Elle écrit à la main dans chaque zone sans être gênée ; logo, numéros de page et saut de page corrects. |
| R4 | Recette de la fonction D. | recetteur | `docs/tests/` | Un PDF est généré et s'ouvre pour chaque modèle ; cases correctes ; génération bloquée avec message s'il manque agence, club ou dispositif. Le texte réel n'est pas recopié dans le compte rendu. |

### S8. Fonction E : re-générer

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 8.1 | « Re-générer » : fenêtre préremplie, nouveau PDF qui remplace l'ancien, date mise à jour. | dev-interface, dev-backend | `src/actions-dashboard/index.html`, `script.js` | Tests de 8.2. |
| 8.2 | Tests de 8.1. | testeur | `test/convention-generation.test.js` | Un seul fichier après re-génération, informations préremplies, échec = l'ancien PDF reste. |
| R5 | Recette de la fonction E. | recetteur | `docs/tests/` | La liste des pièces jointes ne contient qu'un fichier. |

### S9. Fonction F : déposer et remplacer le fichier signé

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 9.1 | Dépôt : choix du fichier, contrôle PDF (type et extension), envoi, rattachement, date, confirmation. | dev-backend, dev-interface | `src/actions-dashboard/index.html`, `script.js` | Tests de 9.2. |
| 9.2 | Tests de 9.1. | testeur | `test/convention-depot.test.js` (nouveau) | Fichier non PDF refusé sans rien écrire, remplacement du signé, état « Signée » après dépôt, échec d'envoi. |
| R6 | Recette de la fonction F. | recetteur | `docs/tests/` | Essai avec un vrai PDF, un fichier non PDF, un profil sans droit d'écriture. |

### S10. Clôture

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
|---|---|---|---|---|
| 10.1 | Examen de sécurité final : jeton, pdfmake, règles d'accès (ANS sans accès), contenu de `actions-dashboard.html` (aucun texte de modèle, aucun secret). | auditeur-securite | Aucun | Rapport sans point bloquant. |
| 10.2 | Documentation : README (section Convention, tables lues et écrites, données personnelles nom, prénom, fonction), carnet de tests, mention dans CLAUDE.md si Hanta le décide. | documentaliste | `README.md`, `docs/tests/`, éventuellement `CLAUDE.md` | Relecture par Hanta : aucun nom de document Grist, aucune adresse réelle. |
| R7 | Recette complète : générer, voir, re-générer, déposer, remplacer, pour chaque profil et chaque modèle. | recetteur | `docs/tests/` | Compte rendu final. |
| 10.3 | Journal des évolutions dans DEV2 ; fusion dans main seulement sur accord de Hanta. | Hanta | Aucun | Page publiée vérifiée après fusion. |

## Questions encore ouvertes

- **Q-A** : note de bas de page regroupée à la fin de l'article, au lieu du bas de page (pdfmake ne gère pas les vraies notes de bas de page). À faire valider par le client.
- **Q-B** : une action en corbeille ou annulée garde-t-elle sa convention ? La génération est-elle interdite pour ces statuts ?
- **Q-C** : d'où viennent les fichiers du logo (République française, France Travail) et comment les embarquer sans alourdir le dépôt public ?
- **Q-D** : taille maximale du PDF signé.
- **Q-E** : nom du fichier téléchargé (proposé : nom du club et année, jamais un nom de personne).
- **Q-F** : garder `Modele_version` ? Une branche par tâche ou par fonction ?
- **Q-G** : qui corrige l'adresse d'une agence dans Agences ? Champs du formulaire « Ajouter un contact » (nom, prénom, fonction) suffisants ?

## Risques

- Colonnes supposées dans le code (`Siege` ou `Adresse`) : tâche 0.2.
- Fuite entre régions ou pour l'ANS si une règle est mal posée : tâches 1.4 et 1.5.
- Droits d'écriture de Régional et Départemental sur `Conventions` et `Contacts` : testés en R2.
- Script externe pdfmake (même risque que le bandeau) : tâche 0.3.
- Jeton dans l'adresse du lien « Voir » : tâche 0.3.
- Doublons de `Conventions.Action` : Grist n'impose pas l'unicité, le widget garde la plus ancienne ligne.
- `script.js` dépasse 1300 lignes : les tests existants doivent rester verts à chaque tâche.
- Pointillés, logo et saut de page : réglage seulement sur papier (7.6).
- Dépôt public : aucun texte de modèle, aucun secret, aucune donnée réelle.
- Données personnelles : nom, prénom, fonction du signataire, signatures sur le PDF signé. Durée de conservation à traiter dans la démarche RGPD globale.
