# Cas de test de recette : Contacts (fiche club)

Brouillon rédigé par le recetteur (Claude), à relire et valider par Hanta. Ce sont des tests proposés, pas des tests passés : seul un humain décide du résultat (OK, KO, Bloqué, Non testé, Non applicable).

- Source : docs/ux/contacts-fiche-club.md (note UX validée le 21/10/2026).
- Version lisible du fichier docs/tests/cas-de-test-contacts.tsv (18 colonnes pour l'onglet Cas_de_test). Si les deux diffèrent, le fichier .tsv fait foi.
- 31 cas : CON-01 à CON-32, sans CON-27 (supprimé : aucun profil concerné aujourd'hui, couvert par les tests automatiques ; numéro non réutilisé). Données fictives uniquement (noms inventés, domaine exemple.fr).
- Prérequis commun aux cas joués par « Autre développeur » : le testeur doit avoir, dans la table Utilisateurs du document TEST, une ligne au profil FT National.
- Les tests qui créent, modifient ou suppriment une donnée (Rejouable_PROD = Non) se jouent seulement sur le document de test, jamais en PROD, et sur des contacts créés pour l'occasion.
- Tests de fumée sans écriture, jouables en PROD : CON-01, CON-06, CON-07, CON-17, CON-28. Tests de fumée avec écriture ou « Voir en tant que » (TEST seulement) : CON-05, CON-13, CON-18, CON-23.
- Redacteur : recetteur (Claude). Relu_par : vide.

## Synthèse

| ID | Fonction | Persona | Type | Criticité | Fumée | Automatisable | Joué par | Rejouable PROD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CON-01 | Affichage de la carte | FT National | Nominal | Bloquant | Oui | Non | Autre développeur | Oui |
| CON-02 | Affichage de la carte | FT National | Limite | Mineur | Non | Oui | Autre développeur | Oui |
| CON-03 | Affichage de la carte | FT National | Limite | Mineur | Non | Oui | Autre développeur | Oui |
| CON-04 | Affichage de la carte | FT National | Mobile et accessibilité | Mineur | Non | Non | Autre développeur | Oui |
| CON-05 | Ajouter | FT National | Nominal | Bloquant | Oui | Non | Autre développeur | Non |
| CON-06 | Ajouter | FT National | Nominal | Majeur | Oui | Oui | Autre développeur | Oui |
| CON-07 | Ajouter | FT National | Erreur | Bloquant | Oui | Oui | Autre développeur | Oui |
| CON-08 | Ajouter | FT National | Erreur | Majeur | Non | Oui | Autre développeur | Oui |
| CON-09 | Ajouter | FT National | Erreur | Majeur | Non | Oui | Autre développeur | Oui |
| CON-10 | Ajouter | FT National | Limite | Majeur | Non | Oui | Autre développeur | Non |
| CON-11 | Ajouter | FT National | Limite | Mineur | Non | Oui | Autre développeur | Non |
| CON-12 | Ajouter | FT National | Limite | Majeur | Non | Oui | Autre développeur | Non |
| CON-13 | Modifier | FT National | Nominal | Bloquant | Oui | Non | Autre développeur | Non |
| CON-14 | Modifier | FT National | Persistance | Majeur | Non | Non | Autre développeur | Oui |
| CON-15 | Ajouter (annulation) | FT National | Nominal | Majeur | Non | Oui | Autre développeur | Oui |
| CON-16 | Modifier (Échap) | FT National | Nominal | Majeur | Non | Oui | Autre développeur | Oui |
| CON-17 | Supprimer (confirmation) | FT National | Nominal | Bloquant | Oui | Oui | Autre développeur | Oui |
| CON-18 | Supprimer | FT National | Nominal | Bloquant | Oui | Non | Autre développeur | Non |
| CON-19 | Supprimer (annulation) | FT National | Persistance | Majeur | Non | Non | Autre développeur | Oui |
| CON-20 | Droits | FT Régional | Droits | Bloquant | Non | Non | Développeur du projet | Non |
| CON-21 | Droits | FT Régional | Droits | Majeur | Non | Non | Développeur du projet | Non |
| CON-22 | Droits | FT Départemental | Droits | Majeur | Non | Non | Développeur du projet | Non |
| CON-23 | Droits | FT Départemental | Droits | Bloquant | Oui | Non | Développeur du projet | Non |
| CON-24 | Droits | FT Départemental | Droits | Majeur | Non | Non | Développeur du projet | Non |
| CON-25 | Droits | FT National | Droits | Bloquant | Non | Non | Développeur du projet | Non |
| CON-26 | Droits | ANS | Droits | Majeur | Non | Non | Développeur du projet | Non |
| CON-28 | Affichage mobile | FT National | Mobile et accessibilité | Majeur | Oui | Non | Autre développeur | Oui |
| CON-29 | Clavier | FT National | Mobile et accessibilité | Majeur | Non | Non | Autre développeur | Oui |
| CON-30 | Info-bulles | FT National | Mobile et accessibilité | Mineur | Non | Non | Autre développeur | Oui |
| CON-31 | Modifier (contact disparu) | FT National | Erreur | Mineur | Non | Non | Développeur du projet | Non |
| CON-32 | Ajouter (réseau coupé) | FT National | Erreur | Mineur | Non | Non | Développeur du projet | Non |

Note : la synthèse a été recopiée à la main depuis le .tsv. En cas d'écart, le .tsv fait foi.

Modules voisins (à rejouer après une correction) : tous les cas ont l'étiquette « Clubs (liste et fiche) ». Les cas de droits et d'écriture ont en plus « Règles d'accès Contacts » (CON-21 : « Règles d'accès Structures »). CON-01, CON-04 : aussi « Actions du club ».

Jeu de données fictif commun : club « Club Exemple Sport » ; contact Nom « Test-Durand », Prénom « Camille », E-mail camille.durand@exemple.fr, Téléphone 01 00 00 00 00, Fonction « Responsable administrative » ; second contact « Test-Martin », k.martin@exemple.fr, sans Fonction.

## A. Affichage de la carte Contacts

### CON-01 — Carte avec fonction et boutons (Nominal, Bloquant, Fumée, rejouable PROD)
- Étant donné : fiche d'un club qui a au moins un contact avec une Fonction renseignée.
- Quand : 1) ouvrir la liste des clubs ; 2) cliquer sur Voir pour le club ; 3) regarder la carte Contacts.
- Alors : le bouton « + Ajouter un contact » est en haut. Chaque contact montre son nom, puis sa Fonction sur sa propre ligne en texte secondaire, puis l'e-mail (lien) et le téléphone. Chaque ligne a deux boutons icône : crayon (Modifier) et corbeille (Supprimer). Aucun texte « Modifier » ou « Supprimer » n'est écrit dans la carte.
- Données : Club Exemple Sport ; contact Test-Durand.

### CON-02 — Fonction vide (Limite, Mineur)
- Étant donné : un contact dont la Fonction est vide.
- Quand : ouvrir la fiche du club et regarder la ligne de ce contact.
- Alors : aucune ligne de Fonction : pas de tiret, pas de ligne vide.
- Données : Test-Martin, k.martin@exemple.fr.

### CON-03 — Liste vide (Limite, Mineur)
- Étant donné : un club sans aucun contact.
- Quand : ouvrir sa fiche et regarder la carte Contacts.
- Alors : « Aucun contact enregistré pour ce club. » est affiché et le bouton « + Ajouter un contact » reste visible.

### CON-04 — Largeur des cartes (Mobile et accessibilité, Mineur)
- Étant donné : une fiche de club ouverte sur écran large, avec plusieurs contacts et actions.
- Quand : 1) mettre le widget à environ 1200 px ; 2) comparer les cartes Contacts et Actions ; 3) réduire sous 900 px.
- Alors : à grande largeur, deux moitiés égales côte à côte. Sous 900 px, elles s'empilent (Contacts puis Actions). Les lignes de la carte Actions restent lisibles.

## B. Ajouter un contact

### CON-05 — Ajout réussi (Nominal, Bloquant, Fumée, écriture)
- Étant donné : fiche du club ouverte, profil avec droit d'écriture sur Contacts.
- Quand : 1) cliquer sur « + Ajouter un contact » ; 2) saisir tous les champs ; 3) cliquer sur Valider.
- Alors : la fenêtre se ferme, la fiche reste ouverte sur le même club, le nouveau contact apparaît avec ses cinq informations, aucun message d'erreur.
- Données : Nom Test-Durand ; Prénom Camille ; E-mail camille.durand@exemple.fr ; Téléphone 01 00 00 00 00 ; Fonction Responsable administrative.
- Remarque : crée une donnée, à supprimer ensuite (CON-18). TEST seulement.

### CON-06 — Ouverture de la fenêtre (Nominal, Majeur, Fumée, rejouable PROD)
- Étant donné : fiche du club ouverte.
- Quand : 1) cliquer sur « + Ajouter un contact » ; 2) regarder la fenêtre ; 3) cliquer sur Annuler.
- Alors : la fenêtre « Ajout d'un contact » s'ouvre, le curseur est dans Nom. On voit « * champ obligatoire », « Club : Club Exemple Sport », la mention « Saisissez des coordonnées professionnelles (adresse e-mail et téléphone de la structure), pas des coordonnées personnelles. » et les champs Nom *, Prénom, E-mail *, Téléphone, Fonction. Annuler referme la fenêtre.

### CON-07 — Nom manquant (Erreur, Bloquant, Fumée, rejouable PROD)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : laisser Nom vide, saisir un e-mail valide, cliquer sur Valider.
- Alors : la fenêtre reste ouverte, Nom est en erreur avec « Saisissez le nom du contact. », le curseur va dans Nom, aucun contact ajouté.
- Données : E-mail camille.durand@exemple.fr.

### CON-08 — E-mail manquant (Erreur, Majeur)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : saisir un Nom, laisser E-mail vide, cliquer sur Valider.
- Alors : « Saisissez l'adresse e-mail du contact. » sous E-mail, curseur dans E-mail, aucun contact ajouté.
- Données : Nom Test-Durand.

### CON-09 — E-mail mal formé (Erreur, Majeur)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : saisir un Nom, saisir un e-mail sans arobase, cliquer sur Valider.
- Alors : « Saisissez une adresse e-mail valide, par exemple nom@exemple.fr. » sous E-mail, aucun contact ajouté.
- Données : Nom Test-Durand ; E-mail camille.durand.

### CON-10 — Espaces (Limite, Majeur, écriture)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : 1) Nom = trois espaces, e-mail valide, Valider ; 2) puis Nom = « Test-Espaces » entouré d'espaces, Valider.
- Alors : étape 1, Nom compte comme vide (« Saisissez le nom du contact. »). Étape 2, contact créé avec le nom « Test-Espaces » sans espaces autour.
- Remarque : crée une donnée à l'étape 2. Nom différent de Test-Durand pour ne pas créer de doublon qui ferait échouer CON-14.

### CON-11 — E-mail sans point (Limite, Mineur, écriture)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : Nom Test-Limite, e-mail limite@exemple, Valider.
- Alors : accepté (règle actuelle : une arobase, rien avant ni après, pas d'espace ; point non exigé, décision de Hanta du 21/10/2026).
- Remarque : crée une donnée, à supprimer.

### CON-12 — Texte qui ressemble à du HTML (Limite, Majeur, écriture)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : Nom = <b>Test</b>, e-mail html@exemple.fr, Valider, regarder la ligne créée.
- Alors : le nom s'affiche tel quel, avec les signes < et >, sans gras ni autre effet.
- Remarque : crée une donnée, à supprimer. Sécurité (échappement).

### CON-15 — Annulation par le bouton (Nominal, Majeur, rejouable PROD)
- Étant donné : fenêtre d'ajout ouverte.
- Quand : saisir Nom et e-mail valides, cliquer sur Annuler, rouvrir « Ajouter un contact ».
- Alors : fenêtre fermée, aucun contact ajouté, fenêtre rouverte vide.
- Données : Test-Annule, annule@exemple.fr.

### CON-32 — Réseau coupé (Erreur, Mineur)
- Étant donné : fenêtre d'ajout remplie avec des valeurs valides, réseau coupé dans Chrome (outils de développement, onglet Network, Offline).
- Quand : 1) dans Chrome, ouvrir les outils de développement, onglet Network, choisir Offline ; 2) cliquer sur Valider ; 3) remettre le réseau en ligne.
- Alors : la fenêtre reste ouverte avec ses valeurs et l'alerte « L'enregistrement n'a pas abouti. Vérifiez votre connexion puis réessayez. » Aucun détail technique ni donnée saisie dans le message.

## C. Modifier un contact

### CON-13 — Modification réussie (Nominal, Bloquant, Fumée, écriture)
- Étant donné : fiche du club avec le contact Test-Durand.
- Quand : 1) cliquer sur l'icône crayon ; 2) vérifier les champs pré-remplis ; 3) changer la Fonction ; 4) Valider.
- Alors : « Modification d'un contact » s'ouvre avec cinq champs pré-remplis, curseur dans Nom, club en texte non modifiable. Après Valider : fenêtre fermée, la ligne affiche « Directrice », le curseur revient sur le crayon du même contact.
- Données : nouvelle Fonction « Directrice ».

### CON-14 — Modification conservée (Persistance, Majeur)
- Étant donné : CON-13 réalisé.
- Quand : recharger la page du document, rouvrir la fiche du club.
- Alors : la Fonction « Directrice » est là. Un seul contact Test-Durand existe (pas de doublon).

### CON-16 — Annulation par Échap (Nominal, Majeur, rejouable PROD)
- Étant donné : fiche du club avec un contact.
- Quand : cliquer sur le crayon, changer le Nom sans valider, appuyer sur Échap.
- Alors : fenêtre fermée sans enregistrer, nom d'origine toujours affiché, curseur sur le crayon qui avait ouvert la fenêtre.

### CON-31 — Contact supprimé entre-temps (Erreur, Mineur)
- Étant donné : deux sessions sur le même club (A et B), un contact de test.
- Quand : A ouvre la modification ; B supprime ce contact ; A valide.
- Alors : la fenêtre de A reste ouverte avec « Ce contact n'existe plus. La liste va être actualisée. », puis la liste se met à jour sans ce contact.

## D. Supprimer un contact

### CON-17 — Fenêtre de confirmation (Nominal, Bloquant, Fumée, rejouable PROD)
- Étant donné : fiche du club avec le contact Test-Durand.
- Quand : cliquer sur la corbeille, lire la fenêtre, cliquer sur Annuler (ou Échap).
- Alors : « Suppression d'un contact » : « Êtes-vous sûr de vouloir supprimer le contact Camille Test-Durand ? Cette suppression est définitive : le contact ne pourra pas être récupéré. » Curseur sur Annuler, bouton rouge « Supprimer ». Après Annuler, le contact est toujours là.
- Remarque : ordre constaté par Hanta : prénom puis nom.

### CON-18 — Suppression confirmée (Nominal, Bloquant, Fumée, écriture)
- Étant donné : un contact de test créé pour l'occasion (jamais un vrai).
- Quand : cliquer sur la corbeille, puis sur le bouton rouge « Supprimer ».
- Alors : fenêtre fermée, contact disparu, curseur sur « + Ajouter un contact ». Après rechargement, il n'est plus là (suppression réelle).

### CON-19 — Annulation sans effet (Persistance, Majeur, rejouable PROD)
- Étant donné : club avec au moins deux contacts.
- Quand : cliquer sur une corbeille, Annuler, recharger la page, rouvrir la fiche.
- Alors : même nombre de contacts qu'avant, rien de supprimé ni modifié.

## E. Droits (règles d'accès de Grist), joués par le développeur du projet

### CON-20 — FT Régional dans sa DR (Droits, Bloquant)
- Étant donné : « Voir en tant que » FT Régional, club de sa DR.
- Quand : ajouter, modifier puis supprimer un contact de test.
- Alors : les trois opérations réussissent, sans message de droits. Vérifié par Hanta dans DEV7 le 21/10/2026 : à rejouer sur TEST.
- Données : Test-Regional, regional@exemple.fr.

### CON-21 — FT Régional : clubs des autres DR invisibles (Droits, Majeur)
- Étant donné : « Voir en tant que » FT Régional ; le document contient des clubs d'une autre DR.
- Quand : 1) se mettre en « Voir en tant que » FT Régional ; 2) ouvrir la liste des clubs ; 3) filtrer sur une autre région.
- Alors : aucun club d'une autre DR n'apparaît, donc aucune fiche ni aucun contact de ces clubs n'est accessible.
- Remarque : un FT Régional ne voit pas les clubs des autres DR (règle de Structures).

### CON-22 — FT Départemental dans sa DD (Droits, Majeur)
- Étant donné : « Voir en tant que » FT Départemental, club de sa DD.
- Quand : ajouter, modifier puis supprimer un contact de test.
- Alors : les trois opérations réussissent, sans message de droits.

### CON-23 — FT Départemental hors de son département : ajout (Droits, Bloquant, Fumée)
- Étant donné : « Voir en tant que » FT Départemental, club d'un autre département.
- Quand : cliquer sur « + Ajouter un contact », saisir Nom et e-mail valides, Valider.
- Alors : la fenêtre reste ouverte avec ses valeurs, l'alerte « Vous n'avez pas les droits pour ajouter ou modifier des contacts de ce club. Vos données n'ont pas été enregistrées. Rapprochez-vous de l'équipe qui gère le document. » s'affiche, aucun contact n'apparaît, même après rechargement.
- Données : Test-Refus, refus@exemple.fr. Constaté par Hanta dans DEV7 le 21/10/2026 : à rejouer sur TEST.

### CON-24 — FT Départemental hors de son département : suppression (Droits, Majeur)
- Étant donné : même profil et même club que CON-23, un contact visible.
- Quand : cliquer sur la corbeille, puis sur « Supprimer ».
- Alors : la fenêtre reste ouverte avec « Vous n'avez pas les droits pour supprimer ce contact. Il n'a pas été supprimé. » Le contact est toujours là après rechargement.

### CON-25 — FT National partout (Droits, Bloquant)
- Étant donné : « Voir en tant que » FT National, clubs de deux régions.
- Quand : ajouter un contact de test sur un club de la région A, puis de la région B, puis supprimer les deux.
- Alors : toutes les opérations réussissent, sans message de droits.
- Données : Test-NatA, Test-NatB (@exemple.fr).

### CON-26 — ANS : aucun club visible (Droits, Majeur)
- Étant donné : « Voir en tant que » ANS.
- Quand : 1) se mettre en « Voir en tant que » ANS ; 2) ouvrir la liste des clubs.
- Alors : aucun club n'apparaît, donc aucun contact n'est accessible ni modifiable.
- Remarque : l'ANS ne voit aucun club.

## F. Mobile et accessibilité

### CON-28 — Carte et fenêtre à 400 px (Mobile et accessibilité, Majeur, Fumée, rejouable PROD)
- Étant donné : fiche avec au moins un contact, widget à environ 400 px puis 320 px.
- Quand : regarder la carte, ouvrir la fenêtre d'ajout, Annuler.
- Alors : pas de défilement horizontal. Nom, fonction, e-mail, téléphone sur plusieurs lignes, les deux icônes sur une dernière ligne, côte à côte, espacées, si elles ne tiennent pas sur une ligne, elles passent à la ligne, sans être coupées (règle de la note, §6.1). La fenêtre d'ajout n'est pas rognée.

### CON-29 — Clavier seul (Mobile et accessibilité, Majeur, rejouable PROD)
- Étant donné : fiche ouverte, clavier seul.
- Quand : atteindre « + Ajouter un contact » (Tab, Entrée) ; Tab plusieurs fois dans la fenêtre ; Entrée dans un champ ; Échap ; puis avec VoiceOver (Cmd + F5), écouter le nom des icônes crayon et corbeille.
- Alors : le curseur reste dans la fenêtre. Entrée valide le formulaire (erreurs, champs vides). Focus visible. Échap ferme et le curseur revient sur « + Ajouter un contact ». Les icônes ont pour nom, lu par VoiceOver, « Modifier le contact … » et « Supprimer le contact … ».
- Remarque : lecteur d'écran : VoiceOver, activé par Cmd + F5.

### CON-30 — Info-bulles (Mobile et accessibilité, Mineur, rejouable PROD)
- Étant donné : un contact affiché.
- Quand : survoler puis atteindre au clavier le crayon et la corbeille.
- Alors : info-bulles « Modifier » puis « Supprimer ». La corbeille n'est pas rouge.

## À CONFIRMER

1. Colonne Automatisable : les tests existants (test/clubs-contacts-ecran.test.js, test/clubs-contacts.test.js) n'ont pas été relus pour cette tâche : à croiser plus tard avec le développeur.
2. Un contact de test supprimé n'est pas récupérable : prévoir la création de contacts de test avant la campagne.
3. Protocole de test et guide du testeur de l'équipe : absents de docs/tests/ lors de la rédaction. Les définitions Bloquant / Majeur / Mineur reprennent celles du carnet du tableau de bord (provisoires).
