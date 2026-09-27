// Drag and zoom through the kept-frame path (src/game/staticFrame.ts) and
// compare the images with complete frames. Needs `npx vite preview --port 4175`
// (or URL=...). SHADOWS=OFF measures without shadows.
import {mkdirSync} from 'node:fs';
import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM??'/opt/pw-browsers/chromium',args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:360,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();page.setDefaultTimeout(400000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text().slice(0,200))});
await page.goto((process.env.URL??'http://127.0.0.1:4175/')+'?benchmark=1&cache=1'+(process.env.Q??''));
await page.waitForFunction(()=>!!window.ecoBenchmark);
await page.evaluate(shadows=>window.ecoBenchmark.setup({quality:'HIGH',renderScale:100,shadows,reducedMotion:true,ambientAnimation:false}),process.env.SHADOWS??'PRESET');
await page.waitForFunction(()=>window.ecoBenchmark.ready());
await page.addStyleTag({content:'.interface,.region-label,.marker,.hud,.game-ui{visibility:hidden!important}'});
await page.waitForTimeout(4000);await page.evaluate(()=>window.ecoBenchmark.draw());await page.waitForTimeout(3000);
mkdirSync('.tools/moving-frames',{recursive:true});
const out={errors};
// The final frame after a move may be spread over several frames.
const settled=async()=>{const before=await page.evaluate(()=>window.ecoBenchmark.staticFrameStats().full);await page.evaluate(()=>document.querySelector('canvas').classList.remove('dragging'));await page.waitForFunction(n=>window.ecoBenchmark.staticFrameStats().full>n,before);await page.waitForTimeout(500);};
const shot=name=>page.locator('canvas').screenshot({path:`.tools/moving-frames/${name}.png`});
const cmp=(a,b,t=1)=>JSON.parse(execFileSync('node',['scripts/compare-images.mjs',`.tools/moving-frames/${a}.png`,`.tools/moving-frames/${b}.png`,String(t),`.tools/moving-frames/diff-${a}-${b}.png`]).toString().trim().split('\n').pop());
await shot('rest');
// Steps run one per animation frame; the page records frame times.
const run=async(steps)=>page.evaluate(steps=>new Promise(done=>{
 const canvas=document.querySelector('canvas');canvas.classList.add('dragging');const before=window.ecoBenchmark.staticFrameStats(),times=[];let i=0,last=performance.now();
 const tick=()=>{const now=performance.now();times.push(now-last);last=now;
  if(i<steps.length){const [x,y,z]=steps[i++];window.ecoBenchmark.cameraStep(x,y,z);requestAnimationFrame(tick);}
  else{const after=window.ecoBenchmark.staticFrameStats();times.sort((a,b)=>a-b);done({full:after.full-before.full,moved:after.moved-before.moved,strips:after.strips-before.strips,medianMs:times[times.length>>1],worstMs:times[times.length-1]});}};
 requestAnimationFrame(tick);
}),steps);
out.pan=await run(Array.from({length:30},()=>[7.3,3.1,1]));
await shot('pan-moving');await settled();await shot('pan-settled');
await page.evaluate(()=>window.ecoBenchmark.draw());await page.waitForTimeout(1500);await shot('pan-full');
out.panSettledVsFull=cmp('pan-settled','pan-full');
await page.evaluate(()=>window.ecoBenchmark.draw());await page.waitForTimeout(1500);await shot('pan-full2');out.fullVsFull=cmp('pan-full','pan-full2');
out.panMovingVsFull=cmp('pan-moving','pan-full',8);
out.zoomOut=await run(Array.from({length:20},()=>[0,0,.985]));
await shot('zoom-moving');await settled();await shot('zoom-settled');
out.zoomMovingVsSettled=cmp('zoom-moving','zoom-settled',8);
out.zoomIn=await run(Array.from({length:20},()=>[2,0,1/.985]));await shot('zoomin-moving');await settled();await shot('zoomin-settled');
await page.evaluate(()=>window.ecoBenchmark.draw());await page.waitForTimeout(1500);await shot('zoomin-full');
out.zoomSettledVsFull=cmp('zoomin-settled','zoomin-full');out.zoominMovingVsFull=cmp('zoomin-moving','zoomin-full',8);
out.stats=await page.evaluate(()=>{const s=window.ecoBenchmark.staticFrameStats();return {full:s.full,reused:s.reused,moved:s.moved,strips:s.strips,drawMs:s.drawMs,moveMs:s.moveMs,reasons:Object.entries(s.reasons).filter(r=>r[1]<500).map(r=>[r[0].slice(0,110),r[1]]).sort((a,b)=>b[1]-a[1]).slice(0,12)};});
console.log(JSON.stringify(out,null,1));
await browser.close();
