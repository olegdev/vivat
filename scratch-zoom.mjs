import { chromium } from "playwright";
import { writeFileSync, readFileSync } from "node:fs";
const [file, x, y, w, h, scale, out] = process.argv.slice(2);
const tmp = "/tmp/claude-1000/-srv-vivat-dev/153dfaed-04d0-483d-8558-e929d5df0cd9/scratchpad/_z.html";
writeFileSync(tmp, `<style>html,body{margin:0;padding:0;background:#fff;overflow:hidden}
#box{width:${+w * +scale}px;height:${+h * +scale}px;overflow:hidden;position:relative}
img{position:absolute;left:${-x * +scale}px;top:${-y * +scale}px;transform-origin:0 0;transform:scale(${scale});image-rendering:pixelated}</style>
<div id="box"><img src="data:image/png;base64,${readFileSync(file).toString("base64")}"></div>`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Math.ceil(+w * +scale), height: Math.ceil(+h * +scale) } });
await p.goto("file://" + tmp);
await p.waitForTimeout(200);
await p.screenshot({ path: out });
await b.close();
