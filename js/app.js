/**
 * app.js
 * ------------------------------------------------------------------
 * 애플리케이션 진입점.
 *   DOM 참조 수집 → 각 모듈 초기화 → 이벤트 리스너 통합.
 *   비즈니스 로직은 각 모듈(pitch / drag / playerManager / exporter)이 담당하고
 *   여기서는 "무엇이 무엇에 연결되는지"만 관리한다.
 * ------------------------------------------------------------------
 */

import { MODES, MODE_ORDER, DEFAULT_MODE, KIT_PRESETS, DEFAULT_KIT, getMode } from './constants.js';
import { initPitch, setPitchMode, setQuality } from './pitch.js';
import { enableDrag } from './drag.js';
import * as Squad from './playerManager.js';
import {
  initExporter, downloadImage, copyImage, shareImage,
  canShareImage, showToast, isFallbackOpen, closeFallbackModal
} from './exporter.js';

const $ = (id) => document.getElementById(id);

/* ================= 상태 ================= */
const state = {
  modeId: DEFAULT_MODE,
  formationId: getMode(DEFAULT_MODE).defaultFormation
};

/* ================= DOM ================= */
const el = {
  card: $('exportCard'),
  frame: $('pitchFrame'),
  canvas: $('pitchCanvas'),
  layer: $('playerLayer'),

  cardTeam: $('cardTeam'),
  cardSub: $('cardSub'),
  cardFormation: $('cardFormation'),
  cardDate: $('cardDate'),
  cardSubs: $('cardSubs'),
  cardModeLabel: $('cardModeLabel'),

  modeGroup: $('modeGroup'),
  formationGroup: $('formationGroup'),

  inputTeam: $('inputTeam'),
  inputSub: $('inputSub'),
  inputDate: $('inputDate'),

  kitSwatches: $('kitSwatches'),
  inputKit: $('inputKit'),
  inputInk: $('inputInk'),

  optName: $('optName'),
  optNumber: $('optNumber'),
  optPos: $('optPos'),
  optSubsOnCard: $('optSubsOnCard'),

  subList: $('subList'),
  subEmptyNote: $('subEmptyNote'),
  btnAddSub: $('btnAddSub'),

  btnDownload: $('btnDownload'),
  btnDownloadTop: $('btnDownloadTop'),
  btnCopy: $('btnCopy'),
  btnShare: $('btnShare'),
  btnResetTop: $('btnResetTop'),

  busy: $('busyOverlay'),
  busyText: $('busyText'),
  toastWrap: $('toastWrap')
};

/* ================= 부팅 ================= */
function boot() {
  initPitch({ frame: el.frame, canvas: el.canvas });

  Squad.initPlayerManager({
    layer: el.layer,
    subList: el.subList,
    subEmptyNote: el.subEmptyNote,
    cardSubs: el.cardSubs,
    showSubsOnCard: () => el.optSubsOnCard.checked,
    onToast: showToast,
    modal: {
      backdrop: $('playerModal'),
      form: $('playerForm'),
      title: $('pmTitle'),
      name: $('pmName'),
      number: $('pmNumber'),
      pos: $('pmPos'),
      kit: $('pmKit'),
      ink: $('pmInk'),
      swap: $('pmSwap'),
      swapBtn: $('pmSwapBtn'),
      del: $('pmDelete'),
      cancel: $('pmCancel'),
      close: $('pmClose')
    }
  });

  initExporter({
    card: el.card,
    busy: el.busy,
    busyText: el.busyText,
    toastWrap: el.toastWrap,
    modal: {
      backdrop: $('exportModal'),
      close: $('emClose'),
      img: $('exportPreview'),
      link: $('exportDownloadLink'),
      guide: $('exportGuide')
    },
    beforeCapture: () => {
      Squad.cancelSwap();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      el.card.classList.add('is-capturing');   // 텍스트 베이스라인 보정 (player.css)
      setQuality(2);                           // 캔버스 라인을 고배율로 재렌더
    },
    afterCapture: () => {
      el.card.classList.remove('is-capturing');
      setQuality(1);
    },
    getFilename: () => `${el.inputTeam.value || '라인업'}_${state.formationId}_${el.inputDate.value}`,
    getShareText: () => {
      const team = el.inputTeam.value || '우리팀';
      const sub = el.inputSub.value ? ` ${el.inputSub.value}` : '';
      return `${team}${sub} · ${state.formationId} 라인업`;
    }
  });

  enableDrag({
    layer: el.layer,
    selector: '.player',
    getPosition: Squad.getPosition,
    onMove: Squad.movePlayer,
    onTap: Squad.handleTap
  });

  buildModeButtons();
  buildKitSwatches();
  bindPanel();
  bindShare();
  bindGlobalKeys();

  // 초기값
  el.inputDate.value = todayISO();
  el.inputKit.value = DEFAULT_KIT.kit;
  el.inputInk.value = DEFAULT_KIT.ink;

  applyMode(state.modeId, { fresh: true });
  syncCardMeta();
  syncDisplayOptions();

  if (!canShareImage()) {
    el.btnShare.title = '이 브라우저는 네이티브 공유 시트를 지원하지 않아 저장 안내로 대체됩니다';
  }
}

/* ================= 모드 / 포메이션 ================= */
function buildModeButtons() {
  el.modeGroup.textContent = '';
  MODE_ORDER.forEach((id) => {
    const mode = MODES[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'segmented__btn';
    b.dataset.mode = id;
    b.textContent = mode.short;
    b.setAttribute('aria-pressed', String(id === state.modeId));
    b.addEventListener('click', () => applyMode(id));
    el.modeGroup.appendChild(b);
  });
}

function buildFormationChips() {
  const mode = getMode(state.modeId);
  el.formationGroup.textContent = '';

  Object.keys(mode.formations).forEach((key) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.formation = key;
    b.textContent = key;
    b.setAttribute('aria-pressed', String(key === state.formationId));
    b.addEventListener('click', () => applyFormation(key));
    el.formationGroup.appendChild(b);
  });
}

function applyMode(modeId, { fresh = false } = {}) {
  const mode = getMode(modeId);
  state.modeId = mode.id;
  state.formationId = mode.defaultFormation;

  el.card.style.setProperty('--card-max-w', `${mode.cardMaxWidth}px`);
  el.cardModeLabel.textContent = mode.label;

  setPitchMode(mode.id);
  Squad.buildSquad(mode.id, state.formationId, fresh);

  buildFormationChips();
  syncPressed(el.modeGroup, 'mode', mode.id);
  syncCardMeta();
}

function applyFormation(formationId) {
  state.formationId = formationId;
  Squad.applyFormation(state.modeId, formationId);
  syncPressed(el.formationGroup, 'formation', formationId);
  syncCardMeta();
}

function syncPressed(group, key, value) {
  Array.from(group.children).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset[key] === value));
  });
}

/* ================= 패널 바인딩 ================= */
function buildKitSwatches() {
  el.kitSwatches.textContent = '';
  KIT_PRESETS.forEach((preset) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.setProperty('--swatch', preset.kit);
    b.title = preset.label;
    b.setAttribute('aria-label', `${preset.label} 유니폼`);
    b.dataset.kit = preset.kit;
    b.addEventListener('click', () => {
      el.inputKit.value = preset.kit;
      el.inputInk.value = preset.ink;
      applyKit();
    });
    el.kitSwatches.appendChild(b);
  });
}

function applyKit() {
  Squad.setTeamKit(el.inputKit.value, el.inputInk.value);
  Array.from(el.kitSwatches.children).forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.kit.toLowerCase() === el.inputKit.value.toLowerCase()));
  });
}

function bindPanel() {
  el.inputTeam.addEventListener('input', syncCardMeta);
  el.inputSub.addEventListener('input', syncCardMeta);
  el.inputDate.addEventListener('change', syncCardMeta);

  el.inputKit.addEventListener('input', applyKit);
  el.inputInk.addEventListener('input', applyKit);

  [el.optName, el.optNumber, el.optPos].forEach((box) => {
    box.addEventListener('change', syncDisplayOptions);
  });
  el.optSubsOnCard.addEventListener('change', () => Squad.render());

  el.btnAddSub.addEventListener('click', () => Squad.addSub());

  el.btnResetTop.addEventListener('click', () => {
    const ok = window.confirm('선수 이름·번호·위치를 모두 초기화할까요?');
    if (!ok) return;
    Squad.buildSquad(state.modeId, state.formationId, true);
    showToast('라인업을 초기화했어요', 'ok');
  });
}

function syncDisplayOptions() {
  el.card.classList.toggle('hide-name', !el.optName.checked);
  el.card.classList.toggle('hide-number', !el.optNumber.checked);
  el.card.classList.toggle('hide-pos', !el.optPos.checked);
}

function syncCardMeta() {
  el.cardTeam.textContent = el.inputTeam.value.trim() || 'FC 우리팀';

  const sub = el.inputSub.value.trim();
  el.cardSub.textContent = sub;
  el.cardSub.hidden = sub === '';

  el.cardFormation.textContent = state.formationId;
  el.cardDate.textContent = formatDate(el.inputDate.value);
}

/* ================= 공유 버튼 ================= */
function bindShare() {
  const guard = (fn) => async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await fn();
    } finally {
      btn.disabled = false;
    }
  };

  el.btnDownload.addEventListener('click', guard(downloadImage));
  el.btnDownloadTop.addEventListener('click', guard(downloadImage));
  el.btnCopy.addEventListener('click', guard(copyImage));
  el.btnShare.addEventListener('click', guard(shareImage));
}

/* ================= 전역 키 ================= */
function bindGlobalKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isFallbackOpen()) closeFallbackModal();
      else if (Squad.isEditorOpen()) Squad.closeEditor();
      else if (Squad.isSwapping()) Squad.cancelSwap();
      return;
    }

    // ⌘/Ctrl + S : 이미지 저장, ⌘/Ctrl + Shift + C : 클립보드 복사
    const meta = e.metaKey || e.ctrlKey;
    if (!meta || Squad.isEditorOpen()) return;

    if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      downloadImage();
    } else if (e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copyImage();
    }
  });
}

/* ================= 유틸 ================= */
function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${y}.${m}.${d}`;
}

/* ================= 실행 ================= */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
