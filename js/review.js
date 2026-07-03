/**
 * review.js — 제주모아 공통 리뷰·별점 모듈
 * JMReview.getReviews(targetId)  → 리뷰 배열
 * JMReview.addReview(targetId, reviewObj) → 저장
 * JMReview.getAvg(targetId) → { avg, count }
 * JMReview.renderStars(val, interactive, onChange) → HTML string 또는 DOM 주입
 */
(function (w) {
  'use strict';

  var PREFIX = 'jmoa_reviews_';

  function getReviews(targetId) {
    try { return JSON.parse(localStorage.getItem(PREFIX + targetId) || '[]'); }
    catch (e) { return []; }
  }

  function saveReviews(targetId, list) {
    localStorage.setItem(PREFIX + targetId, JSON.stringify(list));
  }

  function addReview(targetId, obj) {
    var list = getReviews(targetId);
    list.unshift({
      id:        Date.now().toString(),
      authorId:  obj.authorId  || '',
      authorName:obj.authorName|| '익명',
      rating:    obj.rating    || 5,
      text:      obj.text      || '',
      createdAt: new Date().toLocaleDateString('ko-KR')
    });
    if (list.length > 100) list = list.slice(0, 100);
    saveReviews(targetId, list);
    return list;
  }

  function getAvg(targetId) {
    var list = getReviews(targetId);
    if (!list.length) return { avg: 0, count: 0 };
    var sum = list.reduce(function (s, r) { return s + r.rating; }, 0);
    return { avg: Math.round((sum / list.length) * 10) / 10, count: list.length };
  }

  /* ── 별 HTML 생성 (표시용) ── */
  function starsHtml(val, size) {
    size = size || '1rem';
    var full = Math.floor(val);
    var half = val - full >= 0.5 ? 1 : 0;
    var empty = 5 - full - half;
    var s = '';
    for (var i = 0; i < full;  i++) s += '<span style="color:#f59e0b;font-size:' + size + ';">★</span>';
    if (half)                        s += '<span style="color:#f59e0b;font-size:' + size + ';">½</span>';
    for (var j = 0; j < empty; j++) s += '<span style="color:#d1d5db;font-size:' + size + ';">★</span>';
    return s;
  }

  /* ── 인터랙티브 별점 위젯 DOM 생성 ── */
  function createStarWidget(currentVal, onChange) {
    currentVal = currentVal || 0;
    var wrap = document.createElement('div');
    wrap.className = 'star-widget';
    wrap.style.cssText = 'display:flex;gap:4px;cursor:pointer;';

    function render(hovered) {
      wrap.innerHTML = '';
      for (var i = 1; i <= 5; i++) {
        (function (idx) {
          var span = document.createElement('span');
          span.textContent = '★';
          span.style.cssText = 'font-size:1.6rem;transition:color .12s;color:' +
            (idx <= (hovered || currentVal) ? '#f59e0b' : '#d1d5db') + ';';
          span.addEventListener('mouseenter', function () { render(idx); });
          span.addEventListener('mouseleave', function () { render(0); });
          span.addEventListener('click', function () {
            currentVal = idx;
            render(0);
            if (onChange) onChange(idx);
          });
          wrap.appendChild(span);
        })(i);
      }
    }
    render(0);
    return wrap;
  }

  /* ── 리뷰 카드 HTML ── */
  function reviewCardHtml(r) {
    return '<div style="padding:14px 0;border-bottom:1px solid #f2f4f6;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
      + '<div style="width:32px;height:32px;border-radius:50%;background:#ebf3fe;display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:800;color:#3182f6;flex-shrink:0;">'
      + (r.authorName || '?')[0] + '</div>'
      + '<div>'
      + '<div style="font-size:0.88rem;font-weight:700;">' + r.authorName + '</div>'
      + '<div style="font-size:0.72rem;color:#b0b8c1;">' + r.createdAt + '</div>'
      + '</div>'
      + '<div style="margin-left:auto;">' + starsHtml(r.rating, '0.9rem') + '</div>'
      + '</div>'
      + '<div style="font-size:0.88rem;color:#4b5563;line-height:1.6;">' + r.text + '</div>'
      + '</div>';
  }

  /* ── 리뷰 섹션 전체 렌더 (컨테이너 el에 주입) ── */
  function renderReviewSection(el, targetId, opts) {
    opts = opts || {};
    var user     = (typeof JMAuth !== 'undefined') ? JMAuth.currentUser() : null;
    var canWrite = opts.canWrite !== false;
    var stat     = getAvg(targetId);
    var reviews  = getReviews(targetId);
    var selectedRating = 0;

    function rebuild() {
      stat    = getAvg(targetId);
      reviews = getReviews(targetId);

      var html = '';

      /* 평균 별점 요약 */
      html += '<div style="display:flex;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid #f2f4f6;margin-bottom:12px;">'
        + '<div style="text-align:center;">'
        + '<div style="font-size:2.2rem;font-weight:900;color:#191f28;line-height:1;">' + (stat.avg || 0) + '</div>'
        + '<div>' + starsHtml(stat.avg, '1rem') + '</div>'
        + '<div style="font-size:0.75rem;color:#b0b8c1;margin-top:3px;">' + stat.count + '개 리뷰</div>'
        + '</div>'
        + '<div style="flex:1;">' + buildRatingBars(reviews) + '</div>'
        + '</div>';

      /* 리뷰 작성 폼 */
      if (canWrite && user) {
        html += '<div id="reviewFormWrap_' + targetId + '" style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:16px;">'
          + '<div style="font-size:0.85rem;font-weight:800;margin-bottom:10px;">✏️ 리뷰 작성</div>'
          + '<div id="starWidgetSlot_' + targetId + '" style="margin-bottom:10px;"></div>'
          + '<textarea id="reviewText_' + targetId + '" placeholder="' + (opts.placeholder || '솔직한 리뷰를 남겨주세요.') + '" rows="3"'
          + ' style="width:100%;padding:10px 12px;border:1.5px solid #e5e8eb;border-radius:8px;font-size:0.88rem;font-family:inherit;resize:vertical;outline:none;"></textarea>'
          + '<div style="margin-top:8px;text-align:right;">'
          + '<button id="reviewSubmitBtn_' + targetId + '"'
          + ' style="padding:9px 20px;background:#3182f6;color:#fff;border:none;border-radius:8px;font-size:0.84rem;font-weight:800;cursor:pointer;font-family:inherit;">'
          + '리뷰 등록</button></div></div>';
      }

      /* 리뷰 목록 */
      if (reviews.length) {
        html += reviews.map(reviewCardHtml).join('');
      } else {
        html += '<div style="text-align:center;padding:28px 0;color:#b0b8c1;font-size:0.9rem;">아직 리뷰가 없습니다.</div>';
      }

      el.innerHTML = html;

      /* 인터랙티브 별점 위젯 주입 */
      if (canWrite && user) {
        var slot = document.getElementById('starWidgetSlot_' + targetId);
        if (slot) {
          selectedRating = 0;
          var widget = createStarWidget(0, function (v) { selectedRating = v; });
          slot.appendChild(widget);
        }
        var submitBtn = document.getElementById('reviewSubmitBtn_' + targetId);
        if (submitBtn) {
          submitBtn.addEventListener('click', function () {
            var textEl = document.getElementById('reviewText_' + targetId);
            var text   = textEl ? textEl.value.trim() : '';
            if (!selectedRating) { alert('별점을 선택해주세요.'); return; }
            if (!text) { alert('리뷰 내용을 입력해주세요.'); return; }
            addReview(targetId, {
              authorId:   user.id,
              authorName: user.name || '익명',
              rating:     selectedRating,
              text:       text
            });
            rebuild();
          });
        }
      }
    }

    rebuild();
  }

  /* ── 별점 분포 막대 ── */
  function buildRatingBars(reviews) {
    var counts = [0, 0, 0, 0, 0]; // index 0 = 1점
    reviews.forEach(function (r) {
      var idx = Math.min(Math.max(Math.round(r.rating), 1), 5) - 1;
      counts[idx]++;
    });
    var max = Math.max.apply(null, counts) || 1;
    var html = '';
    for (var i = 4; i >= 0; i--) {
      var pct = Math.round((counts[i] / max) * 100);
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">'
        + '<span style="font-size:0.72rem;color:#6b7684;width:18px;text-align:right;">' + (i + 1) + '</span>'
        + '<span style="font-size:0.7rem;color:#f59e0b;">★</span>'
        + '<div style="flex:1;height:6px;background:#e5e8eb;border-radius:3px;overflow:hidden;">'
        + '<div style="height:100%;width:' + pct + '%;background:#f59e0b;border-radius:3px;"></div></div>'
        + '<span style="font-size:0.7rem;color:#b0b8c1;width:16px;">' + counts[i] + '</span>'
        + '</div>';
    }
    return html;
  }

  /* 샘플 리뷰 시드 (첫 실행 시) */
  function seedReviews(targetId, samples) {
    if (getReviews(targetId).length) return;
    var list = samples.map(function (s, i) {
      return {
        id: 'seed_' + i,
        authorId: 'seed',
        authorName: s.name,
        rating: s.rating,
        text: s.text,
        createdAt: s.date || '2025.11.01'
      };
    });
    saveReviews(targetId, list);
  }

  w.JMReview = { getReviews, addReview, getAvg, starsHtml, createStarWidget, renderReviewSection, seedReviews };

})(window);
