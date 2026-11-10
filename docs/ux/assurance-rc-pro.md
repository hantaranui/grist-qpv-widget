# Note UX — Assurance RC Pro d'un club : déposer, remplacer, consulter

Widgets : clubs (src/clubs/) ET tableau de bord (src/actions-dashboard/).
Sprint : E5 (docs/backlog.md, lignes 372-408, décisions E5-1 à E5-8 toutes tranchées).
Statut : VALIDÉE sur les points de cadrage. Hanta a répondu aux questions de la version précédente (backlog E5-10) ; les décisions sont intégrées ci-dessous et signalées « (décision Hanta, E5-10) ». Les maquettes restent à valider au rendu.
Sources lues : CLAUDE.md, docs/backlog.md (Sprint E5), docs/ux/contacts-fiche-club.md (modèle de la fenêtre), docs/ux/convention.md (dépôt d'un PDF), src/clubs/script.js (fiche club, ligne 425 et suivantes), src/actions-dashboard/script.js (fiche action, lignes 748-785 ; bloc Convention, lignes 2960-3020), feuille du CDN du design system (lecture partielle, voir §9).
Aucun nom de colonne Grist n'est cité : ils sont à définir par dev-backend. Cette note dit seulement ce qui s'affiche.

## 1. Point de départ

- Qui : un agent France Travail (National, Régional, Départemental) qui a besoin de l'attestation d'assurance RC Pro d'un club. Le club l'a envoyée par e-mail ; l'agent la dépose dans l'application.
- Ce que l'agent veut : (a) savoir tout de suite si l'attestation du club est là et encore valable ; (b) l'ouvrir ; (c) la déposer ou la remplacer. En 2 clics pour voir l'état, 4 étapes pour déposer.
- Le document appartient au CLUB (E5-1) : la même information et le même pop-up sont proposés dans la fiche du club et dans la fiche d'une action. Un club avec 5 actions a un seul document.
- Pas de lecture automatique du PDF (E5-3) : la date d'expiration est saisie à la main. Pas de suppression (D) : seulement un remplacement, qui écrase l'ancien sans historique (E5-2).
- Lecture refusée (décision Hanta, E5-12) : si Grist refuse de lire les colonnes RC Pro, quel que soit le profil, le bloc « Assurance RC Pro » entier est ABSENT de la fiche, silencieusement : ni message d'erreur, ni bloc vide, ni bouton, ni annonce aux lecteurs d'écran. Même principe que `hasRaisonColumn()` déjà utilisé dans le projet. Ce cas est distinct de l'état « absent » (§4), où la lecture réussit mais aucun document n'est déposé : le bloc s'affiche alors avec « Aucune attestation… » et son bouton. Voir §6 point 7 et §8 règle 12.
- Droits : ce sont les règles d'accès de Grist qui décident (E5-8 : les nouvelles colonnes héritent de la protection de Structures). L'écran ne cache rien selon le profil ; il prévoit le message quand Grist refuse (§5.3). Le bloc n'a aucun traitement spécifique lié à un nom de profil (décision Hanta, E5-11 : aucun compte ANS n'est utilisé dans ce document pour ce sprint, ce cas est ignoré).

## 2. Parcours

### 2.1 Voir l'état (fiche club ou fiche action)

1. L'agent ouvre la fiche d'un club (bouton Voir de la liste) ou la fiche d'une action.
2. Dans la carte « Club », un bloc « Assurance RC Pro » dit l'état en une phrase : absent, valide jusqu'à une date, ou expiré depuis une date, avec la date de dépôt.
3. Si un document existe, « Voir l'attestation » l'ouvre dans un nouvel onglet. Un document expiré s'ouvre aussi (E5-7 Q3).

### 2.2 Déposer le premier document (état « absent », 5 étapes)

1. Clic sur « Déposer l'attestation » dans le bloc.
2. Le pop-up « Dépôt de l'assurance RC Pro » s'ouvre ; le focus est sur le champ fichier.
3. L'agent choisit le PDF et saisit la date d'expiration (les deux sont obligatoires).
4. Clic sur « Déposer ». Si un champ est en erreur : le pop-up reste ouvert, le premier champ en erreur reçoit le focus, rien n'est envoyé.
5. Réussite : le pop-up se ferme, le bloc affiche le nouvel état, une annonce est faite aux lecteurs d'écran, le focus va sur « Voir l'attestation ». Refus ou échec : le pop-up reste ouvert avec une alerte.

### 2.3 Remplacer (états « valide » ou « expiré », 5 étapes)

Même chose, avec le bouton « Remplacer l'attestation » (proposé même si le document est encore valide, E5-7 Q4). Le pop-up s'appelle « Remplacement de l'assurance RC Pro », il rappelle, par un simple texte, que l'ancien document sera remplacé et ne pourra pas être récupéré (pas de confirmation séparée, décision Hanta, E5-10), et son bouton s'appelle « Remplacer ». Le champ date est vide, jamais pré-rempli avec l'ancienne date (décision Hanta, E5-10). Réussite : le focus reste sur « Remplacer l'attestation » (le bouton existe toujours).

## 3. Maquettes en texte

### 3.1 Bloc dans la fiche du club (carte « Club », sous les zonages QPV / FRR)

Emplacement (décision Hanta, E5-10 : dans la carte « Club » existante, pas de nouvelle carte) : dans la carte « Club » de la fiche club (src/clubs/script.js, `section.edit-card` dont l'en-tête est « Club »), après la note sur le FRR (`p.zonage-note`), séparé d'un filet ou d'un espace. Pas de nouvelle carte : la carte Contacts / Actions et le bandeau commun ne bougent pas.

État absent :
```
 Assurance RC Pro
 Aucune attestation d'assurance RC Pro déposée.
 [ Déposer l'attestation ]
```
État présent et valide :
```
 Assurance RC Pro
 Attestation valide jusqu'au 31/12/2027.
 Déposée le 10/11/2026.
 [ Voir l'attestation ]  [ Remplacer l'attestation ]
```
État présent et expiré :
```
 Assurance RC Pro
 Attestation expirée le 30/06/2026.
 Déposée le 10/11/2025.
 [ Voir l'attestation ]  [ Remplacer l'attestation ]
```
(Dates fictives. Format de date : le même que le reste du widget, jj/mm/aaaa.)

### 3.2 Bloc dans la fiche de l'action (carte « Club » de la fiche action)

Emplacement : dans la carte « Club » de la fiche de modification d'une action (src/actions-dashboard/script.js, `section.edit-card` d'en-tête « Club », qui contient aujourd'hui « Club : » et « Fédération : »), après la ligne Fédération. Mêmes phrases, mêmes boutons, même ordre que §3.1 : l'agent retrouve les mêmes mots partout. C'est ce résumé et ses boutons qui évitent d'ouvrir la fiche club. Il ne s'agit pas d'un lien vers la fiche club.

```
 Club : Nom du club
 Fédération : Nom de la fédération
 Assurance RC Pro : attestation expirée le 30/06/2026. Déposée le 10/11/2025.
 [ Voir l'attestation ]  [ Remplacer l'attestation ]
```
Proposition de présentation : même style que les lignes « Club : » et « Fédération : » (étiquette en `strong`, comme le reste de la carte), puis la phrase, puis les boutons sur leur propre ligne. Les phrases exactes sont celles du §4.

### 3.3 Le pop-up (identique dans les deux widgets)

```
┌──────────────────────────────────────────────────┐
│ Dépôt de l'assurance RC Pro                       │  (ou « Remplacement de l'assurance RC Pro »)
├──────────────────────────────────────────────────┤
│ ┌ alerte d'erreur (cachée tant qu'il n'y a pas    │
│ │ d'erreur d'enregistrement)                      │
│ └─────────────────────────────────────────────────│
│ * champ obligatoire                               │
│ Club : Nom du club (non modifiable)               │
│                                                   │
│ [Remplacement seulement] Le document actuel sera  │
│ remplacé par le nouveau et ne pourra pas être     │
│ récupéré.                                         │
│                                                   │
│ Attestation d'assurance RC Pro (PDF) *            │
│ PDF uniquement, 10 Mo au maximum.                 │
│ [ Choisir un fichier ]  aucun fichier choisi      │
│                                                   │
│ Date d'expiration *                               │
│ Date indiquée sur l'attestation. Une date passée  │
│ est acceptée : le document sera alors affiché     │
│ « expirée ».                                      │
│ [ jj/mm/aaaa ]                                    │
├──────────────────────────────────────────────────┤
│                       [ Annuler ]  [ Déposer ]    │  (ou [ Remplacer ])
└──────────────────────────────────────────────────┘
```
Pas de pré-remplissage du fichier (impossible dans un navigateur). Pas de lecture du contenu du PDF (E5-3). Le rappel « Club : » nomme le club concerné : indispensable dans la fiche action, où l'agent pourrait croire que le document concerne l'action.

Avec erreurs (fichier manquant, date manquante) :
```
│ Attestation d'assurance RC Pro (PDF) *            │
│ PDF uniquement, 10 Mo au maximum.                 │
│ [ Choisir un fichier ]  aucun fichier choisi  ← bordure d'erreur
│ ⚠ Erreur : Choisissez le fichier PDF de           │
│   l'attestation.   ("Erreur :" = sr-only)         │
│ Date d'expiration *                               │
│ [ jj/mm/aaaa ]                                ← bordure d'erreur
│ ⚠ Erreur : Saisissez la date d'expiration de      │
│   l'attestation.                                  │
```
L'erreur n'est jamais portée par la couleur seule : texte sous le champ + `aria-invalid="true"`.

### 3.4 Version mobile (400 px)

- Bloc : phrase d'état sur une ou deux lignes, puis les boutons l'un sous l'autre ou côte à côte selon la place. Les libellés ne sont jamais coupés (problème déjà rencontré sur « Voir ») : le passage à la ligne se fait entre les boutons (`flex-wrap`). « Voir l'attestation » en premier.
- Pop-up : un seul bloc vertical, un champ par ligne ; Annuler / Déposer en bas, comme la fenêtre « Ajout d'un contact ». Deux champs seulement : plus court que la fenêtre contact, donc moins de risque de rognage dans l'iframe de Grist (risque déjà vérifié sans problème pour les contacts en recette du 21/10/2026).
- Le champ date natif ouvre le sélecteur de date du téléphone.

## 4. Textes exacts des trois états (valables sur les DEUX fiches)

| État | Phrase affichée | Date de dépôt | Boutons (dans l'ordre) |
|---|---|---|---|
| Absent | « Aucune attestation d'assurance RC Pro déposée. » | aucune | « Déposer l'attestation » |
| Présent et valide | « Attestation valide jusqu'au [date d'expiration]. » | « Déposée le [date de dépôt]. » | « Voir l'attestation » · « Remplacer l'attestation » |
| Présent et expiré | « Attestation expirée le [date d'expiration]. » | « Déposée le [date de dépôt]. » | « Voir l'attestation » · « Remplacer l'attestation » |
| Présent sans date d'expiration | « Attestation expirée : date d'expiration non renseignée. » | « Déposée le [date de dépôt]. » si elle existe, sinon rien | « Voir l'attestation » · « Remplacer l'attestation » |

Règles :
- Deux dates seulement, expiration et dépôt (E5-7 Q1). Pas de « dernière mise à jour ».
- L'état est porté par les MOTS (« valide », « expirée »), jamais par une couleur ni par une icône seule. Pour l'état expiré, le mot « expirée » peut être mis en `strong` pour ressortir sans couleur. Aucune couleur n'est demandée.
- Dans la fiche action, la phrase est précédée de l'étiquette « Assurance RC Pro : » (§3.2) ; dans la fiche club, du titre « Assurance RC Pro » (§3.1). Le texte de la phrase ne change pas.
- Document sans date d'expiration : il est traité comme « expiré » (décision Hanta, E5-10) et affiche la phrase de la dernière ligne du tableau. Il reste consultable et remplaçable. Si la date de dépôt manque aussi, la ligne « Déposée le… » est omise.
- « Voir l'attestation » est un bouton qui ouvre le PDF dans un nouvel onglet à une adresse blob:, comme « Voir la convention » (docs/ux/convention.md) ; texte caché pour lecteurs d'écran « (s'ouvre dans un nouvel onglet) » ; pendant l'ouverture : « Ouverture en cours… ». Mêmes contraintes de sécurité que la convention (CLAUDE.md) : l'identifiant de la pièce jointe et le jeton ne s'affichent jamais, ne vont jamais dans la console ni dans un message.
- Échec d'ouverture : « L'attestation n'a pas pu être ouverte. Réessayez. Si le problème continue, vos droits ne permettent peut-être pas de la consulter. » (`role="alert"`, dans le bloc).

## 5. Messages

### 5.1 Annonces de réussite (zone `sr-only`, pas d'alerte de succès visible, comme pour les contacts)

| Situation | Texte annoncé (`role="status"`) |
|---|---|
| Premier dépôt réussi | « L'attestation d'assurance RC Pro a bien été déposée. » |
| Remplacement réussi | « L'attestation d'assurance RC Pro a bien été remplacée. » |

La preuve visuelle de la réussite : le pop-up se ferme et la phrase d'état du bloc change. La zone d'annonce existe dans la page avant l'écriture du texte (voir docs/ux/contacts-fiche-club.md §7.4). Même mécanisme : `alert-success` n'est pas confirmé dans la feuille (voir §9), on ne l'emploie pas.

### 5.2 Erreurs de saisie (sous le champ, rien n'est envoyé)

| Cas | Champ | Texte |
|---|---|---|
| Aucun fichier choisi | Fichier | « Choisissez le fichier PDF de l'attestation. » |
| Fichier qui n'est pas un PDF | Fichier | « Ce fichier n'est pas un PDF. Choisissez un fichier au format PDF. » |
| Fichier vide | Fichier | « Ce fichier est vide. Choisissez un autre fichier. » |
| Fichier de plus de 10 Mo | Fichier | « Ce fichier dépasse 10 Mo. Choisissez un fichier plus léger. » |
| Date vide | Date | « Saisissez la date d'expiration de l'attestation. » |
| Date illisible ou mal formée | Date | « Saisissez une date valide, au format jj/mm/aaaa. » |

Une date dans le passé n'est PAS une erreur (E5-7 C) : le pop-up s'enregistre et le bloc affiche « expirée » (mention dans le texte d'aide du champ, §3.3). Mêmes limites que la convention : PDF seulement, 10 Mo = 10 × 1024 × 1024 octets, vide refusé.

### 5.3 Refus et échecs (alerte en haut du pop-up, `role="alert"`)

| Situation | Texte |
|---|---|
| Refus de Grist (droits) | « Vous n'avez pas les droits pour déposer l'attestation de ce club. Rien n'a été enregistré. Rapprochez-vous de l'équipe qui gère le document. » |
| Échec réseau | « L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez. » |
| Autre échec (message de repli) | « L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez. Si le problème continue, vos droits ne permettent peut-être pas de déposer l'attestation de ce club. » |
| Envoi en cours | Le bouton est désactivé, son texte devient « Enregistrement en cours… » |

Règles : ne jamais afficher le texte brut de l'erreur Grist (il peut contenir un identifiant de pièce jointe ou un jeton) ; message fixe. Un seul enregistrement : le fichier ET la date partent ensemble, pour qu'il n'y ait jamais « fichier sans date » ni l'inverse (cohérent avec la Convention, CLAUDE.md : « chaque paire en une seule requête »). Le détail technique est à voir avec dev-backend.

## 6. Calcul de l'état (ce qui doit s'afficher)

La fonction est proposée par dev-backend ; cette note ne la décrit pas. Ce que l'écran attend d'elle, pour un club donné :

1. Un état parmi trois : absent, valide, expiré (un document sans date d'expiration compte comme expiré).
2. La date d'expiration et la date de dépôt, quand le document existe.
3. Une possibilité d'ouvrir le fichier, quel que soit l'état (E5-7 Q3).
4. La validité est jugée à la date du JOUR de l'affichage (E5-7 Q2), pas à la date de l'action. Les deux widgets doivent donner le même état pour le même club le même jour.
5. Le jour de la date d'expiration est inclus : un document qui expire le 31/12/2027 est « valide jusqu'au 31/12/2027 » et devient « expiré » le 01/01/2028 (décision Hanta, E5-10). La fonction de calcul et la phrase doivent être d'accord.
6. Document sans date d'expiration : état « expiré » (décision Hanta, E5-10).
7. Lecture des colonnes RC Pro refusée par Grist (décision Hanta, E5-12) : aucun état n'est calculé, et le bloc n'est pas affiché du tout (voir §1). Ne pas confondre avec « absent ».

Quand l'état change (dépôt, remplacement), le bloc est recalculé et réaffiché sans quitter la fiche ni recharger la liste. Dans le tableau de bord, la fiche action reste ouverte.

## 7. Accessibilité

- Chaque champ a une étiquette visible `label.form-label` reliée par `for`. Fichier : « Attestation d'assurance RC Pro (PDF) » ; date : « Date d'expiration ». Astérisque `<span class="required">&nbsp;*</span>` sur les deux, et « * champ obligatoire » en haut du formulaire, comme la fenêtre « Ajout d'un contact ».
- Consignes (« PDF uniquement, 10 Mo au maximum. » ; texte d'aide de la date) dans des `p.help-block` reliés au champ par `aria-describedby`.
- Le champ fichier est VISIBLE et natif (contrairement à la convention où il est caché derrière un bouton) : c'est le seul moyen de dire quel fichier a été choisi, et il se manipule au clavier (Entrée ou Espace ouvre le sélecteur).
- Champ date : `type="date"` natif (clavier et sélecteur du navigateur), `autocomplete="off"`. Un champ date natif qui contient une valeur incomplète renvoie une valeur vide : le message « date vide » est alors affiché ; l'erreur « mal formée » reste prévue pour les navigateurs qui laissent saisir du texte libre.
- Pop-up : `role="dialog"`, `aria-modal="true"`, `aria-labelledby` vers le titre, `aria-describedby` vers la phrase d'information (le rappel du club et, au remplacement, l'avertissement d'écrasement).
- Focus : à l'ouverture, sur le champ fichier. Tab et Maj+Tab tournent dans la fenêtre. Échap et Annuler ferment sans rien enregistrer. À la fermeture sans enregistrement : retour sur le bouton qui a ouvert le pop-up. Après un dépôt réussi : sur « Voir l'attestation » (le bouton « Déposer l'attestation » a disparu). Après un remplacement réussi : sur « Remplacer l'attestation ». Après une erreur de saisie : sur le premier champ en erreur. Entrée dans la date valide le formulaire (bouton `type="submit"`).
- Erreurs de champ : `aria-invalid="true"` + `aria-describedby` vers le message ; préfixe `<span class="sr-only">Erreur :&nbsp;</span>`.
- Le corps de la page ne défile pas sous le pop-up (`modal-open` sur `body`, comme au tableau de bord et dans les contacts).
- Les boutons du bloc ont des noms complets (« Remplacer l'attestation »), compréhensibles hors contexte. Dans la fiche action, le bloc est introduit par l'étiquette « Assurance RC Pro : » ; pas besoin de `aria-label`.
- Annonce de l'état : le bloc a une zone `p.sr-only` `role="status"` (§5.1) vide au départ.
- Contraste : aucune couleur ajoutée ; l'état n'est jamais porté par la couleur seule.

## 8. Règles à respecter pour dev-interface

1. Accord pour modifier la fiche club : donné explicitement par Hanta (E5-10) pour cette tâche seulement (bloc RC Pro dans la carte « Club »). Toute autre modification de clubs redemande son accord.
2. Bandeau commun : ne pas y toucher (E5-7 H). La balise du bandeau de clubs et son `data-titre="Liste des clubs sportifs"` restent tels quels. Le bloc RC Pro est dans le corps de la fiche, pas dans l'en-tête.
3. Composants du design system uniquement : mêmes que la fenêtre « Ajout d'un contact » (§9). Aucun nom de classe à nous ne reprend un nom du design system (test/styles.test.js).
4. Le pop-up est le MÊME dans les deux widgets : mêmes titres, mêmes champs, mêmes textes, mêmes boutons. Les sources étant séparées (clubs / tableau de bord), le code est dupliqué : dev-interface le signale et garde les textes strictement identiques (constantes en tête de fichier, règle de CLAUDE.md).
5. Boutons visibles pour tous les profils qui peuvent lire : on tente l'écriture ; si Grist refuse, message du §5.3. Le code ne teste jamais le nom du profil et le bloc n'a aucun traitement spécifique lié à un profil (décision Hanta, E5-11).
6. Écriture en une seule opération (fichier + date), jamais en deux temps. Le détail (noms de colonnes, REST) vient de dev-backend ; aucun nom de colonne n'est inventé ici.
7. Le jeton et l'identifiant de pièce jointe ne s'affichent jamais, ne vont pas dans la console ni dans les messages. « Voir l'attestation » ouvre une adresse blob:.
8. Tout ce qui vient de Grist (nom du club, dates) passe par `escapeHtml` / `escapeAttr`. Les dates sont formatées comme le reste du widget concerné.
9. Fenêtre créée seulement pendant qu'elle est ouverte, dans un conteneur vide de la page (comme `#addActionModal` et le conteneur des contacts). La règle `display: block; overflow-y: auto` sur `.modal` du conteneur est à écrire dans clubs et dans le tableau de bord (voir docs/ux/contacts-fiche-club.md §7.1).
10. Une seule tâche : l'assurance RC Pro. Filtre et export CSV hors périmètre (E5-7 E). Pas de suppression (D). Pas de lecture du PDF (E5-3).
11. Tests de comportement à prévoir (testeur) : trois états sur les deux fiches, fichier manquant, pas un PDF, vide, plus de 10 Mo, date manquante, date passée acceptée, succès, refus, échec réseau, annulation (Échap et bouton), retour du focus, échappement du HTML, document expiré encore consultable.
12. Lecture refusée (décision Hanta, E5-12) : si Grist refuse de lire les colonnes RC Pro, ne rien afficher dans la carte « Club », sur les deux fiches : pas de bloc, pas de titre, pas d'alerte, pas de message, pas de zone `role="status"`. Ce n'est pas un test de profil (règle 5) : le code constate que la lecture a échoué, comme `hasRaisonColumn()` pour la colonne Raison. L'« état absent » (§4) ne s'applique que lorsque la lecture réussit sans document. Le reste de la fiche (autres cartes) reste inchangé. Détail technique à voir avec dev-backend.

## 9. Composants du design system et structures HTML

Principe : le pop-up reprend exactement la fenêtre « Ajout d'un contact » (docs/ux/contacts-fiche-club.md §7.1, §7.3, §7.4). Page du composant : https://designsystem.francetravail.io/components/detail/modal--default.html (le projet n'emploie pas le composant web `ft-modal` mais les classes `modal…` de la feuille, comme le tableau de bord ; structure recopiée de src/actions-dashboard/script.js, non de la page, qui ne donne pas le balisage interne).

### 9.1 Pop-up (identifiants proposés)

```html
<div class="modal-backdrop fade show"></div>
<div class="modal fade show" id="rcProDialog" role="dialog" aria-modal="true"
     aria-labelledby="rcProDialogTitle" aria-describedby="rcProDialogNote" tabindex="-1">
  <div class="modal-dialog">
    <form class="modal-content" id="rcProForm" novalidate>
      <div class="modal-header"><h2 class="modal-title" id="rcProDialogTitle">Dépôt de l'assurance RC Pro</h2></div>
      <div class="modal-body">
        <div class="alert alert-error is-hidden" id="rcProMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
        <p class="rcpro-required-note">* champ obligatoire</p>
        <div id="rcProDialogNote">
          <p>Club : Nom du club</p>
          <!-- Remplacement seulement : -->
          <p>Le document actuel sera remplacé par le nouveau et ne pourra pas être récupéré.</p>
        </div>
        <!-- champs : voir 9.2 -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancelRcPro"><span class="btn-content">Annuler</span></button>
        <button type="submit" class="btn btn-primary" id="submitRcPro"><span class="btn-content">Déposer</span></button>
      </div>
    </form>
  </div>
</div>
```
(« Déposer » devient « Remplacer » au remplacement. `rcpro-required-note` et `rcpro-…` sont des noms proposés, sans lien avec le design system.)

### 9.2 Champs

Pages : https://designsystem.francetravail.io/components/detail/input--default.html , https://designsystem.francetravail.io/components/detail/input--help.html , https://designsystem.francetravail.io/components/detail/input--error.html .

Champ date (structure d'un champ obligatoire, avec texte d'aide) :
```html
<label class="form-label" for="rcProDate">Date d'expiration<span class="required">&nbsp;*</span></label>
<p class="help-block" id="rcProDateHelp">Date indiquée sur l'attestation. Une date passée est acceptée : le document sera alors affiché « expirée ».</p>
<input class="form-control" id="rcProDate" name="rcProDate" required type="date" autocomplete="off" aria-describedby="rcProDateHelp">
```
Champ date en erreur :
```html
<div class="has-error">
  <label class="form-label" for="rcProDate">Date d'expiration<span class="required">&nbsp;*</span></label>
  <input class="form-control is-invalid" aria-describedby="rcProDateHelp rcProDateError" id="rcProDate"
         aria-invalid="true" name="rcProDate" required type="date" autocomplete="off">
  <p class="help-block invalid-feedback" id="rcProDateError"><span class="sr-only">Erreur :&nbsp;</span>Saisissez la date d'expiration de l'attestation.</p>
</div>
```
Champ fichier (PROPOSITION à valider, voir ci-dessous) :
```html
<label class="form-label" for="rcProFichier">Attestation d'assurance RC Pro (PDF)<span class="required">&nbsp;*</span></label>
<p class="help-block" id="rcProFichierHelp">PDF uniquement, 10 Mo au maximum.</p>
<input class="form-control" id="rcProFichier" name="rcProFichier" required type="file" accept="application/pdf,.pdf" aria-describedby="rcProFichierHelp">
```
Même structure `has-error` / `is-invalid` / `invalid-feedback` que pour la date en cas d'erreur.

### 9.3 Boutons

Page : https://designsystem.francetravail.io/components/detail/button--primary.html . Structure : `<button class="btn btn-secondary btn-sm" type="button"><span class="btn-content">…</span></button>`.

| Bouton | Classes | Texte |
|---|---|---|
| Déposer l'attestation (bloc) | `btn btn-secondary btn-sm` | « Déposer l'attestation » |
| Voir l'attestation (bloc) | `btn btn-secondary btn-sm` | « Voir l'attestation » + `<span class="sr-only"> (s'ouvre dans un nouvel onglet)</span>` |
| Remplacer l'attestation (bloc) | `btn btn-secondary btn-sm` | « Remplacer l'attestation » |
| Annuler (pop-up) | `btn btn-secondary` | « Annuler » |
| Déposer / Remplacer (pop-up) | `btn btn-primary` | « Déposer » ou « Remplacer » |

Pas de bouton rouge : pas de suppression.

### 9.4 Alerte et annonce

Page : https://designsystem.francetravail.io/components/detail/alert--error.html . Structure (celle des contacts) : `<div class="alert alert-error is-hidden" id="rcProMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>`. Annonce de réussite : `<p class="sr-only" id="rcProStatus" role="status" aria-live="polite"></p>`.

### 9.5 Composants manquants ou non confirmés (rien n'est inventé)

- Champ fichier : le design system n'a pas de composant de dépôt de fichier (déjà constaté dans docs/ux/convention.md §8). La feuille du CDN contient bien `.form-control` ; je n'ai pas pu confirmer que `form-control` habille un `input type="file"`. Proposition à valider au rendu par Hanta : `input type="file"` natif avec `class="form-control"`. Si le rendu est mauvais, garder le champ natif sans classe plutôt que d'en créer une.
- Champ date : j'ai vu dans la feuille un sélecteur `input[type=date].form-control` ; la page « Input » du site n'a pas été relue pour la date. À constater au rendu.
- Alertes de réussite, d'avertissement, d'information : les classes `alert-success`, `alert-warning`, `alert-info` n'ont pas pu être confirmées dans la feuille (la lecture de la feuille, très longue, n'a pu être faite que par morceaux et les réponses étaient contradictoires). Je ne les emploie pas : l'état est dit par le texte.
- `btn-ratio-square` n'est pas utilisé ici (pas de bouton-icône).
- Pas de pastille / badge d'état : `.badge` n'est confirmé que dans un bloc d'impression. Pas de pastille colorée proposée.
