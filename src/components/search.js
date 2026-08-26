// Site search — the query contract, the overlay, and the seams for server search.
//
// The markup is a real GET <form action="/search" name="q"> in both the header
// (partials/header.html) and the overlay (partials/search-overlay.html), so in
// the Blade build full search needs NO JavaScript to work at all: the form
// submits straight to the /search route. What this file adds is the designed
// overlay in front of that — Figma `search` 2337:156356 / 2338:101329 (desktop)
// and 2338:235809 / 2338:237972 (mobile) — plus the two seams the prototype
// can't get for free:
//
//   1. submit  — the prototype has no /search page, so don't navigate to a 404.
//                In Blade this handler is deleted and the plain GET takes over.
//   2. suggest — searchSuggest() is the ONE place a debounced
//                fetch('/search/suggest?q=…') drops in. Everything downstream
//                (hints, chips, result cards) renders from its return value and
//                doesn't change when that swap lands.
//
// See SOLUTIONS.md › "Filters: form + request seam" — same idea, applied to
// search: make the input real (form + name), hide the fake part behind one fn.
import { renderCarousel } from "./product-card.js";
import { initCarousel } from "./carousel.js";
import { SUGGESTIONS, CHIPS, RECOMMENDED, CATALOGUE } from "../data/search.js";

const MIN_QUERY = 2;
const DEBOUNCE = 200;

// ---- the request seam -------------------------------------------------------
// One call, three lists — exactly the shape a /search/suggest endpoint returns.
// Blade:
//   const res = await fetch(`/search/suggest?q=${encodeURIComponent(q)}`);
//   return res.json();
function searchSuggest(q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return { hints: [], chips: [], items: [] };
  const has = (s) => String(s).toLowerCase().includes(needle);
  return {
    hints: SUGGESTIONS.filter(has).slice(0, 5),
    chips: CHIPS.filter((c) => c.match.some((m) => m.startsWith(needle) || needle.startsWith(m))),
    items: CATALOGUE.filter((p) => has(p.title) || has(p.category?.label)),
  };
}

// The empty overlay's rail. A second seam, and a much simpler one: in Blade it
// is whatever the controller hands the view as `recommended`.
function searchRecommended() {
  return RECOMMENDED;
}

// Splits a suggestion around the matched run: the match keeps the primary ink,
// the rest goes muted (Figma writes it as two character styles on one text
// node, 2338:103937). textContent throughout — never innerHTML with a query.
function fillHint(span, label, q) {
  const i = label.toLowerCase().indexOf(q.trim().toLowerCase());
  span.replaceChildren();
  if (i < 0) {
    span.append(document.createTextNode(label));
    return;
  }
  const before = label.slice(0, i);
  const match = label.slice(i, i + q.trim().length);
  const after = label.slice(i + q.trim().length);
  if (before) span.append(document.createTextNode(before));
  const strong = document.createElement("span");
  strong.className = "text-text-primary";
  strong.textContent = match;
  span.append(strong);
  if (after) span.append(document.createTextNode(after));
}

export function initSearch(root = document) {
  const overlay = root.querySelector("[data-search-overlay]");
  const panel = overlay?.querySelector("[data-search-panel]");
  const input = overlay?.querySelector("[data-search-input]");
  if (!overlay || !panel || !input) return;

  const form = overlay.querySelector("[data-search-form]");
  const clearBtn = overlay.querySelector("[data-search-clear]");
  const hintsBox = overlay.querySelector("[data-search-hints]");
  const chipsBox = overlay.querySelector("[data-search-chips]");
  const emptyMsg = overlay.querySelector("[data-search-empty]");
  const rail = overlay.querySelector("[data-search-rail]");
  const track = rail.querySelector("[data-track]");
  const clone = (sel) => overlay.querySelector(sel).content.firstElementChild.cloneNode(true);

  // The rail is wired once; every state just refills its track.
  const carousel = initCarousel(rail);
  let lastFocused = null;

  const isOpen = () => !overlay.classList.contains("hidden");

  // Closing hands focus back to whatever opened the overlay — which is the very
  // field whose `focus` opens it. Without this flag the close × re-opened the
  // panel on the same click: hide → restore focus → focus handler → open again.
  // `.focus()` dispatches synchronously, so a plain flag closes the loop.
  let restoringFocus = false;

  function setOpen(open) {
    if (open) lastFocused = document.activeElement;
    overlay.classList.toggle("hidden", !open);
    document.documentElement.classList.toggle("overflow-hidden", open);
    if (open) {
      render(input.value);
      input.focus();
    } else {
      restoringFocus = true;
      lastFocused?.focus?.();
      restoringFocus = false;
    }
  }

  // ---- rendering ------------------------------------------------------------
  // Both states are one call: the panel's data-state carries every layout
  // difference (see partials/search-overlay.html), so this only fills lists.
  function render(q) {
    const query = q.trim();
    const active = query.length >= MIN_QUERY;
    panel.dataset.state = active ? "query" : "empty";
    clearBtn.classList.toggle("hidden", !query);

    const { hints, chips, items } = active
      ? searchSuggest(query)
      : { hints: [], chips: [], items: searchRecommended() };

    hintsBox.replaceChildren(
      ...hints.map((label) => {
        const row = clone("[data-search-hint]");
        fillHint(row.querySelector("span"), label, query);
        row.addEventListener("click", () => run(label));
        return row;
      })
    );

    chipsBox.replaceChildren(
      ...chips.map((c) => {
        const chip = clone("[data-search-chip]");
        chip.querySelector("[data-label]").textContent = c.label;
        chip.addEventListener("click", () => run(c.label));
        return chip;
      })
    );

    renderCarousel(track, items, { variant: "search" });
    // The empty state's mobile rail is the site's usual two-row 152px rail;
    // the query state is a grid, laid out by the track's own classes.
    track.classList.toggle("rail-2row", !active && items.length > 1);
    if (!active) track.style.setProperty("--cols", String(Math.ceil(items.length / 2)));
    emptyMsg.classList.toggle("hidden", items.length > 0);
    rail.classList.toggle("hidden", items.length === 0);
    carousel.reset();
  }

  // Running a suggestion or a chip is the same thing as typing it.
  function run(q) {
    input.value = q;
    render(q);
    input.focus();
  }

  // ---- wiring ---------------------------------------------------------------
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value;
    // Falling back below the threshold restores the recommendations at once;
    // only the request-shaped path is debounced.
    if (q.trim().length < MIN_QUERY) return render(q);
    timer = setTimeout(() => render(q), DEBOUNCE);
  });

  clearBtn.addEventListener("click", () => run(""));

  // SEAM 1 — full search submit.
  // Blade: remove this handler; the GET navigates to /search?q=…
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    render(input.value);
    // TODO(blade): drop the preventDefault above and let the GET through, or:
    //   window.location.href = `/search?q=${encodeURIComponent(input.value)}`;
  });

  overlay.querySelector("[data-search-close]").addEventListener("click", () => setOpen(false));
  overlay.querySelector("[data-search-scrim]").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (isOpen() && e.key === "Escape") setOpen(false);
  });

  // ---- entry points ---------------------------------------------------------
  // Every search field on the page opens the overlay instead of being typed
  // into: the desktop header's (partials/header.html) and the burger menu's
  // (partials/mobile-menu.html). The overlay carries the field the design draws,
  // so the page ones hand their value over and step aside.
  root.querySelectorAll("[data-search]").forEach((f) => {
    const field = f.querySelector('input[name="q"]');
    const open = (e) => {
      e.preventDefault();
      // focus and click both fire on the way in; and the focus the overlay
      // hands back on close must not count as a fresh one.
      if (isOpen() || restoringFocus) return;

      // A field inside the burger menu means the menu is on top of the overlay —
      // close it on the way through.
      f.closest("[data-mm-overlay]")?.querySelector("[data-mm-close]")?.click();
      if (field) input.value = field.value;
      setOpen(true);
    };
    f.addEventListener("submit", open);
    field?.addEventListener("focus", open);
    field?.addEventListener("click", open);
    // Планшетная шапка (2477:181419) даёт не поле, а иконку: [data-search] без
    // input — это просто кнопка, открывающая ту же панель.
    if (!field) f.addEventListener("click", open);
  });
}
