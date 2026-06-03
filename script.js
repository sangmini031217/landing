/* ===========================
   SCROLL REVEAL (IntersectionObserver)
   =========================== */
(function () {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((el) => observer.observe(el));
})();

/* ===========================
   KPI COUNT-UP
   =========================== */
(function () {
  const counters = document.querySelectorAll('.kpi-card__number[data-target]');

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target'), 10);
          animateCount(el, 0, target, 1200);
          countObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.3 }
  );

  counters.forEach((el) => countObserver.observe(el));

  function animateCount(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }
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
             data-width="${(item.value / maxValue) * 100}"></div>
        <span class="bar-row__value">${item.value}%</span>
      </div>
    `;

    chartEl.appendChild(row);
  });

  // Animate on scroll
  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fills = chartEl.querySelectorAll('.bar-row__fill');
          fills.forEach((fill, i) => {
            setTimeout(() => {
              fill.style.width = fill.getAttribute('data-width') + '%';
            }, i * 80);
          });
          barObserver.unobserve(chartEl);
        }
      });
    },
    { threshold: 0.2 }
  );

  barObserver.observe(chartEl);
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
    circle.style.opacity = '0';
    circle.style.transition = `opacity 0.5s ease ${cumulativePercent * 0.8}s`;
    circle.classList.add('donut-segment');

    svgEl.appendChild(circle);
    cumulativePercent += percent;

    // Legend
    const item = document.createElement('div');
    item.className = 'donut-legend__item';
    item.innerHTML = `<span class="donut-legend__dot" style="background:${segment.color}"></span>${segment.label} ${segment.value}%`;
    legendEl.appendChild(item);
  });

  // Animate on scroll
  const donutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const segments = svgEl.querySelectorAll('.donut-segment');
          segments.forEach((seg) => {
            seg.style.opacity = '1';
          });
          donutObserver.unobserve(svgEl);
        }
      });
    },
    { threshold: 0.3 }
  );

  donutObserver.observe(svgEl);
})();

/* ===========================
   Q&A FORM
   =========================== */
(function () {
  const form = document.getElementById('qaForm');
  const success = document.getElementById('qaSuccess');
  if (!form || !success) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('.qa-form__input');
    if (input.value.trim()) {
      success.classList.add('show');
      input.value = '';
      setTimeout(() => {
        success.classList.remove('show');
      }, 3000);
    }
  });
})();


/* ===========================
   PDF DOWNLOAD (opens slides and triggers print)
   =========================== */
(function () {
  const btn = document.getElementById('downloadPdf');
  if (!btn) return;

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    const printWindow = window.open('slides/index.html', '_blank');
    printWindow.addEventListener('load', function () {
      setTimeout(function () {
        printWindow.print();
      }, 500);
    });
  });
})();
