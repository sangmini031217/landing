/**
 * mapInteraction.js — 전국 지도 & 권역 버튼 연동
 */
(function () {
  'use strict';

  var REGION_PATH_IDS = {
    'metro':        'mapMetro',
    'gangwon':      'mapGangwon',
    'chungcheong':  'mapChungcheong',
    'gyeongsang':   'mapGyeongsang',
    'jeolla':       'mapJeolla',
    'jeju':         'mapJeju'
  };

  function setActiveRegion(region) {
    /* ── 버튼 활성화 ── */
    document.querySelectorAll('.region-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.region === region);
    });

    /* ── 지도 권역 path 활성화 ── */
    document.querySelectorAll('.kr-region-path').forEach(function (path) {
      path.classList.remove('active-region');
      path.style.fillOpacity = '0.45';
    });

    if (region !== 'all') {
      var gId = REGION_PATH_IDS[region];
      if (gId) {
        var g = document.getElementById(gId);
        if (g) {
          var path = g.querySelector('.kr-region-path');
          if (path) {
            path.classList.add('active-region');
            path.style.fillOpacity = '0.88';
          }
        }
      }
      /* 나머지 권역 흐리게 */
      Object.keys(REGION_PATH_IDS).forEach(function (r) {
        if (r !== region) {
          var otherG = document.getElementById(REGION_PATH_IDS[r]);
          if (otherG) {
            var otherPath = otherG.querySelector('.kr-region-path');
            if (otherPath) otherPath.style.fillOpacity = '0.18';
          }
        }
      });
    }

    /* ── 핀 강조 ── */
    document.querySelectorAll('.map-pin').forEach(function (pin) {
      if (region === 'all' || pin.dataset.region === region) {
        pin.style.opacity = '1';
        pin.style.filter  = 'none';
      } else {
        pin.style.opacity = '0.2';
        pin.style.filter  = 'grayscale(1)';
      }
    });

    /* ── 농가 마커 강조 ── */
    document.querySelectorAll('.map-farm').forEach(function (farm) {
      if (region === 'all' || farm.dataset.region === region) {
        farm.style.opacity = '1';
      } else {
        farm.style.opacity = '0.15';
      }
    });

    /* ── 차량 리스트 업데이트 ── */
    if (typeof window.renderVehicleList === 'function') {
      window.renderVehicleList(region);
    }
  }

  /* 권역 버튼 클릭 */
  function initRegionButtons() {
    document.querySelectorAll('.region-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActiveRegion(btn.dataset.region);
      });
    });
  }

  /* 지도 권역 g 클릭 */
  function initMapRegions() {
    document.querySelectorAll('.kr-region').forEach(function (g) {
      g.style.cursor = 'pointer';
      g.addEventListener('click', function () {
        var region = g.dataset.region;
        if (region) setActiveRegion(region);
      });
    });

    /* 핀 클릭 */
    document.querySelectorAll('.map-pin').forEach(function (pin) {
      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        var region = pin.dataset.region;
        if (region) setActiveRegion(region);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initRegionButtons();
    initMapRegions();
  });

})();
