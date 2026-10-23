# Convention de partenariat : générer le PDF et déposer la version signée, depuis la fiche d'une action

**La maquette docs/ux/maquette-convention.html n'est plus à jour : en cas d'écart, cette note l'emporte.**

**Statut : validée le 2026-10-22** (mise à jour de la tâche 4.1, après les réponses du client et de Hanta ; la version précédente avait été validée par le chef avant ces réponses). Dev-interface peut coder le bloc (tâche 4.2).

**Mis à jour le 2026-10-23 (S7)** : ajouts pour la génération du PDF, sans rien changer aux décisions antérieures : pied de la fenêtre (§3), « Générer la convention : de l'ouverture au résultat » et nom du fichier (§3), compléments sur « Voir » (§2), textes (§5), états (§6), décisions D-S7-1 à D-S7-7 (§10). Hors périmètre : « Re-générer » (S8) et dépôt du fichier signé (S9).

**Mis à jour le 2026-10-23** (après les tâches 5.1a et 5.1b, avant les tests 5.3b) : la note reprend les décisions déjà appliquées par le code pour la fenêtre « Convention ». Chaque changement porte la mention « mis à jour le 2026-10-23 ». Les points qui attendent Hanta sont dans le §10, rubrique « À décider par Hanta (2026-10-23) ».

Public : le chef (pour décider), puis dev-interface (pour coder). Maquette à ouvrir dans le navigateur : [maquette-convention.html](maquette-convention.html).
Sources lues : CLAUDE.md, docs/design-system-france-travail.md, src/actions-dashboard/index.html, script.js (fiche, fenêtres « Ajout » et « Suppression »), style.css, src/fiche-club/ (contacts, logo), feuille du design system (CDN), pages du site du design system citées plus bas.
Données de la maquette : entièrement fictives. La signature électronique n'en fait pas partie.
Cette version intègre les décisions du chef sur la première maquette (correspondance dispositif / modèle, siège du club affiché en entier, bouton « Re-générer », PDF généré gardé mais non montré après la signature, dépôt du fichier signé sans fenêtre de vérification), les réponses du client (une convention couvre une seule action ; les conventions sont imprimées et signées à la main ; le signataire côté France Travail est le directeur d'agence ; la fenêtre est réduite à trois blocs) et, pour la tâche 4.1, les décisions de Hanta :
- **Droits** : FT National, FT Régional et FT Départemental génèrent, re-génèrent et déposent, chacun sur son périmètre. Le widget ne lit pas le profil : quand Grist refuse les tables de la convention (c'est le cas de l'ANS), tous les profils voient l'état « Droits insuffisants ».
- **Cinq états** du bloc, dont « Droits insuffisants ».
- **Génération bloquée** avec un message qui dit quoi remplir (agence, club, dispositif, adresse du club).
- **Signataire club choisi uniquement parmi les contacts du club** : le bouton et le formulaire « Ajouter un contact » sont supprimés de la fenêtre. Un club sans contact : génération impossible, avec un message.

**Les zones en pointillés du PDF sont remplies à la main après impression** : nombre d'opérations ou de parcours, date de fin, contact protection des données du club (article 6.1), « Fait à » et date de signature (y compris les deux lieux et dates du modèle Parcours de remobilisation). Le tableau de bord ne les demande pas.

Les points qui attendent la réponse du chef sont marqués **[À CONFIRMER]** ; la liste complète est à la fin (§10).

## 1. Qui, quoi, en combien d'étapes

Qui : un agent France Travail de profil **FT National, FT Régional ou FT Départemental** qui ouvre la fiche d'une action, dans le périmètre que les règles d'accès du document lui donnent (le widget ne les contourne pas). Il génère, re-génère et dépose la convention.
**Les autres profils (ANS compris)** n'ont pas accès aux tables de la convention : le bloc Convention affiche pour eux l'état « Droits insuffisants » (voir §2, « Qui voit le bloc »).
But : produire la convention entre l'agence et le club en PDF, l'imprimer, la faire signer à la main, puis garder la version signée.

Parcours 1, générer (état « À générer ») :

1. Ouvrir la fiche de l'action (existant).
2. Dans le bloc **Convention**, cliquer sur « Générer la convention ». Si un élément manque (agence, club, dispositif, adresse du club), le bouton est grisé et un message dit quoi remplir : le parcours s'arrête là (voir « Génération bloquée », §2).
3. Dans la fenêtre : choisir le signataire du club **dans la liste des contacts du club**, relire les informations préremplies, saisir le représentant de l'agence et vérifier sa fonction. Si le club n'a aucun contact, un message le dit et la génération est impossible : l'agent ajoute un contact dans la fiche du club (hors de ce widget), puis revient.
4. « Enregistrer les informations » (facultatif ; mis à jour le 2026-10-23 : il garde ce qui est saisi, même incomplet, comme un brouillon ; « Générer la convention » enregistre aussi).
5. « Générer la convention » (mis à jour le 2026-10-23 : ce bouton n'arrive qu'en S7, avec la génération du PDF ; il contrôle alors les champs obligatoires, voir §3 « Enregistrer et Générer »). La fenêtre se ferme, le bloc passe à l'état « Générée ».
6. Hors du widget : imprimer le PDF, compléter à la main les zones en pointillés, faire signer ; puis revenir pour le parcours 4.

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

**Qui voit le bloc.** Tous les profils voient le bloc, ANS compris, dans le périmètre de la fiche qu'ils peuvent ouvrir. Le widget **ne lit pas le profil** de l'utilisateur et ne cache jamais le bloc selon le profil. Seul Grist décide : quand il refuse la lecture des tables de la convention, tout profil (ANS compris) voit l'état « Droits insuffisants » avec son message ; sinon il voit l'un des quatre autres états.

**Cinq états.**

| État | Texte | Boutons |
|---|---|---|
| **À générer** (A1) | « Aucune convention générée. » | « Générer la convention » (`btn btn-secondary`, `aria-haspopup="dialog"`) : ouvre la fenêtre B. Grisé si la génération est bloquée (voir plus bas). |
| **Générée** (A2) | « Convention générée le [date]. » puis, en dessous, la phrase d'aide : « Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé. » | « Voir la convention » (bouton, récupère le PDF et l'ouvre dans un nouvel onglet, sans fenêtre : voir « Voir un PDF » plus bas) ; « Re-générer » (`btn btn-secondary`, `aria-haspopup="dialog"`) : rouvre la fenêtre B préremplie avec les informations enregistrées ; « Générer la convention » y remplace l'ancien PDF, sans historique ; « Re-générer » est grisé si la génération est bloquée (même règle qu'à l'état À générer) ; « Déposer la convention signée » : ouvre directement le choix du fichier |
| **Signée** (A3) | « Convention signée, déposée le [date]. » (pas de phrase d'aide) | « Voir la convention signée » (bouton, même comportement que « Voir la convention ») ; en dessous, lien « Remplacer le fichier signé » (ouvre directement le choix du fichier). Plus de régénération, ni d'accès au PDF généré : il reste gardé dans Grist mais n'est plus montré. Aucun blocage de génération à cet état (il n'y a rien à générer). |
| **Sans modèle** (A4) | « Pas encore de modèle de convention pour ce dispositif. » | aucun (dispositifs concernés : Aller vers, Parcours complet d'insertion par le sport) |
| **Droits insuffisants** (A7, nouveau) | « Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord. » | aucun |

**État « Droits insuffisants » (A7).** Il s'affiche quand Grist refuse la lecture des tables de la convention (Conventions ou Modeles_convention) à un utilisateur, quel que soit son profil (ANS compris). Le widget ne peut alors pas savoir si une convention existe : cet état **l'emporte sur les quatre autres**, aucun bouton ni aucune date n'est montré. Le texte est une phrase simple, en `<p>` dans le bloc (même présentation que les autres phrases d'état), sans couleur d'alerte : ce n'est pas une erreur de l'utilisateur. Le message est lu normalement par les lecteurs d'écran (texte visible dans le flux, pas de `role` particulier : il n'apparaît pas à la suite d'une action de l'utilisateur).

**Génération bloquée (A8 à A11, nouveau).** À l'état « À générer » (et pour « Re-générer » à l'état « Générée »), la génération est bloquée tant qu'un des quatre éléments manque. Le widget vérifie dans cet ordre et **n'affiche que le message du premier élément manquant** (un seul message à la fois) :

| Ordre | Élément manquant | Message exact |
|---|---|---|
| 1 | Agence de l'action | « Renseignez l'agence de l'action dans sa fiche. » |
| 2 | Club de l'action | « Renseignez le club de l'action. » |
| 3 | Dispositif de l'action | « Renseignez le dispositif de l'action dans sa fiche. » |
| 4 | Adresse du club | « Renseignez l'adresse du club dans sa fiche. » |

**Mis à jour le 2026-10-23 : le message n° 3 (« Renseignez le dispositif… ») ne peut jamais s'afficher dans le bloc.** Sans dispositif, l'état du bloc est « Sans modèle » (règle d'ordre des états plus bas : un dispositif sans modèle n'a jamais de bouton), et le bloc n'arrive donc jamais à l'état « À générer » ou « Générée » où ces messages s'affichent. **Décision D-5 de Hanta (2026-10-23) : le message est gardé dans le code, sans être retiré.** Il ne s'affiche jamais en pratique : sans dispositif, l'état est « Sans modèle », et la phrase « Pas encore de modèle de convention pour ce dispositif. » reste le seul retour visible pour un dispositif absent.

- **Où** : dans le bloc Convention, **sous la phrase d'état et juste au-dessus du bouton grisé**, dans le flux de la page (jamais dans une infobulle seule, jamais dans la fenêtre B : la fenêtre ne s'ouvre pas).
- **Quand** : dès l'affichage du bloc, sans clic. Le message suit **les données enregistrées** de l'action, du club et de l'agence, jamais une valeur en cours de saisie et pas encore enregistrée. Il reste visible tant que l'élément manque ; il disparaît (et le bouton redevient actif) quand l'élément est renseigné. Il n'y a jamais de message affiché pour un élément qui n'est pas manquant.
- **Bouton « Générer la convention » (ou « Re-générer »)** : il **reste affiché**, grisé, avec `aria-disabled="true"` (pas l'attribut `disabled`, pour qu'il reste atteignable au clavier et lu par les lecteurs d'écran), `aria-describedby` pointant vers l'`id` du message, et pas d'`aria-haspopup` tant qu'il est grisé. Les clics sont ignorés (le script du design system `disabled-a11y.js` le fait si l'autoloader le charge ; sinon notre script le fait : voir §8). Un lecteur d'écran lit donc « Générer la convention, bouton, estompé », puis le message. Le message visible **est** l'explication : on n'utilise pas l'infobulle `data-ft-tooltip` de l'exemple du design system, car une infobulle n'est pas visible au toucher ni garantie au clavier (on peut ajouter les deux plus tard si le chef le demande).
- **Annonce** : le message est du texte du bloc, lu en parcourant la page et relié au bouton par `aria-describedby`. Il n'est pas annoncé en direct (`aria-live`) s'il est déjà là à l'ouverture de la fiche. S'il apparaît pendant que la fiche est ouverte (l'agent renseigne par exemple le dispositif, le message suivant remplace le précédent), le conteneur du message est une région `role="status"` toujours présente dans le bloc, dont seul le texte change : il est alors annoncé poliment. Le message ne change qu'une fois la donnée enregistrée (voir « Quand »).
- **Pas de couleur seule** : le message est du texte ; il commence par un `sr-only` « Convention impossible à générer : » pour que le lecteur d'écran dise de quoi il s'agit.
- **Si plusieurs éléments manquent** : on ne montre que le premier, dans l'ordre ci-dessus ; une fois celui-ci corrigé, le suivant apparaît.

Structure (message `help-block` du design system, déjà employé dans la fenêtre ; **pas** d'alerte `alert-error` : ce n'est pas une erreur de saisie, le texte n'est pas là pour alarmer ; le design system a bien un composant alerte, mais je n'ai pas lu sa variante d'information ou d'avertissement : **non vérifié**, à contrôler dans la feuille avant d'en proposer une) :

```html
<p>Aucune convention générée.</p>
<div id="conventionBlocage" role="status">
  <p class="help-block" id="conventionBlocageTexte"><span class="sr-only">Convention impossible à générer : </span>Renseignez l'agence de l'action dans sa fiche.</p>
</div>
<div>
  <button class="btn btn-secondary" type="button" id="conventionGenerer" aria-disabled="true" aria-describedby="conventionBlocageTexte">
    <span class="btn-content">Générer la convention</span>
  </button>
</div>
```

Quand rien ne manque, le conteneur `#conventionBlocage` reste dans la page, vide, et le bouton perd `aria-disabled` et `aria-describedby` et reprend `aria-haspopup="dialog"`.

Le bouton grisé garde la structure du design system pour le bouton désactivé (page button--disabled.html, §8), sans l'icône ni l'infobulle de l'exemple.

Messages d'erreur du bloc (A5) : si le fichier choisi est refusé, une alerte (`alert alert-error`, `role="alert"`) s'affiche en haut du bloc, avec le message du motif (liste au §4 et §5) : « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » ou « Le fichier n'a pas été enregistré : 10 Mo au maximum. » L'état et la date ne changent pas.

Confirmation (A6) : après un dépôt réussi, une alerte de succès (`alert alert-success`, `role="status"`) « Convention signée enregistrée. » s'affiche en haut du bloc.

Règle d'ordre des états : « Droits insuffisants » l'emporte sur tous les autres ; un dispositif sans modèle n'a jamais de bouton ; l'état « Signée » l'emporte sur « Générée ». La fédération de l'action n'est plus utilisée : plus aucune règle ni message à son sujet.

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

**Mis à jour le 2026-10-23 (S7), tâche 7.4 : relecture de la note, compléments.** La note décrivait déjà le texte caché « (s'ouvre dans un nouvel onglet) », « Ouverture en cours… » et l'alerte d'échec avec son message. Il manquait :
- **Jeton** : la page ne contient aucun jeton avant le clic (ni dans un attribut, ni dans une adresse, ni dans le texte caché). Le jeton est demandé à Grist au clic, utilisé pour la récupération du PDF, puis jamais écrit (ni console, ni message, ni adresse). Une adresse `blob:` ne contient pas de jeton.
- **Verrou** : pendant « Ouverture en cours… », les clics sur ce bouton sont ignorés (déjà dit) ; les autres boutons du bloc restent utilisables.
- **Annonce** : au début de la récupération, le bouton est le seul à changer de texte (non annoncé de façon fiable) ; ce n'est pas gênant car l'action est courte et son résultat (nouvel onglet ou alerte `role="alert"`) est perceptible. Pas de région `role="status"` supplémentaire pour « Voir ».
- **Alerte d'échec** : elle est effacée au clic suivant sur un bouton « Voir » (nouvelle tentative) ou quand l'état du bloc change ; elle n'a pas de bouton de fermeture. Elle est en haut du bloc, la même zone que les alertes A5 et A6 : une seule alerte à la fois, la plus récente remplace l'autre.
- **Focus** : en cas de succès, le focus quitte la page avec l'onglet ; au retour sur la page, il est resté sur le bouton « Voir ». En cas d'échec, il reste sur le bouton (jamais déplacé sur l'alerte).
- **Après une génération réussie** : « Voir la convention » reçoit le focus et l'alerte « Convention générée. » est affichée (§3, « Après une réussite »).

Qui voit et modifie : les règles d'accès du document décident ; le widget ne les contourne pas. FT National, Régional et Départemental agissent chacun sur son périmètre ; si Grist refuse les tables de la convention (ANS notamment), le bloc affiche « Droits insuffisants » (voir plus haut). Si l'utilisateur n'a pas le droit d'écrire, les boutons d'écriture (générer, déposer, remplacer) échouent proprement avec un message d'erreur (§5) ; les boutons « Voir » restent utilisables (en lecture, si ses droits lui permettent de lire le fichier). Ce cas (lecture permise, écriture refusée) est différent de l'état « Droits insuffisants » (lecture refusée).

Mobile : le bloc passe sous les autres, déjà le cas dans la fiche. Les boutons gardent leur taille normale et passent à la ligne.

## 3. Écran B : fenêtre « Convention » (générer ou re-générer)

La fenêtre sert à générer, et à re-générer depuis « Re-générer » (état Générée) : dans ce cas, elle est préremplie avec les informations enregistrées et « Générer la convention » remplace l'ancien PDF, sans historique. Les anciens états « générée » et « sans modèle » de la fenêtre sont supprimés : ils sont dans le bloc (écran A).

Structure et comportement repris de la fenêtre « Ajout d'une action » (script.js, `addActionModalHtml`) : `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `tabindex="-1"`, `modal fade show`, formulaire dans `modal-content`.

**Taille : `modal-xl`**, la plus large taille du design system. Dans la feuille du CDN : 800 px de large entre 992 et 1199 px d'écran, puis 1164 px à partir de 1200 px (la feuille contient deux règles pour `.modal-xl`, 1140 px et 1164 px : à vérifier à l'écran). On garde `modal-dialog-scrollable` comme filet : si l'écran est trop court, le corps défile et les boutons restent visibles.

**Disposition (à partir de 1200 px d'écran) : trois colonnes.** Les blocs 1, 2 et 3 se placent côte à côte, sur une seule rangée (il n'y a plus de bloc « Date et lieu »). Ordre de lecture = ordre visuel. Le modèle de convention ne change que le champ « Année » du bloc 1 (voir plus bas), pas la disposition. Estimation : environ 480 px de hauteur pour la fenêtre entière (le bloc 2 est le plus haut), donc sans défilement sur un écran d'au moins 768 px de haut. Je n'ai pas pu mesurer le rendu dans un navigateur : **non vérifié**, à mesurer par Hanta sur la maquette. Sous 1200 px : une seule colonne, la fenêtre défile (la promesse « sans défilement » ne vaut qu'à partir de 1200 px).

Titre (h2, `modal-title`) : « Convention ». Corps : « Les champs marqués d'un * sont obligatoires pour générer la convention. » (mis à jour le 2026-10-23 : l'ancienne phrase « Les champs marqués d'un * sont obligatoires. » laissait croire qu'« Enregistrer les informations » les exige ; il ne les exige pas, voir « Enregistrer et Générer » plus bas), puis trois `fieldset` avec `legend` en `form-legend`, dans cet ordre.

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

### Cases du modèle (décision de Hanta du 2026-10-23)

Le texte d'un modèle de convention contient des **cases** : un nom entre crochets, que le widget remplace par une donnée au moment de fabriquer le PDF. Liste officielle (nom exact entre crochets, puis donnée utilisée) :

| Case | Donnée utilisée |
|---|---|
| [Année] | année saisie dans la fenêtre ; absente pour les modèles sans année (Parcours de remobilisation) |
| [Nom du club] | nom du club de l'action |
| [SIRET du club] | SIRET du club |
| [Siège du club] | adresse, code postal et ville du club, sur une ligne |
| [Signataire du club] | Prénom Nom du contact choisi |
| [Fonction du signataire] | fonction du contact choisi |
| [Nom de l'agence] | nom de l'agence de l'action |
| [Adresse de l'agence] | adresse complète de l'agence, sur une ligne |
| [Représentant de l'agence] | représentant saisi dans la fenêtre |
| [Fonction du représentant] | fonction du représentant saisie dans la fenêtre |

Règles :

1. **Apostrophe.** Le widget accepte l'apostrophe droite (') et l'apostrophe courbe (’) dans les noms de cases : « [Fonction de l'agence] » et « [Fonction de l’agence] » sont lues de la même façon. Cela vaut pour tous les noms de la liste qui contiennent une apostrophe.
2. **Case connue mais vide** (par exemple un club sans SIRET). Le widget écrit des **pointillés** à la place, à compléter à la main sur le PDF imprimé. La génération n'est **pas bloquée**.
3. **Case inconnue** (nom absent de la liste ci-dessus). Elle reste **bloquante** : la génération s'arrête avec le message « Échecs » du §3, qui donne le nom de la case.
4. **Ce qui n'a pas de donnée dans Grist** (SIRET de l'agence, fédération) n'a **pas de case** : le modèle l'écrit en pointillés directement dans son texte. Le widget n'a rien à remplacer.
5. **Noms courts des dispositifs dans le nom du fichier (D-S7-3)** : Stade-emploi (Du stade vers l'emploi), Match-metiers (Match des métiers), Remobilisation (Parcours de remobilisation vers l'emploi). Voir « Nom du fichier PDF », plus bas.

### Bloc 1 : « Informations relatives à la convention »

| Champ | Type | Obligatoire | Remarque |
|---|---|---|---|
| Modèle utilisé | lecture seule | non | selon le dispositif (tableau de correspondance ci-dessus) |
| Année | nombre | oui, pour générer (mis à jour le 2026-10-23) | Du stade vers l'emploi et Match des Métiers seulement ; année en cours proposée (prévu par la note dès le 2026-10-22, le code l'applique : champ prérempli avec l'année en cours, mis à jour le 2026-10-23 ; décision D-4 de Hanta, 2026-10-23 : on garde l'année préremplie avec l'année en cours). Doit avoir quatre chiffres. Absent pour Parcours de remobilisation : le bloc ne contient alors que le modèle utilisé. |

### Bloc 2 : « Signataire club »

| Champ | Type | Obligatoire | Remarque |
|---|---|---|---|
| Nom du club | lecture seule | non | club de l'action |
| SIRET | lecture seule | non | repris de la fiche du club |
| Siège | lecture seule, **sur toute la largeur de la colonne** | non | repris de la fiche du club ; l'adresse s'affiche en entier, sur plusieurs lignes si besoin |
| Signataire | liste de choix | oui, pour générer (mis à jour le 2026-10-23) | **uniquement** les contacts du club (table Contacts) ; texte d'invite « Veuillez sélectionner » |
| Fonction du signataire | lecture seule (mis à jour le 2026-10-23 : jamais modifiable ici) | non à la saisie ; **doit être renseignée pour générer** | colonne Fonction de Contacts, affichée après le choix ; « Fonction non renseignée » si elle est vide |

**Il n'y a plus de bouton ni de formulaire « Ajouter un contact » dans la fenêtre.** Un signataire absent de la liste s'ajoute dans la fiche du club (hors de ce widget), puis l'agent revient.

Une phrase d'aide sous les trois champs en lecture seule : « Pour corriger ces informations, modifiez la fiche du club. » (décision 7 : on ne modifie pas le club ici).

**Siège en entier (correction).** Un champ `input` d'une ligne coupe une adresse longue (« 2 avenue du Stade, 00… »). Le siège passe donc dans un `textarea class="form-control"` en `readonly`, sur toute la largeur de la colonne (même placement que « Nom du club »), avec `rows="2"` : le texte revient à la ligne, rien n'est coupé, et le champ reste atteignable au clavier et lu par les lecteurs d'écran. Dev-interface règle la hauteur selon le texte (au moins 2 lignes, davantage si l'adresse est longue) pour qu'aucun défilement interne n'apparaisse. Composant : voir §8 (page du composant « zone de texte » non lue, **non vérifié**).

Liste de choix : une entrée par contact du club, libellé « Prénom Nom » (comme dans la fiche du club, qui affiche « prénom nom » ; voir `renderContacts`, src/fiche-club/script.js). Si le club n'a aucun contact : voir « Club sans contact » plus bas.

**Non vérifié** : la fiche du club lit les colonnes Club, Prenom, Nom, Email, Telephone de la table Contacts. La colonne **Fonction** annoncée par le chef n'apparaît pas dans src/fiche-club/. Je n'invente rien : à vérifier dans le modèle de données (dépôt model-de-donnees-aucarre) avant de coder. Idem pour les colonnes de la table Agences (agence, adresse, complément, code postal, ville) et pour le siège et le SIRET de Structures.

Si un contact choisi n'a pas de fonction renseignée : la zone « Fonction du signataire » (lecture seule) affiche « Fonction non renseignée » (mis à jour le 2026-10-23 : le code le fait) ; la génération est bloquée **au clic sur « Générer la convention » (S7)**, avec le message du §3 « Enregistrer et Générer » (le modèle de convention cite la fonction). « Enregistrer les informations » reste possible. Le champ ne se corrige pas ici : la fonction se renseigne dans la fiche du club.

### Club sans contact (remplace l'ancien formulaire « Ajouter un contact »)

Le signataire du club est choisi **uniquement** parmi les contacts du club. Le bouton « Ajouter un contact » et son formulaire (nom, prénom, fonction) sont **supprimés** de la fenêtre : la fenêtre ne crée plus de contact et n'écrit plus dans Contacts. La maquette B bis n'est plus à suivre.

Si le club n'a aucun contact :

- **Message** (dans le bloc « Signataire club », sous la liste « Signataire », en `help-block`, relié à la liste par `aria-describedby`) : « Ce club n'a aucun contact. Ajoutez-en un dans la fiche du club, puis revenez générer la convention. » Il remplace l'ancien message « Aucun contact enregistré pour ce club. ».
- **Liste « Signataire »** : elle ne propose que l'invite « Veuillez sélectionner ». La zone « Fonction du signataire » reste vide.
- **Génération impossible** : « Générer la convention » est affiché grisé (`aria-disabled="true"`, `aria-describedby` vers le message ci-dessus, même règle que pour la génération bloquée du bloc §2). Les clics sont ignorés. « Enregistrer les informations » **reste actif** : l'année et le représentant de l'agence restent enregistrables, le signataire n'étant alors pas enregistré.
- **Pourquoi la fenêtre s'ouvre quand même** : contrairement aux quatre blocages du §2, le manque se voit à l'intérieur de la fenêtre (liste des contacts) ; l'agent y retrouve les informations du club et de l'agence et comprend ce qu'il doit faire. Le message est visible dès l'ouverture, sans clic.
- **Annonce** : le message est du texte présent à l'ouverture de la fenêtre, lu en parcourant la fenêtre et relié à la liste ; le focus d'ouverture reste sur le premier champ modifiable (« Signataire » pour Parcours de remobilisation, « Année » sinon), donc l'agent entend le message en arrivant sur la liste.
- Pour revenir : l'agent ferme la fenêtre (« Fermer » ou Échap), ajoute le contact dans la fiche du club, puis rouvre la fenêtre : la liste est relue à l'ouverture.

Structure (message d'aide du design system, page input--help.html §8) :

```html
<label class="form-label" for="clubSignataire">Signataire<span class="required">&nbsp;*</span></label>
<select class="form-control" id="clubSignataire" name="clubSignataire" required aria-describedby="clubSignataireAide">
  <option selected disabled value="">Veuillez sélectionner</option>
</select>
<p class="help-block" id="clubSignataireAide">Ce club n'a aucun contact. Ajoutez-en un dans la fiche du club, puis revenez générer la convention.</p>
```

### Bloc 3 : « Signataire agence »

Le signataire côté France Travail est le directeur d'agence. L'agence et son adresse sont en lecture seule, repris de la table Agences (agence de l'action). **Le représentant ne vient pas de la table Agences** : il est **vide à l'ouverture, obligatoire**, saisi par l'agent et enregistré avec la convention. Sa fonction est **préremplie « Directeur d'agence »**, modifiable.

| Champ | Type | Obligatoire | Valeur de départ |
|---|---|---|---|
| Agence | lecture seule | non | table Agences |
| Adresse | lecture seule (zone de texte, plusieurs lignes) | non | table Agences (adresse, complément, code postal et ville réunis) |
| Représentant | texte | oui, pour générer (mis à jour le 2026-10-23) | **vide** (saisi) |
| Fonction du représentant | texte | oui, pour générer (mis à jour le 2026-10-23) | « Directeur d'agence », modifiable |

**Évolution prévue** : plus tard, le représentant sera choisi dans une liste des utilisateurs de profil « Agence » de cette agence (table Utilisateurs), comme les contacts du club dans le bloc 2. Ce profil n'est pas encore actif : ne pas coder cette liste maintenant. La saisie libre actuelle sera alors remplacée.

Les colonnes de la table Agences qui donnent l'adresse sont à vérifier dans le modèle de données (voir plus haut). Si l'adresse d'une agence est fausse, elle se corrige dans la table Agences, pas ici : **[À CONFIRMER]** qui peut la modifier.

### Champs retirés

Par décision du chef : « SIRET de l'agence » (aucun modèle ne l'utilise) et « Contact protection des données du club » (rempli à la main sur le PDF, article 6.1).

Par les réponses du client (conventions imprimées et signées à la main) : « Nombre d'opérations », « Date de fin », tout le bloc « Date et lieu » (« Fait à » et dates de signature, y compris les deux lieux et dates de Parcours de remobilisation), et la règle « action sans fédération » avec son message (la fédération n'est plus utilisée). Ils n'apparaissent plus nulle part, ni dans la maquette ni dans les textes.

Par la décision de Hanta (tâche 4.1) : le bouton « Ajouter un contact » et son formulaire (Nom, Prénom, Fonction du nouveau contact).

### Pied de la fenêtre

`modal-footer`, de gauche à droite : « Fermer » (secondaire), « Enregistrer les informations » (secondaire), « Générer la convention » (principal, un seul bouton principal).

**Mis à jour le 2026-10-23 : jusqu'à S7, le pied ne contient que « Fermer » et « Enregistrer les informations ».** « Générer la convention » y arrivera avec la génération du PDF ; la phrase « un seul bouton principal » reste vraie à ce moment-là. D'ici là, « Enregistrer les informations » est le seul bouton d'action du pied (il garde son style secondaire ; ne pas le passer en principal sans décision de Hanta).

**Mis à jour le 2026-10-23 (S7) : « Générer la convention » dans le pied.**
- **Place** : en dernier, à droite, après « Enregistrer les informations ». Ordre de Tab = ordre visuel : « Fermer », « Enregistrer les informations », « Générer la convention ». Mobile : les trois boutons gardent leur taille normale et passent à la ligne, dans le même ordre (comportement du `modal-footer` existant).
- **Style** : `btn btn-primary`, structure de la page https://designsystem.francetravail.io/components/detail/button--primary.html. C'est le seul bouton principal de la fenêtre ; « Fermer » et « Enregistrer les informations » restent `btn btn-secondary`. Aucune icône.

```html
<button class="btn btn-primary" type="button" id="conventionGenererFenetre">
  <span class="btn-content">Générer la convention</span>
</button>
```

  (`id` et `type` donnés à titre d'exemple : dev-interface reprend le mécanisme et les `id` déjà employés par « Enregistrer les informations » ; je n'ai pas relu le code.) Pas d'`aria-haspopup` : le bouton n'ouvre rien.
- **Club sans contact : grisé.** Il est affiché, avec `aria-disabled="true"` (jamais `disabled`) et `aria-describedby` pointant vers l'`id` du message « Ce club n'a aucun contact… » déjà en place (`clubSignataireAide` dans la structure du §3). Les clics sont ignorés. Il ne reprend son état normal que si le club a au moins un contact (au rechargement de la liste, c'est-à-dire à la réouverture de la fenêtre). Même règle que la génération bloquée du §2 : message visible, pas d'infobulle. Un lecteur d'écran lit « Générer la convention, bouton, estompé », puis le message.
- **Pendant la génération**, il prend le texte « Génération en cours… » (voir « Générer la convention : de l'ouverture au résultat », plus bas).

### Fermer la fenêtre (mis à jour le 2026-10-23, question Q-H tranchée)

Échap et « Fermer » ferment directement la fenêtre, **même si des champs ont été modifiés et pas enregistrés : aucune confirmation**. Ce qui n'a pas été enregistré est perdu. Le focus revient sur le bouton qui a ouvert la fenêtre (§7). Cette règle remplace la confirmation prévue dans la version du 2026-10-22.

### Enregistrer et Générer : quels contrôles, à quel moment (mis à jour le 2026-10-23)

**« Enregistrer les informations » = brouillon.** Il garde ce qui est saisi, même incomplet. Il **ne contrôle aucun champ obligatoire** : un champ vide est accepté (année, représentant, fonction du représentant, signataire). Seul contrôle : **une année saisie doit avoir quatre chiffres**. Sinon, rien n'est enregistré et deux messages s'affichent :
- sous le champ « Année », après `sr-only` « Erreur : » : « Saisissez une année à quatre chiffres. » (champ en `is-invalid`, `aria-invalid="true"`, `aria-describedby`, structure de la page input--error.html, §8) ;
- en haut du corps de la fenêtre, alerte `alert alert-error`, `role="alert"` : « Certains champs sont à corriger. ».
Un champ « Année » vide est accepté (pas de message). Le message sous le champ disparaît **au clic suivant sur « Enregistrer les informations »**, pas pendant la saisie : comme dans la fenêtre « Ajout d'une action » (décision D-6 de Hanta, 2026-10-23). Je n'ai pas vérifié si l'alerte du haut suit la même règle : à confirmer dans le code par dev-interface.

**« Générer la convention » (S7) contrôle les champs obligatoires**, au clic, dans cet ordre (ordre de lecture de la fenêtre). Il s'arrête sur **tous** les manques à la fois : chaque champ concerné reçoit son message, l'alerte « Certains champs sont à corriger. » s'affiche en haut, et le focus va sur le premier champ à corriger (même mécanique que les erreurs de champ du §5). Messages (validés tels quels, tous affichés à la fois : décision D-3 de Hanta, 2026-10-23, §10) :

| Ordre | Cas | Où | Message exact |
|---|---|---|---|
| 1 | Année absente (modèles avec année) | sous « Année » | « Saisissez l'année de la convention. » |
| 1 bis | Année qui n'a pas quatre chiffres | sous « Année » | « Saisissez une année à quatre chiffres. » (même texte qu'à l'enregistrement) |
| 2 | Aucun signataire choisi | sous « Signataire » | « Choisissez le signataire du club. » (déjà au §5) |
| 3 | Signataire choisi sans fonction | sous « Fonction du signataire », même forme que les autres messages d'erreur : `invalid-feedback`, sans `help-block`, relié au champ par `aria-describedby`, avec `sr-only` « Erreur : » | « Le signataire choisi n'a pas de fonction. Renseignez-la dans la fiche du club, puis revenez générer la convention. » |
| 4 | Représentant vide | sous « Représentant » | « Saisissez le nom du représentant. » (déjà au §5) |
| 5 | Fonction du représentant vide | sous « Fonction du représentant » | « Saisissez la fonction du représentant. » |

Notes : le cas 3 ne s'affiche que si un signataire est choisi (sans signataire, c'est le cas 2 seul). La fonction du signataire étant en lecture seule, le message l'envoie vers la fiche du club et non vers un champ à remplir ; `is-invalid` s'applique au champ en lecture seule comme aux autres, avec `sr-only` « Erreur : » devant le texte. Club sans contact : inchangé (« Générer » grisé, §3 « Club sans contact »). Les quatre blocages du bloc (§2) restent contrôlés avant l'ouverture de la fenêtre.

Ne jamais associer `help-block` et `invalid-feedback` : la règle `.help-block.invalid-feedback` du design system rend le message toujours visible (bug corrigé le 2026-10-23, fiche C30).

### Générer la convention : de l'ouverture au résultat (mis à jour le 2026-10-23 (S7))

Tout ce qui suit s'applique aussi à « Re-générer » (même fenêtre, même bouton) ; ce qui est propre à la re-génération (l'ancien PDF reste en cas d'échec) relève de S8 et n'est pas traité ici.

**Étapes, dans cet ordre** (au clic sur « Générer la convention » du pied). La première qui échoue arrête tout ; les suivantes ne sont pas jouées.

1. **Contrôle des champs obligatoires** (les six messages validés ci-dessus, tous à la fois). Rien n'est écrit, aucune attente affichée. Si tout est bon, on passe à l'étape 2.
2. **Enregistrement des informations**, avant toute fabrication du PDF (décision D-S7-4 de Hanta), avec la même opération que « Enregistrer les informations » (année, signataire, représentant, fonction du représentant). Raison : si la suite échoue, ce que l'agent a saisi est déjà gardé, et la phrase « Vos informations sont conservées » est vraie. Cet enregistrement ne change pas l'état du bloc (« À générer » tant qu'aucun PDF n'est attaché). Il n'affiche pas son propre message de réussite « Informations enregistrées. ». S'il échoue (Grist refuse ou réseau) : le message existant « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. », et la génération s'arrête.
3. **Modèle** : le modèle est trouvé et actif ; les cases du texte sont toutes connues (contrôle local, sans réseau). Deux échecs possibles, voir « Échecs ».
4. **Chargement de la bibliothèque pdfmake** (quelques secondes possibles), puis fabrication du PDF.
5. **Envoi du fichier** et **écriture dans la convention** : le fichier et la date de génération (`PDF_genere`, `Date_generation`). **Une seule opération `applyUserActions` écrit les deux, après l'envoi du fichier** (décision D-S7-1 de Hanta). Ainsi il n'existe pas d'état intermédiaire « fichier présent, date absente » : l'état « À générer » est conservé tant que tout n'est pas écrit (règle du plan).

Un clic de plus sur « Générer la convention » après un échec relance tout depuis l'étape 1 (les anciens messages d'erreur sont effacés au début de chaque tentative).

**Pendant la génération (étapes 2 à 5).**

- **Ce que voit l'agent** : le texte du bouton devient « Génération en cours… » (même procédé que « Envoi en cours… » et « Ouverture en cours… »). Le bouton reste en place, `aria-disabled="true"`, **sans** attribut `disabled` (le focus reste dessus, il n'est pas perdu). Le texte d'origine « Générer la convention » revient en cas d'échec.
- **Indicateur d'attente** : texte seulement, pas de `ft-spinner` pour l'instant (décision D-S7-5 de Hanta). Le design system a bien un composant Spinner (`<ft-spinner label="…">`, page https://designsystem.francetravail.io/components/detail/spinner--default.html, composant web chargé par l'autoloader ; variantes de taille : Très petit, Petit, Grand, Défaut). Je n'ai pas pu lire sa documentation développeur (attribut de taille, rôle ARIA) et le tableau de bord n'emploie aujourd'hui aucun composant web : **non vérifié, non prescrit**. Structure de la page, pour mémoire seulement :

```html
<ft-spinner label="Texte d'explication lisible par les lecteurs d'écran"></ft-spinner>
```

- **Ce que le lecteur d'écran annonce** : le changement de texte d'un bouton qui a le focus n'est pas annoncé de façon fiable. Le corps de la fenêtre contient donc une région `role="status"`, **présente dès l'ouverture, vide, et dont seul le texte change** (même principe que `#conventionBlocage`, §2). Au début de l'étape 2 son texte devient : « Génération de la convention en cours. Cela peut prendre quelques secondes. » Elle est vidée à la fin (réussite ou échec ; en cas d'échec, c'est l'alerte d'erreur qui prend le relais). Place : en haut du corps, juste sous la zone d'alerte. Texte ordinaire dans un `<p>`, sans classe d'alerte.

```html
<div role="status" id="conventionAttente">
  <p>Génération de la convention en cours. Cela peut prendre quelques secondes.</p>
</div>
```

  (le `<p>` n'existe que pendant l'attente ; le `div` reste, vide, le reste du temps.)
- **Pas de deuxième clic** : dès le clic, les trois boutons du pied passent à `aria-disabled="true"` et leurs clics sont ignorés (même mécanisme que les boutons grisés du §2). Le verrou est posé **avant** la première opération asynchrone et levé seulement à la fin de la tentative ; il ne dépend pas de l'apparence du bouton. La touche Entrée dans un champ ne relance rien non plus.
- **Fermer et Échap pendant la génération** : ignorés (exception à la règle « Fermer la fenêtre » : fermer pendant l'envoi laisserait l'agent sans savoir si le PDF existe). « Fermer » est grisé comme les deux autres ; Échap ne fait rien. Décision D-S7-2 de Hanta : écart à Q-H, limité à la durée de la génération.
- **Saisie** (décision D-S7-7 de Hanta) : les champs ne sont plus modifiables pendant l'attente (`disabled` sur les trois `fieldset`, ce qui est un attribut natif et non une classe) pour que le PDF corresponde à ce qui est enregistré. Ils redeviennent modifiables à la fin d'un échec, avec les valeurs saisies intactes. Le focus ne bouge pas : il reste sur « Générer la convention » (hors des `fieldset`).

**Après une réussite.**

- La fenêtre se ferme (retrait de `modal` et de `modal-backdrop`), le bloc est recalculé : état « Générée », phrase « Convention générée le [date]. » et phrase d'aide de l'état.
- **Focus** (décision D-S7-6 de Hanta) : sur « Voir la convention », premier bouton du nouvel état. Le bouton qui avait ouvert la fenêtre (« Générer la convention » du bloc) n'existe plus à l'état « Générée » : la règle « le focus revient sur le bouton d'ouverture » (§7) ne peut donc pas s'appliquer, et c'est l'action la plus utile qui reçoit le focus (relire le PDF). Si le bloc ne peut pas porter le focus (cas inattendu), il va sur le titre « Convention » du bloc, rendu focalisable avec `tabindex="-1"`.
- **Message de réussite** : oui. Alerte `alert alert-success`, `role="status"`, en haut du bloc (même place et même forme que A6) : « Convention générée. » (texte déjà au §5). Elle reste affichée jusqu'à la prochaine action dans le bloc (clic sur un bouton du bloc) ou la fermeture de la fiche ; elle n'a pas de bouton de fermeture. Pour qu'elle soit annoncée, la région `role="status"` doit exister dans la page **avant** que le texte y soit placé (le bloc est refait après l'écriture : dev-interface garde la région hors de la partie refaite ou la recrée vide avant d'y mettre le texte).

```html
<div class="alert alert-success" role="status"><p class="alert-content">Convention générée.</p></div>
```

  (structure : celle de l'alerte du §8, avec la classe `alert-success` de la feuille.)

**Échecs.**

Règles communes à tous les échecs ci-dessous : la fenêtre **reste ouverte** ; la saisie est **gardée** (champs intacts, et déjà enregistrés puisque l'étape 2 est passée) ; l'état du bloc reste « À générer » (ou « Générée » avec l'ancien PDF en cas de re-génération) ; aucun fichier n'est attaché à la convention ; le message est l'alerte `alert alert-error`, `role="alert"` (§8) **en haut du corps de la fenêtre**, qui remplace « Certains champs sont à corriger. » (jamais les deux à la fois : les erreurs de champ et les échecs de génération ne se produisent pas dans la même tentative) ; le texte « Génération en cours… » est retiré du bouton, la région d'attente est vidée ; le focus reste sur « Générer la convention » ; le corps défile jusqu'à l'alerte si elle est hors de vue. Chaque message nomme la cause en une phrase, dit quoi faire, et se termine par « Vos informations sont conservées. » Aucun message ne contient d'adresse, de jeton ni de détail technique.

| Cas | Message exact |
|---|---|
| Bibliothèque non chargée (réseau, site bloqué) | « La convention n'a pas pu être générée : l'outil qui fabrique le PDF n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez. Si le problème continue, contactez l'équipe du tableau de bord. Vos informations sont conservées. » |
| Une case inconnue dans le modèle | « La convention n'a pas pu être générée : le modèle contient une case inconnue, « [nom de la case] ». Contactez l'équipe du tableau de bord pour corriger le modèle. Vos informations sont conservées. » |
| Plusieurs cases inconnues | « La convention n'a pas pu être générée : le modèle contient des cases inconnues, « [case 1] », « [case 2] ». Contactez l'équipe du tableau de bord pour corriger le modèle. Vos informations sont conservées. » |
| Modèle inactif ou introuvable | « La convention n'a pas pu être générée : le modèle de convention n'est plus disponible pour ce dispositif. Contactez l'équipe du tableau de bord. Vos informations sont conservées. » |
| Envoi refusé par Grist (droits) | « La convention n'a pas pu être enregistrée : vos droits ne le permettent pas pour cette action. Contactez l'équipe du tableau de bord. Vos informations sont conservées. » |
| Envoi impossible (réseau, serveur) | « La convention n'a pas pu être enregistrée : l'envoi du fichier a échoué. Vérifiez votre connexion, puis réessayez. Vos informations sont conservées. » |
| Fichier envoyé, écriture dans la convention (fichier et date) refusée ou échouée | « La convention n'a pas pu être enregistrée : le fichier a été fabriqué mais n'a pas pu être rattaché à l'action. Réessayez ou contactez l'équipe du tableau de bord. Vos informations sont conservées. » |
| Autre échec inattendu (fabrication du PDF, erreur non prévue) | Message déjà au §5 : « La convention n'a pas pu être générée. Vos informations sont conservées. » |

Précisions :

- **Nom de la case** : écrit tel que dans le modèle, sans les crochets, entre guillemets français, **échappé** comme tout texte affiché (`textContent` ou `escapeHtml`), jamais inséré en HTML brut : le texte du modèle est saisi dans Grist. Si plusieurs cases sont inconnues, toutes sont nommées, dans l'ordre d'apparition et sans doublon ; au-delà de cinq, les cinq premières puis « et d'autres ». Un nom de case n'est pas une donnée de personne.
- **Modèle inactif ou introuvable** : le message est le même dans les deux cas (l'agent n'a pas à distinguer). Il est détecté à l'étape 3, après l'enregistrement : ce que l'agent a saisi est gardé.
- **Refus ou échec de l'envoi** : dev-backend distingue un refus de droits (réponse 401 ou 403 de Grist) d'un échec réseau ou serveur (toute autre erreur). Si la distinction est impossible dans un cas, on affiche le message « réseau » (le plus utile : réessayer). Aucun jeton dans le message ni dans la console.
- **Écriture refusée à l'étape 2** : même chose, c'est le message d'enregistrement du §5 (« Les informations n'ont pas pu être enregistrées… »), car Grist refuse alors la première écriture de la chaîne.
- **Le fichier est envoyé, mais l'écriture échoue** : comme le fichier et la date sont écrits en une seule opération (étape 5, décision D-S7-1), c'est la ligne « Fichier envoyé, écriture… » ci-dessus. Le fichier envoyé reste dans Grist sans être rattaché à la convention (pièce jointe orpheline ; ce que Grist fait d'une pièce jointe qu'aucune cellule n'utilise est **non vérifié**, voir §9) : l'état « À générer » est conservé. Il n'y a pas de cas « Générée sans date ».

**Nom du fichier PDF** (réponse proposée à Q-E ; mis à jour le 2026-10-23 (S7)).

Format (décision D-S7-3 de Hanta) : `Convention-[dispositif]-[club]-[année].pdf`

Règles de fabrication du nom, dans cet ordre :

1. [club] = nom du club de l'action (Structures), puis : retirer les accents (é → e, ç → c) ; remplacer `œ` par `oe` et `æ` par `ae` ; remplacer toute suite de caractères qui ne sont ni une lettre non accentuée (A à Z, a à z) ni un chiffre par un seul tiret `-` (espaces, apostrophes, `&`, `/`, `.`, guillemets, emoji, tout le reste) ; retirer les tirets au début et à la fin ; garder la casse d'origine ; couper à 40 caractères au plus (puis retirer un tiret final éventuel).
2. Si [club] est vide après nettoyage (nom entièrement en caractères non latins, ou vide) : utiliser le mot `club`.
3. [dispositif] = **forme courte** du dispositif de l'action, passée par les mêmes règles de nettoyage que le club (accents, `œ`/`æ`, tout caractère autre que lettre non accentuée ou chiffre remplacé par un seul tiret, tirets de début et de fin retirés, casse d'origine). **Forme courte proposée, à valider par Hanta** (je n'ai pas vérifié que la table Modeles_convention a une colonne Code, ni ses valeurs : si elle existe et porte déjà ces formes, dev-backend la reprend plutôt que de les écrire en dur) :

   | Dispositif | Forme courte | Dans le nom |
   |---|---|---|
   | Du stade vers l'emploi | Stade-emploi | `Stade-emploi` |
   | Match des métiers | Match-metiers | `Match-metiers` |
   | Parcours de remobilisation vers l'emploi | Remobilisation | `Remobilisation` |

   Les deux autres dispositifs n'ont pas de modèle : aucun PDF, donc aucun nom. Si la forme courte est introuvable ou vide après nettoyage, le nom complet du dispositif nettoyé est utilisé (jamais de nom sans dispositif).
4. [année] = l'année de la convention (quatre chiffres) pour Du stade vers l'emploi et Le Match des Métiers.
5. **Quand il n'y a pas d'année** (Parcours de remobilisation) : l'année et son tiret sont omis, le nom devient `Convention-[dispositif]-[club].pdf`. On n'invente pas une année (l'année en cours n'est pas celle de la convention) : le modèle n'a pas d'année.
6. Jamais le nom d'une personne (signataire, représentant), ni le nom de l'agence, ni l'identifiant de l'action : le nom du fichier est visible dans Grist par tous ceux qui voient la table.

Exemples (clubs fictifs) : « Club Sportif d'Exemple », Du stade vers l'emploi, année 2026 → `Convention-Stade-emploi-Club-Sportif-d-Exemple-2026.pdf` ; « Étoile & Cœur FC », Match des métiers, année 2026 → `Convention-Match-metiers-Etoile-Coeur-FC-2026.pdf` ; « Association Exemple », Parcours de remobilisation → `Convention-Remobilisation-Association-Exemple.pdf`.

Limite connue : deux actions du même club, du même dispositif et de la même année donnent le même nom. Ce n'est pas bloquant (le fichier est rattaché à la ligne de l'action, une convention par action). Le nom donné au fichier envoyé ne contrôle pas le titre de l'onglet du navigateur, qui reste celui de l'adresse `blob:`.

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

- Bloc : « Convention » ; « Aucune convention générée. » ; « Convention générée le [date]. » ; « Convention signée, déposée le [date]. » ; « Pas encore de modèle de convention pour ce dispositif. » ; état Droits insuffisants : « Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord. » ; aide à l'état Générée : « Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé. »
- Génération bloquée (bloc, un seul à la fois, dans cet ordre ; texte caché devant : « Convention impossible à générer : ») : « Renseignez l'agence de l'action dans sa fiche. » ; « Renseignez le club de l'action. » ; « Renseignez le dispositif de l'action dans sa fiche. » ; « Renseignez l'adresse du club dans sa fiche. »
- Club sans contact (fenêtre B, bloc Signataire club) : « Ce club n'a aucun contact. Ajoutez-en un dans la fiche du club, puis revenez générer la convention. »
- Boutons du bloc : « Générer la convention », « Voir la convention », « Re-générer », « Déposer la convention signée », « Voir la convention signée », « Remplacer le fichier signé ». Textes cachés pour lecteurs d'écran : « (s'ouvre dans un nouvel onglet) » après chaque « Voir » (ces deux commandes sont des boutons). Pendant l'ouverture du PDF : « Ouverture en cours… ».
- Fenêtre B : « Convention » ; « Les champs marqués d'un * sont obligatoires pour générer la convention. » (mis à jour le 2026-10-23) ; « Fonction non renseignée » (fonction du signataire vide, mis à jour le 2026-10-23) ; « Informations relatives à la convention » ; « Signataire club » ; « Signataire agence » ; libellés : voir les tableaux du §3 ; « Pour corriger ces informations, modifiez la fiche du club. » ; « Veuillez sélectionner » ; valeur de départ de la fonction du représentant : « Directeur d'agence ».
- Boutons de la fenêtre B : « Fermer », « Enregistrer les informations », « Générer la convention » (aussi à la re-génération). Mis à jour le 2026-10-23 : jusqu'à S7, seuls « Fermer » et « Enregistrer les informations » sont dans le pied.
- Supprimés avec le formulaire « Ajouter un contact » : « Nouveau contact », « Nom », « Prénom », « Fonction » (du formulaire), « Annuler », « Ajouter ce contact », « Ajouter un contact » et son texte caché.
- Erreur de champ (sous le champ, après `sr-only` « Erreur : ») : « Saisissez [le libellé en minuscules]. » (ex. « Saisissez le nom du représentant. »). Signataire : « Choisissez le signataire du club. » Il n'y a plus de contrôle de date ni de code postal : ces champs n'existent plus dans la fenêtre.
- Mis à jour le 2026-10-23, à l'enregistrement (seul contrôle) : « Saisissez une année à quatre chiffres. » (sous « Année »).
- Mis à jour le 2026-10-23, au clic sur « Générer la convention » (S7, messages validés, détail au §3) : « Saisissez l'année de la convention. » ; « Saisissez une année à quatre chiffres. » ; « Choisissez le signataire du club. » ; « Le signataire choisi n'a pas de fonction. Renseignez-la dans la fiche du club, puis revenez générer la convention. » ; « Saisissez le nom du représentant. » ; « Saisissez la fonction du représentant. »
- Alerte d'erreur en haut du corps de la fenêtre B (`alert alert-error`, `role="alert"`) : « Certains champs sont à corriger. » ; échec d'enregistrement : « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » ; échec de génération : « La convention n'a pas pu être générée. Vos informations sont conservées. »
- Dépôt du fichier signé (bloc, sans fenêtre) : « Envoi en cours… » ; « Convention signée enregistrée. » ; « Le fichier n'a pas pu être enregistré. Réessayez ou contactez l'équipe du tableau de bord. »
- Succès (`alert alert-success`, `role="status"`) : « Informations enregistrées. » ; « Convention générée. » ; « Convention signée enregistrée. »
- Chargement : sur le bouton, pendant la génération, « Génération en cours… » (le bouton reste en place, `aria-disabled="true"`) ; pendant l'envoi du fichier, « Envoi en cours… ».
- Mis à jour le 2026-10-23 (S7), génération : région d'attente de la fenêtre : « Génération de la convention en cours. Cela peut prendre quelques secondes. » ; succès dans le bloc : « Convention générée. » ; échecs (alerte en haut de la fenêtre, textes exacts au §3, « Échecs ») : bibliothèque non chargée, une case inconnue, plusieurs cases inconnues, modèle inactif ou introuvable, envoi refusé, envoi impossible, fichier non rattaché, échec inattendu (« La convention n'a pas pu être générée. Vos informations sont conservées. »).
- Mis à jour le 2026-10-23 (S7), nom du fichier PDF : `Convention-[dispositif]-[club]-[année].pdf`, sans année : `Convention-[dispositif]-[club].pdf` (§3).
- Fichier refusé (dépôt ou remplacement) : « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » ; « Le fichier n'a pas été enregistré : le fichier est vide. » ; « Le fichier n'a pas été enregistré : 10 Mo au maximum. »
- Ouverture d'un PDF (boutons « Voir ») : « Ouverture en cours… » ; échec : « Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord. »

## 6. États

| État | Ce que voit l'agent |
|---|---|
| Ouverture de la fenêtre B | Focus sur le premier champ modifiable : « Année » (Du stade vers l'emploi, Match des Métiers) ; « Signataire » du club (Parcours de remobilisation, qui n'a pas d'année). |
| Champs invalides | Alerte d'erreur en haut, champs en `is-invalid`, messages sous chaque champ, focus sur le premier champ à corriger. Mis à jour le 2026-10-23 : à l'enregistrement, seule une année qui n'a pas quatre chiffres est invalide (un champ vide est accepté) ; les champs obligatoires vides ne sont contrôlés qu'au clic sur « Générer » (S7). |
| Fermeture de la fenêtre B (mis à jour le 2026-10-23) | Échap ou « Fermer » : la fenêtre se ferme tout de suite, sans confirmation, même avec des champs modifiés ; le focus revient sur le bouton d'ouverture. |
| Enregistrement / génération | Bouton en attente, message de succès ou d'erreur dans le corps ; à la génération réussie, la fenêtre se ferme et le bloc passe à « Générée ». |
| Génération en cours (mis à jour le 2026-10-23 (S7)) | Bouton « Génération en cours… », les trois boutons du pied grisés, champs non modifiables, Échap sans effet, phrase d'attente annoncée. |
| Génération réussie (mis à jour le 2026-10-23 (S7)) | Fenêtre fermée, bloc « Générée » avec la date, alerte « Convention générée. », focus sur « Voir la convention ». |
| Génération échouée (mis à jour le 2026-10-23 (S7)) | Fenêtre ouverte, saisie gardée et enregistrée, alerte d'erreur en haut avec la cause, bouton « Générer la convention » à nouveau actif, focus sur lui, état du bloc inchangé. |
| Bloc, tables de la convention refusées (tout profil, ANS compris) | État « Droits insuffisants » : phrase seule, aucun bouton. |
| Bloc, génération bloquée (élément manquant) | Phrase d'état, message du premier élément manquant, bouton « Générer la convention » (ou « Re-générer ») grisé (`aria-disabled`, relié au message). La fenêtre ne s'ouvre pas. |
| Bloc, état Générée | Phrase d'état, phrase d'aide (imprimer, signer, déposer), puis les boutons. |
| Fenêtre B, club sans contact | Liste « Signataire » réduite à l'invite, message « Ce club n'a aucun contact… » sous la liste, « Générer la convention » grisé et relié au message. |
| Re-génération | Fenêtre B préremplie ; à la génération réussie, elle se ferme et l'ancien PDF est remplacé. |
| Fichier PDF choisi | Envoi aussitôt, « Envoi en cours… », puis confirmation (A6). |
| Fichier refusé (pas un PDF, vide, plus de 10 Mo) | Alerte dans le bloc avec le motif, rien enregistré. |
| Clic sur « Voir la convention » ou « Voir la convention signée » | Bouton en attente (« Ouverture en cours… »), puis le PDF s'ouvre dans un nouvel onglet ; en cas d'échec, alerte dans le bloc. |
| Droits insuffisants en écriture | Message d'erreur à l'enregistrement, à la génération, au dépôt ; les boutons « Voir » restent utilisables. |

## 7. Accessibilité (RGAA), mode sombre, données personnelles

- Titres : h1 de la fiche (existant) → h2 de la fenêtre. Les trois blocs sont des `legend` de `fieldset`.
- Chaque champ a un `label` lié (`for` / `id`). Obligatoire : astérisque dans `span.required` **et** attribut `required` ; la phrase d'introduction explique l'astérisque (mis à jour le 2026-10-23 : « obligatoires pour générer la convention » ; le formulaire a `novalidate`, l'attribut `required` ne bloque donc pas « Enregistrer les informations »).
- Champ en lecture seule : `readonly` (il reste atteignable au clavier et lu par les lecteurs d'écran).
- Liste de choix : `label` lié, option d'invite désactivée « Veuillez sélectionner » ; erreur : `is-invalid`, `aria-invalid="true"`, `aria-describedby`.
- Erreurs : jamais portées par la couleur seule (texte « Erreur : » en `sr-only`).
- Focus : à l'ouverture d'une fenêtre, sur le premier champ ; Tab et Maj+Tab tournent dans la fenêtre ouverte ; **Échap ferme** la fenêtre (comme `keepFocusInAddAction`) ; à la fermeture, le focus revient sur le bouton qui l'a ouverte. Mis à jour le 2026-10-23 : même avec des informations non enregistrées, Échap ferme directement, sans confirmation (Q-H tranchée ; la version du 2026-10-22 prévoyait une confirmation [à valider avec le chef]).
- Ordre de lecture = ordre visuel : introduction, blocs 1, 2, 3, boutons du pied. Les trois colonnes se lisent de gauche à droite.
- Boutons qui ouvrent un nouvel onglet (« Voir ») : le dire dans le texte (`sr-only`).
- Bouton grisé : `aria-disabled` + message visible relié par `aria-describedby`. Ne pas utiliser l'attribut `disabled`. S'applique à « Générer la convention » et « Re-générer » quand la génération est bloquée (§2) et à « Générer la convention » de la fenêtre quand le club n'a aucun contact (§3). Le message reste visible (pas d'infobulle seule) et est du texte, pas de la couleur.
- Bloc « Droits insuffisants » : le message est du texte ordinaire dans le flux (pas de région vide ni de bloc caché), identique pour tous les profils.
- Mode clair / sombre : n'utiliser que des variables `--ft-…` ou des classes du design system, aucune couleur écrite en dur. **Constat** : style.css déclare `color-scheme: light` ; le tableau de bord n'est donc pas conçu pour le mode sombre aujourd'hui. Je n'ai pas pu vérifier le rendu en mode sombre : à tester par Hanta. La maquette n'ajoute aucune couleur.
- Zoom 200 % : la fenêtre défile (`modal-dialog-scrollable`), rien n'est coupé ; sous 1200 px d'écran (ce qui arrive à 200 % de zoom sur un écran courant) elle passe en une colonne.
- Données personnelles : seules données de personnes : **nom, prénom et fonction** du représentant de l'agence et du signataire du club , strictement nécessaires pour désigner qui signe. Le widget n'écrit plus dans Contacts : les noms des signataires du club sont lus dans les contacts existants. Pas de téléphone ni d'adresse personnelle demandés dans ce formulaire. Le champ Commentaire de la fiche reste interdit pour noter des données de personnes. Les PDF contiennent ces noms et les signatures : le PDF généré reste dans Grist après la signature mais n'est plus montré ; la durée de conservation reste à décider (§10). Données de la maquette : fictives.

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

- **Détection des droits refusés** : le widget ne lit pas le profil ; il doit repérer proprement que Grist refuse la lecture des tables de la convention (comme il le fait déjà pour les autres tables : une table refusée devient une liste vide, CLAUDE.md) sans confondre « refusé » et « aucune convention ». À vérifier par dev-interface avec dev-backend.
- **Bouton grisé** : le script `disabled-a11y.js` du design system doit bloquer le clic ; à vérifier (voir §8). Dev-interface doit aussi garder le bouton atteignable au clavier (donc `aria-disabled`, jamais `disabled`).
- Hauteur de la fenêtre B sans défilement : estimation, non mesurée. Un écran de 768 px de haut avec la barre du navigateur laisse environ 650 px ; ce sera plus juste avec un siège sur plusieurs lignes ou le message « Ce club n'a aucun contact… ». À mesurer sur la maquette avant de coder.
- Où stocker le PDF généré, le PDF signé et les informations (nouvelle table ou colonnes dans Grist) : le modèle de données est partagé par plusieurs widgets, rien ne doit être renommé et toute nouvelle colonne est à faire valider. Non décidé ici.
- Générer un PDF demande probablement une bibliothèque ou un service : « aucune dépendance sans l'accord de Hanta » (CLAUDE.md). À proposer avec avantages, risques et effort avant tout code.
- Colonnes Grist citées par le chef (Contacts.Fonction, colonnes de Agences) : non vérifiées (voir §3).
- **Zones en pointillés du PDF** : le PDF généré doit laisser de la place pour écrire à la main (nombre d'opérations ou de parcours, date de fin, contact protection des données, « Fait à », dates de signature). À vérifier sur le PDF produit, qui n'est pas dans cette note.
- **Ouverture du PDF par bouton** : l'onglet s'ouvre après une récupération asynchrone, ce que certains navigateurs prennent pour une fenêtre non sollicitée et bloquent. L'ouverture d'un onglet depuis le cadre de Grist est confirmée (essai dans Grist DEV), mais pas avec une adresse `blob:` obtenue après chargement : à tester dans Grist DEV, sur plusieurs navigateurs, avant de livrer. Non vérifié ici.
- **À vérifier pour S8 (re-génération)** : Grist supprime-t-il un ancien PDF qu'aucune cellule n'utilise ? (non vérifié)
- La suppression de l'ancien fichier signé est définitive : elle suit la décision du chef (« sans historique »). Pas de confirmation ni de vérification avant l'enregistrement : le fichier choisi est enregistré tout de suite.

## 10. Liste des [À CONFIRMER]

Tranchés par le chef ou le client et retirés : modèle des états de la fenêtre, contact protection des données (rempli à la main), SIRET de l'agence, bouton sans modèle (masqué), régénération depuis la fenêtre, formulaire de contact dans le bloc (sans seconde fenêtre), correspondance dispositif / modèle, une convention pour une seule action, date de fin et nombre d'opérations (remplis à la main sur le PDF), comparaison de la date de fin avec la date de signature (plus de champ), signataire côté France Travail (directeur d'agence, fonction préremplie et modifiable ; le représentant reste saisi).

Points tranchés (dernière série de décisions du chef) :

- **Corriger une erreur à l'état Générée** : bouton « Re-générer » à côté de « Voir la convention ». Il rouvre la fenêtre Convention préremplie avec les informations enregistrées ; « Générer la convention » remplace l'ancien PDF, sans historique. Le lien « Modifier et régénérer » est retiré.
- **PDF généré après la signature** : quand la convention signée est déposée, le PDF généré (non signé) est gardé dans Grist, mais n'est plus montré. (La durée de conservation des noms de signataires reste à décider.)
- **Dépôt et remplacement du fichier signé** : pas de système de vérification. Le bouton « Déposer la convention signée » et le lien « Remplacer le fichier signé » ouvrent directement le choix du fichier ; le fichier est enregistré tout de suite (en remplaçant l'ancien, sans historique) et la date de dépôt est mise à jour. Seuls les PDF sont acceptés (extension .pdf, type application/pdf, début « %PDF- », non vide, 10 Mo au maximum), sinon un message le dit et rien n'est enregistré. Un message confirme le dépôt. « Voir la convention » et « Voir la convention signée » sont des boutons qui ouvrent le PDF dans un nouvel onglet depuis la mémoire du navigateur (adresse `blob:`), après l'audit de sécurité.

Tranché pour la tâche 4.1 (décisions de Hanta) : droits des profils (National, Régional, Départemental ; tout profil refusé par Grist, ANS compris, voit « Droits insuffisants », sans lecture du profil), message de blocage fondé sur les données enregistrées, « Enregistrer les informations » actif pour un club sans contact, cinq états du bloc, génération bloquée et ses quatre messages, signataire choisi seulement parmi les contacts (plus d'ajout de contact : la question sur les champs du formulaire n'a plus d'objet), conventions imprimées et signées à la main.

Tranché le 2026-10-23 (déjà appliqué par le code, mis à jour le 2026-10-23) : Q-H (Échap et « Fermer » ferment sans confirmation) ; « Enregistrer les informations » = brouillon, seul contrôle l'année à quatre chiffres ; pied limité à « Fermer » et « Enregistrer les informations » jusqu'à S7 ; fonction du signataire en lecture seule.

Décisions de Hanta du 2026-10-23 :

- **D-3 : messages de blocage de « Générer » (S7), les six messages.** Décidé : les six messages du §3 « Enregistrer et Générer » sont validés tels quels, et ils s'affichent tous à la fois.
- **D-4 : année préremplie.** Décidé : on garde l'année préremplie avec l'année en cours (§3, bloc 1).
- **D-5 : message « Renseignez le dispositif de l'action dans sa fiche. »** Décidé : on le garde dans le code, sans le retirer. Il ne s'affiche jamais en pratique (sans dispositif, l'état est « Sans modèle », voir §2).
- **D-6 : moment où disparaît le message d'erreur de l'année.** Décidé : il disparaît au clic suivant sur « Enregistrer les informations », comme dans la fenêtre « Ajout d'une action » (§3).
- **D-S7-1 : une seule opération pour le fichier et la date.** Décidé : une seule opération `applyUserActions` écrit `PDF_genere` et `Date_generation`, après l'envoi du fichier. Le cas de repli prévu pour deux écritures (« Générée » sans date) est retiré de la note (§3, §5).
- **D-S7-2 : Fermer et Échap pendant la génération.** Décidé : ignorés pendant la génération. Écart à Q-H, limité à la durée de la génération.
- **D-S7-3 : nom du fichier (Q-E).** Décidé : `Convention-[dispositif]-[club]-[année].pdf`, et `Convention-[dispositif]-[club].pdf` sans année. Le dispositif suit les mêmes règles de nettoyage que le club. La forme courte du dispositif (Stade-emploi, Match-metiers, Remobilisation) est une proposition à valider, ses valeurs dans Modeles_convention n'étant pas vérifiées (§3). Jamais de nom de personne.
- **D-S7-4 : informations enregistrées avant la fabrication du PDF.** Décidé : oui (étape 2), sans message « Informations enregistrées. ». Une génération échouée laisse la ligne de `Conventions` créée ou mise à jour (état du bloc inchangé).
- **D-S7-5 : indicateur d'attente.** Décidé : texte seulement (« Génération en cours… » sur le bouton + phrase annoncée), pas de `ft-spinner` pour l'instant.
- **D-S7-6 : focus après une réussite.** Décidé : sur « Voir la convention ».
- **D-S7-7 : champs non modifiables pendant la génération.** Décidé : oui (`disabled` sur les `fieldset`).

À confirmer :

1. **Qui peut modifier** les informations de l'agence reprises de la table Agences (agence, adresse, complément, code postal, ville), maintenant affichées en lecture seule ? **[À CONFIRMER]**
2. **Q-B (déjà ouverte au plan)** : une action en corbeille ou annulée garde-t-elle sa convention ? La génération est-elle interdite pour ces statuts ? Non traitée dans cette note : aucun état ni message n'est prévu pour ce cas.
6. **Icônes** : aucune icône n'est utilisée dans les nouveaux messages. Si Hanta en veut une (information, avertissement), son nom est **à vérifier** dans la bibliothèque https://designsystem.francetravail.io/docs/bibliotheque/icones.html.
7. **Variante d'alerte** : si Hanta préfère une alerte du design system plutôt qu'un `help-block` pour les messages de blocage, la variante d'information ou d'avertissement de la feuille est à vérifier (non lue). Le plus proche connu est `alert alert-error`, déjà employé, mais il signale une erreur : je ne le recommande pas ici.
