/**
 * exporter.js
 * ------------------------------------------------------------------
 * 완성된 전술판 카드(#exportCard)를 SNS 업로드용 이미지로 내보낸다.
 *
 *   1) 이미지 다운로드 : html2canvas 캡처 → PNG 파일 저장 (갤러리/다운로드 폴더)
 *   2) 클립보드 복사   : navigator.clipboard.write(ClipboardItem)
 *                        → 카카오톡 채팅창에 Ctrl+V / ⌘+V 로 바로 붙여넣기
 *   3) 공유하기        : Web Share API(navigator.share) 로 카카오톡·인스타 등
 *                        네이티브 공유 시트 호출 (모바일)
 *
 * 지원하지 않는 브라우저에서는 "길게 눌러 저장" 안내 모달로 자연스럽게 폴백한다.
 * ------------------------------------------------------------------
 */

const CDN_URL = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const TARGET_WIDTH = 1080;       // SNS 업로드에 충분한 가로 해상도
const MAX_SCALE = 4;

let refs = {};
let libPromise = null;

/* ================= 초기화 ================= */
/**
 * @param {object} o
 * @param {HTMLElement} o.card           캡처 대상
 * @param {HTMLElement} o.busy           진행 오버레이
 * @param {HTMLElement} o.busyText
 * @param {HTMLElement} o.toastWrap
 * @param {object} o.modal               { backdrop, close, img, link, guide }
 * @param {()=>void} [o.beforeCapture]   캡처 직전 훅(선택 해제·고화질 렌더 등)
 * @param {()=>void} [o.afterCapture]
 * @param {()=>string} [o.getFilename]
 * @param {()=>string} [o.getShareText]
 */
export function initExporter(o) {
  refs = o;

  if (refs.modal) {
    refs.modal.close.addEventListener('click', closeFallback);
    refs.modal.backdrop.addEventListener('pointerdown', (e) => {
      if (e.target === refs.modal.backdrop) closeFallback();
    });
  }
}

/* ================= 1. PNG 다운로드 ================= */
export async function downloadImage() {
  try {
    const blob = await captureBlob('이미지를 만들고 있어요…');
    const name = filename();
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);

    showToast('이미지를 저장했어요', 'ok');
  } catch (err) {
    await handleFailure(err, 'download');
  }
}

/* ================= 2. 클립보드 복사 ================= */
export async function copyImage() {
  const supported = typeof ClipboardItem !== 'undefined'
    && navigator.clipboard
    && typeof navigator.clipboard.write === 'function';

  if (!supported) {
    showToast('이 브라우저는 이미지 복사를 지원하지 않아요', 'error');
    await openFallbackFromCapture('clipboard');
    return;
  }

  setBusy(true, '이미지를 복사하고 있어요…');
  // Safari 는 사용자 제스처 컨텍스트가 끊기면 거부하므로
  // Blob Promise 를 그대로 ClipboardItem 에 넘긴다.
  const blobPromise = captureBlob(null, true);

  try {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
    } catch (inner) {
      // ClipboardItem 이 Promise 를 못 받는 구형 구현 → Blob 으로 재시도
      const blob = await blobPromise;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }
    setBusy(false);
    showToast('복사 완료! 카카오톡에 붙여넣기 하세요', 'ok');
  } catch (err) {
    setBusy(false);
    await handleFailure(err, 'clipboard', blobPromise);
  }
}

/* ================= 3. Web Share API ================= */
export function canShareImage() {
  return typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && typeof File !== 'undefined';
}

export async function shareImage() {
  if (!canShareImage()) {
    showToast('공유 시트를 지원하지 않는 환경이에요. 저장 후 올려주세요', 'info');
    await openFallbackFromCapture('share');
    return;
  }

  try {
    const blob = await captureBlob('공유 준비 중…');
    const file = new File([blob], filename(), { type: 'image/png' });

    if (!navigator.canShare({ files: [file] })) {
      await openFallbackFromCapture('share');
      return;
    }

    await navigator.share({
      files: [file],
      title: shareText(),
      text: shareText()
    });
  } catch (err) {
    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
      if (err.name === 'NotAllowedError') await openFallbackFromCapture('share');
      return;     // 사용자가 공유 시트를 닫은 경우 — 조용히 종료
    }
    await handleFailure(err, 'share');
  }
}

/* ================= 캡처 파이프라인 ================= */
async function capture() {
  const html2canvas = await ensureLib();
  const card = refs.card;

  if (refs.beforeCapture) refs.beforeCapture();
  await nextFrame();
  await nextFrame();

  try {
    const cssWidth = card.offsetWidth || TARGET_WIDTH / 2;
    const scale = Math.min(MAX_SCALE, Math.max(2, TARGET_WIDTH / cssWidth));

    return await html2canvas(card, {
      backgroundColor: cardBackground(card),
      scale,
      useCORS: true,
      logging: false,
      removeContainer: true,
      ignoreElements: (node) => node.classList && node.classList.contains('no-export')
    });
  } finally {
    if (refs.afterCapture) refs.afterCapture();
  }
}

/**
 * 캡처 → PNG Blob
 * @param {string|null} busyMessage null 이면 오버레이를 직접 제어(호출자 책임)
 * @param {boolean} [keepBusy]      완료 후에도 오버레이를 유지
 */
async function captureBlob(busyMessage, keepBusy = false) {
  if (busyMessage) setBusy(true, busyMessage);
  try {
    const canvas = await capture();
    return await toBlob(canvas);
  } finally {
    if (busyMessage && !keepBusy) setBusy(false);
  }
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지 변환에 실패했어요'));
      }, 'image/png');
    } else {
      try {
        resolve(dataUrlToBlob(canvas.toDataURL('image/png')));
      } catch (e) {
        reject(e);
      }
    }
  });
}

function dataUrlToBlob(dataUrl) {
  const [head, body] = dataUrl.split(',');
  const mime = /:(.*?);/.exec(head)[1];
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/* ================= html2canvas 로더 ================= */
function ensureLib() {
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (libPromise) return libPromise;

  libPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = CDN_URL;
    s.async = true;
    s.onload = () => {
      if (window.html2canvas) resolve(window.html2canvas);
      else reject(new Error('캡처 라이브러리를 불러오지 못했어요'));
    };
    s.onerror = () => {
      libPromise = null;
      reject(new Error('캡처 라이브러리를 불러오지 못했어요 (네트워크 확인)'));
    };
    document.head.appendChild(s);
  });

  return libPromise;
}

/* ================= 폴백 / 오류 ================= */
async function handleFailure(err, kind, blobPromise) {
  console.error('[exporter]', kind, err);

  if (err && /라이브러리/.test(err.message || '')) {
    showToast(err.message, 'error');
    return;
  }

  if (kind === 'clipboard') {
    showToast('복사가 차단됐어요. 아래에서 저장해 주세요', 'error');
  } else {
    showToast('자동 저장이 막혔어요. 아래에서 저장해 주세요', 'error');
  }

  try {
    const blob = blobPromise ? await blobPromise : await captureBlob('이미지를 준비하고 있어요…');
    openFallback(blob, kind);
  } catch (e) {
    showToast('이미지를 만들지 못했어요', 'error');
  }
}

async function openFallbackFromCapture(kind) {
  try {
    const blob = await captureBlob('이미지를 준비하고 있어요…');
    openFallback(blob, kind);
  } catch (e) {
    showToast('이미지를 만들지 못했어요', 'error');
  }
}

function openFallback(blob, kind) {
  if (!refs.modal) return;
  const url = URL.createObjectURL(blob);
  const { backdrop, img, link, guide } = refs.modal;

  if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
  img.src = url;
  img.dataset.url = url;
  link.href = url;
  link.download = filename();

  guide.innerHTML = kind === 'clipboard'
    ? '이 브라우저에서는 이미지 복사가 제한됩니다.<br>이미지를 <strong>길게 눌러 저장</strong>하거나 아래 버튼으로 내려받아 카카오톡에 첨부하세요.'
    : '이미지를 <strong>길게 눌러 저장</strong>하거나 아래 버튼으로 내려받으세요.';

  backdrop.hidden = false;
}

function closeFallback() {
  if (!refs.modal) return;
  refs.modal.backdrop.hidden = true;
}

export function isFallbackOpen() {
  return Boolean(refs.modal) && !refs.modal.backdrop.hidden;
}

export function closeFallbackModal() {
  closeFallback();
}

/* ================= 토스트 / 오버레이 ================= */
export function showToast(message, type = 'info') {
  if (!refs.toastWrap) return;

  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = message;
  refs.toastWrap.appendChild(t);

  setTimeout(() => {
    t.classList.add('is-out');
    setTimeout(() => t.remove(), 240);
  }, 2400);
}

function setBusy(on, message) {
  if (!refs.busy) return;
  if (message && refs.busyText) refs.busyText.textContent = message;
  refs.busy.hidden = !on;
}

/* ================= 유틸 ================= */
function filename() {
  const raw = refs.getFilename ? refs.getFilename() : 'formation';
  const safe = String(raw)
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return `${safe || 'formation'}.png`;
}

function shareText() {
  return refs.getShareText ? refs.getShareText() : '오늘의 라인업';
}

/** 카드의 실제 배경색을 캡처 배경으로 사용 (테마가 바뀌어도 따라간다) */
function cardBackground(card) {
  const bg = getComputedStyle(card).backgroundColor;
  if (!bg || bg === 'transparent' || /rgba\(0,\s*0,\s*0,\s*0\)/.test(bg)) return '#ffffff';
  return bg;
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
