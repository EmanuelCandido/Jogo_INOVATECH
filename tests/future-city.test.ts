import {describe,it,expect} from 'vitest';
import {NodeIO,getBounds} from '@gltf-transform/core';
import {Box3,Vector3,Euler} from 'three';
import {modelUrl,modelLayouts,attachmentWorld,layoutFor} from '../src/assets/modelLayout';
import {assetRegistry} from '../src/assets/registry';
import {cityLots,districtProps} from '../src/config/districts';
import {roadPlacements,infrastructure} from '../src/config/infrastructure';
import {railSupports,railAssets} from '../src/config/railTransit';
import {railDeckTop,railSamples} from '../src/config/railway';
import {situationVisuals} from '../src/config/situationVisuals';
import {situationClearings} from '../src/config/situationSites';
import lodModels from '../assets-source/model-lods.json';

const io=new NodeIO();
describe('arquitetura futurista, variantes e implantação',()=>{
 it('carrega somente a variante apropriada e mantém origens e envelopes',async()=>{
  let fullBytes=0,lowBytes=0,fullTriangles=0,lowTriangles=0;
  for(const name of lodModels){
   const files=[name,name+'-low'],bounds=[];
   for(const [index,file] of files.entries()){
    const path=`public/assets/models/${file}.glb`,doc=await io.read(path);
    bounds.push(getBounds(doc.getRoot().listScenes()[0]));
    const triangles=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION')!.getCount())/3,0);
    const bytes=(await io.writeBinary(doc)).byteLength;
    if(index){lowBytes+=bytes;lowTriangles+=triangles;}
    else{fullBytes+=bytes;fullTriangles+=triangles;}
   }
   for(const side of ['min','max'] as const)for(let axis=0;axis<3;axis++)expect(Math.abs(bounds[0][side][axis]-bounds[1][side][axis]),`${name} envelope`).toBeLessThan(.10);
   const definition={kind:'glb',url:`/assets/models/${name}.glb`} as const;
   for(const tier of ['MINIMUM','LOW'] as const)expect(modelUrl(definition,tier)).toBe(`/assets/models/${name}-low.glb`);
   for(const tier of ['MEDIUM','HIGH','ULTRA'] as const)expect(modelUrl(definition,tier)).toBe(definition.url);
  }
  expect(lowBytes).toBeLessThan(fullBytes*.82);expect(lowTriangles).toBeLessThan(fullTriangles*.8);
 },30000); // Reads and serializes every full/LOW GLB, including cold disk I/O.
 it('exporta dimensões reais e transforma encaixes com rotação e escala',async()=>{
  for(const [name,layout] of Object.entries(modelLayouts)){
   const doc=await io.read(`public/assets/models/${name}.glb`),actual=getBounds(doc.getRoot().listScenes()[0]);
   for(const side of ['min','max'] as const)for(let axis=0;axis<3;axis++)expect(Math.abs(actual[side][axis]-layout.bounds[side][axis]),`${name} metadados`).toBeLessThan(.003);
  }
  const p=attachmentWorld({asset:'building.sage',position:[10,1,20],scale:[2,3,4],rotation:[0,Math.PI,0]},[.3,2,.7]);
  expect(p[0]).toBeCloseTo(9.4);expect(p[1]).toBeCloseTo(7);expect(p[2]).toBeCloseTo(17.2);
  const rotated=attachmentWorld({asset:'building.sage',position:[0,0,0],rotation:[.3,-.7,1.2]},[.3,2,.7]);
  new Vector3(.3,2,.7).applyEuler(new Euler(.3,-.7,1.2)).toArray().forEach((v,i)=>expect(rotated[i]).toBeCloseTo(v,8));
  for(const lot of cityLots){const layout=layoutFor(lot.building.asset)!;if(layout.roofDetail)expect(new Box3(new Vector3(...layout.bounds.min),new Vector3(...layout.bounds.max)).containsPoint(new Vector3(...layout.roofDetail))).toBe(true);}
 });
 it('inclui a identidade solar e jardins nos edifícios de todos os perfis',async()=>{
  for(const name of ['townhouse-sage','townhouse-cream','townhouse-coral','townhouse-pink','house-cream','house-coral','house-terrace','house-solar','school','hospital','factory','port-warehouse','fuel-station']){
   for(const suffix of ['','-low']){
    const materials=(await io.read(`public/assets/models/${name}${suffix}.glb`)).getRoot().listMaterials().map(m=>m.getName());
    expect(materials,`${name}${suffix}`).toContain('eco.solar');expect(materials).toContain('eco.white');
    expect(materials.some(m=>m==='eco.leaflight'||m==='eco.leaf'||m==='eco.roofgrass')).toBe(true);
   }
  }
 });
 it('mantém pilares e acessos da estação fora das vias e situações',()=>{
  expect(railSupports.length).toBeGreaterThan(2);
  for(const p of railSupports){
   for(const obstacle of [...roadPlacements,...infrastructure.filter(p=>p.asset==='ground.sidewalk')])expect(Math.abs(p.position[0]-obstacle.position[0])<(p.scale![0]+obstacle.scale![0])/2&&Math.abs(p.position[2]-obstacle.position[2])<(p.scale![2]+obstacle.scale![2])/2,`pilar ${p.position}`).toBe(false);
   for(const s of situationClearings)expect(Math.hypot(s.x-p.position[0],s.z-p.position[2])).toBeGreaterThan(s.r+.55);
  }
  for(const sample of railSamples){expect(sample.y-.3).toBeGreaterThan(3.8);expect(sample.y).toBe(railDeckTop);}
  expect(railAssets.some(p=>p.asset==='building.station')).toBe(true);
  for(const p of railAssets)expect(assetRegistry[p.asset]).toBeDefined();
 });
 it('reserva o tratamento industrial e a sombra solar à solução completa',()=>{
  for(const [id,asset] of [['health_02','prop.airTreatment'],['nature_02','prop.solarCanopy']]){
   expect(situationVisuals[id].solved.assets.some(p=>p.asset===asset)).toBe(true);
   for(const state of ['initial','temporary'] as const)expect(situationVisuals[id][state].assets.some(p=>p.asset===asset)).toBe(false);
  }
  const local=situationVisuals.health_02.solved.assets.find(p=>p.asset==='prop.airTreatment')!;
  const treatment={...local,position:[local.position[0]+4,local.position[1],local.position[2]-48] as [number,number,number]};
  const bounds=(p:typeof local)=>{
   const b=layoutFor(p.asset)!.bounds,box=new Box3();
   for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])box.expandByPoint(new Vector3(...attachmentWorld(p,[x,y,z])));
   return box;
  };
  for(const p of districtProps.filter(p=>p.asset==='prop.truck'))expect(bounds(treatment).intersectsBox(bounds(p)),'tratamento e caminhão').toBe(false);
 });
});

