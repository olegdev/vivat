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
function buildNode(n, depth) {
  return n.children || n.items ? buildGroup(n, depth) : buildItem(n);
}

function buildItem(it) {
  const row = clone("[data-doc-item]").firstElementChild;
  row.querySelector("[data-doc-link]").textContent = it.title;
  row.querySelector("[data-doc-date]").textContent = it.date;
  return row;
}

// Одна ветка. `g`: { title, open?, children | items }
// `depth` — 0 у корневой; со второго уровня заголовок мельче, и это атрибут на
// кнопке, а не второй <template>: кегль выбирает вариант при нём.
function buildGroup(g, depth = 0) {
  const node = clone("[data-doc-group]").firstElementChild;
  node.querySelector("[data-doc-title]").textContent = g.title;

  const items = node.querySelector("[data-doc-items]");
  const kids = g.children || g.items || [];
  items.replaceChildren(...kids.map((n) => buildNode(n, depth + 1)));
  // Список документов разводит зазор, список веток — своя нижняя отбивка у
  // каждой ветки; в макете это `gap=8` против `gap=0`.
  items.dataset.docKind = kids.some((n) => n.children || n.items) ? "groups" : "docs";

  const toggle = node.querySelector("[data-doc-toggle]");
  if (depth) toggle.dataset.docDepth = "nested";
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
  el.replaceChildren(...groups.map((g) => buildGroup(g, 0)));
}
