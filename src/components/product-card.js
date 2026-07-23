// Reusable product card — matches Figma UI SYSTEM "cards-kitchen". Two variants:
//   - default: colour swatches (+more) + comments   (Модульные кухни, Акции)
//   - compact: underlined category link + count      (Популярные товары)
//
// The two card shapes are clean HTML <template>s in partials/product-card.html
// (the future Blade @foreach body); buildCard() clones one and fills the data
// hooks. This file only fills and wires — it never emits structure.

const BADGE_TONE = { new: "badge-new", hit: "badge-hit", discount: "badge-discount" };

const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

// Below `md` the card has two Figma shapes, picked by whether it carries a
// category: cards with one become the 152px `cards-other` tile (its cart action
// drops out of the info row into a full-width "в корзину" pill), swatch cards
// become the 320px `cards-kitchen` tile (Figma 1968:200879). Desktop is the same.
function buildCard(p) {
  const compact = !!p.category;
  const node = clone(compact ? "[data-pcard-compact]" : "[data-pcard]");

  // Gallery: a track of full-width images (>= 2 so a swipe has somewhere to go)
  // plus one dot each. The swipe/dot behaviour is wired in initProductCards().
  const imgs = p.images && p.images.length ? p.images : [p.image, p.image, p.image];
  const track = node.querySelector("[data-card-track]");
  const dotsWrap = node.querySelector("[data-card-dots]");
  imgs.forEach((src, i) => {
    const img = clone("[data-pcard-img]");
    img.src = src;
    img.alt = p.title || "";
    img.dataset.cardImg = String(i);
    track.append(img);

    const dot = clone("[data-pcard-dot]");
    dot.dataset.cardDot = String(i);
    dot.setAttribute("aria-current", String(i === 0));
    if (compact) dot.classList.add("max-md:w-4"); // 152px tile shrinks the dot
    dotsWrap.append(dot);
  });

  const badgesWrap = node.querySelector("[data-card-badges]");
  (p.badges || []).forEach((b) => {
    const span = document.createElement("span");
    span.className = `badge badge-l ${BADGE_TONE[b.tone] || BADGE_TONE.new}`;
    span.textContent = b.text;
    badgesWrap.append(span);
  });

  node.querySelector("[data-card-price]").textContent = p.price;
  node.querySelector("[data-card-oldprice]").textContent = p.oldPrice || "";
  node.querySelector("[data-card-title]").textContent = p.title || "";
  // cart-seam contract on every add button (icon + mobile pill)
  node.querySelectorAll("[data-add-to-cart]").forEach((b) => (b.dataset.productId = p.id ?? ""));

  if (compact) {
    node.querySelector("[data-card-category]").textContent = `${p.category.label} ${p.category.count}`;
  } else {
    const sw = node.querySelector("[data-card-swatches]");
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

// Wires each card's inner image gallery: drag/swipe across the image, or dots.
// One swipe = one image. Once the gallery has no image left in that direction,
// the same gesture advances the surrounding carousel instead (once per gesture).
export function initProductCards(root) {
  root.querySelectorAll("article").forEach((card) => {
    const gallery = card.querySelector("[data-card-gallery]");
    const track = card.querySelector("[data-card-track]");
    if (!gallery || !track) return;
    const imgs = [...gallery.querySelectorAll("[data-card-img]")];
    const dotEls = [...card.querySelectorAll("[data-card-dot]")];
    if (imgs.length < 2) return;

    let index = 0;
    const show = (i) => {
      index = Math.min(Math.max(i, 0), imgs.length - 1);
      track.style.transform = `translateX(${-index * 100}%)`;
      dotEls.forEach((d, n) => d.setAttribute("aria-current", String(n === index)));
    };

    dotEls.forEach((d) =>
      d.addEventListener("click", () => show(Number(d.dataset.cardDot)))
    );

    // Drag / swipe: ~60px of travel moves exactly one image, and the gesture is
    // then spent — a long drag must not fly through the whole gallery. Lift and
    // swipe again for the next one.
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

export function renderCarousel(el, items) {
  el.replaceChildren(...items.map(buildCard));
  // Compact cards ride two rows deep on mobile — `.rail-2row` lays them out
  // row-major, which needs the column count up front.
  if (items.length && items.every((p) => p.category)) {
    el.classList.add("rail-2row");
    el.style.setProperty("--cols", String(Math.ceil(items.length / 2)));
  }
  initProductCards(el);
}
