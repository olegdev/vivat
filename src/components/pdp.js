// PDP behaviour — the four things the product page does that no other page has.
// Structure lives in partials/pdp-summary.html, partials/pdp-specs.html and
// partials/sticky-price.html; this file only fills and wires them.
//
//   initSummary()    colour swatches, geometry control, price
//   initSpecTabs()   the Характеристики panels (Описание/Модули/Состав/Документы)
//   initSectionNav() the anchor bar over the photos, active state from scroll
//   initStickyPrice()the bottom bar, shown once the order button is off-screen
//   initPdpOrder()   «Сформировать заказ»: в корзину и на оформление

import { addToCart } from "./cart.js";

const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

// Цена товара на дилерской странице подчиняется выбранному прайс-листу так же,
// как цены карточек: components/price-mode.js пересчитывает всё, у чего есть
// база. Пара «строка фикстуры + число» — тот же контракт, что в
// components/product-card.js. На покупательских страницах это мёртвый атрибут.
function setPrice(el, price) {
  if (!el) return;
  el.textContent = price;
  el.dataset.priceRaw = price;
  el.dataset.priceBase = String(parseInt(String(price).replace(/\D/g, ""), 10) || 0);
}

// ---- summary panel ----------------------------------------------------------
// `product` is the same shape a Blade controller would hand the view.
export function initSummary(product) {
  const root = document.querySelector("[data-pdp-summary]");
  if (!root) return;

  root.querySelector("[data-pdp-title]").textContent = product.title;
  root.querySelector("[data-pdp-size]").textContent = product.size;
  setPrice(root.querySelector("[data-pdp-price]"), product.price);
  root.querySelector("[data-pdp-oldprice]").textContent = product.oldPrice || "";
  root.querySelector("[data-pdp-discount]").textContent = product.discount || "";

  // Colours: one swatch per colour, the selected one named underneath. A swatch
  // is a radio in behaviour, so the group keeps exactly one selection.
  const colorsWrap = root.querySelector("[data-pdp-colors]");
  const colorName = root.querySelector("[data-pdp-color-name]");
  const swatches = product.colors.map((c, i) => {
    const node = clone("[data-pdp-swatch]");
    if (c.img) {
      const img = clone("[data-pdp-swatch-img]");
      img.src = c.img;
      node.append(img);
    } else {
      node.style.background = c.color;
    }
    node.setAttribute("aria-label", c.name);
    node.setAttribute("aria-checked", String(i === product.selectedColor));
    node.addEventListener("click", () => {
      swatches.forEach((s) => s.setAttribute("aria-checked", String(s === node)));
      colorName.textContent = `Цвет ${c.name}`;
    });
    colorsWrap.append(node);
    return node;
  });
  colorName.textContent = `Цвет ${product.colors[product.selectedColor].name}`;

  // Geometry (Прямая / Угловая) — a radiogroup of two `segments` pills.
  const geometry = root.querySelectorAll("[data-pdp-geometry] .pdp-segment");
  geometry.forEach((seg) =>
    seg.addEventListener("click", () => {
      geometry.forEach((s) => s.setAttribute("aria-checked", String(s === seg)));
    })
  );
}

// ---- Характеристики panels --------------------------------------------------
// `data` carries one array per designed panel. Rows are cloned from the
// <template>s in the partial — the future Blade @foreach.
export function initSpecTabs(data) {
  const section = document.querySelector("#specs");
  if (!section) return;

  // Описание — the design splits the rows into two column groups; keep that
  // split in the data rather than reflowing, so the halves match the mock.
  data.specs.forEach((col, n) => {
    const wrap = section.querySelector(`[data-spec-col="${n}"]`);
    col.forEach((row) => wrap.append(specRow(row)));
  });

  // Панелей «Состав» и «Документы» в блоке больше нет: клиент убрал их вместе
  // с «Отзывами» из ряда ярлыков (31.08.2026). Данные под них страницы больше
  // не передают, но вызовы терпимы к их отсутствию — так порт на Blade не
  // упрётся в порядок правок.

  // Комплектация — таблица в пять колонок с итоговой строкой (2567:158700).
  // Итоги считаем, а не храним: в макете «Итого» это сумма столбцов, и держать
  // её в фикстуре значит завести второй источник правды.
  const pkg = section.querySelector("[data-package-list]");
  const rows = data.package || [];
  rows.forEach((row) => {
    const node = clone("[data-package-row]");
    node.querySelector("[data-package-name]").textContent = row.name;
    node.querySelector("[data-package-size]").textContent = row.size;
    node.querySelector("[data-package-weight]").textContent = row.weight;
    node.querySelector("[data-package-volume]").textContent = row.volume;
    node.querySelector("[data-package-qty]").textContent = row.qty;
    pkg.append(node);
  });

  const sum = (key) =>
    rows.reduce((acc, r) => acc + Number(String(r[key]).replace(",", ".")) * Number(r.qty || 1), 0);
  const total = section.querySelector("[data-package-total]");
  if (total && rows.length) {
    // Хвостовые нули не печатаем: в макете 145.201 кг и 0.24334 м³.
    const trim = (n, digits) => String(Number(n.toFixed(digits)));
    total.querySelector("[data-total-weight]").textContent = `${trim(sum("weight"), 3)} кг`;
    total.querySelector("[data-total-volume]").textContent = `${trim(sum("volume"), 5)} м³`;
    total.querySelector("[data-total-qty]").textContent = String(
      rows.reduce((acc, r) => acc + Number(r.qty || 1), 0)
    );
  }

  // Panels are `hidden`/`flex` rather than display-toggled from a style, so the
  // markup stays the single source of which panel is open.
  const tabs = [...section.querySelectorAll("[data-spec-tabs] [data-panel]")];
  const panels = [...section.querySelectorAll("[data-spec-panels] > [data-panel]")];
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      panels.forEach((p) => {
        const open = p.dataset.panel === tab.dataset.panel;
        p.classList.toggle("hidden", !open);
        p.classList.toggle("flex", open);
      });
    })
  );


}

function specRow(row) {
  const node = clone("[data-spec-row]");
  node.querySelector("[data-spec-label]").textContent = row.label;
  node.querySelector("[data-spec-value]").textContent = row.value;
  return node;
}

// ---- mobile photo rail ------------------------------------------------------
// Desktop stacks the three shots; below `md` the same column is a snapping row
// (Figma 1997:308027) with a dot per photo. The dots mirror the rail's real
// scroll position rather than an index the script keeps, so a half-swipe, a
// drag and a dot click all agree. Desktop never sees them — the row is a
// column there and the dots are `max-md:flex`.
export function initPhotoRail() {
  const rail = document.querySelector("[data-photo-rail]");
  const dotsWrap = document.querySelector("[data-photo-dots]");
  if (!rail || !dotsWrap) return;

  const slides = [...rail.children];
  const dots = slides.map((slide, i) => {
    const dot = document.querySelector("[data-pdp-photo-dot]").content.firstElementChild.cloneNode(true);
    dot.setAttribute("aria-current", String(i === 0));
    dot.setAttribute("aria-label", `Фото ${i + 1}`);
    dot.addEventListener("click", () =>
      rail.scrollTo({ left: slide.offsetLeft - rail.offsetLeft, behavior: "smooth" })
    );
    dotsWrap.append(dot);
    return dot;
  });

  const update = () => {
    // Nearest slide to the rail's left edge — the one snap has settled on.
    let best = 0;
    let bestGap = Infinity;
    slides.forEach((slide, i) => {
      const gap = Math.abs(slide.offsetLeft - rail.offsetLeft - rail.scrollLeft);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    });
    dots.forEach((d, i) => d.setAttribute("aria-current", String(i === best)));
  };

  rail.addEventListener("scroll", update, { passive: true });
  update();
}

// ---- section anchor bar -----------------------------------------------------
// The bar above the photos (Фото / Характеристики / Модули / Отзывы / Где
// купить) scrolls to a section and marks the one currently in view. The active
// state is derived from scroll position, not from the click, so it also follows
// a plain wheel scroll.
export function initSectionNav() {
  const nav = document.querySelector("[data-section-nav]");
  if (!nav) return;
  const links = [...nav.querySelectorAll("a[href^='#']")];
  const targets = links
    .map((a) => ({ link: a, el: document.querySelector(a.getAttribute("href")) }))
    .filter((t) => t.el);
  if (!targets.length) return;

  const update = () => {
    // "Current" is the last section whose top has passed the nav's own height —
    // the same rule a reader applies by eye.
    const line = window.scrollY + nav.getBoundingClientRect().height + 80;
    let current = targets[0];
    for (const t of targets) if (t.el.offsetTop <= line) current = t;
    targets.forEach((t) => t.link.setAttribute("aria-selected", String(t === current)));
  };

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

// ---- price bars -------------------------------------------------------------
// Two different components, two different behaviours (see
// partials/sticky-price.html): the desktop bar is revealed by scroll, the
// mobile one is permanent chrome. The price text is shared, so it is filled
// across both; only the desktop bar gets the observer.
//
// Figma draws the desktop bar but not its trigger. The rule here is the one the
// frame implies: it stands in for the summary panel's order button, so it
// appears exactly while that button is off-screen above, and goes away again
// when the panel scrolls back into view.
export function initStickyPrice(product) {
  document
    .querySelectorAll("[data-sticky-price-value]")
    .forEach((el) => setPrice(el, product.price));

  const bar = document.querySelector("[data-sticky-price]");
  // The anchor is `max-md:hidden`, so below `md` it has no box and the observer
  // never fires — which is correct: the mobile bar is always visible anyway.
  const anchor = document.querySelector("[data-pdp-summary] [data-pdp-order]");
  if (!bar || !anchor) return;

  bar.querySelector("[data-sticky-title]").textContent = product.title;
  bar.querySelector("[data-sticky-oldprice]").textContent = product.oldPrice || "";

  const io = new IntersectionObserver(
    ([entry]) => {
      // Only once the button has left upwards — scrolled past, not not-yet-reached.
      const passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      bar.classList.toggle("is-visible", passed);
    },
    { threshold: 0 }
  );
  io.observe(anchor);
}

// ---- «Сформировать заказ» ---------------------------------------------------
// Единственное добавление в корзину, которое ещё и уводит со страницы: кнопка
// кладёт товар и открывает оформление (docs/LINK-MAP.md §4.1). Прототипа на ней
// в макете нет — это решение клиента.
//
// Кнопок три и они одинаковые — в сводке и в обоих нижних барах, — поэтому
// слушаем делегированно, тем же приёмом, что и сама корзина: бары появляются и
// прячутся, а обработчик один и это переживает.
export function initPdpOrder(product) {
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-pdp-order]")) return;
    addToCart(product.id ?? null, 1);
    window.location.href = "order.html";
  });
}
