# Widget Grist - Verification QPV

Ce widget Grist indique si une adresse se situe dans un Quartier prioritaire de la politique de la ville (QPV).

## Principe

1. Le widget geocode l'adresse avec la Base Adresse Nationale.
2. Il charge les contours QPV officiels publies par l'ANCT sur data.gouv.fr.
3. Il teste si le point BAN est dans un polygone QPV.
4. Il peut afficher le resultat pour la ligne selectionnee ou ecrire les resultats dans la table Grist.

Le service API SIGVILLE existe, mais son acces SI demande un compte ANCT et une autorisation. Cette version ne depend donc pas d'une cle API.

## Structure du widget

Le code source de chaque widget est separe en HTML/CSS/JS sous `src/` :

```text
src/
  qpv-widget/index.html, style.css, script.js
  actions-dashboard/index.html, style.css, script.js
  fiche-club/index.html, style.css, script.js
  clubs/index.html, style.css, script.js
```

Grist et GitHub Pages ont besoin d'un seul fichier HTML par widget. Le script
`build.js` reassemble donc chaque dossier `src/<widget>/` en un unique fichier
`<widget>.html` a la racine du depot (`qpv-widget.html`, `actions-dashboard.html`,
`fiche-club.html`, `clubs.html`) :

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
des tables Grist, filtres, tri, listes de choix), de la fiche club et du widget
clubs (fiche, tri, taux de financement, zonages, televersement du logo, contrat
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

## Widget fiche club

`fiche-club.html` affiche la fiche du club selectionne dans la table `Structures`,
en lecture seule sauf le logo :

- en-tete : logo, nom, SIRET, adresse, zonages QPV et FRR ;
- contacts du club (table `Contacts`) : prenom, nom, e-mail, telephone ;
- actions portees par le club (table `Actions`) : date, statut, dispositif et part
  du budget couverte par les `Cofinancements`, des plus recentes aux plus
  anciennes, les actions sans date en dernier.

URL a utiliser dans Grist :

```text
https://hantaranui.github.io/grist-qpv-widget/fiche-club.html
```

Configuration : choisir `Structures` comme table du widget et lui donner l'acces
complet. Il en a besoin pour lire les autres tables et pour televerser un logo.

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

## Widget clubs

`clubs.html` est le point d'entree habituel : une liste de clubs, filtrable,
d'ou s'ouvre la fiche d'un club. Meme motif que `actions-dashboard`
(`state.view` bascule entre liste et fiche), meme contenu de fiche que
`fiche-club` ci-dessus (identite, zonages, contacts, actions), mais atteint
depuis une liste plutot qu'en associant directement une ligne au widget.

URL a utiliser dans Grist :

```text
https://hantaranui.github.io/grist-qpv-widget/clubs.html
```

Configuration : `Structures` comme table du widget, acces complet — memes
raisons que `fiche-club`.

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

- **Club** : logo, SIRET, adresse, zonages QPV et FRR — voir la section
  « Widget fiche club » ci-dessus, le code est partage a l'identique.
- **Contacts** : prenom, nom, e-mail, telephone.
- **Actions** : date, statut, dispositif, part du budget couverte, et un
  bouton **Voir** qui ouvre le detail complet de l'action (intitule, format,
  public, participants, ville, lieu, commentaire, financement) dans la meme
  carte, en lecture seule.

### Ouvrir une action dans le tableau de bord

Le detail d'une action, dans ce widget, reste en lecture seule : la fiche
modifiable de l'action vit dans `actions-dashboard`, sur une autre page Grist.
Comme Grist ne charge que les widgets de la page affichee, les deux widgets ne
peuvent pas se signaler directement tant que cette page n'est pas ouverte.

Le detail d'une action propose donc, sous son detail en lecture seule, soit un
lien reel vers cette page (si son adresse a ete renseignee), soit un champ pour
la renseigner une fois, jamais codee en dur (le depot est public, cette adresse
est propre a chaque document).

Cette adresse est gardee dans le stockage du navigateur
(`clubs-dashboard-url-v1`), pas via `grist.setOption`/`getOption` : l'API existe
et semble faite pour cela, mais son implementation cote Grist
(`WidgetAPIImpl.setOption`, dans grist-core) ne fait que modifier une valeur en
memoire, jamais sauvegardee dans le document — perdue au premier rechargement
complet de la page, constate le 2026-09-29 des le retour depuis la page
Dashboard. Consequence du choix : l'adresse est a coller une fois **par
navigateur**, pas une fois pour tout le monde.

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

## Installation dans Grist

1. Dans Grist, ajouter un widget personnalise.
2. Renseigner l'URL GitHub Pages ci-dessus.
3. Donner l'acces complet au widget si vous souhaitez qu'il ecrive les resultats dans la table.
4. Associer les colonnes dans la configuration du widget.

## Colonnes attendues

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

## Sources

- Donnees QPV : https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/
- Geocodage : https://api-adresse.data.gouv.fr/
- Documentation SIGVILLE : https://sig.ville.gouv.fr/page/174

## Limites

Le resultat depend du point retourne par la BAN. Comme l'indique SIGVILLE, la localisation d'une adresse est indicative et ne vaut pas attestation reglementaire.
