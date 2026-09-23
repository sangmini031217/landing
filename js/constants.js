/**
 * constants.js
 * ------------------------------------------------------------------
 * 경기 모드(11인제 축구 / 풋살 5인 / 풋살 6인)별
 *  - 경기장 실측 규격(미터)  → pitch.js 가 캔버스 라인 렌더링에 사용
 *  - 포메이션 프리셋 상대좌표(%) → playerManager.js 가 선수 배치에 사용
 *
 * 좌표 규칙 (플레이 영역 기준, 세로형 피치)
 *   x: 0(왼쪽 터치라인) ~ 100(오른쪽 터치라인)
 *   y: 0(상대 골라인)   ~ 100(우리 골라인)  → GK 는 y 가 크다
 * ------------------------------------------------------------------
 */

/* ===== 유니폼 색상 프리셋 — 채도를 낮춘 톤온톤 팔레트 ===== */
export const KIT_PRESETS = [
  { kit: '#111827', ink: '#ffffff', label: '잉크' },
  { kit: '#16324f', ink: '#ffffff', label: '네이비' },
  { kit: '#8b3a3a', ink: '#ffffff', label: '브릭' },
  { kit: '#2f5d50', ink: '#ffffff', label: '포레스트' },
  { kit: '#6b7280', ink: '#ffffff', label: '슬레이트' },
  { kit: '#b08968', ink: '#ffffff', label: '샌드' },
  { kit: '#c9a227', ink: '#1a1a1a', label: '머스터드' },
  { kit: '#ffffff', ink: '#111827', label: '화이트' }
];

export const DEFAULT_KIT = { kit: '#111827', ink: '#ffffff' };

/* ===== 경기장 실측 규격 (단위: m) ===== */

/** 11인제 축구: 68 x 105 (FIFA 권장) */
const FOOTBALL_GEOMETRY = {
  type: 'football',
  W: 68,          // 터치라인 사이 폭
  H: 105,         // 골라인 사이 길이
  margin: 4,      // 라인 밖 여백(골대·잔디 표현용)
  lineW: 0.13,    // 라인 두께
  centerR: 9.15,  // 센터 서클 반지름
  penaltyBox: { w: 40.32, d: 16.5 },
  goalBox: { w: 18.32, d: 5.5 },
  penaltySpot: 11,
  arcR: 9.15,     // 페널티 아크 반지름
  goalW: 7.32,
  goalDepth: 2,
  cornerR: 1,
  stripes: 0,
  surface: { base: '#edf0ee', alt: '#eaeeeb', surround: '#f7f8f7' }
};

/** 풋살: 20 x 40 (FIFA 풋살 국제 경기 규격) */
const FUTSAL_GEOMETRY = {
  type: 'futsal',
  W: 20,
  H: 40,
  margin: 2.6,
  lineW: 0.09,
  centerR: 3,
  areaR: 6,        // 페널티 에어리어 4분원 반지름
  postGap: 3.16,   // 4분원 중심(골포스트) 사이 간격
  penaltySpot: 6,
  secondSpot: 10,  // 세컨드 페널티 마크
  goalW: 3,
  goalDepth: 1,
  cornerR: 0.25,
  subZone: 5,      // 하프라인 기준 교체 구역 표시
  stripes: 0,
  surface: { base: '#eaeff3', alt: '#e7ecf1', surround: '#f7f8f9', key: 'rgba(17,24,39,0.03)' }
};

/* ===== 포메이션 프리셋 ===== */

const FOOTBALL_FORMATIONS = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 12, y: 72 }, { pos: 'CB', x: 34, y: 77 },
    { pos: 'CB', x: 66, y: 77 }, { pos: 'RB', x: 88, y: 72 },
    { pos: 'CM', x: 26, y: 53 }, { pos: 'CM', x: 50, y: 58 }, { pos: 'CM', x: 74, y: 53 },
    { pos: 'LW', x: 16, y: 25 }, { pos: 'ST', x: 50, y: 18 }, { pos: 'RW', x: 84, y: 25 }
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 12, y: 74 }, { pos: 'CB', x: 36, y: 78 },
    { pos: 'CB', x: 64, y: 78 }, { pos: 'RB', x: 88, y: 74 },
    { pos: 'LM', x: 12, y: 52 }, { pos: 'CM', x: 37, y: 56 },
    { pos: 'CM', x: 63, y: 56 }, { pos: 'RM', x: 88, y: 52 },
    { pos: 'ST', x: 36, y: 23 }, { pos: 'ST', x: 64, y: 23 }
  ],
  '4-2-3-1': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 12, y: 74 }, { pos: 'CB', x: 36, y: 78 },
    { pos: 'CB', x: 64, y: 78 }, { pos: 'RB', x: 88, y: 74 },
    { pos: 'DM', x: 36, y: 61 }, { pos: 'DM', x: 64, y: 61 },
    { pos: 'LM', x: 15, y: 40 }, { pos: 'CAM', x: 50, y: 38 }, { pos: 'RM', x: 85, y: 40 },
    { pos: 'ST', x: 50, y: 17 }
  ],
  '4-1-4-1': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 12, y: 74 }, { pos: 'CB', x: 36, y: 78 },
    { pos: 'CB', x: 64, y: 78 }, { pos: 'RB', x: 88, y: 74 },
    { pos: 'DM', x: 50, y: 63 },
    { pos: 'LM', x: 13, y: 44 }, { pos: 'CM', x: 38, y: 47 },
    { pos: 'CM', x: 62, y: 47 }, { pos: 'RM', x: 87, y: 44 },
    { pos: 'ST', x: 50, y: 20 }
  ],
  '3-5-2': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'CB', x: 27, y: 78 }, { pos: 'CB', x: 50, y: 81 }, { pos: 'CB', x: 73, y: 78 },
    { pos: 'LWB', x: 9, y: 56 }, { pos: 'CM', x: 34, y: 55 }, { pos: 'CM', x: 50, y: 60 },
    { pos: 'CM', x: 66, y: 55 }, { pos: 'RWB', x: 91, y: 56 },
    { pos: 'ST', x: 38, y: 22 }, { pos: 'ST', x: 62, y: 22 }
  ],
  '3-4-3': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'CB', x: 27, y: 78 }, { pos: 'CB', x: 50, y: 81 }, { pos: 'CB', x: 73, y: 78 },
    { pos: 'LM', x: 11, y: 55 }, { pos: 'CM', x: 38, y: 58 },
    { pos: 'CM', x: 62, y: 58 }, { pos: 'RM', x: 89, y: 55 },
    { pos: 'LW', x: 18, y: 24 }, { pos: 'ST', x: 50, y: 18 }, { pos: 'RW', x: 82, y: 24 }
  ],
  '5-3-2': [
    { pos: 'GK', x: 50, y: 92 },
    { pos: 'LB', x: 8, y: 70 }, { pos: 'CB', x: 30, y: 79 }, { pos: 'CB', x: 50, y: 82 },
    { pos: 'CB', x: 70, y: 79 }, { pos: 'RB', x: 92, y: 70 },
    { pos: 'CM', x: 28, y: 55 }, { pos: 'CM', x: 50, y: 58 }, { pos: 'CM', x: 72, y: 55 },
    { pos: 'ST', x: 38, y: 24 }, { pos: 'ST', x: 62, y: 24 }
  ]
};

const FUTSAL5_FORMATIONS = {
  '1-2-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: '픽소', x: 50, y: 70 },
    { pos: '알라', x: 15, y: 48 }, { pos: '알라', x: 85, y: 48 },
    { pos: '피보', x: 50, y: 24 }
  ],
  '2-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: '픽소', x: 24, y: 70 }, { pos: '픽소', x: 76, y: 70 },
    { pos: '알라', x: 24, y: 36 }, { pos: '알라', x: 76, y: 36 }
  ],
  '3-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: '알라', x: 14, y: 64 }, { pos: '픽소', x: 50, y: 72 }, { pos: '알라', x: 86, y: 64 },
    { pos: '피보', x: 50, y: 28 }
  ],
  '4-0': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: '알라', x: 13, y: 52 }, { pos: '픽소', x: 38, y: 58 },
    { pos: '픽소', x: 62, y: 58 }, { pos: '알라', x: 87, y: 52 }
  ]
};

const FUTSAL6_FORMATIONS = {
  '2-1-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DF', x: 24, y: 72 }, { pos: 'DF', x: 76, y: 72 },
    { pos: 'MF', x: 50, y: 52 },
    { pos: 'FW', x: 26, y: 28 }, { pos: 'FW', x: 74, y: 28 }
  ],
  '2-2-1': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DF', x: 24, y: 74 }, { pos: 'DF', x: 76, y: 74 },
    { pos: 'MF', x: 28, y: 50 }, { pos: 'MF', x: 72, y: 50 },
    { pos: 'FW', x: 50, y: 24 }
  ],
  '1-2-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DF', x: 50, y: 74 },
    { pos: 'MF', x: 17, y: 54 }, { pos: 'MF', x: 83, y: 54 },
    { pos: 'FW', x: 28, y: 26 }, { pos: 'FW', x: 72, y: 26 }
  ],
  '3-2': [
    { pos: 'GK', x: 50, y: 90 },
    { pos: 'DF', x: 15, y: 70 }, { pos: 'DF', x: 50, y: 75 }, { pos: 'DF', x: 85, y: 70 },
    { pos: 'FW', x: 32, y: 30 }, { pos: 'FW', x: 68, y: 30 }
  ]
};

/* ===== 모드 정의 ===== */
export const MODES = {
  football11: {
    id: 'football11',
    label: '11인제 축구',
    short: '11인제',
    count: 11,
    defaultSubs: 3,
    cardMaxWidth: 560,
    geometry: FOOTBALL_GEOMETRY,
    defaultFormation: '4-3-3',
    formations: FOOTBALL_FORMATIONS
  },
  futsal5: {
    id: 'futsal5',
    label: '풋살 5인제',
    short: '풋살 5',
    count: 5,
    defaultSubs: 3,
    cardMaxWidth: 430,
    geometry: FUTSAL_GEOMETRY,
    defaultFormation: '1-2-1',
    formations: FUTSAL5_FORMATIONS
  },
  futsal6: {
    id: 'futsal6',
    label: '풋살 6인제',
    short: '풋살 6',
    count: 6,
    defaultSubs: 3,
    cardMaxWidth: 430,
    geometry: FUTSAL_GEOMETRY,
    defaultFormation: '2-1-2',
    formations: FUTSAL6_FORMATIONS
  }
};

export const MODE_ORDER = ['football11', 'futsal5', 'futsal6'];
export const DEFAULT_MODE = 'football11';

/** 모드 정보를 안전하게 가져온다. */
export function getMode(modeId) {
  return MODES[modeId] || MODES[DEFAULT_MODE];
}

/** 모드 + 포메이션 키로 슬롯 배열(복사본)을 가져온다. */
export function getFormationSlots(modeId, formationId) {
  const mode = getMode(modeId);
  const slots = mode.formations[formationId] || mode.formations[mode.defaultFormation];
  return slots.map((s) => ({ ...s }));
}
