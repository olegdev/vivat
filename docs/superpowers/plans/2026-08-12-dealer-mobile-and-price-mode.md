# Дилерская главная на 360 и логика «Оптовая цена» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** дилерская главная работает на 360, а выбор прайс-листа («Оптовая цена / Рекомендованая цена / Своя наценка») реально пересчитывает цены на обоих ширинах.

**Architecture:** структура — HTML-партиалы, поведение — JS (правило Blade из CLAUDE.md). Строка списка режимов — один `<template>`, который клонируют и десктопная панель в шапке, и мобильная шторка. Пересчёт цен идёт через единственную функцию-шов `applyPriceMode()`, выбор хранится в `localStorage`. Мобильный вид главной — `max-md:` на месте, плюс дилерская обвязка (шапка, нижняя навигация, бургер, футер).

**Tech Stack:** Vite 6, Tailwind v4 (`@theme` в `src/styles/app.css`), ванильный JS без фреймворка, SSI-подобные инклюды `<!--#include partials/NAME.html -->`, Playwright для скриншотов.

## Global Constraints

- **Ничего не выдумывать.** Подписи, размеры, цвета — только из `scripts/fig.mjs` или живой Figma. Неизвестное — пустой слот + строка в `BACKLOG.md`.
- **Для инстансов — `fig.mjs inst <id>`, никогда `tree`.** `tree` печатает мастер.
- **Долги — только в `BACKLOG.md`.** В разметке допустим лишь короткий якорь «какой это узел Figma».
- **Кастомные классы с вариантом (`max-md:foo`) обязаны быть `@utility`**, не `@layer components`.
- **Токены из `@theme`**, не произвольные `bg-[#...]`.
- Орфография подписи режима — дизайнерская: **«Рекомендованая цена»** (одна «н»).
- Файл Figma: `t7qJcR7KNgLigitQwv3V5T`.
- Тестового раннера в проекте нет. «Проверка» везде означает три проверки из CLAUDE.md: `fig.mjs inst`, `npm run audit`, `npm run shot` **с обязательным открытием PNG**.
- Никаких `git push`. Коммит после каждой задачи.

---

### Task 1: Тумблер «Показывать цену» — реальные состояния

Сейчас ручка всегда `bg-components-strong`, то есть тёмная и в выключенном состоянии. В макете off — светло-серая дорожка и **серая** ручка.

**Files:**
- Modify: `src/partials/header.html:72-90` (десктопная дилерская полоска)

**Interfaces:**
- Consumes: ничего.
- Produces: разметка тумблера с хуками `data-dealer-price-toggle` (role=switch, aria-checked) и `data-dealer-price-knob` — на них опирается Task 3.

- [ ] **Step 1: Свериться с вариантами компонента**

```bash
node scripts/fig.mjs node 604:24614
node scripts/fig.mjs tree 604:24617 2   # turn=off, design=light, condition=default
```

Ожидается: `off` — дорожка `#e7e7e7`, ручка `#acacac`; `on` — `#cbcbcb` / `#292929`; hover-off — `#d9d9d9` / `#707070`.

- [ ] **Step 2: Заменить разметку тумблера**

```html
<button
  type="button"
  role="switch"
  aria-checked="true"
  data-dealer-price-toggle
  class="group/sw flex shrink-0 items-center gap-3"
>
  <!-- toggle 604:24616: on #cbcbcb/#292929, off #e7e7e7/#acacac,
       hover-off #d9d9d9/#707070 -->
  <span
    class="flex h-6 w-10 items-center rounded-pill bg-components-light p-0.5 transition-colors group-hover/sw:bg-components-light-hover group-aria-[checked=true]/sw:bg-surface-raised"
  >
    <span
      class="size-5 translate-x-0 rounded-pill bg-components-disabled-inverted transition-[translate,background-color] group-hover/sw:bg-components-disabled-inverted-hover group-aria-[checked=true]/sw:translate-x-4 group-aria-[checked=true]/sw:bg-components-strong"
      data-dealer-price-knob
    ></span>
  </span>
  <span class="whitespace-nowrap text-body-s-accent text-text-inverse-secondary"
    >Показывать цену</span
  >
</button>
```

Подпись на 1440 — «Показывать цену» (604:24655), на 360 — «Показать цену» (1739:219408). Это не опечатка, а два разных текста в макете.

- [ ] **Step 3: Собрать и посмотреть**

```bash
npm run build && npm run shot dealer/main
```

Открыть `.shots/dealer-main-1440.png`, обрезать по шапке: тумблер включён — тёмная ручка справа. Затем в devtools снять `aria-checked` и убедиться, что ручка стала серой слева.

- [ ] **Step 4: Коммит**

```bash
git add src/partials/header.html
git commit -m "Тумблер «Показывать цену»: выключенное состояние из макета"
```

---

### Task 2: Данные прайс-режимов и шов пересчёта

**Files:**
- Modify: `src/data/dealer-home.js`
- Create: `src/components/price-mode.js`
- Modify: `src/components/product-card.js:93`

**Interfaces:**
- Consumes: `priceModes`, `RRP_FACTOR` из `src/data/dealer-home.js`.
- Produces:
  - `priceModes: Array<{id: "wholesale"|"rrp"|"markup", label: string, min?: number}>`
  - `RRP_FACTOR: number`
  - `applyPriceMode({ mode, markup })` → `void` — пишет `localStorage`, пересчитывает все `[data-card-price]`, шлёт `dealer:price-mode`
  - `readPriceMode()` → `{ mode: string, markup: number }`
  - `formatPrice(n: number)` → `string` («46 310₽»)
  - Карточка товара несёт `data-price-base="450010"` и `data-price-raw="450 010₽"`.

- [ ] **Step 1: Добавить фикстуры**

В конец `src/data/dealer-home.js`:

```js
// ---- Прайс-листы дилера (dropdown-header 607:26932) -------------------------
// Подписи прочитаны из инстансов мобильной шторки (2225:164853/164854), не из
// мастера. «Рекомендованая» — орфография дизайнера. min=50 — из подписи
// «Минимальная наценка 50%» (2225:165661).
// В Blade это @foreach по прайс-листам с сервера.
export const priceModes = [
  { id: "wholesale", label: "Оптовая цена" },
  { id: "rrp", label: "Рекомендованая цена" },
  { id: "markup", label: "Своя наценка", min: 50 },
];

// Заглушка: откуда берётся РРЦ — вопрос в BACKLOG. Один коэффициент вместо
// выдуманных чисел по каждой карточке.
export const RRP_FACTOR = 2;
```

- [ ] **Step 2: Отдать карточке исходное число**

В `src/components/product-card.js` заменить строку 93:

```js
  const priceEl = node.querySelector("[data-card-price]");
  priceEl.textContent = p.price;
  // Фикстура даёт цену строкой («450 010₽»). Пересчёт по прайс-листу
  // (components/price-mode.js) считает от числа, а «Оптовая цена» возвращает
  // исходную строку дословно — поэтому храним обе формы.
  priceEl.dataset.priceRaw = p.price;
  priceEl.dataset.priceBase = String(parseInt(String(p.price).replace(/\D/g, ""), 10) || 0);
```

- [ ] **Step 3: Написать шов**

`src/components/price-mode.js`, пока только расчётная часть:

```js
// Прайс-листы дилера. Разметка — partials/price-mode.html и дилерская полоска
// в partials/header.html; здесь только поведение (правило Blade из CLAUDE.md).
import { priceModes, RRP_FACTOR } from "../data/dealer-home.js";

const STORE_KEY = "vivat:price-mode";

export function readPriceMode() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && priceModes.some((m) => m.id === raw.mode)) return raw;
  } catch {
    /* приватный режим или битое значение — молча падаем на умолчание */
  }
  return { mode: "wholesale", markup: markupMin() };
}

export function markupMin() {
  return priceModes.find((m) => m.id === "markup")?.min ?? 0;
}

export function formatPrice(n) {
  // toLocaleString разделяет разряды неразрывным пробелом; в фикстурах стоит
  // обычный — приводим к одному виду, чтобы пересчитанная цена не отличалась
  // от исходной начертанием.
  return `${Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ")}₽`;
}

function priceFor(el, { mode, markup }) {
  const base = Number(el.dataset.priceBase || 0);
  if (!base || mode === "wholesale") return el.dataset.priceRaw || el.textContent;
  if (mode === "rrp") return formatPrice(base * RRP_FACTOR);
  return formatPrice(base * (1 + markup / 100));
}

// Единственный шов: в Blade это станет сменой прайс-листа на сервере.
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
}
```

- [ ] **Step 4: Проверить, что база проставилась и цены не поехали**

```bash
npm run build && npm run shot dealer/main
```

Открыть `.shots/dealer-main-1440.png` — цены в каруселях те же, что были. Затем в браузере на `dist/pages/dealer/main.html`:

```js
[...document.querySelectorAll("[data-card-price]")]
  .map((el) => [el.textContent, el.dataset.priceBase])
  .slice(0, 3);
// [["450 010₽","450010"], ["11 430₽","11430"], ["32 544₽","32544"]]
```

Ожидается непустой `data-price-base` у каждой карточки.

- [ ] **Step 5: Коммит**

```bash
git add src/data/dealer-home.js src/components/price-mode.js src/components/product-card.js
git commit -m "Прайс-режимы: фикстуры, шов applyPriceMode и база цены в карточке"
```

---

### Task 3: Десктопный выпадающий список в дилерской полоске

**Files:**
- Modify: `src/partials/header.html:92-102` (триггер + новая панель)
- Create: `src/partials/price-mode.html` (пока только `<template>` строки)
- Modify: `src/components/price-mode.js`
- Delete: `src/components/dealer-header.js`
- Modify: `src/pages/dealer/main.js`

**Interfaces:**
- Consumes: `applyPriceMode`, `readPriceMode`, `markupMin`, `priceModes`.
- Produces: `initPriceMode(root = document)` → `void`. Хуки разметки: `[data-price-trigger]` (кнопка, её `[data-price-trigger-label]` — подпись), `[data-price-panel]` (десктопная панель), `[data-price-list]` (контейнер строк), `<template data-price-item>`, внутри строки — `[data-price-item-label]`, `[data-price-item-check]`, `[data-price-item-field]`, `[data-price-input]`, `[data-price-apply]`.

- [ ] **Step 1: Свериться с макетом**

```bash
node scripts/fig.mjs tree 1299:49518 6    # desktop, condition=open
node scripts/fig.mjs inst 2225:165635     # «Своя наценка» раскрытая (360)
```

Ожидается: панель 328×144, строки 320×44 при `padH=4` и `padV=8` у панели, выбранная `#eeeeee` + иконка-галочка справа; раскрытая строка 108 с полем 100×44 и подписью «Минимальная наценка 50%».

- [ ] **Step 2: Создать партиал с шаблоном строки**

`src/partials/price-mode.html`:

```html
<!-- Прайс-листы дилера. Строка списка — один <template> на оба экрана:
     десктопная панель живёт в шапке (partials/header.html), мобильная
     шторка — ниже. Клонирует components/price-mode.js. -->
<template data-price-item>
  <button type="button" class="price-item" data-price-item-id>
    <span class="flex items-center gap-2">
      <span class="min-w-0 flex-1 text-body-n text-text-primary max-md:text-m-body-n" data-price-item-label></span>
      <img
        src="../../assets/header/icon-check.svg"
        alt=""
        class="size-6 shrink-0 hidden"
        data-price-item-check
      />
    </span>
    <span class="hidden items-center gap-4 pt-2" data-price-item-field>
      <span class="flex h-11 w-[100px] items-center gap-1 rounded-[var(--radius-s)] bg-bg-page px-3">
        <input
          type="number"
          inputmode="numeric"
          class="min-w-0 flex-1 bg-transparent text-body-n text-text-primary outline-none"
          data-price-input
        />
        <span class="text-body-n text-text-muted">%</span>
      </span>
      <span class="text-body-s text-text-secondary" data-price-item-hint></span>
    </span>
  </button>
</template>
```

Иконку галочки выгрузить, если её нет:

```bash
ls public/assets/header/icon-check.svg
```

- [ ] **Step 3: Утилита строки в app.css**

```css
/* Строка списка прайс-листов (dropdown-item 606:26531). Выбранная — подложка
   components-subtle-hover; раскрытая «Своя наценка» растёт до 108. */
@utility price-item {
  @apply flex w-full flex-col rounded-[var(--radius-s)] px-3 py-2 text-left transition-colors;
  &[aria-selected="true"] {
    @apply bg-components-subtle-hover;
  }
}
```

- [ ] **Step 4: Панель в шапке**

Заменить существующую кнопку `data-dealer-pricelist` на:

```html
<!-- `dropdown-header` 607:26932, вариант condition=open 1299:49518 -->
<div class="relative shrink-0">
  <button
    type="button"
    class="flex items-center gap-0.5 text-body-n-accent text-text-inverse-primary"
    data-price-trigger
    aria-expanded="false"
    aria-haspopup="listbox"
  >
    <span class="underline decoration-dotted underline-offset-4" data-price-trigger-label
      >Оптовая цена</span
    >
    <img src="../../assets/header/chevron-down-light.svg" alt="" class="size-6" />
  </button>
  <div
    class="absolute left-0 top-8 z-50 hidden w-[328px] rounded-[var(--radius-s)] bg-bg-page py-2 shadow-dropdown"
    data-price-panel
  >
    <div class="flex flex-col px-1" data-price-list></div>
    <div class="hidden px-1 pt-2" data-price-apply-row>
      <button type="button" class="btn btn-m btn-primary w-full" data-price-apply>
        <span>Применить</span>
      </button>
    </div>
  </div>
</div>
```

`shadow-dropdown` взять из существующих теней в `app.css`; если такой нет — снять тень с `drop-down-list` в Figma и добавить токен.

- [ ] **Step 5: Поведение**

Дописать в `src/components/price-mode.js`:

```js
function labelFor(mode) {
  return priceModes.find((m) => m.id === mode)?.label ?? priceModes[0].label;
}

function buildRow(m, state) {
  const row = document.querySelector("[data-price-item]").content.firstElementChild.cloneNode(true);
  row.dataset.priceItemId = m.id;
  row.querySelector("[data-price-item-label]").textContent = m.label;
  const selected = m.id === state.mode;
  row.setAttribute("aria-selected", String(selected));
  row.querySelector("[data-price-item-check]").classList.toggle("hidden", !selected);
  const field = row.querySelector("[data-price-item-field]");
  if (m.id === "markup") {
    field.classList.toggle("hidden", !selected);
    field.classList.toggle("flex", selected);
    row.querySelector("[data-price-input]").value = state.markup;
    row.querySelector("[data-price-item-hint]").textContent = `Минимальная наценка ${m.min}%`;
  }
  return row;
}

export function initPriceMode(root = document) {
  const list = root.querySelector("[data-price-list]");
  if (!list) return;
  let state = readPriceMode();

  const render = () => {
    list.replaceChildren(...priceModes.map((m) => buildRow(m, state)));
    root.querySelectorAll("[data-price-trigger-label]").forEach((el) => {
      el.textContent = labelFor(state.mode);
    });
    root
      .querySelectorAll("[data-price-apply-row]")
      .forEach((el) => el.classList.toggle("hidden", state.mode !== "markup"));
  };

  list.addEventListener("click", (e) => {
    const row = e.target.closest("[data-price-item-id]");
    if (!row) return;
    state = { ...state, mode: row.dataset.priceItemId };
    render();
    // У «Своей наценки» выбор подтверждает «Применить» — у остальных сразу.
    if (state.mode !== "markup") {
      applyPriceMode(state);
      close();
    }
  });

  list.addEventListener("input", (e) => {
    const input = e.target.closest("[data-price-input]");
    if (input) state = { ...state, markup: Number(input.value) };
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
      close();
    })
  );

  render();
  applyPriceMode(state);
}
```

Открытие и закрытие — по образцу `components/catalog-menu.js`:

```js
function bindPanel(root, close) {
  const panel = root.querySelector("[data-price-panel]");
  const trigger = root.querySelector("[data-price-panel-trigger]");
  if (!panel || !trigger) return;

  trigger.addEventListener("click", () => {
    const open = panel.classList.toggle("hidden") === false;
    trigger.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("hidden") && !e.target.closest("[data-price-panel], [data-price-panel-trigger]")) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
```

`close()` прячет и панель, и шторку и сбрасывает `aria-expanded` на обоих триггерах.
```

- [ ] **Step 6: Переселить тумблер и удалить `dealer-header.js`**

Функцию `initPriceToggle` из `src/components/dealer-header.js` перенести в `price-mode.js` без изменения поведения (переключает `aria-checked`, шлёт `dealer:price-visibility`, цены не трогает), файл удалить, импорт в `src/pages/dealer/main.js` заменить на `initPriceMode`.

- [ ] **Step 7: Подключить партиал**

В `src/pages/dealer/main.html` рядом с другими инклюдами:

```html
      <!-- ==================== ПРАЙС-ЛИСТЫ ============================== -->
      <!--#include partials/price-mode.html -->
```

- [ ] **Step 8: Проверить**

```bash
npm run build && npm run shot dealer/main
```

Открыть страницу, кликнуть «Оптовая цена»: панель 328 под триггером, три строки, галочка у первой. Выбрать «Рекомендованая цена» — подпись триггера меняется, цены во всех каруселях удваиваются. Выбрать «Своя наценка», ввести 10 → «Применить» подставляет 50 (минимум); ввести 80 → цены = база × 1.8. Перезагрузить — выбор сохранился.

- [ ] **Step 9: Коммит**

```bash
git add -A src/partials src/components src/pages/dealer src/styles
git commit -m "Десктопный выбор прайс-листа: панель из макета, пересчёт цен"
```

---

### Task 4: Дилерская мобильная шапка

**Files:**
- Modify: `src/partials/header.html:4-35` (мобильная шапка)

**Interfaces:**
- Consumes: хуки `[data-price-trigger]`, `[data-price-trigger-label]`, `[data-dealer-price-toggle]` из Task 1 и 3 — на 360 это **вторые экземпляры** тех же хуков, поэтому `initPriceMode` обновляет обе подписи (в `render()` уже `querySelectorAll`).
- Produces: `[data-price-sheet-open]` — кнопка, открывающая мобильную шторку (Task 5).

- [ ] **Step 1: Прочитать инстанс**

```bash
node scripts/fig.mjs inst 2225:163138
node scripts/fig.mjs tree 1739:219449 3
```

Ожидается: полоска 38 (`#f8f8f8`, padH 16) — «Москва» + пин слева, телефон справа; тёмный ряд 40 (`#292929`, padH 16) — слева триггер (текст 93×20, шеврон 24), справа «Показать цену» (98×20) + тумблер 40×24 с gap 8; ряд 60 — бургер / лого / профиль.

- [ ] **Step 2: Правый слот полоски**

В мобильной шапке рядом со ссылкой «Стать дилером» добавить дилерскую ветку:

```html
    <a class="text-m-body-n text-text-primary underline decoration-from-font underline-offset-2 group-data-[user=dealer]:hidden" href="#"
      >Стать дилером</a
    >
    <a class="hidden text-m-body-n-accent text-text-primary group-data-[user=dealer]:block" href="tel:+74951356565"
      >+7 (495) 135-65-65</a
    >
```

- [ ] **Step 3: Тёмный ряд**

Сразу после полоски 38, перед рядом 60:

```html
  <!-- Дилерский ряд — site-header 2225:163138, ряд `row` 1739:219449: 40px,
       слева выбор прайс-листа, справа тумблер. -->
  <div
    class="hidden h-10 items-center justify-between bg-components-strong px-4 group-data-[user=dealer]:flex"
  >
    <button
      type="button"
      class="flex items-center gap-0.5 text-m-body-n text-text-inverse-primary"
      data-price-trigger
      data-price-sheet-open
      aria-expanded="false"
      aria-haspopup="dialog"
    >
      <span data-price-trigger-label>Оптовая цена</span>
      <img src="../../assets/header/chevron-down-light.svg" alt="" class="size-6" />
    </button>
    <button
      type="button"
      role="switch"
      aria-checked="true"
      data-dealer-price-toggle
      class="group/sw flex shrink-0 items-center gap-2"
    >
      <span class="whitespace-nowrap text-m-body-n text-text-inverse-primary">Показать цену</span>
      <span
        class="flex h-6 w-10 items-center rounded-pill bg-components-light p-0.5 transition-colors group-aria-[checked=true]/sw:bg-surface-raised"
      >
        <span
          class="size-5 translate-x-0 rounded-pill bg-components-disabled-inverted transition-[translate,background-color] group-aria-[checked=true]/sw:translate-x-4 group-aria-[checked=true]/sw:bg-components-strong"
        ></span>
      </span>
    </button>
  </div>
```

Порядок на 360 обратный десктопному: подпись слева, тумблер справа (1739:219406).

- [ ] **Step 4: Проверить**

```bash
npm run build && npm run audit dealer/main 'header.md\:hidden' 2225:163138
npm run shot dealer/main
```

Открыть `.shots/dealer-main-390.png`: шапка ровно три ряда, суммарно 138px, тумблер не переносится. Заодно открыть `.shots/customer-main-390.png` — покупательская шапка не изменилась (тёмного ряда нет, справа «Стать дилером»).

- [ ] **Step 5: Коммит**

```bash
git add src/partials/header.html
git commit -m "Дилерская шапка на 360: телефон в полоске и тёмный ряд с выбором цены"
```

---

### Task 5: Мобильная шторка «Наценка»

**Files:**
- Modify: `src/partials/price-mode.html`
- Modify: `src/components/price-mode.js`

**Interfaces:**
- Consumes: `[data-price-sheet-open]` из Task 4, `<template data-price-item>` из Task 3.
- Produces: `[data-price-sheet]` (оверлей), `[data-price-sheet-panel]`, `[data-price-sheet-close]`; второй `[data-price-list]` внутри шторки — `initPriceMode` работает с **обоими** списками.

- [ ] **Step 1: Прочитать инстансы обоих состояний**

```bash
node scripts/fig.mjs tree 2225:164071 6     # состояние 1
node scripts/fig.mjs tree 2225:165270 6     # состояние 2
node scripts/fig.mjs inst 2225:164073       # заголовок: «Наценка»
```

Ожидается: панель 400 снизу, шапка 56 (заголовок + × справа), `main-container` padH/padV 16 gap 6, `modal-button-container` 60 с кнопкой «Применить» (2225:165729).

- [ ] **Step 2: Добавить шторку в партиал**

```html
<!-- Шторка выбора прайс-листа (360): 2225:163666 / 2225:164865. Оверлей
     #141414/0.9, панель 400 снизу, шапка 56, кнопка «Применить» только у
     «Своей наценки». Выше md не рендерится. -->
<div data-price-sheet class="fixed inset-0 z-50 hidden md:hidden">
  <div class="absolute inset-0 bg-overlay-strong" data-price-sheet-close></div>
  <div
    class="absolute inset-x-0 bottom-0 flex h-[400px] flex-col bg-bg-page"
    role="dialog"
    aria-modal="true"
    aria-label="Наценка"
    data-price-sheet-panel
  >
    <div class="flex h-14 shrink-0 items-center px-4">
      <span class="min-w-0 flex-1 text-m-h2 text-text-primary">Наценка</span>
      <button type="button" class="flex size-10 shrink-0 items-center justify-end" aria-label="Закрыть" data-price-sheet-close>
        <img src="../../assets/header/icon-close-s.svg" alt="" class="size-6" />
      </button>
    </div>
    <div class="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-4" data-price-list></div>
    <div class="hidden shrink-0 px-4 py-2" data-price-apply-row>
      <button type="button" class="btn btn-m btn-primary w-full" data-price-apply>
        <span>Применить</span>
      </button>
    </div>
  </div>
</div>
```

`bg-overlay-strong` — проверить, есть ли токен на `#141414/0.9`; если нет, добавить в `@theme` (в макете это `overlay` 2209:213628).

- [ ] **Step 3: Научить `initPriceMode` двум спискам**

Заменить единственный `querySelector("[data-price-list]")` на `querySelectorAll` и рендерить в каждый; открытие по `[data-price-sheet-open]` показывает `[data-price-sheet]`, `[data-price-sheet-close]` и Escape — закрывают. Клик по строке и «Применить» уже делегированы, обработчики вешаются на каждый список.

- [ ] **Step 4: Проверить**

```bash
npm run build && npm run shot dealer/main
```

На 390: тап по «Оптовая цена» открывает шторку 400 снизу; выбор «Рекомендованая цена» закрывает её и меняет цены; «Своя наценка» раскрывает поле и показывает «Применить». Открыть PNG и сверить с `/tmp/sheet-b.png` (скриншот макета).

- [ ] **Step 5: Коммит**

```bash
git add src/partials/price-mode.html src/components/price-mode.js src/styles/app.css
git commit -m "Мобильная шторка «Наценка» из макета"
```

---

### Task 6: Дилерская нижняя навигация

**Files:**
- Modify: `src/partials/bottom-nav.html`
- Create: `public/assets/header/nav-business.svg`

**Interfaces:**
- Consumes: `data-user="dealer"` на `<body>`.
- Produces: ничего для других задач.

- [ ] **Step 1: Прочитать инстанс и выгрузить иконку**

```bash
node scripts/fig.mjs inst 2225:160593
```

Ожидается третий пункт «Бизнесу» (1739:233051), иконка — вектор 2214:191187. Выгрузить SVG через Figma MCP (`download_assets`, узел `1739:232987`) в `public/assets/header/nav-business.svg`.

- [ ] **Step 2: Раздвоить третий пункт**

```html
  <a href="action.html" class="flex min-w-0 flex-1 flex-col items-center px-0.5 pb-2 pt-1 group-data-[user=dealer]:hidden">
    <span class="flex size-8 items-center justify-center">
      <img src="../../assets/header/nav-action.svg" alt="" class="size-6" />
    </span>
    <span class="text-body-xs text-text-muted">Акции</span>
  </a>
  <!-- дилерский вариант — nav-item 1739:233051 -->
  <a href="#" class="hidden min-w-0 flex-1 flex-col items-center px-0.5 pb-2 pt-1 group-data-[user=dealer]:flex">
    <span class="flex size-8 items-center justify-center">
      <img src="../../assets/header/nav-business.svg" alt="" class="size-6" />
    </span>
    <span class="text-body-xs text-text-muted">Бизнесу</span>
  </a>
```

- [ ] **Step 3: Проверить**

```bash
npm run build && npm run shot customer/main dealer/main
```

На 390 у покупателя третий пункт «Акции», у дилера — «Бизнесу»; пять пунктов ровной шириной в обоих случаях.

- [ ] **Step 4: Коммит**

```bash
git add src/partials/bottom-nav.html public/assets/header/nav-business.svg
git commit -m "Нижняя навигация: дилерский пункт «Бизнесу» вместо «Акций»"
```

---

### Task 7: Обвязка мобильной главной

**Files:**
- Modify: `src/pages/dealer/main.html`
- Modify: `src/pages/dealer/main.js`
- Modify: `src/components/mobile-menu.js`
- Modify: `src/data/dealer-home.js`

**Interfaces:**
- Consumes: `initMobileMenu`, `initPriceMode`.
- Produces: `initMobileMenu(anchor, { toggle, catalogToggle, rootSections })` — новый необязательный параметр `rootSections`; при отсутствии берётся покупательский список. `dealerMenuSections` в `src/data/dealer-home.js`.

- [ ] **Step 1: Дилерский корень меню в фикстурах**

```js
// ---- Бургер-меню дилера -----------------------------------------------------
// Фрейма на 360 нет: набор покупательский, нижние ссылки — те же, что в
// дилерской полоске десктопной шапки (877:93261).
export const dealerMenuSections = [
  { label: "Каталог", view: "catalog" },
  { label: "Где купить", href: "#" },
  { label: "Компания", href: "#" },
  { label: "Полезная информация", href: "#" },
  { label: "Для бизнеса", href: "#" },
  { label: "Мой кабинет", href: "#" },
  { label: "Выход", href: "#" },
];
```

- [ ] **Step 2: Параметр в компоненте меню**

В `src/components/mobile-menu.js` подпись `initMobileMenu(anchor, { toggle, catalogToggle, rootSections = defaultRootSections } = {})`, локальную константу переименовать в `defaultRootSections`, `ROOT_VIEW` собирать из параметра.

- [ ] **Step 3: Подключить обвязку на странице**

В `src/pages/dealer/main.html`: убрать из шапки файла пометку «Desktop only», добавить `data-mobile-menu-root` с инклюдом `partials/mobile-menu.html` (по образцу `customer/main.html:31-34`), `partials/bottom-nav.html` перед футером и `pb-[72px] md:pb-0` на обёртке страницы.

- [ ] **Step 4: Дописать `main.js`**

```js
import { initMobileMenu } from "../../components/mobile-menu.js";
import { initPriceMode } from "../../components/price-mode.js";
import { newsItems, dealerMenuSections } from "../../data/dealer-home.js";

initPriceMode();

initMobileMenu(document.querySelector("[data-mobile-menu-root]"), {
  toggle: document.querySelector("[data-mobile-menu]"),
  catalogToggle: document.querySelector("[data-mobile-catalog]"),
  rootSections: dealerMenuSections,
});
```

Комментарий о том, что страница только десктопная, удалить.

- [ ] **Step 5: Проверить**

```bash
npm run build && npm run shot dealer/main
```

На 390: бургер открывает меню с дилерскими ссылками, поиск из меню открывает оверлей, нижняя навигация не перекрывает футер. `npm run shot` не должен ругаться на горизонтальный скролл.

- [ ] **Step 6: Коммит**

```bash
git add src/pages/dealer src/components/mobile-menu.js src/data/dealer-home.js
git commit -m "Дилерская главная: бургер-меню, нижняя навигация, мобильная обвязка"
```

---

### Task 8: Блок «Новости» на 360

**Files:**
- Modify: `src/pages/dealer/main.html:64-80`
- Modify: `src/pages/dealer/main.js`

**Interfaces:**
- Consumes: `initScrollProgress`, `enableDragScroll` из `components/carousel.js`, `renderNewsCards`.
- Produces: ничего.

- [ ] **Step 1: Переписать секцию по образцу `partials/promo-row.html`**

```html
      <section class="flex flex-col" data-section="news">
        <div class="px-10 max-md:px-4">
          <div class="h-20 max-md:h-10"></div>
          <div class="flex items-start justify-between max-md:flex-col max-md:gap-3">
            <h2 class="text-h2 text-text-primary max-md:text-m-h2">Новости</h2>
            <div class="flex items-center gap-2 max-md:w-full">
              <a href="#" class="btn btn-m btn-primary max-md:flex-1" data-news-subscribe>
                <span>Подписаться на рассылку</span>
              </a>
              <a href="#" class="btn btn-m btn-secondary max-md:flex-1">
                <span>Все новости</span>
                <img src="../../assets/header/arrow-right-24.svg" alt="" class="size-6" />
              </a>
            </div>
          </div>
          <div class="h-6 max-md:h-3"></div>
        </div>
        <div
          class="px-10 max-md:scroll-rail max-md:snap-x max-md:snap-proximity max-md:scroll-pl-4 max-md:overflow-x-auto max-md:px-4"
          data-viewport
        >
          <div
            class="grid grid-cols-3 gap-6 max-md:flex max-md:gap-3 max-md:*:w-[320px] max-md:*:shrink-0 max-md:*:snap-start"
            data-news-track
          ></div>
        </div>
        <div class="hidden max-md:block">
          <div class="scroll-progress" data-progress><span><i></i></span></div>
        </div>
      </section>
```

- [ ] **Step 2: Включить индикатор и драг**

В `src/pages/dealer/main.js` после `renderNewsCards`:

```js
const newsAnchor = document.querySelector('[data-section="news"]');
initScrollProgress(newsAnchor);
enableDragScroll(newsAnchor.querySelector("[data-viewport]"));
```

- [ ] **Step 3: Проверить**

```bash
npm run build && npm run shot dealer/main
```

Открыть оба PNG: на 1440 сетка 3×1 не изменилась, на 390 — рельс с полоской прокрутки, кнопки строкой в полширины, страница не уезжает вбок.

- [ ] **Step 4: Коммит**

```bash
git add src/pages/dealer
git commit -m "Новости на 360: горизонтальный рельс и кнопки строкой"
```

---

### Task 9: Дилерские ветки в мобильном футере

**Files:**
- Modify: `src/partials/footer.html:4-20` и блок «Компания»

**Interfaces:** нет.

- [ ] **Step 1: Кнопка «Личный кабинет»**

В мобильном футере после ряда соцсетей:

```html
    <!-- dealer only — `buttons` 752:51003 -->
    <a href="#" class="btn btn-m btn-primary hidden w-full gap-2 group-data-[user=dealer]:flex" data-dealer-cabinet>
      <span>Личный кабинет</span>
      <img src="../../assets/header/icon-arrow-right-light.svg" alt="" class="size-6" />
    </a>
```

- [ ] **Step 2: Ссылка «Письмо директору»**

В мобильной группе «Компания»:

```html
        <a href="#" class="hidden whitespace-nowrap group-data-[user=dealer]:inline">Письмо директору</a>
```

- [ ] **Step 3: Проверить**

```bash
npm run build && npm run shot customer/main dealer/main
```

На 390 у дилера кнопка и ссылка есть, у покупателя — нет.

- [ ] **Step 4: Коммит**

```bash
git add src/partials/footer.html
git commit -m "Мобильный футер: дилерские кнопка и ссылка"
```

---

### Task 10: Документация

**Files:**
- Modify: `BACKLOG.md`, `docs/FIGMA-MAP.md`, `CLAUDE.md`, `SOLUTIONS.md`

**Interfaces:** нет.

- [ ] **Step 1: `BACKLOG.md`**

Удалить как решённые: «Прайс-листы „Оптовая цена“ — списка нет» и «Отступ полоски» (если подтверждён), заменить «Мобильной дилерской главной нет» на список блоков, собранных без фрейма. Добавить: источник РРЦ (сейчас `RRP_FACTOR = 2`); что должен делать выключенный тумблер; как выглядит раскрытая «Своя наценка» на 1440; пять соцсетей в мобильном футере против шести в десктопном.

- [ ] **Step 2: `docs/FIGMA-MAP.md`**

Исправить три строки таблицы секции `dealer`: 2225:160540 — дилерская мобильная шапка и нижняя навигация (а не «Каталог»), 2225:163666 и 2225:164865 — состояния шторки «Наценка». Закрыть вопросы 4 и 9. Дописать, что у `dropdown-header` четыре варианта и открытый список — 1299:49518.

- [ ] **Step 3: `CLAUDE.md`**

В «Где мы стоим» дописать абзац про дилерскую главную: что на 360 сделано, что собрано без фрейма, где живёт логика прайс-листов.

- [ ] **Step 4: `SOLUTIONS.md`**

Добавить приём, который стоил времени: **имя фрейма врёт, а состав — нет**. Три фрейма назывались `catalog`/`menu` и числились меню каталога; чем они являются, показал только обход состава (`inst` по инстансам внутри). Для секций, где дизайнер не переименовывает фреймы, опознавать по содержимому, а не по имени и не по соседям.

- [ ] **Step 5: Финальная проверка всего**

```bash
npm run build && npm run build:php && npm run shot
```

Открыть PNG всех страниц: покупательские не изменились, дилерская работает на обеих ширинах.

- [ ] **Step 6: Коммит**

```bash
git add -A
git commit -m "Документация: карта Figma, бэклог и приём чтения безымянных фреймов"
```
