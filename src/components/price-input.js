// Поля цены «от / до» в ящике фильтров: разряды через пробел, как в
// плейсхолдере макета («132 000», 1604:67833), и только цифры.
//
// Форма читает поля с `replace(/\s/g, "")`, поэтому пробелы в значении ничего
// не ломают; каретка остаётся после той же по счёту цифры, иначе вставленный
// разделитель выталкивал бы её на символ вперёд.
export const formatThousands = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function initPriceInputs(form) {
  const fields = form.querySelectorAll('input[name="price_min"], input[name="price_max"]');
  for (const input of fields) {
    input.addEventListener("input", () => {
      const caret = input.selectionStart ?? input.value.length;
      const before = input.value.slice(0, caret).replace(/\D/g, "").length;
      const digits = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 9);
      const out = formatThousands(digits);
      if (out === input.value) return;
      input.value = out;
      let pos = 0;
      for (let seen = 0; pos < out.length && seen < before; pos++) if (/\d/.test(out[pos])) seen++;
      input.setSelectionRange(pos, pos);
    });
    if (input.value) input.value = formatThousands(input.value.replace(/\D/g, ""));
  }
}
