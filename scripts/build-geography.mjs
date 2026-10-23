/**
 * Generate transparent geographic locators from Natural Earth public-domain
 * administrative polygons. No runtime or drawing dependency is required.
 *
 * node scripts/build-geography.mjs [--source /path/to/geojson] [--check]
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commit = '9380cca83db5f9aef52d5e762765100745f84b27';
const sourceUrl = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${commit}/geojson/ne_50m_admin_0_countries.geojson`;
const sourceSHA256 = '3e458fc036ad0a66411f2c1e6cac49c5d7bfb81cb1123bc513b22511a2b7fdeb';
const licenseUrl = 'https://www.naturalearthdata.com/about/terms-of-use/';
const sourceFlag = process.argv.indexOf('--source');
const source = sourceFlag >= 0
  ? await fs.readFile(process.argv[sourceFlag + 1])
  : Buffer.from(await (await fetch(sourceUrl).then(response => {
    if (!response.ok) throw new Error(`Natural Earth: HTTP ${response.status}`);
    return response.arrayBuffer();
  })));
assert.equal(createHash('sha256').update(source).digest('hex'), sourceSHA256, 'Unexpected source snapshot');
const countries = JSON.parse(source).features;
const sandbox = { window: {} };
vm.runInNewContext(await fs.readFile(path.join(root, 'scene-data.js'), 'utf8'), sandbox);
const scenes = sandbox.window.OLAF_SCENES.stations;

// Bounds are geographic windows in degrees [west, south, east, north].
// Neighbouring countries retain their real coastlines/borders and may continue
// beyond the viewport; no rectangular geographic frame is drawn.
const regions = {
  iberia: { bounds: [-10.4, 35.3, 10.1, 51.5], countries: ['ESP', 'PRT', 'AND', 'FRA'], label: 'Península Ibèrica, Pirineus i França metropolitana' },
  alps: { bounds: [-5.6, 36.3, 19.1, 51.5], countries: ['FRA', 'CHE', 'ITA', 'AUT', 'LIE'], label: 'Alps en el context de França, Suïssa, Itàlia i Àustria' },
  usa: { bounds: [-126, 23.2, -65, 51.5], countries: ['USA', 'CAN', 'MEX'], filledCountries: ['USA'], label: 'Estats Units continentals i països veïns' },
  canada: { bounds: [-142, 25, -51, 77], countries: ['CAN', 'USA', 'MEX'], filledCountries: ['CAN', 'USA'], label: 'Amèrica del Nord · Canadà i Estats Units' },
  japan: { bounds: [128, 29, 146.8, 46.6], countries: ['JPN'], label: 'Arxipèlag principal del Japó' },
  andes: { bounds: [-76.5, -57, -52, -17], countries: ['CHL', 'ARG', 'BOL', 'PRY', 'URY'], filledCountries: ['CHL', 'ARG'], label: 'Andes i con sud' },
};
const byRegion = {
  iberia: ['baqueira_beret', 'sierranevadaestacion', 'masellapirineu', 'cerleraramon', 'javalambrearamon', 'formigalpanticosaaramon', 'grandvalira', 'palarinsalandorra', 'ordinoarcalis', 'grupoaramon'],
  alps: ['val_thorens', 'tignesofficiel', 'laax', 'zermattbergbahnen'],
  usa: ['aspensnowmass', 'jacksonhole'],
  canada: ['whistlerblackcomb'],
  japan: ['hanazononiseko', 'rusutsuresort_official'],
  andes: ['skiportillo', 'valle_nevado', 'cerrocastor'],
};
const expectedIds = Object.values(byRegion).flat().sort();
assert.deepEqual(Object.keys(scenes).sort(), expectedIds, 'Scene/locator identity mismatch');

const width = 400, height = 240, padding = 12;
const radians = Math.PI / 180;
function mercator([longitude, latitude]) {
  assert(Math.abs(latitude) < 85.051129, 'Mercator latitude outside supported extent');
  return [longitude * radians, -Math.log(Math.tan(Math.PI / 4 + latitude * radians / 2))];
}
function projection(bounds) {
  const [west, south, east, north] = bounds;
  const [x0, y0] = mercator([west, north]);
  const [x1, y1] = mercator([east, south]);
  const scale = Math.min((width - 2 * padding) / (x1 - x0), (height - 2 * padding) / (y1 - y0));
  const offsetX = (width - (x1 - x0) * scale) / 2;
  const offsetY = (height - (y1 - y0) * scale) / 2;
  return point => { const [x, y] = mercator(point); return [offsetX + (x - x0) * scale, offsetY + (y - y0) * scale]; };
}
function segmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator)) : 0;
  return (point[0] - start[0] - t * dx) ** 2 + (point[1] - start[1] - t * dy) ** 2;
}
function simplify(points, tolerance = 0.45) {
  if (points.length <= 3) return points;
  const keep = new Set([0, points.length - 1]);
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [start, end] = stack.pop();
    let farthest = -1, distance = tolerance * tolerance;
    for (let i = start + 1; i < end; i++) {
      const candidate = segmentDistanceSquared(points[i], points[start], points[end]);
      if (candidate > distance) { distance = candidate; farthest = i; }
    }
    if (farthest >= 0) { keep.add(farthest); stack.push([start, farthest], [farthest, end]); }
  }
  return [...keep].sort((a, b) => a - b).map(index => points[index]);
}
function intersects(ring, [west, south, east, north]) {
  const longitudes = ring.map(point => point[0]), latitudes = ring.map(point => point[1]);
  return Math.max(...longitudes) >= west && Math.min(...longitudes) <= east && Math.max(...latitudes) >= south && Math.min(...latitudes) <= north;
}
const number = value => Number(value.toFixed(1));
function countryPath(feature, bounds, project, tolerance) {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons.map(polygon => polygon.filter(ring => intersects(ring, bounds)).map(ring => {
    const projected = ring.map(project);
    const xs = projected.map(point => point[0]), ys = projected.map(point => point[1]);
    if (Math.max(...xs) - Math.min(...xs) < 0.9 && Math.max(...ys) - Math.min(...ys) < 0.9) return '';
    const points = simplify(projected, tolerance);
    if (points.length < 4) return '';
    const [first, ...rest] = points;
    return `M${number(first[0])},${number(first[1])}${rest.map(point => ` ${number(point[0])},${number(point[1])}`).join('')}Z`;
  }).join('')).join('');
}
const escapeXML = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const stations = {}, assetReport = [];
await fs.mkdir(path.join(root, 'media/geography'), { recursive: true });
for (const [regionId, ids] of Object.entries(byRegion)) {
  const region = regions[regionId], project = projection(region.bounds);
  const features = region.countries.map(code => {
    const feature = countries.find(candidate => candidate.properties.ADM0_A3 === code);
    assert(feature, `Missing country: ${code}`);
    return feature;
  });
  let outlines, tolerance = 0.45;
  for (const candidate of [0.45, 0.65, 0.9, 1.25, 1.6]) {
    tolerance = candidate;
    outlines = features.map(feature => `<path data-country="${feature.properties.ADM0_A3}"${region.filledCountries && !region.filledCountries.includes(feature.properties.ADM0_A3) ? ' fill="none" opacity=".5"' : ''} d="${countryPath(feature, region.bounds, project, tolerance)}"/>`).join('');
    if (Buffer.byteLength(outlines) < 14000) break;
  }
  for (const id of ids) {
    const scene = scenes[id];
    const points = scene.points || [scene.coordinates];
    for (const [longitude, latitude] of points) {
      const [west, south, east, north] = region.bounds;
      assert(longitude >= west && longitude <= east && latitude >= south && latitude <= north, `${id}: point outside geographic bounds`);
    }
    const markers = points.map(point => {
      const [x, y] = project(point);
      assert(x >= padding && x <= width - padding && y >= padding && y <= height - padding, `${id}: projected point clipped`);
      return `<g data-coordinates="${point.join(',')}"><circle cx="${number(x)}" cy="${number(y)}" r="8" fill="#426b87" opacity=".16"/><circle cx="${number(x)}" cy="${number(y)}" r="4.2" fill="#426b87" stroke="#edf0f1" stroke-width="1.5"/></g>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${escapeXML(scene.name)} · situació geogràfica aproximada</title><desc>Made with Natural Earth. Public domain. Mercator. ${escapeXML(region.label)}. ${region.bounds.join(', ')}.</desc><g fill="#d9e2e7" stroke="#8399a6" stroke-width=".7" stroke-linejoin="round" fill-rule="evenodd">${outlines}</g>${markers}</svg>\n`;
    const image = `./media/geography/${id}.svg`;
    const bytes = Buffer.byteLength(svg);
    assert(bytes < 15360, `${id}: locator exceeds 15 KiB (${bytes})`);
    const target = path.join(root, image);
    if (process.argv.includes('--check')) assert.equal(await fs.readFile(target, 'utf8'), svg, `${id}: generated locator is stale`);
    else await fs.writeFile(target, svg);
    stations[id] = { image, width, height, sourceUrl: 'https://www.naturalearthdata.com/', sourceLabel: 'Cartografia · Natural Earth · domini públic', bounds: region.bounds, points, projection: 'Mercator' };
    assetReport.push({ id, image, bytes, sha256: createHash('sha256').update(svg).digest('hex'), region: regionId, bounds: region.bounds, points, countries: region.countries, filledCountries: region.filledCountries || region.countries, simplificationPixels: tolerance });
  }
}
const manifest = `window.OLAF_GEOGRAPHY = ${JSON.stringify({ stations, note: 'Situació aproximada. No és un plànol de pistes. Geometria administrativa Natural Earth 1:50m, domini públic.' })};\n`;
const report = JSON.stringify({ sourceUrl, sourceSHA256, sourceCommit: commit, license: 'Public domain', licenseUrl, projection: 'Spherical Mercator; coordinates WGS84 longitude/latitude', width, height, simplification: 'Douglas–Peucker; tolerance per asset, SVG pixels. Coordinates rounded to 0.1 px. Islands under 0.9 px in both dimensions omitted at locator scale.', attribution: 'Made with Natural Earth', coordinateSource: 'Existing scene-data.js, preserved without changes', assets: assetReport }, null, 2) + '\n';
for (const [name, contents] of [['geography-data.js', manifest], ['media/geography/provenance.json', report]]) {
  if (process.argv.includes('--check')) assert.equal(await fs.readFile(path.join(root, name), 'utf8'), contents, `${name}: generated data is stale`);
  else await fs.writeFile(path.join(root, name), contents);
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${assetReport.length} locators, ${assetReport.reduce((sum, asset) => sum + asset.bytes, 0)} bytes total; ${Math.max(...assetReport.map(asset => asset.bytes))} bytes maximum. All station IDs and marker bounds verified.`);
