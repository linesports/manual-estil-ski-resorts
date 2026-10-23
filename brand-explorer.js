(function () {
  'use strict';
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const option = (select, value, label) => {
    const node = el('option', '', label); node.value = value; select.append(node);
  };
  const arrow = () => {
    const span = el('span', 'brand-row-arrow');
    span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
    return span;
  };
  const coverageText = account => {
    const status = account.coverage?.status;
    return status === 'annual_boundary' ? 'Finestra anual recorreguda'
      : status === 'public_exhausted' ? 'Feed públic recorregut'
      : status === 'partial_limit' ? 'Recollida parcial'
      : status === 'restricted' ? 'Perfil restringit'
      : status === 'identity_mismatch' ? 'Identitat no confirmada'
      : status === 'not_found' ? 'Compte no localitzat'
      : status === 'unavailable' ? 'Contingut no recuperat'
      : 'Cobertura pendent de completar';
  };

  window.OLAFBrandExplorer = class {
    constructor({ directory, profiles, sectorForBrand, onBrand, onFilter, onUpdate, onStation, onBack, onDirectoryChange }) {
      Object.assign(this, { directory, profiles, sectorForBrand, onBrand, onFilter, onUpdate, onStation, onBack, onDirectoryChange });
      this.query = ''; this.station = '*'; this.sector = '*'; this.scope = 'with'; this.account = '*'; this.expanded = false;
      this.root = el('section', 'brand-surface'); this.root.id = 'brandSurface'; this.root.hidden = true;
      const intro = el('div', 'brand-introduction'); this.intro = intro;
      const title = el('h1', '', 'Comptes de marca'); title.id = 'brandDirectoryTitle'; title.tabIndex = -1;
      intro.append(title, el('p', '', 'Publicacions dels patrocinadors vinculades a les estacions.'));
      const toolbar = el('div', 'brand-search-toolbar');
      const searchLabel = el('label', 'brand-search'); searchLabel.append(el('span', '', 'Cerca una marca o un compte'));
      this.search = el('input'); this.search.type = 'search'; this.search.placeholder = 'Ex.: GoPro, Movistar…'; this.search.name = 'q'; this.search.autocomplete = 'off'; this.search.spellcheck = false; this.search.id = 'brandSearch';
      searchLabel.append(this.search); toolbar.append(searchLabel);
      this.sectorSelect = this.field(toolbar, 'Sector', 'brandSectorFilter'); option(this.sectorSelect, '*', 'Tots els sectors');
      [...new Set(directory.brands.map(brand => sectorForBrand(brand.aliases[0])))].sort((a, b) => a.localeCompare(b, 'ca')).forEach(name => option(this.sectorSelect, name, name));
      this.stationSelect = this.field(toolbar, 'Estació', 'brandStationFilter'); option(this.stationSelect, '*', 'Totes les estacions');
      profiles.forEach(profile => option(this.stationSelect, profile.id, profile.name));
      this.scopeSelect = this.field(toolbar, 'Mostrar', 'brandScopeFilter');
      option(this.scopeSelect, 'with', 'Amb peces vinculades'); option(this.scopeSelect, 'all', 'Totes les marques investigades');
      this.resultNote = el('p', 'brand-results-note'); this.resultNote.setAttribute('aria-live', 'polite');
      this.list = el('div', 'brand-directory'); this.list.id = 'brandDirectory';
      this.more = el('button', 'brand-directory-more', 'Veure més marques'); this.more.type = 'button';
      this.more.addEventListener('click', () => { this.expanded = !this.expanded; this.renderRows(); if(this.expanded) this.list.children[5]?.focus(); });
      this.detail = el('section', 'brand-detail'); this.detail.id = 'brandDetail'; this.detail.hidden = true;
      this.directoryArea = el('div', 'brand-directory-area'); this.directoryArea.append(toolbar, this.resultNote, this.list, this.more); this.root.append(intro, this.directoryArea, this.detail);
      document.getElementById('stationOverview').before(this.root);
      this.search.addEventListener('input', () => { this.query = this.search.value; this.expanded = false; this.renderRows(); this.onDirectoryChange?.(); });
      this.sectorSelect.addEventListener('change', () => { this.sector = this.sectorSelect.value; this.expanded = false; onUpdate(); });
      this.stationSelect.addEventListener('change', () => { this.station = this.stationSelect.value; this.expanded = false; onUpdate(); });
      this.scopeSelect.addEventListener('change', () => { this.scope = this.scopeSelect.value; this.expanded = false; this.onUpdate(); });
    }

    field(parent, name, id) {
      const label = el('label', 'field'); label.append(el('span', '', name));
      const select = el('select'); select.id = id; select.setAttribute('aria-label', name); label.append(select); parent.append(label); return select;
    }

    profile(id) { return this.profiles.find(p => p.id === id); }

    filteredBrands() {
      const query = window.OLAF_BRAND_MODEL.normalize(this.query);
      return this.directory.brands.filter(brand =>
        (this.scope === 'all' || brand.items.length) &&
        (this.station === '*' || brand.stationIds.includes(this.station)) &&
        (this.sector === '*' || this.sectorForBrand(brand.aliases[0]) === this.sector) &&
        (!query || window.OLAF_BRAND_MODEL.normalize([brand.name, ...brand.accounts.map(a => a.username), ...brand.stationIds.map(id => this.profile(id)?.name)].join(' ')).includes(query)));
    }

    renderRows() {
      const brands = this.filteredBrands(); this.list.replaceChildren(); if(this.search.value !== this.query) this.search.value = this.query; this.sectorSelect.value = this.sector; this.stationSelect.value = this.station; this.scopeSelect.value = this.scope;
      this.resultNote.textContent = brands.length + ' marques' + (this.scope === 'with' ? ' amb publicacions vinculades a les estacions' : ' · la disponibilitat varia segons el compte');
      (this.expanded ? brands : brands.slice(0, 5)).forEach(brand => {
        const row = el('a', 'brand-directory-row'); row.dataset.brandId = brand.id;
        row.href = window.OLAF_NAVIGATION.write(location.href, { ...window.OLAF_NAVIGATION.read(location.href), mode: 'brands', brand: brand.id, account: '*', piece: '', media: 0 }).href;
        const avatar = el('span', 'brand-avatar');
        const image = brand.accounts.find(account => account.avatar)?.avatar;
        if (image) { const img = el('img'); img.width = 44; img.height = 36; img.src = image; img.alt = ''; img.loading = 'lazy'; img.addEventListener('error', () => img.hidden = true, { once: true }); avatar.append(img); }
        const identity = el('span', 'brand-row-identity'); identity.append(el('strong', '', brand.name), el('span', '', this.sectorForBrand(brand.aliases[0])));
        const accounts = el('span', 'brand-row-accounts', brand.accounts.filter(a => a.identityStatus === 'confirmed').slice(0, 2).map(a => '@' + a.username).join(' · ') || 'Compte pendent de verificar');
        const stations = el('span', 'brand-row-stations', brand.stationIds.slice(0, 3).map(id => this.profile(id)?.name || id).join(' · ') + (brand.stationIds.length > 3 ? ' +' + (brand.stationIds.length - 3) : ''));
        const count = el('span', 'brand-row-count', brand.publicationCount ? brand.publicationCount + ' ' + (brand.publicationCount === 1 ? 'publicació' : 'publicacions') : 'Sense peces recuperades');
        row.append(avatar, identity, accounts, stations, count, arrow());
        row.addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); this.account = '*'; this.onBrand(brand.id, true); }); this.list.append(row);
      });
      if (!brands.length) this.list.append(el('p', 'brand-no-results', 'Cap marca coincideix amb aquesta cerca. Prova un altre nom, sector o estació.'));
      this.more.hidden = brands.length <= 5;
      this.more.textContent = this.expanded ? 'Mostrar menys marques' : 'Veure les ' + (brands.length - 5) + ' marques restants';
      this.more.setAttribute('aria-expanded', String(this.expanded));
    }

    itemsFor(brand) {
      if (!brand) return [];
      const items = brand.items.filter(piece => (this.station === '*' || piece.station === this.station) &&
        (this.account === '*' || piece.origins?.some(origin => origin.type === 'brand' && origin.account === this.account)))
        .map(piece => {
          const record = (piece.sourceRecords || [piece]).find(record => record.account &&
            (this.account === '*' || record.account === this.account) &&
            window.OLAF_BRAND_MODEL.keyFor(record.brand) === brand.id);
          return record ? { ...piece, ...record, id: piece.id, origins: piece.origins, aliases: piece.aliases, sourceRecords: piece.sourceRecords } : piece;
        });
      return window.OLAF_BRAND_MODEL.withResortAssociations(items);
    }

    render({ enabled, brandId, format }) {
      this.root.hidden = !enabled;
      if (this.lastCoverage) this.lastCoverage.hidden = !enabled || !brandId;
      if (!enabled) return [];
      this.active = brandId; this.renderRows();
      const brand = this.directory.find(brandId); this.detail.hidden = !brand; this.intro.hidden = !!brand; this.directoryArea.hidden = !!brand;
      if (!brand) return [];
      if (this.account !== '*' && !brand.accounts.some(account => account.username === this.account)) this.account = '*';
      this.detail.replaceChildren();
      const back = el('a', 'context-back', '← Tornar als comptes de marca'); back.id = 'brandBackLink'; const route = window.OLAF_NAVIGATION.read(location.href); back.href = window.OLAF_NAVIGATION.write(location.href, { ...route, brand: '', account: '*', format: 'all', piece: '', media: 0 }).href; back.addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); this.onBack(); }); this.detail.append(back);
      const heading = el('div', 'brand-detail-heading'), identity = el('div');
      const title = el('h1', '', brand.name); title.tabIndex = -1; title.id = 'brandDetailTitle'; identity.append(title);
      const confirmed = brand.accounts.filter(account => account.identityStatus === 'confirmed');
      identity.append(el('p', 'brand-detail-accounts', confirmed.map(account => '@' + account.username).join(' · ') || 'Identitat del compte pendent de confirmar'));
      heading.append(identity);
      const controls = el('div', 'brand-detail-controls');
      if (confirmed.length > 1) {
        const select = this.field(controls, 'Compte de la marca', 'brandAccountFilter'); option(select, '*', 'Tots els comptes de la marca');
        confirmed.forEach(account => option(select, account.username, '@' + account.username)); select.value = this.account;
        select.addEventListener('change', () => { this.account = select.value; this.onUpdate(); });
      }
      const formats = el('div', 'filter brand-format-filter'); formats.setAttribute('role', 'group'); formats.setAttribute('aria-label', 'Format de les publicacions de marca');
      [['all', 'Totes les peces'], ['post', 'Fotos / carrusels'], ['reel', 'Reels / vídeos']].forEach(([kind, label]) => {
        const button = el('button', '', label); button.type = 'button'; button.dataset.format = kind; button.setAttribute('aria-pressed', String(format === kind));
        button.addEventListener('click', () => this.onFilter(kind)); formats.append(button);
      }); controls.append(formats); heading.append(controls); this.detail.append(heading);
      const items = this.itemsFor(brand), linked = [...new Set(items.flatMap(piece => piece.relatedStations || [piece.station]))];
      const intro = el('div', 'brand-linkage'); intro.append(el('p', '', 'Contingut del compte de marca, relacionat amb:'));
      linked.forEach(id => {
        const button = el('a', 'brand-station-link', this.profile(id)?.name || id); button.href = window.OLAF_NAVIGATION.write(location.href, { mode: 'station', station: id }).href;
        button.addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); this.onStation(id); }); intro.append(button);
      });
      if (!linked.length) intro.append(el('span', '', 'Encara no hi ha peces recuperades amb els filtres actuals. Això no implica que no s’hagin publicat.'));
      this.detail.append(intro);
      const coverage = el('details', 'brand-coverage'); const summary = el('summary', '', 'Comptes i cobertura de la recerca'); coverage.append(summary);
      const note = el('p', '', 'Finestra de publicació: 29 de setembre de 2025 — 28 de setembre de 2026. Només s’incorporen peces amb una vinculació contrastada amb l’estació. Les dades recuperades no són un arxiu de Stories caducades.'); coverage.append(note);
      brand.accounts.forEach(account => {
        const row = el('div', 'brand-coverage-row');
        const link = el('a', '', '@' + account.username); link.href = 'https://www.instagram.com/' + encodeURIComponent(account.username) + '/'; link.target = '_blank'; link.rel = 'noopener noreferrer';
        row.append(link, el('span', '', coverageText(account)));
        const record = account.coverage;
        if (record?.oldest && record?.newest) row.append(el('small', '', (record.inWindowPosts ?? record.inWindow ?? 0) + ' publicacions recuperades dins la finestra · més antiga: ' + record.oldest));
        if (account.note) row.append(el('small', '', account.note)); coverage.append(row);
      });
      if (!brand.accounts.length) coverage.append(el('p', '', 'No s’ha pogut confirmar un compte oficial d’Instagram per a aquesta marca.'));
      this.coverage = coverage; const afterViewer = document.getElementById('eventInsights'); if (this.lastCoverage) this.lastCoverage.remove(); this.lastCoverage = coverage; afterViewer.after(coverage);
      return items;
    }

    reveal() {
      if (this.detail.hidden) return;
      const title = this.detail.querySelector('h1'); title.tabIndex = -1; title.focus({ preventScroll: true });
      this.detail.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }
  };
})();
