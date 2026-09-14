import {overview} from '../helpers';
import { test,expect } from "@playwright/test";
import { initialProgress } from "../../src/game/save";
import { NarrativeManager } from "../../src/game/NarrativeManager";

test("exploração por arrasto, zoom, limites, centralização e retorno da missão",async({page,isMobile})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  const progress=overview();
  await page.addInitScript(saved=>localStorage.setItem("ecoquest.save.v1",saved),JSON.stringify({version:1,data:progress}));
  await page.goto("/");
  const closer=page.getByRole("button",{name:"Aproximar mapa"});
  const reset=page.getByRole("button",{name:"Centralizar mapa"});
  const output=page.getByLabel("Zoom do mapa");
  const marker=page.getByRole("button",{name:"Analisar: Acesso ao prédio"});
  const saved=await page.evaluate(()=>localStorage.getItem("ecoquest.save.v1"));
  // Click waits for scene readiness, including a cold GLB/shader load.
  await closer.click();await expect(output).toHaveText("125%");
  await reset.click();await expect(output).toHaveText("100%");
  const before=(await marker.boundingBox())!;
  const {width,height}=page.viewportSize()!;
  if(isMobile){
    const cdp=await page.context().newCDPSession(page);
    const x=width*.45,y=height*.59;
    await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y,id:1}]});
    await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x+55,y:y-15,id:1}]});
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await expect.poll(async()=>Math.abs((await marker.boundingBox())!.x-before.x)).toBeGreaterThan(20);
    // The bounded mobile framing moves markers under the former fixed pinch
    // coordinates. Start both fingers on map pixels, not on a mission button.
    const pinch=await page.evaluate(()=>{
      for(const fy of [.47,.66,.73,.38])for(const fx of [.4,.55,.65]){
        const x=innerWidth*fx,y=innerHeight*fy;
        if([-60,-25,0,25,60].every(dx=>document.elementFromPoint(x+dx,y)?.tagName==='CANVAS'))return {x,y};
      }
      throw new Error('Sem área livre para testar a pinça no mapa');
    });
    await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:pinch.x-25,y:pinch.y,id:1},{x:pinch.x+25,y:pinch.y,id:2}]});
    await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:pinch.x-60,y:pinch.y,id:1},{x:pinch.x+60,y:pinch.y,id:2}]});
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await expect.poll(async()=>parseInt((await output.textContent())!)).toBeGreaterThan(150);
    await cdp.detach();
  } else {
    await page.mouse.move(width*.35,height*.6);await page.mouse.down();await page.mouse.move(width*.35+90,height*.6-20,{steps:6});await page.mouse.up();
    await expect.poll(async()=>Math.abs((await marker.boundingBox())!.x-before.x)).toBeGreaterThan(30);
    await page.mouse.wheel(0,-1200);await expect.poll(async()=>parseInt((await output.textContent())!)).toBeGreaterThan(150);
  }
  // A focused canvas also supports users who cannot drag or pinch.
  await page.locator("canvas").focus();
  await page.keyboard.press("Home");await expect(output).toHaveText("100%");
  await page.keyboard.press("ArrowRight");
  await expect.poll(async()=>Math.abs((await marker.boundingBox())!.x-before.x)).toBeGreaterThan(5);
  for(let i=0;i<8;i++)await page.keyboard.press("+");
  await expect(output).toHaveText("350%");await expect(closer).toBeDisabled();
  await reset.click();await expect(output).toHaveText("100%");
  expect(await page.evaluate(()=>localStorage.getItem("ecoquest.save.v1"))).toBe(saved);
  await marker.click();await page.getByRole("button",{name:"Entender a situação"}).click();await page.getByRole("button",{name:"Pensar nas soluções"}).click();
  await expect(page.getByRole("navigation",{name:"Navegação do mapa"})).toHaveCount(0);
  await page.locator(".alternative").first().click();
  await page.getByRole("button",{name:"Voltar à cidade"}).click();
  // Wait for the camera transition itself before checking its resulting controls.
  // Software WebGL on emulated phones may need more than an assertion's 5 seconds.
  await page.getByText('Voltando à cidade…',{exact:true}).waitFor({state:'hidden'});
  await expect(closer).toBeEnabled();await expect(output).toHaveText("100%");
  await expect(page.getByRole("button",{name:"Analisar: Lixo nas ruas"})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
