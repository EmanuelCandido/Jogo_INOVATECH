import {expect,type Page} from '@playwright/test';
export async function start(page:Page){
 await page.goto('/');
 for(let i=0;i<7;i++)await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.getByRole('button',{name:'Pensar no primeiro passo'}).click();
 await page.locator('[data-choice-id="observe"]').click();
 await page.getByRole('button',{name:'Investigar a cidade'}).click();
 await page.getByRole('button',{name:'Centralizar mapa'}).click();
}
export async function question(page:Page,id='accessibility_01'){
 await page.locator('.marker[data-problem="'+id+'"]').click();
 await expect(page.getByRole('region',{name:'Observação do companheiro'})).toBeVisible();
 await page.getByRole('button',{name:'Entender a situação'}).click();
 await expect(page.getByRole('region',{name:'Contexto do problema'})).toBeVisible();
 await page.getByRole('button',{name:'Pensar nas soluções'}).click();
 await expect(page.locator('.alternative')).toHaveCount(3);
}
