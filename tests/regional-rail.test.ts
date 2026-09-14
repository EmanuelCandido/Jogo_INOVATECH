import {describe,it,expect} from 'vitest';
import {monorail,centralRail,regionalRailPoints,railFacilities,routeHeight,referenceAssets,placementFootprint,worldPoint} from '../src/config/referenceMap';
import {corridorGap} from '../src/config/spatial';
import {valleyLimits,mapBaseZoom,mapFootprint,clampTarget,MAX_MAP_ZOOM} from '../src/game/mapNavigation';
import {Box3,Frustum,Matrix4,OrthographicCamera,Vector3} from 'three';
import {problems} from '../src/content/problems';
import {layoutFor} from '../src/assets/modelLayout';
import {mapRoads,roadHeightAt,distanceToRoute,terrainY} from '../src/config/referenceMap';
describe('ferrovia regional pelo arco norte',()=>{
 it('mantém tabuleiro fora do terreno e vão para os veículos nas travessias rodoviárias',()=>{
  const deckDepth=-layoutFor('prop.roadDeck')!.bounds.min[1]+.015;
  const truckHeight=layoutFor('prop.truck')!.bounds.max[1],busHeight=layoutFor('prop.bus')!.bounds.max[1];
  for(const rail of [monorail,centralRail])for(let i=1;i<rail.points.length;i++){
   const a=rail.points[i-1],b=rail.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(length/.25));
   expect(Math.abs(routeHeight(rail,i)-routeHeight(rail,i-1))/length).toBeLessThanOrEqual(.04);
   for(let j=0;j<=steps;j++){
    const t=j/steps,p:[number,number]=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],floor=routeHeight(rail,i-1)*(1-t)+routeHeight(rail,i)*t;
    for(const side of [-1,0,1]){
     const q:[number,number]=[p[0]-(b[1]-a[1])/length*rail.width/2*side,p[1]+(b[0]-a[0])/length*rail.width/2*side];
     expect(floor-deckDepth-terrainY(...q),`${rail.id} terreno ${q}`).toBeGreaterThan(0);
     for(const road of mapRoads)if(distanceToRoute(...q,road)<=road.width/2){
      const required=(road.usage==='freight'?truckHeight:Math.max(truckHeight,busHeight))+.09+.3;
      expect(floor-deckDepth-roadHeightAt(road,q),`${rail.id}/${road.id} ${q}`).toBeGreaterThan(required);
     }
    }
   }
  }
 });
 it('oculta o término oeste e uma composição inteira nos extremos de navegação e câmeras de missão',()=>{
  // Include the entire terminal section, track width, supports and a full
  // five-car composition above it. Testing only its ground centre misses
  // objects which rise into the viewport from outside the ground footprint.
  const train=layoutFor('prop.train')!.bounds,cab=layoutFor('prop.trainCab')!.bounds;
  const carriageLength=Math.max(train.max[2]-train.min[2],cab.max[2]-cab.min[2])*1.2;
  const hiddenLength=5*carriageLength+4*.08;
  const [u,v]=monorail.points[0],box=new Box3();
  for(const x of [u-2,u+hiddenLength+2])for(const z of [v-3,v+3])for(const y of [0,routeHeight(monorail,0)+Math.max(train.max[1],cab.max[1])*1.2+.18])box.expandByPoint(new Vector3(...worldPoint(x,z,y)));
  const verify=(camera:OrthographicCamera,label:string)=>{
   camera.updateProjectionMatrix();camera.updateMatrixWorld();
   const frustum=new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   expect(frustum.intersectsBox(box),label).toBe(false);
  };
  for(const [w,h] of [[1672,941],[2560,1080],[360,640],[390,844],[360,1100]]){
   for(const factor of [1,1.25,2,MAX_MAP_ZOOM])for(const dx of [-999,0,999])for(const dz of [-999,0,999]){
    const camera=new OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,700);camera.zoom=mapBaseZoom(w,h)*factor;
    const [x,z]=clampTarget(dx,dz,mapFootprint(camera.zoom,w,h));
    camera.position.set(x+110,130,z+145);camera.lookAt(x,0,z);
    verify(camera,`navegação ${w}x${h}, zoom ${factor}, ${dx}/${dz}`);
   }
   for(const problem of problems){
    const shot=problem.camera,camera=new OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,700);
    camera.zoom=shot.zoom*(w<=650?Math.min(w/500,h/270,1):Math.min(w/1100,h/760,1.25));
    camera.position.set(...shot.position);camera.lookAt(...shot.target);
    verify(camera,`missão ${problem.id}, ${w}x${h}`);
   }
  }
 });
 it('substitui o anel inferior por uma saída oeste e uma ligação contínua',()=>{
  expect(monorail.points[0][0]).toBeLessThan(valleyLimits.minU-30);
  expect(monorail.points.at(-1)).toEqual(centralRail.points[0]);
  expect(monorail.points.every(p=>p[1]>58)).toBe(true);
  expect(regionalRailPoints.length).toBe(monorail.points.length+centralRail.points.length-1);
  expect(routeHeight(monorail,monorail.points.length-1)).toBe(routeHeight(centralRail,0));
 });
 it('entra na linha central sem uma quina e retira a parada inferior',()=>{
  const a=monorail.points.at(-2)!,b=centralRail.points[0],c=centralRail.points[1];
  const cosine=((b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1]))/(Math.hypot(b[0]-a[0],b[1]-a[1])*Math.hypot(c[0]-b[0],c[1]-b[1]));
  expect(cosine).toBeGreaterThan(.99999);
  const campus=railFacilities.filter(s=>s.name==='Campus do Futuro');
  expect(campus).toHaveLength(1);expect(campus[0].centre[1]).toBeGreaterThan(74);
  expect(railFacilities.some(s=>s.name==='Jardim Botânico')).toBe(false);
 });
 it('mantém os rotores das turbinas fora do corredor ferroviário',()=>{
  for(const turbine of referenceAssets.filter(p=>p.asset==='prop.turbine')){
   for(const rail of [monorail,centralRail])expect(corridorGap(placementFootprint(turbine),rail.points,rail.width),turbine.position.join(',')).toBeGreaterThan(.5);
  }
 });
});
