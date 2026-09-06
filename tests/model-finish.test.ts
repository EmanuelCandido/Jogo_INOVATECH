import {describe,it,expect} from 'vitest';
import {NodeIO} from '@gltf-transform/core';
import {Box3,Euler,Matrix4,Triangle,Vector3} from 'three';
import {terrainHeight} from '../src/config/terrain';
import {roadPlacements} from '../src/config/infrastructure';
import {seatSites,benchFacing,sportsAccess} from '../src/config/publicSpaces';
import {situationVisuals} from '../src/config/situationVisuals';
import {assetRegistry} from '../src/assets/registry';
import {cityDecorations} from '../src/config/cityDetails';

async function trianglesInPassage(file:string,passage:Box3){
 const doc=await new NodeIO().read(`public/assets/models/${file}.glb`),hits:string[]=[];
 for(const node of doc.getRoot().listNodes()){
  const world=new Matrix4().fromArray(node.getWorldMatrix());
  for(const primitive of node.getMesh()?.listPrimitives()??[]){
   const pos=primitive.getAttribute('POSITION')!,indices=primitive.getIndices();
   for(let i=0;i<(indices?.getCount()??pos.getCount());i+=3){
    const points=[0,1,2].map(j=>new Vector3().fromArray(pos.getElement(indices?indices.getScalar(i+j):i+j,[])).applyMatrix4(world));
    if(passage.intersectsTriangle(new Triangle(points[0],points[1],points[2])))hits.push(`${node.getName()}:${i/3}`);
   }
  }
 }
 return hits;
}
describe('acabamento e acessos reais dos modelos',()=>{
 it('mantém o terreno abaixo de toda pista e dos passeios junto à montanha',()=>{
  for(const p of roadPlacements){
   if(Math.abs(p.position[0]+34)<p.scale![0]/2+8&&Math.abs(p.position[2]+18)<p.scale![2]/2+8){
    for(let x=p.position[0]-p.scale![0]/2-.48;x<=p.position[0]+p.scale![0]/2+.48;x+=.24)
     for(let z=p.position[2]-p.scale![2]/2-.48;z<=p.position[2]+p.scale![2]/2+.48;z+=.24)
      expect(terrainHeight(x,z),`terreno sobre a rua em ${x},${z}`).toBe(0);
   }
  }
 expect(terrainHeight(-34.2,-18.1)).toBeGreaterThan(2.5);
 });
 it('mantém a base inteira do mobiliário fora das encostas',()=>{
  const sites=cityDecorations.filter(p=>p.footprint);
  expect(sites.length).toBeGreaterThan(0);
  for(const site of sites){
   const {x,z,radius:r}=site.footprint!;
   for(const [dx,dz] of [[0,0],[-r,-r],[-r,r],[r,-r],[r,r]])
    expect(terrainHeight(x+dx,z+dz),`${site.id}: base na encosta`).toBeLessThan(.025);
  }
 });
 it('preserva vãos livres nos GLBs das quadras e no centro do píer',async()=>{
  for(const [file,box] of [
   ['court',new Box3(new Vector3(-.31,.18,1.18),new Vector3(.31,1.2,1.4))],
   ['football-field',new Box3(new Vector3(-.42,.18,2.74),new Vector3(.42,1.3,3))],
   ['pier',new Box3(new Vector3(-4.4,.18,-.34),new Vector3(4.7,.78,.34))],
  ] as const)expect(await trianglesInPassage(file,box),`${file}: peças dentro da passagem`).toEqual([]);
 });
 it('liga os portões às calçadas e orienta cada banco para seu espaço de uso',()=>{
  for(const [x,z,w] of [[-15,-14.8165,.7],[45,-15.394,.8],[-15,-20.13,.9]]){
   expect(sportsAccess.some(p=>Math.abs(p.position[0]-x)<.01&&Math.abs(z-p.position[2])<=p.scale![2]/2+.05&&p.scale![0]>=w)).toBe(true);
  }
  for(const site of seatSites){
   const p=benchFacing(site),forward=new Vector3(-1,0,0).applyEuler(new Euler(...p.rotation!));
   const wanted=new Vector3(site.target[0]-site.x,0,site.target[1]-site.z).normalize();
   expect(forward.dot(wanted),site.id).toBeCloseTo(1,5);
  }
 });
 it('usa modelos válidos e completos em todos os estados das dez situações',()=>{
  expect(Object.keys(situationVisuals)).toHaveLength(10);
  for(const [id,states] of Object.entries(situationVisuals))for(const [state,v] of Object.entries(states)){
   expect(v.assets.length+v.details.length,`${id}/${state}`).toBeGreaterThan(0);
   for(const p of [...v.assets,...v.details]){
    expect(p.position.every(Number.isFinite)).toBe(true);
    expect((p.scale??[1,1,1]).every(n=>Number.isFinite(n)&&n>0)).toBe(true);
    if('asset'in p)expect(assetRegistry[p.asset],p.asset).toBeDefined();
   }
  }
 });
});
