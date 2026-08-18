// Дерево документов — Figma `documents-content` 1463:60818.
//
// Разметка живёт в partials/doc-tree.html двумя <template> (группа и документ)
// — будущие вложенные @foreach; этот файл только клонирует и раскрывает.
//
// Группы независимы: закрывать соседей макет не просит, он лишь показывает
// одну раскрытой.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// Узел дерева: ветка (есть дети) или документ (есть дата). Вложенность в
// макете доходит до четырёх уровней, поэтому обход рекурсивный; каждый уровень
// сужается на 16 с каждой стороны — это `px-4` на контейнере детей.
function buildNode(n) {
  return n.children || n.items ? buildGroup(n) : buildItem(n);
}

function buildItem(it) {
  const row = clone("[data-doc-item]").firstElementChild;
  row.querySelector("[data-doc-link]").textContent = it.title;
  row.querySelector("[data-doc-date]").textContent = it.date;
  return row;
}

// Одна ветка. `g`: { title, open?, children | items }
function buildGroup(g) {
  const node = clone("[data-doc-group]").firstElementChild;
  node.querySelector("[data-doc-title]").textContent = g.title;

  const items = node.querySelector("[data-doc-items]");
  items.replaceChildren(...(g.children || g.items || []).map(buildNode));

  const toggle = node.querySelector("[data-doc-toggle]");
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    items.hidden = !open;
  };
  setOpen(Boolean(g.open));
  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  return node;
}

export function renderDocTree(el, groups) {
  if (!el) return;
  el.replaceChildren(...groups.map(buildGroup));
}
