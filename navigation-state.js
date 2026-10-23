(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OLAF_NAVIGATION = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const modes = ['station', 'brands', 'sectors', 'saved'];
  const owned = ['view', 'station', 'brand', 'event', 'format', 'sponsor', 'source', 'sector', 'q', 'scope', 'resort', 'account', 'category', 'piece', 'media', 'page'];
  const text = (value, fallback = '*') => typeof value === 'string' && value.trim() ? value.trim().slice(0, 300) : fallback;
  function read(value, profiles = []) {
    const url = new URL(value, 'https://olaf.local/'), p = url.searchParams;
    const mode = modes.includes(p.get('view')) ? p.get('view') : 'station';
    let id = '';
    try { id = decodeURIComponent(url.hash.slice(1)); } catch (_) { /* A pasted fragment can be truncated. */ }
    const candidate = id || p.get('station') || '';
    const station = profiles.length ? profiles.includes(candidate) ? candidate : profiles[0] : candidate;
    const format = ['all', 'post', 'reel', 'story'].includes(p.get('format')) ? p.get('format') : 'all';
    return { mode, station, brand: text(p.get('brand'), ''), event: text(p.get('event')),
      format: mode === 'brands' && format === 'story' ? 'all' : format,
      sponsor: text(p.get('sponsor')), source: ['station', 'brand'].includes(p.get('source')) ? p.get('source') : 'all',
      sector: text(p.get('sector')), query: text(p.get('q'), ''), scope: p.get('scope') === 'all' ? 'all' : 'with',
      resort: text(p.get('resort')), account: text(p.get('account')), category: text(p.get('category')),
      piece: text(p.get('piece'), ''), media: Math.max(0, Math.min(100, parseInt(p.get('media'), 10) || 0)),
      page: Math.max(1, Math.min(1000, parseInt(p.get('page'), 10) || 1)) };
  }
  function write(value, state) {
    const url = new URL(value, 'https://olaf.local/'); owned.forEach(key => url.searchParams.delete(key));
    const put = (key, val, fallback) => { if (val !== undefined && val !== null && val !== '' && val !== fallback) url.searchParams.set(key, val); };
    put('view', state.mode, 'station');
    put('format', state.format, 'all');
    if (state.mode === 'station') {
      put('event', state.event, '*'); put('sponsor', state.sponsor, '*'); put('source', state.source, 'all');
      url.hash = state.station || '';
    } else { url.hash = ''; put('station', state.station); }
    if (state.mode === 'brands') {
      put('brand', state.brand); put('q', state.query); put('scope', state.scope, 'with');
      put('account', state.account, '*'); put('page', state.page, 1);
    }
    if (state.mode !== 'station') { put('sector', state.sector, '*'); put('resort', state.resort, '*'); }
    if (state.mode === 'sectors') put('sponsor', state.sponsor, '*');
    if (state.mode === 'saved') put('category', state.category, '*');
    put('piece', state.piece); if (state.piece) put('media', state.media, 0);
    return url;
  }
  return { read, write };
});
