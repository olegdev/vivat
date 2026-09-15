// Прогон всех аудитов по реестру `docs/AUDIT-MAP.md`.
//
//   npm run audit:all                  всё
//   npm run audit:all dealer/pdp       одна страница
//   npm run audit:all -- --width 360   одна ширина
//
// Зачем: три аудита (`audit:type`, `audit:box`, `audit:spacing`) поблочные —
// на вход им нужны селектор и id инстанса. Пока списка блоков не было, охват
// зависел от памяти, и половина блоков не проверялась ни разу: плашка в
// характеристиках дожила до клиента с кеглем 14/18 вместо 16/24, хотя
// `audit:type` нашёл бы её за секунду.
//
// Печатается только то, что требует внимания: расхождения кегля и веса,
// предупреждение про рамку, несошедшиеся стыки. Совпавшее молчит.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i === -1 ? d : argv[i + 1]; };
const onlyWidth = opt("--width", null);
const pages = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--width");

const WIDTHS = ["1440", "768", "360"];

// ---- разбор реестра ----------------------------------------------------------
const md = readFileSync("docs/AUDIT-MAP.md", "utf8").split("\n");
const rows = [];
let page = null;
for (const line of md) {
  const h = line.match(/^##\s+([a-z]+\/[a-z-]+)\s*$/);
  if (h) { page = h[1]; continue; }
  if (!page || !line.startsWith("| ")) continue;
  const c = line.split("|").map((x) => x.trim()).filter((x, i, a) => i > 0 && i < a.length - 1);
  if (c.length < 6 || c[0] === "блок" || /^-+$/.test(c[0])) continue;
  const [name, selRaw, w1440, w768, w360, how] = c;
  // Флаги живут в конце селектора после `#`.
  const flags = {};
  const sel = selRaw.replace(/`/g, "").replace(/#(\w+)=(\S+)/g, (_, k, v) => { flags[k] = v; return ""; }).trim();
  const hint = how.replace(/#(\w+)=(\S+)/g, (_, k, v) => { flags[k] = v; return ""; }).trim();
  rows.push({ page, name, sel, ids: { 1440: w1440, 768: w768, 360: w360 }, how: hint || "t b", flags });
}

const wanted = (r) => !pages.length || pages.includes(r.page);
const run = (cmd, args) => {
  try { return execFileSync("node", [cmd, ...args], { maxBuffer: 1 << 28, encoding: "utf8" }); }
  catch (e) { return (e.stdout || "") + (e.stderr || ""); }
};

let hard = 0;   // расхождения: кегль, вес, несошедшийся стык
let soft = 0;   // подозрения: подсказки аудита ящиков
let checks = 0;
for (const r of rows.filter(wanted)) {
  for (const w of WIDTHS) {
    if (onlyWidth && w !== onlyWidth) continue;
    const id = r.ids[w];
    if (!id || id === "—") continue;
    const lines = [];

    if (r.name === "СТРАНИЦА") {
      // поток: края блоков кадра против краёв блоков страницы. Печатается
      // первый разошедшийся край — ниже всё обычно едет на ту же величину.
      const sess = r.flags.session ? ["--session", r.flags.session] : [];
      const fo = run("scripts/audit-flow.mjs", [r.page, id, "--width", w, ...sess]);
      checks++;
      const first = fo.split("\n").filter((l) => l.startsWith("✗"));
      if (first.length) {
        lines.push(`   поток ✗ ${first[0].slice(2).trim()}`);
        lines.push(`         (краёв без пары ${first.length}; подробно: node scripts/audit-flow.mjs ${r.page} ${id} --width ${w})`);
        hard++;
      }
    }
    if (r.name === "СТРАНИЦА" && r.how.includes("s")) {
      const a = ["scripts/audit-spacing.mjs", r.page, id];
      if (r.flags.flatten) a.push("--flatten", r.flags.flatten);
      // audit-spacing сам знает про ширины: 1440 базовая, остальные флагами
      const out = w === "1440" ? run(a[0], a.slice(1))
        : w === "768" ? run(a[0], [r.page, r.ids[1440], "--tablet", id, ...(r.flags.flatten ? ["--flatten", r.flags.flatten] : [])])
        : run(a[0], [r.page, r.ids[1440], id, ...(r.flags.flatten ? ["--flatten", r.flags.flatten] : [])]);
      checks++;
      for (const l of out.split("\n")) if (/^✗/.test(l)) { lines.push("   отступы " + l.trim()); hard++; }
    } else {
      const sess = r.flags.session ? ["--session", r.flags.session] : [];
      if (r.how.includes("t")) {
        const out = run("scripts/audit-type.mjs", [r.page, r.sel, id, "--width", w, ...sess, ...(r.flags.click ? ["--click", r.flags.click] : [])]);
        checks++;
        for (const l of out.split("\n")) {
          if (/^✗/.test(l)) { lines.push("   кегль/перенос " + l.trim()); hard++; }
          else if (/^шр/.test(l)) { lines.push("   ширина текста " + l.trim()); soft++; }
        }
        if (/селектор ничего не нашёл|не INSTANCE/.test(out)) { lines.push("   кегль/вес — НЕ ПРОВЕРЕН: " + out.trim().split("\n").pop()); hard++; }
      }
      if (r.how.includes("c")) {
        // копия — порядок и текст строк; только для INSTANCE с переопределениями
        const out = run("scripts/audit.mjs", [r.page, r.sel, id, "--width", w]);
        checks++;
        for (const l of out.split("\n")) if (/^✗/.test(l)) { lines.push("   копия " + l.trim()); hard++; }
        if (/is not an INSTANCE|селектор ничего не нашёл/.test(out)) { lines.push("   копия — НЕ ПРОВЕРЕН: " + out.trim().split("\n").pop()); soft++; }
      }
      if (r.how.includes("i")) {
        const out = run("scripts/audit-icons.mjs", [r.page, r.sel, id, "--width", w, ...sess]);
        checks++;
        for (const l of out.split("\n")) if (/^[✗?]/.test(l)) { lines.push("   иконки " + l.trim()); if (l.startsWith("✗")) hard++; else soft++; }
        if (/селектор ничего не нашёл/.test(out)) { lines.push("   иконки — НЕ ПРОВЕРЕН: " + out.trim().split("\n").pop()); hard++; }
      }
      if (r.how.includes("b")) {
        const a = [r.page, r.sel, id, "--width", w, "--min", "12"];
        if (r.flags.depth) a.push("--depth", r.flags.depth);
        if (r.flags.click) a.push("--click", r.flags.click);
        a.push(...sess);
        const out = run("scripts/audit-box.mjs", a);
        checks++;
        // все подсказки с их строками-примерами (они идут следом с отступом 6)
        const ls = out.split("\n");
        for (const l of ls) if (/^✗ корень/.test(l)) { lines.push("   ящики " + l.trim()); hard++; }
        // x надписи — твёрдо, с примерами (строки с отступом 6)
        for (let i = 0; i < ls.length; i++) {
          if (!/^\s*✗ x надписи/.test(ls[i])) continue;
          lines.push("   ящики " + ls[i].trim()); hard++;
          for (let j = i + 1; j < ls.length && /^      \S/.test(ls[j]); j++) lines.push("         " + ls[j].trim());
        }
        for (let i = 0; i < ls.length; i++) {
          if (!ls[i].includes("⚠")) continue;
          lines.push("   ящики " + ls[i].trim());
          soft++;
          for (let j = i + 1; j < ls.length && /^      \S/.test(ls[j]); j++) lines.push("         " + ls[j].trim());
        }
        if (/селектор ничего не нашёл|нет такого узла/.test(out)) { lines.push("   ящики — НЕ ПРОВЕРЕН: " + out.trim().split("\n").pop()); hard++; }
      }
    }

    if (lines.length) {
      console.log(`\n── ${r.page} @${w} · ${r.name}`);
      console.log(lines.join("\n"));
    }
  }
}

// Статический проход по исходникам: SVG в data-URI с сырым `#`. Всё после `#`
// браузер читает как якорь, путь обрывается — и картинки нет, без единой
// ошибки в консоли. Так галка в чекбоксе фильтров (`fill="#292929"`) пропала,
// и выбранная клетка стала белой на белом. Цвет пишется `%23292929`.
{
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(css|html|js)$/.test(e.name) ? [`${dir}/${e.name}`] : []);
  const bad = [];
  for (const f of walk("src")) {
    readFileSync(f, "utf8").split("\n").forEach((l, i) => {
      for (const m of l.matchAll(/data:image\/svg\+xml(?!;base64)[,;][^"')]*/g)) if (m[0].includes("#")) bad.push(`${f}:${i + 1}`);
    });
  }
  checks++;
  if (bad.length) {
    hard += bad.length;
    console.log(`\n── исходники · SVG data-URI с сырым «#» (картинка не рисуется)`);
    console.log(bad.map((b) => "   ✗ " + b).join("\n"));
  }
}

// Пятый аудит — постраничный, а не поблочный: ему не нужен ни селектор, ни
// узел, поэтому он идёт по СТРАНИЦАМ реестра, а не по строкам.
for (const page of [...new Set(rows.filter(wanted).map((r) => r.page))]) {
  const out = run("scripts/audit-fit.mjs", [page, ...(onlyWidth ? ["--width", onlyWidth] : [])]);
  checks++;
  const lines = out.split("\n").filter((l) => /✗/.test(l) || /^\s+до \d+/.test(l));
  hard += lines.filter((l) => /✗/.test(l)).length;
  if (lines.length) {
    console.log(`\n── ${page} · окно и перекрытия`);
    console.log(lines.map((l) => "   " + l.trim()).join("\n"));
  }
}

console.log(
  `\n  строк реестра ${rows.filter(wanted).length}, прогонов ${checks};` +
    ` расхождений ${hard}, подозрений ${soft}` +
    (hard || soft ? "" : " — всё сошлось") +
    `\n  «расхождение» — кегль, вес, несошедшийся стык, горизонтальная прокрутка\n  или перекрытый элемент управления: смотреть обязательно.` +
    `\n  «подозрение» — подсказка аудита ящиков или файл иконки вне карты. Часто это накопленное округление` +
    `\n  ширины текста или своя фикстура, но проверить стоит.\n`
);
process.exit(hard ? 1 : 0);
