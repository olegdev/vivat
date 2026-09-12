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

const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
};
const FLATTEN = argv.includes("--flatten") ? Number(opt("--flatten")) || 1 : 0;
const tabletId = opt("--tablet");
const positional = argv.filter(
  (a, i) => !a.startsWith("--") && argv[i - 1] !== "--tablet" && argv[i - 1] !== "--flatten"
);
const [page, desktopId, mobileId] = positional;
if (!page || !desktopId) {
  console.error(
    "usage: node scripts/audit-spacing.mjs <page> <desktop-id> [mobile-id] [--tablet <id>] [--flatten]\n" +
      "   e.g. node scripts/audit-spacing.mjs customer/catalog 759:60482 1997:267656\n" +
      "\n" +
      "  --tablet <id>  третья ширина, 768. Планшет нарисован не для всех страниц:\n" +
      "                 секция `tablet` 2483:247208 держит пять страничных фреймов.\n" +
      "  --flatten [N]  спуститься на N уровней внутрь фреймов (по умолчанию 1).\n" +
      "                 Нужно там, где макет прячет пол-страницы в один фрейм, а\n" +
      "                 разметка держит те же блоки плоским списком — PDP ровно\n" +
      "                 такая. Отчёт печатает число секций с обеих сторон: если оно\n" +
      "                 сильно расходится, это и есть повод попробовать флаг."
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

  // Drop the overlays. A page frame is a VERTICAL auto-layout with gap=0, so
  // its flow children tile: each starts where the last one ended. A child that
  // overlaps the previous one is positioned absolutely over the page — the
  // mobile frames carry two of those, `button+tab bar` and `nav-bar`, and
  // counting them as sections produced gaps of -377 and -3689.
  const flow = [];
  for (const c of children) {
    const prev = flow[flow.length - 1];
    if (prev && c.y < prev.y + prev.h - 1) continue;
    flow.push(c);
  }

  // `--flatten`: развернуть фрейм верхнего уровня в его детей. Группировка —
  // единственное, чем две стороны законно расходятся, и расходятся они в обе
  // стороны: каталог на 1440 прячет рельс «Популярные» в один фрейм `H2`, и
  // там разворачивать нечего (в разметке это тоже один блок), а PDP прячет в
  // такой же `H2` всю нижнюю половину страницы, где разметка держит шесть
  // отдельных секций. Автоматически это не решается — развернуть каталог
  // значило бы сломать то, что уже сходится, — поэтому флаг, а не эвристика.
  //
  // Разворачивается ТОЛЬКО вертикальная стопка. У горизонтального фрейма дети
  // лежат бок о бок, и «зазор» между ними по вертикали не значит ничего: на
  // PDP `media` — это колонка снимков и сводка рядом, и разворот выдавал -2041.
  const expand = (list, depth) =>
    depth === 0
      ? list
      : expand(
          list.flatMap((c) => {
            if (c.type === "INSTANCE" || c.stack?.mode !== "VERTICAL") return [c];
            const inner = (kids.get(c.id) ?? [])
              .filter((k) => !k.hidden && k.h > 0 && !isSpacer(k))
              .sort((a, b) => a.y - b.y);
            if (inner.length < 2) return [c];
            // Дети хранят координаты относительно родителя — поднимаем в
            // систему фрейма страницы, иначе зазоры считаются между разными
            // началами.
            return inner.map((k) => ({ ...k, y: c.y + k.y }));
          }),
          depth - 1
        );
  const level = expand(flow, FLATTEN);

  // Оверлеи отсекаются заново: разворот мог поднять наверх абсолютно
  // позиционированного ребёнка, которого фильтр выше не видел.
  const tiled = [];
  for (const c of level) {
    const prev = tiled[tiled.length - 1];
    if (prev && c.y < prev.y + prev.h - 1) continue;
    tiled.push(c);
  }

  return tiled.map((c) => {
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

    // Меряем по коробке, а НЕ по «чернилам». Симметрии с Figma тут нет и быть
    // не может: там снимается только явный экземпляр `spacing` — метка стыка,
    // поставленная дизайнером, — а внутренний отступ живёт в `padV` фрейма и
    // остаётся частью секции. Пробовал снимать паддинг и на стороне DOM, чтобы
    // поймать лид-ин, выраженный им (блок соцсетей): один случай починился,
    // семьдесят семь сломались — у крошек `py-4`, у заголовков `py-6`, и всё
    // это стало фантомным воздухом. Расхождение вида «в макете 96, у нас
    // ничего» и без того видно строкой; идти и смотреть, откуда оно, всё равно
    // человеку.
    // Перепроверено 13.09 на всех покупательских страницах с порогом «только
    // незакрашенные секции, паддинг от 32/40»: без снятия 35 расхождений,
    // с порогом 40 — 43, с 32 — 41. Лид-ин соцсетей чинится, но `pagination`
    // макета несёт свои 64 как padV ЭКЗЕМПЛЯРА, и на его месте встаёт фантом.
    // Симметрии нет ни при каком пороге — оставлено как есть.
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

// ---- alignment ---------------------------------------------------------------
// Longest common subsequence over the gap VALUES, then a walk back that emits
// the two lists interleaved. Pairing by rank was the first attempt and it fails
// exactly where it matters: the PDP frame groups its whole lower half under one
// `H2` while the page keeps twelve flat sections, so one extra joint on either
// side re-paired every row below it and reported three defects that were only
// misalignment. LCS turns that into what it is — a row present on one side and
// missing on the other.
function align(a, b) {
  const n = a.length;
  const m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = a[i].gap === b[j].gap ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);

  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].gap === b[j].gap) out.push([a[i++], b[j++]]);
    else if (L[i + 1][j] >= L[i][j + 1]) out.push([a[i++], null]);
    else out.push([null, b[j++]]);
  }
  while (i < n) out.push([a[i++], null]);
  while (j < m) out.push([null, b[j++]]);
  return out;
}

// ---- report ------------------------------------------------------------------
const browser = await chromium.launch();
let mismatched = 0;

for (const [width, figId] of [[1440, desktopId], [768, tabletId], [390, mobileId]]) {
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

  for (const [f, d] of align(figAir, domAir)) {
    const ok = f && d;
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
