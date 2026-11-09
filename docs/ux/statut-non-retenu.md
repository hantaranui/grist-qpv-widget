# Note UX — 5ème statut « Non retenu » (Sprint E4)

Widget : actions-dashboard (src/actions-dashboard/). Branche : feature/statut-non-retenu.
Statut de la note : PROPOSITION, à valider par Hanta avant que dev-interface ne touche au HTML.
Sources lues : CLAUDE.md, docs/backlog.md (Sprint E4, décisions E4-1 à E4-8), docs/design-system-france-travail.md, docs/ux/contacts-fiche-club.md (format), src/actions-dashboard/script.js et style.css, feuille du CDN (styles.css), pages du design system citées au §10.

## 0. Point de départ (ce qui existe, vérifié dans le code)

- Les statuts viennent de Grist (`state.statusChoices`, dans l'ordre des choix de la colonne). Liste de secours : « A confirmer », « Planifiée », « Réalisée », « Annulée » (script.js:217). « Non retenu » sera donc le 5ème, en dernier, sans rien changer à l'ordre.
- Fiche d'une action : carte « Statut » = boutons radio dans `.status-options` (grille de 2 colonnes, style.css:695), puis un emplacement `.status-period-slot` qui montre UN seul champ selon le statut : Période de réalisation (texte) pour À confirmer, Date de planification pour Planifiée, Date de réalisation pour Réalisée, rien pour Annulée (`statusFieldConfig`, script.js:1406).
- Bug connu (E4-5) : tout statut inconnu retombe sur `{kind:'date', label:'Date'}` (script.js:1412) et affiche un sélecteur de date.
- Tableau : le statut est une pastille `.status-tag` suivie d'une ligne grise (`.muted`) qui contient la période ou la date (script.js:615).
- Synthèse : camembert « Répartition par statut » (`pieBlock`), légende avec nom + nombre + pourcentage.
- Les trois couleurs de statut existantes sont portées par des jetons du design system : info (Projet), warning (À confirmer, Planifiée), success (Réalisée), error (Annulée).

## 1. Parcours

Qui : un agent France Travail (National, Régional, Départemental) ou ANS qui ouvre la fiche d'une action avec le bouton « Modifier » du tableau. Ce sont les règles d'accès de Grist qui acceptent ou refusent l'enregistrement (voir §12, question Q9).

### 1.1 Refuser une action (6 étapes)

1. L'agent ouvre la fiche d'une action (bouton « Modifier »).
2. Dans la carte « Statut », il choisit « Non retenu ».
3. Le champ de date ou de période disparaît ; à sa place apparaît le champ « Raison du refus * », vide (« Choisir une raison »).
4. L'agent choisit une raison dans la liste.
5. Il clique sur « Enregistrer » (bouton existant de la fiche).
6. Réussite : même comportement qu'aujourd'hui pour un enregistrement. Si la raison manque : l'enregistrement n'a pas lieu, le champ est marqué en erreur, le focus y va (§9).

### 1.2 Reprendre une action refusée (3 étapes)

1. L'agent ouvre la fiche d'une action « Non retenu » : la raison est affichée.
2. Il choisit un autre statut (par exemple « Planifiée ») : le champ « Raison du refus » disparaît, le champ de date du nouveau statut apparaît.
3. À l'enregistrement, la raison est effacée dans Grist (E4-2). Tant que l'agent n'a pas enregistré, s'il re-clique sur « Non retenu », la raison qu'il avait choisie est encore là (elle n'est effacée qu'à l'enregistrement).

## 2. Les 5 statuts : grille 3 + 2

Ordre : celui de Grist (aucun tri dans le widget). Disposition : 3 colonnes, remplies ligne par ligne.

```
┌─ STATUT ───────────────────────────────────────────────┐
│  Statut de l'action                                     │
│                                                         │
│  (•) À confirmer   ( ) Planifiée    ( ) Réalisée        │
│  ( ) Annulée       ( ) Non retenu                       │
│                                                         │
│  Période de réalisation          ← un seul champ à la   │
│  [ _____________________ ]         fois (voir §3)       │
└─────────────────────────────────────────────────────────┘
```

Règles :
- Même case que les 4 statuts d'aujourd'hui (`form-check with-checked-bg status-option`), même libellé, même fond de sélection : la structure HTML d'une case ne change pas (§10, composant 1). Seul le nombre de colonnes de `.status-options` passe de 2 à 3 (`repeat(3, minmax(0, 1fr))`).
- La 6ème case, si un jour Grist ajoute un statut ou si une valeur inconnue est ajoutée par `withExistingValues`, tombe naturellement sur une 2ème ligne complète : la grille s'adapte, rien à prévoir.
- Les cases gardent `white-space: nowrap` (aucun libellé de statut n'est long : « Non retenu » est le plus long avec 11 caractères).
- Les colonnes sont égales : « Non retenu » est plus long que les autres mais tient dans une colonne de 1/3 de la carte même au plus étroit de la grille (voir §8).

## 3. Le champ « Raison du refus »

### 3.1 Où et quand

Il occupe l'emplacement actuel du champ de date/période (`.status-period-slot`, sous les cases). Il n'ajoute pas de ligne : il REMPLACE le champ du statut précédent. Il n'apparaît que pour « Non retenu ».

### 3.2 Exclusivité (un seul champ visible à la fois)

| Statut choisi | Champ affiché sous les cases | Étiquette |
|---|---|---|
| À confirmer (ou Projet) | texte libre | Période de réalisation |
| Planifiée | sélecteur de date | Date de planification |
| Réalisée | sélecteur de date | Date de réalisation |
| Annulée | aucun | — |
| **Non retenu** | **liste déroulante** | **Raison du refus \*** |
| Statut inconnu | aucun (§4) | — |

Conséquence à l'enregistrement, qui suit la logique existante (script.js:945-946) : en choisissant « Non retenu », Date et Periode_approx sont vidées dans Grist, comme pour « Annulée ». À signaler à Hanta : une action planifiée puis refusée perd sa date de planification (§12, question A).

### 3.3 Texte et maquette

- Étiquette : « Raison du refus » suivie de l'astérisque obligatoire (même `<span class="required">&nbsp;*</span>` que la fenêtre d'ajout d'une action).
- Première option : « Choisir une raison » (valeur vide, sélectionnée par défaut quand aucune raison n'est enregistrée).
- Options : les 4 raisons de Grist, dans l'ordre de la colonne, libellé complet (E4-6 : la liste est lue dans Grist, une 5ème raison ajoutée plus tard apparaîtra seule).
- Info-bulle : attribut `title` sur le `<select>`, valeur = la raison actuellement choisie (phrase entière), vide si aucune raison. Mise à jour à chaque changement.

```
  Raison du refus *
  [ Dossier ne correspondant pas au cahier des ch… ▾ ]
     ↳ au survol : « Dossier ne correspondant pas au cahier des charges »
```

Limite à connaître : l'attribut `title` ne s'affiche qu'à la souris. Il ne remplace donc pas la lisibilité : c'est pourquoi la liste déroulante ouverte montre chaque phrase en entier, et pourquoi le tableau (§6) écrit la raison complète sans la couper.

### 3.4 Largeur

Le champ prend la largeur de la carte (pas de `max-width: 280px` comme `.status-period`, qui coupe les phrases de 49 à 55 caractères). Proposition : `.status-period` garde 280 px pour les dates et le texte, et le champ « raison » est en pleine largeur de la carte.

### 3.5 Message d'erreur (raison manquante, E4-3)

Sous le champ, avec la structure d'erreur du design system (§10, composant 2) :
« Choisissez une raison du refus pour enregistrer le statut « Non retenu ». »
En plus, l'alerte rouge existante en haut de la fiche (`#editMessage`) reprend : « La raison du refus est obligatoire pour le statut « Non retenu ». » Même principe que les erreurs de la fenêtre d'ajout d'une action. Rien n'est envoyé à Grist.

### 3.6 Largeur de la carte Statut vs Financement (Q11)

Aujourd'hui `.edit-row-bottom` = `.55fr / 1.45fr` (style.css:666), soit 27,5 % / 72,5 % de la largeur utile. Avec 3 colonnes de cases, la carte Statut doit contenir trois cases de ~120 px et un champ « raison » lisible.

Proposition : `minmax(0, .85fr) minmax(0, 1.15fr)` (42,5 % / 57,5 %). Sur la largeur maximale de la fiche (1280 px, moins 2 × 40 de marge et 24 d'écart, soit 1176 px), cela donne environ 500 px pour Statut et 676 px pour Financement. Financement passe de ~850 à ~676 px : sa grille intérieure (`1.45fr / 1fr / .95fr / 62px`) reste exploitable, car la ligne la plus étroite, le « Statut de versement », ne contient qu'un texte court (style.css:743-746). À vérifier par dev-interface à l'écran sur une fiche avec 3 financeurs ; si Financement se serre trop, repli à `.75fr / 1.25fr`. Valeur à valider par Hanta au vu du rendu : je ne peux pas la mesurer sans lancer le widget.

## 4. Statut inconnu : aucun champ (E4-5)

- Un statut qui n'est pas géré explicitement par `statusFieldConfig` (donc ni À confirmer, Projet, Planifiée, Réalisée, Annulée, Non retenu) n'affiche AUCUN champ sous les cases : ni date, ni période, ni raison, ni étiquette.
- Sa case radio reste visible et sélectionnée (la valeur n'est pas perdue, `withExistingValues` la garde), avec le fond neutre par défaut (§5).
- Dans le tableau : pastille grise (par défaut), sans ligne grise dessous.
- À l'enregistrement : Date et Periode_approx sont vidées (comportement existant pour « Annulée » ; pour un statut inconnu c'est un effet de bord à confirmer, §12 question B).

## 5. Couleur de la case « Non retenu »

Les 4 statuts utilisent un fond « weakest » de famille sémantique. « Non retenu » est un statut final négatif, comme « Annulée » (rouge), mais ce n'est pas la même chose : il ne faut pas que les deux se confondent, et il ne faut pas ajouter une 5ème famille sémantique inventée.

PROPOSITION À VALIDER PAR HANTA : famille neutre, teinte « weak » : `--ft-color-background-neutral-weak`.
- Valeur dans l'univers Outils agent : #d2dae8 (lue sur la feuille du CDN, bloc `.outil-agent`). Ce jeton existe dans la feuille ; il n'est pas encore utilisé dans notre CSS.
- Pourquoi pas `neutral-default-weaker` (#e7ebf1) : c'est déjà le fond par défaut de `.status-tag` (style.css:589), donc une pastille de statut inconnu ressemblerait à « Non retenu ».
- Pourquoi pas `neutral-weakest` (#f2f4fb) : presque identique au fond blanc de la carte, la sélection ne se verrait pas.
- Contraste : texte `--ink` (déjà utilisé sur les pastilles) sur #d2dae8. Le calcul exact doit être fait par dev-interface/testeur (le contraste des autres pastilles est de 11,89 à 12,97 : style.css:599) ; je ne donne pas de chiffre que je n'ai pas mesuré.
- Le sens n'est jamais porté par la couleur seule : le libellé « Non retenu » est toujours écrit, dans la case comme dans la pastille.

Règles CSS à suivre (sans nouvelle convention) :
- `.status-option.non-retenu { --statut-fond: var(--ft-color-background-neutral-weak); }` (même mécanique que les 4 autres, style.css:713-720).
- `.status-tag.non-retenu { background: var(--ft-color-background-neutral-weak); }` (style.css:600-609).
- La classe `non-retenu` vient de `statusClass('Non retenu')` (script.js:1397) : « Non retenu » devient `non-retenu`. Nom de classe absent du design system (test/styles.test.js à lancer par Hanta).
- Cas du camembert : voir §6.

## 6. Tableau et synthèse (réponse à Q7)

### 6.1 Tableau (colonne Statut)

```
┌ STATUT ──────────────────────────┐
│ [ Non retenu ]                    │  ← pastille grise (§5)
│ Raison : Pas de contact avec la   │  ← ligne grise .muted existante,
│ structure                         │    écrite en entier, sans coupure
└───────────────────────────────────┘
```

- Même emplacement que la période ou la date des autres statuts : la ligne grise sous la pastille. Pas de nouvelle colonne.
- Texte : « Raison : » + la raison complète (même façon d'écrire que « Public : … » et « Ville : … » de la colonne Action). Aucune troncature : l'info-bulle ne marche ni au clavier ni au doigt.
- Raison vide sur un statut « Non retenu » (cas d'import, §7) : « Raison : non renseignée », comme « Public : non renseigné ».
- Statut ≠ « Non retenu » : la raison n'est pas affichée, même si Grist en contient une (§12, question C).
- À noter : `.col-status` ne fait que 12 % (style.css:491) et les raisons font 33 à 55 caractères : elles iront sur 3 à 5 lignes. Seules les lignes « Non retenu » seront plus hautes. Ne pas élargir la colonne sans accord de Hanta ; dev-interface regarde le rendu.

### 6.2 Filtres

Aucun nouveau filtre. Le filtre « Statut » existant liste les valeurs trouvées ; « Non retenu » y apparaît comme les autres. Pas de filtre par raison (non demandé).

### 6.3 Synthèse

- Le camembert « Répartition par statut » comptera « Non retenu » comme une part de plus, avec sa ligne de légende « Non retenu — n (x %) ». Aucun graphique par raison (non demandé : à proposer plus tard si le besoin vient).
- Les couleurs des parts viennent de COLORS, par rang (script.js:4), pas par statut : la teinte de « Non retenu » dans le camembert ne sera donc pas le gris des pastilles. Écart déjà connu (CLAUDE.md, « Pièges connus »), non traité ici. Le sens est porté par le nom et le nombre de la légende, pas par la couleur.

### 6.4 Export CSV

Le fichier exporte « Statut » mais pas la raison. Je ne propose pas de colonne : non demandé. Question D au §12.

## 7. Cas d'incohérence venant de l'extérieur (E4-4)

Principe : afficher ce qui est dans Grist, tel quel, sans corriger ni bloquer à l'ouverture.

| Cas | Fiche | Tableau |
|---|---|---|
| « Non retenu » sans raison | champ « Raison du refus * » vide, option « Choisir une raison ». Aucune erreur avant que l'agent enregistre. | pastille + « Raison : non renseignée » |
| « Non retenu » avec une raison absente de la liste | la valeur est ajoutée à la liste (en dernier) et sélectionnée : elle n'est pas perdue à l'enregistrement. Libellé identique, sans suffixe | pastille + la raison telle quelle |
| Autre statut avec une raison remplie | le champ « raison » n'apparaît pas ; rien à l'écran | pas de raison |
| Statut inconnu | aucun champ (§4) | pastille grise, pas de ligne grise |

Point à décider (question E) : si l'agent modifie, par exemple, le titre d'une action importée « Non retenu » sans raison, l'enregistrement est bloqué par l'obligation E4-3. Je le préconise (règle simple : pas de « Non retenu » sans raison dans le document) avec le message du §3.5 ; à confirmer par Hanta.

## 8. Largeurs d'écran

Le point de rupture existant pour la fiche est `@media (max-width: 900px)` (style.css:773). La ligne 784 citée dans la demande est `.finance-list-head { display: none; }` à l'intérieur de ce même bloc. Le bloc 1340 px ne concerne que la liste (filtres/tableau), le bloc 700 px que la colonne figée « Modifier ».

| Largeur | Cartes | Cases de statut | Champ « raison » |
|---|---|---|---|
| Grand (> 900 px) | Statut et Financement côte à côte, 42,5 % / 57,5 % (§3.6) | 3 + 2, sur 3 colonnes égales | pleine largeur de la carte Statut (~450 px utiles) : phrases lisibles sur 1 à 2 lignes dans la liste ouverte, tronquées visuellement à la fermeture, info-bulle au survol |
| Moyen (700 à 900 px) | Cartes l'une sous l'autre (règle existante `.edit-row-bottom { 1fr }`) | 3 + 2 conservée : la carte fait toute la largeur, trois cases tiennent | pleine largeur de la carte |
| Étroit (< 700 px, téléphone) | idem | 3 colonnes risquent de serrer « Non retenu » + « Planifiée ». PROPOSITION : repasser à 2 colonnes sous 560 px (3 lignes : 2+2+1). Seuil à valider sur écran réel | pleine largeur ; sur mobile la liste native du système affiche les phrases en entier |

Le seuil 560 px est une proposition (nouveau seuil, le dépôt n'en a pas à cette valeur) : si Hanta préfère n'utiliser que les seuils existants, garder 3 colonnes jusqu'à 700 px puis 2 colonnes sous 700 px (seuil déjà présent, style.css:797).

## 9. Accessibilité

- Cases de statut : inchangées (radios natifs dans un `role="group"` relié à la légende « Statut de l'action »). L'ordre de tabulation suit l'ordre visuel (ligne par ligne) ; flèches du clavier : natif des radios.
- Étiquette : « Raison du refus » avec `<label for>` relié au `<select>` (id proposé : `editRaisonRefus`, nom `editRaisonRefus`, à vérifier contre les noms existants). Pas de champ sans étiquette.
- Obligatoire : `required` et `aria-required="true"` sur le select, plus l'astérisque dans l'étiquette (l'astérisque seul ne suffit pas aux lecteurs d'écran, d'où `required`).
- Erreur : structure du design system (§10, composant 2) : `aria-invalid="true"`, `aria-describedby` vers le message, message précédé de « Erreur : » pour lecteur d'écran (`sr-only`). Le focus va sur le select en erreur. Alerte globale existante `role="alert"`.
- Apparition/disparition du champ : le changement de statut est fait par l'agent lui-même, il n'a pas besoin d'annonce. Mais l'étiquette `#statusPeriodLabel` actuelle (texte au-dessus du champ de période) doit être vide pour « Non retenu » : le champ porte sa propre étiquette, pour ne pas lire deux étiquettes.
- Un champ masqué (`.is-hidden`, `display: none`) sort de l'arbre d'accessibilité et de la tabulation : à conserver pour les contrôles non affichés.
- Info-bulle `title` : complément pour la souris, jamais seule porteuse de l'information (§3.3, §6.1).
- Couleur : jamais seule porteuse du sens (libellés écrits partout, §5).
- Contraste : voir §5 ; focus visible : celui du design system, sans le supprimer.
- Après enregistrement avec raison manquante : focus sur le select, pas au début de la fiche.

## 10. Composants du design system utilisés (recopiés pour dev-interface, qui n'a pas accès au web)

Aucun composant nouveau n'est introduit. Univers « Outils agent ».

### Composant 1 — Case radio de statut (existant, inchangé)
Page : https://designsystem.francetravail.io/components/detail/radio--default.html (adresse non relue pour cette note, à vérifier). Structure réellement utilisée dans le code (script.js:701) :

```html
<div class="form-check with-checked-bg status-option non-retenu">
  <input class="form-check-input" type="radio" id="status-4" name="editStatus" value="Non retenu">
  <label class="form-check-label" for="status-4">Non retenu</label>
</div>
```

### Composant 2 — Liste déroulante « Select » (Q12)
Page : https://designsystem.francetravail.io/components/detail/select--default.html (lue). Variante erreur : https://designsystem.francetravail.io/components/detail/select--error.html (lue).

Réponse à Q12 : le design system propose un composant `Select` officiel, c'est la liste native `select.form-control`, celle que le tableau de bord utilise déjà (Format, Dispositif, Agence). Il précise de ne pas le confondre avec le Dropdown, destiné au filtrage. Le sélecteur personnalisé des filtres (`details.filter-search-dropdown`) n'est PAS à reprendre ici. Aucune option de liste à inventer.

État normal (structure de la page) :

```html
<div class="edit-field">
  <label class="form-label" for="editRaisonRefus">Raison du refus<span class="required">&nbsp;*</span></label>
  <select class="form-control" id="editRaisonRefus" name="editRaisonRefus" required aria-required="true" title="">
    <option selected disabled value="">Choisir une raison</option>
    <option value="Non pertinent pour les besoins du territoire">Non pertinent pour les besoins du territoire</option>
    <!-- une option par raison lue dans Grist -->
  </select>
</div>
```

Note : le gabarit du design system met l'option vide en `disabled`. Pour une action importée sans raison, elle est `selected`; une fois une raison choisie, l'agent ne peut pas revenir à « vide » : voulu, puisque la raison est obligatoire.

État erreur (structure de la page `select--error`) :

```html
<div class="has-error">
  <label class="form-label" for="editRaisonRefus">Raison du refus<span class="required">&nbsp;*</span></label>
  <select class="form-control is-invalid" id="editRaisonRefus" name="editRaisonRefus"
          aria-invalid="true" aria-describedby="error-editRaisonRefus" required>
    <option selected disabled value="">Choisir une raison</option>
    ...
  </select>
  <p class="help-block invalid-feedback" id="error-editRaisonRefus">
    <span class="sr-only">Erreur:&nbsp;</span>Choisissez une raison du refus pour enregistrer le statut « Non retenu ».
  </p>
</div>
```

Écart à signaler : la fenêtre d'ajout d'une action utilise `div.invalid-feedback` + `is-invalid` sans `has-error` ni `help-block` (script.js:1101). Pour rester cohérent avec l'existant, dev-interface peut reprendre le mécanisme de `addActionField` / `is-invalid` du fichier, tant que le message est relié par `aria-describedby`. Hanta choisit (question F).

### Composant 3 — Alerte d'erreur (existant)
`<div class="alert alert-error edit-message is-hidden" id="editMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>` (script.js:655).

### Composant 4 — Pastille de statut (existant, non officielle)
`.status-tag` est une classe à nous (hors design system, voir style.css:585). Pas de composant `Tag` du design system utilisé aujourd'hui ; je ne propose pas de changer cela dans ce sprint.

## 11. Règles pour dev-interface

1. Aucune couleur, police ni composant nouveau : uniquement le jeton du §5 (si validé) et le Select du §10.
2. `statusFieldConfig` : ajouter « Non retenu » avec un type distinct (par exemple `reason`), et faire du cas par défaut un type « aucun champ » (E4-5).
3. Un seul champ visible à la fois : mêmes mécanismes `.is-hidden` que pour les dates.
4. La raison est lue dans Grist (liste dynamique `loadColumnChoices('Actions','Raison_du_refus')`, avec les valeurs existantes ajoutées par `withExistingValues`), jamais écrite en dur dans le widget (E4-6).
5. Écriture dans la même opération `applyUserActions` que le reste de la fiche (UpdateRecord sur Actions) : Raison_du_refus = la raison si Statut = « Non retenu », sinon vide (E4-2).
6. Aucune donnée personnelle : Raison_du_refus est un choix de liste, pas un texte libre.
7. Ordre de travail : cette note, validation de Hanta, puis HTML/CSS/JS, puis build et tests par Hanta.

## 12. Questions ouvertes pour Hanta

- A. En passant une action « Planifiée » ou « Réalisée » à « Non retenu », sa date est effacée à l'enregistrement (logique existante pour « Annulée »). Acceptez-vous de perdre la date ?
- B. Même question pour un statut inconnu : les dates sont vidées à l'enregistrement. Préférez-vous les laisser intactes ?
- C. Un autre statut que « Non retenu » avec une raison déjà remplie dans Grist : la raison est effacée à l'enregistrement de la fiche (E4-2), sans rien dire à l'agent. OK ?
- D. Faut-il ajouter la raison à l'export CSV (non demandé, donc non prévu) ?
- E. Bloquer l'enregistrement d'une action « Non retenu » sans raison même si l'agent modifie autre chose (ma recommandation) ?
- F. Message d'erreur du champ : structure officielle du design system (`has-error` + `help-block`) ou mécanisme déjà utilisé dans la fenêtre d'ajout ?
- G. Teinte de « Non retenu » : `neutral-weak` (proposition) ou autre ? Seuil mobile à 560 px ou le seuil existant de 700 px ? Largeurs `.85fr / 1.15fr` à confirmer sur écran.
- Q9 (droits d'écriture sur Raison_du_refus par profil) : je n'ai rien à dessiner. Aucun écran ne cache le champ selon le profil ; si Grist refuse l'écriture, le message de refus existant de la fiche s'affiche. À régler dans les règles d'accès (Hanta, dans Grist).
- Q13 (ordre de déploiement Grist/widget) : hors de mon périmètre. Point d'attention UX : si le widget est en ligne avant la colonne Raison_du_refus, le champ n'a pas de liste de raisons.
