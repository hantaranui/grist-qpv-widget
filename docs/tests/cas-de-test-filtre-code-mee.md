# Cas de test de recette : colonne et filtre Code MEE (tableau de bord)

Brouillon rédigé par le recetteur (Claude), à relire et valider par Hanta. Ce sont des tests proposés, pas des tests passés : seul un humain décide du résultat (OK, KO, Bloqué, Non testé, Non applicable).

- Sources : docs/ux/filtre-code-mee.md (note UX validée le 20/11/2026), section « Sprint E10 » de docs/backlog.md, partie Code MEE du README.md.
- Version lisible du fichier docs/tests/cas-de-test-filtre-code-mee.tsv (18 colonnes pour l'onglet Cas_de_test). Si les deux diffèrent, le fichier .tsv fait foi.
- 19 cas : MEE-01 à MEE-19. Données fictives uniquement : on écrit « un code MEE existant dans TEST », jamais un vrai code.
- Environnement : document TEST. Aucun cas n'écrit dans Grist (l'export télécharge seulement un fichier) : tous sont rejouables en PROD.
- Prérequis commun : le profil du testeur existe dans la table Utilisateurs de TEST ; TEST contient des actions avec un code MEE et des actions sans code.
- Tests de fumée : MEE-01, MEE-05, MEE-09, MEE-15, MEE-16.
- Cas joués par « Développeur du projet » (« Voir en tant que » ou lecteur d'écran) : MEE-02, MEE-16, MEE-17. Les autres sont joués par « Autre développeur », depuis l'écran.
- Les cas ne se gênent pas : chacun commence par « Réinitialiser » (ou le dit en prérequis) et ne change aucune donnée.
- Redacteur : recetteur (Claude). Relu_par : vide.

## Synthèse

| ID | Fonction | Persona | Type | Criticité | Fumée | Automatisable | Joué par |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MEE-01 | Colonne MEE dans la liste | FT National | Nominal | Majeur | Oui | Oui | Autre développeur |
| MEE-02 | Colonne MEE avec un lecteur d'écran | FT National | Mobile et accessibilité | Mineur | Non | Non | Développeur du projet |
| MEE-03 | Tri Croissant | FT National | Nominal | Majeur | Non | Oui | Autre développeur |
| MEE-04 | Tri Décroissant | FT National | Nominal | Majeur | Non | Oui | Autre développeur |
| MEE-05 | Filtre par code exact, Entrée | FT National | Nominal | Bloquant | Oui | Oui | Autre développeur |
| MEE-06 | Filtre par code exact, loupe | FT National | Nominal | Majeur | Non | Oui | Autre développeur |
| MEE-07 | Filtre : code incomplet | FT National | Erreur | Majeur | Non | Oui | Autre développeur |
| MEE-08 | Filtre : espaces autour du code | FT National | Limite | Mineur | Non | Oui | Autre développeur |
| MEE-09 | Case « Sans code MEE » | FT National | Nominal | Majeur | Oui | Oui | Autre développeur |
| MEE-10 | Décocher la case | FT National | Limite | Majeur | Non | Oui | Autre développeur |
| MEE-11 | Case combinée avec le filtre DR | FT National | Nominal | Majeur | Non | Oui | Autre développeur |
| MEE-12 | Code gardé en changeant de page | FT National | Persistance | Majeur | Non | Oui | Autre développeur |
| MEE-13 | Case gardée en changeant de page | FT National | Persistance | Majeur | Non | Oui | Autre développeur |
| MEE-14 | Bouton Réinitialiser | FT National | Persistance | Majeur | Non | Oui | Autre développeur |
| MEE-15 | Export CSV : colonne MEE | FT National | Nominal | Majeur | Oui | Oui | Autre développeur |
| MEE-16 | Périmètre FT Régional | FT Régional | Droits | Bloquant | Oui | Non | Développeur du projet |
| MEE-17 | Périmètre FT Départemental | FT Départemental | Droits | Majeur | Non | Non | Développeur du projet |
| MEE-18 | Ordre de tabulation | FT National | Mobile et accessibilité | Majeur | Non | Non | Autre développeur |
| MEE-19 | Non-régression du filtre Numéro Osiris | FT National | Nominal | Majeur | Non | Oui | Autre développeur |

Note : la synthèse est recopiée à la main depuis le .tsv. En cas d'écart, le .tsv fait foi.

Couverture par les tests automatiques (détail dans la colonne Remarques du .tsv, lu dans test/code-mee.test.js, test/code-mee-ecran.test.js, test/logic.test.js et test/render.test.js) :
- Couverts : MEE-01, MEE-03, MEE-04, MEE-05, MEE-06, MEE-08, MEE-09, MEE-10, MEE-14, MEE-15, MEE-19.
- Couverts en partie : MEE-02 (texte caché oui, annonce du lecteur d'écran non), MEE-07 (résultat vide oui, message affiché non), MEE-12 et MEE-13 (restauration oui, passage réel par le bandeau non), MEE-18 (ordre dans le HTML oui, tabulation réelle non).
- Non couverts : MEE-11 (avec le filtre DR ; seule la combinaison avec le filtre Statut l'est), MEE-16 et MEE-17 (règles d'accès du document).

Modules voisins (à rejouer après une correction) : tous les cas ont « Liste des actions du tableau de bord » ou « Filtres du tableau de bord (Numéro Osiris) ». En plus : tri (MEE-03, MEE-04, MEE-14), export (MEE-01, MEE-15), bandeau de navigation (MEE-12, MEE-13), règles d'accès du document (MEE-16, MEE-17), filtres DR, DD, agence (MEE-11).

## A. Colonne MEE dans la liste

### MEE-01 — Colonne entre Agence et Club (Nominal, Majeur, Fumée)
- Étant donné : le tableau de bord ouvert dans TEST, avec des actions avec et sans code.
- Quand : 1) ouvrir le tableau de bord ; 2) regarder l'ordre des colonnes ; 3) repérer une action avec code et une sans code.
- Alors : la colonne « MEE » est entre Agence et Club. Le code est affiché tel que saisi ; une action sans code montre un tiret « — ».
- Données : un code MEE existant dans TEST ; une action sans code.

### MEE-02 — Lecteur d'écran (Mobile et accessibilité, Mineur) — Développeur du projet
- Étant donné : un lecteur d'écran, et au moins une action sans code.
- Quand : 1) activer le lecteur ; 2) se placer sur la cellule MEE d'une action sans code ; 3) se placer sur le bouton de tri de l'en-tête MEE.
- Alors : il annonce « Code MEE non renseigné » (et non « tiret ») ; le bouton est annoncé « Trier la colonne MEE ».

## B. Tri de la colonne MEE

### MEE-03 — Croissant (Nominal, Majeur)
- Étant donné : au moins deux codes MEE (tous à 6 chiffres) et des actions sans code.
- Quand : 1) ouvrir le menu de tri de la colonne MEE ; 2) choisir « Croissant » ; 3) lire les codes jusqu'en bas.
- Alors : du plus petit au plus grand. Les actions sans code sont toutes à la fin.
- Remarque : le cas « 9 avant 10 » est vérifié par les tests automatiques.

### MEE-04 — Décroissant (Nominal, Majeur)
- Étant donné : les mêmes données que MEE-03.
- Quand : 1) ouvrir le menu de tri de la colonne MEE ; 2) choisir « Décroissant » ; 3) lire les codes jusqu'en bas.
- Alors : du plus grand au plus petit. Les actions sans code restent à la fin, elles ne passent pas en tête.
- Remarque : le cas « 10 avant 9 » est vérifié par les tests automatiques.

## C. Filtre « Code MEE »

### MEE-05 — Code exact, Entrée (Nominal, Bloquant, Fumée)
- Étant donné : des actions avec un code.
- Quand : 1) « Réinitialiser » ; 2) déplier les filtres si besoin ; 3) taper un code existant dans « Code MEE », sans Entrée, et regarder la liste ; 4) appuyer sur Entrée.
- Alors : à l'étape 3, la liste ne change pas pendant la frappe. À l'étape 4, seules les actions de ce code restent.

### MEE-06 — Code exact, loupe (Nominal, Majeur)
- Étant donné : des actions avec un code.
- Quand : 1) « Réinitialiser » ; 2) taper un code existant ; 3) cliquer sur la loupe à côté du champ.
- Alors : seules les actions de ce code restent.

### MEE-07 — Code incomplet (Erreur, Majeur)
- Étant donné : des actions avec un code.
- Quand : 1) « Réinitialiser » ; 2) taper un code existant privé de son dernier chiffre ; 3) Entrée.
- Alors : aucune ligne, et le message « Aucune action ne correspond aux filtres. » en bas du tableau.
- Données : vérifier d'abord qu'aucune action n'a le code raccourci.

### MEE-08 — Espaces autour du code (Limite, Mineur)
- Étant donné : des actions avec un code.
- Quand : 1) « Réinitialiser » ; 2) taper un espace, un code existant, un espace ; 3) Entrée.
- Alors : même résultat que sans espaces.

## D. Case « Sans code MEE »

### MEE-09 — Cocher la case (Nominal, Majeur, Fumée)
- Étant donné : des actions avec et sans code.
- Quand : 1) « Réinitialiser » ; 2) taper quelques caractères dans « Code MEE », sans Entrée ; 3) cocher « Sans code MEE » ; 4) regarder la liste et le champ.
- Alors : dès la coche, la liste ne garde que les actions sans code (que des tirets dans la colonne MEE). Le champ est vidé et grisé.

### MEE-10 — Décocher la case (Limite, Majeur)
- Étant donné : des actions avec et sans code.
- Quand : 1) « Réinitialiser » ; 2) cocher la case ; 3) la décocher ; 4) taper un code existant, puis Entrée.
- Alors : à l'étape 3, la liste complète revient et le champ est de nouveau utilisable, vide. À l'étape 4, filtre normal par code.

### MEE-11 — Case + filtre DR (Nominal, Majeur)
- Étant donné : une DR qui a des actions avec et sans code.
- Quand : 1) « Réinitialiser » ; 2) choisir cette DR dans le filtre Direction régionale (DR) et noter les actions ; 3) cocher « Sans code MEE ».
- Alors : à l'étape 3, il ne reste que les actions de cette DR sans code.

## E. Conservation et Réinitialiser

### MEE-12 — Code gardé en changeant de page (Persistance, Majeur)
- Étant donné : des actions avec un code ; une autre page accessible par le bandeau.
- Quand : 1) « Réinitialiser » ; 2) taper un code existant, Entrée ; 3) aller sur une autre page par le bandeau ; 4) revenir.
- Alors : le champ contient encore le code et la liste est toujours filtrée.

### MEE-13 — Case gardée en changeant de page (Persistance, Majeur)
- Étant donné : des actions sans code ; une autre page accessible par le bandeau.
- Quand : 1) « Réinitialiser » ; 2) cocher la case ; 3) aller sur une autre page par le bandeau ; 4) revenir.
- Alors : la case est toujours cochée, le champ vide et grisé, la liste ne montre que des actions sans code.

### MEE-14 — Réinitialiser (Persistance, Majeur)
- Étant donné : des actions avec et sans code.
- Quand : 1) taper un code existant, Entrée ; 2) « Réinitialiser » ; 3) cocher la case ; 4) « Réinitialiser » à nouveau.
- Alors : à l'étape 2, champ vide et liste complète. À l'étape 4, case décochée, champ utilisable et vide, liste complète.

## F. Export CSV

### MEE-15 — Colonne MEE dans le fichier (Nominal, Majeur, Fumée)
- Étant donné : des actions avec et sans code ; un éditeur de texte simple.
- Quand : 1) « Réinitialiser » ; 2) cliquer sur « Exporter (CSV) » ; 3) ouvrir le fichier dans un éditeur de texte (pas un tableur) ; 4) lire l'en-tête, une ligne avec code et une ligne sans code.
- Alors : la colonne MEE est juste avant Club. Le code est écrit tel quel. Sans code : case vide, jamais de tiret.

## G. Périmètre selon le profil — Développeur du projet, « Voir en tant que »

### MEE-16 — FT Régional (Droits, Bloquant, Fumée)
- Étant donné : le profil FT Régional dans Utilisateurs ; des actions avec code dans au moins deux DR.
- Quand : 1) en FT National, noter un code de la DR du profil Régional et un code d'une autre DR ; 2) « Voir en tant que » FT Régional ; 3) lire la colonne MEE ; 4) taper le code de l'autre DR, Entrée ; 5) « Réinitialiser », puis cocher « Sans code MEE ».
- Alors : étape 3, seules les actions de sa DR, avec leurs codes. Étape 4, code non trouvé : « Aucune action ne correspond aux filtres. ». Étape 5, seules ses actions sans code.

### MEE-17 — FT Départemental (Droits, Majeur)
- Étant donné : le profil FT Départemental dans Utilisateurs ; des actions avec code dans au moins deux DD. Les règles d'accès de la table Actions dans TEST sont les mêmes que dans DEV (le profil a une règle limitée à sa DD).
- Quand : 1) en FT National, noter un code de la DD du profil et un code d'une autre DD ; 2) « Voir en tant que » FT Départemental ; 3) lire la colonne MEE ; 4) taper le code de l'autre DD, Entrée.
- Alors : étape 3, seules les actions de sa DD. Étape 4, code non trouvé : « Aucune action ne correspond aux filtres. ».

## H. Clavier et non-régression

### MEE-18 — Ordre de tabulation (Mobile et accessibilité, Majeur)
- Étant donné : filtres dépliés, case décochée.
- Quand : 1) cliquer dans « Numéro Osiris » ; 2) appuyer sur Tab en notant le focus, jusqu'au filtre DR ; 3) dans « Code MEE », taper un code, Entrée ; 4) aller à la case avec Tab et la cocher au clavier.
- Alors : ordre : champ Osiris, loupe Osiris, champ Code MEE, loupe Code MEE, case « Sans code MEE », filtre DR. Entrée applique le filtre ; la case se coche au clavier.

### MEE-19 — Filtre Numéro Osiris comme avant (Nominal, Majeur)
- Étant donné : des actions avec un numéro Osiris.
- Quand : 1) « Réinitialiser » ; 2) taper un numéro existant dans « Numéro Osiris », Entrée ; 3) « Réinitialiser », puis refaire avec la loupe d'Osiris.
- Alors : la liste ne garde que les actions de ce numéro, comme avant le Sprint E10. Le champ « Code MEE » reste vide et sans effet.

## Points à confirmer par Hanta

Données de TEST à choisir avant de jouer les cas :

1. MEE-11 : quelle DR de TEST a des actions avec code et des actions sans code ?
2. MEE-16 : quelle DR sert au profil FT Régional, et quelle autre DR fournit le code « hors périmètre » ?
3. MEE-17 : quelle DD sert au profil FT Départemental, et quelle autre DD fournit le code « hors périmètre » ?

Réglés dans cette version : codes à 6 chiffres dans TEST (MEE-03, MEE-04), règle d'accès du profil FT Départemental (MEE-17), liens avec les tests automatiques (colonne Remarques), en-tête « MEE » du fichier CSV (vérifié par test/code-mee.test.js).

Hors périmètre de ces cas, faute de demande : code très long et petit écran (défilement horizontal), colonne cachée si Code_MEE n'existe pas dans le document (couverte par les tests automatiques, pas par un cas humain), code fait d'espaces seuls (tiret à l'écran, valeur telle quelle dans l'export).
