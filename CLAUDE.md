# CLAUDE.md — Widgets « Actions d'insertion par le sport » : tableau de bord et clubs (widgets Grist)

## Avec qui tu travailles

Hanta, développeuse no-code (Grist). Réponds en français simple, étape par étape, et explique chaque terme technique.

## Le projet

France Travail, Partenariat simplifié : remplacer la gestion sur Excel des « actions d'insertion par le sport » par le document Grist « Partenariat Simplifié » et des widgets personnalisés.
Plusieurs dépôts (page-accueil-partenariat-simplifi-, grist-qpv-widget, Soutien_actions_widget-Grist, d'autres à venir) partagent le même document Grist. Renommer une table ou une colonne peut casser plusieurs widgets.
Modèle de données de référence : dépôt model-de-donnees-aucarre.

## Ce dépôt contient QUATRE widgets. On travaille sur le tableau de bord, et sur clubs pour le bandeau commun seulement.

- actions-dashboard : le tableau de bord. Widget principal de notre travail.
- clubs : dans le périmètre UNIQUEMENT pour l'ajout du bandeau commun (voir plus bas). Toute autre modification de clubs demande l'accord explicite de Hanta.
- qpv-widget, fiche-club : à ne pas modifier, sauf demande explicite de Hanta.
- Tous les widgets partagent build.js, npm test et le dossier test/. Une tâche sur un widget ne doit modifier ni les sources ni les fichiers générés des autres (qpv-widget.html, fiche-club.html, clubs.html, actions-dashboard.html, index.html).

## Le tableau de bord

Il affiche les actions d'insertion par le sport : filtres (Numéro Osiris, DR, DD, agence, fédération, club, dispositif, statut, financeur, financement), synthèse repliable avec répartitions (statut, dispositif, fédération), tableau triable des actions avec leurs cofinancements, export CSV, ajout d'une action, fiche de modification d'une action, mise à la corbeille.

- Utilisateurs : équipes France Travail connectées au document (profils FT National, FT Régional, FT Départemental, ANS). Chacun ne voit que les lignes que les règles d'accès du document lui permettent de voir.
- Accès demandé : complet (grist.ready({requiredAccess: 'full'})).
- Lit les tables : Actions, Cofinancements, Agences, DD, DR, Structures, Dispositifs, Federations, Financements, Financeurs, Reponses_AAP. Une table refusée est remplacée par une liste vide, sans bloquer le widget.
- Lit les choix des colonnes Actions.Statut, Actions.Public et Actions.Format : par l'API REST avec un jeton en lecture seule, sinon dans les tables _grist_Tables et _grist_Tables_column, sinon dans la liste de secours FALLBACK_CHOICES du script.
- Écrit dans Grist, par grist.docApi.applyUserActions :
  - Actions : ajout (Intitule, Dispositif, Club, Statut « A confirmer ») ; modification depuis la fiche (Intitule, Dispositif, Jauge, Format, Ville, Lieu, Commentaire, Public, Agence, Statut, Date, Periode_approx, Budget, Ouvert_au_financement, et Code_MEE si la colonne existe) ; mise à la corbeille (Corbeille = vrai). Aucune action n'est vraiment supprimée.
  - Cofinancements : ajout, modification et suppression des lignes d'une action (Financement, Montant, Action, Statut_Versement).
- Données personnelles : aucune lue ni écrite. Le champ Commentaire est un texte libre : il ne doit pas servir à noter des données de personnes.
- Lien avec le widget clubs : clubs dépose dans le stockage du navigateur la note clubs-ouvrir-action-v1 = {"actionId": …, "ts": …}. Le tableau de bord la lit au chargement, l'efface aussitôt, et ouvre la fiche de l'action si la note a moins de 20 secondes. Clé et forme à ne changer que dans les deux widgets à la fois.

## Le widget clubs (périmètre limité)

- Sources : src/clubs/. Vérifier les fichiers présents avant d'en citer un.
- Ce qu'on sait : accès demandé complet (requiredAccess 'full'), un titre h1 « Clubs », il dépose la note clubs-ouvrir-action-v1 lue par le tableau de bord.
- Tables lues ou écrites, données personnelles : non décrites ici. Les vérifier dans src/clubs/ et dans le README avant d'en parler. Ne rien supposer.
- Fichier généré : clubs.html. Ne jamais le modifier à la main.

## Bandeau commun

- Bandeau de navigation commun, fait par un collègue (dépôt d'origine du bandeau (Au Carré) : Bandeau_France-Travail). Un configurateur dans le document Grist décide quels widgets l'affichent.
- Il s'ajoute par UNE balise script dans le , après le chargement de l'API Grist. La balise est copiée telle quelle depuis le configurateur (onglet « Widgets du document »). La valeur de data-titre doit être exactement celle du configurateur.
- Pour clubs : data-titre="Liste des clubs sportifs".
- La note UX de chaque widget est dans docs/ux/ et passe AVANT la modification du HTML.
- On ne modifie pas le script du bandeau, on ne le copie pas dans le dépôt.

## Fichiers

- src/actions-dashboard/index.html, style.css, script.js : les sources du tableau de bord.
- src/clubs/ : les sources du widget clubs.
- build.js : assemble chaque dossier src/[widget]/ en [widget].html à la racine. Il reconstruit les quatre widgets.
- actions-dashboard.html, clubs.html : fichiers générés. Ne jamais les modifier à la main.
- test/ : tests avec le lanceur de tests de Node, sans dépendance. Ceux du tableau de bord : logic, render, ajout-action, suppression-action, navigation-dashboard, styles. build.test.js vérifie que les fichiers générés sont à jour. test/helpers/widget.js évalue le script du tableau de bord dans un bac à sable, avec des doublures du DOM et de l'API Grist.
- dev-server.js : serveur local (npm run dev).
- docs/reference-widget.html : ancienne version du widget, gardée comme référence. Ne pas la modifier.
- docs/audit-design-system.html : audit de conformité, gardé en local, ignoré par git.
- docs/design-system-france-travail.md : fiche du design system.
- docs/ux/ : notes du designer-ux.
- README.md : documentation des quatre widgets.
- Aucune dépendance npm.

## Commandes

- npm run build : régénère les fichiers HTML. Obligatoire après toute modification de src/.
- npm test : lance tous les tests des quatre widgets. Le test de build échoue si le build n'a pas été refait.
- Après le build, git status : seul le fichier généré du widget modifié doit apparaître (actions-dashboard.html OU clubs.html). Si un autre .html a changé, s'arrêter et le signaler.
- Ces trois commandes sont lancées par Hanta elle-même : Claude Code les refuse aux agents depuis l'ajout du script externe du bandeau. Un agent ne prétend jamais les avoir lancées ; il demande à Hanta le résultat affiché.
- Test local : npm run dev (port 8000), puis http://localhost:8000/actions-dashboard.html (ou /clubs.html) comme URL du widget dans le document Grist DEV. Pour tester le lien depuis clubs, servir les deux widgets avec le même npm run dev (même port). Après la démonstration, remettre l'adresse GitHub Pages dans Grist DEV.
- Aucune CI ne fait le build : commiter les sources ET le fichier généré.

## Publication

Grist charge le widget depuis GitHub Pages : https://hantaranui.github.io/grist-qpv-widget/actions-dashboard.html (même principe pour clubs.html, adresse à vérifier dans Grist).
Ce qui est fusionné dans main est en ligne pour tous les utilisateurs, et tout le dépôt est lisible à cette adresse. Ne jamais fusionner dans main sans l'accord de Hanta.

## Design system France Travail (obligatoire)

- Site : https://designsystem.francetravail.io/ — univers « Outils agent » (classe outil-agent sur body). Chargé par CDN : feuille https://cdn.francetravail.fr/studio/design-system/css/styles.css et autoloader https://cdn.francetravail.fr/webco/v1/ft-autoloader.js.
- Fiche de référence : docs/design-system-france-travail.md. Pour un nom de classe ou une valeur, la feuille du CDN fait foi ; le site sert à comprendre un composant.
- Utiliser uniquement ses composants et ses variables CSS. Ne jamais inventer de couleur, de police, d'espacement ni de composant. Si un composant manque, le signaler et proposer le plus proche, sans le fabriquer.
- Les pages de composants du site ne portent pas toujours les noms de la feuille : la documentation parle de button--small ou ft-progressbar, la feuille expose btn-sm et .progress.
- Nos propres classes ne reprennent jamais un nom de classe du design system : test/styles.test.js le vérifie.
- Composants utilisés (tableau de bord) : boutons (btn, btn-primary, btn-secondary, btn-link, btn-sm, btn-content), formulaires (form-label, form-control, form-check, form-legend, is-invalid), alertes (alert, alert-error, alert-content), fenêtres modales (modal…), barre de progression (progress, progress-bar), icônes (icon-…), sr-only.
- Écart volontaire, documenté dans le README : le tableau n'utilise pas la classe .table du design system, qui fait décrocher son en-tête collant.
- Respecter les bonnes pratiques d'accessibilité du design system (contrastes, titres, textes pour les lecteurs d'écran, attributs aria).

## Règles de travail

- Jamais de commit sur main. Une branche par tâche : feature/..., fix/... ou chore/... Messages de commit préfixés : feat, fix, test, docs, chore.
- Une seule tâche à la fois, et rien d'autre. Aucune fonction non demandée.
- Un agent ne lance jamais un autre agent. Celui qui inspecte ne répare pas.
- Aucune dépendance, aucun framework, aucun outil de build sans l'accord de Hanta : le proposer avec avantages, risques et effort.
- Ne jamais inventer un nom de fichier, de classe, de table ou de colonne : le vérifier dans le dépôt, ou dire qu'on ne sait pas.
- Aucun secret (jeton Grist, clé, mot de passe), aucune adresse de document ni donnée réelle de personne dans le code, les tests ou la documentation. Le dépôt est public.
- « Tests proposés » ne veut pas dire « tests passés » : donner le résultat réellement affiché.
- Chaque compte rendu se termine par : 1. fichiers lus ; 2. fichiers modifiés ; 3. tests lancés et résultat ; 4. risques restants.

## Pièges connus

- build.js reconstruit les quatre widgets : vérifier avec git status qu'aucun autre fichier généré n'a changé.
- grist.setOption ne garde pas ses valeurs après un rechargement complet : ne pas s'en servir pour mémoriser un réglage (voir le README, widget clubs).
- Les couleurs des graphiques sont écrites en dur dans script.js (COLORS) : écart possible au design system, à vérifier avant d'y toucher.
- Les tables et colonnes Grist sont partagées entre tous les widgets du projet. Colonnes écrites par ces widgets : ne jamais les renommer.
- Les règles d'accès du document (profils FT National, Régional, Départemental, ANS) décident de ce que chacun voit et modifie : le widget ne doit jamais essayer de les contourner.
- Le script du bandeau est chargé depuis un autre site, sans numéro de version figé : s'il change, nos widgets changent sans commit de notre part. À faire examiner par auditeur-securite.
- Envoyer un fichier en pièce jointe depuis un widget : jeton d'écriture dans l'adresse (?auth=), credentials 'omit' et en-tête X-Requested-With: XMLHttpRequest, comme fiche-club. Sans cet en-tête, Grist répond 401. Télécharger un fichier et ouvrir un onglet depuis le cadre de Grist fonctionnent.
