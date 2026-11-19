# Note UX — Un contact = une seule ligne (carte Contacts de la fiche club)

Widget : clubs (src/clubs/). Écran : carte « Contacts » de la fiche d'un club.
Date : 16/11/2026. Origine : demande de Pierre (chaque contact sur UNE ligne).
Statut : **REVISION E6-10 du 16/11/2026 en tête de note (structure Nom + Fonction empilés, 1fr/1fr, seuils 560/360 px) : elle remplace les valeurs 3fr/2fr, 680 px et 560 px citées plus bas, en attente de confirmation de Hanta (R6).** Historique : seuil de ligne unique baissé de 800 à 680 px de carte le 16/11/2026 (E6-9, décision de Hanta, proposé par le designer-ux ; Fonction tronquée à environ 100 px au seuil). Avant cela : corrigée le 16/11/2026 (E6-8, docs/backlog.md) : E6-1 (« Voie A ») est ANNULÉE. Voie B retenue : les deux colonnes restent côte à côte, Contacts à 3fr et Actions à 2fr, empilées seulement sous 900 px. Disposition finale au §7. Prête à coder par dev-interface.** « Rôle » = Fonction, tiret si Fonction vide, troncature acceptée avec `title` quand la CARTE Contacts est assez large (E6-7 : jamais de texte coupé en dessous), colonnes alignées sans en-têtes. Les seuils d'une ligne de contact réagissent à la largeur de la carte (container queries), pas à celle de l'écran.
Sources lues : CLAUDE.md, docs/design-system-france-travail.md, docs/ux/contacts-fiche-club.md, src/clubs/style.css (lignes 295-385, 505-545), src/clubs/script.js (`renderContacts`, lignes 722-744), feuille du design system (https://cdn.francetravail.fr/studio/design-system/css/styles.css), page https://designsystem.francetravail.io/components/detail/table--default.html (et table--sort.html).

## REVISION E6-10 (16/11/2026) : ce bloc PASSE AVANT les §1 à §8 ci-dessous

Origine : Hanta, après essai visuel (capture) : avec 3fr/2fr, le bloc Actions est trop étroit (« 100% financé » passe à la ligne). Elle propose une ligne de contact plus étroite. **Toutes les largeurs de ce bloc sont des estimations faites à la main, NON mesurées** : à constater au rendu par Hanta avant de les figer. Quand un chiffre des §1 à §8 (3fr/2fr, 680 px, 560 px, « Fonction à côté du nom », 4 lignes) contredit ce bloc, c'est ce bloc qui gagne. Les autres décisions (E6-2 à E6-7 : Fonction = « Rôle », colonnes alignées sans en-têtes, pas de vrai tableau, aucune troncature sous le seuil de ligne unique, `title` natif) restent. Rappel : E6-9 (680 px) est remplacée par le seuil ci-dessous, parce que la ligne devient plus étroite ; c'est une conséquence de la structure demandée par Hanta, à lui faire confirmer (question ouverte 1).

### R1. Nouvelle disposition d'un contact

Deux « niveaux » empilés dans un seul bloc d'identité, puis le reste centré verticalement sur ce bloc :

```
┌─ CONTACTS (carte de 560 px et plus) ────────────────────────────────────┐
│  [ + Ajouter un contact ]                                                │
│                                                                          │
│  Marie Dupont            marie.dupont@exemple.fr  01 23 45 67 89  [✎][🗑] │
│  Responsable admin…                                                      │
│  ──────────────────────────────────────────────────────────────────────  │
│  Karim Martin            k.martin@exemple.fr      —               [✎][🗑] │
│  —                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Bloc d'identité** (à gauche) : niveau 1 = Prénom Nom en gras (`.contact-name`), niveau 2 = Fonction en texte secondaire et plus petit (`.contact-fonction`), directement dessous, sans espace perdu entre les deux. Les deux niveaux sont enveloppés dans UN élément commun (nouveau nom de classe à nous, par exemple `contact-identite`, jamais un nom du design system ; à vérifier par test/styles.test.js). C'est ce bloc qui est la « colonne » alignée d'un contact à l'autre.
- Puis, de gauche à droite : E-mail (lien), Téléphone (lien), boutons Modifier et Supprimer collés à droite.
- **Alignement vertical : `align-items: center` sur `li.contact-item`** (et sur ses regroupements de lignes aux largeurs plus étroites), PAS `baseline`. Raison : avec `baseline`, e-mail, téléphone et boutons s'alignent sur la première ligne du bloc (le nom), et les boutons, plus hauts que le texte, semblent décalés (bug signalé par dev-interface / Hanta, E6-10). Centrés, e-mail, téléphone et boutons se placent au milieu de la hauteur Nom + Fonction. Les boutons gardent leur taille (`btn-ratio-square`) et ne se déforment pas : `flex-shrink: 0` (ou colonne en largeur du contenu).
- Même ordre de tabulation qu'avant : nom, e-mail, téléphone, crayon, corbeille. Le bloc d'identité n'est pas un lien et ne prend pas le focus.
- Rien ne change dans le contenu lu par un lecteur d'écran : nom, puis fonction, puis e-mail, téléphone, boutons (leurs `aria-label` inchangés).

### R2. Fonction vide : le tiret reste, en dessous du nom

Décision proposée : **on affiche toujours le tiret `missing(...)` au niveau 2**, comme décidé en E6-3. Raisons : (1) la hauteur de chaque contact est la même, donc les lignes se lisent de façon régulière et rien ne « saute » quand on modifie une Fonction ; (2) e-mail, téléphone et boutons restent centrés au même endroit d'un contact à l'autre ; (3) c'est la règle déjà validée par Hanta, on ne la défait pas. Le tiret garde sa version cachée pour les lecteurs d'écran (« non renseigné »). Alternative écartée : nom seul centré sur une hauteur plus basse, contacts de hauteurs inégales, bloc qui change de forme dès qu'on renseigne la Fonction.

### R3. Proportion Contacts / Actions : retour à 1fr / 1fr

Estimation de la ligne complète avec le bloc d'identité empilé (largeur du bloc = la plus large des deux lignes, plafonnée à environ 150 px, la Fonction étant tronquée au-delà) :

| Élément | Largeur estimée |
|---|---|
| Bloc Nom Prénom + Fonction | 150 px (au lieu de 110 + 160 = 270) |
| E-mail | 190 px |
| Téléphone | 110 px |
| 2 boutons icône + écart de 8 px | 90 px |
| 3 écarts entre éléments (16 px) | 48 px |
| **Total** | **environ 590 px** (au lieu de 725) |

Gain : environ 135 px par rapport à avant. Proposition : **`grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`**, c'est-à-dire la décision 7 du 21/10/2026 (deux moitiés égales), seuil d'empilement de 900 px inchangé. Largeur de chaque carte (déjà donnée au §1, non mesurée) : environ 570 px à 1200 px d'écran, 460 px à 992 px, 415 px à 901 px. Actions retrouve donc ses 570 px d'avant E6, où « 100% financé » tenait. Contacts à 570 px : la ligne (590 px) tient en réduisant le bloc d'identité vers 130 px, la Fonction étant alors tronquée par « … » (voir R5).
- Les deux nombres restent des constantes en tête de style.css (comme demandé au §2). Si, au rendu, Hanta trouve la ligne trop serrée à 1200 px, ajuster en `minmax(0, 6fr) minmax(0, 5fr)` (Contacts ≈ 620 px, Actions ≈ 520 px) : intermédiaire sans retour à 3fr/2fr. Je ne propose pas 6fr/5fr d'emblée, car la plainte de Hanta porte sur Actions.

### R4. Seuils des container queries (largeur de la CARTE Contacts)

| Largeur de la carte | Disposition | Ancien seuil |
|---|---|---|
| **560 px et plus** | une ligne par contact (R1), troncature « … » + `title` | 680 px |
| **de 361 à 559 px** | deux lignes : ligne 1 = bloc nom + fonction (à gauche) et boutons (à droite) ; ligne 2 = e-mail et téléphone ; aucune troncature | 561 à 679 px |
| **360 px et moins** | trois lignes : bloc nom + fonction avec les boutons à droite ; e-mail ; téléphone ; aucune troncature | 560 px et moins (4 lignes) |

Estimations : une ligne = 590 px de contenu, mais le bloc d'identité peut descendre à 130 px, soit 570 px ; marge intérieure de la carte déjà retranchée dans la largeur du conteneur (à constater). On retient 560 px, juste sous le point où le bloc d'identité devrait tomber sous 120 px. Deux lignes : ligne 1 environ 150 + 16 + 90 = 256 px, ligne 2 environ 190 + 16 + 110 = 316 px, donc 360 px laisse une marge pour un nom plus long (le texte passe à la ligne, sans « … »). Le niveau « 3 lignes » gagne une ligne sur les quatre d'avant parce que la Fonction est désormais sous le nom. Conséquence : à 1200 px d'écran la carte (570 px) est une ligne, à 992 px (460 px) et 901 px (415 px) deux lignes ; **sous 900 px d'écran**, les cartes s'empilent et chacune prend presque toute la largeur : une ligne apparaît dès environ 640 px d'écran. À 400 px d'écran, la carte (environ 340 px) est en trois lignes. Mêmes règles qu'avant : `@container` (pas `@media`), constantes en tête de style.css, règles du `li` dans le bloc `@container`.

### R5. Troncature : l'ordre reste pertinent, avec une précision

L'ordre (1. Fonction, 2. Nom Prénom, 3. E-mail ; téléphone et boutons jamais coupés) **reste valable**, et il est même plus simple : Fonction et nom sont dans le même bloc, donc le bloc se rétrécit d'abord en coupant la Fonction (niveau 2, `text-truncate`), puis, seulement si la Fonction est déjà réduite à son minimum (environ 80 px) et que la place manque encore, le nom (niveau 1). Précisions pour dev-interface :
- Chaque niveau tronque sur sa propre ligne (une ligne par niveau, `text-truncate` + `min-width: 0` sur le bloc et sur chaque niveau) ; `title` natif sur le niveau tronqué avec le texte complet, passé par `escapeAttr`.
- Largeur du bloc : flexible (`flex: 1 1 auto`), plafond d'environ 150 px, plancher d'environ 120 px, constantes en tête de fichier. Le plafond évite qu'une fonction très longue repousse l'e-mail.
- L'e-mail reste tronqué en dernier, avec son `title`.
- Sous 560 px de carte : aucune troncature (E6-7), le niveau 2 passe à la ligne dans le bloc, rien n'est coupé.

### R6. Questions ouvertes (réponse de Hanta souhaitée)

1. Le seuil de ligne unique passe de 680 à 560 px et le niveau étroit de 4 à 3 lignes : confirmer (c'est une conséquence de la nouvelle structure, pas déjà décidée par E6-9).
2. À 1200 px d'écran, la Fonction sera tronquée vers 130 px : acceptable, ou préférer 6fr/5fr (R3) ?
3. Les mesures réelles de la carte Contacts à 1400, 1200, 992, 901 et 400 px seront données par Hanta pour figer ces seuils.
4. Le HTML de `renderContacts` change (un élément enveloppe nom et fonction) : les tests d'écran de clubs (test/clubs-contacts-ecran.test.js, **non lu**) peuvent en dépendre ; à vérifier par dev-interface.

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

Conclusion : avec les cinq informations (Fonction comprise), une seule ligne **ne tient dans aucune des demi-cartes** (570 px au mieux). Il fallait choisir entre trois voies (§2). **Hanta a d'abord retenu la voie A (E6-1), puis l'a annulée (E6-8) : la voie B est la bonne.**

## 2. Trois voies (décision corrigée de Hanta : voie B retenue)

**Voie B — Deux colonnes côte à côte, Contacts plus large (RETENUE, E6-8).** C'était la demande de Pierre : garder Contacts et Actions côte à côte sur grand écran, comme avant E6, avec des proportions ajustées.
- Grille `.edit-row-lists` : `grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)` (Contacts 3 parts, Actions 2 parts). Les valeurs 3 et 2 sont à mettre en constantes en tête de style.css.
- **Empilement inchangé** : sous le seuil existant de 900 px, la grille passe à une colonne (règle qui existe déjà). **Aucun nouveau comportement** du type « Contacts pleine largeur puis Actions dessous » à d'autres largeurs.
- Largeur de la carte Contacts (calcul à la main, **non mesuré**) : environ 660 px à 1200 px d'écran, 550 px à 992 px, 500 px à 901 px. Actions : environ 440 px à 1200 px (≈ 570 avant) ; ses lignes se replient davantage, à constater au rendu.
- Conséquence : à 1200 px, la ligne complète (≈ 725 px) ne tient pas sans réduire la Fonction (≈ 100 px sur 160, sacrifiée en premier, §5). Les dispositions d'un contact dépendent donc de la largeur de la CARTE (§4, §8 point 9).

**Voie A — ANNULÉE (E6-1, annulée par E6-8).** Contacts sur toute la largeur, Actions dessous, à toutes les largeurs. Ce n'était pas la bonne interprétation de la demande de Pierre. Ne plus l'appliquer ; la décision 7 du 21/10/2026 (deux moitiés égales) est remplacée par 3fr / 2fr, pas par une colonne unique.

**Voie C — écartée.** Garder les deux moitiés, sans Fonction sur la ligne.
Nom · e-mail · téléphone · boutons ≈ 565 px : tient à peine à 1200 px, pas en dessous. Cela retire la Fonction de la carte, ce que Hanta a refusé le 21/10/2026 (§5). Non recommandée.

## 3. Parcours (rappel court)

1. L'agent ouvre la fiche d'un club (bouton Voir).
2. Il lit la carte Contacts : chaque contact est repérable d'un coup d'œil, une ligne par personne.
3. Il écrit à un contact (clic sur l'e-mail), l'appelle (clic sur le téléphone), le modifie (crayon) ou le supprime (corbeille, avec confirmation, inchangée).

Rien ne change dans les fenêtres d'ajout, de modification et de suppression, ni dans les messages (contacts-fiche-club.md §3).

## 4. Maquettes en texte (voie B)

**Les largeurs de ce §4 et du §5 sont celles de la CARTE Contacts, pas de l'écran** (container queries, §8 point 9). Une même carte de 680 px donne la même ligne sur tous les écrans.

### 4.1 Large (carte de 680 px et plus) : une ligne par contact

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

### 4.2 Moyen (carte de 561 px à 679 px) : deux lignes par contact

```
│  Marie Dupont · Responsable administrative                        [✎][🗑]│
│  marie.dupont@exemple.fr    01 23 45 67 89                               │
│  ──────────────────────────────────────────────────────────────────────  │
```

Ligne 1 : nom, fonction, boutons à droite. Ligne 2 : e-mail, téléphone. **Aucune troncature à ces largeurs** (décision de Hanta, E6-7, docs/backlog.md) : si un texte est long, il passe à la ligne suivante dans son bloc, il n'est jamais coupé par « … ». Seuil de 680 px (de carte) : estimé (725 px de ligne + marges intérieures de la carte), à constater au rendu. À mettre en constante, en tête du fichier (règle CLAUDE.md « bonnes pratiques »), avec les autres seuils.

### 4.3 Étroit (carte de 560 px et moins) : quatre lignes au lieu de cinq

Vaut pour un téléphone, mais aussi pour une carte étroite sur grand écran (par exemple un widget Grist dans une colonne étroite).

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
- **E-mail** : tronqué en dernier seulement, parce que c'est ce que l'agent veut lire exactement ou copier. En voie B, la carte étant plus étroite qu'en voie A, c'est la Fonction qui absorbe d'abord la perte de place. Le lien `mailto:` garde l'adresse entière, et `title` donne l'adresse complète.
- **Pas de troncature quand la carte fait moins de 680 px** (décision de Hanta, E6-7, seuil désormais lu sur la carte) : la troncature « … » et `title` ne s'appliquent qu'à 680 px de carte et plus. En dessous, les lignes passent sur plusieurs niveaux (§4.2 et §4.3), tout passe à la ligne (`overflow-wrap: anywhere` existe déjà), rien n'est caché ni coupé.

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

Décisions (E6-2 à E6-5, E6-7, et E6-8 qui annule E6-1 ; docs/backlog.md) :
1. **Voie B** (E6-8, remplace E6-1) : Contacts et Actions restent côte à côte, 3fr / 2fr, empilées seulement sous 900 px.
2. **« Rôle » = Fonction** (colonne Contacts.Fonction).
3. **Tiret affiché** si Fonction est vide.
4. **Troncature acceptée** (Fonction, puis nom, puis e-mail), avec `title` natif, **à 680 px de carte et plus seulement** (E6-7 : aucune troncature en dessous).
5. **Colonnes alignées sans en-têtes**, pas un vrai tableau.
6. **Seuil de ligne unique à 680 px de carte** (E6-9, remplace 800 px). Entre 561 et 679 px : deux lignes, sans troncature.

Disposition finale :
- **Grille des cartes** : `.edit-row-lists` en `grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)` : Contacts à gauche (3 parts), Actions à droite (2 parts), côte à côte. **Sous 900 px d'écran** (seuil existant, media query existante, inchangée) : une colonne, Contacts puis Actions. Rien d'autre ne change dans la carte Actions.
- **Carte Contacts de 680 px et plus** : une ligne par contact, colonnes alignées dans l'ordre Nom Prénom (gras) · Fonction (texte secondaire, tiret si vide) · E-mail (lien) · Téléphone (lien, tiret si vide) · boutons Modifier, Supprimer à droite. Pas d'en-têtes. Troncature « … » + `title` sur Fonction, puis nom, puis e-mail ; téléphone et boutons jamais coupés.
- **Carte de 561 à 679 px** : deux lignes (nom, fonction, boutons ; puis e-mail, téléphone), **sans troncature** (E6-7).
- **Carte de 560 px et moins** : quatre lignes (nom + boutons ; fonction ; e-mail ; téléphone), sans troncature.
- **Effet à connaître** (estimation, non mesurée) : la carte atteint 680 px vers 1220 à 1250 px d'écran (carte ≈ 660 px à 1200 px, d'après le calcul du §2). À 1200 px, le contact reste donc sur deux lignes, juste sous le seuil ; à 1250 px et au-delà, il passe sur une seule ligne. À 992 px (carte ≈ 550 px), il s'affiche sur quatre lignes. Au seuil, la Fonction est tronquée à environ 100 px (décision E6-9) : l'e-mail et le téléphone gardent leur place, la Fonction est coupée par « … » avec `title`.
- Inchangés : fenêtres d'ajout, de modification et de suppression, messages, boutons icône, ordre de tabulation, focus après modification et suppression.
- Seuils 680 px et 560 px (largeur de la carte) : **estimés à la main**, à constater au rendu (point 7 du §8) avant de les figer.

## 8. Règles pour dev-interface

1. Les décisions du §7 sont prises : on peut coder. La note UX passe avant la modification du HTML (CLAUDE.md).
2. Uniquement des composants et variables du design system ; nos classes ne reprennent jamais un nom du design system (test/styles.test.js). Les noms existants (`contact-item`, `contact-name`, `contact-fonction`, `contact-mail`, `contact-tel`, `contact-buttons`) restent.
3. Seuils de largeur, largeur maximale de l'e-mail et écarts : constantes regroupées en tête de style.css / script.js (CLAUDE.md, « Bonnes pratiques de code »).
4. Tout ce qui vient de Grist passe par `escapeHtml` / `escapeAttr`, **y compris la valeur de `title`**.
5. Aucune donnée de personne réelle dans le code, les tests ou la doc : noms et domaines fictifs.
6. Les boutons, leurs `aria-label`, l'ordre de tabulation (nom, e-mail, téléphone, crayon, corbeille), le focus après modification et suppression sont inchangés.
7. Vérifier au rendu, écran de 1400, 1200, 992, 901, 899 et 400 px ; avec un nom de 40 caractères, une fonction de 60, un e-mail de 45 ; aucun défilement horizontal. Mesurer la largeur réelle de la carte Contacts à chacune pour confirmer les seuils 680 et 560.
8. **Grille** : `minmax(0, 3fr) minmax(0, 2fr)` (le `minmax(0, …)` évite qu'un long texte élargisse la colonne). Garder la media query existante de 900 px pour l'empilement ; ne pas en ajouter d'autre pour les cartes.
9. **Container queries obligatoires pour les seuils d'un contact** (680 px et 560 px) : `@container` à la place de `@media`, pour que ces seuils réagissent à la largeur réelle de la carte Contacts, quelle que soit la largeur de l'écran.
   - Déclarer la carte Contacts (ou un conteneur autour de `ul.contact-list`) comme conteneur : `container-type: inline-size;` avec, si utile, un `container-name` (nom à nous, jamais un nom du design system).
   - Écrire les seuils en `@container (min-width: …)` / `(max-width: …)`. Un `@container` ne stylise que les DESCENDANTS du conteneur, jamais le conteneur lui-même : les règles de `li.contact-item` et de ses enfants vont dans le `@container`, pas celles de la carte.
   - `container-type: inline-size` impose que la largeur du conteneur ne dépende pas de son contenu : c'est le cas ici (colonne de grille `minmax(0, 3fr)`). À vérifier au rendu.
   - Les valeurs 680 et 560 restent des constantes en tête de style.css (point 3). Une valeur ne peut pas être une variable CSS dans la condition d'un `@container` : dev-interface la répète donc aux endroits nécessaires et la garde commentée, ou regroupe les règles dans un seul bloc par seuil.
   - La troncature (`text-truncate` + `min-width: 0`, §5) n'est activée que dans le bloc `@container` de 680 px et plus.
   - Les tests (bac à sable avec doublures du DOM) n'évaluent pas le CSS : test/styles.test.js peut seulement vérifier la présence des règles. Le rendu réel se constate dans un navigateur, par Hanta.
8. Le tableau de bord n'est pas touché. Seul clubs.html est régénéré (Hanta lance le build et les tests).
