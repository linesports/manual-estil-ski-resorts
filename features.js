(function () {
  'use strict';

  const baseRenderCarousel = renderCarousel;
  const baseUpdateCurrent = updateCurrent;
  const baseUpdateMediaNavigation = updateMediaNavigation;
  const baseRenderSlideMedia = renderSlideMedia;
  const sponsorFilter = document.getElementById('sponsorFilter');
  const sectorFilter = document.getElementById('sectorFilter');
  const savedStationFilter = document.getElementById('savedStationFilter');
  const savedSectorFilter = document.getElementById('savedSectorFilter');
  const savedCategoryFilter = document.getElementById('savedCategoryFilter');
  const bookmarkDialog = document.getElementById('bookmarkDialog');
  const bookmarkCategory = document.getElementById('bookmarkCategory');
  const categories = ['Sampling', 'Activació de marca', 'Branding', 'Naming'];
  const legacyCategories = [...categories, 'Altres'];
  const brandPosts = Array.isArray(window.BRAND_INSTAGRAM_POSTS) ? window.BRAND_INSTAGRAM_POSTS : [];
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
      'Vaca Nostra'
    ],
    'Tecnologia i continguts digitals': [
      'GoPro', 'Insta360', 'HOVERAir', 'Samsung', 'Google Cloud', 'JBL', 'Thonet & Vander'
    ],
    'Telecomunicacions': ['Movistar', 'TELUS', 'Andorra Telecom'],
    'Finances i assegurances': [
      'Allianz', 'Visa', 'Reale Seguros', 'Reale', 'Ibercaja', 'Creand', 'Unicaja Banco', 'Santander'
    ],
    'Turisme i allotjament': [
      'Pullman Hotels', 'Hotel A Japan', 'Niseko Real Estate', 'RoomBoss', 'Vail Resorts',
      'Marriott Bonvoy', 'Epic Pass', 'Shiroi Koibito Park'
    ],
    'Salut i benestar': [
      'ISDIN', 'Cantabria Labs', 'Heliocare', 'WHOOP'
    ],
    'Esdeveniments i entreteniment': [
      'Crankworx', 'Flaixbac', 'Belly Up Aspen', 'Xplore Alpes Festival', 'FIS', 'Vibra Clásica',
      'NASTC', 'Pickleball Japan Federation'
    ],
    'Energia i serveis': ['Holy Cross Energy', 'Iberdrola']
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

  let viewMode = 'station';
  let selectedBrand = '*';
  let brandSource = 'station';
  let bookmarks = readBookmarks();

  function readBookmarks() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value)
        ? value.filter(item => item && typeof item.id === 'string' && legacyCategories.includes(item.category))
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
    return new Map([...DATA.pieces, ...brandPosts].map(piece => [piece.id, piece]));
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
    const brands = Array.from(new Set(DATA.pieces
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
    const present = new Set(DATA.pieces.flatMap(piece => piece.brands || []).map(sectorForBrand));
    select.replaceChildren();
    addOption(select, '*', includeAllLabel);
    sectorOrder.filter(sector => present.has(sector)).forEach(sector => {
      const count = DATA.pieces.filter(piece => (piece.brands || []).some(brand => sectorForBrand(brand) === sector)).length;
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
    document.getElementById('sectorHeader').hidden = viewMode !== 'sectors';
    document.getElementById('savedHeader').hidden = viewMode !== 'saved';
    document.getElementById('savedFilters').hidden = viewMode !== 'saved';
    document.getElementById('stationViewButton').setAttribute('aria-current', String(viewMode === 'station' ? 'page' : 'false'));
    document.getElementById('sectorViewButton').setAttribute('aria-current', String(viewMode === 'sectors' ? 'page' : 'false'));
    document.getElementById('savedViewButton').setAttribute('aria-current', String(viewMode === 'saved' ? 'page' : 'false'));
    document.getElementById('formatSummary').hidden = !isStation;
  }

  function renderWithItems(items, preserveFormatFilter) {
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
        copy.title = (profile ? profile.name + ' · ' : '') + piece.title;
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

    if (viewMode === 'station') {
      let items;
      if (brandSource === 'brand' && selectedBrand !== '*') {
        items = brandPosts.filter(piece =>
          piece.station === selected &&
          (piece.brands || []).some(brand => sameBrand(brand, selectedBrand)));
      } else {
        items = DATA.pieces.filter(piece =>
          piece.station === selected &&
          (selectedBrand === '*' || (piece.brands || []).some(brand => sameBrand(brand, selectedBrand))));
      }
      renderWithItems(items, true);
      const stationBrandPosts = brandPosts.filter(piece =>
        piece.station === selected && (piece.brands || []).some(brand => sameBrand(brand, selectedBrand)));
      const switcher = document.getElementById('brandSourceSwitch');
      switcher.hidden = selectedBrand === '*';
      document.getElementById('stationPostsButton').setAttribute('aria-pressed', String(brandSource === 'station'));
      const brandButton = document.getElementById('brandPostsButton');
      brandButton.setAttribute('aria-pressed', String(brandSource === 'brand'));
      brandButton.disabled = stationBrandPosts.length === 0;
      document.getElementById('brandSourceNote').hidden = selectedBrand === '*';
      const expandedReview = stationBrandPosts.find(piece => piece.accountReviewCountInWindow);
      document.getElementById('brandSourceNote').textContent = stationBrandPosts.length
        ? expandedReview
          ? 'Mostra ampliada de @' + expandedReview.account + ': ' +
            new Intl.NumberFormat('ca-ES').format(expandedReview.accountReviewCountInWindow) +
            ' publicacions dins la temporada; es mostren les que citen l’estació.'
          : 'Revisió de fins a 15 publicacions recents del compte; només s’enllacen les que anomenen explícitament l’estació i tenen una peça de patrocini relacionada.'
        : 'Encara no hi ha cap publicació de la marca enllaçada amb aquesta estació. Això no permet concloure que no n’hi hagi; la cobertura varia segons el compte.';
      if (selectedBrand !== '*') {
        const postsCount = visible.filter(piece => piece.kind === 'post').length;
        const storyCount = visible.filter(piece => piece.kind === 'story').length;
        const number = new Intl.NumberFormat('ca-ES');
        document.getElementById('stationCounts').textContent = brandSource === 'brand'
          ? number.format(visible.length) + ' ' + (visible.length === 1 ? 'publicació' : 'publicacions') +
            ' del compte @' + (stationBrandPosts[0] ? stationBrandPosts[0].account : '')
          : number.format(visible.length) + ' ' + (visible.length === 1 ? 'peça' : 'peces') + ' de ' + selectedBrand +
            ' · ' + number.format(postsCount) + ' ' + (postsCount === 1 ? 'post' : 'posts') +
            ' · ' + number.format(storyCount) + ' ' + (storyCount === 1 ? 'Story' : 'Stories');
      }
      updateSavedCount();
      return;
    }

    document.getElementById('brandSourceSwitch').hidden = true;
    document.getElementById('brandSourceNote').hidden = true;

    if (viewMode === 'sectors') {
      const sector = sectorFilter.value || '*';
      const items = DATA.pieces.filter(piece =>
        sector === '*' || (piece.brands || []).some(brand => sectorForBrand(brand) === sector));
      renderWithItems(items, false);
      const stations = new Set(visible.map(piece => sourceStation(piece)));
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
    if (id !== selected) {
      selectedBrand = '*';
      brandSource = 'station';
    }
    return baseChooseStation(id, fromHistory);
  };

  updateCurrent = function (index, force) {
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
    document.getElementById('relatedActivationArea').hidden = !(piece.relatedPieceIds && piece.relatedPieceIds.length);
    const activeSlide = carousel.children[current];
    document.getElementById('zoom').hidden = !!(activeSlide &&
      (activeSlide.querySelector('iframe') || activeSlide.dataset.videoUnavailable === 'true'));
  };

  updateMediaNavigation = function () {
    baseUpdateMediaNavigation();
    const activeSlide = carousel.children[current];
    document.getElementById('zoom').hidden = !!(activeSlide &&
      (activeSlide.querySelector('iframe') || activeSlide.dataset.videoUnavailable === 'true'));
  };

  renderSlideMedia = function (slide, piece, mediaIndex) {
    const media = piece.media && (piece.media[mediaIndex] || piece.media[0]);
    delete slide.dataset.videoUnavailable;
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
      video.poster = media.image || piece.image || '';
      video.tabIndex = slide.classList.contains('active') ? 0 : -1;
      video.setAttribute('aria-label', piece.title);
      video.dataset.candidate = '0';
      video.src = candidates[0];
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
      brandSource = 'station';
    }
    renderComposite();
  }

  document.getElementById('stationViewButton').addEventListener('click', () => setMode('station'));
  document.getElementById('sectorViewButton').addEventListener('click', () => setMode('sectors'));
  document.getElementById('savedViewButton').addEventListener('click', () => setMode('saved'));

  sponsorFilter.addEventListener('change', () => {
    selectedBrand = sponsorFilter.value || '*';
    brandSource = 'station';
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

  function showRelatedActivation() {
    const brandPost = visible[current];
    if (!brandPost || !brandPost.relatedPieceIds || !brandPost.relatedPieceIds.length) return;
    const target = DATA.pieces.find(piece => piece.id === brandPost.relatedPieceIds[0]);
    if (!target) return;
    selected = target.station;
    selectedBrand = target.brands.find(brand => sameBrand(brand, brandPost.brand)) || target.brands[0] || '*';
    brandSource = 'station';
    viewMode = 'station';
    filter = 'all';
    if (location.hash !== '#' + selected) {
      try { history.pushState(null, '', '#' + selected); } catch (_) {}
    }
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
    brandSource = 'station';
    filter = 'all';
    renderComposite();
  });

  updateSavedCount();
  renderComposite();
})();
