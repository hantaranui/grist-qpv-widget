grist.ready({requiredAccess: 'full'});

const TABLES = ['Actions', 'Cofinancements', 'Agences', 'DD', 'DR', 'Structures', 'Dispositifs', 'Federations', 'Financements', 'Financeurs', 'Reponses_AAP'];
const COLORS = [
  '#283276',
  '#008ECF',
  '#F29FC5',
  '#FFE000',
  '#E1000F',
  '#8B4B8F',
  '#005B8F',
  '#D94F9D',
  '#7A6A00',
  '#8F0010',
  '#5F6BC4',
  '#00A6A6'
];
// Troisieme colonne : le libelle affiche tant qu'aucune valeur n'est choisie,
// accorde au genre de ce que le filtre designe.
const FILTERS = [
  ['osiris', 'Numéro Osiris', ''],
  ['dr', 'Direction régionale (DR)', 'Toutes'],
  ['dd', 'Direction départementale (DD)', 'Toutes'],
  ['agency', 'Agence', 'Toutes'],
  ['federation', 'Fédération', 'Toutes'],
  ['club', 'Club', 'Tous'],
  ['dispositif', 'Dispositif', 'Tous'],
  ['statut', 'Statut', 'Tous'],
  ['financeur', 'Financeur', 'Tous'],
  ['financement', 'Financement', 'Tous']
];
// Filtres a liste deroulante avec recherche, filtres a saisie libre, et les
// trois etats de financement, qui sont calcules et non lus dans une colonne.
const SEARCHABLE_FILTERS = new Set(['agency', 'club', 'federation', 'dd']);
const TEXT_FILTERS = new Set(['osiris']);
const FINANCEMENT_STATES = ['100% financé', 'Partiellement financé', 'Non financé'];

const state = { raw: {}, actions: [], filters: {}, statusChoices: [], publicChoices: [], formatChoices: [], summaryOpen: false, filtersOpen: false, federationOthersOpen: false, sort: {}, view: 'dashboard', editingId: null, addActionOpen: false, deleteOpen: false };

document.getElementById('resetBtn').addEventListener('click', () => {
  state.filters = {};
  render();
});

document.getElementById('toggleSummary').addEventListener('click', () => {
  state.summaryOpen = !state.summaryOpen;
  render();
});

document.getElementById('toggleFilters').addEventListener('click', () => {
  state.filtersOpen = !state.filtersOpen;
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => exportCsv(filteredActions()));
document.getElementById('addActionBtn').addEventListener('click', openAddAction);

document.addEventListener('pointerdown', event => {
  if (event.target.closest('.filter-search-dropdown, .sort-menu')) return;
  document.querySelectorAll('.filter-search-dropdown[open], .sort-menu[open]').forEach(dropdown => dropdown.removeAttribute('open'));
});

document.querySelectorAll('[data-sort-option]').forEach(button => {
  button.addEventListener('click', event => {
    const key = event.currentTarget.dataset.sortOption;
    const direction = event.currentTarget.dataset.sortDirection;
    state.sort = direction ? {key, direction} : {};
    document.querySelectorAll('.sort-menu[open]').forEach(menu => menu.removeAttribute('open'));
    renderRows(filteredActions());
  });
});

load();

async function load() {
  try {
    const data = await Promise.all(TABLES.map(async table => {
      try {
        return [table, rows(await grist.docApi.fetchTable(table))];
      } catch (error) {
        console.warn(`Accès refusé ou table introuvable : ${table}`, error);
        return [table, []];
      }
    }));
    state.raw = Object.fromEntries(data);
    state.statusChoices = await loadColumnChoices('Actions', 'Statut');
    state.publicChoices = await loadColumnChoices('Actions', 'Public');
    state.formatChoices = await loadColumnChoices('Actions', 'Format');
    state.actions = buildActions(state.raw);
    ouvrirActionDemandee();
    render();
  } catch (error) {
    document.getElementById('rows').innerHTML = '';
    document.getElementById('empty').classList.remove('is-hidden');
    document.getElementById('empty').textContent = "Impossible de lire les tables Grist. Vérifiez que le widget a l'accès complet.";
    console.error(error);
  }
}

// Passage de relais depuis le widget « fiche club ». Celui-ci depose dans le
// localStorage l'identifiant de l'action a ouvrir, puis fait naviguer la page
// vers le tableau de bord. Les deux widgets sont servis par la meme origine :
// ils partagent donc le meme stockage. La note est volontairement perissable,
// sans quoi un retour ulterieur sur le tableau de bord rouvrirait une fiche que
// plus personne n'a demandee.
const NOTE_OUVERTURE = 'clubs-ouvrir-action-v1';
const NOTE_VALIDITE_MS = 20000;

function lireNoteOuverture() {
  let brut = null;
  try {
    brut = window.localStorage.getItem(NOTE_OUVERTURE);
    // Lue une fois, jetee — y compris quand elle est illisible ou perimee, pour
    // qu'une note abimee ne reste pas coincee dans le stockage.
    window.localStorage.removeItem(NOTE_OUVERTURE);
  } catch (error) {
    // Navigation privee, stockage bloque, ou pas de localStorage du tout.
    return null;
  }
  if (!brut) return null;
  let note;
  try {
    note = JSON.parse(brut);
  } catch (error) {
    return null;
  }
  if (!note || typeof note !== 'object') return null;
  const id = Number(note.actionId);
  const ts = Number(note.ts);
  if (!Number.isFinite(id) || !Number.isFinite(ts)) return null;
  const age = Date.now() - ts;
  // Une note datee du futur ne peut venir que d'une horloge qui a bouge : on la
  // traite comme perimee plutot que de la laisser valable indefiniment.
  if (age < 0 || age > NOTE_VALIDITE_MS) return null;
  return id;
}

// Appelee juste avant le premier rendu : elle ne fait que preparer l'etat, le
// rendu qui suit se charge d'afficher la fiche.
function ouvrirActionDemandee() {
  const id = lireNoteOuverture();
  if (id === null) return;
  // Un identifiant inconnu ici n'a rien d'anormal : les regles d'acces peuvent
  // masquer a ce lecteur une action que le widget club lui montrait.
  if (!state.actions.some(action => action.id === id)) return;
  state.editingId = id;
  state.view = 'edit';
}

// Les listes de choix vivent dans la configuration des colonnes Grist. Trois
// chemins pour les lire, du plus fiable au dernier recours :
//   1. l'API REST /columns, qui ne demande que le droit de lecture de la table ;
//   2. les tables de métadonnées, refusées aux utilisateurs non propriétaires
//      dès qu'une règle d'accès retire la lecture par défaut (`-CRUD` sur `*`) ;
//   3. les listes ci-dessous, pour que personne ne se retrouve avec un menu vide.
const FALLBACK_CHOICES = {
  'Actions.Statut': ['A confirmer', 'Planifiée', 'Réalisée', 'Annulée'],
  'Actions.Public': ['BRSA', 'ZRR', 'QPV', 'Jeunes', 'Seniors', 'DELD', 'Infra Bac', 'DEBOE', 'Femmes', 'Hommes'],
  'Actions.Format': ['Demi-journée', 'Journée']
};

let accessTokenPromise = null;
const columnsCache = new Map();
let metaTablesPromise = null;

async function loadColumnChoices(tableId, colId) {
  const fromRest = await choicesFromRestApi(tableId, colId);
  if (fromRest.length) return fromRest;
  const fromMeta = await choicesFromMetaTables(tableId, colId);
  if (fromMeta.length) return fromMeta;
  console.warn(`Choix de ${tableId}.${colId} illisibles dans Grist : utilisation de la liste de secours.`);
  return FALLBACK_CHOICES[`${tableId}.${colId}`] || [];
}

async function choicesFromRestApi(tableId, colId) {
  const columns = await fetchTableColumns(tableId);
  const column = columns.find(item => item.id === colId);
  const options = parseWidgetOptions(column?.fields?.widgetOptions);
  return Array.isArray(options.choices) ? options.choices : [];
}

function fetchTableColumns(tableId) {
  if (!columnsCache.has(tableId)) {
    columnsCache.set(tableId, requestTableColumns(tableId).catch(error => {
      console.warn(`Impossible de lire les colonnes de ${tableId} via l'API REST`, error);
      return [];
    }));
  }
  return columnsCache.get(tableId);
}

async function requestTableColumns(tableId) {
  accessTokenPromise ||= grist.docApi.getAccessToken({readOnly: true});
  const {token, baseUrl} = await accessTokenPromise;
  const url = `${baseUrl}/tables/${encodeURIComponent(tableId)}/columns?auth=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} sur ${tableId}/columns`);
  const payload = await response.json();
  return Array.isArray(payload.columns) ? payload.columns : [];
}

async function choicesFromMetaTables(tableId, colId) {
  try {
    metaTablesPromise ||= Promise.all([
      grist.docApi.fetchTable('_grist_Tables'),
      grist.docApi.fetchTable('_grist_Tables_column')
    ]);
    const [tables, columns] = await metaTablesPromise;
    const table = rows(tables).find(item => item.tableId === tableId);
    const column = rows(columns).find(item => item.parentId === table?.id && item.colId === colId);
    const options = parseWidgetOptions(column?.widgetOptions);
    return Array.isArray(options.choices) ? options.choices : [];
  } catch (error) {
    console.warn(`Impossible de lire les choix de ${tableId}.${colId} dans les métadonnées`, error);
    metaTablesPromise = null;
    return [];
  }
}

function parseWidgetOptions(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
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

// Une action supprimee reste dans Grist : sa colonne Corbeille (booleen) passe a
// vrai. Le texte « Oui » est aussi reconnu, au cas ou une colonne serait restee
// de type texte.
function enCorbeille(action) {
  const valeur = action.Corbeille;
  return valeur === true || String(valeur || '').trim().toLowerCase() === 'oui';
}

function byId(items) {
  return new Map(items.map(item => [item.id, item]));
}

function buildActions(raw) {
  const actions = byId(raw.Actions.filter(action => !enCorbeille(action)));
  const agencies = byId(raw.Agences);
  const dds = byId(raw.DD);
  const drs = byId(raw.DR);
  const clubs = byId(raw.Structures);
  const dispositifs = byId(raw.Dispositifs);
  const federations = byId(raw.Federations);
  const reponses = byId(raw.Reponses_AAP);
  const financements = byId(raw.Financements);
  const financeurs = byId(raw.Financeurs);
  const cofs = raw.Cofinancements.reduce((acc, cof) => {
    const actionId = cof.Action;
    if (!actionId || !actions.has(actionId)) return acc;
    const financement = financements.get(cof.Financement) || {};
    const financeur = financeurs.get(financement.Financeur) || {};
    const label = financeur.Nom === 'France Travail' ? financement.Enveloppe : financeur.Nom;
    (acc[actionId] ||= []).push({...cof, label: label || 'Financeur', montant: Number(cof.Montant || 0), statutVersement: cof.Statut_Versement || ''});
    return acc;
  }, {});

  return raw.Actions.filter(action => !enCorbeille(action)).map(action => {
    const agency = agencies.get(action.Agence) || {};
    const dd = dds.get(action.DD) || {};
    const dr = drs.get(action.DR) || {};
    const club = clubs.get(action.Club) || {};
    const dispositif = dispositifs.get(action.Dispositif) || {};
    const federation = federations.get(action.Federation) || {};
    const reponse = reponses.get(action.Reponse_AAP) || {};
    const lines = cofs[action.id] || [];
    const financed = lines.reduce((sum, item) => sum + item.montant, 0);
    return {
      id: action.id,
      intitule: action.Intitule || '',
      codeMee: action.Code_MEE || '',
      // Formule Grist : numero Osiris suivi de l'intitule, ou l'intitule seul.
      nomComplet: action.Nom_complet || action.Intitule || '',
      osiris: reponse.Numero_Action_Osiris || '',
      budget: Number(action.Budget || 0),
      ouvertAuFinancement: action.Ouvert_au_financement === true,
      financed,
      rate: action.Budget ? financed / Number(action.Budget) : 0,
      financement: financementState(financed, Number(action.Budget || 0)),
      participants: Number(action.Jauge || 0),
      format: action.Format || '',
      lieu: action.Lieu || '',
      commentaire: action.Commentaire || '',
      public: formatChoiceList(action.Public),
      publicChoices: choiceValues(action.Public),
      statut: action.Statut || '',
      date: action.Date || null,
      periodeApprox: action.Periode_approx || '',
      clubId: action.Club || 0,
      agencyId: action.Agence || 0,
      dispositifId: action.Dispositif || 0,
      federationId: action.Federation || 0,
      agency: agency.Libelle_agence || agency.Code_Aurore || '',
      dd: dd.Nom || '',
      dr: dr.Nom || '',
      club: club.Nom || '',
      ville: action.Ville || '',
      dispositif: dispositif.Dispositif || dispositif.Code || '',
      federation: federation.Nom || '',
      financeurs: lines
    };
  });
}

function financementState(financed, budget) {
  if (budget > 0) {
    const rate = financed / budget;
    if (rate >= 1) return FINANCEMENT_STATES[0];
    return rate > 0 ? FINANCEMENT_STATES[1] : FINANCEMENT_STATES[2];
  }
  return financed > 0 ? FINANCEMENT_STATES[0] : FINANCEMENT_STATES[2];
}

// Le design system place le libelle d'un bouton dans un span dedie.
function buttonLabel(id, text) {
  const button = document.getElementById(id);
  (button.querySelector('.btn-content') || button).textContent = text;
}

function renderResults() {
  const actions = filteredActions();
  renderSummary(actions);
  renderRows(actions);
  requestResize();
}

function render() {
  renderFilters();
  const actions = filteredActions();
  renderSummary(actions);
  renderRows(actions);
  const editing = state.view === 'edit';
  document.getElementById('editView').classList.toggle('is-hidden', !editing);
  document.getElementById('dashboardView').classList.toggle('is-hidden', editing);
  if (editing) renderEdit();
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
  document.getElementById('filtersSection').classList.toggle('is-collapsed', !state.filtersOpen);
  document.getElementById('layout').classList.toggle('filters-collapsed', !state.filtersOpen);
  buttonLabel('toggleFilters', state.filtersOpen ? 'Replier' : 'Déplier');
  container.innerHTML = FILTERS.map(([key, label, tous]) => {
    const selected = state.filters[key] || '';
    if (TEXT_FILTERS.has(key)) {
      return `<div class="filter-field">
        <label class="form-label" for="filter-${key}">${escapeHtml(label)}</label>
        <span class="filter-text-control">
          <input class="form-control filter-text-input" type="search" id="filter-${key}" name="filter-${key}" data-filter-text="${key}" value="${escapeAttr(selected)}" placeholder="Rechercher">
          <button class="btn btn-primary filter-text-submit" type="button" data-filter-submit="${key}" aria-label="Lancer la recherche par ${escapeAttr(label)}" title="Chercher">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle><path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>
          </button>
        </span>
      </div>`;
    }
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

  // Le tableau ne se recalcule qu'a la demande : sur des milliers d'actions, un
  // filtrage a chaque frappe fige la page. On ne reconstruit pas non plus les
  // filtres, pour que le champ garde son texte, son focus et son curseur.
  const applyTextFilter = key => {
    const input = container.querySelector(`[data-filter-text="${key}"]`);
    const value = input ? input.value.trim() : '';
    if (value) state.filters[key] = value;
    else delete state.filters[key];
    renderResults();
  };

  container.querySelectorAll('[data-filter-text]').forEach(input => {
    // L'evenement « search » couvre la touche Entree et la croix d'effacement
    // que le navigateur ajoute lui-meme au champ.
    input.addEventListener('search', () => applyTextFilter(input.dataset.filterText));
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyTextFilter(input.dataset.filterText);
      }
    });
  });

  container.querySelectorAll('[data-filter-submit]').forEach(button => {
    button.addEventListener('click', () => applyTextFilter(button.dataset.filterSubmit));
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

function optionsFor(key) {
  // Les trois etats de financement sont toujours proposes, dans cet ordre, meme
  // si aucune action de la selection courante ne s'y trouve.
  if (key === 'financement') return [...FINANCEMENT_STATES];
  const values = new Set();
  state.actions.forEach(action => {
    if (key === 'financeur') action.financeurs.forEach(item => item.label && values.add(item.label));
    else if (action[key]) values.add(action[key]);
  });
  return [...values].sort((a, b) => a.localeCompare(b, 'fr'));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');
}

function filteredActions() {
  const actions = state.actions.filter(action => Object.entries(state.filters).every(([key, value]) => {
    if (key === 'financeur') return action.financeurs.some(item => item.label === value);
    if (key === 'osiris') return normalizeText(action.osiris).includes(normalizeText(value));
    return action[key] === value;
  }));
  return sortActions(actions);
}

function renderSummary(actions) {
  const summary = document.getElementById('summary');
  const section = document.getElementById('summarySection');
  buttonLabel('toggleSummary', state.summaryOpen ? 'Replier' : 'Déplier');
  section.classList.toggle('is-collapsed', !state.summaryOpen);
  summary.hidden = !state.summaryOpen;
  if (!state.summaryOpen) {
    summary.innerHTML = '';
    return;
  }

  const total = actions.reduce((sum, action) => sum + action.financed, 0);
  summary.innerHTML = `
    <div class="summary-top">
      <div class="metric">
        <strong>${actions.length}</strong><span>actions</span><br><br>
        <strong>${formatEuro(total)}</strong><span>financement global</span>
      </div>
      <div class="summary-block">
        <h2>Financeurs</h2>
        <div class="funders">${funderTotals(actions).map(([name, amount]) => `
          <div class="funder-row"><span>${escapeHtml(name)}</span><strong>${formatEuro(amount)}</strong></div>
        `).join('')}</div>
      </div>
    </div>
    <div class="summary-charts">
      ${pieBlock('Répartition par statut', groupCount(actions, 'statut'))}
      ${pieBlock('Répartition par dispositif', groupCount(actions, 'dispositif'))}
      ${federationPieBlock(actions)}
    </div>
  `;

  document.getElementById('toggleFederationOthers')?.addEventListener('click', () => {
    state.federationOthersOpen = !state.federationOthersOpen;
    renderSummary(actions);
    requestResize();
  });
}

function renderRows(actions) {
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  empty.classList.toggle('is-hidden', actions.length > 0);
  tbody.innerHTML = actions.map(action => `
    <tr>
      <td><div class="strong">${escapeHtml(action.agency)}</div><div class="muted">${escapeHtml(action.dd)}</div><div class="muted">${escapeHtml(action.dr)}</div></td>
      <td><div class="strong">${escapeHtml(action.club)}</div><div class="muted">${escapeHtml(action.federation)}</div></td>
      <td><div class="strong">${escapeHtml(action.nomComplet)}</div><div class="muted">${escapeHtml(action.dispositif)}</div><div class="muted">${action.participants} participants</div><div class="muted">Public : ${escapeHtml(action.public || 'non renseigné')}</div><div class="muted">Ville : ${escapeHtml(action.ville || 'non renseignée')}</div></td>
      <td><span class="status-tag ${statusClass(action.statut)}">${escapeHtml(action.statut)}</span><div class="muted" style="margin-top:8px">${escapeHtml(statusPeriodValue(action))}</div></td>
      <td>
        <div class="strong">Budget : ${formatEuro(action.budget)}</div>
        <div class="progress bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(action.rate * 100)}" aria-label="Part du budget couverte"><span class="progress-bar" style="width:${Math.round(action.rate * 100)}%"></span></div>
        <div class="muted">Couvert à ${Math.round(action.rate * 100)}% (${formatEuro(action.financed)})</div>
        ${action.financeurs.map(item => `<div class="money-line"><span>${escapeHtml(item.label)}</span><span>${formatEuro(item.montant)}</span></div>`).join('')}
      </td>
      <td><button class="btn btn-secondary btn-sm" type="button" data-edit-action="${action.id}"><span class="btn-content">Modifier</span></button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-edit-action]').forEach(button => {
    button.addEventListener('click', () => {
      state.editingId = Number(button.dataset.editAction);
      state.view = 'edit';
      render();
    });
  });
}

function renderEdit() {
  const action = state.actions.find(item => item.id === state.editingId);
  if (!action) {
    state.view = 'dashboard';
    render();
    return;
  }
  // Une valeur déjà saisie dans Grist mais absente de la configuration de la
  // colonne doit rester sélectionnable, sinon l'action perdrait son statut.
  const statusChoices = withExistingValues(state.statusChoices, state.actions.map(item => item.statut));
  const publicChoices = withExistingValues(state.publicChoices, state.actions.flatMap(item => item.publicChoices));
  const total = action.financeurs.reduce((sum, item) => sum + item.montant, 0);
  const editView = document.getElementById('editView');
  editView.innerHTML = `
  <div class="edit-panel">
    <header class="edit-header">
      <div class="edit-header-title">
      <h1 id="editHeading">${escapeHtml(action.nomComplet || 'Modifier une action')}</h1>
      </div>
      <div class="edit-header-actions"><button type="button" class="btn btn-primary btn-supprimer" id="deleteAction"><span class="btn-content">Supprimer</span></button><button type="button" class="btn btn-secondary" id="cancelEdit"><span class="btn-content">Annuler</span></button><button class="btn btn-primary" type="submit" form="editForm" id="saveEdit"><span class="btn-content">Enregistrer</span></button></div>
    </header>
    <div class="alert alert-error edit-message is-hidden" id="editMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
    <form id="editForm">
      <div class="edit-layout">
        <div class="edit-row edit-row-top">
        <section class="edit-card">
          <div class="section-head"><span>Action</span></div>
          <div class="edit-fields edit-fields-action">
            <div class="edit-field"><label class="form-label" for="editTitle">Intitulé de l'action<span class="required">&nbsp;*</span></label><input class="form-control" id="editTitle" name="editTitle" required value="${escapeAttr(action.intitule)}"></div>
            ${hasCodeMee() ? `<div class="edit-field"><label class="form-label" for="editCodeMee">Code MEE</label><input class="form-control" id="editCodeMee" name="editCodeMee" value="${escapeAttr(action.codeMee)}"></div>` : ''}
            <div class="edit-field"><label class="form-label" for="editDispositif">Dispositif</label><select class="form-control" id="editDispositif" name="editDispositif">${referenceOptions(state.raw.Dispositifs, action.dispositifId, item => item.Dispositif || item.Code || '', 'Choisir un dispositif')}</select></div>
            <div class="edit-field"><label class="form-label" for="editFormat">Format</label><select class="form-control" id="editFormat" name="editFormat">${formatOptions(action.format)}</select></div>
            <div class="edit-field"><label class="form-label" for="editParticipants">Nombre de participants</label><input class="form-control" id="editParticipants" name="editParticipants" type="number" min="0" value="${action.participants}"></div>
            <div class="edit-field"><span class="form-label" id="publicLabel">Public</span><div class="public-picker" id="publicPicker"><button class="form-control public-toggle" type="button" id="publicToggle" aria-expanded="false" aria-labelledby="publicLabel publicToggleValue"><span id="publicToggleValue">${escapeHtml(action.publicChoices.join(', ') || 'Choisir un public')}</span></button><div class="public-options">${publicChoices.map((value, index) => `<div class="form-check with-checked-bg public-option"><input class="form-check-input public-choice" type="checkbox" id="public-${index}" value="${escapeAttr(value)}"${action.publicChoices.includes(value) ? ' checked' : ''}><label class="form-check-label" for="public-${index}">${escapeHtml(value)}</label></div>`).join('')}</div></div></div>
            <div class="edit-field"><label class="form-label" for="editVille">Ville</label><input class="form-control" id="editVille" name="editVille" value="${escapeAttr(action.ville)}"></div>
            <div class="edit-field"><label class="form-label" for="editLieu">Lieu</label><input class="form-control" id="editLieu" name="editLieu" value="${escapeAttr(action.lieu)}"></div>
            <div class="edit-field edit-field-wide"><label class="form-label" for="editCommentaire">Commentaire</label><textarea class="form-control" id="editCommentaire" name="editCommentaire" rows="3">${escapeHtml(action.commentaire)}</textarea></div>
          </div>
        </section>
        <div class="edit-stack">
          <section class="edit-card">
            <div class="section-head"><span>Agence</span></div>
          <div class="edit-fields">
            <div class="edit-field"><label class="form-label" for="editAgency">Agence</label><select class="form-control" id="editAgency" name="editAgency">${referenceOptions(state.raw.Agences, action.agencyId, item => item.Libelle_agence || item.Code_Aurore || '', 'Choisir une agence')}</select></div>
            <div class="agency-summary">
              <div><strong>DD :</strong> <span id="editDd">${escapeHtml(action.dd)}</span></div>
              <div><strong>DR :</strong> <span id="editDr">${escapeHtml(action.dr)}</span></div>
            </div>
          </div>
        </section>
        <section class="edit-card">
          <div class="section-head"><span>Club</span></div>
          <div class="edit-fields">
            <div class="club-summary">
              <div><strong>Club :</strong> ${escapeHtml(action.club)}</div>
              <div><strong>Fédération :</strong> ${escapeHtml(action.federation)}</div>
            </div>
          </div>
        </section>
        </div>
        </div>
        <div class="edit-row edit-row-bottom">
        <section class="edit-card">
          <div class="section-head"><span>Statut</span></div>
          <div class="edit-fields">
            <div class="status-editor" id="statusEditor">
              <div class="status-head-row"><p class="form-legend" id="statusLegend">Statut de l'action</p></div>
              <div class="status-options" role="group" aria-labelledby="statusLegend">${statusChoices.map((status, index) => `<div class="form-check with-checked-bg status-option ${statusClass(status)}"><input class="form-check-input" type="radio" id="status-${index}" name="editStatus" value="${escapeAttr(status)}"${status === action.statut ? ' checked' : ''}><label class="form-check-label" for="status-${index}">${escapeHtml(status)}</label></div>`).join('')}</div>
              <div class="status-period-slot">
                <span class="status-period-label" id="statusPeriodLabel">${escapeHtml(outerPeriodLabel(action.statut))}</span>
                ${statusChoices.map(status => statusPeriodControl(status, action)).join('')}
              </div>
            </div>
          </div>
        </section>
        <section class="edit-card finance-card">
          <div class="section-head"><span>Financement</span><div class="finance-summary"><span>Financé : <strong id="editFinanced">${formatEuro(total)}</strong></span><span class="progress finance-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(100, action.budget ? Math.round(total / action.budget * 100) : 0)}" aria-label="Part du budget couverte"><i class="progress-bar" id="editProgress" style="width:${Math.min(100, action.budget ? Math.round(total / action.budget * 100) : 0)}%"></i></span><span>Reste à financer : <strong id="editRemaining">${formatEuro(Math.max(0, action.budget - total))}</strong></span></div></div>
          <div class="finance-open">
            <div class="edit-field finance-budget"><label class="form-label" for="editBudget">Budget total (€)</label><input class="form-control" id="editBudget" name="editBudget" type="number" min="0" value="${Math.round(action.budget)}"></div>
            <div class="form-check with-checked-bg finance-open-option"><input class="form-check-input" type="checkbox" id="editOpenToFunding" name="editOpenToFunding"${action.ouvertAuFinancement ? ' checked' : ''}><label class="form-check-label" for="editOpenToFunding">Ouvert au financement</label></div>
          </div>
          <div class="finance-editor">
            <div class="finance-list">
              <div class="finance-list-head"><span>Financeur</span><span>Montant (€)</span><span>Statut de versement</span><span aria-hidden="true"></span></div>
              <div id="financeRows">${action.financeurs.map(item => financeRow(item)).join('') || financeEmptyState()}</div>
              <button class="btn btn-secondary finance-add" type="button" id="addFinance"><span class="btn-content">+ Ajouter un financeur</span></button>
            </div>
          </div>
        </section>
        </div>
      </div>
    </form>
  </div>
  `;
  document.getElementById('cancelEdit').addEventListener('click', closeEdit);
  document.getElementById('deleteAction').addEventListener('click', () => openDeleteAction(action));
  focusFirstField(editView);
  document.getElementById('editBudget').addEventListener('input', updateFinanceSummary);
  bindPublicPicker();
  bindStatusEditor();
  bindDatePickers();
  document.getElementById('addFinance').addEventListener('click', () => {
    const rows = document.getElementById('financeRows');
    rows.querySelector('.finance-empty')?.remove();
    rows.insertAdjacentHTML('beforeend', financeRow({}));
    bindFinanceRows();
  });
  document.getElementById('editForm').addEventListener('submit', event => saveEdit(event, action));
  bindFinanceRows();
}

function bindStatusEditor() {
  const editor = document.getElementById('statusEditor');
  editor.querySelectorAll('[name="editStatus"]').forEach(radio => radio.addEventListener('change', () => {
    const previous = editor.querySelector('.status-period:not(.is-hidden) .edit-status-period');
    const previousKind = previous?.dataset.periodKind || '';
    const previousValue = previous ? readPeriodValue(previous) : '';
    const config = statusFieldConfig(radio.value);
    document.getElementById('statusPeriodLabel').textContent = outerPeriodLabel(radio.value);
    editor.querySelectorAll('.status-period').forEach(container => {
      const visible = container.dataset.statusDate === radio.value;
      container.classList.toggle('is-hidden', !visible);
      const input = container.querySelector('.edit-status-period');
      if (visible && input && previousKind === input.dataset.periodKind && previousValue) writePeriodValue(input, previousValue);
    });
  }));
}

// <ft-datepicker> (widget officiel France Travail) n'expose pas de propriété
// .value fiable : sa valeur choisie n'arrive que via l'évènement personnalisé
// "ft-datepicker-input-change", donc on la garde dans data-iso-value plutôt
// que de la relire depuis l'élément. readPeriodValue()/writePeriodValue()
// centralisent cette différence face au simple <input type="text"> (Projet).
function bindDatePickers() {
  document.querySelectorAll('.edit-status-period[data-period-kind="date"]').forEach(picker => {
    picker.addEventListener('ft-datepicker-input-change', event => {
      const raw = event.detail && event.detail.value;
      picker.dataset.isoValue = raw ? frDateToIso(raw) : '';
    });
  });
}

function readPeriodValue(input) {
  return input.dataset.periodKind === 'date' ? (input.dataset.isoValue || '') : (input.value || '');
}

function writePeriodValue(input, value) {
  if (input.dataset.periodKind === 'date') {
    input.dataset.isoValue = value;
    input.setAttribute('value', isoToFrDate(value));
  } else {
    input.value = value;
  }
}

function bindPublicPicker() {
  const picker = document.getElementById('publicPicker');
  const toggle = document.getElementById('publicToggle');
  toggle.addEventListener('click', event => {
    event.stopPropagation();
    picker.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(picker.classList.contains('is-open')));
  });
  picker.addEventListener('click', event => event.stopPropagation());
  picker.querySelectorAll('.public-choice').forEach(choice => choice.addEventListener('change', () => {
    const selected = [...picker.querySelectorAll('.public-choice:checked')].map(input => input.value);
    document.getElementById('publicToggleValue').textContent = selected.join(', ') || 'Choisir un public';
  }));
  document.addEventListener('click', () => {
    picker.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  });
}

function referenceOptions(items, selectedId, labelFor, placeholder) {
  const selectable = [...items]
    .map(item => [item.id, labelFor(item)])
    .filter(([, label]) => label)
    .sort((a, b) => a[1].localeCompare(b[1], 'fr'));
  const options = selectable.map(([id, label]) =>
    `<option value="${id}"${id === selectedId ? ' selected' : ''}>${escapeHtml(label)}</option>`);
  // Sans reference, le navigateur afficherait la premiere option de la liste :
  // l'action paraitrait rattachee a une agence qu'elle n'a pas, et le simple fait
  // d'enregistrer la fiche l'y rattacherait pour de bon.
  if (!selectable.some(([id]) => id === selectedId)) {
    options.unshift(`<option value="" selected disabled>${escapeHtml(placeholder)}</option>`);
  }
  return options.join('');
}

function financeOptions(selectedId) {
  const financeurs = byId(state.raw.Financeurs);
  return [...state.raw.Financements]
    .map(item => [item.id, financeLabel(item, financeurs)])
    .filter(([, label]) => label)
    .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
    .map(([id, label]) => `<option value="${id}"${id === selectedId ? ' selected' : ''}>${escapeHtml(label)}</option>`)
    .join('');
}

function financeLabel(financement, financeurs) {
  const financeur = financeurs.get(financement.Financeur) || {};
  return financeur.Nom === 'France Travail' ? financement.Enveloppe : financeur.Nom || '';
}

// La colonne Code_MEE est optionnelle : sans elle, le champ n'est pas propose et
// rien n'est ecrit (Grist refuserait toute la mise a jour).
function hasCodeMee() {
  return (state.raw.Actions || []).some(row => 'Code_MEE' in row);
}

function financeRow(item) {
  // Un financement deja verse ne se modifie plus et ne se retire plus.
  const verse = item.statutVersement === 'Versé';
  return `<div class="finance-row" data-cofinancement-id="${item.id || ''}">
    <select class="form-control finance-select"${verse ? ' disabled' : ''}><option value="">Choisir un financeur</option>${financeOptions(item.Financement)}</select>
    <input class="form-control finance-amount" type="number" min="0" placeholder="Montant" value="${item.montant == null ? '' : Math.round(item.montant)}"${verse ? ' readonly' : ''}>
    <div class="finance-status" data-statut="${escapeAttr(item.statutVersement || '')}">${escapeHtml(item.statutVersement)}</div>
    ${verse ? '<span aria-hidden="true"></span>' : '<button class="btn btn-secondary btn-sm finance-remove" type="button"><span class="btn-content">Retirer</span></button>'}
  </div>`;
}

function formatOptions(selected) {
  const options = withExistingValues(state.formatChoices, [selected])
    .map(choice => `<option value="${escapeAttr(choice)}"${choice === selected ? ' selected' : ''}>${escapeHtml(choice)}</option>`);
  // Le format n'est pas obligatoire : tant qu'il n'est pas saisi, aucun choix ne
  // doit apparaitre selectionne par defaut.
  options.unshift(`<option value=""${selected ? '' : ' selected'}>Choisir un format</option>`);
  return options.join('');
}

function financeEmptyState() {
  return '<div class="finance-empty">Aucun financeur ajouté.</div>';
}

function bindFinanceRows() {
  document.querySelectorAll('.finance-remove').forEach(button => {
    button.onclick = () => {
      const rows = button.closest('#financeRows');
      button.closest('.finance-row').remove();
      if (!rows.querySelector('.finance-row')) rows.innerHTML = financeEmptyState();
      updateFinanceSummary();
    };
  });
  document.querySelectorAll('.finance-amount').forEach(input => input.oninput = updateFinanceSummary);
}

function updateFinanceSummary() {
  const total = [...document.querySelectorAll('.finance-amount')].reduce((sum, input) => sum + Number(input.value || 0), 0);
  const budget = Number(document.getElementById('editBudget').value || 0);
  document.getElementById('editFinanced').textContent = formatEuro(total);
  document.getElementById('editRemaining').textContent = formatEuro(Math.max(0, budget - total));
  document.getElementById('editProgress').style.width = `${Math.min(100, budget ? Math.round(total / budget * 100) : 0)}%`;
}

// La fiche remplace la liste : le focus doit la suivre, puis revenir sur le
// bouton qui l'a ouverte. Pas de piegeage, ce n'est plus une boite de dialogue.
let vueOuvertePour = null;
let focusAvantFiche = null;

function focusFirstField(vue) {
  if (vueOuvertePour === state.editingId) return;
  focusAvantFiche = document.activeElement;
  vueOuvertePour = state.editingId;
  const premier = vue.querySelector('#editTitle');
  if (premier) premier.focus();
}

function closeEdit() {
  state.view = 'dashboard';
  state.editingId = null;
  vueOuvertePour = null;
  render();
  // Le tableau vient d'etre reconstruit : on rend le focus a un element vivant.
  if (focusAvantFiche && document.body.contains(focusAvantFiche)) focusAvantFiche.focus();
  else document.getElementById('exportBtn').focus();
  focusAvantFiche = null;
}

async function saveEdit(event, action) {
  event.preventDefault();
  const message = document.getElementById('editMessage');
  const messageTexte = message.querySelector('.alert-content');
  const submit = document.getElementById('saveEdit');
  const publicValues = [...document.querySelectorAll('.public-choice:checked')].map(input => input.value);
  const rows = [...document.querySelectorAll('.finance-row')].map(row => ({
    id: Number(row.dataset.cofinancementId || 0),
    financement: Number(row.querySelector('.finance-select').value || 0),
    montant: Number(row.querySelector('.finance-amount').value || 0),
    statutVersement: row.querySelector('.finance-status').dataset.statut || ''
  })).filter(row => row.financement && row.montant >= 0);
  const status = document.querySelector('[name="editStatus"]:checked')?.value || '';
  const statusConfig = statusFieldConfig(status);
  const periodInput = document.querySelector('.status-period:not(.is-hidden) .edit-status-period');
  const periodValue = periodInput ? readPeriodValue(periodInput).trim() : '';
  const actionUpdate = {
    Intitule: document.getElementById('editTitle').value.trim(),
    Dispositif: Number(document.getElementById('editDispositif').value || 0),
    Jauge: Number(document.getElementById('editParticipants').value || 0),
    Format: document.getElementById('editFormat').value,
    Ville: document.getElementById('editVille').value.trim(),
    Lieu: document.getElementById('editLieu').value.trim(),
    Commentaire: document.getElementById('editCommentaire').value.trim(),
    Public: ['L', ...publicValues],
    Agence: Number(document.getElementById('editAgency').value || 0),
    Statut: status,
    Date: statusConfig.kind === 'date' && periodValue ? Math.floor(new Date(`${periodValue}T00:00:00`).getTime() / 1000) : null,
    Periode_approx: statusConfig.kind === 'text' ? periodValue : '',
    Budget: Number(document.getElementById('editBudget').value || 0),
    Ouvert_au_financement: document.getElementById('editOpenToFunding').checked
  };
  if (hasCodeMee()) actionUpdate.Code_MEE = document.getElementById('editCodeMee').value.trim();
  const currentIds = new Set(action.financeurs.map(item => item.id));
  const usedIds = new Set(rows.filter(row => row.id).map(row => row.id));
  const userActions = [['UpdateRecord', 'Actions', action.id, actionUpdate]];
  rows.forEach(row => {
    const fields = {Financement: row.financement, Montant: row.montant, Action: action.id, Statut_Versement: row.statutVersement};
    if (row.id && currentIds.has(row.id)) userActions.push(['UpdateRecord', 'Cofinancements', row.id, fields]);
    else userActions.push(['AddRecord', 'Cofinancements', null, fields]);
  });
  action.financeurs.filter(item => !usedIds.has(item.id)).forEach(item => userActions.push(['RemoveRecord', 'Cofinancements', item.id]));
  try {
    submit.disabled = true;
    message.classList.add('is-hidden');
    await grist.docApi.applyUserActions(userActions);
    state.view = 'dashboard';
    state.editingId = null;
    vueOuvertePour = null;
    await load();
  } catch (error) {
    const detail = String(error?.message || error || '').trim();
    messageTexte.textContent = detail
      ? `L'enregistrement n'a pas abouti : ${detail}`
      : "L'enregistrement n'a pas abouti. Vérifiez l'accès complet du widget puis réessayez.";
    message.classList.remove('is-hidden');
    submit.disabled = false;
    console.error(error);
  }
}

// ---------------------------------------------------------------------------
// Suppression d'une action. La ligne n'est jamais retiree de Grist : on passe sa
// colonne Corbeille (booleen) a vrai, et tous les ecrans ignorent les actions en corbeille.
// Deux fenetres possibles : un refus (l'action porte des financements, il faut
// d'abord les retirer) ou une confirmation.
// ---------------------------------------------------------------------------

let focusAvantSuppression = null;

function deleteDialogHtml(action) {
  const bloquee = action.financeurs.length > 0;
  const titre = bloquee ? 'Suppression impossible' : "Suppression d'une action";
  const texte = bloquee
    ? 'Vous ne pouvez pas supprimer une action qui comporte des financements. Merci d\'abord de supprimer les financements de cette action ?'
    : `Êtes-vous sûr de vouloir supprimer l'action <strong>${escapeHtml(action.nomComplet || action.intitule)}</strong> ?`;
  const boutons = bloquee
    ? '<button type="button" class="btn btn-primary" id="deleteOk"><span class="btn-content">OK</span></button>'
    : '<button type="button" class="btn btn-secondary" id="cancelDelete"><span class="btn-content">Annuler</span></button><button type="button" class="btn btn-primary btn-supprimer" id="confirmDelete"><span class="btn-content">Valider</span></button>';
  return `<div class="modal-backdrop fade show"></div>
  <div class="modal fade show" id="deleteActionDialog" role="alertdialog" aria-modal="true" aria-labelledby="deleteActionTitle" aria-describedby="deleteActionText" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header"><h2 class="modal-title" id="deleteActionTitle">${titre}</h2></div>
        <div class="modal-body">
          <div class="alert alert-error is-hidden" id="deleteActionMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
          <p id="deleteActionText">${texte}</p>
        </div>
        <div class="modal-footer">${boutons}</div>
      </div>
    </div>
  </div>`;
}

function openDeleteAction(action) {
  const host = document.getElementById('deleteActionModal');
  focusAvantSuppression = document.activeElement;
  state.deleteOpen = true;
  host.innerHTML = deleteDialogHtml(action);
  document.body.classList.add('modal-open');
  const ok = document.getElementById('deleteOk');
  if (ok) ok.addEventListener('click', closeDeleteAction);
  else {
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteAction);
    document.getElementById('confirmDelete').addEventListener('click', () => confirmDeleteAction(action));
  }
  host.addEventListener('keydown', keepFocusInDelete);
  (ok || document.getElementById('cancelDelete')).focus();
  requestResize();
}

function closeDeleteAction() {
  const host = document.getElementById('deleteActionModal');
  host.removeEventListener('keydown', keepFocusInDelete);
  host.innerHTML = '';
  document.body.classList.remove('modal-open');
  state.deleteOpen = false;
  if (focusAvantSuppression && document.body.contains(focusAvantSuppression)) focusAvantSuppression.focus();
  focusAvantSuppression = null;
  requestResize();
}

function keepFocusInDelete(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeDeleteAction();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...document.querySelectorAll('#deleteActionDialog button:not(:disabled)')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function confirmDeleteAction(action) {
  const confirmer = document.getElementById('confirmDelete');
  const message = document.getElementById('deleteActionMessage');
  try {
    confirmer.disabled = true;
    message.classList.add('is-hidden');
    await grist.docApi.applyUserActions([['UpdateRecord', 'Actions', action.id, {Corbeille: true}]]);
    closeDeleteAction();
    state.view = 'dashboard';
    state.editingId = null;
    vueOuvertePour = null;
    focusAvantFiche = null;
    await load();
    document.getElementById('exportBtn').focus();
  } catch (error) {
    const detail = String(error?.message || error || '').trim();
    message.querySelector('.alert-content').textContent = detail
      ? `La suppression n'a pas abouti : ${detail}`
      : "La suppression n'a pas abouti. Vérifiez l'accès complet du widget puis réessayez.";
    message.classList.remove('is-hidden');
    confirmer.disabled = false;
    console.error(error);
  }
}

// ---------------------------------------------------------------------------
// Ajout d'une action : trois champs obligatoires (nom, dispositif, club) dans une
// fenetre du design system. Tout le reste se saisit ensuite dans la fiche de
// l'action, que l'on ouvre des la creation. Une fenetre convient ici, contrairement
// a la fiche complete : c'est un formulaire court, qui ne demande qu'une decision.
// ---------------------------------------------------------------------------

const ADD_ACTION_FIELDS = [
  {key: 'nom', id: 'addActionName', message: "Saisissez le nom de l'action."},
  {key: 'dispositif', id: 'addActionDispositif', message: 'Choisissez un dispositif.'},
  {key: 'club', id: 'addActionClub', message: 'Choisissez un club.'}
];

let focusAvantAjout = null;

function addActionField(field, label, control) {
  return `<div class="edit-field"><label class="form-label" for="${field.id}">${label}<span class="required">&nbsp;*</span></label>${control}<div class="invalid-feedback" id="${field.id}Error">${escapeHtml(field.message)}</div></div>`;
}

function addActionModalHtml() {
  const [nom, dispositif, club] = ADD_ACTION_FIELDS;
  const dispositifs = referenceOptions(state.raw.Dispositifs || [], 0, item => item.Dispositif || item.Code || '', 'Choisir un dispositif');
  const clubs = referenceOptions(state.raw.Structures || [], 0, item => item.Nom || '', 'Choisir un club');
  return `<div class="modal-backdrop fade show"></div>
  <div class="modal fade show" id="addActionDialog" role="dialog" aria-modal="true" aria-labelledby="addActionTitle" tabindex="-1">
    <div class="modal-dialog">
      <form class="modal-content" id="addActionForm" novalidate>
        <div class="modal-header"><h2 class="modal-title" id="addActionTitle">Ajout d'une action</h2></div>
        <div class="modal-body">
          <div class="alert alert-error is-hidden" id="addActionMessage" role="alert" aria-live="assertive"><p class="alert-content"></p></div>
          <div class="add-action-fields">
            ${addActionField(nom, "Nom de l'action", `<input class="form-control" id="${nom.id}" name="${nom.id}" required aria-describedby="${nom.id}Error" autocomplete="off">`)}
            ${addActionField(dispositif, 'Dispositif', `<select class="form-control" id="${dispositif.id}" name="${dispositif.id}" required aria-describedby="${dispositif.id}Error">${dispositifs}</select>`)}
            ${addActionField(club, 'Club', `<select class="form-control" id="${club.id}" name="${club.id}" required aria-describedby="${club.id}Error">${clubs}</select>`)}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="cancelAddAction"><span class="btn-content">Annuler</span></button>
          <button type="submit" class="btn btn-primary" id="submitAddAction"><span class="btn-content">Valider</span></button>
        </div>
      </form>
    </div>
  </div>`;
}

// Les valeurs saisies, sans toucher au DOM : c'est ce que les tests fournissent.
function readAddActionForm() {
  return {
    nom: document.getElementById('addActionName').value,
    dispositif: document.getElementById('addActionDispositif').value,
    club: document.getElementById('addActionClub').value
  };
}

// Les champs a refaire, dans l'ordre de la fenetre. Un nom fait d'espaces ne
// compte pas : Grist l'accepterait, et l'action apparaitrait sans intitule.
function addActionProblems(values) {
  return ADD_ACTION_FIELDS.filter(field => {
    const value = String(values[field.key] || '').trim();
    return field.key === 'nom' ? !value : !Number(value);
  });
}

function newActionFields(values) {
  return {
    Intitule: String(values.nom).trim(),
    Dispositif: Number(values.dispositif),
    Club: Number(values.club),
    Statut: 'A confirmer'
  };
}

function markAddActionProblems(problems) {
  ADD_ACTION_FIELDS.forEach(field => {
    const control = document.getElementById(field.id);
    const invalid = problems.includes(field);
    control.classList.toggle('is-invalid', invalid);
    if (invalid) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
}

function showAddActionMessage(text) {
  const message = document.getElementById('addActionMessage');
  message.querySelector('.alert-content').textContent = text;
  message.classList.remove('is-hidden');
}

function openAddAction() {
  const host = document.getElementById('addActionModal');
  focusAvantAjout = document.activeElement;
  state.addActionOpen = true;
  host.innerHTML = addActionModalHtml();
  document.body.classList.add('modal-open');
  document.getElementById('addActionForm').addEventListener('submit', submitAddAction);
  document.getElementById('cancelAddAction').addEventListener('click', closeAddAction);
  host.addEventListener('keydown', keepFocusInAddAction);
  document.getElementById('addActionName').focus();
  requestResize();
}

function closeAddAction() {
  const host = document.getElementById('addActionModal');
  host.removeEventListener('keydown', keepFocusInAddAction);
  host.innerHTML = '';
  document.body.classList.remove('modal-open');
  state.addActionOpen = false;
  // Le bouton qui a ouvert la fenetre reprend le focus, comme pour la fiche.
  if (focusAvantAjout && document.body.contains(focusAvantAjout)) focusAvantAjout.focus();
  focusAvantAjout = null;
  requestResize();
}

// Une boite de dialogue garde le focus : Tab et Maj+Tab tournent entre ses
// controles, Echap la ferme. Trois champs seulement sont en jeu, contrairement a la
// fiche complete : fermer sans confirmer ne perd presque rien.
function keepFocusInAddAction(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeAddAction();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = [...document.querySelectorAll('#addActionDialog input, #addActionDialog select, #addActionDialog button:not(:disabled)')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

async function submitAddAction(event) {
  event.preventDefault();
  const values = readAddActionForm();
  const problems = addActionProblems(values);
  markAddActionProblems(problems);
  if (problems.length) {
    document.getElementById(problems[0].id).focus();
    return;
  }
  const submit = document.getElementById('submitAddAction');
  const message = document.getElementById('addActionMessage');
  try {
    submit.disabled = true;
    message.classList.add('is-hidden');
    const result = await grist.docApi.applyUserActions([['AddRecord', 'Actions', null, newActionFields(values)]]);
    const newId = Number(result && result.retValues && result.retValues[0]);
    closeAddAction();
    await load();
    // Le reste de l'action se saisit dans sa fiche : on l'ouvre. Si elle n'est pas
    // visible pour cet utilisateur (regles d'acces), le tableau de bord reste affiche.
    if (newId && state.actions.some(action => action.id === newId)) {
      state.editingId = newId;
      state.view = 'edit';
      render();
    }
  } catch (error) {
    const detail = String(error?.message || error || '').trim();
    showAddActionMessage(detail
      ? `L'ajout n'a pas abouti : ${detail}`
      : "L'ajout n'a pas abouti. Vérifiez l'accès complet du widget puis réessayez.");
    submit.disabled = false;
    console.error(error);
  }
}

function pieBlock(title, entries) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  return `<div class="summary-block">
    <h2>${escapeHtml(title)}</h2>
    <div class="pie-wrap">
      ${pieSvg(entries, total)}
      <div class="legend">${entries.map(([name, count], index) => `
        <div class="legend-row">
          <span class="swatch" style="background:${colorForIndex(index)}"></span>
          <span>${escapeHtml(name || 'Non renseigné')}</span>
          <span class="count">${count} (${Math.round(count / total * 100)}%)</span>
        </div>
      `).join('')}</div>
    </div>
  </div>`;
}

function federationPieBlock(actions) {
  const allEntries = federationClubCounts(actions);
  const total = allEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const topEntries = allEntries.slice(0, 10);
  const otherEntries = allEntries.slice(10);
  const chartEntries = otherEntries.length
    ? [...topEntries, ['Autres fédérations', otherEntries.reduce((sum, [, count]) => sum + count, 0)]]
    : topEntries;
  const otherCount = otherEntries.reduce((sum, [, count]) => sum + count, 0);
  const otherIndex = chartEntries.length - 1;

  return `<div class="summary-block">
    <h2>Répartition par fédération</h2>
    <div class="pie-wrap">
      ${pieSvg(chartEntries, total)}
      <div class="legend">
        ${topEntries.map(([name, count], index) => legendRow(name, count, total, colorForIndex(index))).join('')}
        ${otherEntries.length ? `
          <div class="federation-others">
            <button class="federation-others-toggle" id="toggleFederationOthers" type="button" aria-expanded="${state.federationOthersOpen}">
              <span class="swatch" style="background:${colorForIndex(otherIndex)}"></span>
              <span class="federation-others-name">Autres fédérations (${otherEntries.length})<span class="icon ${state.federationOthersOpen ? 'icon-chevron-u' : 'icon-chevron-d'}" aria-hidden="true"></span></span>
              <span class="count">${otherCount} ${otherCount > 1 ? 'clubs' : 'club'} (${Math.round(otherCount / total * 100)}%)</span>
            </button>
            ${state.federationOthersOpen ? `<div class="federation-others-details">
              ${otherEntries.map(([name, count]) => legendRow(name, count, total, colorForIndex(otherIndex), true)).join('')}
            </div>` : ''}
          </div>` : ''}
      </div>
    </div>
  </div>`;
}

function legendRow(name, count, total, color, nested = false) {
  return `<div class="legend-row${nested ? ' legend-row-nested' : ''}">
    <span class="swatch" style="background:${color}"></span>
    <span>${escapeHtml(name || 'Non renseigné')}</span>
    <span class="count">${count} (${Math.round(count / total * 100)}%)</span>
  </div>`;
}

function pieSvg(entries, total) {
  if (!entries.length) {
    return '<svg class="pie" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#ddd"></circle><circle cx="36" cy="36" r="34" fill="none" stroke="#fff" stroke-width="1.5"></circle></svg>';
  }
  if (entries.length === 1) {
    return `<svg class="pie" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="${colorForIndex(0)}"></circle><circle cx="36" cy="36" r="34" fill="none" stroke="#fff" stroke-width="1.5"></circle></svg>`;
  }
  let start = -90;
  const paths = entries.map(([, count], index) => {
    const angle = index === entries.length - 1 ? 270 : start + (count / total * 360);
    const path = sectorPath(36, 36, 34, start, angle);
    start = angle;
    return `<path d="${path}" fill="${colorForIndex(index)}"></path>`;
  }).join('');
  return `<svg class="pie" viewBox="0 0 72 72" aria-hidden="true">${paths}<circle cx="36" cy="36" r="34" fill="none" stroke="#fff" stroke-width="1.5"></circle></svg>`;
}

function colorForIndex(index) {
  if (index < COLORS.length) return COLORS[index];
  const hue = (index * 137.508) % 360;
  return `hsl(${Math.round(hue)} 58% 42%)`;
}

function sectorPath(cx, cy, radius, startAngle, endAngle) {
  const start = polarPoint(cx, cy, radius, endAngle);
  const end = polarPoint(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function polarPoint(cx, cy, radius, angle) {
  const radians = angle * Math.PI / 180;
  return {
    x: round(cx + radius * Math.cos(radians)),
    y: round(cy + radius * Math.sin(radians))
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function groupCount(actions, key, limit = 0) {
  const map = new Map();
  actions.forEach(action => map.set(action[key] || 'Non renseigné', (map.get(action[key] || 'Non renseigné') || 0) + 1));
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
  if (!limit || entries.length <= limit) return entries;
  const visible = entries.slice(0, limit);
  const others = entries.slice(limit).reduce((sum, [, count]) => sum + count, 0);
  return [...visible, ['Autres fédérations', others]];
}

function federationClubCounts(actions) {
  const clubsByFederation = new Map();
  actions.forEach(action => {
    const federation = action.federation || 'Non renseigné';
    const club = action.clubId || action.club || action.id;
    if (!clubsByFederation.has(federation)) clubsByFederation.set(federation, new Set());
    clubsByFederation.get(federation).add(club);
  });
  return [...clubsByFederation.entries()]
    .map(([name, clubs]) => [name, clubs.size])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
}

function sortActions(actions) {
  const {key, direction} = state.sort;
  if (!key || !direction) return actions;
  const factor = direction === 'asc' ? 1 : -1;
  return [...actions].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (typeof left === 'number' && typeof right === 'number') return factor * (left - right);
    return factor * String(left || '').localeCompare(String(right || ''), 'fr', {numeric: true});
  });
}

function funderTotals(actions) {
  const map = new Map();
  actions.forEach(action => action.financeurs.forEach(item => map.set(item.label, (map.get(item.label) || 0) + item.montant)));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function statusClass(status) {
  return String(status)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function statusFieldConfig(status) {
  const normalized = statusClass(status);
  if (normalized === 'projet' || normalized === 'a-confirmer') return {kind: 'text', label: 'Période de réalisation'};
  if (normalized === 'planifie' || normalized === 'planifiee') return {kind: 'date', label: 'Date de planification'};
  if (normalized === 'realise' || normalized === 'realisee') return {kind: 'date', label: 'Date de réalisation'};
  if (normalized === 'annule' || normalized === 'annulee') return {kind: 'none', label: ''};
  return {kind: 'date', label: 'Date'};
}

function statusPeriodControl(status, action) {
  const config = statusFieldConfig(status);
  const visible = status === action.statut;
  let input = '';
  if (config.kind === 'date') {
    const iso = dateInputValue(action.date);
    input = `<ft-datepicker class="edit-status-period" data-period-kind="date" data-iso-value="${escapeAttr(iso)}" value="${escapeAttr(isoToFrDate(iso))}"><span slot="label">${escapeHtml(config.label)}</span></ft-datepicker>`;
  } else if (config.kind === 'text') {
    input = `<input class="form-control edit-status-period" data-period-kind="text" type="text" value="${escapeAttr(action.periodeApprox)}">`;
  }
  return `<div class="status-period${visible ? '' : ' is-hidden'}" data-status-date="${escapeAttr(status)}">${input}</div>`;
}

function outerPeriodLabel(status) {
  const config = statusFieldConfig(status);
  return config.kind === 'text' ? config.label : '';
}

function statusPeriodValue(action) {
  const config = statusFieldConfig(action.statut);
  if (config.kind === 'text') return action.periodeApprox;
  if (config.kind === 'date') return formatDate(action.date);
  return '';
}

function formatEuro(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')} €`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(Number(value) * 1000);
  return date.toLocaleDateString('fr-FR');
}

function withExistingValues(choices, values) {
  const extras = [...new Set(values.filter(value => value && !choices.includes(value)))].sort((a, b) => a.localeCompare(b, 'fr'));
  return [...choices, ...extras];
}

function formatChoiceList(value) {
  return choiceValues(value).join(', ');
}

function choiceValues(value) {
  if (!Array.isArray(value)) return value ? [String(value)] : [];
  return value[0] === 'L' ? value.slice(1) : value;
}

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(Number(value) * 1000);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

// <ft-datepicker> attend/renvoie le format "JJ/MM/AAAA", le reste du widget
// travaille en "AAAA-MM-JJ" (comme <input type="date">).
function isoToFrDate(iso) {
  const m = String(iso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function frDateToIso(fr) {
  const m = String(fr || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function exportCsv(actions) {
  const header = ['Agence', 'DD', 'DR', 'Club', 'Fédération', 'Action', 'Dispositif', 'Participants', 'Public', 'Ville', 'Statut', 'Date', 'Budget', 'Montant cofinancé', 'Financeurs'];
  const lines = actions.map(action => [
    action.agency, action.dd, action.dr, action.club, action.federation, action.intitule, action.dispositif,
    action.participants, action.public, action.ville, action.statut, formatDate(action.date), Math.round(action.budget), Math.round(action.financed),
    action.financeurs.map(item => `${item.label}: ${Math.round(item.montant)}`).join(' | ')
  ]);
  const csv = [header, ...lines].map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'actions-insertion-sport.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
