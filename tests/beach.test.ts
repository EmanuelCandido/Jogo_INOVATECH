import {describe,it,expect} from 'vitest';
import {DoubleSide,Mesh,MeshBasicMaterial,Raycaster,Vector3} from 'three';
import {beachFurniture} from '../src/config/beach';
import {beachColumns,beachGeometry,beachHeight,beachRows} from '../src/components/environment/beachGeometry';

describe('transição da praia',()=>{
 it('mantém a faixa dos móveis plana e liga a areia a uma parte submersa',()=>{
  expect(beachHeight(0)).toBe(-.31);expect(beachHeight(.64)).toBe(-.31);
  expect(beachHeight(1)).toBeLessThan(-.65);
  const g=beachGeometry(),p=g.getAttribute('position'),n=g.getAttribute('normal');
  for(let row=1;row<beachRows.length-1;row++){
   let previous=0,intersections=0;
   for(let col=0;col<=beachColumns;col++){
    const i=row*(beachColumns+1)+col,y=p.getY(i);
    expect(Number.isFinite(p.getX(i)+y+p.getZ(i))).toBe(true);
    expect(y).toBeLessThanOrEqual(previous);
    if(col&&previous>-.65&&y<=-.65)intersections++;
    expect(n.getY(i)).toBeGreaterThan(0);previous=y;
   }
   expect(intersections).toBe(1);
  }
 g.dispose();
 });
 it('apoia as espreguiçadeiras na faixa seca da praia',()=>{
  const g=beachGeometry(),material=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(g,material);
  const ray=new Raycaster();mesh.updateMatrixWorld();
  for(const placement of beachFurniture){
   const [x,,z]=placement.position,angle=placement.rotation![1];
   for(const dx of [-.85,.45])for(const dy of [-.43,.3]){
    const foot=new Vector3(dx,0,-dy).applyAxisAngle(new Vector3(0,1,0),angle).add(new Vector3(x,1,z));
    ray.set(foot,new Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];
    expect(hit,`pé em ${foot.x}, ${foot.z}`).toBeDefined();
    expect(hit.point.y,`altura do apoio em ${foot.x}, ${foot.z}`).toBeCloseTo(-.31,2);
   }
  }
  g.dispose();material.dispose();
 });
});
