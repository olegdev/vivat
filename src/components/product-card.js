// Reusable product card — matches Figma UI SYSTEM "cards-kitchen". Two variants:
//   - default: colour swatches (+more) + comments   (Модульные кухни, Акции)
//   - compact: underlined category link + count      (Популярные товары)
//
// The two card shapes are clean HTML <template>s in partials/product-card.html
// (the future Blade @foreach body); buildCard() clones one and fills the data
// hooks. This file only fills and wires — it never emits structure.

import { demoGallery } from "../data/product-photos.js";

const BADGE_TONE = { new: "badge-new", hit: "badge-hit", discount: "badge-discount" };

const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

// Below `md` the card has two Figma shapes, picked by whether it carries a
// category: cards with one become the 152px `cards-other` tile (its cart action
// drops out of the info row into a full-width "в корзину" pill), swatch cards
// become the 320px `cards-kitchen` tile (Figma 1968:200879). Desktop is the same.
//
// `mobile` overrides that for category cards: "l" takes the 320px `cards-other`
// tile (1968:237927) instead of the 152px one, for rails the design lays out as
// a single mobile row rather than two (the Акции page).
//
// `variant` names a Figma card that is a different component, not a size of the
// same one — the PDP's 322px `cards-modul` and `cards-other size=s`. Each is its
// own <template>; which data hooks a card actually has is read off the clone
// below, so a template can gain or drop a field without touching this function.
const TEMPLATE = {
  modul: "[data-pcard-modul]",
  "other-s": "[data-pcard-other-s]",
  search: "[data-pcard-search]",
};

// Fills a card's gallery: one image, one hover zone and one dot per photo, from
// the templates in partials/product-card.html. Exported because the catalog grid
// keeps its own card unit (the filter attributes ride on it) but the same
// gallery — one place knows what a gallery is made of.
//
// A product with its own `images` (what Blade will pass) uses them; the
// prototype's one-photo fixtures are padded out of the demo pool, or a card's
// gallery would be the same picture three times over. See data/product-photos.js.
export function fillGallery(node, p, { smallDots = false } = {}) {
  const imgs = p.images && p.images.length ? p.images : demoGallery(p.image);
  const track = node.querySelector("[data-card-track]");
  const zonesWrap = node.querySelector("[data-card-zones]");
  const dotsWrap = node.querySelector("[data-card-dots]");
  if (!track) return;

  imgs.forEach((src, i) => {
    const img = clone("[data-pcard-img]");
    img.src = src;
    img.alt = p.title || "";
    img.dataset.cardImg = String(i);
    // Only the frame on screen is worth fetching up front; the rest are promoted
    // by preload() the moment a pointer reaches the card.
    img.loading = i === 0 ? "eager" : "lazy";
    img.decoding = "async";
    track.append(img);

    if (zonesWrap) {
      const zone = clone("[data-pcard-zone]");
      zone.dataset.cardZone = String(i);
      zonesWrap.append(zone);
    }

    const dot = clone("[data-pcard-dot]");
    dot.dataset.cardDot = String(i);
    dot.setAttribute("aria-current", String(i === 0));
    if (smallDots) dot.classList.add("max-md:w-4"); // 152px tile shrinks the dot
    dotsWrap.append(dot);
  });
}

function buildCard(p, { mobile = "s", variant } = {}) {
  const compact = !!p.category;
  const large = compact && mobile === "l";
  const smallTile = !variant && compact && !large; // the 152px mobile tile
  const node = clone(
    TEMPLATE[variant] ||
      (large ? "[data-pcard-compact-l]" : compact ? "[data-pcard-compact]" : "[data-pcard]")
  );

  fillGallery(node, p, { smallDots: smallTile });

  const badgesWrap = node.querySelector("[data-card-badges]");
  (p.badges || []).forEach((b) => {
    const span = document.createElement("span");
    span.className = `badge badge-l ${BADGE_TONE[b.tone] || BADGE_TONE.new}`;
    span.textContent = b.text;
    badgesWrap.append(span);
  });

  const priceEl = node.querySelector("[data-card-price]");
  priceEl.textContent = p.price;
  // Фикстура даёт цену строкой («450 010₽»). Дилерский прайс-лист
  // (components/price-mode.js) считает от числа, а «Оптовая цена» возвращает
  // исходную строку дословно — поэтому храним обе формы.
  priceEl.dataset.priceRaw = p.price;
  priceEl.dataset.priceBase = String(parseInt(String(p.price).replace(/\D/g, ""), 10) || 0);

  node.querySelector("[data-card-oldprice]").textContent = p.oldPrice || "";
  node.querySelector("[data-card-title]").textContent = p.title || "";
  // cart-seam contract on every add button (icon + mobile pill)
  node.querySelectorAll("[data-add-to-cart]").forEach((b) => (b.dataset.productId = p.id ?? ""));

  // Each optional block is filled only if the chosen template carries its hook.
  const cat = node.querySelector("[data-card-category]");
  if (cat && p.category) cat.textContent = `${p.category.label} ${p.category.count}`;

  // cards-modul prints the size as a muted label over its value.
  const specLabel = node.querySelector("[data-card-speclabel]");
  if (specLabel) {
    specLabel.textContent = p.spec?.label || "";
    node.querySelector("[data-card-specvalue]").textContent = p.spec?.value || "";
  }

  const sw = node.querySelector("[data-card-swatches]");
  if (sw) {
    (p.swatches || []).forEach((s) => {
      const chip = clone("[data-pcard-swatch]");
      if (s.img) {
        const img = document.createElement("img");
        img.src = s.img;
        img.alt = "";
        img.className = "size-full rounded-full object-cover";
        chip.append(img);
      } else {
        const dot = document.createElement("span");
        dot.className = "block size-full rounded-full";
        dot.style.background = s.color;
        chip.append(dot);
      }
      sw.append(chip);
    });
    node.querySelector("[data-card-more]").textContent = p.more || "";
    node.querySelector("[data-card-comments]").textContent = String(p.comments ?? 0);
  }
  return node;
}

// Hands a swipe that ran off the end of a card's gallery to the rail around it,
// so a continued swipe keeps moving instead of dead-ending.
//
// Mobile only. On desktop the outer carousel is driven by its arrows, and a
// drag inside a card must never move it: the two sliders are separate controls
// there, and chaining them made the row jump while the pointer was still on a
// card. Below `md` the rail is one continuous scrolling surface under a finger,
// so continuing the gesture into it is the expected behaviour.
function advanceOuterCarousel(card, dir) {
  const section = card.closest("section");
  const viewport = section?.querySelector("[data-viewport]");
  if (!viewport || getComputedStyle(viewport).overflowX === "hidden") return;

  const track = viewport.firstElementChild;
  const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
  viewport.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
}

// A mouse scrubs the gallery, a finger swipes it — the same card, two inputs.
// The gate is the pointer that fired the event, not a viewport width: a touch
// laptop is wide and still has no hover, and a hybrid switches mid-session.
// The zones' `pointer-events` are gated by the matching CSS query (`.card-zones`
// in app.css), so on touch they are inert and the swipe below owns the image.
const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)");
const isMouse = (e) => e.pointerType === "mouse" && FINE_POINTER.matches;

// Wires each card's inner image gallery: hover zones under a mouse, drag/swipe
// under a finger, dots under either. One swipe = one image; once the gallery has
// no image left in that direction, the same gesture advances the surrounding
// carousel instead (once per gesture).
export function initProductCards(root) {
  root.querySelectorAll("article").forEach((card) => {
    const gallery = card.querySelector("[data-card-gallery]");
    const track = card.querySelector("[data-card-track]");
    if (!gallery || !track) return;
    const imgs = [...gallery.querySelectorAll("[data-card-img]")];
    const dotEls = [...card.querySelectorAll("[data-card-dot]")];
    if (imgs.length < 2) return;

    let index = 0;
    // `instant` drops the 300ms slide: a scrub has to keep up with the cursor,
    // where an animated track lags a zone or two behind the pointer.
    const show = (i, { instant = false } = {}) => {
      index = Math.min(Math.max(i, 0), imgs.length - 1);
      track.style.transitionDuration = instant ? "0ms" : "";
      track.style.transform = `translateX(${-index * 100}%)`;
      dotEls.forEach((d, n) => d.setAttribute("aria-current", String(n === index)));
    };

    // Frames 2..n are lazy (see buildCard) so the rails don't fetch a gallery
    // per card up front. Both inputs need them decoded before they're shown, so
    // promote the moment a pointer reaches the card — a scrub or a swipe is
    // always at least one event away from the first frame it reveals.
    let preloaded = false;
    const preload = () => {
      if (preloaded) return;
      preloaded = true;
      imgs.forEach((img) => (img.loading = "eager"));
    };

    dotEls.forEach((d) =>
      d.addEventListener("click", () => show(Number(d.dataset.cardDot)))
    );

    // Hover scrub. Driven by pointermove rather than the zones' own `enter`
    // events on purpose: the outer carousel slides cards sideways under a still
    // cursor, and `enter` alone would flip the image of every card that passed
    // beneath it. Requiring real pointer movement makes that impossible.
    // `buttons` filters out a drag of the rail itself.
    gallery.addEventListener("pointermove", (e) => {
      if (!isMouse(e) || e.buttons !== 0) return;
      preload();
      const zone = e.target.closest("[data-card-zone]");
      if (zone) show(Number(zone.dataset.cardZone), { instant: true });
    });

    // The first frame is the card's canonical photo — a cursor crossing the rail
    // must not leave a trail of half-scrubbed cards behind it. The listener sits
    // on the media box, not the gallery: the dots and badges overlay the gallery
    // without being inside it, so hovering a dot counts as leaving it.
    (gallery.parentElement || gallery).addEventListener("pointerleave", (e) => {
      if (isMouse(e) && index !== 0) show(0, { instant: true });
    });

    // Drag / swipe: ~60px of travel moves exactly one image, and the gesture is
    // then spent — a long drag must not fly through the whole gallery. Lift and
    // swipe again for the next one. Skipped for a mouse, which scrubs instead:
    // the two would fight, and a drag that also scrubbed would land on whatever
    // zone the pointer was released over.
    let startX = null;
    let handedOff = false;
    // Pointer capture throws if the pointer is already gone (a cancel racing a
    // release, synthetic events), which would abort the handler mid-drag.
    const capture = (fn, id) => {
      try {
        fn.call(gallery, id);
      } catch {
        /* pointer already released */
      }
    };

    gallery.addEventListener("pointerdown", (e) => {
      if (isMouse(e)) return;
      preload();
      startX = e.clientX;
      handedOff = false;
      capture(gallery.setPointerCapture, e.pointerId);
    });
    gallery.addEventListener("pointermove", (e) => {
      if (startX === null || handedOff) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) < 60) return;
      const dir = dx < 0 ? 1 : -1;
      const next = index + dir;
      handedOff = true; // one element per gesture, whichever slider takes it
      if (next < 0 || next > imgs.length - 1) {
        // No inner slide left this way — let the outer carousel take the swipe.
        advanceOuterCarousel(card, dir);
        return;
      }
      show(next);
    });
    const endDrag = (e) => {
      startX = null;
      capture(gallery.releasePointerCapture, e.pointerId);
    };
    gallery.addEventListener("pointerup", endDrag);
    gallery.addEventListener("pointercancel", endDrag);
  });
}

export function renderCarousel(el, items, opts = {}) {
  el.replaceChildren(...items.map((p) => buildCard(p, opts)));
  // Compact cards ride two rows deep on mobile — `.rail-2row` lays them out
  // row-major, which needs the column count up front. The 320px ("l") tile is
  // a single-row rail instead, so it keeps the plain flex track; so does any
  // `variant`, whose mobile shape is its own template's business.
  if (items.length && opts.mobile !== "l" && !opts.variant && items.every((p) => p.category)) {
    el.classList.add("rail-2row");
    el.style.setProperty("--cols", String(Math.ceil(items.length / 2)));
  }
  initProductCards(el);
}
