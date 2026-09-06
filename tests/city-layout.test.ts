import { describe,expect,it } from "vitest";
import { NodeIO,getBounds } from "@gltf-transform/core";
import { cityLots,districtBuildings,districtProps,forest,lotPaving } from "../src/config/districts";
import { infrastructure,streets,roadPlacements } from "../src/config/infrastructure";
import {coastRoadSamples,coastRoadCurve} from '../src/config/coastalRoad';
import {mapFit} from '../src/config/referenceFrame';
import { landOutlines,riverCenter,onLand } from "../src/config/terrain";
import { environment,overview } from "../src/config/world";
import { OrthographicCamera,Plane,Raycaster,Vector2,Vector3 } from "three";
import { assetRegistry } from "../src/assets/registry";
import { clampTarget,clampZoom } from "../src/game/mapNavigation";
import {gardenBeds,gardenWalks,gardenSites,landscapeAssets,landscapeDetails} from '../src/config/landscape';

describe("implantação da cidade",()=>{
  it("mantém os edifícios reais dentro dos lotes e fora das pistas",async()=>{
    const io=new NodeIO();const bounds=new Map<string,Awaited<ReturnType<typeof getBounds>>>();
    const footprints:{name:string;x:number;z:number;halfX:number;halfZ:number}[]=[];
    for(const lot of cityLots){
      const b=lot.building,a=assetRegistry[b.asset];expect(a.kind).toBe("glb");if(a.kind!=="glb")continue;
      if(!bounds.has(a.url))bounds.set(a.url,getBounds((await io.read(`public${a.url}`)).getRoot().listScenes()[0]));
      const bound=bounds.get(a.url)!;const scale=b.scale![0];
      const halfX=Math.max(Math.abs(bound.min[0]),Math.abs(bound.max[0]))*scale;
      const halfZ=Math.max(Math.abs(bound.min[2]),Math.abs(bound.max[2]))*b.scale![2];
      expect(halfX,b.asset+" largura").toBeLessThanOrEqual(lot.width/2);
      expect(halfZ,b.asset+" profundidade").toBeLessThanOrEqual(lot.depth/2);
      const [x,,z]=b.position;
      for(const dx of [-halfX,halfX])for(const dz of [-halfZ,halfZ])expect(onLand(x+dx,z+dz),`${b.asset} sobre água ${x+dx},${z+dz}`).toBe(true);
      footprints.push({name:b.asset,x,z,halfX,halfZ});
      for(const road of roadPlacements){
        const overlaps=Math.abs(x-road.position[0])<halfX+road.scale![0]/2 && Math.abs(z-road.position[2])<halfZ+road.scale![2]/2;
        expect(overlaps,`${b.asset} x=${x} z=${z} sobre pista ${road.position}`).toBe(false);
      }
      expect(streets.some(s=>s.axis==='x'&&s.at===lot.streetZ&&x>=s.from&&x<=s.to),`acesso à rua em ${x},${z}`).toBe(true);
      expect(b.rotation![1]).toBe(lot.streetZ>z?0:Math.PI);
    }
    for(const [i,a] of footprints.entries())for(const b of footprints.slice(i+1)){
      const intersects=Math.abs(a.x-b.x)<a.halfX+b.halfX-.001&&Math.abs(a.z-b.z)<a.halfZ+b.halfZ-.001;
      expect(intersects,`${a.name} ${a.x},${a.z} sobre ${b.name} ${b.x},${b.z}`).toBe(false);
    }
  });
  it("usa somente assets existentes, dimensões positivas e coordenadas finitas",()=>{
    for(const p of [...districtBuildings,...districtProps,...forest,...infrastructure,...environment]){
      expect(assetRegistry[p.asset],p.asset).toBeDefined();
      expect(p.position.every(Number.isFinite)).toBe(true);
      expect((p.scale??[1,1,1]).every(s=>Number.isFinite(s)&&s>0)).toBe(true);
    }
  });
  it('apoia ruas, vegetação e objetos terrestres no continente',()=>{
    for(const p of [...forest,...districtProps.filter(p=>p.asset!=='prop.ship')])expect(onLand(p.position[0],p.position[2]),`${p.asset} na água: ${p.position}`).toBe(true);
    for(const p of infrastructure.filter(p=>p.asset==='ground.asphalt')){
      for(const dx of [-p.scale![0]/2,p.scale![0]/2])for(const dz of [-p.scale![2]/2,p.scale![2]/2])expect(onLand(p.position[0]+dx,p.position[2]+dz),`pista na água: ${p.position}`).toBe(true);
    }
    coastRoadSamples.forEach((p,i)=>{
      const t=coastRoadCurve.getTangentAt(i/(coastRoadSamples.length-1));
      for(const side of [-1,1])expect(onLand(p.x+t.z*side,p.z-t.x*side),`avenida costeira na água: ${p.x},${p.z}`).toBe(true);
    });
  });
  it('preserva ruas e acessos ao ocupar os terrenos com jardins e mobiliário',()=>{
    const obstacles=[...roadPlacements,...lotPaving,...infrastructure.filter(p=>p.asset==='ground.sidewalk')];
    for(const site of gardenSites){
      for(const p of obstacles){
        const overlaps=Math.abs(site.x-p.position[0])<site.radius+p.scale![0]/2-.01&&Math.abs(site.z-p.position[2])<site.radius+p.scale![2]/2-.01;
        expect(overlaps,`${site.name} ${site.x},${site.z} interrompe ${p.asset} ${p.position}`).toBe(false);
      }
    }
    for(const p of [...gardenWalks,...landscapeAssets,...landscapeDetails]){
      expect(p.position.every(Number.isFinite)).toBe(true);
      expect(p.scale!.every(v=>Number.isFinite(v)&&v>0)).toBe(true);
      expect(onLand(p.position[0],p.position[2]),`paisagismo na água: ${p.position}`).toBe(true);
    }
    const blockedEdges:string[]=[];
    const passages=[...roadPlacements,...lotPaving,...gardenWalks];
    for(const bed of gardenBeds)for(const [x,z] of bed.points){
      expect(onLand(x,z),`canteiro na água ${x},${z}`).toBe(true);
      if(passages.some(p=>Math.abs(x-p.position[0])<p.scale![0]/2-.001&&Math.abs(z-p.position[2])<p.scale![2]/2-.001))blockedEdges.push(`${x},${z}`);
    }
    expect(blockedEdges,'canteiros obstruindo passagens').toEqual([]);
  });
  it("liga a cidade à mata por uma ponte sobre o rio, sem asfalto dentro da água",()=>{
    const bridges=infrastructure.filter(p=>p.asset==="prop.bridge");
    expect(bridges).toHaveLength(1);
    expect(Math.abs(bridges[0].position[2]-riverCenter(bridges[0].position[0]))).toBeLessThan(.5);
    for(const p of infrastructure.filter(p=>p.asset==="ground.asphalt")){
      const [x,,z]=p.position,[w,,d]=p.scale!;
      expect(Math.abs(z-riverCenter(x))>1.1+d/2,`asfalto ${x},${z} ${w}x${d}`).toBe(true);
    }
  });
  it('tem continente a oeste e ao norte, costa a leste e rio aberto',()=>{
    const outlines=landOutlines();
    const onLand=(x:number,z:number)=>outlines.some(points=>{
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const a=points[i],b=points[j];
        if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
      }return inside;
    });
    expect(onLand(-50,0)).toBe(true);expect(onLand(0,-40)).toBe(true);
    expect(onLand(-25,40)).toBe(true);
    expect(onLand(70,0)).toBe(false);expect(onLand(50,45)).toBe(false);
    for(const x of [-50,-20,0,17,30])expect(onLand(x,riverCenter(x))).toBe(false);
    for(const lot of cityLots)expect(onLand(lot.building.position[0],lot.building.position[2]),lot.building.asset).toBe(true);
  });
  it("não atravessa pistas com blocos de calçada",()=>{
    const roads=roadPlacements;
    for(const pavement of [...infrastructure,...lotPaving].filter(p=>p.asset==="ground.sidewalk"))for(const road of roads){
      const dx=Math.abs(pavement.position[0]-road.position[0]);
      const dz=Math.abs(pavement.position[2]-road.position[2]);
      const overlaps=dx<(pavement.scale![0]+road.scale![0])/2-.001 && dz<(pavement.scale![2]+road.scale![2])/2-.001;
      expect(overlaps,`calçada ${pavement.position} sobre pista ${road.position}`).toBe(false);
    }
  });
});
describe("limites da exploração",()=>{
  it("mantém o mar dentro do recorte da câmera até nos cantos de telas altas",()=>{
    for(const [w,h] of [[1440,900],[412,839],[360,640],[360,1000]]){
      const camera=new OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,500);
      camera.position.set(...overview.position);camera.lookAt(new Vector3(...overview.target));
      camera.zoom=overview.zoom*mapFit(w,h);
      camera.updateProjectionMatrix();camera.updateMatrixWorld();
      const ray=new Raycaster();
      for(const x of [-1,1])for(const y of [-1,1]){
        ray.setFromCamera(new Vector2(x,y),camera);
        const hit=ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),.65),new Vector3());
        expect(hit,`mar em ${w}x${h}, canto ${x},${y}`).not.toBeNull();
        expect(Math.abs(hit!.x)).toBeLessThan(1000);expect(Math.abs(hit!.z)).toBeLessThan(1000);
        expect(Math.abs(hit!.project(camera).z)).toBeLessThan(1);
      }
    }
  });
  it("limita zoom e arrastos extremos para manter a cidade alcançável",()=>{
    expect(clampZoom(.01)).toBe(1);expect(clampZoom(999)).toBe(3.5);expect(clampZoom(2)).toBe(2);
    expect(clampTarget(-999,999)).toEqual([-35,38]);expect(clampTarget(999,-999)).toEqual([60,-48]);expect(clampTarget(2,-3)).toEqual([2,-3]);
  });
});
