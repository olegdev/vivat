// Модальные окна секции B2b additional — заявка на дилерство, вход в дилерский
// режим, подписка на новости, письмо директору.
//
// Структура — HTML: каждое окно это свой партиал (partials/modal-*.html), а
// здесь только поведение. Разметку этот файл не собирает.
//
// ШВЫ. Каждая форма уходит в свою функцию, и это единственное место, где в
// Blade появится запрос:
//
//     await fetch("/dealer/request", {
//       method: "POST",
//       headers: { "X-CSRF-TOKEN": … },
//       body: new FormData(form),
//     });
//
// Экрана «отправлено» в макете нет ни у одного из четырёх окон, поэтому все
// они после отправки просто закрываются — см. BACKLOG. Вход дополнительно
// уводит на дилерскую главную: это наше решение, а не макет.
const SEAMS = {
  "dealer-request": (values) => void values,
  "dealer-login": (values) => {
    void values;
    window.location.href = "../dealer/main.html";
  },
  subscribe: (values) => void values,
  director: (values) => void values,
};

export function initModals() {
  const panels = new Map(
    [...document.querySelectorAll("[data-modal]")].map((el) => [el.dataset.modal, el])
  );
  if (!panels.size) return null;

  // Что открыто — знает DOM, а не переменная: панель могут показать и в обход
  // `open()` (так делают страницы заказа с оверлеем подтверждения), и тогда
  // закрытие по крестику, Esc и клику мимо обязано всё равно сработать.
  // В JS остаётся только триггер, которому вернуть фокус.
  const openPanel = () => document.querySelector("[data-modal].is-open");
  let opener = null;

  function close() {
    const panel = openPanel();
    if (!panel) return;
    panel.classList.remove("is-open");
    document.body.classList.remove("overflow-hidden");
    opener?.focus();
    opener = null;
  }

  // Одновременно открыто не больше одного окна: вход умеет передать управление
  // заявке («Хотите стать дилером?»), и тогда фокус должен вернуться на тот
  // триггер, с которого всё началось, а не на ссылку внутри окна.
  function open(name, trigger) {
    const panel = panels.get(name);
    if (!panel) return;
    const outer = openPanel() ? opener : trigger;
    close();
    opener = outer ?? null;
    panel.classList.add("is-open");
    document.body.classList.add("overflow-hidden");
    panel.querySelector("input, textarea, button")?.focus();
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-modal-open]");
    if (trigger) {
      e.preventDefault();
      return open(trigger.dataset.modalOpen, trigger);
    }
    if (e.target.closest("[data-modal-close]")) close();
  });

  // Клик мимо панели ловится на ПЕРЕХВАТЕ, а не на всплытии: см. SOLUTIONS.md ›
  // «Клик „мимо панели“ ловится на перехвате, а не на всплытии».
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!openPanel()) return;
      if (!e.target.closest("[data-modal-panel]") && !e.target.closest("[data-modal-open]")) close();
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  panels.forEach((panel, name) => {
    panel.querySelector("[data-modal-form]")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form));
      close();
      SEAMS[name]?.(values);
    });
  });

  return { open, close };
}
