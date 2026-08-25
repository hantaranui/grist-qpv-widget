(function () {
  "use strict";

  const BAN_URL = "https://api-adresse.data.gouv.fr/search/";
  const DATASET_URL = "https://www.data.gouv.fr/api/1/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/";
  const CACHE_KEY = "qpv-geojson-cache-v1";
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  const COLUMN_SCHEMA = [
    { name: "adresse", title: "Adresse", type: "Text" },
    { name: "codePostal", title: "Code postal", type: "Text", optional: true },
    { name: "commune", title: "Commune", type: "Text", optional: true },
    { name: "estQpv", title: "Est en QPV", type: "Bool", optional: true },
    { name: "codeQpv", title: "Code QPV", type: "Text", optional: true },
    { name: "nomQpv", title: "Nom QPV", type: "Text", optional: true },
    { name: "adresseBan", title: "Adresse BAN retenue", type: "Text", optional: true },
    { name: "scoreBan", title: "Score BAN", type: "Numeric", optional: true },
    { name: "longitude", title: "Longitude", type: "Numeric", optional: true },
    { name: "latitude", title: "Latitude", type: "Numeric", optional: true },
    { name: "statut", title: "Statut vérification QPV", type: "Text", optional: true }
  ];

  const state = {
    tableId: null,
    records: [],
    current: null,
    mappedColumns: {},
    qpvFeatures: null,
    qpvMetadata: null,
    lastResult: null
  };

  const el = {
    setupPanel: document.getElementById("setupPanel"),
    resultPanel: document.getElementById("resultPanel"),
    message: document.getElementById("message"),
    addressText: document.getElementById("addressText"),
    badge: document.getElementById("badge"),
    qpName: document.getElementById("qpName"),
    qpCode: document.getElementById("qpCode"),
    banLabel: document.getElementById("banLabel"),
    banScore: document.getElementById("banScore"),
    checkCurrent: document.getElementById("checkCurrent"),
    writeCurrent: document.getElementById("writeCurrent"),
    checkAll: document.getElementById("checkAll"),
    refreshData: document.getElementById("refreshData")
  };

  grist.ready({
    requiredAccess: "full",
    columns: COLUMN_SCHEMA
  });

  resolveTableId();

  grist.onRecords((records, mappings) => {
    state.mappedColumns = mappings || {};
    state.records = mapRecords(records || []);
    toggleSetup(!hasAddressMapping());
  });

  grist.onRecord(async (record, mappings) => {
    state.mappedColumns = mappings || state.mappedColumns || {};
    state.current = mapRecord(record);
    toggleSetup(!hasAddressMapping());

    if (!state.current || !hasAddressMapping()) {
      showMessage("Sélectionnez une ligne et associez une colonne d'adresse.");
      clearResult();
      return;
    }

    el.addressText.textContent = buildAddress(state.current);
    clearResult();
    await runCurrentCheck(false);
  });

  el.checkCurrent.addEventListener("click", () => runCurrentCheck(false));
  el.writeCurrent.addEventListener("click", () => runCurrentCheck(true));
  el.checkAll.addEventListener("click", runBatchCheck);
  el.refreshData.addEventListener("click", () => loadQpvData({ force: true }));

  async function runCurrentCheck(writeBack) {
    if (!state.current) {
      showMessage("Aucune ligne sélectionnée.");
      return;
    }

    try {
      setBusy(true, "Vérification de l'adresse...");
      const result = await checkRecord(state.current);
      state.lastResult = result;
      renderResult(result);

      if (writeBack) {
        await writeResult(state.current.id, result);
        showMessage("Résultat écrit dans Grist.");
      } else {
        showMessage(result.status);
      }
    } catch (error) {
      renderError(error);
    } finally {
      setBusy(false);
    }
  }

  async function runBatchCheck() {
    if (!state.records.length) {
      showMessage("Aucune ligne à traiter.");
      return;
    }

    try {
      setBusy(true, "Vérification de toutes les lignes...");
      await loadQpvData();
      const actions = [];
      let done = 0;

      for (const record of state.records) {
        const result = await checkRecord(record);
        const action = await buildGristUpdateAction(record.id, result);
        if (action) {
          actions.push(action);
        }
        done += 1;
        if (done % 10 === 0) {
          showMessage(`${done}/${state.records.length} lignes vérifiées...`);
        }
      }

      if (actions.length) {
        await grist.docApi.applyUserActions(actions);
      }

      showMessage(`${done} lignes vérifiées.`);
    } catch (error) {
      renderError(error);
    } finally {
      setBusy(false);
    }
  }

  async function checkRecord(record) {
    const address = buildAddress(record);
    if (!address) {
      return resultFor(record, null, null, "Adresse vide.");
    }

    if (!hasUsableStreetAddress(record)) {
      return resultFor(record, null, null, "Adresse de rue absente : la colonne mappée ne contient pas une adresse exploitable.");
    }

    await loadQpvData();
    const geocoded = await geocode(address);
    if (!geocoded) {
      return resultFor(record, null, null, "Adresse non trouvée par la BAN.");
    }

    const point = geocoded.geometry.coordinates;
    const feature = findContainingQpv(point, state.qpvFeatures);
    const status = feature ? "Adresse située dans un QPV." : "Adresse hors QPV.";
    return resultFor(record, geocoded, feature, status);
  }

  function resultFor(record, geocoded, feature, status) {
    const props = feature ? feature.properties || {} : {};
    return {
      rowId: record.id,
      inputAddress: buildAddress(record),
      inQpv: Boolean(feature),
      codeQpv: props.code_qp || props.CODE_QP || props.codeQP || "",
      nomQpv: props.lib_qp || props.LIB_QP || props.nom_qp || props.NOM_QP || "",
      banLabel: geocoded ? geocoded.properties.label : "",
      banScore: geocoded ? geocoded.properties.score : null,
      longitude: geocoded ? geocoded.geometry.coordinates[0] : null,
      latitude: geocoded ? geocoded.geometry.coordinates[1] : null,
      status
    };
  }

  async function loadQpvData(options = {}) {
    if (state.qpvFeatures && !options.force) {
      return;
    }

    showMessage("Chargement des contours QPV officiels...");
    const cached = readCache();
    if (cached && !options.force) {
      state.qpvFeatures = cached.features;
      state.qpvMetadata = cached.metadata;
      showMessage(`Contours QPV chargés depuis le cache (${cached.features.length} zones).`);
      return;
    }

    const metadata = await fetchJson(DATASET_URL);
    const resource = selectGeojsonResource(metadata.resources || []);
    if (!resource) {
      throw new Error("Aucune ressource GeoJSON QPV trouvée sur data.gouv.fr.");
    }

    const geojson = await fetchGeojsonZip(resource.latest || resource.url);
    const features = Array.isArray(geojson.features) ? geojson.features : [];
    if (!features.length) {
      throw new Error("Le fichier QPV chargé ne contient aucune zone.");
    }

    state.qpvFeatures = features;
    state.qpvMetadata = {
      datasetLastUpdate: metadata.last_update,
      resourceTitle: resource.title,
      resourceUrl: resource.latest || resource.url
    };
    writeCache(state.qpvFeatures, state.qpvMetadata);
    showMessage(`Contours QPV chargés (${features.length} zones).`);
  }

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

  async function fetchGeojsonZip(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Téléchargement QPV impossible (${response.status}).`);
    }

    const archive = await JSZip.loadAsync(await response.arrayBuffer());
    const files = Object.values(archive.files).filter((entry) => {
      return !entry.dir && entry.name.toLowerCase().endsWith(".geojson");
    });
    const file = chooseGeojsonFile(files);

    if (!file) {
      throw new Error("Aucun fichier GeoJSON trouvé dans l'archive QPV.");
    }

    return JSON.parse(await file.async("string"));
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

  async function geocode(address) {
    const url = new URL(BAN_URL);
    url.searchParams.set("q", address);
    url.searchParams.set("limit", "1");
    url.searchParams.set("autocomplete", "0");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Géocodage BAN impossible (${response.status}).`);
    }

    const data = await response.json();
    return data.features && data.features[0] ? data.features[0] : null;
  }

  function findContainingQpv(point, features) {
    return features.find((feature) => geometryContainsPoint(feature.geometry, point));
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

  async function writeResult(rowId, result) {
    const action = await buildGristUpdateAction(rowId, result);
    if (!action) {
      showMessage("Aucune colonne de sortie n'est associée.");
      return;
    }

    await grist.docApi.applyUserActions([action]);
  }

  async function buildGristUpdateAction(rowId, result) {
    const valuesByWidgetColumn = {
      estQpv: result.inQpv,
      codeQpv: result.codeQpv,
      nomQpv: result.nomQpv,
      adresseBan: result.banLabel,
      scoreBan: result.banScore,
      longitude: result.longitude,
      latitude: result.latitude,
      statut: result.status
    };

    const fields = Object.entries(valuesByWidgetColumn).reduce((record, [key, value]) => {
      const mappedColumnId = state.mappedColumns[key];
      if (mappedColumnId) {
        record[mappedColumnId] = value;
      }
      return record;
    }, {});

    if (!Object.keys(fields).length) {
      return null;
    }

    return ["UpdateRecord", await getTableId(), rowId, fields];
  }

  async function getTableId() {
    if (state.tableId) {
      return state.tableId;
    }

    if (grist.selectedTable && typeof grist.selectedTable.getTableId === "function") {
      state.tableId = await grist.selectedTable.getTableId();
      return state.tableId;
    }

    if (typeof grist.getTable === "function") {
      const table = grist.getTable();
      if (table && typeof table.getTableId === "function") {
        state.tableId = await table.getTableId();
        return state.tableId;
      }
    }

    throw new Error("Impossible de déterminer la table Grist active : écriture annulée.");
  }

  async function resolveTableId() {
    try {
      await getTableId();
    } catch (_) {
      // Préchauffage best-effort au démarrage : l'erreur réapparaîtra si besoin
      // au moment d'une écriture réelle, gérée par les appelants de getTableId().
    }
  }

  function mapRecords(records) {
    return records
      .map((record) => mapRecord(record))
      .filter(Boolean);
  }

  function mapRecord(record) {
    if (!record) {
      return null;
    }

    if (!hasAddressMapping()) {
      return record;
    }

    const mapped = grist.mapColumnNames(record, {
      columns: COLUMN_SCHEMA,
      mappings: state.mappedColumns
    });

    if (!mapped) {
      return null;
    }

    return Object.assign({}, mapped, { id: record.id });
  }

  function hasAddressMapping() {
    return Boolean((state.mappedColumns || {}).adresse);
  }

  function buildAddress(record) {
    const parts = ["adresse", "codePostal", "commune"]
      .map((key) => valueFor(record, key))
      .filter(Boolean);
    return parts.join(" ").trim();
  }

  function hasUsableStreetAddress(record) {
    const street = valueFor(record, "adresse").toLowerCase();
    return street &&
      street !== "oui" &&
      street !== "non" &&
      /\d|rue|avenue|av\.|boulevard|bd|chemin|route|place|allee|allée|impasse|quai|cours|square/.test(street);
  }

  function valueFor(record, mappedName) {
    if (!record) {
      return "";
    }
    return String(record[mappedName] || "").trim();
  }

  function toggleSetup(showSetup) {
    el.setupPanel.hidden = !showSetup;
    el.resultPanel.hidden = showSetup;
  }

  function renderResult(result) {
    el.addressText.textContent = result.inputAddress || "-";
    el.badge.textContent = result.inQpv ? "En QPV" : "Hors QPV";
    el.badge.className = `badge ${result.inQpv ? "ok" : "no"}`;
    el.qpName.textContent = result.nomQpv || "-";
    el.qpCode.textContent = result.codeQpv || "-";
    el.banLabel.textContent = result.banLabel || "-";
    el.banScore.textContent = result.banScore == null ? "-" : result.banScore.toFixed(3);
  }

  function clearResult() {
    el.badge.textContent = "En attente";
    el.badge.className = "badge";
    el.qpName.textContent = "-";
    el.qpCode.textContent = "-";
    el.banLabel.textContent = "-";
    el.banScore.textContent = "-";
  }

  function renderError(error) {
    clearResult();
    el.badge.textContent = "Erreur";
    el.badge.className = "badge no";
    showMessage(error.message || String(error));
  }

  function showMessage(message) {
    el.message.textContent = message;
  }

  function setBusy(isBusy, message) {
    [el.checkCurrent, el.writeCurrent, el.checkAll, el.refreshData].forEach((button) => {
      button.disabled = isBusy;
    });
    if (message) {
      showMessage(message);
    }
  }

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) {
        return null;
      }
      return cached;
    } catch (_) {
      return null;
    }
  }

  function writeCache(features, metadata) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        features,
        metadata
      }));
    } catch (_) {
      // Le widget reste utilisable même si le cache navigateur est plein ou indisponible.
    }
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Source indisponible (${response.status}).`);
    }
    return response.json();
  }
})();


