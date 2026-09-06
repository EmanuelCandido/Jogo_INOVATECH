import type {GameSettings,GraphicsTier,Quality} from '../game/types';
export const graphicsTiers:GraphicsTier[]=['MINIMUM','LOW','MEDIUM','HIGH','ULTRA'];
export interface GraphicsProfile {
 label:string; description:string; pixelRatio:number; maxPixels:number; shadowSize:number;
 forestDensity:number; undergrowth:number; flowers:number; traffic:number;
 visitors:number; cityDetail:0|1|2; waterEffects:boolean; smoothGeometry:boolean;
}
export const graphicsPresets:Record<GraphicsTier,GraphicsProfile>={
 MINIMUM:{label:'Muito baixa',description:'Cidade essencial, vegetação reduzida e sem sombras. Prioriza a leveza.',pixelRatio:.8,maxPixels:800000,shadowSize:0,forestDensity:.12,undergrowth:0,flowers:0,traffic:.2,visitors:0,cityDetail:0,waterEffects:false,smoothGeometry:false},
 LOW:{label:'Baixa',description:'Jardins simplificados, menos veículos e resolução econômica.',pixelRatio:1,maxPixels:1400000,shadowSize:0,forestDensity:.27,undergrowth:.2,flowers:0,traffic:.38,visitors:.25,cityDetail:0,waterEffects:false,smoothGeometry:false},
 MEDIUM:{label:'Média',description:'Equilíbrio entre vegetação, movimento urbano e sombras suaves.',pixelRatio:1.25,maxPixels:2600000,shadowSize:1024,forestDensity:.52,undergrowth:.5,flowers:.35,traffic:.65,visitors:.55,cityDetail:0,waterEffects:false,smoothGeometry:false},
 HIGH:{label:'Alta',description:'Cidade mais viva: bicicletas, moradores, jardins completos e água detalhada.',pixelRatio:1.75,maxPixels:4500000,shadowSize:2048,forestDensity:.8,undergrowth:.8,flowers:.75,traffic:.85,visitors:.8,cityDetail:1,waterEffects:true,smoothGeometry:true},
 ULTRA:{label:'Ultra',description:'Toda a vegetação, maior presença urbana, jardins nos telhados e acabamentos extras.',pixelRatio:2,maxPixels:6500000,shadowSize:4096,forestDensity:1,undergrowth:1,flowers:1,traffic:1,visitors:1,cityDetail:2,waterEffects:true,smoothGeometry:true},
};
export const qualityOptions:Quality[]=['AUTO',...graphicsTiers];
export const defaultGraphicsSettings={renderScale:100,shadows:'PRESET',ambientAnimation:true,showPerformance:false} as const;
export function normalizeGraphicsSettings(settings:Partial<GameSettings>):GameSettings{
 return {...defaultGraphicsSettings,quality:'AUTO',reducedMotion:false,...settings,
  renderScale:typeof settings.renderScale==='number'&&Number.isFinite(settings.renderScale)?Math.max(60,Math.min(150,Math.round(settings.renderScale/5)*5)):100,
  shadows:['PRESET','OFF','SOFT','DETAILED'].includes(settings.shadows??'')?settings.shadows!:'PRESET',
  ambientAnimation:typeof settings.ambientAnimation==='boolean'?settings.ambientAnimation:true,
  showPerformance:typeof settings.showPerformance==='boolean'?settings.showPerformance:false};
}
export function resolveGraphics(settings:GameSettings,automatic:GraphicsTier){
 const tier=settings.quality==='AUTO'?automatic:settings.quality,p=graphicsPresets[tier];
 const shadowSize=settings.shadows==='OFF'?0:settings.shadows==='SOFT'?1024:settings.shadows==='DETAILED'?2048:p.shadowSize;
 return {...p,tier,shadowSize,shadows:shadowSize>0,renderScale:settings.renderScale,animate:p.waterEffects&&settings.ambientAnimation&&!settings.reducedMotion};
}
export function recommendGraphics({memory,cores,coarse=false,software=false}:{memory?:number;cores?:number;coarse?:boolean;software?:boolean}):GraphicsTier{
 if(software||(memory!==undefined&&memory<=2)||(cores!==undefined&&cores<=2))return 'MINIMUM';
 if((memory!==undefined&&memory<=4)||(cores!==undefined&&cores<=4))return 'LOW';
 return coarse?'MEDIUM':'HIGH';
}
export function graphicsPixelRatio(width:number,height:number,deviceRatio:number,profile:Pick<GraphicsProfile,'pixelRatio'|'maxPixels'>,scale:number,maxTextureSize=8192){
 const area=Math.max(1,width*height),desired=Math.min(Math.max(1,deviceRatio),profile.pixelRatio)*scale/100;
 return Math.max(Number.EPSILON,Math.min(desired,Math.sqrt(profile.maxPixels/area),maxTextureSize/Math.max(1,width,height)));
}
/** Stable subsets prevent reshuffling on resize or when returning from a mission. */
export function keepDetail(seed:number,density:number){return density>=1||(density>0&&((Math.imul(seed+1,2654435761)>>>0)/4294967296)<density);}
export function lowerGraphics(tier:GraphicsTier,frameMs:number):GraphicsTier{
 if(frameMs<=36)return tier;
 return graphicsTiers[Math.max(0,graphicsTiers.indexOf(tier)-1)];
}
