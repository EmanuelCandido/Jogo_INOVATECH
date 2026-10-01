import {test,expect} from '@playwright/test';
import {story} from '../../src/content/story';

test('Impactus chega voando à cidade antes da primeira fala',async({page},info)=>{
 test.setTimeout(240000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 const arrival=page.getByRole('region',{name:'Chegada de Impactus à cidade'});
 await expect(arrival).toBeVisible();
 await expect(page.locator('.dialogue-box')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Pular abertura'})).toBeFocused();
 await expect(arrival).toHaveAttribute('data-beat','landed',{timeout:180000});
 await expect(page.locator('.arrival-title')).toContainText('Eco City');
 await page.screenshot({path:info.outputPath('arrival-landed-'+info.project.name+'.png')});
 // Without skipping, the story follows and Impactus is the portrait of its first line.
 await expect(page.locator('.dialogue-body p')).toHaveText(story.intro[0],{timeout:60000});
 await expect(arrival).toHaveCount(0);
 await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose','character_intro');
 await expect(page.locator('.robot-stage')).toHaveCSS('opacity','1');
 // The first line is still the start of the story: a reload plays the arrival again.
 await page.reload();
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await expect(arrival).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(arrival).toHaveCount(0);
 await expect(page.locator('.dialogue-body p')).toHaveText(story.intro[0]);
 await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.reload();
 await expect(page.getByRole('button',{name:'JOGAR',exact:true})).toHaveCount(0);
 await expect(arrival).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('com movimento reduzido a história começa direto',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 await expect(page.locator('.dialogue-body p')).toHaveText(story.intro[0]);
 await expect(page.getByRole('region',{name:'Chegada de Impactus à cidade'})).toHaveCount(0);
});
