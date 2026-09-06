import {describe,expect,it} from 'vitest';
import {decodeSave,initialProgress} from '../src/game/save';
import {graphicsPixelRatio,graphicsPresets,graphicsTiers,keepDetail,lowerGraphics,recommendGraphics,resolveGraphics} from '../src/config/graphics';
import {cityDecorations} from '../src/config/cityDetails';
import {cityLots,forest,lotPaving} from '../src/config/districts';
import {roadPlacements} from '../src/config/infrastructure';
import {landscapeDetails} from '../src/config/landscape';
import {onLand} from '../src/config/terrain';
import {assetRegistry} from '../src/assets/registry';

describe('qualidade gráfica e compatibilidade',()=>{
 it('migra preferências antigas sem perder a partida nem trocar a qualidade escolhida',()=>{
  const s=initialProgress();s.coins=735;
  const legacy={...s,settings:{quality:'HIGH',reducedMotion:true}};
  const restored=decodeSave(JSON.stringify({version:1,data:legacy}));
  expect(restored.coins).toBe(735);expect(restored.problemStates).toEqual(s.problemStates);
  expect(restored.settings).toEqual({quality:'HIGH',reducedMotion:true,renderScale:100,shadows:'PRESET',ambientAnimation:true,showPerformance:false});
 });
 it('salva e restaura todos os perfis, limitando valores inválidos nas novas opções',()=>{
  for(const quality of ['AUTO',...graphicsTiers] as const){
   const s=initialProgress();s.settings={...s.settings,quality,renderScale:85,shadows:'OFF',ambientAnimation:false,showPerformance:true};
   expect(decodeSave(JSON.stringify({version:1,data:s}))).toEqual(s);
  }
  const s=initialProgress(),data={...s,settings:{...s.settings,renderScale:999,shadows:'invalid',ambientAnimation:'yes'}};
  expect(decodeSave(JSON.stringify({version:1,data})).settings).toMatchObject({renderScale:150,shadows:'PRESET',ambientAnimation:true});
 });
 it('respeita escolhas manuais, sombras independentes e redução de movimento',()=>{
  const settings={...initialProgress().settings,quality:'ULTRA' as const,shadows:'OFF' as const,reducedMotion:true};
  expect(resolveGraphics(settings,'MINIMUM')).toMatchObject({tier:'ULTRA',shadows:false,animate:false,cityDetail:2});
  expect(resolveGraphics({...settings,quality:'AUTO'},'LOW').tier).toBe('LOW');
 });
 it('começa conservador em dispositivos limitados e só reduz o automático após medição lenta',()=>{
  expect(recommendGraphics({cores:16,memory:8})).toBe('HIGH');
  expect(recommendGraphics({cores:8,memory:8,coarse:true})).toBe('MEDIUM');
  expect(recommendGraphics({cores:4,memory:4})).toBe('LOW');
  expect(recommendGraphics({software:true,cores:16,memory:8})).toBe('MINIMUM');
  expect(lowerGraphics('HIGH',55)).toBe('MEDIUM');expect(lowerGraphics('HIGH',17)).toBe('HIGH');expect(lowerGraphics('MINIMUM',400)).toBe('MINIMUM');
 });
 it('limita pixels em 4K e celulares de alta densidade, permitindo resolução abaixo da nativa',()=>{
  for(const [width,height,dpr] of [[3840,2160,2],[412,915,3],[16000,9000,2]])for(const tier of graphicsTiers){
   const p=graphicsPresets[tier],ratio=graphicsPixelRatio(width,height,dpr,p,150);
   expect(width*height*ratio*ratio).toBeLessThanOrEqual(p.maxPixels+1);
   expect(Math.max(width,height)*ratio).toBeLessThanOrEqual(8192);
  }
  expect(graphicsPixelRatio(1440,900,1,graphicsPresets.MINIMUM,60)).toBeLessThan(.6);
  expect(graphicsPixelRatio(1440,900,1,graphicsPresets.ULTRA,150)).toBeGreaterThan(1);
 });
 it('reduz efetivamente a vegetação, mantendo os grupos e o kit principal íntegros',()=>{
  const counts=graphicsTiers.map(t=>forest.filter((_,i)=>keepDetail(i,graphicsPresets[t].forestDensity)).length);
  expect(counts[0]).toBeLessThan(counts.at(-1)!/5);
  expect(counts).toEqual([...counts].sort((a,b)=>a-b));
  expect(cityLots).toHaveLength(77);
  const low=landscapeDetails.filter(p=>!p.category||keepDetail(p.cluster!,graphicsPresets.LOW.undergrowth));
  expect(low.length).toBeLessThan(landscapeDetails.length*.5);
  for(const p of landscapeDetails.filter(p=>!p.category))expect(low.includes(p)).toBe(true);
 });
});

describe('conteúdo de Alta e Ultra',()=>{
 it('acrescenta conjuntos completos e uma camada Ultra maior que Alta',()=>{
  const high=cityDecorations.filter(g=>g.tier===1),ultra=cityDecorations.filter(g=>g.tier===2);
  expect(high.length).toBeGreaterThan(30);expect(ultra.length).toBeGreaterThan(high.length);
  expect(new Set(cityDecorations.map(g=>g.kind)).size).toBeGreaterThanOrEqual(8);
  for(const group of cityDecorations){
   for(const p of [...group.details,...group.assets]){
    expect(p.position.every(Number.isFinite)).toBe(true);expect(p.scale!.every(v=>Number.isFinite(v)&&v>0)).toBe(true);
    expect(onLand(p.position[0],p.position[2]),group.id).toBe(true);
   }
   for(const p of group.assets)expect(assetRegistry[p.asset]).toBeDefined();
  }
 });
 it('mantém os novos bicicletários e jardineiras fora de pistas e entradas de edifícios',()=>{
  const collisions:string[]=[];
  for(const g of cityDecorations){
   const f=g.footprint;if(!f)continue;
   for(const p of [...roadPlacements,...lotPaving])if(Math.abs(f.x-p.position[0])<p.scale![0]/2+f.radius&&Math.abs(f.z-p.position[2])<p.scale![2]/2+f.radius)collisions.push(g.id);
  }
  expect(collisions).toEqual([]);
 });
});
