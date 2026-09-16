import metadata from '../../assets-source/model-attachments.json' with {type:'json'};
import lodModels from '../../assets-source/model-lods.json' with {type:'json'};
import {assetRegistry,type ModelAsset} from './registry';
import {publicAsset} from './publicAsset';
import type {GraphicsTier,Placement,Vec3} from '../game/types';

export interface ModelLayout {
 front:Vec3; entry?:Vec3; loading?:Vec3; platform?:Vec3; roof?:Vec3; roofDetail?:Vec3; essentialRoof?:boolean;
 bounds:{min:Vec3;max:Vec3};
}
export const modelLayouts=metadata as unknown as Record<string,ModelLayout>;
const economical=new Set(lodModels);
export function modelUrl(asset:Extract<ModelAsset,{kind:'glb'}>,tier:GraphicsTier){
 const name=asset.url.split('/').at(-1)!.replace('.glb','');
 return publicAsset((tier==='MINIMUM'||tier==='LOW')&&economical.has(name)?asset.url.replace('.glb','-low.glb'):asset.url);
}
export function layoutFor(id:string){
 const asset=assetRegistry[id];
 return asset?.kind==='glb'?modelLayouts[asset.url.split('/').at(-1)!.replace('.glb','')]:undefined;
}
export function attachmentWorld(p:Placement,point:Vec3):Vec3{
 const s=p.scale??[1,1,1],[rx,ry,rz]=p.rotation??[0,0,0];
 const [x,y,z]=point.map((v,i)=>v*s[i]);
 // Intrinsic XYZ Euler rotation: apply Z, then Y, then X to the vector.
 // Keep this utility light because the narrative also uses entrance sockets.
 const x1=Math.cos(rz)*x-Math.sin(rz)*y,y1=Math.sin(rz)*x+Math.cos(rz)*y;
 const x2=Math.cos(ry)*x1+Math.sin(ry)*z,z2=-Math.sin(ry)*x1+Math.cos(ry)*z;
 return [x2+p.position[0],Math.cos(rx)*y1-Math.sin(rx)*z2+p.position[1],Math.sin(rx)*y1+Math.cos(rx)*z2+p.position[2]];
}
