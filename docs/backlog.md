# Backlog — Widgets Grist — Partenariat simplifié

| Priorité | Tâche | Agent | Statut |
| --- | --- | --- | --- |
| Haute | clubs : gérer les contacts dans la fiche du club (ajouter, modifier, supprimer avec confirmation), chacun sur son périmètre ; règle d'accès à créer sur Contacts | auditeur-securite, designer-ux, dev-backend, dev-interface, testeur | Fait (en production le 2026-10-23) |
| Haute | Convention de partenariat : voir le plan ci-dessous | voir le plan | S7, S8, S9 codés et testés ; reste S10 (clôture) et les recettes R1 à R6 à jouer sur TEST |
| Moyenne | clubs : filtres Région → Département dépendants, sur le modèle des filtres DR → DD → agence du tableau de bord (remarqué le 21/10/2026) | relecteur, testeur, dev-interface | À faire |
| Moyenne | tableau de bord : requestTableColumns (choix de Statut, Public, Format) demande un jeton en lecture seule ; pour un propriétaire, Grist refuse probablement et le widget se rabat sur la liste de secours (constat du 2026-10-24, fiche C41) | relecteur, puis dev-backend, testeur | À faire |
| Moyenne | tableau de bord : mode sombre ; le tableau de bord est en color-scheme: light, alors que tout widget doit fonctionner en mode sombre (règle de Hanta, à écrire dans CLAUDE.md et dans la squad de base) | designer-ux, dev-interface, testeur | À faire |
| Moyenne | convention : vrai gras pour le PDF (police Roboto Bold), au lieu de la graisse « medium » fournie avec pdfmake ; nécessite de trouver une source sûre pour le fichier de police (comme pdfmake en S0), auditeur-securite d'abord | auditeur-securite, puis dev-backend | En attente, mise en veille le 2026-10-26 (lisibilité déjà bien améliorée par l'interligne et les espaces, fiche C47) |
| Moyenne | convention : chargerPdfmake, si le délai de 20 s est dépassé une première fois, la promesse reste en attente et aucun nouveau script n'est ajouté ; chaque nouvel essai échoue de nouveau au bout de 20 s jusqu'au rechargement de la page (signalé fiche C43) | dev-backend, testeur | À faire |
| Basse | tableau de bord : espacement du bloc Convention (-16px écrit en dur, espace en trop au-dessus du texte, zone de message vide toujours présente) | dev-interface | À faire |
| Basse | clubs : corriger les commentaires de src/clubs/ qui parlent encore de fiche-club | dev-interface | À faire |
| Basse | squad : les agents lancent très souvent des commandes de lecture (grep, ls, git status, node --check, parfois node --test) malgré la consigne « aucune commande lancée » ; décider de les autoriser explicitement en lecture seule dans leurs fichiers, ou de les interdire plus fermement | Hanta | À décider (répété de nombreuses fois depuis le 24/10, jamais tranché) |
| Basse | docs/tests/README.md : apparaît en « Untracked files » dans git status depuis la recette R2 (24/10), jamais commité ni traité | Hanta | À regarder |

---

# Convention de partenariat (PDF + dépôt du fichier signé) — plan du chef-de-projet

Branche de travail actuelle : `feature/convention`. Note de référence : `docs/ux/convention.md` (fait foi, mise à jour en continu depuis le 2026-10-22 jusqu'au 2026-10-26, dernière section §13 pour S9).

Règles du plan :

- Une tâche = un agent = un objectif, vérifiable en moins de 15 minutes.
- Le recetteur passe à la fin de chaque fonction terminée (lignes R1, R2, R4, R5, R6, R7), pas seulement à la fin.
- `npm run build`, `npm test` et `git status` sont lancés par Hanta. Un test est « passé » seulement quand Hanta donne le résultat affiché.
- Après chaque build, `git status` ne doit montrer que les fichiers générés et sources concernés.
- Tout le code de la convention va dans `src/actions-dashboard/script.js`, `index.html` et `style.css`.
- Les noms de tables et de colonnes marqués « proposé » sont à créer ; les autres existent.
- Le designer-ux passe avant dev-interface pour toute tâche d'écran, même si la note semble déjà à jour : des décisions récentes peuvent ne pas y être reflétées (règle rappelée après un oubli le 2026-10-25).
- Pour tout ce qui passe par un jeton du widget (génération, Voir, dépôt du signé), « Voir en tant que » ne suffit pas pour la recette : il faut un vrai compte non propriétaire (fiche C41).

## Réponses intégrées (décisions de Hanta)

**Colonnes existantes dans Grist DEV, TEST (et à créer en PROD avant la fusion) :**

- `Contacts.Fonction`.
- `Agences.Adresse`, `Complement_adresse`, `Code_postal`, `Ville`, `Siret`.
- `Structures.Siege` (Oui/Non), `Structures.Adresse` (Text), `Structures.Ville` (formule, créée le 2026-10-22).
- `Actions.DR` et `Actions.DD`, colonnes formules.
- `Conventions` (table créée) : `Action`, `Modele`, `Annee`, `Signataire_club`, `Representant_agence`, `Fonction_representant`, `PDF_genere`, `Date_generation`, `PDF_signe`, `Date_depot`, `DR`, `DD`.
- `Modeles_convention` (table créée) : `Code`, `Titre`, `Dispositif`, `Avec_annee`, `Contenu`, `Version`, `Actif`, `Logo`, `Logo_partenaire` (ces deux dernières ajoutées le 2026-10-25).

**Règles d'accès actuelles d'Actions :**

- FT Régional : `rec.DR == user.Utilisateur.DR`.
- FT Départemental : `rec.DD == user.Utilisateur.DT`.

**Qui fait quoi :**

- FT National, FT Régional et FT Départemental génèrent, re-génèrent et déposent les conventions, chacun sur son périmètre, avec des comptes réels (pas « Voir en tant que »).
- ANS : aucun accès aux conventions ni aux modèles. L'ANS ne voit pas le tableau de bord. Tout profil refusé par Grist (ANS compris) voit « Droits insuffisants ».

## Décisions prises du 2026-10-22 au 2026-10-26

- Q-H : Échap et « Fermer » ferment directement la fenêtre, sans confirmation (option A).
- « Enregistrer les informations » est un brouillon : garde ce qui est saisi même incomplet ; seule l'année est contrôlée à l'enregistrement.
- D-3 : les six messages de blocage de « Générer » validés, affichés tous à la fois.
- D-4 à D-6 : année préremplie avec l'année en cours ; message « Renseignez le dispositif… » gardé dans le code (jamais affiché en pratique) ; message d'erreur de l'année qui disparaît au clic suivant.
- D-S7-1 à D-S7-7 : une seule opération pour PDF_genere + Date_generation ; Échap/Fermer ignorés pendant la génération ; nom du fichier `Convention-[dispositif]-[club]-[année].pdf` ; informations enregistrées avant la fabrication du PDF ; attente en texte seul ; focus sur « Voir la convention » après réussite ; champs non modifiables pendant la génération.
- Cases du modèle (2026-10-23, complétées 2026-10-26) : 11 cases officielles dans la note (§3), dont `[SIRET de l'agence]` (Agences.Siret, ajoutée le 26/10) ; apostrophe droite et courbe acceptées ; case connue mais vide → pointillés (28 points) sans bloquer ; case inconnue → bloque, avec son nom ; année invalide (pas 4 chiffres) → omise du nom de fichier, jamais recopiée (correction du 26/10).
- Mise en page du PDF (§11, 2026-10-25) : A4, marges 2,5 cm, Roboto 11 pt justifié, interligne 1,2 (aéré, décision du 26/10 après comparaison avec le Word officiel), tailles et espaces de chaque élément du format des modèles, numéro de page seul en bas à droite (absent de la 1ère page), règles de coupure (bloc signature insécable, titre jamais seul en bas de page), nouveau marqueur `{signatures:ft-gauche}` (France Travail à gauche, pour Stade et Match des métiers).
- Logos (D-MEP-3, §11.2) : colonnes `Logo` et `Logo_partenaire` dans Modeles_convention, lues à la génération ; première page seulement, Logo à gauche et Logo_partenaire à droite ; logo manquant ou illisible → génération sans bloquer, avec un message d'information distinct de la réussite.
- D-S8-1 à D-S8-7 (S8, re-génération) : bouton du pied reste « Générer la convention » ; phrase de remplacement en tête de fenêtre à la re-génération ; message d'échec de re-génération se termine par « L'ancienne convention reste disponible. » ; modèle ACTIF toujours enregistré dans Modele (pas celui d'origine) ; ancien PDF jamais supprimé (orphelin accepté) ; incohérence acceptée après un échec ; Grist ne nettoie jamais les fichiers orphelins (vérifié le 26/10 : 34 → 35 pièces jointes après une re-génération).
- S9-1 à S9-8 (dépôt du fichier signé) : une seule opération PATCH pour PDF_signe + Date_depot ; annonce par région role="status" ; focus sur « Voir la convention signée » après premier dépôt, reste sur « Remplacer » après un remplacement ; message distinct si droits refusés ; « Re-générer » grisé pendant l'envoi (mais pas « Voir ») ; PDF sans type MIME accepté si extension et contenu sont bons ; 10 Mo = 10 × 1024 × 1024 octets ; fichier signé jamais supprimé par le widget.
- Nom du fichier signé (2026-10-26) : `Convention-signee-[dispositif]-[club]-[année].pdf`, mêmes règles de nettoyage que le PDF généré.
- Bug majeur corrigé (fiche C51, 2026-10-26) : aucun appel réseau de la génération n'avait de délai maximum, sauf pdfmake ; une coupure réseau bloquait la fenêtre indéfiniment. Corrigé : délai maximum (conventionAvecDelai) sur tous les appels (jeton, logos, envoi, PATCH, relecture, enregistrement). Même correction nécessaire et faite pour le dépôt du fichier signé (S9).

## Structure Grist (créée dans DEV7 et dans TEST, à créer dans PROD avant la fusion)

**Table `Modeles_convention`** : `Code`, `Titre`, `Dispositif` (lien), `Avec_annee`, `Contenu`, `Version`, `Actif`, `Logo` (pièce jointe), `Logo_partenaire` (pièce jointe, facultatif).

**Table `Conventions`** : `Action` (lien), `Modele` (lien), `Annee`, `Signataire_club` (lien), `Representant_agence`, `Fonction_representant`, `PDF_genere` (pièce jointe), `Date_generation`, `PDF_signe` (pièce jointe), `Date_depot`, `DR`/`DD` (formules).

**État du bloc, déduit des données :**

- `PDF_signe` rempli : Signée.
- Sinon `PDF_genere` rempli : Générée.
- Sinon, si le dispositif a un modèle actif : À générer.
- Sinon : Dispositif sans modèle.
- Tables de convention refusées par Grist : Droits insuffisants.

**Règles d'accès posées (DEV7, TEST ; à reposer en PROD) :**

| Table | Propriétaires | FT National | FT Régional | FT Départemental | ANS | Anonyme |
| --- | --- | --- | --- | --- | --- | --- |
| `Conventions` | tout | lire, créer, modifier | `rec.DR == user.Utilisateur.DR` | `rec.DD == user.Utilisateur.DT` | aucun | aucun |
| `Modeles_convention` | tout | lire | lire | lire | aucun | aucun |

## Format du texte des modèles (colonne `Contenu`)

Voir §3 et §11 de la note pour la liste complète (titres `#`/`##`/`###`, paragraphe, gras `**...**`, italique `*...*`, souligné `<u>`, exposant `<sup>`, listes, citation `>`, note `[^1]`, case `[Nom de la case]`, saut de page `{saut-de-page}`, signatures `{signatures}` / `{signatures:lieu-date}` / `{signatures:ft-gauche}`).

**Les 11 cases officielles** : `[Année]`, `[Nom du club]`, `[SIRET du club]`, `[Siège du club]`, `[Signataire du club]`, `[Fonction du signataire]`, `[Nom de l'agence]`, `[Adresse de l'agence]`, `[Représentant de l'agence]`, `[Fonction du représentant]`, `[SIRET de l'agence]`.

Les trois modèles officiels (Du stade vers l'emploi, Match des métiers, Parcours de remobilisation) sont saisis dans DEV7 et dans TEST, jamais dans le dépôt (public). Stade utilise `[SIRET de l'agence]` sans adresse ; Match et Remobilisation utilisent `[Adresse de l'agence]` sans SIRET, fidèles aux Word officiels.

## Tâches

### S0 à S3 : faites (voir fiches C01 à C34 pour le détail, non reproduites ici)

### S4. Fonction A : afficher le bloc « Convention »

**Fait entièrement (fiches C24 à C26).** R1 jouée en local (campagne C01, DEV7, version 7e951b4) : 15 cas OK. **À rejouer sur TEST par le collègue** (campagne C03, pas encore faite).

### S5. Fonction B : fenêtre « Convention » et informations enregistrées

**Fait entièrement (fiches C27 à C34).** R2 : 28 cas écrits (CONV-16 à 43), campagne C02 (DEV7, version cb52eb6) : 13 cas vérifiés pendant les contrôles à l'écran. **À rejouer sur TEST par le collègue** (campagne C03).

S6 supprimée le 2026-10-22 : pas d'ajout de contact dans la convention.

### S7. Fonction D : générer le PDF et le voir

**Fait entièrement**, en plusieurs vagues (fiches C35 à C49) :
- 7.1 à 7.3 : chargement de pdfmake, génération, bouton, écran, bug du rattachement REST pour un non-propriétaire (corrigé, fiche C39).
- 7.4/7.5 : « Voir la convention », bug du jeton du propriétaire (corrigé, fiche C41).
- 7.7a : mise en page complète selon le Word officiel, bug de `pageBreakBefore` pour pdfmake 0.3 (corrigé, fiche C44).
- 7.7b : logos, placement selon le Word (fiche C46).
- 7.7c : message si un logo manque (fiche C48).
- Case `[SIRET de l'agence]` ajoutée (fiche C49).
- Lisibilité : interligne 1,2, espaces (fiche C47).

**Vérifié dans DEV7 avec un vrai compte FT Régional non propriétaire** : génération et ouverture du PDF réussies.

**R4 : 36 cas écrits (CONV-44 à 79), campagne C06... (en fait C04).** Pas encore jouée (sauf vérifications manuelles ponctuelles pendant le développement). Cas M1 à M7 à jouer dans DEV7 (jamais sur TEST, pour ne pas gêner la recette du collègue).

**7.6 (essai sur papier) : fait à l'écran seulement (pas d'imprimante disponible).** Hanta juge le rendu bon avec les trois vrais modèles. À confirmer sur un vrai papier dès que possible (longueur des pointillés notamment).

### S8. Fonction E : re-générer

**Fait entièrement (fiches C50, C51).** Bug majeur trouvé et corrigé : coupure réseau bloquait la fenêtre indéfiniment (voir plus haut, décisions). D-S8-7 vérifiée (Grist ne nettoie jamais les orphelins).

**R5 : 26 cas écrits (CONV-80 à 105), campagne C05.** Pas encore jouée. Cas de changement de modèle actif (CONV-86, 87) à jouer dans DEV7.

### S9. Fonction F : déposer et remplacer le fichier signé

**Fait entièrement (fiches C52 à C54).** Nom du fichier signé renommé, « Voir la convention signée » ajouté, correction de l'année invalide dans le nom du fichier, délais maximum sur tous les appels réseau du dépôt (même leçon que C51, appliquée directement cette fois).

**R6 : 33 cas écrits (CONV-106 à 138), campagne C06.** Pas encore jouée. Cas CONV-112 (année invalide, test de robustesse artificiel) et CONV-130 (droits refusés, règles d'accès à modifier temporairement) à jouer dans DEV7.

### S10. Clôture

| N° | Tâche | Agent | Fichiers | Ce qui est testé |
| --- | --- | --- | --- | --- |
| 10.1 | Examen de sécurité final : jetons (écriture pour Voir/rattachement/dépôt, jamais affichés), pdfmake et empreintes SRI, source du logo et de la police si Marianne un jour, règles d'accès (ANS sans accès), contenu de `actions-dashboard.html` (aucun texte de modèle, aucun secret, aucune donnée réelle). | auditeur-securite | Aucun | Rapport sans point bloquant. |
| 10.2 | Documentation : README (section Convention, tables lues et écrites, données personnelles : nom/prénom/fonction du signataire et du représentant, signatures sur le PDF signé), carnet de tests, note UX alignée sur le code (aucun écart connu restant), CLAUDE.md (règle du mode sombre, recette avec un vrai compte non propriétaire, règle sur les commandes de lecture des agents une fois tranchée). | documentaliste | `README.md`, `docs/tests/`, `docs/ux/convention.md`, `CLAUDE.md` | Relecture par Hanta : aucun nom de document Grist, aucune adresse réelle. |
| R7 | Recette complète sur TEST : R1 à R6 rejouées par le collègue (campagne C03 pour R1/R2, C04/C05/C06 pour R4/R5/R6, ou campagnes propres), avec de vrais comptes (National déjà disponible, Régional disponible, **Départemental à préparer**). | recetteur, collègue | `docs/tests/` | Compte rendu final, carnet Excel à jour. |
| 10.3 | Structure dans PROD (`Conventions`, `Modeles_convention` avec `Logo`/`Logo_partenaire`, `Structures.Ville`, `Agences.Siret` si absente, règles d'accès) avant la fusion. Les 3 modèles officiels et leurs logos à saisir dans PROD (jamais dans le dépôt). Journal des évolutions dans DEV2 ; fusion dans main seulement sur accord de Hanta. | Hanta | Aucun | Page publiée vérifiée après fusion. |

### Évolution 1 (E1) — Allègement de la fenêtre Convention

Retours du chef de projet du 2026-10-29, après la mise en production de S7-S10 :

1. La fenêtre « Convention » est allégée : plus de colonne « Informations relatives à la convention », plus de champ « Modèle utilisé », plus de champ « Année » (l'année vient désormais de `Actions.Campagne`, une référence vers `Campagnes.Campagne`, texte — jamais demandée à l'agent). Le club tient en un seul bloc en lecture seule (nom, SIRET, adresse, sur une ligne). L'agence n'affiche que son nom, sans adresse.
2. Plus aucun champ de la fenêtre n'est obligatoire (signataire, fonction du signataire, représentant, fonction du représentant). Un champ vide donne des pointillés dans le PDF, y compris l'adresse du club si elle manque. Seul reste un blocage à l'OUVERTURE de la fenêtre : il faut un club ET une agence sur l'action pour générer (sinon l'agent retourne compléter la fiche Action).
3. Le signataire du club : deux options, choisir un contact existant dans la liste, OU saisir librement un nouveau contact dans une ligne dépliante. Il n'y a pas de case à cocher : un contact saisi en ligne dépliante est TOUJOURS créé dans `Contacts`. Les champs de la ligne dépliante sont ceux du vrai formulaire « Ajout d'un contact » du widget clubs : Nom (obligatoire), Prénom (facultatif), Email (obligatoire), Fonction (facultatif, modifiable). Téléphone n'est pas repris. La condition de création est « Nom rempli ». Si Nom est vide, rien n'est créé et `Conventions.Signataire_club` garde sa valeur actuelle. Si Nom est rempli mais Email est vide, le contact ne peut pas être créé et un message d'échec s'affiche. Quand le contact est créé, une ligne est ajoutée dans `Contacts` (Club, Nom, Prénom, Email, Fonction), puis `Conventions.Signataire_club` (référence) pointe vers cette nouvelle ligne. Il n'existe qu'UNE seule colonne pour le signataire, `Signataire_club` (référence) : `Signataire_club_texte` n'existe pas, et le PDF lit toujours la référence. Ordre technique : créer le contact, attendre son identifiant, puis écrire `Conventions`. Un contact n'est créé dans `Contacts` qu'UNE SEULE FOIS pour une même saisie, même si l'agent ferme et rouvre la fenêtre plusieurs fois (pas de doublon à chaque fermeture). La Fonction du signataire devient éditable dans ce cas précis (alors qu'elle reste en lecture seule pour un contact choisi dans la liste) : ceci revient, de façon plus légère et encadrée, sur la décision du 23/10 qui avait retiré le formulaire « Ajouter un contact » (tâche 4.1). La ligne dépliante est repliée par défaut et ne s'ouvre que si l'agent clique pour l'ouvrir (pour ne pas alourdir l'écran dans le cas le plus courant, choisir un contact existant).
4. Le bouton « Enregistrer les informations » est supprimé. Fermer la fenêtre (bouton Fermer, croix, ou touche Échap) enregistre automatiquement ce qui est saisi, silencieusement, comme le faisait ce bouton.

Maquette de référence (pour illustrer l'intention, pas pour en tirer des pixels exacts) : https://claude.ai/artifact/64Z3t7tDL1Nfuu9P3pbLAG

Tâches à venir : E1.1 (note UX, designer-ux), E1.2 (écran, dev-interface), E1.3 (données et écriture, dev-backend), E1.4 (tests, testeur), R8 (recette, recetteur).

#### Décisions de Hanta du 2026-10-29 (E1)

- **D-E1-1** : l'encart Club affiche nom, SIRET et adresse sur une ligne, dans un textarea en lecture seule.
- **D-E1-2** : la ligne dépliante du signataire utilise l'élément HTML natif `<details>`, sans classe nouvelle (aucun composant équivalent trouvé dans le design system). (remplacée par D-E1-15 : bouton "Ajouter un contact" au lieu d'un <details>)
- **D-E1-3** : la saisie libre (Prénom/Nom) est active dès que le champ Nom est rempli. Plier la ligne dépliante ne perd rien : la saisie reste visible si l'agent la rouvre.
- **D-E1-5** : si l'enregistrement à la fermeture de la fenêtre échoue, elle reste ouverte avec l'alerte d'échec habituelle ; un deuxième clic sur Fermer (ou Échap) quitte sans enregistrer.
- **D-E1-7** (vérifiée) : dans `Contacts`, Nom et Email sont obligatoires (comme le vrai formulaire « Ajout d'un contact » du widget clubs) ; Prénom, Téléphone et Fonction ne le sont pas.
- **D-E1-8** : si `Actions.Campagne` est vide, l'année est omise du sous-titre et du nom de fichier, comme pour une année invalide.
- **D-E1-9** : pas de croix ajoutée à la fenêtre Convention (elle n'en a pas aujourd'hui).
- **D-E1-10** : sous-titre de la fenêtre : « [Dispositif] · Campagne [Campagne] ».
- **D-E1-13** : les doublons de contact (même personne saisie deux fois en saisie libre) sont acceptés, aucun traitement particulier côté interface.
- **D-E1-12** (confirmée) : la phrase « Ce contact sera ajouté à la fiche du club. » est placée sous « Fonction du signataire », à la fin des 4 champs de la ligne dépliante.
- **D-E1-14** (confirmée) : reprendre du vrai formulaire « Ajout d'un contact » le contrôle de forme de l'e-mail (refuser un e-mail mal formé) et la consigne « coordonnées professionnelles, pas personnelles ». (la consigne "coordonnées professionnelles" est retirée par D-E1-16 ; le contrôle de forme de l'e-mail reste valable)
- **Champs de la ligne dépliante du signataire** (nouvelle décision du 2026-10-29) : elle reprend les champs du vrai formulaire « Ajout d'un contact » (`src/clubs/script.js`) plutôt que d'en inventer un autre : Nom (obligatoire), Prénom (facultatif), Email (obligatoire), Fonction (facultatif). Téléphone n'est PAS repris (pas utile pour signer une convention). (obligatoire et astérisque retirés par D-E1-17 : plus aucun champ n'est obligatoire)
  - Si Nom est vide, rien n'est créé dans `Contacts` et `Signataire_club` garde sa valeur actuelle.
  - Si Nom est rempli mais Email est vide, le contact ne peut pas être créé : message d'échec à la fermeture/génération, comme un échec d'enregistrement classique, en attendant la saisie de l'e-mail.
- **Rappel** : D-E1-4 et D-E1-6, dans leur forme d'origine, restent sans objet (case à cocher supprimée, toujours créer le contact). D-E1-11 reste valable tel que posé par le designer-ux (Nom devient la condition de création plutôt que Prénom OU Nom). D-E1-12, dans sa forme d'origine (phrase d'information sous Prénom/Nom), est remplacée par la D-E1-12 confirmée ci-dessus (phrase sous « Fonction du signataire »).
- **Documentation à mettre à jour en E1** (hors du périmètre de dev-interface/dev-backend, pour la documentaliste) : CLAUDE.md dit encore que le widget n'écrit jamais dans `Contacts` ; ce n'est plus vrai.

#### Nouvelles décisions du chef de projet et de Hanta du 2026-10-29 (E1)

- **D-E1-15** : la ligne dépliante `<details>` « Le contact n'est pas dans la liste : l'ajouter » est REMPLACÉE par un bouton « Ajouter un contact », qui ouvre le petit formulaire (Nom, Prénom, E-mail, Fonction) à son clic. Même logique de fonctionnement qu'avant (saisie, création à la fermeture/génération) : seul l'habillage change, un bouton au lieu d'un `<details>`. Cela remplace la D-E1-2 (élément `<details>`).
- **D-E1-16** : les deux textes d'aide sont RETIRÉS : « * Nécessaires pour ajouter ce contact. » et « Saisissez des coordonnées professionnelles (adresse e-mail de la structure), pas des coordonnées personnelles. » Cela remplace la consigne « coordonnées professionnelles » de la D-E1-14 ; le contrôle de forme de l'e-mail de la D-E1-14 reste valable (voir D-E1-17).
- **D-E1-17** : PLUS AUCUN champ n'est obligatoire dans ce formulaire, y compris Nom et E-mail : pas d'astérisque, pas d'attribut `required`. Si Nom est vide, rien n'est créé (comportement inchangé). Si Nom est rempli mais E-mail est vide ou mal formé, le contact ne peut toujours pas être créé par Grist (règle de `Contacts`, D-E1-7) : garder le message d'erreur existant dans ce cas, mais sans jamais afficher d'astérisque ni bloquer la saisie elle-même.
- **D-E1-18** : espacement entre les champs Nom, Prénom, E-mail et Fonction du formulaire, actuellement trop serré (Prénom presque collé au champ du dessus). À espacer davantage, avec les variables d'espacement du design system.
- **D-E1-19** : l'encart Club (lecture seule, nom/SIRET/adresse) ne doit plus être une zone redimensionnable à la main (pas de poignée de redimensionnement) : sa hauteur doit s'ajuster automatiquement à son contenu réel, sans espace vide en dessous. Cela précise la D-E1-1 (textarea en lecture seule).
- **D-E1-20** : le seuil de bascule à deux colonnes de la fenêtre Convention (initialement 1200 px) était trop haut pour l'usage réel : Hanta travaille habituellement avec un navigateur réduit (pour garder de la place à côté), et le widget passait alors rapidement sous 1200 px, forçant une seule colonne qui défile, ce que le chef de projet refuse. Mesuré : à 1193 px de large, le widget est déjà en une colonne. Décision : le seuil passe de 1200 px à 1100 px, pour garder une marge de confort sous la largeur habituelle de travail de Hanta.
- **D-E1-21** : les pointillés écrits par le widget lui-même dans le PDF (pour une case connue mais vide, et pour « Fait à…, le… ») sont trop courts. Décision du chef de projet : les doubler (actuellement 28 points, passer à 56 points). Cette longueur est réglée dans `CONVENTION_MISE_EN_PAGE` (`src/actions-dashboard/script.js`), §11 de la note.
- **D-E1-22** : bug constaté par le chef de projet le 29/10 : impossible de télécharger le PDF (généré ou signé) avec son vrai nom depuis « Voir la convention » / « Voir la convention signée ». Cause confirmée par le relecteur : une adresse `blob:` n'a jamais de nom de fichier associé ; un navigateur qui l'ouvre dans sa visionneuse PDF invente un nom (un UUID) à l'enregistrement, quel que soit l'objet (Blob ou File) utilisé pour la créer. Décision : ajouter un vrai bouton « Télécharger » à côté de « Voir la convention » et de « Voir la convention signée », qui utilise un lien `<a download="[nom exact du fichier].pdf" href="blob:...">` pour forcer le bon nom, quel que soit le navigateur. « Voir » garde son comportement actuel (ouverture dans un nouvel onglet, pour lire sans télécharger) ; « Télécharger » déclenche directement l'enregistrement avec le bon nom. (remplacée par E2-1 : ouverture dans une pop-up à la place d'un nouvel onglet)

### Évolution 2 (E2) — Voir en pop-up et télécharger avec le bon nom

Bug constaté par le chef de projet le 29/10 : le PDF (généré ou signé), ouvert dans un nouvel onglet via une adresse `blob:`, se télécharge avec un nom généré par le navigateur (type UUID) au lieu du vrai nom du fichier. Cause confirmée par le relecteur : une adresse `blob:` n'a jamais de nom de fichier associé ; le navigateur en invente un à l'enregistrement, quel que soit l'objet utilisé pour la créer (Blob ou File).

Décisions du chef de projet et de Hanta :

- **E2-1** : « Voir la convention » et « Voir la convention signée » n'ouvrent plus un nouvel onglet : ils ouvrent une pop-up (fenêtre modale), de taille confortable comme la fenêtre « Convention » actuelle (pas plein écran), qui affiche le PDF à l'intérieur du widget. (remplacée par E2-11 (plein écran) : la taille passe de « confortable » à plein écran)
- **E2-2** : un bouton « Télécharger » est ajouté, pour le PDF généré ET le PDF signé, à DEUX endroits : dans le bloc Convention (à côté du bouton « Voir » correspondant), et DANS la pop-up elle-même. Il utilise un lien `<a download="[nom exact du fichier].pdf" href="blob:...">` pour forcer le bon nom au téléchargement, quel que soit le navigateur.
- **E2-3** : le PDF est affiché dans la pop-up avec un `<iframe>` ou `<embed>` pointant vers l'adresse `blob:` déjà récupérée (pas de nouveau téléchargement) ; prévoir un repli (message, lien pour ouvrir dans un nouvel onglet) si le navigateur ne sait pas afficher un PDF dans un cadre. (le lien du repli est retiré par E2-7 : texte simple sans lien)
- **E2-4** : la pop-up se ferme comme les autres fenêtres du widget (bouton Fermer, touche Échap), avec les mêmes règles d'accessibilité (`role=dialog`, focus géré, retour du focus sur le bouton qui a ouvert la pop-up). (le bouton Fermer devient une croix dans l'en-tête, voir E2-5 et E2-8)

#### Nouvelles décisions du chef de projet et de Hanta du 2026-10-30 (E2)

- **E2-5** : la pop-up « Voir la convention » / « Voir la convention signée » gagne en hauteur de lecture. Le pied de page (Fermer, Télécharger) disparaît entièrement : ces deux commandes passent dans l'EN-TÊTE de la pop-up, pour libérer un maximum de place verticale pour l'iframe du PDF.
- **E2-6** : le titre « Convention générée » / « Convention signée » est RETIRÉ. Le nom exact du fichier devient le seul titre affiché (il reste l'élément qui donne son nom accessible à la fenêtre, via `aria-labelledby`).
- **E2-7** : le lien « Ouvrir dans un nouvel onglet » (filet de secours si le PDF ne s'affiche pas dans l'iframe) est RETIRÉ, car le chef de projet ne veut jamais qu'une adresse `blob:` / github.io soit visible dans la barre du navigateur. Il est remplacé par un texte simple, SANS lien : « Le PDF ne s'affiche pas ? Utilisez « Télécharger ». » **Risque accepté** : si l'affichage du PDF dans l'iframe échoue pour un navigateur (cas rare, non détectable par notre code), l'utilisateur n'a plus que le téléchargement pour accéder au document, sans aperçu possible.
- **E2-8** : dans l'en-tête de la pop-up, à droite, deux commandes dans cet ordre (de gauche à droite) : le bouton « Télécharger » (un `<button>` qui fabrique un lien temporaire au clic, voir E2-9), puis un bouton de fermeture en forme de croix « ✕ » (`aria-label="Fermer"`). Le comportement de fermeture (Échap, focus qui revient sur le bouton d'origine, libération du blob) reste identique à ce qui est déjà décidé en E2-1 à E2-4.
- **E2-9** : le bouton « Télécharger » de la pop-up (ajouté en E2-8) n'est PAS un vrai lien `<a href="blob:...">` permanent : c'est un `<button>`, qui utilise la MÊME technique que le bouton « Télécharger » du bloc Convention (E2 initial) : au clic, il crée un lien `<a download="[nom].pdf" href="blob:...">` temporaire, déclenche son clic par programmation, puis le retire aussitôt. Raison : un vrai lien permanent affiche son adresse `blob:` au survol dans la barre de statut du navigateur, ce que le chef de projet veut éviter complètement, même ce survol discret. (précise E2-8 : « vrai lien `<a download>` » y est remplacé par ce bouton)
- **E2-10** (confirmé après discussion) : les DEUX boutons « Télécharger » sont conservés (celui du bloc Convention ET celui de la pop-up), pour deux usages différents : téléchargement rapide sans ouvrir la pop-up (bloc), et téléchargement après consultation (pop-up). Les deux donnent toujours le bon nom de fichier.
- **E2-11** (remplace E2-1) : la pop-up « Voir la convention » / « Voir la convention signée » passe en PLEIN ÉCRAN, et non plus en grande fenêtre confortable (`modal-xl`). Décision du chef de projet, pour un confort de lecture maximal, après confirmation que la taille de la pop-up n'a aucun impact sur la sécurité (elle reste dans tous les cas une fenêtre interne à la page Grist, sans jamais changer la barre d'adresse du navigateur). Les boutons et le comportement (en-tête avec « Télécharger » et croix de fermeture, E2-5 à E2-10) restent les mêmes, seule la taille change.

Tâches à venir : E2.1 (note UX, designer-ux), E2.2 (écran et pop-up, dev-interface), E2.3 (téléchargement et nom de fichier, dev-backend), E2.4 (tests, testeur), R9 (recette, recetteur).

## Questions encore ouvertes

- **Q-A** : notes de bas de page regroupées en fin de document (limite de pdfmake). À faire valider par le client : fin de l'article ou fin du document ?
- **Q-B** : une action en corbeille ou annulée garde-t-elle sa convention ? Génération interdite pour ces statuts ?
- **Q-F** : garder `Modele_version` ? Une branche par tâche ou par fonction ?
- **Q-G** : qui corrige l'adresse d'une agence dans Agences ?
- **Q-K (pour le chef, posée le 2026-10-26, sans réponse)** : pour Stade et Match des métiers, le lieu du « Fait à » doit-il être pré-rempli avec la ville de l'agence (la date resterait à la main), ou tout reste-t-il à la main comme aujourd'hui ?
- **Q-L (pour le chef, posée le 2026-10-26, sans réponse)** : confirmation du circuit de signature : France Travail génère, fait signer le club (sur place ou à distance), signe, puis dépose seul la version signée par les deux dans Grist (le club ne dépose jamais lui-même).
- **Nom de club de plus de 40 caractères** : aucun cas de recette écrit pour ce cas limite (relevé par le recetteur en R6) ; à ajouter si jugé utile.

Questions réglées : Q-C (logo : vient du Word officiel, colonnes Logo/Logo_partenaire), Q-D, Q-E, Q-H, Q-I (devenue D-S8-4), Q-J (devenue D-S8-5/D-S8-7).

## Risques

- Recette faussée par « Voir en tant que » pour tout ce qui passe par un jeton : toujours exiger un vrai compte non propriétaire (règle apprise à la dure, fiche C41).
- Structure, modèles officiels (textes et logos), colonne `Siret` d'Agences et SIRET renseignés absents de TEST ou de PROD avant la recette ou la fusion.
- Un modèle avec une case hors de la liste officielle (11 cases) bloque la génération : c'est voulu, mais à vérifier sur les vrais textes avant la mise en production.
- Script externe pdfmake : version figée et empreintes SRI ; une mise à jour demande de recalculer les empreintes.
- Doublons de `Conventions.Action` : Grist n'impose pas l'unicité, le widget garde la plus ancienne ligne.
- `script.js` dépasse 3700 lignes : les tests existants (729 au 2026-10-26) doivent rester verts à chaque tâche.
- Fichiers PDF orphelins (générés et signés) qui s'accumulent à chaque re-génération ou remplacement, jamais nettoyés par Grist ni par le widget : à relier à la démarche RGPD globale (durée de conservation des noms de signataires).
- Comptes réels non propriétaires nécessaires pour les cas de droits (National et Régional disponibles ; **Départemental encore à préparer** pour R4/R5/R6).
- CONV-130 (R6) : nécessite de modifier temporairement les règles d'accès dans DEV7, à remettre en état scrupuleusement après le test.
- Dépôt public : aucun texte de modèle, aucun secret, aucune donnée réelle, aucun logo réel dans le dépôt (seulement dans Grist).
- Données personnelles : nom, prénom, fonction du signataire et du représentant, signatures sur les PDF générés et signés. Durée de conservation à traiter dans la démarche RGPD globale.
- Incident Grist du 24/10/2026 (grist.numerique.gouv.fr) sur un autre document (tableau de bord des actions, pas la convention) : blocage « No Write Access » pour au moins deux utilisatrices Régional, malgré des règles d'accès vérifiées correctes ; piste en cours : session/cache de navigateur à reconnecter, suite à des mises à jour de la plateforme le 23/10. Sans lien avec le chantier Convention.

## Refonte de la recette Convention (décision du 03/11)

Décision de Hanta, après retour négatif du chef de projet et du collègue testeur sur le document de recette (trop long, pas assez centré sur l'essentiel) : la recette Convention sera entièrement reconstruite, en PARCOURS UTILISATEUR courts (ex. "je génère une convention pour tel club, je vérifie le résultat"), plutôt qu'en vérifications exhaustives détail par détail (état par état, droit par droit, angle par angle). Objectif : que le collègue testeur se mette à la place d'un agent qui utilise l'outil, pas qu'il revérifie ce que Hanta a déjà validé pendant le développement.

Le document final distingue trois catégories de lignes, toutes visibles pour la traçabilité :
1. Ce que le collègue a déjà joué (résultat "testé", observation "Bon") : gardé tel quel, jamais rejoué.
2. Ce que Hanta a déjà vérifié elle-même pendant le développement (les nombreux essais à l'écran faits avec Claude au fil des évolutions E1 et E2 : pop-up plein écran, bon nom de fichier au téléchargement, bouton Ajouter un contact, seuil à 1100px, etc.) : marqué clairement "Déjà vérifié par Hanta pendant le développement", jamais à refaire par le collègue non plus.
3. Les quelques parcours utilisateur restants (5 à 10), qui sont les SEULS que le collègue doit réellement jouer : il se met à la place d'un agent qui utilise l'outil pour de vrai (générer une convention, déposer un fichier signé, etc.), pas d'un testeur qui vérifie chaque détail technique.

Autres principes à appliquer à la reconstruction :
- Supprimer entièrement les cas marqués obsolètes (42 cas) ET les cas marqués "bloqué" par le collègue (CONV-07, 08, 09, 10, 11, 13, pas de vrais bugs, juste des blocages d'environnement).
- Les besoins signalés par ces cas bloqués, à ne pas perdre, à traiter séparément (hors du document de test) : créer un vrai club de test avant la recette (CONV-07) ; obtenir l'accès "Voir en tant que" pour jouer les cas de droits FT Régional et FT Départemental (CONV-08 à 11) ; disposer d'un Mac pour les vérifications VoiceOver (CONV-13).

À NE PAS FAIRE MAINTENANT : la reconstruction est mise EN ATTENTE jusqu'à la décision du chef de projet sur le passage de la génération en Word (.docx), car cette décision va changer une bonne partie de ce qu'il y a à tester (le bouton "Voir", la génération elle-même). Relancer cette tâche seulement après cette réponse.

## Évolution 3 (E3) — Génération en Word (.docx) et dépôt libre

Décision du chef de projet : la génération de la convention passe du PDF au Word (.docx), pour permettre aux agents de modifier le texte avant signature (habitude de tous les agents). Pas d'édition en ligne dans le widget : l'agent télécharge le .docx et le modifie dans sa propre application Word, comme aujourd'hui avec le PDF. Le PDF est REMPLACÉ pour le document généré, pas gardé en option.

Décisions :
- E3-1 : bibliothèque choisie, docx (dolanmiu), version 9.15.2 figée. Étude de faisabilité (dev-backend) et audit de sécurité (auditeur-securite) favorables, sous conditions. Dépendances réelles confirmées : fflate ^0.8.3 et nanoid ^6.0.1 (nanoid largement au-delà des correctifs de sécurité connus). Fichier navigateur : dist/index.umd.cjs (format UMD, confirmé par le registre npm), publié par GitHub Actions avec attestation de provenance.
- E3-2 : chargement via jsDelivr (cdnjs ne possède pas cette bibliothèque, vérifié : réponse 404 sur cdnjs.cloudflare.com/ajax/libs/docx/9.15.2/docx.min.js). Reprendre à l'identique le modèle de chargement de pdfmake (script.js:2020-2099) : adresse complète avec version exacte, SRI sha384 calculé sur le fichier réellement servi, crossOrigin="anonymous", referrerPolicy="no-referrer", chargement au clic seulement, délai maximum, retrait du script en cas d'échec, une seule promesse.
- E3-3 : "Voir la convention" (le document généré) : l'aperçu intégré est ABANDONNÉ (un navigateur n'affiche pas nativement un .docx). Le bouton devient "Télécharger la convention" uniquement.
- E3-4 : "Voir la convention signée" (reste un PDF, un scan) : AUCUN changement, garde son aperçu actuel en pop-up plein écran (Évolution 2).
- E3-5 : les pointillés (case connue mais vide) sont REMPLACÉS par des champs réellement vides, avec un surlignage (couleur de fond) comme repère visuel, pour que l'agent les remplisse directement dans Word. (REMPLACÉE par E3-25 : retour aux pointillés pour tous les champs vides, sans couleur)
- E3-6 : le bouton "Déposer la convention signée" devient visible en PERMANENCE sur le bloc Convention, y compris aux états "À générer" et "Sans modèle" (pas seulement après une génération dans l'outil). Il reste MASQUÉ si les droits de l'utilisateur sont insuffisants. Le dépôt doit créer la ligne Conventions si elle n'existe pas encore (via applyUserActions, Action au minimum) ; vérifier que les règles d'accès autorisent cette création par un non-propriétaire, et ne jamais écrire dans les colonnes calculées DR/DD.
- E3-7 : état du bloc après un dépôt sans génération préalable dans l'outil : passage direct à l'état "Signée", avec Modele et Annee vides, phrase "Convention signée, déposée le …". Vérifier qu'aucune autre partie du code (sous-titre, etc.) ne suppose Modele/Annee toujours remplis.
- E3-8 : le fichier signé déposé reste UNIQUEMENT un PDF (scan), jamais un .docx. Le contrôle existant (10 Mo, type, contenu %PDF-) ne change pas.
- E3-9 : les conventions déjà générées en PDF avant cette évolution restent telles quelles dans Conventions.PDF_genere. Le bouton "Télécharger" doit fonctionner pour les deux formats (PDF ancien ou .docx nouveau), l'extension étant déduite du nom du fichier déjà présent dans la pièce jointe.
- E3-10 : avertissement avant d'écraser lors d'une re-génération : comportement inchangé (la phrase existante est juste reformulée avec "document" à la place de "PDF").
- E3-11 : le nom de la colonne Grist Conventions.PDF_genere est CONSERVÉ tel quel (pas de renommage, pour ne pas casser d'autres widgets qui pourraient la lire), seulement documenté comme pouvant contenir un .docx ou un .pdf selon la date de génération.
- E3-12 : métadonnées du document Word (auteur, titre, dates de création/modification) fixées explicitement à des valeurs neutres (par exemple "Partenariat simplifié"), JAMAIS le nom du club, de l'agence ou du signataire. Reproduire la discipline déjà en place pour le PDF (aucun champ info renseigné aujourd'hui).
- E3-13 : toute valeur insérée dans le document (nom, prénom, SIRET, adresses, etc.) doit toujours être posée comme texte simple (TextRun), jamais assemblée en XML à la main. Test obligatoire avec des caractères spéciaux (& < > " ') dans chaque champ avant mise en production.
- E3-14 : la recette R8 et R9 de la Convention reste SUSPENDUE le temps de cette évolution (décision déjà notée dans la section "Refonte de la recette Convention").
- E3-15 : point encore ouvert, non bloquant pour le développement en DEV/TEST : le domaine jsdelivr.net doit être vérifié ou autorisé sur le réseau interne de France Travail avant la mise en PROD (question posée au chef de projet par e-mail, aucun collègue disponible côté France Travail pour tester dans l'immédiat).
- E3-16 : la fusion dans main se fait APRÈS la stabilisation complète de cette évolution, pas avant.
- E3-17 (correction d'un bug trouvé par le designer-ux) : le nom de fichier de la convention générée doit lire l'année directement depuis Actions.Campagne, PAS depuis Conventions.Annee (qui reste vide après un dépôt libre sans génération, E3-7). Ceci corrige une incohérence entre la note (§4.1 k) et le code actuel (conventionNomFichier).
- E3-18 : réponses de Hanta aux questions ouvertes du designer-ux (§15.13) :
  - (a) surlignage jaune standard, bande d'espaces insécables d'environ 20 caractères (40 pour une adresse), accepté tel quel ;
  - (b) les zones non remplacées par le widget (« Fait à… », dates de signature) sont AUSSI surlignées, par cohérence avec l'ancien traitement en pointillés (E1-21) ; (REMPLACÉE par E3-25 : retour aux pointillés pour tous les champs vides, sans couleur)
  - (c) ajouter une phrase d'aide courte près du bouton « Déposer » aux états « À générer » et « Sans modèle » : « Vous pouvez déposer une convention déjà signée, préparée en dehors de l'outil. » (RETIRÉE par E3-23 : plus aucune phrase d'aide pour ce bouton) ;
  - (d) mise en page du document Word : reprendre celle du PDF (A4, marges 2,5 cm, justifié, interligne 1,2), SAUF la police : Arial à la place de Roboto (non embarquée par Word) ;
  - (e) interprétation de « droits insuffisants » confirmée : masqué seulement à l'état correspondant (A7) ; un refus d'écriture réel donne le message déjà prévu (S9-4).
- E3-19 : dernières réponses de Hanta aux questions ouvertes du §15.13 de la note UX :
  - Q-E3-1 : oui, confirmé. Un seul bouton « Télécharger la convention », plus de bouton « Voir » pour le document généré ;
  - Q-E3-2 : oui, confirmé. Masqué seulement à l'état A7 ;
  - Q-E3-3 : oui, accepté tel quel ;
  - Q-E3-4 : oui, confirmé ;
  - Q-E3-5 (a) : oui. Utiliser le nom complet du dispositif (pas de forme abrégée) dans « Aller vers » et « Parcours complet » ;
  - Q-E3-6 : les trois autres textes (phrases d'aide de l'état « Générée », introduction de la fenêtre B, messages d'échec de génération) sont validés tels quels, avec seulement le mot « PDF » remplacé par « document » ;
  - Q-E3-7 : oui aux deux. Alerte d'échec si l'extension est inconnue ; .docx sur téléphone accepté sans test particulier ;
  - Q-E3-8 : validé. On garde la ligne « Format : document Word (.docx). » / « Format : document PDF (.pdf). ».
- E3-20 : réponses de Hanta aux 3 points soulevés par dev-backend pendant le code :
  - A : les textes de la fenêtre B et du message de re-génération, tels qu'appliqués par dev-backend (§15.7), sont confirmés ;
  - B : PAS d'heuristique automatique sur les points tapés à la main dans le texte des modèles (proposition « 5 points ou plus » rejetée, trop risqué sur du texte géré par les gestionnaires). Les points résiduels restent de simples points dans le Word pour l'instant. Hanta vérifie manuellement dans Grist si les 3 modèles officiels en contiennent encore ; à traiter au cas par cas si besoin, jamais par automatisme ;
  - C : accepté tel quel. La ligne « Format » et les textes associés n'apparaissent qu'après un clic ou une génération dans la session en cours (pas de lecture de `_grist_Attachments`, pas de nouvelle colonne Grist pour l'instant).
- E3-21 (précision sur E3-18 b, surlignage) : deux catégories de zones vides dans le document Word, traitées différemment : (REMPLACÉE par E3-25 : retour aux pointillés pour tous les champs vides, sans couleur)
  - Catégorie 1 : les VRAIS champs de données Grist vides (siège du club, adresse de l'agence, etc.), que l'agent est censé taper directement dans Word. Ceux-là GARDENT le surlignage jaune avec la bande d'espaces insécables, comme décidé en E3-5 et E3-18 ;
  - Catégorie 2 : les zones « Fait à… » et « À…, le… », qui n'ont JAMAIS été remplies par le widget (ni en PDF ni en Word) et restent prévues pour être écrites À LA MAIN au stylo après impression, comme avant. Celles-ci N'ONT PLUS de surlignage jaune : un simple espace souligné (comme une ligne à remplir sur un formulaire papier), sans bande jaune, pour éviter que l'agent oublie de retirer un surlignage sur une zone qu'il ne remplit jamais dans Word. Cela remplace ce que disait E3-18 b pour ces zones.
- E3-22 (réponse de Hanta à Q-E3-10) : confirmé, les trois autres zones écrites à la main après impression (nombre d'opérations ou de parcours, date de fin, contact protection des données) suivent le MÊME traitement que « Fait à… » et « À…, le… » (E3-21) : un espace souligné, SANS surlignage jaune. La catégorie 2 (E3-21) couvre donc toutes les zones jamais remplies par le widget, pas seulement les deux citées initialement. (REMPLACÉE par E3-25 : retour aux pointillés pour tous les champs vides, sans couleur)
- E3-23 : la phrase d'aide « Vous pouvez déposer une convention déjà signée, préparée en dehors de l'outil. » (ajoutée en E3-6/E3-18 c, près du bouton « Déposer la convention signée » aux états « À générer » et « Sans modèle ») est RETIRÉE. Décision de Hanta : les agents savent déjà qu'ils peuvent déposer un document, cette phrase n'apporte rien. Le bouton « Déposer la convention signée » reste visible à ces états, sans texte d'aide associé.
- E3-24 : réponses de Hanta aux 4 points soulevés par le testeur après la mise à jour complète des tests :
  - Point 1 (ancien PDF : l'aide Word s'affiche avant le premier clic) : accepté tel quel, défaut mineur non bloquant.
  - Point 2 (dates de création/modification non fixées) : confirmé que ce n'est pas un problème RGPD (ce n'est pas une donnée personnelle). E3-12 est précisée : seuls creator, lastModifiedBy, title et description sont à fixer à des valeurs neutres ; les dates réelles restent celles du moment de génération, sans besoin de les fixer.
  - Point 3 (3 zones manuscrites non testées, car elles sont dans le texte des modèles Grist) : à vérifier par Hanta directement dans Grist (DEV7/TEST), ce n'est pas un sujet de code.
  - Point 4 (extension insensible à la casse, .DOCX accepté) : accepté, c'est un comportement robuste, pas un bug.
- E3-25 : REVIREMENT complet sur le traitement des champs vides dans le document Word. Décision finale de Hanta, après réflexion sur la priorité donnée dès le départ par le chef de projet (« le plus facile possible pour les agents, qui n'aiment déjà pas changer leurs habitudes ») : TOUS les champs vides (aussi bien les vrais champs de données Grist que les zones manuscrites comme « Fait à… », « À…, le… », etc.) redeviennent des POINTILLÉS, exactement comme pour le PDF, SANS AUCUNE couleur, sans surlignage ni soulignement. Raison : c'est la convention que les agents connaissent déjà, zéro nouvelle habitude à apprendre, et c'est aussi la solution la plus simple techniquement.
  - Ceci REMPLACE ENTIÈREMENT E3-5, E3-18 (point b), E3-21 et E3-22 : il n'y a plus de distinction entre catégorie 1 et catégorie 2, toutes les zones vides suivent désormais le même traitement uniforme.
  - Longueur : la même que celle déjà établie pour le PDF (56 points, doublée en E1-21), pour les deux groupes de champs (ceux qui avaient 20 caractères et ceux qui avaient 40), par souci de cohérence et de simplicité : une seule longueur, 56 points, partout.
- E3-28 : la colonne Conventions.PDF_genere garde son nom technique inchangé (décision E3-11 confirmée), mais son ÉTIQUETTE AFFICHÉE dans Grist devient « Docx/PDF généré », pour plus de clarté pour les utilisatrices. Une description est ajoutée sur la colonne, expliquant pourquoi le nom technique reste PDF_genere : il est partagé avec d'autres widgets du Partenariat simplifié, et un renommage casserait silencieusement tout widget qui le lirait par son nom technique. Appliqué dans DEV7 et TEST par Hanta directement dans Grist (pas une modification de code).
- E3-26 : simplification de la phrase du bloc à l'état « Générée » pour le format Word. Décision de Hanta : la longue phrase d'aide (« Téléchargez la convention, modifiez-la si besoin dans Word... ») est RETIRÉE entièrement. Il ne reste que la phrase d'état courte, sur le même modèle que l'état « Signée » (« Convention signée, déposée le [date]. »), soit : « Convention générée le [date]. » Raison : la phrase longue créait une contradiction (modifier dans Word ET compléter à la main après impression), et devait rester aussi sobre que celle de l'état Signée.
- E3-27 : bug visuel constaté par Hanta à l'écran : un espace vide persiste en haut du bloc Convention, même quand aucun message d'erreur ni de confirmation n'est affiché. À corriger : l'espace ne doit apparaître que si un message est réellement présent.
- E3-29 (réponse à Q-E3-26) : confirmé, la simplification de la phrase (« Convention générée le [date]. », sans phrase d'aide) s'applique AUX DEUX FORMATS, Word et ancien PDF. Raison : cohérence, et le code PDF (pdfmake) sera de toute façon retiré à terme.
- E3-30 : réponse reçue de Benjamin sur UNE seule des 4 questions posées en cadrage (le choix de bibliothèque), arrivée après coup, le chantier E3 étant déjà codé, testé et publié sur TEST. Benjamin confirme a posteriori que docx (dolanmiu), utilisée en construction directe par code (pas de fichier modèle), était le bon choix pour notre cas (mise en page stable, maintenue par Hanta). Benjamin confirme aussi l'approche du logo via le jeton d'accès Grist (déjà implémentée et déjà testée avec succès). Sa question sur les « contrôles de contenu » Word ne s'applique pas : la décision E3-25 a retenu de simples pointillés en texte, pas de vrais champs de formulaire Word. Les 3 autres questions posées en cadrage restent SANS RÉPONSE : accessibilité RGAA des documents Word administratifs, compatibilité LibreOffice, procédure de validation d'une bibliothèque externe chez France Travail.
- E3-31 : demande de Pierre (chef de projet) : retirer le bouton « Télécharger » du bloc Convention, à l'état « Signée » uniquement (celui situé à côté de « Voir la convention signée »). Raison : l'agent peut déjà télécharger depuis l'intérieur de la pop-up de prévisualisation (bouton « Télécharger » ajouté en E2, dans l'en-tête de la pop-up), donc ce bouton est redondant. Le bouton « Remplacer le fichier signé » n'est pas concerné, il reste. Le bouton « Télécharger la convention » (document généré en Word/PDF, états « Générée ») n'est PAS concerné non plus : il reste indispensable, puisque « Voir » n'existe plus pour ce document (E3-3).
- E3-32 : précision technique sur E3-31. Le bouton « Télécharger » (état Signée) partageait 5 fonctions avec « Télécharger la convention » (état Générée) via un paramètre « signee » : conventionTelechargerHtml, conventionTelechargerId, conventionTelechargerLibelleHtml, conventionTelechargerAttente, conventionTelecharger. Décision de Hanta : retrait COMPLET du paramètre « signee » de ces 5 fonctions (pas seulement l'appel), pour ne pas laisser de code mort dans des fonctions encore utilisées par le bouton « Générée ». Les tests de l'état « Signée » concernés devront être mis à jour par le testeur.
- E3-33 : réponse de Pierre (chef de projet) sur le point soulevé par Benjamin (modèle à balises vs construction par code pour la génération Word) : ON GARDE l'approche actuelle (construction directe par code avec docx, sans fichier modèle). Pas de besoin identifié chez France Travail de modifier soi-même la mise en page visuelle. Aucun changement à prévoir sur ce point. Le chantier E3 est donc définitivement stabilisé dans son approche technique.
- E3-34 : avis de Benjamin, reçu après la décision E3-33 de Pierre (déjà "on garde l'approche code", confirmé oralement avant même cet échange). Benjamin confirme cette décision pour les mêmes raisons : le texte des clauses (qui change le plus) se modifie déjà dans Grist, la mise en page bouge rarement, et le choix n'est pas définitif (la correspondance Grist-champs se réutiliserait si besoin plus tard). CONSEIL PRATIQUE à appliquer : regrouper tous les réglages de mise en page du document Word (police, tailles, marges, espacements) en tête du fichier de code, pour qu'une future demande d'apparence reste une petite modification localisée, plutôt qu'une recherche dans tout le fichier.
- E3-35 : décision de Hanta d'élever le conseil de Benjamin (E3-34) au rang de règle permanente du projet, et pas seulement d'une correction ponctuelle sur ce fichier. Ajoutée dans CLAUDE.md, section 'Bonnes pratiques de code', avec un champ d'application élargi à toute configuration dispersée (pas seulement la génération de documents), à la demande de Hanta..
- E3-36 : limitation connue, signalée par Hanta suite au retour de recette de Jean-Louis (P-01) : le logo partenaire (Logo_partenaire) ne s'affiche PAS dans le document Word généré, même quand il est renseigné dans Grist. Décision de Hanta : mise en attente, à corriger plus tard SI le besoin se confirme, pas une priorité maintenant. Ce point ne doit pas être testé ni bloquer la recette actuelle : retirer cette attente du carnet de test P-01.
- E3-37 : décision de Hanta d'ajouter une colonne "Validé par" aux carnets de test, pour tracer qui confirme ou corrige un résultat après un premier passage (par exemple quand Hanta revient sur un test marqué "À revoir" par le collègue testeur). Décision élevée en règle permanente, ajoutée dans CLAUDE.md, applicable à tous les futurs carnets de recette.
- E3-38 : P-07 repris par Hanta elle-même (Jean-Louis avait cliqué sur le mauvais bouton la première fois). Confirmé : le téléchargement d'une ancienne convention déjà en PDF fonctionne correctement avec le bon bouton « Télécharger la convention ».
- E3-39 : mise en PROD de la Convention décidée par Pierre, malgré un point non vérifiable avant la mise en ligne : le domaine jsdelivr.net doit être autorisé sur le réseau interne de France Travail pour que la génération Word fonctionne (E3-15). Ni Hanta, ni Jean-Louis, ni Pierre ne sont sur ce réseau pour le tester avant. Risque assumé consciemment : si bloqué, le message d'erreur prévu s'affichera clairement (pas de plantage silencieux), et le code de l'ancien système PDF (pdfmake) reste en place, inutilisé mais disponible comme solution de repli rapide si besoin. Premier vrai test réel : un utilisateur France Travail en PROD.

## Sprint E4 — 5ème statut "Non retenu"

Besoin d'origine : en tant que directeur d'agence, connaître les actions financées AAP 2026-2027 et indiquer les actions refusées faute de budget à réaliser. Distinguer "refusées" (FT ne souhaite pas faire l'action avec ce club) de "non financées" (pas de financement). Pour ce sprint, on ne traite QUE le refus (statut "Non retenu" + raison) ; le cas "non financée faute de budget" n'est pas couvert, à traiter plus tard si besoin (probablement via un autre statut, pas une raison supplémentaire).

Déjà fait par Hanta dans Grist (DEV7 et TEST) : colonne Actions.Statut, choix "Non retenu" ajouté. Nouvelle colonne technique Actions.Raison_du_refus (Choice, liste extensible), 4 raisons déjà définies : "Non pertinent pour les besoins du territoire", "Pas de contact avec la structure", "Dossier ne correspondant pas au cahier des charges", "Opération déjà programmée avec une autre structure".

Décisions de Hanta (réponses aux questions bloquantes du chef de projet) :
- E4-1 (Q1) : nom technique exact de la colonne : Raison_du_refus.
- E4-2 (Q2) : quand on quitte "Non retenu" pour un autre statut, Raison_du_refus est effacée (même logique que Periode_approx aujourd'hui hors "À confirmer").
- E4-3 (Q3) : la raison est OBLIGATOIRE pour enregistrer un statut "Non retenu".
- E4-4 (Q4) : incohérences venant de l'extérieur du widget (import, saisie directe dans Grist) : affichage TEL QUEL, sans blocage ni correction automatique. Une valeur de raison hors liste est ajoutée temporairement à la liste déroulante affichée, pour ne pas la perdre à l'enregistrement (proposition du chef de projet, acceptée).
- E4-5 (Q5) : un statut inconnu (non géré explicitement par le code) doit afficher AUCUN champ, jamais un sélecteur de date par défaut comme c'est le cas actuellement par erreur.
- E4-6 (Q6) : PAS de 5ème raison ajoutée pour ce sprint. Le besoin "non financée faute de budget" n'est pas traité ici. Techniquement, si une 5ème raison est ajoutée plus tard directement dans Grist par Hanta, le widget la lira automatiquement (liste dynamique, loadColumnChoices) : aucun changement de code nécessaire pour cela.
- E4-7 (Q8) : les "actions financées AAP 2026-2027" sont hors périmètre de ce sprint (filtres Financement déjà existants, non liés au statut).
- E4-8 (Q10) : nouvelle branche feature/statut-non-retenu, créée depuis main (pas depuis feature/convention, non fusionnée et à ne pas mélanger).

Questions encore ouvertes (non bloquantes, à trancher avec designer-ux/dev-interface) : Q7 (affichage tableau/synthèse), Q9 (droits d'écriture sur Raison_du_refus par profil), Q11 (largeurs exactes fr vs px), Q12 (composant liste du design system), Q13 (ordre de déploiement Grist/widget pour la colonne).

### Réponses de Hanta aux questions du §12 de docs/ux/statut-non-retenu.md (designer-ux)

- E4-9 (A, B, C) : confirmé, les trois effacements sont corrects. Passer à "Non retenu" efface la date (comme "Annulée") ; un statut inconnu voit aussi ses dates effacées ; une raison déjà remplie sur un autre statut est effacée sans avertir l'agent (cohérent avec E4-2).
- E4-10 (D) : OUI, ajouter la raison du refus à l'export CSV.
- E4-11 (E) : OUI, bloquer l'enregistrement d'une action "Non retenu" sans raison, même si l'agent modifie autre chose (cohérent avec E4-3, raison obligatoire).
- E4-12 (F) : suivre la structure d'erreur de la fenêtre d'ajout d'une action existante, pas une nouvelle structure du design system.
- E4-13 (G) : couleur (--ft-color-background-neutral-weak), seuil mobile (560 ou 700px) et largeurs de cartes (.85fr/1.15fr) acceptés tels quels pour démarrer, à confirmer visuellement une fois codé.
- E4-14 : décision de Hanta suite au travail de dev-backend. hasRaisonColumn() est accepté (même principe que Code_MEE, protection contre une colonne absente). PAS de liste de secours ajoutée pour Raison_du_refus, ni "Non retenu" dans FALLBACK_CHOICES des statuts : risque accepté pour l'instant (fonctionnalité récente, pas de donnée réelle encore en jeu), à surveiller comme dette technique si un problème de lecture Grist survient en pratique.
- E4-15 : retour d'écran de Hanta après premier essai dans DEV7. (a) Le bloc Financement est trop serré avec les largeurs .85fr/1.15fr (le texte du Financeur est coupé) : repli sur .75fr/1.25fr, déjà prévu en commentaire par dev-interface. (b) Le champ Montant est trop large visuellement : à réduire. (c) Pierre (chef de projet) préfère visuellement le style de la maquette de comparaison (fond crème, contour bleu épais, texte en gras) à la couleur actuelle du design system (--ft-color-background-neutral-weak). Décision de Hanta : NE PAS copier les couleurs de la maquette telles quelles (elles étaient approximées depuis une capture d'écran, pas les vraies variables du design system). designer-ux doit chercher l'équivalent le plus proche DANS les vraies classes du design system, pour le même esprit visuel (plus de contraste sur la sélection), sans inventer de couleur. (d) Ajouter une info-bulle (title) sur le champ Financeur, même principe que pour Raison du refus, pour voir le nom complet quand il est coupé visuellement.
- E4-16 : réponse de Hanta sur le style de la case sélectionnée (E4-15 c, proposition de designer-ux §5.1 de docs/ux/statut-non-retenu.md). Le fond crème de la maquette ne peut pas être repris (il appartiendrait à la famille "warning", déjà utilisée par "À confirmer" et "Planifiée", ce qui créerait une confusion). DÉCISION : Option A retenue - outline: 2px solid var(--ft-color-border-primary-default) sur la case CHOISIE, appliqué aux 5 statuts (pas seulement "Non retenu"), pour la cohérence visuelle. Le fond reste --ft-color-background-neutral-weak pour "Non retenu", inchangé par ailleurs. Option B (bordure permanente sur toutes les cases) rejetée, jugée superflue.
- E4-17 : correction suite à un malentendu sur E4-16. Hanta n'avait pas été consultée sur le choix entre l'option A (contour bleu seul) et l'option B (contour gris sur les 5 cases + bleu sur la choisie, §5.1 de docs/ux/statut-non-retenu.md) : Claude avait tranché seul pour A. DÉCISION FINALE DE HANTA : Option B (remplace la décision d'E4-16), avec deux contraintes précises : (1) AUCUN agrandissement des cases : un contour (outline, pas border) existe déjà au survol sans changer la taille des cases ; réutiliser ce même mécanisme pour le contour gris permanent, pas un "border" classique qui grandit la case. (2) Les cases "Annulée" et "Non retenu" doivent prendre TOUTE LA LARGEUR de leur colonne (comme sur la maquette d'origine, correspondant à l'option "grille 3+2" validée par Pierre), pas seulement épouser leur contenu (actuellement justify-self: start). ATTENTION : designer-ux avait signalé que cela faisait déborder à droite le calque visuel du design system - à vérifier concrètement à l'écran avant de considérer que c'est résolu.
- E4-18 : correction technique sur E4-17, suite à l'étude de dev-interface. Deux hypothèses de la décision E4-17 étaient inexactes : (1) le contour bleu existant (style.css:717) n'a PAS d'offset négatif, c'est un outline simple qui n'agrandit pas la grille, donc rien à reproduire à l'identique sur ce point précis ; (2) le contour au survol n'est pas un outline mais un calque ::before du design system (.with-checked-bg), positionné avec des marges négatives (top:-.75rem, left:-1.75rem, right:-.75rem, bottom:-.75rem) : si les cases "Annulée" et "Non retenu" passent en pleine largeur (retrait de justify-self: start), ce calque débordera de .75rem à droite de leur colonne, exactement le problème déjà signalé par designer-ux. DÉCISION DE HANTA : Option C, les deux chantiers sont séparés. (a) dev-interface fait D'ABORD le contour gris permanent sur les 5 cases (sans toucher à la largeur), un outline simple comme le contour bleu existant, sans offset négatif. (b) La question de la pleine largeur pour "Annulée" et "Non retenu" est mise en attente, à retravailler séparément avec designer-ux une fois (a) fait et vérifié à l'écran.
- E4-19 : deux bugs visuels constatés par Hanta à l'écran après E4-18 (captures à l'appui) : (1) Les contours des cases "A confirmer" et "Planifiée" se touchent/se chevauchent, sans espace visible entre eux, alors que dev-interface avait lui-même signalé ce risque avant de coder. (2) La case "Non retenu" n'affiche pas le même contour gris que les 4 autres statuts (moins visible ou absent), alors que le code est censé s'appliquer aux 5 cases de façon identique. Hypothèse de Hanta, à vérifier, pas à appliquer à l'aveugle : la grille actuelle (grid-template-columns: 1fr 1fr 1fr) force les 3 cases du haut à la même largeur, ce qui étire les cases à texte court (A confirmer, Planifiée) et pourrait causer le chevauchement des contours. Une largeur ajustée au contenu de chaque case (comme sur la maquette) pourrait résoudre les deux problèmes. DÉCISION : dev-interface doit D'ABORD investiguer la vraie cause (inspecter le CSS calculé à l'écran, pas deviner), expliquer précisément ce qu'il trouve, puis proposer un correctif avant de l'appliquer.
- E4-20 : bug plus grave que E4-19, constaté par Hanta en réduisant la largeur de la fenêtre (capture à l'appui). À une largeur intermédiaire (ni la pleine largeur, ni le seuil mobile de 560/700/900px), les cases de statut se CHEVAUCHENT littéralement (les boutons radio de "A confirmer" et "Planifiée" se superposent, idem pour "Annulée" et "Non retenu"), ce qui rend les statuts injouables à cette largeur. Le bloc Financement voisin a aussi du texte tronqué et mal réparti ("Montant (€)" coupé sur deux lignes, noms de financeurs tronqués). Largeur précise constatée par Hanta : le bug commence dès 1586x830. DÉCISION : dev-interface doit investiguer ce bug AVANT de corriger quoi que ce soit (même discipline que E4-19) : identifier la ou les largeurs exactes où ça casse, et la cause (grille 1fr 1fr 1fr qui ne gère pas une largeur intermédiaire, absence de seuil de repli entre 900px et 560/700px, ou autre). Ne pas deviner de correctif sans l'avoir expliqué d'abord. Mesures faites par Hanta dans DevTools : largeur d'une case de statut ('Non retenu') = 84,375px ; largeur du conteneur .status-options = 668px ; largeur du widget au moment précis où le chevauchement commence = 367,375px.
- E4-21 : la grille "repeat(auto-fill, minmax(100px, 1fr))" (E4-20) ne suffit PAS : le texte de "À confirmer" (89px mesuré) continue à déborder sur "Planifiée" à certaines largeurs intermédiaires, malgré plusieurs essais de valeurs. Après plusieurs allers-retours infructueux à deviner un chiffre minimum, DÉCISION DE HANTA : changer complètement d'approche technique. Abandonner la grille CSS à colonnes de largeur fixe/minimale (minmax), qui oblige à deviner un chiffre en pixels. Utiliser à la place un flexbox avec flex-wrap: wrap, où chaque case garde la largeur de son propre contenu (comme avec justify-self: start aujourd'hui), et où les cases passent automatiquement à la ligne suivante dès qu'il n'y a plus de place, sans qu'aucun chiffre en pixels ne soit nécessaire. Ceci élimine le besoin de mesurer quoi que ce soit : le navigateur gère lui-même le retour à la ligne selon la largeur réelle de chaque case.
- E4-23 : correction de fond sur la disposition des 5 statuts, après comparaison précise par Hanta entre la maquette et le rendu réel (captures à l'appui, décision E4-21 insuffisante). La maquette montre deux LIGNES FIXES qui remplissent chacune toute la largeur disponible (ligne 1 : 3 cases à parts égales ; ligne 2 : 2 cases à parts égales), sans espace vide à droite. Le flexbox actuel (E4-21, flex-wrap) ne fait que ce que le contenu permet, laissant un espace vide. DÉCISION DE HANTA : abandonner le flexbox à retour à la ligne automatique. Structurer explicitement en DEUX LIGNES FIXES (par exemple deux conteneurs grid séparés, un de 3 colonnes égales et un de 2 colonnes égales), chacun étiré sur toute la largeur de la carte Statut. Prévoir un repli responsive pour les écrans étroits (passage à 1 colonne par ligne, ou toute autre solution simple), à vérifier à l'écran.
- E4-24 : décision finale et définitive sur la disposition des 5 statuts, après de nombreux allers-retours (E4-16 à E4-23). Hanta a réalisé que les deux lignes de statuts ne peuvent PAS suivre des règles différentes (space-between pour l'une, groupée à gauche pour l'autre) : ce sont les mêmes statuts, dans la même carte, ça n'a pas de sens visuellement. De plus, space-between crée de grands espaces disgracieux sur un écran large. DÉCISION FINALE : LES DEUX LIGNES suivent la MÊME règle simple : chaque case garde sa largeur naturelle (comme aujourd'hui), toutes groupées à GAUCHE, avec un espace fixe de 8px entre elles (justify-content: flex-start partout, pas de space-between). On renonce à l'objectif "remplir toute la largeur comme la maquette" : ce n'était pas réalisable de façon stable à toutes les largeurs d'écran. Ce point est CLOS, à ne plus retravailler sauf demande explicite et nouvelle de Pierre.
- E4-25 : dernier défaut trouvé par Hanta (capture à l'appui) : la séparation en deux conteneurs HTML distincts (status-row-3 et status-row-2, introduite en E4-23) empêche « Annulée » et « Non retenu » de remonter sur la première ligne même quand il y a largement la place (grand écran). Les deux lignes sont rigides et ne peuvent jamais fusionner. DÉCISION FINALE DE HANTA : revenir à UN SEUL conteneur flex pour les 5 statuts (annuler la séparation en deux lignes HTML fixes de E4-23), avec flex-wrap: wrap pour un retour à la ligne 100 % automatique selon la largeur réelle. Garder tous les bons réglages déjà acquis : align-items: flex-start (E4-22, hauteur stable), chaque case en flex: 0 0 auto avec white-space: nowrap (largeur naturelle, pas de chevauchement), justify-content: flex-start, gap: 8px (E4-24, groupées à gauche, espace fixe). Le navigateur décide seul combien de cases tiennent par ligne, sans aucune règle « 3 puis 2 » forcée dans le HTML. Ce point est maintenant VRAIMENT clos.
- E4-26 : audit de sécurité réalisé sur Raison_du_refus (auditeur-securite). Aucune faille critique, haute ou moyenne. Trois points bas relevés :
  - (1) Injection de formule CSV : une raison commençant par =, +, - ou @ serait lue comme une formule par Excel. DÉCISION DE HANTA : à corriger, en préfixant d'une apostrophe toute cellule texte de l'export qui commence par ces caractères, appliqué à TOUTES les colonnes texte de l'export (pas seulement la raison).
  - (2) Message de refus d'écriture générique (pas de phrase dédiée pour un refus de droits) : accepté tel quel pour l'instant, pas bloquant pour la PROD. À retravailler plus tard si un vrai cas se présente.
  - (3) Effacement systématique de Raison_du_refus lors d'un changement de statut, qui échouerait si les droits Grist venaient un jour à protéger cette colonne spécifiquement : accepté tel quel, risque théorique non prioritaire.
  - Point annexe signalé : Raison_du_refus doit être ajoutée à la liste des colonnes écrites dans CLAUDE.md (documentation).
- E4-27 : droits d'écriture sur Raison_du_refus vérifiés par Hanta avec de VRAIS comptes (pas « Voir en tant que »), pour les profils National, Régional et Départemental. Résultat : tous les profils peuvent écrire. Aucune restriction à gérer côté code.
- E4-28 : les 7 parcours (P-01 à P-07) ont été joués par Gaylord sur TEST, le 10/11/2026. Résultat : OK pour les 7, aucune remarque négative. Pierre a validé la disposition visuelle finale. Toutes les conditions sont réunies pour la mise en PROD.

## Sprint E5 — Assurance RC Pro des clubs

Besoin d'origine : les agents France Travail ont besoin de disposer du document d'assurance RC Pro d'un club pour les actions financées. Le club transmet ce document hors de l'application (e-mail) ; un agent le dépose pour le rendre accessible au suivi. Le document concerne le CLUB (pas une action précise) : un club avec 5 actions ne doit avoir qu'un seul document, pas 5.

Pour ce sprint, on se concentre UNIQUEMENT sur le dépôt manuel via les widgets (clubs et actions-dashboard). La piste "Démarche Numérique" (collecte automatique, ProConnect) est explicitement hors périmètre, à traiter plus tard si besoin.

Décisions déjà tranchées par Hanta et Pierre :
- E5-1 : parcours retenu - un pop-up compact (formulaire commun), accessible à la fois depuis la fiche club ET depuis la fiche action, sur le modèle déjà existant du bouton "Ajouter un contact" (ouverture d'une petite fenêtre, sans navigation complète vers une autre page). Les données restent toujours rattachées au CLUB, jamais à l'action.
- E5-2 : lors d'un remplacement du document, on ÉCRASE l'ancien (pas d'historique conservé). Raison : une assurance expirée ne sert plus à rien une fois remplacée.
- E5-3 : AUCUNE lecture automatique du PDF déposé. L'attestation RC Pro est un document variable d'un assureur à l'autre, sans format standardisé. L'agent saisit la date d'expiration À LA MAIN, quel que soit le contenu du fichier.
- E5-4 : pas de donnée personnelle identifiée (le document concerne le club en tant que structure : SIRET, nom, pas une personne physique).
- E5-5 : tous les profils actuels (National, Régional, Départemental) peuvent déposer, remplacer et consulter le document. Aucune restriction de droits spécifique identifiée pour l'instant.
- E5-6 : trois états à afficher, calculés automatiquement : document absent / présent et valide / présent et expiré.

Questions encore ouvertes (à trancher avec designer-ux/chef-de-projet) :
- Q1 : quelles dates afficher précisément (expiration, dépôt, dernière mise à jour) ? Désignent-elles des événements différents à garder toutes, ou certaines suffisent ?
- Q2 : la validité doit-elle être appréciée à la date du jour, ou à la date de l'action concernée ?
- Q3 : un document expiré reste-t-il téléchargeable/consultable ?
- Q4 : le remplacement doit-il être proposé même quand le document actuel est encore valide (renouvellement anticipé) ?
- Q5 : noms exacts des tables/colonnes Grist à créer (aucune n'existe encore) : à définir par dev-backend avec l'accord de Hanta avant tout code.
