// Bottom sheet over the dealer map — the order page's шаг 1 below `md`
// (Figma 2032:158435 collapsed / 2059:169141 expanded).
//
// Figma draws three 360 frames for this step but only two distinct shapes:
// the sheet's top edge sits 402px into the 722px map area collapsed, and 161px
// expanded — 55.7% and 22.3%. Those are the snap points; the drag is real, and
// a flick lands on whichever point the gesture is heading for.
//
// The gesture follows the rule this project already paid for once: NEVER take
// pointer capture on `pointerdown`, only once a drag is actually under way,
// or the browser dispatches the following `click` on the capturing element and
// everything inside the sheet goes dead for mouse users (SOLUTIONS.md › Touch
// gestures).
const SNAPS = [0.557, 0.223]; // top edge as a fraction of the sheet's track

export function initStoreSheet({ sheet, track, grip, onSnap }) {
  if (!sheet || !track) return null;

  let index = 0; // 0 = collapsed, 1 = expanded
  let dragging = false;
  let captured = false;
  let startY = 0;
  let startH = 0;

  const trackH = () => track.getBoundingClientRect().height;
  const heightFor = (i) => Math.round(trackH() * (1 - SNAPS[i]));

  function apply(i, { animate = true } = {}) {
    index = Math.min(SNAPS.length - 1, Math.max(0, i));
    sheet.style.transition = animate ? "height 220ms cubic-bezier(0.22, 0.61, 0.36, 1)" : "";
    sheet.style.height = `${heightFor(index)}px`;
    sheet.dataset.snap = index === 0 ? "collapsed" : "expanded";
    onSnap?.(sheet.dataset.snap);
  }

  // Read the track per gesture rather than caching it — it changes with the
  // viewport, and a stale value drifts after a rotate/resize.
  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    captured = false;
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
      grip.setPointerCapture?.(e.pointerId);
    }
    const max = heightFor(SNAPS.length - 1);
    const min = heightFor(0);
    sheet.style.height = `${Math.min(max, Math.max(min, startH - dy))}px`;
  }

  function onUp(e) {
    if (!dragging) return;
    dragging = false;
    if (captured) grip.releasePointerCapture?.(e.pointerId);
    if (!captured) return apply(index === 0 ? 1 : 0); // a tap on the grip toggles

    // Land on the snap the gesture is heading for, not the nearest one.
    const h = sheet.getBoundingClientRect().height;
    const mid = (heightFor(0) + heightFor(1)) / 2;
    apply(h > mid ? 1 : 0);
  }

  grip.addEventListener("pointerdown", onDown);
  grip.addEventListener("pointermove", onMove);
  grip.addEventListener("pointerup", onUp);
  grip.addEventListener("pointercancel", onUp);

  const mq = window.matchMedia("(max-width: 47.99rem)");
  const sync = () => (mq.matches ? apply(index, { animate: false }) : (sheet.style.height = ""));
  mq.addEventListener("change", sync);
  window.addEventListener("resize", sync);
  sync();

  // `sync` is public because the order page lays this out while шаг 1 is still
  // hidden — the track measures 0 then, and the sheet must be re-measured when
  // the step opens (same reason the map needs `refresh`).
  return { sync, expand: () => apply(1), collapse: () => apply(0) };
}
