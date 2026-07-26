// Demo photo pools — placeholder scaffolding, not part of the design.
//
// The prototype's fixtures carry one photo per product, so every card's gallery
// used to be the same image repeated three times and the dots (and now the hover
// scrub) had nothing to show. demoGallery() pads a product out to three frames
// from the photos the asset set actually has, staying inside the product's own
// category: a kitchen card never shows a worktop, an accessory card never shows
// a kitchen.
//
// In the Blade build this file goes away — each model supplies its own `images`
// and buildCard() takes the `p.images` branch it already has.
//
// Paths are relative to the including page; every customer page sits at
// src/pages/customer/, so `../../assets/...` is uniform (same rule as partials).
const HOME = "../../assets/home";
const PDP = "../../assets/pdp";

// Kitchens, in the order a gallery walks them: four coloured runs, then the
// white kitchen's general view, its interior, and one close-up detail.
const KITCHEN_VIEWS = [
  `${HOME}/prod-mod-1-src.png`,
  `${HOME}/prod-mod-2-src.png`,
  `${HOME}/prod-mod-3-src.png`,
  `${HOME}/prod-mod-4-src.png`,
  `${PDP}/photo-1-src.png`,
  `${PDP}/photo-3-src.png`,
  `${PDP}/photo-2-src.png`,
];

// Everything sold alongside a kitchen: worktop, oven, plinth.
const ACCESSORY_VIEWS = [
  `${HOME}/prod-pop-1-src.png`,
  `${HOME}/prod-pop-2-src.png`,
  `${HOME}/prod-pop-3-src.png`,
];

// pdp/kitchen-N is the same render as home/prod-mod-N under a second name — fold
// them together so a gallery can't show one photo twice.
const ALIAS = {
  "kitchen-1-src.png": "prod-mod-1-src.png",
  "kitchen-2-src.png": "prod-mod-2-src.png",
  "kitchen-3-src.png": "prod-mod-3-src.png",
};
const key = (src) => {
  const file = String(src).split("/").pop();
  return ALIAS[file] || file;
};

export function demoGallery(image, frames = 3) {
  if (!image) return [];
  const inPool = (pool) => pool.some((v) => key(v) === key(image));
  const pool = inPool(ACCESSORY_VIEWS) ? ACCESSORY_VIEWS : KITCHEN_VIEWS;
  const start = Math.max(
    pool.findIndex((v) => key(v) === key(image)),
    0
  );

  // Walk on from the product's own photo, so neighbouring cards don't all show
  // the same second frame.
  const out = [image];
  for (let i = 1; i <= pool.length && out.length < frames; i++) {
    const next = pool[(start + i) % pool.length];
    if (key(next) !== key(image)) out.push(next);
  }
  return out;
}
