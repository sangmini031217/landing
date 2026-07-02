/**
 * flowAnimation.js
 * Flow 다이어그램 스크롤 애니메이션 (IntersectionObserver)
 */

(function () {
  'use strict';

  /**
   * .fade-up 클래스 요소에 스크롤 진입 시 visible 클래스 추가
   */
  function initFadeUp() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      // 폴백: 즉시 표시
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    els.forEach(function (el) { observer.observe(el); });
  }

  /**
   * Flow 스텝 카드 호버 시 좌측 라인 컬러 하이라이트
   */
  function initFlowHover() {
    const cards = document.querySelectorAll('.flow-step-card');
    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        card.style.setProperty('--flow-line-color', '#0ea5e9');
      });
      card.addEventListener('mouseleave', function () {
        card.style.removeProperty('--flow-line-color');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFadeUp();
    initFlowHover();
  });

})();
