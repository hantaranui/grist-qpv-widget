# Journal de revue — Tableau de bord « Actions d'insertion par le sport » (grist-qpv-widget)

## Tâche 0 — Sprint 0 : installation de la squad

Date : 2026-10-15
Agent : aucun (installation à la main, avec Claude dans le chat)
Prompt : aucun

Note /5 : 5
Ce qui allait : 8 agents, CLAUDE.md et fiche design system installés sans rien écraser ; 4 agents adaptés (designer-ux avec WebFetch, dev-interface, testeur, auditeur-securite) ; agents reconnus par Claude Code.
Ce que j'ai fait corriger : trace d'un ancien revert effacée (git revert --quit) ; agents invisibles jusqu'au rechargement de la fenêtre VS Code.
Tests : aucun lancé (aucun fichier de code modifié)
Commit : bce7217 sur chore/sprint-0-squad (non fusionnée)

## Tâche 1 — Note UX pour l'ajout du bandeau commun

Date : 2026-10-16
Agent : @designer-ux
Prompt : écrire docs/ux/bandeau-commun.md (emplacement de la ligne du bandeau, sort du h1, valeur de data-titre, vérifications visuelles)

Note /5 : 4
Ce qui allait : une seule tâche, un seul fichier créé ; h1 conservé pour l'accessibilité ; data-titre « Dashboard » conservé ; 13 vérifications visuelles, dont la hauteur du tableau (100vh) et l'en-tête collant.
Ce que j'ai fait corriger : rien.
Tests : aucun lancé (note seulement)
Fichiers modifiés : docs/ux/bandeau-commun.md (créé)
Build refait : pas nécessaire
Commit : 0ffcc8d sur feature/bandeau-commun

## Tâche 2 — Ajout du bandeau commun au tableau de bord

Date : 2026-10-16
Agent : @dev-interface
Prompt : ajouter la ligne du bandeau dans le head de src/actions-dashboard/index.html, après l'API Grist, selon docs/ux/bandeau-commun.md

Note /5 : 4
Ce qui allait : une seule ligne ajoutée au bon endroit, rien d'autre touché ; l'agent n'a pas contourné le refus de Claude Code et l'a signalé clairement.
Ce que j'ai fait corriger : rien. Build, tests et git status lancés à la main (commande refusée à l'agent à cause du script externe).
Tests : 172 lancés, 172 réussis
Fichiers modifiés : src/actions-dashboard/index.html, actions-dashboard.html
Build refait : oui
Commit : 67bb166 sur feature/bandeau-commun

## Tâche 2 bis — Ajout du bandeau commun au widget clubs

Date : 16/10/2026
Agent : designer-ux (note docs/ux/bandeau-commun-clubs.md), puis dev-interface
Prompt : ajouter la balise du bandeau dans src/clubs/index.html, après le script jszip, avant la feuille du design system

Note /5 : sans objet
Ce qui allait : une seule ligne ajoutée ; h1 « Clubs » conservé (choix de la note UX) ; aucun autre widget touché
Ce que j'ai fait corriger : sans objet
Tests : non notés (fiche écrite après coup ; la publication est testée en tâche 3)
Fichiers modifiés : src/clubs/index.html, clubs.html, docs/ux/bandeau-commun-clubs.md
Build refait : oui
Commit : 9d281a4 sur feature/fiche-club

## Tâche 3 — Réunion des branches et publication du bandeau commun (manuel)

Date : 17/10/2026
Agent : @ aucun (fait à la main)
Prompt : sans objet

Note /5 : sans objet
Ce qui allait : branche feature/publication-bandeau créée depuis main ; feature/bandeau-commun (tableau de bord) puis feature/fiche-club (widget clubs) réunies sans conflit ; adresse du bandeau remplacée par https://hantaranui.github.io/Bandeau_France-Travail/bandeau.js ; titres alignés sur le menu (« Liste des actions », « Liste des clubs sportifs ») ; adresse de commit locale codex@local retirée de ce dépôt
Ce que j'ai fait corriger : sans objet
Tests : 172 lancés, 172 réussis (npm test)
Fichiers modifiés : src/actions-dashboard/index.html, src/clubs/index.html, actions-dashboard.html, clubs.html
Build refait : oui
Commit : c3a414d (feat: charger le bandeau publié (hantaranui) et aligner les titres sur le menu)

## Tâche 4 — Audit avant publication dans main

Date : 17/10/2026
Agent : @auditeur-securite
Prompt : relire tout ce qui deviendra public dans main (CLAUDE.md, agents, REVIEW_LOG, docs, balises du bandeau) : secrets, données de personnes, remarques internes, confiance accordée au script du bandeau

Note /5 : 4
Ce qui allait : aucun secret, aucune donnée de personne ; une seule balise du bandeau par widget, rien d'autre de changé ; a expliqué que les widgets font confiance au bandeau.js publié ; a repéré que les notes citaient encore l'ancienne adresse et les anciens titres
Ce que j'ai fait corriger : notes et CLAUDE.md mis à jour (tâche suivante). À vérifier : la réponse indiquait « je n'ai lancé aucun agent »
Tests : 0 lancés, 0 réussis (relecture)
Fichiers modifiés : aucun
Build refait : pas nécessaire
Commit : aucun

## Tâche 5 — Mise à jour des notes après le changement d'adresse

Date : 17/10/2026
Agent : @documentaliste
Prompt : remplacer l'ancienne adresse et les anciens titres dans CLAUDE.md et les deux notes ux, retirer le nom de compte du collègue et la mention de la démonstration, titre du backlog

Note /5 : 4
Ce qui allait : uniquement les quatre fichiers demandés ; lignes avant / après listées ; titres vérifiés dans les sources ; noms des pages Grist laissés tels quels
Ce que j'ai fait corriger : rien. Reste à faire après lundi : « GitHub Pages du collègue » dans les questions ouvertes des deux notes ; balise du tableau de bord à décrire dans CLAUDE.md
Tests : 0 lancés, 0 réussis (documentation)
Fichiers modifiés : CLAUDE.md, docs/ux/bandeau-commun.md, docs/ux/bandeau-commun-clubs.md, docs/backlog.md
Build refait : pas nécessaire
Commit : 4511603 (docs: mettre à jour les notes du bandeau commun (adresse, titres))

## Tâche 6 — Filtres géographiques dépendants (DR → DD → agence)

Date : 2026-10-18
Agent : @dev-backend
Prompt : rendre dépendants les filtres DR, DD et Agence du tableau de bord (5 règles : DD limitées à la DR, agences limitées à la DD ou à la DR, nettoyage des choix devenus impossibles, listes construites à partir des actions, autres filtres inchangés)

Note /5 : 5
Ce qui allait : seuls script.js et le fichier généré modifiés ; optionsFor filtre les actions avant de construire les listes ; nouvelle fonction pruneGeoFilters appelée à chaque changement de filtre ; rendu HTML inchangé ; l'agent a signalé qu'aucun test ne couvre encore les règles.
Ce que j'ai fait corriger : rien.
Tests : 172 lancés, 172 réussis (tests existants, les nouvelles règles ne sont pas encore testées)
Fichiers modifiés : src/actions-dashboard/script.js, actions-dashboard.html
Build refait : oui
Commit : 66aa94b sur feature/filtres-geographiques-dependants

## Tâche 7 — Tests des filtres géographiques dépendants

Date : 2026-10-18
Agent : @testeur
Prompt : écrire dans test/filtres-geographiques.test.js les tests des 8 règles des filtres DR, DD et agence, puis lancer tous les tests

Note /5 : 4
Ce qui allait : 12 tests avec données fictives (2 DR, 3 DD, 4 agences), les 8 règles couvertes, plus la liste des DR inchangée et le nettoyage sans effet sans filtre géographique ; aucun bug trouvé ; un seul fichier créé.
Ce que j'ai fait corriger : rien. Limites notées : les clics sur les filtres ne sont pas testés (couverts par le carnet du recetteur) ; deux DD de même nom dans deux DR seraient fusionnées (cas non testé).
Tests : 184 lancés, 184 réussis
Fichiers modifiés : test/filtres-geographiques.test.js (créé)
Build refait : pas nécessaire
Commit : 0c3cf11 sur feature/filtres-geographiques-dependants

## Tâche 8 — Carnet de tests humains des filtres géographiques dépendants

Date : 2026-10-18
Agent : @recetteur (la correction a peut-être été faite par Claude sans l'agent : il n'avait pas été rappelé avec @)
Prompt : écrire la section « Filtres géographiques dépendants » de docs/tests/carnet-tableau-de-bord.md (parties A et B, dans DEV avec données fictives), puis la raccourcir à 10 tests en A et 5 en B

Note /5 : 5
Ce qui allait : 8 règles couvertes ; partie A (développeuse) et partie B (collègue testeur) séparées ; 5 tests de fumée (A01, A02, A04, A07, B05) ; rien présenté comme déjà testé ; points à confirmer clairement marqués.
Ce que j'ai fait corriger : premier brouillon trop long (25 tests) ramené à 15 ; test Échap retiré ; profil FT Régional reporté ; A09 et A10 à jouer seulement si une DD sans DR (ou une DR sans DD) existe dans DEV ; statut « Planifiée » ; commit à tester 66aa94b. À faire plus tard : copier le protocole de test et le guide testeur depuis le dépôt de la page d'accueil.
Tests : 0 lancés, 0 réussis (rédaction du carnet)
Fichiers modifiés : docs/tests/carnet-tableau-de-bord.md (créé)
Build refait : pas nécessaire
Commit : f12921f sur feature/filtres-geographiques-dependants

## Tâche 9 — Retrait de fiche-club, étape 1 : tester directement la fiche de clubs

Date : 21/10/2026
Agent : testeur (après l'inventaire du relecteur)
Prompt : recopier dans un nouveau fichier test/clubs-fiche.test.js les tests de fiche-club.test.js qui portent sur des fonctions présentes dans clubs, en les faisant viser clubs ; ne rien supprimer ni modifier d'autre

Note /5 : sans objet
Ce qui allait : 32 tests recopiés, tableau de correspondance complet (chaque test non recopié a sa raison) ; contournement charger() signalé au lieu de modifier le helper ; un seul fichier créé
Ce que j'ai fait corriger : rien. Total annoncé 204 au lieu de 216 : erreur de point de départ dans le prompt (172 au lieu de 184), pas de l'agent
Tests : 216 lancés, 216 réussis (npm test)
Fichiers modifiés : test/clubs-fiche.test.js (créé)
Build refait : non (src/ inchangé)
Commit : 08e055a sur chore/retrait-fiche-club

## Tâche 10 — Retrait de fiche-club, étape 2 : retirer les tests qui visaient fiche-club

Date : 21/10/2026
Agent : testeur
Prompt : supprimer test/fiche-club.test.js et test/helpers/fiche-club.js, retirer le test de non-divergence de clubs.test.js, retirer loadFiche de suppression-action.test.js, corriger les titres et commentaires qui citaient fiche-club ; uniquement dans test/

Note /5 : sans objet
Ce qui allait : 38 tests retirés, total annoncé (178) confirmé par npm test ; aucun fichier hors de test/ touché ; commentaires de clubs-fiche.test.js et de scripts/maj-frr.js signalés au lieu d'être modifiés
Ce que j'ai fait corriger : rien. Commentaires de clubs-fiche.test.js gardés volontairement (ils disent d'où viennent les tests)
Tests : 178 lancés, 178 réussis (npm test)
Fichiers modifiés : test/clubs.test.js, test/suppression-action.test.js, test/helpers/clubs.js, test/helpers/widget.js, test/navigation-dashboard.test.js ; supprimés : test/fiche-club.test.js, test/helpers/fiche-club.js
Build refait : non (src/ inchangé)
Commit : 424c7f7 sur chore/retrait-fiche-club

## Tâche 11 — Retrait de fiche-club, étape 3 : supprimer les sources (manuel)

Date : 21/10/2026
Agent : aucun (fait à la main avec git rm)
Prompt : sans objet

Note /5 : sans opjet
Ce qui allait : src/fiche-club/ et fiche-club.html supprimés ; le build ne construit plus que actions-dashboard, clubs et qpv-widget ; aucun autre fichier généré modifié
Ce que j'ai fait corriger : sans objet
Tests : 177 lancés, 177 réussis (npm test ; le test « fiche-club.html est à jour » a disparu avec le widget)
Fichiers modifiés : supprimés : src/fiche-club/index.html, src/fiche-club/script.js, src/fiche-club/style.css, fiche-club.html
Build refait : oui
Commit : 8939bc3 sur chore/retrait-fiche-club

## Tâche 12 — Retrait de fiche-club, étape 4 : documentation

Date : 21/10/2026
Agent : documentaliste
Prompt : mettre à jour README.md, CLAUDE.md, la description de package.json, docs/ux/bandeau-commun-clubs.md et le commentaire de scripts/maj-frr.js pour ne plus décrire fiche-club ; déplacer dans la section clubs du README ce qui sert encore à clubs

Note /5 : sans objet
Ce qui allait : sections Zonages et Logo déplacées dans « Widget clubs » sans perte ; mention du test de comparaison avec qpv-widget gardée à juste titre ; mentions restantes listées et classées (normales / à corriger)
Ce que j'ai fait corriger : rien. Commentaires de src/clubs/ et src/actions-dashboard/ laissés volontairement, à corriger pendant la gestion des contacts (noté dans le backlog)
Tests : 177 lancés, 177 réussis (npm test)
Fichiers modifiés : README.md, CLAUDE.md, package.json, docs/ux/bandeau-commun-clubs.md, scripts/maj-frr.js
Build refait : non (src/ inchangé)
Commit : 0e7557a sur chore/retrait-fiche-club

## Tâche 13 — Fuite du jeton d'écriture dans la console (clubs), étape 1 : test qui échoue

Date : 21/10/2026
Agent : testeur (cause trouvée par auditeur-securite : console.info lignes 1313-1316 de src/clubs/script.js)
Prompt : écrire un test qui échoue tant que le jeton d'écriture, ou une adresse avec ?auth=, apparaît dans la console lors d'un téléversement de logo ; uniquement dans test/

Note /5 : sans objet
Ce qui allait : 3 tests (envoi réussi, échec réseau, refus de Grist), jeton factice, aucun helper modifié ; risque du console.error ligne 1251 bien identifié
Ce que j'ai fait corriger : rien
Tests : 180 lancés, 177 réussis, 3 en échec comme attendu (les 3 nouveaux, échec causé par le console.info)
Fichiers modifiés : test/clubs-fiche.test.js
Build refait : non (src/ inchangé)
Commit : 14f49d1 sur fix/jeton-console-clubs

## Tâche 14 — Fuite du jeton d'écriture dans la console (clubs), étape 2 : correction

Date : 21/10/2026
Agent : dev-backend
Prompt : corriger la cause seule pour que les 3 tests de la tâche 13 passent ; supprimer le console.info qui affichait la commande curl avec le jeton, et corriger le console.error seulement s'il fuyait aussi ; uniquement src/clubs/script.js

Note /5 : sans objet
Ce qui allait : console.info supprimé ; fuite du console.error confirmée et corrigée par une fonction sansJeton qui masque ?auth= ou &auth= tout en gardant un message d'erreur utile ; rien d'autre changé au téléversement
Ce que j'ai fait corriger : rien
Tests : 180 lancés, 180 réussis (npm test)
Fichiers modifiés : src/clubs/script.js, clubs.html
Build refait : oui
Commit : 9334db8 sur fix/jeton-console-clubs

## Tâche 15 — Contacts : règles d'accès dans DEV7 (manuel)

Date : 21/10/2026
Agent : aucun (fait à la main dans Grist DEV7, règle relue par auditeur-securite)
Prompt : sans objet

Note /5 : sans objet
Ce qui allait : colonnes formules DR = $Club.DR et DD = $Club.DD ajoutées dans Contacts (type Référence) ; règles sur Contacts : propriétaire en tête, pas de création sans club, club non modifiable, FT National sur tout, FT Régional et FT Départemental sur leur périmètre (rec pour modifier et supprimer, newRec pour créer), lecture actuelle inchangée en dernier
Ce que j'ai fait corriger : règle du Départemental écrite avec newRec au lieu de rec (corrigé) ; identifiant de colonne DD
Tests : « Voir en tant que » : modification acceptée dans le périmètre et refusée hors périmètre (Régional, Départemental), National sur tout, ANS en lecture seule, changement de club refusé, suppression acceptée. Création non testable dans le tableau (ligne vide refusée) : à tester avec le widget
Fichiers modifiés : aucun (document Grist DEV7 uniquement)
Build refait : non
Commit : aucun (configuration Grist)

## Tâche 16 — Contacts : note UX de la carte Contacts

Date : 21/10/2026
Agent : designer-ux (2 corrections)
Prompt : écrire docs/ux/contacts-fiche-club.md (parcours, maquettes, messages, mention coordonnées professionnelles, mobile, accessibilité, HTML du design system, règles pour dev-interface), puis intégrer les décisions de Hanta et corriger les détails relevés

Note /5 : sans objet
Ce qui allait : note complète, structures HTML recopiées, existant mesuré (règle .edit-row-lists citée avec ses lignes), ce qui n'est pas vérifié clairement signalé (alert-success, refus de Grist) ; texte brut des erreurs Grist volontairement non affiché
Ce que j'ai fait corriger : décisions intégrées (Fonction affichée, bouton d'ajout masqué si lecture refusée, « Supprimer », règle mailHref, erreurs du design system, « * champ obligatoire », cartes à moitiés égales, pas d'alerte de succès) ; balise abîmée par VS Code, type de l'e-mail, nom de classe contact-required-note, « Erreur : » uniformisé, DEV2 corrigé en DEV7
Tests : aucun (documentation)
Fichiers modifiés : docs/ux/contacts-fiche-club.md (créé)
Build refait : non
Commit : 2a0d61f sur feature/contacts-fiche-club

## Tâche 17 — Contacts : partie données (dev-backend)

Date : 21/10/2026
Agent : dev-backend
Prompt : lire Fonction dans buildFicheDetail ; contrôler les saisies ; ajouter, modifier et supprimer un contact par applyUserActions, une opération chacune ; classer les erreurs ; sans aucun écran

Note /5 : 5
Ce qui allait : fonctions emailBienForme, controlerContact, contactDuClubOuvert, classerErreurEcriture, ecrireContacts, ajouterContact, modifierContact, supprimerContact, ressembleAUnRefus ; retours clairs par cas ; aucune valeur saisie ni texte brut de Grist dans la console ; pas de jeton d'écriture ; DR et DD jamais écrites ; règles de mailHref et du refus du logo mises en commun sans changer leur comportement
Ce que j'ai fait corriger : rien
Tests : 180 lancés, 180 réussis (npm test) ; les nouvelles fonctions n'ont pas encore de test
Fichiers modifiés : src/clubs/script.js, clubs.html
Build refait : oui
Commit : dc2e898 sur feature/contacts-fiche-club
Risques : reconnaissance du refus et de l'échec réseau par mots supposés (à constater en recette) ; contact supprimé entre-temps classé « autre »

## Tâche 18 — Contacts : tests de la partie données

Date : 21/10/2026
Agent : testeur (2 corrections)
Prompt : tester controlerContact, ajouterContact, modifierContact, supprimerContact, classerErreurEcriture, la console et buildFicheDetail, dans test/clubs-contacts.test.js

Note /5 : sans objet
Ce qui allait : 32 tests couvrant chaque règle de la note UX, dont les cas où rien n'est envoyé ; un test qui passait par hasard (console en réussite) repéré et renforcé par l'agent
Ce que j'ai fait corriger : 1) activité en arrière-plan après la fin de 4 tests (doublure sans fetchTable) ; 2) le chargement de départ effaçait les contacts préparés, d'où un « introuvable » au lieu de « droits » ; les tests attendent désormais la fin du chargement et vérifient que chaque écriture est réellement partie
Tests : 212 lancés, 212 réussis (npm test)
Fichiers modifiés : test/clubs-contacts.test.js (créé)
Build refait : non (src/ inchangé)
Commit : 68301b1 sur feature/contacts-fiche-club

## Tâche 19 — Contacts : écran d'ajout et de modification (dev-interface)

Date : 21/10/2026
Agent : dev-interface
Prompt : carte Contacts (fonction sous le nom, « + Ajouter un contact », « Modifier » par ligne), fenêtre d'ajout et de modification selon la note UX, messages, focus et clavier, cartes à moitiés égales ; sans la suppression

Note /5 : 4
Ce qui allait : note UX suivie ; écarts justifiés et signalés (zone d'annonce hors de la fiche pour qu'elle survive au rechargement, Annuler et Échap ignorés pendant l'envoi, type « club » avec le message de repli) ; aucun texte brut de Grist affiché
Ce que j'ai fait corriger : rien
Tests : 212 lancés, 212 réussis (npm test ; la fenêtre n'a pas encore de test automatique). Vérification dans DEV7 avec la version locale : erreurs de saisie, ajout, modification, clavier, affichage, OK en propriétaire ; en « Voir en tant que » FT Régional, création et modification d'un contact de sa région OK (règle de création newRec confirmée) ; refus en ANS : refus constaté en « Voir en tant que » FT Départemental sur un club hors de son département : message de droits affiché, sans texte brut (l'ANS ne voit pas les clubs)
Fichiers modifiés : src/clubs/index.html, src/clubs/style.css, src/clubs/script.js, clubs.html
Build refait : oui
Commit : b81debf sur feature/contacts-fiche-club

## Tâche 20 — Contacts : suppression d'un contact (dev-interface)

Date : 21/10/2026
Agent : dev-interface
Prompt : bouton « Supprimer » par ligne, fenêtre de confirmation (alertdialog, bouton rouge btn-supprimer), messages, focus et clavier, en réutilisant la fenêtre d'ajout

Note /5 : 5
Ce qui allait : fenêtre d'ajout réutilisée, pas recopiée ; .btn-supprimer repris du tableau de bord ; après un échec, focus sur Annuler (geste prudent), choix de l'agent validé
Ce que j'ai fait corriger : rien
Tests : 212 lancés, 212 réussis (npm test). Vérification dans DEV7 : annuler (bouton et Échap), suppression en propriétaire, suppression en « Voir en tant que » FT Régional dans sa région, OK ; refus constaté en DD Ain sur un club hors de son département (message de droits)
Fichiers modifiés : src/clubs/index.html, src/clubs/style.css, src/clubs/script.js, clubs.html
Build refait : oui
Commit : 23f14dd sur feature/contacts-fiche-club

## Tâche 21 — Contacts : note UX, boutons icônes

Date : 22/10/2026
Agent : designer-ux
Prompt : remplacer les boutons texte « Modifier » et « Supprimer » de la carte Contacts par des boutons icône seule (icon-edit, icon-trash), avec aria-label et info-bulle

Note /5 : 5
Ce qui allait : structure du bouton « Icône seule » du design system recopiée ; note relue (plus d'icon-pencil ni de bouton texte dans la carte) ; risques signalés (taille des boutons, info-bulle au clavier, pas d'info-bulle sur mobile)
Ce que j'ai fait corriger : nom de l'icône corbeille introuvable par l'agent, trouvé par Hanta sur la page Icônes ; icon-edit préféré à icon-pencil
Tests : aucun (documentation)
Fichiers modifiés : docs/ux/contacts-fiche-club.md
Build refait : non
Commit : 25ba1f3 sur feature/contacts-fiche-club

## Tâche 22 — Contacts : boutons icônes (dev-interface)

Date : 22/10/2026
Agent : dev-interface
Prompt : remplacer les boutons texte Modifier et Supprimer de chaque ligne par les boutons icône seule du §7.2 (icon-edit, icon-trash), sans changer leur comportement

Note /5 : 5
Ce qui allait : changement minimal dans renderContacts ; attributs de fonctionnement gardés (ouverture des fenêtres, retour du focus) ; aucun CSS ajouté sans besoin ; bouton rouge de la fenêtre non touché
Ce que j'ai fait corriger : rien
Tests : 212 lancés, 212 réussis (npm test). Vérification dans DEV7 : icônes affichées, info-bulle au survol et au clavier, focus visible, bonnes fenêtres ouvertes, retour du focus, boutons bien espacés en rétrécissant, OK
Fichiers modifiés : src/clubs/script.js, clubs.html
Build refait : oui
Commit : dbea258 sur feature/contacts-fiche-club

## Tâche 23 — Contacts : tests des écrans

Date : 22/10/2026
Agent : testeur
Prompt : tester la carte Contacts, les fenêtres d'ajout, de modification et de suppression, les messages et le clavier, dans test/clubs-contacts-ecran.test.js

Note /5 : 5
Ce qui allait : 32 tests ; faux DOM posé dans le fichier de test, sans modifier le helper ; chaque message vérifié, texte brut de Grist jamais affiché ; Échap et Annuler ignorés pendant l'envoi testés
Ce que j'ai fait corriger : rien. À noter : l'agent a lancé node --test sur son fichier malgré la consigne (sans conséquence)
Tests : 244 lancés, 244 réussis (npm test)
Fichiers modifiés : test/clubs-contacts-ecran.test.js (créé)
Build refait : non (src/ inchangé)
Commit : 0edab57 sur feature/contacts-fiche-club

## Tâche 24 — Contacts : documentation (documentaliste)

Date : 22/10/2026
Agent : documentaliste (1 correction)
Prompt : documenter la gestion des contacts dans README.md (section Widget clubs) et CLAUDE.md, aligner le tableau des messages de la note UX sur le code

Note /5 : sans objet
Ce qui allait : noms de fonctions, constantes et colonnes vérifiés dans le code avant d'écrire ; message de repli de la suppression aligné sur le code ; décalages restants signalés par l'agent
Ce que j'ai fait corriger : note UX mise à jour avec les constats de DEV7 (création par un non-propriétaire, refus, affichage)
Tests : 244 lancés, 244 réussis (npm test)
Fichiers modifiés : README.md, CLAUDE.md, docs/ux/contacts-fiche-club.md
Build refait : non (src/ inchangé)
Commit : b5cc09b sur feature/contacts-fiche-club

## Tâche 25 — Contacts : cas de test de recette (recetteur)

Date : 22/10/2026
Agent : recetteur (2 corrections)
Prompt : rédiger les cas de test de recette de la gestion des contacts au format de l'onglet Cas_de_test du carnet (18 colonnes), en .tsv pour Excel et en .md lisible

Note /5 : sans objet
Ce qui allait : 31 cas (CON-01 à CON-32, sans CON-27) ; messages exacts de la note ; tests de sécurité (HTML) et de persistance ; séparation entre ce que joue le collègue et ce que joue la développeuse ; données fictives ; points incertains signalés au lieu d'être inventés
Ce que j'ai fait corriger : CON-21 et CON-26 impossibles à jouer (clubs invisibles pour le FT Régional hors de sa DR et pour l'ANS), réécrits ; doublon de données entre CON-10 et CON-14 ; CON-27 retiré ; CON-28 aligné sur la note ; prérequis du profil FT National du testeur ; ordre prénom puis nom constaté pour CON-17
Tests : aucun (documentation)
Fichiers modifiés : docs/tests/cas-de-test-contacts.tsv, docs/tests/cas-de-test-contacts.md (créés)
Build refait : non
Commit : 15c1258 sur feature/contacts-fiche-club

## Tâche C1 — Maquette de la convention de partenariat

Date : 2026-10-20
Agent : @designer-ux
Prompt : préparer docs/ux/convention.md (parcours, textes, états, accessibilité, données personnelles) et docs/ux/maquette-convention.html (bloc « Convention » dans la fiche d'action, fenêtre Convention, 3 états de la zone PDF), puis corriger la maquette pour l'impression en PDF

Note /5 : 4
Ce qui allait : bloc « Convention » séparé des boutons Supprimer, Annuler et Enregistrer ; fenêtre en trois parties (France Travail, Club, Convention) ; 3 états de la zone PDF ; feuille du design system chargée par CDN ; données fictives ; liens et HTML des composants recopiés ; points à confirmer listés ; impression corrigée (4 pages, une par partie, rien de coupé).
Ce que j'ai fait corriger : première impression illisible (fenêtres coupées, texte tronqué) ; ajout de règles d'impression. À valider : 3 classes convention-* créées faute de composant dans le design system ; texte réduit à 66 % à l'impression.
Tests : 0 lancés, 0 réussis (maquette) ; PDF de contrôle généré par l'agent : 4 pages
Fichiers modifiés : docs/ux/convention.md (créé), docs/ux/maquette-convention.html (créé)
Build refait : pas nécessaire
Commit : 78ebd82 sur feature/convention


## Tâche C2 — Essai technique : téléchargement et pièce jointe depuis un widget

Date : 2026-10-20
Agent : @dev-backend
Prompt : page d'essai jetable essai-pieces-jointes.html (4 boutons : télécharger un fichier, l'ouvrir dans un onglet, l'enregistrer en pièce jointe dans la table Essai_pieces_jointes de DEV6, le relire), puis deux corrections de l'envoi

Note /5 : 4
Ce qui allait : les 4 points sont possibles depuis un widget dans Grist ; jeton jamais affiché ; une seule table d'essai écrite ; l'agent n'a pas recopié l'affichage du jeton de fiche-club.
Ce que j'ai fait corriger : envoi refusé deux fois (« Failed to fetch » avec le jeton dans un en-tête, puis 401) ; il fallait la méthode de fiche-club : jeton dans l'adresse (?auth=), credentials 'omit' et en-tête X-Requested-With. Découvert : fiche-club affiche le jeton d'écriture dans la console (console.info), à corriger.
Tests : 184 lancés, 184 réussis (npm test, page d'essai présente) ; essai manuel dans DEV6 : 4 sur 4
Fichiers modifiés : aucun dans le dépôt (essai-pieces-jointes.html jamais commité, supprimé après l'essai)
Build refait : pas nécessaire
Commit : aucun pour l'essai (fiche seule)


## Tâche C3 — Maquette de la convention mise à jour après les retours du chef

Date : 2026-10-20
Agent : @designer-ux
Prompt : intégrer les décisions du chef dans docs/ux/convention.md et maquette-convention.html (4 états du bloc Convention, fenêtre large sans défilement, ordre des blocs, dépôt du fichier signé, choix du signataire parmi les contacts du club), puis trois corrections : « Ajouter un contact » dans le bloc, champs selon le modèle, siège du club complet, représentant de l'agence saisi dans la fenêtre

Note /5 : 5
Ce qui allait : décisions du chef intégrées ; fenêtre en modal-xl sur trois colonnes, sans défilement sur mon écran ; composants recopiés avec leur lien ; piège du formulaire dans un formulaire repéré et contourné ; tableau des champs par modèle ; seuls les fichiers de docs/ux/ modifiés.
Ce que j'ai fait corriger : nombre d'opérations affiché à tort pour « Du stade vers l'emploi » ; « Ajouter un contact » en seconde fenêtre (remplacé par un formulaire dans le bloc) ; siège du club coupé ; représentant de l'agence prérempli (il est saisi). Composant de dépôt de fichier absent du design system : méthode de fiche-club retenue.
Tests : 0 lancés, 0 réussis (maquette) ; fenêtre vérifiée à l'écran
Fichiers modifiés : docs/ux/convention.md, docs/ux/maquette-convention.html
Build refait : pas nécessaire
Commit : 9409f5b sur feature/convention


## Tâche C4 — Maquette de la convention : re-générer et dépôt direct du fichier signé

Date : 2026-10-20
Agent : @designer-ux
Prompt : intégrer les trois dernières décisions du chef dans docs/ux/convention.md et maquette-convention.html : bouton « Re-générer » à l'état Générée ; PDF généré gardé sans être montré après le dépôt du signé ; dépôt et remplacement du fichier signé sans vérification

Note /5 :
Ce qui allait : les trois décisions appliquées ; fenêtres de vérification retirées ; message de confirmation en alert-success ; points tranchés déplacés dans convention.md ; seuls les fichiers de docs/ux/ modifiés.
Ce que j'ai fait corriger : rien. Choix de l'agent acceptés : « Re-générer » seulement à l'état Générée ; aria-haspopup retiré des boutons de dépôt.
Tests : 0 lancés, 0 réussis (maquette)
Fichiers modifiés : docs/ux/convention.md, docs/ux/maquette-convention.html
Build refait : pas nécessaire
Commit : 1ea1315 sur feature/convention

## Tâche C5 — Maquette de la convention alignée sur les réponses du client

Date : 2026-10-22
Agent : @designer-ux
Prompt : intégrer les réponses du client dans docs/ux/convention.md et maquette-convention.html : une convention par action ; zones en pointillés remplies à la main (nombre d'opérations, date de fin, contact protection des données, « Fait à » et date) ; signataire France Travail = directeur d'agence

Note /5 : 5
Ce qui allait : fenêtre réduite à trois blocs, sans défilement (vérifié à l'écran) ; champs Nombre d'opérations, Date de fin et bloc Date et lieu retirés ; règle « action sans fédération » retirée ; fonction du représentant préremplie « Directeur d'agence » ; variante B ter supprimée car devenue inutile ; points à confirmer mis à jour.
Ce que j'ai fait corriger : rien. À prévoir au développement : des pointillés assez longs pour écrire à la main dans le PDF.
Tests : 0 lancés, 0 réussis (maquette)
Fichiers modifiés : docs/ux/convention.md, docs/ux/maquette-convention.html
Build refait : pas nécessaire
Commit : 49821cd sur feature/convention

## Tâche C6 — Cadrage du développement de la convention

Date : 2026-10-22
Agent : @chef-de-projet (cadrage), puis Claude sans agent (enregistrement dans docs/backlog.md)
Prompt : cadrer le développement de la convention sans rien modifier : structure Grist (Modeles_convention, Conventions), règles d'accès par profil, format du texte des modèles, découpage en tâches de S0 à S10 avec recette à la fin de chaque fonction, risques et questions ; puis enregistrer le plan dans docs/backlog.md avec les réponses déjà connues

Note /5 : sans objet
Ce qui allait : état du bloc calculé à partir des fichiers présents, sans colonne Statut ; case inconnue qui bloque la génération ; piège des droits repéré (« pas de modèle » affiché à tort) ; recette à la fin de chaque fonction ; plan enregistré sans rien effacer ; tâche 0.4 ajoutée (ramener main dans la branche avant de s'inspirer de clubs).
Ce que j'ai fait corriger : l'agent avait lu src/fiche-club/ au lieu de src/clubs/ (ancien prompt) : corrigé à l'enregistrement. Questions encore ouvertes : action en corbeille ou annulée, note de bas de page, logo du PDF.
Tests : 0 lancés, 0 réussis (cadrage)
Fichiers modifiés : docs/backlog.md
Build refait : pas nécessaire
Commit : 469d5c1 sur feature/convention

## Tâche C7 — Ramener main dans la branche de la convention (manuel)

Date : 2026-10-22
Agent : aucun (fait à la main)
Prompt : sans objet (tâche 0.4 du plan : git merge origin/main dans feature/convention)

Note /5 : sans objet
Ce qui allait : un seul conflit, dans REVIEW_LOG.md (fiches ajoutées au même endroit) ; CLAUDE.md fusionné automatiquement ; fiche-club retiré et jeton plus affiché dans clubs, comme sur main.
Ce que j'ai fait corriger : conflit réglé en gardant les deux séries de fiches ; fiches de la convention renommées C1 à C6 pour ne plus entrer en collision avec les autres missions.
Tests : 180 lancés, 180 réussis
Fichiers modifiés : REVIEW_LOG.md (résolution du conflit), plus les fichiers venus de main
Build refait : pas nécessaire (sources de la convention inchangées)
Commit : 46621e8 sur feature/convention

## Tâche C8 — Audit de sécurité avant le développement de la convention

Date : 2026-10-22
Agent : @auditeur-securite
Prompt : tâche 0.3 du plan : examiner pdfmake (version figée, SRI, chargement au clic), l'envoi des PDF en pièce jointe, « Voir la convention » sans jeton visible, le dépôt du PDF signé, les données de personnes et les règles d'accès ; dire risques, gravité, précautions et tests à prévoir

Note /5 : sans objet
Ce qui allait : audit précis, avec les numéros de ligne ; 6 points évalués ; 15 tests proposés (jeton jamais dans la console ni dans une adresse, pdfmake chargé au clic avec SRI, refus des faux PDF) ; ce qui n'est pas vérifiable depuis le dépôt clairement signalé ; aucun fichier modifié.
Ce que j'ai fait corriger : rien. Décisions : PDF signé de 10 Mo au maximum ; « Voir » par un fichier ouvert depuis la mémoire (adresse blob:, sans jeton), déjà prouvé par l'essai C2 ; contrôle de l'extension, du type et du début %PDF- du fichier signé. DT confirmé côté Utilisateurs. À faire : corriger convention.md, backlog.md (0.4 faite) et .gitignore (.env).
Tests : 0 lancés, 0 réussis (audit en lecture seule)
Fichiers modifiés : aucun
Build refait : pas nécessaire
Commit : aucun (fiche seule)

## Tâche C9 — Note UX de la convention corrigée après l'audit

Date : 2026-10-22
Agent : @designer-ux
Prompt : corriger docs/ux/convention.md après l'audit : boutons « Voir » (PDF ouvert depuis la mémoire, sans jeton visible) au lieu de liens ; contrôle du fichier signé (extension, type, début %PDF-, vide, 10 Mo au maximum) avec ses messages

Note /5 : sans objet
Ce qui allait : un seul fichier modifié ; les deux décisions appliquées partout où la note parlait de lien ; message ajouté pour le fichier vide ; risque de blocage de l'onglet blob: signalé.
Ce que j'ai fait corriger : rien. À faire au développement : ordre des contrôles vide → taille → extension → type → %PDF- (l'agent avait mis « vide » en 4e position) ; tester l'ouverture blob: après chargement dans Grist DEV (S7).
Tests : 0 lancés, 0 réussis (note)
Fichiers modifiés : docs/ux/convention.md
Build refait : pas nécessaire
Commit : 468aa36 sur feature/convention

## Tâche C10 — Backlog de la convention mis à jour après S0, .env ignoré

Date : 2026-10-22
Agent : Claude sans agent
Prompt : marquer comme faites les tâches 0.2 (adresse du club : colonne Adresse, Siege = Oui/Non), 0.3 (audit et ses décisions) et 0.4 (main ramené dans la branche) dans docs/backlog.md ; ajouter l'adresse du club aux blocages de la génération ; ajouter .env à .gitignore

Note /5 : sans objet
Ce qui allait : seuls les deux fichiers demandés modifiés ; adresse du club ajoutée aux blocages à trois endroits (règle, tâche 3.3, recette R4) ; contradiction sur Siege repérée et signalée au lieu d'être corrigée sans accord.
Ce que j'ai fait corriger : la ligne « Réponses intégrées » sur Structures.Siege, alignée sur la note de la tâche 0.2.
Tests : 0 lancés, 0 réussis (documentation)
Fichiers modifiés : docs/backlog.md, .gitignore
Build refait : pas nécessaire
Commit : a424826 sur feature/convention

## Tâche C11 — Relecture des règles d'accès de la convention

Date : 2026-10-22
Agent : @auditeur-securite
Prompt : relire, avant de les poser dans Grist DEV7, les règles d'accès proposées pour Conventions et Modeles_convention, et dire ce qu'il faut vérifier dans Contacts, Agences, Structures et Communes ; donner les essais « Voir en tant que »

Note /5 :
Ce qui allait : défaut réel trouvé (une convention aurait pu être déplacée vers une autre région) ; garde contre les DR ou DT vides ; vérifications de Contacts, Agences, Structures et Communes listées ; essais précis.
Ce que j'ai fait corriger : sa correction newRec.Action.DR ne marche pas (une règle Grist ne suit pas une référence) : remplacée par newRec.DR et newRec.DD, prouvés par la création d'un contact en tant que Régional.
Tests : 0 lancés, 0 réussis (relecture en lecture seule)
Fichiers modifiés : aucun
Build refait : pas nécessaire
Commit : aucun (fiche seule)

## Tâche C12 — Tables, colonnes et règles d'accès de la convention dans Grist DEV7 (manuel)

Date : 2026-10-22
Agent : aucun (fait à la main dans Grist)
Prompt : sans objet (tâches S1 du plan)

Note /5 : sans objet
Ce qui allait : tables Modeles_convention (3 lignes) et Conventions créées ; colonnes Contacts.Nom_complet et Structures.Adresse ajoutées ; règles posées sur les deux tables, avec un refus final ; 6 essais « Voir en tant que » réussis (Régional, Départemental, ANS, National).
Ce que j'ai fait corriger : colonne Conventions.DD qui pointait vers DR au lieu de DD ; conditions newRec.Action.DR et newRec.Action.DD remplacées par newRec.DR et newRec.DD ; règle de refus final ajoutée aux deux tables.
Tests : 6 essais manuels, 6 réussis ; lignes d'essai supprimées
Fichiers modifiés : aucun dans le dépôt
Build refait : pas nécessaire
Commit : aucun (fiche seule)

## Tâche C13 — Texte d'un modèle de convention vers contenu pdfmake (S2, tâche 2.1)

Date : 2026-10-22
Agent : dev-backend
Prompt : tâche 2.1 du plan, syntaxe relevée dans les 3 modèles (préparé dans le projet Claude)

Note /5 : sans objet
Ce qui allait : fonction pure conventionVersContenuPdf(texte) ajoutée à la fin de src/actions-dashboard/script.js, avec 3 fonctions d'aide (conventionBlocs, conventionRuns, conventionTexte) ; titres, retraits, listes à puces et numérotées, gras, italique, souligné, exposant, liens (texte puis adresse), notes rangées à la fin ; styles nommés seulement (titre1, titre2, titre3, titre, paragraphe, retrait, liste, note) ; 11 points ambigus signalés ; aucun écran ni test touché.
Ce que j'ai fait corriger : rien ; validé : retour à la ligne simple gardé dans le paragraphe, ligne entièrement en gras = titre, titres sans niveau.
Tests : npm test 180/180 réussis (rien de cassé) ; la nouvelle fonction n'est pas encore testée (testeur à suivre) ; exposant et souligné de pdfmake 0.3.3 à vérifier sur une page d'essai à la tâche PDF
Fichiers modifiés : src/actions-dashboard/script.js, actions-dashboard.html
Build refait : oui
Commit : ccc3dcd

## Tâche C14 — Tests de la conversion du texte d'un modèle vers pdfmake (S2, tâche 2.2)

Date : 2026-10-22
Agent : testeur
Prompt : 18 cas tirés des 3 modèles (préparé dans le projet Claude)

Note /5 : sans objet
Ce qui allait : nouveau fichier de test, 22 tests (les 18 cas demandés, dont certains en 2 ou 3 parties, plus un cas 2c ajouté et signalé) ; comparaison de la structure complète ; aucun bug trouvé ; src/ non touché.
Ce que j'ai fait corriger : l'agent a lancé lui-même node --test, ce qui ne remplace pas npm test lancé par Hanta ; fichier renommé en test/convention-modele.test.js, nom prévu au backlog (commit 2198a5b) ; les messages des commits af85b34 et 4ae3289 disent « tâche 2.1 » au lieu de 2.2.
Tests : npm test 202/202 réussis
Fichiers modifiés : test/convention-modele.test.js (créé sous le nom test/convention.test.js, puis renommé)
Build refait : pas nécessaire (src/ inchangé)
Commit : af85b34

## Tâche C15 — Remplissage des cases du modèle de convention (S2, tâche 2.3)

Date : 2026-10-22
Agent : dev-backend
Prompt : tâche 2.3 du plan, pointillés laissés en vrais points (décision du 2026-10-22)

Note /5 : sans objet
Ce qui allait : conventionVersContenuPdf(texte, valeurs) remplit les cases après l'analyse (une valeur n'est jamais relue comme du Markdown, la mise en forme est gardée) ; nouvelle fonction conventionCasesManquantes(texte, valeurs) ; \[ imprime un crochet ; fonction d'aide conventionValeurDeCase ; pointillés non touchés ; rien lancé par l'agent.
Ce que j'ai fait corriger : rien ; points signalés pour le testeur : tout texte entre crochets est une case ([x], [1]), \] non géré, valeur avec retour à la ligne non vérifiée dans pdfmake ; le blocage de la génération se fera à l'écran avec conventionCasesManquantes.
Tests : npm test 202/202 réussis (rien de cassé) ; les nouvelles fonctions ne sont pas encore testées (testeur à suivre)
Fichiers modifiés : src/actions-dashboard/script.js, actions-dashboard.html
Build refait : oui
Commit : b0f593b

## Tâche C16 — Tests du remplissage des cases (S2, tâche 2.4)

Date : 2026-10-22
Agent : testeur
Prompt : 11 cas du remplissage des cases (préparé dans le projet Claude)

Note /5 : sans objet
Ce qui allait : 22 tests ajoutés dans test/convention-modele.test.js (44 au total dans ce fichier) ; cases dans paragraphe, gras, titre, liste, retrait et note ; caractères spéciaux ; apostrophe typographique ; cases vides ; \[ ; liens et notes non remplacés ; liste des cases manquantes ; clés comme constructor ; aucune commande lancée par l'agent.
Ce que j'ai fait corriger : rien ; un test ajouté en plus (clé constructor écrite dans l'objet) gardé ; valeur 0 et case vide [ ] non testées (absentes des modèles).
Tests : npm test 224/224 réussis
Fichiers modifiés : test/convention-modele.test.js
Build refait : pas nécessaire (src/ inchangé)
Commit : a7e8583

## Tâche C17 — Description du PDF de la convention pour pdfmake (S2, tâche 2.5)

Date : 2026-10-22
Agent : dev-backend
Prompt : tâche 2.5 du plan, repères {saut-de-page}, {signatures} et {signatures:lieu-date}, logo facultatif (Q-C ouverte)

Note /5 : sans objet
Ce qui allait : repères reconnus seuls sur leur ligne ; signatures en deux colonnes (organisation sportive à gauche, France Travail à droite) remplies par les cases, d'un seul tenant ; notes renumérotées dans l'ordre du premier appel, textes à la fin (provisoire, Q-A) ; nouvelles fonctions conventionProblemesNotes et conventionDocumentPdf (A4, « Page X sur Y », logo seulement si image data:image/) ; réglages regroupés dans CONVENTION_MISE_EN_PAGE ; rien lancé par l'agent.
Ce que j'ai fait corriger : rien ; points signalés : note définie deux fois = la première gardée, repères non reconnus dans un retrait, page blanche possible si {saut-de-page} est en dernier, hauteur des signatures à régler en 7.6, noms des cases avec apostrophe typographique.
Tests : npm test 224/224 réussis (rien de cassé) ; les nouvelles fonctions ne sont pas encore testées (testeur à suivre)
Fichiers modifiés : src/actions-dashboard/script.js, actions-dashboard.html
Build refait : oui
Commit : 7e951b4

## Tâche C18 — Tests de la description du PDF (S2, tâche 2.6)

Date : 2026-10-22
Agent : testeur
Prompt : 12 cas de la tâche 2.6 (préparé dans le projet Claude)

Note /5 : sans objet
Ce qui allait : 19 tests ajoutés (63 dans test/convention-modele.test.js) ; saut de page, signatures avec et sans valeurs, variante lieu-date, repères dans un retrait, renumérotation des notes, problèmes de notes, document A4, pied « Page 1 sur 3 », logo accepté ou ignoré, réglages de CONVENTION_MISE_EN_PAGE ; un test ajouté en plus (copie des réglages) gardé ; données fictives.
Ce que j'ai fait corriger : rien ; l'agent a lancé grep et cat >> malgré la consigne (sans danger) ; à faire plus tard : ajouter CONVENTION_MISE_EN_PAGE à EXPORTED dans test/helpers/widget.js, car le test 18 relit le script avec une expression régulière (fragile).
Tests : npm test 243/243 réussis
Fichiers modifiés : test/convention-modele.test.js
Build refait : pas nécessaire (src/ inchangé)
Commit : c7a780e

## Tâche C19 — Lecture des tables de la convention (S3, tâche 3.1)

Date : 2026-10-22
Agent : dev-backend
Prompt : tâche 3.1 du plan, lecture seule

Note /5 : sans objet
Ce qui allait : Contacts, Conventions et Modeles_convention ajoutées à TABLES (une ligne, plus un commentaire) ; données dans state.raw ; une table refusée ou absente donne une liste vide grâce au try/catch existant de load(), sans gêner les autres tables ; aucune valeur dans la console ; rien lancé par l'agent.
Ce que j'ai fait corriger : rien ; à noter pour le README (10.2) : noms, e-mails et téléphones de Contacts et texte des modèles lus à chaque chargement.
Tests : npm test 243/243 réussis (rien de cassé) ; la lecture des 3 tables n'est pas encore testée (testeur à suivre)
Fichiers modifiés : src/actions-dashboard/script.js, actions-dashboard.html
Build refait : oui
Commit : 977d16b

## Tâche C20 — Tests de la lecture des tables de la convention (S3, tâche 3.2)

Date : 2026-10-22
Agent : testeur
Prompt : 4 cas de la tâche 3.2 (préparé dans le projet Claude)

Note /5 : sans objet
Ce qui allait : nouveau fichier test/convention-donnees.test.js, 11 tests (lecture de chaque table, refus de chaque table sans gêner Actions, profil ANS avec les 3 tables refusées, console sans valeur de ligne) ; loadWidget() accepte des options facultatives fetchTable et console, sans changement pour les autres tests ; rien lancé par l'agent.
Ce que j'ai fait corriger : colonnes fictives inventées (Reference…) remplacées par les vrais noms de colonnes ; limite connue : seul le refus par erreur est simulé.
Tests : npm test 254/254 réussis
Fichiers modifiés : test/convention-donnees.test.js (créé), test/helpers/widget.js
Build refait : pas nécessaire (src/ inchangé)
Commit : 9a85dc5

## Tâche C21 — État du bloc Convention et blocage de la génération (S3, tâche 3.3)

Date : 2026-10-22
Agent : dev-backend
Prompt : tâche 3.3 du plan, puis correction (ville du club)

Note /5 : sans objet
Ce qui allait : conventionEtat (À générer, Générée, Signée, Sans modèle, Droits insuffisants ; Signée l'emporte ; plus petit id gardé en cas de doublon) et conventionBlocage (agence, club, dispositif, adresse, dans cet ordre, avec message) ; state.tablesRefusees rempli par load() (noms de tables seulement) ; 3 messages proposés (agence, club, dispositif), à revoir en 4.1 ; rien lancé par l'agent.
Ce que j'ai fait corriger : le widget ne lisait pas Communes (blocage « adresse » permanent) ; colonne formule Structures.Ville (Texte) créée dans DEV7, et adresse du club lue dans Adresse, Code_postal et Ville ; à créer aussi dans TEST puis en PROD avant la fusion. Q-B (corbeille, annulée) toujours ouverte.
Tests : npm test 254/254 réussis (rien de cassé) ; les nouvelles fonctions ne sont pas encore testées (testeur à suivre)
Fichiers modifiés : src/actions-dashboard/script.js, actions-dashboard.html
Build refait : oui
Commit : 63a5d62

## Tâche C22 — Tests de l'état du bloc et du blocage (S3, tâche 3.4)

Date : 2026-10-22
Agent : testeur
Prompt : 8 cas de la tâche 3.4 (préparé dans le projet Claude)

Note /5 : sans objet
Ce qui allait : tests ajoutés dans test/convention-donnees.test.js : les 5 états, Signée l'emporte, pièces jointes vides, doublon (plus petit id gardé), blocage par élément avec message exact, ordre du blocage, tout renseigné, state.tablesRefusees après un vrai load() ; 3 tests ajoutés en plus (autre dispositif, refus de Contacts sans effet, convention d'une autre action ignorée), gardés ; données fictives avec les vrais noms de colonnes.
Ce que j'ai fait corriger : rien ; décompte de l'agent inexact (22 annoncés, 23 de plus selon npm test) ; deux echo lancés par erreur, sans effet ; code postal « 0 » non testé (Code_postal est du texte).
Tests : npm test 277/277 réussis
Fichiers modifiés : test/convention-donnees.test.js
Build refait : pas nécessaire (src/ inchangé)
Commit : b7b703e

## Tâche C23 — Mise à jour de la note UX de la convention (S4, tâche 4.1)

Date : 2026-10-22
Agent : designer-ux
Prompt : tâche 4.1 du plan, puis correction avec les réponses de Hanta

Note /5 : sans objet
Ce qui allait : droits des profils FT ; 5 états dont « Droits insuffisants » ; 4 messages de blocage exacts, un seul à la fois, bouton grisé avec aria-disabled et aria-describedby, help-block dans role="status" ; « Ajouter un contact » retiré, message si le club n'a aucun contact ; phrase d'aide à l'état « Générée » (imprimer, compléter, signer, déposer) ; écarts avec la maquette listés.
Ce que j'ai fait corriger : pas de lecture du profil (tous les profils refusés, ANS compris, voient « Droits insuffisants ») ; blocage sur les données enregistrées ; « Enregistrer » actif sans contact ; la note l'emporte sur la maquette, qui n'est plus à jour ; note marquée validée ; l'agent a lancé grep et ls (lecture seule) malgré la consigne.
Tests : sans objet (documentation)
Fichiers modifiés : docs/ux/convention.md
Build refait : pas nécessaire
Commit : e47240b

## Tâche C24 — Bloc « Convention » dans la fiche d'action (S4, tâche 4.2)

Date : 2026-10-23
Agent : dev-interface
Prompt : tâche 4.2 du plan, lecture A (aucun bouton, aucun message de blocage)

Note /5 : 5
Ce qui allait : bloc en bas de la fiche, style des autres blocs (edit-card, section-head, edit-fields) ; conventionEtat réutilisée sans modification ; textes des 5 états copiés de la note ; aucun bouton, aucun clic, aucune lecture du profil ; classes convention-fields et convention-aide ; couleur --muted déjà définie dans le tableau de bord (variable du design system) ; aucune commande lancée par l'agent ; texte ajouté signalé.
Ce que j'ai fait corriger : rien. Texte ajouté par l'agent et accepté : « Convention générée. » et « Convention signée. » quand la date est vide (à reporter dans docs/ux/convention.md en 10.2).
Tests : 277 passés, 0 échec (npm test). Vérifié à l'écran dans DEV7 : « Aucune convention générée » et « Pas encore de modèle » s'affichent. Non vus à l'écran : Générée, Signée (format de la date) et Droits insuffisants (l'ANS ne voit pas le tableau de bord), à couvrir en 4.3.
Fichiers modifiés : src/actions-dashboard/script.js, src/actions-dashboard/style.css, actions-dashboard.html
Build refait : oui
Commit : 5a38b41

## Tâche C25 — Tests du bloc « Convention » (S4, tâche 4.3)

Date : 2026-10-23
Agent : testeur
Prompt : tâche 4.3 du plan, 7 points à tester, puis correction sur l'écart de comptage

Note /5 : 5
Ce qui allait : nouveau fichier test/convention-bloc.test.js ; les 7 points couverts (5 états avec textes exacts, date en jour/mois/année, date vide, Signée l'emporte, aucun élément cliquable, aucun message de blocage, classes autorisées) et la place du bloc dans la fiche ; un commentaire par test sur ce qui le ferait échouer ; jeu d'essai du blocage vérifié avant usage ; dates à midi UTC ; données fictives ; src/ non modifié ; aucune commande lancée.
Ce que j'ai fait corriger : rien dans le code. Compte rendu faux sur le nombre de tests (28 annoncés, 27 réels) : l'agent avait retiré 2 tests sans le dire (un doublon, un test qui comparait une liste à elle-même).
Tests : 304 passés, 0 échec (npm test) ; 27 passés sur 27 (node --test test/convention-bloc.test.js).
Fichiers modifiés : test/convention-bloc.test.js (nouveau)
Build refait : pas nécessaire (src/ inchangé)
Commit : e4691fa

## Tâche C26 — Recette R1 de la convention : cas de test et campagne C01

Date : 2026-10-23
Agent : recetteur (écriture des cas), puis Hanta (relecture et exécution)
Prompt : cas de recette de R1 (affichage du bloc), puis correction des valeurs selon les listes du carnet

Note /5 : 5
Ce qui allait : 15 cas en lecture seule, textes copiés de la note UX, données d'essai précises (dates à 12:00), « Droits insuffisants » non jouable et renvoyé aux tests de C25, absence de boutons signalée comme normale.
Ce que j'ai fait corriger : ID (CONV-01 à 15), Fonction, Type et Automatisable aux valeurs du carnet, 3 tests de fumée au lieu de 5, Rejouable_PROD à Oui, pas de nouvelle DR ni DD, pas de comptes inventés, VoiceOver. Corrigé ensuite à la main : Automatisable à Non pour CONV-08 à 15, ligne sur le mode sombre.
Tests : campagne C01 jouée en local sur DEV7 (TEST occupé par la recette des contacts), version 7e951b4 : 15 cas OK sur 15. npm test : 368 passés sur 368, après la fusion de main.
Fichiers modifiés : docs/tests/cas-de-test-convention.tsv, docs/tests/cas-de-test-convention.md
Build refait : pas nécessaire
Commit : cas de test commités avant la fusion
Reste à faire : campagne C02 sur TEST, jouée par un autre développeur. Mode sombre du tableau de bord à traiter à part.

## Tâche C27 — Bouton « Générer » et fenêtre Convention en lecture seule (S5, tâche 5.1a)

Date : 2026-10-23
Agent : dev-interface
Prompt : tâche 5.1a (découpage de la 5.1), puis correction du style de la fenêtre

Note /5 : 5
Ce qui allait : bouton seulement à l'état À générer ; bouton grisé avec aria-disabled et aria-describedby, un seul message de blocage, texte caché ; fenêtre en lecture seule (club, SIRET, siège, agence, adresse), valeurs échappées ; fermeture par Fermer et Échap, focus rendu au bouton, focus gardé dans la fenêtre ; périmètre respecté (pas de signataires, pas de bloc Modèle et Année) ; 4 tests en échec annoncés à l'avance.
Ce que j'ai fait corriger : la ligne CSS des fenêtres Ajout et Suppression, modifiée alors qu'un test la vérifie au caractère près ; remise à l'identique, règle séparée pour #conventionModal. Libelle_agence dite « confirmée par le backlog » à tort : la colonne était déjà utilisée dans le code (vérifié).
Tests : 368 tests, 364 passés, 4 échecs attendus (tests de la 4.2, mis à jour en C28). Vérifié à l'écran dans DEV7 : bouton grisé et message pour A7, ouverture de la fenêtre pour A1, Échap et focus, aucun bouton pour A2 à A6.
Fichiers modifiés : src/actions-dashboard/index.html, script.js, style.css, actions-dashboard.html
Build refait : oui
Commit : 5ebcf04

## Tâche C28 — Tests du bouton « Générer » et de la fenêtre (S5, tâche 5.3a)

Date : 2026-10-23
Agent : testeur
Prompt : tâche 5.3a, mise à jour des 4 tests de la 4.2 et tests de la 5.1a

Note /5 : 5
Ce qui allait : 4 tests mis à jour sans suppression ; 26 tests ajoutés dans test/convention-fenetre.test.js, chacun avec son commentaire « Échoue si… » ; helpers/widget.js non modifié ; nombre annoncé égal au nombre réel.
Ce que j'ai fait corriger : rien. Constats à traiter : message « Renseignez le dispositif » impossible à afficher (note UX, en 10.2) ; test « aucun libellé de bouton » devenu fragile (en 5.3b) ; tests Tab et Maj+Tab à adapter quand la 5.1b ajoutera des champs.
Tests : 394 passés, 0 échec (npm test).
Fichiers modifiés : test/convention-bloc.test.js, test/convention-fenetre.test.js (nouveau)
Build refait : pas nécessaire (src/ inchangé)
Commit : c937fe8

## Tâche C29 — Champs de la fenêtre Convention, sans enregistrement (S5, tâche 5.1b)

Date : 2026-10-23
Agent : dev-interface
Prompt : tâche 5.1b, plus trois réponses de Hanta (bouton Enregistrer seul, brouillon sans contrôle des champs obligatoires, « Fonction non renseignée ») et le message de l'année

Note /5 : 4
Ce qui allait : trois blocs, liste des signataires du club, fonction en lecture seule, « Directeur d'agence » prérempli, pied sans « Générer », contrôle de l'année seul, point d'appel conventionEnregistrer pour la 5.2 ; questions posées au lieu d'inventer ; 5 tests en échec annoncés à l'avance.
Ce que j'ai fait corriger : bug du message d'erreur de l'année visible dès l'ouverture (classe help-block avec invalid-feedback), voir C30.
Tests : 389 passés, 5 échecs annoncés (mis à jour en C31). Vérifié à l'écran dans DEV7 : trois blocs, signataires, fonction, année refusée puis acceptée au clic suivant, Échap.
Fichiers modifiés : src/actions-dashboard/script.js, style.css, actions-dashboard.html
Build refait : oui
Commit : 940d8b9

## Tâche C30 — Bug : message d'erreur de l'année toujours visible

Date : 2026-10-23
Agents : relecteur (cause), testeur (test qui échoue), dev-interface (correction)
Prompt : cycle d'un bug

Note /5 : 5
Ce qui allait : cause trouvée par comparaison avec la fenêtre d'ajout (help-block en plus), alerte du haut vérifiée non concernée ; cause confirmée par Hanta dans l'inspecteur (règle .help-block.invalid-feedback) ; test en échec avant la correction (6 échecs), vert après (5 échecs restants, attendus).
Ce que j'ai fait corriger : rien. dev-interface a affirmé « le message n'est plus visible » sans l'avoir vérifié, et a décrit à tort qu'un champ vide affiche l'erreur.
Tests : 395 tests, 390 passés, 5 échecs attendus. Vérifié à l'écran : aucun message à l'ouverture, message seulement pour une année invalide.
Fichiers modifiés : src/actions-dashboard/script.js, test/convention-fenetre.test.js
Build refait : oui
Commit : 940d8b9 (code) et aac4996 (test)

## Tâche C31 — Note UX à jour et tests de la fenêtre (S5, tâche 5.3b, première partie)

Date : 2026-10-23
Agents : designer-ux (note), Claude Code sans agent (décisions D-4 à D-6), testeur (tests)
Prompt : décisions du jour reportées dans la note, puis tests de la 5.1b

Note /5 : sans objet
Ce qui allait : note datée « mis à jour le 2026-10-23 », décisions séparées des propositions (D-3 à décider avant S7) ; 19 tests ajoutés, 6 mis à jour, 0 retiré ; test fragile « aucun libellé de bouton » vraiment corrigé ; écart code/note signalé sans être caché.
Ce que j'ai fait corriger : rien. Le testeur a lancé ses deux fichiers de test lui-même malgré la consigne. Reste à faire : la phrase « obligatoires pour générer la convention » dans le code (écart signalé par le testeur), le nom du test « deux blocs », le commentaire de keepFocusInConvention.
Tests : 414 passés, 0 échec (npm test).
Fichiers modifiés : docs/ux/convention.md, test/convention-fenetre.test.js, test/convention-bloc.test.js
Build refait : pas nécessaire
Commit : Commit : 5872cd1 (note) et aac4996 (tests)