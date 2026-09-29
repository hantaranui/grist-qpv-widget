// Fiche club : en-tete d'identite, zonages QPV et FRR, contacts et actions du
// club selectionne dans la table Structures. Tout est en lecture seule, sauf le
// logo, que l'on peut ajouter quand il manque.
//
// L'acces complet est necessaire a deux titres : lire d'autres tables que celle
// du widget (Contacts, Actions...), et obtenir un jeton d'ecriture pour
// televerser le logo.
grist.ready({requiredAccess: 'full', allowSelectBy: false});

const TABLES = ['Structures', 'Contacts', 'Actions', 'Cofinancements', 'Dispositifs'];
const TABLE_CLUBS = 'Structures';

const BAN_URL = 'https://api-adresse.data.gouv.fr/search/';
const GEO_COMMUNES_URL = 'https://geo.api.gouv.fr/communes/';
const QPV_DATASET_URL = 'https://www.data.gouv.fr/api/1/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/';
// Copie versionnee de la liste nationale : voir scripts/maj-frr.js pour la
// raison de cette copie et la facon de la rafraichir.
const FRR_URL = 'donnees/frr-communes.json';
const OBSERVATOIRE_FRR_URL = 'https://www.observatoire-des-territoires.gouv.fr/frr-france-ruralites-revitalisation';

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

const state = {
  raw: null,
  unreadable: [],
  clubId: null,
  tableId: null,
  readAccess: null,
  upload: {busy: false, message: '', kind: ''},
};

// Les requetes en ligne sont memorisees par cle : un nouveau rendu du meme club
// (donnees rafraichies, logo ajoute) reprend le resultat au lieu de relancer le
// geocodage et les telechargements.
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

grist.onRecord(record => selectClub(record ? record.id : null));
checkTable();

async function checkTable() {
  try {
    if (grist.selectedTable && typeof grist.selectedTable.getTableId === 'function') {
      state.tableId = await grist.selectedTable.getTableId();
    }
  } catch (error) {
    // Sans cette information, on suppose le widget bien pose : l'absence du club
    // dans Structures le dira sinon.
  }
  if (state.tableId && state.tableId !== TABLE_CLUBS) {
    renderMessage(`Ce widget affiche un club de la table ${TABLE_CLUBS}. Choisissez-la comme table du widget dans le panneau de configuration.`);
  }
}

let loadSeq = 0;

async function selectClub(id) {
  state.clubId = id;
  state.upload = {busy: false, message: '', kind: ''};
  if (!id) {
    renderMessage('Sélectionnez un club pour afficher sa fiche.');
    return;
  }
  // Affichage immediat avec les tables deja lues, puis nouveau rendu quand leur
  // relecture aboutit : une modification faite ailleurs apparait sans attendre
  // que l'utilisateur change de club.
  if (state.raw) renderCurrent();
  await refreshData();
}

async function refreshData() {
  const seq = ++loadSeq;
  try {
    const [loaded, readAccess] = await Promise.all([
      loadTables(),
      grist.docApi.getAccessToken({readOnly: true}).catch(() => null),
    ]);
    if (seq !== loadSeq) return;
    state.raw = loaded.raw;
    state.unreadable = loaded.unreadable;
    state.readAccess = readAccess;
    renderCurrent();
  } catch (error) {
    if (seq !== loadSeq) return;
    console.error(error);
    renderMessage("Impossible de lire la table Structures. Vérifiez que le widget a l'accès complet au document.");
  }
}

async function loadTables() {
  const unreadable = [];
  const entries = await Promise.all(TABLES.map(async table => {
    try {
      return [table, rows(await grist.docApi.fetchTable(table))];
    } catch (error) {
      // Une table refusee par les regles d'acces ne doit pas priver l'utilisateur
      // du reste de la fiche. Seule Structures est indispensable.
      if (table === TABLE_CLUBS) throw error;
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

// ---------------------------------------------------------------------------
// Construction de la fiche a partir des tables
// ---------------------------------------------------------------------------

function buildFiche(raw, clubId) {
  const club = (raw.Structures || []).find(item => item.id === clubId);
  if (!club) return null;

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
        date: dateSeconds(action.Date),
        periode: text(action.Periode_approx),
        statut: text(action.Statut),
        dispositif: text(dispositif.Dispositif || dispositif.Code),
        budget,
        financed: montant,
        rate: coverage(montant, budget),
      };
    }));

  return {
    club: {
      id: club.id,
      nom: text(club.Nom),
      siret: text(club.SIRET),
      adresse: text(club.Adresse),
      codePostal: text(club.Code_postal),
      codeInsee: text(club.Code_Insee).toUpperCase(),
      logoIds: attachmentIds(club.Logo),
    },
    contacts,
    actions,
  };
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

// Une colonne Pieces jointes arrive encodee ['L', 12, 13] par fetchTable, en
// simple tableau par d'autres chemins, ou vide.
function attachmentIds(value) {
  if (Array.isArray(value)) return value.filter(item => Number.isInteger(item) && item > 0);
  if (Number.isInteger(value) && value > 0) return [value];
  if (typeof value === 'string') return value.split(',').map(Number).filter(item => Number.isInteger(item) && item > 0);
  return [];
}

function text(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

// ---------------------------------------------------------------------------
// Mise en forme
// ---------------------------------------------------------------------------

function formatDate(seconds) {
  // Grist range une date seule a minuit UTC : l'afficher dans le fuseau du
  // navigateur la ferait reculer d'un jour a l'ouest de Greenwich.
  return new Date(seconds * 1000).toLocaleDateString('fr-FR', {timeZone: 'UTC'});
}

function formatSiret(value) {
  const digits = value.replace(/\s/g, '');
  return /^\d{14}$/.test(digits) ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, '$1 $2 $3 $4') : value;
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

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------

function renderMessage(message) {
  document.getElementById('fiche').innerHTML = `<p class="fiche-message">${escapeHtml(message)}</p>`;
}

function renderCurrent() {
  if (state.tableId && state.tableId !== TABLE_CLUBS) return;
  const fiche = buildFiche(state.raw, state.clubId);
  if (!fiche) {
    renderMessage(`Ce club est introuvable dans la table ${TABLE_CLUBS}.`);
    return;
  }
  document.getElementById('fiche').innerHTML = renderFiche(fiche, {
    logoUrl: logoUrl(fiche.club.logoIds, state.readAccess),
    unreadable: state.unreadable,
    upload: state.upload,
  });
  bindLogo(fiche.club);
  fillCommune(fiche.club);
  fillZonages(fiche.club);
}

function renderFiche(fiche, options = {}) {
  const {club} = fiche;
  const unreadable = options.unreadable || [];
  return `
    <article class="club-card" aria-labelledby="clubName">
      <header class="club-header">
        ${renderLogo(club, options.logoUrl, options.upload || {})}
        <div class="club-identity">
          <h1 id="clubName">${escapeHtml(club.nom || 'Club sans nom')}</h1>
          <p class="club-line">SIRET : ${club.siret ? escapeHtml(formatSiret(club.siret)) : '<span class="muted-text">non renseigné</span>'}</p>
          <p class="club-line" id="clubAddress">${renderAddress(club, '')}</p>
          <dl class="zonages">
            <div class="zonage"><dt>QPV</dt><dd id="qpvResult">${club.codeInsee ? 'Vérification en cours…' : renderQpv({etat: 'sans-code'})}</dd></div>
            <div class="zonage"><dt>FRR</dt><dd id="frrResult">${club.codeInsee ? 'Vérification en cours…' : renderFrr({etat: 'sans-code'})}</dd></div>
          </dl>
          <p class="zonage-note">Le zonage France Ruralités Revitalisation (FRR) remplace les zones de revitalisation rurale (ZRR) depuis le 1<sup>er</sup> juillet 2024.</p>
        </div>
      </header>
      <div class="club-lists">
        <section class="club-section" aria-labelledby="contactsTitle">
          <h2 id="contactsTitle">Contacts</h2>
          ${unreadable.includes('Contacts')
            ? '<p class="empty-note">Vos droits ne permettent pas de lire les contacts.</p>'
            : renderContacts(fiche.contacts)}
        </section>
        <section class="club-section" aria-labelledby="actionsTitle">
          <h2 id="actionsTitle">Actions</h2>
          ${unreadable.includes('Actions')
            ? '<p class="empty-note">Vos droits ne permettent pas de lire les actions.</p>'
            : renderActions(fiche.actions)}
        </section>
      </div>
    </article>`;
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
function renderActions(actions) {
  if (!actions.length) return '<p class="empty-note">Aucune action portée par ce club.</p>';
  return `<ul class="action-list">${actions.map(action => `<li class="action-item">
      <span class="action-date">${action.date !== null ? escapeHtml(formatDate(action.date)) : escapeHtml(action.periode) || '<span class="muted-text">Date à définir</span>'}</span>
      <span class="action-status">${action.statut ? `<span class="status-tag ${statusClass(action.statut)}">${escapeHtml(action.statut)}</span>` : missing('Statut non renseigné', '')}</span>
      <span class="action-dispositif">${action.dispositif ? escapeHtml(action.dispositif) : '<span class="muted-text">Dispositif non renseigné</span>'}</span>
      ${renderFunding(action)}
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
// Commune et zonages, interroges en ligne
// ---------------------------------------------------------------------------

function isCurrent(club) {
  return state.clubId === club.id;
}

function writeInto(id, html) {
  const element = document.getElementById(id);
  if (element) element.innerHTML = html;
}

async function fillCommune(club) {
  if (!club.codeInsee) return;
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
    renderCurrent();
    return;
  }
  state.upload = {busy: true, message: '', kind: ''};
  renderCurrent();
  try {
    await uploadLogo(club.id, file);
    if (!isCurrent(club)) return;
    state.upload = {busy: false, message: 'Logo enregistré.', kind: 'success'};
    await refreshData();
  } catch (error) {
    // La cause d'origine (avant l'etiquetage par etape dans uploadLogo) est celle
    // qui aide a diagnostiquer : la console developpeur la garde meme quand le
    // message affiche a l'utilisateur reste generique.
    console.error(error, error && error.cause);
    if (!isCurrent(club)) return;
    state.upload = {busy: false, message: uploadErrorMessage(error), kind: 'error'};
    renderCurrent();
  }
}

function logoFileProblem(file) {
  if (!LOGO_TYPES.includes(file.type)) return 'Format non pris en charge : choisissez une image PNG, JPEG, WebP, GIF ou SVG.';
  if (file.size > LOGO_MAX_OCTETS) return 'Image trop lourde : 5 Mo au maximum.';
  return '';
}

// Meme requete que l'envoi (meme URL, meme jeton, memes en-tetes CORS cote
// Grist), mais une lecture GET sans corps : si elle passe alors que l'envoi
// echoue, la cause tient a l'envoi lui-meme (methode, corps multipart, une
// passerelle qui filtre l'un et pas l'autre), pas a Grist injoignable en
// general. Ne remonte jamais d'erreur : un doute sur la sonde elle-meme ne
// doit pas empecher d'afficher le message principal.
async function probeAttachmentsReadable(access) {
  try {
    const reponse = await fetch(`${access.baseUrl}/attachments?auth=${encodeURIComponent(access.token)}`, {credentials: 'omit'});
    return reponse.ok;
  } catch (error) {
    return false;
  }
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
    // fetch echoue avant toute reponse : impossible de savoir, depuis ce seul
    // echec, si Grist est injoignable ou si seul l'envoi (methode POST, corps
    // multipart) est en cause — une passerelle intermediaire peut filtrer l'un
    // sans l'autre. Une lecture, sans corps ni methode inhabituelle, tranche.
    const lectureAussi = await probeAttachmentsReadable(access);
    throw Object.assign(
      new Error(lectureAussi
        ? "Connexion à Grist impossible pour l'envoi du fichier ; une simple lecture, elle, fonctionne."
        : "Connexion à Grist impossible, y compris pour une simple lecture : le problème n'est pas propre à l'envoi."),
      {step: 'network', cause: error},
    );
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
    // Le message porte deja le diagnostic (l'envoi seul echoue, ou meme la
    // lecture) : fetch ne dit rien de plus precis en JavaScript. La console du
    // navigateur, elle, affiche la vraie raison (refus CORS, connexion
    // refusee...), invisible autrement.
    //
    // Piste la plus probable, confirmee par la communaute Grist (forum
    // community.getgrist.com, sujet « Upload attachment from custom widget ») :
    // un bug connu et toujours ouvert de Grist (gristlabs/grist-core#1614,
    // recoupe par #1512 et #1853) fait traiter comme anonyme le jeton d'un
    // widget des qu'une regle d'acces existe sur la table visee — l'envoi
    // echoue alors pour tout role sauf Proprietaire du document. Coherent avec
    // les regles d'acces de Structures, qui ne donnent que la lecture aux
    // profils autres que proprietaire (voir le README).
    return `${error.message} Cause probable : un bug connu de Grist, non corrigé à ce jour, bloque l'envoi de pièce jointe depuis un widget dès que des règles d'accès existent sur la table — l'envoi ne marche alors que pour un compte propriétaire du document. Réessayez connectée comme propriétaire pour confirmer. Sinon, la console du navigateur (F12, onglet Console) affiche la cause exacte.`;
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
