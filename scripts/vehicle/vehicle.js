/**
 * vehicle.js — 헤더 스크롤, 시계, Hero 카운트업
 */
(function () {
  'use strict';

  /* ── 헤더 스크롤 ── */
  function initHeader() {
    var header = document.getElementById('vcHeader');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 실시간 시계 ── */
  function initClock() {
    var el = document.getElementById('vcTime');
    if (!el) return;
    function tick() {
      var d = new Date();
      el.textContent =
        String(d.getHours()).padStart(2,'0') + ':' +
        String(d.getMinutes()).padStart(2,'0') + ':' +
        String(d.getSeconds()).padStart(2,'0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ── 숫자 카운트업 ── */
  function countUp(el, end, duration) {
    if (!el) return;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * end);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Hero 통계 카운트업 ── */
  function initHeroStats() {
    countUp(document.getElementById('statTotal'),  86, 1000);
    countUp(document.getElementById('statAvail'),  61, 1000);
    countUp(document.getElementById('statBusy'),   25, 1000);
    countUp(document.getElementById('statFarm'),   74, 1000);
  }

  /* ── 실시간 차량 수 미세 변동 ── */
  function initLiveUpdates() {
    var avail = 61, busy = 25;
    setInterval(function () {
      if (Math.random() < 0.3) {
        var delta = Math.random() < 0.5 ? 1 : -1;
        busy  = Math.max(18, Math.min(32, busy + delta));
        avail = Math.max(54, Math.min(68, 86 - busy));
        var aEl = document.getElementById('statAvail');
        var bEl = document.getElementById('statBusy');
        if (aEl) aEl.textContent = avail;
        if (bEl) bEl.textContent = busy;
        var countEl = document.getElementById('listAvailCount');
        if (countEl) countEl.textContent = avail;
      }
    }, 8000);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initClock();
    initHeroStats();
    setTimeout(initLiveUpdates, 2000);
  });

})();
