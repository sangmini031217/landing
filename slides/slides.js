/* ===========================
   SLIDE NAVIGATION
   =========================== */
(function () {
  const slides = document.querySelectorAll('.slide');
  const counter = document.getElementById('counter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const total = slides.length;
  let current = 0;

  function showSlide(index) {
    slides.forEach((s) => s.classList.remove('active'));
    slides[index].classList.add('active');
    counter.textContent = `${index + 1} / ${total}`;
  }

  function next() {
    if (current < total - 1) { current++; showSlide(current); }
  }

  function prev() {
    if (current > 0) { current--; showSlide(current); }
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault(); next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); prev();
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  });

  // Buttons
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // Print button
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // Touch swipe
  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });
  document.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff < -50) next();
    else if (diff > 50) prev();
  });

  // Init
  showSlide(0);
})();


/* ===========================
   BAR CHART (Tariff Comparison)
   =========================== */
(function () {
  const chartData = [
    { country: '중국', value: 145, highlight: false },
    { country: '베트남', value: 46, highlight: false },
    { country: '한국', value: 25, highlight: true },
    { country: '멕시코', value: 25, highlight: false },
    { country: '캐나다', value: 25, highlight: false },
    { country: 'EU', value: 20, highlight: false },
  ];

  const maxValue = 145;
  const chartEl = document.getElementById('tariffChart');
  if (!chartEl) return;

  chartData.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span class="bar-row__label">${item.country}</span>
      <div class="bar-row__track">
        <div class="bar-row__fill ${item.highlight ? 'bar-row__fill--highlight' : 'bar-row__fill--default'}" 
             style="width:${(item.value / maxValue) * 100}%"></div>
        <span class="bar-row__value">${item.value}%</span>
      </div>
    `;
    chartEl.appendChild(row);
  });
})();

/* ===========================
   DONUT CHART (Raw Materials)
   =========================== */
(function () {
  const donutData = [
    { label: '중국', value: 78, color: '#c0392b' },
    { label: '호주', value: 8, color: '#2D3A2E' },
    { label: '칠레', value: 6, color: '#7A8C6E' },
    { label: '기타', value: 8, color: '#B5C4A8' },
  ];

  const svgEl = document.getElementById('donutChart');
  const legendEl = document.getElementById('donutLegend');
  if (!svgEl || !legendEl) return;

  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  donutData.forEach((segment) => {
    const percent = segment.value / 100;
    const offset = cumulativePercent * circumference;
    const length = percent * circumference;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', size / 2);
    circle.setAttribute('cy', size / 2);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', segment.color);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('stroke-dasharray', `${length} ${circumference - length}`);
    circle.setAttribute('stroke-dashoffset', -offset);
    circle.setAttribute('stroke-linecap', 'butt');
    circle.style.transform = 'rotate(-90deg)';
    circle.style.transformOrigin = 'center';

    svgEl.appendChild(circle);
    cumulativePercent += percent;

    // Legend
    const item = document.createElement('div');
    item.className = 'donut-legend__item';
    item.innerHTML = `<span class="donut-legend__dot" style="background:${segment.color}"></span>${segment.label} ${segment.value}%`;
    legendEl.appendChild(item);
  });
})();
