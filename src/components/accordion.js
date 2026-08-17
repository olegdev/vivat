// Аккордеон — Figma `accordion` 1058:177899 / 1058:177901.
//
// Разметка живёт в partials/accordion.html как <template> (будущий @foreach);
// этот файл только клонирует, наполняет и раскрывает.
//
// Блоки независимы: соседей при раскрытии не закрываем — макет не даёт для
// этого никаких оснований, а в кадре раскрыт ровно один блок просто потому,
// что дизайнер показывает состояние.

const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// Ответ приходит списком отрезков: { t } — текст, { t, href } — ссылка.
// Разметку в фикстуре не держим, поэтому ссылку собираем здесь.
function fillAnswer(el, runs) {
  el.replaceChildren(
    ...runs.map((run) => {
      if (!run.href) return document.createTextNode(run.t);
      const a = document.createElement("a");
      a.href = run.href;
      a.textContent = run.t;
      a.className = "underline";
      return a;
    })
  );
}

// Один блок. `item`: { q, a?, open? }
function buildItem(item) {
  const node = clone("[data-accordion-item]").firstElementChild;
  node.querySelector("[data-accordion-q]").textContent = item.q;

  const answer = node.querySelector("[data-accordion-a]");
  const toggle = node.querySelector("[data-accordion-toggle]");

  if (item.a) fillAnswer(answer, item.a);

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    answer.hidden = !open;
  };
  setOpen(Boolean(item.open));

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  return node;
}

export function renderAccordions(el, items) {
  if (!el) return;
  el.replaceChildren(...items.map(buildItem));
}
