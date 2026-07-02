/**
 * monitoringUI.js
 * 헤더 스크롤 효과, 실시간 시각, 스크롤 fadeUp 애니메이션
 */
(function () {
  'use strict';

  /* ── 헤더 스크롤 ── */
  function initHeaderScroll() {
    var header = document.getElementById('mnHeader');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 실시간 시각 표시 ── */
  function initLiveClock() {
    var el = document.getElementById('liveTime');
    if (!el) return;
    function tick() {
      var now = new Date();
      var h = String(now.getHours()).padStart(2, '0');
      var m = String(now.getMinutes()).padStart(2, '0');
      var s = String(now.getSeconds()).padStart(2, '0');
      el.textContent = h + ':' + m + ':' + s;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── 앵커 부드러운 스크롤 ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var hh = document.getElementById('mnHeader')
          ? document.getElementById('mnHeader').offsetHeight : 68;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - hh - 12, behavior: 'smooth' });
      });
    });
  }

  /* ── Fade-up IntersectionObserver ── */
  function initFadeUp() {
    var els = document.querySelectorAll('.fade-up');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── 생육 바 애니메이션 ── */
  function initGrowthBars() {
    var bars = document.querySelectorAll('.growth-bar');
    bars.forEach(function (bar) {
      var targetW = bar.style.getPropertyValue('--w');
      bar.style.setProperty('--w', '0%');
      setTimeout(function () {
        bar.style.setProperty('--w', targetW);
      }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderScroll();
    initLiveClock();
    initSmoothScroll();
    initFadeUp();
    initGrowthBars();
  });

})();
