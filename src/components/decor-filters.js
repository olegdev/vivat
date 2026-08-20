// Фильтры «Каталога декоров» — Figma 1488:127314 (панель) и 1488:69674
// (та же панель с выбранными параметрами).
//
// Устройство то же, что у каталога (components/catalog-listing.js и
// SOLUTIONS.md › «Filters: form + request seam»): шторка это одна <form>, имена
// полей — будущие параметры запроса, а всё применение идёт через единственный
// шов `applyDecorFilters()`. Разметка живёт в partials/decor-filters.html и в
// панели самой страницы; здесь только поведение.
//
// **Сетку шов сегодня не трогает.** У декоров в фикстуре нет признаков
// (структура/материал/цвет — их не назвал ни макет, ни данные), поэтому
// отфильтровать тридцать образцов на клиенте нечем: шов пишет параметры в
// адрес и обновляет панель, а состав сетки придёт с сервера. Когда бэк
// появится, тело `applyDecorFilters()` меняется на один fetch, разметка — нет.

const GROUPS = ["structure", "material", "color"];

export function initDecorFilters() {
  const drawer = document.querySelector("[data-filter-drawer]");
  const form = document.querySelector("[data-filter-form]");
  if (!drawer || !form) return;

  const grid = document.querySelector("[data-decors]");
  const badge = document.querySelector("[data-filter-badge]");
  const funnel = document.querySelector(".filter-funnel");
  const countEl = document.querySelector("[data-filter-count]");
  const chipRow = document.querySelector("[data-chips]");
  const chipTpl = document.querySelector("[data-decor-chip]");
  const colorOnly = document.querySelector("[data-decor-color-only]");

  // Состояние — ровно то, что в форме: { structure: [], material: [], color: [] }
  // плюс тумблер «Товары в этом цвете», у которого своего поля в форме нет.
  function readState() {
    const fd = new FormData(form);
    const state = {};
    for (const g of GROUPS) state[g] = fd.getAll(`${g}[]`);
    state.color_only = Boolean(colorOnly?.checked);
    return state;
  }

  // Строка запроса — то, что уйдёт на сервер, и то, что видно в адресе.
  function toParams(state) {
    const params = new URLSearchParams();
    for (const g of GROUPS) if (state[g].length) params.set(g, state[g].join(","));
    if (state.color_only) params.set("color_only", "1");
    return params;
  }

  // Подпись значения берём из самой формы — она и есть источник копии.
  function labelFor(group, value) {
    const input = form.querySelector(`input[name="${group}[]"][value="${value}"]`);
    return input?.closest("label")?.textContent.trim() || value;
  }

  // Ряд выбранных параметров: по чипсу на значение и «Очистить все» в конце.
  function syncChips(state) {
    const chips = [];
    for (const g of GROUPS) {
      for (const v of state[g]) {
        const chip = chipTpl.content.cloneNode(true).firstElementChild;
        chip.querySelector("[data-chip-label]").textContent = labelFor(g, v);
        chip.addEventListener("click", () => {
          const input = form.querySelector(`input[name="${g}[]"][value="${v}"]`);
          if (input) input.checked = false;
          applyDecorFilters();
        });
        chips.push(chip);
      }
    }
    if (chips.length) {
      const clear = chipTpl.content.cloneNode(true).firstElementChild;
      clear.classList.remove("catalog-chip--active");
      clear.classList.add("catalog-chip--dismiss");
      clear.querySelector("[data-chip-label]").textContent = "Очистить все";
      clear.addEventListener("click", clearAll);
      chips.push(clear);
    }
    chipRow.replaceChildren(...chips);
  }

  // Пилюли: у группы с выбором тёмная рамка и счётчик (752:63467).
  function syncPills(state) {
    for (const pill of document.querySelectorAll("[data-filter-pill]")) {
      const n = state[pill.dataset.filterPill].length;
      const el = pill.querySelector("[data-pill-count]");
      pill.classList.toggle("is-active", n > 0);
      el.textContent = n > 0 ? String(n) : "";
      el.classList.toggle("hidden", n === 0);
    }
  }

  // ШОВ. Вызывается на любое изменение фильтра, чипса и тумблера.
  function applyDecorFilters({ pushURL = true } = {}) {
    const state = readState();

    // --- место будущего запроса ------------------------------------------------
    //     const res = await fetch(`/dealer/decors?${params}`, { headers: … });
    //     grid.innerHTML = await res.text();
    // Пока сетка не меняется: признаков у образцов нет (см. шапку файла).
    const visible = grid ? grid.children.length : 0;
    // ---------------------------------------------------------------------------

    const activeGroups = GROUPS.filter((g) => state[g].length).length;

    countEl.textContent = String(visible);
    badge.textContent = String(activeGroups);
    badge.classList.toggle("hidden", activeGroups === 0);
    funnel.classList.toggle("is-active", activeGroups > 0);

    syncChips(state);
    syncPills(state);

    if (pushURL) {
      const qs = toParams(state).toString();
      history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    }
    return state;
  }

  // ---- шторка ----------------------------------------------------------------
  // Пилюля несёт группу, которую открывает (data-filter-open="color"); воронка
  // открывает без группы и просто прокручивает форму наверх.
  function openDrawer(section) {
    drawer.classList.add("is-open");
    document.body.classList.add("overflow-hidden");
    const target = section && form.querySelector(`[data-filter-section="${section}"]`);
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    else form.scrollTop = 0;
  }
  function closeDrawer() {
    drawer.classList.remove("is-open");
    document.body.classList.remove("overflow-hidden");
  }

  for (const b of document.querySelectorAll("[data-filter-open]")) {
    b.addEventListener("click", () => openDrawer(b.dataset.filterOpen || null));
  }
  drawer.querySelector("[data-filter-close]").addEventListener("click", closeDrawer);
  drawer.querySelector("[data-filter-dismiss]").addEventListener("click", closeDrawer);
  drawer.querySelector("[data-filter-apply]").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
  });

  form.addEventListener("change", () => applyDecorFilters());

  // «очистить» внутри <summary> не должно сворачивать <details>.
  for (const btn of drawer.querySelectorAll("[data-filter-clear-group]")) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const g = btn.dataset.filterClearGroup;
      form.querySelectorAll(`input[name="${g}[]"]`).forEach((i) => (i.checked = false));
      applyDecorFilters();
    });
  }

  function clearAll() {
    form.reset();
    applyDecorFilters();
  }
  drawer.querySelector("[data-filter-clear]").addEventListener("click", clearAll);

  colorOnly?.addEventListener("change", () => applyDecorFilters());

  // Гидратация из адреса — тем же швом, что и любое изменение.
  const params = new URLSearchParams(location.search);
  for (const g of GROUPS) {
    for (const v of (params.get(g) || "").split(",").filter(Boolean)) {
      const input = form.querySelector(`input[name="${g}[]"][value="${v}"]`);
      if (input) input.checked = true;
    }
  }
  if (colorOnly && params.get("color_only") === "1") colorOnly.checked = true;
  applyDecorFilters({ pushURL: false });
}
