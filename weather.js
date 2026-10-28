(function (root) {
  'use strict';
  const model = root.OLAF_WEATHER_MODEL;
  if (!model || !root.document) return;
  const REFRESH_MS = 12 * 60 * 1000;
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const REQUEST_MS = 10000;
  const cache = new Map();
  let active = null, generation = 0, controller = null, interval = null;

  function el(tag, className, text) {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function build(container) {
    const reading = el('div', 'weather-reading');
    const temperature = el('strong', 'weather-temperature', '—°C'); reading.append(temperature);
    const status = el('span', 'weather-status sr-only'); status.setAttribute('role', 'status');
    const retry = el('button', 'weather-retry', '—°C'); retry.type = 'button'; retry.hidden = true;
    retry.addEventListener('click', () => refresh());
    // Provider attribution lives in the shared footer, outside the station summary.
    container.classList.add('station-weather');
    container.setAttribute('role', 'group');
    container.replaceChildren(reading, status, retry);
    return { reading, temperature, status, retry };
  }

  function timeLabel(value, zone, withDate = false) {
    return new Intl.DateTimeFormat('ca-ES', {
      timeZone: zone, ...(withDate ? { day: 'numeric', month: 'short' } : {}), hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  function storageKey(state) { return 'olaf-weather-v1:' + state.stationId + ':' + state.coordinateKey; }
  function readCache(state) {
    let entry = cache.get(state.coordinateKey);
    if (!entry) {
      try { entry = JSON.parse(sessionStorage.getItem(storageKey(state)) || 'null'); } catch (_) { /* optional cache */ }
    }
    if (!entry || !Number.isFinite(entry.fetchedAt) || Date.now() - entry.fetchedAt > CACHE_MS || entry.fetchedAt > Date.now() + 60000) return null;
    try { return { ...entry, snapshot: model.parseForecast(entry.payload) }; } catch (_) { return null; }
  }

  function writeCache(state, payload) {
    const entry = { payload, fetchedAt: Date.now() };
    cache.set(state.coordinateKey, entry);
    try { sessionStorage.setItem(storageKey(state), JSON.stringify(entry)); } catch (_) { /* network weather still works */ }
    return entry;
  }

  function render(state, snapshot, options = {}) {
    if (state !== active) return;
    const nodes = state.nodes, age = model.freshness(snapshot, Date.now());
    const loading = !!options.loading, unavailable = !snapshot || age === 'expired';
    const fresh = !loading && !options.cached && !unavailable && age === 'fresh';
    const retry = !loading && (unavailable || !!options.cached);
    const value = fresh ? new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 0 }).format(snapshot.temperatureC) + '°C' : '—°C';
    const validity = snapshot ? 'Previsió de ' + timeLabel(snapshot.validAt, state.zone, true) +
      ' · model actualitzat ' + timeLabel(snapshot.generatedAt, state.zone, true) + ' · ' + state.zone + '.' : '';
    const location = 'Ubicació aproximada de ' + state.scene.name + '.';
    const message = fresh ? 'Temperatura estimada: ' + value + '. ' + validity + ' ' + location
      : loading ? 'Consultant la temperatura. ' + location
      : unavailable ? 'La temperatura no està disponible ara. ' + location
      : (options.cached ? 'No s’ha pogut actualitzar la temperatura. ' : 'Pendent d’una previsió més recent. ') + validity + ' ' + location;
    nodes.temperature.textContent = value;
    nodes.reading.hidden = retry; nodes.reading.title = message;
    nodes.retry.hidden = !retry; nodes.retry.disabled = loading;
    nodes.retry.title = message + ' Torna-ho a provar.';
    nodes.retry.setAttribute('aria-label', 'Torna a consultar la temperatura de ' + state.scene.name);
    nodes.status.textContent = message;
    state.container.setAttribute('aria-label', 'Temperatura a ' + state.scene.name);
    state.container.dataset.weatherState = loading ? 'loading' : fresh ? 'fresh' : unavailable ? 'unavailable' : 'stale';
  }

  async function refresh() {
    const state = active;
    if (!state || document.visibilityState === 'hidden' || !state.container.isConnected || state.container.hidden) return;
    const request = ++generation; state.loading = true;
    controller?.abort(); controller = new AbortController();
    const signal = controller.signal;
    const cached = readCache(state);
    render(state, cached?.snapshot || state.snapshot, { loading: true });
    const timeout = setTimeout(() => controller?.signal === signal && controller.abort(), REQUEST_MS);
    try {
      // Browser Origin identifies the site, as required for simple cross-origin MET requests.
      // Default HTTP caching respects the provider's Expires header; no cache-busting query.
      const response = await fetch(state.url, { signal, credentials: 'omit' });
      if (!response.ok) throw new Error('Weather HTTP ' + response.status);
      const payload = await response.json();
      const snapshot = model.parseForecast(payload);
      if (model.freshness(snapshot) === 'expired') throw new Error('Expired weather response');
      if (request !== generation || state !== active) return;
      const entry = writeCache(state, payload);
      state.lastFetch = entry.fetchedAt; state.snapshot = snapshot; state.failed = false;
      render(state, snapshot);
    } catch (_) {
      if (request !== generation || state !== active) return;
      state.failed = true;
      render(state, cached?.snapshot || state.snapshot, { cached: true });
    } finally {
      clearTimeout(timeout);
      if (request === generation) { controller = null; state.loading = false; }
    }
  }

  function show({ stationId, scene, container }) {
    if (!container || !scene) { hide(); return Promise.resolve(); }
    let url;
    try { url = model.forecastUrl(scene.coordinates); } catch (_) { hide(); return Promise.resolve(); }
    const coordinateKey = scene.coordinates.slice(0, 2).join(',');
    if (active && active.stationId === stationId && active.coordinateKey === coordinateKey && active.container === container) {
      container.hidden = false;
      if (active.loading) return Promise.resolve();
      if (Date.now() - active.lastFetch >= REFRESH_MS) return refresh();
      render(active, active.snapshot, { cached: active.failed }); return Promise.resolve();
    }
    hide();
    container.hidden = false;
    const state = { stationId, scene, container, url, coordinateKey, zone: model.timezoneFor(stationId), lastFetch: 0, snapshot: null, nodes: build(container) };
    active = state;
    const cached = readCache(state);
    if (cached) { state.snapshot = cached.snapshot; state.lastFetch = cached.fetchedAt; }
    render(state, state.snapshot, { loading: true });
    interval = setInterval(() => {
      if (active === state && document.visibilityState !== 'hidden') refresh();
    }, REFRESH_MS);
    return refresh();
  }

  function hide() {
    ++generation; controller?.abort(); controller = null;
    clearInterval(interval); interval = null;
    if (active) active.container.hidden = true;
    active = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (!active) return;
    if (document.visibilityState === 'hidden') { ++generation; controller?.abort(); controller = null; }
    else refresh();
  });
  root.OLAF_WEATHER = { show, hide, refresh };
})(typeof window !== 'undefined' ? window : globalThis);
