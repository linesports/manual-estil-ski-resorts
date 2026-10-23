(function () {
  'use strict';
  const app = window.OLAF_APP;
  const scenes = window.OLAF_SCENES || {};
  const image = document.getElementById('sceneImage');
  const credit = document.getElementById('sceneCredit');
  const mapNode = document.getElementById('resortMap');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let sceneKey = '', imageRequest = 0, parallax;

  // The location is quiet geographic context, rather than a second application.
  // Country outlines are generated from Natural Earth. The full map remains a link.
  function positionMap(scene, id) {
    const geography = window.OLAF_GEOGRAPHY?.stations?.[id];
    document.getElementById('geographyName').textContent = scene.place;
    const link = document.getElementById('geographyLink');
    const [longitude, latitude] = scene.coordinates;
    link.href = 'https://www.openstreetmap.org/?mlat=' + latitude + '&mlon=' + longitude + '#map=10/' + latitude + '/' + longitude;
    link.setAttribute('aria-label', 'Ubicació aproximada de ' + scene.name + ' · ' + scene.place + '. Obrir a OpenStreetMap');
    const coordinates = document.getElementById('geographyCoordinates');
    coordinates.textContent = Math.abs(latitude).toFixed(2) + '° ' + (latitude < 0 ? 'S' : 'N') + ' · ' + Math.abs(longitude).toFixed(2) + '° ' + (longitude < 0 ? 'O' : 'E');
    coordinates.title = scenes.geographyNote || 'Ubicació aproximada del domini';
    const source = document.getElementById('geographySource');
    source.hidden = !geography;
    if (geography) {
      source.href = geography.sourceUrl;
      source.title = geography.sourceLabel;
      source.setAttribute('aria-label', geography.sourceLabel);
    }
    if (mapNode.dataset.station === id) return;
    mapNode.dataset.station = id;
    mapNode.replaceChildren();
    mapNode.hidden = !geography;
    if (!geography) return;
    const locator = document.createElement('img');
    locator.alt = ''; locator.width = geography.width; locator.height = geography.height;
    locator.decoding = 'async'; locator.src = geography.image;
    locator.addEventListener('error', () => {
      if (mapNode.dataset.station === id) mapNode.hidden = true;
    }, { once: true });
    mapNode.append(locator);
  }

  // Keep the existing coverage explanation, behind a compact native disclosure.
  const note = document.getElementById('brandSourceNote');
  const sourceHelp = document.createElement('details');
  sourceHelp.className = 'source-note';
  const sourceSummary = document.createElement('summary');
  sourceSummary.textContent = 'Sobre les fonts i la cobertura';
  note.before(sourceHelp); sourceHelp.append(sourceSummary, note);
  function syncSourceHelp() { sourceHelp.hidden = note.hidden; }
  new MutationObserver(syncSourceHelp).observe(note, { attributes: true, attributeFilter: ['hidden'] });
  syncSourceHelp();

  function updateMotion() {
    parallax?.kill(); parallax = null;
    if (!window.gsap || !window.ScrollTrigger || reduced.matches) {
      if (window.gsap) gsap.set(image, { y: 0, clearProps: 'transform' });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    parallax = gsap.to(image, { y: 26, ease: 'none', scrollTrigger: {
      trigger: '.ambient-scene', start: 'top top', end: 'bottom top', scrub: .7,
      invalidateOnRefresh: true
    } });
  }

  function photo(scene, key) {
    if (key === sceneKey) return;
    sceneKey = key; const request = ++imageRequest;
    if (!scene?.image) { image.hidden = true; credit.hidden = true; return; }
    const candidate = window.OLAF_SCENE_PHOTO?.prepare(scene) || { src: scene.image };
    const expected = new Set([candidate.src, ...['srcset', 'avifSrcset']
      .flatMap(name => String(candidate[name] || '').split(',').map(part => part.trim().split(/\s+/)[0]))]
      .filter(Boolean).map(src => new URL(src, document.baseURI).href));
    image.hidden = true;
    credit.hidden = true;
    const license = document.getElementById('sceneLicense');
    license.hidden = true;
    function reveal() {
      if (request !== imageRequest || !image.complete || !image.naturalWidth || !expected.has(image.currentSrc || image.src)) return;
      const wasHidden = image.hidden;
      image.hidden = false;
      credit.hidden = !scene.sourceUrl; credit.href = scene.sourceUrl || '#';
      credit.textContent = scene.credit || 'Fotografia de ' + scene.name + ' · font original';
      license.hidden = !scene.licenseUrl; license.href = scene.licenseUrl || '#';
      if (wasHidden && window.gsap && !reduced.matches) gsap.fromTo(image, { opacity: .5 }, { opacity: 1, duration: .28, ease: 'power2.out', overwrite: 'auto' });
    }
    // picture selection settles after its source mutations. Listen for the actual
    // selected image load; immediate decode() can reject before currentSrc exists.
    image.onload = reveal;
    image.onerror = () => { if (request === imageRequest) { image.hidden = true; credit.hidden = true; license.hidden = true; } };
    if (window.OLAF_SCENE_PHOTO) {
      window.OLAF_SCENE_PHOTO.apply(image, scene);
      image.closest('.ambient-scene').style.maxWidth = candidate.displayWidth ? (candidate.displayWidth / Math.min(devicePixelRatio || 1, 2)) + 'px' : '';
    } else {
      image.removeAttribute('srcset'); image.src = scene.image;
      image.style.objectPosition = scene.position || '50% 37%';
    }
    requestAnimationFrame(reveal); // The selected file may already be cached.
  }

  let previousStation = '';
  function sync(state = app.getState()) {
    const scene = scenes.stations?.[state.station];
    if (state.mode === 'brands') {
      const brand = app.brandDirectory.find(state.brand);
      const piece = brand?.items.find(piece => piece.image);
      const brandedScene = piece ? {
        name: brand.name, image: window.OLAF_SCENE_IMAGE_URL(piece.image),
        sourceUrl: piece.sourceUrl, credit: 'Fotografia · publicació de ' + brand.name, position: '50% 28%'
      } : scenes.brand;
      photo(brandedScene, 'brand:' + (brand?.id || 'overview'));
    } else photo(scene, state.station);
    if (state.mode === 'station' && scene) {
      positionMap(scene, state.station);
      if (previousStation !== state.station && window.gsap && !reduced.matches) {
        gsap.fromTo('.station-identity', { y: 5, opacity: .7 }, { y: 0, opacity: 1, duration: .24, ease: 'power2.out', overwrite: true, clearProps: 'transform,opacity' });
      }
      previousStation = state.station;
    }
    syncSourceHelp();
  }
  window.OLAF_SCENE_IMAGE_URL = value => {
    const match = String(value || '').match(/\/OLAF_Publicitat_Media\/(images|posters)\/([^/?#]+)/);
    return match ? './media/' + match[1] + '/' + decodeURIComponent(match[2]).replace(/\.[^.]+$/, '.webp') : value;
  };
  document.addEventListener('olaf:viewchange', event => sync(event.detail));
  reduced.addEventListener('change', updateMotion);
  sync(); updateMotion();
  window.OLAF_SCENE = { sync, getMap: () => null };
})();
