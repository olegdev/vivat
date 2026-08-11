// Alert band — Figma `alert` 882:107884. Structure is partials/alert.html;
// this is the dismiss behaviour only.
export function initAlert(root = document) {
  root.querySelectorAll("[data-alert]").forEach((band) => {
    band.querySelector("[data-alert-close]")?.addEventListener("click", () => band.remove());
  });
}
