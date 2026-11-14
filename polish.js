/* OLAF · polit d'interacció: estat de scroll, progrés de lectura, aparició progressiva i transició de vista.
   No toca dades, URL ni focus; tot degrada de manera segura si falta IntersectionObserver o es demana moviment reduït. */
(function () {
  'use strict';
  const doc = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Estat de scroll + progrés */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
  body.append(bar);
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const max = Math.max(1, doc.scrollHeight - innerHeight);
      bar.style.setProperty('--progress', Math.min(1, scrollY / max).toFixed(4));
      body.dataset.scrolled = scrollY > 24 ? 'true' : 'false';
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Aparició progressiva dels elements de llistat */
  const targets = '.event-card, .brand-directory-row, .sector-photo-card, .piece-index-item, .event-dossier-heading, .event-library-heading, .brand-introduction, .event-insights';
  let io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in'); io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  }
  function scan(root) {
    if (!io) return;
    const fresh = [...(root.matches?.(targets) ? [root] : []), ...root.querySelectorAll(targets)].filter(node => !node.dataset.revealed);
    fresh.forEach((node, index) => {
      node.dataset.revealed = '1';
      node.classList.add('reveal');
      node.style.setProperty('--reveal-delay', Math.min(index % 6, 5) * 70 + 'ms');
      io.observe(node);
    });
    /* Xarxa de seguretat: si l'observador no dispara, mai queda contingut amagat. */
    setTimeout(() => fresh.forEach(node => node.classList.add('is-in')), 2400);
  }
  if (io) {
    doc.classList.add('reveal-ready');
    scan(body);
  }

  /* Transició suau en canviar de vista; l'animació només afecta opacitat/posició, no el focus. */
  const main = document.getElementById('main');
  let lastKey = '';
  function viewKey() { const p = new URLSearchParams(location.search); return [body.dataset.view, p.get('brand'), p.get('event'), p.get('piece'), location.hash].join('|'); }
  if (main) {
    lastKey = viewKey();
    new MutationObserver(mutations => {
      if (io) mutations.forEach(m => m.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); }));
      const key = viewKey();
      if (key !== lastKey) {
        lastKey = key;
        if (!reduce) { main.classList.remove('view-enter'); void main.offsetWidth; main.classList.add('view-enter'); }
      }
    }).observe(main, { childList: true, subtree: true });
  }
})();
