import {describe,it,expect,vi,beforeAll} from 'vitest';
import {arrivalBeatAt,arrivalCamera,arrivalHero,arrivalShockwave,arrivalSite,arrivalTimes,landingZoom} from '../src/game/arrival';
import {problemById} from '../src/content/problems';
import {mapEye,mapTarget} from '../src/config/referenceFrame';
import {NarrativeManager} from '../src/game/NarrativeManager';
import type {Vec3} from '../src/game/types';

const start={target:mapTarget,offset:mapEye.map((v,i)=>v-mapTarget[i]) as Vec3,zoom:8};
const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const frames=(to=arrivalTimes.end)=>Array.from({length:Math.round(to*60)+1},(_,i)=>i/60);

describe('chegada de Impactus à cidade',()=>{
 it('marca as etapas em ordem e termina depois do pouso',()=>{
  expect(frames().map(arrivalBeatAt).filter((b,i,all)=>b!==all[i-1])).toEqual(['approach','flyby','dive','landed']);
  expect(arrivalTimes.end-arrivalTimes.landed).toBeGreaterThan(2);
  expect(arrivalTimes.end).toBeLessThan(7);
 });
 it('pousa na praça da estação central, em frente à entrada',()=>{
  const entrance=problemById.accessibility_01.worldPosition;
  const gap=Math.hypot(arrivalSite[0]-entrance[0],arrivalSite[2]-entrance[2]);
  expect(gap).toBeGreaterThan(3);expect(gap).toBeLessThan(6);
 });
 it('a câmera parte do mapa, mantém a distância e termina no ângulo de sempre sobre o pouso',()=>{
  const base=8;
  const first=arrivalCamera(0,start,base);
  expect(distance(first.target,start.target)).toBeLessThan(1e-9);expect(first.zoom).toBe(start.zoom);
  for(const t of frames()){
   const shot=arrivalCamera(t,start,base);
   expect(distance(shot.position,shot.target)).toBeCloseTo(Math.hypot(...start.offset),6);
   expect(shot.position[1]-shot.target[1]).toBeCloseTo(start.offset[1],6);
   expect(shot.zoom).toBeGreaterThanOrEqual(start.zoom-1e-9);
  }
  const last=arrivalCamera(arrivalTimes.end,start,base);
  expect(distance(last.target,arrivalSite)).toBeLessThan(1e-6);
  expect(distance(last.position,arrivalSite.map((v,i)=>v+start.offset[i]) as Vec3)).toBeLessThan(1e-6);
  expect(last.zoom).toBeCloseTo(base*landingZoom*1.1,6);
 });
 it.each([[1280,800],[390,844],[360,640]])('Impactus voa sem saltos e pousa no ponto projetado (%i×%i)',(width,height)=>{
  const site:[number,number]=[width/2,height/2];
  expect(arrivalHero(arrivalTimes.appear-.01,width,height,site).visible).toBe(false);
  let previous=arrivalHero(arrivalTimes.appear,width,height,site);
  for(const t of frames().filter(t=>t>arrivalTimes.appear)){
   const pose=arrivalHero(t,width,height,site);
   expect(Math.hypot(pose.x-previous.x,pose.y-previous.y)).toBeLessThan(Math.max(width,height)*.06);
   expect(Math.abs(pose.facing)).toBeLessThanOrEqual(1);
   previous=pose;
  }
  const landed=arrivalHero(arrivalTimes.landed,width,height,site),before=arrivalHero(arrivalTimes.landed-1/60,width,height,site);
  expect([landed.x,landed.y]).toEqual(site);
  expect(Math.hypot(before.x-site[0],before.y-site[1])).toBeLessThan(Math.max(width,height)*.03);
  // He lands facing right, like the portrait of the first line.
  expect(landed.facing).toBe(-1);expect(before.facing).toBe(-1);expect(landed.glow).toBe(0);
 });
 it('a onda de choque só existe logo depois do pouso',()=>{
  expect(arrivalShockwave(arrivalTimes.landed)).toBeNull();
  expect(arrivalShockwave(arrivalTimes.landed+.2)?.opacity).toBeGreaterThan(0);
  expect(arrivalShockwave(arrivalTimes.landed+1)).toBeNull();
 });
});

describe('quando a chegada toca',()=>{
 let useGame:typeof import('../src/stores/gameStore').useGame;
 beforeAll(async()=>{
  const data=new Map<string,string>();
  vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>void data.set(k,v),removeItem:(k:string)=>void data.delete(k)});
  ({useGame}=await import('../src/stores/gameStore'));
 });
 it('só no começo de uma história, e pode ser pulada',()=>{
  const game=useGame.getState();
  game.startArrival();
  const arrival=useGame.getState().arrival!;
  expect(arrival.beat).toBe('approach');expect(arrival.clock.value).toBe(0);
  useGame.getState().arrivalBeat(arrival.sequence,'flyby');
  expect(useGame.getState().arrival).toMatchObject({sequence:arrival.sequence,beat:'flyby',clock:arrival.clock});
  useGame.getState().finishArrival(arrival.sequence+1);
  expect(useGame.getState().arrival?.sequence).toBe(arrival.sequence);
  useGame.getState().finishArrival(arrival.sequence);
  expect(useGame.getState().arrival).toBeNull();
  // After the first line, a reload or JOGAR goes straight to the story.
  useGame.setState({progress:NarrativeManager.next(useGame.getState().progress)});
  useGame.getState().startArrival();
  expect(useGame.getState().arrival).toBeNull();
 });
 it('recomeçar a história toca a chegada de novo, menos com movimento reduzido',()=>{
  useGame.getState().reset();
  const arrival=useGame.getState().arrival;
  expect(arrival).not.toBeNull();
  useGame.getState().finishArrival(arrival!.sequence);
  useGame.setState({progress:{...useGame.getState().progress,settings:{...useGame.getState().progress.settings,reducedMotion:true}}});
  useGame.getState().startArrival();
  expect(useGame.getState().arrival).toBeNull();
 });
});
