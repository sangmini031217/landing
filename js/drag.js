/**
 * drag.js
 * ------------------------------------------------------------------
 * 마우스 · 터치(모바일) · 펜을 하나로 처리하는 드래그 앤 드롭 엔진.
 *
 *  - Pointer Events 로 단일 코드 경로 (touch-action: none 으로 스크롤 충돌 차단)
 *  - 위치는 항상 "플레이 영역 대비 백분율(%)" 로 계산 → 화면 리사이즈에도 배치 유지
 *  - 경기장 바운더리 밖으로 나가지 못하도록 0~100% 클램핑
 *  - 짧게 눌렀다 뗀 경우(이동 6px 미만)는 드래그가 아니라 탭으로 판정 → 편집 모달
 *  - 키보드 방향키 이동 / Enter·Space 편집 지원 (접근성)
 * ------------------------------------------------------------------
 */

const TAP_THRESHOLD = 6;   // px
const NUDGE_STEP = 1;      // %
const NUDGE_STEP_FINE = 0.25;

/**
 * @param {object} o
 * @param {HTMLElement} o.layer      좌표 기준이 되는 컨테이너(.player-layer)
 * @param {string}      [o.selector] 드래그 대상 선택자
 * @param {(id:string)=>({x:number,y:number})} o.getPosition
 * @param {(id:string,x:number,y:number)=>void} o.onMove
 * @param {(id:string)=>void} [o.onStart]
 * @param {(id:string)=>void} [o.onEnd]
 * @param {(id:string)=>void} [o.onTap]
 * @returns {{destroy:()=>void}}
 */
export function enableDrag(o) {
  const layer = o.layer;
  const selector = o.selector || '.player';
  let active = null;
  let lastPointerTap = 0;   // 포인터 탭과 뒤이어 오는 click 의 중복 처리 방지

  /* ---------- 드래그 시작 ---------- */
  function onPointerDown(e) {
    if (active) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const el = e.target.closest(selector);
    if (!el || !layer.contains(el)) return;

    const id = el.dataset.playerId;
    if (!id) return;

    const box = el.getBoundingClientRect();
    active = {
      id,
      el,
      pointerId: e.pointerId,
      grabDX: e.clientX - (box.left + box.width / 2),
      grabDY: e.clientY - (box.top + box.height / 2),
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };

    try { el.setPointerCapture(e.pointerId); } catch (_) { /* 무시 */ }

    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerCancel);
  }

  /* ---------- 이동 ---------- */
  function onPointerMove(e) {
    if (!active || e.pointerId !== active.pointerId) return;

    if (!active.moved) {
      const dist = Math.hypot(e.clientX - active.startX, e.clientY - active.startY);
      if (dist < TAP_THRESHOLD) return;
      active.moved = true;
      active.el.classList.add('is-dragging');
      if (o.onStart) o.onStart(active.id);
    }

    e.preventDefault();
    const rect = layer.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const x = ((e.clientX - active.grabDX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - active.grabDY - rect.top) / rect.height) * 100;

    o.onMove(active.id, clamp(x), clamp(y));
  }

  /* ---------- 종료 ---------- */
  function onPointerUp(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    const { id, moved } = active;
    cleanup();
    if (moved) {
      if (o.onEnd) o.onEnd(id);
    } else {
      lastPointerTap = Date.now();
      if (o.onTap) o.onTap(id);
    }
  }

  function onPointerCancel(e) {
    if (!active || e.pointerId !== active.pointerId) return;
    const { id, moved } = active;
    cleanup();
    if (moved && o.onEnd) o.onEnd(id);
  }

  function cleanup() {
    if (!active) return;
    const { el, pointerId } = active;
    el.classList.remove('is-dragging');
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
    try { el.releasePointerCapture(pointerId); } catch (_) { /* 무시 */ }
    active = null;
  }

  /* ---------- 키보드 (접근성) ---------- */
  function onKeyDown(e) {
    const el = e.target.closest(selector);
    if (!el) return;
    const id = el.dataset.playerId;
    if (!id) return;

    const step = e.shiftKey ? NUDGE_STEP_FINE : NUDGE_STEP;
    let dx = 0;
    let dy = 0;

    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;

    e.preventDefault();
    const pos = o.getPosition(id);
    if (!pos) return;
    o.onMove(id, clamp(pos.x + dx), clamp(pos.y + dy));
    if (o.onEnd) o.onEnd(id);
  }

  /** 키보드로 버튼을 활성화한 경우(click.detail === 0)에만 탭으로 처리.
   *  마우스/터치 탭은 pointerup 에서 이미 처리하므로 중복을 막는다. */
  function onClick(e) {
    if (e.detail !== 0) return;
    if (Date.now() - lastPointerTap < 700) return;   // 터치 탭이 만든 click 무시
    const el = e.target.closest(selector);
    if (!el || !el.dataset.playerId) return;
    if (o.onTap) o.onTap(el.dataset.playerId);
  }

  layer.addEventListener('pointerdown', onPointerDown);
  layer.addEventListener('keydown', onKeyDown);
  layer.addEventListener('click', onClick);

  return {
    destroy() {
      cleanup();
      layer.removeEventListener('pointerdown', onPointerDown);
      layer.removeEventListener('keydown', onKeyDown);
      layer.removeEventListener('click', onClick);
    }
  };
}

/** 0~100 사이로 제한 (경기장 바운더리) */
function clamp(v) {
  if (Number.isNaN(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v * 100) / 100));
}
