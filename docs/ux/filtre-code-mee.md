# Note UX — Colonne et filtre « Code MEE » (tableau de bord)

**Statut : validée par Hanta le 2026-11-20**

Branche : feature/filtre-code-mee. Widget : actions-dashboard. Décisions de départ : docs/backlog.md, section « Filtre et colonne Code MEE ».
User story : « En tant que DR, je veux voir facilement si les codes MEE ont été saisis. »

Sources : CLAUDE.md, docs/design-system-france-travail.md, pages du design system (liens au point 7), et l'existant lu : src/actions-dashboard/index.html, script.js (FILTERS, TEXT_FILTERS, renderFilters, renderRows, filteredActions), style.css (.col-*, table, .filter-text-*, .empty).
## Parcours de la DR

1. [Elle ouvre le tableau de bord] : la colonne « MEE » est visible dans la liste, entre Agence et Club.
2. [Elle repère d'un coup d'œil] les actions sans code : un tiret dans la colonne.
3. [Elle veut isoler les manquants] : elle déplie les filtres, coche « Sans code MEE » : la liste ne montre que les actions sans code.
4. [Ou elle cherche un code précis] : elle tape le code dans « Code MEE », Entrée ou clic sur la loupe.
5. [Elle trie] la colonne MEE (croissant ou décroissant) ; les actions sans code restent en fin.
6. [Réinitialiser] efface tout, comme pour les autres filtres.

Si la colonne Code_MEE n'existe pas dans le document : ni colonne, ni champ, ni case (décision du backlog). Le tableau a alors 6 colonnes comme aujourd'hui.

---

## 1. Colonne « MEE » dans la liste

| Point | Proposition |
|---|---|
| En-tête | « MEE » (court, comme « Club », « Statut »). Le menu de tri est repris tel que les autres colonnes : [summary] avec l'icône icon-chevron-up-down. |
| Nom lu par le lecteur d'écran du bouton de tri | aria-label="Trier la colonne MEE" (même formule que « Trier la colonne Agence »). |
| Code présent | Le code tel que saisi, sans retouche, dans la cellule (texte simple, échappé comme le reste). |
| Code vide (ou espaces seuls) | Un tiret « — » visible. |
| Lecteur d'écran, à la place du tiret | Le tiret est caché au lecteur (aria-hidden="true") et remplacé par un texte invisible à l'écran : « Code MEE non renseigné ». Sans cela, il lirait « tiret » ou rien. |
| Code très long | Il passe à la ligne, sans couper la colonne ni élargir le tableau (césure autorisée n'importe où : [overflow-wrap: anywhere], déjà utilisé dans style.css pour .rcpro-phrase). Le tableau est en table-layout: fixed : sans cette règle, un code sans espace déborderait sur la colonne Club. La cellule grandit en hauteur, comme les cellules Action et Financement qui ont déjà plusieurs lignes. |
| Alignement | Texte aligné en haut, comme les autres cellules (td en vertical-align: top). Aucune couleur nouvelle : le texte est celui du tableau. |
| Petit écran | Aucune colonne cachée. Le tableau garde sa largeur minimale (980 px) et défile à l'horizontale, comme aujourd'hui. La colonne « Modifier » redevient ordinaire sous 700 px (règle existante) : rien à changer. La colonne MEE défile avec les autres. |

### Largeurs proposées (7 colonnes avec Modifier)

Aujourd'hui : Agence 15 %, Club 17 %, Action 27 %, Statut 12 %, Financement 25 % (= 96 %), Modifier 100 px.

| Colonne | Avant | Proposé |
|---|---|---|
| Agence | 15 % | 13 % |
| **MEE** | — | **9 %** |
| Club | 17 % | 15 % |
| Action | 27 % | 25 % |
| Statut | 12 % | 12 % (inchangé) |
| Financement | 25 % | 22 % |
| Modifier | 100 px | 100 px (inchangé) |

Total : 13 + 9 + 15 + 25 + 12 + 22 = 96 %, comme avant. Avec la largeur minimale du tableau (980 px), MEE vaut environ 79 px de large (9 % de 980 − 100 px, soit ~ 79 px) avant les marges internes de la cellule. C'est assez pour un code court avec l'icône de tri ; un code long passe à la ligne. Cette largeur est une estimation, à ajuster à l'œil dans Grist DEV. Ne pas modifier la largeur minimale du tableau : le seuil de 1340 px de la mise en page en dépend (commentaire dans style.css).

Il faut aussi ajouter une balise [col] dans le colgroup, entre col-agency et col-club (nom de classe à choisir par dev-interface, sans reprendre un nom du design system : test/styles.test.js le vérifie).

---

## 2. Tri de la colonne MEE

Même structure que les menus des autres colonnes (summary + deux boutons avec icône). Les codes sont des nombres : on reprend les libellés du menu de la colonne Financement, qui est aussi un tri numérique, et non « A-Z / Z-A » (réservé au texte).

| Bouton | Libellé | Icône | Effet |
|---|---|---|---|
| 1 | Croissant | icon-arrow-up | 9 avant 10 |
| 2 | Décroissant | icon-arrow-down | 10 avant 9 |

Règle : les actions sans code restent **toujours en fin de liste**, dans les deux sens (décision du backlog). Rien dans le menu ne le dit : c'est le comportement des colonnes Statut pour les valeurs vides (TRI_VALEUR_VIDE_PLACE). Décision de Hanta : on ne le dit pas à l'écran.

---

## 3. Filtre « Code MEE »

**Place :** dans la zone Filtres, juste **après « Numéro Osiris »** (donc avant « Direction régionale (DR) »). Raison : c'est le même type de filtre (saisie libre appliquée sur Entrée ou loupe) ; les deux champs de saisie restent ensemble.

**Un seul bloc** (div.filter-field, comme les autres) qui contient, dans l'ordre :
1. l'étiquette « Code MEE » ;
2. le champ avec le bouton loupe côte à côte (comme Osiris) ;
3. la case à cocher « Sans code MEE » sous le champ.

| Élément | Texte |
|---|---|
| Étiquette | Code MEE |
| Texte d'aide dans le champ (placeholder) | Rechercher (même mot qu'Osiris) |
| Bouton loupe | aria-label="Lancer la recherche par Code MEE", title="Chercher" (formule d'Osiris) |
| Case | Sans code MEE |

Comportement (décisions du backlog, rappelées pour dev-interface) : code exact, sans tenir compte des majuscules ni des espaces autour ; appliqué sur Entrée ou loupe, **pas à la frappe** ; la case, elle, s'applique **dès qu'on la coche** (une case n'a pas de bouton). Combiné aux autres filtres.

---

## 4. Code tapé ET case cochée — proposition unique

**Proposition : cocher la case vide le champ et le désactive ; la décocher le réactive (champ vide).**

Raison : « un code précis » et « aucun code » sont contradictoires, donc le champ désactivé évite un résultat toujours vide sans message d'erreur à écrire.

Conséquences à connaître :
- Taper un code **n'efface pas** la case : le champ est désactivé tant que la case est cochée, donc on ne peut pas taper.
- Le filtre gardé pendant la session ne doit jamais contenir les deux ensemble ; si c'était le cas à la restauration, la case l'emporte et le champ reste vide et désactivé.
- Pour le lecteur d'écran, le champ désactivé est annoncé « grisé » (attribut disabled natif).

Autre possibilité, non retenue : afficher un message « Choisissez un code OU Sans code MEE ». Plus long à lire, plus de texte à maintenir. Décision de Hanta : la case vide et désactive le champ.

---

## 5. Aucune action ne correspond

On **ne crée pas de nouveau message**. On garde l'existant, en bas du tableau : « Aucune action ne correspond aux filtres. » (div id="empty"). Il est valable pour un code introuvable comme pour « Sans code MEE » quand tous les codes sont saisis : l'information est la même pour l'utilisateur. Message sobre, sans ton d'erreur, comme les autres.

---

## 6. Accessibilité

- **Étiquettes reliées** : label for="filter-mee" pour le champ ; label for="filter-mee-vide" pour la case (la case a son propre libellé, pas celui du champ). Les id suivent le modèle existant [filter-osiris].
- **La loupe** n'a pas de texte visible : elle porte un aria-label ; l'image est en aria-hidden et focusable="false" (comme Osiris).
- **Ordre au clavier** : … Numéro Osiris (champ) → loupe → case « Sans code MEE » → Direction régionale → … La case suit directement la loupe parce qu'elle est après dans le HTML ; aucun tabindex.
- **Tri** : l'en-tête MEE est un [details/summary] comme les autres, utilisable au clavier (Entrée, Espace) ; mêmes comportements.
- **Contraste, couleur seule** : aucune couleur ajoutée ; l'absence de code est dite par le tiret ET par le texte invisible, pas par la couleur.
- **Annonce du résultat du filtre** : **le tableau de bord ne le fait pas aujourd'hui** (aucune zone [role="status"] ne signale le nombre de résultats après un filtre ; seules les alertes d'erreur et les fenêtres Convention et RC Pro en ont une). Je ne propose donc rien de nouveau, pour ne pas ajouter une fonction non demandée. C'est un écart d'accessibilité existant : voir « Décisions de Hanta ».

---

## 7. HTML exact du design system

Les trois premiers blocs sont recopiés **tels que le site les affiche** (page « Copier le code »). Les id et noms sont des exemples générés par le site : à remplacer par ceux de la dernière colonne. L'astérisque obligatoire (span.required) et l'attribut required ne servent pas ici : les filtres sont facultatifs, donc ils sont retirés.

### 7.1 Étiquette + champ de saisie
Lien : https://designsystem.francetravail.io/components/detail/input--default.html

Structure du site :
```html
<label class="form-label" for="form-input_156380278">
  Libellé de l'élément<span class="required">&nbsp;*</span></label>
<input class="form-control" id="form-input_156380278" name="form-input_156380278" required type="text">
```

Adaptation pour « Code MEE » (modèle exact du filtre Osiris dans renderFilters, avec le même type « search ») :
```html
<label class="form-label" for="filter-mee">Code MEE</label>
<input class="form-control" type="search" id="filter-mee" name="filter-mee" placeholder="Rechercher">
```
Écart avec la page du site : type="search" au lieu de type="text", comme le filtre Osiris existant (croix d'effacement du navigateur). La classe « filter-text-input » d'Osiris est la classe du widget (pas du design system).

### 7.2 Case à cocher
Lien : https://designsystem.francetravail.io/components/detail/checkbox--default.html

Structure du site :
```html
<div class="form-check with-checked-bg">
  <input class="form-check-input" id="form-checkbox_240063610" name="form-checkbox_240063610" required type="checkbox" value="checkbox-value_21919029">
  <label class="form-check-label" for="form-checkbox_240063610">
    Libellé de l'élement<span class="required">&nbsp;*</span></label>
</div>
```

Adaptation pour « Sans code MEE » (même structure que les cases déjà utilisées dans la fiche, par exemple « Ouvert au financement ») :
```html
<div class="form-check with-checked-bg">
  <input class="form-check-input" type="checkbox" id="filter-mee-vide" name="filter-mee-vide">
  <label class="form-check-label" for="filter-mee-vide">Sans code MEE</label>
</div>
```

### 7.3 Bouton loupe
Lien : https://designsystem.francetravail.io/components/detail/button--primary.html

Structure du site :
```html
<button class="btn btn-primary" type="button">
  <span class="btn-content">Je suis un bouton</span>
</button>
```

Bouton du filtre Osiris à reprendre (code existant de renderFilters : le contenu est une image, pas un texte, donc pas de span.btn-content) :
```html
<button class="btn btn-primary filter-text-submit" type="button" aria-label="Lancer la recherche par Code MEE" title="Chercher">
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>
</button>
```
Enveloppe (existante) : `<span class="filter-text-control">` autour du champ et du bouton.

### 7.4 Icône de la loupe
**La loupe d'Osiris n'a pas de nom d'icône du design system** : c'est une petite image dessinée en SVG dans le code (un cercle et un trait), pas une classe « icon-… ». Je ne peux donc pas vous donner un nom à vérifier pour celle-là.

Ce que j'ai vérifié par ailleurs : la feuille du CDN contient une classe **icon-search** (ainsi que icon-search-full, icon-search-file, icon-search-user). Je n'ai pas trouvé de page dédiée pour elle sur le site (bibliothèque : https://designsystem.francetravail.io/docs/bibliotheque/icones.html — non consultée, à vérifier par vous). Proposition : **reprendre le même SVG qu'Osiris** pour que les deux loupes soient identiques ; passer à `<span class="icon icon-search" aria-hidden="true"></span>` serait un choix de dev, à faire alors sur les deux filtres ; décision de Hanta : même SVG qu'Osiris.

---

## Règles pour dev-interface (résumé)

1. Rien n'est à inventer : tout vient des blocs du point 7 et de l'existant.
2. Si Code_MEE est absent du document : ni colonne, ni col, ni champ, ni case.
3. Cellule : code échappé, sinon tiret aria-hidden + texte invisible « Code MEE non renseigné » (classe sr-only du design system : elle existe dans la feuille https://cdn.francetravail.fr/studio/design-system/css/styles.css, règle « .sr-only » avec position absolue, 1 px de large et de haut, clip et overflow cachés ; vérifiée le 2026-11-20. Elle est déjà utilisée dans src/actions-dashboard/script.js).
4. Case cochée : champ vidé et désactivé.
5. Mêmes libellés partout : « MEE » (en-tête), « Code MEE » (champ), « Sans code MEE » (case).

---

## Décisions de Hanta

- **Code tapé + case cochée** : la case vide et désactive le champ ; la décocher le réactive (champ vide).
- **Largeur** : MEE à 9 %, à ajuster à l'œil dans Grist DEV. Un code MEE compte au plus 6 chiffres. On ne modifie pas la largeur minimale du tableau (980 px).
- **Annonce du résultat aux lecteurs d'écran** : pas dans cette fonctionnalité (écart existant, pour tous les filtres, à traiter plus tard).
- **Tri** : « sans code en fin de liste » reste implicite, rien à l'écran.
- **Loupe** : même SVG que le filtre Osiris.
- **Position** : après Numéro Osiris.
- **Skill UI/UX** : aucun.
