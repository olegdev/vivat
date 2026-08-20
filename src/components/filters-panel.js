// Панель фильтров без своей выдачи — «Каталог декоров» (1488:127314 и
// 1488:69674) и «Каталог 3D-моделей» (2338:254263).
//
// Устройство то же, что у каталога (components/catalog-listing.js и
// SOLUTIONS.md › «Filters: form + request seam»): шторка это одна <form>, имена
// полей — будущие параметры запроса, а всё применение идёт через единственный
// шов. Разметка живёт в партиале шторки и в панели самой страницы; здесь
// только поведение.
//
// **Сетку шов сегодня не трогает.** Ни у декоров, ни у 3D-моделей нет
// признаков, по которым карточку можно отобрать на клиенте: макет их не
// называет, в фикстурах их нет. Шов пишет параметры в адрес и обновляет
// панель, а состав выдачи придёт с сервера. Когда бэк появится, тело
// `apply()` меняется на один fetch, разметка — нет.
//
//   groups — имена групп-флажков, они же поля `name="<группа>[]"`;
//   price  — есть ли в шторке ценовая группа (два поля и радиокнопки).
//
// Ряд чипсов и шаблон чипса не обязательны: у декоров они есть (кадр рисует
// состояние выбранных параметров), у 3D-моделей их нет.

export function initFiltersPanel({ groups, price = false } = {}) {
  const GROUPS = groups;
  const drawer = document.querySelector("[data-filter-drawer]");
  const form = document.querySelector("[data-filter-form]");
  if (!drawer || !form) return;

  const grid = document.querySelector("[data-decors], [data-models]");
  const badge = document.querySelector("[data-filter-badge]");
  const funnel = document.querySelector(".filter-funnel");
  const countEl = document.querySelector("[data-filter-count]");
  // Ряд чипсов ищем по своему хуку: `data-chips` занят рядом сегментов у
  // карусели, и на странице с рельсом он нашёлся бы первым.
  const chipRow = document.querySelector("[data-filter-chips]");
  const chipTpl = document.querySelector("[data-decor-chip]");
  const colorOnly = document.querySelector("[data-decor-color-only]");

  // Состояние — ровно то, что в форме: { structure: [], material: [], color: [] }
  // плюс тумблер «Товары в этом цвете», у которого своего поля в форме нет.
  function readState() {
    const fd = new FormData(form);
    const state = {};
    for (const g of GROUPS) state[g] = fd.getAll(`${g}[]`);
    if (price) {
      state.price_min = (fd.get("price_min") || "").toString().replace(/\s/g, "");
      state.price_max = (fd.get("price_max") || "").toString().replace(/\s/g, "");
      state.price = fd.get("price") || "any";
    }
    state.color_only = Boolean(colorOnly?.checked);
    return state;
  }

  // Ценовая группа занята, если тронуты поля или выбран пресет.
  const priceOn = (state) =>
    price && (state.price !== "any" || !!state.price_min || !!state.price_max);

  // Строка запроса — то, что уйдёт на сервер, и то, что видно в адресе.
  function toParams(state) {
    const params = new URLSearchParams();
    for (const g of GROUPS) if (state[g].length) params.set(g, state[g].join(","));
    if (price) {
      if (state.price_min) params.set("price_min", state.price_min);
      if (state.price_max) params.set("price_max", state.price_max);
      if (state.price !== "any") params.set("price", state.price);
    }
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
    if (!chipRow || !chipTpl) return;
    const chips = [];
    for (const g of GROUPS) {
      for (const v of state[g]) {
        const chip = chipTpl.content.cloneNode(true).firstElementChild;
        chip.querySelector("[data-chip-label]").textContent = labelFor(g, v);
        chip.addEventListener("click", () => {
          const input = form.querySelector(`input[name="${g}[]"][value="${v}"]`);
          if (input) input.checked = false;
          apply();
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
      const group = pill.dataset.filterPill;
      const n = group === "price" ? Number(priceOn(state)) : state[group].length;
      const el = pill.querySelector("[data-pill-count]");
      pill.classList.toggle("is-active", n > 0);
      el.textContent = n > 0 ? String(n) : "";
      el.classList.toggle("hidden", n === 0);
    }
  }

  // ШОВ. Вызывается на любое изменение фильтра, чипса и тумблера.
  function apply({ pushURL = true } = {}) {
    const state = readState();

    // --- место будущего запроса ------------------------------------------------
    //     const res = await fetch(`${location.pathname}?${params}`, { headers: … });
    //     grid.innerHTML = await res.text();
    // Пока сетка не меняется: признаков у образцов нет (см. шапку файла).
    const visible = grid ? grid.children.length : 0;
    // ---------------------------------------------------------------------------

    const activeGroups = GROUPS.filter((g) => state[g].length).length + Number(priceOn(state));

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

  form.addEventListener("change", () => apply());

  // «очистить» внутри <summary> не должно сворачивать <details>.
  for (const btn of drawer.querySelectorAll("[data-filter-clear-group]")) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const g = btn.dataset.filterClearGroup;
      form.querySelectorAll(`input[name="${g}[]"]`).forEach((i) => (i.checked = false));
      apply();
    });
  }

  function clearAll() {
    form.reset();
    apply();
  }
  drawer.querySelector("[data-filter-clear]").addEventListener("click", clearAll);

  colorOnly?.addEventListener("change", () => apply());

  // Гидратация из адреса — тем же швом, что и любое изменение.
  const params = new URLSearchParams(location.search);
  for (const g of GROUPS) {
    for (const v of (params.get(g) || "").split(",").filter(Boolean)) {
      const input = form.querySelector(`input[name="${g}[]"][value="${v}"]`);
      if (input) input.checked = true;
    }
  }
  if (price) {
    for (const f of ["price_min", "price_max"]) {
      const input = form.querySelector(`input[name="${f}"]`);
      if (input && params.get(f)) input.value = params.get(f);
    }
    const preset = params.get("price");
    if (preset) {
      const radio = form.querySelector(`input[name="price"][value="${preset}"]`);
      if (radio) radio.checked = true;
    }
  }
  if (colorOnly && params.get("color_only") === "1") colorOnly.checked = true;
  apply({ pushURL: false });
}
