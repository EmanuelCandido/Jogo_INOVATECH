import {box} from './infrastructure';
import type {Placement} from '../game/types';
import {inPublicSpace} from './publicSpaces';
export const planting:Placement[]=[];
// Separate beds, shaded seats and a pergola give each part of the park a purpose.
for(const [x,z,w,d] of [[4,-5.3,3.2,1.25],[13,-6,3.8,1.25],[13,-1.2,2.8,.9],[5.5,-.2,2.6,.55],[12,10.9,3.8,.8]]){
 planting.push(box('ground.wood',[x,.09,z],[w,.18,d]));
 for(let p=-w/2+.25;p<w/2;p+=.47)planting.push({asset:'prop.shrub',position:[x+p,.16,z],scale:[.5,.65,.7]});
}
for(const [x,z] of [[2,-7],[6.4,-7],[11,-4.8],[15.5,-4.5],[3.5,-2],[14,-2],[15,10.8],[8,10.8],[2,7.4],[16.5,9.4]]){
 planting.push({asset:'tree.default',position:[x,.02,z],scale:[.94,1.06,.94]});
}
for(const x of [1.8,18.4])for(const z of [-8.5,-5.8,-3.1,-.4,2.3,5,10.7]){
 planting.push({asset:'prop.shrub',position:[x,.03,z],scale:[.72,.8,.72]});
 if(z<-2||z>9)planting.push({asset:'tree.default',position:[x+(x<10?.15:-.15),.03,z+.8],scale:[.76,.95,.76]});
}
for(const [i,[x,z]] of [[3,-8.4],[5,-8.5],[7.4,-8.2],[3.2,-6.5],[6.1,-5.8],[7.3,-2.9],[2,-.5],[2,2.1],[2,4.7],[7.4,-.4],[10.6,-1.8],[12,-.8],[15.4,.2],[16.3,2.2],[16.4,5.2],[16.5,8.6],[13.4,9.2],[11.3,10.6],[7.2,11.4],[6.8,9.3],[6.8,7.9]].entries()){
 planting.push({asset:i%4===0?'tree.birch':'tree.oak',position:[x,.03,z],scale:[.57,.63+(i%3)*.07,.57],rotation:[0,i*1.7,0]});
 planting.push({asset:'prop.shrub',position:[x+.35,.03,z+.3],scale:[.4,.45,.4]});
}
planting.push({asset:'prop.pergola',position:[13.35,.02,-7.45]});
planting.push(box('ground.sidewalk',[13.35,.045,-9.4],[1.0,.09,.78]));
// Reserve the full seat/access envelope before planting, including explicit trees.
for(let i=planting.length-1;i>=0;i--){const p=planting[i];if((p.asset.startsWith('tree.')||p.asset==='prop.shrub')&&inPublicSpace(p.position[0],p.position[2],.42))planting.splice(i,1);}
export const paths=[[[1.25,-8],[4,-6.8],[7,-4.4],[9.1,-2]],[[1.25,4],[1.7,.4],[3,-2.8],[6,-4.4],[9.1,-4.4],[13,-3.6],[17.6,-1]],[[9.1,9.5],[12,10],[15,9.7],[17.6,8.6]]];

