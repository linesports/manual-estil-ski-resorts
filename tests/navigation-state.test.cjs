const test = require('node:test');
const assert = require('node:assert/strict');
const navigation = require('../navigation-state.js');

test('a filtered event, selected piece and carousel page survive a shared link', () => {
  const link = navigation.write('https://example.org/manual/', { mode:'station', station:'baqueira_beret', event:'fwt', sponsor:'Movistar', source:'brand', format:'reel', piece:'piece-7', media:2 });
  const result = navigation.read(link, ['baqueira_beret', 'masella']);
  assert.equal(result.station, 'baqueira_beret'); assert.equal(result.event, 'fwt');
  assert.equal(result.sponsor, 'Movistar'); assert.equal(result.source, 'brand');
  assert.equal(result.format, 'reel'); assert.equal(result.piece, 'piece-7'); assert.equal(result.media, 2);
});
test('returning from a brand retains the directory search without retaining an account-specific piece', () => {
  const link = navigation.write('https://example.org/?view=brands&brand=gopro&piece=old&account=gopro', {mode:'brands',query:'snow',scope:'all',resort:'masella',sector:'Tecnologia'});
  assert.equal(link.searchParams.get('q'),'snow'); assert.equal(link.searchParams.get('resort'),'masella');
  assert.equal(link.searchParams.has('brand'),false); assert.equal(link.searchParams.has('piece'),false); assert.equal(link.searchParams.has('account'),false);
});
test('switching section drops filters that do not belong to the destination', () => {
  const link = navigation.write('https://example.org/manual/?view=brands&q=Audi&brand=audi&account=audi&event=fwt&media=3#masella', {mode:'sectors',sector:'Automoció i mobilitat'});
  assert.equal(link.hash,''); assert.equal(link.searchParams.get('sector'),'Automoció i mobilitat');
  for(const key of ['q','brand','account','event','media']) assert.equal(link.searchParams.has(key),false);
});
test('unknown modes, formats, stations and negative media positions recover to usable defaults', () => {
  const state = navigation.read('https://example.org/?view=oops&format=oops&media=-4#missing', ['baqueira_beret']);
  assert.equal(state.mode,'station');assert.equal(state.station,'baqueira_beret');assert.equal(state.format,'all');assert.equal(state.media,0);
});
test('a malformed pasted station fragment does not prevent the site from opening', () => {
  const state = navigation.read('https://example.org/#%E0%A4%A', ['baqueira_beret']);
  assert.equal(state.station,'baqueira_beret');
});
