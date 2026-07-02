/**
 * harvest.js
 * AI 수확 예측 페이지 메인 진입점
 * - 헤더 스크롤 효과
 * - 앵커 버튼 스크롤
 * - AI 예측 시작 버튼 인터랙션
 */

(function () {
  'use strict';

  /* ── 헤더 스크롤 효과 ── */
  function initHeaderScroll() {
    var header = document.getElementById('hvHeader');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 앵커 부드러운 스크롤 ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href').slice(1);
        if (!targetId) return;
        var target = document.getElementById(targetId);
        if (!target) return;
        e.preventDefault();
        var headerH = document.getElementById('hvHeader')
          ? document.getElementById('hvHeader').offsetHeight : 72;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ── AI 예측 시작 버튼 ── */
  function initStartButtons() {
    var btns = document.querySelectorAll('#btnStartPredict, #btnStartPredict2');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // 예측 결과 섹션으로 스크롤
        var target = document.getElementById('predictionResult');
        if (!target) return;
        var headerH = document.getElementById('hvHeader')
          ? document.getElementById('hvHeader').offsetHeight : 72;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });

        // 버튼 피드백
        btn.textContent = '⏳ 분석 중...';
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = '✅ 분석 완료!';
          setTimeout(function () {
            btn.textContent = 'AI 예측 시작';
            btn.disabled = false;
          }, 1800);
        }, 1200);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderScroll();
    initSmoothScroll();
    initStartButtons();
  });

})();
