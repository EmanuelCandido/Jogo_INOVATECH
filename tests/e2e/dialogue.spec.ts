import {test,expect} from '@playwright/test';
test('cinco poses, tutorial com tentativas, teclado e restauração',async({page})=>{
 test.setTimeout(180000);await page.goto('/');
 const portrait=page.getByAltText('Robô companheiro da jornada');
 await expect(portrait).toBeVisible();await expect(portrait).toHaveJSProperty('naturalWidth',768);
 await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_intro');
 await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.reload();await expect(page.locator('.dialogue-body p')).toContainText('À primeira vista');
 for(let i=1;i<7;i++){
  if(i===3)await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_alert');
  await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 }
 await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_thinking');
 await page.getByRole('button',{name:'Pensar no primeiro passo'}).click();
 for(const id of ['rush','ignore']){
  await page.locator('[data-choice-id="'+id+'"]').click();await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_failure');
  await expect(page.locator('.balance')).toContainText('1.500');await page.getByRole('button',{name:'Tentar novamente'}).click();
 }
 await page.locator('[data-choice-id="observe"]').click();await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_success');
 await expect(portrait).toHaveJSProperty('naturalWidth',768);
 await page.screenshot({path:'docs/screenshots/robot-tutorial-'+test.info().project.name+'.png',animations:'disabled'});
 await page.getByRole('button',{name:'Investigar a cidade'}).focus();await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Centralizar mapa'}).click();await expect(page.locator('.marker')).toHaveCount(2);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data.decisions)).toEqual([]);
});
