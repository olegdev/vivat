// Ordered typography diff: the kegel, leading and weight a Figma INSTANCE
// renders vs what the page renders. Third of the family, after
// `audit.mjs` (copy) and `audit-spacing.mjs` (vertical rhythm).
//
//   node scripts/audit-type.mjs <page> <selector> <figma-id> [--width 1440]
//   node scripts/audit-type.mjs customer/main '[data-section="popular"]' 2395:105896
//
// Why a third script rather than a flag on one of the others: the three audits
// pair different things. Spacing pairs SECTIONS, and pairs them by order.
// Copy and type pair STRINGS — and that pairing is already solved in
// `audit.mjs`: walk the master subtree in visual order, apply the instance's
// `symbolOverrides`, and a node renders when it participates in
// `derivedSymbolData`. This reuses that walk and hangs the metrics off it.
//
// Where the numbers come from, and why the instance is the only source that can
// be trusted:
//
//   • FONT SIZE comes from `derivedSymbolData` → `derivedTextData.glyphs[0]
//     .fontSize` — the size Figma actually laid the glyphs out at. The index
//     carries the MASTER's `fontSize`, and the master is routinely contradicted:
//     the socials heading is 20 in the master and 24 in the instance, which is
//     exactly the defect this audit exists to catch. Master size is used only
//     when a node is not inside an instance at all.
//
//   • LEADING is derived, not read. `derivedTextData.baselines` holds one entry
//     per rendered line, so `box height / line count` is the real line box.
//     (`baselines[].lineHeight` is the FONT's natural leading, not the styled
//     one — 30.6 where the style says 28. Do not use it.)
//
//   • WEIGHT is the master's `fontName.style`, mapped to a CSS number. Figma
//     stores no per-instance weight override in `derivedSymbolData`, so a
//     variant that changes weight is a blind spot; it is reported as `~`.
//
// Rounding: browsers report fractional line-heights (Onest at 14px gives
// 19.992px). Both sides are rounded to the nearest 0.5 before comparing, and a
// 1px gap on the line box is reported but not counted as a mismatch — that is
// hinting, not a defect. Font size is compared exactly.
import { chromium } from "playwright";
import { weightOf } from "./font-advances.mjs";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i === -1 ? d : argv[i + 1];
};
const WIDTH = Number(opt("--width", 1440));
// `--session dealer` — страницы раздела «Для бизнеса» шарятся и читают, кто
// смотрит, из localStorage; кадры рисуют дилерскую шапку, а свежий браузер
// аудита — покупательскую.
const SESSION = opt("--session", null);
// `--click sel,sel` — открыть состояние (ящик фильтров, меню) перед сверкой
const CLICKS = opt("--click", "") ? String(opt("--click")).split(",") : [];
const pos = argv.filter((a, i) => !a.startsWith("--") && !["--width", "--session", "--click"].includes(argv[i - 1]));
const [page, selector, figmaId] = pos;
if (!page || !selector || !figmaId) {
  console.error(
    "usage: node scripts/audit-type.mjs <page> <selector> <figma-id> [--width 1440]\n" +
      "   e.g. node scripts/audit-type.mjs customer/main '[data-section=\"popular\"]' 2395:105896"
  );
  process.exit(1);
}

// ---- Figma side --------------------------------------------------------------
const raw = (id) =>
  JSON.parse(execFileSync("node", ["scripts/fig.mjs", "raw", id], { maxBuffer: 1 << 28 }));
const idx = JSON.parse(readFileSync("VIVAT_SOURCES/canvas.index.json", "utf8"));
const byId = new Map(idx.nodes.filter((n) => n.id).map((n) => [n.id, n]));
const kids = new Map();
for (const n of idx.nodes) {
  if (!n.parent) continue;
  if (!kids.has(n.parent)) kids.set(n.parent, []);
  kids.get(n.parent).push(n);
}
for (const a of kids.values()) a.sort((x, y) => String(x.order).localeCompare(String(y.order)));

// Узел может быть и FRAME — например блок характеристик (1686:59210). Тогда
// накладывать нечего: индекс и есть истина, метрика берётся прямо с узлов и
// считается твёрдой. Раньше скрипт на таком просто отказывался работать, и
// целые блоки оставались непроверенными.
const inst = raw(figmaId.replace("-", ":"));
const isFrame = !inst?.symbolData;
const pathOf = (g) => g.guids.map((x) => `${x.sessionID}:${x.localID}`).join(".");

const overrides = new Map();
for (const o of inst?.symbolData?.symbolOverrides ?? [])
  if (o.textData?.characters) overrides.set(pathOf(o.guidPath), o.textData.characters);

// Подмена варианта во вложенном инстансе (`overriddenSymbolID`): карточки в
// рельсе «Модули» на 360 (1997:315097) стоят в мастере как `cards-modul size=l`
// 320, а инстанс подменил их на `size=m` 160 (1821:292059). Спускаться надо в
// ПОДМЕНЁННЫЙ мастер — иначе кегли читаются с чужого варианта (цена 18/26
// вместо 14/20) и сверка врёт в обе стороны.
const swapsOf = (r) => new Map((r?.symbolData?.symbolOverrides ?? []).filter((o) => o.overriddenSymbolID)
  .map((o) => [pathOf(o.guidPath), `${o.overriddenSymbolID.sessionID}:${o.overriddenSymbolID.localID}`]));
const swaps = swapsOf(inst);

// Derived layout, keyed by the same path — this is where the real metrics live.
const derived = new Map();
for (const e of inst?.derivedSymbolData ?? []) derived.set(pathOf(e.guidPath), e);

const WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500,
                 SemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };

const hasDerivedText = [...derived.values()].some((e) => e.derivedTextData);

// Пер-символьные заливки: у текста может быть несколько цветов. Берём тот,
// что покрывает больше символов, — для «Отзывы 4» это цвет «4» только если
// он и есть большинство, поэтому берём ПОСЛЕДНИЙ стиль: счётчик всегда в хвосте.
const charFills = new Map();
for (const o of inst?.symbolData?.symbolOverrides ?? []) {
  const t = o.textData;
  if (!t?.styleOverrideTable?.length) continue;
  const last = t.styleOverrideTable[t.styleOverrideTable.length - 1];
  const f = last?.fillPaints?.[0]?.color;
  if (!f) continue;
  const hex = "#" + [f.r, f.g, f.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  charFills.set(pathOf(o.guidPath), hex);
}
const charColor = (path) => charFills.get(path) ?? null;

// Контекст обхода: чей derived/overrides накладывать. У корня-INSTANCE — его
// собственные; у корня-FRAME их нет, и каждый вложенный инстанс (карточка
// декора, строка меню) получает СВОЙ контекст из своего raw — иначе его текст
// читался бы с мастера и считался твёрдым: «Белый» 14/20 по мастеру карточки
// при 16/24 в насчитанной укладке инстанса.
const figText = [];
const decorOf = (v) => (v === "UNDERLINE" ? "under" : v === "STRIKETHROUGH" ? "strike" : null);
const ctxOf = (r) => ({
  swaps: swapsOf(r),
  derived: new Map((r?.derivedSymbolData ?? []).map((e) => [pathOf(e.guidPath), e])),
  overrides: new Map(
    (r?.symbolData?.symbolOverrides ?? []).filter((o) => o.textData?.characters).map((o) => [pathOf(o.guidPath), o.textData.characters])
  ),
});
(function walk(nodeId, prefix, seen, ctx = { derived, overrides, swaps }, inInstance = !isFrame) {
  for (const c of kids.get(nodeId) ?? []) {
    const path = prefix ? `${prefix}.${c.id}` : c.id;
    const { derived, overrides } = ctx;
    const d = derived.get(path);
    // Отсутствие в `derivedSymbolData` НЕ значит «не рендерится»: туда попадает
    // то, что отличается от мастера. Заголовок «Популярные товары для кухни»
    // (752:64204) совпадает с мастером — ни оверрайда, ни derived-записи, а на
    // экране он есть. `audit.mjs` может позволить себе строгое правило, потому
    // что сверяет наличие и порядок; здесь сверяются метрики, и потерять
    // строку хуже, чем показать лишнюю.
    // Узел рендерится, если он не спрятан: отсутствие в `derivedSymbolData`
    // НЕ значит «не рендерится» — туда попадает лишь то, что отличается от
    // мастера. У подвала (2395:105938) три текстовых derived-записи на 32
    // строки, остальное совпадает с мастером.
    //
    // Но метрика с мастера — это НЕ доказательство. Мастер держит и свои
    // дефолтные подписи, и вложенные инстансы, которые их подменяют: якорный
    // ряд PDP (Tab 914:103288) рисует в мастере «Фото» 24/28, а derived
    // говорит 16/24 — и на экране 16/24. Поэтому такие строки помечаются «*»
    // и НЕ считаются дефектом; дефект — только там, где обе стороны твёрдые.
    const shown = derived.has(path) || overrides.has(path) || !c.hidden;
    const t = overrides.get(path) ?? c.text;
    if (t && t.trim() && shown) {
      const dt = d?.derivedTextData;
      const g0 = dt?.glyphs?.[0];
      const glyphWeight = g0 ? weightOf(t.replace(/\s+/g, " ").trim()[g0.firstCharacter ?? 0], g0.advance) : null;
      const lines = dt?.baselines?.length || 1;
      const box = dt?.layoutSize?.y ?? d?.size?.y ?? c.font?.box ?? null;
      figText.push({
        text: t.replace(/\s+/g, " ").trim(),
        size: dt?.glyphs?.[0]?.fontSize ?? c.font?.size ?? null,
        lh: box != null ? +(box / lines).toFixed(1) : (c.font?.lh ?? null),
        // Метрики шрифта: число уложенных строк и ширина уложенного текста.
        // Кегль может сойтись, а Onest в браузере уложит строку иначе, чем
        // Figma, — и заголовок в 22 px на 328 станет на строку короче. Обе
        // цифры только насчитанные (derived); с мастера их нет.
        lines: dt ? lines : null,
        boxW: dt?.layoutSize?.x ?? null,
        autoW: !!c.font?.autoW,
        // Начертание: по ширине первого уложенного глифа (`advance`, доли
        // кегля) против таблиц hmtx самих шрифтов — это твёрдо. Только когда
        // глифов нет, остаётся `fontName` мастера, который протухает так же,
        // как fontSize, и читается как мягкий сигнал.
        weight: glyphWeight ?? (c.font?.style ? (WEIGHT[c.font.style] ?? null) : null),
        adv: g0?.advance ?? null,
        advIdx: g0?.firstCharacter ?? 0,
        // Метрика насчитана Figma для ЭТОГО экземпляра, а не взята с мастера.
        firm: !!dt || !inInstance,
        weightFromMaster: glyphWeight == null,
        // У FRAME метрика с самого узла — она и есть отрисованная.
        frame: isFrame,
        // Цвет. Пер-символьные заливки (`styleOverrideTable`) тоже учитываем:
        // счётчик «4» в «Отзывы 4» — один узел с двумя цветами, и без этого
        // он читался бы цветом заголовка. Цвет всегда мягкий сигнал: у
        // инстанса он может быть переопределён, а derived его не несёт.
        color: charColor(path) ?? (c.fills?.[0]?.color ?? null),
        // Подчёркивание/зачёркивание: с узла или с его текстового стиля (индекс
        // разрешает стиль). «очистить» в ящике фильтров несёт его только стилем.
        decor: decorOf(c.font?.decoration),
      });
    }
    // Скрытый фрейм ВНЕ инстанса скрыт по-настоящему (это не «hidden-in-master»,
    // который экземпляр может показать): в его детей не спускаемся — иначе
    // спрятанная старая цена в сводке модуля встаёт против нашей цены.
    if (c.hidden && !inInstance && !c.symbol) continue;
    const sym = ctx.swaps?.get(path) ?? c.symbol;
    if (sym) {
      if (seen.has(sym)) continue;
      // вложенный инстанс вне контекста инстанса — свой derived, путь с нуля
      if (!inInstance) walk(sym, "", new Set([...seen, sym]), ctxOf(raw(c.id)), true);
      else walk(sym, path, new Set([...seen, sym]), ctx, true);
    } else {
      walk(c.id, prefix, seen, ctx, inInstance);
    }
  }
})(
  inst?.symbolData?.symbolID
    ? `${inst.symbolData.symbolID.sessionID}:${inst.symbolData.symbolID.localID}`
    : figmaId.replace("-", ":"),
  "",
  new Set()
);

// ---- DOM side ----------------------------------------------------------------
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: WIDTH, height: 1000 } });
if (SESSION) await p.addInitScript((u) => localStorage.setItem("vivat:user", u), SESSION);
await p.goto(`file://${resolve("dist/pages", page)}.html`, { waitUntil: "load" });
await p.waitForTimeout(1500);
for (const c of CLICKS) {
  await p.$$eval(c, (els) => { const v = els.find((e) => e.getClientRects().length); if (v) v.click(); });
  await p.waitForTimeout(400);
}
const domText = await p.evaluate((sel) => {
  // Берём первый ВИДИМЫЙ подходящий узел, а не первый попавшийся. В разметке
  // соседствуют десктопный и мобильный варианты одного блока, и на 1440
  // `document.querySelector('footer')` отдаёт мобильный — скрытый, но со
  // своими вычисленными стилями. Обход внутрь скрытое отбрасывает, а сам
  // корень не проверял: получилась целая страница ложных находок, 32 штуки,
  // где подвал «12/16 против 16/24» на деле совпадал до пикселя.
  const seen = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && el.getBoundingClientRect().height > 0;
  };
  const all = [...document.querySelectorAll(sel)];
  const root = all.find(seen) ?? all[0];
  if (!root) return null;
  if (all.length > 1) console.warn(`селектор дал ${all.length} узлов; взят первый видимый`);
  const out = [];
  const walk = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/\s+/g, " ").trim();
        if (!t) continue;
        const cs = getComputedStyle(el);
        const rgb = cs.color.match(/\d+/g);
        // Уложенный текст: прямоугольник самого текстового узла (Range), а не
        // элемента — у элемента есть паддинги и ширина контейнера.
        const range = document.createRange();
        range.selectNodeContents(n);
        const rects = [...range.getClientRects()];
        const rb = range.getBoundingClientRect();
        const lhPx = cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight);
        out.push({
          text: t,
          size: parseFloat(cs.fontSize),
          lh: lhPx,
          lines: lhPx ? Math.max(1, Math.round(rb.height / lhPx)) : rects.length || null,
          boxW: Math.round(rb.width),
          weight: parseInt(cs.fontWeight, 10),
          // text-decoration не наследуется, а РИСУЕТСЯ с предка — идём вверх
          decor: (() => {
            for (let e = el; e && e !== root.parentElement; e = e.parentElement) {
              const l = getComputedStyle(e).textDecorationLine;
              if (l.includes("underline")) return "under";
              if (l.includes("line-through")) return "strike";
            }
            return null;
          })(),
          color: rgb ? "#" + rgb.slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("") : null,
        });
      } else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        walk(n);
      }
    }
  };
  walk(root);
  return out;
}, selector);
await browser.close();

if (domText === null) {
  console.error(`селектор ничего не нашёл: ${selector}`);
  process.exit(1);
}

// ---- report ------------------------------------------------------------------
const key = (s) => s.toLowerCase().replace(/[«»"'`\s]/g, "");
const half = (v) => (v == null ? null : Math.round(v * 2) / 2);
const fmt = (r) =>
  r ? `${r.size ?? "?"}/${half(r.lh) ?? "?"}${r.weight ? " " + r.weight : ""}${r.color ? " " + r.color : ""}` : "—";

console.log(`\n  ══ ${page} @ ${WIDTH}  ←→  ${figmaId}   ${selector}`);
console.log(`  ${"строка".padEnd(38)} ${"МАКЕТ".padStart(12)}   ${"СТРАНИЦА".padStart(12)}`);
console.log(`  ${"—".repeat(38)} ${"—".repeat(12)}   ${"—".repeat(12)}`);

// Пары строятся ПО ТЕКСТУ, наибольшей общей подпоследовательностью. Позиционное
// сведение здесь не работает: обе стороны законно содержат строки, которых нет
// у другой — макет несёт филлер вариантов, страница несёт то, что дизайнер
// нарисовал соседним блоком. А сравнивать надо метрики одной и той же строки,
// и только их.
function align(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = key(a[i].text) === key(b[j].text) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (key(a[i].text) === key(b[j].text)) out.push([a[i++], b[j++]]);
    else if (L[i + 1][j] >= L[i][j + 1]) out.push([a[i++], null]);
    else out.push([null, b[j++]]);
  }
  while (i < n) out.push([a[i++], null]);
  while (j < m) out.push([null, b[j++]]);
  return out;
}

// Второй проход. Фикстуры у нас свои, поэтому ровно те строки, ради которых
// аудит и затевался — цена, название товара, счётчики, — по тексту не сойдутся
// никогда: в макете «148 320₽», у нас «60 000₽». После сведения по тексту
// остатки с двух сторон зипуются ПО ПОРЯДКУ и помечаются «≈»: пара
// правдоподобна, но не доказана, и читать её надо глазами. Именно так нашлась
// цена 24/32 против наших 24/28 в карточке каталожной сетки.
function pairLeftovers(rows) {
  const out = [];
  const figOnly = [];
  const domOnly = [];
  for (const [f, d] of rows) {
    if (f && d) out.push([f, d, "текст"]);
    else if (f) figOnly.push(f);
    else domOnly.push(d);
  }
  const n = Math.min(figOnly.length, domOnly.length);
  for (let i = 0; i < n; i++) out.push([figOnly[i], domOnly[i], "порядок"]);
  for (let i = n; i < figOnly.length; i++) out.push([figOnly[i], null, "—"]);
  for (let i = n; i < domOnly.length; i++) out.push([null, domOnly[i], "—"]);
  return out;
}

let bad = 0;
let wrap = 0;
let soft = 0;
let only = 0;
let guessed = 0;
for (const [f, d, how] of pairLeftovers(align(figText, domText))) {
  let flag = "  ";
  if (!f || !d) {
    flag = f ? "м " : "с ";
    only++;
  } else {
    // Дефектом считаются ТОЛЬКО кегль и вес. Интерлиньяж помечается, но не
    // засчитывается: он выводится из насчитанной коробки, а коробку в макете
    // случается растянуть руками. Живой пример — «от» в карточке: узел 18x33
    // при кегле 16 (таких в файле 503 штуки), тогда как стиль говорит 16/22.
    // Считать это расхождением значит хоронить настоящие находки под шумом.
    const sizeBad = f.size != null && d.size != null && Math.abs(f.size - d.size) > 0.5;
    // Вес — МЯГКИЙ сигнал, как цвет и интерлиньяж. `derivedSymbolData` его не
    // несёт, поэтому он всегда читается с узла мастера, а поле `fontName` там
    // протухает ровно как `fontSize`: у крошек 1806:236770 в полях Medium и 16
    // при насчитанных 12 и Regular. Считать это дефектом — значит чинить по
    // протухшему полю, что я один раз уже сделал.
    // Если текст макета — филлер мастера («Текст»), а пара найдена по
    // порядку, ширина первого глифа всё равно насчитана для НАСТОЯЩЕГО текста
    // (переопределение вложенного инстанса): читаем вес по первой букве нашей
    // строки — она и есть та буква.
    if (f.weightFromMaster && f.adv != null && d.text) {
      const w = weightOf(d.text[f.advIdx] ?? d.text[0], f.adv);
      if (w != null) { f.weight = w; f.weightFromMaster = false; }
    }
    const wBad = f.weight != null && d.weight != null && f.weight !== d.weight;
    const lhBad = f.lh != null && d.lh != null && Math.abs(f.lh - d.lh) > 1;
    // Метрики шрифта — только у пар ПО ТЕКСТУ (одна и та же строка) с
    // насчитанной укладкой. Разное число строк — перенос: кегль тот же, а блок
    // на строку выше или ниже. Разная ширина однострочного текста (больше 4px
    // и 3%) — трекинг, начертание или другой шрифт.
    const same = how === "текст" && f.lines != null && d.lines != null;
    const wrapBad = same && !sizeBad && f.lines !== d.lines;
    const widthBad = same && !sizeBad && f.autoW && f.lines === 1 && d.lines === 1 && f.boxW != null && d.boxW != null &&
      Math.abs(f.boxW - d.boxW) > Math.max(4, 0.03 * f.boxW);
    if (sizeBad && !f.firm) {
      // Метрика с мастера — сигнал, а не приговор. Считать её дефектом значит
      // выдумывать: на якорном ряду PDP так получилось пять расхождений подряд,
      // которых нет.
      flag = "* ";
      soft++;
    } else if (sizeBad) {
      flag = how === "порядок" ? "≈✗" : "✗ ";
      bad++;
    } else if (wrapBad) {
      flag = "✗п";
      wrap++;
    } else if (widthBad) {
      flag = "шр";
      soft++;
    } else if ((f.decor ?? null) !== (d.decor ?? null) && how === "текст") {
      // подчёркивание — не оттенок: оно есть или его нет
      flag = "✗д";
      wrap++;
    } else if (wBad && !f.weightFromMaster) {
      // вес прочитан по ширине глифа — это расхождение, а не подозрение
      flag = "✗в";
      wrap++;
    } else if (wBad) {
      flag = "вес";
      soft++;
    } else if (lhBad) {
      flag = "лн";
      soft++;
    } else if (f.color && d.color && f.color !== d.color) {
      // Цвет — мягкий сигнал: у инстанса он может быть переопределён вариантом,
      // а `derivedSymbolData` заливок не несёт. Но именно так нашёлся счётчик
      // «Отзывы 4» — #888888 в кадре против #acacac у нас.
      flag = "цв";
      soft++;
    } else if (how === "порядок") {
      flag = "≈ ";
    }
    if (how === "порядок") guessed++;
  }
  const label =
    how === "порядок"
      ? `${(f.text ?? "").slice(0, 16)} ⟷ ${(d.text ?? "").slice(0, 16)}`
      : (f?.text ?? d?.text ?? "").slice(0, 37);
  const metric = (flag === "✗п" || flag === "шр") && f && d
    ? `   строк ${f.lines}↔${d.lines}, ширина ${f.boxW}↔${d.boxW}`
    : flag === "✗д" ? `   линия ${f.decor ?? "нет"}↔${d.decor ?? "нет"}` : "";
  console.log(`${flag}${label.padEnd(38)} ${fmt(f).padStart(12)}   ${fmt(d).padStart(12)}${metric}`);
}

console.log(
  `\n  строк: в макете ${figText.length}, на странице ${domText.length};` +
    ` расхождений кегля ${bad}, переносов ${wrap}, мягких ${soft};` +
    ` сведено по порядку ${guessed}, без пары ${only}` +
    `\n  «✗» — разошёлся КЕГЛЬ. Это дефект.` +
    `\n  «✗в» — разошёлся ВЕС, прочитанный по ширине глифа (advance против hmtx` +
    `\n         шрифта): твёрдо, в отличие от «вес» с мастера.` +
    `\n  «✗п» — та же строка уложена в другое число строк: перенос. Метрики` +
    `\n         шрифта или ширина контейнера — блок на строку выше/ниже.` +
    `\n  «✗д» — у той же строки подчёркивание/зачёркивание есть с одной стороны:` +
    `\n         в макете оно часто приходит со СТИЛЕМ текста, а не с узла.` +
    `\n  «шр» — однострочный текст другой ширины (>4px и >3%): трекинг,` +
    `\n         начертание или не тот шрифт.` +
    `\n  «вес» — разошёлся ВЕС. Мягкий: derived его не несёт, читается с мастера,` +
    `\n         а поле fontName там протухает так же, как fontSize.` +
    `\n  «*» — метрика макета взята с МАСТЕРА (насчитанной для экземпляра нет).` +
    `\n        Мастер регулярно опровергается — идти и смотреть \`fig.mjs inst\`.` +
    `\n  «цв» — разошёлся ЦВЕТ. Тоже мягкий: заливка берётся из мастера или из` +
    `\n        пер-символьных стилей, инстанс может её переопределить.` +
    `\n  «лн» — разошёлся интерлиньяж. Смотреть глазами: он выведен из коробки,` +
    `\n         а коробку в макете случается растянуть руками (см. шапку скрипта).` +
    `\n  «≈» — пара найдена по ПОРЯДКУ, а не по тексту (свои фикстуры). Пара` +
    `\n        правдоподобна, но не доказана — сверять глазами.` +
    `\n  «м»/«с» — строка только в макете / только на странице; метрику не сверить.` +
    `\n  Вес берётся из мастера: вариант, меняющий начертание, аудит не увидит.\n`
);
process.exit(bad || wrap ? 1 : 0);
