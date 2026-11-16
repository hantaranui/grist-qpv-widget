# Note UX — Un contact = une seule ligne (carte Contacts de la fiche club)

Widget : clubs (src/clubs/). Écran : carte « Contacts » de la fiche d'un club.
Date : 16/11/2026. Origine : demande de Pierre (chaque contact sur UNE ligne).
Statut : **proposition, en attente de réponse de Hanta** (questions au §7). Rien n'est à coder avant.
Sources lues : CLAUDE.md, docs/design-system-france-travail.md, docs/ux/contacts-fiche-club.md, src/clubs/style.css (lignes 295-385, 505-545), src/clubs/script.js (`renderContacts`, lignes 722-744), feuille du design system (https://cdn.francetravail.fr/studio/design-system/css/styles.css), page https://designsystem.francetravail.io/components/detail/table--default.html (et table--sort.html).

## 0. Ce qui existe aujourd'hui

`renderContacts` produit, pour chaque contact, un `li.contact-item` en `display: flex; flex-wrap: wrap` avec dans l'ordre : `.contact-name`, `.contact-fonction` (**`width: 100%`** : elle force une ligne à elle seule, décision de Hanta du 21/10/2026, §5 de contacts-fiche-club.md), `a.contact-mail`, `a.contact-tel`, `.contact-buttons` (poussé à droite par `margin-left: auto`).
Sous 560 px : `flex-direction: column`, donc **chaque élément sur sa ligne** (nom, fonction, e-mail, téléphone, boutons = 5 lignes). C'est ce que Pierre voit.

## 1. Constat important avant de dessiner : une ligne ne tient pas dans une demi-carte

Les deux cartes sont deux moitiés égales au-dessus de 900 px (décision 7 du 21/10/2026). Largeur d'une carte (calcul à la main, **non mesuré**, déjà donné dans contacts-fiche-club.md §6.1 bis) : environ 570 px à 1200 px de large, 460 px à 992 px, 415 px à 901 px.

Largeur qu'il faut pour afficher une ligne complète sans couper (estimation, à constater au rendu) :

| Élément | Largeur estimée |
|---|---|
| Nom Prénom (gras) | 110 px |
| Fonction | 160 px |
| E-mail | 190 px |
| Téléphone | 110 px |
| 2 boutons icône + écart de 8 px | 90 px |
| 4 écarts entre éléments (16 px) | 64 px |
| **Total** | **environ 725 px** |

Conclusion : avec les cinq informations (Fonction comprise), une seule ligne **ne tient dans aucune des demi-cartes** (570 px au mieux). Il faut donc choisir entre trois voies (§2). Je recommande la voie A.

## 2. Trois voies (choix à faire par Hanta, §7 question 1)

**Voie A — Contacts sur toute la largeur, Actions dessous (recommandée).**
La grille `.edit-row-lists` passe à une seule colonne à toutes les largeurs (c'est la règle qui existe déjà sous 900 px, appliquée partout). Contacts, puis Actions, chacune pleine largeur : environ 1100 px à 1200 px, 920 px à 992 px. La ligne complète tient avec de la marge. Une seule valeur CSS à changer. Le bloc Actions n'est pas « réduit » : il est aussi élargi, ses lignes ont plus de place. Contrepartie : la fiche est plus haute (les deux cartes ne sont plus côte à côte) et la décision 7 (deux moitiés égales) est remplacée.

**Voie B — Garder les deux moitiés, élargir seulement Contacts.**
Exemple : `minmax(0, 3fr) minmax(0, 2fr)`. À 1200 px, Contacts ≈ 660 px : la ligne tient en tronquant la Fonction (≈ 100 px sur 160). À 992 px, ≈ 550 px : Fonction presque disparue. Actions passe à ≈ 440 px à 1200 px, donc ses lignes se replient beaucoup plus. Bénéfice faible, coût élevé sur Actions : non recommandée.

**Voie C — Garder les deux moitiés, sans Fonction sur la ligne.**
Nom · e-mail · téléphone · boutons ≈ 565 px : tient à peine à 1200 px, pas en dessous. Cela retire la Fonction de la carte, ce que Hanta a refusé le 21/10/2026 (§5). Non recommandée.

## 3. Parcours (rappel court)

1. L'agent ouvre la fiche d'un club (bouton Voir).
2. Il lit la carte Contacts : chaque contact est repérable d'un coup d'œil, une ligne par personne.
3. Il écrit à un contact (clic sur l'e-mail), l'appelle (clic sur le téléphone), le modifie (crayon) ou le supprime (corbeille, avec confirmation, inchangée).

Rien ne change dans les fenêtres d'ajout, de modification et de suppression, ni dans les messages (contacts-fiche-club.md §3).

## 4. Maquettes en texte (voie A)

### 4.1 Large (fenêtre de 800 px et plus) : une ligne par contact

Ordre, de gauche à droite : **1. Nom (Prénom Nom, gras) · 2. Fonction (texte secondaire) · 3. E-mail (lien) · 4. Téléphone (lien) · 5. Boutons Modifier, Supprimer (collés à droite)**.
Même ordre que celui des champs du formulaire (Nom, Prénom, E-mail, Téléphone, Fonction), avec la Fonction remontée contre le nom parce qu'elle qualifie la personne (décision du 21/10/2026 : Fonction sous le nom ; ici, à côté du nom).

```
┌─ CONTACTS ─────────────────────────────────────────────────────────────────┐
│  [ + Ajouter un contact ]                                                   │
│                                                                             │
│  Marie Dupont  Responsable admin…  marie.dupont@exemple.fr  01 23 45 67 89 [✎][🗑]│
│  ─────────────────────────────────────────────────────────────────────────  │
│  Karim Martin  —                   k.martin@exemple.fr      —              [✎][🗑]│
└─────────────────────────────────────────────────────────────────────────────┘
```

Règles de la ligne :
- Les éléments sont **alignés en colonnes d'un contact à l'autre** seulement si la grille de la ligne a des colonnes fixes ; sinon chaque ligne a ses propres largeurs et l'œil ne descend pas droit. Je recommande des colonnes alignées : nom (flexible), fonction (flexible), e-mail (flexible), téléphone (largeur du contenu, jamais coupé), boutons (largeur du contenu, jamais coupés). Détail de mise en œuvre laissé à dev-interface, avec ses propres noms de classe.
- Valeur absente : on garde `missing(...)` (tiret caché aux lecteurs d'écran + « non renseigné »). Pour la Fonction vide, le tiret **est** affiché à l'écran en voie A (sinon les colonnes se décalent). C'est un écart à contacts-fiche-club.md §5 (« si Fonction est vide : ne rien afficher ») : à valider (§7 question 3).
- Aucune information n'est portée par la seule couleur : le texte secondaire (`muted-text`) reste lisible, les liens restent soulignés par le style du design system.
- Les boutons restent des boutons icône (`btn-ratio-square`), inchangés (contacts-fiche-club.md §7.2).

### 4.2 Moyen (de 561 px à 799 px) : deux lignes par contact

```
│  Marie Dupont · Responsable administrative                        [✎][🗑]│
│  marie.dupont@exemple.fr    01 23 45 67 89                               │
│  ──────────────────────────────────────────────────────────────────────  │
```

Ligne 1 : nom, fonction (tronquée si besoin), boutons à droite. Ligne 2 : e-mail, téléphone. Seuil de 800 px : estimé (725 px de ligne + marges de 24 px de chaque côté), à constater au rendu. À mettre en constante, en tête du fichier (règle CLAUDE.md « bonnes pratiques »), avec les autres seuils.

### 4.3 Mobile (560 px et moins) : quatre lignes au lieu de cinq

```
┌─ CONTACTS ─────────────────────────┐
│  [ + Ajouter un contact ]           │
│                                     │
│  Marie Dupont              [✎] [🗑] │
│  Responsable administrative         │
│  marie.dupont@exemple.fr            │
│  01 23 45 67 89                     │
│  ─────────────────────────────────  │
└─────────────────────────────────────┘
```

À 400 px, **une seule ligne est impossible** sans rendre le texte illisible (il resterait environ 100 px pour le nom, l'e-mail et le téléphone ensemble). Le gain, c'est de remonter les boutons sur la ligne du nom : on passe de 5 lignes (nom, fonction, e-mail, téléphone, boutons) à 4 (le téléphone peut aussi monter à côté de l'e-mail s'il tient : `flex-wrap` le décide). Les boutons ne sont plus seuls sur leur ligne. Cible tactile des boutons inchangée (contacts-fiche-club.md §6.2).

### 4.4 Cas particuliers

- Liste vide, lecture refusée : inchangés (contacts-fiche-club.md §2.1).
- Aucun défilement horizontal de la fiche, à aucune largeur.
- Contact sans nom : « Contact sans nom », comme aujourd'hui.

## 5. Troncature (« … » et info-bulle)

Oui, c'est possible et utile, avec des limites. Ordre de sacrifice quand la place manque (le premier se raccourcit en premier) :
1. **Fonction** : la moins utile pour agir, la plus longue.
2. **Nom Prénom** : raccourci seulement après la Fonction.
3. **E-mail** : raccourci en dernier recours (voir ci-dessous).
4. **Téléphone et boutons** : jamais coupés.

Mise en œuvre :
- La feuille du design system contient `.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`. **Je l'ai lue dans la feuille du CDN, pas sur une page du site** (je n'ai pas trouvé de page de documentation pour cette classe) : la feuille fait foi pour les noms de classe (CLAUDE.md), mais à confirmer par Hanta (§7 question 4). Sur un élément enfant d'un conteneur en flex, elle ne fonctionne que si l'élément a aussi `min-width: 0` (règle à écrire dans notre CSS). Aucune classe inventée.
- Info-bulle : le design system prévoit `data-ft-tooltip` **seulement sur les boutons** (pages « Avec une infobulle » et « Icône seule », lues le 22/10/2026) ; je n'ai pas vu qu'il marche sur du texte. Je propose donc l'attribut HTML natif `title="Texte complet"` sur l'élément tronqué, qui n'est pas un composant du design system. Limite connue : `title` ne s'affiche ni au toucher ni au clavier. C'est pourquoi la valeur complète reste lisible dans la fenêtre « Modification d'un contact » (bouton crayon), et que le lecteur d'écran lit toujours le texte entier (la coupure « … » est seulement visuelle).
- **E-mail** : le tronquer est le plus risqué, parce que c'est ce que l'agent veut lire exactement ou copier. Avec la voie A, il n'y a normalement pas besoin de le tronquer ; on ne le tronque qu'au-delà d'une largeur maximale (par exemple 40 caractères, à décider), jamais avant. Le lien `mailto:` garde l'adresse entière.
- Pas de troncature en dessous de 560 px : à cette largeur, tout passe à la ligne (`overflow-wrap: anywhere` existe déjà), rien n'est caché.

## 6. Composants du design system (vérifié le 16/11/2026)

**Tableau (`table`)** : page https://designsystem.francetravail.io/components/detail/table--default.html (« Table »), variantes : exemple de base, complet, avec collapse, titre masqué, tri de colonne, en chargement, zébré. Il convient en principe à « une ligne de données avec des actions » (colonne « Actions » masquée par `sr-only`, boutons dans `table-tools-group`). Structure exacte de la page :

```html
<div class="table-responsive">
  <table class="table">
    <caption>Titre du tableau</caption>
    <thead>
      <tr>
        <th scope="col">Colonne 1</th>
        <th scope="col">Colonne 2</th>
        <th scope="col">Colonne 3</th>
        <th scope="col"><span class="sr-only">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Titre de la ligne 1</th>
        <td>Contenu</td>
        <td>Contenu</td>
        <td>
          <div class="table-tools-group">
            Boutons d'action
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

Ma recommandation : **ne pas l'utiliser ici**, pour trois raisons.
1. La page ne dit rien du comportement sur petit écran ; seul `table-responsive` existe, et il fait **défiler horizontalement** (`overflow-x: auto` dans la feuille) : 5 colonnes + boutons dans une carte de 415 px, c'est un défilement horizontal, ce que notre règle d'accessibilité mobile interdit (contacts-fiche-club.md §6.1).
2. Il remplace la liste `ul/li` actuelle par un tableau : les tests d'écran de clubs (test/clubs-contacts-ecran.test.js, **non lu pour cette note**) et le focus après modification/suppression en dépendent probablement.
3. Le tableau de bord a déjà un écart documenté avec `.table` (en-tête collant).

Le tableau reste la bonne réponse si Hanta préfère de vraies colonnes alignées avec en-têtes (« Nom / Fonction / E-mail / Téléphone / Actions ») : à demander (§7 question 5). Dans ce cas, la voie A est indispensable.

**Liste** : la feuille contient `.list-unstyled`, `.list-inline-item` et `.list-group`, mais la page https://designsystem.francetravail.io/components/detail/list--default.html **n'existe pas** (erreur 404) et je n'ai trouvé aucune page de composant « liste avec actions ». Pas de composant liste documenté : on garde la liste existante `ul.contact-list` avec nos propres classes (comme déjà signalé au §7.5 de contacts-fiche-club.md).

**Boutons** : inchangés, structure exacte de contacts-fiche-club.md §7.2 (pages https://designsystem.francetravail.io/components/detail/button--icon.html et button--tooltip.html).

**Groupe de boutons** : la feuille a une règle autonome `.table-tools-group` (grille en ligne, écart `var(--ft-spacer-xs2)` = 8 px) qui reproduirait notre `.contact-buttons`. Elle n'est documentée **que dans une cellule de tableau** : je ne la propose pas hors tableau. On garde `.contact-buttons`.

**Composant manquant** : aucun « ligne de données avec actions » hors tableau. Le plus proche : le tableau (écarté ci-dessus).

## 7. Questions ouvertes (réponse de Hanta nécessaire)

1. **Voie A, B ou C ?** (§2). Ma recommandation : A. Elle remplace la décision 7 du 21/10/2026 (deux moitiés égales) et agrandit aussi le bloc Actions. Selon CLAUDE.md, « toute autre modification de clubs demande l'accord explicite de Hanta » : changer la grille touche la carte Actions, donc il faut son accord écrit. Pierre a-t-il lui-même proposé « réduire Actions » : veut-il que les deux cartes restent côte à côte ?
2. **« Rôle » = la colonne Fonction ?** Je l'ai compris ainsi (Contacts n'a pas d'autre colonne de rôle dans CLAUDE.md).
3. **Fonction vide : tiret affiché** pour garder les colonnes alignées (écart à la décision du 21/10/2026) ou rien ?
4. **Troncature** : OK pour la classe `text-truncate` de la feuille du CDN et pour l'attribut natif `title` comme info-bulle ? Et pour l'e-mail : jamais tronqué en dessous d'une largeur maximale, ou jamais tronqué du tout ?
5. **Colonnes alignées sans en-têtes** (ma proposition) ou **vrai tableau avec en-têtes** (composant `table`) ?
6. **Seuils** (800 px et 560 px) : estimés à la main. À mesurer au rendu avec de vrais contacts (noms longs, e-mails de 30 caractères) avant de les figer.

## 8. Règles pour dev-interface (une fois la voie choisie)

1. Ne rien coder avant la réponse aux questions 1 à 5. La note UX passe avant la modification du HTML (CLAUDE.md).
2. Uniquement des composants et variables du design system ; nos classes ne reprennent jamais un nom du design system (test/styles.test.js). Les noms existants (`contact-item`, `contact-name`, `contact-fonction`, `contact-mail`, `contact-tel`, `contact-buttons`) restent.
3. Seuils de largeur, largeur maximale de l'e-mail et écarts : constantes regroupées en tête de style.css / script.js (CLAUDE.md, « Bonnes pratiques de code »).
4. Tout ce qui vient de Grist passe par `escapeHtml` / `escapeAttr`, **y compris la valeur de `title`**.
5. Aucune donnée de personne réelle dans le code, les tests ou la doc : noms et domaines fictifs.
6. Les boutons, leurs `aria-label`, l'ordre de tabulation (nom, e-mail, téléphone, crayon, corbeille), le focus après modification et suppression sont inchangés.
7. Vérifier au rendu : 1200, 992, 901, 800, 560 et 400 px ; avec un nom de 40 caractères, une fonction de 60, un e-mail de 45 ; aucun défilement horizontal.
8. Le tableau de bord n'est pas touché. Seul clubs.html est régénéré (Hanta lance le build et les tests).
