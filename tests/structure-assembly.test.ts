import {expect,it} from 'vitest';
import {attachmentWorld,layoutFor} from '../src/assets/modelLayout';
import {structuralSupports,roadStructures} from '../src/config/roadStructures';
import {stationSlabThickness} from '../src/config/stationPerimeters';
import type {Placement} from '../src/game/types';
import {NodeIO} from '@gltf-transform/core';
import {assetRegistry} from '../src/assets/registry';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,Matrix4,Vector3,Raycaster,Box3} from 'three';

function heightRange(p:Placement){
 const b=layoutFor(p.asset)!.bounds,heights:number[]=[];
 for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]])heights.push(attachmentWorld(p,[x,y,z])[1]);
 return [Math.min(...heights),Math.max(...heights)];
}

it('conecta fundação, fuste e travessa sem deixar peças suspensas',()=>{
 expect(structuralSupports.length).toBeGreaterThan(30);
 for(const s of structuralSupports){
  const [foot,pier,cap]=s.parts.map(heightRange);
  expect(pier[0]-foot[1],s.road+' fundação/fuste').toBeLessThanOrEqual(.01);
  expect(cap[0]-pier[1],s.road+' fuste/travessa').toBeLessThanOrEqual(.01);
 }
});

it('assenta as lajes das plataformas sobre seus aparelhos de apoio',()=>{
 const platforms=structuralSupports.filter(s=>s.road.startsWith('platform-'));
 expect(platforms.length).toBeGreaterThan(0);
 for(const s of platforms){
  const cap=heightRange(s.parts[2]);
  expect(Math.abs(s.top-stationSlabThickness-cap[1]),s.road+' @ '+s.point).toBeLessThan(.015);
 }
});

it('assenta os dois aparelhos de cada apoio na malha exportada das vigas, inclusive nos cruzamentos rebaixados',async()=>{
 const asset=assetRegistry['prop.roadDeck'];if(asset.kind!=='glb')throw new Error('Tabuleiro sem modelo GLB');
 const doc=await new NodeIO().read('public'+asset.url),source:BufferGeometry[]=[];
 const material=new MeshBasicMaterial({side:DoubleSide});
 try{
  for(const node of doc.getRoot().listNodes())for(const primitive of node.getMesh()?.listPrimitives()??[]){
   const position=primitive.getAttribute('POSITION')!,indices=primitive.getIndices();
   const geometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute(position.getArray()!,3));
   if(indices)geometry.setIndex(Array.from(indices.getArray()!));
   geometry.applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));source.push(geometry);
  }
  const decks=roadStructures.filter(p=>p.asset==='prop.roadDeck').flatMap(p=>source.map(g=>{
   const mesh=new Mesh(g,material);mesh.position.fromArray(p.position);mesh.rotation.set(...p.rotation!);mesh.scale.fromArray(p.scale!);mesh.updateMatrixWorld();
   return {mesh,box:new Box3().setFromObject(mesh)};
  }));
  const ray=new Raycaster(),up=new Vector3(0,1,0),errors=[];
  for(const s of structuralSupports.filter(s=>!s.road.startsWith('platform-')))for(const pad of [-.28,.28]){
   let contacts=0;
   // Interior samples avoid the pad bevel. Each of the two bearings must
   // actually meet a girder, not merely share its bounding-box height.
   for(const dx of [-.045,0,.045])for(const z of [-.2,0,.2]){
    const p=attachmentWorld(s.parts[2],[pad+dx,.05,z]);ray.set(new Vector3(p[0],p[1]-.6,p[2]),up);ray.far=1.2;
    const meshes=decks.filter(d=>p[0]>=d.box.min.x&&p[0]<=d.box.max.x&&p[2]>=d.box.min.z&&p[2]<=d.box.max.z&&d.box.max.y>=p[1]-.6&&d.box.min.y<=p[1]+.6).map(d=>d.mesh);
    const hit=ray.intersectObjects(meshes,false)[0];if(hit&&Math.abs(hit.point.y-p[1])<=.025)contacts++;
   }
   if(!contacts)errors.push({road:s.road,point:s.point,pad});
  }
  expect(errors).toEqual([]);
 }finally{source.forEach(g=>g.dispose());material.dispose();}
});
