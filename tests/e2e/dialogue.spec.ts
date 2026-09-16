import {test,expect,type Page} from '@playwright/test';
import {story} from '../../src/content/story';

async function expectPose(page:Page,pose:string,src:string,width=768){
 const portrait=page.getByAltText('Robô companheiro da jornada');
 await expect(page.locator('.robot-stage')).toHaveAttribute('data-pose',pose);
 await expect(portrait).toHaveAttribute('src',src);
 await expect(portrait).toHaveJSProperty('naturalWidth',width);
 await expect(portrait).toHaveJSProperty('complete',true);
 // The entire image width must fit: checking only the stage misses clipped arms.
 const imageBounds=(await portrait.boundingBox())!;
 const stageBounds=(await page.locator('.robot-stage').boundingBox())!;
 expect(imageBounds.x).toBeGreaterThanOrEqual(stageBounds.x-.5);
 expect(imageBounds.x+imageBounds.width).toBeLessThanOrEqual(stageBounds.x+stageBounds.width+.5);
 expect(imageBounds.x).toBeGreaterThanOrEqual(0);
 expect(imageBounds.x+imageBounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
}

test('Impactus, tutorial com tentativas, teclado e restauração',async({page})=>{
 test.setTimeout(180000);await page.goto('/');
 await page.getByRole('button',{name:'JOGAR',exact:true}).click();
 const portrait=page.getByAltText('Robô companheiro da jornada');
 await expect(portrait).toBeVisible();await expect(portrait).toHaveJSProperty('naturalWidth', 2508);
 await expectPose(page,'character_intro','/assets/ui/figma/impactus.webp',2508);
 await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 await page.reload();await expect(page.locator('.dialogue-body p')).toContainText('À primeira vista');
 for(let i=1;i<7;i++){
  if(i===3){
   await expectPose(page,'character_alert','/assets/portraits/robot/pose-3.webp');
   await page.screenshot({path:test.info().outputPath('robot-alert.png'),animations:'disabled'});
  }
  await page.getByRole('button',{name:'Continuar →',exact:true}).click();
 }
 await expectPose(page,'character_thinking','/assets/portraits/robot/pose-2.webp');
 await page.screenshot({path:test.info().outputPath('robot-thinking.png'),animations:'disabled'});
 await page.getByRole('button',{name:'Pensar no primeiro passo'}).click();
 for(const id of ['rush','ignore']){
  await page.locator('[data-choice-id="'+id+'"]').click();await expectPose(page,'character_failure','/assets/portraits/robot/pose-5.webp');
  await expect(page.locator('.balance')).toContainText('1.500');await page.getByRole('button',{name:'Tentar novamente'}).click();
  await expectPose(page,'character_thinking','/assets/portraits/robot/pose-2.webp');
 }
 await page.locator('[data-choice-id="observe"]').click();await expectPose(page,'character_success','/assets/portraits/robot/pose-4.webp');
 await page.screenshot({path:test.info().outputPath('robot-tutorial-'+test.info().project.name+'.png'),animations:'disabled'});
 await page.getByRole('button',{name:'Investigar a cidade'}).focus();await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Centralizar mapa'}).click();await expect(page.locator('.marker')).toHaveCount(2);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ecoquest.save.v1')!).data.decisions)).toEqual([]);
});

test('pose atrasada não apaga o retrato nem substitui uma pose mais recente',async({page},info)=>{
 test.skip(info.project.name!=='desktop','Uma conexão atrasada basta para verificar a ordem de carregamento.');
 test.setTimeout(90000);
 let release!:()=>void;
 const ready=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/portraits/robot/pose-3.webp',async route=>{await ready;await route.continue();});
 try{
  await page.goto('/');
  await page.getByRole('button',{name:'JOGAR',exact:true}).click();
  await expectPose(page,'character_intro','/assets/ui/figma/impactus.webp',2508);
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await expect(page.locator('.dialogue-body p')).toHaveText(story.intro[3]);
  await expectPose(page,'character_intro','/assets/ui/figma/impactus.webp',2508);
  await page.getByRole('button',{name:'Continuar →',exact:true}).click();
  await expectPose(page,'character_thinking','/assets/portraits/robot/pose-2.webp');
  const response=page.waitForResponse('**/portraits/robot/pose-3.webp');
  release();
  await (await response).finished();
  // Decode the now-cached image and flush rendering to expose a stale completion.
  await page.evaluate(async()=>{
   const image=new Image();image.src='/assets/portraits/robot/pose-3.webp';await image.decode();
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  });
  await expectPose(page,'character_thinking','/assets/portraits/robot/pose-2.webp');
 }finally{release();}
});
