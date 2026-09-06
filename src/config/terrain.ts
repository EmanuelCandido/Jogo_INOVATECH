import {CatmullRomCurve3,Vector3} from 'three';
import {riverCenter,riverHalfWidth} from './riverProfile';
import {roadPlacements} from './infrastructure';
export {riverCenter,riverHalfWidth} from './riverProfile';
export const coastControl=[[-5,-1000],[-5,-80],[4,-70],[10,-63],[10,-57],[29,-54],[39,-45],[45,-36],[54,-29],[61,-19],[57,-8],[50,7],[42,20],[35,32],[31,48],[28,80],[28,1000]];
export const coastline=new CatmullRomCurve3(coastControl.map(([x,z])=>new Vector3(x,0,z)),false,'catmullrom',.15).getPoints(900);
function bankMeeting(offset:number){
  const index=coastline.findIndex(p=>p.z>=riverCenter(p.x)+offset);
  const a=coastline[index-1],b=coastline[index];
  const fa=a.z-riverCenter(a.x)-offset,fb=b.z-riverCenter(b.x)-offset;
  const t=-fa/(fb-fa),x=a.x+(b.x-a.x)*t;
  return {index,point:new Vector3(x,0,riverCenter(x)+offset)};
}
const upper=bankMeeting(-riverHalfWidth),lower=bankMeeting(riverHalfWidth);
export const riverMouth=(upper.point.x+lower.point.x)/2;
export function landOutlines(){
  const bank=(offset:number,end:number)=>[-1000,-200,-100,...Array.from({length:Math.ceil((end+100)/.35)},(_,i)=>-100+i*.35),end].map(x=>new Vector3(x,0,riverCenter(x)+offset));
  return [
    [new Vector3(-1000,0,-1000),...coastline.slice(0,upper.index),upper.point,...bank(-riverHalfWidth,upper.point.x).reverse()],
    [...bank(riverHalfWidth,lower.point.x),lower.point,...coastline.slice(lower.index),new Vector3(-1000,0,1000)],
  ];
}
const outlines=landOutlines();
export function onLand(x:number,z:number){
  return outlines.some(points=>{
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];
      if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
    }return inside;
  });
}
export function woodlandRegion(x:number,z:number){return x<z-28 || x+z<-49 || z>39;}
export function terrainHeight(x:number,z:number){
  const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
  // The railway hill fits inside its block. Pavements and roads reserve a level
  // corridor before the slope rises; clipping only the centreline is insufficient.
  const d=Math.hypot((x+34.2)/4.5,(z+18.1)/4.1);
  let h=3.65*(1-smooth((d-.32)/.68));
  if(h===0)return 0;
  for(const p of roadPlacements){
    const dx=Math.max(0,Math.abs(x-p.position[0])-p.scale![0]/2-.66);
    const dz=Math.max(0,Math.abs(z-p.position[2])-p.scale![2]/2-.66);
    h*=smooth(Math.hypot(dx,dz)/.85);
  }
  // Open approach in front of the portal; the roof behind it remains a hill.
  const along=z+15.9,across=Math.abs(x+34.5+along*.23);
  if(along>-.2)h*=smooth((across-1.13)/.6);
  return h;
}
