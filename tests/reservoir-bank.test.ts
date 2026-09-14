import {expect,it} from 'vitest';
import {reservoirOutline,reservoirWaterHeight} from '../src/config/reservoir';
import {terrainY,worldPoint,compositionPoint} from '../src/config/referenceMap';
import {valleyLand} from '../src/components/environment/referenceGeometry';
import {contains} from '../src/config/spatial';
import {Mesh,MeshBasicMaterial,DoubleSide,Raycaster,Vector3,BufferGeometry,Float32BufferAttribute} from 'three';

it('suaviza a margem natural e preserva os dois encontros com a barragem',()=>{
 expect(reservoirOutline[0]).toEqual([-42,84]);
 expect(reservoirOutline.at(-1)).toEqual([-30,84]);
 for(let i=1;i<reservoirOutline.length-1;i++){
  const a=reservoirOutline[i-1],b=reservoirOutline[i],c=reservoirOutline[i+1];
  const cosine=((b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1]))/(Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(c[0]-b[0],c[1]-b[1]));
  expect(cosine,'quina na margem '+i).toBeGreaterThan(Math.cos(Math.PI/12));
 }
});

it('mantém o reservatório aberto na malha de terreno renderizada',()=>{
 const source=valleyLand(),positions=source.getAttribute('position'),index=source.getIndex()!,vertices:number[]=[];
 // Keep every rendered triangle whose bounding box meets the tested region.
 // The distant mountain/coast triangles cannot intersect these vertical rays.
 for(let i=0;i<index.count;i+=3){
  const corners=[0,1,2].map(j=>new Vector3().fromBufferAttribute(positions,index.getX(i+j))),uv=corners.map(p=>compositionPoint(p.x,p.z));
  if(Math.max(...uv.map(p=>p[0]))< -55||Math.min(...uv.map(p=>p[0]))> -19||Math.max(...uv.map(p=>p[1]))<84||Math.min(...uv.map(p=>p[1]))>115)continue;
  for(const p of corners)vertices.push(p.x,p.y,p.z);
 }
 source.dispose();
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
 const material=new MeshBasicMaterial({side:DoubleSide}),mesh=new Mesh(geometry,material);
 mesh.updateMatrixWorld();
 const ray=new Raycaster(new Vector3(),new Vector3(0,-1,0));let checked=0;
 for(let u=-49;u<=-23;u+=.8)for(let v=84.4;v<=111.5;v+=.8){
  if(!contains([u,v],reservoirOutline))continue;
  ray.ray.origin.set(...worldPoint(u,v,40));
  expect(ray.intersectObject(mesh)[0],u+','+v).toBeUndefined();checked++;
 }
 expect(checked).toBeGreaterThan(400);
 // The former rectangular insert doubled the mainland at its lateral edges.
 // A ray outside the lake must meet exactly one surface, with no gap or layer.
 for(let u=-54.37;u<=-19.2;u+=.91)for(let v=85.23;v<=114.6;v+=1.13){
  if(contains([u,v],reservoirOutline))continue;
  ray.ray.origin.set(...worldPoint(u,v,50));
  expect(ray.intersectObject(mesh).length,'camadas de margem '+u+','+v).toBe(1);
 }
 geometry.dispose();material.dispose();
},30000); // Builds the complete land mesh before testing the reservoir rays.

it('liga o terreno à linha da água sem a antiga borda suspensa',()=>{
 for(let i=1;i<reservoirOutline.length;i++){
  const a=reservoirOutline[i-1],b=reservoirOutline[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.25);
  for(let j=0;j<=n;j++){
   const u=a[0]+(b[0]-a[0])*j/n,v=a[1]+(b[1]-a[1])*j/n;
   if(v<86)continue;
   expect(terrainY(u,v),'linha da água '+u+','+v).toBeCloseTo(reservoirWaterHeight,4);
  }
 }
});
