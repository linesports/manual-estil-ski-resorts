(function () {
  'use strict';
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const number = value => new Intl.NumberFormat('ca-ES').format(value);
  const labels = { station: 'Estacions', brands: 'Marques', sectors: 'Categories', saved: 'Desades' };
  window.OLAFNavigationUI = class {
    constructor({ profiles, catalog, sectorForBrand, onNavigate, onPiece, onReset }) {
      Object.assign(this, { profiles, catalog, sectorForBrand, onNavigate, onPiece, onReset });
      this.indexPage = 0; this.items = []; this.activeId = ''; this.indexKey = '';
      this.sectors = el('section', 'sector-directory'); this.sectors.id = 'sectorDirectory';
      this.sectors.setAttribute('aria-label', 'Explora les categories');
      document.getElementById('sectorHeader').after(this.sectors);
      const index = el('details', 'piece-index'); index.id = 'pieceIndex';
      this.index = index; this.indexSummary = el('summary'); this.indexSummary.id = 'pieceIndexSummary';
      this.indexGrid = el('div', 'piece-index-grid'); this.indexGrid.id = 'pieceIndexGrid';
      this.indexGrid.setAttribute('role', 'list'); this.indexGrid.setAttribute('aria-label', 'Índex de peces de la selecció');
      this.indexPages = el('nav', 'piece-index-pages'); this.indexPages.setAttribute('aria-label', 'Pàgines de l’índex de peces');
      this.index.append(this.indexSummary, this.indexGrid, this.indexPages);
      this.index.addEventListener('toggle', () => { if (this.index.open) this.renderIndex(); });
      document.getElementById('viewer').before(index);
      this.resetArea = el('div', 'active-filter-note'); this.resetArea.id = 'activeFilterNote';
      this.resetLabel = el('p'); this.resetLabel.setAttribute('role', 'status');
      this.reset = el('button', 'text-action', 'Netejar filtres'); this.reset.type = 'button';
      this.reset.addEventListener('click', () => this.onReset()); this.resetArea.append(this.resetLabel, this.reset);
      this.index.before(this.resetArea);
      this.notice = el('div', 'feedback'); this.notice.id = 'feedback'; this.notice.hidden = true;
      this.message = el('p'); this.message.setAttribute('role', 'status'); this.message.setAttribute('aria-atomic', 'true');
      this.undo = el('button', 'text-action', 'Desfer'); this.undo.type = 'button';
      this.dismiss = el('button', 'text-action', 'Tancar'); this.dismiss.type = 'button';
      this.dismiss.setAttribute('aria-label', 'Tancar la notificació');
      this.dismiss.addEventListener('click', () => {
        this.notice.hidden = true;
        if (this.feedbackReturn?.isConnected && this.feedbackReturn.checkVisibility() && !this.notice.contains(this.feedbackReturn)) this.feedbackReturn.focus({ preventScroll: true });
        else this.focusView();
      });
      this.notice.append(this.message, this.undo, this.dismiss); document.body.append(this.notice);
    }

    href(state) { return window.OLAF_NAVIGATION.write(location.href, window.OLAF_NAVIGATION.transition(this.state || { station: this.profiles[0]?.id }, state)).href; }
    link(text, state, className = '') {
      const node = el('a', className, text); node.href = this.href(state);
      node.addEventListener('click', event => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); this.onNavigate(state);
      });
      return node;
    }

    render({ state, items, eventName, brandName, filters = [] }) {
      this.state = state;
      const profile = this.profiles.find(p => p.id === state.station);
      const crumbs = document.getElementById('breadcrumbs'); crumbs.replaceChildren();
      const list = el('ol');
      const add = (text, target) => { const li = el('li'); li.append(target ? this.link(text, target) : el('span', '', text)); list.append(li); };
      if (state.mode === 'station') {
        add('Estacions');
        if (state.event !== '*') { list.replaceChildren(); add('Estacions', { mode: 'station', station: state.station }); add(profile?.name, { ...state, event: '*', piece: '', media: 0 }); add(eventName || 'Peces de marca'); }
        else add(profile?.name);
      } else if (state.mode === 'brands') {
        if (state.resort !== '*') {
          const resort = this.profiles.find(p => p.id === state.resort);
          if (resort) { add('Estacions', { mode:'station', station:resort.id }); add(resort.name, { mode:'station', station:resort.id }); }
        }
        add(labels.brands, state.brand ? { ...state, brand: '', account: '*', format: 'all', piece: '', media: 0 } : null);
        if (brandName) add(brandName);
      } else if (state.mode === 'sectors') {
        add(labels.sectors, state.sector !== '*' ? { mode: 'sectors', sector: '*' } : null);
        if (state.sector !== '*') add(state.sector);
      } else add('Referències desades');
      list.lastElementChild?.lastElementChild?.setAttribute('aria-current', 'page');
      crumbs.append(list);
      document.title = [state.mode === 'station' ? eventName || profile?.name : state.mode === 'brands' ? brandName || 'Marques' : state.mode === 'sectors' ? (state.sector === '*' ? 'Categories' : state.sector) : 'Referències desades', 'OLAF'].join(' · ');
      const navStates = { station: { mode: 'station', station: state.station }, brands: { mode: 'brands' }, sectors: { mode: 'sectors' }, saved: { mode: 'saved' } };
      Object.entries(navStates).forEach(([key, target]) => {
        const id = { station: 'stationViewButton', brands: 'brandViewButton', sectors: 'sectorViewButton', saved: 'savedViewButton' }[key];
        document.getElementById(id).href = this.href(target);
      });
      this.sectors.hidden = state.mode !== 'sectors' || state.sector !== '*';
      if (!this.sectors.hidden) this.renderSectors();
      this.resetArea.hidden = !filters.length;
      this.resetLabel.textContent = filters.length ? 'Filtres actius · ' + filters.join(' · ') : '';
      const filterAnchor = state.mode === 'station' ? document.getElementById('stationTools') : state.mode === 'brands' ? document.querySelector(state.brand ? '#brandDetail .brand-linkage' : '.brand-search-toolbar') : document.getElementById(state.mode === 'saved' ? 'savedFilters' : 'sectorHeader');
      filterAnchor?.after(this.resetArea);
      this.index.hidden = !items.length;
      const key = [state.mode, state.station, state.brand, state.event, state.sector, state.format, state.source, state.sponsor, state.account, state.category, state.resort].join(':');
      if (key !== this.indexKey) { this.indexKey = key; this.indexPage = 0; this.index.open = false; }
      this.items = items;
      this.indexSummary.textContent = 'Explorar les ' + number(items.length) + ' peces de la selecció';
      if (this.index.open) this.renderIndex();
      const info = document.querySelector('.collection-info');
      info.hidden = state.mode === 'saved' || state.mode === 'brands' && !state.brand || state.mode === 'sectors' && state.sector === '*';
    }

    renderSectors() {
      this.sectors.replaceChildren();
      const sectors = [...new Set(this.catalog.pieces.flatMap(p => p.brands || []).map(this.sectorForBrand))].sort((a, b) => a.localeCompare(b, 'ca'));
      for (const sector of sectors) {
        const items = window.OLAF_BRAND_MODEL.uniquePublications(this.catalog.pieces.filter(p => p.brands.some(b => this.sectorForBrand(b) === sector)));
        const brands = [...new Set(items.flatMap(p => p.brands).filter(b => this.sectorForBrand(b) === sector))];
        const link = this.link('', { mode: 'sectors', sector }, 'sector-directory-row');
        const text = el('span'); text.append(el('strong', '', sector), el('span', '', brands.slice(0, 4).join(' · ') + (brands.length > 4 ? '…' : '')));
        link.append(text, el('span', 'sector-directory-count', number(items.length) + ' peces'), el('span', 'directory-arrow', '→')); this.sectors.append(link);
      }
    }

    renderIndex(focusFirst = false) {
      this.indexGrid.replaceChildren(); this.indexPages.replaceChildren();
      const perPage = 12, pages = Math.max(1, Math.ceil(this.items.length / perPage));
      this.indexPage = Math.min(this.indexPage, pages - 1);
      this.items.slice(this.indexPage * perPage, (this.indexPage + 1) * perPage).forEach((piece, n) => {
        const li = el('div'); li.setAttribute('role', 'listitem');
        const button = el('button', 'piece-index-item'); button.type = 'button'; button.dataset.pieceId = piece.id;
        const absolute = this.indexPage * perPage + n;
        button.setAttribute('aria-label', 'Peça ' + (absolute + 1) + ': ' + piece.title);
        button.setAttribute('aria-current', String(piece.id === this.activeId));
        const img = el('img'); img.src = piece.image || piece.media?.[0]?.image || ''; img.alt = ''; img.width = 80; img.height = 100; img.loading = 'lazy'; img.decoding = 'async';
        img.addEventListener('error', () => img.hidden = true, { once: true });
        const text = el('span'); text.append(el('strong', '', piece.title), el('small', '', (piece.kind === 'story' ? 'Story' : piece.format) + ' · ' + new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(piece.date + 'T12:00:00Z'))));
        button.append(img, text); button.addEventListener('click', () => this.onPiece(piece.id, true)); li.append(button); this.indexGrid.append(li);
      });
      if (pages > 1) {
        const control = (name, delta, disabled) => {
          const button = el('button', 'text-action', name); button.type = 'button'; button.disabled = disabled;
          button.addEventListener('click', () => { this.indexPage += delta; this.renderIndex(true); }); return button;
        };
        this.indexPages.append(control('← Anteriors', -1, this.indexPage === 0), el('span', '', 'Pàgina ' + (this.indexPage + 1) + ' de ' + pages), control('Següents →', 1, this.indexPage === pages - 1));
      }
      if (focusFirst) this.indexGrid.querySelector('button')?.focus();
    }

    setActive(piece) {
      this.activeId = piece?.id || '';
      this.indexGrid.querySelectorAll('[data-piece-id]').forEach(node => node.setAttribute('aria-current', String(node.dataset.pieceId === this.activeId)));
    }
    focusView() {
      const selector = this.state.mode === 'station' ? (this.state.event === '*' ? '#stationSelectorTrigger' : '#eventDossierTitle') : this.state.mode === 'brands' ? (this.state.brand ? '#brandDetailTitle' : '#brandDirectoryTitle') : this.state.mode === 'sectors' ? '#sectorHeading' : '#savedHeading';
      const heading = document.querySelector(selector);
      if (heading) { heading.tabIndex = heading.matches('button') ? 0 : -1; heading.focus({ preventScroll: true }); heading.scrollIntoView({ behavior: 'instant', block: 'start' }); }
    }
    feedback(message, undo) {
      if (!this.notice.contains(document.activeElement)) this.feedbackReturn = document.activeElement?.checkVisibility() && document.activeElement !== document.body ? document.activeElement : null;
      this.notice.hidden = false; this.message.textContent = message; this.undo.hidden = !undo; this.undo.onclick = undo ? () => { undo(); this.undo.hidden = true; } : null;
      document.getElementById('routeStatus').textContent = message;
    }
  };
})();
