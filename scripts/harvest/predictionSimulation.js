/**
 * predictionSimulation.js
 * AI 예측 대시보드 카드의 숫자 카운트 업 애니메이션
 * 카드가 뷰포트에 진입하면 0 → 목표값으로 증가
 */

(function () {
  'use strict';

  /**
   * 숫자를 start에서 end로 duration ms 동안 카운트 업
   * @param {HTMLElement} el   - 표시할 요소
   * @param {number} end       - 목표 숫자
   * @param {string} suffix    - 뒤에 붙는 단위 문자열
   * @param {number} duration  - 애니메이션 시간 (ms)
   */
  function countUp(el, end, suffix, duration) {
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutQuart 커브 적용
      var eased = 1 - Math.pow(1 - progress, 4);
      var current = Math.round(eased * end);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  /**
   * 프로그레스 바 너비 애니메이션
   * @param {HTMLElement} barEl - .pred-bar-fill 요소
   * @param {number} targetWidth - 목표 너비 (%)
   */
  function animateBar(barEl, targetWidth) {
    // 이미 애니메이션 됐으면 스킵
    if (barEl.dataset.animated) return;
    barEl.dataset.animated = 'true';
    setTimeout(function () {
      barEl.style.width = targetWidth + '%';
    }, 200);
  }

  /**
   * pred-card가 뷰포트에 들어오면 카운트 업 실행
   */
  function initPredictionCards() {
    var cards = document.querySelectorAll('.pred-card');
    if (!cards.length) return;

    if (!('IntersectionObserver' in window)) {
      // 폴백: 즉시 최종값 표시
      cards.forEach(runCard);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCard(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    cards.forEach(function (card) { observer.observe(card); });
  }

  /**
   * 카드 개별 실행
   * @param {HTMLElement} card
   */
  function runCard(card) {
    var valEl = card.querySelector('.pred-val');
    if (!valEl) return;

    var endVal  = parseInt(valEl.dataset.count, 10);
    var suffix  = valEl.dataset.suffix || '';

    // 숫자가 있는 카드만 카운트 업
    if (!isNaN(endVal)) {
      countUp(valEl, endVal, suffix, 1400);
    }

    // 프로그레스 바
    var barFill = card.querySelector('.pred-bar-fill');
    if (barFill) {
      var targetW = parseInt(barFill.dataset.width, 10) || 0;
      animateBar(barFill, targetW);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPredictionCards();
  });

})();
