// Widget « Clubs » : une liste filtrable de la table Structures, et la fiche
// d'un club qui remplace la liste quand on clique sur « Voir ». Meme motif que
// src/actions-dashboard/ (state.view bascule entre deux vues), en plus simple :
// pas de fiche modifiable, pas de synthese, pas de tri de colonnes.
grist.ready({requiredAccess: 'full', allowSelectBy: false});

const TABLES = ['Structures', 'Communes', 'DD', 'DR', 'Federations', 'Contacts', 'Actions', 'Cofinancements'];

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

const state = {raw: {}, clubs: [], filters: {}, view: 'list', currentId: null};

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
    const data = await Promise.all(TABLES.map(async table => {
      try {
        return [table, rows(await grist.docApi.fetchTable(table))];
      } catch (error) {
        console.warn(`Accès refusé ou table introuvable : ${table}`, error);
        return [table, []];
      }
    }));
    state.raw = Object.fromEntries(data);
    state.clubs = buildClubs(state.raw);
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
      <td>${escapeHtml(club.nom || 'Club sans nom')}</td>
      <td>${escapeHtml(club.codePostal) || missing()}</td>
      <td>${escapeHtml(club.ville) || missing()}</td>
      <td>${escapeHtml(club.dd) || missing()}</td>
      <td>${escapeHtml(club.dr) || missing()}</td>
      <td>${club.federations.length ? escapeHtml(club.federations.join(', ')) : missing()}</td>
      <td><button class="btn btn-secondary btn-sm" type="button" data-open-club="${club.id}"><span class="btn-content">Voir</span></button></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-open-club]').forEach(button => {
    button.addEventListener('click', () => {
      state.currentId = Number(button.dataset.openClub);
      state.view = 'fiche';
      render();
    });
  });
}

// Une valeur non renseignee reste distinguable d'une cellule vide par erreur,
// pour un lecteur d'ecran comme a l'oeil.
function missing() {
  return '<span class="muted-text"><span aria-hidden="true">—</span><span class="sr-only">Non renseigné</span></span>';
}

// ---------------------------------------------------------------------------
// Fiche (etape suivante : pour l'instant, juste l'identite et le retour, pour
// valider l'aller-retour avec la liste avant d'y ajouter contacts, actions,
// zonages et logo)
// ---------------------------------------------------------------------------

function renderFiche() {
  const club = state.clubs.find(item => item.id === state.currentId);
  const ficheView = document.getElementById('ficheView');
  if (!club) {
    state.view = 'list';
    render();
    return;
  }
  ficheView.innerHTML = `
    <div class="fiche-header">
      <button class="btn btn-secondary btn-sm" type="button" id="backToList"><span class="btn-content">&larr; Retour à la liste</span></button>
    </div>
    <p class="fiche-placeholder">Fiche de ${escapeHtml(club.nom || 'ce club')} — à compléter.</p>
  `;
  document.getElementById('backToList').addEventListener('click', () => {
    state.view = 'list';
    state.currentId = null;
    render();
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
