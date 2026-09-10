// Ordered geometry diff: the vertical rhythm a Figma frame draws vs the one the
// built page renders. The text twin of this is `scripts/audit.mjs`.
//
//   node scripts/audit-spacing.mjs <page> <desktop-id> [mobile-id]
//   node scripts/audit-spacing.mjs customer/catalog 759:60482 1997:267656
//
// Why: `npm run audit` compares copy and nothing compares geometry, so every
// joint between two sections was picked by eye. The design does have a scale —
// 201 instances of a component literally named `spacing`, every value a
// multiple of 4 — and the page has 45 hand-written spacer divs in 22 different
// spellings. This puts the two side by side.
//
// The one thing that makes the comparison possible: BOTH sides are reduced to
// the same quantity — the air between the INK of consecutive top-level
// sections.
//
//   • Figma stacks page sections with gap=0 and puts the air INSIDE a section,
//     as a trailing `spacing` instance. So a section's ink bottom is its box
//     bottom minus that trailing spacer.
//   • The page puts the air BETWEEN sections, as an empty <div class="h-20">.
//     So a spacer element is not a section at all; it is the gap, and dropping
//     it from the section list makes `next.top - prev.bottom` mean the same
//     thing as on the Figma side.
//
// Only joints that carry air are reported, and rows are matched BY ORDER among
// those — like the text audit, and for the same reason: no name is shared
// between the .fig and the markup.
//
// Dropping the zero gaps is not cosmetic. A zero says "these two boxes touch",
// which is true on both sides however the frame groups its layers — and that
// grouping is exactly where the two sides legitimately differ: the 1440 catalog
// wraps the Популярные region in an `H2` frame, the 360 catalog leaves the same
// parts loose at the top level. Compared row for row, that alone shifted every
// line below it and produced four phantom mismatches. Compared on air only,
// both come out as one joint and the real defect showed up on the first run:
// the design puts 80 between the rail and the green band at 360, the page had
// `max-md:h-8` = 32.
//
// The residual risk of matching on rank: if the design has air at joint A where
// the page has none, the page's next joint pairs with A and both rows read
// wrong. The labels are printed for that — they name both sides, so a bad pair
// is visible. A section present on one side only shifts the rows the same way.
// This prints a report to be read, not just a verdict.
//
// Known blind spot: a section that is itself an INSTANCE has no children in the
// file (see CLAUDE.md › "An INSTANCE is not its master"), so its trailing
// spacer cannot be trimmed and its ink bottom is reported as the box bottom,
// marked `~` in the output. Air inside a component is the component's own
// business anyway — it is identical wherever the component is mounted, and its
// code twin lives inside the partial, not at the call site.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [page, desktopId, mobileId] = process.argv.slice(2);
if (!page || !desktopId) {
  console.error(
    "usage: node scripts/audit-spacing.mjs <page> <desktop-id> [mobile-id]\n" +
      "   e.g. node scripts/audit-spacing.mjs customer/catalog 759:60482 1997:267656"
  );
  process.exit(1);
}

// ---- Figma side --------------------------------------------------------------
const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json", "utf8"));
const kids = new Map();
const byId = new Map();
for (const n of idx.nodes) if (n.id) byId.set(n.id, n);
for (const n of idx.nodes) {
  if (!n.parent) continue;
  if (!kids.has(n.parent)) kids.set(n.parent, []);
  kids.get(n.parent).push(n);
}
for (const a of kids.values()) a.sort((x, y) => String(x.order).localeCompare(String(y.order)));

const isSpacer = (n) => n.name === "spacing";
const norm = (id) => id.replace("-", ":");

// Sections of a page frame: its direct children, in visual order. Hidden ones
// are dropped — `hidden` is the node's OWN flag and these are frames, not
// instances, so it is trustworthy here.
function figSections(frameId) {
  const frame = byId.get(frameId);
  if (!frame) {
    console.error(`нет такого узла в экспорте: ${frameId}`);
    process.exit(1);
  }
  const children = (kids.get(frameId) ?? [])
    .filter((c) => !c.hidden && c.h != null && c.h > 0)
    .sort((a, b) => a.y - b.y)
    // A `spacing` sitting among the sections IS the joint, exactly like the
    // page's empty <div class="h-20">. Dropping it here is what makes
    // `next.top - prev.bottom` come out as its height instead of as 0. The
    // mobile frames need this: where the 1440 frame wraps a rail region in an
    // `H2` frame with the spacer inside, the 360 frame leaves both loose.
    .filter((c) => !isSpacer(c));

  return children.map((c) => {
    const top = c.y;
    const bottom = c.y + c.h;
    // Trim the section's own leading/trailing `spacing` — that air belongs to
    // the joint, not to the section. Only possible when the section is a real
    // frame; an INSTANCE hides its children.
    const inner = c.type === "INSTANCE" ? [] : (kids.get(c.id) ?? []).filter((k) => !k.hidden && k.h > 0);
    inner.sort((a, b) => a.y - b.y);
    let inkTop = top;
    let inkBottom = bottom;
    let exact = c.type !== "INSTANCE";
    if (inner.length) {
      const first = inner[0];
      const last = inner[inner.length - 1];
      if (isSpacer(first)) inkTop = top + first.y + first.h;
      if (isSpacer(last)) inkBottom = top + last.y;
    }
    return { label: c.name ?? c.type, type: c.type, inkTop, inkBottom, exact };
  });
}

const figGaps = (secs) =>
  secs.slice(1).map((s, i) => ({
    from: secs[i].label,
    to: s.label,
    gap: Math.round(s.inkTop - secs[i].inkBottom),
    exact: secs[i].exact,
  }));

// ---- DOM side ----------------------------------------------------------------
async function domGaps(browser, width) {
  const p = await browser.newPage({ viewport: { width, height: 1000 } });
  await p.goto(`file://${resolve("dist/pages", page)}.html`, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const out = await p.evaluate(() => {
    const root = document.querySelector("body > div");
    if (!root) return null;

    const inFlow = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      // Overlays, drawers and the search panel are painted outside the flow and
      // contribute no vertical rhythm.
      return cs.position === "static" || cs.position === "relative" || cs.position === "sticky";
    };
    // A spacer is an element with height and no ink of its own: no text, no
    // media, no background. It IS the gap, so it must not count as a section.
    const isSpacer = (el) => {
      if (el.textContent.trim()) return false;
      if (el.querySelector("img, svg, video, canvas, iframe, input, button")) return false;
      const cs = getComputedStyle(el);
      const painted =
        cs.backgroundImage !== "none" ||
        !/^rgba\(0, 0, 0, 0\)$|^transparent$/.test(cs.backgroundColor) ||
        parseFloat(cs.borderTopWidth) > 0 ||
        parseFloat(cs.borderBottomWidth) > 0;
      return !painted;
    };
    const label = (el) => {
      const ds = el.getAttribute("data-section");
      if (ds) return `[${ds}]`;
      const h = el.querySelector("h1, h2, h3");
      const t = h?.textContent.replace(/\s+/g, " ").trim();
      const tag = el.tagName.toLowerCase();
      if (t) return `${tag} «${t.slice(0, 26)}»`;
      const cls = (el.className || "").toString().split(/\s+/)[0];
      return cls ? `${tag}.${cls}` : tag;
    };

    const secs = [];
    for (const el of root.children) {
      if (!(el instanceof HTMLElement)) continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 0 || !inFlow(el)) continue;
      if (isSpacer(el)) continue; // it is the air, not a section
      secs.push({ label: label(el), top: r.top + scrollY, bottom: r.bottom + scrollY });
    }
    return secs.slice(1).map((s, i) => ({
      from: secs[i].label,
      to: s.label,
      gap: Math.round(s.top - secs[i].bottom),
    }));
  });
  await p.close();
  return out;
}

// ---- report ------------------------------------------------------------------
const browser = await chromium.launch();
let mismatched = 0;

for (const [width, figId] of [[1440, desktopId], [390, mobileId]]) {
  if (!figId) continue;
  const fig = figGaps(figSections(norm(figId)));
  const dom = await domGaps(browser, width);
  if (dom === null) {
    console.error(`не нашёл обёртку тела (body > div) на ${page}`);
    process.exit(1);
  }

  // Only joints that carry air. A zero gap says "these two boxes touch", which
  // is true on both sides no matter how the frame groups its layers — and that
  // grouping is where the two sides legitimately differ (the 1440 catalog wraps
  // the Популярные region in an `H2` frame; the 360 one leaves its parts loose).
  // Filtering to non-zero makes the report independent of it, and drops ~80% of
  // the rows, all of them noise.
  const figAir = fig.filter((g) => g.gap !== 0);
  const domAir = dom.filter((g) => g.gap !== 0);

  console.log(`\n\n  ══ ${page} @ ${width}  ←→  ${figId}`);
  console.log(`  ${"МАКЕТ: стык".padEnd(44)} ${"px".padStart(5)}   ${"px".padStart(5)}  СТРАНИЦА: стык`);
  console.log(`  ${"—".repeat(44)} ${"—".repeat(5)}   ${"—".repeat(5)}  ${"—".repeat(44)}`);

  for (let i = 0; i < Math.max(figAir.length, domAir.length); i++) {
    const f = figAir[i];
    const d = domAir[i];
    const ok = f && d && f.gap === d.gap;
    if (!ok) mismatched++;
    const fl = f ? `${f.from} → ${f.to}`.slice(0, 43) : "—";
    const dl = d ? `${d.from} → ${d.to}`.slice(0, 43) : "—";
    const fg = f ? `${f.gap}${f.exact ? "" : "~"}` : "";
    const dg = d ? String(d.gap) : "";
    console.log(`${ok ? "  " : "✗ "}${fl.padEnd(44)} ${fg.padStart(5)}   ${dg.padStart(5)}  ${dl}`);
  }
  console.log(
    `\n  секций в макете ${fig.length + 1}, на странице ${dom.length + 1};` +
      ` стыков с воздухом ${figAir.length} и ${domAir.length}`
  );
}

await browser.close();
console.log(
  `\n  расхождений ${mismatched}` +
    (mismatched ? "\n  «~» — секция-INSTANCE, хвостовая распорка не отделена; сверить вручную\n" : "\n")
);
process.exit(mismatched ? 1 : 0);
