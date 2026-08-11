// Dealer strip in the site header — Figma `header-dealer` 586:57343
// (property-1=variant2). Structure is partials/header.html; this file is only
// behaviour, per the Blade rule in CLAUDE.md.
//
// Two controls:
//   • "Показывать цену" — a switch. The design carries no prototype on it, so
//     it only reflects its own state; see docs/FIGMA-MAP.md › вопросы before
//     wiring it to anything.
// The price-list trigger next to it is markup only: the instance renders just
// the trigger, and the export carries no prototype data, so what it opens is
// unknown. Nothing is wired to it on purpose — see BACKLOG.md.

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

export function initDealerHeader(root = document) {
  initPriceToggle(root);
}
