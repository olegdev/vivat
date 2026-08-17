// Меню дилерского раздела — Figma `menu-b2b` 1058:178109 (1440) и шторка
// 2209:213627 (360).
//
// Разметка живёт в partials/menu-b2b.html (два вложенных <template>, будущие
// вложенные @foreach) и partials/for-business-header.html; этот файл только
// клонирует, наполняет и открывает шторку.
//
// Одни и те же шаблоны обслуживают оба места: боковое меню скрыто ниже md,
// шторка — выше, поэтому строке достаточно `h-10 max-md:h-11`, чтобы быть 40
// на 1440 и 44 в шторке. Второго набора шаблонов не нужно.
//
// Текущая страница помечается aria-current="page". В наборе menu-item нет
// варианта condition=active — дизайнер рисует текущий пункт ховером
// (912:80243, #eeeeee), поэтому оформление у них общее и живёт в партиале.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// Один пункт. `item`: { label, href, modal? }
function buildItem(item, current) {
  const node = clone("[data-menu-b2b-item]").firstElementChild;
  node.textContent = item.label;
  node.href = item.href;

  // «Письмо директору» — не страница, а готовая модалка. Её обработчик
  // делегирован на document в components/modals.js, поэтому достаточно
  // атрибута: порядок отрисовки значения не имеет.
  if (item.modal) node.dataset.modalOpen = item.modal;

  if (current && item.href === current) node.setAttribute("aria-current", "page");

  return node;
}

// Один блок. `block`: { title, items }
function buildBlock(block, current) {
  const node = clone("[data-menu-b2b-block]").firstElementChild;
  node.querySelector("[data-block-title]").textContent = block.title;
  node
    .querySelector("[data-block-items]")
    .replaceChildren(...block.items.map((i) => buildItem(i, current)));
  return node;
}

// Шторка живёт по тем же правилам, что остальные оверлеи проекта: что открыто,
// читаем из DOM, а не держим в переменной, — тогда панель, показанная другим
// путём, всё равно закроется по Esc, крестику и клику мимо.
function initSheet() {
  const sheet = document.querySelector("[data-menu-sheet]");
  if (!sheet) return;

  const close = () => sheet.classList.remove("is-open");

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-menu-sheet-open]")) {
      sheet.classList.add("is-open");
      return;
    }
    if (e.target.closest("[data-menu-sheet-close]")) {
      close();
      return;
    }
    // Клик мимо панели ловим на перехвате открытой шторки, а не на всплытии.
    if (sheet.classList.contains("is-open") && !e.target.closest("[data-menu-sheet-panel]")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

// `current` — href активного пункта, например "delivery.html".
export function renderMenuB2b(blocks, { current } = {}) {
  // Боковое меню на 1440 и список в шторке на 360 — одни и те же данные.
  for (const sel of ["[data-menu-b2b]", "[data-menu-b2b-sheet]"]) {
    const el = document.querySelector(sel);
    if (el) el.replaceChildren(...blocks.map((b) => buildBlock(b, current)));
  }

  // Подпись селектора в мобильной шапке — имя текущей страницы.
  const label = document.querySelector("[data-fbh-current]");
  if (label && current) {
    const item = blocks.flatMap((b) => b.items).find((i) => i.href === current);
    if (item) label.textContent = item.label;
  }

  initSheet();
}
