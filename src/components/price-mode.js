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
      return {
        mode: raw.mode,
        markup: Number(raw.markup) || markupMin(),
        enabled: raw.enabled !== false,
      };
    }
  } catch {
    /* приватный режим или битое значение — молча падаем на умолчание */
  }
  // Тумблер в макете включён (604:24614, turn=on), это и есть состояние по
  // умолчанию.
  return { mode: "wholesale", markup: markupMin(), enabled: true };
}

export function formatPrice(n) {
  // toLocaleString разделяет разряды неразрывным пробелом, в фикстурах стоит
  // обычный — приводим к одному виду, чтобы пересчитанная цена не отличалась
  // от исходной начертанием.
  return `${Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ")}₽`;
}

// Тумблер «Показать цену» — выключатель применения: выключен, значит цена
// оптовая, независимо от выбранного в списке режима. Ничего не скрывает.
function effectiveMode({ mode, enabled }) {
  return enabled === false ? "wholesale" : mode;
}

function priceFor(el, state) {
  const base = Number(el.dataset.priceBase || 0);
  // «Оптовая цена» возвращает строку фикстуры дословно: на покупательских
  // страницах, где режима нет вовсе, ничего не должно меняться.
  if (!base || effectiveMode(state) === "wholesale") return el.dataset.priceRaw ?? el.textContent;
  if (effectiveMode(state) === "rrp") return formatPrice(base * RRP_FACTOR);
  return formatPrice(base * (1 + state.markup / 100));
}

let applied = null;

function reprice(state, root = document) {
  root.querySelectorAll("[data-card-price]").forEach((el) => {
    el.textContent = priceFor(el, state);
  });
}

export function applyPriceMode({ mode, markup, enabled = true }) {
  const state = { mode, markup: Number(markup) || markupMin(), enabled };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* см. readPriceMode */
  }
  applied = state;
  document.body.dataset.priceMode = effectiveMode(state);
  reprice(state);
  document.dispatchEvent(new CustomEvent("dealer:price-mode", { detail: state }));
  return state;
}

// Карточки рисуются позже инициализации шапки, а вкладки «Популярных товаров»
// перерисовывают их и потом. Поэтому режим применяется не один раз на старте, а
// на каждую порцию свежей разметки.
document.addEventListener("cards:rendered", (e) => {
  if (applied) reprice(applied, e.detail?.root ?? document);
});

// ---- список: панель на 1440, шторка на 360 ----------------------------------
// Оба экрана рисуют один и тот же <template>, поэтому и рендер, и обработчики
// ходят по всем [data-price-list], а не по первому найденному.

function labelFor(mode) {
  return priceModes.find((m) => m.id === mode)?.label ?? priceModes[0].label;
}

function buildRow(m, state) {
  const tpl = document.querySelector("[data-price-item]");
  const row = tpl.content.firstElementChild.cloneNode(true);
  const selected = m.id === state.mode;

  row.dataset.priceItemId = m.id;
  row.setAttribute("aria-selected", String(selected));
  row.querySelector("[data-price-item-label]").textContent = m.label;
  row.querySelector("[data-price-item-check]").classList.toggle("hidden", !selected);

  const field = row.querySelector("[data-price-item-field]");
  // Поле ввода есть только у «Своей наценки» и только когда она выбрана
  // (2225:165635); у остальных строк его в макете нет вовсе.
  if (m.id === "markup" && selected) {
    field.classList.remove("hidden");
    field.classList.add("flex");
    field.querySelector("[data-price-input]").value = state.markup;
    field.querySelector("[data-price-item-hint]").textContent = `Минимальная наценка ${m.min}%`;
  } else {
    field.remove();
  }
  return row;
}

export function initPriceMode(root = document) {
  const lists = [...root.querySelectorAll("[data-price-list]")];
  if (!lists.length || !document.querySelector("[data-price-item]")) return;

  const panel = root.querySelector("[data-price-panel]");
  const sheet = root.querySelector("[data-price-sheet]");
  const triggers = [...root.querySelectorAll("[data-price-trigger]")];
  let state = readPriceMode();

  const close = () => {
    panel?.classList.add("hidden");
    sheet?.classList.add("hidden");
    triggers.forEach((t) => t.setAttribute("aria-expanded", "false"));
  };

  const open = (el, trigger) => {
    if (!el) return;
    el.classList.remove("hidden");
    trigger.setAttribute("aria-expanded", "true");
  };

  const render = () => {
    lists.forEach((list) => list.replaceChildren(...priceModes.map((m) => buildRow(m, state))));
    // Подпись триггера показывает применённый режим, а не выбранную строку:
    // «Своя наценка» ещё ждёт «Применить», и до него цены прежние.
    root.querySelectorAll("[data-price-trigger-label]").forEach((el) => {
      el.textContent = labelFor((applied ?? state).mode);
    });
    root
      .querySelectorAll("[data-price-apply-row]")
      .forEach((el) => el.classList.toggle("hidden", state.mode !== "markup"));
  };

  lists.forEach((list) => {
    list.addEventListener("click", (e) => {
      const row = e.target.closest("[data-price-item-id]");
      if (!row || !e.target.closest("[data-price-item-select]")) return;
      state = { ...state, mode: row.dataset.priceItemId };
      // «Применить» есть только у «Своей наценки» — остальные режимы
      // применяются сразу по тапу, кнопки в макете у них нет.
      if (state.mode !== "markup") applyPriceMode(state);
      render();
      if (state.mode !== "markup") close();
    });

    list.addEventListener("input", (e) => {
      if (e.target.closest("[data-price-input]")) state = { ...state, markup: Number(e.target.value) };
    });
  });

  root.querySelectorAll("[data-price-apply]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const min = markupMin();
      if (!(state.markup >= min)) {
        state = { ...state, markup: min };
        render();
        return;
      }
      applyPriceMode(state);
      render();
      close();
    })
  );

  root.querySelector("[data-price-panel-trigger]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (panel?.classList.contains("hidden")) open(panel, e.currentTarget);
    else close();
  });

  root.querySelector("[data-price-sheet-trigger]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (sheet?.classList.contains("hidden")) open(sheet, e.currentTarget);
    else close();
  });

  root.querySelectorAll("[data-price-close]").forEach((el) => el.addEventListener("click", close));

  // Клик мимо панели закрывает её — но проверять это надо на фазе перехвата.
  // Выбор строки перерисовывает список, и к моменту всплытия до document
  // нажатый элемент уже вынут из DOM: closest() вернёт null, и панель закроется
  // на собственном клике.
  document.addEventListener(
    "click",
    (e) => {
      if (!panel || panel.classList.contains("hidden")) return;
      if (!e.target.closest("[data-price-panel], [data-price-panel-trigger]")) close();
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  render();
  applyPriceMode(state);
}

// ---- тумблер «Показать цену» ------------------------------------------------
// Прототипа на нём нет: переключает своё состояние и шлёт событие, цены не
// трогает. Что он должен скрывать на самом деле — вопрос в BACKLOG.
function initPriceToggle(root) {
  // Тумблеров два — в десктопной полоске и в мобильном ряду; видно всегда один,
  // но состояние держим общим, иначе поворот экрана показывает другое.
  const all = [...root.querySelectorAll("[data-dealer-price-toggle]")];
  if (!all.length) return;

  const paint = (on) => all.forEach((el) => el.setAttribute("aria-checked", String(on)));
  paint((applied ?? readPriceMode()).enabled !== false);

  all.forEach((btn) =>
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-checked") !== "true";
      paint(on);
      // Тумблер применяет то, что выбрано в списке: выключен — цены оптовые,
      // включён — выбранный режим.
      applyPriceMode({ ...(applied ?? readPriceMode()), enabled: on });
      root.dispatchEvent(
        new CustomEvent("dealer:price-enabled", { detail: { enabled: on }, bubbles: true })
      );
    })
  );
}

export function initDealerPriceControls(root = document) {
  initPriceMode(root);
  initPriceToggle(root);
}
