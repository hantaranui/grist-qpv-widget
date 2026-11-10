# Widgets Grist - Actions d'insertion par le sport

Ce depot contient trois widgets : le tableau de bord des actions (`actions-dashboard`), le widget `clubs`, et le widget de verification QPV (`qpv-widget`), aujourd'hui en pause (voir « Widgets en pause », en bas de ce document).

## Structure du widget

Le code source de chaque widget est separe en HTML/CSS/JS sous `src/` :

```text
src/
  qpv-widget/index.html, style.css, script.js
  actions-dashboard/index.html, style.css, script.js
  clubs/index.html, style.css, script.js
```

Grist et GitHub Pages ont besoin d'un seul fichier HTML par widget. Le script
`build.js` reassemble donc chaque dossier `src/<widget>/` en un unique fichier
`<widget>.html` a la racine du depot (`qpv-widget.html`, `actions-dashboard.html`,
`clubs.html`) :

```text
npm run build
```

A chaque modification du code, editer les fichiers dans `src/`, relancer
`npm run build`, puis commiter a la fois les sources et les fichiers generes a
la racine (aucune CI ne fait ce build automatiquement).

## Tester en local dans Grist

```text
npm run dev            sert ce dossier sur le port 8000
npm run dev -- 8001    sur un autre port
```

Le serveur affiche au demarrage l'URL de chaque widget. Coller celle du widget
voulu dans sa configuration Grist, a la place de l'URL GitHub Pages.

Il n'envoie aucun cache, donc un rechargement suffit apres `npm run build` : pas
besoin de suffixer l'URL. Chrome traite `localhost` comme une origine sure,
l'iframe n'est donc pas bloquee malgre le HTTPS de Grist.

Le port est a changer si plusieurs arbres de travail tournent en meme temps :
chacun sert ses propres fichiers assembles.

## Conformite au design system France Travail

Le widget dashboard suit le design system France Travail. Deux regles retenues
de l'audit de conformite, utiles a qui reprend le code :

- verifier les noms de classes dans la feuille livree par le CDN, jamais dans les
  pages de composants : celles-ci documentent `button--small` ou `ft-progressbar`
  la ou le CSS expose `btn-sm` et `.progress` ;
- ne jamais reprendre un nom de classe du design system, sous peine d'heriter de
  ses regles en silence. Un test verifie ce point.

Un ecart subsiste volontairement : la structure du tableau. Poser la classe
`.table` du design system fait decrocher son entete collant, et un entete qui
decroche coute plus a l'utilisateur que trois regles de filet non conformes.

## Tests

```text
npm test
```

Les tests s'executent avec le lanceur integre de Node, sans dependance. Ils
couvrent la logique pure du tableau de bord (construction des actions a partir
des tables Grist, filtres, tri, listes de choix) et du widget clubs (fiche, tri, taux de financement, zonages, televersement du logo, contacts
-- `test/clubs-contacts.test.js` pour les donnees et
`test/clubs-contacts-ecran.test.js` pour les ecrans --, contrat
de navigation vers le tableau de bord), et verifient que les fichiers HTML
assembles a la racine correspondent bien aux sources de `src/`.

`src/actions-dashboard/script.js` etant un script de page et non un module, il
est evalue dans un bac a sable muni de doublures du DOM et de l'API Grist :
voir `test/helpers/widget.js`.

`index.html` n'est qu'une redirection vers `qpv-widget.html`, conservee pour que
l'URL racine GitHub Pages ci-dessous continue de fonctionner sans changer la
configuration du widget dans Grist.

## URL GitHub Pages

```text
https://hantaranui.github.io/grist-qpv-widget/
```

## Widget dashboard des actions

Un deuxieme widget, destine au tableau de bord "Actions d'insertion par le sport", est disponible dans `actions-dashboard.html`.
Il lit les tables Grist `Actions`, `Cofinancements` et leurs tables de reference pour afficher :

- les filtres DR, DD, agence, federation, club, dispositif, statut et financement ;
- la synthese des actions et du financement global ;
- les repartitions par statut, dispositif et federation ;
- la liste detaillee des actions avec les cofinancements ;
- l'export CSV.

URL a utiliser dans Grist :

```text
https://hantaranui.github.io/grist-qpv-widget/actions-dashboard.html
```

## Widget clubs

`clubs.html` affiche une liste de clubs, filtrable, d'ou s'ouvre la fiche d'un
club (identite, zonages, contacts, actions). Meme motif que `actions-dashboard` :
`state.view` bascule entre liste et fiche.

URL a utiliser dans Grist :

```text
https://hantaranui.github.io/grist-qpv-widget/clubs.html
```

Configuration : `Structures` comme table du widget, acces complet. Il en a
besoin pour lire les autres tables et pour televerser un logo.

### Liste

Quatre filtres (Region, Departement, Federation, Club) au-dessus d'un tableau
sans en-tete de tri : Club, Code postal, Ville, DD, DR, Federation, puis un
bouton **Voir** par ligne. La federation d'un club n'est portee par aucune
colonne : elle est deduite des `Actions` qu'il porte. Dix clubs, au 28/09/2026,
en portent de plusieurs federations differentes — la liste et le filtre les
affichent toutes plutot que d'en choisir une a la place du metier.

### Fiche

Trois cartes, dans le style du tableau de bord des actions (bandeau
`ACTION`/`AGENCE`/`CLUB` de son propre formulaire) :

- **Club** : logo, nom, SIRET, adresse, zonages QPV et FRR (voir « Zonages » et
  « Logo » ci-dessous). Tout est en lecture seule, sauf le logo.
- **Contacts** (table `Contacts`) : prenom, nom, fonction (sous le nom, si elle
  est renseignee), e-mail, telephone. Cette carte et la carte Actions se
  partagent la largeur a parts egales. Voir « Contacts » ci-dessous.
- **Actions** (table `Actions`) : date, statut, dispositif, part du budget
  couverte par les `Cofinancements`, des plus recentes aux plus anciennes, les
  actions sans date en dernier, et un bouton **Voir** qui ouvre directement la fiche modifiable de l'action dans
  `actions-dashboard`, sur une autre page Grist.

### Contacts

Depuis la carte Contacts de la fiche d'un club, on peut :

- **Ajouter** un contact (bouton « Ajouter un contact ») : une fenetre demande
  Nom, Prenom, E-mail, Telephone et Fonction. **Nom et E-mail sont
  obligatoires** ; une valeur faite d'espaces compte comme vide, et l'e-mail
  doit avoir une forme valide (une arobase, du texte avant et apres, pas d'espace). Le contact est
  rattache au club ouvert.
- **Modifier** un contact (bouton icone crayon sur sa ligne) : memes champs,
  pre-remplis. Le club d'un contact ne change jamais.
- **Supprimer** un contact (bouton icone corbeille sur sa ligne) : une fenetre
  de confirmation precise que la suppression est **definitive**. Contrairement
  aux actions, qui vont a la corbeille, le contact est vraiment supprime de la
  table `Contacts`.

Chaque ecriture est une seule operation envoyee par `grist.docApi.applyUserActions`
(sans jeton). Apres une reussite, la liste est relue depuis Grist et la fiche
reste ouverte sur le meme club.

**Les droits ne sont pas decides par le widget** mais par les regles d'acces
de Grist sur la table `Contacts`. Le widget ne les devine pas : il tente
l'ecriture et, si Grist la refuse, affiche un message qui parle de droits. Si le
refus n'est pas reconnu, un message de repli evoque les droits possibles. Les
boutons restent visibles pour tous, sauf « Ajouter un contact », masque quand la
table `Contacts` ne peut pas etre lue. Les colonnes formules `DR` et `DD` de
`Contacts`, qui servent a ces regles, ne sont jamais ecrites.

Donnees personnelles : la table contient des coordonnees de personnes. La
fenetre d'ajout et de modification demande des **coordonnees professionnelles**
(e-mail et telephone de la structure), pas des coordonnees personnelles. Tout
ce qui s'affiche est echappe, et ni les valeurs saisies ni le texte brut d'une
erreur Grist ne sont ecrits dans la console ni dans un message.

### Zonages

- **QPV** : la liste des QPV de l'ANCT (data.gouv.fr) dit d'abord si la commune
  du club compte un quartier prioritaire. Si ce n'est pas le cas, le club est
  hors QPV sans autre calcul. Sinon, l'adresse est geocodee par la Base Adresse
  Nationale, restreinte a la commune du club, puis testee contre les contours,
  avec la meme logique que `qpv-widget` (un test verifie qu'elle n'a pas
  diverge). Sans adresse, ou si la BAN ne trouve ni numero ni rue, le resultat
  reste « a determiner » : un point au centre de la commune donnerait un QPV
  faux.
- **FRR** (France Ruralites Revitalisation, qui remplace les ZRR depuis le
  1er juillet 2024) : classement de la commune entiere, lu par son code INSEE
  dans `donnees/frr-communes.json`. Paris, Lyon et Marseille sont lus sur la
  commune, pas sur l'arrondissement.

La liste FRR est une copie versionnee. La liste nationale n'est pas publiee sur
data.gouv.fr, et l'Observatoire des territoires, qui la diffuse, ne l'autorise
pas a etre lue depuis une autre origine (pas d'en-tete CORS). Apres chaque nouvel
arrete de classement :

```text
npm run maj-frr
```

Les codes 2 et 3 de l'Observatoire (quelques communes nouvelles, La Reunion)
n'ont pas de libelle publie : la fiche renvoie alors vers l'Observatoire plutot
que de supposer un classement.

### Logo

Le logo existant s'affiche par l'URL de telechargement de la piece jointe,
signee d'un jeton en lecture seule. Sans logo, le bouton « Ajouter un logo »
televerse l'image vers l'API de Grist avec un jeton d'ecriture, puis ecrit la
piece jointe dans `Structures.Logo`. Ce jeton porte les droits de l'utilisateur,
jamais plus : si les regles d'acces du document ne l'autorisent pas a modifier
`Structures`, l'enregistrement est refuse et la fiche le dit.

La requete d'envoi doit porter l'en-tete `X-Requested-With: XMLHttpRequest`.
Sans lui, Grist rejette l'envoi avant meme de repondre avec ses en-tetes CORS
habituels : le navigateur ne voit alors qu'un echec reseau (« Failed to
fetch »), sans aucun detail. Constate le 2026-09-29, confirme par deux
implementations independantes (un tutoriel de la communaute Grist, un widget
deja en service sur une autre instance) qui posent toutes les deux cet
en-tete. La lecture (telechargement), elle, n'en a pas besoin.

### Ouvrir une action dans le tableau de bord

La fiche modifiable d'une action vit dans `actions-dashboard`, sur une autre
page Grist. Comme Grist ne charge que les widgets de la page affichee, les
deux widgets ne peuvent pas se signaler directement tant que cette page n'est
pas ouverte.

Des que l'adresse de cette page est connue sur cet ordinateur, **Voir** est un
vrai lien qui y mene directement. Tant qu'elle ne l'est pas, le premier clic
sur **Voir** ouvre a la place un court ecran pour la renseigner ; une fois
enregistree, ce meme ecran enchaine tout seul vers l'action visee, sans autre
clic. Les **Voir** suivants sont ensuite des liens directs.

Cette adresse a deux parties, traitees differemment :

- **le domaine du Grist qui l'heberge** — deja change plusieurs fois pendant ce
  projet, jamais a coder en dur — se deduit de `document.referrer` : une iframe
  cross-origin (notre widget, servi depuis GitHub Pages, dans une page Grist)
  n'en recoit, par la politique de referent par defaut des navigateurs
  (`strict-origin-when-cross-origin`), que l'origine de cette page — jamais son
  chemin, retire par confidentialite ;
- **le chemin propre a ce document** (organisation, identifiant, page) ne peut
  pas se deduire de la meme facon, faute justement de ce chemin dans le
  referent : c'est la seule chose que le champ demande, par exemple
  `/o/asso/docId/NomDuDocument/p/7`. Une adresse complete (avec `https://`)
  fonctionne aussi, gardee telle quelle plutot que recomposee.

Le chemin est garde dans le stockage du navigateur (`clubs-dashboard-url-v1`),
pas via `grist.setOption`/`getOption` : l'API existe et semble faite pour cela,
mais son implementation cote Grist (`WidgetAPIImpl.setOption`, dans grist-core)
ne fait que modifier une valeur en memoire, jamais sauvegardee dans le document
— perdue au premier rechargement complet de la page, constate le 2026-09-29 des
le retour depuis la page Dashboard. Consequence du choix : le chemin est a
coller une fois **par navigateur**, pas une fois pour tout le monde — et le
domaine, lui, s'ajuste tout seul si ce Grist demenage encore.

Au clic sur ce lien, juste avant que le navigateur ne suive `target="_top"`
(verifie le 2026-09-29 : l'iframe du widget n'est pas cantonnee par un
`sandbox`, un clic reel navigue bien hors d'elle — a revalider si Grist change
sa facon de poser les widgets), une autre note est deposee dans le meme
stockage, partage entre les pages d'un meme document puisque tous les widgets
d'un document viennent de la meme adresse **en production** (GitHub Pages) :

```text
cle   : clubs-ouvrir-action-v1
valeur: {"actionId": <identifiant de la ligne Grist>, "ts": <Date.now()>}
```

Le tableau de bord (branche `main`, `src/actions-dashboard/`) la lit a son
chargement, l'efface aussitot — meme illisible ou perimee, pour qu'une note
abimee ne reste pas coincee — et ouvre la fiche de l'action si la note a moins
de 20 secondes et que l'action lui est visible ; sinon il affiche son tableau
normalement, sans erreur. Cle et forme a ne changer que dans les deux widgets a
la fois.

**En local, les deux widgets doivent etre servis depuis le meme port** pour que
ce mecanisme fonctionne : `http://localhost:8001/clubs.html` et
`http://localhost:8000/actions-dashboard.html` sont deux origines differentes
aux yeux du navigateur (le port compte), qui ne partagent donc aucun stockage.
Servir les deux fichiers assembles depuis un seul `npm run dev` (un seul
dossier, un seul port) le temps du test regle ca.

## Convention de partenariat (widget dashboard des actions)

Dans la fiche d'une action, le bloc **Convention** permet de produire la
convention entre l'agence France Travail et le club, puis de garder la version
signee. Le detail (etats du bloc, textes exacts, decisions, mise en page du PDF)
est dans `docs/ux/convention.md`, qui fait foi ; les taches et les recettes sont
dans `docs/backlog.md` et `docs/tests/`.

### Ce que fait la fonction

- **Generer** un PDF a partir d'un modele (selon le dispositif de l'action),
  apres avoir choisi le signataire du club parmi ses contacts et saisi le
  representant de l'agence. Le PDF est fabrique dans le navigateur avec pdfmake,
  charge depuis cdnjs (version figee, empreinte SRI) seulement au clic.
- **Voir** le PDF genere, dans un nouvel onglet (adresse `blob:`, sans jeton).
- **Re-generer** : le nouveau PDF remplace l'ancien, sans historique.
- **Deposer** le fichier signe (PDF, 10 Mo au maximum), le **voir**, le
  **remplacer**. Les conventions sont imprimees et signees a la main : le widget
  ne fait pas de signature electronique.

### Tables lues et ecrites

| Table | Lue | Ecrite |
| --- | --- | --- |
| `Conventions` (une ligne par action) | etat du bloc, informations enregistrees | `Action`, `Modele`, `Annee`, `Signataire_club`, `Representant_agence`, `Fonction_representant` ; puis `PDF_genere` + `Date_generation`, et `PDF_signe` + `Date_depot` (chaque paire en une seule requete). Jamais `DR` ni `DD` (formules des regles d'acces) |
| `Modeles_convention` | texte du modele (`Contenu`), `Avec_annee`, `Actif`, `Logo`, `Logo_partenaire` (pieces jointes) | jamais |
| `Contacts` | signataire du club (prenom, nom, fonction) | jamais |
| `Agences` | adresse, `Siret` | jamais |

Les informations passent par `grist.docApi.applyUserActions`. Les fichiers
(PDF genere, PDF signe) et les deux dates qui les accompagnent passent par l'API
REST de Grist avec un jeton d'ecriture, car `applyUserActions` est refuse a un
non-proprietaire pour une piece jointe. Le jeton sert aussi a certaines lectures
(voir un PDF, charger les logos) : avec un jeton en lecture seule, les regles par
defaut du document refusent le telechargement a un non-proprietaire. Il n'est
jamais ecrit dans la console, un message ni une adresse affichee.

Les droits sont ceux des regles d'acces de Grist sur `Conventions` et
`Modeles_convention`. Quand Grist refuse leur lecture (c'est le cas de l'ANS), le
bloc affiche « Droits insuffisants ».

### Pieces jointes : a savoir

- Grist ne filtre pas les pieces jointes par table : la protection des PDF vient
  des regles d'acces sur `Conventions` et `Modeles_convention`, pas d'un filtre
  sur les fichiers eux-memes.
- Le widget ne supprime jamais une piece jointe. Un fichier remplace (PDF genere
  ou signe) reste dans le document, non rattache a une cellule ; Grist ne le
  nettoie pas.

### Donnees personnelles

- Nom, prenom et fonction du **signataire du club** (lus dans `Contacts`) et du
  **representant de l'agence** (saisis dans la fenetre, enregistres dans
  `Conventions`), reproduits dans le PDF.
- Le PDF signe contient en plus des **signatures manuscrites**.
- Le widget n'ecrit jamais dans `Contacts` ni de coordonnees (e-mail, telephone).
  La duree de conservation de ces fichiers n'est pas encore decidee.

## Widgets en pause

### Verification QPV (`qpv-widget`)

En pause depuis le 21/08/2026 (date du premier developpement, premier commit du depot) ; usage futur a decider par Hanta.

Ce widget Grist indique si une adresse se situe dans un Quartier prioritaire de la politique de la ville (QPV).

#### Principe

1. Le widget geocode l'adresse avec la Base Adresse Nationale.
2. Il charge les contours QPV officiels publies par l'ANCT sur data.gouv.fr.
3. Il teste si le point BAN est dans un polygone QPV.
4. Il peut afficher le resultat pour la ligne selectionnee ou ecrire les resultats dans la table Grist.

Le service API SIGVILLE existe, mais son acces SI demande un compte ANCT et une autorisation. Cette version ne depend donc pas d'une cle API.

#### Installation dans Grist

1. Dans Grist, ajouter un widget personnalise.
2. Renseigner l'URL GitHub Pages ci-dessus.
3. Donner l'acces complet au widget si vous souhaitez qu'il ecrive les resultats dans la table.
4. Associer les colonnes dans la configuration du widget.

#### Colonnes attendues

Obligatoire :

- `Adresse`

Optionnelles pour ameliorer le geocodage :

- `Code postal`
- `Commune`

Optionnelles pour l'ecriture des resultats :

- `Est en QPV`
- `Code QPV`
- `Nom QPV`
- `Adresse BAN retenue`
- `Score BAN`
- `Longitude`
- `Latitude`
- `Statut verification QPV`

#### Sources

- Donnees QPV : https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/
- Geocodage : https://api-adresse.data.gouv.fr/
- Documentation SIGVILLE : https://sig.ville.gouv.fr/page/174

#### Limites

Le resultat depend du point retourne par la BAN. Comme l'indique SIGVILLE, la localisation d'une adresse est indicative et ne vaut pas attestation reglementaire.
