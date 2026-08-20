import { chromium } from "playwright";
const [page, w, ...sels] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto(`file:///srv/vivat/dev/dist/pages/${page}.html`);
await p.waitForTimeout(200);
for (const s of sels) console.log(s, JSON.stringify(await p.$$eval(s, (els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))));
await b.close();
