import {describe,expect,it} from 'vitest';
import {ProblemManager} from '../src/game/ProblemManager';
import {NarrativeManager} from '../src/game/NarrativeManager';
import {decodeSave,initialProgress,loadProgress,saveProgress,type SaveAdapter} from '../src/game/save';
import {problems,categories} from '../src/content/problems';
import {questions,tutorialQuestion} from '../src/content/questions';
import {assetRegistry} from '../src/assets/registry';
import {situationVisuals} from '../src/config/situationVisuals';
import {overview,open,finish} from './helpers';
describe('dez situações ligadas à cidade',()=>{
 it('tem cinco temas, duas situações por tema, dez perguntas e tutorial independente',()=>{
  expect(Object.keys(categories)).toHaveLength(5);expect(problems).toHaveLength(10);expect(Object.keys(questions)).toHaveLength(10);
  for(const category of Object.keys(categories))expect(problems.filter(p=>p.category===category)).toHaveLength(2);
  expect(problems.find(p=>p.questionId==='road_animals')!.category).toBe('SECURITY');expect(problems.find(p=>p.questionId==='climate')!.category).toBe('NATURE');expect(problems.find(p=>p.questionId==='river')!.category).toBe('HEALTH');
  expect(questions[tutorialQuestion.id]).toBeUndefined();
 });
 it('cada pergunta tem três resultados sem depender da ordem das alternativas',()=>{
  for(const p of problems){
   const q=questions[p.questionId];expect(q.alternatives).toHaveLength(3);
   expect(q.alternatives.map(a=>a.effectiveness).sort()).toEqual(['COMPLETE','NONE','TEMPORARY']);
   expect(p.description.length).toBeGreaterThan(70);expect(p.comment.length).toBeGreaterThan(20);expect(p.markerIcon).toBeTruthy();
   for(const a of q.alternatives){expect(a.cost).toBeGreaterThan(0);expect(a.explanation.length).toBeGreaterThan(40);}
  }
 });
 it('todos os cenários possuem geometrias finitas, assets existentes e mudanças completas e parciais',()=>{
  for(const p of problems){
   const v=situationVisuals[p.id];
   expect(JSON.stringify(v.initial)).not.toBe(JSON.stringify(v.solved));expect(JSON.stringify(v.initial)).not.toBe(JSON.stringify(v.temporary));
   for(const state of Object.values(v)){
    expect(state.assets.length+state.details.length).toBeGreaterThan(0);
    for(const a of state.assets)expect(assetRegistry[a.asset]).toBeDefined();
    for(const a of [...state.assets,...state.details]){expect(a.position.every(Number.isFinite)).toBe(true);if(a.scale)expect(a.scale.every(v=>v>0&&Number.isFinite(v))).toBe(true);}
   }
  }
 });
});
describe('economia, decisões e descoberta',()=>{
 it.each(problems.map(p=>[p.id]))('%s aplica cada alternativa pelo ID, com custo, recompensa e cenário corretos',(id)=>{
  const p=problems.find(p=>p.id===id)!;
  for(const a of questions[p.questionId].alternatives){
   const base=overview();base.problemStates[id]='AVAILABLE';
   const s=ProblemManager.decide(open(base,id),a.id);
   expect(s.coins).toBe(1500-a.cost+(a.effectiveness==='COMPLETE'?100:0));expect(s.problemStates[id]).toBe(a.resultState);
   expect(s.decisions.at(-1)!.effectiveness).toBe(a.effectiveness);expect(ProblemManager.decide(s,a.id)).toBe(s);
   expect(decodeSave(JSON.stringify({version:1,data:s}))).toEqual(s);
  }
 });
 it('conclui as dez situações com o orçamento atual e revela grupos progressivamente',()=>{
  let s=overview();expect(problems.filter(p=>s.problemStates[p.id]==='AVAILABLE')).toHaveLength(2);
  while(problems.some(p=>s.problemStates[p.id]!=='SOLVED')){
   const p=problems.find(p=>s.problemStates[p.id]==='AVAILABLE')!;
   expect(p).toBeDefined();const a=questions[p.questionId].alternatives.find(a=>a.effectiveness==='COMPLETE')!;
   s=finish(ProblemManager.decide(open(s,p.id),a.id));
   expect(problems.filter(p=>s.problemStates[p.id]!=='HIDDEN').length).toBe(Math.min(10,2+Math.floor(s.decisions.length/2)*2));
  }
  expect(s.coins).toBe(150);expect(s.decisions).toHaveLength(10);expect(s.rewarded).toHaveLength(10);
 });
 it('repetir o mesmo problema não revela grupos antes da hora',()=>{
  let s=finish(ProblemManager.decide(open(),'support'));
  expect(s.problemStates.security_01).toBe('HIDDEN');
  s=ProblemManager.revisit(s,'accessibility_01');s=NarrativeManager.next(NarrativeManager.next(NarrativeManager.cameraArrived(s)));
  s=finish(ProblemManager.decide(s,'campaign'));expect(s.problemStates.security_01).toBe('HIDDEN');
 });
 it('mantém reavaliação e recorrência do temporário sem recompensas repetidas',()=>{
  let s=finish(ProblemManager.decide(open(),'support'));
  expect(ProblemManager.revisit(s,'accessibility_01').phase).toBe('FOCUSING');
  s=finish(ProblemManager.decide(open(s,'pollution_01'),'collection'));
  expect(s.problemStates.accessibility_01).toBe('AVAILABLE');
  s=finish(ProblemManager.decide(open(s),'ramp'));expect(ProblemManager.select(s,'accessibility_01')).toBe(s);
 });
 it('saldo insuficiente não altera nada; saldo exato é permitido',()=>{
  const s={...open(),coins:50};expect(()=>ProblemManager.decide(s,'ramp')).toThrow('Moedas insuficientes');expect(s.coins).toBe(50);
  expect(ProblemManager.decide({...open(),coins:100},'support').coins).toBe(0);
 });
 it('sair sem escolher preserva o saldo e não avança a descoberta',()=>{
  const s=NarrativeManager.cameraArrived(ProblemManager.leave(open()));expect(s.coins).toBe(1500);expect(s.decisions).toHaveLength(0);expect(s.problemStates.security_01).toBe('HIDDEN');
 });
});
describe('salvamento desta versão',()=>{
 it('restaura resultados sem cobrar novamente',()=>{
  let raw:string|null=null;const adapter:SaveAdapter={read:()=>raw,write:v=>{raw=v;},clear:()=>{raw=null;}};
  const s=ProblemManager.decide(open(),'ramp');saveProgress(adapter,s);expect(loadProgress(adapter).data).toEqual(s);expect(finish(loadProgress(adapter).data).coins).toBe(1350);
 });
 it('descarta o escopo antigo e rejeita dados corrompidos',()=>{
  for(const raw of ['{',JSON.stringify({version:9,data:initialProgress()}),JSON.stringify({version:1,data:{...initialProgress(),contentVersion:undefined}}),JSON.stringify({version:1,data:{...initialProgress(),coins:-1}})])expect(()=>decodeSave(raw)).toThrow();
 });
 it('informa quando o navegador impede armazenamento',()=>{
  const s=loadProgress({read:()=>{throw Error();},write:()=>{},clear:()=>{}});expect(s.warning).toBeTruthy();expect(s.data.phase).toBe('INTRO');
 });
});
