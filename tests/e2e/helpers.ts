import {expect,type Page} from '@playwright/test';
export async function mapReady(page:Page){
 await expect(page.locator('canvas')).toHaveAttribute('tabindex','0',{timeout:60000});
}
export async function resetMap(page:Page){
 await mapReady(page);
 await page.locator('canvas').focus();
 await page.keyboard.press('Home');
}
export async function cameraZoom(page:Page){
 return page.evaluate(()=>(window as unknown as {ecoBenchmark:{cameraState:()=>{zoom:number}}}).ecoBenchmark.cameraState().zoom);
}
export async function start(page:Page){
 await page.goto('/');
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 for(let i=0;i<7;i++)await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.getByRole('button',{name:'Pensar no primeiro passo'}).click();
 await page.locator('[data-choice-id="observe"]').click();
 await page.getByRole('button',{name:'Investigar a cidade'}).click();
 await resetMap(page);
}
export async function question(page:Page,id='accessibility_01'){
 // The journey panel can cover an eastern district in the new composition.
 // Use the real collapse control before interacting with a world marker.
 const journey=page.getByRole('button',{name:/NOSSA JORNADA/});
 if(await journey.getAttribute('aria-expanded')==='true')await journey.click();
 await page.locator('.marker[data-problem="'+id+'"]').click();
 await expect(page.getByRole('region',{name:'Observação do companheiro'})).toBeVisible({timeout:15000});
 await page.getByRole('button',{name:'Entender a situação'}).click();
 await expect(page.getByRole('region',{name:'Contexto do problema'})).toBeVisible();
 await page.getByRole('button',{name:'Pensar nas soluções'}).click();
 await expect(page.locator('.alternative')).toHaveCount(3);
}
