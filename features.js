(function () {
  'use strict';

  const baseRenderCarousel = renderCarousel;
  const baseUpdateCurrent = updateCurrent;
  const baseUpdateMediaNavigation = updateMediaNavigation;
  const baseRenderSlideMedia = renderSlideMedia;
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    const main = document.getElementById('main'); main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  const hydrateVideo = video => {
    if (video.dataset.poster) { video.poster = video.dataset.poster; delete video.dataset.poster; }
    if (video.dataset.source) { video.src = video.dataset.source; delete video.dataset.source; }
  };
  const mediaObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { hydrateVideo(entry.target); mediaObserver.unobserve(entry.target); } });
  }, { root: carousel, rootMargin: '0px 450px', threshold: 0 }) : null;
  const sponsorFilter = document.getElementById('sponsorFilter');
  const sectorFilter = document.getElementById('sectorFilter');
  const savedStationFilter = document.getElementById('savedStationFilter');
  const savedSectorFilter = document.getElementById('savedSectorFilter');
  const savedCategoryFilter = document.getElementById('savedCategoryFilter');
  const bookmarkDialog = document.getElementById('bookmarkDialog');
  const bookmarkCategory = document.getElementById('bookmarkCategory');
  const categories = ['Sampling', 'Activació de marca', 'Branding', 'Naming'];
  const legacyCategories = [...categories, 'Altres'];
  const research = window.OLAF_BRAND_RESEARCH || { posts: [], accounts: [] };
  const legacyBrandPosts = window.BRAND_INSTAGRAM_POSTS || [];
  const recordKey = piece => [piece.account, piece.station, window.OLAF_BRAND_MODEL.codeFor(piece) || piece.id].join(':');
  const priorEditorial = new Map(legacyBrandPosts.map(piece => [recordKey(piece), piece]));
  const annualPosts = (research.posts || []).map(piece => {
    const prior = priorEditorial.get(recordKey(piece));
    return prior ? { ...piece, title: prior.title, explanation: prior.explanation, transfer: prior.transfer,
      promotionType: prior.promotionType, editorialOrigin: 'prior_reviewed_case_with_refreshed_annual_media' } : piece;
  });
  const brandRecords = [...legacyBrandPosts, ...annualPosts];
  const brandPosts = [...new Map(brandRecords.map(piece => [
    recordKey(piece), piece
  ])).values()];
  const stationPiecesReviewed = DATA.pieces.map(piece => ({ ...piece, ...(window.OLAF_EVIDENCE_CORRECTIONS?.[piece.id] || {}) }));
  const catalog = window.OLAF_EVENT_MODEL.createCatalog(stationPiecesReviewed, brandPosts);
  const brandDirectory = window.OLAF_BRAND_MODEL.createDirectory({
    stationPieces: stationPiecesReviewed, brandPosts, accounts: research.accounts || [], catalog
  });
  const storageKey = 'olaf-ski-sponsor-bookmarks-v1';

  const sectorOrder = [
    'Automoció i mobilitat',
    'Equipament i esports',
    'Moda i complements',
    'Alimentació i begudes',
    'Tecnologia i continguts digitals',
    'Telecomunicacions',
    'Finances i assegurances',
    'Turisme i allotjament',
    'Immobiliari',
    'Salut i benestar',
    'Esdeveniments i entreteniment',
    'Energia i serveis',
    'Altres'
  ];

  const sectorBrands = {
    'Automoció i mobilitat': [
      'Audi', 'Toyota', 'Jeep', 'Volvo', 'Motul', 'Mercedes-Benz', 'Range Rover', 'Kia',
      'Prinoth', 'Leitner-Poma of America', 'Hankook', 'Movento Stern', 'Repsol'
    ],
    'Equipament i esports': [
      'Mammut', 'Peak Performance', 'Helly Hansen', 'BUFF', 'Salomon', 'Oakley', 'COMMENCAL',
      'DC Shoes', 'Rossignol', 'Smartwool', 'Rip Curl', 'La Sportiva', 'GORE-TEX',
      'Dynastar', 'Atomic', 'Nitro Snowboards', 'RockShox', 'Wagner Skis', 'SB3 Components',
      'Columbia', 'Thule', 'Faction Skis', 'Haglöfs', 'POC', 'YETI', 'Burton',
      'Cristóbal Colón Store', 'Loubsol', 'Obermeyer', 'Opinel', 'RideWrap', 'Rhythm Japan',
      'Shimano', 'Specialized'
    ],
    'Moda i complements': [
      'Zalando', 'Oysho', 'Kiehl’s', 'Alpina Watches', 'Swatch', 'Stanley'
    ],
    'Alimentació i begudes': [
      'Coca-Cola', 'Monster Energy', 'Corona', 'Nature Valley', 'San Miguel', 'Pabst Blue Ribbon',
      'White Claw', 'Don Julio', 'Celsius', 'Best Day Brewing', 'Aspen Vodka', 'Bonneval',
      'Rasta Alfajores', 'Lacasitos', 'El Tony Mate', 'Fresca', 'Royal Guard',
      'Cerveza Royal Guard', 'Sylranch Winery', 'Surfside', 'Ron Barceló', 'Jean Leon',
      'Veuve Clicquot', 'Casamigos', 'Tartuflanghe', 'Aragón Alimentos', 'ISHIYA', 'Pascual',
      'Red Bull', 'Rockstar Energy', 'SOMMOS', 'See Ya Later Ranch', 'The Green Mountain',
      'Vaca Nostra', 'Vacanal Coma 3'
    ],
    'Tecnologia i continguts digitals': [
      'GoPro', 'Insta360', 'HOVERAir', 'Samsung', 'Google Cloud', 'JBL', 'Thonet & Vander'
    ],
    'Telecomunicacions': ['Movistar', 'TELUS', 'Andorra Telecom'],
    'Finances i assegurances': [
      'Allianz', 'Visa', 'Reale Seguros', 'Reale', 'Ibercaja', 'Creand', 'Unicaja Banco', 'Santander'
    ],
    'Turisme i allotjament': [
      'Pullman Hotels', 'Hotel A Japan', 'RoomBoss', 'Vail Resorts',
      'Marriott Bonvoy', 'Epic Pass', 'Shiroi Koibito Park'
    ],
    'Immobiliari': ['VORARIU', 'Niseko Real Estate'],
    'Salut i benestar': [
      'ISDIN', 'Cantabria Labs', 'Heliocare', 'WHOOP'
    ],
    'Esdeveniments i entreteniment': [
      'Crankworx', 'Flaixbac', 'Belly Up Aspen', 'Xplore Alpes Festival', 'FIS', 'Vibra Clásica',
      'NASTC', 'Pickleball Japan Federation'
    ],
    'Energia i serveis': ['Holy Cross Energy', 'Iberdrola', 'TOA Road Corporation']
  };

  const normalize = value => String(value || '')
    .toLocaleLowerCase('ca')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const sectorByBrand = new Map();
  Object.entries(sectorBrands).forEach(([sector, names]) => {
    names.forEach(name => sectorByBrand.set(normalize(name), sector));
  });

  function sectorForBrand(name) {
    const key = normalize(name);
    if (sectorByBrand.has(key)) return sectorByBrand.get(key);
    for (const [brandKey, sector] of sectorByBrand.entries()) {
      if (key.length >= 7 && (key.includes(brandKey) || brandKey.includes(key))) return sector;
    }
    return 'Altres';
  }

  function sameBrand(a, b) {
    const x = normalize(a);
    const y = normalize(b);
    return x === y || (x.length >= 6 && y.length >= 6 && (x.includes(y) || y.includes(x)));
  }

  const viewFromUrl = () => ['station', 'brands', 'sectors', 'saved'].includes(new URLSearchParams(location.search).get('view'))
    ? new URLSearchParams(location.search).get('view') : 'station';
  let viewMode = viewFromUrl();
  let activeBrand = new URLSearchParams(location.search).get('brand') || '';
  let selectedBrand = '*';
  let brandSource = 'all';
  let selectedEvent = new URLSearchParams(location.search).get('event') || '*';
  let explorer;
  let brandExplorer;
  let bookmarks = readBookmarks();
  let navigation, rendering = false, activePieceId = "", routeMedia = 0;
  let sectorStationFilter, sectorBrandFilter, globalFormats;

  function readBookmarks() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value)
        ? value.filter(item => item && typeof item.id === 'string' && legacyCategories.includes(item.category))
          .map(item => ({ ...item, id: catalog.canonicalId(item.id) }))
          .filter((item, index, list) => list.findIndex(other => other.id === item.id) === index)
        : [];
    } catch (_) {
      return [];
    }
  }

  function writeBookmarks(value = bookmarks) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function sourceStation(piece) {
    return piece.sourceStation || piece.station;
  }

  function localImageUrl(value) {
    if (!value) return value;
    try {
      const path = new URL(value, location.href).pathname;
      const match = path.match(/\/OLAF_Publicitat_Media\/(posters|images)\/([^/]+)$/);
      if (!match) return value;
      const filename = decodeURIComponent(match[2]).replace(/\.[^.]+$/, '.webp');
      return './media/' + match[1] + '/' + filename;
    } catch (_) {
      return value;
    }
  }

  function localVideoUrl(value) {
    if (!value) return value;
    try {
      const path = new URL(value, location.href).pathname;
      const match = path.match(/\/OLAF_Publicitat_Media\/videos\/([^/]+)$/);
      if (!match) return value;
      return './media/videos/' + decodeURIComponent(match[1]);
    } catch (_) {
      return value;
    }
  }

  function instagramEmbedUrl(sourceUrl) {
    const match = String(sourceUrl || '').match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i);
    return match ? 'https://www.instagram.com/' + match[1] + '/' + match[2] + '/embed/captioned/' : null;
  }

  function brandForBookmark(piece) {
    return (piece.brands || []).map(sectorForBrand).sort()[0] || 'Altres';
  }

  function profileFor(id) {
    return DATA.profiles.find(profile => profile.id === id);
  }

  function itemIndex() {
    return new Map(catalog.pieces.flatMap(piece => piece.aliases.map(id => [id, piece])));
  }

  function updateSavedCount() {
    const count = document.getElementById('savedNavCount');
    count.textContent = new Intl.NumberFormat('ca-ES').format(bookmarks.length);
  }

  function addOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  }

  function refreshSponsorOptions() {
    const prior = selectedBrand;
    const brands = Array.from(new Set(catalog.pieces
      .filter(piece => piece.station === selected)
      .flatMap(piece => piece.brands || [])))
      .sort((a, b) => a.localeCompare(b, 'ca'));
    sponsorFilter.replaceChildren();
    addOption(sponsorFilter, '*', 'Totes les marques');
    brands.forEach(brand => addOption(sponsorFilter, brand, brand));
    selectedBrand = brands.some(brand => sameBrand(brand, prior)) ? prior : '*';
    sponsorFilter.value = brands.find(brand => sameBrand(brand, selectedBrand)) || '*';
  }

  function populateSectorSelect(select, includeAllLabel) {
    const previous = select.value || '*';
    const present = new Set(catalog.pieces.flatMap(piece => piece.brands || []).map(sectorForBrand));
    select.replaceChildren();
    addOption(select, '*', includeAllLabel);
    sectorOrder.filter(sector => present.has(sector)).forEach(sector => {
      const count = window.OLAF_BRAND_MODEL.uniquePublications(catalog.pieces.filter(piece => (piece.brands || []).some(brand => sectorForBrand(brand) === sector))).length;
      addOption(select, sector, sector + ' · ' + new Intl.NumberFormat('ca-ES').format(count));
    });
    select.value = Array.from(select.options).some(option => option.value === previous) ? previous : '*';
  }

  function populateSavedFilters() {
    const previousStation = savedStationFilter.value || '*';
    savedStationFilter.replaceChildren();
    addOption(savedStationFilter, '*', 'Totes les estacions');
    DATA.profiles.forEach(profile => addOption(savedStationFilter, profile.id, profile.name));
    savedStationFilter.value = Array.from(savedStationFilter.options).some(option => option.value === previousStation) ? previousStation : '*';

    populateSectorSelect(savedSectorFilter, 'Totes les categories');
    const previousCategory = savedCategoryFilter.value || '*';
    savedCategoryFilter.replaceChildren();
    addOption(savedCategoryFilter, '*', 'Totes les categories');
    categories.forEach(category => addOption(savedCategoryFilter, category, category));
    savedCategoryFilter.value = Array.from(savedCategoryFilter.options).some(option => option.value === previousCategory) ? previousCategory : '*';
  }

  function syncViewChrome() {
    const isStation = viewMode === 'station';
    document.body.dataset.view = viewMode;
    for (const [id, level] of [['storyTitle', isStation ? 'h3' : 'h2'], ['emptyTitle', isStation ? 'h3' : 'h2']]) { const old=document.getElementById(id); if(old.tagName.toLowerCase() !== level){ const next=document.createElement(level); next.id=id;next.className=old.className;next.textContent=old.textContent;old.replaceWith(next); } }
    document.querySelectorAll('#storyDetails h3.detail-label,#storyDetails h4.detail-label').forEach(old=>{ const level=isStation?'h4':'h3';if(old.tagName.toLowerCase()!==level){const next=document.createElement(level);next.className=old.className;next.textContent=old.textContent;old.replaceWith(next);} });
    document.getElementById('stationHeader').hidden = !isStation;
    document.getElementById('stationTools').hidden = !isStation;
    document.getElementById('stationFormatRow').hidden = !isStation;
    document.getElementById('sectorHeader').hidden = viewMode !== 'sectors';
    document.getElementById('savedHeader').hidden = viewMode !== 'saved';
    document.getElementById('savedFilters').hidden = viewMode !== 'saved';
    document.getElementById('stationViewButton').setAttribute('aria-current', String(viewMode === 'station' ? 'page' : 'false'));
    document.getElementById('brandViewButton').setAttribute('aria-current', String(viewMode === 'brands' ? 'page' : 'false'));
    document.getElementById('sectorViewButton').setAttribute('aria-current', String(viewMode === 'sectors' ? 'page' : 'false'));
    document.getElementById('savedViewButton').setAttribute('aria-current', String(viewMode === 'saved' ? 'page' : 'false'));
    document.dispatchEvent(new CustomEvent('olaf:viewchange', { detail: { mode: viewMode, station: selected, brand: activeBrand } }));
  }

  function renderWithItems(items, preserveFormatFilter) {
    mediaObserver?.disconnect();
    const originalPieces = DATA.pieces;
    const originalFilter = filter;
    DATA.pieces = items.map(piece => {
      const origin = sourceStation(piece);
      const copy = Object.assign({}, piece, { station: selected, sourceStation: origin });
      copy.image = localImageUrl(piece.image);
      copy.media = (piece.media || []).map(media => Object.assign({}, media, {
        image: localImageUrl(media.image),
        videoPath: localVideoUrl(media.videoPath)
      }));
      if (!piece.account) {
        if (copy.media.length === 1 && copy.media[0].mediaType === 'video') {
          copy.instagramEmbedUrl = copy.media[0].instagramEmbedUrl;
        }
      }
      if (viewMode !== 'station' && origin !== selected) {
        const profile = profileFor(origin);
        copy.title = (piece.relatedStations?.length > 1 ? 'Diverses estacions · ' : profile ? profile.name + ' · ' : '') + piece.title;
      }
      return copy;
    });
    if (!preserveFormatFilter) filter = 'all';
    if (activePieceId && DATA.pieces.some(piece => piece.id === activePieceId)) {
      memories.set(selected + ':' + filter, activePieceId);
      const piece = DATA.pieces.find(piece => piece.id === activePieceId);
      mediaMemories.set(activePieceId, Math.min(routeMedia, Math.max(0, piece.media.length - 1)));
    }
    baseRenderCarousel();
    DATA.pieces = originalPieces;
    filter = originalFilter;
  }

  function getSavedItems() {
    const index = itemIndex();
    const stationValue = savedStationFilter.value || '*';
    const sectorValue = savedSectorFilter.value || '*';
    const categoryValue = savedCategoryFilter.value || '*';
    return bookmarks.map(bookmark => {
      const piece = index.get(bookmark.id);
      return piece ? Object.assign({}, piece, { savedCategory: bookmark.category }) : null;
    }).filter(piece => piece &&
      (stationValue === '*' || sourceStation(piece) === stationValue) &&
      (sectorValue === '*' || (piece.brands || []).some(brand => sectorForBrand(brand) === sectorValue)) &&
      (categoryValue === '*' || piece.savedCategory === categoryValue));
  }

  function renderComposite() {
    const focused = document.activeElement;
    const focusId = focused?.id;
    const formatFocus = focused?.closest('.brand-format-filter') ? focused.dataset.format : null;
    rendering = true;
    try { renderCompositeContent(); }
    finally {
      rendering = false;
      if (navigation) updateNavigation();
      if (focused && !focused.isConnected) {
        const replacement = focusId ? document.getElementById(focusId) : formatFocus ? document.querySelector('.brand-format-filter [data-format="' + formatFocus + '"]') : null;
        if (replacement?.checkVisibility()) replacement.focus({ preventScroll: true });
      }
    }
  }

  function renderCompositeContent() {
    if (viewMode === 'station') refreshSponsorOptions();
    populateSectorSelect(sectorFilter, 'Totes les categories');
    populateSavedFilters();
    syncViewChrome();
    if (viewMode !== 'brands') brandExplorer.render({ enabled: false });

    if (viewMode === 'station') {
      const allItems = catalog.pieces.filter(piece => piece.station === selected &&
        (selectedBrand === '*' || piece.brands.some(brand => sameBrand(brand, selectedBrand))));
      const items = allItems.filter(piece => (brandSource === 'all' || piece.origins.some(origin => origin.type === brandSource)) &&
        (filter === 'all' || filter === 'story' && piece.kind === 'story' || filter === 'reel' && piece.format === 'Reel / vídeo' || filter === 'post' && piece.kind === 'post' && piece.format !== 'Reel / vídeo'))
        .map(piece => {
          const record = brandSource === 'brand' ? piece.sourceRecords.find(p => p.account) : null;
          return record ? { ...piece, ...record, id: piece.id, origins: piece.origins, brands: piece.brands } : piece;
        });
      const displayItems = selectedEvent === '*' ? [] : items.filter(piece => selectedEvent === 'all' ||
        (selectedEvent === 'other' ? !catalog.eventFor(piece) : catalog.matchesEvent(piece, selectedEvent)));
      renderWithItems(displayItems, true);
      const switcher = document.getElementById('brandSourceSwitch');
      switcher.hidden = false;
      document.getElementById('allSourcesButton').setAttribute('aria-pressed', String(brandSource === 'all'));
      document.getElementById('stationPostsButton').setAttribute('aria-pressed', String(brandSource === 'station'));
      const brandButton = document.getElementById('brandPostsButton');
      brandButton.setAttribute('aria-pressed', String(brandSource === 'brand'));
      brandButton.disabled = false;
      document.getElementById('brandSourceNote').hidden = false;
      document.getElementById('brandSourceNote').textContent = allItems.some(piece => piece.origins.some(o => o.type === 'brand'))
        ? 'Estació i marques, en una mateixa lectura. Les publicacions dels partners tenen un vincle documentat amb aquesta estació. Consulta la cobertura de cada compte a «Marques».'
        : 'Les publicacions de les marques es mostren quan tenen un vincle documentat amb aquesta estació. No disposar-ne encara no implica que no n’hagin publicat.';
      const feedCount = items.filter(p => p.kind === 'post').length;
      document.getElementById('stationCounts').textContent = feedCount + ' posts i Reels · ' + items.filter(p => p.kind === 'story').length + ' Stories' +
        (selectedBrand !== '*' ? ' · ' + selectedBrand : '');
      explorer.render({ enabled: true, station: selected, allItems, items, visibleItems: displayItems, event: selectedEvent, source: brandSource });
      if (selectedEvent === '*') {
        document.getElementById('viewer').hidden = true;
        document.getElementById('empty').hidden = true;
      } else if (!displayItems.length) {
        document.getElementById('emptyTitle').textContent = 'Cap peça documentada amb aquests filtres';
        document.getElementById('emptyText').textContent = brandSource === 'brand'
          ? 'No hi ha publicacions del compte de marca enllaçades amb aquesta col·lecció. Prova “Totes les fonts” per consultar les peces de l’estació.'
          : 'Canvia de marca, font o format per veure les altres peces de la col·lecció.';
        document.getElementById('emptyAction').hidden = true;
      }
      updateSavedCount();
      return;
    }

    document.getElementById('brandSourceSwitch').hidden = true;
    document.getElementById('brandSourceNote').hidden = true;
    explorer.render({ enabled: false });

    if (viewMode === 'brands') {
      const items = brandExplorer.render({ enabled: true, brandId: activeBrand, format: filter });
      renderWithItems(items, true);
      explorer.strip.hidden = !items.length;
      explorer.relationDetails.hidden = !items.length;
      if (!activeBrand || !brandDirectory.find(activeBrand)) {
        document.getElementById('viewer').hidden = true;
        document.getElementById('empty').hidden = true;
      } else if (!visible.length) {
        document.getElementById('emptyTitle').textContent = 'Cap peça vinculada recuperada amb aquests filtres';
        document.getElementById('emptyText').textContent = 'Prova un altre compte, estació o format. Consulta la cobertura de la recerca per saber què s’ha pogut recuperar.';
        document.getElementById('emptyAction').hidden = true;
      }
      updateSavedCount();
      return;
    }

    if (viewMode === 'sectors') {
      const sector = sectorFilter.value || '*';
      refreshSectorBrands();
      const items = sector === '*' ? [] : window.OLAF_BRAND_MODEL.withResortAssociations(catalog.pieces.filter(piece =>
        (piece.brands || []).some(brand => sectorForBrand(brand) === sector) &&
        (sectorStationFilter.value === '*' || piece.station === sectorStationFilter.value) &&
        (selectedBrand === '*' || piece.brands.some(brand => sameBrand(brand, selectedBrand)))));
      renderWithItems(items, true);
      if (sector === '*') { document.getElementById('viewer').hidden = true; document.getElementById('empty').hidden = true; }
      const stations = new Set(visible.flatMap(piece => piece.relatedStations || [sourceStation(piece)]));
      const label = sector === '*' ? 'Totes les categories' : sector;
      document.getElementById('sectorHeading').textContent = label === 'Totes les categories' ? 'Patrocinis per categoria' : label;
      document.getElementById('sectorIntro').textContent =
        new Intl.NumberFormat('ca-ES').format(visible.length) +
        ' peces publicitàries · ' + stations.size + ' estacions · mira quines marques i patrocinis apareixen en aquest àmbit.';
      if(sector === '*') document.getElementById('sectorIntro').textContent = 'Tria una categoria per comparar com es mostren les marques a les estacions.';
    } else {
      const items = getSavedItems();
      renderWithItems(items, true);
      document.getElementById('sectorIntro').textContent = '';
    }

    updateSavedCount();
    const empty = document.getElementById('empty');
    if (!visible.length && !(viewMode === 'sectors' && sectorFilter.value === '*')) {
      document.getElementById('emptyTitle').textContent = viewMode === 'saved'
        ? 'Encara no hi ha referències desades amb aquests filtres'
        : 'No hi ha peces documentades en aquesta categoria';
      document.getElementById('emptyText').textContent = viewMode === 'saved'
        ? 'Guarda una peça amb una categoria per construir la teva biblioteca de referències.'
        : 'Prova una altra categoria per veure els patrocinis documentats a les estacions.';
      document.getElementById('emptyAction').hidden = true;
    }
    if (!empty.hidden && viewMode === 'station' && selectedBrand !== '*') {
      document.getElementById('emptyTitle').textContent = brandSource === 'brand'
        ? 'No hi ha coincidències del compte de la marca'
        : 'No hi ha peces d’aquesta marca amb aquest format';
      document.getElementById('emptyText').textContent = brandSource === 'brand'
        ? 'No hi ha cap peça enllaçada del format seleccionat. Torna a “Totes les peces” o prova un altre format.'
        : 'Canvia de format o tria una altra marca patrocinadora.';
      document.getElementById('emptyAction').hidden = false;
    }
  }

  renderCarousel = renderComposite;

  chooseStation = function (id, fromHistory) {
    if (!profileFor(id)) return;
    remember(); selected = id; viewMode = 'station'; selectedBrand = '*'; brandSource = 'all'; selectedEvent = '*';
    filter = 'all'; activePieceId = ''; routeMedia = 0;
    closeStationMenu(false); syncFormatButtons();
    if (!fromHistory) writeViewUrl(true);
    renderComposite();
    document.getElementById('stationSelectorTrigger').focus({ preventScroll: true });
  };

  updateCurrent = function (index, force) {
    Array.from(carousel.children).slice(Math.max(0, index - 2), index + 3).forEach(slide => {
      const video = slide.querySelector('video'); if (video) hydrateVideo(video);
    });
    baseUpdateCurrent(index, force);
    const piece = visible[index];
    if (!piece) return;
    const saved = bookmarks.find(bookmark => bookmark.id === piece.id);
    const toggle = document.getElementById('bookmarkToggle');
    document.getElementById('bookmarkToggleLabel').textContent = saved ? 'Desada · canvia categoria' : 'Guardar';
    toggle.setAttribute('aria-pressed', String(!!saved));
    document.getElementById('bookmarkMeta').hidden = !saved;
    document.getElementById('bookmarkMeta').textContent = saved ? 'A la biblioteca · ' + saved.category : '';
    const origin = document.getElementById('brandPostOrigin');
    origin.hidden = !piece.account;
    origin.textContent = piece.account
      ? 'Compte @' + piece.account + ' · ' + (piece.accountFullName || piece.account) +
        (piece.accountVerified ? ' · verificat per Instagram' : ' · sense verificació blava') +
        (piece.publicationRelationLabel ? ' · ' + piece.publicationRelationLabel : '')
      : '';
    const related = relatedStationPiece(piece);
    document.getElementById('relatedActivationArea').hidden = !piece.account || !related;
    document.getElementById('relatedActivationButton').textContent = catalog.eventFor(piece)
      ? 'Veure una peça de l’estació d’aquesta col·lecció'
      : 'Veure una peça de l’estació amb aquesta marca';
    const activeSlide = carousel.children[current];
    document.getElementById('zoom').hidden = !!(activeSlide &&
      (activeSlide.querySelector('iframe') || activeSlide.dataset.videoUnavailable === 'true'));
    explorer?.setActive(piece);
    navigation?.setActive(piece);
    activePieceId = piece.id; routeMedia = mediaMemories.get(piece.id) || 0;
    if (!rendering && navigation) writeViewUrl(false);
    const activeSlideNode = carousel.children[index];
    if (activeSlideNode) {
      activeSlideNode.querySelectorAll('button,a').forEach(node => node.tabIndex = 0);
      const video = activeSlideNode.querySelector('video');
      if (video) video.setAttribute('aria-describedby', 'storyTitle explanation');
    }
  };

  updateMediaNavigation = function () {
    baseUpdateMediaNavigation();
    const currentPiece = visible[current];
    if (currentPiece && navigation && !rendering) { activePieceId = currentPiece.id; routeMedia = mediaMemories.get(currentPiece.id) || 0; writeViewUrl(false); }
    const media = visible[current] && mediaOf(visible[current]);
    if (media?.unavailableReason) document.getElementById('mediaType').textContent = 'Vídeo restringit · portada de referència';
    const activeSlide = carousel.children[current];
    document.getElementById('zoom').hidden = !!(activeSlide &&
      (activeSlide.querySelector('iframe') || activeSlide.dataset.videoUnavailable === 'true'));
  };

  renderSlideMedia = function (slide, piece, mediaIndex) {
    const media = piece.media && (piece.media[mediaIndex] || piece.media[0]);
    delete slide.dataset.videoUnavailable;
    if (media?.unavailableReason) {
      slide.replaceChildren(); slide.dataset.mediaIndex = String(mediaIndex); slide.dataset.videoUnavailable = 'true';
      const frame = document.createElement('div'); frame.className = 'video-recovery';
      const poster = document.createElement('img'); poster.src = media.image; poster.alt = piece.title + ' · portada de referència'; poster.loading = 'lazy';
      const link = document.createElement('a'); link.className = 'video-recovery-link'; link.href = piece.sourceUrl;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = media.unavailableReason + ' Obre la publicació a Instagram.';
      link.addEventListener('click', event => event.stopPropagation()); frame.append(poster, link); slide.append(frame); return;
    }
    if (media && media.mediaType === 'video' && (media.videoPath || media.videoRemote)) {
      const previous = slide.querySelector('video');
      if (previous) {
        previous.pause();
        previous.removeAttribute('src');
        previous.load();
      }
      slide.replaceChildren();
      slide.dataset.mediaIndex = String(mediaIndex);
      const candidates = Array.from(new Set([media.videoPath, media.videoRemote].filter(Boolean)));
      const video = document.createElement('video');
      video.controls = slide.classList.contains('active');
      video.playsInline = true;
      video.preload = 'none';
      video.dataset.poster = media.image || piece.image || '';
      video.tabIndex = slide.classList.contains('active') ? 0 : -1;
      video.setAttribute('aria-label', piece.title);
      video.dataset.candidate = '0';
      video.dataset.source = candidates[0];
      video.addEventListener('play', () => {
        if (!slide.classList.contains('active')) video.pause();
      });
      video.addEventListener('error', () => {
        const next = Number(video.dataset.candidate) + 1;
        if (next < candidates.length) {
          video.dataset.candidate = String(next);
          video.src = candidates[next];
          video.load();
          return;
        }

        const fallback = document.createElement('div');
        fallback.className = 'video-recovery';
        if (media.image || piece.image) {
          const poster = document.createElement('img');
          poster.src = media.image || piece.image;
          poster.alt = piece.title + ' · portada del vídeo';
          poster.draggable = false;
          fallback.append(poster);
        }
        const link = document.createElement('a');
        link.className = 'video-recovery-link';
        link.href = piece.kind === 'story' ? (piece.storyUrl || piece.sourceUrl) : piece.sourceUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Aquest vídeo no es pot reproduir aquí. Obre la peça original a Instagram.';
        link.addEventListener('click', event => event.stopPropagation());
        fallback.append(link);
        slide.dataset.videoUnavailable = 'true';
        slide.replaceChildren(fallback);
        updateMediaNavigation();
      }, { once: false });
      slide.append(video);
      if (slide.classList.contains('active') || !mediaObserver) hydrateVideo(video);
      else mediaObserver.observe(video);
      return;
    }
    if (media && media.mediaType === 'image' && (media.image || piece.image)) {
      baseRenderSlideMedia(slide, piece, mediaIndex);
      const image = slide.querySelector('img');
      if (image) {
        const open = document.createElement('button'); open.type = 'button'; open.className = 'image-open';
        open.setAttribute('aria-label', 'Ampliar ' + piece.title); open.tabIndex = slide.classList.contains('active') ? 0 : -1;
        image.width = media.width || 540; image.height = media.height || 960;
        image.replaceWith(open); open.append(image);
        open.addEventListener('click', event => { event.stopPropagation(); if (slide.classList.contains('active')) openZoom(); else go(Number(slide.dataset.index)); });
      }
      return;
    }
    if (media && media.instagramEmbedUrl) {
      slide.replaceChildren();
      slide.dataset.mediaIndex = String(mediaIndex);
      const frame = document.createElement('iframe');
      frame.src = media.instagramEmbedUrl;
      frame.title = piece.title + ' · publicació original d’Instagram';
      frame.loading = 'lazy';
      frame.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      slide.append(frame);
      return;
    }
    baseRenderSlideMedia(slide, piece, mediaIndex);
  };

  function syncFormatButtons() {
    ['all', 'post', 'reel', 'story'].forEach(kind => document.getElementById(kind + 'Filter').setAttribute('aria-pressed', String(kind === filter)));
    globalFormats?.querySelectorAll('[data-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === filter)));
  }

  function setMode(mode) { navigateTo({ mode, station: selected }); }

  function routeState() {
    return { mode: viewMode, station: selected, brand: activeBrand, event: selectedEvent,
      format: filter, sponsor: selectedBrand, source: brandSource,
      sector: viewMode === 'brands' ? brandExplorer?.sector || '*' : viewMode === 'saved' ? savedSectorFilter.value : sectorFilter.value,
      query: brandExplorer?.query || '', scope: brandExplorer?.scope || 'with', account: brandExplorer?.account || '*',
      resort: viewMode === 'brands' ? brandExplorer?.station || '*' : viewMode === 'saved' ? savedStationFilter.value : sectorStationFilter?.value || '*',
      category: savedCategoryFilter.value, piece: activePieceId, media: routeMedia };
  }

  function writeViewUrl(push) {
    if (!navigation) return;
    const url = window.OLAF_NAVIGATION.write(location.href, routeState());
    if (url.href !== location.href) try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (_) {}
  }

  function navigateTo(state) {
    const url = window.OLAF_NAVIGATION.write(location.href, window.OLAF_NAVIGATION.transition(routeState(), state));
    if (url.href !== location.href) history.pushState(null, '', url);
    restoreRoute(true);
  }

  function selectValue(select, value) { select.value = Array.from(select.options).some(option => option.value === value) ? value : '*'; }

  function restoreRoute(focus) {
    const state = window.OLAF_NAVIGATION.read(location.href, DATA.profiles.map(profile => profile.id));
    viewMode = state.mode; selected = state.station;
    activeBrand = brandDirectory.find(state.brand) ? state.brand : '';
    selectedEvent = ['*', 'all', 'other', ...catalog.eventsFor(selected).map(event => event.id)].includes(state.event) ? state.event : '*';
    selectedBrand = state.sponsor; brandSource = state.source; filter = state.format;
    activePieceId = catalog.canonicalId(state.piece); routeMedia = state.media;
    brandExplorer.query = state.query; brandExplorer.scope = state.scope; brandExplorer.station = state.resort;
    brandExplorer.sector = state.sector; brandExplorer.account = state.account;
    if (!brandExplorer.profiles.some(p => p.id === brandExplorer.station)) brandExplorer.station = '*';
    selectValue(brandExplorer.sectorSelect, brandExplorer.sector); brandExplorer.sector = brandExplorer.sectorSelect.value;
    populateSectorSelect(sectorFilter, 'Totes les categories'); populateSavedFilters();
    selectValue(sectorFilter, state.sector); selectValue(savedSectorFilter, state.sector);
    selectValue(savedStationFilter, state.resort); selectValue(savedCategoryFilter, state.category); selectValue(sectorStationFilter, state.resort);
    syncFormatButtons(); renderComposite();
    if (focus) requestAnimationFrame(() => navigation.focusView());
    writeViewUrl(false);
  }

  function changedContext(push = true) {
    activePieceId = ''; routeMedia = 0; syncFormatButtons(); writeViewUrl(push); renderComposite();
  }

  function refreshSectorBrands() {
    const brands = [...new Set(catalog.pieces.filter(piece => piece.brands.some(brand => sectorForBrand(brand) === sectorFilter.value) &&
      (sectorStationFilter.value === '*' || piece.station === sectorStationFilter.value)).flatMap(piece => piece.brands).filter(brand => sectorForBrand(brand) === sectorFilter.value))].sort((a,b) => a.localeCompare(b,'ca'));
    sectorBrandFilter.replaceChildren(); addOption(sectorBrandFilter, '*', 'Totes les marques'); brands.forEach(brand => addOption(sectorBrandFilter, brand, brand));
    selectedBrand = brands.includes(selectedBrand) ? selectedBrand : '*'; sectorBrandFilter.value = selectedBrand;
  }

  function updateNavigation() {
    const state = routeState();
    const eventName = selectedEvent === 'all' ? 'Totes les peces de marca' : selectedEvent === 'other' ? 'Altres peces de marca' : catalog.eventsFor(selected).find(event => event.id === selectedEvent)?.name;
    const filters = [];
    if (viewMode === 'station') { if(selectedBrand !== '*') filters.push(selectedBrand); if(brandSource !== 'all') filters.push(brandSource === 'brand' ? 'Publica la marca' : 'Publica l’estació'); }
    if (viewMode === 'brands') { if(brandExplorer.query && !activeBrand) filters.push('Cerca: ' + brandExplorer.query); if(brandExplorer.sector !== '*' && !activeBrand) filters.push(brandExplorer.sector); if(brandExplorer.station !== '*') filters.push(profileFor(brandExplorer.station)?.name || brandExplorer.station); if(brandExplorer.account !== '*') filters.push('@' + brandExplorer.account); if(brandExplorer.scope === 'all' && !activeBrand) filters.push('Totes les marques investigades'); }
    if (viewMode === 'sectors') { if(sectorStationFilter.value !== '*') filters.push(profileFor(sectorStationFilter.value)?.name); if(selectedBrand !== '*') filters.push(selectedBrand); }
    if (viewMode === 'saved') [savedStationFilter,savedSectorFilter,savedCategoryFilter].forEach(select => { if(select.value !== '*') filters.push(select.selectedOptions[0]?.textContent); });
    if (filter !== 'all') filters.push({post:'Fotos i carrusels',reel:'Reels / vídeos',story:'Stories'}[filter]);
    const hasContext = viewMode === 'station' ? selectedEvent !== '*' : viewMode === 'brands' ? !!activeBrand : viewMode === 'sectors' ? sectorFilter.value !== '*' : true;
    navigation.render({ state, items: hasContext ? visible : [], eventName, brandName: brandDirectory.find(activeBrand)?.name, filters });
    globalFormats.hidden = !(viewMode === 'sectors' && sectorFilter.value !== '*' || viewMode === 'saved');
    sectorStationFilter.closest('label').hidden = sectorBrandFilter.closest('label').hidden = sectorFilter.value === '*';
    document.body.dataset.detail = String(viewMode === 'brands' && !!activeBrand || viewMode === 'station' && selectedEvent !== '*');
    syncFormatButtons();
  }

  function selectBrand(id, reveal) {
    activeBrand = id;
    viewMode = 'brands'; filter = 'all'; activePieceId = ''; routeMedia = 0;
    writeViewUrl(true);
    renderComposite();
    if (reveal) requestAnimationFrame(() => brandExplorer.reveal());
  }

  document.getElementById('stationViewButton').addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setMode('station'); });
  document.getElementById('brandViewButton').addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setMode('brands'); });
  document.getElementById('sectorViewButton').addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setMode('sectors'); });
  document.getElementById('savedViewButton').addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); setMode('saved'); });

  sponsorFilter.addEventListener('change', () => {
    selectedBrand = sponsorFilter.value || '*';
    selectedEvent = '*';
    changedContext();
  });

  sectorFilter.addEventListener('change', () => { selectedBrand = '*'; changedContext(); });
  [savedStationFilter, savedSectorFilter, savedCategoryFilter].forEach(select =>
    select.addEventListener('change', () => changedContext()));

  document.getElementById('stationPostsButton').addEventListener('click', () => {
    brandSource = 'station';
    changedContext();
  });
  document.getElementById('brandPostsButton').addEventListener('click', () => {
    if (document.getElementById('brandPostsButton').disabled) return;
    brandSource = 'brand';
    changedContext();
  });

  function openBookmarkDialog() {
    const piece = visible[current];
    if (!piece) return;
    const saved = bookmarks.find(bookmark => bookmark.id === piece.id);
    bookmarkDialog.dataset.itemId = piece.id;
    bookmarkCategory.value = saved ? saved.category : '';
    document.getElementById('removeBookmark').hidden = !saved;
    document.getElementById('saveBookmark').disabled = !bookmarkCategory.value;
    document.getElementById('bookmarkDialogDescription').textContent = saved
      ? 'Canvia la categoria o treu aquesta peça de la biblioteca.'
      : 'Tria un tipus per trobar-la després a la biblioteca.';
    bookmarkDialog.showModal();
  }

  document.getElementById('bookmarkToggle').addEventListener('click', openBookmarkDialog);
  bookmarkCategory.addEventListener('change', () => {
    document.getElementById('saveBookmark').disabled = !bookmarkCategory.value;
  });
  document.getElementById('cancelBookmark').addEventListener('click', () => bookmarkDialog.close());
  document.getElementById('bookmarkForm').addEventListener('submit', event => {
    event.preventDefault();
    const id = bookmarkDialog.dataset.itemId;
    const category = bookmarkCategory.value;
    if (!id || !categories.includes(category)) return;
    const next = [...bookmarks.filter(bookmark => bookmark.id !== id), { id, category, savedAt: new Date().toISOString() }];
    if (!writeBookmarks(next)) {
      document.getElementById('bookmarkDialogDescription').textContent =
        'No s’ha pogut desar en aquest navegador. Revisa l’espai disponible i torna-ho a provar.';
      return;
    }
    bookmarks = next;
    bookmarkDialog.close();
    updateSavedCount();
    renderComposite();
    navigation.feedback('Referència desada a «' + category + '».');
  });

  document.getElementById('removeBookmark').addEventListener('click', () => {
    const id = bookmarkDialog.dataset.itemId;
    const removed = bookmarks.find(bookmark => bookmark.id === id);
    const next = bookmarks.filter(bookmark => bookmark.id !== id);
    if (!writeBookmarks(next)) {
      document.getElementById('bookmarkDialogDescription').textContent = 'No s’ha pogut actualitzar la biblioteca. La referència continua desada; torna-ho a provar.';
      return;
    }
    bookmarks = next;
    bookmarkDialog.close();
    updateSavedCount();
    renderComposite();
    navigation.feedback('Referència eliminada de les desades.', () => {
      const restored = [...bookmarks.filter(bookmark => bookmark.id !== id), removed];
      if (!writeBookmarks(restored)) { navigation.feedback('No s’ha pogut restaurar. Revisa l’emmagatzematge del navegador i torna-ho a provar.'); return; }
      bookmarks = restored; updateSavedCount(); renderComposite(); navigation.feedback('Referència restaurada.'); navigation.dismiss.focus();
    });
    if (!visible.length) navigation.undo.focus();
  });

  function relatedStationPiece(piece) {
    const eventId = catalog.matchesEvent(piece, selectedEvent) ? selectedEvent : catalog.eventFor(piece)?.id;
    if (eventId) return DATA.pieces.find(candidate => candidate.station === sourceStation(piece) && catalog.matchesEvent(candidate, eventId));
    return DATA.pieces.find(candidate => (piece.relatedPieceIds || []).includes(candidate.id));
  }

  function showRelatedActivation() {
    const brandPost = visible[current];
    if (!brandPost) return;
    const target = relatedStationPiece(brandPost);
    if (!target) return;
    selected = target.station;
    selectedBrand = target.brands.find(brand => sameBrand(brand, brandPost.brand)) || '*';
    brandSource = 'station';
    selectedEvent = catalog.matchesEvent(target, selectedEvent) ? selectedEvent : catalog.eventFor(target)?.id || 'other';
    viewMode = 'station';
    filter = 'all';
    writeViewUrl(true);
    renderComposite();
    requestAnimationFrame(() => {
      const index = visible.findIndex(piece => piece.id === target.id);
      if (index >= 0) go(index);
    });
  }

  document.getElementById('relatedActivationButton').addEventListener('click', showRelatedActivation);

  document.getElementById('emptyAction').addEventListener('click', () => {
    if (viewMode !== 'station') return;
    selectedBrand = '*';
    brandSource = 'all';
    selectedEvent = '*';
    writeEventUrl('*', false);
    filter = 'all';
    renderComposite();
  });

  function writeEventUrl(value, push) {
    const url = new URL(location.href);
    if (value === '*') url.searchParams.delete('event');
    else url.searchParams.set('event', value);
    try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (_) {}
  }

  function selectEvent(value, reveal) {
    selectedEvent = value;
    memories.delete(selected + ':' + filter);
    changedContext();
    if (reveal) requestAnimationFrame(() => explorer.reveal());
  }

  const allSourcesButton = document.createElement('button');
  allSourcesButton.id = 'allSourcesButton';
  allSourcesButton.type = 'button';
  allSourcesButton.textContent = 'Totes les fonts';
  allSourcesButton.addEventListener('click', () => { brandSource = 'all'; changedContext(); });
  document.getElementById('brandSourceSwitch').prepend(allSourcesButton);
  document.getElementById('stationPostsButton').textContent = 'Estació';
  document.getElementById('brandPostsButton').textContent = 'Marques';
  document.getElementById('brandSourceSwitch').setAttribute('aria-label', 'Compte que publica la peça');
  document.getElementById('brandSourceSwitch').setAttribute('role', 'group');
  explorer = new window.OLAFEventExplorer({
    catalog, imageUrl: localImageUrl, onSelect: selectEvent,
    onPiece: id => {
      const index = visible.findIndex(piece => piece.id === catalog.canonicalId(id));
      if (index < 0) return;
      go(index);
      document.getElementById('viewer').scrollIntoView({ behavior: isReduced() ? 'instant' : 'smooth', block: 'start' });
    }
  });
  window.addEventListener('popstate', () => restoreRoute(false));
  window.addEventListener('hashchange', () => { if(!['viewer','main','eventRolesTitle'].includes(location.hash.slice(1))) restoreRoute(false); });
  if (!['*', 'all', 'other', ...catalog.eventsFor(selected).map(event => event.id)].includes(selectedEvent)) selectedEvent = '*';
  brandExplorer = new window.OLAFBrandExplorer({
    directory: brandDirectory, profiles: DATA.profiles, sectorForBrand,
    onBrand: selectBrand,
    onFilter: kind => { if (filter === kind) return; filter = kind; changedContext(); },
    onUpdate: () => changedContext(),
    onDirectoryChange: () => { activePieceId = ''; writeViewUrl(false); updateNavigation(); },
    onBack: () => navigateTo({ ...routeState(), brand: '', account: '*', format: 'all', piece: '', media: 0 }),
    onStation: id => {
      filter = 'all'; chooseStation(id);
      document.getElementById('stationHeader').scrollIntoView({ behavior: isReduced() ? 'instant' : 'smooth', block: 'start' });
    }
  });
  window.OLAF_APP = {
    catalog, brandDirectory,
    getState: routeState,
    setMode, selectBrand
  };
  navigation = new window.OLAFNavigationUI({ profiles: DATA.profiles, catalog, sectorForBrand, onNavigate: navigateTo,
    onPiece: (id, reveal) => {
      const index = visible.findIndex(piece => piece.id === id); if(index < 0) return;
      go(index);
      if(reveal) { const title = document.getElementById('viewer'); title.tabIndex = -1; title.focus({preventScroll:true}); title.scrollIntoView({behavior:isReduced()?'instant':'smooth',block:'start'}); }
    },
    onReset: () => {
      filter = 'all'; selectedBrand = '*'; brandSource = 'all';
      if(viewMode === 'brands') { brandExplorer.account = '*'; brandExplorer.station = '*'; if(!activeBrand){ brandExplorer.query = ''; brandExplorer.sector = '*'; brandExplorer.scope = 'with'; } }
      if(viewMode === 'sectors') sectorStationFilter.value = '*';
      if(viewMode === 'saved') [savedStationFilter,savedSectorFilter,savedCategoryFilter].forEach(select => select.value = '*');
      changedContext(); navigation.focusView();
    }
  });
  const makeField = (name, id) => { const label=document.createElement('label');label.className='field'; const text=document.createElement('span');text.textContent=name;const select=document.createElement('select');select.id=id;label.append(text,select);document.querySelector('#sectorHeader .global-controls').append(label);return select; };
  sectorStationFilter = makeField('Estació', 'sectorStationFilter'); addOption(sectorStationFilter,'*','Totes les estacions'); DATA.profiles.forEach(profile=>addOption(sectorStationFilter,profile.id,profile.name));
  sectorBrandFilter = makeField('Marca', 'sectorBrandFilter'); addOption(sectorBrandFilter,'*','Totes les marques');
  sectorStationFilter.addEventListener('change',()=>{selectedBrand='*';changedContext();});sectorBrandFilter.addEventListener('change',()=>{selectedBrand=sectorBrandFilter.value;changedContext();});
  globalFormats = document.createElement('div'); globalFormats.className='filter global-format-filter'; globalFormats.id='globalFormatFilter';globalFormats.setAttribute('role','group');globalFormats.setAttribute('aria-label','Format de les peces');
  for(const [kind,label] of [['all','Totes les peces'],['post','Fotos / carrusels'],['reel','Reels / vídeos'],['story','Stories']]){const button=document.createElement('button');button.type='button';button.dataset.format=kind;button.textContent=label;button.addEventListener('click',()=>{if(filter===kind)return;filter=kind;changedContext();});globalFormats.append(button);} navigation.index.before(globalFormats);
  chooseFilter = function(value){ if(value===filter)return; remember();filter=value;changedContext(); };
  const sourceSwitch=document.getElementById('brandSourceSwitch'),sourceField=document.createElement('div'),sourceLabel=document.createElement('span');sourceField.className='field source-field';sourceLabel.id='sourceFieldLabel';sourceLabel.textContent='Qui publica';sourceSwitch.replaceWith(sourceField);sourceField.append(sourceLabel,sourceSwitch);sourceSwitch.setAttribute('aria-labelledby','sourceFieldLabel');
  document.getElementById('postFilter').textContent='Fotos / carrusels';
  updateSavedCount();
  restoreRoute(false);
})();
