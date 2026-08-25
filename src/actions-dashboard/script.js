grist.ready({requiredAccess: 'full'});

const TABLES = ['Actions', 'Cofinancements', 'Agences', 'DD', 'DR', 'Structures', 'Dispositifs', 'Federations', 'Financements', 'Financeurs'];
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

const state = { raw: {}, actions: [], filters: {}, summaryOpen: false };

document.getElementById('resetBtn').addEventListener('click', () => {
  state.filters = {};
  render();
});

document.getElementById('toggleSummary').addEventListener('click', () => {
  state.summaryOpen = !state.summaryOpen;
  render();
});

document.getElementById('exportBtn').addEventListener('click', () => exportCsv(filteredActions()));

load();

async function load() {
  try {
    const data = await Promise.all(TABLES.map(async table => [table, rows(await grist.docApi.fetchTable(table))]));
    state.raw = Object.fromEntries(data);
    state.actions = buildActions(state.raw);
    render();
  } catch (error) {
    document.getElementById('rows').innerHTML = '';
    document.getElementById('empty').classList.remove('is-hidden');
    document.getElementById('empty').textContent = "Impossible de lire les tables Grist. Vérifiez que le widget a l'accès complet.";
    console.error(error);
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
  const dispositifs = byId(raw.Dispositifs);
  const federations = byId(raw.Federations);
  const financements = byId(raw.Financements);
  const financeurs = byId(raw.Financeurs);
  const cofs = raw.Cofinancements.reduce((acc, cof) => {
    const actionId = cof.A || cof.Projet;
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
      statut: action.Statut || '',
      date: action.Date || null,
      agency: agency.Libelle_agence || agency.Code_Aurore || '',
      dd: dd.Nom || '',
      dr: dr.Nom || '',
      club: club.Nom || '',
      commune: club.Siege || '',
      dispositif: dispositif.Dispositif || dispositif.Code || '',
      federation: federation.Nom || '',
      financeurs: lines
    };
  });
}

function render() {
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
    return `<label>${escapeHtml(label)}<select data-filter="${key}">
      <option value="">Toutes / Tous</option>
      ${values.map(value => `<option value="${escapeAttr(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}
    </select></label>`;
  }).join('');

  container.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', event => {
      const key = event.target.dataset.filter;
      state.filters[key] = event.target.value;
      if (!state.filters[key]) delete state.filters[key];
      render();
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

function filteredActions() {
  return state.actions.filter(action => Object.entries(state.filters).every(([key, value]) => {
    if (key === 'financeur') return action.financeurs.some(item => item.label === value);
    return action[key] === value;
  }));
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
      ${pieBlock('Répartition par fédération', groupCount(actions, 'federation'))}
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
      <td><div class="strong">${escapeHtml(action.club)}</div><div class="muted">${escapeHtml(action.commune)}</div><div class="muted">${escapeHtml(action.federation)}</div></td>
      <td><div class="strong">${escapeHtml(action.intitule)}</div><div class="muted">${escapeHtml(action.dispositif)}</div><div class="muted">${action.participants} participants</div><div class="muted">Public : ${escapeHtml(action.public || 'non renseigné')}</div></td>
      <td><span class="tag ${statusClass(action.statut)}">${escapeHtml(action.statut)}</span><div class="muted" style="margin-top:8px">${formatDate(action.date)}</div></td>
      <td>
        <div class="strong">Budget : ${formatEuro(action.budget)}</div>
        <div class="bar"><span style="width:${Math.round(action.rate * 100)}%"></span></div>
        <div class="muted">Couvert à ${Math.round(action.rate * 100)}% (${formatEuro(action.financed)})</div>
        ${action.financeurs.map(item => `<div class="money-line"><span>${escapeHtml(item.label)}</span><span>${formatEuro(item.montant)}</span></div>`).join('')}
      </td>
    </tr>
  `).join('');
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

function groupCount(actions, key) {
  const map = new Map();
  actions.forEach(action => map.set(action[key] || 'Non renseigné', (map.get(action[key] || 'Non renseigné') || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
}

function funderTotals(actions) {
  const map = new Map();
  actions.forEach(action => action.financeurs.forEach(item => map.set(item.label, (map.get(item.label) || 0) + item.montant)));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function statusClass(status) {
  return String(status).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
  if (!Array.isArray(value)) return value || '';
  const choices = value[0] === 'L' ? value.slice(1) : value;
  return choices.join(', ');
}

function exportCsv(actions) {
  const header = ['Agence', 'DD', 'DR', 'Club', 'Fédération', 'Action', 'Dispositif', 'Participants', 'Public', 'Statut', 'Date', 'Budget', 'Montant cofinancé', 'Financeurs'];
  const lines = actions.map(action => [
    action.agency, action.dd, action.dr, action.club, action.federation, action.intitule, action.dispositif,
    action.participants, action.public, action.statut, formatDate(action.date), formatEuro(action.budget), formatEuro(action.financed),
    action.financeurs.map(item => `${item.label}: ${formatEuro(item.montant)}`).join(' | ')
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

