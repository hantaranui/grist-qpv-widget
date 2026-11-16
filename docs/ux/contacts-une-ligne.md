# Note UX — Un contact = une seule ligne (carte Contacts de la fiche club)

Widget : clubs (src/clubs/). Écran : carte « Contacts » de la fiche d'un club.
Date : 16/11/2026. Origine : demande de Pierre (chaque contact sur UNE ligne).
Statut : **décisions de Hanta reçues (E6-1 à E6-5, docs/backlog.md), disposition finale au §7. Prête à coder par dev-interface.** Voie A, « Rôle » = Fonction, tiret si Fonction vide, troncature acceptée avec `title` à 800 px et plus seulement (E6-7 : jamais de texte coupé en dessous), colonnes alignées sans en-têtes.
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

Conclusion : avec les cinq informations (Fonction comprise), une seule ligne **ne tient dans aucune des demi-cartes** (570 px au mieux). Il fallait choisir entre trois voies (§2). **Hanta a retenu la voie A.**

## 2. Trois voies (décision de Hanta : voie A retenue)

**Voie A — Contacts sur toute la largeur, Actions dessous (RETENUE).** Décision de Hanta : Contacts prend toute la largeur sur écran étroit, Actions passe dessous. Elle remplace la décision 7 du 21/10/2026 (deux moitiés égales) et vaut accord explicite pour toucher la grille de la carte Actions.
La grille `.edit-row-lists` passe à une seule colonne à toutes les largeurs (c'est la règle qui existe déjà sous 900 px, appliquée partout). Contacts, puis Actions, chacune pleine largeur : environ 1100 px à 1200 px, 920 px à 992 px. La ligne complète tient avec de la marge. Une seule valeur CSS à changer. Le bloc Actions n'est pas « réduit » : il est aussi élargi, ses lignes ont plus de place. Contrepartie : la fiche est plus haute (les deux cartes ne sont plus côte à côte) et la décision 7 (deux moitiés égales) est remplacée.

**Voie B — écartée.** Garder les deux moitiés, élargir seulement Contacts.
Exemple : `minmax(0, 3fr) minmax(0, 2fr)`. À 1200 px, Contacts ≈ 660 px : la ligne tient en tronquant la Fonction (≈ 100 px sur 160). À 992 px, ≈ 550 px : Fonction presque disparue. Actions passe à ≈ 440 px à 1200 px, donc ses lignes se replient beaucoup plus. Bénéfice faible, coût élevé sur Actions : non recommandée.

**Voie C — écartée.** Garder les deux moitiés, sans Fonction sur la ligne.
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

Règles de la ligne (décidées) :
- **Colonnes alignées d'un contact à l'autre, sans en-têtes, et pas un vrai tableau** (décision de Hanta). Cela demande que la grille de la ligne ait des colonnes communes à tous les contacts : nom (flexible), fonction (flexible), e-mail (flexible), téléphone (largeur du contenu, jamais coupé), boutons (largeur du contenu, jamais coupés). Détail de mise en œuvre laissé à dev-interface, avec ses propres noms de classe. La structure `ul.contact-list` / `li.contact-item` reste.
- Valeur absente : on garde `missing(...)` (tiret caché aux lecteurs d'écran + « non renseigné »). **Si Fonction est vide, un tiret est affiché à l'écran** (décision de Hanta), pour que les colonnes ne se décalent pas. Cela remplace la règle de contacts-fiche-club.md §5 (« si Fonction est vide : ne rien afficher »), à ne plus appliquer pour cette carte.
- Aucune information n'est portée par la seule couleur : le texte secondaire (`muted-text`) reste lisible, les liens restent soulignés par le style du design system.
- Les boutons restent des boutons icône (`btn-ratio-square`), inchangés (contacts-fiche-club.md §7.2).

### 4.2 Moyen (de 561 px à 799 px) : deux lignes par contact

```
│  Marie Dupont · Responsable administrative                        [✎][🗑]│
│  marie.dupont@exemple.fr    01 23 45 67 89                               │
│  ──────────────────────────────────────────────────────────────────────  │
```

Ligne 1 : nom, fonction, boutons à droite. Ligne 2 : e-mail, téléphone. **Aucune troncature à ces largeurs** (décision de Hanta, E6-7, docs/backlog.md) : si un texte est long, il passe à la ligne suivante dans son bloc, il n'est jamais coupé par « … ». Seuil de 800 px : estimé (725 px de ligne + marges de 24 px de chaque côté), à constater au rendu. À mettre en constante, en tête du fichier (règle CLAUDE.md « bonnes pratiques »), avec les autres seuils.

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

**Troncature acceptée par Hanta**, avec l'attribut `title` natif. Ordre de sacrifice quand la place manque (le premier se raccourcit en premier) :
1. **Fonction** : la moins utile pour agir, la plus longue.
2. **Nom Prénom** : raccourci seulement après la Fonction.
3. **E-mail** : raccourci en dernier.
4. **Téléphone et boutons** : jamais coupés.

Mise en œuvre :
- La feuille du design system contient `.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }`. **Je l'ai lue dans la feuille du CDN, pas sur une page du site** (pas de page de documentation trouvée) : la feuille fait foi pour les noms de classe (CLAUDE.md). dev-interface vérifie la règle dans la feuille avant de l'employer. Sur un élément enfant d'un conteneur en flex, elle ne fonctionne que si l'élément a aussi `min-width: 0` (règle à écrire dans notre CSS). Aucune classe inventée.
- Info-bulle : **attribut HTML natif `title="Texte complet"`** sur chaque élément tronqué (décision de Hanta). Le design system prévoit `data-ft-tooltip` seulement sur les boutons : on ne l'emploie pas sur du texte. Limite connue : `title` ne s'affiche ni au toucher ni au clavier. C'est pourquoi la valeur complète reste lisible dans la fenêtre « Modification d'un contact » (bouton crayon), et que le lecteur d'écran lit toujours le texte entier (la coupure « … » est seulement visuelle).
- **E-mail** : tronqué en dernier seulement, parce que c'est ce que l'agent veut lire exactement ou copier. En voie A, il ne devrait presque jamais l'être. Le lien `mailto:` garde l'adresse entière, et `title` donne l'adresse complète.
- **Pas de troncature en dessous de 800 px** (décision de Hanta, E6-7) : la troncature « … » et `title` ne s'appliquent qu'à 800 px et plus. En dessous, les lignes passent sur plusieurs niveaux (§4.2 et §4.3), tout passe à la ligne (`overflow-wrap: anywhere` existe déjà), rien n'est caché ni coupé.

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

**Décision de Hanta : colonnes alignées sans en-têtes, pas un vrai tableau.** Le composant `table` n'est donc pas utilisé, pour trois raisons.
1. La page ne dit rien du comportement sur petit écran ; seul `table-responsive` existe, et il fait **défiler horizontalement** (`overflow-x: auto` dans la feuille) : 5 colonnes + boutons dans une carte de 415 px, c'est un défilement horizontal, ce que notre règle d'accessibilité mobile interdit (contacts-fiche-club.md §6.1).
2. Il remplace la liste `ul/li` actuelle par un tableau : les tests d'écran de clubs (test/clubs-contacts-ecran.test.js, **non lu pour cette note**) et le focus après modification/suppression en dépendent probablement.
3. Le tableau de bord a déjà un écart documenté avec `.table` (en-tête collant).

Le tableau (avec en-têtes « Nom / Fonction / E-mail / Téléphone / Actions ») aurait été l'alternative ; elle est écartée.

**Liste** : la feuille contient `.list-unstyled`, `.list-inline-item` et `.list-group`, mais la page https://designsystem.francetravail.io/components/detail/list--default.html **n'existe pas** (erreur 404) et je n'ai trouvé aucune page de composant « liste avec actions ». Pas de composant liste documenté : on garde la liste existante `ul.contact-list` avec nos propres classes (comme déjà signalé au §7.5 de contacts-fiche-club.md).

**Boutons** : inchangés, structure exacte de contacts-fiche-club.md §7.2 (pages https://designsystem.francetravail.io/components/detail/button--icon.html et button--tooltip.html).

**Groupe de boutons** : la feuille a une règle autonome `.table-tools-group` (grille en ligne, écart `var(--ft-spacer-xs2)` = 8 px) qui reproduirait notre `.contact-buttons`. Elle n'est documentée **que dans une cellule de tableau** : je ne la propose pas hors tableau. On garde `.contact-buttons`.

**Composant manquant** : aucun « ligne de données avec actions » hors tableau. Le plus proche : le tableau (écarté ci-dessus).

## 7. Décisions de Hanta et disposition finale à coder

Décisions (E6-1 à E6-5, docs/backlog.md) :
1. **Voie A** : Contacts prend toute la largeur sur écran étroit, Actions passe dessous.
2. **« Rôle » = Fonction** (colonne Contacts.Fonction).
3. **Tiret affiché** si Fonction est vide.
4. **Troncature acceptée** (Fonction, puis nom, puis e-mail), avec `title` natif, **à 800 px et plus seulement** (E6-7 : aucune troncature en dessous).
5. **Colonnes alignées sans en-têtes**, pas un vrai tableau.

Disposition finale :
- **Grille des cartes** : `.edit-row-lists` en **une seule colonne à toutes les largeurs** (Contacts, puis Actions, chacune en pleine largeur). La carte Actions est élargie, sans autre changement.
- **800 px et plus** : une ligne par contact, colonnes alignées dans l'ordre Nom Prénom (gras) · Fonction (texte secondaire, tiret si vide) · E-mail (lien) · Téléphone (lien, tiret si vide) · boutons Modifier, Supprimer à droite. Pas d'en-têtes. Troncature « … » + `title` sur Fonction, puis nom, puis e-mail ; téléphone et boutons jamais coupés.
- **561 à 799 px** : deux lignes (nom, fonction, boutons ; puis e-mail, téléphone), **sans troncature** (E6-7).
- **560 px et moins** : quatre lignes (nom + boutons ; fonction ; e-mail ; téléphone), sans troncature.
- Inchangés : fenêtres d'ajout, de modification et de suppression, messages, boutons icône, ordre de tabulation, focus après modification et suppression.
- Seuils 800 px et 560 px : **estimés à la main**, à constater au rendu (point 7 du §8) avant de les figer.

## 8. Règles pour dev-interface

1. Les décisions du §7 sont prises : on peut coder. La note UX passe avant la modification du HTML (CLAUDE.md).
2. Uniquement des composants et variables du design system ; nos classes ne reprennent jamais un nom du design system (test/styles.test.js). Les noms existants (`contact-item`, `contact-name`, `contact-fonction`, `contact-mail`, `contact-tel`, `contact-buttons`) restent.
3. Seuils de largeur, largeur maximale de l'e-mail et écarts : constantes regroupées en tête de style.css / script.js (CLAUDE.md, « Bonnes pratiques de code »).
4. Tout ce qui vient de Grist passe par `escapeHtml` / `escapeAttr`, **y compris la valeur de `title`**.
5. Aucune donnée de personne réelle dans le code, les tests ou la doc : noms et domaines fictifs.
6. Les boutons, leurs `aria-label`, l'ordre de tabulation (nom, e-mail, téléphone, crayon, corbeille), le focus après modification et suppression sont inchangés.
7. Vérifier au rendu : 1200, 992, 901, 800, 560 et 400 px ; avec un nom de 40 caractères, une fonction de 60, un e-mail de 45 ; aucun défilement horizontal.
8. Le tableau de bord n'est pas touché. Seul clubs.html est régénéré (Hanta lance le build et les tests).
