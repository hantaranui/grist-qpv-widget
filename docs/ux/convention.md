# Convention de partenariat : générer le PDF et déposer la version signée, depuis la fiche d'une action

Public : le chef (pour décider), puis dev-interface (pour coder). Maquette à ouvrir dans le navigateur : [maquette-convention.html](maquette-convention.html).
Sources lues : CLAUDE.md, docs/design-system-france-travail.md, src/actions-dashboard/index.html, script.js (fiche, fenêtres « Ajout » et « Suppression »), style.css, src/fiche-club/ (contacts, logo), feuille du design system (CDN), pages du site du design system citées plus bas.
Données de la maquette : entièrement fictives. La signature électronique n'en fait pas partie.
Cette version intègre les décisions du chef sur la première maquette, puis ses corrections : formulaire « Ajouter un contact » dans le bloc (plus de seconde fenêtre), correspondance dispositif / modèle, siège du club affiché en entier, bouton « Re-générer », PDF généré gardé mais non montré après la signature, dépôt du fichier signé sans fenêtre de vérification. Dernières réponses du client : une convention couvre une seule action ; les conventions sont imprimées et signées à la main ; le signataire côté France Travail est le directeur d'agence. La fenêtre est donc réduite à trois blocs.

**Les zones en pointillés du PDF sont remplies à la main après impression** : nombre d'opérations ou de parcours, date de fin, contact protection des données du club (article 6.1), « Fait à » et date de signature (y compris les deux lieux et dates du modèle Parcours de remobilisation). Le tableau de bord ne les demande pas.

Les points qui attendent la réponse du chef sont marqués **[À CONFIRMER]** ; la liste complète est à la fin (§10).

## 1. Qui, quoi, en combien d'étapes

Qui : un agent France Travail qui ouvre la fiche d'une action (profils FT National, Régional, Départemental, ANS), dans les limites de ses droits sur le document.
But : produire la convention entre l'agence et le club en PDF, puis garder la version signée.

Parcours 1, générer (état « À générer ») :

1. Ouvrir la fiche de l'action (existant).
2. Dans le bloc **Convention**, cliquer sur « Générer la convention ».
3. Dans la fenêtre : choisir le signataire du club (ou « Ajouter un contact »), relire les informations préremplies, saisir le représentant de l'agence et vérifier sa fonction.
4. « Enregistrer les informations » (facultatif : « Générer la convention » les enregistre aussi).
5. « Générer la convention ». La fenêtre se ferme, le bloc passe à l'état « Générée ».

Parcours 2, relire (état « Générée ») : « Voir la convention » (un bouton) récupère le PDF et l'ouvre dans un nouvel onglet, sans fenêtre : 1 clic. L'onglet porte une adresse `blob:` (le PDF est lu depuis la mémoire du navigateur) : aucun jeton n'apparaît dans une adresse visible.

Parcours 3, re-générer (état « Générée ») :

1. Clic sur « Re-générer » : la fenêtre Convention s'ouvre, préremplie avec les informations enregistrées.
2. Corriger ce qui doit l'être.
3. « Générer la convention » : le nouveau PDF remplace l'ancien (sans historique), la fenêtre se ferme, la date du bloc est mise à jour.

Parcours 4, déposer la version signée (états « Générée » puis « Signée ») :

1. Clic sur « Déposer la convention signée » : le sélecteur de fichiers du navigateur s'ouvre directement, sans fenêtre.
2. Choix d'un fichier PDF. Si le fichier est refusé (pas un PDF, vide ou de plus de 10 Mo) : message dans le bloc, rien n'est enregistré, fin.
3. Le fichier est enregistré tout de suite, la date de dépôt est mise à jour, un message de confirmation s'affiche, le bloc passe à l'état « Signée ».

Parcours 5, remplacer le fichier signé (état « Signée ») : lien « Remplacer le fichier signé », puis les étapes 1 à 3 ci-dessus. Le nouveau fichier remplace l'ancien, sans historique, et la date de dépôt est mise à jour. Aucune vérification n'est demandée.

Les boutons qui ouvrent la fenêtre (« Générer la convention », « Re-générer ») sont dans le bloc Convention, **pas** à côté de Supprimer, Annuler et Enregistrer. Ces trois boutons gardent leur place et leur sens. « Enregistrer les informations » n'enregistre pas la fiche (Intitulé, Statut, etc.), seulement les informations de convention.

## 2. Écran A : bloc « Convention » dans la fiche

Place : sous Statut et Financement, pleine largeur, même style (`edit-card`, `section-head`, `edit-fields`). Voir la maquette, partie A (A1 à A6).

Contenu : en-tête « Convention » (même `section-head` que les autres blocs), une phrase d'état (le texte porte l'information, pas la couleur), puis les boutons de l'état.

| État | Texte | Boutons |
|---|---|---|
| **À générer** (A1) | « Aucune convention générée. » | « Générer la convention » (`btn btn-secondary`, `aria-haspopup="dialog"`) : ouvre la fenêtre B |
| **Générée** (A2) | « Convention générée le [date]. » | « Voir la convention » (bouton, récupère le PDF et l'ouvre dans un nouvel onglet, sans fenêtre : voir « Voir un PDF » plus bas) ; « Re-générer » (`btn btn-secondary`, `aria-haspopup="dialog"`) : rouvre la fenêtre B préremplie avec les informations enregistrées ; « Générer la convention » y remplace l'ancien PDF, sans historique ; « Déposer la convention signée » : ouvre directement le choix du fichier |
| **Signée** (A3) | « Convention signée, déposée le [date]. » | « Voir la convention signée » (bouton, même comportement que « Voir la convention ») ; en dessous, lien « Remplacer le fichier signé » (ouvre directement le choix du fichier). Plus de régénération, ni d'accès au PDF généré : il reste gardé dans Grist mais n'est plus montré. |
| **Dispositif sans modèle** (A4) | « Pas encore de modèle de convention pour ce dispositif. » | aucun (dispositifs concernés : Aller vers, Parcours complet d'insertion par le sport) |

Messages d'erreur du bloc (A5) : si le fichier choisi est refusé, une alerte (`alert alert-error`, `role="alert"`) s'affiche en haut du bloc, avec le message du motif (liste au §4 et §5) : « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » ou « Le fichier n'a pas été enregistré : 10 Mo au maximum. » L'état et la date ne changent pas.

Confirmation (A6) : après un dépôt réussi, une alerte de succès (`alert alert-success`, `role="status"`) « Convention signée enregistrée. » s'affiche en haut du bloc.

Règle d'ordre des états : un dispositif sans modèle n'a jamais de bouton. L'état « Signée » l'emporte sur « Générée ». La fédération de l'action n'est plus utilisée : plus aucune règle ni message à son sujet.

Voir un PDF : « Voir la convention » et « Voir la convention signée » sont des **boutons**, pas des liens `<a href target="_blank">` (décision de Hanta après l'audit de sécurité : un lien vers le fichier montrerait le jeton dans l'adresse). Au clic, le widget récupère le PDF, le garde en mémoire du navigateur et l'ouvre dans un nouvel onglet à une adresse `blob:` ; le jeton n'apparaît dans aucune adresse visible. Ouvrir un onglet depuis le cadre de Grist fonctionne (CLAUDE.md ; confirmé par un essai dans Grist DEV) ; l'ouverture depuis une adresse `blob:` après un chargement est à vérifier dans Grist DEV, voir §9.

Structure (composant bouton du design system, §8) :

```html
<button class="btn btn-secondary" type="button" id="conventionVoir">
  <span class="btn-content">Voir la convention<span class="sr-only"> (s'ouvre dans un nouvel onglet)</span></span>
</button>
```

Même structure pour « Voir la convention signée » (`id="conventionVoirSignee"`). Attributs d'accessibilité :
- C'est un vrai `<button type="button">` : atteignable au clavier, activé par Entrée et Espace, annoncé « bouton » par les lecteurs d'écran (et non « lien »). Pas de `role="link"`, pas d'`aria-haspopup` (aucune fenêtre ne s'ouvre dans le widget).
- Le texte `sr-only` « (s'ouvre dans un nouvel onglet) » reste dans le nom du bouton : il prévient que le focus quittera la page.
- Pendant la récupération du PDF : le texte devient « Ouverture en cours… » (le `sr-only` est retiré), le bouton reste en place avec `aria-disabled="true"` (pas l'attribut `disabled`, pour garder le focus) ; les clics sont ignorés. À la fin, le texte d'origine revient et le focus reste sur le bouton.
- Échec (PDF introuvable, réseau, droits) : alerte `alert alert-error`, `role="alert"` en haut du bloc : « Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord. » L'état du bloc ne change pas.
- Si le navigateur bloque l'ouverture de l'onglet : même alerte d'erreur ; ne jamais remplacer la page du widget par le PDF.

Qui voit et modifie : les règles d'accès du document décident ; le widget ne les contourne pas. Si l'utilisateur n'a pas le droit d'écrire, les boutons d'écriture (générer, déposer, remplacer) échouent proprement avec un message d'erreur (§5) ; les boutons « Voir » restent utilisables (en lecture, si ses droits lui permettent de lire le fichier).

Mobile : le bloc passe sous les autres, déjà le cas dans la fiche. Les boutons gardent leur taille normale et passent à la ligne.

## 3. Écran B : fenêtre « Convention » (générer ou re-générer)

La fenêtre sert à générer, et à re-générer depuis « Re-générer » (état Générée) : dans ce cas, elle est préremplie avec les informations enregistrées et « Générer la convention » remplace l'ancien PDF, sans historique. Les anciens états « générée » et « sans modèle » de la fenêtre sont supprimés : ils sont dans le bloc (écran A).

Structure et comportement repris de la fenêtre « Ajout d'une action » (script.js, `addActionModalHtml`) : `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `tabindex="-1"`, `modal fade show`, formulaire dans `modal-content`.

**Taille : `modal-xl`**, la plus large taille du design system. Dans la feuille du CDN : 800 px de large entre 992 et 1199 px d'écran, puis 1164 px à partir de 1200 px (la feuille contient deux règles pour `.modal-xl`, 1140 px et 1164 px : à vérifier à l'écran). On garde `modal-dialog-scrollable` comme filet : si l'écran est trop court, le corps défile et les boutons restent visibles.

**Disposition (à partir de 1200 px d'écran) : trois colonnes.** Les blocs 1, 2 et 3 se placent côte à côte, sur une seule rangée (il n'y a plus de bloc « Date et lieu »). Ordre de lecture = ordre visuel. Le modèle de convention ne change que le champ « Année » du bloc 1 (voir plus bas), pas la disposition. Estimation : environ 480 px de hauteur pour la fenêtre entière (le bloc 2 est le plus haut, surtout quand le formulaire de contact est ouvert), donc sans défilement sur un écran d'au moins 768 px de haut. Je n'ai pas pu mesurer le rendu dans un navigateur : **non vérifié**, à mesurer par Hanta sur la maquette. Sous 1200 px : une seule colonne, la fenêtre défile (la promesse « sans défilement » ne vaut qu'à partir de 1200 px).

Titre (h2, `modal-title`) : « Convention ». Corps : « Les champs marqués d'un * sont obligatoires. », puis trois `fieldset` avec `legend` en `form-legend`, dans cet ordre.

### Correspondance dispositif → modèle (décidée)

| Dispositif de l'action | Modèle de convention |
|---|---|
| Du stade vers l'emploi | « Du stade vers l'emploi » |
| Match des métiers | « Le Match des Métiers » |
| Parcours de remobilisation vers l'emploi | « Parcours de remobilisation » |
| Aller vers | aucun modèle (état A4 du bloc) |
| Parcours complet d'insertion par le sport | aucun modèle (état A4 du bloc) |

### Champs de la fenêtre selon le modèle (décidé)

| Champ | Du stade vers l'emploi | Le Match des Métiers | Parcours de remobilisation |
|---|---|---|---|
| Année | oui | oui | non (texte fixe dans la convention) |

C'est la seule différence entre les modèles. Tout le reste de la fenêtre est identique. Le nombre d'opérations ou de parcours, la date de fin, « Fait à » et les dates de signature ne sont plus demandés : ils sont remplis à la main sur le PDF imprimé.

### Bloc 1 : « Informations relatives à la convention »

| Champ | Type | Obligatoire | Remarque |
|---|---|---|---|
| Modèle utilisé | lecture seule | non | selon le dispositif (tableau de correspondance ci-dessus) |
| Année | nombre | oui | Du stade vers l'emploi et Match des Métiers seulement ; année en cours proposée. Absent pour Parcours de remobilisation : le bloc ne contient alors que le modèle utilisé. |

### Bloc 2 : « Signataire club »

| Champ | Type | Obligatoire | Remarque |
|---|---|---|---|
| Nom du club | lecture seule | non | club de l'action |
| SIRET | lecture seule | non | repris de la fiche du club |
| Siège | lecture seule, **sur toute la largeur de la colonne** | non | repris de la fiche du club ; l'adresse s'affiche en entier, sur plusieurs lignes si besoin |
| Signataire | liste de choix | oui | contacts du club (table Contacts) ; texte d'invite « Veuillez sélectionner » |
| Fonction du signataire | lecture seule | non | colonne Fonction de Contacts, affichée après le choix |
| bouton « Ajouter un contact » | bouton | | dans le bloc ; pour un signataire absent de la liste ; ouvre le petit formulaire dans le bloc (voir plus bas) |

Une phrase d'aide sous les trois champs en lecture seule : « Pour corriger ces informations, modifiez la fiche du club. » (décision 7 : on ne modifie pas le club ici).

**Siège en entier (correction).** Un champ `input` d'une ligne coupe une adresse longue (« 2 avenue du Stade, 00… »). Le siège passe donc dans un `textarea class="form-control"` en `readonly`, sur toute la largeur de la colonne (même placement que « Nom du club »), avec `rows="2"` : le texte revient à la ligne, rien n'est coupé, et le champ reste atteignable au clavier et lu par les lecteurs d'écran. Dev-interface règle la hauteur selon le texte (au moins 2 lignes, davantage si l'adresse est longue) pour qu'aucun défilement interne n'apparaisse. Composant : voir §8 (page du composant « zone de texte » non lue, **non vérifié**).

Liste de choix : une entrée par contact du club, libellé « Prénom Nom » (comme dans la fiche du club, qui affiche « prénom nom » ; voir `renderContacts`, src/fiche-club/script.js). Si le club n'a aucun contact : la liste ne propose que l'invite, et le message d'aide « Aucun contact enregistré pour ce club. » (texte déjà employé par la fiche du club) apparaît sous la liste ; le bouton « Ajouter un contact » reste disponible.

**Non vérifié** : la fiche du club lit les colonnes Club, Prenom, Nom, Email, Telephone de la table Contacts. La colonne **Fonction** annoncée par le chef n'apparaît pas dans src/fiche-club/. Je n'invente rien : à vérifier dans le modèle de données (dépôt model-de-donnees-aucarre) avant de coder. Idem pour les colonnes de la table Agences (agence, adresse, complément, code postal, ville) et pour le siège et le SIRET de Structures.

Si un contact choisi n'a pas de fonction renseignée : la zone « Fonction du signataire » reste vide ; dev-interface doit alors afficher « Fonction non renseignée » et bloquer la génération (le modèle de convention cite la fonction). À valider avec le chef (je ne l'ajoute pas à la liste des [À CONFIRMER], c'est un détail de cohérence).

### Ajouter un contact (formulaire dans le bloc, maquette B bis)

Décision du chef : le petit formulaire s'ouvre **directement dans le bloc « Signataire club »**, sous la liste des contacts, **sans seconde fenêtre**. La version en seconde fenêtre est retirée.

- Le bouton « Ajouter un contact » porte `aria-expanded="false"` et `aria-controls="contactForm"` (plus `aria-haspopup`, qui ne s'applique plus). Au clic : `aria-expanded="true"`, le formulaire apparaît sous la liste (et sous le bouton), le focus va sur « Nom ».
- Contenu : un `fieldset` avec `legend` en `form-legend` « Nouveau contact », une phrase « Le contact sera enregistré pour le club « [nom du club] » et choisi comme signataire. », trois champs obligatoires (Nom, Prénom, Fonction), deux boutons : « Annuler » (secondaire) et « Ajouter ce contact » (`btn-secondary`, pas principal : le seul bouton principal de la fenêtre reste « Générer la convention »).
- **Pas de `<form>` imbriqué.** La fenêtre entière est déjà un `<form>` ; un formulaire dans un formulaire est interdit en HTML. Le petit formulaire est donc un `fieldset` dans la fenêtre, ses boutons sont `type="button"`, et dev-interface gère la touche Entrée dans ses champs (elle valide le contact, elle ne génère pas la convention).
- Validation : si un champ manque, erreurs sous les champs (comme le reste de la fenêtre), focus sur le premier champ à corriger. Si tout est rempli : le contact est écrit dans Contacts avec la référence du club, le formulaire se referme (`aria-expanded="false"`), la liste est mise à jour, le nouveau contact est sélectionné, sa fonction s'affiche, et le focus va sur la liste « Signataire ».
- « Annuler » : le formulaire se referme, les champs sont vidés, le focus revient sur le bouton « Ajouter un contact ». Échap ferme la fenêtre Convention (il n'y a plus de fenêtre au-dessus).
- Tant que le formulaire est ouvert, « Générer la convention » reste utilisable ; si l'agent l'actionne alors que le contact n'est pas ajouté, la liste « Signataire » reste vide et l'erreur habituelle s'affiche (« Choisissez le signataire du club. »).

**[À CONFIRMER]** : nom, prénom et fonction suffisent-ils (la fiche du club montre aussi e-mail et téléphone) ?

### Bloc 3 : « Signataire agence »

Le signataire côté France Travail est le directeur d'agence. L'agence et son adresse sont en lecture seule, repris de la table Agences (agence de l'action). **Le représentant ne vient pas de la table Agences** : il est **vide à l'ouverture, obligatoire**, saisi par l'agent et enregistré avec la convention. Sa fonction est **préremplie « Directeur d'agence »**, modifiable.

| Champ | Type | Obligatoire | Valeur de départ |
|---|---|---|---|
| Agence | lecture seule | non | table Agences |
| Adresse | lecture seule (zone de texte, plusieurs lignes) | non | table Agences (adresse, complément, code postal et ville réunis) |
| Représentant | texte | oui | **vide** (saisi) |
| Fonction du représentant | texte | oui | « Directeur d'agence », modifiable |

**Évolution prévue** : plus tard, le représentant sera choisi dans une liste des utilisateurs de profil « Agence » de cette agence (table Utilisateurs), comme les contacts du club dans le bloc 2. Ce profil n'est pas encore actif : ne pas coder cette liste maintenant. La saisie libre actuelle sera alors remplacée.

Les colonnes de la table Agences qui donnent l'adresse sont à vérifier dans le modèle de données (voir plus haut). Si l'adresse d'une agence est fausse, elle se corrige dans la table Agences, pas ici : **[À CONFIRMER]** qui peut la modifier.

### Champs retirés

Par décision du chef : « SIRET de l'agence » (aucun modèle ne l'utilise) et « Contact protection des données du club » (rempli à la main sur le PDF, article 6.1).

Par les réponses du client (conventions imprimées et signées à la main) : « Nombre d'opérations », « Date de fin », tout le bloc « Date et lieu » (« Fait à » et dates de signature, y compris les deux lieux et dates de Parcours de remobilisation), et la règle « action sans fédération » avec son message (la fédération n'est plus utilisée). Ils n'apparaissent plus nulle part, ni dans la maquette ni dans les textes.

### Pied de la fenêtre

`modal-footer`, de gauche à droite : « Fermer » (secondaire), « Enregistrer les informations » (secondaire), « Générer la convention » (principal, un seul bouton principal).

## 4. Écran C : dépôt et remplacement du fichier signé (sans fenêtre, maquette C1 et C2)

Il n'y a plus de petite fenêtre de dépôt ni de vérification (pas de case à cocher, pas de bouton « Valider le dépôt », pas de message « L'ancien fichier signé sera supprimé »).

**Choix du fichier (C1)** : le bouton « Déposer la convention signée » (état Générée) ou le lien « Remplacer le fichier signé » (état Signée) déclenche directement un champ fichier caché, `accept="application/pdf,.pdf"`, comme le bouton « Ajouter un logo » de la fiche du club. Ces deux commandes n'ouvrent pas de fenêtre : pas d'`aria-haspopup`. Le design system n'a pas de composant de dépôt de fichier : voir §8.

**Enregistrement immédiat** : dès qu'un PDF est choisi, il est enregistré, en remplaçant l'ancien fichier signé s'il y en a un (sans historique). La date de dépôt est mise à jour et le bloc passe (ou reste) à l'état « Signée ».

**Fichier refusé** (dépôt et remplacement, mêmes règles). Le fichier est refusé, un message le dit dans le bloc (A5) et rien n'est enregistré, dans l'un de ces cas :
- son extension n'est pas `.pdf` ;
- son type n'est pas `application/pdf` ;
- son contenu ne commence pas par « %PDF- » (contrôle des premiers octets, qui ne se fie pas au nom ni au type annoncé) ;
- il est vide (0 octet) ;
- il dépasse 10 Mo.

Un seul message est affiché, celui du premier contrôle qui échoue, dans l'ordre ci-dessus (la taille est vérifiée avant la lecture du contenu) : extension, type ou « %PDF- » → « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » ; vide → « Le fichier n'a pas été enregistré : le fichier est vide. » ; trop gros → « Le fichier n'a pas été enregistré : 10 Mo au maximum. » L'ancien fichier signé, s'il existe, reste en place.

**Envoi en cours (C2)** : le bouton ou le lien qui a lancé le dépôt affiche « Envoi en cours… » et reste en place (`aria-disabled="true"`).

**Succès (A6)** : alerte `alert alert-success`, `role="status"` : « Convention signée enregistrée. ». **Échec d'envoi** : alerte `alert alert-error`, `role="alert"` : « Le fichier n'a pas pu être enregistré. Réessayez ou contactez l'équipe du tableau de bord. » L'état ne change pas. La méthode technique d'envoi de la pièce jointe est décrite dans CLAUDE.md (section Pièges connus) : jeton d'écriture, `credentials 'omit'`, en-tête `X-Requested-With`.

## 5. Textes affichés (tous, pour dev-interface)

- Bloc : « Convention » ; « Aucune convention générée. » ; « Convention générée le [date]. » ; « Convention signée, déposée le [date]. » ; « Pas encore de modèle de convention pour ce dispositif. »
- Boutons du bloc : « Générer la convention », « Voir la convention », « Re-générer », « Déposer la convention signée », « Voir la convention signée », « Remplacer le fichier signé ». Textes cachés pour lecteurs d'écran : « (s'ouvre dans un nouvel onglet) » après chaque « Voir » (ces deux commandes sont des boutons). Pendant l'ouverture du PDF : « Ouverture en cours… ».
- Fenêtre B : « Convention » ; « Les champs marqués d'un * sont obligatoires. » ; « Informations relatives à la convention » ; « Signataire club » ; « Signataire agence » ; libellés : voir les tableaux du §3 ; « Pour corriger ces informations, modifiez la fiche du club. » ; « Veuillez sélectionner » ; « Aucun contact enregistré pour ce club. » ; « Ajouter un contact » (avec `sr-only` « (le signataire n'est pas dans la liste) ») ; valeur de départ de la fonction du représentant : « Directeur d'agence ».
- Boutons de la fenêtre B : « Fermer », « Enregistrer les informations », « Générer la convention » (aussi à la re-génération).
- Formulaire contact (dans le bloc) : « Nouveau contact » (légende) ; « Nom » ; « Prénom » ; « Fonction » ; « Annuler » ; « Ajouter ce contact ».
- Erreur de champ (sous le champ, après `sr-only` « Erreur : ») : « Saisissez [le libellé en minuscules]. » (ex. « Saisissez le nom du représentant. »). Signataire : « Choisissez le signataire du club. » Il n'y a plus de contrôle de date ni de code postal : ces champs n'existent plus dans la fenêtre.
- Alerte d'erreur en haut du corps de la fenêtre B (`alert alert-error`, `role="alert"`) : « Certains champs sont à corriger. » ; échec d'enregistrement : « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » ; échec de génération : « La convention n'a pas pu être générée. Vos informations sont conservées. »
- Dépôt du fichier signé (bloc, sans fenêtre) : « Envoi en cours… » ; « Convention signée enregistrée. » ; « Le fichier n'a pas pu être enregistré. Réessayez ou contactez l'équipe du tableau de bord. »
- Succès (`alert alert-success`, `role="status"`) : « Informations enregistrées. » ; « Convention générée. » ; « Convention signée enregistrée. »
- Chargement : sur le bouton, pendant la génération, « Génération en cours… » (le bouton reste en place, `aria-disabled="true"`) ; pendant l'envoi du fichier, « Envoi en cours… ».
- Fichier refusé (dépôt ou remplacement) : « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » ; « Le fichier n'a pas été enregistré : le fichier est vide. » ; « Le fichier n'a pas été enregistré : 10 Mo au maximum. »
- Ouverture d'un PDF (boutons « Voir ») : « Ouverture en cours… » ; échec : « Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord. »

## 6. États

| État | Ce que voit l'agent |
|---|---|
| Ouverture de la fenêtre B | Focus sur le premier champ modifiable : « Année » (Du stade vers l'emploi, Match des Métiers) ; « Signataire » du club (Parcours de remobilisation, qui n'a pas d'année). |
| Champs invalides | Alerte d'erreur en haut, champs en `is-invalid`, messages sous chaque champ, focus sur le premier champ à corriger. |
| Enregistrement / génération | Bouton en attente, message de succès ou d'erreur dans le corps ; à la génération réussie, la fenêtre se ferme et le bloc passe à « Générée ». |
| Formulaire « Ajouter un contact » ouvert | Formulaire sous la liste, focus sur « Nom », bouton en `aria-expanded="true"`. |
| Contact ajouté | Formulaire refermé, contact sélectionné dans la liste, sa fonction affichée, focus sur la liste. |
| Ajout de contact annulé | Formulaire refermé et vidé, focus sur le bouton « Ajouter un contact ». |
| Re-génération | Fenêtre B préremplie ; à la génération réussie, elle se ferme et l'ancien PDF est remplacé. |
| Fichier PDF choisi | Envoi aussitôt, « Envoi en cours… », puis confirmation (A6). |
| Fichier refusé (pas un PDF, vide, plus de 10 Mo) | Alerte dans le bloc avec le motif, rien enregistré. |
| Clic sur « Voir la convention » ou « Voir la convention signée » | Bouton en attente (« Ouverture en cours… »), puis le PDF s'ouvre dans un nouvel onglet ; en cas d'échec, alerte dans le bloc. |
| Droits insuffisants en écriture | Message d'erreur à l'enregistrement, à la génération, au dépôt ; les boutons « Voir » restent utilisables. |

## 7. Accessibilité (RGAA), mode sombre, données personnelles

- Titres : h1 de la fiche (existant) → h2 de la fenêtre. Les trois blocs sont des `legend` de `fieldset`.
- Chaque champ a un `label` lié (`for` / `id`). Obligatoire : astérisque dans `span.required` **et** attribut `required` ; la phrase d'introduction explique l'astérisque.
- Champ en lecture seule : `readonly` (il reste atteignable au clavier et lu par les lecteurs d'écran).
- Liste de choix : `label` lié, option d'invite désactivée « Veuillez sélectionner » ; erreur : `is-invalid`, `aria-invalid="true"`, `aria-describedby`.
- Erreurs : jamais portées par la couleur seule (texte « Erreur : » en `sr-only`).
- Focus : à l'ouverture d'une fenêtre, sur le premier champ ; Tab et Maj+Tab tournent dans la fenêtre ouverte ; **Échap ferme** la fenêtre (comme `keepFocusInAddAction`) ; dans le formulaire de contact du bloc 2, Échap ne le referme pas séparément ; à la fermeture, le focus revient sur le bouton qui l'a ouverte. Si des informations non enregistrées existent, Échap demande confirmation [à valider avec le chef].
- Ordre de lecture = ordre visuel : introduction, blocs 1, 2, 3, boutons du pied. Les trois colonnes se lisent de gauche à droite.
- Boutons qui ouvrent un nouvel onglet (« Voir ») : le dire dans le texte (`sr-only`).
- Bouton grisé : `aria-disabled` + message visible relié par `aria-describedby`. Ne pas utiliser l'attribut `disabled`.
- Mode clair / sombre : n'utiliser que des variables `--ft-…` ou des classes du design system, aucune couleur écrite en dur. **Constat** : style.css déclare `color-scheme: light` ; le tableau de bord n'est donc pas conçu pour le mode sombre aujourd'hui. Je n'ai pas pu vérifier le rendu en mode sombre : à tester par Hanta. La maquette n'ajoute aucune couleur.
- Zoom 200 % : la fenêtre défile (`modal-dialog-scrollable`), rien n'est coupé ; sous 1200 px d'écran (ce qui arrive à 200 % de zoom sur un écran courant) elle passe en une colonne.
- Données personnelles : seules données de personnes : **nom, prénom et fonction** du représentant de l'agence et du signataire du club (et du contact ajouté), strictement nécessaires pour désigner qui signe. Pas de téléphone ni d'adresse personnelle demandés dans ce formulaire. Le champ Commentaire de la fiche reste interdit pour noter des données de personnes. Les PDF contiennent ces noms et les signatures : le PDF généré reste dans Grist après la signature mais n'est plus montré ; la durée de conservation reste à décider (§10). Données de la maquette : fictives.

## 8. Composants du design system utilisés

Sources : feuille https://cdn.francetravail.fr/studio/design-system/css/styles.css (fait foi pour les noms de classes) et pages du site. Les structures ci-dessous sont celles lues sur les pages du site ou, quand la page n'en donne pas, celles déjà employées par le tableau de bord (indiquées).

### Fenêtre modale, tailles dont la plus large
Pages : https://designsystem.francetravail.io/components/detail/modal--default.html et https://designsystem.francetravail.io/components/detail/modal--xl.html (tailles : Petit `sm`, Grand `lg`, Très grand `xl`).
La page décrit un composant web `ft-modal`, qui n'est pas ce que le tableau de bord utilise :

```html
<ft-modal configuration="{&quot;acceptBtnTxt&quot;:&quot;Valider&quot;,&quot;closeBtnTxt&quot;:&quot;Fermer&quot;,&quot;hideAcceptBtn&quot;:false,&quot;hideCloseBtn&quot;:false}" size="xl">
  <span slot="title">Titre de la modale</span>
  <p>…</p>
</ft-modal>
```

Le tableau de bord emploie les classes de la feuille (`.modal`, `.modal-dialog`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-title`, `.modal-backdrop`). On garde ce choix, déjà testé dans les fenêtres existantes. La classe de la taille « très grand » est `modal-xl` (présente dans la feuille, vérifié) : c'est ce que la page appelle `size="xl"`. Structure (reprise de script.js, `addActionModalHtml`) :

```html
<div class="modal-backdrop fade show"></div>
<div class="modal fade show" id="conventionDialog" role="dialog" aria-modal="true" aria-labelledby="conventionTitle" tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <form class="modal-content" id="conventionForm" novalidate>
      <div class="modal-header"><h2 class="modal-title" id="conventionTitle">Convention</h2></div>
      <div class="modal-body"> … </div>
      <div class="modal-footer"> … boutons … </div>
    </form>
  </div>
</div>
```

Comme pour les fenêtres existantes, la feuille masque `.modal` : on ne l'insère dans la page que pendant qu'elle est ouverte et on lui donne `display: block` (voir style.css, `#addActionModal .modal`). La maquette n'insère pas `modal-backdrop` pour pouvoir empiler les parties.

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

Champ numérique (année) : mêmes classes avec `type="number"`. La fenêtre ne contient plus de champ date.

### Zone de texte en lecture seule (siège du club, adresse de l'agence)
Aucune page de composant « zone de texte » n'a été lue : **non vérifié**. Structure proposée, identique au champ en lecture seule ci-dessus mais avec `textarea` (la classe `form-control` est celle de la feuille ; à vérifier que le tableau de bord emploie déjà un `textarea` pour le Commentaire, et à contrôler sur la page du composant avant de coder) :

```html
<label class="form-label" for="clubSiege">Siège</label>
<textarea class="form-control" id="clubSiege" name="clubSiege" readonly rows="2">2 avenue du Stade, 00000 Ville-Exemple</textarea>
```

### Liste de choix (signataire du club)
Page : https://designsystem.francetravail.io/components/detail/select--default.html

```html
<label class="form-label" for="form-select_512345132">
    Libellé de l'élément<span class="required">&nbsp;*</span></label>
<select class="form-control" id="form-select_512345132" name="form-select_512345132" required>
    <option selected disabled value="">Veuillez sélectionner</option>
    <option value="option_918504814">
        Libellé du choix 1
    </option>
    <option value="option_439780246">
        Libellé du choix 2
    </option>
    <option value="option_722996012">
        Libellé du choix 3
    </option>
</select>
```

La page ne mentionne aucun script associé. Le composant existe : rien à signaler.

### Dépôt de fichier : composant manquant
J'ai cherché sur le site : aucune page « input fichier », « upload » ou « téléversement » (adresses essayées : input--file, upload--default, file--default, fileupload--default, input-file--default, upload-file--default : toutes en erreur 404). Le seul composant voisin du site est « Drag & drop » (drag-and-drop--card.html, --line.html…), mais sa page ne dit pas qu'il sert à envoyer des fichiers : je ne l'ai pas retenu, sans le fabriquer ni le deviner. La feuille contient des classes `custom-file-input`, `custom-file-label` et `form-control-file`, mais aucune page de composant ne les décrit : je ne les propose pas.
**Le plus proche, déjà employé dans le dépôt** : un bouton du design system qui ouvre un champ fichier caché, comme « Ajouter un logo » dans src/fiche-club/script.js (ligne 389) :

```html
<button class="btn btn-secondary" type="button" id="depotChoisir"><span class="btn-content">Déposer la convention signée</span></button>
<input class="logo-input" type="file" id="depotFichier" accept="application/pdf,.pdf" tabindex="-1" aria-hidden="true">
```

La classe `logo-input` est une classe de fiche-club (`display: none`) : dans le tableau de bord, dev-interface crée sa propre classe (la maquette l'appelle `convention-file`). À valider par Hanta : le design system n'a pas de composant de dépôt de fichier.

### Boutons et liens
Page : https://designsystem.francetravail.io/components/detail/button--primary.html

```html
<button class="btn btn-primary" id="button_554967335" type="button">
  <span class="btn-content">Je suis un bouton</span>
</button>
```

Secondaire : `btn btn-secondary` (employé dans script.js). Petit : `btn-sm`. Lien d'apparence « lien » : `btn btn-link` (utilisé pour « Remplacer le fichier signé » ; classe de la feuille : fond transparent, texte souligné ; vérifié dans la feuille, page du site non lue). Désactivé (page button--disabled.html) :

```html
<button aria-disabled="true" class="btn btn-secondary" id="button_743220664" type="button"
        data-ft-tooltip="Infobulle expliquant pourquoi l'élément est désactivé" data-ft-placement="bottom">
  <span aria-hidden="true" class="icon icon-pencil"></span>
  <span class="btn-content">Bouton désactivé</span>
</button>
```

Le script `disabled-a11y.js` du design system bloque les clics sur `aria-disabled="true"` : à vérifier qu'il est bien chargé par l'autoloader dans le widget, sinon bloquer le clic dans notre script. Les commandes « Voir la convention » et « Voir la convention signée » sont des boutons `btn btn-secondary` (structure au §2), pas des liens à apparence de bouton.

### Alertes
Page : https://designsystem.francetravail.io/components/detail/alert--default.html. La page montre le composant web `<ft-alert><p class="alert-title">…</p></ft-alert>`. Le tableau de bord utilise la forme à classes, qu'on reprend :

```html
<div class="alert alert-error is-hidden" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
```

Succès : `alert alert-success` (classe présente dans la feuille), avec `role="status"`.

### Autres classes utilisées
`form-legend` (titre d'un groupe de champs, déjà employée dans la fiche), `help-block` et `required` (voir ci-dessus), `sr-only` (texte pour lecteurs d'écran).

### Ce qui manque au design system (signalé, non fabriqué)
- Pas de composant « bloc de fiche » : on reprend les classes du widget (`edit-card`, `section-head`, `edit-fields`, `edit-field`).
- Pas de composant de dépôt de fichier (voir ci-dessus).
- Pas de composant de téléchargement ou d'aperçu de PDF : on utilise des boutons du design system, qui ouvrent le PDF dans un nouvel onglet.
- Classes du widget à créer par dev-interface, sans nom du design system : `convention-grid` (trois colonnes à partir de 1200 px, une colonne en dessous), `convention-part` (fieldset sans bordure), `convention-fields` (grille à deux colonnes dans une colonne de la fenêtre), `convention-actions` (rangée de boutons), `convention-file` (champ fichier caché). Leurs règles sont dans le `<style>` de la maquette ; elles n'utilisent que des variables du design system et du widget. Test à prévoir : test/styles.test.js vérifie qu'elles ne reprennent aucun nom du design system.

## 9. Risques techniques et points à vérifier avant de coder

- **Formulaire de contact dans la fenêtre** : la fenêtre est déjà un `<form>`, le petit formulaire ne peut pas en être un second (voir §3). Entrée dans ses champs : à gérer pour ne pas lancer la génération.
- Hauteur de la fenêtre B sans défilement : estimation, non mesurée. Un écran de 768 px de haut avec la barre du navigateur laisse environ 650 px ; ce sera juste, surtout avec le formulaire de contact ouvert (bloc 2 le plus haut) et un siège sur plusieurs lignes. À mesurer sur la maquette avant de coder.
- Où stocker le PDF généré, le PDF signé et les informations (nouvelle table ou colonnes dans Grist) : le modèle de données est partagé par plusieurs widgets, rien ne doit être renommé et toute nouvelle colonne est à faire valider. Non décidé ici.
- Générer un PDF demande probablement une bibliothèque ou un service : « aucune dépendance sans l'accord de Hanta » (CLAUDE.md). À proposer avec avantages, risques et effort avant tout code.
- Colonnes Grist citées par le chef (Contacts.Fonction, colonnes de Agences) : non vérifiées (voir §3).
- **Zones en pointillés du PDF** : le PDF généré doit laisser de la place pour écrire à la main (nombre d'opérations ou de parcours, date de fin, contact protection des données, « Fait à », dates de signature). À vérifier sur le PDF produit, qui n'est pas dans cette note.
- **Ouverture du PDF par bouton** : l'onglet s'ouvre après une récupération asynchrone, ce que certains navigateurs prennent pour une fenêtre non sollicitée et bloquent. L'ouverture d'un onglet depuis le cadre de Grist est confirmée (essai dans Grist DEV), mais pas avec une adresse `blob:` obtenue après chargement : à tester dans Grist DEV, sur plusieurs navigateurs, avant de livrer. Non vérifié ici.
- La suppression de l'ancien fichier signé est définitive : elle suit la décision du chef (« sans historique »). Pas de confirmation ni de vérification avant l'enregistrement : le fichier choisi est enregistré tout de suite.

## 10. Liste des [À CONFIRMER]

Tranchés par le chef ou le client et retirés : modèle des états de la fenêtre, contact protection des données (rempli à la main), SIRET de l'agence, bouton sans modèle (masqué), régénération depuis la fenêtre, formulaire de contact dans le bloc (sans seconde fenêtre), correspondance dispositif / modèle, une convention pour une seule action, date de fin et nombre d'opérations (remplis à la main sur le PDF), comparaison de la date de fin avec la date de signature (plus de champ), signataire côté France Travail (directeur d'agence, fonction préremplie et modifiable ; le représentant reste saisi).

Points tranchés (dernière série de décisions du chef) :

- **Corriger une erreur à l'état Générée** : bouton « Re-générer » à côté de « Voir la convention ». Il rouvre la fenêtre Convention préremplie avec les informations enregistrées ; « Générer la convention » remplace l'ancien PDF, sans historique. Le lien « Modifier et régénérer » est retiré.
- **PDF généré après la signature** : quand la convention signée est déposée, le PDF généré (non signé) est gardé dans Grist, mais n'est plus montré. (La durée de conservation des noms de signataires reste à décider.)
- **Dépôt et remplacement du fichier signé** : pas de système de vérification. Le bouton « Déposer la convention signée » et le lien « Remplacer le fichier signé » ouvrent directement le choix du fichier ; le fichier est enregistré tout de suite (en remplaçant l'ancien, sans historique) et la date de dépôt est mise à jour. Seuls les PDF sont acceptés (extension .pdf, type application/pdf, début « %PDF- », non vide, 10 Mo au maximum), sinon un message le dit et rien n'est enregistré. Un message confirme le dépôt. « Voir la convention » et « Voir la convention signée » sont des boutons qui ouvrent le PDF dans un nouvel onglet depuis la mémoire du navigateur (adresse `blob:`), après l'audit de sécurité.

À confirmer :

1. **Qui peut modifier** les informations de l'agence reprises de la table Agences (agence, adresse, complément, code postal, ville), maintenant affichées en lecture seule ? **[À CONFIRMER]**
2. **Champs du formulaire « Ajouter un contact »** : nom, prénom et fonction suffisent-ils ? **[À CONFIRMER]**
