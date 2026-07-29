// =============================================================================
// HAND-OFF BUILD — `npm run build:php` → dist-php/
//
// Produces the folder handed to the PHP developer who ports this prototype to
// Blade. Deliberately NOT a bundle: the goal is markup and code a person reads
// and translates, not something small a browser downloads fast.
//
// How it differs from `npm run build` (dist/, vite-plugin-singlefile):
//   dist/       one self-contained HTML per page, all JS/CSS inlined and
//               minified — opens by double-click, for showing the client
//   dist-php/   the source tree with partials spliced in, marked up with the
//               Blade directive each splice becomes; JS copied file-for-file,
//               CSS compiled once, unminified. Needs a local web server
//               (ES modules do not load over file://).
//
// The layout mirrors src/ exactly, so a path in the hand-off is a path in the
// repo. The only transformations are the ones native ESM cannot do itself:
//   • `import "../../styles/app.css"` is stripped (the page carries a <link>)
//   • `import X from "./promo-coral.svg?raw"` becomes a generated .js module
// Both are noted in the file that receives them, so nothing is silently magic.
// =============================================================================
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { htmlIncludes } from "./vite-plugin-includes.mjs";
import { resolve, dirname, basename, join } from "node:path";
import { globSync } from "glob";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";

const root = process.cwd();
const src = resolve(root, "src");
const out = resolve(root, "dist-php");
const tmp = resolve(root, ".handoff-tmp");

rmSync(out, { recursive: true, force: true });
rmSync(tmp, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// ---- 1. compile the stylesheet ----------------------------------------------
// Tailwind v4 generates utilities by scanning the sources, so the CSS has to be
// produced by a real build rather than copied. A throwaway entry that imports
// nothing but app.css gives us exactly one CSS file, unminified.
console.log("→ compiling styles/app.css");
const cssEntryJs = resolve(src, "_handoff-css-entry.js");
const cssEntryHtml = resolve(src, "_handoff-css-entry.html");
writeFileSync(cssEntryJs, 'import "./styles/app.css";\n');
writeFileSync(
  cssEntryHtml,
  '<!doctype html><html><head><script type="module" src="./_handoff-css-entry.js"></script></head><body></body></html>\n'
);

try {
  await build({
    root: "src",
    base: "./",
    publicDir: false,
    plugins: [tailwindcss()],
    build: {
      outDir: tmp,
      emptyOutDir: true,
      minify: false,
      cssMinify: false,
      modulePreload: { polyfill: false },
      rollupOptions: { input: cssEntryHtml },
    },
    logLevel: "warn",
  });
} finally {
  rmSync(cssEntryJs, { force: true });
  rmSync(cssEntryHtml, { force: true });
}

const cssFile = globSync(`${tmp}/**/*.css`)[0];
if (!cssFile) throw new Error("hand-off build: no CSS came out of the Tailwind build");
mkdirSync(resolve(out, "styles"), { recursive: true });
const compiledCss = readFileSync(cssFile, "utf8");
writeFileSync(
  resolve(out, "styles/app.css"),
  `/* Compiled from src/styles/app.css by scripts/build-handoff.mjs.\n` +
    `   Tailwind v4 generates this by SCANNING THE SOURCE FILES for class names,\n` +
    `   so adding a utility class to a .blade.php file will NOT work until this\n` +
    `   file is regenerated against the Blade templates. See PORTING.md › CSS. */\n` +
    compiledCss
);
rmSync(tmp, { recursive: true, force: true });

// ---- 2. copy the parts that need no transformation --------------------------
console.log("→ copying partials, components, data, assets");
cpSync(resolve(src, "partials"), resolve(out, "partials"), { recursive: true });
cpSync(resolve(src, "data"), resolve(out, "data"), { recursive: true });
cpSync(resolve(root, "public/assets"), resolve(out, "assets"), { recursive: true });

// ---- 3. components, with the two Vite-only imports resolved -----------------
mkdirSync(resolve(out, "components"), { recursive: true });
for (const file of globSync("src/components/*.js")) {
  let code = readFileSync(file, "utf8");

  // `?raw` is a Vite import suffix. Turn the asset into a plain ES module that
  // exports the same string, so the component keeps working untouched elsewhere.
  code = code.replace(
    /import\s+(\w+)\s+from\s+"\.\/([\w-]+)\.svg\?raw";/g,
    (_, ident, name) => {
      const svg = readFileSync(resolve(src, `components/${name}.svg`), "utf8");
      writeFileSync(
        resolve(out, `components/${name}-svg.js`),
        `// Generated from components/${name}.svg by the hand-off build — the\n` +
          `// prototype imported it with Vite's \`?raw\` suffix, which plain ES\n` +
          `// modules have no equivalent for. In Blade, inline the SVG in the\n` +
          `// partial instead and delete this file.\n` +
          `export default ${JSON.stringify(svg)};\n`
      );
      return `import ${ident} from "./${name}-svg.js";`;
    }
  );

  writeFileSync(resolve(out, "components", basename(file)), code);
}

// ---- 4. pages: splice the partials, mark them, link the stylesheet ----------
const pages = ["src/index.html", ...globSync("src/pages/**/*.html")];
const { transformIndexHtml } = htmlIncludes({ root: src, markers: true });

for (const page of pages) {
  const rel = page.replace(/^src\//, "");
  const dest = resolve(out, rel);
  mkdirSync(dirname(dest), { recursive: true });

  // Depth of this page below the hand-off root, so ../.. lands on styles/.
  const up = "../".repeat(rel.split("/").length - 1) || "./";

  let html = transformIndexHtml.handler(readFileSync(page, "utf8"));
  html = html.replace(
    /(\s*)<script type="module" src="\.\/([\w-]+)\.js"><\/script>/,
    (_, ws, name) =>
      `${ws}<link rel="stylesheet" href="${up}styles/app.css" />` +
      `${ws}<script type="module" src="./${name}.js"></script>`
  );
  writeFileSync(dest, html);

  // The page's own script travels with it.
  const js = page.replace(/\.html$/, ".js");
  if (existsSync(js)) {
    const code = readFileSync(js, "utf8").replace(
      /^import "(\.\.\/)*styles\/app\.css";\n/m,
      `// (the stylesheet is a <link> in the page — Vite's CSS import removed by\n` +
        `//  the hand-off build, since plain ES modules cannot import CSS)\n`
    );
    writeFileSync(resolve(out, rel.replace(/\.html$/, ".js")), code);
  }
}

// ---- 5. the documentation ----------------------------------------------------
cpSync(resolve(root, "docs/PORTING.md"), resolve(out, "PORTING.md"));

const count = (glob) => globSync(`${out}/${glob}`).length;
console.log(
  `\n✓ dist-php/ — ${pages.length} pages, ${count("partials/*.html")} partials, ` +
    `${count("components/*.js")} components, ${count("data/*.js")} data modules` +
    `\n  serve it: npx serve dist-php   (or: php -S localhost:8000 -t dist-php)` +
    `\n  start at: PORTING.md`
);
