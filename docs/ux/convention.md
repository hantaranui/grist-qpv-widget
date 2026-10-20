# Convention de partenariat : générer le PDF depuis la fiche d'une action

Public : le chef (pour décider), puis dev-interface (pour coder). Maquette à ouvrir dans le navigateur : [maquette-convention.html](maquette-convention.html).
Sources lues : CLAUDE.md, docs/design-system-france-travail.md, src/actions-dashboard/index.html, script.js (fiche, fenêtres « Ajout » et « Suppression »), style.css, feuille du design system (CDN), pages du site du design system citées plus bas.
Données de la maquette : entièrement fictives. La signature électronique n'en fait pas partie.

Les points qui attendent la réponse du chef sont marqués **[À CONFIRMER]** ; la liste complète est à la fin.

## 1. Qui, quoi, en combien d'étapes

Qui : un agent France Travail qui ouvre la fiche d'une action (profils FT National, Régional, Départemental, ANS), dans les limites de ses droits sur le document.
But : obtenir la convention entre l'agence et le club, en PDF, puis la revoir, la télécharger ou la refaire.

Parcours (génération) :

1. Ouvrir la fiche de l'action (existant).
2. Dans le bloc **Convention**, cliquer sur « Ouvrir la convention ».
3. Dans la fenêtre : relire les informations préremplies, compléter les champs obligatoires.
4. « Enregistrer les informations » (facultatif ici : « Générer le PDF » les enregistre aussi).
5. « Générer le PDF ». La zone PDF passe à « Convention générée le … ».
6. « Voir » ou « Télécharger ». Fermer.

Parcours (convention existante) : étapes 1, 2, puis dans la zone PDF « Voir », « Télécharger » ou « Régénérer » : 3 clics.

Le bouton qui ouvre la fenêtre est dans le bloc Convention, **pas** à côté de Supprimer, Annuler et Enregistrer. Ces trois boutons gardent leur place et leur sens. La fenêtre a ses propres boutons : « Enregistrer les informations » n'enregistre pas la fiche (Intitulé, Statut, etc.), seulement les informations de convention.

## 2. Écran A : bloc « Convention » dans la fiche

Place : sous Statut et Financement, pleine largeur, même style (`edit-card`, `section-head`, `edit-fields`). Voir la maquette, partie A.

Contenu, dans l'ordre :

1. En-tête : « Convention » (même `section-head` que les autres blocs).
2. Une phrase d'état (le texte porte l'information, pas la couleur) :
   - « Aucune convention générée. »
   - « Convention générée le 12/09/2026. »
   - « Pas encore de modèle de convention pour ce dispositif. »
3. Le bouton « Ouvrir la convention » (`btn btn-secondary`, `aria-haspopup="dialog"`). Il reste actif dans les trois états : on peut préparer les informations même sans modèle. [À CONFIRMER] avec le chef si, sans modèle, on masque plutôt le bouton.

Qui voit et modifie : les règles d'accès du document décident ; le widget ne les contourne pas. Si l'utilisateur n'a pas le droit d'écrire dans la table concernée, le bouton « Enregistrer les informations » doit échouer proprement (message d'erreur, voir §5).

Mobile : le bloc passe sous les autres, déjà le cas dans la fiche. Le bouton garde sa taille normale.

## 3. Écran B : fenêtre « Convention »

Structure et comportement repris de la fenêtre « Ajout d'une action » (script.js, `addActionModalHtml`) : `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `tabindex="-1"`, `modal fade show`, formulaire dans `modal-content`. Taille : `modal-lg` (classe présente dans la feuille, max 640 px) avec `modal-dialog-scrollable` pour que le corps défile et que les boutons restent visibles.

Titre (h2, `modal-title`) : « Convention ».
Corps : une phrase « Les champs marqués d'un * sont obligatoires. », puis quatre parties, chacune dans un `fieldset` avec une `legend` en `form-legend` (ou `h3.form-legend` pour la zone PDF). Une seule colonne sur mobile, deux à partir de la largeur de la fenêtre (comme `edit-fields-action`).

### Partie « France Travail » (préremplie, modifiable)

| Champ | Type | Obligatoire | Valeur de départ | Aide |
|---|---|---|---|---|
| Agence | texte | oui | agence de l'action | |
| Représentant de l'agence (nom et prénom) | texte | oui | vide ou dernière valeur enregistrée | |
| Fonction du représentant | texte | oui | idem | |
| Adresse de l'agence | texte | oui | adresse de l'agence si connue | |
| SIRET de l'agence | texte | oui | SIRET de l'agence si connu | « 14 chiffres. » |

Qui peut modifier ces informations : **[À CONFIRMER]** (tout agent qui ouvre la fiche, ou seulement certains profils ?). Les valeurs viennent-elles d'une table existante ou se saisissent-elles ici ? Le dépôt ne le dit pas : je n'ai pas vérifié de colonne « adresse » ou « SIRET » dans les tables Agences ou Structures, et je n'en invente pas. À vérifier dans le modèle de données (dépôt model-de-donnees-aucarre) avant de coder.

### Partie « Club »

| Champ | Type | Obligatoire | Valeur de départ |
|---|---|---|---|
| Nom du club | lecture seule | non | club de l'action |
| Siège du club | lecture seule | non | repris de la fiche du club |
| SIRET du club | lecture seule | non | repris de la fiche du club |
| Signataire du club (nom et prénom) | texte | oui | vide |
| Fonction du signataire | texte | oui | vide |

Nom, siège et SIRET sont préremplis ; la maquette les met en lecture seule (aide : « Repris de la fiche du club. ») pour éviter deux versions de la même information. Si le chef veut les modifier ici, c'est à décider. Si un de ces trois champs est vide dans Grist, il devient modifiable et obligatoire [à valider avec le chef].

### Partie « Convention »

| Champ | Type | Obligatoire | Remarque |
|---|---|---|---|
| Modèle utilisé | lecture seule | non | selon le dispositif **[À CONFIRMER]** : quel modèle pour quel dispositif (5 dispositifs, 3 modèles) |
| Année de la convention | nombre | oui | année en cours proposée |
| Nombre d'opérations | nombre (min 0) | oui | |
| Date de fin de la convention | date | oui | **[À CONFIRMER]** : date fixe (par exemple 31/12 de l'année) ou date libre |
| Contact protection des données du club | courriel | non | **[À CONFIRMER]** : faut-il ce contact, et obligatoire ou non ? |
| Fait à | texte | oui | |
| Date | date | oui | |

Le champ date utilise `<input type="date">` dans la maquette. Le tableau de bord emploie `ft-datepicker` pour la date de statut : dev-interface choisit le même composant pour rester cohérent (voir §7, composant à recopier depuis sa page).

### Zone « PDF » (titre h3 « PDF »)

Trois états, tous visibles dans la maquette (B1, B2, B3) :

| État | Texte affiché | Boutons |
|---|---|---|
| 1. Aucune convention | « Aucune convention n'a encore été générée pour cette action. » + aide « Le PDF reprend les informations ci-dessus. Pensez à enregistrer les informations avant de le générer. » | pas de bouton dans la zone ; « Générer le PDF » dans le pied de la fenêtre |
| 2. Convention générée | « Convention générée le 12/09/2026. » | **Voir** (lien, nouvel onglet), **Télécharger**, **Régénérer** ; plus de « Générer le PDF » dans le pied (il ferait doublon avec Régénérer) |
| 3. Dispositif sans modèle | « Aucune convention n'a été générée pour cette action. » + « Pas encore de modèle de convention pour ce dispositif » | « Générer le PDF » grisé |

Bouton grisé : on utilise `aria-disabled="true"` (pas l'attribut `disabled`), comme le design system, avec `aria-describedby` vers le message visible. Le message reste affiché en permanence : l'infobulle seule n'est pas accessible au clavier ni au toucher.

Régénérer : **[À CONFIRMER]** l'ancien PDF est remplacé, ou on garde un historique. Texte provisoire dans la maquette : « Régénérer crée un nouveau PDF avec les informations actuelles. [À CONFIRMER] : il remplace l'ancien, ou s'ajoute à l'historique. » Si remplacement, proposer une confirmation avant d'écraser (même modèle que la fenêtre de suppression : « Une convention existe déjà. La remplacer par un nouveau PDF ? », boutons « Annuler » / « Remplacer »).

Pied de la fenêtre (`modal-footer`), de gauche à droite : « Fermer » (secondaire), « Enregistrer les informations » (secondaire), « Générer le PDF » (principal, un seul bouton principal).

### Une convention pour une action, ou pour plusieurs ? **[À CONFIRMER]**

La maquette montre une convention par action (c'est la demande). Si la convention couvre toutes les actions d'un club, le bloc et la fenêtre devraient plutôt partir de la fiche du club, et le champ « Nombre d'opérations » se calculerait. Ce choix change le parcours : à trancher avant de coder.

## 4. Textes affichés (tous, pour dev-interface)

- Bloc : « Convention » ; « Aucune convention générée. » ; « Convention générée le [date]. » ; « Pas encore de modèle de convention pour ce dispositif. » ; bouton « Ouvrir la convention ».
- Fenêtre : « Convention » ; « Les champs marqués d'un * sont obligatoires. » ; « France Travail » ; « Club » ; « Convention » ; « PDF ».
- Libellés : voir les tableaux du §3.
- Aides : « 14 chiffres. » ; « Repris de la fiche du club. » ; « Choisi selon le dispositif de l'action. »
- Boutons : « Fermer », « Enregistrer les informations », « Générer le PDF », « Voir », « Télécharger », « Régénérer ». Textes cachés pour lecteurs d'écran (`sr-only`) : « Voir la convention (s'ouvre dans un nouvel onglet) », « Télécharger la convention (PDF) », « Régénérer la convention ».
- Erreur de champ (sous le champ, après `sr-only` « Erreur : ») : « Saisissez [le libellé en minuscules]. » (ex. « Saisissez le nom du signataire. »). SIRET : « Le SIRET doit comporter 14 chiffres. » Date de fin : « La date de fin doit être postérieure à la date de la convention. » [règle à confirmer avec le chef].
- Alerte d'erreur en haut du corps (`alert alert-error`, `role="alert"`) : « Certains champs sont à corriger. » ; échec d'enregistrement : « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » ; échec de génération : « Le PDF n'a pas pu être généré. Vos informations sont conservées. »
- Succès (`alert alert-success`, `role="status"`) : « Informations enregistrées. » ; « Convention générée. »
- Chargement : sur le bouton, pendant la génération, « Génération en cours… » (le bouton reste en place, `aria-disabled="true"`).

## 5. États de la fenêtre

| État | Ce que voit l'agent |
|---|---|
| Ouverture | Focus sur le premier champ modifiable (« Agence »). |
| Champs invalides | Alerte d'erreur en haut, champs en `is-invalid`, messages sous chaque champ, focus sur le premier champ à corriger. |
| Enregistrement en cours / réussi / échoué | Bouton en attente ; message de succès ou d'erreur dans le corps. |
| Génération en cours | « Génération en cours… », champs inchangés. |
| Génération réussie | Zone PDF en état 2, message de succès. |
| Dispositif sans modèle | Zone PDF en état 3. |
| Droits insuffisants en écriture | Message d'erreur à l'enregistrement ; les boutons de lecture (Voir, Télécharger) restent utilisables. |

## 6. Accessibilité (RGAA) et mode sombre

- Titres : h1 de la fiche (existant) → h2 « Convention » de la fenêtre → h3 « PDF ». Les trois autres parties sont des `legend` de `fieldset`.
- Chaque champ a un `label` lié (`for` / `id`). Obligatoire : astérisque dans `span.required` **et** attribut `required` ; la phrase d'introduction explique l'astérisque.
- Champ en lecture seule : `readonly` (il reste atteignable au clavier et lu par les lecteurs d'écran), avec son aide.
- Erreurs : `is-invalid`, `aria-invalid="true"`, `aria-describedby` vers le message ; l'information n'est jamais portée par la couleur seule (texte « Erreur : » en `sr-only`).
- Focus : à l'ouverture, sur le premier champ ; Tab et Maj+Tab tournent dans la fenêtre ; **Échap ferme** (comme `keepFocusInAddAction`) ; à la fermeture, le focus revient sur le bouton « Ouvrir la convention ». Si des informations non enregistrées existent, Échap demande confirmation [à valider avec le chef].
- Ordre de lecture = ordre visuel : introduction, France Travail, Club, Convention, PDF, boutons du pied.
- Le lien « Voir » ouvre un nouvel onglet : le dire dans le texte (`sr-only`).
- Bouton grisé : `aria-disabled` + message visible relié par `aria-describedby`.
- Mode clair / sombre : n'utiliser que des variables `--ft-…` ou des classes du design system, aucune couleur écrite en dur. **Constat** : style.css déclare `color-scheme: light` (ligne 2) ; le tableau de bord n'est donc pas conçu pour le mode sombre aujourd'hui. Je n'ai pas pu vérifier le rendu en mode sombre : à tester par Hanta. La maquette n'ajoute aucune couleur.
- Cible tactile et zoom 200 % : la fenêtre défile (`modal-dialog-scrollable`), rien n'est coupé.

## 7. Données personnelles (RGPD)

Seules données de personnes demandées : **nom, prénom et fonction** du représentant de l'agence et du signataire du club, strictement nécessaires pour désigner qui signe. Rien d'autre (ni téléphone, ni adresse personnelle, ni date de naissance).
- Le contact « protection des données » du club : demander une **adresse de messagerie fonctionnelle** (ex. contact du club) plutôt qu'un nom de personne [À CONFIRMER].
- Le champ Commentaire de la fiche reste interdit pour noter des données de personnes ; la convention n'en reprend pas le contenu.
- Le PDF contient ces noms : où est-il stocké, pour combien de temps ? Question ouverte pour le chef (voir §9).
- Données de la maquette : fictives.

## 8. Composants du design system utilisés

Sources : feuille https://cdn.francetravail.fr/studio/design-system/css/styles.css (fait foi pour les noms de classes) et pages du site. Les structures ci-dessous sont celles lues sur les pages du site ou, quand la page n'en donne pas, celles déjà employées par le tableau de bord (indiquées).

### Fenêtre modale
Page : https://designsystem.francetravail.io/components/detail/modal--default.html (tailles : modal--sm, modal--lg, modal--xl ; fermeture au clic sur le fond).
La page décrit un composant web `ft-modal`, qui n'est pas ce que le tableau de bord utilise : il emploie les classes de la feuille (`.modal`, `.modal-dialog`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-title`, `.modal-backdrop`). On garde ce choix, déjà testé dans les fenêtres existantes. Structure (reprise de script.js, `addActionModalHtml`, avec `modal-lg modal-dialog-scrollable` en plus : ces deux classes existent dans la feuille, vérifié) :

```html
<div class="modal-backdrop fade show"></div>
<div class="modal fade show" id="conventionDialog" role="dialog" aria-modal="true" aria-labelledby="conventionTitle" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-scrollable">
    <form class="modal-content" id="conventionForm" novalidate>
      <div class="modal-header"><h2 class="modal-title" id="conventionTitle">Convention</h2></div>
      <div class="modal-body"> … </div>
      <div class="modal-footer"> … boutons … </div>
    </form>
  </div>
</div>
```

Comme pour les fenêtres existantes, la feuille masque `.modal` : on ne l'insère dans la page que pendant qu'elle est ouverte et on lui donne `display: block` (voir style.css, `#addActionModal .modal`). La maquette n'insère pas `modal-backdrop` pour pouvoir empiler les trois états.

### Champ de formulaire
Page : https://designsystem.francetravail.io/components/detail/input--default.html

```html
<label class="form-label" for="form-input_14116745">
  Libellé de l'élément<span class="required">&nbsp;*</span></label>
<input class="form-control" id="form-input_14116745" name="form-input_14116745" required type="text">
```

Lecture seule (page input--readonly.html) : même structure avec l'attribut `readonly`.

```html
<label class="form-label" for="form-input_423258228">
  Libellé de l'élément<span class="required">&nbsp;*</span></label>
<input class="form-control" id="form-input_423258228" name="form-input_423258228" readonly required type="text" value="Contenu en lecture seule">
```

Avec texte d'aide (page input--help.html) :

```html
<label class="form-label" for="form-input_759109844">
  Libellé de l'élément<span class="required">&nbsp;*</span>
</label>
<input class="form-control" aria-describedby="help-form-input_759109844" id="form-input_759109844" name="form-input_759109844" required type="text">
<p class="help-block" id="help-form-input_759109844">
  Message d'aide à la saisie
</p>
```

Avec erreur (page input--error.html) :

```html
<div class="has-error">
  <label class="form-label" for="form-input_810592907">
    Libellé de l'élément<span class="required">&nbsp;*</span></label>
  <input class="form-control is-invalid" aria-describedby="error-form-input_810592907" id="form-input_810592907" aria-invalid="true" name="form-input_810592907" required type="text">
  <p class="help-block invalid-feedback" id="error-form-input_810592907">
    <span class="sr-only">Erreur:&nbsp;</span>Message d'erreur
  </p>
</div>
```

Le tableau de bord écrit `<div class="invalid-feedback">` sous le champ (fenêtre « Ajout ») ; on suit la page ci-dessus pour les nouveaux champs. Champs numérique et date : mêmes classes avec `type="number"` / `type="date"` (la page ne montre que `type="text"`). Pour la date, le tableau de bord emploie `<ft-datepicker>` (script.js, `statusPeriodControl`) :

```html
<ft-datepicker class="edit-status-period" data-period-kind="date" data-iso-value="…" value="…"><span slot="label">Libellé</span></ft-datepicker>
```

dev-interface doit relire cette page-là (https://designsystem.francetravail.io/ , composant « datepicker ») avant de choisir. Je ne l'ai pas lue : **non vérifié**.

### Boutons
Page : https://designsystem.francetravail.io/components/detail/button--primary.html

```html
<button class="btn btn-primary" id="button_554967335" type="button">
  <span class="btn-content">Je suis un bouton</span>
</button>
```

Secondaire : `btn btn-secondary` (employé dans script.js). Petit : `btn-sm` (employé dans script.js, page button--small.html non lue). Désactivé (page button--disabled.html) :

```html
<button aria-disabled="true" class="btn btn-secondary" id="button_743220664" type="button"
        data-ft-tooltip="Infobulle expliquant pourquoi l'élément est désactivé" data-ft-placement="bottom">
  <span aria-hidden="true" class="icon icon-pencil"></span>
  <span class="btn-content">Bouton désactivé</span>
</button>
```

Le script `disabled-a11y.js` du design system bloque les clics sur `aria-disabled="true"` : à vérifier qu'il est bien chargé par l'autoloader dans le widget, sinon bloquer le clic dans notre script. « Voir » est un lien : `<a class="btn btn-secondary btn-sm" href="…" target="_blank" rel="noopener">` (classes `btn` sur un `a` : à contrôler sur la page button--link.html, non lue).

### Alertes
Page : https://designsystem.francetravail.io/components/detail/alert--default.html. La page montre le composant web `<ft-alert><p class="alert-title">…</p></ft-alert>`. Le tableau de bord utilise la forme à classes, qu'on reprend :

```html
<div class="alert alert-error is-hidden" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
```

Succès : `alert alert-success` (classe présente dans la feuille), avec `role="status"`.

### Autres classes utilisées
`form-legend` (titre d'un groupe de champs, déjà employée dans la fiche), `help-block` et `required` (voir ci-dessus), `sr-only` (texte pour lecteurs d'écran). Barre de progression, badge, tag : non utilisés.

### Ce qui manque au design system (signalé, non fabriqué)
- Pas de composant « bloc de fiche » : on reprend les classes du widget (`edit-card`, `section-head`, `edit-fields`, `edit-field`).
- Trois petites classes du widget sont à créer par dev-interface, sans nom du design system : `convention-part` (fieldset sans bordure), `convention-fields` (grille à deux colonnes), `convention-pdf-actions` (rangée de boutons). Leurs règles sont dans le `<style>` de la maquette.
- Pas de composant de téléchargement ou d'aperçu de PDF : on utilise des boutons et un lien.

## 9. Risques techniques et questions ouvertes (à noter pour dev-interface)

- Le widget tourne dans un cadre (iframe) de Grist : « Voir » dans un nouvel onglet et « Télécharger » peuvent être bloqués selon le navigateur. À tester dans Grist DEV.
- Où stocker le PDF et les informations (nouvelle table ou colonnes dans Grist) : le modèle de données est partagé par plusieurs widgets, rien ne doit être renommé et toute nouvelle colonne est à faire valider. Non décidé ici.
- Générer un PDF demande probablement une bibliothèque ou un service : « aucune dépendance sans l'accord de Hanta » (CLAUDE.md). À proposer avec avantages, risques et effort avant tout code.
- Dispositifs et modèles : « 5 dispositifs, 3 modèles » ; seuls 3 noms de modèles sont donnés. Je n'ai pas la liste des 5 dispositifs, donc pas de correspondance dans la maquette.

## 10. Liste des [À CONFIRMER]

1. Une convention pour **une action**, ou pour **plusieurs actions d'un club** (point de départ : la fiche d'action ou la fiche du club) ?
2. **Quel modèle pour quel dispositif** (5 dispositifs, 3 modèles) ?
3. **Qui peut modifier** les informations France Travail (représentant, fonction, adresse, SIRET), et d'où viennent leurs valeurs de départ ?
4. **Date de fin** : fixe (laquelle ?) ou libre ? Règle de contrôle par rapport à la date de la convention.
5. **Contact protection des données** côté club : nécessaire ? obligatoire ? adresse fonctionnelle plutôt que nom de personne ?
6. **Régénération** : remplacement de l'ancien PDF (avec confirmation) ou historique des versions ?
7. Sans modèle : le bouton « Ouvrir la convention » reste-t-il visible, ou est-il masqué ?
8. Stockage et durée de conservation du PDF (noms de signataires dedans).
