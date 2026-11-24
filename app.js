const METRIC_LABEL = {
  고위험음주율: '고위험음주율',
  월간음주율: '월간음주율',
  연간음주자_고위험음주율: '연간음주자의 고위험음주율',
};
const TYPE_LABEL = { 표준화: '표준화율', 조율: '조율' };
const AGE_METRICS = ['연간음주율', '월간음주율', '월간폭음률', '고위험음주율'];
const C = { ink: 'rgba(0,0,0,0.87)', ink2: 'rgba(0,0,0,0.58)', line: '#e7e7e7', a1: '#1E3932', a2: '#00754A', a3: '#9fcbb6', gold: '#cba258' };

const state = { metric: '고위험음주율', type: '표준화', rank: 'top', search: '', sido: '', selected: null };
let regions = [], ages = [], adultAvg = {}, ttest = [], rankChart = null, rankIds = [];

const $ = (s) => document.querySelector(s);
const fmt = (v, d = 1) => (v == null ? '–' : Number(v).toFixed(d));
const signed = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%p';
const key = () => `${state.metric}_${state.type}`;
const label = () => `${METRIC_LABEL[state.metric]} (${TYPE_LABEL[state.type]})`;

async function loadJSON(name) {
  const res = await fetch(name);
  if (!res.ok) throw new Error(`${name} (${res.status})`);
  return res.json();
}

async function init() {
  try {
    const [map, age, tt] = await Promise.all(['drinking_map_data.json', 'age_metrics.json', 'gender_ttest.json'].map(loadJSON));
    regions = map.map((r) => {
      const [sido, ...rest] = r['지역명_매칭'].split(' ');
      return { ...r, sido, name: rest.join(' ') };
    });
    ages = age.filter((a) => a['세부구분'] !== '19세이상');
    adultAvg = age.find((a) => a['세부구분'] === '19세이상') || {};
    ttest = tt;
  } catch (err) {
    const box = $('#load-error');
    box.hidden = false;
    box.innerHTML = `🍶 데이터를 불러오지 못했어요 (${err.message}).<br>
      JSON 파일 3개(<code>drinking_map_data.json</code>, <code>age_metrics.json</code>, <code>gender_ttest.json</code>)가 index.html과 같은 폴더에 있는지 확인해 주세요.
      파일을 더블클릭해 <code>file://</code>로 열면 브라우저가 fetch를 막으니, <code>python3 -m http.server</code> 같은 로컬 서버나 GitHub Pages로 열어 주세요.`;
    return;
  }

  if (window.Chart) {
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = C.ink2;
  }
  renderFacts();
  renderMiniMap();
  setupCheck();
  setupSurvey();
  setupMap();
  renderAgeChart();
  renderGender();
  initMarket();
}

/* ---------- 1. Hero facts ---------- */
function renderFacts() {
  const k = '고위험음주율_표준화';
  const valid = regions.filter((r) => r[k] != null).sort((a, b) => b[k] - a[k]);
  const top = valid[0], low = valid[valid.length - 1];
  $('#f-top').textContent = `${top.name} ${fmt(top[k])}%`;
  $('#f-top-desc').innerHTML = `고위험음주율 1위 <b>${top.name} (${fmt(top[k])}%)</b> vs 가장 낮은 <b>${low.name} (${fmt(low[k])}%)</b> · 표준화율`;

  const gap = ttest.reduce((m, t) => (t['차이(남-여, %p)'] > m['차이(남-여, %p)'] ? t : m));
  $('#f-gap').textContent = `${gap['지표']} +${fmt(gap['차이(남-여, %p)'], 2)}%p`;
  $('#f-gap-desc').innerHTML = `남 <b>${fmt(gap['남자_평균(%)'], 2)}%</b> vs 여 <b>${fmt(gap['여자_평균(%)'], 2)}%</b>, p = ${gap['p_value']}`;

  const peak = ages.reduce((m, a) => (a['고위험음주율'] > m['고위험음주율'] ? a : m));
  $('#f-peak').textContent = `${peak['세부구분']} ${fmt(peak['고위험음주율'])}%`;
  $('#f-peak-desc').textContent = `고위험음주율이 ${peak['세부구분']}에서 정점을 찍고 이후 내려갑니다.`;
}

function renderMiniMap() {
  const k = '고위험음주율_표준화', vals = regions.map((r) => r[k]).filter((v) => v != null);
  const min = Math.min(...vals), max = Math.max(...vals), maxX = Math.max(...regions.map((r) => r.x));
  const el = $('#mini-map');
  el.style.gridTemplateColumns = `repeat(${maxX + 1}, minmax(0, 1fr))`;
  el.innerHTML = regions.map((r, i) => `<i style="grid-column:${r.x + 1};grid-row:${r.y + 1};background:${r[k] == null ? '#edebe9' : colorFor((r[k] - min) / (max - min))};animation-delay:${(r.y * 18 + r.x * 6)}ms"></i>`).join('');
}

/* ---------- 3. 내 포지션 체크 ---------- */
function setupCheck() {
  const sidos = [...new Set(regions.map((r) => r.sido))].sort((a, b) => a.localeCompare(b, 'ko'));
  $('#c-age').innerHTML = ages.map((a) => `<option>${a['세부구분']}</option>`).join('');
  $('#c-sido').innerHTML = sidos.map((s) => `<option>${s}</option>`).join('');
  $('#m-sido').innerHTML += sidos.map((s) => `<option>${s}</option>`).join('');
  $('#c-age').value = '30-39세';
  $('#c-sido').value = '서울특별시';

  $('#c-sido').addEventListener('change', () => { fillSgg(); selectRegion($('#c-sgg').value); });
  $('#c-sgg').addEventListener('change', () => selectRegion($('#c-sgg').value));
  $('#c-gender').addEventListener('change', renderGroup);
  $('#c-age').addEventListener('change', renderGroup);
  fillSgg();
  selectRegion($('#c-sgg').value);
  renderGroup();
}

function fillSgg() {
  const list = regions.filter((r) => r.sido === $('#c-sido').value).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  $('#c-sgg').innerHTML = list.map((r) => `<option value="${r['지역명_매칭']}">${r.name}</option>`).join('');
}

function selectRegion(id) {
  state.selected = id;
  const r = regions.find((x) => x['지역명_매칭'] === id);
  if (r && $('#c-sido').value !== r.sido) { $('#c-sido').value = r.sido; fillSgg(); }
  $('#c-sgg').value = id;
  renderMap(); // 랭킹 막대 하이라이트까지 갱신
  document.querySelectorAll('.cell').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
}

function renderRegion() {
  const r = regions.find((x) => x['지역명_매칭'] === state.selected);
  if (!r) return;
  const k = key();
  const valid = regions.filter((x) => x[k] != null).sort((a, b) => b[k] - a[k]);
  const rank = valid.indexOf(r) + 1;
  $('#o-region').textContent = `${r.sido} ${r.name}`;
  $('#o-region-num').textContent = r[k] == null ? '데이터 없음' : `${fmt(r[k])}%`;
  $('#o-region-rank').innerHTML = r[k] == null ? '' :
    `${label()} · 전국 ${valid.length}개 중 <b>${rank}위</b> (${rank <= valid.length / 2 ? `상위 ${Math.ceil((rank / valid.length) * 100)}%` : `하위 ${Math.ceil(((valid.length - rank + 1) / valid.length) * 100)}%`})`;
}

function renderGroup() {
  const g = $('#c-gender').value, a = $('#c-age').value;
  const row = ages.find((x) => x['세부구분'] === a);
  $('#o-group').textContent = `${a} ${g}`;
  $('#o-group-list').innerHTML = AGE_METRICS.map((m) => {
    const v = row[`${m}_${g}`], avg = adultAvg[m];
    if (v == null) return `<li><span>${m}</span><span class="v">–</span></li>`;
    const d = v - avg;
    return `<li><span>${m}</span><span class="v">${fmt(v)}%</span>
      <span class="diff ${d > 0 ? 'up' : ''}">평균 ${fmt(avg)}% 대비 ${signed(d)}</span>
      <span class="gbar" title="막대: 내 구간 · 선: 성인 평균"><i style="width:${v}%"></i><em style="left:${avg}%"></em></span></li>`;
  }).join('');
}

/* ---------- 3-1. 셀프 체크 설문 ---------- */
const LEVELS = [
  { name: '논알콜 라이프', desc: '최근 1년 술 0잔. 술자리에선 사이다 담당.', metric: null },
  { name: '이벤트 음주러', desc: '1년에 몇 번, 명절·회식 때만 등판하는 타입.', metric: '연간음주율' },
  { name: '정기 술자리러', desc: '한 달에 한 번 이상은 잔을 드는 꾸준한 타입.', metric: '월간음주율' },
  { name: '한 번 앉으면 달리는 편', desc: '월 1회 이상, 한 자리에서 폭음 기준선을 넘깁니다.', metric: '월간폭음률' },
  { name: '주당 루틴 (고위험 구간)', desc: '주 2회 이상 진하게. 통계상 고위험음주에 해당해요. 간에게도 휴일을 챙겨 주세요.', metric: '고위험음주율' },
];
const cutText = (g) => (g === '여자' ? '소주 5잔(맥주 3캔)' : '소주 7잔(맥주 5캔)');

function setupSurvey() {
  const form = $('#survey-form');
  const sync = () => {
    $('#q4-cut').textContent = cutText($('#c-gender').value);
    const off = form.q1.value === '0';
    form.querySelectorAll('.drinker').forEach((f) => { f.disabled = off; });
  };
  form.addEventListener('change', sync);
  $('#c-gender').addEventListener('change', () => { sync(); if (!$('#survey-out').hidden) form.requestSubmit(); });
  $('#c-age').addEventListener('change', () => { if (!$('#survey-out').hidden) form.requestSubmit(); });
  sync();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (n) => (form[n].value === '' ? null : Number(form[n].value));
    const [q1, q2, q3, q4] = ['q1', 'q2', 'q3', 'q4'].map(v);
    if (q1 === 1 && [q2, q3, q4].includes(null)) { alert('Q2~Q4에도 답해 주세요 🍶'); return; }
    const g = $('#c-gender').value, a = $('#c-age').value;
    const level = surveyLevel(g, q1, q2, q3, q4);
    showSurvey(level, g, a);
  });
}

// KOSIS 정의: 월간음주=월1회+, 월간폭음=기준잔 이상 월1회+, 고위험=1회 평균 기준잔 이상 & 주2회+
function surveyLevel(gender, q1, q2, q3, q4) {
  if (q1 === 0) return 0;
  const cut = gender === '여자' ? 5 : 7;
  if ((q2 >= 3 && q3 >= cut) || q4 === 4) return 4;
  if (q4 >= 2) return 3;
  if (q2 >= 1) return 2;
  return 1;
}

function showSurvey(level, g, a) {
  const L = LEVELS[level], row = ages.find((x) => x['세부구분'] === a) || {};
  $('#survey-out').hidden = false;
  $('#s-lv').textContent = `LV.${level}`;
  $('#s-level').textContent = L.name;
  $('#s-desc').textContent = L.desc;
  $('#s-ladder').innerHTML = LEVELS.map((x, i) => `<li class="${i === level ? 'me' : ''} ${i < level ? 'past' : ''}">${x.name}${i === level ? ' ← 나' : ''}</li>`).join('');
  let txt;
  if (level === 0) {
    const r = row[`연간음주율_${g}`];
    txt = r == null ? '' : `${a} ${g} 중 1년간 한 잔도 안 마신 사람은 약 <b>${fmt(100 - r)}%</b>. 꽤 희귀한 편이에요.`;
  } else {
    const r = row[`${L.metric}_${g}`];
    txt = r == null ? '' : `${a} ${g} 중 <b>${fmt(r)}%</b>가 '${L.metric}' 기준에 해당해요 (성인 전체 ${fmt(adultAvg[L.metric])}%).`;
    const reg = regions.find((x) => x['지역명_매칭'] === state.selected);
    if (level === 4 && reg) txt += ` 내 동네 ${reg.name}의 고위험음주율은 ${fmt(reg['고위험음주율_표준화'])}%예요.`;
  }
  $('#s-compare').innerHTML = txt;
}

console.assert(surveyLevel('남자', 0) === 0 && surveyLevel('남자', 1, 0, 1, 0) === 1 && surveyLevel('남자', 1, 2, 3, 1) === 2
  && surveyLevel('남자', 1, 2, 5, 2) === 3 && surveyLevel('여자', 1, 3, 5, 2) === 4 && surveyLevel('남자', 1, 3, 5, 2) === 3
  && surveyLevel('남자', 1, 1, 3, 4) === 4, 'surveyLevel self-check');

/* ---------- 4. 블록맵 & 랭킹 ---------- */
function colorFor(t) {
  // 연한 민트 → House Green 단색 농도 스케일
  const a = [226, 239, 233], b = [30, 57, 50];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
}

function setupMap() {
  const maxX = Math.max(...regions.map((r) => r.x)), maxY = Math.max(...regions.map((r) => r.y));
  const map = $('#blockmap');
  map.style.gridTemplateColumns = `repeat(${maxX + 1}, minmax(0, 1fr))`;
  map.innerHTML = regions.map((r) =>
    `<div class="cell" data-id="${r['지역명_매칭']}" style="grid-column:${r.x + 1};grid-row:${r.y + 1}">
      <span class="n">${r.name.replace(/(특별자치)?[시군구]$/, '') || r.name}</span><span class="v"></span></div>`).join('');

  const tip = $('#tooltip'), card = map.parentElement;
  map.addEventListener('mousemove', (e) => {
    const el = e.target.closest('.cell');
    if (!el) { tip.hidden = true; return; }
    const r = regions.find((x) => x['지역명_매칭'] === el.dataset.id), k = key();
    tip.innerHTML = `${r.sido} ${r.name}<br><b>${r[k] == null ? '데이터 없음' : fmt(r[k]) + '%'}</b> <span style="opacity:.7">${label()}</span>`;
    tip.hidden = false;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left + 14, y = e.clientY - box.top + 14;
    tip.style.left = Math.min(x, box.width - tip.offsetWidth - 8) + 'px';
    tip.style.top = y + 'px';
  });
  map.addEventListener('mouseleave', () => { tip.hidden = true; });
  map.addEventListener('click', (e) => {
    const el = e.target.closest('.cell');
    if (el) selectRegion(el.dataset.id);
  });

  const seg = (sel, prop) => $(sel).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $(sel).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    state[prop] = b.dataset.v;
    renderMap();
  });
  seg('#metric-seg', 'metric');
  seg('#type-seg', 'type');
  seg('#rank-seg', 'rank');
  $('#m-search').addEventListener('input', (e) => { state.search = e.target.value.trim(); renderMap(); });
  $('#m-sido').addEventListener('change', (e) => { state.sido = e.target.value; renderMap(); });
  renderMap();
  selectRegion(state.selected);
}

function renderMap() {
  const k = key();
  const vals = regions.map((r) => r[k]).filter((v) => v != null);
  const min = Math.min(...vals), max = Math.max(...vals);
  const match = (r) => (!state.sido || r.sido === state.sido) && (!state.search || `${r.sido} ${r.name}`.includes(state.search));

  document.querySelectorAll('.cell').forEach((el) => {
    const r = regions.find((x) => x['지역명_매칭'] === el.dataset.id), v = r[k];
    const t = v == null ? 0 : (v - min) / (max - min || 1);
    el.classList.toggle('na', v == null);
    el.style.background = v == null ? '' : colorFor(t);
    el.style.color = v == null ? '' : t > 0.45 ? '#fff' : C.ink;
    el.querySelector('.v').textContent = v == null ? '' : fmt(v);
    el.classList.toggle('dim', !match(r));
  });
  $('#legend').innerHTML = `<span>${fmt(min)}%</span><span class="bar" style="background:linear-gradient(90deg,${colorFor(0)},${colorFor(1)})"></span><span>${fmt(max)}%</span><span>· ${label()}</span>`;
  renderRank(match);
  renderRegion();
}

function renderRank(match) {
  if (!window.Chart) return;
  const k = key();
  const pool = regions.filter((r) => r[k] != null && match(r)).sort((a, b) => b[k] - a[k]);
  const list = state.rank === 'top' ? pool.slice(0, 10) : pool.slice(-10).reverse();
  const data = {
    labels: list.map((r) => `${r.name} (${r.sido.slice(0, 2)})`),
    datasets: [{
      data: list.map((r) => r[k]),
      backgroundColor: list.map((r) => (r['지역명_매칭'] === state.selected ? C.gold : state.rank === 'top' ? C.a2 : C.a3)),
      borderRadius: 4, barThickness: 22,
    }],
  };
  rankIds = list.map((r) => r['지역명_매칭']);
  if (rankChart) { rankChart.data = data; rankChart.update(); return; }
  rankChart = new Chart($('#rank-chart'), {
    type: 'bar', data,
    plugins: [valueLabels((v) => fmt(v) + '%')],
    options: {
      indexAxis: 'y', maintainAspectRatio: false,
      layout: { padding: { right: 40 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${fmt(c.raw)}% · ${label()}` } } },
      scales: { x: { beginAtZero: true, grace: '8%', grid: { color: C.line }, ticks: { callback: (v) => v + '%' } }, y: { grid: { display: false } } },
      onClick: (_, els) => { if (els[0]) selectRegion(rankIds[els[0].index]); },
    },
  });
}

// 가로 막대 끝 수치 라벨 플러그인
function valueLabels(text) {
  return {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = '600 12px ' + Chart.defaults.font.family;
      ctx.fillStyle = C.ink;
      ctx.textBaseline = 'middle';
      chart.getDatasetMeta(0).data.forEach((bar, i) => ctx.fillText(text(chart.data.datasets[0].data[i], i), bar.x + 6, bar.y));
      ctx.restore();
    },
  };
}

/* ---------- 5. 인사이트 ---------- */
function renderAgeChart() {
  const peak = ages.reduce((m, a) => (a['고위험음주율'] > m['고위험음주율'] ? a : m));
  $('#age-note').innerHTML = `술자리 입문(연간)은 20대가 최고, 하지만 고위험음주는 <b>${peak['세부구분']} ${fmt(peak['고위험음주율'])}%</b>에서 정점`;
  if (!window.Chart) return;
  const peakIdx = ages.indexOf(peak);
  const series = [['연간음주율', C.a3], ['월간폭음률', C.a2], ['고위험음주율', C.a1]];
  new Chart($('#age-chart'), {
    type: 'line',
    data: {
      labels: ages.map((a) => a['세부구분']),
      datasets: series.map(([m, c]) => ({
        label: m, data: ages.map((a) => a[m]), borderColor: c, backgroundColor: c, tension: 0.3, borderWidth: m === '고위험음주율' ? 3 : 2,
        pointRadius: ages.map((_, i) => (m === '고위험음주율' && i === peakIdx ? 7 : 3)),
      })),
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label} ${fmt(c.raw)}%` } } },
      scales: { y: { min: 0, max: 100, grid: { color: C.line }, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } },
    },
  });
}

function renderGender() {
  $('#t-body').innerHTML = ttest.map((t) => `<tr>
    <td>${t['지표']}</td><td>${fmt(t['남자_평균(%)'], 2)}%</td><td>${fmt(t['여자_평균(%)'], 2)}%</td>
    <td>+${fmt(t['차이(남-여, %p)'], 2)}%p</td><td>${fmt(t['t_통계량'], 2)}</td><td>${t['p_value']}</td>
    <td><span class="badge ${t['유의수준(0.05)통과'] ? 'yes' : 'no'}">${t['유의수준(0.05)통과'] ? 'p<0.05 유의' : '비유의'}</span></td></tr>`).join('');
  if (!window.Chart) return;
  new Chart($('#gender-chart'), {
    type: 'bar',
    data: {
      labels: ttest.map((t) => (t['유의수준(0.05)통과'] ? t['지표'] + ' *' : t['지표'])),
      datasets: [
        { label: '남자', data: ttest.map((t) => t['남자_평균(%)']), backgroundColor: C.a1, borderRadius: 4 },
        { label: '여자', data: ttest.map((t) => t['여자_평균(%)']), backgroundColor: C.a3, borderRadius: 4 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label} ${fmt(c.raw, 2)}%` } } },
      scales: { y: { beginAtZero: true, grid: { color: C.line }, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } },
    },
  });
}

/* ---------- 6. 주류 시장 ---------- */
// 천원 단위 → "1조 8,260억원"
function won(k) {
  const eok = Math.round((k * 1000) / 1e8), jo = Math.floor(eok / 10000), rest = eok % 10000;
  return (jo ? `${jo}조 ` : '') + (rest ? `${rest.toLocaleString()}억` : '') + '원';
}
console.assert(won(1825955843) === '1조 8,260억원', 'won() self-check');

async function initMarket() {
  let market, trend;
  try {
    [market, trend] = await Promise.all(['alcohol_market.json', 'soju_beer_trend.json'].map(loadJSON));
  } catch (err) {
    $('#market-error').hidden = false;
    $('#market-error').textContent = `🍺 시장 데이터를 불러오지 못했어요 (${err.message}). alcohol_market.json, soju_beer_trend.json이 같은 폴더에 있는지 확인해 주세요.`;
    return;
  }
  const beer = market.find((m) => m['주류'] === '맥주'), soju = market.find((m) => m['주류'] === '희석식소주');
  $('#market-note').innerHTML = `2025년 출고량 기준 <b>맥주(${fmt(beer['비중(%)'])}%)</b>와 <b>희석식소주(${fmt(soju['비중(%)'])}%)</b>가 시장의 큰 축을 차지합니다. 둘을 합치면 <b>${fmt(beer['비중(%)'] + soju['비중(%)'])}%</b>.`;

  const first = trend[0], last = trend[trend.length - 1];
  const dB = last['맥주_점유율(%)'] - first['맥주_점유율(%)'], dS = last['소주_점유율(%)'] - first['소주_점유율(%)'];
  $('#trend-note').innerHTML = `${first['연도']}년 대비 ${last['연도']}년, 맥주 점유율은 <b>${fmt(first['맥주_점유율(%)'])}% → ${fmt(last['맥주_점유율(%)'])}%</b>(${signed(dB)})로 오르고, 소주는 <b>${fmt(first['소주_점유율(%)'])}% → ${fmt(last['소주_점유율(%)'])}%</b>(${signed(dS)})로 완만히 낮아졌어요.`;
  if (!window.Chart) return;

  const main = (m) => m['주류'] === '맥주' || m['주류'] === '희석식소주';
  new Chart($('#market-chart'), {
    type: 'bar',
    data: {
      labels: market.map((m) => m['주류']),
      datasets: [{ data: market.map((m) => m['출고량_kl']), backgroundColor: market.map((m) => (main(m) ? C.a2 : C.a3)), borderRadius: 4, barThickness: 16 }],
    },
    plugins: [valueLabels((v, i) => `${fmt(market[i]['비중(%)'])}%`)],
    options: {
      indexAxis: 'y', maintainAspectRatio: false, layout: { padding: { right: 44 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${Math.round(c.raw).toLocaleString()} kl · 비중 ${fmt(market[c.dataIndex]['비중(%)'], 2)}%` } } },
      scales: {
        x: { beginAtZero: true, grid: { color: C.line }, ticks: { callback: (v) => (v / 10000).toLocaleString() + '만' } },
        y: { grid: { display: false }, ticks: { font: (c) => ({ weight: main(market[c.index]) ? '700' : '400' }) } },
      },
    },
  });

  // 첫·마지막 연도 점에 수치 주석
  const endLabels = {
    id: 'endLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = '700 12px ' + Chart.defaults.font.family;
      chart.data.datasets.forEach((ds, di) => {
        const pts = chart.getDatasetMeta(di).data, up = di === 0;
        [0, pts.length - 1].forEach((i) => {
          ctx.fillStyle = ds.borderColor;
          ctx.textAlign = i === 0 ? 'left' : 'right';
          ctx.fillText(fmt(ds.data[i]) + '%', pts[i].x, pts[i].y + (up && i > 0 ? -12 : 20));
        });
      });
      ctx.restore();
    },
  };
  new Chart($('#trend-chart'), {
    type: 'line',
    data: {
      labels: trend.map((t) => t['연도']),
      datasets: [
        { label: '맥주 점유율', data: trend.map((t) => t['맥주_점유율(%)']), borderColor: C.a2, backgroundColor: C.a2, borderWidth: 3, tension: 0.3, pointRadius: 4 },
        { label: '소주 점유율', data: trend.map((t) => t['소주_점유율(%)']), borderColor: C.a1, backgroundColor: C.a1, borderWidth: 3, tension: 0.3, pointRadius: 4, borderDash: [6, 4] },
      ],
    },
    plugins: [endLabels],
    options: {
      maintainAspectRatio: false, layout: { padding: { top: 8, left: 4, right: 4 } },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          callbacks: {
            title: (items) => `${items[0].label}년`,
            label: (c) => ` ${c.dataset.label} ${fmt(c.raw, 2)}%`,
            footer: (items) => {
              const t = trend[items[0].dataIndex];
              return [`맥주 판매액 ${won(t['맥주_판매액(천원)'])}`, `소주 판매액 ${won(t['소주_판매액(천원)'])}`];
            },
          },
        },
      },
      scales: { y: { min: 30, max: 44, grid: { color: C.line }, ticks: { callback: (v) => v + '%' } }, x: { grid: { display: false } } },
    },
  });
}

// 소주잔 아이콘
document.querySelectorAll('.shots').forEach((el) => { el.innerHTML = '<i></i>'.repeat(+el.dataset.n); });

// 스크롤 등장 효과 (모션 최소화 설정 존중)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.section, .facts').forEach((el) => { el.classList.add('reveal'); io.observe(el); });
}

init();
