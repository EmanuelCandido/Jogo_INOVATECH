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
  const { camera, size, invalidate } = useThree();
  const phase = useGame((s) => s.progress.phase);
  const introView=useGame(s=>s.progress.phase==='INTRO'?introNode(s.progress).view:'city');
  const selected = useGame((s) => s.progress.selectedProblem);
  // Context/question/result share one shot. Returning and overview also share
  // one shot, so entering the overview must not start a second camera flight.
  const shotId=selected && phase!=="RETURNING" ? selected : introView==='city'?'city':'intro_'+introView;
  const reduced = useGame((s) => s.progress.settings.reducedMotion);
  const arrived = useGame((s) => s.cameraArrived);
  const target = useRef(new Vector3(...overview.target));
  const [moving,setMoving]=useState(true);
  const [readyViewport,setReadyViewport]=useState("");
  const viewportKey=`${phase}:${size.width}:${size.height}:${moving}`;
  useEffect(()=>{
    if(!interactive || phase!=="OVERVIEW" || moving)return;
    // Leaving the dialogue changes the canvas CSS bounds. Let ResizeObserver
    // settle before exposing controls for the new full-map viewport.
    let second=0;
    const first=requestAnimationFrame(()=>{
      second=requestAnimationFrame(()=>setReadyViewport(viewportKey));
    });
    return ()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);};
  },[interactive,phase,moving,viewportKey]);
  const baseZoom=overview.zoom*mapFit(size.width,size.height);
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
    const shot = shotId==="city" ? CameraDirector.focusCity() : intro?{...overview,position:overview.position.map((v,i)=>v+shift[i]) as [number,number,number],target:overview.target.map((v,i)=>v+shift[i]) as [number,number,number],zoom:overview.zoom*1.22}:CameraDirector.focusProblem(shotId);
    const responsive = {
      ...shot,
      zoom:
        shot.zoom *
        (shotId!=="city" && !intro && window.innerWidth <= 650
          ? Math.min(size.width / 500, size.height / 270, 1)
          : shotId==='city'||intro ? mapFit(size.width,size.height) : Math.min(size.width / 1100, size.height / 760, 1.25)),
    };
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
  }, [camera, shotId, size.width, size.height, reduced, invalidate,introView]);
  useFrame(() => {
    const a = animation.current;
    if (!a || a.done) return;
    // Demand rendering may pause while models and shaders are prepared. Measure
    // the command's elapsed time directly instead of accumulating frame deltas.
    const elapsed = (performance.now() - a.startedAt) / 1000;
    const t = Math.min(elapsed / (reduced ? 0.12 : a.shot.duration), 1);
    const smooth = t * t * (3 - 2 * t);
    camera.position.copy(a.from).lerp(a.destination, smooth);
    target.current.copy(a.fromTarget).lerp(a.destinationTarget, smooth);
    camera.lookAt(target.current);
    (camera as OrthographicCamera).zoom =
      a.fromZoom + (a.shot.zoom - a.fromZoom) * smooth;
    camera.updateProjectionMatrix();
    if (t === 1) {
      a.done = true;
      setMoving(false);
      arrived();
    } else invalidate();
  });
  return null;
}
