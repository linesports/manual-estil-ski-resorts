const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../event-catalog.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../brand-research-data.js'), 'utf8'), context);
const data = context.window.OLAF_BRAND_RESEARCH;

test('brand evidence respects the fixed season and confirmed publishing identities', () => {
  const accounts = new Map(data.accounts.map(a => [a.username, a]));
  assert.ok(accounts.size > 100);
  for (const post of data.posts) {
    assert.ok(post.date >= '2025-09-29' && post.date <= '2026-09-28', post.id);
    assert.equal(accounts.get(post.account)?.identityStatus, 'confirmed', post.id);
    assert.ok(accounts.get(post.account).brands.includes(post.brand), post.id);
    assert.equal(post.kind, 'post');
    assert.equal(post.paidDistribution, 'not_established');
  }
  for (const rejected of ['nastc', 'vacanostra', 'hotelajapan', 'jbl', 'iqos_es']) assert.ok(!accounts.has(rejected));
});

test('annual evidence does not duplicate an account/resort publication or use expiring video sources', () => {
  const keys = new Set();
  for (const post of data.posts) {
    const key = [post.account, post.station, post.shortCode].join(':');
    assert.ok(!keys.has(key), key); keys.add(key);
    assert.ok(post.media.length, post.id);
    for (const media of post.media) {
      if (media.mediaType === 'video') {
        assert.ok(media.unavailableReason || /\.mp4$/.test(media.videoPath), post.id);
        assert.ok(!media.videoPath || !/cdninstagram|fbcdn|chatgpt\.site/.test(media.videoPath), post.id);
      }
    }
  }
});

test('a VORARIU account weekend does not become the Trofeu Naut Aran', () => {
  const piece = { id: 'x', station: 'baqueira_beret', title: 'VORARIU · Producte', caption: 'Fin de semana épico por @baqueira_beret', brands: ['VORARIU'] };
  assert.equal(model.createCatalog([], [piece]).eventFor(piece), null);
});

test('a generic SB3 partnership does not identify the Tignes Enduro event', () => {
  const piece = { id: 'x', station: 'tignesofficiel', title: 'SB3 Components · Producte', caption: 'Merci @tignesofficiel pour cette saison.', brands: ['SB3 Components'] };
  assert.equal(model.createCatalog([], [piece]).eventFor(piece), null);
});

test('the Ariake prize is separated from an activation held at Rusutsu', () => {
  const piece = { id: 'x', station: 'rusutsuresort_official', caption: 'PPA Pros are coming to Ariake. Prize: Rusutsu Resort stay + court access. Pickleball.', brands: ['Pickleball Japan Federation'] };
  const catalog = model.createCatalog([], [piece]);
  assert.equal(catalog.eventFor(piece).id, 'rusutsuresort_official:ariake-prizes');
  assert.equal(catalog.eventsForPiece(piece).length, 1);
});

test('an alpine World Cup caption cannot become a mountain-bike event at Pal Arinsal', () => {
  const piece = { id: 'x', station: 'palarinsalandorra', title: 'Copa del Món FIS', caption: 'Copa del Món d’esquí alpí, gràcies @palarinsalandorra.', brands: ['FIS'] };
  assert.equal(model.createCatalog([], [piece]).eventFor(piece), null);
});

test('driving to a destination is not a product test', () => {
  for (const caption of ['Hanazono-side land just 2 minutes drive from Park Hyatt and lifts', 'Make the drive up to British Columbia']) {
    const piece = { id: caption, station: 'hanazononiseko', caption, brands: ['Niseko Real Estate'] };
    const relations = model.createCatalog([], [piece]).relations(piece);
    assert.ok(!relations.some(relation => relation.type === 'demo'));
  }
});

test('an explicit test drive still identifies a product demonstration', () => {
  const piece = { id: 'drive', station: 'masellapirineu', caption: 'Movento Stern: prueba el Mercedes-Benz en el test drive de Masella.', brands: ['Movento Stern'] };
  assert.ok(model.createCatalog([], [piece]).relations(piece).some(relation => relation.type === 'demo'));
});
