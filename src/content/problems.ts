import type {Category,Problem} from '../game/types';
import {situations} from './situations';
import {balance} from './balance';
import {situationVisuals} from '../config/situationVisuals';
import {riverCenter} from '../config/riverProfile';
export const categories:Record<Category,{label:string;icon:string;color:string;shape:string}>={
 POLLUTION:{label:'Poluição',icon:'♻',color:'#61734a',shape:'square'},
 SECURITY:{label:'Segurança',icon:'⚠',color:'#577988',shape:'shield'},
 NATURE:{label:'Natureza',icon:'♧',color:'#3b7657',shape:'round'},
 HEALTH:{label:'Saúde',icon:'✚',color:'#b56770',shape:'round'},
 ACCESSIBILITY:{label:'Acessibilidade',icon:'♿',color:'#c66e3e',shape:'rounded'}
};
export const problems:Problem[]=situations.map(s=>{
 const position:[number,number,number]=s.id==='health_01'?[-15,0,riverCenter(-15)]:s.worldPosition;
 const [x,y,z]=position,v=situationVisuals[s.id];
 return {...s,worldPosition:position,characterId:'companion',regionId:s.id,initialState:s.unlockAfter===0?'AVAILABLE':'HIDDEN',markerPosition:[x,y+(s.id==='health_02'?5.5:2),z],
 camera:{position:[x+11,10,z+15],target:[x,.3,z],zoom:s.id==='pollution_02'?48:65,duration:1.4},
 visualStates:{initialAssets:v.initial.assets,temporaryAssets:v.temporary.assets,solvedAssets:v.solved.assets},
 unlockConditions:[],nextProblems:situations.filter(n=>n.unlockAfter===s.unlockAfter+2).map(n=>n.id),rewards:balance.completionReward};
});
export const problemById=Object.fromEntries(problems.map(p=>[p.id,p]));
