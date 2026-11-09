
# Backlog — Widgets Grist — Partenariat simplifié

| Priorité | Tâche                                                                                                                                                                  | Agent                                                               | Statut   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | -------- |
| Haute     | clubs : gérer les contacts dans la fiche du club (ajouter, modifier, supprimer avec confirmation), chacun sur son périmètre ; règle d'accès à créer sur Contacts | auditeur-securite, designer-ux, dev-backend, dev-interface, testeur | En cours |
| Moyenne   | clubs : filtres Région → Département dépendants, sur le modèle des filtres DR → DD → agence du tableau de bord (remarqué le 21/10/2026)                         | relecteur, testeur, dev-interface                                   | À faire |
| Basse     | clubs : corriger les commentaires de src/clubs/ qui parlent encore de fiche-club (à faire pendant la gestion des contacts)                                             | dev-interface                                                       | À faire |

## Sprint E4 — 5ème statut "Non retenu"

Besoin d'origine : en tant que directeur d'agence, connaître les actions financées AAP 2026-2027 et indiquer les actions refusées faute de budget à réaliser. Distinguer "refusées" (FT ne souhaite pas faire l'action avec ce club) de "non financées" (pas de financement). Pour ce sprint, on ne traite QUE le refus (statut "Non retenu" + raison) ; le cas "non financée faute de budget" n'est pas couvert, à traiter plus tard si besoin (probablement via un autre statut, pas une raison supplémentaire).

Déjà fait par Hanta dans Grist (DEV7 et TEST) : colonne Actions.Statut, choix "Non retenu" ajouté. Nouvelle colonne technique Actions.Raison_du_refus (Choice, liste extensible), 4 raisons déjà définies : "Non pertinent pour les besoins du territoire", "Pas de contact avec la structure", "Dossier ne correspondant pas au cahier des charges", "Opération déjà programmée avec une autre structure".

Décisions de Hanta (réponses aux questions bloquantes du chef de projet) :
- E4-1 (Q1) : nom technique exact de la colonne : Raison_du_refus.
- E4-2 (Q2) : quand on quitte "Non retenu" pour un autre statut, Raison_du_refus est effacée (même logique que Periode_approx aujourd'hui hors "À confirmer").
- E4-3 (Q3) : la raison est OBLIGATOIRE pour enregistrer un statut "Non retenu".
- E4-4 (Q4) : incohérences venant de l'extérieur du widget (import, saisie directe dans Grist) : affichage TEL QUEL, sans blocage ni correction automatique. Une valeur de raison hors liste est ajoutée temporairement à la liste déroulante affichée, pour ne pas la perdre à l'enregistrement (proposition du chef de projet, acceptée).
- E4-5 (Q5) : un statut inconnu (non géré explicitement par le code) doit afficher AUCUN champ, jamais un sélecteur de date par défaut comme c'est le cas actuellement par erreur.
- E4-6 (Q6) : PAS de 5ème raison ajoutée pour ce sprint. Le besoin "non financée faute de budget" n'est pas traité ici. Techniquement, si une 5ème raison est ajoutée plus tard directement dans Grist par Hanta, le widget la lira automatiquement (liste dynamique, loadColumnChoices) : aucun changement de code nécessaire pour cela.
- E4-7 (Q8) : les "actions financées AAP 2026-2027" sont hors périmètre de ce sprint (filtres Financement déjà existants, non liés au statut).
- E4-8 (Q10) : nouvelle branche feature/statut-non-retenu, créée depuis main (pas depuis feature/convention, non fusionnée et à ne pas mélanger).

Questions encore ouvertes (non bloquantes, à trancher avec designer-ux/dev-interface) : Q7 (affichage tableau/synthèse), Q9 (droits d'écriture sur Raison_du_refus par profil), Q11 (largeurs exactes fr vs px), Q12 (composant liste du design system), Q13 (ordre de déploiement Grist/widget pour la colonne).

### Réponses de Hanta aux questions du §12 de docs/ux/statut-non-retenu.md (designer-ux)

- E4-9 (A, B, C) : confirmé, les trois effacements sont corrects. Passer à "Non retenu" efface la date (comme "Annulée") ; un statut inconnu voit aussi ses dates effacées ; une raison déjà remplie sur un autre statut est effacée sans avertir l'agent (cohérent avec E4-2).
- E4-10 (D) : OUI, ajouter la raison du refus à l'export CSV.
- E4-11 (E) : OUI, bloquer l'enregistrement d'une action "Non retenu" sans raison, même si l'agent modifie autre chose (cohérent avec E4-3, raison obligatoire).
- E4-12 (F) : suivre la structure d'erreur de la fenêtre d'ajout d'une action existante, pas une nouvelle structure du design system.
- E4-13 (G) : couleur (--ft-color-background-neutral-weak), seuil mobile (560 ou 700px) et largeurs de cartes (.85fr/1.15fr) acceptés tels quels pour démarrer, à confirmer visuellement une fois codé.
- E4-14 : décision de Hanta suite au travail de dev-backend. hasRaisonColumn() est accepté (même principe que Code_MEE, protection contre une colonne absente). PAS de liste de secours ajoutée pour Raison_du_refus, ni "Non retenu" dans FALLBACK_CHOICES des statuts : risque accepté pour l'instant (fonctionnalité récente, pas de donnée réelle encore en jeu), à surveiller comme dette technique si un problème de lecture Grist survient en pratique.
