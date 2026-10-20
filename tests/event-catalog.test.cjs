const test = require('node:test');
const assert = require('node:assert/strict');
const { createCatalog } = require('../event-catalog.js');

const piece = (id, station, caption, brands = ['Movistar']) => ({
  id, station, caption, brands, title: '', kind: 'post', date: '2026-01-15',
  sourceUrl: 'https://www.instagram.com/p/' + id.split('|').pop() + '/', media: []
});

test('separates events in one station even when their sponsor is the same', () => {
  const a = piece('post:baqueira_beret|A', 'baqueira_beret', 'Baqueira Beret Pro by Movistar #FWT');
  const b = piece('post:baqueira_beret|B', 'baqueira_beret', 'Copa de Europa en Baqueira, Movistar.');
  const c = createCatalog([a, b], []);
  assert.match(c.eventFor(a).name, /Baqueira Beret Pro/);
  assert.match(c.eventFor(b).name, /Europa/);
  assert.notEqual(c.eventFor(a).id, c.eventFor(b).id);
});

test('uses caption evidence before an inaccurate old title and respects the station', () => {
  const a = { ...piece('post:aspensnowmass|A', 'aspensnowmass', 'Finals day @thesnowleague', ['Jeep']), title: 'X Games · partners al podi' };
  const b = piece('post:baqueira_beret|B', 'baqueira_beret', 'Snow Pride', ['Audi']);
  const c = createCatalog([a, b], []);
  assert.match(c.eventFor(a).name, /Snow League/);
  assert.equal(c.eventFor(b), null, 'do not invent a Snow Pride event in Baqueira from a user example');
});

test('one coauthored post is counted once while preserving both account sources', () => {
  const a = piece('post:sierranevadaestacion|ABC', 'sierranevadaestacion', 'Heliocare nuevo patrocinador Sierra Nevada', ['Heliocare']);
  const b = { ...a, id: 'brand:cantabrialabs_esp:ABC:sierranevadaestacion', account: 'cantabrialabs_esp', relatedPieceIds: [a.id] };
  const c = createCatalog([a], [b]);
  assert.equal(c.pieces.length, 1);
  assert.deepEqual(c.pieces[0].origins.map(o => o.type).sort(), ['brand', 'station']);
  assert.equal(c.canonicalId(b.id), a.id);
});

test('brand-account posts are grouped by the event they describe, not every linked sponsor post', () => {
  const a = piece('post:valle_nevado|A', 'valle_nevado', 'Andes Cup Valle Nevado by Oakley', ['Oakley']);
  const b = { ...piece('brand:oakley_chile:B:valle_nevado', 'valle_nevado', 'Girls’ Park Takeover en Valle Nevado', ['Oakley']), account: 'oakley_chile', relatedPieceIds: [a.id] };
  const c = createCatalog([a], [b]);
  assert.notEqual(c.eventFor(a).id, c.eventFor(b).id);
});

test('naming alone does not imply physical presence; a logo on a digital poster is distinct', () => {
  const a = piece('post:baqueira_beret|A', 'baqueira_beret', 'Baqueira Beret Pro by @movistar_es');
  const c = createCatalog([a], []);
  const relations = c.relations(a);
  assert(relations.some(r => r.type === 'naming'));
  assert(!relations.some(r => ['physical', 'sampling'].includes(r.type)));
});

test('product testing and event attribution remain brand-specific', () => {
  const a = piece('post:palarinsalandorra|A', 'palarinsalandorra', 'Vine a provar Shimano a la seva Test Area durant la Copa del Món WHOOP UCI de MTB.', ['WHOOP', 'Shimano']);
  const c = createCatalog([a], []);
  assert(c.relations(a).some(r => r.brand === 'Shimano' && r.type === 'demo'));
  assert(!c.relations(a).some(r => r.brand === 'WHOOP' && r.type === 'demo'));
});

test('kick-off is not a visitor discount and FGC proposals are not source evidence', () => {
  const a = { ...piece('post:baqueira_beret|A', 'baqueira_beret', 'The Tour by @peakperformance is ready to kick-off.', ['Peak Performance']), transfer: 'Es podria fer un estand amb sampling.' };
  const c = createCatalog([a], []);
  assert(!c.relations(a).some(r => ['service', 'sampling', 'physical'].includes(r.type)));
});

test('a multi-resort brand caption does not attribute the La Parva lounge to Valle Nevado', () => {
  const a = { ...piece('brand:visachile:DbTI6rUuSkA:valle_nevado', 'valle_nevado', '20% OFF en restaurantes de Valle Nevado y acceso al Visa Infinite Lounge en La Parva.', ['Visa']), account: 'visachile' };
  const c = createCatalog([], [a]);
  assert.deepEqual(c.relations(a).map(r => r.type), ['service']);
});

test('Ski by credits equipment rather than event naming', () => {
  const a = piece('post:val_thorens|A', 'val_thorens', 'ASMR de l’ouverture 25/26. Ski by @salomon', ['Salomon']);
  const c = createCatalog([a], []);
  assert(c.relations(a).some(r => r.type === 'product'));
  assert(!c.relations(a).some(r => r.type === 'naming'));
});

test('a branded content segment is distinct from naming the whole event', () => {
  const a = { ...piece('story:laax:A', 'laax', '', ['Marriott Bonvoy']), kind: 'story', title: 'Winning Run presented by Marriott Bonvoy', context: 'Snow League', reviewBasis: 'source_cover_and_explicit_context', explanation: 'La baixada incorpora el grafisme Winning Run presented by Marriott Bonvoy.' };
  const c = createCatalog([a], []);
  assert(c.relations(a).some(r => r.type === 'content'));
  assert(!c.relations(a).some(r => r.type === 'naming'));
});

test('the preserved corpus keeps all originals reachable and real Baqueira events separate', () => {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const data = JSON.parse(html.match(/<script id="storiesData"[^>]*>(.*?)<\/script>/s)[1]);
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../brand-instagram-posts.js'), 'utf8'), context);
  const brandPosts = context.window.BRAND_INSTAGRAM_POSTS;
  const c = createCatalog(data.pieces, brandPosts);
  [...data.pieces, ...brandPosts].forEach(p => {
    assert.equal(c.find(p.id).station, p.station);
    const event = c.eventFor(p);
    if (event) assert.equal(event.station, p.station);
  });
  assert.equal(c.pieces.filter(p => c.eventFor(p)?.id === 'baqueira_beret:fwt').length, 23);
  assert.equal(c.pieces.filter(p => c.eventFor(p)?.id === 'baqueira_beret:europa-cup').length, 7);
  assert.equal(c.find('brand:cantabrialabs_esp:DTa_H2kCLYo:sierranevadaestacion').id, 'post:sierranevadaestacion|DTa_H2kCLYo');
});
