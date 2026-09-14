import type {Placement} from '../game/types';
// Parallel stacks reserve the factory rear apron, crane feet and a truck aisle.
export const harborContainers:Placement[]=[];
const rows=[{z:-52.4,x:[.4,3,5.6,8.2,10.8,13.4,16,18.6]},{z:-54.2,x:[.4,3,5.6,8.2,10.8,13.4,16,18.6]},{z:-44.2,x:[29.5,32.1,34.7]}];
for(const [r,row] of rows.entries())for(const [i,x] of row.x.entries()){
 const levels=(i+r)%3===0?3:2;
 for(let level=0;level<levels;level++)harborContainers.push({asset:(i+r+level)%2?'prop.container.red':'prop.container.blue',position:[x,.10+level*.924,row.z],scale:[.82,.82,.82],rotation:[0,Math.PI/2,0]});
}
