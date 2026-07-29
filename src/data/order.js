// ============================================================================
// MOCK DATA — оформление заказа (pages/customer/order.html)
//
// PORTING NOTE (PHP / Blade)
// `LINES` is the cart the controller hands the view — one entry per
// partials/cart-card.html unit (which also owns the quantity stepper). The
// order summary derives its totals from the same array; on the server those
// come from the cart model, not from the view.
// ============================================================================
import { HOME } from "./asset-base.js";

// ---- the order's lines ------------------------------------------------------
// Fixture standing in for the session cart; the Blade build gets these from the
// server. Titles, specs and colours are the three lines the Figma frame draws
// (953:151123 and siblings); prices are internally consistent rather than
// copied, because the frame's placeholder figures don't add up.
export const LINES = [
  {
    id: "flet-03",
    title: "Флэт-03",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет Wotan Oak 2S/Temple Stone 2S",
    image: `${HOME}/prod-mod-1-src.png`,
    price: 43661,
    oldPrice: 44861,
  },
  {
    id: "shale",
    title: "Шале",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет Brown Dreamline",
    image: `${HOME}/prod-mod-2-src.png`,
    price: 21335,
    oldPrice: 22730,
  },
  {
    id: "fusion-05",
    title: "Кухня Фьюжн-05",
    specs: "Прямая, В*Ш*Г 2000 х 2170 х 600 мм, Материал МДФ",
    color: "Цвет Silky White/Silky Light Grey",
    image: `${HOME}/prod-mod-3-src.png`,
    price: 30675,
    oldPrice: 31875,
  },
];

