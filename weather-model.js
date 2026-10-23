(function (root) {
  'use strict';
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const zones = {
    baqueira_beret: 'Europe/Madrid', sierranevadaestacion: 'Europe/Madrid', masellapirineu: 'Europe/Madrid',
    cerleraramon: 'Europe/Madrid', javalambrearamon: 'Europe/Madrid', formigalpanticosaaramon: 'Europe/Madrid', grupoaramon: 'Europe/Madrid',
    grandvalira: 'Europe/Andorra', palarinsalandorra: 'Europe/Andorra', ordinoarcalis: 'Europe/Andorra',
    val_thorens: 'Europe/Paris', tignesofficiel: 'Europe/Paris', laax: 'Europe/Zurich', zermattbergbahnen: 'Europe/Zurich',
    aspensnowmass: 'America/Denver', jacksonhole: 'America/Denver', whistlerblackcomb: 'America/Vancouver',
    hanazononiseko: 'Asia/Tokyo', rusutsuresort_official: 'Asia/Tokyo', skiportillo: 'America/Santiago',
    valle_nevado: 'America/Santiago', cerrocastor: 'America/Argentina/Ushuaia'
  };
  const conditions = {
    clearsky: ['Cel serè', 'sun'], fair: ['Poc ennuvolat', 'sun'], partlycloudy: ['Intervals de núvols', 'cloud'], cloudy: ['Ennuvolat', 'cloud'],
    fog: ['Boira', 'fog'], lightrain: ['Pluja feble', 'rain'], rain: ['Pluja', 'rain'], heavyrain: ['Pluja intensa', 'rain'],
    lightrainshowers: ['Ruixats febles', 'rain'], rainshowers: ['Ruixats', 'rain'], heavyrainshowers: ['Ruixats intensos', 'rain'],
    lightsleet: ['Aiguaneu feble', 'snow'], sleet: ['Aiguaneu', 'snow'], heavysleet: ['Aiguaneu intensa', 'snow'],
    lightsleetshowers: ['Ruixats febles d’aiguaneu', 'snow'], sleetshowers: ['Ruixats d’aiguaneu', 'snow'], heavysleetshowers: ['Ruixats intensos d’aiguaneu', 'snow'],
    lightsnow: ['Neu feble', 'snow'], snow: ['Neu', 'snow'], heavysnow: ['Neu intensa', 'snow'],
    lightsnowshowers: ['Ruixats febles de neu', 'snow'], snowshowers: ['Ruixats de neu', 'snow'], heavysnowshowers: ['Ruixats intensos de neu', 'snow']
  };

  function condition(symbol = '') {
    const parts = String(symbol).split('_');
    const key = parts[0];
    if (/thunder/.test(key)) return { label: 'Tempesta', icon: 'thunder' };
    const known = conditions[key];
    if (!known) return { label: 'Estat no disponible', icon: 'cloud' };
    return { label: known[0], icon: known[1] === 'sun' && parts[1] === 'night' ? 'moon' : known[1] };
  }

  function timestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('Invalid weather timestamp');
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) throw new Error('Invalid weather timestamp');
    return parsed;
  }

  function parseForecast(payload, now = Date.now()) {
    const properties = payload?.properties;
    if (properties?.meta?.units?.air_temperature !== 'celsius') throw new Error('Unsupported weather temperature unit');
    const generatedAt = timestamp(properties.meta.updated_at);
    if (generatedAt > now + 15 * MINUTE) throw new Error('Future weather model timestamp');
    const steps = (Array.isArray(properties.timeseries) ? properties.timeseries : [])
      .map(step => ({ step, time: timestamp(step.time) }))
      .filter(entry => entry.time <= now)
      .sort((a, b) => b.time - a.time);
    if (!steps.length) throw new Error('No current weather step');
    const selected = steps[0];
    const temperatureC = selected.step.data?.instant?.details?.air_temperature;
    if (typeof temperatureC !== 'number' || !Number.isFinite(temperatureC) || temperatureC < -100 || temperatureC > 70) throw new Error('Invalid current temperature');
    const symbol = selected.step.data?.next_1_hours?.summary?.symbol_code || selected.step.data?.next_6_hours?.summary?.symbol_code || '';
    const description = condition(symbol);
    return {
      temperatureC, validAt: selected.time, generatedAt, symbol,
      condition: description.label, icon: description.icon,
      elevation: Number.isFinite(payload.geometry?.coordinates?.[2]) ? payload.geometry.coordinates[2] : null
    };
  }

  function freshness(snapshot, now = Date.now()) {
    if (!snapshot || !Number.isFinite(snapshot.validAt) || !Number.isFinite(snapshot.generatedAt)) return 'expired';
    const validAge = now - snapshot.validAt, modelAge = now - snapshot.generatedAt;
    if (validAge > 6 * HOUR || modelAge > 24 * HOUR || validAge < -5 * MINUTE || modelAge < -15 * MINUTE) return 'expired';
    return validAge > 90 * MINUTE || modelAge > 12 * HOUR ? 'stale' : 'fresh';
  }

  function forecastUrl(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.slice(0, 2).every(Number.isFinite) || Math.abs(coordinates[0]) > 180 || Math.abs(coordinates[1]) > 90) throw new Error('Invalid resort coordinates');
    const latitude = Number(coordinates[1].toFixed(4)), longitude = Number(coordinates[0].toFixed(4));
    return 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + latitude + '&lon=' + longitude;
  }

  const api = { parseForecast, freshness, forecastUrl, timezoneFor: id => zones[id] || 'UTC', condition };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OLAF_WEATHER_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
