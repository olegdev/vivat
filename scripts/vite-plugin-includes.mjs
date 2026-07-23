import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// SSI-style build-time HTML includes. `<!--#include partials/header.html -->`
// splices the file's raw text into the page *before* Vite processes it, so the
// injected markup (asset URLs, scripts) is handled exactly as if hand-written.
// Paths resolve from the Vite root (`src/`). One partial == one future Blade
// partial: the port to `@include('partials.header')` is then mechanical.
//
// Note: this is a raw text splice, so asset URLs inside a partial are written
// relative to the *including page*, not the partial. Every customer page lives
// at `src/pages/customer/*.html`, so `../../assets/...` is uniform.
const INCLUDE_RE = /<!--\s*#include\s+(?:"([^"]+)"|(\S+?))\s*-->/g;

export function htmlIncludes({ root } = {}) {
  const base = root || resolve(process.cwd(), "src");

  const expand = (html, depth = 0) => {
    if (depth > 20) {
      throw new Error("html-includes: include nesting too deep (cycle?)");
    }
    return html.replace(INCLUDE_RE, (_, quoted, bare) => {
      const file = resolve(base, quoted || bare);
      return expand(readFileSync(file, "utf8"), depth + 1);
    });
  };

  return {
    name: "html-includes",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => expand(html),
    },
    configureServer(server) {
      // Partials aren't module-graph nodes, so editing one triggers no HMR.
      // Watch the dir and force a full reload on change.
      const dir = resolve(base, "partials");
      server.watcher.add(dir);
      server.watcher.on("change", (file) => {
        if (file.startsWith(dir)) server.ws.send({ type: "full-reload" });
      });
    },
  };
}
