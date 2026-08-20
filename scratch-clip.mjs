import { chromium } from "playwright";
const [page, w, x, y, cw, ch, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto(`file:///srv/vivat/dev/dist/pages/${page}.html`);
await p.waitForTimeout(300);
await p.screenshot({ path: out, clip: { x: +x, y: +y, width: +cw, height: +ch }, fullPage: true });
await b.close();
