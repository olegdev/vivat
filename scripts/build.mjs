// vite-plugin-singlefile requires exactly one HTML entry per build (it inlines
// all JS/CSS into that single file). We have multiple pages, so this script
// runs one Vite build per page instead of a single multi-entry build.
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { resolve } from "node:path";
import { globSync } from "glob";
import { rmSync } from "node:fs";

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
    plugins: [tailwindcss(), viteSingleFile()],
    build: {
      outDir,
      emptyOutDir: false, // we cleared it once above; keep prior pages' output
      rollupOptions: {
        input: resolve(root, entry),
      },
    },
    logLevel: "warn",
  });
}

console.log(`\n✓ built ${entries.length} page(s) into dist/`);
