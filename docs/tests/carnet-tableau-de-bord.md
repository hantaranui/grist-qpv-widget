# Carnet de tests — Tableau de bord (actions-dashboard)

Brouillon rédigé par le recetteur. Il doit être validé par Hanta, puis complété par la développeuse. Les tests proposés ici ne sont pas des tests passés : seul un humain décide du résultat.

Résultats possibles : OK, KO, Bloqué, Non testé, Non applicable.

Criticité (définitions provisoires : le protocole de test de l'équipe sera ajouté plus tard) :
- bloquant : la fonction ne marche pas ou donne de fausses données ;
- majeur : la fonction marche mal, mais on peut continuer à travailler ;
- mineur : défaut léger, sans effet sur le travail.

---

## Filtres géographiques dépendants

**Fonction** : les filtres « Direction régionale (DR) », « Direction départementale (DD) » et « Agence » dépendent les uns des autres.
**Commit à tester** : 66aa94b (code). Les tests automatiques sont dans 0c3cf11.
**Branche** : feature/filtres-geographiques-dependants.
**Environnement** : document Grist **DEV uniquement**, données fictives. Aucun test en PROD.

À remplir avant de commencer :

| Commit testé | Environnement | Profil utilisé | Nom du testeur | Date |
| --- | --- | --- | --- | --- |
| 66aa94b | DEV | | | |

### Les règles à vérifier

1. Sans DR ni DD choisie, les listes DD et Agence proposent toutes les valeurs.
2. Une DR choisie : la liste des DD ne propose que les DD de cette DR.
3. Une DD choisie : la liste des agences ne propose que les agences de cette DD.
4. Seule une DR choisie : la liste des agences propose les agences de cette DR.
5. Quand la DR change, la DD et l'agence déjà choisies sont effacées si elles ne font plus partie de la nouvelle DR. Une DD qui en fait toujours partie est gardée.
6. Quand la DD change, l'agence déjà choisie est effacée si elle ne fait plus partie de la nouvelle DD.
7. Les listes sont construites à partir des actions : une DD ou une agence sans action n'apparaît pas.
8. Les autres filtres (fédération, club, dispositif, statut, financeur, financement, numéro Osiris) ne changent pas et ne sont pas effacés.

### Jeu de données fictif à préparer dans DEV (par la développeuse, avant les tests)

Toutes les valeurs ci-dessous sont inventées. Ne rien copier depuis le document de production.

Dans la table Actions, les colonnes DD et DR sont **calculées** : on ne les remplit pas à la main. Il faut donc préparer les données à la source, dans les tables liées [À CONFIRMER : la chaîne exacte agence, DD, DR].

| Action | DR | DD | Agence | Statut | Fédération | Club | N° Osiris |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Action Test 1 | DR Test Alpha | DD Test A1 | Agence Test A1-1 | A confirmer | Fédération Test 1 | Club Test 1 | TEST-001 |
| Action Test 2 | DR Test Alpha | DD Test A1 | Agence Test A1-2 | Planifiée | Fédération Test 2 | Club Test 2 | TEST-002 |
| Action Test 3 | DR Test Alpha | DD Test A2 | Agence Test A2-1 | A confirmer | Fédération Test 1 | Club Test 1 | TEST-003 |
| Action Test 4 | DR Test Bravo | DD Test B1 | Agence Test B1-1 | Planifiée | Fédération Test 2 | Club Test 2 | TEST-004 |

Si le document DEV contient aussi d'autres données, regarder seulement les valeurs « Test » et vérifier qu'aucune valeur d'une autre DR ou d'une autre DD ne s'affiche à tort.

Les tests GEO-A09 et GEO-A10 ont besoin d'une action qui existe déjà dans DEV avec une DD sans DR (ou l'inverse). On ne la crée pas pour le test.

---

## Partie A — Tests joués par la développeuse (A)

### GEO-A01 — Une DR choisie limite la liste des DD

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 2) |
| Qui le joue | A |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Oui |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir « DR Test Alpha » dans la liste DR. 2. Ouvrir la liste DD. |
| Données de test | DR Test Alpha |
| Résultat attendu | La liste DD contient « DD Test A1 » et « DD Test A2 ». Elle ne contient pas « DD Test B1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-A02 — Une DD choisie limite la liste des agences

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 3) |
| Qui le joue | A |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Oui |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir « DD Test A1 » dans la liste DD (sans choisir de DR). 2. Ouvrir la liste Agence. |
| Données de test | DD Test A1 |
| Résultat attendu | La liste Agence contient « Agence Test A1-1 » et « Agence Test A1-2 ». Elle ne contient ni « Agence Test A2-1 », ni « Agence Test B1-1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-A03 — Seule une DR choisie : les agences de cette DR

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 4) |
| Qui le joue | A |
| Type | Cas normal |
| Criticité | Majeur |
| Test de fumée | Non |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir « DR Test Alpha ». 2. Ne pas toucher à la DD. 3. Ouvrir la liste Agence. |
| Données de test | DR Test Alpha |
| Résultat attendu | La liste Agence contient « Agence Test A1-1 », « Agence Test A1-2 » et « Agence Test A2-1 ». Elle ne contient pas « Agence Test B1-1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-A04 — Changer de DR efface la DD et l'agence qui n'en font plus partie

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 5) |
| Qui le joue | A |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Oui |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir « DR Test Alpha ». 2. Choisir « DD Test A1 ». 3. Choisir « Agence Test A1-1 ». 4. Changer la DR pour « DR Test Bravo ». |
| Données de test | DR Test Alpha, DD Test A1, Agence Test A1-1, DR Test Bravo |
| Résultat attendu | Les filtres DD et Agence reviennent à « Toutes ». La liste DD ne propose plus que « DD Test B1 » et la liste Agence que « Agence Test B1-1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-A05 — Une DD qui fait toujours partie de la DR est gardée

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 5) |
| Qui le joue | A |
| Type | Limite |
| Criticité | Majeur |
| Test de fumée | Non |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir « DR Test Alpha ». 2. Choisir « DD Test A1 ». 3. Remettre la DR à « Toutes ». |
| Données de test | DR Test Alpha, DD Test A1 |
| Résultat attendu | Le filtre DD reste sur « DD Test A1 ». Le tableau montre « Action Test 1 » et « Action Test 2 ». |
| Résultat obtenu | |
| Commit | |

### GEO-A06 — Changer de DD efface l'agence qui n'en fait plus partie

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 6) |
| Qui le joue | A |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Non |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir « DD Test A1 ». 2. Choisir « Agence Test A1-1 ». 3. Changer la DD pour « DD Test A2 ». |
| Données de test | DD Test A1, Agence Test A1-1, DD Test A2 |
| Résultat attendu | Le filtre Agence revient à « Toutes ». La liste Agence ne propose plus que « Agence Test A2-1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-A07 — Le bouton « Réinitialiser » remet tous les filtres à zéro

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (réinitialisation) |
| Qui le joue | A |
| Type | Cas normal |
| Criticité | Majeur |
| Test de fumée | Oui |
| Prérequis | Jeu de données fictif en place |
| Étapes | 1. Choisir « DR Test Alpha », « DD Test A1 » et « Agence Test A1-1 ». 2. Choisir un statut, une fédération et un club. 3. Écrire « TEST-001 » dans Numéro Osiris et lancer la recherche. 4. Cliquer sur « Réinitialiser ». 5. Ouvrir les listes DD et Agence. |
| Données de test | Valeurs de l'action Test 1 |
| Résultat attendu | Tous les filtres affichent « Toutes » (DR, DD, Agence, Fédération) ou « Tous » (Club, Dispositif, Statut, Financeur, Financement). Le champ Numéro Osiris est vide. Le tableau montre toutes les actions de test (les 4 actions, ou plus). Les listes DD et Agence proposent de nouveau toutes les valeurs de test (règle 1). |
| Résultat obtenu | |
| Commit | |

### GEO-A08 — Les autres filtres ne sont pas effacés par un changement de DR

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 8) |
| Qui le joue | A |
| Type | Conservation |
| Criticité | Majeur |
| Test de fumée | Non |
| Prérequis | Jeu de données fictif en place ; aucun filtre choisi |
| Étapes | 1. Choisir le statut « A confirmer » et la fédération « Fédération Test 1 ». 2. Écrire « TEST-001 » dans Numéro Osiris et lancer la recherche. 3. Choisir « DR Test Alpha ». 4. Choisir « DD Test A1 ». 5. Changer la DR pour « DR Test Bravo ». |
| Données de test | Statut A confirmer, Fédération Test 1, TEST-001 |
| Résultat attendu | Après chaque étape 3, 4 et 5, Statut reste « A confirmer », Fédération reste « Fédération Test 1 » et Numéro Osiris contient « TEST-001 ». Après l'étape 3, le tableau montre seulement « Action Test 1 ». Après l'étape 5, le tableau est vide et le message de tableau vide s'affiche. |
| Résultat obtenu | |
| Commit | |

### GEO-A09 — Action avec une DD mais sans DR (à jouer seulement si une DD sans DR existe dans DEV)

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règles 2, 5 et 7, point signalé par le développeur) |
| Qui le joue | A |
| Type | Limite |
| Criticité | Mineur |
| Test de fumée | Non |
| Prérequis | **À jouer seulement si une action avec une DD sans DR existe déjà dans DEV** ; sinon Non applicable. Ne pas la créer pour le test (DD et DR sont calculées). Noter le nom de cette DD : [À CONFIRMER]. |
| Étapes | 1. Sans filtre, ouvrir la liste DD et vérifier que cette DD est présente. 2. Choisir « DR Test Alpha ». 3. Rouvrir la liste DD et regarder le tableau. 4. Remettre la DR à « Toutes », choisir cette DD, puis choisir « DR Test Alpha ». |
| Données de test | Une action existante avec une DD sans DR, DR Test Alpha |
| Résultat attendu | Étape 1 : la DD est présente. Étape 3 : elle a disparu de la liste et son action n'est plus dans le tableau. Étape 4 : le filtre DD est effacé (« Toutes »). Ce comportement est voulu (règle 7) : une DD sans DR n'appartient à aucune DR. |
| Résultat obtenu | |
| Commit | |

### GEO-A10 — Action avec une DR mais sans DD (à jouer seulement si une DD sans DR existe dans DEV, et une action avec DR sans DD)

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règles 3 et 7, cas inverse du point signalé) |
| Qui le joue | A |
| Type | Limite |
| Criticité | Mineur |
| Test de fumée | Non |
| Prérequis | **À jouer seulement si une DD sans DR existe dans DEV** (comme GEO-A09) et si une action avec une DR sans DD existe aussi ; sinon Non applicable. Ne pas la créer pour le test. |
| Étapes | 1. Choisir la DR de cette action. 2. Regarder si l'action est dans le tableau. 3. Choisir une DD de la même DR. 4. Regarder si l'action est dans le tableau. |
| Données de test | Une action existante avec une DR sans DD |
| Résultat attendu | Étape 2 : l'action est dans le tableau. Étape 4 : elle n'y est plus (elle n'a pas de DD). Ce comportement est voulu (règle 7). |
| Résultat obtenu | |
| Commit | |

---

## Partie B — Tests joués par le collègue testeur (B)

Vous n'avez pas besoin de savoir programmer. Le document Grist **DEV** a été préparé avec des données inventées (des « Test »). Ne testez jamais dans le document de production.

Avant de commencer :
1. Ouvrez la page du tableau de bord dans le document **DEV**.
2. Cliquez sur « Déplier » à côté du mot « Filtres » (en haut à gauche) pour voir tous les filtres.
3. Pour les filtres « Direction départementale (DD) » et « Agence » : cliquez sur la case, une liste s'ouvre, puis cliquez sur la valeur voulue. Pour « Direction régionale (DR) » : cliquez sur la case et choisissez dans la liste.
4. À la fin de chaque test, cliquez sur « Réinitialiser » pour repartir de zéro.

Si ce que vous voyez n'est pas ce qui est écrit dans « Résultat attendu », notez-le dans « Résultat obtenu » (avec une capture d'écran si possible) et mettez KO. Ne corrigez rien vous-même.

### GEO-B01 — Choisir une région : seules les DD de cette région apparaissent

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 2) |
| Qui le joue | B |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Non |
| Prérequis | Page ouverte dans DEV, filtres dépliés, tous les filtres sur « Toutes » ou « Tous » |
| Étapes | 1. Cliquez sur la case « Direction régionale (DR) ». 2. Choisissez « DR Test Alpha ». 3. Cliquez sur la case « Direction départementale (DD) » pour ouvrir sa liste. 4. Lisez les noms proposés. |
| Données de test | DR Test Alpha |
| Résultat attendu | Vous voyez « DD Test A1 » et « DD Test A2 » (en plus de « Toutes »). Vous ne voyez pas « DD Test B1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-B02 — Choisir une DD : seules les agences de cette DD apparaissent

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 3) |
| Qui le joue | B |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Non |
| Prérequis | Page ouverte dans DEV, filtres dépliés, tous les filtres sur « Toutes » ou « Tous » |
| Étapes | 1. Cliquez sur la case « Direction départementale (DD) ». 2. Choisissez « DD Test A1 ». 3. Cliquez sur la case « Agence » pour ouvrir sa liste. 4. Lisez les noms proposés. |
| Données de test | DD Test A1 |
| Résultat attendu | Vous voyez « Agence Test A1-1 » et « Agence Test A1-2 » (en plus de « Toutes »). Vous ne voyez ni « Agence Test A2-1 », ni « Agence Test B1-1 ». |
| Résultat obtenu | |
| Commit | |

### GEO-B03 — Changer de région fait disparaître la DD qui n'en fait plus partie

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 5) |
| Qui le joue | B |
| Type | Cas normal |
| Criticité | Bloquant |
| Test de fumée | Non |
| Prérequis | Page ouverte dans DEV, filtres dépliés, tous les filtres sur « Toutes » ou « Tous » |
| Étapes | 1. Choisissez la DR « DR Test Alpha ». 2. Choisissez la DD « DD Test A1 ». 3. Changez la DR pour « DR Test Bravo ». 4. Regardez ce qui est écrit dans la case DD. |
| Données de test | DR Test Alpha, DD Test A1, DR Test Bravo |
| Résultat attendu | La case DD affiche de nouveau « Toutes » (« DD Test A1 » a disparu toute seule). |
| Résultat obtenu | |
| Commit | |

### GEO-B04 — Changer de DD fait disparaître l'agence qui n'en fait plus partie

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (règle 6) |
| Qui le joue | B |
| Type | Cas normal |
| Criticité | Majeur |
| Test de fumée | Non |
| Prérequis | Page ouverte dans DEV, filtres dépliés, tous les filtres sur « Toutes » ou « Tous » |
| Étapes | 1. Choisissez la DD « DD Test A1 ». 2. Choisissez l'agence « Agence Test A1-1 ». 3. Changez la DD pour « DD Test A2 ». 4. Regardez ce qui est écrit dans la case Agence. |
| Données de test | DD Test A1, Agence Test A1-1, DD Test A2 |
| Résultat attendu | La case Agence affiche de nouveau « Toutes ». |
| Résultat obtenu | |
| Commit | |

### GEO-B05 — Le bouton « Réinitialiser » remet tout à « Toutes »

| Champ | Contenu |
| --- | --- |
| Fonction | Filtres géographiques dépendants (réinitialisation) |
| Qui le joue | B |
| Type | Cas normal |
| Criticité | Majeur |
| Test de fumée | Oui |
| Prérequis | Page ouverte dans DEV, filtres dépliés, tous les filtres sur « Toutes » ou « Tous » |
| Étapes | 1. Choisissez « DR Test Alpha », puis « DD Test A1 », puis « Agence Test A1-1 ». 2. Choisissez aussi un statut dans le filtre « Statut ». 3. Cliquez sur « Réinitialiser » (à côté du mot « Filtres »). 4. Regardez chaque filtre. 5. Regardez le nombre d'actions dans le tableau. |
| Données de test | Valeurs de l'action Test 1 |
| Résultat attendu | Tous les filtres affichent « Toutes » ou « Tous ». Le tableau montre de nouveau toutes les actions de test (les 4 actions, ou plus si DEV en contient d'autres). |
| Résultat obtenu | |
| Commit | |

---

## Tests de fumée proposés pour cette fonction (5, à valider par Hanta)

| Test | Pourquoi il est critique |
| --- | --- |
| GEO-A01 | Cœur de la fonction : la DR limite les DD. |
| GEO-A02 | Cœur de la fonction : la DD limite les agences. |
| GEO-A04 | Le nettoyage automatique de la DD et de l'agence : s'il rate, le tableau reste vide sans que l'utilisateur comprenne pourquoi. |
| GEO-A07 | Le bouton « Réinitialiser » est le seul moyen de sortir d'un filtrage trop strict, et il doit aussi rétablir les listes complètes. |
| GEO-B05 | Le bouton « Réinitialiser », vu par un utilisateur non développeur. |

## Tests voisins à rejouer après une correction

- Un défaut sur les listes (A01 à A03, B01, B02) : rejouer ces tests.
- Un défaut sur l'effacement automatique (A04 à A06, B03, B04) : rejouer ces tests et A09, A10 s'ils ont été joués.
- Un défaut sur la réinitialisation (A07, B05) : rejouer A08 et A01.
- Dans tous les cas : relancer toute la suite automatique (lancée par Hanta).

## Tests reportés

| ID d'origine | Test | Raison du report |
| --- | --- | --- |
| GEO-A16 | Profil FT Régional : les listes se limitent aux lignes visibles | Demande un compte de test avec ce profil. À reprendre quand ce compte existe dans DEV. |

## Liste des [À CONFIRMER]

1. La chaîne exacte (agence, DD, DR) pour préparer le jeu de données dans DEV, puisque DD et DR sont des colonnes calculées de la table Actions.
2. GEO-A09 et GEO-A10 : le nom de la DD sans DR (et de l'action avec DR sans DD) à utiliser, s'ils existent déjà dans DEV.
