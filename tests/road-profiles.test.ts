import {describe,it,expect} from 'vitest';
import {buildRoadProfiles,heightAlongRoad,roadHeightSampler,type ProfileRoad} from '../src/config/roadProfiles';

describe('perfis longitudinais da rede viária',()=>{
 it('nivela transversalmente os trechos que já compartilham pavimento antes do encontro dos eixos',()=>{
  const principal:ProfileRoad={id:'principal',width:3.5,points:[[-10,0],[-5,0],[0,0],[5,0],[10,0]]};
  const acesso:ProfileRoad={id:'acesso',width:3.5,points:[[-10,5],[-5,2],[0,0]]};
  const result=buildRoadProfiles([principal,acesso],(r,p)=>r.id==='acesso'&&p[0]===-10?1:0);
  const a=heightAlongRoad(principal,result.heights.get(principal.id)!,[-5,0]).height,b=heightAlongRoad(acesso,result.heights.get(acesso.id)!,[-5,2]).height;
  expect(Math.abs(a-b)).toBeLessThanOrEqual(.160001);
 });
 it('não encurta artificialmente a rampa ao alternar entre aproximações sobrepostas',()=>{
  const roads:ProfileRoad[]=[0,1].map((side)=>({id:String(side),width:3.5,points:Array.from({length:121},(_,i)=>[-60+i*.5+(side&&i<120?.25:0),side] as [number,number])}));
  const result=buildRoadProfiles(roads,(_,p)=>p[0]===0?4.8:0);
  for(const r of roads)for(let i=0;i<r.points.length;i++)expect(result.heights.get(r.id)![i]).toBeCloseTo(Math.max(0,4.8+r.points[i][0]*.08),6);
 });
 it('interpola o piso comum sem degrau na bissetriz das aproximações',()=>{
  const floor=roadHeightSampler([
   {id:'rampa',width:3,points:[[-10,0],[0,0],[10,0]],heights:[0,.8,1.6]},
   {id:'ramal',width:3,points:[[0,-10],[0,0],[0,10]],heights:[.8,.8,.8]},
  ]);
  // Previously the nearest-road switch jumped by about 8 cm here.
  expect(Math.abs(floor(1-.0001,1)-floor(1+.0001,1))).toBeLessThan(.0001);
  expect(floor(1,1)).toBeGreaterThan(.8);expect(floor(1,1)).toBeLessThan(.88);
  expect(floor(5,0)).toBeCloseTo(1.2,8);
  expect(floor(0,5)).toBeCloseTo(.8,8);
  // Crossing the overlap boundary must also remain continuous.
  expect(Math.abs(floor(2.175-.0001,1)-floor(2.175+.0001,1))).toBeLessThan(.0001);
 });
 it('não cria um degrau na bissetriz interna da curva de uma única rua',()=>{
  const floor=roadHeightSampler([{id:'curva',width:3,points:[[-10,0],[0,0],[0,10]],heights:[0,.8,1.6]}]);
  expect(Math.abs(floor(-1-.0001,1)-floor(-1+.0001,1))).toBeLessThan(.0001);
  expect(floor(-1,1)).toBeCloseTo(.8,6);
  expect(floor(-5,0)).toBeCloseTo(.4,6);expect(floor(0,5)).toBeCloseTo(1.2,6);
 });
 it('não mistura pisos de ruas paralelas cujos corredores não se encontram',()=>{
  const floor=roadHeightSampler([
   {id:'alta',width:3,points:[[-10,0],[10,0]],heights:[2,2]},
   {id:'baixa',width:3,points:[[-10,6],[10,6]],heights:[0,0]},
  ]);
  expect(floor(0,1.5)).toBe(2);expect(floor(0,4.5)).toBe(0);
 });
 it('faz a transição entre ruas de larguras diferentes sem degraus no limite do corredor estreito',()=>{
  const floor=roadHeightSampler([
   {id:'estreita',width:2,points:[[-10,0],[10,0]],heights:[0,1.6]},
   {id:'larga',width:6,points:[[0,-10],[0,10]],heights:[.8,.8]},
  ]);
  expect(floor(2,1.8)).toBeGreaterThanOrEqual(.8);expect(floor(2,1.8)).toBeLessThanOrEqual(.96);
  expect(Math.abs(floor(2,1.675-.0001)-floor(2,1.675+.0001))).toBeLessThan(.0001);
 });
 it('mantém a altura contínua no canto externo de um cruzamento inclinado',()=>{
  const floor=roadHeightSampler([
   {id:'rampa',width:3,points:[[-10,0],[0,0],[10,0]],heights:[0,.8,1.6]},
   {id:'ramal',width:3,points:[[0,-10],[0,0],[0,10]],heights:[.8,.8,.8]},
  ]);
  const edge=2.175,epsilon=.0001;
  expect(Math.abs(floor(edge-epsilon,edge)-floor(edge,edge-epsilon))).toBeLessThan(.0001);
 });
 it('não eleva uma rua paralela pela proximidade da ponte',()=>{
  const bridge:ProfileRoad={id:'ponte',width:3,points:[[-70,0],[-30,0],[-10,0],[10,0],[30,0],[70,0]]};
  const local:ProfileRoad={id:'local',width:3,points:[[-70,6],[0,6],[70,6]]};
  const result=buildRoadProfiles([bridge,local],r=>r.id==='ponte'?2.8:0);
  expect(result.heights.get('local')).toEqual([0,0,0]);
  expect(heightAlongRoad(local,result.heights.get('local')!,[5,7]).height).toBe(0);
 });
 it('divide a conexão real e mantém sua cota compartilhada e a rampa até 8%',()=>{
  const main:ProfileRoad={id:'principal',width:3,points:[[-60,0],[60,0]]},branch:ProfileRoad={id:'ramal',width:3,points:[[3,0],[3,60]]};
  const {heights,junctions}=buildRoadProfiles([main,branch],(_,p)=>p[0]===3&&p[1]===0?2.8:0);
  expect(junctions).toHaveLength(1);expect(junctions[0].point).toEqual([3,0]);
  expect(heightAlongRoad(main,heights.get('principal')!,[3,0]).height).toBe(2.8);
  expect(heightAlongRoad(branch,heights.get('ramal')!,[3,0]).height).toBe(2.8);
  for(const r of [main,branch])for(let i=1;i<r.points.length;i++){
   const h=heights.get(r.id)!;expect(Math.abs(h[i]-h[i-1])/Math.hypot(r.points[i][0]-r.points[i-1][0],r.points[i][1]-r.points[i-1][1])).toBeLessThanOrEqual(.080001);
  }
  expect(heights.get('ramal')!.at(-1)).toBe(0);
 });
 it('não considera um cruzamento em projeção quando a estrutura não integra a rede no mesmo nível',()=>{
  const ground:ProfileRoad={id:'rua',width:3,points:[[-30,0],[30,0]]};
  const elevated:ProfileRoad={id:'viaduto',width:4,points:[[0,-30],[0,30]]};
  const street=buildRoadProfiles([ground],()=>0),deck=buildRoadProfiles([elevated],()=>4.5);
  expect(street.junctions).toEqual([]);expect(street.heights.get('rua')).toEqual([0,0]);
  expect(deck.heights.get('viaduto')).toEqual([4.5,4.5]);
 });
});
