# Note UX — Exporter (CSV) les clubs et leurs contacts

Widget : clubs (src/clubs/). Écran concerné : la liste « Liste des clubs sportifs » (src/clubs/index.html), barre de filtres.
Statut : proposition (tâche E8-2), à valider par Hanta et Pierre (E8-3). Aucun code modifié.
Sources lues : CLAUDE.md, docs/backlog.md (Sprint E8), docs/design-system-france-travail.md, src/clubs/index.html, src/clubs/style.css, src/clubs/script.js (filteredClubs, renderFilters, messages « Vos droits ne permettent pas… »), src/actions-dashboard/index.html, style.css et script.js (bouton et fonction exportCsv), docs/ux/contacts-fiche-club.md, feuille https://cdn.francetravail.fr/studio/design-system/css/styles.css (classes vérifiées), pages du design system citées plus bas. Aucun skill UI/UX dans .claude/skills/ (dossier absent).

## 0. Point de départ (ce qui existe)

- Liste des clubs : `div.topbar` avec `h1` « Clubs », puis `section.filters-bar` (`div.filters-body#filters` pour les quatre filtres, puis `button.btn.btn-link.btn-sm#resetBtn` « Réinitialiser les filtres »), puis `section.table-panel` avec le tableau et `div.empty#empty` « Aucun club ne correspond aux filtres. ».
- `.filters-bar` est un flex qui passe à la ligne (`flex-wrap: wrap`, `align-items: end`). `.filters-body` prend la place restante (`flex: 1 1 auto`).
- Tableau de bord : `button.btn.btn-secondary#exportBtn` > `span.btn-content` « Exporter (CSV) », dans `div.topbar-actions`, en haut à droite de la barre de titre, à côté du bouton principal « Ajouter une action ». Il exporte les lignes filtrées. Il n'a pas d'état désactivé, pas d'annonce, pas de message.
- Table Contacts illisible : la fiche affiche « Vos droits ne permettent pas de lire les contacts. » (`p.empty-note`, script.js).
- Zone d'annonce existante : `p.sr-only#contactStatus` (`role="status"`, `aria-live="polite"`), créée pour les contacts. Le widget a déjà ce principe d'annonce vocale sans texte visible.
- Alertes déjà utilisées dans clubs : `div.alert.alert-error` > `p.alert-content`, avec `role="alert"`.

## 1. Utilisateur et parcours

Qui : un agent France Travail (National, Régional, Départemental) ou ANS (hypothèse : tous les profils ; point à confirmer, §8). Il veut un fichier à ouvrir dans Excel avec les clubs de son périmètre, filtrés comme il le souhaite.

Parcours (4 étapes pour la liste des clubs, 4 pour les contacts) :

1. L'agent règle les filtres Région, Département, Fédération, Club (ou n'en règle aucun).
2. Il clique sur « Exporter la liste des clubs » ou sur « Exporter les contacts ».
3. Le navigateur télécharge le fichier (les clubs affichés dans le tableau, pas d'autres).
4. Une annonce vocale confirme le nombre de clubs exportés. Pour les contacts, l'avertissement données personnelles a été vu avant (voir §3.4).

## 2. Emplacement et choix entre les deux exports

### 2.1 Emplacement du bouton

Recommandation : **dans la barre de filtres (`section.filters-bar`), à droite, après « Réinitialiser les filtres »**, à la fin de la ligne. Raison : l'export dépend directement des filtres, il doit être au même endroit visuel. Le widget clubs n'a pas de bouton principal dans sa barre de titre (contrairement au tableau de bord), la barre de titre reste donc inchangée.

Alternative écartée : la barre de titre (`topbar`). Le tableau de bord y met son bouton, mais clubs n'y a que le titre, et l'export serait éloigné des filtres dont il dépend. La seule chose qui rapproche des deux widgets est l'apparence du bouton : `btn btn-secondary`, comme demandé.

### 2.2 Deux boutons ou un bouton avec un choix : deux boutons groupés

Recommandation : **deux boutons côte à côte dans un groupe de boutons du design system**, chacun avec un libellé qui dit ce qu'il télécharge. Raisons :

- un seul clic au lieu de deux (un menu demande ouvrir, puis choisir) ;
- aucun composant de menu à ajouter : le groupe de boutons existe ;
- le choix est visible, donc compréhensible sans explication ;
- moins de risque d'accessibilité (un menu déroulant demande un focus géré, la touche Échap, les flèches).

Le bouton unique « Exporter (CSV) » de la user story est conservé comme **nom du groupe** (étiquette lue par le lecteur d'écran), et les deux boutons portent chacun une précision. Choix à confirmer (question 1, §8).

Alternative si Hanta préfère un seul bouton : le composant Dropdown du design system (webcomposant), pages https://designsystem.francetravail.io/components/detail/dropdown--default.html et https://designsystem.francetravail.io/components/detail/dropdown--liste.html. Je n'ai pas relevé sa structure HTML exacte ici (aucun split button n'existe dans le design system) : si cette option est retenue, je dois la relever avant que dev-interface code. Pas de menu fabriqué à la main.

### 2.3 Composant retenu : groupe de boutons secondaires

Page : https://designsystem.francetravail.io/components/detail/button-group--secondary.html
Classes vérifiées dans la feuille du CDN : `.btn-group`, `.btn-group-item`, `.btn-group-sm`.

Structure HTML exacte de la page (3 boutons dans l'exemple ; on en garde 2) :

```html
<ul class="btn-group" role="group">
  <li class="btn-group-item">
    <button class="btn btn-secondary" type="button">
      <span class="btn-content">Gauche</span>
    </button>
  </li>
  <li class="btn-group-item">
    <button class="btn btn-secondary" type="button">
      <span class="btn-content">Droite</span>
    </button>
  </li>
</ul>
```

La page ne donne qu'un attribut ARIA, `role="group"`. **Ajout proposé** (pas dans la page) : `aria-label="Exporter (CSV)"` sur le `<ul>`, pour que le groupe soit nommé. À valider (question 6, §8).

Bouton secondaire : https://designsystem.francetravail.io/components/detail/button--secondary.html

```html
<button class="btn btn-secondary" type="button">
  <span class="btn-content">Je suis un bouton</span>
</button>
```

Les deux boutons gardent donc exactement l'apparence de l'export du tableau de bord (`btn btn-secondary` > `span.btn-content`). Ne pas ajouter `btn-sm` : le tableau de bord n'en met pas, et « Réinitialiser les filtres » (lien `btn-link btn-sm`) doit rester le bouton le plus discret de la barre.

### 2.4 Maquette en texte

Écran large :

```
┌─ Filtres ──────────────────────────────────────────────────────────────┐
│ Région [Toutes ▾]  Département [Tous ▾]  Fédération [Toutes ▾]  Club [Tous ▾]│
│ Réinitialiser les filtres      ┌ Exporter (CSV) ────────────────────────┐│
│                                │ [Exporter la liste des clubs][Exporter les contacts] ││
│                                └────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
(la ligne « Exporter (CSV) » est le nom du groupe, lu par le lecteur d'écran, non affiché)
```

Écran étroit (mobile) : la barre passe déjà à la ligne (`flex-wrap`). Le groupe passe sous les filtres, sur toute la largeur disponible ; si les deux libellés ne tiennent pas côte à côte, ils passent l'un sous l'autre, dans l'ordre : liste des clubs, puis contacts. Aucun défilement horizontal de la page.

Ordre de lecture et de tabulation : filtres, « Réinitialiser les filtres », « Exporter la liste des clubs », « Exporter les contacts », tableau.

## 3. Textes exacts (français)

### 3.1 Libellés

| Élément | Texte |
| --- | --- |
| Nom du groupe (aria-label) | Exporter (CSV) |
| Bouton 1 | Exporter la liste des clubs |
| Bouton 2 | Exporter les contacts |

Les deux boutons gardent la même mention « (CSV) » dans le nom du groupe : un lecteur d'écran lit « Exporter (CSV), groupe, Exporter la liste des clubs, bouton ».

### 3.2 Aucun club affiché

Les deux boutons sont désactivés (§5). Pour que l'agent comprenne pourquoi, sans dépendre de l'infobulle ni de la couleur :

- le texte déjà affiché sous le tableau, « Aucun club ne correspond aux filtres. » (div#empty), reste la raison visible ;
- phrase d'aide, liée aux boutons par `aria-describedby`, lue par les lecteurs d'écran, visible sous le groupe seulement quand les boutons sont désactivés : « Aucun club n'est affiché : modifiez les filtres pour exporter. »

Si un agent actionne tout de même un bouton désactivé (voir §5), aucun fichier n'est produit, et la phrase d'aide est annoncée.

### 3.3 Contacts illisibles

Quand la table Contacts ne peut pas être lue :

- « Exporter les contacts » est désactivé ;
- phrase d'aide liée au bouton (`aria-describedby`), visible sous le groupe : « Vos droits ne permettent pas de lire les contacts. » (même phrase que la fiche du club, mot pour mot) ;
- « Exporter la liste des clubs » reste actif si au moins un club est affiché (décision de l'audit E8-1).

Raison du choix « désactivé + phrase » plutôt qu'« actif + message au clic » : l'agent sait avant de cliquer, et on n'affiche pas une alerte pour une chose que le profil n'a jamais pu faire. La fiche du club n'affiche d'ailleurs pas non plus d'alerte, seulement la phrase en note grise (`p.empty-note`).

Si les deux problèmes sont présents (aucun club ET contacts illisibles) : deux phrases d'aide, l'une sous l'autre, « Aucun club n'est affiché : modifiez les filtres pour exporter. » puis « Vos droits ne permettent pas de lire les contacts. »

### 3.4 Avertissement données personnelles (proposition, pour l'export des contacts uniquement)

Texte proposé (court, deux phrases) :

> Ce fichier contient des données personnelles (noms, e-mails, téléphones). Il n'est pas protégé hors de Grist : ne le partagez pas et supprimez-le après usage.

Deux formes possibles, l'une des deux à retenir :

**Forme A : texte permanent près du bouton (recommandée).**
Le texte est affiché en permanence sous le groupe, en note grise, et relié au bouton « Exporter les contacts » par `aria-describedby` : le lecteur d'écran le lit quand le bouton prend le focus. Avantages : aucun clic de plus, aucune fenêtre à gérer, vu à chaque fois sans qu'on puisse « ne plus le voir ». Inconvénient : occupe une ligne dans la barre de filtres, même quand on exporte seulement la liste des clubs. Composant : la note grise existante `p.empty-note` n'est pas faite pour ça (italique, sens « vide »). Classe à ne pas inventer : si Hanta retient la forme A, utiliser une alerte d'information (ci-dessous) ou le texte `muted-text` déjà présent dans clubs (`span.muted-text`, style.css) ; décision à prendre (question 4, §8).

**Forme B : message avant téléchargement.**
Un clic sur « Exporter les contacts » ouvre une fenêtre de confirmation (modale, comme la suppression d'un contact : `role="alertdialog"`, focus sur « Annuler ») avec le texte ci-dessus et deux boutons : « Annuler » et « Télécharger ». Avantages : message impossible à rater. Inconvénients : un clic de plus à chaque export, fatigue (l'agent clique sans lire), une fenêtre à coder et à tester de plus.

Composant retenu dans les deux formes pour afficher le texte : alerte d'avertissement du design system.
Page : https://designsystem.francetravail.io/components/detail/alert--warning.html
Classe vérifiée dans la feuille du CDN : `.alert-warning`. La page montre un webcomposant (`ft-alert`), alors que le widget utilise déjà les classes de la feuille pour l'alerte d'erreur (`div.alert.alert-error` > `p.alert-content`). Par cohérence avec le widget, dev-interface reprendrait la forme déjà utilisée dans clubs, avec `alert-warning` à la place de `alert-error` ; **cette forme n'est pas celle de la page** (voir « Écarts » ci-dessous).

Structure HTML exacte de la page :

```html
<ft-alert nextfocus="id-element-next-focus" version="warning">
  <p class="alert-title">
    Alerte d'avertissement
  </p>
  <p class="alert-content">Je suis une alerte d'avertissement.</p>
</ft-alert>
```

La page ne montre ni icône, ni bouton de fermeture, ni `role`/`aria-*`.

Écarts à signaler (je ne les ai pas tranchés) :
1. Le widget n'utilise pas `ft-alert` mais les classes `alert alert-error`. La variante « avertissement » avec ces classes (`alert alert-warning`) n'a pas été relevée sur une page : je n'ai vu que la classe dans la feuille. À vérifier par Hanta ou par une lecture du site avant le code.
2. Sur la page, aucun `role`. Un avertissement permanent n'a pas besoin de `role="alert"` (qui interrompt la voix) ; il se lit par `aria-describedby` sur le bouton.

Ma recommandation : **forme A**, texte d'avertissement permanent sous le groupe, car l'export des contacts est une action fréquente d'un agent habitué, et une fenêtre à chaque fois serait contournée sans lecture. Si Pierre veut une preuve que l'agent a vu le message, forme B.

## 4. Nom des fichiers (proposition)

Pour rester proche de celui du tableau de bord (`actions-insertion-sport.csv`, minuscules, tirets) :

- Liste des clubs : `clubs-insertion-sport.csv`
- Contacts : `contacts-clubs-insertion-sport.csv`

Variante avec la date du jour (utile quand un agent exporte plusieurs fois) : `clubs-insertion-sport-AAAA-MM-JJ.csv` et `contacts-clubs-insertion-sport-AAAA-MM-JJ.csv`, par exemple `clubs-insertion-sport-2026-11-18.csv`. Question 5, §8 : sans date ou avec date. Ni le nom de la région, ni un nom de club dans le nom du fichier (pas de caractères accentués ni d'espaces à traiter, pas de donnée du périmètre dans un nom de fichier qui circule).

## 5. États

| État | Liste des clubs | Contacts | Ce qui est affiché |
| --- | --- | --- | --- |
| Au moins 1 club affiché, contacts lisibles | actif | actif | rien de plus (+ avertissement forme A) |
| Aucun club affiché | désactivé | désactivé | « Aucun club n'est affiché : modifiez les filtres pour exporter. » |
| Contacts illisibles | actif si ≥ 1 club | désactivé | « Vos droits ne permettent pas de lire les contacts. » |
| Données pas encore chargées | désactivé | désactivé | rien de plus (le tableau est vide aussi) |
| Téléchargement lancé | actif | actif | annonce vocale (§6.3) |

Désactivation : proposer `aria-disabled="true"` et non l'attribut `disabled`.

- Raison : un bouton `disabled` sort de l'ordre de tabulation et n'est plus annoncé, l'agent au clavier ou au lecteur d'écran ne sait pas pourquoi il manque. Avec `aria-disabled="true"` le bouton reste atteignable, annoncé « indisponible », et sa phrase d'aide est lue.
- La feuille du CDN contient bien un style pour `[aria-disabled=true]` (relevé). La page du bouton dit que le script `disabled-a11y.js` bloque le clic des éléments `aria-disabled="true"`, mais **je n'ai pas vérifié que ce script est chargé dans le widget** : dev-interface doit donc aussi ignorer le clic dans son propre code (et ne produire aucun fichier). À vérifier (question 7, §8).
- Le tableau de bord utilise `disabled` pour les boutons de ses fenêtres (script.js, ex. `submit.disabled`). `aria-disabled` est donc un écart de technique, pas d'apparence ; à confirmer par Hanta.

Autres états sans écran supplémentaire :

- Pendant la fabrication du fichier : aucun état « en cours » (opération immédiate, tout est déjà en mémoire). Pas de barre de progression.
- Échec du téléchargement par le navigateur : rien n'est détectable par le widget. Aucun message prévu (le tableau de bord n'en a pas non plus).
- Après un changement de filtre : l'état des boutons et les phrases d'aide se mettent à jour à chaque affichage de la liste (`render()`).
- Fiche d'un club ouverte : la liste est masquée, donc les boutons aussi. Retour à la liste : l'état est recalculé.

## 6. Accessibilité

### 6.1 Libellés pour lecteur d'écran

- Groupe : `role="group"` (celui de la page) + `aria-label="Exporter (CSV)"`.
- Boutons : le texte visible suffit comme nom accessible (« Exporter la liste des clubs », « Exporter les contacts »). Pas d'`aria-label` différent du texte visible (WCAG 2.5.3, étiquette dans le nom).
- Phrases d'aide : `<p id="…">` reliée au bouton concerné par `aria-describedby`. Ces `id` sont à choisir par dev-interface, non inventés ici.
- Pas d'information portée par la seule couleur : un bouton désactivé a une phrase écrite qui l'explique, pas seulement un grisé.

### 6.2 Clavier

- Tab : filtres, « Réinitialiser les filtres », « Exporter la liste des clubs », « Exporter les contacts », puis tableau.
- Entrée et Espace déclenchent le bouton (comportement natif de `button`).
- Un bouton `aria-disabled` reste dans l'ordre de tabulation et ne fait rien (§5).
- Le focus reste sur le bouton après le téléchargement (rien ne se ferme, rien ne s'ouvre en forme A). En forme B, le focus revient sur « Exporter les contacts » à la fermeture de la fenêtre.
- Le focus visible existant du widget (`outline: 2px solid var(--ft--color-primary)`, style.css) s'applique ; ne rien redéfinir.

### 6.3 Annonce du résultat

Après le clic, annonce vocale polie (`role="status"`, `aria-live="polite"`), sans texte visible, dans une zone `sr-only` **qui existe déjà au chargement de la page**, comme `p#contactStatus`. Deux solutions : réutiliser cette zone, ou en ajouter une autre, avec la même forme (question 8, §8). Réutiliser `#contactStatus` pour autre chose que les contacts de la fiche est un détournement de nom ; je laisse le choix à Hanta.

Textes :

- Liste des clubs : « Fichier téléchargé : 12 clubs exportés. » (singulier : « Fichier téléchargé : 1 club exporté. »)
- Contacts : « Fichier téléchargé : 12 clubs, 31 lignes. » (singulier à adapter.) Un club sans contact compte pour une ligne vide : le nombre de lignes peut donc dépasser, ou égaler, le nombre de clubs. Alternative plus claire : « Fichier téléchargé : 31 lignes pour 12 clubs. »

Le nombre vient de la liste qui est réellement écrite, pas d'un autre calcul.

L'agent qui voit voit le fichier arriver dans son navigateur : aucune alerte de succès visible n'est ajoutée (même choix que la note contacts-fiche-club.md §7.4 et que le tableau de bord).

### 6.4 Autres points

- Contraste : couleurs du design system seulement ; la phrase d'aide utilise la couleur de texte atténuée déjà présente dans le widget (`muted-text`), à contrôler en contraste par dev-interface comme pour les autres textes gris.
- Zoom 200 % et petit écran : la barre se replie (flex wrap), les boutons passent à la ligne.
- Titre « Clubs » (`h1`) inchangé, aucun nouveau titre.

## 7. Règles à respecter pour dev-interface

1. Aucune couleur, police ni espacement nouveaux : uniquement les classes du design system citées ci-dessus et les variables CSS déjà utilisées dans style.css.
2. Nos propres classes ne reprennent aucun nom du design system (test/styles.test.js). Les noms de classes ou d'`id` nouveaux sont à choisir et à vérifier dans le dépôt, je n'en invente pas.
3. Le bouton garde exactement l'apparence de celui du tableau de bord : `btn btn-secondary` > `span.btn-content`.
4. Tout ce qui est affiché venant de Grist est échappé (escapeHtml). Aucune donnée réelle dans les tests ou la documentation : exemples fictifs en `exemple.fr`.
5. Le bandeau commun n'est pas touché (balise `data-titre="Liste des clubs sportifs"` inchangée dans l'en-tête).
6. Nouveau code dans un bloc séparé (consigne de la tâche E8-8). Les valeurs répétées (noms de fichiers, textes) vont en constantes en tête de fichier.
7. Les textes de la note sont recopiés tels quels, sans reformulation.

## 8. Questions ouvertes

Pour Hanta :

1. Deux boutons groupés (recommandé) ou un seul bouton « Exporter (CSV) » avec un menu (Dropdown : structure à relever avant le code) ?
2. Le bouton placé dans la barre de filtres, à droite de « Réinitialiser les filtres » (recommandé) ou dans la barre de titre comme au tableau de bord ?
3. Désactivation par `aria-disabled="true"` (recommandé) ou par `disabled`, comme ailleurs dans les widgets ?
4. Avertissement données personnelles : forme A (texte permanent, recommandée) ou forme B (fenêtre de confirmation) ? Et le texte proposé, ou une autre formulation ? Faut-il l'ajouter aussi à l'export de la liste des clubs (non : pas de données de personnes, selon le périmètre de l'audit) ?
5. Noms de fichiers : avec ou sans la date du jour ?
6. `aria-label="Exporter (CSV)"` sur le groupe : accepté (ajout aux consignes de la page) ?
7. Le script `disabled-a11y.js` du design system est-il chargé dans le widget ? Je ne l'ai pas vérifié.
8. Annonce du résultat : réutiliser la zone `#contactStatus` ou en ajouter une autre ?

Pour Pierre :

9. Tous les profils (National, Régional, Départemental, ANS) ont-ils accès aux deux exports (hypothèse du backlog), ou seulement les DR ? Pour l'ANS, qui ne lit pas les contacts, « Exporter les contacts » serait toujours désactivé : le masquer entièrement plutôt que le griser ?
10. L'avertissement données personnelles doit-il suivre un texte validé par un référent (DPO / protection des données) ?
11. Faut-il un nombre maximal de clubs exportables, ou « tout ce qui est affiché » suffit-il ?

## 9. Composants cités

| Composant | Page | Classes vérifiées dans la feuille CDN |
| --- | --- | --- |
| Bouton secondaire | https://designsystem.francetravail.io/components/detail/button--secondary.html | `btn`, `btn-secondary`, `btn-content` |
| Groupe de boutons | https://designsystem.francetravail.io/components/detail/button-group--secondary.html | `btn-group`, `btn-group-item` |
| Alerte avertissement | https://designsystem.francetravail.io/components/detail/alert--warning.html | `alert-warning`, `alert-content`, `alert-title` |
| Dropdown (alternative, structure non relevée) | https://designsystem.francetravail.io/components/detail/dropdown--liste.html | non vérifiées |

Composant manquant : aucun bouton à menu intégré (split button) dans le design system ; le plus proche est le Dropdown, ou le groupe de boutons retenu ici.
