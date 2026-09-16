// Значок «info» у заметки: по макету он стоит на 2 ниже верха текста
// (icon-container 943:108531, padV=2) — так задумано для текста в две строки.
// Когда строка одна (на широких телефонах, на планшете), те же 2 читаются как
// съехавший значок, и клиент попросил центрировать его по строке (15.09 —
// планшет, 16.09 — все ширины). Число строк CSS не знает, поэтому здесь:
// заметка помечена `data-note`, значок в ней — `data-note-icon`, а высота
// текста против его line-height говорит, одна строка или больше.
//
//   две и больше → верх значка на 2 (макет);
//   одна         → значок по центру строки: (line-height − 16) / 2.
//
// Пересчитывается при ресайзе — строка меняет число переносов с шириной.
const ICON = 16;

function place(note) {
  const icon = note.querySelector("[data-note-icon]");
  const text = note.querySelector("[data-note-text]") || icon?.nextElementSibling;
  if (!icon || !text || !text.offsetParent) return;
  const lh = parseFloat(getComputedStyle(text).lineHeight) || ICON;
  const lines = Math.round(text.getBoundingClientRect().height / lh);
  const top = lines > 1 ? 2 : Math.round((lh - ICON) / 2);
  // Файл значка может быть 24 с полями вокруг глифа 16 — поле вычитаем.
  const inset = (icon.getBoundingClientRect().height - ICON) / 2;
  icon.style.marginTop = `${top - inset}px`;
}

export function initNoteIcons(root = document) {
  const notes = [...root.querySelectorAll("[data-note]")];
  if (!notes.length) return;
  const all = () => notes.forEach(place);
  all();
  window.addEventListener("resize", all);
  // Заметка внутри скрытого блока (шаг заказа, вариант дилера) меряется нулём —
  // дождёмся, когда её покажут.
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(all);
    notes.forEach((n) => ro.observe(n));
  }
}
