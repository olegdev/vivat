// Маска телефона — одна на все формы сайта.
//
// Формат российский и единственный: +7 (999) 123-45-67. Поле остаётся пустым,
// пока не набрана первая цифра, — иначе плейсхолдер с форматом никто не увидит.
// Ведущие 7 и 8 съедаются: их набирают по привычке, а в маске они уже есть.
//
// Слушатель один и делегирован на document, поэтому поля, появившиеся позже
// (шаги заказа, клонированные шаблоны), маску получают сами. В Blade это тот же
// один скрипт на макет — разметке достаточно `type="tel"`.
export const PHONE_PLACEHOLDER = "+7 (___) ___-__-__";

// Десять цифр номера без кода страны. Ведущие 7 и 8 — код страны и
// междугородний префикс: их набирают по привычке, а в маске они уже есть.
//
// Работает это и когда пользователь печатает «+7» сам: «+» сразу рисует
// префикс «+7 (», в поле появляется семёрка, и следующая набранная семёрка
// снимается тем же правилом — то есть съедается именно код страны, а не первая
// цифра номера.
function nationalDigits(value) {
  // Префикс «+7» в поле уже наш — цифры номера считаем после него. Иначе
  // семёрка префикса сама съедала бы первую цифру набора.
  if (value.startsWith("+7")) {
    const rest = value.slice(2).replace(/\D/g, "");
    // Единственная семёрка сразу за префиксом — это код страны, набранный
    // руками поверх него: кодов на 7 в России нет, так что двусмысленности
    // тут не возникает. Восьмёрка на этом месте, наоборот, настоящая цифра
    // (800, 812, 831), и её не трогаем.
    return (rest === "7" ? "" : rest).slice(0, 10);
  }
  let d = value.replace(/\D/g, "");
  if (d.startsWith("7") || d.startsWith("8")) d = d.slice(1);
  return d.slice(0, 10);
}

// Наращиваем маску по мере набора: разделитель появляется вместе с цифрой,
// которая за ним следует, а не заранее.
function format(d) {
  if (!d) return "";
  let out = `+7 (${d.slice(0, 3)}`;
  if (d.length > 3) out += `) ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

// Курсор держим на цифре, а не на позиции в строке: считаем, сколько цифр
// стояло левее курсора, и ставим его после стольких же в новом значении.
function caretAfterDigits(text, n) {
  if (n <= 0) return text.length && text.startsWith("+7 (") ? 4 : 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (/\d/.test(text[i])) {
      seen += 1;
      // первые две цифры строки — это «+7», их не считаем
      if (seen > 2 && seen - 2 === n) return i + 1;
    }
  }
  return text.length;
}

// `deleting` — это Backspace/Delete, и он обязан уметь стереть префикс. Без
// него «+7 (» возвращалось бы после каждого удаления и поле нельзя было бы
// очистить.
function reformat(input, inputType = "") {
  const deleting = String(inputType).startsWith("delete");
  const before = input.value.slice(0, input.selectionStart ?? input.value.length);
  const digitsBefore = nationalDigits(before).length;
  let next = format(nationalDigits(input.value));
  // Набор начинают с «+», «7» или «8» — и все три съедаются как код страны,
  // после чего поле выглядело мёртвым: символ ввели, а в нём пусто. Показываем
  // начало маски, чтобы ввод был виден с первого нажатия.
  if (!next && !deleting && input.value.trim()) next = "+7 (";
  if (next === input.value) return;
  input.value = next;
  const pos = caretAfterDigits(next, digitsBefore);
  try {
    input.setSelectionRange(pos, pos);
  } catch {
    /* поле без выделения (type=tel в старых браузерах) */
  }
}

export function initPhoneMask(root = document) {
  root.querySelectorAll('input[type="tel"]').forEach((el) => {
    if (!el.placeholder) el.placeholder = PHONE_PLACEHOLDER;
    el.inputMode = "tel";
    if (!el.autocomplete) el.autocomplete = "tel";
    el.maxLength = PHONE_PLACEHOLDER.length;
    if (el.value) reformat(el);
  });

  if (root !== document || document.documentElement.dataset.phoneMask) return;
  document.documentElement.dataset.phoneMask = "on";
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.type === "tel") reformat(el, e.inputType);
  });
}
