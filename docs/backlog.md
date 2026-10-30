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

- **E2-1** : « Voir la convention » et « Voir la convention signée » n'ouvrent plus un nouvel onglet : ils ouvrent une pop-up (fenêtre modale), de taille confortable comme la fenêtre « Convention » actuelle (pas plein écran), qui affiche le PDF à l'intérieur du widget.
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