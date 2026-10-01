import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {ProblemManager} from '../src/game/ProblemManager';
import {decodeSave,saveProgress,type SaveAdapter} from '../src/game/save';
import {problems} from '../src/content/problems';
import {questions} from '../src/content/questions';
import {endingDialogue,endingTour} from '../src/content/ending';
import {OrthographicCamera,Vector3} from 'three';
import {ENDING_WIDE,beginEnding,cityTransformed,endingDue,endingShot,endingStats,endingVisited,endingWideShots,finaleBeat,nextEnding,skipEnding,type Ending} from '../src/game/ending';
import {mapBaseZoom} from '../src/game/mapNavigation';
import type {Progress} from '../src/game/types';
import {overview,open,finish} from './helpers';

/** Plays every available situation with its complete solution, optionally
 * trying a wrong answer first on the first `misses` situations. */
function solveCity(misses=0){
 let s=overview(),missed=0;
 for(let guard=0;guard<40;guard++){
  const next=problems.find(p=>s.problemStates[p.id]==='AVAILABLE');
  if(!next)break;
  const alternatives=questions[next.questionId].alternatives;
  if(missed<misses&&!s.decisions.some(d=>d.problemId===next.id)){
   s=finish(ProblemManager.decide(open(s,next.id),alternatives.find(a=>a.effectiveness==='NONE')!.id));
   missed++;continue;
  }
  s=finish(ProblemManager.decide(open(s,next.id),alternatives.find(a=>a.effectiveness==='COMPLETE')!.id));
 }
 return s;
}
const memory=():SaveAdapter=>{let value:string|null=null;return {read:()=>value,write:v=>{value=v;},clear:()=>{value=null;}};};

describe('final do jogo',()=>{
 it('começa só quando os dez lugares têm solução completa, de volta ao mapa',()=>{
  const city=solveCity();
  expect(city.phase).toBe('OVERVIEW');
  expect(cityTransformed(city)).toBe(true);
  expect(endingDue(city)).toBe(true);
  expect(endingDue({...city,endingSeen:true})).toBe(false);
  const partial:Progress={...city,problemStates:{...city.problemStates,health_02:'TEMPORARILY_SOLVED'}};
  expect(cityTransformed(partial)).toBe(false);
  expect(endingDue(partial)).toBe(false);
  expect(endingDue({...city,phase:'RESULT'})).toBe(false);
 });
 it('segue fala inicial, passeio pelos dez lugares, festa, conversa e encerramento',()=>{
  let e:Ending=beginEnding(false,1);
  const steps:string[]=[];
  for(let i=0;i<40&&e.step!=='closing';i++){steps.push(`${e.step}:${e.step==='dialogue'?e.line:e.beat}`);e=nextEnding(e);}
  expect(steps[0]).toBe('opening:0');
  expect(steps.filter(s=>s.startsWith('tour:'))).toHaveLength(endingTour.length+1);
  expect(steps.filter(s=>s.startsWith('dialogue:'))).toHaveLength(endingDialogue.length);
  expect(e.step).toBe('closing');
  expect(nextEnding(e)).toBe(e);
 });
 it('o passeio visita cada situação uma vez e a câmera termina na cidade inteira',()=>{
  expect(new Set(endingTour.map(stop=>stop.problemId))).toEqual(new Set(problems.map(p=>p.id)));
  const tour={...beginEnding(false,1),step:'tour' as const};
  endingTour.forEach((stop,beat)=>expect(endingShot({...tour,beat})).toBe(stop.problemId));
  expect(endingShot({...tour,beat:finaleBeat})).toBe(ENDING_WIDE);
  expect(endingShot({...tour,step:'dialogue'})).toBe(ENDING_WIDE);
  expect(endingShot(beginEnding(false,1))).toBeNull();
  expect(endingShot(null)).toBeNull();
  for(const stop of endingTour)expect(stop.caption.length).toBeLessThanOrEqual(52);
 });
 it('mostra o balão de cada lugar já visitado, e todos depois do passeio',()=>{
  const tour:Ending={...beginEnding(false,1),step:'tour',beat:2};
  expect(endingTour.slice(0,3).every(stop=>endingVisited(tour,stop.problemId))).toBe(true);
  expect(endingTour.slice(3).some(stop=>endingVisited(tour,stop.problemId))).toBe(false);
  expect(problems.every(p=>endingVisited({...tour,step:'dialogue'},p.id))).toBe(true);
  expect(problems.some(p=>endingVisited(beginEnding(false,1),p.id))).toBe(false);
 });
 it('a festa mostra os dez lugares sem afastar a câmera além do mapa',()=>{
  for(const [width,height] of [[1440,900],[1280,720],[1920,1080],[412,915],[360,640],[915,412],[768,1024]]){
   const shots=endingWideShots(width,height);
   expect(shots.length).toBeGreaterThanOrEqual(1);expect(shots.length).toBeLessThanOrEqual(2);
   const seen=new Set<string>();
   for(const shot of shots){
    expect(shot.zoom).toBeGreaterThanOrEqual(mapBaseZoom(width,height)-1e-9);
    const camera=new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,850);
    camera.position.set(...shot.position);camera.zoom=shot.zoom;camera.lookAt(new Vector3(...shot.target));camera.updateMatrixWorld();camera.updateProjectionMatrix();
    for(const p of problems){
     const v=new Vector3(...p.markerPosition).project(camera),x=(v.x+1)/2*width,y=(1-v.y)/2*height;
     expect([width,height,p.id,y>20&&y<height-20]).toEqual([width,height,p.id,true]);
     if(x>20&&x<width-20)seen.add(p.id);
    }
   }
   // A pan passes over the places between its two ends.
   if(shots.length===1)expect(seen.size).toBe(problems.length);
   else expect(seen.size).toBeGreaterThanOrEqual(2);
  }
  expect(endingWideShots(412,915,true)).toHaveLength(1);
 });
 it('pular o passeio leva à conversa, e pular a conversa leva ao encerramento',()=>{
  expect(skipEnding({...beginEnding(false,1),step:'tour',beat:4})).toMatchObject({step:'dialogue',line:0});
  expect(skipEnding({...beginEnding(false,1),step:'dialogue',line:2}).step).toBe('closing');
 });
 it('o encerramento conta lugares, decisões e acertos de primeira',()=>{
  expect(endingStats(solveCity())).toEqual({places:10,total:10,decisions:10,firstTry:10});
  expect(endingStats(solveCity(3))).toEqual({places:10,total:10,decisions:13,firstTry:7});
 });
 it('o save guarda que o final foi visto e recusa valores inválidos',()=>{
  const adapter=memory(),city={...solveCity(),endingSeen:true};
  saveProgress(adapter,city);
  expect(decodeSave(adapter.read()!).endingSeen).toBe(true);
  saveProgress(adapter,{...city,endingSeen:'sim' as unknown as boolean});
  expect(()=>decodeSave(adapter.read()!)).toThrow();
 });
});

describe('final do jogo na store',()=>{
 const stored:Record<string,string>={};
 let game:typeof import('../src/stores/gameStore').useGame;
 beforeAll(async()=>{
  vi.stubGlobal('localStorage',{getItem:(k:string)=>stored[k]??null,setItem:(k:string,v:string)=>{stored[k]=v;},removeItem:(k:string)=>{delete stored[k];}});
  game=(await import('../src/stores/gameStore')).useGame;
 });
 afterAll(()=>vi.unstubAllGlobals());
 const start=(progress:Progress)=>game.setState({progress,ending:null,arrival:null,overlay:null,resolution:null});
 it('marca o final como visto ao chegar ao encerramento e devolve o mapa',()=>{
  start(solveCity());
  game.getState().startEnding();
  expect(game.getState().ending?.step).toBe('opening');
  game.getState().openOverlay('missions');
  expect(game.getState().overlay).toBeNull();
  game.getState().advanceEnding();
  expect(game.getState().ending).toMatchObject({step:'tour',beat:0});
  game.getState().skipEnding();
  expect(game.getState().ending?.step).toBe('dialogue');
  expect(game.getState().progress.endingSeen).toBeFalsy();
  game.getState().skipEnding();
  expect(game.getState().ending?.step).toBe('closing');
  expect(game.getState().progress.endingSeen).toBe(true);
  expect(JSON.parse(stored['ecoquest.save.v1']).data.endingSeen).toBe(true);
  game.getState().closeEnding();
  expect(game.getState().ending).toBeNull();
  game.getState().startEnding();
  expect(game.getState().ending).toBeNull();
 });
 it('pode ser assistido de novo pelo Extra só com a cidade toda resolvida',()=>{
  start({...solveCity(),endingSeen:true});
  expect(game.getState().playEnding()).toBe(true);
  expect(game.getState().ending).toMatchObject({step:'opening',replay:true});
  expect(game.getState().playEnding()).toBe(false);
  start(overview());
  expect(game.getState().playEnding()).toBe(false);
  expect(game.getState().ending).toBeNull();
 });
 it('a chegada pode ser revista pelo Extra de volta ao mapa, com movimento',()=>{
  start(overview());
  expect(game.getState().playArrival()).toBe(true);
  expect(game.getState().arrival).toMatchObject({beat:'approach'});
  expect(game.getState().playArrival()).toBe(false);
  game.getState().openOverlay('shop');
  expect(game.getState().overlay).toBeNull();
  game.getState().finishArrival(game.getState().arrival!.sequence);
  expect(game.getState().arrival).toBeNull();
  start({...overview(),settings:{...overview().settings,reducedMotion:true}});
  expect(game.getState().playArrival()).toBe(false);
  start({...solveCity(),endingSeen:true});
  game.getState().playEnding();
  expect(game.getState().playArrival()).toBe(false);
 });
});
