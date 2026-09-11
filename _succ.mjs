import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [w,h,tag] of [[1440,900,'d'],[390,844,'m']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://127.0.0.1:8899/pages/customer/main.html');
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('[data-modal="dealer-success"]').classList.add('is-open'));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/claude-1000/-srv-vivat-dev/ebc3093c-d4ea-4e9a-a22f-73141eaa380d/scratchpad/succ-${tag}.png` });
  console.log(tag, await p.evaluate(() => { const r = document.querySelector('[data-modal="dealer-success"] .modal-panel').getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; }));
  await p.close();
}
await b.close();
