# Note UX — Exporter (CSV) les clubs et leurs contacts

Widget : clubs (src/clubs/). Écran concerné : la liste « Liste des clubs sportifs » (src/clubs/index.html), barre de titre.
Statut : mise à jour après les réponses de Hanta et de Pierre (tâche E8-2). Une seule question reste ouverte (§8). Aucun code modifié.
Sources lues : CLAUDE.md, docs/backlog.md (Sprint E8), docs/design-system-france-travail.md, src/clubs/index.html, src/clubs/style.css, src/clubs/script.js (filteredClubs, renderFilters, messages « Vos droits ne permettent pas… »), src/actions-dashboard/index.html, style.css et script.js (bouton et fonction exportCsv), docs/ux/contacts-fiche-club.md, feuille https://cdn.francetravail.fr/studio/design-system/css/styles.css (classes vérifiées), pages du design system citées plus bas. Aucun skill UI/UX dans .claude/skills/ (dossier absent).

## 0. Point de départ (ce qui existe)

- Liste des clubs (src/clubs/index.html) : `div.topbar` qui contient seulement `h1` « Clubs » ; puis `section.filters-bar` (`div.filters-body#filters`, puis `button.btn.btn-link.btn-sm#resetBtn` « Réinitialiser les filtres ») ; puis `section.table-panel` avec le tableau et `div.empty#empty` « Aucun club ne correspond aux filtres. ». Le tout est dans `div#listView`, masqué quand la fiche d'un club est ouverte.
- Tableau de bord (src/actions-dashboard/index.html) : `div.topbar` contient `h1` puis `div.topbar-actions`, qui contient `button.btn.btn-secondary#exportBtn` > `span.btn-content` « Exporter (CSV) », puis le bouton principal « Ajouter une action ». Il exporte les lignes filtrées, sans état désactivé ni annonce.
- Styles du tableau de bord (src/actions-dashboard/style.css) : `.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px; … }`, `.topbar-actions { display: flex; align-items: center; gap: 12px; }`, et sous le point de rupture mobile du fichier : `.topbar { align-items: flex-start; flex-direction: column; }`.
- Styles de clubs (src/clubs/style.css) : `.topbar` n'a que `padding: 24px` (16 px sous 560 px), un fond et une bordure. Il n'est pas flex et `.topbar-actions` n'existe pas.
- Table Contacts illisible : la fiche affiche « Vos droits ne permettent pas de lire les contacts. » (`p.empty-note`, script.js).
- Zone d'annonce existante : `p.sr-only#contactStatus` (`role="status"`, `aria-live="polite"`), commentée dans le HTML comme réservée aux contacts de la fiche.
- Le script `disabled-a11y.js` du design system n'est pas chargé dans le widget clubs (information de Hanta). Aucune balise de ce script dans src/clubs/index.html.

## 1. Utilisateur et parcours

Qui : un agent France Travail (National, Régional, Départemental) ou ANS. Il veut un fichier à ouvrir dans Excel avec les clubs de son périmètre, filtrés comme il le souhaite. Les profils FT (National, Régional, Départemental) ont accès à l'export, chacun dans son périmètre : c'est garanti par les règles d'accès de Grist, l'écran ne cache rien selon le profil. Cas de l'ANS : question ouverte, §8.

Parcours en 4 étapes :

1. L'agent règle les filtres Région, Département, Fédération, Club (ou n'en règle aucun).
2. Il clique sur « Exporter (CSV) » en haut à droite : un menu s'ouvre.
3. Il choisit « Liste des clubs » ou « Contacts » : le navigateur télécharge le fichier (les clubs affichés dans le tableau, pas d'autres) et le menu se ferme.
4. Une annonce vocale confirme le nombre de lignes exportées.

Tout ce qui est affiché dans le tableau est exporté : il n'y a pas de nombre maximal de clubs.

## 2. Emplacement et composant

### 2.1 Emplacement : la barre de titre, à droite, comme au tableau de bord

Le bouton « Exporter (CSV) » est dans le bandeau du haut du widget (`div.topbar`), à droite du titre « Clubs », au même endroit et avec la même apparence que celui du tableau de bord (`btn btn-secondary` > `span.btn-content`). Il n'y a pas de bouton principal à côté : il est seul à droite.

Comment le placer de la même façon (à faire par dev-interface dans src/clubs/index.html et src/clubs/style.css) :

1. Dans `div.topbar`, après `h1`, ajouter un `div.topbar-actions` qui contient le composant Dropdown (§2.2), comme le tableau de bord.
2. Dans src/clubs/style.css, donner à `.topbar` et à `.topbar-actions` les mêmes règles que celles du tableau de bord (valeurs relevées au §0 : flex, alignement centré, `space-between`, écart 16 px ; actions en flex, écart 12 px) et, sur petit écran, le même passage en colonne. Valeurs à recopier telles quelles : aucune nouvelle valeur. Le `padding` de `.topbar` de clubs (24 px, puis 16 px sous 560 px) ne change pas.
3. Le bandeau commun (balise `bandeau.js`, `data-titre="Liste des clubs sportifs"`) n'est pas touché. Il reste dans l'en-tête de la page ; le titre `h1` « Clubs » reste le titre propre du widget.

Les deux widgets gardent la même position et le même bouton ; la seule différence visible est la flèche du menu (icône `icon-chevron-sm-d`, voir §2.2).

### 2.2 Composant retenu : Dropdown (menu déroulant)

Pages : https://designsystem.francetravail.io/components/detail/dropdown--liste.html (exemple « Avec une liste d'actions ») et https://designsystem.francetravail.io/components/detail/dropdown--default.html (exemple de base).

Le Dropdown convient : la page le décrit comme une liste d'actions contextuelles qui apparaissent après le clic sur un bouton, et non comme un choix de valeur (c'est le rôle de Select ou Autocomplete). Deux actions d'export entrent exactement dans cet usage. Aucun composant à inventer.

Structure HTML exacte de la page (exemple « Avec une liste d'actions », recopiée, 3 lignes dans l'exemple ; on en garde 2) :

```html
<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" data-ft-dropdown="dropdown-example" type="button">
    <span class="btn-content">Plus d'actions</span>
    <span aria-hidden="true" class="icon icon-chevron-sm-d"></span>
  </button>

  <div id="dropdown-example" class="dropdown-menu dropdown-md">
    <ul class="dropdown-list">
      <li>
        <a class="dropdown-item" href="#">
          <span aria-hidden="true" class="icon icon-home"></span>
          Espace personnel
        </a>
      </li>
      <li>
        <a class="dropdown-item" href="#">
          <span aria-hidden="true" class="icon icon-mail"></span>
          Courriers reçus
        </a>
      </li>
      <li>
        <a class="dropdown-item" href="#">
          <span aria-hidden="true" class="icon icon-gear"></span>
          Mon compte
        </a>
      </li>
    </ul>
  </div>
</div>
```

Adaptation pour clubs (seuls le texte, l'`id` du menu et le nombre de lignes changent ; `id` à choisir par dev-interface, unique dans la page) :

- Libellé du bouton : « Exporter (CSV) » (dans `span.btn-content`, comme le tableau de bord).
- `data-ft-dropdown` du bouton = `id` du `div.dropdown-menu`.
- Ligne 1 : « Liste des clubs ». Ligne 2 : « Contacts ». Pas d'icône dans les lignes : la page en montre, mais elles sont décoratives (`aria-hidden`) et je n'en choisis pas sans besoin (aucune icône proposée, pour ne pas en inventer).
- Menu aligné sur le bord droit du bouton : la feuille contient une classe `dropdown-menu-right`, mais je n'ai pas relevé de page qui l'utilise. À essayer par dev-interface et à confirmer à l'écran ; sinon le menu risque de dépasser du widget, le bouton étant tout à droite.
- Pas d'attribut sur la structure de la page autre que ceux ci-dessus, sauf la désactivation (§3).

Ce que la page ne dit pas (je ne l'invente pas) :

- Aucun attribut ARIA sur le bouton ni sur le menu (ni `aria-expanded`, ni `aria-controls`, ni `role`). Seule l'icône a `aria-hidden="true"`.
- Aucune description du comportement au clavier ni pour les lecteurs d'écran. Le comportement vient du script `ft-autoloader.js` (CDN), dont je n'ai pas le contenu.
- Les lignes sont des liens (`a href="#"`) : la page ne prévoit pas de ligne de type bouton. Le code doit empêcher la navigation par défaut du lien (`href="#"`) et lancer l'export.

Comportement attendu (à vérifier à la main par la personne qui teste, car la page ne le garantit pas) :

| Geste | Attendu |
| --- | --- |
| Tab | Le bouton « Exporter (CSV) » reçoit le focus, après le titre et avant la barre de filtres. |
| Entrée ou Espace sur le bouton | Le menu s'ouvre (comportement natif de `button` + script du design system). |
| Tab dans le menu ouvert | Le focus passe sur « Liste des clubs », puis « Contacts ». |
| Entrée sur une ligne | Lance l'export, ferme le menu. |
| Échap | Ferme le menu, focus sur le bouton « Exporter (CSV) ». |
| Clic ailleurs | Ferme le menu. |
| Lecteur d'écran | Lit « Exporter (CSV), bouton » puis, dans le menu, le texte de chaque ligne (« lien » pour une ligne, car la page utilise des liens). Sans `aria-expanded` sur la page, l'état ouvert ou fermé n'est pas annoncé : à tester. |

Si le test montre qu'Échap, la fermeture ou le retour du focus ne fonctionnent pas, c'est un défaut du composant du design system, pas du widget : le signaler à Hanta, ne rien fabriquer à la main.

### 2.3 Maquette en texte

Écran large :

```
┌─ Barre de titre ───────────────────────────────────────────────────────┐
│ ▌Clubs                                              [ Exporter (CSV) ▾ ]│
│                                                     ┌─────────────────┐ │
│                                                     │ Liste des clubs │ │
│                                                     │ Contacts        │ │
│                                                     └─────────────────┘ │
├─ Filtres ──────────────────────────────────────────────────────────────┤
│ Région [Toutes ▾]  Département [Tous ▾]  Fédération [Toutes ▾]  Club [Tous ▾] │
│ Réinitialiser les filtres                                               │
└────────────────────────────────────────────────────────────────────────┘
```

(le menu n'est visible que quand il est ouvert)

Écran étroit (mobile) : comme au tableau de bord, la barre de titre passe en colonne, le titre au-dessus, le bouton « Exporter (CSV) » dessous, aligné à gauche. Le menu s'ouvre sous le bouton. Aucun défilement horizontal de la page.

Ordre de lecture et de tabulation : titre (non focalisable), « Exporter (CSV) », puis (menu ouvert) « Liste des clubs », « Contacts » ; puis filtres, « Réinitialiser les filtres », tableau.

## 3. États et désactivation

Désactivation par `aria-disabled="true"`, pas par `disabled` :

- Un bouton ou une ligne `aria-disabled="true"` reste dans l'ordre de tabulation et est annoncé « indisponible », alors qu'un `disabled` disparaît du clavier et des lecteurs d'écran : l'agent ne saurait pas pourquoi l'export manque.
- La feuille du CDN contient des styles pour `[aria-disabled=true]` sur les boutons, et la règle `.dropdown-item[aria-disabled=true]` pour les lignes du menu (relevées dans la feuille). L'apparence grisée vient donc du design system.
- Le script `disabled-a11y.js`, qui bloque le clic de ces éléments, n'est PAS chargé dans le widget clubs : **le code devra ignorer lui-même le clic** sur un élément `aria-disabled="true"` (aucun fichier produit, aucune annonce d'export). Pour le bouton principal, il faut aussi que le menu ne s'ouvre pas : le script `ft-autoloader.js` ouvre le menu sur le clic ; je ne sais pas comment l'en empêcher proprement. À essayer par dev-interface ; si ce n'est pas possible sans fabriquer, le signaler à Hanta (voir §9, risques).

| État | Bouton « Exporter (CSV) » | Ligne « Liste des clubs » | Ligne « Contacts » | Ce qui est affiché |
| --- | --- | --- | --- | --- |
| Au moins 1 club affiché, contacts lisibles | actif | active | active | rien de plus |
| Aucun club affiché | `aria-disabled="true"` | (menu fermé) | (menu fermé) | « Aucun club ne correspond aux filtres. » (texte existant `#empty`, voir ci-dessous) |
| Au moins 1 club, contacts illisibles | actif | active | `aria-disabled="true"` | « Vos droits ne permettent pas de lire les contacts. » (voir §8 : variante à choisir pour l'ANS) |
| Données pas encore chargées | `aria-disabled="true"` | (menu fermé) | (menu fermé) | rien de plus (le tableau est vide aussi) |

Aucun club affiché : le menu ne s'ouvre pas ; la raison est le texte déjà affiché sous le tableau, « Aucun club ne correspond aux filtres. » (`div#empty`). Pour qu'un lecteur d'écran la lise au focus du bouton, relier le bouton à ce texte par `aria-describedby` (valeur : l'`id` existant `empty`). Aucun texte nouveau.

Contacts illisibles : le message est celui de la fiche du club, mot pour mot : « Vos droits ne permettent pas de lire les contacts. » Il doit être visible quand le menu est ouvert, sans dépendre de l'infobulle ni de la couleur seule. La feuille du CDN contient une classe `dropdown-item-text`, mais je n'ai relevé aucune page qui montre son usage : si dev-interface ne peut pas la confirmer, mettre la phrase dans une ligne de texte du menu à côté de « Contacts » est le plus proche, sans fabriquer. Dans tous les cas, la ligne « Contacts » est reliée à cette phrase par `aria-describedby`. À valider par Hanta après essai.

Autres états sans écran supplémentaire :

- Pendant la fabrication du fichier : aucun état « en cours » (opération immédiate, tout est déjà en mémoire). Pas de barre de progression.
- Échec du téléchargement par le navigateur : rien n'est détectable par le widget. Aucun message prévu (le tableau de bord n'en a pas non plus).
- Après un changement de filtre : l'état du bouton et des lignes se met à jour à chaque affichage de la liste (`render()`).
- Fiche d'un club ouverte : la liste, donc la barre de titre et le bouton, est masquée. Retour à la liste : l'état est recalculé.

## 4. Textes exacts (français)

| Élément | Texte |
| --- | --- |
| Bouton | Exporter (CSV) |
| Ligne 1 du menu | Liste des clubs |
| Ligne 2 du menu | Contacts |
| Contacts illisibles | Vos droits ne permettent pas de lire les contacts. |
| Aucun club affiché | Aucun club ne correspond aux filtres. (texte existant) |

Annonces vocales après un export : voir §6.3.

## 5. Nom des fichiers

Avec la date du jour, au format AAAA-MM-JJ, en minuscules et avec des tirets (comme `actions-insertion-sport.csv` du tableau de bord) :

- Liste des clubs : `clubs-insertion-sport-AAAA-MM-JJ.csv`, par exemple `clubs-insertion-sport-2026-11-18.csv`
- Contacts : `contacts-clubs-insertion-sport-AAAA-MM-JJ.csv`, par exemple `contacts-clubs-insertion-sport-2026-11-18.csv`

Ni le nom de la région, ni un nom de club dans le nom du fichier (pas d'accents ni d'espaces à traiter, aucune donnée du périmètre dans un nom de fichier qui circule). La date est celle du jour de l'export, prise sur l'ordinateur de l'agent.

## 6. Accessibilité

### 6.1 Libellés pour lecteur d'écran

- Le bouton et les lignes du menu : le texte visible suffit comme nom accessible. Pas d'`aria-label` différent du texte visible (WCAG 2.5.3, étiquette dans le nom). Il n'y a plus de groupe de boutons, donc plus d'`aria-label` de groupe.
- Les icônes (flèche du bouton) restent `aria-hidden="true"`, comme sur la page.
- Les phrases d'aide (§3) sont reliées par `aria-describedby`. Les `id` nouveaux sont à choisir par dev-interface, non inventés ici.
- Aucune information portée par la seule couleur : un élément désactivé a une phrase écrite qui l'explique (Contacts), ou un texte déjà visible (aucun club), pas seulement un grisé.

### 6.2 Clavier

Voir le tableau du §2.2. Le focus visible existant du widget (`outline: 2px solid var(--ft--color-primary)`, style.css) s'applique ; ne rien redéfinir. Un élément `aria-disabled` reste atteignable au clavier et ne fait rien (§3).

### 6.3 Annonce du résultat

Après l'export, annonce vocale polie (`role="status"`, `aria-live="polite"`), sans texte visible, dans une zone `sr-only` qui existe déjà au chargement de la page.

**Choix : une zone dédiée**, avec la même forme que `#contactStatus` (`p.sr-only`, `role="status"`, `aria-live="polite"`), placée à côté d'elle dans le HTML. Raison : `#contactStatus` est commentée et nommée pour les contacts de la fiche ; la réutiliser pour l'export détourne son nom et son commentaire et ferait écrire deux fonctions différentes dans la même zone, alors qu'une zone de plus ne coûte qu'une ligne de HTML. L'`id` de la nouvelle zone est à choisir par dev-interface.

Textes :

- Liste des clubs : « Fichier téléchargé : 12 clubs exportés. » (singulier : « Fichier téléchargé : 1 club exporté. »)
- Contacts : « Fichier téléchargé : 31 lignes pour 12 clubs. » (singulier à adapter.) Un club sans contact compte pour une ligne vide : le nombre de lignes peut donc dépasser ou égaler le nombre de clubs.

Le nombre vient de la liste réellement écrite, pas d'un autre calcul. L'agent qui voit voit le fichier arriver dans son navigateur : aucune alerte de succès visible n'est ajoutée (même choix que contacts-fiche-club.md §7.4 et que le tableau de bord).

### 6.4 Autres points

- Contraste : couleurs du design system seulement (bouton secondaire, lignes du menu et styles `aria-disabled` de la feuille). La phrase d'aide utilise la couleur de texte atténuée déjà présente dans le widget (`muted-text`), à contrôler en contraste par dev-interface comme pour les autres textes gris.
- Zoom 200 % et petit écran : la barre de titre passe en colonne (§2.3).
- Titre « Clubs » (`h1`) inchangé, aucun nouveau titre.

## 7. Règles à respecter pour dev-interface

1. Aucune couleur, police ni espacement nouveaux : uniquement les classes du design system citées dans cette note et les variables ou valeurs déjà présentes dans style.css (dont celles de `.topbar` et `.topbar-actions` du tableau de bord).
2. Nos propres classes ne reprennent aucun nom du design system (test/styles.test.js). `topbar-actions` existe déjà côté tableau de bord ; les `id` et classes nouveaux sont à choisir et à vérifier dans le dépôt, je n'en invente pas.
3. Le bouton garde exactement l'apparence de celui du tableau de bord : `btn btn-secondary` > `span.btn-content`, avec en plus `dropdown-toggle` et l'icône de la page.
4. Désactivation par `aria-disabled="true"` ; `disabled-a11y.js` n'est pas chargé : le code ignore lui-même le clic (§3).
5. Tout ce qui est affiché venant de Grist est échappé (escapeHtml). Aucune donnée réelle dans les tests ou la documentation : exemples fictifs en `exemple.fr`.
6. Le bandeau commun n'est pas touché (balise `data-titre="Liste des clubs sportifs"` inchangée dans l'en-tête).
7. Nouveau code dans un bloc séparé (consigne de la tâche E8-8). Les valeurs répétées (noms de fichiers, textes) vont en constantes en tête de fichier.
8. Les textes de la note sont recopiés tels quels, sans reformulation.
9. Aucun avertissement sur les données personnelles n'est affiché (décision, §10).
10. Le menu du design system est testé à la main (clavier, Échap, lecteur d'écran) avant de conclure : la page ne documente pas ce comportement.

## 8. Question ouverte

Pour Pierre :

**Question 9 — ANS (clubs lisibles, contacts illisibles) : que fait la ligne « Contacts » ?**

- Variante A : griser la ligne. Elle reste dans le menu avec `aria-disabled="true"` et le message « Vos droits ne permettent pas de lire les contacts. » Avantage : l'agent comprend pourquoi, et le menu est identique pour tous les profils. Inconvénient : une ligne qui ne sert jamais à ce profil.
- Variante B : masquer la ligne. Le menu de l'ANS n'a plus que « Liste des clubs ». Avantage : rien d'inutilisable à l'écran. Inconvénient : l'agent ne sait pas que l'export des contacts existe ni pourquoi il n'y a pas accès ; le menu diffère selon le profil (l'écran « décide » alors d'un affichage selon les droits, ce qui n'est pas le principe posé dans CLAUDE.md, où les droits viennent de Grist). Dans cette variante, il resterait un menu à une seule ligne : à signaler à Hanta.

Pas de recommandation de ma part. Le reste du comportement (grisé + message quand la table Contacts est illisible pour une raison inattendue) est inchangé.

## 9. Composants cités et risques sur le design system

| Composant | Page | Classes vérifiées dans la feuille CDN |
| --- | --- | --- |
| Dropdown (liste d'actions) | https://designsystem.francetravail.io/components/detail/dropdown--liste.html | `dropdown`, `dropdown-toggle`, `dropdown-menu`, `dropdown-md`, `dropdown-list`, `dropdown-item`, `dropdown-item[aria-disabled=true]` ; aussi présentes dans la feuille, usage non relevé : `dropdown-menu-right`, `dropdown-item-text` |
| Dropdown (exemple de base) | https://designsystem.francetravail.io/components/detail/dropdown--default.html | `dropdown-body` (non utilisée ici) |
| Bouton secondaire | https://designsystem.francetravail.io/components/detail/button--secondary.html | `btn`, `btn-secondary`, `btn-content` |

Structure du bouton secondaire (page ci-dessus) :

```html
<button class="btn btn-secondary" type="button">
  <span class="btn-content">Je suis un bouton</span>
</button>
```

Composant manquant : aucun. Écarts à signaler :

1. Les lignes du Dropdown de la page sont des liens (`a href="#"`), pas des boutons : le code doit annuler la navigation. Aucun composant de « ligne bouton » n'a été relevé.
2. La page ne documente ni le clavier, ni les annonces, ni `aria-expanded`.
3. Désactiver le bouton principal sans que le menu s'ouvre n'est pas décrit par le design system (voir §3).

## 10. Décisions déjà prises (rappel)

- Un seul bouton « Exporter (CSV) » avec un menu à deux choix (décision de Hanta et Pierre).
- Emplacement : barre de titre, à droite, comme au tableau de bord.
- Désactivation par `aria-disabled="true"`.
- Aucun avertissement sur les données personnelles : choix fait par Hanta, car les agents saisissent eux-mêmes ces données et travaillent déjà avec ce type de fichiers.
- Noms de fichiers avec la date du jour.
- Profils FT National, Régional, Départemental : accès à l'export, chacun dans son périmètre (règles d'accès de Grist).
- Pas de nombre maximal de clubs : on exporte tout ce qui est affiché.
