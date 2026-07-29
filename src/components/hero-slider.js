// Hero slider (top of customer/Main). Data-driven, so adding slides is just
// pushing to the array. Each slide's background can be a video or an image.
// Behaviour: prev/next arrows, clickable dots, drag/swipe, keyboard arrows, and
// it only plays the active slide's <video>.
//
// Deliberately NOT auto-advancing. The Figma banner (607:29214 / 1821:327006)
// carries no prototype interactions at all — the rotation that used to live
// here was invented, and it moved the slide out from under people mid-read.

// The markup is a set of clean HTML <template>s in partials/hero.html (the
// future Blade partial); this file only clones, fills and wires them.
const clone = (sel) => document.querySelector(sel).content.cloneNode(true);

// `frame` reproduces the Figma media box verbatim (left/top/width/height inside
// the 1440x640 banner), the same pattern the category tiles use. Without it the
// media just covers the slide.
function buildSlideMedia(s) {
  const el = clone(s.video ? "[data-hero-video]" : "[data-hero-img]").firstElementChild;
  el.src = s.video || s.image;

  if (s.frame) {
    el.className = "hero-media";
    el.style.cssText = `--l:${s.frame.left}px;--t:${s.frame.top}px;--w:${s.frame.width}px;--h:${s.frame.height}px`;
  } else {
    el.className = "absolute inset-0 size-full object-cover";
    el.style.objectPosition = s.objectPosition || "center";
  }

  if (s.video) {
    if (s.poster) el.poster = s.poster;
    // Muted is required for autoplay; sound is enabled on first user gesture
    // (see unlockSound below) so it matches the "video plays with sound" prototype.
    if (s.sound) el.setAttribute("data-sound", "");
  }
  return el;
}

function buildSlide(s, i) {
  const node = clone("[data-hero-slide]").firstElementChild;
  if (i === 0) node.classList.replace("opacity-0", "opacity-100");
  if (i === 0) node.classList.remove("pointer-events-none");

  const copy = node.querySelector("[data-hero-copy]");
  if (!s.title && !s.cta) copy.remove();
  else {
    // The only field carrying markup: the two hero lines are split by a <br>.
    node.querySelector("[data-hero-title]").innerHTML = s.title || "";

    if (s.subtitle) node.querySelector("[data-hero-subtitle]").textContent = s.subtitle;
    else node.querySelector("[data-hero-subtitle]").remove();

    if (s.cta) {
      const link = node.querySelector("[data-hero-cta]");
      link.href = s.cta.href || "#";
      node.querySelector("[data-hero-cta-label]").textContent = s.cta.label;
    } else {
      node.querySelector("[data-hero-cta-wrap]").remove();
    }
  }

  node.insertBefore(buildSlideMedia(s), node.firstChild);
  return node;
}

export function initHeroSlider(root, slides) {
  // `touch-pan-y` (on the section in the partial) is what makes the swipe work
  // on a phone: it leaves vertical panning to the browser but keeps horizontal
  // gestures for us. Without it the browser claims the gesture and fires
  // pointercancel, so the swipe wired here never completed on touch.
  const shell = clone("[data-hero-section]").firstElementChild;
  shell.querySelector("[data-track]").append(...slides.map(buildSlide));

  const dots = shell.querySelector("[data-dots]");
  slides.forEach((_, i) => {
    const dot = clone("[data-hero-dot]").firstElementChild;
    dot.dataset.dot = String(i);
    dot.setAttribute("aria-label", `Слайд ${i + 1}`);
    dot.setAttribute("aria-current", String(i === 0));
    dots.append(dot);
  });

  root.replaceChildren(shell);

  const slideEls = [...root.querySelectorAll("[data-slide]")];
  const dotEls = [...root.querySelectorAll("[data-dot]")];
  const videos = slideEls.map((el) => el.querySelector("video"));
  let index = 0;
  // Autoplay policy blocks sound until the user interacts. We flip this on the
  // first gesture, then keep the active [data-sound] video audible.
  let soundUnlocked = false;

  function applySound() {
    videos.forEach((v, i) => {
      if (!v || !v.hasAttribute("data-sound")) return;
      v.muted = !(soundUnlocked && i === index);
    });
  }

  function unlockSound() {
    if (soundUnlocked) return;
    soundUnlocked = true;
    applySound();
    const active = videos[index];
    if (active) active.play().catch(() => {});
  }
  ["pointerdown", "keydown", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, unlockSound, { once: true })
  );

  function playActiveVideo() {
    videos.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    applySound();
  }

  function show(i) {
    index = (i + slides.length) % slides.length;
    slideEls.forEach((el, n) => {
      const active = n === index;
      el.classList.toggle("opacity-100", active);
      el.classList.toggle("opacity-0", !active);
      el.classList.toggle("pointer-events-none", !active);
    });
    dotEls.forEach((d, n) => d.setAttribute("aria-current", String(n === index)));
    playActiveVideo();
  }

  const next = () => show(index + 1);
  const prev = () => show(index - 1);

  root.querySelector("[data-next]").addEventListener("click", next);
  root.querySelector("[data-prev]").addEventListener("click", prev);
  root.querySelectorAll("[data-dot]").forEach((btn) =>
    btn.addEventListener("click", () => show(Number(btn.dataset.dot)))
  );

  const section = root.querySelector("section");

  // keyboard (when the hero is hovered/focused)
  section.tabIndex = 0;
  section.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // Swipe / drag. The slide is committed on pointermove, as soon as the gesture
  // clears 50px, rather than waiting for pointerup: on touch the browser may
  // still cancel the pointer mid-swipe, and a release-only handler then never
  // fires. `spent` keeps one gesture to one slide.
  let startX = null;
  let spent = false;

  section.addEventListener("pointerdown", (e) => {
    // Let the controls handle their own clicks.
    if (e.target.closest("[data-prev],[data-next],[data-dot],a,button")) return;
    startX = e.clientX;
    spent = false;
    try {
      section.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  });

  section.addEventListener("pointermove", (e) => {
    if (startX === null || spent) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) < 50) return;
    spent = true;
    (dx < 0 ? next : prev)();
  });

  const endSwipe = (e) => {
    startX = null;
    try {
      section.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
  };
  section.addEventListener("pointerup", endSwipe);
  section.addEventListener("pointercancel", endSwipe);

  playActiveVideo();
}
