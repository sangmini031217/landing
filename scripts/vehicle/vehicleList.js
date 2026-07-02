/**
 * vehicleList.js
 * 상태 필터 + 톤수 다중선택 드롭다운 + 스크롤 + AI 추천
 */
(function () {
  'use strict';

  /* ── 상태 ── */
  var currentRegion   = 'all';
  var currentStatus   = 'all';      // all | available | busy
  var selectedTons    = [];         // ['1ton','2.5ton', ...]  — 복수 선택
  var selectedVehicles = [];        // 선택된 차량 id 목록

  /* ── 톤수 → capacity 매핑 ── */
  var TON_MAP = { '1ton':'1톤', '2.5ton':'2.5톤', '5ton':'5톤', '11ton':'11톤' };
  var TON_LABEL = { '1ton':'1톤', '2.5ton':'2.5톤', '5ton':'5톤', '11ton':'11톤' };

  /* ════════════════════
     필터링
  ════════════════════ */
  function getFiltered() {
    return VEHICLE_DATA.filter(function (v) {
      /* 권역 */
      if (currentRegion !== 'all' && v.region !== currentRegion) return false;
      /* 상태 */
      if (currentStatus === 'available' && v.status !== 'available') return false;
      if (currentStatus === 'busy'      && v.status !== 'busy')      return false;
      /* 톤수: 선택된 게 하나 이상이면 그 중 하나라도 일치해야 표시 */
      if (selectedTons.length > 0) {
        var match = selectedTons.some(function (t) { return v.capacity === TON_MAP[t]; });
        if (!match) return false;
      }
      return true;
    });
  }

  /* ════════════════════
     카드 HTML
  ════════════════════ */
  function buildCard(v) {
    var checked = selectedVehicles.indexOf(v.id) > -1;
    return [
      '<div class="vehicle-card ', v.status, '" data-id="', v.id, '"',
        ' role="button" tabindex="0" aria-label="', v.name, '">',
        '<div class="vc-check-overlay">', checked ? '✓' : '', '</div>',
        '<div class="vc-card-head">',
          '<span class="vc-card-id">', v.id, ' · ', v.regionLabel, '</span>',
          '<span class="vc-status-badge ', v.status, '">',
            v.status === 'available' ? '배차 가능' : '운행 중',
          '</span>',
        '</div>',
        '<div class="vc-card-name">', v.icon, ' ', v.name, '</div>',
        '<div class="vc-card-driver">👤 ', v.driver, ' · ', v.phone, '</div>',
        '<div class="vc-card-specs">',
          '<div class="vc-spec-item"><span class="vc-spec-label">적재 용량</span><span class="vc-spec-val">', v.capacity, '</span></div>',
          '<div class="vc-spec-item"><span class="vc-spec-label">예상 비용</span><span class="vc-spec-val">', v.cost, '</span></div>',
          '<div class="vc-spec-item"><span class="vc-spec-label">도착 예정</span><span class="vc-spec-val">', v.eta, '</span></div>',
          '<div class="vc-spec-item"><span class="vc-spec-label">운행 횟수</span><span class="vc-spec-val">', v.trips, '회</span></div>',
        '</div>',
        '<div class="vc-card-location">📍 ', v.location,
          '<span class="vc-distance-badge">', v.distance, '</span>',
        '</div>',
        '<div class="vc-load-wrap"><span>적재율</span>',
          '<div class="vc-load-bar-bg"><div class="vc-load-bar" style="width:', v.load, '%"></div></div>',
          '<span>', v.load, '%</span>',
        '</div>',
      '</div>'
    ].join('');
  }

  /* ════════════════════
     렌더링
  ════════════════════ */
  function renderList() {
    var list   = document.getElementById('vehicleList');
    if (!list) return;

    var vehicles   = getFiltered();
    var availCount = vehicles.filter(function (v) { return v.status === 'available'; }).length;

    /* 헤더 */
    var info = REGION_LABELS[currentRegion] || REGION_LABELS['all'];
    var tEl  = document.getElementById('listRegionTitle');
    var sEl  = document.getElementById('listRegionSub');
    var cEl  = document.getElementById('listAvailCount');
    if (tEl) tEl.textContent = info.title;
    if (sEl) sEl.textContent = info.sub;
    if (cEl) cEl.textContent = availCount;

    if (vehicles.length === 0) {
      list.innerHTML = '<div class="vehicle-empty"><div class="vehicle-empty-icon">🔍</div>해당 조건의 차량이 없습니다.</div>';
      return;
    }
    list.innerHTML = vehicles.map(buildCard).join('');
    attachCardEvents();
  }

  /* ════════════════════
     카드 선택 이벤트
  ════════════════════ */
  function attachCardEvents() {
    document.querySelectorAll('.vehicle-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.dataset.id;
        var v  = VEHICLE_DATA.find(function (x) { return x.id === id; });
        if (!v || v.status === 'busy') return;
        var idx = selectedVehicles.indexOf(id);
        if (idx > -1) {
          selectedVehicles.splice(idx, 1);
          card.classList.remove('selected');
          card.querySelector('.vc-check-overlay').textContent = '';
        } else {
          selectedVehicles.push(id);
          card.classList.add('selected');
          card.querySelector('.vc-check-overlay').textContent = '✓';
        }
        updateActionBar();
      });
    });
  }

  /* ════════════════════
     상태 필터 버튼
  ════════════════════ */
  function initStatusBtns() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        currentStatus = btn.dataset.filter;
        selectedVehicles = [];
        updateActionBar();
        renderList();
        renderFilterTags();
      });
    });
  }

  /* ════════════════════
     톤수 드롭다운
  ════════════════════ */
  function initTonDropdown() {
    var btn  = document.getElementById('tonDropdownBtn');
    var menu = document.getElementById('tonDropdownMenu');
    if (!btn || !menu) return;

    /* 드롭다운 열기/닫기 */
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = menu.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen);
    });

    /* 옵션 선택 (다중) */
    menu.querySelectorAll('.ton-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        var ton = opt.dataset.ton;
        var idx = selectedTons.indexOf(ton);
        if (idx > -1) {
          selectedTons.splice(idx, 1);
          opt.classList.remove('selected');
        } else {
          selectedTons.push(ton);
          opt.classList.add('selected');
        }
        /* 버튼 라벨 */
        var label = document.getElementById('tonBtnLabel');
        if (label) {
          label.textContent = selectedTons.length
            ? selectedTons.map(function (t) { return TON_LABEL[t]; }).join('·')
            : '톤수';
        }
        selectedVehicles = [];
        updateActionBar();
        renderList();
        renderFilterTags();
      });
    });

    /* 외부 클릭 시 닫기 */
    document.addEventListener('click', function () {
      menu.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  }

  /* ════════════════════
     활성 필터 태그
  ════════════════════ */
  function renderFilterTags() {
    var wrap = document.getElementById('activeFilterTags');
    if (!wrap) return;
    var tags = [];

    /* 상태 태그 */
    if (currentStatus === 'available') {
      tags.push('<span class="filter-tag status-tag">배차 가능 <span class="filter-tag-remove" data-remove-status>✕</span></span>');
    } else if (currentStatus === 'busy') {
      tags.push('<span class="filter-tag status-tag">운행 중 <span class="filter-tag-remove" data-remove-status>✕</span></span>');
    }

    /* 톤수 태그 */
    selectedTons.forEach(function (t) {
      tags.push('<span class="filter-tag ton-tag">' + TON_LABEL[t] +
        ' <span class="filter-tag-remove" data-remove-ton="' + t + '">✕</span></span>');
    });

    wrap.innerHTML = tags.join('');

    /* 태그 제거 이벤트 */
    wrap.querySelectorAll('[data-remove-status]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        currentStatus = 'all';
        document.querySelectorAll('.filter-btn[data-filter]').forEach(function (b) {
          b.classList.toggle('active', b.dataset.filter === 'all');
        });
        selectedVehicles = [];
        updateActionBar();
        renderList();
        renderFilterTags();
      });
    });
    wrap.querySelectorAll('[data-remove-ton]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var ton = el.dataset.removeTon;
        var idx = selectedTons.indexOf(ton);
        if (idx > -1) selectedTons.splice(idx, 1);
        /* 드롭다운 옵션 상태 동기화 */
        var opt = document.querySelector('.ton-option[data-ton="' + ton + '"]');
        if (opt) opt.classList.remove('selected');
        /* 버튼 라벨 */
        var label = document.getElementById('tonBtnLabel');
        if (label) {
          label.textContent = selectedTons.length
            ? selectedTons.map(function (t) { return TON_LABEL[t]; }).join('·')
            : '톤수';
        }
        selectedVehicles = [];
        updateActionBar();
        renderList();
        renderFilterTags();
      });
    });
  }

  /* ════════════════════
     매칭 확정 바
  ════════════════════ */
  function updateActionBar() {
    var bar = document.getElementById('matchActionBar');
    var cnt = document.getElementById('selectedCount');
    if (!bar) return;
    bar.style.display = selectedVehicles.length > 0 ? 'flex' : 'none';
    if (cnt) cnt.textContent = selectedVehicles.length;
  }

  function initMatchConfirm() {
    var btn = document.getElementById('matchConfirmBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var selected = VEHICLE_DATA.filter(function (v) {
        return selectedVehicles.indexOf(v.id) > -1;
      });
      var lines = selected.map(function (v) {
        return '• ' + v.icon + ' ' + v.name + ' (' + v.driver + ') — ' + v.cost;
      }).join('<br>');
      var modal = document.getElementById('matchModal');
      var desc  = document.getElementById('modalDesc');
      var dtl   = document.getElementById('modalDetail');
      if (modal) modal.style.display = 'flex';
      if (desc)  desc.textContent = selectedVehicles.length + '대 차량이 성공적으로 배정되었습니다.';
      if (dtl)   dtl.innerHTML  = lines;
      selectedVehicles = [];
      updateActionBar();
      renderList();
    });
  }

  function initModal() {
    var closeBtn = document.getElementById('modalCloseBtn');
    var modal    = document.getElementById('matchModal');
    if (closeBtn) closeBtn.addEventListener('click', function () { modal.style.display = 'none'; });
    if (modal)    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
  }

  /* ════════════════════
     AI 추천
  ════════════════════ */
  function scoreVehicle(v) {
    /* 비용 점수: 저렴할수록 높음 (최대 40점) */
    var costNum  = parseInt(v.cost.replace(/[^0-9]/g,''), 10) || 999999;
    var costScore = Math.max(0, 40 - Math.floor(costNum / 5000));

    /* 거리 점수: 가까울수록 높음 (최대 30점) */
    var distNum  = parseFloat(v.distance) || 99;
    var distScore = Math.max(0, 30 - Math.floor(distNum * 2));

    /* 적재율 점수: 낮을수록 여유 있음 (최대 20점) */
    var loadScore = Math.floor((100 - v.load) / 5);

    /* 운행 경험 점수 (최대 10점) */
    var tripScore = Math.min(10, v.trips * 2);

    return {
      total: costScore + distScore + loadScore + tripScore,
      cost:  costScore, dist: distScore, load: loadScore, trip: tripScore
    };
  }

  var MEDALS = ['🥇', '🥈', '🥉'];
  var RANK_REASONS = [
    '비용과 거리 모두 최적화된 최우선 추천 차량입니다.',
    '안정적인 운행 실적과 합리적인 비용의 차량입니다.',
    '추가 대안으로 활용 가능한 차량입니다.'
  ];

  function buildRankCard(v, rank, score) {
    return [
      '<div class="ai-rank-card rank-', rank + 1, '">',
        '<div class="ai-rank-medal">', MEDALS[rank], '</div>',
        '<div class="ai-rank-info">',
          '<div class="ai-rank-name">', v.icon, ' ', v.name, '</div>',
          '<div class="ai-rank-driver">👤 ', v.driver, ' · ', v.location, '</div>',
          '<div class="ai-rank-scores">',
            '<span class="ai-score-tag score-cost">💰 비용 ', score.cost, 'pt</span>',
            '<span class="ai-score-tag score-distance">📍 거리 ', score.dist, 'pt</span>',
            '<span class="ai-score-tag score-capacity">🚛 ', v.capacity, '</span>',
            '<span class="ai-score-tag score-total">총점 ', score.total, 'pt</span>',
          '</div>',
          '<div class="ai-rank-reason">', RANK_REASONS[rank], '</div>',
        '</div>',
        '<div class="ai-rank-right">',
          '<div class="ai-rank-cost">', v.cost, '</div>',
          '<div style="font-size:.72rem;color:#94a3b8;">도착 ', v.eta, ' · ', v.distance, '</div>',
          '<button class="ai-rank-select-btn" data-select-id="', v.id, '">선택하기</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  function runAIRecommend() {
    var noRegion = document.getElementById('aiNoRegion');
    var loading  = document.getElementById('aiLoading');
    var result   = document.getElementById('aiResult');
    var fill     = document.getElementById('aiLoadingFill');
    var loadTxt  = document.getElementById('aiLoadingText');
    var btn      = document.getElementById('aiRecommendBtn');

    if (currentRegion === 'all') {
      if (noRegion) { noRegion.classList.add('show'); }
      if (result)   result.classList.remove('show');
      return;
    }

    /* 배차 가능 차량만 대상 */
    var candidates = VEHICLE_DATA.filter(function (v) {
      return v.region === currentRegion && v.status === 'available';
    });

    if (candidates.length === 0) {
      if (result) {
        result.classList.add('show');
        result.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">해당 권역에 배차 가능한 차량이 없습니다.</div>';
      }
      return;
    }

    /* UI: 로딩 시작 */
    if (noRegion) noRegion.classList.remove('show');
    if (result)   result.classList.remove('show');
    if (loading)  loading.classList.add('show');
    if (btn)      { btn.disabled = true; btn.textContent = '⏳ 분석 중...'; }

    /* 로딩 바 진행 */
    var progress = 0;
    var steps = [
      '🤖 기상 데이터 분석 중...',
      '📦 물량·거리 최적화 중...',
      '💰 비용 효율 계산 중...',
      '🏆 최적 차량 선정 중...'
    ];
    var stepIdx = 0;
    var interval = setInterval(function () {
      progress += 3;
      if (fill) fill.style.width = Math.min(progress, 98) + '%';
      if (loadTxt && progress % 25 === 0 && stepIdx < steps.length) {
        loadTxt.textContent = steps[stepIdx++];
      }
      if (progress >= 100) clearInterval(interval);
    }, 40);

    /* 1.5초 후 결과 */
    setTimeout(function () {
      clearInterval(interval);
      if (fill) fill.style.width = '100%';

      /* 점수 계산 + 정렬 */
      var scored = candidates.map(function (v) {
        return { v: v, s: scoreVehicle(v) };
      }).sort(function (a, b) { return b.s.total - a.s.total; });

      var top3 = scored.slice(0, 3);

      if (loading) loading.classList.remove('show');
      if (result) {
        result.innerHTML = top3.map(function (item, i) {
          return buildRankCard(item.v, i, item.s);
        }).join('');
        result.classList.add('show');
      }
      if (btn) { btn.disabled = false; btn.textContent = '✨ AI 최적 차량 추천'; }

      /* 선택하기 버튼 */
      if (result) {
        result.querySelectorAll('.ai-rank-select-btn').forEach(function (b) {
          b.addEventListener('click', function () {
            var id = b.dataset.selectId;
            if (selectedVehicles.indexOf(id) === -1) {
              selectedVehicles.push(id);
              updateActionBar();
              renderList();
            }
            /* 스크롤 리스트로 이동 */
            var scrollWrap = document.querySelector('.vehicle-list-scroll');
            if (scrollWrap) scrollWrap.scrollIntoView({ behavior:'smooth', block:'start' });
          });
        });
      }
    }, 1500);
  }

  function initAIRecommend() {
    var btn = document.getElementById('aiRecommendBtn');
    if (btn) btn.addEventListener('click', runAIRecommend);
  }

  /* ════════════════════
     외부 노출: 권역 변경
  ════════════════════ */
  window.renderVehicleList = function (region) {
    currentRegion    = region;
    selectedVehicles = [];
    updateActionBar();
    renderList();
    renderFilterTags();

    /* AI 추천 초기화 */
    var noRegion = document.getElementById('aiNoRegion');
    var result   = document.getElementById('aiResult');
    var loading  = document.getElementById('aiLoading');
    if (region === 'all') {
      if (noRegion) noRegion.classList.add('show');
      if (result)   result.classList.remove('show');
      if (loading)  loading.classList.remove('show');
    } else {
      if (noRegion) noRegion.classList.remove('show');
      if (result)   result.classList.remove('show');
      if (loading)  loading.classList.remove('show');
    }
  };

  /* ════════════════════
     초기화
  ════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    renderList();
    renderFilterTags();
    initStatusBtns();
    initTonDropdown();
    initMatchConfirm();
    initModal();
    initAIRecommend();
  });

})();
