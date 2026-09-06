import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {useProgress} from '@react-three/drei';
import {graphicsPixelRatio,lowerGraphics} from '../../config/graphics';
import {deviceGraphics,useGraphicsRuntime,useResolvedGraphics} from '../../stores/graphicsStore';
import {useGame} from '../../stores/gameStore';

/** Short, real rendering samples. Idle time in demand mode is never counted as a slow frame. */
export function GraphicsRuntime({ready}:{ready:boolean}){
 const {gl,size,invalidate}=useThree(),q=useResolvedGraphics();
 const settings=useGame(s=>s.progress.settings),probe=useGraphicsRuntime(s=>s.probe),loading=useProgress(s=>s.active);
 const sample=useRef({last:0,warmup:5,values:[] as number[],done:true});
 useEffect(()=>{
  const context=gl.getContext(),extension=context.getExtension('WEBGL_debug_renderer_info');
  const renderer=extension?String(context.getParameter(extension.UNMASKED_RENDERER_WEBGL)):'';
  const software=/swiftshader|llvmpipe|software|basic render/i.test(renderer);
  useGraphicsRuntime.setState({software,automatic:deviceGraphics(software)});
 },[gl]);
 useEffect(()=>{
  const dpr=graphicsPixelRatio(size.width,size.height,devicePixelRatio,q,q.renderScale,gl.capabilities.maxTextureSize);
  // Canvas owns DPR through its prop. Imperatively setting it here as well
  // races with Canvas configuration when a suspended scene finishes loading.
  useGraphicsRuntime.setState({pixelRatio:dpr});
 },[gl,size.width,size.height,q.pixelRatio,q.maxPixels,q.renderScale]);
 useEffect(()=>{
  gl.domElement.dataset.graphicsTier=q.tier;
  gl.domElement.dataset.graphicsShadows=String(q.shadowSize);
  useGraphicsRuntime.setState({actualShadowSize:q.shadowSize});
  sample.current={last:0,warmup:5,values:[],done:!ready||loading||!(settings.quality==='AUTO'||settings.showPerformance)};
  useGraphicsRuntime.setState({measuring:!sample.current.done});invalidate();
 },[gl,q.tier,q.shadowSize,q.renderScale,settings.quality,settings.showPerformance,ready,loading,probe,invalidate]);
 useEffect(()=>{
  const wake=()=>{sample.current.last=0;if(!document.hidden)invalidate();};
  document.addEventListener('visibilitychange',wake);return()=>document.removeEventListener('visibilitychange',wake);
 },[invalidate]);
 useEffect(()=>{
  if(settings.quality!=='AUTO'&&!settings.showPerformance)return;
  let timer:ReturnType<typeof setTimeout>|undefined,lastCheck=performance.now();
  const schedule=()=>{
   clearTimeout(timer);
   timer=setTimeout(()=>{
    if(document.hidden||!sample.current.done||performance.now()-lastCheck<12000)return;
    lastCheck=performance.now();useGraphicsRuntime.setState(s=>({probe:s.probe+1}));
   },1000);
  };
  const el=gl.domElement;
  el.addEventListener('pointerup',schedule);el.addEventListener('wheel',schedule,{passive:true});el.addEventListener('keyup',schedule);
  return()=>{clearTimeout(timer);el.removeEventListener('pointerup',schedule);el.removeEventListener('wheel',schedule);el.removeEventListener('keyup',schedule);};
 },[gl,settings.quality,settings.showPerformance]);
 useFrame(()=>{
  if(document.hidden)return;
  const s=sample.current;
  if(s.done)return;
  const now=performance.now();
  if(s.last){if(s.warmup>0)s.warmup--;else s.values.push(now-s.last);}
  s.last=now;
  const elapsed=s.values.reduce((a,b)=>a+b,0);
  if(s.values.length<24&&(s.values.length<8||elapsed<1500)){invalidate();return;}
  const sorted=[...s.values].sort((a,b)=>a-b),ms=sorted[Math.floor(sorted.length/2)];
  s.done=true;
  const next=settings.quality==='AUTO'?lowerGraphics(q.tier,ms):q.tier;
  useGraphicsRuntime.setState({measuring:false,frameMs:ms,fps:Math.round(1000/ms),drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,
   ...(settings.quality==='AUTO'?{automatic:next,reason:next!==q.tier?'Qualidade reduzida para melhorar a fluidez':'Perfil ajustado à fluidez medida'}:{reason:'Perfil escolhido por você'})});
 });
 return null;
}
