// Меню дилерского раздела — Figma `menu-b2b` 1058:178109.
//
// Разметка живёт в partials/menu-b2b.html как два вложенных <template>
// (будущие вложенные @foreach); этот файл только клонирует и наполняет.
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

  // «Письмо директору» — не страница, а готовая модалка. Обработчик у неё
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

// `current` — href активного пункта, например "delivery.html".
export function renderMenuB2b(blocks, { current } = {}) {
  const el = document.querySelector("[data-menu-b2b]");
  if (!el) return;
  el.replaceChildren(...blocks.map((b) => buildBlock(b, current)));
}
