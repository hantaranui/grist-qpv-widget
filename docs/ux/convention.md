# Convention de partenariat : générer le PDF et déposer la version signée, depuis la fiche d'une action

**La maquette docs/ux/maquette-convention.html n'est plus à jour : en cas d'écart, cette note l'emporte.**

**Statut : validée le 2026-10-22** (mise à jour de la tâche 4.1, après les réponses du client et de Hanta ; la version précédente avait été validée par le chef avant ces réponses). Dev-interface peut coder le bloc (tâche 4.2).

**Mis à jour le 2026-10-23 (S7)** : ajouts pour la génération du PDF, sans rien changer aux décisions antérieures : pied de la fenêtre (§3), « Générer la convention : de l'ouverture au résultat » et nom du fichier (§3), compléments sur « Voir » (§2), textes (§5), états (§6), décisions D-S7-1 à D-S7-7 (§10). Hors périmètre : « Re-générer » (S8) et dépôt du fichier signé (S9).

**Mis à jour le 2026-10-23** (après les tâches 5.1a et 5.1b, avant les tests 5.3b) : la note reprend les décisions déjà appliquées par le code pour la fenêtre « Convention ». Chaque changement porte la mention « mis à jour le 2026-10-23 ». Les points qui attendent Hanta sont dans le §10, rubrique « À décider par Hanta (2026-10-23) ».

**Mis à jour le 2026-10-25 (mise en page)** : nouvelle section §11 « Mise en page du PDF » (ce que dev-backend doit reproduire d'après les Word officiels), décisions D-MEP-1 à D-MEP-7 à la fin du §11. Rien d'antérieur n'est changé.

**Mis à jour le 2026-10-26 (S8)** : nouvelle section §12 « Re-générer » (bouton, fenêtre, ce qui change, réponses proposées à Q-I et Q-J, échec sans perte de l'ancien PDF), décisions D-S8-1 à D-S8-7 tranchées par Hanta le 2026-10-26 (tableau au §12.10 ; seule la vérification D-S8-7 reste à faire par Hanta dans DEV7, avant la recette R5). Rien d'antérieur n'est changé ; trois renvois ont été ajoutés (§3, §9, §10).

**Mis à jour le 2026-10-29 (E1), Évolution 1 : allègement de la fenêtre « Convention »** (retours du chef, docs/backlog.md, section « Évolution 1 (E1) », qui fait foi). Quatre points : (1) fenêtre allégée : deux blocs « Club » et « Agence », plus de « Modèle utilisé » ni d'« Année », dispositif et campagne en sous-titre (§3) ; (2) **plus aucun champ obligatoire dans la fenêtre**, un champ vide donne des pointillés, le seul blocage reste à l'ouverture (club et agence, §2) ; (3) signataire du club : liste de contacts **ou** saisie libre d'un contact (la ligne dépliante a été remplacée par un bouton « Ajouter un contact » le 2026-10-29, voir l'encart « bouton Ajouter un contact » plus bas) ; un contact saisi ainsi est toujours créé dans Contacts (la case « Ajouter ce contact… » a été retirée par Hanta, 2e série du 2026-10-29) (§3) ; (4) **le bouton « Enregistrer les informations » est supprimé** : Fermer, la croix éventuelle et Échap enregistrent en silence (§3). Les passages concernés portent la mention « mis à jour le 2026-10-29 (E1) ». Là où une ancienne règle est remplacée, elle est dite remplacée. **Les §11 (mise en page du PDF), §12 (Re-générer) et §13 gardent leur texte d'origine, avec un renvoi en tête de chaque section vers ce qui change.** Les décisions qui reviennent à Hanta sont au §10, rubrique « À décider par Hanta (2026-10-29, E1) ». La maquette de référence de l'E1 (claude.ai/artifact/64Z3t7tDL1Nfuu9P3pbLAG) n'a pas pu être ouverte depuis cette session (autre organisation) : la note suit le backlog.

**Mis à jour le 2026-10-29 (E1, précision Email)** : la ligne dépliante du signataire reprend les champs du vrai formulaire « Ajout d'un contact » du widget clubs (src/clubs/script.js, `CHAMPS_CONTACT`), décision de Hanta (docs/backlog.md, Évolution 1, point 3 et D-E1-3, qui font foi) : **Nom\* (obligatoire dans ce cas), Prénom, E-mail\* (obligatoire dans ce cas), Fonction**. Téléphone n'est pas repris. La condition de création devient **« Nom rempli » seul** (elle était « Prénom ou Nom »). Nouveau cas d'échec : Nom rempli mais E-mail vide, message sous le champ E-mail (§3). L'e-mail du signataire rejoint les données personnelles (§7). Tout ce qui parlait de « Prénom ou Nom » est corrigé ; la case à cocher et `Signataire_club_texte` n'apparaissent plus que dans les phrases qui disent qu'ils sont retirés. Les passages changés portent la mention « mis à jour le 2026-10-29 (E1, précision Email) ».

**Mis à jour le 2026-10-29 (E1, alignement sur la maquette et D-E1-12/14)** : relecture de la note face à la maquette de référence validée par le chef (docs/ux/maquette-convention-e1.png et .html, qui ne sert qu'à valider disposition, champs et comportement, jamais l'apparence : aucune couleur ni aucun style n'en est repris) et face au backlog à jour. Trois corrections : (1) **D-E1-12 est confirmée** : la phrase « Ce contact sera ajouté à la fiche du club. » est sous « Fonction du signataire », jamais sous Prénom/Nom ; les mentions « à confirmer par Hanta » sont retirées et le passage ambigu « en fin de zone » est corrigé (§3, §10) ; (2) **D-E1-14 est confirmée** : le contrôle de forme de l'e-mail et la consigne « coordonnées professionnelles, pas personnelles » sont décrits au §3 (« Contrôle de forme de l'e-mail et consigne ») et aux §5, §7, §10 ; (3) la disposition générale a été comparée : deux colonnes, encart Club sur une ligne, encart Agence au nom seul, sous-titre, pied avec seulement Fermer et Générer la convention, tout correspond. Les écarts entre la maquette et la note qui ne sont pas décidés dans le backlog ne sont pas tranchés ici : ils sont au §10, rubrique « Nouvelles questions pour Hanta (2026-10-29, maquette E1) ».

**Mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)** : cinq décisions du backlog (D-E1-15 à D-E1-19, section « Évolution 1 », qui fait foi) : (1) **D-E1-15** : la ligne dépliante `<details>` « Le contact n'est pas dans la liste : l'ajouter » est remplacée par un **bouton secondaire « Ajouter un contact »**, sous la liste « Signataire », qui ouvre le petit formulaire (Nom, Prénom, E-mail, Fonction) à son clic ; il se referme par **un autre clic sur le même bouton** (confirmé par Hanta, mis à jour le 2026-10-29 (E1, réponses de Hanta)) ; (2) **D-E1-16** : les deux textes d'aide (« * Nécessaires pour ajouter ce contact. » et la consigne « coordonnées professionnelles ») sont **retirés** ; il n'en reste aucun dans le formulaire ; le contrôle de forme de l'e-mail reste ; (3) **D-E1-17** : **plus aucun astérisque ni `required`**, y compris sur Nom et E-mail ; Nom vide : rien n'est créé ; Nom rempli et E-mail vide ou mal formé : le message d'erreur existant sous E-mail, sans jamais bloquer la saisie ; (4) **D-E1-18** : **espacement généreux** entre Nom, Prénom, E-mail et Fonction, comme dans les autres formulaires de la fenêtre ; (5) **D-E1-19** : l'encart Club (lecture seule) **n'a plus de poignée de redimensionnement** et sa hauteur suit son contenu, sans espace vide. Les passages changés portent la mention « mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) » ; ils sont dans le §3 (corps, bloc Club, ligne remplacée par le bouton, cas d'échec, contrôle de forme), le §6 (états), le §7 (accessibilité, données personnelles), le §8 (composants, classes) et le §10 (D-E1-2, D-E1-14, Q-M1 à Q-M8, nouvelles lignes D-E1-15 à D-E1-19). **Dans les passages plus anciens, « ligne dépliante » se lit désormais « formulaire du bouton Ajouter un contact » (même emplacement, même rôle).** La D-E1-2 (élément `<details>`) est remplacée.

**Ajouté le 2026-10-30 (E2)** : nouvelle section §14 « Voir le PDF dans une pop-up et le télécharger avec son vrai nom » (backlog, Évolution 2, E2-1 à E2-4, qui fait foi). **« Voir la convention » et « Voir la convention signée » n'ouvrent plus de nouvel onglet : ils ouvrent une pop-up dans le widget** ; un bouton « Télécharger » est ajouté dans le bloc et dans la pop-up. Là où le §2 parle d'un « nouvel onglet » pour « Voir », le §14 l'emporte. Trois questions tranchées par Hanta le 2026-10-30, voir §14.9.

**Mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée)** : réponses de Hanta à trois questions de la mise à jour précédente. (1) La fermeture du formulaire par un second clic sur « Ajouter un contact » est **confirmée**. (2) La phrase « Ce contact sera ajouté à la fiche du club. » est **gardée telle quelle**, sous « Fonction du signataire ». (3) La **phrase d'introduction** de la fenêtre (§3 « Corps », §5 « Textes », §10 Q-M2) devient « Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature. », **sans exception ni « sauf »** : plus aucune référence à un cas où quelque chose serait obligatoire.

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
2. Dans le bloc **Convention**, cliquer sur « Générer la convention ». Si l'agence ou le club de l'action manque, le bouton est grisé et un message dit quoi remplir : le parcours s'arrête là (voir « Génération bloquée », §2 ; mis à jour le 2026-10-29 (E1) : l'adresse du club ne bloque plus).
3. Dans la fenêtre (mis à jour le 2026-10-29 (E1)) : **rien n'est obligatoire**. L'agent peut choisir le signataire du club dans la liste des contacts, ou cliquer sur le bouton « Ajouter un contact » et saisir un contact dans le petit formulaire qui s'ouvre (Nom, Prénom, E-mail, Fonction ; aucun champ n'est marqué obligatoire, mais sans Nom rien n'est créé, et avec un Nom il faut un e-mail valide ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) ; ce contact sera créé dans la fiche du club à la fermeture ou à la génération. Il peut aussi saisir le représentant de l'agence et sa fonction. Ce qu'il laisse vide donne des pointillés dans le PDF.
4. Il n'y a plus d'étape « Enregistrer les informations » (mis à jour le 2026-10-29 (E1) : bouton supprimé). Si l'agent ferme la fenêtre sans générer (Fermer, croix éventuelle, Échap), ce qui est saisi est enregistré en silence.
5. « Générer la convention ». Un seul contrôle de champ, seulement si un Nom de nouveau contact est saisi : l'E-mail doit l'être aussi (§3, mis à jour le 2026-10-29 (E1, précision Email)) ; la saisie est enregistrée, puis le PDF est fabriqué. La fenêtre se ferme, le bloc passe à l'état « Générée ».
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

Les boutons qui ouvrent la fenêtre (« Générer la convention », « Re-générer ») sont dans le bloc Convention, **pas** à côté de Supprimer, Annuler et Enregistrer. Ces trois boutons gardent leur place et leur sens. Mis à jour le 2026-10-29 (E1) : la fenêtre Convention (par Fermer, la croix éventuelle, Échap ou Générer) n'enregistre pas la fiche (Intitulé, Statut, etc.), seulement les informations de convention (et, si un Nom est saisi dans la ligne dépliante du signataire, un contact dans la fiche du club ; mis à jour le 2026-10-29 (E1, précision Email)).

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

**Génération bloquée (A8 à A11, nouveau).** À l'état « À générer » (et pour « Re-générer » à l'état « Générée »), la génération est bloquée tant qu'un des éléments ci-dessous manque. Le widget vérifie dans cet ordre et **n'affiche que le message du premier élément manquant** (un seul message à la fois).

**Mis à jour le 2026-10-29 (E1) : seuls l'agence et le club bloquent.** Il faut **un club ET une agence** sur l'action pour ouvrir la fenêtre ; sinon l'agent retourne compléter la fiche de l'action. **Ce blocage, posé ici au niveau du bloc avant l'ouverture, suffit** : la fenêtre n'a aucun contrôle de présence à elle (§3 « Enregistrer et Générer »). L'**adresse du club** ne bloque plus (message n° 4 supprimé) : une adresse absente donne des pointillés dans le PDF. Le message n° 3 (dispositif) reste dans la liste, inchangé (D-5) : il ne s'affiche jamais, voir plus bas. Avant l'E1, quatre éléments bloquaient.

| Ordre | Élément manquant | Message exact |
|---|---|---|
| 1 | Agence de l'action | « Renseignez l'agence de l'action dans sa fiche. » |
| 2 | Club de l'action | « Renseignez le club de l'action. » |
| 3 | Dispositif de l'action | « Renseignez le dispositif de l'action dans sa fiche. » |
| ~~4~~ | ~~Adresse du club~~ | ~~« Renseignez l'adresse du club dans sa fiche. »~~ **Supprimé le 2026-10-29 (E1)** : une adresse absente donne des pointillés, ne bloque plus |

**Mis à jour le 2026-10-23 : le message n° 3 (« Renseignez le dispositif… ») ne peut jamais s'afficher dans le bloc.** Sans dispositif, l'état du bloc est « Sans modèle » (règle d'ordre des états plus bas : un dispositif sans modèle n'a jamais de bouton), et le bloc n'arrive donc jamais à l'état « À générer » ou « Générée » où ces messages s'affichent. **Décision D-5 de Hanta (2026-10-23) : le message est gardé dans le code, sans être retiré.** Il ne s'affiche jamais en pratique : sans dispositif, l'état est « Sans modèle », et la phrase « Pas encore de modèle de convention pour ce dispositif. » reste le seul retour visible pour un dispositif absent.

- **Où** : dans le bloc Convention, **sous la phrase d'état et juste au-dessus du bouton grisé**, dans le flux de la page (jamais dans une infobulle seule, jamais dans la fenêtre B : la fenêtre ne s'ouvre pas).
- **Quand** : dès l'affichage du bloc, sans clic. Le message suit **les données enregistrées** de l'action, du club et de l'agence, jamais une valeur en cours de saisie et pas encore enregistrée. Il reste visible tant que l'élément manque ; il disparaît (et le bouton redevient actif) quand l'élément est renseigné. Il n'y a jamais de message affiché pour un élément qui n'est pas manquant.
- **Mis à jour le 2026-10-29 (E1)** : les messages valables sont désormais deux (agence, club) ; le n° 3 ne s'affiche jamais ; le n° 4 est supprimé.
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

**Disposition (mis à jour le 2026-10-29 (E1)) : deux blocs, côte à côte.** Il n'y a plus de colonne « Informations relatives à la convention », ni de champ « Modèle utilisé », ni de champ « Année » (l'année vient de `Actions.Campagne`, voir « Titre et sous-titre » ci-dessous). Les blocs sont : **1. Club** (à gauche) et **2. Agence** (à droite), chacun dans un `fieldset` avec une `legend` en `form-legend`. Ordre de lecture = ordre visuel : sous-titre, phrase d'introduction, bloc Club, bloc Agence, pied. Deux colonnes à partir de **1100 px** (mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne) ; D-E1-20 du backlog, le seuil de 1200 px était trop haut), une colonne en dessous, la fenêtre défile alors. La hauteur est plus faible qu'avec trois colonnes, mais je ne l'ai pas mesurée : **non vérifié**. Avant l'E1 : trois colonnes (mises à jour du 2026-10-23, remplacées ici).

**Titre et sous-titre (mis à jour le 2026-10-29 (E1)).** Titre (h2, `modal-title`) : « Convention », inchangé. **Le dispositif et l'année vont dans un sous-titre**, un simple `<p>` placé **dans l'en-tête de la fenêtre (`modal-header`), sous le titre « Convention »** (mis à jour le 2026-10-29 (E1, Q-M3 tranchée) : il n'est plus dans le corps ; il précède donc toujours la phrase d'introduction), au format « [Dispositif] · Campagne [Campagne] », par exemple « Du stade vers l'emploi · Campagne 2026 ». Le dispositif est celui de l'action ; la campagne est `Actions.Campagne` (référence vers `Campagnes.Campagne`, texte), jamais demandée à l'agent. Si la campagne est vide : le dispositif seul. Pas de classe nouvelle. Le sous-titre est lié à la fenêtre par `aria-describedby` sur le `div` `role="dialog"` : le lecteur d'écran lit « Convention », puis le sous-titre. Je n'ai pas lu de composant « sous-titre de fenêtre » du design system : **non vérifié**, je n'en fabrique pas.

**Corps (mis à jour le 2026-10-29 (E1), précisé le 2026-10-29 (E1, précision Email)).** En tête du corps (le sous-titre est dans l'en-tête), une phrase d'introduction qui remplace « Les champs marqués d'un * sont obligatoires pour générer la convention. » : « Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature. » (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée) : sans exception ni « sauf », aucune référence à un cas où quelque chose serait obligatoire ; remplace « Aucun champ n'est obligatoire, sauf pour ajouter un nouveau contact… ») Texte proposé, `<p>` ordinaire. Aucun attribut `required` dans la fenêtre. Il n'y a plus aucun astérisque dans la fenêtre (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) : pas même sur **Nom** et **E-mail**, D-E1-17).

### Correspondance dispositif → modèle (décidée)

| Dispositif de l'action | Modèle de convention |
|---|---|
| Du stade vers l'emploi | « Du stade vers l'emploi » |
| Match des métiers | « Le Match des Métiers » |
| Parcours de remobilisation vers l'emploi | « Parcours de remobilisation » |
| Aller vers | aucun modèle (état A4 du bloc) |
| Parcours complet d'insertion par le sport | aucun modèle (état A4 du bloc) |

### Champs de la fenêtre selon le modèle (mis à jour le 2026-10-29 (E1) : plus de différence)

Avant l'E1, le champ « Année » existait pour deux modèles sur trois. **Il n'existe plus pour aucun** : la fenêtre est identique pour les trois modèles. Le modèle reste choisi par le dispositif (tableau ci-dessus) mais n'est plus montré dans la fenêtre. Le nombre d'opérations ou de parcours, la date de fin, « Fait à » et les dates de signature ne sont pas demandés : ils sont remplis à la main sur le PDF imprimé.

### Cases du modèle (décision de Hanta du 2026-10-23)

Le texte d'un modèle de convention contient des **cases** : un nom entre crochets, que le widget remplace par une donnée au moment de fabriquer le PDF. Liste officielle (nom exact entre crochets, puis donnée utilisée) :

| Case | Donnée utilisée |
|---|---|
| [Année] | **mis à jour le 2026-10-29 (E1)** : la campagne de l'action (`Actions.Campagne`), jamais saisie dans la fenêtre ; absente pour les modèles sans année (Parcours de remobilisation) ; campagne vide : pointillés. Avant l'E1 : année saisie dans la fenêtre |
| [Nom du club] | nom du club de l'action |
| [SIRET du club] | SIRET du club |
| [Siège du club] | adresse, code postal et ville du club, sur une ligne |
| [Signataire du club] | Prénom Nom du contact référencé par `Signataire_club` (choisi dans la liste, ou créé à partir de la saisie libre) ; sinon pointillés (mis à jour le 2026-10-29 (E1)) |
| [Fonction du signataire] | fonction du contact référencé par `Signataire_club` (celle de Contacts) ; vide : pointillés (mis à jour le 2026-10-29 (E1)) |
| [Nom de l'agence] | nom de l'agence de l'action |
| [Adresse de l'agence] | adresse complète de l'agence, sur une ligne |
| [Représentant de l'agence] | représentant saisi dans la fenêtre |
| [Fonction du représentant] | fonction du représentant saisie dans la fenêtre |
| [SIRET de l'agence] | SIRET de l'agence de l'action (colonne Agences.Siret) |

Règles :

1. **Apostrophe.** Le widget accepte l'apostrophe droite (') et l'apostrophe courbe (’) dans les noms de cases : « [Fonction de l'agence] » et « [Fonction de l’agence] » sont lues de la même façon. Cela vaut pour tous les noms de la liste qui contiennent une apostrophe.
2. **Case connue mais vide** (par exemple un club sans SIRET). Le widget écrit des **pointillés** à la place, à compléter à la main sur le PDF imprimé. La génération n'est **pas bloquée**. **Mis à jour le 2026-10-29 (E1)** : la règle vaut désormais aussi pour tout champ de la fenêtre laissé vide (signataire, fonction du signataire, représentant, fonction du représentant) et pour l'adresse du club.
3. **Case inconnue** (nom absent de la liste ci-dessus). Erreur du modèle, pas d'un champ de la fenêtre : elle reste **bloquante** (inchangé par l'E1) : la génération s'arrête avec le message « Échecs » du §3, qui donne le nom de la case.
4. **Ce qui n'a pas de donnée dans Grist** (SIRET de l'agence, fédération) n'a **pas de case** : le modèle l'écrit en pointillés directement dans son texte. Le widget n'a rien à remplacer.
5. **Noms courts des dispositifs dans le nom du fichier (D-S7-3)** : Stade-emploi (Du stade vers l'emploi), Match-metiers (Match des métiers), Remobilisation (Parcours de remobilisation vers l'emploi). Voir « Nom du fichier PDF », plus bas.

### Bloc 1 : « Club » (mis à jour le 2026-10-29 (E1))

Le bloc Club contient, dans cet ordre : l'encart du club (lecture seule), le choix du signataire, le bouton « Ajouter un contact » et son formulaire (fermé par défaut), la fonction du signataire (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)).

**Encart du club : un seul encart en lecture seule** (remplace les trois champs « Nom du club », « SIRET » et « Siège »). Un seul `textarea class="form-control" readonly` (composant du §8, page de la zone de texte non lue : **non vérifié**), libellé « Club », `rows="3"` (hauteur de départ seulement : voir « Hauteur de l'encart » plus bas, D-E1-19). **Mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne)** : tout le contenu tient sur **une seule ligne logique**, séparé par des virgules, sans retour à la ligne voulu et **sans « SIRET : » devant** (le SIRET est nu). La zone peut seulement passer à la ligne d'elle-même quand le texte est trop long pour la largeur de la colonne. Ce n'est plus l'ancienne présentation en trois lignes (nom, SIRET, adresse chacun sur sa ligne), remplacée.

```
Club Sportif d'Exemple, 000 000 000 00000, 2 avenue du Stade, 00000 Ville-Exemple
```

Ordre : nom, SIRET, puis l'adresse du club (adresse, code postal, ville : la même chaîne que la case [Siège du club], ses éventuels retours à la ligne remplacés par des espaces). Décision D-E1-1, confirmée par l'exemple du chef de projet ; le code (`conventionEncartClub`) fait de même. Une donnée absente n'est pas bloquante : le code écrit « SIRET non renseigné » ou « adresse non renseignée » à sa place, dans la même ligne. Une phrase d'aide sous l'encart, inchangée : « Pour corriger ces informations, modifiez la fiche du club. »

**Hauteur de l'encart (D-E1-19, mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)).** L'encart n'est **plus redimensionnable à la main** : pas de poignée en bas à droite du champ. Sa hauteur **s'ajuste à son contenu réel**, sans espace vide sous la dernière ligne et sans barre de défilement interne : une seule ligne logique, qui passe d'elle-même sur deux lignes ou plus quand le texte est trop long pour la largeur de la colonne (mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne)). Elle est recalculée à l'ouverture de la fenêtre et quand la largeur change (passage de deux colonnes à une colonne, rotation d'un téléphone). Le champ reste un `textarea` en lecture seule (D-E1-1), avec le même contenu et le même libellé. dev-interface supprime le redimensionnement par une classe du widget (propriété CSS `resize`, sans nom du design system, à signaler à Hanta comme toute classe nouvelle) et règle la hauteur sur celle du contenu (par exemple d'après la hauteur de défilement du champ) ; je n'ai pas vérifié si le CSS seul suffit sur tous les navigateurs : **non vérifié**, la méthode est laissée à dev-interface.

**Signataire du club : liste déroulante.** Un `select` (page select--default.html, §8), libellé « Signataire » **sans astérisque**, une option par contact du club, libellé « Prénom Nom », invite « Veuillez sélectionner » (non désactivée désormais : on peut y revenir pour ne rien choisir). Ne rien choisir est permis : le PDF aura des pointillés.

**Fonction du signataire.** Un champ unique, placé **après** le bouton « Ajouter un contact » et son formulaire (ordre de lecture : liste, bouton, formulaire, fonction ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)). **Lecture seule** pour un contact choisi dans la liste (colonne Fonction de Contacts ; « Fonction non renseignée » si vide) ; **modifiable** quand une saisie libre est active (voir plus bas). Un seul champ, pas deux : deux champs de même nom troubleraient un lecteur d'écran. Il passe de `readonly` à modifiable (et inversement) sans changer de place.

**Bouton « Ajouter un contact » et son formulaire (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) ; D-E1-15 à D-E1-18). Remplace la ligne dépliante `<details>` « Le contact n'est pas dans la liste : l'ajouter » et la D-E1-2.** Sous la liste « Signataire », un bouton secondaire « Ajouter un contact ». Le petit formulaire (Nom, Prénom, E-mail, puis le champ « Fonction du signataire ») est **fermé par défaut** et **s'ouvre au clic sur le bouton**, juste sous la liste. Il n'y a plus d'élément `<details>` ni `<summary>`, plus de ligne dépliante, plus de texte « Le contact n'est pas dans la liste : l'ajouter ». Le fonctionnement ne change pas (règle des deux sources, création à la fermeture ou à la génération, ordre technique) : seul l'habillage change, un bouton au lieu d'une ligne dépliante.

**Composant.** Bouton secondaire du design system : `btn btn-secondary` avec `btn-content`, la même structure que les autres boutons secondaires de la fenêtre et du bloc (page https://designsystem.francetravail.io/components/detail/button--primary.html lue, variante `btn-secondary` déjà employée dans le widget ; la page propre du bouton secondaire n'a pas été relue pour cette mise à jour : **non vérifié**). Il est `type="button"` : il n'envoie jamais le formulaire. Pas d'`aria-haspopup` (aucune fenêtre ne s'ouvre).

**Comment il se ferme : un autre clic sur le même bouton (bascule).** C'est la solution la plus simple : aucun bouton de plus, aucune règle de plus, et c'est le même geste que le pli de l'ancienne ligne. Elle ne perd rien : fermer le formulaire ne change que l'affichage, ce qui est saisi est gardé (voir « Fermer le formulaire ne perd rien » plus bas). Détails :
- Le bouton garde le même libellé ouvert ou fermé ; son état est porté par `aria-expanded="false"` (fermé) ou `"true"` (ouvert) et par `aria-controls` vers le formulaire, jamais par la couleur seule.
- Formulaire fermé : attribut `hidden` (ses champs sortent de l'ordre de Tab, leurs valeurs sont gardées).
- À l'ouverture, le focus va sur le champ Nom. À la fermeture, le focus reste sur le bouton.
- Choisir un contact dans la liste vide les champs de saisie (règle des deux sources) mais **ne change pas** l'état ouvert ou fermé du formulaire.
- Autres façons de le fermer : aucune (pas de bouton « Fermer » propre au formulaire, pas de croix). Le bouton « Fermer » du pied de la fenêtre, lui, ferme la fenêtre entière, comme avant.

**Champs (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) ; D-E1-16 et D-E1-17).** Les champs reprennent ceux du vrai formulaire « Ajout d'un contact » du widget clubs (`CHAMPS_CONTACT`, src/clubs/script.js), dans son ordre, sans le Téléphone :

| Champ | Libellé | Marqué obligatoire ? | Où |
|---|---|---|---|
| Nom | « Nom » | **non** (ni astérisque ni `required`) ; sans Nom, rien n'est créé | dans le formulaire |
| Prénom | « Prénom » | non | dans le formulaire |
| E-mail | « E-mail » | **non** (ni astérisque ni `required`) ; avec un Nom, un e-mail valide est nécessaire pour que Grist accepte le contact : sinon le message d'erreur sous le champ (voir « Cas d'échec ») | dans le formulaire |
| Fonction | « Fonction du signataire » | non, modifiable | **champ unique** placé juste après le formulaire (voir plus haut « Fonction du signataire ») |

- **Aucun astérisque, aucun `span.required`, aucun attribut `required`**, y compris sur Nom et E-mail (D-E1-17). Le formulaire de la fenêtre garde `novalidate`. La saisie n'est jamais bloquée : on peut taper, effacer, fermer et rouvrir sans qu'un champ « obligatoire » se déclenche.
- **Nom vide = rien n'est créé**, comme avant, sans message.
- **Nom rempli et E-mail vide ou mal formé = le message d'erreur existant sous le champ E-mail** (texte et comportement inchangés, voir « Cas d'échec » et « Contrôle de forme de l'e-mail » plus bas). Ce message n'apparaît qu'au clic sur « Fermer » (ou Échap) ou sur « Générer la convention », jamais pendant la saisie.
- **Aucun texte d'aide dans le formulaire** (D-E1-16) : ni « * Nécessaires pour ajouter ce contact. », ni « Saisissez des coordonnées professionnelles (adresse e-mail de la structure), pas des coordonnées personnelles. », ni aucun autre. Ni sous le bouton, ni au-dessus des champs, et aucun `aria-describedby` vers un texte d'aide qui n'existe plus. Les seuls textes du formulaire sont les libellés et, quand il y a lieu, le message d'erreur sous E-mail. (La phrase « Ce contact sera ajouté à la fiche du club. » n'est pas dans le formulaire : elle est sous « Fonction du signataire », D-E1-12, et D-E1-16 ne la cite pas ; gardée, confirmé par Hanta, §10.)
- **Espacement généreux entre les champs (D-E1-18).** Nom, Prénom, E-mail et Fonction sont séparés comme le sont les champs des autres formulaires de la fenêtre (bloc Agence : Agence, Représentant, Fonction du représentant), jamais serrés : Prénom ne doit pas être presque collé au champ du dessus. L'espace entre deux champs est le même du premier au dernier. dev-interface le règle avec la variable d'espacement du design system déjà employée par les champs de la fenêtre (elle la relit dans style.css : je n'en cite pas la valeur, **non vérifiée**), et range chaque couple libellé + champ dans son propre conteneur, comme dans les autres formulaires. Si une classe du widget est nécessaire, elle est signalée à Hanta.
- Un contact saisi ici est **toujours créé dans Contacts** (décision de Hanta, sans case à cocher). Les doublons avec un contact existant restent possibles ; ils sont acceptés (D-E1-13), la liste déroulante, première chose visible, guidant déjà l'agent vers un contact existant.

Structure proposée (les `id` sont donnés à titre d'exemple ; `hidden` est retiré à l'ouverture ; `aria-describedby` des trois champs pointe vers la phrase d'information, sauf E-mail quand son message d'erreur est affiché) :

```html
<div>
  <button class="btn btn-secondary" type="button" id="signataireAjouter" aria-expanded="false" aria-controls="signataireLibre">
    <span class="btn-content">Ajouter un contact</span>
  </button>
</div>
<div id="signataireLibre" hidden>
  <div>
    <label class="form-label" for="signataireNom">Nom</label>
    <input class="form-control" id="signataireNom" name="signataireNom" type="text" autocomplete="off" aria-describedby="signataireLibreAide">
  </div>
  <div>
    <label class="form-label" for="signatairePrenom">Prénom</label>
    <input class="form-control" id="signatairePrenom" name="signatairePrenom" type="text" autocomplete="off" aria-describedby="signataireLibreAide">
  </div>
  <div>
    <label class="form-label" for="signataireEmail">E-mail</label>
    <input class="form-control" id="signataireEmail" name="signataireEmail" type="email" autocomplete="off" aria-describedby="signataireLibreAide">
  </div>
</div>
<!-- champ unique « Fonction du signataire » (voir plus haut), puis : -->
<p class="help-block" id="signataireLibreAide">Ce contact sera ajouté à la fiche du club.</p>
```

(Pas d'icône proposée sur le bouton : non vérifié dans la bibliothèque d'icônes.)

**Où est la phrase d'information (vérifié le 2026-10-29, E1, précision Email) : elle ne pouvait plus rester dans la ligne dépliante.** « Fonction du signataire » est un champ unique placé *après* le formulaire du bouton « Ajouter un contact » (sinon deux champs de même nom troubleraient un lecteur d'écran, voir plus haut). Si la phrase restait à la fin du formulaire, elle serait sous Nom, Prénom et E-mail mais **au-dessus** de Fonction. Elle est donc placée **juste sous « Fonction du signataire »**, c'est-à-dire sous les quatre champs : Nom, Prénom, E-mail, puis Fonction (D-E1-12, option 2, **confirmée** par Hanta dans le backlog ; mis à jour le 2026-10-29 (E1, alignement sur la maquette et D-E1-12/14) : la phrase n'est jamais sous Prénom/Nom seuls). Elle est **visible tant que la saisie libre est active (Nom rempli) ou que le formulaire est ouvert**, et masquée sinon (un contact de la liste, formulaire fermé : la phrase n'a pas de sens). Les quatre champs de la saisie libre la référencent par `aria-describedby` ; le champ Fonction ne la référence que quand la saisie libre est active. **Exception pour E-mail** : quand son message d'erreur est affiché, son `aria-describedby` pointe vers le message d'erreur seulement, jamais vers la phrase d'information en même temps (même règle que la fiche C30 : ne jamais associer un `help-block` d'aide et un `invalid-feedback` sur un même champ). **Mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)** : D-E1-16 retire deux textes d'aide, pas celui-ci (il est sous « Fonction du signataire », hors du formulaire, et D-E1-12 le place là) : gardé, **confirmé par Hanta** (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée)).

**Règle des deux sources, tranchée (D-E1-3, décidée par Hanta dans le backlog).** Il y a un seul signataire. La **saisie libre est active dès que le Nom n'est pas vide** (mis à jour le 2026-10-29 (E1, précision Email) : elle était active dès que Prénom ou Nom n'était pas vide ; Prénom, E-mail ou Fonction seuls, sans Nom, ne l'activent pas et ne créent rien). Tant qu'elle est active :
- la liste affiche, en première option sélectionnée, « Prénom Nom (nouveau contact) » : l'agent voit qui sera le signataire, et que ce contact sera créé, même si le formulaire est fermé. C'est une option de plus dans le même `select`, rien de nouveau ;
- le champ « Fonction du signataire » est modifiable.
Choisir un contact dans la liste **désactive** la saisie libre : Nom, Prénom, E-mail et Fonction saisis sont vidés. Le contraire n'existe pas : taper dans Nom bascule en saisie libre. Si l'agent vide ensuite le Nom, la saisie libre redevient inactive, la fonction saisie est abandonnée et le champ « Fonction du signataire » revient à la valeur du contact sélectionné dans la liste (ou à vide si l'invite est choisie) ; le Prénom et l'E-mail tapés restent à l'écran mais ne servent à rien tant que le Nom est vide, et sont réutilisés si l'agent retape un Nom.

**Fermer le formulaire ne perd rien (cliquer sur « Ajouter un contact », taper un nom, recliquer sur le bouton ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)).** Ouvrir ou fermer le formulaire ne change que l'affichage ; les champs gardent leur contenu et l'option « (nouveau contact) » reste visible dans la liste. Le nom saisi est donc **gardé** et **le contact est créé à la fermeture de la fenêtre ou à la génération**, que le formulaire soit ouvert ou fermé. La saisie n'est perdue que dans deux cas : l'agent choisit un contact dans la liste (la saisie libre est remplacée, volontairement), ou l'enregistrement échoue puis l'agent quitte par un second « Fermer » (voir « Fermer la fenêtre »). Si « refermer » désigne la fenêtre, la réponse est la même : le contact est créé à la fermeture.

**Ce qui est écrit à la fermeture et à la génération (mis à jour le 2026-10-29 (E1, 2e série) ; condition de création changée le 2026-10-29 (E1, précision Email)).** Même mécanisme dans les deux cas (la génération passe par la même étape d'enregistrement, voir « Générer la convention »). Il n'y a **plus qu'une colonne**, `Conventions.Signataire_club` (référence vers Contacts), **toujours utilisée**, que le signataire vienne de la liste ou d'une saisie libre. Il n'y a plus de colonne texte pour le signataire.

| Cas | Dans la fenêtre | Dans `Contacts` | Dans `Conventions` |
|---|---|---|---|
| **Nom rempli et E-mail rempli** | saisie libre active | **une ligne créée, une seule fois** (Club, Nom, Prénom, Email, Fonction) | `Signataire_club` pointe vers la ligne créée |
| **Nom rempli, E-mail vide** | saisie libre active, erreur sous le champ E-mail | **rien n'est créé** | **rien n'est écrit** (voir « Cas d'échec : Nom rempli, E-mail vide ») |

Sinon (**Nom vide**, quels que soient Prénom, E-mail et Fonction) : **rien n'est créé** et `Signataire_club` **garde sa valeur actuelle**, celle de la liste : le contact choisi, ou vide si rien n'est choisi (le PDF a alors des pointillés).

**Ordre technique pour dev-backend, à respecter.** La création du contact doit être **attendue**, son identifiant **reçu**, **avant** toute écriture dans `Conventions`. Aucune écriture ne doit référencer un contact qui n'existe pas encore.
1. **Création du contact** dans `Contacts`, en **une seule** opération `applyUserActions` avec **toutes** les valeurs, club compris (CLAUDE.md, Pièges connus : la règle d'accès refuse une ligne sans club). Jamais de ligne vide remplie ensuite. `DR` et `DD` de Contacts (formules) ne sont jamais écrits. Attendre la réponse.
2. **Réception de l'identifiant** de la ligne créée. **Bascule de la fenêtre dès cet instant** : le contact créé devient un contact de la liste, sélectionné ; Nom, Prénom, E-mail et Fonction saisis sont vidés ; le formulaire est refermé.
3. **Écriture dans `Conventions`**, en une opération, du reste des informations (signataire = l'identifiant reçu, représentant, fonction du représentant), comme aujourd'hui.

**Si la création du contact échoue** (étape 1), **rien d'autre n'est enregistré** : aucune écriture dans `Conventions`. Le message est le message d'échec habituel, comme pour tout échec d'enregistrement : « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » (§5). Il n'y a pas de message propre au contact. La fenêtre reste ouverte, saisie gardée (voir « Fermer la fenêtre »). Aucun contact n'a été créé, donc un nouvel essai repart de zéro.

**Si l'étape 3 échoue après une création réussie**, le contact existe déjà : la bascule de l'étape 2 empêche d'en créer un second. L'essai suivant retrouve le contact choisi dans la liste, sans saisie libre, et n'écrit que `Conventions`. Même chose si l'agent ferme puis rouvre la fenêtre, ou clique sur « Générer » après une fermeture : **un contact n'est créé qu'une seule fois pour une même saisie**. À la réouverture, le contact apparaît dans la liste, choisi, comme tout contact. Cet effet (un contact créé, mais pas encore rattaché à la convention) est accepté ; il n'est pas annoncé à l'agent.

**Cas d'échec : Nom rempli, E-mail vide (nouveau, mis à jour le 2026-10-29 (E1, précision Email)).** Le contact ne peut pas être créé (dans Contacts, Nom et E-mail sont obligatoires, comme dans le vrai formulaire du widget clubs). Au clic sur « Fermer » (ou Échap) ou sur « Générer la convention » :
- **Rien n'est créé et rien n'est écrit**, ni dans Contacts, ni dans Conventions. La génération s'arrête avant l'enregistrement : aucun PDF n'est fabriqué. La fenêtre reste ouverte et **la saisie n'est pas perdue** (Nom, Prénom, Fonction et ce qui est saisi ailleurs dans la fenêtre restent tels quels).
- **Message sous le champ E-mail**, comme un message de champ habituel du design system (structure de la page input--error.html, §8) : « Saisissez l'e-mail du nouveau signataire. » Le message est précédé d'un `sr-only` « Erreur : », le champ passe en `is-invalid` avec `aria-invalid="true"`, et son `aria-describedby` pointe vers le message (voir plus haut pour l'exception sur la phrase d'information).
- Si le formulaire est fermé, il est **rouvert** pour que l'erreur soit visible, et **le focus va sur le champ E-mail**, ce qui fait lire le message au lecteur d'écran.
- Pas d'alerte en haut de la fenêtre pour ce cas : le message de champ suffit (une seule indication, pas de doublon).
- Le message disparaît (et `is-invalid` / `aria-invalid` sont retirés) dès que l'agent tape dans E-mail, ou vide le Nom (la saisie libre redevient inactive), ou choisit un contact dans la liste.
- Après ce message, un second « Fermer » ou Échap **quitte comme d'habitude** (D-E1-5 : fermeture sans enregistrer) ; la saisie du nouveau contact est alors perdue, comme dans tout échec suivi d'un second « Fermer ».
- Cet échec n'utilise **pas** le message général « Les informations n'ont pas pu être enregistrées… » : il ne vient pas de Grist, il vient d'un champ à compléter.
- **Aucun blocage de la saisie (D-E1-17, mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)).** Ni astérisque, ni `required`, ni message pendant la saisie : le champ E-mail n'est jamais présenté comme obligatoire, et l'agent peut taper, effacer, fermer le formulaire ou la fenêtre sans être arrêté. Le message n'apparaît qu'au moment de fermer ou de générer, quand un Nom est rempli et que l'e-mail est vide ou mal formé.

**Contrôle de forme de l'e-mail et consigne « coordonnées professionnelles » (D-E1-14, confirmée ; mis à jour le 2026-10-29 (E1, alignement sur la maquette et D-E1-12/14)). mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) : la consigne est retirée (D-E1-16), le contrôle de forme reste.** Les deux sont repris du vrai formulaire « Ajout d'un contact » du widget clubs (src/clubs/script.js : `MESSAGES_SAISIE_CONTACT`, et la note `contactDialogNote`).
- ~~**Consigne** : « Saisissez des coordonnées professionnelles (adresse e-mail de la structure), pas des coordonnées personnelles. »~~ **Retirée (D-E1-16, mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)).** Le formulaire n'a plus aucun texte d'aide : le `help-block` en haut du formulaire n'existe plus, et aucun champ n'y renvoie. Seul le contrôle de forme ci-dessous demeure.
- **Contrôle de forme** : un E-mail rempli mais **mal formé** est refusé, avec le même contrôle que le vrai formulaire (dev-interface réutilise la fonction `controlerContact` / sa règle de forme, qu'elle lit dans src/clubs/script.js, sans la changer). Au clic sur « Fermer » (ou Échap) ou « Générer la convention » : même mécanique que « E-mail vide » (rien n'est créé ni écrit, aucun PDF, fenêtre ouverte, saisie gardée, formulaire rouvert s'il était fermé, focus sur E-mail, `is-invalid`, `aria-invalid="true"`, `sr-only` « Erreur : », `aria-describedby` vers le message seulement, message effacé dès que l'agent retape dans E-mail, vide le Nom ou choisit un contact dans la liste, pas d'alerte en haut). **Message, repris du vrai formulaire : « Saisissez une adresse e-mail valide, par exemple nom@exemple.fr. »** Un seul message à la fois sous E-mail : « Saisissez l'e-mail du nouveau signataire. » s'il est vide, celui-ci s'il est mal formé.
- Ce contrôle ne s'applique **que si un Nom est saisi** : un E-mail mal formé sans Nom ne crée rien et n'affiche aucune erreur (comme un E-mail seul).

**Prénom, Fonction et E-mail seuls ne créent rien.** La création n'est déclenchée que par un **Nom** rempli. Prénom facultatif, Fonction facultative ; dès que le Nom est rempli, un e-mail valide est nécessaire pour que Grist accepte le contact (sans astérisque ni `required`, D-E1-17). Un E-mail seul, un Prénom seul ou une Fonction seule, sans Nom, ne créent rien et n'affichent aucune erreur. (Remplace la règle « Prénom ou Nom » et D-E1-11.)

**Il n'y a qu'une seule erreur de champ dans la fenêtre : l'E-mail du nouveau contact (mis à jour le 2026-10-29 (E1, précision Email)).** Aucun autre champ n'a de `is-invalid`, d'`invalid-feedback` ni de message « Saisissez… », et il n'y a plus d'alerte « Certains champs sont à corriger. » (voir « Enregistrer et Générer »). Ne jamais associer un `help-block` d'aide et un `invalid-feedback` sur un même champ (bug du 2026-10-23, fiche C30) : voir plus haut pour E-mail.

### Club sans contact (mis à jour le 2026-10-29 (E1))

Un club sans contact **ne bloque plus** : l'agent peut saisir le signataire avec le bouton « Ajouter un contact », ou laisser vide.

- **Message** (en `help-block`, sous la liste, relié par `aria-describedby`), remplace celui du 2026-10-23 : « Ce club n'a aucun contact dans sa fiche. Saisissez le signataire ci-dessous, ou laissez vide pour le compléter à la main. » (texte proposé).
- **Liste** : l'invite seule. **Formulaire « Ajouter un contact »** : fermé, comme toujours (le message le désigne). **« Générer la convention »** : actif, pas grisé.
- Ancienne règle (« Générer » grisé, `aria-describedby` vers le message) : **supprimée** (§3, §6, §7).

### Bloc 2 : « Agence » (mis à jour le 2026-10-29 (E1))

Le signataire côté France Travail reste le directeur d'agence, mais la fenêtre n'affiche plus l'adresse de l'agence : **le nom seul**.

| Champ | Type | Obligatoire | Valeur de départ |
|---|---|---|---|
| Agence | lecture seule (`input readonly`) | non | nom de l'agence de l'action (table Agences) |
| Représentant | texte | **non** | vide ; la valeur enregistrée si elle existe |
| Fonction du représentant | texte | **non** | « Directeur d'agence », modifiable ; la valeur enregistrée si elle existe |

Vider « Fonction du représentant » est permis : pointillés dans le PDF. L'adresse de l'agence (`[Adresse de l'agence]`) reste utilisée dans le PDF, lue dans Agences ; seul son affichage dans la fenêtre disparaît. **Évolution prévue** (inchangée) : plus tard, le représentant sera choisi dans une liste des utilisateurs de profil « Agence » ; ne pas la coder maintenant. Qui peut corriger l'adresse d'une agence : question Q-G, inchangée.

### Champs retirés

Avant l'E1 : « Contact protection des données du club » (décision du chef), « Nombre d'opérations », « Date de fin », bloc « Date et lieu », règle « action sans fédération » (réponses du client), bouton « Ajouter un contact » et son formulaire (tâche 4.1).

**Mis à jour le 2026-10-29 (E1), retirés de la fenêtre :** colonne « Informations relatives à la convention » ; « Modèle utilisé » ; « Année » (avec le contrôle des quatre chiffres) ; les trois champs « Nom du club », « SIRET », « Siège » (remplacés par l'encart) ; l'adresse de l'agence ; tous les astérisques ; le bouton « Enregistrer les informations ». **Réintroduit sous une forme légère** : la saisie libre d'un contact (toujours créé dans Contacts, sans case à cocher), par un bouton « Ajouter un contact » qui ouvre un petit formulaire, fermé par défaut (remplace la ligne dépliante, mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) ; la décision de la tâche 4.1, qui retirait tout ajout de contact, est donc **modifiée** par l'E1 ; la note du backlog le dit).

### Pied de la fenêtre (mis à jour le 2026-10-29 (E1))

`modal-footer`, de gauche à droite : « Fermer » (secondaire), « Générer la convention » (principal, seul bouton principal). **Le bouton « Enregistrer les informations » n'existe plus.** Ordre de Tab = ordre visuel. Mobile : les deux boutons gardent leur taille normale et passent à la ligne, dans le même ordre. « Générer la convention » : `btn btn-primary`, structure inchangée (https://designsystem.francetravail.io/components/detail/button--primary.html) :

```html
<button class="btn btn-primary" type="button" id="conventionGenererFenetre">
  <span class="btn-content">Générer la convention</span>
</button>
```

Pas d'`aria-haspopup`. Il n'est **plus jamais grisé** par l'absence de contact. Pendant la génération, il prend le texte « Génération en cours… » (voir plus bas), et « Fermer » est grisé.

### Fermer la fenêtre (mis à jour le 2026-10-29 (E1))

« Fermer » (bouton), la croix et la touche Échap ont **le même effet : ils enregistrent silencieusement ce qui est saisi, puis ferment la fenêtre**, exactement comme le faisait « Enregistrer les informations » (même opération d'écriture, même contenu), suivi de la fermeture. **Aucun message de réussite** (pas de « Informations enregistrées. »). Le focus revient sur le bouton d'ouverture (§7), comme avant. Il n'y a **pas de confirmation** (Q-H inchangée).

Précisions :
- **La croix** : la structure du §8 (reprise du code) n'a pas de croix dans `modal-header`. Le backlog la cite. **Je n'en ajoute pas** : si la fenêtre n'en a pas, la liste se réduit à « Fermer » et Échap ; à confirmer par dev-interface en lisant le code (D-E1-9).
- **Ce qui est enregistré** : tout ce qui est dans la fenêtre à ce moment, vide compris (un représentant vidé efface la valeur enregistrée ; un signataire vide ne change pas `Signataire_club` s'il vient de la liste), selon la règle « Ce qui est écrit ». Rien n'est écrit si rien n'a changé depuis l'ouverture (à confirmer par dev-backend : l'ancien bouton écrivait toujours, ce n'est pas une règle d'interface).
- **Si l'enregistrement échoue** (Grist refuse ou réseau), enregistrer en silence et fermer ferait perdre la saisie sans le dire. **Proposition (D-E1-5)** : la fenêtre **reste ouverte** et l'alerte existante s'affiche en haut du corps (`alert alert-error`, `role="alert"`) : « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » (texte du §5, inchangé). Un second « Fermer » ou Échap **ferme sans enregistrer**. Aucun texte propre au contact : un échec de création du contact donne ce même message, et rien d'autre n'est enregistré (§3).
- **Pendant la génération** : « Fermer », la croix éventuelle et Échap sont ignorés (D-S7-2, inchangé).
- **Fermer avec le Nom vide** (mis à jour le 2026-10-29 (E1, précision Email)) : rien n'est créé, `Signataire_club` garde sa valeur actuelle, même si Prénom, E-mail ou Fonction sont remplis.
- **Fermer avec le Nom rempli et l'E-mail vide** (mis à jour le 2026-10-29 (E1, précision Email)) : voir « Cas d'échec : Nom rempli, E-mail vide » ; la fenêtre reste ouverte, rien n'est enregistré.

### Enregistrer et Générer : quels contrôles, à quel moment (réécrit le 2026-10-29 (E1))

**Aucun champ n'est obligatoire dans la fenêtre, sauf pour ajouter un nouveau contact. Il n'y a donc plus de contrôle de champ, ni à la fermeture, ni à la génération, à une seule exception (mis à jour le 2026-10-29 (E1, précision Email)) : Nom rempli et E-mail vide, voir « Cas d'échec : Nom rempli, E-mail vide » plus haut.** Les six messages de blocage de l'ancienne version (année absente, année à quatre chiffres, aucun signataire choisi, signataire sans fonction, représentant vide, fonction du représentant vide), l'alerte « Certains champs sont à corriger. », les `is-invalid`, les `aria-invalid` et les `aria-describedby` d'erreur sont **supprimés** (sauf l'erreur de l'E-mail du nouveau contact). Le contrôle de l'ancienne version est **remplacé par les pointillés** : un champ vide donne des pointillés dans le PDF (même règle que les cases connues mais vides, §3 « Cases du modèle », règle 2), y compris l'adresse du club quand elle manque. **Aucun champ vide ne bloque « Générer la convention »**, à l'exception de l'E-mail vide quand un Nom de nouveau contact est saisi.

**Le seul blocage qui reste est à l'ouverture, hors de la fenêtre.** Il faut **un club ET une agence** sur l'action. C'est le blocage du bloc Convention, décrit au §2 (« Génération bloquée »), qui existe déjà : le bouton « Générer la convention » (ou « Re-générer ») est grisé avec le message du premier élément manquant, et la fenêtre ne s'ouvre pas. **Il suffit.** Une fois la fenêtre ouverte, un club et une agence existent forcément (le bloc a été calculé avec eux), donc **aucun autre contrôle de présence n'est nécessaire dans la fenêtre**. Cas limite : si l'agent modifie l'action dans une autre fenêtre pendant que celle-ci est ouverte, c'est le cas « fiche modifiée pendant l'ouverture », déjà accepté sans traitement pour les autres données (voir §12.7) ; rien de plus. Les blocages d'adresse du club (message n° 4 du §2) sont **supprimés** : une adresse absente donne des pointillés.

**Ce qui reste bloquant, mais qui n'est pas un contrôle de champ** : un modèle qui contient une case inconnue (erreur du modèle, pas de l'agent, §3 « Échecs »), un modèle inactif ou introuvable, une bibliothèque non chargée, un envoi refusé. Ces échecs sont inchangés.

### Générer la convention : de l'ouverture au résultat (mis à jour le 2026-10-23 (S7))

Tout ce qui suit s'applique aussi à « Re-générer » (même fenêtre, même bouton) ; ce qui est propre à la re-génération (l'ancien PDF reste en cas d'échec) relève de S8 et n'est pas traité ici : voir le §12 (mis à jour le 2026-10-26 (S8)).

**Étapes, dans cet ordre** (au clic sur « Générer la convention » du pied). La première qui échoue arrête tout ; les suivantes ne sont pas jouées.

1. **Plus de contrôle des champs (mis à jour le 2026-10-29 (E1))** : il n'y a plus de champ obligatoire, donc plus de message de blocage ; on passe directement à l'étape 2. Avant l'E1, les six messages du §3 « Enregistrer et Générer » s'affichaient ici.
2. **Enregistrement des informations**, avant toute fabrication du PDF (décision D-S7-4 de Hanta), avec la même opération que celle de la fermeture de la fenêtre (mis à jour le 2026-10-29 (E1) : signataire du club, représentant, fonction du représentant ; plus d'année ; création du contact si Nom est rempli (et E-mail rempli : sinon l'enregistrement s'arrête avant tout, avec le message sous le champ E-mail, sans PDF ; mis à jour le 2026-10-29 (E1, précision Email)), **attendue avant** l'écriture de `Conventions` : voir « Ordre technique pour dev-backend », §3). Le signataire est traité comme à la fermeture : même règle, même absence de doublon. Raison : si la suite échoue, ce que l'agent a saisi est déjà gardé, et la phrase « Vos informations sont conservées » est vraie. Cet enregistrement ne change pas l'état du bloc (« À générer » tant qu'aucun PDF n'est attaché). Il n'affiche pas son propre message de réussite « Informations enregistrées. ». S'il échoue (Grist refuse ou réseau, **y compris la création du contact**, auquel cas rien d'autre n'est écrit) : le message existant « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. », et la génération s'arrête.
3. **Modèle** : le modèle est trouvé et actif ; les cases du texte sont toutes connues (contrôle local, sans réseau). Deux échecs possibles, voir « Échecs ».
4. **Chargement de la bibliothèque pdfmake** (quelques secondes possibles), puis fabrication du PDF.
5. **Envoi du fichier** et **écriture dans la convention** : le fichier et la date de génération (`PDF_genere`, `Date_generation`). **Une seule requête `PATCH` REST (sur `/tables/Conventions/records`, avec le jeton d'écriture, comme pour le logo du widget clubs) écrit les deux, après l'envoi du fichier** (décision D-S7-1 de Hanta). Pourquoi pas `applyUserActions` : Grist le refuse à un non-propriétaire pour une pièce jointe (voir la fiche C39 de REVIEW_LOG.md). Ainsi il n'existe pas d'état intermédiaire « fichier présent, date absente » : l'état « À générer » est conservé tant que tout n'est pas écrit (règle du plan).

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
- **Pas de deuxième clic** : dès le clic, les deux boutons du pied passent à `aria-disabled="true"` (mis à jour le 2026-10-29 (E1) : « Fermer » et « Générer la convention ») et leurs clics sont ignorés (même mécanisme que les boutons grisés du §2). Le verrou est posé **avant** la première opération asynchrone et levé seulement à la fin de la tentative ; il ne dépend pas de l'apparence du bouton. La touche Entrée dans un champ ne relance rien non plus.
- **Fermer et Échap pendant la génération** : ignorés (exception à la règle « Fermer la fenêtre » : fermer pendant l'envoi laisserait l'agent sans savoir si le PDF existe). « Fermer » est grisé comme les deux autres ; Échap ne fait rien. Décision D-S7-2 de Hanta : écart à Q-H, limité à la durée de la génération.
- **Saisie** (décision D-S7-7 de Hanta) : les champs ne sont plus modifiables pendant l'attente (`disabled` sur les deux `fieldset`, ce qui est un attribut natif et non une classe ; mis à jour le 2026-10-29 (E1) : le bouton « Ajouter un contact » et son formulaire sont dans le fieldset Club, ils sont donc bloqués aussi (le bouton est désactivé par le `fieldset`), mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) pour que le PDF corresponde à ce qui est enregistré. Ils redeviennent modifiables à la fin d'un échec, avec les valeurs saisies intactes. Le focus ne bouge pas : il reste sur « Générer la convention » (hors des `fieldset`).

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
- **Le fichier est envoyé, mais l'écriture échoue** : comme le fichier et la date sont écrits en une seule opération (étape 5, décision D-S7-1), c'est la ligne « Fichier envoyé, écriture… » ci-dessus. Le fichier envoyé reste dans Grist sans être rattaché à la convention (pièce jointe orpheline ; Grist ne la supprime pas, vérifié par Hanta le 2026-10-26, voir §9) : l'état « À générer » est conservé. Il n'y a pas de cas « Générée sans date ».

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
4. [année] = l'année de la convention pour Du stade vers l'emploi et Le Match des Métiers. **Mis à jour le 2026-10-29 (E1)** : elle vient de `Actions.Campagne`, plus d'un champ de la fenêtre. **Campagne vide : l'année et son tiret sont omis**, comme pour Parcours de remobilisation (règle 5). Si la campagne n'est pas une année à quatre chiffres (par exemple « 2026-2027 »), le nettoyage la transforme en `2026-2027` : non vérifié, à confirmer (D-E1-8).
5. **Quand il n'y a pas d'année** (Parcours de remobilisation) : l'année et son tiret sont omis, le nom devient `Convention-[dispositif]-[club].pdf`. On n'invente pas une année (l'année en cours n'est pas celle de la convention) : le modèle n'a pas d'année.
6. Jamais le nom d'une personne (signataire, représentant), ni le nom de l'agence, ni l'identifiant de l'action : le nom du fichier est visible dans Grist par tous ceux qui voient la table.

Exemples (clubs fictifs) : « Club Sportif d'Exemple », Du stade vers l'emploi, année 2026 → `Convention-Stade-emploi-Club-Sportif-d-Exemple-2026.pdf` ; « Étoile & Cœur FC », Match des métiers, année 2026 → `Convention-Match-metiers-Etoile-Coeur-FC-2026.pdf` ; « Association Exemple », Parcours de remobilisation → `Convention-Remobilisation-Association-Exemple.pdf`.

**Fichier signé (mis à jour le 2026-10-26, décision de Hanta)** : le fichier signé déposé reçoit un nom fabriqué avec **les mêmes règles de nettoyage** que celles ci-dessus (accents, `œ`/`æ`, un seul tiret, 40 caractères au plus pour le club, jamais de nom de personne) : `Convention-signee-[dispositif]-[club]-[année].pdf`, et `Convention-signee-[dispositif]-[club].pdf` sans année. Voir le §4.1 k) ; les règles ne sont pas recopiées, ce §3 fait foi.

Limite connue : deux actions du même club, du même dispositif et de la même année donnent le même nom. Ce n'est pas bloquant (le fichier est rattaché à la ligne de l'action, une convention par action). Le nom donné au fichier envoyé ne contrôle pas le titre de l'onglet du navigateur, qui reste celui de l'adresse `blob:`.

## 4. Écran C : dépôt et remplacement du fichier signé (sans fenêtre, maquette C1 et C2)

Il n'y a plus de petite fenêtre de dépôt ni de vérification (pas de case à cocher, pas de bouton « Valider le dépôt », pas de message « L'ancien fichier signé sera supprimé »).

**Choix du fichier (C1)** : le bouton « Déposer la convention signée » (état Générée) ou le lien « Remplacer le fichier signé » (état Signée) déclenche directement un champ fichier caché, `accept="application/pdf,.pdf"`, comme le bouton « Ajouter un logo » de la fiche du club. Ces deux commandes n'ouvrent pas de fenêtre : pas d'`aria-haspopup`. Le design system n'a pas de composant de dépôt de fichier : voir §8.

**Enregistrement immédiat** : dès qu'un PDF est choisi, il est enregistré, en remplaçant l'ancien fichier signé s'il y en a un (sans historique). La date de dépôt est mise à jour et le bloc passe (ou reste) à l'état « Signée ».

**Nom du fichier enregistré (mis à jour le 2026-10-26, décision de Hanta)** : le fichier signé est **renommé au moment du dépôt et du remplacement**. Il est enregistré sous le nom `Convention-signee-[dispositif]-[club]-[année].pdf`, sans l'année pour un modèle qui n'en a pas (Parcours de remobilisation). Les règles de fabrication sont celles du nom du PDF généré (§3, « Nom du fichier PDF »). Détail au §4.1 k).

**Fichier refusé** (dépôt et remplacement, mêmes règles). Le fichier est refusé, un message le dit dans le bloc (A5) et rien n'est enregistré, dans l'un de ces cas :
- il est vide (0 octet) ;
- il dépasse 10 Mo ;
- son extension n'est pas `.pdf` ;
- son type n'est pas `application/pdf` ;
- son contenu ne commence pas par « %PDF- » (contrôle des premiers octets, qui ne se fie pas au nom ni au type annoncé).

**Mis à jour le 2026-10-26 (S9) : l'ordre des contrôles est celui de la liste ci-dessus, et c'est lui qui fait foi** (la version précédente listait les contrôles dans un autre ordre que celui annoncé dans la phrase suivante ; décision déjà prise par Hanta : vide, taille, extension, type, contenu). Un seul message est affiché, celui du premier contrôle qui échoue : vide → « Le fichier n'a pas été enregistré : le fichier est vide. » ; trop gros → « Le fichier n'a pas été enregistré : 10 Mo au maximum. » ; extension, type ou « %PDF- » → « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » Conséquences : un fichier vide nommé `.txt` reçoit « le fichier est vide » ; un fichier de 12 Mo nommé `.docx` reçoit « 10 Mo au maximum » ; la lecture du contenu (« %PDF- ») n'a lieu que si les quatre premiers contrôles sont passés. L'ancien fichier signé, s'il existe, reste en place.

**Envoi en cours (C2)** : le bouton ou le lien qui a lancé le dépôt affiche « Envoi en cours… » et reste en place (`aria-disabled="true"`).

**Succès (A6)** : alerte `alert alert-success`, `role="status"` : « Convention signée enregistrée. ». **Échec d'envoi** : alerte `alert alert-error`, `role="alert"` : « Le fichier n'a pas pu être enregistré. Réessayez ou contactez l'équipe du tableau de bord. » L'état ne change pas. La méthode technique d'envoi de la pièce jointe est décrite dans CLAUDE.md (section Pièges connus) : jeton d'écriture, `credentials 'omit'`, en-tête `X-Requested-With`.

### 4.1 Compléments pour le dépôt et le remplacement (mis à jour le 2026-10-26 (S9))

Sources lues pour ces compléments : ce fichier (§1, §2, §3, §4, §5, §8, §12), `src/actions-dashboard/script.js` (`conventionPhrases`, `conventionVerrouiller`, ligne 3089 pour `Date_generation`) et `src/clubs/script.js` (`bindLogo`, `logoFileProblem`). Rien n'est exécuté.

**Ce qui était déjà juste et n'est pas réécrit** : les textes d'alerte, la liste des contrôles (sauf l'ordre, corrigé plus haut), l'absence de fenêtre, `accept="application/pdf,.pdf"`, l'enregistrement immédiat, le remplacement sans historique, l'absence d'`aria-haspopup`.

**a) Les deux commandes : texte exact, place, style**

| État | Commande | Texte exact | Place | Style |
|---|---|---|---|---|
| Générée | bouton | « Déposer la convention signée » | **dernier** de la rangée : « Voir la convention », « Re-générer », « Déposer la convention signée » (ordre de Tab = ordre visuel, comme au §12.2) | `btn btn-secondary`, sans icône, sans `btn-sm` (la rangée n'a aucun bouton principal, §12.2) |
| Signée | « lien » | « Remplacer le fichier signé » | **sous** la rangée, seul sur sa ligne, après « Voir la convention signée » | `btn btn-link` (§8) |

Le « lien » reste un vrai `<button type="button">` (il n'ouvre pas de page, il lance une action) : pas de `<a>`, pas de `role="link"`. Les lecteurs d'écran l'annoncent « bouton » : c'est exact. Aucun texte caché : la commande n'ouvre ni fenêtre ni onglet. À l'état « Signée », il n'y a ni « Re-générer » ni « Déposer la convention signée » (§2, A3).

```html
<!-- État Générée, dernier bouton de la rangée -->
<button class="btn btn-secondary" type="button" id="conventionDeposer">
  <span class="btn-content">Déposer la convention signée</span>
</button>

<!-- État Signée, sous la rangée -->
<div>
  <button class="btn btn-link" type="button" id="conventionRemplacer">
    <span class="btn-content">Remplacer le fichier signé</span>
  </button>
</div>

<!-- Le même champ fichier caché sert aux deux états (structure de « Ajouter un logo », §8) -->
<input class="convention-file" type="file" id="conventionFichier" accept="application/pdf,.pdf" tabindex="-1" aria-hidden="true">
```

(`id` donnés à titre d'exemple : dev-interface suit les noms déjà employés dans le script.) Les deux commandes ne portent **pas** `aria-haspopup`.

**b) Choisir un fichier : ce qui se passe, dans l'ordre**

1. Clic sur la commande : si elle est verrouillée (envoi en cours), le clic est ignoré **et n'ouvre pas le sélecteur**. Sinon la commande appelle seulement `input.click()` : **aucun verrou, aucun message, aucun changement de texte à ce stade.**
2. L'utilisateur choisit un fichier : le navigateur déclenche l'événement `change`. **C'est là que tout commence** (comme `bindLogo` dans clubs, qui lit le fichier puis remet `input.value = ''` pour que le même fichier puisse être choisi une seconde fois).
3. Au début du gestionnaire de `change` : les alertes précédentes du bloc sont effacées (une seule alerte à la fois, §2), le **verrou est posé avant la première opération asynchrone**, puis les contrôles s'enchaînent dans l'ordre du §4. Un fichier refusé libère le verrou aussitôt, affiche l'alerte A5 et ne passe jamais par « Envoi en cours… ».
4. Si les contrôles passent : le texte de la commande devient « Envoi en cours… », puis envoi, puis écriture (voir e).

**c) Annulation du sélecteur (l'utilisateur ferme la fenêtre du navigateur sans rien choisir)**

Rien ne se passe : **pas de message, pas de changement de texte, pas de verrou, pas d'effacement de l'alerte qui était déjà affichée.** C'est vrai par construction si, et seulement si, tout part de l'événement `change` (étape 2) et jamais du clic de la commande. Raisons et consignes pour dev-interface :
- Selon le navigateur, l'annulation ne déclenche aucun événement, ou un événement `cancel` (présent sur les navigateurs récents). **Ne rien brancher sur `cancel`, ni sur `focus` de la fenêtre** : le comportement varie d'un navigateur à l'autre.
- Si `input.files` est vide dans le gestionnaire de `change` (cas observé quand on annule alors qu'un choix existait), sortir sans rien faire et sans poser de verrou.
- Le focus revient sur la commande (comportement du navigateur) ; dev-interface ne le déplace pas.
- Test à prévoir : annuler le sélecteur ne change ni le texte, ni `aria-disabled`, ni le contenu de la zone d'alerte.

**d) Pendant l'envoi : attente, verrou, accessibilité**

- **Texte** : la commande qui a lancé le dépôt devient « Envoi en cours… » (le texte caché n'existe pas pour ces commandes, il n'y a rien à retirer). Le texte d'origine revient à la fin d'un échec ; en cas de réussite, le bloc est refait (état « Signée »).
- **Verrou** : un seul envoi à la fois. Même principe que « Générer » (§3) : le verrou est une variable du script posée **avant** la première opération asynchrone et levée à la fin de la tentative (réussite ou échec) ; il ne dépend pas de l'apparence. Il couvre la commande de dépôt/remplacement : un second clic, ou la touche Entrée/Espace, ne rouvre pas le sélecteur et ne lance rien.
- **`aria-disabled="true"`, jamais `disabled`** : la commande reste atteignable au clavier, **le focus ne bouge pas**, le lecteur d'écran dit « Envoi en cours…, bouton, estompé ». Le message de l'état d'attente est dans le nom du bouton ; pas besoin d'`aria-describedby` (contrairement au bouton grisé du §2, qui explique un blocage).
- **Les autres boutons du bloc pendant l'envoi** : « Voir la convention » / « Voir la convention signée » restent utilisables (lecture seule). **« Re-générer » est grisé** (`aria-disabled="true"`, clic ignoré, pas d'`aria-haspopup`, texte inchangé) pour qu'une re-génération ne démarre pas pendant qu'un fichier signé est en route ; il se réactive à la fin. Ce n'est pas un blocage au sens du §2 : pas de message, l'attente est dite par la commande « Envoi en cours… ».
- **Si le bloc est refait pendant l'envoi** (rechargement des données de la fiche, par exemple) : le texte « Envoi en cours… », `aria-disabled` et la zone d'attente (ci-dessous) doivent être reposés d'après le verrou, pas d'après l'état précédent.
- **Annonce pour les lecteurs d'écran (recommandation : oui, une région `role="status"`).** Raison : un envoi peut durer plusieurs secondes (jusqu'à 10 Mo), plus qu'une ouverture de PDF (pour laquelle je n'avais pas prévu de région, §2), et le changement de texte d'un bouton qui a le focus n'est pas annoncé de façon fiable. L'alerte de fin ne suffit pas : elle ne dit rien pendant l'attente, et une personne qui ne voit pas l'écran ne sait pas si le clic a été pris en compte. Même principe que `#conventionAttente` (§3) : une région **toujours présente dans le bloc, vide, hors de la partie refaite**, dont seul le texte change.

```html
<div role="status" id="conventionDepotAttente">
  <p>Envoi de la convention signée en cours. Cela peut prendre quelques secondes.</p>
</div>
```

  (le `<p>` n'existe que pendant l'envoi ; la région est **vidée à la fin**, réussite comme échec. Place : sous la zone d'alerte du bloc, au-dessus des boutons. Texte ordinaire, sans classe d'alerte. Elle n'est posée **qu'après** que les contrôles du fichier ont réussi : un fichier refusé n'annonce jamais « Envoi… ».) À la fin, l'alerte de réussite (`role="status"`) ou d'erreur (`role="alert"`) prend le relais.

**e) Fin de l'envoi**

- **Réussite** : alerte `alert alert-success`, `role="status"`, « Convention signée enregistrée. » (A6, texte inchangé), en haut du bloc, même place et même forme que « Convention générée. » (§3). Elle reste jusqu'à la prochaine action dans le bloc ou la fermeture de la fiche, sans bouton de fermeture. La région `role="status"` de l'alerte doit exister **avant** que le texte y soit placé (même consigne qu'au §3).
- **Focus après réussite** (recommandation, voir S9-3) : au **premier dépôt**, la commande « Déposer la convention signée » disparaît (état « Signée ») : le focus va sur **« Voir la convention signée »**, premier bouton du nouvel état (même logique que D-S7-6). Au **remplacement**, le lien « Remplacer le fichier signé » existe toujours : **le focus y reste** ; rien ne disparaît, rien ne bouge.
- **Échec** : alerte `alert alert-error`, `role="alert"` (texte inchangé, §4 ; un cas de droits est proposé en S9-4), l'état et la date ne changent pas, la commande retrouve son texte, **le focus reste sur la commande** (jamais déplacé sur l'alerte, comme pour « Voir », §2).

**f) Date de dépôt**

`Date_depot` est écrite avec **la date du jour au moment de l'écriture, calculée exactement comme `Date_generation`** (secondes Unix, `Math.floor(Date.now() / 1000)`, script.js ligne 3089) et affichée avec le même `formatDate` : « Convention signée, déposée le [date]. », même format que « Convention générée le [date]. ». Elle est **réécrite à chaque dépôt ou remplacement** (la date du dernier fichier, pas celle du premier). Aucune saisie de date par l'utilisateur. (Le type exact de la colonne, Date ou DateTime, n'est pas vérifié ici ; la même valeur est déjà acceptée par `Date_generation`.)

**g) Écriture : une seule opération pour le fichier et la date (recommandation : oui)**

Même décision que D-S7-1, pour la même raison : pas d'état intermédiaire « fichier signé présent, date absente ». Ordre : (1) contrôles ; (2) envoi du fichier, sous le nom fabriqué en k) (jeton d'écriture, `credentials 'omit'`, `X-Requested-With`, §8 de CLAUDE.md) qui donne l'identifiant de la pièce jointe ; (3) **un seul `PATCH` REST** qui écrit `PDF_signe` (liste d'un fichier) **et** `Date_depot` ensemble, avec le même jeton que l'envoi. Rien n'est écrit avant l'étape 3. L'état « Générée » est conservé tant que l'étape 3 n'a pas réussi, et, au remplacement, l'ancien fichier signé et son ancienne date restent en place tant que l'étape 3 n'a pas réussi. Conséquences pour dev-backend, identiques au §12.7 :
1. **Jamais** de vidage préalable de `PDF_signe` (« effacer, puis envoyer, puis remplir »).
2. `PDF_signe` reçoit **une valeur de remplacement** (la liste d'un seul fichier), pas un ajout : la cellule ne contient jamais deux fichiers.
3. `PDF_genere` et `Date_generation` ne sont **jamais touchés** par le dépôt.
4. La mémoire du navigateur (`state.raw.Conventions`) n'est mise à jour qu'après une écriture réussie.
5. Cas « écriture réussie, réponse perdue » : même demande qu'au §12.7 (relire la ligne `Conventions` avant d'afficher un échec, sauf refus clair de Grist ; si `PDF_signe` contient déjà le nouveau fichier, traiter comme une réussite). Si la relecture échoue aussi, risque connu signalé, comme au §12.7.
6. Aucun jeton dans la console, un message, une adresse (CLAUDE.md).

**h) Remplacement du fichier signé : l'ancien devient orphelin (confirmé)**

**Oui, la même règle que D-S8-5 s'applique.** Le widget ne supprime **jamais** une pièce jointe : il remplace seulement la valeur de la cellule `PDF_signe`. L'ancien fichier signé reste dans le stockage des pièces jointes de Grist, non rattaché, sans nettoyage par Grist (D-S8-7, réglée le 2026-10-26 par Hanta pour le PDF généré ; elle vaut pour le fichier signé, c'est le même mécanisme). Si l'envoi réussit mais que le `PATCH` échoue, le **nouveau** fichier est orphelin et l'ancien reste rattaché. Aucune étape « supprimer l'ancien », ni avant ni après. Une suppression depuis le widget serait une tâche à part, avec l'avis d'auditeur-securite (§12.6). Points à noter : le fichier signé contient des signatures et des noms ; sa conservation rejoint la durée de conservation à décider (§7, §10), et chaque remplacement ou échec peut laisser un orphelin de plus.

**i) Mobile (confirmé)**

Oui : sur téléphone, le bouton « Déposer la convention signée » et le lien « Remplacer le fichier signé » **gardent leur taille normale et passent à la ligne comme les autres boutons du bloc** (§2, Mobile ; §12.2), dans l'ordre du clavier. Le lien est seul sur sa ligne sous « Voir la convention signée », à toutes les largeurs. Le texte long « Déposer la convention signée » peut occuper une ligne entière ; il ne doit pas être tronqué (pas de `white-space: nowrap`). La zone d'alerte et la région d'attente restent au-dessus des boutons, pleine largeur. Aucune nouvelle classe : on emploie `btn`, `btn-secondary`, `btn-link` et la classe de rangée du bloc déjà existante (`convention-actions`, §8) ; le champ caché utilise `convention-file` (§8).

**j) Ce qui est à tester en plus (pour le testeur)**

Annuler le sélecteur : rien ne change, aucun verrou. Choisir deux fois le même fichier de suite : le second choix déclenche bien un envoi (`input.value` remis à vide). Second clic ou Entrée/Espace pendant « Envoi en cours… » : rien ne démarre, le sélecteur ne s'ouvre pas. « Re-générer » grisé pendant l'envoi. Fichier de 0 octet nommé `.txt` : message « vide ». Fichier trop gros ne portant pas l'extension `.pdf` : message « 10 Mo ». Fichier `.pdf` dont le contenu ne commence pas par `%PDF-` : message « ce n'est pas un PDF », rien d'écrit. Réussite : une seule opération écrit `PDF_signe` et `Date_depot` ; `PDF_genere` et `Date_generation` inchangés ; la cellule `PDF_signe` ne contient qu'un fichier après un remplacement ; en cas d'échec au remplacement, l'ancien fichier signé s'ouvre toujours avec « Voir la convention signée » ; focus selon e). Aucun jeton dans la console. Nom du fichier enregistré (k) : pour chaque modèle, le nom correspond au format (avec ou sans année) ; un nom de fichier choisi contenant un nom de personne ressort sans lui ; un nom de club à accents, `&` ou plus de 40 caractères donne le même résultat que pour le PDF généré ; un fichier refusé n'est jamais renommé ni envoyé.

**k) Nom du fichier enregistré (décision de Hanta du 2026-10-26)**

Le fichier choisi par l'agent est **renommé au moment de l'envoi**, au dépôt comme au remplacement. Le nom d'origine du fichier n'est jamais repris (il peut contenir un nom de personne) et n'est affiché nulle part.

- **Format** : `Convention-signee-[dispositif]-[club]-[année].pdf`.
- **Sans année** (modèle Parcours de remobilisation, qui n'a pas d'année) : `Convention-signee-[dispositif]-[club].pdf`. On n'invente pas d'année, comme au §3.
- **Règles de nettoyage : exactement celles du nom du PDF généré (D-S7-3), décrites au §3, « Nom du fichier PDF »** : accents retirés ; `œ` devient `oe` et `æ` devient `ae` ; tout caractère qui n'est ni une lettre ni un chiffre est remplacé par un seul tiret (une suite de tels caractères donne un seul tiret) ; tirets de début et de fin retirés ; 40 caractères au plus pour le nom du club ; club vide après nettoyage : le mot `club` ; [dispositif] en forme courte (Stade-emploi, Match-metiers, Remobilisation) ; jamais de nom de personne (signataire, représentant), ni de nom d'agence, ni d'identifiant d'action. Seule différence avec le PDF généré : le mot `signee` après `Convention-`. Les règles ne sont pas copiées ici : si elles changent au §3, elles changent aussi pour le fichier signé.
- **Source des valeurs** : dispositif et club de l'action ; année : mis à jour le 2026-10-29 (E1) : la campagne de l'action (`Actions.Campagne`), lue au moment du dépôt ; plus l'année enregistrée avec la convention. Le nom du fichier signé peut donc changer si la campagne de l'action a changé depuis la génération : acceptable, à confirmer (D-E1-8). [À CONFIRMER, par prudence : si l'année enregistrée était absente pour un modèle qui en a une, ce cas ne devrait pas arriver, la génération l'exigeant ; le comportement dans ce cas n'est pas décidé.]
- **Un seul code pour les deux noms** : recommandation à dev-backend de réutiliser la fonction qui fabrique le nom du PDF généré (en lui ajoutant le mot `signee`), pour que les deux noms ne divergent jamais.
- **Quand** : après les contrôles du fichier (§4, qui portent sur le nom et le contenu d'origine), au moment de l'envoi. Un fichier refusé n'est jamais renommé ni envoyé.
- **Aucun message, aucun champ de saisie, aucun changement visible** pour l'agent : le renommage est silencieux. « Voir la convention signée » ouvre le fichier comme avant.
- **Remplacement** : le nouveau fichier reçoit le nom calculé de la même façon ; il peut donc porter le même nom que l'ancien, sans conséquence (deux pièces jointes distinctes dans Grist, voir h).
- Exemples (clubs fictifs, comme au §3) : « Club Sportif d'Exemple », Du stade vers l'emploi, 2026 → `Convention-signee-Stade-emploi-Club-Sportif-d-Exemple-2026.pdf` ; « Étoile & Cœur FC », Match des métiers, 2026 → `Convention-signee-Match-metiers-Etoile-Coeur-FC-2026.pdf` ; « Association Exemple », Parcours de remobilisation → `Convention-signee-Remobilisation-Association-Exemple.pdf`.

## 5. Textes affichés (tous, pour dev-interface)

- Bloc : « Convention » ; « Aucune convention générée. » ; « Convention générée le [date]. » ; « Convention signée, déposée le [date]. » ; « Pas encore de modèle de convention pour ce dispositif. » ; état Droits insuffisants : « Vous n'avez pas accès aux conventions avec vos droits actuels. Si vous en avez besoin, contactez l'équipe du tableau de bord. » ; aide à l'état Générée : « Imprimez la convention, complétez à la main les zones en pointillés et faites-la signer, puis déposez le fichier signé. »
- Génération bloquée (bloc, un seul à la fois, dans cet ordre ; texte caché devant : « Convention impossible à générer : ») : « Renseignez l'agence de l'action dans sa fiche. » ; « Renseignez le club de l'action. » ; « Renseignez le dispositif de l'action dans sa fiche. » (jamais affiché) ; ~~« Renseignez l'adresse du club dans sa fiche. »~~ supprimé le 2026-10-29 (E1)
- Club sans contact (fenêtre B, bloc Club) : mis à jour le 2026-10-29 (E1) : « Ce club n'a aucun contact dans sa fiche. Saisissez le signataire ci-dessous, ou laissez vide pour le compléter à la main. » (remplace « Ce club n'a aucun contact. Ajoutez-en un dans la fiche du club, puis revenez générer la convention. »)
- Boutons du bloc : « Générer la convention », « Voir la convention », « Re-générer », « Déposer la convention signée », « Voir la convention signée », « Remplacer le fichier signé ». Textes cachés pour lecteurs d'écran : « (s'ouvre dans un nouvel onglet) » après chaque « Voir » (ces deux commandes sont des boutons). Pendant l'ouverture du PDF : « Ouverture en cours… ».
- Fenêtre B (mis à jour le 2026-10-29 (E1)) : « Convention » ; sous-titre « [Dispositif] · Campagne [Campagne] » (sans « Campagne » si vide) ; introduction « Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature. » (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée) : sans exception ni « sauf », aucune référence à un cas où quelque chose serait obligatoire ; remplace « Aucun champ n'est obligatoire, sauf pour ajouter un nouveau contact… ») ; blocs « Club » et « Agence » (remplacent « Informations relatives à la convention », « Signataire club », « Signataire agence ») ; libellés : « Club » (encart), « Signataire », « Fonction du signataire », « Agence », « Représentant », « Fonction du représentant » ; encart (mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne)) : « SIRET non renseigné », « adresse non renseignée » (ces textes sont insérés dans la ligne, après une virgule) ; « Pour corriger ces informations, modifiez la fiche du club. » ; « Veuillez sélectionner » ; « Fonction non renseignée » ; valeur de départ de la fonction du représentant : « Directeur d'agence ». Bouton et formulaire d'ajout de contact (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) : bouton « Ajouter un contact » ; libellés dans l'ordre « Nom », « Prénom », « E-mail » (sans astérisque, D-E1-17), puis le champ « Fonction du signataire » ; aucun texte d'aide dans le formulaire (D-E1-16 : « * Nécessaires pour ajouter ce contact. » et la consigne « coordonnées professionnelles » sont retirés) ; phrase d'information sous ces quatre champs, donc sous « Fonction du signataire » (D-E1-12) : « Ce contact sera ajouté à la fiche du club. » ; **message sous E-mail quand il est mal formé : « Saisissez une adresse e-mail valide, par exemple nom@exemple.fr. »** ; **message d'erreur sous le champ E-mail (Nom rempli, E-mail vide) : « Saisissez l'e-mail du nouveau signataire. »** (préfixe caché « Erreur : ») ; option de la liste quand une saisie libre est active : « [Prénom Nom] (nouveau contact) ». Retiré le 2026-10-29 (E1, 2e série) : la case « Ajouter ce contact à la fiche du club » et ses deux aides. Supprimés : « Modèle utilisé », « Année », « Signataire club », « Signataire agence », « Informations relatives à la convention », toute phrase avec un astérisque.
- Boutons de la fenêtre B : « Fermer », « Générer la convention » (aussi à la re-génération). **Mis à jour le 2026-10-29 (E1) : « Enregistrer les informations » est supprimé** (il était dans le pied depuis le 2026-10-22).
- Supprimés avec le formulaire « Ajouter un contact » : « Nouveau contact », « Nom », « Prénom », « Fonction » (du formulaire), « Annuler », « Ajouter ce contact », « Ajouter un contact » et son texte caché.
- ~~Erreur de champ (sous le champ, après `sr-only` « Erreur : ») : « Saisissez [le libellé en minuscules]. » ; « Choisissez le signataire du club. »~~ **Supprimé le 2026-10-29 (E1)** : plus aucun champ obligatoire, donc plus aucune erreur de champ dans la fenêtre.
- ~~Mis à jour le 2026-10-23, à l'enregistrement (seul contrôle) : « Saisissez une année à quatre chiffres. »~~ **Supprimé le 2026-10-29 (E1)** : plus de champ « Année ».
- ~~Mis à jour le 2026-10-23, au clic sur « Générer la convention » (S7) : les six messages de blocage (année, signataire, fonction du signataire, représentant, fonction du représentant)~~ **Supprimés le 2026-10-29 (E1)** : un champ vide donne des pointillés, ne bloque jamais la génération.
- Alerte d'erreur en haut du corps de la fenêtre B (`alert alert-error`, `role="alert"`) : ~~« Certains champs sont à corriger. »~~ (supprimée le 2026-10-29 (E1)) ; échec d'enregistrement, **à la fermeture comme à la génération** (mis à jour le 2026-10-29 (E1)) : « Les informations n'ont pas pu être enregistrées. Réessayez ou contactez l'équipe du tableau de bord. » ; échec de génération : « La convention n'a pas pu être générée. Vos informations sont conservées. » ; **échec de création du contact (E1)** : aucun texte propre, c'est le message d'échec d'enregistrement ci-dessus ; second « Fermer » après un échec : ferme sans enregistrer, sans autre texte.
- Dépôt du fichier signé (bloc, sans fenêtre) : « Envoi en cours… » ; « Convention signée enregistrée. » ; « Le fichier n'a pas pu être enregistré. Réessayez ou contactez l'équipe du tableau de bord. »
- Mis à jour le 2026-10-26 (S9), dépôt du fichier signé : région d'attente `role="status"` du bloc : « Envoi de la convention signée en cours. Cela peut prendre quelques secondes. » (§4.1 d) ; proposé, à décider (S9-4) : « Le fichier n'a pas été enregistré : vos droits ne le permettent pas pour cette action. Contactez l'équipe du tableau de bord. »
- Succès (`alert alert-success`, `role="status"`) : ~~« Informations enregistrées. »~~ (jamais affiché depuis le 2026-10-29 (E1) : l'enregistrement à la fermeture est silencieux) ; « Convention générée. » ; « Convention signée enregistrée. »
- Chargement : sur le bouton, pendant la génération, « Génération en cours… » (le bouton reste en place, `aria-disabled="true"`) ; pendant l'envoi du fichier, « Envoi en cours… ».
- Mis à jour le 2026-10-23 (S7), génération : région d'attente de la fenêtre : « Génération de la convention en cours. Cela peut prendre quelques secondes. » ; succès dans le bloc : « Convention générée. » ; échecs (alerte en haut de la fenêtre, textes exacts au §3, « Échecs ») : bibliothèque non chargée, une case inconnue, plusieurs cases inconnues, modèle inactif ou introuvable, envoi refusé, envoi impossible, fichier non rattaché, échec inattendu (« La convention n'a pas pu être générée. Vos informations sont conservées. »).
- Mis à jour le 2026-10-23 (S7), nom du fichier PDF : `Convention-[dispositif]-[club]-[année].pdf`, sans année : `Convention-[dispositif]-[club].pdf` (§3).
- Mis à jour le 2026-10-25 (D-MEP-3), génération sans logo, message d'information affiché avec la réussite (pas une erreur, §11.2) : « La convention a été générée sans le logo France Travail. Vérifiez le modèle avant de l'imprimer. » ; si `Logo_partenaire` était rempli mais illisible : « La convention a été générée sans le logo du partenaire. Vérifiez le modèle avant de l'imprimer. »
- Fichier refusé (dépôt ou remplacement) : « Le fichier n'a pas été enregistré : ce n'est pas un PDF. » ; « Le fichier n'a pas été enregistré : le fichier est vide. » ; « Le fichier n'a pas été enregistré : 10 Mo au maximum. »
- Ouverture d'un PDF (boutons « Voir ») : « Ouverture en cours… » ; échec : « Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord. »

## 6. États

| État | Ce que voit l'agent |
|---|---|
| Ouverture de la fenêtre B (mis à jour le 2026-10-29 (E1)) | Focus sur la liste « Signataire » (premier champ modifiable, pour les trois modèles : plus de champ « Année »). Le formulaire « Ajouter un contact » est fermé (bouton avec `aria-expanded="false"`). Aucun message ni astérisque. |
| ~~Champs invalides~~ (supprimé le 2026-10-29 (E1)) | Il n'y a plus d'état « champ invalide » dans la fenêtre : rien n'est obligatoire. |
| Fermeture de la fenêtre B (mis à jour le 2026-10-29 (E1)) | « Fermer », croix éventuelle ou Échap : enregistrement silencieux de la saisie, puis fermeture, sans confirmation ni message ; le focus revient sur le bouton d'ouverture. Si l'enregistrement échoue : fenêtre ouverte, alerte, un second Fermer quitte sans enregistrer (D-E1-5). |
| Génération (mis à jour le 2026-10-29 (E1)) | Bouton en attente ; à la génération réussie, la fenêtre se ferme et le bloc passe à « Générée ». Plus d'enregistrement par bouton. |
| Génération en cours (mis à jour le 2026-10-23 (S7), et le 2026-10-29 (E1)) | Bouton « Génération en cours… », les deux boutons du pied grisés, champs non modifiables, Échap sans effet, phrase d'attente annoncée. |
| Génération réussie (mis à jour le 2026-10-23 (S7)) | Fenêtre fermée, bloc « Générée » avec la date, alerte « Convention générée. », focus sur « Voir la convention ». |
| Génération échouée (mis à jour le 2026-10-23 (S7)) | Fenêtre ouverte, saisie gardée et enregistrée, alerte d'erreur en haut avec la cause, bouton « Générer la convention » à nouveau actif, focus sur lui, état du bloc inchangé. |
| Bloc, tables de la convention refusées (tout profil, ANS compris) | État « Droits insuffisants » : phrase seule, aucun bouton. |
| Bloc, génération bloquée (agence ou club manquant ; mis à jour le 2026-10-29 (E1)) | Phrase d'état, message du premier élément manquant, bouton « Générer la convention » (ou « Re-générer ») grisé (`aria-disabled`, relié au message). La fenêtre ne s'ouvre pas. |
| Bloc, état Générée | Phrase d'état, phrase d'aide (imprimer, signer, déposer), puis les boutons. |
| Fenêtre B, club sans contact (mis à jour le 2026-10-29 (E1)) | Liste « Signataire » réduite à l'invite, message d'aide sous la liste, formulaire d'ajout fermé, « Générer la convention » **actif**. |
| Fenêtre B, Nom rempli et E-mail vide, après Fermer ou Générer (nouveau, mis à jour le 2026-10-29 (E1, précision Email)) | Formulaire d'ajout ouvert (rouvert s'il était fermé), focus sur le champ E-mail, `is-invalid` + message « Saisissez l'e-mail du nouveau signataire. » sous E-mail, fenêtre ouverte, saisie gardée, rien d'écrit, aucun PDF fabriqué. Le message disparaît dès que l'agent tape dans E-mail, vide le Nom ou choisit un contact dans la liste. |
| Fenêtre B, saisie libre active (nouveau, E1) | Option « [Prénom Nom] (nouveau contact) » choisie dans la liste, fonction modifiable, le formulaire peut être refermé (autre clic sur « Ajouter un contact ») sans rien perdre ; le contact est créé à la fermeture ou à la génération. Choisir un contact de la liste vide la saisie libre. |
| Re-génération | Fenêtre B préremplie ; à la génération réussie, elle se ferme et l'ancien PDF est remplacé. |
| Fichier PDF choisi | Envoi aussitôt, « Envoi en cours… », puis confirmation (A6). |
| Fichier refusé (pas un PDF, vide, plus de 10 Mo) | Alerte dans le bloc avec le motif, rien enregistré. |
| Clic sur « Voir la convention » ou « Voir la convention signée » | Bouton en attente (« Ouverture en cours… »), puis le PDF s'ouvre dans un nouvel onglet ; en cas d'échec, alerte dans le bloc. |
| Droits insuffisants en écriture | Message d'erreur à l'enregistrement, à la génération, au dépôt ; les boutons « Voir » restent utilisables. |

## 7. Accessibilité (RGAA), mode sombre, données personnelles

- Titres : h1 de la fiche (existant) → h2 de la fenêtre. Les trois blocs sont des `legend` de `fieldset`. **Mis à jour le 2026-10-29 (E1)** : deux blocs (« Club », « Agence »), pas trois.
- Chaque champ a un `label` lié (`for` / `id`). **Mis à jour le 2026-10-29 (E1) : plus aucun champ obligatoire** : ni astérisque, ni `span.required`, ni attribut `required` dans la fenêtre (pas même sur Nom et E-mail du formulaire d'ajout de contact, D-E1-17) ; la phrase d'introduction dit « Un champ laissé vide sera complété à la main… » (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée)). Le formulaire garde `novalidate`. Avant l'E1 (2026-10-23) : astérisque et `required` sur les champs obligatoires pour générer.
- Champ en lecture seule : `readonly` (il reste atteignable au clavier et lu par les lecteurs d'écran).
- Liste de choix : `label` lié, option d'invite désactivée « Veuillez sélectionner » ; erreur : `is-invalid`, `aria-invalid="true"`, `aria-describedby`. **Mis à jour le 2026-10-29 (E1)** : plus d'état d'erreur pour cette liste (rien n'est obligatoire) ; l'option d'invite « Veuillez sélectionner » reste sélectionnable pour revenir à « aucun signataire ». L'option « [Prénom Nom] (nouveau contact) » (affichée dès que le Nom est rempli) est une option normale du même `select`.
- Erreurs : jamais portées par la couleur seule (texte « Erreur : » en `sr-only`). Mis à jour le 2026-10-29 (E1) : il n'y a plus d'erreur de champ dans la fenêtre ; la règle reste valable pour les alertes du bloc et de l'enregistrement.
- Focus : à l'ouverture d'une fenêtre, sur le premier champ ; Tab et Maj+Tab tournent dans la fenêtre ouverte ; **Échap ferme** la fenêtre (comme `keepFocusInAddAction`) ; à la fermeture, le focus revient sur le bouton qui l'a ouverte. Mis à jour le 2026-10-23 : même avec des informations non enregistrées, Échap ferme directement, sans confirmation (Q-H tranchée ; la version du 2026-10-22 prévoyait une confirmation [à valider avec le chef]). **Mis à jour le 2026-10-29 (E1)** : à l'ouverture de la fenêtre Convention, le focus va sur la liste « Signataire ». Échap, « Fermer » et la croix éventuelle enregistrent en silence puis ferment ; le focus revient sur le bouton d'ouverture. Si l'enregistrement échoue, la fenêtre reste ouverte et le focus reste où il est (l'alerte `role="alert"` est annoncée sans prendre le focus).
- Ordre de lecture = ordre visuel : sous-titre, introduction, bloc Club (encart, liste « Signataire », bouton « Ajouter un contact » et son formulaire, fonction), bloc Agence, boutons du pied (mis à jour le 2026-10-29 (E1)). Les deux colonnes se lisent de gauche à droite.
- Boutons qui ouvrent un nouvel onglet (« Voir ») : le dire dans le texte (`sr-only`).
- Bouton grisé : `aria-disabled` + message visible relié par `aria-describedby`. Ne pas utiliser l'attribut `disabled`. S'applique à « Générer la convention » et « Re-générer » quand la génération est bloquée (§2) et à « Générer la convention » de la fenêtre quand le club n'a aucun contact (§3). Le message reste visible (pas d'infobulle seule) et est du texte, pas de la couleur. **Mis à jour le 2026-10-29 (E1)** : « Générer la convention » de la fenêtre n'est plus jamais grisé par l'absence de contact ; il reste grisé seulement pendant la génération (texte « Génération en cours… »).
- Bouton « Ajouter un contact » et son formulaire (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) ; remplace la ligne dépliante `<details>`) : vrai `<button type="button">` du design system, atteignable au clavier (Tab, puis Entrée ou Espace), avec `aria-expanded` (« développé » ou « réduit » annoncé par le lecteur d'écran) et `aria-controls` vers le formulaire ; même libellé ouvert ou fermé, l'état n'est jamais porté par la couleur seule. Formulaire fermé = attribut `hidden` : ses champs sont hors de l'ordre de Tab, leurs valeurs sont gardées. À l'ouverture, le focus va sur Nom ; à la fermeture, il reste sur le bouton ; l'option « (nouveau contact) » de la liste dit qui est le signataire même formulaire fermé. Nom, Prénom et E-mail ont chacun un `label` lié (sans astérisque ni `required`, D-E1-17 ; le champ Fonction a le sien, voir plus haut), et la phrase « Ce contact sera ajouté à la fiche du club. » leur est reliée par `aria-describedby`. Aucun autre texte d'aide dans le formulaire (D-E1-16). Erreur de l'E-mail (vide ou mal formé, D-E1-14) : `is-invalid`, `aria-invalid="true"`, message précédé d'un `sr-only` « Erreur : », `aria-describedby` vers le message seulement, focus placé sur le champ après réouverture du formulaire s'il était fermé ; l'erreur ne repose pas sur la couleur (le texte du message la porte). Encart Club (D-E1-19) : toujours un `textarea` en lecture seule avec son `label`, sans poignée de redimensionnement ; la hauteur suit le contenu, donc aucun texte caché par une barre de défilement interne.
- Bloc « Droits insuffisants » : le message est du texte ordinaire dans le flux (pas de région vide ni de bloc caché), identique pour tous les profils.
- Mode clair / sombre : n'utiliser que des variables `--ft-…` ou des classes du design system, aucune couleur écrite en dur. **Constat** : style.css déclare `color-scheme: light` ; le tableau de bord n'est donc pas conçu pour le mode sombre aujourd'hui. Je n'ai pas pu vérifier le rendu en mode sombre : à tester par Hanta. La maquette n'ajoute aucune couleur.
- Zoom 200 % : la fenêtre défile (`modal-dialog-scrollable`), rien n'est coupé ; sous 1100 px d'écran (mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne) ; ce qui arrive à 200 % de zoom sur un écran courant) elle passe en une colonne.
- Données personnelles : seules données de personnes : **nom, prénom et fonction** du représentant de l'agence, et **nom, prénom, e-mail et fonction** du signataire du club (mis à jour le 2026-10-29 (E1, précision Email) : l'e-mail du signataire est ajouté à la liste), strictement nécessaires pour désigner qui signe ou, pour l'e-mail, pour créer le contact dans Contacts. L'e-mail est écrit dans Contacts (colonne Email) avec le contact créé ; il n'est pas reproduit dans le PDF (aucune case du modèle ne l'utilise : à confirmer par dev-backend). Pas de téléphone ni d'adresse personnelle demandés dans ce formulaire. Le champ Commentaire de la fiche reste interdit pour noter des données de personnes. Les PDF contiennent ces noms et les signatures : le PDF généré reste dans Grist après la signature mais n'est plus montré ; la durée de conservation reste à décider (§10). Données de la maquette : fictives. **Mis à jour le 2026-10-29 (E1)** : le widget **écrit désormais dans Contacts** (nom, prénom, e-mail et fonction du signataire saisi), **toujours** quand un Nom est saisi dans le formulaire « Ajouter un contact » et que l'E-mail l'est aussi (plus de case à cocher) ; il reste interdit d'y écrire autrement. Aucune donnée de personne n'est gardée ailleurs que dans Contacts et dans le PDF : il n'y a pas de colonne texte pour le signataire. CLAUDE.md (« Le widget n'écrit jamais dans Contacts ») et le README sont **à mettre à jour** par la documentaliste, après décision de Hanta. Un e-mail est saisi ici (obligatoire pour créer le contact, D-E1-7, vérifiée) ; aucun téléphone. Le vrai formulaire du widget clubs demande « des coordonnées professionnelles (adresse e-mail et téléphone de la structure), pas des coordonnées personnelles » : **mis à jour le 2026-10-29 (E1, alignement sur la maquette et D-E1-12/14) : cette consigne n'est plus reprise dans la fenêtre (D-E1-16, mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) ; le téléphone n'est pas demandé non plus.**

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
      <div class="modal-header">
        <h2 class="modal-title" id="conventionTitle">Convention</h2>
        <!-- mis à jour le 2026-10-29 (E1, Q-M3 tranchée) : sous-titre dans l'en-tête, sous le titre ;
             <p> ordinaire, sans classe nouvelle ; relié au dialogue par aria-describedby="conventionSubtitle" -->
        <p id="conventionSubtitle">Du stade vers l'emploi · Campagne 2026</p>
      </div>
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

### Zone de texte en lecture seule (encart du club ; avant l'E1 : siège du club et adresse de l'agence)
Aucune page de composant « zone de texte » n'a été lue : **non vérifié**. Structure proposée, identique au champ en lecture seule ci-dessus mais avec `textarea` (la classe `form-control` est celle de la feuille ; à vérifier que le tableau de bord emploie déjà un `textarea` pour le Commentaire, et à contrôler sur la page du composant avant de coder) :

```html
<label class="form-label" for="clubSiege">Siège</label>
<textarea class="form-control" id="clubSiege" name="clubSiege" readonly rows="2">2 avenue du Stade, 00000 Ville-Exemple</textarea>
```
**Mis à jour le 2026-10-29 (E1)** : un seul `textarea` en lecture seule sert d'encart du club (libellé « Club », `rows="3"` au départ, une seule ligne logique : nom, SIRET, adresse, séparés par des virgules, sans « SIRET : » devant ; mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne)). La fenêtre n'affiche plus l'adresse de l'agence : pas de second `textarea`. **Mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) (D-E1-19)** : ce `textarea` n'a plus de poignée de redimensionnement et sa hauteur suit son contenu (voir §3, « Hauteur de l'encart »).

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

### Case à cocher : plus utilisée dans la fenêtre Convention (2026-10-29, E1, 2e série)
La case « Ajouter ce contact à la fiche du club » est retirée par décision de Hanta : la fenêtre n'emploie plus de case à cocher. La structure du composant (page https://designsystem.francetravail.io/components/detail/checkbox--default.html, lue le 2026-10-29) n'est donc plus recopiée ici.

### Zone dépliante : plus utilisée, remplacée par un bouton (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact))
La ligne dépliante `<details>` / `<summary>` du signataire est **remplacée par le bouton « Ajouter un contact »** (D-E1-15) : le composant utilisé est un bouton secondaire du design system (structure au §3, bloc Club), il n'y a donc plus de question de composant « accordéon » ou « dépliant » pour cette fenêtre, ni de `<details>`, ni de `<summary>`, ni de D-E1-2 à valider. Pour mémoire : mon essai sur la page https://designsystem.francetravail.io/components/detail/accordion--default.html avait donné une erreur 404 ; il n'a plus d'objet.

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
- Classes du widget à créer par dev-interface, sans nom du design system : `convention-grid` (trois colonnes à partir de 1200 px, une colonne en dessous ; remplacé, voir la mise à jour ci-dessous), `convention-part` (fieldset sans bordure), `convention-fields` (grille à deux colonnes dans une colonne de la fenêtre), `convention-actions` (rangée de boutons), `convention-file` (champ fichier caché). Leurs règles sont dans le `<style>` de la maquette ; elles n'utilisent que des variables du design system et du widget. Test à prévoir : test/styles.test.js vérifie qu'elles ne reprennent aucun nom du design system. **Mis à jour le 2026-10-29 (E1)** : `convention-grid` passe de trois à deux colonnes, avec un seuil de **1100 px** (mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne)) ; aucune classe nouvelle n'est proposée pour le bouton « Ajouter un contact » (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)). **À prévoir, à signaler à Hanta avant de créer** : une classe du widget qui supprime le redimensionnement de l'encart Club (D-E1-19) et, seulement si les classes existantes de la fenêtre ne suffisent pas, une règle d'espacement pour les champs du formulaire d'ajout (D-E1-18) ; dans les deux cas, uniquement des variables du design system.

## 9. Risques techniques et points à vérifier avant de coder

- **Détection des droits refusés** : le widget ne lit pas le profil ; il doit repérer proprement que Grist refuse la lecture des tables de la convention (comme il le fait déjà pour les autres tables : une table refusée devient une liste vide, CLAUDE.md) sans confondre « refusé » et « aucune convention ». À vérifier par dev-interface avec dev-backend.
- **Bouton grisé** : le script `disabled-a11y.js` du design system doit bloquer le clic ; à vérifier (voir §8). Dev-interface doit aussi garder le bouton atteignable au clavier (donc `aria-disabled`, jamais `disabled`).
- Hauteur de la fenêtre B sans défilement : estimation, non mesurée. Un écran de 768 px de haut avec la barre du navigateur laisse environ 650 px ; ce sera plus juste avec un siège sur plusieurs lignes ou le message « Ce club n'a aucun contact… ». À mesurer sur la maquette avant de coder.
- Où stocker le PDF généré, le PDF signé et les informations (nouvelle table ou colonnes dans Grist) : le modèle de données est partagé par plusieurs widgets, rien ne doit être renommé et toute nouvelle colonne est à faire valider. Non décidé ici.
- Générer un PDF demande probablement une bibliothèque ou un service : « aucune dépendance sans l'accord de Hanta » (CLAUDE.md). À proposer avec avantages, risques et effort avant tout code.
- Colonnes Grist citées par le chef (Contacts.Fonction, colonnes de Agences) : non vérifiées (voir §3).
- **Mis à jour le 2026-10-29 (E1, 2e série), colonnes Grist** : plus aucune colonne à créer pour le signataire (`Signataire_club_texte` et la colonne de fonction proposée sont supprimées de la note). `Conventions.Signataire_club` (référence) existe déjà. Les colonnes `Conventions.Annee` et `Modele` ne sont plus écrites par la fenêtre ; leur sort n'est pas décidé ici (ne jamais les renommer, CLAUDE.md). Noms **non vérifiés dans Grist**.
- **E1, écriture dans Contacts** : (a) la règle d'accès de Contacts refuse une ligne sans club : tout envoyer en une seule opération, club compris (CLAUDE.md) ; (b) mis à jour le 2026-10-29 (E1, précision Email) : Nom et Email sont obligatoires dans Contacts (vérifié par Hanta, D-E1-7) ; la fenêtre les exige donc avant d'écrire (Nom rempli et E-mail vide : aucune écriture, message sous le champ E-mail) et envoie dans la même opération Club, Nom, Prénom, Email, Fonction ; **le contrôle de forme de l'e-mail (le vrai formulaire refuse une adresse mal formée) n'est pas décrit par le backlog : D-E1-14** ; (c) FT National, Régional, Départemental ont des droits sur Contacts dans leur périmètre ; un refus produit le message d'échec d'enregistrement habituel du §5 (rien d'autre n'est enregistré), jamais un échec silencieux ; (c bis) **ordre** : la création du contact est attendue, son identifiant reçu, avant l'écriture de `Conventions` (§3) ; (d) recette avec un vrai compte non propriétaire (règle de CLAUDE.md et du backlog).
- **E1, enregistrement à la fermeture** : tous les chemins de fermeture (bouton, croix éventuelle, Échap, et clic sur le fond sombre s'il ferme la fenêtre dans le code) doivent passer par la même fonction d'enregistrement ; sinon un chemin perdrait la saisie sans le dire. Dev-interface vérifie dans le code ; je n'ai pas relu `script.js`.
- **E1, anti-doublon du contact** : la bascule vers « contact de la liste » après la création doit se faire dès que l'identifiant est connu, avant l'écriture dans `Conventions` (§3). À tester : saisir un nom, fermer, rouvrir, fermer, générer : une seule ligne dans Contacts ; simuler l'échec de l'écriture de `Conventions` après la création : l'essai suivant ne recrée pas le contact. Les doublons avec un contact existant saisi à la main sont acceptés (décision de Hanta).
- **E1, campagne** : le format réel de `Campagnes.Campagne` (année seule ? « 2026-2027 » ?) n'est pas vérifié ; il décide de la case [Année] et du nom du fichier (§3).
- **Zones en pointillés du PDF** : le PDF généré doit laisser de la place pour écrire à la main (nombre d'opérations ou de parcours, date de fin, contact protection des données, « Fait à », dates de signature). À vérifier sur le PDF produit, qui n'est pas dans cette note.
- **Ouverture du PDF par bouton** : l'onglet s'ouvre après une récupération asynchrone, ce que certains navigateurs prennent pour une fenêtre non sollicitée et bloquent. L'ouverture d'un onglet depuis le cadre de Grist est confirmée (essai dans Grist DEV), mais pas avec une adresse `blob:` obtenue après chargement : à tester dans Grist DEV, sur plusieurs navigateurs, avant de livrer. Non vérifié ici.
- **Réglé pour S8 (re-génération)** : Grist supprime-t-il un ancien PDF qu'aucune cellule n'utilise ? Non : vérifié par Hanta le 2026-10-26 dans DEV7 (34 → 35 pièces jointes après une re-génération, d'après docs/backlog.md). Décision D-S8-7 réglée ; l'ancien PDF reste orphelin (D-S8-5).
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
- **D-S7-1 : une seule opération pour le fichier et la date.** Décidé : une seule requête `PATCH` REST (jeton d'écriture, comme pour le logo du widget clubs) écrit `PDF_genere` et `Date_generation`, après l'envoi du fichier. Pourquoi pas `applyUserActions` : Grist le refuse à un non-propriétaire pour une pièce jointe (fiche C39). Le cas de repli prévu pour deux écritures (« Générée » sans date) est retiré de la note (§3, §5).
- **D-S7-2 : Fermer et Échap pendant la génération.** Décidé : ignorés pendant la génération. Écart à Q-H, limité à la durée de la génération.
- **D-S7-3 : nom du fichier (Q-E).** Décidé : `Convention-[dispositif]-[club]-[année].pdf`, et `Convention-[dispositif]-[club].pdf` sans année. Le dispositif suit les mêmes règles de nettoyage que le club. La forme courte du dispositif (Stade-emploi, Match-metiers, Remobilisation) est une proposition à valider, ses valeurs dans Modeles_convention n'étant pas vérifiées (§3). Jamais de nom de personne.
- **D-S7-4 : informations enregistrées avant la fabrication du PDF.** Décidé : oui (étape 2), sans message « Informations enregistrées. ». Une génération échouée laisse la ligne de `Conventions` créée ou mise à jour (état du bloc inchangé).
- **D-S7-5 : indicateur d'attente.** Décidé : texte seulement (« Génération en cours… » sur le bouton + phrase annoncée), pas de `ft-spinner` pour l'instant.
- **D-S7-6 : focus après une réussite.** Décidé : sur « Voir la convention ».
- **D-S7-7 : champs non modifiables pendant la génération.** Décidé : oui (`disabled` sur les `fieldset`).

Mis à jour le 2026-10-26 (S8) : les décisions D-S8-1 à D-S8-7 (dont Q-I et Q-J) sont prises par Hanta le 2026-10-26 ; elles sont au §12.10. D-S8-7 est réglée : Hanta a vérifié dans DEV7 le 2026-10-26 que Grist ne nettoie pas les pièces jointes orphelines.

### À décider par Hanta (2026-10-29, E1)

**Décisions antérieures remplacées par l'E1** (décidées par le chef le 2026-10-29, backlog) : « Enregistrer les informations = brouillon » et son pied à trois boutons (2026-10-23) ; D-3 (les six messages de blocage de « Générer ») ; D-4 (année préremplie avec l'année en cours) ; D-6 (disparition du message d'erreur de l'année) ; la fonction du signataire toujours en lecture seule (2026-10-23, elle est désormais modifiable pour une saisie libre) ; « le signataire est choisi uniquement parmi les contacts » et « Générer grisé pour un club sans contact » (tâche 4.1) ; **2e série du 2026-10-29 (Hanta)** : la case « Ajouter ce contact à la fiche du club », la colonne `Conventions.Signataire_club_texte` et D-E1-4 sont retirées ; **précision du 2026-10-29 (E1, précision Email)** : champs Nom, Prénom, E-mail, Fonction ; condition de création « Nom rempli » (remplace « Prénom ou Nom ») ; Q-H est inchangée (Fermer sans confirmation), D-S7-2 inchangée.

| N° | Question | Ma recommandation |
|---|---|---|
| D-E1-1 | Encart du club : « nom, SIRET, adresse, sur une ligne » : l'adresse sur une ligne (ma lecture) ou tout l'encart sur une ligne ? Et quel composant : un `textarea` en lecture seule à trois lignes (composant du §8, non lu) ou des `<p>` ordinaires ? | **Tranché (mis à jour le 2026-10-29 (E1, alignement note/code : seuil 1100px, encart Club sur une ligne)) : tout l'encart sur une seule ligne logique**, séparé par des virgules, SIRET nu, dans un `textarea` en lecture seule : un seul champ lisible au clavier et par les lecteurs d'écran, sans classe nouvelle. |
| D-E1-2 | Ligne dépliante : accepter l'élément natif `<details>` / `<summary>` (faute de composant du design system trouvé) ? Si le `summary` demande une classe pour son aspect, la créer ? | Oui pour `<details>` ; pour une classe, nouvelle décision de Hanta au moment où dev-interface en a besoin (je ne la prévois pas). Mon essai sur la page accordéon a échoué (404) : à regarder dans la bibliothèque du site avant de coder. **Remplacée par D-E1-15 (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) : plus de `<details>`, donc plus de question.** |
| D-E1-3 | Quand la saisie libre et la liste se contredisent, qui l'emporte ? Plier la ligne perd-il la saisie ? | **Mis à jour le 2026-10-29 (E1, précision Email), tranché par Hanta dans le backlog :** la saisie libre est active dès que **Nom** est rempli (plus « Prénom ou Nom ») ; l'option « (nouveau contact) » apparaît dans la liste ; choisir un contact de la liste vide la saisie libre ; plier la ligne ne perd rien, le contact est créé à la fermeture ou à la génération. |
| ~~D-E1-4~~ | ~~Où écrire la fonction du signataire saisi quand la case n'est pas cochée ?~~ | **Sans objet (2026-10-29, 2e série)** : plus de case, plus de colonne texte. La fonction saisie va dans Contacts avec le contact créé. |
| D-E1-5 | Si l'enregistrement à la fermeture échoue (droits refusés sur Contacts, réseau) : que voit l'agent ? « Silencieusement » vaut-il aussi pour les échecs ? | Silencieux seulement en cas de réussite. En cas d'échec (y compris la création du contact, qui n'écrit alors rien d'autre) : la fenêtre reste ouverte, message d'échec habituel du §5 (pas de texte propre au contact), et un second « Fermer » quitte sans enregistrer. Sinon la saisie disparaîtrait sans que l'agent le sache. |
| ~~D-E1-6~~ | ~~Case cochée mais Nom vide : que faire ?~~ | **Sans objet (2026-10-29, 2e série)** : plus de case. Règle remplaçante (mise à jour le 2026-10-29 (E1, précision Email)) : Nom rempli, avec E-mail rempli, crée le contact ; Nom vide, rien n'est créé ; Nom rempli et E-mail vide, message sous le champ E-mail. |
| ~~D-E1-7~~ | ~~Contacts accepte-t-elle une ligne sans e-mail ?~~ | **Vérifiée par Hanta (mis à jour le 2026-10-29 (E1, précision Email))** : non, Nom et Email sont obligatoires dans Contacts ; Prénom, Téléphone et Fonction ne le sont pas. La ligne dépliante a donc le champ E-mail (obligatoire quand un Nom est saisi). CLAUDE.md et le README restent à mettre à jour par la documentaliste. |
| D-E1-8 | Année : `Actions.Campagne` vient-elle toujours sous forme d'une année ? Si elle est vide, l'année et son tiret sont omis du nom du fichier et la case [Année] donne des pointillés. | Oui pour l'omission. Format à vérifier dans Grist avant le codage ; si ce n'est pas une année, décider si la case [Année] reprend la campagne telle quelle. Le nom du fichier signé suit la campagne actuelle de l'action (§4.1 k). |
| D-E1-9 | La croix : la fenêtre a-t-elle une croix de fermeture ? Le §8 n'en montre pas. | Ne pas en ajouter ; « Fermer » et Échap suffisent. Si le code en a une, elle fait comme « Fermer ». |
| D-E1-10 | Libellé du sous-titre : « [Dispositif] · Campagne [Campagne] » (ex. « Du stade vers l'emploi · Campagne 2026 ») | Oui. Texte du `<p>` ordinaire placé dans l'en-tête sous le titre (mis à jour le 2026-10-29 (E1, Q-M3 tranchée)) ; pas de composant « sous-titre » du design system trouvé. |
| ~~D-E1-11~~ | ~~Un contact créé avec un Prénom seul est accepté ?~~ | **Sans objet (mis à jour le 2026-10-29 (E1, précision Email))** : la condition de création est « Nom rempli », et E-mail est nécessaire ; un Prénom seul ne crée rien. |
| D-E1-12 | Où placer la phrase « Ce contact sera ajouté à la fiche du club. » : sous Prénom et Nom (dans la ligne dépliante, ma proposition) ou sous « Fonction du signataire » (qui est un champ unique placé après la ligne, donc hors de celle-ci) ? | **Mis à jour (mis à jour le 2026-10-29 (E1, précision Email)) : sous les quatre champs, donc sous « Fonction du signataire »** (option 2). Les trois premiers champs sont dans la ligne dépliante, Fonction juste après : la phrase à la fin de la ligne n'aurait plus été sous Fonction. Elle est visible quand la saisie libre est active ou la ligne dépliée. Ma première proposition (sous Prénom et Nom) est remplacée. **Confirmée par Hanta (backlog, 2026-10-29), et conforme à la maquette de référence** (mis à jour le 2026-10-29 (E1, alignement sur la maquette et D-E1-12/14)). |
| D-E1-13 (décidée) | Doublons possibles avec un contact existant, plus de case. | **Décidé par Hanta (2026-10-29, 2e série)** : acceptés, pour simplifier l'écran et les données. Rien à faire côté interface. |
| D-E1-14 (nouveau, mis à jour le 2026-10-29 (E1, précision Email)) | Le vrai formulaire du widget clubs refuse une adresse e-mail mal formée (« Saisissez une adresse e-mail valide, par exemple nom@exemple.fr. ») et affiche une consigne « coordonnées professionnelles, pas personnelles ». Le backlog ne décrit que « E-mail vide ». Les reprend-on ? | **Confirmée par Hanta (backlog, 2026-10-29) : on reprend le contrôle de forme de l'e-mail et la consigne « coordonnées professionnelles, pas personnelles »** (décrits au §3, « Contrôle de forme de l'e-mail et consigne » ; mis à jour le 2026-10-29 (E1, alignement sur la maquette et D-E1-12/14)). **Mis à jour (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) : la consigne est retirée par D-E1-16 ; le contrôle de forme reste.** |
| D-E1-15 (décidée par Hanta, backlog ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) | Un bouton « Ajouter un contact » remplace la ligne dépliante `<details>` et ouvre le petit formulaire à son clic. Comment le formulaire se referme-t-il ? | **Un autre clic sur le même bouton** (bascule, `aria-expanded`) : le plus simple, sans bouton ni règle de plus, et rien n'est perdu à la fermeture. Le backlog ne le précisait pas : **confirmé par Hanta** (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée)). Les autres options (bouton « Fermer » propre au formulaire, fermeture au choix d'un contact) ajoutent un contrôle ou un effet caché. Remplace la D-E1-2. |
| D-E1-16 (décidée par Hanta, backlog ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) | Les deux textes d'aide (« * Nécessaires pour ajouter ce contact. » et la consigne « coordonnées professionnelles ») sont retirés. La phrase « Ce contact sera ajouté à la fiche du club. » (D-E1-12) reste-t-elle ? | Retirés : les deux textes cités, il n'en reste aucun dans le formulaire. **La phrase D-E1-12 est gardée telle quelle**, sous « Fonction du signataire » (elle est hors du formulaire et D-E1-16 ne la cite pas) : **confirmé par Hanta** (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée)). **La phrase d'introduction est corrigée** par Hanta : elle redevient « Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature. », sans exception ni « sauf » (D-E1-17). |
| D-E1-17 (décidée par Hanta, backlog ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) | Plus aucun champ obligatoire dans le formulaire, y compris Nom et E-mail. | Ni astérisque ni `required`. Nom vide : rien n'est créé. Nom rempli et E-mail vide ou mal formé : le message d'erreur existant sous E-mail, au clic sur Fermer ou Générer, sans jamais bloquer la saisie (§3, « Cas d'échec »). |
| D-E1-18 (décidée par Hanta, backlog ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) | Espacement entre Nom, Prénom, E-mail et Fonction, trop serré. | Espacement généreux, le même que les autres formulaires de la fenêtre, avec les variables d'espacement du design system (§3, « Champs »). La valeur exacte n'est pas écrite ici : non vérifiée. |
| D-E1-19 (décidée par Hanta, backlog ; mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) | L'encart Club ne doit plus être redimensionnable ; sa hauteur suit son contenu. | Pas de poignée ; hauteur ajustée au contenu réel, sans espace vide ni défilement interne (§3, « Hauteur de l'encart »). La méthode est laissée à dev-interface ; une classe du widget sera à signaler à Hanta. |

### Questions sur la maquette E1 (2026-10-29) : toutes tranchées par Hanta

Écarts constatés entre la maquette de référence (docs/ux/maquette-convention-e1.png) et cette note. **Hanta a répondu aux 8 questions le 2026-10-29** : pour Q-M1, Q-M2, Q-M4, Q-M5, Q-M6, Q-M7 et Q-M8, la note est confirmée telle quelle (aucun changement de contenu) ; pour Q-M3, la maquette l'emporte et la note est modifiée (mis à jour le 2026-10-29 (E1, Q-M3 tranchée)). Seuls la disposition, les champs et le comportement ont été comparés, jamais l'apparence. La colonne « Question » reste pour mémoire.

| N° | Écart | Note actuelle | Maquette | Question |
|---|---|---|---|---|
| Q-M1 | Place du champ « Fonction » | Un champ unique « Fonction du signataire » **après** la ligne dépliante (lecture seule pour un contact de la liste, modifiable en saisie libre) | « Fonction » est le quatrième champ **dans le cadre de la ligne dépliante**, sous E-mail ; aucun champ « Fonction du signataire » séparé n'est visible, repliée comme dépliée | Où affiche-t-on la fonction d'un contact choisi dans la liste, ligne repliée ? Le backlog (D-E1-12) dit « sous Fonction du signataire, à la fin des 4 champs de la ligne dépliante » : la note y répond par un champ unique hors de la ligne. **Tranchée, la note est confirmée telle quelle** (champ unique « Fonction du signataire » après la ligne dépliante ; pas de Fonction dans le cadre dépliant). mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) : « ligne dépliante » se lit « formulaire du bouton Ajouter un contact » ; l'emplacement ne change pas. |
| Q-M2 | Phrase d'introduction | « Aucun champ n'est obligatoire, sauf pour ajouter un nouveau contact (…). Ce qui reste vide sera rempli à la main sur le PDF imprimé : des pointillés apparaîtront à la place. » (texte remplacé, voir la fin de la ligne) | « Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature. » (plus courte, sans l'exception du contact) | Quel texte retient-on ? La version courte oublie que Nom et E-mail sont nécessaires pour un nouveau contact, ce que les deux astérisques disent déjà. **Tranchée le 2026-10-29 en faveur de la phrase longue, puis REMPLACÉE (mis à jour le 2026-10-29 (E1, phrase d'introduction corrigée)) : Hanta retient la version courte, « Un champ laissé vide sera complété à la main, sous forme de pointillés, au moment de la signature. », sans exception, car plus rien n'est obligatoire (D-E1-17).** |
| Q-M3 | Place du sous-titre | Dans le corps, `<p>` au-dessus de l'introduction | Dans l'en-tête, sous le titre « Convention » | Le sous-titre va-t-il dans l'en-tête ? (Sans conséquence sur le texte, D-E1-10.) **Tranchée : la maquette l'emporte, sous-titre dans l'en-tête, sous le titre « Convention »** (mis à jour le 2026-10-29 (E1, Q-M3 tranchée) ; §3 et structure HTML du §8). |
| Q-M4 | Croix de fermeture | Aucune (D-E1-9) ; « croix éventuelle » seulement si le code en a une | Une croix en haut à droite | La maquette contredit D-E1-9 (« pas de croix ajoutée »). Garde-t-on D-E1-9 ? Une croix, si elle est ajoutée, ferait comme « Fermer ». **Tranchée, la note est confirmée telle quelle** (D-E1-9, pas de croix). |
| Q-M5 | Ligne des astérisques | « * Nécessaires pour ajouter ce contact. » sous le résumé de la ligne | Absente ; seuls les deux astérisques sur Nom et E-mail | Garde-t-on cette ligne ? Sans elle, l'astérisque n'est expliqué que par l'introduction. **Tranchée, la note est confirmée telle quelle** (ligne conservée). **Remplacée (mis à jour le 2026-10-29 (E1, bouton Ajouter un contact)) : la ligne est retirée (D-E1-16) et les astérisques aussi (D-E1-17).** |
| Q-M6 | Libellé « E-mail » | « E-mail », comme dans la note depuis la précision Email | « Email » | Quel libellé ? À aligner sur celui du vrai formulaire de clubs, que dev-interface vérifie dans src/clubs/script.js. **Tranchée, la note est confirmée telle quelle** (« E-mail », avec trait d'union). |
| Q-M7 | Ligne dépliante ouverte à l'ouverture | Repliée par défaut | Montrée dépliée dans l'image, avec un Prénom et une Fonction déjà remplis | Image prise après saisie, ou ouverte par défaut ? Je suppose l'image prise après saisie (repliée par défaut, D-E1-2 et D-E1-3). **Tranchée, la note est confirmée telle quelle** (repliée par défaut ; l'image la montrait ouverte seulement pour en montrer le contenu). **mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) : se lit « formulaire fermé par défaut, ouvert par le bouton ».** |
| Q-M8 | Consigne « coordonnées professionnelles » | Présente (D-E1-14) | Absente de l'image (qui précède cette décision) | Rien à faire si la maquette n'est pas mise à jour ; à signaler au chef que son image n'en montre pas. **Tranchée, la note est confirmée telle quelle** (D-E1-14 gardée ; l'image précède cette décision). **mis à jour le 2026-10-29 (E1, bouton Ajouter un contact) : la consigne est retirée par D-E1-16, ce qui rejoint l'image.** |

À confirmer :

1. **Qui peut modifier** les informations de l'agence reprises de la table Agences (agence, adresse, complément, code postal, ville), maintenant affichées en lecture seule ? **[À CONFIRMER]** **Mis à jour le 2026-10-29 (E1)** : l'adresse de l'agence n'est plus affichée dans la fenêtre, la question ne concerne plus que le PDF.
2. **Q-B (déjà ouverte au plan)** : une action en corbeille ou annulée garde-t-elle sa convention ? La génération est-elle interdite pour ces statuts ? Non traitée dans cette note : aucun état ni message n'est prévu pour ce cas.
6. **Icônes** : aucune icône n'est utilisée dans les nouveaux messages. Si Hanta en veut une (information, avertissement), son nom est **à vérifier** dans la bibliothèque https://designsystem.francetravail.io/docs/bibliotheque/icones.html.
7. **Variante d'alerte** : si Hanta préfère une alerte du design system plutôt qu'un `help-block` pour les messages de blocage, la variante d'information ou d'avertissement de la feuille est à vérifier (non lue). Le plus proche connu est `alert alert-error`, déjà employé, mais il signale une erreur : je ne le recommande pas ici.

## 11. Mise en page du PDF (mis à jour le 2026-10-25 (mise en page))

**Mis à jour le 2026-10-29 (E1)** : les logos, polices et mesures ne changent pas. Seul le contenu des cases change : [Année] vient de la campagne ; [Signataire du club] et [Fonction du signataire] peuvent venir d'une saisie libre ; tout champ vide donne des pointillés (§3). Le rappel de périmètre en fin de section (« cette section ne change ni la fenêtre ») reste vrai pour le §11 lui-même.

Public : dev-backend (qui règle `CONVENTION_MISE_EN_PAGE` et `conventionDocumentPdf`), puis Hanta pour les décisions de la fin.
Sources : les mesures relevées par Hanta dans le Word officiel « Du stade vers l'emploi » (les trois Word ont la même mise en page), et la lecture de `src/actions-dashboard/script.js` (format des modèles, `CONVENTION_MISE_EN_PAGE`, `conventionSignatures`, `conventionDocumentPdf`). Aucune mesure n'est inventée : ce qui n'a pas été relevé est écrit « **non relevé** » et repris dans la liste « Mesures qui manquent » plus bas. Mesures complétées par Hanta dans le Word officiel le 2026-10-25, puis valeurs restantes décidées par Hanta le 2026-10-25 (celles qui ne viennent pas du Word sont marquées « choix de Hanta »). Les points non vérifiés sont marqués « à vérifier ».

Conversion utilisée : 1 cm = 28,35 pt, donc 2,5 cm = 70,9 pt. Page A4 (21 × 29,7 cm) : largeur de texte = 16 cm.

### 11.1 Page, texte et éléments (mis à jour le 2026-10-25 (mise en page))

**Page et texte courant**

| Réglage | Valeur du Word | Valeur actuelle du code (à remplacer) |
|---|---|---|
| Format | A4 | A4 (identique) |
| Marges | 2,5 cm partout (70,9 pt) | [56, 72, 56, 64] pt |
| Police | Marianne (voir §11.6) | Roboto |
| Taille du texte | 11 pt | 11 pt (identique) |
| Alignement du texte | justifié | non justifié |
| Interligne (mis à jour le 2026-10-25 (lisibilité)) | simple | **1,2 pour tout le texte** (au lieu de simple), décision de Hanta du 2026-10-25 : le PDF est volontairement plus aéré que le Word, pour les personnes qui voient mal (on ne peut pas changer la police d'un document imprimé) |

**Éléments du format des modèles** (la syntaxe des modèles ne change pas, voir le commentaire de `conventionVersContenuPdf`) :

| Élément du modèle | Taille | Style | Alignement | Espace avant | Espace après |
|---|---|---|---|---|---|
| `#` titre du document (mis à jour le 2026-10-25 (comparaison avec le Word)) | 12 pt | gras | centré, retrait de 1 cm à gauche et de 1 cm à droite | 0 pt | 24 pt (au lieu de 8 pt) |
| `##` titre d'article | 11 pt | gras | à gauche | 18 pt | 8 pt |
| Ligne entièrement en gras, seule (par exemple « En amont de l'opération, France Travail : ») | 11 pt | gras | justifié, comme le texte | 0 pt | 8 pt |
| `###` sous-titre (« 4.1 »…) | 11 pt | gras | à gauche, retrait à gauche de 1,25 cm | 12 pt | 8 pt |
| Paragraphe (mis à jour le 2026-10-25 (lisibilité)) | 11 pt | normal | justifié | 6 pt | 10 pt (au lieu de 0) |
| Élément de liste (à puces ou numérotée) (mis à jour le 2026-10-25 (lisibilité)) | 11 pt | normal | justifié | 0 pt | 6 pt après chaque élément (au lieu de 4) |
| Citation (`> `) : absente des modèles officiels (choix de Hanta) | 11 pt | normal | justifié, retrait à gauche de 1,25 cm, comme les listes (choix de Hanta) | 6 pt, comme un paragraphe (choix de Hanta) | 0 pt, comme un paragraphe (choix de Hanta) |
| Note (`[^1]`) : regroupées à la fin du document (question Q-A) | 10 pt | normal | non relevé | 12 pt avant le bloc des notes (choix de Hanta) | 0 pt (interligne 1,2 comme tout le texte, mis à jour le 2026-10-25 (lisibilité)) |
| `{saut-de-page}` | sans objet | sans objet | sans objet | sans objet | sans objet |
| Bloc de signature | 11 pt | voir §11.5 | voir §11.5 | voir §11.4 | voir §11.4 |

Règles à retenir :

1. **Les titres `##` et `###` rapprochés.** Les espaces avant et après des `##` et `###` s'additionnent, comme dans Word (décision de Hanta du 2026-10-25) : entre un titre d'article et son premier sous-titre, 8 pt après + 12 pt avant, plus les autres espaces éventuels.
2. **Gras dans le texte** (`**gras**`) : même taille que le texte, police grasse (mis à jour le 2026-10-25 (lisibilité)) : un vrai gras (Roboto Bold) au lieu de la graisse « medium » de Roboto fournie avec pdfmake, qui se distingue mal du texte. La source du fichier de police sera choisie par auditeur-securite (version figée, empreinte SRI), comme pour pdfmake ; en attendant, le gras actuel reste en place. Italique, souligné et exposant : inchangés, rien n'a été relevé sur eux.
3. **Liste.** Liste à puces : puce « - », retrait à gauche de 1,25 cm, 0,63 cm entre la puce et le texte, 6 pt après chaque élément (au lieu de 4, mis à jour le 2026-10-25 (lisibilité)). Liste numérotée : même retrait, numérotation « 1. ». 0 pt avant, texte justifié (décision de Hanta du 2026-10-25).
4. **Début de page.** Word garde l'espace avant d'un paragraphe en haut de la première page, mais pas toujours après un saut de page. Écart minime, à regarder sur le PDF.
5. **Texte justifié et pointillés.** Une longue suite de points est un seul « mot » : sur une ligne justifiée, elle peut créer de grands vides. À vérifier sur le premier PDF, avec une zone en pointillés réelle.

### 11.2 Les logos (mis à jour le 2026-10-25 (mise en page))

Décision de Hanta : deux colonnes de type pièce jointe dans `Modeles_convention`, lues au moment de la génération : `Logo` (République française + France Travail) et `Logo_partenaire` (facultatif). Ces deux noms de colonnes sont ceux donnés par Hanta ; je n'ai pas vérifié qu'elles existent encore dans Grist.

| Point | Règle |
|---|---|
| Où (mis à jour le 2026-10-25 (comparaison avec le Word)) | première page seulement, au-dessus du titre `#`. Le **haut des logos est à 1,25 cm du haut de la page** (35,4 pt), comme l'en-tête du Word, donc dans la marge haute de 2,5 cm. Le titre `#` commence **24 pt sous le bas des logos**. Le reste du texte suit le titre normalement |
| `Logo` | à **gauche**, bord gauche aligné sur la marge gauche |
| `Logo_partenaire` | à **droite**, bord droit aligné sur la marge droite, **sur la même ligne** que `Logo` |
| Si seul `Logo` est rempli | `Logo` à gauche, rien à droite |
| Si seul `Logo_partenaire` est rempli | `Logo_partenaire` reste à droite, rien à gauche |
| Taille | `Logo` : 6 cm de large sur 2 cm de haut au plus, proportions gardées. `Logo_partenaire` : 6 cm de large au plus, comme `Logo` (choix de Hanta, 2026-10-25), même hauteur au plus. Chaque logo tient dans sa boîte, garde ses proportions, n'est jamais déformé ni agrandi au-delà de sa taille d'origine. La largeur de 90 pt du code actuel vient du code, pas du Word |
| Le logo ne chevauche jamais le texte (mis à jour le 2026-10-25 (comparaison avec le Word)) | le texte de la première page commence **sous** les logos : le titre `#` est placé 24 pt sous le bas du logo le plus haut des deux. Comme les logos partent à 1,25 cm du haut de la page et peuvent mesurer 2 cm de haut, leur bas peut dépasser la marge haute de 2,5 cm : la position du titre se calcule donc à partir du bas des logos, pas à partir de la marge. À valider par dev-backend |
| Pages suivantes | aucun logo, première page seulement (le code actuel en met un sur chaque page : à changer). Rien ne change : marge du haut de 2,5 cm (mis à jour le 2026-10-25 (comparaison avec le Word)) |

**Cas particuliers (décidés : D-MEP-3, 2026-10-25)** :

| Cas | Ce qui se passe |
|---|---|
| `Logo` vide | la convention est générée **sans ce logo, sans bloquer**. Message d'information après la génération (voir ci-dessous), car ce logo est « obligatoire en pratique » |
| `Logo_partenaire` vide | normal, rien ne s'affiche, aucun message |
| Fichier illisible (corrompu, format non pris en charge, téléchargement qui échoue) | on génère sans ce logo, sans bloquer, avec le même message |
| Plusieurs fichiers dans la cellule | on prend le premier |
| Les deux colonnes sont vides (mis à jour le 2026-10-25 (comparaison avec le Word)) | aucun logo, aucun en-tête vide : le titre commence en haut de la zone de texte, comme avant, sans l'espace de 24 pt ni le décalage des logos |

Message d'information (décision D-MEP-3, ajouté à la liste des textes du §5), affiché avec la réussite de la génération (même emplacement que les messages du §3 « Générer la convention ») : « La convention a été générée sans le logo France Travail. Vérifiez le modèle avant de l'imprimer. » (ou « …sans le logo du partenaire. » si c'est `Logo_partenaire` qui est illisible alors qu'il était rempli). Ce n'est **pas** une erreur : le bouton « Voir la convention » reste disponible.

Formats d'image : pdfmake lit en principe les images PNG et JPEG ; les autres formats (SVG, WebP, GIF) seraient donc « illisibles ». **À vérifier par dev-backend**, car je ne l'ai pas contrôlé ici.

### 11.3 Numéro de page (mis à jour le 2026-10-25 (mise en page))

- **Format** : le numéro seul (« 6 »), sans « Page », sans « sur N ». Le code actuel écrit « Page 6 sur 12 » au centre : à remplacer.
- **Place** : en bas de page, aligné à droite.
- **Taille et distance du bas de page** : 9 pt, à 1,25 cm du bas de la page.
- **Première page** : le numéro est absent de la première page.

### 11.4 Règles de coupure (mis à jour le 2026-10-25 (mise en page))

1. **« Fait à…, le… » et les signatures ne sont jamais séparés.** Le bloc de signature actuel est déjà insécable (`unbreakable`), mais la ligne « Fait à … » des modèles Du stade vers l'emploi et Match des métiers est aujourd'hui un simple paragraphe du texte du modèle, hors de ce bloc : c'est ce qui l'a laissée seule en bas d'une page. Règle : la ligne « Fait à …, le … » et les deux colonnes forment un seul bloc insécable (voir §11.5 pour la façon de l'obtenir).
2. **Un titre d'article n'est jamais seul en bas de page.** Un titre (`##`, `###`, ligne en gras) est toujours suivi, sur la même page, d'au moins les deux premières lignes du paragraphe ou de la liste qui le suit ; sinon le titre passe à la page suivante. pdfmake propose pour cela une fonction de saut de page conditionnel (`pageBreakBefore`) : **à vérifier par dev-backend**.
3. **Titre du document (`#`)** : même règle que les titres d'article.
4. **Si le bloc de signature ne tient pas en bas de page**, il passe en entier à la page suivante, même si cette page ne contient alors que lui (cas non décrit par le Word : voir D-MEP-4).
5. **Sauts de page `{saut-de-page}`** : inchangés.

### 11.5 Ordre des colonnes de signature (mis à jour le 2026-10-25 (mise en page))

État des lieux. Dans le Word : Du stade vers l'emploi et Match des métiers : France Travail à **gauche**, club à **droite**, précédés d'une ligne « Fait à …, le … » (une seule, au-dessus des deux colonnes). Parcours de remobilisation : club à **gauche**, France Travail à **droite**, avec « À …, le … » en tête de **chaque** colonne. Dans le code actuel, `{signatures}` et `{signatures:lieu-date}` mettent toutes deux le club à gauche : seul `{signatures:lieu-date}` correspond donc à Parcours de remobilisation.

**Proposition (sans casser les marqueurs existants)** : un seul nouveau marqueur, `{signatures:ft-gauche}`, seul sur sa ligne comme les autres.

| Marqueur | Effet | Modèle concerné |
|---|---|---|
| `{signatures}` | inchangé : club à gauche, agence à droite, pas de ligne de lieu et de date | aucun modèle officiel connu (conservé tel quel) |
| `{signatures:lieu-date}` | inchangé : club à gauche, agence à droite, « À …, le … » en tête de chaque colonne | Parcours de remobilisation |
| `{signatures:ft-gauche}` (**nouveau**) | **une** ligne « Fait à …, le … » au-dessus ; puis France Travail à gauche, club à droite. Ligne et colonnes dans le même bloc insécable | Du stade vers l'emploi, Match des métiers |

Conséquences :

- Le modèle **n'écrit plus** lui-même la ligne « Fait à … » : le marqueur la produit, pour qu'elle ne puisse pas être séparée des colonnes (§11.4, règle 1). Si le texte des deux modèles contient déjà un paragraphe « Fait à … » avant `{signatures}`, il est à retirer en même temps : **je n'ai pas lu le texte des modèles** (il est dans `Modeles_convention`, dans Grist), à vérifier avant le changement pour ne pas l'imprimer deux fois.
- Ligne « Fait à…, le… » : 18 pt avant. Intitulés « Pour France Travail » et « Pour l'organisation sportive » : gras, 11 pt, une colonne chacun. Signatures : deux colonnes de même largeur, écart de 24 pt entre elles ; 3 cm d'espace sous les intitulés pour la signature manuscrite ; pointillés de « Fait à…, le… » : 28 points, comme le reste du PDF (choix de Hanta, 2026-10-25, ces trois valeurs ne viennent pas du Word).
- Variante inutile pour l'instant : « France Travail à gauche **avec** lieu et date dans chaque colonne » (aucun des trois Word ne la demande). Elle s'écrirait `{signatures:lieu-date:ft-gauche}` si un jour il le fallait.
- Un marqueur inconnu reste du texte ordinaire, comme aujourd'hui (comportement du code actuel) : une faute de frappe dans `ft-gauche` se verrait donc à l'impression. Un contrôle à l'enregistrement du modèle est hors de cette note.

### 11.6 La police : deux options, sans choix (mis à jour le 2026-10-25 (mise en page))

| | Roboto (actuelle) | Marianne (celle du Word) |
|---|---|---|
| Ressemblance avec le Word | police différente : les lettres sont plus étroites ou plus larges, les lignes et les pages ne se coupent pas aux mêmes endroits que dans le Word | identique : la coupure des lignes et des pages est proche du Word, à vérifier sur un vrai PDF |
| Où se trouve le fichier de la police | chargée avec pdfmake depuis cdnjs, avec empreinte vérifiée (`Roboto.min.js`, tâche 7.1) : rien dans le dépôt | **ne peut pas** être mise dans le dépôt public (licence, d'après Hanta) : donc pas non plus sur GitHub Pages, qui est public |
| Effort | aucun, déjà en place | il faut ranger les fichiers de la police ailleurs, par exemple en pièce jointe dans une table Grist (même méthode que les logos), puis les charger à la génération. Il en faut une par variante utilisée : normal, gras, italique, gras italique (**non vérifié** : disponibilité de chaque variante en italique dans la version à notre disposition) |
| Droits | aucun | tous les profils qui génèrent doivent pouvoir lire la table qui contient la police ; sinon, génération impossible pour eux. À vérifier avec les règles d'accès |
| Risques | écart d'aspect avec le Word | chargement plus lourd (poids des fichiers **non mesuré**) ; panne si la table est vide ou illisible : il faudrait alors générer en Roboto, ou bloquer, à décider ; licence à relire avant de choisir l'endroit de stockage |
| Sécurité | police de la même source que pdfmake | fichier de police provenant de Grist : à faire examiner par auditeur-securite, comme pour le reste de la génération |

### 11.7 Mesures qui manquent (mis à jour le 2026-10-25)

Aucune mesure manquante (2026-10-25).

### 11.8 Décisions qui reviennent à Hanta (mis à jour le 2026-10-25 (mise en page))

| N° | Décision | Décision de Hanta (2026-10-25) |
|---|---|---|
| D-MEP-1 | Police : Roboto ou Marianne (§11.6) | Roboto pour la première version ; Marianne seulement si l'écart avec le Word est jugé gênant |
| D-MEP-2 | Nom du nouveau marqueur : `{signatures:ft-gauche}` (§11.5) | Oui, marqueur `{signatures:ft-gauche}`, sans variante combinée |
| D-MEP-3 | Logo vide ou illisible : générer sans bloquer, avec le message d'information du §11.2 | Oui, générer sans bloquer, avec le message d'information du §11.2 (ajouté à la liste des textes du §5) |
| D-MEP-4 | Bloc « Fait à » et signatures seul sur une page, quand il ne tient pas en bas de la précédente | Oui, le bloc de signature passe en entier sur la page suivante s'il ne tient pas |
| D-MEP-5 | Le texte « Fait à … » passe dans le marqueur et sort du texte des modèles Du stade vers l'emploi et Match des métiers (§11.5) | Oui, la ligne « Fait à… » sort du texte des modèles Du stade vers l'emploi et Match des métiers |
| D-MEP-6 | Valeurs non relevées du §11.7 | Réglé par les valeurs décidées le 2026-10-25 (§11.1, §11.2, §11.5) |
| D-MEP-7 | Numéro de page (9 pt, à 1,25 cm du bas, absent de la première page) | Réglé |

Rappel de périmètre : cette section ne change ni la fenêtre « Convention » ni les textes des §3 et §5, hormis le message de logo du §11.2, ajouté à la liste des textes du §5.

## 12. Re-générer (S8) (mis à jour le 2026-10-26 (S8))

**Mis à jour le 2026-10-29 (E1), à lire avant ce qui suit.** Ce qui change : (1) le tableau §12.1 ne renvoie plus à des contrôles de champs obligatoires ni à l'enregistrement par bouton (supprimés) ; (2) la fenêtre n'a plus ni « Modèle utilisé » ni champ « Année » : les mentions de l'année enregistrée reprise, du modèle affiché et du champ « Année » du §12.3 et du §12.5 ne s'appliquent plus (D-S8-4 reste vraie pour `Modele` si la colonne est encore écrite : à confirmer par dev-backend, D-E1-8) ; (3) le pied n'a que « Fermer » et « Générer la convention » (§12.3) ; (4) la fenêtre de re-génération est préremplie avec le signataire enregistré (`Signataire_club`, toujours un contact de la liste, y compris un contact créé par la saisie libre), le représentant et sa fonction ; (5) la phrase « Le nouveau PDF remplacera la convention générée le [date]. » et la phrase « L'ancienne convention reste disponible. » restent inchangées ; (6) à la fermeture sans génération, la saisie est enregistrée en silence, **mais l'ancien PDF reste intact** (§12.7 vaut toujours : `PDF_genere` et `Date_generation` ne sont écrits qu'à la fin d'une génération réussie). Le reste du §12 est inchangé.

Public : Hanta (pour décider), puis dev-interface et dev-backend (tâche 8.1), puis le testeur (8.2).
**Où cette partie est placée, et pourquoi.** Dans une section à part, à la fin de la note, et non dans le §3 : le §3 décrit déjà la fenêtre et la génération en détail, et la re-génération réutilise tout cela. Une section à part dit en un seul endroit ce qui change, sans toucher aux numéros ni aux renvois existants. Le §3 (« Générer la convention : de l'ouverture au résultat ») y renvoie.
Sources lues : ce fichier en entier, `docs/backlog.md` (S8, Q-I, Q-J), `REVIEW_LOG.md` (fiche C33) et `src/actions-dashboard/script.js` (`conventionEtat`, `conventionAEcrire`, `conventionGenerer`, `conventionModeleActif`, `conventionModeleInfos`). Aucune commande lancée, rien exécuté.

### 12.1 Ce qui ne change pas : tout ce qui est écrit pour « Générer » s'applique à l'identique

« Re-générer » **n'ajoute aucune règle** à celles de la génération. Ne pas les réécrire ; lire :

| Sujet | Où c'est décrit | À la re-génération |
|---|---|---|
| Génération bloquée (agence, club, dispositif, adresse du club) et ses messages | §2 | identique : « Re-générer » est grisé avec le message du premier élément manquant (déjà écrit au §2) |
| Contrôle des champs obligatoires, les six messages, tous à la fois | §3 « Enregistrer et Générer » | identique |
| Enregistrement des informations avant la fabrication du PDF (D-S7-4) | §3 « Générer la convention : de l'ouverture au résultat », étape 2 | identique |
| Attente : texte « Génération en cours… », région `role="status"`, verrou des trois boutons, Fermer et Échap ignorés, champs non modifiables | §3 (D-S7-2, D-S7-5, D-S7-7) | identique |
| Cases du modèle, pointillés, case inconnue bloquante | §3 « Cases du modèle » | identique |
| Logos, message d'information si un logo manque | §11.2 | identique |
| Mise en page du PDF | §11 | identique |
| Nom du fichier PDF | §3 « Nom du fichier PDF » | identique, calculé avec les valeurs du moment (une année corrigée change le nom) |
| Messages d'échec | §3 « Échecs » | identiques, avec une phrase en plus (§12.7) |
| Après une réussite : fenêtre fermée, alerte « Convention générée. », focus sur « Voir la convention » | §3 « Après une réussite » (D-S7-6) | identique : le bouton « Re-générer » existe toujours à l'état « Générée », mais le focus va quand même sur « Voir la convention », comme à la première génération |
| Droits, ANS, tables refusées | §2 | identique : « Droits insuffisants » l'emporte |

« Re-générer » n'existe qu'à l'état **« Générée »**. À l'état « Signée », il n'y a ni « Re-générer » ni accès au PDF généré (§2, A3) : pas de changement.

### 12.2 Le bouton « Re-générer » dans le bloc (état « Générée »)

- **Place.** Sur la même rangée de boutons que « Voir la convention », **juste après lui** (ordre de Tab = ordre visuel : « Voir la convention », « Re-générer », « Déposer la convention signée »). Cet ordre est celui du tableau des états du §2, qui ne change pas.
- **Style.** `btn btn-secondary`, comme « Voir la convention » : même taille, sans icône, pas de `btn-sm`. Un seul bouton ne devient pas principal ici : la rangée n'a aucun bouton principal.
- **Texte.** « Re-générer » (déjà décidé, §5). Pas de texte caché supplémentaire : le bouton ouvre une fenêtre, ce que dit `aria-haspopup="dialog"`.
- **Actif** : `aria-haspopup="dialog"` ; **grisé** (génération bloquée) : `aria-disabled="true"`, `aria-describedby` vers le message du bloc, pas d'`aria-haspopup` (règle du §2, sans changement).
- **Mobile.** Les boutons gardent leur taille normale et passent à la ligne, dans le même ordre (§2).
- **Ce qui est interdit** : un deuxième bouton « Générer la convention » dans le bloc à l'état « Générée » ; un lien « Modifier et régénérer » (retiré par le chef, §10).

Structure (réutilise celle de « Générer la convention » du bloc, §2 ; `id` donné à titre d'exemple, dev-interface choisit l'`id` en suivant les noms déjà employés dans le script, aucun bouton « Re-générer » n'y existe encore) :

```html
<button class="btn btn-secondary" type="button" id="conventionRegenerer" aria-haspopup="dialog">
  <span class="btn-content">Re-générer</span>
</button>
```

### 12.3 La fenêtre à la re-génération

- **Même fenêtre « Convention »** que pour générer : même structure, `modal-xl`, trois blocs, mêmes champs, même titre « Convention ». Aucune nouvelle fenêtre, aucun nouveau composant.
- **Préremplie** avec les informations déjà enregistrées dans la ligne de la convention, comme à toute réouverture (fiche C33 du REVIEW_LOG) : année, signataire du club, représentant de l'agence, fonction du représentant. Les champs en lecture seule (club, siège, agence, adresse, fonction du signataire) se lisent comme d'habitude à l'ouverture.
  - **L'année enregistrée est reprise, pas l'année en cours** : l'année en cours (D-4) n'est proposée que si rien n'est enregistré.
  - **Un contact qui n'existe plus** (supprimé depuis dans la fiche du club) : la liste « Signataire » montre l'invite « Veuillez sélectionner » et l'agent doit en choisir un autre ; le contrôle de « Générer » le lui rappelle (« Choisissez le signataire du club. »). Rien de nouveau à écrire.
- **Bouton du pied : « Générer la convention » (décidé par Hanta le 2026-10-26, D-S8-1).** Le texte **ne change pas**. Raisons : c'est ce que la note dit déjà (§2, §5 : « aussi à la re-génération »), l'agent a cliqué sur « Re-générer » pour arriver là donc il sait ce qu'il fait, un deuxième libellé obligerait à doubler les textes d'attente et de succès (« Re-génération en cours… »), et la fenêtre reste la même pour les deux cas. Le pied reste : « Fermer », « Enregistrer les informations », « Générer la convention » (seul bouton principal).
- **Phrase d'information en tête du corps (décidé par Hanta le 2026-10-26, D-S8-2).** Parce que le remplacement est **sans historique**, l'agent doit le savoir avant de cliquer. Quand la fenêtre est ouverte depuis « Re-générer », une phrase ordinaire s'ajoute **tout en haut du corps**, avant la phrase sur les champs obligatoires : « Le nouveau PDF remplacera la convention générée le [date]. » C'est un `<p>` ordinaire, sans classe d'alerte (ce n'est ni une erreur ni un succès), présent dès l'ouverture, lu en parcourant la fenêtre ; pas de région `role="status"` (elle n'apparaît pas après une action). La date est celle de `Date_generation`, au même format que « Convention générée le [date]. » du bloc. Elle n'existe pas à la première génération.
- **Focus à l'ouverture** : sur le premier champ modifiable, comme à la première génération (§6).
- **Fermer / Échap** (hors attente) : ferment sans confirmation (Q-H), le focus revient sur **« Re-générer »** (le bouton qui a ouvert la fenêtre, qui existe toujours). Les informations modifiées et non enregistrées sont perdues, l'ancien PDF est intact.
- **Mobile, zoom 200 %, mode sombre** : sans changement (§7).

### 12.4 Ce qui change vraiment par rapport à une première génération

| Point | Première génération | Re-génération |
|---|---|---|
| Bouton d'ouverture | « Générer la convention » (état « À générer ») | « Re-générer » (état « Générée ») |
| Ligne `Conventions` | créée à l'étape 2 s'il n'y en a pas | existe déjà : mise à jour (la plus ancienne en cas de doublon, comme aujourd'hui) |
| `PDF_genere` | rempli | **remplacé** par le nouveau fichier, **sans historique** (§1, §10) : la cellule ne contient jamais deux fichiers |
| `Date_generation` | écrite | **réécrite avec la nouvelle date**, dans la même opération que `PDF_genere` (D-S7-1) |
| `Modele` | le modèle actif | voir Q-I (§12.5) |
| `PDF_signe`, `Date_depot` | sans objet | **jamais touchés** (l'état « Générée » n'a pas de fichier signé) |
| Après un échec | état « À générer », aucun fichier | état « Générée », **l'ancien PDF et l'ancienne date restent** (§12.7) |
| Phrase en tête de la fenêtre | aucune | « Le nouveau PDF remplacera la convention générée le [date]. » (D-S8-2) |
| Messages d'échec | ceux du §3 | ceux du §3 + « L'ancienne convention reste disponible. » (D-S8-3) |

### 12.5 Q-I : quel modèle enregistrer à la re-génération ? (décidé le 2026-10-26 : option A, D-S8-4)

**État actuel du code (lu, pas exécuté).** Aujourd'hui, les deux moitiés ne vont pas ensemble :
- l'enregistrement des informations écrit `Modele` avec le modèle de la ligne existante s'il y en a une, sinon le modèle actif (`conventionEtat`, `conventionAEcrire`) ;
- la fenêtre affiche le titre de **ce même modèle** (« Modèle utilisé ») et en tire la présence du champ « Année » (`conventionModeleInfos`) ;
- mais la fabrication du PDF lit le texte du **modèle actif du dispositif** (`conventionGenerer` appelle `conventionModeleActif`).

Tant que le modèle n'a pas changé, c'est invisible. Dès qu'un modèle a été remplacé (nouveau modèle actif pour le même dispositif), une re-génération ferait un PDF avec le **nouveau** texte, tout en affichant et en gardant l'**ancien** modèle dans `Modele` : l'information enregistrée serait fausse.

| Option | Ce que ça donne | Avantages | Inconvénients |
|---|---|---|---|
| **A. Modèle actif au moment de la re-génération** (**décidé**) | `Modele` est mis à jour avec le modèle actif ; la fenêtre affiche ce modèle (et son champ « Année » ou non) ; le PDF est fait avec ce modèle | simple, cohérent avec le texte réellement imprimé ; corriger une erreur du modèle est une raison fréquente de re-générer ; si le modèle n'est plus actif, on retombe sur l'échec déjà décrit (« le modèle de convention n'est plus disponible… ») | le texte de la convention peut changer entre deux générations : l'agent doit pouvoir le voir (le titre du modèle dans la fenêtre suffit à le dire, mais pas ce qui a changé dedans) |
| **B. Modèle de la génération d'origine** | le PDF est refait avec l'ancien texte | une re-génération ne change jamais le texte du contrat | l'ancien modèle est peut-être inactif ou modifié : il faudrait le relire même inactif, ce qui contredit « Modèle inactif ou introuvable » du §3 ; si son texte a été corrigé, la re-génération ne corrige rien ; plus de code |

**Décidé par Hanta le 2026-10-26 (D-S8-4) : option A.** Le modèle actif est enregistré dans `Modele` à **chaque** re-génération (pas celui d'origine), pour qu'il corresponde toujours au texte réellement utilisé dans le PDF. Deux conséquences à faire coder en 8.1 : (1) la fenêtre « Modèle utilisé » et la présence du champ « Année » suivent le modèle actif à l'ouverture, pas la ligne enregistrée ; (2) `Modele` est réécrit avec l'id du modèle actif à l'étape 2 (la ligne enregistrée doit dire ce qui est imprimé). Cas à traiter : si le modèle actif n'a plus d'année alors que la convention en avait une (ou l'inverse), la fenêtre suit le modèle actif ; l'année enregistrée n'est simplement pas montrée dans le premier cas, et l'année en cours est proposée dans le second (D-4).

### 12.6 Q-J : que devient l'ancien PDF ? (décidé le 2026-10-26 : option A, D-S8-5)

**Ce que fait le widget, dans tous les cas** : il **ne supprime jamais** un fichier. Il remplace seulement la valeur de la cellule `PDF_genere` (une liste d'un fichier) par la référence du nouveau fichier, dans la dernière écriture de la chaîne. Il n'y a aucune étape « effacer l'ancien ».

**Ce que devient l'ancien fichier, une fois la cellule remplacée.** Il reste dans le stockage des pièces jointes du document Grist, **sans être rattaché** à une cellule. **Réglé le 2026-10-26 (D-S8-7) : Grist ne supprime pas une pièce jointe qu'aucune cellule n'utilise** (vérifié par Hanta dans DEV7 : 34 → 35 pièces jointes après une re-génération). Texte d'origine, gardé pour mémoire : si et quand Grist supprime une pièce jointe qu'aucune cellule n'utilise n'était pas vérifié. Comment le vérifier (par Hanta, dans le document DEV, rien à coder) : générer, noter la taille ou le nombre de pièces jointes affichés par Grist pour le document, re-générer, regarder à nouveau ; revenir après quelques jours. Le résultat décide du reste : si Grist nettoie tout seul, il n'y a rien à faire ; sinon, des PDF contenant des noms de signataires s'accumulent dans le document, ce qui rejoint la durée de conservation à décider (§7, §10).

| Option | Ce que ça donne | Avantages | Inconvénients |
|---|---|---|---|
| **A. Laisser l'ancien PDF dans Grist, non rattaché, sans le supprimer depuis le widget** (**décidé**) | le widget ne fait que remplacer la cellule | aucun risque de perdre l'ancien fichier par erreur ; aucun code ni droit de plus ; le même comportement qu'au remplacement du fichier signé (§4) | l'ancien PDF (avec noms de signataires) reste jusqu'à un nettoyage de Grist, à vérifier |
| **B. Supprimer l'ancien fichier depuis le widget après la réussite** | le widget demande à Grist de supprimer la pièce jointe | rien d'orphelin | rien dans la note ni dans le dépôt ne montre que le widget a le droit ou le moyen de supprimer une pièce jointe (**non vérifié**) ; une suppression qui échoue ou qui touche le mauvais fichier est irréversible ; contredit la prudence de §12.7 |

**Décidé par Hanta le 2026-10-26 (D-S8-5) : option A.** L'ancien PDF n'est **jamais supprimé par le widget** ; s'il n'est plus rattaché à aucune cellule après un rattachement réussi du nouveau, il reste **orphelin** dans Grist. Grist ne nettoie pas les orphelins (D-S8-7, vérifié par Hanta dans DEV7 le 2026-10-26). Si un jour la suppression depuis le widget est voulue, ce sera une tâche à part, avec l'avis d'auditeur-securite.

**Cas : le nouveau fichier est envoyé, mais le rattachement échoue.** Réponse : **l'ancien PDF reste en place** (la cellule n'a pas été modifiée), « Voir la convention » ouvre l'ancien, la date reste l'ancienne. Le nouveau fichier est un fichier orphelin dans Grist (même nature que l'ancien après un remplacement réussi). Chaque nouvel essai raté peut en laisser un de plus : petit risque d'accumulation, signalé dans les risques. Message : celui de la ligne « Fichier envoyé, écriture dans la convention… refusée ou échouée » du §3, plus la phrase du §12.7.

### 12.7 Si la re-génération échoue : l'ancien PDF n'est jamais perdu

**Règle.** La cellule `PDF_genere` et `Date_generation` ne sont **modifiées qu'une seule fois, à la toute fin**, dans une seule opération, **après** que le nouveau fichier est fabriqué **et envoyé avec succès**. Avant cette dernière écriture, l'ancien PDF est intact, quelle que soit l'étape qui échoue. C'est déjà l'ordre de la génération (§3, étapes 1 à 5 ; D-S7-1) : il n'y a rien à ajouter, il ne faut qu'**interdire de le changer**.

| Étape (§3) | Ce qui est écrit si elle échoue | `PDF_genere` / `Date_generation` | « Voir la convention » |
|---|---|---|---|
| 1. Contrôle des champs | rien | inchangés | ouvre l'ancien PDF |
| 2. Enregistrement des informations | rien (ou rien de plus) | inchangés | ouvre l'ancien PDF |
| 3. Modèle introuvable, case inconnue | informations déjà enregistrées | inchangés | ouvre l'ancien PDF |
| 4. pdfmake ou fabrication | informations déjà enregistrées | inchangés | ouvre l'ancien PDF |
| 5a. Envoi du nouveau fichier | informations déjà enregistrées | inchangés | ouvre l'ancien PDF |
| 5b. Écriture de `PDF_genere` et `Date_generation` | informations déjà enregistrées ; **nouveau fichier orphelin** | inchangés, car une seule opération : tout passe ou rien ne passe | ouvre l'ancien PDF |

**Règles pour dev-backend (à vérifier par le testeur, 8.2) :**
1. **Jamais** de vidage préalable de `PDF_genere` (« effacer, puis envoyer, puis remplir »), ni de `Date_generation`.
2. **Jamais** de suppression de l'ancien fichier, avant ni après (§12.6, option A).
3. La mémoire du navigateur (`state.raw.Conventions`) n'est mise à jour qu'après une écriture réussie : en cas d'échec, le bloc continue à montrer l'ancienne date et à ouvrir l'ancien fichier, sans rechargement.
4. `PDF_genere` ne devient **pas** la liste de deux fichiers : c'est une valeur de remplacement, pas un ajout (test de la recette R5 : « la liste des pièces jointes ne contient qu'un fichier »).

**Ce que voit l'agent après un échec (fenêtre ouverte, comme au §3 « Échecs »).** Les règles communes du §3 s'appliquent (fenêtre ouverte, saisie gardée, alerte `alert alert-error` `role="alert"` en haut du corps, focus sur « Générer la convention »). **À la re-génération, une phrase est ajoutée à la fin de chaque message d'échec de génération** du tableau du §3 (huit lignes : bibliothèque non chargée, une case inconnue, plusieurs cases inconnues, modèle inactif ou introuvable, envoi refusé, envoi impossible, fichier non rattaché, échec inattendu) : « L'ancienne convention reste disponible. » (décision D-S8-3). Exemple : « La convention n'a pas pu être générée. Vos informations sont conservées. L'ancienne convention reste disponible. » Elle ne s'ajoute pas à la première génération (il n'y a pas d'ancienne convention), ni aux erreurs de champ, ni à l'échec de l'enregistrement de l'étape 2 (message du §5, qui ne parle pas de génération).
- Après avoir fermé la fenêtre, le bloc est **inchangé** : état « Générée », ancienne date, « Voir la convention » qui ouvre l'ancien PDF.

**Un effet à connaître (accepté par Hanta le 2026-10-26, D-S8-6).** L'étape 2 enregistre les nouvelles informations **avant** de fabriquer le PDF (D-S7-4). Si la re-génération échoue ensuite, la ligne `Conventions` contient donc les **nouvelles** informations (par exemple une année corrigée) alors que le PDF encore visible a été fait avec les **anciennes**. C'est voulu à la première génération (« Vos informations sont conservées »), mais à la re-génération le PDF et les informations enregistrées peuvent se contredire jusqu'à une re-génération réussie. Aucune solution ne fait mieux sans changer D-S7-4. **Décidé : (a) accepter** (cohérent avec D-S7-4, le message le dit, et la fenêtre rouverte montre les informations que l'agent a saisies pour réessayer). Écarté : (b) ne pas enregistrer avant le PDF à la re-génération seulement : l'agent perdrait sa saisie en cas d'échec et « Vos informations sont conservées » deviendrait faux, il faudrait donc un message différent.

**Cas « écriture réussie, mais réponse réseau perdue » (ajouté le 2026-10-26, demande de Hanta).** Grist a bien écrit `PDF_genere` et `Date_generation` (étape 5b), mais la réponse n'est jamais revenue au widget (coupure, délai dépassé). Le widget reçoit une erreur alors que le nouveau fichier **est** rattaché : afficher « La convention n'a pas pu être générée… L'ancienne convention reste disponible. » serait faux (l'ancienne n'est plus rattachée, et l'agent referait une génération pour rien, ce qui laisserait un fichier orphelin de plus).
- **Demande à dev-backend** : éviter qu'un tel cas s'affiche comme un échec. Quand l'étape 5b (ou la lecture de sa réponse) échoue pour une raison qui n'est **pas** un refus clair de Grist (droits, règle d'accès), vérifier d'abord, par une relecture de la ligne `Conventions`, si `PDF_genere` contient déjà le nouveau fichier. Si oui, traiter comme une réussite (alerte « Convention générée. », fenêtre fermée, mémoire du navigateur mise à jour). Si la relecture donne l'ancien fichier, c'est un vrai échec : messages du §3 + phrase du §12.7.
- **Risque connu si ce n'est pas totalement garanti** : si la relecture échoue aussi (réseau toujours coupé), le widget ne peut pas savoir ; il affiche alors le message d'échec habituel, qui peut être inexact. L'agent verra la bonne date après avoir rechargé la fiche. Dev-backend dit dans son compte rendu ce qu'il a pu garantir ; ce risque est signalé, pas ignoré (à ajouter aux risques restants de 8.1).
- **Même cas à l'étape 5a** (envoi du fichier réussi, réponse perdue) : sans identifiant de fichier reçu, le rattachement est impossible ; l'ancien PDF reste en place, le nouveau fichier est orphelin (§12.6). Le message d'échec affiché est alors exact pour l'agent.

**Cas « le fichier signé est déposé pendant que la fenêtre de re-génération est ouverte » (ajouté le 2026-10-26, demande de Hanta).** Un autre agent (ou le même, dans un autre onglet) dépose la convention signée, l'état du document passe à « Signée », alors que la fenêtre de re-génération est encore ouverte chez quelqu'un. **Accepté sans traitement particulier pour l'instant** : aucun contrôle, aucun message de plus. À revoir si un jour le cas se produit en pratique (la re-génération pourrait alors remplacer `PDF_genere` alors que la convention est déjà signée ; `PDF_signe` et `Date_depot` ne sont jamais touchés par la re-génération, §12.4).

### 12.8 Nouveaux textes (pour dev-interface ; ajoutés à la liste du §5)

- Mis à jour le 2026-10-26 (S8), phrase en tête de la fenêtre à la re-génération (D-S8-2) : « Le nouveau PDF remplacera la convention générée le [date]. »
- Mis à jour le 2026-10-26 (S8), phrase ajoutée à la fin des huit messages d'échec de génération à la re-génération (D-S8-3) : « L'ancienne convention reste disponible. »
- Rien d'autre : bouton « Re-générer », pied « Générer la convention », « Génération en cours… », « Convention générée. » existent déjà.

### 12.9 Cas à faire tester en 8.2 (pour le testeur)

Un seul fichier dans `PDF_genere` après une re-génération réussie ; `Date_generation` plus récente ; `PDF_signe` et `Date_depot` inchangés ; fenêtre préremplie avec l'année enregistrée (pas l'année en cours) ; échec à chaque étape du tableau du §12.7 : `PDF_genere` et `Date_generation` inchangés et phrase « L'ancienne convention reste disponible. » présente ; la phrase absente à la première génération ; focus de retour sur « Re-générer » à la fermeture sans génération, sur « Voir la convention » après une réussite ; « Re-générer » grisé avec le message du §2 quand un élément manque ; `Modele` égal au modèle actif après chaque re-génération réussie (D-S8-4), y compris quand il a changé depuis la première génération ; phrase « Le nouveau PDF remplacera la convention générée le [date]. » présente à la re-génération, absente à la première ; l'ancien PDF jamais supprimé par le widget (D-S8-5) ; écriture réussie avec réponse perdue : pas d'échec affiché si le fichier est rattaché, ou risque connu noté (§12.7). Non testé automatiquement : le cas du fichier signé déposé pendant que la fenêtre est ouverte (accepté, §12.7).

### 12.10 Décisions de Hanta (du 2026-10-26, S8)

Les sept points posés dans cette note sont tranchés. Colonne de droite : ce que cela change dans la note.

| N° | Décision | Décidé le 2026-10-26 |
|---|---|---|
| D-S8-1 | Texte du bouton du pied à la re-génération | **Le bouton reste « Générer la convention ».** (§12.3) |
| D-S8-2 | Phrase en tête de la fenêtre à la re-génération | **Oui** : « Le nouveau PDF remplacera la convention générée le [date]. » (§12.3, §12.8) |
| D-S8-3 | Phrase ajoutée aux messages d'échec à la re-génération | **Oui** : « L'ancienne convention reste disponible. » (§12.7, §12.8) |
| D-S8-4 (Q-I) | Modèle enregistré à la re-génération | **Le modèle actif**, enregistré dans `Modele` à chaque re-génération (pas celui d'origine), pour qu'il corresponde toujours au texte réellement utilisé dans le PDF. (§12.5) |
| D-S8-5 (Q-J) | Ancien PDF | **Jamais supprimé par le widget** ; s'il n'est plus rattaché à aucune cellule après un rattachement réussi du nouveau, il reste orphelin dans Grist. (§12.6) |
| D-S8-6 | Nouvelles informations enregistrées alors que le PDF visible est l'ancien, après un échec | **Accepté.** (§12.7) |
| D-S8-7 | Grist supprime-t-il tout seul une pièce jointe orpheline ? | **Réglé : non** (vérifié par Hanta dans DEV7 le 2026-10-26 : 34 → 35 pièces jointes après une re-génération). (§12.6) |

Deux cas ajoutés au même moment (§12.7) : « écriture réussie mais réponse réseau perdue » (dev-backend doit éviter l'échec affiché à tort, sinon risque connu signalé) et « fichier signé déposé pendant que la fenêtre de re-génération est ouverte » (accepté sans traitement, à revoir s'il se produit).

## 13. Dépôt et remplacement du fichier signé (S9) : décisions qui reviennent à Hanta (mis à jour le 2026-10-26 (S9))

**Mis à jour le 2026-10-29 (E1)** : aucune décision du §13 n'est modifiée. Le nom du fichier signé suit `Actions.Campagne` (§4.1 k, D-E1-8).

Les compléments sont au §4.1. Rien d'antérieur n'est changé, sauf l'ordre des contrôles du fichier au §4 (corrigé pour suivre la décision déjà prise : vide, taille, extension, type, contenu). Les 8 décisions ci-dessous (S9-1 à S9-8) sont **prises** : Hanta les a toutes tranchées le 2026-10-26, dans le sens de la recommandation proposée pour chacune. Plus aucune n'est en attente.

| N° | Question | Décision de Hanta (2026-10-26) |
|---|---|---|
| S9-1 | Écriture de `PDF_signe` et `Date_depot` : une seule opération `PATCH`, après l'envoi du fichier ? (§4.1 g) | **Oui**, comme D-S7-1 : pas d'état « fichier signé sans date », et l'ancien fichier signé reste en place si l'écriture échoue. |
| S9-2 | Annonce de l'attente pour les lecteurs d'écran : région `role="status"` pendant l'envoi, ou l'alerte de fin seule ? (§4.1 d) | **Région `role="status"`** (« Envoi de la convention signée en cours… »), car l'envoi peut durer plusieurs secondes ; l'alerte de fin seule laisse un silence. Coût : une région vide de plus dans le bloc. |
| S9-3 | Focus après un dépôt réussi (§4.1 e) | **Premier dépôt : « Voir la convention signée »** (le bouton de dépôt a disparu) ; **remplacement : le focus reste sur le lien « Remplacer le fichier signé »**. |
| S9-4 | Ajouter un message distinct quand Grist refuse l'écriture (droits) ? Aujourd'hui, une seule phrase d'échec. | **Oui** : « Le fichier n'a pas été enregistré : vos droits ne le permettent pas pour cette action. Contactez l'équipe du tableau de bord. » (réponse 401 ou 403 de Grist), comme pour la génération (§3). Toute autre erreur garde le message actuel. |
| S9-5 | Pendant l'envoi, griser « Re-générer » (sans message) ? (§4.1 d) | **Oui**, pour éviter une re-génération pendant qu'un fichier signé est en route. |
| S9-6 | Fichier PDF dont le navigateur ne renseigne pas le type (type vide) : refusé (comme la règle écrite) ou accepté si l'extension et le « %PDF- » sont bons ? | **Accepter le type vide** (les contrôles d'extension et de contenu suffisent à écarter un faux PDF), refuser tout type renseigné autre que `application/pdf`. À défaut, un vrai PDF sans type serait refusé à tort. Non vérifié sur les navigateurs de l'équipe. |
| S9-7 | Taille limite : « 10 Mo » = 10 × 1024 × 1024 octets (10 485 760), comme les 5 Mo du logo de clubs (`5 * 1024 * 1024`) ? | **Oui**, même convention que le logo ; un fichier de exactement 10 485 760 octets est accepté. |
| S9-8 | Conservation des fichiers signés orphelins (ancien fichier après remplacement, nouveau fichier après un rattachement raté) | Même suite que D-S8-5 / D-S8-7 : rien n'est supprimé par le widget ; Hanta vérifie dans DEV7 si Grist nettoie tout seul avant la recette. Durée de conservation des noms et signatures : à décider (§7). |

## 14. Voir le PDF dans une pop-up et le télécharger avec son vrai nom (ajouté le 2026-10-30 (E2))

Source des décisions : docs/backlog.md, « Évolution 2 (E2) », E2-1 à E2-4 (font foi). **La D-E1-22 est remplacée par E2-1** : « Voir » n'ouvre plus de nouvel onglet. Ce que cette section change dans les sections plus anciennes : §2 (paragraphe « Voir un PDF » et sa structure HTML : plus de nouvel onglet, plus de texte caché « s'ouvre dans un nouvel onglet », `aria-haspopup="dialog"` ajouté), §8 (« Ce qui manque au design system » : la ligne « nouvel onglet » ne s'applique plus). Tout le reste (jeton, verrou, alerte d'échec, focus après une génération) reste valable, sauf ce qui est dit ci-dessous.

Sources lues : docs/backlog.md (E2), §2, §3 (fenêtre), §8 de cette note, src/actions-dashboard/script.js (`conventionVoir`, `conventionVoirSignee`, `conventionVoirSigneeClic`, `conventionTelechargerPdf`, `conventionTelechargerPdfSigne`, `conventionNomFichier`, `conventionNomFichierSigne`, `openConvention`, `closeConvention`, `keepFocusInConvention`), index.html, style.css. **Pages du site du design system : non relues pour cette section** (pas d'accès web dans cette session) ; les structures ci-dessous sont celles déjà employées dans le dépôt, avec la source indiquée.

### 14.1 Parcours

Qui : un agent France Travail, dans la fiche d'une action dont la convention est à l'état « Générée » ou « Signée » (§2).

1. Il clique sur « Voir la convention » (ou « Voir la convention signée »). Le bouton passe à « Ouverture en cours… » le temps de récupérer le PDF (comme aujourd'hui).
2. Une pop-up s'ouvre dans le widget et affiche le PDF.
3. Dans la pop-up, il lit, puis soit clique sur « Télécharger » (le fichier est enregistré avec son vrai nom), soit sur « Fermer » (ou Échap). Le focus revient sur le bouton « Voir ».

Variante : sans ouvrir la pop-up, il clique sur « Télécharger » dans le bloc : le fichier est enregistré directement.

### 14.2 Ce qui change dans le bloc Convention (écran A)

Rangée `convention-actions` (classe existante, `display: flex; flex-wrap: wrap; gap: 12px`), ordre de gauche à droite :

| État | Rangée |
|---|---|
| Générée | « Voir la convention » · **« Télécharger »** · « Re-générer » · « Déposer la convention signée » |
| Signée | « Voir la convention signée » · **« Télécharger »** (puis, en dessous, le lien « Remplacer le fichier signé », inchangé) |

« Télécharger » est juste après « Voir » : les deux boutons qui agissent sur le même fichier restent côte à côte. Il est `btn btn-secondary` (comme « Voir » : le style « principal » `btn-primary` est réservé à l'action principale d'une fenêtre). Aucune icône (je n'ai pas vérifié qu'une icône de téléchargement existe dans la feuille ; ne pas en inventer).

**Point d'écart avec le backlog, tranché par Hanta le 2026-10-30 (Q-E2-1).** Le backlog demande « un lien `<a download href="blob:...">` » aux deux endroits. Dans le bloc, c'est impossible tel quel : l'adresse `blob:` n'existe qu'après la récupération du PDF avec le jeton, et la règle de la note (§2, « Jeton ») interdit de récupérer le PDF ou le jeton avant le clic (rien dans la page avant le clic ; pas de téléchargement à chaque ouverture de fiche). **Proposition : dans le bloc, « Télécharger » est un `<button>`** (même fabrication que « Voir »). Au clic, le code récupère le PDF (même fonction, même jeton, même délai), fabrique l'adresse `blob:`, crée un lien `<a download="[nom exact].pdf" href="blob:...">` **temporaire**, le déclenche par programme (`.click()`), puis le retire et libère l'adresse. Le résultat pour l'agent est le même qu'avec un vrai lien : le fichier porte son vrai nom. **Dans la pop-up, c'est un vrai lien `<a>`** (l'adresse est déjà en mémoire). Si Hanta refuse cette proposition, la seule autre voie est de récupérer le PDF dès l'affichage du bloc, ce que je déconseille (jeton demandé et fichier téléchargé à chaque fiche ouverte, même si l'agent ne le lit jamais).

Structure du bouton du bloc (même gabarit que « Voir », §2 ; classes `btn`, `btn-secondary`, `btn-content`, `sr-only` déjà employées) :

```html
<button class="btn btn-secondary" type="button" id="conventionTelecharger">
  <span class="btn-content">Télécharger<span class="sr-only"> le fichier PDF de la convention générée</span></span>
</button>
```

Pour l'état « Signée » : `id="conventionTelechargerSignee"` et texte caché « le fichier PDF de la convention signée ».

Comportement du bouton du bloc :
- Pendant la récupération : texte « Téléchargement en cours… » (texte caché retiré), `aria-disabled="true"` (jamais `disabled`, pour garder le focus), clics ignorés, comme « Voir » (§2). Le texte d'origine revient ensuite. Le focus ne bouge pas.
- Un verrou propre à ce bouton ; « Voir » et « Télécharger » restent utilisables l'un pendant l'autre.
- Réussite : le navigateur enregistre le fichier (ou affiche sa propre barre de téléchargement). **Aucun message du widget** (rien d'annonçable de façon fiable).
- Échec : alerte `alert alert-error` `role="alert"` dans la zone d'alerte du bloc (`conventionAlerte`, une seule alerte à la fois, effacée au clic suivant, comme celle de « Voir »), avec le message exact : « Le fichier n'a pas pu être téléchargé. Réessayez ou contactez l'équipe du tableau de bord. »
- Le nom du fichier est celui de la pop-up (voir 14.4).

Les deux « Voir » changent seulement de texte caché et d'attribut :
- Texte caché : « (s'ouvre dans une fenêtre) » à la place de « (s'ouvre dans un nouvel onglet) ».
- `aria-haspopup="dialog"` ajouté (comme « Générer la convention », §2 : une fenêtre s'ouvre maintenant dans le widget).
- « Ouverture en cours… », `aria-disabled`, verrou, alerte d'échec : inchangés.

### 14.3 La pop-up (écran D)

**Structure : celle de la fenêtre « Convention » (§8, « Fenêtre modale »)**, mêmes classes de la feuille (`modal-backdrop`, `modal`, `modal-dialog`, `modal-xl`, `modal-dialog-scrollable`, `modal-content`, `modal-header`, `modal-body`, `modal-footer`, `modal-title`), même technique : elle n'est insérée dans la page que pendant qu'elle est ouverte. Taille `modal-xl`, **pas plein écran**. Ce n'est pas un `<form>` (rien à saisir) : le contenu est un `<div class="modal-content">`.

Proposition de nouveaux éléments (à valider, aucun nom du design system repris) :
- **Un conteneur `<div id="conventionPdfModal"></div>`** dans index.html, à côté de `#conventionModal` (même rôle).
- **Sa règle d'affichage** : ajouter `#conventionPdfModal .modal` à la règle `#conventionModal .modal { display: block; overflow-y: auto; }` de style.css (la feuille masque `.modal`, voir §8).
- **Une classe `convention-pdf-cadre`** pour l'`<iframe>` : largeur 100 %, hauteur fixe, sans bordure. Hauteur : le PDF a besoin de place pour être lu, et la hauteur du widget dans Grist peut être faible ; je propose `height: calc(100vh - 280px)` avec `min-height: 420px` (les 280 px couvrent l'en-tête, le pied et le texte de repli de la pop-up), la fenêtre défilant (`modal-dialog-scrollable`) si le widget est plus petit. **Valeurs à ajuster par dev-interface à l'œil dans Grist DEV** : le design system n'a pas de variable pour une hauteur d'aperçu. Aucune couleur.

```html
<div class="modal-backdrop fade show"></div>
<div class="modal fade show" id="conventionPdfDialog" role="dialog" aria-modal="true"
     aria-labelledby="conventionPdfTitle" aria-describedby="conventionPdfNom" tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2 class="modal-title" id="conventionPdfTitle">Convention générée</h2>
          <p class="convention-soustitre" id="conventionPdfNom">Convention-Stade-Club-Exemple-2026.pdf</p>
        </div>
      </div>
      <div class="modal-body">
        <iframe class="convention-pdf-cadre" id="conventionPdfCadre"
                title="Aperçu de la convention générée" src="blob:…" referrerpolicy="no-referrer"></iframe>
        <p class="help-block" id="conventionPdfRepli">Le PDF ne s'affiche pas ?
          <a href="blob:…" target="_blank" rel="noopener">Ouvrir dans un nouvel onglet</a>,
          ou utilisez « Télécharger ».</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="conventionPdfFermer"><span class="btn-content">Fermer</span></button>
        <a class="btn btn-primary" id="conventionPdfTelecharger" href="blob:…" download="Convention-Stade-Club-Exemple-2026.pdf"><span class="btn-content">Télécharger<span class="sr-only"> le fichier PDF de la convention générée</span></span></a>
      </div>
    </div>
  </div>
</div>
```

Sources de chaque pièce : structure de fenêtre, `convention-soustitre`, `help-block` : déjà dans le dépôt (§8, `conventionModalHtml`). Lien habillé en bouton : voir 14.5. Pied « Fermer à gauche, action principale à droite » : celui de la fenêtre Convention (`conventionFermer` puis `conventionGenererFenetre`).

**Version « signée »** : mêmes éléments, avec `Convention signée` comme titre, `title="Aperçu de la convention signée"`, texte caché « de la convention signée », nom du fichier signé.

**`<iframe>` ou `<embed>` : je recommande `<iframe>`.** Raisons : (1) il porte un `title`, que les lecteurs d'écran annoncent pour nommer le cadre (`<embed>` n'a pas d'équivalent aussi bien pris en charge) ; (2) c'est le moyen le plus courant d'afficher un PDF `blob:` avec la visionneuse intégrée de Chrome, Edge, Firefox et Safari ; (3) la taille se règle en CSS comme n'importe quel bloc. Ni `<iframe>` ni `<embed>` n'offre de contenu de repli fiable quand le PDF ne s'affiche pas : c'est pourquoi le **texte de repli est écrit à côté du cadre, toujours visible** (voir plus bas), au lieu d'être caché dans le cadre. `<object>` aurait un repli intégré, mais il est moins sûr selon les navigateurs : non retenu, non testé. **Pas d'attribut `sandbox` sur l'`<iframe>`** : la visionneuse PDF de Chrome refuse de s'afficher dans un cadre « bac à sable » ; le contenu est un PDF dont le type est forcé à `application/pdf` par le code (`conventionTelechargerPdf`), pas une page web.

**Audit de sécurité du 2026-10-30 (point mineur, non bloquant).** L'absence de `sandbox` est **acceptable** : le Blob est créé avec un type forcé (`new Blob([...], {type: 'application/pdf'})`), ce qui empêche le navigateur d'interpréter le contenu comme du HTML, même si le fichier déposé était malveillant. Cette conclusion tient seulement si les cinq garde-fous suivants sont respectés dans le code :
1. **Garder le type `application/pdf` forcé** à la création du Blob, sans jamais reprendre le `Content-Type` renvoyé par Grist.
2. **Mettre l'adresse dans l'iframe uniquement par `element.src = adresse`**, jamais par concaténation de texte (pas de `innerHTML` ni de gabarit de texte qui contiendrait l'adresse dans la balise `<iframe>`).
3. **Ajouter `referrerpolicy="no-referrer"` sur l'iframe, sans attribut `allow`.**
4. **Libérer le Blob avec `URL.revokeObjectURL` à la FERMETURE de la pop-up** (pas seulement après le délai existant) **et vider le `src` de l'iframe à ce moment-là.**
5. **Le lien de repli « Ouvrir dans un nouvel onglet » reste un `<a href>` sur la même adresse `blob:`**, jamais une adresse qui contiendrait un jeton.

**Texte de repli (toujours visible sous le cadre).** « Le PDF ne s'affiche pas ? [Ouvrir dans un nouvel onglet], ou utilisez « Télécharger ». » Le lien « Ouvrir dans un nouvel onglet » est un `<a href="blob:…" target="_blank" rel="noopener">` vers la **même adresse déjà en mémoire** : c'est le secours « comme avant ». Pas d'erreur détectée automatiquement (un navigateur ne signale pas qu'un PDF n'a pas pu s'afficher dans un cadre) : le texte est donc là en permanence, discret (`help-block`). Il est lu par les lecteurs d'écran dans l'ordre normal, après le cadre.

**Récupération du PDF avant l'ouverture.** La pop-up s'ouvre **seulement quand le PDF est récupéré** (pas de fenêtre vide qui attend). En cas d'échec de la récupération, rien ne s'ouvre : l'alerte d'échec de « Voir » (« Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord. », inchangée) s'affiche dans le bloc.

### 14.4 Textes exacts

| Où | Texte |
|---|---|
| Titre de la pop-up (PDF généré) | Convention générée |
| Titre de la pop-up (PDF signé) | Convention signée |
| Sous-titre | le nom exact du fichier, par exemple `Convention-Stade-Club-Exemple-2026.pdf` (c'est le nom sous lequel « Télécharger » l'enregistre) |
| `title` de l'iframe | Aperçu de la convention générée / Aperçu de la convention signée |
| Texte de repli | Le PDF ne s'affiche pas ? [Ouvrir dans un nouvel onglet], ou utilisez « Télécharger ». |
| Pied de la pop-up | Fermer · Télécharger |
| Texte caché de « Télécharger » (bloc et pop-up) | « le fichier PDF de la convention générée » / « le fichier PDF de la convention signée » (placé après le mot visible : le nom accessible commence par le texte visible) |
| Texte caché de « Voir » | (s'ouvre dans une fenêtre) |
| « Télécharger » du bloc, pendant l'attente | Téléchargement en cours… |
| Échec de « Télécharger » du bloc | Le fichier n'a pas pu être téléchargé. Réessayez ou contactez l'équipe du tableau de bord. |
| Échec de « Voir » | inchangé : Le fichier n'a pas pu être ouvert. Réessayez ou contactez l'équipe du tableau de bord. |

**Nom du fichier (`download`)** : le même que celui utilisé à la génération et au dépôt, sans rien inventer :
- PDF généré : `conventionNomFichier(actionId, {annee: [Annee enregistrée dans Conventions]}, state)` → `Convention-[dispositif]-[club]-[année].pdf`.
- PDF signé : `conventionNomFichierSigne(actionId, state)` → `Convention-signee-[dispositif]-[club]-[année].pdf`.
Jamais de nom de personne (règle existante). Si le dispositif ou le club a été renommé depuis la génération, le nom suit les données actuelles : accepté (le nom stocké dans Grist ne sert pas). Le nom est écrit dans l'attribut `download` avec `escapeAttr`, et dans le sous-titre avec `escapeHtml`.

### 14.5 Un lien `<a>` habillé comme un bouton

Déjà fait dans le dépôt : src/clubs/script.js (ligne 1121), `<a class="btn btn-secondary btn-sm action-open" href="…"><span class="btn-content">Voir</span></a>`. On reprend donc **`<a class="btn btn-primary" href="blob:…" download="…"><span class="btn-content">…</span></a>`**, sans classe nouvelle. **À vérifier par dev-interface dans la feuille du CDN avant de coder** : que `.btn` rend bien un `<a>` comme un bouton (pas de soulignement, même hauteur) ; je n'ai pas lu la page « Bouton » pour ce cas. Différence de clavier à connaître : un `<a href>` s'active par **Entrée** seulement (pas Espace), contrairement à un `<button>`. C'est la bonne sémantique pour un téléchargement.

### 14.6 Accessibilité

- Pop-up : `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (titre), `aria-describedby` (nom du fichier), `tabindex="-1"` : comme la fenêtre Convention (§8, §7).
- **« Télécharger » de la pop-up est un lien** (`<a href download>`) : les lecteurs d'écran l'annoncent « lien », donc pas confondu avec un bouton d'action. Le texte caché dit ce qu'il enregistre. Dans le bloc, c'est un bouton (Q-E2-1) : annoncé « bouton » ; son texte caché dit « le fichier PDF… ».
- **Focus à l'ouverture : sur la fenêtre elle-même** (`#conventionPdfDialog`, `tabindex="-1"`). Le lecteur d'écran annonce « Convention générée, boîte de dialogue » puis le nom du fichier. Je déconseille de mettre le focus sur « Télécharger » (un Entrée distrait déclencherait un téléchargement alors que l'agent voulait lire) et **jamais sur l'`<iframe>`** (voir le piège plus bas). Choix confirmé par Hanta le 2026-10-30 (Q-E2-2).
- **Piège clavier** : quand le focus est à l'intérieur du PDF (cadre), les touches ne remontent pas au widget : Échap ne ferme plus et la boucle de Tab ne s'applique plus. Dans l'ordre de tabulation (cadre, lien de repli, Fermer, Télécharger), « Fermer » reste atteignable avec Tab. À noter dans la recette (R9), pas de contournement proposé.
- **Tab et Maj+Tab** tournent entre les éléments de la pop-up : cadre, lien de repli, Fermer, Télécharger (même mécanisme que `keepFocusInConvention`, en ajoutant `a[href]` et `iframe` aux éléments cherchés).
- **Échap** ferme la pop-up (sans enregistrer rien : il n'y a rien à enregistrer). Pas de fermeture au clic sur le fond (comme les autres fenêtres du widget).
- **Retour du focus** : sur le bouton qui a ouvert (« Voir la convention » ou « Voir la convention signée »). Si ce bouton a été refait entre-temps (le bloc est reconstruit après certaines actions), retrouver le bouton par son `id` (`conventionVoir` ou `conventionVoirSignee`).
- **Mode sombre, contrastes** : aucune couleur nouvelle ; tout vient des classes de la feuille.
- **Mobile** : `modal-xl` s'adapte à la largeur ; le cadre prend 100 % de la largeur ; les boutons du pied passent à la ligne si besoin. Beaucoup de navigateurs mobiles n'affichent pas un PDF dans un cadre : le texte de repli est alors le chemin normal.
- **Données personnelles** : le PDF signé porte des noms et des signatures manuscrites (CLAUDE.md). La pop-up les montre à l'agent qui a déjà le droit de lire la ligne `Conventions` (règles d'accès inchangées). Le nom de fichier n'en contient aucun.

### 14.7 Pour dev-backend et dev-interface : ce qui change, ce qui reste

**Reste identique :**
- `conventionTelechargerPdf(pieceJointe)` et `conventionTelechargerPdfSigne(actionId)` : même récupération avec le jeton d'écriture (`getAccessToken({readOnly: false})`, ne jamais remettre `readOnly: true`), `credentials: 'omit'`, en-tête `X-Requested-With`, délai `CONVENTION_TELECHARGEMENT_DELAI_MS`, Blob de type `application/pdf` (le type reste indispensable à l'affichage dans le cadre). Seul le commentaire « l'onglet affiche ainsi le PDF » est à mettre à jour.
- Le jeton reste dans des variables locales : jamais dans la console, un message, une adresse affichée. L'adresse `blob:` ne contient pas de jeton ; l'identifiant de la pièce jointe n'est écrit nulle part (ni dans le cadre, ni dans le `download`, ni dans un `id`). Rien n'est écrit dans la console.
- Le verrou « Ouverture en cours… » (`conventionOuvertureEnCours`, `conventionOuvertureSigneeEnCours`), `aria-disabled`, l'alerte d'échec commune (`conventionAlerteVoirEchec`), le focus après une génération réussie (sur « Voir la convention »).

**Change :**
- `conventionVoir(actionId)` et `conventionVoirSignee(actionId)` : on **supprime** `window.open('', '_blank')`, le contrôle « onglet bloqué », `onglet.opener = null`, `onglet.location.href`, `onglet.close()` et le `setTimeout(() => URL.revokeObjectURL(adresse), CONVENTION_VOIR_LIBERATION_MS)`. On garde : verrou, texte « Ouverture en cours… », récupération avec délai, `URL.createObjectURL(pdf)`. **À la place**, une fois l'adresse créée, on appelle une nouvelle fonction qui ouvre la pop-up avec l'adresse, le nom du fichier, le titre et le bouton déclencheur. `conventionVoirSignee` continue de renvoyer `true` (pop-up ouverte) ou `false` (échec, alerte affichée).
- **Libération de l'adresse `blob:`** : plus après 60 secondes, mais **à la fermeture de la pop-up** (`URL.revokeObjectURL`), et aussi si l'ouverture échoue. À la fermeture, le `src` de l'iframe est également vidé, en plus de la libération du Blob, conformément au garde-fou 4 de l'audit du 30/10 (§14.3). Une seule adresse en mémoire à la fois. `CONVENTION_VOIR_LIBERATION_MS` n'a plus d'usage pour « Voir » (le bouton « Télécharger » du bloc libère son adresse peu après le `.click()`, par exemple au bout de quelques secondes).
- `CONVENTION_TEXTE_VOIR_CACHE` devient « (s'ouvre dans une fenêtre) » ; ajouter `aria-haspopup="dialog"` aux deux boutons « Voir ».
- Nouveaux : le bouton « Télécharger » du bloc (état Générée et état Signée), sa fonction de clic, la pop-up (ouverture, fermeture, `keepFocus…` à l'image de `keepFocusInConvention`), un état `state.conventionPdfOpen` (même rôle que `state.conventionOpen`), l'ajout de `body.modal-open` comme les autres fenêtres, `requestResize()` à l'ouverture et à la fermeture.
- Tests existants qui supposent un nouvel onglet (`window.open`, `onglet.location`) sont à réécrire par le testeur : hors de cette note.

### 14.8 Ce qui manque au design system (signalé, non fabriqué)

- Pas de composant « aperçu de PDF » : on utilise un `<iframe>` nu dans une fenêtre modale, avec une seule classe du widget (`convention-pdf-cadre`) pour sa taille.
- Pas de composant « lien de téléchargement » : on utilise `<a class="btn …">` (précédent dans clubs).
- Aucune icône de téléchargement vérifiée : aucune icône.

### 14.9 Questions pour Hanta

Les trois questions ont été tranchées par Hanta le 2026-10-30 : **oui, confirmé** pour chacune.

| N° | Question | Décision |
|---|---|---|
| Q-E2-1 | Dans le bloc, « Télécharger » ne peut pas être un vrai lien (l'adresse n'existe qu'après la récupération avec le jeton, qu'on ne fait pas avant le clic). Accepter un bouton qui déclenche un lien temporaire ? | **Tranchée le 2026-10-30 : oui, confirmé** (14.2). Dans le bloc, « Télécharger » est un `<button>` qui crée le lien temporaire au clic. Dans la pop-up, c'est un vrai `<a>`. |
| Q-E2-2 | Focus à l'ouverture de la pop-up : sur la fenêtre (titre annoncé) ou sur « Télécharger » ? | **Tranchée le 2026-10-30 : oui, confirmé** (14.6). Le focus va sur la fenêtre elle-même, pas sur « Télécharger » : évite un téléchargement involontaire avec Entrée. |
| Q-E2-3 | Titres « Convention générée » et « Convention signée » pour la pop-up, au lieu de « Convention » (déjà le titre de la fenêtre de génération). OK ? | **Tranchée le 2026-10-30 : oui, confirmé.** Titres retenus : « Convention générée » et « Convention signée ». |

### 14.10 Risques à vérifier avant ou pendant le code

1. **Téléchargement depuis un cadre Grist** : CLAUDE.md dit que télécharger un fichier et ouvrir un onglet depuis le cadre de Grist fonctionnent, mais cela n'a pas été vérifié pour un lien `<a download>` vers une adresse `blob:`, ni pour un PDF `blob:` affiché dans un `<iframe>` imbriqué dans le cadre du widget. À essayer dans Grist DEV avec Chrome, Firefox et Safari avant de livrer. Si le cadre de Grist refuse, le repli « Ouvrir dans un nouvel onglet » reste le secours.
2. **Nom de fichier** : l'attribut `download` d'une adresse `blob:` est respecté par les navigateurs actuels (c'est la cause du bug de la D-E1-22). Contrôler le nom obtenu dans chaque navigateur.
3. **Hauteur de la pop-up** si le widget est placé dans un cadre bas dans la page Grist : voir la valeur proposée en 14.3.
4. **Fuite d'adresse `blob:`** si la pop-up n'est pas fermée proprement (changement de fiche, rechargement) : libérer aussi l'adresse dans tout chemin qui détruit la pop-up.
5. **Navigateurs mobiles** : l'aperçu PDF dans un cadre est souvent absent ; le texte de repli est prévu pour cela.
