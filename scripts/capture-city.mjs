import { chromium, devices, expect } from "@playwright/test";
import {mkdir} from "node:fs/promises";
await mkdir("docs/screenshots",{recursive:true});
const browser=await chromium.launch({args:["--use-angle=swiftshader","--enable-webgl"]});
for(const [name,options] of [["city-reference",{viewport:{width:1672,height:941}}],["city-desktop",{viewport:{width:1440,height:900}}],["city-mobile",{...devices["Pixel 7"]}],["city-small",{viewport:{width:360,height:640},isMobile:true,hasTouch:true}]]){
  if(process.argv[2] && name!==process.argv[2])continue;
  const page=await browser.newPage(options);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  page.on("response",r=>{if(r.url().includes("/assets/models/")&&!r.ok())errors.push(`${r.status()} ${r.url()}`);});
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("button",{name:"Continuar →",exact:true}).click();
  await page.getByRole("button",{name:"Vamos conhecer a cidade"}).click();
  const reset=page.getByRole("button",{name:"Centralizar mapa"});
  await reset.click();
  await expect(page.getByLabel("Zoom do mapa")).toHaveText("100%");
  await page.screenshot({path:`docs/screenshots/${name}-overview.png`});
  if(name==="city-desktop"||name==="city-reference"){
    const style=await page.addStyleTag({content:".interface,.region-label,.marker {visibility:hidden!important}"});
    await page.screenshot({path:`docs/screenshots/${name==='city-reference'?'reference-composition':'city-landscape'}.png`});
    await style.evaluate(el=>el.remove());
  }
  await page.getByRole("button",{name:"Aproximar mapa"}).click();
  await page.getByRole("button",{name:"Aproximar mapa"}).click();
  await page.screenshot({path:`docs/screenshots/${name}-zoom.png`});
  if(process.argv.includes('--overview-only')){if(errors.length)throw new Error(errors.join('; '));console.log(name,'overview + zoom',await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));await page.close();continue;}
  await reset.click();
  await page.getByRole("button",{name:"Analisar: Uma praça para todos"}).click();
  await page.getByRole("button",{name:"Pensar nas soluções"}).click();
  await page.locator(".alternative").first().click();
  await page.getByRole("button",{name:"Voltar à cidade"}).click();
  await reset.click();
  await page.getByRole("button",{name:"Analisar: Cuidar além da limpeza"}).click();
  await page.getByRole("button",{name:"Pensar nas soluções"}).click();
  await page.screenshot({path:`docs/screenshots/${name}-river-mission.png`});
  await page.locator(".alternative").first().click();
  await page.getByRole("button",{name:"Voltar à cidade"}).click();
  await reset.click();
  await expect(page.getByLabel("Zoom do mapa")).toHaveText("100%");
  console.log(name,await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,zoom:document.querySelector('[aria-label="Zoom do mapa"]').textContent,errors:document.querySelectorAll('.scene-error').length})));
  if(errors.length)throw new Error(errors.join("; "));
  await page.close();
}
await browser.close();
