(function () {
  'use strict';
  // Category context only. Evidence, source records, counts and native links stay intact.
  const entries = {
    'Alimentació i begudes': 'alimentacio',
    'Automoció i mobilitat': 'automocio',
    'Equipament i esports': 'equipament',
    'Moda i complements': 'moda',
    'Tecnologia i continguts digitals': 'tecnologia',
    'Telecomunicacions': 'telecomunicacions',
    'Finances i assegurances': 'finances',
    'Turisme i allotjament': 'turisme',
    'Immobiliari': 'immobiliari',
    'Salut i benestar': 'salut',
    'Esdeveniments i entreteniment': 'esdeveniments',
    'Energia i serveis': 'energia',
    'Altres': 'altres'
  };
  const directory = document.getElementById('sectorDirectory');
  if (!directory) return;
  function enhance() {
    directory.querySelectorAll('.sector-directory-row:not([data-sector-visual])').forEach((row, index) => {
      const name = row.querySelector('strong')?.textContent.trim();
      const id = entries[name];
      if (!id) return;
      row.dataset.sectorVisual = id;
      row.classList.add('sector-photo-card');
      row.querySelector('span')?.classList.add('sector-label');
      const picture = document.createElement('picture');
      picture.className = 'sector-cover'; picture.setAttribute('aria-hidden', 'true');
      const source = document.createElement('source'); source.type = 'image/avif';
      source.srcset = './media/sectors/' + id + '-1200.avif 1200w, ./media/sectors/' + id + '-2400.avif 2400w';
      source.sizes = '(min-width:1270px) 1190px, calc(100vw - 80px)';
      const image = document.createElement('img');
      image.alt = ''; image.width = 2400; image.height = 686;
      image.src = './media/sectors/' + id + '-1200.webp';
      image.srcset = './media/sectors/' + id + '-1200.webp 1200w, ./media/sectors/' + id + '-2400.webp 2400w';
      image.sizes = source.sizes; image.loading = index < 2 ? 'eager' : 'lazy'; image.decoding = 'async';
      let retried = false;
      image.addEventListener('error', () => {
        if (!retried) { retried = true; source.remove(); image.src = './media/sectors/' + id + '-1200.webp'; return; }
        row.dataset.imageState = 'unavailable';
      });
      image.addEventListener('load', () => { row.dataset.imageState = 'ready'; });
      picture.append(source, image); row.prepend(picture);
      const arrow = row.querySelector('.directory-arrow');
      if (arrow) { arrow.textContent = ''; arrow.setAttribute('aria-hidden', 'true'); arrow.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'; }
    });
    const other = directory.querySelector('[data-sector-visual="altres"]');
    if (other && other !== directory.lastElementChild) directory.append(other);
  }
  // Observe direct children only: enriching a row never triggers another render loop.
  new MutationObserver(enhance).observe(directory, { childList: true });
  document.addEventListener('olaf:viewchange', enhance);
  enhance();
  window.OLAF_SECTOR_VISUALS = { enhance, entries };
})();
