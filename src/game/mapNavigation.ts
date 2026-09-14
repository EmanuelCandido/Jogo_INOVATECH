import {mapFit,referenceFrame} from '../config/referenceFrame';
export const MIN_MAP_ZOOM=1;
export const MAX_MAP_ZOOM=3.5;
export const mapLimits={minX:-190,maxX:175,minZ:-195,maxZ:130};
export const valleyLimits={minU:-106,maxU:140,minV:-72,maxV:118};
const horizontal=Math.hypot(110,145),elevation=130/Math.hypot(horizontal,130);
const rightX=145/horizontal,rightZ=110/horizontal;
export function clampZoom(zoom:number){return Math.max(MIN_MAP_ZOOM,Math.min(MAX_MAP_ZOOM,zoom));}
/** Ground footprint of the fixed isometric view, not just its centre. */
export function mapFootprint(zoom:number,width:number,height:number){
 return {x:(rightX*width+rightZ/elevation*height)/(2*zoom),z:(rightZ*width+rightX/elevation*height)/(2*zoom),u:width/(2*zoom),v:height/(2*zoom*elevation)};
}
export function mapBaseZoom(width:number,height:number){
 const extent=mapFootprint(1,width,height);
 return Math.max(referenceFrame.zoom*mapFit(width,height),2*extent.u/(valleyLimits.maxU-valleyLimits.minU),2*extent.v/(valleyLimits.maxV-valleyLimits.minV));
}
export function clampTarget(x:number,z:number,extent:{x:number;z:number;u?:number;v?:number}={x:0,z:0}):[number,number]{
 const axis=(v:number,min:number,max:number,r:number)=>min+r>max-r?(min+max)/2:Math.max(min+r,Math.min(max-r,v));
 const u=axis(x*rightX-z*rightZ,valleyLimits.minU,valleyLimits.maxU,extent.u??0),v=axis(-x*rightZ-z*rightX,valleyLimits.minV,valleyLimits.maxV,extent.v??0);
 return [rightX*u-rightZ*v,-rightZ*u-rightX*v];
}
