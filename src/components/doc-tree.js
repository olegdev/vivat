// Дерево документов — Figma `documents-content` 1463:60818.
//
// Разметка живёт в partials/doc-tree.html двумя <template> (группа и документ)
// — будущие вложенные @foreach; этот файл только клонирует и раскрывает.
//
// Группы независимы: закрывать соседей макет не просит, он лишь показывает
// одну раскрытой.
//
// Поиск по дереву — клиентский: страница уже держит все документы, ходить за
// ними на сервер незачем. `initDocSearch()` прячет несовпавшие строки и
// раскрывает ветки, в которых что-то нашлось; пустой запрос возвращает дерево
// в исходное состояние.

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

// ---------------------------------------------------------------------------
// Поиск по дереву — только клиент
// ---------------------------------------------------------------------------
// Сравниваем по нормализованной подстроке: регистр не важен, «ё» приравнена к
// «е» (в названиях документов встречается и так, и так). Совпадением ветки
// считается совпадение её собственного имени: тогда показывается вся ветка
// целиком, как и ожидается от поиска по разделу.
const norm = (s) => s.toLowerCase().replace(/ё/g, "е");

// Возвращает true, если внутри узла что-то нашлось (и он должен остаться).
function filterNode(node, q) {
  const title = node.querySelector(":scope > [data-doc-toggle] [data-doc-title]");

  // документ
  if (!title) {
    const link = node.querySelector("[data-doc-link]");
    const hit = !!link && norm(link.textContent).includes(q);
    node.classList.toggle("hidden", !hit);
    return hit;
  }

  // ветка
  const items = node.querySelector(":scope > [data-doc-items]");
  const selfHit = norm(title.textContent).includes(q);
  let childHit = false;
  for (const child of items.children) {
    // Совпало имя ветки — показываем всё, что внутри, не фильтруя дальше.
    const hit = selfHit ? (showAll(child), true) : filterNode(child, q);
    childHit = childHit || hit;
  }
  const hit = selfHit || childHit;
  node.classList.toggle("hidden", !hit);
  setGroupOpen(node, hit);
  return hit;
}

function showAll(node) {
  node.classList.remove("hidden");
  for (const el of node.querySelectorAll(".hidden")) {
    if (el.matches("[data-doc-items]")) continue;
    el.classList.remove("hidden");
  }
}

function setGroupOpen(section, open) {
  const toggle = section.querySelector(":scope > [data-doc-toggle]");
  const items = section.querySelector(":scope > [data-doc-items]");
  if (!toggle || !items) return;
  toggle.setAttribute("aria-expanded", String(open));
  items.hidden = !open;
}

export function initDocSearch(input, root) {
  if (!input || !root) return;

  // Исходное состояние раскрытия, чтобы вернуть его на пустом запросе.
  const groups = [...root.querySelectorAll("section")];
  const initial = new Map(
    groups.map((g) => [g, g.querySelector(":scope > [data-doc-toggle]")?.getAttribute("aria-expanded") === "true"])
  );

  function reset() {
    for (const el of root.querySelectorAll(".hidden")) el.classList.remove("hidden");
    for (const [g, open] of initial) setGroupOpen(g, open);
  }

  input.addEventListener("input", () => {
    const q = norm(input.value.trim());
    if (!q) return reset();
    for (const node of root.children) filterNode(node, q);
  });

  // Форма никуда не уходит: искать нечего, всё уже на странице.
  input.form?.addEventListener("submit", (e) => e.preventDefault());
}
