/**
 * 제주모아 — Apple Design System JS
 * Global nav + sub nav + tab-bar unified navigation
 * Google Maps Embed — 권역별 좌표로 지도 이동
 */
document.addEventListener('DOMContentLoaded', function () {

  /* ============================================================
     Google Maps Embed — 권역별 설정
     center: 해당 권역 중심 좌표 (위도, 경도)
     zoom:   Google Maps 줌 레벨 (숫자 클수록 확대)
     label:  배지에 표시할 텍스트
     pins:   오버레이 핀 위치 (iframe 위에 % 좌표로 표시)
             left/top: 지도 컨테이너 기준 퍼센트
     ============================================================ */
  var REGION_MAP = {
    all: {
      lat: 36.5, lng: 127.8, zoom: 7,
      label: '🗺 전국 전체',
      pins: [
        { left: 37, top: 14, status: 'available', name: 'M-01' },
        { left: 43, top: 17, status: 'available', name: 'M-07' },
        { left: 46, top: 11, status: 'busy',      name: 'M-12' },
        { left: 65, top: 12, status: 'available', name: 'G-02' },
        { left: 38, top: 31, status: 'available', name: 'C-01' },
        { left: 67, top: 35, status: 'available', name: 'Y-03' },
        { left: 28, top: 52, status: 'available', name: 'J-01' },
        { left: 42, top: 82, status: 'available', name: '제주-01' },
        { left: 58, top: 80, status: 'available', name: '제주-04' },
        { left: 48, top: 85, status: 'busy',      name: '제주-02' },
      ]
    },
    metro: {
      lat: 37.5665, lng: 126.978, zoom: 10,
      label: '📍 수도권',
      pins: [
        { left: 34, top: 42, status: 'available', name: 'M-01' },
        { left: 52, top: 52, status: 'available', name: 'M-07' },
        { left: 60, top: 32, status: 'busy',      name: 'M-12' },
        { left: 40, top: 72, status: 'available', name: 'M-03' },
      ]
    },
    gangwon: {
      lat: 37.8228, lng: 128.1555, zoom: 9,
      label: '📍 강원권',
      pins: [
        { left: 38, top: 40, status: 'available', name: 'G-02' },
        { left: 62, top: 58, status: 'busy',      name: 'G-08' },
      ]
    },
    chungcheong: {
      lat: 36.6424, lng: 127.489, zoom: 9,
      label: '📍 충청권',
      pins: [
        { left: 30, top: 38, status: 'available', name: 'C-01' },
        { left: 55, top: 52, status: 'available', name: 'C-05' },
        { left: 68, top: 36, status: 'busy',      name: 'C-11' },
      ]
    },
    gyeongsang: {
      lat: 35.7278, lng: 128.676, zoom: 9,
      label: '📍 경상권',
      pins: [
        { left: 30, top: 28, status: 'available', name: 'Y-03' },
        { left: 55, top: 42, status: 'available', name: 'Y-09' },
        { left: 48, top: 62, status: 'busy',      name: 'Y-14' },
        { left: 36, top: 70, status: 'available', name: 'Y-07' },
      ]
    },
    jeolla: {
      lat: 35.7175, lng: 127.153, zoom: 9,
      label: '📍 전라권',
      pins: [
        { left: 28, top: 40, status: 'available', name: 'J-01' },
        { left: 52, top: 55, status: 'available', name: 'J-06' },
        { left: 65, top: 68, status: 'busy',      name: 'J-13' },
      ]
    },
    jeju: {
      lat: 33.4996, lng: 126.5312, zoom: 10,
      label: '📍 제주권',
      pins: [
        { left: 32, top: 45, status: 'available', name: '제주-01' },
        { left: 60, top: 40, status: 'available', name: '제주-04' },
        { left: 48, top: 58, status: 'busy',      name: '제주-02' },
      ]
    },
  };

  /* Google Maps Embed URL 생성 */
  function buildMapUrl(region) {
    var cfg = REGION_MAP[region] || REGION_MAP.all;
    // Google Maps Embed — Place 모드 (키 불필요)
    // zoom은 쿼리 파라미터로 직접 제어 불가하므로 pb 파라미터의 줌 값 조정
    var z = cfg.zoom || 7;
    return 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d' +
      zoomToDiameter(z) + '!2d' + cfg.lng + '!3d' + cfg.lat +
      '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sko!2skr!4v1720000000000';
  }

  /* 줌 레벨 → pb d 값 변환 (근사) */
  function zoomToDiameter(zoom) {
    // d값이 클수록 더 넓게 보임 (줌 7=전국, 10=광역시)
    var table = { 6:5000000, 7:2500000, 8:1200000, 9:600000, 10:200000, 11:80000, 12:30000 };
    return table[zoom] || 1200000;
  }

  /* 핀 오버레이 렌더링 */
  function renderPins(region) {
    var overlay = document.getElementById('map-pin-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    var cfg = REGION_MAP[region] || REGION_MAP.all;
    cfg.pins.forEach(function (p, i) {
      var pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.style.left = p.left + '%';
      pin.style.top  = p.top  + '%';
      pin.style.animationDelay = (i * 0.06) + 's';

      var isAvail = p.status === 'available';
      pin.innerHTML =
        '<div class="map-pin-head ' + (isAvail ? 'map-pin-avail-head' : 'map-pin-busy-head') + '">' +
          '<div class="map-pin-head-inner">' + (isAvail ? '🚚' : '✕') + '</div>' +
        '</div>' +
        '<div class="map-pin-tail"></div>';

      overlay.appendChild(pin);
    });
  }

  /* 지도 + 배지 + 핀 업데이트 */
  function updateMap(region) {
    var frame  = document.getElementById('gmap-frame');
    var badge  = document.getElementById('map-region-badge');
    var cfg    = REGION_MAP[region] || REGION_MAP.all;

    if (badge) badge.textContent = cfg.label;

    if (frame) {
      // 로딩 페이드
      frame.style.opacity = '0.4';
      frame.src = buildMapUrl(region);
      frame.onload = function () {
        frame.style.opacity = '1';
      };
    }

    renderPins(region);
  }

  /* 초기 지도 로드 */
  updateMap('all');



  /* ── Tab Navigation ── */
  var screens   = document.querySelectorAll('.screen');
  var gnNavBtns = document.querySelectorAll('.gnav-link');
  var tabBtns   = document.querySelectorAll('.tab-btn');
  var subLinks  = document.querySelectorAll('.subnav-link, [data-tab]');

  var subnavTitles = {
    home:       '홈 대시보드',
    harvest:    'AI 수확 예측',
    monitoring: '실시간 모니터링',
    vehicle:    '차량 매칭',
  };

  function switchTab(id) {
    screens.forEach(function (s) {
      var on = s.id === 'screen-' + id;
      s.classList.toggle('active', on);
      if (on) s.scrollTop = 0;
    });
    gnNavBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === id); });
    tabBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.tab === id); });

    var titleEl = document.getElementById('subnav-title');
    if (titleEl) titleEl.textContent = subnavTitles[id] || '';
  }

  gnNavBtns.forEach(function (b) { b.addEventListener('click', function () { switchTab(this.dataset.tab); }); });
  tabBtns.forEach(function (b)   { b.addEventListener('click', function () { switchTab(this.dataset.tab); }); });

  document.querySelectorAll('[data-tab]').forEach(function (el) {
    if (el.classList.contains('gnav-link') || el.classList.contains('tab-btn')) return;
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      switchTab(this.dataset.tab);
    });
  });

  /* ── Clock ── */
  function tick() {
    var now = new Date();
    var hm  = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    var el  = document.getElementById('gnav-time');
    if (el) el.textContent = hm;
  }
  tick(); setInterval(tick, 10000);

  /* ── Vehicle Data ── */
  var vehicles = [
    { id:1,  region:'metro',       name:'1톤 트럭 #M-01', driver:'이민준 기사', ton:'1톤',   dist:'2.1km', status:'available' },
    { id:2,  region:'metro',       name:'2.5톤 #M-07',    driver:'박서준 기사', ton:'2.5톤', dist:'3.4km', status:'available' },
    { id:3,  region:'metro',       name:'5톤 #M-12',      driver:'최지우 기사', ton:'5톤',   dist:'4.7km', status:'busy'      },
    { id:4,  region:'metro',       name:'1톤 트럭 #M-03', driver:'정하은 기사', ton:'1톤',   dist:'5.9km', status:'available' },
    { id:5,  region:'gangwon',     name:'2.5톤 #G-02',    driver:'강도윤 기사', ton:'2.5톤', dist:'1.8km', status:'available' },
    { id:6,  region:'gangwon',     name:'11톤 #G-08',     driver:'윤서아 기사', ton:'11톤',  dist:'6.2km', status:'busy'      },
    { id:7,  region:'chungcheong', name:'1톤 트럭 #C-01', driver:'임지호 기사', ton:'1톤',   dist:'2.5km', status:'available' },
    { id:8,  region:'chungcheong', name:'5톤 #C-05',      driver:'한소희 기사', ton:'5톤',   dist:'3.1km', status:'available' },
    { id:9,  region:'chungcheong', name:'2.5톤 #C-11',    driver:'오준혁 기사', ton:'2.5톤', dist:'7.3km', status:'busy'      },
    { id:10, region:'gyeongsang',  name:'1톤 트럭 #Y-03', driver:'신예은 기사', ton:'1톤',   dist:'1.2km', status:'available' },
    { id:11, region:'gyeongsang',  name:'2.5톤 #Y-09',    driver:'배민준 기사', ton:'2.5톤', dist:'4.0km', status:'available' },
    { id:12, region:'gyeongsang',  name:'11톤 #Y-14',     driver:'조아라 기사', ton:'11톤',  dist:'8.5km', status:'busy'      },
    { id:13, region:'gyeongsang',  name:'5톤 #Y-07',      driver:'류시현 기사', ton:'5톤',   dist:'3.6km', status:'available' },
    { id:14, region:'jeolla',      name:'1톤 트럭 #J-01', driver:'권나래 기사', ton:'1톤',   dist:'0.9km', status:'available' },
    { id:15, region:'jeolla',      name:'2.5톤 #J-06',    driver:'문준영 기사', ton:'2.5톤', dist:'2.8km', status:'available' },
    { id:16, region:'jeolla',      name:'5톤 #J-13',      driver:'남지혜 기사', ton:'5톤',   dist:'5.4km', status:'busy'      },
    { id:17, region:'jeju',        name:'1톤 트럭 #제주-01', driver:'고민수 기사', ton:'1톤',   dist:'1.5km', status:'available' },
    { id:18, region:'jeju',        name:'2.5톤 #제주-04',    driver:'부경아 기사', ton:'2.5톤', dist:'2.3km', status:'available' },
    { id:19, region:'jeju',        name:'1톤 트럭 #제주-02', driver:'현도영 기사', ton:'1톤',   dist:'3.7km', status:'busy'      },
  ];

  var regionNames = { all:'전체 차량 현황', metro:'수도권 차량 현황', gangwon:'강원권 차량 현황', chungcheong:'충청권 차량 현황', gyeongsang:'경상권 차량 현황', jeolla:'전라권 차량 현황', jeju:'제주권 차량 현황' };

  var aiRecs = {
    metro:       [['#M-07','2.5톤','3.4km','적재효율 97%'],['#M-01','1톤','2.1km','근거리 최적'],['#M-03','1톤','5.9km','예비 배정']],
    gangwon:     [['#G-02','2.5톤','1.8km','최근거리'],['#G-08','11톤','6.2km','대량 출하']],
    chungcheong: [['#C-05','5톤','3.1km','적재 효율 최상'],['#C-01','1톤','2.5km','소량 특화'],['#C-11','2.5톤','7.3km','예비']],
    gyeongsang:  [['#Y-03','1톤','1.2km','근거리 1위'],['#Y-09','2.5톤','4.0km','통합 배차 최적'],['#Y-07','5톤','3.6km','대량']],
    jeolla:      [['#J-01','1톤','0.9km','최근거리'],['#J-06','2.5톤','2.8km','효율 최상'],['#J-13','5톤','5.4km','운행 복귀 예정']],
    jeju:        [['#제주-01','1톤','1.5km','제주 로컬'],['#제주-04','2.5톤','2.3km','통합 배차'],['#제주-02','1톤','3.7km','복귀 후 배정']],
  };

  var curRegion = 'all', curFilter = 'all', selected = new Set();

  function renderList() {
    var list  = document.getElementById('vc-list');
    var title = document.getElementById('vc-region-title');
    var count = document.getElementById('vc-avail-count');
    if (!list) return;

    var filtered = vehicles.filter(function (v) {
      return (curRegion === 'all' || v.region === curRegion) &&
             (curFilter === 'all' || v.status === curFilter);
    });

    var avail = filtered.filter(function (v) { return v.status === 'available'; }).length;
    if (title) title.textContent = regionNames[curRegion] || '차량 현황';
    if (count) count.textContent = avail + '대 가능';

    list.innerHTML = '';
    if (!filtered.length) {
      list.innerHTML = '<p style="padding:var(--sp-xxl) 0;text-align:center;font-size:14px;color:var(--c-ink-48);letter-spacing:-0.224px;">해당 조건의 차량이 없습니다.</p>';
      return;
    }

    filtered.forEach(function (v) {
      var ok  = v.status === 'available';
      var sel = selected.has(v.id);
      var el  = document.createElement('div');
      el.className = 'vc-item' + (sel ? ' selected' : '');
      el.innerHTML =
        '<div class="vc-icon">🚚</div>' +
        '<div class="vc-body"><div class="vc-name">' + v.name + '</div>' +
        '<div class="vc-info">' + v.driver + ' · ' + v.ton + ' · ' + v.dist + '</div></div>' +
        '<span class="vc-badge ' + (ok ? 'vc-badge-ok' : 'vc-badge-busy') + '">' + (ok ? '배차 가능' : '운행 중') + '</span>';
      if (ok) el.addEventListener('click', function () {
        if (selected.has(v.id)) selected.delete(v.id); else selected.add(v.id);
        renderList();
      });
      list.appendChild(el);
    });
  }

  function renderAI(region) {
    var body = document.getElementById('ai-body');
    if (!body) return;
    if (!region || region === 'all') { body.innerHTML = '<span class="ai-empty">권역을 선택하면 AI가 최적 차량 TOP 3를 추천합니다.</span>'; return; }
    var recs = aiRecs[region];
    if (!recs) { body.innerHTML = '<span class="ai-empty">해당 권역 추천 데이터 없음</span>'; return; }
    body.innerHTML = recs.map(function (r, i) {
      return '<div class="ai-rec-item">' +
        '<span class="ai-rank">' + (i+1) + '위</span>' +
        '<div><div class="ai-name">' + r[0] + ' · ' + r[1] + '</div>' +
        '<div class="ai-detail">' + r[2] + ' · ' + r[3] + '</div></div>' +
        '<span class="ai-score">' + [97,93,88][i] + '%</span></div>';
    }).join('');
  }

  document.querySelectorAll('.btn-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.btn-chip').forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
      curRegion = this.dataset.region;
      selected.clear();
      renderList();
      renderAI(curRegion === 'all' ? null : curRegion);
      // 구글 지도 업데이트
      updateMap(curRegion);
    });
  });

  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      curFilter = this.dataset.filter;
      renderList();
    });
  });

  document.querySelectorAll('.kr-region-app').forEach(function (g) {
    g.addEventListener('click', function () {
      var chip = document.querySelector('.btn-chip[data-region="' + this.dataset.region + '"]');
      if (chip) chip.click();
    });
  });

  renderList();

  /* ── Sensor simulation ── */
  var s = { temp:24.3, humid:68, rain:2.1, mature:85.0 };

  function rand(r) { return (Math.random()*r*2 - r); }

  function tick2() {
    s.temp   = Math.max(18, Math.min(32,  s.temp   + rand(0.3)));
    s.humid  = Math.max(50, Math.min(90,  s.humid  + rand(1)));
    s.rain   = Math.max(0,  Math.min(10,  s.rain   + rand(0.2)));
    s.mature = Math.max(80, Math.min(100, s.mature + rand(0.05)));

    var ids = { 'home-temp': s.temp.toFixed(1)+'°C', 'mon-temp': s.temp.toFixed(1)+'°C', 'mon-humid': Math.round(s.humid)+'%', 'mon-rain': s.rain.toFixed(1)+'mm', 'mon-mature': s.mature.toFixed(1)+'%' };
    Object.keys(ids).forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = ids[id]; });

    var row = document.getElementById('sensor-row-0');
    if (row) {
      var now  = new Date();
      var time = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
      var warn = s.temp > 29 || s.humid > 84;
      row.innerHTML = '<td>'+time+'</td><td>'+s.temp.toFixed(1)+'</td><td>'+Math.round(s.humid)+'</td><td>'+s.rain.toFixed(1)+'</td><td>'+s.mature.toFixed(1)+'</td><td>10.8</td><td><span class="status-pill '+(warn?'sp-warn':'sp-ok')+'">'+(warn?'주의':'정상')+'</span></td>';
    }
  }

  setInterval(tick2, 4000);

  /* ── Vehicle screen layout fix on mobile ── */
  function fixVcLayout() {
    var layout = document.getElementById('vc-layout');
    if (!layout) return;
    if (window.innerWidth <= 768) {
      layout.style.gridTemplateColumns = '1fr';
      layout.style.height = 'auto';
    } else {
      layout.style.gridTemplateColumns = '320px 1fr';
      layout.style.height = '100%';
    }
  }
  fixVcLayout();
  window.addEventListener('resize', fixVcLayout);

});
