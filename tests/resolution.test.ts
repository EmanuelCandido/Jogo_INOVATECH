import {describe,it,expect} from 'vitest';
import {createResolution,planVisualChanges,sampleVisualChange} from '../src/game/resolution';
import {ProblemManager} from '../src/game/ProblemManager';
import {problems} from '../src/content/problems';
import {questions} from '../src/content/questions';
import {situationVisuals} from '../src/config/situationVisuals';
import type {Placement} from '../src/game/types';
import {open,overview} from './helpers';

function selected(id='pollution_01'){
 const s=overview();s.coins=10000;s.problemStates[id]='AVAILABLE';return open(s,id);
}
describe('transformação visível da cidade',()=>{
 it.each(problems.map(p=>p.id))('%s anima a solução completa sem adiar o salvamento',id=>{
  const before=selected(id),answer=questions[problems.find(p=>p.id===id)!.questionId].alternatives.find(a=>a.effectiveness==='COMPLETE')!;
  const after=ProblemManager.decide(before,answer.id),resolution=createResolution(before,after)!;
  expect(after.phase).toBe('RESULT');expect(after.problemStates[id]).toBe('SOLVED');
  expect(resolution).toMatchObject({problemId:id,from:'initial',to:'solved',clock:{value:0}});
  expect(createResolution(after,ProblemManager.decide(after,answer.id))).toBeNull();
  expect(createResolution(before,after,true)).toBeNull();
 });
 it('não transforma uma escolha parcial ou ineficaz em solução completa',()=>{
  const before=selected(),answers=questions.waste.alternatives;
  const partial=ProblemManager.decide(before,answers.find(a=>a.effectiveness==='TEMPORARY')!.id);
  expect(createResolution(before,partial)?.to).toBe('temporary');
  const wrong=ProblemManager.decide(before,answers.find(a=>a.effectiveness==='NONE')!.id);
  expect(createResolution(before,wrong)).toBeNull();
 });
 it('mantém objetos iguais e conduz o mesmo animal até o abrigo',()=>{
  const a:Placement={asset:'prop.rabbit',position:[0,.1,0]},b:Placement={...a,position:[2,.1,3]};
  const unchanged:Placement={asset:'prop.wildlife',position:[-2,0,0]};
  const plan=planVisualChanges([a,unchanged],[b,unchanged]);
  expect(plan.stable).toEqual([unchanged]);expect(plan.changes).toHaveLength(1);
  const halfway=sampleVisualChange(plan.changes[0],.5);
  expect(halfway.position[0]).toBeGreaterThan(0);expect(halfway.position[0]).toBeLessThan(2);
  expect(sampleVisualChange(plan.changes[0],0).position).toEqual(a.position);
  const end=sampleVisualChange(plan.changes[0],1);end.position.forEach((v,i)=>expect(v).toBeCloseTo(b.position[i],8));
 });
 it('remove resíduos até o coletor e instala as melhorias em etapas, sem alterar fontes',()=>{
  const before=situationVisuals.pollution_01.initial.assets,after=situationVisuals.pollution_01.solved.assets;
  const snapshot=JSON.stringify([before,after]),{changes}=planVisualChanges(before,after);
  for(const change of changes){
   const first=sampleVisualChange(change,0,[0,1,9]),middle=sampleVisualChange(change,.5,[0,1,9]),end=sampleVisualChange(change,1,[0,1,9]);
   expect([...middle.position,...middle.scale,...middle.rotation].every(Number.isFinite)).toBe(true);
   if(change.before&&!change.after){expect(first.visible).toBe(true);expect(end.visible).toBe(false);}
   if(change.after&&!change.before){expect(first.visible).toBe(false);expect(end.visible).toBe(true);expect(end.position).toEqual(change.after.position);expect(end.scale).toEqual(change.after.scale);}
  }
  expect(JSON.stringify([before,after])).toBe(snapshot);
 });
});
