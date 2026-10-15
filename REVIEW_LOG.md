
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

Note /5 :
Ce qui allait : une seule tâche, un seul fichier créé ; h1 conservé pour l'accessibilité ; data-titre « Dashboard » conservé ; 13 vérifications visuelles, dont la hauteur du tableau (100vh) et l'en-tête collant.
Ce que j'ai fait corriger : rien.
Tests : aucun lancé (note seulement)
Fichiers modifiés : docs/ux/bandeau-commun.md (créé)
Build refait : pas nécessaire
Commit : sur feature/bandeau-commun
