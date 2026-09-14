import type {Placement} from '../game/types';
import {terrainHeight} from './terrain';

/** Embedded outcrops follow exposed ridges, never the rail approach or river. */
export const mountainRocks:Placement[]=[];
for(let row=0;row<11;row++)for(let col=0;col<22;col++){
 const seed=row*31+col,x=-88+col*1.65+Math.sin(seed*1.7)*.5,z=-39+row*2.05+Math.cos(seed)*.5;
 const y=terrainHeight(x,z);
 const slope=Math.hypot(terrainHeight(x+.4,z)-terrainHeight(x-.4,z),terrainHeight(x,z+.4)-terrainHeight(x,z-.4))/.8;
 if(y<8||slope<.7||seed%3===0)continue;
 mountainRocks.push({asset:'prop.rock',position:[x,y-.52,z],scale:[1.1+seed%4*.22,1.7+seed%3*.38,.9+seed%5*.12],rotation:[.08*Math.sin(seed),seed*.63,.07*Math.cos(seed)]});
}
