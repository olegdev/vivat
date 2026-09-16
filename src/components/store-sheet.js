// Доля дорожки, которую оставляет карте лист: свёрнутый — 402 из 722
// (2032:158435), поднятый — как под карточкой магазина, 42 из 722
// (2397:152957; кадр списка 2059:169141 рисует 71, клиент выбрал карточку).
const SNAPS_ORDER = [0.557, 0.058];

// `handles` — дополнительные поверхности, за которые лист тянется помимо
// ручки: шапка панели (город + тумблер). Порог 4px оставляет тап тапом, так
// что кнопки внутри шапки продолжают нажиматься.
export function initStoreSheet({
  sheet,
  track,
  grip,
  handles = [],
  onSnap,
  snaps = SNAPS_ORDER,
  raiseClose = false,
}) {
  const SNAPS = snaps;
  if (!sheet || !track) return null;

  let index = 0; // 0 = collapsed, 1 = expanded
  let dragging = false;
  let captured = false;
  let startY = 0;
  let startH = 0;
  let handle = null;

  const trackH = () => track.getBoundingClientRect().height;
  const heightFor = (i) => Math.round(trackH() * (1 - SNAPS[i]));

  const closeBand = raiseClose ? track.querySelector("[data-map-close]") : null;
  const setBand = (on) => {
    closeBand?.classList.toggle("hidden", !on);
    closeBand?.classList.toggle("max-md:flex", on);
  };

  function apply(i, { animate = true } = {}) {
    index = Math.min(SNAPS.length - 1, Math.max(0, i));
    sheet.style.transition = animate ? "height 220ms cubic-bezier(0.22, 0.61, 0.36, 1)" : "";
    sheet.style.height = `${heightFor(index)}px`;
    sheet.dataset.snap = index === 0 ? "collapsed" : "expanded";
    setBand(index > 0);
    onSnap?.(sheet.dataset.snap, heightFor(index));
  }

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    captured = false;
    handle = e.currentTarget;
    startY = e.clientY;
    startH = sheet.getBoundingClientRect().height;
    sheet.style.transition = "";
  }

  function onMove(e) {
    if (!dragging) return;
    const dy = e.clientY - startY;
    if (!captured) {
      if (Math.abs(dy) < 4) return; // still a tap, leave clicks alone
      captured = true;
      handle.setPointerCapture?.(e.pointerId);
    }
    const max = heightFor(SNAPS.length - 1);
    const min = heightFor(0);
    sheet.style.height = `${Math.min(max, Math.max(min, startH - dy))}px`;
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    if (captured) handle.releasePointerCapture?.(e.pointerId);
    // Тап по ручке переключает лист; тап по шапке — нет, там свои кнопки.
    if (!captured) return handle === grip ? apply(index === 0 ? 1 : 0) : undefined;

    const h = sheet.getBoundingClientRect().height;
    const mid = (heightFor(0) + heightFor(1)) / 2;
    apply(h > mid ? 1 : 0);
  }

  for (const el of [grip, ...handles]) {
    if (!el) continue;
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }

  const mq = window.matchMedia("(max-width: 47.99rem)");
  const sync = () => (mq.matches ? apply(index, { animate: false }) : (sheet.style.height = ""));
  mq.addEventListener("change", sync);
  window.addEventListener("resize", sync);
  sync();

  function peak(fraction) {
    sheet.style.transition = "height 220ms cubic-bezier(0.22, 0.61, 0.36, 1)";
    const h = Math.round(trackH() * (1 - fraction));
    sheet.style.height = `${h}px`;
    sheet.dataset.snap = "expanded";
    setBand(true);
    onSnap?.("expanded", h);
  }

  return {
    sync,
    expand: () => apply(1),
    collapse: () => apply(0),
    peak,
    closeBtn: closeBand,
    isExpanded: () => index > 0,
    // Текущая высота листа — столько карты снизу закрыто.
    height: () => (mq.matches ? sheet.getBoundingClientRect().height : 0),
  };
}
