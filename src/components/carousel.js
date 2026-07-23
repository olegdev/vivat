// Horizontal product rail — the "title-block + arrows + track" section used by
// the home page (Модульные кухни / Популярные товары / Акции) and the catalog
// page (Популярные товары для кухни). One shell, two behaviours: desktop
// translates [data-track] behind the arrows; below `md` the viewport scrolls
// natively and the arrows give way to the progress bar + full-width action.
//
// Extracted from customer/main.js so a second page can mount the same section
// without re-emitting its markup. The card markup itself still lives in
// product-card.js (see the PHP Blade note in CLAUDE.md — that render function is
// existing debt, not a pattern to extend).
import { renderCarousel } from "./product-card.js";

// Relative to the consuming page; set once via setCarouselIconBase().
let ICON = "../../assets/header";
export function setCarouselIconBase(base) {
  ICON = base;
}

export const MOBILE = window.matchMedia("(max-width: 767px)");

// ---- tab chips (e.g. Популярные товары) -------------------------------------
// Mobile turns the row into a 56px edge-to-edge rail (Figma `segments`
// 1968:201371); the negative margin lets it bleed past the section padding.
function chips(tabs = []) {
  if (!tabs.length) return "";
  const items = tabs
    .map((t, i) =>
      i === 0
        ? `<button class="chip" aria-selected="true">${t}</button>`
        : `<button class="chip">${t}</button>`
    )
    .join("");
  const more = `<button class="chip gap-1 border border-border-light bg-bg-page text-text-muted">еще <span class="tracking-widest">···</span></button>`;
  return `<div data-chips class="flex items-center gap-2 pt-6 max-md:scroll-rail max-md:-mx-4 max-md:h-14 max-md:snap-x max-md:snap-proximity max-md:scroll-pl-4 max-md:overflow-x-auto max-md:px-4 max-md:pt-0 *:max-md:snap-start">${items}${more}</div>`;
}

// ---- carousel section shell (title-block + arrows + track) ------------------
export function carouselSection({ title, desc, action = "В раздел", tabs }) {
  return `
  <section class="flex flex-col">
    <div class="px-10 max-md:px-4">
      <div class="h-20 max-md:h-10"></div>
      <div class="flex items-start justify-between">
        <div class="flex w-[783px] flex-col max-md:w-full">
          <div class="flex min-h-11 items-center max-md:min-h-6">
            <h2 class="text-h2 text-text-primary max-md:text-m-h2">${title}</h2>
          </div>
          <div class="h-2 max-md:h-1"></div>
          <p class="text-body-n-accent text-text-primary max-md:text-m-body-n">${desc}</p>
        </div>
        <div class="flex h-11 items-start px-2 max-md:hidden">
          <a href="#" class="btn btn-m btn-secondary">
            <span>${action}</span>
            <img src="${ICON}/arrow-right-24.svg" alt="" class="size-6" />
          </a>
        </div>
      </div>
      ${chips(tabs)}
      <div class="h-6 max-md:h-3"></div>
    </div>
    <div class="relative w-[1440px] px-10 max-md:w-full max-md:px-4">
      <div class="overflow-hidden max-md:scroll-rail max-md:snap-x max-md:snap-proximity max-md:scroll-pl-4 max-md:overflow-x-auto" data-viewport>
        <div class="flex gap-6 transition-transform duration-500 ease-out will-change-transform max-md:gap-2" data-track></div>
      </div>
      <button data-prev aria-label="Назад" class="carousel-arrow absolute left-4 top-[139px] max-md:hidden">
        <img src="${ICON}/chevron-left.svg" alt="" class="size-6" />
      </button>
      <button data-next aria-label="Вперёд" class="carousel-arrow absolute right-4 top-[139px] max-md:hidden">
        <img src="${ICON}/chevron-right.svg" alt="" class="size-6" />
      </button>
    </div>
    <div class="hidden max-md:block">
      <div class="scroll-progress" data-progress><span><i></i></span></div>
      <div class="px-4 pt-2">
        <a href="#" class="btn btn-m btn-secondary w-full">
          <span>${action}</span>
          <img src="${ICON}/arrow-right-24.svg" alt="" class="size-6" />
        </a>
      </div>
    </div>
  </section>`;
}

// Mobile rails scroll natively under a finger, but a mouse drag does nothing —
// so on a narrow desktop window the card text, the chips and the promo tiles all
// felt dead. This gives pointer devices the same grab-and-pull, anywhere on the
// rail. `ignore` keeps the gesture off elements that run their own slider (the
// card's inner gallery), and the capture-phase click guard stops the drag from
// ending in a navigation.
export function enableDragScroll(el, { ignore } = {}) {
  if (!el) return;
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let moved = false;

  el.addEventListener("pointerdown", (e) => {
    if (!MOBILE.matches || e.pointerType === "touch") return;
    if (ignore && e.target.closest?.(ignore)) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startScroll = el.scrollLeft;
    // Snap has to stand down while a drag is live: it re-snaps after every
    // assignment to scrollLeft, so a short pull never escapes the point it
    // started from. It comes back on release, which is what eases the rail onto
    // the nearest card.
    el.style.scrollSnapType = "none";
    // Capture, so a flick that runs past the edge of the rail keeps scrolling
    // instead of dying the moment the cursor leaves the element.
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 4) return;
    moved = true;
    el.scrollLeft = startScroll - dx;
    e.preventDefault();
  });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    el.style.scrollSnapType = "";
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);

  el.addEventListener(
    "click",
    (e) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    },
    true
  );
}

// Mirrors a natively-scrolling rail onto the 2px progress bar the mobile
// sections use in place of arrows: thumb width = visible fraction, offset =
// scroll position.
export function initScrollProgress(sectionEl) {
  const viewport = sectionEl.querySelector("[data-viewport]");
  const bar = sectionEl.querySelector("[data-progress] i");
  if (!viewport || !bar) return;

  const update = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    const frac = max > 0 ? viewport.clientWidth / viewport.scrollWidth : 1;
    const pos = max > 0 ? viewport.scrollLeft / max : 0;
    // `translate` composes ahead of `scale`, so the offset is in the track's own
    // (unscaled) width: the thumb travels across the 1 - frac it doesn't cover.
    bar.style.scale = `${frac} 1`;
    bar.style.translate = `${pos * (1 - frac) * 100}%`;
  };

  viewport.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// Wires prev/next arrows to slide the track. Works on any section built by
// carouselSection(): [data-viewport] clips, [data-track] translates by one card.
// Below `md` the viewport scrolls natively instead, so the transform is cleared.
export function initCarousel(sectionEl) {
  const viewport = sectionEl.querySelector("[data-viewport]");
  const track = sectionEl.querySelector("[data-track]");
  const prev = sectionEl.querySelector("[data-prev]");
  const next = sectionEl.querySelector("[data-next]");
  if (!viewport || !track || !prev || !next) return { reset() {} };

  initScrollProgress(sectionEl);
  // The gallery inside a card runs its own gesture, so drags starting there are
  // left alone; everywhere else on the card (price, title, footer) pulls the rail.
  enableDragScroll(viewport, { ignore: "[data-card-gallery]" });
  enableDragScroll(sectionEl.querySelector("[data-chips]"));

  // Index-based, not pixel-based: clamping a raw pixel offset to maxOffset left a
  // few-px remainder, so stepping back needed two clicks before "prev" disabled.
  let index = 0;

  const maxOffset = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  // The gap is read per step, not cached: it differs between breakpoints
  // (gap-6 / max-md:gap-2), so a value captured at init survived a resize and
  // left every step 16px short, drifting the cards off the frame edge.
  const step = () => {
    const card = track.firstElementChild;
    if (!card) return viewport.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.offsetWidth + gap;
  };
  const maxIndex = () => Math.ceil(maxOffset() / step());

  function apply() {
    if (MOBILE.matches) {
      track.style.transform = "";
      return;
    }
    // When the cards fit the viewport there's nothing to scroll — hide both
    // arrows rather than leave them disabled-but-visible. This matters after a
    // tab filter trims the rail down to one or two cards.
    const scrollable = maxOffset() > 1;
    prev.classList.toggle("hidden", !scrollable);
    next.classList.toggle("hidden", !scrollable);

    index = Math.min(Math.max(index, 0), maxIndex());
    track.style.transform = `translateX(${-Math.min(index * step(), maxOffset())}px)`;
    prev.disabled = index <= 0;
    next.disabled = index >= maxIndex();
  }

  prev.addEventListener("click", () => {
    index -= 1;
    apply();
  });
  next.addEventListener("click", () => {
    index += 1;
    apply();
  });
  window.addEventListener("resize", apply);
  apply();

  // Handed back so a tab switch can snap the fresh track back to the start.
  return {
    reset() {
      index = 0;
      apply();
    },
  };
}

// Builds a carousel section into `anchor` and wires it. `cfg` is the
// carouselSection() config (title / desc / action / tabs / endpoint); `items`
// are product-card descriptors.
export function mountCarousel(anchor, cfg, items) {
  if (!anchor) return;
  anchor.innerHTML = carouselSection(cfg);
  const track = anchor.querySelector("[data-track]");
  renderCarousel(track, items);
  const carousel = initCarousel(anchor);
  if (cfg.tabs?.length) initTabs(anchor, track, carousel, cfg, items);
}

// Category tabs over a carousel (e.g. Популярные товары). This is a REQUEST
// SEAM in the same shape as the catalog filters (see SOLUTIONS.md › "Filters:
// form + request seam"): a tab is a query parameter, and one function loads the
// tab's products. Today it filters the already-rendered `items` by their `tab`
// field; in the Blade build the body of the click handler becomes a fetch:
//
//     const res = await fetch(`${cfg.endpoint}?tab=${encodeURIComponent(label)}`);
//     renderCarousel(track, await res.json());   // server-rendered/JSON cards
//
// The tab markup (chips) and the card markup don't change when that swap lands.
function initTabs(anchor, track, carousel, cfg, items) {
  const chipsRow = anchor.querySelector("[data-chips]");
  if (!chipsRow) return;
  // chips() also renders a trailing "еще" more-button — the tabs are the first
  // cfg.tabs.length chips.
  const tabChips = [...chipsRow.querySelectorAll(".chip")].slice(0, cfg.tabs.length);

  tabChips.forEach((chip, i) => {
    chip.addEventListener("click", () => {
      tabChips.forEach((c) => c.setAttribute("aria-selected", String(c === chip)));
      const label = cfg.tabs[i];
      // --- SEAM: load this tab's products (swap the body for a fetch, above) ---
      const shown = i === 0 ? items : items.filter((p) => p.tab === label);
      renderCarousel(track, shown);
      carousel.reset();
    });
  });
}
