(function () {
  'use strict';
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const arrow = () => {
    const span = el('span', 'event-arrow');
    span.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
    return span;
  };
  const countText = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const originsOf = piece => piece.origins || [{ type: piece.account ? 'brand' : 'station', account: piece.account || piece.station }];
  const counts = items => ({
    station: items.filter(p => originsOf(p).some(o => o.type === 'station')).length,
    brand: items.filter(p => originsOf(p).some(o => o.type === 'brand')).length,
    shared: items.filter(p => new Set(originsOf(p).map(o => o.type)).size > 1).length
  });

  window.OLAFEventExplorer = class {
    constructor({ catalog, imageUrl, onSelect, onPiece }) {
      this.catalog = catalog;
      this.imageUrl = imageUrl;
      this.onSelect = onSelect;
      this.onPiece = onPiece;
      this.expanded = false;
      const label = el('label', 'field event-field');
      label.append(el('span', '', 'Esdeveniment o activació'));
      this.select = el('select');
      this.select.id = 'eventFilter';
      label.append(this.select);
      document.getElementById('stationTools').insertBefore(label, document.getElementById('brandSourceSwitch'));
      this.select.addEventListener('change', () => onSelect(this.select.value, true));

      this.library = el('section', 'event-library');
      this.library.id = 'eventLibrary';
      this.library.setAttribute('aria-labelledby', 'eventLibraryTitle');
      this.dossier = el('section', 'event-dossier');
      this.dossier.id = 'eventDossier';
      this.dossier.setAttribute('aria-labelledby', 'eventDossierTitle');
      document.getElementById('viewer').before(this.library, this.dossier);
      this.insights = el('section', 'event-insights'); this.insights.id = 'eventInsights'; this.insights.hidden = true;
      document.getElementById('viewer').after(this.insights);
      this.strip = el('div', 'piece-role-strip');
      this.strip.id = 'pieceRoleStrip';
      document.getElementById('brandsLine').after(this.strip);
      this.relationDetails = el('section', 'piece-relationships');
      this.relationDetails.id = 'pieceRelationships';
      document.querySelector('#storyDetails .detail-content').prepend(this.relationDetails);
    }

    groups(items) {
      const groups = new Map();
      items.forEach(piece => {
        const events = this.catalog.eventsForPiece(piece);
        (events.length ? events : [null]).forEach(event => {
          const id = event?.id || 'other';
          if (!groups.has(id)) groups.set(id, { id, name: event?.name || 'Altres peces de marca', kind: event?.kind || 'Fora d’un esdeveniment identificat', items: [] });
          groups.get(id).items.push(piece);
        });
      });
      return [...groups.values()].sort((a, b) => a.id === 'other' ? 1 : b.id === 'other' ? -1 : b.items.length - a.items.length || a.name.localeCompare(b.name, 'ca'));
    }

    render(state) {
      const changed = this.station !== state.station;
      if (changed) this.expanded = false;
      this.station = state.station;
      this.state = state;
      this.library.hidden = !state.enabled || state.event !== '*';
      this.dossier.hidden = !state.enabled || state.event === '*';
      this.insights.hidden = !state.enabled || state.event === '*';
      this.insights.replaceChildren();
      this.strip.hidden = !state.enabled;
      this.relationDetails.hidden = !state.enabled;
      if (!state.enabled) return;
      const allGroups = this.groups(state.allItems);
      this.select.replaceChildren();
      [['*', 'Explorar per esdeveniments'], ['all', 'Totes les peces'], ...allGroups.map(g => [g.id, g.name])].forEach(([value, name]) => {
        const option = el('option', '', name); option.value = value; this.select.append(option);
      });
      this.select.value = state.event;
      if (state.event === '*') this.renderLibrary(this.groups(state.items));
      else this.renderDossier(state.event === 'all'
        ? { id: 'all', name: 'Totes les peces de marca', kind: 'Visió de l’estació', items: state.visibleItems }
        : { ...(allGroups.find(g => g.id === state.event) || { id: state.event, name: 'Peces de marca', kind: 'Selecció' }), items: state.visibleItems });
    }

    renderLibrary(groups) {
      this.library.replaceChildren();
      const heading = el('div', 'event-library-heading');
      const titleBlock = el('div');
      const title = el('h2', '', 'Esdeveniments i activacions'); title.id = 'eventLibraryTitle';
      titleBlock.append(title, el('p', 'event-intro', 'Les peces agrupades pel context on participa cada marca.'));
      const all = el('button', 'event-text-link', 'Veure totes les peces');
      all.type = 'button'; all.append(arrow()); all.addEventListener('click', () => this.onSelect('all', true));
      heading.append(titleBlock, all); this.library.append(heading);
      if (groups.reduce((sum, group) => sum + group.items.length, 0) > this.state.items.length) {
        titleBlock.append(el('p', 'event-evidence-note', 'Alguns recaps cobreixen més d’un esdeveniment i es poden trobar a cadascuna de les col·leccions relacionades.'));
      }
      if (!groups.length) {
        const empty = el('div', 'event-library-empty');
        empty.append(el('h3', '', 'No hi ha peces documentades amb aquesta selecció.'), el('p', '', this.state.source === 'brand'
          ? 'La recerca disponible encara no aporta publicacions del compte de marca per a aquesta selecció. No permet concloure que no n’hi hagi.'
          : 'Prova una altra marca, font o format per continuar explorant.'));
        this.library.append(empty); return;
      }
      const grid = el('div', 'event-grid');
      const columns = matchMedia('(min-width:1024px)').matches ? Array.from({ length:3 }, () => ({ node:el('div', 'event-column'), height:0 })) : [];
      if (columns.length) grid.append(...columns.map(column => column.node));
      (this.expanded ? groups : groups.slice(0, 6)).forEach((group, index) => {
        const card = this.card(group, index);
        if (!columns.length) { grid.append(card); return; }
        const column = columns.reduce((shortest, entry) => entry.height < shortest.height ? entry : shortest);
        column.node.append(card);
        column.height += 1 / (Number(card.style.getPropertyValue('--card-media-ratio')) || 1) + .065;
      });
      this.library.append(grid);
      if (groups.length > 6) {
        const more = el('button', 'event-show-more', this.expanded ? 'Mostrar menys col·leccions' : 'Veure les ' + (groups.length - 6) + ' col·leccions restants');
        more.type = 'button'; more.setAttribute('aria-expanded', String(this.expanded));
        more.addEventListener('click', () => { this.expanded = !this.expanded; this.renderLibrary(groups); (this.expanded ? this.library.querySelector('[data-event-id="' + CSS.escape(groups[6].id) + '"]') : this.library.querySelector('.event-show-more'))?.focus(); });
        this.library.append(more);
      }
    }

    card(group, index) {
      const card = el('a', 'event-card'); card.dataset.eventId = group.id;
      card.href = window.OLAF_NAVIGATION.write(location.href, { ...window.OLAF_NAVIGATION.read(location.href), event: group.id, piece: '', media: 0 }).href;
      card.setAttribute('aria-label', 'Obrir ' + group.name + ', ' + countText(group.items.length, 'peça', 'peces'));
      const cover = el('span', 'event-card-cover');
      const photos = window.OLAF_EVENT_COVERS.select(group);
      const foreground = photos.at(-1);
      const setLayout = (width, height) => {
        const portrait = foreground?.fit === 'contain' && width < height;
        cover.dataset.coverLayout = portrait ? 'portrait' : 'landscape';
        card.dataset.coverLayout = portrait ? 'portrait' : 'landscape';
        card.style.setProperty('--card-media-ratio', portrait ? width / height : 1);
      };
      setLayout(foreground?.width || 400, foreground?.height || 225);
      photos.forEach((photo, n) => {
        const frame = el('span', 'event-stack-frame event-stack-' + n + (photos.length === 1 ? ' event-stack-solo' : '') + (n === photos.length - 1 ? ' event-stack-foreground' : ''));
        frame.dataset.coverFit = photo.fit;
        frame.dataset.coverPieceId = photo.pieceId;
        frame.style.setProperty('--cover-ratio', (photo.width || 400) / (photo.height || 225));
        const img = el('img');
        if (photo.width && photo.height) { img.width = photo.width; img.height = photo.height; }
        img.src = this.imageUrl(photo.image); img.alt = ''; img.loading = index < 3 ? 'eager' : 'lazy'; img.decoding = 'async';
        img.style.objectFit = photo.fit; img.style.objectPosition = photo.position;
        img.addEventListener('load', () => {
          img.width = img.naturalWidth; img.height = img.naturalHeight;
          frame.style.setProperty('--cover-ratio', img.naturalWidth / img.naturalHeight);
          if (n === photos.length - 1) setLayout(img.naturalWidth, img.naturalHeight);
        }, { once: true });
        img.addEventListener('error', () => { img.hidden = true; frame.classList.add('poster-unavailable'); }, { once: true });
        frame.append(img); cover.append(frame);
      });
      const count = el('span', 'event-card-count', countText(group.items.length, 'peça', 'peces')); cover.append(count);
      const body = el('span', 'event-card-body');
      body.append(el('span', 'event-eyebrow', group.kind), el('span', 'event-card-title', group.name));
      const brands = [...new Set(group.items.flatMap(p => p.brands || []))];
      body.append(el('span', 'event-card-brands', brands.slice(0, 4).join(' · ') + (brands.length > 4 ? ' +' + (brands.length - 4) : '')));
      const total = counts(group.items);
      const footer = el('span', 'event-card-footer');
      const source = el('span', '', total.brand ? countText(total.brand, 'peça amb compte de marca', 'peces amb comptes de marca') : 'Publicacions de l’estació');
      footer.append(source, arrow()); body.append(footer); card.append(cover, body);
      card.addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); this.onSelect(group.id, true); });
      return card;
    }

    renderDossier(group) {
      this.dossier.replaceChildren();
      const back = el('a', 'event-back', 'Tornar a les col·leccions'); back.href = window.OLAF_NAVIGATION.write(location.href, { ...window.OLAF_NAVIGATION.read(location.href), event: '*', piece: '', media: 0 }).href; back.prepend(arrow());
      back.addEventListener('click', event => { if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); this.onSelect('*', true); });
      this.dossier.append(back);
      const head = el('div', 'event-dossier-heading'), text = el('div');
      text.append(el('p', 'event-eyebrow', group.kind));
      const title = el('h2', '', group.name); title.id = 'eventDossierTitle'; text.append(title);
      const dateRange = [...group.items].map(p => p.date).filter(Boolean).sort();
      const dates = dateRange.length ? this.date(dateRange[0]) + (dateRange[0] !== dateRange.at(-1) ? ' — ' + this.date(dateRange.at(-1)) : '') : '';
      text.append(el('p', 'event-date-range', dates ? 'Publicacions · ' + dates : 'Sense peces amb els filtres actuals'));
      const total = counts(group.items), stats = el('div', 'event-source-stats');
      stats.append(el('strong', '', countText(group.items.length, 'peça', 'peces')),
        el('span', '', total.station + ' estació · ' + total.brand + ' marca'));
      if (total.shared) stats.append(el('small', '', countText(total.shared, 'coautoria comptada', 'coautories comptades') + ' una sola vegada'));
      head.append(text, stats); this.dossier.append(head);
      if (!group.items.length) return;
      if (group.id !== 'all' && group.id !== 'other') {
        const roles = el('div', 'event-roles');
        const roleHeading = el('h2', '', 'Vinculació de les marques'); roleHeading.id = 'eventRolesTitle'; roleHeading.tabIndex = -1; roles.append(roleHeading);
        roles.append(el('p', 'section-description', 'Consulta què acredita cada peça: naming, presència física, producte o contingut compartit.'));
        const byBrand = new Map();
        group.items.forEach(piece => this.catalog.relations(piece).forEach(relation => {
          if (!byBrand.has(relation.brand)) byBrand.set(relation.brand, []);
          const list = byBrand.get(relation.brand);
          if (!list.some(r => r.type === relation.type)) list.push(relation);
        }));
        byBrand.forEach((relations, brand) => {
          const order = ['naming', 'space', 'physical', 'demo', 'sampling', 'content', 'experience', 'digital', 'service', 'product', 'giveaway', 'credited'];
          relations = relations.filter(r => r.type !== 'credited' || relations.length === 1).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
          const details = el('details', 'event-brand-role');
          const summary = el('summary'); summary.append(el('span', 'event-role-brand', brand));
          const tags = el('span', 'event-role-tags'); relations.slice(0, 3).forEach(r => tags.append(el('span', 'role-tag role-' + r.type, r.label)));
          if (relations.length > 3) tags.append(el('span', 'role-tag', '+' + (relations.length - 3)));
          summary.append(tags, el('span', 'event-role-plus', '+')); details.append(summary);
          const evidence = el('div', 'event-role-evidence');
          relations.forEach(r => {
            const row = el('div', 'event-evidence-row');
            row.append(el('span', 'event-evidence-label', r.label), el('p', '', r.evidence));
            const proof = el('button', 'event-evidence-link', 'Veure la peça ↗'); proof.type = 'button'; proof.addEventListener('click', () => this.onPiece(r.pieceId));
            row.append(el('small', '', r.basis), proof); evidence.append(row);
          });
          details.append(evidence); roles.append(details);
        });
        roles.append(el('p', 'event-evidence-note', 'La lectura descriu el que acredita cada peça. Un naming o un logotip digital no pressuposa presència física ni un contracte directe amb l’estació.'));
        this.insights.append(roles);
        const jumps = el('nav', 'context-jumps'); jumps.setAttribute('aria-label', 'Apartats de l’esdeveniment');
        [['#viewer', 'Veure les peces'], ['#eventRolesTitle', 'Vinculació de les marques']].forEach(([href, text]) => { const link = el('a', '', text); link.href = href; link.addEventListener('click', event => { event.preventDefault(); const target = document.querySelector(href); target.tabIndex = -1; target.focus({ preventScroll: true }); target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }); jumps.append(link); });
        this.dossier.append(jumps);
      }
      if (!this.insights.children.length) this.insights.hidden = true;
    }

    setActive(piece) {
      if (!piece) return;
      this.dossier.querySelectorAll('[data-piece-id]').forEach(node => node.setAttribute('aria-current', String(node.dataset.pieceId === piece.id)));
      const relations = this.catalog.relations(piece);
      this.strip.replaceChildren();
      [...new Set(relations.map(r => r.label))].slice(0, 4).forEach(label => this.strip.append(el('span', 'role-tag', label)));
      this.relationDetails.replaceChildren(el('span', 'detail-label', 'Vinculació de la marca en aquesta peça'));
      relations.forEach(relation => {
        const row = el('div', 'piece-relationship');
        row.append(el('strong', '', relation.brand + ' · ' + relation.label), el('p', '', relation.evidence), el('small', '', relation.basis));
        this.relationDetails.append(row);
      });
      const origin = document.getElementById('brandPostOrigin');
      origin.hidden = false;
      origin.textContent = originsOf(piece).map(o => (o.type === 'brand' ? 'Marca · @' : 'Estació · @') + o.account).join('  /  ');
      const owners = [...new Set([piece.primaryOwner, ...(piece.sourceRecords || []).map(record => record.primaryOwner)].filter(Boolean))];
      if (owners.length) origin.textContent += ' · Autoria principal a Instagram: ' + owners.map(owner => '@' + owner).join(' / ');
      if (piece.relatedStations?.length > 1) origin.textContent += ' · Estacions vinculades: ' + piece.relatedStations.map(id => DATA.profiles.find(profile => profile.id === id)?.name || id).join(' · ');
    }

    reveal() {
      const target = this.state.event === '*' ? this.library : this.dossier;
      const heading = target.querySelector('h2');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) target.animate([{ opacity: .3, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' });
    }

    date(value) { return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')); }
  };
})();
