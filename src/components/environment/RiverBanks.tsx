import {useMemo} from 'react';
import {AssetBatch} from '../city/AssetBatch';
import {riverCenter,riverHalfWidth,terrainHeight} from '../../config/terrain';
import {useResolvedGraphics} from '../../stores/graphicsStore';
import {keepDetail} from '../../config/graphics';
import type {Placement} from '../../game/types';

/** Irregular riparian clusters stop before the bridge and mission reach. */
export function RiverBanks(){
 const {forestDensity}=useResolvedGraphics();
 const placements=useMemo(()=>{
  const items:Placement[]=[];
  for(let i=0;i<30;i++)for(const side of [-1,1]){
   const x=-95+i*2.3+Math.sin(i*7.1)*.45;
   const z=riverCenter(x)+side*(riverHalfWidth+.22+Math.sin(i*2.4)**2*.4);
   if(keepDetail(i+Number(side>0)*31,Math.max(.3,forestDensity))){
    items.push({asset:'prop.rock',position:[x,terrainHeight(x,z)-.20,z],scale:[.32+i%3*.08,.34,.28],rotation:[0,i*1.9,0]});
    if(i%3===0){
     const bz=z+side*.9;
     items.push({asset:'tree.thicket',position:[x+.5,terrainHeight(x+.5,bz),bz],scale:[.3,.36,.3],rotation:[0,i*.7,0]});
    }
   }
  }
  return items;
 },[forestDensity]);
 return <group name="Margens naturais do rio"><AssetBatch placements={placements}/></group>;
}
