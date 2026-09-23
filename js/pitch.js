/**
 * pitch.js
 * ------------------------------------------------------------------
 * 경기장 렌더러.
 *  - 모드별 실측 규격(m)을 그대로 좌표계로 사용해 <canvas> 에 라인을 그린다.
 *    (ctx.setTransform 으로 1 단위 = 1 m → 라인 두께·반지름이 실제 비율과 동일)
 *  - .pitch-frame 의 CSS 변수(--pitch-ratio / --inset-x / --inset-y / --frame-w)를
 *    주입해 경기장 비율과 선수 좌표 레이어의 기준 영역을 맞춘다.
 *  - 리사이즈 시 자동 재렌더, 내보내기 시에는 고배율(setQuality)로 재렌더.
 * ------------------------------------------------------------------
 */

import { getMode } from './constants.js';

const LINE_COLOR = 'rgba(17, 24, 39, 0.24)';   // 잉크 헤어라인
const DOT_COLOR = 'rgba(17, 24, 39, 0.34)';    // 페널티/센터 마크
const GOAL_FILL = 'rgba(17, 24, 39, 0.06)';
const MAX_DPR = 3;

let frameEl = null;
let canvasEl = null;
let ctx = null;
let mode = null;
let quality = 1;          // 1 = 화면용, 2~3 = 내보내기용
let resizeRaf = 0;

/* ================= 공개 API ================= */

/** 캔버스/프레임을 연결하고 리사이즈 감시를 시작한다. */
export function initPitch({ frame, canvas }) {
  frameEl = frame;
  canvasEl = canvas;
  ctx = canvas.getContext('2d');

  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(syncSize);
  };

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(frameEl);
  }
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
}

/** 경기 모드 변경 → 경기장 비율/여백/라인 전체 갱신 */
export function setPitchMode(modeId) {
  mode = getMode(modeId);
  const g = mode.geometry;
  const totalW = g.W + g.margin * 2;
  const totalH = g.H + g.margin * 2;

  frameEl.dataset.mode = mode.id;
  frameEl.style.setProperty('--pitch-ratio', String(round(totalW / totalH, 4)));
  frameEl.style.setProperty('--inset-x', round((g.margin / totalW) * 100, 3) + '%');
  frameEl.style.setProperty('--inset-y', round((g.margin / totalH) * 100, 3) + '%');

  syncSize();
}

/** 내보내기용 렌더 배율 지정 (1 = 기본) */
export function setQuality(multiplier) {
  quality = Math.max(1, Math.min(4, multiplier || 1));
  syncSize();
}

/** 강제 재렌더 */
export function redraw() {
  syncSize();
}

/* ================= 내부 구현 ================= */

function syncSize() {
  if (!mode || !frameEl || !canvasEl) return;

  const rect = frameEl.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  frameEl.style.setProperty('--frame-w', Math.round(rect.width) + 'px');

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) * quality;
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);

  if (canvasEl.width !== w || canvasEl.height !== h) {
    canvasEl.width = w;
    canvasEl.height = h;
  }
  draw();
}

function draw() {
  const g = mode.geometry;
  const totalW = g.W + g.margin * 2;
  const scale = canvasEl.width / totalW;      // px per meter
  const totalHm = canvasEl.height / scale;    // 실제 렌더 높이(m)

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  // 원점을 플레이 영역 좌상단으로, 1 단위 = 1 m
  ctx.setTransform(scale, 0, 0, scale, g.margin * scale, g.margin * scale);

  drawSurface(g, totalW, totalHm);

  ctx.strokeStyle = LINE_COLOR;
  ctx.fillStyle = DOT_COLOR;
  ctx.lineWidth = g.lineW;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  if (g.type === 'futsal') drawFutsal(g);
  else drawFootball(g);
}

/* ---------- 바닥(잔디/코트) ---------- */
function drawSurface(g, totalW, totalHm) {
  const x0 = -g.margin;
  const y0 = -g.margin;

  // 라인 밖 여백
  ctx.fillStyle = g.surface.surround || shade(g.surface.base, -0.06);
  ctx.fillRect(x0, y0, totalW, totalHm);

  // 플레이 영역
  ctx.fillStyle = g.surface.base;
  ctx.fillRect(0, 0, g.W, g.H);

  // 잔디 줄무늬 (축구)
  if (g.stripes > 0) {
    const band = g.H / g.stripes;
    ctx.fillStyle = g.surface.alt;
    for (let i = 0; i < g.stripes; i += 2) {
      ctx.fillRect(0, i * band, g.W, band);
    }
  }
}

/* ---------- 11인제 축구 ---------- */
function drawFootball(g) {
  const { W, H } = g;

  ctx.strokeRect(0, 0, W, H);
  line(0, H / 2, W, H / 2);
  circle(W / 2, H / 2, g.centerR);
  dot(W / 2, H / 2, g.lineW * 1.6);

  goalEnds(H).forEach(({ gl, into }) => {
    const pb = g.penaltyBox;
    const gb = g.goalBox;

    ctx.strokeRect(W / 2 - pb.w / 2, Math.min(gl, gl + into * pb.d), pb.w, pb.d);
    ctx.strokeRect(W / 2 - gb.w / 2, Math.min(gl, gl + into * gb.d), gb.w, gb.d);

    const spotY = gl + into * g.penaltySpot;
    dot(W / 2, spotY, g.lineW * 1.6);

    // 페널티 박스 밖으로 나오는 아크만 그린다
    const a = Math.asin((pb.d - g.penaltySpot) / g.arcR);
    ctx.beginPath();
    if (into > 0) ctx.arc(W / 2, spotY, g.arcR, a, Math.PI - a);
    else ctx.arc(W / 2, spotY, g.arcR, Math.PI + a, Math.PI * 2 - a);
    ctx.stroke();

    drawGoal(g, gl, into);
  });

  drawCorners(g);
}

/* ---------- 풋살 ---------- */
function drawFutsal(g) {
  const { W, H } = g;

  ctx.strokeRect(0, 0, W, H);
  line(0, H / 2, W, H / 2);
  circle(W / 2, H / 2, g.centerR);
  dot(W / 2, H / 2, g.lineW * 1.4);

  goalEnds(H).forEach(({ gl, into }) => {
    // 페널티 에어리어: 골포스트 중심 6m 4분원 2개 + 직선 연결
    const half = g.postGap / 2;
    const cxL = W / 2 - half;
    const cxR = W / 2 + half;
    const R = g.areaR;
    const yEnd = gl + into * R;

    ctx.beginPath();
    if (into > 0) {
      ctx.arc(cxL, gl, R, Math.PI, Math.PI / 2, true);
      ctx.lineTo(cxR, yEnd);
      ctx.arc(cxR, gl, R, Math.PI / 2, 0, true);
    } else {
      ctx.arc(cxL, gl, R, Math.PI, Math.PI * 1.5, false);
      ctx.lineTo(cxR, yEnd);
      ctx.arc(cxR, gl, R, Math.PI * 1.5, Math.PI * 2, false);
    }
    if (g.surface.key) {
      ctx.fillStyle = g.surface.key;
      ctx.fill();
      ctx.fillStyle = DOT_COLOR;
    }
    ctx.stroke();

    // 페널티 마크(6m) / 세컨드 페널티 마크(10m)
    dot(W / 2, gl + into * g.penaltySpot, g.lineW * 1.5);
    dot(W / 2, gl + into * g.secondSpot, g.lineW * 1.5);

    drawGoal(g, gl, into);
  });

  // 교체 구역 표시 (하프라인 기준 ±5m, 벤치측 터치라인 바깥으로 80cm)
  [-1, 1].forEach((s) => {
    const y = H / 2 + s * g.subZone;
    line(-0.8, y, 0, y);
  });

  drawCorners(g);
}

/* ---------- 공용 파츠 ---------- */
function drawGoal(g, gl, into) {
  const x = g.W / 2 - g.goalW / 2;
  const y = Math.min(gl, gl - into * g.goalDepth);   // 골라인 바깥쪽
  ctx.save();
  ctx.fillStyle = GOAL_FILL;
  ctx.fillRect(x, y, g.goalW, g.goalDepth);
  ctx.lineWidth = g.lineW;
  ctx.strokeRect(x, y, g.goalW, g.goalDepth);
  ctx.restore();
}

function drawCorners(g) {
  const { W, H, cornerR: r } = g;
  const arcs = [
    [0, 0, 0, Math.PI / 2],
    [W, 0, Math.PI / 2, Math.PI],
    [W, H, Math.PI, Math.PI * 1.5],
    [0, H, Math.PI * 1.5, Math.PI * 2]
  ];
  arcs.forEach(([cx, cy, s, e]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, s, e);
    ctx.stroke();
  });
}

/** 위(상대 골라인)/아래(우리 골라인) — into 는 필드 안쪽 방향 */
function goalEnds(H) {
  return [
    { gl: 0, into: 1 },
    { gl: H, into: -1 }
  ];
}

/* ---------- 작은 도우미 ---------- */
function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function dot(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function round(n, digits) {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

/** hex 색을 밝게(+)/어둡게(-) */
function shade(hex, amount) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clampByte(((num >> 16) & 255) * (1 + amount));
  const gch = clampByte(((num >> 8) & 255) * (1 + amount));
  const b = clampByte((num & 255) * (1 + amount));
  return `rgb(${r}, ${gch}, ${b})`;
}
