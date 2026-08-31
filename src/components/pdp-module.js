// Сводка модуля — поведение. Структура в partials/pdp-module-summary.html.
//
// Здесь ровно три вещи: подставить копию, собрать сегменты «Комплектация, мм.»
// и собрать две группы образцов («Каркас» и «Фасад»). Выбор внутри группы
// независим — это два разных свойства товара, а не один переключатель.
//
// Разметку не строим строками: единица каждой повторяющейся вещи лежит
// <template>-ом в партиале, здесь её только клонируют и заполняют — так же,
// как во всех остальных компонентах (CLAUDE.md › Blade).
const clone = (sel) => document.querySelector(sel).content.firstElementChild.cloneNode(true);

function pick(group, chosen) {
  group.forEach((b) => b.setAttribute("aria-checked", String(b === chosen)));
}

export function initModuleSummary(product) {
  const root = document.querySelector("[data-module-summary]");
  if (!root) return;

  root.querySelector("[data-module-title]").textContent = product.title;
  root.querySelector("[data-module-packaging-label]").textContent = product.packagingLabel;
  root.querySelector("[data-module-size]").textContent = product.size;
  root.querySelector("[data-module-order]").textContent = product.cta;
  root.querySelector("[data-module-notice]").textContent = product.notice;

  // ---- комплектация ---------------------------------------------------------
  const segWrap = root.querySelector("[data-module-packaging]");
  const segs = product.packaging.map((s, i) => {
    const btn = clone("[data-module-segment]");
    btn.textContent = s.label;
    btn.value = s.value;
    if (i === 0) btn.setAttribute("aria-checked", "true");
    btn.addEventListener("click", () => pick(segs, btn));
    return btn;
  });
  segWrap.append(...segs);

  // ---- две группы цветов ----------------------------------------------------
  const colorsWrap = root.querySelector("[data-module-colors]");
  product.colorGroups.forEach((group) => {
    const node = clone("[data-module-color-group]");
    node.querySelector("[data-group-label]").textContent = group.label;
    node.querySelector("[data-group-name]").textContent = group.name;
    const box = node.querySelector("[data-group-colors]");
    const swatches = group.colors.map((c, i) => {
      const btn = clone("[data-module-swatch]");
      btn.querySelector("img").src = c.img;
      if (i === 0) btn.setAttribute("aria-checked", "true");
      btn.addEventListener("click", () => pick(swatches, btn));
      return btn;
    });
    box.append(...swatches);
    colorsWrap.append(node);
  });
}

// У модуля вкладок четыре — «Описание», «Модули», «Состав» и «Где купить»
// (Tab 2488:127161). «Документы» и «Отзывы» из общего партиала снимаем здесь,
// а не заводим второй партиал: разница ровно в двух ярлыках.
export function dropSpecTabs(names) {
  const section = document.querySelector("#specs");
  if (!section) return;
  names.forEach((name) => {
    section.querySelector(`[data-spec-tabs] [data-panel="${name}"]`)?.remove();
    section.querySelector(`[data-spec-panels] > [data-panel="${name}"]`)?.remove();
    section.querySelector(`[data-spec-tabs] [href="#${name}"]`)?.remove();
  });
}
