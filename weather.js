(function (root) {
  'use strict';
  const model = root.OLAF_WEATHER_MODEL;
  if (!model || !root.document) return;
  const REFRESH_MS = 12 * 60 * 1000;
  const CACHE_MS = 6 * 60 * 60 * 1000;
  const REQUEST_MS = 10000;
  const cache = new Map();
  let active = null, generation = 0, controller = null, interval = null;
  const icons = {
    sun: '<circle cx="24" cy="24" r="8"/><path d="M24 3v5m0 32v5M3 24h5m32 0h5M9 9l4 4m22 22 4 4M9 39l4-4m22-22 4-4"/>',
    moon: '<path d="M35 32A17 17 0 0 1 16 8a17 17 0 1 0 19 24Z"/>',
    cloud: '<path d="M13 35h23a8 8 0 0 0 0-16 12 12 0 0 0-23-3 10 10 0 0 0 0 19Z"/>',
    rain: '<path d="M12 29h25a7 7 0 0 0-1-14 11 11 0 0 0-21-2 9 9 0 0 0-3 16Zm4 5-3 7m12-7-3 7m12-7-3 7"/>',
    snow: '<path d="M12 28h25a7 7 0 0 0-1-14 11 11 0 0 0-21-2 9 9 0 0 0-3 16ZM17 34v8m-4-4h8m-7-3 6 6m-6 0 6-6m12-1v8m-4-4h8m-7-3 6 6m-6 0 6-6"/>',
    fog: '<path d="M11 25h26a7 7 0 0 0-1-14 11 11 0 0 0-20 0 8 8 0 0 0-5 14ZM7 33h29M12 39h29"/>',
    thunder: '<path d="M12 27h25a7 7 0 0 0-1-14 11 11 0 0 0-21-2 9 9 0 0 0-3 16Zm13 2-6 9h7l-3 8 11-13h-8l4-4"/>'
  };

  function el(tag, className, text) {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function build(container) {
    const heading = el('p', 'weather-heading', 'El temps ara');
    const reading = el('div', 'weather-reading');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'weather-icon'); icon.setAttribute('viewBox', '0 0 48 48'); icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('width', '48'); icon.setAttribute('height', '48');
    icon.setAttribute('fill', 'none'); icon.setAttribute('stroke', 'currentColor'); icon.setAttribute('stroke-width', '1.6');
    icon.setAttribute('stroke-linecap', 'round'); icon.setAttribute('stroke-linejoin', 'round');
    const temperature = el('strong', 'weather-temperature');
    const description = el('span', 'weather-condition');
    reading.append(icon, temperature, description);
    const updated = el('time', 'weather-updated');
    const status = el('p', 'weather-status'); status.setAttribute('role', 'status');
    const retry = el('button', 'weather-retry', 'Torna-ho a provar'); retry.type = 'button'; retry.hidden = true;
    retry.addEventListener('click', () => refresh());
    // Provider attribution lives in the shared footer, outside the station summary.
    const meta = el('div', 'weather-meta'); meta.append(updated);
    container.classList.add('station-weather');
    container.setAttribute('aria-label', 'Temps actual a la ubicació seleccionada');
    container.replaceChildren(heading, reading, meta, status, retry);
    return { heading, reading, icon, temperature, description, updated, status, retry };
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
    const nodes = state.nodes, now = Date.now();
    const age = model.freshness(snapshot, now);
    if (!snapshot || age === 'expired') {
      nodes.heading.textContent = 'El temps ara'; nodes.reading.hidden = true; nodes.updated.hidden = true;
      nodes.status.textContent = options.loading ? 'Consultant el temps…' : 'El temps no està disponible ara.';
      nodes.status.hidden = false;
      nodes.retry.hidden = !!options.loading;
      nodes.retry.disabled = !!options.loading;
      state.container.dataset.weatherState = options.loading ? 'loading' : 'unavailable';
      return;
    }
    const stale = options.cached || age !== 'fresh';
    nodes.heading.textContent = stale ? 'Última previsió disponible' : 'El temps ara';
    nodes.reading.hidden = false; nodes.updated.hidden = false;
    nodes.temperature.textContent = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 0 }).format(snapshot.temperatureC) + '°C';
    nodes.description.textContent = snapshot.condition;
    nodes.icon.innerHTML = icons[snapshot.icon] || icons.cloud;
    nodes.updated.dateTime = new Date(snapshot.validAt).toISOString();
    nodes.updated.textContent = stale ? 'Previsió de ' + timeLabel(snapshot.validAt, state.zone, true)
      : 'Previsió de les ' + timeLabel(snapshot.validAt, state.zone);
    nodes.updated.title = 'Estimació per a la ubicació aproximada de ' + state.scene.name + ' · ' + timeLabel(snapshot.validAt, state.zone, true) +
      ' · model actualitzat ' + timeLabel(snapshot.generatedAt, state.zone, true) + ' · ' + state.zone;
    nodes.reading.title = nodes.updated.title;
    nodes.status.textContent = options.loading ? 'Actualitzant…' : stale
      ? options.cached ? 'No s’ha pogut actualitzar.' : 'Pendent d’una previsió més recent.'
      : '';
    nodes.status.hidden = !nodes.status.textContent;
    nodes.retry.hidden = !!options.loading || !options.cached;
    nodes.retry.disabled = !!options.loading;
    state.container.dataset.weatherState = options.loading ? 'loading' : stale ? 'stale' : 'fresh';
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
