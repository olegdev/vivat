// Header search — the query contract + the seams for server search.
//
// The markup (partials/header.html) is a real GET <form action="/search"
// name="q">, so in the Blade build full search needs NO JavaScript: the form
// submits straight to the /search route. This file only adds the two things the
// static prototype can't get for free — and both are marked as seams:
//
//   1. submit  — the prototype has no /search page, so don't navigate to a 404.
//                In Blade this handler is deleted and the plain GET takes over.
//   2. suggest — autocomplete. No dropdown is designed yet (nothing in Figma),
//                so this is a stub: it's the single place a debounced
//                fetch('/search/suggest?q=…') + results dropdown will drop in.
//
// See SOLUTIONS.md › "Filters: form + request seam" — same idea, applied to
// search: make the input real (form + name), hide the fake part behind one fn.
export function initSearch(root = document) {
  const form = root.querySelector("[data-search]");
  if (!form) return;
  const input = form.querySelector('input[name="q"]');
  if (!input) return;

  // SEAM 1 — full search submit.
  // Blade: remove this handler; the GET navigates to /search?q=…
  // Prototype: no results page exists, so keep it on the current page.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    // TODO(blade): drop the preventDefault above and let the GET through, or:
    //   window.location.href = `/search?q=${encodeURIComponent(q)}`;
  });

  // SEAM 2 — autocomplete suggestions (debounced).
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) return;
    timer = setTimeout(() => suggest(q), 200);
  });
}

// The autocomplete request seam. Wire it up when there's a designed dropdown:
//   const res = await fetch(`/search/suggest?q=${encodeURIComponent(q)}`);
//   renderSuggestions(await res.json());
function suggest(q) {
  void q; // stub — no designed suggestions UI yet
}
