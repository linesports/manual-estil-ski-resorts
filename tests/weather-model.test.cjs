const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseForecast, freshness, forecastUrl, timezoneFor, condition } = require('../weather-model.js');
const NOW = Date.parse('2026-10-23T14:20:00Z');
function payload() {
  return {
    geometry: { coordinates: [.944, 42.699, 1816] },
    properties: {
      meta: { updated_at: '2026-10-23T13:18:17Z', units: { air_temperature: 'celsius' } },
      timeseries: [
        { time: '2026-10-23T13:00:00Z', data: { instant: { details: { air_temperature: 5.8 } }, next_1_hours: { summary: { symbol_code: 'partlycloudy_day' } } } },
        { time: '2026-10-23T14:00:00Z', data: { instant: { details: { air_temperature: 5 } }, next_1_hours: { summary: { symbol_code: 'cloudy' } } } },
        { time: '2026-10-23T15:00:00Z', data: { instant: { details: { air_temperature: 4.4 } }, next_1_hours: { summary: { symbol_code: 'lightrain' } } } }
      ]
    }
  };
}

test('current estimate selects the latest valid hour, never a later forecast as the current reading', () => {
  const result = parseForecast(payload(), NOW);
  assert.equal(result.temperatureC, 5);
  assert.equal(result.validAt, Date.parse('2026-10-23T14:00:00Z'));
  assert.equal(result.generatedAt, Date.parse('2026-10-23T13:18:17Z'));
  assert.equal(result.condition, 'Ennuvolat');
});

test('a missing temperature is unavailable rather than a false zero degrees', () => {
  const source = payload();
  source.properties.timeseries.forEach(step => { step.data.instant.details.air_temperature = null; });
  assert.throws(() => parseForecast(source, NOW), /temperature/i);
});

test('invalid source timestamps and wrong temperature units cannot become current weather', () => {
  const source = payload(); source.properties.meta.updated_at = 'not-a-date';
  assert.throws(() => parseForecast(source, NOW), /timestamp/i);
  const other = payload(); other.properties.meta.units.air_temperature = 'fahrenheit';
  assert.throws(() => parseForecast(other, NOW), /unit/i);
});

test('old valid readings and old model runs are explicitly stale, then expire', () => {
  const snapshot = parseForecast(payload(), NOW);
  assert.equal(freshness(snapshot, NOW), 'fresh');
  assert.equal(freshness(snapshot, NOW + 2 * 60 * 60 * 1000), 'stale');
  assert.equal(freshness(snapshot, NOW + 24 * 60 * 60 * 1000), 'expired');
});

test('a response containing only future hours cannot be labelled current', () => {
  const source = payload(); source.properties.timeseries = source.properties.timeseries.slice(-1);
  assert.throws(() => parseForecast(source, NOW), /current/i);
});

test('coordinates keep longitude and latitude in the correct order for both hemispheres', () => {
  assert.equal(forecastUrl([.944, 42.699]), 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=42.699&lon=0.944');
  assert.match(forecastUrl([-70.249, -33.354]), /lat=-33.354&lon=-70.249$/);
  assert.throws(() => forecastUrl([0, 100]), /coordinates/i);
});

test('resort timestamps use the resort zone rather than the visitor computer zone', () => {
  assert.equal(timezoneFor('baqueira_beret'), 'Europe/Madrid');
  assert.equal(timezoneFor('jacksonhole'), 'America/Denver');
  assert.equal(timezoneFor('hanazononiseko'), 'Asia/Tokyo');
  assert.equal(timezoneFor('cerrocastor'), 'America/Argentina/Ushuaia');
});

test('unknown weather symbols remain unknown rather than becoming sunshine', () => {
  assert.equal(condition('future_unknown_symbol').label, 'Estat no disponible');
  assert.equal(condition('clearsky_night').icon, 'moon');
  assert.equal(condition('snowshowers_day').label, 'Ruixats de neu');
});

test('every published resort has an explicit local zone and a valid coordinate request', () => {
  const fs = require('node:fs'), vm = require('node:vm'), context = { window: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../scene-data.js'), 'utf8'), context);
  for (const [id, scene] of Object.entries(context.window.OLAF_SCENES.stations)) {
    assert.notEqual(timezoneFor(id), 'UTC', id);
    assert.equal(new URL(forecastUrl(Array.from(scene.coordinates))).searchParams.get('lat'), String(Number(scene.coordinates[1].toFixed(4))), id);
  }
});
