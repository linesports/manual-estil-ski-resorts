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
    const walk = node => String(node.className || '').split(' ').includes(className) ? node : node.children.flatMap(child => walk(child) || []).find(Boolean);
    return walk(container);
  };
  const visibleText = () => {
    const walk = node => node.hidden || String(node.className || '').split(' ').includes('sr-only') ? '' : (node.textContent || '') + node.children.map(walk).join('');
    return walk(container);
  };
  return { api: window.OLAF_WEATHER, container, find, visibleText, show: () => window.OLAF_WEATHER.show({ stationId: 'baqueira_beret', scene: { name: 'Baqueira Beret', coordinates: [.9, 42.7] }, container }) };
}

const forecast = age => ({ age, temperatureC: 5, condition: 'Ennuvolat', icon: 'cloud', validAt: Date.parse('2026-10-28T12:00:00Z'), generatedAt: Date.parse('2026-10-28T11:30:00Z') });

test('weather shows only the temperature, while loading and estimate validity remain accessible', async () => {
  let ready;
  const h = weatherHarness([new Promise(resolve => { ready = resolve; })]);
  const request = h.show();
  assert.equal(h.visibleText(), '—°C');
  assert.match(h.find('weather-status').textContent, /Consultant/);
  assert.equal(h.find('weather-retry').hidden, true);
  ready(forecast('fresh')); await request;
  assert.equal(h.visibleText(), '5°C');
  assert.equal(h.find('weather-temperature').textContent, '5°C');
  for (const removed of ['weather-heading', 'weather-icon', 'weather-condition', 'weather-updated', 'weather-meta']) assert.equal(h.find(removed), undefined, removed);
  assert.equal(h.find('weather-source'), undefined);
  assert.equal(h.find('weather-retry').hidden, true);
  assert.match(h.find('weather-status').className, /sr-only/);
  assert.equal(h.find('weather-status').attributes.role, 'status');
  assert.match(h.find('weather-reading').title, /Baqueira Beret/);
  assert.match(h.find('weather-reading').title, /12:00/);
});

test('a failed refresh never displays a cached temperature and offers a temperature-shaped accessible retry', async () => {
  const h = weatherHarness([forecast('fresh'), new Error('offline'), forecast('fresh')]);
  await h.show();
  await h.api.refresh();
  assert.equal(h.container.dataset.weatherState, 'stale');
  assert.equal(h.visibleText(), '—°C');
  assert.equal(h.find('weather-temperature').textContent, '—°C');
  assert.match(h.find('weather-status').textContent, /No s’ha pogut actualitzar/);
  assert.equal(h.find('weather-retry').hidden, false);
  assert.match(h.find('weather-retry').attributes['aria-label'], /Torna/);
  await h.api.refresh();
  assert.equal(h.container.dataset.weatherState, 'fresh');
  assert.equal(h.find('weather-retry').hidden, true);
  assert.equal(h.visibleText(), '5°C');
});

test('unavailable and old forecasts show a placeholder, with their reason outside the visual layout', async () => {
  const unavailable = weatherHarness([new Error('offline')]);
  await unavailable.show();
  assert.equal(unavailable.container.dataset.weatherState, 'unavailable');
  assert.equal(unavailable.visibleText(), '—°C');
  assert.equal(unavailable.find('weather-reading').hidden, true);
  assert.equal(unavailable.find('weather-retry').hidden, false);
  const old = weatherHarness([forecast('stale')]);
  await old.show();
  assert.equal(old.container.dataset.weatherState, 'stale');
  assert.equal(old.visibleText(), '—°C');
  assert.match(old.find('weather-status').className, /sr-only/);
  assert.match(old.find('weather-status').textContent, /recent/);
  assert.doesNotMatch(old.find('weather-status').textContent, /No s’ha pogut actualitzar/);
  assert.equal(old.find('weather-retry').hidden, true);
});
