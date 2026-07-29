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
// The leading group captures the include's own indentation when it sits alone on
// a line, so the hand-off build can re-indent the spliced body to match. For an
// inline include (`<div data-catalog><!--#include … --></div>`) `^` fails and the
// group stays undefined.
const INCLUDE_RE = /(^[ \t]*)?<!--\s*#include\s+(?:"([^"]+)"|(\S+?))\s*-->/gm;

// `markers: true` (used by the PHP hand-off build, scripts/build-handoff.mjs)
// wraps every splice in a comment pair that names the Blade directive it becomes:
//
//   <!-- @include('partials.header') ▼ src: partials/header.html -->
//   …the partial's markup…
//   <!-- ▲ /@include('partials.header') -->
//
// Porting is then mechanical: delete everything between the markers and paste
// the line the marker gives you. The normal builds splice silently.
const bladeName = (path) =>
  path
    .replace(/\.html$/, "")
    .split("/")
    .join(".");

export function htmlIncludes({ root, markers = false } = {}) {
  const base = root || resolve(process.cwd(), "src");

  const expand = (html, depth = 0) => {
    if (depth > 20) {
      throw new Error("html-includes: include nesting too deep (cycle?)");
    }
    return html.replace(INCLUDE_RE, (_, indent, quoted, bare) => {
      const path = quoted || bare;
      const file = resolve(base, path);
      const body = expand(readFileSync(file, "utf8"), depth + 1);
      if (!markers) return (indent || "") + body;

      const pad = indent || "";
      // Re-indent the partial to the include's own depth; blank lines stay blank.
      const indented = body
        .trimEnd()
        .split("\n")
        .map((line) => (line.trim() ? pad + line : line))
        .join("\n");
      const directive = `@include('${bladeName(path)}')`;
      return [
        `${pad}<!-- ${directive} ▼ источник: ${path} -->`,
        indented,
        `${pad}<!-- ▲ /${directive} -->`,
      ].join("\n");
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
