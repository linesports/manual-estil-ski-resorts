const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function weatherHarness(responses) {
  class Node {
    constructor(tag) { this.tagName = tag; this.children = []; this.hidden = false; this.dataset = {}; this.isConnected = true; this.attributes = {}; this.classList = { add() {} }; }
    setAttribute(key, value) { this.attributes[key] = value; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    addEventListener(type, listener) { this[type] = listener; }
  }
  const document = { visibilityState: 'visible', createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag), addEventListener() {} };
  const model = { forecastUrl: coordinates => coordinates.join(','), timezoneFor: () => 'UTC', parseForecast: payload => payload, freshness: snapshot => snapshot?.age || 'expired' };
  const storage = new Map();
  const window = { document, OLAF_WEATHER_MODEL: model };
  const context = { window, document, Date, Intl, AbortController, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {}, sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, fetch: async () => { const next = responses.shift(); if (next instanceof Error) throw next; return { ok: true, json: async () => next }; } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../weather.js'), 'utf8'), context);
  const container = new Node('section');
  const find = className => {
    const walk = node => node.className === className ? node : node.children.flatMap(child => walk(child) || []).find(Boolean);
    return walk(container);
  };
  return { api: window.OLAF_WEATHER, container, find, show: () => window.OLAF_WEATHER.show({ stationId: 'baqueira_beret', scene: { name: 'Baqueira Beret', coordinates: [.9, 42.7] }, container }) };
}

const forecast = age => ({ age, temperatureC: 5, condition: 'Ennuvolat', icon: 'cloud', validAt: Date.parse('2026-10-28T12:00:00Z'), generatedAt: Date.parse('2026-10-28T11:30:00Z') });

test('fresh weather exposes the estimate and its validity without a provider link or routine refresh action', async () => {
  const h = weatherHarness([forecast('fresh')]);
  await h.show();
  assert.equal(h.find('weather-temperature').textContent, '5°C');
  assert.equal(h.find('weather-condition').textContent, 'Ennuvolat');
  assert.equal(h.find('weather-source'), undefined);
  assert.equal(h.find('weather-retry').hidden, true);
  assert.equal(h.find('weather-status').hidden, true);
  assert.match(h.find('weather-reading').title, /Baqueira Beret/);
  assert.equal(h.find('weather-updated').dateTime, '2026-10-28T12:00:00.000Z');
});

test('a failed refresh labels a cached estimate honestly and offers recovery, then hides the retry after success', async () => {
  const h = weatherHarness([forecast('fresh'), new Error('offline'), forecast('fresh')]);
  await h.show();
  await h.api.refresh();
  assert.equal(h.container.dataset.weatherState, 'stale');
  assert.equal(h.find('weather-heading').textContent, 'Última previsió disponible');
  assert.match(h.find('weather-status').textContent, /No s’ha pogut actualitzar/);
  assert.equal(h.find('weather-status').hidden, false);
  assert.equal(h.find('weather-retry').hidden, false);
  await h.api.refresh();
  assert.equal(h.container.dataset.weatherState, 'fresh');
  assert.equal(h.find('weather-retry').hidden, true);
  assert.equal(h.find('weather-status').hidden, true);
});

test('an unavailable estimate has no temperature and retains a retry, while an old successful estimate is not described as a failed request', async () => {
  const unavailable = weatherHarness([new Error('offline')]);
  await unavailable.show();
  assert.equal(unavailable.container.dataset.weatherState, 'unavailable');
  assert.equal(unavailable.find('weather-reading').hidden, true);
  assert.equal(unavailable.find('weather-retry').hidden, false);
  const old = weatherHarness([forecast('stale')]);
  await old.show();
  assert.equal(old.container.dataset.weatherState, 'stale');
  assert.equal(old.find('weather-status').hidden, false);
  assert.doesNotMatch(old.find('weather-status').textContent, /No s’ha pogut actualitzar/);
  assert.equal(old.find('weather-retry').hidden, true);
});
