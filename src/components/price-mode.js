// Дилерский прайс-лист — «Оптовая цена / Рекомендованая цена / Своя наценка».
//
// Разметка живёт в HTML: строка списка — <template> в partials/price-mode.html,
// десктопная панель — в дилерской полоске partials/header.html, мобильная
// шторка — там же в партиале. Здесь только поведение (правило Blade в
// CLAUDE.md); ни одна строка разметки тут не собирается.
//
// Единственный шов запроса — applyPriceMode(). В Blade это станет сменой
// прайс-листа на сервере; пока пересчёт идёт на клиенте от базовой цены,
// которую кладёт в карточку components/product-card.js.
import { priceModes, RRP_FACTOR } from "../data/dealer-home.js";

const STORE_KEY = "vivat:price-mode";

export function markupMin() {
  return priceModes.find((m) => m.id === "markup")?.min ?? 0;
}

export function readPriceMode() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && priceModes.some((m) => m.id === raw.mode)) {
      return { mode: raw.mode, markup: Number(raw.markup) || markupMin() };
    }
  } catch {
    /* приватный режим или битое значение — молча падаем на умолчание */
  }
  return { mode: "wholesale", markup: markupMin() };
}

export function formatPrice(n) {
  // toLocaleString разделяет разряды неразрывным пробелом, в фикстурах стоит
  // обычный — приводим к одному виду, чтобы пересчитанная цена не отличалась
  // от исходной начертанием.
  return `${Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ")}₽`;
}

function priceFor(el, { mode, markup }) {
  const base = Number(el.dataset.priceBase || 0);
  // «Оптовая цена» возвращает строку фикстуры дословно: на покупательских
  // страницах, где режима нет вовсе, ничего не должно меняться.
  if (!base || mode === "wholesale") return el.dataset.priceRaw ?? el.textContent;
  if (mode === "rrp") return formatPrice(base * RRP_FACTOR);
  return formatPrice(base * (1 + markup / 100));
}

export function applyPriceMode({ mode, markup }) {
  const state = { mode, markup: Number(markup) || markupMin() };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* см. readPriceMode */
  }
  document.body.dataset.priceMode = state.mode;
  document.querySelectorAll("[data-card-price]").forEach((el) => {
    el.textContent = priceFor(el, state);
  });
  document.dispatchEvent(new CustomEvent("dealer:price-mode", { detail: state }));
  return state;
}
