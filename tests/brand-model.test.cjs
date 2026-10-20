const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../brand-model.js');
const events = require('../event-catalog.js');

test('Heliocare and Cantabria Labs keep one identity without losing either resort credit', () => {
  const directory = model.createDirectory({ stationPieces: [
    { station: 'sierra', brands: ['Heliocare'] }, { station: 'other', brands: ['Cantabria Labs'] }
  ], brandPosts: [], accounts: [{ username: 'cantabrialabs_esp', brands: ['Cantabria Labs'] }] });
  assert.equal(directory.brands.length, 1);
  assert.deepEqual(directory.brands[0].stationIds, ['sierra', 'other']);
  assert.equal(directory.brands[0].accounts[0].username, 'cantabrialabs_esp');
});

test('a brand account can be browsed with no recovered matches, without implying an empty annual feed', () => {
  const directory = model.createDirectory({ stationPieces: [{ station: 'sierra', brands: ['Audi'] }], brandPosts: [],
    accounts: [{ username: 'audispain', brands: ['Audi'], coverage: { status: 'partial_limit' } }] });
  assert.equal(directory.find('Audi').publicationCount, 0);
  assert.equal(directory.find('Audi').coverage, 'partial');
});

test('one coauthored publication contributes once to a brand while both account records remain traceable', () => {
  const a = { id: 'a', station: 'cerro', sourceUrl: 'https://www.instagram.com/p/ABC/', date: '2026-08-10', kind: 'post', brand: 'Rip Curl', brands: ['Rip Curl'], account: 'ripcurl_argentina' };
  const b = { ...a, id: 'b', account: 'ripcurlglobal' };
  const catalog = events.createCatalog([], [a, b]);
  const directory = model.createDirectory({ stationPieces: [], brandPosts: [a, b], accounts: [], catalog });
  assert.equal(directory.find('Rip Curl').publicationCount, 1);
  assert.equal(directory.find('Rip Curl').items[0].origins.length, 2);
});

test('a partner credited in another company post is not falsely treated as its publishing account', () => {
  const a = { id: 'a', station: 'valle', sourceUrl: 'https://www.instagram.com/p/ABC/', date: '2026-08-10', kind: 'post', brand: 'Visa', brands: ['Visa', 'Oakley'], account: 'visachile' };
  const directory = model.createDirectory({ stationPieces: [{ station: 'valle', brands: ['Oakley'] }], brandPosts: [a], accounts: [] });
  assert.equal(directory.find('Visa').publicationCount, 1);
  assert.equal(directory.find('Oakley').publicationCount, 0);
});

test('global counts deduplicate a post linked to two resorts but retain each resort association', () => {
  const a = { id: 'a', station: 'cerler', sourceUrl: 'https://www.instagram.com/p/ABC/', date: '2026-02-10', kind: 'post', brand: 'Volvo', brands: ['Volvo'] };
  const b = { ...a, id: 'b', station: 'formigal' };
  const directory = model.createDirectory({ stationPieces: [], brandPosts: [a, b], accounts: [] });
  assert.equal(directory.find('Volvo').items.length, 2);
  assert.equal(directory.find('Volvo').publicationCount, 1);
  assert.deepEqual(directory.find('Volvo').stationIds, ['cerler', 'formigal']);
});

test('a global sector gallery shows one post and retains every related resort', () => {
  const a = { id: 'a', kind: 'post', station: 'baqueira', sourceUrl: 'https://www.instagram.com/p/ABC/' };
  const b = { ...a, id: 'b', station: 'sierra' };
  const c = { ...a, id: 'c', station: 'formigal' };
  const result = model.withResortAssociations([a, b, c]);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].relatedStations, ['baqueira', 'sierra', 'formigal']);
  assert.equal(a.relatedStations, undefined);
});

test('distinct Stories are not collapsed merely because they share a Highlight URL', () => {
  const sourceUrl = 'https://www.instagram.com/stories/highlights/123/';
  const result = model.withResortAssociations([
    { id: 'story-a', kind: 'story', station: 'a', sourceUrl },
    { id: 'story-b', kind: 'story', station: 'a', sourceUrl }
  ]);
  assert.equal(result.length, 2);
});

test('posts outside the fixed study window and unidentified placeholders cannot enter the brand evidence', () => {
  const directory = model.createDirectory({ stationPieces: [{ station: 's', brands: ['altres col·laboradors'] }],
    brandPosts: [{ id: 'a', brand: 'Audi', date: '2026-10-01' }], accounts: [] });
  assert.equal(directory.brands.length, 0);
});
