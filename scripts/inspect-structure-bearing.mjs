// Read the actual exported deck geometry against the current placed bearings.
// Reuse the prepared population; the full suite separately checks that snapshot.
import {createServer} from 'vite';
import {modelIO} from './modelIO.mjs';
import {writeFile} from 'node:fs/promises';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,DoubleSide,Matrix4,Vector3,Quaternion,Euler,Raycaster,Box3} from 'three';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]},plugins:[{
 name:'inspect-prepared-population',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/config/referenceMap.ts'))return code.replaceAll('import.meta.env?.SSR','false');},
}]});
try{
 const map=await server.ssrLoadModule('/src/config/referenceMap.ts');
 const {roadStructures,structuralSupports}=await server.ssrLoadModule('/src/config/roadStructures.ts');
 const {attachmentWorld,layoutFor}=await server.ssrLoadModule('/src/assets/modelLayout.ts');
 const {polygon}=await server.ssrLoadModule('/src/components/environment/referenceGeometry.ts');
 const {stationSlabThickness}=await server.ssrLoadModule('/src/config/stationPerimeters.ts');
 const {assetRegistry}=await server.ssrLoadModule('/src/assets/registry.ts');
 const doc=await modelIO().read('public'+assetRegistry['prop.roadDeck'].url),source=[];
 for(const node of doc.getRoot().listNodes())for(const primitive of node.getMesh()?.listPrimitives()??[]){
  const p=primitive.getAttribute('POSITION'),indices=primitive.getIndices();
  const g=new BufferGeometry().setAttribute('position',new Float32BufferAttribute(p.getArray(),3));
  if(indices)g.setIndex(Array.from(indices.getArray()));
  g.applyMatrix4(new Matrix4().fromArray(node.getWorldMatrix()));source.push(g);
 }
 const material=new MeshBasicMaterial({side:DoubleSide}),decks=[];
 for(const p of roadStructures.filter(p=>p.asset==='prop.roadDeck'))for(const g of source){
  const mesh=new Mesh(g,material);mesh.position.fromArray(p.position);mesh.rotation.set(...p.rotation);mesh.scale.fromArray(p.scale);mesh.updateMatrixWorld();
  decks.push({mesh,box:new Box3().setFromObject(mesh)});
 }
 for(const s of map.railFacilities){
  const mesh=new Mesh(polygon(s.footprint,s.height-stationSlabThickness),material);mesh.updateMatrixWorld();decks.push({mesh,box:new Box3().setFromObject(mesh)});
 }
 const ray=new Raycaster(),report=[];
 for(const support of structuralSupports){
  const cap=support.parts[2],samples=[];
  for(const pad of [-.28,.28])for(const dx of [-.045,0,.045])for(const dz of [-.2,0,.2]){
   const p=attachmentWorld(cap,[pad+dx,.05,dz]),origin=new Vector3(p[0],p[1]-.6,p[2]);
   ray.set(origin,new Vector3(0,1,0));ray.far=1.2;
   const candidates=decks.filter(d=>p[0]>=d.box.min.x&&p[0]<=d.box.max.x&&p[2]>=d.box.min.z&&p[2]<=d.box.max.z&&d.box.max.y>=origin.y&&d.box.min.y<=origin.y+1.2);
   const hits=ray.intersectObjects(candidates.map(d=>d.mesh),false),hit=hits[0];
   samples.push({pad,dx,dz,point:p,gap:hit?hit.point.y-p[1]:null});
  }
  const foot=support.parts[0],bounds=layoutFor(foot.asset).bounds;
  const foundationGaps=[];
  for(const x of [bounds.min[0],0,bounds.max[0]])for(const z of [bounds.min[2],0,bounds.max[2]]){
   const p=attachmentWorld(foot,[x,bounds.min[1],z]),uv=map.compositionPoint(p[0],p[2]);
   if(map.onReferenceLand(...uv))foundationGaps.push(p[1]-map.terrainY(...uv));
  }
  const hits=samples.filter(s=>s.gap!==null),contact=hits.filter(s=>Math.abs(s.gap)<=.025);
  report.push({road:support.road,point:support.point,hits:hits.length,contacts:contact.length,minGap:hits.length?Math.min(...hits.map(s=>s.gap)):null,maxGap:hits.length?Math.max(...hits.map(s=>s.gap)):null,maxFoundationGap:foundationGaps.length?Math.max(...foundationGaps):null,samples});
 }
 const missingContact=report.filter(r=>!r.contacts),floatingFoundations=report.filter(r=>r.maxFoundationGap>.02);
 const routes=[...map.mapRoads,map.roadViaduct,map.monorail,map.centralRail,...map.stationConcourses];
 const along=(point,route)=>{
  let best=Infinity,distance=0,travel=0;
  for(let i=1;i<route.points.length;i++){
   const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dz)/(length*length||1)));
   const gap=Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dz);
   if(gap<best){best=gap;distance=travel+t*length;}travel+=length;
  }return distance;
 };
 const spanReview=[];
 for(const route of routes){
  const positions=structuralSupports.filter(s=>s.road===route.id).map(s=>along(s.point,route)).sort((a,b)=>a-b);
  let travel=0,maxSupportDistance=0,at=null;
  for(let i=1;i<route.points.length;i++){
   const a=route.points[i-1],b=route.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(length));
   for(let j=0;j<=steps;j++){
    const t=j/steps,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],height=map.roadHeightAt(route,p),base=map.onReferenceLand(...p)?map.terrainY(...p):-1.2;
    if(height-base<1.3)continue;
    const distance=Math.min(...positions.map(s=>Math.abs(s-travel-t*length)));
    if(distance>maxSupportDistance){maxSupportDistance=distance;at=p;}
   }travel+=length;
  }
  if(at)spanReview.push({road:route.id,supports:positions.length,maxSupportDistance:Number.isFinite(maxSupportDistance)?maxSupportDistance:null,at});
 }
 const result={version:'actual GLB deck triangles; bearing-pad interior samples; prepared population',supports:report.length,missingContact,floatingFoundations,spanReview,report};
 await writeFile('docs/validation/structure-bearing-mesh.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({supports:report.length,missingContact:missingContact.map(({samples,...r})=>r),floatingFoundations:floatingFoundations.map(({samples,...r})=>r),spanReview},null,2));
}finally{await server.close();}
