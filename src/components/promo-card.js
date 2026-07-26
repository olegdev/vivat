// Promo / news tile — Figma UI SYSTEM `news-card`. Used by the home page's
// "А как вам вот такое" rail and by the Акции page grid.
//
// The tile's markup is a clean HTML <template> in partials/promo-card.html (the
// future Blade @foreach body); this file only clones, fills and wires. The one
// exception is the coral tile: its SVG is inlined rather than <img src>, because
// the hover animation transforms the three triangle clusters individually and
// only CSS in the document can reach them. It lives in src/ (not public/) so
// Vite resolves and inlines it — same reason the social glyphs do, see app.css.
import CORAL_SVG from "./promo-coral.svg?raw";

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// One tile. `t`:
//   caption      — the text under the media (required)
//   type:"coral" — the animated coral tile; otherwise `img` or `video`
//   img + crop   — photo; `crop` is the image fill's box in Figma as % of the
//                  square (left/top/width/height). Without it the photo covers.
//   video/poster — clip; `offset` seeks it so two copies play out of sync
//   desktopOnly  — tile exists on the 1440 canvas only (the clipped edge tiles)
function buildTile(t) {
  const node = clone("[data-promo-card]").firstElementChild;
  const media = node.querySelector("[data-promo-media]");

  if (t.type === "coral") {
    // The coral SVG carries its own overlay rect, so it gets no extra wash.
    media.innerHTML = CORAL_SVG;
    media.classList.add("promo-coral");
  } else {
    // Every other variant zooms its media 5% on hover (news-card hover 635:5551).
    media.classList.add("promo-zoom");
    const frag = clone(t.video ? "[data-promo-video]" : "[data-promo-img]");
    const el = frag.querySelector("[data-promo-src]");
    el.src = t.video || t.img;
    if (t.video) {
      if (t.poster) el.poster = t.poster;
      if (t.offset) el.dataset.offset = String(t.offset);
    } else {
      el.alt = t.caption || "";
      // Reproduce the Figma media box verbatim when the design hand-places the
      // crop; a plain cover otherwise (see SOLUTIONS.md › faithful-to-Figma media).
      if (t.crop) {
        Object.assign(el.style, {
          left: t.crop.left,
          top: t.crop.top,
          width: t.crop.width,
          height: t.crop.height,
        });
      } else {
        el.classList.add("inset-0", "size-full", "object-cover");
      }
    }
    media.append(frag);
  }

  node.querySelector("[data-promo-caption]").textContent = t.caption;
  if (t.desktopOnly) node.classList.add("max-md:hidden");
  return node;
}

// Restarts a tile's video when the pointer enters it, the way the prototype
// replays the clip on hover. Touch never fires this, so mobile keeps the plain
// autoplay loop. Also seeks any `offset` copy so two tiles run out of sync.
function initPromoVideos(root) {
  root.querySelectorAll("video[data-restart]").forEach((v) => {
    v.closest(".group")?.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      v.currentTime = 0;
      v.play().catch(() => {});
    });
  });
  root.querySelectorAll("video[data-offset]").forEach((v) => {
    const seek = () => {
      if (v.duration) v.currentTime = Number(v.dataset.offset) % v.duration;
    };
    v.readyState >= 1 ? seek() : v.addEventListener("loadedmetadata", seek, { once: true });
  });
}

// Fills `el` with one tile per descriptor. The container owns the tile sizing
// (rail: fixed-width children; grid: grid cells), so the unit itself has none.
export function renderPromoTiles(el, tiles) {
  if (!el) return;
  el.replaceChildren(...tiles.map(buildTile));
  initPromoVideos(el);
}
