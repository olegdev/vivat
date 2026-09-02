import { chromium } from 'playwright';
const dir='/tmp/claude-1000/-srv-vivat-dev/f00e3f24-dd90-440c-ae70-5698b9d6202a/scratchpad';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 900 } });
await p.goto('http://localhost:4173/pages/customer/order.html');
await p.waitForTimeout(1000);
await p.screenshot({ path: dir+'/c3-step0.png' });
await b.close();
