(function (root) {
  'use strict';
  const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = {
    heliocare: 'Heliocare · Cantabria Labs', cantabrialabs: 'Heliocare · Cantabria Labs',
    monster: 'Monster Energy', monsterenergy: 'Monster Energy',
    reale: 'Reale Seguros', realeseguros: 'Reale Seguros',
    cervezaroyalguard: 'Royal Guard', royalguard: 'Royal Guard',
    sylranchwinery: 'See Ya Later Ranch', seeyalaterranch: 'See Ya Later Ranch'
  };
  const nameFor = name => aliases[normalize(name)] || name;
  const keyFor = name => normalize(nameFor(name));
  const codeFor = piece => (String(piece.sourceUrl || '').match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i) || [])[1];
  const inWindow = piece => piece.date >= '2025-09-29' && piece.date <= '2026-09-28';

  function uniquePublications(pieces) {
    const unique = new Map();
    pieces.forEach(piece => {
      const key = piece.kind === 'story' ? piece.id : codeFor(piece) || piece.id;
      if (!unique.has(key)) unique.set(key, piece);
    });
    return [...unique.values()];
  }

  function withResortAssociations(pieces) {
    const unique = new Map();
    pieces.forEach(piece => {
      const key = piece.kind === 'story' ? piece.id : codeFor(piece) || piece.id;
      if (!unique.has(key)) unique.set(key, { ...piece, relatedStations: [] });
      const stations = unique.get(key).relatedStations;
      [...(piece.relatedStations || []), piece.sourceStation || piece.station].filter(Boolean).forEach(id => {
        if (!stations.includes(id)) stations.push(id);
      });
    });
    return [...unique.values()];
  }

  function createDirectory({ stationPieces, brandPosts, accounts, catalog }) {
    const brands = new Map();
    function entry(name) {
      const id = keyFor(name);
      if (!id || id === 'altrescollaboradors') return null;
      if (!brands.has(id)) brands.set(id, { id, name: nameFor(name), aliases: [], stationIds: [], accounts: [], items: [] });
      const found = brands.get(id);
      if (!found.aliases.includes(name)) found.aliases.push(name);
      return found;
    }
    function addStation(brand, station) {
      if (brand && station && !brand.stationIds.includes(station)) brand.stationIds.push(station);
    }
    stationPieces.forEach(piece => (piece.brands || []).forEach(name => addStation(entry(name), piece.station)));
    accounts.forEach(account => (account.brands || []).forEach(name => {
      const brand = entry(name);
      if (brand && !brand.accounts.some(a => a.username === account.username)) brand.accounts.push(account);
    }));
    brandPosts.filter(inWindow).forEach(record => {
      // A credited partner in a caption is not necessarily the publishing brand.
      const names = record.brand ? [record.brand] : accounts.find(a => a.username === record.account)?.brands || [];
      names.forEach(name => {
        const brand = entry(name);
        if (!brand) return;
        addStation(brand, record.station);
        const canonical = catalog?.find(record.id) || record;
        if (!brand.items.some(piece => piece.id === canonical.id)) brand.items.push(canonical);
      });
    });
    const list = [...brands.values()].sort((a, b) => a.name.localeCompare(b.name, 'ca'));
    list.forEach(brand => {
      brand.items.sort((a, b) => b.date.localeCompare(a.date));
      brand.publicationCount = uniquePublications(brand.items).length;
      brand.accounts.sort((a, b) => a.username.localeCompare(b.username));
      brand.coverage = brand.accounts.length && brand.accounts.every(a => a.coverage?.status === 'annual_boundary')
        ? 'annual_boundary' : brand.accounts.some(a => ['annual_boundary', 'partial_limit', 'public_exhausted'].includes(a.coverage?.status))
          ? 'partial' : 'unavailable';
    });
    return { brands: list, find: id => brands.get(id) || list.find(b => keyFor(b.name) === keyFor(id)) };
  }
  const api = { normalize, nameFor, keyFor, codeFor, inWindow, uniquePublications, withResortAssociations, createDirectory };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OLAF_BRAND_MODEL = api;
})(typeof window !== 'undefined' ? window : globalThis);
