// Лента блога (Figma Blog-general 3060:145720 / 3072:149955): рубрики,
// выпадающий период и плитка статей.
//
// Состояний у ленты два, и оба — по ответу дизайнера:
//   • «Все статьи» — две последние статьи размером L, под ними заголовок
//     «Все статьи» и плитка S;
//   • рубрика — L-ряда нет, заголовок называет рубрику, все карточки идут
//     той же плиткой S.
//
// Рубрика — единственный шов страницы, как у фильтров каталога (SOLUTIONS ›
// «Filters: form + request seam»): сейчас список фильтруется на месте, в
// Blade тело select() станет запросом за статьями рубрики.
import { articleCard } from "./article-card.js";

const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

// ---- выпадающий список ----------------------------------------------------
// Пилюля `filters-sort` с меню вида сортировки каталога. Меню у рубрик
// (только ниже md) и у периода; что открыто — читается из DOM.
function initDropdown(root, options, { onSelect, current = 0 } = {}) {
  const toggle = root.querySelector("[data-dropdown-toggle]");
  const menu = root.querySelector("[data-dropdown-menu]");
  const chevrons = root.querySelectorAll("[data-dropdown-chevron]");

  const open = (show) => {
    menu.classList.toggle("hidden", !show);
    toggle.setAttribute("aria-expanded", String(show));
    chevrons.forEach((c) => c.classList.toggle("rotate-180", show));
  };

  const items = options.map((o, i) => {
    const item = clone("[data-blog-option]");
    item.querySelector("[data-option-label]").textContent = o.label;
    const count = item.querySelector("[data-option-count]");
    if (o.count != null) count.textContent = o.count;
    else count.remove();
    item.addEventListener("click", () => {
      open(false);
      onSelect?.(i);
    });
    return item;
  });
  menu.replaceChildren(...items);

  const mark = (i) => {
    items.forEach((it, j) => it.setAttribute("aria-current", String(i === j)));
    root.querySelector("[data-dropdown-label]").textContent = options[i].label;
    const count = root.querySelector("[data-dropdown-count]");
    if (count) {
      count.textContent = options[i].count ?? "";
      count.classList.toggle("hidden", options[i].count == null);
    }
  };

  toggle.addEventListener("click", () => open(menu.classList.contains("hidden")));
  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) open(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") open(false);
  });
  mark(current);
  return { mark };
}

// ---- плитка ----------------------------------------------------------------
// Ряд — четыре карточки (`Article` 3072:148071): на 1440 строка 4×322, ниже
// md — квадрат 2×2. Между рядами на 360 зазора нет, внутри ряда он 16, —
// так нарисовано (3072:150231 → 3074:150678), поэтому ряды остаются рядами,
// а не одной сеткой.
function renderGrid(el, items) {
  const rows = [];
  for (let i = 0; i < items.length; i += 4) {
    const row = clone("[data-blog-row]");
    row.replaceChildren(...items.slice(i, i + 4).map((a) => articleCard(a, { size: "s" })));
    rows.push(row);
  }
  el.replaceChildren(...rows);
}

export function initBlogFeed({ rubrics, periods, latest, articles }) {
  const latestEl = document.querySelector("[data-blog-latest]");
  const heading = document.querySelector("[data-blog-heading]");
  const grid = document.querySelector("[data-blog-grid]");
  const pillsEl = document.querySelector("[data-blog-rubrics]");

  latestEl.replaceChildren(...latest.map((a) => articleCard(a, { size: "l" })));

  // `filters` 752:63422 — та же пилюля, что в каталоге; выбранная —
  // `condition=active` (752:63467), обводка #414141.
  const pills = rubrics.map((r, i) => {
    const pill = clone("[data-blog-pill]");
    pill.querySelector("[data-rubric-label]").textContent = r.label;
    const count = pill.querySelector("[data-rubric-count]");
    // Пустой слот остаётся: он держит ширину 10, как в мастере.
    if (r.count != null) count.textContent = r.count;
    pill.addEventListener("click", () => select(i));
    return pill;
  });
  pillsEl.replaceChildren(...pills);

  const mobile = initDropdown(document.querySelector('[data-dropdown="rubric"]'), rubrics, {
    onSelect: (i) => select(i),
  });
  initDropdown(document.querySelector('[data-dropdown="period"]'), periods.map((label) => ({ label })));

  function select(i) {
    const r = rubrics[i];
    pills.forEach((p, j) => {
      p.classList.toggle("is-active", i === j);
      p.setAttribute("aria-pressed", String(i === j));
    });
    mobile.mark(i);
    latestEl.hidden = !r.all;
    heading.textContent = r.label;
    // --- SEAM: статьи рубрики (в Blade — запрос) ---
    renderGrid(grid, r.all ? articles : [...latest, ...articles].filter((a) => a.rubric === r.label));
  }

  const asked = new URLSearchParams(location.search).get("rubric");
  const start = Math.max(0, rubrics.findIndex((r) => r.label === asked));
  select(start);
}
