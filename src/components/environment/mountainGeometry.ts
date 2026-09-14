import {BufferGeometry,Color,Float32BufferAttribute} from 'three';
import {terrainHeight,mountainBounds,riverCenter,riverHalfWidth} from '../../config/terrain';

export function mountainGeometry(){
    const vertices:number[]=[],indices:number[]=[],colors:number[]=[];
    const nx=Math.round((mountainBounds.maxX-mountainBounds.minX)/.5),nz=Math.round((mountainBounds.maxZ-mountainBounds.minZ)/.5);
    const grass=new Color('#7ac764'),stone=new Color('#929688'),warm=new Color('#b4aa92');
    for(let iz=0;iz<=nz;iz++)for(let ix=0;ix<=nx;ix++){
      const x=mountainBounds.minX+ix*.5,z=mountainBounds.minZ+iz*.5,h=terrainHeight(x,z);
      // The flat part of this overlay used to cap the river at X = -23.
      // Leave the channel open; the mainland already supplies its continuous banks.

      vertices.push(x,h-.018,z);
      const slope=Math.hypot(terrainHeight(x+.3,z)-terrainHeight(x-.3,z),terrainHeight(x,z+.3)-terrainHeight(x,z-.3))/.6;
      const exposure=Math.max(0,Math.min(1,(h-6)/9))*Math.max(0,Math.min(1,(slope-.38)*1.5+(h-18)*.09));
      const rock=stone.clone().lerp(warm,.35+.25*Math.sin(x*.35+z*.63));
      grass.clone().lerp(rock,exposure).toArray(colors,colors.length);
      if(ix<nx&&iz<nz&&[0,.5].every(dx=>[0,.5].every(dz=>Math.abs(z+dz-riverCenter(x+dx))>riverHalfWidth+.25))){const j=iz*(nx+1)+ix;indices.push(j,j+nx+1,j+1,j+1,j+nx+1,j+nx+2);}
    }
    const hills=new BufferGeometry();hills.setAttribute('position',new Float32BufferAttribute(vertices,3));hills.setAttribute('color',new Float32BufferAttribute(colors,3));hills.setIndex(indices);hills.computeVertexNormals();
return hills;
}
