/**
 * sensorSimulator.js
 * 실시간 센서 데이터 시뮬레이션
 * - KPI 수치를 주기적으로 미세하게 변동
 * - 센서 로그 테이블에 새 행 추가
 */
(function () {
  'use strict';

  /* 현재 센서 상태 */
  var state = {
    temp:     24.3,
    humid:    68,
    rain:     2.1,
    sun:      6.4,
    maturity: 85.0,
    brix:     10.8
  };

  /* ── 랜덤 미세 변동 ── */
  function jitter(val, range) {
    return Math.round((val + (Math.random() - 0.5) * range) * 10) / 10;
  }

  /* ── KPI 업데이트 ── */
  function updateKPI() {
    state.temp     = Math.max(18, Math.min(32, jitter(state.temp, 0.6)));
    state.humid    = Math.max(50, Math.min(90, jitter(state.humid, 2)));
    state.rain     = Math.max(0,  Math.min(10, jitter(state.rain, 0.3)));
    state.sun      = Math.max(0,  Math.min(12, jitter(state.sun, 0.2)));
    state.maturity = Math.max(80, Math.min(100, jitter(state.maturity, 0.1)));
    state.brix     = Math.max(9,  Math.min(14,  jitter(state.brix, 0.05)));

    var el;
    el = document.getElementById('kpiTemp');
    if (el) el.textContent = state.temp.toFixed(1) + '°C';
    el = document.getElementById('kpiHumid');
    if (el) el.textContent = Math.round(state.humid) + '%';
    el = document.getElementById('kpiRain');
    if (el) el.textContent = state.rain.toFixed(1) + 'mm';
    el = document.getElementById('kpiSun');
    if (el) el.textContent = state.sun.toFixed(1) + 'h';
    el = document.getElementById('kpiMaturity');
    if (el) el.textContent = state.maturity.toFixed(1) + '%';
  }

  /* ── 센서 로그 새 행 추가 ── */
  function addSensorRow() {
    var tbody = document.getElementById('sensorLog');
    if (!tbody) return;

    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var timeStr = h + ':' + m;

    /* 상태 판단 */
    var status = 'green';
    var statusLabel = '정상';
    if (state.humid > 82 || state.rain > 8) {
      status = 'yellow'; statusLabel = '주의';
    }
    if (state.humid > 90 || state.rain > 15) {
      status = 'red'; statusLabel = '경고';
    }

    var tr = document.createElement('tr');
    tr.classList.add('new-row');
    tr.innerHTML = [
      '<td>' + timeStr + '</td>',
      '<td>' + state.temp.toFixed(1) + '</td>',
      '<td>' + Math.round(state.humid) + '</td>',
      '<td>' + state.rain.toFixed(1) + '</td>',
      '<td>' + state.sun.toFixed(1) + '</td>',
      '<td>' + state.maturity.toFixed(1) + '</td>',
      '<td>' + state.brix.toFixed(1) + '</td>',
      '<td><span class="status-tag ' + status + '">' + statusLabel + '</span></td>'
    ].join('');

    /* 맨 위에 삽입, 최대 10행 유지 */
    tbody.insertBefore(tr, tbody.firstChild);
    var rows = tbody.querySelectorAll('tr');
    if (rows.length > 10) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  /* ── 알림 카운터 업데이트 ── */
  function updateAlertCount() {
    var badge = document.getElementById('alertCount');
    if (!badge) return;
    /* 새 알림이 간헐적으로 추가되는 효과 */
    var current = parseInt(badge.textContent, 10);
    if (Math.random() < 0.15) {
      badge.textContent = (current + 1) + '건';
      badge.style.background = '#fef2f2';
      badge.style.color = '#991b1b';
      setTimeout(function () {
        badge.style.background = '';
        badge.style.color = '';
      }, 2000);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* 5초마다 KPI 업데이트 */
    setInterval(function () {
      updateKPI();
    }, 5000);

    /* 20초마다 새 센서 로그 행 추가 */
    setInterval(function () {
      addSensorRow();
      updateAlertCount();
    }, 20000);
  });

})();
