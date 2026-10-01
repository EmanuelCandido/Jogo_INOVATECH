import {test,expect,type Page} from '@playwright/test';
import {endingDialogue} from '../../src/content/ending';
import {lastSolutionSave} from './endingSave';
import {freezeIncome,mapReady} from './helpers';

async function seed(page:Page,save:string){
 // Seed once: a reload must read what the game itself saved.
 await page.addInitScript(value=>{if(!sessionStorage.getItem('ending-seeded')){localStorage.setItem('ecoquest.save.v1',value);sessionStorage.setItem('ending-seeded','1');}},save);
}
async function talk(page:Page){
 const conversation=page.getByRole('region',{name:'Conversa final com o companheiro'});
 for(const line of endingDialogue){
  await expect(conversation).toContainText(line.text.slice(0,24));
  await page.locator('.ending-dialogue .dialogue-continue').click();
 }
}

test('o último problema resolvido abre o final e o encerramento devolve o mapa',async({page})=>{
 test.setTimeout(150000);
 await freezeIncome(page);
 await seed(page,lastSolutionSave({misses:3}));
 await page.goto('./');
 await page.getByRole('button',{name:'Voltar à cidade →'}).click({timeout:90000});
 const conversation=page.getByRole('region',{name:'Conversa final com o companheiro'});
 await expect(conversation).toContainText('último problema',{timeout:30000});
 await page.getByRole('button',{name:'Ver a cidade →'}).click();
 await expect(page.locator('.ending-caption')).toContainText('Acesso ao prédio');
 await expect(page.locator('.marker.is-solved')).toHaveCount(1);
 await expect(page.locator('.journey-nav, .topbar')).toHaveCount(0);
 await page.getByRole('button',{name:'Pular passeio'}).click();
 await expect(page.locator('.marker.is-solved')).toHaveCount(10);
 await talk(page);
 const closing=page.getByRole('dialog',{name:'A Eco City mudou com você'});
 await expect(closing.locator('.ending-stats')).toContainText('10/10');
 await expect(closing.locator('.ending-stats')).toContainText('13decisões tomadas');
 await expect(closing.locator('.ending-stats')).toContainText('7acertos de primeira');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data.endingSeen)).toBe(true);
 await closing.getByRole('button',{name:'Continuar explorando'}).click();
 await expect(closing).toHaveCount(0);
 await mapReady(page);
 await expect(page.locator('.journey-nav')).toBeVisible();
 await page.reload();
 await mapReady(page);
 await expect(page.locator('.ending-dialogue, .ending-tour, .ending-closing')).toHaveCount(0);
});

test('o encerramento permite ver o final de novo',async({page})=>{
 test.setTimeout(150000);
 await seed(page,lastSolutionSave());
 await page.goto('./');
 await page.getByRole('button',{name:'Voltar à cidade →'}).click({timeout:90000});
 await page.getByRole('button',{name:'Ver a cidade →'}).click({timeout:30000});
 await page.getByRole('button',{name:'Pular passeio'}).click();
 await page.getByRole('button',{name:'Pular conversa'}).click();
 const closing=page.getByRole('dialog',{name:'A Eco City mudou com você'});
 await expect(closing).toContainText('Você acertou todas de primeira');
 await closing.getByRole('button',{name:'Ver o final de novo'}).click();
 await expect(page.getByRole('region',{name:'Conversa final com o companheiro'})).toContainText('último problema');
 await page.getByRole('button',{name:'Ver a cidade →'}).click();
 await expect(page.locator('.ending-caption')).toContainText('Acesso ao prédio');
});

test('o Extra das configurações repete o final depois de visto',async({page})=>{
 test.setTimeout(150000);
 await seed(page,lastSolutionSave({endingSeen:true,phase:'OVERVIEW'}));
 await page.goto('./');
 await mapReady(page);
 await expect(page.locator('.ending-dialogue')).toHaveCount(0);
 await page.getByRole('button',{name:'Configurações'}).click();
 await page.getByRole('button',{name:/O final: a cidade transformada/}).click();
 await expect(page.getByRole('dialog',{name:'Configurações'})).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Conversa final com o companheiro'})).toContainText('último problema');
});

test('o Extra repete a chegada do Impactus e volta ao mapa',async({page})=>{
 test.setTimeout(150000);
 await seed(page,lastSolutionSave({endingSeen:true,phase:'OVERVIEW'}));
 await page.goto('./');
 await mapReady(page);
 await page.getByRole('button',{name:'Configurações'}).click();
 await page.getByRole('button',{name:/A chegada: Impactus pousa na cidade/}).click();
 const arrival=page.getByRole('region',{name:'Chegada de Impactus à cidade'});
 await expect(arrival).toBeVisible();
 await expect(page.locator('.journey-nav, .topbar')).toHaveCount(0);
 await page.getByRole('button',{name:'Pular abertura'}).click();
 await expect(arrival).toHaveCount(0);
 await mapReady(page);
 await expect(page.locator('.journey-nav')).toBeVisible();
 await expect(page.locator('.dialogue-box')).toHaveCount(0);
});
