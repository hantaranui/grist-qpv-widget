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