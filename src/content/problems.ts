import type {Category,Problem,Vec3} from '../game/types';
import {situations} from './situations';
import {balance} from './balance';
import {situationVisuals} from '../config/situationVisuals';
import {situationAnchors,worldPoint} from '../config/referenceMap';
import {trafficFocus} from '../config/trafficSituation';
export const categories:Record<Category,{label:string;icon:string;color:string;shape:string}>={
 POLLUTION:{label:'Poluição',icon:'♻',color:'#61734a',shape:'square'},
 SECURITY:{label:'Segurança',icon:'⚠',color:'#577988',shape:'shield'},
 NATURE:{label:'Natureza',icon:'♧',color:'#3b7657',shape:'round'},
 HEALTH:{label:'Saúde',icon:'✚',color:'#b56770',shape:'round'},
 ACCESSIBILITY:{label:'Acessibilidade',icon:'♿',color:'#c66e3e',shape:'rounded'}
};
const steepViews:Record<string,{focus?:Vec3;zoom:number}>={pollution_02:{focus:trafficFocus,zoom:42},security_01:{zoom:48}};
export const problems:Problem[]=situations.map(s=>{
 const anchor=situationAnchors[s.id],position=worldPoint(...anchor.point,anchor.y??0);
 const [x,y,z]=position,v=situationVisuals[s.id];
 // Two scenes are covered from the usual low angle: the avenue jam by a
 // six-storey tower, the animals on the road by the forest canopy. Look down
 // more steeply there (the jam centred on its cars, not on the anchor).
 const steep=steepViews[s.id],[fx,fy,fz]=steep?.focus??position;
 return {...s,worldPosition:position,characterId:'companion',regionId:s.id,initialState:s.unlockAfter===0?'AVAILABLE':'HIDDEN',markerPosition:[x,y+(s.id==='health_02'?5.5:2),z],
 camera:steep?{position:[fx+11,fy+30,fz+15],target:[fx,fy+.3,fz],zoom:steep.zoom,duration:1.4}:{position:[x+11,y+10,z+15],target:[x,y+.3,z],zoom:65,duration:1.4},
 visualStates:{initialAssets:v.initial.assets,temporaryAssets:v.temporary.assets,solvedAssets:v.solved.assets},
 unlockConditions:[],nextProblems:situations.filter(n=>n.unlockAfter===s.unlockAfter+2).map(n=>n.id),rewards:balance.completionReward};
});
export const problemById=Object.fromEntries(problems.map(p=>[p.id,p]));
