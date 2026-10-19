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
Commit : sur feature/bandeau-commun

## Tâche 2 — Ajout du bandeau commun au tableau de bord

Date : 2026-10-16
Agent : @dev-interface
Prompt : ajouter la ligne du bandeau dans le  de src/actions-dashboard/index.html, après l'API Grist, selon docs/ux/bandeau-commun.md

Note /5 :
Ce qui allait : une seule ligne ajoutée au bon endroit, rien d'autre touché ; l'agent n'a pas contourné le refus de Claude Code et l'a signalé clairement.
Ce que j'ai fait corriger : rien. Build, tests et git status lancés à la main (commande refusée à l'agent à cause du script externe).
Tests : 172 lancés, 172 réussis
Fichiers modifiés : src/actions-dashboard/index.html, actions-dashboard.html
Build refait : oui
Commit : sur feature/bandeau-commun

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
Commit : feat: charger le bandeau publié (hantaranui) et aligner les titres sur le menu

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
Commit : docs: mettre à jour les notes du bandeau commun (adresse, titres)
