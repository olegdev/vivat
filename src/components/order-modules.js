// Модули строки заказа — the комплектация behind «Редактировать модули» on the
// dealer order page (Figma card `condition=edit` 953:152360 on 1440, the sheet
// 2225:201034 on 360).
//
// Structure is HTML: the row is the <template> in partials/order-modules.html
// and the sheet is that partial's static shell. This file clones and wires.
//
// THE SEAM. Quantities go through `commit(line)`, exactly like the cart's, so
// the Blade build swaps a request in and nothing else changes:
//
//     await fetch(`/cart/${line.id}/modules`, { method: "PATCH", … });
//
// One list per line is rendered into the card on 1440; below `md` the same
// rows are moved into the sheet, because the frames show one list, not two.
const isMobile = () => window.matchMedia("(max-width: 47.99rem)").matches;

export function initOrderModules(root, { lines, money, onChange } = {}) {
  const tpl = document.querySelector("[data-module-row]");
  const sheet = document.querySelector("[data-modules-sheet]");
  if (!root || !tpl) return null;

  const sheetList = sheet?.querySelector("[data-modules-sheet-list]");
  const sheetTitle = sheet?.querySelector("[data-modules-title]");
  const byId = new Map(lines.map((l) => [l.id, l]));
  let openLine = null;

  const rowsOf = (line) =>
    line.modules.map((mod) => {
      const node = tpl.content.cloneNode(true).firstElementChild;
      node.dataset.moduleId = mod.id;
      node.querySelector("[data-module-title]").textContent = mod.title;
      paint(node, mod);
      return node;
    });

  // The frame prints the module's own price against its count, not the two
  // multiplied (953:152844: «4» next to «12 080₽», «5» next to «3 100₽»).
  function paint(node, mod) {
    node.querySelector("[data-module-qty]").textContent = String(mod.qty);
    node.querySelector("[data-module-price]").textContent = money(mod.price);
  }

  // ---- the card's own list (1440) -----------------------------------------
  function fill(card, line) {
    const list = card.querySelector("[data-line-modules-list]");
    if (list) list.replaceChildren(...rowsOf(line));
  }

  function toggleCard(card, on) {
    const list = card.querySelector("[data-line-modules-list]");
    const toggle = card.querySelector("[data-line-modules][aria-expanded]");
    list?.classList.toggle("hidden", !on);
    list?.classList.toggle("flex", on);
    toggle?.setAttribute("aria-expanded", String(on));
    card.querySelector("[data-line-modules-chevron]")?.classList.toggle("rotate-180", on);
  }

  // ---- the sheet (360) -----------------------------------------------------
  function openSheet(line) {
    if (!sheet) return;
    openLine = line;
    sheetTitle.textContent = line.title;
    sheetList.replaceChildren(...rowsOf(line));
    sheet.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  }

  function closeSheet() {
    if (!sheet) return;
    openLine = null;
    sheet.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  // ---- events --------------------------------------------------------------
  // Delegated on the page, so lines re-rendered by the cart stay wired.
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-line-modules]");
    if (!btn) return;
    const card = btn.closest("[data-cart-line]");
    const line = byId.get(card?.dataset.lineId);
    if (!line?.modules?.length) return;

    if (isMobile()) return openSheet(line);

    const open = card.querySelector("[data-line-modules-list]")?.classList.contains("hidden");
    if (open) fill(card, line);
    toggleCard(card, open);
  });

  // Steppers, wherever the row happens to be — inside a card or in the sheet.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-module-up], [data-module-down]");
    if (!btn) return;
    const node = btn.closest("[data-module-line]");
    const line = openLine ?? byId.get(node.closest("[data-cart-line]")?.dataset.lineId);
    const mod = line?.modules.find((m) => m.id === node.dataset.moduleId);
    if (!mod) return;

    if (btn.hasAttribute("data-module-up")) mod.qty += 1;
    else if (mod.qty > 1) mod.qty -= 1;
    else return;

    paint(node, mod);
    commit(line);
  });

  sheet?.addEventListener("click", (e) => {
    if (e.target.closest("[data-modules-close], [data-modules-apply]")) closeSheet();
  });

  // THE SEAM — see the note at the top of the file.
  function commit(line) {
    onChange?.(line);
  }

  // The frame draws one card already expanded, so the page names it; below `md`
  // nothing is open — the sheet is a deliberate act.
  function expand(lineId) {
    const line = byId.get(lineId);
    const card = line?.modules?.length && root.querySelector(`[data-cart-line][data-line-id="${lineId}"]`);
    if (!card || isMobile()) return;
    fill(card, line);
    toggleCard(card, true);
  }

  return { expand, closeSheet };
}
