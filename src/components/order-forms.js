// Форма дилерского заказа — the four cards under «Внесите ваши данные»
// (Figma forms-block 1209:95240 / 1415:67630, mobile 2238:157281).
//
// Structure is HTML: everything this file touches already exists in
// partials/order-forms.html. Two things live here, and both are seams.
//
//   applyDelivery({ mode, distance, floor })
//     The «Доставка» card's state. `mode` re-dresses the card through one
//     attribute — the two 1440 frames are that state, not two screens — and
//     the surcharges and the delivery cost come back from the server. Today
//     they come from the fixture: the design prints «+222₽» against BOTH
//     fields and states no rule tying either to its value, so nothing is
//     computed here (see BACKLOG).
//
//   submitOrder(payload)
//     The one place the order is sent. Today it reveals the confirmation
//     overlay; in Blade its body becomes a POST and the overlay is shown on
//     the response.
export function initOrderForms(root, { delivery, money, onDelivery, onSubmit } = {}) {
  const form = root.querySelector("[data-order-form]");
  const card = root.querySelector("[data-delivery]");
  if (!form || !card) return null;

  const distance = card.querySelector("[data-delivery-distance]");
  const floor = card.querySelector("[data-delivery-floor]");

  function applyDelivery({ mode = card.dataset.delivery } = {}) {
    card.dataset.delivery = mode;

    card.querySelector("[data-surcharge-distance]").textContent =
      `+${money(delivery.surchargeDistance)}`;
    card.querySelector("[data-surcharge-floor]").textContent =
      `+${money(delivery.surchargeFloor)}`;
    card.querySelector("[data-delivery-cost]").textContent =
      `Стоимость доставки — ${delivery.cost} рублей. Оплачивается отдельно по тарифу перевозчика`;

    // the summary's «Доставка» row reads this card, so it is told, not polled
    onDelivery?.({
      mode,
      label: mode === "delivery" ? "Доставка" : "Самовывоз",
      distance: distance?.value,
      floor: floor?.value,
    });
  }

  card.querySelectorAll("[data-delivery-mode]").forEach((btn) =>
    btn.addEventListener("click", () => applyDelivery({ mode: btn.dataset.deliveryMode }))
  );

  // The payment select feeds the summary's «Способ оплаты» row. The design
  // names no options, so today it only ever reports its placeholder.
  const payment = root.querySelector("[data-order-payment]");
  const paymentOut = root.querySelector("[data-summary-payment]");
  payment?.addEventListener("change", () => {
    if (paymentOut) {
      paymentOut.textContent =
        payment.selectedOptions[0]?.value ? payment.selectedOptions[0].text : "не выбран";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    onSubmit?.(Object.fromEntries(new FormData(form)));
  });

  applyDelivery({});
  return { applyDelivery, form };
}
