// Проверка микроразметки schema.org в собранных страницах.
//
//   npm run schema            # весь dist/pages
//
// Зачем: двадцать блоков BreadcrumbList набиты руками, и самая вероятная
// поломка — расхождение цепочки с видимыми крошками после правки текста.
// Скрипт сверяет их слово в слово; заодно, раз проход уже сделан, проверяет
// целостность самого JSON — он ведь тоже пишется руками.
//
// Дизайн: docs/superpowers/specs/2026-09-10-schema-org-design.md

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist/pages";
const SITE = "https://mebel.com";
const ORG_FIELDS = ["name", "url", "logo", "telephone"];

// Главная и у покупателя, и у дилера — один адрес, «/»; крошек там нет.
const NO_CRUMBS = new Set(["customer/main", "dealer/main"]);

// Страницы, где крошки нарисованы в макете и видны на экране. Список нужен,
// чтобы сверка не отключилась молча: поменяется класс у <nav> — и проверка
// «JSON повторяет видимое» просто перестанет что-либо проверять, чего по
// зелёному прогону не увидишь.
const VISIBLE = new Set([
  "customer/catalog",
  "customer/pdp",
  "customer/pdp-module",
  "customer/action",
  "dealer/catalog",
  "dealer/pdp",
  "dealer/models",
]);

if (!existsSync(DIST)) {
  console.error(`${DIST} нет — сначала npm run build`);
  process.exit(2);
}

const problems = [];
const fail = (page, msg) => problems.push(`${page}: ${msg}`);

// Видимые крошки страницы: тексты звеньев в порядке отрисовки.
function visibleCrumbs(html) {
  const nav = html.match(/<nav class="[^"]*items-center gap-2 py-4[^"]*">([\s\S]*?)<\/nav>/);
  if (!nav) return null;
  const out = [];
  const re = /<a [^>]*>([^<]+)<\/a>|<span class="text-text-primary">([^<]+)<\/span>/g;
  let m;
  while ((m = re.exec(nav[1]))) out.push((m[1] ?? m[2]).trim());
  return out;
}

function blocks(html) {
  const out = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function checkOrg(page, org) {
  for (const f of ORG_FIELDS) if (!org[f]) fail(page, `Organization без «${f}»`);
  for (const f of ["url", "logo"]) {
    if (org[f] && !org[f].startsWith(SITE)) fail(page, `Organization.${f} не абсолютный: ${org[f]}`);
  }
}

function checkCrumbs(page, list, visible) {
  const items = list.itemListElement ?? [];
  if (!items.length) return fail(page, "BreadcrumbList пуст");

  items.forEach((it, i) => {
    if (it.position !== i + 1) fail(page, `position ${it.position} на месте ${i + 1}`);
    if (!it.name) fail(page, `звено ${i + 1} без имени`);
    const last = i === items.length - 1;
    if (!last && !it.item) fail(page, `звено ${i + 1} («${it.name}») без адреса`);
    if (it.item && !it.item.startsWith(SITE)) fail(page, `звено ${i + 1}: адрес не абсолютный (${it.item})`);
  });

  if (!visible) return;
  const names = items.map((it) => it.name);
  if (names.join(" › ") !== visible.join(" › ")) {
    fail(page, `цепочка разошлась с видимыми крошками\n    разметка: ${names.join(" › ")}\n    страница: ${visible.join(" › ")}`);
  }
}

let checked = 0;
for (const half of readdirSync(DIST)) {
  for (const file of readdirSync(join(DIST, half)).filter((f) => f.endsWith(".html"))) {
    const page = `${half}/${file.replace(/\.html$/, "")}`;
    const html = readFileSync(join(DIST, half, file), "utf8");
    checked++;

    const parsed = [];
    for (const raw of blocks(html)) {
      try {
        parsed.push(JSON.parse(raw));
      } catch (e) {
        fail(page, `JSON-LD не парсится: ${e.message}`);
      }
    }

    const orgs = parsed.filter((j) => j["@type"] === "Organization");
    if (orgs.length !== 1) fail(page, `Organization: ${orgs.length} шт., ожидается 1`);
    else checkOrg(page, orgs[0]);

    const lists = parsed.filter((j) => j["@type"] === "BreadcrumbList");
    const want = NO_CRUMBS.has(page) ? 0 : 1;
    if (lists.length !== want) fail(page, `BreadcrumbList: ${lists.length} шт., ожидается ${want}`);
    else if (want) {
      const visible = visibleCrumbs(html);
      if (VISIBLE.has(page) && !visible) fail(page, "видимые крошки не найдены — сверять не с чем (изменился <nav>?)");
      if (!VISIBLE.has(page) && visible) fail(page, "на странице появились видимые крошки — внесите её в VISIBLE");
      checkCrumbs(page, lists[0], visible);
    }
  }
}

if (problems.length) {
  console.error(`Расхождений: ${problems.length} (страниц проверено: ${checked})\n`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Микроразметка в порядке: ${checked} страниц.`);
