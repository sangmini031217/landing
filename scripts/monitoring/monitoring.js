/**
 * monitoring.js
 * 메인 진입점 — 게이지 애니메이션, KPI 카운트업, D-Day 표시
 */
(function () {
  'use strict';

  /* ── 숫자 카운트업 유틸 ── */
  function countUp(el, end, decimals, suffix, duration) {
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 4);
      var val = eased * end;
      el.textContent = val.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── 성숙도 게이지 SVG 애니메이션 ── */
  function initGauge() {
    var arc = document.querySelector('.gauge-arc');
    if (!arc) return;
    /* 전체 호 길이 251.2px → 85%는 offset 37.68px (= 251.2 * 0.15) */
    var total = 251.2;
    var pct = 0.85;
    var targetOffset = total * (1 - pct);
    /* 시작: 전부 숨김 */
    arc.style.strokeDashoffset = total;
    setTimeout(function () {
      arc.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)';
      arc.style.strokeDashoffset = targetOffset;
    }, 500);
  }

  /* ── D-Day 계산 ── */
  function initDDay() {
    var el = document.getElementById('ddayNum');
    if (!el) return;
    /* 예상 수확일: 10월 28일 (시뮬레이션 고정값) */
    var harvest = new Date();
    harvest.setDate(harvest.getDate() + 8); /* 현재 + 8일 */
    var diff = Math.ceil((harvest - new Date()) / (1000 * 60 * 60 * 24));
    el.textContent = '-' + diff;
  }

  /* ── 페이지 로드 시 실행 ── */
  document.addEventListener('DOMContentLoaded', function () {
    initDDay();

    /* 게이지는 페이지 진입 후 약간 딜레이 후 시작 */
    setTimeout(initGauge, 300);

    /* KPI 수치 카운트업 (페이지 진입 시 한 번) */
    var kpiTemp = document.getElementById('kpiTemp');
    if (kpiTemp) countUp(kpiTemp, 24.3, 1, '°C', 1000);

    var kpiMaturity = document.getElementById('kpiMaturity');
    if (kpiMaturity) countUp(kpiMaturity, 85, 0, '%', 1200);
  });

})();
