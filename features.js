(function () {
  'use strict';

  const baseRenderCarousel = renderCarousel;
  const baseUpdateCurrent = updateCurrent;
  const baseUpdateMediaNavigation = updateMediaNavigation;
  const baseRenderSlideMedia = renderSlideMedia;
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

  function writeBookmarks() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
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

    populateSectorSelect(savedSectorFilter, 'Tots els sectors');
    const previousCategory = savedCategoryFilter.value || '*';
    savedCategoryFilter.replaceChildren();
    addOption(savedCategoryFilter, '*', 'Totes les categories');
    categories.forEach(category => addOption(savedCategoryFilter, category, category));
    savedCategoryFilter.value = Array.from(savedCategoryFilter.options).some(option => option.value === previousCategory) ? previousCategory : '*';
  }

  function syncViewChrome() {
    const isStation = viewMode === 'station';
    document.body.dataset.view = viewMode;
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
    document.getElementById('formatSummary').hidden = !isStation;
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
    refreshSponsorOptions();
    populateSectorSelect(sectorFilter, 'Tots els sectors');
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
        ? 'Estació i marques, en una mateixa lectura. Les publicacions dels partners tenen un vincle documentat amb aquesta estació. Consulta la cobertura de cada compte a «Comptes de marca».'
        : 'Els comptes de marca es mostren quan hi ha una publicació documentada relacionada explícitament amb aquesta estació. No disposar-ne encara no implica que no n’hagin publicat.';
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
      const items = window.OLAF_BRAND_MODEL.withResortAssociations(catalog.pieces.filter(piece =>
        sector === '*' || (piece.brands || []).some(brand => sectorForBrand(brand) === sector)));
      renderWithItems(items, false);
      const stations = new Set(visible.flatMap(piece => piece.relatedStations || [sourceStation(piece)]));
      const label = sector === '*' ? 'Tots els sectors' : sector;
      document.getElementById('sectorHeading').textContent = label === 'Tots els sectors' ? 'Patrocinis per sector' : label;
      document.getElementById('sectorIntro').textContent =
        new Intl.NumberFormat('ca-ES').format(visible.length) +
        ' peces publicitàries · ' + stations.size + ' estacions · mira quines marques i activacions apareixen en aquest àmbit.';
    } else {
      const items = getSavedItems();
      renderWithItems(items, false);
      document.getElementById('sectorIntro').textContent = '';
    }

    updateSavedCount();
    const empty = document.getElementById('empty');
    if (!visible.length) {
      document.getElementById('emptyTitle').textContent = viewMode === 'saved'
        ? 'Encara no hi ha referències desades amb aquests filtres'
        : 'No hi ha peces documentades en aquest sector';
      document.getElementById('emptyText').textContent = viewMode === 'saved'
        ? 'Guarda una peça amb una categoria per construir la teva biblioteca de referències.'
        : 'Prova un altre sector per veure les activacions documentades a les estacions.';
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

  const baseChooseStation = chooseStation;
  chooseStation = function (id, fromHistory) {
    if (!profileFor(id)) return;
    if (!fromHistory) {
      viewMode = 'station';
      selectedBrand = '*';
      brandSource = 'all';
      selectedEvent = '*';
      const url = new URL(location.href);
      ['view', 'brand', 'event'].forEach(key => url.searchParams.delete(key));
      url.hash = id;
      if (url.href !== location.href) history.pushState(null, '', url);
    } else {
      selectedEvent = new URLSearchParams(location.search).get('event') || '*';
    }
    if (id === selected) {
      closeStationMenu(false);
      renderComposite();
      return;
    }
    return baseChooseStation(id, true);
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
  };

  updateMediaNavigation = function () {
    baseUpdateMediaNavigation();
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

  function setMode(mode) {
    viewMode = mode;
    filter = 'all';
    ['all', 'post', 'reel', 'story'].forEach(kind => {
      document.getElementById(kind + 'Filter').setAttribute('aria-pressed', String(kind === 'all'));
    });
    if (mode === 'station') {
      selectedBrand = '*';
      brandSource = 'all';
      selectedEvent = '*';
    }
    writeViewUrl(true);
    renderComposite();
  }

  function writeViewUrl(push) {
    const url = new URL(location.href);
    if (viewMode === 'station') url.searchParams.delete('view');
    else url.searchParams.set('view', viewMode);
    if (viewMode !== 'station' || selectedEvent === '*') url.searchParams.delete('event');
    else url.searchParams.set('event', selectedEvent);
    if (viewMode !== 'station') url.hash = '';
    else url.hash = selected;
    if (viewMode === 'brands' && activeBrand) url.searchParams.set('brand', activeBrand);
    else url.searchParams.delete('brand');
    try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (_) {}
  }

  function selectBrand(id, reveal) {
    activeBrand = id;
    viewMode = 'brands'; filter = 'all';
    writeViewUrl(true);
    renderComposite();
    if (reveal) requestAnimationFrame(() => brandExplorer.reveal());
  }

  document.getElementById('stationViewButton').addEventListener('click', () => setMode('station'));
  document.getElementById('brandViewButton').addEventListener('click', () => setMode('brands'));
  document.getElementById('sectorViewButton').addEventListener('click', () => setMode('sectors'));
  document.getElementById('savedViewButton').addEventListener('click', () => setMode('saved'));

  sponsorFilter.addEventListener('change', () => {
    selectedBrand = sponsorFilter.value || '*';
    selectedEvent = '*';
    writeEventUrl('*', false);
    renderComposite();
  });

  sectorFilter.addEventListener('change', () => renderComposite());
  [savedStationFilter, savedSectorFilter, savedCategoryFilter].forEach(select =>
    select.addEventListener('change', () => renderComposite()));

  document.getElementById('stationPostsButton').addEventListener('click', () => {
    brandSource = 'station';
    renderComposite();
  });
  document.getElementById('brandPostsButton').addEventListener('click', () => {
    if (document.getElementById('brandPostsButton').disabled) return;
    brandSource = 'brand';
    renderComposite();
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
    bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    bookmarks.push({ id, category, savedAt: new Date().toISOString() });
    if (!writeBookmarks()) {
      document.getElementById('bookmarkDialogDescription').textContent =
        'No s’ha pogut desar en aquest navegador. Revisa l’espai disponible i torna-ho a provar.';
      return;
    }
    bookmarkDialog.close();
    updateSavedCount();
    renderComposite();
  });

  document.getElementById('removeBookmark').addEventListener('click', () => {
    const id = bookmarkDialog.dataset.itemId;
    bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    writeBookmarks();
    bookmarkDialog.close();
    updateSavedCount();
    renderComposite();
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
    writeEventUrl(value, true);
    renderComposite();
    if (reveal) requestAnimationFrame(() => explorer.reveal());
  }

  const allSourcesButton = document.createElement('button');
  allSourcesButton.id = 'allSourcesButton';
  allSourcesButton.type = 'button';
  allSourcesButton.textContent = 'Totes les fonts';
  allSourcesButton.addEventListener('click', () => { brandSource = 'all'; renderComposite(); });
  document.getElementById('brandSourceSwitch').prepend(allSourcesButton);
  document.getElementById('stationPostsButton').textContent = 'Estació';
  document.getElementById('brandPostsButton').textContent = 'Marques';
  document.getElementById('brandSourceSwitch').setAttribute('aria-label', 'Compte que publica la peça');
  explorer = new window.OLAFEventExplorer({
    catalog, imageUrl: localImageUrl, onSelect: selectEvent,
    onPiece: id => {
      const index = visible.findIndex(piece => piece.id === catalog.canonicalId(id));
      if (index < 0) return;
      go(index);
      document.getElementById('viewer').scrollIntoView({ behavior: isReduced() ? 'instant' : 'smooth', block: 'start' });
    }
  });
  window.addEventListener('popstate', () => {
    viewMode = viewFromUrl();
    activeBrand = new URLSearchParams(location.search).get('brand') || '';
    selectedEvent = new URLSearchParams(location.search).get('event') || '*';
    renderComposite();
  });
  if (!['*', 'all', 'other', ...catalog.eventsFor(selected).map(event => event.id)].includes(selectedEvent)) selectedEvent = '*';
  const stationPieces = DATA.pieces;
  DATA.pieces = window.OLAF_BRAND_MODEL.uniquePublications(catalog.pieces);
  renderFormatSummary();
  DATA.pieces = stationPieces;
  document.querySelector('.format-summary-kicker').textContent = 'Visió conjunta · totes les fonts';
  brandExplorer = new window.OLAFBrandExplorer({
    directory: brandDirectory, profiles: DATA.profiles, sectorForBrand,
    onBrand: selectBrand,
    onFilter: kind => { filter = kind; renderComposite(); },
    onUpdate: renderComposite,
    onStation: id => {
      filter = 'all'; chooseStation(id);
      document.getElementById('stationHeader').scrollIntoView({ behavior: isReduced() ? 'instant' : 'smooth', block: 'start' });
    }
  });
  window.OLAF_APP = {
    catalog, brandDirectory,
    getState: () => ({ mode: viewMode, station: selected, brand: activeBrand, format: filter }),
    setMode, selectBrand
  };
  updateSavedCount();
  renderComposite();
})();
