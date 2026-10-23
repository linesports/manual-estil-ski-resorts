const { test } = require('node:test');
const assert = require('node:assert/strict');
const { select } = require('../event-covers.js');
const piece = (id, image, mediaType = 'image', kind = 'post') => ({ id, image, kind, mediaType, media: [{ image, mediaType }] });

test('event covers never borrow a curated publication excluded by the active filters', () => {
  const only = piece('brand:iberdrola:DU27URviGCE:baqueira_beret', 'https://marcgrisolia-ai.github.io/manual-estil-ski-resorts-media/DU27URviGCE_01.webp', 'video');
  const covers = select({ id: 'baqueira_beret:iberdrola', items: [only] });
  assert.deepEqual(covers.map(c => c.pieceId), [only.id]);
  assert.equal(covers[0].image, only.image);
});

test('a vertical event graphic stays whole instead of receiving a landscape crop', () => {
  const covers = select({ id: 'unknown:event', items: [piece('graphic', './media/posters/73fb39b4353f387a7634.webp')] });
  assert.equal(covers[0].fit, 'contain');
  assert.equal(covers[0].width, 506);
  assert.equal(covers[0].height, 900);
});

test('the explicit Europa Cup cover wins over an earlier schedule Story without changing membership', () => {
  const schedule = piece('story:baqueira_beret:3823565081603219911', './media/posters/eed02bfacba369ef2290.webp', 'image', 'story');
  const photograph = piece('story:baqueira_beret:3824285572341183971', './media/posters/35a8aaef949be258e3a1.webp', 'video', 'story');
  const items = [schedule, photograph];
  const before = JSON.stringify(items);
  const covers = select({ id: 'baqueira_beret:europa-cup', items });
  assert.equal(covers.at(-1).pieceId, photograph.id, 'foreground is the intentional photograph, not first Story');
  assert.equal(JSON.stringify(items), before);
});

test('a source carousel can use a later photo without adding a publication', () => {
  const p = piece('brand:audispain:DSpIj2NjFxh:baqueira_beret', 'https://marcgrisolia-ai.github.io/manual-estil-ski-resorts-media-4/DSpIj2NjFxh_01.webp');
  p.media.push({ image: 'https://marcgrisolia-ai.github.io/manual-estil-ski-resorts-media-4/DSpIj2NjFxh_03.webp', mediaType: 'image' });
  const covers = select({ id: 'baqueira_beret:winter-driving', items: [p] });
  assert.equal(covers.length, 1);
  assert.equal(covers[0].pieceId, p.id);
  assert.match(covers[0].image, /DSpIj2NjFxh_03\.webp$/);
});

test('cover stacks do not repeat a shared image from two source records', () => {
  const image = './media/posters/73fb39b4353f387a7634.webp';
  const covers = select({ id: 'unknown:event', items: [piece('a', image), piece('b', image)] });
  assert.equal(covers.length, 1);
});

test('a publication with no usable image never emits an empty img source', () => {
  assert.deepEqual(select({ id: 'empty:event', items: [piece('missing', '')] }), []);
  assert.deepEqual(select({ id: 'empty:event', items: [] }), []);
});
