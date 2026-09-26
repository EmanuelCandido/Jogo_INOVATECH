import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Material,MeshBasicMaterial,MeshLambertMaterial,MeshStandardMaterial,type Mesh,type Object3D} from 'three';
import {useGraphicsRuntime} from '../../stores/graphicsStore';
import {useShaderGate} from './ShaderGate';
import {ambientInvalidate,staticFrameEnabled} from '../../game/staticFrame';

/** Opt-in phone diagnostic (?diagnostico=1). One tap measures the current view
 * with parts of the frame switched off in turn, so a single screenshot shows
 * where a weak GPU spends its time. Nothing is loaded in ordinary games. */
interface Variant {id:string;label:string;apply:()=>()=>void;ambient?:boolean}
interface Row {label:string;fps:number;medianMs:number;worstMs:number;calls:number;triangles:number}
const foliage=/^eco\.(leaf|leaflight|oakleaf|mapleleaf|firleaf|flower|petal|bloomshade)$/;
const settleMs=900,sampleMs=2600;

declare global {interface Window {ecoLongTasks?:{start:number;duration:number}[]}}

function materials(o:Object3D):Material[]{const m=(o as Mesh).material;return m?Array.isArray(m)?m:[m]:[];}
function hideWhere(root:Object3D,test:(o:Object3D)=>boolean){
 const hidden:Object3D[]=[];
 root.traverse(o=>{if(o.visible&&(o as Mesh).isMesh&&test(o)){o.visible=false;hidden.push(o);}});
 return()=>hidden.forEach(o=>{o.visible=true;});
}
/** Swap every standard material for a replacement (cached per material). */
function swapMaterials(root:Object3D,make:(m:MeshStandardMaterial)=>Material|null){
 const made=new Map<Material,Material|null>(),restore:Array<()=>void>=[];
 const swap=(m:Material)=>{
  if(!(m instanceof MeshStandardMaterial))return m;
  if(!made.has(m))made.set(m,make(m));
  return made.get(m)??m;
 };
 root.traverse(o=>{
  const mesh=o as Mesh;if(!mesh.isMesh)return;
  const before=mesh.material;
  mesh.material=Array.isArray(before)?before.map(swap):swap(before);
  restore.push(()=>{mesh.material=before;});
 });
 return()=>{restore.forEach(fn=>fn());made.forEach(m=>m?.dispose());};
}
const custom=(m:Material)=>m.onBeforeCompile!==Material.prototype.onBeforeCompile;
/** Same PBR light, without the procedural finishes (noise, leaves, water). */
function plainStandard(m:MeshStandardMaterial){
 if(!custom(m))return null;
 const c=new MeshStandardMaterial();c.copy(m);
 c.onBeforeCompile=Material.prototype.onBeforeCompile;c.customProgramCacheKey=Material.prototype.customProgramCacheKey;
 return c;
}
/** Lambert light without finishes: the cheapest lit shading three offers. */
function lambert(m:MeshStandardMaterial){
 return new MeshLambertMaterial({color:m.color,map:m.map,vertexColors:m.vertexColors,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,depthWrite:m.depthWrite,emissive:m.emissive,emissiveIntensity:m.emissiveIntensity});
}
const isWater=(m:Material)=>m.customProgramCacheKey().startsWith('water-');

export default function Diagnostic(){
 const {gl,scene,setDpr,invalidate}=useThree();
 const run=useRef<{variant:number;phase:'settle'|'sample';since:number;frames:number[];last:number;rows:Row[];undo:()=>void}|null>(null);
 const show=useRef<(rows:Row[],status:string)=>void>(()=>{});
 const variants=useRef<Variant[]>([]);
 variants.current=[
  {id:'normal',label:'Normal (quadro completo)',apply:()=>()=>{}},
  ...(staticFrameEnabled?[{id:'still',label:'Parada (só a água)',apply:()=>()=>{},ambient:true}]:[]),
  {id:'res',label:'Metade da resolução',apply:()=>{const base=useGraphicsRuntime.getState().pixelRatio;setDpr(base*.5);return()=>setDpr(base);}},
  {id:'basic',label:'Cores lisas (sem luz)',apply:()=>{const m=new MeshBasicMaterial({color:'#9aa89a'}),before=scene.overrideMaterial;scene.overrideMaterial=m;return()=>{scene.overrideMaterial=before;m.dispose();};}},
  {id:'plain',label:'Luz PBR sem acabamentos',apply:()=>swapMaterials(scene,plainStandard)},
  {id:'lambert',label:'Luz simples sem acabamentos',apply:()=>swapMaterials(scene,lambert)},
  {id:'leaves',label:'Sem folhas',apply:()=>hideWhere(scene,o=>materials(o).some(m=>foliage.test(m.name)))},
  {id:'water',label:'Sem água',apply:()=>hideWhere(scene,o=>materials(o).some(isWater))},
  {id:'models',label:'Sem modelos repetidos',apply:()=>hideWhere(scene,o=>'isInstancedMesh' in o||'isBatchedMesh' in o)},
  {id:'empty',label:'Nada desenhado',apply:()=>hideWhere(scene,()=>true)},
 ];

 useEffect(()=>{
  const root=document.createElement('div');
  root.style.cssText='position:fixed;z-index:2000;left:8px;right:8px;top:max(8px,env(safe-area-inset-top));font:12px/1.35 system-ui,sans-serif;color:#fff;pointer-events:none';
  document.body.append(root);
  let ready=0;
  const loading=document.getElementById('game-loading');
  const mark=()=>{if(!ready&&loading?.dataset.state==='ready')ready=performance.now();};
  const observer=new MutationObserver(mark);if(loading)observer.observe(loading,{attributes:true,attributeFilter:['data-state']});mark();
  const render=(rows:Row[],status:string)=>{
   const context=gl.getContext(),info=context.getExtension('WEBGL_debug_renderer_info');
   const gpu=String(info?context.getParameter(info.UNMASKED_RENDERER_WEBGL):context.getParameter(context.RENDERER));
   const tasks=window.ecoLongTasks??[],opening=ready||performance.now();
   const blocked=tasks.filter(t=>t.start<opening),longest=blocked.reduce((m,t)=>Math.max(m,t.duration),0),total=blocked.reduce((s,t)=>s+t.duration,0);
   root.innerHTML='';
   const box=document.createElement('div');box.style.cssText='background:#1d1330e6;border-radius:10px;padding:8px 10px;pointer-events:auto;max-width:520px;margin:0 auto';
   const head=document.createElement('div');
   const gate=useShaderGate.getState(),programs=gl.info.programs?.length??0;
   head.textContent=`${gpu} · ${gl.domElement.width}×${gl.domElement.height} · sombras ${gl.shadowMap.enabled?'ligadas':'desligadas'} · abertura ${(opening/1000).toFixed(1)} s · travadas ${(total/1000).toFixed(1)} s (maior ${(longest/1000).toFixed(1)} s) · ${programs} programas · compilação paralela ${gl.extensions.has('KHR_parallel_shader_compile')?`sim (${((gate.compileMs??0)/1000).toFixed(1)} s)`:'não'}`;
   box.append(head);
   if(rows.length){
    const table=document.createElement('table');table.style.cssText='width:100%;border-collapse:collapse;margin-top:6px;font-variant-numeric:tabular-nums';
    table.innerHTML='<tr><th style="text-align:left">Teste</th><th>FPS</th><th>ms</th><th>pior</th><th>chamadas</th><th>triângulos</th></tr>'+rows.map(r=>`<tr><td>${r.label}</td><td style="text-align:center">${r.fps.toFixed(1)}</td><td style="text-align:center">${r.medianMs.toFixed(0)}</td><td style="text-align:center">${r.worstMs.toFixed(0)}</td><td style="text-align:center">${r.calls}</td><td style="text-align:center">${(r.triangles/1000).toFixed(0)} mil</td></tr>`).join('');
    box.append(table);
   }
   const line=document.createElement('div');line.style.cssText='margin-top:6px;display:flex;gap:8px;align-items:center';
   const text=document.createElement('span');text.textContent=status;text.style.flex='1';line.append(text);
   if(!run.current){
    const button=document.createElement('button');button.type='button';button.textContent=rows.length?'Medir de novo':'Medir esta vista';
    button.style.cssText='font:600 13px system-ui,sans-serif;padding:8px 12px;border-radius:8px;border:0;background:#8d4dff;color:#fff';
    button.onclick=()=>{run.current={variant:0,phase:'settle',since:performance.now(),frames:[],last:0,rows:[],undo:variants.current[0].apply()};render([],'Medindo… não toque na tela.');invalidate();};
    line.append(button);
   }
   box.append(line);root.append(box);
  };
  show.current=render;
  render([],'Deixe a cidade parada na vista que quer medir e toque no botão.');
  return()=>{observer.disconnect();run.current?.undo();root.remove();};
 },[gl,scene,invalidate]);

 useFrame(()=>{
  const r=run.current;if(!r)return;
  // "Parada" requests frames like the water animation does, reusing the city.
  if(variants.current[r.variant].ambient)ambientInvalidate(invalidate);else invalidate();
  const now=performance.now();
  if(r.phase==='settle'){if(now-r.since>=settleMs){r.phase='sample';r.since=now;r.frames=[];r.last=now;}return;}
  r.frames.push(now-r.last);r.last=now;
  if(now-r.since<sampleMs)return;
  const sorted=[...r.frames].sort((a,b)=>a-b),v=variants.current[r.variant];
  const {calls,triangles}=gl.info.render;
  r.rows.push({label:v.label,fps:r.frames.length*1000/(now-r.since),medianMs:sorted[sorted.length>>1]??0,worstMs:sorted[sorted.length-1]??0,calls,triangles});
  r.undo();
  if(++r.variant<variants.current.length){
   r.undo=variants.current[r.variant].apply();r.phase='settle';r.since=now;
   show.current(r.rows,`Medindo ${r.variant+1} de ${variants.current.length}… não toque na tela.`);
  }else{
   const rows=r.rows;run.current=null;
   show.current(rows,'Pronto. Tire um print desta tela.');
  }
 },-100);
 return null;
}
