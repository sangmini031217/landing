/* =============================================
   BADA BOM — IR-Style Landing Page Scripts
   ============================================= */

(function () {
  'use strict';

  // === Navigation ===
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  // === Smooth Scroll ===
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 60;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // === Fade-up on scroll (Intersection Observer) ===
  const fadeElements = document.querySelectorAll('.fade-up');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  fadeElements.forEach(el => fadeObserver.observe(el));

  // === Counter Animation ===
  function animateCounter(element, target, duration) {
    const start = performance.now();
    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const counterElements = document.querySelectorAll('[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        animateCounter(el, target, 2000);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counterElements.forEach(el => counterObserver.observe(el));

  // === Market Chart Bars ===
  const barFills = document.querySelectorAll('.mc-fill');
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fills = entry.target.querySelectorAll('.mc-fill');
        fills.forEach(fill => {
          const width = fill.dataset.width;
          setTimeout(() => {
            fill.style.width = width + '%';
          }, 200);
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const marketChart = document.querySelector('.market-chart');
  if (marketChart) barObserver.observe(marketChart);

  // === Accordion ===
  document.querySelectorAll('.acc-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.acc-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
      header.setAttribute('aria-expanded', !isOpen);
    });
  });

  // === Revenue Donut Chart (Chart.js) ===
  function initChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx || !window.Chart) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['소재비', '제작 인건비', '부자재', '포장·배송', '채널 수수료', '기여이익'],
        datasets: [{
          data: [400, 2000, 1800, 1500, 1485, 2715],
          backgroundColor: [
            '#93C5FD',
            '#052B5B',
            '#15B097',
            '#6B7280',
            '#D1D5DB',
            '#0B5FFF'
          ],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              padding: 12,
              font: { size: 11, family: 'Pretendard' },
              color: '#6B7280'
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ' ' + context.label + ': ' + context.parsed.toLocaleString() + '원';
              }
            },
            bodyFont: { family: 'Pretendard' },
            titleFont: { family: 'Pretendard' }
          }
        }
      }
    });
  }

  // === BEP Line Chart ===
  function initBEPChart() {
    const ctx = document.getElementById('bepChart');
    if (!ctx || !window.Chart) return;

    const labels = [];
    const revenueData = [];
    const totalCostData = [];
    const fixedCostData = [];

    const fixedCost = 750000;
    const pricePerUnit = 9900;
    const variableCostPerUnit = 7185;

    for (let q = 0; q <= 600; q += 50) {
      labels.push(q);
      revenueData.push(q * pricePerUnit);
      totalCostData.push(fixedCost + q * variableCostPerUnit);
      fixedCostData.push(fixedCost);
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '매출',
            data: revenueData,
            borderColor: '#0B5FFF',
            backgroundColor: 'rgba(11, 95, 255, 0.05)',
            borderWidth: 2.5,
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 5
          },
          {
            label: '총비용',
            data: totalCostData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.05)',
            borderWidth: 2.5,
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 5
          },
          {
            label: '고정비',
            data: fixedCostData,
            borderColor: '#9CA3AF',
            borderWidth: 1.5,
            borderDash: [6, 4],
            fill: false,
            tension: 0,
            pointRadius: 0,
            pointHoverRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                return '월 판매량: ' + items[0].label + '개';
              },
              label: function (context) {
                return ' ' + context.dataset.label + ': ' + context.parsed.y.toLocaleString() + '원';
              }
            },
            bodyFont: { family: 'Pretendard' },
            titleFont: { family: 'Pretendard' }
          },
          annotation: {
            annotations: {
              bepLine: {
                type: 'line',
                xMin: 277,
                xMax: 277,
                borderColor: '#15B097',
                borderWidth: 2,
                borderDash: [4, 4],
                label: {
                  display: true,
                  content: 'BEP 277개',
                  position: 'start'
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '월 판매량 (개)',
              font: { size: 11, family: 'Pretendard' },
              color: '#6B7280'
            },
            ticks: {
              font: { size: 10, family: 'Pretendard' },
              color: '#9CA3AF'
            },
            grid: { display: false }
          },
          y: {
            title: {
              display: true,
              text: '금액 (원)',
              font: { size: 11, family: 'Pretendard' },
              color: '#6B7280'
            },
            ticks: {
              font: { size: 10, family: 'Pretendard' },
              color: '#9CA3AF',
              callback: function(value) {
                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return (value / 1000) + 'K';
                return value;
              }
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      },
      plugins: [{
        id: 'bepVerticalLine',
        afterDraw: function(chart) {
          const xScale = chart.scales.x;
          const yScale = chart.scales.y;
          const ctx = chart.ctx;

          // BEP x position (277 on scale 0-600, index interpolation)
          const bepIndex = 277 / 50; // between index 5 and 6
          const xPos = xScale.getPixelForValue(bepIndex * 50);
          // More precise: interpolate
          const ratio = 277 / 600;
          const xPixel = xScale.left + ratio * (xScale.right - xScale.left);

          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#15B097';
          ctx.lineWidth = 2;
          ctx.moveTo(xPixel, yScale.top);
          ctx.lineTo(xPixel, yScale.bottom);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#15B097';
          ctx.font = '600 11px Pretendard';
          ctx.textAlign = 'center';
          ctx.fillText('BEP 277개', xPixel, yScale.top - 8);
          ctx.restore();
        }
      }]
    });
  }

  // Init charts when ready
  if (window.Chart) {
    initChart();
    initBEPChart();
  } else {
    window.addEventListener('load', () => {
      initChart();
      initBEPChart();
    });
  }

})();
