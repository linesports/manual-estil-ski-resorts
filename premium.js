(function () {
  'use strict';
  const app = window.OLAF_APP;
  const scenes = window.OLAF_SCENES || {};
  const image = document.getElementById('sceneImage');
  const credit = document.getElementById('sceneCredit');
  const mapNode = document.getElementById('resortMap');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let map, markers = [], mapReady = false, mapUnavailable = false, pendingScene, sceneKey = '', imageRequest = 0, parallax;

  function fallback(scene) {
    if (!scene || map) return;
    mapNode.replaceChildren();
    const place = document.createElement('div'); place.className = 'map-fallback';
    const title = document.createElement('strong'); title.textContent = scene.place;
    const coordinates = document.createElement('span'); coordinates.textContent = scene.coordinates[1].toFixed(2) + '°, ' + scene.coordinates[0].toFixed(2) + '°';
    place.append(title, coordinates); mapNode.append(place);
  }

  function positionMap(scene, animate) {
    pendingScene = scene;
    document.getElementById('geographyName').textContent = scene.place;
    const link = document.getElementById('geographyLink');
    link.href = 'https://www.openstreetmap.org/?mlat=' + scene.coordinates[1] + '&mlon=' + scene.coordinates[0] + '#map=10/' + scene.coordinates[1] + '/' + scene.coordinates[0];
    link.setAttribute('aria-label', 'Ubicació aproximada de ' + scene.name + ' a OpenStreetMap');
    if (!mapReady) { if (mapUnavailable) fallback(scene); return; }
    markers.forEach(marker => marker.remove()); markers = [];
    (scene.points || [scene.coordinates]).forEach(coordinates => {
      const node = document.createElement('span'); node.className = 'map-location-marker'; node.setAttribute('aria-label', scene.name);
      markers.push(new maplibregl.Marker({ element: node }).setLngLat(coordinates).addTo(map));
    });
    requestAnimationFrame(() => {
      map.resize();
      const camera = { center: scene.coordinates, zoom: scene.zoom || 8.1, pitch: 0, bearing: 0 };
      if (animate && !reduced.matches) map.flyTo({ ...camera, duration: 1100, essential: false, curve: 1.2 });
      else map.jumpTo(camera);
    });
  }

  function loadMap() {
    if (!window.maplibregl) { mapUnavailable = true; fallback(pendingScene); return; }
    mapNode.replaceChildren();
    try {
      map = new maplibregl.Map({
        container: mapNode, center: [0.94, 42.7], zoom: 8.1,
        style: {
          version: 8,
          sources: {
            geography: { type: 'raster', tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'], tileSize: 256,
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>' },
            relief: { type: 'raster-dem', url: 'https://tiles.mapterhorn.com/tilejson.json', tileSize: 512, encoding: 'terrarium',
              attribution: '© <a href="https://mapterhorn.com/">Mapterhorn</a>' }
          },
          layers: [
            { id: 'background', type: 'background', paint: { 'background-color': '#dfe6e9' } },
            { id: 'geography', type: 'raster', source: 'geography', paint: { 'raster-saturation': -1, 'raster-opacity': .85, 'raster-contrast': -.1 } },
            { id: 'relief', type: 'hillshade', source: 'relief', paint: { 'hillshade-exaggeration': .28, 'hillshade-shadow-color': '#728797', 'hillshade-highlight-color': '#ffffff', 'hillshade-accent-color': '#9eafb9' } }
          ]
        },
        attributionControl: false, scrollZoom: false, dragRotate: false, pitchWithRotate: false, doubleClickZoom: false,
        dragPan: false, touchZoomRotate: false, keyboard: false, renderWorldCopies: false,
        fadeDuration: reduced.matches ? 0 : 250
      });
      map.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
      map.on('load', () => {
        mapReady = true;
        map.getCanvas().tabIndex = -1;
        map.getCanvas().setAttribute('aria-hidden', 'true');
        if (pendingScene) positionMap(pendingScene, false);
      });
      map.on('error', event => {
        // Relief is progressive enhancement: the independently sourced location map remains usable.
        if (/mapterhorn|relief/.test(event.error?.message || '') || event.sourceId === 'relief') {
          if (map.getLayer('relief')) map.setLayoutProperty('relief', 'visibility', 'none');
        }
      });
      mapNode.addEventListener('webglcontextlost', () => {
        mapReady = false; mapUnavailable = true; map.remove(); map = null; fallback(pendingScene);
      }, { once: true });
    } catch (_) { mapUnavailable = true; map = null; fallback(pendingScene); }
  }

  function updateMotion() {
    parallax?.kill(); parallax = null;
    if (!window.gsap || !window.ScrollTrigger || reduced.matches) {
      if (window.gsap) gsap.set(image, { y: 0, clearProps: 'transform' });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    parallax = gsap.to(image, { y: 42, ease: 'none', scrollTrigger: {
      trigger: '.ambient-scene', start: 'top top', end: 'bottom top', scrub: .7,
      invalidateOnRefresh: true
    } });
  }

  function photo(scene, key) {
    if (key === sceneKey) return;
    sceneKey = key; const request = ++imageRequest;
    if (!scene?.image) { image.hidden = true; credit.hidden = true; return; }
    const next = new Image();
    next.onload = () => {
      if (request !== imageRequest) return;
      image.src = scene.image; image.hidden = false;
      image.style.objectPosition = scene.position || '50% 37%';
      credit.hidden = !scene.sourceUrl; credit.href = scene.sourceUrl || '#';
      credit.textContent = scene.credit || 'Fotografia de ' + scene.name + ' · font original';
      if (window.gsap && !reduced.matches) gsap.fromTo(image, { opacity: .28 }, { opacity: 1, duration: .65, ease: 'power2.out', overwrite: 'auto' });
    };
    next.onerror = () => { if (request === imageRequest) { image.hidden = true; credit.hidden = true; } };
    next.src = scene.image;
  }

  let previousStation = '';
  function sync(state = app.getState()) {
    const scene = scenes.stations?.[state.station];
    if (state.mode === 'brands') {
      const brand = app.brandDirectory.find(state.brand);
      const piece = brand?.items.find(piece => piece.image);
      const brandedScene = piece ? {
        name: brand.name, image: window.OLAF_SCENE_IMAGE_URL ? window.OLAF_SCENE_IMAGE_URL(piece.image) : piece.image,
        sourceUrl: piece.sourceUrl, credit: 'Fotografia · publicació de ' + brand.name, position: '50% 28%'
      } : scenes.brand;
      photo(brandedScene, 'brand:' + (brand?.id || 'overview'));
    } else {
      photo(scene, state.station);
    }
    if (state.mode === 'station' && scene) {
      positionMap(scene, previousStation !== '' && previousStation !== state.station);
      if (previousStation !== state.station && window.gsap && !reduced.matches) {
        gsap.fromTo('.station-identity', { y: 8, opacity: .5 }, { y: 0, opacity: 1, duration: .5, ease: 'power2.out', overwrite: true, clearProps: 'transform,opacity' });
      }
      previousStation = state.station;
    }
  }
  // Normalize legacy media references without retaining the former Sites dependency.
  window.OLAF_SCENE_IMAGE_URL = value => {
    const match = String(value || '').match(/\/OLAF_Publicitat_Media\/(images|posters)\/([^/?#]+)/);
    return match ? './media/' + match[1] + '/' + decodeURIComponent(match[2]).replace(/\.[^.]+$/, '.webp') : value;
  };
  document.addEventListener('olaf:viewchange', event => sync(event.detail));
  reduced.addEventListener('change', updateMotion);
  sync(); updateMotion();
  if ('requestIdleCallback' in window) requestIdleCallback(loadMap, { timeout: 1400 });
  else setTimeout(loadMap, 400);
  window.OLAF_SCENE = { sync, getMap: () => map };
})();
