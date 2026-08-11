// vite-plugin-singlefile requires exactly one HTML entry per build (it inlines
// all JS/CSS into that single file). We have multiple pages, so this script
// runs one Vite build per page instead of a single multi-entry build.
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { htmlIncludes } from "./vite-plugin-includes.mjs";
import { resolve } from "node:path";
import { globSync } from "glob";
import { rmSync } from "node:fs";

// dist/ is the build shown to the client, so the source comments — Figma node
// references, notes to the PHP developer — have no business in it. They stay in
// src/ and in dist-php/, which is the hand-off and where they are the point.
// Runs `post` so the includes plugin has already spliced the partials in, and
// before vite-plugin-singlefile inlines JS/CSS, so only markup is touched.
const stripHtmlComments = () => ({
  name: "strip-html-comments",
  transformIndexHtml: {
    order: "post",
    handler: (html) =>
      html
        // leave <script>/<style> bodies alone; only strip between them
        .split(/(<(?:script|style)\b[\s\S]*?<\/(?:script|style)>)/i)
        .map((part, i) => (i % 2 ? part : part.replace(/<!--[\s\S]*?-->/g, "")))
        .join("")
        .replace(/^[ \t]*\n/gm, ""),
  },
});

const root = process.cwd();
const outDir = resolve(root, "dist");

rmSync(outDir, { recursive: true, force: true });

const entries = ["src/index.html", ...globSync("src/pages/**/*.html")];

for (const entry of entries) {
  console.log(`\n→ building ${entry}`);
  await build({
    root: "src",
    base: "./",
    publicDir: resolve(root, "public"),
    plugins: [htmlIncludes(), stripHtmlComments(), tailwindcss(), viteSingleFile()],
    build: {
      outDir,
      emptyOutDir: false, // we cleared it once above; keep prior pages' output
      // Everything is inlined into one HTML, so no <link rel="modulepreload">
      // is ever emitted — the polyfill Vite prepends to the entry chunk is
      // dead weight in every page.
      modulePreload: { polyfill: false },
      rollupOptions: {
        input: resolve(root, entry),
      },
    },
    logLevel: "warn",
  });
}

console.log(`\n✓ built ${entries.length} page(s) into dist/`);
