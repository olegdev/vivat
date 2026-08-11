// Dealer strip in the site header — Figma `header-dealer` 586:57343
// (property-1=variant2). Structure is partials/header.html; this file is only
// behaviour, per the Blade rule in CLAUDE.md.
//
// Two controls:
//   • "Показывать цену" — a switch. The design carries no prototype on it, so
//     it only reflects its own state; see docs/FIGMA-MAP.md › вопросы before
//     wiring it to anything.
//   • the price-list dropdown (`dropdown-header` 607:26932).

const ITEM_CLASS =
  "flex h-11 w-full items-center px-3 text-left text-body-n text-text-primary hover:bg-components-subtle-hover aria-selected:bg-components-subtle";

function initPriceToggle(root) {
  const btn = root.querySelector("[data-dealer-price-toggle]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-checked") === "true";
    btn.setAttribute("aria-checked", String(!on));
    // The seam: the page decides what "hide prices" means once the client
    // confirms it. Until then this event is the only side effect.
    root.dispatchEvent(
      new CustomEvent("dealer:price-visibility", { detail: { visible: !on }, bubbles: true })
    );
  });
}

function initPriceList(root, lists) {
  const wrap = root.querySelector("[data-dealer-pricelist]");
  if (!wrap || !lists?.length) return;

  const trigger = wrap.querySelector("button");
  const label = wrap.querySelector("[data-dealer-pricelist-label]");
  const menu = wrap.querySelector("[data-dealer-pricelist-menu]");

  const close = () => {
    menu.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
  };

  menu.replaceChildren(
    ...lists.map((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.role = "option";
      b.className = ITEM_CLASS;
      b.textContent = l.label;
      b.setAttribute("aria-selected", String(Boolean(l.selected)));
      b.addEventListener("click", () => {
        menu.querySelectorAll("[role=option]").forEach((o) => o.setAttribute("aria-selected", "false"));
        b.setAttribute("aria-selected", "true");
        label.textContent = l.label;
        close();
        root.dispatchEvent(
          new CustomEvent("dealer:price-list", { detail: { id: l.id }, bubbles: true })
        );
      });
      return b;
    })
  );

  const selected = lists.find((l) => l.selected);
  if (selected) label.textContent = selected.label;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle("hidden") === false;
    trigger.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

export function initDealerHeader(root = document, { priceLists } = {}) {
  initPriceToggle(root);
  initPriceList(root, priceLists);
}
