grist.ready({requiredAccess: 'full'});

const TABLES = ['Actions', 'Cofinancements', 'Agences', 'DD', 'DR', 'Structures', 'Communes', 'Dispositifs', 'Federations', 'Financements', 'Financeurs'];
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
const FILTERS = [
  ['dr', 'Direction régionale (DR)'],
  ['dd', 'Direction départementale (DD)'],
  ['agence', 'Agence'],
  ['federation', 'Fédération'],
  ['club', 'Club'],
  ['dispositif', 'Dispositif'],
  ['statut', 'Statut'],
  ['financeur', 'Financement']
];

const state = { raw: {}, actions: [], filters: {}, statusChoices: [], summaryOpen: false, sort: {}, view: 'dashboard', editingId: null };

document.getElementById('resetBtn').addEventListener('click', () => {
  state.filters = {};
  render();
});

document.getElementById('toggleSummary').addEventListener('click', () => {
  state.summaryOpen = !state.summaryOpen;
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => exportCsv(filteredActions()));

document.querySelectorAll('[data-sort]').forEach(select => {
  select.addEventListener('change', event => {
    const key = event.target.dataset.sort;
    const direction = event.target.value;
    state.sort = direction ? {key, direction} : {};
    document.querySelectorAll('[data-sort]').forEach(menu => {
      if (menu !== event.target) menu.value = '';
    });
    renderRows(filteredActions());
  });
});

load();

async function load() {
  try {
    const data = await Promise.all(TABLES.map(async table => [table, rows(await grist.docApi.fetchTable(table))]));
    state.raw = Object.fromEntries(data);
    state.statusChoices = await loadStatusChoices();
    state.actions = buildActions(state.raw);
    render();
  } catch (error) {
    document.getElementById('rows').innerHTML = '';
    document.getElementById('empty').classList.remove('is-hidden');
    document.getElementById('empty').textContent = "Impossible de lire les tables Grist. Vérifiez que le widget a l'accès complet.";
    console.error(error);
  }
}

async function loadStatusChoices() {
  try {
    const [tables, columns] = await Promise.all([
      grist.docApi.fetchTable('_grist_Tables'),
      grist.docApi.fetchTable('_grist_Tables_column')
    ]);
    const actionTable = rows(tables).find(table => table.tableId === 'Actions');
    const statusColumn = rows(columns).find(column => column.parentId === actionTable?.id && column.colId === 'Statut');
    const options = parseWidgetOptions(statusColumn?.widgetOptions);
    return Array.isArray(options.choices) ? options.choices : [];
  } catch (error) {
    console.warn('Impossible de lire les choix de statut', error);
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

function byId(items) {
  return new Map(items.map(item => [item.id, item]));
}

function buildActions(raw) {
  const actions = byId(raw.Actions);
  const agencies = byId(raw.Agences);
  const dds = byId(raw.DD);
  const drs = byId(raw.DR);
  const clubs = byId(raw.Structures);
  const communes = communesByCode(raw.Communes);
  const dispositifs = byId(raw.Dispositifs);
  const federations = byId(raw.Federations);
  const financements = byId(raw.Financements);
  const financeurs = byId(raw.Financeurs);
  const cofs = raw.Cofinancements.reduce((acc, cof) => {
    const actionId = cof.A;
    if (!actionId || !actions.has(actionId)) return acc;
    const financement = financements.get(cof.Financement) || {};
    const financeur = financeurs.get(financement.Financeur) || {};
    const label = financeur.Nom === 'France Travail' ? financement.Enveloppe : financeur.Nom;
    (acc[actionId] ||= []).push({...cof, label: label || 'Financeur', montant: Number(cof.Montant || 0)});
    return acc;
  }, {});

  return raw.Actions.map(action => {
    const agency = agencies.get(action.Agence) || {};
    const dd = dds.get(agency.DD) || {};
    const dr = drs.get(dd.DR) || {};
    const club = clubs.get(action.Club) || {};
    const dispositif = dispositifs.get(action.Dispositif) || {};
    const federation = federations.get(action.Federation) || {};
    const lines = cofs[action.id] || [];
    const financed = lines.reduce((sum, item) => sum + item.montant, 0);
    return {
      id: action.id,
      intitule: action.Intitule || '',
      budget: Number(action.Budget || 0),
      financed,
      rate: action.Budget ? financed / Number(action.Budget) : 0,
      participants: Number(action.Jauge || 0),
      public: formatChoiceList(action.Public),
      publicChoices: choiceValues(action.Public),
      statut: action.Statut || '',
      date: action.Date || null,
      clubId: action.Club || 0,
      agencyId: action.Agence || 0,
      dispositifId: action.Dispositif || 0,
      federationId: action.Federation || 0,
      agency: agency.Libelle_agence || agency.Code_Aurore || '',
      dd: dd.Nom || '',
      dr: dr.Nom || '',
      club: club.Nom || '',
      ville: cityOf(club, communes),
      dispositif: dispositif.Dispositif || dispositif.Code || '',
      federation: federation.Nom || '',
      financeurs: lines
    };
  });
}

function render() {
  const editing = state.view === 'edit';
  document.getElementById('dashboardView').classList.toggle('is-hidden', editing);
  document.getElementById('editView').classList.toggle('is-hidden', !editing);
  if (editing) {
    renderEdit();
    requestResize();
    return;
  }
  renderFilters();
  const actions = filteredActions();
  renderSummary(actions);
  renderRows(actions);
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
  container.innerHTML = FILTERS.map(([key, label]) => {
    const values = optionsFor(key);
    const selected = state.filters[key] || '';
    if (key === 'club') {
      return `<label>${escapeHtml(label)}
        <input class="filter-search" type="search" list="clubSuggestions" data-club-search value="${escapeAttr(selected)}" placeholder="Rechercher un club" aria-label="Rechercher un club">
        <datalist id="clubSuggestions">${values.map(value => `<option value="${escapeAttr(value)}"></option>`).join('')}</datalist>
      </label>`;
    }
    return `<label>${escapeHtml(label)}
      <select data-filter="${key}">
      <option value="">Toutes / Tous</option>
      ${values.map(value => `<option value="${escapeAttr(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}
      </select>
    </label>`;
  }).join('');

  container.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', event => {
      const key = event.target.dataset.filter;
      state.filters[key] = event.target.value;
      if (!state.filters[key]) delete state.filters[key];
      render();
    });
  });

  container.querySelectorAll('[data-club-search]').forEach(input => {
    input.addEventListener('input', event => {
      const value = event.target.value;
      if (value) state.filters.club = value;
      else delete state.filters.club;
      const actions = filteredActions();
      renderSummary(actions);
      renderRows(actions);
      requestResize();
    });
  });
}

function optionsFor(key) {
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
    if (key === 'club') return normalizeText(action.club).includes(normalizeText(value));
    return action[key] === value;
  }));
  return sortActions(actions);
}

function renderSummary(actions) {
  const summary = document.getElementById('summary');
  const section = document.getElementById('summarySection');
  document.getElementById('toggleSummary').textContent = state.summaryOpen ? 'Replier' : 'Déplier';
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
      ${pieBlock('Répartition par fédération', groupCount(actions, 'federation', 10))}
    </div>
  `;
}

function renderRows(actions) {
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  empty.classList.toggle('is-hidden', actions.length > 0);
  tbody.innerHTML = actions.map(action => `
    <tr>
      <td><div class="strong">${escapeHtml(action.agency)}</div><div class="muted">${escapeHtml(action.dd)}</div><div class="muted">${escapeHtml(action.dr)}</div></td>
      <td><div class="strong">${escapeHtml(action.club)}</div><div class="muted">${escapeHtml(action.ville)}</div><div class="muted">${escapeHtml(action.federation)}</div></td>
      <td><div class="strong">${escapeHtml(action.intitule)}</div><div class="muted">${escapeHtml(action.dispositif)}</div><div class="muted">${action.participants} participants</div><div class="muted">Public : ${escapeHtml(action.public || 'non renseigné')}</div></td>
      <td><span class="tag ${statusClass(action.statut)}">${escapeHtml(action.statut)}</span><div class="muted" style="margin-top:8px">${formatDate(action.date)}</div></td>
      <td>
        <div class="strong">Budget : ${formatEuro(action.budget)}</div>
        <div class="bar"><span style="width:${Math.round(action.rate * 100)}%"></span></div>
        <div class="muted">Couvert à ${Math.round(action.rate * 100)}% (${formatEuro(action.financed)})</div>
        ${action.financeurs.map(item => `<div class="money-line"><span>${escapeHtml(item.label)}</span><span>${formatEuro(item.montant)}</span></div>`).join('')}
      </td>
      <td><button class="edit-button" data-edit-action="${action.id}">Modifier</button></td>
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
  const agency = byId(state.raw.Agences).get(action.agencyId) || {};
  const dd = byId(state.raw.DD).get(agency.DD) || {};
  const dr = byId(state.raw.DR).get(dd.DR) || {};
  const club = byId(state.raw.Structures).get(action.clubId) || {};
  const statusChoices = state.statusChoices.length ? state.statusChoices : [...new Set(state.actions.map(item => item.statut).filter(Boolean))];
  const publicChoices = [...new Set(state.actions.flatMap(item => item.publicChoices))].sort((a, b) => a.localeCompare(b, 'fr'));
  const total = action.financeurs.reduce((sum, item) => sum + item.montant, 0);
  const editView = document.getElementById('editView');
  editView.innerHTML = `
    <header class="edit-header">
      <button class="back-button" id="backToDashboard">← Actions d'insertion par le sport</button>
      <h1>${escapeHtml(action.intitule || 'Modifier une action')}</h1>
    </header>
    <div class="edit-message is-hidden" id="editMessage"></div>
    <form id="editForm">
      <div class="edit-layout">
        <section class="edit-card">
          <div class="section-head"><span>Action</span></div>
          <div class="edit-fields">
            <div class="edit-field"><label for="editTitle">Intitulé de l'action</label><input id="editTitle" required value="${escapeAttr(action.intitule)}"></div>
            <div class="edit-field"><label for="editDispositif">Dispositif</label><select id="editDispositif">${referenceOptions(state.raw.Dispositifs, action.dispositifId, item => item.Dispositif || item.Code || '')}</select></div>
            <div class="edit-field"><label for="editParticipants">Nombre de participants</label><input id="editParticipants" type="number" min="0" value="${action.participants}"></div>
            <div class="edit-field"><label>Public</label><div class="public-picker" id="publicPicker"><button class="public-toggle" type="button" id="publicToggle"><span id="publicToggleValue">${escapeHtml(action.publicChoices.join(', ') || 'Choisir un public')}</span><span aria-hidden="true">&#9662;</span></button><div class="public-options">${publicChoices.map(value => `<label class="public-option"><input class="public-choice" type="checkbox" value="${escapeAttr(value)}"${action.publicChoices.includes(value) ? ' checked' : ''}>${escapeHtml(value)}</label>`).join('')}</div></div></div>
          </div>
        </section>
        <section class="edit-card">
          <div class="section-head"><span>Agence</span></div>
          <div class="edit-fields">
            <div class="edit-field"><label for="editAgency">Agence</label><select id="editAgency">${referenceOptions(state.raw.Agences, action.agencyId, item => item.Libelle_agence || item.Code_Aurore || '')}</select></div>
            <div class="edit-field"><label>Direction départementale (DD)</label><div class="readonly-value" id="editDd">${escapeHtml(dd.Nom || '')}</div></div>
            <div class="edit-field"><label>Direction régionale (DR)</label><div class="readonly-value" id="editDr">${escapeHtml(dr.Nom || '')}</div></div>
          </div>
        </section>
        <section class="edit-card">
          <div class="section-head"><span>Club</span></div>
          <div class="edit-fields">
            <div class="edit-field"><label for="editClub">Club</label><select id="editClub">${referenceOptions(state.raw.Structures, action.clubId, item => item.Nom || '')}</select></div>
            <div class="edit-field"><label>Ville</label><div class="readonly-value" id="editCity">${escapeHtml(cityOf(club, communesByCode(state.raw.Communes)))}</div></div>
            <div class="edit-field"><label>Fédération</label><div class="readonly-value">${escapeHtml(action.federation)}</div></div>
          </div>
        </section>
        <section class="edit-card">
          <div class="section-head"><span>Statut</span></div>
          <div class="edit-fields">
            <div class="status-editor" id="statusEditor">
              <span class="status-editor-label">Statut de l'action</span><span class="status-editor-label">Date de planification</span>
              ${statusChoices.map(status => `<label class="status-option ${statusClass(status)}"><input type="radio" name="editStatus" value="${escapeAttr(status)}"${status === action.statut ? ' checked' : ''}>${escapeHtml(status)}</label><div class="status-date${status === action.statut ? '' : ' is-hidden'}" data-status-date="${escapeAttr(status)}"><input class="edit-status-date" type="date" value="${status === action.statut ? dateInputValue(action.date) : ''}"></div>`).join('')}
            </div>
          </div>
        </section>
        <section class="edit-card finance-card">
          <div class="section-head"><span>Financement</span><div class="finance-summary"><span>Financé : <strong id="editFinanced">${formatEuro(total)}</strong></span><span class="finance-progress"><i id="editProgress" style="width:${Math.min(100, action.budget ? Math.round(total / action.budget * 100) : 0)}%"></i></span><span>Reste à financer : <strong id="editRemaining">${formatEuro(Math.max(0, action.budget - total))}</strong></span></div></div>
          <div class="finance-editor">
            <div class="edit-field finance-budget"><label for="editBudget">Budget total (€)</label><input id="editBudget" type="number" min="0" value="${Math.round(action.budget)}"></div>
            <div class="finance-list">
              <div class="finance-list-head"><span>Financeur</span><span>Montant (€)</span><span aria-hidden="true"></span></div>
              <div id="financeRows">${action.financeurs.map(item => financeRow(item)).join('')}</div>
              <button class="add-finance-button" type="button" id="addFinance">+ Ajouter un financeur</button>
            </div>
          </div>
        </section>
      </div>
      <div class="edit-actions"><button type="button" class="cancel-button" id="cancelEdit">Annuler</button><button class="save-button" type="submit">Enregistrer</button></div>
    </form>
  `;
  document.getElementById('backToDashboard').addEventListener('click', closeEdit);
  document.getElementById('cancelEdit').addEventListener('click', closeEdit);
  document.getElementById('editAgency').addEventListener('change', updateAgencyDetails);
  document.getElementById('editClub').addEventListener('change', updateClubDetails);
  document.getElementById('editBudget').addEventListener('input', updateFinanceSummary);
  bindPublicPicker();
  bindStatusEditor();
  document.getElementById('addFinance').addEventListener('click', () => {
    document.getElementById('financeRows').insertAdjacentHTML('beforeend', financeRow({}));
    bindFinanceRows();
  });
  document.getElementById('editForm').addEventListener('submit', event => saveEdit(event, action));
  bindFinanceRows();
}

function bindStatusEditor() {
  const editor = document.getElementById('statusEditor');
  editor.querySelectorAll('[name="editStatus"]').forEach(radio => radio.addEventListener('change', () => {
    const previousDate = editor.querySelector('.status-date:not(.is-hidden) input')?.value || '';
    editor.querySelectorAll('.status-date').forEach(container => {
      const visible = container.dataset.statusDate === radio.value;
      container.classList.toggle('is-hidden', !visible);
      if (visible) container.querySelector('input').value = previousDate;
    });
  }));
}

function bindPublicPicker() {
  const picker = document.getElementById('publicPicker');
  const toggle = document.getElementById('publicToggle');
  toggle.addEventListener('click', event => {
    event.stopPropagation();
    picker.classList.toggle('is-open');
  });
  picker.addEventListener('click', event => event.stopPropagation());
  picker.querySelectorAll('.public-choice').forEach(choice => choice.addEventListener('change', () => {
    const selected = [...picker.querySelectorAll('.public-choice:checked')].map(input => input.value);
    document.getElementById('publicToggleValue').textContent = selected.join(', ') || 'Choisir un public';
  }));
  document.addEventListener('click', () => picker.classList.remove('is-open'));
}

function referenceOptions(items, selectedId, labelFor) {
  return [...items]
    .map(item => [item.id, labelFor(item)])
    .filter(([, label]) => label)
    .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
    .map(([id, label]) => `<option value="${id}"${id === selectedId ? ' selected' : ''}>${escapeHtml(label)}</option>`)
    .join('');
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

function financeRow(item) {
  return `<div class="finance-row" data-cofinancement-id="${item.id || ''}">
    <select class="finance-select"><option value="">Choisir un financeur</option>${financeOptions(item.Financement)}</select>
    <input class="finance-amount" type="number" min="0" placeholder="Montant" value="${item.montant == null ? '' : Math.round(item.montant)}">
    <button class="remove-finance-button" type="button">Retirer</button>
  </div>`;
}

function bindFinanceRows() {
  document.querySelectorAll('.remove-finance-button').forEach(button => {
    button.onclick = () => {
      button.closest('.finance-row').remove();
      updateFinanceSummary();
    };
  });
  document.querySelectorAll('.finance-amount').forEach(input => input.oninput = updateFinanceSummary);
}

function updateAgencyDetails() {
  const agency = byId(state.raw.Agences).get(Number(document.getElementById('editAgency').value)) || {};
  const dd = byId(state.raw.DD).get(agency.DD) || {};
  const dr = byId(state.raw.DR).get(dd.DR) || {};
  document.getElementById('editDd').textContent = dd.Nom || '';
  document.getElementById('editDr').textContent = dr.Nom || '';
}

function updateClubDetails() {
  const club = byId(state.raw.Structures).get(Number(document.getElementById('editClub').value)) || {};
  document.getElementById('editCity').textContent = cityOf(club, communesByCode(state.raw.Communes));
}

function updateFinanceSummary() {
  const total = [...document.querySelectorAll('.finance-amount')].reduce((sum, input) => sum + Number(input.value || 0), 0);
  const budget = Number(document.getElementById('editBudget').value || 0);
  document.getElementById('editFinanced').textContent = formatEuro(total);
  document.getElementById('editRemaining').textContent = formatEuro(Math.max(0, budget - total));
  document.getElementById('editProgress').style.width = `${Math.min(100, budget ? Math.round(total / budget * 100) : 0)}%`;
}

function closeEdit() {
  state.view = 'dashboard';
  state.editingId = null;
  render();
}

async function saveEdit(event, action) {
  event.preventDefault();
  const message = document.getElementById('editMessage');
  const submit = event.currentTarget.querySelector('[type="submit"]');
  const publicValues = [...document.querySelectorAll('.public-choice:checked')].map(input => input.value);
  const rows = [...document.querySelectorAll('.finance-row')].map(row => ({
    id: Number(row.dataset.cofinancementId || 0),
    financement: Number(row.querySelector('.finance-select').value || 0),
    montant: Number(row.querySelector('.finance-amount').value || 0)
  })).filter(row => row.financement && row.montant >= 0);
  const status = document.querySelector('[name="editStatus"]:checked')?.value || '';
  const date = document.querySelector('.status-date:not(.is-hidden) .edit-status-date')?.value || '';
  const actionUpdate = {
    Intitule: document.getElementById('editTitle').value.trim(),
    Dispositif: Number(document.getElementById('editDispositif').value || 0),
    Jauge: Number(document.getElementById('editParticipants').value || 0),
    Public: ['L', ...publicValues],
    Agence: Number(document.getElementById('editAgency').value || 0),
    Club: Number(document.getElementById('editClub').value || 0),
    Statut: status,
    Date: date ? Math.floor(new Date(`${date}T00:00:00`).getTime() / 1000) : null,
    Budget: Number(document.getElementById('editBudget').value || 0)
  };
  const currentIds = new Set(action.financeurs.map(item => item.id));
  const usedIds = new Set(rows.filter(row => row.id).map(row => row.id));
  const userActions = [['UpdateRecord', 'Actions', action.id, actionUpdate]];
  rows.forEach(row => {
    if (row.id && currentIds.has(row.id)) userActions.push(['UpdateRecord', 'Cofinancements', row.id, {Financement: row.financement, Montant: row.montant, A: action.id}]);
    else userActions.push(['AddRecord', 'Cofinancements', null, {Financement: row.financement, Montant: row.montant, A: action.id}]);
  });
  action.financeurs.filter(item => !usedIds.has(item.id)).forEach(item => userActions.push(['RemoveRecord', 'Cofinancements', item.id]));
  try {
    submit.disabled = true;
    message.classList.add('is-hidden');
    await grist.docApi.applyUserActions(userActions);
    state.view = 'dashboard';
    state.editingId = null;
    await load();
  } catch (error) {
    message.textContent = "L'enregistrement n'a pas abouti. Vérifiez l'accès complet du widget puis réessayez.";
    message.classList.remove('is-hidden');
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

function communesByCode(communes) {
  const map = new Map();
  (communes || []).forEach(commune => {
    if (commune.Code_Insee && commune.Libelle_Commune && !map.has(commune.Code_Insee)) {
      map.set(commune.Code_Insee, commune.Libelle_Commune);
    }
  });
  return map;
}

function cityOf(club, communes = new Map()) {
  const city = communes.get(club.Code_Insee);
  if (city) return city;
  const fallback = String(club.Siege || '').trim();
  return fallback === 'Oui' || fallback === 'Non' ? '' : fallback;
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

function formatEuro(value) {
  return `${Math.round(Number(value || 0)).toLocaleString('fr-FR')} €`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(Number(value) * 1000);
  return date.toLocaleDateString('fr-FR');
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

function exportCsv(actions) {
  const header = ['Agence', 'DD', 'DR', 'Club', 'Fédération', 'Action', 'Dispositif', 'Participants', 'Public', 'Statut', 'Date', 'Budget', 'Montant cofinancé', 'Financeurs'];
  const lines = actions.map(action => [
    action.agency, action.dd, action.dr, action.club, action.federation, action.intitule, action.dispositif,
    action.participants, action.public, action.statut, formatDate(action.date), Math.round(action.budget), Math.round(action.financed),
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
