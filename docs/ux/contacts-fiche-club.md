# Note UX — Gérer les contacts dans la fiche d'un club

Widget : clubs (src/clubs/). Écran concerné : la carte « Contacts » de la fiche d'un club (ouverte par le bouton Voir de la liste).
Statut : validée par Hanta le 21/10/2026. Les décisions de Hanta sont intégrées ; ce qui reste à constater est listé à la fin (« À constater en recette (DEV7) »).
Sources lues : CLAUDE.md (section « Le widget clubs »), docs/design-system-france-travail.md, src/clubs/ (index.html, script.js, style.css), src/actions-dashboard/ (index.html, script.js, style.css), pages du design system citées plus bas.

## 0. Point de départ (ce qui existe)

- La carte Contacts est produite par `renderContacts(contacts)` dans src/clubs/script.js. Elle affiche une liste `ul.contact-list` ; chaque `li.contact-item` montre : « prénom nom » (`span.contact-name`), l'e-mail en lien `mailto:` (`a.contact-mail`) et le téléphone en lien `tel:` (`a.contact-tel`). Valeur absente : tiret + texte pour lecteur d'écran (`missing(...)`).
- Liste vide : « Aucun contact enregistré pour ce club. » (`p.empty-note`).
- Table Contacts refusée en lecture : « Vos droits ne permettent pas de lire les contacts. » (`p.empty-note`).
- `buildFicheDetail` lit aujourd'hui Prenom, Nom, Email, Telephone. **Il ne lit pas Fonction** (la colonne existe d'après CLAUDE.md, mais le script actuel ne s'en sert pas) : à ajouter pour pré-remplir le formulaire de modification.
- Le tableau de bord a déjà : la fenêtre « Ajout d'une action » (formulaire dans une fenêtre modale, champs obligatoires avec `*`, erreurs sous le champ, alerte d'erreur en haut de la fenêtre, boutons Annuler / Valider) et la fenêtre « Suppression d'une action » (`role="alertdialog"`, Annuler / Valider, bouton rouge `btn-supprimer`). Cette note les reprend.

## 1. Parcours

Qui : un agent France Travail (National, Régional, Départemental) ou ANS, sur la fiche d'un club. Les boutons sont visibles pour tous : ce sont les règles d'accès de Grist qui acceptent ou refusent. Seule exception (décision de Hanta) : si la table Contacts ne peut pas être lue, le bouton « Ajouter un contact » est masqué.

### 1.1 Ajouter un contact (5 étapes)

1. L'agent est sur la fiche d'un club et clique sur « Ajouter un contact » (haut de la carte Contacts).
2. La fenêtre « Ajout d'un contact » s'ouvre ; le focus est dans le champ Nom. Le club est rappelé en lecture seule. En haut du formulaire : « * champ obligatoire ».
3. L'agent saisit Nom et E-mail (obligatoires), et éventuellement Prénom, Téléphone, Fonction, puis clique sur « Valider ». Échap ou « Annuler » ferme sans rien enregistrer.
4. Si un champ obligatoire manque ou si l'e-mail est mal formé : la fenêtre reste ouverte, le champ est marqué en erreur, le focus va sur le premier champ à corriger. Rien n'est envoyé à Grist.
5. Si tout est correct, le widget envoie l'ajout à Grist. Réussite : la fenêtre se ferme, le contact apparaît dans la liste, et une annonce de réussite est faite aux lecteurs d'écran (voir §7.4, pas d'alerte de succès visible). Refus ou échec : la fenêtre reste ouverte avec ses valeurs, une alerte explique le problème.

### 1.2 Modifier un contact (5 étapes)

1. Sur la ligne d'un contact de la carte, l'agent clique sur « Modifier ».
2. La fenêtre « Modification d'un contact » s'ouvre avec les cinq champs pré-remplis ; le focus est dans Nom.
3. L'agent change ce qu'il veut, puis « Valider ». Le club ne peut pas être changé (affiché en texte, pas en champ).
4. Mêmes contrôles et mêmes messages que pour l'ajout.
5. Réussite : la fenêtre se ferme, la ligne est mise à jour, annonce de réussite aux lecteurs d'écran. Le focus revient sur le bouton « Modifier » de ce contact.

### 1.3 Supprimer un contact (4 étapes)

1. Sur la ligne d'un contact, l'agent clique sur « Supprimer ».
2. La fenêtre « Suppression d'un contact » s'ouvre : elle nomme le contact et dit que la suppression est définitive. Le focus est sur « Annuler » (l'action prudente), comme pour la suppression d'une action.
3. L'agent clique sur « Supprimer » (bouton rouge) pour confirmer, ou sur « Annuler » / Échap pour renoncer.
4. Réussite : la fenêtre se ferme, le contact disparaît de la liste, annonce de réussite aux lecteurs d'écran. Le focus va sur « Ajouter un contact » (le bouton de la ligne n'existe plus). Refus ou échec : la fenêtre reste ouverte avec une alerte.

## 2. Maquettes en texte

### 2.1 Carte Contacts

La carte garde son en-tête actuel (`section-head`, titre « Contacts »). Le bouton « Ajouter un contact » est placé **en haut du corps de la carte**, et non dans l'en-tête : dans src/clubs/style.css, `.section-head` n'a pas de `justify-content: space-between` (celui du tableau de bord en a un), donc ce choix évite de toucher à l'en-tête.

```
┌─ CONTACTS ───────────────────────────────────────────┐
│                                                       │
│  [ + Ajouter un contact ]                             │
│                                                       │
│  (annonce de réussite : voix seulement, rien à l'écran, voir §7.4)
│                                                       │
│  Marie Dupont                       [Modifier][Supprimer]
│  Responsable administrative  (Fonction, voir §5)      │
│  marie.dupont@exemple.fr   01 23 45 67 89             │
│  ───────────────────────────────────────────────────  │
│  Karim Martin                       [Modifier][Supprimer]
│  (Fonction non renseignée : aucune ligne)             │
│  k.martin@exemple.fr       —                          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

Les noms ci-dessus sont fictifs (aucune donnée réelle dans le dépôt).

Liste vide :

```
┌─ CONTACTS ───────────────────────────────────────────┐
│  [ + Ajouter un contact ]                             │
│  Aucun contact enregistré pour ce club.               │
└───────────────────────────────────────────────────────┘
```

Table Contacts illisible (règles d'accès) : on garde le message actuel et on **n'affiche pas** le bouton « Ajouter un contact » (décision de Hanta).

```
┌─ CONTACTS ───────────────────────────────────────────┐
│  Vos droits ne permettent pas de lire les contacts.   │
└───────────────────────────────────────────────────────┘
```

Boutons de chaque ligne : « Modifier » et « Supprimer » en `btn btn-secondary btn-sm`. Chacun porte un `aria-label` qui nomme le contact, car plusieurs lignes ont les mêmes mots : « Modifier le contact Marie Dupont », « Supprimer le contact Marie Dupont ». Le « Supprimer » de la ligne n'est **pas** rouge (la couleur d'alerte est réservée au bouton de confirmation dans la fenêtre) ; il reste identifiable par son texte.

### 2.2 Fenêtre d'ajout et de modification

Même fenêtre, deux titres. Fenêtre « Ajout d'un contact » :

```
┌──────────────────────────────────────────────┐
│ Ajout d'un contact                            │
├──────────────────────────────────────────────┤
│ ┌ alerte d'erreur (cachée tant qu'il n'y a    │
│ │ pas d'erreur d'enregistrement)              │
│ └─────────────────────────────────────────────│
│ * champ obligatoire                           │
│ Club : Nom du club (non modifiable)           │
│                                               │
│ Saisissez des coordonnées professionnelles    │
│ (adresse e-mail et téléphone de la structure),│
│ pas des coordonnées personnelles.             │
│                                               │
│ Nom *                                         │
│ [______________________________]              │
│ Prénom                                        │
│ [______________________________]              │
│ E-mail *                                      │
│ [______________________________]              │
│ Téléphone                                     │
│ [______________________________]              │
│ Fonction                                      │
│ [______________________________]              │
├──────────────────────────────────────────────┤
│                      [ Annuler ]  [ Valider ] │
└──────────────────────────────────────────────┘
```

Fenêtre « Modification d'un contact » : identique, avec les champs pré-remplis.

Fenêtre avec erreurs de saisie (nom vide, e-mail mal formé) :

```
│ Nom *                                         │
│ [______________________________]  ← bordure d'erreur
│ ⚠ Erreur : Saisissez le nom du contact.       │
│   ("Erreur :" lu par les lecteurs d'écran,    │
│   non affiché : sr-only, voir §7.3)           │
│ Prénom                                        │
│ [Marie_________________________]              │
│ E-mail *                                      │
│ [marie.dupont_________________]  ← bordure d'erreur
│ ⚠ Saisissez une adresse e-mail valide, par    │
│   exemple nom@exemple.fr.                     │
```

L'erreur n'est jamais portée par la couleur seule : il y a un texte sous le champ, et le champ porte `aria-invalid="true"`.

Ordre des champs : Nom, Prénom, E-mail, Téléphone, Fonction (l'ordre de CLAUDE.md). Types d'entrée proposés : Nom, Prénom, Fonction en texte ; E-mail en `type="email"` (clavier adapté sur mobile) ; Téléphone en `type="tel"`. Tous en `autocomplete="off"` (comme le champ Nom de l'action) : ce sont les coordonnées d'une autre personne, le navigateur ne doit pas proposer celles de l'agent. Le formulaire garde `novalidate` pour que les messages soient ceux de la note, pas ceux du navigateur.

### 2.3 Confirmation de suppression

```
┌──────────────────────────────────────────────┐
│ Suppression d'un contact                      │
├──────────────────────────────────────────────┤
│ ┌ alerte d'erreur (cachée par défaut) ───────│
│ Êtes-vous sûr de vouloir supprimer le contact │
│ **Marie Dupont** ? Cette suppression est      │
│ définitive : le contact ne pourra pas être    │
│ récupéré.                                     │
├──────────────────────────────────────────────┤
│                 [ Annuler ]  [ Supprimer (rouge)]│
└──────────────────────────────────────────────┘
```

Reprise des mots de « Suppression d'une action » (« Êtes-vous sûr de vouloir supprimer… », Annuler). Le bouton de confirmation s'appelle « Supprimer » (décision de Hanta ; la fenêtre de suppression d'une action, elle, garde « Valider »). La phrase ajoutée (« définitive… ») est nécessaire : contrairement aux actions, qui vont à la corbeille, un contact est vraiment supprimé. Si le contact n'a pas de nom, afficher « Contact sans nom » (le même mot que `renderContacts`).

## 3. Messages

Tous en français simple, à la forme déjà utilisée par le tableau de bord (« Saisissez… », « L'ajout n'a pas abouti… »).

| Situation | Où | Texte proposé | Rôle ARIA |
|---|---|---|---|
| Nom manquant (vide ou espaces) | Sous le champ Nom | « Saisissez le nom du contact. » | lié au champ par `aria-describedby` + `aria-invalid` |
| E-mail manquant | Sous le champ E-mail | « Saisissez l'adresse e-mail du contact. » | idem |
| E-mail mal formé | Sous le champ E-mail | « Saisissez une adresse e-mail valide, par exemple nom@exemple.fr. » | idem |
| Enregistrement réussi — ajout | Annonce aux lecteurs d'écran (zone `sr-only`, voir §7.4) | « Le contact a bien été ajouté. » | `role="status"` |
| Enregistrement réussi — modification | idem | « Le contact a bien été modifié. » | `role="status"` |
| Suppression réussie | idem | « Le contact a bien été supprimé. » | `role="status"` |
| Refus de Grist (droits insuffisants), ajout ou modification — **texte à constater en recette (DEV7)** | Alerte en haut de la fenêtre | « Vous n'avez pas les droits pour ajouter ou modifier des contacts de ce club. Vos données n'ont pas été enregistrées. Rapprochez-vous de l'équipe qui gère le document. » | `role="alert"` |
| Refus de Grist, suppression — **texte à constater en recette (DEV7)** | Alerte dans la fenêtre de suppression | « Vous n'avez pas les droits pour supprimer ce contact. Il n'a pas été supprimé. » | `role="alert"` |
| Échec réseau ou autre échec, ajout / modification | Alerte en haut de la fenêtre | « L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez. » | `role="alert"` |
| Échec réseau ou autre échec, suppression | Alerte dans la fenêtre de suppression | « La suppression n'a pas abouti. Vérifiez votre connexion puis réessayez. » | `role="alert"` |
| Contact introuvable (supprimé entre-temps par quelqu'un d'autre) | Alerte dans la fenêtre | « Ce contact n'existe plus. La liste va être actualisée. » | `role="alert"` |
| Liste vide | Corps de la carte | « Aucun contact enregistré pour ce club. » (texte déjà en place) | — |
| Lecture refusée | Corps de la carte | « Vos droits ne permettent pas de lire les contacts. » (texte déjà en place) | — |
| Envoi en cours | Bouton Valider | Le bouton est désactivé et son texte devient « Enregistrement en cours… » (mêmes mots que « Envoi en cours… » du logo) | — |

Règles pour ces messages :

- **Ne pas distinguer refus et échec réseau n'est pas acceptable** : le message de refus doit dire que ce sont les droits. Je ne sais pas quel texte ou quel code Grist renvoie dans `error.message` pour un refus (aucun exemple dans le dépôt que j'ai lu) : c'est **à constater en recette, dans DEV7** (décision de Hanta) : comment reconnaître un refus, et le texte exact à afficher. **Si le refus ne peut pas être reconnu de façon fiable, utiliser un seul message de repli** : « L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez. Si le problème continue, vos droits ne permettent peut-être pas de modifier les contacts de ce club. »
- Le tableau de bord affiche le texte brut de l'erreur Grist (« …n'a pas abouti : détail »). Pour les contacts, **ne pas afficher ce texte brut** : une erreur Grist peut reprendre des valeurs saisies (e-mail, nom), c'est-à-dire des données personnelles, dans un message à l'écran. Le message est fixe ; le détail technique, s'il est journalisé, ne contient jamais les valeurs saisies.
- Pas d'alerte de réussite visible (voir §7.4) : la preuve visuelle du succès est la fenêtre qui se ferme et la liste mise à jour ; le texte de réussite est annoncé aux lecteurs d'écran. La zone d'annonce reste dans la page jusqu'à l'action suivante ou jusqu'à ce qu'on quitte la fiche.

## 4. Mention « coordonnées professionnelles »

Texte proposé, placé dans la fenêtre d'ajout et de modification, **sous le rappel du club et avant les champs** :

> Saisissez des coordonnées professionnelles (adresse e-mail et téléphone de la structure), pas des coordonnées personnelles.

Variante plus courte si la place manque sur mobile : « Coordonnées professionnelles uniquement, pas personnelles. »

Balisage : un paragraphe `p.help-block` (structure du texte d'aide du design system, voir §7), avec un `id`, relié à la fenêtre par `aria-describedby` pour que le lecteur d'écran la lise à l'ouverture. Elle n'est pas répétée sous chaque champ.

## 5. Fonction dans la carte Contacts — DÉCIDÉ PAR HANTA

Fonction est un champ du formulaire (décision de CLAUDE.md). Décision de Hanta : on l'**affiche** aussi dans la carte, sur sa propre ligne, sous le nom, en texte secondaire (`muted-text`, déjà utilisé dans le widget), seulement quand elle est renseignée.

```
  Marie Dupont
  Responsable administrative
  marie.dupont@exemple.fr   01 23 45 67 89
```

Pourquoi : sans cela, on saisit une information qu'on ne revoit jamais, et un agent ne peut pas choisir le bon interlocuteur parmi plusieurs contacts. Contre : une ligne de plus par contact. Si elle n'est pas affichée, elle reste visible dans la fenêtre de modification. Si Fonction est vide : ne rien afficher (pas de tiret) pour ne pas allonger la carte.

Le nom de classe de cette ligne est à choisir par dev-interface (pas de nom du design system, vérifié par test/styles.test.js).

## 6. Mobile (lisible jusqu'à 400 px) et accessibilité

### 6.1 Mobile

- Sous 560 px, le widget empile déjà les champs d'un contact (`.contact-item { flex-direction: column }`) et réduit les marges (`.card-body { padding: 16px }`). Les boutons « Modifier » et « Supprimer » forment une dernière ligne sous les coordonnées, côte à côte, alignés à gauche. Si les deux ne tiennent pas sur une ligne à 320–400 px, ils passent à la ligne (jamais de texte coupé lettre par lettre, problème déjà rencontré sur « Voir »).
- Aucun défilement horizontal de la fiche : e-mails et noms longs passent à la ligne (`overflow-wrap: anywhere` existe déjà sur `.contact-item`).
- Les fenêtres : un seul bloc vertical, un champ par ligne, boutons Annuler / Valider en bas, pleine largeur ou côte à côte selon ce que donne `modal-footer` du design system à 400 px (à vérifier au rendu). Les champs ne sont jamais sur deux colonnes.
- **Risque à tester — à constater en recette (DEV7)** : le widget est dans un iframe Grist dont la hauteur est réglée sur celle du contenu (`requestResize`, `grist.setHeight`). Une fenêtre modale plus haute que cet iframe serait coupée. À 400 px de large, la fenêtre d'ajout (mention + 5 champs) est haute. Le tableau de bord a le même mécanisme avec 3 champs (`#addActionModal .modal { display: block; overflow-y: auto }`). À vérifier sur une fiche courte (club sans contact ni action) à 400 px ; si la fenêtre est rognée, c'est à signaler à Hanta, pas à contourner.
- Cibles tactiles : les boutons `btn-sm` des lignes doivent rester espacés l'un de l'autre pour qu'on puisse en toucher un sans toucher l'autre (écart minimal de quelques pixels).

### 6.1 bis Largeur des cartes Contacts et Actions — DÉCIDÉ PAR HANTA

**Aujourd'hui** (src/clubs/style.css, lignes 318-323) : les deux cartes sont deux colonnes d'une grille CSS :

```css
.edit-row-lists {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 24px;
  align-items: start;
}
```

Contacts reçoit 1 part, Actions 1,4 part : Contacts fait environ 42 % de la largeur utile, Actions 58 %. Sous 900 px (règle `@media (max-width: 900px) { .edit-row-lists { grid-template-columns: minmax(0, 1fr); } }`, lignes 497-499), les cartes s'empilent. Sous 560 px, `.card-body` passe à 16 px de marge et `.contact-item` empile ses champs (lignes 501-518).

**Décision** : deux moitiés égales, seuil d'empilement inchangé à 900 px, en changeant uniquement la valeur de `grid-template-columns` de cette règle :

```css
grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
```

Pourquoi : chaque ligne de contact reçoit maintenant la fonction et deux boutons (Modifier, Supprimer), elle a besoin de plus de largeur qu'avant. L'écart de gouttière reste à `24px` (valeur déjà en place, égale à `--ft-spacer-m2` du design system ; rien d'ajouté). `minmax(0, …)` est gardé pour que les noms et e-mails longs passent à la ligne au lieu de faire déborder la carte.

Ce que ça donne (largeur utile = largeur du widget − 2 × 24 px de marge de `.edit-layout` − 24 px de gouttière) :

| Largeur du widget | Contacts aujourd'hui | Contacts proposé | Actions aujourd'hui | Actions proposé |
|---|---|---|---|---|
| 1200 px | environ 470 px | environ 570 px | environ 660 px | environ 570 px |
| 992 px | environ 380 px | environ 460 px | environ 540 px | environ 460 px |
| 901 px | environ 340 px | environ 415 px | environ 490 px | environ 415 px |

Chiffres arrondis, calculés à la main sans mesure à l'écran : à constater au rendu. **Contrepartie** : la carte Actions perd environ 90 à 100 px ; ses lignes (date, statut, dispositif, financement, bouton Voir) passeront plus souvent à la ligne (`.action-item` est déjà en `flex-wrap`). À regarder en recette sur un club qui a beaucoup d'actions.

**Mobile et tablette** : inchangé. Sous 900 px, les deux cartes s'empilent, chacune sur toute la largeur : d'abord Contacts, puis Actions (ordre du HTML). Sous 560 px, marges de 16 px et champs de chaque contact empilés ; les boutons Modifier et Supprimer sont sur une dernière ligne (voir §6.1, première puce).

**Points à signaler** :
- Le seuil de 900 px n'est pas un point de rupture du design system (valeurs relevées sur le site le 21/10/2026 : xs 480, sm 576, md 768, lg 992, xl 1200, xxl 1440 px). Il existe déjà dans clubs ; le plus proche est lg (992 px). Hanta a décidé de le garder à 900 px. À 901 px, chaque carte fait environ 415 px, ce qui est suffisant pour la ligne d'un contact.
- **Grille du design system** : je n'ai trouvé sur le site ni colonnes, ni gouttières, ni classes de grille documentées (pages « Espacements » et « Variables CSS » relues). Je ne propose donc pas de classes de grille du design system ; on garde la grille CSS qui existe déjà.
- Les espacements du design system relevés (`--ft-spacer-xs2` 8 px, `--ft-spacer-s2` 16 px, `--ft-spacer-m2` 24 px) correspondent aux valeurs déjà écrites en pixels dans style.css. Cette note n'en demande pas le remplacement (hors tâche).

### 6.2 Accessibilité

Étiquettes
- Chaque champ a un `<label class="form-label" for="…">` visible. L'astérisque d'obligation est `<span class="required">&nbsp;*</span>` (structure du design system). Décision de Hanta : Nom et E-mail sont marqués d'un astérisque, et la phrase « * champ obligatoire » est placée en haut du formulaire (balisage au §7.3). Elle n'existe pas dans la fenêtre d'ajout d'action : c'est un écart voulu.
- Les boutons de ligne ont un `aria-label` qui nomme le contact (§2.1).
- Le bouton d'ajout dit ce qu'il fait : « Ajouter un contact ».

Focus et clavier
- Ouverture : le focus entre dans la fenêtre (champ Nom pour l'ajout et la modification ; bouton Annuler pour la suppression).
- Tab et Maj+Tab tournent entre les contrôles de la fenêtre sans en sortir (le tableau de bord le fait avec `keepFocusInAddAction`). Échap ferme la fenêtre sans enregistrer (pour la suppression : annule). Pas de confirmation à la fermeture : 5 champs seulement, comme l'ajout d'action.
- Fermeture : le focus revient sur le bouton qui avait ouvert la fenêtre. Exceptions : après une modification réussie, sur « Modifier » du même contact ; après une suppression réussie, sur « Ajouter un contact » (le bouton d'origine n'existe plus).
- Après une erreur de saisie : le focus va sur le premier champ en erreur.
- Tout se fait au clavier : Entrée dans un champ valide le formulaire (bouton `type="submit"`) ; Entrée sur « Annuler » l'active.
- Le corps de la page ne défile pas sous la fenêtre ouverte (classe `modal-open` sur `body`, comme au tableau de bord).

Lecteurs d'écran
- Fenêtre d'ajout / modification : `role="dialog"`, `aria-modal="true"`, `aria-labelledby` vers le titre, `aria-describedby` vers la mention « coordonnées professionnelles ».
- Fenêtre de suppression : `role="alertdialog"`, `aria-describedby` vers le texte de confirmation (comme « Suppression d'une action »).
- Erreur de champ : `aria-invalid="true"` + `aria-describedby` vers le message ; préfixer le message d'un `<span class="sr-only">Erreur :&nbsp;</span>` (structure de la page « Input : Avec une erreur »).
- Alertes d'enregistrement : `role="alert"` (annoncée tout de suite). Annonce de réussite : `role="status"` (annoncée poliment), dans une zone `sr-only` (§7.4).
- Valeur absente (téléphone, e-mail) : on garde `missing(...)` : tiret caché aux lecteurs d'écran + texte « Téléphone non renseigné ».
- Pendant l'envoi, le bouton Valider est désactivé : un lecteur d'écran l'annonce « grisé » ; le texte « Enregistrement en cours… » dit pourquoi.
- Contraste : on n'utilise que les couleurs du design system (aucune couleur ajoutée). Le rouge du bouton de confirmation est celui de `btn-supprimer` déjà vérifié au tableau de bord (texte blanc sur fond d'erreur) ; l'état d'erreur n'est jamais porté par la couleur seule.

## 7. Composants du design system et structure HTML exacte

Rappel : pour un nom de classe, la feuille du CDN (https://cdn.francetravail.fr/studio/design-system/css/styles.css) fait foi. dev-interface n'a pas accès au web : tout ce qu'il lui faut est recopié ici. Pages lues le 21/10/2026 (version 1.16.0 du site).

### 7.1 Fenêtre modale

Page : https://designsystem.francetravail.io/components/detail/modal--default.html
La page décrit le composant `<ft-modal configuration="…">` (composant web chargé par ft-autoloader.js, titre dans `<span slot="title">`). **Le projet n'utilise pas ce composant** : le tableau de bord utilise les classes `.modal…` de la feuille, que nous affichons nous-mêmes en ne créant la fenêtre que pendant qu'elle est ouverte. Pour rester cohérent, les contacts font de même. La structure ci-dessous est recopiée de src/actions-dashboard/script.js (`addActionModalHtml`, `deleteDialogHtml`), non de la page du site, qui ne donne pas le balisage interne.

Fenêtre avec formulaire (ajout / modification) — à créer dans un conteneur vide de l'index.html, comme `<div id="addActionModal"></div>` :

```html
<div class="modal-backdrop fade show"></div>
<div class="modal fade show" id="contactDialog" role="dialog" aria-modal="true"
     aria-labelledby="contactDialogTitle" aria-describedby="contactDialogNote" tabindex="-1">
  <div class="modal-dialog">
    <form class="modal-content" id="contactForm" novalidate>
      <div class="modal-header"><h2 class="modal-title" id="contactDialogTitle">Ajout d'un contact</h2></div>
      <div class="modal-body">
        <div class="alert alert-error is-hidden" id="contactMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
        <p class="contact-required-note">* champ obligatoire</p>
        <!-- rappel du club, mention, champs : voir 7.3 -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancelContact"><span class="btn-content">Annuler</span></button>
        <button type="submit" class="btn btn-primary" id="submitContact"><span class="btn-content">Valider</span></button>
      </div>
    </form>
  </div>
</div>
```

Fenêtre de confirmation de suppression :

```html
<div class="modal-backdrop fade show"></div>
<div class="modal fade show" id="deleteContactDialog" role="alertdialog" aria-modal="true"
     aria-labelledby="deleteContactTitle" aria-describedby="deleteContactText" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h2 class="modal-title" id="deleteContactTitle">Suppression d'un contact</h2></div>
      <div class="modal-body">
        <div class="alert alert-error is-hidden" id="deleteContactMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
        <p id="deleteContactText">Êtes-vous sûr de vouloir supprimer le contact <strong>Marie Dupont</strong> ? Cette suppression est définitive : le contact ne pourra pas être récupéré.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancelDeleteContact"><span class="btn-content">Annuler</span></button>
        <button type="button" class="btn btn-primary btn-supprimer" id="confirmDeleteContact"><span class="btn-content">Supprimer</span></button>
      </div>
    </div>
  </div>
</div>
```

(Les identifiants ci-dessus sont des propositions ; le nom du contact doit passer par `escapeHtml`.)

Styles à prévoir côté clubs (src/clubs/style.css ne les a pas ; le tableau de bord les a) :
- `.modal` est masquée par défaut par la feuille du design system ; le tableau de bord la rend visible par `#addActionModal .modal, #deleteActionModal .modal { display: block; overflow-y: auto; }`. Même règle à écrire pour les conteneurs des contacts.
- `.btn-supprimer` (nos propres couleurs d'erreur sur le bouton primaire, car le design system n'a pas de bouton destructeur) : copie de la règle du tableau de bord, avec les mêmes jetons `--ft-color-background-error-default` / `-strong`.
- `.is-hidden` existe déjà dans clubs.
- Si les classes `edit-field` et `add-action-fields` du tableau de bord sont reprises, elles ne sont pas définies dans clubs : soit les définir à l'identique, soit en choisir d'autres. Dans tous les cas, aucun de nos noms ne doit reprendre un nom du design system (test/styles.test.js).

### 7.2 Boutons

Page (relevée dans la fiche du dépôt) : https://designsystem.francetravail.io/components/detail/button--primary.html . Les pages des variantes secondaire et petite taille n'ont pas été relues pour cette note : se fier aux classes déjà utilisées dans clubs.

Structure exacte (déjà utilisée dans clubs et dans le tableau de bord) :

```html
<button class="btn btn-secondary btn-sm" type="button"><span class="btn-content">Modifier</span></button>
```

| Bouton | Classes | Texte |
|---|---|---|
| Ajouter (haut de carte) | `btn btn-secondary btn-sm` | « + Ajouter un contact » (comme « + Ajouter un financeur » au tableau de bord, qui est `btn btn-secondary`) |
| Modifier, Supprimer (ligne) | `btn btn-secondary btn-sm` | « Modifier », « Supprimer » |
| Annuler (fenêtre) | `btn btn-secondary` | « Annuler » |
| Valider (fenêtre) | `btn btn-primary` | « Valider » |
| Confirmer la suppression | `btn btn-primary btn-supprimer` | « Supprimer » |

### 7.3 Champs de formulaire

Pages : https://designsystem.francetravail.io/components/detail/input--default.html , https://designsystem.francetravail.io/components/detail/input--help.html (texte d'aide) , https://designsystem.francetravail.io/components/detail/input--error.html (erreur).

Structure exacte d'un champ obligatoire (page « Input : Paramétrable ») :

```html
<label class="form-label" for="contactNom">Nom<span class="required">&nbsp;*</span></label>
<input class="form-control" id="contactNom" name="contactNom" required type="text">
```

Texte d'aide (page « Avec un texte d'aide ») — pour la mention du §4 :

```html
<p class="help-block" id="contactDialogNote">Saisissez des coordonnées professionnelles (adresse e-mail et téléphone de la structure), pas des coordonnées personnelles.</p>
```

Champ en erreur (page « Avec une erreur ») :

```html
<div class="has-error">
  <label class="form-label" for="contactEmail">E-mail<span class="required">&nbsp;*</span></label>
  <input class="form-control is-invalid" aria-describedby="contactEmailError" id="contactEmail"
         aria-invalid="true" name="contactEmail" required type="email">
  <p class="help-block invalid-feedback" id="contactEmailError"><span class="sr-only">Erreur :&nbsp;</span>Saisissez une adresse e-mail valide, par exemple nom@exemple.fr.</p>
</div>
```

Écart à connaître : la fenêtre « Ajout d'une action » du tableau de bord n'utilise pas exactement cette structure. Elle écrit `<div class="edit-field"><label class="form-label" for="…">…<span class="required">&nbsp;*</span></label><input class="form-control" … aria-describedby="…Error"><div class="invalid-feedback" id="…Error">message</div></div>` : le message est toujours dans le DOM, caché tant que le champ n'a pas `is-invalid`, et le script ajoute `is-invalid` et `aria-invalid="true"` (fonction `markAddActionProblems`). Pas de `has-error`, pas de `help-block`, pas de « Erreur : » pour lecteur d'écran. **Décision de Hanta** : suivre la structure du design system (ci-dessus) pour les contacts, avec le préfixe « Erreur : » pour les lecteurs d'écran ; même fonctionnement que l'existant (messages au clic sur Valider, focus sur le premier champ en erreur).

Phrase d'explication de l'astérisque (décision de Hanta), en haut du corps de la fenêtre, avant le rappel du club. Elle est visible (pas `sr-only`). Nom de classe de mon choix, à confirmer par dev-interface (ne doit pas reprendre un nom du design system) :

```html
<p class="contact-required-note">* champ obligatoire</p>
```

Pour les cinq champs du formulaire :

| Champ | Étiquette | `type` | Obligatoire | Autres attributs |
|---|---|---|---|---|
| Nom | « Nom » | text | oui | `autocomplete="off"` |
| Prénom | « Prénom » | text | non | `autocomplete="off"` |
| E-mail | « E-mail » | email | oui | `autocomplete="off"` |
| Téléphone | « Téléphone » | tel | non | `autocomplete="off"` |
| Fonction | « Fonction » | text | non | `autocomplete="off"` |

Rappel du club dans la fenêtre : un paragraphe simple « Club : [nom du club] » (`p` ordinaire, pas de champ, pas de liste), pour montrer que le club n'est pas modifiable.

### 7.4 Alertes

Pages : https://designsystem.francetravail.io/components/detail/alert--error.html et https://designsystem.francetravail.io/components/detail/alert--success.html .
Le site décrit le composant `<ft-alert version="error">` avec `<p class="alert-title">` et `<p class="alert-content">`. Le projet utilise la version en classes, déjà en place dans le tableau de bord (à reprendre telle quelle pour les erreurs) :

```html
<div class="alert alert-error is-hidden" id="contactMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
```

Réussite : **la classe `alert-success` n'est pas confirmée** (je ne l'ai pas vérifiée dans la feuille du CDN, la fiche du dépôt ne cite que `alert`, `alert-error`, `alert-content` ; et la page « alert--success » du site, relue le 21/10/2026, ne montre que le composant web `<ft-alert version="success">`, sans classe `alert-success`). Ma proposition précédente (`<div class="alert alert-success">`) est donc **retirée**. Solution qui n'en a pas besoin :

1. La fenêtre se ferme.
2. La liste des contacts est relue et mise à jour (le contact ajouté, modifié ou supprimé est visible ou a disparu).
3. Le texte de réussite (§3) est annoncé aux lecteurs d'écran par une zone permanente, vide au départ, placée dans la carte Contacts :

```html
<p class="sr-only" id="contactStatus" role="status" aria-live="polite"></p>
```

   Le script y écrit « Le contact a bien été ajouté. » (ou modifié, supprimé) après chaque réussite. `sr-only` est dans la liste des composants du projet. La zone doit exister dans la page **avant** l'écriture du texte, sinon certains lecteurs d'écran ne l'annoncent pas.
4. Le focus est placé comme décrit au §6.2.

Limite à connaître : une personne qui voit l'écran n'a pas de message écrit ; elle a la fenêtre qui se ferme et la liste qui change. C'est suffisant pour une action aussi courte, mais c'est un écart au tableau de bord (qui n'a pas d'alerte de succès non plus pour l'ajout d'action : à vérifier par dev-interface). Hanta a décidé de ne pas afficher d'alerte de succès.

### 7.5 Composants manquants

- Aucun bouton « destructeur » dans le design system : on garde le contournement déjà documenté du tableau de bord (`btn-supprimer`). Le plus proche est `btn-primary`.
- Pas de composant « liste d'éléments modifiables » : on garde la liste `contact-list` existante, avec boutons à droite de chaque ligne.

## 8. Règles à respecter pour dev-interface

1. Cette note est validée par Hanta (21/10/2026) : elle peut être codée.
2. Une seule tâche : la gestion des contacts dans la fiche du club. Aucune autre modification de clubs.
3. Composants et variables du design system uniquement ; structures HTML du §7 recopiées telles quelles ; pas de nouveau composant ; aucun de nos noms de classe ne reprend un nom du design system (test/styles.test.js).
4. Mêmes mots que le tableau de bord : Annuler, Valider, « Êtes-vous sûr de vouloir supprimer… », « …n'a pas abouti ».
5. Les boutons Ajouter, Modifier, Supprimer sont visibles pour tous les profils. Le widget n'essaie pas de deviner les droits : il tente l'écriture et affiche le message du §3 si Grist refuse. Seule exception (décision de Hanta) : lecture refusée, le bouton « Ajouter un contact » est masqué.
6. Champs écrits : Nom, Prenom, Email, Telephone, Fonction (noms de colonnes de CLAUDE.md). Ne jamais écrire ni renommer les colonnes formules DR et DD de Contacts. Ne jamais changer le club d'un contact existant.
7. Ajout : une seule opération Grist qui envoie toutes les valeurs, club compris (jamais une ligne vide puis remplie). Modification et suppression : uniquement une ligne dont le club est le club ouvert.
8. Nom et E-mail obligatoires ; une valeur faite d'espaces compte comme vide ; les valeurs sont nettoyées des espaces en début et en fin avant l'envoi. E-mail : même règle de forme que `mailHref` (une arobase, rien avant, rien après, pas d'espace) — décision de Hanta : on garde la règle actuelle, sans exiger de point après l'arobase. Pas de contrôle sur Téléphone ni sur Fonction. Pas d'avertissement de doublon.
9. Tout ce qui vient de Grist et qui s'affiche passe par `escapeHtml` / `escapeAttr`, y compris les valeurs pré-remplies dans les champs et le nom dans la fenêtre de suppression.
10. Aucune donnée de contact (nom, e-mail, téléphone) dans la console, dans un message d'erreur affiché, dans un test ou dans la documentation. Données d'exemple : noms et domaines fictifs.
11. Après chaque écriture réussie : relire les contacts depuis Grist pour que la carte reflète l'état réel, laisser la fiche ouverte sur le même club (ne pas revenir à la liste), puis placer le focus comme décrit au §6.2.
12. Le tableau de bord n'est pas touché. La clé `clubs-ouvrir-action-v1` n'est pas concernée.
13. Penser aux tests du comportement (testeur) : champ manquant, e-mail mal formé, succès, refus, échec réseau, annulation (Échap et bouton), retour du focus, échappement du HTML.

## Décisions de Hanta (21/10/2026)

1. Fonction affichée dans la carte Contacts, sous le nom (§5).
2. Table Contacts illisible : bouton « Ajouter un contact » masqué (seul écart à « boutons visibles pour tous »).
3. Bouton de confirmation de suppression : « Supprimer ».
4. E-mail : on garde la règle actuelle de `mailHref`.
5. Erreurs sous les champs : structure du design system, avec « Erreur : » pour les lecteurs d'écran.
6. Champs obligatoires : Nom et E-mail, astérisque, et phrase « * champ obligatoire » en haut du formulaire.
7. Largeur des cartes : deux moitiés égales (`minmax(0, 1fr) minmax(0, 1fr)`), seuil d'empilement inchangé à 900 px (§6.1 bis).
8. Pas d'alerte de succès visible : fenêtre fermée, liste mise à jour, annonce aux lecteurs d'écran (§7.4).
9. Le Journal des évolutions de DEV7 sera rempli par Hanta à la livraison (pas DEV2).

## À constater en recette (DEV7)

- **Texte et reconnaissance du refus de Grist** (§3) : comment Grist signale un refus au widget, et le texte exact à afficher. La création par un profil non propriétaire (règles avec `newRec`) n'a pas encore été testée avec le widget, d'après CLAUDE.md.
- **Hauteur des fenêtres dans l'iframe à 400 px** (§6.1) : à tester sur une fiche courte ; si la fenêtre est rognée, à signaler à Hanta.
- **Carte Actions** après passage à deux moitiés égales (§6.1 bis) : ses lignes se lisent-elles bien sur un club qui a beaucoup d'actions ?
