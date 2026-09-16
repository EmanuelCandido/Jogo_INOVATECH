import {describe,it,expect} from 'vitest';
import {createRenderPathSelection} from '../src/game/renderPathSelection';

function simulate(cost:(enabled:boolean,block:number,frame:number)=>number,initial=true){
 const selection=createRenderPathSelection(initial);let now=1,enabled=initial,frames=0;
 while(!selection.complete&&frames<10000){
  now+=cost(enabled,selection.snapshot().block,frames++);enabled=selection.tick(now,true);
 }
 expect(selection.complete).toBe(true);return {selection,now,frames};
}
describe('seleção medida da passagem de profundidade',()=>{
 it('preserva o ganho da integrada e evita a regressão da dedicada',()=>{
  const integrated=simulate(enabled=>enabled?108:150),dedicated=simulate(enabled=>enabled?10.4:9.1);
  expect(integrated.selection.preferred).toBe(true);expect(dedicated.selection.preferred).toBe(false);
  for(const {selection}of [integrated,dedicated]){
   expect(selection.snapshot().samples).toHaveLength(4);
   expect(selection.snapshot().samples.every(s=>s.frames>=12)).toBe(true);
  }
 });
 it('usa uma passagem em empate de refresh ou ganho abaixo de 5%',()=>{
  expect(simulate(()=>1000/120).selection.preferred).toBe(false);
  expect(simulate(enabled=>enabled?19.5:20).selection.preferred).toBe(false);
 });
 it('não confunde aquecimento progressivo com benefício da candidata',()=>{
  expect(simulate((_enabled,block)=>[20,16,12,8][Math.min(block,3)]).selection.preferred).toBe(false);
 });
 it('rejeita uma média melhor com picos repetidos na segunda passagem',()=>{
  expect(simulate((enabled,_block,frame)=>enabled?(frame%8===0?60:10):20).selection.preferred).toBe(false);
 });
 it('interrompe a comparação durante gestos/câmera/carga e não reutiliza amostras parciais',()=>{
  const s=createRenderPathSelection(true);let now=1;
  while(s.snapshot().block<1){now+=16;s.tick(now,true);}
  expect(s.snapshot().samples).toHaveLength(1);
  for(let i=0;i<100;i++){now+=16;expect(s.tick(now,false)).toBe(true);}
  expect(s.snapshot()).toMatchObject({stage:'waiting',block:0,discarded:1,samples:[]});
  now+=16;s.tick(now,true);expect(s.snapshot().stage).toBe('waiting');
  now+=500;s.tick(now,true);expect(s.snapshot().stage).toBe('waiting');
 });
 it('descarta pausa de aba e ignora o tempo de demanda adormecida',()=>{
  const s=createRenderPathSelection();let now=1;
  while(s.snapshot().stage!=='sampling'){now+=16;s.tick(now,true);}
  s.tick(now+30000,true);expect(s.snapshot()).toMatchObject({stage:'waiting',samples:[],preferred:true});
 });
 it('mantém o caminho escolhido no movimento e preserva-o ao reiniciar por resolução',()=>{
  const {selection:s,now}=simulate(enabled=>enabled?11:9);
  for(let i=1;i<30;i++)expect(s.tick(now+i*16,false)).toBe(false);
  expect(s.complete).toBe(true);s.reset(now+1000);
  expect(s.complete).toBe(false);expect(s.tick(now+1016,false)).toBe(false);
 });
 it('exclui o aquecimento de ambos os caminhos das amostras',()=>{
  const s=createRenderPathSelection();let now=1,firstWarm=true;
  for(let i=0;i<2000&&!s.complete;i++){
   const stage=s.snapshot().stage;
   const cost=stage==='warmup'&&firstWarm?500:20;
   if(stage==='warmup')firstWarm=false;else firstWarm=true;
   now+=cost;s.tick(now,true);
  }
  expect(s.complete).toBe(true);expect(s.snapshot().samples.every(sample=>sample.mean===20&&sample.p95===20)).toBe(true);
 });
});
