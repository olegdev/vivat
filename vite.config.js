import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { globSync } from "glob";

// This config powers `vite` (dev server) and the optional chunked `vite build`.
// The static, double-click-able build (one self-contained HTML per page) is
// produced by scripts/build.mjs instead — vite-plugin-singlefile requires a
// single HTML entry per build, which conflicts with this file's multi-page
// rollupOptions.input.

// Multi-page: every .html under src/pages becomes a build entry, plus the root index.
const pageEntries = Object.fromEntries(
  globSync("src/pages/**/*.html").map((file) => {
    // src/pages/customer/main.html -> "customer/main"
    const name = file.replace(/^src\/pages\//, "").replace(/\.html$/, "");
    return [name, resolve(process.cwd(), file)];
  })
);

export default defineConfig({
  root: "src",
  base: "./", // relative asset URLs so the build opens straight from disk (file://)
  publicDir: resolve(process.cwd(), "public"),
  plugins: [tailwindcss()],
  build: {
    outDir: resolve(process.cwd(), "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "src/index.html"),
        ...pageEntries,
      },
    },
  },
});
