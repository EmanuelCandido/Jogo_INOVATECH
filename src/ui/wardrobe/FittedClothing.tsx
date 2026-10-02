import type {Accessory} from '../../game/wardrobe';
import type {CharacterPose} from '../../game/types';
import {publicAsset} from '../../assets/publicAsset';
import {closedVestOutline, wornVestOutline, torsoTransform, triangleTransform, type Triangle, type Point} from './fitting';

const wornSource=publicAsset('/assets/accessories/fitted/repair-worn.webp');

/** The repair fabric was illustrated ON the original Impactus. Other fabrics
 * follow that same collar / armhole / waist surface through a small 2D mesh.
 * Product images never cover the face or arms, and empty garment interiors are
 * discarded. A pose transform is shared by cloth, seam and contact shading.
 */
export function FittedClothing({item,pose,uid,source,front}:{item:Accessory;pose:CharacterPose;uid:string;source:string;front:string}){
  const repair=item.collection==='repair'||!item.collection;
  const outline=repair?wornVestOutline:closedVestOutline;
  const clothId=uid+'-cloth-fit',frontId=uid+'-cloth-front',footprintId=uid+'-cloth-footprint';
  return <g data-slot="jacket" className="wearable-reveal" data-fitting="illustrated-on-body">
    <defs>
      <clipPath id={clothId}><path d={outline}/></clipPath>
      <clipPath id={frontId}><path d={front}/></clipPath>
      <clipPath id={footprintId}><path d={outline} transform={torsoTransform(pose)}/></clipPath>
      <filter id={uid+'-cloth-contact'} x="-.05" y="-.05" width="1.1" height="1.15"><feDropShadow dx=".7" dy="2" stdDeviation="1.4" floodColor="#101911" floodOpacity=".5"/></filter>
      {!item.collection&&<filter id={uid+'-legacy-fabric'} colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>{['R','G','B'].map((channel,i)=>{
        const Component=({'R':'feFuncR','G':'feFuncG','B':'feFuncB'} as const)[channel as 'R'|'G'|'B'];
        const dark=parseInt(item.color.slice(1+i*2,3+i*2),16)/255,light=parseInt(item.light.slice(1+i*2,3+i*2),16)/255;
        return <Component key={channel} type="table" tableValues={`0 ${dark*.75} ${dark} ${light} 1`}/>;
      })}</feComponentTransfer></filter>}
      <linearGradient id={uid+'-cloth-volume'}><stop stopColor="#0a120c" stopOpacity=".38"/><stop offset=".19" stopColor="#fff2cf" stopOpacity=".12"/><stop offset=".48" stopColor="#fff" stopOpacity="0"/><stop offset=".84" stopColor="#111b12" stopOpacity=".08"/><stop offset="1" stopColor="#0b150d" stopOpacity=".4"/></linearGradient>
    </defs>
    <g transform={torsoTransform(pose)} filter={`url(#${uid}-cloth-contact)`}>
      <g clipPath={`url(#${clothId})`}>
        {repair?<image data-part="torso" href={wornSource} width="768" height="768" filter={!item.collection?`url(#${uid}-legacy-fabric)`:undefined}/>:<FabricMesh item={item} uid={uid}/>}
        {!repair&&<path d={outline} fill={`url(#${uid}-cloth-volume)`}/>}
      </g>
      {!repair&&<path d="M280 438Q342 454 409 430M271 350Q268 375 283 399M411 340Q405 351 421 369" fill="none" stroke={item.trim} strokeWidth="1.5" opacity=".65"/>}
    </g>
    {/* Restore only the hands crossing the garment, not a generic head oval
        that erased the fitted collar and left the clothing floating lower. */}
    <g clipPath={`url(#${footprintId})`}><image href={source} width="768" height="768" clipPath={`url(#${frontId})`}/></g>
  </g>;
}

function FabricMesh({item,uid}:{item:Accessory;uid:string}){
  const garden=item.collection==='garden';
  const photoHeight=garden?602:623;
  const rows:readonly (readonly [Point,Point])[]=garden?
    [[[147,40],[498,46]],[[149,254],[586,252]],[[96,549],[614,546]]]:
    [[[169,66],[527,82]],[[131,300],[600,299]],[[113,590],[620,582]]];
  const fitted:readonly (readonly [Point,Point])[]=[[[277,290],[419,294]],[[263,365],[427,365]],[[277,447],[414,435]]];
  const triangles:{from:Triangle;to:Triangle}[]=[];
  for(let i=0;i<2;i++){
    triangles.push({from:[rows[i][0],rows[i][1],rows[i+1][0]],to:[fitted[i][0],fitted[i][1],fitted[i+1][0]]});
    triangles.push({from:[rows[i][1],rows[i+1][1],rows[i+1][0]],to:[fitted[i][1],fitted[i+1][1],fitted[i+1][0]]});
  }
  return <g data-part="torso" data-fabric={item.art}>
    {triangles.map(({from,to},i)=><g key={i}>
      <defs><clipPath id={`${uid}-fabric-${i}`}><path d={'M'+to.map(p=>p.join(' ')).join('L')+'Z'}/></clipPath></defs>
      <g clipPath={`url(#${uid}-fabric-${i})`}><image href={publicAsset('/assets/accessories/urban/'+item.art+'.webp')} width="640" height={photoHeight} transform={triangleTransform(from,to)}/></g>
    </g>)}
  </g>;
}
