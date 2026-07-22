// Reusable product card — matches Figma UI SYSTEM "cards-kitchen".
// Supports two footer variants seen on customer/Main:
//   - colors:   color swatches (+more) + comments count   (Модульные кухни, Акции)
//   - category: underlined category link + count           (Популярные товары)

// Relative to the consuming page; set once via setIconBase() before rendering.
let ICON = "../../assets/header";
export function setIconBase(base) {
  ICON = base;
}

const BADGE_TONE = { new: "badge-new", hit: "badge-hit", discount: "badge-discount" };

function badge({ text, tone }) {
  return `<span class="badge badge-l ${BADGE_TONE[tone] || BADGE_TONE.new}">${text}</span>`;
}

function dots(active = 0, count = 3, compact = false) {
  // The 152px mobile tile squeezes the 32px indicator down to 16px.
  const cls = compact ? "carousel-dot max-md:w-4" : "carousel-dot";
  return Array.from({ length: count })
    .map((_, i) => {
      return `<button type="button" data-card-dot="${i}" class="${cls}" aria-current="${i === active}"><span></span></button>`;
    })
    .join("");
}

// Image gallery inside a card: a track of full-width images that slides
// horizontally, one image per swipe. Driven by dragging/swiping across the image
// or by clicking a dot — deliberately NOT on hover, so moving the mouse across a
// card leaves it alone. Swiping past either end hands the gesture to the outer
// product carousel (see initProductCards).
function cardGallery(p, compact) {
  const imgs = p.images && p.images.length ? p.images : [p.image, p.image, p.image];
  const layers = imgs
    .map(
      (src, i) => `
      <img src="${src}" alt="${p.title}" data-card-img="${i}" draggable="false"
        class="h-full w-full shrink-0 select-none object-cover mix-blend-multiply" />`
    )
    .join("");
  return `
    <div class="relative h-[327px] w-full touch-pan-y overflow-hidden ${
      compact ? "max-md:h-[111px]" : "max-md:h-[238px]"
    }" data-card-gallery>
      <div class="flex h-full w-full transition-transform duration-300 ease-out will-change-transform" data-card-track>
        ${layers}
      </div>
    </div>`;
}

function swatch(s) {
  const inner = s.img
    ? `<img src="${s.img}" alt="" class="size-full rounded-full object-cover" />`
    : `<span class="block size-full rounded-full" style="background:${s.color}"></span>`;
  return `<span class="size-7 overflow-hidden rounded-full border border-alpha-default">${inner}</span>`;
}

function footer(p) {
  if (p.category) {
    return `<a href="#" class="text-body-s text-text-secondary underline decoration-from-font underline-offset-2 max-md:truncate max-md:text-m-body-xs">${p.category.label} ${p.category.count}</a>`;
  }
  const swatches = (p.swatches || []).map(swatch).join("");
  const more = p.more ? `<span class="text-body-s text-text-secondary">${p.more}</span>` : "";
  return `
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <div class="flex items-center gap-2">${swatches}</div>
      ${more}
    </div>
    <div class="flex items-center gap-1">
      <span class="text-body-s text-text-secondary">${p.comments ?? 0}</span>
      <img src="${ICON}/icon-comment.svg" alt="" class="size-4" />
    </div>`;
}

// Below `md` the card has two Figma shapes, picked by the same signal the
// footer already uses: cards with a category link become the 152px `cards-other`
// tile (Figma I1968:220499;1968:238936) — its cart action drops out of the info
// row and becomes a full-width "в корзину" pill — while swatch cards become the
// 320px `cards-kitchen` tile (1968:200879). Desktop is untouched either way.
export function productCard(p) {
  const compact = !!p.category;
  const badges = (p.badges || []).map(badge).join("");
  const oldPrice = p.oldPrice
    ? `<span class="text-body-n text-text-muted line-through ${
        compact ? "max-md:text-m-body-s-crossed max-md:text-text-secondary" : ""
      }">${p.oldPrice}</span>`
    : "";

  return `
  <article class="flex w-[438px] shrink-0 flex-col max-md:snap-start ${
    compact ? "max-md:w-[152px]" : "max-md:w-[320px]"
  }">
    <div class="relative w-full overflow-hidden rounded-n bg-bg-subtle">
      ${cardGallery(p, compact)}
      ${badges ? `<div class="absolute right-2 top-2 flex items-center gap-1 max-md:right-1 max-md:top-1">${badges}</div>` : ""}
      <div class="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-2 [&>*]:pointer-events-auto ${
        compact ? "max-md:gap-1" : ""
      }">${dots(0, (p.images && p.images.length) || 3, compact)}</div>
    </div>
    <div class="flex flex-col gap-1 px-1 py-3 ${compact ? "max-md:gap-0 max-md:py-1.5" : ""}">
      <div class="flex items-start gap-4 ${compact ? "max-md:gap-0" : "max-md:gap-3"}">
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 max-md:gap-0">
          <div class="flex items-center gap-2 ${compact ? "max-md:gap-1" : ""}">
            <span class="text-body-n-accent text-text-primary max-md:text-m-body-n-accent ${
              compact ? "max-md:hidden" : ""
            }">от</span>
            <span class="text-h3 font-medium text-text-primary ${
              compact ? "max-md:text-m-body-n-accent" : "max-md:text-[18px] max-md:leading-[26px]"
            }">${p.price}</span>
            ${oldPrice}
          </div>
          <p class="line-clamp-2 h-12 text-body-n text-text-primary ${
            compact ? "max-md:h-10 max-md:text-m-body-compact" : "max-md:h-10 max-md:text-m-body-n"
          }">${p.title}</p>
        </div>
        <button class="icon-btn ${compact ? "max-md:hidden" : ""}">
          <img src="${ICON}/icon-order-dark.svg" alt="В корзину" class="size-6" />
        </button>
      </div>
      <div class="flex items-center gap-4 py-1 ${compact ? "max-md:gap-0.5" : ""}">${footer(p)}</div>
    </div>
    ${
      compact
        ? `<button class="hidden h-8 w-full items-center justify-center gap-1.5 rounded-pill bg-components-subtle px-3 transition-colors hover:bg-components-subtle-hover max-md:flex">
             <img src="${ICON}/icon-order-dark.svg" alt="" class="size-4" />
             <span class="text-m-button-s text-text-primary">в корзину</span>
           </button>`
        : ""
    }
  </article>`;
}

// Hands a swipe that ran off the end of a card's gallery to the product
// carousel around it, so a continued drag keeps moving instead of dead-ending.
// The carousel is either a natively scrolling rail (mobile) or the arrow-driven
// track (desktop), so try the rail first and fall back to clicking the arrow.
function advanceOuterCarousel(card, dir) {
  const section = card.closest("section");
  if (!section) return;

  const viewport = section.querySelector("[data-viewport]");
  if (viewport && getComputedStyle(viewport).overflowX !== "hidden") {
    const track = viewport.firstElementChild;
    const gap = track ? parseFloat(getComputedStyle(track).columnGap) || 0 : 0;
    viewport.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
    return;
  }

  const arrow = section.querySelector(dir > 0 ? "[data-next]" : "[data-prev]");
  if (arrow && !arrow.disabled) arrow.click();
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
  el.innerHTML = items.map(productCard).join("");
  // Compact cards ride two rows deep on mobile — `.rail-2row` lays them out
  // row-major, which needs the column count up front.
  if (items.length && items.every((p) => p.category)) {
    el.classList.add("rail-2row");
    el.style.setProperty("--cols", String(Math.ceil(items.length / 2)));
  }
  initProductCards(el);
}
