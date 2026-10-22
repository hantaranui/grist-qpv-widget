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


## Tâche 9 — Maquette de la convention de partenariat

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


## Tâche 10 — Essai technique : téléchargement et pièce jointe depuis un widget

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


## Tâche 11 — Maquette de la convention mise à jour après les retours du chef

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


## Tâche 12 — Maquette de la convention : re-générer et dépôt direct du fichier signé

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

## Tâche 13 — Maquette de la convention alignée sur les réponses du client

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

## Tâche 14 — Cadrage du développement de la convention

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