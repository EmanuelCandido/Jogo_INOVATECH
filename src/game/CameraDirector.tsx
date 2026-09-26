import {mapBaseZoom,mapFootprint,clampTarget} from './mapNavigation';
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Vector3 } from "three";
import { overview, regions } from "../config/world";
import { problemById } from "../content/problems";
import { useGame } from "../stores/gameStore";
import type { CameraShot } from "./types";
import { useMapNavigation } from "./useMapNavigation";
import {mapFit} from '../config/referenceFrame';
import {introNode} from '../content/dialogues';
import {preparationActivity} from './resourcePreparation';
import {frameProblemShot,flightZoom,problemPreviewDuration} from './problemFraming';
export const CameraDirector = {
  focusCity: (): CameraShot => overview,
  focusProblem: (id: string): CameraShot => problemById[id].camera,
  focusCharacter: (id?: string): CameraShot =>
    id
      ? { ...problemById[id].camera, zoom: 72 }
      : { ...overview, position: [8, 7, 12], target: [1.5, 0.6, 3], zoom: 55 },
  focusRegion: (id: keyof typeof regions): CameraShot => regions[id],
  returnToOverview: (): CameraShot => overview,
};
export function CameraRig({ interactive }: { interactive: boolean }) {
  const { camera, size, invalidate, gl } = useThree();
  const phase = useGame((s) => s.progress.phase);
  const introView=useGame(s=>s.progress.phase==='INTRO'?introNode(s.progress).view:'city');
  const selected = useGame((s) => s.progress.selectedProblem);
  const resultView=phase==='RESULT';
  // Context and question share one shot; results may widen it for the work.
  // Returning and overview share a shot to avoid a second camera flight.
  const shotId=selected && phase!=="RETURNING" ? selected : introView==='city'?'city':'intro_'+introView;
  const reduced = useGame((s) => s.progress.settings.reducedMotion);
  const arrived = useGame((s) => s.cameraArrived);
  const target = useRef(new Vector3(...overview.target));
  const [moving,setMoving]=useState(true);
  const [readyViewport,setReadyViewport]=useState("");
  const viewportKey=`${phase}:${size.width}:${size.height}:${moving}`;
  useEffect(()=>{
    if(!interactive || phase!=="OVERVIEW" || moving)return;
    // Let viewport changes settle before exposing map controls.
    let second=0;
    const first=requestAnimationFrame(()=>{
      second=requestAnimationFrame(()=>setReadyViewport(viewportKey));
    });
    return ()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);};
  },[interactive,phase,moving,viewportKey]);
  const baseZoom=mapBaseZoom(size.width,size.height);
  useMapNavigation(interactive && phase==="OVERVIEW" && !moving && readyViewport===viewportKey,baseZoom,target);
  const animation = useRef<{
    from: Vector3;
    fromTarget: Vector3;
    fromZoom: number;
    shot: CameraShot;
    startedAt: number;
    done: boolean;
    destination: Vector3;
    destinationTarget: Vector3;
  } | null>(null);
  useEffect(() => {
    setMoving(true);
    const intro=shotId.startsWith('intro_'),shift=introView==='west'?[-16,0,8]:[-18,0,-26];
    let shot = shotId==="city" ? CameraDirector.focusCity() : intro?{...overview,position:overview.position.map((v,i)=>v+shift[i]) as [number,number,number],target:overview.target.map((v,i)=>v+shift[i]) as [number,number,number],zoom:overview.zoom*1.22}:CameraDirector.focusProblem(shotId);
    if(shotId==='security_01'){
      // Look over the foreground crowns so the animals' path stays visible.
      const [x,y,z]=shot.target;shot={...shot,position:[x+11,y+30,z+15]};
    }
    if(resultView&&shotId!=='city'&&!intro){
      const wide:Record<string,number>={pollution_01:size.width<1000?24:32,nature_01:32,health_01:40,health_02:28};
      shot={...shot,zoom:wide[shotId]??shot.zoom,duration:.75};
      if(shotId==='health_02')shot={...shot,position:[shot.position[0],shot.position[1]+6,shot.position[2]],target:[shot.target[0],shot.target[1]+6,shot.target[2]]};
    }
    const responsive = shotId==='city'||intro
      ? {...shot,zoom:shot.zoom*mapFit(size.width,size.height)}
      : frameProblemShot(shot,size.width,size.height);
    if(shotId==='city'||intro){
      responsive.zoom=Math.max(responsive.zoom,mapBaseZoom(size.width,size.height));
      const [x,z]=clampTarget(responsive.target[0],responsive.target[2],mapFootprint(responsive.zoom,size.width,size.height));
      const dx=x-responsive.target[0],dz=z-responsive.target[2];
      responsive.target=[x,responsive.target[1],z];
      responsive.position=[responsive.position[0]+dx,responsive.position[1],responsive.position[2]+dz];
    }
    animation.current = {
      from: camera.position.clone(),
      fromTarget: target.current.clone(),
      fromZoom: (camera as OrthographicCamera).zoom,
      shot: responsive,
      startedAt: performance.now(),
      done: false,
      destination: new Vector3(...responsive.position),
      destinationTarget: new Vector3(...responsive.target),
    };
    invalidate();
  }, [camera, shotId, size.width, size.height, reduced, invalidate,introView,resultView]);
  useEffect(() => {
    if (moving || !interactive || phase !== 'FOCUSING') return;
    // Keep the completed shot clear before mounting the dialogue. No frames
    // are requested just to run this timer, and hidden tabs do not consume it.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(() => {
        const progress = useGame.getState().progress;
        if (progress.phase === 'FOCUSING' && progress.selectedProblem === selected) arrived();
      }, problemPreviewDuration);
    };
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', schedule); };
  }, [moving, interactive, phase, selected, arrived, size.width, size.height]);
  useFrame(() => {
    const a = animation.current;
    if (!a || a.done) return;
    preparationActivity(gl.domElement).touch();
    // Demand rendering may pause while models and shaders are prepared. Measure
    // the command's elapsed time directly instead of accumulating frame deltas.
    const elapsed = (performance.now() - a.startedAt) / 1000;
    const t = Math.min(elapsed / (reduced ? 0.12 : a.shot.duration), 1);
    // Ease both speed and acceleration to zero at each end of the flight.
    const smooth = t * t * t * (t * (6 * t - 15) + 10);
    camera.position.copy(a.from).lerp(a.destination, smooth);
    target.current.copy(a.fromTarget).lerp(a.destinationTarget, smooth);
    camera.lookAt(target.current);
    (camera as OrthographicCamera).zoom =
      flightZoom(a.fromZoom, a.shot.zoom, smooth);
    camera.updateProjectionMatrix();
    if (t === 1) {
      a.done = true;
      setMoving(false);
      if (useGame.getState().progress.phase !== 'FOCUSING') arrived();
    } else invalidate();
  });
  return null;
}
