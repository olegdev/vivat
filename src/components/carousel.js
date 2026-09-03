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

export const MOBILE = window.matchMedia("(max-width: 767px)");

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);
const drop = (root, sel) => root.querySelector(sel)?.remove();

// ---- carousel section shell (title-block + arrows + track) ------------------
// The markup is a clean HTML <template> in partials/carousel-section.html (the
// future Blade partial); this only clones it and fills the hooks.
//
// `desktopAction: false` for the sections whose Figma title-block carries an
// empty `buttons` frame (the Акции page's rail, 2248:97229) — the mobile action
// under the rail is part of the mobile `other-row` and stays either way.
//
// `desc` is optional: a Figma title-block with a description is 178 tall, one
// without is 148 (the PDP's Модули / Отзывы / Вся коллекция rails), so the
// paragraph and its 8px lead-in drop out together rather than rendering empty.
// `count` is the muted number the PDP prints next to a title ("Отзывы 4").
// `arrowTop` places the arrows on the card's image box — it differs per rail
// because the card heights do.
export function buildCarouselSection({
  title,
  desc,
  count,
  action = "В раздел",
  href = "#",
  tabs,
  desktopAction = true,
  mobileAction = true,
  mobileProgress = true,
  actionMobile,
  arrowTop = 139,
  id,
}) {
  const frag = clone("[data-carousel-section]");
  const section = frag.firstElementChild;
  if (id) section.id = id;

  section.querySelector("[data-cs-title]").textContent = title;

  if (count != null) section.querySelector("[data-cs-count]").textContent = count;
  else drop(section, "[data-cs-count]");

  if (desc) section.querySelector("[data-cs-desc]").textContent = desc;
  else {
    drop(section, "[data-cs-desc-gap]");
    drop(section, "[data-cs-desc]");
  }

  if (!desktopAction) drop(section, "[data-cs-desktop-action]");
  if (!mobileAction) drop(section, "[data-cs-mobile-action]");
  if (!mobileProgress) drop(section, "[data-cs-progress]");

  // Обычно у обеих кнопок (ряд заголовка и мобильная во всю ширину) копия одна,
  // но не всегда: у «Акций и скидок» на 1440 написано «В каталог»
  // (title-block 2395:105923), а на 360 — «В раздел» (buttons 1968:150249).
  // Поэтому мобильная подпись — отдельный параметр со значением по умолчанию.
  section.querySelectorAll("[data-cs-action]").forEach((a) => {
    a.href = href;
    const mobile = a.closest("[data-cs-mobile-action]");
    a.querySelector("[data-cs-action-label]").textContent =
      mobile && actionMobile ? actionMobile : action;
  });

  section.querySelectorAll("[data-prev], [data-next]").forEach((b) => {
    b.style.top = `${arrowTop}px`;
  });

  // Слот несёт хвостовой отступ 24 из `title-block` (spacing 766:28333) — он
  // есть у КАЖДОЙ секции, с чипсами и без. Раньше пустой слот удалялся, и все
  // секции без чипсов теряли эти 24: «Модульные кухни» рисовались 599 вместо
  // 628. Пустым он и должен оставаться — высоту ему даёт `empty:h-6`.
  const chipsSlot = section.querySelector("[data-cs-chips-slot]");
  if (tabs?.length) chipsSlot.after(buildChips(tabs));

  return section;
}

// ---- tab chips (e.g. Популярные товары) -------------------------------------
// One [data-carousel-chip] per tab, inserted before the row's trailing "еще".
function buildChips(tabs) {
  const row = clone("[data-carousel-chips]").firstElementChild;
  const more = row.querySelector("[data-cs-more]");
  tabs.forEach((label, i) => {
    const chip = clone("[data-carousel-chip]").firstElementChild;
    chip.textContent = label;
    if (i === 0) chip.setAttribute("aria-selected", "true");
    row.insertBefore(chip, more);
  });
  return row;
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
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 4) return;
    // Capture only once the pointer has actually travelled, so a flick that runs
    // past the edge of the rail keeps scrolling instead of dying the moment the
    // cursor leaves the element. Capturing on `pointerdown` instead made the
    // rail swallow every plain click: with capture live, the browser dispatches
    // the click on the capturing element, so a tab chip inside the rail never
    // saw its own click and the mobile-width tabs were dead.
    if (!moved) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone */
      }
    }
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
  const progress = sectionEl.querySelector("[data-progress]");
  const bar = progress?.querySelector("i");
  if (!viewport || !bar) return { update() {} };

  const update = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    // Same threshold as the desktop arrows below — nothing to scroll, hide
    // the affordance instead of showing a dead/full-width bar.
    progress.classList.toggle("hidden", max <= SCROLL_EPSILON);
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
  return { update };
}

// Wires prev/next arrows to slide the track. Works on any section built by
// buildCarouselSection(): [data-viewport] clips, [data-track] translates by one card.
// Below `md` the viewport scrolls natively instead, so the transform is cleared.
// Переполнение меньше этого — артефакт округления боксов макета, а не страница.
const SCROLL_EPSILON = 8;

export function initCarousel(sectionEl) {
  const viewport = sectionEl.querySelector("[data-viewport]");
  const track = sectionEl.querySelector("[data-track]");
  const prev = sectionEl.querySelector("[data-prev]");
  const next = sectionEl.querySelector("[data-next]");
  if (!viewport || !track || !prev || !next) return { reset() {} };

  const progress = initScrollProgress(sectionEl);
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
  // Конец считаем достигнутым, когда до него осталось меньше SCROLL_EPSILON.
  // Иначе последний шаг оказывался куском в пару пикселей: лента почти не
  // двигалась, а стрелка гасла только после него — то есть на шаг позже, чем
  // нужно (у рельса «Популярные товары» maxOffset 3236 при шаге 462: индекс 7
  // давал 3234, восьмой добирал два пикселя).
  const maxIndex = () => Math.max(0, Math.ceil((maxOffset() - SCROLL_EPSILON) / step()));

  function apply() {
    if (MOBILE.matches) {
      track.style.transform = "";
      return;
    }
    // When the cards fit the viewport there's nothing to scroll — hide both
    // arrows rather than leave them disabled-but-visible. This matters after a
    // tab filter trims the rail down to one or two cards.
    //
    // Порог не 1px, а 8: рельс «Наш склад» на Контактах переполняется ровно на
    // два пикселя (три снимка 438 с зазором 24 = 1362 в кадре 1360 — так же и
    // в макете, там это просто обрезано). При пороге в пиксель стрелка
    // показывалась, сдвигала рельс на 2px и гасла.
    const scrollable = maxOffset() > SCROLL_EPSILON;
    prev.classList.toggle("hidden", !scrollable);
    next.classList.toggle("hidden", !scrollable);

    index = Math.min(Math.max(index, 0), maxIndex());
    // На последнем шаге едем ровно в конец, а не на index * step: остаток
    // меньше шага, и лента должна встать вплотную к краю.
    const offset = index >= maxIndex() ? maxOffset() : Math.min(index * step(), maxOffset());
    track.style.transform = `translateX(${-offset}px)`;
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
      // A tab filter changes item count, which can flip whether the rail
      // even scrolls — re-run the mobile progress bar's own visibility
      // check too, not just the desktop arrows' apply().
      progress.update();
    },
  };
}

// Builds a carousel section into `anchor` and wires it. `cfg` is the
// buildCarouselSection() config (title / desc / action / tabs / endpoint /
// desktopAction), plus `mobileCard` — which mobile card shape the rail uses —
// and `variant`, which Figma card component, both handed to renderCarousel().
// `items` are product-card descriptors.
//
// `cfg.render` swaps the unit the rail is made of: the PDP's Отзывы rail is the
// same section shell (title-block, arrows, native mobile scroll) filled with
// review cards instead of products. Anything that renders into [data-track] and
// leaves `article` elements behind works with the rest of the machinery.
export function mountCarousel(anchor, cfg, items) {
  if (!anchor) return;
  anchor.replaceChildren(buildCarouselSection(cfg));
  const track = anchor.querySelector("[data-track]");
  // `href` у секции — адрес кнопки «В раздел», `cardHref` — адрес карточки.
  // Разные вещи, поэтому в опции карточки первый не попадает.
  const cardOpts = { mobile: cfg.mobileCard, variant: cfg.variant, href: cfg.cardHref };
  const render = cfg.render || renderCarousel;
  render(track, items, cardOpts);
  const carousel = initCarousel(anchor);
  if (cfg.tabs?.length) initTabs(anchor, track, carousel, cfg, items, cardOpts, render);
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
function initTabs(anchor, track, carousel, cfg, items, cardOpts, render = renderCarousel) {
  const chipsRow = anchor.querySelector("[data-chips]");
  if (!chipsRow) return;
  // chips() also renders a trailing "еще" more-button — the tabs are the first
  // cfg.tabs.length chips.
  const chips = [...chipsRow.querySelectorAll(".chip")].slice(0, cfg.tabs.length);
  const more = chipsRow.querySelector("[data-cs-more]");

  // Подпись чипса — это рубрика: у товара она лежит либо в `tab`, либо в
  // категории под ценой. Первый чипс («Все сразу») ничего не фильтрует.
  const belongs = (p, label) => p.tab === label || p.category?.label === label;

  function select(chip, label, all = false) {
    for (const c of chips) c.setAttribute("aria-selected", String(c === chip));
    // --- SEAM: load this tab's products (swap the body for a fetch, above) ---
    render(track, all ? items : items.filter((p) => belongs(p, label)), cardOpts);
    carousel.reset();
  }

  function wire(chip, label, all = false) {
    chips.push(chip);
    chip.addEventListener("click", () => select(chip, label, all));
  }

  chips.forEach((chip, i) => chip.addEventListener("click", () => select(chip, cfg.tabs[i], i === 0)));

  // «еще ···» дописывает в ряд остальные рубрики и уходит сам. Что именно за
  // ними прячется, макет не говорит: подписей у него ровно шесть. Берём то, что
  // есть в данных, — рубрики показанных товаров, которых ещё нет в ряду
  // (см. BACKLOG). Ряд от этого становится длиннее ширины секции и прокручивается
  // вбок, оставаясь одной строкой.
  const extra =
    cfg.moreTabs ||
    [...new Set(items.map((p) => p.category?.label).filter(Boolean))].filter(
      (label) => !cfg.tabs.includes(label)
    );

  if (more) {
    if (!extra.length) more.remove();
    else
      more.addEventListener("click", () => {
        for (const label of extra) {
          const chip = clone("[data-carousel-chip]").firstElementChild;
          chip.textContent = label;
          chipsRow.insertBefore(chip, more);
          wire(chip, label);
        }
        more.remove();
      });
  }
}
