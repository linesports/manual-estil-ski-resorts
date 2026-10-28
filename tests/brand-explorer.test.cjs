const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../brand-model.js');
const navigation = require('../navigation-state.js');
const context = { window: { OLAF_BRAND_MODEL:model } };
vm.runInNewContext(fs.readFileSync(require.resolve('../brand-explorer.js'), 'utf8'), context);

function explorer(station, scope = 'with') {
  const instance = Object.create(context.window.OLAFBrandExplorer.prototype);
  Object.assign(instance, { station, scope, account:'*', query:'', sector:'*',
    sectorForBrand:() => 'Tecnologia', profiles:[{id:'masella',name:'Masella'},{id:'andorra',name:'Andorra'}],
    directory:{brands:[
      { id:'a', name:'Marca A', aliases:['Marca A'], accounts:[], stationIds:['masella','andorra'], publicationCount:3,
        items:[{id:'a1',station:'masella',sourceUrl:'https://www.instagram.com/p/LOCAL/'},{id:'a2',station:'andorra',sourceUrl:'https://www.instagram.com/p/OTHER/'},{id:'a3',station:'andorra',sourceUrl:'https://www.instagram.com/p/THIRD/'}] },
      { id:'b', name:'Marca B', aliases:['Marca B'], accounts:[], stationIds:['masella','andorra'], publicationCount:2,
        items:[{id:'b1',station:'andorra',sourceUrl:'https://www.instagram.com/p/REMOTE/'},{id:'b2',station:'andorra',sourceUrl:'https://www.instagram.com/p/REMOTE2/'}] }
    ]}
  });
  return instance;
}

test('brands with linked pieces refers to the selected resort, not publications at a different resort', () => {
  const selected = explorer('masella');
  assert.deepEqual(Array.from(selected.filteredBrands(), brand=>brand.name), ['Marca A']);
  assert.equal(selected.publicationCountFor(selected.directory.brands[0]), 1);
  assert.equal(selected.publicationCountFor(selected.directory.brands[1]), 0);
});

test('the explicit all-brands scope keeps associated brands with no local post, with a truthful zero', () => {
  const selected = explorer('masella', 'all');
  assert.deepEqual(Array.from(selected.filteredBrands(), brand=>brand.name), ['Marca A','Marca B']);
  assert.equal(selected.publicationCountFor(selected.directory.brands[1]), 0);
});

test('all resorts retains global counts and deduplicates a coauthored post within a resort', () => {
  const selected = explorer('*');
  assert.equal(selected.publicationCountFor(selected.directory.brands[0]), 3);
  selected.station = 'masella';
  selected.directory.brands[0].items.push({id:'a4',station:'masella',sourceUrl:'https://www.instagram.com/p/LOCAL/'});
  assert.equal(selected.publicationCountFor(selected.directory.brands[0]), 1);
});

test('brand ordering compares the selected resort counts rather than each brand global total', () => {
  const selected = explorer('masella');
  selected.directory.brands[1].items = [
    {id:'b1',station:'masella',sourceUrl:'https://www.instagram.com/p/LOCALB1/'},
    {id:'b2',station:'masella',sourceUrl:'https://www.instagram.com/p/LOCALB2/'}
  ];
  assert.deepEqual(Array.from(selected.filteredBrands(), brand=>brand.name), ['Marca B','Marca A']);
});

test('rendered brand links retain the real host, deployment path and filters for native new-tab navigation', () => {
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.listeners = {}; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    setAttribute() {}
    addEventListener(event, fn) { this.listeners[event] = fn; }
  }
  const href = 'https://example.org/manual-estil-ski-resorts/?view=brands&station=masella&resort=masella&q=Marca+A&scope=all';
  const sandbox = { window:{OLAF_BRAND_MODEL:model, OLAF_NAVIGATION:navigation}, location:{href}, document:{createElement:tag=>new Element(tag)} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../brand-explorer.js'), 'utf8'), sandbox);
  const selected = Object.assign(Object.create(sandbox.window.OLAFBrandExplorer.prototype), explorer('masella', 'all'));
  Object.assign(selected, { query:'Marca A', pageSize:18, expanded:false, list:new Element('div'), search:{}, sectorSelect:{}, stationSelect:{}, scopeSelect:{}, resultNote:{}, more:new Element('button'), intro:{querySelector:()=>({})} });
  selected.renderRows();
  const row = selected.list.children[0], url = new URL(row.href), page = new URL(href);
  assert.equal(url.origin, page.origin);
  assert.equal(url.pathname, page.pathname);
  assert.equal(url.searchParams.get('brand'), 'a');
  const restored = navigation.read(url, ['masella','andorra']);
  assert.equal(restored.station, 'masella');
  assert.equal(restored.resort, 'masella');
  assert.equal(restored.query, 'Marca A');
  assert.equal(restored.scope, 'all');
  let prevented = false, routed = false;
  selected.onBrand = () => { routed = true; };
  row.listeners.click({button:0,ctrlKey:true,preventDefault:()=>{prevented=true;}});
  assert.equal(prevented, false);
  assert.equal(routed, false);
});
