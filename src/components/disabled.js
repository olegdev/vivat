// Одну и ту же кнопку гасят несколько условий сразу — на дилерском заказе это
// пустая корзина (order-cart.js) и неотмеченное согласие (consent-gate.js).
// Если каждое пишет `disabled` напрямую, то, кто отработал последним, снимает
// чужой запрет: пересчёт корзины включал кнопку без галочки. Поэтому причины
// копятся в `data-disabled-by`, а `disabled` идёт от их числа.
//
// В Blade это не переезжает: там кнопку гасит сервер, отрисовывая `disabled`.
export function setDisabled(el, reason, on) {
  if (!el) return;
  const reasons = new Set((el.dataset.disabledBy || "").split(" ").filter(Boolean));
  if (on) reasons.add(reason);
  else reasons.delete(reason);
  el.dataset.disabledBy = [...reasons].join(" ");
  el.disabled = reasons.size > 0;
}
