import {dumpDriveway,mapRoads,roadHeightAt} from './referenceMap';
import {sampleLine,type Point} from './spatial';
import {industrialYieldGeometry} from './industrialSite';

// The outbound lane yields before entering the shared turning apron.
// Road traffic keeps priority; this is a static scene, not a traffic signal.
const frame=sampleLine(dumpDriveway.points,9.4);
const heading:Point=[-frame.tangent[0],-frame.tangent[1]];
const right:Point=[heading[1],-heading[0]];
const centre:Point=[frame.point[0]+right[0]*.7,frame.point[1]+right[1]*.7];
const point=(forward:number,side:number):Point=>[centre[0]+heading[0]*forward+right[0]*side,centre[1]+heading[1]*forward+right[1]*side];
export const dumpExitPriority={
 yielding:'acesso-lixao',priority:'acesso-carga',
 triangle:[point(-.45,0),point(.4,-.4),point(.4,.4),point(-.45,0)],
 line:[[-.6,-.28],[-.16,.16],[.28,.6]].map(([a,b])=>[point(1,a),point(1,b)]),
 width:.075,
};

// At the industrial gate, the bridge and the yard form the through route.
// The lateral freight loop yields before joining that route in either direction.
const freight=mapRoads.find(r=>r.id==='acesso-carga')!;
export const industrialGatePriority={
 ...industrialYieldGeometry(freight),
 height:(point:Point)=>roadHeightAt(freight,point)+.061,
};
