/**
 * mapInteraction.js — Leaflet.js + OpenStreetMap 기반 전국 지도
 */
(function () {
  'use strict';

  /* ══ 권역별 설정 ══ */
  var REGIONS = {
    metro:        { label: '수도권',  center: [37.56, 126.97], zoom: 9,  color: '#3b82f6' },
    gangwon:      { label: '강원권',  center: [37.75, 128.20], zoom: 8,  color: '#22c55e' },
    chungcheong:  { label: '충청권',  center: [36.55, 127.15], zoom: 8,  color: '#f59e0b' },
    gyeongsang:   { label: '경상권',  center: [35.80, 128.55], zoom: 8,  color: '#ef4444' },
    jeolla:       { label: '전라권',  center: [35.35, 127.10], zoom: 8,  color: '#a855f7' },
    jeju:         { label: '제주권',  center: [33.43, 126.53], zoom: 10, color: '#0ea5e9' }
  };

  /* 전체 보기 시 한반도 중심 */
  var DEFAULT_CENTER = [36.5, 127.8];
  var DEFAULT_ZOOM   = 7;

  /* ══ 권역별 차량/농가 핀 좌표 ══ */
  var PINS = {
    metro: {
      vehicles: [
        { lat: 37.50, lng: 126.89, status: 'available' }, /* 서울 구로 */
        { lat: 37.41, lng: 127.13, status: 'available' }, /* 경기 성남 */
        { lat: 37.62, lng: 126.72, status: 'busy'      }, /* 인천 */
        { lat: 37.29, lng: 127.01, status: 'available' }  /* 경기 수원 */
      ],
      farms: [
        { lat: 37.54, lng: 126.99 }, /* 서울 중구 */
        { lat: 37.40, lng: 126.92 }  /* 경기 안양 */
      ]
    },
    gangwon: {
      vehicles: [
        { lat: 37.88, lng: 127.73, status: 'available' }, /* 춘천 */
        { lat: 37.34, lng: 127.92, status: 'busy'      }  /* 원주 */
      ],
      farms: [
        { lat: 37.75, lng: 128.90 }  /* 강릉 */
      ]
    },
    chungcheong: {
      vehicles: [
        { lat: 36.82, lng: 127.15, status: 'available' }, /* 천안 */
        { lat: 36.64, lng: 127.49, status: 'available' }, /* 청주 */
        { lat: 36.35, lng: 127.38, status: 'busy'      }  /* 대전 */
      ],
      farms: [
        { lat: 36.48, lng: 127.29 }  /* 세종 */
      ]
    },
    gyeongsang: {
      vehicles: [
        { lat: 36.57, lng: 128.73, status: 'available' }, /* 안동 */
        { lat: 35.23, lng: 128.68, status: 'available' }, /* 창원 */
        { lat: 35.10, lng: 129.03, status: 'busy'      }, /* 부산 */
        { lat: 35.87, lng: 128.60, status: 'available' }  /* 대구 */
      ],
      farms: [
        { lat: 35.97, lng: 129.42 }, /* 경주 */
        { lat: 35.54, lng: 129.31 }  /* 울산 */
      ]
    },
    jeolla: {
      vehicles: [
        { lat: 35.82, lng: 127.15, status: 'available' }, /* 전주 */
        { lat: 35.02, lng: 126.71, status: 'available' }, /* 나주 */
        { lat: 35.16, lng: 126.85, status: 'busy'      }  /* 광주 */
      ],
      farms: [
        { lat: 34.95, lng: 127.49 }  /* 순천 */
      ]
    },
    jeju: {
      vehicles: [
        { lat: 33.44, lng: 126.36, status: 'available' }, /* 한림 */
        { lat: 33.52, lng: 126.76, status: 'available' }, /* 구좌 */
        { lat: 33.24, lng: 126.26, status: 'busy'      }  /* 대정 */
      ],
      farms: [
        { lat: 33.35, lng: 126.53 }  /* 서귀포 */
      ]
    }
  };

  /* ══ 커스텀 아이콘 ══ */
  function makeVehicleIcon(status) {
    var color = status === 'available' ? '#16a34a' : '#f97316';
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">',
        '<circle cx="11" cy="11" r="9" fill="', color, '" stroke="#fff" stroke-width="2.5"/>',
        '<circle cx="11" cy="11" r="4" fill="#fff" opacity="0.85"/>',
      '</svg>'
    ].join('');
    return L.divIcon({
      html: svg,
      className: '',
      iconSize:   [22, 22],
      iconAnchor: [11, 11],
      popupAnchor:[0, -12]
    });
  }

  function makeFarmIcon() {
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">',
        '<polygon points="10,2 18,18 2,18" fill="#0d9488" stroke="#fff" stroke-width="2"/>',
      '</svg>'
    ].join('');
    return L.divIcon({
      html: svg,
      className: '',
      iconSize:   [20, 20],
      iconAnchor: [10, 18],
      popupAnchor:[0, -18]
    });
  }

  /* ══ 지도 인스턴스 ══ */
  var map;
  var regionLayers  = {};  /* region → LayerGroup (핀들) */
  var polygonLayers = {};  /* region → Polygon (채색 오버레이) */
  var currentRegion = 'all';

  /* ══ 권역 폴리곤 좌표 (한국 행정구역 간략화) ══ */
  var POLYGONS = {
    metro: [
      [38.30,126.60],[38.30,127.80],[37.20,127.80],[37.20,126.60]
    ],
    gangwon: [
      [38.62,127.30],[38.62,129.40],[37.00,129.40],[37.00,127.30]
    ],
    chungcheong: [
      [37.20,125.90],[37.20,128.00],[35.95,128.00],[35.95,125.90]
    ],
    gyeongsang: [
      [37.00,127.80],[37.00,129.60],[34.50,129.60],[34.50,127.80]
    ],
    jeolla: [
      [35.95,125.90],[35.95,127.90],[34.20,127.90],[34.20,125.90]
    ],
    jeju: [
      [33.60,126.10],[33.60,126.98],[33.20,126.98],[33.20,126.10]
    ]
  };

  /* ══ 지도 초기화 ══ */
  function initMap() {
    var el = document.getElementById('koreaLeafletMap');
    if (!el) return;

    map = L.map('koreaLeafletMap', {
      center: DEFAULT_CENTER,
      zoom:   DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true
    });

    /* OpenStreetMap 타일 */
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    /* 권역별 폴리곤 + 핀 레이어 생성 */
    Object.keys(REGIONS).forEach(function (region) {
      buildRegionLayer(region);
    });

    /* 전체 보기: 모든 핀 표시 */
    showAllPins();
  }

  /* ══ 권역 레이어 빌드 ══ */
  function buildRegionLayer(region) {
    var cfg  = REGIONS[region];
    var pins = PINS[region];
    var group = L.layerGroup();

    /* 폴리곤 오버레이 */
    if (POLYGONS[region]) {
      var poly = L.polygon(POLYGONS[region], {
        color:       cfg.color,
        weight:      2,
        opacity:     0.7,
        fillColor:   cfg.color,
        fillOpacity: 0.12
      });
      poly.on('click', function () { setActiveRegion(region); });
      poly.bindTooltip(cfg.label, { permanent: false, direction: 'center', className: 'region-tooltip' });
      polygonLayers[region] = poly;
    }

    /* 차량 핀 */
    if (pins && pins.vehicles) {
      pins.vehicles.forEach(function (p) {
        var marker = L.marker([p.lat, p.lng], { icon: makeVehicleIcon(p.status) });
        marker.bindPopup(
          '<div class="map-popup">' +
            '<span class="popup-dot ' + p.status + '"></span>' +
            '<b>' + (p.status === 'available' ? '배차 가능' : '운행 중') + '</b>' +
            '<br><small>' + cfg.label + ' 소속 차량</small>' +
          '</div>'
        );
        marker.on('click', function () { setActiveRegion(region); });
        group.addLayer(marker);
      });
    }

    /* 농가 마커 */
    if (pins && pins.farms) {
      pins.farms.forEach(function (f) {
        var marker = L.marker([f.lat, f.lng], { icon: makeFarmIcon() });
        marker.bindPopup(
          '<div class="map-popup">' +
            '<b>🌾 출하 농가</b>' +
            '<br><small>' + cfg.label + ' 농가</small>' +
          '</div>'
        );
        group.addLayer(marker);
      });
    }

    regionLayers[region] = group;
  }

  /* ══ 전체 핀 표시 ══ */
  function showAllPins() {
    /* 모든 폴리곤 흐리게 */
    Object.keys(polygonLayers).forEach(function (r) {
      polygonLayers[r].setStyle({ fillOpacity: 0.10, opacity: 0.5 });
      if (!map.hasLayer(polygonLayers[r])) {
        polygonLayers[r].addTo(map);
      }
    });
    /* 모든 핀 레이어 표시 */
    Object.keys(regionLayers).forEach(function (r) {
      if (!map.hasLayer(regionLayers[r])) {
        regionLayers[r].addTo(map);
      }
    });
  }

  /* ══ 권역 활성화 ══ */
  function setActiveRegion(region) {
    currentRegion = region;

    /* ── 버튼 활성화 ── */
    document.querySelectorAll('.region-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.region === region);
    });

    if (region === 'all') {
      /* 전체 보기 복원 */
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
      showAllPins();
    } else {
      var cfg = REGIONS[region];

      /* 폴리곤: 선택 권역 강조, 나머지 흐리게 */
      Object.keys(polygonLayers).forEach(function (r) {
        if (r === region) {
          polygonLayers[r].setStyle({ fillOpacity: 0.30, opacity: 1.0 });
          if (!map.hasLayer(polygonLayers[r])) polygonLayers[r].addTo(map);
        } else {
          polygonLayers[r].setStyle({ fillOpacity: 0.05, opacity: 0.25 });
        }
      });

      /* 핀 레이어: 선택 권역만 표시 */
      Object.keys(regionLayers).forEach(function (r) {
        if (r === region) {
          if (!map.hasLayer(regionLayers[r])) regionLayers[r].addTo(map);
        } else {
          if (map.hasLayer(regionLayers[r])) map.removeLayer(regionLayers[r]);
        }
      });

      /* 지도 이동 */
      map.flyTo(cfg.center, cfg.zoom, { duration: 0.8 });
    }

    /* ── 차량 리스트 업데이트 ── */
    if (typeof window.renderVehicleList === 'function') {
      window.renderVehicleList(region);
    }
  }

  /* ══ 권역 버튼 클릭 이벤트 ══ */
  function initRegionButtons() {
    document.querySelectorAll('.region-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setActiveRegion(btn.dataset.region);
      });
    });
  }

  /* ══ 초기화 ══ */
  document.addEventListener('DOMContentLoaded', function () {
    initMap();
    initRegionButtons();
  });

})();
