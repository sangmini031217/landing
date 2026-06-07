/**
 * RE:PIUM 사업계획서 — Chart.js 렌더링
 * Starbucks-inspired palette: browns, golds, muted greens
 * data.js 선행 로드 필수
 */

document.addEventListener('DOMContentLoaded', () => {
  // Delay chart rendering to sync with reveal animations
  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        switch (id) {
          case 'chart-candle-market': renderCandleMarketChart(); break;
          case 'chart-bep': renderBEPChart(); break;
          case 'chart-donut': renderDonutChart(); break;
          case 'chart-funding-pie': renderFundingPieChart(); break;
          case 'chart-positioning': renderPositioningChart(); break;
        }
        chartObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -20px 0px', threshold: 0.2 });

  document.querySelectorAll('canvas[id^="chart-"]').forEach(canvas => {
    chartObserver.observe(canvas);
  });
});

// Chart.js global defaults
Chart.defaults.font.family = "'Manrope', -apple-system, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = 'rgba(0,0,0,0.58)';

/* --- 캔들 시장 규모 성장 차트 --- */
function renderCandleMarketChart() {
  const ctx = document.getElementById('chart-candle-market');
  if (!ctx || ctx.chart) return;

  const startYear = 2024;
  const endYear = 2033;
  const startValue = MARKET.candleMarket2024;
  const cagr = MARKET.candleCAGR / 100;

  const labels = [];
  const data = [];
  for (let y = startYear; y <= endYear; y++) {
    labels.push(y + '');
    data.push(Math.round(startValue * Math.pow(1 + cagr, y - startYear)));
  }

  ctx.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: '시장 규모 (억 원, 추정)',
        data,
        backgroundColor: data.map((_, i) =>
          i === 0 ? '#cba258' :
          i === data.length - 1 ? '#5C3D2E' :
          'rgba(203,162,88,0.35)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 1000, easing: 'easeOutCubic' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E1209',
          titleColor: '#fff',
          bodyColor: 'rgba(255,255,255,0.85)',
          cornerRadius: 8,
          padding: 12,
          callbacks: { label: (c) => `약 ${c.raw.toLocaleString()}억 원` }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 2000,
          ticks: { callback: (v) => v.toLocaleString() + '억' },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

/* --- BEP 차트 --- */
function renderBEPChart() {
  const ctx = document.getElementById('chart-bep');
  if (!ctx || ctx.chart) return;

  // 월 판매량 기반 BEP (x=0~200개/월)
  const labels = [];
  const revenueData = [];
  const costData = [];

  for (let q = 0; q <= 200; q += 10) {
    labels.push(q);
    revenueData.push(q * UNIT_ECONOMICS.price);                          // 월 매출
    costData.push(BUDGET.monthlyFixed + q * UNIT_ECONOMICS.totalVariableCost); // 월 총비용
  }

  ctx.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '월 매출',
          data: revenueData,
          borderColor: '#006241',
          backgroundColor: 'rgba(0,98,65,0.06)',
          fill: true,
          tension: 0.2,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
        },
        {
          label: '월 총비용 (고정58만 + 변동비)',
          data: costData,
          borderColor: '#c82014',
          backgroundColor: 'rgba(200,32,20,0.03)',
          fill: false,
          tension: 0.2,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 1200, easing: 'easeOutCubic' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 }
        },
        tooltip: {
          backgroundColor: '#1E1209',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (c) => `${c.dataset.label}: ${Math.round(c.raw / 10000).toLocaleString()}만 원`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: '월 판매량 (개/월)', font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: '월 금액', font: { size: 11 } },
          ticks: { callback: (v) => (v / 10000).toLocaleString() + '만' },
          grid: { color: 'rgba(0,0,0,0.04)' }
        }
      }
    }
  });
}

/* --- 도넛 차트 --- */
function renderDonutChart() {
  const ctx = document.getElementById('chart-donut');
  if (!ctx || ctx.chart) return;

  const data = [
    UNIT_ECONOMICS.directMaterialsTotal,
    UNIT_ECONOMICS.variablePackingLogistics + UNIT_ECONOMICS.fundingFee,
    UNIT_ECONOMICS.contributionMargin
  ];

  const labels = [
    `직접재료비 (${UNIT_ECONOMICS.directMaterialsTotal.toLocaleString()}원)`,
    `변동비·수수료 (${(UNIT_ECONOMICS.variablePackingLogistics + UNIT_ECONOMICS.fundingFee).toLocaleString()}원)`,
    `공헌이익 (${UNIT_ECONOMICS.contributionMargin.toLocaleString()}원)`
  ];

  ctx.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#8B6F47', '#cba258', '#006241'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '58%',
      animation: { duration: 1000, easing: 'easeOutCubic' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 14, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: '#1E1209',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (c) => {
              const pct = Math.round(c.raw / UNIT_ECONOMICS.price * 100);
              return ` ${c.label} — ${pct}%`;
            }
          }
        }
      }
    }
  });
}

/* --- 자금 사용처 파이차트 --- */
function renderFundingPieChart() {
  const ctx = document.getElementById('chart-funding-pie');
  if (!ctx || ctx.chart) return;

  // BUDGET 기반: 설립자금 + 운영자금 (0원 항목 제외)
  const allItems = [
    ...BUDGET.setup.map(i => ({ name: i.name, cost: i.cost })),
    ...BUDGET.operation.map(i => ({ name: i.name.split('(')[0].trim(), cost: i.cost })),
  ].filter(i => i.cost > 0);
  const labels = allItems.map(i => i.name);
  const data = allItems.map(i => i.cost / 10000);

  ctx.chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#3B2314', '#5C3D2E', '#8B6F47', '#cba258', '#dfc49d', '#006241', '#7BAF7A'],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 1000, easing: 'easeOutCubic' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 10 }, padding: 10, usePointStyle: true, pointStyle: 'circle' }
        },
        tooltip: {
          backgroundColor: '#1E1209',
          cornerRadius: 8,
          padding: 12,
          callbacks: { label: (c) => ` ${c.label}: ${c.raw}만 원` }
        }
      }
    }
  });
}

/* --- 포지셔닝 맵 (Scatter + 사분면 라인) --- */
function renderPositioningChart() {
  const ctx = document.getElementById('chart-positioning');
  if (!ctx || ctx.chart) return;

  // Build datasets: one per competitor for individual labels
  const colors = ['rgba(203,162,88,0.6)', 'rgba(139,111,71,0.6)', 'rgba(92,61,46,0.6)', '#cba258'];
  const borderColors = ['#8B6F47', '#5C3D2E', '#3B2314', '#cba258'];
  const pointSizes = [8, 8, 8, 14];

  const datasets = COMPETITORS.map((c, i) => ({
    label: c.name,
    data: [{ x: c.priceScore, y: c.diffScore }],
    backgroundColor: colors[i],
    borderColor: borderColors[i],
    borderWidth: i === 3 ? 3 : 1.5,
    pointRadius: pointSizes[i],
    pointHoverRadius: pointSizes[i] + 3,
    pointStyle: i === 3 ? 'star' : 'circle',
  }));

  // Quadrant line plugin
  const quadrantPlugin = {
    id: 'quadrantLines',
    beforeDraw(chart) {
      const { ctx: c, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
      const midX = x.getPixelForValue(1.5);  // 1.5만 원 기준선
      const midY = y.getPixelForValue(5);     // 5점 기준선

      c.save();
      c.strokeStyle = 'rgba(0,0,0,0.1)';
      c.lineWidth = 1;
      c.setLineDash([6, 4]);

      // Vertical line
      c.beginPath();
      c.moveTo(midX, top);
      c.lineTo(midX, bottom);
      c.stroke();

      // Horizontal line
      c.beginPath();
      c.moveTo(left, midY);
      c.lineTo(right, midY);
      c.stroke();

      c.restore();

      // Quadrant labels
      c.save();
      c.font = '600 11px Manrope, sans-serif';
      c.fillStyle = 'rgba(0,0,0,0.2)';
      c.fillText('저가·저차별', left + 8, bottom - 8);
      c.fillText('고가·저차별', right - 80, bottom - 8);
      c.fillText('저가·고차별', left + 8, top + 16);
      c.fillText('고가·고차별', right - 80, top + 16);
      c.restore();
    }
  };

  ctx.chart = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    plugins: [quadrantPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.4,
      animation: { duration: 1000, easing: 'easeOutCubic' },
      scales: {
        x: {
          title: { display: true, text: '가격대 (만 원)', font: { size: 12, weight: '600' } },
          min: 0,
          max: 3.5,
          ticks: {
            stepSize: 0.5,
            callback: (v) => v + '만'
          },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        y: {
          title: { display: true, text: '차별성·로컬 관계성 (10점)', font: { size: 12, weight: '600' } },
          min: 0,
          max: 10,
          ticks: { stepSize: 2 },
          grid: { color: 'rgba(0,0,0,0.04)' }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 16,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: '#1E1209',
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            title: (items) => items[0].dataset.label,
            label: (item) => {
              const c = COMPETITORS.find(comp => comp.name === item.dataset.label);
              return [
                `가격: ${c.price}`,
                `차별성: ${c.diffScore}/10`,
                `유형: ${c.type}`
              ];
            }
          }
        }
      }
    }
  });
}
