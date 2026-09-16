// Кнопка отправки не работает, пока не поставлена галочка согласия.
//
// Так во всех формах, где эта галочка есть: четыре модальных окна секции
// `B2b additional`, «Сообщить об ошибке» и обе страницы заказа. Правило одно и
// живёт в одном месте, потому что и поле, и кнопка у них называются одинаково:
// `input[name="consent"]` и `[type="submit"]` той же формы.
//
// Кнопку ищем не внутри формы, а по её свойству `form`: у мобильного бара
// страницы заказа кнопка стоит вне разметки формы и связана атрибутом
// `form="order-form"`.
//
// В Blade это тот же скрипт: разметке достаточно имени поля. Валидацию на
// сервере он, разумеется, не заменяет — `required` на поле остаётся.
import { setDisabled } from "./disabled.js";

const submitsOf = (form) =>
  [...document.querySelectorAll('[type="submit"]')].filter((b) => b.form === form);

function sync(input) {
  if (!input.form) return;
  submitsOf(input.form).forEach((b) => setDisabled(b, "consent", !input.checked));
}

export function initConsentGate(root = document) {
  root.querySelectorAll('input[name="consent"]').forEach(sync);

  if (root !== document || document.documentElement.dataset.consentGate) return;
  document.documentElement.dataset.consentGate = "on";
  document.addEventListener("change", (e) => {
    if (e.target instanceof HTMLInputElement && e.target.name === "consent") sync(e.target);
  });
}
