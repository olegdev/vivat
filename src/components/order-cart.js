// Корзина заказа — the cart panel and the «Ваш заказ» summary on the order page
// (Figma Order-step0 953:119640 / mobile 2029:126838).
//
// Structure is HTML: the line's markup is the <template> in
// partials/cart-card.html and the summary is a static shell in
// partials/order-summary.html. This file only clones, fills and wires — it
// never builds markup from strings.
//
// THE SEAM. Every mutation goes through one function, `commit()`, so the Blade
// build swaps a request in and nothing else here changes — the same method as
// the catalog filters (SOLUTIONS.md › "Filters: form + request seam") and
// components/cart.js:
//
//     const res = await fetch("/cart", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": … },
//       body: JSON.stringify({ lines: state.map(({ id, qty, selected }) => …) }),
//     });
//     paint((await res.json()).lines);   // server owns quantities and totals
const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

const money = (n) => `${n.toLocaleString("ru-RU").replace(/ /g, " ")}₽`;

// "1 товар / 3 товара / 7 товаров"
function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function initOrderCart(root, { lines, iconBase = "../../assets/order" } = {}) {
  if (!root) return null;

  const listEl = root.querySelector("[data-cart-list]");
  const emptyEl = root.querySelector("[data-cart-empty]");
  const selectAll = root.querySelector("[data-select-all]");
  const state = lines.map((l) => ({ ...l, qty: l.qty ?? 1, selected: l.selected !== false }));

  // ---- summary ------------------------------------------------------------
  // The design's placeholder figures don't reconcile (50 795 − 1 095 ≠ 43 335),
  // so the arithmetic is done honestly against the labels: «Сумма заказа» is
  // the pre-discount total, «Скидка» what the old prices give back, «Итого»
  // the difference. Only selected lines count.
  function paintSummary() {
    const picked = state.filter((l) => l.selected);
    const count = picked.reduce((n, l) => n + l.qty, 0);
    const subtotal = picked.reduce((s, l) => s + (l.oldPrice || l.price) * l.qty, 0);
    const total = picked.reduce((s, l) => s + l.price * l.qty, 0);

    const put = (hook, text) =>
      root.querySelectorAll(`[data-summary-${hook}]`).forEach((el) => (el.textContent = text));

    put("count", plural(count, "товар", "товара", "товаров"));
    put("subtotal", money(subtotal));
    put("discount", money(subtotal - total));
    put("total", money(total));

    const submit = root.querySelectorAll("[data-order-submit]");
    submit.forEach((b) => (b.disabled = count === 0));
  }

  // ---- one line -----------------------------------------------------------
  function buildLine(line) {
    const node = clone("[data-cart-card]").firstElementChild;
    node.dataset.lineId = line.id;

    const img = node.querySelector("[data-line-image]");
    img.src = line.image;
    img.alt = line.title;
    node.querySelector("[data-line-title]").textContent = line.title;
    node.querySelector("[data-line-specs]").textContent = line.specs;
    node.querySelector("[data-line-color]").textContent = line.color;
    node.querySelector("[data-line-select]").checked = line.selected;
    paintLine(node, line);
    return node;
  }

  // Quantity, prices and the stepper's left icon. The `quantity-stepper`
  // component switches that icon on its own `count` axis — trash at 1
  // (943:79876), minus at 2 and more (2029:129546).
  function paintLine(node, line) {
    node.querySelector("[data-line-qty]").textContent = String(line.qty);
    node.querySelector("[data-line-price]").textContent = money(line.price * line.qty);
    node.querySelector("[data-line-oldprice]").textContent = line.oldPrice
      ? money(line.oldPrice * line.qty)
      : "";

    const down = node.querySelector("[data-step-down-icon]");
    const isLast = line.qty <= 1;
    down.src = `${iconBase}/${isLast ? "icon-trash" : "icon-minus"}.svg`;
    down.alt = isLast ? "Удалить из заказа" : "Уменьшить количество";
    node.querySelector("[data-step-up-icon]").src = `${iconBase}/icon-plus.svg`;
  }

  function render() {
    listEl.replaceChildren(...state.map(buildLine));
    emptyEl?.classList.toggle("hidden", state.length > 0);
    commit();
  }

  // THE SEAM — see the note at the top of the file.
  function commit() {
    if (selectAll) {
      selectAll.checked = state.length > 0 && state.every((l) => l.selected);
      selectAll.indeterminate = state.some((l) => l.selected) && !selectAll.checked;
    }
    paintSummary();
  }

  const lineOf = (el) => {
    const node = el.closest("[data-cart-line]");
    return node ? [node, state.find((l) => l.id === node.dataset.lineId)] : [];
  };

  const drop = (id) => {
    const i = state.findIndex((l) => l.id === id);
    if (i >= 0) state.splice(i, 1);
    render();
  };

  // ---- events (delegated, so re-rendered lines stay wired) ----------------
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step-up], [data-step-down]");
    if (!btn) return;
    const [node, line] = lineOf(btn);
    if (!line) return;

    if (btn.hasAttribute("data-step-up")) line.qty += 1;
    else if (line.qty > 1) line.qty -= 1;
    else return drop(line.id); // the trash state removes the line

    paintLine(node, line);
    commit();
  });

  listEl.addEventListener("change", (e) => {
    if (!e.target.matches("[data-line-select]")) return;
    const [, line] = lineOf(e.target);
    if (line) line.selected = e.target.checked;
    commit();
  });

  selectAll?.addEventListener("change", () => {
    state.forEach((l) => (l.selected = selectAll.checked));
    listEl.querySelectorAll("[data-line-select]").forEach((c) => (c.checked = selectAll.checked));
    commit();
  });

  root.querySelector("[data-delete-selected]")?.addEventListener("click", () => {
    for (let i = state.length - 1; i >= 0; i -= 1) if (state[i].selected) state.splice(i, 1);
    render();
  });

  // «Очистить корзину» — the dealer summary's link under the button
  // (953:151749); the customer panel has no such control.
  root.querySelector("[data-cart-clear]")?.addEventListener("click", () => {
    state.length = 0;
    render();
  });

  root.querySelector("[data-order-print]")?.addEventListener("click", () => window.print());

  render();
  return { state, commit, render };
}

// The mobile CTA bar is revealed by scroll, not always on: the frame showing
// the summary's own button (2084:145507) has no bar, the one scrolled above it
// (2029:126838) does. Mirror that by watching the button.
export function initOrderBar(root) {
  const bar = root.querySelector("[data-order-bar]");
  const anchor = root.querySelector("[data-order-summary] [data-order-submit]");
  if (!bar || !anchor) return;

  const show = (on) => {
    bar.hidden = !on;
    // `hidden` must clear before the opacity transition can run.
    requestAnimationFrame(() => bar.classList.toggle("opacity-0", !on));
  };

  new IntersectionObserver(
    ([entry]) => show(!entry.isIntersecting),
    { rootMargin: "0px 0px -132px 0px" },
  ).observe(anchor);
}
