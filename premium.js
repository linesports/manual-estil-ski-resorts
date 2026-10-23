(function () {
  'use strict';
  const app = window.OLAF_APP;
  const scenes = window.OLAF_SCENES || {};
  const image = document.getElementById('sceneImage');
  const credit = document.getElementById('sceneCredit');
  const mapNode = document.getElementById('resortMap');
  const hero = document.getElementById('stationHero');
  const sectionNav = document.getElementById('stationSectionNav');
  const overview = document.getElementById('stationOverview');
  const videoToggle = document.getElementById('heroVideoToggle');
  const desktop = matchMedia('(min-width:1024px)');
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
    if (window.gsap) gsap.set(image, { y: 0, clearProps: 'transform' });
    if (window.gsap && window.ScrollTrigger && !reduced.matches && desktop.matches) {
      gsap.registerPlugin(ScrollTrigger);
      parallax = gsap.fromTo(image, { scale: 1.07 }, { scale: 1, y: -30, ease: 'none', scrollTrigger: {
        trigger: hero, start: 'top top', end: 'bottom top', scrub: .7, invalidateOnRefresh: true
      } });
    }
    playback();
  }

  let heroVideo = null, mediaKey = '', heroInView = true, manuallyPaused = false, motionOptIn = false;
  function playback() {
    if (!heroVideo) return;
    const allowed = !hero.hidden && desktop.matches && heroInView && !document.hidden && !manuallyPaused &&
      (motionOptIn || (!reduced.matches && !navigator.connection?.saveData));
    if (allowed) {
      if (!heroVideo.getAttribute('src')) { heroVideo.src = heroVideo.dataset.source; heroVideo.load(); }
      const play = heroVideo.play();
      if (play?.catch) play.catch(() => updateVideoButton(false));
    } else heroVideo.pause();
    updateVideoButton(allowed && !heroVideo.paused);
  }
  function updateVideoButton(playing) {
    videoToggle.setAttribute('aria-label', playing ? 'Pausar el vídeo de capçalera' : 'Reproduir el vídeo de capçalera');
    videoToggle.querySelector('span').textContent = playing ? 'Pausar vídeo' : 'Reproduir vídeo';
    videoToggle.querySelector('path').setAttribute('d', playing ? 'M9 5v14M15 5v14' : 'M8 5v14l11-7Z');
  }
  function video(scene, id, enabled) {
    const asset = enabled && desktop.matches && window.OLAF_HERO_MEDIA?.stations?.[id];
    const creditLink = document.getElementById('heroMediaCredit');
    creditLink.hidden = !asset;
    if (asset) { creditLink.href = asset.sourceUrl; creditLink.textContent = asset.credit; }
    const key = asset ? id + ':' + asset.mp4 : '';
    if (key === mediaKey) { playback(); return; }
    mediaKey = key;
    if (heroVideo) { heroVideo.pause(); heroVideo.removeAttribute('src'); heroVideo.load(); heroVideo.remove(); heroVideo = null; }
    videoToggle.hidden = !asset;
    if (!asset) return;
    const node = document.createElement('video'); heroVideo = node;
    node.className = 'hero-video'; node.muted = true; node.defaultMuted = true; node.loop = true; node.playsInline = true; node.preload = 'none';
    node.setAttribute('aria-hidden', 'true'); node.setAttribute('tabindex', '-1');
    node.poster = asset.poster || scene.image;
    node.width = asset.width; node.height = asset.height;
    node.dataset.source = asset.webm && node.canPlayType('video/webm; codecs="vp9"') ? asset.webm : asset.mp4;
    node.addEventListener('playing', () => { if (heroVideo === node) { node.classList.add('is-playing'); updateVideoButton(true); } });
    node.addEventListener('pause', () => { if (heroVideo === node) updateVideoButton(false); });
    node.addEventListener('error', () => {
      if (heroVideo !== node) return;
      // Keep the station photograph when the decorative film is unavailable.
      node.classList.remove('is-playing'); videoToggle.hidden = true;
    });
    image.closest('.ambient-scene').append(node);
    playback();
  }
  videoToggle.addEventListener('click', () => {
    if (!heroVideo) return;
    if (heroVideo.paused) { manuallyPaused = false; motionOptIn = true; } else manuallyPaused = true;
    playback();
  });
  new IntersectionObserver(entries => { heroInView = entries[0].isIntersecting; playback(); }, { threshold: .02 }).observe(hero);
  document.addEventListener('visibilitychange', playback);

  const targets = { overview: 'stationHero', activations: 'eventLibrary', pieces: 'viewer', analysis: 'eventInsights' };
  function sectionTarget(section) {
    const node = document.getElementById(targets[section]);
    return section === 'analysis' && node?.hidden ? document.getElementById('storyDetails') : node;
  }
  const navLinks = [...sectionNav.querySelectorAll('a[data-section]')];
  function navRoutes(state) {
    navLinks.forEach(link => {
      const section = link.dataset.section;
      const targetState = section === 'brands' ? { mode: 'brands', station: state.station } :
        section === 'overview' ? state :
        { ...state, event: section === 'activations' ? '*' : section === 'analysis' && state.event !== '*' ? state.event : 'all', piece: '', media: 0 };
      link.href = window.OLAF_NAVIGATION.write(location.href, targetState).href;
    });
  }
  navLinks.forEach(link => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const section = link.dataset.section;
    if (section === 'brands') { app.setMode('brands'); return; }
    const select = document.getElementById('eventFilter');
    const wanted = section === 'activations' ? '*' : section === 'pieces' || section === 'analysis' && select.value === '*' ? 'all' : null;
    if (wanted && select.value !== wanted) { select.value = wanted; select.dispatchEvent(new Event('change', { bubbles: true })); }
    requestAnimationFrame(() => {
      const target = sectionTarget(section);
      if (!target || target.hidden) return;
      if (target.matches('details')) target.open = true;
      target.tabIndex = -1; target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
      navLinks.forEach(a => a.setAttribute('aria-current', a === link ? 'location' : 'false'));
    });
  }));
  let scrollFrame = 0;
  function queueSectionUpdate() {
    if (scrollFrame || hero.hidden) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const sections = Object.keys(targets).map(key => ({ key, node: sectionTarget(key) }))
        .filter(item => item.node && !item.node.hidden && item.node.getClientRects().length && item.node.getBoundingClientRect().top <= 150);
      const active = sections.at(-1)?.key || 'overview';
      navLinks.forEach(a => a.setAttribute('aria-current', a.dataset.section === active ? 'location' : 'false'));
    });
  }
  window.addEventListener('scroll', queueSectionUpdate, { passive: true });

  function photo(scene, key) {
    if (key === sceneKey) return;
    sceneKey = key; const request = ++imageRequest;
    if (!scene?.image) { image.hidden = true; credit.hidden = true; return; }
    const displayScene = { ...scene, photo: { ...scene.photo, sizes: '100vw' } };
    const candidate = window.OLAF_SCENE_PHOTO?.prepare(displayScene) || { src: scene.image };
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
      window.OLAF_SCENE_PHOTO.apply(image, displayScene);
      image.closest('.ambient-scene').style.maxWidth = '';
    } else {
      image.removeAttribute('srcset'); image.src = scene.image;
      image.style.objectPosition = scene.position || '50% 37%';
    }
    requestAnimationFrame(reveal); // The selected file may already be cached.
  }

  let previousStation = '';
  function sync(state = app.getState()) {
    const scene = scenes.stations?.[state.station];
    const stationMode = state.mode === 'station';
    hero.hidden = sectionNav.hidden = overview.hidden = !stationMode;
    if (stationMode && scene) {
      document.getElementById('heroPlace').textContent = scene.place;
      document.getElementById('stationOverviewTitle').textContent = 'En un cop d’ull';
      navRoutes(state);
      window.OLAF_WEATHER?.show({ stationId: state.station, scene, container: document.getElementById('stationWeather') });
    } else window.OLAF_WEATHER?.hide();
    video(scene, state.station, stationMode);
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
    syncSourceHelp(); queueSectionUpdate();
  }
  window.OLAF_SCENE_IMAGE_URL = value => {
    const match = String(value || '').match(/\/OLAF_Publicitat_Media\/(images|posters)\/([^/?#]+)/);
    return match ? './media/' + match[1] + '/' + decodeURIComponent(match[2]).replace(/\.[^.]+$/, '.webp') : value;
  };
  document.addEventListener('olaf:viewchange', () => sync());
  reduced.addEventListener('change', updateMotion);
  desktop.addEventListener('change', () => { mediaKey = ''; sync(); updateMotion(); });
  sync(); updateMotion();
  window.OLAF_SCENE = { sync, getMap: () => null, getVideo: () => heroVideo };
})();
