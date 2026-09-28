// Widget « Clubs » : une liste filtrable de la table Structures, et la fiche
// d'un club qui remplace la liste quand on clique sur « Voir ». Meme motif que
// src/actions-dashboard/ (state.view bascule entre deux vues), en plus simple :
// pas de fiche modifiable, pas de synthese, pas de tri de colonnes.
grist.ready({requiredAccess: 'full', allowSelectBy: false});

const TABLES = ['Structures', 'Communes', 'DD', 'DR', 'Federations', 'Contacts', 'Actions', 'Cofinancements', 'Dispositifs'];
const TABLE_CLUBS = 'Structures';

// --- Zonages, logo : reprises de src/fiche-club/script.js -------------------
// Meme widget conceptuellement (une fiche de club), deux surfaces distinctes
// (ici, une fiche ouverte depuis une liste). Sans module partage entre widgets
// (voir le choix documente dans le README), ces constantes et fonctions sont
// dupliquees a l'identique ; un test compare les deux fichiers et echoue si
// elles divergent.
const BAN_URL = 'https://api-adresse.data.gouv.fr/search/';
const GEO_COMMUNES_URL = 'https://geo.api.gouv.fr/communes/';
const QPV_DATASET_URL = 'https://www.data.gouv.fr/api/1/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/';
// Copie versionnee de la liste nationale : voir scripts/maj-frr.js pour la
// raison de cette copie et la facon de la rafraichir.
const FRR_URL = 'donnees/frr-communes.json';
const OBSERVATOIRE_FRR_URL = 'https://www.observatoire-des-territoires.gouv.fr/frr-france-ruralites-revitalisation';

// Meme cle que fiche-club, volontairement : les deux widgets partagent ainsi le
// meme cache navigateur de la liste des QPV (format identique), au lieu de le
// telecharger une deuxieme fois pour la meme session.
const QPV_LISTE_CACHE = 'fiche-club-qpv-liste-v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Formats qu'un <img> affiche partout. Un SVG y est inoffensif : un script qu'il
// contiendrait ne s'execute pas dans une balise image.
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const LOGO_MAX_OCTETS = 5 * 1024 * 1024;

// Libelles des codes de l'indicateur « codefrr » de l'Observatoire des
// territoires. Le fichier ne les donne pas : ils ont ete etablis en croisant les
// codes avec la couche d'une DDT qui nomme ses classements (FRR socle, FRR+,
// FRR beneficiaire, non classee), sans aucun ecart sur ses 271 communes. Les
// codes 2 (onze communes nouvelles) et 3 (La Reunion) n'y figurent pas : plutot
// que de deviner, la fiche renvoie alors vers la source.
const FRR_CLASSEMENTS = {
  '5': {verdict: 'FRR+', detail: 'commune classée en zone « plus »'},
  '4': {verdict: 'FRR', detail: 'commune classée'},
  '1': {verdict: 'Effets du FRR', detail: 'ancienne commune ZRR, sous mesure transitoire'},
  '0': {verdict: 'Hors FRR', detail: 'commune non classée'},
};

// Les requetes en ligne sont memorisees par cle : rouvrir la fiche du meme club
// reprend le resultat au lieu de relancer le geocodage et les telechargements.
const memo = new Map();
function once(key, run) {
  if (!memo.has(key)) {
    memo.set(key, run().catch(error => {
      memo.delete(key);
      throw error;
    }));
  }
  return memo.get(key);
}

// Quatre filtres demandes, dans cet ordre. Le quatrieme element est la
// propriete du club correspondante (voir buildClubs) ; « federation » est un
// tableau, les autres des chaines.
const FILTERS = [
  ['dr', 'Région', 'Toutes', 'dr'],
  ['dd', 'Département', 'Tous', 'dd'],
  ['federation', 'Fédération', 'Toutes', 'federation'],
  ['nom', 'Club', 'Tous', 'nom'],
];
// Filtres a liste deroulante avec recherche : au-dela d'une vingtaine de
// valeurs (102 DD, 78 federations, 1569 clubs), un <select> se parcourt mal.
// Region (18 valeurs) reste un select ordinaire, comme le fait deja le
// tableau de bord pour ses filtres de faible cardinalite.
const SEARCHABLE_FILTERS = new Set(['dd', 'federation', 'nom']);

const state = {
  raw: {}, clubs: [], filters: {}, view: 'list', currentId: null,
  // Jeton en lecture seule pour l'URL du logo, l'etat du televersement en
  // cours, les tables refusees par les regles d'acces (Contacts/Actions le
  // disent alors plutot que d'afficher une liste vide a tort), et l'action
  // dont le detail est ouvert dans la carte Actions.
  readAccess: null,
  upload: {busy: false, message: '', kind: ''},
  unreadable: [],
  actionId: null,
};

// Element a rendre le focus en quittant le detail d'une action, pour la meme
// raison que focusAvantFiche.
let focusAvantAction = null;

// Element a rendre focus en quittant la fiche : le bouton « Voir » qui l'a
// ouverte, pour que la navigation au clavier ou au lecteur d'ecran revienne
// exactement ou elle etait.
let focusAvantFiche = null;

document.getElementById('resetBtn').addEventListener('click', () => {
  state.filters = {};
  render();
});

document.addEventListener('pointerdown', event => {
  if (event.target.closest('.filter-search-dropdown')) return;
  document.querySelectorAll('.filter-search-dropdown[open]').forEach(dropdown => dropdown.removeAttribute('open'));
});

load();

async function load() {
  try {
    const [{raw, unreadable}, readAccess] = await Promise.all([
      loadTables(),
      // Jeton en lecture seule pour l'URL du logo : construit une fois, reutilise
      // pour toute fiche ouverte ensuite (voir logoUrl). Un rechargement (par
      // exemple apres un ajout de logo) en redemande un, le premier expirant au
      // bout de quelques minutes.
      grist.docApi.getAccessToken({readOnly: true}).catch(() => null),
    ]);
    state.raw = raw;
    state.unreadable = unreadable;
    state.clubs = buildClubs(state.raw);
    state.readAccess = readAccess;
    render();
  } catch (error) {
    document.getElementById('rows').innerHTML = '';
    document.getElementById('empty').classList.remove('is-hidden');
    document.getElementById('empty').textContent = "Impossible de lire les tables Grist. Vérifiez que le widget a l'accès complet.";
    console.error(error);
  }
}

// Structures est indispensable (c'est la liste elle-meme) ; les autres tables
// restent optionnelles, chacune manquante se contentant de vider sa part de la
// fiche plutot que le widget entier.
async function loadTables() {
  const unreadable = [];
  const entries = await Promise.all(TABLES.map(async table => {
    try {
      return [table, rows(await grist.docApi.fetchTable(table))];
    } catch (error) {
      if (table === 'Structures') throw error;
      console.warn(`Table illisible : ${table}`, error);
      unreadable.push(table);
      return [table, []];
    }
  }));
  return {raw: Object.fromEntries(entries), unreadable};
}

function rows(table) {
  const ids = table.id || [];
  return ids.map((id, index) => {
    const row = {id};
    Object.keys(table).forEach(key => {
      if (key !== 'id') row[key] = table[key][index];
    });
    return row;
  });
}

function byId(items) {
  return new Map(items.map(item => [item.id, item]));
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function attachmentIds(value) {
  if (Array.isArray(value)) return value.filter(item => Number.isInteger(item) && item > 0);
  if (Number.isInteger(value) && value > 0) return [value];
  if (typeof value === 'string') return value.split(',').map(Number).filter(item => Number.isInteger(item) && item > 0);
  return [];
}

// ---------------------------------------------------------------------------
// Construction de la liste
// ---------------------------------------------------------------------------

function buildClubs(raw) {
  const dds = byId(raw.DD || []);
  const drs = byId(raw.DR || []);
  const federations = byId(raw.Federations || []);
  const communesParInsee = new Map((raw.Communes || []).map(commune => [text(commune.Code_Insee), commune]));

  // La fedeation d'un club n'est portee par aucune colonne : on la deduit de
  // ses actions. Un ensemble, pas une valeur unique — 10 clubs sur 1569
  // portent des actions de plusieurs federations, et rien ne dit laquelle
  // retenir a leur place (voir README).
  const federationIdsParClub = new Map();
  (raw.Actions || []).forEach(action => {
    if (!action.Club || !action.Federation) return;
    if (!federationIdsParClub.has(action.Club)) federationIdsParClub.set(action.Club, new Set());
    federationIdsParClub.get(action.Club).add(action.Federation);
  });

  return (raw.Structures || [])
    .map(structure => {
      const dd = dds.get(structure.DD) || {};
      const dr = drs.get(dd.DR) || {};
      const commune = communesParInsee.get(text(structure.Code_Insee)) || {};
      const federationNoms = [...(federationIdsParClub.get(structure.id) || [])]
        .map(id => text((federations.get(id) || {}).Nom))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'fr'));

      return {
        id: structure.id,
        nom: text(structure.Nom),
        siret: text(structure.SIRET),
        adresse: text(structure.Adresse),
        codePostal: text(structure.Code_postal),
        codeInsee: text(structure.Code_Insee),
        ville: text(commune.Libelle_Commune),
        dd: text(dd.Nom),
        dr: text(dr.Nom),
        federations: federationNoms,
        logoIds: attachmentIds(structure.Logo),
      };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

function filteredClubs() {
  return state.clubs.filter(club => Object.entries(state.filters).every(([key, value]) => {
    if (key === 'federation') return club.federations.includes(value);
    return club[key] === value;
  }));
}

function optionsFor(key) {
  const values = new Set();
  state.clubs.forEach(club => {
    if (key === 'federation') club.federations.forEach(value => values.add(value));
    else if (club[key]) values.add(club[key]);
  });
  return [...values].sort((a, b) => a.localeCompare(b, 'fr'));
}

// ---------------------------------------------------------------------------
// Rendu de la liste
// ---------------------------------------------------------------------------

function render() {
  renderFilters();
  const clubs = filteredClubs();
  renderRows(clubs);
  const ficheOuverte = state.view === 'fiche';
  document.getElementById('ficheView').classList.toggle('is-hidden', !ficheOuverte);
  document.getElementById('listView').classList.toggle('is-hidden', ficheOuverte);
  if (ficheOuverte) renderFiche();
  requestResize();
}

function requestResize() {
  requestAnimationFrame(() => {
    if (window.grist && typeof grist.setHeight === 'function') {
      grist.setHeight(document.documentElement.scrollHeight);
    }
  });
}

function renderFilters() {
  const container = document.getElementById('filters');
  container.innerHTML = FILTERS.map(([key, label, tous]) => {
    const selected = state.filters[key] || '';
    const values = optionsFor(key);

    if (SEARCHABLE_FILTERS.has(key)) {
      return `<div class="filter-field">
        <span class="form-label" id="filter-${key}-label">${escapeHtml(label)}</span>
        <details class="filter-search-dropdown">
          <summary class="form-control" aria-labelledby="filter-${key}-label"><span>${escapeHtml(selected || tous)}</span></summary>
          <div class="filter-search-panel">
            <input class="form-control filter-search-input" type="search" data-filter-search="${key}" placeholder="Rechercher" aria-label="Rechercher ${escapeAttr(label)}">
            <div class="filter-search-options">
              <button class="filter-search-option" type="button" data-filter-key="${key}" data-filter-value="">${escapeHtml(tous)}</button>
              ${values.map(value => `<button class="filter-search-option" type="button" data-filter-key="${key}" data-filter-value="${escapeAttr(value)}" title="${escapeAttr(value)}">${escapeHtml(value)}</button>`).join('')}
            </div>
          </div>
        </details>
      </div>`;
    }

    return `<div class="filter-field">
      <label class="form-label" for="filter-${key}">${escapeHtml(label)}</label>
      <select class="form-control" id="filter-${key}" name="filter-${key}" data-filter="${key}">
        <option value="">${escapeHtml(tous)}</option>
        ${values.map(value => `<option value="${escapeAttr(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}
      </select>
    </div>`;
  }).join('');

  container.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', event => {
      const key = event.target.dataset.filter;
      state.filters[key] = event.target.value;
      if (!state.filters[key]) delete state.filters[key];
      render();
    });
  });

  container.querySelectorAll('[data-filter-search]').forEach(input => {
    input.addEventListener('input', event => {
      const query = normalizeText(event.target.value);
      const key = event.target.dataset.filterSearch;
      container.querySelectorAll(`[data-filter-key="${key}"]`).forEach(option => {
        option.hidden = query && !normalizeText(option.dataset.filterValue).includes(query);
      });
    });
  });

  container.querySelectorAll('[data-filter-key]').forEach(option => {
    option.addEventListener('click', event => {
      const key = event.currentTarget.dataset.filterKey;
      const value = event.currentTarget.dataset.filterValue;
      if (value) state.filters[key] = value;
      else delete state.filters[key];
      render();
    });
  });
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('fr');
}

function renderRows(clubs) {
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  empty.classList.toggle('is-hidden', clubs.length > 0);
  tbody.innerHTML = clubs.map(club => `
    <tr>
      <td class="club-name">${escapeHtml(club.nom || 'Club sans nom')}</td>
      <td>${escapeHtml(club.codePostal) || missingCell()}</td>
      <td>${escapeHtml(club.ville) || missingCell()}</td>
      <td>${escapeHtml(club.dd) || missingCell()}</td>
      <td>${escapeHtml(club.dr) || missingCell()}</td>
      <td>${club.federations.length ? escapeHtml(club.federations.join(', ')) : missingCell()}</td>
      <td><button class="btn btn-secondary btn-sm" type="button" data-open-club="${club.id}"><span class="btn-content">Voir</span></button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-open-club]').forEach(button => {
    button.addEventListener('click', () => {
      // Le bouton qui a ouvert la fiche recupere le focus au retour : sans ceci,
      // le focus resterait sur un bouton « Voir » remplace par le rendu suivant
      // de la liste, perdu pour le clavier comme pour un lecteur d'ecran.
      focusAvantFiche = button;
      state.currentId = Number(button.dataset.openClub);
      state.view = 'fiche';
      state.upload = {busy: false, message: '', kind: ''};
      state.actionId = null;
      render();
    });
  });
}

// Une valeur non renseignee reste distinguable d'une cellule vide par erreur,
// pour un lecteur d'ecran comme a l'oeil.
function missingCell() {
  return '<span class="muted-text"><span aria-hidden="true">—</span><span class="sr-only">Non renseigné</span></span>';
}

function closeFiche() {
  state.view = 'list';
  state.currentId = null;
  state.actionId = null;
  render();
  if (focusAvantFiche && document.body.contains(focusAvantFiche)) focusAvantFiche.focus();
  focusAvantFiche = null;
}

// ---------------------------------------------------------------------------
// Fiche : identite du club, zonages QPV et FRR. Contacts et actions suivent
// dans une prochaine etape, en cartes separees sous celle-ci.
// ---------------------------------------------------------------------------

function isCurrent(club) {
  return state.currentId === club.id;
}

function renderFiche() {
  const club = state.clubs.find(item => item.id === state.currentId);
  const ficheView = document.getElementById('ficheView');
  if (!club) {
    state.view = 'list';
    render();
    return;
  }
  const detail = buildFicheDetail(state.raw, club.id);
  const actionOuverte = state.actionId !== null ? detail.actions.find(item => item.id === state.actionId) : null;
  if (state.actionId !== null && !actionOuverte) state.actionId = null;

  ficheView.innerHTML = `
    <div class="edit-panel">
      <header class="edit-header">
        <div class="edit-header-title"><h1 id="clubName" tabindex="-1">${escapeHtml(club.nom || 'Club sans nom')}</h1></div>
        <div class="edit-header-actions"><button class="btn btn-secondary" type="button" id="backToList"><span class="btn-content">&larr; Retour à la liste</span></button></div>
      </header>
      <div class="edit-layout">
        <section class="edit-card">
          <div class="section-head"><span>Club</span></div>
          <div class="card-body">
            <div class="club-summary-header">
              ${renderLogo(club, logoUrl(club.logoIds, state.readAccess), state.upload)}
              <div class="club-identity">
                <p class="club-line">SIRET : ${club.siret ? escapeHtml(formatSiret(club.siret)) : '<span class="muted-text">non renseigné</span>'}</p>
                <p class="club-line" id="clubAddress">${renderAddress(club, club.ville)}</p>
                <dl class="zonages">
                  <div class="zonage"><dt>QPV</dt><dd id="qpvResult">${club.codeInsee ? 'Vérification en cours…' : renderQpv({etat: 'sans-code'})}</dd></div>
                  <div class="zonage"><dt>FRR</dt><dd id="frrResult">${club.codeInsee ? 'Vérification en cours…' : renderFrr({etat: 'sans-code'})}</dd></div>
                </dl>
                <p class="zonage-note">Le zonage France Ruralités Revitalisation (FRR) remplace les zones de revitalisation rurale (ZRR) depuis le 1<sup>er</sup> juillet 2024.</p>
              </div>
            </div>
          </div>
        </section>
        <div class="edit-row-lists">
          <section class="edit-card" aria-labelledby="contactsTitle">
            <div class="section-head"><span id="contactsTitle">Contacts</span></div>
            <div class="card-body">
              ${state.unreadable.includes('Contacts')
                ? '<p class="empty-note">Vos droits ne permettent pas de lire les contacts.</p>'
                : renderContacts(detail.contacts)}
            </div>
          </section>
          <section class="edit-card" aria-labelledby="actionsTitle">
            <div class="section-head"><span id="actionsTitle">Actions</span></div>
            <div class="card-body">
              ${actionOuverte
                ? renderActionDetail(actionOuverte)
                : (state.unreadable.includes('Actions')
                  ? '<p class="empty-note">Vos droits ne permettent pas de lire les actions.</p>'
                  : renderActionsList(detail.actions))}
            </div>
          </section>
        </div>
      </div>
    </div>
  `;
  document.getElementById('backToList').addEventListener('click', closeFiche);
  bindLogo(club);
  fillCommune(club);
  fillZonages(club);

  if (actionOuverte) {
    document.getElementById('backToActions').addEventListener('click', closeActionDetail);
    document.getElementById('actionDetailTitle').focus();
  } else {
    document.getElementById('clubName').focus();
    bindActionButtons();
  }
}

function bindActionButtons() {
  document.querySelectorAll('[data-open-action]').forEach(button => {
    button.addEventListener('click', () => {
      focusAvantAction = button;
      state.actionId = Number(button.dataset.openAction);
      render();
    });
  });
}

function closeActionDetail() {
  state.actionId = null;
  render();
  if (focusAvantAction && document.body.contains(focusAvantAction)) focusAvantAction.focus();
  focusAvantAction = null;
}

// ---------------------------------------------------------------------------
// Contacts et actions : construction et rendu. Meme calcul, mêmes libelles que
// fiche-club (voir la note en tete de fichier) ; « Voir » ouvre ici le detail
// d'une action dans la meme carte, en lecture seule — c'est le contournement
// convenu tant que le tableau de bord (sur une autre page, une autre branche)
// n'ecoute pas de navigation entrante.
// ---------------------------------------------------------------------------

function buildFicheDetail(raw, clubId) {
  const contacts = (raw.Contacts || [])
    .filter(contact => contact.Club === clubId)
    .map(contact => ({
      id: contact.id,
      prenom: text(contact.Prenom),
      nom: text(contact.Nom),
      email: text(contact.Email),
      telephone: text(contact.Telephone),
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr') || a.id - b.id);

  const dispositifs = byId(raw.Dispositifs || []);
  const financed = new Map();
  (raw.Cofinancements || []).forEach(cof => {
    if (cof.Action) financed.set(cof.Action, (financed.get(cof.Action) || 0) + Number(cof.Montant || 0));
  });

  const actions = sortActions((raw.Actions || [])
    .filter(action => action.Club === clubId)
    .map(action => {
      const dispositif = dispositifs.get(action.Dispositif) || {};
      const budget = Number(action.Budget || 0);
      const montant = financed.get(action.id) || 0;
      return {
        id: action.id,
        intitule: text(action.Intitule),
        date: dateSeconds(action.Date),
        periode: text(action.Periode_approx),
        statut: text(action.Statut),
        dispositif: text(dispositif.Dispositif || dispositif.Code),
        format: text(action.Format),
        public: formatChoiceList(action.Public),
        participants: Number(action.Jauge || 0),
        ville: text(action.Ville),
        lieu: text(action.Lieu),
        commentaire: text(action.Commentaire),
        budget,
        financed: montant,
        rate: coverage(montant, budget),
      };
    }));

  return {contacts, actions};
}

// Meme calcul que la colonne Financement du tableau de bord des actions : somme
// des cofinancements rapportee au budget. Sans budget, le taux n'a pas de sens :
// on renvoie null plutot que 0, qui laisserait croire que rien n'est finance.
function coverage(financed, budget) {
  return budget > 0 ? financed / budget : null;
}

function percent(rate) {
  return Math.round(rate * 100);
}

// Plus recentes d'abord. Les actions sans date (souvent « A confirmer », datees
// d'une periode approximative) passent en fin de liste, les plus recemment
// saisies en tete.
function sortActions(actions) {
  return [...actions].sort((a, b) => {
    if (a.date !== null && b.date !== null && a.date !== b.date) return b.date - a.date;
    if ((a.date === null) !== (b.date === null)) return a.date === null ? 1 : -1;
    return b.id - a.id;
  });
}

// fetchTable livre les dates en secondes depuis l'epoque ; on accepte aussi un
// objet Date ou une chaine ISO, que renvoient d'autres chemins de l'API.
function dateSeconds(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time / 1000 : null;
}

function formatDate(seconds) {
  // Grist range une date seule a minuit UTC : l'afficher dans le fuseau du
  // navigateur la ferait reculer d'un jour a l'ouest de Greenwich.
  return new Date(seconds * 1000).toLocaleDateString('fr-FR', {timeZone: 'UTC'});
}

function formatEuro(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')} €`;
}

// Une colonne ChoiceList arrive encodee ['L', 'BRSA', 'QPV'] par fetchTable.
function choiceValues(value) {
  if (!Array.isArray(value)) return value ? [String(value)] : [];
  return value[0] === 'L' ? value.slice(1) : value;
}

function formatChoiceList(value) {
  return choiceValues(value).join(', ');
}

// Numero francais a dix chiffres converti au format international, que tous les
// telephones et logiciels de telephonie savent composer.
function telHref(value) {
  const digits = value.replace(/[^\d+]/g, '');
  if (!digits) return null;
  return 'tel:' + (/^0\d{9}$/.test(digits) ? '+33' + digits.slice(1) : digits);
}

function mailHref(value) {
  return /^[^\s@]+@[^\s@]+$/.test(value) ? 'mailto:' + value : null;
}

function renderContacts(contacts) {
  if (!contacts.length) return '<p class="empty-note">Aucun contact enregistré pour ce club.</p>';
  return `<ul class="contact-list">${contacts.map(contact => {
    const nom = [contact.prenom, contact.nom].filter(Boolean).join(' ') || 'Contact sans nom';
    const mail = mailHref(contact.email);
    const tel = telHref(contact.telephone);
    return `<li class="contact-item">
      <span class="contact-name">${escapeHtml(nom)}</span>
      ${mail ? `<a class="contact-mail" href="${escapeAttr(mail)}">${escapeHtml(contact.email)}</a>` : missing('E-mail non renseigné', contact.email)}
      ${tel ? `<a class="contact-tel" href="${escapeAttr(tel)}">${escapeHtml(contact.telephone)}</a>` : missing('Téléphone non renseigné', contact.telephone)}
    </li>`;
  }).join('')}</ul>`;
}

// Une valeur saisie mais inexploitable comme lien reste affichee telle quelle.
function missing(label, value) {
  if (value) return `<span>${escapeHtml(value)}</span>`;
  return `<span class="muted-text"><span aria-hidden="true">—</span><span class="sr-only">${escapeHtml(label)}</span></span>`;
}

// Quatre colonnes, dans l'ordre de la maquette : date, statut, dispositif,
// financement. Sans date, la periode approximative saisie tient lieu de date.
// Un bouton « Voir » de plus qu'a fiche-club : ouvre le detail complet de
// l'action, dans cette meme carte.
function renderActionsList(actions) {
  if (!actions.length) return '<p class="empty-note">Aucune action portée par ce club.</p>';
  return `<ul class="action-list">${actions.map(action => `<li class="action-item">
      <span class="action-date">${action.date !== null ? escapeHtml(formatDate(action.date)) : escapeHtml(action.periode) || '<span class="muted-text">Date à définir</span>'}</span>
      <span class="action-status">${action.statut ? `<span class="status-tag ${statusClass(action.statut)}">${escapeHtml(action.statut)}</span>` : missing('Statut non renseigné', '')}</span>
      <span class="action-dispositif">${action.dispositif ? escapeHtml(action.dispositif) : '<span class="muted-text">Dispositif non renseigné</span>'}</span>
      ${renderFunding(action)}
      <button class="btn btn-secondary btn-sm" type="button" data-open-action="${action.id}"><span class="btn-content">Voir</span></button>
    </li>`).join('')}</ul>`;
}

function renderFunding(action) {
  if (action.rate === null) {
    return '<span class="action-funding"><span class="muted-text">Budget non renseigné</span></span>';
  }
  const value = percent(action.rate);
  // La barre plafonne a 100 % ; le texte, lui, dit le depassement eventuel.
  const bar = Math.min(value, 100);
  return `<span class="action-funding">
      <span class="progress funding-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${bar}" aria-valuetext="${value} % du budget financé" aria-label="Part du budget financée"><span class="progress-bar" style="width:${bar}%"></span></span>
      <span class="funding-rate">${value} % financé</span>
    </span>`;
}

function statusClass(status) {
  return String(status)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Le detail complet d'une action, en lecture seule : c'est « la fiche de
// l'action » demandee, faute de pouvoir ouvrir celle, modifiable, du tableau de
// bord depuis une autre page (voir la note en tete de section).
function renderActionDetail(action) {
  const participants = action.participants > 0 ? String(action.participants) : missing('Nombre de participants non renseigné', '');
  return `
    <div class="action-detail">
      <button class="btn btn-secondary btn-sm" type="button" id="backToActions"><span class="btn-content">&larr; Retour aux actions</span></button>
      <h3 id="actionDetailTitle" tabindex="-1">${escapeHtml(action.intitule || action.dispositif || 'Action sans intitulé')}</h3>
      <p class="club-line">
        ${action.statut ? `<span class="status-tag ${statusClass(action.statut)}">${escapeHtml(action.statut)}</span>` : missing('Statut non renseigné', '')}
        · ${action.date !== null ? escapeHtml(formatDate(action.date)) : (action.periode ? escapeHtml(action.periode) : '<span class="muted-text">Date à définir</span>')}
      </p>
      <dl class="action-fields">
        <div><dt>Dispositif</dt><dd>${action.dispositif ? escapeHtml(action.dispositif) : missing('Dispositif non renseigné', '')}</dd></div>
        <div><dt>Format</dt><dd>${action.format ? escapeHtml(action.format) : missing('Format non renseigné', '')}</dd></div>
        <div><dt>Public</dt><dd>${action.public ? escapeHtml(action.public) : missing('Public non renseigné', '')}</dd></div>
        <div><dt>Participants</dt><dd>${participants}</dd></div>
        <div><dt>Ville</dt><dd>${action.ville ? escapeHtml(action.ville) : missing('Ville non renseignée', '')}</dd></div>
        <div><dt>Lieu</dt><dd>${action.lieu ? escapeHtml(action.lieu) : missing('Lieu non renseigné', '')}</dd></div>
      </dl>
      ${action.commentaire ? `<p class="club-line"><strong>Commentaire</strong><br>${escapeHtml(action.commentaire)}</p>` : ''}
      <p class="club-line">Budget : <strong>${formatEuro(action.budget)}</strong></p>
      ${renderFunding(action)}
    </div>`;
}

function renderAddress(club, communeName) {
  const ville = addressLine({...club, adresse: ''}, communeName);
  if (club.adresse) return escapeHtml(addressLine(club, communeName));
  return `<span class="muted-text">Adresse non renseignée</span>${ville ? ' · ' + escapeHtml(ville) : ''}`;
}

function renderLogo(club, url, upload) {
  if (club.logoIds.length && url) {
    return `<div class="club-logo"><img src="${escapeAttr(url)}" alt="Logo de ${escapeAttr(club.nom || 'ce club')}"></div>`;
  }
  // Un logo existe mais son adresse n'a pu etre construite (jeton refuse) : on
  // ne propose surtout pas d'en ajouter un second.
  if (club.logoIds.length) {
    return '<div class="club-logo club-logo-empty"><span class="muted-text">Logo non affichable</span></div>';
  }
  const message = upload.message
    ? `<p class="logo-message ${upload.kind === 'error' ? 'is-error' : ''}" role="${upload.kind === 'error' ? 'alert' : 'status'}">${escapeHtml(upload.message)}</p>`
    : '';
  return `
    <div class="club-logo club-logo-empty">
      <span class="muted-text">Pas de logo</span>
      <button class="btn btn-secondary btn-sm" type="button" id="addLogo"${upload.busy ? ' disabled' : ''}><span class="btn-content">${upload.busy ? 'Envoi en cours…' : 'Ajouter un logo'}</span></button>
      <input class="logo-input" type="file" id="logoInput" accept="${LOGO_TYPES.join(',')}" tabindex="-1" aria-hidden="true">
      ${message}
    </div>`;
}

function renderQpv(result) {
  switch (result.etat) {
    case 'dans':
      return `<strong>En QPV</strong> — ${escapeHtml(result.quartier.nom)} (${escapeHtml(result.quartier.code)})${result.precision === 'rue' ? ' <span class="muted-text">· adresse localisée à la rue</span>' : ''}`;
    case 'hors':
      return `<strong>Hors QPV</strong>${result.precision === 'rue' ? ' <span class="muted-text">· adresse localisée à la rue</span>' : ''}`;
    case 'commune-sans-qpv':
      return '<strong>Hors QPV</strong> <span class="muted-text">· aucun quartier prioritaire dans la commune</span>';
    case 'sans-adresse':
      // Sans rue, le geocodage tomberait au centre de la commune : un resultat
      // faux, pire que pas de resultat.
      return `<strong>À déterminer</strong> <span class="muted-text">· la commune compte ${result.nombre} quartier${result.nombre > 1 ? 's' : ''} prioritaire${result.nombre > 1 ? 's' : ''} ; l'adresse du club est nécessaire</span>`;
    case 'imprecise':
      return "<strong>À déterminer</strong> <span class=\"muted-text\">· la Base Adresse Nationale ne localise pas précisément l'adresse du club</span>";
    case 'sans-code':
      return '<strong>À déterminer</strong> <span class="muted-text">· code INSEE du club non renseigné</span>';
    default:
      return '<strong>Vérification impossible</strong> <span class="muted-text">· service en ligne indisponible</span>';
  }
}

function renderFrr(result) {
  if (result.etat === 'classement') {
    const known = FRR_CLASSEMENTS[result.classement];
    if (known) return `<strong>${escapeHtml(known.verdict)}</strong> <span class="muted-text">· ${escapeHtml(known.detail)}</span>`;
    return `<strong>Situation particulière</strong> <span class="muted-text">· <a href="${OBSERVATOIRE_FRR_URL}" target="_blank" rel="noopener">vérifier sur l'Observatoire des territoires<span class="sr-only"> (nouvelle fenêtre)</span></a></span>`;
  }
  if (result.etat === 'inconnue') {
    return `<strong>À vérifier</strong> <span class="muted-text">· commune ${escapeHtml(result.code)} absente de la liste FRR ${escapeHtml(result.geographie || '')}</span>`;
  }
  if (result.etat === 'sans-code') {
    return '<strong>À déterminer</strong> <span class="muted-text">· code INSEE du club non renseigné</span>';
  }
  return '<strong>Vérification impossible</strong> <span class="muted-text">· liste FRR indisponible</span>';
}

// ---------------------------------------------------------------------------
// Mise en forme, commune et zonages en ligne — dupliques de fiche-club, voir
// la note en tete de fichier.
// ---------------------------------------------------------------------------

function formatSiret(value) {
  const digits = value.replace(/\s/g, '');
  return /^\d{14}$/.test(digits) ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4') : value;
}

function logoUrl(ids, access) {
  if (!ids.length || !access || !access.token || !access.baseUrl) return null;
  return `${access.baseUrl}/attachments/${ids[0]}/download?auth=${encodeURIComponent(access.token)}`;
}

function addressLine(club, communeName) {
  const ville = [club.codePostal, communeName].filter(Boolean).join(' ');
  return [club.adresse, ville].filter(Boolean).join(', ');
}

// Paris, Lyon et Marseille : les clubs portent souvent le code de leur
// arrondissement, alors que les listes QPV et FRR raisonnent sur la commune.
function parentCommune(code) {
  if (/^751(0[1-9]|1\d|20)$/.test(code)) return '75056';
  if (/^6938[1-9]$/.test(code)) return '69123';
  if (/^132(0[1-9]|1[0-6])$/.test(code)) return '13055';
  return code;
}

function communeCodes(value) {
  return String(value || '').toUpperCase().match(/[0-9][0-9AB]\d{3}/g) || [];
}

function writeInto(id, html) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = html;
}

async function fillCommune(club) {
  if (!club.codeInsee || club.ville) return;
  try {
    const name = await communeName(club.codeInsee);
    if (isCurrent(club)) writeInto('clubAddress', renderAddress(club, name));
  } catch (error) {
    // Le code postal reste affiche : le nom de commune n'est qu'un confort.
    console.warn('Nom de commune indisponible', error);
  }
}

function communeName(code) {
  return once(`commune:${code}`, async () => {
    const response = await fetch(`${GEO_COMMUNES_URL}${encodeURIComponent(code)}?fields=nom`);
    if (!response.ok) throw new Error(`geo.api.gouv.fr ${response.status}`);
    return (await response.json()).nom || '';
  });
}

function fillZonages(club) {
  if (!club.codeInsee) return;
  frrFor(club.codeInsee)
    .catch(error => {
      console.warn('FRR', error);
      return {etat: 'erreur'};
    })
    .then(result => isCurrent(club) && writeInto('frrResult', renderFrr(result)));
  qpvFor(club)
    .catch(error => {
      console.warn('QPV', error);
      return {etat: 'erreur'};
    })
    .then(result => isCurrent(club) && writeInto('qpvResult', renderQpv(result)));
}

// --- FRR : la commune entiere est classee ou non, pas de geometrie a tester.

async function frrFor(codeInsee) {
  const frr = await loadFrr();
  return frrStatus(frr, codeInsee);
}

function loadFrr() {
  return once('frr', async () => {
    const response = await fetch(FRR_URL);
    if (!response.ok) throw new Error(`Liste FRR ${response.status}`);
    return indexFrr(await response.json());
  });
}

function indexFrr(data) {
  const index = new Map();
  Object.entries(data.communes || {}).forEach(([classement, codes]) => {
    codes.split(' ').forEach(code => code && index.set(code, classement));
  });
  return {index, geographie: data.geographie || '', extraitLe: data.extraitLe || ''};
}

function frrStatus(frr, codeInsee) {
  const code = parentCommune(codeInsee);
  if (!code) return {etat: 'sans-code'};
  const classement = frr.index.get(code);
  if (classement === undefined) return {etat: 'inconnue', code, geographie: frr.geographie};
  return {etat: 'classement', classement, code};
}

// --- QPV : infra-communal. On ecarte d'abord les communes sans quartier
// prioritaire, ce qui regle la moitie des clubs sans adresse ni geocodage ; les
// autres demandent l'adresse, le geocodage BAN et le test du point dans les
// contours, comme le widget qpv-widget.

async function qpvFor(club) {
  const commune = parentCommune(club.codeInsee);
  const liste = await loadQpvList();
  const quartiers = liste.get(commune) || [];
  if (!quartiers.length) return {etat: 'commune-sans-qpv'};
  if (!hasUsableStreetAddress(club.adresse)) return {etat: 'sans-adresse', nombre: quartiers.length};

  const geocoded = await geocode(club);
  if (!geocoded) return {etat: 'imprecise'};

  const contours = await loadQpvContours();
  const candidats = contours.filter(feature => communeCodes(feature.properties && feature.properties.insee_com).includes(commune));
  const feature = candidats.find(item => geometryContainsPoint(item.geometry, geocoded.point));
  const precision = geocoded.type === 'street' ? 'rue' : 'numero';
  if (!feature) return {etat: 'hors', precision};
  return {etat: 'dans', precision, quartier: {code: feature.properties.code_qp || '', nom: feature.properties.lib_qp || ''}};
}

// Meme garde-fou que qpv-widget : une valeur comme « Oui » ou un nom de salle
// n'est pas une adresse, et la geocoder donnerait un point arbitraire.
function hasUsableStreetAddress(adresse) {
  const street = String(adresse || '').toLowerCase();
  return Boolean(street) && street !== 'oui' && street !== 'non' &&
    /\d|rue|avenue|av\.|boulevard|bd|chemin|route|place|allee|allée|impasse|quai|cours|square/.test(street);
}

async function geocode(club) {
  const url = new URL(BAN_URL);
  url.searchParams.set('q', [club.adresse, club.codePostal].filter(Boolean).join(' '));
  url.searchParams.set('limit', '1');
  url.searchParams.set('autocomplete', '0');
  // Restreindre a la commune du club evite qu'une rue homonyme d'une autre ville
  // l'emporte.
  url.searchParams.set('citycode', club.codeInsee);
  const key = `ban:${url}`;
  return once(key, async () => {
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Géocodage BAN impossible (${response.status}).`);
    return banResult(await response.json());
  });
}

// Seuls un numero ou une rue situent le club ; un resultat au lieu-dit ou a la
// commune le placerait au centre de celle-ci, d'ou un QPV faux.
function banResult(data) {
  const feature = data && data.features && data.features[0];
  if (!feature || !feature.geometry) return null;
  const type = feature.properties && feature.properties.type;
  if (type !== 'housenumber' && type !== 'street') return null;
  return {point: feature.geometry.coordinates, type, label: feature.properties.label || ''};
}

function loadQpvList() {
  return once('qpv-liste', async () => {
    const cached = readCache(QPV_LISTE_CACHE);
    if (cached) return new Map(cached);
    const metadata = await fetchJson(QPV_DATASET_URL);
    const resource = selectQpvListResource(metadata.resources || []);
    if (!resource) throw new Error('Liste des QPV introuvable sur data.gouv.fr.');
    const response = await fetch(resource.latest || resource.url);
    if (!response.ok) throw new Error(`Liste des QPV indisponible (${response.status}).`);
    const liste = parseQpvList(await response.text());
    writeCache(QPV_LISTE_CACHE, [...liste]);
    return liste;
  });
}

function selectQpvListResource(resources) {
  return resources.find(resource => {
    const title = `${resource.title || ''}`.toLowerCase();
    return resource.format === 'csv' && title.includes('liste des quartiers prioritaires') && title.includes('2024');
  });
}

// Liste CSV de l'ANCT : une ligne par quartier, la colonne insee_com portant une
// ou plusieurs communes (« =""13055;13070"" », d'ou l'analyse des guillemets).
function parseQpvList(csv) {
  const lines = csv.replace(/^﻿/, '').split(/\r?\n/).filter(line => line.trim());
  const header = parseCsvLine(lines[0]).map(name => name.trim());
  const col = name => header.indexOf(name);
  const [iCode, iNom, iCommunes] = [col('code_qp'), col('lib_qp'), col('insee_com')];
  if (iCode < 0 || iCommunes < 0) throw new Error('Colonnes code_qp / insee_com absentes de la liste des QPV.');

  const liste = new Map();
  lines.slice(1).forEach(line => {
    const cells = parseCsvLine(line);
    const quartier = {code: cells[iCode] || '', nom: iNom >= 0 ? cells[iNom] || '' : ''};
    communeCodes(cells[iCommunes]).forEach(commune => {
      if (!liste.has(commune)) liste.set(commune, []);
      liste.get(commune).push(quartier);
    });
  });
  return liste;
}

function parseCsvLine(line, separator = ';') {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === separator) { cells.push(cell); cell = ''; }
    else cell += char;
  }
  cells.push(cell);
  return cells;
}

// Les contours (8 Mo compresses) ne sont telecharges que pour un club dont la
// commune compte un QPV et dont l'adresse est renseignee. Trop lourds pour le
// stockage du navigateur, ils restent en memoire le temps de la session.
function loadQpvContours() {
  return once('qpv-contours', async () => {
    const metadata = await fetchJson(QPV_DATASET_URL);
    const resource = selectGeojsonResource(metadata.resources || []);
    if (!resource) throw new Error('Aucune ressource GeoJSON QPV trouvée sur data.gouv.fr.');
    const response = await fetch(resource.latest || resource.url);
    if (!response.ok) throw new Error(`Téléchargement QPV impossible (${response.status}).`);
    const archive = await JSZip.loadAsync(await response.arrayBuffer());
    const files = Object.values(archive.files).filter(entry => !entry.dir && entry.name.toLowerCase().endsWith('.geojson'));
    const file = chooseGeojsonFile(files);
    if (!file) throw new Error("Aucun fichier GeoJSON trouvé dans l'archive QPV.");
    const geojson = JSON.parse(await file.async('string'));
    return Array.isArray(geojson.features) ? geojson.features : [];
  });
}

async function fetchJson(url) {
  return once(`json:${url}`, async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Source indisponible (${response.status}).`);
    return response.json();
  });
}

function readCache(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) return null;
    return cached.value;
  } catch (error) {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({savedAt: Date.now(), value}));
  } catch (error) {
    // Stockage plein ou interdit (navigation privee) : la fiche fonctionne sans.
  }
}

// Les cinq fonctions suivantes sont reprises telles quelles de
// src/qpv-widget/script.js, qui les enferme dans une IIFE et ne peut donc pas les
// partager. Un test verifie qu'elles n'ont pas diverge.

function selectGeojsonResource(resources) {
  const geojsonOnly = resources.find((resource) => {
    const title = `${resource.title || ""} ${resource.description || ""}`.toLowerCase();
    return resource.format === "zip" &&
      title.includes("format geojson") &&
      !title.includes("gpkg") &&
      !title.includes("shp");
  });

  if (geojsonOnly) {
    return geojsonOnly;
  }

  return resources.find((resource) => {
    const title = `${resource.title || ""} ${resource.description || ""}`.toLowerCase();
    return resource.format === "zip" && title.includes("geojson") && title.includes("2024");
  });
}

function chooseGeojsonFile(files) {
  if (!files.length) {
    return null;
  }

  const preferred = files.find((entry) => {
    const name = entry.name.toLowerCase();
    return name.includes("wgs84") || name.includes("france-entiere") || name.includes("france_entiere");
  });

  if (preferred) {
    return preferred;
  }

  return files.sort((a, b) => {
    const sizeA = a._data && a._data.uncompressedSize ? a._data.uncompressedSize : 0;
    const sizeB = b._data && b._data.uncompressedSize ? b._data.uncompressedSize : 0;
    return sizeB - sizeA;
  })[0];
}

function geometryContainsPoint(geometry, point) {
  if (!geometry) {
    return false;
  }

  if (geometry.type === "Polygon") {
    return polygonContainsPoint(geometry.coordinates, point);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(polygon, point));
  }

  return false;
}

function polygonContainsPoint(rings, point) {
  if (!rings || !rings.length || !ringContainsPoint(rings[0], point)) {
    return false;
  }

  return !rings.slice(1).some((hole) => ringContainsPoint(hole, point));
}

function ringContainsPoint(ring, point) {
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

// ---------------------------------------------------------------------------
// Ajout du logo
// ---------------------------------------------------------------------------

function bindLogo(club) {
  const button = document.getElementById('addLogo');
  const input = document.getElementById('logoInput');
  if (!button || !input) return;
  button.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.value = '';
    if (file) addLogo(club, file);
  });
}

async function addLogo(club, file) {
  const refusal = logoFileProblem(file);
  if (refusal) {
    state.upload = {busy: false, message: refusal, kind: 'error'};
    render();
    return;
  }
  state.upload = {busy: true, message: '', kind: ''};
  render();
  try {
    await uploadLogo(club.id, file);
    if (!isCurrent(club)) return;
    state.upload = {busy: false, message: 'Logo enregistré.', kind: 'success'};
    await load();
  } catch (error) {
    // La cause d'origine (avant l'etiquetage par etape dans uploadLogo) est celle
    // qui aide a diagnostiquer : la console developpeur la garde meme quand le
    // message affiche a l'utilisateur reste generique.
    console.error(error, error && error.cause);
    if (!isCurrent(club)) return;
    state.upload = {busy: false, message: uploadErrorMessage(error), kind: 'error'};
    render();
  }
}

function logoFileProblem(file) {
  if (!LOGO_TYPES.includes(file.type)) return 'Format non pris en charge : choisissez une image PNG, JPEG, WebP, GIF ou SVG.';
  if (file.size > LOGO_MAX_OCTETS) return 'Image trop lourde : 5 Mo au maximum.';
  return '';
}

// Deux temps, car une piece jointe ne s'ecrit pas directement dans une cellule :
//   1. televerser le fichier par l'API REST, qui renvoie l'identifiant de la
//      piece jointe creee ;
//   2. ecrire cet identifiant dans Structures.Logo par l'API du widget, soumise
//      aux regles d'acces du document comme toute saisie.
// Le jeton est demande sans readOnly : il porte alors les droits de
// l'utilisateur, plafonnes a ceux de son role sur le document. Il passe dans
// l'URL et non dans un en-tete, faute de quoi Grist refuserait la requete venue
// d'une autre origine que la sienne.
async function uploadLogo(clubId, file) {
  // « Acces complet » est un reglage du panneau de configuration du widget dans
  // Grist, distinct de requiredAccess declare au chargement : sans lui, ce jeton
  // est refuse avant tout envoi. On isole cette etape pour donner un message
  // dedie, sans dependre du texte de l'erreur — voir errorDetail plus bas.
  let access;
  try {
    access = await grist.docApi.getAccessToken({readOnly: false});
  } catch (error) {
    throw Object.assign(new Error("Jeton d'écriture refusé."), {step: 'access', cause: error});
  }

  const form = new FormData();
  form.append('upload', file, file.name);
  let response;
  try {
    response = await fetch(`${access.baseUrl}/attachments?auth=${encodeURIComponent(access.token)}`, {
      method: 'POST',
      body: form,
      credentials: 'omit',
    });
  } catch (error) {
    throw Object.assign(new Error("Connexion à Grist impossible."), {step: 'network', cause: error});
  }
  if (!response.ok) throw Object.assign(new Error(`Téléversement refusé (${response.status})`), {step: 'upload', status: response.status});
  const ids = attachmentIds(await response.json());
  if (!ids.length) throw Object.assign(new Error('Téléversement sans identifiant de pièce jointe.'), {step: 'upload'});

  try {
    await grist.docApi.applyUserActions([['UpdateRecord', TABLE_CLUBS, clubId, {Logo: ['L', ...ids]}]]);
  } catch (error) {
    // Le fichier est deja chez Grist ; seul le rattachement au club a echoue.
    throw Object.assign(new Error("Fichier envoyé, mais pas rattaché au club."), {step: 'update', cause: error, uploadedIds: ids});
  }
  return ids;
}

// Error.message n'est pas une propriete enumerable (specification ECMA-262) :
// une passerelle qui serialise l'erreur en JSON pour la faire traverser la
// frontiere entre le widget et Grist peut la perdre en route. On lit alors
// l'erreur elle-meme, jamais seulement sa propriete message.
function errorDetail(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string' && error.message) return error.message;
  try { return JSON.stringify(error); } catch (jsonError) { return String(error); }
}

function uploadErrorMessage(error) {
  if (error && (error.status === 401 || error.status === 403)) {
    return "Envoi refusé : votre compte n'a pas le droit de modifier ce document.";
  }
  if (error && error.step === 'access') {
    return "Ce widget n'a pas l'accès complet au document : ouvrez son panneau de configuration dans Grist et activez l'accès complet, puis réessayez.";
  }
  if (error && error.step === 'network') {
    return 'Connexion à Grist impossible : vérifiez votre connexion, puis réessayez.';
  }
  const detail = errorDetail(error && error.cause !== undefined ? error.cause : error);
  if (/access|acl|blocked|permission|refus/i.test(detail)) {
    return "Enregistrement refusé : les règles d'accès du document ne vous permettent pas de modifier la fiche de ce club.";
  }
  if (error && error.step === 'update') {
    return "Le logo a été envoyé mais n'a pas pu être rattaché à ce club : vérifiez vos droits d'écriture sur Structures, puis réessayez.";
  }
  return 'Le logo n\'a pas pu être enregistré. Vérifiez que ce widget a reçu l\'accès complet (panneau de configuration du widget dans Grist), puis réessayez.'
    + (detail ? ` (${detail})` : '');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
