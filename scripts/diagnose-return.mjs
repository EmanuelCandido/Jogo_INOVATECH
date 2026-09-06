import {chromium,devices} from '@playwright/test';
const browser=await chromium.launch({args:['--use-angle=swiftshader','--enable-webgl']});
try{
  const page=await browser.newPage({...devices['Pixel 7']});
  page.on('pageerror',e=>console.error('pageerror',e.message));
  await page.addInitScript(()=>{
    window.sceneTiming={frames:[],lastFrame:0};
    const frame=t=>{if(window.sceneTiming.lastFrame)window.sceneTiming.frames.push(t-window.sceneTiming.lastFrame);window.sceneTiming.lastFrame=t;requestAnimationFrame(frame);};
    requestAnimationFrame(frame);
  });
  const snapshot=async label=>console.log(label,await page.evaluate(()=>({
    phase:JSON.parse(localStorage.getItem('ecoquest.save.v1')??'{}').data?.phase,
    loading:document.querySelector('.loading')?.textContent,
    canvas:!!document.querySelector('canvas'),
    sinceLoad:performance.now(),
    models:performance.getEntriesByType('resource').filter(r=>r.name.includes('/assets/models/')).map(r=>({name:r.name.split('/').at(-1),end:Math.round(r.responseEnd)})),
    recentFrameTimes:window.sceneTiming.frames.slice(-12).map(Math.round),
  })));
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await page.getByRole('button',{name:'Vamos conhecer a cidade'}).click();
  await page.getByRole('button',{name:'Analisar: Uma praça para todos'}).click();
  await page.getByRole('button',{name:'Pensar nas soluções'}).click();
  await page.locator('.alternative').first().click();
  await page.locator('[data-effectiveness=FULL]').waitFor();
  await page.reload();
  await page.locator('[data-effectiveness=FULL]').waitFor();
  await snapshot('result immediately after reload');
  const start=Date.now();
  await page.getByRole('button',{name:'Voltar à cidade'}).click();
  await snapshot('return clicked');
  await page.getByRole('button',{name:'Analisar: Cuidar além da limpeza'}).waitFor({timeout:20000});
  console.log('return elapsed ms',Date.now()-start);await snapshot('overview');
}finally{await browser.close();}
