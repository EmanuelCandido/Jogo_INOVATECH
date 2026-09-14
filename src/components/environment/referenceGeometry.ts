import {BufferGeometry,Float32BufferAttribute,Shape,Path,ShapeGeometry,Color,Vector2} from 'three';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {tessellateSurface} from '../../assets/surfaceTriangulation';
import clip from 'polygon-clipping';
import {mergeSurfaceGeometry as merged} from '../../assets/mergeSurfaceGeometry';
export {merged};
import {worldPoint,terrainY,riverU,riverWidth,canalU,riverSamples,canalSamples,landOutlines,reservoirOutline,type MapPoint} from '../../config/referenceMap';

export function polygon(points:MapPoint[],height:number|((u:number,v:number)=>number)=0,land=false,holes:MapPoint[][]=[],maxEdge:number|((a:MapPoint,b:MapPoint)=>number)=land?2.8:Infinity){
 const shape=new Shape(points.map(([x,y])=>new Vector2(x,y)));shape.closePath();for(const hole of holes){const path=new Path(hole.map(([x,y])=>new Vector2(x,y)));path.closePath();shape.holes.push(path);}const source=new ShapeGeometry(shape);
 const pos=source.attributes.position,idx=source.index!,vertices:number[]=[],colors:number[]=[],uvs:number[]=[],surfacePoints:MapPoint[]=[];
 const improve=!land&&maxEdge!==Infinity;
 const add=(p:MapPoint)=>{const y=typeof height==='number'?height:height(...p);vertices.push(...worldPoint(...p,y));uvs.push(...p);if(land){const tone=.018*Math.sin(p[0]*.18+p[1]*.21)+.015*Math.cos(p[0]*.37-p[1]*.15),color=new Color('#92bd66').lerp(new Color('#889887'),Math.max(0,Math.min(.85,(y-4)/22)));color.offsetHSL(0,0,tone);const clearing=((p[0]-17)/19)**2+((p[1]-80)/11)**2;color.lerp(new Color('#b58b54'),Math.max(0,Math.min(1,(1.08-clearing)*5)));colors.push(...color.toArray());}};
 const triangle=(a:MapPoint,b:MapPoint,c:MapPoint,depth=0)=>{
  if(improve){surfacePoints.push(a,b,c);return;}
  const ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(b[0]-c[0],b[1]-c[1]),ca=Math.hypot(c[0]-a[0],c[1]-a[1]);
  const abRatio=ab/(typeof maxEdge==='number'?maxEdge:maxEdge(a,b)),bcRatio=bc/(typeof maxEdge==='number'?maxEdge:maxEdge(b,c)),caRatio=ca/(typeof maxEdge==='number'?maxEdge:maxEdge(c,a));
  if(Math.max(abRatio,bcRatio,caRatio)>1&&depth<24){
   if(abRatio>=bcRatio&&abRatio>=caRatio){const m:MapPoint=[(a[0]+b[0])/2,(a[1]+b[1])/2];triangle(a,m,c,depth+1);triangle(m,b,c,depth+1);}
   else if(bcRatio>=caRatio){const m:MapPoint=[(b[0]+c[0])/2,(b[1]+c[1])/2];triangle(a,b,m,depth+1);triangle(a,m,c,depth+1);}
   else{const m:MapPoint=[(c[0]+a[0])/2,(c[1]+a[1])/2];triangle(a,b,m,depth+1);triangle(m,b,c,depth+1);}return;
  }add(a);add(b);add(c);
 };
 for(let i=0;i<idx.count;i+=3){const p=(j:number):MapPoint=>[pos.getX(idx.getX(j)),pos.getY(idx.getX(j))];triangle(p(i),p(i+1),p(i+2));}
 source.dispose();const g=new BufferGeometry();
 if(improve){const improved=tessellateSurface(surfacePoints,maxEdge,typeof height==='function'?height:undefined);improved.points.forEach(add);g.setIndex(improved.indices);}
 g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));if(land)g.setAttribute('color',new Float32BufferAttribute(colors,3));if(land){const smooth=mergeVertices(g,.0001);g.dispose();smooth.computeVertexNormals();return smooth;}g.computeVertexNormals();return g;
}
export function ribbon(points:MapPoint[],width:number|((u:number,v:number)=>number),height:number|((i:number)=>number)=.02,offset=0,crossSlope=0,horizontal=false){
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];let along=0;
 points.forEach(([u,v],i)=>{
  const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],du=b[0]-a[0],dv=b[1]-a[1],l=Math.hypot(du,dv)||1,w=typeof width==='number'?width:width(u,v);
  if(i)along+=Math.hypot(u-points[i-1][0],v-points[i-1][1]);
  for(const s of [-1,1]){const distance=offset+s*w/2;positions.push(...worldPoint(u+(horizontal?1:-dv/l)*distance,v+(horizontal?0:du/l)*distance,(typeof height==='number'?height:height(i))+crossSlope*(s+1)/2));uv.push(along,(s+1)/2);}
  if(i<points.length-1){const j=i*2;indices.push(j,j+2,j+1,j+2,j+3,j+1);}
 });
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function wall(points:MapPoint[],top=.13,bottom=-.62){
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 points.forEach(([u,v],i)=>{positions.push(...worldPoint(u,v,bottom),...worldPoint(u,v,top));uv.push(i,0,i,1);if(i<points.length-1){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}});
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function valleyLand(){
 // The reservoir insert overlaps the mainland along both banks. Unite the
 // domains before triangulation so independently subdivided coplanar faces
 // cannot flicker or leave conflicting slopes around the lake.
 const land=clip.union([landOutlines[0]],...landOutlines.slice(1).map(points=>[points]),[[[-55,84],[-19,84],[-19,160],[-55,160]]]);
 const dry=clip.difference(land,[reservoirOutline]);
 const heights=new Map<string,number>();
 const height=(u:number,v:number)=>{const key=u+','+v,cached=heights.get(key);if(cached!==undefined)return cached;const value=terrainY(u,v);heights.set(key,value);return value;};
 // Refine the curved lake bank without multiplying detail across flat land.
 // An edge's limit is shared by both adjacent triangles, including tile joins.
 const bankDetail=(a:MapPoint,b:MapPoint)=>Math.max(a[0],b[0])>=-54&&Math.min(a[0],b[0])<=-18&&Math.max(a[1],b[1])>=84&&Math.min(a[1],b[1])<=116?1:2.8;
 const geometry=merged(dry.map(poly=>polygon(poly[0],height,true,poly.slice(1),bankDetail)));
 const uv=geometry.getAttribute('uv'),normals=geometry.getAttribute('normal');
 // Long, narrow source triangles can give shared slope vertices strongly
 // different area-weighted normals. Derive lighting from the height field,
 // independently of the triangulation, without changing the terrain shape.
 for(let i=0;i<uv.count;i++){
  const u=uv.getX(i),v=uv.getY(i),du=(height(u+.2,v)-height(u-.2,v))/.4,dv=(height(u,v+.2)-height(u,v-.2))/.4;
  const n=worldPoint(-du,-dv,1),length=Math.hypot(...n);normals.setXYZ(i,n[0]/length,n[1]/length,n[2]/length);
 }
 return geometry;
}
export const cleanBanks=[-1,1].map(side=>riverSamples.map(([u,v])=>[u+side*riverWidth(v)/2,v] as MapPoint));
export const dirtyBanks=[-1,1].map(side=>canalSamples.filter(([,v])=>side<0?v>-34:v>18).map(([u,v])=>[u+side*4.5,v] as MapPoint));

