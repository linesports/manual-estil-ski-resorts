(function () {
  'use strict';
  const chart = document.getElementById('formatChart');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#b50024', '#d98582', '#9c8b72'];
  const svgNS = 'http://www.w3.org/2000/svg';
  const node = (tag, attrs, text) => {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (text != null) element.textContent = text;
    return element;
  };
  let observer, revealObserver;
  function render() {
    const rows = [...chart.querySelectorAll('.format-chart-row')];
    if (!rows.length || chart.querySelector('.format-donut')) return;
    observer?.disconnect(); revealObserver?.disconnect(); chart.classList.remove('is-revealed', 'has-highlight');
    const counts = rows.map(row => Number(row.querySelector('strong').textContent.replace(/\D/g, '')));
    const total = counts.reduce((sum, count) => sum + count, 0);
    const circumference = 2 * Math.PI * 110;
    const svg = node('svg', { viewBox: '0 0 300 300', class: 'format-donut', role: 'img', 'aria-label': new Intl.NumberFormat('ca-ES').format(total) + ' peces documentades. ' + rows.map((row, i) => row.querySelector('.format-chart-label>span').textContent + ': ' + counts[i]).join('; ') });
    svg.append(node('circle', { cx:150, cy:150, r:110, class:'donut-track' }));
    let offset = 0; const segments = [];
    rows.forEach((row, i) => {
      const share = total ? counts[i] / total : 0;
      const length = share * circumference;
      const segment = node('circle', { cx:150, cy:150, r:110, class:'donut-segment', stroke:colors[i], 'stroke-dasharray': Math.max(0, length - 3) + ' ' + (circumference - Math.max(0, length - 3)), 'stroke-dashoffset': -offset, 'aria-hidden':'true' });
      segment.dataset.finalDash = Math.max(0, length - 3) + ' ' + (circumference - Math.max(0, length - 3)); segment.dataset.finalOffset = String(-offset); offset += length; segments.push(segment); svg.append(segment);
      row.style.setProperty('--format-color', colors[i]);
      row.querySelector('.format-chart-bar').style.width = (share * 100) + '%';
      row.addEventListener('pointerenter', () => { chart.classList.add('has-highlight'); segments.forEach((s, index) => s.classList.toggle('is-highlighted', index === i)); });
      row.addEventListener('pointerleave', () => { chart.classList.remove('has-highlight'); });
    });
    svg.append(node('text', {x:150,y:149,'text-anchor':'middle',class:'donut-total'}, new Intl.NumberFormat('ca-ES').format(total)), node('text',{x:150,y:174,'text-anchor':'middle',class:'donut-caption'},'peces documentades'));
    chart.prepend(svg);
    const reveal = () => { chart.classList.add('is-revealed'); segments.forEach(segment => segment.setAttribute('stroke-dasharray', segment.dataset.finalDash)); revealObserver?.disconnect(); };
    if (reduced.matches) reveal();
    else {
      segments.forEach(segment => segment.setAttribute('stroke-dasharray', '0 ' + circumference));
      revealObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) requestAnimationFrame(reveal); }, {threshold:.2});
      revealObserver.observe(chart);
    }
    observer.observe(chart, {childList:true});
  }
  observer = new MutationObserver(render); observer.observe(chart, {childList:true}); render();
  reduced.addEventListener('change', () => { if (reduced.matches) { chart.classList.add('is-revealed'); chart.querySelectorAll('.donut-segment').forEach(s=>s.setAttribute('stroke-dasharray',s.dataset.finalDash)); } });
})();
