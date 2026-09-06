import {useMemo} from 'react';
import {create} from 'zustand';
import {recommendGraphics,resolveGraphics} from '../config/graphics';
import {useGame} from './gameStore';
import type {GraphicsTier} from '../game/types';
export function deviceGraphics(software=false){
 const n=typeof navigator==='undefined'?undefined:navigator as Navigator&{deviceMemory?:number};
 return recommendGraphics({memory:n?.deviceMemory,cores:n?.hardwareConcurrency,coarse:typeof matchMedia!=='undefined'&&matchMedia('(pointer: coarse)').matches,software});
}
interface GraphicsRuntimeState {
 automatic:GraphicsTier; software:boolean; probe:number; measuring:boolean; fps:number|null; frameMs:number|null;
 drawCalls:number; triangles:number; pixelRatio:number; reason:string; actualShadowSize:number;
}
export const useGraphicsRuntime=create<GraphicsRuntimeState>(()=>({automatic:deviceGraphics(),software:false,probe:0,measuring:false,fps:null,frameMs:null,drawCalls:0,triangles:0,pixelRatio:1,actualShadowSize:0,reason:'Perfil inicial do dispositivo'}));
export function useResolvedGraphics(){
 const settings=useGame(s=>s.progress.settings),automatic=useGraphicsRuntime(s=>s.automatic);
 return useMemo(()=>resolveGraphics(settings,automatic),[settings,automatic]);
}
export function recheckGraphics(){const s=useGraphicsRuntime.getState();useGraphicsRuntime.setState({automatic:deviceGraphics(s.software),probe:s.probe+1,fps:null,frameMs:null,reason:'Reavaliando a fluidez'});}
