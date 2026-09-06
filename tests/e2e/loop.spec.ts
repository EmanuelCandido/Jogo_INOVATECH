import {test,expect} from '@playwright/test';
import {start,question} from './helpers';
import {problems} from '../../src/content/problems';
import {questions} from '../../src/content/questions';
test('narrativa, tutorial, decisões na cidade, descoberta e conclusão',async({page},info)=>{
 test.setTimeout(360000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/WebGL|THREE|shader/i.test(m.text()))errors.push(m.text());});
 await start(page);
 await expect(page.locator('.marker')).toHaveCount(2);
 const order=['accessibility_01','pollution_01','pollution_02','security_01','security_02','nature_01','nature_02','health_01','health_02','accessibility_02'];
 for(const [i,id]of order.entries()){
  if(info.project.name!=='desktop'&&i>=2)break;
  await question(page,id);
  const p=problems.find(p=>p.id===id)!,a=questions[p.questionId].alternatives.find(a=>a.effectiveness==='COMPLETE')!;
  await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_thinking');
  await page.locator('[data-choice-id="'+a.id+'"]').click();
  await expect(page.locator('[data-effectiveness="COMPLETE"]')).toBeVisible();
  await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_success');
  if(i===0){await expect(page.locator('.balance')).toContainText('1.350');await page.reload();await expect(page.locator('[data-effectiveness="COMPLETE"]')).toBeVisible();}
  await expect(page.getByRole('button',{name:'Voltar à cidade'})).toBeEnabled({timeout:30000});
  if(info.project.name==='desktop')await page.screenshot({path:'docs/screenshots/situation-'+id+'-solved.png',animations:'disabled'});
  await page.getByRole('button',{name:'Voltar à cidade'}).click();
  await page.getByRole('button',{name:'Centralizar mapa'}).click();
 }
 if(info.project.name==='desktop'){await expect(page.locator('.balance')).toContainText('150');await expect(page.locator('.quest-body')).toContainText('10 / 10');await expect(page.locator('.marker')).toHaveCount(0);}
 else await expect(page.locator('.marker')).toHaveCount(2);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data);
 expect(saved.decisions).toHaveLength(info.project.name==='desktop'?10:2);expect(saved.tutorialCompleted).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
test('temporário, reavaliação, nenhuma melhoria e recursos insuficientes',async({page})=>{
 test.setTimeout(180000);await start(page);await question(page);
 await page.locator('[data-choice-id="support"]').click();await expect(page.locator('[data-effectiveness="TEMPORARY"]')).toBeVisible();
 await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_failure');
 await page.getByRole('button',{name:'Voltar à cidade'}).click();
 await expect(page.locator('[data-problem="accessibility_01"]')).toHaveAttribute('data-visual-state','temporary');
 await question(page);await page.locator('[data-choice-id="campaign"]').click();await expect(page.locator('[data-effectiveness="NONE"]')).toBeVisible();
 await page.getByRole('button',{name:'Voltar à cidade'}).click();
 await expect(page.locator('[data-problem="accessibility_01"]')).toHaveAttribute('data-visual-state','initial');
 await question(page);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ecoquest.save.v1')!);s.data.coins=50;localStorage.setItem('ecoquest.save.v1',JSON.stringify(s));});
 await page.reload();for(const button of await page.locator('.alternative').all())await expect(button).toBeDisabled();
 await page.getByRole('button',{name:'Decidir depois · voltar ao mapa'}).click();await page.getByRole('button',{name:'Centralizar mapa'}).click();
 await expect(page.locator('.balance')).toContainText('50');
});
