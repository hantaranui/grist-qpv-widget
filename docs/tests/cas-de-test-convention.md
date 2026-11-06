# Nettoyage du carnet de recette Convention (2026-11-04)

Passe de nettoyage faite par le recetteur sur demande de Hanta. Elle ne touche que `cas-de-test-convention.tsv` et ce fichier. Les numéros ne sont jamais réutilisés ni changés : il y a des trous (cas supprimés ou regroupés) et les nouveaux cas consolidés commencent à CONV-227.

## Les chiffres

| Quoi | Nombre |
| --- | --- |
| Cas avant le nettoyage | 222 |
| Cas supprimés (obsolètes, remplacement vérifié) | 38 |
| Cas regroupés dans un cas consolidé (donc retirés) | 51 |
| Nouveaux cas consolidés (CONV-227 à 254) | 28 |
| Cas réécrits (étapes et résultat attendu corrigés, sans renvoi) | 47 |
| Cas gardés tels quels (déjà prêts à jouer) | 61 |
| **Cas après le nettoyage** | **161** |
| dont déjà joués par Jean-Louis (intacts) | 25 |
| **dont restant à jouer** | **136** |

Calcul : 222 − 38 − 51 + 28 = 161.

Les phrases des anciennes introductions (« Aucun cas n'a été joué », « contient N cas », « 40 cas obsolètes ») et les listes de numéros des anciennes sections [À CONFIRMER] sont périmées. Les tableaux de données d'essai (colonne « Sert aux cas ») peuvent encore citer d'anciens numéros : les actions d'essai restent valables pour les cas qui les utilisent.

## Trois sortes de cas (décision de Hanta, 2026-11-04)

La colonne `Parcours` (et `Ordre`) du `.tsv` dit qui joue quoi. Un cas déjà fait ou déjà couvert par un test automatique reste dans le carnet comme preuve, mais **personne ne le rejoue**. Le chef de projet revoit l'ensemble avant la livraison au client.

| Parcours | Qui joue | Nombre |
| --- | --- | --- |
| Déjà joué (conservé) | personne (résultat de Jean-Louis) | 25 |
| Recette courte (testeur) | le testeur, environ 2 heures | 14 |
| Couvert par test automatique (ne pas rejouer) | personne (le test automatique, lancé par Hanta avec `npm test`) | 67 |
| Recette approfondie (développeur) | le développeur, après une correction ou avant une grosse livraison | 55 |
| **Total** | | **161** |

### Recette courte : 14 cas, 3 connexions, dans cet ordre

Une seule chaîne par profil, sans retour en arrière. Sur FT National, on enchaîne ; puis une connexion FT Régional ; puis une connexion FT Départemental.

| Ordre | Cas | Profil | Sujet |
| --- | --- | --- | --- |
| 1 | CONV-139 | FT National | Ouverture de la fenêtre Convention allégée |
| 2 | CONV-150 | FT National | Ajouter un contact depuis la fenêtre Convention |
| 3 | CONV-156 | FT National | Fermeture et enregistrement silencieux de la fenêtre Convention |
| 4 | CONV-161 | FT National | Génération du PDF avec les données de l'Évolution 1 |
| 5 | CONV-182 | FT National | Voir la convention dans une pop-up plein écran |
| 6 | CONV-189 | FT National | Télécharger la convention avec son vrai nom |
| 7 | CONV-192 | FT National | Télécharger la convention avec son vrai nom |
| 8 | CONV-240 | FT National | Fermer la pop-up du PDF (état Générée) : fermer la pop-up par la croix |
| 9 | CONV-80 | FT National | Re-génération du PDF de la convention |
| 10 | CONV-81 | FT National | Re-génération du PDF de la convention |
| 11 | CONV-106 | FT National | Dépôt et remplacement du fichier signé de la convention |
| 12 | CONV-107 | FT National | Dépôt et remplacement du fichier signé de la convention |
| 13 | CONV-234 | FT Régional | Droits : FT Régional, parcours complet de la convention : FT Régional, de l'ajout du contact au téléchargement |
| 14 | CONV-235 | FT Départemental | Droits : FT Départemental, parcours complet de la convention : FT Départemental, de l'ajout du contact au téléchargement |

Les cas 80, 81, 106 et 107 se jouent sur des actions déjà générées ou signées préparées à l'avance (voir les données d'essai) : ils n'ont pas à suivre les cas 139 à 240 sur la même action.

### Recette approfondie (55 cas)

CONV-94, CONV-100, CONV-108, CONV-125 à 127, CONV-130, CONV-133, CONV-145, CONV-158 à 159, CONV-167 à 170, CONV-185 à 186, CONV-188, CONV-191, CONV-194, CONV-196 à 197, CONV-202 à 204, CONV-206, CONV-208 à 210, CONV-217, CONV-227 à 233, CONV-236 à 239, CONV-241 à 254.

### Couverts par un test automatique, à ne pas rejouer (67 cas)

CONV-16 à 17, CONV-23 à 24, CONV-46 à 52, CONV-61 à 66, CONV-83 à 84, CONV-86 à 90, CONV-92 à 93, CONV-97, CONV-109 à 115, CONV-117, CONV-120 à 121, CONV-124, CONV-140 à 144, CONV-146 à 149, CONV-151 à 155, CONV-157, CONV-160, CONV-162 à 166, CONV-183 à 184, CONV-187, CONV-190, CONV-193, CONV-195, CONV-205, CONV-207.

**Limite à connaître** : la colonne `Automatisable` et les remarques « Déjà couvert par test/… » viennent de mon brouillon ; je n'ai relu ni lancé ces tests (les noms sont marqués « non relus »). Un test automatique prouve la logique, pas le rendu du PDF ni les droits réels. C'est pourquoi les cas de fumée du rendu (161, 182, 189, 192) restent dans la recette courte. Hanta ou le chef de projet doit confirmer, avec `npm test`, que les tests cités existent et passent avant de ne plus rejouer ces cas.

## Les 25 cas déjà joués (intacts)

Ils ont un vrai résultat de Jean-Louis : CONV-01, CONV-02, CONV-03, CONV-04, CONV-05, CONV-06, CONV-07, CONV-08, CONV-09, CONV-10, CONV-11, CONV-12, CONV-13, CONV-14, CONV-15, CONV-20, CONV-21, CONV-33, CONV-34, CONV-41, CONV-42, CONV-43, CONV-44, CONV-45, CONV-58. Aucune de leurs colonnes n'a été modifiée, sauf `Remarques` où une note « Déjà joué… conservé tel quel malgré… » a été ajoutée pour ceux dont une phrase est dépassée aujourd'hui (CONV-01, 02, 03, 04, 07, 20, 21, 33, 34, 41, 42, 43, 44, 45, 58). Dates : 02/11/2026 pour CONV-01 à 15 ; la date n'est pas renseignée dans l'export de suivi pour CONV-20, 21, 33, 34, 41 à 45 et 58.

## Cas supprimés (38)

Chaque suppression a un cas de remplacement qui couvre le contrôle (ou le comportement n'existe plus du tout).

| Cas supprimé | Pourquoi | Remplacé par |
| --- | --- | --- |
| CONV-18 | le message « Renseignez l'adresse du club dans sa fiche. » et le bouton grisé n'existent plus | CONV-142 |
| CONV-19 | trois blocs, phrase avec astérisque, bouton « Enregistrer les informations » : supprimés | CONV-139 |
| CONV-22 | champs « Modèle utilisé » et « Année » : supprimés | CONV-140 |
| CONV-25 | ancien message « Ajoutez-en un dans la fiche du club… » et bouton « Enregistrer les informations » | CONV-154, CONV-155 |
| CONV-26 | teste le champ « Année » (quatre chiffres) : le champ n'existe plus | aucun (le champ Année n'existe plus) |
| CONV-27 | idem | aucun (le champ Année n'existe plus) |
| CONV-28 | idem | aucun (le champ Année n'existe plus ; l'enregistrement sans champ obligatoire est couvert par 156 et 166) |
| CONV-29 | idem | aucun (le champ Année n'existe plus) |
| CONV-30 | passe par « Enregistrer les informations » et l'année | CONV-156, CONV-169, CONV-170 |
| CONV-31 | idem | CONV-156, CONV-169, CONV-170 |
| CONV-32 | idem | CONV-156, CONV-169, CONV-170 |
| CONV-35 | « Enregistrer les informations » avec « Voir en tant que » | CONV-172 (devenu 235) |
| CONV-36 | « Fermer » : même contrôle que le cas qui le remplace (fermeture immédiate, sans confirmation, focus rendu au bouton) | CONV-156 |
| CONV-37 | « Échap » : idem | CONV-157 |
| CONV-38 | la saisie non enregistrée est perdue : c'est l'inverse aujourd'hui (« Fermer » enregistre en silence) | CONV-156, CONV-157 |
| CONV-39 | clavier avec trois boutons dans le pied | CONV-227 (clavier) |
| CONV-40 | VoiceOver sur les champs « Année » | CONV-229 (VoiceOver, fenêtre) |
| CONV-53 | messages de blocage de champ disparus (plus aucun champ obligatoire) | CONV-166 |
| CONV-54 | idem | CONV-166 |
| CONV-55 | idem | CONV-166 |
| CONV-56 | idem | CONV-166 |
| CONV-57 | idem | CONV-166 |
| CONV-59 | idem | CONV-166 |
| CONV-60 | idem | CONV-166 |
| CONV-67 | trois boutons du pied, « Enregistrer les informations » | CONV-160 |
| CONV-68 | exige un nouvel onglet « blob: » (la pop-up le remplace) | CONV-182, CONV-208, CONV-192 |
| CONV-69 | « aucun onglet vide ne reste ouvert » (la pop-up le remplace) | CONV-207 |
| CONV-73 | ordre de trois boutons, champ « Modèle utilisé » | CONV-227 (clavier) |
| CONV-76 | messages d'erreur de champ (VoiceOver) disparus | CONV-229 (VoiceOver, fenêtre) |
| CONV-78 | effacer « Année », trois boutons du pied | CONV-231 (zoom) |
| CONV-79 | idem | CONV-232 (mobile) |
| CONV-82 | année enregistrée reprise puis remplacée dans la fenêtre : l'année vient de la Campagne | CONV-168 |
| CONV-85 | la saisie abandonnée par « Fermer » n'est plus perdue | CONV-156, CONV-157, CONV-158 |
| CONV-91 | « Re-générer » grisé par l'adresse du club manquante : blocage disparu | CONV-142 |
| CONV-95 | effacer « Année » bloque la génération : plus de champ « Année » | CONV-166 |
| CONV-103 | idem (bouton grisé par l'adresse du club) ; le bouton grisé pour agence manquante est lu dans CONV-244 | CONV-244 (VoiceOver : bouton grisé « Re-générer ») |
| CONV-122 | exige un nouvel onglet « blob: » pour le PDF signé | CONV-184, CONV-208 |
| CONV-123 | un onglet « blob: » ouvert pendant l'envoi (une pop-up aujourd'hui) | CONV-217 |

## Cas consolidés (28 nouveaux cas, 51 anciens retirés)

| Nouveau cas | Sujet | Remplace |
| --- | --- | --- |
| CONV-227, CONV-242, CONV-243 | Clavier (fenêtre, re-génération, pop-up, dépôt) | CONV-101, CONV-134, CONV-173, CONV-218 |
| CONV-228, CONV-244 | VoiceOver : bloc et pop-up (et bouton grisé) | CONV-102, CONV-135, CONV-136, CONV-219, CONV-220 |
| CONV-229, CONV-245 | VoiceOver : fenêtre et ajout de contact | CONV-174, CONV-175, CONV-176 |
| CONV-230, CONV-246 | VoiceOver : attente, réussite, échecs (génération et dépôt) | CONV-74, CONV-75, CONV-77 |
| CONV-231, CONV-247 | Zoom 200 % | CONV-104, CONV-137, CONV-177, CONV-221 |
| CONV-232, CONV-248, CONV-249 | Mobile 375 px | CONV-105, CONV-138, CONV-178, CONV-222 |
| CONV-233 | Mise en page une ou deux colonnes | CONV-179, CONV-180, CONV-181 |
| CONV-234, CONV-250 | FT Régional : parcours complet | CONV-71, CONV-98, CONV-128, CONV-171, CONV-211 |
| CONV-235, CONV-251 | FT Départemental : parcours complet | CONV-72, CONV-99, CONV-129, CONV-172, CONV-212 |
| CONV-236, CONV-252 | Persistance après génération et re-génération | CONV-70, CONV-96, CONV-215 |
| CONV-237, CONV-253 | Persistance après dépôt et remplacement | CONV-131, CONV-132, CONV-216 |
| CONV-238 | « Voir » et « Télécharger » n'écrivent rien | CONV-213, CONV-214 |
| CONV-239 | Dépôt : fichier qui n'est pas un PDF | CONV-116, CONV-118, CONV-119 |
| CONV-240, CONV-254 | Fermer la pop-up (croix, Échap), état Générée | CONV-198, CONV-199 |
| CONV-241 | Fermer la pop-up (croix, Échap), état Signée | CONV-200, CONV-201 |

Découpage (demande de Hanta) : un cas consolidé de plus de 8 étapes est découpé en cas de 5 à 8 étapes, un seul thème chacun, pour isoler un échec sans tout rejouer. Les parties d'un même thème sont groupées dans la colonne « Nouveau cas » ; la première garde le numéro d'origine. CONV-250 et 251 se jouent APRÈS CONV-234 et 235 (même action).

Regroupements retenus : l'accessibilité (clavier, VoiceOver, zoom, mobile, mise en page) qui était dispersée dans 6 recettes ; les droits FT Régional et FT Départemental, répétés à chaque évolution ; la persistance après rechargement ; les fichiers refusés « ce n'est pas un PDF » ; la fermeture de la pop-up. Les cas des autres refus de fichier (vide, trop gros, limite exacte, priorité des messages), des pannes réseau et des logos restent séparés : leurs données ou leurs messages diffèrent.

## Cas réécrits (47)

CONV-23 à 24, CONV-46 à 52, CONV-62 à 64, CONV-66, CONV-80 à 81, CONV-83 à 84, CONV-86 à 89, CONV-92 à 94, CONV-97, CONV-106 à 107, CONV-109, CONV-113, CONV-120, CONV-124 à 126, CONV-130, CONV-133, CONV-140 à 141, CONV-161 à 168, CONV-184, CONV-192.

Ce qui a été corrigé : ouverture du PDF dans une pop-up à fermer avec la croix « ✕ » (plus de nouvel onglet) ; bouton « Télécharger » ajouté à la rangée du bloc ; fenêtre à deux boutons (« Fermer », « Générer la convention ») ; plus de champ « Année » ni « Modèle utilisé » (l'année vient de la Campagne de l'action) ; liste « Signataire » avec bouton « Ajouter un contact » ; renvois « voir CONV-xx » ou « mêmes règles que CONV-xx » remplacés par le texte lui-même.

## Tests de fumée (17)

- CONV-01 : Afficher le bloc Convention (FT National).
- CONV-03 : Afficher le bloc Convention (FT National).
- CONV-08 : Afficher le bloc Convention (FT Régional).
- CONV-44 : Génération et ouverture du PDF de la convention (FT National).
- CONV-80 : Re-génération du PDF de la convention (FT National).
- CONV-81 : Re-génération du PDF de la convention (FT National).
- CONV-106 : Dépôt et remplacement du fichier signé de la convention (FT National).
- CONV-107 : Dépôt et remplacement du fichier signé de la convention (FT National).
- CONV-139 : Ouverture de la fenêtre Convention allégée (FT National).
- CONV-150 : Ajouter un contact depuis la fenêtre Convention (FT National).
- CONV-156 : Fermeture et enregistrement silencieux de la fenêtre Convention (FT National).
- CONV-161 : Génération du PDF avec les données de l'Évolution 1 (FT National).
- CONV-182 : Voir la convention dans une pop-up plein écran (FT National).
- CONV-189 : Télécharger la convention avec son vrai nom (FT National).
- CONV-192 : Télécharger la convention avec son vrai nom (FT National).
- CONV-234 : Droits : FT Régional, parcours complet de la convention : FT Régional, de l'ajout du contact au téléchargement (FT Régional).
- CONV-240 : Fermer la pop-up du PDF (état Générée) : fermer la pop-up par la croix (FT National).

## Ordre conseillé pour jouer

Voir « Trois sortes de cas » plus haut : la recette courte donne l'ordre complet. La recette approfondie suit l'ordre des numéros, en regroupant les cas par profil de connexion.
## Après une correction : cas à rejouer

Rejouer le cas concerné, puis ses voisins (même sujet) ; rappeler à Hanta de relancer toute la suite automatique (`npm test`).

| Sujet (colonne `Fonction`) | Cas |
| --- | --- |
| Accessibilité de la convention (VoiceOver : attente, réussite, échecs) : VoiceOver, dépôt : attente, réussite, refus | CONV-246 |
| Accessibilité de la convention (VoiceOver : attente, réussite, échecs) : VoiceOver, génération : attente, réussite, échec | CONV-230 |
| Accessibilité de la convention (VoiceOver : bloc et pop-up) : VoiceOver, bloc et pop-up (état Générée) | CONV-228 |
| Accessibilité de la convention (VoiceOver : bloc et pop-up) : VoiceOver, état Signée et bouton grisé | CONV-244 |
| Accessibilité de la convention (VoiceOver : fenêtre et ajout de contact) : VoiceOver, fenêtre et bouton « Ajouter un contact » | CONV-229 |
| Accessibilité de la convention (VoiceOver : fenêtre et ajout de contact) : VoiceOver, messages sous « E-mail » | CONV-245 |
| Accessibilité de la convention (clavier) : clavier, bloc, re-génération et pop-up | CONV-242 |
| Accessibilité de la convention (clavier) : clavier, dépôt du fichier signé | CONV-243 |
| Accessibilité de la convention (clavier) : clavier, fenêtre et ajout de contact | CONV-227 |
| Affichage de la convention (mobile, 375 px) : mobile 375 px, bloc, re-génération et dépôt | CONV-248 |
| Affichage de la convention (mobile, 375 px) : mobile 375 px, fenêtre | CONV-232 |
| Affichage de la convention (mobile, 375 px) : mobile 375 px, pop-up | CONV-249 |
| Affichage de la convention (zoom 200 %) : zoom 200 %, dépôt et pop-up | CONV-247 |
| Affichage de la convention (zoom 200 %) : zoom 200 %, fenêtre et re-génération | CONV-231 |
| Afficher le bloc Convention | CONV-01 à 15 |
| Ajouter un contact depuis la fenêtre Convention | CONV-147 à 155 |
| Blocs Club et Agence de la fenêtre Convention | CONV-143 à 146 |
| Coexistence des deux boutons Télécharger | CONV-196 à 197 |
| Droits : FT Départemental, parcours complet de la convention : FT Départemental, de l'ajout du contact au téléchargement | CONV-235 |
| Droits : FT Départemental, parcours complet de la convention : FT Départemental, re-génération et fichier signé | CONV-251 |
| Droits : FT Régional, parcours complet de la convention : FT Régional, de l'ajout du contact au téléchargement | CONV-234 |
| Droits : FT Régional, parcours complet de la convention : FT Régional, re-génération et fichier signé | CONV-250 |
| Dépôt du fichier signé : fichier qui n'est pas un PDF | CONV-239 |
| Dépôt et remplacement du fichier signé de la convention | CONV-106 à 115, CONV-117, CONV-120 à 121, CONV-124 à 127, CONV-130, CONV-133 |
| Fenêtre et enregistrement de la convention | CONV-16 à 17, CONV-20 à 21, CONV-23 à 24, CONV-33 à 34, CONV-41 à 43 |
| Fermer la pop-up du PDF | CONV-202 à 203 |
| Fermer la pop-up du PDF (état Générée) : fermer la pop-up par la croix | CONV-240 |
| Fermer la pop-up du PDF (état Générée) : fermer la pop-up par Échap | CONV-254 |
| Fermer la pop-up du PDF (état Signée) | CONV-241 |
| Fermeture et enregistrement silencieux de la fenêtre Convention | CONV-156 à 160 |
| Génération du PDF avec les données de l'Évolution 1 | CONV-161 à 168 |
| Génération et ouverture du PDF de la convention | CONV-44 à 52, CONV-58, CONV-61 à 66 |
| Mise en page de la fenêtre Convention (une ou deux colonnes) | CONV-233 |
| Ouverture de la fenêtre Convention allégée | CONV-139 à 142 |
| Persistance : « Voir » et « Télécharger » n'écrivent rien | CONV-238 |
| Persistance après dépôt et remplacement du fichier signé : persistance après le premier dépôt | CONV-237 |
| Persistance après dépôt et remplacement du fichier signé : persistance après le remplacement | CONV-253 |
| Persistance après génération et re-génération : persistance après la première génération | CONV-236 |
| Persistance après génération et re-génération : persistance après la re-génération | CONV-252 |
| Persistance de la fenêtre Convention allégée | CONV-169 à 170 |
| Persistance de la pop-up du PDF | CONV-217 |
| Re-génération du PDF de la convention | CONV-80 à 81, CONV-83 à 84, CONV-86 à 90, CONV-92 à 94, CONV-97, CONV-100 |
| Sécurité de la pop-up du PDF | CONV-208 à 210 |
| Télécharger la convention avec son vrai nom | CONV-189 à 195 |
| Voir la convention dans une pop-up plein écran | CONV-182 à 188, CONV-204 |
| Échec d'affichage et de récupération du PDF | CONV-205 à 207 |

## Rejouer en PROD

Seuls les cas qui ne font que regarder se rejouent sur de vraies conventions : CONV-01 à 17, CONV-20 à 21, CONV-42, CONV-97. Tous les autres écrivent dans `Conventions`, envoient un fichier ou modifient un modèle : TEST (ou DEV7) seulement.

## [À CONFIRMER] du nettoyage

1. **Écart entre le dépôt et l'export de suivi.** Le dépôt avait 222 cas, l'export de Jean-Louis 220 lignes (CONV-59, 123, 124, 125 et 126 n'y sont pas ; CONV-01, 03 et 08 y sont en double) et ni l'un ni l'autre n'avait de CONV-223 à 226. CONV-59 et 123 ont été supprimés (obsolètes) ; CONV-124, 125 et 126 sont gardés : à ajouter au suivi si Jean-Louis doit les jouer.
2. **Numérotation de l'accessibilité.** Les cas consolidés commencent à CONV-227 (décision de Hanta). CONV-223 à 226 ne sont pas utilisés : ne pas les réutiliser sans vérifier le suivi.
3. **Dates des cas déjà joués.** L'export ne donne aucune date pour CONV-20, 21, 33, 34, 41 à 45 et 58 : les notes l'indiquent.
4. **CONV-46 et CONV-162** décrivent deux textes différents pour le bloc de signature du modèle Parcours de remobilisation (« À …, le … » en tête de chaque colonne, ou « Fait à…, le… »). Comparer au Word officiel et corriger le cas qui se trompe.
5. **CONV-83 et CONV-87** : la colonne `Annee` de `Conventions` n'est plus vérifiée (le widget la relit depuis la Campagne à chaque enregistrement) ; CONV-87 repose sur `Avec_annee` d'un modèle, à relire par Hanta.
6. **Campagne à renseigner avant de jouer** sur les actions d'essai ESSAI-CONV-R4, S1, S2, S17 et R26 (valeur 2026), sinon l'année est omise des noms de fichier attendus par CONV-47, 80, 81 et 252.
7. **Noms de fichier de CONV-234, 235, 250 et 251** (« …-Club-Exemple-Contacts-2026.pdf ») : déduits de la règle de nommage (nom du club avec des tirets), non vérifiés à l'écran.
8. **« Fermer » et Échap écrivent dans `Conventions`** (enregistrement silencieux). Les cas qui ouvrent la fenêtre d'une action (CONV-23, 24, 227, 242, 231, 247, 232, 248, 249, 233) y laissent donc une ligne : sans conséquence pour eux, mais ne pas les jouer sur une action dont la ligne doit rester intacte.
9. **CONV-244, étape 4** : le bouton « Re-générer » grisé (agence retirée) était lu par un cas supprimé (CONV-103, lié à l'adresse du club) ; il est repris ici avec le blocage « agence manquante » qui existe encore. À confirmer que le texte lu par VoiceOver est bien celui de la note UX.
10. **Lecture des fichiers et commandes.** Pour lire les 222 cas et écrire les deux fichiers sans erreur de recopie, le recetteur a utilisé des commandes de lecture seule et deux petits scripts d'écriture limités à ces deux fichiers (autorisé par Hanta). Aucun test, aucun build, aucun npm.

---

# Cas de test : Convention, afficher le bloc Convention (R1)

**Brouillon écrit par le recetteur, corrigé après relecture de Hanta. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » tout en bas.
- Branche : `feature/convention`. Tâches 4.2 et 4.3 (fiches C24 et C25 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md` (elle fait foi). Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient ces 15 cas (CONV-01 à CONV-15), puis ceux de R2 (CONV-16 à CONV-43, plus bas), pour l'outil de suivi (18 colonnes).

## Ce que ce bloc fait et ne fait pas encore

- Il affiche **un état et un texte**. Il n'a **aucun bouton, aucun lien et aucun message de blocage** (décision du 2026-10-23).
- La note UX décrit des boutons (« Générer la convention », « Voir la convention »…) et un message de blocage (« Renseignez l'agence… »). Ils arrivent en tâche 5.1. **Ne pas noter KO l'absence de ces éléments.**
- Hors de cette recette : la fenêtre de génération, la génération du PDF, le dépôt du fichier signé (R2, R4, R5, R6).

## Cas volontairement non écrit : « Droits insuffisants »

L'état « Droits insuffisants » n'a pas de cas ici. Il apparaît quand Grist refuse la lecture de `Conventions` ou de `Modeles_convention`. Or le seul profil sans accès à ces tables est l'ANS, et **l'ANS ne voit pas le tableau de bord** : on ne peut pas le jouer à l'écran.

Il est couvert par les tests automatiques de la fiche C25, dans `test/convention-bloc.test.js` :
- « état Droits insuffisants : la phrase de la note UX, quand Conventions est refusée » ;
- « état Droits insuffisants aussi quand Modeles_convention est refusée » ;
- « Droits insuffisants l'emporte sur une convention signée présente dans les données » ;
- « le refus d'une autre table ne donne pas l'état Droits insuffisants » ;
- « la fiche contient le bloc Convention, une seule fois, avec l'état issu de state.tablesRefusees ».

Les cas CONV-08 à CONV-11 servent aussi de garde-fou : si un profil National, Régional ou Départemental voit ce message sur une action de son périmètre, c'est une anomalie des règles d'accès.

## Données d'essai à créer dans TEST avant de jouer

Données fictives uniquement. Aucun nom de document Grist, aucune adresse réelle.

### Structures (clubs)

| Club | Adresse | Code postal | Ville |
| --- | --- | --- | --- |
| Club Exemple | 1 rue Exemple | 75001 | Exemple-sur-Mer |
| Club Exemple Sans Adresse | (vide) | (vide) | (vide) |

`Structures.Ville` est une colonne formule : vérifier qu'elle est bien vide pour le second club.

### Agence d'essai, DR, DD

- On ne crée ni DR ni DD. L'agence d'essai est rattachée à une DR et à une DD qui existent déjà dans TEST : celles des profils Régional et Départemental utilisés avec « Voir en tant que ».
- Les 7 actions ci-dessous utilisent cette agence : elles sont donc dans le périmètre de ces deux profils.

### Modeles_convention (3 lignes factices, actives)

| Code | Dispositif | Actif |
| --- | --- | --- |
| STADE_EMPLOI | Du stade vers l'emploi | Oui |
| MATCH_METIERS | Match des métiers | Oui |
| REMOBILISATION | Parcours de remobilisation vers l'emploi | Oui |

Aucun modèle pour Aller vers ni pour Parcours complet d'insertion par le sport.

### Actions d'essai (Corbeille = non)

| Intitulé | Dispositif | Club | Agence | Sert aux cas |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-A1 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-01, 08, 11 |
| ESSAI-CONV-A2 | Match des métiers | Club Exemple | agence d'essai | CONV-02, 09, 12, 13, 14, 15 |
| ESSAI-CONV-A3 | Parcours de remobilisation vers l'emploi | Club Exemple | agence d'essai | CONV-03, 10, 13 |
| ESSAI-CONV-A4 | Aller vers | Club Exemple | agence d'essai | CONV-04 |
| ESSAI-CONV-A5 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-05 |
| ESSAI-CONV-A6 | Match des métiers | Club Exemple | agence d'essai | CONV-06 |
| ESSAI-CONV-A7 | Du stade vers l'emploi | Club Exemple Sans Adresse | agence d'essai | CONV-07 |

### Conventions (une seule ligne par action ; DR et DD se calculent seules)

Un « PDF fictif » est un petit PDF d'une page contenant seulement « Convention d'essai, données fictives ».

| Action | PDF_genere | PDF_signe | Date_generation | Date_depot |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-A2 | PDF fictif | (vide) | 05/03/2026 à 12:00 | (vide) |
| ESSAI-CONV-A3 | PDF fictif | PDF fictif | 14/03/2026 à 12:00 | 27/04/2026 à 12:00 |
| ESSAI-CONV-A5 | PDF fictif | (vide) | (vide) | (vide) |
| ESSAI-CONV-A6 | PDF fictif | PDF fictif | 14/03/2026 à 12:00 | (vide) |

Pas de ligne `Conventions` pour A1, A4 et A7. Saisir les dates à **12:00** : la date affichée reste alors la même quel que soit le fuseau horaire.

### Profils

Prérequis commun : le profil FT [National / Régional / Départemental] est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai. Les cas CONV-08 à CONV-11 se jouent avec « Voir en tant que » (le développeur du projet).

## Les 15 cas

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Aucun cas n'écrit dans Grist.

### États du bloc (profil FT National)

**CONV-01 : À générer** (Nominal, Bloquant, fumée)
- Étant donné : ESSAI-CONV-A1 ouverte.
- Quand : on descend en bas de la fiche.
- Alors : le bloc « Convention » est sous Statut et Financement, en pleine largeur, même style que les autres blocs. Une seule phrase : « Aucune convention générée. » Aucun bouton, aucun lien, aucun message « Renseignez… ».

**CONV-02 : Générée avec date** (Nominal, Bloquant)
- Étant donné : ESSAI-CONV-A2 ouverte.
- Alors : « Convention générée le 05/03/2026. » (jour/mois/année avec le zéro), puis en dessous : « Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé. » Aucun bouton.

**CONV-03 : Signée** (Nominal, Bloquant, fumée)
- Étant donné : ESSAI-CONV-A3 ouverte (PDF généré et PDF signé présents).
- Alors : une seule phrase : « Convention signée, déposée le 27/04/2026. » C'est la date de dépôt, pas 14/03/2026. Pas de phrase d'aide. L'état Signée l'emporte sur Générée.

**CONV-04 : Sans modèle** (Nominal, Majeur)
- Étant donné : ESSAI-CONV-A4 ouverte (dispositif Aller vers).
- Alors : une seule phrase : « Pas encore de modèle de convention pour ce dispositif. » Aucun bouton.

**CONV-05 : Générée, date vide** (Limite, Majeur)
- Étant donné : ESSAI-CONV-A5 ouverte.
- Alors : « Convention générée. » (ni « le », ni date, ni « undefined », ni 01/01/1970), puis la phrase d'aide.

**CONV-06 : Signée, date vide** (Limite, Majeur)
- Étant donné : ESSAI-CONV-A6 ouverte.
- Alors : « Convention signée. » seule (la date de génération 14/03/2026 n'est pas reprise). Pas de phrase d'aide.

**CONV-07 : élément manquant, pas de message de blocage** (Nominal, Majeur)
- Étant donné : ESSAI-CONV-A7 ouverte (club sans adresse).
- Alors : seulement « Aucune convention générée. » Aucun « Renseignez l'adresse du club dans sa fiche. », aucun « Convention impossible à générer : », aucun bouton grisé.

### Droits par profil (« Voir en tant que », par le développeur du projet)

**CONV-08 : FT Régional, À générer** (Droits, Bloquant, fumée)
- Étant donné : profil FT Régional.
- Quand : ouvre ESSAI-CONV-A1.
- Alors : « Aucune convention générée. », seule. Le message « Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord. » n'apparaît pas (sinon KO).

**CONV-09 : FT Régional, Générée** (Droits, Majeur)
- Quand : ouvre ESSAI-CONV-A2.
- Alors : « Convention générée le 05/03/2026. » puis la phrase d'aide. Pas de message « Vous n'avez pas accès… ».

**CONV-10 : FT Départemental, Signée** (Droits, Majeur)
- Étant donné : profil FT Départemental.
- Quand : ouvre ESSAI-CONV-A3.
- Alors : « Convention signée, déposée le 27/04/2026. » seule. Pas de message « Vous n'avez pas accès… ».

**CONV-11 : FT Départemental, À générer** (Droits, Majeur)
- Quand : ouvre ESSAI-CONV-A1.
- Alors : « Aucune convention générée. », seule. Cela prouve que ce profil lit aussi `Modeles_convention`.

### Mobile et accessibilité

**CONV-12 : clavier** (Mobile et accessibilité, Majeur, autre développeur)
- Quand : sur ESSAI-CONV-A2, on avance avec Tab depuis le dernier champ de Financement, puis on revient avec Maj+Tab.
- Alors : le focus passe aux boutons du bas de la fiche sans s'arrêter sur le bloc (rien à activer dedans) ; pas de piège au clavier.

**CONV-13 : lecteur d'écran VoiceOver (Mac)** (Mobile et accessibilité, Majeur, développeur du projet)
- Quand : lecture ligne par ligne de ESSAI-CONV-A2 puis A3.
- Alors : A2 : « Convention », « Convention générée le 05/03/2026. », puis la phrase d'aide, dans cet ordre. A3 : « Convention signée, déposée le 27/04/2026. » Ni « bouton » ni « lien », aucune annonce automatique, aucune information portée par la seule couleur.

**CONV-14 : zoom 200 %** (Mobile et accessibilité, Majeur, autre développeur)
- Quand : zoom navigateur à 200 % sur ESSAI-CONV-A2.
- Alors : phrases lisibles, à la ligne, sans texte coupé ni défilement horizontal propre au bloc. Remettre le zoom à 100 % ensuite.

**CONV-15 : mobile** (Mobile et accessibilité, Mineur, autre développeur)
- Quand : écran d'environ 375 px de large, sur ESSAI-CONV-A2.
- Alors : le bloc passe sous les autres blocs, en pleine largeur, textes à la ligne, rien de coupé. La note UX parle aussi de boutons qui passent à la ligne : pas jouable avant 5.1.

## Tests de fumée (3 sur 15)

- CONV-01 : état À générer.
- CONV-03 : état Signée.
- CONV-08 : un profil Régional voit le bloc, et non « Droits insuffisants ».

## Après une correction

Rejouer le cas concerné, puis ses voisins (mêmes états : CONV-01 à CONV-07 ; mêmes profils : CONV-08 à CONV-11), et rappeler à Hanta de relancer toute la suite automatique (npm test).

## Rejouer en PROD

En PROD, jouer ces cas sur de vraies actions dans l'état voulu, sans créer de données.

## [À CONFIRMER]

1. Le compte du testeur « National » pour CONV-01 à CONV-07 et CONV-12 à CONV-15 : un vrai profil FT National, ou un propriétaire du document ? (Un propriétaire voit tout : le cas serait moins représentatif.)
2. `Structures.Ville` (colonne formule) doit rester vide pour « Club Exemple Sans Adresse » : à vérifier pour CONV-07.

Mode sombre : à traiter à part pour tout le tableau de bord (hors R1).

---

# Cas de test : Convention, fenêtre et enregistrement (R2)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-15 (R1) ci-dessus n'ont pas été modifiés.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » puis fenêtre « Convention ».
- Branche : `feature/convention`. Tâches 5.1a, 5.1b et 5.2 (fiches C27 à C34 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md`, mise à jour le 2026-10-23 (elle fait foi). Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient les 28 cas de R2 (CONV-16 à CONV-43), à la suite des 15 de R1 : 43 lignes de cas, 18 colonnes.

## Ce que la fenêtre fait et ne fait pas encore

- Elle permet de **voir les informations, choisir le signataire du club, saisir le représentant de l'agence et enregistrer un brouillon** dans `Conventions`.
- Elle n'a **pas de bouton « Générer la convention »** dans son pied, et aucun PDF n'est produit. Ils arrivent avec la tâche S7. **Ne pas noter KO leur absence.**
- « Enregistrer les informations » ne contrôle **que l'année** (quatre chiffres). Un champ vide est accepté : c'est un brouillon.
- Hors de cette recette : génération du PDF, voir la convention, dépôt du fichier signé (R4, R5, R6).

## Cas volontairement non écrits

1. **Message « Renseignez le dispositif de l'action dans sa fiche. »** : il ne s'affiche jamais (décision D-5 du 2026-10-23). Sans dispositif, le bloc est à l'état « Sans modèle » (voir CONV-04), et le bouton n'existe pas. Pas de cas.
2. **Refus d'écriture sur `Conventions`** : on ne peut pas le jouer à l'écran. Aucun profil qui voit le tableau de bord (National, Régional, Départemental) n'est privé d'écriture sur `Conventions` ; l'ANS, lui, ne voit pas le tableau de bord. Le message d'échec « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » est couvert par les tests automatiques de la fiche C34, dans `test/convention-enregistrement.test.js` :
   - « refus ou erreur : message exact, aucun texte de l'erreur de Grist, rien dans la console, données inchangées » ;
   - « refus sur une action sans ligne : rien n'est gardé en mémoire, le nouvel essai crée la ligne » ;
   - « création sans identifiant renvoyé par Grist : la table est relue, le deuxième enregistrement met à jour » ;
   - « création réussie mais relecture impossible : le message reste celui de la réussite ».

   Les cas CONV-34 et CONV-35 servent de garde-fou : si le message d'échec apparaît pour un profil Régional ou Départemental dans son périmètre, c'est une anomalie des règles d'accès de `Conventions`.
3. **Plusieurs éléments manquants à la fois** : la note dit qu'un seul message s'affiche (le premier dans l'ordre agence, club, dispositif, adresse). Il est vérifié par le test « génération bloquée par plusieurs éléments : un seul message… » (fiche C28), pas par un cas à l'écran.

## Données d'essai de R2 à créer dans TEST avant de jouer

Données fictives uniquement (Club Exemple, exemple.fr). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1 restent en place** : les actions ESSAI-CONV-A1 à A7 ne sont pas touchées par R2.

### Structures (clubs)

| Club | Adresse | Code postal | Ville | SIRET | Contacts |
| --- | --- | --- | --- | --- | --- |
| Club Exemple (existe déjà, R1) | 1 rue Exemple | 75001 | Exemple-sur-Mer | 12345678900012 (fictif, à ajouter s'il est vide) | 2 contacts, voir plus bas |
| Club Exemple Sans Adresse (existe déjà, R1) | (vide) | (vide) | (vide) | (au choix, fictif) | 1 contact, voir plus bas |
| Club Exemple Sans Contact (nouveau) | 2 rue Exemple | 75002 | Exemple-sur-Mer | 12345678900020 (fictif) | AUCUN |

### Contacts (table Contacts, créés depuis la fiche du club)

| Prénom | Nom | Fonction | Email | Club |
| --- | --- | --- | --- | --- |
| Alex | Martin-Exemple | Président | alex.martin@exemple.fr | Club Exemple |
| Sam | Test-Exemple | (vide) | sam.test@exemple.fr | Club Exemple |
| Robin | Autre-Exemple | Trésorier | robin.autre@exemple.fr | Club Exemple Sans Adresse |

Robin sert à vérifier que la liste « Signataire » ne montre que les contacts du club de l'action (CONV-23). Dans la liste, le libellé est « Prénom Nom » : « Alex Martin-Exemple », « Sam Test-Exemple ».

### Agence d'essai, DR, DD

- On ne crée ni DR ni DD. **On reprend l'agence d'essai de R1**, déjà rattachée à la DR et à la DD existantes de TEST (celles des profils Régional et Départemental utilisés avec « Voir en tant que »). Si une autre agence d'essai est créée, elle doit être rattachée aux mêmes DR et DD : sinon la ligne `Conventions` ne se calcule pas dans le périmètre de ces profils et CONV-34 et CONV-35 sont Bloqués.
- L'agence d'essai doit avoir une adresse fictive complète (elle s'affiche dans la fenêtre, CONV-20).
- Sauf ESSAI-CONV-B1, toutes les actions de R2 utilisent cette agence.

### Modeles_convention

Ceux de R1 suffisent. À vérifier avant de jouer : la colonne `Titre` du modèle Du stade vers l'emploi vaut « Du stade vers l'emploi », celle de Match des métiers « Le Match des Métiers », celle de Parcours de remobilisation « Parcours de remobilisation » (correspondance de la note), et `Avec_annee` vaut Non pour Parcours de remobilisation seulement.

### Actions d'essai (Corbeille = non, aucune ligne dans Conventions au départ)

Les cas qui **écrivent** ont **leur propre action** : aucun cas ne dépend d'un autre.

| Intitulé | Dispositif | Club | Agence | Sert au cas |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-B1 | Du stade vers l'emploi | Club Exemple | AUCUNE | CONV-16 |
| ESSAI-CONV-B2 | Du stade vers l'emploi | AUCUN | agence d'essai | CONV-17 |
| ESSAI-CONV-B3 | Du stade vers l'emploi | Club Exemple Sans Adresse | agence d'essai | CONV-18 |
| ESSAI-CONV-B4 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-19, 20, 23, 24, 36, 37, 38, 39, 40, 42 (lecture seule : on n'enregistre jamais) |
| ESSAI-CONV-B5 | Match des métiers | Club Exemple | agence d'essai | CONV-21 |
| ESSAI-CONV-B6 | Parcours de remobilisation vers l'emploi | Club Exemple | agence d'essai | CONV-22 |
| ESSAI-CONV-B7 | Du stade vers l'emploi | Club Exemple Sans Contact | agence d'essai | CONV-25 (écrit) |
| ESSAI-CONV-B8 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-30 (écrit) |
| ESSAI-CONV-B9 | Match des métiers | Club Exemple | agence d'essai | CONV-31 (écrit) |
| ESSAI-CONV-B10 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-32 (écrit) |
| ESSAI-CONV-B11 | Parcours de remobilisation vers l'emploi | Club Exemple | agence d'essai | CONV-33 (écrit) |
| ESSAI-CONV-B12 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-26 (ne doit rien écrire) |
| ESSAI-CONV-B13 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-27 |
| ESSAI-CONV-B14 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-28 (écrit) |
| ESSAI-CONV-B15 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-29 (écrit) |
| ESSAI-CONV-B16 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-34 (écrit, FT Régional) |
| ESSAI-CONV-B17 | Match des métiers | Club Exemple | agence d'essai | CONV-35 (écrit, FT Départemental) |
| ESSAI-CONV-B18 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-41 (écrit) |
| ESSAI-CONV-B19 | Du stade vers l'emploi | Club Exemple | agence d'essai | CONV-43 (écrit) |

B6 est l'action « À générer » de dispositif Parcours de remobilisation (lecture) ; B11 en est la version qui écrit. Le représentant saisi dans les cas est toujours fictif (« Dominique Exemple », « Camille Exemple »).

**Pour rejouer un cas qui écrit** : supprimer d'abord la ligne `Conventions` de son action (ou recréer l'action). Une ligne déjà là change le résultat (mise à jour au lieu de création).

### Profils

Prérequis commun : le profil FT [National / Régional / Départemental] est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai. CONV-34 et CONV-35 se jouent avec « Voir en tant que » (le développeur du projet). ESSAI-CONV-B1 n'a pas d'agence : seul le profil National la voit.

## Les cas de R2 restants après le nettoyage du 2026-11-04

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. « Rejouable en PROD » = Oui seulement pour les cas qui ne font que regarder. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Bloc : bouton grisé et message (profil FT National)

- **CONV-16 : agence manquante** (Erreur, Majeur) : « Renseignez l'agence de l'action dans sa fiche. », bouton grisé, la fenêtre ne s'ouvre pas.
- **CONV-17 : club manquant** (Erreur, Majeur) : « Renseignez le club de l'action. »

### Ouverture de la fenêtre

- **CONV-20 : club et agence en lecture seule** (Nominal, Majeur).
- **CONV-21 : modèle Match des métiers, année préremplie** (Nominal, Majeur).

### Signataires

- **CONV-23 : la liste ne montre que les contacts du club** (Nominal, Majeur).
- **CONV-24 : fonction affichée après le choix, ou « Fonction non renseignée »** (Nominal, Majeur).



### Enregistrement et persistance

- **CONV-33 : modèle sans année** (Limite, Majeur).

### Droits (« Voir en tant que », par le développeur du projet)

- **CONV-34 : FT Régional enregistre dans son périmètre** (Droits, Bloquant).



### Mobile et accessibilité

- **CONV-41 : VoiceOver, message d'erreur et message de succès annoncés** (Majeur).
- **CONV-42 : zoom 200 %** (Majeur).
- **CONV-43 : mobile, le message après « Enregistrer » est visible ou annoncé** (Majeur).

## [À CONFIRMER] de R2

1. **CONV-27** (réglé à la relecture du 2026-10-23) : le champ numérique refuse les lettres à la frappe ; le cas utilise donc 10000 au lieu de « abc ». « abc » reste couvert par les tests en code (fiche C31).
2. **État du bloc après un enregistrement** (CONV-31) : j'ai écrit que le bloc reste à « Aucune convention générée. », parce que l'état suit les PDF et non la présence d'une ligne. Non vérifié dans le code : à confirmer en jouant le cas.
3. **Mode de création de ESSAI-CONV-B2 (sans club)** (CONV-17) : à confirmer que l'interface permet de vider le club, sinon créer l'action directement dans la table Actions.
4. Les colonnes `Titre` et `Avec_annee` de `Modeles_convention` ont les valeurs prévues dans TEST (voir plus haut) : à vérifier avant de jouer CONV-21 et CONV-22.
5. Le compte du testeur « National » : même question qu'en R1 (vrai profil FT National, ou propriétaire du document ?).

---

# Cas de test : Convention, générer le PDF et le voir (R4)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-43 (R1 et R2) ci-dessus n'ont pas été modifiés.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » et fenêtre « Convention ».
- Branche : `feature/convention`. Fonction D : génération du PDF, logos, mise en page, « Voir la convention » (fiches C35 à C49 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md` (elle fait foi) : §3 « Générer la convention : de l'ouverture au résultat », §3 « Cases du modèle », §11 « Mise en page du PDF », §11.2 pour les logos. Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient les 36 cas de R4 (CONV-44 à CONV-79), à la suite des 43 de R1 et R2 : 79 lignes de cas, 18 colonnes.
- Les actions de R4 s'appellent ESSAI-CONV-R1 à ESSAI-CONV-R35. **« R » veut dire « recette R4 »** : à ne pas confondre avec les actions A (R1), B (R2) et celles déjà utilisées à la main.

## Ce que cette recette couvre et ne couvre pas

- Elle couvre : cliquer sur « Générer la convention » dans la fenêtre, le résultat (PDF, nom du fichier, enregistrement du fichier et de la date), les logos, les messages de contrôle et d'échec, « Voir la convention », et les droits d'un vrai compte.
- Hors de cette recette : « Re-générer » (remplacement d'un PDF, tâche S8), le dépôt du fichier signé (R5 et R6). Le bouton « Re-générer » est visible dans l'état Générée : ne pas le noter KO, ne pas le jouer.

## Ces cas ne se jouent PAS avec « Voir en tant que »

**CONV-71 (FT Régional) et CONV-72 (FT Départemental) ne peuvent pas être joués avec « Voir en tant que ».** Ce mode ne simule pas l'utilisateur pour les jetons que le widget utilise pour envoyer et lire le fichier : un essai fait ainsi réussit à tort (fiche C41, bug du jeton du propriétaire).

Il faut **un vrai compte** pour chaque profil :
- invité dans le document comme **éditeur**, jamais comme propriétaire ;
- avec un **profil complet** dans la table Utilisateurs (la DR pour le Régional, la DD pour le Départemental, dans le périmètre de l'agence d'essai) ;
- connecté dans un navigateur à part (fenêtre privée par exemple).

Le recetteur n'invente aucun compte : lesquels utiliser est à décider par Hanta (voir [À CONFIRMER] 2).

## Cas volontairement non écrits (non jouables à l'écran)

Couverts par les tests en code (fiches C36, C40, C43, C46), dont les noms exacts n'ont pas été relus :
1. **Envoi refusé par Grist pour les droits** (« La convention n'a pas pu être enregistrée : vos droits ne le permettent pas pour cette action… ») : aucun profil du tableau de bord n'est privé d'écriture. CONV-71 et CONV-72 servent de garde-fou : si ce message apparaît, c'est une anomalie des règles d'accès.
2. **Fichier envoyé mais non rattaché** (« …n'a pas pu être rattaché à l'action… ») et **échec inattendu** (« La convention n'a pas pu être générée. Vos informations sont conservées. ») : impossibles à provoquer sans abîmer le code ou les données.
3. **Délai de 20 secondes dépassé** pour le chargement de pdfmake : long à jouer, et un défaut connu l'accompagne (fiche C43).
4. **Plus de cinq cases inconnues** (« et d'autres ») : seul le cas de deux cases est joué (CONV-64).
5. **Re-génération** (S8) : hors recette.

## Modèles officiels à vérifier avant d'écrire les données (non vérifié par le recetteur)

**Je n'ai pas accès à TEST : je n'ai pas pu vérifier que les trois modèles officiels y sont en place.** D'après REVIEW_LOG, les vrais PDF (fiches C38 à C49) ont été vus dans un document de développement, pas dans TEST. Les lignes de `Modeles_convention` de R1 sont des lignes « factices » (Code, Dispositif, Actif). À vérifier par le testeur, dans `Modeles_convention` de TEST, pour chacun des trois modèles :

| À vérifier | Du stade vers l'emploi | Match des métiers | Parcours de remobilisation |
| --- | --- | --- | --- |
| Ligne présente et `Actif` = Oui | oui | oui | oui |
| `Titre` | « Du stade vers l'emploi » | « Le Match des Métiers » | « Parcours de remobilisation » |
| `Avec_annee` | Oui | Oui | Non |
| Texte officiel complet (pas le texte factice de R1) | à vérifier | à vérifier | à vérifier |
| Case propre à ce modèle | [SIRET de l'agence] | [Adresse de l'agence] | [Adresse de l'agence] |
| Marqueur de signature | `{signatures:ft-gauche}` (une ligne « Fait à … » au-dessus, France Travail à gauche) | `{signatures:ft-gauche}` | `{signatures:lieu-date}` (club à gauche, « À …, le … » dans chaque colonne) |
| `Logo` (image fictive, PNG ou JPEG) | rempli | rempli | rempli |
| `Logo_partenaire` (image fictive) | vide | **rempli** | vide |

Si un modèle manque ou diffère : les cas qui s'y rapportent sont Bloqués, à noter avant de jouer. Le texte exact des modèles n'est pas dans le dépôt : les cases réellement présentes sont à relever par le testeur (voir [À CONFIRMER] 1).

## Données d'essai de R4 à créer dans TEST avant de jouer

Données fictives uniquement (exemple.fr, SIRET inventés). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1 et de R2 restent en place.**

### Structures (clubs)

| Club | Adresse | Code postal | Ville | SIRET | Contacts |
| --- | --- | --- | --- | --- | --- |
| Club Exemple (existe déjà) | 1 rue Exemple | 75001 | Exemple-sur-Mer | 12345678900012 | Alex Martin-Exemple (Président), Sam Test-Exemple (sans fonction), comme en R2 |
| Club Exemple Sans SIRET (nouveau) | 3 rue Exemple | 75003 | Exemple-sur-Mer | (vide) | Jo Sansiret-Exemple |
| Étoile & Cœur FC (nouveau, nom exact avec accents, « & » et « œ ») | 4 rue Exemple | 75004 | Exemple-sur-Mer | 12345678900038 | Charlie Etoile-Exemple |

### Contacts à créer (depuis la fiche du club)

| Prénom | Nom | Fonction | Email | Club |
| --- | --- | --- | --- | --- |
| Jo | Sansiret-Exemple | Président | jo.sansiret@exemple.fr | Club Exemple Sans SIRET |
| Charlie | Etoile-Exemple | Président | charlie.etoile@exemple.fr | Étoile & Cœur FC |

### Agence d'essai

- On reprend **l'agence d'essai de R1 et R2** (déjà rattachée à la DR et à la DD des profils Régional et Départemental). Pas de nouvelle DR ni de nouvelle DD.
- Elle doit avoir une adresse fictive complète **et un SIRET fictif** dans la colonne `Siret` de `Agences` (par exemple 98765432100019). Sans SIRET, CONV-44 ne vérifie pas la case propre au modèle Du stade vers l'emploi.

### Actions d'essai (Corbeille = non, aucune ligne dans Conventions au départ, sauf R25)

Chaque cas qui écrit a **son action** : aucun cas ne dépend d'un autre. Toutes utilisent l'agence d'essai. Abréviations : Stade = Du stade vers l'emploi ; Match = Match des métiers ; Remob. = Parcours de remobilisation vers l'emploi.

| Intitulé | Dispositif | Club | Sert au cas |
| --- | --- | --- | --- |
| ESSAI-CONV-R1 | Stade | Club Exemple | CONV-44 |
| ESSAI-CONV-R2 | Match | Club Exemple | CONV-45 |
| ESSAI-CONV-R3 | Remob. | Club Exemple | CONV-46 |
| ESSAI-CONV-R4 | Match | Étoile & Cœur FC | CONV-47 |
| ESSAI-CONV-R5 | Stade | Club Exemple Sans SIRET | CONV-48 |
| ESSAI-CONV-R6 | Match | Club Exemple | CONV-49 |
| ESSAI-CONV-R7 | Remob. | Club Exemple | CONV-50 (modification M1) |
| ESSAI-CONV-R8 | Match | Club Exemple | CONV-51 (modification M2) |
| ESSAI-CONV-R9 | Match | Club Exemple | CONV-52 (modification M3) |
| ESSAI-CONV-R10 à R17 | Stade | Club Exemple | CONV-53 à CONV-60, une action par cas (R10 pour CONV-53, R11 pour CONV-54, et ainsi de suite jusqu'à R17 pour CONV-60) |
| ESSAI-CONV-R18 | Stade | Club Exemple | CONV-61 (blocage de pdfmake) |
| ESSAI-CONV-R19 | Stade | Club Exemple | CONV-62 (blocage de l'envoi) |
| ESSAI-CONV-R20 | Remob. | Club Exemple | CONV-63 (modification M4) |
| ESSAI-CONV-R21 | Remob. | Club Exemple | CONV-64 (modification M5) |
| ESSAI-CONV-R22 | Remob. | Club Exemple | CONV-65 (modification M6) |
| ESSAI-CONV-R23 | Remob. | Club Exemple | CONV-66 (modification M7) |
| ESSAI-CONV-R24 | Stade | Club Exemple | CONV-67 |
| ESSAI-CONV-R25 | Match | Club Exemple | CONV-68 et CONV-69 (lecture seule, ligne Conventions préparée, voir plus bas) |
| ESSAI-CONV-R26 | Stade | Club Exemple | CONV-70 |
| ESSAI-CONV-R27 | Stade | Club Exemple | CONV-71 (FT Régional, vrai compte) |
| ESSAI-CONV-R28 | Match | Club Exemple | CONV-72 (FT Départemental, vrai compte) |
| ESSAI-CONV-R29 | Stade | Club Exemple | CONV-73 |
| ESSAI-CONV-R30 | Stade | Club Exemple | CONV-74 |
| ESSAI-CONV-R31 | Stade | Club Exemple | CONV-75 |
| ESSAI-CONV-R32 | Stade | Club Exemple | CONV-76 |
| ESSAI-CONV-R33 | Stade | Club Exemple | CONV-77 (blocage de pdfmake) |
| ESSAI-CONV-R34 | Stade | Club Exemple | CONV-78 |
| ESSAI-CONV-R35 | Stade | Club Exemple | CONV-79 |

### Ligne Conventions à préparer pour ESSAI-CONV-R25

Même principe que les actions A2 de R1 : un « PDF fictif » d'une page contenant seulement « Convention d'essai, données fictives ». `PDF_genere` = PDF fictif, `Date_generation` = 14/10/2026 à 12:00 (midi, pour que la date reste la même quel que soit le fuseau horaire), `PDF_signe` et `Date_depot` vides. C'est ce qui permet de jouer « Voir » sans régénérer.

### Rien n'écrit dans les colonnes réservées

Ne jamais renommer ni écrire à la main les colonnes `DR` et `DD` de `Conventions` : elles servent aux règles d'accès.

## Modifications temporaires des modèles (cas à risque) — joués dans DEV7, pas sur TEST (décision de Hanta du 2026-10-25)

La note UX parle d'un « modèle factice » pour les échecs. Comme il n'y a **qu'un modèle par dispositif** (voir [À CONFIRMER] 3), les cas ci-dessous modifieraient **temporairement le vrai modèle**. Pour ne prendre aucun risque sur le modèle que le collègue utilisera dans sa recette (campagne C03), ces 7 cas (CONV-50, 51, 52, 63, 64, 65, 66) se jouent dans **DEV7** (en local, où Hanta travaille déjà) et non dans TEST. Avant la première modification : garder une copie du texte et des fichiers d'origine (capture ou copie dans un document à part). **Après chaque modification, recharger la page du tableau de bord** (le widget lit probablement les modèles au chargement : [À CONFIRMER] 3).

| Repère | Cas | Modèle | Modification | À remettre en état ensuite |
| --- | --- | --- | --- | --- |
| M1 | CONV-50 | Parcours de remobilisation | vider `Logo` (`Logo_partenaire` est déjà vide) | remettre le fichier du logo |
| M2 | CONV-51 | Match des métiers | vider `Logo`, garder `Logo_partenaire` | remettre le fichier du logo |
| M3 | CONV-52 | Match des métiers | remplacer `Logo_partenaire` par un fichier texte fictif renommé logo-partenaire.png | remettre l'image du logo du partenaire |
| M4 | CONV-63 | Parcours de remobilisation | ajouter dans le texte la case [Case inexistante] | retirer la case |
| M5 | CONV-64 | Parcours de remobilisation | texte avec [Case inexistante], puis [Autre case inexistante], puis de nouveau [Case inexistante] | retirer les cases |
| M6 | CONV-65 | Parcours de remobilisation | ajouter la case [<b>Essai</b>] | retirer la case |
| M7 | CONV-66 | Parcours de remobilisation | `Actif` = Non, **pendant que la fenêtre est ouverte** (second onglet) | remettre `Actif` = Oui |

**Fin de séance (dans DEV7) : remettre les trois modèles dans l'état de départ, recharger la page, puis rejouer CONV-44, CONV-45 et CONV-46 pour prouver la remise en état.** Pour les cas M4 à M6, le nom de la colonne qui contient le texte du modèle n'est pas dans cette recette (voir [À CONFIRMER] 3).

## Provoquer une panne réseau (CONV-61, 62, 69, 77)

Dans le navigateur, outils pour développeurs (F12), onglet **Réseau** :
- **CONV-61 et CONV-77** (pdfmake non chargé) : cocher « Désactiver le cache », bloquer les requêtes dont l'adresse contient « pdfmake » (fonction « Blocage de requêtes »), puis **recharger la page** : la bibliothèque ne se charge qu'au clic sur « Générer ». Si la bibliothèque est déjà chargée dans la page, le blocage ne fait rien.
- **CONV-62** (envoi impossible) : bloquer les requêtes d'envoi de pièce jointe. Lire dans l'onglet Réseau l'adresse de l'envoi du fichier (finit par « attachments » suivi du jeton) et bloquer le début de l'adresse, **sans copier le jeton** nulle part. Ce blocage peut aussi empêcher la lecture des logos : le PDF se fabrique alors sans logo, mais seul le message d'échec d'envoi est attendu.
- **CONV-69** (« Voir » impossible) : bloquer les requêtes de téléchargement d'une pièce jointe (adresse qui contient « download »).
- **CONV-67 et CONV-74** : régler le débit sur « Slow 3G » pour rendre l'attente visible.
- **Dans tous les cas : retirer le blocage et remettre le débit normal à la fin.** Si rien n'est bloqué, l'adresse choisie est fausse : la relire sans copier le jeton.
- Un jeton Grist ne doit **jamais** figurer dans une fiche d'anomalie, une capture ou ce document.

## Les cas de R4 restants après le nettoyage du 2026-11-04

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Génération par dispositif (profil FT National)

- **CONV-44 : Du stade vers l'emploi** (Nominal, Bloquant, fumée) : cases remplies dont le SIRET de l'agence, `{signatures:ft-gauche}`, nom de fichier `Convention-Stade-emploi-Club-Exemple-[année].pdf`, fichier et date enregistrés.
- **CONV-45 : Match des métiers** (Nominal, Bloquant) : adresse de l'agence, `{signatures:ft-gauche}`, `Convention-Match-metiers-Club-Exemple-[année].pdf`.
- **CONV-46 : Parcours de remobilisation** (Nominal, Bloquant) : pas d'année, adresse de l'agence, `{signatures:lieu-date}`, `Convention-Remobilisation-Club-Exemple.pdf`.
- **CONV-47 : nom du fichier avec accents, « & » et « œ »** (Limite, Majeur).
- **CONV-48 : club sans SIRET, pointillés et pas de blocage** (Limite, Majeur).

### Logos

- **CONV-49 : Logo et Logo_partenaire remplis, aucun message** (Nominal, Majeur).
- **CONV-50 : Logo vide, message « sans le logo France Travail », génération réussie** (Limite, Majeur).
- **CONV-51 : Logo vide et Logo_partenaire rempli** (Limite, Mineur).
- **CONV-52 : Logo_partenaire illisible, message « sans le logo du partenaire »** (Erreur, Mineur).

### Contrôle des champs obligatoires au clic sur « Générer »

- **CONV-58 : fonction du représentant vide** (Erreur, Majeur) : « Saisissez la fonction du représentant. »

### Échecs de génération

- **CONV-61 : pdfmake non chargé (réseau)** (Erreur, Bloquant).
- **CONV-62 : envoi du fichier impossible (réseau)** (Erreur, Majeur).
- **CONV-63 : une case inconnue dans le modèle** (Erreur, Majeur).
- **CONV-64 : plusieurs cases inconnues** (Limite, Mineur).
- **CONV-65 : nom de case avec une balise HTML, affiché comme du texte** (Limite, Majeur).
- **CONV-66 : modèle inactif** (Erreur, Majeur).









## [À CONFIRMER] de R4

1. **Modèles officiels dans TEST** : non vérifié (le recetteur n'a pas accès à TEST). Les colonnes exactes de `Modeles_convention` (celle du texte, `Logo`, `Logo_partenaire`), les cases réellement présentes dans le texte de chaque modèle (le SIRET de l'agence pour Du stade vers l'emploi et l'adresse de l'agence pour les deux autres sont pris dans la demande, pas relus dans les modèles), les intitulés des colonnes de signature de Parcours de remobilisation (la note ne les donne pas) et le séparateur de l'adresse « sur une ligne » sont à relever par le testeur.
2. **Comptes réels** pour CONV-71 et CONV-72 : quel compte FT Régional et quel compte FT Départemental, tous deux éditeurs et non propriétaires, avec profil complet ? Aucun compte n'est inventé ici.
3. **Façon de provoquer les échecs de modèle** (CONV-63 à 66) : y a-t-il un seul modèle par dispositif (donc modification du vrai modèle) ? Le widget relit-il `Modeles_convention` au clic (nécessaire pour CONV-66) ou seulement au chargement de la page ? Si seulement au chargement, CONV-66 n'est pas jouable à l'écran (Non applicable). Quelle est la colonne du texte du modèle ?
4. **CONV-65** : le widget reconnaît-il une case dont le nom contient des chevrons ? Sinon, essayer un autre nom ou noter Non applicable.
5. **CONV-56** : la note dit que le focus va sur « le premier champ à corriger ». Quand le seul champ en erreur est « Fonction du signataire » (lecture seule), où va le focus ? Noter l'endroit constaté.
6. **Adresses à bloquer dans l'onglet Réseau** (CONV-61, 62, 69) : « pdfmake », début de l'adresse d'envoi, « download » sont des hypothèses à confirmer en regardant l'onglet Réseau (sans copier le jeton).
7. **Compte du testeur « National »** : même question qu'en R1 et R2 (vrai profil FT National, ou propriétaire du document ?).
8. **CONV-50** : l'alerte de succès (verte) pour un message qui demande de vérifier le modèle est un point ouvert de la fiche C48 (variante d'alerte d'information à confirmer dans le design system). Ne pas noter KO pour la couleur seule.
9. **Tests en code** : les noms exacts des tests, non relus, sont à ajouter dans la colonne `Remarques` si on veut la même précision qu'en R2.

---

# Cas de test : Convention, re-générer le PDF (R5)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-79 (R1, R2 et R4) ci-dessus n'ont pas été modifiés.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » et fenêtre « Convention ».
- Branche : `feature/convention`. Fonction E : re-générer le PDF (fiches C50 et C51 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md`, §12 « Re-générer (S8) » (elle fait foi, décisions D-S8-1 à D-S8-7). Les textes attendus en sont copiés mot pour mot (§2, §3 « Échecs » et §12.3, §12.7).
- Le fichier `cas-de-test-convention.tsv` contient les 26 cas de R5 (CONV-80 à CONV-105), à la suite des 79 de R1, R2 et R4 : 105 lignes de cas, 18 colonnes.
- Les actions de R5 s'appellent ESSAI-CONV-S1 à ESSAI-CONV-S25. **« S » veut dire « S8 »** (la re-génération) : à ne pas confondre avec les actions A (R1), B (R2) et R (R4).

## Ce que cette recette couvre et ne couvre pas

- Elle couvre : le bouton « Re-générer » (état Générée seulement), la fenêtre préremplie et sa phrase de remplacement, le remplacement du PDF (`PDF_genere`, `Date_generation`, `Modele`), le blocage, les échecs avec « L'ancienne convention reste disponible. », la persistance, les droits d'un vrai compte, le clavier, VoiceOver, le zoom et le mobile.
- Hors de cette recette : le dépôt du fichier signé (R6). L'état Signée n'est regardé que pour vérifier qu'il n'a **jamais** de bouton « Re-générer » (CONV-97).
- Tout ce qui est écrit pour « Générer » (messages de champs, logos, mise en page du PDF, attente verrouillée) s'applique à l'identique (§12.1) et est déjà joué en R4 : il n'est pas rejoué ici.

## Cas volontairement non écrits (non jouables à l'écran)

1. **« Écriture réussie, mais réponse réseau perdue »** (§12.7) : Grist a bien écrit le nouveau PDF, mais la réponse ne revient pas. Impossible à provoquer à l'écran de façon fiable (il faudrait couper le réseau pile entre l'écriture et la réponse). Vérification de repli : le test en code de la relecture de secours (fiche C51, `conventionPdfRattache`), dont le nom exact n'a pas été relu. À l'écran, CONV-94 montre au moins que la fenêtre n'est jamais bloquée.
2. **Fichier signé déposé pendant que la fenêtre de re-génération est ouverte** (§12.7) : accepté sans traitement par Hanta, pas de test. Pas de cas.
3. **Plusieurs éléments manquants à la fois** : un seul message s'affiche (le premier dans l'ordre agence, club, dispositif, adresse). Déjà vérifié par un test en code pour la génération (R2), même règle pour « Re-générer ».
4. **Échec à l'étape 5b** (fichier envoyé mais non rattaché) : impossible à provoquer sans abîmer les données. Couvert en code (fiche C51).
5. **Grist supprime-t-il seul, après plusieurs jours, un fichier orphelin ?** (D-S8-7) : le résultat immédiat (34 puis 35 pièces jointes) est déjà vu par Hanta et rejoué par CONV-100. Le nettoyage après quelques jours n'est pas vérifié : à revoir plus tard.

## Cas qui se jouent dans DEV7, pas sur TEST

CONV-86, 87, 88 modifient ou désactivent un vrai modèle de `Modeles_convention`, et CONV-100 compte les pièces jointes du document. Pour les mêmes raisons qu'en R4 (ne pas toucher au modèle utilisé dans la recette du collègue), ils se jouent dans **DEV7**, avec les actions ESSAI-CONV-S7, S8, S9 et S21 recréées là. Avant de commencer : garder une copie du texte et des fichiers des modèles. **Après chaque cas : remettre le modèle en état (Actif = Oui sur la ligne d'origine, suppression de la ligne ajoutée) et recharger la page.**

### Pourquoi le changement de modèle est jouable (CONV-86, 87)

La fenêtre et le PDF prennent le **modèle actif** du dispositif (le plus ancien s'il y en a plusieurs actifs). Pour changer de modèle sans écraser l'original : mettre la ligne d'origine (A) à `Actif = Non`, ajouter une ligne B active pour le même dispositif. La ligne `Conventions` de l'action de test garde `Modele = A` : c'est la preuve de départ. Après la re-génération, `Modele` doit valoir B. Le widget lit probablement les modèles au chargement de la page : **recharger après chaque modification** ([À CONFIRMER] 3).

## Données d'essai de R5 à créer dans TEST avant de jouer

Données fictives uniquement (exemple.fr). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1, R2 et R4 restent en place.** On réutilise le club « Club Exemple », ses contacts (Alex Martin-Exemple, Président), « Club Exemple Sans Adresse » (R1) et l'agence d'essai (adresse et SIRET fictifs) ; on ne crée ni DR, ni DD, ni club.

### Ligne `Conventions` à préparer pour chaque action « déjà générée »

Même principe qu'en R1 et R4. « PDF fictif » = un petit PDF d'une page contenant seulement « Convention d'essai, données fictives », **nommé convention-essai-fictif.pdf** (ce nom sert à vérifier que l'ancien fichier a bien disparu de la cellule). Sauf mention contraire dans le tableau :

| Colonne | Valeur |
| --- | --- |
| Action | l'action ESSAI-CONV-S… concernée |
| Modele | le modèle actif du dispositif de l'action |
| Annee | 2026 (vide pour Parcours de remobilisation, qui n'a pas d'année) |
| Signataire_club | Alex Martin-Exemple (contact de Club Exemple) |
| Representant_agence | Dominique Exemple (fictif) |
| Fonction_representant | Directeur d'agence |
| PDF_genere | PDF fictif (convention-essai-fictif.pdf) |
| Date_generation | 14/10/2026 à 12:00 (midi : la date affichée reste la même quel que soit le fuseau horaire) |
| PDF_signe, Date_depot | vides |

Ne jamais renommer ni écrire à la main les colonnes `DR` et `DD` de `Conventions` : elles servent aux règles d'accès. Créer ces lignes par un propriétaire du document.

### Actions d'essai (Corbeille = non)

Chaque cas qui écrit a **son action** : aucun cas ne dépend d'un autre. Toutes utilisent l'agence d'essai, sauf indication. Stade = Du stade vers l'emploi ; Match = Match des métiers ; Remob. = Parcours de remobilisation vers l'emploi. « Générée » = ligne `Conventions` préparée comme ci-dessus.

| Intitulé | Dispositif | Club | État au départ | Écart avec la ligne type | Sert au cas |
| --- | --- | --- | --- | --- | --- |
| ESSAI-CONV-S1 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-80 (lecture) |
| ESSAI-CONV-S2 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-81 (écrit) |
| ESSAI-CONV-S3 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | **Annee = 2025** | CONV-82 (écrit) |
| ESSAI-CONV-S4 | Remob. | Club Exemple | Générée, modèle Remob., 14/10/2026 | Annee vide | CONV-83 (écrit) |
| ESSAI-CONV-S5 | Stade | Club Exemple | **À générer : aucune ligne dans Conventions** | (pas de ligne) | CONV-84 (lecture) |
| ESSAI-CONV-S6 | Match | Club Exemple | Générée, modèle Match, 14/10/2026 | aucun | CONV-85 (lecture) |
| ESSAI-CONV-S7 | Match | Club Exemple | Générée, `Modele` = ligne A (DEV7) | aucun | CONV-86 (DEV7, écrit) |
| ESSAI-CONV-S8 | Stade | Club Exemple | Générée, `Modele` = ligne A (DEV7) | aucun | CONV-87 (DEV7, écrit) |
| ESSAI-CONV-S9 | Stade | Club Exemple | Générée, modèle Stade (DEV7) | aucun | CONV-88 (DEV7, écrit) |
| ESSAI-CONV-S10 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun (l'agence est vidée pendant le cas, puis remise) | CONV-89 (modifie l'action) |
| ESSAI-CONV-S11 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun (le club est vidé pendant le cas, puis remis) | CONV-90 (modifie l'action) |
| ESSAI-CONV-S12 | Stade | **Club Exemple Sans Adresse** | Générée, modèle Stade, 14/10/2026 | aucun | CONV-91 et CONV-103 (lecture) |
| ESSAI-CONV-S13 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-92 (blocage pdfmake, écrit) |
| ESSAI-CONV-S14 | Match | Club Exemple | Générée, modèle Match, 14/10/2026 | aucun | CONV-93 (blocage de l'envoi, écrit) |
| ESSAI-CONV-S15 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-94 (coupure réseau, écrit) |
| ESSAI-CONV-S16 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-95 (lecture) |
| ESSAI-CONV-S17 | Match | Club Exemple | Générée, modèle Match, 14/10/2026 | aucun | CONV-96 (écrit) |
| ESSAI-CONV-S18 | Stade | Club Exemple | **Signée** | **PDF_signe = PDF fictif, Date_depot = 20/10/2026 à 12:00** | CONV-97 (lecture) |
| ESSAI-CONV-S19 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-98 (FT Régional, vrai compte, écrit) |
| ESSAI-CONV-S20 | Match | Club Exemple | Générée, modèle Match, 14/10/2026 | aucun | CONV-99 (FT Départemental, vrai compte, écrit) |
| ESSAI-CONV-S21 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-100 (DEV7, écrit) |
| ESSAI-CONV-S22 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-101 (lecture) |
| ESSAI-CONV-S23 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-102 (écrit) |
| ESSAI-CONV-S24 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-104 (lecture) |
| ESSAI-CONV-S25 | Stade | Club Exemple | Générée, modèle Stade, 14/10/2026 | aucun | CONV-105 (lecture) |

**Actions qui doivent déjà avoir un PDF généré avant de commencer : toutes, SAUF ESSAI-CONV-S5** (volontairement « À générer », pour CONV-84). S18 a en plus un fichier signé. Les actions A3 et A6 de R1 (déjà signées) servent aussi à CONV-97.

Les actions « lecture » (S1, S5, S6, S12, S16, S18, S22, S24, S25) ne sont jamais modifiées : elles se rejouent telles quelles. **Pour rejouer un cas qui écrit** : remettre la ligne `Conventions` à son état de départ (PDF fictif, date du 14/10/2026, Annee et modèle d'origine) ou recréer l'action.

### Profils

- Prérequis commun : le profil FT National est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai.
- CONV-98 (FT Régional) et CONV-99 (FT Départemental) se jouent avec **de vrais comptes**, comme CONV-71 et CONV-72 (R4) : éditeurs, jamais propriétaires, profil complet, navigateur à part. **Pas de « Voir en tant que »** (fiche C41). Aucun compte n'est inventé ici : voir [À CONFIRMER] 2.

## Provoquer les pannes réseau (CONV-92, 93, 94, 102)

Même méthode qu'en R4 (voir « Provoquer une panne réseau » plus haut) :
- **CONV-92** (pdfmake non chargé) : bloquer « pdfmake » dans l'onglet Réseau, « Désactiver le cache » coché, **recharger la page après le blocage**.
- **CONV-93** (envoi impossible) : bloquer le début de l'adresse d'envoi de pièce jointe, **sans copier le jeton**.
- **CONV-94** (coupure complète) : régler le débit sur « Hors connexion » **après** avoir cliqué sur « Re-générer » et rempli la fenêtre, puis cliquer sur « Générer la convention ». Le message dépend de l'étape touchée : le noter tel quel.
- **CONV-102** : « Slow 3G » pour rendre l'attente audible.
- **Dans tous les cas : retirer le blocage et remettre le débit normal à la fin.** Un jeton Grist ne doit **jamais** figurer dans une fiche d'anomalie, une capture ou ce document.

## Les cas de R5 restants après le nettoyage du 2026-11-04

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Re-génération réussie (profil FT National)

- **CONV-80 : bouton « Re-générer », fenêtre préremplie, phrase de remplacement** (Nominal, Bloquant, fumée) : ordre des quatre boutons, phrase « Le nouveau PDF remplacera la convention générée le 14/10/2026. », champs préremplis.
- **CONV-81 : le nouveau PDF remplace l'ancien** (Nominal, Bloquant, fumée) : un seul fichier dans `PDF_genere`, `Date_generation` à jour, `Modele` = modèle actif, `PDF_signe` et `Date_depot` vides, focus sur « Voir la convention ».
- **CONV-83 : Parcours de remobilisation** (Limite, Majeur) : pas de champ Année, nom sans année.
- **CONV-84 : pas de phrase de remplacement à la première génération** (Nominal, Majeur).

### Modèle actif (DEV7)

- **CONV-86 : le texte du modèle a changé** (Nominal, Majeur) : le nouveau texte sort, `Modele` = nouveau modèle.
- **CONV-87 : le modèle actif n'a plus d'année** (Limite, Majeur) : pas de champ Année, nom sans année.
- **CONV-88 : le modèle devient inactif pendant que la fenêtre est ouverte** (Erreur, Majeur) : message + « L'ancienne convention reste disponible. ».

### Blocage

- **CONV-89 : agence retirée après la génération** (Erreur, Majeur) : « Renseignez l'agence de l'action dans sa fiche. »
- **CONV-90 : club retiré** (Erreur, Majeur) : « Renseignez le club de l'action. »

### Échecs : l'ancienne convention reste disponible

- **CONV-92 : pdfmake non chargé** (Erreur, Bloquant) : message, ancien PDF ouvrable, nouveau Représentant gardé.
- **CONV-93 : envoi du fichier impossible** (Erreur, Majeur).
- **CONV-94 : coupure réseau complète** (Erreur, Bloquant) : la fenêtre n'est jamais bloquée.



### Pas de confusion avec l'état Signée

- **CONV-97 : jamais de « Re-générer » à l'état Signée** (Nominal, Majeur) : S18, A3 et A6.



### Ancien fichier

- **CONV-100 : l'ancien fichier n'est pas supprimé par le widget** (Persistance, Mineur, DEV7) : N pièces jointes puis N+1.



## [À CONFIRMER] de R5

1. **Lignes `Conventions` préparées** : leur création (par un propriétaire) et les noms de colonnes `Modele`, `Annee`, `Signataire_club`, `Representant_agence`, `Fonction_representant` viennent du script (`conventionAEcrire`), pas d'une vérification dans TEST. À contrôler avant de jouer.
2. **Comptes réels** pour CONV-98 et CONV-99 : quel compte FT Régional et quel compte FT Départemental, tous deux éditeurs et non propriétaires, avec profil complet ? Aucun compte n'est inventé ici (même question que R4, [À CONFIRMER] 2).
3. **Modèles (CONV-86 à 88)** : la colonne qui contient le texte du modèle n'est pas dans cette recette. Le widget relit-il `Modeles_convention` au clic (nécessaire pour CONV-88) ou seulement au chargement ? Si seulement au chargement, CONV-88 n'est pas jouable à l'écran (Non applicable). La fiche C51 signale aussi que la fenêtre peut afficher l'ancien modèle après changement : à noter tel que constaté.
4. **CONV-87** : après une re-génération avec un modèle sans année, la colonne `Annee` est-elle conservée ou vidée ? La note ne le dit pas : noter la valeur constatée.
5. **CONV-94** : la durée totale avant le message en cas de coupure complète n'est pas dans la note (délais de 15 à 20 secondes par appel dans le script). J'ai fixé une limite de 2 minutes pour noter KO : à valider par Hanta.
6. **CONV-100** : l'endroit où Grist affiche le nombre de pièces jointes du document n'est pas indiqué ici : à relever par le testeur.
7. **CONV-89 et CONV-90** : l'interface permet-elle de vider l'agence et le club d'une action ? Sinon, vider la cellule dans la table Actions (même question qu'en R2 pour CONV-17).
8. **Compte du testeur « National »** : même question qu'en R1, R2 et R4 (vrai profil FT National, ou propriétaire du document ?).
9. **Tests en code** : les noms exacts des tests, non relus, sont à ajouter dans la colonne `Remarques` si on veut la même précision qu'en R2.

---

# Cas de test : Convention, déposer, remplacer et revoir le fichier signé (R6)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-105 (R1, R2, R4 et R5) ci-dessus n'ont pas été modifiés.

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » (pas de fenêtre pour le dépôt).
- Branche : `feature/convention`. Fonction F : déposer et remplacer le fichier signé, et le revoir (fiches C52, C53 et C54 de REVIEW_LOG.md).
- Référence : `docs/ux/convention.md`, §4, §4.1 et §13 (décisions S9-1 à S9-8). Elle fait foi. Les textes attendus en sont copiés mot pour mot (§4, §5, §4.1 d) et e), S9-4).
- Le fichier `cas-de-test-convention.tsv` contient les 33 cas de R6 (CONV-106 à CONV-138), à la suite des 105 de R1, R2, R4 et R5 : 138 lignes de cas, 18 colonnes.
- Les actions de R6 s'appellent ESSAI-CONV-T1 à ESSAI-CONV-T24. **« T » veut dire « S9 »** (le dépôt du fichier signé) : à ne pas confondre avec les actions A (R1), B (R2), R (R4) et S (R5).

## Ce que cette recette couvre et ne couvre pas

- Elle couvre : « Déposer la convention signée » (état Générée) et « Remplacer le fichier signé » (état Signée) ; les cinq contrôles du fichier dans leur ordre ; le nom du fichier enregistré ; l'écriture de `PDF_signe` et `Date_depot` ; l'attente, le verrou et « Re-générer » grisé ; « Voir la convention signée » ; les échecs réseau ; le message de droits refusés ; la persistance ; les droits d'un vrai compte ; le clavier, VoiceOver, le zoom et le mobile.
- Hors de cette recette : la génération (R4) et la re-génération (R5), jouées avant. L'état Signée n'a jamais de bouton « Re-générer » : c'est CONV-97 (R5).
- Tout ce qui est écrit pour « Voir la convention » (R4, CONV-68 et 69) s'applique à l'identique à « Voir la convention signée » : CONV-122 en refait le cœur, pas plus.

## Cas volontairement non écrits (non jouables à l'écran)

1. **Type du fichier vide ou différent de `application/pdf`** (contrôle n° 4, décision S9-6) : le navigateur déduit le type de l'extension, on ne peut donc pas fabriquer à l'écran un fichier `.pdf` dont le type est vide ou autre. Ce contrôle n'est vu qu'en code (fiche C53, noms non relus). Point que la note signale elle-même comme **non vérifié sur les navigateurs de l'équipe** : un vrai PDF sans type serait-il refusé à tort ? CONV-106 montre au moins qu'un vrai PDF avec son type passe. À faire vérifier par Hanta.
2. **« Écriture réussie, mais réponse réseau perdue »** (§4.1 g), point 5) : Grist a écrit `PDF_signe` mais la réponse ne revient pas. Impossible à provoquer de façon fiable. Vérification de repli : le test en code de la relecture de secours (fiche C53), nom non relu. À l'écran, CONV-125 et 126 montrent au moins que le bloc n'est jamais bloqué.
3. **Envoi réussi, écriture refusée ou perdue** (fichier envoyé mais `PDF_signe` non écrit : le nouveau fichier reste sans rattachement) : impossible sans abîmer les données. CONV-130 peut y mener par construction (le refus vient après l'envoi) : à noter si c'est le cas.
4. **Bloc refait pendant l'envoi** (rechargement des données de la fiche, §4.1 d)) : pas provocable de façon fiable à l'écran. Couvert en code (fiche C54 : le bouton « Voir » est refait avec son état, noms non relus).
5. **Nettoyage par Grist des fichiers sans rattachement après plusieurs jours** (S9-8) : non vérifié, comme pour R5 (D-S8-7). Le résultat immédiat (N puis N+1 pièces jointes) est rejoué par CONV-108.
6. **Nom de club de plus de 40 caractères** (§4.1 k)) : voir [À CONFIRMER] 12.

## Cas qui se jouent dans DEV7, pas sur TEST

- **CONV-108** (compte les pièces jointes du document) : même raison que CONV-100 (R5). L'action ESSAI-CONV-T3 est recréée dans DEV7.
- **CONV-130** (droits refusés) : il faut un refus d'écriture réel, donc des règles d'accès modifiées temporairement par un propriétaire, et l'action ESSAI-CONV-T19 recréée dans DEV7. **Après le cas : remettre les règles d'accès exactement comme elles étaient.**

## Fichiers d'essai à préparer avant de jouer

Fictifs, sans donnée de personne. Un « vrai PDF » est un PDF d'une page qui s'ouvre normalement. À ranger dans un dossier à part sur l'ordinateur du testeur (jamais dans le dépôt). **Les commandes ci-dessous sont proposées, pas essayées** (le recetteur n'en lance aucune, voir [À CONFIRMER] 3) : à lancer par la personne qui teste, puis à contrôler avec `ls -l` (taille en octets).

| Fichier | Ce que c'est | Sert aux cas |
| --- | --- | --- |
| `scan-signe-fictif-A.pdf` | vrai PDF d'une page : « Convention signée d'essai A, données fictives » | 106, 110 à 112, 121, 127, 128, 131, 133, 134 |
| `scan-signe-fictif-B.pdf` | vrai PDF d'une page : « Convention signée d'essai B, données fictives » | 107, 108, 128, 129, 132, 133, 134 |
| `Camille-Exemple-scan-original.pdf` | copie de A, nommée avec un nom de personne fictif | 109 |
| `signe-ancien-fictif.pdf` | vrai PDF : « Ancienne convention signée d'essai, données fictives ». **Pas un fichier à choisir** : il est mis dans `PDF_signe` des actions « Signée » avant de jouer | 107, 108, 120, 122, 123, 126, 129, 132, 136 |
| `convention-essai-fictif.pdf` | le « PDF fictif » de R1, R4 et R5, dans `PDF_genere` de toutes les actions | toutes |
| `vide.pdf`, `vide.txt` | fichiers de 0 octet | 113, 117 |
| `gros-fichier-11Mo.pdf` | 11 534 336 octets, commence par `%PDF-` | 114 |
| `gros-fichier-12Mo.docx` | 12 582 912 octets, nom en `.docx` | 117 |
| `limite-10485760.pdf` | exactement 10 485 760 octets (10 × 1024 × 1024), commence par `%PDF-` | 115 |
| `limite-10485761.pdf` | exactement 10 485 761 octets, commence par `%PDF-` | 115 |
| `lent-1Mo.pdf` | copie de `scan-signe-fictif-A.pdf` à laquelle on ajoute environ 1 Mo de zéros à la fin (le PDF reste lisible, à confirmer) | 123 à 126, 135 |
| `faux-pdf-texte.pdf` | quelques mots de texte brut dans un fichier nommé `.pdf` | 118, 120, 121, 136 à 138 |
| `image-renommee.pdf` | une vraie image PNG dont l'extension a été changée en `.pdf` | 119 |
| `document-word-fictif.docx` | un petit vrai document Word fictif | 116 |

Commandes proposées (Mac, terminal, depuis le dossier des fichiers) :

- Fichiers vides : `: > vide.pdf` puis `: > vide.txt`.
- 11 Mo : `{ printf '%%PDF-1.4\n'; head -c 11534327 /dev/zero; } > gros-fichier-11Mo.pdf` (9 octets d'en-tête, puis le reste).
- 12 Mo : `head -c 12582912 /dev/zero > gros-fichier-12Mo.docx`.
- 10 Mo exact : `{ printf '%%PDF-1.4\n'; head -c 10485751 /dev/zero; } > limite-10485760.pdf`.
- 10 Mo plus 1 octet : `{ printf '%%PDF-1.4\n'; head -c 10485752 /dev/zero; } > limite-10485761.pdf`.
- Fichier lent : `cp scan-signe-fictif-A.pdf lent-1Mo.pdf` puis `head -c 1048576 /dev/zero >> lent-1Mo.pdf`.
- Faux PDF : `echo "Ceci n'est pas un PDF, données fictives." > faux-pdf-texte.pdf`.

## Données d'essai de R6 à créer dans TEST avant de jouer

Données fictives uniquement (exemple.fr). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1, R2, R4 et R5 restent en place.** On réutilise « Club Exemple » (adresse complète), « Étoile & Cœur FC » (créé en R4) et l'agence d'essai ; on ne crée ni DR, ni DD, ni club, ni contact.

### Deux lignes `Conventions` types

Sauf mention contraire dans le tableau des actions. « PDF fictif » = `convention-essai-fictif.pdf` (voir R5).

| Colonne | État « Générée » | État « Signée » |
| --- | --- | --- |
| Action | l'action ESSAI-CONV-T… concernée | idem |
| Modele | le modèle actif du dispositif | idem |
| Annee | 2026 (vide pour Parcours de remobilisation) | idem |
| Signataire_club | Alex Martin-Exemple | idem |
| Representant_agence | Dominique Exemple (fictif) | idem |
| Fonction_representant | Directeur d'agence | idem |
| PDF_genere | PDF fictif | PDF fictif |
| Date_generation | 14/10/2026 à 12:00 | 14/10/2026 à 12:00 |
| PDF_signe | vide | `signe-ancien-fictif.pdf` |
| Date_depot | vide | 20/10/2026 à 12:00 (midi : la date affichée reste la même quel que soit le fuseau) |

Ne jamais renommer ni écrire à la main les colonnes `DR` et `DD` de `Conventions`. Créer ces lignes par un propriétaire du document.

### Actions d'essai (Corbeille = non)

Chaque cas qui écrit a **son action** : aucun cas ne dépend d'un autre. Toutes utilisent l'agence d'essai. Stade = Du stade vers l'emploi ; Match = Match des métiers ; Remob. = Parcours de remobilisation vers l'emploi.

| Intitulé | Dispositif | Club | État au départ | Écart avec la ligne type | Sert au cas |
| --- | --- | --- | --- | --- | --- |
| ESSAI-CONV-T1 | Stade | Club Exemple | **Générée** | aucun | CONV-106 (écrit) |
| ESSAI-CONV-T2 | Stade | Club Exemple | **Signée** | aucun | CONV-107 (écrit) |
| ESSAI-CONV-T3 | Stade | Club Exemple | **Signée** (DEV7) | aucun | CONV-108 (DEV7, écrit) |
| ESSAI-CONV-T4 | Stade | Club Exemple | Générée | aucun | CONV-109 (écrit) |
| ESSAI-CONV-T5 | Match | **Étoile & Cœur FC** | Générée | aucun | CONV-110 (écrit) |
| ESSAI-CONV-T6 | Remob. | Club Exemple | Générée | **Annee vide** | CONV-111 (écrit) |
| ESSAI-CONV-T7 | Stade | Club Exemple | Générée | **Annee = 12** | CONV-112 (écrit) |
| ESSAI-CONV-T8 | Stade | Club Exemple | Générée | aucun | CONV-113, 114, 116, 117, 118, 119, 137, 138 (« refus » : ne s'écrit jamais) |
| ESSAI-CONV-T9 | Stade | Club Exemple | Signée | aucun | CONV-120, 122, 136, 137, 138 (« signée, lecture » : ne s'écrit jamais) |
| ESSAI-CONV-T10 | Stade | Club Exemple | Générée | aucun | CONV-115 (écrit) |
| ESSAI-CONV-T11 | Stade | Club Exemple | Générée | aucun | CONV-121 (écrit) |
| ESSAI-CONV-T12 | Stade | Club Exemple | Signée | aucun | CONV-123 (écrit) |
| ESSAI-CONV-T13 | Stade | Club Exemple | Générée | aucun | CONV-124 (écrit) |
| ESSAI-CONV-T14 | Stade | Club Exemple | Générée | aucun | CONV-125 (coupure réseau) |
| ESSAI-CONV-T15 | Stade | Club Exemple | Signée | aucun | CONV-126 (coupure réseau) |
| ESSAI-CONV-T16 | Stade | Club Exemple | Générée | aucun | CONV-127 (envoi bloqué puis réussi, écrit) |
| ESSAI-CONV-T17 | Stade | Club Exemple | Générée | aucun | CONV-128 (FT Régional, vrai compte, écrit) |
| ESSAI-CONV-T18 | Match | Club Exemple | Signée | aucun | CONV-129 (FT Départemental, vrai compte, écrit) |
| ESSAI-CONV-T19 | Stade | Club Exemple | Générée (DEV7) | aucun | CONV-130 (DEV7, droits refusés) |
| ESSAI-CONV-T20 | Stade | Club Exemple | Générée | aucun | CONV-131 (écrit) |
| ESSAI-CONV-T21 | Stade | Club Exemple | Signée | aucun | CONV-132 (écrit) |
| ESSAI-CONV-T22 | Stade | Club Exemple | Générée | aucun | CONV-133 (écrit) |
| ESSAI-CONV-T23 | Stade | Club Exemple | Générée | aucun | CONV-134 (écrit) |
| ESSAI-CONV-T24 | Stade | Club Exemple | Générée | aucun | CONV-135 (écrit) |

**À l'état « Générée » avant de commencer (17 actions)** : T1, T4, T5, T6, T7, T8, T10, T11, T13, T14, T16, T17, T19, T20, T22, T23, T24. C'est là qu'on dépose.
**À l'état « Signée » avant de commencer (7 actions)** : T2, T3, T9, T12, T15, T18, T21. C'est là qu'on remplace et qu'on teste la persistance.

**Pour rejouer un cas qui écrit** : remettre la ligne `Conventions` à son état de départ (vider `PDF_signe` et `Date_depot` pour une action « Générée », ou remettre `signe-ancien-fictif.pdf` et le 20/10/2026 à 12:00 pour une action « Signée ») ou recréer l'action. Les actions « refus » (T8) et « signée, lecture » (T9) ne sont jamais modifiées si tout se passe bien : si l'une change, c'est une anomalie à noter, puis la remettre en état.

### Profils

- Prérequis commun : le profil FT National est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai.
- CONV-128 (FT Régional) et CONV-129 (FT Départemental) se jouent avec **de vrais comptes**, comme CONV-71, 72, 98 et 99 : éditeurs, jamais propriétaires, profil complet, navigateur à part. **Pas de « Voir en tant que »** (fiche C41). Aucun compte n'est inventé ici : voir [À CONFIRMER] 9.
- CONV-130 (droits refusés) : voir [À CONFIRMER] 8.

## Provoquer les pannes réseau (CONV-123 à 127, 135)

Même méthode qu'en R4 et R5 (voir « Provoquer une panne réseau » plus haut), dans les outils du navigateur (F12), onglet **Réseau** :
- **Allonger l'envoi (CONV-123, 124, 135)** : régler le débit sur « Fast 3G » et utiliser `lent-1Mo.pdf`. L'envoi dure alors quelques secondes, ce qui laisse le temps de lire « Envoi en cours… » et de cliquer. Ajuster la taille du fichier pour viser **5 à 10 secondes** d'attente : trop court, on ne peut rien lire ; trop long (plus de 15 à 20 secondes, délai maximum du script par appel), l'échec « Le fichier n'a pas pu être enregistré. » arrive pour de bon ([À CONFIRMER] 3). Le choix de « Fast 3G » plutôt que « Slow 3G » vient de là : à « Slow 3G », 1 Mo dépasserait le délai.
- **Coupure complète (CONV-125 et 126)** : « Fast 3G » d'abord, puis régler sur « Hors connexion » **dès que « Envoi en cours… » est affiché**. Le message dépend de l'étape touchée : le noter tel quel.
- **Envoi impossible (CONV-127)** : bloquer le début de l'adresse d'envoi de pièce jointe (elle finit par « attachments » suivi du jeton), **sans copier le jeton** nulle part.
- **Dans tous les cas : retirer le blocage et remettre le débit normal à la fin.** Un jeton Grist ne doit **jamais** figurer dans une fiche d'anomalie, une capture ou ce document.

## Les cas de R6 restants après le nettoyage du 2026-11-04

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Dépôt et remplacement réussis (profil FT National)

- **CONV-106 : premier dépôt** (Nominal, Bloquant, fumée) : alerte « Convention signée enregistrée. », état Signée, « Voir la convention signée » et « Remplacer le fichier signé » apparus, focus sur « Voir la convention signée », `PDF_genere` et `Date_generation` inchangés.
- **CONV-107 : remplacement** (Nominal, Bloquant, fumée) : le nouveau fichier remplace l'ancien sans historique, `Date_depot` mise à jour, le focus reste sur « Remplacer le fichier signé ».
- **CONV-108 : l'ancien fichier n'est pas supprimé** (Persistance, Mineur, DEV7) : N puis N+1 pièces jointes.

### Nom du fichier enregistré

- **CONV-109 : nom pour Du stade vers l'emploi, nom d'origine jamais repris** (Nominal, Majeur) : `Convention-signee-Stade-emploi-Club-Exemple-2026.pdf`.
- **CONV-110 : club à accents et « & »** (Limite, Majeur) : `Convention-signee-Match-metiers-Etoile-Coeur-FC-2026.pdf`.
- **CONV-111 : Parcours de remobilisation, sans année** (Limite, Majeur) : `Convention-signee-Remobilisation-Club-Exemple.pdf`.
- **CONV-112 : année enregistrée invalide, omise du nom** (Limite, Mineur) : `Convention-signee-Stade-emploi-Club-Exemple.pdf`.

### Fichiers refusés (un cas par contrôle, dans l'ordre de la note)

- **CONV-113 : fichier vide** (Erreur, Majeur) : « le fichier est vide ».
- **CONV-114 : plus de 10 Mo** (Erreur, Majeur) : « 10 Mo au maximum ».
- **CONV-115 : la limite exacte** (Limite, Majeur) : 10 485 761 octets refusé, 10 485 760 accepté.
- **CONV-117 : ordre des contrôles** (Erreur, Majeur) : un fichier vide en `.txt` reçoit « vide » ; 12 Mo en `.docx` reçoit « 10 Mo ».
- **CONV-120 : refus au remplacement, l'ancien fichier reste** (Erreur, Bloquant) : date et fichier inchangés, « Voir » ouvre l'ancien.
- **CONV-121 : annulation du sélecteur, et même fichier choisi deux fois** (Limite, Mineur).



### Pendant l'envoi

- **CONV-124 : verrou et « Re-générer » grisé** (Limite, Majeur) : second clic, Entrée et Espace ne lancent rien.

### Échecs d'envoi

- **CONV-125 : coupure réseau pendant un dépôt** (Erreur, Bloquant) : message après l'attente, jamais bloqué.
- **CONV-126 : coupure réseau pendant un remplacement** (Erreur, Bloquant) : l'ancien fichier signé reste intact et s'ouvre toujours.
- **CONV-127 : envoi bloqué, puis nouvel essai sans recharger** (Erreur, Majeur).

### Droits (vrais comptes, pas « Voir en tant que »)

- **CONV-130 : droits refusés, message distinct** (Droits, Majeur, DEV7) : « …vos droits ne le permettent pas pour cette action… » (S9-4).



### Sécurité

- **CONV-133 : aucun jeton dans la console, le bloc ou une adresse** (Nominal, Bloquant).



## [À CONFIRMER] de R6

1. **CONV-125 et 126** : la durée totale avant le message en cas de coupure n'est pas dans la note (délais de 15 à 20 secondes par appel dans le script, étendus au dépôt par la fiche C53). J'ai fixé une limite de 2 minutes pour noter KO : à valider par Hanta. L'étendue du test `convention-delais.test.js` au dépôt n'a pas été relue.
2. **Sélecteur de fichiers (CONV-116 et 117)** : le champ est ouvert avec `accept="application/pdf,.pdf"`. Peut-on, avec le navigateur de l'équipe, passer le filtre sur « Tous les fichiers » pour choisir un `.docx` ou un `.txt` ? Sinon (Safari, par exemple), ces deux cas sont Non applicables et on s'appuie sur les tests en code. Les cas CONV-118 et 119 (nom en `.pdf`) se jouent dans tous les cas.
3. **Fichiers d'essai** : les commandes proposées plus haut ne sont ni lancées ni essayées. Le PDF lent (copie de A plus des zéros à la fin) reste-t-il lisible dans le lecteur de PDF du navigateur ? Quel débit et quelle taille donnent une attente de 5 à 10 secondes sans dépasser le délai du script ? À régler par le testeur ; Hanta dit ce qu'elle a fait en DEV7.
4. **Extension en majuscules** : un vrai PDF nommé `SCAN.PDF` est-il accepté ? La note dit « extension `.pdf` » sans parler de la casse. Pas de cas écrit : à ajouter si Hanta tranche.
5. **CONV-112 (réglé par Hanta le 2026-10-26)** : Grist accepte 12 au niveau de la colonne (un nombre), mais le widget refuse déjà de générer avec cette valeur (« Saisissez une année à quatre chiffres. », testé en C31/C34). Une Annee invalide ne peut donc pas apparaître par le parcours normal : CONV-112 est un test de robustesse volontairement artificiel. Pour le jouer, dans DEV7 : modifier directement, dans la cellule Grist (pas dans le widget), la colonne Annee de la ligne Conventions de ESSAI-CONV-T7 pour y mettre 12, puis cliquer sur la commande de dépôt ou de remplacement pour vérifier que le nom du fichier omet bien l'année. Remettre la valeur d'origine ensuite.
6. **Où lire le nom du fichier de `PDF_signe`** (CONV-109 à 112, 115, 127, 129) : la cellule de pièce jointe de Grist, son aperçu, ou autre chose ? Le chemin exact n'est pas indiqué ici, comme pour `PDF_genere` en R4.
7. **CONV-108** : l'endroit où Grist affiche le nombre de pièces jointes du document (même question que R5, [À CONFIRMER] 6).
8. **CONV-130** : comment provoquer un refus d'écriture sur `Conventions` sans « Voir en tant que » ? Deux pistes : un profil réel dont les règles sont déjà en lecture seule sur `Conventions` (ANS ?), ou le retrait temporaire du droit de modification par un propriétaire de DEV7. Quelles sont les règles actuelles de `Conventions` pour chaque profil ? Non lues ici. L'envoi du fichier (pièce jointe) réussira-t-il alors que l'écriture est refusée, ou le refus tombera-t-il déjà à l'envoi ? Dans les deux cas le message attendu est celui de S9-4 ; noter ce qui est vu.
9. **Comptes réels** pour CONV-128 et 129 : quel compte FT Régional et quel compte FT Départemental, tous deux éditeurs et non propriétaires, avec profil complet ? Aucun compte n'est inventé ici (même question que R4, [À CONFIRMER] 2, et R5, [À CONFIRMER] 2).
10. **Compte du testeur « National »** : même question qu'en R1, R2, R4 et R5 (vrai profil FT National, ou propriétaire du document ?).
11. **Focus après un fichier refusé (CONV-113 et 120)** : la note précise le focus après une réussite et après un échec d'envoi (§4.1 e)), mais pas après un fichier refusé. J'ai écrit « le focus reste sur la commande » et demandé de noter où il est : à confirmer par Hanta.
12. **Nom de club de plus de 40 caractères** (§4.1 k)) : pas de cas écrit, faute d'un club d'essai de ce nom et d'un résultat attendu exact (l'ordre « nettoyer puis couper » n'est pas dit). À ajouter si Hanta le veut, avec le nom du PDF généré du même club comme référence.
13. **Date de dépôt près de minuit** : `Date_depot` est calculée avec la date du jour au moment de l'écriture (§4.1 f)). Éviter de jouer entre 23 h 30 et 0 h 30 pour que « la date du jour » reste la même du début à la fin d'un cas.
14. **Tests en code** : les noms exacts des tests, non relus, sont à ajouter dans la colonne `Remarques` si on veut la même précision qu'en R2.

---

# Cas de test : Convention, la fenêtre allégée (R8, Évolution 1)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-138 (R1, R2, R4, R5 et R6) ci-dessus n'ont pas été modifiés, mais **40 d'entre eux sont devenus obsolètes** (liste plus bas).

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » puis fenêtre « Convention » (générer ou re-générer).
- Branche : `feature/convention`. Évolution 1 : fiche C56 de REVIEW_LOG.md, décisions D-E1-1 à D-E1-21 de `docs/backlog.md`.
- Référence : `docs/ux/convention.md` (elle fait foi) : §2 (blocage), §3 (fenêtre, ajouter un contact, fermer, générer), §5 (textes), §6 (états), §7 (accessibilité), §12.3 (re-génération). Les textes attendus en sont copiés mot pour mot. **Une exception** : la note du §3 dit encore « 1200 px » pour le passage à deux colonnes ; le backlog (D-E1-20) dit 1100 px et fait foi pour le seuil (CONV-180).
- Le fichier `cas-de-test-convention.tsv` contient les 43 cas de R8 (CONV-139 à CONV-181), à la suite des 138 de R1, R2, R4, R5 et R6 : 181 lignes de cas, 18 colonnes.
- Les actions de R8 s'appellent ESSAI-CONV-U1 à ESSAI-CONV-U32. **« U » veut dire « Évolution 1 »** : à ne pas confondre avec les actions A (R1), B (R2), R (R4), S (R5) et T (R6).

## Ce qui a changé par rapport à R1, R2, R4, R5 et R6

- Plus de champ « Année » ni « Modèle utilisé » : la campagne vient de `Actions.Campagne` (référence vers `Campagnes.Campagne`) et s'affiche en sous-titre : « [Dispositif] · Campagne [Campagne] ».
- Deux blocs au lieu de trois : « Club » (un encart en lecture seule : nom, SIRET, adresse) et « Agence » (le nom seul, Représentant, Fonction du représentant).
- Plus aucun champ obligatoire : un champ vide donne des pointillés dans le PDF, doublés à 56 points (D-E1-21). Le seul blocage qui reste est à l'ouverture : il faut un club ET une agence sur l'action. Le blocage « adresse du club » n'existe plus.
- Bouton « Ajouter un contact » sous la liste « Signataire » (remplace la ligne dépliante abandonnée) : un petit formulaire (Nom, Prénom, E-mail, puis « Fonction du signataire »), aucun astérisque. Le contact est créé dans Contacts à la fermeture de la fenêtre ou à la génération, si Nom est rempli et l'e-mail valide.
- Le bouton « Enregistrer les informations » est supprimé : « Fermer » et Échap enregistrent en silence, puis ferment. Si l'enregistrement échoue, la fenêtre reste ouverte avec une alerte et un second « Fermer » quitte sans enregistrer.
- Deux colonnes à partir de 1100 px (au lieu de 1200 px) ; en dessous, les blocs sont l'un sous l'autre.

## Cas volontairement non écrits

1. **Échec de création du contact « pour de bon »** (refus de Grist, pas de réseau coupé) : on ne peut pas le provoquer sans abîmer les règles d'accès. CONV-159 joue le réseau coupé, qui passe par le même message.
2. **Un Régional ou un Départemental qui ajoute un contact à un club hors de son périmètre** : l'action elle-même ne serait pas visible pour lui.
3. **Campagne qui n'est pas une année** (par exemple « 2026-2027 ») : d'après `conventionLireAnnee` (script.js, relu sans l'exécuter), le sous-titre l'affiche mais la colonne `Annee` n'est pas écrite ; la note UX dit « non vérifié » pour le nom du fichier (D-E1-8). Pas de cas écrit : voir [À CONFIRMER] 10.
4. **Fermer sans rien changer** : savoir si Grist reçoit une écriture inutile n'est pas observable à l'écran ([À CONFIRMER] 2).
5. **Mode sombre** : à traiter à part pour tout le tableau de bord (comme en R5 et R6).

## Cas anciens devenus obsolètes ou à adapter

Traité le 2026-11-04 : les cas obsolètes ont été supprimés, ceux à adapter ont été réécrits dans le fichier `.tsv`, et les cas redondants ont été regroupés. Voir la section « Nettoyage du carnet » tout en haut de ce fichier.

## Données d'essai de R8 à créer dans TEST avant de jouer

Données fictives uniquement (exemple.fr). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1, R2, R4, R5 et R6 restent en place.** On réutilise le Club Exemple, les clubs « sans adresse », « sans SIRET » et « sans contact », et l'agence d'essai ; on crée deux clubs et trois contacts.

### Réponse sur les actions ESSAI-CONV-T1 à T24

- **Le fichier `.md` ne dit nulle part que les actions T ont une Campagne** : la colonne n'est dans aucun tableau de R6. Je ne peux pas le savoir depuis le dépôt (et je n'ai pas lu le document Grist). À vérifier par Hanta.
- **Je ne les réutilise pas**, pour deux raisons : (1) ouvrir puis fermer la fenêtre écrit dans leur ligne Conventions et peut vider `Annee` (voir plus haut) ; (2) elles sont déjà « consommées » par R6 (lignes écrites, fichiers signés).
- À la place : **32 nouvelles actions ESSAI-CONV-U1 à U32**, avec leur Campagne.
- Aucun changement à faire sur T, sauf si Hanta veut aussi y mettre une Campagne : sans effet sur R6.

### Campagnes (table Campagnes, déjà dans le document)

Trois lignes dont le texte est exactement `2026`, `2027` et `2028` ([À CONFIRMER] 1). 2027 et 2028 servent à distinguer l'année de la campagne de l'année en cours (2026).

### Structures (clubs)

DR et DD : pour les deux nouveaux clubs, **mêmes DR et DD que Club Exemple** (sinon un vrai compte FT Régional ou FT Départemental ne peut pas créer de contact, CONV-171 et 172 seraient Bloqués : la règle d'accès de Contacts suit le club).

| Club | Adresse | Code postal | Ville | SIRET | Contacts |
| --- | --- | --- | --- | --- | --- |
| Club Exemple (existe) | 1 rue Exemple | 75001 | Exemple-sur-Mer | 12345678900012 | Alex Martin-Exemple (Président), Sam Test-Exemple (sans fonction) |
| Club Exemple Sans Adresse (existe) | (vide) | (vide) | (vide) | 12345678900046 (à compléter si vide) | Robin Autre-Exemple (Trésorier) |
| Club Exemple Sans SIRET (existe, R4) | 3 rue Exemple | 75003 | Exemple-sur-Mer | (vide) | Jo Sansiret-Exemple |
| Club Exemple Sans Contact (existe, R2) | 2 rue Exemple | 75002 | Exemple-sur-Mer | 12345678900020 | AUCUN (supprimer tout contact ajouté par erreur) |
| Club Exemple Adresse Longue (**nouveau**) | Bâtiment C, Résidence des Exemples Réunis, 120 avenue du Général Exemple-Fictif | 75006 | Exemple-sur-Mer-les-Bains-Fictifs | 12345678900053 | Ana Longue-Exemple (Présidente, ana.longue@exemple.fr) |
| Club Exemple Contacts (**nouveau**) | 5 rue Exemple | 75005 | Exemple-sur-Mer | 12345678900061 | Lou Base-Exemple (Président, lou.base@exemple.fr), Max Base-Exemple (Trésorier, max.base@exemple.fr) |

Club Exemple Contacts sert à tous les cas qui **créent** un contact : ainsi la liste du Club Exemple (CONV-23, CONV-24, R2) reste à deux contacts.

### Agence d'essai

On reprend celle de R1 à R6 (adresse fictive complète, SIRET fictif, rattachée aux DR et DD des profils Régional et Départemental). Aucune nouvelle agence.

### Actions d'essai (Corbeille = non)

Stade = Du stade vers l'emploi ; Match = Match des métiers ; Remob. = Parcours de remobilisation vers l'emploi. Toutes utilisent l'agence d'essai. Contacts = Club Exemple Contacts. **Aucune ligne dans Conventions au départ**, sauf pour U13, U27 et U28 (plus bas). « Fermer » enregistre : **toute action dont la fenêtre a été fermée peut avoir une ligne Conventions** ([À CONFIRMER] 2).

| Intitulé | Dispositif | Club | Campagne | Sert au cas |
| --- | --- | --- | --- | --- |
| ESSAI-CONV-U1 | Stade | Club Exemple | 2026 | CONV-139, 143, 146, 147, 173, 174, 175, 177, 178, 179, 180, 181 (lecture, mais « Fermer » peut écrire) |
| ESSAI-CONV-U2 | Match | Club Exemple | 2027 | CONV-140 |
| ESSAI-CONV-U3 | Remob. | Club Exemple | 2026 | CONV-140 |
| ESSAI-CONV-U4 | Stade | Club Exemple | **vide** | CONV-141 |
| ESSAI-CONV-U5 | Stade | Club Exemple Sans Adresse | 2026 | CONV-142 |
| ESSAI-CONV-U6 | Stade | Club Exemple Sans SIRET | 2026 | CONV-144 |
| ESSAI-CONV-U7 | Stade | Club Exemple Adresse Longue | 2026 | CONV-145 |
| ESSAI-CONV-U8 | Stade | Contacts | 2026 | CONV-148, 149 (rien n'est créé) |
| ESSAI-CONV-U9 | Stade | Club Exemple Sans Contact | 2026 | CONV-154 (rien n'est créé) |
| ESSAI-CONV-U10 | Stade | Club Exemple Sans Contact | 2026 | CONV-155 (écrit) |
| ESSAI-CONV-U11 | Stade | Contacts | 2026 | CONV-150 (écrit) |
| ESSAI-CONV-U12 | Stade | Contacts | 2026 | CONV-169 (écrit) |
| ESSAI-CONV-U13 | Stade | Contacts | 2026 | CONV-151 (état Générée, voir plus bas) |
| ESSAI-CONV-U14 | Stade | Contacts | 2026 | CONV-152 |
| ESSAI-CONV-U15 | Stade | Contacts | 2026 | CONV-153 (écrit) |
| ESSAI-CONV-U16 | Stade | Club Exemple | 2026 | CONV-156 (écrit) |
| ESSAI-CONV-U17 | Stade | Club Exemple | 2026 | CONV-157 (écrit) |
| ESSAI-CONV-U18 | Stade | Club Exemple | 2026 | CONV-158 (coupure réseau) |
| ESSAI-CONV-U19 | Stade | Contacts | 2026 | CONV-159 (coupure réseau, écrit) |
| ESSAI-CONV-U20 | Stade | Club Exemple | 2026 | CONV-160 (débit réduit, écrit) |
| ESSAI-CONV-U21 | Stade | Club Exemple | 2027 | CONV-161 (écrit) |
| ESSAI-CONV-U22 | Remob. | Club Exemple | 2026 | CONV-162 (écrit) |
| ESSAI-CONV-U23 | Match | Club Exemple | 2028 | CONV-163 (écrit) |
| ESSAI-CONV-U24 | Stade | Club Exemple | **vide** | CONV-164 (écrit) |
| ESSAI-CONV-U25 | Stade | Contacts | 2026 | CONV-165 (écrit) |
| ESSAI-CONV-U26 | Stade | Club Exemple Sans Adresse | 2026 | CONV-166 (écrit) |
| ESSAI-CONV-U27 | Stade | Club Exemple | 2026 | CONV-167 (état Générée, écrit) |
| ESSAI-CONV-U28 | Stade | Club Exemple | 2026, puis 2027 | CONV-168 (état Générée, écrit) |
| ESSAI-CONV-U29 | Stade | Contacts | 2026 | CONV-170 (écrit) |
| ESSAI-CONV-U30 | Stade | Contacts | 2026 | CONV-171 (FT Régional, vrai compte, écrit) |
| ESSAI-CONV-U31 | Stade | Contacts | 2026 | CONV-172 (FT Départemental, vrai compte, écrit) |
| ESSAI-CONV-U32 | Stade | Contacts | 2026 | CONV-176 (VoiceOver) |

### Lignes Conventions à préparer (par un propriétaire du document)

Même principe que R6 : « PDF fictif » = `convention-essai-fictif.pdf`. `PDF_genere` = PDF fictif, `Date_generation` = 14/10/2026 à 12:00 (midi, pour que la date reste la même), `PDF_signe` et `Date_depot` vides, `Modele` = le modèle actif de Du stade vers l'emploi.

| Action | Signataire_club | Representant_agence | Fonction_representant |
| --- | --- | --- | --- |
| ESSAI-CONV-U13 | Lou Base-Exemple | Dominique Exemple | Directeur d'agence |
| ESSAI-CONV-U27 | Alex Martin-Exemple | Dominique Exemple | Directeur d'agence |
| ESSAI-CONV-U28 | Alex Martin-Exemple | Dominique Exemple | Directeur d'agence |

Ne jamais renommer ni écrire à la main les colonnes `DR` et `DD` de `Conventions` ni de `Contacts`.

### Contacts créés pendant les cas (à supprimer pour rejouer)

À supprimer dans la fiche du club (widget clubs, suppression réelle), avec la ligne Conventions de l'action : « Nouveau-Exemple » (CONV-150), « Premier-Exemple » (CONV-155), « Reseau-Exemple » (CONV-159), « Malforme-Exemple » (CONV-153), « Signataire-Exemple » (CONV-165), « Persistant-Exemple » (CONV-169), « Unique-Exemple » (CONV-170), « Regional-Exemple » (CONV-171), « Departemental-Exemple » (CONV-172). **Ne doivent pas être créés** : « Garde-Exemple », « Source-Exemple », « Sansmail-Exemple », « Zoom-Exemple », « Annonce-Exemple », « Zoé » (CONV-148, 149, 151, 152, 176, 177) : s'ils apparaissent, c'est une anomalie.

### Profils

- Prérequis commun : le profil FT National est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai.
- CONV-171 (FT Régional) et CONV-172 (FT Départemental) : **vrais comptes**, éditeurs, jamais propriétaires, profil complet, navigateur à part. **Pas de « Voir en tant que »** (fiche C41). Aucun compte n'est inventé ici : voir [À CONFIRMER] 11. Le compte FT Départemental réel est encore à préparer (backlog, Risques).

## Provoquer les pannes réseau (CONV-158, 159, 160)

Même méthode qu'en R4, R5 et R6, dans les outils du navigateur (F12), onglet **Réseau** :
- **Coupure (CONV-158, 159)** : régler sur « Hors connexion » **juste avant** de cliquer sur « Fermer ». Attendre le message, **jusqu'à 2 minutes** (au-delà : KO). Le délai maximum de l'enregistrement (20 s d'après la fiche C51) n'est pas testé directement en code : noter le temps réel.
- **Allonger la génération (CONV-160)** : débit « Slow 3G » ou « Fast 3G », case « Désactiver le cache » cochée, page rechargée avant.
- **Dans tous les cas : remettre le réseau normal à la fin.** Aucun jeton Grist dans une fiche d'anomalie, une capture ou ce document.

## Les cas de R8 restants après le nettoyage du 2026-11-04

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Le détail (étapes, textes exacts) est dans le fichier `.tsv`. **Aucun cas ne se rejoue en PROD** : ouvrir puis fermer la fenêtre écrit.

### Ouverture de la fenêtre allégée (profil FT National)

- **CONV-139 : fenêtre allégée complète** (Nominal, Bloquant, fumée) : sous-titre « Du stade vers l'emploi · Campagne 2026 », introduction, deux blocs, deux boutons, aucun astérisque, focus sur « Signataire ».
- **CONV-140 : sous-titre Match et Remobilisation** (Nominal, Majeur).
- **CONV-141 : campagne vide, dispositif seul** (Limite, Majeur).
- **CONV-142 : club sans adresse, plus de blocage** (Limite, Majeur) : bouton actif, « adresse non renseignée » inséré dans la ligne unique de l'encart.

### Blocs Club et Agence

- **CONV-143 : encart Club, contenu exact** (Nominal, Majeur) : nom, SIRET (nu, sans « SIRET : »), adresse, le tout sur UNE SEULE ligne logique séparée par des virgules, lecture seule, sans poignée.
- **CONV-144 : SIRET manquant** (Limite, Majeur) : « SIRET non renseigné » inséré dans la ligne unique (pas de « SIRET : »).
- **CONV-145 : adresse longue, hauteur automatique** (Limite, Majeur).
- **CONV-146 : bloc Agence, nom seul** (Nominal, Majeur).

### Ajouter un contact

- **CONV-147 : ouverture du formulaire, aucun champ obligatoire visible** (Nominal, Bloquant).
- **CONV-148 : deuxième clic ferme sans rien perdre** (Nominal, Majeur).
- **CONV-149 : choisir un contact vide la saisie libre** (Nominal, Majeur).
- **CONV-150 : création réussie** (Nominal, Bloquant, fumée) : Contacts, Conventions, liste.
- **CONV-151 : Nom vide, rien n'est créé** (Limite, Majeur).
- **CONV-152 : Nom rempli, E-mail vide** (Erreur, Bloquant) : « Saisissez l'e-mail du nouveau signataire. »
- **CONV-153 : E-mail mal formé, à la génération** (Erreur, Majeur) : « Saisissez une adresse e-mail valide, par exemple nom@exemple.fr. »
- **CONV-154 : club sans contact** (Limite, Majeur).
- **CONV-155 : premier contact d'un club sans contact** (Limite, Majeur).

### Fermeture et enregistrement silencieux

- **CONV-156 : « Fermer » enregistre sans message** (Nominal, Bloquant, fumée).
- **CONV-157 : Échap enregistre sans message** (Nominal, Majeur).
- **CONV-158 : échec de l'enregistrement, second « Fermer »** (Erreur, Bloquant).
- **CONV-159 : échec de création du contact, puis « Générer »** (Erreur, Majeur).
- **CONV-160 : pendant la génération, deux boutons et formulaire verrouillés** (Limite, Majeur).

### Génération avec les nouvelles données

- **CONV-161 : PDF Du stade vers l'emploi, année de la Campagne, pointillés à 56** (Nominal, Bloquant, fumée).
- **CONV-162 : PDF Parcours de remobilisation, sans année, « Fait à » à 56** (Nominal, Majeur).
- **CONV-163 : PDF Match des métiers, année 2028, adresse de l'agence** (Nominal, Majeur).
- **CONV-164 : Campagne vide, pointillés à la place de l'année** (Limite, Majeur).
- **CONV-165 : signataire nouvellement créé dans le PDF** (Nominal, Bloquant).
- **CONV-166 : tous les champs vides, aucun blocage** (Limite, Bloquant).
- **CONV-167 : « Re-générer », fenêtre préremplie** (Nominal, Majeur).
- **CONV-168 : la Campagne change, le sous-titre et le PDF suivent** (Limite, Majeur).

### Persistance

- **CONV-169 : après rechargement, la fenêtre et la fiche du club** (Persistance, Majeur).
- **CONV-170 : un seul contact créé malgré plusieurs fermetures** (Persistance, Majeur).





## [À CONFIRMER] de R8

1. **Campagnes** : les trois lignes `2026`, `2027` et `2028` existent-elles dans TEST, avec exactement ce texte ? Où se choisit la Campagne d'une action (cellule de la table Actions) ? La fiche d'une action ne permet pas de la modifier (CLAUDE.md).
2. **Que fait « Fermer » quand rien n'a changé, ou quand la ligne Conventions n'existe pas ?** La note dit « à confirmer par dev-backend » (§3 « Ce qui est enregistré »). Si « Fermer » crée toujours une ligne (avec « Directeur d'agence » par défaut), toutes les actions U ouvertes puis fermées ont une ligne Conventions ; le bloc reste « Aucune convention générée. » parce que l'état suit les PDF (même question que R2, [À CONFIRMER] 2). Les cas qui contrôlent « aucune valeur écrite » (CONV-152, 158, 159) disent « aucune valeur de signataire » et non « aucune ligne ».
3. **Forme du SIRET dans l'encart** : la note montre « 000 000 000 00000 » (avec espaces) ; mes attendus écrivent le SIRET sans espaces (« 12345678900012 »). Noter la forme réelle.
4. **« Nom, SIRET et adresse sur une ligne »** (D-E1-1, backlog) : la note lit « l'adresse sur une ligne » et dessine trois lignes. J'ai écrit trois lignes. Si Hanta voulait tout sur une seule ligne, CONV-143, 144 et 145 sont à corriger.
5. **Option « (nouveau contact) » quand le Prénom est vide** (CONV-148) et **quel signataire revient quand on vide le Nom** (CONV-149, étape 7) : la note ne décrit ni l'un ni l'autre. À noter à l'écran.
6. **Compter les 56 points** : « 56 points » (D-E1-21) se compte en caractères « . » ou en points typographiques ? J'ai supposé des caractères. Méthode proposée : copier la ligne depuis le PDF dans un éditeur de texte. À valider par Hanta ; l'ancienne valeur était 28.
7. **Largeur de référence du seuil de 1100 px** : la règle CSS s'applique probablement à la largeur du cadre du widget, pas à celle de la fenêtre du navigateur. Comment la mesurer (outils du navigateur, largeur de l'iframe) ? Et la hauteur de la fenêtre à deux colonnes n'a pas été mesurée par la note (« non vérifié ») : CONV-179 demande de noter si un défilement est nécessaire. La note UX du §3 dit encore 1200 px à plusieurs endroits : à corriger par le designer-ux.
8. **Règle de forme de l'e-mail** : d'après `conventionEmailBienForme` (script.js, relu sans l'exécuter), « nom@exemple » (sans point) est accepté. Pas de cas écrit : à ajouter si Hanta veut que l'e-mail ait un point.
9. **Campagne affichée pour Parcours de remobilisation** (CONV-140) : la note dit « [Dispositif] · Campagne [Campagne] » sans exception, alors que le modèle n'a pas d'année. J'ai écrit que le sous-titre porte la campagne dans ce cas.
10. **Colonne `Annee` de Conventions et campagne qui n'est pas une année** : d'après `conventionLireAnnee`, `Annee` est lue depuis la Campagne à chaque enregistrement ; si elle est vide, `Annee` est vidée ; si ce n'est pas une année à quatre chiffres, `Annee` n'est pas écrite. Aucun cas ne contrôle la colonne `Annee`. Cas « 2026-2027 » : non écrit. À ajouter si Hanta le veut (avec une action ESSAI-CONV-U33).
11. **Comptes réels** pour CONV-171 et 172 : quel compte FT Régional, quel compte FT Départemental (éditeurs, non propriétaires, profil complet) ? Les règles de `Contacts` (création) pour ces deux profils sont à vérifier dans TEST avant de jouer ; elles ont été vérifiées dans DEV7 (CLAUDE.md). Aucun compte n'est inventé ici.
12. **« Fonction du signataire » avant toute saisie** (CONV-147) : la note dit lecture seule tant qu'une saisie libre n'est pas active (Nom vide). Écrit ainsi ; à confirmer à l'écran.
13. **E-mail du signataire dans le PDF** (CONV-165) : la note dit qu'aucune case ne l'utilise, « à confirmer par dev-backend ». J'ai écrit qu'il n'apparaît pas.
14. **Tests en code** : les noms exacts des tests, non relus, sont à ajouter dans la colonne `Remarques` si on veut la même précision qu'en R2.
15. **Compte du testeur « National »** : même question qu'en R1, R2, R4, R5 et R6 (vrai profil FT National, ou propriétaire du document ?).
16. **Version testée** : le commit publié sur TEST n'est pas dans ce document (la demande dit « à préciser dans le carnet »). À noter par le testeur au début de la campagne.

---

# Cas de test : Convention, voir le PDF dans une pop-up plein écran et le télécharger (R9, Évolution 2)

**Brouillon écrit par le recetteur. Il n'a pas été relu** (colonne `Relu_par` vide). Aucun cas n'a été joué : les résultats sont à noter par la personne qui teste. Les cas CONV-01 à CONV-181 ci-dessus n'ont pas été modifiés, mais **plusieurs sont devenus obsolètes ou à adapter** (liste plus bas).

- Widget : tableau de bord (actions-dashboard), fiche d'une action, bloc « Convention » (boutons « Voir », « Télécharger ») et pop-up du PDF.
- Branche : `feature/convention`. Évolution 2 : fiche C57 de REVIEW_LOG.md, décisions E2-1 à E2-11 de `docs/backlog.md`.
- Référence : `docs/ux/convention.md`, **§14 (elle fait foi)** : 14.1 parcours, 14.2 bloc, 14.3 pop-up, 14.4 textes, 14.6 accessibilité, 14.10 risques. Les textes attendus en sont copiés mot pour mot.
- Le fichier `cas-de-test-convention.tsv` contient les 41 cas de R9 (CONV-182 à CONV-222), à la suite des 181 de R1, R2, R4, R5, R6 et R8 : 161 lignes de cas après le nettoyage du 2026-11-04, 18 colonnes.
- Les actions de R9 s'appellent ESSAI-CONV-V1 à ESSAI-CONV-V10. **« V » veut dire « Évolution 2 »** : à ne pas confondre avec A, B, R, S, T et U.
- **Règle pour tout le monde** : la pop-up couvre toute la fiche. Dans les cas anciens qui disent « cliquer sur Voir… et lire le PDF », il faut maintenant **fermer la pop-up (croix ou Échap) avant l'étape suivante**, sinon les boutons de la fiche sont cachés.

## Ce qui a changé par rapport à R1, R2, R4, R5, R6 et R8

| Avant | Maintenant (note §14) |
| --- | --- |
| « Voir la convention » ouvre un nouvel onglet, adresse « blob: », libérée après 60 secondes | une pop-up qui occupe tout le cadre du widget (pas l'écran de l'ordinateur), aucun onglet, aucune adresse visible |
| Titre « Convention générée » / « Convention signée » | le nom exact du fichier est le seul titre |
| Pied de page avec « Fermer » et « Télécharger » | pas de pied de page ; dans l'en-tête, à droite du titre : « Télécharger » puis la croix « ✕ » (nom accessible « Fermer ») |
| Lien de repli « Ouvrir dans un nouvel onglet » | texte sans lien, toujours visible sous le PDF : « Le PDF ne s'affiche pas ? Utilisez « Télécharger ». » |
| Fond assombri derrière la fenêtre | recommandé : plus de fond assombri (la pop-up recouvre tout) |
| Fermeture : focus rendu à « Voir » | inchangé (« Voir la convention » ou « Voir la convention signée ») |
| Aucun bouton « Télécharger » | DEUX boutons « Télécharger », indépendants : dans le bloc (sans ouvrir la pop-up) et dans la pop-up (après consultation) |
| Rangée du bloc, état Générée : Voir · Re-générer · Déposer | Voir · **Télécharger** · Re-générer · Déposer |
| Rangée du bloc, état Signée : Voir signée, puis Remplacer en dessous | Voir signée · **Télécharger**, puis Remplacer en dessous |
| Texte caché de « Voir » : « (s'ouvre dans un nouvel onglet) » | « (s'ouvre dans une fenêtre) » |

## Cas volontairement non écrits

1. **Libération de l'adresse « blob: » à la fermeture et vidage de l'aperçu** : non observable à l'écran. CONV-197 et CONV-203 vérifient seulement que tout refonctionne après une fermeture. Fait pour le test en code (fiche C57, non relue).
2. **Échec du « Télécharger » de la pop-up** : il n'y en a pas de récupération à faire (le PDF est déjà en mémoire, note §14.3). Aucun message n'est prévu. Seul l'échec du « Télécharger » du bloc se joue (CONV-195).
3. **Changement de fiche pendant que la pop-up est ouverte** (note §14.10 n° 4) : la pop-up couvre la fiche, on ne peut pas changer de fiche à l'écran.
4. **FT National hors périmètre, FT Régional ou Départemental hors périmètre, ANS** : l'action n'est pas visible, donc « Voir » et « Télécharger » ne sont pas atteignables ; le profil ANS (lecture seule) n'est pas écrit faute de précision dans la note. À ajouter si Hanta le veut.
5. **Nom du fichier quand le club ou le dispositif a été renommé depuis la génération** : la note dit « accepté » (le nom suit les données actuelles).
6. **Mode sombre** : à traiter à part pour tout le tableau de bord (comme en R5, R6 et R8).
7. **Vrai plein écran de l'ordinateur** : hors du périmètre d'E2-11 (note §14.3).

## Cas anciens devenus obsolètes ou à adapter

Traité le 2026-11-04 : les cas obsolètes ont été supprimés, ceux à adapter ont été réécrits dans le fichier `.tsv`, et les cas redondants ont été regroupés. Voir la section « Nettoyage du carnet » tout en haut de ce fichier.

## Données d'essai de R9 à créer dans TEST avant de jouer

Données fictives uniquement (exemple.fr). Aucun nom de document Grist, aucune adresse réelle. **Les données de R1, R2, R4, R5, R6 et R8 restent en place.** On réutilise le Club Exemple, « Club Exemple Adresse Longue » (créé en R8), « Étoile & Cœur FC » (créé en R4), l'agence d'essai et le modèle actif de chaque dispositif. **Aucun club, contact, agence ou Campagne nouveau.**

### Réponse sur les actions ESSAI-CONV-U1 à U32

**Je ne les réutilise pas**, pour trois raisons :
1. La plupart n'ont **aucune ligne dans Conventions** ou ont été **écrites par R8** (« Fermer » enregistre, la colonne `Annee` est relue depuis la Campagne). Seules U13, U27 et U28 sont à l'état Générée.
2. **U13, U27 et U28 ne fixent pas `Annee`** dans leur ligne préparée : le nom de fichier attendu en titre ne serait pas certain. U27 et U28 sont en plus re-générées par R8 (le PDF n'est plus le PDF fictif).
3. Il faut aussi des actions **Signées**, un PDF **de 4 pages**, un PDF **illisible** et des actions qui **écrivent** : aucune U ne convient.

À la place : **10 nouvelles actions ESSAI-CONV-V1 à V10.** Les actions T8 et T9 de R6 (jamais modifiées) pourraient servir en lecture seule, mais je ne les utilise pas, pour que R9 ne dépende pas de R6.

### Fichiers d'essai

Ceux de R6 suffisent, sauf un nouveau fichier :

| Fichier | Ce que c'est | Sert aux cas |
| --- | --- | --- |
| `convention-essai-fictif.pdf` (R6) | le « PDF fictif » : « Convention d'essai, données fictives » | 182 à 184 et la plupart des autres |
| `signe-ancien-fictif.pdf` (R6) | « Ancienne convention signée d'essai, données fictives » : dans `PDF_signe` des actions Signées | 184, 190, 193, 200, 201, 216, 217 |
| `scan-signe-fictif-B.pdf` (R6) | « Convention signée d'essai B, données fictives » : à choisir | 216 |
| `lent-1Mo.pdf` (R6) | copie de `scan-signe-fictif-A.pdf` d'environ 1 Mo : à choisir | 217 |
| `faux-pdf-texte.pdf` (R6) | quelques mots de texte brut dans un fichier nommé `.pdf` : dans `PDF_genere` de V7 | 206 |
| **`convention-essai-4pages.pdf` (NOUVEAU)** | un PDF fictif de 4 pages ; chaque page porte « Page N sur 4, données fictives » | 188 |

Le fichier de 4 pages est à préparer par Hanta (par exemple en imprimant en PDF un document fictif de 4 pages). Je n'ai lancé aucune commande et n'en propose pas ([À CONFIRMER] 5).

### Lignes Conventions à préparer (par un propriétaire du document)

Même principe que R6 (voir « Deux lignes `Conventions` types »), avec ces valeurs : `Modele` = le modèle actif du dispositif ; `Annee` = 2026 ; `Signataire_club` = un contact du club ; `Representant_agence` = Dominique Exemple ; `Fonction_representant` = Directeur d'agence ; `Date_generation` = 14/10/2026 à 12:00 ; `PDF_genere` = PDF fictif (sauf V6 et V7) ; pour une action Signée : `PDF_signe` = `signe-ancien-fictif.pdf` et `Date_depot` = 20/10/2026 à 12:00 ; pour une action Générée : `PDF_signe` et `Date_depot` vides. Ne jamais renommer ni écrire à la main les colonnes `DR` et `DD` de `Conventions`.

### Actions d'essai (Corbeille = non, Campagne 2026, agence d'essai)

Stade = Du stade vers l'emploi ; Match = Match des métiers. **Les actions « lecture » ne sont jamais modifiées** (« Voir » et « Télécharger » ne font que lire) : si l'une change, c'est une anomalie. N'ouvrir JAMAIS la fenêtre « Convention » d'une action V (« Fermer » écrit, voir R8).

| Intitulé | Dispositif | Club | État au départ | Titre / nom de fichier attendu | Sert au cas |
| --- | --- | --- | --- | --- | --- |
| ESSAI-CONV-V1 | Stade | Club Exemple | Générée | Convention-Stade-emploi-Club-Exemple-2026.pdf | la plupart des cas (lecture) |
| ESSAI-CONV-V2 | Stade | Club Exemple | Signée | Convention-signee-Stade-emploi-Club-Exemple-2026.pdf | 184, 190, 193, 200, 201, 208, 211, 212, 214, 220 (lecture) |
| ESSAI-CONV-V3 | Match | Club Exemple | Générée | Convention-Match-metiers-Club-Exemple-2026.pdf (forme à noter) | 183, 196, 197 (lecture) |
| ESSAI-CONV-V4 | Match | Étoile & Cœur FC | Signée | Convention-signee-Match-metiers-Etoile-Coeur-FC-2026.pdf | 185 (lecture) |
| ESSAI-CONV-V5 | Stade | Club Exemple Adresse Longue | Générée | Convention-Stade-emploi-Club-Exemple-Adresse-Longue-2026.pdf (forme à noter) | 185 (lecture) |
| ESSAI-CONV-V6 | Stade | Club Exemple | Générée, `PDF_genere` = `convention-essai-4pages.pdf` | Convention-Stade-emploi-Club-Exemple-2026.pdf | 188 (lecture) |
| ESSAI-CONV-V7 | Stade | Club Exemple | Générée, `PDF_genere` = `faux-pdf-texte.pdf` | Convention-Stade-emploi-Club-Exemple-2026.pdf | 206 (lecture) |
| ESSAI-CONV-V8 | Stade | Club Exemple | Générée | idem | 215 (**écrit**, re-génération) |
| ESSAI-CONV-V9 | Stade | Club Exemple | Signée | Convention-signee-Stade-emploi-Club-Exemple-2026.pdf | 216 (**écrit**, remplacement) |
| ESSAI-CONV-V10 | Stade | Club Exemple | Signée | idem | 217 (**écrit**, remplacement lent) |

**Pour rejouer** un cas qui écrit : remettre la ligne `Conventions` à son état de départ (V8 : PDF fictif et 14/10/2026 à 12:00 ; V9 et V10 : `signe-ancien-fictif.pdf` et 20/10/2026 à 12:00) ou recréer l'action.

### Profils

- Prérequis commun : le profil FT National est présent dans la table Utilisateurs de TEST, dans le périmètre de l'agence d'essai.
- CONV-211 (FT Régional) et CONV-212 (FT Départemental) : **vrais comptes**, éditeurs, jamais propriétaires, profil complet, navigateur à part. **Pas de « Voir en tant que »** (fiche C41). Aucun compte n'est inventé ici : voir [À CONFIRMER] 6.
- CONV-214, 215, 216 : un compte **propriétaire** du document pour lire les tables.

## Navigateurs

La note (§14.10 n° 1 et 2) demande d'essayer le téléchargement et l'aperçu dans **Chrome, Firefox et Safari** avant de livrer. Jouer au minimum **CONV-182, 189, 190, 192, 206 et 209 dans les trois**, et noter pour chacun : le nom du fichier obtenu, ce que montre le cadre du PDF, la barre d'état.

## Provoquer les pannes réseau (CONV-194, 195, 204, 207, 217)

Même méthode qu'en R4, R5 et R6, dans les outils du navigateur (F12), onglet **Réseau** :
- **Blocage (CONV-195, 207)** : bloquer les requêtes de téléchargement d'une pièce jointe (adresse qui contient « download », comme CONV-69), puis **recharger la page**. Si rien n'est bloqué, l'adresse choisie est fausse : la relire sans copier le jeton.
- **Ralentir (CONV-194, 204)** : débit « Slow 3G », case « Désactiver le cache » cochée, page rechargée avant.
- **Allonger l'envoi (CONV-217)** : débit « Fast 3G » avec `lent-1Mo.pdf` (voir CONV-123).
- **Dans tous les cas : retirer le blocage et remettre le débit normal à la fin.** Aucun jeton Grist dans une fiche d'anomalie, une capture ou ce document.

## Les cas de R9 restants après le nettoyage du 2026-11-04

Légende : criticité Bloquant / Majeur / Mineur. Fumée = test de fumée. Le détail (étapes, textes exacts) est dans le fichier `.tsv`.

### Ouverture et affichage de la pop-up (profil FT National)

- **CONV-182 : ouverture plein cadre, état Générée** (Nominal, Bloquant, fumée) : pas de bande, pas de fond assombri, aucun onglet.
- **CONV-183 : titre = nom exact du fichier** (Nominal, Majeur).
- **CONV-184 : ouverture, état Signée** (Nominal, Bloquant).
- **CONV-185 : titre long, accents et « & »** (Limite, Mineur).
- **CONV-186 : widget peu haut** (Limite, Majeur).
- **CONV-187 : en-tête, Télécharger puis croix, pas de pied de page** (Nominal, Majeur).
- **CONV-188 : lecture d'un PDF de 4 pages** (Nominal, Majeur).
- **CONV-204 : double clic sur « Voir », une seule pop-up** (Limite, Majeur).

### Télécharger

- **CONV-189 : « Télécharger » de la pop-up, PDF généré, bon nom** (Nominal, Bloquant, fumée).
- **CONV-190 : « Télécharger » de la pop-up, PDF signé, bon nom** (Nominal, Bloquant).
- **CONV-191 : deux téléchargements de suite, l'aperçu reste** (Limite, Majeur).
- **CONV-192 : « Télécharger » du bloc sans ouvrir « Voir »** (Nominal, Bloquant, fumée).
- **CONV-193 : « Télécharger » du bloc, état Signée** (Nominal, Majeur).
- **CONV-194 : téléchargement lent, un seul fichier, « Voir » reste utilisable** (Limite, Majeur).
- **CONV-195 : échec du « Télécharger » du bloc** (Erreur, Majeur).

### Coexistence des deux boutons « Télécharger »

- **CONV-196 : bloc, puis pop-up** (Nominal, Majeur).
- **CONV-197 : pop-up, fermeture, puis bloc** (Limite, Majeur).

### Fermeture

- **CONV-202 : focus dans le PDF, Échap ne ferme pas (constat)** (Limite, Mineur).
- **CONV-203 : réouverture trois fois** (Limite, Majeur).

### Échec d'affichage et de récupération

- **CONV-205 : texte de repli toujours visible, sans aucun lien** (Nominal, Majeur).
- **CONV-206 : PDF illisible (V7)** (Erreur, Majeur).
- **CONV-207 : récupération impossible, aucune pop-up, alerte** (Erreur, Majeur).

### Sécurité à l'écran

- **CONV-208 : barre d'adresse jamais « blob: » ni « github.io »** (Nominal, Bloquant).
- **CONV-209 : barre d'état vide au survol** (Nominal, Majeur).
- **CONV-210 : console sans jeton, aucun lien dans la pop-up** (Nominal, Bloquant).



### Persistance

- **CONV-217 : « Voir » signée pendant un remplacement en cours** (Limite, Majeur).



## [À CONFIRMER] de R9

1. **Plein écran et fond assombri** : la note laisse à dev-interface le choix de la classe plein écran et recommande de ne plus insérer le fond assombri. Je n'ai pas relu le code. CONV-182 et CONV-186 décrivent ce que la note veut obtenir (pas de bande, pas de fond gênant) ; noter ce qui est vu.
2. **Forme exacte du titre** pour Match des métiers en 2026 (V3) et pour le club « Club Exemple Adresse Longue » (V5) : déduite du motif des noms déjà vus dans R4, R5 et R6. Noter la forme réelle.
3. **Info-bulle « Fermer » de la croix** : facultative dans la note (`title` « peut être ajouté »). Son absence n'est pas une anomalie (CONV-187).
4. **Comment régler la hauteur et la largeur du widget** (CONV-186, 221, 222) : dans la page Grist ? Dans les outils du navigateur ? À décrire par Hanta.
5. **PDF de 4 pages** (CONV-188) : à préparer par Hanta. Je n'ai lancé aucune commande.
6. **Comptes réels** pour CONV-211 et 212 : quel compte FT Régional, quel compte FT Départemental (éditeurs, non propriétaires, profil complet) ? Les règles d'accès de `Conventions` pour ces deux profils sont à vérifier dans TEST avant de jouer. Le compte FT Départemental réel est encore à préparer (CLAUDE.md). Aucun compte n'est inventé ici.
7. **Provoquer l'échec d'affichage** (CONV-206) : le fichier de texte brut nommé `.pdf` est la seule méthode proposée. Ce que montre chaque navigateur varie. D'autres moyens (réglage « télécharger les PDF » de Chrome, téléphone) n'ont pas été vérifiés : à essayer et à noter.
8. **Barre d'état dans Safari** (CONV-209) : elle est masquée par défaut ; la manière de l'afficher n'a pas été vérifiée ici. À décrire par la personne qui teste.
9. **Après rechargement, la pop-up ne se rouvre pas** (CONV-213) : la note ne le dit pas explicitement ; c'est le comportement attendu d'une fenêtre ouverte par un clic. À confirmer.
10. **Où lire le nombre de pièces jointes du document** (CONV-214) : je ne sais pas où le voir dans Grist. À indiquer par Hanta ; à défaut, vérifier seulement le contenu des cellules `PDF_genere` et `PDF_signe`.
11. **Alerte « Convention signée enregistrée. » pendant que la pop-up est ouverte** (CONV-217) : la note ne décrit ni son affichage ni son annonce dans ce cas. À noter à l'écran.
12. **Contour de focus sur la fenêtre à l'ouverture** (CONV-218) : la note met le focus sur la fenêtre (`tabindex="-1"`), sans dire si un contour est visible. À noter.
13. **Téléphone réel** (CONV-222) : le mode appareil d'un ordinateur ne reproduit pas la visionneuse PDF d'un téléphone. Quel appareil, quel navigateur ?
14. **PROD** : accord de Hanta nécessaire avant tout essai (données réelles).
15. **Tests en code** : les noms exacts des tests (fiche C57, 22 tests, 25 mis à jour), non relus, sont à ajouter dans la colonne `Remarques` si on veut la même précision qu'en R2.
16. **Compte du testeur « National »** et **version testée** : mêmes questions qu'en R1 à R8 (vrai profil FT National ou propriétaire ? commit publié sur TEST ?). À noter par le testeur au début de la campagne.
17. **Ancien cas de la liste B ou C non repéré** : la recherche a été faite à la lecture du texte, sans exécution. Si un cas oublié mentionne « Voir », le signaler.
