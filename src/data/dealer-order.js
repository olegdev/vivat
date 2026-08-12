// ============================================================================
// MOCK DATA — дилерское оформление заказа (pages/dealer/order.html)
//
// PORTING NOTE (PHP / Blade)
// `LINES` is the dealer's cart, one entry per partials/cart-card.html unit. A
// line may carry `modules` — its комплектация, which the card shows inline on
// 1440 and the bottom sheet shows on 360. On the server that is a relation on
// the cart line, printed into the same <template> in partials/order-modules.
//
// `DELIVERY` stands in for whatever prices the delivery. The design gives the
// figures (12 км, 8 этаж, +222₽ against BOTH fields, 3414₽ total) but no rule
// tying a surcharge to its field, so they are flat constants here rather than
// invented arithmetic; `applyDelivery()` in components/order-forms.js is the
// seam where the server recomputes them. See BACKLOG.
// ============================================================================
import { HOME } from "./asset-base.js";

// ---- the order's lines ------------------------------------------------------
// Four lines, as the dealer frame draws them (1209:95225): title, colour and
// price are the frame's; the specs line is the customer fixture's, because the
// dealer 1440 card hides it and the 360 card shows the shared component's text.
//
// `oldPrice` is never rendered on a dealer card — the frame draws one price —
// but the summary derives «Скидка» from it, exactly as the customer page does.
// The frame's own figures don't reconcile (50 795 − 1 095 ≠ 43 335), so these
// are internally consistent rather than copied.
export const LINES = [
  {
    id: "flet-03",
    title: "Флэт-03",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет Wotan Oak 2S/Temple Stone 2S",
    image: `${HOME}/prod-mod-1-src.png`,
    price: 43661,
    oldPrice: 44100,
    modules: [
      { id: "flet-m1", title: "Шкаф нижний с 2-мя дверцами Флэт", qty: 3, price: 12080 },
      { id: "flet-m2", title: "Шкаф верхний с 2-мя дверцами Флэт", qty: 4, price: 3100 },
      { id: "flet-m3", title: "Пенал Флэт", qty: 1, price: 11210 },
    ],
  },
  {
    id: "shale",
    title: "Шале",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет Brown Dreamline",
    image: `${HOME}/prod-mod-2-src.png`,
    price: 21335,
    oldPrice: 21550,
    // the frame draws this one expanded (`condition=edit` 953:152360)
    modules: [
      { id: "shale-m1", title: "Шкаф нижний с 2-мя дверцами Флэт", qty: 4, price: 12080 },
      { id: "shale-m2", title: "Шкаф нижний с 2-мя дверцами Флэт", qty: 5, price: 3100 },
      { id: "shale-m3", title: "Шкаф нижний с 2-мя дверцами Флэт", qty: 2, price: 11210 },
    ],
  },
  {
    id: "fusion-05",
    title: "Кухня Фьюжн-05",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет Голубой",
    image: `${HOME}/prod-mod-3-src.png`,
    price: 30675,
    oldPrice: 30895,
    modules: [
      { id: "fusion-m1", title: "Шкаф нижний с 2-мя дверцами Флэт", qty: 2, price: 12080 },
      { id: "fusion-m2", title: "Шкаф верхний с 2-мя дверцами Флэт", qty: 3, price: 3100 },
    ],
  },
  {
    id: "nizza-05",
    title: "Кухня Ницца-05",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет белый",
    image: `${HOME}/prod-mod-4-src.png`,
    price: 30675,
    oldPrice: 30896,
    modules: [
      { id: "nizza-m1", title: "Шкаф нижний с 2-мя дверцами Флэт", qty: 1, price: 12080 },
      { id: "nizza-m2", title: "Шкаф верхний с 2-мя дверцами Флэт", qty: 2, price: 3100 },
    ],
  },
];

// ---- delivery ---------------------------------------------------------------
// The «Доставка» card's figures. Both surcharge badges read «+222₽» in the
// frame and neither is tied to its field by anything the design states, so the
// unit prices below are ours and the total is the frame's constant.
export const DELIVERY = {
  distanceKm: 12,
  floor: 8,
  surchargeDistance: 222,
  surchargeFloor: 222,
  cost: 3414,
};
