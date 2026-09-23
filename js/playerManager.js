/**
 * playerManager.js
 * ------------------------------------------------------------------
 * 선수 명단(선발 + 후보)의 단일 소유자.
 *   - 모드/포메이션에 맞춘 명단 구성 및 좌표 적용
 *   - 선수 마커 렌더링(증분 갱신 → CSS 트랜지션으로 부드럽게 이동)
 *   - 이름 / 등번호 / 포지션 / 유니폼 색 편집 모달
 *   - 후보 명단 및 선발 ↔ 후보 교체 로직
 * 좌표는 언제나 상대좌표(%)로만 저장한다.
 * ------------------------------------------------------------------
 */

import { getMode, getFormationSlots, DEFAULT_KIT } from './constants.js';

/* ================= 상태 ================= */
const state = {
  players: [],                 // { id, name, number, pos, x, y, starter, kit, ink, posLocked }
  kit: { ...DEFAULT_KIT },
  seq: 0
};

let el = {};          // DOM 참조
let hooks = {};       // { onChange, onToast }
let editingId = null;
let swapSourceId = null;

/* ================= 초기화 ================= */
export function initPlayerManager(refs) {
  el = refs;
  hooks = { onChange: refs.onChange, onToast: refs.onToast };
  bindModal();
  bindSubList();
}

/* ================= 명단 구성 ================= */

/**
 * 모드/포메이션에 맞춰 명단을 재구성한다.
 * 기존 선수 정보(이름·번호·색)는 최대한 유지하고, 인원 수만 맞춘다.
 * @param {boolean} [fresh] true 면 완전히 새로 만든다(초기화).
 */
export function buildSquad(modeId, formationId, fresh = false) {
  const mode = getMode(modeId);
  const slots = getFormationSlots(modeId, formationId);

  if (fresh) {
    state.players = [];
    state.seq = 0;
  }

  const starters = state.players.filter((p) => p.starter);
  const bench = state.players.filter((p) => !p.starter);
  const used = new Set(state.players.map((p) => p.number));
  const next = [];

  slots.forEach((slot, i) => {
    const reused = starters[i] || bench.shift();
    if (reused) {
      reused.starter = true;
      reused.x = slot.x;
      reused.y = slot.y;
      if (!reused.posLocked) reused.pos = slot.pos;
      next.push(reused);
    } else {
      // 아직 state.players 에 넣기 전이므로 번호 중복을 로컬 Set 으로 막는다
      const number = firstFreeNumber(used);
      used.add(number);
      next.push(createPlayer({ pos: slot.pos, x: slot.x, y: slot.y, starter: true, number }));
    }
  });

  // 인원이 줄어든 모드로 바뀐 경우 남는 선발은 후보로 내린다
  const demoted = starters.slice(slots.length).map((p) => {
    p.starter = false;
    return p;
  });

  state.players = next.concat(demoted, bench);

  if (fresh) {
    for (let i = 0; i < mode.defaultSubs; i += 1) createPlayer({ starter: false, push: true });
  }

  render();
}

/** 포메이션만 바꿔 선발 좌표를 이동시킨다(애니메이션 O). */
export function applyFormation(modeId, formationId) {
  const slots = getFormationSlots(modeId, formationId);
  const starters = getStarters();

  if (starters.length !== slots.length) {
    buildSquad(modeId, formationId);
    return;
  }

  starters.forEach((p, i) => {
    p.x = slots[i].x;
    p.y = slots[i].y;
    if (!p.posLocked) p.pos = slots[i].pos;
  });

  render();
}

function createPlayer({ pos = 'SUB', x = 50, y = 50, starter = false, push = false, number = null }) {
  state.seq += 1;
  const num = number == null ? nextFreeNumber() : number;
  const p = {
    id: `p${state.seq}`,
    name: `선수 ${num}`,
    number: num,
    pos,
    x,
    y,
    starter,
    kit: null,       // null 이면 팀 기본 색 사용
    ink: null,
    posLocked: false
  };
  if (push) state.players.push(p);
  return p;
}

function nextFreeNumber() {
  return firstFreeNumber(new Set(state.players.map((p) => p.number)));
}

function firstFreeNumber(used) {
  let n = 1;
  while (used.has(n)) n += 1;
  return n;
}

/* ================= 조회 / 변경 ================= */
export const getPlayers = () => state.players;
export const getStarters = () => state.players.filter((p) => p.starter);
export const getSubs = () => state.players.filter((p) => !p.starter);
export const getKit = () => ({ ...state.kit });

export function getPosition(id) {
  const p = find(id);
  return p ? { x: p.x, y: p.y } : null;
}

/** 드래그 중 좌표 반영 (재렌더 비용 없이 CSS 변수만 갱신) */
export function movePlayer(id, x, y) {
  const p = find(id);
  if (!p) return;
  p.x = x;
  p.y = y;
  const node = el.layer.querySelector(`[data-player-id="${id}"]`);
  if (node) {
    node.style.setProperty('--x', x);
    node.style.setProperty('--y', y);
  }
}

/** 팀 기본 유니폼 색 적용 (개별 지정도 초기화) */
export function setTeamKit(kit, ink) {
  state.kit = { kit, ink };
  state.players.forEach((p) => { p.kit = null; p.ink = null; });
  render();
}

export function addSub() {
  const p = createPlayer({ starter: false, push: true });
  render();
  openEditor(p.id);
}

/* ================= 렌더링 ================= */
export function render() {
  renderMarkers();
  renderSubList();
  renderCardSubs();
  if (hooks.onChange) hooks.onChange();
}

function renderMarkers() {
  const starters = getStarters();
  const alive = new Set();

  starters.forEach((p) => {
    let node = el.layer.querySelector(`[data-player-id="${p.id}"]`);
    if (!node) {
      node = createMarker(p);
      el.layer.appendChild(node);
    }
    updateMarker(node, p);
    alive.add(p.id);
  });

  Array.from(el.layer.children).forEach((node) => {
    if (!alive.has(node.dataset.playerId)) node.remove();
  });
}

function createMarker(p) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'player';
  btn.dataset.playerId = p.id;

  const pos = document.createElement('span');
  pos.className = 'player__pos';

  const jersey = document.createElement('span');
  jersey.className = 'player__jersey';
  const num = document.createElement('span');
  num.className = 'player__num';
  jersey.appendChild(num);

  const name = document.createElement('span');
  name.className = 'player__name';

  btn.append(pos, jersey, name);
  // 최초 배치는 트랜지션 없이(요소가 새로 생기므로 자연히 애니메이션 없음)
  btn.style.setProperty('--x', p.x);
  btn.style.setProperty('--y', p.y);
  return btn;
}

function updateMarker(node, p) {
  const kit = p.kit || state.kit.kit;
  node.style.setProperty('--x', p.x);
  node.style.setProperty('--y', p.y);
  node.style.setProperty('--kit', kit);
  node.style.setProperty('--kit-ink', p.ink || state.kit.ink);
  node.style.setProperty('--kit-ring', ringFor(kit));
  node.querySelector('.player__pos').textContent = p.pos || '';
  node.querySelector('.player__num').textContent = p.number == null ? '' : p.number;
  node.querySelector('.player__name').textContent = p.name || '';
  node.setAttribute('aria-label',
    `${p.pos || ''} ${p.number == null ? '' : p.number}번 ${p.name || ''} — 드래그로 이동, 클릭하면 편집`);
  node.classList.toggle('is-target', Boolean(swapSourceId) && swapSourceId !== p.id);
}

function renderSubList() {
  const subs = getSubs();
  el.subList.textContent = '';

  subs.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'sub-item';
    li.dataset.playerId = p.id;
    if (swapSourceId === p.id) li.classList.add('is-selected');

    const dot = document.createElement('span');
    dot.className = 'sub-item__dot';
    const dotKit = p.kit || state.kit.kit;
    dot.style.setProperty('--kit', dotKit);
    dot.style.setProperty('--kit-ink', p.ink || state.kit.ink);
    dot.style.setProperty('--kit-ring', ringFor(dotKit, true));
    dot.textContent = p.number == null ? '' : p.number;

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'sub-item__name';
    name.dataset.act = 'edit';
    name.textContent = p.name || '(이름 없음)';

    const pos = document.createElement('span');
    pos.className = 'sub-item__pos';
    pos.textContent = p.pos && p.pos !== 'SUB' ? p.pos : '';

    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'btn btn--mini';
    swapBtn.dataset.act = 'swap';
    swapBtn.textContent = swapSourceId === p.id ? '취소' : '교체';

    li.append(dot, name, pos, swapBtn);
    el.subList.appendChild(li);
  });

  if (el.subEmptyNote) {
    el.subEmptyNote.textContent = subs.length
      ? '후보의 [교체] 를 누른 뒤 경기장의 선수를 선택하면 자리를 맞바꿉니다.'
      : '후보가 없습니다. [+ 추가] 로 벤치를 채워보세요.';
  }
}

/** 캡처 이미지 하단에 들어가는 후보 명단 텍스트 */
function renderCardSubs() {
  const subs = getSubs();
  const box = el.cardSubs;
  if (!box) return;

  const show = typeof el.showSubsOnCard === 'function' ? el.showSubsOnCard() : true;

  box.textContent = '';
  if (!subs.length || !show) {
    box.hidden = true;
    return;
  }

  const tag = document.createElement('b');
  tag.textContent = 'SUB';
  box.appendChild(tag);
  box.appendChild(document.createTextNode(
    subs.map((p) => `${p.number == null ? '' : p.number} ${p.name || ''}`.trim()).join('  ·  ')
  ));
  box.hidden = false;
}

/* ================= 탭 / 교체 ================= */

/** 선수 마커를 탭했을 때: 교체 대기 중이면 교체, 아니면 편집 */
export function handleTap(id) {
  if (swapSourceId && swapSourceId !== id) {
    performSwap(swapSourceId, id);
    return;
  }
  if (swapSourceId === id) {
    cancelSwap();
    return;
  }
  openEditor(id);
}

export function beginSwap(id) {
  swapSourceId = id;
  document.body.classList.add('is-swapping');
  render();
  toast('바꿀 선수를 경기장에서 선택하세요', 'info');
}

export function cancelSwap() {
  if (!swapSourceId) return;
  swapSourceId = null;
  document.body.classList.remove('is-swapping');
  render();
}

export function isSwapping() {
  return Boolean(swapSourceId);
}

function performSwap(aId, bId) {
  const a = find(aId);
  const b = find(bId);
  swapSourceId = null;
  document.body.classList.remove('is-swapping');
  if (!a || !b) { render(); return; }

  swapKeys(a, b, ['x', 'y', 'starter', 'pos', 'posLocked']);

  // 후보로 내려간 선수는 벤치 순서 뒤로
  state.players = state.players.filter((p) => p.starter).concat(state.players.filter((p) => !p.starter));

  render();
  toast(`${b.name} ↔ ${a.name} 교체 완료`, 'ok');
}

function swapKeys(a, b, keys) {
  keys.forEach((k) => {
    const tmp = a[k];
    a[k] = b[k];
    b[k] = tmp;
  });
}

/* ================= 편집 모달 ================= */
function bindModal() {
  const m = el.modal;
  if (!m) return;

  m.form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditor();
  });

  m.close.addEventListener('click', closeEditor);
  m.cancel.addEventListener('click', closeEditor);
  m.backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === m.backdrop) closeEditor();
  });

  m.del.addEventListener('click', () => {
    if (!editingId) return;
    const p = find(editingId);
    state.players = state.players.filter((x) => x.id !== editingId);
    closeEditor();
    render();
    toast(`${p ? p.name : '선수'} 삭제됨`, 'ok');
  });

  m.swapBtn.addEventListener('click', () => {
    const targetId = m.swap.value;
    if (!editingId || !targetId) return;
    const a = editingId;
    closeEditor();
    performSwap(a, targetId);
  });
}

export function openEditor(id) {
  const p = find(id);
  const m = el.modal;
  if (!p || !m) return;

  editingId = id;
  m.title.textContent = p.starter ? '선발 선수 정보' : '후보 선수 정보';
  m.name.value = p.name || '';
  m.number.value = p.number == null ? '' : p.number;
  m.pos.value = p.pos || '';
  m.kit.value = toHex(p.kit || state.kit.kit);
  m.ink.value = toHex(p.ink || state.kit.ink);

  // 교체 대상 목록
  m.swap.textContent = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '— 선택 —';
  m.swap.appendChild(placeholder);

  state.players
    .filter((x) => x.id !== id)
    .forEach((x) => {
      const opt = document.createElement('option');
      opt.value = x.id;
      opt.textContent = `${x.starter ? '선발' : '후보'} · ${x.number == null ? '' : x.number} ${x.name}`;
      m.swap.appendChild(opt);
    });

  m.backdrop.hidden = false;
  requestAnimationFrame(() => m.name.focus());
}

export function closeEditor() {
  editingId = null;
  if (el.modal) el.modal.backdrop.hidden = true;
}

export function isEditorOpen() {
  return Boolean(el.modal) && !el.modal.backdrop.hidden;
}

function saveEditor() {
  const p = find(editingId);
  const m = el.modal;
  if (!p) return;

  p.name = m.name.value.trim() || p.name;

  const rawNum = m.number.value.trim();
  if (rawNum !== '') {
    const n = Math.max(0, Math.min(99, parseInt(rawNum, 10) || 0));
    p.number = n;
  }

  const rawPos = m.pos.value.trim();
  if (rawPos && rawPos !== p.pos) {
    p.pos = rawPos;
    p.posLocked = true;     // 사용자가 직접 지정 → 포메이션 변경 시 유지
  }

  p.kit = m.kit.value === toHex(state.kit.kit) ? null : m.kit.value;
  p.ink = m.ink.value === toHex(state.kit.ink) ? null : m.ink.value;

  closeEditor();
  render();
}

/* ================= 후보 목록 이벤트 ================= */
function bindSubList() {
  if (!el.subList) return;

  el.subList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    const li = e.target.closest('.sub-item');
    if (!btn || !li) return;

    const id = li.dataset.playerId;
    if (btn.dataset.act === 'edit') openEditor(id);
    else if (btn.dataset.act === 'swap') {
      if (swapSourceId === id) cancelSwap();
      else beginSwap(id);
    }
  });
}

/* ================= 유틸 ================= */
function find(id) {
  return state.players.find((p) => p.id === id) || null;
}

function toast(msg, type) {
  if (hooks.onToast) hooks.onToast(msg, type);
}

/**
 * 마커 테두리 색. 밝은 유니폼(흰색·샌드 등)은 흰 링을 쓰면 배경과 붙어버리므로
 * 잉크 계열 헤어라인으로 바꾼다.
 * @param {string} hex 유니폼 색
 * @param {boolean} [subtle] 후보 목록의 작은 점용(더 흐리게)
 */
function ringFor(hex, subtle = false) {
  const c = toHex(hex);
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.62) return subtle ? 'rgba(17,24,39,0.16)' : 'rgba(17,24,39,0.2)';
  return subtle ? 'transparent' : '#ffffff';
}

/** <input type="color"> 는 #rrggbb 만 허용 */
function toHex(color) {
  if (typeof color !== 'string') return '#1a73e8';
  const c = color.trim();
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) {
    return ('#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toLowerCase();
  }
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c);
  if (m) {
    const hex = [1, 2, 3]
      .map((i) => Math.max(0, Math.min(255, parseInt(m[i], 10))).toString(16).padStart(2, '0'))
      .join('');
    return `#${hex}`;
  }
  return '#1a73e8';
}
