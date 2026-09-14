import {describe,it,expect} from 'vitest';
import {DoubleSide,Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {mountainGeometry} from '../src/components/environment/mountainGeometry';
import {riverCenter} from '../src/config/terrain';

describe('canal do rio sob a montanha',()=>{
 it('não coloca triângulos da montanha sobre o canal, inclusive no antigo corte',()=>{
  const geometry=mountainGeometry(),material=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(geometry,material);
  mesh.updateMatrixWorld();
  for(let x=-98;x<=-23;x+=.37)for(const offset of [-.75,0,.75]){
   const ray=new Raycaster(new Vector3(x,40,riverCenter(x)+offset),new Vector3(0,-1,0));
   const hit=ray.intersectObject(mesh)[0];

   expect(hit,`terreno cobre a água em ${x}`).toBeUndefined();
  }
  geometry.dispose();material.dispose();
 });
});

